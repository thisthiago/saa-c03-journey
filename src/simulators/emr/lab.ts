/** Laboratório "O processamento da noite": montar o cluster de cada job para terminar no prazo, resistir à perda de Spot e gastar pouco. */
import type { ItemFeedback } from '../../engine/types'
import { usd } from '../compute-prices'
import { bestCluster, describeCluster, OUTCOME_LABEL, runJob, type EmrCluster, type EmrJob } from './model'

export interface EmrLabConfig {
  region?: string
  jobs: EmrJob[]
}

export interface EmrLabResponse {
  clusters: Record<string, EmrCluster | undefined>
}

export const EMR_INITIAL: EmrCluster = { primary: { count: 1, spot: false }, core: { count: 1, spot: false }, task: { count: 0, spot: false } }

export const emrInitial = (c: EmrLabConfig): EmrLabResponse => ({ clusters: Object.fromEntries(c.jobs.map((j) => [j.id, EMR_INITIAL])) })

export const emrSolution = (c: EmrLabConfig): EmrLabResponse => ({ clusters: Object.fromEntries(c.jobs.map((j) => [j.id, bestCluster(j, c.region).cluster])) })

export function judgeJob(c: EmrLabConfig, j: EmrJob, cl: EmrCluster | undefined): { score: number; fb: ItemFeedback } {
  const best = bestCluster(j, c.region)
  const bestText = `${describeCluster(best.cluster)}, por ${usd(best.run.cost)}`
  const run = runJob(j, cl ?? EMR_INITIAL, c.region)
  const label = `${j.name}: ${describeCluster(cl ?? EMR_INITIAL)}`
  if (run.outcome !== 'ok') return { score: 0, fb: { id: j.id, label, status: 'wrong', message: `O job ${OUTCOME_LABEL[run.outcome]}. Uma boa escolha: ${bestText}.` } }
  if (run.cost <= best.run.cost * 1.02) return { score: 1, fb: { id: j.id, label, status: 'correct', message: `Termina no prazo pelo menor custo: ${usd(run.cost)}.` } }
  if (run.cost <= best.run.cost * 2) return { score: 0.5, fb: { id: j.id, label, status: 'partial', message: `Termina no prazo, mas custa ${usd(run.cost)}; ${bestText}.` } }
  return { score: 0, fb: { id: j.id, label, status: 'wrong', message: `Termina no prazo, mas custa ${usd(run.cost)}, mais que o dobro do possível: ${bestText}.` } }
}

export function evaluateEmrLab(c: EmrLabConfig, r: EmrLabResponse) {
  const items = c.jobs.map((j) => ({ concepts: j.concepts, ...judgeJob(c, j, r?.clusters?.[j.id]) }))
  return { score: items.reduce((s, x) => s + x.score, 0) / Math.max(1, items.length), items }
}
