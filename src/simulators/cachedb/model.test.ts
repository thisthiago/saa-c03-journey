import { describe, expect, it } from 'vitest'
import { cacheGaps, cacheMetrics, cheapestCache, type CacheConfig, type CacheScenarioLoad } from './model'

const load: CacheScenarioLoad = { readsPerSec: 8000, writesPerSec: 400, hotKeys: 100000, totalKeys: 5000000, itemKB: 1 }
const cfg = (part: Partial<CacheConfig>): CacheConfig => ({ strategy: 'lazy', ttlSec: 300, engine: 'valkey', node: 'cache.t4g.small', replicas: 0, ...part })

describe('cache na frente do banco', () => {
  it('sem cache, toda leitura vai ao banco', () => {
    expect(cacheMetrics(load, cfg({ strategy: 'none' })).dbReadsPerSec).toBe(8000)
  })

  it('leitura sob demanda pode ficar desatualizada até o TTL; sem TTL, até sair do cache', () => {
    expect(cacheMetrics(load, cfg({ ttlSec: 300 })).maxStaleSec).toBe(300)
    expect(cacheMetrics(load, cfg({ ttlSec: 0 })).maxStaleSec).toBe(Infinity)
    expect(cacheMetrics(load, cfg({ strategy: 'write-through' })).maxStaleSec).toBe(0)
  })

  it('escrita direta sem TTL guarda tudo o que foi gravado; com TTL, ocupa bem menos memória', () => {
    const all = cacheMetrics(load, cfg({ strategy: 'write-through', ttlSec: 0 })).memoryGiB
    const ttl = cacheMetrics(load, cfg({ strategy: 'write-through', ttlSec: 300 })).memoryGiB
    expect(all).toBeGreaterThan(4)
    expect(ttl).toBeLessThan(0.5)
  })

  it('Memcached não tem réplica nem sorted sets', () => {
    const need = { maxDbReadsPerSec: 1000, maxStaleSec: 0, maxLatencyMs: 2, engine: ['complex-types' as const] }
    expect(cacheGaps(load, cfg({ strategy: 'write-through', engine: 'memcached' }), need).join(' ')).toContain('Memcached')
  })

  it('a configuração mais barata usa escrita direta com TTL quando nada pode ficar desatualizado', () => {
    const best = cheapestCache(load, { maxDbReadsPerSec: 1000, maxStaleSec: 0, maxLatencyMs: 2, engine: ['replication'] })
    expect(best).toMatchObject({ strategy: 'write-through', ttlSec: 300, engine: 'valkey', node: 'cache.t4g.small', replicas: 1 })
  })
})
