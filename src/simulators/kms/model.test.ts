import { describe, expect, it } from 'vitest'
import type { Principal } from '../policy/model'
import { ACCOUNT_ROOT, encryptPath, KEY_ADMIN_ACTIONS, KEY_USER_ACTIONS, KMS_ACCOUNT, kmsDecide, roleArn, type KmsWorld } from './model'

const KEY = `arn:aws:kms:us-east-1:${KMS_ACCOUNT}:key/1234abcd-12ab-34cd-56ef-1234567890ab`
const allowAll = { id: 'adm', name: 'AdministratorAccess', statements: [{ sid: 'Tudo', effect: 'Allow' as const, actions: ['*'], resources: ['*'] }] }
const P: Principal[] = [
  { id: 'app', name: 'role app', kind: 'role-session', account: KMS_ACCOUNT, roleName: 'app', sessionName: 's', identityPolicies: [] },
  { id: 'admin', name: 'role admin', kind: 'role-session', account: KMS_ACCOUNT, roleName: 'admin', sessionName: 's', identityPolicies: [allowAll] },
  { id: 'ops', name: 'role ops', kind: 'role-session', account: KMS_ACCOUNT, roleName: 'ops', sessionName: 's', identityPolicies: [allowAll] },
]
const world = (statements: KmsWorld['key']['statements'], grants: KmsWorld['grants'] = []): KmsWorld => ({ principals: P, key: { arn: KEY, label: 'chave', statements }, grants })

describe('kmsDecide', () => {
  it('sem statement que cite o principal ou a conta, nem AdministratorAccess usa a chave', () => {
    const w = world([{ sid: 'Admins', effect: 'Allow', principals: [{ aws: roleArn('admin') }], actions: KEY_ADMIN_ACTIONS, resources: ['*'] }])
    expect(kmsDecide(w, { principalId: 'ops', action: 'kms:Decrypt' }).allowed).toBe(false)
  })

  it('o administrador da chave não decifra: as ações de administração não incluem as criptográficas', () => {
    const w = world([{ sid: 'Admins', effect: 'Allow', principals: [{ aws: roleArn('admin') }], actions: KEY_ADMIN_ACTIONS, resources: ['*'] }])
    expect(kmsDecide(w, { principalId: 'admin', action: 'kms:PutKeyPolicy' }).allowed).toBe(true)
    expect(kmsDecide(w, { principalId: 'admin', action: 'kms:ScheduleKeyDeletion' }).allowed).toBe(true)
    expect(kmsDecide(w, { principalId: 'admin', action: 'kms:Decrypt' }).allowed).toBe(false)
  })

  it('o statement da conta habilita as políticas IAM', () => {
    const w = world([{ sid: 'Conta', effect: 'Allow', principals: [{ aws: ACCOUNT_ROOT }], actions: ['kms:*'], resources: ['*'] }])
    expect(kmsDecide(w, { principalId: 'ops', action: 'kms:Decrypt' }).allowed).toBe(true)
    expect(kmsDecide(w, { principalId: 'app', action: 'kms:Decrypt' }).allowed).toBe(false)
  })

  it('o usuário da chave cifra e decifra, mas não administra', () => {
    const w = world([{ sid: 'Usuarios', effect: 'Allow', principals: [{ aws: roleArn('app') }], actions: KEY_USER_ACTIONS, resources: ['*'] }])
    expect(kmsDecide(w, { principalId: 'app', action: 'kms:GenerateDataKey' }).allowed).toBe(true)
    expect(kmsDecide(w, { principalId: 'app', action: 'kms:PutKeyPolicy' }).allowed).toBe(false)
  })

  it('um grant permite só as operações dele, e um Deny explícito vence o grant', () => {
    const g = [{ id: 'g1', granteeId: 'app', operations: ['Decrypt'] }]
    const d = kmsDecide(world([], g), { principalId: 'app', action: 'kms:Decrypt' })
    expect(d).toMatchObject({ allowed: true, via: 'grant' })
    expect(kmsDecide(world([], g), { principalId: 'app', action: 'kms:Encrypt' }).allowed).toBe(false)
    const deny = world([{ sid: 'Nega', effect: 'Deny', principals: [{ aws: roleArn('app') }], actions: ['kms:Decrypt'], resources: ['*'] }], g)
    expect(kmsDecide(deny, { principalId: 'app', action: 'kms:Decrypt' })).toMatchObject({ allowed: false, explicitDeny: true })
  })

  it('Encrypt direto vai até 4.096 bytes; acima disso, criptografia em envelope', () => {
    expect(encryptPath(4096)).toBe('direct')
    expect(encryptPath(4097)).toBe('envelope')
  })
})
