import { describe, expect, it } from 'vitest'
import { checkCondition } from './achievements'
import { evalFor, fixtureRegistry, moduleA, moduleB } from './fixtures'
import { levelForXp, levelProgress, xpForLevel } from './levels'
import { addDays, masteryTier, updateConcept } from './mastery'
import { completeReviewSession, createInitialProgress, submitActivity, submitReview } from './progress'
import { buildReviewSession, dueCount } from './review'
import { missionStatus, nextMission, phaseMedal, phaseStatus } from './selectors'
import { attemptFactor, earnedXp, hintFactor, xpAward } from './xp'
import { createRegistry, validateRegistry } from './registry'
import type { ProgressState } from './types'

const T0 = new Date('2026-10-01T12:00:00Z')
const reg = fixtureRegistry()

function submit(state: ProgressState, activityId: string, score: number, opts: { hints?: number; solution?: boolean; now?: Date } = {}) {
  const activity = reg.activities.get(activityId)!.activity
  return submitActivity(state, reg, {
    activityId,
    evaluation: evalFor(activity, score),
    hintsUsed: opts.hints ?? 0,
    solutionViewed: opts.solution ?? false,
    now: opts.now ?? T0,
  })
}

describe('XP', () => {
  it('reduz o fator por tentativa, com piso e teto pós-solução', () => {
    expect([1, 2, 3, 4, 9].map((n) => attemptFactor(n, false))).toEqual([1, 0.75, 0.5, 0.35, 0.35])
    expect(attemptFactor(1, true)).toBe(0.25)
  })
  it('desconta dicas até o mínimo', () => {
    expect(hintFactor(0)).toBe(1)
    expect(hintFactor(1)).toBeCloseTo(0.85)
    expect(hintFactor(10)).toBe(0.55)
  })
  it('concede só a melhoria', () => {
    expect(earnedXp(40, 0.5, 1, 0, false)).toBe(20)
    expect(earnedXp(40, 1, 2, 0, false)).toBe(30)
    expect(xpAward(20, 30)).toBe(10)
    expect(xpAward(30, 20)).toBe(0)
  })
})

describe('níveis', () => {
  it('segue a curva 50·L·(L−1)', () => {
    expect([1, 2, 3, 5, 10].map(xpForLevel)).toEqual([0, 100, 300, 1000, 4500])
    expect(levelForXp(0)).toBe(1)
    expect(levelForXp(99)).toBe(1)
    expect(levelForXp(100)).toBe(2)
    expect(levelForXp(4499)).toBe(9)
    expect(levelForXp(4500)).toBe(10)
  })
  it('calcula a fração até o próximo nível', () => {
    const p = levelProgress(200)
    expect(p).toMatchObject({ level: 2, floor: 100, next: 300 })
    expect(p.ratio).toBeCloseTo(0.5)
  })
})

describe('domínio e Leitner', () => {
  it('começa em 0,2 e converge com acertos', () => {
    const c1 = updateConcept(undefined, 1, 1, T0)
    expect(c1.mastery).toBeCloseTo(0.52)
    expect(c1.box).toBe(1)
    expect(masteryTier(c1)).toBe('praticando')
  })
  it('só promove uma caixa por dia, exigindo acertos espaçados para "dominado"', () => {
    let c = updateConcept(undefined, 1, 1, T0)
    c = updateConcept(c, 1, 1, T0)
    c = updateConcept(c, 1, 1, T0)
    expect(c.box).toBe(1)
    expect(c.mastery).toBeGreaterThan(0.8)
    expect(masteryTier(c)).toBe('praticando')
    c = updateConcept(c, 1, 1, addDays(T0, 1))
    expect(c.box).toBe(2)
    expect(masteryTier(c)).toBe('dominado')
  })
  it('erro volta para a caixa 1 e agenda para o dia seguinte', () => {
    let c = updateConcept(undefined, 1, 1, T0)
    c = updateConcept(c, 1, 1, addDays(T0, 1))
    c = updateConcept(c, 0, 1, addDays(T0, 2))
    expect(c.box).toBe(1)
    expect(c.recentErrors).toBe(1)
    expect(c.nextReviewAt).toBe(addDays(T0, 3).toISOString())
  })
})

describe('progresso de atividades e missões', () => {
  it('não concede XP ao repetir com o mesmo resultado', () => {
    const r1 = submit(createInitialProgress(T0), 'act1', 1)
    const xpAfterFirst = r1.state.xp
    const r2 = submit(r1.state, 'act1', 1)
    expect(r2.state.xp).toBe(xpAfterFirst)
    expect(r2.state.activities.act1.attempts).toBe(2)
  })
  it('aprova a missão pela média ponderada e concede bônus uma única vez', () => {
    let s = submit(createInitialProgress(T0), 'act1', 1).state
    const r = submit(s, 'act2', 1)
    expect(r.events.some((e) => e.type === 'mission-passed')).toBe(true)
    s = r.state
    // 40 + 60 de atividades + 20 de bônus
    expect(s.xp).toBe(120)
    expect(s.missions.m1.bonusAwarded).toBe(true)
    const again = submit(s, 'act2', 1)
    expect(again.state.xp).toBe(120)
  })
  it('não aprova com média abaixo do limiar, e permite recuperar', () => {
    let s = submit(createInitialProgress(T0), 'act1', 1).state
    s = submit(s, 'act2', 0).state
    expect(missionStatus(s, reg, 'm1')).toBe('in-progress')
    const r = submit(s, 'act2', 1)
    expect(missionStatus(r.state, reg, 'm1')).toBe('passed')
    expect(r.state.stats.comebacks).toBe(1)
    expect(r.events.some((e) => e.type === 'achievement' && e.achievementId === 'ach-comeback')).toBe(true)
  })
  it('libera missões em sequência e fases por pré-requisito', () => {
    let s = createInitialProgress(T0)
    expect(missionStatus(s, reg, 'm1')).toBe('available')
    expect(missionStatus(s, reg, 'm2')).toBe('locked')
    expect(phaseStatus(s, reg, 'a2')).toBe('locked')
    expect(phaseStatus(s, reg, 'a3')).toBe('in-construction')
    s = submit(s, 'act1', 1).state
    s = submit(s, 'act2', 1).state
    expect(missionStatus(s, reg, 'm2')).toBe('available')
    const r = submit(s, 'act3', 1)
    expect(r.events.some((e) => e.type === 'phase-completed')).toBe(true)
    expect(phaseStatus(r.state, reg, 'a1')).toBe('completed')
    expect(phaseStatus(r.state, reg, 'a2')).toBe('available')
    expect(phaseMedal(r.state, reg.phases.get('a1')!.phase)).toBe('ouro')
  })
  it('bloqueia trilha com dependência de outra trilha não concluída', () => {
    let s = createInitialProgress(T0)
    expect(phaseStatus(s, reg, 'b1')).toBe('locked')
    for (const id of ['act1', 'act2', 'act3', 'act4']) s = submit(s, id, 1).state
    expect(phaseStatus(s, reg, 'b1')).toBe('available')
  })
  it('evidência após a solução guiada pesa menos no domínio', () => {
    const normal = submit(createInitialProgress(T0), 'act1', 1).state.concepts.c1.mastery
    const guided = submit(createInitialProgress(T0), 'act1', 1, { solution: true }).state.concepts.c1.mastery
    expect(guided).toBeLessThan(normal)
  })
  it('emite subida de nível com título', () => {
    let s = createInitialProgress(T0)
    for (const id of ['act1', 'act2', 'act3']) s = submit(s, id, 1).state
    expect(s.xp).toBeGreaterThanOrEqual(100)
    expect(levelForXp(s.xp)).toBeGreaterThanOrEqual(2)
    const events = submit(createInitialProgress(T0), 'act1', 1).events
    expect(events.find((e) => e.type === 'level-up')).toBeUndefined()
  })
  it('sugere a próxima missão disponível', () => {
    const s = createInitialProgress(T0)
    expect(nextMission(s, reg)).toMatchObject({ missionId: 'm1', reason: 'next' })
  })
  it('prefere a trilha em que a pessoa estava jogando', () => {
    // Duas trilhas independentes; a B (depois no registro) ganha uma segunda fase.
    const tb = moduleB.tracks[0]
    const b1 = tb.phases[0]
    const b2 = { ...b1, id: 'b2', order: 2, requires: ['b1'], missions: b1.missions.map((m) => ({ ...m, id: 'mb2', activities: m.activities.map((a) => ({ ...a, id: 'actb2' })) })) }
    const indep = createRegistry({
      modules: [moduleA, { ...moduleB, tracks: [{ ...tb, requires: [], phases: [b1, b2] }] }],
      territories: [{ id: 'ter', title: 'T', summary: '', glyph: 'bucket', status: 'active' }],
      examDomains: [],
      levelTitles: ['A'],
    })
    let s = createInitialProgress(T0)
    expect(nextMission(s, indep)?.missionId).toBe('m1')
    s = submit(s, 'actb1', 1).state
    s.missions.mb1 = { startedAt: addDays(T0, 1).toISOString(), bonusAwarded: true, passedAt: addDays(T0, 1).toISOString() }
    // A pessoa estava na trilha B: a sugestão continua nela, não volta para a A.
    expect(nextMission(s, indep)?.missionId).toBe('mb2')
  })
})

describe('revisão espaçada', () => {
  it('agenda conceitos estudados e concede XP só para itens vencidos', () => {
    let s = submit(createInitialProgress(T0), 'act1', 1).state
    expect(dueCount(s, reg, T0)).toBe(0)
    const later = addDays(T0, 1)
    expect(dueCount(s, reg, later)).toBe(1)
    const session = buildReviewSession(s, reg, later)
    expect(session[0].conceptId).toBe('c1')
    const item = session[0].item
    const r1 = submitReview(s, reg, { conceptId: 'c1', itemId: item.id, evaluation: evalFor(item, 1), now: later })
    expect(r1.state.xp - s.xp).toBe(5)
    s = r1.state
    const r2 = submitReview(s, reg, { conceptId: 'c1', itemId: item.id, evaluation: evalFor(item, 1), now: later })
    expect(r2.state.xp).toBe(s.xp)
  })
  it('inclui conceitos fracos mesmo antes do vencimento', () => {
    const s = submit(createInitialProgress(T0), 'act1', 0).state
    expect(dueCount(s, reg, T0)).toBe(1)
  })
  it('conta sessões concluídas', () => {
    const s = completeReviewSession(createInitialProgress(T0), reg, T0).state
    expect(s.reviews.sessions).toBe(1)
    expect(checkCondition({ type: 'reviews-completed', count: 1 }, s, reg)).toBe(true)
  })
})

describe('registro', () => {
  it('valida o conteúdo fictício sem erros', () => {
    expect(validateRegistry(reg)).toEqual([])
  })
  it('detecta ciclos e referências inválidas', () => {
    const broken = fixtureRegistry()
    const a2 = broken.phases.get('a2')!.phase
    const a1 = broken.phases.get('a1')!.phase
    a1.requires.push('a2')
    a2.requires.push('fase-inexistente')
    const errors = validateRegistry(broken)
    expect(errors.some((e) => e.startsWith('Ciclo'))).toBe(true)
    expect(errors.some((e) => e.includes('fase-inexistente'))).toBe(true)
    a1.requires.pop()
    a2.requires.pop()
  })
  it('detecta ciclos entre trilhas (fase exige fase de uma trilha que exige a sua)', () => {
    const broken = fixtureRegistry()
    const a1 = broken.phases.get('a1')!.phase
    a1.requires.push('b1') // trilha B já exige a trilha A inteira
    const errors = validateRegistry(broken)
    expect(errors.some((e) => e.startsWith('Ciclo'))).toBe(true)
    a1.requires.pop()
    expect(validateRegistry(broken)).toEqual([])
  })
})

import { streakDays } from './selectors'
describe('sequência de dias', () => {
  it('conta dias consecutivos até hoje ou ontem', () => {
    const now = new Date('2026-10-10T10:00:00Z')
    expect(streakDays(['2026-10-08', '2026-10-09', '2026-10-10'], now)).toBe(3)
    expect(streakDays(['2026-10-08', '2026-10-09'], now)).toBe(2)
    expect(streakDays(['2026-10-07'], now)).toBe(0)
  })
})
