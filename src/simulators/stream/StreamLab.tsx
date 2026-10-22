/** Interface do laboratório "Os fluxos de dados". */
import type { Evaluation } from '../../engine/types'
import { GridLab } from '../shared/GridLab'
import { FactTag, PremiseTag } from '../shared/Tags'
import { streamColumns, streamRows, type StreamLabConfig, type StreamLabResponse } from './lab'

interface Props {
  config: StreamLabConfig
  value: StreamLabResponse
  onChange: (v: StreamLabResponse) => void
  disabled: boolean
  evaluation?: Evaluation | null
}

export function StreamLab({ config, ...props }: Props) {
  return (
    <GridLab
      columns={streamColumns(config)}
      rows={streamRows(config)}
      {...props}
      legend={
        <>
          <FactTag date="22/10/2026" /> limites do shard (1 MB/s ou 1.000 registros por segundo na escrita, 2 MB/s na leitura) e o enhanced fan-out · <PremiseTag /> os fluxos e quem lê cada um.
        </>
      }
      simplifications={['Os dados se espalham por igual entre os shards; nenhuma chave de partição concentra o tráfego.', 'Modo provisionado; no modo sob demanda, o próprio Kinesis ajusta a capacidade.']}
    />
  )
}
