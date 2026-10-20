/** Interface do Support Plan Challenge: comparativo dos planos vigentes e escolha por organização. */
import type { Evaluation } from '../../engine/types'
import { renderInline } from '../../ui/inline'
import { FactTag, PremiseTag } from '../shared/Tags'
import sh from '../shared/lab.module.css'
import type { SupportLabConfig, SupportLabResponse } from './lab'
import { formatMinutes, formatUSD, monthlyCost, PLANS, SEVERITIES, SEVERITY_LABEL, type PlanId, type SupportNeeds } from './model'
import s from './support.module.css'

interface Props {
  config: SupportLabConfig
  value: SupportLabResponse
  onChange: (v: SupportLabResponse) => void
  disabled: boolean
  evaluation?: Evaluation | null
}

const TA_LABEL = { basic: 'cotas + alguns checks de segurança e tolerância a falhas', all: 'todos os checks + API', 'all+priority': 'todos os checks + API + Trusted Advisor Priority' }

function needsList(n: SupportNeeds): string[] {
  const out: string[] = []
  if (n.technicalCases) out.push('abrir casos técnicos')
  if (n.prodDownWithinMin !== undefined) out.push(`resposta em até ${formatMinutes(n.prodDownWithinMin)} com a produção fora do ar`)
  if (n.criticalWithinMin !== undefined) out.push(`resposta em até ${formatMinutes(n.criticalWithinMin)} com sistema crítico fora do ar`)
  if (n.designatedTam) out.push('um TAM designado (orientação proativa)')
  if (n.allTrustedAdvisorChecks) out.push('todos os checks do Trusted Advisor')
  if (n.securityIncidentResponse) out.push('apoio especializado em incidentes de segurança')
  if (n.domainSpecialists) out.push('especialistas designados atuando como extensão da equipe')
  if (out.length === 0) out.push('apenas dúvidas de conta, cobrança e cotas')
  return out
}

export function SupportLab({ config, value, onChange, disabled, evaluation }: Props) {
  return (
    <div className={sh.lab}>
      <details className={s.compare} open>
        <summary>Comparativo dos planos vigentes</summary>
        <p className={s.legend}>
          <FactTag /> conferido na documentação e na página de preços da AWS. Tempos de primeira resposta: a AWS faz "todo esforço razoável" para cumpri-los; não são prazos de solução.
        </p>
        <div className={s.plans}>
          {config.plans.map((id) => {
            const p = PLANS[id]
            return (
              <article key={id} className={s.plan}>
                <h5>{p.name}</h5>
                <p>{p.channels}</p>
                <dl>
                  {SEVERITIES.map((sev) => (
                    <span key={sev} className={s.pair}>
                      <dt>{SEVERITY_LABEL[sev].name}</dt>
                      <dd>{formatMinutes(p.response[sev])}</dd>
                    </span>
                  ))}
                  <dt>Trusted Advisor</dt>
                  <dd>{TA_LABEL[p.trustedAdvisor]}</dd>
                  <dt>TAM</dt>
                  <dd>{p.tam === 'designated' ? 'designado' : 'não'}</dd>
                  <dt>Preço</dt>
                  <dd>{p.pricing ? `mínimo ${formatUSD(p.pricing.minimum)}/mês ou % do gasto` : 'incluído'}</dd>
                </dl>
                {p.extras.length > 0 && <p className={s.extras}>{p.extras.join(' · ')}</p>}
              </article>
            )
          })}
        </div>
      </details>

      {config.scenarios.map((sc) => {
        const pick = value.choices?.[sc.id]
        const fb = evaluation?.items.find((i) => i.id === sc.id)
        return (
          <section key={sc.id} className={sh.card} aria-label={sc.name}>
            <h4 className={sh.title}>{sc.name}</h4>
            <p className={sh.desc}>{renderInline(sc.description)}</p>
            <p className={s.spend}>
              Gasto mensal com a AWS: <strong>{formatUSD(sc.awsMonthlySpend)}</strong> <PremiseTag />
            </p>
            <ul className={s.needs}>
              {needsList(sc.needs).map((n) => (
                <li key={n}>{n}</li>
              ))}
            </ul>
            <div className={s.choices} role="radiogroup" aria-label={`Plano para ${sc.name}`}>
              {config.plans.map((id: PlanId) => (
                <button key={id} type="button" role="radio" aria-checked={pick === id} className={`${s.choice} pick-card`} disabled={disabled} onClick={() => onChange({ choices: { ...value.choices, [sc.id]: id } })}>
                  <strong>{PLANS[id].name}</strong>
                  <span>{PLANS[id].pricing ? `${formatUSD(monthlyCost(id, sc.awsMonthlySpend))}/mês` : 'sem custo'}</span>
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
          <li>O custo usa só as faixas públicas sobre o gasto mensal do cenário: sem preços regionais especiais, créditos, descontos ou complementos (Countdown Premium, Incident Detection and Response).</li>
          <li>O Business Support+ é cobrado por conta; os cenários consideram uma conta.</li>
          <li>Planos e preços conferidos em 18/10/2026. Confira a página oficial antes de contratar.</li>
        </ul>
      </details>
    </div>
  )
}
