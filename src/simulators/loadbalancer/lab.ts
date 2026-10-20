/** Laboratório de regras do ALB: montar as regras do listener para cada requisição chegar ao destino certo. */
import type { ItemFeedback } from '../../engine/types'
import { routeAlb, validateListener, type Action, type Condition, type HttpRequest, type Listener } from './model'

export interface PaletteCondition {
  id: string
  label: string
  condition: Condition
}

export interface PaletteAction {
  id: string
  label: string
  action: Action
}

export interface LbTest {
  id: string
  request: HttpRequest
  /** Grupo esperado, "redirect" ou "fixed:<status>". */
  expect: string
  why: string
  concepts?: string[]
}

export interface RuleDraft {
  id: string
  priority: number
  conditionIds: string[]
  actionId?: string
}

export interface LbLabResponse {
  rules: RuleDraft[]
  defaultActionId: string
}

export interface LbLabConfig {
  targetGroups: { id: string; label: string }[]
  conditions: PaletteCondition[]
  actions: PaletteAction[]
  maxRules: number
  tests: LbTest[]
  initialDefault: string
  solution: LbLabResponse
}

/** Configuração inválida (que a AWS recusaria) vale no máximo metade. */
export const INVALID_CAP = 0.5

export const lbInitial = (c: LbLabConfig): LbLabResponse => ({ rules: [], defaultActionId: c.initialDefault })

export function toListener(c: LbLabConfig, r: LbLabResponse): Listener {
  const action = (id?: string) => c.actions.find((a) => a.id === id)?.action
  return {
    rules: (r.rules ?? []).map((d) => ({
      id: d.id,
      priority: d.priority,
      conditions: d.conditionIds.map((id) => c.conditions.find((x) => x.id === id)?.condition).filter((x): x is Condition => Boolean(x)),
      action: action(d.actionId) ?? { type: 'fixed-response', status: 503 },
    })),
    defaultAction: action(r.defaultActionId) ?? c.actions[0].action,
  }
}

export function draftErrors(c: LbLabConfig, r: LbLabResponse): string[] {
  const out = (r.rules ?? []).filter((d) => !d.actionId).map((d) => `a regra de prioridade ${d.priority} precisa de uma ação`)
  if ((r.rules ?? []).length > c.maxRules) out.push(`no máximo ${c.maxRules} regras neste cenário`)
  return [...out, ...validateListener(toListener(c, r))]
}

export const outcomeLabel = (c: LbLabConfig, key: string) =>
  key === 'redirect' ? 'redirecionamento' : key.startsWith('fixed:') ? `resposta fixa ${key.slice(6)}` : (c.targetGroups.find((g) => g.id === key)?.label ?? key)

export function evaluateLbLab(c: LbLabConfig, r: LbLabResponse) {
  const listener = toListener(c, r)
  const errors = draftErrors(c, r)
  const label = (id: string) => c.targetGroups.find((g) => g.id === id)?.label ?? id
  const items: { concepts?: string[]; score: number; fb: ItemFeedback }[] = c.tests.map((t) => {
    const res = routeAlb(listener, t.request, label)
    const ok = res.outcome === t.expect
    return {
      concepts: t.concepts,
      score: ok ? 1 : 0,
      fb: { id: t.id, label: `${t.request.label}: ${outcomeLabel(c, res.outcome)}`, status: ok ? 'correct' : 'wrong', message: ok ? t.why : `Esperado: ${outcomeLabel(c, t.expect)}. ${t.why} ${res.trace.join(' ')}` },
    }
  })
  let score = items.reduce((s, x) => s + x.score, 0) / Math.max(1, items.length)
  if (errors.length) {
    score = Math.min(score, INVALID_CAP)
    items.push({ concepts: undefined, score: 0, fb: { id: 'invalid', label: 'Configuração recusada', status: 'wrong', message: `A AWS recusaria este listener: ${errors.join('; ')}.` } })
  }
  return { score, items }
}
