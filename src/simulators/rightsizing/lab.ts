/**
 * Laboratório "Tamanho e compra certos": para cada frota, quantos tamanhos
 * reduzir pela utilização medida e a forma de pagar mais barata que respeita a
 * carga.
 */
import { fmtUsd } from '../filesystem/model'
import { evaluateGrid, gridComplete, gridSolution, type GridColumn, type GridExpected, type GridResponse, type GridRow } from '../shared/grid'
import { bestBuy, BUY_LABEL, buyMonthly, buyProblem, CANDIDATE_BELOW, MAX_AFTER, rightsize, type Buy, type Fleet } from './model'

export interface RightsizingItem extends Fleet {
  id: string
  label: string
  concepts?: string[]
}

export interface RightsizingLabConfig {
  fleets: RightsizingItem[]
}

export type RightsizingLabResponse = GridResponse

const STEP_LABEL = ['Manter o tamanho', 'Um tamanho abaixo', 'Dois tamanhos abaixo']

export const rightsizingColumns = (): GridColumn[] => [
  { id: 'size', label: 'Tamanho', options: STEP_LABEL.map((label, i) => ({ id: String(i), label })) },
  { id: 'buy', label: 'Compra', options: (Object.keys(BUY_LABEL) as Buy[]).map((b) => ({ id: b, label: BUY_LABEL[b] })) },
]

const usage = (f: Fleet) => (f.hoursPerWeek >= 168 ? 'ligada o tempo todo' : `usada ${f.hoursPerWeek} horas por semana`)

export const rightsizingRows = (c: RightsizingLabConfig): GridRow[] =>
  c.fleets.map((f) => ({
    id: f.id,
    label: `**${f.label}**`,
    detail: `${f.count} × ${f.type}, ${usage(f)}. Uso máximo em quatro semanas: CPU ${f.maxCpu}% e memória ${f.maxMem}%. ${f.interruptible ? 'Aguenta interrupções.' : 'Não aguenta interrupções.'} ${f.monthsLeft >= 12 ? 'Vai continuar por anos.' : `Termina em ${f.monthsLeft} meses.`}`,
    concepts: f.concepts,
  }))

export function rightsizingExpected(c: RightsizingLabConfig) {
  return (row: GridRow): Record<string, GridExpected> => {
    const f = c.fleets.find((x) => x.id === row.id)!
    const r = rightsize(f)
    const peak = Math.max(f.maxCpu, f.maxMem)
    const buy = bestBuy(f, r.type)
    const rivals = (Object.keys(BUY_LABEL) as Buy[])
      .filter((b) => b !== buy)
      .map((b) => {
        const p = buyProblem(f, b)
        return p ? `${BUY_LABEL[b]} não serve: ${p}` : `${BUY_LABEL[b]} custaria ${fmtUsd(buyMonthly(f, r.type, b))}`
      })
      .join('; ')
    return {
      size: {
        answer: String(r.steps),
        why:
          r.steps === 0
            ? peak >= CANDIDATE_BELOW
              ? `O uso máximo de ${peak}% não está abaixo de ${CANDIDATE_BELOW}%: reduzir levaria o pico a ${MAX_AFTER}% ou mais.`
              : `Não há tipo menor da mesma família na tabela: ${f.type} fica como está.`
            : `Com uso máximo de ${peak}%, ${r.type} fica em cerca de ${r.peakAfter}% no pico, abaixo do limite de ${MAX_AFTER}%.`,
      },
      buy: { answer: buy, why: `${BUY_LABEL[buy]} sai por ${fmtUsd(buyMonthly(f, r.type, buy))} por mês com ${f.count} × ${r.type}. ${rivals}.` },
    }
  }
}

export const rightsizingSolution = (c: RightsizingLabConfig) => gridSolution(rightsizingColumns(), rightsizingRows(c), rightsizingExpected(c))
export const evaluateRightsizingLab = (c: RightsizingLabConfig, r: RightsizingLabResponse) => evaluateGrid(rightsizingColumns(), rightsizingRows(c), rightsizingExpected(c), r)
export const rightsizingComplete = (c: RightsizingLabConfig, r: RightsizingLabResponse) => gridComplete(rightsizingColumns(), rightsizingRows(c), r)
