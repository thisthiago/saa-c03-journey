/**
 * Cache na frente do banco: estratégia (sem cache, leitura sob demanda ou escrita
 * direta), TTL, motor e nó do ElastiCache. Calcula taxa de acerto, leituras que
 * chegam ao banco, latência média, quanto tempo um dado pode ficar desatualizado,
 * memória e custo pela tabela de preços.
 *
 * Fatos conferidos em 21/10/2026:
 * - Leitura sob demanda (lazy loading): só guarda o que foi pedido; cada falta custa três
 *   idas (cache, banco, gravar no cache) e o dado pode ficar desatualizado. Escrita direta
 *   (write-through): o cache nunca fica desatualizado, mas cada escrita vai ao cache e ao banco,
 *   e guarda dados que ninguém lê. O TTL limita o tempo desatualizado e a memória:
 *   https://docs.aws.amazon.com/AmazonElastiCache/latest/dg/Strategies.html
 * - Memcached: multithread, tipos simples, sem replicação. Valkey e Redis OSS: tipos complexos
 *   (sorted sets), pub/sub, replicação com failover, backup:
 *   https://docs.aws.amazon.com/AmazonElastiCache/latest/dg/SelectEngine.html
 *
 * Premissas do cenário: latência de 0,5 ms no cache e 8 ms no banco; 75% da memória do nó
 * disponível para dados.
 */
import { HOURS_PER_MONTH } from '../compute-prices'
import { CACHE_NODES, databasePrices, type CacheEngine } from '../database-prices'

export type CacheStrategy = 'none' | 'lazy' | 'write-through'
export type EngineNeed = 'complex-types' | 'replication' | 'multithread'

export const STRATEGY_LABEL: Record<CacheStrategy, string> = { none: 'Sem cache', lazy: 'Leitura sob demanda (lazy loading)', 'write-through': 'Escrita direta (write-through)' }
export const ENGINE_LABEL: Record<CacheEngine, string> = { valkey: 'Valkey', redis: 'Redis OSS', memcached: 'Memcached' }
export const ENGINE_NEED_LABEL: Record<EngineNeed, string> = {
  'complex-types': 'estruturas como sorted sets (rankings) e pub/sub',
  replication: 'réplica com failover automático se um nó falhar',
  multithread: 'nós grandes que usam todos os núcleos (multithread)',
}
export const ENGINE_MEETS: Record<CacheEngine, EngineNeed[]> = { valkey: ['complex-types', 'replication'], redis: ['complex-types', 'replication'], memcached: ['multithread'] }

export const TTL_OPTIONS = [0, 60, 300, 3600]
export const LATENCY = { cacheMs: 0.5, dbMs: 8 } as const
export const USABLE_MEMORY = 0.75

export interface CacheScenarioLoad {
  readsPerSec: number
  writesPerSec: number
  /** Itens lidos com frequência. */
  hotKeys: number
  /** Todos os itens do banco. */
  totalKeys: number
  itemKB: number
}

export interface CacheConfig {
  strategy: CacheStrategy
  /** Segundos (0 = sem TTL). */
  ttlSec: number
  engine: CacheEngine
  node: string
  replicas: number
}

export interface CacheMetrics {
  hitRate: number
  dbReadsPerSec: number
  avgLatencyMs: number
  /** Segundos que um dado pode ficar desatualizado (Infinity = até sair do cache). */
  maxStaleSec: number
  memoryGiB: number
}

export function cacheMetrics(l: CacheScenarioLoad, c: CacheConfig): CacheMetrics {
  if (c.strategy === 'none') return { hitRate: 0, dbReadsPerSec: l.readsPerSec, avgLatencyMs: LATENCY.dbMs, maxStaleSec: 0, memoryGiB: 0 }
  const readsPerKey = l.readsPerSec / l.hotKeys
  // Com TTL, cada item quente falta uma vez por período; sem TTL, quase nunca (fora a carga inicial).
  const missRate = c.ttlSec > 0 ? 1 / (1 + readsPerKey * c.ttlSec) : 0
  const hitRate = 1 - missRate
  const missLatency = c.strategy === 'lazy' ? LATENCY.cacheMs + LATENCY.dbMs + LATENCY.cacheMs : LATENCY.cacheMs + LATENCY.dbMs
  const avgLatencyMs = hitRate * LATENCY.cacheMs + missRate * missLatency
  const maxStaleSec = c.strategy === 'write-through' ? 0 : l.writesPerSec > 0 ? (c.ttlSec > 0 ? c.ttlSec : Infinity) : 0
  const keys = c.strategy === 'lazy' ? l.hotKeys : c.ttlSec > 0 ? Math.min(l.totalKeys, l.hotKeys + l.writesPerSec * c.ttlSec) : l.totalKeys
  return { hitRate, dbReadsPerSec: l.readsPerSec * missRate, avgLatencyMs, maxStaleSec, memoryGiB: (keys * l.itemKB) / (1024 * 1024) }
}

export function nodeMemory(node: string, region?: string): number {
  const n = databasePrices(region).elasticache.nodes[node]
  if (!n) throw new Error(`Nó fora da tabela: ${node}`)
  return n.memoryGiB * USABLE_MEMORY
}

export function cacheMonthly(c: CacheConfig, region?: string): number {
  if (c.strategy === 'none') return 0
  return databasePrices(region).elasticache.nodes[c.node].hour[c.engine] * (1 + c.replicas) * HOURS_PER_MONTH
}

export interface CacheNeed {
  /** Leituras por segundo que o banco aguenta. */
  maxDbReadsPerSec: number
  maxStaleSec: number
  maxLatencyMs: number
  engine: EngineNeed[]
}

export function cacheGaps(l: CacheScenarioLoad, c: CacheConfig, n: CacheNeed, region?: string): string[] {
  const m = cacheMetrics(l, c)
  const gaps: string[] = []
  if (m.dbReadsPerSec > n.maxDbReadsPerSec) gaps.push(`${Math.round(m.dbReadsPerSec).toLocaleString('pt-BR')} leituras por segundo chegam ao banco, que aguenta ${n.maxDbReadsPerSec.toLocaleString('pt-BR')}`)
  if (m.maxStaleSec > n.maxStaleSec) gaps.push(Number.isFinite(m.maxStaleSec) ? `um dado pode ficar até ${m.maxStaleSec} s desatualizado, e o limite é ${n.maxStaleSec} s` : 'sem TTL e sem escrita direta, um dado alterado pode ficar desatualizado até sair do cache')
  if (m.avgLatencyMs > n.maxLatencyMs) gaps.push(`latência média de ${m.avgLatencyMs.toFixed(2)} ms, acima de ${n.maxLatencyMs} ms`)
  if (c.strategy !== 'none') {
    if (m.memoryGiB > nodeMemory(c.node, region)) gaps.push(`os dados em cache ocupam ${m.memoryGiB.toFixed(1)} GiB e o nó comporta ${nodeMemory(c.node, region).toFixed(1)} GiB`)
    for (const e of n.engine) if (!ENGINE_MEETS[c.engine].includes(e)) gaps.push(`${ENGINE_LABEL[c.engine]} não oferece ${ENGINE_NEED_LABEL[e]}`)
    if (n.engine.includes('replication') && c.replicas < 1) gaps.push('sem réplica, a falha do nó derruba o cache')
    if (c.engine === 'memcached' && c.replicas > 0) gaps.push('o Memcached não tem réplicas')
  }
  return gaps
}

export function configs(): CacheConfig[] {
  const out: CacheConfig[] = [{ strategy: 'none', ttlSec: 0, engine: 'valkey', node: CACHE_NODES[0], replicas: 0 }]
  for (const strategy of ['lazy', 'write-through'] as CacheStrategy[])
    for (const ttlSec of TTL_OPTIONS)
      for (const engine of ['valkey', 'redis', 'memcached'] as CacheEngine[])
        for (const node of CACHE_NODES) for (const replicas of engine === 'memcached' ? [0] : [0, 1]) out.push({ strategy, ttlSec, engine, node, replicas })
  return out
}

/** A configuração mais barata que atende. Empates de custo ficam com a primeira encontrada. */
export function cheapestCache(l: CacheScenarioLoad, n: CacheNeed, region?: string): CacheConfig {
  let best: { c: CacheConfig; cost: number } | undefined
  for (const c of configs()) {
    if (cacheGaps(l, c, n, region).length) continue
    const cost = cacheMonthly(c, region)
    if (!best || cost < best.cost - 1e-9) best = { c, cost }
  }
  if (!best) throw new Error('Nenhuma configuração de cache atende')
  return best.c
}

export function describeCache(c: CacheConfig): string {
  if (c.strategy === 'none') return STRATEGY_LABEL.none
  return `${STRATEGY_LABEL[c.strategy]}, ${c.ttlSec ? `TTL de ${c.ttlSec} s` : 'sem TTL'}, ${ENGINE_LABEL[c.engine]} em ${c.node}${c.replicas ? ' com uma réplica' : ''}`
}
