/** Laboratório do CloudTrail: montar a trilha que cumpre os requisitos de auditoria pelo menor custo. */
import type { ItemFeedback } from '../../engine/types'
import { usd } from '../compute-prices'
import { EMPTY_TRAIL, needMet, NEED_LABEL, trailMonthly, type DataScope, type ManagementScope, type TrailNeed, type TrailSetup, type TrailVolume } from './model'

export interface TrailScenario {
  id: string
  name: string
  description: string
  /** Região principal da conta (a trilha nasce nela). */
  homeRegion: string
  needs: TrailNeed[]
  volume: TrailVolume
  concepts?: string[]
}

export interface TrailLabConfig {
  region?: string
  scenarios: TrailScenario[]
}

export interface TrailChoice {
  /** Criar uma trilha (sem ela, só vale o histórico de eventos). */
  create: boolean
  multiRegion: boolean
  organization: boolean
  management: ManagementScope
  data: DataScope
  insights: boolean
  cloudWatchLogs: boolean
  validation: boolean
}

export interface TrailLabResponse {
  choices: Record<string, TrailChoice | undefined>
}

export const NEAR = { full: 1.1, half: 1.5 }

export const emptyChoice = (): TrailChoice => ({ create: false, ...EMPTY_TRAIL })

export const toSetup = (s: TrailScenario, c: TrailChoice | undefined): TrailSetup | undefined => (c?.create ? { id: s.id, homeRegion: s.homeRegion, ...c } : undefined)

export const trailLabInitial = (c: TrailLabConfig): TrailLabResponse => ({ choices: Object.fromEntries(c.scenarios.map((s) => [s.id, emptyChoice()])) })

/** A trilha mais barata que cumpre todos os requisitos. */
export function minimalChoice(s: TrailScenario): TrailChoice {
  const has = (n: TrailNeed) => s.needs.includes(n)
  const read = has('management-read')
  const write = has('management-write')
  return {
    create: true,
    multiRegion: has('all-regions'),
    organization: has('all-accounts'),
    management: read && write ? 'all' : read ? 'read' : 'write',
    data: has('data-sensitive') ? 'sensitive' : 'none',
    insights: has('anomalies'),
    cloudWatchLogs: has('alerts'),
    validation: has('integrity'),
  }
}

export const trailLabSolution = (c: TrailLabConfig): TrailLabResponse => ({ choices: Object.fromEntries(c.scenarios.map((s) => [s.id, minimalChoice(s)])) })

export function judgeTrail(c: TrailLabConfig, s: TrailScenario, choice: TrailChoice | undefined): { score: number; fb: ItemFeedback } {
  const setup = toSetup(s, choice)
  const label = setup ? `${s.name}: trilha criada` : `${s.name}: sem trilha`
  const unmet = s.needs.filter((n) => !needMet(n, setup))
  const best = trailMonthly(toSetup(s, minimalChoice(s)), s.volume, c.region).total
  const cost = trailMonthly(setup, s.volume, c.region).total
  if (unmet.length) return { score: 0, fb: { id: s.id, label, status: 'wrong', message: `Não cumpre: ${unmet.map((n) => NEED_LABEL[n].toLowerCase()).join('; ')}.` } }
  if (cost <= best * NEAR.full + 0.005) return { score: 1, fb: { id: s.id, label, status: 'correct', message: `Cumpre todos os requisitos${cost > 0 ? `, com ${usd(cost)}/mês em eventos pagos` : ' sem eventos pagos além da primeira cópia gratuita'}.` } }
  if (cost <= best * NEAR.half) return { score: 0.5, fb: { id: s.id, label, status: 'partial', message: `Cumpre, mas paga ${usd(cost)}/mês em eventos; o mínimo era ${usd(best)}/mês.` } }
  return { score: 0, fb: { id: s.id, label, status: 'wrong', message: `Cumpre, mas paga ${usd(cost)}/mês em eventos, bem acima do necessário (${usd(best)}/mês). Registre só o que o requisito pede.` } }
}

export function evaluateTrailLab(c: TrailLabConfig, r: TrailLabResponse) {
  const items = c.scenarios.map((s) => ({ concepts: s.concepts, ...judgeTrail(c, s, r.choices?.[s.id]) }))
  return { score: items.reduce((sum, x) => sum + x.score, 0) / Math.max(1, items.length), items }
}
