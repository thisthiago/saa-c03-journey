/** Interface do laboratório "O fluxo do pedido". */
import type { Evaluation } from '../../engine/types'
import { GridLab } from '../shared/GridLab'
import { FactTag, PremiseTag } from '../shared/Tags'
import { workflowColumns, workflowRows, type WorkflowLabConfig, type WorkflowLabResponse } from './lab'

interface Props {
  config: WorkflowLabConfig
  value: WorkflowLabResponse
  onChange: (v: WorkflowLabResponse) => void
  disabled: boolean
  evaluation?: Evaluation | null
}

export function WorkflowLab({ config, ...props }: Props) {
  return (
    <GridLab
      columns={workflowColumns(config)}
      rows={workflowRows(config)}
      {...props}
      legend={
        <>
          <FactTag date="22/10/2026" /> Retry, Catch, States.ALL e a falha da execução sem tratamento · <PremiseTag /> os passos do fluxo e como cada um falha.
        </>
      }
      simplifications={['Cada passo falha sempre com o mesmo tipo de erro.', 'O Retry usa os valores padrão de espera (1 s, dobrando a cada tentativa).']}
    />
  )
}
