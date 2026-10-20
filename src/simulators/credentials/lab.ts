/** Laboratório "Auditoria de credenciais": escolher as ações de cada linha do relatório. */
import type { ItemFeedback } from '../../engine/types'
import { ACTION_LABEL, judgeRow, recommend, type AuditPolicy, type CredAction, type CredRow } from './model'

export interface CredentialsLabConfig {
  account: string
  rows: CredRow[]
  policy: AuditPolicy
  /** Conceitos avaliados em cada linha. */
  concepts: Record<string, string[]>
}

export interface CredentialsLabResponse {
  picks: Record<string, CredAction[]>
}

export const credentialsSolution = (c: CredentialsLabConfig): CredentialsLabResponse => ({ picks: Object.fromEntries(c.rows.map((r) => [r.id, recommend(r, c.policy).actions])) })

export const credentialsComplete = (c: CredentialsLabConfig, r: CredentialsLabResponse) => c.rows.every((row) => (r.picks?.[row.id] ?? []).length > 0)

export function evaluateCredentialsLab(c: CredentialsLabConfig, r: CredentialsLabResponse) {
  const items = c.rows.map((row) => {
    const v = judgeRow(row, c.policy, r.picks?.[row.id])
    const extra = [
      v.missing.length ? `Faltou: ${v.missing.map((a) => ACTION_LABEL[a].toLowerCase()).join('; ')}.` : '',
      v.wrongPicks.length ? `Não era necessário: ${v.wrongPicks.map((a) => ACTION_LABEL[a].toLowerCase()).join('; ')}.` : '',
    ].filter(Boolean)
    return {
      concepts: c.concepts[row.id],
      score: v.score,
      fb: { id: row.id, label: row.name, status: v.status, message: [...v.reasons, ...extra].join(' ') } as ItemFeedback,
    }
  })
  return { score: items.reduce((s, i) => s + i.score, 0) / Math.max(1, items.length), items }
}
