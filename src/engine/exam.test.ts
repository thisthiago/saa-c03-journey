import { describe, expect, it } from 'vitest'
import { bankStats, filterQuestions, isQuestionCorrect, practiceOrder, questionStatus, SECONDS_PER_QUESTION, simuladoSample, summarizeAttempt } from './exam'
import { moduleA } from './fixtures'
import { migrate } from './persistence'
import { createInitialProgress, SIMULADO_HISTORY_LIMIT, submitExam } from './progress'
import { createRegistry, validateRegistry } from './registry'
import type { ContentModule, ExamQuestion } from './types'

const T0 = new Date('2026-10-19T12:00:00Z')

function question(id: string, concept: string, difficulty: 1 | 2 | 3, domain: 'd1' | 'd4', correct: string[] = ['a']): ExamQuestion {
  const ids = correct.length > 1 ? ['a', 'b', 'c', 'd', 'e'] : ['a', 'b', 'c', 'd']
  return {
    id,
    concept,
    difficulty,
    domain,
    stem: ['Cenário.'],
    question: 'Pergunta?',
    options: ids.map((o) => ({ id: o, text: o, correct: correct.includes(o), why: 'Porque sim.' })),
    explanation: ['Explicação.'],
  }
}

const bank: ContentModule = {
  ...moduleA,
  questions: [question('q1', 'c1', 1, 'd1'), question('q2', 'c1', 3, 'd1', ['a', 'c']), question('q3', 'c2', 2, 'd4')],
}
const reg = createRegistry({
  modules: [bank],
  territories: [{ id: 'ter', title: 'Território', summary: '', glyph: 'bucket', status: 'active' }],
  examDomains: [
    { id: 'd1', officialName: 'Secure', title: 'Seguras', weight: 0.3 },
    { id: 'd4', officialName: 'Cost', title: 'Custo', weight: 0.2 },
  ],
  levelTitles: ['Aprendiz', 'Cadete'],
})
const q = (id: string) => reg.questions.get(id)!.question

describe('banco de questões', () => {
  it('registra as questões com a trilha do módulo e valida o formato do exame', () => {
    expect(validateRegistry(reg)).toEqual([])
    expect(reg.questions.get('q1')?.track?.id).toBe('track-a')
    const broken = createRegistry({
      modules: [{ ...moduleA, questions: [{ ...question('qx', 'nada', 1, 'd1'), options: question('qx', 'c1', 1, 'd1').options.slice(0, 3) }, { ...question('qy', 'c1', 1, 'd1', ['a', 'b']), options: question('qy', 'c1', 1, 'd1', ['a', 'b']).options.slice(0, 4) }] }],
      territories: [{ id: 'ter', title: 'T', summary: '', glyph: 'bucket', status: 'active' }],
      examDomains: [{ id: 'd1', officialName: 'Secure', title: 'Seguras', weight: 0.3 }],
      levelTitles: ['A'],
    })
    const errors = validateRegistry(broken)
    expect(errors).toContain('Questão qx: conceito inexistente nada')
    expect(errors).toContain('Questão qx: múltipla escolha precisa de 4 opções')
    expect(errors).toEqual(expect.arrayContaining([expect.stringContaining('Questão qy:')]))
  })

  it('corrige tudo ou nada, inclusive em resposta múltipla', () => {
    expect(isQuestionCorrect(q('q1'), ['a'])).toBe(true)
    expect(isQuestionCorrect(q('q1'), ['b'])).toBe(false)
    expect(isQuestionCorrect(q('q1'), [])).toBe(false)
    expect(isQuestionCorrect(q('q2'), ['c', 'a'])).toBe(true)
    expect(isQuestionCorrect(q('q2'), ['a'])).toBe(false)
    expect(isQuestionCorrect(q('q2'), ['a', 'c', 'd'])).toBe(false)
  })

  it('filtra por trilha, conceito, dificuldade, domínio e situação', () => {
    const p = createInitialProgress(T0)
    const ids = (f: Parameters<typeof filterQuestions>[2]) => filterQuestions(reg, p, f).map((r) => r.question.id)
    expect(ids({})).toEqual(['q1', 'q2', 'q3'])
    expect(ids({ track: 'track-a', concept: 'c1' })).toEqual(['q1', 'q2'])
    expect(ids({ difficulty: 3 })).toEqual(['q2'])
    expect(ids({ domain: 'd4' })).toEqual(['q3'])
    expect(ids({ track: 'outra' })).toEqual([])
    const after = submitExam(p, reg, { answers: [{ questionId: 'q1', selected: ['b'] }, { questionId: 'q3', selected: ['a'] }], now: T0 }).state
    expect(filterQuestions(reg, after, { status: 'errou' }).map((r) => r.question.id)).toEqual(['q1'])
    expect(filterQuestions(reg, after, { status: 'nova' }).map((r) => r.question.id)).toEqual(['q2'])
    expect(questionStatus(after, 'q3')).toBe('acertou')
  })

  it('no treino, as erradas vêm antes das novas, e as novas antes das acertadas', () => {
    const p = submitExam(createInitialProgress(T0), reg, { answers: [{ questionId: 'q3', selected: ['b'] }, { questionId: 'q1', selected: ['a'] }], now: T0 }).state
    const order = practiceOrder([...reg.questions.values()], p, 'semente').map((r) => r.question.id)
    expect(order).toEqual(['q3', 'q2', 'q1'])
  })

  it('o simulado sorteia sem repetir e respeita a quantidade', () => {
    const all = [...reg.questions.values()]
    const sample = simuladoSample(all, 2, 'x')
    expect(sample).toHaveLength(2)
    expect(new Set(sample.map((r) => r.question.id)).size).toBe(2)
    expect(simuladoSample(all, 10, 'x')).toHaveLength(3)
    expect(SECONDS_PER_QUESTION).toBe(120)
  })

  it('resume por domínio, dificuldade e conceitos errados, contando sem resposta como erro', () => {
    const s = summarizeAttempt([
      { question: q('q1'), selected: ['a'] },
      { question: q('q2'), selected: [] },
      { question: q('q3'), selected: ['c'] },
    ])
    expect(s).toMatchObject({ total: 3, correct: 1, unanswered: 1 })
    expect(s.byDomain).toEqual([
      { domain: 'd1', total: 2, correct: 1 },
      { domain: 'd4', total: 1, correct: 0 },
    ])
    expect(s.byDifficulty.map((d) => d.difficulty)).toEqual([1, 2, 3])
    expect(s.weakConcepts).toEqual([
      { conceptId: 'c1', wrong: 1, total: 2 },
      { conceptId: 'c2', wrong: 1, total: 1 },
    ])
  })
})

describe('respostas no progresso', () => {
  it('atualiza o domínio dos conceitos sem conceder XP', () => {
    const p0 = createInitialProgress(T0)
    const { state } = submitExam(p0, reg, { answers: [{ questionId: 'q1', selected: ['a'] }, { questionId: 'q3', selected: ['b'] }], now: T0 })
    expect(state.xp).toBe(0)
    expect(state.ledger).toEqual([])
    expect(state.concepts.c1.mastery).toBeGreaterThan(0.2)
    expect(state.concepts.c2.recentErrors).toBe(1)
    expect(state.exam.questions.q1).toEqual({ attempts: 1, correct: 1, lastCorrect: true, lastAt: T0.toISOString() })
    expect(state.stats.activeDays).toEqual(['2026-10-19'])
    expect(p0.exam.questions).toEqual({})
  })

  it('guarda o histórico de simulados com limite', () => {
    let p = createInitialProgress(T0)
    for (let i = 0; i < SIMULADO_HISTORY_LIMIT + 2; i++) {
      p = submitExam(p, reg, { answers: [{ questionId: 'q1', selected: ['a'] }, { questionId: 'q2', selected: [] }], now: T0, simulado: { seconds: 90.4, timed: true } }).state
    }
    expect(p.exam.simulados).toHaveLength(SIMULADO_HISTORY_LIMIT)
    expect(p.exam.simulados.at(-1)).toEqual({ at: T0.toISOString(), total: 2, correct: 1, seconds: 90, timed: true })
    expect(p.exam.questions.q2.attempts).toBe(SIMULADO_HISTORY_LIMIT + 2)
    expect(bankStats(reg, p)).toEqual({ total: 3, answered: 2, rightNow: 1, wrongNow: 1 })
  })

  it('recusa questão desconhecida', () => {
    expect(() => submitExam(createInitialProgress(T0), reg, { answers: [{ questionId: 'nada', selected: [] }], now: T0 })).toThrow('Questão desconhecida')
  })

  it('progresso salvo antes do banco de questões ganha o campo vazio ao carregar', () => {
    const old = createInitialProgress(T0) as Partial<ReturnType<typeof createInitialProgress>>
    delete old.exam
    expect(migrate(JSON.parse(JSON.stringify(old)))?.exam).toEqual({ questions: {}, simulados: [] })
  })
})
