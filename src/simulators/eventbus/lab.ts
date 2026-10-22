/**
 * Laboratórios de filtro: para cada regra do EventBridge (ou assinatura do
 * SNS), escolher na paleta o padrão que deixa passar exatamente os eventos
 * (ou mensagens) que aquele destino deve receber.
 */
import { evaluateGrid, gridComplete, gridSolution, type GridColumn, type GridExpected, type GridResponse, type GridRow } from '../shared/grid'
import { matches, patternText, type EventData, type Pattern } from './pattern'

export interface FilterItem {
  id: string
  label: string
  data: EventData
}

export interface FilterTarget {
  id: string
  /** Quem recebe (ex.: "fila do faturamento"). */
  label: string
  /** O que esse destino precisa receber (RichText). */
  need: string
  /** Ids dos itens que devem chegar. */
  wants: string[]
  concepts?: string[]
}

export interface FilterLabConfig {
  items: FilterItem[]
  palette: { id: string; pattern: Pattern | null }[]
  targets: FilterTarget[]
}

export type FilterLabResponse = GridResponse

/** Itens que um padrão deixa passar (sem padrão, tudo passa). */
export const delivered = (c: FilterLabConfig, p: Pattern | null) => c.items.filter((i) => !p || matches(p, i.data)).map((i) => i.id)

const optionLabel = (p: Pattern | null) => (p ? patternText(p) : 'sem filtro (recebe tudo)')

export const filterColumns = (c: FilterLabConfig): GridColumn[] => [{ id: 'pattern', label: 'Padrão', options: c.palette.map((p) => ({ id: p.id, label: optionLabel(p.pattern) })) }]

export const filterRows = (c: FilterLabConfig): GridRow[] => c.targets.map((t) => ({ id: t.id, label: `**${t.label}**`, detail: t.need, concepts: t.concepts }))

const same = (a: string[], b: string[]) => a.length === b.length && a.every((x) => b.includes(x))

/** O padrão certo de cada destino: o único da paleta que entrega exatamente o que ele quer. */
export function filterExpected(c: FilterLabConfig) {
  return (row: GridRow): Record<string, GridExpected> => {
    const t = c.targets.find((x) => x.id === row.id)!
    const ok = c.palette.filter((p) => same(delivered(c, p.pattern), t.wants))
    if (ok.length !== 1) throw new Error(`Destino ${t.id}: ${ok.length} padrões entregam exatamente o pedido`)
    const names = t.wants.map((w) => c.items.find((i) => i.id === w)!.label)
    return { pattern: { answer: ok[0].id, why: `Esse padrão entrega exatamente ${names.length ? names.join(', ') : 'nada'}.` } }
  }
}

export const filterSolution = (c: FilterLabConfig) => gridSolution(filterColumns(c), filterRows(c), filterExpected(c))
export const evaluateFilterLab = (c: FilterLabConfig, r: FilterLabResponse) => evaluateGrid(filterColumns(c), filterRows(c), filterExpected(c), r)
export const filterComplete = (c: FilterLabConfig, r: FilterLabResponse) => gridComplete(filterColumns(c), filterRows(c), r)
