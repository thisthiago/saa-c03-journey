/** Laboratório "Escolhendo a computação": associar cada carga ao serviço de computação. */
import type { ItemFeedback } from '../../engine/types'
import { bestComputeOption, judgeCompute, OPTIONS, type ComputeItem, type ComputeOption } from './model'

export interface ChooserLabConfig {
  items: ComputeItem[]
  options: ComputeOption[]
  itemsLabel: string
}

export interface ChooserLabResponse {
  placements: Record<string, string>
}

export const chooserSolution = (c: ChooserLabConfig): ChooserLabResponse => ({ placements: Object.fromEntries(c.items.map((i) => [i.id, bestComputeOption(i, c.options)])) })

export function evaluateChooserLab(c: ChooserLabConfig, r: ChooserLabResponse) {
  const items = c.items.map((it) => {
    const pick = r.placements?.[it.id] as ComputeOption | undefined
    const v = judgeCompute(it, pick, c.options)
    return { concepts: it.concepts, score: v.score, fb: { id: it.id, label: `${it.text}: ${pick ? OPTIONS[pick].name : 'sem escolha'}`, status: v.status, message: v.message } as ItemFeedback }
  })
  return { score: items.reduce((s, x) => s + x.score, 0) / Math.max(1, items.length), items }
}
