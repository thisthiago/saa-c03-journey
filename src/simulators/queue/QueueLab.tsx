/** Interface do laboratório "As filas da empresa". */
import type { Evaluation } from '../../engine/types'
import { GridLab } from '../shared/GridLab'
import { FactTag, PremiseTag } from '../shared/Tags'
import { queueColumns, queueRows, type QueueLabConfig, type QueueLabResponse } from './lab'

interface Props {
  config: QueueLabConfig
  value: QueueLabResponse
  onChange: (v: QueueLabResponse) => void
  disabled: boolean
  evaluation?: Evaluation | null
}

export function QueueLab({ config, ...props }: Props) {
  return (
    <GridLab
      columns={queueColumns(config)}
      rows={queueRows(config)}
      {...props}
      legend={
        <>
          <FactTag date="22/10/2026" /> visibilidade, maxReceiveCount e as recomendações para Lambda (seis vezes o tempo limite, pelo menos 5 recebimentos) · <PremiseTag /> os consumidores e as falhas de cada um.
        </>
      }
      simplifications={['Um consumidor por vez recebe a mensagem assim que ela volta a ficar visível.', 'O processamento leva sempre o mesmo tempo; a janela de lote do Lambda não entra na conta.']}
    />
  )
}
