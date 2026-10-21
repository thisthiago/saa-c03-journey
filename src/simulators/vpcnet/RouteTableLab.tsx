/** Interface do laboratório "Tabelas de rotas": o destino de 0.0.0.0/0 e ::/0 em cada sub-rede. */
import type { Evaluation } from '../../engine/types'
import { renderInline } from '../../ui/inline'
import { FactTag, PremiseTag } from '../shared/Tags'
import c from '../shared/compute.module.css'
import sh from '../shared/lab.module.css'
import n from '../shared/net.module.css'
import { NEED_LABEL, natWorks, targetLabel, type RouteTableLabConfig, type RouteTableLabResponse, type SubnetRoutes } from './routing'

interface Props {
  config: RouteTableLabConfig
  value: RouteTableLabResponse
  onChange: (v: RouteTableLabResponse) => void
  disabled: boolean
  evaluation?: Evaluation | null
}

export function RouteTableLab({ config, value, onChange, disabled, evaluation }: Props) {
  const set = (id: string, patch: Partial<SubnetRoutes>) => onChange({ tables: { ...value.tables, [id]: { ...(value.tables?.[id] ?? { v4: 'none', v6: 'none' }), ...patch } } })
  const v4Targets = ['none', 'igw', ...config.nats.map((n) => n.id)]
  return (
    <div className={sh.lab}>
      <p className={c.legend}>
        <FactTag date="21/10/2026" /> sub-rede pública é a que tem rota para o internet gateway; o NAT Gateway só deixa sair; o egress-only internet gateway faz o mesmo em IPv6 · <PremiseTag /> as sub-redes e o que cada uma precisa.
      </p>
      <ul className={c.needs}>
        {config.nats.map((n) => (
          <li key={n.id}>
            {n.name}: {n.regional ? 'NAT Gateway regional, sem sub-rede, presente em todas as AZs com recursos' : `fica na sub-rede ${config.subnets.find((s) => s.id === n.subnet)?.name}, na AZ ${n.az}`}
            {!n.regional && <span className={c.muted}> · {natWorks(config, value, n.id) ? 'alcança a internet' : 'sem saída: a sub-rede dele não tem rota para o internet gateway'}</span>}
          </li>
        ))}
      </ul>
      <div className={c.scroll}>
        <table className={c.table}>
          <thead>
            <tr>
              <th>Sub-rede</th>
              <th>AZ</th>
              <th>Precisa</th>
              <th>Rota 0.0.0.0/0</th>
              {config.ipv6 && <th>Rota ::/0</th>}
            </tr>
          </thead>
          <tbody>
            {config.subnets.map((s) => {
              const t = value.tables?.[s.id] ?? { v4: 'none', v6: 'none' }
              return (
                <tr key={s.id}>
                  <td>{s.name}</td>
                  <td className={c.mono}>{s.az}</td>
                  <td>
                    IPv4: {NEED_LABEL[s.v4]}
                    {s.v6 && (
                      <>
                        <br />
                        IPv6: {NEED_LABEL[s.v6]}
                      </>
                    )}
                  </td>
                  <td>
                    <select className={c.select} aria-label={`Rota 0.0.0.0/0 de ${s.name}`} value={t.v4} disabled={disabled} onChange={(e) => set(s.id, { v4: e.target.value })}>
                      {v4Targets.map((x) => (
                        <option key={x} value={x}>
                          {targetLabel(config, x)}
                        </option>
                      ))}
                    </select>
                  </td>
                  {config.ipv6 && (
                    <td>
                      {s.v6 ? (
                        <select className={c.select} aria-label={`Rota ::/0 de ${s.name}`} value={t.v6} disabled={disabled} onChange={(e) => set(s.id, { v6: e.target.value })}>
                          {['none', 'igw', 'eigw'].map((x) => (
                            <option key={x} value={x}>
                              {targetLabel(config, x)}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <span className={c.muted}>sem IPv6</span>
                      )}
                    </td>
                  )}
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
          <li>Cada tabela tem a rota local e só uma rota para a internet em cada família de endereços.</li>
          <li>As instâncias das sub-redes que recebem conexões da internet já têm IP público; security groups e network ACLs ficam para a fase seguinte.</li>
          <li>O custo do NAT Gateway e da transferência entre zonas não entra na nota; ele aparece na fase de acesso privado.</li>
        </ul>
      </details>
    </div>
  )
}
