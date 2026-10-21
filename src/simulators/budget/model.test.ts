import { describe, expect, it } from 'vitest'
import { allocate, alertFirings, cumulative, dailyTotals, firstAlertDay, forecastAt, UNALLOCATED, type SpendStream } from './model'

const stream = (id: string, account: string, daily: number, tags: Record<string, string> = {}, spike?: SpendStream['spike']): SpendStream => ({ id, account, service: 'EC2', tags, daily, spike })

describe('gasto diário e alertas de orçamento', () => {
  const loja = [stream('a', 'loja', 100, { CostCenter: 'loja' }, { from: 12, daily: 220 })]
  const daily = dailyTotals(loja, { account: 'loja' }, 30)

  it('soma o gasto diário e acumula o mês', () => {
    expect(daily.slice(0, 11).every((v) => v === 100)).toBe(true)
    expect(daily[11]).toBe(220)
    expect(cumulative(daily).at(-1)).toBe(11 * 100 + 19 * 220)
  })

  it('a previsão é uma projeção linear do gasto até o dia', () => {
    const cum = cumulative(daily)
    expect(forecastAt(cum, 10)).toBe(3000)
    expect(forecastAt(cum, 12)).toBe(3300)
  })

  it('alerta de previsto a 80% de US$ 4.000 dispara no dia 12; a 100%, no dia 16', () => {
    const [a80, a100] = alertFirings(daily, 4000, [{ kind: 'forecast', pct: 80 }, { kind: 'forecast', pct: 100 }])
    expect(a80.day).toBe(12)
    expect(a100.day).toBe(16)
  })

  it('alerta de valor real só dispara quando o gasto acumulado chega ao limite', () => {
    expect(firstAlertDay(daily, 4000, [{ kind: 'actual', pct: 100 }])).toBe(25)
    expect(firstAlertDay(daily, 4000, [{ kind: 'actual', pct: 80 }])).toBe(21)
  })

  it('um alerta de previsto muito baixo dispara já no primeiro dia, num mês normal', () => {
    const normal = dailyTotals([stream('n', 'loja', 100)], {}, 30)
    expect(firstAlertDay(normal, 4000, [{ kind: 'forecast', pct: 50 }])).toBe(1)
    expect(firstAlertDay(normal, 4000, [{ kind: 'forecast', pct: 80 }])).toBeUndefined()
  })

  it('filtra por conta e por tag', () => {
    const all = [stream('a', 'loja', 10, { CostCenter: 'loja' }), stream('b', 'loja', 5), stream('c', 'dados', 7, { CostCenter: 'loja' })]
    expect(dailyTotals(all, { account: 'loja' }, 1)).toEqual([15])
    expect(dailyTotals(all, { tag: { key: 'CostCenter', value: 'loja' } }, 1)).toEqual([17])
  })
})

describe('alocação por tags de alocação de custo', () => {
  const all = [stream('a', 'x', 10, { CostCenter: 'loja' }), stream('b', 'x', 6, { costcenter: 'loja' }), stream('c', 'x', 4)]
  it('sem tags ativadas, todo o custo fica sem alocação', () => {
    const r = allocate(all, [], 30)
    expect(r.unallocated).toBe(r.total)
  })
  it('as chaves diferenciam maiúsculas de minúsculas: ativar uma só deixa o resto sem alocação', () => {
    const r = allocate(all, ['CostCenter'], 30)
    expect(r.groups['CostCenter=loja']).toBe(300)
    expect(r.unallocated).toBe(30 * (6 + 4))
    expect(allocate(all, ['CostCenter', 'costcenter'], 30).unallocated).toBe(30 * 4)
  })
  it('o custo sem tag aparece como "Não alocado"', () => {
    expect(Object.keys(allocate(all, ['CostCenter', 'costcenter'], 30).groups)).toContain(UNALLOCATED)
  })
})
