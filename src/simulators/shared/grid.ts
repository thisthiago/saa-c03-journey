/**
 * Motor genérico dos laboratórios em grade: cada linha (um certificado, um
 * achado, um momento da rotação) recebe uma resposta em cada coluna, e o
 * simulador de cada trilha calcula a resposta certa e o porquê.
 *
 * A nota de uma linha é a fração de colunas certas; a do laboratório, a média
 * das linhas.
 */
import type { ItemFeedback } from '../../engine/types'

export interface GridColumn {
  id: string
  label: string
  options: { id: string; label: string }[]
}

export interface GridRow {
  id: string
  /** Rótulo curto da linha (RichText). */
  label: string
  /** Detalhes mostrados abaixo do rótulo (RichText). */
  detail?: string
  concepts?: string[]
}

/** Resposta certa de uma célula e a explicação calculada pelo simulador. */
export interface GridExpected {
  answer: string
  why: string
}

export interface GridResponse {
  answers: Record<string, Record<string, string> | undefined>
}

export const gridInitial = (): GridResponse => ({ answers: {} })

export const gridComplete = (columns: GridColumn[], rows: GridRow[], r: GridResponse) => rows.every((row) => columns.every((c) => r?.answers?.[row.id]?.[c.id]))

export function gridSolution(columns: GridColumn[], rows: GridRow[], expected: (row: GridRow) => Record<string, GridExpected>): GridResponse {
  return { answers: Object.fromEntries(rows.map((row) => [row.id, Object.fromEntries(columns.map((c) => [c.id, expected(row)[c.id].answer]))])) }
}

export function evaluateGrid(columns: GridColumn[], rows: GridRow[], expected: (row: GridRow) => Record<string, GridExpected>, r: GridResponse) {
  const label = (c: GridColumn, id: string) => c.options.find((o) => o.id === id)?.label ?? id
  const items = rows.map((row) => {
    const exp = expected(row)
    const given = r?.answers?.[row.id] ?? {}
    const right = columns.filter((c) => given[c.id] === exp[c.id].answer)
    const answered = columns.filter((c) => given[c.id])
    const score = right.length / columns.length
    const status: ItemFeedback['status'] = answered.length === 0 ? 'missed' : score === 1 ? 'correct' : score > 0 ? 'partial' : 'wrong'
    const message = columns
      .map((c) => (given[c.id] === exp[c.id].answer ? `${c.label}: ${label(c, exp[c.id].answer)}. ${exp[c.id].why}` : `${c.label}: ${given[c.id] ? `você marcou ${label(c, given[c.id])}, mas` : 'sem resposta;'} o certo é ${label(c, exp[c.id].answer)}. ${exp[c.id].why}`))
      .join(' ')
    return { concepts: row.concepts, score, fb: { id: row.id, label: row.label, status, message } as ItemFeedback }
  })
  return { score: items.reduce((s, x) => s + x.score, 0) / Math.max(1, items.length), items }
}
