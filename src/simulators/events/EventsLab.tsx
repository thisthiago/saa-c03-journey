/** Interface do laboratório de eventos: destinos, notificações, EventBridge e fluxo de cada evento. */
import { CircleAlert, Plus, RefreshCw, Trash2, Zap } from 'lucide-react'
import { useMemo } from 'react'
import type { Evaluation } from '../../engine/types'
import { Badge, Button } from '../../ui/kit'
import { destinationsWith, type EventsLabConfig, type EventsLabResponse } from './lab'
import { KIND_LABEL, runFlow, validateEvents, type EbRule, type EventTypeSel, type Notification } from './model'
import s from './events.module.css'

interface Props {
  config: EventsLabConfig
  value: EventsLabResponse
  onChange: (v: EventsLabResponse) => void
  disabled: boolean
  evaluation?: Evaluation | null
}

const TYPES: EventTypeSel[] = ['ObjectCreated:*', 'ObjectCreated:Put', 'ObjectCreated:CompleteMultipartUpload', 'ObjectRemoved:*']

export function EventsLab({ config, value, onChange, disabled }: Props) {
  const dests = useMemo(() => destinationsWith(config, value), [config, value])
  const c = value.config
  const issues = validateEvents(c, dests)
  const setConfig = (patch: Partial<typeof c>) => onChange({ ...value, config: { ...c, ...patch } })
  const setN = (i: number, patch: Partial<Notification>) => setConfig({ notifications: c.notifications.map((n, j) => (j === i ? { ...n, ...patch } : n)) })
  const setR = (i: number, patch: Partial<EbRule>) => setConfig({ ebRules: c.ebRules.map((r, j) => (j === i ? { ...r, ...patch } : r)) })
  const notifDests = dests
  const nextId = (prefix: string, list: { id: string }[]) => {
    let n = list.length + 1
    while (list.some((x) => x.id === `${prefix}-${n}`)) n++
    return `${prefix}-${n}`
  }

  return (
    <div className={s.lab}>
      <div className={s.columns}>
        <div className={s.col}>
          <section className={s.panel} aria-label="Destinos">
            <h4 className={s.panelTitle}>Destinos disponíveis</h4>
            <ul className={s.dests}>
              {dests.map((d) => (
                <li key={d.id}>
                  <div>
                    <strong>{d.name}</strong> <Badge tone={d.kind === 'sqs-fifo' ? 'warning' : undefined}>{KIND_LABEL[d.kind]}</Badge>
                    {d.writes && <small>Grava {d.writes.prefix}… no bucket {config.bucketName}</small>}
                    {d.subscribers && <small>Assinantes: {d.subscribers.map((x) => dests.find((y) => y.id === x)?.name).join(', ')}</small>}
                  </div>
                  {config.editablePermissions ? (
                    <label className={s.check}>
                      <input type="checkbox" checked={d.allowsS3} disabled={disabled} onChange={(e) => onChange({ ...value, permissions: { ...value.permissions, [d.id]: e.target.checked } })} />
                      <span>Política de recurso permite o S3</span>
                    </label>
                  ) : (
                    <small className={d.allowsS3 ? s.okText : s.badText}>{d.allowsS3 ? 'Permite o S3' : 'Não permite o S3'}</small>
                  )}
                </li>
              ))}
            </ul>
          </section>

          <section className={s.panel} aria-label="Event Notifications">
            <h4 className={s.panelTitle}>Event Notifications do bucket {config.bucketName}</h4>
            {c.notifications.length === 0 && <p className="muted">Nenhuma notificação.</p>}
            {c.notifications.map((n, i) => (
              <div key={i} className={s.item}>
                <div className={s.itemHead}>
                  <code>{n.id}</code>
                  <button type="button" className={s.icon} disabled={disabled} onClick={() => setConfig({ notifications: c.notifications.filter((_, j) => j !== i) })} aria-label={`Excluir a notificação ${n.id}`}>
                    <Trash2 size={14} aria-hidden="true" />
                  </button>
                </div>
                <fieldset className={s.types}>
                  <legend>Tipos de evento</legend>
                  {TYPES.map((t) => (
                    <label key={t} className={s.check}>
                      <input type="checkbox" checked={n.events.includes(t)} disabled={disabled} onChange={(e) => setN(i, { events: e.target.checked ? [...n.events, t] : n.events.filter((x) => x !== t) })} />
                      <code>s3:{t}</code>
                    </label>
                  ))}
                </fieldset>
                <div className={s.grid}>
                  <label>
                    <span>Prefixo</span>
                    <input value={n.prefix ?? ''} disabled={disabled} placeholder="(nenhum)" onChange={(e) => setN(i, { prefix: e.target.value || undefined })} />
                  </label>
                  <label>
                    <span>Sufixo</span>
                    <input value={n.suffix ?? ''} disabled={disabled} placeholder="(nenhum)" onChange={(e) => setN(i, { suffix: e.target.value || undefined })} />
                  </label>
                  <label>
                    <span>Destino</span>
                    <select value={n.destination} disabled={disabled} onChange={(e) => setN(i, { destination: e.target.value })}>
                      {notifDests.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.name}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
              </div>
            ))}
            <Button variant="secondary" size="small" disabled={disabled} onClick={() => setConfig({ notifications: [...c.notifications, { id: nextId('notificacao', c.notifications), events: ['ObjectCreated:*'], destination: dests[0].id }] })}>
              <Plus size={14} aria-hidden="true" /> Notificação
            </Button>
          </section>

          {config.allowEventBridge && (
            <section className={s.panel} aria-label="EventBridge">
              <h4 className={s.panelTitle}>Amazon EventBridge</h4>
              <label className={s.check}>
                <input type="checkbox" checked={c.eventBridge} disabled={disabled} onChange={(e) => setConfig({ eventBridge: e.target.checked })} />
                <span>Enviar os eventos do bucket ao EventBridge</span>
              </label>
              {c.eventBridge && (
                <>
                  {c.ebRules.map((r, i) => (
                    <div key={i} className={s.item}>
                      <div className={s.itemHead}>
                        <code>{r.id}</code>
                        <button type="button" className={s.icon} disabled={disabled} onClick={() => setConfig({ ebRules: c.ebRules.filter((_, j) => j !== i) })} aria-label={`Excluir a regra ${r.id}`}>
                          <Trash2 size={14} aria-hidden="true" />
                        </button>
                      </div>
                      <div className={s.grid}>
                        <label>
                          <span>detail-type</span>
                          <select value={r.eventType} disabled={disabled} onChange={(e) => setR(i, { eventType: e.target.value as EbRule['eventType'] })}>
                            <option value="created">Object Created</option>
                            <option value="removed">Object Deleted</option>
                          </select>
                        </label>
                        <label>
                          <span>Prefixo da key</span>
                          <input value={r.prefix ?? ''} disabled={disabled} placeholder="(nenhum)" onChange={(e) => setR(i, { prefix: e.target.value || undefined })} />
                        </label>
                        <label>
                          <span>Sufixo da key</span>
                          <input value={r.suffix ?? ''} disabled={disabled} placeholder="(nenhum)" onChange={(e) => setR(i, { suffix: e.target.value || undefined })} />
                        </label>
                      </div>
                      <fieldset className={s.types}>
                        <legend>Alvos</legend>
                        {dests.map((d) => (
                            <label key={d.id} className={s.check}>
                              <input type="checkbox" checked={r.targets.includes(d.id)} disabled={disabled} onChange={(e) => setR(i, { targets: e.target.checked ? [...r.targets, d.id] : r.targets.filter((x) => x !== d.id) })} />
                              <span>{d.name}</span>
                            </label>
                          ))}
                      </fieldset>
                    </div>
                  ))}
                  <Button variant="secondary" size="small" disabled={disabled} onClick={() => setConfig({ ebRules: [...c.ebRules, { id: nextId('regra', c.ebRules), eventType: 'created', targets: [] }] })}>
                    <Plus size={14} aria-hidden="true" /> Regra do EventBridge
                  </Button>
                </>
              )}
            </section>
          )}
        </div>

        <div className={s.col}>
          <div aria-live="polite">
            {issues.length > 0 ? (
              <div className={s.errors} role="alert">
                <strong>
                  <CircleAlert size={16} aria-hidden="true" /> PutBucketNotificationConfiguration rejeitado:
                </strong>
                <ul>
                  {issues.map((x, i) => (
                    <li key={i}>
                      {x.id && <code>{x.id}</code>} {x.message}
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <div className={s.ok}>Configuração aceita.</div>
            )}
          </div>
          <section className={s.panel} aria-label="Fluxo dos eventos">
            <h4 className={s.panelTitle}>
              <Zap size={16} aria-hidden="true" /> Fluxo de cada evento
            </h4>
            {config.events.map((ev) => {
              const f = runFlow(c, dests, ev)
              return (
                <div key={ev.id} className={s.flow} data-loop={f.loop}>
                  <div className={s.flowHead}>
                    <strong>{ev.label}</strong>
                    <code>{ev.key}</code>
                    {f.loop && (
                      <Badge tone="danger">
                        <RefreshCw size={12} aria-hidden="true" /> loop
                      </Badge>
                    )}
                  </div>
                  {f.deliveries.length === 0 && issues.length === 0 && <p className="muted">Nenhum destino recebe este evento.</p>}
                  <ol className={s.steps}>
                    {f.steps.map((st, i) => (
                      <li key={i} style={{ paddingLeft: `${(st.length - st.trimStart().length) * 6}px` }}>
                        {st.trim()}
                      </li>
                    ))}
                  </ol>
                </div>
              )
            })}
          </section>
          <details className={s.simp}>
            <summary>Simplificações deste simulador</summary>
            <ul>
              <li>Cada evento é entregue uma vez e na hora; na AWS a entrega é "pelo menos uma vez", em geral em segundos, e pode haver duplicatas.</li>
              <li>Com EventBridge habilitado, todos os eventos do bucket vão para o barramento padrão; as permissões dos alvos do EventBridge não são simuladas.</li>
              <li>A cadeia de eventos é interrompida depois de 4 níveis para mostrar o loop.</li>
            </ul>
          </details>
        </div>
      </div>
    </div>
  )
}
