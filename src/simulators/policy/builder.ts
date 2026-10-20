/**
 * Laboratório "Construtor de políticas": o jogador monta statements com peças
 * prontas (efeito, principais, ações, recursos e condições), vê o JSON real e
 * testa a política contra requisições que devem passar e requisições que devem
 * ser negadas. Sondas de menor privilégio penalizam políticas largas demais.
 */
import type { ItemFeedback } from '../../engine/types'
import { evaluate, type ConditionClause, type Effect, type Policy, type PolicyScenario, type PolicyStatement, type PrincipalRef, type RequestSpec } from './model'

export type BuilderPolicyKind = 'identity' | 'resource' | 'trust' | 'boundary' | 'scp'

export const POLICY_KIND_LABEL: Record<BuilderPolicyKind, string> = {
  identity: 'Política de identidade',
  resource: 'Política de recurso',
  trust: 'Trust policy',
  boundary: 'Permissions boundary',
  scp: 'Service control policy (SCP)',
}

export type BuilderTarget =
  | { type: 'identity' | 'boundary'; principalIds: string[] }
  /** `alsoAppliesTo`: outros recursos do cenário cobertos pela mesma política (ex.: objetos do bucket). */
  | { type: 'resource'; resourceId: string; alsoAppliesTo?: string[] }
  | { type: 'scp'; accountId: string; levelId: string }

export interface BuilderPalette {
  actions: string[]
  /** Ausente em trust policies (o recurso é a própria role). */
  resources?: string[]
  /** Só em políticas de recurso e trust policies. */
  principals?: { id: string; label: string; ref: PrincipalRef }[]
  conditions?: { id: string; label: string; clause: ConditionClause }[]
  effects?: Effect[]
  /** Permite trocar Action por NotAction. */
  notAction?: boolean
}

export interface BuilderStatement {
  effect: Effect
  actions: string[]
  notAction?: boolean
  resources: string[]
  principals: string[]
  conditions: string[]
}

export interface BuilderTest {
  id: string
  label: string
  request: RequestSpec
  expect: 'allow' | 'deny'
  why: string
  concepts?: string[]
}

export interface BuilderLabConfig {
  kind: BuilderPolicyKind
  policyName: string
  /** Onde a política fica, como frase completa (ex.: "Anexada ao grupo **Gestores**."). */
  attachedTo: string
  scenario: PolicyScenario
  target: BuilderTarget
  palette: BuilderPalette
  maxStatements: number
  initial?: BuilderStatement[]
  tests: BuilderTest[]
  /** Requisições que não deveriam passar: se passarem, a política está larga demais. */
  probes?: BuilderTest[]
  solution: BuilderStatement[]
}

export interface BuilderLabResponse {
  statements: BuilderStatement[]
}

export const PROBE_PENALTY = 0.7

export const emptyStatement = (palette: BuilderPalette): BuilderStatement => ({ effect: palette.effects?.[0] ?? 'Allow', actions: [], resources: [], principals: [], conditions: [] })

export const builderInitial = (c: BuilderLabConfig): BuilderLabResponse => ({ statements: structuredClone(c.initial ?? [emptyStatement(c.palette)]) })

/** Converte os statements montados em statements do motor de políticas. */
export function toStatements(c: BuilderLabConfig, r: BuilderLabResponse): PolicyStatement[] {
  return (r.statements ?? []).map((b, i) => {
    const conditions = b.conditions.map((id) => c.palette.conditions?.find((x) => x.id === id)?.clause).filter((x): x is ConditionClause => Boolean(x))
    const principals = b.principals.map((id) => c.palette.principals?.find((x) => x.id === id)?.ref).filter((x): x is PrincipalRef => Boolean(x))
    return {
      sid: `Stmt${i + 1}`,
      effect: b.effect,
      ...(c.palette.principals ? { principals } : {}),
      ...(b.notAction ? { notActions: b.actions } : { actions: b.actions }),
      ...(c.palette.resources ? { resources: b.resources } : {}),
      ...(conditions.length ? { conditions } : {}),
    }
  })
}

export function builtPolicy(c: BuilderLabConfig, r: BuilderLabResponse): Policy {
  return { id: 'construida', name: c.policyName, statements: toStatements(c, r) }
}

/** Cenário com a política construída aplicada ao alvo. */
export function applyBuilt(c: BuilderLabConfig, r: BuilderLabResponse): PolicyScenario {
  const sc = structuredClone(c.scenario)
  const policy = builtPolicy(c, r)
  const t = c.target
  if (t.type === 'identity' || t.type === 'boundary') {
    for (const p of sc.principals) {
      if (!t.principalIds.includes(p.id)) continue
      if (t.type === 'identity') p.identityPolicies = [...(p.identityPolicies ?? []), policy]
      else p.boundary = policy
    }
  } else if (t.type === 'resource') {
    const ids = [t.resourceId, ...(t.alsoAppliesTo ?? [])]
    for (const res of sc.resources) if (ids.includes(res.id)) res.policy = policy
  } else if (t.type === 'scp') {
    const { accountId, levelId } = t
    const acct = sc.accounts?.find((a) => a.id === accountId)
    const level = acct?.scps?.find((l) => l.id === levelId)
    if (level) level.policies = [...level.policies, policy]
  }
  return sc
}

/** Problemas que a AWS rejeitaria ao salvar a política (statement sem ação, sem recurso ou sem principal). */
export function builderIssues(c: BuilderLabConfig, r: BuilderLabResponse): string[] {
  const issues: string[] = []
  ;(r.statements ?? []).forEach((b, i) => {
    const n = `Statement ${i + 1}`
    if (b.actions.length === 0) issues.push(`${n}: escolha ao menos uma ação.`)
    if (c.palette.resources && b.resources.length === 0) issues.push(`${n}: escolha ao menos um recurso.`)
    if (c.palette.principals && b.principals.length === 0) issues.push(`${n}: escolha ao menos um principal.`)
  })
  return issues
}

export interface TestRun {
  test: BuilderTest
  allowed: boolean
  met: boolean
  trace: string[]
}

export function runTests(c: BuilderLabConfig, r: BuilderLabResponse): { tests: TestRun[]; probes: TestRun[] } {
  const sc = applyBuilt(c, r)
  const run = (t: BuilderTest): TestRun => {
    const d = evaluate(sc, t.request)
    return { test: t, allowed: d.allowed, met: d.allowed === (t.expect === 'allow'), trace: d.trace }
  }
  return { tests: c.tests.map(run), probes: (c.probes ?? []).map(run) }
}

export function evaluateBuilderLab(c: BuilderLabConfig, r: BuilderLabResponse) {
  const issues = builderIssues(c, r)
  const { tests, probes } = runTests(c, r)
  const items: { concepts?: string[]; score: number; fb: ItemFeedback }[] = tests.map((t) => ({
    concepts: t.test.concepts,
    score: t.met ? 1 : 0,
    fb: {
      id: t.test.id,
      label: `${t.test.label}: ${t.allowed ? 'permitido' : 'negado'} (esperado: ${t.test.expect === 'allow' ? 'permitido' : 'negado'})`,
      status: t.met ? 'correct' : 'wrong',
      message: t.met ? t.test.why : `${t.test.why} ${t.trace.slice(-2).join(' ')}`,
    },
  }))
  let score = items.reduce((s, i) => s + i.score, 0) / Math.max(1, items.length)
  const leaks = probes.filter((p) => !p.met)
  if (leaks.length) {
    score *= PROBE_PENALTY
    for (const p of leaks) items.push({ concepts: p.test.concepts, score: 0, fb: { id: p.test.id, label: `Menor privilégio · ${p.test.label}: permitido`, status: 'wrong', message: p.test.why } })
  }
  if (issues.length) {
    score = Math.min(score, 0.5)
    items.push({ score: 0, fb: { id: 'invalid', label: 'Política inválida', status: 'wrong', message: `A AWS não aceitaria esta política: ${issues.join(' ')}` } })
  }
  return { score, items }
}
