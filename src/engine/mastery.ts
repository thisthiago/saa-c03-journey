/**
 * Domínio por conceito e agenda de revisão (sistema de Leitner).
 *
 * - mastery: média móvel exponencial do desempenho, ponderada pela qualidade
 *   da evidência (primeira tentativa vale mais que retentativa).
 * - box: caixa de Leitner; só sobe uma vez por dia, então "dominado" exige
 *   acertos espaçados no tempo.
 */
import type { ConceptProgress } from './types'

export const LEITNER_DAYS = [0, 1, 3, 7, 16, 35] as const
export const MAX_BOX = LEITNER_DAYS.length - 1
export const INITIAL_MASTERY = 0.2
export const LEARNING_RATE = 0.4
export const SUCCESS_OUTCOME = 0.7
export const FAILURE_OUTCOME = 0.5
export const MASTERED_THRESHOLD = 0.8
export const MASTERED_MIN_BOX = 2

export type MasteryTier = 'novo' | 'aprendendo' | 'praticando' | 'dominado'

export const EVIDENCE_WEIGHT = {
  firstAttempt: 1,
  retry: 0.5,
  afterSolution: 0.2,
  review: 1,
} as const

const DAY_MS = 86_400_000

export function dayKey(date: Date): string {
  return date.toISOString().slice(0, 10)
}

export function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * DAY_MS)
}

export function updateConcept(
  prev: ConceptProgress | undefined,
  outcome: number,
  weight: number,
  now: Date,
): ConceptProgress {
  const o = Math.max(0, Math.min(1, outcome))
  const m0 = prev?.mastery ?? INITIAL_MASTERY
  const mastery = Math.round((m0 + LEARNING_RATE * weight * (o - m0)) * 1000) / 1000
  const today = dayKey(now)
  let box = prev?.box ?? 0
  let lastPromotionDay = prev?.lastPromotionDay
  let recentErrors = prev?.recentErrors ?? 0
  if (o >= SUCCESS_OUTCOME) {
    if (lastPromotionDay !== today) {
      box = Math.min(MAX_BOX, box + 1)
      lastPromotionDay = today
    }
    recentErrors = Math.max(0, recentErrors - 1)
  } else if (o < FAILURE_OUTCOME) {
    box = 1
    recentErrors += 1
  }
  return {
    mastery,
    evidence: (prev?.evidence ?? 0) + 1,
    box,
    nextReviewAt: addDays(now, LEITNER_DAYS[box]).toISOString(),
    lastSeenAt: now.toISOString(),
    lastPromotionDay,
    recentErrors,
    lastReviewItemId: prev?.lastReviewItemId,
  }
}

export function masteryTier(cp: ConceptProgress | undefined): MasteryTier {
  if (!cp || cp.evidence === 0) return 'novo'
  if (cp.mastery >= MASTERED_THRESHOLD && cp.box >= MASTERED_MIN_BOX) return 'dominado'
  if (cp.mastery < 0.5) return 'aprendendo'
  return 'praticando'
}

export function isDue(cp: ConceptProgress, now: Date): boolean {
  return new Date(cp.nextReviewAt).getTime() <= now.getTime()
}

export function overdueDays(cp: ConceptProgress, now: Date): number {
  return Math.max(0, (now.getTime() - new Date(cp.nextReviewAt).getTime()) / DAY_MS)
}

export const TIER_LABEL: Record<MasteryTier, string> = {
  novo: 'Novo',
  aprendendo: 'Aprendendo',
  praticando: 'Praticando',
  dominado: 'Dominado',
}
