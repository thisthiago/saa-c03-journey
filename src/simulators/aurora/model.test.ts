import { describe, expect, it } from 'vitest'
import { auroraMonthly, cheaperStorageConfig, ioShare, IO_OPTIMIZED_THRESHOLD } from './model'

describe('custo do Aurora', () => {
  it('I/O-Optimized não cobra E/S e cobra mais pela instância e pelo armazenamento', () => {
    const c = { cls: 'db.r7g.large', instances: 2, storageGB: 500, ioMillions: 100 }
    const s = auroraMonthly(c, 'standard')
    const o = auroraMonthly(c, 'io-optimized')
    expect(o.io).toBe(0)
    expect(o.instances).toBeGreaterThan(s.instances)
    expect(o.storage).toBeGreaterThan(s.storage)
  })

  it('com pouca E/S vale o Standard; com E/S acima de 25% do gasto, o I/O-Optimized', () => {
    const light = { cls: 'db.r7g.large', instances: 2, storageGB: 500, ioMillions: 50 }
    const heavy = { cls: 'db.r7g.large', instances: 2, storageGB: 500, ioMillions: 3000 }
    expect(ioShare(light)).toBeLessThan(IO_OPTIMIZED_THRESHOLD)
    expect(cheaperStorageConfig(light)).toBe('standard')
    expect(ioShare(heavy)).toBeGreaterThan(IO_OPTIMIZED_THRESHOLD)
    expect(cheaperStorageConfig(heavy)).toBe('io-optimized')
  })
})
