/** Laboratório do desafio final: o projeto em etapas, avaliado por rubrica. */
import type { ItemFeedback } from '../../engine/types'
import { bestAnswers, evaluateArchitecture, type ArchAnswers, type ArchConfig } from './model'

export type ArchitectureLabConfig = ArchConfig

export interface ArchitectureLabResponse {
  answers: ArchAnswers
  step: number
}

export const architectureSolution = (c: ArchConfig): ArchitectureLabResponse => ({ answers: bestAnswers(c), step: c.steps.length - 1 })

export function architectureComplete(c: ArchConfig, r: ArchitectureLabResponse): boolean {
  return c.steps.every((s) => s.questions.every((q) => Boolean(r.answers?.[q.id])))
}

export function evaluateArchitectureLab(c: ArchConfig, r: ArchitectureLabResponse) {
  const res = evaluateArchitecture(c, r.answers ?? {})
  const items: { concepts?: string[]; score: number; fb: ItemFeedback }[] = res.picks.map((p) => ({
    concepts: p.option?.concepts,
    score: p.value,
    fb: {
      id: p.question.id,
      label: `${p.question.prompt} → ${p.option?.label ?? 'sem resposta'}`,
      status: p.value >= 0.8 ? 'correct' : p.value >= 0.5 ? 'partial' : 'wrong',
      message: p.option?.consequence ?? 'Pergunta sem resposta.',
    },
  }))
  for (const risk of res.risks) {
    items.push({ concepts: risk.concepts, score: 0, fb: { id: `risk-${risk.id}`, label: 'Risco entre etapas', status: 'wrong', message: risk.message } })
  }
  for (const { id: d, label } of c.dimensions) {
    const v = res.dimensions[d]
    items.push({ score: v, fb: { id: `dim-${d}`, label: `${label}: ${Math.round(v * 100)}%`, status: v >= 0.8 ? 'correct' : v >= c.minDimension ? 'partial' : 'wrong', message: v >= c.minDimension ? 'Dentro do esperado.' : `Abaixo do mínimo de ${Math.round(c.minDimension * 100)}% nesta dimensão.` } })
  }
  return { score: res.score, items }
}
