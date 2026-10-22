import { describe, expect, it } from 'vitest'
import { evaluateFilterLab, filterSolution, type FilterLabConfig } from './lab'
import { matches } from './pattern'

const pedido = { source: 'loja.pedidos', 'detail-type': 'Pedido criado', detail: { valor: 250, estado: 'SP', canal: 'App' } }

describe('padrões de evento', () => {
  it('campos com E, valores da lista com OU', () => {
    expect(matches({ source: ['loja.pedidos'], detail: { estado: ['SP', 'RJ'] } }, pedido)).toBe(true)
    expect(matches({ source: ['loja.pedidos'], detail: { estado: ['MG'] } }, pedido)).toBe(false)
  })

  it('campo que o padrão não cita é ignorado', () => {
    expect(matches({ 'detail-type': ['Pedido criado'] }, pedido)).toBe(true)
  })

  it('operadores numeric, prefix, anything-but, exists e equals-ignore-case', () => {
    expect(matches({ detail: { valor: [{ numeric: ['>=', 200] }] } }, pedido)).toBe(true)
    expect(matches({ detail: { valor: [{ numeric: ['>', 100, '<', 200] }] } }, pedido)).toBe(false)
    expect(matches({ source: [{ prefix: 'loja.' }] }, pedido)).toBe(true)
    expect(matches({ detail: { estado: [{ 'anything-but': ['SP'] }] } }, pedido)).toBe(false)
    expect(matches({ detail: { cupom: [{ exists: false }] } }, pedido)).toBe(true)
    expect(matches({ detail: { cupom: [{ exists: true }] } }, pedido)).toBe(false)
    expect(matches({ detail: { canal: [{ 'equals-ignore-case': 'app' }] } }, pedido)).toBe(true)
  })

  it('número e texto não se confundem', () => {
    expect(matches({ detail: { valor: ['250'] } }, pedido)).toBe(false)
  })
})

describe('laboratório de filtros', () => {
  const config: FilterLabConfig = {
    items: [
      { id: 'p1', label: 'Pedido de R$ 250 em SP', data: { tipo: 'pedido', valor: 250, estado: 'SP' } },
      { id: 'p2', label: 'Pedido de R$ 40 em MG', data: { tipo: 'pedido', valor: 40, estado: 'MG' } },
      { id: 'c1', label: 'Cancelamento em SP', data: { tipo: 'cancelamento', estado: 'SP' } },
    ],
    palette: [
      { id: 'all', pattern: null },
      { id: 'pedidos', pattern: { tipo: ['pedido'] } },
      { id: 'sp', pattern: { estado: ['SP'] } },
      { id: 'grandes', pattern: { valor: [{ numeric: ['>=', 100] }] } },
    ],
    targets: [
      { id: 'auditoria', label: 'Auditoria', need: 'tudo', wants: ['p1', 'p2', 'c1'] },
      { id: 'antifraude', label: 'Antifraude', need: 'pedidos a partir de R$ 100', wants: ['p1'] },
      { id: 'estoque', label: 'Estoque', need: 'todos os pedidos', wants: ['p1', 'p2'] },
    ],
  }
  it('a solução calculada leva 100%', () => {
    expect(filterSolution(config).answers).toEqual({ auditoria: { pattern: 'all' }, antifraude: { pattern: 'grandes' }, estoque: { pattern: 'pedidos' } })
    expect(evaluateFilterLab(config, filterSolution(config)).score).toBe(1)
  })
})
