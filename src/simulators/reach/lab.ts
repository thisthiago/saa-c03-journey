/** Laboratório "O pacote chega?": ligar regras de security group e de network ACL para que cada fluxo passe ou seja bloqueado como pede o requisito. */
import type { ItemFeedback } from '../../engine/types'
import { OUTCOME_LABEL, traceFlow, type Flow, type NaclRule, type ReachWorld, type SgRule } from './model'

export type RuleTarget = { kind: 'sg-in'; sg: string; rule: SgRule } | { kind: 'nacl-in' | 'nacl-out'; subnet: string; rule: NaclRule }

export interface PaletteRule {
  id: string
  label: string
  target: RuleTarget
}

export interface ReachFlow extends Flow {
  label: string
  expect: 'allow' | 'deny'
  concepts?: string[]
}

export interface ReachLabConfig {
  world: ReachWorld
  palette: PaletteRule[]
  flows: ReachFlow[]
  /** Regras ligadas no começo. */
  initial: string[]
  solution: string[]
}

export interface ReachLabResponse {
  enabled: string[]
}

/** O mundo com as regras ligadas da paleta somadas às regras fixas do cenário. */
export function applyRules(c: ReachLabConfig, enabled: string[]): ReachWorld {
  const w: ReachWorld = structuredClone(c.world)
  for (const id of enabled) {
    const p = c.palette.find((x) => x.id === id)
    if (!p) continue
    const t = p.target
    if (t.kind === 'sg-in') w.groups.find((g) => g.id === t.sg)!.inbound.push(t.rule)
    else {
      const s = w.subnets.find((x) => x.id === t.subnet)!
      ;(t.kind === 'nacl-in' ? s.naclIn : s.naclOut).push(t.rule)
    }
  }
  return w
}

export const reachInitial = (c: ReachLabConfig): ReachLabResponse => ({ enabled: [...c.initial] })
export const reachSolution = (c: ReachLabConfig): ReachLabResponse => ({ enabled: [...c.solution] })

export function judgeFlow(w: ReachWorld, f: ReachFlow): { score: number; fb: ItemFeedback; detail: string[] } {
  const r = traceFlow(w, f)
  const ok = f.expect === 'allow' ? r.outcome === 'delivered' : r.outcome !== 'delivered'
  const want = f.expect === 'allow' ? 'precisa funcionar' : 'precisa ser bloqueado'
  return {
    score: ok ? 1 : 0,
    detail: r.trace,
    fb: { id: f.id, label: `${f.label} (${want})`, status: ok ? 'correct' : 'wrong', message: `Resultado: ${OUTCOME_LABEL[r.outcome]}. ${r.trace[r.trace.length - 1]}` },
  }
}

export function evaluateReachLab(c: ReachLabConfig, r: ReachLabResponse) {
  const w = applyRules(c, r?.enabled ?? c.initial)
  const items = c.flows.map((f) => {
    const j = judgeFlow(w, f)
    return { concepts: f.concepts, score: j.score, fb: j.fb }
  })
  return { score: items.reduce((s, x) => s + x.score, 0) / Math.max(1, items.length), items }
}
