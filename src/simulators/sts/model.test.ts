import { describe, expect, it } from 'vitest'
import type { Policy, PolicyScenario } from '../policy/model'
import { assumeRole, evaluateWithSession } from './model'

const pol = (name: string, statements: Policy['statements']): Policy => ({ id: name, name, statements })
const ACCT = '111122223333'
const OTHER = '999988887777'

const scenario: PolicyScenario = {
  principals: [
    { id: 'ana', name: 'ana', kind: 'user', account: ACCT, userName: 'ana', auth: { via: 'access-key', mfa: false }, identityPolicies: [pol('Assume', [{ sid: 'A', effect: 'Allow', actions: ['sts:AssumeRole'], resources: ['*'] }])] },
    { id: 'bia', name: 'bia', kind: 'user', account: ACCT, userName: 'bia', identityPolicies: [] },
    { id: 'chain', name: 'sessão ci', kind: 'role-session', account: ACCT, roleName: 'ci', sessionName: 'build', identityPolicies: [pol('Assume', [{ sid: 'A', effect: 'Allow', actions: ['sts:AssumeRole'], resources: ['*'] }])] },
    { id: 'vendor', name: 'role do fornecedor', kind: 'role-session', account: OTHER, roleName: 'scanner', sessionName: 'x', identityPolicies: [pol('Assume', [{ sid: 'A', effect: 'Allow', actions: ['sts:AssumeRole'], resources: ['*'] }])] },
  ],
  resources: [
    { id: 'deploy', arn: `arn:aws:iam::${ACCT}:role/deploy`, account: ACCT, kind: 'trust', policy: pol('Trust', [{ sid: 'Conta', effect: 'Allow', principals: [{ aws: ACCT }], actions: ['sts:AssumeRole'], conditions: [{ op: 'Bool', key: 'aws:MultiFactorAuthPresent', values: ['true'] }] }]) },
    { id: 'aud', arn: `arn:aws:iam::${ACCT}:role/auditoria`, account: ACCT, kind: 'trust', policy: pol('Trust', [{ sid: 'Fornecedor', effect: 'Allow', principals: [{ aws: OTHER }], actions: ['sts:AssumeRole'], conditions: [{ op: 'StringEquals', key: 'sts:ExternalId', values: ['cliente-7781'] }] }]) },
    { id: 'bucket', arn: 'arn:aws:s3:::artefatos/app.zip', account: ACCT },
  ],
}
const settings = { maxSessionHours: 4, permissions: [pol('Deploy', [{ sid: 'S3', effect: 'Allow', actions: ['s3:GetObject'], resources: ['arn:aws:s3:::artefatos/*'] }])] }

describe('AssumeRole', () => {
  it('duração: mínimo, máximo da role e encadeamento', () => {
    expect(assumeRole(scenario, settings, { callerId: 'ana', roleId: 'deploy', sessionName: 'ana', durationSeconds: 600, mfa: true }).outcome).toBe('duration-invalid')
    expect(assumeRole(scenario, settings, { callerId: 'ana', roleId: 'deploy', sessionName: 'ana', durationSeconds: 5 * 3600, mfa: true }).outcome).toBe('duration-invalid')
    expect(assumeRole(scenario, settings, { callerId: 'ana', roleId: 'deploy', sessionName: 'ana', durationSeconds: 2 * 3600, mfa: true }).outcome).toBe('ok')
    expect(assumeRole(scenario, settings, { callerId: 'chain', roleId: 'deploy', sessionName: 'b', durationSeconds: 2 * 3600, mfa: true }).outcome).toBe('duration-invalid')
  })

  it('MFA exigido pela trust policy', () => {
    expect(assumeRole(scenario, settings, { callerId: 'ana', roleId: 'deploy', sessionName: 'ana' }).outcome).toBe('mfa-missing')
  })

  it('trust policy que cita a conta: quem chama precisa de permissão', () => {
    expect(assumeRole(scenario, settings, { callerId: 'bia', roleId: 'deploy', sessionName: 'bia', mfa: true }).outcome).toBe('caller-denied')
  })

  it('External ID entre contas', () => {
    expect(assumeRole(scenario, settings, { callerId: 'vendor', roleId: 'aud', sessionName: 'v' }).outcome).toBe('trust-denied')
    expect(assumeRole(scenario, settings, { callerId: 'vendor', roleId: 'aud', sessionName: 'v', externalId: 'cliente-7781' }).outcome).toBe('ok')
  })

  it('a sessão usa as permissões da role e o ARN de sessão', () => {
    const r = assumeRole(scenario, settings, { callerId: 'ana', roleId: 'deploy', sessionName: 'ana', mfa: true })
    expect(r.sessionArn).toBe(`arn:aws:sts::${ACCT}:assumed-role/deploy/ana`)
    expect(evaluateWithSession(scenario, r.session!, { action: 's3:GetObject', resourceId: 'bucket' }).allowed).toBe(true)
    expect(evaluateWithSession(scenario, r.session!, { action: 's3:PutObject', resourceId: 'bucket' }).allowed).toBe(false)
  })
})
