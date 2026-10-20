/** Laboratório "Escolhendo o provedor de identidade": associar cada caso à solução de identidade. */
import type { ItemFeedback } from '../../engine/types'
import { bestIdentityOption, judgeIdentity, OPTIONS, type IdentityItem, type IdentityOption } from './model'

export interface IdentityLabConfig {
  items: IdentityItem[]
  options: IdentityOption[]
  itemsLabel: string
}

export interface IdentityLabResponse {
  placements: Record<string, string>
}

export const identitySolution = (c: IdentityLabConfig): IdentityLabResponse => ({ placements: Object.fromEntries(c.items.map((i) => [i.id, bestIdentityOption(i, c.options)])) })

export function evaluateIdentityLab(c: IdentityLabConfig, r: IdentityLabResponse) {
  const items = c.items.map((it) => {
    const pick = r.placements?.[it.id] as IdentityOption | undefined
    const v = judgeIdentity(it, pick, c.options)
    return { concepts: it.concepts, score: v.score, fb: { id: it.id, label: `${it.text}: ${pick ? OPTIONS[pick].name : 'sem escolha'}`, status: v.status, message: v.message } as ItemFeedback }
  })
  return { score: items.reduce((s, x) => s + x.score, 0) / Math.max(1, items.length), items }
}
