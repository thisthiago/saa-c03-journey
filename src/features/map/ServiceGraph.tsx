/**
 * Desenho do mapa de serviços em SVG. As posições vêm prontas do layout; aqui
 * ficam só o zoom, o arraste, a pinça, o teclado e o destaque da seleção.
 * Durante um gesto a transformação é aplicada direto no SVG e só vai para o
 * estado do React no fim, para recalcular os rótulos.
 */
import { Maximize, Minus, Plus } from 'lucide-react'
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type KeyboardEvent, type PointerEvent as ReactPointerEvent } from 'react'
import { registry } from '../../content'
import type { ServiceGraph as Graph, ServiceProgress } from '../../engine/service-graph'
import { centerOn, fitView, MAX_ZOOM, TERRITORY_FONT, TERRITORY_LINE, territoryLabelBox, territoryLines, nearestInDirection, neighborIds, shortLabel, visibleLabels, zoomAt, type Direction, type ServiceLayout, type View } from './service-map'
import { SERVICE_STATUS } from './status'
import s from './service-map.module.css'

export interface CenterRequest {
  id: string
  /** Muda a cada pedido, para centralizar de novo o mesmo serviço. */
  seq: number
}

interface Props {
  graph: Graph
  layout: ServiceLayout
  statuses: Map<string, ServiceProgress>
  /** Serviços que passam nos filtros; os demais ficam esmaecidos. */
  visible: Set<string>
  selectedId?: string
  onSelect: (id: string | undefined) => void
  center?: CenterRequest
}

const label = (id: string) => shortLabel(registry.services.get(id)?.shortName ?? id)
const KEY_DIR: Record<string, Direction> = { ArrowLeft: 'left', ArrowRight: 'right', ArrowUp: 'up', ArrowDown: 'down' }
/** Distância, em pixels, que separa um toque de um arraste. */
const DRAG_THRESHOLD = 4

function reducedMotion() {
  return document.documentElement.getAttribute('data-motion') === 'reduced' || Boolean(window.matchMedia?.('(prefers-reduced-motion: reduce)').matches)
}

function nodeAria(id: string, p: ServiceProgress | undefined, questions: number): string {
  const sv = registry.services.get(id)
  const territory = registry.territories.find((t) => t.id === sv?.territory)?.title
  const st = p ? SERVICE_STATUS[p.status].label : ''
  const phases = p && p.status !== 'locked' ? ` ${p.phases.completed} de ${p.phases.total} fases concluídas.` : ''
  return `${sv?.shortName}, ${territory}. ${st}.${phases} ${questions === 1 ? '1 questão' : `${questions} questões`} no banco.`
}

/** Cadeado desenhado no centro do nó, proporcional ao raio. */
function LockMark({ r }: { r: number }) {
  const w = r * 0.9
  return (
    <g className={s.lock} transform={`translate(${-w / 2},${-w / 2}) scale(${w / 24})`} aria-hidden="true">
      <rect x="5" y="11" width="14" height="10" rx="2" />
      <path d="M8 11V7a4 4 0 0 1 8 0v4" />
    </g>
  )
}

/** Selo de concluído na borda do nó. */
function DoneMark({ r }: { r: number }) {
  const b = Math.max(4, r * 0.42)
  const cx = r * 0.72
  const cy = -r * 0.72
  return (
    <g className={s.done} aria-hidden="true">
      <circle cx={cx} cy={cy} r={b} />
      <path d={`M${cx - b * 0.45},${cy} l${b * 0.32},${b * 0.32} l${b * 0.6},${-b * 0.62}`} />
    </g>
  )
}

export function ServiceGraph({ graph, layout, statuses, visible, selectedId, onSelect, center }: Props) {
  const wrapRef = useRef<HTMLDivElement>(null)
  const svgRef = useRef<SVGSVGElement>(null)
  const sceneRef = useRef<SVGGElement>(null)
  const nodeRefs = useRef(new Map<string, SVGGElement>())
  const [size, setSize] = useState({ w: 800, h: 600 })
  // A faixa da direita fica livre para os botões de zoom.
  const fit = useMemo(() => fitView(layout.bounds, size.w, size.h, 16, 56), [layout, size])
  const minZoom = fit.k * 0.8
  const [view, setView] = useState<View>(fit)
  const live = useRef<View>(view)
  /** O usuário já mexeu no zoom ou no enquadramento (o redimensionamento não reajusta mais). */
  const touched = useRef(false)
  const anim = useRef<number | undefined>(undefined)
  const commitTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const [hint, setHint] = useState(false)
  const hintTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const [hoverId, setHoverId] = useState<string>()
  const [focusId, setFocusId] = useState<string>(() => selectedId ?? [...layout.nodes].sort((a, b) => b.r - a.r)[0]?.id)
  const [focusInside, setFocusInside] = useState(false)
  const [pulseId, setPulseId] = useState<string>()

  const apply = useCallback((v: View) => {
    live.current = v
    sceneRef.current?.setAttribute('transform', `translate(${v.x},${v.y}) scale(${v.k})`)
  }, [])
  const commitSoon = useCallback(() => {
    clearTimeout(commitTimer.current)
    commitTimer.current = setTimeout(() => setView(live.current), 120)
  }, [])
  const animateTo = useCallback(
    (target: View) => {
      if (anim.current) cancelAnimationFrame(anim.current)
      if (reducedMotion() || typeof requestAnimationFrame === 'undefined') {
        apply(target)
        setView(target)
        return
      }
      const from = live.current
      const start = performance.now()
      const step = (now: number) => {
        const t = Math.min(1, (now - start) / 280)
        const e = 1 - (1 - t) ** 3
        apply({ x: from.x + (target.x - from.x) * e, y: from.y + (target.y - from.y) * e, k: from.k + (target.k - from.k) * e })
        if (t < 1) anim.current = requestAnimationFrame(step)
        else {
          anim.current = undefined
          setView(target)
        }
      }
      anim.current = requestAnimationFrame(step)
    },
    [apply],
  )

  // Tamanho do quadro: reajusta o enquadramento enquanto o usuário não mexeu nele.
  useLayoutEffect(() => {
    const el = wrapRef.current
    if (!el) return
    const measure = () => {
      const r = el.getBoundingClientRect()
      if (r.width > 0 && r.height > 0) setSize((old) => (old.w === r.width && old.h === r.height ? old : { w: r.width, h: r.height }))
    }
    measure()
    if (typeof ResizeObserver === 'undefined') return
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])
  useEffect(() => {
    if (touched.current) return
    apply(fit)
    setView(fit)
  }, [fit, apply])

  // Limpeza de animação e temporizadores ao desmontar.
  useEffect(
    () => () => {
      if (anim.current) cancelAnimationFrame(anim.current)
      clearTimeout(commitTimer.current)
      clearTimeout(hintTimer.current)
    },
    [],
  )

  // Roda: zoom só com Ctrl ou ⌘ (a pinça do trackpad chega assim); sem a tecla, a página rola.
  useEffect(() => {
    const svg = svgRef.current
    if (!svg) return
    const onWheel = (e: WheelEvent) => {
      if (!e.ctrlKey && !e.metaKey) {
        setHint(true)
        clearTimeout(hintTimer.current)
        hintTimer.current = setTimeout(() => setHint(false), 1600)
        return
      }
      e.preventDefault()
      const r = svg.getBoundingClientRect()
      touched.current = true
      apply(zoomAt(live.current, Math.exp(-e.deltaY * 0.004), e.clientX - r.left, e.clientY - r.top, minZoom))
      commitSoon()
    }
    svg.addEventListener('wheel', onWheel, { passive: false })
    return () => svg.removeEventListener('wheel', onWheel)
  }, [apply, commitSoon, minZoom])

  // Arraste com um dedo ou o mouse; pinça com dois dedos.
  const pointers = useRef(new Map<number, { x: number; y: number }>())
  const gesture = useRef<{ view: View; x: number; y: number; dist?: number; moved: boolean } | null>(null)
  const dragged = useRef(false)
  const local = (e: ReactPointerEvent) => {
    const r = svgRef.current!.getBoundingClientRect()
    return { x: e.clientX - r.left, y: e.clientY - r.top }
  }
  const startGesture = () => {
    const pts = [...pointers.current.values()]
    if (pts.length === 0) {
      gesture.current = null
      return
    }
    const x = pts.reduce((a, p) => a + p.x, 0) / pts.length
    const y = pts.reduce((a, p) => a + p.y, 0) / pts.length
    const dist = pts.length >= 2 ? Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y) : undefined
    gesture.current = { view: live.current, x, y, dist, moved: gesture.current?.moved ?? false }
  }
  const onPointerDown = (e: ReactPointerEvent<SVGSVGElement>) => {
    if (e.button !== 0 && e.pointerType === 'mouse') return
    pointers.current.set(e.pointerId, local(e))
    dragged.current = false
    startGesture()
  }
  const onPointerMove = (e: ReactPointerEvent<SVGSVGElement>) => {
    if (!pointers.current.has(e.pointerId) || !gesture.current) return
    pointers.current.set(e.pointerId, local(e))
    const pts = [...pointers.current.values()]
    const g = gesture.current
    const x = pts.reduce((a, p) => a + p.x, 0) / pts.length
    const y = pts.reduce((a, p) => a + p.y, 0) / pts.length
    if (!g.moved && Math.hypot(x - g.x, y - g.y) < DRAG_THRESHOLD && pts.length < 2) return
    if (!g.moved) {
      g.moved = true
      svgRef.current?.setPointerCapture?.(e.pointerId)
    }
    touched.current = true
    let v = { ...g.view, x: g.view.x + x - g.x, y: g.view.y + y - g.y }
    if (pts.length >= 2 && g.dist) {
      const dist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y)
      v = zoomAt(v, dist / g.dist, x, y, minZoom)
    }
    apply(v)
  }
  const onPointerEnd = (e: ReactPointerEvent<SVGSVGElement>) => {
    if (!pointers.current.has(e.pointerId)) return
    pointers.current.delete(e.pointerId)
    const moved = gesture.current?.moved ?? false
    if (pointers.current.size > 0) {
      startGesture()
      return
    }
    gesture.current = null
    if (moved) {
      dragged.current = true
      setView(live.current)
    }
  }

  const zoomBy = (factor: number) => {
    touched.current = true
    animateTo(zoomAt(live.current, factor, size.w / 2, size.h / 2, minZoom))
  }
  const reset = () => {
    touched.current = false
    animateTo(fit)
  }

  /** Mostra o nó na tela: centraliza se ele estiver fora do quadro (ou sempre, com `force`). */
  const reveal = useCallback(
    (id: string, force: boolean) => {
      const n = layout.byId.get(id)
      if (!n) return
      const v = live.current
      const sx = n.x * v.k + v.x
      const sy = n.y * v.k + v.y
      const margin = 40
      if (!force && sx > margin && sx < size.w - margin && sy > margin && sy < size.h - margin) return
      touched.current = true
      animateTo(centerOn(n.x, n.y, size.w, size.h, force ? Math.min(MAX_ZOOM, Math.max(v.k, fit.k * 1.8)) : v.k))
    },
    [layout, size, fit, animateTo],
  )

  // Pedido de centralizar (busca ou relação no painel).
  useEffect(() => {
    if (!center) return
    setFocusId(center.id)
    reveal(center.id, true)
    setPulseId(center.id)
    const t = setTimeout(() => setPulseId(undefined), 1000)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [center])

  useEffect(() => {
    if (selectedId) setFocusId(selectedId)
  }, [selectedId])

  const onNodeKey = (e: KeyboardEvent<SVGGElement>, id: string) => {
    const dir = KEY_DIR[e.key]
    if (dir) {
      e.preventDefault()
      const from = layout.byId.get(id)!
      const next = nearestInDirection(from, layout.nodes, dir)
      if (!next) return
      setFocusId(next)
      nodeRefs.current.get(next)?.focus()
      reveal(next, false)
      return
    }
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      onSelect(id)
    } else if (e.key === 'Escape') {
      e.preventDefault()
      onSelect(undefined)
    } else if (e.key === '+' || e.key === '=') {
      e.preventDefault()
      zoomBy(1.4)
    } else if (e.key === '-') {
      e.preventDefault()
      zoomBy(1 / 1.4)
    } else if (e.key === '0') {
      e.preventDefault()
      reset()
    }
  }

  // Destaque: o selecionado (ou, sem seleção, o nó sob o mouse) e os vizinhos dele.
  const spotlight = selectedId ?? hoverId
  const related = useMemo(() => (spotlight ? new Set([spotlight, ...neighborIds(graph, spotlight)]) : undefined), [graph, spotlight])
  const labels = useMemo(() => {
    const forced = [selectedId, hoverId, focusInside ? focusId : undefined].filter((x): x is string => Boolean(x))
    const preferred = selectedId ? neighborIds(graph, selectedId) : []
    return visibleLabels(
      layout.nodes.filter((n) => visible.has(n.id)),
      label,
      view.k,
      forced,
      preferred,
      layout.territories.map(territoryLabelBox),
    )
  }, [layout, graph, visible, view.k, selectedId, hoverId, focusId, focusInside])

  const dim = (id: string) => !visible.has(id) || (related ? !related.has(id) : false)
  // Os maiores primeiro: os pequenos ficam por cima e continuam clicáveis.
  const order = useMemo(() => [...layout.nodes].sort((a, b) => b.r - a.r), [layout])
  const k = view.k

  return (
    <div className={s.canvas} ref={wrapRef}>
      <p id="service-graph-help" className="sr-only">
        Use Tab para entrar no mapa, as setas para ir de um serviço a outro, Enter para ver os detalhes, Esc para limpar a seleção, mais e menos para o zoom e zero para ajustar à tela. A lista de serviços mostra o mesmo conteúdo sem o desenho.
      </p>
      <svg
        ref={svgRef}
        className={s.svg}
        role="group"
        aria-label={`Mapa de serviços: ${layout.nodes.length} serviços em ${layout.territories.length} territórios`}
        aria-describedby="service-graph-help"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerEnd}
        onPointerCancel={onPointerEnd}
        onClick={(e) => {
          if (e.target === svgRef.current && !dragged.current) onSelect(undefined)
        }}
      >
        <g ref={sceneRef} transform={`translate(${view.x},${view.y}) scale(${view.k})`}>
          <g className={s.edges} aria-hidden="true">
            {graph.edges.map((e) => {
              const on = Boolean(spotlight) && (e.source === spotlight || e.target === spotlight)
              const off = !visible.has(e.source) || !visible.has(e.target) || (Boolean(spotlight) && !on)
              const a = layout.byId.get(e.source)!
              const b = layout.byId.get(e.target)!
              return (
                <line
                  key={`${e.source}|${e.target}`}
                  x1={a.x}
                  y1={a.y}
                  x2={b.x}
                  y2={b.y}
                  data-w={Math.min(3, e.conceptIds.length)}
                  data-on={on || undefined}
                  data-off={off || undefined}
                  vectorEffect="non-scaling-stroke"
                />
              )
            })}
          </g>
          <g className={s.nodes}>
            {order.map((n) => {
              const p = statuses.get(n.id)
              const st = p?.status ?? 'locked'
              const locked = st === 'locked'
              const color = locked ? 'var(--node-locked)' : `var(--territory-${n.territory})`
              return (
                <g
                  key={n.id}
                  ref={(el) => {
                    if (el) nodeRefs.current.set(n.id, el)
                    else nodeRefs.current.delete(n.id)
                  }}
                  className={s.node}
                  transform={`translate(${n.x},${n.y})`}
                  role="button"
                  tabIndex={n.id === focusId ? 0 : -1}
                  aria-label={nodeAria(n.id, p, graph.byId.get(n.id)?.questions ?? 0)}
                  aria-pressed={n.id === selectedId}
                  data-service={n.id}
                  data-status={st}
                  data-dim={dim(n.id) || undefined}
                  data-selected={n.id === selectedId || undefined}
                  data-pulse={n.id === pulseId || undefined}
                  style={{ ['--c' as string]: color }}
                  onClick={() => {
                    if (dragged.current) return
                    setFocusId(n.id)
                    onSelect(n.id === selectedId ? undefined : n.id)
                  }}
                  onKeyDown={(e) => onNodeKey(e, n.id)}
                  onFocus={() => {
                    setFocusId(n.id)
                    setFocusInside(true)
                  }}
                  onBlur={() => setFocusInside(false)}
                  onPointerEnter={(e) => e.pointerType === 'mouse' && setHoverId(n.id)}
                  onPointerLeave={() => setHoverId((h) => (h === n.id ? undefined : h))}
                >
                  <circle className={s.hit} r={Math.max(n.r + 2, 12 / k)} />
                  {n.id === selectedId && <circle className={s.halo} r={n.r + 7} />}
                  {st === 'in-progress' && p && (
                    <>
                      <circle className={s.track} r={n.r + 3.5} />
                      <circle className={s.arc} r={n.r + 3.5} pathLength={100} strokeDasharray={`${Math.max(2, p.missions.ratio * 100)} 100`} transform="rotate(-90)" />
                    </>
                  )}
                  {st === 'completed' && <circle className={s.doneRing} r={n.r + 3.5} />}
                  <circle className={s.dot} r={n.r} />
                  {locked && <LockMark r={n.r} />}
                  {st === 'completed' && <DoneMark r={n.r} />}
                </g>
              )
            })}
          </g>
          <g className={s.labels} aria-hidden="true">
            {order
              .filter((n) => labels.has(n.id))
              .map((n) => (
                <text
                  key={n.id}
                  x={n.x}
                  y={n.y + n.r + 3 / k + 11.5 / k}
                  fontSize={12 / k}
                  strokeWidth={3 / k}
                  data-selected={n.id === selectedId || undefined}
                  data-locked={statuses.get(n.id)?.status === 'locked' || undefined}
                  data-dim={dim(n.id) || undefined}
                >
                  {label(n.id)}
                </text>
              ))}
          </g>
          <g className={s.territoryNames} aria-hidden="true">
            {layout.territories.map((t) => (
              <text key={t.id} x={t.x} y={t.y} fontSize={TERRITORY_FONT} strokeWidth={4 / k}>
                {territoryLines(t.title).map((line, i, all) => (
                  <tspan key={line} x={t.x} y={t.y - (all.length - 1 - i) * TERRITORY_LINE}>
                    {line}
                  </tspan>
                ))}
              </text>
            ))}
          </g>
        </g>
      </svg>
      <div className={s.zoom} role="group" aria-label="Zoom do mapa">
        <button type="button" onClick={() => zoomBy(1.4)} aria-label="Aproximar">
          <Plus size={18} aria-hidden="true" />
        </button>
        <button type="button" onClick={() => zoomBy(1 / 1.4)} aria-label="Afastar">
          <Minus size={18} aria-hidden="true" />
        </button>
        <button type="button" onClick={reset} aria-label="Ajustar o mapa à tela">
          <Maximize size={16} aria-hidden="true" />
        </button>
      </div>
      {hint && (
        <p className={s.hint} role="status">
          Para aproximar, segure Ctrl (ou ⌘) e use a rolagem. Os botões ao lado também mudam o zoom.
        </p>
      )}
    </div>
  )
}
