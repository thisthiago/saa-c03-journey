/**
 * Motor genérico de escolha: cada cartão (requisito) tem requisitos rígidos, e
 * cada opção atende a um conjunto deles. A melhor opção atende a tudo com a
 * menor complexidade; outra que atende vale meio ponto; a que não atende vale 0.
 *
 * A complexidade é julgamento de arquitetura do AWS Quest (esforço e custo),
 * usada só para desempatar opções que atendem aos mesmos requisitos.
 */
import type { ItemFeedback } from '../../engine/types'

export interface ChoiceInfo {
  name: string
  summary: string
  meets: string[]
  limits: string[]
  /** 1 (mais simples e barata) a 5. */
  complexity: number
}

export interface ChoiceCatalog {
  options: Record<string, ChoiceInfo>
  needLabel: Record<string, string>
}

export interface ChoiceItem {
  id: string
  text: string
  /** Requisito que decide o caso. */
  dominant: string
  /** Todos os requisitos rígidos (inclui o dominante). */
  needs: string[]
  concepts?: string[]
}

export interface ChoiceLabConfig {
  items: ChoiceItem[]
  options: string[]
  itemsLabel: string
}

export interface ChoiceLabResponse {
  placements: Record<string, string>
}

export const unmetNeeds = (cat: ChoiceCatalog, item: ChoiceItem, opt: string) => item.needs.filter((n) => !cat.options[opt].meets.includes(n))

/** Melhor opção: atende a todos os requisitos com a menor complexidade. Lança erro se não for única. */
export function bestChoice(cat: ChoiceCatalog, item: ChoiceItem, options: string[]): string {
  const ok = options.filter((o) => unmetNeeds(cat, item, o).length === 0).sort((a, b) => cat.options[a].complexity - cat.options[b].complexity)
  if (ok.length === 0) throw new Error(`Item ${item.id}: nenhuma opção atende`)
  if (ok[1] && cat.options[ok[1]].complexity === cat.options[ok[0]].complexity) throw new Error(`Item ${item.id}: empate entre ${ok[0]} e ${ok[1]}`)
  return ok[0]
}

export function judgeChoice(cat: ChoiceCatalog, item: ChoiceItem, pick: string | undefined, options: string[]): { score: number; status: ItemFeedback['status']; message: string } {
  const best = bestChoice(cat, item, options)
  const bestName = cat.options[best].name
  const why = cat.needLabel[item.dominant]
  if (!pick) return { score: 0, status: 'missed', message: `Sem escolha. O requisito que decide é ${why}: ${bestName}.` }
  if (pick === best) return { score: 1, status: 'correct', message: `O requisito que decide é ${why}. ${cat.options[best].summary}` }
  const missing = unmetNeeds(cat, item, pick)
  if (missing.length === 0) return { score: 0.5, status: 'partial', message: `Funciona, mas dá mais trabalho ou custa mais do que o caso pede. ${cat.options[pick].limits[0]} ${bestName} atende com menos.` }
  return { score: 0, status: 'wrong', message: `${cat.options[pick].name} não atende: ${missing.map((n) => cat.needLabel[n]).join('; ')}. A opção adequada é ${bestName}.` }
}

export const choiceSolution = (cat: ChoiceCatalog, c: ChoiceLabConfig): ChoiceLabResponse => ({ placements: Object.fromEntries(c.items.map((i) => [i.id, bestChoice(cat, i, c.options)])) })

export function evaluateChoiceLab(cat: ChoiceCatalog, c: ChoiceLabConfig, r: ChoiceLabResponse) {
  const items = c.items.map((it) => {
    const pick = r?.placements?.[it.id]
    const v = judgeChoice(cat, it, pick, c.options)
    return { concepts: it.concepts, score: v.score, fb: { id: it.id, label: `${it.text}: ${pick ? cat.options[pick].name : 'sem escolha'}`, status: v.status, message: v.message } as ItemFeedback }
  })
  return { score: items.reduce((s, x) => s + x.score, 0) / Math.max(1, items.length), items }
}
