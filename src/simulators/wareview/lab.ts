/**
 * Laboratório "A revisão Well-Architected": para cada achado da revisão, o
 * pilar da boa prática que falta e o nível de risco que a AWS atribui a ela.
 */
import { evaluateGrid, gridComplete, gridSolution, type GridColumn, type GridExpected, type GridResponse, type GridRow } from '../shared/grid'
import { bestPractice, PILLAR_LABEL, RISK_LABEL, type Pillar, type Risk } from './model'

export interface WaFinding {
  id: string
  /** Boa prática que a carga não segue (ex.: "REL10-BP01"). */
  bp: string
  /** O que a revisão encontrou, em linguagem do cenário (RichText). */
  text: string
  concepts?: string[]
}

export interface WaReviewLabConfig {
  findings: WaFinding[]
}

export type WaReviewLabResponse = GridResponse

export const waReviewColumns = (): GridColumn[] => [
  { id: 'pillar', label: 'Pilar', options: (Object.keys(PILLAR_LABEL) as Pillar[]).map((p) => ({ id: p, label: PILLAR_LABEL[p] })) },
  { id: 'risk', label: 'Risco se não for seguida', options: (['high', 'medium', 'low'] as Risk[]).map((r) => ({ id: r, label: RISK_LABEL[r] })) },
]

export const waReviewRows = (c: WaReviewLabConfig): GridRow[] => c.findings.map((f) => ({ id: f.id, label: f.text, concepts: f.concepts }))

export function waReviewExpected(c: WaReviewLabConfig) {
  return (row: GridRow): Record<string, GridExpected> => {
    const f = c.findings.find((x) => x.id === row.id)!
    const b = bestPractice(f.bp)
    return {
      pillar: { answer: b.pillar, why: `A boa prática que falta é ${b.id}, "${b.title}", do pilar ${PILLAR_LABEL[b.pillar]}.` },
      risk: { answer: b.risk, why: `A página da ${b.id} classifica como ${RISK_LABEL[b.risk].toLowerCase()} o risco de não segui-la.` },
    }
  }
}

export const waReviewSolution = (c: WaReviewLabConfig) => gridSolution(waReviewColumns(), waReviewRows(c), waReviewExpected(c))
export const evaluateWaReviewLab = (c: WaReviewLabConfig, r: WaReviewLabResponse) => evaluateGrid(waReviewColumns(), waReviewRows(c), waReviewExpected(c), r)
export const waReviewComplete = (c: WaReviewLabConfig, r: WaReviewLabResponse) => gridComplete(waReviewColumns(), waReviewRows(c), r)
