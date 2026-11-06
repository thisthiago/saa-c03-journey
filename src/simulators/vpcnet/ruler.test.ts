import { describe, expect, it } from 'vitest'
import { PONTO_CERTO_PLAN } from '../../content/modules/network/phases/f01/phase'
import { vpcPlannerSolution } from './planner'
import { rulerModel } from './ruler'

describe('régua de endereços', () => {
  it('sem bloco aceito, não desenha', () => {
    expect(rulerModel(PONTO_CERTO_PLAN, { vpc: '', subnets: {} })).toBeNull()
    expect(rulerModel(PONTO_CERTO_PLAN, { vpc: '10.0.0.0/8', subnets: {} })).toBeNull()
  })

  it('o plano de referência ocupa uma linha só, sem sobreposição', () => {
    const m = rulerModel(PONTO_CERTO_PLAN, vpcPlannerSolution(PONTO_CERTO_PLAN))!
    expect(m.lanes).toBe(1)
    expect(m.clashes).toEqual([])
    expect(m.segments.every((s) => s.problem === 'ok')).toBe(true)
    expect(m.ticks.map((t) => t.label)).toEqual(['10.40.0.0', '10.40.1.0', '10.40.2.0', '10.40.3.0'])
    expect(m.used).toBe(256 * 2 + 128 * 2 + 32 * 2)
  })

  it('sub-redes sobrepostas vão para linhas diferentes e marcam o trecho em comum', () => {
    const m = rulerModel(PONTO_CERTO_PLAN, { vpc: '10.40.0.0/22', subnets: { 'app-a': '10.40.0.0/24', 'web-a': '10.40.0.128/25', 'db-a': '10.50.0.0/27' } })!
    expect(m.lanes).toBe(2)
    expect(m.segments.find((s) => s.id === 'web-a')).toMatchObject({ lane: 1, problem: 'overlap', left: 12.5, width: 12.5 })
    expect(m.clashes).toEqual([{ left: 12.5, width: 12.5 }])
    expect(m.outside).toEqual([{ name: 'banco A', cidr: '10.50.0.0/27' }])
    expect(m.used).toBe(256)
  })

  it('marca a sub-rede pequena demais', () => {
    const m = rulerModel(PONTO_CERTO_PLAN, { vpc: '10.40.0.0/22', subnets: { 'app-a': '10.40.0.0/25' } })!
    expect(m.segments[0].problem).toBe('small')
  })
})
