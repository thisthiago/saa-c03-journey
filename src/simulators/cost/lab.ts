/**
 * Laboratório "Otimizador de custos": para cada perfil de dados, escolher uma
 * classe que atenda aos requisitos com custo próximo do menor possível.
 * Tudo é calculado pelo modelo de custo — nada é fixado à mão no conteúdo.
 */
import type { ItemFeedback } from '../../engine/types'
import { STORAGE_CLASSES, STORAGE_CLASS_ORDER, type StorageClassId } from '../shared/storageClasses'
import { cheapestCompliant, formatUSD, monthlyCost, type DataProfile } from './model'
import { regionPrices } from './prices'

export interface CostLabConfig {
  region: string
  profiles: (DataProfile & { concepts?: string[] })[]
  /** Folga aceita sobre o menor custo que atende aos requisitos (0,1 = 10%). */
  tolerance: number
  budgetUSD?: number
  classes?: StorageClassId[]
}

export interface CostLabResponse {
  choices: Record<string, StorageClassId>
}

export function labClasses(c: CostLabConfig): StorageClassId[] {
  return c.classes ?? STORAGE_CLASS_ORDER
}

export function evaluateCostLab(c: CostLabConfig, r: CostLabResponse): { score: number; items: { concepts?: string[]; score: number; fb: ItemFeedback }[] } {
  const prices = regionPrices(c.region)
  const items = c.profiles.map((p) => {
    const choice = r.choices?.[p.id]
    const best = cheapestCompliant(p, prices, labClasses(c))!
    if (!choice) {
      return { concepts: p.concepts, score: 0, fb: { id: p.id, label: p.name, status: 'missed', message: `Sem escolha. A melhor opção seria ${STORAGE_CLASSES[best.storageClass].name} (${formatUSD(best.total)}/mês).` } as ItemFeedback }
    }
    const cost = monthlyCost(p, choice, prices)
    const name = STORAGE_CLASSES[choice].name
    if (cost.violations.length > 0) {
      return { concepts: p.concepts, score: 0, fb: { id: p.id, label: `${p.name}: ${name}`, status: 'wrong', message: `${cost.violations.join(' ')} A melhor opção que atende aos requisitos: ${STORAGE_CLASSES[best.storageClass].name} (${formatUSD(best.total)}/mês).` } as ItemFeedback }
    }
    const ok = cost.total <= best.total * (1 + c.tolerance) + 0.005
    return {
      concepts: p.concepts,
      score: ok ? 1 : 0.5,
      fb: {
        id: p.id,
        label: `${p.name}: ${name} — ${formatUSD(cost.total)}/mês`,
        status: ok ? 'correct' : 'partial',
        message: ok
          ? choice === best.storageClass
            ? 'Atende aos requisitos com o menor custo.'
            : `Atende aos requisitos com custo próximo do mínimo (${STORAGE_CLASSES[best.storageClass].name}: ${formatUSD(best.total)}).`
          : `Atende aos requisitos, mas custa ${Math.round((cost.total / best.total - 1) * 100)}% a mais que ${STORAGE_CLASSES[best.storageClass].name} (${formatUSD(best.total)}/mês).`,
      } as ItemFeedback,
    }
  })
  let score = items.reduce((s, i) => s + i.score, 0) / Math.max(1, items.length)
  if (c.budgetUSD !== undefined) {
    const total = c.profiles.reduce((s, p) => s + (r.choices?.[p.id] ? monthlyCost(p, r.choices[p.id], prices).total : 0), 0)
    const within = total <= c.budgetUSD
    items.push({
      concepts: undefined,
      score: within ? 1 : 0,
      fb: { id: 'budget', label: `Orçamento: ${formatUSD(total)} de ${formatUSD(c.budgetUSD)}`, status: within ? 'correct' : 'wrong', message: within ? 'Dentro do orçamento mensal.' : 'Acima do orçamento mensal.' },
    })
    if (!within) score *= 0.8
  }
  return { score, items }
}

export function costLabSolution(c: CostLabConfig): CostLabResponse {
  const prices = regionPrices(c.region)
  return { choices: Object.fromEntries(c.profiles.map((p) => [p.id, cheapestCompliant(p, prices, labClasses(c))!.storageClass])) }
}
