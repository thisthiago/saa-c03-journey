import { describe, expect, it } from 'vitest'
import { chooseLb, distribute, routeAlb, validateListener, type HttpRequest, type Listener } from './model'

const req = (id: string, host: string, path: string, extra: Partial<HttpRequest> = {}): HttpRequest => ({ id, label: id, host, path, method: 'GET', sourceIp: '203.0.113.10', ...extra })

const L: Listener = {
  rules: [
    { id: 'api', priority: 10, conditions: [{ type: 'path-pattern', values: ['/api/*'] }], action: { type: 'forward', targetGroups: [{ id: 'api', weight: 1 }] } },
    { id: 'admin', priority: 5, conditions: [{ type: 'host-header', values: ['admin.loja.com'] }, { type: 'source-ip', values: ['10.0.0.0/8'] }], action: { type: 'forward', targetGroups: [{ id: 'admin', weight: 1 }] } },
    { id: 'old', priority: 20, conditions: [{ type: 'path-pattern', values: ['/antigo/*'] }], action: { type: 'redirect', to: '/novo' } },
  ],
  defaultAction: { type: 'forward', targetGroups: [{ id: 'web', weight: 1 }] },
}

describe('regras do ALB', () => {
  it('avalia da menor prioridade para a maior e cai na padrão', () => {
    expect(routeAlb(L, req('a', 'loja.com', '/api/pedidos')).outcome).toBe('api')
    expect(routeAlb(L, req('b', 'loja.com', '/produtos')).rule).toBe('default')
    expect(routeAlb(L, req('c', 'loja.com', '/antigo/x')).outcome).toBe('redirect')
  })
  it('todas as condições da regra precisam casar (E); os valores de uma condição combinam com OU', () => {
    expect(routeAlb(L, req('d', 'ADMIN.loja.com', '/', { sourceIp: '10.1.2.3' })).outcome).toBe('admin')
    expect(routeAlb(L, req('e', 'admin.loja.com', '/', { sourceIp: '198.51.100.7' })).outcome).toBe('web')
  })
  it('recusa prioridades repetidas e condições com mais de 3 valores', () => {
    const bad: Listener = { ...L, rules: [...L.rules, { id: 'x', priority: 10, conditions: [{ type: 'path-pattern', values: ['/a', '/b', '/c', '/d'] }], action: L.defaultAction }] }
    const errs = validateListener(bad)
    expect(errs.some((e) => e.includes('mesma prioridade'))).toBe(true)
    expect(errs.some((e) => e.includes('mais de 3'))).toBe(true)
  })
})

describe('cross-zone', () => {
  it('reproduz o exemplo da documentação: 2 alvos numa AZ e 8 na outra', () => {
    expect(distribute({ a: 2, b: 8 }, true)).toEqual({ a: 0.1, b: 0.1 })
    const off = distribute({ a: 2, b: 8 }, false)
    expect(off.a).toBeCloseTo(0.25, 6)
    expect(off.b).toBeCloseTo(0.0625, 6)
  })
})

describe('escolha do tipo', () => {
  it('ALB para rotas HTTP, NLB para IP fixo e UDP, GWLB para appliances', () => {
    expect(chooseLb(['path-routing', 'redirect'])).toBe('alb')
    expect(chooseLb(['static-ip', 'udp'])).toBe('nlb')
    expect(chooseLb(['appliances'])).toBe('gwlb')
    expect(chooseLb(['path-routing', 'udp'])).toBeUndefined()
  })
})
