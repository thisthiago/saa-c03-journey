/**
 * AWS Lambda: concorrência de várias funções que dividem o limite da conta,
 * reservada e provisionada, throttling, cold starts e custo mensal.
 *
 * Conferido em 20/10/2026:
 * - Concorrência = requisições por segundo × duração média; 1.000 por Região
 *   por padrão; até 900 podem ser reservadas (100 ficam sempre sem reserva);
 *   limite de requisições por segundo de 10 vezes a concorrência; reservada é
 *   mínimo e máximo, gratuita; provisionada é pré-inicializada, cobrada e não
 *   passa da reservada: https://docs.aws.amazon.com/lambda/latest/dg/lambda-concurrency.html
 * - Limites (memória de 128 a 10.240 MB, 1.769 MB = 1 vCPU, timeout de 900 s):
 *   https://docs.aws.amazon.com/lambda/latest/dg/gettingstarted-limits.html
 * - Assíncrono: 2 novas tentativas em erros da função; throttling e erros do
 *   sistema voltam para a fila por até 6 horas:
 *   https://docs.aws.amazon.com/lambda/latest/dg/invocation-async-error-handling.html
 *
 * Simplificações: a carga é o pico constante de cada função; sem reserva, as
 * funções dividem a concorrência livre em proporção à necessidade; o custo usa
 * o preço de duração comum para todas as invocações (mesmo as que caem na
 * provisionada) e soma o preço da concorrência provisionada o mês inteiro.
 */
import { computePrices, HOURS_PER_MONTH, type Arch } from '../compute-prices'

export const ACCOUNT_LIMIT = 1000
export const MIN_UNRESERVED = 100
export const MAX_DURATION_MS = 900_000

export interface FunctionSpec {
  id: string
  name: string
  /** Requisições por segundo no pico. */
  rps: number
  durationMs: number
  memoryMB: number
  invocation: 'sync' | 'async'
  arch?: Arch
  /** Invocações por mês, para o custo. */
  monthlyRequests: number
}

export interface ConcurrencySettings {
  reserved?: number
  provisioned?: number
}

/** Concorrência que a função precisa no pico (fórmula da documentação). */
export const concurrencyNeeded = (f: FunctionSpec) => Math.ceil((f.rps * f.durationMs) / 1000)

export interface FunctionResult {
  id: string
  needed: number
  /** Teto de concorrência da função: a reservada ou o que sobra para ela no conjunto sem reserva. */
  available: number
  throttled: boolean
  /** Fração das requisições do pico que sofre throttling. */
  throttledPct: number
  /** Parte do pico que precisa de ambientes novos (cold start) porque passa da provisionada. */
  coldStart: boolean
  notes: string[]
}

export function validateSettings(functions: FunctionSpec[], settings: Record<string, ConcurrencySettings | undefined>, accountLimit = ACCOUNT_LIMIT): string[] {
  const out: string[] = []
  const reservedSum = functions.reduce((s, f) => s + (settings[f.id]?.reserved ?? 0), 0)
  if (reservedSum > accountLimit - MIN_UNRESERVED) out.push(`no máximo ${accountLimit - MIN_UNRESERVED} podem ser reservados: ${MIN_UNRESERVED} ficam sempre para as funções sem reserva`)
  for (const f of functions) {
    const s = settings[f.id]
    if (s?.provisioned !== undefined && s.reserved !== undefined && s.provisioned > s.reserved) out.push(`${f.name}: a provisionada não pode passar da reservada`)
    if (f.memoryMB < 128 || f.memoryMB > 10240) out.push(`${f.name}: a memória vai de 128 a 10.240 MB`)
    if (f.durationMs > MAX_DURATION_MS) out.push(`${f.name}: o timeout máximo é de 900 segundos (15 minutos)`)
  }
  return out
}

export function simulateAccount(functions: FunctionSpec[], settings: Record<string, ConcurrencySettings | undefined>, accountLimit = ACCOUNT_LIMIT): FunctionResult[] {
  const reservedSum = functions.reduce((s, f) => s + (settings[f.id]?.reserved ?? 0), 0)
  const unreservedPool = Math.max(0, accountLimit - reservedSum)
  const shared = functions.filter((f) => settings[f.id]?.reserved === undefined)
  const sharedNeed = shared.reduce((s, f) => s + concurrencyNeeded(f), 0)
  return functions.map((f) => {
    const s = settings[f.id] ?? {}
    const needed = concurrencyNeeded(f)
    const available = s.reserved !== undefined ? s.reserved : sharedNeed <= unreservedPool ? needed : Math.floor((needed * unreservedPool) / sharedNeed)
    // O limite de requisições por segundo é 10 vezes a concorrência disponível.
    const rpsCap = 10 * available
    const byConcurrency = needed > 0 ? Math.min(1, available / needed) : 1
    const byRps = f.rps > 0 ? Math.min(1, rpsCap / f.rps) : 1
    const served = Math.min(byConcurrency, byRps)
    const notes: string[] = []
    if (served < 1) {
      notes.push(
        f.invocation === 'sync'
          ? 'No pico, parte das chamadas síncronas recebe erro de throttling (429) e quem chamou precisa tentar de novo.'
          : 'No pico, parte dos eventos assíncronos sofre throttling: o Lambda os devolve à fila e tenta de novo por até 6 horas.',
      )
    }
    if (byRps < byConcurrency) notes.push(`O limite de ${rpsCap.toLocaleString('pt-BR')} requisições por segundo (10 vezes a concorrência) segura a função antes da concorrência.`)
    return { id: f.id, needed, available, throttled: served < 1, throttledPct: 1 - served, coldStart: needed > (s.provisioned ?? 0), notes }
  })
}

/** Custo mensal: requisições, GB-segundo de duração e concorrência provisionada (cobrada o mês inteiro). */
export function lambdaMonthly(f: FunctionSpec, s: ConcurrencySettings = {}, region?: string): { requests: number; duration: number; provisioned: number; total: number } {
  const p = computePrices(region).lambda
  const gb = f.memoryMB / 1024
  const requests = (f.monthlyRequests / 1e6) * p.requestPerMillion
  const duration = f.monthlyRequests * (f.durationMs / 1000) * gb * p.gbSecond[f.arch ?? 'x86_64']
  const provisioned = (s.provisioned ?? 0) * gb * HOURS_PER_MONTH * 3600 * p.provisioned.concurrencyGBSecond
  return { requests, duration, provisioned, total: requests + duration + provisioned }
}
