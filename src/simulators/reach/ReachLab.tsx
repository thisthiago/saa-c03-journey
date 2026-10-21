/** Interface do laboratório "O pacote chega?": regras para ligar e o resultado de cada fluxo, ao vivo. */
import type { Evaluation } from '../../engine/types'
import { renderInline } from '../../ui/inline'
import { FactTag, PremiseTag } from '../shared/Tags'
import c from '../shared/compute.module.css'
import sh from '../shared/lab.module.css'
import n from '../shared/net.module.css'
import { applyRules, judgeFlow, type ReachLabConfig, type ReachLabResponse } from './lab'
import { OUTCOME_LABEL, traceFlow } from './model'

interface Props {
  config: ReachLabConfig
  value: ReachLabResponse
  onChange: (v: ReachLabResponse) => void
  disabled: boolean
  evaluation?: Evaluation | null
}

export function ReachLab({ config, value, onChange, disabled, evaluation }: Props) {
  const enabled = value.enabled ?? config.initial
  const w = applyRules(config, enabled)
  const toggle = (id: string, on: boolean) => onChange({ enabled: on ? [...enabled, id] : enabled.filter((x) => x !== id) })
  const targetName = (id: string) => {
    const p = config.palette.find((x) => x.id === id)!.target
    if (p.kind === 'sg-in') return `Security group ${config.world.groups.find((g) => g.id === p.sg)?.name}: entrada`
    const s = config.world.subnets.find((x) => x.id === p.subnet)?.name
    return `Network ACL da sub-rede ${s}: ${p.kind === 'nacl-in' ? 'entrada' : 'saída'}`
  }
  const groups = [...new Set(config.palette.map((p) => targetName(p.id)))]
  return (
    <div className={sh.lab}>
      <p className={c.legend}>
        <FactTag date="21/10/2026" /> security group só permite e tem estado; network ACL permite e nega, segue a ordem dos números, termina na regra marcada com asterisco, que nega o resto, e não tem estado · <PremiseTag /> as instâncias, os endereços e as portas efêmeras dos clientes.
      </p>
      <ul className={c.needs}>
        {config.world.instances.map((i) => {
          const s = config.world.subnets.find((x) => x.id === i.subnet)!
          return (
            <li key={i.id}>
              {i.name}: <span className={c.mono}>{i.ip}</span> na sub-rede {s.name} ({s.cidr}, {s.public ? 'pública' : 'privada'}){i.publicIp ? ', com IP público' : ''}, security group {config.world.groups.find((g) => g.id === i.sg)?.name}
            </li>
          )
        })}
      </ul>
      <div className={n.columns}>
        {groups.map((g) => (
          <section key={g} className={sh.card} aria-label={g}>
            <h4 className={sh.title}>{g}</h4>
            <ul className={n.group}>
              {config.palette
                .filter((p) => targetName(p.id) === g)
                .map((p) => (
                  <li key={p.id}>
                    <label>
                      <input type="checkbox" checked={enabled.includes(p.id)} disabled={disabled} onChange={(e) => toggle(p.id, e.target.checked)} />
                      <span className={c.mono}>{p.label}</span>
                    </label>
                  </li>
                ))}
            </ul>
          </section>
        ))}
      </div>
      <section className={sh.card} aria-label="Fluxos">
        <h4 className={sh.title}>Fluxos de teste</h4>
        <div className={c.scroll}>
          <table className={c.table}>
            <thead>
              <tr>
                <th>Fluxo</th>
                <th>Requisito</th>
                <th>Resultado agora</th>
              </tr>
            </thead>
            <tbody>
              {config.flows.map((f) => {
                const r = traceFlow(w, f)
                const ok = judgeFlow(w, f).score === 1
                return (
                  <tr key={f.id}>
                    <td>{f.label}</td>
                    <td>{f.expect === 'allow' ? 'precisa funcionar' : 'precisa ser bloqueado'}</td>
                    <td>
                      <span className={n.status} data-ok={ok}>
                        {ok ? '✓' : '✗'}
                      </span>{' '}
                      {OUTCOME_LABEL[r.outcome]}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </section>
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
          <li>Só conexões TCP em IPv4. As regras de IPv6 e de outros protocolos ficam de fora.</li>
          <li>A internet chega pelo internet gateway só a instâncias com IP público em sub-rede pública; não há NAT nem tráfego entre VPCs.</li>
          <li>Os security groups usam a regra padrão de saída, que permite tudo.</li>
        </ul>
      </details>
    </div>
  )
}
