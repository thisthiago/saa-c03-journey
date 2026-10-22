/** Laboratório "A rotação passo a passo": em cada momento, o que acontece com o login de cada aplicação. */
import { evaluateGrid, gridComplete, gridSolution, type GridColumn, type GridExpected, type GridResponse, type GridRow } from '../shared/grid'
import { loginOutcome, MOMENT_LABEL, OUTCOME_LABEL, READER_LABEL, STRATEGY_LABEL, type LoginOutcome, type Reader, type RotationMoment, type RotationStrategy } from './model'

export interface SecretsCheckpoint {
  id: string
  strategy: RotationStrategy
  moment: RotationMoment
  reader: Reader
  concepts?: string[]
}

export interface SecretsLabConfig {
  checkpoints: SecretsCheckpoint[]
  /** Respostas oferecidas (padrão: todas). */
  outcomes?: LoginOutcome[]
}

export type SecretsLabResponse = GridResponse

export function secretsColumns(c: SecretsLabConfig): GridColumn[] {
  const ids = c.outcomes ?? (Object.keys(OUTCOME_LABEL) as LoginOutcome[])
  return [{ id: 'login', label: 'O que acontece', options: ids.map((id) => ({ id, label: OUTCOME_LABEL[id] })) }]
}

export function secretsRows(c: SecretsLabConfig): GridRow[] {
  return c.checkpoints.map((k) => ({
    id: k.id,
    label: `${MOMENT_LABEL[k.moment][0].toUpperCase()}${MOMENT_LABEL[k.moment].slice(1)}, com ${STRATEGY_LABEL[k.strategy]}`,
    detail: `Quem conecta: ${READER_LABEL[k.reader]}.`,
    concepts: k.concepts,
  }))
}

const byId = (c: SecretsLabConfig, id: string) => c.checkpoints.find((k) => k.id === id)!

export function secretsExpected(c: SecretsLabConfig) {
  return (row: GridRow): Record<string, GridExpected> => {
    const k = byId(c, row.id)
    const r = loginOutcome(k.strategy, k.moment, k.reader)
    return { login: { answer: r.outcome, why: r.detail } }
  }
}

export const secretsSolution = (c: SecretsLabConfig) => gridSolution(secretsColumns(c), secretsRows(c), secretsExpected(c))
export const evaluateSecretsLab = (c: SecretsLabConfig, r: SecretsLabResponse) => evaluateGrid(secretsColumns(c), secretsRows(c), secretsExpected(c), r)
export const secretsComplete = (c: SecretsLabConfig, r: SecretsLabResponse) => gridComplete(secretsColumns(c), secretsRows(c), r)
