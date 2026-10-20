import type { LifecycleRule } from './model'

/** Configuração no formato JSON aceito por PutBucketLifecycleConfiguration (AWS CLI). */
export function lifecycleJson(rules: LifecycleRule[]): string {
  const filter = (r: LifecycleRule) => {
    const parts: Record<string, unknown>[] = []
    if (r.filter.prefix) parts.push({ Prefix: r.filter.prefix })
    for (const [Key, Value] of Object.entries(r.filter.tags ?? {})) parts.push({ Tag: { Key, Value } })
    if (r.filter.sizeGreaterThanKB !== undefined) parts.push({ ObjectSizeGreaterThan: r.filter.sizeGreaterThanKB * 1024 })
    if (r.filter.sizeLessThanKB !== undefined) parts.push({ ObjectSizeLessThan: r.filter.sizeLessThanKB * 1024 })
    if (parts.length === 0) return {}
    if (parts.length === 1) return parts[0]
    const and: Record<string, unknown> = {}
    for (const p of parts) {
      if ('Tag' in p) and.Tags = [...((and.Tags as unknown[]) ?? []), p.Tag]
      else Object.assign(and, p)
    }
    return { And: and }
  }
  return JSON.stringify(
    {
      Rules: rules.map((r) => ({
        ID: r.id,
        Status: r.enabled ? 'Enabled' : 'Disabled',
        Filter: filter(r),
        ...(r.transitions.length ? { Transitions: r.transitions.map((t) => ({ Days: t.days, StorageClass: t.storageClass })) } : {}),
        ...(r.expirationDays !== undefined || r.expiredObjectDeleteMarker ? { Expiration: r.expiredObjectDeleteMarker ? { ExpiredObjectDeleteMarker: true } : { Days: r.expirationDays } } : {}),
        ...(r.noncurrentTransitions.length ? { NoncurrentVersionTransitions: r.noncurrentTransitions.map((t) => ({ NoncurrentDays: t.days, StorageClass: t.storageClass })) } : {}),
        ...(r.noncurrentExpirationDays !== undefined ? { NoncurrentVersionExpiration: { NoncurrentDays: r.noncurrentExpirationDays } } : {}),
        ...(r.abortMultipartDays !== undefined ? { AbortIncompleteMultipartUpload: { DaysAfterInitiation: r.abortMultipartDays } } : {}),
      })),
    },
    null,
    2,
  )
}
