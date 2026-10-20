/** Laboratório de lifecycle: o usuário escreve regras e os objetivos são conferidos na simulação. */
import type { ItemFeedback } from '../../engine/types'
import { formatUSD, requirementViolations } from '../cost/model'
import { regionPrices } from '../cost/prices'
import { STORAGE_CLASSES } from '../shared/storageClasses'
import { datasetMonthlyCosts, simulateAll, stateAt, type Dataset, type LifecycleRule, type SegmentState, type TransitionTarget } from './model'

export type LifecycleGoal =
  | { type: 'valid'; why: string; concepts?: string[] }
  | { type: 'state-at'; dataset: string; day: number; allowed: SegmentState[]; why: string; concepts?: string[] }
  | { type: 'kept-until'; dataset: string; day: number; why: string; concepts?: string[] }
  | { type: 'gone-by'; dataset: string; day: number; why: string; concepts?: string[] }
  | { type: 'requirements'; dataset: string; why: string; concepts?: string[] }
  | { type: 'cost-max'; months: number; maxUSD: number; why: string; concepts?: string[] }

export interface LifecycleLabConfig {
  bucketName: string
  region: string
  datasets: Dataset[]
  /** Regras já existentes no bucket (estado inicial). */
  initialRules: LifecycleRule[]
  horizonDays: number
  goals: LifecycleGoal[]
  /** Recursos do editor exibidos. */
  features: { tags?: boolean; size?: boolean; noncurrent?: boolean; mpu?: boolean; deleteMarkers?: boolean }
  targets?: TransitionTarget[]
  solution: LifecycleLabResponse
}

export interface LifecycleLabResponse {
  rules: LifecycleRule[]
}

const label = (s: SegmentState) => (s === 'gone' ? 'excluído' : STORAGE_CLASSES[s].shortName)

export function runLifecycleLab(c: LifecycleLabConfig, r: LifecycleLabResponse) {
  const res = simulateAll(c.datasets, r.rules, c.horizonDays)
  const prices = regionPrices(c.region)
  const costs = c.datasets.map((d, i) => datasetMonthlyCosts(d, res.sims[i], prices, Math.floor(c.horizonDays / 30)))
  return { ...res, costs }
}

/** Custo dos primeiros N meses (todos os conjuntos). */
export function costFirstMonths(costs: { total: number }[][], months: number): number {
  return costs.reduce((s, list) => s + list.slice(0, months).reduce((a, m) => a + m.total, 0), 0)
}

export function evaluateLifecycleLab(c: LifecycleLabConfig, r: LifecycleLabResponse) {
  const run = runLifecycleLab(c, r)
  const simOf = (id: string) => run.sims[c.datasets.findIndex((d) => d.id === id)]
  const ds = (id: string) => c.datasets.find((d) => d.id === id)!
  const items = c.goals.map((g, i) => {
    let ok = false
    let label_ = ''
    let actual = ''
    switch (g.type) {
      case 'valid':
        ok = run.accepted
        label_ = 'O S3 aceita a configuração'
        actual = run.accepted ? '' : run.issues.filter((x) => x.severity === 'error').map((x) => `${x.ruleId}: ${x.message}`).join(' ')
        break
      case 'state-at': {
        const st = stateAt(simOf(g.dataset), g.day)
        ok = g.allowed.includes(st)
        label_ = `${ds(g.dataset).name} no dia ${g.day}: ${g.allowed.map(label).join(' ou ')}`
        actual = `Está em: ${label(st)}.`
        break
      }
      case 'kept-until': {
        const sim = simOf(g.dataset)
        const goneAt = sim.segments.find((s) => s.state === 'gone')?.from
        ok = goneAt === undefined || goneAt >= g.day
        label_ = `${ds(g.dataset).name} guardado por ${g.day} dias`
        actual = goneAt !== undefined ? `Excluído no dia ${goneAt}.` : ''
        break
      }
      case 'gone-by': {
        const sim = simOf(g.dataset)
        const goneAt = sim.segments.find((s) => s.state === 'gone')?.from
        ok = goneAt !== undefined && goneAt <= g.day
        label_ = `${ds(g.dataset).name} removido até o dia ${g.day}`
        actual = goneAt === undefined ? 'Nunca é removido.' : `Removido no dia ${goneAt}.`
        break
      }
      case 'requirements': {
        const d = ds(g.dataset)
        const sim = simOf(g.dataset)
        const bad = sim.segments.filter((s) => s.state !== 'gone' && !s.noncurrent).flatMap((s) => requirementViolations(s.state as Exclude<SegmentState, 'gone'>, d.profile.requirements))
        ok = bad.length === 0
        label_ = `${d.name}: requisitos de acesso e resiliência respeitados`
        actual = bad[0] ?? ''
        break
      }
      case 'cost-max': {
        const total = costFirstMonths(run.costs, g.months)
        ok = total <= g.maxUSD
        label_ = `Custo dos primeiros ${g.months} meses até ${formatUSD(g.maxUSD)}`
        actual = `Simulado: ${formatUSD(total)}.`
        break
      }
    }
    return {
      concepts: g.concepts,
      score: ok ? 1 : 0,
      fb: { id: `goal-${i}`, label: label_, status: ok ? 'correct' : 'wrong', message: ok ? g.why : `${actual} ${g.why}`.trim() } as ItemFeedback,
    }
  })
  return { score: items.reduce((s, i) => s + i.score, 0) / Math.max(1, items.length), items }
}
