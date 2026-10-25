/**
 * Transições de estado do progresso. Funções puras: recebem o estado atual,
 * o registro de conteúdo e a ação, e devolvem o novo estado e os eventos
 * de jogo resultantes (XP, nível, missão, fase, conquistas, domínio).
 */
import { newlyUnlocked } from './achievements'
import { isQuestionCorrect } from './exam'
import { levelForXp, levelTitle } from './levels'
import { dayKey, EVIDENCE_WEIGHT, isDue, masteryTier, SUCCESS_OUTCOME, updateConcept } from './mastery'
import type { Registry } from './registry'
import { isMissionPassed, isPhaseCompleted } from './selectors'
import type { Evaluation, GameEvent, ProgressState, XpEntry } from './types'
import { ACTIVITY_PASS_SCORE, earnedXp, REVIEW_XP, xpAward } from './xp'

export const LEDGER_LIMIT = 500
export const ACTIVE_DAYS_LIMIT = 120
export const DEFAULT_MISSION_BONUS = { mission: 20, boss: 60, final: 150 } as const

export function createInitialProgress(now: Date): ProgressState {
  const iso = now.toISOString()
  return {
    schemaVersion: 1,
    createdAt: iso,
    updatedAt: iso,
    xp: 0,
    ledger: [],
    activities: {},
    missions: {},
    concepts: {},
    discovered: {},
    achievements: {},
    reviews: { sessions: 0, itemsAnswered: 0, awardedCycles: {} },
    stats: { comebacks: 0, perfectFirstTries: 0, activeDays: [] },
    exam: { questions: {}, simulados: [] },
    drafts: {},
    settings: { theme: 'system', reducedMotion: false, contextPanel: true },
  }
}

export interface Transition {
  state: ProgressState
  events: GameEvent[]
}

function cloneState(s: ProgressState): ProgressState {
  return structuredClone(s)
}

function addXp(s: ProgressState, events: GameEvent[], amount: number, source: XpEntry['source'], refId: string, reason: string, at: string) {
  if (amount <= 0) return
  s.xp += amount
  s.ledger.push({ at, amount, source, refId })
  if (s.ledger.length > LEDGER_LIMIT) s.ledger.splice(0, s.ledger.length - LEDGER_LIMIT)
  events.push({ type: 'xp', amount, reason, source })
}

function markActiveDay(s: ProgressState, now: Date) {
  const today = dayKey(now)
  if (!s.stats.activeDays.includes(today)) {
    s.stats.activeDays.push(today)
    if (s.stats.activeDays.length > ACTIVE_DAYS_LIMIT) s.stats.activeDays.shift()
  }
}

function applyConceptOutcomes(s: ProgressState, reg: Registry, events: GameEvent[], outcomes: Record<string, number>, weight: number, now: Date) {
  for (const [conceptId, outcome] of Object.entries(outcomes)) {
    const before = masteryTier(s.concepts[conceptId])
    s.concepts[conceptId] = updateConcept(s.concepts[conceptId], outcome, weight, now)
    s.discovered[conceptId] ??= now.toISOString()
    if (before !== 'dominado' && masteryTier(s.concepts[conceptId]) === 'dominado') {
      events.push({ type: 'concept-mastered', conceptId, title: reg.concepts.get(conceptId)?.title ?? conceptId })
    }
  }
}

/** Conquistas e subida de nível; repete porque o XP de uma conquista pode liberar outra. */
function settle(s: ProgressState, reg: Registry, events: GameEvent[], levelBefore: number, now: Date) {
  const at = now.toISOString()
  for (let guard = 0; guard < 5; guard++) {
    const unlocked = newlyUnlocked(s, reg)
    if (unlocked.length === 0) break
    for (const a of unlocked) {
      s.achievements[a.id] = { unlockedAt: at }
      events.push({ type: 'achievement', achievementId: a.id, title: a.title })
      addXp(s, events, a.xp, 'achievement', a.id, `Conquista: ${a.title}`, at)
    }
  }
  const levelAfter = levelForXp(s.xp)
  for (let l = levelBefore + 1; l <= levelAfter; l++) {
    events.push({ type: 'level-up', level: l, title: levelTitle(l, reg.levelTitles) })
  }
  s.updatedAt = at
}

export interface ActivitySubmission {
  activityId: string
  evaluation: Evaluation
  hintsUsed: number
  solutionViewed: boolean
  now: Date
}

export function submitActivity(prev: ProgressState, reg: Registry, sub: ActivitySubmission): Transition {
  const ref = reg.activities.get(sub.activityId)
  if (!ref) throw new Error(`Atividade desconhecida: ${sub.activityId}`)
  const { activity, mission, phase } = ref
  const s = cloneState(prev)
  const events: GameEvent[] = []
  const at = sub.now.toISOString()
  const levelBefore = levelForXp(s.xp)
  const score = Math.max(0, Math.min(1, sub.evaluation.score))

  const ap = s.activities[activity.id] ?? {
    attempts: 0,
    bestScore: 0,
    xpEarned: 0,
    firstScore: 0,
    solutionViewed: false,
    failedBeforePass: false,
    lastAttemptAt: at,
  }
  const attemptNumber = ap.attempts + 1
  const solutionViewed = ap.solutionViewed || sub.solutionViewed
  const wasPassed = ap.bestScore >= ACTIVITY_PASS_SCORE
  const earned = earnedXp(activity.xp, score, attemptNumber, sub.hintsUsed, solutionViewed)
  const award = xpAward(ap.xpEarned, earned)

  if (attemptNumber === 1) ap.firstScore = score
  if (attemptNumber === 1 && score >= 1 && sub.hintsUsed === 0 && !solutionViewed) s.stats.perfectFirstTries += 1
  if (!wasPassed && score >= ACTIVITY_PASS_SCORE) {
    ap.passedAt = at
    if (attemptNumber > 1 && !ap.failedBeforePass) {
      ap.failedBeforePass = true
      s.stats.comebacks += 1
    }
  }
  ap.attempts = attemptNumber
  ap.bestScore = Math.max(ap.bestScore, score)
  ap.xpEarned += award
  ap.solutionViewed = solutionViewed
  ap.lastAttemptAt = at
  s.activities[activity.id] = ap

  const weight = solutionViewed
    ? EVIDENCE_WEIGHT.afterSolution
    : attemptNumber === 1
      ? EVIDENCE_WEIGHT.firstAttempt
      : EVIDENCE_WEIGHT.retry
  applyConceptOutcomes(s, reg, events, sub.evaluation.conceptOutcomes, weight, sub.now)
  if (activity.reviewWeakNow) {
    // Conceitos fracos entram imediatamente na fila de revisão (ex.: relatório do desafio final).
    for (const [conceptId, outcome] of Object.entries(sub.evaluation.conceptOutcomes)) if (outcome < SUCCESS_OUTCOME && s.concepts[conceptId]) s.concepts[conceptId].nextReviewAt = at
  }
  addXp(s, events, award, 'activity', activity.id, activity.title, at)

  const mp = (s.missions[mission.id] ??= { startedAt: at, bonusAwarded: false })
  if (!mp.passedAt && isMissionPassed(s, mission)) {
    const phaseWasCompleted = isPhaseCompleted(prev, phase)
    mp.passedAt = at
    events.push({ type: 'mission-passed', missionId: mission.id, title: mission.title })
    if (!mp.bonusAwarded) {
      mp.bonusAwarded = true
      addXp(s, events, mission.bonusXp ?? DEFAULT_MISSION_BONUS[mission.type], 'mission', mission.id, `Missão aprovada: ${mission.title}`, at)
    }
    if (!phaseWasCompleted && isPhaseCompleted(s, phase)) {
      events.push({ type: 'phase-completed', phaseId: phase.id, title: phase.title })
    }
  }
  markActiveDay(s, sub.now)
  settle(s, reg, events, levelBefore, sub.now)
  return { state: s, events }
}

export interface ReviewSubmission {
  conceptId: string
  itemId: string
  evaluation: Evaluation
  now: Date
}

/**
 * Registra um item de revisão. XP só é concedido se o conceito estava vencido
 * e ainda não recebeu XP neste ciclo — treinar fora do prazo não gera XP.
 */
export function submitReview(prev: ProgressState, reg: Registry, sub: ReviewSubmission): Transition {
  const s = cloneState(prev)
  const events: GameEvent[] = []
  const at = sub.now.toISOString()
  const levelBefore = levelForXp(s.xp)
  const cp = s.concepts[sub.conceptId]
  const cycleKey = cp?.nextReviewAt
  const eligible = Boolean(cp && isDue(cp, sub.now) && s.reviews.awardedCycles[sub.conceptId] !== cycleKey)
  const outcomes = Object.keys(sub.evaluation.conceptOutcomes).length > 0 ? sub.evaluation.conceptOutcomes : { [sub.conceptId]: sub.evaluation.score }
  applyConceptOutcomes(s, reg, events, outcomes, EVIDENCE_WEIGHT.review, sub.now)
  if (s.concepts[sub.conceptId]) s.concepts[sub.conceptId].lastReviewItemId = sub.itemId
  s.reviews.itemsAnswered += 1
  if (eligible && sub.evaluation.score >= ACTIVITY_PASS_SCORE && cycleKey) {
    s.reviews.awardedCycles[sub.conceptId] = cycleKey
    addXp(s, events, REVIEW_XP, 'review', sub.conceptId, `Revisão: ${reg.concepts.get(sub.conceptId)?.title ?? sub.conceptId}`, at)
  }
  markActiveDay(s, sub.now)
  settle(s, reg, events, levelBefore, sub.now)
  return { state: s, events }
}

export function completeReviewSession(prev: ProgressState, reg: Registry, now: Date): Transition {
  const s = cloneState(prev)
  const events: GameEvent[] = []
  const levelBefore = levelForXp(s.xp)
  s.reviews.sessions += 1
  settle(s, reg, events, levelBefore, now)
  return { state: s, events }
}

export const SIMULADO_HISTORY_LIMIT = 30

export interface ExamSubmission {
  answers: { questionId: string; selected: string[] }[]
  now: Date
  /** Presente quando as respostas fecham um simulado. */
  simulado?: { seconds: number; timed: boolean }
}

/**
 * Registra respostas do banco de questões. Cada questão vale tudo ou nada e
 * alimenta o domínio do conceito principal e dos relacionados, como um item
 * de revisão. Não concede XP: a mesma questão pode ser respondida de novo.
 */
export function submitExam(prev: ProgressState, reg: Registry, sub: ExamSubmission): Transition {
  const s = cloneState(prev)
  const events: GameEvent[] = []
  const at = sub.now.toISOString()
  const levelBefore = levelForXp(s.xp)
  const perConcept: Record<string, number[]> = {}
  let correct = 0
  for (const { questionId, selected } of sub.answers) {
    const ref = reg.questions.get(questionId)
    if (!ref) throw new Error(`Questão desconhecida: ${questionId}`)
    const ok = isQuestionCorrect(ref.question, selected)
    if (ok) correct++
    const qp = s.exam.questions[questionId] ?? { attempts: 0, correct: 0, lastCorrect: false, lastAt: at }
    s.exam.questions[questionId] = { attempts: qp.attempts + 1, correct: qp.correct + (ok ? 1 : 0), lastCorrect: ok, lastAt: at }
    for (const c of [ref.question.concept, ...(ref.question.related ?? [])]) (perConcept[c] ??= []).push(ok ? 1 : 0)
  }
  const outcomes = Object.fromEntries(Object.entries(perConcept).map(([c, list]) => [c, list.reduce((a, b) => a + b, 0) / list.length]))
  applyConceptOutcomes(s, reg, events, outcomes, EVIDENCE_WEIGHT.review, sub.now)
  if (sub.simulado) {
    s.exam.simulados.push({ at, total: sub.answers.length, correct, seconds: Math.max(0, Math.round(sub.simulado.seconds)), timed: sub.simulado.timed })
    if (s.exam.simulados.length > SIMULADO_HISTORY_LIMIT) s.exam.simulados.splice(0, s.exam.simulados.length - SIMULADO_HISTORY_LIMIT)
  }
  markActiveDay(s, sub.now)
  settle(s, reg, events, levelBefore, sub.now)
  return { state: s, events }
}

/** Conceitos apresentados em cartas de intel entram no Codex (sem XP). */
export function discoverConcepts(prev: ProgressState, conceptIds: string[], now: Date): ProgressState {
  const missing = conceptIds.filter((id) => !prev.discovered[id])
  if (missing.length === 0) return prev
  const s = cloneState(prev)
  for (const id of missing) s.discovered[id] = now.toISOString()
  s.updatedAt = now.toISOString()
  return s
}

export function startMission(prev: ProgressState, missionId: string, step: number, now: Date): ProgressState {
  const s = cloneState(prev)
  const at = now.toISOString()
  s.missions[missionId] ??= { startedAt: at, bonusAwarded: false }
  s.resume = { missionId, step, at }
  s.updatedAt = at
  return s
}

export function clearResume(prev: ProgressState, missionId: string): ProgressState {
  if (prev.resume?.missionId !== missionId) return prev
  const s = cloneState(prev)
  delete s.resume
  return s
}
