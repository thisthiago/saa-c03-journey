/** Laboratório "Quem paga a conta?": para cada requisição, prever o status e quem paga. O modelo confere. */
import type { ItemFeedback } from '../../engine/types'
import { evaluateRP, PAYER_LABEL, type Payer, type RPBucket, type RPRequest } from './model'

export interface RPLabConfig {
  bucket: RPBucket
  requests: (RPRequest & { concepts?: string[] })[]
}

export interface RPAnswer {
  status?: 200 | 403
  requestPayer?: Payer
  transferPayer?: Payer
}

export interface RPLabResponse {
  answers: Record<string, RPAnswer>
}

export function rpLabSolution(c: RPLabConfig): RPLabResponse {
  return {
    answers: Object.fromEntries(
      c.requests.map((r) => {
        const res = evaluateRP(c.bucket, r)
        return [r.id, { status: res.status, requestPayer: res.requestPayer, transferPayer: res.transferPayer }]
      }),
    ),
  }
}

export function rpLabComplete(c: RPLabConfig, r: RPLabResponse): boolean {
  return c.requests.every((q) => {
    const a = r.answers?.[q.id]
    return a?.status !== undefined && a.requestPayer !== undefined && a.transferPayer !== undefined
  })
}

export function evaluateRPLab(c: RPLabConfig, r: RPLabResponse) {
  const items = c.requests.map((q) => {
    const truth = evaluateRP(c.bucket, q)
    const a = r.answers?.[q.id] ?? {}
    const parts = [a.status === truth.status, a.requestPayer === truth.requestPayer, a.transferPayer === truth.transferPayer]
    const score = parts.filter(Boolean).length / parts.length
    return {
      concepts: q.concepts,
      score,
      fb: {
        id: q.id,
        label: q.label,
        status: score === 1 ? 'correct' : score > 0 ? 'partial' : 'wrong',
        message: `${truth.status} · requisição: ${PAYER_LABEL[truth.requestPayer]} · transferência: ${PAYER_LABEL[truth.transferPayer]}. ${truth.reason}`,
      } as ItemFeedback,
    }
  })
  return { score: items.reduce((s, x) => s + x.score, 0) / Math.max(1, items.length), items }
}
