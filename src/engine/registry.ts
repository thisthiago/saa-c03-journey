/**
 * Registro de conteúdo: indexa módulos (serviços, conceitos, trilhas, fases,
 * missões, atividades, conquistas) e valida as referências entre eles.
 *
 * Novos módulos são adicionados em src/content/index.ts; nada aqui precisa
 * mudar para receber uma nova trilha ou serviço.
 */
import type { ActivityDef, DecisionActivity } from '../activities/types'
import type {
  AchievementDef,
  ConceptDef,
  ContentModule,
  ExamDomain,
  ExamQuestion,
  MissionDef,
  PhaseDef,
  ServiceDef,
  TerritoryDef,
  TrackDef,
} from './types'

export interface PhaseRef {
  phase: PhaseDef
  track: TrackDef
  isFinal: boolean
}
export interface MissionRef {
  mission: MissionDef
  phase: PhaseDef
  track: TrackDef
  index: number
}
export interface ActivityRef {
  activity: ActivityDef
  mission: MissionDef
  phase: PhaseDef
  track: TrackDef
}

export interface QuestionRef {
  question: ExamQuestion
  moduleId: string
  /** Trilha do módulo da questão (para filtrar por trilha). */
  track?: TrackDef
}

export interface RegistryInput {
  modules: ContentModule[]
  territories: TerritoryDef[]
  examDomains: ExamDomain[]
  levelTitles: string[]
}

export interface Registry {
  modules: ContentModule[]
  territories: TerritoryDef[]
  examDomains: ExamDomain[]
  levelTitles: string[]
  services: Map<string, ServiceDef>
  concepts: Map<string, ConceptDef>
  tracks: Map<string, TrackDef>
  phases: Map<string, PhaseRef>
  missions: Map<string, MissionRef>
  activities: Map<string, ActivityRef>
  achievements: Map<string, AchievementDef>
  /** Itens de revisão por conceito (escritos à mão + derivados das atividades). */
  reviewItems: Map<string, ActivityDef[]>
  /** Primeira fase que ensina o conceito (para intercalar a revisão e mostrar no Codex). */
  conceptPhase: Map<string, string>
  /** Banco de questões, na ordem dos módulos. */
  questions: Map<string, QuestionRef>
}

/** Fases do mapa de uma trilha, incluindo o desafio final. */
export function trackPhases(track: TrackDef): PhaseDef[] {
  return track.final ? [...track.phases, track.final] : track.phases
}

/** Território a que a trilha pertence. */
export function trackTerritory(reg: Registry, trackId: string): TerritoryDef | undefined {
  const t = reg.tracks.get(trackId)
  return reg.territories.find((x) => x.id === t?.territory)
}

export function createRegistry(input: RegistryInput): Registry {
  const reg: Registry = {
    modules: input.modules,
    territories: input.territories,
    examDomains: input.examDomains,
    levelTitles: input.levelTitles,
    services: new Map(),
    concepts: new Map(),
    tracks: new Map(),
    phases: new Map(),
    missions: new Map(),
    activities: new Map(),
    achievements: new Map(),
    reviewItems: new Map(),
    conceptPhase: new Map(),
    questions: new Map(),
  }
  const addReview = (conceptId: string, item: ActivityDef) => {
    const list = reg.reviewItems.get(conceptId) ?? []
    if (!list.some((i) => i.id === item.id)) list.push(item)
    reg.reviewItems.set(conceptId, list)
  }
  for (const mod of input.modules) {
    for (const s of mod.services) reg.services.set(s.id, s)
    for (const c of mod.concepts) {
      reg.concepts.set(c.id, c)
      for (const item of c.reviewItems ?? []) addReview(c.id, item)
    }
    for (const a of mod.achievements) reg.achievements.set(a.id, a)
    for (const q of mod.questions ?? []) reg.questions.set(q.id, { question: q, moduleId: mod.id, track: mod.tracks[0] })
    for (const t of mod.tracks) {
      reg.tracks.set(t.id, t)
      for (const p of trackPhases(t)) {
        reg.phases.set(p.id, { phase: p, track: t, isFinal: p === t.final })
        for (const cid of p.concepts) if (!reg.conceptPhase.has(cid)) reg.conceptPhase.set(cid, p.id)
        p.missions.forEach((m, index) => {
          reg.missions.set(m.id, { mission: m, phase: p, track: t, index })
          for (const a of m.activities) {
            reg.activities.set(a.id, { activity: a, mission: m, phase: p, track: t })
            if (p.availability === 'available') {
              for (const item of deriveReviewItems(a)) for (const c of item.concepts) addReview(c.id, item)
            }
          }
        })
      }
    }
  }
  return reg
}

/**
 * Gera desafios curtos de revisão a partir de uma atividade já estudada.
 * Itens longos (ordenação, investigação, laboratórios) não são derivados.
 */
export function deriveReviewItems(a: ActivityDef): ActivityDef[] {
  const base = { difficulty: a.difficulty, xp: 5, hints: undefined }
  switch (a.kind) {
    case 'classify':
      return a.items.map((item) => ({
        ...base,
        kind: 'classify' as const,
        id: `rv:${a.id}:${item.id}`,
        title: a.title,
        prompt: 'Classifique o item na categoria correta.',
        concepts: item.concepts ? item.concepts.map((id) => ({ id })) : a.concepts,
        bins: a.bins,
        items: [item],
        explanation: [item.explanation],
      }))
    case 'match':
      return a.pairs.map((pair) => {
        const options = a.pairs.map((p) => ({
          id: p.id,
          text: p.right,
          correct: p.id === pair.id,
          consequence: p.id === pair.id ? pair.explanation : `Essa descrição corresponde a “${p.left}”. ${p.explanation}`,
        }))
        const item: DecisionActivity = {
          ...base,
          kind: 'decision',
          id: `rv:${a.id}:${pair.id}`,
          title: a.title,
          prompt: `Qual opção de “${a.rightLabel}” corresponde a **${pair.left}**?`,
          concepts: pair.concepts ? pair.concepts.map((id) => ({ id })) : a.concepts,
          options,
          explanation: [pair.explanation],
        }
        return item
      })
    case 'decision':
    case 'predict':
    case 'estimate':
      return [{ ...a, ...base, id: `rv:${a.id}` }]
    default:
      return []
  }
}

/** Valida referências e regras estruturais do conteúdo. Retorna a lista de problemas. */
export function validateRegistry(reg: Registry): string[] {
  const errors: string[] = []
  const ids = new Set<string>()
  const unique = (kind: string, id: string) => {
    const key = `${kind}:${id}`
    if (ids.has(key)) errors.push(`${kind} duplicado: ${id}`)
    ids.add(key)
  }
  const territoryIds = new Set(reg.territories.map((t) => t.id))
  for (const mod of reg.modules) {
    for (const s of mod.services) {
      unique('serviço', s.id)
      if (!territoryIds.has(s.territory)) errors.push(`Serviço ${s.id}: território inexistente ${s.territory}`)
    }
    for (const c of mod.concepts) {
      unique('conceito', c.id)
      for (const s of c.serviceIds) if (!reg.services.has(s)) errors.push(`Conceito ${c.id}: serviço inexistente ${s}`)
      for (const p of c.prerequisites ?? []) if (!reg.concepts.has(p)) errors.push(`Conceito ${c.id}: pré-requisito inexistente ${p}`)
      if (c.references.length === 0) errors.push(`Conceito ${c.id}: sem referência oficial`)
      for (const r of c.references) if (!/^https:\/\/(docs\.)?aws\.amazon\.com\//.test(r.url)) errors.push(`Conceito ${c.id}: referência não oficial ${r.url}`)
      if (!c.summary.trim()) errors.push(`Conceito ${c.id}: resumo vazio`)
    }
    for (const a of mod.achievements) {
      unique('conquista', a.id)
      for (const ref of conditionRefs(a.condition)) {
        if (ref.kind === 'phase' && !reg.phases.has(ref.id)) errors.push(`Conquista ${a.id}: fase inexistente ${ref.id}`)
        if (ref.kind === 'mission' && !reg.missions.has(ref.id)) errors.push(`Conquista ${a.id}: missão inexistente ${ref.id}`)
        if (ref.kind === 'activity' && !reg.activities.has(ref.id)) errors.push(`Conquista ${a.id}: atividade inexistente ${ref.id}`)
        if (ref.kind === 'concept' && !reg.concepts.has(ref.id)) errors.push(`Conquista ${a.id}: conceito inexistente ${ref.id}`)
      }
    }
    for (const t of mod.tracks) {
      unique('trilha', t.id)
      if (!territoryIds.has(t.territory)) errors.push(`Trilha ${t.id}: território inexistente ${t.territory}`)
      for (const dep of [...(t.requires ?? []), ...(t.recommends ?? [])]) if (!reg.tracks.has(dep)) errors.push(`Trilha ${t.id}: dependência inexistente ${dep}`)
      const phases = trackPhases(t)
      for (const p of phases) {
        unique('fase', p.id)
        for (const dep of [...p.requires, ...(p.recommends ?? [])]) {
          if (!reg.phases.has(dep)) errors.push(`Fase ${p.id}: dependência inexistente ${dep}`)
        }
        for (const c of p.concepts) if (!reg.concepts.has(c)) errors.push(`Fase ${p.id}: conceito inexistente ${c}`)
        if (p.availability === 'available' && p.missions.length === 0) errors.push(`Fase ${p.id}: disponível sem missões`)
        for (const m of p.missions) {
          unique('missão', m.id)
          if (m.activities.length === 0) errors.push(`Missão ${m.id}: sem atividades`)
          for (const card of m.intel) if (!reg.concepts.has(card.conceptId)) errors.push(`Missão ${m.id}: intel com conceito inexistente ${card.conceptId}`)
          for (const a of m.activities) {
            unique('atividade', a.id)
            validateActivity(reg, a, `Atividade ${a.id}`, errors)
          }
        }
      }
    }
  }
  for (const mod of reg.modules) for (const q of mod.questions ?? []) {
    unique('questão', q.id)
    validateQuestion(reg, q, errors)
  }
  errors.push(...findCycles(reg))
  for (const [cid, items] of reg.reviewItems) {
    for (const item of items) validateActivity(reg, item, `Revisão ${item.id} (${cid})`, errors)
  }
  return errors
}

function validateQuestion(reg: Registry, q: ExamQuestion, errors: string[]) {
  const label = `Questão ${q.id}`
  for (const c of [q.concept, ...(q.related ?? [])]) if (!reg.concepts.has(c)) errors.push(`${label}: conceito inexistente ${c}`)
  if (!reg.examDomains.some((d) => d.id === q.domain)) errors.push(`${label}: domínio inexistente ${q.domain}`)
  if (q.stem.length === 0 || !q.question.trim()) errors.push(`${label}: enunciado vazio`)
  if (q.explanation.length === 0) errors.push(`${label}: sem explicação`)
  const correct = q.options.filter((o) => o.correct).length
  // Formato do guia do exame: 1 correta entre 4, ou 2+ corretas entre 5+.
  if (correct === 1 && q.options.length !== 4) errors.push(`${label}: múltipla escolha precisa de 4 opções`)
  if (correct > 1 && q.options.length < 5) errors.push(`${label}: resposta múltipla precisa de 5 opções ou mais`)
  if (correct === 0) errors.push(`${label}: nenhuma opção correta`)
  if (new Set(q.options.map((o) => o.id)).size !== q.options.length) errors.push(`${label}: opções com id repetido`)
  for (const o of q.options) if (!o.why.trim()) errors.push(`${label}: opção ${o.id} sem explicação`)
}

function validateActivity(reg: Registry, a: ActivityDef, label: string, errors: string[]) {
  if (a.concepts.length === 0) errors.push(`${label}: sem conceitos avaliados`)
  for (const c of a.concepts) if (!reg.concepts.has(c.id)) errors.push(`${label}: conceito inexistente ${c.id}`)
  if (a.explanation.length === 0) errors.push(`${label}: sem explicação`)
  if (a.xp <= 0) errors.push(`${label}: XP inválido`)
  switch (a.kind) {
    case 'decision':
      if (!a.options.some((o) => o.correct)) errors.push(`${label}: nenhuma opção correta`)
      if (!a.multiple && a.options.filter((o) => o.correct).length !== 1) errors.push(`${label}: escolha única com ${a.options.filter((o) => o.correct).length} corretas`)
      if (a.justification && a.justification.options.filter((o) => o.correct).length !== 1) errors.push(`${label}: justificativa deve ter exatamente uma correta`)
      break
    case 'classify':
      for (const i of a.items) if (!a.bins.some((b) => b.id === i.bin)) errors.push(`${label}: item ${i.id} em categoria inexistente`)
      break
    case 'investigate':
      if (!a.artifacts.some((art) => art.lines.some((l) => l.isIssue))) errors.push(`${label}: nenhuma evidência relevante`)
      if (a.rootCause.options.filter((o) => o.correct).length !== 1) errors.push(`${label}: causa raiz deve ter exatamente uma correta`)
      break
    default:
      break
  }
  for (const item of [a]) {
    if ('items' in item) for (const i of item.items) for (const c of i.concepts ?? []) if (!reg.concepts.has(c)) errors.push(`${label}: item com conceito inexistente ${c}`)
  }
}

type CondRef = { kind: 'phase' | 'mission' | 'activity' | 'concept'; id: string }
function conditionRefs(c: AchievementDef['condition']): CondRef[] {
  switch (c.type) {
    case 'phase-completed':
      return [{ kind: 'phase', id: c.phaseId }]
    case 'mission-score':
      return [{ kind: 'mission', id: c.missionId }]
    case 'perfect-first-try':
      return [{ kind: 'activity', id: c.activityId }]
    case 'concepts-mastered':
      return (c.conceptIds ?? []).map((id) => ({ kind: 'concept' as const, id }))
    case 'all':
      return c.of.flatMap(conditionRefs)
    default:
      return []
  }
}

/**
 * Detecta ciclos no grafo global de dependências: `requires` entre fases (de
 * qualquer trilha) e `requires` entre trilhas (cada fase depende das fases das
 * trilhas exigidas pela sua trilha).
 */
function findCycles(reg: Registry): string[] {
  const deps = (id: string): string[] => {
    const ref = reg.phases.get(id)
    if (!ref) return []
    const fromTracks = (ref.track.requires ?? []).flatMap((tid) => {
      const t = reg.tracks.get(tid)
      return t ? trackPhases(t).map((p) => p.id) : []
    })
    return [...ref.phase.requires, ...fromTracks].filter((d) => reg.phases.has(d))
  }
  const state = new Map<string, 'visiting' | 'done'>()
  const errors: string[] = []
  const visit = (id: string, path: string[]) => {
    if (state.get(id) === 'done') return
    if (state.get(id) === 'visiting') {
      errors.push(`Ciclo de dependências: ${[...path, id].join(' → ')}`)
      return
    }
    state.set(id, 'visiting')
    for (const dep of deps(id)) visit(dep, [...path, id])
    state.set(id, 'done')
  }
  for (const id of reg.phases.keys()) visit(id, [])
  return errors
}
