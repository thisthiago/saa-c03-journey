/**
 * Diagramas declarativos: o conteúdo descreve caixas, nós, ligações e notas,
 * e `src/ui/diagram/Diagram.tsx` desenha em SVG com os tokens do tema.
 * Este arquivo é puro (sem React): tipos, âncoras das ligações e validação.
 */
import type { GlyphName } from './types'

export type DiagramTone = 'neutral' | 'accent' | 'info' | 'success' | 'danger' | 'warning' | 'mastery'

/** Tipo da caixa: muda a cor e o traço. */
export type DiagramBoxKind =
  | 'region'
  | 'vpc'
  | 'zone'
  | 'public'
  | 'private'
  | 'onprem'
  | 'internet'
  | 'account'
  | 'generic'

export interface DiagramBox {
  id: string
  kind: DiagramBoxKind
  label: string
  x: number
  y: number
  w: number
  h: number
  /** Desenha hachurado, para uma zona caída ou um recurso com falha. */
  failed?: boolean
}

export type DiagramNodeState = 'ok' | 'fail' | 'off'

/** Um recurso. `x` e `y` são o centro do ícone; o rótulo fica embaixo. */
export interface DiagramNode {
  id: string
  x: number
  y: number
  glyph?: GlyphName
  /** Use `\n` para quebrar a linha. */
  label: string
  sub?: string
  state?: DiagramNodeState
  tone?: DiagramTone
  /** Onde fica o rótulo. Padrão: embaixo do ícone. */
  labelSide?: 'below' | 'left' | 'right'
}

export interface DiagramLink {
  /** Id de um nó ou de uma caixa. */
  from: string
  to: string
  style?: 'solid' | 'dashed'
  /** Onde fica a ponta da seta. Padrão: no destino. */
  arrow?: 'end' | 'both' | 'none'
  label?: string
  tone?: DiagramTone
  /** Ligação que não funciona: desenha um X no meio. */
  crossed?: boolean
  /** Pontos intermediários, para contornar outros elementos. */
  via?: [number, number][]
}

export interface DiagramNote {
  x: number
  y: number
  /** Use `\n` para quebrar a linha. */
  text: string
  tone?: DiagramTone
  anchor?: 'start' | 'middle' | 'end'
}

export interface DiagramSpec {
  /** Largura e altura do viewBox. O desenho escala para a largura disponível. */
  width: number
  height: number
  /** Descrição completa do desenho, lida pelos leitores de tela. */
  label: string
  /** Legenda visível embaixo do desenho. */
  caption?: string
  boxes?: DiagramBox[]
  nodes?: DiagramNode[]
  links?: DiagramLink[]
  notes?: DiagramNote[]
}

/** Metade do lado do quadrado do ícone de um nó. */
export const NODE_HALF = 20

export interface Rect {
  x: number
  y: number
  w: number
  h: number
}

export type Point = [number, number]

/** Retângulo ocupado por um elemento do diagrama (o ícone, no caso de um nó). */
export function elementRect(spec: DiagramSpec, id: string): Rect | undefined {
  const node = spec.nodes?.find((n) => n.id === id)
  if (node) return { x: node.x - NODE_HALF, y: node.y - NODE_HALF, w: NODE_HALF * 2, h: NODE_HALF * 2 }
  const box = spec.boxes?.find((b) => b.id === id)
  if (box) return { x: box.x, y: box.y, w: box.w, h: box.h }
  return undefined
}

export function rectCenter(r: Rect): Point {
  return [r.x + r.w / 2, r.y + r.h / 2]
}

/**
 * Ponto da borda de `r` na direção de `toward`, a partir do centro.
 * Se `toward` estiver dentro do retângulo (uma caixa que contém o alvo),
 * a linha sai da borda mais próxima do alvo.
 */
export function anchorOn(r: Rect, toward: Point, gap = 3): Point {
  const [cx, cy] = rectCenter(r)
  const dx = toward[0] - cx
  const dy = toward[1] - cy
  if (dx === 0 && dy === 0) return [cx, cy]
  const inside = toward[0] > r.x && toward[0] < r.x + r.w && toward[1] > r.y && toward[1] < r.y + r.h
  if (inside) {
    const dists: [number, Point][] = [
      [toward[0] - r.x, [r.x, toward[1]]],
      [r.x + r.w - toward[0], [r.x + r.w, toward[1]]],
      [toward[1] - r.y, [toward[0], r.y]],
      [r.y + r.h - toward[1], [toward[0], r.y + r.h]],
    ]
    dists.sort((a, b) => a[0] - b[0])
    return dists[0][1]
  }
  const hw = r.w / 2 + gap
  const hh = r.h / 2 + gap
  const t = Math.min(dx === 0 ? Infinity : hw / Math.abs(dx), dy === 0 ? Infinity : hh / Math.abs(dy))
  return [cx + dx * t, cy + dy * t]
}

/** Pontos da ligação, já presos à borda da origem e do destino. */
export function linkPoints(spec: DiagramSpec, link: DiagramLink): Point[] | undefined {
  const a = elementRect(spec, link.from)
  const b = elementRect(spec, link.to)
  if (!a || !b) return undefined
  const via = link.via ?? []
  const first = via[0] ?? rectCenter(b)
  const last = via[via.length - 1] ?? rectCenter(a)
  return [anchorOn(a, first), ...via, anchorOn(b, last)]
}

/** Ponto no meio do caminho (pelo comprimento), para o rótulo e o X. */
export function midpoint(points: Point[]): Point {
  if (points.length === 1) return points[0]
  const segs = points.slice(1).map((p, i) => Math.hypot(p[0] - points[i][0], p[1] - points[i][1]))
  let half = segs.reduce((s, l) => s + l, 0) / 2
  for (let i = 0; i < segs.length; i++) {
    if (half <= segs[i] || i === segs.length - 1) {
      const t = segs[i] === 0 ? 0 : half / segs[i]
      const [x0, y0] = points[i]
      const [x1, y1] = points[i + 1]
      return [x0 + (x1 - x0) * t, y0 + (y1 - y0) * t]
    }
    half -= segs[i]
  }
  return points[0]
}

/** Problemas de um diagrama (vazio quando está tudo certo). Usado por `validateRegistry`. */
export function diagramProblems(spec: DiagramSpec): string[] {
  const out: string[] = []
  if (!spec.label.trim()) out.push('label vazio')
  if (!(spec.width > 0 && spec.height > 0)) out.push('width/height inválidos')
  const ids = new Set<string>()
  const fits = (id: string, r: Rect) => {
    if (r.x < 0 || r.y < 0 || r.x + r.w > spec.width || r.y + r.h > spec.height) out.push(`"${id}" sai do desenho`)
  }
  for (const el of [...(spec.boxes ?? []), ...(spec.nodes ?? [])]) {
    if (ids.has(el.id)) out.push(`id repetido "${el.id}"`)
    ids.add(el.id)
    if (!el.label.trim()) out.push(`"${el.id}" sem rótulo`)
  }
  for (const b of spec.boxes ?? []) fits(b.id, b)
  for (const n of spec.nodes ?? []) fits(n.id, { x: n.x - NODE_HALF, y: n.y - NODE_HALF, w: NODE_HALF * 2, h: NODE_HALF * 2 })
  for (const l of spec.links ?? []) {
    for (const end of [l.from, l.to]) if (!ids.has(end)) out.push(`ligação para "${end}", que não existe`)
    if (l.from === l.to) out.push(`ligação de "${l.from}" para ele mesmo`)
    for (const [x, y] of l.via ?? []) if (x < 0 || y < 0 || x > spec.width || y > spec.height) out.push(`ponto (${x}, ${y}) fora do desenho`)
  }
  for (const n of spec.notes ?? []) {
    if (!n.text.trim()) out.push('nota vazia')
    if (n.x < 0 || n.y < 0 || n.x > spec.width || n.y > spec.height) out.push(`nota "${n.text.slice(0, 20)}" fora do desenho`)
  }
  return out
}
