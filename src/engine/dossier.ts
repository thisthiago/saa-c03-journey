/**
 * Leituras do Dossiê: progresso das metas de conquista, agrupamento por
 * trilha, atividade recente e dias com estudo. Tudo derivado do progresso
 * salvo; nada aqui muda as regras de conquista, XP, desbloqueio ou revisão.
 */
import { masteredConceptIds } from './achievements'
import { levelForXp } from './levels'
import type { Registry } from './registry'
import { isMissionPassed, missionStatus, phaseStatus } from './selectors'
import type { AchievementCondition, AchievementDef, ProgressState, SimuladoRecord, TrackDef, XpEntry } from './types'

export interface GoalProgress {
  current: number
  target: number
  /** Ponto de partida da contagem (o nível começa em 1). */
  start: number
}

export function goalRatio(p: GoalProgress): number {
  return p.target <= p.start ? 0 : Math.min(1, Math.max(0, (p.current - p.start) / (p.target - p.start)))
}

/**
 * Quanto falta para uma conquista, com os mesmos critérios de checkCondition.
 * Condições de sim ou não (nota de missão, acerto de primeira numa atividade) devolvem null.
 */
export function achievementProgress(c: AchievementCondition, state: ProgressState, reg: Registry): GoalProgress | null {
  const goal = (current: number, target: number, start = 0) => ({ current: Math.min(current, target), target, start })
  switch (c.type) {
    case 'comeback':
      return goal(state.stats.comebacks, c.count)
    case 'perfect-first-try-count':
      return goal(state.stats.perfectFirstTries, c.count)
    case 'reviews-completed':
      return goal(state.reviews.sessions, c.count)
    case 'level-reached':
      return goal(levelForXp(state.xp), c.level, 1)
    case 'concepts-mastered': {
      const mastered = new Set(masteredConceptIds(state))
      if (c.conceptIds) return goal(c.conceptIds.filter((id) => mastered.has(id)).length, c.conceptIds.length)
      if (c.tag) {
        const tagged = [...reg.concepts.values()].filter((k) => k.tags?.includes(c.tag!)).map((k) => k.id)
        return goal(tagged.filter((id) => mastered.has(id)).length, c.count ?? tagged.length)
      }
      return goal(mastered.size, c.count ?? 1)
    }
    case 'phase-completed': {
      const p = reg.phases.get(c.phaseId)?.phase
      return p ? goal(p.missions.filter((m) => isMissionPassed(state, m)).length, p.missions.length) : null
    }
    default:
      return null
  }
}

/** Onde a conquista se cumpre: uma fase, uma missão ou a revisão. */
export type AchievementTarget = { kind: 'phase'; phaseId: string } | { kind: 'mission'; missionId: string } | { kind: 'review' }

export function achievementTarget(c: AchievementCondition, reg: Registry): AchievementTarget | undefined {
  switch (c.type) {
    case 'phase-completed':
      return { kind: 'phase', phaseId: c.phaseId }
    case 'mission-score':
      return { kind: 'mission', missionId: c.missionId }
    case 'perfect-first-try': {
      const ref = reg.activities.get(c.activityId)
      return ref ? { kind: 'mission', missionId: ref.mission.id } : undefined
    }
    case 'reviews-completed':
      return { kind: 'review' }
    case 'all':
      return c.of.map((x) => achievementTarget(x, reg)).find(Boolean)
    default:
      return undefined
  }
}

export interface AchievementGroup {
  id: string
  /** Trilha do módulo; as conquistas gerais não têm trilha. */
  track?: TrackDef
  title: string
  achievements: AchievementDef[]
}

/** Conquistas agrupadas pelo módulo que as declara, na ordem dos módulos. */
export function achievementGroups(reg: Registry): AchievementGroup[] {
  return reg.modules
    .filter((m) => m.achievements.length > 0)
    .map((m) => ({ id: m.id, track: m.tracks[0], title: m.tracks[0]?.title ?? 'Conquistas gerais', achievements: m.achievements }))
}

/** Trilha de cada conquista (pelo módulo que a declara). */
export function achievementTracks(reg: Registry): Map<string, TrackDef | undefined> {
  return new Map(achievementGroups(reg).flatMap((g) => g.achievements.map((a) => [a.id, g.track] as const)))
}

function targetOpen(state: ProgressState, reg: Registry, t: AchievementTarget | undefined): boolean {
  if (!t || t.kind === 'review') return true
  if (t.kind === 'phase') {
    const st = phaseStatus(state, reg, t.phaseId)
    return st !== 'locked' && st !== 'in-construction'
  }
  return missionStatus(state, reg, t.missionId) !== 'locked'
}

export interface AchievementGoal {
  achievement: AchievementDef
  progress: GoalProgress | null
  target?: AchievementTarget
}

/**
 * Próximas metas: conquistas ainda bloqueadas que já têm progresso, ou que
 * são da trilha em foco e podem ser cumpridas agora. Das mais adiantadas
 * para as menos; empate pela ordem do registro.
 */
export function nextAchievements(state: ProgressState, reg: Registry, focusTrackId: string | undefined, limit = 6): AchievementGoal[] {
  const tracks = achievementTracks(reg)
  const goals: (AchievementGoal & { ratio: number; index: number })[] = []
  let index = 0
  for (const a of reg.achievements.values()) {
    index++
    if (state.achievements[a.id]) continue
    const progress = achievementProgress(a.condition, state, reg)
    const target = achievementTarget(a.condition, reg)
    const ratio = progress ? goalRatio(progress) : 0
    const inFocus = Boolean(focusTrackId) && tracks.get(a.id)?.id === focusTrackId
    if (!targetOpen(state, reg, target)) continue
    if (ratio > 0 || inFocus) goals.push({ achievement: a, progress, target, ratio, index })
  }
  return goals
    .sort((x, y) => y.ratio - x.ratio || x.index - y.index)
    .slice(0, limit)
    .map(({ achievement, progress, target }) => ({ achievement, progress, target }))
}

export type ActivityKind = XpEntry['source'] | 'simulado'

export interface ActivityItem {
  at: string
  kind: ActivityKind
  xp: number
  /** Referências do registro; revisões seguidas no mesmo dia viram um item com vários conceitos. */
  refIds: string[]
  simulado?: SimuladoRecord
}

/** Dia no fuso do navegador, para agrupar o que o estudante fez "hoje". */
export function localDay(iso: string): string {
  const d = new Date(iso)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

/** Ações que renderam XP e simulados, da mais recente para a mais antiga. */
export function recentActivity(state: ProgressState): ActivityItem[] {
  const raw: ActivityItem[] = [
    ...state.ledger.map((e) => ({ at: e.at, kind: e.source, xp: e.amount, refIds: [e.refId] })),
    ...state.exam.simulados.map((sim) => ({ at: sim.at, kind: 'simulado' as const, xp: 0, refIds: [], simulado: sim })),
  ].sort((a, b) => b.at.localeCompare(a.at))
  const items: ActivityItem[] = []
  for (const it of raw) {
    const last = items.at(-1)
    if (it.kind === 'review' && last?.kind === 'review' && localDay(last.at) === localDay(it.at)) {
      if (!last.refIds.includes(it.refIds[0])) last.refIds.push(it.refIds[0])
      last.xp += it.xp
    } else items.push({ ...it, refIds: [...it.refIds] })
  }
  return items
}

/** Últimos `days` dias (do mais antigo ao de hoje), com a mesma contagem de dias de streakDays. */
export function studyCalendar(activeDays: string[], now: Date, days = 28): { day: string; active: boolean }[] {
  const set = new Set(activeDays)
  return Array.from({ length: days }, (_, i) => {
    const day = new Date(now.getTime() - (days - 1 - i) * 86_400_000).toISOString().slice(0, 10)
    return { day, active: set.has(day) }
  })
}
