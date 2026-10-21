/** Laboratório "Qual serviço responde": associar cada pergunta de operação ao serviço que a atende com menos esforço. */
import type { ItemFeedback } from '../../engine/types'
import { bestOpsOption, judgeOpsChoice, OPS_OPTIONS, type OpsItem, type OpsOption } from './model'

export interface OpsChooserLabConfig {
  items: OpsItem[]
  options: OpsOption[]
  itemsLabel: string
}

export interface OpsChooserLabResponse {
  placements: Record<string, string>
}

export const opsChooserSolution = (c: OpsChooserLabConfig): OpsChooserLabResponse => ({ placements: Object.fromEntries(c.items.map((i) => [i.id, bestOpsOption(i, c.options)])) })

export function evaluateOpsChooserLab(c: OpsChooserLabConfig, r: OpsChooserLabResponse) {
  const items = c.items.map((it) => {
    const pick = r.placements?.[it.id] as OpsOption | undefined
    const v = judgeOpsChoice(it, pick, c.options)
    return { concepts: it.concepts, score: v.score, fb: { id: it.id, label: `${it.text}: ${pick ? OPS_OPTIONS[pick].name : 'sem escolha'}`, status: v.status, message: v.message } as ItemFeedback }
  })
  return { score: items.reduce((s, x) => s + x.score, 0) / Math.max(1, items.length), items }
}
