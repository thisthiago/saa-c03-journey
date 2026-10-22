import { describe, expect, it } from 'vitest'
import { FILES_PRICE_DATE, FILES_PRICES, filesPrices } from './files-prices'

describe('tabela de preços de arquivos e backup', () => {
  it('tem as duas Regiões e a data da tabela', () => {
    expect(Object.keys(FILES_PRICES.regions).sort()).toEqual(['sa-east-1', 'us-east-1'])
    expect(FILES_PRICE_DATE).toMatch(/^\d{2}\/\d{2}\/\d{4}$/)
    expect(() => filesPrices('eu-west-1')).toThrow()
  })

  it('todo preço é um número positivo', () => {
    const walk = (v: unknown, path: string): string[] => {
      if (typeof v === 'number') return v > 0 ? [] : [path]
      if (v && typeof v === 'object') return Object.entries(v).flatMap(([k, x]) => (k === 'sourceUrls' || k === 'offers' ? [] : walk(x, `${path}.${k}`)))
      return []
    }
    for (const [code, r] of Object.entries(FILES_PRICES.regions)) {
      const { label: _label, ...prices } = r
      expect(walk(prices, code)).toEqual([])
    }
  })

  it('as classes frias custam menos que a Standard, e Multi-AZ custa mais que Single-AZ', () => {
    for (const r of Object.values(FILES_PRICES.regions)) {
      expect(r.efs.archive).toBeLessThan(r.efs.iaElastic)
      expect(r.efs.iaElastic).toBeLessThan(r.efs.standard)
      expect(r.efs.standardOneZone).toBeLessThan(r.efs.standard)
      expect(r.fsx.windows.ssdMultiAz).toBeGreaterThan(r.fsx.windows.ssdSingleAz)
      expect(r.backup.efsCold).toBeLessThan(r.backup.efsWarm)
    }
  })
})
