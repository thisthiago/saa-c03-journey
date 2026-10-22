/** Interface do laboratório "Os planos da API". */
import type { Evaluation } from '../../engine/types'
import { GridLab } from '../shared/GridLab'
import { FactTag, PremiseTag } from '../shared/Tags'
import { apiColumns, apiRows, type ApiLabConfig, type ApiLabResponse } from './lab'

interface Props {
  config: ApiLabConfig
  value: ApiLabResponse
  onChange: (v: ApiLabResponse) => void
  disabled: boolean
  evaluation?: Evaluation | null
}

export function ApiLab({ config, ...props }: Props) {
  return (
    <GridLab
      columns={apiColumns(config)}
      rows={apiRows(config)}
      {...props}
      legend={
        <>
          <FactTag date="22/10/2026" /> balde de tokens com taxa e burst, e a resposta 429 acima do limite · <PremiseTag /> os clientes e o uso de cada um.
        </>
      }
      simplifications={['O balde começa cheio e é reabastecido uma vez por segundo.', 'Só o limite do usage plan entra na conta; os limites do método e da conta ficam acima dele.']}
    />
  )
}
