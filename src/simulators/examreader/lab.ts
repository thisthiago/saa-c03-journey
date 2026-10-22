/** Laboratório "Leia como o exame": veredito e motivo de cada alternativa de um enunciado. */
import { evaluateGrid, gridComplete, gridSolution, type GridColumn, type GridExpected, type GridResponse, type GridRow } from '../shared/grid'
import { judge, missing, VERDICT_LABEL, type ExamScenario, type Verdict } from './model'

export interface ExamReaderLabConfig extends ExamScenario {
  /** Conceitos avaliados em cada alternativa. */
  concepts?: string[]
}

export type ExamReaderLabResponse = GridResponse

export const examReaderColumns = (c: ExamReaderLabConfig): GridColumn[] => [
  { id: 'verdict', label: 'Veredito', options: (Object.keys(VERDICT_LABEL) as Verdict[]).map((v) => ({ id: v, label: VERDICT_LABEL[v] })) },
  {
    id: 'reason',
    label: 'O que decide',
    options: [{ id: 'none', label: 'Cumpre tudo e vence no requisito decisivo' }, ...c.constraints.map((r) => ({ id: r.id, label: `Falha em: ${r.label}` })), { id: c.decisive.id, label: `Perde em: ${c.decisive.label}` }],
  },
]

export const examReaderRows = (c: ExamReaderLabConfig): GridRow[] => c.alternatives.map((a) => ({ id: a.id, label: `**${a.id}.** ${a.text}`, concepts: c.concepts }))

export function examReaderExpected(c: ExamReaderLabConfig) {
  return (row: GridRow): Record<string, GridExpected> => {
    const a = c.alternatives.find((x) => x.id === row.id)!
    const j = judge(c, a)
    const miss = missing(c, a)
    const why =
      j.verdict === 'fails'
        ? `Elimine: não cumpre "${miss.map((m) => m.label).join('" nem "')}".`
        : j.verdict === 'works'
          ? `Cumpre as restrições, mas outra alternativa vence em "${c.decisive.label}".`
          : `Cumpre todas as restrições e é a melhor em "${c.decisive.label}".`
    return { verdict: { answer: j.verdict, why }, reason: { answer: j.reason, why } }
  }
}

export const examReaderSolution = (c: ExamReaderLabConfig) => gridSolution(examReaderColumns(c), examReaderRows(c), examReaderExpected(c))
export const evaluateExamReaderLab = (c: ExamReaderLabConfig, r: ExamReaderLabResponse) => evaluateGrid(examReaderColumns(c), examReaderRows(c), examReaderExpected(c), r)
export const examReaderComplete = (c: ExamReaderLabConfig, r: ExamReaderLabResponse) => gridComplete(examReaderColumns(c), examReaderRows(c), r)
