/**
 * Casamento de padrões de evento do EventBridge e de políticas de filtro do
 * SNS, que seguem a mesma lógica: campos do padrão combinam com E, valores
 * da lista combinam com OU, e campos que o padrão não cita são ignorados.
 *
 * Conferido em 22/10/2026:
 * - Padrões de evento: o padrão tem a mesma estrutura do evento; os campos
 *   citados precisam casar; uma lista de valores é OU
 *   (https://docs.aws.amazon.com/eventbridge/latest/userguide/eb-event-patterns.html).
 * - Operadores: igual, prefix, suffix, anything-but (com valor ou lista),
 *   numeric (faixas), exists true/false e equals-ignore-case; as comparações
 *   valem só nas folhas
 *   (https://docs.aws.amazon.com/eventbridge/latest/userguide/eb-create-pattern-operators.html).
 * - Política de filtro do SNS: cada nome de propriedade da política precisa
 *   casar, e pelo menos um dos valores de cada um precisa casar; sem política,
 *   a assinatura recebe tudo
 *   (https://docs.aws.amazon.com/sns/latest/dg/sns-subscription-filter-policies.html,
 *   https://docs.aws.amazon.com/sns/latest/dg/sns-message-filtering.html).
 *
 * Simplificação: não modela $or, wildcard, cidr nem os casos de valores nulos
 * e listas dentro do evento.
 */

export type Scalar = string | number | boolean
export type Condition =
  | Scalar
  | { prefix: string }
  | { suffix: string }
  | { 'anything-but': Scalar | Scalar[] }
  | { numeric: (string | number)[] }
  | { exists: boolean }
  | { 'equals-ignore-case': string }

export interface Pattern {
  [field: string]: Condition[] | Pattern
}

export type EventData = { [field: string]: Scalar | EventData | undefined }

const isScalar = (v: unknown): v is Scalar => typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean'

function numericHolds(spec: (string | number)[], v: number): boolean {
  for (let i = 0; i + 1 < spec.length; i += 2) {
    const op = spec[i]
    const n = Number(spec[i + 1])
    const ok = op === '=' ? v === n : op === '<' ? v < n : op === '<=' ? v <= n : op === '>' ? v > n : op === '>=' ? v >= n : false
    if (!ok) return false
  }
  return true
}

/** Uma condição casa com o valor da folha (ou com a ausência dele)? */
export function conditionHolds(c: Condition, value: Scalar | undefined): boolean {
  if (isScalar(c)) return value !== undefined && value === c
  if ('exists' in c) return c.exists ? value !== undefined : value === undefined
  if (value === undefined) return false
  if ('prefix' in c) return typeof value === 'string' && value.startsWith(c.prefix)
  if ('suffix' in c) return typeof value === 'string' && value.endsWith(c.suffix)
  if ('equals-ignore-case' in c) return typeof value === 'string' && value.toLowerCase() === c['equals-ignore-case'].toLowerCase()
  if ('numeric' in c) return typeof value === 'number' && numericHolds(c.numeric, value)
  const not = c['anything-but']
  const list = Array.isArray(not) ? not : [not]
  return !list.includes(value)
}

/** O evento casa com o padrão? Campos do padrão com E; valores da lista com OU. */
export function matches(pattern: Pattern, event: EventData): boolean {
  return Object.entries(pattern).every(([field, spec]) => {
    const value = event[field]
    if (Array.isArray(spec)) {
      if (value !== undefined && !isScalar(value)) return false
      return spec.some((c) => conditionHolds(c, value))
    }
    if (value === undefined) return Object.values(spec).every((s) => Array.isArray(s) && s.some((c) => typeof c === 'object' && c !== null && 'exists' in c && !c.exists))
    if (isScalar(value)) return false
    return matches(spec, value)
  })
}

/** Texto do padrão em JSON compacto, para a interface. */
export const patternText = (p: Pattern) => JSON.stringify(p).replace(/,/g, ', ').replace(/:/g, ': ')
