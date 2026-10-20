/** Laboratório "Onde fica a aplicação?": escolher a Região de cada cenário. */
import type { ItemFeedback } from '../../engine/types'
import { standardPriceIn } from '../cost/prices'
import { bestRegion, evaluateRegion, formatMs, nearestRegion, type PriceLookup, type RegionScenario } from './model'

export interface RegionLabConfig {
  scenarios: RegionScenario[]
}

export interface RegionLabResponse {
  choices: Record<string, string | undefined>
}

export const labPrice: PriceLookup = standardPriceIn

export function regionLabSolution(c: RegionLabConfig, price: PriceLookup = labPrice): RegionLabResponse {
  return { choices: Object.fromEntries(c.scenarios.map((s) => [s.id, bestRegion(s, price).code])) }
}

const usd = (n: number) => `US$ ${n.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

export function evaluateRegionLab(c: RegionLabConfig, r: RegionLabResponse, price: PriceLookup = labPrice) {
  const items = c.scenarios.map((s) => {
    const pick = r.choices?.[s.id]
    const best = bestRegion(s, price)
    const near = nearestRegion(s, price)
    if (!pick) {
      return { concepts: s.concepts, score: 0, fb: { id: s.id, label: `${s.title}: —`, status: 'missed', message: `Nenhuma Região escolhida. A melhor é ${best.code}.` } as ItemFeedback }
    }
    const e = evaluateRegion(s, pick, price)
    let score: number
    let status: ItemFeedback['status']
    let message: string
    if (pick === best.code) {
      score = 1
      status = 'correct'
      message = `Atende a todos os requisitos${s.priority === 'latency' ? ` com a menor latência média entre as válidas (${formatMs(e.weightedLatency)})` : ` com o menor custo de armazenamento entre as válidas (${usd(e.monthlyStorageUSD)}/mês)`}.`
      if (near.code !== best.code) {
        message += near.violations.length
          ? ` A Região de menor latência (${near.code}) não serve: ${near.violations.map((v) => v.message).join(' ')}`
          : ` A Região de menor latência (${near.code}) também atende, mas aqui a latência não é requisito e ela custa ${usd(near.monthlyStorageUSD)}/mês.`
      }
    } else if (e.violations.length === 0) {
      score = 0.5
      status = 'partial'
      message =
        s.priority === 'latency'
          ? `Atende aos requisitos, mas ${best.code} tem latência média menor (${formatMs(best.weightedLatency)} contra ${formatMs(e.weightedLatency)}).`
          : `Atende aos requisitos, mas ${best.code} custa menos (${usd(best.monthlyStorageUSD)} contra ${usd(e.monthlyStorageUSD)} por mês no S3 Standard).`
    } else {
      score = 0
      status = 'wrong'
      message = `${e.violations.map((v) => v.message).join(' ')} A melhor escolha é ${best.code}.`
    }
    if (e.notes.length) message += ` ${e.notes.join(' ')}`
    return { concepts: s.concepts, score, fb: { id: s.id, label: `${s.title}: ${pick}`, status, message } as ItemFeedback }
  })
  return { score: items.reduce((sum, x) => sum + x.score, 0) / Math.max(1, items.length), items }
}
