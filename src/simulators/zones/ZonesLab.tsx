/** Interface do laboratório de AZs: posicionar instâncias, configurar ALB/NAT/banco e derrubar zonas. */
import { CircleAlert, CircleCheck, CircleSlash, CircleX, RefreshCw, Server, Zap } from 'lucide-react'
import { useState } from 'react'
import type { Evaluation } from '../../engine/types'
import { PlacementBoard } from '../../activities/shared/PlacementBoard'
import { renderInline } from '../../ui/inline'
import sh from '../shared/lab.module.css'
import { goalLabel, type ZonesLabConfig, type ZonesLabResponse } from './lab'
import { DB_LABEL, failureLabel, failureMatrix, NAT_LABEL, simulateFailure, STATUS_LABEL, validateZones, type ComponentState, type DbMode, type Failure, type NatMode, type ZonesTopology } from './model'
import s from './zones.module.css'

interface Props {
  config: ZonesLabConfig
  value: ZonesLabResponse
  onChange: (v: ZonesLabResponse) => void
  disabled: boolean
  evaluation?: Evaluation | null
}

const STATE_LABEL: Record<ComponentState['state'], string> = { ok: 'ok', down: 'fora', idle: 'sem tráfego', failover: 'assumiu', isolated: 'sem saída' }

function StateIcon({ state }: { state: ComponentState['state'] }) {
  if (state === 'ok' || state === 'failover') return <CircleCheck size={14} aria-hidden="true" />
  if (state === 'down') return <CircleX size={14} aria-hidden="true" />
  return <CircleSlash size={14} aria-hidden="true" />
}

export function ZonesLab({ config, value, onChange, disabled }: Props) {
  const t: ZonesTopology = value ?? config.initial
  const [failure, setFailure] = useState<Failure>('none')
  const set = (patch: Partial<ZonesTopology>) => onChange({ ...t, ...patch })
  const errors = validateZones(t)
  const result = simulateFailure(t, failure)
  const items = Object.keys(t.instances).map((id) => ({ id, text: id }))
  const placements = Object.fromEntries(Object.entries(t.instances).filter(([, az]) => az)) as Record<string, string>
  const natModes = config.natModes ?? (['zonal-single', 'zonal-per-az', 'regional'] as NatMode[])
  const original = failureMatrix(config.initial)
  const mine = failureMatrix(t)
  const regional = result.components.filter((c) => !c.az)

  return (
    <div className={sh.lab}>
      <section className={sh.card} aria-label="Objetivos">
        <h4 className={sh.title}>Objetivos</h4>
        <ul className={s.goals}>
          {config.goals.map((g, i) => (
            <li key={i}>{goalLabel(g)}</li>
          ))}
        </ul>
        <p className={sh.desc}>
          Carga normal: <strong>{t.required} instâncias</strong> precisam atender. {t.needsInternet ? 'Cada requisição chama uma API externa: as instâncias precisam de saída para a internet (NAT).' : ''}
        </p>
      </section>

      <section className={sh.card} aria-label="Arquitetura">
        <h4 className={sh.title}>1. Posicione as instâncias nas AZs</h4>
        <PlacementBoard
          items={items}
          targets={t.azs.map((az) => ({ id: az, label: `AZ ${az}` }))}
          placements={placements}
          onChange={(next) => set({ instances: Object.fromEntries(Object.keys(t.instances).map((id) => [id, next[id]])) })}
          disabled={disabled}
          poolLabel="Instâncias não implantadas"
        />
        <div className={s.controls}>
          <fieldset className={s.field}>
            <legend>AZs habilitadas no ALB</legend>
            <div className={s.checks}>
              {t.azs.map((az) => (
                <label key={az}>
                  <input
                    type="checkbox"
                    checked={t.albAzs.includes(az)}
                    disabled={disabled}
                    onChange={(e) => set({ albAzs: e.target.checked ? [...t.albAzs, az].sort() : t.albAzs.filter((x) => x !== az) })}
                  />{' '}
                  AZ {az}
                </label>
              ))}
            </div>
          </fieldset>
          {t.needsInternet && (
            <label className={s.field}>
              <span>NAT gateway</span>
              <select aria-label="Modo do NAT gateway" value={t.nat.mode} disabled={disabled} onChange={(e) => set({ nat: { mode: e.target.value as NatMode, az: e.target.value === 'zonal-single' ? (t.nat.az ?? t.azs[0]) : undefined } })}>
                {natModes.map((m) => (
                  <option key={m} value={m}>
                    {NAT_LABEL[m]}
                  </option>
                ))}
              </select>
              {t.nat.mode === 'zonal-single' && (
                <select aria-label="AZ do NAT gateway" value={t.nat.az} disabled={disabled} onChange={(e) => set({ nat: { mode: 'zonal-single', az: e.target.value } })}>
                  {t.azs.map((az) => (
                    <option key={az} value={az}>
                      na AZ {az}
                    </option>
                  ))}
                </select>
              )}
            </label>
          )}
          {!config.lockDb && (
            <label className={s.field}>
              <span>Banco de dados</span>
              <select
                aria-label="Implantação do banco"
                value={t.db.mode}
                disabled={disabled}
                onChange={(e) => {
                  const mode = e.target.value as DbMode
                  set({ db: { mode, primary: t.db.primary, standby: mode === 'multi-az' ? (t.db.standby ?? t.azs.find((a) => a !== t.db.primary)) : undefined } })
                }}
              >
                {(['single-az', 'multi-az'] as DbMode[]).map((m) => (
                  <option key={m} value={m}>
                    {DB_LABEL[m]}
                  </option>
                ))}
              </select>
              <select aria-label="AZ do primário" value={t.db.primary} disabled={disabled} onChange={(e) => set({ db: { ...t.db, primary: e.target.value } })}>
                {t.azs.map((az) => (
                  <option key={az} value={az}>
                    primário na AZ {az}
                  </option>
                ))}
              </select>
              {t.db.mode === 'multi-az' && (
                <select aria-label="AZ do standby" value={t.db.standby} disabled={disabled} onChange={(e) => set({ db: { ...t.db, standby: e.target.value } })}>
                  {t.azs.map((az) => (
                    <option key={az} value={az}>
                      standby na AZ {az}
                    </option>
                  ))}
                </select>
              )}
            </label>
          )}
        </div>
        {errors.length > 0 && (
          <p className={s.error} role="alert">
            <CircleAlert size={14} aria-hidden="true" /> {errors.join(' ')}
          </p>
        )}
      </section>

      <section className={sh.card} aria-label="Simulação de falhas">
        <h4 className={sh.title}>2. Derrube uma zona e observe</h4>
        <div className={s.failures} role="radiogroup" aria-label="Cenário de falha">
          {(['none', ...t.azs, 'region'] as Failure[]).map((f) => (
            <button key={f} type="button" role="radio" aria-checked={failure === f} className={s.failBtn} onClick={() => setFailure(f)}>
              {f === 'none' ? <RefreshCw size={14} aria-hidden="true" /> : <Zap size={14} aria-hidden="true" />} {failureLabel(f)}
            </button>
          ))}
        </div>
        <div className={s.status} data-status={result.status} aria-live="polite">
          <strong>
            {failureLabel(failure)}: aplicação {STATUS_LABEL[result.status].toLowerCase()}
          </strong>{' '}
          ({result.serving}/{result.required} instâncias atendendo)
          {result.reasons.length > 0 && (
            <ul>
              {result.reasons.map((r, i) => (
                <li key={i}>{renderInline(r)}</li>
              ))}
            </ul>
          )}
        </div>
        <div className={s.region} data-failed={failure === 'region'}>
          <span className={s.regionLabel}>Região</span>
          <div className={s.azGrid} style={{ ['--azs' as string]: t.azs.length }}>
            {t.azs.map((az) => (
              <div key={az} className={s.az} data-failed={failure === az || failure === 'region'}>
                <span className={s.azLabel}>AZ {az}</span>
                <ul>
                  {result.components
                    .filter((c) => c.az === az)
                    .map((c) => (
                      <li key={c.id} data-state={c.state} title={c.note}>
                        <StateIcon state={c.state} />
                        {c.id.startsWith('web') || c.id.startsWith('app') ? <Server size={12} aria-hidden="true" /> : null}
                        <span>{c.label}</span>
                        <span className={s.stateText}>{STATE_LABEL[c.state]}</span>
                      </li>
                    ))}
                </ul>
              </div>
            ))}
          </div>
          {regional.length > 0 && (
            <ul className={s.regional}>
              {regional.map((c) => (
                <li key={c.id} data-state={c.state}>
                  <StateIcon state={c.state} /> {c.label} (abrange as AZs) <span className={s.stateText}>{STATE_LABEL[c.state]}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <section className={sh.card} aria-label="Comparação">
        <h4 className={sh.title}>3. Concentrada × sua arquitetura</h4>
        <table className={s.table}>
          <thead>
            <tr>
              <th scope="col">Cenário</th>
              <th scope="col">Original</th>
              <th scope="col">Sua versão</th>
            </tr>
          </thead>
          <tbody>
            {mine.map((m, i) => (
              <tr key={String(m.failure)}>
                <th scope="row">{failureLabel(m.failure)}</th>
                <td data-status={original[i].status}>
                  {STATUS_LABEL[original[i].status]} <small>({original[i].serving}/{original[i].required})</small>
                </td>
                <td data-status={m.status}>
                  {STATUS_LABEL[m.status]} <small>({m.serving}/{m.required})</small>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className={sh.desc}>Várias AZs aumentam a resiliência, mas não protegem contra a falha da Região, um deploy com defeito ou dados corrompidos: isso exige outras defesas (outra Região, implantação gradual, backups).</p>
      </section>

      <details className={sh.simp}>
        <summary>Simplificações deste simulador</summary>
        <ul>
          <li>A AZ falha por inteiro e o failover do RDS é instantâneo (na prática leva um tempo curto).</li>
          <li>A capacidade é proporcional ao número de instâncias; o Auto Scaling não é simulado (repor capacidade depende do plano de controle e leva minutos).</li>
          <li>Falhas parciais (uma AZ "lenta"), DNS e sessões presas a uma instância não são modelados.</li>
        </ul>
      </details>
    </div>
  )
}
