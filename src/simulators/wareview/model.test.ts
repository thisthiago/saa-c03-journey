import { describe, expect, it } from 'vitest'
import { evaluateWaReviewLab, waReviewSolution, type WaReviewLabConfig } from './lab'
import { BEST_PRACTICES, bestPractice, improvementOrder } from './model'

describe('boas práticas da revisão', () => {
  it('todas as boas práticas têm página do framework e o prefixo do pilar', () => {
    const prefix = { ops: 'OPS', security: 'SEC', reliability: 'REL', performance: 'PERF', cost: 'COST', sustainability: 'SUS' }
    for (const b of Object.values(BEST_PRACTICES)) {
      expect(b.url).toMatch(/^https:\/\/docs\.aws\.amazon\.com\/wellarchitected\/latest\/framework\//)
      expect(b.id.startsWith(prefix[b.pillar])).toBe(true)
    }
  })
  it('o plano de melhoria começa pelos riscos altos', () => {
    expect(improvementOrder(['COST06-BP03', 'REL08-BP04', 'REL10-BP01'])).toEqual(['REL10-BP01', 'REL08-BP04', 'COST06-BP03'])
    expect(() => bestPractice('XYZ01-BP01')).toThrow()
  })
})

describe('laboratório de revisão', () => {
  const c: WaReviewLabConfig = { findings: [{ id: 'a', bp: 'REL10-BP01', text: 'Tudo numa AZ' }, { id: 'b', bp: 'SUS02-BP01', text: 'Capacidade fixa' }] }
  it('a solução chega a 100% e o vazio fica em 0', () => {
    expect(evaluateWaReviewLab(c, waReviewSolution(c)).score).toBe(1)
    expect(evaluateWaReviewLab(c, { answers: {} }).score).toBe(0)
  })
  it('acertar só o pilar vale metade', () => {
    expect(evaluateWaReviewLab(c, { answers: { a: { pillar: 'reliability', risk: 'low' }, b: { pillar: 'sustainability', risk: 'high' } } }).score).toBe(0.5)
  })
})
