/**
 * Laboratório "Os fluxos de dados": para cada fluxo, o modo de leitura e o
 * menor número de shards que dão conta da escrita e da leitura.
 */
import { evaluateGrid, gridComplete, gridSolution, type GridColumn, type GridExpected, type GridResponse, type GridRow } from '../shared/grid'
import { LIMIT_LABEL, shardsNeeded, type ReadMode, type StreamLoad } from './model'

export interface StreamCase extends StreamLoad {
  id: string
  label: string
  /** Algum consumidor precisa de latência baixa (cerca de 70 ms). */
  lowLatency: boolean
  concepts?: string[]
}

export interface StreamLabConfig {
  streams: StreamCase[]
  shardOptions: number[]
}

export type StreamLabResponse = GridResponse

export const streamColumns = (c: StreamLabConfig): GridColumn[] => [
  {
    id: 'read',
    label: 'Leitura',
    options: [
      { id: 'shared', label: 'Compartilhada' },
      { id: 'efo', label: 'Enhanced fan-out' },
    ],
  },
  { id: 'shards', label: 'Shards', options: c.shardOptions.map((n) => ({ id: String(n), label: String(n) })) },
]

const describe = (s: StreamCase) =>
  `Escrita de ${s.writeMBps.toLocaleString('pt-BR')} MB/s em ${s.recordsPerSec.toLocaleString('pt-BR')} registros por segundo; ${s.consumers} ${s.consumers === 1 ? 'aplicação lê' : 'aplicações leem'} tudo${s.lowLatency ? '; uma delas precisa de latência baixa' : '; nenhuma tem pressa'}.`

export const streamRows = (c: StreamLabConfig): GridRow[] => c.streams.map((s) => ({ id: s.id, label: `**${s.label}**`, detail: describe(s), concepts: s.concepts }))

export function streamExpected(c: StreamLabConfig) {
  return (row: GridRow): Record<string, GridExpected> => {
    const s = c.streams.find((x) => x.id === row.id)!
    const mode: ReadMode = s.lowLatency ? 'efo' : 'shared'
    const need = shardsNeeded(s, mode)
    const shards = c.shardOptions.find((n) => n >= need.shards)
    if (shards === undefined) throw new Error(`Fluxo ${s.id}: nenhuma opção de shards atende`)
    return {
      read: {
        answer: mode,
        why: s.lowLatency ? 'Latência baixa pede enhanced fan-out: cada consumidor recebe os dados por push, com os próprios 2 MB/s por shard.' : 'Sem pressa, a leitura compartilhada atende e não cobra o enhanced fan-out.',
      },
      shards: { answer: String(shards), why: `Quem decide é ${LIMIT_LABEL[need.limit]}: são precisos ${need.shards}, e ${shards} é a menor opção que cobre.` },
    }
  }
}

export const streamSolution = (c: StreamLabConfig) => gridSolution(streamColumns(c), streamRows(c), streamExpected(c))
export const evaluateStreamLab = (c: StreamLabConfig, r: StreamLabResponse) => evaluateGrid(streamColumns(c), streamRows(c), streamExpected(c), r)
export const streamComplete = (c: StreamLabConfig, r: StreamLabResponse) => gridComplete(streamColumns(c), streamRows(c), r)
