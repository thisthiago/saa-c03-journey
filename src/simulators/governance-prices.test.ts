import { describe, expect, it } from 'vitest'
import { GOVERNANCE_PRICES, governancePrices, GOV_PRICE_DATE } from './governance-prices'

describe('tabela de preços de monitoramento e governança', () => {
  it('tem as duas Regiões e a data da tabela', () => {
    expect(Object.keys(GOVERNANCE_PRICES.regions).sort()).toEqual(['sa-east-1', 'us-east-1'])
    expect(GOV_PRICE_DATE).toMatch(/^\d{2}\/\d{2}\/\d{4}$/)
    expect(() => governancePrices('eu-west-1')).toThrow()
  })

  it('todo preço é um número positivo', () => {
    const walk = (v: unknown, path: string): string[] => {
      if (typeof v === 'number') return v > 0 ? [] : [path]
      if (v && typeof v === 'object') return Object.entries(v).flatMap(([k, x]) => (k === 'sourceUrls' || k === 'offers' ? [] : walk(x, `${path}.${k}`)))
      return []
    }
    for (const [code, r] of Object.entries(GOVERNANCE_PRICES.regions)) {
      expect(walk({ cloudwatch: r.cloudwatch, cloudtrail: r.cloudtrail, config: r.config }, code)).toEqual([])
    }
  })

  it('segue as relações da tabela de preços: alta resolução, composto e armazenamento', () => {
    for (const r of Object.values(GOVERNANCE_PRICES.regions)) {
      expect(r.cloudwatch.highResAlarmMonth).toBeGreaterThan(r.cloudwatch.standardAlarmMonth)
      expect(r.cloudwatch.compositeAlarmMonth).toBeGreaterThan(r.cloudwatch.standardAlarmMonth)
      expect(r.cloudwatch.logIngestInfrequentGB).toBeLessThan(r.cloudwatch.logIngestGB)
      expect(r.config.configurationItemDaily).toBeGreaterThan(r.config.configurationItem)
    }
  })
})
