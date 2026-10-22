/** Laboratório "O plano de migração": estratégia e ferramenta de cada sistema do portfólio. */
import { evaluateGrid, gridComplete, gridSolution, type GridColumn, type GridExpected, type GridResponse, type GridRow } from '../shared/grid'
import { decide, STRATEGY_LABEL, TOOL_LABEL, type MigStrategy, type MigTool, type MigTrait } from './model'

export interface MigSystem {
  id: string
  label: string
  detail: string
  trait: MigTrait
  concepts?: string[]
}

export interface MigrationPlanLabConfig {
  systems: MigSystem[]
}

export type MigrationPlanLabResponse = GridResponse

export const migrationPlanColumns = (): GridColumn[] => [
  { id: 'strategy', label: 'Estratégia', options: (Object.keys(STRATEGY_LABEL) as MigStrategy[]).map((s) => ({ id: s, label: STRATEGY_LABEL[s] })) },
  { id: 'tool', label: 'Ferramenta', options: (Object.keys(TOOL_LABEL) as MigTool[]).map((t) => ({ id: t, label: TOOL_LABEL[t] })) },
]

export const migrationPlanRows = (c: MigrationPlanLabConfig): GridRow[] => c.systems.map((s) => ({ id: s.id, label: `**${s.label}**`, detail: s.detail, concepts: s.concepts }))

export function migrationPlanExpected(c: MigrationPlanLabConfig) {
  return (row: GridRow): Record<string, GridExpected> => {
    const s = c.systems.find((x) => x.id === row.id)!
    const r = decide(s.trait)
    return { strategy: { answer: r.strategy, why: r.why }, tool: { answer: r.tool, why: r.toolWhy } }
  }
}

export const migrationPlanSolution = (c: MigrationPlanLabConfig) => gridSolution(migrationPlanColumns(), migrationPlanRows(c), migrationPlanExpected(c))
export const evaluateMigrationPlanLab = (c: MigrationPlanLabConfig, r: MigrationPlanLabResponse) => evaluateGrid(migrationPlanColumns(), migrationPlanRows(c), migrationPlanExpected(c), r)
export const migrationPlanComplete = (c: MigrationPlanLabConfig, r: MigrationPlanLabResponse) => gridComplete(migrationPlanColumns(), migrationPlanRows(c), r)
