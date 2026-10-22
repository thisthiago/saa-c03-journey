/**
 * Laboratório "Os planos da API": para cada cliente, a taxa e o burst do
 * usage plan que servem o uso legítimo sem 429 e seguram o excesso, com os
 * menores limites possíveis.
 */
import { evaluateGrid, gridComplete, gridSolution, type GridColumn, type GridExpected, type GridResponse, type GridRow } from '../shared/grid'
import { throttle } from './model'

export interface ApiClient {
  id: string
  label: string
  /** Requisições em cada segundo do uso legítimo; o ciclo se repete o dia todo. */
  demand: number[]
  concepts?: string[]
}

export interface ApiLabConfig {
  clients: ApiClient[]
  rateOptions: number[]
  burstOptions: number[]
}

export type ApiLabResponse = GridResponse

export const apiColumns = (c: ApiLabConfig): GridColumn[] => [
  { id: 'rate', label: 'Taxa (req/s)', options: c.rateOptions.map((n) => ({ id: String(n), label: n.toLocaleString('pt-BR') })) },
  { id: 'burst', label: 'Burst', options: c.burstOptions.map((n) => ({ id: String(n), label: n.toLocaleString('pt-BR') })) },
]

const describe = (x: ApiClient) => {
  const peak = Math.max(...x.demand)
  const avg = x.demand.reduce((s, d) => s + d, 0) / x.demand.length
  return `Uso legítimo, segundo a segundo, repetido o dia todo: ${x.demand.join(', ')} requisições (média de ${Math.round(avg)}, pico de ${peak}).`
}

export const apiRows = (c: ApiLabConfig): GridRow[] => c.clients.map((x) => ({ id: x.id, label: `**${x.label}**`, detail: describe(x), concepts: x.concepts }))

/** O ciclo repetido por tempo suficiente para o balde chegar ao regime. */
export const allDay = (demand: number[]) => Array.from({ length: 60 }, () => demand).flat()

/** A menor taxa que serve o uso sem 429 com algum burst da lista; depois, o menor burst com essa taxa. */
export function minimalPlan(c: ApiLabConfig, demand: number[]) {
  for (const rate of c.rateOptions) {
    const burst = c.burstOptions.find((b) => b >= rate && throttle(allDay(demand), { rate, burst: b }).throttled === 0)
    if (burst !== undefined) return { rate, burst }
  }
  throw new Error('Nenhum plano serve a demanda')
}

export function apiExpected(c: ApiLabConfig) {
  return (row: GridRow): Record<string, GridExpected> => {
    const x = c.clients.find((k) => k.id === row.id)!
    const p = minimalPlan(c, x.demand)
    const lower = c.rateOptions[c.rateOptions.indexOf(p.rate) - 1]
    return {
      rate: { answer: String(p.rate), why: lower !== undefined ? `Com ${lower} req/s, o balde não se reabastece a tempo e parte do uso legítimo recebe 429; ${p.rate} req/s é o menor limite que dá conta.` : `${p.rate} req/s já dá conta do uso legítimo.` },
      burst: { answer: String(p.burst), why: `Com taxa de ${p.rate} req/s, um balde de ${p.burst} absorve o pico de ${Math.max(...x.demand)} sem 429; um balde maior deixaria passar rajadas que o cliente não precisa.` },
    }
  }
}

export const apiSolution = (c: ApiLabConfig) => gridSolution(apiColumns(c), apiRows(c), apiExpected(c))
export const evaluateApiLab = (c: ApiLabConfig, r: ApiLabResponse) => evaluateGrid(apiColumns(c), apiRows(c), apiExpected(c), r)
export const apiComplete = (c: ApiLabConfig, r: ApiLabResponse) => gridComplete(apiColumns(c), apiRows(c), r)
