/** Laboratório de cache: estratégia, TTL, motor e nó do ElastiCache para cada carga, pelo menor custo. */
import type { ItemFeedback } from '../../engine/types'
import { usd } from '../compute-prices'
import { cacheGaps, cacheMonthly, cheapestCache, describeCache, type CacheConfig, type CacheNeed, type CacheScenarioLoad } from './model'

export interface CacheScenario {
  id: string
  name: string
  description: string
  load: CacheScenarioLoad
  need: CacheNeed
  concepts?: string[]
}

export interface CacheLabConfig {
  region?: string
  scenarios: CacheScenario[]
}

export interface CacheLabResponse {
  configs: Record<string, CacheConfig | undefined>
}

export const EMPTY_CACHE: CacheConfig = { strategy: 'none', ttlSec: 0, engine: 'valkey', node: 'cache.t4g.small', replicas: 0 }

/** Até 10% acima do mínimo vale como ótimo; até 50% acima, meio ponto. */
export const NEAR = { full: 1.1, half: 1.5 }

export const cacheInitial = (c: CacheLabConfig): CacheLabResponse => ({ configs: Object.fromEntries(c.scenarios.map((s) => [s.id, { ...EMPTY_CACHE }])) })
export const cacheSolution = (c: CacheLabConfig): CacheLabResponse => ({ configs: Object.fromEntries(c.scenarios.map((s) => [s.id, cheapestCache(s.load, s.need, c.region)])) })

export function judgeCache(c: CacheLabConfig, s: CacheScenario, v: CacheConfig | undefined): { score: number; fb: ItemFeedback } {
  const best = cheapestCache(s.load, s.need, c.region)
  const bestCost = cacheMonthly(best, c.region)
  const ref = `Uma das mais baratas que atendem: ${describeCache(best)} (${usd(bestCost)}/mês).`
  const cfg = v ?? EMPTY_CACHE
  const label = `${s.name}: ${describeCache(cfg)}`
  const gaps = cacheGaps(s.load, cfg, s.need, c.region)
  if (gaps.length) return { score: 0, fb: { id: s.id, label, status: 'wrong', message: `Não atende: ${gaps.join('; ')}. ${ref}` } }
  const cost = cacheMonthly(cfg, c.region)
  if (cost <= bestCost * NEAR.full) return { score: 1, fb: { id: s.id, label, status: 'correct', message: `Atende por ${usd(cost)}/mês, o menor custo possível para esta carga.` } }
  if (cost <= bestCost * NEAR.half) return { score: 0.5, fb: { id: s.id, label, status: 'partial', message: `Atende, mas custa ${usd(cost)}/mês. ${ref}` } }
  return { score: 0, fb: { id: s.id, label, status: 'wrong', message: `Atende, mas custa ${usd(cost)}/mês, bem acima do necessário. ${ref}` } }
}

export function evaluateCacheLab(c: CacheLabConfig, r: CacheLabResponse) {
  const items = c.scenarios.map((s) => ({ concepts: s.concepts, ...judgeCache(c, s, r.configs?.[s.id]) }))
  return { score: items.reduce((sum, x) => sum + x.score, 0) / Math.max(1, items.length), items }
}
