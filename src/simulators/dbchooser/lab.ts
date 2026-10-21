/** Laboratório "Escolha do banco": associar cada carga ao banco (ou recurso) que atende com menos esforço. */
import type { ItemFeedback } from '../../engine/types'
import { bestDbOption, DB_OPTIONS, judgeDbChoice, type DbItem, type DbOption } from './model'

export interface DbChooserLabConfig {
  items: DbItem[]
  options: DbOption[]
  itemsLabel: string
}

export interface DbChooserLabResponse {
  placements: Record<string, string>
}

export const dbChooserSolution = (c: DbChooserLabConfig): DbChooserLabResponse => ({ placements: Object.fromEntries(c.items.map((i) => [i.id, bestDbOption(i, c.options)])) })

export function evaluateDbChooserLab(c: DbChooserLabConfig, r: DbChooserLabResponse) {
  const items = c.items.map((it) => {
    const pick = r.placements?.[it.id] as DbOption | undefined
    const v = judgeDbChoice(it, pick, c.options)
    return { concepts: it.concepts, score: v.score, fb: { id: it.id, label: `${it.text}: ${pick ? DB_OPTIONS[pick].name : 'sem escolha'}`, status: v.status, message: v.message } as ItemFeedback }
  })
  return { score: items.reduce((s, x) => s + x.score, 0) / Math.max(1, items.length), items }
}
