/** Interface do laboratório "Quem usa a chave": statements e grants à esquerda, resultado de cada pedido ao vivo. */
import type { Evaluation } from '../../engine/types'
import { renderInline } from '../../ui/inline'
import c from '../shared/compute.module.css'
import sh from '../shared/lab.module.css'
import n from '../shared/net.module.css'
import { FactTag, PremiseTag } from '../shared/Tags'
import { kmsWorld, principalName, type KmsLabConfig, type KmsLabResponse } from './lab'
import { ACTION_LABEL, kmsDecide } from './model'

interface Props {
  config: KmsLabConfig
  value: KmsLabResponse
  onChange: (v: KmsLabResponse) => void
  disabled: boolean
  evaluation?: Evaluation | null
}

export function KmsLab({ config, value, onChange, disabled, evaluation }: Props) {
  const picked = value.picked ?? []
  const world = kmsWorld(config, picked)
  const toggle = (id: string, on: boolean) => onChange({ picked: on ? [...picked, id] : picked.filter((x) => x !== id) })
  return (
    <div className={sh.lab}>
      <p className={c.legend}>
        <FactTag date="22/10/2026" /> a key policy precisa permitir explicitamente; o statement da conta habilita as políticas IAM; um grant só permite · <PremiseTag /> as roles, a chave e os pedidos.
      </p>
      <section className={sh.card} aria-label="Key policy e grants">
        <h4 className={sh.title}>Key policy e grants da {config.key.label}</h4>
        <ul className={n.group}>
          {config.palette.map((p) => (
            <li key={p.id}>
              <label>
                <input type="checkbox" checked={picked.includes(p.id)} disabled={disabled} onChange={(e) => toggle(p.id, e.target.checked)} /> <span>{renderInline(p.label)}</span>
              </label>
            </li>
          ))}
        </ul>
      </section>
      <div className={c.scroll}>
        <table className={c.table} aria-label="Resultado de cada pedido">
          <thead>
            <tr>
              <th>Quem</th>
              <th>Pedido</th>
              <th>Resultado agora</th>
            </tr>
          </thead>
          <tbody>
            {config.requests.map((req) => {
              const d = kmsDecide(world, { principalId: req.principalId, action: req.action })
              return (
                <tr key={req.id}>
                  <th>{principalName(config, req.principalId)}</th>
                  <td>{ACTION_LABEL[req.action] ?? req.action}</td>
                  <td className={n.status} data-ok={d.allowed ? 'true' : 'false'}>
                    {d.allowed ? `permitido${d.via === 'grant' ? ' (grant)' : ''}` : d.explicitDeny ? 'negado (Deny explícito)' : 'negado'}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      {evaluation && (
        <ul className={n.verdicts}>
          {evaluation.items.map((i) => (
            <li key={i.id} className={sh.verdict} data-status={i.status}>
              <strong>{i.label}</strong>
              <span>{renderInline(i.message ?? '')}</span>
            </li>
          ))}
        </ul>
      )}
      <details className={sh.simp}>
        <summary>Simplificações deste simulador</summary>
        <ul>
          <li>As políticas IAM de cada role estão fixas no cenário; o laboratório muda só a key policy e os grants.</li>
          <li>Um Deny explícito vence também os grants. Restrições de grant, tokens de grant e grants entre contas não são simulados.</li>
          <li>A chave e as contas são fictícias.</li>
        </ul>
      </details>
    </div>
  )
}
