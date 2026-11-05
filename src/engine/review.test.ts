import { describe, expect, it } from 'vitest'
import { registry } from '../content'
import { createInitialProgress } from './progress'
import { buildPracticeSession, buildReviewSession, DAILY_REVIEW_LIMIT, dailyReviewLeft, dueCount, sessionSizeOptions } from './review'
import type { ConceptProgress } from './types'

const NOW = new Date('2026-10-22T15:00:00Z')
const fragile = (): ConceptProgress => ({ mastery: 0.3, evidence: 1, box: 0, nextReviewAt: '2026-10-20T10:00:00Z', lastSeenAt: '2026-10-20T10:00:00Z', recentErrors: 0 })

/** Primeiro conceito de cada fase: questões de fases diferentes nunca são a mesma. */
function onePerPhase(): string[] {
  const seen = new Set<string>()
  const out: string[] = []
  for (const [conceptId, phaseId] of registry.conceptPhase) {
    if (seen.has(phaseId) || !registry.reviewItems.get(conceptId)?.length) continue
    seen.add(phaseId)
    out.push(conceptId)
  }
  return out
}

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

  it('com teto maior, "todos" chega ao limite do dia', () => {
    expect(sessionSizeOptions(30, 30)).toEqual([5, 8, 12, 16, 30])
    expect(sessionSizeOptions(80, 30)).toEqual([5, 8, 12, 16, 30])
    expect(sessionSizeOptions(10, 30)).toEqual([5, 8, 10])
  })
})

describe('limite diário da Revisão', () => {
  const crowded = () => {
    const s = createInitialProgress(NOW)
    for (const id of [...registry.reviewItems.keys()].slice(0, 50)) s.concepts[id] = fragile()
    return s
  }

  it('conta no máximo 30 itens por dia', () => {
    expect(dueCount(crowded(), registry, NOW)).toBe(DAILY_REVIEW_LIMIT)
  })

  it('desconta o que já foi respondido hoje e zera no dia seguinte', () => {
    const s = crowded()
    s.reviews.today = { day: '2026-10-22', answered: 26 }
    expect(dailyReviewLeft(s, NOW)).toBe(4)
    expect(dueCount(s, registry, NOW)).toBe(4)
    s.reviews.today = { day: '2026-10-22', answered: 30 }
    expect(dueCount(s, registry, NOW)).toBe(0)
    expect(dailyReviewLeft(s, new Date('2026-10-23T15:00:00Z'))).toBe(DAILY_REVIEW_LIMIT)
  })
})

describe('buildReviewSession', () => {
  it('respeita o tamanho escolhido', () => {
    const s = createInitialProgress(NOW)
    for (const id of onePerPhase().slice(0, 20)) s.concepts[id] = fragile()
    expect(buildReviewSession(s, registry, NOW, 12)).toHaveLength(12)
    expect(buildReviewSession(s, registry, NOW, 16)).toHaveLength(16)
    // Sem limite, entra tudo o que há (itens repetidos entre conceitos entram uma vez só).
    expect(buildReviewSession(s, registry, NOW, Infinity).length).toBeGreaterThan(16)
  })
})

describe('rodadas sem questão repetida', () => {
  // Uma questão pode avaliar vários conceitos da fase; ela entra uma vez só na rodada.
  const everything = () => {
    const s = createInitialProgress(NOW)
    for (const id of registry.reviewItems.keys()) s.concepts[id] = fragile()
    return s
  }

  it('na revisão do dia', () => {
    const session = buildReviewSession(everything(), registry, NOW, Infinity)
    expect(new Set(session.map((e) => e.item.id)).size).toBe(session.length)
  })

  it('no treino livre', () => {
    const session = buildPracticeSession(everything(), registry, Infinity)
    expect(session.length).toBeGreaterThan(16)
    expect(new Set(session.map((e) => e.item.id)).size).toBe(session.length)
  })
})
