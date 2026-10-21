import { describe, expect, it } from 'vitest'
import { cheapestTopology, haGaps, haMonthly, readers, simulateFailure, validateTopology, type Topology } from './model'

const top = (part: Partial<Topology>): Topology => ({ deployment: 'single-az', replicas: 0, crossRegionReplica: false, backupDays: 7, proxy: false, ...part })

describe('alta disponibilidade do RDS', () => {
  it('Multi-AZ faz failover automático para o standby síncrono, sem perder dados', () => {
    const r = simulateFailure(top({ deployment: 'multi-az-instance' }), 'az')
    expect(r).toMatchObject({ recovery: 'automatic', loss: 'none', downtime: 120 })
    expect(simulateFailure(top({ deployment: 'multi-az-cluster' }), 'az').downtime).toBe(35)
  })

  it('o standby do Multi-AZ não atende leituras; o cluster Multi-AZ tem dois leitores', () => {
    expect(readers(top({ deployment: 'multi-az-instance' }))).toBe(0)
    expect(readers(top({ deployment: 'multi-az-cluster' }))).toBe(2)
    expect(readers(top({ replicas: 2 }))).toBe(2)
  })

  it('réplica assíncrona perde os últimos segundos e exige promoção manual', () => {
    expect(simulateFailure(top({ replicas: 1 }), 'az')).toMatchObject({ recovery: 'manual', loss: 'seconds' })
  })

  it('apagamento por engano só volta pelo backup: standby e réplicas copiam o apagamento', () => {
    expect(simulateFailure(top({ deployment: 'multi-az-instance', replicas: 2, backupDays: 0, crossRegionReplica: false }), 'delete').loss).toBe('total')
    expect(simulateFailure(top({ backupDays: 1 }), 'delete')).toMatchObject({ recovery: 'manual', loss: 'none' })
  })

  it('perder a Região só é recuperável com uma cópia fora dela', () => {
    expect(simulateFailure(top({ deployment: 'multi-az-cluster' }), 'region').loss).toBe('total')
    expect(simulateFailure(top({ crossRegionReplica: true }), 'region').loss).toBe('seconds')
  })

  it('réplicas exigem backup automático ligado', () => {
    expect(validateTopology(top({ replicas: 1, backupDays: 0 }))).not.toEqual([])
  })

  it('Multi-AZ com standby custa o dobro da Single-AZ; cada réplica custa uma instância', () => {
    const single = haMonthly(top({}), 'db.r7g.large').total
    expect(haMonthly(top({ deployment: 'multi-az-instance' }), 'db.r7g.large').total / single).toBeCloseTo(2, 1)
    expect(haMonthly(top({ replicas: 1 }), 'db.r7g.large').total / single).toBeCloseTo(2, 5)
  })

  it('a topologia mais barata cumpre os requisitos sem sobrar', () => {
    const need = { survive: [{ failure: 'az' as const, maxLoss: 'none' as const, maxDowntime: 300 }], minReaders: 0, pitrDays: 7 }
    const best = cheapestTopology(need, 'db.r7g.large')
    expect(best).toMatchObject({ deployment: 'multi-az-instance', replicas: 0, backupDays: 7, proxy: false })
    expect(haGaps(best, need)).toEqual([])
    const reads = cheapestTopology({ ...need, minReaders: 2 }, 'db.r7g.large')
    expect(reads.deployment).toBe('multi-az-cluster')
  })
})
