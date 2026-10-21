import { describe, expect, it } from 'vitest'
import { connectionsToManage, reaches, topologyMonthly, topologyProblems, type Net, type Topology } from './model'

const nets: Net[] = [
  { id: 'a', name: 'VPC A', cidr: '10.1.0.0/16' },
  { id: 'b', name: 'VPC B', cidr: '10.2.0.0/16' },
  { id: 'c', name: 'VPC C', cidr: '10.3.0.0/16' },
  { id: 'dc', name: 'escritório', cidr: '192.168.0.0/16', onPrem: true },
]

describe('peering e Transit Gateway', () => {
  it('reproduz o exemplo da documentação: A ligada a B e a C, mas B não alcança C por A', () => {
    const t: Topology = { kind: 'peering', pairs: [['a', 'b'], ['a', 'c']], vpnTo: 'a' }
    expect(reaches(nets, t, 'a', 'b').ok).toBe(true)
    expect(reaches(nets, t, 'b', 'c').ok).toBe(false)
    expect(reaches(nets, t, 'b', 'dc').ok).toBe(false)
    expect(reaches(nets, t, 'dc', 'a').ok).toBe(true)
  })

  it('não cria peering com blocos sobrepostos', () => {
    const over: Net[] = [...nets, { id: 'd', name: 'VPC D', cidr: '10.1.128.0/17' }]
    expect(topologyProblems(over, { kind: 'peering', pairs: [['a', 'd']] })).toHaveLength(1)
  })

  it('o roteador central com uma tabela liga todos; tabelas separadas isolam as VPCs e mantêm o serviço compartilhado', () => {
    const central: Topology = { kind: 'tgw', tables: [{ id: 'rt', name: 'única', associate: ['a', 'b', 'c', 'dc'], propagate: ['a', 'b', 'c', 'dc'] }] }
    expect(reaches(nets, central, 'b', 'c').ok).toBe(true)
    expect(reaches(nets, central, 'b', 'dc').ok).toBe(true)
    const isolated: Topology = {
      kind: 'tgw',
      tables: [
        { id: 'iso', name: 'isoladas', associate: ['a', 'b'], propagate: ['c'] },
        { id: 'shared', name: 'compartilhada', associate: ['c'], propagate: ['a', 'b'] },
      ],
    }
    expect(reaches(nets, isolated, 'a', 'b').ok).toBe(false)
    expect(reaches(nets, isolated, 'a', 'c').ok).toBe(true)
    expect(reaches(nets, isolated, 'c', 'b').ok).toBe(true)
    expect(connectionsToManage(isolated)).toBe(3)
  })

  it('o Transit Gateway cobra por anexo e por GB; o peering não', () => {
    const t: Topology = { kind: 'tgw', tables: [{ id: 'rt', name: 'única', associate: ['a', 'b'], propagate: ['a', 'b'] }] }
    expect(topologyMonthly(t, 1000)).toBeGreaterThan(0)
    expect(topologyMonthly({ kind: 'peering', pairs: [['a', 'b']] }, 1000)).toBe(0)
  })
})
