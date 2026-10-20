/** Interface do laboratório de Auto Scaling: configuração do grupo e o dia simulado num gráfico. */
import type { Evaluation } from '../../engine/types'
import { renderInline } from '../../ui/inline'
import { instancePrice, PRICE_DATE, usd } from '../compute-prices'
import { FactTag, PremiseTag } from '../shared/Tags'
import c from '../shared/compute.module.css'
import sh from '../shared/lab.module.css'
import type { ScalingLabConfig, ScalingLabResponse } from './lab'
import { setupErrors } from './lab'
import { simulateDay, STEP_MIN, type DayResult, type ScalingSetup } from './model'
import s from './scaling.module.css'

interface Props {
  config: ScalingLabConfig
  value: ScalingLabResponse
  onChange: (v: ScalingLabResponse) => void
  disabled: boolean
  evaluation?: Evaluation | null
}

const POLICY_LABEL: Record<ScalingSetup['policy'], string> = { none: 'Nenhuma (capacidade fixa)', 'target-tracking': 'Target tracking', step: 'Step scaling', simple: 'Simple scaling' }

function Chart({ r, cap }: { r: DayResult; cap: number }) {
  const W = 288
  const H = 100
  const maxV = Math.max(...r.steps.map((x) => Math.max(x.demand, x.inService * cap)), 1) * 1.1
  const y = (v: number) => H - (v / maxV) * H
  const demand = r.steps.map((x, i) => `${i},${y(x.demand).toFixed(1)}`).join(' ')
  const capLine = r.steps.map((x, i) => `${i},${y(x.inService * cap).toFixed(1)}`).join(' ')
  const unmetHours = (r.steps.filter((x) => x.unmet > 0).length * STEP_MIN) / 60
  return (
    <figure className={s.chart} role="img" aria-label={`Dia simulado: no pico, ${r.peakInService} instâncias em serviço; ${unmetHours.toLocaleString('pt-BR', { maximumFractionDigits: 1 })} horas com demanda acima da capacidade.`}>
      <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" aria-hidden="true">
        {[6, 12, 18].map((h) => (
          <line key={h} x1={h * 12} x2={h * 12} y1={0} y2={H} className={s.grid} />
        ))}
        <polyline points={capLine} className={s.cap} />
        <polyline points={demand} className={s.demand} />
      </svg>
      <figcaption className={s.legend}>
        <span className={s.keyDemand}>demanda</span>
        <span className={s.keyCap}>capacidade em serviço</span>
        <span>0h · 6h · 12h · 18h · 24h</span>
      </figcaption>
    </figure>
  )
}

function Num({ label, value, onChange, disabled, min = 0, max, suffix }: { label: string; value: number | undefined; onChange: (n: number) => void; disabled: boolean; min?: number; max?: number; suffix?: string }) {
  return (
    <label className={c.field}>
      <span>
        {label}
        {suffix ? ` (${suffix})` : ''}
      </span>
      <input className={c.input} type="number" min={min} max={max} value={value ?? ''} disabled={disabled} onChange={(e) => onChange(Number(e.target.value))} style={{ width: '6.5em' }} />
    </label>
  )
}

export function ScalingLab({ config, value, onChange, disabled, evaluation }: Props) {
  const v = value
  const set = (part: Partial<ScalingSetup>) => onChange({ ...v, ...part })
  const errors = setupErrors(v)
  const r = errors.length ? undefined : simulateDay(config.scenario, v)
  const sc = config.scenario
  const pct = (n: number | undefined) => (n === undefined ? undefined : Math.round(n * 100))
  const scheduled = v.scheduled ?? []
  return (
    <div className={sh.lab}>
      <p className={c.legend}>
        <FactTag date="20/10/2026" /> regras de min, max e políticas do Auto Scaling · <PremiseTag /> cada {sc.type} atende {sc.capacityPerInstance} requisições por segundo e leva {sc.warmupMin} minutos para entrar em serviço · preço On-Demand da AWS Price List ({PRICE_DATE}): {usd(instancePrice(sc.type).onDemandHour)}/h.
      </p>

      <section className={sh.card} aria-label="Configuração do grupo">
        <h4 className={sh.title}>Grupo do Auto Scaling</h4>
        <div className={c.row}>
          <Num label="Mínimo" value={v.min} disabled={disabled} onChange={(n) => set({ min: n })} />
          <Num label="Desejado ao começar o dia" value={v.desired} disabled={disabled} onChange={(n) => set({ desired: n })} />
          <Num label="Máximo" value={v.max} disabled={disabled} onChange={(n) => set({ max: n })} />
        </div>
        <div className={c.row}>
          <label className={c.field}>
            <span>Política dinâmica</span>
            <select className={c.select} value={v.policy} disabled={disabled} onChange={(e) => set({ policy: e.target.value as ScalingSetup['policy'], predictive: e.target.value === 'target-tracking' ? v.predictive : undefined })}>
              {config.policies.map((p) => (
                <option key={p} value={p}>
                  {POLICY_LABEL[p]}
                </option>
              ))}
            </select>
          </label>
          {v.policy === 'target-tracking' && <Num label="Uso alvo" suffix="%" min={1} max={100} value={pct(v.target)} disabled={disabled} onChange={(n) => set({ target: n / 100 })} />}
          {(v.policy === 'step' || v.policy === 'simple') && (
            <>
              <Num label="Crescer acima de" suffix="% de uso" min={1} max={100} value={pct(v.above)} disabled={disabled} onChange={(n) => set({ above: n / 100 })} />
              <Num label="Adicionar" suffix="instâncias" min={1} value={v.add} disabled={disabled} onChange={(n) => set({ add: n })} />
              <Num label="Encolher abaixo de" suffix="% de uso" min={0} max={100} value={pct(v.below)} disabled={disabled} onChange={(n) => set({ below: n / 100 })} />
              <Num label="Remover" suffix="instâncias" min={1} value={v.remove} disabled={disabled} onChange={(n) => set({ remove: n })} />
            </>
          )}
          {v.policy === 'simple' && <Num label="Cooldown" suffix="min" min={0} value={v.cooldownMin ?? 5} disabled={disabled} onChange={(n) => set({ cooldownMin: n })} />}
        </div>
        {config.allowPredictive && (
          <label className={s.check}>
            <input type="checkbox" checked={Boolean(v.predictive)} disabled={disabled || v.policy !== 'target-tracking'} onChange={(e) => set({ predictive: e.target.checked || undefined })} /> Predictive scaling (usa o uso alvo do target tracking)
          </label>
        )}
        {config.allowScheduled && (
          <fieldset className={s.sched} disabled={disabled}>
            <legend>Ações agendadas</legend>
            {scheduled.map((a, i) => (
              <div key={i} className={c.row}>
                <Num label="Hora" min={0} max={23} value={a.hour} disabled={disabled} onChange={(n) => set({ scheduled: scheduled.map((x, j) => (j === i ? { ...x, hour: n } : x)) })} />
                <Num label="Mínimo" value={a.min} disabled={disabled} onChange={(n) => set({ scheduled: scheduled.map((x, j) => (j === i ? { ...x, min: n } : x)) })} />
                <Num label="Desejado" value={a.desired} disabled={disabled} onChange={(n) => set({ scheduled: scheduled.map((x, j) => (j === i ? { ...x, desired: n } : x)) })} />
                <button type="button" className={s.btn} onClick={() => set({ scheduled: scheduled.filter((_, j) => j !== i) })}>
                  Remover
                </button>
              </div>
            ))}
            {scheduled.length < 3 && (
              <button type="button" className={s.btn} onClick={() => set({ scheduled: [...scheduled, { hour: 8, min: v.min, desired: v.desired }] })}>
                Adicionar ação agendada
              </button>
            )}
          </fieldset>
        )}
        {errors.length > 0 && <p className={s.error}>{errors.join('; ')}.</p>}
      </section>

      {r && (
        <section className={sh.card} aria-label="Dia simulado">
          <h4 className={sh.title}>O dia simulado</h4>
          <Chart r={r} cap={sc.capacityPerInstance} />
          <p className={c.cost} aria-live="polite">
            Pico de {r.peakInService} instâncias · demanda não atendida: {(r.unmetPct * 100).toLocaleString('pt-BR', { maximumFractionDigits: 1 })}% (limite {(config.maxUnmetPct * 100).toLocaleString('pt-BR')}%) · <strong>{usd(r.monthlyCost)}/mês</strong> (orçamento {usd(config.maxMonthlyCost)})
          </p>
        </section>
      )}

      {evaluation &&
        evaluation.items.map((fb) => (
          <div key={fb.id} className={sh.verdict} data-status={fb.status} aria-live="polite">
            <strong>{fb.label}</strong>
            <span>{renderInline(fb.message ?? '')}</span>
          </div>
        ))}

      <details className={sh.simp}>
        <summary>Simplificações deste simulador</summary>
        <ul>
          <li>Passos de 5 minutos. Cada instância atende a uma capacidade fixa, e o uso é a demanda dividida pela capacidade em serviço.</li>
          <li>Target tracking calcula a capacidade proporcional ao uso e só encolhe depois de 15 minutos abaixo do alvo.</li>
          <li>Step scaling: a cada 10 pontos de uso acima do limite, soma mais as instâncias indicadas. Simple scaling espera o cooldown entre atividades.</li>
          <li>O predictive usa como previsão a curva do dia anterior, igual à de hoje, e sobe a capacidade um warmup antes.</li>
          <li>Custo pelo preço On-Demand de cada instância rodando, inclusive durante o warmup.</li>
        </ul>
      </details>
    </div>
  )
}
