/** Laboratório de replicação: o usuário ajusta pré-requisitos e regras; os cenários mostram o resultado. */
import type { ItemFeedback } from '../../engine/types'
import { STORAGE_CLASSES, type StorageClassId } from '../shared/storageClasses'
import { replicate, validateReplication, type BucketVersioning, type ReplEvent, type ReplRole, type ReplRule, type ReplSetup, type ReplStatus } from './model'

export type ReplGoal =
  | { type: 'valid'; why: string; concepts?: string[] }
  | { type: 'event'; event: string; destination: string; expect: ReplStatus; why: string; concepts?: string[] }
  | { type: 'rtc'; destination: string; why: string; concepts?: string[] }
  | { type: 'replica-class'; event: string; destination: string; allowed: StorageClassId[]; why: string; concepts?: string[] }

export interface ReplicationLabConfig {
  setup: ReplSetup
  events: ReplEvent[]
  goals: ReplGoal[]
  /** Itens que o usuário pode alterar. */
  editable: { sourceVersioning?: boolean; destVersioning?: boolean; role?: boolean; destPolicy?: boolean; rules?: boolean }
  /** Prefixos oferecidos no filtro. */
  prefixes: string[]
  solution: ReplicationLabResponse
}

export interface ReplicationLabResponse {
  sourceVersioning: BucketVersioning
  destVersioning: Record<string, BucketVersioning>
  role: ReplRole
  destPolicy: Record<string, boolean>
  rules: ReplRule[]
}

export function initialReplicationResponse(c: ReplicationLabConfig): ReplicationLabResponse {
  const s = c.setup
  return {
    sourceVersioning: s.source.versioning,
    destVersioning: Object.fromEntries(s.destinations.map((d) => [d.name, d.versioning])),
    role: { ...s.role },
    destPolicy: { ...s.destPolicy },
    rules: structuredClone(s.rules),
  }
}

export function applyReplication(c: ReplicationLabConfig, r: ReplicationLabResponse): ReplSetup {
  return {
    source: { ...c.setup.source, versioning: r.sourceVersioning },
    destinations: c.setup.destinations.map((d) => ({ ...d, versioning: r.destVersioning[d.name] ?? d.versioning })),
    role: r.role,
    destPolicy: r.destPolicy,
    rules: r.rules,
  }
}

const STATUS_LABEL: Record<ReplStatus, string> = { COMPLETED: 'COMPLETED', FAILED: 'FAILED', NOT_REPLICATED: 'não replicado' }

export function evaluateReplicationLab(c: ReplicationLabConfig, r: ReplicationLabResponse) {
  const setup = applyReplication(c, r)
  const issues = validateReplication(setup)
  const items = c.goals.map((g, i) => {
    let ok = false
    let label = ''
    let actual = ''
    switch (g.type) {
      case 'valid':
        ok = issues.length === 0
        label = 'O S3 aceita a configuração de replicação'
        actual = issues.map((x) => x.message).join(' ')
        break
      case 'event': {
        const ev = c.events.find((e) => e.id === g.event)!
        const res = replicate(setup, ev, g.destination)
        ok = res.status === g.expect
        label = `${ev.label} → ${g.destination}: ${STATUS_LABEL[g.expect]}`
        actual = `Resultado: ${STATUS_LABEL[res.status]} — ${res.reason}`
        break
      }
      case 'rtc': {
        ok = setup.rules.some((x) => x.enabled && x.destination === g.destination && x.rtc)
        label = `S3 Replication Time Control para ${g.destination}`
        break
      }
      case 'replica-class': {
        const ev = c.events.find((e) => e.id === g.event)!
        const res = replicate(setup, ev, g.destination)
        ok = res.status === 'COMPLETED' && Boolean(res.replicaClass && g.allowed.includes(res.replicaClass))
        label = `Classe da réplica em ${g.destination}: ${g.allowed.map((x) => STORAGE_CLASSES[x].shortName).join(' ou ')}`
        actual = res.replicaClass ? `Réplica em ${STORAGE_CLASSES[res.replicaClass].shortName}.` : 'Sem réplica.'
        break
      }
    }
    return { concepts: g.concepts, score: ok ? 1 : 0, fb: { id: `goal-${i}`, label, status: ok ? 'correct' : 'wrong', message: ok ? g.why : `${actual} ${g.why}`.trim() } as ItemFeedback }
  })
  return { score: items.reduce((s, x) => s + x.score, 0) / Math.max(1, items.length), items }
}
