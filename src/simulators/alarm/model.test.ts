import { describe, expect, it } from 'vitest'
import { buildSeries, evaluationIntervalMinutes, judgeAlarm, runAlarm, stateFromPoints, type AlarmSettings, type AlarmState, type MissingData, type PointCat } from './model'

const cats = (s: string): PointCat[] => s.split(' ').map((c) => (c === '0' ? 'ok' : c === 'X' ? 'breach' : 'missing'))
const KEEP = 'KEEP'
type Expected = AlarmState | typeof KEEP
const ORDER: MissingData[] = ['missing', 'ignore', 'breaching', 'notBreaching']

// Tabelas de "Configuring how CloudWatch alarms treat missing data" (conferidas em 21/10/2026).
const THREE_OF_THREE: [string, Expected[]][] = [
  ['0 - X - X', ['OK', 'OK', 'OK', 'OK']],
  ['0 - - - -', ['OK', 'OK', 'OK', 'OK']],
  ['- - - - -', ['INSUFFICIENT_DATA', KEEP, 'ALARM', 'OK']],
  ['0 X X - X', ['ALARM', 'ALARM', 'ALARM', 'ALARM']],
  ['- - X - -', ['ALARM', KEEP, 'ALARM', 'OK']],
]
const TWO_OF_THREE: [string, Expected[]][] = [
  ['0 - X - X', ['ALARM', 'ALARM', 'ALARM', 'ALARM']],
  ['0 0 X 0 X', ['ALARM', 'ALARM', 'ALARM', 'ALARM']],
  ['0 - X - -', ['OK', 'OK', 'ALARM', 'OK']],
  ['- - - - 0', ['OK', 'OK', 'ALARM', 'OK']],
  ['- - - X -', ['ALARM', KEEP, 'ALARM', 'OK']],
]

describe('alarme do CloudWatch: exemplos da documentação', () => {
  for (const [name, table, m] of [
    ['3 de 3', THREE_OF_THREE, 3],
    ['2 de 3', TWO_OF_THREE, 2],
  ] as const) {
    it(`reproduz a tabela de ${name} para os quatro tratamentos de dados ausentes`, () => {
      for (const [row, expected] of table) {
        ORDER.forEach((missing, i) => {
          for (const prev of ['OK', 'ALARM'] as const) {
            const want = expected[i] === KEEP ? prev : expected[i]
            expect(stateFromPoints(cats(row), 3, m, missing, prev), `${name}: ${row} com ${missing} (estado anterior ${prev})`).toBe(want)
          }
        })
      }
    })
  }

  it('não dispara de imediato com "- - - - X" (alarme prematuro evitado)', () => {
    expect(stateFromPoints(cats('- - - - X'), 3, 3, 'missing', 'OK')).toBe('OK')
  })

  it('M de N: 4 de 5 com período de 1 minuto avalia 5 minutos; 3 de 3 com 10 minutos avalia 30', () => {
    const base = { statistic: 'average', threshold: 0, missing: 'missing' } as const
    expect(evaluationIntervalMinutes({ ...base, evaluationPeriods: 5, periodMinutes: 1 })).toBe(5)
    expect(evaluationIntervalMinutes({ ...base, evaluationPeriods: 3, periodMinutes: 10 })).toBe(30)
  })
})

describe('execução do alarme sobre uma série', () => {
  const s: AlarmSettings = { statistic: 'average', periodMinutes: 5, threshold: 80, evaluationPeriods: 3, datapointsToAlarm: 3, missing: 'missing' }

  it('começa em INSUFFICIENT_DATA e só avalia depois de N períodos', () => {
    const run = runAlarm(buildSeries({ length: 60, base: 30, jitter: 0, seed: 1 }), '>', s)
    expect(run.points.slice(0, 2).every((p) => p.state === 'INSUFFICIENT_DATA')).toBe(true)
    expect(run.points[2].state).toBe('OK')
  })

  it('3 de 3 ignora um pico curto e dispara no problema sustentado', () => {
    const series = buildSeries({ length: 120, base: 30, jitter: 0, seed: 1, segments: [{ from: 20, to: 24, value: 99 }, { from: 70, to: 100, value: 95 }] })
    const run = runAlarm(series, '>', s)
    const alarms = run.points.filter((p) => p.state === 'ALARM').map((p) => p.minute)
    expect(alarms.every((m) => m > 70)).toBe(true)
    expect(alarms.length).toBeGreaterThan(0)
    expect(run.transitions.at(0)?.to).toBe('OK')
  })

  it('1 de 1 com período de 1 minuto dispara no pico curto', () => {
    const series = buildSeries({ length: 60, base: 30, jitter: 0, seed: 1, segments: [{ from: 20, to: 22, value: 99 }] })
    const run = runAlarm(series, '>', { ...s, periodMinutes: 1, evaluationPeriods: 1, datapointsToAlarm: 1 })
    expect(run.points.some((p) => p.state === 'ALARM' && p.minute <= 22)).toBe(true)
  })

  it('a série é determinística e respeita lacunas', () => {
    const spec = { length: 30, base: 50, jitter: 5, seed: 7, gaps: [{ from: 10, to: 15 }] }
    expect(buildSeries(spec)).toEqual(buildSeries(spec))
    expect(buildSeries(spec).slice(10, 15).every((v) => v === null)).toBe(true)
  })
})

describe('julgamento do cenário', () => {
  const j = { incident: { from: 70, to: 100 }, maxDelay: 15, recovery: 15 }
  const series = buildSeries({ length: 140, base: 30, jitter: 0, seed: 1, segments: [{ from: 20, to: 23, value: 99 }, { from: 70, to: 100, value: 95 }] })
  const s: AlarmSettings = { statistic: 'average', periodMinutes: 5, threshold: 80, evaluationPeriods: 3, datapointsToAlarm: 3, missing: 'missing' }

  it('vale 1 sem alarme falso e dentro do atraso aceito', () => {
    expect(judgeAlarm(runAlarm(series, '>', s), j).score).toBe(1)
  })
  it('vale 0,5 com alarme falso e 0 se não avisa do problema', () => {
    expect(judgeAlarm(runAlarm(series, '>', { ...s, periodMinutes: 1, evaluationPeriods: 1, datapointsToAlarm: 1 }), j).score).toBe(0.5)
    expect(judgeAlarm(runAlarm(series, '>', { ...s, threshold: 99 }), j).score).toBe(0)
  })
})
