/**
 * Alarme do CloudWatch sobre uma série de pontos: período, estatística,
 * limite, avaliação "M de N" e tratamento de dados ausentes.
 *
 * Fatos conferidos em 21/10/2026:
 * - Estados do alarme (OK, ALARM, INSUFFICIENT_DATA), período, períodos de avaliação ("N"), pontos que disparam o alarme ("M") e intervalo de avaliação = N × período: https://docs.aws.amazon.com/AmazonCloudWatch/latest/monitoring/alarm-evaluation.html
 * - Tratamento de dados ausentes (notBreaching, breaching, ignore e missing; padrão missing), intervalo de avaliação com pontos a mais e alarme prematuro: https://docs.aws.amazon.com/AmazonCloudWatch/latest/monitoring/alarms-and-missing-data.html
 * - Resolução padrão e de alta resolução, retenção das métricas: https://docs.aws.amazon.com/AmazonCloudWatch/latest/monitoring/cloudwatch_concepts.html
 * - Preço de alarmes padrão e de alta resolução: https://pricing.us-east-1.amazonaws.com/offers/v1.0/aws/AmazonCloudWatch/current/us-east-1/index.json
 *
 * Premissas do simulador (declaradas na interface):
 * - O alarme é avaliado no fim de cada período, e não a cada minuto como na AWS.
 * - O intervalo de avaliação (pontos buscados quando há ausentes) é N + 2, como nos exemplos da documentação (N = 3, intervalo de 5).
 * - Os casos que a documentação não descreve (por exemplo, "- - - - X") mantêm o estado anterior.
 */

export type AlarmState = 'OK' | 'ALARM' | 'INSUFFICIENT_DATA'
export type MissingData = 'missing' | 'notBreaching' | 'breaching' | 'ignore'
export type Statistic = 'average' | 'maximum' | 'sum'
export type Operator = '>' | '<'

/** Categoria de um ponto de dados do alarme: dentro do limite (`ok`), violando (`breach`) ou ausente (`missing`). */
export type PointCat = 'ok' | 'breach' | 'missing'

export const STATE_LABEL: Record<AlarmState, string> = { OK: 'OK', ALARM: 'ALARM', INSUFFICIENT_DATA: 'INSUFFICIENT_DATA' }

export const MISSING_LABEL: Record<MissingData, string> = {
  missing: 'missing (padrão): sem dados suficientes',
  notBreaching: 'notBreaching: ausente conta como bom',
  breaching: 'breaching: ausente conta como ruim',
  ignore: 'ignore: mantém o estado atual',
}

export const STATISTIC_LABEL: Record<Statistic, string> = { average: 'Média', maximum: 'Máximo', sum: 'Soma' }

export interface AlarmSettings {
  statistic: Statistic
  /** Duração de cada ponto do alarme, em minutos. */
  periodMinutes: number
  threshold: number
  /** "N": quantos pontos mais recentes são avaliados. */
  evaluationPeriods: number
  /** "M": quantos desses pontos precisam violar o limite para disparar o alarme. */
  datapointsToAlarm: number
  missing: MissingData
}

/** Pontos a mais, além de N, que o alarme busca quando há pontos ausentes (premissa: N + 2, como na documentação). */
export const evaluationRange = (n: number): number => n + 2

/**
 * Estado do alarme a partir dos pontos mais recentes (do mais antigo para o mais novo).
 * Reproduz os exemplos da documentação (3 de 3 e 2 de 3, intervalo de avaliação 5).
 */
export function stateFromPoints(points: PointCat[], n: number, m: number, missing: MissingData, prev: AlarmState): AlarmState {
  const range = points.slice(-evaluationRange(n))
  const last = range.slice(-n)
  const breachCount = (xs: PointCat[]) => xs.filter((p) => p === 'breach').length
  // Sem ausentes entre os N mais recentes, só eles contam.
  if (last.length === n && last.every((p) => p !== 'missing')) return breachCount(last) >= m ? 'ALARM' : 'OK'
  // Ausentes entre os N mais recentes, mas pontos reais suficientes no intervalo: os N reais mais recentes decidem.
  const real = range.filter((p) => p !== 'missing')
  if (real.length >= n) return breachCount(real.slice(-n)) >= m ? 'ALARM' : 'OK'
  // Menos pontos reais do que N: os que faltam seguem o tratamento escolhido.
  const breaching = breachCount(real)
  if (missing === 'breaching') return breaching + (n - real.length) >= m ? 'ALARM' : 'OK'
  if (missing === 'notBreaching') return breaching >= m ? 'ALARM' : 'OK'
  if (real.length === 0) return missing === 'missing' ? 'INSUFFICIENT_DATA' : prev
  if (breaching >= m) return 'ALARM'
  if (real.some((p) => p === 'ok')) return 'OK'
  // Todos os pontos reais violam, mas são poucos. Com "missing", o alarme dispara se o mais antigo já tem
  // pelo menos M posições de idade (alarme prematuro evitado só para pontos mais novos).
  if (missing === 'missing') {
    const firstReal = range.findIndex((p) => p !== 'missing')
    const age = range.length - firstReal
    if (age >= m) return 'ALARM'
  }
  return prev
}

// ---------------------------------------------------------------------------
// Série de métrica
// ---------------------------------------------------------------------------

export interface SeriesSegment {
  from: number
  to: number
  value: number
  jitter?: number
}

/** Série de um ponto por minuto, gerada de forma determinística (premissa do cenário). */
export interface SeriesSpec {
  length: number
  base: number
  jitter: number
  seed: number
  /** Trechos com outro valor (picos, incidentes). */
  segments?: SeriesSegment[]
  /** Minutos sem nenhum dado. */
  gaps?: { from: number; to: number }[]
  /** Métrica publicada só quando algo acontece: só estes minutos (e os dos trechos) têm dados. */
  sparse?: number[]
}

function rng(seed: number) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export function buildSeries(spec: SeriesSpec): (number | null)[] {
  const rand = rng(spec.seed)
  const out: (number | null)[] = []
  for (let i = 0; i < spec.length; i++) {
    const seg = spec.segments?.find((s) => i >= s.from && i < s.to)
    const jitter = seg?.jitter ?? spec.jitter
    const noise = (rand() * 2 - 1) * jitter
    const v = Math.max(0, Math.round(((seg ? seg.value : spec.base) + noise) * 10) / 10)
    const hidden = spec.gaps?.some((g) => i >= g.from && i < g.to) || (spec.sparse && !seg && !spec.sparse.includes(i))
    out.push(hidden ? null : v)
  }
  return out
}

export interface EvalPoint {
  /** Minuto em que o ponto termina e o alarme é avaliado. */
  minute: number
  value: number | null
  cat: PointCat
  state: AlarmState
}

export interface AlarmRun {
  points: EvalPoint[]
  transitions: { minute: number; from: AlarmState; to: AlarmState }[]
}

const aggregate = (xs: number[], stat: Statistic): number => (stat === 'maximum' ? Math.max(...xs) : stat === 'sum' ? xs.reduce((a, b) => a + b, 0) : xs.reduce((a, b) => a + b, 0) / xs.length)

export function categorize(value: number | null, operator: Operator, threshold: number): PointCat {
  if (value === null) return 'missing'
  return (operator === '>' ? value > threshold : value < threshold) ? 'breach' : 'ok'
}

/** Executa o alarme sobre a série: um ponto por período, avaliado no fim de cada um. */
export function runAlarm(series: (number | null)[], operator: Operator, s: AlarmSettings): AlarmRun {
  const points: EvalPoint[] = []
  const cats: PointCat[] = []
  const transitions: AlarmRun['transitions'] = []
  let state: AlarmState = 'INSUFFICIENT_DATA'
  for (let start = 0; start + s.periodMinutes <= series.length; start += s.periodMinutes) {
    const present = series.slice(start, start + s.periodMinutes).filter((v): v is number => v !== null)
    const value = present.length ? aggregate(present, s.statistic) : null
    const cat = categorize(value, operator, s.threshold)
    cats.push(cat)
    // O alarme só começa a avaliar quando já tem N períodos de histórico.
    const next: AlarmState = cats.length >= s.evaluationPeriods ? stateFromPoints(cats, s.evaluationPeriods, s.datapointsToAlarm, s.missing, state) : state
    const minute = start + s.periodMinutes
    if (next !== state) transitions.push({ minute, from: state, to: next })
    state = next
    points.push({ minute, value, cat, state })
  }
  return { points, transitions }
}

/** Intervalo de avaliação em minutos: N × período. */
export const evaluationIntervalMinutes = (s: Pick<AlarmSettings, 'evaluationPeriods' | 'periodMinutes'>): number => s.evaluationPeriods * s.periodMinutes

// ---------------------------------------------------------------------------
// Julgamento de um cenário
// ---------------------------------------------------------------------------

export interface IncidentWindow {
  /** Minuto em que o problema real começa. */
  from: number
  /** Minuto em que termina. */
  to: number
}

export interface AlarmVerdict {
  score: number
  status: 'correct' | 'partial' | 'wrong'
  message: string
  firstAlarm?: number
  falseAlarms: number
}

export interface JudgeSpec {
  incident: IncidentWindow
  /** Atraso máximo aceito entre o início do problema e o ALARM, em minutos. */
  maxDelay: number
  /** Tempo, depois do fim do problema, em que o ALARM ainda é aceito. */
  recovery: number
  /** O alarme não pode ficar em INSUFFICIENT_DATA depois de começar a avaliar (métrica publicada só quando há eventos). */
  requireOk?: boolean
}

export function judgeAlarm(run: AlarmRun, j: JudgeSpec): AlarmVerdict {
  const { from, to } = j.incident
  const alarms = run.points.filter((p) => p.state === 'ALARM')
  const inside = (m: number) => m >= from && m <= to + j.recovery
  const first = alarms.find((p) => inside(p.minute))
  const falseAlarms = alarms.filter((p) => !inside(p.minute)).length
  if (!first) {
    return { score: 0, status: 'wrong', message: falseAlarms > 0 ? `Não avisou do problema real (das ${from} às ${to} min) e ainda disparou ${falseAlarms} vez(es) fora dele.` : `Não avisou do problema real (das ${from} às ${to} min).`, falseAlarms }
  }
  const delay = first.minute - from
  const late = delay > j.maxDelay
  const noData = j.requireOk ? run.points.filter((p, i) => i > 0 && p.state === 'INSUFFICIENT_DATA' && run.points.slice(0, i).some((q) => q.state !== 'INSUFFICIENT_DATA')).length : 0
  const problems = (late ? 1 : 0) + (falseAlarms > 0 ? 1 : 0) + (noData > 0 ? 1 : 0)
  const parts = [`Avisou do problema ${delay} min depois de ele começar${late ? `, acima do limite de ${j.maxDelay} min` : ''}.`]
  if (falseAlarms > 0) parts.push(`Disparou ${falseAlarms} vez(es) fora do problema real, o que acordaria a equipe à toa.`)
  if (noData > 0) parts.push(`Ficou ${noData} vez(es) em INSUFFICIENT_DATA nos minutos sem dados, e o painel mostraria um problema que não existe.`)
  if (problems === 0) parts.push('Nenhum alarme falso.')
  return { score: problems === 0 ? 1 : problems === 1 ? 0.5 : 0, status: problems === 0 ? 'correct' : problems === 1 ? 'partial' : 'wrong', message: parts.join(' '), firstAlarm: first.minute, falseAlarms }
}
