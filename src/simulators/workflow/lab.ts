/**
 * Laboratório "O fluxo do pedido": para cada estado Task, o Retry e o Catch
 * mínimos que levam ao desfecho pedido sem tentativas inúteis.
 */
import { evaluateGrid, gridComplete, gridSolution, type GridColumn, type GridExpected, type GridResponse, type GridRow } from '../shared/grid'
import { runTask, TASK_OUTCOME_LABEL, type TaskBehavior } from './model'

export interface WorkflowStep extends TaskBehavior {
  id: string
  label: string
  /** O que o negócio quer se o erro não passar (RichText). */
  need: string
  /** true: se não der certo, a execução precisa seguir para a compensação. */
  compensate: boolean
  concepts?: string[]
}

export interface WorkflowLabConfig {
  steps: WorkflowStep[]
  /** Opções de MaxAttempts, em ordem crescente (0 = sem Retry). */
  retryOptions: number[]
}

export type WorkflowLabResponse = GridResponse

const retryLabel = (n: number) => (n === 0 ? 'Sem Retry' : `Retry com ${n} novas tentativas`)

export const workflowColumns = (c: WorkflowLabConfig): GridColumn[] => [
  { id: 'retry', label: 'Retry', options: c.retryOptions.map((n) => ({ id: String(n), label: retryLabel(n) })) },
  {
    id: 'catch',
    label: 'Catch',
    options: [
      { id: 'none', label: 'Sem Catch' },
      { id: 'all', label: 'Catch com States.ALL para a compensação' },
    ],
  },
]

const describe = (s: WorkflowStep) => (s.permanent ? 'Quando falha, o erro é permanente: tentar de novo não resolve.' : `Falha por erro passageiro até ${s.transientFailures} ${s.transientFailures === 1 ? 'vez' : 'vezes'} seguidas.`)

export const workflowRows = (c: WorkflowLabConfig): GridRow[] => c.steps.map((s) => ({ id: s.id, label: `**${s.label}**`, detail: `${describe(s)} ${s.need}`, concepts: s.concepts }))

export function workflowExpected(c: WorkflowLabConfig) {
  return (row: GridRow): Record<string, GridExpected> => {
    const s = c.steps.find((x) => x.id === row.id)!
    const retry = s.permanent ? 0 : c.retryOptions.find((n) => n >= s.transientFailures)
    if (retry === undefined) throw new Error(`Passo ${s.id}: nenhuma opção de Retry cobre as falhas`)
    const r = runTask(s, { maxAttempts: retry, catchAll: s.compensate })
    return {
      retry: {
        answer: String(retry),
        why: s.permanent ? 'Erro permanente não passa com novas tentativas; elas só atrasam a compensação.' : `${retryLabel(retry)} cobre as ${s.transientFailures} falhas passageiras; mais tentativas só atrasam o aviso de um problema real.`,
      },
      catch: {
        answer: s.compensate ? 'all' : 'none',
        why: s.compensate ? `Se a tarefa não der certo, o Catch leva a execução à compensação em vez de deixá-la falhar. Com essa configuração, ${TASK_OUTCOME_LABEL[r.outcome]}.` : 'Aqui o negócio prefere que a execução falhe e apareça no alarme; não há o que compensar.',
      },
    }
  }
}

export const workflowSolution = (c: WorkflowLabConfig) => gridSolution(workflowColumns(c), workflowRows(c), workflowExpected(c))
export const evaluateWorkflowLab = (c: WorkflowLabConfig, r: WorkflowLabResponse) => evaluateGrid(workflowColumns(c), workflowRows(c), workflowExpected(c), r)
export const workflowComplete = (c: WorkflowLabConfig, r: WorkflowLabResponse) => gridComplete(workflowColumns(c), workflowRows(c), r)
