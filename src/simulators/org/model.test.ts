import { describe, expect, it } from 'vitest'
import { evaluate, type Policy } from '../policy/model'
import { orgAccounts, pathTo, type OrgNode } from './model'

const pol = (id: string, statements: Policy['statements']): Policy => ({ id, name: id, statements })
const FULL = pol('FullAWSAccess', [{ sid: 'Tudo', effect: 'Allow', actions: ['*'], resources: ['*'] }])
const ONLY_EC2 = pol('SoEC2', [{ sid: 'Ec2', effect: 'Allow', actions: ['ec2:*'], resources: ['*'] }])
const NODES: OrgNode[] = [
  { id: 'r', name: 'Raiz', kind: 'root' },
  { id: 'mgmt', name: 'Gerenciamento', kind: 'account', parent: 'r', accountId: '111111111111', management: true },
  { id: 'ou', name: 'Sandbox', kind: 'ou', parent: 'r' },
  { id: 'sb', name: 'Testes', kind: 'account', parent: 'ou', accountId: '222222222222' },
]
const admin = (id: string, account: string) => ({ id, name: id, kind: 'user' as const, account, userName: id, identityPolicies: [pol('Admin', [{ sid: 'A', effect: 'Allow', actions: ['*'], resources: ['*'] }])] })

describe('organização', () => {
  it('monta o caminho da raiz até a conta', () => {
    expect(pathTo(NODES, 'sb').map((n) => n.id)).toEqual(['r', 'ou', 'sb'])
  })

  it('Allow em todos os níveis: SoEC2 na OU limita a conta, mesmo com FullAWSAccess na raiz e na conta', () => {
    const accounts = orgAccounts('o-x', NODES, [FULL, ONLY_EC2], { r: ['FullAWSAccess'], ou: ['SoEC2'], sb: ['FullAWSAccess'], mgmt: [] })
    const sc = { accounts, principals: [admin('dev', '222222222222'), admin('boss', '111111111111')], resources: [{ id: 's3', arn: 'arn:aws:s3:::x', account: '222222222222' }, { id: 'ec2', arn: 'arn:aws:ec2:us-east-1:222222222222:instance/i-1', account: '222222222222' }, { id: 'm', arn: 'arn:aws:s3:::m', account: '111111111111' }] }
    expect(evaluate(sc, { principalId: 'dev', action: 'ec2:RunInstances', resourceId: 'ec2' }).decision).toBe('allow')
    expect(evaluate(sc, { principalId: 'dev', action: 's3:ListBucket', resourceId: 's3' }).reason).toBe('scp-no-allow')
    expect(evaluate(sc, { principalId: 'boss', action: 's3:ListBucket', resourceId: 'm' }).decision).toBe('allow')
  })
})
