/**
 * Interfaces dos tipos de atividade genéricos. Cada interface é controlada:
 * recebe a resposta (`value`) e devolve alterações por `onChange`.
 */
import { ArrowDown, ArrowUp, Check, GripVertical } from 'lucide-react'
import { useMemo, useRef, useState, type ReactNode } from 'react'
import type { Evaluation } from '../engine/types'
import { Paragraphs } from '../ui/RichText'
import { renderInline } from '../ui/inline'
import type {
  DecisionResponse,
  EstimateResponse,
  InvestigateResponse,
  OrderResponse,
  PlacementResponse,
  PredictResponse,
} from './evaluate'
import { PlacementBoard } from './shared/PlacementBoard'
import s from './shared/shared.module.css'
import { shuffled, statusMap } from './shared/util'
import type {
  ClassifyActivity,
  DecisionActivity,
  EstimateActivity,
  InvestigateActivity,
  MatchActivity,
  OrderActivity,
  PredictActivity,
} from './types'

export interface ViewProps<A, R> {
  activity: A
  value: R
  onChange: (value: R) => void
  disabled: boolean
  evaluation?: Evaluation | null
  /** Semente para embaralhar opções a cada tentativa. */
  seed: string
}

function Scenario({ lines }: { lines?: string[] }) {
  if (!lines?.length) return null
  return <Paragraphs items={lines} className={s.scenario} />
}

export function Option({
  checked,
  multi,
  disabled,
  status,
  onSelect,
  children,
  note,
}: {
  checked: boolean
  multi?: boolean
  disabled: boolean
  status?: string
  onSelect: () => void
  children: ReactNode
  note?: ReactNode
}) {
  return (
    <button type="button" role={multi ? 'checkbox' : 'radio'} aria-checked={checked} data-multi={multi} data-status={status} className={s.option} disabled={disabled} onClick={onSelect}>
      <span className={s.optionMark}>{checked && <Check size={14} strokeWidth={3} />}</span>
      <span className={s.optionText}>
        {children}
        {note && <span className={s.optionNote}>{note}</span>}
      </span>
    </button>
  )
}

// --- decision ---------------------------------------------------------------

export function DecisionView({ activity, value, onChange, disabled, evaluation, seed }: ViewProps<DecisionActivity, DecisionResponse>) {
  const options = useMemo(() => shuffled(activity.options, seed), [activity.options, seed])
  const status = statusMap(evaluation)
  const toggle = (id: string) => {
    if (activity.multiple) {
      const set = new Set(value.selected)
      if (set.has(id)) set.delete(id)
      else set.add(id)
      onChange({ ...value, selected: [...set] })
    } else onChange({ ...value, selected: [id] })
  }
  const chosen = value.selected.length > 0
  return (
    <div>
      <Scenario lines={activity.scenario} />
      <div className={s.options} role={activity.multiple ? 'group' : 'radiogroup'} aria-label="Opções">
        {options.map((o) => (
          <Option
            key={o.id}
            checked={value.selected.includes(o.id)}
            multi={activity.multiple}
            disabled={disabled}
            status={evaluation ? status[o.id] : undefined}
            onSelect={() => toggle(o.id)}
            note={evaluation && status[o.id] ? renderInline(o.consequence) : undefined}
          >
            {renderInline(o.text)}
          </Option>
        ))}
      </div>
      {activity.justification && (chosen || evaluation) && (
        <div className="anim-fade-up">
          <p className={s.sectionLabel}>{activity.justification.prompt}</p>
          <div className={s.options} role="radiogroup" aria-label="Justificativa">
            {activity.justification.options.map((j) => (
              <Option
                key={j.id}
                checked={value.justification === j.id}
                disabled={disabled}
                status={evaluation ? (j.correct ? (value.justification === j.id ? 'correct' : 'missed') : value.justification === j.id ? 'wrong' : undefined) : undefined}
                onSelect={() => onChange({ ...value, justification: j.id })}
                note={evaluation && (j.correct || value.justification === j.id) ? j.feedback : undefined}
              >
                {renderInline(j.text)}
              </Option>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// --- classify / match --------------------------------------------------------

export function ClassifyView({ activity, value, onChange, disabled, evaluation, seed }: ViewProps<ClassifyActivity, PlacementResponse>) {
  const items = useMemo(() => shuffled(activity.items, seed).map((i) => ({ id: i.id, text: i.text })), [activity.items, seed])
  const status = evaluation ? statusMap(evaluation) : undefined
  return (
    <PlacementBoard
      items={items}
      targets={activity.bins}
      placements={value.placements}
      onChange={(placements) => onChange({ placements })}
      disabled={disabled}
      itemStatus={status as Record<string, 'correct' | 'wrong'> | undefined}
    />
  )
}

export function MatchView({ activity, value, onChange, disabled, evaluation, seed }: ViewProps<MatchActivity, PlacementResponse>) {
  const items = useMemo(() => shuffled(activity.pairs, seed).map((p) => ({ id: p.id, text: p.left })), [activity.pairs, seed])
  const targets = useMemo(() => shuffled(activity.pairs, `${seed}:r`).map((p) => ({ id: p.id, label: p.right, capacity: 1 })), [activity.pairs, seed])
  const status = evaluation ? statusMap(evaluation) : undefined
  return (
    <PlacementBoard
      items={items}
      targets={targets}
      placements={value.placements}
      onChange={(placements) => onChange({ placements })}
      disabled={disabled}
      itemStatus={status as Record<string, 'correct' | 'wrong'> | undefined}
      poolLabel={activity.leftLabel}
      layout="pairs"
    />
  )
}

// --- order -------------------------------------------------------------------

export function OrderView({ activity, value, onChange, disabled, evaluation }: ViewProps<OrderActivity, OrderResponse>) {
  const byId = new Map(activity.steps.map((st) => [st.id, st]))
  const [dragId, setDragId] = useState<string | null>(null)
  const [announce, setAnnounce] = useState('')
  const listRef = useRef<HTMLOListElement>(null)
  const move = (from: number, to: number) => {
    if (to < 0 || to >= value.order.length) return
    const next = [...value.order]
    const [it] = next.splice(from, 1)
    next.splice(to, 0, it)
    onChange({ order: next })
    setAnnounce(`${byId.get(it)?.text ?? ''} agora na posição ${to + 1}.`)
  }
  const status = statusMap(evaluation)
  return (
    <>
      <ol className={s.orderList} ref={listRef}>
        {value.order.map((id, idx) => (
          <li
            key={id}
            className={s.orderItem}
            data-status={evaluation ? (status[id] === 'correct' && activity.steps[idx]?.id === id ? 'correct' : 'wrong') : undefined}
            onPointerEnter={() => {
              if (dragId && dragId !== id) move(value.order.indexOf(dragId), idx)
            }}
          >
            <span
              className={s.iconBtn}
              style={{ cursor: disabled ? 'default' : 'grab', touchAction: 'none' }}
              aria-hidden="true"
              onPointerDown={(e) => {
                if (disabled) return
                e.preventDefault()
                setDragId(id)
                const stop = () => {
                  setDragId(null)
                  window.removeEventListener('pointerup', stop)
                }
                window.addEventListener('pointerup', stop)
              }}
            >
              <GripVertical size={16} />
            </span>
            <span className={s.orderIndex}>{idx + 1}</span>
            <span className={s.orderText}>{renderInline(byId.get(id)?.text ?? id)}</span>
            <button type="button" className={s.iconBtn} disabled={disabled || idx === 0} onClick={() => move(idx, idx - 1)} aria-label={`Mover "${byId.get(id)?.text}" para cima`}>
              <ArrowUp size={16} />
            </button>
            <button type="button" className={s.iconBtn} disabled={disabled || idx === value.order.length - 1} onClick={() => move(idx, idx + 1)} aria-label={`Mover "${byId.get(id)?.text}" para baixo`}>
              <ArrowDown size={16} />
            </button>
          </li>
        ))}
      </ol>
      <div className="sr-only" aria-live="polite">
        {announce}
      </div>
    </>
  )
}

// --- predict -----------------------------------------------------------------

export function PredictView({ activity, value, onChange, disabled, evaluation, seed }: ViewProps<PredictActivity, PredictResponse>) {
  const options = useMemo(() => shuffled(activity.options, seed), [activity.options, seed])
  const ok = evaluation ? evaluation.score === 1 : undefined
  return (
    <div>
      <Scenario lines={activity.scenario} />
      <div className={s.options} role="radiogroup" aria-label="Previsão">
        {options.map((o) => (
          <Option key={o.id} checked={value.option === o.id} disabled={disabled} status={evaluation && value.option === o.id ? (ok ? 'correct' : 'wrong') : undefined} onSelect={() => onChange({ option: o.id })}>
            {renderInline(o.text)}
          </Option>
        ))}
      </div>
    </div>
  )
}

// --- estimate ----------------------------------------------------------------

export function EstimateView({ activity, value, onChange, disabled }: ViewProps<EstimateActivity, EstimateResponse>) {
  const log = activity.scale === 'log'
  const toSlider = (v: number) => (log ? Math.log10(Math.max(v, activity.min)) : v)
  const fromSlider = (x: number) => {
    if (!log) return x
    const raw = 10 ** x
    const mag = 10 ** Math.max(0, Math.floor(Math.log10(raw)) - 1)
    return Math.round(raw / mag) * mag
  }
  return (
    <div className={s.estimate}>
      <Scenario lines={activity.scenario} />
      <div className={s.estimateValue} aria-live="polite">
        {value.value.toLocaleString('pt-BR')} {activity.unit}
      </div>
      <input
        className={s.range}
        type="range"
        min={toSlider(activity.min)}
        max={toSlider(activity.max)}
        step={log ? 0.01 : activity.step}
        value={toSlider(value.value)}
        disabled={disabled}
        onChange={(e) => onChange({ value: fromSlider(Number(e.target.value)) })}
        aria-label={`Estimativa em ${activity.unit}`}
        aria-valuetext={`${value.value.toLocaleString('pt-BR')} ${activity.unit}`}
      />
      <div className={s.rangeScale} aria-hidden="true">
        <span>{activity.min.toLocaleString('pt-BR')}</span>
        {log && <span>escala logarítmica</span>}
        <span>{activity.max.toLocaleString('pt-BR')}</span>
      </div>
      <label>
        <span className="muted" style={{ fontSize: '0.9rem' }}>
          Ou digite o valor:
        </span>
        <input
          type="number"
          min={activity.min}
          max={activity.max}
          step={activity.step}
          value={value.value}
          disabled={disabled}
          onChange={(e) => {
            const v = Number(e.target.value)
            if (Number.isFinite(v)) onChange({ value: Math.max(activity.min, Math.min(activity.max, v)) })
          }}
        />
      </label>
    </div>
  )
}

// --- investigate -------------------------------------------------------------

export function InvestigateView({ activity, value, onChange, disabled, evaluation }: ViewProps<InvestigateActivity, InvestigateResponse>) {
  const status = statusMap(evaluation)
  const toggleLine = (id: string) => {
    const set = new Set(value.flagged)
    if (set.has(id)) set.delete(id)
    else set.add(id)
    onChange({ ...value, flagged: [...set] })
  }
  const toggleFix = (id: string) => {
    const set = new Set(value.remediations)
    if (set.has(id)) set.delete(id)
    else set.add(id)
    onChange({ ...value, remediations: [...set] })
  }
  return (
    <div>
      <Scenario lines={activity.scenario} />
      <p className={s.sectionLabel}>1. Marque as evidências do problema (clique nas linhas)</p>
      {activity.artifacts.map((art) => (
        <div key={art.id} className={s.artifact}>
          <div className={s.artifactTitle}>{art.title}</div>
          <div className={s.artifactLines}>
            {art.lines.map((l, i) => (
              <button
                key={l.id}
                type="button"
                className={s.line}
                aria-pressed={value.flagged.includes(l.id)}
                data-status={evaluation ? status[l.id] : undefined}
                disabled={disabled}
                onClick={() => toggleLine(l.id)}
              >
                <span className={s.lineNo}>{i + 1}</span>
                <span>{l.text}</span>
              </button>
            ))}
          </div>
        </div>
      ))}
      <p className={s.sectionLabel}>2. {activity.rootCause.prompt}</p>
      <div className={s.options} role="radiogroup" aria-label="Causa raiz">
        {activity.rootCause.options.map((o) => (
          <Option key={o.id} checked={value.rootCause === o.id} disabled={disabled} status={evaluation ? status[`root-${o.id}`] : undefined} onSelect={() => onChange({ ...value, rootCause: o.id })} note={evaluation && value.rootCause === o.id ? o.feedback : undefined}>
            {renderInline(o.text)}
          </Option>
        ))}
      </div>
      <p className={s.sectionLabel}>3. {activity.remediations.prompt}</p>
      <div className={s.options} role="group" aria-label="Correções">
        {activity.remediations.options.map((o) => (
          <Option key={o.id} multi checked={value.remediations.includes(o.id)} disabled={disabled} status={evaluation ? status[`fix-${o.id}`] : undefined} onSelect={() => toggleFix(o.id)} note={evaluation && status[`fix-${o.id}`] ? o.feedback : undefined}>
            {renderInline(o.text)}
          </Option>
        ))}
      </div>
    </div>
  )
}
