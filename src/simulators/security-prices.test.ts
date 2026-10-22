import { describe, expect, it } from 'vitest'
import { SECURITY_PRICES, securityPrices, SEC_PRICE_DATE } from './security-prices'

describe('tabela de preços de segurança', () => {
  it('tem as duas Regiões e a data da tabela', () => {
    expect(Object.keys(SECURITY_PRICES.regions).sort()).toEqual(['sa-east-1', 'us-east-1'])
    expect(SEC_PRICE_DATE).toMatch(/^\d{2}\/\d{2}\/\d{4}$/)
    expect(() => securityPrices('eu-west-1')).toThrow()
  })

  it('todo preço é um número positivo', () => {
    const walk = (v: unknown, path: string): string[] => {
      if (typeof v === 'number') return v > 0 ? [] : [path]
      if (v && typeof v === 'object') return Object.entries(v).flatMap(([k, x]) => (k === 'sourceUrls' || k === 'offers' ? [] : walk(x, `${path}.${k}`)))
      return []
    }
    for (const [code, r] of Object.entries(SECURITY_PRICES.regions)) {
      const { label: _label, ...prices } = r
      expect(walk(prices, code)).toEqual([])
    }
  })

  it('um HSM ligado o mês todo custa muito mais que uma chave do KMS', () => {
    for (const r of Object.values(SECURITY_PRICES.regions)) expect(r.cloudHsm.hsmHour * 730).toBeGreaterThan(100 * r.kms.keyMonth)
  })
})
