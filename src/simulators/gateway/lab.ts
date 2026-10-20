/** Laboratório "O arquiteto híbrido": escolher o gateway de cada sistema local. */
import type { ItemFeedback } from '../../engine/types'
import { checkGateway, GATEWAYS, type GatewayChoice, type Workload } from './model'

export interface GatewayLabConfig {
  workloads: Workload[]
  options: GatewayChoice[]
}

export interface GatewayLabResponse {
  choices: Record<string, GatewayChoice | undefined>
}

export function gatewayLabSolution(c: GatewayLabConfig): GatewayLabResponse {
  return { choices: Object.fromEntries(c.workloads.map((w) => [w.id, c.options.find((g) => checkGateway(w, g).ok)])) }
}

export function evaluateGatewayLab(c: GatewayLabConfig, r: GatewayLabResponse) {
  const items = c.workloads.map((w) => {
    const g = r.choices?.[w.id]
    const v = g ? checkGateway(w, g) : { ok: false, reasons: ['Nenhum gateway escolhido.'] }
    const valid = c.options.filter((x) => checkGateway(w, x).ok).map((x) => GATEWAYS[x].name)
    return {
      concepts: w.concepts,
      score: v.ok ? 1 : 0,
      fb: {
        id: w.id,
        label: `${w.name}: ${g ? GATEWAYS[g].name : '—'}`,
        status: v.ok ? 'correct' : g ? 'wrong' : 'missed',
        message: v.ok ? `Atende: ${GATEWAYS[g!].target}` : `${v.reasons.join(' ')} Opção adequada: ${valid.join(' ou ')}.`,
      } as ItemFeedback,
    }
  })
  return { score: items.reduce((s, x) => s + x.score, 0) / Math.max(1, items.length), items }
}
