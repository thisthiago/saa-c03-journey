/**
 * Desenha um `DiagramSpec` em SVG. As cores vêm dos tokens do tema, então o
 * mesmo desenho funciona no tema claro e no escuro.
 */
import { useId, type ReactNode } from 'react'
import { linkPoints, midpoint, NODE_HALF, type DiagramSpec, type DiagramTone } from '../../engine/diagram'
import { Glyph } from '../Glyph'
import s from './diagram.module.css'

const TONES: DiagramTone[] = ['neutral', 'accent', 'info', 'success', 'danger', 'warning', 'mastery']
const TONE_VAR: Record<DiagramTone, string> = {
  neutral: 'var(--text-muted)',
  accent: 'var(--accent)',
  info: 'var(--info)',
  success: 'var(--success)',
  danger: 'var(--danger)',
  warning: 'var(--warning)',
  mastery: 'var(--mastery)',
}

function lines(text: string): string[] {
  return text.split('\n')
}

/** Largura aproximada de um texto, para o fundo dos rótulos das ligações. */
function textWidth(text: string, size: number): number {
  return text.length * size * 0.56
}

export interface DiagramProps {
  spec: DiagramSpec
  className?: string
}

/** Só o SVG, sem moldura. `overlay` é desenhado por cima (a montagem usa para os lugares das peças). */
export function DiagramSvg({ spec, overlay }: { spec: DiagramSpec; overlay?: ReactNode }) {
  const uid = useId().replace(/:/g, '')
  const marker = (tone: DiagramTone) => `url(#${uid}-arrow-${tone})`
  return (
    <svg className={s.svg} viewBox={`0 0 ${spec.width} ${spec.height}`} aria-hidden="true" focusable="false">
      <defs>
        {TONES.map((tone) => (
          <marker key={tone} id={`${uid}-arrow-${tone}`} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
            <path d="M0 0 L10 5 L0 10 z" style={{ fill: TONE_VAR[tone] }} />
          </marker>
        ))}
        <pattern id={`${uid}-hatch`} width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <line x1="0" y1="0" x2="0" y2="8" className={s.hatch} />
        </pattern>
      </defs>

      {spec.boxes?.map((b) => (
        <g key={b.id} className={s.box} data-kind={b.kind} data-failed={b.failed || undefined}>
          <rect x={b.x} y={b.y} width={b.w} height={b.h} rx={10} />
          {b.failed && <rect x={b.x} y={b.y} width={b.w} height={b.h} rx={10} fill={`url(#${uid}-hatch)`} className={s.hatchFill} />}
          <text x={b.x + 10} y={b.y + 17} className={s.boxLabel}>
            {b.label}
          </text>
        </g>
      ))}

      {spec.links?.map((l, i) => {
        const pts = linkPoints(spec, l)
        if (!pts) return null
        const tone = l.tone ?? 'neutral'
        const [mx, my] = midpoint(pts)
        const arrow = l.arrow ?? 'end'
        return (
          <g key={`${l.from}-${l.to}-${i}`} className={s.link} data-tone={tone}>
            <polyline
              points={pts.map((p) => p.join(',')).join(' ')}
              strokeDasharray={l.style === 'dashed' ? '6 5' : undefined}
              markerEnd={arrow === 'end' || arrow === 'both' ? marker(tone) : undefined}
              markerStart={arrow === 'both' ? marker(tone) : undefined}
            />
            {l.crossed && (
              <g className={s.cross}>
                <line x1={mx - 7} y1={my - 7} x2={mx + 7} y2={my + 7} />
                <line x1={mx - 7} y1={my + 7} x2={mx + 7} y2={my - 7} />
              </g>
            )}
            {l.label && (
              <g className={s.linkLabel} transform={`translate(${mx}, ${l.crossed ? my - 16 : my})`}>
                <rect x={-textWidth(l.label, 11) / 2 - 4} y={-9} width={textWidth(l.label, 11) + 8} height={17} rx={4} />
                <text y={4} textAnchor="middle">
                  {l.label}
                </text>
              </g>
            )}
          </g>
        )
      })}

      {spec.nodes?.map((n) => (
        <g key={n.id} className={s.node} data-tone={n.tone ?? 'neutral'} data-state={n.state ?? 'ok'}>
          <rect x={n.x - NODE_HALF} y={n.y - NODE_HALF} width={NODE_HALF * 2} height={NODE_HALF * 2} rx={10} />
          {n.glyph && (
            <g transform={`translate(${n.x - 11}, ${n.y - 11})`} className={s.glyph}>
              <Glyph name={n.glyph} size={22} />
            </g>
          )}
          {n.state === 'fail' && (
            <g className={s.failBadge} transform={`translate(${n.x + NODE_HALF - 2}, ${n.y - NODE_HALF + 2})`}>
              <circle r={8} />
              <line x1={-3.5} y1={-3.5} x2={3.5} y2={3.5} />
              <line x1={-3.5} y1={3.5} x2={3.5} y2={-3.5} />
            </g>
          )}
          {(() => {
            const side = n.labelSide ?? 'below'
            const lx = side === 'left' ? n.x - NODE_HALF - 8 : side === 'right' ? n.x + NODE_HALF + 8 : n.x
            const ly = side === 'below' ? n.y + NODE_HALF + 15 : n.y + 4 - (n.sub ? 7 : 0) - (lines(n.label).length - 1) * 7
            const anchor = side === 'left' ? 'end' : side === 'right' ? 'start' : 'middle'
            return (
              <text x={lx} y={ly} textAnchor={anchor} className={s.nodeLabel}>
                {lines(n.label).map((t, i) => (
                  <tspan key={i} x={lx} dy={i === 0 ? 0 : 14}>
                    {t}
                  </tspan>
                ))}
                {n.sub && (
                  <tspan x={lx} dy={14} className={s.nodeSub}>
                    {n.sub}
                  </tspan>
                )}
              </text>
            )
          })()}
        </g>
      ))}

      {spec.notes?.map((n, i) => (
        <text key={i} x={n.x} y={n.y} textAnchor={n.anchor ?? 'start'} className={s.note} data-tone={n.tone ?? 'neutral'}>
          {lines(n.text).map((t, j) => (
            <tspan key={j} x={n.x} dy={j === 0 ? 0 : 14}>
              {t}
            </tspan>
          ))}
        </text>
      ))}

      {overlay}
    </svg>
  )
}

export function Diagram({ spec, className }: DiagramProps) {
  return (
    <figure className={[s.figure, className].filter(Boolean).join(' ')} role="img" aria-label={spec.label}>
      <div className={s.canvas}>
        <DiagramSvg spec={spec} />
      </div>
      {spec.caption && <figcaption className={s.caption}>{spec.caption}</figcaption>}
    </figure>
  )
}
