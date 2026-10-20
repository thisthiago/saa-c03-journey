/** Laboratório de borda: configurar o cache do CloudFront para reduzir idas à origem sem servir dado velho. */
import type { ItemFeedback } from '../../engine/types'
import { formatAt, simulateEdge, type Behavior, type EdgeEvent, type EdgeSetup } from './model'

export type EdgeGoal =
  | { kind: 'origin-max'; max: number; concepts?: string[] }
  | { kind: 'never-cached'; prefix: string; concepts?: string[] }
  | { kind: 'max-stale'; path: string; seconds: number; concepts?: string[] }

export interface EdgeLabResponse {
  behaviors: Behavior[]
  invalidateOnUpdate: boolean
}

export interface EdgeLabConfig {
  setup: EdgeSetup
  events: EdgeEvent[]
  initial: EdgeLabResponse
  goals: EdgeGoal[]
  ttlOptions: number[]
  /** Mostra a opção de invalidar a cada atualização da origem. */
  allowInvalidation?: boolean
  solution: EdgeLabResponse
}

export function edgeGoalLabel(g: EdgeGoal): string {
  switch (g.kind) {
    case 'origin-max':
      return `No máximo ${g.max} requisições chegam à origem`
    case 'never-cached':
      return `Respostas de ${g.prefix}* nunca vêm do cache`
    case 'max-stale':
      return `${g.path} nunca fica desatualizado por mais de ${formatAt(g.seconds)}`
  }
}

export function runEdgeLab(c: EdgeLabConfig, r: EdgeLabResponse) {
  return simulateEdge(c.setup, r.behaviors, c.events, Boolean(c.allowInvalidation && r.invalidateOnUpdate))
}

export function evaluateEdgeLab(c: EdgeLabConfig, r: EdgeLabResponse) {
  const resp = r ?? c.initial
  const run = runEdgeLab(c, resp)
  const items = c.goals.map((g, i) => {
    let ok: boolean
    let message: string
    switch (g.kind) {
      case 'origin-max':
        ok = run.originRequests <= g.max
        message = `${run.originRequests} requisição(ões) chegaram à origem.`
        break
      case 'never-cached': {
        const cached = run.requests.filter((x) => x.path.startsWith(g.prefix) && x.servedBy !== 'origin')
        ok = cached.length === 0
        message = ok ? 'Toda resposta dinâmica veio da origem.' : `${cached.length} resposta(s) de ${g.prefix}* saíram do cache: dados de um usuário poderiam ir para outro.`
        break
      }
      case 'max-stale': {
        const worst = Math.max(0, ...run.requests.filter((x) => x.path === g.path).map((x) => x.staleForSec ?? 0))
        ok = worst <= g.seconds
        message = worst === 0 ? 'Nenhuma resposta desatualizada.' : `Pior caso: ${formatAt(worst)} servindo a versão antiga.`
        break
      }
    }
    return { concepts: g.concepts, score: ok ? 1 : 0, fb: { id: `goal-${i}`, label: edgeGoalLabel(g), status: ok ? 'correct' : 'wrong', message } as ItemFeedback }
  })
  return { score: items.reduce((s, x) => s + x.score, 0) / Math.max(1, items.length), items }
}
