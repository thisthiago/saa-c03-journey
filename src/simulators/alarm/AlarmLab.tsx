/** Interface do laboratório de alarmes do CloudWatch: controles do alarme, gráfico da métrica e a linha do tempo dos estados. */
import type { Evaluation } from '../../engine/types'
import { renderInline } from '../../ui/inline'
import { usd } from '../compute-prices'
import { governancePrices, GOV_PRICE_DATE } from '../governance-prices'
import { FactTag, PremiseTag } from '../shared/Tags'
import c from '../shared/compute.module.css'
import sh from '../shared/lab.module.css'
import a from './alarm.module.css'
import { initialSettings, judgeScenario, MAX_EVALUATION_PERIODS, type AlarmLabConfig, type AlarmLabResponse, type AlarmScenario } from './lab'
import { evaluationIntervalMinutes, MISSING_LABEL, STATE_LABEL, STATISTIC_LABEL, type AlarmRun, type AlarmSettings, type MissingData, type Statistic } from './model'

interface Props {
  config: AlarmLabConfig
  value: AlarmLabResponse
  onChange: (v: AlarmLabResponse) => void
  disabled: boolean
  evaluation?: Evaluation | null
}

const W = 640
const H = 170
const PAD = { l: 38, r: 10, t: 10, b: 26 }

function Chart({ scenario, series, run, settings }: { scenario: AlarmScenario; series: (number | null)[]; run: AlarmRun; settings: AlarmSettings }) {
  const max = Math.max(settings.threshold * 1.15, ...series.map((v) => v ?? 0), 1)
  const x = (m: number) => PAD.l + (m / series.length) * (W - PAD.l - PAD.r)
  const y = (v: number) => H - PAD.b - (v / max) * (H - PAD.t - PAD.b)
  const segments: string[] = []
  let cur: string[] = []
  series.forEach((v, i) => {
    if (v === null) {
      if (cur.length) segments.push(cur.join(' '))
      cur = []
    } else cur.push(`${x(i + 0.5).toFixed(1)},${y(v).toFixed(1)}`)
  })
  if (cur.length) segments.push(cur.join(' '))
  const { from, to } = scenario.judge.incident
  const alarms = run.points.filter((p) => p.state === 'ALARM').length
  const label = `Gráfico da métrica ${scenario.metric} ao longo de ${series.length} minutos, com o limite em ${settings.threshold}. O alarme ficou em ALARM em ${alarms} de ${run.points.length} avaliações.`
  return (
    <svg className={a.chart} viewBox={`0 0 ${W} ${H}`} role="img" aria-label={label}>
      <rect className={a.incident} x={x(from)} y={PAD.t} width={x(to) - x(from)} height={H - PAD.t - PAD.b} />
      <text className={a.label} x={x(from) + 3} y={H - PAD.b - 4}>
        problema real
      </text>
      <line className={a.axis} x1={PAD.l} y1={H - PAD.b} x2={W - PAD.r} y2={H - PAD.b} />
      <line className={a.axis} x1={PAD.l} y1={PAD.t} x2={PAD.l} y2={H - PAD.b} />
      <line className={a.grid} x1={PAD.l} y1={y(max / 2)} x2={W - PAD.r} y2={y(max / 2)} />
      <text className={a.label} x={PAD.l - 4} y={y(max) + 8} textAnchor="end">
        {Math.round(max)}
      </text>
      <text className={a.label} x={PAD.l - 4} y={y(0)} textAnchor="end">
        0
      </text>
      <line className={a.threshold} x1={PAD.l} y1={y(settings.threshold)} x2={W - PAD.r} y2={y(settings.threshold)} />
      <text className={a.label} x={W - PAD.r} y={y(settings.threshold) - 3} textAnchor="end">
        limite {settings.threshold}
      </text>
      {segments.map((pts, i) => (
        <polyline key={i} className={a.line} points={pts} />
      ))}
      {run.points.map((p) => (
        <circle key={p.minute} className={p.state === 'ALARM' ? a.alarmDot : p.state === 'OK' ? a.okDot : a.noDataDot} cx={x(p.minute - settings.periodMinutes / 2)} cy={H - PAD.b + 10} r={2.6} />
      ))}
      {[0, Math.round(series.length / 2), series.length].map((m) => (
        <text key={m} className={a.label} x={x(m)} y={H - 2} textAnchor={m === 0 ? 'start' : m === series.length ? 'end' : 'middle'}>
          {m} min
        </text>
      ))}
    </svg>
  )
}

export function AlarmLab({ config, value, onChange, disabled, evaluation }: Props) {
  const p = governancePrices().cloudwatch
  const set = (id: string, patch: Partial<AlarmSettings>, s: AlarmScenario) => {
    const cur = value.settings?.[id] ?? initialSettings(s)
    const next = { ...cur, ...patch }
    next.datapointsToAlarm = Math.min(next.datapointsToAlarm, next.evaluationPeriods)
    onChange({ settings: { ...value.settings, [id]: next } })
  }
  return (
    <div className={sh.lab}>
      <p className={c.legend}>
        <FactTag date="21/10/2026" /> o alarme tem três ajustes: período, períodos de avaliação (N) e pontos que precisam violar o limite (M); o intervalo de avaliação é N × período; dados ausentes podem ser tratados de quatro formas · <PremiseTag /> a série de pontos, o alarme avaliado no fim de cada período e o intervalo de avaliação de N + 2 pontos · preços da AWS Price List ({GOV_PRICE_DATE}): alarme padrão {usd(p.standardAlarmMonth)} por mês.
      </p>
      {config.scenarios.map((s) => {
        const settings = value.settings?.[s.id] ?? initialSettings(s)
        const { series, run, verdict } = judgeScenario(s, settings)
        const fb = evaluation?.items.find((i) => i.id === s.id)
        const interval = evaluationIntervalMinutes(settings)
        return (
          <section key={s.id} className={sh.card} aria-label={s.name}>
            <h4 className={sh.title}>{s.name}</h4>
            <p className={sh.desc}>
              {renderInline(s.description)} Métrica: <span className={c.mono}>{s.metric}</span>. O alarme dispara quando o valor fica {s.operator === '>' ? 'acima' : 'abaixo'} do limite.
            </p>
            <ul className={c.needs}>
              {s.goals.map((g) => (
                <li key={g}>{g}</li>
              ))}
            </ul>
            <div className={c.row}>
              <label className={c.field}>
                <span>Estatística</span>
                <select className={c.select} value={settings.statistic} disabled={disabled} onChange={(e) => set(s.id, { statistic: e.target.value as Statistic }, s)}>
                  {s.statistics.map((st) => (
                    <option key={st} value={st}>
                      {STATISTIC_LABEL[st]}
                    </option>
                  ))}
                </select>
              </label>
              <label className={c.field}>
                <span>Período</span>
                <select className={c.select} value={settings.periodMinutes} disabled={disabled} onChange={(e) => set(s.id, { periodMinutes: Number(e.target.value) }, s)}>
                  {s.periods.map((m) => (
                    <option key={m} value={m}>
                      {m} min
                    </option>
                  ))}
                </select>
              </label>
              <label className={c.field}>
                <span>Limite ({s.operator === '>' ? 'acima de' : 'abaixo de'})</span>
                <select className={c.select} value={settings.threshold} disabled={disabled} onChange={(e) => set(s.id, { threshold: Number(e.target.value) }, s)}>
                  {s.thresholds.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </label>
              <label className={c.field}>
                <span>Períodos de avaliação (N)</span>
                <select className={c.select} value={settings.evaluationPeriods} disabled={disabled} onChange={(e) => set(s.id, { evaluationPeriods: Number(e.target.value) }, s)}>
                  {Array.from({ length: MAX_EVALUATION_PERIODS }, (_, i) => i + 1).map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>
              </label>
              <label className={c.field}>
                <span>Pontos que disparam (M)</span>
                <select className={c.select} value={settings.datapointsToAlarm} disabled={disabled} onChange={(e) => set(s.id, { datapointsToAlarm: Number(e.target.value) }, s)}>
                  {Array.from({ length: settings.evaluationPeriods }, (_, i) => i + 1).map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </label>
              <label className={c.field}>
                <span>Dados ausentes</span>
                <select className={c.select} value={settings.missing} disabled={disabled} onChange={(e) => set(s.id, { missing: e.target.value as MissingData }, s)}>
                  {(Object.keys(MISSING_LABEL) as MissingData[]).map((m) => (
                    <option key={m} value={m}>
                      {MISSING_LABEL[m]}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <p className={c.cost}>
              {settings.datapointsToAlarm} de {settings.evaluationPeriods} pontos de {settings.periodMinutes} min · intervalo de avaliação de {interval} min · {usd(p.standardAlarmMonth)}/mês
            </p>
            <Chart scenario={s} series={series} run={run} settings={settings} />
            <ul className={a.legend} aria-label="Legenda do gráfico">
              <li>
                <span className={a.swatch} style={{ background: 'var(--success)' }} /> OK
              </li>
              <li>
                <span className={a.swatch} style={{ background: 'var(--danger)' }} /> ALARM
              </li>
              <li>
                <span className={a.swatch} style={{ background: 'var(--text-muted)' }} /> INSUFFICIENT_DATA
              </li>
            </ul>
            <ul className={a.transitions} aria-live="polite" aria-label="Mudanças de estado do alarme">
              {run.transitions.length === 0 && <li>O alarme não mudou de estado.</li>}
              {run.transitions.map((t) => (
                <li key={`${t.minute}-${t.to}`}>
                  Minuto {t.minute}: {STATE_LABEL[t.from]} para {STATE_LABEL[t.to]}
                </li>
              ))}
            </ul>
            <p className={c.cost} aria-live="polite">
              {renderInline(verdict.message)}
            </p>
            {fb && (
              <div className={sh.verdict} data-status={fb.status} aria-live="polite">
                <strong>{fb.label}</strong>
                <span>{renderInline(fb.message ?? '')}</span>
              </div>
            )}
          </section>
        )
      })}
      <details className={sh.simp}>
        <summary>Simplificações deste simulador</summary>
        <ul>
          <li>A série tem um ponto por minuto, gerado pelo cenário. O alarme é avaliado no fim de cada período; na AWS, ele é avaliado a cada minuto.</li>
          <li>Quando há pontos ausentes, o alarme busca N + 2 pontos, como nos exemplos da documentação. A AWS ajusta esse intervalo conforme o período e a resolução.</li>
          <li>Os casos de dados ausentes que a documentação não descreve mantêm o estado anterior do alarme.</li>
          <li>Só alarmes de resolução padrão (período de 1 minuto ou mais). Alarmes de alta resolução, compostos, de detecção de anomalias e de consultas ficam de fora.</li>
        </ul>
      </details>
    </div>
  )
}
