import { describe, expect, it } from 'vitest'
import { TRANSFER_PRICE_DATE, TRANSFER_PRICES, transferPrices } from './transfer-prices'

describe('tabela de preços de transferência de dados', () => {
  it('tem us-east-1 e a data da tabela', () => {
    expect(Object.keys(TRANSFER_PRICES.regions)).toEqual(['us-east-1'])
    expect(TRANSFER_PRICE_DATE).toMatch(/^\d{2}\/\d{2}\/\d{4}$/)
    expect(() => transferPrices('eu-west-1')).toThrow()
  })

  it('a entrada e a busca na origem pelo CloudFront não são cobradas', () => {
    const p = transferPrices()
    expect(p.internetInPerGB).toBe(0)
    expect(p.cloudFrontOriginFetchPerGB).toBe(0)
  })

  it('entre zonas custa menos que entre Regiões, que custa menos que a internet', () => {
    const p = transferPrices()
    expect(p.interAzPerGB).toBeGreaterThan(0)
    for (const v of Object.values(p.interRegionOutPerGB)) {
      expect(v).toBeGreaterThanOrEqual(p.interAzPerGB)
      expect(v).toBeLessThan(p.internetOutPerGB)
    }
    expect(p.cloudFrontOutPerGB).toBeGreaterThan(0)
    expect(p.cloudFrontOutPerGB).toBeLessThan(p.internetOutPerGB)
  })
})
