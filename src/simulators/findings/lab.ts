/** Laboratório "A fila de achados": a origem de cada achado e a ação certa para ele. */
import { evaluateGrid, gridComplete, gridSolution, type GridColumn, type GridExpected, type GridResponse, type GridRow } from '../shared/grid'
import { SOURCE_LABEL, sourceOf, type FindingSource } from './model'

export interface LabFinding {
  id: string
  /** Tipo do achado no formato do serviço. */
  type: string
  /** Recurso afetado e o que foi visto (RichText). */
  detail: string
  /** Ação certa (id de `actions`) e o porquê. */
  action: string
  why: string
  concepts?: string[]
}

export interface FindingsLabConfig {
  findings: LabFinding[]
  actions: { id: string; label: string }[]
  /** Serviços oferecidos na coluna de origem (padrão: todos). */
  sources?: FindingSource[]
}

export type FindingsLabResponse = GridResponse

export function findingsColumns(c: FindingsLabConfig): GridColumn[] {
  const sources = c.sources ?? (Object.keys(SOURCE_LABEL) as FindingSource[])
  return [
    { id: 'source', label: 'Quem gerou', options: sources.map((id) => ({ id, label: SOURCE_LABEL[id] })) },
    { id: 'action', label: 'O que fazer', options: c.actions },
  ]
}

export const findingsRows = (c: FindingsLabConfig): GridRow[] => c.findings.map((f) => ({ id: f.id, label: `\`${f.type}\``, detail: f.detail, concepts: f.concepts }))

export function findingsExpected(c: FindingsLabConfig) {
  return (row: GridRow): Record<string, GridExpected> => {
    const f = c.findings.find((x) => x.id === row.id)!
    const s = sourceOf(f.type)
    return { source: { answer: s.source, why: s.why }, action: { answer: f.action, why: f.why } }
  }
}

export const findingsSolution = (c: FindingsLabConfig) => gridSolution(findingsColumns(c), findingsRows(c), findingsExpected(c))
export const evaluateFindingsLab = (c: FindingsLabConfig, r: FindingsLabResponse) => evaluateGrid(findingsColumns(c), findingsRows(c), findingsExpected(c), r)
export const findingsComplete = (c: FindingsLabConfig, r: FindingsLabResponse) => gridComplete(findingsColumns(c), findingsRows(c), r)
