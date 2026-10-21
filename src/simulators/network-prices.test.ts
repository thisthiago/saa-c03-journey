import { describe, expect, it } from 'vitest'
import { NETWORK_PRICES, networkPrices, NET_PRICE_DATE } from './network-prices'

describe('tabela de preços de rede', () => {
  it('tem as duas Regiões e a data da tabela', () => {
    expect(Object.keys(NETWORK_PRICES.regions).sort()).toEqual(['sa-east-1', 'us-east-1'])
    expect(NET_PRICE_DATE).toMatch(/^\d{2}\/\d{2}\/\d{4}$/)
    expect(() => networkPrices('eu-west-1')).toThrow()
  })

  it('todo preço é um número positivo', () => {
    const walk = (v: unknown, path: string): string[] => {
      if (typeof v === 'number') return v > 0 ? [] : [path]
      if (v && typeof v === 'object') return Object.entries(v).flatMap(([k, x]) => (k === 'sourceUrls' || k === 'offers' ? [] : walk(x, `${path}.${k}`)))
      return []
    }
    for (const [code, r] of Object.entries(NETWORK_PRICES.regions)) {
      const { label: _label, ...prices } = r
      expect(walk(prices, code)).toEqual([])
    }
  })

  it('o endpoint de interface processa dados por menos que o NAT Gateway', () => {
    for (const r of Object.values(NETWORK_PRICES.regions)) {
      expect(r.interfaceEndpoint.perGB).toBeLessThan(r.nat.perGB)
      expect(r.interfaceEndpoint.hourPerAz).toBeLessThan(r.nat.hour)
    }
  })
})
