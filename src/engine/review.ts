/**
 * Revisão inteligente: seleciona conceitos vencidos ou com domínio baixo,
 * prioriza atraso, fragilidade e erros recentes, e intercala fases.
 */
import type { ActivityDef } from '../activities/types'
import { isDue, overdueDays } from './mastery'
import type { Registry } from './registry'
import type { ProgressState } from './types'

export const REVIEW_SESSION_SIZE = 8
/** Tamanhos de rodada que o estudante pode escolher na Revisão. */
export const REVIEW_SIZE_OPTIONS = [5, 8, 12, 16] as const
export const WEAK_MASTERY = 0.5

export interface ReviewEntry {
  conceptId: string
  item: ActivityDef
  reason: 'due' | 'weak'
  priority: number
}

export function reviewCandidates(state: ProgressState, reg: Registry, now: Date): ReviewEntry[] {
  const out: ReviewEntry[] = []
  for (const [conceptId, cp] of Object.entries(state.concepts)) {
    if (cp.evidence === 0) continue
    const items = reg.reviewItems.get(conceptId)
    if (!items || items.length === 0) continue
    const due = isDue(cp, now)
    const weak = cp.mastery < WEAK_MASTERY
    if (!due && !weak) continue
    const item = items.find((i) => i.id !== cp.lastReviewItemId) ?? items[0]
    const priority = 2 * overdueDays(cp, now) + 3 * (1 - cp.mastery) + cp.recentErrors
    out.push({ conceptId, item, reason: due ? 'due' : 'weak', priority })
  }
  return out.sort((a, b) => b.priority - a.priority || a.conceptId.localeCompare(b.conceptId))
}

/** Monta a sessão alternando fases (intercalação favorece a retenção). */
export function buildReviewSession(state: ProgressState, reg: Registry, now: Date, size = REVIEW_SESSION_SIZE): ReviewEntry[] {
  const candidates = reviewCandidates(state, reg, now)
  const groups = new Map<string, ReviewEntry[]>()
  for (const c of candidates) {
    const key = reg.conceptPhase.get(c.conceptId) ?? 'outros'
    groups.set(key, [...(groups.get(key) ?? []), c])
  }
  const queues = [...groups.values()]
  const session: ReviewEntry[] = []
  const usedItems = new Set<string>()
  while (session.length < size && queues.some((q) => q.length > 0)) {
    for (const q of queues) {
      const next = q.shift()
      if (!next || usedItems.has(next.item.id)) continue
      usedItems.add(next.item.id)
      session.push(next)
      if (session.length >= size) break
    }
  }
  return session
}

/** Opções de tamanho que cabem no que há para revisar; a última é "todos" quando sobra menos que 16. */
export function sessionSizeOptions(available: number): number[] {
  return [...new Set([...REVIEW_SIZE_OPTIONS.filter((n) => n < available), Math.min(available, REVIEW_SIZE_OPTIONS.at(-1)!)])].filter((n) => n > 0)
}

export function dueCount(state: ProgressState, reg: Registry, now: Date): number {
  return reviewCandidates(state, reg, now).length
}

/** Próxima data em que algum conceito vence (para "próxima revisão em X dias"). */
export function nextReviewDate(state: ProgressState, reg: Registry): Date | null {
  let min: number | null = null
  for (const [id, cp] of Object.entries(state.concepts)) {
    if (cp.evidence === 0 || !reg.reviewItems.get(id)?.length) continue
    const t = new Date(cp.nextReviewAt).getTime()
    if (min === null || t < min) min = t
  }
  return min === null ? null : new Date(min)
}

/**
 * Treino livre: conceitos já estudados, do menor para o maior domínio.
 * Não concede XP (os itens não estão vencidos), mas atualiza o domínio.
 */
export function buildPracticeSession(state: ProgressState, reg: Registry, size = REVIEW_SESSION_SIZE): ReviewEntry[] {
  return Object.entries(state.concepts)
    .filter(([id, cp]) => cp.evidence > 0 && (reg.reviewItems.get(id)?.length ?? 0) > 0)
    .sort((a, b) => a[1].mastery - b[1].mastery || a[0].localeCompare(b[0]))
    .slice(0, size)
    .map(([conceptId, cp]) => {
      const items = reg.reviewItems.get(conceptId)!
      return { conceptId, item: items.find((i) => i.id !== cp.lastReviewItemId) ?? items[0], reason: 'weak' as const, priority: 0 }
    })
}
