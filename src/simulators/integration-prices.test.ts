import { describe, expect, it } from 'vitest'
import { INTEGRATION_PRICES, integrationPrices, INT_PRICE_DATE } from './integration-prices'

describe('tabela de preços de integração', () => {
  it('tem as duas Regiões e a data da tabela', () => {
    expect(Object.keys(INTEGRATION_PRICES.regions).sort()).toEqual(['sa-east-1', 'us-east-1'])
    expect(INT_PRICE_DATE).toMatch(/^\d{2}\/\d{2}\/\d{4}$/)
    expect(() => integrationPrices('eu-west-1')).toThrow()
  })

  it('todo preço é um número positivo', () => {
    const walk = (v: unknown, path: string): string[] => {
      if (typeof v === 'number') return v > 0 ? [] : [path]
      if (v && typeof v === 'object') return Object.entries(v).flatMap(([k, x]) => (k === 'sourceUrls' || k === 'offers' ? [] : walk(x, `${path}.${k}`)))
      return []
    }
    for (const [code, r] of Object.entries(INTEGRATION_PRICES.regions)) {
      const { label: _label, ...prices } = r
      expect(walk(prices, code)).toEqual([])
    }
  })

  it('a requisição FIFO custa mais que a da fila padrão, e a API HTTP menos que a REST', () => {
    for (const r of Object.values(INTEGRATION_PRICES.regions)) {
      expect(r.sqs.fifoRequest).toBeGreaterThan(r.sqs.standardRequest)
      expect(r.apiGateway.httpRequest).toBeLessThan(r.apiGateway.restRequest)
    }
  })
})
