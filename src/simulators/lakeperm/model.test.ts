import { describe, expect, it } from 'vitest'
import { evaluateLakePermLab, lakePermInitial, lakePermSolution, type LakePermLabConfig } from './lab'
import { checkAccess, visibleCells, visibleColumns, visibleRows, type PermTable } from './model'

const T: PermTable = {
  name: 'vendas',
  columns: [
    { id: 'regiao', label: 'região', tags: { nivel: 'publico' } },
    { id: 'valor', label: 'valor', tags: { nivel: 'publico' } },
    { id: 'cpf', label: 'CPF', tags: { nivel: 'sensivel' } },
  ],
  rows: [
    { regiao: 'Sul', valor: '10', cpf: '111' },
    { regiao: 'Norte', valor: '20', cpf: '222' },
    { regiao: 'Sul', valor: '30', cpf: '333' },
  ],
}

describe('simulador de permissões do Lake Formation', () => {
  it('a configuração padrão e o SELECT na tabela liberam todas as células', () => {
    expect(visibleCells(T, [{ kind: 'iam-default' }]).size).toBe(9)
    expect(visibleCells(T, [{ kind: 'table' }]).size).toBe(9)
  })

  it('o filtro de dados combina linhas e colunas (segurança por célula)', () => {
    const g = [{ kind: 'filter' as const, where: { column: 'regiao', in: ['Sul'] }, exclude: ['cpf'] }]
    expect(visibleCells(T, g).size).toBe(4)
    expect(visibleRows(T, g)).toBe(2)
    expect([...visibleColumns(T, g)].sort()).toEqual(['regiao', 'valor'])
  })

  it('a LF-Tag libera as colunas com o valor concedido', () => {
    expect([...visibleColumns(T, [{ kind: 'tag', key: 'nivel', value: 'publico' }])].sort()).toEqual(['regiao', 'valor'])
  })

  it('as concessões se somam', () => {
    const g = [
      { kind: 'columns' as const, include: ['regiao'] },
      { kind: 'filter' as const, where: { column: 'regiao', in: ['Norte'] }, include: ['valor'] },
    ]
    expect(visibleCells(T, g).size).toBe(4)
  })

  it('classifica o acesso em exato, a mais, parcial e nenhum', () => {
    const need = { columns: ['regiao', 'valor'] }
    expect(checkAccess(T, [{ kind: 'tag', key: 'nivel', value: 'publico' }], need).verdict).toBe('exact')
    expect(checkAccess(T, [{ kind: 'table' }], need).verdict).toBe('extra')
    expect(checkAccess(T, [{ kind: 'columns', include: ['regiao'] }], need).verdict).toBe('partial')
    expect(checkAccess(T, [], need).verdict).toBe('none')
  })

  it('a solução do laboratório chega a 100% e o estado inicial fica abaixo', () => {
    const config: LakePermLabConfig = {
      table: T,
      palette: [
        { id: 'all', grant: { kind: 'table' } },
        { id: 'pub', grant: { kind: 'tag', key: 'nivel', value: 'publico' } },
        { id: 'sul', grant: { kind: 'filter', where: { column: 'regiao', in: ['Sul'] }, exclude: ['cpf'] } },
      ],
      analysts: [
        { id: 'a', name: 'A', need: '', allowed: { columns: ['regiao', 'valor'] } },
        { id: 'b', name: 'B', need: '', allowed: { columns: ['regiao', 'valor'], where: { column: 'regiao', in: ['Sul'] } } },
      ],
    }
    expect(evaluateLakePermLab(config, lakePermSolution(config)).score).toBe(1)
    expect(evaluateLakePermLab(config, lakePermInitial(config)).score).toBeLessThan(0.7)
  })
})
