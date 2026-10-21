/** Interface do laboratório "Tirar o tráfego da internet": o caminho de cada carga, com validade e custo ao vivo. */
import type { Evaluation } from '../../engine/types'
import { renderInline } from '../../ui/inline'
import { usd } from '../compute-prices'
import { NET_PRICE_DATE, networkPrices } from '../network-prices'
import { FactTag, PremiseTag } from '../shared/Tags'
import c from '../shared/compute.module.css'
import sh from '../shared/lab.module.css'
import type { EndpointsLabConfig, EndpointsLabResponse } from './lab'
import { PATH_LABEL, pathMonthly, pathProblems, SERVICE_LABEL, type PathKind } from './model'

interface Props {
  config: EndpointsLabConfig
  value: EndpointsLabResponse
  onChange: (v: EndpointsLabResponse) => void
  disabled: boolean
  evaluation?: Evaluation | null
}

const PATHS: PathKind[] = ['nat', 'gateway', 'interface']

export function EndpointsLab({ config, value, onChange, disabled, evaluation }: Props) {
  const p = networkPrices(config.region)
  return (
    <div className={sh.lab}>
      <p className={c.legend}>
        <FactTag date="21/10/2026" /> endpoint de gateway só para S3 e DynamoDB, sem custo, e só para quem está na VPC; endpoint de interface cobra por hora em cada AZ e por GB · preços da AWS Price List ({NET_PRICE_DATE}): NAT Gateway {usd(p.nat.hour)}/h e {usd(p.nat.perGB)}/GB; endpoint de interface {usd(p.interfaceEndpoint.hourPerAz)}/h por AZ e {usd(p.interfaceEndpoint.perGB)}/GB · <PremiseTag /> volumes e regras de cada carga.
      </p>
      {config.workloads.map((w) => {
        const pick = value.choices?.[w.id]
        const fb = evaluation?.items.find((i) => i.id === w.id)
        return (
          <section key={w.id} className={sh.card} aria-label={w.name}>
            <h4 className={sh.title}>
              {w.name} · {SERVICE_LABEL[w.service]}
            </h4>
            <p className={sh.desc}>{renderInline(w.description)}</p>
            <div className={c.scroll}>
              <table className={c.table}>
                <thead>
                  <tr>
                    <th>Caminho</th>
                    {evaluation && <th>Serve?</th>}
                    <th className={c.num}>Custo por mês</th>
                  </tr>
                </thead>
                <tbody>
                  {PATHS.map((k) => {
                    const pb = pathProblems(w, k)
                    const cost = pathMonthly(w, k, config.region)
                    return (
                      <tr key={k}>
                        <td>
                          <label>
                            <input type="radio" name={`ep-${w.id}`} checked={pick === k} disabled={disabled} onChange={() => onChange({ choices: { ...value.choices, [w.id]: k } })} /> {PATH_LABEL[k]}
                          </label>
                        </td>
                        {evaluation && <td className={c.muted}>{pb.length ? `não: ${pb.join('; ')}` : 'sim'}</td>}
                        <td className={c.num}>
                          {usd(cost.total)}
                          <br />
                          <span className={c.muted}>{cost.parts.join(' + ')}</span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
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
          <li>A transferência de dados para a internet e entre zonas fica fora da conta; entram só a hora e o GB processado de cada caminho.</li>
          <li>Quando o NAT Gateway já existe para outros usos, só o GB processado é cobrado desta carga.</li>
          <li>A política de endpoint, que limita o que passa pelo endpoint, não entra na nota.</li>
        </ul>
      </details>
    </div>
  )
}
