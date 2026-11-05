import { describe, expect, it } from 'vitest'
import { fixtureRegistry } from './fixtures'
import { createInitialProgress, markMissionsCompleted } from './progress'
import { buildReviewSession } from './review'
import { missionStatus, phasesToComplete, phaseStatus } from './selectors'

const reg = fixtureRegistry()
const now = new Date('2026-11-05T12:00:00Z')

describe('conclusão manual de missões', () => {
  it('marca a missão sem XP, libera a seguinte e põe os conceitos vencidos na Revisão', () => {
    const { state, events } = markMissionsCompleted(createInitialProgress(now), reg, ['m1'], now)
    expect(state.missions.m1).toMatchObject({ passedAt: now.toISOString(), manual: true, bonusAwarded: false })
    expect(state.xp).toBe(0)
    expect(events).toEqual([{ type: 'mission-passed', missionId: 'm1', title: 'Missão m1' }])
    expect(missionStatus(state, reg, 'm2')).toBe('available')
    expect(state.concepts.c1).toMatchObject({ evidence: 1, box: 0, nextReviewAt: now.toISOString() })
    expect(Object.keys(state.discovered).sort()).toEqual(['c1', 'c2'])
    expect(buildReviewSession(state, reg, now).map((e) => e.conceptId).sort()).toEqual(['c1', 'c2'])
  })

  it('concluir todas as missões conclui a fase e libera as conquistas de conclusão', () => {
    const { state, events } = markMissionsCompleted(createInitialProgress(now), reg, ['m1', 'm2'], now)
    expect(phaseStatus(state, reg, 'a1')).toBe('completed')
    expect(phaseStatus(state, reg, 'a2')).toBe('available')
    expect(events.map((e) => e.type)).toEqual(['phase-completed', 'achievement', 'xp'])
    expect(state.xp).toBe(25)
  })

  it('não mexe em conceitos que já têm evidência nem em missões já aprovadas', () => {
    const start = markMissionsCompleted(createInitialProgress(now), reg, ['m1'], now).state
    start.concepts.c1 = { ...start.concepts.c1, mastery: 0.9, box: 3, evidence: 5 }
    const later = new Date('2026-11-06T12:00:00Z')
    const { state, events } = markMissionsCompleted(start, reg, ['m1'], later)
    expect(events).toEqual([])
    expect(state.missions.m1.passedAt).toBe(now.toISOString())
    expect(markMissionsCompleted(start, reg, ['m2'], later).state.concepts.c1).toEqual(start.concepts.c1)
  })

  it('lista as fases que faltam, inclusive as das trilhas exigidas, em ordem', () => {
    const empty = createInitialProgress(now)
    expect(phasesToComplete(empty, reg, reg.phases.get('b1')!.phase).map((p) => p.id)).toEqual(['a1', 'a2', 'b1'])
    expect(phaseStatus(empty, reg, 'b1')).toBe('locked')
    const missions = phasesToComplete(empty, reg, reg.phases.get('b1')!.phase).flatMap((p) => p.missions.map((m) => m.id))
    const { state } = markMissionsCompleted(empty, reg, missions, now)
    expect(phaseStatus(state, reg, 'b1')).toBe('completed')
    expect(phasesToComplete(state, reg, reg.phases.get('b1')!.phase)).toEqual([])
  })
})
