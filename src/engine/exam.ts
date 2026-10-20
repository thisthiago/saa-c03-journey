/**
 * Banco de questões no estilo do exame SAA-C03: correção (tudo ou nada),
 * filtros, montagem de treinos e simulados e resumo do resultado.
 *
 * Formato do exame conferido em 19/10/2026:
 * - Guia do exame: múltipla escolha (1 correta e 3 distratores) e resposta
 *   múltipla (2 ou mais corretas entre 5 ou mais opções); 50 questões
 *   pontuadas e 15 não pontuadas; questão sem resposta conta como errada;
 *   nota escalonada de 100 a 1.000, mínimo 720.
 *   https://docs.aws.amazon.com/aws-certification/latest/solutions-architect-associate-03/solutions-architect-associate-03.html
 * - Página da certificação: 65 questões em 130 minutos.
 *   https://aws.amazon.com/certification/certified-solutions-architect-associate/
 */
import { shuffled } from '../activities/shared/util'
import type { QuestionRef, Registry } from './registry'
import type { ExamDomainId, ExamQuestion, ProgressState } from './types'

export const EXAM_FORMAT = { questions: 65, scored: 50, minutes: 130, minScore: 720 } as const
/** Ritmo do exame: 130 minutos para 65 questões. */
export const SECONDS_PER_QUESTION = (EXAM_FORMAT.minutes * 60) / EXAM_FORMAT.questions

export const DIFFICULTY_LABEL: Record<ExamQuestion['difficulty'], string> = { 1: 'Fácil', 2: 'Média', 3: 'Difícil' }

export function correctOptionIds(q: ExamQuestion): string[] {
  return q.options.filter((o) => o.correct).map((o) => o.id)
}

export function isMultiple(q: ExamQuestion): boolean {
  return correctOptionIds(q).length > 1
}

/** Tudo ou nada: o conjunto marcado precisa ser exatamente o das corretas. */
export function isQuestionCorrect(q: ExamQuestion, selected: string[]): boolean {
  const right = new Set(correctOptionIds(q))
  const chosen = new Set(selected)
  return chosen.size === right.size && [...chosen].every((id) => right.has(id))
}

export type QuestionStatus = 'nova' | 'acertou' | 'errou'

export const STATUS_LABEL: Record<QuestionStatus, string> = { nova: 'Nunca respondida', acertou: 'Acertou da última vez', errou: 'Errou da última vez' }

export function questionStatus(progress: ProgressState, questionId: string): QuestionStatus {
  const qp = progress.exam.questions[questionId]
  if (!qp) return 'nova'
  return qp.lastCorrect ? 'acertou' : 'errou'
}

export interface QuestionFilter {
  track?: string
  difficulty?: ExamQuestion['difficulty']
  domain?: ExamDomainId
  concept?: string
  status?: QuestionStatus
}

export function questionConcepts(q: ExamQuestion): string[] {
  return [q.concept, ...(q.related ?? [])]
}

export function filterQuestions(reg: Registry, progress: ProgressState, f: QuestionFilter): QuestionRef[] {
  return [...reg.questions.values()].filter(
    ({ question: q, track }) =>
      (!f.track || track?.id === f.track) &&
      (!f.difficulty || q.difficulty === f.difficulty) &&
      (!f.domain || q.domain === f.domain) &&
      (!f.concept || questionConcepts(q).includes(f.concept)) &&
      (!f.status || questionStatus(progress, q.id) === f.status),
  )
}

/** Treino: primeiro as que você errou, depois as novas e por último as que já acertou. */
export function practiceOrder(refs: QuestionRef[], progress: ProgressState, seed: string): QuestionRef[] {
  const rank: Record<QuestionStatus, number> = { errou: 0, nova: 1, acertou: 2 }
  const mixed = shuffled(refs, seed)
  return mixed
    .map((r, i) => ({ r, i, k: rank[questionStatus(progress, r.question.id)] }))
    .sort((a, b) => a.k - b.k || a.i - b.i)
    .map((x) => x.r)
}

/** Simulado: amostra aleatória do conjunto filtrado. */
export function simuladoSample(refs: QuestionRef[], size: number, seed: string): QuestionRef[] {
  return shuffled(refs, seed).slice(0, Math.max(1, size))
}

export interface AnsweredQuestion {
  question: ExamQuestion
  /** Vazio quando a questão ficou sem resposta (conta como errada). */
  selected: string[]
}

export interface Tally {
  total: number
  correct: number
}

export interface AttemptSummary extends Tally {
  unanswered: number
  byDomain: ({ domain: ExamDomainId } & Tally)[]
  byDifficulty: ({ difficulty: ExamQuestion['difficulty'] } & Tally)[]
  /** Conceitos principais das questões erradas, do mais errado para o menos. */
  weakConcepts: { conceptId: string; wrong: number; total: number }[]
}

export function summarizeAttempt(answers: AnsweredQuestion[]): AttemptSummary {
  const byDomain = new Map<ExamDomainId, Tally>()
  const byDifficulty = new Map<ExamQuestion['difficulty'], Tally>()
  const concepts = new Map<string, { wrong: number; total: number }>()
  let correct = 0
  let unanswered = 0
  for (const { question: q, selected } of answers) {
    const ok = isQuestionCorrect(q, selected)
    if (ok) correct++
    if (selected.length === 0) unanswered++
    const d = byDomain.get(q.domain) ?? { total: 0, correct: 0 }
    byDomain.set(q.domain, { total: d.total + 1, correct: d.correct + (ok ? 1 : 0) })
    const k = byDifficulty.get(q.difficulty) ?? { total: 0, correct: 0 }
    byDifficulty.set(q.difficulty, { total: k.total + 1, correct: k.correct + (ok ? 1 : 0) })
    const c = concepts.get(q.concept) ?? { wrong: 0, total: 0 }
    concepts.set(q.concept, { wrong: c.wrong + (ok ? 0 : 1), total: c.total + 1 })
  }
  return {
    total: answers.length,
    correct,
    unanswered,
    byDomain: [...byDomain].map(([domain, t]) => ({ domain, ...t })).sort((a, b) => a.domain.localeCompare(b.domain)),
    byDifficulty: [...byDifficulty].map(([difficulty, t]) => ({ difficulty, ...t })).sort((a, b) => a.difficulty - b.difficulty),
    weakConcepts: [...concepts]
      .filter(([, c]) => c.wrong > 0)
      .map(([conceptId, c]) => ({ conceptId, ...c }))
      .sort((a, b) => b.wrong - a.wrong || a.conceptId.localeCompare(b.conceptId)),
  }
}

export interface BankStats {
  total: number
  answered: number
  /** Questões cuja última resposta foi correta. */
  rightNow: number
  wrongNow: number
}

export function bankStats(reg: Registry, progress: ProgressState): BankStats {
  let answered = 0
  let rightNow = 0
  for (const id of reg.questions.keys()) {
    const qp = progress.exam.questions[id]
    if (!qp) continue
    answered++
    if (qp.lastCorrect) rightNow++
  }
  return { total: reg.questions.size, answered, rightNow, wrongNow: answered - rightNow }
}
