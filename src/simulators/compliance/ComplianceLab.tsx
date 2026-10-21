/** Interface do laboratório do AWS Config: inventário, regras com remediação e o resultado de conformidade antes e depois. */
import type { Evaluation } from '../../engine/types'
import { renderInline } from '../../ui/inline'
import { usd } from '../compute-prices'
import { governancePrices, GOV_PRICE_DATE } from '../governance-prices'
import { FactTag, PremiseTag } from '../shared/Tags'
import c from '../shared/compute.module.css'
import sh from '../shared/lab.module.css'
import { complianceLabInitial, monthlyEvaluations, type ComplianceLabConfig, type ComplianceLabResponse, type ComplianceScenario } from './lab'
import { evaluationsCost, RULES, runRules, TYPE_LABEL, type CfgResource, type RuleChoice } from './model'

interface Props {
  config: ComplianceLabConfig
  value: ComplianceLabResponse
  onChange: (v: ComplianceLabResponse) => void
  disabled: boolean
  evaluation?: Evaluation | null
}

const ATTR_TEXT: Record<string, [string, string]> = {
  publicRead: ['leitura pública', 'sem leitura pública'],
  encrypted: ['criptografado', 'sem criptografia'],
  sshOpen: ['SSH aberto para todos', 'SSH restrito'],
  publiclyAccessible: ['acesso público', 'sem acesso público'],
  managedBySsm: ['gerenciada pelo Systems Manager', 'fora do Systems Manager'],
  rootMfa: ['MFA no usuário root', 'sem MFA no usuário root'],
}

const describe = (r: CfgResource) =>
  [...Object.entries(r.attrs).map(([k, v]) => ATTR_TEXT[k]?.[v ? 0 : 1] ?? `${k}: ${v ? 'sim' : 'não'}`), ...(r.tags && Object.keys(r.tags).length ? [`tags: ${Object.entries(r.tags).map(([k, v]) => `${k}=${v}`).join(', ')}`] : ['sem tags'])].join(' · ')

const RESULT_TEXT = { COMPLIANT: 'em conformidade', NON_COMPLIANT: 'fora do padrão', NOT_APPLICABLE: 'não se aplica' } as const

export function ComplianceLab({ config, value, onChange, disabled, evaluation }: Props) {
  const cost = governancePrices(config.region).config
  const initial = complianceLabInitial(config)
  const set = (s: ComplianceScenario, ruleId: string, patch: Partial<RuleChoice>) => {
    const cur = value.choices?.[s.id] ?? initial.choices[s.id] ?? {}
    const prev = cur[ruleId] ?? { on: false, mode: 'none' as const }
    onChange({ choices: { ...value.choices, [s.id]: { ...cur, [ruleId]: { ...prev, ...patch } } } })
  }
  return (
    <div className={sh.lab}>
      <p className={c.legend}>
        <FactTag date="21/10/2026" /> o Config avalia os recursos com regras gerenciadas ou personalizadas e mostra COMPLIANT, NON_COMPLIANT ou NOT_APPLICABLE; a remediação usa documentos de automação do Systems Manager, de forma manual ou automática · <PremiseTag /> os recursos, as mudanças por mês e os documentos de automação que a equipe tem · preços da AWS Price List ({GOV_PRICE_DATE}): {usd(cost.ruleEvaluation)} por avaliação de regra.
      </p>
      {config.scenarios.map((s) => {
        const choices = value.choices?.[s.id] ?? initial.choices[s.id] ?? {}
        const rows = runRules(s.resources, choices, s.params ?? {}, s.automation)
        const evals = monthlyEvaluations(s, choices)
        const fbs = evaluation?.items.filter((i) => i.id.startsWith(`${s.id}:`)) ?? []
        return (
          <section key={s.id} className={sh.card} aria-label={s.name}>
            <h4 className={sh.title}>{s.name}</h4>
            <p className={sh.desc}>{renderInline(s.description)}</p>
            <ul className={c.needs}>
              {s.policy.map((p) => (
                <li key={p}>{p}</li>
              ))}
            </ul>
            <div className={c.scroll}>
              <table className={c.table}>
                <caption className={c.muted}>Recursos da conta</caption>
                <thead>
                  <tr>
                    <th scope="col">Recurso</th>
                    <th scope="col">Tipo</th>
                    <th scope="col">Configuração</th>
                  </tr>
                </thead>
                <tbody>
                  {s.resources.map((r) => (
                    <tr key={r.id}>
                      <td>{r.name}</td>
                      <td>{TYPE_LABEL[r.type]}</td>
                      <td>{describe(r)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className={c.scroll}>
              <table className={c.table}>
                <caption className={c.muted}>Regras do Config</caption>
                <thead>
                  <tr>
                    <th scope="col">Ligar</th>
                    <th scope="col">Regra</th>
                    <th scope="col">Remediação</th>
                  </tr>
                </thead>
                <tbody>
                  {s.palette.map((id) => {
                    const ch = choices[id] ?? { on: false, mode: 'none' as const }
                    const rule = RULES[id]
                    return (
                      <tr key={id}>
                        <td>
                          <input type="checkbox" aria-label={`Ligar a regra ${id}`} checked={ch.on} disabled={disabled} onChange={(e) => set(s, id, { on: e.target.checked, ...(e.target.checked ? {} : { mode: 'none' as const }) })} />
                        </td>
                        <td>
                          <span className={c.mono}>{id}</span>
                          <br />
                          <span className={c.muted}>{rule.summary}</span>
                        </td>
                        <td>
                          <select className={c.select} aria-label={`Remediação da regra ${id}`} value={ch.mode} disabled={disabled || !ch.on} onChange={(e) => set(s, id, { mode: e.target.value as RuleChoice['mode'] })}>
                            <option value="none">Nenhuma</option>
                            <option value="manual">Manual</option>
                            <option value="auto" disabled={!s.automation.includes(id)}>
                              {s.automation.includes(id) ? 'Automática' : 'Automática (sem documento de automação)'}
                            </option>
                          </select>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
            {rows.length > 0 && (
              <div className={c.scroll}>
                <table className={c.table}>
                  <caption className={c.muted}>Resultado das regras ligadas</caption>
                  <thead>
                    <tr>
                      <th scope="col">Regra</th>
                      <th scope="col">Fora do padrão</th>
                      <th scope="col">Depois da remediação</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map(({ rule, results }) => {
                      const bad = results.filter((x) => x.result === 'NON_COMPLIANT')
                      const left = results.filter((x) => x.after === 'NON_COMPLIANT')
                      return (
                        <tr key={rule.id}>
                          <td className={c.mono}>{rule.id}</td>
                          <td>{bad.length ? bad.map((x) => x.resource.name).join(', ') : `nenhum (${results.length} avaliados, ${RESULT_TEXT.COMPLIANT})`}</td>
                          <td>{bad.length === 0 ? '—' : left.length ? `ainda fora do padrão: ${left.map((x) => x.resource.name).join(', ')}` : 'todos corrigidos'}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
            <p className={c.cost} aria-live="polite">
              {evals} avaliações por mês = <strong>{usd(evaluationsCost(evals, config.region))}/mês</strong>
            </p>
            {fbs.map((fb) => (
              <div key={fb.id} className={sh.verdict} data-status={fb.status} aria-live="polite">
                <strong>{fb.label}</strong>
                <span>{renderInline(fb.message ?? '')}</span>
              </div>
            ))}
          </section>
        )
      })}
      <details className={sh.simp}>
        <summary>Simplificações deste simulador</summary>
        <ul>
          <li>Os recursos são fictícios e as regras olham poucos atributos. A avaliação cobre as regras gerenciadas escolhidas aqui; regras personalizadas, pacotes de conformidade e agregadores ficam de fora.</li>
          <li>As avaliações do mês contam as mudanças de cada recurso (premissa do cenário) e uma avaliação por dia nas regras periódicas; o preço é o da primeira faixa.</li>
          <li>A remediação automática corrige o atributo do recurso, mas só nas regras para as quais a equipe tem um documento de automação testado.</li>
          <li>Ligar uma regra que a política não pede custa avaliações e gera resultados que ninguém vai tratar; esse peso é julgamento de arquitetura do AWS Quest.</li>
        </ul>
      </details>
    </div>
  )
}
