/** Interface do laboratório "A conta da transferência". */
import type { Evaluation } from '../../engine/types'
import { NET_PRICE_DATE } from '../network-prices'
import { GridLab } from '../shared/GridLab'
import { FactTag, PremiseTag } from '../shared/Tags'
import { TRANSFER_PRICE_DATE } from '../transfer-prices'
import { transferCostColumns, transferCostRows, type TransferCostLabConfig, type TransferCostLabResponse } from './lab'

interface Props {
  config: TransferCostLabConfig
  value: TransferCostLabResponse
  onChange: (v: TransferCostLabResponse) => void
  disabled: boolean
  evaluation?: Evaluation | null
}

export function TransferCostLab({ config, ...props }: Props) {
  return (
    <GridLab
      columns={transferCostColumns(config)}
      rows={transferCostRows(config)}
      {...props}
      legend={
        <>
          <FactTag date="22/10/2026" /> regras de cobrança da transferência · <FactTag date={TRANSFER_PRICE_DATE} /> transferência e CloudFront · <FactTag date={NET_PRICE_DATE} /> NAT Gateway e endpoints (AWS Price List, us-east-1) · <PremiseTag /> os fluxos e os volumes.
        </>
      }
      simplifications={[
        'Primeira faixa de preço de cada item, sem os 100 GB gratuitos por mês de saída para a internet.',
        'Entre AZs, o GB paga na saída e na entrada; por isso aparece o dobro do preço por sentido.',
        'O NAT Gateway já existe para outros tráfegos: só o processamento por GB entra na conta. O endpoint de interface novo paga também a hora em duas AZs.',
        'A saída do CloudFront usa o preço dos Estados Unidos.',
      ]}
    />
  )
}
