import { describe, expect, it } from 'vitest'
import { registry } from '../content'
import { domainReadiness, focusDomain, relevantTracks, studyRecommendation, suggestedTrackId, trackNextMission } from './guide'
import { createInitialProgress } from './progress'
import { trackPhases } from './registry'
import { recommendedTrackOrder } from './track-order'
import type { ConceptProgress, ProgressState } from './types'

const order = recommendedTrackOrder(registry)
const NOW = new Date('2026-10-22T15:00:00Z')
const FOUNDATIONS = 'foundations.aws-foundations'
const S3 = 'storage.s3-expedition'

function track(id: string) {
  return registry.tracks.get(id)!
}

/** Marca missões como aprovadas, iniciadas em `at`. */
function pass(state: ProgressState, missionIds: string[], at = NOW.toISOString()): ProgressState {
  const s = structuredClone(state)
  for (const id of missionIds) s.missions[id] = { startedAt: at, passedAt: at, bonusAwarded: true }
  return s
}

function missionsOf(trackId: string): string[] {
  return trackPhases(track(trackId))
    .filter((p) => p.availability === 'available')
    .flatMap((p) => p.missions.map((m) => m.id))
}

function concept(mastery: number, nextReviewAt: string, box = 1): ConceptProgress {
  return { mastery, evidence: 1, box, nextReviewAt, lastSeenAt: NOW.toISOString(), recentErrors: 0 }
}

/** Primeiro conceito com item de revisão. */
const reviewable = [...registry.reviewItems.keys()][0]

describe('studyRecommendation', () => {
  it('primeiro acesso: a primeira missão da AWS Foundations', () => {
    const rec = studyRecommendation(createInitialProgress(NOW), registry, NOW, order)
    expect(rec.kind).toBe('first-visit')
    expect(registry.missions.get(rec.missionId!)?.track.id).toBe(FOUNDATIONS)
  })

  it('missão com passo salvo vem antes de tudo, inclusive da revisão vencida', () => {
    const s = createInitialProgress(NOW)
    const first = trackNextMission(s, registry, track(FOUNDATIONS))!
    s.missions[first] = { startedAt: NOW.toISOString(), bonusAwarded: false }
    s.resume = { missionId: first, step: 2, at: NOW.toISOString() }
    s.concepts[reviewable] = concept(0.9, '2026-10-20T10:00:00Z')
    const rec = studyRecommendation(s, registry, NOW, order)
    expect(rec.kind).toBe('resume')
    expect(rec.missionId).toBe(first)
    expect(rec.overdue).toBe(1)
  })

  it('missão começada sem passo salvo continua como "em andamento"', () => {
    const s = createInitialProgress(NOW)
    const first = trackNextMission(s, registry, track(FOUNDATIONS))!
    const a = registry.missions.get(first)!.mission.activities[0]
    s.activities[a.id] = { attempts: 1, bestScore: 0.3, xpEarned: 5, firstScore: 0.3, solutionViewed: false, failedBeforePass: false, lastAttemptAt: NOW.toISOString() }
    expect(studyRecommendation(s, registry, NOW, order).kind).toBe('in-progress')
  })

  it('revisão vencida em dia anterior vira a ação principal, com a missão como alternativa', () => {
    const [m1] = missionsOf(FOUNDATIONS)
    const s = pass(createInitialProgress(NOW), [m1])
    s.concepts[reviewable] = concept(0.9, '2026-10-21T20:00:00Z')
    const rec = studyRecommendation(s, registry, NOW, order)
    expect(rec.kind).toBe('review')
    expect(rec.overdue).toBe(1)
    expect(rec.missionId).toBeTruthy()
  })

  it('conceito fraco ou vencido hoje não interrompe a próxima missão', () => {
    const [m1] = missionsOf(FOUNDATIONS)
    const s = pass(createInitialProgress(NOW), [m1])
    s.concepts[reviewable] = concept(0.3, NOW.toISOString(), 0)
    const rec = studyRecommendation(s, registry, NOW, order)
    expect(rec.kind).toBe('next')
    expect(registry.missions.get(rec.missionId!)?.track.id).toBe(FOUNDATIONS)
  })

  it('ao concluir a trilha, sugere a próxima da ordem sugerida do mapa', () => {
    const s = pass(createInitialProgress(NOW), missionsOf(FOUNDATIONS))
    const rec = studyRecommendation(s, registry, NOW, order)
    const expected = order.find((st) => st.track.id !== FOUNDATIONS)!.track.id
    expect(rec.kind).toBe('next-track')
    expect(rec.completedTrackId).toBe(FOUNDATIONS)
    expect(registry.missions.get(rec.missionId!)?.track.id).toBe(expected)
    expect(rec.opensPhase).toBe(true)
  })

  it('segue na trilha atual mesmo que outra venha antes na ordem', () => {
    const [first] = missionsOf(S3)
    const s = pass(createInitialProgress(NOW), [first])
    const rec = studyRecommendation(s, registry, NOW, order)
    expect(rec.kind).toBe('next')
    expect(registry.missions.get(rec.missionId!)?.track.id).toBe(S3)
  })

  it('tudo concluído: nada a sugerir', () => {
    const all = [...registry.tracks.keys()].flatMap(missionsOf)
    expect(studyRecommendation(pass(createInitialProgress(NOW), all), registry, NOW, order).kind).toBe('done')
  })
})

describe('suggestedTrackId', () => {
  const suggest = (s: ProgressState) => suggestedTrackId(studyRecommendation(s, registry, NOW, order), registry)

  it('primeiro acesso: a AWS Foundations', () => {
    expect(suggest(createInitialProgress(NOW))).toBe(FOUNDATIONS)
  })

  it('segue a trilha começada, mesmo com a AWS Foundations incompleta', () => {
    expect(suggest(pass(createInitialProgress(NOW), [missionsOf(S3)[0]]))).toBe(S3)
  })

  it('tudo concluído: nenhuma trilha sugerida', () => {
    const all = [...registry.tracks.keys()].flatMap(missionsOf)
    expect(suggest(pass(createInitialProgress(NOW), all))).toBeUndefined()
  })
})

describe('relevantTracks', () => {
  it('primeiro acesso: as três primeiras da ordem sugerida, não começadas', () => {
    const picks = relevantTracks(createInitialProgress(NOW), registry, order)
    expect(picks.map((p) => p.track.id)).toEqual(order.slice(0, 3).map((s) => s.track.id))
    expect(picks.every((p) => p.state === 'not-started' && p.nextMissionId)).toBe(true)
  })

  it('trilhas em andamento vêm primeiro e as concluídas saem', () => {
    const [s3first] = missionsOf(S3)
    const s = pass(pass(createInitialProgress(NOW), missionsOf(FOUNDATIONS), '2026-10-20T10:00:00Z'), [s3first])
    const picks = relevantTracks(s, registry, order)
    expect(picks[0].track.id).toBe(S3)
    expect(picks[0].state).toBe('in-progress')
    expect(picks.some((p) => p.track.id === FOUNDATIONS)).toBe(false)
  })
})

describe('domainReadiness', () => {
  it('sem estudo, só os totais e nenhum domínio em foco', () => {
    const r = domainReadiness(createInitialProgress(NOW), registry)
    expect(r).toHaveLength(4)
    expect(r.every((d) => d.concepts > 0 && d.questions > 0 && d.studied === 0 && d.answered === 0)).toBe(true)
    expect(focusDomain(r)).toBeNull()
  })

  it('conta conceitos estudados, dominados e fracos, e questões da última resposta', () => {
    const s = createInitialProgress(NOW)
    const c = registry.concepts.get(reviewable)!
    s.concepts[reviewable] = concept(0.3, NOW.toISOString())
    const q = [...registry.questions.values()].find((x) => x.question.domain === 'd4')!.question
    s.exam.questions[q.id] = { attempts: 1, correct: 0, lastCorrect: false, lastAt: NOW.toISOString() }
    const r = domainReadiness(s, registry)
    for (const d of r) {
      const has = c.exam.domains.includes(d.domain.id)
      expect(d.studied).toBe(has ? 1 : 0)
      expect(d.weak).toBe(has ? 1 : 0)
      expect(d.mastered).toBe(0)
    }
    const d4 = r.find((d) => d.domain.id === 'd4')!
    expect(d4.answered).toBe(1)
    expect(d4.correct).toBe(0)
    expect(focusDomain(r)).not.toBeNull()
  })
})
