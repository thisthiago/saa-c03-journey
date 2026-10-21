/** Laboratório de dimensionamento do RDS: classe, implantação e armazenamento de cada banco pelo menor custo. */
import type { ItemFeedback } from '../../engine/types'
import { usd } from '../compute-prices'
import { cheapestDb, dbGaps, dbMonthly, describeDb, validateDb, type DbConfig, type DbNeed } from './model'

export interface DbWorkload {
  id: string
  name: string
  description: string
  need: DbNeed
  concepts?: string[]
}

export interface DbSizingLabConfig {
  region?: string
  workloads: DbWorkload[]
}

export interface DbSizingLabResponse {
  configs: Record<string, DbConfig | undefined>
}

/** Até 10% acima do mínimo vale como ótimo; até 50% acima, meio ponto. */
export const NEAR = { full: 1.1, half: 1.5 }

export const dbSizingSolution = (c: DbSizingLabConfig): DbSizingLabResponse => ({
  configs: Object.fromEntries(c.workloads.map((w) => [w.id, cheapestDb(w.need, c.region)])),
})

export function judgeDb(c: DbSizingLabConfig, w: DbWorkload, v: DbConfig | undefined): { score: number; fb: ItemFeedback } {
  const best = cheapestDb(w.need, c.region)
  const bestCost = dbMonthly(best, c.region).total
  const ref = `O mais barato que atende: ${describeDb(best)} (${usd(bestCost)}/mês).`
  if (!v) return { score: 0, fb: { id: w.id, label: `${w.name}: sem configuração`, status: 'missed', message: `Configure o banco. ${ref}` } }
  const label = `${w.name}: ${describeDb(v)}`
  const errors = validateDb(v)
  if (errors.length) return { score: 0, fb: { id: w.id, label, status: 'wrong', message: `A AWS recusaria: ${errors.join('; ')}. ${ref}` } }
  const gaps = dbGaps(v, w.need, c.region)
  if (gaps.length) return { score: 0, fb: { id: w.id, label, status: 'wrong', message: `Não atende: ${gaps.join('; ')}. ${ref}` } }
  const cost = dbMonthly(v, c.region).total
  if (cost <= bestCost * NEAR.full) return { score: 1, fb: { id: w.id, label, status: 'correct', message: `Atende por ${usd(cost)}/mês, o menor custo possível para este banco.` } }
  if (cost <= bestCost * NEAR.half) return { score: 0.5, fb: { id: w.id, label, status: 'partial', message: `Atende, mas custa ${usd(cost)}/mês. ${ref}` } }
  return { score: 0, fb: { id: w.id, label, status: 'wrong', message: `Atende, mas custa ${usd(cost)}/mês, bem acima do necessário. ${ref}` } }
}

export function evaluateDbSizingLab(c: DbSizingLabConfig, r: DbSizingLabResponse) {
  const items = c.workloads.map((w) => ({ concepts: w.concepts, ...judgeDb(c, w, r.configs?.[w.id]) }))
  return { score: items.reduce((s, x) => s + x.score, 0) / Math.max(1, items.length), items }
}

export const dbSizingComplete = (c: DbSizingLabConfig, r: DbSizingLabResponse) => c.workloads.every((w) => Boolean(r.configs?.[w.id]))
