import { describe, expect, it } from 'vitest'
import { simulateEdge, usesRec, type Behavior, type EdgeSetup } from './model'

const setup: EdgeSetup = {
  origin: { kind: 's3', region: 'us-east-1', label: 'bucket' },
  rec: { region: 'sa-east-1', label: 'REC' },
  popLabel: 'POP',
  latency: { viewerPop: 10, popRec: 20, recOrigin: 120, popOrigin: 130 },
}
const B: Behavior[] = [
  { pattern: '/api/*', cache: false, ttlSec: 0 },
  { pattern: '*', cache: true, ttlSec: 3600 },
]

describe('fluxo do CloudFront', () => {
  it('miss → busca na origem pelo REC; depois hit no POP', () => {
    const run = simulateEdge(setup, B, [
      { at: 0, kind: 'request', method: 'GET', path: '/logo.png' },
      { at: 10, kind: 'request', method: 'GET', path: '/logo.png' },
    ])
    expect(run.requests.map((r) => r.hops)).toEqual([['pop', 'rec', 'origin'], ['pop']])
    expect(run.requests[0].latencyMs).toBe(150)
    expect(run.originRequests).toBe(1)
  })
  it('origem S3 na mesma Região do REC: o POP pula o REC', () => {
    const same = { ...setup, rec: { region: 'us-east-1', label: 'REC' } }
    expect(usesRec(same)).toBe(false)
    expect(simulateEdge(same, B, [{ at: 0, kind: 'request', method: 'GET', path: '/x' }]).requests[0].hops).toEqual(['pop', 'origin'])
  })
  it('POST e conteúdo dinâmico vão direto do POP à origem', () => {
    const run = simulateEdge(setup, B, [
      { at: 0, kind: 'request', method: 'POST', path: '/logo.png' },
      { at: 1, kind: 'request', method: 'GET', path: '/api/saldo' },
      { at: 2, kind: 'request', method: 'GET', path: '/api/saldo' },
    ])
    expect(run.requests.every((r) => r.hops.join() === 'pop,origin')).toBe(true)
  })
  it('objeto pouco acessado sai do POP, mas o REC (cache maior) ainda tem', () => {
    const b: Behavior[] = [{ pattern: '*', cache: true, ttlSec: 86400 }]
    const evict = { ...setup, popEvictAfterIdleSec: 600 }
    const run = simulateEdge(evict, b, [
      { at: 0, kind: 'request', method: 'GET', path: '/a' },
      { at: 300, kind: 'request', method: 'GET', path: '/a' },
      { at: 2000, kind: 'request', method: 'GET', path: '/a' },
      { at: 90000, kind: 'request', method: 'GET', path: '/a' },
    ])
    expect(run.requests.map((r) => r.servedBy)).toEqual(['origin', 'pop', 'rec', 'origin'])
  })
  it('atualização na origem: o cache serve a versão antiga até expirar ou ser invalidado', () => {
    const ev = [
      { at: 0, kind: 'request' as const, method: 'GET' as const, path: '/precos.json' },
      { at: 100, kind: 'origin-update' as const, path: '/precos.json' },
      { at: 400, kind: 'request' as const, method: 'GET' as const, path: '/precos.json' },
    ]
    expect(simulateEdge(setup, B, ev).requests[1].staleForSec).toBe(300)
    const inv = simulateEdge(setup, B, ev, true)
    expect(inv.requests[1].staleForSec).toBeUndefined()
    expect(inv.requests[1].servedBy).toBe('origin')
  })
})
