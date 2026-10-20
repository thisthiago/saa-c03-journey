import { describe, expect, it } from 'vitest'
import { ATLAS } from '../../content/modules/storage/phases/final/phase'
import { bestAnswers, evaluateArchitecture, examDomainScores, type ArchConfig } from './model'

const C: ArchConfig = {
  title: 'Relatório',
  dimensions: [
    { id: 'seguranca', label: 'Segurança', examDomain: 'd1' },
    { id: 'custo', label: 'Custo', examDomain: 'd4' },
  ],
  minDimension: 0.5,
  steps: [
    {
      id: 's1',
      title: 'a',
      intro: '',
      questions: [
        { id: 'q1', prompt: 'q1', options: [{ id: 'good', label: 'g', scores: { seguranca: 1, custo: 1 }, consequence: '' }, { id: 'bad', label: 'b', scores: { seguranca: 0, custo: 1 }, consequence: '' }] },
        { id: 'q2', prompt: 'q2', options: [{ id: 'x', label: 'x', scores: { custo: 1 }, consequence: '' }, { id: 'y', label: 'y', scores: { custo: 0.2 }, consequence: '' }] },
      ],
    },
  ],
  rules: [{ id: 'r', when: [['q1', ['good']], ['q2', ['y']]], penalty: { custo: 0.3 }, message: 'conflito' }],
}

describe('arquitetura', () => {
  it('a melhor resposta tira 100%', () => {
    expect(evaluateArchitecture(C, bestAnswers(C)).score).toBe(1)
  })
  it('regras entre etapas penalizam as dimensões indicadas', () => {
    const r = evaluateArchitecture(C, { q1: 'good', q2: 'y' })
    expect(r.risks.map((x) => x.id)).toEqual(['r'])
    expect(r.dimensions.custo).toBeCloseTo((1 + 0.2) / 2 - 0.3, 6)
  })
  it('uma dimensão abaixo do mínimo limita a nota a 69%', () => {
    const r = evaluateArchitecture(C, { q1: 'bad', q2: 'x' })
    expect(r.dimensions.seguranca).toBe(0)
    expect(r.passedDimensions).toBe(false)
    expect(r.score).toBeLessThanOrEqual(0.69)
  })
  it('perguntas sem resposta contam como zero', () => {
    expect(evaluateArchitecture(C, {}).overall).toBeLessThan(1)
  })
  it('notas por domínio do exame vêm das dimensões ligadas a cada domínio', () => {
    const r = evaluateArchitecture(C, { q1: 'bad', q2: 'x' })
    expect(examDomainScores(C, r)).toEqual([
      { domain: 'd1', dimensions: [C.dimensions[0]], score: 0 },
      { domain: 'd4', dimensions: [C.dimensions[1]], score: 1 },
    ])
  })
  it('a generalização das dimensões não mudou a nota do Projeto Atlas', () => {
    // Respostas e notas registradas antes da generalização (18/10/2026).
    const answers = { onde: 's3', buckets: 'um-so', ativos: 'ia', resultados: 'deep', encerrados: 'deep', publico: 'bpa', terceiros: 'presigned', app: 'least', repouso: 'kms-bk', transito: 'allow', recuperacao: 'v-lc', limpeza: 'nada', dr: 'crr-basic', marcadores: 'nao', processamento: 'sqs-prefix', avisos: 'tres', downloads: 'rp', limitacao: 'batch' }
    const r = evaluateArchitecture(ATLAS, answers)
    expect(r.score).toBeCloseTo(0.7201388888888888, 10)
    expect(r.dimensions).toEqual({ seguranca: expect.closeTo(0.8333333333, 8), custo: expect.closeTo(0.7375, 8), durabilidade: expect.closeTo(0.69, 8), disponibilidade: expect.closeTo(0.775, 8), requisitos: expect.closeTo(0.525, 8), qualidade: expect.closeTo(0.76, 8) })
    expect(r.risks.map((x) => x.id)).toEqual(['kms-sem-optin'])
    expect(evaluateArchitecture(ATLAS, bestAnswers(ATLAS)).score).toBe(1)
  })
})
