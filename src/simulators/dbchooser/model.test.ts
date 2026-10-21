import { describe, expect, it } from 'vitest'
import { bestDbOption, DB_OPTIONS, judgeDbChoice, type DbItem, type DbOption } from './model'

const ALL = Object.keys(DB_OPTIONS) as DbOption[]
const item = (id: string, dominant: DbItem['dominant'], needs: DbItem['needs']): DbItem => ({ id, text: id, dominant, needs })

describe('escolha do banco', () => {
  it('escolhe a opção que atende a tudo com menos esforço e custo', () => {
    expect(bestDbOption(item('oracle', 'commercial-engine', ['relational', 'commercial-engine', 'survive-az']), ALL)).toBe('rds-multi-az')
    expect(bestDbOption(item('pg', 'reader-failover', ['relational', 'reader-failover']), ALL)).toBe('aurora')
    expect(bestDbOption(item('pico', 'variable-capacity', ['relational', 'variable-capacity']), ALL)).toBe('aurora-serverless')
    expect(bestDbOption(item('global', 'multi-region-reads', ['relational', 'multi-region-reads']), ALL)).toBe('aurora-global')
    expect(bestDbOption(item('chave', 'key-value-scale', ['key-value-scale']), ALL)).toBe('dynamodb')
    expect(bestDbOption(item('teste', 'relational', ['relational']), ALL)).toBe('rds')
  })

  it('dá meio ponto para quem atende pagando mais do que o caso pede', () => {
    const it2 = item('pg', 'survive-az', ['relational', 'survive-az'])
    expect(judgeDbChoice(it2, 'rds-multi-az', ALL).status).toBe('correct')
    expect(judgeDbChoice(it2, 'aurora', ALL).score).toBe(0.5)
    expect(judgeDbChoice(it2, 'dynamodb', ALL).score).toBe(0)
  })
})
