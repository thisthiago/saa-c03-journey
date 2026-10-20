/** Componentes básicos da interface. */
import { CircleAlert, CircleCheck, Info, Lightbulb, TriangleAlert } from 'lucide-react'
import { useEffect, useRef, type ButtonHTMLAttributes, type CSSProperties, type ReactNode } from 'react'
import { Link, type LinkProps } from 'react-router'
import type { GlyphName } from '../engine/types'
import { Glyph } from './Glyph'
import s from './ui.module.css'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger'

function btnClass(variant: Variant, size?: 'small', block?: boolean, extra?: string) {
  return [s.btn, s[variant], size === 'small' && s.small, block && s.block, extra].filter(Boolean).join(' ')
}

export function Button({
  variant = 'primary',
  size,
  block,
  className,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: 'small'; block?: boolean }) {
  return <button type="button" className={btnClass(variant, size, block, className)} {...rest} />
}

export function ButtonLink({ variant = 'primary', size, block, className, ...rest }: LinkProps & { variant?: Variant; size?: 'small'; block?: boolean }) {
  return <Link className={btnClass(variant, size, block, className)} {...rest} />
}

export function Card({ children, className, style, as: Tag = 'section', ...rest }: { children: ReactNode; className?: string; style?: CSSProperties; as?: 'section' | 'div' | 'article'; 'aria-labelledby'?: string }) {
  return (
    <Tag className={[s.card, className].filter(Boolean).join(' ')} style={style} {...rest}>
      {children}
    </Tag>
  )
}

export type Tone = 'neutral' | 'accent' | 'xp' | 'mastery' | 'success' | 'danger' | 'warning' | 'info'

export function Badge({ tone = 'neutral', children, icon, title }: { tone?: Tone; children: ReactNode; icon?: ReactNode; title?: string }) {
  return (
    <span className={`${s.badge} ${s[`tone-${tone}`]}`} title={title}>
      {icon}
      {children}
    </span>
  )
}

export function ProgressBar({ value, color, label }: { value: number; color?: string; label: string }) {
  const pct = Math.round(Math.max(0, Math.min(1, value)) * 100)
  return (
    <div className={s.bar} role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct}>
      <div className={s.barFill} style={{ width: `${pct}%`, ['--fill' as string]: color }} />
    </div>
  )
}

export function ProgressRing({ value, size = 56, stroke = 6, color = 'var(--accent)', children, label }: { value: number; size?: number; stroke?: number; color?: string; children?: ReactNode; label?: string }) {
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const v = Math.max(0, Math.min(1, value))
  return (
    <div style={{ position: 'relative', width: size, height: size, flex: 'none' }} role={label ? 'img' : undefined} aria-label={label}>
      <svg width={size} height={size} className={s.ring} aria-hidden="true">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={stroke} className={s.ringTrack} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - v)}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          className={s.ringFill}
        />
      </svg>
      {children && <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', fontSize: size / 4.2, fontWeight: 700, fontFamily: 'var(--font-display)' }}>{children}</div>}
    </div>
  )
}

export function IconTile({ glyph, color, size = 44 }: { glyph: GlyphName; color?: string; size?: number }) {
  return (
    <span className={s.iconTile} style={{ ['--tile' as string]: color, width: size, height: size }}>
      <Glyph name={glyph} size={Math.round(size * 0.5)} />
    </span>
  )
}

const CALLOUT_ICON = { info: Info, success: CircleCheck, warning: TriangleAlert, danger: CircleAlert, tip: Lightbulb }
const CALLOUT_TONE = { info: 'info', success: 'success', warning: 'warning', danger: 'danger', tip: 'xp' } as const

export function Callout({ kind = 'info', title, children }: { kind?: keyof typeof CALLOUT_ICON; title?: string; children: ReactNode }) {
  const Icon = CALLOUT_ICON[kind]
  return (
    <div className={`${s.callout} ${s[`tone-${CALLOUT_TONE[kind]}`]}`}>
      <Icon size={18} aria-hidden="true" />
      <div className={s.calloutBody}>
        {title && <strong style={{ display: 'block', marginBottom: 2 }}>{title}</strong>}
        {children}
      </div>
    </div>
  )
}

/** Diálogo modal acessível baseado em <dialog>. */
export function Modal({ open, onClose, labelledBy, children, actions }: { open: boolean; onClose: () => void; labelledBy: string; children: ReactNode; actions?: ReactNode }) {
  const ref = useRef<HTMLDialogElement>(null)
  useEffect(() => {
    const d = ref.current
    if (!d) return
    if (open && !d.open) {
      if (typeof d.showModal === 'function') d.showModal()
      else d.setAttribute('open', '')
    }
    if (!open && d.open) {
      if (typeof d.close === 'function') d.close()
      else d.removeAttribute('open')
    }
  }, [open])
  return (
    <dialog ref={ref} className={s.dialog} aria-labelledby={labelledBy} onClose={onClose} onCancel={onClose}>
      {open && (
        <div className={s.dialogBody}>
          {children}
          {actions && <div className={s.dialogActions}>{actions}</div>}
        </div>
      )}
    </dialog>
  )
}
