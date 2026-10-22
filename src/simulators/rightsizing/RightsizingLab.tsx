/** Interface do laboratório "Tamanho e compra certos". */
import type { Evaluation } from '../../engine/types'
import { PRICE_DATE } from '../compute-prices'
import { SPOT_DISCOUNT } from '../purchase/model'
import { GridLab } from '../shared/GridLab'
import { FactTag, PremiseTag } from '../shared/Tags'
import { rightsizingColumns, rightsizingRows, type RightsizingLabConfig, type RightsizingLabResponse } from './lab'
import { CANDIDATE_BELOW, MAX_AFTER } from './model'

interface Props {
  config: RightsizingLabConfig
  value: RightsizingLabResponse
  onChange: (v: RightsizingLabResponse) => void
  disabled: boolean
  evaluation?: Evaluation | null
}

export function RightsizingLab({ config, ...props }: Props) {
  return (
    <GridLab
      columns={rightsizingColumns()}
      rows={rightsizingRows(config)}
      {...props}
      legend={
        <>
          <FactTag date="22/10/2026" /> uso máximo abaixo de {CANDIDATE_BELOW}% em quatro semanas indica instância grande demais · <FactTag date={PRICE_DATE} /> preços On-Demand e de Savings Plans (us-east-1) · <PremiseTag /> Spot com {Math.round(SPOT_DISCOUNT * 100)}% de desconto e pico abaixo de {MAX_AFTER}% depois da redução.
        </>
      }
      simplifications={[
        'Cada tamanho abaixo tem metade das vCPUs e da memória, e o pico de uso dobra.',
        'O Savings Plan é dimensionado para cobrir exatamente a frota e cobra as 730 horas do mês.',
        'Ligar só no horário de uso supõe um agendamento que desliga e liga as instâncias.',
      ]}
    />
  )
}
