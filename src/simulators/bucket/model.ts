/**
 * Modelo simplificado de um bucket S3 de uso geral.
 *
 * Simplificações: não modela versionamento, permissões nem paginação; a listagem
 * retorna tudo de uma vez. As regras de nome seguem
 * https://docs.aws.amazon.com/AmazonS3/latest/userguide/bucketnamingrules.html
 */
import type { StorageClassId } from '../shared/storageClasses'

export interface S3ObjectData {
  key: string
  sizeBytes: number
  contentType: string
  lastModified: string
  etag: string
  storageClass: StorageClassId
  /** Metadados definidos pelo usuário (sem o prefixo x-amz-meta-). */
  userMetadata?: Record<string, string>
  tags?: Record<string, string>
}

export interface BucketData {
  name: string
  region: string
  accountId: string
  objects: S3ObjectData[]
}

export interface ListResult {
  contents: S3ObjectData[]
  commonPrefixes: string[]
}

/**
 * Equivalente simplificado ao ListObjectsV2: com delimitador, as keys que
 * contêm o delimitador depois do prefixo são agrupadas em CommonPrefixes.
 */
export function listObjects(bucket: BucketData, prefix = '', delimiter?: string): ListResult {
  const contents: S3ObjectData[] = []
  const prefixes = new Set<string>()
  const sorted = [...bucket.objects].sort((a, b) => (a.key < b.key ? -1 : a.key > b.key ? 1 : 0))
  for (const obj of sorted) {
    if (!obj.key.startsWith(prefix)) continue
    const rest = obj.key.slice(prefix.length)
    if (delimiter) {
      const idx = rest.indexOf(delimiter)
      if (idx >= 0) {
        prefixes.add(prefix + rest.slice(0, idx + delimiter.length))
        continue
      }
    }
    contents.push(obj)
  }
  return { contents, commonPrefixes: [...prefixes].sort() }
}

export function countObjectsUnder(bucket: BucketData, prefix: string): number {
  return bucket.objects.filter((o) => o.key.startsWith(prefix)).length
}

export function bucketArn(bucket: string): string {
  return `arn:aws:s3:::${bucket}`
}

export function objectArn(bucket: string, key: string): string {
  return `arn:aws:s3:::${bucket}/${key}`
}

export function s3Uri(bucket: string, key: string): string {
  return `s3://${bucket}/${key}`
}

/** URL no estilo virtual-hosted. Cada segmento da key é codificado, a barra é mantida. */
export function virtualHostedUrl(bucket: string, region: string, key: string): string {
  const path = key
    .split('/')
    .map((s) => encodeURIComponent(s))
    .join('/')
  return `https://${bucket}.s3.${region}.amazonaws.com/${path}`
}

/** Nome do arquivo exibido pelo console: o trecho final da key após a última barra. */
export function displayName(key: string): string {
  const parts = key.split('/')
  return parts[parts.length - 1] || key
}

export interface NameValidation {
  valid: boolean
  violations: string[]
}

const RESERVED_PREFIXES = ['xn--', 'sthree-', 'amzn-s3-demo-']
const RESERVED_SUFFIXES = ['-s3alias', '--ol-s3', '.mrap', '--x-s3', '--table-s3']

export function validateBucketName(name: string): NameValidation {
  const v: string[] = []
  if (name.length < 3 || name.length > 63) v.push('Deve ter entre 3 e 63 caracteres.')
  if (!/^[a-z0-9.-]*$/.test(name)) v.push('Só são permitidas letras minúsculas, números, pontos e hífens.')
  if (!/^[a-z0-9]/.test(name) || !/[a-z0-9]$/.test(name)) v.push('Deve começar e terminar com letra ou número.')
  if (name.includes('..')) v.push('Não pode conter dois pontos seguidos.')
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(name)) v.push('Não pode ter formato de endereço IP.')
  for (const p of RESERVED_PREFIXES) if (name.startsWith(p)) v.push(`O prefixo "${p}" é reservado.`)
  for (const s of RESERVED_SUFFIXES) if (name.endsWith(s)) v.push(`O sufixo "${s}" é reservado.`)
  return { valid: v.length === 0, violations: v }
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  const units = ['KB', 'MB', 'GB', 'TB']
  let value = bytes / 1024
  let i = 0
  while (value >= 1024 && i < units.length - 1) {
    value /= 1024
    i++
  }
  return `${value.toLocaleString('pt-BR', { maximumFractionDigits: 1 })} ${units[i]}`
}

export interface ObjectMatch {
  keyPrefix?: string
  contentType?: string
  userMetadata?: Record<string, string>
  tags?: Record<string, string>
  storageClass?: StorageClassId
  /** Seleciona o maior objeto entre os que atendem aos demais critérios. */
  largest?: boolean
}

export function findObjects(bucket: BucketData, match: ObjectMatch): S3ObjectData[] {
  let found = bucket.objects.filter((o) => {
    if (match.keyPrefix && !o.key.startsWith(match.keyPrefix)) return false
    if (match.contentType && o.contentType !== match.contentType) return false
    if (match.storageClass && o.storageClass !== match.storageClass) return false
    if (match.userMetadata) {
      for (const [k, val] of Object.entries(match.userMetadata)) if (o.userMetadata?.[k] !== val) return false
    }
    if (match.tags) {
      for (const [k, val] of Object.entries(match.tags)) if (o.tags?.[k] !== val) return false
    }
    return true
  })
  if (match.largest && found.length > 0) {
    const max = Math.max(...found.map((o) => o.sizeBytes))
    found = found.filter((o) => o.sizeBytes === max)
  }
  return found
}
