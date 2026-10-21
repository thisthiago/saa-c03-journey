/** Laboratório "Organizar o data lake": escolher formato, compressão e partição de cada tabela pelo menor custo de armazenamento e consulta. */
import type { ItemFeedback } from '../../engine/types'
import { usd } from '../compute-prices'
import { bestLayout, describeLayout, layoutMonthly, layoutProblems, type LakeTable, type Layout } from './model'

export interface LakeLabConfig {
  region?: string
  tables: LakeTable[]
  /** Layout inicial de todas as tabelas (padrão: CSV sem compressão e sem partição). */
  initial?: Layout
}

export interface LakeLabResponse {
  layouts: Record<string, Layout | undefined>
}

const DEFAULT_LAYOUT: Layout = { format: 'csv', compression: 'none', partition: 'none' }

/** Até esta folga sobre o menor custo, o layout conta como o melhor (empates entre formatos e compressões equivalentes). */
export const BEST_SLACK = 1.02
/** Até este múltiplo do menor custo, o layout funciona, mas não é o melhor. */
export const PARTIAL_LIMIT = 2

export const lakeInitial = (c: LakeLabConfig): LakeLabResponse => ({ layouts: Object.fromEntries(c.tables.map((t) => [t.id, c.initial ?? DEFAULT_LAYOUT])) })

export const lakeSolution = (c: LakeLabConfig): LakeLabResponse => ({ layouts: Object.fromEntries(c.tables.map((t) => [t.id, bestLayout(t, c.region).layout])) })

export function judgeTable(c: LakeLabConfig, t: LakeTable, l: Layout | undefined): { score: number; fb: ItemFeedback } {
  const best = bestLayout(t, c.region)
  const bestText = `${describeLayout(best.layout, t)}, por ${usd(best.cost.total)}/mês`
  if (!l) return { score: 0, fb: { id: t.id, label: `${t.name}: sem escolha`, status: 'missed', message: `Uma boa escolha: ${bestText}.` } }
  const label = `${t.name}: ${describeLayout(l, t)}`
  const pb = layoutProblems(t, l)
  if (pb.length) return { score: 0, fb: { id: t.id, label, status: 'wrong', message: `Não serve: ${pb.join('; ')}. Uma boa escolha: ${bestText}.` } }
  const cost = layoutMonthly(t, l, c.region).total
  if (cost <= best.cost.total * BEST_SLACK) return { score: 1, fb: { id: t.id, label, status: 'correct', message: `Menor custo para essas consultas: ${usd(cost)}/mês.` } }
  if (cost <= best.cost.total * PARTIAL_LIMIT) return { score: 0.5, fb: { id: t.id, label, status: 'partial', message: `Funciona, mas custa ${usd(cost)}/mês; ${bestText}.` } }
  return { score: 0, fb: { id: t.id, label, status: 'wrong', message: `Custa ${usd(cost)}/mês, mais que o dobro do possível: ${bestText}.` } }
}

export function evaluateLakeLab(c: LakeLabConfig, r: LakeLabResponse) {
  const items = c.tables.map((t) => ({ concepts: t.concepts, ...judgeTable(c, t, r?.layouts?.[t.id]) }))
  return { score: items.reduce((sum, x) => sum + x.score, 0) / Math.max(1, items.length), items }
}
