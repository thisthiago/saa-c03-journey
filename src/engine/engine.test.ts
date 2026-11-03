import { describe, expect, it } from 'vitest'
import { checkCondition } from './achievements'
import { evalFor, fixtureRegistry, moduleA, moduleB } from './fixtures'
import { levelForXp, levelProgress, xpForLevel } from './levels'
import { addDays, masteryTier, updateConcept } from './mastery'
import { completeReviewSession, createInitialProgress, submitActivity, submitReview } from './progress'
import { buildPracticeSession, buildReviewSession, dueCount } from './review'
import { missionStatus, nextMission, phaseMedal, phaseStatus } from './selectors'
import { attemptFactor, earnedXp, hintFactor, xpAward } from './xp'
import { createRegistry, validateRegistry } from './registry'
import type { ContentModule, ProgressState, ReviewQuestion } from './types'

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

describe('confiança na revisão', () => {
  // Conceito na caixa 2 (intervalo de 3 dias), revisado no dia seguinte.
  const base = () => {
    let c = updateConcept(undefined, 1, 1, T0)
    c = updateConcept(c, 1, 1, addDays(T0, 1))
    return c
  }
  const day = addDays(T0, 4)
  const daysUntilNext = (c: { nextReviewAt: string }) => (new Date(c.nextReviewAt).getTime() - day.getTime()) / 86_400_000

  it('acerto com certeza sobe a caixa como antes', () => {
    const c = updateConcept(base(), 1, 1, day, 'certeza')
    expect(c).toEqual(updateConcept(base(), 1, 1, day))
    expect(c.box).toBe(3)
  })
  it('acerto no chute não sobe a caixa, volta amanhã e mexe menos no domínio', () => {
    const prev = { ...base(), recentErrors: 2 }
    const c = updateConcept(prev, 1, 1, day, 'chute')
    expect(c.box).toBe(2)
    expect(daysUntilNext(c)).toBe(1)
    expect(c.recentErrors).toBe(2)
    expect(c.mastery).toBeLessThan(updateConcept(prev, 1, 1, day).mastery)
    expect(c.lastPromotionDay).toBe(prev.lastPromotionDay)
  })
  it('acerto com dúvida repete o intervalo da caixa atual', () => {
    const c = updateConcept({ ...base(), recentErrors: 1 }, 1, 1, day, 'duvida')
    expect(c.box).toBe(2)
    expect(daysUntilNext(c)).toBe(3)
    expect(c.recentErrors).toBe(0)
  })
  it('erro com certeza pesa mais que erro comum', () => {
    const sure = updateConcept(base(), 0, 1, day, 'certeza')
    const plain = updateConcept(base(), 0, 1, day, 'duvida')
    expect(sure.box).toBe(1)
    expect(sure.recentErrors).toBe(2)
    expect(plain.recentErrors).toBe(1)
    expect(sure.mastery).toBeLessThan(plain.mastery)
  })
  it('só o acerto com certeza leva a "dominado"', () => {
    let c = updateConcept(undefined, 1, 1, T0, 'duvida')
    for (let d = 1; d < 30; d++) c = updateConcept(c, 1, 1, addDays(T0, d), d % 2 ? 'chute' : 'duvida')
    expect(masteryTier(c)).not.toBe('dominado')
  })
  it('a confiança não muda o XP da revisão', () => {
    const s = submit(createInitialProgress(T0), 'act1', 1).state
    const later = addDays(T0, 1)
    const item = buildReviewSession(s, reg, later)[0].item
    const r = submitReview(s, reg, { conceptId: 'c1', itemId: item.id, evaluation: evalFor(item, 1), now: later, confidence: 'chute' })
    expect(r.state.xp - s.xp).toBe(5)
  })
  it('conta no limite diário só com daily, zerando no dia seguinte', () => {
    const s = submit(createInitialProgress(T0), 'act1', 1).state
    const later = addDays(T0, 1)
    const item = buildReviewSession(s, reg, later)[0].item
    const review = (st: ProgressState, now: Date, daily: boolean) => submitReview(st, reg, { conceptId: 'c1', itemId: item.id, evaluation: evalFor(item, 1), now, daily }).state
    let st = review(s, later, true)
    st = review(st, later, false)
    expect(st.reviews.today).toEqual({ day: '2026-10-02', answered: 1 })
    st = review(st, later, true)
    expect(st.reviews.today?.answered).toBe(2)
    st = review(st, addDays(T0, 2), true)
    expect(st.reviews.today).toEqual({ day: '2026-10-03', answered: 1 })
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

/** Questão da Revisão no formato do exame: 4 opções e 1 correta, ou 5 e 2 corretas. */
function reviewQuestion(id: string, concepts: string[], multiple = false): ReviewQuestion {
  const n = multiple ? 5 : 4
  return {
    id,
    kind: 'decision',
    title: `Questão ${id}`,
    prompt: 'Qual opção atende?',
    concepts: concepts.map((c) => ({ id: c })),
    xp: 5,
    difficulty: 2,
    domain: 'd1',
    multiple,
    explanation: ['Porque atende ao requisito.'],
    options: Array.from({ length: n }, (_, i) => ({ id: `o${i}`, text: `Opção ${i}`, correct: i < (multiple ? 2 : 1), consequence: `Efeito ${i}.` })),
  }
}

/** Conteúdo fictício com a fase a1 ensinando c1 e c2, a2 ensinando c3 e questões próprias da Revisão em a1. */
function registryWithReview(questions: ReviewQuestion[]) {
  const mod: ContentModule = structuredClone(moduleA)
  mod.concepts.push({ ...mod.concepts[1], id: 'c3', title: 'C3' })
  mod.tracks[0].phases[0].concepts = ['c1', 'c2']
  mod.tracks[0].phases[1].concepts = ['c3']
  mod.review = [{ phaseId: 'a1', questions }]
  return createRegistry({
    modules: [mod, moduleB],
    territories: [{ id: 'ter', title: 'Território', summary: '', glyph: 'bucket', status: 'active' }],
    examDomains: [{ id: 'd1', officialName: 'Domínio 1', title: 'Seguras', weight: 0.3 }],
    levelTitles: ['Aprendiz'],
  })
}

describe('questões próprias da Revisão', () => {
  it('substituem as cópias das atividades da fase, e as outras fases continuam copiadas', () => {
    const r = registryWithReview([reviewQuestion('rv:a1.q1', ['c1', 'c2'])])
    const ids = (c: string) => r.reviewItems.get(c)?.map((i) => i.id)
    expect(ids('c1')).toEqual(['rv:a1.q1', 'rv:actb1'])
    expect(ids('c2')).toEqual(['rv:a1.q1', 'rv:act4'])
    expect(validateRegistry(r)).toEqual([])
  })

  it('recusam formato fora do exame, domínio inexistente, conceito de outra fase e id repetido', () => {
    const short = reviewQuestion('rv:a1.curta', ['c1'])
    short.options = short.options.slice(0, 3)
    const multi = reviewQuestion('rv:a1.multipla', ['c1'], true)
    multi.options = multi.options.slice(0, 4)
    const errors = validateRegistry(
      registryWithReview([
        short,
        multi,
        { ...reviewQuestion('rv:a1.dominio', ['c1']), domain: 'd9' as ReviewQuestion['domain'] },
        reviewQuestion('rv:a1.outra-fase', ['c3']),
        reviewQuestion('rv:act4', ['c1']),
      ]),
    )
    expect(errors).toEqual([
      'Revisão rv:a1.curta: resposta única precisa de 4 opções',
      'Revisão rv:a1.multipla: resposta múltipla precisa de 2 ou mais corretas entre 5 ou mais opções',
      'Revisão rv:a1.dominio: domínio inexistente d9',
      'Revisão rv:a1.outra-fase: o conceito c3 não é ensinado pela primeira vez na fase a1',
      'Revisão rv:act4: id usado por dois itens diferentes',
    ])
  })

  it('entram uma vez só na rodada; o conceito usa outra questão sua se a escolhida já entrou', () => {
    const r = registryWithReview([reviewQuestion('rv:a1.q1', ['c1', 'c2']), reviewQuestion('rv:a1.q2', ['c2'])])
    let s = submit(createInitialProgress(T0), 'act1', 0).state
    s = submit(s, 'act2', 0).state
    const review = buildReviewSession(s, r, T0, Infinity).map((e) => [e.conceptId, e.item.id])
    expect(review).toEqual([
      ['c1', 'rv:a1.q1'],
      ['c2', 'rv:a1.q2'],
    ])
    const practice = buildPracticeSession(s, r, Infinity).map((e) => e.item.id)
    expect(practice).toEqual(['rv:a1.q1', 'rv:a1.q2'])
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
