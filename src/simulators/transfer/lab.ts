/** Laboratório "Data Migration Challenge": escolher o método de cada cenário de migração. */
import type { ItemFeedback } from '../../engine/types'
import { estimateTransfer, formatDays, METHOD_LABEL, type TransferMethod, type TransferScenario } from './model'

export interface TransferLabConfig {
  scenarios: TransferScenario[]
  methods: TransferMethod[]
}

export interface TransferLabResponse {
  choices: Record<string, TransferMethod | undefined>
}

export function transferLabSolution(c: TransferLabConfig): TransferLabResponse {
  return { choices: Object.fromEntries(c.scenarios.map((s) => [s.id, c.methods.find((m) => estimateTransfer(s, m).ok)])) }
}

export function evaluateTransferLab(c: TransferLabConfig, r: TransferLabResponse) {
  const items = c.scenarios.map((s) => {
    const m = r.choices?.[s.id]
    const est = m ? estimateTransfer(s, m) : null
    const valid = c.methods.filter((x) => estimateTransfer(s, x).ok).map((x) => METHOD_LABEL[x])
    const ok = Boolean(est?.ok)
    return {
      concepts: s.concepts,
      score: ok ? 1 : 0,
      fb: {
        id: s.id,
        label: `${s.name}: ${m ? METHOD_LABEL[m] : '—'}${est?.days != null ? ` (≈ ${formatDays(est.days)})` : ''}`,
        status: ok ? 'correct' : m ? 'wrong' : 'missed',
        message: ok ? est!.notes.join(' ') : `${est ? est.notes.join(' ') : 'Nenhum método escolhido.'} Atende: ${valid.join(' ou ') || 'nenhuma opção'}.`,
      } as ItemFeedback,
    }
  })
  return { score: items.reduce((s, x) => s + x.score, 0) / Math.max(1, items.length), items }
}
