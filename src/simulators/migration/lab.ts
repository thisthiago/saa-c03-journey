/** Laboratório de migração: o plano do DMS para cada banco legado. */
import type { ItemFeedback } from '../../engine/types'
import { checkPlan, referencePlan, type MigrationPlan, type MigrationScenario } from './model'

export interface MigrationItem {
  id: string
  name: string
  description: string
  scenario: MigrationScenario
  concepts?: string[]
}

export interface MigrationLabConfig {
  items: MigrationItem[]
}

export interface MigrationLabResponse {
  plans: Record<string, MigrationPlan | undefined>
}

export const EMPTY_PLAN: MigrationPlan = { schema: 'none', validation: false }

export const migrationInitial = (c: MigrationLabConfig): MigrationLabResponse => ({ plans: Object.fromEntries(c.items.map((i) => [i.id, { ...EMPTY_PLAN }])) })
export const migrationSolution = (c: MigrationLabConfig): MigrationLabResponse => ({ plans: Object.fromEntries(c.items.map((i) => [i.id, referencePlan(i.scenario)])) })

const CHECK_LABEL = { schema: 'esquema', task: 'tarefa do DMS', validation: 'validação' } as const

export function evaluateMigrationLab(c: MigrationLabConfig, r: MigrationLabResponse) {
  const items = c.items.flatMap((it) =>
    checkPlan(it.scenario, r.plans?.[it.id] ?? EMPTY_PLAN).map((ch) => ({
      concepts: it.concepts,
      score: ch.ok ? 1 : 0,
      fb: { id: `${it.id}:${ch.id}`, label: `${it.name}: ${CHECK_LABEL[ch.id]}`, status: ch.ok ? 'correct' : 'wrong', message: ch.message } as ItemFeedback,
    })),
  )
  return { score: items.reduce((s, x) => s + x.score, 0) / Math.max(1, items.length), items }
}

export const migrationComplete = (c: MigrationLabConfig, r: MigrationLabResponse) => c.items.every((i) => Boolean(r.plans?.[i.id]?.task))
