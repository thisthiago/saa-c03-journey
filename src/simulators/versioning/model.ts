/**
 * Modelo do S3 Versioning: estados do bucket, version IDs, versão `null`,
 * delete markers, exclusão permanente e restauração.
 *
 * Regras conferidas em https://docs.aws.amazon.com/AmazonS3/latest/userguide/Versioning.html
 * e páginas relacionadas (versionamento suspenso, delete markers, MFA delete, Object Lock).
 *
 * Simplificações: version IDs são gerados de forma determinística (na AWS são opacos e
 * aleatórios); não há permissões (todas as operações são do dono do bucket); Object Lock
 * é modelado só como "versão protegida" (sem modos, datas nem legal hold).
 */

export type VersioningState = 'Unversioned' | 'Enabled' | 'Suspended'

export interface ObjectVersion {
  versionId: string
  isDeleteMarker: boolean
  /** Rótulo do conteúdo (ex.: "contrato v2"). Ausente em delete markers. */
  content?: string
  sizeMB?: number
  /** Ordem de criação (para a linha do tempo). */
  seq: number
  /** Protegida por Object Lock (retenção ou legal hold). */
  locked?: boolean
}

export interface VBucket {
  name: string
  state: VersioningState
  mfaDelete: boolean
  /** Versões por key, da mais recente (atual) para a mais antiga. */
  objects: Record<string, ObjectVersion[]>
  seq: number
}

export type VOp =
  | { op: 'put'; key: string; content: string; sizeMB?: number; lock?: boolean }
  | { op: 'delete'; key: string }
  | { op: 'delete-version'; key: string; versionId: string; mfa?: boolean }
  | { op: 'copy-version'; key: string; versionId: string }
  | { op: 'set-versioning'; state: 'Enabled' | 'Suspended'; mfa?: boolean }

export interface OpResult {
  ok: boolean
  /** Código HTTP simulado. */
  status: number
  message: string
}

const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789'

/** Gera um version ID opaco e determinístico a partir da ordem de criação. */
export function versionIdFor(seq: number): string {
  let x = (Math.imul(seq + 7, 2654435761) + 12345) >>> 0
  let s = ''
  for (let i = 0; i < 10; i++) {
    s += ALPHABET[x % ALPHABET.length]
    x = (Math.imul(x ^ (x >>> 13), 1103515245) + 12345 + i) >>> 0
  }
  return s
}

export function emptyBucket(name: string): VBucket {
  return { name, state: 'Unversioned', mfaDelete: false, objects: {}, seq: 0 }
}

function clone(b: VBucket): VBucket {
  return { ...b, objects: Object.fromEntries(Object.entries(b.objects).map(([k, v]) => [k, v.map((x) => ({ ...x }))])) }
}

const short = (id: string) => (id === 'null' ? 'null' : `${id.slice(0, 6)}…`)

/** Aplica uma operação e devolve o novo estado (o original não é alterado). */
export function applyOp(bucket: VBucket, op: VOp): { bucket: VBucket; result: OpResult } {
  const b = clone(bucket)
  const nextId = () => {
    b.seq += 1
    return versionIdFor(b.seq)
  }
  const done = (status: number, message: string) => ({ bucket: b, result: { ok: status < 300, status, message } })
  const fail = (status: number, message: string) => ({ bucket, result: { ok: false, status, message } })

  switch (op.op) {
    case 'set-versioning': {
      if (b.mfaDelete && !op.mfa) return fail(403, 'MFA delete está habilitado: mudar o estado do versionamento exige o código MFA do dono do bucket.')
      if (b.state === op.state) return done(200, `O versionamento já está ${op.state === 'Enabled' ? 'habilitado' : 'suspenso'}.`)
      b.state = op.state
      return done(200, op.state === 'Enabled' ? 'Versionamento habilitado. O bucket nunca mais volta ao estado "sem versionamento".' : 'Versionamento suspenso. As versões existentes continuam no bucket; novas gravações usam o version ID null.')
    }
    case 'put': {
      const list = b.objects[op.key] ?? []
      b.seq += 1
      const seq = b.seq
      if (b.state === 'Unversioned') {
        const existing = list.find((v) => v.versionId === 'null')
        if (existing?.locked) return fail(403, 'A versão está protegida por Object Lock e não pode ser sobrescrita.')
        b.objects[op.key] = [{ versionId: 'null', isDeleteMarker: false, content: op.content, sizeMB: op.sizeMB, seq, locked: op.lock }]
        return done(200, `PUT ${op.key}: sem versionamento, o conteúdo anterior (se havia) foi substituído.`)
      }
      if (b.state === 'Enabled') {
        const id = versionIdFor(seq)
        b.objects[op.key] = [{ versionId: id, isDeleteMarker: false, content: op.content, sizeMB: op.sizeMB, seq, locked: op.lock }, ...list]
        return done(200, `PUT ${op.key}: nova versão ${short(id)} criada; as anteriores continuam guardadas.`)
      }
      const replaced = list.find((v) => v.versionId === 'null')
      if (replaced?.locked) return fail(403, 'A versão null está protegida por Object Lock e não pode ser sobrescrita.')
      b.objects[op.key] = [{ versionId: 'null', isDeleteMarker: false, content: op.content, sizeMB: op.sizeMB, seq, locked: op.lock }, ...list.filter((v) => v.versionId !== 'null')]
      return done(
        200,
        replaced
          ? `PUT ${op.key}: versionamento suspenso — a versão null anterior${replaced.isDeleteMarker ? ' (um delete marker)' : ` ("${replaced.content}")`} foi substituída.`
          : `PUT ${op.key}: versionamento suspenso — criada a versão null; versões com ID continuam guardadas.`,
      )
    }
    case 'delete': {
      const list = b.objects[op.key] ?? []
      if (b.state === 'Unversioned') {
        if (list.length === 0) return done(204, `DELETE ${op.key}: a key não existia (o S3 responde 204 mesmo assim).`)
        if (list.some((v) => v.locked)) return fail(403, 'Objeto protegido por Object Lock.')
        delete b.objects[op.key]
        return done(204, `DELETE ${op.key}: sem versionamento, o objeto foi excluído para sempre.`)
      }
      if (b.state === 'Enabled') {
        const id = nextId()
        b.objects[op.key] = [{ versionId: id, isDeleteMarker: true, seq: b.seq }, ...list]
        return done(204, `DELETE ${op.key}: nada foi apagado — um delete marker (${short(id)}) virou a versão atual.`)
      }
      const replaced = list.find((v) => v.versionId === 'null')
      if (replaced?.locked) return fail(403, 'A versão null está protegida por Object Lock.')
      b.seq += 1
      b.objects[op.key] = [{ versionId: 'null', isDeleteMarker: true, seq: b.seq }, ...list.filter((v) => v.versionId !== 'null')]
      return done(
        204,
        replaced && !replaced.isDeleteMarker
          ? `DELETE ${op.key}: versionamento suspenso — a versão null ("${replaced.content}") foi removida e substituída por um delete marker null. Esse conteúdo se perdeu.`
          : `DELETE ${op.key}: versionamento suspenso — inserido um delete marker com version ID null.`,
      )
    }
    case 'delete-version': {
      const list = b.objects[op.key] ?? []
      const target = list.find((v) => v.versionId === op.versionId)
      if (!target) return fail(404, `A versão ${short(op.versionId)} não existe.`)
      if (b.mfaDelete && !op.mfa) return fail(403, 'MFA delete está habilitado: excluir uma versão de forma permanente exige o código MFA do dono do bucket.')
      if (target.locked) return fail(403, 'Esta versão está protegida por Object Lock: a exclusão permanente é negada (403).')
      const rest = list.filter((v) => v !== target)
      if (rest.length === 0) delete b.objects[op.key]
      else b.objects[op.key] = rest
      const wasCurrent = list[0] === target
      if (target.isDeleteMarker) {
        return done(204, wasCurrent && rest[0] && !rest[0].isDeleteMarker ? `Delete marker removido: "${rest[0].content}" voltou a ser a versão atual.` : 'Delete marker removido.')
      }
      return done(204, `Versão ${short(op.versionId)} ("${target.content}") excluída para sempre.`)
    }
    case 'copy-version': {
      const src = (b.objects[op.key] ?? []).find((v) => v.versionId === op.versionId)
      if (!src) return fail(404, `A versão ${short(op.versionId)} não existe.`)
      if (src.isDeleteMarker) return fail(400, 'Um delete marker não tem dados: não há o que copiar.')
      const res = applyOp(bucket, { op: 'put', key: op.key, content: src.content!, sizeMB: src.sizeMB })
      return res.result.ok ? { bucket: res.bucket, result: { ...res.result, message: `CopyObject: "${src.content}" copiado como nova versão atual. ${res.result.message}` } } : res
    }
  }
}

export function replay(initial: VBucket, ops: VOp[]): { bucket: VBucket; results: OpResult[] } {
  let b = initial
  const results: OpResult[] = []
  for (const op of ops) {
    const r = applyOp(b, op)
    b = r.bucket
    results.push(r.result)
  }
  return { bucket: b, results }
}

export interface GetResult {
  status: 200 | 404 | 405
  content?: string
  deleteMarker?: boolean
  message: string
}

/** GetObject, com ou sem versionId. */
export function getObject(b: VBucket, key: string, versionId?: string): GetResult {
  const list = b.objects[key] ?? []
  if (versionId === undefined) {
    const cur = list[0]
    if (!cur) return { status: 404, message: `404 Not Found: a key "${key}" não existe.` }
    if (cur.isDeleteMarker) return { status: 404, deleteMarker: true, message: '404 Not Found, com x-amz-delete-marker: true — a versão atual é um delete marker.' }
    return { status: 200, content: cur.content, message: `200 OK: "${cur.content}".` }
  }
  const v = list.find((x) => x.versionId === versionId)
  if (!v) return { status: 404, message: '404: versão inexistente.' }
  if (v.isDeleteMarker) return { status: 405, deleteMarker: true, message: '405 Method Not Allowed, com x-amz-delete-marker: true — a versão pedida é um delete marker.' }
  return { status: 200, content: v.content, message: `200 OK: "${v.content}".` }
}

/** O que ListObjectsV2 mostra: só keys cuja versão atual não é um delete marker. */
export function listCurrent(b: VBucket): { key: string; version: ObjectVersion }[] {
  return Object.entries(b.objects)
    .filter(([, v]) => v[0] && !v[0].isDeleteMarker)
    .map(([key, v]) => ({ key, version: v[0] }))
    .sort((a, c) => a.key.localeCompare(c.key))
}

/** Armazenamento total cobrado (todas as versões; delete markers ≈ 0). */
export function storedMB(b: VBucket): number {
  return Object.values(b.objects)
    .flat()
    .reduce((s, v) => s + (v.isDeleteMarker ? 0 : (v.sizeMB ?? 0)), 0)
}

export const STATE_LABEL: Record<VersioningState, string> = {
  Unversioned: 'Sem versionamento',
  Enabled: 'Habilitado',
  Suspended: 'Suspenso',
}
