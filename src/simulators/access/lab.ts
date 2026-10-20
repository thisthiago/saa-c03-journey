/**
 * Laboratório de acesso: o usuário compõe políticas a partir de uma biblioteca
 * de declarações, ajusta Block Public Access e Object Ownership, e observa a
 * matriz "identidade × requisição" recalculada pelo avaliador.
 */
import type { ItemFeedback } from '../../engine/types'
import { evaluateAccess, isPublicPolicy, type AccessRequest, type AccessWorld, type BlockPublicAccess, type Statement } from './model'

export interface RequestDef extends Omit<AccessRequest, 'identityId'> {
  id: string
  label: string
}

export interface AccessGoal {
  identityId: string
  requestId: string
  expect: 'allow' | 'deny'
  why: string
  concepts?: string[]
}

export interface AccessLabConfig {
  world: AccessWorld
  /** Declarações disponíveis para compor a bucket policy (inclui as já aplicadas). */
  bucketLibrary?: Statement[]
  /** Declarações disponíveis por identidade (políticas IAM). */
  identityLibrary?: Record<string, Statement[]>
  /** Declarações disponíveis para a key policy, por chave. */
  keyLibrary?: Record<string, Statement[]>
  editable: { bpa?: boolean; ownership?: boolean }
  identities: string[]
  requests: RequestDef[]
  goals: AccessGoal[]
  /** Penaliza "Allow s3:* em *" em qualquer política montada. */
  leastPrivilege?: boolean
  /** Solução de referência (validada pelos testes de integridade). */
  solution: AccessLabResponse
}

export interface AccessLabResponse {
  bucketPolicy: string[]
  identityPolicies: Record<string, string[]>
  keyPolicies: Record<string, string[]>
  bpa: BlockPublicAccess
  objectOwnership: AccessWorld['bucket']['objectOwnership']
}

export function initialAccessResponse(c: AccessLabConfig): AccessLabResponse {
  return {
    bucketPolicy: c.world.bucket.policy.map((s) => s.sid),
    identityPolicies: Object.fromEntries(c.world.identities.map((i) => [i.id, i.policies.map((s) => s.sid)])),
    keyPolicies: Object.fromEntries(c.world.keys.map((k) => [k.id, k.policy.map((s) => s.sid)])),
    bpa: { ...c.world.bucket.bpa },
    objectOwnership: c.world.bucket.objectOwnership,
  }
}

function pick(sids: string[], available: Statement[]): Statement[] {
  return sids.map((sid) => available.find((s) => s.sid === sid)).filter((s): s is Statement => Boolean(s))
}

export interface AppliedConfig {
  world: AccessWorld
  /** Mudanças que o S3 rejeitaria (ex.: política pública com BlockPublicPolicy ativo). */
  rejected: string[]
}

/** Aplica a configuração do usuário ao mundo inicial, respeitando o Block Public Access. */
export function applyAccessConfig(c: AccessLabConfig, r: AccessLabResponse): AppliedConfig {
  const rejected: string[] = []
  const w = structuredClone(c.world)
  w.bucket.bpa = { ...r.bpa }
  w.bucket.objectOwnership = r.objectOwnership
  const bucketAvailable = [...(c.bucketLibrary ?? []), ...c.world.bucket.policy]
  const proposed = pick(r.bucketPolicy, bucketAvailable)
  const changed = r.bucketPolicy.join('|') !== c.world.bucket.policy.map((s) => s.sid).join('|')
  if (changed && r.bpa.blockPublicPolicy && isPublicPolicy(proposed)) {
    rejected.push('PutBucketPolicy rejeitado: a política proposta é pública e o Block Public Access (BlockPublicPolicy) está ativo. A política anterior continua valendo.')
  } else {
    w.bucket.policy = proposed
  }
  for (const id of w.identities) {
    const available = [...(c.identityLibrary?.[id.id] ?? []), ...(c.world.identities.find((x) => x.id === id.id)?.policies ?? [])]
    if (r.identityPolicies[id.id]) id.policies = pick(r.identityPolicies[id.id], available)
  }
  for (const k of w.keys) {
    if (k.managedBy !== 'customer') continue
    const available = [...(c.keyLibrary?.[k.id] ?? []), ...(c.world.keys.find((x) => x.id === k.id)?.policy ?? [])]
    if (r.keyPolicies[k.id]) k.policy = pick(r.keyPolicies[k.id], available)
  }
  return { world: w, rejected }
}

export function accessMatrix(c: AccessLabConfig, world: AccessWorld) {
  return c.identities.map((identityId) => ({
    identityId,
    cells: c.requests.map((req) => ({ requestId: req.id, decision: evaluateAccess(world, { ...req, identityId }) })),
  }))
}

function overPermissive(statements: Statement[]): Statement[] {
  return statements.filter((s) => s.effect === 'Allow' && s.actions.some((a) => a === 's3:*' || a === '*') && s.resources.some((r) => r === '*'))
}

export function evaluateAccessLab(c: AccessLabConfig, r: AccessLabResponse): { score: number; items: { concepts?: string[]; score: number; fb: ItemFeedback }[] } {
  const { world, rejected } = applyAccessConfig(c, r)
  const items = c.goals.map((g) => {
    const req = c.requests.find((x) => x.id === g.requestId)!
    const who = world.identities.find((i) => i.id === g.identityId)!
    const d = evaluateAccess(world, { ...req, identityId: g.identityId })
    const ok = d.allowed === (g.expect === 'allow')
    return {
      concepts: g.concepts,
      score: ok ? 1 : 0,
      fb: {
        id: `${g.identityId}:${g.requestId}`,
        label: `${who.name} · ${req.label}: ${d.allowed ? 'permitido' : 'negado'} (esperado: ${g.expect === 'allow' ? 'permitido' : 'negado'})`,
        status: ok ? 'correct' : 'wrong',
        message: ok ? g.why : `${g.why} ${d.trace.slice(-2).join(' ')}`,
      } as ItemFeedback,
    }
  })
  let score = items.reduce((s, i) => s + i.score, 0) / Math.max(1, items.length)
  if (c.leastPrivilege) {
    const all = [...world.bucket.policy, ...world.identities.flatMap((i) => i.policies)]
    const bad = overPermissive(all)
    if (bad.length > 0) {
      score *= 0.7
      items.push({ concepts: undefined, score: 0, fb: { id: 'least-privilege', label: 'Menor privilégio', status: 'wrong', message: `Declarações com Allow "s3:*" em "*" (${bad.map((b) => b.sid).join(', ')}) concedem muito mais do que o necessário.` } })
    }
  }
  for (const msg of rejected) items.push({ concepts: undefined, score: 0, fb: { id: `rejected-${items.length}`, label: 'Mudança rejeitada pelo S3', status: 'wrong', message: msg } })
  return { score, items }
}
