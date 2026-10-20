import { describe, expect, it } from 'vitest'
import { REGION_FACTS } from './catalog'
import { bestRegion, evaluateRegion, nearestRegion, rankRegions, type RegionScenario } from './model'

const price = (code: string) => ({ 'eu-south-2': 0.02, 'eu-west-3': 0.03, 'eu-west-1': 0.025, 'sa-east-1': 0.04, 'us-east-1': 0.02 })[code] ?? 0.05

const EU: RegionScenario = {
  id: 'eu',
  title: 'Europa',
  description: '',
  groups: [{ id: 'mad', label: 'Madri', share: 1 }],
  candidates: ['eu-south-2', 'eu-west-3', 'eu-west-1'],
  latencyMs: { 'eu-south-2': { mad: 8 }, 'eu-west-3': { mad: 25 }, 'eu-west-1': { mad: 35 } },
  requirements: { residency: { countries: ['Espanha', 'França', 'Irlanda'], reason: 'contrato' }, features: ['s3-express-one-zone'] },
  priority: 'latency',
  storageGB: 1000,
}

describe('escolha de Região', () => {
  it('o catálogo tem as 34 Regiões conferidas', () => {
    expect(REGION_FACTS).toHaveLength(34)
    expect(new Set(REGION_FACTS.map((r) => r.code)).size).toBe(34)
  })
  it('a Região mais próxima pode não ter o recurso necessário', () => {
    const e = evaluateRegion(EU, 'eu-south-2', price)
    expect(e.violations.map((v) => v.kind)).toEqual(['feature'])
    expect(e.notes[0]).toMatch(/opt-in/)
    expect(nearestRegion(EU, price).code).toBe('eu-south-2')
    expect(bestRegion(EU, price).code).toBe('eu-west-3')
  })
  it('residência contratual elimina Regiões de outros países', () => {
    const br: RegionScenario = { ...EU, id: 'br', groups: [{ id: 'sp', label: 'SP', share: 1 }], candidates: ['us-east-1', 'sa-east-1'], latencyMs: { 'us-east-1': { sp: 120 }, 'sa-east-1': { sp: 10 } }, requirements: { residency: { countries: ['Brasil'], reason: 'contrato' } }, priority: 'cost' }
    expect(evaluateRegion(br, 'us-east-1', price).violations[0].kind).toBe('residency')
    expect(bestRegion(br, price).code).toBe('sa-east-1')
  })
  it('sem requisitos rígidos e com prioridade de custo, vence a mais barata', () => {
    const batch: RegionScenario = { ...EU, id: 'b', requirements: {}, candidates: ['sa-east-1', 'us-east-1'], latencyMs: { 'sa-east-1': { mad: 200 }, 'us-east-1': { mad: 90 } }, priority: 'cost' }
    expect(rankRegions(batch, price).map((e) => e.code)).toEqual(['us-east-1', 'sa-east-1'])
    expect(evaluateRegion(batch, 'us-east-1', price).monthlyStorageUSD).toBeCloseTo(20, 6)
  })
  it('latência máxima é um requisito rígido', () => {
    const s: RegionScenario = { ...EU, requirements: { maxLatency: { group: 'mad', ms: 30 } } }
    expect(evaluateRegion(s, 'eu-west-1', price).violations[0].kind).toBe('latency')
  })
  it('empate torna o cenário ambíguo', () => {
    const s: RegionScenario = { ...EU, requirements: {}, latencyMs: { 'eu-south-2': { mad: 10 }, 'eu-west-3': { mad: 10 }, 'eu-west-1': { mad: 40 } } }
    const p = () => 0.02
    expect(() => bestRegion(s, p)).toThrow(/empate/)
  })
})
