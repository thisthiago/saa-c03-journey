/** Laboratório de concorrência do Lambda: reservada e provisionada para cumprir os objetivos de cada função. */
import type { ItemFeedback } from '../../engine/types'
import { usd } from '../compute-prices'
import { lambdaMonthly, simulateAccount, validateSettings, type ConcurrencySettings, type FunctionSpec } from './model'

export type LambdaGoal =
  | { kind: 'no-throttle'; fn: string; concepts?: string[] }
  | { kind: 'cap'; fn: string; max: number; why: string; concepts?: string[] }
  | { kind: 'no-cold-start'; fn: string; concepts?: string[] }
  | { kind: 'budget'; max: number; concepts?: string[] }

export interface LambdaLabConfig {
  functions: FunctionSpec[]
  goals: LambdaGoal[]
  initial: Record<string, ConcurrencySettings>
  solution: Record<string, ConcurrencySettings>
}

export interface LambdaLabResponse {
  settings: Record<string, ConcurrencySettings | undefined>
}

const fnName = (c: LambdaLabConfig, id: string) => c.functions.find((f) => f.id === id)?.name ?? id

export function goalLabel(c: LambdaLabConfig, g: LambdaGoal): string {
  switch (g.kind) {
    case 'no-throttle':
      return `${fnName(c, g.fn)} sem throttling no pico`
    case 'cap':
      return `${fnName(c, g.fn)} com no máximo ${g.max} execuções simultâneas`
    case 'no-cold-start':
      return `${fnName(c, g.fn)} sem cold start no pico`
    case 'budget':
      return `Concorrência provisionada custando até ${usd(g.max)}/mês`
  }
}

export function checkLambdaGoal(c: LambdaLabConfig, r: LambdaLabResponse, g: LambdaGoal): { ok: boolean; message: string } {
  const res = simulateAccount(c.functions, r.settings ?? {})
  const of = (id: string) => res.find((x) => x.id === id)!
  switch (g.kind) {
    case 'no-throttle': {
      const x = of(g.fn)
      return x.throttled ? { ok: false, message: `Precisa de ${x.needed} e tem ${x.available}: ${Math.round(x.throttledPct * 100)}% do pico sofre throttling. ${x.notes.join(' ')}` } : { ok: true, message: `Tem ${x.available} para os ${x.needed} que precisa.` }
    }
    case 'cap': {
      const reserved = r.settings?.[g.fn]?.reserved
      return reserved !== undefined && reserved <= g.max ? { ok: true, message: `A reservada de ${reserved} é também o teto: ${g.why}` } : { ok: false, message: `Sem uma reservada de até ${g.max}, nada impede a função de passar disso. ${g.why}` }
    }
    case 'no-cold-start': {
      const x = of(g.fn)
      const prov = r.settings?.[g.fn]?.provisioned ?? 0
      return x.coldStart ? { ok: false, message: `O pico precisa de ${x.needed} ambientes e só ${prov} estão pré-inicializados.` } : { ok: true, message: `${prov} ambientes pré-inicializados cobrem o pico de ${x.needed}.` }
    }
    case 'budget': {
      const total = c.functions.reduce((s, f) => s + lambdaMonthly(f, r.settings?.[f.id] ?? {}).provisioned, 0)
      return total <= g.max ? { ok: true, message: `Provisionada: ${usd(total)}/mês.` } : { ok: false, message: `Provisionada: ${usd(total)}/mês, acima do orçamento. Provisione só o que precisa ficar sem cold start.` }
    }
  }
}

export function evaluateLambdaLab(c: LambdaLabConfig, r: LambdaLabResponse) {
  const errors = validateSettings(c.functions, r.settings ?? {})
  if (errors.length) return { score: 0, items: [{ score: 0, fb: { id: 'invalid', label: 'Configuração recusada', status: 'wrong', message: `A AWS recusaria esta configuração: ${errors.join('; ')}.` } as ItemFeedback }] }
  const items = c.goals.map((g, i) => {
    const v = checkLambdaGoal(c, r, g)
    return { concepts: g.concepts, score: v.ok ? 1 : 0, fb: { id: `g${i}`, label: goalLabel(c, g), status: v.ok ? 'correct' : 'wrong', message: v.message } as ItemFeedback }
  })
  return { score: items.reduce((s, x) => s + x.score, 0) / Math.max(1, items.length), items }
}
