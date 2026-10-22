import { describe, expect, it } from 'vitest'
import { filesPrices } from '../files-prices'
import { backupSolution, evaluateBackupLab, expectedFrequency, type BackupLabConfig } from './lab'
import { efsBackupMonthly, planProblem, survives, type BackupPlan } from './model'

const plan = (x: Partial<BackupPlan>): BackupPlan => ({ resource: 'efs', frequency: 'daily', retentionDays: 365, copy: 'none', lock: 'none', ...x })

describe('regras do plano', () => {
  it('o frio exige 90 dias além da transição', () => {
    expect(planProblem(plan({ coldAfterDays: 30, retentionDays: 119 }))).toMatch(/90 dias/)
    expect(planProblem(plan({ coldAfterDays: 30, retentionDays: 120 }))).toBeNull()
  })
  it('o contínuo guarda até 35 dias e só existe para alguns serviços', () => {
    expect(planProblem(plan({ resource: 'rds', frequency: 'continuous', retentionDays: 35 }))).toBeNull()
    expect(planProblem(plan({ resource: 'rds', frequency: 'continuous', retentionDays: 36 }))).toMatch(/35 dias/)
    expect(planProblem(plan({ resource: 'efs', frequency: 'continuous', retentionDays: 7 }))).not.toBeNull()
  })
  it('o EBS só vai para o frio com backups mensais', () => {
    expect(planProblem(plan({ resource: 'ebs', frequency: 'weekly', coldAfterDays: 30 }))).not.toBeNull()
    expect(planProblem(plan({ resource: 'ebs', frequency: 'monthly', coldAfterDays: 30 }))).toBeNull()
    expect(planProblem(plan({ resource: 'fsx-windows', coldAfterDays: 30 }))).not.toBeNull()
  })
})

describe('desastres', () => {
  it('a perda da Região só é coberta por cópia em outra Região', () => {
    expect(survives(plan({}), 'region-outage').ok).toBe(false)
    expect(survives(plan({ copy: 'region' }), 'region-outage').ok).toBe(true)
  })
  it('o administrador apaga com governança, mas não com conformidade', () => {
    expect(survives(plan({ lock: 'governance' }), 'admin-deletes-backups').ok).toBe(false)
    expect(survives(plan({ lock: 'compliance' }), 'admin-deletes-backups').ok).toBe(true)
  })
  it('a cópia em outra conta escapa do invasor', () => {
    expect(survives(plan({}), 'account-compromised').ok).toBe(false)
    expect(survives(plan({ copy: 'account' }), 'account-compromised').ok).toBe(true)
  })
})

describe('laboratório de backup', () => {
  it('a frequência é a mais espaçada que cumpre o RPO', () => {
    const n = { id: 'x', label: 'x', resource: 'efs' as const, retentionDays: 30, mustSurvive: [], lockRule: 'none' as const }
    expect(expectedFrequency({ ...n, rpoHours: 24 })).toBe('daily')
    expect(expectedFrequency({ ...n, rpoHours: 6 })).toBe('hourly')
    expect(expectedFrequency({ ...n, rpoHours: 0.25, resource: 'rds' })).toBe('continuous')
  })
  it('o frio reduz o custo dos backups do EFS', () => {
    const p = filesPrices().backup
    expect(efsBackupMonthly(plan({ coldAfterDays: 30 }), 1000, p)).toBeLessThan(efsBackupMonthly(plan({}), 1000, p))
  })
  it('a solução chega a 100%', () => {
    const c: BackupLabConfig = {
      needs: [
        { id: 'a', label: 'A', resource: 'efs', rpoHours: 24, retentionDays: 1825, mustSurvive: ['region-outage'], lockRule: 'legal', storedGB: 800 },
        { id: 'b', label: 'B', resource: 'rds', rpoHours: 0.1, retentionDays: 14, mustSurvive: ['account-compromised'], lockRule: 'none' },
      ],
    }
    expect(evaluateBackupLab(c, backupSolution(c)).score).toBe(1)
    expect(evaluateBackupLab(c, { answers: {} }).score).toBe(0)
  })
})
