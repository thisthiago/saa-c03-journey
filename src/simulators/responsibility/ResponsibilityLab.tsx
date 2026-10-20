/** Interface da matriz de responsabilidade: um cartão por serviço, uma escolha por camada. */
import { Check } from 'lucide-react'
import type { Evaluation } from '../../engine/types'
import sh from '../shared/lab.module.css'
import type { ResponsibilityLabConfig, ResponsibilityLabResponse } from './lab'
import { cellKey, LAYER_LABEL, OWNER_LABEL, SERVICE_INFO, type Owner } from './model'
import s from './responsibility.module.css'

interface Props {
  config: ResponsibilityLabConfig
  value: ResponsibilityLabResponse
  onChange: (v: ResponsibilityLabResponse) => void
  disabled: boolean
  evaluation?: Evaluation | null
}

const OWNERS: Owner[] = ['aws', 'shared', 'customer']

export function ResponsibilityLab({ config, value, onChange, disabled, evaluation }: Props) {
  const fb = new Map((evaluation?.items ?? []).map((i) => [i.id, i]))
  const cells = value.cells ?? {}
  return (
    <div className={sh.lab}>
      <p className={sh.desc}>Para cada serviço, indique quem cuida de cada camada. Os serviços vão do mais "cru" (EC2) ao mais abstrato (S3): observe o que muda e o que nunca muda.</p>
      <div className={s.services}>
        {config.services.map((sv) => {
          const done = config.layers.filter((l) => cells[cellKey(l.id, sv)]).length
          const allDone = done === config.layers.length
          return (
            <section key={sv} className={sh.card} aria-label={SERVICE_INFO[sv].name}>
              <h4 className={sh.title}>
                {SERVICE_INFO[sv].name} <small className={s.model}>{SERVICE_INFO[sv].model}</small>
              </h4>
              <p className={s.count} data-done={allDone}>
                {allDone ? 'Todas as camadas respondidas' : `${done} de ${config.layers.length} camadas respondidas`}
              </p>
              <ol className={s.layers}>
                {config.layers.map((l) => {
                  const key = cellKey(l.id, sv)
                  const item = fb.get(key)
                  return (
                    <li key={l.id} data-status={item?.status}>
                      <span className={s.layer}>{LAYER_LABEL[l.id]}</span>
                      <span className={s.seg} role="radiogroup" aria-label={`${SERVICE_INFO[sv].name}: ${LAYER_LABEL[l.id]}`}>
                        {OWNERS.map((o) => (
                          <button key={o} type="button" role="radio" aria-checked={cells[key] === o} data-owner={o} disabled={disabled} onClick={() => onChange({ cells: { ...cells, [key]: o } })}>
                            <Check className={s.tick} size={14} strokeWidth={3} aria-hidden="true" />
                            {OWNER_LABEL[o]}
                          </button>
                        ))}
                      </span>
                      {item && item.status !== 'correct' && <span className={s.why}>{item.message}</span>}
                    </li>
                  )
                })}
              </ol>
            </section>
          )
        })}
      </div>
      <details className={sh.simp}>
        <summary>Simplificações deste simulador</summary>
        <ul>
          <li>Lambda considerada com pacote .zip e runtime gerenciado no modo Auto. Com imagem de contêiner, reconstruir a imagem com patches é tarefa do cliente.</li>
          <li>"Compartilhado" indica que a AWS executa parte da tarefa e o cliente decide ou executa outra (por exemplo, a janela de manutenção do RDS).</li>
          <li>Camadas agrupadas para caber num exercício; a documentação de cada serviço detalha mais.</li>
        </ul>
      </details>
    </div>
  )
}
