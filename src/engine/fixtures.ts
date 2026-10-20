/**
 * Conteúdo fictício usado só em testes: dois módulos, duas trilhas e uma
 * dependência entre trilhas. Prova que o engine aceita novos módulos sem
 * alterar código central.
 */
import type { ActivityDef } from '../activities/types'
import { createRegistry } from './registry'
import type { ContentModule, MissionDef, PhaseDef } from './types'

const ref = [{ title: 'Doc', url: 'https://docs.aws.amazon.com/example' }]

export function decision(id: string, concept: string, xp = 40): ActivityDef {
  return {
    id,
    kind: 'decision',
    title: `Decisão ${id}`,
    prompt: 'Escolha',
    concepts: [{ id: concept }],
    xp,
    difficulty: 1,
    explanation: ['Porque sim.'],
    options: [
      { id: 'a', text: 'Certa', correct: true, consequence: 'Funciona.' },
      { id: 'b', text: 'Errada', correct: false, consequence: 'Quebra.' },
    ],
  }
}

function mission(id: string, activities: ActivityDef[], type: MissionDef['type'] = 'mission'): MissionDef {
  return {
    id,
    title: `Missão ${id}`,
    type,
    summary: '',
    briefing: { company: 'Ficta', role: 'Arquiteto', situation: '', objective: '', successCriteria: [] },
    intel: [],
    activities,
    debrief: { takeaways: [] },
  }
}

function phase(id: string, order: number, requires: string[], missions: MissionDef[], availability: PhaseDef['availability'] = 'available'): PhaseDef {
  return {
    id,
    order,
    title: `Fase ${id}`,
    subtitle: '',
    summary: '',
    glyph: 'bucket',
    color: '#0ff',
    requires,
    concepts: [],
    missions,
    availability,
    estimatedMinutes: 10,
    map: { x: order * 100, y: 100 },
  }
}

export const moduleA: ContentModule = {
  id: 'mod-a',
  title: 'Módulo A',
  services: [
    { id: 'svc.a', officialName: 'Service A', shortName: 'A', territory: 'ter', summary: '', docsUrl: '', availability: { kind: 'current' }, glyph: 'bucket' },
  ],
  concepts: [
    { id: 'c1', title: 'C1', officialName: 'C1', serviceIds: ['svc.a'], summary: 's', exam: { domains: ['d1'], relevance: 'alta' }, references: ref, tags: ['seguranca'] },
    { id: 'c2', title: 'C2', officialName: 'C2', serviceIds: ['svc.a'], summary: 's', exam: { domains: ['d4'], relevance: 'media' }, references: ref },
  ],
  tracks: [
    {
      id: 'track-a',
      moduleId: 'mod-a',
      territory: 'ter',
      title: 'Trilha A',
      subtitle: '',
      summary: '',
      serviceIds: ['svc.a'],
      phases: [
        phase('a1', 1, [], [mission('m1', [decision('act1', 'c1'), decision('act2', 'c2', 60)]), mission('m2', [decision('act3', 'c1')], 'boss')]),
        phase('a2', 2, ['a1'], [mission('m3', [decision('act4', 'c2')])]),
        phase('a3', 3, ['a1'], [], 'in-construction'),
      ],
    },
  ],
  achievements: [
    { id: 'ach-a1', title: 'Fase A1', description: '', category: 'exploracao', glyph: 'trophy', xp: 25, condition: { type: 'phase-completed', phaseId: 'a1' } },
    { id: 'ach-comeback', title: 'Volta por cima', description: '', category: 'aprendizagem', glyph: 'flag', xp: 10, condition: { type: 'comeback', count: 1 } },
  ],
}

export const moduleB: ContentModule = {
  id: 'mod-b',
  title: 'Módulo B',
  services: [],
  concepts: [],
  tracks: [
    {
      id: 'track-b',
      moduleId: 'mod-b',
      territory: 'ter',
      title: 'Trilha B',
      subtitle: '',
      summary: '',
      serviceIds: [],
      requires: ['track-a'],
      phases: [phase('b1', 1, [], [mission('mb1', [decision('actb1', 'c1')])])],
    },
  ],
  achievements: [],
}

export function fixtureRegistry() {
  return createRegistry({
    modules: [moduleA, moduleB],
    territories: [{ id: 'ter', title: 'Território', summary: '', glyph: 'bucket', status: 'active' }],
    examDomains: [],
    levelTitles: ['Aprendiz', 'Cadete', 'Analista'],
  })
}

/** Avaliação sintética: score aplicado a todos os conceitos da atividade. */
export function evalFor(activity: ActivityDef, score: number) {
  return {
    score,
    items: [],
    conceptOutcomes: Object.fromEntries(activity.concepts.map((c) => [c.id, score])),
  }
}
