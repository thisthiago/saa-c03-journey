/** Interface do laboratório do CloudFormation: o modelo atual e o novo, lado a lado, e a previsão do efeito em cada recurso. */
import type { Evaluation } from '../../engine/types'
import { renderInline } from '../../ui/inline'
import { FactTag } from '../shared/Tags'
import c from '../shared/compute.module.css'
import sh from '../shared/lab.module.css'
import { choiceKey, EFFECT_ORDER, type StackLabConfig, type StackLabResponse } from './lab'
import { changedProps, EFFECT_LABEL, effectiveDeletionPolicy, TYPE_LABEL, type Effect, type StackResource } from './model'

interface Props {
  config: StackLabConfig
  value: StackLabResponse
  onChange: (v: StackLabResponse) => void
  disabled: boolean
  evaluation?: Evaluation | null
}

const show = (v: string | number | boolean | undefined) => (v === undefined ? '(ausente)' : String(v))

function policies(r: StackResource | undefined): string {
  if (!r) return ''
  const parts: string[] = []
  parts.push(`DeletionPolicy: ${effectiveDeletionPolicy(r)}${r.deletionPolicy ? '' : ' (padrão)'}`)
  parts.push(`UpdateReplacePolicy: ${r.updateReplacePolicy ?? 'Delete'}${r.updateReplacePolicy ? '' : ' (padrão)'}`)
  return parts.join(' · ')
}

export function StackLab({ config, value, onChange, disabled, evaluation }: Props) {
  return (
    <div className={sh.lab}>
      <p className={c.legend}>
        <FactTag date="21/10/2026" /> cada propriedade de cada tipo de recurso tem o seu comportamento de atualização: sem interrupção, com alguma interrupção ou substituição; a DeletionPolicy vale para recursos removidos do modelo, e a UpdateReplacePolicy, para os substituídos (o padrão das duas é apagar)
      </p>
      {config.scenarios.map((s) => {
        const ids = [...new Set([...s.current.map((r) => r.id), ...s.next.map((r) => r.id)])]
        return (
          <section key={s.id} className={sh.card} aria-label={s.name}>
            <h4 className={sh.title}>{s.name}</h4>
            <p className={sh.desc}>{renderInline(s.description)}</p>
            {ids.map((id) => {
              const before = s.current.find((r) => r.id === id)
              const after = s.next.find((r) => r.id === id)
              const type = (after ?? before)!.type
              const key = choiceKey(s.id, id)
              const fb = evaluation?.items.find((i) => i.id === key)
              const changes = before && after ? changedProps(before, after) : []
              return (
                <div key={id} className={sh.card} role="group" aria-label={`Recurso ${id}`}>
                  <h5 className={sh.title}>
                    {id} <span className={c.muted}>({TYPE_LABEL[type] ?? type})</span>
                  </h5>
                  {!before && <p className={sh.desc}>Novo no modelo.</p>}
                  {!after && <p className={sh.desc}>Removido do modelo. {policies(before)}.</p>}
                  {before && after && (
                    <>
                      {changes.length === 0 ? (
                        <p className={sh.desc}>Nenhuma propriedade mudou.</p>
                      ) : (
                        <div className={c.scroll}>
                          <table className={c.table}>
                            <thead>
                              <tr>
                                <th scope="col">Propriedade</th>
                                <th scope="col">Antes</th>
                                <th scope="col">Depois</th>
                              </tr>
                            </thead>
                            <tbody>
                              {changes.map((ch) => (
                                <tr key={ch.prop}>
                                  <td className={c.mono}>{ch.prop}</td>
                                  <td>{show(ch.before)}</td>
                                  <td>{show(ch.after)}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                      <p className={sh.desc}>{policies(after)}</p>
                    </>
                  )}
                  <label className={c.field}>
                    <span>O que a atualização faz com este recurso</span>
                    <select className={c.select} value={value.choices?.[key] ?? ''} disabled={disabled} onChange={(e) => onChange({ choices: { ...value.choices, [key]: (e.target.value || undefined) as Effect | undefined } })}>
                      <option value="">Escolha</option>
                      {EFFECT_ORDER.map((ef) => (
                        <option key={ef} value={ef}>
                          {EFFECT_LABEL[ef]}
                        </option>
                      ))}
                    </select>
                  </label>
                  {fb && (
                    <div className={sh.verdict} data-status={fb.status} aria-live="polite">
                      <strong>{fb.label}</strong>
                      <span>{renderInline(fb.message ?? '')}</span>
                    </div>
                  )}
                </div>
              )
            })}
          </section>
        )
      })}
      <details className={sh.simp}>
        <summary>Simplificações deste simulador</summary>
        <ul>
          <li>Só entram propriedades cujo comportamento de atualização foi lido na referência de cada tipo de recurso. A Port do RDS fica de fora porque o guia e a referência divergem.</li>
          <li>O comportamento real pode variar com o valor da propriedade (por exemplo, a mudança de tipo de uma instância EC2 pode exigir substituição quando o disco raiz é um instance store); aqui cada propriedade tem um comportamento só, o da referência.</li>
          <li>Os recursos têm só as propriedades que importam para a atualização; dependências entre recursos, parâmetros e reversão em caso de falha ficam de fora.</li>
          <li>A mudança de propriedades de outros recursos que referenciam um substituído não é simulada.</li>
        </ul>
      </details>
    </div>
  )
}
