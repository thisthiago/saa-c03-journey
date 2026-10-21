/** Laboratório de alarmes do CloudWatch: configurar período, limite, "M de N" e dados ausentes para avisar só do problema real. */
import type { ItemFeedback } from '../../engine/types'
import { buildSeries, judgeAlarm, runAlarm, type AlarmSettings, type JudgeSpec, type MissingData, type Operator, type SeriesSpec, type Statistic } from './model'

export interface AlarmScenario {
  id: string
  name: string
  description: string
  /** Métrica monitorada, com namespace e unidade (ex.: "AWS/EC2 · CPUUtilization (%)"). */
  metric: string
  operator: Operator
  series: SeriesSpec
  judge: JudgeSpec
  /** O que o alarme precisa fazer, em tópicos. */
  goals: string[]
  statistics: Statistic[]
  /** Períodos aceitos, em minutos. */
  periods: number[]
  thresholds: number[]
  concepts?: string[]
}

export interface AlarmLabConfig {
  scenarios: AlarmScenario[]
}

export interface AlarmLabResponse {
  settings: Record<string, AlarmSettings | undefined>
}

const MISSING: MissingData[] = ['missing', 'notBreaching', 'breaching', 'ignore']
export const MAX_EVALUATION_PERIODS = 6

/** Ponto de partida: um alarme sensível demais, que reage ao primeiro ponto. */
export const initialSettings = (s: AlarmScenario): AlarmSettings => ({
  statistic: s.statistics[0],
  periodMinutes: s.periods[0],
  threshold: s.thresholds[0],
  evaluationPeriods: 1,
  datapointsToAlarm: 1,
  missing: 'missing',
})

export const alarmLabInitial = (c: AlarmLabConfig): AlarmLabResponse => ({ settings: Object.fromEntries(c.scenarios.map((s) => [s.id, initialSettings(s)])) })

export function judgeScenario(s: AlarmScenario, settings: AlarmSettings | undefined) {
  const series = buildSeries(s.series)
  const run = runAlarm(series, s.operator, settings ?? initialSettings(s))
  return { series, run, verdict: judgeAlarm(run, s.judge) }
}

/** Primeira configuração que cumpre tudo (a busca é determinística e começa pelas mais simples). */
export function findSolution(s: AlarmScenario): AlarmSettings {
  for (let n = 1; n <= MAX_EVALUATION_PERIODS; n++) {
    for (const periodMinutes of s.periods) {
      for (const statistic of s.statistics) {
        for (const threshold of s.thresholds) {
          for (let m = 1; m <= n; m++) {
            for (const missing of MISSING) {
              const settings: AlarmSettings = { statistic, periodMinutes, threshold, evaluationPeriods: n, datapointsToAlarm: m, missing }
              if (judgeScenario(s, settings).verdict.score === 1) return settings
            }
          }
        }
      }
    }
  }
  throw new Error(`Cenário ${s.id}: nenhuma configuração cumpre os objetivos`)
}

export const alarmLabSolution = (c: AlarmLabConfig): AlarmLabResponse => ({ settings: Object.fromEntries(c.scenarios.map((s) => [s.id, findSolution(s)])) })

export function evaluateAlarmLab(c: AlarmLabConfig, r: AlarmLabResponse) {
  const items = c.scenarios.map((s) => {
    const { verdict } = judgeScenario(s, r.settings?.[s.id])
    return { concepts: s.concepts, score: verdict.score, fb: { id: s.id, label: s.name, status: verdict.status, message: verdict.message } as ItemFeedback }
  })
  return { score: items.reduce((sum, x) => sum + x.score, 0) / Math.max(1, items.length), items }
}
