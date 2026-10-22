/** Interface do laboratório "A estratégia de recuperação". */
import type { Evaluation } from '../../engine/types'
import { PRICE_DATE } from '../compute-prices'
import { GridLab } from '../shared/GridLab'
import { FactTag, PremiseTag } from '../shared/Tags'
import { drColumns, drRows, type DrLabConfig, type DrLabResponse } from './lab'

interface Props {
  config: DrLabConfig
  value: DrLabResponse
  onChange: (v: DrLabResponse) => void
  disabled: boolean
  evaluation?: Evaluation | null
}

export function DrLab({ config, ...props }: Props) {
  return (
    <GridLab
      columns={drColumns()}
      rows={drRows(config)}
      {...props}
      legend={
        <>
          <FactTag date="22/10/2026" /> as quatro estratégias e as faixas de RPO e RTO do pilar de confiabilidade · <FactTag date={PRICE_DATE} /> preços de EC2 e RDS da AWS Price List (us-east-1) · <PremiseTag /> o pior caso de cada faixa, o warm standby com um quarto da frota e os sistemas.
        </>
      }
      simplifications={[
        'Cada estratégia vale pelo pior caso da faixa que a AWS descreve: backup e restauração perde até 24 horas e volta em até 24 horas; pilot light, 15 minutos e 1 hora; warm standby, 1 minuto e 15 minutos; ativo-ativo, perto de zero.',
        'O custo da Região de recuperação conta só instâncias On-Demand, a réplica do banco Single-AZ e o armazenamento dos backups; a transferência entre Regiões fica de fora.',
        'Toda estratégia ainda precisa de backups com restauração a um momento anterior, porque a replicação também copia dados corrompidos.',
      ]}
    />
  )
}
