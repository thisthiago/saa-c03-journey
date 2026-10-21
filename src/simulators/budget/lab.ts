/** Laboratório de custos: ativar as tags de alocação certas e montar orçamentos que avisam a tempo, sem alarme falso. */
import type { ItemFeedback } from '../../engine/types'
import { usd } from '../compute-prices'
import { allocate, alertFirings, dailyTotals, firstAlertDay, UNALLOCATED, type BudgetAlert, type BudgetFilter, type SpendStream } from './model'

export interface BudgetTarget {
  id: string
  label: string
  filter: BudgetFilter
  /** Limite mensal, em dólares. */
  limit: number
  /** O que o orçamento precisa fazer neste mês. */
  expect: { kind: 'spike'; warnBy: number; notBefore: number } | { kind: 'quiet' }
}

export interface BudgetScenario {
  id: string
  name: string
  description: string
  days: number
  streams: SpendStream[]
  /** Chaves de tag que existem nos recursos (algumas só diferem na caixa das letras). */
  tagKeys: string[]
  /** Porcentagem máxima do custo do mês que pode ficar "não alocado". */
  maxUnallocatedPct: number
  targets: BudgetTarget[]
  concepts?: string[]
}

export interface BudgetLabConfig {
  scenarios: BudgetScenario[]
}

export interface TargetChoice {
  enabled: boolean
  /** Alerta sobre o valor real, em % do limite (0 = sem alerta). */
  actualPct: number
  /** Alerta sobre o valor previsto, em % do limite (0 = sem alerta). */
  forecastPct: number
}

export interface ScenarioChoice {
  activeTags: string[]
  targets: Record<string, TargetChoice | undefined>
}

export interface BudgetLabResponse {
  choices: Record<string, ScenarioChoice | undefined>
}

export const PCT_OPTIONS = [0, 50, 80, 90, 100]

export const emptyTarget = (): TargetChoice => ({ enabled: false, actualPct: 0, forecastPct: 0 })

export const budgetLabInitial = (): BudgetLabResponse => ({ choices: {} })

const alertsOf = (c: TargetChoice): BudgetAlert[] => [...(c.actualPct ? [{ kind: 'actual' as const, pct: c.actualPct }] : []), ...(c.forecastPct ? [{ kind: 'forecast' as const, pct: c.forecastPct }] : [])]

export function targetDaily(s: BudgetScenario, t: BudgetTarget): number[] {
  return dailyTotals(s.streams, t.filter, s.days)
}

export function judgeTarget(s: BudgetScenario, t: BudgetTarget, choice: ScenarioChoice | undefined): { score: number; fb: ItemFeedback; day?: number } {
  const c = choice?.targets[t.id]
  const id = `${s.id}:${t.id}`
  const label = `${s.name}: ${t.label} (limite de ${usd(t.limit)})`
  if (!c?.enabled) return { score: 0, fb: { id, label, status: 'missed', message: 'Sem orçamento para este alvo.' } }
  if (t.filter.tag && !choice?.activeTags.includes(t.filter.tag.key)) {
    return { score: 0, fb: { id, label, status: 'wrong', message: `Um orçamento por tag só vale se a chave ${t.filter.tag.key} estiver ativada como tag de alocação de custo.` } }
  }
  const alerts = alertsOf(c)
  if (!alerts.length) return { score: 0, fb: { id, label, status: 'wrong', message: 'O orçamento existe, mas não tem nenhum alerta: ninguém seria avisado.' } }
  const day = firstAlertDay(targetDaily(s, t), t.limit, alerts)
  if (t.expect.kind === 'quiet') {
    if (day === undefined) return { score: 1, fb: { id, label, status: 'correct', message: 'O gasto é normal neste mês e o orçamento não dispara à toa.' } }
    return { score: 0, day, fb: { id, label, status: 'wrong', message: `O gasto deste mês é normal, mas um alerta dispara no dia ${day}: é um alarme falso que acostuma a equipe a ignorar avisos.` } }
  }
  if (day === undefined) return { score: 0, fb: { id, label, status: 'wrong', message: 'O gasto sobe no meio do mês e nenhum alerta dispara: o estouro passaria sem aviso.' } }
  if (day < t.expect.notBefore) return { score: 0, day, fb: { id, label, status: 'wrong', message: `O alerta dispara no dia ${day}, antes de o gasto subir (dia ${t.expect.notBefore}): o limiar está baixo demais e avisaria à toa mesmo num mês normal.` } }
  if (day <= t.expect.warnBy) return { score: 1, day, fb: { id, label, status: 'correct', message: `O primeiro alerta dispara no dia ${day}, com tempo para agir (o prazo era o dia ${t.expect.warnBy}).` } }
  return { score: 0.5, day, fb: { id, label, status: 'partial', message: `O primeiro alerta só dispara no dia ${day}, depois do prazo (dia ${t.expect.warnBy}). O alerta sobre o valor previsto avisa antes que o de valor real.` } }
}

export function judgeTags(s: BudgetScenario, choice: ScenarioChoice | undefined): { score: number; fb: ItemFeedback } {
  const active = choice?.activeTags ?? []
  const a = allocate(s.streams, active, s.days)
  const pct = (a.unallocated / a.total) * 100
  const label = `${s.name}: tags de alocação ativadas (${active.length ? active.join(', ') : 'nenhuma'})`
  const id = `${s.id}:tags`
  const text = `${Math.round(pct)}% do custo do mês (${usd(a.unallocated)}) ficou como "${UNALLOCATED}"`
  if (pct <= s.maxUnallocatedPct) return { score: 1, fb: { id, label, status: 'correct', message: `${text}, dentro do limite de ${s.maxUnallocatedPct}%.` } }
  const hint = ' As chaves de tag diferenciam maiúsculas de minúsculas: CostCenter e costcenter são chaves diferentes e cada uma precisa ser ativada. Para unificar de vez, padronize as tags com uma política de tags.'
  if (pct <= s.maxUnallocatedPct * 2) return { score: 0.5, fb: { id, label, status: 'partial', message: `${text}, acima do limite de ${s.maxUnallocatedPct}%.${hint}` } }
  return { score: 0, fb: { id, label, status: 'wrong', message: `${text}: sem tags ativadas, o custo não pode ser dividido entre os times.${hint}` } }
}

/** Alertas mais simples que cumprem o alvo (a busca é determinística). */
export function findTargetChoice(s: BudgetScenario, t: BudgetTarget): TargetChoice {
  for (const actualPct of PCT_OPTIONS) {
    for (const forecastPct of PCT_OPTIONS) {
      const c = { enabled: true, actualPct, forecastPct }
      if (judgeTarget(s, t, { activeTags: s.tagKeys, targets: { [t.id]: c } }).score === 1) return c
    }
  }
  throw new Error(`Alvo ${s.id}:${t.id} sem solução`)
}

export const budgetLabSolution = (c: BudgetLabConfig): BudgetLabResponse => ({
  choices: Object.fromEntries(c.scenarios.map((s) => [s.id, { activeTags: s.tagKeys, targets: Object.fromEntries(s.targets.map((t) => [t.id, findTargetChoice(s, t)])) }])),
})

export const budgetLabComplete = (c: BudgetLabConfig, r: BudgetLabResponse): boolean => c.scenarios.every((s) => s.targets.every((t) => r.choices?.[s.id]?.targets[t.id]?.enabled !== undefined))

export function evaluateBudgetLab(c: BudgetLabConfig, r: BudgetLabResponse) {
  const items = c.scenarios.flatMap((s) => {
    const ch = r.choices?.[s.id]
    return [{ concepts: s.concepts, ...judgeTags(s, ch) }, ...s.targets.map((t) => ({ concepts: s.concepts, ...judgeTarget(s, t, ch) }))]
  })
  return { score: items.reduce((sum, x) => sum + x.score, 0) / Math.max(1, items.length), items }
}

export { alertFirings }
