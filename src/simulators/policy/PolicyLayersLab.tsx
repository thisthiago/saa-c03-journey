/** Interface do laboratório de camadas: bibliotecas de statements por camada e matriz de decisões ao vivo. */
import { Ban, Check, Minus, Plus, UserRound } from 'lucide-react'
import { useMemo, useState } from 'react'
import type { Evaluation } from '../../engine/types'
import { Badge } from '../../ui/kit'
import { renderInline } from '../../ui/inline'
import sh from '../shared/lab.module.css'
import { applyLayers, layersMatrix, type LayerLibrary, type LayersGoal, type LayersLabConfig, type LayersLabResponse } from './layers'
import { conditionText, DECISION_LABEL, policyToJson, principalRefText, type EvalResult, type PolicyStatement, type Principal } from './model'
import s from './policy.module.css'

interface Props {
  config: LayersLabConfig
  value: LayersLabResponse
  onChange: (v: LayersLabResponse) => void
  disabled: boolean
  evaluation?: Evaluation | null
}

/** Rótulos curtos da camada que decidiu, para caber nas células da matriz. */
const LAYER_SHORT = { scp: 'SCP', rcp: 'RCP', resource: 'recurso', identity: 'identidade', boundary: 'boundary', session: 'sessão', root: 'root' } as const

const TARGET_BADGE: Record<LayerLibrary['target']['type'], string> = {
  identity: 'identidade',
  group: 'grupo',
  boundary: 'permissions boundary',
  session: 'session policy',
  resource: 'política de recurso',
  scp: 'SCP',
  rcp: 'RCP',
}

export function StatementCard({ st, active, onToggle, disabled }: { st: PolicyStatement; active: boolean; onToggle: () => void; disabled: boolean }) {
  return (
    <div className={s.card} data-active={active} data-effect={st.effect}>
      <div className={s.cardHead}>
        <code className={s.sid}>{st.sid}</code>
        <Badge tone={st.effect === 'Allow' ? 'success' : 'danger'}>{st.effect}</Badge>
        <button type="button" className={s.toggle} onClick={onToggle} disabled={disabled} aria-pressed={active} aria-label={`${active ? 'Remover' : 'Adicionar'} o statement ${st.sid}`}>
          {active ? <Minus size={14} aria-hidden="true" /> : <Plus size={14} aria-hidden="true" />} {active ? 'Remover' : 'Adicionar'}
        </button>
      </div>
      {st.note && <p className={s.note}>{renderInline(st.note)}</p>}
      <dl className={s.summary}>
        {st.principals && (
          <>
            <dt>Principal</dt>
            <dd>{st.principals.map(principalRefText).join(', ')}</dd>
          </>
        )}
        <dt>{st.notActions ? 'NotAction' : 'Action'}</dt>
        <dd>{(st.notActions ?? st.actions ?? []).join(', ')}</dd>
        {(st.resources || st.notResources) && (
          <>
            <dt>{st.notResources ? 'NotResource' : 'Resource'}</dt>
            <dd>{(st.notResources ?? st.resources ?? []).join(', ')}</dd>
          </>
        )}
        {st.conditions?.length ? (
          <>
            <dt>Condition</dt>
            <dd>{st.conditions.map(conditionText).join('; ')}</dd>
          </>
        ) : null}
      </dl>
      <details className={s.stJson}>
        <summary>JSON</summary>
        <pre className={s.code}>{policyToJson([st], true)}</pre>
      </details>
    </div>
  )
}

export function DecisionMatrix({
  matrix,
  principals,
  requests,
  goals,
  evaluation,
}: {
  matrix: { principalId: string; cells: { requestId: string; result: EvalResult }[] }[]
  principals: Principal[]
  requests: { id: string; label: string }[]
  goals: LayersGoal[]
  evaluation?: Evaluation | null
}) {
  const [selected, setSelected] = useState<{ principalId: string; requestId: string } | null>(null)
  const who = (id: string) => principals.find((p) => p.id === id)!
  const goalFor = (principalId: string, requestId: string) => goals.find((g) => g.principalId === principalId && g.requestId === requestId)
  const cell = selected ? matrix.find((r) => r.principalId === selected.principalId)?.cells.find((c) => c.requestId === selected.requestId) : null
  const reqLabel = (id: string) => requests.find((r) => r.id === id)?.label ?? id
  const config = { requests }
  return (
    <section className={s.panel} aria-label="Matriz de decisões">
          <h4 className={s.panelTitle}>Decisões (calculadas ao vivo)</h4>
          <div className={s.tableWrap}>
            <table className={s.matrix}>
              <thead>
                <tr>
                  <th scope="col">Principal</th>
                  {config.requests.map((r) => (
                    <th key={r.id} scope="col">
                      {r.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {matrix.map((row) => {
                  const p = who(row.principalId)
                  return (
                    <tr key={row.principalId}>
                      <th scope="row">
                        <span className={s.who}>
                          <UserRound size={14} aria-hidden="true" /> {p.name}
                        </span>
                        {p.description && <small>{p.description}</small>}
                      </th>
                      {row.cells.map((c) => {
                        const goal = goalFor(row.principalId, c.requestId)
                        const met = goal ? c.result.allowed === (goal.expect === 'allow') : undefined
                        return (
                          <td key={c.requestId} data-label={reqLabel(c.requestId)}>
                            <button
                              type="button"
                              className={s.cell}
                              data-allowed={c.result.allowed}
                              data-met={evaluation && goal ? String(met) : undefined}
                              aria-pressed={selected?.principalId === row.principalId && selected.requestId === c.requestId}
                              onClick={() => setSelected({ principalId: row.principalId, requestId: c.requestId })}
                              aria-label={`${p.name}, ${reqLabel(c.requestId)}: ${DECISION_LABEL[c.result.decision]}. Ver raciocínio.`}
                            >
                              {c.result.allowed ? <Check size={16} aria-hidden="true" /> : <Ban size={16} aria-hidden="true" />}
                              <span>
                                {c.result.allowed ? 'Permitido' : 'Negado'}
                                {!c.result.allowed && c.result.layer && <small>{c.result.decision === 'explicit-deny' ? 'Deny na' : 'sem Allow na'} camada {LAYER_SHORT[c.result.layer]}</small>}
                              </span>
                            </button>
                          </td>
                        )
                      })}
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          <div className={s.traceBox} aria-live="polite">
            {cell ? (
              <>
                <strong>Por que {cell.result.allowed ? 'permitido' : 'negado'}?</strong>
                <ol className={s.trace}>
                  {cell.result.trace.map((t, i) => (
                    <li key={i}>{t}</li>
                  ))}
                </ol>
              </>
            ) : (
              <span className="muted">Clique numa célula para ver o raciocínio do motor, passo a passo.</span>
            )}
          </div>
        </section>
  )
}

export function PolicyLayersLab({ config, value, onChange, disabled, evaluation }: Props) {
  const scenario = useMemo(() => applyLayers(config, value), [config, value])
  const matrix = useMemo(() => layersMatrix(config, scenario), [config, scenario])

  return (
    <div className={s.lab}>
      <div className={s.editor}>
        {config.libraries.map((lib) => {
          const active = value.active?.[lib.id] ?? []
          return (
            <section key={lib.id} className={s.panel} aria-label={lib.title}>
              <h4 className={s.panelTitle}>
                {lib.title} <Badge tone="info">{TARGET_BADGE[lib.target.type]}</Badge>
                <span className={s.count}>{active.length} em uso</span>
              </h4>
              <div className={s.cards}>
                {lib.statements.map((st) => (
                  <StatementCard
                    key={st.sid}
                    st={st}
                    active={active.includes(st.sid)}
                    disabled={disabled}
                    onToggle={() => onChange({ active: { ...value.active, [lib.id]: active.includes(st.sid) ? active.filter((x) => x !== st.sid) : [...active, st.sid] } })}
                  />
                ))}
              </div>
              {(lib.target.type === 'boundary' || lib.target.type === 'session' || lib.target.type === 'resource') && active.length === 0 && (
                <p className={s.note}>Nenhum statement ligado: {lib.target.type === 'resource' ? 'o recurso fica sem política' : `o principal fica sem ${TARGET_BADGE[lib.target.type]}`}.</p>
              )}
            </section>
          )
        })}
      </div>

      <div className={s.side}>
        <DecisionMatrix matrix={matrix} principals={scenario.principals} requests={config.requests} goals={config.goals} evaluation={evaluation} />
        {evaluation && (
          <ul className={s.verdicts}>
            {evaluation.items
              .filter((i) => i.status !== 'correct')
              .map((i) => (
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
            <li>O motor segue o fluxo de avaliação documentado pela AWS (Deny explícito, RCP, SCP, recurso, identidade, boundary e sessão), com duas avaliações entre contas.</li>
            <li>Não modela NotPrincipal, políticas de VPC endpoint, ACLs, grants do KMS nem operadores de conjunto (ForAllValues e ForAnyValue).</li>
            <li>As contas, os ARNs e as requisições são fictícios e não chamam a AWS.</li>
          </ul>
        </details>
      </div>
    </div>
  )
}
