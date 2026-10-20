/** Laboratório "Escolhendo a infraestrutura adequada": associar cenários (ou componentes) à opção de infraestrutura. */
import type { ItemFeedback } from '../../engine/types'
import { bestOption, judgePlacement, OPTIONS, type PlacementItem, type PlacementOption } from './model'

export interface PlacementLabConfig {
  items: PlacementItem[]
  options: PlacementOption[]
  /** Rótulo da lista de itens ("Cenários" ou "Componentes"). */
  itemsLabel: string
}

export interface PlacementLabResponse {
  placements: Record<string, string>
}

export const placementSolution = (c: PlacementLabConfig): PlacementLabResponse => ({ placements: Object.fromEntries(c.items.map((i) => [i.id, bestOption(i, c.options)])) })

export function evaluatePlacementLab(c: PlacementLabConfig, r: PlacementLabResponse) {
  const items = c.items.map((it) => {
    const pick = r.placements?.[it.id] as PlacementOption | undefined
    const v = judgePlacement(it, pick, c.options)
    return { concepts: it.concepts, score: v.score, fb: { id: it.id, label: `${it.text} → ${pick ? OPTIONS[pick].name : '—'}`, status: v.status, message: v.message } as ItemFeedback }
  })
  return { score: items.reduce((s, x) => s + x.score, 0) / Math.max(1, items.length), items }
}
