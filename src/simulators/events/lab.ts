/** Laboratório de eventos: o usuário configura notificações e regras do EventBridge e observa o fluxo. */
import type { ItemFeedback } from '../../engine/types'
import { runFlow, validateEvents, type Destination, type EventsConfig, type S3Event } from './model'

export type EventsGoal =
  | { type: 'valid'; why: string; concepts?: string[] }
  | { type: 'delivered'; event: string; destination: string; why: string; concepts?: string[] }
  | { type: 'not-delivered'; event: string; destination: string; why: string; concepts?: string[] }
  | { type: 'no-loop'; why: string; concepts?: string[] }

export interface EventsLabConfig {
  bucketName: string
  destinations: Destination[]
  events: S3Event[]
  initial: EventsConfig
  /** Permite alternar a política de recurso dos destinos. */
  editablePermissions?: boolean
  allowEventBridge?: boolean
  goals: EventsGoal[]
  solution: EventsLabResponse
}

export interface EventsLabResponse {
  config: EventsConfig
  permissions: Record<string, boolean>
}

export function initialEventsResponse(c: EventsLabConfig): EventsLabResponse {
  return { config: structuredClone(c.initial), permissions: Object.fromEntries(c.destinations.map((d) => [d.id, d.allowsS3])) }
}

export function destinationsWith(c: EventsLabConfig, r: EventsLabResponse): Destination[] {
  return c.destinations.map((d) => ({ ...d, allowsS3: r.permissions[d.id] ?? d.allowsS3 }))
}

export function evaluateEventsLab(c: EventsLabConfig, r: EventsLabResponse) {
  const dests = destinationsWith(c, r)
  const issues = validateEvents(r.config, dests)
  const name = (id: string) => dests.find((d) => d.id === id)?.name ?? id
  const evLabel = (id: string) => c.events.find((e) => e.id === id)?.label ?? id
  const flows = new Map(c.events.map((e) => [e.id, runFlow(r.config, dests, e)]))
  const items = c.goals.map((g, i) => {
    let ok = false
    let label = ''
    switch (g.type) {
      case 'valid':
        ok = issues.length === 0
        label = 'O S3 aceita a configuração de notificações'
        break
      case 'delivered':
        ok = flows.get(g.event)!.deliveries.some((d) => d.destination === g.destination && d.depth === 0)
        label = `${evLabel(g.event)} chega a ${name(g.destination)}`
        break
      case 'not-delivered':
        ok = !flows.get(g.event)!.deliveries.some((d) => d.destination === g.destination)
        label = `${evLabel(g.event)} não chega a ${name(g.destination)}`
        break
      case 'no-loop':
        ok = issues.length === 0 && [...flows.values()].every((f) => !f.loop)
        label = 'Nenhum loop recursivo'
        break
    }
    const extra = !ok && g.type === 'valid' ? issues.map((x) => x.message).join(' ') : ''
    return { concepts: g.concepts, score: ok ? 1 : 0, fb: { id: `goal-${i}`, label, status: ok ? 'correct' : 'wrong', message: ok ? g.why : `${extra} ${g.why}`.trim() } as ItemFeedback }
  })
  return { score: items.reduce((s, x) => s + x.score, 0) / Math.max(1, items.length), items }
}
