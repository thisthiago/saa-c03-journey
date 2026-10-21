/**
 * Custos: gasto diário por conta e por tag, alocação por tags de alocação de
 * custo ativadas (com o custo sem tag como "não alocado") e alertas de
 * orçamento sobre o valor real e o previsto.
 *
 * Fatos conferidos em 21/10/2026:
 * - Tags de alocação de custo (de usuário e geradas pela AWS) precisam ser ativadas no console de cobrança para aparecer no Cost Explorer e nos relatórios; as chaves de tag diferenciam maiúsculas de minúsculas; o relatório inclui recursos com e sem tag; só a conta de gerenciamento ativa tags numa organização; podem levar até 24 horas para aparecer e mais 24 para ativar: https://docs.aws.amazon.com/awsaccountbilling/latest/aboutv2/cost-alloc-tags.html e https://docs.aws.amazon.com/awsaccountbilling/latest/aboutv2/activating-tags.html
 * - Orçamentos: tipos (custo, uso, utilização e cobertura de RI e de Savings Plans), alertas sobre valor real e previsto, ações de orçamento: https://docs.aws.amazon.com/cost-management/latest/userguide/budgets-managing-costs.html e https://docs.aws.amazon.com/cost-management/latest/userguide/budgets-controls.html
 * - Cost Explorer (13 meses de histórico, previsão de 18 meses): https://docs.aws.amazon.com/cost-management/latest/userguide/ce-what-is.html
 *
 * Premissas do simulador (declaradas na interface): o gasto diário de cada
 * recurso vem do cenário; a previsão do mês é uma projeção linear (gasto até
 * o dia dividido pelos dias passados, vezes os dias do mês), enquanto a AWS
 * usa um modelo próprio; os alertas são avaliados uma vez por dia.
 */

export interface SpendStream {
  id: string
  account: string
  service: string
  /** Tags do recurso (chave e valor). Recursos sem tags entram como "não alocado". */
  tags: Record<string, string>
  /** Gasto por dia, em dólares. */
  daily: number
  /** A partir deste dia (1 a N), o gasto diário passa a ser `spike.daily`. */
  spike?: { from: number; daily: number }
}

export const UNALLOCATED = 'Não alocado'

export function spendOn(s: SpendStream, day: number): number {
  return s.spike && day >= s.spike.from ? s.spike.daily : s.daily
}

export interface BudgetFilter {
  account?: string
  /** Orçamento por tag: só vale se a chave estiver ativada para alocação de custo. */
  tag?: { key: string; value: string }
}

export const matchesFilter = (s: SpendStream, f: BudgetFilter): boolean => (!f.account || s.account === f.account) && (!f.tag || s.tags[f.tag.key] === f.tag.value)

/** Gasto diário do filtro, do dia 1 ao dia `days`. */
export function dailyTotals(streams: SpendStream[], f: BudgetFilter, days: number): number[] {
  return Array.from({ length: days }, (_, i) => streams.filter((s) => matchesFilter(s, f)).reduce((sum, s) => sum + spendOn(s, i + 1), 0))
}

export const cumulative = (daily: number[]): number[] => daily.reduce<number[]>((acc, v) => [...acc, (acc.at(-1) ?? 0) + v], [])

/** Previsão do mês no dia `day`: projeção linear do gasto até o dia (premissa do simulador). */
export const forecastAt = (cum: number[], day: number): number => (cum[day - 1] / day) * cum.length

export interface BudgetAlert {
  kind: 'actual' | 'forecast'
  /** Porcentagem do limite que dispara o alerta. */
  pct: number
}

export interface AlertFiring {
  alert: BudgetAlert
  /** Primeiro dia em que o alerta dispara, ou `undefined` se não dispara no mês. */
  day?: number
}

export function alertFirings(daily: number[], limit: number, alerts: BudgetAlert[]): AlertFiring[] {
  const cum = cumulative(daily)
  return alerts.map((alert) => {
    const threshold = (alert.pct / 100) * limit
    const idx = cum.findIndex((_, i) => (alert.kind === 'actual' ? cum[i] : forecastAt(cum, i + 1)) >= threshold)
    return { alert, day: idx < 0 ? undefined : idx + 1 }
  })
}

/** Primeiro dia em que qualquer alerta dispara. */
export function firstAlertDay(daily: number[], limit: number, alerts: BudgetAlert[]): number | undefined {
  const days = alertFirings(daily, limit, alerts).flatMap((f) => (f.day === undefined ? [] : [f.day]))
  return days.length ? Math.min(...days) : undefined
}

// ---------------------------------------------------------------------------
// Alocação por tags
// ---------------------------------------------------------------------------

export interface Allocation {
  /** Custo do mês por grupo: "Chave=valor" das tags ativadas, ou "Não alocado". */
  groups: Record<string, number>
  total: number
  unallocated: number
}

/** Aloca o custo do mês pelas chaves de tag ativadas; o que não tem nenhuma das chaves ativadas fica sem alocação. */
export function allocate(streams: SpendStream[], activeKeys: string[], days: number): Allocation {
  const groups: Record<string, number> = {}
  let total = 0
  for (const s of streams) {
    const cost = Array.from({ length: days }, (_, i) => spendOn(s, i + 1)).reduce((a, b) => a + b, 0)
    total += cost
    const keys = activeKeys.filter((k) => s.tags[k] !== undefined)
    const label = keys.length ? keys.map((k) => `${k}=${s.tags[k]}`).join(', ') : UNALLOCATED
    groups[label] = (groups[label] ?? 0) + cost
  }
  return { groups, total, unallocated: groups[UNALLOCATED] ?? 0 }
}
