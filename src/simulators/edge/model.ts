/**
 * Fluxo de uma requisição pelo Amazon CloudFront: usuário → POP (edge
 * location) → Regional Edge Cache → origem.
 *
 * Conferido em 18/10/2026 (https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/HowCloudFrontWorks.html):
 * - "CloudFront points of presence (also known as POPs or edge locations)":
 *   POP e edge location são o mesmo papel; o REC fica entre os POPs e a origem.
 * - O POP procura no seu cache; se não tiver, normalmente consulta o REC; se o
 *   REC não tiver, o pedido vai à origem e a resposta é guardada no REC e no POP.
 * - PUT, POST, PATCH, OPTIONS e DELETE vão do POP direto à origem; requisições
 *   dinâmicas também não passam pelo REC.
 * - Se a origem é um bucket S3 na mesma Região do REC ideal, o POP pula o REC.
 * - Uma invalidação remove o objeto dos POPs e dos RECs.
 *
 * Simplificações: um único POP e um único REC; TTL fixo por comportamento (sem
 * cabeçalhos Cache-Control da origem, sem revalidação condicional); o descarte
 * por pouca popularidade usa um prazo fixo de inatividade (premissa); a cópia do
 * REC mantém a validade original ao ser copiada para o POP; latências são
 * premissas do cenário.
 */

export type Method = 'GET' | 'HEAD' | 'PUT' | 'POST' | 'PATCH' | 'OPTIONS' | 'DELETE'
export type Hop = 'pop' | 'rec' | 'origin'

export interface Behavior {
  /** Padrão de caminho: exato ou terminado em "*" (ex.: "/assets/*"). O primeiro que casar vale. */
  pattern: string
  cache: boolean
  ttlSec: number
}

export interface EdgeSetup {
  origin: { kind: 's3' | 'custom'; region: string; label: string }
  rec: { region: string; label: string }
  popLabel: string
  /** Premissa: latência ilustrativa de ida e volta (ms) entre os saltos. */
  latency: { viewerPop: number; popRec: number; recOrigin: number; popOrigin: number }
  /**
   * Premissa: depois de quantos segundos sem acesso o POP descarta um objeto
   * pouco popular. A documentação descreve esse descarte (e o cache maior do
   * REC), mas não um prazo — o número é do cenário.
   */
  popEvictAfterIdleSec?: number
}

export type EdgeEvent =
  | { at: number; kind: 'request'; method: Method; path: string }
  | { at: number; kind: 'origin-update'; path: string }
  | { at: number; kind: 'invalidate'; path: string }

export interface ServedRequest {
  at: number
  method: Method
  path: string
  servedBy: Hop
  hops: Hop[]
  latencyMs: number
  /** Segundos desde que a origem mudou, se a resposta veio de uma versão antiga. */
  staleForSec?: number
  reason: string
}

export interface EdgeRun {
  requests: ServedRequest[]
  originRequests: number
  hitRatio: number
  avgLatencyMs: number
}

export const HOP_LABEL: Record<Hop, string> = { pop: 'POP (edge location)', rec: 'Regional Edge Cache', origin: 'Origem' }

export function matchBehavior(behaviors: Behavior[], path: string): Behavior | undefined {
  return behaviors.find((b) => (b.pattern.endsWith('*') ? path.startsWith(b.pattern.slice(0, -1)) : b.pattern === path))
}

/** O POP usa o REC? Não quando a origem é S3 na mesma Região do REC. */
export function usesRec(setup: EdgeSetup): boolean {
  return !(setup.origin.kind === 's3' && setup.origin.region === setup.rec.region)
}

const PROXY: Method[] = ['PUT', 'POST', 'PATCH', 'OPTIONS', 'DELETE']

interface Entry {
  storedAt: number
  expiresAt: number
  version: number
  lastAccess: number
}

/**
 * Executa os eventos em ordem de tempo. `invalidateOnUpdate` simula um pipeline
 * que pede invalidação logo depois de cada atualização na origem.
 */
export function simulateEdge(setup: EdgeSetup, behaviors: Behavior[], events: EdgeEvent[], invalidateOnUpdate = false): EdgeRun {
  const pop = new Map<string, Entry>()
  const rec = new Map<string, Entry>()
  const version = new Map<string, number>()
  const updatedAt = new Map<string, number>()
  const recOn = usesRec(setup)
  const L = setup.latency
  const requests: ServedRequest[] = []
  const sorted = [...events].sort((a, b) => a.at - b.at)
  const fresh = (e: Entry | undefined, at: number) => e !== undefined && at < e.expiresAt
  const evicted = (e: Entry | undefined, at: number) => e !== undefined && setup.popEvictAfterIdleSec !== undefined && at - e.lastAccess > setup.popEvictAfterIdleSec

  for (const ev of sorted) {
    if (ev.kind === 'origin-update') {
      version.set(ev.path, (version.get(ev.path) ?? 0) + 1)
      updatedAt.set(ev.path, ev.at)
      if (invalidateOnUpdate) {
        pop.delete(ev.path)
        rec.delete(ev.path)
      }
      continue
    }
    if (ev.kind === 'invalidate') {
      pop.delete(ev.path)
      rec.delete(ev.path)
      continue
    }
    const b = matchBehavior(behaviors, ev.path)
    const current = version.get(ev.path) ?? 0
    const cacheable = Boolean(b?.cache) && (ev.method === 'GET' || ev.method === 'HEAD')
    const staleness = (v: number) => (v < current ? ev.at - (updatedAt.get(ev.path) ?? ev.at) : undefined)
    if (!cacheable) {
      const why = PROXY.includes(ev.method) ? `${ev.method} é repassado pelo POP direto à origem.` : 'Caminho sem cache: o POP repassa à origem a cada pedido, sem passar pelo REC.'
      requests.push({ at: ev.at, method: ev.method, path: ev.path, servedBy: 'origin', hops: ['pop', 'origin'], latencyMs: L.viewerPop + L.popOrigin, reason: why })
      continue
    }
    const ttl = b!.ttlSec
    let p = pop.get(ev.path)
    const wasEvicted = evicted(p, ev.at)
    if (wasEvicted) {
      pop.delete(ev.path)
      p = undefined
    }
    if (fresh(p, ev.at)) {
      p!.lastAccess = ev.at
      requests.push({ at: ev.at, method: ev.method, path: ev.path, servedBy: 'pop', hops: ['pop'], latencyMs: L.viewerPop, staleForSec: staleness(p!.version), reason: 'O POP já tinha uma cópia válida e respondeu sozinho (acerto no cache, ou cache hit).' })
      continue
    }
    if (recOn) {
      const r = rec.get(ev.path)
      if (fresh(r, ev.at)) {
        r!.lastAccess = ev.at
        pop.set(ev.path, { storedAt: ev.at, expiresAt: r!.expiresAt, version: r!.version, lastAccess: ev.at })
        requests.push({ at: ev.at, method: ev.method, path: ev.path, servedBy: 'rec', hops: ['pop', 'rec'], latencyMs: L.viewerPop + L.popRec, staleForSec: staleness(r!.version), reason: wasEvicted ? 'O POP já tinha descartado o objeto (pouco acessado); o Regional Edge Cache, maior, ainda tinha.' : 'Não estava no POP; o Regional Edge Cache tinha.' })
        continue
      }
      rec.set(ev.path, { storedAt: ev.at, expiresAt: ev.at + ttl, version: current, lastAccess: ev.at })
      pop.set(ev.path, { storedAt: ev.at, expiresAt: ev.at + ttl, version: current, lastAccess: ev.at })
      requests.push({ at: ev.at, method: ev.method, path: ev.path, servedBy: 'origin', hops: ['pop', 'rec', 'origin'], latencyMs: L.viewerPop + L.popRec + L.recOrigin, reason: 'Nem o POP nem o REC tinham cópia válida: o pedido foi até a origem, e a resposta ficou guardada nos dois caches para os próximos pedidos.' })
      continue
    }
    pop.set(ev.path, { storedAt: ev.at, expiresAt: ev.at + ttl, version: current, lastAccess: ev.at })
    requests.push({ at: ev.at, method: ev.method, path: ev.path, servedBy: 'origin', hops: ['pop', 'origin'], latencyMs: L.viewerPop + L.popOrigin, reason: 'O POP não tinha cópia válida. Como o bucket de origem está na mesma Região do REC, o POP busca direto no bucket, sem passar pelo REC.' })
  }
  const originRequests = requests.filter((r) => r.servedBy === 'origin').length
  const cacheableCount = requests.length
  return {
    requests,
    originRequests,
    hitRatio: cacheableCount ? (cacheableCount - originRequests) / cacheableCount : 0,
    avgLatencyMs: cacheableCount ? requests.reduce((s, r) => s + r.latencyMs, 0) / cacheableCount : 0,
  }
}

export function formatAt(sec: number): string {
  if (sec < 60) return `${sec}s`
  if (sec < 3600) return `${Math.floor(sec / 60)}min${sec % 60 ? ` ${sec % 60}s` : ''}`
  const h = Math.floor(sec / 3600)
  const m = Math.floor((sec % 3600) / 60)
  return `${h}h${m ? ` ${m}min` : ''}`
}

export function formatTtl(sec: number): string {
  if (sec === 0) return '0 (sem reaproveitamento)'
  if (sec % 86400 === 0) return `${sec / 86400} dia(s)`
  if (sec % 3600 === 0) return `${sec / 3600} h`
  if (sec % 60 === 0) return `${sec / 60} min`
  return `${sec} s`
}
