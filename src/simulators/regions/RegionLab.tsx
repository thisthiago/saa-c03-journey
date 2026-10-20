/** Interface da escolha de Região: requisitos, fatos verificados e premissas lado a lado. */
import { Check, X } from 'lucide-react'
import type { Evaluation } from '../../engine/types'
import { renderInline } from '../../ui/inline'
import { FactTag, PremiseTag } from '../shared/Tags'
import sh from '../shared/lab.module.css'
import { labPrice, type RegionLabConfig, type RegionLabResponse } from './lab'
import { evaluateRegion, FEATURE_LABEL, formatMs } from './model'
import s from './regions.module.css'

interface Props {
  config: RegionLabConfig
  value: RegionLabResponse
  onChange: (v: RegionLabResponse) => void
  disabled: boolean
  evaluation?: Evaluation | null
}

const usd = (n: number) => `US$ ${n.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

export function RegionLab({ config, value, onChange, disabled, evaluation }: Props) {
  return (
    <div className={sh.lab}>
      {config.scenarios.map((sc) => {
        const pick = value.choices?.[sc.id]
        const fb = evaluation?.items.find((i) => i.id === sc.id)
        const req = sc.requirements
        return (
          <section key={sc.id} className={sh.card} aria-label={sc.title}>
            <h4 className={sh.title}>{sc.title}</h4>
            <p className={sh.desc}>{renderInline(sc.description)}</p>
            <ul className={s.reqs} aria-label="Requisitos">
              {req.residency && (
                <li>
                  <strong>Residência dos dados:</strong> {req.residency.countries.join(', ')} — {req.residency.reason} <PremiseTag label="Exigência do cenário" />
                </li>
              )}
              {(req.features ?? []).map((f) => (
                <li key={f}>
                  <strong>Recurso necessário:</strong> {FEATURE_LABEL[f]}
                </li>
              ))}
              {req.maxLatency && (
                <li>
                  <strong>Latência máxima:</strong> {req.maxLatency.ms} ms para {sc.groups.find((g) => g.id === req.maxLatency!.group)?.label} <PremiseTag label="Exigência do cenário" />
                </li>
              )}
              <li>
                <strong>Critério de desempate:</strong> {sc.priority === 'latency' ? 'menor latência média para os usuários' : 'menor custo'}
              </li>
              <li>
                <strong>Usuários:</strong> {sc.groups.map((g) => `${g.label} (${Math.round(g.share * 100)}%)`).join(' · ')}
              </li>
            </ul>
            <div className={s.legend}>
              <FactTag /> país, AZs, opt-in e recursos · preço do S3 Standard da tabela de preços
              <PremiseTag /> latências
            </div>
            <div className={s.options} role="radiogroup" aria-label={`Região para ${sc.title}`}>
              {sc.candidates.map((code) => {
                const e = evaluateRegion(sc, code, labPrice)
                const checked = pick === code
                return (
                  <button
                    key={code}
                    type="button"
                    role="radio"
                    aria-checked={checked}
                    className={`${s.option} pick-card`}
                    disabled={disabled}
                    onClick={() => onChange({ choices: { ...value.choices, [sc.id]: code } })}
                  >
                    <span className={s.code}>{code}</span>
                    <span className={s.name}>{e.fact.name}</span>
                    <dl className={s.facts}>
                      <dt>País</dt>
                      <dd>{e.fact.country}</dd>
                      <dt>AZs</dt>
                      <dd>{e.fact.azs}</dd>
                      <dt>Opt-in</dt>
                      <dd>{e.fact.optIn ? 'sim' : 'não'}</dd>
                      {(req.features ?? []).includes('s3-express-one-zone') && (
                        <>
                          <dt>S3 Express One Zone</dt>
                          <dd>{e.fact.s3ExpressOneZone ? 'disponível' : 'indisponível'}</dd>
                        </>
                      )}
                      {sc.groups.map((g) => (
                        <span key={g.id} className={s.pair}>
                          <dt>Latência · {g.label}</dt>
                          <dd>{formatMs(sc.latencyMs[code]?.[g.id] ?? 0)}</dd>
                        </span>
                      ))}
                      <dt>S3 Standard ({sc.storageGB.toLocaleString('pt-BR')} GB)</dt>
                      <dd>{usd(e.monthlyStorageUSD)}/mês</dd>
                    </dl>
                    {evaluation && (
                      <span className={s.check} data-ok={e.violations.length === 0}>
                        {e.violations.length === 0 ? <Check size={14} aria-hidden="true" /> : <X size={14} aria-hidden="true" />}
                        {e.violations.length === 0 ? 'atende aos requisitos' : e.violations.map((v) => v.kind === 'residency' ? 'residência' : v.kind === 'feature' ? 'recurso' : 'latência').join(', ')}
                      </span>
                    )}
                  </button>
                )
              })}
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
          <li>As latências são premissas ilustrativas de cada cenário, não medições da AWS. Meça a partir dos seus usuários antes de decidir.</li>
          <li>O custo compara só o armazenamento no S3 Standard (primeira faixa da tabela de preços). Outros serviços têm diferenças de preço próprias.</li>
          <li>Disponibilidade de recursos e lista de Regiões conferidas em 18/10/2026; a AWS amplia ambas com frequência.</li>
          <li>Exigências de residência são contratuais do cenário; nenhuma lei é citada.</li>
        </ul>
      </details>
    </div>
  )
}
