import { describe, expect, it } from 'vitest'
import { governancePrices } from '../governance-prices'
import { EMPTY_TRAIL, foundIn, locateEvent, trailMonthly, trailRecords, type AccountEvent, type TrailSetup } from './model'

const ME = '111111111111'
const event = (part: Partial<AccountEvent>): AccountEvent => ({ id: 'e', text: 'e', kind: 'management', write: true, region: 'sa-east-1', account: ME, ageDays: 10, ...part })
const trail = (part: Partial<TrailSetup> = {}): TrailSetup => ({ id: 't', homeRegion: 'sa-east-1', ...EMPTY_TRAIL, ...part })

describe('onde o evento fica registrado', () => {
  it('o histórico guarda só eventos de gerenciamento dos últimos 90 dias, sem trilha', () => {
    expect(foundIn(event({ ageDays: 30 }), [], ME)).toBe('history')
    expect(foundIn(event({ ageDays: 90 }), [], ME)).toBe('history')
    expect(foundIn(event({ ageDays: 91 }), [], ME)).toBe('none')
    expect(foundIn(event({ kind: 'data', ageDays: 2 }), [], ME)).toBe('none')
  })

  it('uma trilha guarda o evento por mais de 90 dias', () => {
    expect(foundIn(event({ ageDays: 200 }), [trail()], ME)).toBe('trail')
    expect(foundIn(event({ ageDays: 20 }), [trail()], ME)).toBe('both')
  })

  it('trilha de uma Região não vê as outras; a de várias Regiões vê', () => {
    const e = event({ region: 'eu-west-1' })
    expect(trailRecords(trail(), e, ME)).toBe(false)
    expect(trailRecords(trail({ multiRegion: true }), e, ME)).toBe(true)
  })

  it('eventos de dados só entram quando a trilha os pede', () => {
    const e = event({ kind: 'data', write: false, sensitive: true })
    expect(trailRecords(trail(), e, ME)).toBe(false)
    expect(trailRecords(trail({ data: 'sensitive' }), e, ME)).toBe(true)
    expect(trailRecords(trail({ data: 'sensitive' }), event({ kind: 'data', sensitive: false }), ME)).toBe(false)
    expect(trailRecords(trail({ data: 'all' }), event({ kind: 'data', sensitive: false }), ME)).toBe(true)
  })

  it('leituras e gravações de gerenciamento seguem a escolha da trilha', () => {
    const read = event({ write: false })
    expect(trailRecords(trail({ management: 'write' }), read, ME)).toBe(false)
    expect(trailRecords(trail({ management: 'all' }), read, ME)).toBe(true)
    expect(trailRecords(trail({ management: 'read' }), event({ write: true }), ME)).toBe(false)
  })

  it('contas de outros membros só entram numa trilha da organização, e o histórico é da própria conta', () => {
    const e = event({ account: '222222222222' })
    expect(locateEvent(e, [trail({ multiRegion: true })], ME)).toEqual({ history: false, trails: [] })
    expect(locateEvent(e, [trail({ organization: true, multiRegion: true })], ME).trails).toEqual(['t'])
  })
})

describe('custo da trilha', () => {
  const v = { sensitiveDataEvents: 5e6, otherDataEvents: 100e6, managementEvents: 2e6 }
  it('só cobra eventos de dados e Insights (a primeira cópia dos eventos de gerenciamento é grátis)', () => {
    const p = governancePrices().cloudtrail
    expect(trailMonthly(trail(), v).total).toBe(0)
    expect(trailMonthly(trail({ data: 'sensitive' }), v).dataEvents).toBeCloseTo((5e6 / 1e5) * p.dataEventPer100k, 6)
    expect(trailMonthly(trail({ data: 'all' }), v).dataEvents).toBeGreaterThan(trailMonthly(trail({ data: 'sensitive' }), v).dataEvents)
    expect(trailMonthly(trail({ insights: true }), v).insights).toBeCloseTo((2e6 / 1e5) * p.insightsEventPer100k, 6)
  })
})
