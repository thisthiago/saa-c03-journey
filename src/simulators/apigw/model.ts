/**
 * Simulador do throttling do Amazon API Gateway: um balde de tokens por
 * cliente, segundo a segundo.
 *
 * Conferido em 22/10/2026
 * (https://docs.aws.amazon.com/apigateway/latest/developerguide/api-gateway-request-throttling.html):
 * - O API Gateway limita as requisições com o algoritmo de balde de tokens:
 *   a taxa (rate) enche o balde e o burst é o tamanho dele.
 * - Requisições acima do limite recebem a resposta 429 Too Many Requests.
 * - Limite padrão da conta, por Região: 10.000 requisições por segundo, com
 *   burst de 5.000.
 * - Os limites são aplicados nesta ordem: por cliente no usage plan, por
 *   método no estágio, da conta na Região.
 *
 * Simplificação: o balde é reabastecido uma vez por segundo, e as
 * requisições de cada segundo chegam juntas.
 */

export interface Bucket {
  /** Requisições por segundo que reabastecem o balde. */
  rate: number
  /** Capacidade do balde. */
  burst: number
}

export interface ThrottleResult {
  served: number
  throttled: number
  /** Segundos em que pelo menos uma requisição recebeu 429. */
  throttledSeconds: number[]
}

/** Requisições servidas e recusadas (429) para a demanda de cada segundo. */
export function throttle(demand: number[], b: Bucket): ThrottleResult {
  let tokens = b.burst
  let served = 0
  let throttled = 0
  const throttledSeconds: number[] = []
  demand.forEach((d, s) => {
    const ok = Math.min(d, Math.floor(tokens))
    served += ok
    if (d > ok) {
      throttled += d - ok
      throttledSeconds.push(s)
    }
    tokens = Math.min(b.burst, tokens - ok + b.rate)
  })
  return { served, throttled, throttledSeconds }
}

export const ACCOUNT_DEFAULT: Bucket = { rate: 10_000, burst: 5_000 }

/** Limite efetivo: o menor entre o do usage plan, o do método e o da conta. */
export function effectiveLimit(...layers: (Bucket | undefined)[]): Bucket {
  const set = layers.filter((x): x is Bucket => Boolean(x))
  return { rate: Math.min(...set.map((x) => x.rate)), burst: Math.min(...set.map((x) => x.burst)) }
}
