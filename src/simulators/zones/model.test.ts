import { describe, expect, it } from 'vitest'
import { checkGoal } from './lab'
import { findSpofs, simulateFailure, validateZones, type ZonesTopology } from './model'

const concentrated: ZonesTopology = {
  azs: ['a', 'b', 'c'],
  required: 4,
  instances: { 'web-1': 'a', 'web-2': 'a', 'web-3': 'a', 'web-4': 'a', 'web-5': undefined, 'web-6': undefined },
  albAzs: ['a', 'b'],
  nat: { mode: 'zonal-single', az: 'a' },
  needsInternet: true,
  db: { mode: 'single-az', primary: 'a' },
}

const spread: ZonesTopology = {
  ...concentrated,
  instances: { 'web-1': 'a', 'web-2': 'a', 'web-3': 'b', 'web-4': 'b', 'web-5': 'c', 'web-6': 'c' },
  albAzs: ['a', 'b', 'c'],
  nat: { mode: 'zonal-per-az' },
  db: { mode: 'multi-az', primary: 'a', standby: 'b' },
}

describe('resiliência entre AZs', () => {
  it('arquitetura concentrada: a AZ a é ponto único de falha', () => {
    expect(simulateFailure(concentrated, 'none').status).toBe('available')
    expect(simulateFailure(concentrated, 'a').status).toBe('down')
    expect(simulateFailure(concentrated, 'b').status).toBe('available')
    expect(findSpofs(concentrated)).toEqual(['a'])
  })
  it('ALB com uma só AZ é configuração inválida', () => {
    expect(validateZones({ ...spread, albAzs: ['a'] })[0]).toMatch(/duas AZs/)
  })
  it('instância numa AZ não habilitada no ALB não recebe tráfego', () => {
    const t: ZonesTopology = { ...spread, albAzs: ['a', 'b'] }
    const r = simulateFailure(t, 'none')
    expect(r.serving).toBe(4)
    expect(r.components.find((c) => c.id === 'web-5')?.state).toBe('idle')
  })
  it('NAT zonal único: a queda da sua AZ isola instâncias das outras AZs', () => {
    const t: ZonesTopology = { ...spread, nat: { mode: 'zonal-single', az: 'a' } }
    const r = simulateFailure(t, 'a')
    expect(r.serving).toBe(0)
    expect(r.status).toBe('down')
    expect(r.reasons.join(' ')).toMatch(/único NAT gateway/)
  })
  it('NAT regional e Multi-AZ: perder uma AZ degrada, mas não derruba', () => {
    const t: ZonesTopology = { ...spread, nat: { mode: 'regional' } }
    const r = simulateFailure(t, 'a')
    expect(r.status).toBe('available')
    expect(r.serving).toBe(4)
    expect(r.components.find((c) => c.id === 'db-standby')?.state).toBe('failover')
  })
  it('static stability: 6 necessárias em 3 AZs pedem 9 implantadas', () => {
    const six: ZonesTopology = { ...spread, required: 6 }
    expect(simulateFailure(six, 'a').status).toBe('degraded')
    const nine: ZonesTopology = { ...six, instances: Object.fromEntries(Array.from({ length: 9 }, (_, i) => [`web-${i + 1}`, ['a', 'b', 'c'][i % 3]])) }
    expect(checkGoal(nine, { kind: 'full-capacity' }).ok).toBe(true)
    expect(checkGoal(nine, { kind: 'max-instances', max: 9 }).ok).toBe(true)
  })
  it('falha da Região derruba tudo, mesmo com várias AZs', () => {
    const r = simulateFailure(spread, 'region')
    expect(r.status).toBe('down')
    expect(r.reasons[0]).toMatch(/outra Região/)
  })
})
