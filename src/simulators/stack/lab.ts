/** Laboratório do CloudFormation: prever o que uma atualização faz com cada recurso da stack. */
import type { ItemFeedback } from '../../engine/types'
import { EFFECT_LABEL, planUpdate, type Effect, type StackResource } from './model'

export interface StackScenario {
  id: string
  name: string
  description: string
  /** Modelo atual da stack. */
  current: StackResource[]
  /** Modelo que será enviado na atualização. */
  next: StackResource[]
  concepts?: string[]
}

export interface StackLabConfig {
  scenarios: StackScenario[]
}

export interface StackLabResponse {
  choices: Record<string, Effect | undefined>
}

/** Efeitos que a interface oferece, na ordem de apresentação. */
export const EFFECT_ORDER: Effect[] = ['unchanged', 'created', 'none', 'some', 'replaced-delete', 'replaced-retain', 'replaced-snapshot', 'removed-delete', 'removed-retain', 'removed-snapshot']

export const choiceKey = (scenario: string, resource: string) => `${scenario}:${resource}`

export const stackLabInitial = (): StackLabResponse => ({ choices: {} })

export const stackLabSolution = (c: StackLabConfig): StackLabResponse => ({
  choices: Object.fromEntries(c.scenarios.flatMap((s) => planUpdate(s.current, s.next).map((p) => [choiceKey(s.id, p.id), p.effect]))),
})

export const stackLabComplete = (c: StackLabConfig, r: StackLabResponse): boolean => c.scenarios.every((s) => planUpdate(s.current, s.next).every((p) => Boolean(r.choices?.[choiceKey(s.id, p.id)])))

const family = (e: Effect) => (e.startsWith('replaced') ? 'replaced' : e.startsWith('removed') ? 'removed' : e)

export function evaluateStackLab(c: StackLabConfig, r: StackLabResponse) {
  const items = c.scenarios.flatMap((s) =>
    planUpdate(s.current, s.next).map((p) => {
      const pick = r.choices?.[choiceKey(s.id, p.id)]
      const label = `${s.name}: ${p.id}${pick ? ` (${EFFECT_LABEL[pick].toLowerCase()})` : ''}`
      let score = 0
      let status: ItemFeedback['status'] = pick ? 'wrong' : 'missed'
      let message = `O efeito real: ${EFFECT_LABEL[p.effect].toLowerCase()}. ${p.why}`
      if (pick === p.effect) {
        score = 1
        status = 'correct'
        message = p.why
      } else if (pick && family(pick) === family(p.effect) && family(p.effect) !== p.effect) {
        score = 0.5
        status = 'partial'
        message = `Você acertou que o recurso é ${family(p.effect) === 'replaced' ? 'substituído' : 'removido'}, mas errou o destino do recurso antigo. ${p.why}`
      }
      return { concepts: s.concepts, score, fb: { id: choiceKey(s.id, p.id), label, status, message } as ItemFeedback }
    }),
  )
  return { score: items.reduce((sum, x) => sum + x.score, 0) / Math.max(1, items.length), items }
}
