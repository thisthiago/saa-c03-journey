/** Laboratório de opções de compra: escolher como pagar cada parte da frota. */
import type { ItemFeedback } from '../../engine/types'
import { usd } from '../compute-prices'
import { bestOptions, OPTIONS, segmentMonthly, violations, type PurchaseOption, type Segment } from './model'

export interface PurchaseLabConfig {
  region?: string
  segments: Segment[]
  options: PurchaseOption[]
}

export interface PurchaseLabResponse {
  choices: Record<string, PurchaseOption | undefined>
}

/** Até 15% acima da melhor opção válida vale meio ponto. */
export const NEAR_BEST = 1.15

export const purchaseSolution = (c: PurchaseLabConfig): PurchaseLabResponse => ({
  choices: Object.fromEntries(c.segments.map((s) => [s.id, bestOptions(s, c.options, c.region)[0]])),
})

export function judgeSegment(c: PurchaseLabConfig, s: Segment, pick: PurchaseOption | undefined): { score: number; fb: ItemFeedback } {
  const best = bestOptions(s, c.options, c.region)
  if (best.length === 0) throw new Error(`Segmento sem opção válida: ${s.id}`)
  const bestCost = segmentMonthly(s, best[0], c.region)
  const ref = `A melhor opção é ${best.map((b) => OPTIONS[b].short).join(' ou ')}, com ${usd(bestCost)}/mês.`
  if (!pick) return { score: 0, fb: { id: s.id, label: `${s.name}: sem escolha`, status: 'missed', message: `Escolha uma opção. ${ref}` } }
  const label = `${s.name}: ${OPTIONS[pick].short}`
  const v = violations(s, pick)
  if (v.length) return { score: 0, fb: { id: s.id, label, status: 'wrong', message: `Não serve: ${v.join('; ')}. ${ref}` } }
  const cost = segmentMonthly(s, pick, c.region)
  if (best.includes(pick)) {
    const commitments = best.filter((b) => b.includes('-sp-') || b.startsWith('ri-'))
    const tie = best.length < 2 ? '' : commitments.length > 1 ? ' Empata com outra opção de mesmo preço; entre Savings Plan e Reserved Instance, a AWS recomenda o Savings Plan.' : ' Empata com outra opção de mesmo preço.'
    return { score: 1, fb: { id: s.id, label, status: 'correct', message: `Atende aos requisitos pelo menor custo: ${usd(cost)}/mês.${tie}` } }
  }
  const note = OPTIONS[pick].billedAlways && s.hoursPerDay < 24 ? ' O compromisso é cobrado as 24 horas do dia, e essas instâncias só rodam parte do tempo.' : ''
  if (cost <= bestCost * NEAR_BEST) return { score: 0.5, fb: { id: s.id, label, status: 'partial', message: `Serve, mas custa ${usd(cost)}/mês.${note} ${ref}` } }
  return { score: 0, fb: { id: s.id, label, status: 'wrong', message: `Serve, mas custa ${usd(cost)}/mês.${note} ${ref}` } }
}

export function evaluatePurchaseLab(c: PurchaseLabConfig, r: PurchaseLabResponse) {
  const items = c.segments.map((s) => ({ concepts: s.concepts, ...judgeSegment(c, s, r.choices?.[s.id]) }))
  return { score: items.reduce((sum, x) => sum + x.score, 0) / Math.max(1, items.length), items }
}

export const purchaseComplete = (c: PurchaseLabConfig, r: PurchaseLabResponse) => c.segments.every((s) => Boolean(r.choices?.[s.id]))
