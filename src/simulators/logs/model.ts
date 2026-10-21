/**
 * CloudWatch Logs: filtros de métrica sobre linhas de log, classe e retenção
 * do grupo de logs, e o custo mensal de ingestão, armazenamento e consulta.
 *
 * Fatos conferidos em 21/10/2026:
 * - Grupos, fluxos, retenção (padrão: guardar para sempre; valores aceitos de 1 dia a 10 anos; exclusão em até 72 horas depois do prazo): https://docs.aws.amazon.com/AmazonCloudWatch/latest/logs/Working-with-log-groups-and-streams.html
 * - Valores de retenção aceitos: https://docs.aws.amazon.com/AmazonCloudWatchLogs/latest/APIReference/API_PutRetentionPolicy.html
 * - Filtros de métrica (só classe Standard, não retroativos): https://docs.aws.amazon.com/AmazonCloudWatch/latest/logs/MonitoringLogData.html
 * - Sintaxe dos padrões de filtro (diferencia maiúsculas de minúsculas; termos, "?" para opcionais, JSON com $., &&, || e parênteses): https://docs.aws.amazon.com/AmazonCloudWatch/latest/logs/FilterAndPatternSyntax.html
 * - Filtros de assinatura (só classe Standard; destinos Kinesis, Firehose e Lambda): https://docs.aws.amazon.com/AmazonCloudWatch/latest/logs/Subscriptions.html
 * - Classes de log (Standard e Infrequent Access; só a ingestão tem preço diferente; a classe não muda depois da criação): https://docs.aws.amazon.com/AmazonCloudWatch/latest/logs/CloudWatch_Logs_Log_Classes.html
 * - Preços de ingestão, armazenamento e consultas do Logs Insights: tabela de preços da AWS Price List (governance-prices.json).
 *
 * Premissas do simulador (declaradas na interface): o volume armazenado por
 * dia vem do cenário (a AWS cobra o volume compactado); sem expiração, a
 * conta considerada é a do 5º ano, com cinco anos de dados guardados.
 */
import { governancePrices } from '../governance-prices'

export type LogClass = 'standard' | 'infrequent'

export const CLASS_LABEL: Record<LogClass, string> = { standard: 'Standard', infrequent: 'Infrequent Access' }

/** Valores de retenção aceitos pela API, em dias (conferidos em 21/10/2026). */
export const RETENTION_VALUES = [1, 3, 5, 7, 14, 30, 60, 90, 120, 150, 180, 365, 400, 545, 731, 1096, 1827, 2192, 2557, 2922, 3288, 3653] as const

/** 0 representa "nunca expirar", o padrão de um grupo novo. */
export const NEVER = 0

export const retentionLabel = (days: number): string => (days === NEVER ? 'Nunca expira (padrão)' : days === 1 ? '1 dia' : days >= 365 ? `${days} dias (${Math.round((days / 365) * 10) / 10} ano(s))` : `${days} dias`)

// ---------------------------------------------------------------------------
// Padrões de filtro
// ---------------------------------------------------------------------------

const words = (line: string) => line.split(/[^A-Za-z0-9_]+/).filter(Boolean)

interface TextTerm {
  text: string
  quoted: boolean
  optional: boolean
}

function tokenizeText(p: string): TextTerm[] {
  const out: TextTerm[] = []
  const re = /(\?)?(?:"([^"]*)"|(\S+))/g
  let m: RegExpExecArray | null
  while ((m = re.exec(p))) out.push({ optional: Boolean(m[1]), quoted: m[2] !== undefined, text: m[2] ?? m[3] })
  return out
}

/** Padrão de texto: termos que precisam todos aparecer, "?termo" para opcionais e "frase exata" entre aspas. Diferencia maiúsculas de minúsculas. */
function matchText(pattern: string, line: string): boolean {
  const terms = tokenizeText(pattern)
  const present = (t: TextTerm) => (t.quoted ? line.includes(t.text) : words(line).includes(t.text))
  const optional = terms.filter((t) => t.optional)
  return terms.filter((t) => !t.optional).every(present) && (optional.length === 0 || optional.some(present))
}

type Json = unknown

function select(root: Json, path: string): Json | undefined {
  // $.a.b[0].c
  let cur: Json = root
  for (const part of path.replace(/^\$\.?/, '').split('.').filter(Boolean)) {
    const m = /^([^[\]]*)((?:\[\d+\])*)$/.exec(part)
    if (!m) return undefined
    if (m[1]) {
      if (cur === null || typeof cur !== 'object' || Array.isArray(cur)) return undefined
      cur = (cur as Record<string, Json>)[m[1]]
    }
    for (const idx of m[2].match(/\d+/g) ?? []) {
      if (!Array.isArray(cur)) return undefined
      cur = cur[Number(idx)]
    }
    if (cur === undefined) return undefined
  }
  return cur
}

type Tok = { t: 'op' | 'sel' | 'val' | 'and' | 'or' | 'lp' | 'rp'; v: string }

function tokenizeJson(src: string): Tok[] {
  const out: Tok[] = []
  const re = /\s*(&&|\|\||\(|\)|!=|>=|<=|=|>|<|\$[^\s=!<>()&|]+|"[^"]*"|[^\s=!<>()&|]+)/g
  let m: RegExpExecArray | null
  while ((m = re.exec(src))) {
    const v = m[1]
    if (v === '&&') out.push({ t: 'and', v })
    else if (v === '||') out.push({ t: 'or', v })
    else if (v === '(') out.push({ t: 'lp', v })
    else if (v === ')') out.push({ t: 'rp', v })
    else if (['!=', '>=', '<=', '=', '>', '<'].includes(v)) out.push({ t: 'op', v })
    else if (v.startsWith('$')) out.push({ t: 'sel', v })
    else out.push({ t: 'val', v })
  }
  return out
}

function compare(actual: Json | undefined, op: string, expected: string): boolean {
  if (actual === undefined || actual === null || typeof actual === 'object') return false
  const quoted = expected.startsWith('"')
  const want = quoted ? expected.slice(1, -1) : expected
  if (typeof actual === 'number' && !quoted && Number.isFinite(Number(want))) {
    const a = actual
    const b = Number(want)
    return op === '=' ? a === b : op === '!=' ? a !== b : op === '>' ? a > b : op === '<' ? a < b : op === '>=' ? a >= b : a <= b
  }
  const text = String(actual)
  const eq = want.includes('*') ? new RegExp(`^${want.split('*').map((s) => s.replace(/[.+?^${}()|[\]\\]/g, '\\$&')).join('.*')}$`).test(text) : text === want
  return op === '=' ? eq : op === '!=' ? !eq : false
}

function matchJson(pattern: string, line: string): boolean {
  let doc: Json
  try {
    doc = JSON.parse(line)
  } catch {
    return false
  }
  const toks = tokenizeJson(pattern.trim().replace(/^\{/, '').replace(/\}$/, ''))
  let i = 0
  const cond = (): boolean => {
    if (toks[i]?.t === 'lp') {
      i++
      const v = or()
      i++ // ')'
      return v
    }
    const sel = toks[i++]
    const op = toks[i++]
    const val = toks[i++]
    if (!sel || !op || !val || sel.t !== 'sel' || op.t !== 'op') throw new Error('Padrão JSON inválido')
    return compare(select(doc, sel.v), op.v, val.v)
  }
  const and = (): boolean => {
    let v = cond()
    while (toks[i]?.t === 'and') {
      i++
      const r = cond()
      v = v && r
    }
    return v
  }
  const or = (): boolean => {
    let v = and()
    while (toks[i]?.t === 'or') {
      i++
      const r = and()
      v = v || r
    }
    return v
  }
  try {
    return or()
  } catch {
    return false
  }
}

/** A linha de log casa com o padrão de filtro? */
export function matchFilter(pattern: string, line: string): boolean {
  return pattern.trim().startsWith('{') ? matchJson(pattern, line) : matchText(pattern, line)
}

/** Índices das linhas que o padrão conta. */
export function matchedLines(pattern: string, lines: string[]): number[] {
  return lines.flatMap((l, i) => (matchFilter(pattern, l) ? [i] : []))
}

// ---------------------------------------------------------------------------
// Custo
// ---------------------------------------------------------------------------

export interface LogVolume {
  /** Volume enviado por dia, em GB. */
  ingestGBPerDay: number
  /** Volume armazenado por dia, em GB já compactados (premissa do cenário). */
  storedGBPerDay: number
  /** Dados lidos pelas consultas do Logs Insights em um mês, em GB. */
  insightsScannedGBPerMonth: number
}

export interface LogCost {
  ingest: number
  storage: number
  queries: number
  total: number
}

/** Dias de dados guardados: a retenção, ou cinco anos de dados se nunca expira (premissa do simulador). */
export const storedDays = (retentionDays: number): number => (retentionDays === NEVER ? 1825 : retentionDays)

export function logsMonthly(v: LogVolume, cls: LogClass, retentionDays: number, region?: string): LogCost {
  const p = governancePrices(region).cloudwatch
  const ingest = v.ingestGBPerDay * 30 * (cls === 'standard' ? p.logIngestGB : p.logIngestInfrequentGB)
  const storage = v.storedGBPerDay * storedDays(retentionDays) * p.logStorageGBMonth
  const queries = v.insightsScannedGBPerMonth * p.logInsightsScannedGB
  return { ingest, storage, queries, total: ingest + storage + queries }
}
