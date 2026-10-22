/** Interface do laboratório "A fila de achados". */
import type { Evaluation } from '../../engine/types'
import { GridLab } from '../shared/GridLab'
import { FactTag, JudgementTag, PremiseTag } from '../shared/Tags'
import { findingsColumns, findingsRows, type FindingsLabConfig, type FindingsLabResponse } from './lab'

interface Props {
  config: FindingsLabConfig
  value: FindingsLabResponse
  onChange: (v: FindingsLabResponse) => void
  disabled: boolean
  evaluation?: Evaluation | null
}

export function FindingsLab({ config, ...props }: Props) {
  return (
    <GridLab
      columns={findingsColumns(config)}
      rows={findingsRows(config)}
      {...props}
      legend={
        <>
          <FactTag date="22/10/2026" /> o formato dos tipos de achado de cada serviço · <PremiseTag /> os recursos e o que foi visto · <JudgementTag /> a ação mais adequada para cada achado
        </>
      }
      simplifications={['Os achados aparecem com o tipo e um resumo; os achados reais trazem dezenas de campos, como conta, Região, gravidade e horário.', 'No Security Hub CSPM, os achados do GuardDuty, do Inspector e do Macie também chegam reunidos; aqui cada um aparece com o formato do serviço de origem.']}
    />
  )
}
