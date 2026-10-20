import { describe, expect, it } from 'vitest'
import { replicate, validateReplication, type ReplEvent, type ReplSetup } from './model'

const setup = (p: Partial<ReplSetup> = {}): ReplSetup => ({
  source: { name: 'src', region: 'us-east-1', account: 'A', versioning: 'Enabled' },
  destinations: [{ name: 'dst', region: 'us-west-2', account: 'B', versioning: 'Enabled' }],
  role: { s3: true, kmsDecrypt: true, kmsEncrypt: true },
  destPolicy: { dst: true },
  rules: [{ id: 'r', enabled: true, destination: 'dst', deleteMarkerReplication: false, rtc: false, replicateKms: false }],
  ...p,
})
const ev = (kind: ReplEvent['kind'], extra: Partial<ReplEvent> = {}): ReplEvent => ({ id: kind, label: kind, kind, key: 'docs/a.pdf', encryption: 'SSE-S3', ...extra })

describe('replicação', () => {
  it('exige versionamento na origem', () => {
    expect(validateReplication(setup({ source: { name: 'src', region: 'us-east-1', account: 'A', versioning: 'Suspended' } })).length).toBeGreaterThan(0)
  })
  it('destino sem versionamento: FAILED', () => {
    const s = setup({ destinations: [{ name: 'dst', region: 'us-west-2', account: 'B', versioning: 'Suspended' }] })
    expect(replicate(s, ev('put'), 'dst').status).toBe('FAILED')
  })
  it('PUT novo é replicado (CRR)', () => {
    expect(replicate(setup(), ev('put'), 'dst')).toMatchObject({ status: 'COMPLETED' })
  })
  it('entre contas sem bucket policy no destino: FAILED', () => {
    expect(replicate(setup({ destPolicy: {} }), ev('put'), 'dst').status).toBe('FAILED')
  })
  it('não replica objetos existentes, réplicas de réplicas, arquivados nem ações do lifecycle', () => {
    for (const k of ['existing', 'replica-of-replica', 'archived', 'lifecycle-expire', 'delete-version'] as const) expect(replicate(setup(), ev(k), 'dst').status).toBe('NOT_REPLICATED')
  })
  it('delete markers só com DeleteMarkerReplication', () => {
    expect(replicate(setup(), ev('delete-marker'), 'dst').status).toBe('NOT_REPLICATED')
    const s = setup()
    s.rules[0].deleteMarkerReplication = true
    expect(replicate(s, ev('delete-marker'), 'dst').status).toBe('COMPLETED')
  })
  it('SSE-KMS exige opt-in, chave na Região de destino e chave do cliente entre contas', () => {
    expect(replicate(setup(), ev('put', { encryption: 'SSE-KMS' }), 'dst').status).toBe('NOT_REPLICATED')
    const s = setup()
    s.rules[0].replicateKms = true
    s.rules[0].replicaKey = 'aws-managed'
    expect(replicate(s, ev('put', { encryption: 'SSE-KMS' }), 'dst').status).toBe('FAILED')
    s.rules[0].replicaKey = 'source-region-customer'
    expect(replicate(s, ev('put', { encryption: 'SSE-KMS' }), 'dst').status).toBe('FAILED')
    s.rules[0].replicaKey = 'dest-customer'
    expect(replicate(s, ev('put', { encryption: 'SSE-KMS' }), 'dst').status).toBe('COMPLETED')
    expect(replicate({ ...s, role: { s3: true, kmsDecrypt: true, kmsEncrypt: false } }, ev('put', { encryption: 'SSE-KMS' }), 'dst').status).toBe('FAILED')
  })
  it('SSE-C é replicado sem configuração extra', () => {
    expect(replicate(setup(), ev('put', { encryption: 'SSE-C' }), 'dst').status).toBe('COMPLETED')
  })
  it('regra com filtro por tag não replica tag adicionada depois do PUT', () => {
    const s = setup()
    s.rules[0].tag = { key: 'dr', value: 'sim' }
    expect(replicate(s, ev('tag-after-put'), 'dst').status).toBe('NOT_REPLICATED')
    expect(replicate(s, ev('put', { tags: { dr: 'sim' } }), 'dst').status).toBe('COMPLETED')
  })
  it('delete marker replication não é aceito em regra com filtro por tag', () => {
    const s = setup()
    s.rules[0].tag = { key: 'dr', value: 'sim' }
    s.rules[0].deleteMarkerReplication = true
    expect(validateReplication(s).length).toBeGreaterThan(0)
  })
})
