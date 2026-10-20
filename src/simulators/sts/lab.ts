/**
 * Laboratório "Cadeia de confiança": montar a trust policy de uma role e
 * escolher a duração máxima da sessão; tentativas de AssumeRole mostram quem
 * consegue assumir e por quanto tempo.
 */
import type { ItemFeedback } from '../../engine/types'
import { applyBuilt, builderIssues, type BuilderLabConfig, type BuilderStatement } from '../policy/builder'
import type { Policy } from '../policy/model'
import { assumeRole, STS_OUTCOME_LABEL, type AssumeAttempt, type AssumeResult } from './model'

export interface TrustAttempt extends Omit<AssumeAttempt, 'roleId'> {
  id: string
  label: string
  expect: 'ok' | 'fail'
  why: string
  concepts?: string[]
}

export interface TrustLabConfig {
  /** Construtor da trust policy (kind 'trust', alvo: o recurso da role). */
  builder: BuilderLabConfig
  roleId: string
  permissions: Policy[]
  /** Opções de duração máxima da sessão, em horas. */
  durationOptions: number[]
  attempts: TrustAttempt[]
  solution: TrustLabResponse
}

export interface TrustLabResponse {
  statements: BuilderStatement[]
  maxHours: number
}

export const trustInitial = (c: TrustLabConfig): TrustLabResponse => ({ statements: structuredClone(c.builder.initial ?? [{ effect: 'Allow', actions: [], resources: [], principals: [], conditions: [] }]), maxHours: 1 })

export interface AttemptRun {
  attempt: TrustAttempt
  result: AssumeResult
  met: boolean
}

export function runAttempts(c: TrustLabConfig, r: TrustLabResponse): AttemptRun[] {
  const sc = applyBuilt(c.builder, { statements: r.statements ?? [] })
  return c.attempts.map((a) => {
    const result = assumeRole(sc, { maxSessionHours: r.maxHours ?? 1, permissions: c.permissions }, { ...a, roleId: c.roleId })
    return { attempt: a, result, met: (result.outcome === 'ok') === (a.expect === 'ok') }
  })
}

export function evaluateTrustLab(c: TrustLabConfig, r: TrustLabResponse) {
  const runs = runAttempts(c, r)
  const items: { concepts?: string[]; score: number; fb: ItemFeedback }[] = runs.map((x) => ({
    concepts: x.attempt.concepts,
    score: x.met ? 1 : 0,
    fb: {
      id: x.attempt.id,
      label: `${x.attempt.label}: ${STS_OUTCOME_LABEL[x.result.outcome].toLowerCase()} (esperado: ${x.attempt.expect === 'ok' ? 'conseguir' : 'não conseguir'})`,
      status: x.met ? 'correct' : 'wrong',
      message: x.met ? x.attempt.why : `${x.attempt.why} ${x.result.trace.slice(-2).join(' ')}`,
    },
  }))
  let score = items.reduce((s, i) => s + i.score, 0) / Math.max(1, items.length)
  const issues = builderIssues(c.builder, { statements: r.statements ?? [] })
  if (issues.length) {
    score = Math.min(score, 0.5)
    items.push({ score: 0, fb: { id: 'invalid', label: 'Trust policy inválida', status: 'wrong', message: `A AWS não aceitaria esta política: ${issues.join(' ')}` } })
  }
  return { score, items }
}
