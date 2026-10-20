import { describe, expect, it } from 'vitest'
import { applyOp, emptyBucket, getObject, listCurrent, replay, type VOp } from './model'

const run = (ops: VOp[]) => replay(emptyBucket('b'), ops)

describe('versionamento', () => {
  it('sem versionamento, PUT sobrescreve e DELETE apaga para sempre', () => {
    const { bucket } = run([
      { op: 'put', key: 'a', content: 'v1' },
      { op: 'put', key: 'a', content: 'v2' },
    ])
    expect(bucket.objects.a).toHaveLength(1)
    expect(bucket.objects.a[0].versionId).toBe('null')
    const after = applyOp(bucket, { op: 'delete', key: 'a' }).bucket
    expect(after.objects.a).toBeUndefined()
  })

  it('objetos anteriores ao versionamento mantêm o version ID null', () => {
    const { bucket } = run([
      { op: 'put', key: 'a', content: 'antes' },
      { op: 'set-versioning', state: 'Enabled' },
      { op: 'put', key: 'a', content: 'depois' },
    ])
    expect(bucket.objects.a.map((v) => v.versionId)).toEqual([expect.not.stringMatching(/^null$/), 'null'])
  })

  it('DELETE simples com versionamento cria delete marker: GET 404 e GET da versão do marker 405', () => {
    const { bucket } = run([
      { op: 'set-versioning', state: 'Enabled' },
      { op: 'put', key: 'a', content: 'v1' },
      { op: 'delete', key: 'a' },
    ])
    expect(bucket.objects.a).toHaveLength(2)
    expect(getObject(bucket, 'a')).toMatchObject({ status: 404, deleteMarker: true })
    expect(getObject(bucket, 'a', bucket.objects.a[0].versionId).status).toBe(405)
    expect(getObject(bucket, 'a', bucket.objects.a[1].versionId)).toMatchObject({ status: 200, content: 'v1' })
    expect(listCurrent(bucket)).toHaveLength(0)
  })

  it('remover o delete marker restaura a versão anterior', () => {
    const { bucket } = run([
      { op: 'set-versioning', state: 'Enabled' },
      { op: 'put', key: 'a', content: 'v1' },
      { op: 'delete', key: 'a' },
    ])
    const restored = applyOp(bucket, { op: 'delete-version', key: 'a', versionId: bucket.objects.a[0].versionId }).bucket
    expect(getObject(restored, 'a')).toMatchObject({ status: 200, content: 'v1' })
  })

  it('copiar uma versão anterior cria uma nova versão atual', () => {
    const { bucket } = run([
      { op: 'set-versioning', state: 'Enabled' },
      { op: 'put', key: 'a', content: 'v1' },
      { op: 'put', key: 'a', content: 'v2' },
    ])
    const r = applyOp(bucket, { op: 'copy-version', key: 'a', versionId: bucket.objects.a[1].versionId }).bucket
    expect(r.objects.a).toHaveLength(3)
    expect(getObject(r, 'a').content).toBe('v1')
  })

  it('suspenso: PUT substitui a versão null e preserva versões com ID', () => {
    const { bucket } = run([
      { op: 'put', key: 'a', content: 'original' },
      { op: 'set-versioning', state: 'Enabled' },
      { op: 'put', key: 'a', content: 'v1' },
      { op: 'set-versioning', state: 'Suspended' },
      { op: 'put', key: 'a', content: 's1' },
      { op: 'put', key: 'a', content: 's2' },
    ])
    const contents = bucket.objects.a.map((v) => v.content)
    expect(contents).toEqual(['s2', 'v1'])
    expect(bucket.objects.a[0].versionId).toBe('null')
  })

  it('suspenso: DELETE remove a versão null e insere delete marker null', () => {
    const { bucket } = run([
      { op: 'set-versioning', state: 'Enabled' },
      { op: 'put', key: 'a', content: 'v1' },
      { op: 'set-versioning', state: 'Suspended' },
      { op: 'put', key: 'a', content: 's1' },
      { op: 'delete', key: 'a' },
    ])
    expect(bucket.objects.a.map((v) => [v.versionId === 'null', v.isDeleteMarker, v.content])).toEqual([
      [true, true, undefined],
      [false, false, 'v1'],
    ])
  })

  it('MFA delete exige código para excluir versões e mudar o estado', () => {
    const base = { ...emptyBucket('b'), mfaDelete: true }
    const { bucket } = replay(base, [
      { op: 'set-versioning', state: 'Enabled', mfa: true },
      { op: 'put', key: 'a', content: 'v1' },
    ])
    const id = bucket.objects.a[0].versionId
    expect(applyOp(bucket, { op: 'delete-version', key: 'a', versionId: id }).result.status).toBe(403)
    expect(applyOp(bucket, { op: 'delete-version', key: 'a', versionId: id, mfa: true }).result.ok).toBe(true)
    expect(applyOp(bucket, { op: 'set-versioning', state: 'Suspended' }).result.status).toBe(403)
  })

  it('Object Lock nega exclusão permanente, mas aceita delete marker', () => {
    const { bucket } = run([
      { op: 'set-versioning', state: 'Enabled' },
      { op: 'put', key: 'a', content: 'v1', lock: true },
    ])
    const id = bucket.objects.a[0].versionId
    expect(applyOp(bucket, { op: 'delete-version', key: 'a', versionId: id }).result.status).toBe(403)
    const dm = applyOp(bucket, { op: 'delete', key: 'a' })
    expect(dm.result.ok).toBe(true)
    expect(dm.bucket.objects.a).toHaveLength(2)
  })

  it('version IDs são únicos e determinísticos', () => {
    const ops: VOp[] = [{ op: 'set-versioning', state: 'Enabled' }, ...Array.from({ length: 50 }, (_, i) => ({ op: 'put' as const, key: 'a', content: `v${i}` }))]
    const a = run(ops).bucket.objects.a.map((v) => v.versionId)
    expect(new Set(a).size).toBe(50)
    expect(run(ops).bucket.objects.a.map((v) => v.versionId)).toEqual(a)
  })
})
