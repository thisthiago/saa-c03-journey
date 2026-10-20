/** Interface do laboratório de concorrência do Lambda: uma linha por função, objetivos avaliados ao vivo. */
import type { Evaluation } from '../../engine/types'
import { renderInline } from '../../ui/inline'
import { PRICE_DATE, usd } from '../compute-prices'
import { FactTag, PremiseTag } from '../shared/Tags'
import c from '../shared/compute.module.css'
import sh from '../shared/lab.module.css'
import { checkLambdaGoal, goalLabel, type LambdaLabConfig, type LambdaLabResponse } from './lab'
import { ACCOUNT_LIMIT, concurrencyNeeded, lambdaMonthly, simulateAccount, validateSettings, type ConcurrencySettings } from './model'
import s from './lambda.module.css'

interface Props {
  config: LambdaLabConfig
  value: LambdaLabResponse
  onChange: (v: LambdaLabResponse) => void
  disabled: boolean
  evaluation?: Evaluation | null
}

export function LambdaLab({ config, value, onChange, disabled, evaluation }: Props) {
  const settings = value.settings ?? {}
  const set = (id: string, part: Partial<ConcurrencySettings>) => onChange({ settings: { ...settings, [id]: { ...settings[id], ...part } } })
  const res = simulateAccount(config.functions, settings)
  const errors = validateSettings(config.functions, settings)
  const reservedSum = config.functions.reduce((sum, f) => sum + (settings[f.id]?.reserved ?? 0), 0)
  return (
    <div className={sh.lab}>
      <p className={c.legend}>
        <FactTag date="20/10/2026" /> limite da conta: {ACCOUNT_LIMIT.toLocaleString('pt-BR')} por Região; 100 ficam sempre sem reserva · concorrência = requisições por segundo × duração · <PremiseTag /> picos e durações do cenário · preços da AWS Price List ({PRICE_DATE}).
      </p>
      <p className={s.pool} aria-live="polite">
        Reservado: <strong>{reservedSum}</strong> · livre para as funções sem reserva: <strong>{Math.max(0, ACCOUNT_LIMIT - reservedSum)}</strong>
      </p>

      {config.functions.map((f) => {
        const r = res.find((x) => x.id === f.id)!
        const st = settings[f.id] ?? {}
        const cost = lambdaMonthly(f, st)
        return (
          <section key={f.id} className={sh.card} aria-label={f.name}>
            <h4 className={sh.title}>{f.name}</h4>
            <p className={sh.desc}>
              {f.rps.toLocaleString('pt-BR')} requisições por segundo no pico × {f.durationMs.toLocaleString('pt-BR')} ms = <strong>{concurrencyNeeded(f).toLocaleString('pt-BR')} execuções simultâneas</strong> · {f.invocation === 'sync' ? 'chamada síncrona' : 'chamada assíncrona'} · {f.memoryMB} MB
            </p>
            <div className={c.row}>
              <label className={s.toggle}>
                <input type="checkbox" checked={st.reserved !== undefined} disabled={disabled} onChange={(e) => set(f.id, { reserved: e.target.checked ? concurrencyNeeded(f) : undefined })} /> Reservar concorrência
              </label>
              {st.reserved !== undefined && (
                <label className={c.field}>
                  <span>Reservada</span>
                  <input className={c.input} type="number" min={0} value={st.reserved} disabled={disabled} onChange={(e) => set(f.id, { reserved: Number(e.target.value) })} style={{ width: '7em' }} />
                </label>
              )}
              <label className={c.field}>
                <span>Provisionada</span>
                <input className={c.input} type="number" min={0} value={st.provisioned ?? 0} disabled={disabled} onChange={(e) => set(f.id, { provisioned: Number(e.target.value) || undefined })} style={{ width: '7em' }} />
              </label>
            </div>
            <p className={c.cost}>
              Disponível: {r.available.toLocaleString('pt-BR')} · {r.throttled ? <span className={s.bad}>throttling em {Math.round(r.throttledPct * 100)}% do pico</span> : <span className={s.ok}>sem throttling</span>} · {r.coldStart ? 'cold start no pico' : 'sem cold start'} · {usd(cost.total)}/mês
              {cost.provisioned > 0 && ` (provisionada: ${usd(cost.provisioned)})`}
            </p>
          </section>
        )
      })}

      <section className={sh.card} aria-label="Objetivos">
        <h4 className={sh.title}>Objetivos</h4>
        {errors.length > 0 && <p className={s.bad}>A AWS recusaria esta configuração: {errors.join('; ')}.</p>}
        <ul className={s.goals} aria-live="polite">
          {config.goals.map((g, i) => {
            const v = checkLambdaGoal(config, value, g)
            return (
              <li key={i} data-ok={v.ok}>
                <strong>
                  {v.ok ? '✓' : '✗'} {goalLabel(config, g)}
                </strong>
                <span>{v.message}</span>
              </li>
            )
          })}
        </ul>
      </section>

      {evaluation && evaluation.items.some((i) => i.id === 'invalid') && (
        <div className={sh.verdict} data-status="wrong" aria-live="polite">
          <span>{renderInline(evaluation.items[0].message ?? '')}</span>
        </div>
      )}

      <details className={sh.simp}>
        <summary>Simplificações deste simulador</summary>
        <ul>
          <li>Cada função recebe o pico de forma constante. Na AWS, a concorrência cresce até 1.000 ambientes a cada 10 segundos por função.</li>
          <li>As funções sem reserva dividem a concorrência livre em proporção ao que precisam.</li>
          <li>O custo usa o preço de duração comum para todas as invocações e soma o preço da concorrência provisionada o mês inteiro.</li>
        </ul>
      </details>
    </div>
  )
}
