import { describe, expect, it } from 'vitest'
import { evaluateExamReaderLab, examReaderSolution, type ExamReaderLabConfig } from './lab'
import { answerOf, judge } from './model'

const c: ExamReaderLabConfig = {
  stem: ['Cenário.'],
  question: 'O que fazer?',
  constraints: [
    { id: 'ha', label: 'continuar no ar se uma AZ cair' },
    { id: 'nocode', label: 'não mudar o código' },
  ],
  decisive: { id: 'ops', label: 'menos esforço operacional' },
  alternatives: [
    { id: 'A', text: 'a', meets: ['ha', 'nocode'], rank: 2 },
    { id: 'B', text: 'b', meets: ['ha', 'nocode'], rank: 1 },
    { id: 'C', text: 'c', meets: ['nocode'], rank: 1 },
    { id: 'D', text: 'd', meets: [], rank: 1 },
  ],
}

describe('leitura da questão', () => {
  it('a resposta cumpre tudo e vence no decisivo', () => {
    expect(answerOf(c).id).toBe('B')
    expect(judge(c, c.alternatives[0])).toEqual({ verdict: 'works', reason: 'ops' })
    expect(judge(c, c.alternatives[2])).toEqual({ verdict: 'fails', reason: 'ha' })
  })
  it('empate no decisivo é erro de conteúdo', () => {
    expect(() => answerOf({ ...c, alternatives: c.alternatives.map((a) => ({ ...a, rank: 1 })) })).toThrow()
  })
  it('a solução chega a 100% e o vazio fica em 0', () => {
    expect(evaluateExamReaderLab(c, examReaderSolution(c)).score).toBe(1)
    expect(evaluateExamReaderLab(c, { answers: {} }).score).toBe(0)
  })
})
