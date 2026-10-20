/** Interface do laboratório de versionamento: operações, linha do tempo de versões e listagem. */
import { Copy, Eye, FilePlus2, History, ListTree, Lock, RotateCcw, Trash2, Undo2 } from 'lucide-react'
import { useMemo, useState } from 'react'
import type { Evaluation } from '../../engine/types'
import { Badge, Button } from '../../ui/kit'
import { initialBucket, runLab, type VersioningLabConfig, type VersioningLabResponse } from './lab'
import { getObject, listCurrent, STATE_LABEL, type VOp } from './model'
import s from './versioning.module.css'

interface Props {
  config: VersioningLabConfig
  value: VersioningLabResponse
  onChange: (v: VersioningLabResponse) => void
  disabled: boolean
  evaluation?: Evaluation | null
}

function describeOp(op: VOp): string {
  switch (op.op) {
    case 'put':
      return `PUT ${op.key} ← "${op.content}"`
    case 'delete':
      return `DELETE ${op.key} (sem versionId)`
    case 'delete-version':
      return `DELETE ${op.key}?versionId=${op.versionId}`
    case 'copy-version':
      return `COPY ${op.key}?versionId=${op.versionId} → ${op.key}`
    case 'set-versioning':
      return `PutBucketVersioning Status=${op.state}`
  }
}

export function VersioningLab({ config, value, onChange, disabled }: Props) {
  const ops = useMemo(() => value.ops ?? [], [value.ops])
  const start = useMemo(() => initialBucket(config), [config])
  const { bucket, results } = useMemo(() => runLab(config, { ops }), [config, ops])
  const [key, setKey] = useState(config.keys[0] ?? '')
  const [content, setContent] = useState(config.contents?.[0] ?? '')
  const [probe, setProbe] = useState<string | null>(null)
  const allowed = (op: VOp['op']) => config.allowedOps.includes(op)
  const push = (op: VOp) => {
    setProbe(null)
    onChange({ ops: [...ops, op] })
  }
  const last = results.at(-1)
  const keys = Array.from(new Set([...config.keys, ...Object.keys(bucket.objects)])).sort()
  const listing = listCurrent(bucket)

  return (
    <div className={s.lab}>
      <div className={s.head}>
        <History size={18} aria-hidden="true" />
        <code>{bucket.name}</code>
        <Badge tone={bucket.state === 'Enabled' ? 'success' : bucket.state === 'Suspended' ? 'warning' : undefined}>Versionamento: {STATE_LABEL[bucket.state]}</Badge>
        {bucket.mfaDelete && <Badge tone="info">MFA delete habilitado</Badge>}
      </div>

      <div className={s.columns}>
        <div className={s.col}>
          <section className={s.panel} aria-label="Operações">
            <h4 className={s.panelTitle}>Operações</h4>
            {allowed('set-versioning') && (
              <div className={s.row}>
                <Button size="small" variant="secondary" disabled={disabled || bucket.state === 'Enabled'} onClick={() => push({ op: 'set-versioning', state: 'Enabled' })}>
                  Habilitar versionamento
                </Button>
                <Button size="small" variant="secondary" disabled={disabled || bucket.state !== 'Enabled'} onClick={() => push({ op: 'set-versioning', state: 'Suspended' })}>
                  Suspender versionamento
                </Button>
              </div>
            )}
            {(allowed('put') || allowed('delete')) && (
              <div className={s.form}>
                <label>
                  <span>Key</span>
                  <select value={key} onChange={(e) => setKey(e.target.value)} disabled={disabled}>
                    {keys.map((k) => (
                      <option key={k} value={k}>
                        {k}
                      </option>
                    ))}
                  </select>
                </label>
                {allowed('put') && (
                  <label>
                    <span>Conteúdo (rótulo)</span>
                    <input value={content} onChange={(e) => setContent(e.target.value)} list="vl-contents" disabled={disabled} />
                    <datalist id="vl-contents">
                      {(config.contents ?? []).map((c) => (
                        <option key={c} value={c} />
                      ))}
                    </datalist>
                  </label>
                )}
                <div className={s.row}>
                  {allowed('put') && (
                    <Button size="small" disabled={disabled || !key || !content.trim()} onClick={() => push({ op: 'put', key, content: content.trim() })}>
                      <FilePlus2 size={16} aria-hidden="true" /> PUT
                    </Button>
                  )}
                  {allowed('delete') && (
                    <Button size="small" variant="secondary" disabled={disabled || !key} onClick={() => push({ op: 'delete', key })}>
                      <Trash2 size={16} aria-hidden="true" /> DELETE simples
                    </Button>
                  )}
                </div>
              </div>
            )}
          </section>

          <div className={s.result} aria-live="polite">
            {probe ?? (last ? <span data-ok={last.ok}>{last.status} · {last.message}</span> : <span className="muted">O resultado de cada operação aparece aqui.</span>)}
          </div>

        </div>

        <div className={s.col}>
          <section className={s.panel} aria-label="Versões">
            <h4 className={s.panelTitle}>
              Versões <span className={s.count}>(ListObjectVersions)</span>
            </h4>
            {keys.filter((k) => bucket.objects[k]).length === 0 && <p className="muted">Nenhum objeto.</p>}
            {keys
              .filter((k) => bucket.objects[k])
              .map((k) => (
                <div key={k} className={s.keyBlock}>
                  <code className={s.key}>{k}</code>
                  <ul className={s.versions}>
                    {bucket.objects[k].map((v, i) => (
                      <li key={`${v.versionId}-${v.seq}`} className={s.version} data-dm={v.isDeleteMarker} data-current={i === 0}>
                        <div className={s.vMain}>
                          <Badge tone={i === 0 ? 'success' : undefined}>{i === 0 ? 'atual' : 'não atual'}</Badge>
                          <code className={s.vid} title={v.versionId}>
                            {v.versionId}
                          </code>
                          {v.locked && (
                            <Badge tone="info">
                              <Lock size={12} aria-hidden="true" /> Object Lock
                            </Badge>
                          )}
                          <span className={s.vContent}>{v.isDeleteMarker ? 'delete marker' : `"${v.content}"`}</span>
                        </div>
                        <div className={s.vActions}>
                          <button type="button" className={s.mini} disabled={disabled} onClick={() => setProbe(`GET ${k}?versionId=${v.versionId} → ${getObject(bucket, k, v.versionId).message}`)} aria-label={`GET da versão ${v.versionId} de ${k}`}>
                            <Eye size={14} aria-hidden="true" /> GET
                          </button>
                          {allowed('copy-version') && !v.isDeleteMarker && i > 0 && (
                            <button type="button" className={s.mini} disabled={disabled} onClick={() => push({ op: 'copy-version', key: k, versionId: v.versionId })} aria-label={`Copiar a versão ${v.versionId} de ${k} como atual`}>
                              <Copy size={14} aria-hidden="true" /> Copiar como atual
                            </button>
                          )}
                          {allowed('delete-version') && (
                            <button type="button" className={s.mini} data-danger="true" disabled={disabled} onClick={() => push({ op: 'delete-version', key: k, versionId: v.versionId })} aria-label={`Excluir para sempre a versão ${v.versionId} de ${k}`}>
                              <Trash2 size={14} aria-hidden="true" /> Excluir versão
                            </button>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
          </section>

          <section className={s.panel} aria-label="Listagem">
            <h4 className={s.panelTitle}>
              <ListTree size={16} aria-hidden="true" /> O que a listagem mostra <span className={s.count}>(ListObjectsV2)</span>
            </h4>
            {listing.length === 0 ? (
              <p className="muted">A listagem está vazia.</p>
            ) : (
              <ul className={s.listing}>
                {listing.map((o) => (
                  <li key={o.key}>
                    <code>{o.key}</code> <span className="muted">"{o.version.content}"</span>
                    <button type="button" className={s.mini} disabled={disabled} onClick={() => setProbe(`GET ${o.key} → ${getObject(bucket, o.key).message}`)} aria-label={`GET de ${o.key}`}>
                      <Eye size={14} aria-hidden="true" /> GET
                    </button>
                  </li>
                ))}
              </ul>
            )}
            {Object.keys(start.objects).length > 0 && keys.some((k) => bucket.objects[k]?.[0]?.isDeleteMarker) && (
              <p className={s.note}>Keys cuja versão atual é um delete marker não aparecem aqui — mas as versões continuam guardadas (e cobradas).</p>
            )}
          </section>

          <details className={s.simp}>
            <summary>Simplificações deste simulador</summary>
            <ul>
              <li>Version IDs são gerados de forma determinística; na AWS são cadeias opacas.</li>
              <li>Todas as operações são feitas pelo dono do bucket, sem avaliar permissões.</li>
              <li>Object Lock aparece só como "versão protegida", sem modos (governance/compliance), datas ou legal hold.</li>
            </ul>
          </details>
        </div>
      </div>

      <section className={s.panel} aria-label="Histórico">
        <h4 className={s.panelTitle}>Histórico</h4>
        <ol className={s.log}>
          {config.setup.map((h, i) => (
            <li key={`s${i}`} className={s.past}>
              <span className={s.when}>{h.when}</span> <code>{describeOp(h.op)}</code>
            </li>
          ))}
          {ops.map((op, i) => (
            <li key={`u${i}`} data-ok={results[i]?.ok}>
              <span className={s.when}>você</span> <code>{describeOp(op)}</code>
              <small>
                {results[i]?.status} · {results[i]?.message}
              </small>
            </li>
          ))}
        </ol>
        <div className={s.row}>
          <Button size="small" variant="ghost" disabled={disabled || ops.length === 0} onClick={() => onChange({ ops: ops.slice(0, -1) })}>
            <Undo2 size={16} aria-hidden="true" /> Desfazer a última
          </Button>
          <Button size="small" variant="ghost" disabled={disabled || ops.length === 0} onClick={() => onChange({ ops: [] })}>
            <RotateCcw size={16} aria-hidden="true" /> Recomeçar
          </Button>
        </div>
      </section>
    </div>
  )
}
