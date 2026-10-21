/** Laboratório "Quem vê o quê": conceder a cada analista exatamente as células de que ele precisa, sem vazar o resto. */
import type { ItemFeedback } from '../../engine/types'
import { checkAccess, type CellSpec, type Grant, type PermTable } from './model'

export interface PermAnalyst {
  id: string
  name: string
  /** O que a pessoa precisa ver, em texto (RichText). */
  need: string
  allowed: CellSpec
  concepts?: string[]
}

export interface LakePermLabConfig {
  table: PermTable
  palette: { id: string; grant: Grant }[]
  analysts: PermAnalyst[]
}

export interface LakePermLabResponse {
  grants: Record<string, string[] | undefined>
}

export const lakePermInitial = (c: LakePermLabConfig): LakePermLabResponse => ({ grants: Object.fromEntries(c.analysts.map((a) => [a.id, []])) })

export const grantsOf = (c: LakePermLabConfig, ids: string[] = []): Grant[] => c.palette.filter((p) => ids.includes(p.id)).map((p) => p.grant)

/** A menor combinação da paleta que dá exatamente o acesso pedido (ou undefined). */
export function minimalGrants(c: LakePermLabConfig, a: PermAnalyst): string[] | undefined {
  const ids = c.palette.map((p) => p.id)
  let best: string[] | undefined
  for (let mask = 1; mask < 1 << ids.length; mask++) {
    const pick = ids.filter((_, i) => mask & (1 << i))
    if (best && pick.length >= best.length) continue
    if (checkAccess(c.table, grantsOf(c, pick), a.allowed).verdict === 'exact') best = pick
  }
  return best
}

export const lakePermSolution = (c: LakePermLabConfig): LakePermLabResponse => ({ grants: Object.fromEntries(c.analysts.map((a) => [a.id, minimalGrants(c, a) ?? []])) })

export function judgeAnalyst(c: LakePermLabConfig, a: PermAnalyst, ids: string[] = []): { score: number; fb: ItemFeedback } {
  const r = checkAccess(c.table, grantsOf(c, ids), a.allowed)
  const label = a.name
  switch (r.verdict) {
    case 'exact':
      return { score: 1, fb: { id: a.id, label, status: 'correct', message: 'Vê exatamente o que precisa, nem uma célula a mais.' } }
    case 'extra':
      return { score: 0, fb: { id: a.id, label, status: 'wrong', message: `Vê ${r.extra.length} ${r.extra.length === 1 ? 'célula' : 'células'} que não deveria ver: há vazamento.` } }
    case 'partial':
      return { score: 0.5, fb: { id: a.id, label, status: 'partial', message: `Não vaza nada, mas faltam ${r.missing.length} ${r.missing.length === 1 ? 'célula' : 'células'} de que a pessoa precisa.` } }
    case 'none':
      return { score: 0, fb: { id: a.id, label, status: 'missed', message: 'Sem nenhuma concessão, a pessoa não vê nada.' } }
  }
}

export function evaluateLakePermLab(c: LakePermLabConfig, r: LakePermLabResponse) {
  const items = c.analysts.map((a) => ({ concepts: a.concepts, ...judgeAnalyst(c, a, r?.grants?.[a.id]) }))
  return { score: items.reduce((s, x) => s + x.score, 0) / Math.max(1, items.length), items }
}
