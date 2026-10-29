/**
 * Grafo de serviços: cada serviço do catálogo vira um nó, ligado aos serviços
 * com que divide pelo menos um conceito. O estado de cada serviço é derivado
 * do status oficial das fases que ensinam seus conceitos; nada aqui é gravado
 * nem muda regras de desbloqueio, XP ou revisão.
 */
import type { Registry } from './registry'
import { missionStatus, phaseProgress, phaseStatus, unmetRequirements, type PhaseStatus } from './selectors'
import type { ExamDomainId, ProgressState } from './types'

export interface ServiceNode {
  id: string
  territory: string
  /** Conceitos que citam o serviço, na ordem do registro. */
  conceptIds: string[]
  /** Primeira fase disponível que ensina cada conceito (a regra do Codex), sem repetição. */
  phaseIds: string[]
  /** Questões do banco que citam o serviço pelo conceito principal ou por um relacionado. Cada questão conta uma vez. */
  questions: number
  /** Das questões acima, as que têm o serviço no conceito principal. */
  mainQuestions: number
  questionsByDomain: Record<ExamDomainId, number>
}

export interface ServiceEdge {
  /** O menor id dos dois, para a aresta ser única. */
  source: string
  target: string
  /** Conceitos que citam os dois serviços. A quantidade é o peso da ligação. */
  conceptIds: string[]
}

export interface ServiceGraph {
  nodes: ServiceNode[]
  edges: ServiceEdge[]
  byId: Map<string, ServiceNode>
  neighbors: Map<string, ServiceEdge[]>
  maxQuestions: number
}

/** O outro serviço de uma aresta. */
export function otherEnd(edge: ServiceEdge, id: string): string {
  return edge.source === id ? edge.target : edge.source
}

export function buildServiceGraph(reg: Registry): ServiceGraph {
  const conceptsOf = new Map<string, string[]>()
  for (const c of reg.concepts.values()) for (const sid of new Set(c.serviceIds)) (conceptsOf.get(sid) ?? conceptsOf.set(sid, []).get(sid)!).push(c.id)

  const nodes: ServiceNode[] = []
  for (const s of reg.services.values()) {
    const conceptIds = conceptsOf.get(s.id) ?? []
    const phaseIds = [...new Set(conceptIds.map((c) => reg.conceptPhase.get(c)).filter((p): p is string => Boolean(p)))].filter(
      (p) => reg.phases.get(p)?.phase.availability === 'available',
    )
    // Sem fase que ensine o serviço não há o que estudar nem estado para mostrar.
    if (phaseIds.length === 0) continue
    nodes.push({ id: s.id, territory: s.territory, conceptIds, phaseIds, questions: 0, mainQuestions: 0, questionsByDomain: { d1: 0, d2: 0, d3: 0, d4: 0 } })
  }
  const byId = new Map(nodes.map((n) => [n.id, n]))

  const servicesOf = (conceptId: string) => reg.concepts.get(conceptId)?.serviceIds ?? []
  for (const { question: q } of reg.questions.values()) {
    const main = new Set(servicesOf(q.concept))
    const all = new Set([q.concept, ...(q.related ?? [])].flatMap(servicesOf))
    for (const sid of all) {
      const n = byId.get(sid)
      if (!n) continue
      n.questions++
      if (main.has(sid)) n.mainQuestions++
      n.questionsByDomain[q.domain]++
    }
  }

  const edgeMap = new Map<string, ServiceEdge>()
  for (const c of reg.concepts.values()) {
    const ids = [...new Set(c.serviceIds)].filter((id) => byId.has(id)).sort()
    for (let i = 0; i < ids.length; i++) {
      for (let j = i + 1; j < ids.length; j++) {
        const key = `${ids[i]}|${ids[j]}`
        const e = edgeMap.get(key) ?? edgeMap.set(key, { source: ids[i], target: ids[j], conceptIds: [] }).get(key)!
        e.conceptIds.push(c.id)
      }
    }
  }
  const edges = [...edgeMap.values()]
  const neighbors = new Map<string, ServiceEdge[]>(nodes.map((n) => [n.id, []]))
  for (const e of edges) {
    neighbors.get(e.source)!.push(e)
    neighbors.get(e.target)!.push(e)
  }
  for (const list of neighbors.values()) list.sort((a, b) => b.conceptIds.length - a.conceptIds.length)

  return { nodes, edges, byId, neighbors, maxQuestions: Math.max(0, ...nodes.map((n) => n.questions)) }
}

export type ServiceStatus = 'locked' | 'available' | 'in-progress' | 'completed'

export interface ServiceProgress {
  status: ServiceStatus
  phases: { completed: number; total: number }
  missions: { passed: number; total: number; ratio: number }
  /** Missão em andamento ou disponível que ensina o serviço, na ordem sugerida das trilhas. */
  nextMissionId?: string
  /** Fase de ensino do serviço da qual ele herda o estado de bloqueio (a com menos pré-requisitos pendentes). */
  unlockPhaseId?: string
}

/** Status oficial de todas as fases, calculado uma vez por mudança de progresso. */
export function allPhaseStatuses(state: ProgressState, reg: Registry): Map<string, PhaseStatus> {
  return new Map([...reg.phases.keys()].map((id) => [id, phaseStatus(state, reg, id)]))
}

/**
 * Estado do serviço a partir das fases que ensinam seus conceitos:
 * concluído quando todas estão concluídas, em andamento quando alguma está em
 * andamento ou concluída, desbloqueado quando alguma está disponível e
 * bloqueado nos demais casos.
 */
export function serviceProgress(
  state: ProgressState,
  reg: Registry,
  node: ServiceNode,
  statuses: Map<string, PhaseStatus>,
  trackOrder: string[],
): ServiceProgress {
  const st = node.phaseIds.map((id) => statuses.get(id) ?? phaseStatus(state, reg, id))
  const completed = st.filter((s) => s === 'completed').length
  const status: ServiceStatus =
    completed === st.length ? 'completed' : st.some((s) => s === 'in-progress' || s === 'completed') ? 'in-progress' : st.includes('available') ? 'available' : 'locked'

  let passed = 0
  let total = 0
  for (const id of node.phaseIds) {
    const pp = phaseProgress(state, reg.phases.get(id)!.phase)
    passed += pp.passed
    total += pp.total
  }

  const rank = new Map(trackOrder.map((t, i) => [t, i]))
  const phases = node.phaseIds
    .map((id) => reg.phases.get(id)!)
    .sort((a, b) => (rank.get(a.track.id) ?? Infinity) - (rank.get(b.track.id) ?? Infinity) || a.phase.order - b.phase.order)

  let nextMissionId: string | undefined
  let unlockPhaseId: string | undefined
  if (status === 'locked') {
    let fewest = Infinity
    for (const ref of phases) {
      const missing = unmetRequirements(state, reg, ref.phase).length
      if (missing < fewest) {
        fewest = missing
        unlockPhaseId = ref.phase.id
      }
    }
  } else if (status !== 'completed') {
    let available: string | undefined
    for (const ref of phases) {
      for (const m of ref.phase.missions) {
        const ms = missionStatus(state, reg, m.id)
        if (ms === 'in-progress') {
          nextMissionId ??= m.id
        } else if (ms === 'available') available ??= m.id
      }
      if (nextMissionId) break
    }
    nextMissionId ??= available
  }

  return { status, phases: { completed, total: st.length }, missions: { passed, total, ratio: total === 0 ? 0 : passed / total }, nextMissionId, unlockPhaseId }
}
