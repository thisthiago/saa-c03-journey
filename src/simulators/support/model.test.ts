import { describe, expect, it } from 'vitest'
import { evaluateSupportLab } from './lab'
import { bestPlan, monthlyCost, planGaps, responseMinutes, type SupportScenario } from './model'

describe('planos de suporte', () => {
  it('custo pelas faixas oficiais (exemplos da página de preços)', () => {
    expect(monthlyCost('business-plus', 20_000)).toBe(1_600)
    expect(monthlyCost('enterprise', 750_000)).toBe(52_000)
    expect(monthlyCost('unified-ops', 1_500_000)).toBe(130_000)
    expect(monthlyCost('business-plus', 100)).toBe(29)
    expect(monthlyCost('enterprise', 10_000)).toBe(5_000)
    expect(monthlyCost('basic', 1_000_000)).toBe(0)
  })
  it('tempos de primeira resposta por plano', () => {
    expect(responseMinutes('basic', 'general')).toBeUndefined()
    expect(responseMinutes('business-plus', 'critical')).toBe(30)
    expect(responseMinutes('enterprise', 'critical')).toBe(15)
    expect(responseMinutes('unified-ops', 'critical')).toBe(5)
    expect(responseMinutes('enterprise', 'prod-down')).toBe(60)
  })
  it('o plano adequado é o mais barato que atende a tudo', () => {
    const s = (needs: SupportScenario['needs'], spend = 5_000): SupportScenario => ({ id: 'x', name: 'x', description: '', awsMonthlySpend: spend, needs })
    expect(bestPlan(s({}))).toBe('basic')
    expect(bestPlan(s({ technicalCases: true, prodDownWithinMin: 60 }))).toBe('business-plus')
    expect(bestPlan(s({ technicalCases: true, criticalWithinMin: 15, designatedTam: true }))).toBe('enterprise')
    expect(bestPlan(s({ technicalCases: true, criticalWithinMin: 5 }, 900_000))).toBe('unified-ops')
    expect(planGaps('basic', { technicalCases: true })[0]).toMatch(/casos técnicos/)
  })
  it('plano mais caro que atende vale metade: excesso não é acerto', () => {
    const sc: SupportScenario = { id: 'p', name: 'Produção', description: '', awsMonthlySpend: 8_000, needs: { technicalCases: true, prodDownWithinMin: 60 } }
    const r = evaluateSupportLab({ scenarios: [sc], plans: ['basic', 'business-plus', 'enterprise', 'unified-ops'] }, { choices: { p: 'enterprise' } })
    expect(r.score).toBe(0.5)
  })
})
