import { describe, expect, it } from 'vitest'
import { applyAccessConfig, initialAccessResponse, type AccessLabConfig } from './lab'
import { evaluateAccess, isPublicPolicy, wildcardMatch, type AccessWorld, type Identity } from './model'

const ACC = '111122223333'
const OTHER = '444455556666'
const B = 'arn:aws:s3:::docs-contabeis'

function id(idv: string, account: string | null, policies: Identity['policies'] = [], kind: Identity['kind'] = 'user'): Identity {
  return { id: idv, name: idv, description: '', kind, account, policies }
}

function world(partial: Partial<AccessWorld['bucket']> = {}, identities: Identity[] = [], extra: Partial<AccessWorld> = {}): AccessWorld {
  return {
    bucket: {
      name: 'docs-contabeis',
      account: ACC,
      policy: [],
      bpa: { blockPublicAcls: false, ignorePublicAcls: false, blockPublicPolicy: false, restrictPublicBuckets: false },
      objectOwnership: 'BucketOwnerEnforced',
      defaultEncryption: 'SSE-S3',
      ...partial,
    },
    objects: [
      { key: 'docs/a.pdf', encryption: 'SSE-S3' },
      { key: 'fin/b.pdf', encryption: 'SSE-KMS', kmsKeyId: 'k1' },
      { key: 'legado/c.pdf', encryption: 'SSE-S3', acl: 'public-read' },
    ],
    identities: [id('anon', null, [], 'anonymous'), ...identities],
    keys: [],
    ...extra,
  }
}

const get = (identityId: string, key: string, secure = true) => ({ identityId, action: 's3:GetObject' as const, key, secureTransport: secure, sourceIp: '203.0.113.10' })

describe('curingas', () => {
  it('casa ações e ARNs', () => {
    expect(wildcardMatch('s3:Get*', 's3:GetObject')).toBe(true)
    expect(wildcardMatch(`${B}/docs/*`, `${B}/docs/a.pdf`)).toBe(true)
    expect(wildcardMatch(`${B}/docs/*`, `${B}/fin/b.pdf`)).toBe(false)
  })
})

describe('avaliação de acesso', () => {
  const readDocs = { sid: 'ReadDocs', effect: 'Allow' as const, actions: ['s3:GetObject'], resources: [`${B}/docs/*`] }

  it('nega implicitamente sem nenhuma política', () => {
    const w = world({}, [id('ana', ACC)])
    expect(evaluateAccess(w, get('ana', 'docs/a.pdf'))).toMatchObject({ allowed: false, reason: 'implicit-deny' })
  })
  it('mesma conta: basta a política de identidade', () => {
    const w = world({}, [id('ana', ACC, [readDocs])])
    expect(evaluateAccess(w, get('ana', 'docs/a.pdf')).allowed).toBe(true)
    expect(evaluateAccess(w, get('ana', 'fin/b.pdf')).allowed).toBe(false)
  })
  it('mesma conta: basta a bucket policy', () => {
    const w = world({ policy: [{ ...readDocs, sid: 'BP', principals: [{ arn: `arn:aws:iam::${ACC}:user/ana` }] }] }, [id('ana', ACC)])
    expect(evaluateAccess(w, get('ana', 'docs/a.pdf')).allowed).toBe(true)
  })
  it('deny explícito vence allow', () => {
    const w = world({ policy: [{ sid: 'Deny', effect: 'Deny', principals: ['*'], actions: ['s3:*'], resources: [`${B}/docs/*`] }] }, [id('ana', ACC, [readDocs])])
    expect(evaluateAccess(w, get('ana', 'docs/a.pdf'))).toMatchObject({ allowed: false, reason: 'explicit-deny' })
  })
  it('outra conta: precisa da identidade E do recurso', () => {
    const bp = { ...readDocs, sid: 'BP', principals: [{ account: OTHER }] }
    expect(evaluateAccess(world({ policy: [bp] }, [id('aud', OTHER)]), get('aud', 'docs/a.pdf')).allowed).toBe(false)
    expect(evaluateAccess(world({}, [id('aud', OTHER, [readDocs])]), get('aud', 'docs/a.pdf')).allowed).toBe(false)
    expect(evaluateAccess(world({ policy: [bp] }, [id('aud', OTHER, [readDocs])]), get('aud', 'docs/a.pdf')).allowed).toBe(true)
  })
  it('política pública libera anônimos, e RestrictPublicBuckets bloqueia anônimos e outras contas', () => {
    const pub = { ...readDocs, sid: 'Public', principals: ['*' as const] }
    const cross = { ...readDocs, sid: 'Auditor', principals: [{ account: OTHER }] }
    const w = world({ policy: [pub, cross] }, [id('aud', OTHER, [readDocs]), id('ana', ACC)])
    expect(isPublicPolicy(w.bucket.policy)).toBe(true)
    expect(evaluateAccess(w, get('anon', 'docs/a.pdf')).allowed).toBe(true)
    w.bucket.bpa.restrictPublicBuckets = true
    expect(evaluateAccess(w, get('anon', 'docs/a.pdf')).allowed).toBe(false)
    // A declaração não pública para a outra conta também deixa de valer.
    expect(evaluateAccess(w, get('aud', 'docs/a.pdf')).allowed).toBe(false)
    // Na mesma conta, a concessão continua.
    expect(evaluateAccess(w, get('ana', 'docs/a.pdf')).allowed).toBe(true)
  })
  it('condição de IP estreita torna a política não pública', () => {
    expect(isPublicPolicy([{ sid: 'x', effect: 'Allow', principals: ['*'], actions: ['s3:GetObject'], resources: ['*'], conditions: [{ key: 'aws:SourceIp', cidr: '198.51.100.0/24' }] }])).toBe(false)
  })
  it('ACL pública vale só com ACLs ativas e sem IgnorePublicAcls', () => {
    const w = world({ objectOwnership: 'BucketOwnerPreferred' })
    expect(evaluateAccess(w, get('anon', 'legado/c.pdf')).allowed).toBe(true)
    w.bucket.bpa.ignorePublicAcls = true
    expect(evaluateAccess(w, get('anon', 'legado/c.pdf')).allowed).toBe(false)
    expect(evaluateAccess(world(), get('anon', 'legado/c.pdf')).allowed).toBe(false)
  })
  it('aws:SecureTransport nega requisições HTTP', () => {
    const w = world({ policy: [{ sid: 'TLS', effect: 'Deny', principals: ['*'], actions: ['s3:*'], resources: [B, `${B}/*`], conditions: [{ key: 'aws:SecureTransport', value: false }] }] }, [id('ana', ACC, [readDocs])])
    expect(evaluateAccess(w, get('ana', 'docs/a.pdf', true)).allowed).toBe(true)
    expect(evaluateAccess(w, get('ana', 'docs/a.pdf', false)).allowed).toBe(false)
  })
})

describe('KMS', () => {
  const readFin = { sid: 'ReadFin', effect: 'Allow' as const, actions: ['s3:GetObject'], resources: [`${B}/fin/*`] }
  const decrypt = { sid: 'Decrypt', effect: 'Allow' as const, actions: ['kms:Decrypt'], resources: ['*'] }
  const enableIam = { sid: 'EnableIAM', effect: 'Allow' as const, principals: [{ account: ACC }], actions: ['kms:*'], resources: ['*'] }
  const key = (policy = [enableIam]) => ({ id: 'k1', alias: 'alias/financeiro', managedBy: 'customer' as const, account: ACC, policy })

  it('acesso ao objeto sem kms:Decrypt é negado', () => {
    const w = world({}, [id('ana', ACC, [readFin])], { keys: [key()] })
    expect(evaluateAccess(w, get('ana', 'fin/b.pdf'))).toMatchObject({ allowed: false, reason: 'kms-denied' })
  })
  it('key policy delegando ao IAM + política IAM com kms:Decrypt', () => {
    const w = world({}, [id('ana', ACC, [readFin, decrypt])], { keys: [key()] })
    expect(evaluateAccess(w, get('ana', 'fin/b.pdf')).allowed).toBe(true)
  })
  it('chave gerenciada pela AWS não funciona entre contas', () => {
    const awsKey = { id: 'k1', alias: 'aws/s3', managedBy: 'aws' as const, account: ACC, policy: [] }
    const bp = { ...readFin, sid: 'BP', principals: [{ account: OTHER }] }
    const w = world({ policy: [bp] }, [id('aud', OTHER, [readFin, decrypt]), id('ana', ACC, [readFin])], { keys: [awsKey] })
    expect(evaluateAccess(w, get('aud', 'fin/b.pdf'))).toMatchObject({ allowed: false, reason: 'kms-denied' })
    expect(evaluateAccess(w, get('ana', 'fin/b.pdf')).allowed).toBe(true)
  })
})

describe('laboratório de acesso', () => {
  const pub = { sid: 'Public', effect: 'Allow' as const, principals: ['*' as const], actions: ['s3:GetObject'], resources: [`${B}/*`] }
  const cfg: AccessLabConfig = {
    world: world({ policy: [] }),
    bucketLibrary: [pub],
    editable: { bpa: true },
    identities: ['anon'],
    requests: [{ id: 'g', label: 'GET', action: 's3:GetObject', key: 'docs/a.pdf', secureTransport: true, sourceIp: '1.1.1.1' }],
    goals: [{ identityId: 'anon', requestId: 'g', expect: 'deny', why: '' }],
    solution: { bucketPolicy: [], identityPolicies: {}, keyPolicies: {}, bpa: { blockPublicAcls: true, ignorePublicAcls: true, blockPublicPolicy: true, restrictPublicBuckets: true }, objectOwnership: 'BucketOwnerEnforced' },
  }
  it('BlockPublicPolicy rejeita uma nova política pública', () => {
    const r = { ...initialAccessResponse(cfg), bucketPolicy: ['Public'], bpa: { ...cfg.world.bucket.bpa, blockPublicPolicy: true } }
    const applied = applyAccessConfig(cfg, r)
    expect(applied.rejected).toHaveLength(1)
    expect(applied.world.bucket.policy).toHaveLength(0)
  })
  it('BlockPublicPolicy não altera uma política pública já existente', () => {
    const withPublic: AccessLabConfig = { ...cfg, world: world({ policy: [pub] }) }
    const r = { ...initialAccessResponse(withPublic), bpa: { ...withPublic.world.bucket.bpa, blockPublicPolicy: true } }
    const applied = applyAccessConfig(withPublic, r)
    expect(applied.rejected).toHaveLength(0)
    expect(evaluateAccess(applied.world, { ...cfg.requests[0], identityId: 'anon' }).allowed).toBe(true)
  })
})
