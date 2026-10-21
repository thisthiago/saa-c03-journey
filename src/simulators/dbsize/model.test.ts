import { describe, expect, it } from 'vitest'
import { databasePrices } from '../database-prices'
import { cheapestDb, dbGaps, dbMonthly, dbPerformance, validateDb, type DbNeed } from './model'

const need = (part: Partial<DbNeed>): DbNeed => ({ minVcpu: 2, minMemoryGiB: 1, minGiB: 20, iops: 1000, throughput: 50, ...part })

describe('dimensionamento do RDS', () => {
  it('gp3 abaixo de 400 GiB entrega 3.000 IOPS fixos; a partir de 400 GiB, 12.000', () => {
    expect(dbPerformance({ cls: 'db.m7g.large', deployment: 'single-az', storage: 'gp3', sizeGiB: 100 })).toEqual({ iops: 3000, throughput: 125 })
    expect(dbPerformance({ cls: 'db.m7g.large', deployment: 'single-az', storage: 'gp3', sizeGiB: 400 })).toEqual({ iops: 12000, throughput: 500 })
  })

  it('recusa IOPS provisionados no gp3 abaixo de 400 GiB e io2 com mais de 1.000 IOPS por GiB', () => {
    expect(validateDb({ cls: 'db.m7g.large', deployment: 'single-az', storage: 'gp3', sizeGiB: 200, iops: 6000 })).not.toEqual([])
    expect(validateDb({ cls: 'db.m7g.large', deployment: 'single-az', storage: 'io2', sizeGiB: 100, iops: 120000 })).not.toEqual([])
    expect(validateDb({ cls: 'db.m7g.large', deployment: 'single-az', storage: 'io2', sizeGiB: 100, iops: 80000 })).toEqual([])
  })

  it('Multi-AZ dobra a instância e o armazenamento', () => {
    const single = dbMonthly({ cls: 'db.r7g.large', deployment: 'single-az', storage: 'gp3', sizeGiB: 100 })
    const multi = dbMonthly({ cls: 'db.r7g.large', deployment: 'multi-az', storage: 'gp3', sizeGiB: 100 })
    expect(multi.total / single.total).toBeCloseTo(2, 1)
  })

  it('burstable não serve para CPU alta o tempo todo', () => {
    const n = need({ sustainedCpu: true })
    expect(dbGaps({ cls: 'db.t4g.medium', deployment: 'single-az', storage: 'gp3', sizeGiB: 20 }, n)).toHaveLength(1)
    expect(cheapestDb(n).cls).not.toMatch(/^db\.t/)
  })

  it('a configuração mais barata usa a classe com memória suficiente e o armazenamento mais barato que entrega as IOPS', () => {
    const best = cheapestDb(need({ minMemoryGiB: 12, minGiB: 200, iops: 9000, throughput: 200, highAvailability: true }))
    expect(best.deployment).toBe('multi-az')
    expect(databasePrices().rds.instances[best.cls].memoryGiB).toBeGreaterThanOrEqual(12)
    expect(dbPerformance(best).iops).toBeGreaterThanOrEqual(9000)
  })
})
