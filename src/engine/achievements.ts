/** Avaliação das conquistas declarativas. */
import { levelForXp } from './levels'
import { masteryTier } from './mastery'
import type { Registry } from './registry'
import { isPhaseCompleted, missionScore } from './selectors'
import type { AchievementCondition, AchievementDef, ProgressState } from './types'

export function masteredConceptIds(state: ProgressState): string[] {
  return Object.entries(state.concepts)
    .filter(([, cp]) => masteryTier(cp) === 'dominado')
    .map(([id]) => id)
}

export function checkCondition(c: AchievementCondition, state: ProgressState, reg: Registry): boolean {
  switch (c.type) {
    case 'phase-completed': {
      const p = reg.phases.get(c.phaseId)?.phase
      return p ? isPhaseCompleted(state, p) : false
    }
    case 'mission-score': {
      const m = reg.missions.get(c.missionId)?.mission
      return m ? Boolean(state.missions[m.id]?.passedAt) && missionScore(state, m) >= c.min - 1e-9 : false
    }
    case 'perfect-first-try': {
      const ap = state.activities[c.activityId]
      return Boolean(ap) && ap.firstScore >= 1 && !ap.solutionViewed
    }
    case 'perfect-first-try-count':
      return state.stats.perfectFirstTries >= c.count
    case 'concepts-mastered': {
      const mastered = new Set(masteredConceptIds(state))
      if (c.conceptIds) return c.conceptIds.length > 0 && c.conceptIds.every((id) => mastered.has(id))
      if (c.tag) {
        const tagged = [...reg.concepts.values()].filter((k) => k.tags?.includes(c.tag!)).map((k) => k.id)
        const hits = tagged.filter((id) => mastered.has(id)).length
        return c.count ? hits >= c.count : tagged.length > 0 && hits === tagged.length
      }
      return mastered.size >= (c.count ?? 1)
    }
    case 'comeback':
      return state.stats.comebacks >= c.count
    case 'reviews-completed':
      return state.reviews.sessions >= c.count
    case 'level-reached':
      return levelForXp(state.xp) >= c.level
    case 'all':
      return c.of.every((x) => checkCondition(x, state, reg))
  }
}

export function newlyUnlocked(state: ProgressState, reg: Registry): AchievementDef[] {
  return [...reg.achievements.values()].filter((a) => !state.achievements[a.id] && checkCondition(a.condition, state, reg))
}
