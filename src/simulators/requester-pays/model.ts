/**
 * Modelo de cobrança de buckets Requester Pays.
 *
 * Regras conferidas em https://docs.aws.amazon.com/AmazonS3/latest/userguide/RequesterPaysBuckets.html
 * (16/10/2026): o requisitante paga requisição e download; o dono sempre paga o armazenamento;
 * acesso anônimo não é permitido; é preciso o cabeçalho x-amz-request-payer (o dono não precisa);
 * com papel assumido, paga a conta dona do papel; 403 iniciado dentro da conta ou da organização
 * do dono é cobrado do dono; em RestoreObject, o requisitante paga a requisição e o dono, a recuperação.
 *
 * Simplificações: autorização (IAM/bucket policy) é um sim/não; não modela SOAP nem a cobrança
 * de 403 em buckets comuns.
 */

export interface RPBucket {
  name: string
  requesterPays: boolean
  ownerAccount: string
  /** Contas da mesma AWS Organization do dono. */
  orgAccounts: string[]
}

export interface RPRequest {
  id: string
  label: string
  /** Quem faz a requisição. */
  principal: { kind: 'anonymous' } | { kind: 'user'; account: string; name: string } | { kind: 'assumed-role'; roleAccount: string; callerAccount: string; name: string }
  action: 'GET' | 'PUT' | 'LIST' | 'RESTORE'
  header: boolean
  /** A política (IAM + bucket policy) autoriza a ação. */
  authorized: boolean
  /** Volume baixado (GB), para estimar a transferência. */
  gb?: number
}

export type Payer = 'owner' | 'requester' | 'none'

export interface RPResult {
  status: 200 | 403
  /** Quem paga a requisição. */
  requestPayer: Payer
  /** Quem paga a transferência de dados (download). */
  transferPayer: Payer
  /** Conta efetivamente cobrada quando o requisitante paga. */
  chargedAccount?: string
  retrievalPayer?: Payer
  reason: string
}

function callerAccount(r: RPRequest): string | null {
  if (r.principal.kind === 'anonymous') return null
  return r.principal.kind === 'user' ? r.principal.account : r.principal.roleAccount
}

export function evaluateRP(b: RPBucket, r: RPRequest): RPResult {
  const acc = callerAccount(r)
  const isOwner = acc === b.ownerAccount
  const inOrg = acc !== null && (isOwner || b.orgAccounts.includes(acc))
  const download = r.action === 'GET'

  if (!b.requesterPays) {
    if (!r.authorized) return { status: 403, requestPayer: 'none', transferPayer: 'none', reason: 'Sem permissão: AccessDenied. (A cobrança de 403 em buckets comuns não é simulada.)' }
    return { status: 200, requestPayer: 'owner', transferPayer: download ? 'owner' : 'none', retrievalPayer: r.action === 'RESTORE' ? 'owner' : undefined, reason: 'Bucket comum: o dono paga armazenamento, requisições e transferência.' }
  }

  if (r.principal.kind === 'anonymous') return { status: 403, requestPayer: 'none', transferPayer: 'none', reason: 'Buckets Requester Pays não aceitam requisições anônimas: é preciso autenticar para identificar quem paga.' }

  const denied = (why: string): RPResult =>
    inOrg
      ? { status: 403, requestPayer: 'owner', transferPayer: 'none', reason: `${why} O 403 veio de dentro da conta ou da organização do dono: o dono paga a requisição.` }
      : { status: 403, requestPayer: 'none', transferPayer: 'none', reason: `${why} O 403 veio de fora da conta e da organização do dono: o dono não paga.` }

  if (isOwner) {
    if (!r.authorized) return denied('Sem permissão: AccessDenied.')
    return { status: 200, requestPayer: 'owner', transferPayer: download ? 'owner' : 'none', retrievalPayer: r.action === 'RESTORE' ? 'owner' : undefined, reason: 'Requisições da própria conta dona não precisam do cabeçalho; o dono paga.' }
  }
  if (!r.header) return denied('Sem o cabeçalho x-amz-request-payer, o requisitante não aceitou a cobrança: AccessDenied.')
  if (!r.authorized) return denied('Requester Pays não concede acesso: sem permissão, AccessDenied.')
  const viaRole = r.principal.kind === 'assumed-role'
  return {
    status: 200,
    requestPayer: 'requester',
    transferPayer: download ? 'requester' : 'none',
    chargedAccount: acc!,
    retrievalPayer: r.action === 'RESTORE' ? 'owner' : undefined,
    reason: `${viaRole ? `Papel assumido: paga a conta dona do papel (${acc}).` : `Paga a conta do requisitante (${acc}).`}${r.action === 'RESTORE' ? ' Em RestoreObject, o requisitante paga a requisição e o dono paga a recuperação.' : ''} O dono continua pagando o armazenamento.`,
  }
}

export const PAYER_LABEL: Record<Payer, string> = { owner: 'Dono do bucket', requester: 'Requisitante', none: 'Não cobrado do dono' }
