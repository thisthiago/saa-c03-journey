import { describe, expect, it } from 'vitest'
import { analyticsPrices } from '../analytics-prices'
import { evaluateLakeLab, lakeInitial, lakeSolution, type LakeLabConfig } from './lab'
import { bestLayout, layoutMonthly, layoutProblems, partitionFraction, queryCost, scannedGB, storedGB, type LakeTable } from './model'

/** O exemplo da página de preços do Athena: 3 TB em texto, quatro colunas do mesmo tamanho, consulta de uma coluna. */
const EXEMPLO: LakeTable = {
  id: 'ex',
  name: 'Exemplo da AWS',
  description: '',
  csvGB: 3 * 1024,
  days: 360,
  stores: 10,
  columns: ['a', 'b', 'c', 'd'].map((id) => ({ id, label: id, share: 0.25 })),
  queries: [{ id: 'q', label: 'uma coluna', perMonth: 1, columns: ['a'] }],
}
const Q = EXEMPLO.queries[0]
const perTB = analyticsPrices().athena.perTBScanned

describe('simulador do data lake', () => {
  it('reproduz o exemplo de preço do Athena: texto, GZIP e formato colunar', () => {
    expect(queryCost(scannedGB(EXEMPLO, { format: 'csv', compression: 'none', partition: 'none' }, Q))).toBeCloseTo(3 * perTB)
    expect(queryCost(scannedGB(EXEMPLO, { format: 'csv', compression: 'gzip', partition: 'none' }, Q))).toBeCloseTo(1 * perTB)
    expect(queryCost(scannedGB(EXEMPLO, { format: 'parquet', compression: 'gzip', partition: 'none' }, Q))).toBeCloseTo(0.25 * perTB)
  })

  it('cobra no mínimo 10 MB por consulta, arredondando ao megabyte', () => {
    expect(queryCost(0)).toBeCloseTo((10 / 1024 / 1024) * perTB)
    expect(queryCost(10.5 / 1024)).toBeCloseTo((11 / 1024 / 1024) * perTB)
  })

  it('a partição só reduz a leitura quando a consulta filtra por ela', () => {
    const lastWeek = { ...Q, days: 7 }
    expect(partitionFraction(EXEMPLO, 'day', lastWeek)).toBeCloseTo(7 / 360)
    expect(partitionFraction(EXEMPLO, 'month', lastWeek)).toBeCloseTo(30 / 360)
    expect(partitionFraction(EXEMPLO, 'day', Q)).toBe(1)
    expect(partitionFraction(EXEMPLO, 'day-store', { ...lastWeek, oneStore: true })).toBeCloseTo(7 / 360 / 10)
  })

  it('o JSON ocupa mais que o CSV e a compressão reduz o tamanho guardado', () => {
    expect(storedGB(EXEMPLO, { format: 'json', compression: 'none', partition: 'none' })).toBeGreaterThan(storedGB(EXEMPLO, { format: 'csv', compression: 'none', partition: 'none' }))
    expect(storedGB(EXEMPLO, { format: 'csv', compression: 'zstd', partition: 'none' })).toBeCloseTo(1024)
  })

  it('aponta partição demais quando os arquivos ficam pequenos', () => {
    const small = { ...EXEMPLO, csvGB: 50 }
    expect(layoutProblems(small, { format: 'parquet', compression: 'snappy', partition: 'day-store' })).toHaveLength(1)
    expect(layoutProblems(small, { format: 'parquet', compression: 'snappy', partition: 'none' })).toEqual([])
  })

  it('o melhor layout é colunar e comprimido, e soma armazenamento e consultas', () => {
    const best = bestLayout(EXEMPLO)
    expect(['parquet', 'orc']).toContain(best.layout.format)
    expect(best.layout.compression === 'gzip' || best.layout.compression === 'zstd').toBe(true)
    const c = layoutMonthly(EXEMPLO, best.layout)
    expect(c.total).toBeCloseTo(c.storage + c.athena)
  })

  it('a solução do laboratório chega a 100% e o estado inicial fica abaixo', () => {
    const config: LakeLabConfig = { tables: [EXEMPLO] }
    expect(evaluateLakeLab(config, lakeSolution(config)).score).toBe(1)
    expect(evaluateLakeLab(config, lakeInitial(config)).score).toBeLessThan(0.7)
  })
})
