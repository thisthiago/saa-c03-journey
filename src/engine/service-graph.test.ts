/**
 * Grafo de serviços: nós só do catálogo, contagem de questões sem repetição,
 * arestas apenas por conceitos em comum e estado derivado das fases oficiais.
 */
import { describe, expect, it } from 'vitest'
import { registry } from '../content'
import { decision } from './fixtures'
import { createInitialProgress } from './progress'
import { createRegistry } from './registry'
import { missionStatus, phaseStatus } from './selectors'
import { allPhaseStatuses, buildServiceGraph, serviceProgress } from './service-graph'
import { recommendedTrackOrder } from './track-order'
import type { ContentModule, MissionDef, PhaseDef, ProgressState } from './types'

const NOW = new Date('2026-10-29T12:00:00Z')
const graph = buildServiceGraph(registry)
const ORDER = recommendedTrackOrder(registry).map((s) => s.track.id)

function progressOf(state: ProgressState, id: string) {
  return serviceProgress(state, registry, graph.byId.get(id)!, allPhaseStatuses(state, registry), ORDER)
}

/** Progresso com todas as missões das fases indicadas aprovadas. */
function withPhasesPassed(phaseIds: string[]): ProgressState {
  const state = createInitialProgress(NOW)
  const at = NOW.toISOString()
  for (const pid of phaseIds) {
    for (const m of registry.phases.get(pid)!.phase.missions) state.missions[m.id] = { startedAt: at, passedAt: at, bonusAwarded: true }
  }
  return state
}

describe('grafo de serviços (conteúdo real)', () => {
  it('só tem serviços do catálogo e inclui todo serviço que alguma fase ensina', () => {
    for (const n of graph.nodes) {
      expect(registry.services.has(n.id)).toBe(true)
      expect(n.territory).toBe(registry.services.get(n.id)!.territory)
    }
    const taught = new Set<string>()
    for (const [cid, pid] of registry.conceptPhase) {
      if (registry.phases.get(pid)?.phase.availability !== 'available') continue
      for (const sid of registry.concepts.get(cid)!.serviceIds) taught.add(sid)
    }
    expect(new Set(graph.nodes.map((n) => n.id))).toEqual(taught)
  })

  it('conta cada questão uma vez por serviço', () => {
    for (const id of ['aws.s3', 'aws.iam', 'aws.lambda']) {
      const expected = [...registry.questions.values()].filter(({ question: q }) =>
        [q.concept, ...(q.related ?? [])].some((c) => registry.concepts.get(c)!.serviceIds.includes(id)),
      ).length
      const n = graph.byId.get(id)!
      expect(n.questions).toBe(expected)
      expect(Object.values(n.questionsByDomain).reduce((a, b) => a + b, 0)).toBe(expected)
      expect(n.mainQuestions).toBeLessThanOrEqual(n.questions)
    }
    expect(graph.maxQuestions).toBe(Math.max(...graph.nodes.map((n) => n.questions)))
  })

  it('liga só serviços que dividem conceitos, com a lista exata, sem laço nem repetição', () => {
    const keys = new Set<string>()
    for (const e of graph.edges) {
      expect(e.source < e.target).toBe(true)
      const key = `${e.source}|${e.target}`
      expect(keys.has(key)).toBe(false)
      keys.add(key)
      const shared = [...registry.concepts.values()].filter((c) => c.serviceIds.includes(e.source) && c.serviceIds.includes(e.target)).map((c) => c.id)
      expect(e.conceptIds).toEqual(shared)
    }
    const athenaGlue = graph.edges.find((e) => e.source === 'aws.athena' && e.target === 'aws.glue')
    expect(athenaGlue?.conceptIds.length).toBeGreaterThan(1)
  })

  it('no começo, o estado segue o status oficial das fases', () => {
    const state = createInitialProgress(NOW)
    expect(progressOf(state, 'aws.s3').status).toBe('available')
    const tgw = progressOf(state, 'aws.transit-gateway')
    expect(tgw.status).toBe('locked')
    expect(tgw.nextMissionId).toBeUndefined()
    expect(tgw.unlockPhaseId && graph.byId.get('aws.transit-gateway')!.phaseIds).toContain(tgw.unlockPhaseId)
    for (const n of graph.nodes) {
      const locked = n.phaseIds.every((p) => phaseStatus(state, registry, p) === 'locked')
      expect(progressOf(state, n.id).status === 'locked').toBe(locked)
    }
  })

  it('a próxima missão sugerida é sempre jogável', () => {
    const state = withPhasesPassed(['s3x.f01'])
    for (const n of graph.nodes) {
      const p = progressOf(state, n.id)
      if (p.status === 'locked' || p.status === 'completed') continue
      expect(p.nextMissionId).toBeDefined()
      expect(['available', 'in-progress']).toContain(missionStatus(state, registry, p.nextMissionId!))
    }
  })

  it('com a Fase 1 da S3 concluída, o S3 fica em andamento e conta as missões', () => {
    const p = progressOf(withPhasesPassed(['s3x.f01']), 'aws.s3')
    expect(p.status).toBe('in-progress')
    expect(p.phases.completed).toBeGreaterThanOrEqual(1)
    expect(p.missions.passed).toBe(registry.phases.get('s3x.f01')!.phase.missions.length)
  })

  it('não altera o progresso recebido', () => {
    const state = withPhasesPassed(['s3x.f01'])
    const copy = structuredClone(state)
    for (const n of graph.nodes) progressOf(state, n.id)
    expect(state).toEqual(copy)
  })
})

describe('grafo de serviços (conteúdo fictício)', () => {
  const ref = [{ title: 'Doc', url: 'https://docs.aws.amazon.com/example' }]
  const mission = (id: string, concept: string): MissionDef => ({
    id,
    title: id,
    type: 'mission',
    summary: '',
    briefing: { company: '', role: '', situation: '', objective: '', successCriteria: [] },
    intel: [],
    activities: [decision(`${id}.a`, concept)],
    debrief: { takeaways: [] },
  })
  const phase = (id: string, order: number, requires: string[], concepts: string[]): PhaseDef => ({
    id,
    order,
    title: id,
    subtitle: '',
    summary: '',
    glyph: 'bucket',
    color: '#0ff',
    requires,
    concepts,
    missions: [mission(`${id}.m`, concepts[0])],
    availability: 'available',
    estimatedMinutes: 5,
    map: { x: order * 100, y: 100 },
  })
  const svc = (id: string) => ({ id, officialName: id, shortName: id, territory: 'ter', summary: '', docsUrl: '', availability: { kind: 'current' as const }, glyph: 'bucket' as const })
  const concept = (id: string, serviceIds: string[]) => ({ id, title: id, officialName: id, serviceIds, summary: 's', exam: { domains: ['d1' as const], relevance: 'alta' as const }, references: ref })
  const mod: ContentModule = {
    id: 'm',
    title: 'M',
    services: [svc('x'), svc('y'), svc('solto')],
    concepts: [concept('cx', ['x']), concept('cxy', ['x', 'y']), concept('cy', ['y'])],
    tracks: [{ id: 't', moduleId: 'm', territory: 'ter', title: 'T', subtitle: '', summary: '', serviceIds: [], phases: [phase('p1', 1, [], ['cx', 'cxy']), phase('p2', 2, ['p1'], ['cy'])] }],
    achievements: [],
    questions: [
      {
        id: 'q1',
        concept: 'cx',
        related: ['cxy'],
        difficulty: 1,
        domain: 'd2',
        stem: ['s'],
        question: 'q',
        options: ['a', 'b', 'c', 'd'].map((o, i) => ({ id: o, text: o, correct: i === 0, why: 'w' })),
        explanation: ['e'],
      },
    ],
  }
  const reg = createRegistry({ modules: [mod], territories: [{ id: 'ter', title: 'Ter', summary: '', glyph: 'bucket', status: 'active' }], examDomains: [], levelTitles: ['A'] })
  const g = buildServiceGraph(reg)
  const prog = (state: ProgressState, id: string) => serviceProgress(state, reg, g.byId.get(id)!, allPhaseStatuses(state, reg), ['t'])

  it('uma questão que cita dois conceitos do mesmo serviço conta uma vez', () => {
    expect(g.byId.get('x')!.questions).toBe(1)
    expect(g.byId.get('x')!.mainQuestions).toBe(1)
    expect(g.byId.get('y')!.questions).toBe(1)
    expect(g.byId.get('y')!.mainQuestions).toBe(0)
    expect(g.byId.get('y')!.questionsByDomain.d2).toBe(1)
  })

  it('serviço sem fase que o ensine fica fora do grafo', () => {
    expect(g.byId.has('solto')).toBe(false)
    expect(g.edges).toEqual([{ source: 'x', target: 'y', conceptIds: ['cxy'] }])
  })

  it('passa de desbloqueado a em andamento e concluído conforme as fases', () => {
    const state = createInitialProgress(NOW)
    expect(prog(state, 'x').status).toBe('available')
    expect(prog(state, 'y').status).toBe('available')
    state.missions['p1.m'] = { startedAt: NOW.toISOString(), passedAt: NOW.toISOString(), bonusAwarded: true }
    expect(prog(state, 'x').status).toBe('completed')
    expect(prog(state, 'x').nextMissionId).toBeUndefined()
    const y = prog(state, 'y')
    expect(y.status).toBe('in-progress')
    expect(y.phases).toEqual({ completed: 1, total: 2 })
    expect(y.nextMissionId).toBe('p2.m')
    state.missions['p2.m'] = { startedAt: NOW.toISOString(), passedAt: NOW.toISOString(), bonusAwarded: true }
    expect(prog(state, 'y').status).toBe('completed')
  })

  it('serviço ensinado só em fase bloqueada fica bloqueado e aponta a fase', () => {
    const mod2: ContentModule = { ...mod, concepts: [concept('cx', ['x']), concept('cy', ['y'])], questions: [] }
    const reg2 = createRegistry({ modules: [mod2], territories: reg.territories, examDomains: [], levelTitles: ['A'] })
    const g2 = buildServiceGraph(reg2)
    const state = createInitialProgress(NOW)
    const y = serviceProgress(state, reg2, g2.byId.get('y')!, allPhaseStatuses(state, reg2), ['t'])
    expect(y.status).toBe('locked')
    expect(y.unlockPhaseId).toBe('p2')
    expect(y.nextMissionId).toBeUndefined()
  })
})
