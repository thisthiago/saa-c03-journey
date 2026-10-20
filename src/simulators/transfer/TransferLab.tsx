/** Interface do laboratório de migração: parâmetros de cada cenário, método escolhido e comparação. */
import { Check, CircleSlash, Clock, X } from 'lucide-react'
import type { Evaluation } from '../../engine/types'
import { Badge } from '../../ui/kit'
import type { TransferLabConfig, TransferLabResponse } from './lab'
import { estimateTransfer, formatDays, METHOD_LABEL, type TransferMethod } from './model'
import s from './transfer.module.css'

interface Props {
  config: TransferLabConfig
  value: TransferLabResponse
  onChange: (v: TransferLabResponse) => void
  disabled: boolean
  evaluation?: Evaluation | null
}

export function TransferLab({ config, value, onChange, disabled, evaluation }: Props) {
  return (
    <div className={s.lab}>
      {config.scenarios.map((sc) => {
        const m = value.choices?.[sc.id]
        const est = m ? estimateTransfer(sc, m) : null
        const all = config.methods.map((x) => estimateTransfer(sc, x))
        const maxDays = Math.max(sc.deadlineDays, ...all.map((a) => a.days ?? 0))
        return (
          <section key={sc.id} className={s.card} aria-label={sc.name}>
            <h4 className={s.title}>{sc.name}</h4>
            <p className={s.desc}>{sc.description}</p>
            <ul className={s.params}>
              <li>
                <span>Volume</span> <strong>{sc.dataTB.toLocaleString('pt-BR')} TB</strong>
              </li>
              <li>
                <span>Link</span> <strong>{sc.linkMbps >= 1000 ? `${sc.linkMbps / 1000} Gbps` : `${sc.linkMbps} Mbps`}</strong> ({Math.round(sc.usableShare * 100)}% utilizável)
              </li>
              <li>
                <span>Prazo</span> <strong>{sc.deadlineDays} dias</strong>
              </li>
              <li>
                <span>Dados mudam até a virada?</span> <strong>{sc.ongoingChanges ? 'Sim' : 'Não'}</strong>
              </li>
              <li>
                <span>Enterprise Support</span> <strong>{sc.enterpriseSupport ? 'Sim' : 'Não'}</strong>
              </li>
              <li>
                <span>Já usa a Snow Family?</span> <strong>{sc.newSnowCustomer ? 'Não' : 'Sim'}</strong>
              </li>
              {sc.directConnect && (
                <li>
                  <span>Direct Connect (premissa)</span> <strong>{sc.directConnect.gbps} Gbps em {sc.directConnect.leadDays} dias</strong>
                </li>
              )}
              {sc.terminalDays !== undefined && (
                <li>
                  <span>Terminal (premissa)</span> <strong>{sc.terminalDays} dia(s) de logística e cópia</strong>
                </li>
              )}
            </ul>
            <label className={s.choice}>
              <span>Método</span>
              <select value={m ?? ''} disabled={disabled} onChange={(e) => onChange({ choices: { ...value.choices, [sc.id]: (e.target.value || undefined) as TransferMethod | undefined } })} aria-label={`Método para ${sc.name}`}>
                <option value="">Escolha…</option>
                {config.methods.map((x) => (
                  <option key={x} value={x}>
                    {METHOD_LABEL[x]}
                  </option>
                ))}
              </select>
            </label>
            {est && (
              <div className={s.est} aria-live="polite">
                <Clock size={16} aria-hidden="true" /> {est.available ? (est.days != null ? `≈ ${formatDays(est.days)}` : 'Tempo não estimado') : 'Indisponível neste cenário'}
                <ul>
                  {est.notes.map((n, i) => (
                    <li key={i}>{n}</li>
                  ))}
                </ul>
              </div>
            )}
            {evaluation && (
              <div className={s.compare}>
                <strong>Comparação (calculada pelo simulador)</strong>
                <ul>
                  {all.map((a) => (
                    <li key={a.method}>
                      <span className={s.mName}>
                        {a.ok ? <Check size={14} aria-hidden="true" /> : a.available ? <X size={14} aria-hidden="true" /> : <CircleSlash size={14} aria-hidden="true" />} {METHOD_LABEL[a.method]}
                      </span>
                      <span className={s.barWrap} aria-hidden="true">
                        {a.days != null && <span className={s.bar} data-ok={a.meetsDeadline} style={{ width: `${Math.min(100, (a.days / maxDays) * 100)}%` }} />}
                        <span className={s.deadline} style={{ left: `${(sc.deadlineDays / maxDays) * 100}%` }} />
                      </span>
                      <span className={s.days}>{a.available ? (a.days != null ? formatDays(a.days) : '—') : <Badge tone="warning">indisponível</Badge>}</span>
                    </li>
                  ))}
                </ul>
                <small>A linha vertical marca o prazo.</small>
              </div>
            )}
          </section>
        )
      })}
      <details className={s.simp}>
        <summary>Simplificações deste simulador</summary>
        <ul>
          <li>Tempo = volume × 8 ÷ (banda utilizável × 80% de aproveitamento), com TB decimal.</li>
          <li>Prazos de provisionamento do Direct Connect e de logística até o terminal são premissas de cada cenário, não dados da AWS.</li>
          <li>Custos de transferência não entram na comparação.</li>
        </ul>
      </details>
    </div>
  )
}
