import { describe, expect, it } from 'vitest'
import { drSolution, evaluateDrLab, type DrLabConfig } from './lab'
import { cheapestStrategy, meets, standbyMonthly, STRATEGIES, type DrWorkload } from './model'

const w: DrWorkload = { instanceType: 'm7g.large', instances: 8, dbClass: 'db.r7g.large', dataGB: 500 }

describe('estratégias de recuperação', () => {
  it('escolhe a mais barata que cumpre as duas metas', () => {
    expect(cheapestStrategy(24 * 60, 24 * 60)).toBe('backup-restore')
    expect(cheapestStrategy(30, 60)).toBe('pilot-light')
    expect(cheapestStrategy(30, 20)).toBe('warm-standby')
    expect(cheapestStrategy(0, 0)).toBe('multi-site')
  })
  it('quem cumpre uma meta mais rígida cumpre as mais folgadas', () => {
    expect(meets('warm-standby', 15, 60)).toBe(true)
    expect(meets('pilot-light', 5, 60)).toBe(false)
  })
  it('o custo cresce de uma estratégia para a seguinte', () => {
    const costs = STRATEGIES.map((s) => standbyMonthly(s, w))
    for (let i = 1; i < costs.length; i++) expect(costs[i]).toBeGreaterThan(costs[i - 1])
    expect(() => standbyMonthly('pilot-light', { ...w, dbClass: 'db.x9.huge' })).toThrow()
  })
})

describe('laboratório de recuperação', () => {
  const c: DrLabConfig = {
    systems: [
      { id: 'a', label: 'A', rpoMin: 1440, rtoMin: 1440, workload: w },
      { id: 'b', label: 'B', rpoMin: 5, rtoMin: 10, workload: w },
    ],
  }
  it('a solução chega a 100% e o vazio fica em 0', () => {
    expect(evaluateDrLab(c, drSolution(c)).score).toBe(1)
    expect(evaluateDrLab(c, { answers: {} }).score).toBe(0)
  })
})
