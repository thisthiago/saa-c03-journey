import { describe, expect, it } from 'vitest'
import { computePrices } from '../compute-prices'
import { concurrencyNeeded, lambdaMonthly, simulateAccount, validateSettings, type FunctionSpec } from './model'

const fn = (id: string, rps: number, durationMs: number, extra: Partial<FunctionSpec> = {}): FunctionSpec => ({ id, name: id, rps, durationMs, memoryMB: 512, invocation: 'sync', monthlyRequests: 1_000_000, ...extra })

describe('concorrência', () => {
  it('reproduz os exemplos da documentação', () => {
    expect(concurrencyNeeded(fn('a', 100, 1000))).toBe(100)
    expect(concurrencyNeeded(fn('b', 100, 500))).toBe(50)
    expect(concurrencyNeeded(fn('c', 5000, 200))).toBe(1000)
  })
  it('limite de requisições por segundo: 20.000 rps de 50 ms precisam de 1.000 de concorrência, mas só passam 10.000 rps', () => {
    const [r] = simulateAccount([fn('rapida', 20000, 50)], {})
    expect(r.needed).toBe(1000)
    expect(r.throttled).toBe(true)
    expect(r.throttledPct).toBeCloseTo(0.5, 6)
  })
  it('reservada é teto e garantia; as outras funções dividem o que sobra', () => {
    const fns = [fn('critica', 400, 1000), fn('outras', 700, 1000)]
    const r = simulateAccount(fns, { critica: { reserved: 400 } })
    expect(r[0].throttled).toBe(false)
    expect(r[1].available).toBe(600)
    expect(r[1].throttled).toBe(true)
  })
  it('sem a provisionada, picos têm cold start', () => {
    const [a] = simulateAccount([fn('checkout', 50, 400)], { checkout: { provisioned: 10 } })
    expect(a.coldStart).toBe(true)
    const [b] = simulateAccount([fn('checkout', 50, 400)], { checkout: { provisioned: 20 } })
    expect(b.coldStart).toBe(false)
  })
  it('recusa reservar mais de 900 e provisionada acima da reservada', () => {
    expect(validateSettings([fn('a', 1, 1), fn('b', 1, 1)], { a: { reserved: 500 }, b: { reserved: 450 } })[0]).toContain('900')
    expect(validateSettings([fn('a', 1, 1)], { a: { reserved: 10, provisioned: 20 } })[0]).toContain('provisionada')
  })
})

describe('custo', () => {
  it('requisições e GB-segundo pela tabela de preços', () => {
    const p = computePrices().lambda
    const c = lambdaMonthly(fn('a', 1, 200, { memoryMB: 1024, monthlyRequests: 10_000_000 }))
    expect(c.requests).toBeCloseTo(10 * p.requestPerMillion, 6)
    expect(c.duration).toBeCloseTo(10_000_000 * 0.2 * 1 * p.gbSecond.x86_64, 6)
    expect(c.provisioned).toBe(0)
  })
})
