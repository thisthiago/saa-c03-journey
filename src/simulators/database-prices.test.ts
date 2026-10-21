import { describe, expect, it } from 'vitest'
import { AURORA_CLASSES, DATABASE_PRICES, databasePrices, DB_PRICE_DATE, RDS_CLASSES } from './database-prices'

describe('tabela de preços de bancos de dados', () => {
  it('tem as duas Regiões, com as mesmas classes', () => {
    expect(Object.keys(DATABASE_PRICES.regions).sort()).toEqual(['sa-east-1', 'us-east-1'])
    expect(Object.keys(databasePrices('sa-east-1').rds.instances).sort()).toEqual([...RDS_CLASSES].sort())
    expect(Object.keys(databasePrices('sa-east-1').aurora.instances).sort()).toEqual([...AURORA_CLASSES].sort())
    expect(DB_PRICE_DATE).toMatch(/^\d{2}\/\d{2}\/\d{4}$/)
  })

  it('todo preço é um número positivo', () => {
    // vCPU e memória são especificações; a E/S do I/O-Optimized é zero por definição.
    const SPECS = new Set(['vcpu', 'memoryGiB'])
    const walk = (v: unknown, path: string): string[] => {
      if (typeof v === 'number') return v > 0 ? [] : [path]
      if (v && typeof v === 'object') return Object.entries(v).flatMap(([k, x]) => (SPECS.has(k) ? [] : walk(x, `${path}.${k}`)))
      return []
    }
    for (const [code, r] of Object.entries(DATABASE_PRICES.regions)) {
      const { ioOptimized, ...aurora } = r.aurora
      expect(walk({ rds: r.rds, aurora, dynamodb: r.dynamodb, elasticache: r.elasticache, redshift: r.redshift }, code)).toEqual([])
      expect(ioOptimized.ioPerMillion).toBe(0)
    }
  })

  it('Multi-AZ custa o dobro da instância Single-AZ, e o I/O-Optimized cobra mais pela instância', () => {
    for (const r of Object.values(DATABASE_PRICES.regions)) {
      for (const [cls, p] of Object.entries(r.rds.instances)) expect(p.multiAzHour / p.singleAzHour, cls).toBeCloseTo(2, 1)
      for (const [cls, p] of Object.entries(r.aurora.instances)) expect(p.ioOptimizedHour, cls).toBeGreaterThan(p.standardHour)
    }
  })
})
