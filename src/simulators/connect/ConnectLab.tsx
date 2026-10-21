/** Interface do laboratório "Conectar as VPCs": a topologia de cada cenário, com alcance, conexões e custo ao vivo. */
import type { Evaluation } from '../../engine/types'
import { renderInline } from '../../ui/inline'
import { usd } from '../compute-prices'
import { NET_PRICE_DATE, networkPrices } from '../network-prices'
import { FactTag, JudgementTag, PremiseTag } from '../shared/Tags'
import c from '../shared/compute.module.css'
import sh from '../shared/lab.module.css'
import n from '../shared/net.module.css'
import { checkOption, type ConnectLabConfig, type ConnectLabResponse } from './lab'
import { reaches } from './model'

interface Props {
  config: ConnectLabConfig
  value: ConnectLabResponse
  onChange: (v: ConnectLabResponse) => void
  disabled: boolean
  evaluation?: Evaluation | null
}

export function ConnectLab({ config, value, onChange, disabled, evaluation }: Props) {
  const p = networkPrices(config.region).transitGateway
  return (
    <div className={sh.lab}>
      <p className={c.legend}>
        <FactTag date="21/10/2026" /> peering é um para um, sem transitividade e sem blocos sobrepostos; o Transit Gateway roteia pelas tabelas de cada anexo · preços da AWS Price List ({NET_PRICE_DATE}): {usd(p.attachmentHour)} por hora de anexo e {usd(p.perGB)} por GB processado · <PremiseTag /> volume de dados e limite de conexões · <JudgementTag /> desempate pelo menor custo.
      </p>
      {config.scenarios.map((s) => {
        const pick = value.choices?.[s.id] ?? ''
        const opt = s.options.find((o) => o.id === pick)
        const k = opt ? checkOption(s, opt, config.region) : undefined
        const fb = evaluation?.items.find((i) => i.id === s.id)
        const name = (id: string) => s.nets.find((x) => x.id === id)!.name
        return (
          <section key={s.id} className={sh.card} aria-label={s.name}>
            <h4 className={sh.title}>{s.name}</h4>
            <p className={sh.desc}>{renderInline(s.description)}</p>
            <p className={sh.desc}>
              Redes:{' '}
              {s.nets.map((x, i) => (
                <span key={x.id}>
                  {i > 0 && ', '}
                  {x.name} <span className={c.mono}>{x.cidr}</span>
                </span>
              ))}
            </p>
            <ul className={c.needs}>
              {s.mustReach.map(([a, b]) => {
                const ok = opt ? reaches(s.nets, opt.topology, a, b).ok : undefined
                return (
                  <li key={`${a}-${b}`}>
                    {ok !== undefined && <span className={n.status} data-ok={ok}>{ok ? '✓ ' : '✗ '}</span>}
                    {name(a)} precisa alcançar {name(b)}
                  </li>
                )
              })}
              {s.mustNotReach.map(([a, b]) => {
                const ok = opt ? !reaches(s.nets, opt.topology, a, b).ok : undefined
                return (
                  <li key={`${a}-${b}-no`}>
                    {ok !== undefined && <span className={n.status} data-ok={ok}>{ok ? '✓ ' : '✗ '}</span>}
                    {name(a)} não pode alcançar {name(b)}
                  </li>
                )
              })}
              <li>
                Cerca de {s.gbMonth.toLocaleString('pt-BR')} GB por mês entre as redes; a equipe aceita manter até {s.maxConnections} conexões
              </li>
            </ul>
            <label className={c.field}>
              <span>Topologia</span>
              <select className={c.select} value={pick} disabled={disabled} onChange={(e) => onChange({ choices: { ...value.choices, [s.id]: e.target.value } })}>
                <option value="">Escolha uma opção</option>
                {s.options.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.label}
                  </option>
                ))}
              </select>
            </label>
            {k && (
              <p className={c.cost} aria-live="polite">
                {k.problems.length ? `Não dá para montar: ${k.problems.join('; ')}.` : `${k.connections} ${k.connections === 1 ? 'conexão' : 'conexões'} para manter · ${usd(k.monthly)}/mês`}
              </p>
            )}
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
          <li>O peering não tem custo por hora nem por GB processado; a transferência entre zonas, que vale igual nos dois caminhos, fica fora da conta.</li>
          <li>Todo anexo ao Transit Gateway, de VPC ou de VPN, custa o preço do anexo de VPC; a hora da conexão VPN, que existe nos dois casos, fica fora.</li>
          <li>O limite de conexões que a equipe aceita manter é uma premissa do cenário, que representa o esforço de operação.</li>
        </ul>
      </details>
    </div>
  )
}
