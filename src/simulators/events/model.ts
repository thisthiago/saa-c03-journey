/**
 * Simulador de S3 Event Notifications e Amazon EventBridge: validação da configuração,
 * roteamento de eventos, fan-out via SNS e detecção de loops recursivos.
 *
 * Regras conferidas em 16/10/2026:
 *  - https://docs.aws.amazon.com/AmazonS3/latest/userguide/EventNotifications.html
 *  - https://docs.aws.amazon.com/AmazonS3/latest/userguide/notification-how-to-filtering.html
 *  - https://docs.aws.amazon.com/AmazonS3/latest/userguide/EventBridge.html
 *
 * Simplificações: entrega instantânea e única (na AWS é "pelo menos uma vez", em segundos);
 * o EventBridge recebe todos os eventos do bucket quando habilitado; uma Lambda grava no
 * máximo um objeto de saída; a cadeia de eventos é interrompida após 4 níveis.
 */

export type EventCategory = 'created' | 'removed'
export type EventTypeSel = 'ObjectCreated:*' | 'ObjectCreated:Put' | 'ObjectCreated:CompleteMultipartUpload' | 'ObjectRemoved:*'

export type DestKind = 'lambda' | 'sqs' | 'sqs-fifo' | 'sns'

export interface Destination {
  id: string
  kind: DestKind
  name: string
  /** A política de recurso permite que o S3 publique (fila/tópico) ou invoque (Lambda). */
  allowsS3: boolean
  /** Lambda que grava um objeto no mesmo bucket: prefixo da saída + nome derivado. */
  writes?: { prefix: string; suffix?: string }
  /** Assinantes de um tópico SNS (fan-out). */
  subscribers?: string[]
}

export interface Notification {
  id: string
  events: EventTypeSel[]
  prefix?: string
  suffix?: string
  destination: string
}

export interface EbRule {
  id: string
  eventType: EventCategory
  prefix?: string
  suffix?: string
  targets: string[]
}

export interface EventsConfig {
  notifications: Notification[]
  eventBridge: boolean
  ebRules: EbRule[]
}

export interface S3Event {
  id: string
  label: string
  /** Tipo concreto do evento, como aparece na mensagem. */
  type: 'ObjectCreated:Put' | 'ObjectCreated:CompleteMultipartUpload' | 'ObjectRemoved:Delete'
  key: string
}

export interface EventsIssue {
  id?: string
  message: string
}

const category = (t: EventTypeSel | S3Event['type']): EventCategory => (t.startsWith('ObjectCreated') ? 'created' : 'removed')

function typesOverlap(a: EventTypeSel[], b: EventTypeSel[]): boolean {
  return a.some((x) => b.some((y) => x === y || (category(x) === category(y) && (x.endsWith('*') || y.endsWith('*')))))
}

/** Dois prefixos se sobrepõem se uma mesma key pode começar com ambos (vazio sobrepõe tudo). */
const prefixOverlap = (a = '', b = '') => a.startsWith(b) || b.startsWith(a)
const suffixOverlap = (a = '', b = '') => a.endsWith(b) || b.endsWith(a)

export function validateEvents(c: EventsConfig, dests: Destination[]): EventsIssue[] {
  const issues: EventsIssue[] = []
  const byId = new Map(dests.map((d) => [d.id, d]))
  c.notifications.forEach((n, i) => {
    const d = byId.get(n.destination)
    if (!d) issues.push({ id: n.id, message: 'Destino inexistente.' })
    else if (d.kind === 'sqs-fifo') issues.push({ id: n.id, message: `${d.name} é uma fila SQS FIFO: filas FIFO não são aceitas como destino de Event Notifications. Use o Amazon EventBridge.` })
    else if (!d.allowsS3) issues.push({ id: n.id, message: `Unable to validate the following destination configurations: a política de recurso de ${d.name} não permite que o S3 ${d.kind === 'lambda' ? 'invoque a função' : 'publique mensagens'}.` })
    if (n.events.length === 0) issues.push({ id: n.id, message: 'Escolha pelo menos um tipo de evento.' })
    if (n.prefix?.includes('*') || n.suffix?.includes('*')) issues.push({ id: n.id, message: 'Curingas (*) não são aceitos em prefixos e sufixos.' })
    for (const m of c.notifications.slice(i + 1)) {
      if (typesOverlap(n.events, m.events) && prefixOverlap(n.prefix, m.prefix) && suffixOverlap(n.suffix, m.suffix)) {
        issues.push({ id: n.id, message: `Filtros sobrepostos entre "${n.id}" e "${m.id}" para os mesmos tipos de evento: o S3 rejeita a configuração. Para vários consumidores, use fan-out (SNS) ou EventBridge.` })
      }
    }
  })
  return issues
}

export interface Delivery {
  depth: number
  via: string
  destination: string
  key: string
}

export interface FlowResult {
  deliveries: Delivery[]
  loop: boolean
  steps: string[]
}

const matchesKey = (key: string, prefix?: string, suffix?: string) => (!prefix || key.startsWith(prefix)) && (!suffix || key.endsWith(suffix))

function outputKey(input: string, w: NonNullable<Destination['writes']>): string {
  const base = input.split('/').pop() ?? input
  const name = w.suffix ? base.replace(/\.[^.]+$/, '') + w.suffix : base
  return `${w.prefix}${name}`
}

/** Processa um evento e tudo o que ele desencadeia. */
export function runFlow(c: EventsConfig, dests: Destination[], ev: S3Event): FlowResult {
  const byId = new Map(dests.map((d) => [d.id, d]))
  const valid = validateEvents(c, dests).length === 0
  const deliveries: Delivery[] = []
  const steps: string[] = []
  if (!valid) return { deliveries, loop: false, steps: ['A configuração de notificações foi rejeitada: nenhum evento é enviado.'] }
  let loop = false
  const seenLambdas = new Map<string, number>()

  const deliver = (destId: string, via: string, key: string, depth: number) => {
    const d = byId.get(destId)
    if (!d) return
    deliveries.push({ depth, via, destination: destId, key })
    steps.push(`${'  '.repeat(depth)}${via} → ${d.name}`)
    if (d.kind === 'sns') for (const sub of d.subscribers ?? []) deliver(sub, `${d.name} (fan-out)`, key, depth)
    if (d.kind === 'lambda' && d.writes) {
      const count = (seenLambdas.get(destId) ?? 0) + 1
      seenLambdas.set(destId, count)
      const out = outputKey(key, d.writes)
      if (depth >= 3) {
        loop = true
        steps.push(`${'  '.repeat(depth + 1)}⚠ ${d.name} continua gravando no bucket e disparando a si mesma: loop recursivo.`)
        return
      }
      steps.push(`${'  '.repeat(depth + 1)}${d.name} grava ${out} no mesmo bucket`)
      emit({ id: `${ev.id}-out${depth}`, label: 'saída', type: 'ObjectCreated:Put', key: out }, depth + 1)
    }
  }

  const emit = (e: S3Event, depth: number) => {
    for (const n of c.notifications) {
      const typeOk = n.events.some((t) => t === e.type || (t.endsWith('*') && category(t) === category(e.type)))
      if (typeOk && matchesKey(e.key, n.prefix, n.suffix)) deliver(n.destination, `S3 notification "${n.id}"`, e.key, depth)
    }
    if (c.eventBridge) {
      for (const r of c.ebRules) {
        if (r.eventType === category(e.type) && matchesKey(e.key, r.prefix, r.suffix)) for (const t of r.targets) deliver(t, `EventBridge regra "${r.id}"`, e.key, depth)
      }
    }
  }

  steps.push(`${ev.type} ${ev.key}`)
  emit(ev, 0)
  // Lambda disparada de novo por um objeto que ela mesma gravou = recursão, mesmo que pare depois.
  for (const [id, n] of seenLambdas) if (n > 1) {
    loop = true
    steps.push(`⚠ ${byId.get(id)?.name} foi disparada por um objeto que ela mesma gravou: risco de loop recursivo.`)
  }
  return { deliveries, loop, steps }
}

export const KIND_LABEL: Record<DestKind, string> = {
  lambda: 'AWS Lambda',
  sqs: 'Amazon SQS (standard)',
  'sqs-fifo': 'Amazon SQS FIFO',
  sns: 'Amazon SNS',
}
