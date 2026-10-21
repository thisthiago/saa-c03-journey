import { describe, expect, it } from 'vitest'
import { evaluateDbSecureLab, SECURE_STATE } from './lab'
import { checkRequirement, refusals, type DbSecurityState } from './model'

const exposed: DbSecurityState = { publicAccess: true, ingress: 'anywhere', encryption: 'none', tls: false, credentials: 'hardcoded', backupDays: 1, deletionProtection: false, publicSnapshot: true }
const ALL = ['private', 'app-only', 'encrypted', 'tls', 'no-static-password', 'pitr', 'deletion-protection', 'no-public-snapshot'] as const

describe('segurança do banco', () => {
  it('a criptografia de uma instância existente só vem por snapshot copiado e restaurado', () => {
    expect(refusals({ ...exposed, encryption: 'enable-in-place' })).toHaveLength(1)
    expect(checkRequirement({ ...exposed, encryption: 'enable-in-place' }, 'encrypted').ok).toBe(false)
    expect(checkRequirement({ ...exposed, encryption: 'snapshot-restore' }, 'encrypted').ok).toBe(true)
  })

  it('autenticação IAM e Secrets Manager eliminam a senha fixa no código', () => {
    expect(checkRequirement({ ...exposed, credentials: 'iam-auth' }, 'no-static-password').ok).toBe(true)
    expect(checkRequirement({ ...exposed, credentials: 'secrets-manager' }, 'no-static-password').ok).toBe(true)
  })

  it('o banco exposto falha em tudo; o estado seguro passa em tudo', () => {
    const config = { initial: exposed, requirements: ALL.map((req) => ({ req })) }
    expect(evaluateDbSecureLab(config, exposed).score).toBe(0)
    expect(evaluateDbSecureLab(config, SECURE_STATE).score).toBe(1)
  })
})
