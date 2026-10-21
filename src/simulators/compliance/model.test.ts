import { describe, expect, it } from 'vitest'
import { evaluateRule, evaluationsCost, evaluationsPerMonth, RULES, runRules, type CfgResource } from './model'

const bucket = (attrs: CfgResource['attrs'], tags?: CfgResource['tags']): CfgResource => ({ id: 'b', type: 'bucket', name: 'b', attrs, tags })
const sg = (sshOpen: boolean): CfgResource => ({ id: 'sg', type: 'security-group', name: 'sg', attrs: { sshOpen } })

describe('regras gerenciadas do Config', () => {
  it('s3-bucket-public-read-prohibited e restricted-ssh apontam o recurso fora do padrão', () => {
    expect(evaluateRule(RULES['s3-bucket-public-read-prohibited'], bucket({ publicRead: true }))).toBe('NON_COMPLIANT')
    expect(evaluateRule(RULES['s3-bucket-public-read-prohibited'], bucket({ publicRead: false }))).toBe('COMPLIANT')
    expect(evaluateRule(RULES['restricted-ssh'], sg(true))).toBe('NON_COMPLIANT')
    expect(evaluateRule(RULES['restricted-ssh'], sg(false))).toBe('COMPLIANT')
  })

  it('uma regra de outro tipo de recurso dá NOT_APPLICABLE', () => {
    expect(evaluateRule(RULES['restricted-ssh'], bucket({ publicRead: true }))).toBe('NOT_APPLICABLE')
  })

  it('required-tags confere as chaves pedidas', () => {
    const rule = RULES['required-tags']
    expect(evaluateRule(rule, bucket({}, { CostCenter: '10' }), { tagKeys: ['CostCenter'] })).toBe('COMPLIANT')
    expect(evaluateRule(rule, bucket({}, {}), { tagKeys: ['CostCenter'] })).toBe('NON_COMPLIANT')
    expect(evaluateRule(rule, bucket({}, { CostCenter: '10' }), { tagKeys: ['CostCenter', 'Owner'] })).toBe('NON_COMPLIANT')
  })
})

describe('remediação', () => {
  const resources = [sg(true), sg(false)]
  it('a remediação automática só corrige onde há documento de automação', () => {
    const on = { 'restricted-ssh': { on: true, mode: 'auto' as const } }
    const withDoc = runRules(resources, on, {}, ['restricted-ssh'])
    expect(withDoc[0].results.map((r) => r.after)).toEqual(['COMPLIANT', 'COMPLIANT'])
    const withoutDoc = runRules(resources, on, {}, [])
    expect(withoutDoc[0].results.map((r) => r.after)).toEqual(['NON_COMPLIANT', 'COMPLIANT'])
  })
  it('só avalia as regras ligadas', () => {
    expect(runRules(resources, {}, {}, [])).toEqual([])
  })
})

describe('custo das avaliações', () => {
  it('conta avaliações por mudança e periódicas e multiplica pelo preço da tabela', () => {
    expect(evaluationsPerMonth(RULES['encrypted-volumes'], 10, 4)).toBe(40)
    expect(evaluationsPerMonth(RULES['root-account-mfa-enabled'], 1, 4)).toBe(30)
    expect(evaluationsPerMonth(RULES['restricted-ssh'], 10, 4)).toBe(40 + 300)
    expect(evaluationsCost(1000)).toBeGreaterThan(0)
  })
})
