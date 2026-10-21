/** Laboratório do AWS Config: ligar as regras que a política pede e escolher a remediação certa para cada uma. */
import type { ItemFeedback } from '../../engine/types'
import { usd } from '../compute-prices'
import { evaluationsCost, evaluationsPerMonth, RULE_IDS, RULES, runRules, type CfgResource, type RuleChoice, type RuleParams } from './model'

export interface ComplianceScenario {
  id: string
  name: string
  description: string
  resources: CfgResource[]
  /** Regras que a política da empresa exige. */
  required: string[]
  params?: Record<string, RuleParams>
  /** Regras oferecidas no cenário. */
  palette: string[]
  /** Regras para as quais a equipe tem um documento de automação testado (premissa do cenário). */
  automation: string[]
  /** Remediação esperada para cada regra exigida. */
  expected: Record<string, 'auto' | 'manual'>
  /** Quantas vezes por mês cada recurso muda (premissa do cenário). */
  changesPerMonth: number
  /** A política, em tópicos. */
  policy: string[]
  concepts?: string[]
}

export interface ComplianceLabConfig {
  region?: string
  scenarios: ComplianceScenario[]
}

export interface ComplianceLabResponse {
  choices: Record<string, Record<string, RuleChoice | undefined> | undefined>
}

export const complianceLabInitial = (c: ComplianceLabConfig): ComplianceLabResponse => ({ choices: Object.fromEntries(c.scenarios.map((s) => [s.id, {}])) })

export const complianceLabSolution = (c: ComplianceLabConfig): ComplianceLabResponse => ({
  choices: Object.fromEntries(c.scenarios.map((s) => [s.id, Object.fromEntries(s.required.map((id) => [id, { on: true, mode: s.expected[id] } as RuleChoice]))])),
})

export function monthlyEvaluations(s: ComplianceScenario, choices: Record<string, RuleChoice | undefined>): number {
  return RULE_IDS.filter((id) => choices[id]?.on).reduce((sum, id) => sum + evaluationsPerMonth(RULES[id], s.resources.filter((r) => RULES[id].types.includes(r.type)).length, s.changesPerMonth), 0)
}

export function judgeRules(s: ComplianceScenario, choices: Record<string, RuleChoice | undefined>, region?: string): { score: number; fb: ItemFeedback } {
  const on = RULE_IDS.filter((id) => choices[id]?.on)
  const missing = s.required.filter((id) => !on.includes(id))
  const extra = on.filter((id) => !s.required.includes(id))
  const label = `${s.name}: ${on.length} regra(s) ligada(s)`
  const cost = evaluationsCost(monthlyEvaluations(s, choices), region)
  if (missing.length) return { score: 0, fb: { id: `${s.id}:rules`, label, status: 'wrong', message: `Faltam regras que a política exige: ${missing.join(', ')}. Sem elas, os recursos fora do padrão passam despercebidos.` } }
  if (!extra.length) return { score: 1, fb: { id: `${s.id}:rules`, label, status: 'correct', message: `Todas as regras que a política pede estão ligadas, e só elas (cerca de ${usd(cost)}/mês em avaliações).` } }
  const score = extra.length === 1 ? 0.5 : 0
  return { score, fb: { id: `${s.id}:rules`, label, status: score ? 'partial' : 'wrong', message: `Cobre a política, mas liga ${extra.length} regra(s) que ela não pede (${extra.join(', ')}): cada uma gera avaliações cobradas e resultados que ninguém vai tratar.` } }
}

const MODE_LABEL = { none: 'sem remediação', manual: 'remediação manual', auto: 'remediação automática' } as const

export function judgeRemediation(s: ComplianceScenario, choices: Record<string, RuleChoice | undefined>): { score: number; fb: ItemFeedback } {
  const label = `${s.name}: remediações`
  const parts = s.required.map((id) => {
    const ch = choices[id]
    const want = s.expected[id]
    if (!ch?.on) return { id, score: 0, note: `${id}: regra desligada.` }
    const mode = ch.mode === 'auto' && !s.automation.includes(id) ? 'manual' : ch.mode
    if (mode === want) return { id, score: 1, note: '' }
    if (want === 'auto' && mode === 'manual') return { id, score: 0.5, note: `${id}: a correção manual funciona, mas a equipe tem um documento de automação testado e poderia corrigir sozinha.` }
    if (want === 'manual' && mode === 'auto') return { id, score: 0, note: `${id}: a correção automática é arriscada aqui; a política pede acompanhamento humano.` }
    return { id, score: 0.25, note: `${id}: ${MODE_LABEL[mode]}; o esperado era ${MODE_LABEL[want]}.` }
  })
  const score = parts.reduce((sum, p) => sum + p.score, 0) / Math.max(1, parts.length)
  const notes = parts.filter((p) => p.note).map((p) => p.note)
  return { score, fb: { id: `${s.id}:fix`, label, status: score >= 0.99 ? 'correct' : score >= 0.5 ? 'partial' : 'wrong', message: notes.length ? notes.join(' ') : 'Cada regra tem a remediação adequada.' } }
}

export function evaluateComplianceLab(c: ComplianceLabConfig, r: ComplianceLabResponse) {
  const items = c.scenarios.flatMap((s) => {
    const ch = r.choices?.[s.id] ?? {}
    return [
      { concepts: s.concepts, ...judgeRules(s, ch, c.region) },
      { concepts: s.concepts, ...judgeRemediation(s, ch) },
    ]
  })
  return { score: items.reduce((sum, x) => sum + x.score, 0) / Math.max(1, items.length), items }
}

export { runRules }
