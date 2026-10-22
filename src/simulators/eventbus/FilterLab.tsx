/** Interface dos laboratórios de filtro do SNS e do EventBridge: os itens publicados e o padrão escolhido para cada destino. */
import type { Evaluation } from '../../engine/types'
import { GridLab } from '../shared/GridLab'
import { FactTag, PremiseTag } from '../shared/Tags'
import c from '../shared/compute.module.css'
import sh from '../shared/lab.module.css'
import { delivered, filterColumns, filterRows, type FilterLabConfig, type FilterLabResponse } from './lab'

interface Props {
  config: FilterLabConfig
  value: FilterLabResponse
  onChange: (v: FilterLabResponse) => void
  disabled: boolean
  evaluation?: Evaluation | null
  kind: 'sns' | 'eventbridge'
}

export function FilterLab({ config, kind, ...props }: Props) {
  const itemName = kind === 'sns' ? 'Mensagens publicadas no tópico' : 'Eventos que chegam ao barramento'
  return (
    <GridLab
      columns={filterColumns(config)}
      rows={filterRows(config)}
      {...props}
      legend={
        <>
          <FactTag date="22/10/2026" /> campos do padrão combinam com E, valores da lista com OU, e o que o padrão não cita é ignorado{kind === 'sns' ? '; sem política de filtro, a assinatura recebe tudo' : ''} · <PremiseTag /> {kind === 'sns' ? 'as mensagens e as assinaturas' : 'os eventos e as regras'}.
        </>
      }
      intro={
        <section className={sh.card} aria-label={itemName}>
          <h4 className={sh.title}>{itemName}</h4>
          <div className={c.scroll}>
            <table className={c.table}>
              <tbody>
                {config.items.map((i) => (
                  <tr key={i.id}>
                    <th>{i.label}</th>
                    <td className={c.mono}>{JSON.stringify(i.data)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {props.evaluation && (
            <p className={sh.desc}>
              {config.targets
                .map((t) => {
                  const pick = props.value.answers?.[t.id]?.pattern
                  const p = config.palette.find((x) => x.id === pick)
                  return `${t.label}: ${p ? delivered(config, p.pattern).length : 0} recebidos`
                })
                .join(' · ')}
            </p>
          )}
        </section>
      }
      simplifications={[
        kind === 'sns' ? 'As políticas filtram os atributos da mensagem; o filtro pelo corpo da mensagem funciona do mesmo jeito sobre o JSON do corpo.' : 'Cada regra tem um alvo; uma regra real aceita até cinco alvos.',
        'Os operadores $or, wildcard e cidr não entram no laboratório.',
      ]}
    />
  )
}
