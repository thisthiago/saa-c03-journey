import { describe, expect, it } from 'vitest'
import { TEST_PRICES as P } from '../cost/test-prices'
import { datasetMonthlyCosts, emptyRule, simulateAll, simulateDataset, stateAt, validateRules, type Dataset, type LifecycleRule } from './model'

const profile = { id: 'x', name: 'x', description: '', objectCount: 1_048_576, avgObjectKB: 1024, putsPerMonth: 0, getsPerMonth: 0, retrievedGBPerMonth: 0, requirements: { instantAccess: false, azResilient: false } }
const logs: Dataset = { id: 'logs', name: 'Logs', kind: 'current', key: 'logs/app.log', profile }
const rule = (p: Partial<LifecycleRule>): LifecycleRule => ({ ...emptyRule('r1'), ...p })

describe('validação de lifecycle', () => {
  it('aceita a cascata do exemplo da documentação (30 → IA, 90 → Glacier, 365 expira)', () => {
    const r = rule({ filter: { prefix: 'logs/' }, transitions: [{ days: 30, storageClass: 'STANDARD_IA' }, { days: 90, storageClass: 'GLACIER' }], expirationDays: 365 })
    expect(validateRules([r]).filter((i) => i.severity === 'error')).toEqual([])
  })
  it('rejeita transição fora da cascata (Glacier Flexible → Standard-IA)', () => {
    const r = rule({ transitions: [{ days: 0, storageClass: 'GLACIER' }, { days: 200, storageClass: 'STANDARD_IA' }] })
    expect(validateRules([r]).some((i) => i.severity === 'error' && /não é suportada/.test(i.message))).toBe(true)
  })
  it('rejeita One Zone-IA → Glacier Instant Retrieval', () => {
    const r = rule({ transitions: [{ days: 30, storageClass: 'ONEZONE_IA' }, { days: 120, storageClass: 'GLACIER_IR' }] })
    expect(validateRules([r]).some((i) => i.severity === 'error')).toBe(true)
  })
  it('exige a duração mínima da classe intermediária na mesma regra (GIR 4 → Deep Archive só a partir de 94)', () => {
    const bad = rule({ transitions: [{ days: 4, storageClass: 'GLACIER_IR' }, { days: 20, storageClass: 'DEEP_ARCHIVE' }] })
    const ok = rule({ transitions: [{ days: 4, storageClass: 'GLACIER_IR' }, { days: 94, storageClass: 'DEEP_ARCHIVE' }] })
    expect(validateRules([bad]).some((i) => i.severity === 'error' && /94/.test(i.message))).toBe(true)
    expect(validateRules([ok]).filter((i) => i.severity === 'error')).toEqual([])
  })
  it('AbortIncompleteMultipartUpload e ExpiredObjectDeleteMarker não aceitam filtro por tag', () => {
    const r = rule({ filter: { tags: { a: 'b' } }, abortMultipartDays: 7 })
    expect(validateRules([r]).some((i) => /AbortIncompleteMultipartUpload/.test(i.message))).toBe(true)
  })
  it('configuração com erro é rejeitada inteira', () => {
    const good = rule({ id: 'ok', expirationDays: 30 })
    const bad = rule({ id: 'bad', transitions: [{ days: 0, storageClass: 'DEEP_ARCHIVE' }, { days: 200, storageClass: 'GLACIER' }] })
    const res = simulateAll([logs], [good, bad], 365)
    expect(res.accepted).toBe(false)
    expect(stateAt(res.sims[0], 100)).toBe('STANDARD')
  })
})

describe('simulação de lifecycle', () => {
  it('segue a cascata e expira', () => {
    const r = rule({ transitions: [{ days: 30, storageClass: 'STANDARD_IA' }, { days: 90, storageClass: 'GLACIER' }], expirationDays: 365 })
    const sim = simulateDataset(logs, [r], 400)
    expect([stateAt(sim, 10), stateAt(sim, 30), stateAt(sim, 100), stateAt(sim, 370)]).toEqual(['STANDARD', 'STANDARD_IA', 'GLACIER', 'gone'])
  })
  it('expiração vence transição no mesmo dia', () => {
    const r1 = rule({ id: 'a', expirationDays: 365 })
    const r2 = rule({ id: 'b', transitions: [{ days: 365, storageClass: 'STANDARD_IA' }] })
    expect(stateAt(simulateDataset(logs, [r1, r2], 400), 366)).toBe('gone')
  })
  it('no mesmo dia, Glacier Flexible vence Standard-IA', () => {
    const r1 = rule({ id: 'a', transitions: [{ days: 60, storageClass: 'STANDARD_IA' }] })
    const r2 = rule({ id: 'b', transitions: [{ days: 60, storageClass: 'GLACIER' }] })
    expect(stateAt(simulateDataset(logs, [r1, r2], 400), 61)).toBe('GLACIER')
  })
  it('a menor expiração entre regras sobrepostas vence', () => {
    const r1 = rule({ id: 'a', expirationDays: 365 })
    const r2 = rule({ id: 'b', filter: { prefix: 'logs/' }, expirationDays: 90 })
    expect(stateAt(simulateDataset(logs, [r1, r2], 400), 100)).toBe('gone')
  })
  it('objetos < 128 KB não transicionam sem filtro de tamanho', () => {
    const small: Dataset = { ...logs, profile: { ...profile, avgObjectKB: 16 } }
    const r = rule({ transitions: [{ days: 30, storageClass: 'GLACIER' }] })
    expect(stateAt(simulateDataset(small, [r], 100), 60)).toBe('STANDARD')
    const withFilter = rule({ filter: { sizeGreaterThanKB: 1 }, transitions: [{ days: 30, storageClass: 'GLACIER' }] })
    expect(stateAt(simulateDataset(small, [withFilter], 100), 60)).toBe('GLACIER')
  })
  it('filtro por tags exige todas as tags (AND)', () => {
    const tagged: Dataset = { ...logs, tags: { tipo: 'log' } }
    const r = rule({ filter: { tags: { tipo: 'log', fase: 'teste' } }, expirationDays: 10 })
    expect(stateAt(simulateDataset(tagged, [r], 100), 50)).toBe('STANDARD')
  })
  it('em bucket versionado, expirar a versão atual mantém os dados como não atuais até a NoncurrentVersionExpiration', () => {
    const v: Dataset = { ...logs, versioned: true }
    const r = rule({ expirationDays: 30, noncurrentExpirationDays: 60 })
    const sim = simulateDataset(v, [r], 200)
    expect(stateAt(sim, 50)).toBe('STANDARD')
    expect(sim.segments.find((s) => s.from === 30)?.noncurrent).toBe(true)
    expect(stateAt(sim, 95)).toBe('gone')
  })
  it('uploads multipart incompletos só somem com AbortIncompleteMultipartUpload', () => {
    const mpu: Dataset = { ...logs, kind: 'mpu' }
    expect(stateAt(simulateDataset(mpu, [rule({ expirationDays: 5 })], 100), 50)).toBe('STANDARD')
    expect(stateAt(simulateDataset(mpu, [rule({ abortMultipartDays: 7 })], 100), 50)).toBe('gone')
  })
  it('custo: 1024 GB em Standard por 30 dias e depois Glacier Flexible, com custo de transição', () => {
    const r = rule({ transitions: [{ days: 30, storageClass: 'GLACIER' }] })
    const sim = simulateDataset(logs, [r], 90)
    const costs = datasetMonthlyCosts(logs, sim, P, 2)
    expect(costs[0].total).toBeCloseTo(1024 * 0.02, 4)
    // mês 2: 1024 GB + 32 KB/objeto no preço Glacier, 8 KB/objeto no Standard, mais 1.048,576 mil transições
    const gb = 1024 + (1_048_576 * 32) / 1024 / 1024
    const std = (1_048_576 * 8) / 1024 / 1024
    expect(costs[1].total).toBeCloseTo(gb * 0.004 + std * 0.02 + 1048.576 * 0.03, 4)
  })
  it('custo: sair do Standard-IA antes de 30 dias cobra o restante', () => {
    const r = rule({ id: 'a', transitions: [{ days: 0, storageClass: 'STANDARD_IA' }] })
    const r2 = rule({ id: 'b', transitions: [{ days: 10, storageClass: 'GLACIER' }] })
    const sim = simulateDataset(logs, [r, r2], 60)
    expect(sim.events.some((e) => e.kind === 'early-delete')).toBe(true)
  })
})
