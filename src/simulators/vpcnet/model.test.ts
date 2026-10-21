import { describe, expect, it } from 'vitest'
import { allocate, blockProblems, lookupRoute, overlaps, parseCidr, prefixForHosts, reservedIps, usableIps, type Cidr } from './model'
import { evaluateVpcPlannerLab, vpcPlannerInitial, vpcPlannerSolution, type VpcPlannerLabConfig } from './planner'
import { evaluateRouteTableLab, routeTableInitial, routeTableSolution, type RouteTableLabConfig } from './routing'

const c = (t: string) => parseCidr(t) as Cidr

describe('endereçamento da VPC', () => {
  it('reproduz os cinco endereços reservados do exemplo 10.0.0.0/24 da documentação', () => {
    expect(reservedIps(c('10.0.0.0/24')).map((r) => r.ip)).toEqual(['10.0.0.0', '10.0.0.1', '10.0.0.2', '10.0.0.3', '10.0.0.255'])
    expect(usableIps(24)).toBe(251)
    expect(usableIps(28)).toBe(11)
  })

  it('aceita blocos de /16 a /28 e recusa os demais', () => {
    expect(blockProblems('10.0.0.0/16', 'vpc')).toEqual([])
    expect(blockProblems('10.0.0.0/28', 'vpc')).toEqual([])
    expect(blockProblems('10.0.0.0/8', 'vpc')).toHaveLength(1)
    expect(blockProblems('10.0.0.0/29', 'subnet')).toHaveLength(1)
    expect(blockProblems('169.254.0.0/16', 'vpc')).toHaveLength(1)
    expect(parseCidr('10.0.0.18/24')).toBe('unaligned')
  })

  it('detecta sub-rede fora da VPC e sobreposição', () => {
    expect(blockProblems('10.1.0.0/24', 'subnet', c('10.0.0.0/16'))).toHaveLength(1)
    expect(overlaps(c('10.0.0.0/25'), c('10.0.0.128/25'))).toBe(false)
    expect(overlaps(c('10.0.0.0/24'), c('10.0.0.128/25'))).toBe(true)
  })

  it('escolhe o menor bloco que comporta os recursos', () => {
    expect(prefixForHosts(11)).toBe(28)
    expect(prefixForHosts(12)).toBe(27)
    expect(prefixForHosts(251)).toBe(24)
    expect(prefixForHosts(252)).toBe(23)
    expect(allocate(c('10.0.0.0/24'), [{ id: 'a', name: 'a', az: 'a', hosts: 100 }, { id: 'b', name: 'b', az: 'b', hosts: 100 }])).toEqual({ a: '10.0.0.0/25', b: '10.0.0.128/25' })
    expect(allocate(c('10.0.0.0/24'), [{ id: 'a', name: 'a', az: 'a', hosts: 200 }, { id: 'b', name: 'b', az: 'b', hosts: 100 }])).toBeNull()
  })
})

describe('prioridade das rotas', () => {
  it('reproduz o exemplo da documentação: o peering vence o internet gateway para 172.31.0.0/16', () => {
    const routes = [
      { destination: '10.0.0.0/16', target: 'local' },
      { destination: '172.31.0.0/16', target: 'pcx' },
      { destination: '0.0.0.0/0', target: 'igw' },
    ]
    expect(lookupRoute(routes, '172.31.5.9').route?.target).toBe('pcx')
    expect(lookupRoute(routes, '10.0.3.4').route?.target).toBe('local')
    expect(lookupRoute(routes, '8.8.8.8').route?.target).toBe('igw')
  })

  it('com o mesmo destino, a estática vence a propagada; a lista de prefixos do endpoint vence a rota padrão', () => {
    const routes = [
      { destination: '172.31.0.0/24', target: 'vgw', kind: 'propagated' as const },
      { destination: '172.31.0.0/24', target: 'igw' },
      { destination: '0.0.0.0/0', target: 'nat' },
      { destination: 'pl-s3', target: 'vpce', kind: 'prefix-list' as const },
    ]
    expect(lookupRoute(routes, '172.31.0.9').route?.target).toBe('igw')
    expect(lookupRoute(routes, '52.216.10.1', { 'pl-s3': ['52.216.0.0/15'] }).route?.target).toBe('vpce')
    expect(lookupRoute([{ destination: '10.0.0.0/16', target: 'local' }], '8.8.8.8').route).toBeUndefined()
  })
})

describe('laboratórios de endereços e rotas', () => {
  const planner: VpcPlannerLabConfig = {
    vpcOptions: [{ cidr: '10.0.0.0/16' }, { cidr: '10.20.0.0/22' }],
    existing: [{ name: 'escritório', cidr: '10.0.0.0/16' }],
    subnets: [
      { id: 'web', name: 'web', az: 'a', hosts: 200 },
      { id: 'app', name: 'app', az: 'a', hosts: 100 },
      { id: 'db', name: 'db', az: 'a', hosts: 20 },
    ],
  }
  it('a solução do plano tira 100% e o estado inicial não passa', () => {
    expect(evaluateVpcPlannerLab(planner, vpcPlannerSolution(planner)).score).toBe(1)
    expect(evaluateVpcPlannerLab(planner, vpcPlannerInitial()).score).toBe(0)
    expect(vpcPlannerSolution(planner).vpc).toBe('10.20.0.0/22')
  })

  const rt: RouteTableLabConfig = {
    subnets: [
      { id: 'pub-a', name: 'pública A', az: 'a', v4: 'in-out' },
      { id: 'pub-b', name: 'pública B', az: 'b', v4: 'in-out' },
      { id: 'app-a', name: 'app A', az: 'a', v4: 'out-only', v6: 'out-only' },
      { id: 'app-b', name: 'app B', az: 'b', v4: 'out-only' },
      { id: 'db', name: 'banco', az: 'a', v4: 'none' },
    ],
    nats: [
      { id: 'nat-a', name: 'NAT A', subnet: 'pub-a', az: 'a' },
      { id: 'nat-b', name: 'NAT B', subnet: 'pub-b', az: 'b' },
    ],
    ipv6: true,
  }
  it('o NAT de outra AZ vale meio ponto e o NAT sem rota para o internet gateway não funciona', () => {
    const sol = routeTableSolution(rt)
    expect(evaluateRouteTableLab(rt, sol).score).toBe(1)
    expect(evaluateRouteTableLab(rt, routeTableInitial(rt)).score).toBeLessThan(0.7)
    const crossAz = { tables: { ...sol.tables, 'app-b': { v4: 'nat-a', v6: 'none' } } }
    expect(evaluateRouteTableLab(rt, crossAz).items.find((i) => i.fb.id === 'app-b')?.score).toBe(0.5)
    const brokenNat = { tables: { ...sol.tables, 'pub-a': { v4: 'none', v6: 'none' } } }
    expect(evaluateRouteTableLab(rt, brokenNat).items.find((i) => i.fb.id === 'app-a')?.score).toBe(0)
  })
})
