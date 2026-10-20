/**
 * Laboratório "Guardrails da organização": anexar e desanexar SCPs na raiz,
 * nas OUs e nas contas, e acompanhar a matriz principal × requisição.
 */
import type { ItemFeedback } from '../../engine/types'
import type { LayersGoal, LayersRequest } from '../policy/layers'
import { evaluate, type EvalResult, type Policy, type PolicyScenario } from '../policy/model'
import { orgAccounts, type Attachments, type OrgNode } from './model'

export interface OrgLabConfig {
  orgId: string
  nodes: OrgNode[]
  /** SCPs disponíveis para anexar. */
  library: Policy[]
  initial: Attachments
  /** Principais e recursos (as contas vêm da árvore). */
  scenario: PolicyScenario
  requests: LayersRequest[]
  goals: LayersGoal[]
  solution: OrgLabResponse
}

export interface OrgLabResponse {
  attached: Attachments
}

export const orgInitial = (c: OrgLabConfig): OrgLabResponse => ({ attached: structuredClone(c.initial) })

export function orgScenario(c: OrgLabConfig, r: OrgLabResponse): PolicyScenario {
  return { ...c.scenario, accounts: orgAccounts(c.orgId, c.nodes, c.library, r.attached ?? {}) }
}

export interface GoalRun {
  goal: LayersGoal
  label: string
  principalName: string
  result: EvalResult
  met: boolean
}

/** Cada objetivo avaliado na organização montada. */
export function runOrgGoals(c: OrgLabConfig, sc: PolicyScenario): GoalRun[] {
  return c.goals.map((goal) => {
    const { id: _id, label, ...spec } = c.requests.find((x) => x.id === goal.requestId)!
    const result = evaluate(sc, { ...spec, principalId: goal.principalId })
    return { goal, label, principalName: sc.principals.find((p) => p.id === goal.principalId)!.name, result, met: result.allowed === (goal.expect === 'allow') }
  })
}

export function evaluateOrgLab(c: OrgLabConfig, r: OrgLabResponse) {
  const sc = orgScenario(c, r)
  const items: { concepts?: string[]; score: number; fb: ItemFeedback }[] = c.goals.map((g) => {
    const { id: _id, label, ...spec } = c.requests.find((x) => x.id === g.requestId)!
    const who = sc.principals.find((p) => p.id === g.principalId)!
    const d = evaluate(sc, { ...spec, principalId: g.principalId })
    const ok = d.allowed === (g.expect === 'allow')
    return {
      concepts: g.concepts,
      score: ok ? 1 : 0,
      fb: {
        id: `${g.principalId}:${g.requestId}`,
        label: `${who.name} · ${label}: ${d.allowed ? 'permitido' : 'negado'} (esperado: ${g.expect === 'allow' ? 'permitido' : 'negado'})`,
        status: ok ? 'correct' : 'wrong',
        message: ok ? g.why : `${g.why} ${d.trace.slice(-2).join(' ')}`,
      },
    }
  })
  return { score: items.reduce((s, i) => s + i.score, 0) / Math.max(1, items.length), items }
}
