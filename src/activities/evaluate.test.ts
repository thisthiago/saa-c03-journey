import { describe, expect, it } from 'vitest'
import { evaluateActivity, longestIncreasingSubsequence, referenceResponse } from './evaluate'
import type { ClassifyActivity, DecisionActivity, EstimateActivity, InvestigateActivity, MatchActivity, OrderActivity, PredictActivity } from './types'

const base = { title: 't', prompt: 'p', xp: 30, difficulty: 1 as const, explanation: ['e'] }

const decision: DecisionActivity = {
  ...base,
  id: 'd',
  kind: 'decision',
  concepts: [{ id: 'c' }],
  options: [
    { id: 'a', text: 'A', correct: true, consequence: 'ok' },
    { id: 'b', text: 'B', correct: false, consequence: 'ruim' },
  ],
  justification: {
    prompt: 'Por quê?',
    options: [
      { id: 'j1', text: 'J1', correct: true, feedback: 'isso' },
      { id: 'j2', text: 'J2', correct: false, feedback: 'não' },
    ],
  },
}

describe('decision', () => {
  it('pontua escolha e justificativa', () => {
    expect(evaluateActivity(decision, { selected: ['a'], justification: 'j1' }).score).toBe(1)
    expect(evaluateActivity(decision, { selected: ['a'], justification: 'j2' }).score).toBe(0.7)
    expect(evaluateActivity(decision, { selected: ['b'], justification: 'j1' }).score).toBe(0)
  })
  it('dá crédito parcial em múltipla escolha e penaliza erradas', () => {
    const multi: DecisionActivity = {
      ...decision,
      justification: undefined,
      multiple: true,
      options: [
        { id: 'a', text: 'A', correct: true, consequence: '' },
        { id: 'b', text: 'B', correct: true, consequence: '' },
        { id: 'c', text: 'C', correct: false, consequence: '' },
      ],
    }
    expect(evaluateActivity(multi, { selected: ['a'] }).score).toBe(0.5)
    expect(evaluateActivity(multi, { selected: ['a', 'b'] }).score).toBe(1)
    expect(evaluateActivity(multi, { selected: ['a', 'c'] }).score).toBe(0)
  })
})

describe('classify e match', () => {
  const classify: ClassifyActivity = {
    ...base,
    id: 'cl',
    kind: 'classify',
    concepts: [{ id: 'x' }, { id: 'y' }],
    bins: [
      { id: 'b1', label: 'B1' },
      { id: 'b2', label: 'B2' },
    ],
    items: [
      { id: 'i1', text: 'I1', bin: 'b1', explanation: '', concepts: ['x'] },
      { id: 'i2', text: 'I2', bin: 'b2', explanation: '', concepts: ['y'] },
    ],
  }
  it('calcula fração e domínio por conceito', () => {
    const e = evaluateActivity(classify, { placements: { i1: 'b1', i2: 'b1' } })
    expect(e.score).toBe(0.5)
    expect(e.conceptOutcomes).toEqual({ x: 1, y: 0 })
    expect(e.items.map((i) => i.status)).toEqual(['correct', 'wrong'])
  })
  it('associa pares 1:1', () => {
    const match: MatchActivity = {
      ...base,
      id: 'm',
      kind: 'match',
      concepts: [{ id: 'x' }],
      leftLabel: 'L',
      rightLabel: 'R',
      pairs: [
        { id: 'p1', left: 'a', right: '1', explanation: '' },
        { id: 'p2', left: 'b', right: '2', explanation: '' },
      ],
    }
    expect(evaluateActivity(match, { placements: { p1: 'p2', p2: 'p1' } }).score).toBe(0)
    expect(evaluateActivity(match, referenceResponse(match)).score).toBe(1)
  })
})

describe('order', () => {
  const order: OrderActivity = {
    ...base,
    id: 'o',
    kind: 'order',
    concepts: [{ id: 'x' }],
    steps: ['a', 'b', 'c', 'd'].map((id) => ({ id, text: id, explanation: '' })),
  }
  it('usa a maior subsequência em ordem', () => {
    expect(longestIncreasingSubsequence([3, 0, 1, 2])).toBe(3)
    expect(evaluateActivity(order, { order: ['a', 'b', 'c', 'd'] }).score).toBe(1)
    expect(evaluateActivity(order, { order: ['d', 'a', 'b', 'c'] }).score).toBeCloseTo(0.667, 2)
    expect(evaluateActivity(order, { order: ['d', 'c', 'b', 'a'] }).score).toBe(0)
  })
})

describe('estimate', () => {
  const est: EstimateActivity = { ...base, id: 'e', kind: 'estimate', concepts: [{ id: 'x' }], unit: 'dias', min: 0, max: 100, step: 1, answer: 10, tolerance: 0.2 }
  it('dá crédito total, parcial ou nenhum conforme a tolerância', () => {
    expect(evaluateActivity(est, { value: 11 }).score).toBe(1)
    expect(evaluateActivity(est, { value: 13 }).score).toBe(0.5)
    expect(evaluateActivity(est, { value: 20 }).score).toBe(0)
  })
})

describe('predict', () => {
  const p: PredictActivity = {
    ...base,
    id: 'p',
    kind: 'predict',
    concepts: [{ id: 'x' }],
    spec: {
      sim: 'bucket-list',
      prefix: 'fotos/',
      delimiter: '/',
      measure: 'prefixes',
      bucket: {
        name: 'b',
        region: 'sa-east-1',
        accountId: '111122223333',
        objects: ['fotos/2025/a.jpg', 'fotos/2026/b.jpg', 'fotos/c.jpg'].map((key) => ({ key, sizeBytes: 1, contentType: 'image/jpeg', lastModified: '', etag: '', storageClass: 'STANDARD' as const })),
      },
    },
    options: [
      { id: 'o1', text: '1', outcome: '1' },
      { id: 'o2', text: '2', outcome: '2' },
      { id: 'o3', text: '3', outcome: '3' },
    ],
  }
  it('compara a previsão com o resultado calculado pelo simulador', () => {
    expect(evaluateActivity(p, { option: 'o2' }).score).toBe(1)
    expect(evaluateActivity(p, { option: 'o3' }).score).toBe(0)
    expect(referenceResponse(p)).toEqual({ option: 'o2' })
  })
})

describe('investigate', () => {
  const inv: InvestigateActivity = {
    ...base,
    id: 'i',
    kind: 'investigate',
    concepts: [{ id: 'x' }],
    artifacts: [
      {
        id: 'a',
        title: 'policy',
        format: 'code',
        lines: [
          { id: 'l1', text: '"Principal": "*"', isIssue: true, explanation: '' },
          { id: 'l2', text: '"Effect": "Allow"', isIssue: false, explanation: '' },
        ],
      },
    ],
    rootCause: { prompt: '', options: [{ id: 'r1', text: '', correct: true, feedback: '' }, { id: 'r2', text: '', correct: false, feedback: '' }] },
    remediations: { prompt: '', options: [{ id: 'f1', text: '', correct: true, feedback: '' }, { id: 'f2', text: '', correct: false, feedback: '' }] },
  }
  it('combina evidências, causa e correções', () => {
    expect(evaluateActivity(inv, referenceResponse(inv)).score).toBe(1)
    expect(evaluateActivity(inv, { flagged: ['l1', 'l2'], rootCause: 'r1', remediations: ['f1'] }).score).toBeCloseTo(0.4 * (2 / 3) + 0.6, 2)
    expect(evaluateActivity(inv, { flagged: [], remediations: [] }).score).toBe(0)
  })
})
