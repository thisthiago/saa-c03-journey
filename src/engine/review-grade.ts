/**
 * Nota de 0 a 10 de uma rodada da Revisão ou do Treino livre.
 *
 * Cada item vale de 0 a 1 pela combinação de acerto e confiança declarada
 * (acertar com certeza vale mais que acertar no chute; errar com certeza vale
 * menos que errar admitindo o chute, porque revela um engano firme). O ritmo
 * reduz o valor do item quando a resposta passa de 2 minutos, o ritmo médio
 * da prova (130 minutos para 65 questões). A nota usa só a primeira resposta
 * de cada item: "Tentar novamente" não conta.
 */
import type { Confidence } from './mastery'
import { ACTIVITY_PASS_SCORE } from './xp'

export interface GradedAnswer {
  score: number
  confidence?: Confidence
  /** Segundos entre o item aparecer e a primeira verificação. */
  seconds?: number
}

/** Valor do item por confiança: [acerto, erro]. */
export const GRADE_POINTS: Record<Confidence, [number, number]> = {
  certeza: [1, 0],
  duvida: [0.75, 0.1],
  chute: [0.5, 0.2],
}

/** Até aqui o ritmo não reduz a nota: 2 minutos por questão, como na prova. */
export const PACE_TARGET_SECONDS = 120
/** A partir daqui a redução para de crescer. */
export const PACE_LIMIT_SECONDS = 300
/** Fator mínimo do ritmo (resposta muito lenta). */
export const PACE_MIN_FACTOR = 0.7

export function paceFactor(seconds: number | undefined): number {
  if (seconds === undefined || seconds <= PACE_TARGET_SECONDS) return 1
  const t = Math.min(1, (seconds - PACE_TARGET_SECONDS) / (PACE_LIMIT_SECONDS - PACE_TARGET_SECONDS))
  return 1 - t * (1 - PACE_MIN_FACTOR)
}

export function itemPoints(a: GradedAnswer): number {
  const correct = a.score >= ACTIVITY_PASS_SCORE
  const base = a.confidence ? GRADE_POINTS[a.confidence][correct ? 0 : 1] : correct ? 1 : 0
  return base * paceFactor(a.seconds)
}

export interface SessionGrade {
  /** Nota de 0 a 10, com uma casa decimal. */
  grade: number
  label: string
  counts: { sure: number; doubt: number; guess: number; wrong: number; wrongSure: number }
  /** Média de segundos por item, quando medida. */
  averageSeconds?: number
  /** Itens respondidos acima do ritmo da prova. */
  slow: number
}

export function gradeLabel(grade: number): string {
  if (grade >= 9) return 'Excelente'
  if (grade >= 7) return 'Bom'
  if (grade >= 5) return 'Regular'
  return 'Precisa revisar'
}

export function sessionGrade(answers: GradedAnswer[]): SessionGrade {
  const counts = { sure: 0, doubt: 0, guess: 0, wrong: 0, wrongSure: 0 }
  for (const a of answers) {
    if (a.score < ACTIVITY_PASS_SCORE) {
      counts.wrong++
      if (a.confidence === 'certeza') counts.wrongSure++
    } else if (a.confidence === 'chute') counts.guess++
    else if (a.confidence === 'duvida') counts.doubt++
    else counts.sure++
  }
  const timed = answers.filter((a) => a.seconds !== undefined).map((a) => a.seconds!)
  const total = answers.reduce((sum, a) => sum + itemPoints(a), 0)
  const grade = answers.length === 0 ? 0 : Math.round((10 * total) / answers.length * 10) / 10
  return {
    grade,
    label: gradeLabel(grade),
    counts,
    averageSeconds: timed.length > 0 ? timed.reduce((x, y) => x + y, 0) / timed.length : undefined,
    slow: timed.filter((t) => t > PACE_TARGET_SECONDS).length,
  }
}
