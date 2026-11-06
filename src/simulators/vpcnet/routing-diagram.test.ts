import { describe, expect, it } from 'vitest'
import { PONTO_CERTO_ROUTES } from '../../content/modules/network/phases/f02/phase'
import { diagramProblems } from '../../engine/diagram'
import { routeTableInitial, routeTableSolution } from './routing'
import { routeDiagram } from './routing-diagram'

describe('desenho das rotas', () => {
  it('sem rotas: só os gateways ligados à internet, tudo privado e os NATs sem saída', () => {
    const d = routeDiagram(PONTO_CERTO_ROUTES, routeTableInitial(PONTO_CERTO_ROUTES))
    expect(diagramProblems(d)).toEqual([])
    expect(d.links).toHaveLength(2)
    expect(d.boxes!.filter((b) => b.kind === 'public')).toEqual([])
    expect(d.nodes!.filter((n) => n.state === 'fail').map((n) => n.id)).toEqual(['nat-a', 'nat-b'])
    expect(d.label).toContain('Sem saída para a internet: NAT Gateway A e NAT Gateway B.')
  })

  it('com a solução: públicas verdes, uma linha por rota e nenhum NAT em falha', () => {
    const d = routeDiagram(PONTO_CERTO_ROUTES, routeTableSolution(PONTO_CERTO_ROUTES))
    expect(diagramProblems(d)).toEqual([])
    expect(d.boxes!.filter((b) => b.kind === 'public').map((b) => b.id)).toEqual(['sn-pub-a', 'sn-pub-b'])
    expect(d.nodes!.some((n) => n.state === 'fail')).toBe(false)
    // 2 da internet + 2 públicas + 2 de aplicação para o NAT + 2 de aplicação em IPv6.
    expect(d.links).toHaveLength(8)
    expect(d.links!.filter((l) => l.style === 'dashed' && l.to === 'eigw')).toHaveLength(2)
  })

  it('NAT de outra zona aparece como travessia; NAT sem saída, riscado', () => {
    const sol = routeTableSolution(PONTO_CERTO_ROUTES)
    const d = routeDiagram(PONTO_CERTO_ROUTES, { tables: { ...sol.tables, 'app-b': { v4: 'nat-a', v6: 'eigw' }, 'pub-a': { v4: 'none', v6: 'none' } } })
    const l = d.links!.find((x) => x.from === 'sn-app-b' && x.to === 'nat-a')!
    expect(l).toMatchObject({ crossed: true, tone: 'danger', label: 'outra zona' })
  })
})
