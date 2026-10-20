/**
 * Estados derivados (nunca armazenados): status de missões e fases,
 * desbloqueios, medalhas, progresso e próxima missão sugerida.
 */
import { trackPhases, type Registry } from './registry'
import type { MissionDef, PhaseDef, ProgressState, TrackDef } from './types'

export const MISSION_PASS = 0.7
export const BOSS_PASS = 0.75

export type MissionStatus = 'locked' | 'available' | 'in-progress' | 'passed'
export type PhaseStatus = 'in-construction' | 'locked' | 'available' | 'in-progress' | 'completed'
export type Medal = 'ouro' | 'prata' | 'bronze'

export function passThreshold(m: MissionDef): number {
  return m.passThreshold ?? (m.type === 'mission' ? MISSION_PASS : BOSS_PASS)
}

/** Média dos melhores scores ponderada pelo XP máximo de cada atividade. */
export function missionScore(state: ProgressState, m: MissionDef): number {
  const total = m.activities.reduce((s, a) => s + a.xp, 0)
  if (total === 0) return 0
  const got = m.activities.reduce((s, a) => s + (state.activities[a.id]?.bestScore ?? 0) * a.xp, 0)
  return got / total
}

export function allAttempted(state: ProgressState, m: MissionDef): boolean {
  return m.activities.every((a) => (state.activities[a.id]?.attempts ?? 0) > 0)
}

export function isMissionPassed(state: ProgressState, m: MissionDef): boolean {
  return Boolean(state.missions[m.id]?.passedAt) || (allAttempted(state, m) && missionScore(state, m) >= passThreshold(m))
}

/** Trilha concluída: todas as fases disponíveis (inclusive o final) concluídas. Fases em construção não contam. */
export function isTrackCompleted(state: ProgressState, track: TrackDef): boolean {
  return trackPhases(track).filter((p) => p.availability === 'available').every((p) => isPhaseCompleted(state, p))
}

export function isTrackUnlocked(state: ProgressState, reg: Registry, track: TrackDef): boolean {
  return unmetTrackRequirements(state, reg, track).length === 0
}

/** Trilhas exigidas (`requires`) ainda não concluídas. */
export function unmetTrackRequirements(state: ProgressState, reg: Registry, track: TrackDef): TrackDef[] {
  // Referências inválidas são barradas por validateRegistry.
  return (track.requires ?? [])
    .map((id) => reg.tracks.get(id))
    .filter((t): t is TrackDef => Boolean(t))
    .filter((t) => !isTrackCompleted(state, t))
}

/** Trilhas recomendadas (`recommends`) ainda não concluídas. Não bloqueiam nada. */
export function unmetTrackRecommendations(state: ProgressState, reg: Registry, track: TrackDef): TrackDef[] {
  return (track.recommends ?? [])
    .map((id) => reg.tracks.get(id))
    .filter((t): t is TrackDef => Boolean(t))
    .filter((t) => !isTrackCompleted(state, t))
}

export function unmetRequirements(state: ProgressState, reg: Registry, phase: PhaseDef): PhaseDef[] {
  return phase.requires
    .map((id) => reg.phases.get(id)?.phase)
    .filter((p): p is PhaseDef => Boolean(p))
    .filter((p) => !isPhaseCompleted(state, p))
}

export function unmetRecommendations(state: ProgressState, reg: Registry, phase: PhaseDef): PhaseDef[] {
  return (phase.recommends ?? [])
    .map((id) => reg.phases.get(id)?.phase)
    .filter((p): p is PhaseDef => Boolean(p))
    .filter((p) => !isPhaseCompleted(state, p))
}

export function isPhaseCompleted(state: ProgressState, phase: PhaseDef): boolean {
  return phase.availability === 'available' && phase.missions.length > 0 && phase.missions.every((m) => isMissionPassed(state, m))
}

export function phaseStatus(state: ProgressState, reg: Registry, phaseId: string): PhaseStatus {
  const ref = reg.phases.get(phaseId)
  if (!ref) return 'locked'
  const { phase, track } = ref
  if (phase.availability === 'in-construction') return 'in-construction'
  if (!isTrackUnlocked(state, reg, track) || unmetRequirements(state, reg, phase).length > 0) return 'locked'
  if (isPhaseCompleted(state, phase)) return 'completed'
  const started = phase.missions.some((m) => state.missions[m.id] || m.activities.some((a) => state.activities[a.id]))
  return started ? 'in-progress' : 'available'
}

export function missionStatus(state: ProgressState, reg: Registry, missionId: string): MissionStatus {
  const ref = reg.missions.get(missionId)
  if (!ref) return 'locked'
  const ps = phaseStatus(state, reg, ref.phase.id)
  if (ps === 'locked' || ps === 'in-construction') return 'locked'
  if (isMissionPassed(state, ref.mission)) return 'passed'
  const prev = ref.index > 0 ? ref.phase.missions[ref.index - 1] : undefined
  if (prev && !isMissionPassed(state, prev)) return 'locked'
  const started = Boolean(state.missions[missionId]) || ref.mission.activities.some((a) => state.activities[a.id])
  return started ? 'in-progress' : 'available'
}

export function phaseProgress(state: ProgressState, phase: PhaseDef): { passed: number; total: number; ratio: number } {
  const total = phase.missions.length
  const passed = phase.missions.filter((m) => isMissionPassed(state, m)).length
  return { passed, total, ratio: total === 0 ? 0 : passed / total }
}

export function phaseMedal(state: ProgressState, phase: PhaseDef): Medal | null {
  if (!isPhaseCompleted(state, phase)) return null
  const avg = phase.missions.reduce((s, m) => s + missionScore(state, m), 0) / phase.missions.length
  return avg >= 0.95 ? 'ouro' : avg >= 0.85 ? 'prata' : 'bronze'
}

export function trackProgress(state: ProgressState, track: TrackDef): { passed: number; total: number; ratio: number } {
  const missions = trackPhases(track)
    .filter((p) => p.availability === 'available')
    .flatMap((p) => p.missions)
  const passed = missions.filter((m) => isMissionPassed(state, m)).length
  return { passed, total: missions.length, ratio: missions.length === 0 ? 0 : passed / missions.length }
}

export interface MissionSuggestion {
  missionId: string
  phaseId: string
  /** 'resume' quando há uma missão em andamento com passo salvo. */
  reason: 'resume' | 'in-progress' | 'next'
}

/** Missão sugerida para "Continuar": a em andamento, ou a próxima disponível na ordem do mapa. */
export function nextMission(state: ProgressState, reg: Registry): MissionSuggestion | null {
  if (state.resume) {
    const st = missionStatus(state, reg, state.resume.missionId)
    const ref = reg.missions.get(state.resume.missionId)
    if (ref && (st === 'available' || st === 'in-progress')) return { missionId: ref.mission.id, phaseId: ref.phase.id, reason: 'resume' }
  }
  // A trilha da missão iniciada mais recentemente vem primeiro: quem está no meio
  // de uma trilha continua nela, mesmo que outra trilha venha antes no registro.
  let current: string | undefined
  let latest = ''
  for (const [id, m] of Object.entries(state.missions)) {
    const tid = reg.missions.get(id)?.track.id
    if (tid && m.startedAt > latest) {
      latest = m.startedAt
      current = tid
    }
  }
  const tracks = [...reg.tracks.values()].sort((a, b) => Number(b.id === current) - Number(a.id === current))
  const candidates: MissionSuggestion[] = []
  for (const track of tracks) {
    const phases = [...trackPhases(track)].sort((a, b) => a.order - b.order)
    for (const p of phases) {
      for (const m of p.missions) {
        const st = missionStatus(state, reg, m.id)
        if (st === 'in-progress') return { missionId: m.id, phaseId: p.id, reason: 'in-progress' }
        if (st === 'available') candidates.push({ missionId: m.id, phaseId: p.id, reason: 'next' })
      }
    }
  }
  return candidates[0] ?? null
}

/** Dias consecutivos com atividade avaliada, terminando hoje ou ontem. */
export function streakDays(activeDays: string[], now: Date): number {
  const set = new Set(activeDays)
  const day = (offset: number) => new Date(now.getTime() - offset * 86_400_000).toISOString().slice(0, 10)
  let offset = set.has(day(0)) ? 0 : set.has(day(1)) ? 1 : -1
  if (offset < 0) return 0
  let count = 0
  while (set.has(day(offset))) {
    count++
    offset++
  }
  return count
}
