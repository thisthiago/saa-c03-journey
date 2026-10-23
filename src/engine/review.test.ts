import { describe, expect, it } from 'vitest'
import { registry } from '../content'
import { createInitialProgress } from './progress'
import { buildReviewSession, sessionSizeOptions } from './review'

const NOW = new Date('2026-10-22T15:00:00Z')

describe('sessionSizeOptions', () => {
  it('oferece 5, 8, 12 e 16 quando há bastante para revisar', () => {
    expect(sessionSizeOptions(30)).toEqual([5, 8, 12, 16])
  })

  it('corta nas opções que cabem e termina em "todos"', () => {
    expect(sessionSizeOptions(10)).toEqual([5, 8, 10])
    expect(sessionSizeOptions(12)).toEqual([5, 8, 12])
    expect(sessionSizeOptions(3)).toEqual([3])
    expect(sessionSizeOptions(0)).toEqual([])
  })
})

describe('buildReviewSession', () => {
  it('respeita o tamanho escolhido', () => {
    const s = createInitialProgress(NOW)
    for (const id of [...registry.reviewItems.keys()].slice(0, 20)) {
      s.concepts[id] = { mastery: 0.3, evidence: 1, box: 0, nextReviewAt: '2026-10-20T10:00:00Z', lastSeenAt: '2026-10-20T10:00:00Z', recentErrors: 0 }
    }
    expect(buildReviewSession(s, registry, NOW, 12)).toHaveLength(12)
    expect(buildReviewSession(s, registry, NOW, 16)).toHaveLength(16)
    // Sem limite, entra tudo o que há (itens repetidos entre conceitos entram uma vez só).
    expect(buildReviewSession(s, registry, NOW, Infinity).length).toBeGreaterThan(16)
  })
})
