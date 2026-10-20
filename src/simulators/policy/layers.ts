/**
 * Laboratório "Camadas de política": bibliotecas de statements por camada
 * (identidade, grupo, boundary, sessão, recurso, SCP e RCP). O jogador liga e
 * desliga statements e acompanha a matriz principal × requisição, recalculada
 * pelo motor de políticas.
 */
import type { ItemFeedback } from '../../engine/types'
import { evaluate, type EvalResult, type PolicyScenario, type PolicyStatement, type RequestSpec } from './model'

export type LayerTarget =
  | { type: 'identity' | 'boundary' | 'session'; principalId: string }
  | { type: 'group'; principalId: string; group: string }
  | { type: 'resource'; resourceId: string }
  | { type: 'scp' | 'rcp'; accountId: string; levelId: string }

export interface LayerLibrary {
  id: string
  /** Título da caixa (ex.: "Política de identidade de Ana"). */
  title: string
  /** Nome da política montada (aparece no rastro). */
  policyName: string
  target: LayerTarget
  statements: PolicyStatement[]
  /** Statements ligados no início. */
  initial: string[]
}

export interface LayersRequest extends Omit<RequestSpec, 'principalId'> {
  id: string
  label: string
}

export interface LayersGoal {
  principalId: string
  requestId: string
  expect: 'allow' | 'deny'
  why: string
  concepts?: string[]
}

export interface LayersLabConfig {
  scenario: PolicyScenario
  libraries: LayerLibrary[]
  rows: string[]
  requests: LayersRequest[]
  goals: LayersGoal[]
  solution: LayersLabResponse
}

export interface LayersLabResponse {
  active: Record<string, string[]>
}

export const layersInitial = (c: LayersLabConfig): LayersLabResponse => ({ active: Object.fromEntries(c.libraries.map((l) => [l.id, [...l.initial]])) })

/** Cenário com as camadas montadas a partir dos statements ligados. Biblioteca vazia: camada ausente (exceto SCP/RCP, que ficam sem Allow). */
export function applyLayers(c: LayersLabConfig, r: LayersLabResponse): PolicyScenario {
  const sc = structuredClone(c.scenario)
  for (const lib of c.libraries) {
    const sids = r.active?.[lib.id] ?? []
    const statements = lib.statements.filter((st) => sids.includes(st.sid))
    const policy = { id: lib.id, name: lib.policyName, statements }
    const t = lib.target
    if (t.type === 'resource') {
      const res = sc.resources.find((x) => x.id === t.resourceId)
      if (res) res.policy = statements.length ? policy : undefined
      continue
    }
    if (t.type === 'scp' || t.type === 'rcp') {
      const { accountId, levelId } = t
      const acct = sc.accounts?.find((a) => a.id === accountId)
      const level = (t.type === 'scp' ? acct?.scps : acct?.rcps)?.find((l) => l.id === levelId)
      if (level && statements.length) level.policies = [...level.policies, policy]
      continue
    }
    if (!('principalId' in t)) continue
    const { principalId } = t
    const p = sc.principals.find((x) => x.id === principalId)
    if (!p) continue
    if (t.type === 'identity') {
      if (statements.length) p.identityPolicies = [...(p.identityPolicies ?? []), policy]
    } else if (t.type === 'group') {
      const { group } = t
      const groups = p.groups ?? []
      const g = groups.find((x) => x.name === group)
      if (g) g.policies = [...g.policies, ...(statements.length ? [policy] : [])]
      else if (statements.length) groups.push({ name: group, policies: [policy] })
      p.groups = groups
    } else if (t.type === 'boundary') {
      p.boundary = statements.length ? policy : undefined
    } else {
      p.sessionPolicy = statements.length ? policy : undefined
    }
  }
  return sc
}

export interface LayersCell {
  requestId: string
  result: EvalResult
}

export function layersMatrix(c: LayersLabConfig, sc: PolicyScenario): { principalId: string; cells: LayersCell[] }[] {
  return c.rows.map((principalId) => ({
    principalId,
    cells: c.requests.map((req) => {
      const { id, label: _label, ...spec } = req
      return { requestId: id, result: evaluate(sc, { ...spec, principalId }) }
    }),
  }))
}

export function evaluateLayersLab(c: LayersLabConfig, r: LayersLabResponse) {
  const sc = applyLayers(c, r)
  const items: { concepts?: string[]; score: number; fb: ItemFeedback }[] = c.goals.map((g) => {
    const req = c.requests.find((x) => x.id === g.requestId)!
    const { id: _id, label: _label, ...spec } = req
    const who = sc.principals.find((p) => p.id === g.principalId)!
    const d = evaluate(sc, { ...spec, principalId: g.principalId })
    const ok = d.allowed === (g.expect === 'allow')
    return {
      concepts: g.concepts,
      score: ok ? 1 : 0,
      fb: {
        id: `${g.principalId}:${g.requestId}`,
        label: `${who.name} · ${req.label}: ${d.allowed ? 'permitido' : 'negado'} (esperado: ${g.expect === 'allow' ? 'permitido' : 'negado'})`,
        status: ok ? 'correct' : 'wrong',
        message: ok ? g.why : `${g.why} ${d.trace.slice(-2).join(' ')}`,
      },
    }
  })
  return { score: items.reduce((s, i) => s + i.score, 0) / Math.max(1, items.length), items }
}
