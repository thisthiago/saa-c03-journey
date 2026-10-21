import { describe, expect, it } from 'vitest'
import { checkPlan, downtimeMin, isHeterogeneous, referencePlan, type MigrationScenario } from './model'

const oracle: MigrationScenario = { source: 'oracle', target: 'aurora-postgresql', sizeGB: 800, maxDowntimeMin: 30, mustValidate: true }

describe('migração com o DMS', () => {
  it('de Oracle para Aurora PostgreSQL é heterogênea e exige converter o esquema', () => {
    expect(isHeterogeneous(oracle)).toBe(true)
    expect(checkPlan(oracle, { schema: 'none', task: 'full-load-cdc', validation: true })[0].ok).toBe(false)
  })

  it('carga completa de 800 GB passa da janela de 30 minutos; com captura de mudanças, a virada cabe', () => {
    expect(downtimeMin(oracle, 'full-load')).toBe(240)
    expect(downtimeMin(oracle, 'full-load-cdc')).toBe(10)
    expect(referencePlan(oracle)).toEqual({ schema: 'schema-conversion', task: 'full-load-cdc', validation: true })
  })

  it('com o destino já carregado, basta replicar as mudanças', () => {
    const s: MigrationScenario = { source: 'sql-server', target: 'rds-sql-server', sizeGB: 500, maxDowntimeMin: 15, targetPreloaded: true }
    expect(referencePlan(s).task).toBe('cdc-only')
    expect(checkPlan(s, { schema: 'none', task: 'full-load-cdc', validation: false })[1].ok).toBe(false)
  })

  it('banco pequeno com janela folgada aceita a carga completa', () => {
    const s: MigrationScenario = { source: 'mysql', target: 'rds-mysql', sizeGB: 50, maxDowntimeMin: 240 }
    expect(referencePlan(s)).toEqual({ schema: 'none', task: 'full-load', validation: false })
  })
})
