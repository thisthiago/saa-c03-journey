import { describe, expect, it } from 'vitest'
import { DEFAULT_NACL, naclDecision, traceFlow, type ReachWorld } from './model'

const world = (webNaclOut = DEFAULT_NACL): ReachWorld => ({
  subnets: [
    { id: 'pub', name: 'pública', cidr: '10.0.1.0/24', public: true, naclIn: DEFAULT_NACL, naclOut: webNaclOut },
    { id: 'priv', name: 'privada', cidr: '10.0.2.0/24', naclIn: DEFAULT_NACL, naclOut: DEFAULT_NACL },
  ],
  instances: [
    { id: 'web', name: 'web', subnet: 'pub', ip: '10.0.1.10', publicIp: true, sg: 'sg-web' },
    { id: 'db', name: 'banco', subnet: 'priv', ip: '10.0.2.20', sg: 'sg-db' },
  ],
  groups: [
    { id: 'sg-web', name: 'sg-web', inbound: [{ peer: '0.0.0.0/0', ports: [443, 443] }] },
    { id: 'sg-db', name: 'sg-db', inbound: [{ peer: 'sg-web', ports: [5432, 5432] }] },
  ],
})

describe('caminho de uma conexão na VPC', () => {
  it('reproduz o exemplo da documentação: a porta 443 casa a regra 110, e a 139 cai na regra *', () => {
    const rules = [
      { num: 100, action: 'allow' as const, cidr: '0.0.0.0/0', ports: [80, 80] as [number, number] },
      { num: 110, action: 'allow' as const, cidr: '0.0.0.0/0', ports: [443, 443] as [number, number] },
    ]
    expect(naclDecision(rules, '198.51.100.1', 443).rule).toContain('regra 110')
    expect(naclDecision(rules, '198.51.100.1', 139).allowed).toBe(false)
  })

  it('a regra de número menor vence, mesmo que uma regra seguinte permita', () => {
    const rules = [
      { num: 200, action: 'allow' as const, cidr: '0.0.0.0/0', ports: 'all' as const },
      { num: 100, action: 'deny' as const, cidr: '198.51.100.0/24', ports: 'all' as const },
    ]
    expect(naclDecision(rules, '198.51.100.7', 443).allowed).toBe(false)
    expect(naclDecision(rules, '192.0.2.7', 443).allowed).toBe(true)
  })

  it('o security group referencia outro grupo e tem estado', () => {
    expect(traceFlow(world(), { id: 'a', from: 'internet', to: 'web', port: 443 }).outcome).toBe('delivered')
    expect(traceFlow(world(), { id: 'b', from: 'internet', to: 'web', port: 22 }).outcome).toBe('sg-in')
    expect(traceFlow(world(), { id: 'c', from: 'web', to: 'db', port: 5432 }).outcome).toBe('delivered')
    expect(traceFlow(world(), { id: 'd', from: 'internet', to: 'db', port: 5432 }).outcome).toBe('route')
  })

  it('a network ACL não tem estado: sem regra de saída para as portas efêmeras, a resposta não volta', () => {
    const onlyHttps = [{ num: 100, action: 'allow' as const, cidr: '0.0.0.0/0', ports: [443, 443] as [number, number] }]
    expect(traceFlow(world(onlyHttps), { id: 'e', from: 'internet', to: 'web', port: 443 }).outcome).toBe('nacl-response')
  })
})
