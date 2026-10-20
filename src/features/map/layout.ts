/**
 * Geometria do mapa da trilha, compartilhada pelo desenho e pelo teste de
 * layout. Tudo é medido em unidades do canvas (900 × altura da trilha): os
 * nós crescem e encolhem junto com o mapa (CSS em `cqw`), então a mesma
 * posição vale em qualquer largura em que o mapa em grafo aparece.
 */
import type { PhaseDef } from '../../engine/types'

export const MAP_W = 900
export const MAP_H = 720

/** Medidas do nó em unidades do canvas. O CSS em map.module.css usa os mesmos números. */
export const NODE = {
  hex: 64,
  finalHex: 76,
  gap: 5,
  badgeW: 76,
  badgeH: 22,
  labelW: 150,
  lineH: 18,
  /** Caracteres por linha do rótulo, estimados para baixo (fonte de 15 unidades). */
  charsPerLine: 17,
}

/** Folga mínima entre dois nós e entre uma linha e um nó que ela não liga. */
export const CLEARANCE = 8

export interface Point {
  x: number
  y: number
}
export interface Rect {
  x0: number
  y0: number
  x1: number
  y1: number
}

/** Quantas linhas o rótulo ocupa, quebrando por palavras como o navegador. */
export function labelLines(title: string, perLine = NODE.charsPerLine): number {
  let lines = 1
  let used = 0
  for (const word of title.split(/\s+/)) {
    if (used === 0) used = word.length
    else if (used + 1 + word.length <= perLine) used += 1 + word.length
    else {
      lines++
      used = word.length
    }
  }
  return lines
}

/** Retângulos do nó: hexágono, selo (F1, Final) e rótulo, nessa ordem de cima para baixo. */
export function nodeRects(p: PhaseDef, isFinal: boolean): { hex: Rect; badge: Rect; label: Rect } {
  const h = isFinal ? NODE.finalHex : NODE.hex
  const { x, y } = p.map
  const hex = { x0: x - h / 2, y0: y - h / 2, x1: x + h / 2, y1: y + h / 2 }
  const by = hex.y1 + NODE.gap
  const badge = { x0: x - NODE.badgeW / 2, y0: by, x1: x + NODE.badgeW / 2, y1: by + NODE.badgeH }
  const ly = badge.y1 + NODE.gap
  const label = { x0: x - NODE.labelW / 2, y0: ly, x1: x + NODE.labelW / 2, y1: ly + labelLines(p.title) * NODE.lineH }
  return { hex, badge, label }
}

/** Corredores verticais entre as colunas: distância até o rótulo do destino, espaço entre corredores e raio das curvas. */
export const CHANNEL = { offset: 14, step: 10, radius: 12 }

export interface EdgeRoute {
  from: string
  to: string
  /** Vértices da linha: sai na horizontal, desce ou sobe num corredor e entra na horizontal. */
  points: Point[]
  /** Caminho SVG com os cantos arredondados. */
  d: string
}

function roundedPath(points: Point[], radius: number): string {
  let d = `M${points[0].x},${points[0].y}`
  for (let i = 1; i < points.length - 1; i++) {
    const [p, c, n] = [points[i - 1], points[i], points[i + 1]]
    const r = Math.min(radius, Math.hypot(c.x - p.x, c.y - p.y) / 2, Math.hypot(n.x - c.x, n.y - c.y) / 2)
    const toward = (q: Point) => {
      const len = Math.hypot(q.x - c.x, q.y - c.y)
      return { x: c.x + ((q.x - c.x) / len) * r, y: c.y + ((q.y - c.y) / len) * r }
    }
    const [s, e] = [toward(p), toward(n)]
    d += ` L${s.x},${s.y} Q${c.x},${c.y} ${e.x},${e.y}`
  }
  const last = points[points.length - 1]
  return `${d} L${last.x},${last.y}`
}

/**
 * Traçado das dependências, no estilo de um mapa de metrô. Cada linha sai do
 * hexágono de origem na horizontal, muda de altura num corredor vertical logo
 * antes da coluna do destino e entra nele pela esquerda. Linhas com a mesma
 * origem ou o mesmo destino dividem o corredor (bifurcação ou junção); as
 * demais só dividem se os trechos verticais não se encontram.
 */
export function mapRoutes(phases: PhaseDef[], edges: [string, string][]): EdgeRoute[] {
  const byId = new Map(phases.map((p) => [p.id, p.map]))
  const span = ([from, to]: [string, string]) => {
    const [a, b] = [byId.get(from)!.y, byId.get(to)!.y]
    return [Math.min(a, b), Math.max(a, b)]
  }
  const compatible = (e: [string, string], o: [string, string]) => {
    if (e[0] === o[0] || e[1] === o[1]) return true
    const [a0, a1] = span(e)
    const [b0, b1] = span(o)
    return a1 + CHANNEL.radius < b0 || b1 + CHANNEL.radius < a0
  }
  // Canais por coluna de destino, preenchidos de cima para baixo.
  const channels = new Map<number, [string, string][][]>()
  const channelOf = new Map<[string, string], number>()
  for (const e of [...edges].sort((x, y) => span(x)[0] - span(y)[0])) {
    if (byId.get(e[0])!.y === byId.get(e[1])!.y) continue
    const col = channels.get(byId.get(e[1])!.x) ?? []
    channels.set(byId.get(e[1])!.x, col)
    let k = col.findIndex((ch) => ch.every((o) => compatible(e, o)))
    if (k < 0) k = col.push([]) - 1
    col[k].push(e)
    channelOf.set(e, k)
  }
  return edges.map((e) => {
    const a = byId.get(e[0])!
    const b = byId.get(e[1])!
    const k = channelOf.get(e)
    const gx = b.x - NODE.labelW / 2 - CHANNEL.offset - CHANNEL.step * (k ?? 0)
    const points = k === undefined ? [a, b] : [a, { x: gx, y: a.y }, { x: gx, y: b.y }, b]
    return { from: e[0], to: e[1], points, d: roundedPath(points, CHANNEL.radius) }
  })
}

/** Pontos ao longo da linha, para conferir se ela encosta em algum nó. */
function samples(points: Point[], step = 4): Point[] {
  const out: Point[] = []
  for (let i = 1; i < points.length; i++) {
    const [p, q] = [points[i - 1], points[i]]
    const n = Math.max(1, Math.ceil(Math.hypot(q.x - p.x, q.y - p.y) / step))
    for (let k = 0; k <= n; k++) out.push({ x: p.x + ((q.x - p.x) * k) / n, y: p.y + ((q.y - p.y) * k) / n })
  }
  return out
}

const inflate = (r: Rect, m: number): Rect => ({ x0: r.x0 - m, y0: r.y0 - m, x1: r.x1 + m, y1: r.y1 + m })
const overlaps = (a: Rect, b: Rect) => a.x0 < b.x1 && b.x0 < a.x1 && a.y0 < b.y1 && b.y0 < a.y1
const inside = (p: Point, r: Rect) => p.x > r.x0 && p.x < r.x1 && p.y > r.y0 && p.y < r.y1

/** Trechos retos (horizontais ou verticais) de uma linha, sem os cantos arredondados. */
function segments(points: Point[]): { vertical: boolean; at: number; from: number; to: number }[] {
  return points.slice(1).map((q, i) => {
    const p = points[i]
    const vertical = p.x === q.x
    const [u, v] = vertical ? [p.y, q.y] : [p.x, q.x]
    return { vertical, at: vertical ? p.x : p.y, from: Math.min(u, v) + CHANNEL.radius, to: Math.max(u, v) - CHANNEL.radius }
  })
}

/**
 * Problemas de layout de uma trilha: nós fora do canvas, nós que se sobrepõem,
 * linhas que passam por cima de um nó que não ligam (ou do selo e do rótulo
 * dos nós que ligam), linhas sem relação que correm uma sobre a outra e
 * dependências desenhadas da direita para a esquerda.
 */
export function layoutProblems(phases: PhaseDef[], edges: [string, string][], finalId: string | undefined, height = MAP_H): string[] {
  const problems: string[] = []
  const rects = new Map(phases.map((p) => [p.id, nodeRects(p, p.id === finalId)]))
  const canvas = { x0: 0, y0: 0, x1: MAP_W, y1: height }

  for (const p of phases) {
    for (const r of Object.values(rects.get(p.id)!)) {
      if (r.x0 < canvas.x0 || r.y0 < canvas.y0 || r.x1 > canvas.x1 || r.y1 > canvas.y1) {
        problems.push(`${p.id}: sai do mapa`)
        break
      }
    }
  }

  for (let i = 0; i < phases.length; i++) {
    for (let j = i + 1; j < phases.length; j++) {
      const a = Object.values(rects.get(phases[i].id)!)
      const b = Object.values(rects.get(phases[j].id)!).map((r) => inflate(r, CLEARANCE))
      if (a.some((ra) => b.some((rb) => overlaps(ra, rb)))) problems.push(`${phases[i].id} e ${phases[j].id}: nós sobrepostos`)
    }
  }

  const byId = new Map(phases.map((p) => [p.id, p]))
  const routes = mapRoutes(phases, edges)
  for (const { from, to, points } of routes) {
    if (byId.get(to)!.map.x - byId.get(from)!.map.x < NODE.labelW + 2 * CHANNEL.offset) problems.push(`${from} para ${to}: a dependência precisa ficar à esquerda, com espaço para a linha`)
    const pts = samples(points)
    for (const p of phases) {
      const r = rects.get(p.id)!
      // Nas pontas, a linha encosta no próprio hexágono, mas não no selo nem no rótulo.
      const blocked = p.id === from || p.id === to ? [r.badge, r.label] : [r.hex, r.badge, r.label]
      if (pts.some((pt) => blocked.some((rb) => inside(pt, inflate(rb, CLEARANCE / 2))))) problems.push(`${from} para ${to}: a linha passa por cima de ${p.id}`)
    }
  }

  // Duas linhas sem fase em comum não podem correr juntas: o mapa deixaria de mostrar quem liga a quem.
  for (let i = 0; i < routes.length; i++) {
    for (let j = i + 1; j < routes.length; j++) {
      const [a, b] = [routes[i], routes[j]]
      if (a.from === b.from || a.to === b.to) continue
      const together = segments(a.points).some((s) => segments(b.points).some((o) => s.vertical === o.vertical && Math.abs(s.at - o.at) < CLEARANCE / 2 && s.from < o.to && o.from < s.to))
      if (together) problems.push(`${a.from} para ${a.to} e ${b.from} para ${b.to}: linhas sobrepostas`)
    }
  }
  return problems
}
