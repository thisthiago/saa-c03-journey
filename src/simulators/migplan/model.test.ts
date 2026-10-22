import { describe, expect, it } from 'vitest'
import { evaluateMigrationPlanLab, migrationPlanSolution, type MigrationPlanLabConfig } from './lab'
import { decide, RULES } from './model'

describe('estratégias de migração', () => {
  it('cobre as sete estratégias', () => {
    expect(new Set(Object.values(RULES).map((r) => r.strategy)).size).toBe(7)
  })
  it('rehost usa o MGN; banco gerenciado usa o DMS; arquivos, o DataSync', () => {
    expect(decide('as-is')).toMatchObject({ strategy: 'rehost', tool: 'mgn' })
    expect(decide('managed-db')).toMatchObject({ strategy: 'replatform', tool: 'dms' })
    expect(decide('managed-files')).toMatchObject({ strategy: 'replatform', tool: 'datasync' })
  })
})

describe('laboratório de migração', () => {
  const c: MigrationPlanLabConfig = { systems: [{ id: 'a', label: 'A', detail: 'x', trait: 'unused' }, { id: 'b', label: 'B', detail: 'y', trait: 'vmware' }] }
  it('a solução chega a 100% e o vazio fica em 0', () => {
    expect(evaluateMigrationPlanLab(c, migrationPlanSolution(c)).score).toBe(1)
    expect(evaluateMigrationPlanLab(c, { answers: {} }).score).toBe(0)
  })
})
