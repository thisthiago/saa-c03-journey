/** Interface do laboratório de gateway híbrido: cada sistema local, o gateway escolhido e o destino na AWS. */
import { ArrowRight, Building2, Cloud, Server } from 'lucide-react'
import type { Evaluation } from '../../engine/types'
import { Badge } from '../../ui/kit'
import type { GatewayLabConfig, GatewayLabResponse } from './lab'
import { GATEWAYS, PROTOCOL_LABEL, type GatewayChoice } from './model'
import s from './gateway.module.css'

interface Props {
  config: GatewayLabConfig
  value: GatewayLabResponse
  onChange: (v: GatewayLabResponse) => void
  disabled: boolean
  evaluation?: Evaluation | null
}

export function GatewayLab({ config, value, onChange, disabled }: Props) {
  return (
    <div className={s.lab}>
      <ol className={s.rows}>
        {config.workloads.map((w) => {
          const g = value.choices?.[w.id]
          const info = g ? GATEWAYS[g] : null
          return (
            <li key={w.id} className={s.row}>
              <div className={s.site}>
                <span className={s.label}>
                  <Building2 size={16} aria-hidden="true" /> No local
                </span>
                <strong>{w.name}</strong>
                <p>{w.description}</p>
                <Badge>{PROTOCOL_LABEL[w.protocol]}</Badge>
              </div>
              <ArrowRight className={s.arrow} size={20} aria-hidden="true" />
              <div className={s.gw}>
                <label>
                  <span className={s.label}>
                    <Server size={16} aria-hidden="true" /> Gateway
                  </span>
                  <select value={g ?? ''} disabled={disabled} onChange={(e) => onChange({ choices: { ...value.choices, [w.id]: (e.target.value || undefined) as GatewayChoice | undefined } })} aria-label={`Gateway para ${w.name}`}>
                    <option value="">Escolha…</option>
                    {config.options.map((o) => (
                      <option key={o} value={o}>
                        {GATEWAYS[o].name}
                        {GATEWAYS[o].newCustomers ? '' : ' (sem novos clientes)'}
                      </option>
                    ))}
                  </select>
                </label>
                {info && <small>Protocolos: {info.protocols.join(', ')}</small>}
              </div>
              <ArrowRight className={s.arrow} size={20} aria-hidden="true" />
              <div className={s.aws}>
                <span className={s.label}>
                  <Cloud size={16} aria-hidden="true" /> Na AWS
                </span>
                <p>{info ? info.target : 'Escolha um gateway para ver onde os dados ficam.'}</p>
              </div>
            </li>
          )
        })}
      </ol>
      <details className={s.simp}>
        <summary>Simplificações deste simulador</summary>
        <ul>
          <li>Não considera tamanho de cache, banda, cotas nem o comportamento detalhado durante quedas de conexão.</li>
          <li>O destino mostrado é o padrão de cada tipo de gateway.</li>
        </ul>
      </details>
    </div>
  )
}
