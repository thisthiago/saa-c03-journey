import { describe, expect, it } from 'vitest'
import { bestIdentityOption, judgeIdentity, type IdentityOption } from './model'

const ALL: IdentityOption[] = ['idc-external', 'idc-directory', 'iam-user', 'managed-ad', 'ad-connector', 'simple-ad', 'service-role', 'roles-anywhere', 'user-pool', 'identity-pool', 'user-and-identity-pool', 'cross-account-role']

describe('escolha da solução de identidade', () => {
  it('escolhe a opção mais simples que atende a tudo', () => {
    expect(bestIdentityOption({ id: 'a', text: '', dominant: 'guest-access', needs: ['guest-access'] }, ALL)).toBe('identity-pool')
    expect(bestIdentityOption({ id: 'b', text: '', dominant: 'app-aws-credentials', needs: ['app-signin', 'app-aws-credentials'] }, ALL)).toBe('user-and-identity-pool')
    expect(bestIdentityOption({ id: 'c', text: '', dominant: 'rds-sqlserver-ad', needs: ['rds-sqlserver-ad'] }, ALL)).toBe('managed-ad')
    expect(bestIdentityOption({ id: 'd', text: '', dominant: 'onprem-ad-no-sync', needs: ['onprem-ad-no-sync', 'mfa-radius'] }, ALL)).toBe('ad-connector')
  })

  it('dá meio ponto para quem atende com peças demais e zero para quem não atende', () => {
    const item = { id: 'g', text: '', dominant: 'guest-access' as const, needs: ['guest-access' as const] }
    expect(judgeIdentity(item, 'user-and-identity-pool', ALL).score).toBe(0.5)
    expect(judgeIdentity(item, 'user-pool', ALL).score).toBe(0)
    expect(judgeIdentity(item, 'identity-pool', ALL).status).toBe('correct')
  })
})
