/**
 * Simulador de filas do Amazon SQS: o caminho de uma mensagem com tempo de
 * visibilidade, falhas de processamento, fila de mensagens mortas (DLQ) e
 * retenção; e a entrega de uma fila FIFO com grupos e deduplicação.
 *
 * Conferido em 22/10/2026:
 * - Visibilidade: padrão de 30 s, de 0 s a 12 horas; se o consumidor não
 *   apaga a mensagem antes do fim do prazo, ela volta a ficar visível e outro
 *   consumidor pode recebê-la; a fila padrão entrega pelo menos uma vez
 *   (https://docs.aws.amazon.com/AWSSimpleQueueService/latest/SQSDeveloperGuide/sqs-visibility-timeout.html).
 * - Retenção: padrão de 4 dias, de 1 minuto a 14 dias; mensagem de até 1 MiB
 *   (https://docs.aws.amazon.com/AWSSimpleQueueService/latest/SQSDeveloperGuide/quotas-messages.html).
 * - DLQ: o maxReceiveCount é quantas vezes a mensagem pode ser recebida antes
 *   de ir para a DLQ
 *   (https://docs.aws.amazon.com/AWSSimpleQueueService/latest/SQSDeveloperGuide/sqs-dead-letter-queues.html).
 * - Lambda lendo do SQS: visibilidade de pelo menos seis vezes o tempo limite
 *   da função e maxReceiveCount de pelo menos 5
 *   (https://docs.aws.amazon.com/lambda/latest/dg/services-sqs-configure.html).
 * - FIFO: ordem dentro do grupo de mensagens e deduplicação num intervalo de
 *   5 minutos
 *   (https://docs.aws.amazon.com/AWSSimpleQueueService/latest/SQSDeveloperGuide/FIFO-queues-exactly-once-processing.html).
 *
 * Simplificação: um consumidor por vez recebe a mensagem assim que ela fica
 * visível; o processamento leva sempre o mesmo tempo.
 */

export type Attempt = 'ok' | 'fail'

export interface MessageRun {
  /** Tempo que o consumidor leva para processar e apagar a mensagem (s). */
  processSec: number
  visibilitySec: number
  /** Resultado de cada recebimento; o último se repete se a lista acabar. */
  attempts: Attempt[]
  /** Sem número: a fila não tem DLQ. */
  maxReceiveCount?: number
  retentionSec: number
}

export type MessageOutcome = 'processed' | 'duplicated' | 'dlq' | 'expired'

export const OUTCOME_LABEL: Record<MessageOutcome, string> = {
  processed: 'processada uma vez',
  duplicated: 'processada em dobro',
  dlq: 'vai para a DLQ',
  expired: 'some ao fim da retenção',
}

export interface MessageResult {
  outcome: MessageOutcome
  receives: number
  /** Segundos desde o primeiro recebimento até o desfecho. */
  elapsedSec: number
  trace: string[]
}

/** O caminho de uma mensagem na fila padrão. */
export function runMessage(m: MessageRun): MessageResult {
  const trace: string[] = []
  let t = 0
  for (let receive = 1; ; receive++) {
    if (m.maxReceiveCount !== undefined && receive > m.maxReceiveCount) {
      trace.push(`A mensagem já foi recebida ${m.maxReceiveCount} ${m.maxReceiveCount === 1 ? 'vez' : 'vezes'} sem ser apagada (maxReceiveCount = ${m.maxReceiveCount}): ela vai para a DLQ.`)
      return { outcome: 'dlq', receives: receive - 1, elapsedSec: t, trace }
    }
    if (t >= m.retentionSec) {
      trace.push(`Passou o prazo de retenção da fila (${m.retentionSec} s) sem a mensagem ser apagada: ela é excluída, sem DLQ para guardá-la.`)
      return { outcome: 'expired', receives: receive - 1, elapsedSec: t, trace }
    }
    const result = m.attempts[Math.min(receive - 1, m.attempts.length - 1)]
    if (result === 'ok') {
      if (m.processSec > m.visibilitySec) {
        trace.push(`Recebimento ${receive}: o processamento leva ${m.processSec} s, mais que a visibilidade de ${m.visibilitySec} s. A mensagem volta a ficar visível e outro consumidor a processa de novo antes da exclusão.`)
        return { outcome: 'duplicated', receives: receive + 1, elapsedSec: t + m.processSec, trace }
      }
      trace.push(`Recebimento ${receive}: processada em ${m.processSec} s e apagada dentro da visibilidade de ${m.visibilitySec} s.`)
      return { outcome: 'processed', receives: receive, elapsedSec: t + m.processSec, trace }
    }
    trace.push(`Recebimento ${receive}: o processamento falha; a mensagem volta a ficar visível depois de ${m.visibilitySec} s.`)
    t += m.visibilitySec
  }
}

/** Visibilidade mínima recomendada: o processamento, ou seis vezes o tempo limite quando quem lê é uma função Lambda. */
export const minVisibility = (processSec: number, lambdaTimeoutSec?: number) => (lambdaTimeoutSec !== undefined ? 6 * lambdaTimeoutSec : processSec)

// ---------------------------------------------------------------------------
// FIFO

export const FIFO_DEDUP_SEC = 300

export interface FifoSend {
  id: string
  group: string
  dedupId: string
  /** Segundos desde o início. */
  atSec: number
}

/** Mensagens que entram na fila FIFO (as repetidas dentro de 5 minutos são descartadas) e a ordem de cada grupo. */
export function fifoAccept(sends: FifoSend[]): { accepted: string[]; dropped: string[]; byGroup: Record<string, string[]> } {
  const lastSeen = new Map<string, number>()
  const accepted: string[] = []
  const dropped: string[] = []
  const byGroup: Record<string, string[]> = {}
  for (const s of [...sends].sort((a, b) => a.atSec - b.atSec)) {
    const prev = lastSeen.get(s.dedupId)
    if (prev !== undefined && s.atSec - prev < FIFO_DEDUP_SEC) {
      dropped.push(s.id)
      continue
    }
    lastSeen.set(s.dedupId, s.atSec)
    accepted.push(s.id)
    ;(byGroup[s.group] ??= []).push(s.id)
  }
  return { accepted, dropped, byGroup }
}
