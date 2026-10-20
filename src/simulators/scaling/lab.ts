/** Laboratório de Auto Scaling: configurar o grupo para atender à demanda do dia dentro do orçamento. */
import type { ItemFeedback } from '../../engine/types'
import { usd } from '../compute-prices'
import { simulateDay, type DayScenario, type ScalingSetup } from './model'

export interface ScalingLabConfig {
  scenario: DayScenario
  /** Fração máxima de demanda não atendida no dia (ex.: 0,02). */
  maxUnmetPct: number
  /** Orçamento mensal do grupo, em dólares. */
  maxMonthlyCost: number
  policies: ScalingSetup['policy'][]
  allowScheduled: boolean
  allowPredictive: boolean
  initial: ScalingSetup
  solution: ScalingSetup
  concepts?: { demand?: string[]; cost?: string[] }
}

export type ScalingLabResponse = ScalingSetup

/** Pesos da nota: atender à demanda pesa mais que o custo. */
export const WEIGHTS = { demand: 0.6, cost: 0.4 }

export function setupErrors(s: ScalingSetup): string[] {
  const out: string[] = []
  if (!(s.min >= 0 && s.max >= s.min)) out.push('o max precisa ser maior ou igual ao min')
  if (s.desired < s.min || s.desired > s.max) out.push('a capacidade desejada precisa ficar entre min e max')
  if (s.policy === 'target-tracking' && !(s.target && s.target > 0 && s.target <= 1)) out.push('o alvo do target tracking precisa ficar entre 1% e 100%')
  return out
}

export function evaluateScalingLab(c: ScalingLabConfig, s: ScalingLabResponse) {
  const errors = setupErrors(s)
  if (errors.length) {
    return { score: 0, items: [{ score: 0, fb: { id: 'invalid', label: 'Configuração inválida', status: 'wrong', message: `${errors.join('; ')}.` } as ItemFeedback }] }
  }
  const r = simulateDay(c.scenario, s)
  const unmetOk = r.unmetPct <= c.maxUnmetPct
  // A nota cai a zero quando a demanda perdida chega ao triplo do limite.
  const demandScore = unmetOk ? 1 : Math.max(0, 1 - (r.unmetPct - c.maxUnmetPct) / (2 * c.maxUnmetPct))
  const costOk = r.monthlyCost <= c.maxMonthlyCost
  const costScore = costOk ? 1 : Math.max(0, 1 - ((r.monthlyCost - c.maxMonthlyCost) / c.maxMonthlyCost) * 2)
  const pct = (v: number) => `${(v * 100).toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%`
  const items = [
    {
      concepts: c.concepts?.demand,
      score: demandScore,
      fb: {
        id: 'demand',
        label: `Demanda não atendida: ${pct(r.unmetPct)} (limite: ${pct(c.maxUnmetPct)})`,
        status: unmetOk ? 'correct' : demandScore >= 0.5 ? 'partial' : 'wrong',
        message: unmetOk ? `O grupo chegou a ${r.peakInService} instâncias no pico e acompanhou a demanda.` : `O grupo não acompanhou a demanda: chegou a ${r.peakInService} instâncias. Veja se o max permite crescer o bastante e se a política reage a tempo (o warmup é de ${c.scenario.warmupMin} minutos).`,
      } as ItemFeedback,
    },
    {
      concepts: c.concepts?.cost,
      score: costScore,
      fb: {
        id: 'cost',
        label: `Custo: ${usd(r.monthlyCost)}/mês (orçamento: ${usd(c.maxMonthlyCost)})`,
        status: costOk ? 'correct' : costScore >= 0.5 ? 'partial' : 'wrong',
        message: costOk ? `${r.instanceHours.toLocaleString('pt-BR', { maximumFractionDigits: 0 })} instância-horas por dia.` : 'O grupo fica grande demais por tempo demais. Um min menor, ou uma política que encolha fora do pico, reduz o custo.',
      } as ItemFeedback,
    },
  ]
  return { score: WEIGHTS.demand * demandScore + WEIGHTS.cost * costScore, items }
}
