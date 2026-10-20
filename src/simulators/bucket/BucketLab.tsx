/** Interface do laboratório "Explorador de bucket" (visual próprio, não imita o console AWS). */
import { Check, ChevronRight, File, Folder, X } from 'lucide-react'
import { useMemo, useState } from 'react'
import type { Evaluation } from '../../engine/types'
import { Badge } from '../../ui/kit'
import { renderInline } from '../../ui/inline'
import { STORAGE_CLASSES } from '../shared/storageClasses'
import type { BucketLabConfig, BucketLabResponse } from './lab'
import { bucketArn, displayName, formatBytes, listObjects, objectArn, s3Uri, virtualHostedUrl, type S3ObjectData } from './model'
import s from './bucket.module.css'

interface Props {
  config: BucketLabConfig
  value: BucketLabResponse
  onChange: (v: BucketLabResponse) => void
  disabled: boolean
  evaluation?: Evaluation | null
}

export function BucketLab({ config, value, onChange, disabled, evaluation }: Props) {
  const { bucket } = config
  const [prefix, setPrefix] = useState('')
  const [selectedKey, setSelectedKey] = useState<string | null>(null)
  const [showFullKeys, setShowFullKeys] = useState(false)
  const listing = useMemo(() => listObjects(bucket, prefix, '/'), [bucket, prefix])
  const selected = bucket.objects.find((o) => o.key === selectedKey) ?? null
  const status: Record<string, string> = {}
  for (const i of evaluation?.items ?? []) status[i.id] = i.status
  const selectTasks = config.tasks.filter((t) => t.type === 'select-object')

  const setAnswer = (taskId: string, answer: string) => onChange({ answers: { ...value.answers, [taskId]: answer } })
  const crumbs = prefix.split('/').filter(Boolean)

  return (
    <div className={s.lab}>
      <section className={s.explorer} aria-label={`Explorador do bucket ${bucket.name}`}>
        <header className={s.bucketHead}>
          <div>
            <div className={s.bucketName}>{bucket.name}</div>
            <div className={s.bucketMeta}>
              <Badge tone="info">Região: {bucket.region}</Badge>
              <Badge>{bucket.objects.length} objetos</Badge>
              <code>{bucketArn(bucket.name)}</code>
            </div>
          </div>
        </header>
        <nav className={s.crumbs} aria-label="Prefixo atual">
          <button type="button" onClick={() => setPrefix('')} aria-current={prefix === '' ? 'location' : undefined}>
            {bucket.name}
          </button>
          {crumbs.map((c, i) => {
            const p = `${crumbs.slice(0, i + 1).join('/')}/`
            return (
              <span key={p} className={s.crumb}>
                <ChevronRight size={14} aria-hidden="true" />
                <button type="button" onClick={() => setPrefix(p)} aria-current={p === prefix ? 'location' : undefined}>
                  {c}/
                </button>
              </span>
            )
          })}
        </nav>
        <div className={s.toolbar}>
          <span className="muted">
            Prefix=<code>{prefix || '""'}</code> · Delimiter=<code>/</code>
          </span>
          <label className={s.toggle}>
            <input type="checkbox" checked={showFullKeys} onChange={(e) => setShowFullKeys(e.target.checked)} />
            Mostrar keys completas
          </label>
        </div>
        <table className={s.table}>
          <thead>
            <tr>
              <th scope="col">Nome</th>
              <th scope="col">Tamanho</th>
              <th scope="col" className={s.hideSm}>
                Classe
              </th>
            </tr>
          </thead>
          <tbody>
            {listing.commonPrefixes.map((p) => (
              <tr key={p}>
                <td colSpan={3}>
                  <button type="button" className={s.rowBtn} onClick={() => setPrefix(p)}>
                    <Folder size={16} aria-hidden="true" className={s.folderIcon} />
                    <span>{showFullKeys ? p : p.slice(prefix.length)}</span>
                    <span className="sr-only">(prefixo, abrir)</span>
                  </button>
                </td>
              </tr>
            ))}
            {listing.contents.map((o) => (
              <tr key={o.key} aria-selected={o.key === selectedKey}>
                <td>
                  <button type="button" className={s.rowBtn} onClick={() => setSelectedKey(o.key)}>
                    <File size={16} aria-hidden="true" />
                    <span>{showFullKeys ? o.key : displayName(o.key)}</span>
                  </button>
                </td>
                <td>{formatBytes(o.sizeBytes)}</td>
                <td className={s.hideSm}>{STORAGE_CLASSES[o.storageClass].shortName}</td>
              </tr>
            ))}
            {listing.commonPrefixes.length + listing.contents.length === 0 && (
              <tr>
                <td colSpan={3} className="muted">
                  Nenhum objeto com este prefixo.
                </td>
              </tr>
            )}
          </tbody>
        </table>
        {selected ? (
          <ObjectDetails
            obj={selected}
            bucketName={bucket.name}
            region={bucket.region}
            onClose={() => setSelectedKey(null)}
            actions={
              !disabled &&
              selectTasks.map((t) => (
                <button key={t.id} type="button" className={s.markBtn} onClick={() => setAnswer(t.id, selected.key)}>
                  Marcar como resposta da tarefa {config.tasks.indexOf(t) + 1}
                </button>
              ))
            }
          />
        ) : (
          <p className={s.emptyDetails}>Selecione um objeto para ver propriedades, metadados e endereços.</p>
        )}
      </section>

      <section className={s.tasks} aria-label="Tarefas">
        <h3 className={s.tasksTitle}>Tarefas da equipe</h3>
        <ol className={s.taskList}>
          {config.tasks.map((t, idx) => {
            const st = status[t.id]
            const answer = value.answers[t.id] ?? ''
            return (
              <li key={t.id} className={s.task} data-status={st}>
                <div className={s.taskPrompt}>
                  <span className={s.taskNo}>{idx + 1}</span>
                  <span>{renderInline(t.prompt)}</span>
                  {st === 'correct' && <Check size={18} className={s.ok} aria-label="correta" />}
                  {(st === 'wrong' || st === 'missed') && <X size={18} className={s.bad} aria-label="incorreta" />}
                </div>
                {t.type === 'select-object' ? (
                  <div className={s.selectedAnswer}>
                    {answer ? (
                      <>
                        <code>{answer}</code>
                        {!disabled && (
                          <button type="button" className={s.clearBtn} onClick={() => setAnswer(t.id, '')}>
                            limpar
                          </button>
                        )}
                      </>
                    ) : (
                      <span className="muted">Abra o objeto no explorador e marque-o como resposta.</span>
                    )}
                  </div>
                ) : (
                  <input
                    type={t.type === 'count' ? 'number' : 'text'}
                    inputMode={t.type === 'count' ? 'numeric' : undefined}
                    min={t.type === 'count' ? 0 : undefined}
                    value={answer}
                    placeholder={t.type === 'text' ? t.placeholder : 'quantidade'}
                    disabled={disabled}
                    spellCheck={false}
                    autoCapitalize="off"
                    aria-label={`Resposta da tarefa ${idx + 1}`}
                    onChange={(e) => setAnswer(t.id, e.target.value)}
                  />
                )}
              </li>
            )
          })}
        </ol>
      </section>
    </div>
  )
}

function ObjectDetails({ obj, bucketName, region, onClose, actions }: { obj: S3ObjectData; bucketName: string; region: string; onClose: () => void; actions: React.ReactNode }) {
  const sc = STORAGE_CLASSES[obj.storageClass]
  return (
    <div className={s.details} aria-label={`Propriedades de ${obj.key}`} role="region">
      <div className={s.detailsHead}>
        <strong>{displayName(obj.key)}</strong>
        <button type="button" className={s.clearBtn} onClick={onClose}>
          fechar
        </button>
      </div>
      <dl className={s.props}>
        <dt>Object key</dt>
        <dd>
          <code>{obj.key}</code>
        </dd>
        <dt>Content-Length</dt>
        <dd>
          {formatBytes(obj.sizeBytes)} ({obj.sizeBytes.toLocaleString('pt-BR')} bytes)
        </dd>
        <dt>Content-Type</dt>
        <dd>
          <code>{obj.contentType}</code>
        </dd>
        <dt>Last-Modified</dt>
        <dd>{new Date(obj.lastModified).toLocaleString('pt-BR', { timeZone: 'UTC' })} UTC</dd>
        <dt>ETag</dt>
        <dd>
          <code>{obj.etag}</code>
        </dd>
        <dt>x-amz-storage-class</dt>
        <dd>{sc.name}</dd>
      </dl>
      <div className={s.metaGroups}>
        <div>
          <div className={s.metaTitle}>Metadados definidos pelo usuário</div>
          {obj.userMetadata && Object.keys(obj.userMetadata).length > 0 ? (
            <ul className={s.kv}>
              {Object.entries(obj.userMetadata).map(([k, v]) => (
                <li key={k}>
                  <code>
                    x-amz-meta-{k}: {v}
                  </code>
                </li>
              ))}
            </ul>
          ) : (
            <p className="muted">Nenhum.</p>
          )}
        </div>
        <div>
          <div className={s.metaTitle}>Tags</div>
          {obj.tags && Object.keys(obj.tags).length > 0 ? (
            <ul className={s.kv}>
              {Object.entries(obj.tags).map(([k, v]) => (
                <li key={k}>
                  <code>
                    {k}={v}
                  </code>
                </li>
              ))}
            </ul>
          ) : (
            <p className="muted">Nenhuma.</p>
          )}
        </div>
      </div>
      <div className={s.metaTitle}>Endereços</div>
      <dl className={s.props}>
        <dt>S3 URI</dt>
        <dd>
          <code>{s3Uri(bucketName, obj.key)}</code>
        </dd>
        <dt>ARN</dt>
        <dd>
          <code>{objectArn(bucketName, obj.key)}</code>
        </dd>
        <dt>URL</dt>
        <dd>
          <code>{virtualHostedUrl(bucketName, region, obj.key)}</code>
        </dd>
      </dl>
      {actions && <div className={s.markRow}>{actions}</div>}
    </div>
  )
}
