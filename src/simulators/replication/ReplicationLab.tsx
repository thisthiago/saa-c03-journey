/** Interface do laboratório de replicação: pré-requisitos, regras e resultado por cenário. */
import { ArrowRight, Ban, Check, CircleAlert, Clock, Minus, Plus, Trash2 } from 'lucide-react'
import { useMemo } from 'react'
import type { Evaluation } from '../../engine/types'
import { Badge, Button } from '../../ui/kit'
import { STORAGE_CLASSES, type StorageClassId } from '../shared/storageClasses'
import { applyReplication, type ReplicationLabConfig, type ReplicationLabResponse } from './lab'
import { replicate, replicationType, validateReplication, type BucketVersioning, type ReplicaKey, type ReplRule } from './model'
import s from './replication.module.css'

interface Props {
  config: ReplicationLabConfig
  value: ReplicationLabResponse
  onChange: (v: ReplicationLabResponse) => void
  disabled: boolean
  evaluation?: Evaluation | null
}

const VERSIONING: { v: BucketVersioning; label: string }[] = [
  { v: 'Unversioned', label: 'Sem versionamento' },
  { v: 'Enabled', label: 'Habilitado' },
  { v: 'Suspended', label: 'Suspenso' },
]
const REPLICA_CLASSES: StorageClassId[] = ['STANDARD', 'STANDARD_IA', 'ONEZONE_IA', 'INTELLIGENT_TIERING', 'GLACIER_IR', 'GLACIER', 'DEEP_ARCHIVE']
const KEYS: { v: ReplicaKey; label: string }[] = [
  { v: 'dest-customer', label: 'Chave do cliente na Região de destino' },
  { v: 'source-region-customer', label: 'Chave do cliente na Região de origem' },
  { v: 'aws-managed', label: 'Chave gerenciada pela AWS (aws/s3)' },
]

function RuleCard({ rule, onChange, onRemove, config, disabled }: { rule: ReplRule; onChange: (r: ReplRule) => void; onRemove: () => void; config: ReplicationLabConfig; disabled: boolean }) {
  const set = (p: Partial<ReplRule>) => onChange({ ...rule, ...p })
  const toggle = (label: string, checked: boolean, on: (v: boolean) => void, help?: string) => (
    <label className={s.check}>
      <input type="checkbox" checked={checked} disabled={disabled} onChange={(e) => on(e.target.checked)} />
      <span>
        {label}
        {help && <small>{help}</small>}
      </span>
    </label>
  )
  return (
    <section className={s.rule} aria-label={`Regra ${rule.id}`}>
      <div className={s.ruleHead}>
        <code>{rule.id}</code>
        {toggle('Enabled', rule.enabled, (enabled) => set({ enabled }))}
        <button type="button" className={s.icon} disabled={disabled} onClick={onRemove} aria-label={`Excluir a regra ${rule.id}`}>
          <Trash2 size={14} aria-hidden="true" />
        </button>
      </div>
      <div className={s.grid}>
        <label>
          <span>Destino</span>
          <select value={rule.destination} disabled={disabled} onChange={(e) => set({ destination: e.target.value })}>
            {config.setup.destinations.map((d) => (
              <option key={d.name} value={d.name}>
                {d.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span>Filtro por prefixo</span>
          <select value={rule.prefix ?? ''} disabled={disabled} onChange={(e) => set({ prefix: e.target.value || undefined })}>
            <option value="">(todo o bucket)</option>
            {config.prefixes.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span>Classe das réplicas</span>
          <select value={rule.storageClass ?? ''} disabled={disabled} onChange={(e) => set({ storageClass: (e.target.value || undefined) as StorageClassId | undefined })}>
            <option value="">Mesma da origem</option>
            {REPLICA_CLASSES.map((c) => (
              <option key={c} value={c}>
                {STORAGE_CLASSES[c].shortName}
              </option>
            ))}
          </select>
        </label>
      </div>
      {toggle('Delete marker replication', rule.deleteMarkerReplication, (deleteMarkerReplication) => set({ deleteMarkerReplication }), 'Replica DELETEs simples (delete markers).')}
      {toggle('Replication Time Control (RTC)', rule.rtc, (rtc) => set({ rtc }), 'SLA: 99,9% dos objetos em até 15 minutos.')}
      {toggle('Replicar objetos SSE-KMS', rule.replicateKms, (replicateKms) => set({ replicateKms, replicaKey: replicateKms ? (rule.replicaKey ?? 'dest-customer') : undefined }), 'SourceSelectionCriteria › SseKmsEncryptedObjects.')}
      {rule.replicateKms && (
        <label className={s.inline}>
          <span>Chave KMS das réplicas</span>
          <select value={rule.replicaKey} disabled={disabled} onChange={(e) => set({ replicaKey: e.target.value as ReplicaKey })}>
            {KEYS.map((k) => (
              <option key={k.v} value={k.v}>
                {k.label}
              </option>
            ))}
          </select>
        </label>
      )}
    </section>
  )
}

export function ReplicationLab({ config, value, onChange, disabled }: Props) {
  const setup = useMemo(() => applyReplication(config, value), [config, value])
  const issues = validateReplication(setup)
  const ed = config.editable
  const src = setup.source

  return (
    <div className={s.lab}>
      <div className={s.diagram} aria-label="Topologia">
        <div className={s.node}>
          <strong>{src.name}</strong>
          <span>{src.region}</span>
          <span>conta {src.account}</span>
          <Badge tone={src.versioning === 'Enabled' ? 'success' : 'danger'}>versionamento: {VERSIONING.find((v) => v.v === src.versioning)?.label}</Badge>
        </div>
        <div className={s.dests}>
          {setup.destinations.map((d) => {
            const active = setup.rules.some((r) => r.enabled && r.destination === d.name)
            return (
              <div key={d.name} className={s.link}>
                <span className={s.arrow} data-active={active}>
                  <ArrowRight size={18} aria-hidden="true" /> {replicationType(setup, d.name)}
                  {setup.rules.some((r) => r.enabled && r.destination === d.name && r.rtc) && (
                    <Badge tone="info">
                      <Clock size={12} aria-hidden="true" /> RTC
                    </Badge>
                  )}
                </span>
                <div className={s.node}>
                  <strong>{d.name}</strong>
                  <span>{d.region}</span>
                  <span>conta {d.account}{d.account !== src.account ? ' (outra conta)' : ''}</span>
                  <Badge tone={d.versioning === 'Enabled' ? 'success' : 'danger'}>versionamento: {VERSIONING.find((v) => v.v === d.versioning)?.label}</Badge>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <div className={s.columns}>
        <div className={s.col}>
          <section className={s.panel} aria-label="Pré-requisitos">
            <h4 className={s.panelTitle}>Pré-requisitos</h4>
            {ed.sourceVersioning && (
              <label className={s.inline}>
                <span>Versionamento da origem</span>
                <select value={value.sourceVersioning} disabled={disabled} onChange={(e) => onChange({ ...value, sourceVersioning: e.target.value as BucketVersioning })}>
                  {VERSIONING.map((v) => (
                    <option key={v.v} value={v.v}>
                      {v.label}
                    </option>
                  ))}
                </select>
              </label>
            )}
            {ed.destVersioning &&
              config.setup.destinations.map((d) => (
                <label key={d.name} className={s.inline}>
                  <span>Versionamento de {d.name}</span>
                  <select value={value.destVersioning[d.name]} disabled={disabled} onChange={(e) => onChange({ ...value, destVersioning: { ...value.destVersioning, [d.name]: e.target.value as BucketVersioning } })}>
                    {VERSIONING.map((v) => (
                      <option key={v.v} value={v.v}>
                        {v.label}
                      </option>
                    ))}
                  </select>
                </label>
              ))}
            {ed.role && (
              <fieldset className={s.group}>
                <legend>Papel IAM de replicação</legend>
                {(
                  [
                    ['s3', 's3:GetObjectVersionForReplication + s3:ReplicateObject/ReplicateDelete'],
                    ['kmsDecrypt', 'kms:Decrypt na chave da origem'],
                    ['kmsEncrypt', 'kms:Encrypt na chave das réplicas'],
                  ] as const
                ).map(([k, label]) => (
                  <label key={k} className={s.check}>
                    <input type="checkbox" checked={value.role[k]} disabled={disabled} onChange={(e) => onChange({ ...value, role: { ...value.role, [k]: e.target.checked } })} />
                    <span>
                      <code>{label}</code>
                    </span>
                  </label>
                ))}
              </fieldset>
            )}
            {ed.destPolicy &&
              config.setup.destinations
                .filter((d) => d.account !== src.account)
                .map((d) => (
                  <label key={d.name} className={s.check}>
                    <input type="checkbox" checked={Boolean(value.destPolicy[d.name])} disabled={disabled} onChange={(e) => onChange({ ...value, destPolicy: { ...value.destPolicy, [d.name]: e.target.checked } })} />
                    <span>
                      Bucket policy de {d.name} permite a replicação da conta {src.account}
                      <small>Exigência quando o destino é de outra conta.</small>
                    </span>
                  </label>
                ))}
          </section>

          {value.rules.map((r, i) => (
            <RuleCard
              key={i}
              rule={r}
              config={config}
              disabled={disabled || !ed.rules}
              onChange={(nr) => onChange({ ...value, rules: value.rules.map((x, j) => (j === i ? nr : x)) })}
              onRemove={() => onChange({ ...value, rules: value.rules.filter((_, j) => j !== i) })}
            />
          ))}
          {ed.rules && (
            <Button
              variant="secondary"
              disabled={disabled}
              onClick={() =>
                onChange({
                  ...value,
                  rules: [...value.rules, { id: `regra-${value.rules.length + 1}`, enabled: true, destination: config.setup.destinations[0].name, deleteMarkerReplication: false, rtc: false, replicateKms: false }],
                })
              }
            >
              <Plus size={16} aria-hidden="true" /> Adicionar regra
            </Button>
          )}
        </div>

        <div className={s.col}>
          <div aria-live="polite">
            {issues.length > 0 ? (
              <div className={s.errors} role="alert">
                <strong>
                  <CircleAlert size={16} aria-hidden="true" /> PutBucketReplication rejeitado:
                </strong>
                <ul>
                  {issues.map((x, i) => (
                    <li key={i}>
                      {x.ruleId && <code>{x.ruleId}</code>} {x.message}
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <div className={s.ok}>Configuração de replicação aceita.</div>
            )}
          </div>
          <section className={s.panel} aria-label="Cenários">
            <h4 className={s.panelTitle}>O que acontece em cada cenário</h4>
            <ul className={s.events}>
              {config.events.map((ev) => (
                <li key={ev.id}>
                  <div className={s.evHead}>
                    <strong>{ev.label}</strong>
                    <code>{ev.key}</code>
                    {ev.encryption && <Badge>{ev.encryption}</Badge>}
                  </div>
                  {setup.destinations.map((d) => {
                    const res = replicate(setup, ev, d.name)
                    return (
                      <div key={d.name} className={s.result} data-status={res.status}>
                        <span className={s.pill}>
                          {res.status === 'COMPLETED' ? <Check size={14} aria-hidden="true" /> : res.status === 'FAILED' ? <Ban size={14} aria-hidden="true" /> : <Minus size={14} aria-hidden="true" />}
                          {res.status === 'NOT_REPLICATED' ? 'não replicado' : res.status}
                        </span>
                        <span>
                          <span className={s.dest}>{d.name}:</span> {res.reason}
                          {res.replicaClass && ` Classe: ${STORAGE_CLASSES[res.replicaClass].shortName}.`}
                        </span>
                      </div>
                    )
                  })}
                </li>
              ))}
            </ul>
          </section>
          <details className={s.simp}>
            <summary>Simplificações deste simulador</summary>
            <ul>
              <li>O tempo não é simulado: o RTC aparece como o SLA publicado.</li>
              <li>As permissões do papel de replicação e a bucket policy do destino aparecem como caixas de seleção, não como políticas completas.</li>
              <li>Prioridades entre regras sobrepostas e Batch Replication não são simuladas.</li>
            </ul>
          </details>
        </div>
      </div>
    </div>
  )
}
