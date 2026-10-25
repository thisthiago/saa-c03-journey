/** Interface do laboratório de custos: tags de alocação, o custo por grupo e os orçamentos com os alertas e o gasto acumulado do mês. */
import type { Evaluation } from '../../engine/types'
import { renderInline } from '../../ui/inline'
import { usd } from '../compute-prices'
import { FactTag, PremiseTag } from '../shared/Tags'
import a from '../alarm/alarm.module.css'
import c from '../shared/compute.module.css'
import sh from '../shared/lab.module.css'
import { emptyTarget, PCT_OPTIONS, targetDaily, type BudgetLabConfig, type BudgetLabResponse, type BudgetScenario, type BudgetTarget, type ScenarioChoice, type TargetChoice } from './lab'
import { allocate, cumulative, firstAlertDay, forecastAt, type BudgetAlert } from './model'

interface Props {
  config: BudgetLabConfig
  value: BudgetLabResponse
  onChange: (v: BudgetLabResponse) => void
  disabled: boolean
  evaluation?: Evaluation | null
}

const W = 640
const H = 160
const PAD = { l: 44, r: 10, t: 10, b: 24 }

function Chart({ target, daily, alerts, day }: { target: BudgetTarget; daily: number[]; alerts: BudgetAlert[]; day?: number }) {
  const cum = cumulative(daily)
  const forecast = cum.map((_, i) => forecastAt(cum, i + 1))
  const max = Math.max(target.limit * 1.1, ...cum, ...forecast)
  const x = (d: number) => PAD.l + (d / daily.length) * (W - PAD.l - PAD.r)
  const y = (v: number) => H - PAD.b - (v / max) * (H - PAD.t - PAD.b)
  const line = (xs: number[]) => xs.map((v, i) => `${x(i + 1).toFixed(1)},${y(v).toFixed(1)}`).join(' ')
  const label = `Gasto acumulado do mês e previsão para ${target.label}, com o limite de ${Math.round(target.limit)} dólares.${day ? ` O primeiro alerta dispara no dia ${day}.` : ' Nenhum alerta dispara.'}`
  return (
    <svg className={a.chart} viewBox={`0 0 ${W} ${H}`} role="img" aria-label={label}>
      <line className={a.axis} x1={PAD.l} y1={H - PAD.b} x2={W - PAD.r} y2={H - PAD.b} />
      <line className={a.axis} x1={PAD.l} y1={PAD.t} x2={PAD.l} y2={H - PAD.b} />
      <line className={a.threshold} x1={PAD.l} y1={y(target.limit)} x2={W - PAD.r} y2={y(target.limit)} />
      <text className={a.label} x={W - PAD.r} y={y(target.limit) - 3} textAnchor="end">
        limite {Math.round(target.limit)}
      </text>
      {alerts.map((al) => (
        <line key={al.kind} className={a.grid} x1={PAD.l} y1={y((al.pct / 100) * target.limit)} x2={W - PAD.r} y2={y((al.pct / 100) * target.limit)} />
      ))}
      <polyline className={a.line} points={line(forecast)} style={{ strokeDasharray: '4 3', opacity: 0.6 }} />
      <polyline className={a.line} points={line(cum)} />
      {day && <circle className={a.alarmDot} cx={x(day)} cy={y(cum[day - 1])} r={4} />}
      {/* Dentro do gráfico: valores de quatro dígitos não cabem na margem quando a fonte cresce no celular. */}
      <text className={a.label} x={PAD.l + 4} y={y(max) + 8}>
        {Math.round(max)}
      </text>
      {[1, Math.round(daily.length / 2), daily.length].map((d) => (
        <text key={d} className={a.label} x={x(d)} y={H - 4} textAnchor={d === 1 ? 'start' : d === daily.length ? 'end' : 'middle'}>
          dia {d}
        </text>
      ))}
    </svg>
  )
}

const pctLabel = (p: number) => (p === 0 ? 'Sem alerta' : `${p}% do limite`)

export function BudgetLab({ config, value, onChange, disabled, evaluation }: Props) {
  const setChoice = (s: BudgetScenario, patch: (cur: ScenarioChoice) => ScenarioChoice) => {
    const cur = value.choices?.[s.id] ?? { activeTags: [], targets: {} }
    onChange({ choices: { ...value.choices, [s.id]: patch(cur) } })
  }
  return (
    <div className={sh.lab}>
      <p className={c.legend}>
        <FactTag date="21/10/2026" /> tags de alocação de custo precisam ser ativadas para aparecer nos relatórios, e as chaves diferenciam maiúsculas de minúsculas; o relatório inclui o que não tem tag; um orçamento pode alertar sobre o valor real ou o previsto · <PremiseTag /> o gasto diário de cada recurso, a previsão como projeção linear do gasto até o dia e os alertas avaliados uma vez por dia
      </p>
      {config.scenarios.map((s) => {
        const choice = value.choices?.[s.id] ?? { activeTags: [], targets: {} }
        const alloc = allocate(s.streams, choice.activeTags, s.days)
        const rows = Object.entries(alloc.groups).sort((x, y) => y[1] - x[1])
        const fbs = evaluation?.items.filter((i) => i.id.startsWith(`${s.id}:`)) ?? []
        return (
          <section key={s.id} className={sh.card} aria-label={s.name}>
            <h4 className={sh.title}>{s.name}</h4>
            <p className={sh.desc}>{renderInline(s.description)}</p>
            <fieldset className={c.field} style={{ border: 'none', padding: 0, margin: 0 }}>
              <legend className={c.muted}>Tags de alocação de custo a ativar</legend>
              <div className={c.row}>
                {s.tagKeys.map((k) => (
                  <label key={k}>
                    <input type="checkbox" checked={choice.activeTags.includes(k)} disabled={disabled} onChange={(e) => setChoice(s, (cur) => ({ ...cur, activeTags: e.target.checked ? [...cur.activeTags, k] : cur.activeTags.filter((x) => x !== k) }))} /> <span className={c.mono}>{k}</span>
                  </label>
                ))}
              </div>
            </fieldset>
            <div className={c.scroll}>
              <table className={c.table}>
                <caption className={c.muted}>Custo do mês por grupo de tags ativadas</caption>
                <thead>
                  <tr>
                    <th scope="col">Grupo</th>
                    <th scope="col" className={c.num}>
                      Custo
                    </th>
                    <th scope="col" className={c.num}>
                      Parte do total
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map(([name, cost]) => (
                    <tr key={name}>
                      <td>{name}</td>
                      <td className={c.num}>{usd(cost)}</td>
                      <td className={c.num}>{Math.round((cost / alloc.total) * 100)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {s.targets.map((t) => {
              const tc: TargetChoice = choice.targets[t.id] ?? emptyTarget()
              const setTarget = (patch: Partial<TargetChoice>) => setChoice(s, (cur) => ({ ...cur, targets: { ...cur.targets, [t.id]: { ...(cur.targets[t.id] ?? emptyTarget()), ...patch } } }))
              const alerts: BudgetAlert[] = [...(tc.actualPct ? [{ kind: 'actual' as const, pct: tc.actualPct }] : []), ...(tc.forecastPct ? [{ kind: 'forecast' as const, pct: tc.forecastPct }] : [])]
              const daily = targetDaily(s, t)
              const day = tc.enabled ? firstAlertDay(daily, t.limit, alerts) : undefined
              return (
                <div key={t.id} className={sh.card} role="group" aria-label={`Orçamento: ${t.label}`}>
                  <h5 className={sh.title}>
                    {t.label} <span className={c.muted}>(limite de {usd(t.limit)} no mês)</span>
                  </h5>
                  <div className={c.row}>
                    <label className={c.field}>
                      <span>Orçamento</span>
                      <span>
                        <input type="checkbox" checked={tc.enabled} disabled={disabled} onChange={(e) => setTarget({ enabled: e.target.checked })} /> criar este orçamento
                      </span>
                    </label>
                    <label className={c.field}>
                      <span>Alerta sobre o valor real</span>
                      <select className={c.select} value={tc.actualPct} disabled={disabled || !tc.enabled} onChange={(e) => setTarget({ actualPct: Number(e.target.value) })}>
                        {PCT_OPTIONS.map((p) => (
                          <option key={p} value={p}>
                            {pctLabel(p)}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className={c.field}>
                      <span>Alerta sobre o valor previsto</span>
                      <select className={c.select} value={tc.forecastPct} disabled={disabled || !tc.enabled} onChange={(e) => setTarget({ forecastPct: Number(e.target.value) })}>
                        {PCT_OPTIONS.map((p) => (
                          <option key={p} value={p}>
                            {pctLabel(p)}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>
                  <Chart target={t} daily={daily} alerts={alerts} day={day} />
                  <p className={c.cost} aria-live="polite">
                    {!tc.enabled ? 'Sem orçamento.' : alerts.length === 0 ? 'Sem alertas configurados.' : day ? `O primeiro alerta dispara no dia ${day} do mês.` : 'Nenhum alerta dispara neste mês.'}
                  </p>
                </div>
              )
            })}
            {fbs.map((fb) => (
              <div key={fb.id} className={sh.verdict} data-status={fb.status} aria-live="polite">
                <strong>{fb.label}</strong>
                <span>{renderInline(fb.message ?? '')}</span>
              </div>
            ))}
          </section>
        )
      })}
      <details className={sh.simp}>
        <summary>Simplificações deste simulador</summary>
        <ul>
          <li>O gasto de cada recurso é constante por dia, com uma mudança de patamar no meio do mês. A previsão é uma projeção linear; a da AWS usa um modelo próprio.</li>
          <li>Os orçamentos olham o custo bruto do mês. Descontos, créditos, impostos e as ações de orçamento (aplicar políticas ou parar instâncias) ficam de fora.</li>
          <li>A ativação das tags é tratada como já concluída; na AWS, as chaves levam até 24 horas para aparecer e mais 24 horas para ativar, e só a conta de gerenciamento da organização ativa.</li>
          <li>Orçamentos por tag só valem para chaves ativadas; os orçamentos por conta valem sempre.</li>
        </ul>
      </details>
    </div>
  )
}
