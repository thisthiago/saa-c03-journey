/**
 * Laboratório "A estratégia de recuperação": para cada sistema, a estratégia
 * mais barata que cumpre o RPO e o RTO e o que fica rodando na Região de
 * recuperação.
 */
import { fmtUsd } from '../filesystem/model'
import { evaluateGrid, gridComplete, gridSolution, type GridColumn, type GridExpected, type GridResponse, type GridRow } from '../shared/grid'
import { cheapestStrategy, minutesText, SERVERS_LABEL, standbyMonthly, STRATEGIES, STRATEGY_LABEL, STRATEGY_SERVERS, STRATEGY_TARGETS, type DrWorkload, type StandbyServers } from './model'

export interface DrSystem {
  id: string
  label: string
  /** Perda de dados máxima aceita e tempo máximo fora do ar, em minutos. */
  rpoMin: number
  rtoMin: number
  workload: DrWorkload
  concepts?: string[]
}

export interface DrLabConfig {
  systems: DrSystem[]
}

export type DrLabResponse = GridResponse

export const drColumns = (): GridColumn[] => [
  { id: 'strategy', label: 'Estratégia', options: STRATEGIES.map((s) => ({ id: s, label: STRATEGY_LABEL[s] })) },
  { id: 'servers', label: 'Na Região de recuperação', options: (Object.keys(SERVERS_LABEL) as StandbyServers[]).map((s) => ({ id: s, label: SERVERS_LABEL[s] })) },
]

export const drRows = (c: DrLabConfig): GridRow[] =>
  c.systems.map((s) => ({
    id: s.id,
    label: `**${s.label}**`,
    detail: `Perda máxima de dados: ${minutesText(s.rpoMin)}. Tempo máximo fora do ar: ${minutesText(s.rtoMin)}. ${s.workload.instances} instâncias ${s.workload.instanceType}, banco ${s.workload.dbClass} e ${s.workload.dataGB.toLocaleString('pt-BR')} GB de dados.`,
    concepts: s.concepts,
  }))

export function drExpected(c: DrLabConfig) {
  return (row: GridRow): Record<string, GridExpected> => {
    const s = c.systems.find((x) => x.id === row.id)!
    const best = cheapestStrategy(s.rpoMin, s.rtoMin)
    const i = STRATEGIES.indexOf(best)
    const cost = standbyMonthly(best, s.workload)
    const cheaper = STRATEGIES[i - 1]
    const pricier = STRATEGIES[i + 1]
    const why = [
      `${STRATEGY_LABEL[best]} (${STRATEGY_TARGETS[best].range}) cumpre as metas, e a Região de recuperação custa cerca de ${fmtUsd(cost)} por mês.`,
      cheaper ? `${STRATEGY_LABEL[cheaper]} sairia mais barato, mas não cumpre: ${STRATEGY_TARGETS[cheaper].range}.` : '',
      pricier ? `${STRATEGY_LABEL[pricier]} também cumpre, mas custaria ${fmtUsd(standbyMonthly(pricier, s.workload))} por mês.` : '',
    ]
      .filter(Boolean)
      .join(' ')
    return {
      strategy: { answer: best, why },
      servers: { answer: STRATEGY_SERVERS[best], why: `No ${STRATEGY_LABEL[best].toLowerCase()}, a Região de recuperação fica assim: ${SERVERS_LABEL[STRATEGY_SERVERS[best]].toLowerCase()}.` },
    }
  }
}

export const drSolution = (c: DrLabConfig) => gridSolution(drColumns(), drRows(c), drExpected(c))
export const evaluateDrLab = (c: DrLabConfig, r: DrLabResponse) => evaluateGrid(drColumns(), drRows(c), drExpected(c), r)
export const drComplete = (c: DrLabConfig, r: DrLabResponse) => gridComplete(drColumns(), drRows(c), r)
