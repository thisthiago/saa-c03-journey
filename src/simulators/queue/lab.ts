/**
 * Laboratório "As filas da empresa": para cada consumidor, o tempo de
 * visibilidade e o maxReceiveCount da DLQ que processam cada mensagem uma vez
 * e tiram da fila as mensagens que nunca vão dar certo.
 */
import { evaluateGrid, gridComplete, gridSolution, type GridColumn, type GridExpected, type GridResponse, type GridRow } from '../shared/grid'
import { minVisibility, OUTCOME_LABEL, runMessage } from './model'

export interface QueueConsumer {
  id: string
  label: string
  /** Tempo de processamento de uma mensagem (s). */
  processSec: number
  /** Presente quando quem lê é uma função Lambda: o tempo limite dela (s). */
  lambdaTimeoutSec?: number
  /** Quantas vezes uma mensagem boa pode falhar por erro passageiro antes de dar certo. */
  transientFailures: number
  concepts?: string[]
}

export interface QueueLabConfig {
  consumers: QueueConsumer[]
  /** Opções de visibilidade (s), em ordem crescente. */
  visibilityOptions: number[]
  /** Opções de maxReceiveCount, em ordem crescente. */
  dlqOptions: number[]
  retentionSec: number
}

export type QueueLabResponse = GridResponse

export const formatSec = (s: number) => (s % 3600 === 0 ? `${s / 3600} h` : s % 60 === 0 ? `${s / 60} min` : `${s} s`)

export const queueColumns = (c: QueueLabConfig): GridColumn[] => [
  { id: 'visibility', label: 'Tempo de visibilidade', options: c.visibilityOptions.map((v) => ({ id: String(v), label: formatSec(v) })) },
  { id: 'dlq', label: 'Fila de mensagens mortas', options: [{ id: 'none', label: 'Sem DLQ' }, ...c.dlqOptions.map((n) => ({ id: String(n), label: `DLQ com maxReceiveCount ${n}` }))] },
]

const describe = (x: QueueConsumer) =>
  [
    x.lambdaTimeoutSec !== undefined ? `Função Lambda com tempo limite de ${formatSec(x.lambdaTimeoutSec)}` : `Processa cada mensagem em ${formatSec(x.processSec)}`,
    x.transientFailures ? `uma mensagem boa pode falhar até ${x.transientFailures} ${x.transientFailures === 1 ? 'vez' : 'vezes'} por erro passageiro` : 'mensagens boas não falham',
    'algumas mensagens chegam com defeito e nunca serão processadas',
  ].join('; ')

export const queueRows = (c: QueueLabConfig): GridRow[] => c.consumers.map((x) => ({ id: x.id, label: `**${x.label}**`, detail: `${describe(x)}.`, concepts: x.concepts }))

/** maxReceiveCount mínimo: a mensagem boa precisa caber nas tentativas; com Lambda, a recomendação é pelo menos 5. */
export const minReceives = (x: QueueConsumer) => Math.max(x.transientFailures + 1, x.lambdaTimeoutSec !== undefined ? 5 : 1)

export function queueExpected(c: QueueLabConfig) {
  return (row: GridRow): Record<string, GridExpected> => {
    const x = c.consumers.find((k) => k.id === row.id)!
    const need = minVisibility(x.processSec, x.lambdaTimeoutSec)
    const vis = c.visibilityOptions.find((v) => v >= need)
    const dlq = c.dlqOptions.find((n) => n >= minReceives(x))
    if (vis === undefined || dlq === undefined) throw new Error(`Consumidor ${x.id}: nenhuma opção atende`)
    const good = runMessage({ processSec: x.processSec, visibilitySec: vis, attempts: [...Array(x.transientFailures).fill('fail'), 'ok'], maxReceiveCount: dlq, retentionSec: c.retentionSec })
    const bad = runMessage({ processSec: x.processSec, visibilitySec: vis, attempts: ['fail'], maxReceiveCount: dlq, retentionSec: c.retentionSec })
    return {
      visibility: {
        answer: String(vis),
        why: x.lambdaTimeoutSec !== undefined
          ? `Com Lambda, a recomendação é pelo menos seis vezes o tempo limite da função (${formatSec(need)}); ${formatSec(vis)} é a menor opção que cumpre.`
          : `A visibilidade precisa cobrir o processamento de ${formatSec(x.processSec)}; abaixo disso, outra cópia é entregue antes da exclusão. ${formatSec(vis)} é a menor opção que cobre, e um prazo maior só atrasa a nova tentativa quando há falha.`,
      },
      dlq: {
        answer: String(dlq),
        why: `Com ${dlq} recebimentos, a mensagem boa fica ${OUTCOME_LABEL[good.outcome]} e a com defeito ${OUTCOME_LABEL[bad.outcome]}.${x.lambdaTimeoutSec !== undefined ? ' Com Lambda, a recomendação é maxReceiveCount de pelo menos 5.' : ''} Sem DLQ, a mensagem com defeito volta sem parar até o fim da retenção.`,
      },
    }
  }
}

export const queueSolution = (c: QueueLabConfig) => gridSolution(queueColumns(c), queueRows(c), queueExpected(c))
export const evaluateQueueLab = (c: QueueLabConfig, r: QueueLabResponse) => evaluateGrid(queueColumns(c), queueRows(c), queueExpected(c), r)
export const queueComplete = (c: QueueLabConfig, r: QueueLabResponse) => gridComplete(queueColumns(c), queueRows(c), r)
