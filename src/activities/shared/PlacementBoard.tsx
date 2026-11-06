/**
 * Primitiva "selecionar → posicionar", com três formas de uso:
 *  - teclado: Tab até o item, Enter/Espaço para selecionar, Tab até o destino, Enter;
 *  - toque/clique: tocar no item e depois no destino;
 *  - mouse/caneta: arrastar o item e soltar no destino.
 */
import { Check, X } from 'lucide-react'
import { useRef, useState, type CSSProperties, type PointerEvent as ReactPointerEvent, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import type { Rect } from '../../engine/diagram'
import type { GlyphName } from '../../engine/types'
import { Glyph } from '../../ui/Glyph'
import { renderInline } from '../../ui/inline'
import s from './shared.module.css'

export interface PlaceItem {
  id: string
  text: string
  glyph?: GlyphName
}

export interface PlaceTarget {
  id: string
  label: string
  description?: string
  /** Quantos itens cabem (padrão: ilimitado). */
  capacity?: number
}

interface Props {
  items: PlaceItem[]
  targets: PlaceTarget[]
  placements: Record<string, string>
  onChange: (next: Record<string, string>) => void
  disabled?: boolean
  /** Status por item após a verificação. */
  itemStatus?: Record<string, 'correct' | 'wrong' | 'missed' | 'partial'>
  poolLabel?: string
  layout?: 'bins' | 'pairs'
  /**
   * Destinos sobre um desenho: os que têm posição ficam por cima do fundo
   * (coordenadas no viewBox `width` × `height`); os outros ficam ao lado, com a lista.
   */
  canvas?: { width: number; height: number; background: ReactNode; positions: Record<string, Rect> }
}

export function PlacementBoard({ items, targets, placements, onChange, disabled, itemStatus, poolLabel = 'Itens para posicionar', layout = 'bins', canvas }: Props) {
  const [selected, setSelected] = useState<string | null>(null)
  const [drag, setDrag] = useState<{ id: string; left: number; top: number; width: number } | null>(null)
  const [announce, setAnnounce] = useState('')
  // dx/dy: ponto do item em que o mouse o segurou; o fantasma mantém esse ponto sob o cursor.
  const start = useRef<{ id: string; x: number; y: number; dx: number; dy: number; width: number; moved: boolean } | null>(null)
  const suppressClick = useRef(false)

  const textOf = (id: string) => items.find((i) => i.id === id)?.text ?? id
  const labelOf = (id: string) => targets.find((t) => t.id === id)?.label ?? id

  function place(itemId: string, targetId: string | null) {
    const next = { ...placements }
    if (targetId === null) {
      delete next[itemId]
      setAnnounce(`${textOf(itemId)} voltou para a lista.`)
    } else {
      const target = targets.find((t) => t.id === targetId)
      const occupants = Object.entries(next).filter(([id, t]) => t === targetId && id !== itemId)
      if (target?.capacity && occupants.length >= target.capacity) {
        // Destino cheio: o ocupante mais antigo volta para a lista (troca).
        delete next[occupants[0][0]]
      }
      next[itemId] = targetId
      setAnnounce(`${textOf(itemId)} posicionado em ${labelOf(targetId)}.`)
    }
    onChange(next)
    setSelected(null)
  }

  function onItemClick(id: string) {
    if (disabled) return
    if (suppressClick.current) {
      suppressClick.current = false
      return
    }
    if (selected === id) {
      setSelected(null)
      setAnnounce('Seleção cancelada.')
    } else {
      setSelected(id)
      setAnnounce(`${textOf(id)} selecionado. Escolha um destino.`)
    }
  }

  function onTargetClick(targetId: string | null) {
    if (disabled || !selected) return
    place(selected, targetId)
  }

  function onPointerDown(e: ReactPointerEvent<HTMLButtonElement>, id: string) {
    if (disabled || e.pointerType === 'touch' || e.button !== 0) return
    const rect = e.currentTarget.getBoundingClientRect()
    start.current = { id, x: e.clientX, y: e.clientY, dx: e.clientX - rect.left, dy: e.clientY - rect.top, width: rect.width, moved: false }
    e.currentTarget.setPointerCapture?.(e.pointerId)
  }
  function onPointerMove(e: ReactPointerEvent<HTMLButtonElement>) {
    const st = start.current
    if (!st) return
    if (!st.moved && Math.hypot(e.clientX - st.x, e.clientY - st.y) > 6) st.moved = true
    if (st.moved) setDrag({ id: st.id, left: e.clientX - st.dx, top: e.clientY - st.dy, width: st.width })
  }
  function onPointerUp(e: ReactPointerEvent<HTMLButtonElement>) {
    const st = start.current
    start.current = null
    if (!st?.moved) return
    setDrag(null)
    suppressClick.current = true
    const el = document.elementFromPoint(e.clientX, e.clientY)?.closest<HTMLElement>('[data-drop]')
    if (!el) return
    const target = el.dataset.drop === '__pool' ? null : (el.dataset.drop ?? null)
    place(st.id, target)
  }

  const pool = items.filter((i) => !placements[i.id])

  const chip = (item: PlaceItem) => {
    const status = itemStatus?.[item.id]
    return (
      <button
        key={item.id}
        type="button"
        className={[s.chip, selected === item.id && s.chipSelected, drag?.id === item.id && s.chipDragging, status && s[`chip-${status}`]].filter(Boolean).join(' ')}
        aria-pressed={selected === item.id}
        aria-disabled={disabled}
        onClick={() => onItemClick(item.id)}
        onPointerDown={(e) => onPointerDown(e, item.id)}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={() => {
          start.current = null
          setDrag(null)
        }}
      >
        {status === 'correct' && <Check size={16} aria-label="correto" />}
        {(status === 'wrong' || status === 'missed') && <X size={16} aria-label="incorreto" />}
        {!status && item.glyph && <Glyph name={item.glyph} size={15} />}
        <span>{renderInline(item.text)}</span>
      </button>
    )
  }

  const renderTarget = (t: PlaceTarget, style?: CSSProperties) => {
    const placed = items.filter((i) => placements[i.id] === t.id)
    return (
      <div key={t.id} className={[s.target, style && s.slot, selected && s.dropReady].filter(Boolean).join(' ')} style={style} data-drop={t.id}>
        <button
          type="button"
          className={s.targetHead}
          onClick={() => onTargetClick(t.id)}
          disabled={disabled || !selected}
          aria-label={`Posicionar em ${t.label}`}
          title={style ? t.description : undefined}
        >
          <span className={s.targetLabel}>{renderInline(t.label)}</span>
          {t.description && <span className={s.targetDesc}>{t.description}</span>}
          {selected && !disabled && <span className={s.targetHint}>Toque para posicionar aqui</span>}
        </button>
        <div className={s.chips}>{placed.map(chip)}</div>
      </div>
    )
  }

  const poolBox = (
    <div
      className={[s.pool, selected && placements[selected] && s.dropReady].filter(Boolean).join(' ')}
      data-drop="__pool"
      onClick={(e) => {
        if (e.target === e.currentTarget) onTargetClick(null)
      }}
    >
      <div className={s.poolHead}>
        <span className={s.poolLabel}>{poolLabel}</span>
        <span className="muted">{pool.length > 0 ? `${pool.length} restante(s)` : 'Todos posicionados'}</span>
        {selected && placements[selected] && !disabled && (
          <button type="button" className={s.linkBtn} onClick={() => onTargetClick(null)}>
            Devolver à lista
          </button>
        )}
      </div>
      <div className={s.chips}>{pool.map(chip)}</div>
    </div>
  )

  const pct = (n: number, of: number) => `${(n / of) * 100}%`

  return (
    <div className={s.board} data-layout={canvas ? 'canvas' : layout}>
      {canvas ? (
        <>
          <div className={s.canvas} style={{ aspectRatio: `${canvas.width} / ${canvas.height}` }}>
            <div className={s.canvasBg}>{canvas.background}</div>
            {targets
              .filter((t) => canvas.positions[t.id])
              .map((t) => {
                const r = canvas.positions[t.id]
                return renderTarget(t, { left: pct(r.x, canvas.width), top: pct(r.y, canvas.height), width: pct(r.w, canvas.width), minHeight: pct(r.h, canvas.height) })
              })}
          </div>
          <div className={s.canvasSide}>
            {poolBox}
            {targets.filter((t) => !canvas.positions[t.id]).map((t) => renderTarget(t))}
          </div>
        </>
      ) : (
        <>
          {poolBox}
          <div className={s.targets}>{targets.map((t) => renderTarget(t))}</div>
        </>
      )}
      {/* Portal no body: um ancestral com transform (animação do card) mudaria a referência do position: fixed. */}
      {drag &&
        createPortal(
          <div className={s.ghost} style={{ left: drag.left, top: drag.top, width: drag.width }} aria-hidden="true">
            {renderInline(textOf(drag.id))}
          </div>,
          document.body,
        )}
      <div className="sr-only" aria-live="polite">
        {announce}
      </div>
    </div>
  )
}
