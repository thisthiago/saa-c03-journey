import { describe, expect, it } from 'vitest'
import { HOURS_PER_MONTH, instancePrice } from '../compute-prices'
import { bestOptions, segmentMonthly, SPOT_DISCOUNT, violations, type Segment } from './model'

const base: Segment = { id: 's', name: 's', description: '', type: 'm7g.large', count: 4, hoursPerDay: 24, interruptible: false, horizonMonths: 48 }
const OPTS = ['on-demand', 'spot', 'compute-sp-1yr', 'compute-sp-3yr', 'ec2-sp-3yr', 'ri-std-3yr', 'odcr'] as const

describe('custo por opção', () => {
  it('On-Demand cobra só as horas usadas; compromissos cobram o mês inteiro', () => {
    const peak = { ...base, hoursPerDay: 9 }
    const od = instancePrice('m7g.large').onDemandHour
    expect(segmentMonthly(peak, 'on-demand')).toBeCloseTo(4 * od * (9 / 24) * HOURS_PER_MONTH, 6)
    expect(segmentMonthly(peak, 'compute-sp-1yr')).toBeCloseTo(4 * instancePrice('m7g.large').savingsPlanHour['compute-1yr'] * HOURS_PER_MONTH, 6)
  })
  it('Spot aplica o desconto premissa', () => {
    expect(segmentMonthly(base, 'spot')).toBeCloseTo(segmentMonthly(base, 'on-demand') * (1 - SPOT_DISCOUNT), 6)
  })
})

describe('requisitos', () => {
  it('Spot não serve para carga que não aguenta interrupção', () => {
    expect(violations(base, 'spot')[0]).toContain('interrup')
  })
  it('compromisso não pode passar do horizonte da carga', () => {
    expect(violations({ ...base, horizonMonths: 18 }, 'compute-sp-3yr')[0]).toContain('3 ano')
    expect(violations({ ...base, horizonMonths: 18 }, 'compute-sp-1yr')).toEqual([])
  })
  it('só o Compute Savings Plan acompanha a migração para o Fargate', () => {
    const s = { ...base, fargateMigration: true }
    expect(violations(s, 'compute-sp-3yr')).toEqual([])
    expect(violations(s, 'ec2-sp-3yr')[0]).toContain('Fargate')
    expect(violations(s, 'ri-std-3yr')[0]).toContain('Fargate')
  })
  it('capacidade garantida pede Capacity Reservation ou RI zonal', () => {
    const s = { ...base, needsCapacity: true }
    expect(violations(s, 'compute-sp-3yr')[0]).toContain('capacidade')
    expect(violations(s, 'odcr')).toEqual([])
  })
})

describe('melhor opção', () => {
  it('base 24 h estável por anos: o compromisso de 3 anos preso à família vence', () => {
    expect(bestOptions(base, [...OPTS])).toEqual(expect.arrayContaining(['ec2-sp-3yr', 'ri-std-3yr']))
  })
  it('pico de 9 h por dia: On-Demand vence o compromisso de 24 h', () => {
    expect(bestOptions({ ...base, hoursPerDay: 9 }, [...OPTS])).toEqual(['on-demand'])
  })
  it('lote noturno interrompível: Spot', () => {
    expect(bestOptions({ ...base, hoursPerDay: 5, interruptible: true }, [...OPTS])).toEqual(['spot'])
  })
})
