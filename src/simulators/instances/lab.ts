/** Laboratório "Dimensionamento": escolher, para cada carga, o tipo de instância que atende pelo menor custo. */
import type { ItemFeedback } from '../../engine/types'
import { usd } from '../compute-prices'
import { cheapestFit, gaps, workloadMonthly, type Workload } from './model'

export interface InstancePickerLabConfig {
  region?: string
  workloads: Workload[]
  /** Tipos oferecidos ao jogador (precisam estar na tabela de preços). */
  candidates: string[]
}

export interface InstancePickerLabResponse {
  picks: Record<string, string | undefined>
}

/** Custo até 30% acima do mínimo vale meio ponto: atende, mas paga a mais (julgamento de arquitetura). */
export const NEAR_CHEAPEST = 1.3

export const instancePickerSolution = (c: InstancePickerLabConfig): InstancePickerLabResponse => ({
  picks: Object.fromEntries(c.workloads.map((w) => [w.id, cheapestFit(w, c.candidates, c.region)])),
})

export function judgePick(c: InstancePickerLabConfig, w: Workload, pick: string | undefined): { score: number; fb: ItemFeedback } {
  const best = cheapestFit(w, c.candidates, c.region)
  const bestCost = best ? workloadMonthly(best, w.needs, c.region) : 0
  const label = `${w.name}: ${pick ?? 'sem escolha'}`
  if (!best) throw new Error(`Carga sem tipo que atenda: ${w.id}`)
  if (!pick) return { score: 0, fb: { id: w.id, label, status: 'missed', message: `Escolha um tipo. O mais barato que atende é ${best} (${usd(bestCost)}/mês).` } }
  const missing = gaps(pick, w.needs, c.region)
  if (missing.length) return { score: 0, fb: { id: w.id, label, status: 'wrong', message: `Não atende: ${missing.join('; ')}. O mais barato que atende é ${best} (${usd(bestCost)}/mês).` } }
  const cost = workloadMonthly(pick, w.needs, c.region)
  if (pick === best) return { score: 1, fb: { id: w.id, label, status: 'correct', message: `Atende e é o mais barato entre os que atendem: ${usd(cost)}/mês.` } }
  if (cost <= bestCost * NEAR_CHEAPEST) return { score: 0.5, fb: { id: w.id, label, status: 'partial', message: `Atende, mas custa ${usd(cost)}/mês. ${best} também atende por ${usd(bestCost)}/mês.` } }
  return { score: 0, fb: { id: w.id, label, status: 'wrong', message: `Atende, mas custa ${usd(cost)}/mês, bem acima dos ${usd(bestCost)}/mês de ${best}. Superdimensionar é o desperdício mais comum no EC2.` } }
}

export function evaluateInstancePickerLab(c: InstancePickerLabConfig, r: InstancePickerLabResponse) {
  const items = c.workloads.map((w) => ({ concepts: w.concepts, ...judgePick(c, w, r.picks?.[w.id]) }))
  return { score: items.reduce((s, x) => s + x.score, 0) / Math.max(1, items.length), items }
}

export const instancePickerComplete = (c: InstancePickerLabConfig, r: InstancePickerLabResponse) => c.workloads.every((w) => Boolean(r.picks?.[w.id]))
