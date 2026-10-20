import type { Evaluation, ItemFeedback } from '../../engine/types'

/** Embaralhamento determinístico (mesma semente → mesma ordem). */
export function shuffled<T>(items: T[], seed: string): T[] {
  let h = 2166136261
  for (const ch of seed) h = Math.imul(h ^ ch.charCodeAt(0), 16777619)
  const rand = () => {
    h = Math.imul(h ^ (h >>> 15), 2246822507)
    h = Math.imul(h ^ (h >>> 13), 3266489909)
    return ((h ^= h >>> 16) >>> 0) / 4294967296
  }
  const out = [...items]
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1))
    ;[out[i], out[j]] = [out[j], out[i]]
  }
  return out
}

export function statusMap(evaluation: Evaluation | null | undefined): Record<string, ItemFeedback['status']> {
  const out: Record<string, ItemFeedback['status']> = {}
  for (const i of evaluation?.items ?? []) out[i.id] = i.status
  return out
}
