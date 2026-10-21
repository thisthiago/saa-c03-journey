/** Laboratório de alta disponibilidade do RDS: a topologia mais barata que cumpre os requisitos de cada banco. */
import type { ItemFeedback } from '../../engine/types'
import { usd } from '../compute-prices'
import { cheapestTopology, describeTopology, haGaps, haMonthly, validateTopology, type HaNeed, type Topology } from './model'

export interface HaScenario {
  id: string
  name: string
  description: string
  /** Classe das instâncias (a mesma para primária, standby e réplicas). */
  cls: string
  need: HaNeed
  concepts?: string[]
}

export interface RdsHaLabConfig {
  region?: string
  scenarios: HaScenario[]
}

export interface RdsHaLabResponse {
  topologies: Record<string, Topology | undefined>
}

export const EMPTY_TOPOLOGY: Topology = { deployment: 'single-az', replicas: 0, crossRegionReplica: false, backupDays: 0, proxy: false }

/** Até 10% acima do mínimo vale como ótimo; até 50% acima, meio ponto. */
export const NEAR = { full: 1.1, half: 1.5 }

export const rdsHaInitial = (c: RdsHaLabConfig): RdsHaLabResponse => ({ topologies: Object.fromEntries(c.scenarios.map((s) => [s.id, { ...EMPTY_TOPOLOGY }])) })

export const rdsHaSolution = (c: RdsHaLabConfig): RdsHaLabResponse => ({ topologies: Object.fromEntries(c.scenarios.map((s) => [s.id, cheapestTopology(s.need, s.cls, c.region)])) })

export function judgeTopology(c: RdsHaLabConfig, s: HaScenario, t: Topology | undefined): { score: number; fb: ItemFeedback } {
  const best = cheapestTopology(s.need, s.cls, c.region)
  const bestCost = haMonthly(best, s.cls, c.region).total
  const ref = `A mais barata que cumpre tudo: ${describeTopology(best)} (${usd(bestCost)}/mês).`
  const top = t ?? EMPTY_TOPOLOGY
  const label = `${s.name}: ${describeTopology(top)}`
  const errors = validateTopology(top)
  if (errors.length) return { score: 0, fb: { id: s.id, label, status: 'wrong', message: `A AWS recusaria: ${errors.join('; ')}. ${ref}` } }
  const gaps = haGaps(top, s.need)
  if (gaps.length) return { score: 0, fb: { id: s.id, label, status: 'wrong', message: `Não cumpre: ${gaps.join('; ')}. ${ref}` } }
  const cost = haMonthly(top, s.cls, c.region).total
  if (cost <= bestCost * NEAR.full) return { score: 1, fb: { id: s.id, label, status: 'correct', message: `Cumpre tudo por ${usd(cost)}/mês.` } }
  if (cost <= bestCost * NEAR.half) return { score: 0.5, fb: { id: s.id, label, status: 'partial', message: `Cumpre, mas custa ${usd(cost)}/mês. ${ref}` } }
  return { score: 0, fb: { id: s.id, label, status: 'wrong', message: `Cumpre, mas custa ${usd(cost)}/mês, bem acima do necessário. ${ref}` } }
}

export function evaluateRdsHaLab(c: RdsHaLabConfig, r: RdsHaLabResponse) {
  const items = c.scenarios.map((s) => ({ concepts: s.concepts, ...judgeTopology(c, s, r.topologies?.[s.id]) }))
  return { score: items.reduce((sum, x) => sum + x.score, 0) / Math.max(1, items.length), items }
}
