/**
 * Modelo de S3 Replication (CRR/SRR): pré-requisitos, regras e o resultado de cada
 * cenário (COMPLETED, FAILED ou não replicado), com o motivo.
 *
 * Regras conferidas em 16/10/2026:
 *  - https://docs.aws.amazon.com/AmazonS3/latest/userguide/replication-requirements.html
 *  - https://docs.aws.amazon.com/AmazonS3/latest/userguide/replication-what-is-isnot-replicated.html
 *  - https://docs.aws.amazon.com/AmazonS3/latest/userguide/replication-config-for-kms-objects.html
 *  - https://docs.aws.amazon.com/AmazonS3/latest/userguide/replication-time-control.html
 *
 * Simplificações: o tempo não é simulado (o RTC aparece como SLA); permissões do papel
 * de replicação são caixas de seleção; cada regra tem um destino; prioridades entre
 * regras sobrepostas não são avaliadas.
 */
import type { StorageClassId } from '../shared/storageClasses'

export type BucketVersioning = 'Unversioned' | 'Enabled' | 'Suspended'

export interface ReplBucket {
  name: string
  region: string
  account: string
  versioning: BucketVersioning
  objectLock?: boolean
}

export type ReplicaKey = 'dest-customer' | 'source-region-customer' | 'aws-managed'

export interface ReplRule {
  id: string
  enabled: boolean
  prefix?: string
  tag?: { key: string; value: string }
  destination: string
  storageClass?: StorageClassId
  deleteMarkerReplication: boolean
  rtc: boolean
  /** SourceSelectionCriteria.SseKmsEncryptedObjects (opt-in para objetos SSE-KMS). */
  replicateKms: boolean
  replicaKey?: ReplicaKey
}

export interface ReplRole {
  /** s3:GetObjectVersionForReplication na origem e s3:ReplicateObject/ReplicateDelete no destino. */
  s3: boolean
  kmsDecrypt: boolean
  kmsEncrypt: boolean
}

export interface ReplSetup {
  source: ReplBucket
  destinations: ReplBucket[]
  role: ReplRole
  /** A bucket policy do destino permite a replicação vinda da conta de origem. */
  destPolicy: Record<string, boolean>
  rules: ReplRule[]
}

export type ReplEventKind = 'put' | 'existing' | 'delete-marker' | 'delete-version' | 'tag-after-put' | 'lifecycle-expire' | 'replica-of-replica' | 'archived'

export interface ReplEvent {
  id: string
  label: string
  kind: ReplEventKind
  key: string
  encryption?: 'SSE-S3' | 'SSE-KMS' | 'SSE-C'
  tags?: Record<string, string>
  storageClass?: StorageClassId
}

export type ReplStatus = 'COMPLETED' | 'FAILED' | 'NOT_REPLICATED'

export interface ReplResult {
  status: ReplStatus
  reason: string
  replicaClass?: StorageClassId
}

export interface ConfigIssue {
  ruleId?: string
  message: string
}

export function validateReplication(s: ReplSetup): ConfigIssue[] {
  const issues: ConfigIssue[] = []
  if (s.source.versioning !== 'Enabled') issues.push({ message: 'O bucket de origem precisa ter versionamento habilitado.' })
  for (const r of s.rules) {
    if (!s.destinations.some((d) => d.name === r.destination)) issues.push({ ruleId: r.id, message: 'Destino inexistente.' })
    if (r.tag && r.deleteMarkerReplication) issues.push({ ruleId: r.id, message: 'Replicação de delete markers não é permitida em regras com filtro por tag.' })
    if (r.replicateKms && !r.replicaKey) issues.push({ ruleId: r.id, message: 'Para replicar objetos SSE-KMS, informe a chave KMS das réplicas (ReplicaKmsKeyID).' })
    const dest = s.destinations.find((d) => d.name === r.destination)
    if (dest && s.source.objectLock && !dest.objectLock) issues.push({ ruleId: r.id, message: 'Com Object Lock na origem, o destino também precisa ter Object Lock.' })
  }
  if (s.rules.length === 0) issues.push({ message: 'Nenhuma regra de replicação.' })
  return issues
}

function matches(r: ReplRule, e: ReplEvent): boolean {
  if (!r.enabled) return false
  if (r.prefix && !e.key.startsWith(r.prefix)) return false
  if (r.tag && e.kind !== 'tag-after-put' && e.tags?.[r.tag.key] !== r.tag.value) return false
  return true
}

export const KIND_LABEL: Record<ReplEventKind, string> = {
  put: 'PUT de objeto novo',
  existing: 'Objeto anterior à configuração',
  'delete-marker': 'DELETE simples (delete marker)',
  'delete-version': 'DELETE de uma versão específica',
  'tag-after-put': 'Tag adicionada depois do PUT',
  'lifecycle-expire': 'Expiração por lifecycle',
  'replica-of-replica': 'Réplica vinda de outra regra',
  archived: 'Objeto em classe arquivada',
}

/** Resultado de um evento para um destino. */
export function replicate(s: ReplSetup, e: ReplEvent, destination: string): ReplResult {
  const issues = validateReplication(s)
  if (issues.length > 0) return { status: 'NOT_REPLICATED', reason: 'A configuração de replicação foi rejeitada: nada é replicado.' }
  const rule = s.rules.find((r) => r.destination === destination && matches(r, e))
  if (!rule) return { status: 'NOT_REPLICATED', reason: 'Nenhuma regra ativa para este destino cobre este objeto (filtro de prefixo ou tag).' }
  const dest = s.destinations.find((d) => d.name === destination)!
  const crossAccount = dest.account !== s.source.account

  switch (e.kind) {
    case 'existing':
      return { status: 'NOT_REPLICATED', reason: 'Objetos que já existiam antes da configuração não são replicados. Use S3 Batch Replication.' }
    case 'replica-of-replica':
      return { status: 'NOT_REPLICATED', reason: 'Réplicas criadas por outra regra não são replicadas de novo (A→B→C não leva os objetos de A até C). Use Batch Replication.' }
    case 'archived':
      return { status: 'NOT_REPLICATED', reason: 'Objetos em Glacier Flexible Retrieval ou Deep Archive não são replicados; é preciso restaurar e copiar para outra classe.' }
    case 'lifecycle-expire':
      return { status: 'NOT_REPLICATED', reason: 'Ações do lifecycle não são replicadas: o delete marker criado pela expiração fica só na origem.' }
    case 'delete-version':
      return { status: 'NOT_REPLICATED', reason: 'DELETE com versionId apaga a versão só na origem — a réplica é preservada (proteção contra exclusões maliciosas).' }
    case 'tag-after-put':
      if (rule.tag) return { status: 'NOT_REPLICATED', reason: 'Em regras com filtro por tag, a tag precisa estar no PutObject. Objetos marcados depois não são replicados (use Batch Replication).' }
      break
    case 'delete-marker':
      return rule.deleteMarkerReplication
        ? { status: 'COMPLETED', reason: 'Delete marker replicado: o objeto também "some" no destino (as versões continuam lá).' }
        : { status: 'NOT_REPLICATED', reason: 'Por padrão (configuração com Filter), delete markers não são replicados: o destino mantém o objeto visível.' }
    case 'put':
      break
  }

  if (!s.role.s3) return { status: 'FAILED', reason: 'O papel IAM de replicação não tem permissão para ler na origem e replicar no destino.' }
  if (crossAccount && !s.destPolicy[destination]) return { status: 'FAILED', reason: 'Destino em outra conta: a bucket policy do destino precisa permitir a replicação vinda da conta de origem.' }
  if (dest.versioning !== 'Enabled') return { status: 'FAILED', reason: 'O bucket de destino não está com versionamento habilitado: a replicação falha.' }
  if (e.encryption === 'SSE-KMS') {
    if (!rule.replicateKms) return { status: 'NOT_REPLICATED', reason: 'Objetos SSE-KMS só são replicados com opt-in explícito (SseKmsEncryptedObjects).' }
    if (rule.replicaKey === 'source-region-customer' && dest.region !== s.source.region) return { status: 'FAILED', reason: 'A chave KMS das réplicas precisa estar na mesma Região do bucket de destino.' }
    if (rule.replicaKey === 'aws-managed' && crossAccount) return { status: 'FAILED', reason: 'Chaves gerenciadas pela AWS não permitem uso entre contas: use uma chave gerenciada pelo cliente.' }
    if (!s.role.kmsDecrypt) return { status: 'FAILED', reason: 'O papel de replicação precisa de kms:Decrypt na chave da origem.' }
    if (!s.role.kmsEncrypt) return { status: 'FAILED', reason: 'O papel de replicação precisa de kms:Encrypt na chave das réplicas.' }
  }
  const replicaClass = rule.storageClass ?? e.storageClass ?? 'STANDARD'
  return {
    status: 'COMPLETED',
    replicaClass,
    reason: `Replicado para ${dest.name} (${dest.region === s.source.region ? 'SRR, mesma Região' : 'CRR, outra Região'})${rule.rtc ? ', com S3 RTC (99,9% em até 15 min)' : ''}.`,
  }
}

export function replicationType(s: ReplSetup, destination: string): 'CRR' | 'SRR' | null {
  const d = s.destinations.find((x) => x.name === destination)
  if (!d) return null
  return d.region === s.source.region ? 'SRR' : 'CRR'
}
