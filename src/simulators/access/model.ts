/**
 * Avaliador simplificado de acesso ao Amazon S3: políticas de identidade (IAM),
 * bucket policy, Block Public Access, ACLs, Object Ownership e chaves KMS.
 *
 * Ordem de avaliação modelada:
 *  1. Deny explícito em qualquer política aplicável → negado.
 *  2. Concessões da bucket policy (ignoradas para acesso público/entre contas
 *     se a política é pública e RestrictPublicBuckets está ativo).
 *  3. ACLs públicas (ignoradas com ACLs desativadas ou IgnorePublicAcls).
 *  4. Mesma conta: identidade OU recurso precisam permitir.
 *     Outra conta: identidade E recurso precisam permitir. Anônimo: só recurso/ACL.
 *  5. Objetos SSE-KMS exigem também permissão na chave (key policy + IAM).
 *  6. Sem allow → negado implicitamente.
 *
 * Simplificações: não modela SCPs, RCPs, permission boundaries, session policies,
 * políticas de VPC endpoint, Access Points, grants do KMS nem a maioria das
 * chaves de condição. Ver https://docs.aws.amazon.com/IAM/latest/UserGuide/reference_policies_evaluation-logic.html
 */

import { ipInCidr, wildcardMatch } from '../policy/core'

export type S3Action = 's3:ListBucket' | 's3:GetObject' | 's3:PutObject' | 's3:DeleteObject'
export type KmsAction = 'kms:Decrypt' | 'kms:GenerateDataKey'

export type PrincipalSpec = '*' | { account: string } | { arn: string } | { service: string }

export type Condition =
  | { key: 'aws:SecureTransport'; value: boolean }
  | { key: 'aws:SourceIp'; cidr: string; negate?: boolean }
  | { key: 's3:x-amz-server-side-encryption'; value: 'AES256' | 'aws:kms'; negate?: boolean }
  | { key: 'aws:PrincipalOrgID'; value: string }

export interface Statement {
  sid: string
  effect: 'Allow' | 'Deny'
  /** Só em políticas de recurso (bucket policy, key policy). */
  principals?: PrincipalSpec[]
  actions: string[]
  resources: string[]
  conditions?: Condition[]
  /** Texto curto que explica a declaração na interface. */
  note?: string
}

export interface Identity {
  id: string
  name: string
  description: string
  kind: 'user' | 'role' | 'anonymous'
  /** Conta AWS (null para anônimo). */
  account: string | null
  orgId?: string
  policies: Statement[]
}

export interface BlockPublicAccess {
  blockPublicAcls: boolean
  ignorePublicAcls: boolean
  blockPublicPolicy: boolean
  restrictPublicBuckets: boolean
}

export interface KmsKey {
  id: string
  alias: string
  managedBy: 'aws' | 'customer'
  account: string
  /** Para chaves gerenciadas pelo cliente. */
  policy: Statement[]
}

export interface ObjectDef {
  key: string
  encryption: 'SSE-S3' | 'SSE-KMS'
  kmsKeyId?: string
  /** ACL legada do objeto. */
  acl?: 'private' | 'public-read'
}

export interface AccessWorld {
  bucket: {
    name: string
    account: string
    policy: Statement[]
    bpa: BlockPublicAccess
    objectOwnership: 'BucketOwnerEnforced' | 'BucketOwnerPreferred' | 'ObjectWriter'
    /** ACL do bucket (legado): leitura pública concede ListBucket a todos. */
    acl?: 'private' | 'public-read'
    defaultEncryption: 'SSE-S3' | 'SSE-KMS'
    defaultKmsKeyId?: string
  }
  objects: ObjectDef[]
  identities: Identity[]
  keys: KmsKey[]
}

export interface AccessRequest {
  identityId: string
  action: S3Action
  /** Key do objeto (ausente para ListBucket). */
  key?: string
  secureTransport: boolean
  sourceIp: string
  /** Cabeçalho de criptografia enviado no PutObject. */
  sseHeader?: 'AES256' | 'aws:kms'
}

export type DecisionReason = 'allowed' | 'explicit-deny' | 'implicit-deny' | 'kms-denied' | 'unknown-identity'

export interface AccessDecision {
  allowed: boolean
  reason: DecisionReason
  trace: string[]
}

// ---------------------------------------------------------------------------

const ANY_PUBLIC_CIDR_PREFIX = 8

export { wildcardMatch }

export function bucketArn(world: AccessWorld) {
  return `arn:aws:s3:::${world.bucket.name}`
}

export function resourceArn(world: AccessWorld, req: Pick<AccessRequest, 'action' | 'key'>) {
  return req.action === 's3:ListBucket' ? bucketArn(world) : `${bucketArn(world)}/${req.key ?? ''}`
}

export function identityArn(id: Identity): string {
  if (id.kind === 'anonymous' || !id.account) return '*'
  return id.kind === 'role' ? `arn:aws:iam::${id.account}:role/${id.name}` : `arn:aws:iam::${id.account}:user/${id.name}`
}

function principalMatches(p: PrincipalSpec, id: Identity): boolean {
  if (p === '*') return true
  if ('service' in p) return false
  if (id.kind === 'anonymous') return false
  if ('account' in p) return p.account === id.account
  return wildcardMatch(p.arn, identityArn(id))
}

function conditionHolds(c: Condition, id: Identity, req: AccessRequest): boolean {
  switch (c.key) {
    case 'aws:SecureTransport':
      return req.secureTransport === c.value
    case 'aws:SourceIp': {
      const inside = ipInCidr(req.sourceIp, c.cidr)
      return c.negate ? !inside : inside
    }
    case 's3:x-amz-server-side-encryption': {
      const eq = req.sseHeader === c.value
      return c.negate ? !eq : eq
    }
    case 'aws:PrincipalOrgID':
      return id.orgId === c.value
  }
}

function statementApplies(st: Statement, action: string, resource: string, id: Identity, req: AccessRequest, checkPrincipal: boolean): boolean {
  if (checkPrincipal && !(st.principals ?? []).some((p) => principalMatches(p, id))) return false
  if (!st.actions.some((a) => wildcardMatch(a, action))) return false
  if (!st.resources.some((r) => wildcardMatch(r, resource))) return false
  return (st.conditions ?? []).every((c) => conditionHolds(c, id, req))
}

/**
 * Política pública, conforme "The meaning of public": concede acesso a Principal "*"
 * sem fixar condições como aws:SourceIp (faixa estreita) ou aws:PrincipalOrgID.
 */
export function isPublicStatement(st: Statement): boolean {
  if (st.effect !== 'Allow') return false
  if (!(st.principals ?? []).some((p) => p === '*')) return false
  const limiting = (st.conditions ?? []).some(
    (c) => c.key === 'aws:PrincipalOrgID' || (c.key === 'aws:SourceIp' && !c.negate && Number(c.cidr.split('/')[1] ?? 32) > ANY_PUBLIC_CIDR_PREFIX),
  )
  return !limiting
}

export function isPublicPolicy(policy: Statement[]): boolean {
  return policy.some(isPublicStatement)
}

function aclsActive(world: AccessWorld): boolean {
  return world.bucket.objectOwnership !== 'BucketOwnerEnforced'
}

export function evaluateAccess(world: AccessWorld, req: AccessRequest): AccessDecision {
  const id = world.identities.find((i) => i.id === req.identityId)
  if (!id) return { allowed: false, reason: 'unknown-identity', trace: ['Identidade desconhecida.'] }
  const trace: string[] = []
  const resource = resourceArn(world, req)
  const sameAccount = id.account === world.bucket.account
  const label = id.kind === 'anonymous' ? 'Requisição anônima (sem credenciais)' : `${id.name} (conta ${id.account}${sameAccount ? ', a mesma do bucket' : ', outra conta'})`
  trace.push(`${label} pede ${req.action} em ${resource}${req.secureTransport ? ' via HTTPS' : ' via HTTP'}.`)

  // 1. Deny explícito
  const identityStatements = id.kind === 'anonymous' ? [] : id.policies
  for (const st of identityStatements) {
    if (st.effect === 'Deny' && statementApplies(st, req.action, resource, id, req, false)) {
      trace.push(`Deny explícito na política de identidade (${st.sid}).`)
      return { allowed: false, reason: 'explicit-deny', trace }
    }
  }
  for (const st of world.bucket.policy) {
    if (st.effect === 'Deny' && statementApplies(st, req.action, resource, id, req, true)) {
      trace.push(`Deny explícito na bucket policy (${st.sid}). Deny sempre vence allow.`)
      return { allowed: false, reason: 'explicit-deny', trace }
    }
  }

  // 2. Allows
  const identityAllow = identityStatements.find((st) => st.effect === 'Allow' && statementApplies(st, req.action, resource, id, req, false))
  if (id.kind !== 'anonymous') trace.push(identityAllow ? `A política de identidade permite (${identityAllow.sid}).` : 'Nenhuma política de identidade permite esta ação.')

  let bucketAllow = world.bucket.policy.find((st) => st.effect === 'Allow' && statementApplies(st, req.action, resource, id, req, true))
  if (bucketAllow) {
    trace.push(`A bucket policy permite (${bucketAllow.sid}).`)
    if (!sameAccount && world.bucket.bpa.restrictPublicBuckets && isPublicPolicy(world.bucket.policy)) {
      trace.push('Block Public Access (RestrictPublicBuckets): a bucket policy é pública, então concessões a anônimos e a outras contas são ignoradas.')
      bucketAllow = undefined
    }
  } else trace.push('A bucket policy não concede esta ação a esta identidade.')

  let aclAllow = false
  if (req.action === 's3:GetObject' || req.action === 's3:ListBucket') {
    const obj = req.key ? world.objects.find((o) => o.key === req.key) : undefined
    const publicAcl = req.action === 's3:ListBucket' ? world.bucket.acl === 'public-read' : obj?.acl === 'public-read'
    if (publicAcl) {
      if (!aclsActive(world)) trace.push('Há uma ACL pública, mas as ACLs estão desativadas (Object Ownership = Bucket owner enforced).')
      else if (world.bucket.bpa.ignorePublicAcls) trace.push('Há uma ACL pública, mas o Block Public Access (IgnorePublicAcls) faz o S3 ignorá-la.')
      else {
        aclAllow = true
        trace.push('Uma ACL legada concede leitura pública (AllUsers).')
      }
    }
  }

  const resourceSide = Boolean(bucketAllow) || aclAllow
  let allowed: boolean
  if (id.kind === 'anonymous') {
    allowed = resourceSide
    if (!allowed) trace.push('Sem concessão pública: requisições anônimas são negadas.')
  } else if (sameAccount) {
    allowed = Boolean(identityAllow) || resourceSide
    if (!allowed) trace.push('Na mesma conta, basta a identidade ou o recurso permitir — e nenhum dos dois permite.')
  } else {
    allowed = Boolean(identityAllow) && resourceSide
    if (!allowed) trace.push(identityAllow ? 'Entre contas, o recurso (bucket) também precisa permitir.' : 'Entre contas, a política de identidade na conta de origem também precisa permitir.')
  }
  if (!allowed) return { allowed: false, reason: 'implicit-deny', trace: [...trace, 'Resultado: negado implicitamente (nenhum allow suficiente).'] }

  // 3. KMS
  const kms = kmsCheck(world, id, req, trace)
  if (!kms) return { allowed: false, reason: 'kms-denied', trace: [...trace, 'Resultado: AccessDenied — a permissão no S3 existe, mas falta permissão na chave KMS.'] }
  trace.push('Resultado: permitido.')
  return { allowed: true, reason: 'allowed', trace }
}

function encryptionFor(world: AccessWorld, req: AccessRequest): { type: 'SSE-S3' | 'SSE-KMS'; keyId?: string } | null {
  if (req.action === 's3:GetObject') {
    const obj = world.objects.find((o) => o.key === req.key)
    return obj ? { type: obj.encryption, keyId: obj.kmsKeyId } : null
  }
  if (req.action === 's3:PutObject') {
    const type = req.sseHeader === 'aws:kms' ? 'SSE-KMS' : req.sseHeader === 'AES256' ? 'SSE-S3' : world.bucket.defaultEncryption
    return { type, keyId: type === 'SSE-KMS' ? world.bucket.defaultKmsKeyId : undefined }
  }
  return null
}

function kmsCheck(world: AccessWorld, id: Identity, req: AccessRequest, trace: string[]): boolean {
  const enc = encryptionFor(world, req)
  if (!enc || enc.type !== 'SSE-KMS') return true
  const key = world.keys.find((k) => k.id === enc.keyId)
  const kmsAction: KmsAction = req.action === 's3:GetObject' ? 'kms:Decrypt' : 'kms:GenerateDataKey'
  if (!key) {
    trace.push('O objeto usa uma chave KMS inexistente.')
    return false
  }
  trace.push(`O objeto usa SSE-KMS com a chave ${key.alias}: é preciso também ${kmsAction}.`)
  const keyArn = `arn:aws:kms:us-east-1:${key.account}:key/${key.id}`
  const sameAsKey = id.account === key.account
  if (key.managedBy === 'aws') {
    if (sameAsKey) {
      trace.push('Chave gerenciada pela AWS (aws/s3): ela permite o uso, via S3, por identidades da própria conta.')
      return true
    }
    trace.push('Chave gerenciada pela AWS (aws/s3): a key policy não pode ser alterada e não permite uso por outras contas.')
    return false
  }
  for (const st of key.policy) {
    if (st.effect === 'Deny' && statementApplies(st, kmsAction, keyArn, id, req, true)) {
      trace.push(`Deny explícito na key policy (${st.sid}).`)
      return false
    }
  }
  const direct = key.policy.find((st) => st.effect === 'Allow' && statementApplies(st, kmsAction, keyArn, id, req, true) && !st.principals?.some((p) => typeof p === 'object' && 'account' in p))
  const delegated = key.policy.find((st) => st.effect === 'Allow' && statementApplies(st, kmsAction, keyArn, id, req, true) && st.principals?.some((p) => typeof p === 'object' && 'account' in p))
  const iamAllow = id.policies.find((st) => st.effect === 'Allow' && statementApplies(st, kmsAction, keyArn, id, req, false))
  if (sameAsKey) {
    if (direct) {
      trace.push(`A key policy concede ${kmsAction} diretamente (${direct.sid}).`)
      return true
    }
    if (delegated && iamAllow) {
      trace.push(`A key policy delega à conta (${delegated.sid}) e a política IAM concede ${kmsAction} (${iamAllow.sid}).`)
      return true
    }
    trace.push(delegated ? `A key policy delega ao IAM, mas nenhuma política IAM concede ${kmsAction}.` : `A key policy não concede ${kmsAction} a esta identidade.`)
    return false
  }
  // Outra conta: key policy precisa permitir a conta/identidade E a política IAM de origem precisa permitir.
  if ((direct || delegated) && iamAllow) {
    trace.push(`A key policy permite a outra conta (${(direct ?? delegated)!.sid}) e a política IAM de origem concede ${kmsAction}.`)
    return true
  }
  trace.push(direct || delegated ? `Entre contas, a política IAM de origem também precisa conceder ${kmsAction}.` : `A key policy não permite esta conta.`)
  return false
}
