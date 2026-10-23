/**
 * Guia de estudo da Base: qual é a próxima ação, quais trilhas mostrar e como
 * está o estudo em cada domínio do exame. Tudo derivado do progresso salvo;
 * nada aqui muda regras de desbloqueio, XP ou revisão.
 */
import { dayKey, masteryTier } from './mastery'
import { trackPhases, type Registry } from './registry'
import { reviewCandidates, WEAK_MASTERY } from './review'
import { isTrackCompleted, missionStatus, nextMission, trackProgress, unmetTrackRecommendations } from './selectors'
import type { TrackOrderStep } from './track-order'
import type { ExamDomain, ProgressState, TrackDef } from './types'

export type RecommendationKind = 'first-visit' | 'resume' | 'in-progress' | 'review' | 'next-track' | 'next' | 'done'

export interface StudyRecommendation {
  kind: RecommendationKind
  /** Missão sugerida (também presente em 'review', como alternativa à revisão). */
  missionId?: string
  /** Trilha concluída por último, quando a sugestão passa para outra trilha. */
  completedTrackId?: string
  /** A missão sugerida é a primeira de uma fase ainda não começada. */
  opensPhase: boolean
  /** Conceitos vencidos em dias anteriores, do mais urgente ao menos. */
  overdueIds: string[]
  overdue: number
}

/** Trilha da missão iniciada mais recentemente (a mesma regra de nextMission). */
export function currentTrackId(state: ProgressState, reg: Registry): string | undefined {
  let current: string | undefined
  let latest = ''
  for (const [id, m] of Object.entries(state.missions)) {
    const tid = reg.missions.get(id)?.track.id
    if (tid && m.startedAt > latest) {
      latest = m.startedAt
      current = tid
    }
  }
  return current
}

/** Primeira missão em andamento ou disponível da trilha, na ordem das fases. */
export function trackNextMission(state: ProgressState, reg: Registry, track: TrackDef): string | undefined {
  let available: string | undefined
  for (const p of [...trackPhases(track)].sort((a, b) => a.order - b.order)) {
    for (const m of p.missions) {
      const st = missionStatus(state, reg, m.id)
      if (st === 'in-progress') return m.id
      if (st === 'available' && !available) available = m.id
    }
  }
  return available
}

function isMissionStarted(state: ProgressState, missionId: string, reg: Registry): boolean {
  const ref = reg.missions.get(missionId)
  return Boolean(state.missions[missionId]) || Boolean(ref?.mission.activities.some((a) => state.activities[a.id]))
}

/** Conceitos cuja revisão venceu antes de hoje (o estudante voltou num novo dia), do mais urgente ao menos. */
export function overdueConcepts(state: ProgressState, reg: Registry, now: Date): string[] {
  const today = dayKey(now)
  return reviewCandidates(state, reg, now)
    .filter((c) => c.reason === 'due' && dayKey(new Date(state.concepts[c.conceptId].nextReviewAt)) < today)
    .map((c) => c.conceptId)
}

/**
 * Próxima ação da Base, nesta prioridade: primeiro acesso, missão com passo
 * salvo, missão em andamento, revisão vencida em dia anterior, próxima trilha
 * (na ordem sugerida do mapa) quando a atual acabou, próxima missão da trilha.
 */
export function studyRecommendation(state: ProgressState, reg: Registry, now: Date, order: TrackOrderStep[]): StudyRecommendation {
  const overdueIds = overdueConcepts(state, reg, now)
  const overdue = overdueIds.length
  const base = nextMission(state, reg)
  const opensPhase = (missionId?: string) => {
    const ref = missionId ? reg.missions.get(missionId) : undefined
    return Boolean(ref && ref.index === 0 && !ref.phase.missions.some((m) => isMissionStarted(state, m.id, reg)))
  }

  if (Object.keys(state.activities).length === 0 && Object.keys(state.missions).length === 0) {
    const first = order.map((s) => trackNextMission(state, reg, s.track)).find(Boolean) ?? base?.missionId
    return { kind: first ? 'first-visit' : 'done', missionId: first, opensPhase: false, overdueIds, overdue }
  }
  if (base?.reason === 'resume') return { kind: 'resume', missionId: base.missionId, opensPhase: false, overdueIds, overdue }
  if (base?.reason === 'in-progress') return { kind: 'in-progress', missionId: base.missionId, opensPhase: false, overdueIds, overdue }

  // A trilha atual ainda tem missão liberada: seguir nela. Senão, a próxima trilha da ordem sugerida.
  const current = currentTrackId(state, reg)
  const currentTrack = current ? reg.tracks.get(current) : undefined
  let missionId = currentTrack ? trackNextMission(state, reg, currentTrack) : undefined
  let completedTrackId: string | undefined
  if (!missionId) {
    if (currentTrack && isTrackCompleted(state, currentTrack)) completedTrackId = currentTrack.id
    for (const step of order) {
      if (isTrackCompleted(state, step.track)) continue
      missionId = trackNextMission(state, reg, step.track)
      if (missionId) break
    }
    missionId ??= base?.missionId
  }

  if (overdue > 0) return { kind: 'review', missionId, opensPhase: opensPhase(missionId), overdueIds, overdue }
  if (!missionId) return { kind: 'done', opensPhase: false, overdueIds, overdue }
  const switched = Boolean(current && reg.missions.get(missionId)?.track.id !== current)
  return { kind: switched ? 'next-track' : 'next', missionId, completedTrackId: switched ? completedTrackId : undefined, opensPhase: opensPhase(missionId), overdueIds, overdue }
}

/** Trilha da missão que a Base sugere; o mapa marca a mesma, para as duas páginas concordarem. */
export function suggestedTrackId(rec: StudyRecommendation, reg: Registry): string | undefined {
  return rec.missionId ? reg.missions.get(rec.missionId)?.track.id : undefined
}

export type TrackState = 'not-started' | 'in-progress' | 'completed'

export interface TrackPick {
  track: TrackDef
  state: TrackState
  progress: { passed: number; total: number; ratio: number }
  nextMissionId?: string
  /** Trilhas recomendadas antes desta e ainda não concluídas. */
  recommendedBefore: TrackDef[]
}

function trackLastStart(state: ProgressState, reg: Registry, track: TrackDef): string {
  let latest = ''
  for (const [id, m] of Object.entries(state.missions)) if (reg.missions.get(id)?.track.id === track.id && m.startedAt > latest) latest = m.startedAt
  return latest
}

export function trackState(state: ProgressState, reg: Registry, track: TrackDef): TrackState {
  if (isTrackCompleted(state, track)) return 'completed'
  const started = trackPhases(track).some((p) => p.missions.some((m) => isMissionStarted(state, m.id, reg)))
  return started ? 'in-progress' : 'not-started'
}

/**
 * Poucas trilhas para a Base: as em andamento (da mais recente para a mais
 * antiga), completadas pelas não começadas na ordem sugerida. Concluídas só
 * aparecem quando não há outras.
 */
export function relevantTracks(state: ProgressState, reg: Registry, order: TrackOrderStep[], limit = 3): TrackPick[] {
  const all = order.map((s) => s.track)
  const withState = all.map((track) => ({ track, state: trackState(state, reg, track) }))
  const inProgress = withState.filter((t) => t.state === 'in-progress').sort((a, b) => trackLastStart(state, reg, b.track).localeCompare(trackLastStart(state, reg, a.track)))
  const fresh = withState.filter((t) => t.state === 'not-started')
  const done = withState.filter((t) => t.state === 'completed')
  const picked = [...inProgress, ...fresh]
  return (picked.length > 0 ? picked : done).slice(0, limit).map(({ track, state: st }) => ({
    track,
    state: st,
    progress: trackProgress(state, track),
    nextMissionId: trackNextMission(state, reg, track),
    recommendedBefore: unmetTrackRecommendations(state, reg, track),
  }))
}

export interface DomainReadiness {
  domain: ExamDomain
  /** Conceitos de fases liberadas ligados ao domínio. */
  concepts: number
  studied: number
  mastered: number
  /** Estudados com domínio abaixo de WEAK_MASTERY. */
  weak: number
  questions: number
  answered: number
  /** Questões cuja última resposta foi correta. */
  correct: number
}

/**
 * Estudo por domínio do exame, em contagens reais. Não é uma nota nem uma
 * previsão: um conceito pode contar em mais de um domínio.
 */
export function domainReadiness(state: ProgressState, reg: Registry): DomainReadiness[] {
  const released = new Set<string>()
  for (const t of reg.tracks.values()) for (const p of trackPhases(t)) if (p.availability === 'available') p.concepts.forEach((c) => released.add(c))
  return reg.examDomains.map((domain) => {
    const r: DomainReadiness = { domain, concepts: 0, studied: 0, mastered: 0, weak: 0, questions: 0, answered: 0, correct: 0 }
    for (const id of released) {
      if (!reg.concepts.get(id)?.exam.domains.includes(domain.id)) continue
      r.concepts++
      const cp = state.concepts[id]
      if (!cp || cp.evidence === 0) continue
      r.studied++
      if (masteryTier(cp) === 'dominado') r.mastered++
      if (cp.mastery < WEAK_MASTERY) r.weak++
    }
    for (const { question } of reg.questions.values()) {
      if (question.domain !== domain.id) continue
      r.questions++
      const qp = state.exam.questions[question.id]
      if (!qp) continue
      r.answered++
      if (qp.lastCorrect) r.correct++
    }
    return r
  })
}

/** Domínio com mais pontos fracos (conceitos fracos e questões erradas); empate pelo peso no exame. */
export function focusDomain(readiness: DomainReadiness[]): DomainReadiness | null {
  const score = (r: DomainReadiness) => r.weak + (r.answered - r.correct)
  const ranked = readiness.filter((r) => score(r) > 0).sort((a, b) => score(b) - score(a) || b.domain.weight - a.domain.weight)
  return ranked[0] ?? null
}
