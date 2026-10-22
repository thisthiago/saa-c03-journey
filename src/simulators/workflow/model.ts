/**
 * Simulador de um estado Task do AWS Step Functions com Retry e Catch.
 *
 * Conferido em 22/10/2026
 * (https://docs.aws.amazon.com/step-functions/latest/dg/concepts-error-handling.html):
 * - Sem Retry nem Catch, um erro no estado faz a execução inteira falhar.
 * - Retry: MaxAttempts é o número máximo de novas tentativas (padrão 3);
 *   IntervalSeconds é a espera antes da primeira (padrão 1); BackoffRate
 *   multiplica a espera a cada tentativa (padrão 2.0).
 * - Catch: quando as novas tentativas acabam (ou não há Retry), o Catch
 *   desvia a execução para o estado indicado em Next, por exemplo um passo
 *   de compensação; States.ALL casa com qualquer erro.
 *
 * Simplificação: a tarefa falha com o mesmo tipo de erro em todas as
 * tentativas que falham; o tempo de execução da própria tarefa é ignorado.
 */

export interface TaskBehavior {
  /** Quantas vezes falha antes de dar certo (erro passageiro). */
  transientFailures: number
  /** true: o erro é permanente e nenhuma tentativa dá certo. */
  permanent?: boolean
}

export interface ErrorHandling {
  /** Novas tentativas (0 = sem Retry). */
  maxAttempts: number
  intervalSec?: number
  backoffRate?: number
  /** Catch com States.ALL desviando para a compensação. */
  catchAll: boolean
}

export type TaskOutcome = 'succeeded' | 'caught' | 'failed'

export const TASK_OUTCOME_LABEL: Record<TaskOutcome, string> = {
  succeeded: 'a tarefa dá certo',
  caught: 'o Catch desvia para a compensação',
  failed: 'a execução falha',
}

export interface TaskResult {
  outcome: TaskOutcome
  attempts: number
  /** Soma das esperas entre as tentativas (s). */
  waitedSec: number
  trace: string[]
}

export function runTask(b: TaskBehavior, h: ErrorHandling): TaskResult {
  const interval = h.intervalSec ?? 1
  const backoff = h.backoffRate ?? 2
  const trace: string[] = []
  let waited = 0
  for (let attempt = 0; attempt <= h.maxAttempts; attempt++) {
    if (attempt > 0) {
      const wait = interval * backoff ** (attempt - 1)
      waited += wait
      trace.push(`Nova tentativa ${attempt} depois de ${wait} s de espera.`)
    }
    if (!b.permanent && attempt >= b.transientFailures) {
      trace.push(attempt === 0 ? 'A tarefa dá certo na primeira tentativa.' : `A tarefa dá certo na tentativa ${attempt + 1}.`)
      return { outcome: 'succeeded', attempts: attempt + 1, waitedSec: waited, trace }
    }
    trace.push(`Tentativa ${attempt + 1}: erro${b.permanent ? ' permanente' : ' passageiro'}.`)
  }
  if (h.catchAll) {
    trace.push(h.maxAttempts ? 'As novas tentativas acabaram; o Catch com States.ALL desvia a execução para a compensação.' : 'Sem Retry, o Catch com States.ALL desvia a execução para a compensação.')
    return { outcome: 'caught', attempts: h.maxAttempts + 1, waitedSec: waited, trace }
  }
  trace.push('Sem Catch, o erro faz a execução inteira falhar.')
  return { outcome: 'failed', attempts: h.maxAttempts + 1, waitedSec: waited, trace }
}
