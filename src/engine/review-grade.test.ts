import { describe, expect, it } from 'vitest'
import { gradeLabel, itemPoints, paceFactor, sessionGrade } from './review-grade'

describe('nota da rodada de revisão', () => {
  it('acertar tudo com certeza e no ritmo da prova vale 10', () => {
    const g = sessionGrade(Array.from({ length: 5 }, () => ({ score: 1, confidence: 'certeza' as const, seconds: 60 })))
    expect(g.grade).toBe(10)
    expect(g.label).toBe('Excelente')
    expect(g.slow).toBe(0)
  })

  it('a confiança pesa: acerto no chute vale metade, erro com certeza vale zero', () => {
    expect(itemPoints({ score: 1, confidence: 'certeza' })).toBe(1)
    expect(itemPoints({ score: 1, confidence: 'duvida' })).toBe(0.75)
    expect(itemPoints({ score: 1, confidence: 'chute' })).toBe(0.5)
    expect(itemPoints({ score: 0, confidence: 'chute' })).toBe(0.2)
    expect(itemPoints({ score: 0, confidence: 'certeza' })).toBe(0)
  })

  it('o ritmo só reduz acima de 2 minutos, até 70% do valor a partir de 5 minutos', () => {
    expect(paceFactor(120)).toBe(1)
    expect(paceFactor(210)).toBeCloseTo(0.85)
    expect(paceFactor(900)).toBe(0.7)
    expect(itemPoints({ score: 1, confidence: 'certeza', seconds: 300 })).toBeCloseTo(0.7)
  })

  it('combina acertos, erros, confiança e ritmo numa nota com uma casa decimal', () => {
    const g = sessionGrade([
      { score: 1, confidence: 'certeza', seconds: 40 },
      { score: 1, confidence: 'duvida', seconds: 80 },
      { score: 0, confidence: 'certeza', seconds: 30 },
      { score: 1, confidence: 'chute', seconds: 210 },
    ])
    // (1 + 0,75 + 0 + 0,5 × 0,85) / 4 × 10 = 5,4
    expect(g.grade).toBe(5.4)
    expect(g.label).toBe('Regular')
    expect(g.counts).toEqual({ sure: 1, doubt: 1, guess: 1, wrong: 1, wrongSure: 1 })
    expect(g.averageSeconds).toBe(90)
    expect(g.slow).toBe(1)
  })

  it('rodada vazia vale zero e as faixas seguem a nota', () => {
    expect(sessionGrade([]).grade).toBe(0)
    expect([9, 7, 5, 4.9].map(gradeLabel)).toEqual(['Excelente', 'Bom', 'Regular', 'Precisa revisar'])
  })
})
