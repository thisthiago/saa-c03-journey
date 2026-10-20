/** Interface do laboratório de opções de compra: requisitos de cada parte da frota e o custo de cada opção. */
import type { Evaluation } from '../../engine/types'
import { renderInline } from '../../ui/inline'
import { HOURS_PER_MONTH, PRICE_DATE, usd } from '../compute-prices'
import { FactTag, PremiseTag } from '../shared/Tags'
import c from '../shared/compute.module.css'
import sh from '../shared/lab.module.css'
import s from '../support/support.module.css'
import type { PurchaseLabConfig, PurchaseLabResponse } from './lab'
import { OPTIONS, segmentMonthly, SPOT_DISCOUNT, type Segment } from './model'

interface Props {
  config: PurchaseLabConfig
  value: PurchaseLabResponse
  onChange: (v: PurchaseLabResponse) => void
  disabled: boolean
  evaluation?: Evaluation | null
}

function reqs(seg: Segment): string[] {
  const out = [`${seg.count} × ${seg.type}, ${seg.hoursPerDay === 24 ? 'o dia inteiro' : `${seg.hoursPerDay} horas por dia`}`]
  out.push(seg.interruptible ? 'aguenta ser interrompida e retomada' : 'não pode ser interrompida')
  out.push(`vai existir por mais ${seg.horizonMonths} ${seg.horizonMonths === 1 ? 'mês' : 'meses'}`)
  if (seg.needsCapacity) out.push('precisa de capacidade garantida numa AZ')
  if (seg.familyChange) out.push('vai migrar para outra família de instância')
  if (seg.regionChange) out.push('vai mudar de Região')
  if (seg.fargateMigration) out.push('vai migrar para contêineres no Fargate')
  return out
}

export function PurchaseLab({ config, value, onChange, disabled, evaluation }: Props) {
  return (
    <div className={sh.lab}>
      <details className={c.ref} open>
        <summary>Como cada opção cobra</summary>
        <ul className={c.needs}>
          <li>
            <strong>On-Demand</strong>: só as horas em que a instância roda.
          </li>
          <li>
            <strong>Savings Plans e Reserved Instances</strong>: compromisso de 1 ou 3 anos, cobrado as {HOURS_PER_MONTH} horas do mês, use ou não. Compute SP vale para qualquer família, Região e para o Fargate; EC2 Instance SP e RI Standard ficam presos à família na Região; RI Convertible pode ser trocada por outra família.
          </li>
          <li>
            <strong>Spot</strong>: capacidade sobrando, com desconto, que pode ser interrompida com aviso de 2 minutos. Aqui o desconto é de {Math.round(SPOT_DISCOUNT * 100)}% <PremiseTag />
          </li>
          <li>
            <strong>Capacity Reservation</strong> (ou RI zonal): reserva capacidade numa AZ e cobra o preço cheio, use ou não.
          </li>
        </ul>
        <p className={c.legend}>
          <FactTag date="20/10/2026" /> preços sem pagamento antecipado da AWS Price List ({PRICE_DATE}), Linux, {config.region ?? 'us-east-1'}.
        </p>
      </details>

      {config.segments.map((seg) => {
        const pick = value.choices?.[seg.id]
        const fb = evaluation?.items.find((i) => i.id === seg.id)
        return (
          <section key={seg.id} className={sh.card} aria-label={seg.name}>
            <h4 className={sh.title}>{seg.name}</h4>
            <p className={sh.desc}>{renderInline(seg.description)}</p>
            <ul className={c.needs}>
              {reqs(seg).map((r) => (
                <li key={r}>{r}</li>
              ))}
            </ul>
            <div className={s.choices} role="radiogroup" aria-label={`Opção de compra para ${seg.name}`}>
              {config.options.map((o) => (
                <button key={o} type="button" role="radio" aria-checked={pick === o} className={`${s.choice} pick-card`} disabled={disabled} onClick={() => onChange({ choices: { ...value.choices, [seg.id]: o } })}>
                  <strong>{OPTIONS[o].short}</strong>
                  <span>{usd(segmentMonthly(seg, o, config.region))}/mês</span>
                </button>
              ))}
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
          <li>O preço do Spot varia com a oferta e a procura; aqui ele é um desconto fixo, premissa do cenário.</li>
          <li>Cada compromisso cobre exatamente as instâncias do segmento. Na AWS, um Savings Plan é um valor em dólares por hora que se aplica primeiro onde dá mais desconto.</li>
          <li>Só a opção sem pagamento antecipado (No Upfront). All Upfront e Partial Upfront dão um pouco mais de desconto.</li>
        </ul>
      </details>
    </div>
  )
}
