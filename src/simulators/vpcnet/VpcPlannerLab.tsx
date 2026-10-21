/** Interface do laboratório "Plano de endereços": bloco da VPC, sub-redes e conferência ao vivo. */
import type { Evaluation } from '../../engine/types'
import { renderInline } from '../../ui/inline'
import { FactTag, PremiseTag } from '../shared/Tags'
import c from '../shared/compute.module.css'
import sh from '../shared/lab.module.css'
import n from '../shared/net.module.css'
import { blockSize, isCidr, parseCidr, usableIps } from './model'
import { subnetProblems, vpcChoiceProblems, type VpcPlannerLabConfig, type VpcPlannerLabResponse } from './planner'

interface Props {
  config: VpcPlannerLabConfig
  value: VpcPlannerLabResponse
  onChange: (v: VpcPlannerLabResponse) => void
  disabled: boolean
  evaluation?: Evaluation | null
}

export function VpcPlannerLab({ config, value, onChange, disabled, evaluation }: Props) {
  const vpcProblems = value.vpc ? vpcChoiceProblems(config, value.vpc) : []
  const setSubnet = (id: string, text: string) => onChange({ ...value, subnets: { ...value.subnets, [id]: text } })
  return (
    <div className={sh.lab}>
      <p className={c.legend}>
        <FactTag date="21/10/2026" /> blocos de /16 a /28; em cada sub-rede, os quatro primeiros endereços e o último são reservados; sub-redes da mesma VPC não se sobrepõem · <PremiseTag /> as redes existentes e o número de recursos de cada sub-rede.
      </p>
      <section className={sh.card} aria-label="Bloco da VPC">
        <h4 className={sh.title}>1. Bloco da VPC</h4>
        <ul className={c.needs}>
          {config.existing.map((e) => (
            <li key={e.name}>
              Rede já existente: {e.name} <span className={c.mono}>{e.cidr}</span>
            </li>
          ))}
        </ul>
        <label className={c.field}>
          <span>Bloco CIDR da VPC</span>
          <select className={c.select} value={value.vpc} disabled={disabled} onChange={(e) => onChange({ ...value, vpc: e.target.value })}>
            <option value="">Escolha um bloco</option>
            {config.vpcOptions.map((o) => (
              <option key={o.cidr} value={o.cidr}>
                {o.cidr}
                {o.note ? `: ${o.note}` : ''}
              </option>
            ))}
          </select>
        </label>
        {value.vpc && (
          <p className={c.cost} aria-live="polite">
            {vpcProblems.length ? `Problema: o bloco ${vpcProblems.join('; ')}.` : `Aceito: ${blockSize((parseCidr(value.vpc) as { prefix: number }).prefix).toLocaleString('pt-BR')} endereços.`}
          </p>
        )}
      </section>
      <section className={sh.card} aria-label="Sub-redes">
        <h4 className={sh.title}>2. Sub-redes</h4>
        <div className={c.scroll}>
          <table className={c.table}>
            <thead>
              <tr>
                <th>Sub-rede</th>
                <th>AZ</th>
                <th className={c.num}>Recursos</th>
                <th>Bloco CIDR</th>
                <th>Conferência</th>
              </tr>
            </thead>
            <tbody>
              {config.subnets.map((s) => {
                const text = value.subnets?.[s.id] ?? ''
                const parsed = parseCidr(text.trim())
                const pb = text.trim() ? subnetProblems(config, value, s.id) : []
                return (
                  <tr key={s.id}>
                    <td>{s.name}</td>
                    <td className={c.mono}>{s.az}</td>
                    <td className={c.num}>{s.hosts}</td>
                    <td>
                      <input className={`${c.input} ${c.mono}`} aria-label={`Bloco da sub-rede ${s.name}`} placeholder="10.0.0.0/24" value={text} disabled={disabled} onChange={(e) => setSubnet(s.id, e.target.value)} size={16} />
                    </td>
                    <td className={c.muted}>{!text.trim() ? '' : pb.length ? pb.join('; ') : isCidr(parsed) ? `ok: ${usableIps(parsed.prefix)} endereços utilizáveis` : ''}</td>
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
          <li>Só IPv4. Uma VPC pode ter blocos IPv6 e blocos IPv4 secundários, que ficam de fora.</li>
          <li>Um bloco que não começa no início do seu tamanho (como 10.0.0.18/24) é tratado como erro; a API o converteria para a forma canônica (10.0.0.0/24).</li>
          <li>Não há reserva para crescimento: basta que cada sub-rede comporte os recursos pedidos.</li>
        </ul>
      </details>
    </div>
  )
}
