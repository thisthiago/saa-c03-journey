import { describe, expect, it } from 'vitest'
import { businessDay, defaultTerminationOrder, evaluatePolicies, simulateDay, type DayScenario } from './model'

describe('avaliação das políticas', () => {
  it('nunca passa do max nem fica abaixo do min (exemplos 1 e 2 da documentação)', () => {
    expect(evaluatePolicies({ current: 2, min: 1, max: 3 }, 0.9, [{ kind: 'change', add: 3 }]).desired).toBe(3)
    expect(evaluatePolicies({ current: 3, min: 2, max: 10 }, 0.1, [{ kind: 'change', add: -2 }]).desired).toBe(2)
  })
  it('com várias políticas, vence a que deixa mais capacidade, para crescer e para encolher', () => {
    expect(evaluatePolicies({ current: 4, min: 1, max: 20 }, 0.95, [{ kind: 'change', add: 1 }, { kind: 'change', add: 2 }]).desired).toBe(6)
    // 8 instâncias: uma política remove 3, outra remove 25% (2): fica a que deixa mais (6).
    expect(evaluatePolicies({ current: 8, min: 1, max: 20 }, 0.1, [{ kind: 'change', add: -3 }, { kind: 'change', add: -2 }]).desired).toBe(6)
  })
  it('target tracking é proporcional à métrica', () => {
    expect(evaluatePolicies({ current: 4, min: 1, max: 20 }, 0.9, [{ kind: 'target-tracking', target: 0.6 }]).desired).toBe(6)
  })
})

describe('política de término padrão', () => {
  it('equilibra as AZs antes de olhar a configuração', () => {
    const r = defaultTerminationOrder(
      [
        { id: 'i-a1', az: 'a', config: 'lc', minutesToNextHour: 30 },
        { id: 'i-b1', az: 'b', config: 'web@3', minutesToNextHour: 10 },
        { id: 'i-b2', az: 'b', config: 'web@2', minutesToNextHour: 50 },
      ],
      'web',
      3,
    )
    expect(r.victim.id).toBe('i-b2')
  })
  it('launch configuration sai antes de launch template; empate vai para a mais próxima da hora de cobrança', () => {
    expect(defaultTerminationOrder([{ id: 'x', az: 'a', config: 'web@1', minutesToNextHour: 5 }, { id: 'y', az: 'a', config: 'lc', minutesToNextHour: 40 }], 'web', 1).victim.id).toBe('y')
    expect(defaultTerminationOrder([{ id: 'x', az: 'a', config: 'web@1', minutesToNextHour: 25 }, { id: 'y', az: 'a', config: 'web@1', minutesToNextHour: 5 }], 'web', 1).victim.id).toBe('y')
  })
})

describe('um dia de escalonamento', () => {
  const sc: DayScenario = { demand: businessDay({ base: 200, peak: 1000, from: 9, to: 18, rampMin: 30 }), capacityPerInstance: 100, type: 'm7g.large', warmupMin: 10 }
  it('sem política, o grupo fixo não atende ao pico', () => {
    expect(simulateDay(sc, { min: 3, max: 20, desired: 3, policy: 'none' }).unmetPct).toBeGreaterThan(0.3)
  })
  it('target tracking acompanha a demanda e o predictive antecipa a rampa', () => {
    const tt = simulateDay(sc, { min: 3, max: 20, desired: 3, policy: 'target-tracking', target: 0.7 })
    const pr = simulateDay(sc, { min: 3, max: 20, desired: 3, policy: 'target-tracking', target: 0.7, predictive: true })
    expect(tt.unmetPct).toBeLessThan(0.05)
    expect(pr.unmetPct).toBeLessThan(tt.unmetPct)
    expect(tt.peakInService).toBeGreaterThanOrEqual(15)
  })
  it('o max limita o crescimento', () => {
    expect(simulateDay(sc, { min: 3, max: 6, desired: 3, policy: 'target-tracking', target: 0.7 }).peakInService).toBe(6)
  })
  it('ação agendada muda a capacidade no horário marcado', () => {
    const r = simulateDay(sc, { min: 3, max: 20, desired: 3, policy: 'none', scheduled: [{ hour: 8, desired: 12 }, { hour: 19, desired: 3 }] })
    expect(r.steps[8 * 12 + 3].inService).toBe(12)
    expect(r.steps[20 * 12].inService).toBe(3)
  })
})
