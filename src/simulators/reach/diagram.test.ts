import { describe, expect, it } from 'vitest'
import { SABER_LAB } from '../../content/modules/network/phases/f03/phase'
import { diagramProblems } from '../../engine/diagram'
import { applyRules, evaluateReachLab, reachSolution } from './lab'
import { flowDiagram, flowHops } from './diagram'

const flow = (id: string) => SABER_LAB.flows.find((f) => f.id === id)!

describe('chefe da fase 3', () => {
  it('abrir o banco a 0.0.0.0/0 deixa o servidor de relatórios entrar e perde nota', () => {
    const enabled = reachSolution(SABER_LAB).enabled.map((id) => (id === 'db-sg' ? 'db-all' : id))
    const r = evaluateReachLab(SABER_LAB, { enabled })
    expect(r.items.find((i) => i.fb.id === 'rel-db')!.score).toBe(0)
    expect(r.score).toBeLessThan(1)
  })
  it('a solução não precisa de regra de saída só para a porta 5432', () => {
    expect(reachSolution(SABER_LAB).enabled).not.toContain('pub-out-db')
    expect(evaluateReachLab(SABER_LAB, reachSolution(SABER_LAB)).score).toBe(1)
  })
})

describe('caminho de um fluxo', () => {
  const solved = applyRules(SABER_LAB, SABER_LAB.solution)

  it('servidor web até o banco: seis pontos na ida, dois na volta, tudo passa', () => {
    const hops = flowHops(solved, flow('app-db'))
    expect(hops.map((h) => h.id)).toEqual(['src', 'sg-out', 'acl-src-out', 'acl-dst-in', 'sg-in', 'dst', 'acl-dst-out', 'acl-src-in'])
    expect(hops.every((h) => h.status === 'pass')).toBe(true)
    expect(diagramProblems(flowDiagram(solved, flow('app-db')))).toEqual([])
  })

  it('o atacante para na ACL de entrada, e o resto fica apagado', () => {
    const hops = flowHops(solved, flow('ataque'))
    expect(hops.find((h) => h.id === 'acl-dst-in')).toMatchObject({ status: 'block', sub: 'regra 50 nega' })
    expect(hops.filter((h) => h.status === 'skip').map((h) => h.id)).toEqual(['sg-in', 'dst', 'acl-dst-out'])
  })

  it('sem regra de resposta, o aluno para na volta, na saída da sub-rede pública', () => {
    const w = applyRules(SABER_LAB, SABER_LAB.solution.filter((id) => id !== 'pub-out-eph'))
    const d = flowDiagram(w, flow('aluno'))
    expect(d.caption).toMatch(/^Para em: ACL pública, saída\./)
    expect(diagramProblems(d)).toEqual([])
  })

  it('o banco na sub-rede privada não é alcançado pela internet', () => {
    expect(flowHops(solved, flow('net-db')).find((h) => h.id === 'igw')?.status).toBe('block')
  })
})
