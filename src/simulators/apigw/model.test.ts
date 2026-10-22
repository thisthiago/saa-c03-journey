import { describe, expect, it } from 'vitest'
import { apiSolution, evaluateApiLab, type ApiLabConfig } from './lab'
import { ACCOUNT_DEFAULT, effectiveLimit, throttle } from './model'

describe('balde de tokens do API Gateway', () => {
  it('o burst absorve um pico curto; a taxa decide o uso contínuo', () => {
    expect(throttle([300, 50, 50], { rate: 100, burst: 300 }).throttled).toBe(0)
    expect(throttle([300, 50, 50], { rate: 100, burst: 200 }).throttled).toBe(100)
    expect(throttle([150, 150, 150, 150], { rate: 100, burst: 200 }).throttled).toBeGreaterThan(0)
  })

  it('vale o menor limite entre usage plan, método e conta', () => {
    expect(effectiveLimit({ rate: 50, burst: 100 }, undefined, ACCOUNT_DEFAULT)).toEqual({ rate: 50, burst: 100 })
  })
})

describe('laboratório dos planos', () => {
  const config: ApiLabConfig = {
    rateOptions: [10, 50, 100, 500],
    burstOptions: [20, 100, 200, 1000],
    clients: [
      { id: 'parceiro', label: 'Parceiro', demand: [40, 45, 40, 50] },
      { id: 'app', label: 'App', demand: [180, 60, 60, 60] },
    ],
  }
  it('a solução calculada leva 100%', () => {
    expect(apiSolution(config).answers).toEqual({ parceiro: { rate: '50', burst: '100' }, app: { rate: '100', burst: '200' } })
    expect(evaluateApiLab(config, apiSolution(config)).score).toBe(1)
  })
})
