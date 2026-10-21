import { describe, expect, it } from 'vitest'
import { ANALYTICS_PRICES, analyticsPrices, ANA_PRICE_DATE } from './analytics-prices'

describe('tabela de preços de análise de dados', () => {
  it('tem as duas Regiões e a data da tabela', () => {
    expect(Object.keys(ANALYTICS_PRICES.regions).sort()).toEqual(['sa-east-1', 'us-east-1'])
    expect(ANA_PRICE_DATE).toMatch(/^\d{2}\/\d{2}\/\d{4}$/)
    expect(() => analyticsPrices('eu-west-1')).toThrow()
  })

  it('todo preço é um número positivo', () => {
    const walk = (v: unknown, path: string): string[] => {
      if (typeof v === 'number') return v > 0 ? [] : [path]
      if (v && typeof v === 'object') return Object.entries(v).flatMap(([k, x]) => (k === 'sourceUrls' || k === 'offers' ? [] : walk(x, `${path}.${k}`)))
      return []
    }
    for (const [code, r] of Object.entries(ANALYTICS_PRICES.regions)) {
      const { label: _label, ...prices } = r
      expect(walk(prices, code)).toEqual([])
    }
  })

  it('o job Flex custa menos por DPU-hora que o job padrão', () => {
    for (const r of Object.values(ANALYTICS_PRICES.regions)) expect(r.glue.etlFlexDpuHour).toBeLessThan(r.glue.etlDpuHour)
  })
})
