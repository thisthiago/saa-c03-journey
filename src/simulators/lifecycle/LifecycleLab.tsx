/** Interface do laboratório de lifecycle: editor de regras, régua de dias e custo mês a mês. */
import { CircleAlert, Plus, Trash2, TriangleAlert } from 'lucide-react'
import { useMemo } from 'react'
import type { Evaluation } from '../../engine/types'
import { Badge, Button } from '../../ui/kit'
import { formatUSD } from '../cost/model'
import { regionPrices } from '../cost/prices'
import { STORAGE_CLASSES } from '../shared/storageClasses'
import { costFirstMonths, runLifecycleLab, type LifecycleLabConfig, type LifecycleLabResponse } from './lab'
import { CLASS_COLOR, datasetMonthlyCosts, emptyRule, simulateAll, TRANSITION_TARGETS, type LifecycleRule, type SegmentState, type Transition } from './model'
import { lifecycleJson } from './json'
import s from './lifecycle.module.css'

interface Props {
  config: LifecycleLabConfig
  value: LifecycleLabResponse
  onChange: (v: LifecycleLabResponse) => void
  disabled: boolean
  evaluation?: Evaluation | null
}

const stateName = (st: SegmentState) => (st === 'gone' ? 'excluído' : STORAGE_CLASSES[st].shortName)

function DaysInput({ value, onChange, disabled, label }: { value: number; onChange: (n: number) => void; disabled: boolean; label: string }) {
  return (
    <input
      className={s.days}
      type="number"
      min={0}
      step={1}
      inputMode="numeric"
      value={Number.isFinite(value) ? value : 0}
      aria-label={label}
      disabled={disabled}
      onChange={(e) => onChange(Math.max(0, Math.floor(Number(e.target.value) || 0)))}
    />
  )
}

function TransitionList({ list, onChange, disabled, targets, title, dayLabel }: { list: Transition[]; onChange: (l: Transition[]) => void; disabled: boolean; targets: string[]; title: string; dayLabel: string }) {
  return (
    <fieldset className={s.group}>
      <legend>{title}</legend>
      {list.length === 0 && <p className={s.empty}>Nenhuma transição.</p>}
      {list.map((t, i) => (
        <div key={i} className={s.tRow}>
          <span>após</span>
          <DaysInput value={t.days} disabled={disabled} label={`${title} ${i + 1}: ${dayLabel}`} onChange={(days) => onChange(list.map((x, j) => (j === i ? { ...x, days } : x)))} />
          <span>dias →</span>
          <select aria-label={`${title} ${i + 1}: classe de destino`} value={t.storageClass} disabled={disabled} onChange={(e) => onChange(list.map((x, j) => (j === i ? { ...x, storageClass: e.target.value as Transition['storageClass'] } : x)))}>
            {targets.map((c) => (
              <option key={c} value={c}>
                {STORAGE_CLASSES[c as keyof typeof STORAGE_CLASSES].shortName}
              </option>
            ))}
          </select>
          <button type="button" className={s.icon} disabled={disabled} onClick={() => onChange(list.filter((_, j) => j !== i))} aria-label={`Remover ${title.toLowerCase()} ${i + 1}`}>
            <Trash2 size={14} aria-hidden="true" />
          </button>
        </div>
      ))}
      <button type="button" className={s.add} disabled={disabled} onClick={() => onChange([...list, { days: list.length ? Math.max(...list.map((x) => x.days)) + 90 : 30, storageClass: list.length ? 'GLACIER' : 'STANDARD_IA' }])}>
        <Plus size={14} aria-hidden="true" /> Transição
      </button>
    </fieldset>
  )
}

function OptionalDays({ label, value, onChange, disabled, defaultDays }: { label: string; value: number | undefined; onChange: (v: number | undefined) => void; disabled: boolean; defaultDays: number }) {
  return (
    <div className={s.opt}>
      <label>
        <input type="checkbox" checked={value !== undefined} disabled={disabled} onChange={(e) => onChange(e.target.checked ? defaultDays : undefined)} /> {label}
      </label>
      {value !== undefined && (
        <span className={s.tRow}>
          <span>após</span>
          <DaysInput value={value} onChange={onChange} disabled={disabled} label={`${label}: dias`} />
          <span>dias</span>
        </span>
      )}
    </div>
  )
}

function RuleEditor({ rule, onChange, onRemove, disabled, config }: { rule: LifecycleRule; onChange: (r: LifecycleRule) => void; onRemove: () => void; disabled: boolean; config: LifecycleLabConfig }) {
  const prefixes = Array.from(new Set(config.datasets.map((d) => (d.key.includes('/') ? d.key.slice(0, d.key.indexOf('/') + 1) : '')).filter(Boolean)))
  const tagPairs = Array.from(new Set(config.datasets.flatMap((d) => Object.entries(d.tags ?? {}).map(([k, v]) => `${k}=${v}`))))
  const targets = config.targets ?? TRANSITION_TARGETS
  const f = config.features
  const set = (patch: Partial<LifecycleRule>) => onChange({ ...rule, ...patch })
  return (
    <section className={s.rule} aria-label={`Regra ${rule.id}`} data-enabled={rule.enabled}>
      <div className={s.ruleHead}>
        <label className={s.idField}>
          <span>ID</span>
          <input value={rule.id} disabled={disabled} onChange={(e) => set({ id: e.target.value })} />
        </label>
        <label className={s.check}>
          <input type="checkbox" checked={rule.enabled} disabled={disabled} onChange={(e) => set({ enabled: e.target.checked })} /> Enabled
        </label>
        <button type="button" className={s.icon} disabled={disabled} onClick={onRemove} aria-label={`Excluir a regra ${rule.id}`}>
          <Trash2 size={16} aria-hidden="true" />
        </button>
      </div>

      <fieldset className={s.group}>
        <legend>Filtro</legend>
        <label className={s.inline}>
          <span>Prefixo</span>
          <select value={rule.filter.prefix ?? ''} disabled={disabled} onChange={(e) => set({ filter: { ...rule.filter, prefix: e.target.value || undefined } })}>
            <option value="">(todo o bucket)</option>
            {prefixes.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </label>
        {f.tags && tagPairs.length > 0 && (
          <div className={s.tags}>
            <span>Tags (todas precisam bater):</span>
            {tagPairs.map((pair) => {
              const [k, v] = pair.split('=')
              const on = rule.filter.tags?.[k] === v
              return (
                <label key={pair} className={s.check}>
                  <input
                    type="checkbox"
                    checked={on}
                    disabled={disabled}
                    onChange={(e) => {
                      const tags = { ...(rule.filter.tags ?? {}) }
                      if (e.target.checked) tags[k] = v
                      else delete tags[k]
                      set({ filter: { ...rule.filter, tags: Object.keys(tags).length ? tags : undefined } })
                    }}
                  />{' '}
                  <code>{pair}</code>
                </label>
              )
            })}
          </div>
        )}
        {f.size && (
          <div className={s.opt}>
            <label>
              <input
                type="checkbox"
                checked={rule.filter.sizeGreaterThanKB !== undefined}
                disabled={disabled}
                onChange={(e) => set({ filter: { ...rule.filter, sizeGreaterThanKB: e.target.checked ? 0 : undefined } })}
              />{' '}
              ObjectSizeGreaterThan
            </label>
            {rule.filter.sizeGreaterThanKB !== undefined && (
              <span className={s.tRow}>
                <DaysInput value={rule.filter.sizeGreaterThanKB} disabled={disabled} label="Tamanho mínimo em KB" onChange={(n) => set({ filter: { ...rule.filter, sizeGreaterThanKB: n } })} />
                <span>KB</span>
              </span>
            )}
          </div>
        )}
      </fieldset>

      <TransitionList title="Transições (versão atual)" dayLabel="dias após a criação" list={rule.transitions} targets={targets} disabled={disabled} onChange={(transitions) => set({ transitions })} />
      <OptionalDays label="Expiration (versão atual)" value={rule.expirationDays} defaultDays={365} disabled={disabled} onChange={(expirationDays) => set({ expirationDays })} />
      {f.noncurrent && (
        <>
          <TransitionList title="Transições (versões não atuais)" dayLabel="dias como não atual" list={rule.noncurrentTransitions} targets={targets} disabled={disabled} onChange={(noncurrentTransitions) => set({ noncurrentTransitions })} />
          <OptionalDays label="NoncurrentVersionExpiration" value={rule.noncurrentExpirationDays} defaultDays={30} disabled={disabled} onChange={(noncurrentExpirationDays) => set({ noncurrentExpirationDays })} />
        </>
      )}
      {f.mpu && <OptionalDays label="AbortIncompleteMultipartUpload" value={rule.abortMultipartDays} defaultDays={7} disabled={disabled} onChange={(abortMultipartDays) => set({ abortMultipartDays })} />}
      {f.deleteMarkers && (
        <label className={s.check}>
          <input type="checkbox" checked={Boolean(rule.expiredObjectDeleteMarker)} disabled={disabled} onChange={(e) => set({ expiredObjectDeleteMarker: e.target.checked || undefined })} /> ExpiredObjectDeleteMarker
        </label>
      )}
    </section>
  )
}

const TICKS = [0, 30, 90, 180, 365, 730]

export function LifecycleLab({ config, value, onChange, disabled }: Props) {
  const rules = useMemo(() => value.rules ?? [], [value.rules])
  const run = useMemo(() => runLifecycleLab(config, { rules }), [config, rules])
  const baseline = useMemo(() => {
    const res = simulateAll(config.datasets, [], config.horizonDays)
    const prices = regionPrices(config.region)
    return config.datasets.map((d, i) => datasetMonthlyCosts(d, res.sims[i], prices, Math.floor(config.horizonDays / 30)))
  }, [config])
  const months = Math.floor(config.horizonDays / 30)
  const monthTotals = Array.from({ length: months }, (_, m) => run.costs.reduce((a, l) => a + (l[m]?.total ?? 0), 0))
  const baseTotals = Array.from({ length: months }, (_, m) => baseline.reduce((a, l) => a + (l[m]?.total ?? 0), 0))
  const peak = Math.max(...monthTotals, ...baseTotals, 0.0001)
  const errors = run.issues.filter((i) => i.severity === 'error')
  const warnings = run.issues.filter((i) => i.severity === 'warning')
  const horizon = config.horizonDays
  const ticks = TICKS.filter((t) => t <= horizon && !(t === 30 && horizon > 365))
  const nextId = () => {
    let n = rules.length + 1
    while (rules.some((r) => r.id === `regra-${n}`)) n++
    return `regra-${n}`
  }

  return (
    <div className={s.lab}>
      <div className={s.head}>
        <code>{config.bucketName}</code>
        <Badge>{regionPrices(config.region).label}</Badge>
        <Badge tone="info">{rules.length} regra(s)</Badge>
      </div>

      <div className={s.columns}>
        <div className={s.col}>
          {rules.map((r, i) => (
            <RuleEditor
              key={i}
              rule={r}
              config={config}
              disabled={disabled}
              onChange={(nr) => onChange({ rules: rules.map((x, j) => (j === i ? nr : x)) })}
              onRemove={() => onChange({ rules: rules.filter((_, j) => j !== i) })}
            />
          ))}
          <Button variant="secondary" disabled={disabled} onClick={() => onChange({ rules: [...rules, emptyRule(nextId())] })}>
            <Plus size={16} aria-hidden="true" /> Adicionar regra
          </Button>
          <details className={s.json}>
            <summary>Ver a configuração em JSON (formato da AWS CLI)</summary>
            <pre>{lifecycleJson(rules)}</pre>
          </details>
        </div>

        <div className={s.col}>
          <div aria-live="polite">
            {errors.length > 0 ? (
              <div className={s.errors} role="alert">
                <strong>
                  <CircleAlert size={16} aria-hidden="true" /> PutBucketLifecycleConfiguration rejeitado — nenhuma regra vale até corrigir:
                </strong>
                <ul>
                  {errors.map((e, i) => (
                    <li key={i}>
                      <code>{e.ruleId}</code> {e.message}
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <div className={s.ok}>{rules.length === 0 ? 'Nenhuma regra: tudo fica no S3 Standard para sempre.' : 'Configuração aceita pelo S3.'}</div>
            )}
            {warnings.length > 0 && (
              <ul className={s.warnings}>
                {warnings.map((w, i) => (
                  <li key={i}>
                    <TriangleAlert size={14} aria-hidden="true" /> <code>{w.ruleId}</code> {w.message}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <section className={s.panel} aria-label="Linha do tempo">
            <h4 className={s.panelTitle}>Régua de dias (0 a {horizon})</h4>
            {config.datasets.map((d, i) => {
              const sim = run.sims[i]
              return (
                <div key={d.id} className={s.track}>
                  <div className={s.trackHead}>
                    <strong>{d.name}</strong> <code className={s.key}>{d.key}</code>
                    {d.tags && Object.entries(d.tags).map(([k, v]) => <Badge key={k}>{`${k}=${v}`}</Badge>)}
                  </div>
                  <div className={s.bar} aria-hidden="true">
                    {sim.segments.map((seg, j) => (
                      <span
                        key={j}
                        className={s.seg}
                        data-gone={seg.state === 'gone'}
                        data-noncurrent={seg.noncurrent}
                        style={{ left: `${(seg.from / horizon) * 100}%`, width: `${((seg.to - seg.from) / horizon) * 100}%`, background: CLASS_COLOR[seg.state] }}
                        title={`${seg.from}–${seg.to - 1}: ${stateName(seg.state)}`}
                      />
                    ))}
                  </div>
                  <p className={s.trackText}>
                    {sim.segments.map((seg, j) => (
                      <span key={j}>
                        {j > 0 && ' · '}dias {seg.from}–{seg.to - 1}: <strong>{stateName(seg.state)}</strong>
                        {seg.noncurrent && seg.state !== 'gone' ? ' (não atual)' : ''}
                      </span>
                    ))}
                  </p>
                  {sim.events.filter((e) => e.kind === 'note' || e.kind === 'early-delete').map((e, j) => (
                    <p key={j} className={s.note}>
                      {e.kind === 'early-delete' ? <TriangleAlert size={12} aria-hidden="true" /> : null} {e.text}
                    </p>
                  ))}
                </div>
              )
            })}
            <div className={s.axis} aria-hidden="true">
              {ticks.map((t) => (
                <span key={t} style={{ left: `${(t / horizon) * 100}%` }}>
                  {t}
                </span>
              ))}
            </div>
            <ul className={s.legend} aria-label="Legenda">
              {(['STANDARD', ...(config.targets ?? TRANSITION_TARGETS)] as SegmentState[]).map((c) => (
                <li key={c}>
                  <span style={{ background: CLASS_COLOR[c] }} /> {stateName(c)}
                </li>
              ))}
            </ul>
          </section>

          <section className={s.panel} aria-label="Custo mês a mês">
            <h4 className={s.panelTitle}>Custo mês a mês (estimativa)</h4>
            <p className={s.totals}>
              12 meses: <strong>{formatUSD(costFirstMonths(run.costs, 12))}</strong> com as regras · {formatUSD(costFirstMonths(baseline, 12))} sem regras
            </p>
            <div className={s.chart} role="img" aria-label={`Custo mensal com regras: ${monthTotals.slice(0, 12).map((v, i) => `mês ${i + 1} ${formatUSD(v)}`).join(', ')}`}>
              {monthTotals.map((v, m) => (
                <div key={m} className={s.col2}>
                  <span className={s.base} style={{ height: `${(baseTotals[m] / peak) * 100}%` }} />
                  <span className={s.with} style={{ height: `${(v / peak) * 100}%` }} />
                </div>
              ))}
            </div>
            <p className={s.legendLine}>
              <span className={s.swWith} /> com as regras <span className={s.swBase} /> sem regras
            </p>
          </section>

          <details className={s.simp}>
            <summary>Simplificações deste simulador</summary>
            <ul>
              <li>Cada conjunto é uma coorte criada no dia 0; as ações ocorrem no dia exato (na AWS, a execução é assíncrona, a partir da meia-noite UTC seguinte).</li>
              <li>Meses de 30 dias; preços da tabela versionada, primeira faixa, sem nível gratuito.</li>
              <li>NewerNoncurrentVersions e regras por data não são simulados.</li>
            </ul>
          </details>
        </div>
      </div>
    </div>
  )
}
