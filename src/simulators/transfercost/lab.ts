/**
 * Laboratório "A conta da transferência": para cada fluxo de dados, quanto
 * custa cada GB no caminho atual e qual mudança deixa o fluxo mais barato sem
 * quebrar os requisitos.
 */
import { fmtPrice, fmtUsd } from '../filesystem/model'
import { evaluateGrid, gridComplete, gridSolution, type GridColumn, type GridExpected, type GridResponse, type GridRow } from '../shared/grid'
import { cheapestPath, monthlyCost, PATH_LABEL, perGB, type TransferPath } from './model'

export interface TransferFlow {
  id: string
  label: string
  detail: string
  gbPerMonth: number
  current: TransferPath
  /** Outros caminhos que atendem aos requisitos do fluxo. */
  alternatives: TransferPath[]
  destRegion?: string
  concepts?: string[]
}

export interface TransferCostLabConfig {
  flows: TransferFlow[]
}

export type TransferCostLabResponse = GridResponse

const PATHS = Object.keys(PATH_LABEL) as TransferPath[]
const rateId = (v: number) => v.toFixed(4)

export function transferCostColumns(c: TransferCostLabConfig): GridColumn[] {
  const rates = new Set([...PATHS.map((p) => perGB(p)), ...c.flows.map((f) => perGB(f.current, f.destRegion))])
  return [
    { id: 'rate', label: 'Cobrança por GB no caminho atual', options: [...rates].sort((a, b) => a - b).map((v) => ({ id: rateId(v), label: v === 0 ? 'Sem cobrança' : fmtPrice(v) })) },
    { id: 'change', label: 'Mudança que mais reduz a conta', options: [{ id: 'keep', label: 'Manter: já é o mais barato' }, ...PATHS.map((p) => ({ id: p, label: `Passar para: ${PATH_LABEL[p].toLowerCase()}` }))] },
  ]
}

export const transferCostRows = (c: TransferCostLabConfig): GridRow[] =>
  c.flows.map((f) => ({ id: f.id, label: `**${f.label}**`, detail: `${f.detail} Hoje: ${PATH_LABEL[f.current].toLowerCase()}. Volume: ${f.gbPerMonth.toLocaleString('pt-BR')} GB por mês.`, concepts: f.concepts }))

export function transferCostExpected(c: TransferCostLabConfig) {
  return (row: GridRow): Record<string, GridExpected> => {
    const f = c.flows.find((x) => x.id === row.id)!
    const rate = perGB(f.current, f.destRegion)
    const now = monthlyCost(f.current, f.gbPerMonth, f.destRegion)
    const best = cheapestPath([f.current, ...f.alternatives], f.gbPerMonth, f.destRegion)
    const others = f.alternatives.map((p) => `${PATH_LABEL[p].toLowerCase()}: ${fmtUsd(monthlyCost(p, f.gbPerMonth, f.destRegion))}`).join('; ')
    return {
      rate: { answer: rateId(rate), why: `${PATH_LABEL[f.current]}: ${rate === 0 ? 'sem cobrança por GB' : `${fmtPrice(rate)} por GB`}, ou ${fmtUsd(now)} por mês.` },
      change:
        best === f.current
          ? { answer: 'keep', why: `O caminho atual já é o mais barato. Alternativas: ${others}.` }
          : { answer: best, why: `${PATH_LABEL[best]} sai por ${fmtUsd(monthlyCost(best, f.gbPerMonth, f.destRegion))} por mês, contra ${fmtUsd(now)} hoje. Alternativas: ${others}.` },
    }
  }
}

export const transferCostSolution = (c: TransferCostLabConfig) => gridSolution(transferCostColumns(c), transferCostRows(c), transferCostExpected(c))
export const evaluateTransferCostLab = (c: TransferCostLabConfig, r: TransferCostLabResponse) => evaluateGrid(transferCostColumns(c), transferCostRows(c), transferCostExpected(c), r)
export const transferCostComplete = (c: TransferCostLabConfig, r: TransferCostLabResponse) => gridComplete(transferCostColumns(c), transferCostRows(c), r)
