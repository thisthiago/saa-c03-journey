/** Laboratório "Banco exposto": fechar cada brecha de segurança de uma instância do RDS. */
import type { ItemFeedback } from '../../engine/types'
import { checkRequirement, REQ_LABEL, refusals, type DbSecurityState, type SecurityReq } from './model'

export interface DbSecureLabConfig {
  initial: DbSecurityState
  requirements: { req: SecurityReq; concepts?: string[] }[]
}

export type DbSecureLabResponse = DbSecurityState

export const SECURE_STATE: DbSecurityState = { publicAccess: false, ingress: 'app-sg', encryption: 'snapshot-restore', tls: true, credentials: 'secrets-manager', backupDays: 14, deletionProtection: true, publicSnapshot: false }

export const dbSecureSolution = (_c: DbSecureLabConfig): DbSecureLabResponse => ({ ...SECURE_STATE })

export function evaluateDbSecureLab(c: DbSecureLabConfig, r: DbSecureLabResponse) {
  const blocked = refusals(r)
  const items = c.requirements.map(({ req, concepts }) => {
    const v = checkRequirement(r, req)
    return { concepts, score: v.ok ? 1 : 0, fb: { id: req, label: REQ_LABEL[req], status: v.ok ? 'correct' : 'wrong', message: v.message } as ItemFeedback }
  })
  if (blocked.length) items.push({ concepts: undefined, score: 0, fb: { id: 'refused', label: 'Ação recusada pela AWS', status: 'wrong', message: `${blocked.join('; ')}.` } })
  return { score: items.reduce((s, x) => s + x.score, 0) / Math.max(1, items.length), items }
}
