/** Laboratório de logs: filtro de métrica certo, classe do grupo e retenção pelo menor custo que cumpre as regras. */
import type { ItemFeedback } from '../../engine/types'
import { usd } from '../compute-prices'
import { CLASS_LABEL, logsMonthly, matchedLines, NEVER, retentionLabel, type LogClass, type LogVolume } from './model'

export interface LogScenario {
  id: string
  name: string
  description: string
  /** Linhas de exemplo do log (texto ou JSON). */
  lines: string[]
  /** Linhas que a métrica precisa contar (os problemas reais). Sem isto, o grupo não precisa de filtro de métrica. */
  wanted?: number[]
  /** O que a métrica conta, em palavras. */
  metricGoal?: string
  /** Padrões de filtro disponíveis (a escolha de um deles vira o filtro de métrica). */
  patterns?: { id: string; pattern: string }[]
  /** O grupo alimenta uma função Lambda por filtro de assinatura. */
  needsSubscription?: boolean
  volume: LogVolume
  /** Retenção mínima exigida, em dias. */
  minRetention: number
  /** Retenção máxima permitida, em dias (o padrão "nunca expira" a viola). */
  maxRetention?: number
  /** Opções de retenção oferecidas (0 = nunca expira). */
  retentionOptions: number[]
  /** O que as regras do cenário exigem sobre a classe e a retenção, em palavras. */
  rules: string[]
  concepts?: string[]
}

export interface LogsLabConfig {
  region?: string
  scenarios: LogScenario[]
}

export interface LogChoice {
  pattern?: string
  cls?: LogClass
  retention?: number
}

export interface LogsLabResponse {
  choices: Record<string, LogChoice | undefined>
}

/** Até 10% acima do mínimo vale como ótimo; até 50% acima, meio ponto. */
export const NEAR = { full: 1.1, half: 1.5 }

export const logsLabInitial = (c: LogsLabConfig): LogsLabResponse => ({
  choices: Object.fromEntries(c.scenarios.map((s) => [s.id, { cls: 'standard' as LogClass, retention: NEVER, pattern: undefined }])),
})

const needsStandard = (s: LogScenario) => Boolean(s.wanted) || Boolean(s.needsSubscription)

export function planProblems(s: LogScenario, ch: LogChoice): string[] {
  const out: string[] = []
  const cls = ch.cls ?? 'standard'
  const days = ch.retention ?? NEVER
  if (needsStandard(s) && cls === 'infrequent') out.push('a classe Infrequent Access não aceita filtro de métrica nem de assinatura')
  if (days !== NEVER && days < s.minRetention) out.push(`guarda por ${days} dia(s), menos que os ${s.minRetention} exigidos`)
  if (s.maxRetention !== undefined && (days === NEVER || days > s.maxRetention)) out.push(`guarda por mais que os ${s.maxRetention} dia(s) permitidos`)
  return out
}

/** A opção viável mais barata (classe e retenção). */
export function cheapestPlan(s: LogScenario, region?: string): { cls: LogClass; retention: number; total: number } {
  let best: { cls: LogClass; retention: number; total: number } | undefined
  for (const cls of ['standard', 'infrequent'] as LogClass[]) {
    for (const retention of s.retentionOptions) {
      if (planProblems(s, { cls, retention }).length) continue
      const total = logsMonthly(s.volume, cls, retention, region).total
      if (!best || total < best.total) best = { cls, retention, total }
    }
  }
  if (!best) throw new Error(`Cenário ${s.id}: nenhum plano viável`)
  return best
}

/** O padrão que conta exatamente as linhas desejadas. */
export function rightPattern(s: LogScenario): string | undefined {
  if (!s.wanted) return undefined
  const want = JSON.stringify(s.wanted)
  return s.patterns?.find((p) => JSON.stringify(matchedLines(p.pattern, s.lines)) === want)?.id
}

export const logsLabSolution = (c: LogsLabConfig): LogsLabResponse => ({
  choices: Object.fromEntries(
    c.scenarios.map((s) => {
      const plan = cheapestPlan(s, c.region)
      return [s.id, { pattern: rightPattern(s), cls: plan.cls, retention: plan.retention }]
    }),
  ),
})

export function logsLabComplete(c: LogsLabConfig, r: LogsLabResponse): boolean {
  return c.scenarios.every((s) => {
    const ch = r.choices?.[s.id]
    return Boolean(ch?.cls) && ch?.retention !== undefined && (!s.wanted || Boolean(ch.pattern))
  })
}

export function judgeFilter(s: LogScenario, ch: LogChoice | undefined): { score: number; fb: ItemFeedback } | undefined {
  if (!s.wanted) return undefined
  const picked = s.patterns?.find((p) => p.id === ch?.pattern)
  const label = `${s.name}: filtro ${picked ? picked.pattern : 'não escolhido'}`
  if (!picked) return { score: 0, fb: { id: `${s.id}:filter`, label, status: 'missed', message: `Sem filtro de métrica. ${s.metricGoal ?? ''}` } }
  const got = matchedLines(picked.pattern, s.lines)
  const extra = got.filter((i) => !s.wanted!.includes(i))
  const missed = s.wanted.filter((i) => !got.includes(i))
  if (!extra.length && !missed.length) return { score: 1, fb: { id: `${s.id}:filter`, label, status: 'correct', message: `Conta exatamente as ${got.length} linhas do problema real.` } }
  const parts = []
  if (extra.length) parts.push(`conta ${extra.length} linha(s) que não são o problema`)
  if (missed.length) parts.push(`deixa passar ${missed.length} linha(s) do problema`)
  return { score: 0, fb: { id: `${s.id}:filter`, label, status: 'wrong', message: `Com este padrão o alarme erraria: ${parts.join(' e ')}. ${s.metricGoal ?? ''}` } }
}

export function judgePlan(s: LogScenario, ch: LogChoice | undefined, region?: string): { score: number; fb: ItemFeedback } {
  const choice = ch ?? {}
  const cls = choice.cls ?? 'standard'
  const days = choice.retention ?? NEVER
  const best = cheapestPlan(s, region)
  const ref = `O plano mais barato que cumpre as regras: ${CLASS_LABEL[best.cls]}, ${retentionLabel(best.retention)} (${usd(best.total)}/mês).`
  const label = `${s.name}: ${CLASS_LABEL[cls]}, ${retentionLabel(days)}`
  const problems = planProblems(s, choice)
  if (problems.length) return { score: 0, fb: { id: `${s.id}:plan`, label, status: 'wrong', message: `Não cumpre: ${problems.join('; ')}. ${ref}` } }
  const cost = logsMonthly(s.volume, cls, days, region).total
  if (cost <= best.total * NEAR.full) return { score: 1, fb: { id: `${s.id}:plan`, label, status: 'correct', message: `Cumpre as regras por ${usd(cost)}/mês.` } }
  if (cost <= best.total * NEAR.half) return { score: 0.5, fb: { id: `${s.id}:plan`, label, status: 'partial', message: `Cumpre, mas custa ${usd(cost)}/mês. ${ref}` } }
  return { score: 0, fb: { id: `${s.id}:plan`, label, status: 'wrong', message: `Cumpre, mas custa ${usd(cost)}/mês, bem acima do necessário. ${ref}` } }
}

export function evaluateLogsLab(c: LogsLabConfig, r: LogsLabResponse) {
  const items = c.scenarios.flatMap((s) => {
    const ch = r.choices?.[s.id]
    const filter = judgeFilter(s, ch)
    return [...(filter ? [{ concepts: s.concepts, ...filter }] : []), { concepts: s.concepts, ...judgePlan(s, ch, c.region) }]
  })
  return { score: items.reduce((sum, x) => sum + x.score, 0) / Math.max(1, items.length), items }
}
