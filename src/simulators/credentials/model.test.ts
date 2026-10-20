import { describe, expect, it } from 'vitest'
import { judgeRow, recommend, type AuditPolicy, type CredRow } from './model'

const policy: AuditPolicy = { rotateAfterDays: 90, unusedAfterDays: 90, federation: true }
const row = (r: Partial<CredRow>): CredRow => ({ id: 'x', name: 'x', kind: 'user', use: 'person', password: true, mfa: false, keys: [], ...r })

describe('recomendações da auditoria', () => {
  it('root sem MFA e com chave: habilitar MFA e excluir a chave', () => {
    expect(recommend(row({ kind: 'root', use: 'root', keys: [{ id: 'AKIA1', active: true, ageDays: 10, lastUsedDays: 2 }] }), policy).actions).toEqual(['enable-mfa', 'delete-keys'])
  })

  it('pessoas vão para o Identity Center quando há federação; sem federação, MFA e rotação', () => {
    expect(recommend(row({}), policy).actions).toEqual(['to-identity-center'])
    expect(recommend(row({ keys: [{ id: 'AKIA2', active: true, ageDays: 200, lastUsedDays: 1 }] }), { ...policy, federation: false }).actions).toEqual(['enable-mfa', 'rotate-key'])
  })

  it('workloads trocam a chave por credenciais temporárias', () => {
    expect(recommend(row({ use: 'ec2-app', password: false }), policy).actions).toEqual(['to-role'])
    expect(recommend(row({ use: 'onprem', password: false }), policy).actions).toEqual(['to-roles-anywhere'])
  })

  it('ferramenta de terceiros com chave em dia fica como está', () => {
    expect(recommend(row({ use: 'third-party', password: false, keys: [{ id: 'AKIA3', active: true, ageDays: 30, lastUsedDays: 0 }] }), policy).actions).toEqual(['keep'])
  })

  it('a nota desconta escolhas indevidas', () => {
    const r = row({ kind: 'root', use: 'root', keys: [{ id: 'AKIA1', active: true, ageDays: 10, lastUsedDays: 2 }] })
    expect(judgeRow(r, policy, ['enable-mfa', 'delete-keys']).status).toBe('correct')
    expect(judgeRow(r, policy, ['enable-mfa']).score).toBe(0.5)
    expect(judgeRow(r, policy, ['enable-mfa', 'rotate-key']).score).toBe(0)
    expect(judgeRow(r, policy, undefined).status).toBe('missed')
  })
})
