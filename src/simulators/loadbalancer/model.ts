/**
 * Elastic Load Balancing: regras de listener do ALB, distribuição de tráfego
 * entre alvos de várias AZs (com e sem cross-zone) e escolha do tipo de
 * balanceador pelos requisitos.
 *
 * Conferido em 20/10/2026:
 * - Regras: avaliadas da menor prioridade para a maior, a padrão por último e
 *   sem condições; uma ação terminal (forward, redirect, fixed-response);
 *   condições host-header, http-request-method, path-pattern, source-ip,
 *   http-header e query-string; até 3 valores por condição e 5 por regra:
 *   https://docs.aws.amazon.com/elasticloadbalancing/latest/application/listener-rules.html
 * - Cada nó recebe a mesma parte do tráfego; com cross-zone, cada nó distribui
 *   entre os alvos de todas as AZs habilitadas; sem cross-zone, só entre os da
 *   sua AZ (exemplo 2 + 8 alvos). Cross-zone sempre ligado no ALB e desligado
 *   por padrão no NLB e no GWLB:
 *   https://docs.aws.amazon.com/elasticloadbalancing/latest/userguide/how-elastic-load-balancing-works.html
 * - NLB (camada 4, TCP/UDP/TLS, IP estático por AZ, passthrough TLS com TCP
 *   443), GWLB (appliances, GENEVE 6081) e tipos de alvo do ALB (instance, ip,
 *   lambda): https://docs.aws.amazon.com/elasticloadbalancing/latest/network/introduction.html,
 *   https://docs.aws.amazon.com/elasticloadbalancing/latest/gateway/introduction.html e
 *   https://docs.aws.amazon.com/elasticloadbalancing/latest/application/load-balancer-target-groups.html
 *
 * Simplificações: forward com vários target groups escolhe o grupo pelos pesos
 * de forma determinística (pelo identificador da requisição); os valores de
 * host-header ignoram maiúsculas e os de path-pattern não.
 */
import { ipInCidr, wildcardMatch } from '../policy/core'

export type LbType = 'alb' | 'nlb' | 'gwlb'

export const LB_NAME: Record<LbType, string> = { alb: 'Application Load Balancer', nlb: 'Network Load Balancer', gwlb: 'Gateway Load Balancer' }

// ---------------------------------------------------------------------------
// Regras do ALB

export type Condition =
  | { type: 'host-header'; values: string[] }
  | { type: 'path-pattern'; values: string[] }
  | { type: 'http-request-method'; values: string[] }
  | { type: 'http-header'; name: string; values: string[] }
  | { type: 'query-string'; key: string; values: string[] }
  | { type: 'source-ip'; values: string[] }

export type Action = { type: 'forward'; targetGroups: { id: string; weight: number }[] } | { type: 'redirect'; to: string } | { type: 'fixed-response'; status: number }

export interface Rule {
  id: string
  priority: number
  conditions: Condition[]
  action: Action
}

export interface Listener {
  rules: Rule[]
  defaultAction: Action
}

export interface HttpRequest {
  id: string
  label: string
  host: string
  path: string
  method: string
  headers?: Record<string, string>
  query?: Record<string, string>
  sourceIp: string
}

export const CONDITION_LABEL: Record<Condition['type'], string> = {
  'host-header': 'host',
  'path-pattern': 'caminho',
  'http-request-method': 'método',
  'http-header': 'cabeçalho',
  'query-string': 'query string',
  'source-ip': 'IP de origem',
}

export function describeCondition(c: Condition): string {
  const vals = c.values.join(' ou ')
  if (c.type === 'http-header') return `cabeçalho ${c.name} = ${vals}`
  if (c.type === 'query-string') return `query ${c.key}=${vals}`
  return `${CONDITION_LABEL[c.type]} ${vals}`
}

export function describeAction(a: Action, groupLabel: (id: string) => string = (id) => id): string {
  if (a.type === 'redirect') return `redirecionar para ${a.to}`
  if (a.type === 'fixed-response') return `responder ${a.status}`
  return a.targetGroups.length === 1 ? `encaminhar para ${groupLabel(a.targetGroups[0].id)}` : `encaminhar para ${a.targetGroups.map((g) => `${groupLabel(g.id)} (peso ${g.weight})`).join(' e ')}`
}

export function conditionMatches(c: Condition, r: HttpRequest): boolean {
  switch (c.type) {
    case 'host-header':
      return c.values.some((v) => wildcardMatch(v, r.host, true))
    case 'path-pattern':
      return c.values.some((v) => wildcardMatch(v, r.path))
    case 'http-request-method':
      return c.values.includes(r.method)
    case 'http-header': {
      const h = Object.entries(r.headers ?? {}).find(([k]) => k.toLowerCase() === c.name.toLowerCase())?.[1]
      return h !== undefined && c.values.some((v) => wildcardMatch(v, h, true))
    }
    case 'query-string': {
      const q = r.query?.[c.key]
      return q !== undefined && c.values.some((v) => wildcardMatch(v, q, true))
    }
    case 'source-ip':
      return c.values.some((v) => ipInCidr(r.sourceIp, v))
  }
}

/** Problemas que a AWS recusaria na configuração do listener. */
export function validateListener(l: Listener): string[] {
  const out: string[] = []
  const prios = l.rules.map((r) => r.priority)
  if (new Set(prios).size !== prios.length) out.push('duas regras não podem ter a mesma prioridade')
  for (const r of l.rules) {
    if (r.conditions.length === 0) out.push(`a regra de prioridade ${r.priority} precisa de pelo menos uma condição (só a regra padrão não tem)`)
    if (r.conditions.some((c) => c.values.length > 3)) out.push(`a regra de prioridade ${r.priority} tem uma condição com mais de 3 valores`)
    if (r.conditions.reduce((n, c) => n + c.values.length, 0) > 5) out.push(`a regra de prioridade ${r.priority} tem mais de 5 valores no total`)
  }
  return out
}

export const actionKey = (a: Action, requestId = ''): string => {
  if (a.type === 'redirect') return 'redirect'
  if (a.type === 'fixed-response') return `fixed:${a.status}`
  return pickTargetGroup(a, requestId)
}

/** Forward ponderado: escolhe o grupo pelos pesos, de forma determinística (premissa). */
export function pickTargetGroup(a: Extract<Action, { type: 'forward' }>, requestId: string): string {
  if (a.targetGroups.length === 1) return a.targetGroups[0].id
  const total = a.targetGroups.reduce((s, g) => s + g.weight, 0)
  let h = 0
  for (const ch of requestId) h = (h * 31 + ch.charCodeAt(0)) % 1000
  let point = (h / 1000) * total
  for (const g of a.targetGroups) {
    if (point < g.weight) return g.id
    point -= g.weight
  }
  return a.targetGroups[a.targetGroups.length - 1].id
}

export interface RouteResult {
  /** Prioridade da regra que casou, ou "default". */
  rule: number | 'default'
  action: Action
  /** Grupo de destino, "redirect" ou "fixed:<status>". */
  outcome: string
  trace: string[]
}

export function routeAlb(l: Listener, r: HttpRequest, groupLabel?: (id: string) => string): RouteResult {
  const trace: string[] = []
  for (const rule of [...l.rules].sort((a, b) => a.priority - b.priority)) {
    const failed = rule.conditions.find((c) => !conditionMatches(c, r))
    if (failed) {
      trace.push(`Prioridade ${rule.priority}: não casa (${describeCondition(failed)}).`)
      continue
    }
    trace.push(`Prioridade ${rule.priority}: casa (${rule.conditions.map(describeCondition).join(' e ')}). Ação: ${describeAction(rule.action, groupLabel)}.`)
    return { rule: rule.priority, action: rule.action, outcome: actionKey(rule.action, r.id), trace }
  }
  trace.push(`Nenhuma regra casou: vale a regra padrão (${describeAction(l.defaultAction, groupLabel)}).`)
  return { rule: 'default', action: l.defaultAction, outcome: actionKey(l.defaultAction, r.id), trace }
}

// ---------------------------------------------------------------------------
// Cross-zone

export const CROSS_ZONE_DEFAULT: Record<LbType, boolean> = { alb: true, nlb: false, gwlb: false }

/**
 * Parte do tráfego total que cada alvo de cada AZ recebe. Cada AZ habilitada
 * tem um nó, e o DNS reparte o tráfego por igual entre os nós.
 */
export function distribute(targetsByAz: Record<string, number>, crossZone: boolean): Record<string, number> {
  const azs = Object.keys(targetsByAz).filter((az) => targetsByAz[az] > 0)
  const total = azs.reduce((s, az) => s + targetsByAz[az], 0)
  return Object.fromEntries(azs.map((az) => [az, crossZone ? 1 / total : 1 / azs.length / targetsByAz[az]]))
}

// ---------------------------------------------------------------------------
// Escolha do tipo

export type LbNeed = 'path-routing' | 'host-routing' | 'lambda-target' | 'redirect' | 'static-ip' | 'udp' | 'tls-passthrough' | 'appliances' | 'http-headers'

export const NEED_LABEL: Record<LbNeed, string> = {
  'path-routing': 'rotear por caminho da URL',
  'host-routing': 'rotear pelo nome do site (host)',
  'lambda-target': 'chamar uma função Lambda como alvo',
  redirect: 'redirecionar HTTP para HTTPS',
  'static-ip': 'um IP fixo por AZ, que o cliente cadastra no firewall',
  udp: 'tráfego UDP',
  'tls-passthrough': 'TLS que só o servidor decifra (passthrough)',
  appliances: 'passar todo o tráfego por appliances de firewall de terceiros',
  'http-headers': 'rotear por cabeçalho HTTP',
}

export const LB_SUPPORTS: Record<LbType, LbNeed[]> = {
  alb: ['path-routing', 'host-routing', 'lambda-target', 'redirect', 'http-headers'],
  nlb: ['static-ip', 'udp', 'tls-passthrough'],
  gwlb: ['appliances'],
}

export const lbGaps = (type: LbType, needs: LbNeed[]) => needs.filter((n) => !LB_SUPPORTS[type].includes(n))

export function chooseLb(needs: LbNeed[]): LbType | undefined {
  return (['alb', 'nlb', 'gwlb'] as LbType[]).find((t) => lbGaps(t, needs).length === 0)
}
