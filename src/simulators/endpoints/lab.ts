/** Laboratório "Tirar o tráfego da internet": escolher o caminho de cada carga até o serviço da AWS, cumprindo as regras pelo menor custo. */
import type { ItemFeedback } from '../../engine/types'
import { usd } from '../compute-prices'
import { cheapestPath, PATH_LABEL, pathMonthly, pathProblems, SERVICE_LABEL, type EpWorkload, type PathKind } from './model'

export interface EndpointsLabConfig {
  region?: string
  workloads: EpWorkload[]
}

export interface EndpointsLabResponse {
  choices: Record<string, PathKind | undefined>
}

export const endpointsSolution = (c: EndpointsLabConfig): EndpointsLabResponse => ({ choices: Object.fromEntries(c.workloads.map((w) => [w.id, cheapestPath(w, c.region)])) })

export const endpointsComplete = (c: EndpointsLabConfig, r: EndpointsLabResponse) => c.workloads.every((w) => Boolean(r.choices?.[w.id]))

export function judgeEndpoint(c: EndpointsLabConfig, w: EpWorkload, pick: PathKind | undefined): { score: number; fb: ItemFeedback } {
  const best = cheapestPath(w, c.region)
  const bestCost = pathMonthly(w, best, c.region).total
  if (!pick) return { score: 0, fb: { id: w.id, label: `${w.name}: sem escolha`, status: 'missed', message: `O caminho adequado é ${PATH_LABEL[best]}, por ${usd(bestCost)}/mês.` } }
  const label = `${w.name} (${SERVICE_LABEL[w.service]}): ${PATH_LABEL[pick]}`
  const pb = pathProblems(w, pick)
  if (pb.length) return { score: 0, fb: { id: w.id, label, status: 'wrong', message: `Não serve: ${pb.join('; ')}.` } }
  const cost = pathMonthly(w, pick, c.region).total
  if (pick === best) return { score: 1, fb: { id: w.id, label, status: 'correct', message: `Cumpre as regras pelo menor custo: ${usd(cost)}/mês.` } }
  return { score: 0.5, fb: { id: w.id, label, status: 'partial', message: `Funciona, mas custa ${usd(cost)}/mês; ${PATH_LABEL[best]} faria o mesmo por ${usd(bestCost)}/mês.` } }
}

export function evaluateEndpointsLab(c: EndpointsLabConfig, r: EndpointsLabResponse) {
  const items = c.workloads.map((w) => ({ concepts: w.concepts, ...judgeEndpoint(c, w, r?.choices?.[w.id]) }))
  return { score: items.reduce((sum, x) => sum + x.score, 0) / Math.max(1, items.length), items }
}
