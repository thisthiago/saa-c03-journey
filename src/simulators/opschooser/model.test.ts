import { describe, expect, it } from 'vitest'
import { bestOpsOption, judgeOpsChoice, OPS_OPTIONS, type OpsItem, type OpsOption } from './model'

const ALL = Object.keys(OPS_OPTIONS) as OpsOption[]
const item = (id: string, dominant: OpsItem['dominant'], needs: OpsItem['needs']): OpsItem => ({ id, text: id, dominant, needs })

describe('escolha do serviço de operação', () => {
  it('escolhe a opção que atende a tudo com menos esforço', () => {
    expect(bestOpsOption(item('cpu', 'metric-alert', ['metric-alert']), ALL)).toBe('cw-alarm')
    expect(bestOpsOption(item('mem', 'os-metrics', ['metric-alert', 'os-metrics']), ALL)).toBe('cw-agent')
    expect(bestOpsOption(item('quem', 'who-recent', ['who-recent']), ALL)).toBe('ct-history')
    expect(bestOpsOption(item('antigo', 'who-long', ['who-long']), ALL)).toBe('ct-trail')
    expect(bestOpsOption(item('objeto', 'who-data', ['who-data']), ALL)).toBe('ct-trail-data')
    expect(bestOpsOption(item('conforme', 'compliance-check', ['compliance-check']), ALL)).toBe('config')
    expect(bestOpsOption(item('todas', 'compliance-all-accounts', ['compliance-check', 'compliance-all-accounts']), ALL)).toBe('config-aggregator')
    expect(bestOpsOption(item('amb', 'replicate-env', ['replicate-env']), ALL)).toBe('cfn')
    expect(bestOpsOption(item('contas', 'many-accounts', ['replicate-env', 'many-accounts']), ALL)).toBe('stacksets')
  })

  it('dá meio ponto para quem atende pagando mais do que o caso pede', () => {
    const it2 = item('cpu', 'metric-alert', ['metric-alert'])
    expect(judgeOpsChoice(it2, 'cw-alarm', ALL).status).toBe('correct')
    expect(judgeOpsChoice(it2, 'cw-agent', ALL).score).toBe(0.5)
    expect(judgeOpsChoice(it2, 'budgets', ALL).score).toBe(0)
  })

  it('toda opção atende a pelo menos um requisito', () => {
    for (const o of ALL) expect(OPS_OPTIONS[o].meets.length, o).toBeGreaterThan(0)
  })
})
