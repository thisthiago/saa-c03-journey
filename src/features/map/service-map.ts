/**
 * Geometria e regras de tela do mapa de serviços, sem React: posição dos nós,
 * raio, rótulos visíveis, zoom, navegação por teclado, filtros e busca.
 *
 * O layout roda uma vez, de forma determinística (semente fixa e posição
 * inicial calculada): a mesma versão do conteúdo gera sempre o mesmo desenho,
 * e nenhuma interação reorganiza os nós.
 */
import { forceCollide, forceLink, forceManyBody, forceSimulation, forceX, forceY, type SimulationLinkDatum, type SimulationNodeDatum } from 'd3-force'
import { otherEnd, type ServiceGraph, type ServiceStatus } from '../../engine/service-graph'
import type { TerritoryDef } from '../../engine/types'

/** Tamanho do mundo do desenho, em unidades do SVG. */
export const WORLD = { w: 1200, h: 800 }
export const RADIUS = { min: 7, max: 22 }
/** Folga mínima entre dois nós depois do layout. */
export const NODE_GAP = 4

/**
 * Raio pelo número de questões do banco que citam o serviço, em escala
 * logarítmica: a ordem fica visível sem que um serviço domine o desenho.
 */
export function radiusFor(questions: number, max: number): number {
  if (max <= 0) return RADIUS.min
  return RADIUS.min + ((RADIUS.max - RADIUS.min) * Math.log1p(Math.max(0, questions))) / Math.log1p(max)
}

/** Nome curto do rótulo no mapa: sem o prefixo "Amazon " ou "AWS ". */
export function shortLabel(shortName: string): string {
  return shortName.replace(/^(Amazon|AWS) /, '')
}

// ---------------------------------------------------------------------------
// Layout
// ---------------------------------------------------------------------------

export interface PlacedNode {
  id: string
  territory: string
  x: number
  y: number
  r: number
}

export interface TerritoryLabel {
  id: string
  title: string
  x: number
  y: number
}

export interface ServiceLayout {
  nodes: PlacedNode[]
  byId: Map<string, PlacedNode>
  territories: TerritoryLabel[]
  /** Ordem dos territórios no anel (vizinhos no anel ficam lado a lado no desenho). */
  ring: string[]
  bounds: { x0: number; y0: number; x1: number; y1: number }
}

/** Soma dos pesos das ligações entre cada par de territórios. */
function territoryAffinity(graph: ServiceGraph): Map<string, number> {
  const aff = new Map<string, number>()
  for (const e of graph.edges) {
    const a = graph.byId.get(e.source)!.territory
    const b = graph.byId.get(e.target)!.territory
    if (a === b) continue
    const key = a < b ? `${a}|${b}` : `${b}|${a}`
    aff.set(key, (aff.get(key) ?? 0) + e.conceptIds.length)
  }
  return aff
}

/**
 * Ordem dos territórios no anel: começa pelo maior, acrescenta sempre o mais
 * ligado ao último e depois melhora com trocas 2-opt. Territórios muito
 * ligados ficam vizinhos, o que encurta as linhas entre eles.
 */
export function territoryRing(graph: ServiceGraph, territories: TerritoryDef[]): string[] {
  const used = territories.map((t) => t.id).filter((id) => graph.nodes.some((n) => n.territory === id))
  if (used.length <= 3) return used
  const aff = territoryAffinity(graph)
  const w = (a: string, b: string) => aff.get(a < b ? `${a}|${b}` : `${b}|${a}`) ?? 0
  const size = (t: string) => graph.nodes.filter((n) => n.territory === t).length
  const start = [...used].sort((a, b) => size(b) - size(a))[0]
  const ring = [start]
  const left = used.filter((t) => t !== start)
  while (left.length) {
    const last = ring[ring.length - 1]
    let best = 0
    for (let i = 1; i < left.length; i++) if (w(last, left[i]) > w(last, left[best])) best = i
    ring.push(left.splice(best, 1)[0])
  }
  const n = ring.length
  for (let improved = true, guard = 0; improved && guard < 50; guard++) {
    improved = false
    for (let i = 0; i < n - 1; i++) {
      for (let j = i + 2; j < n; j++) {
        const a = ring[i]
        const b = ring[i + 1]
        const c = ring[j]
        const d = ring[(j + 1) % n]
        if (d === a) continue
        if (w(a, c) + w(b, d) > w(a, b) + w(c, d)) {
          ring.splice(i + 1, j - i, ...ring.slice(i + 1, j + 1).reverse())
          improved = true
        }
      }
    }
  }
  return ring
}

/** Gerador congruencial com semente fixa: o mesmo desenho em toda carga. */
function lcg(seed: number) {
  let s = seed >>> 0
  return () => (s = (Math.imul(1664525, s) + 1013904223) >>> 0) / 4294967296
}

interface SimNode extends SimulationNodeDatum {
  id: string
  territory: string
  r: number
}
interface SimLink extends SimulationLinkDatum<SimNode> {
  weight: number
  same: boolean
}

export function layoutServices(graph: ServiceGraph, territories: TerritoryDef[]): ServiceLayout {
  const ring = territoryRing(graph, territories)
  const r = new Map(graph.nodes.map((n) => [n.id, radiusFor(n.questions, graph.maxQuestions)]))

  // Centros dos territórios numa elipse, com arco proporcional ao tamanho do grupo.
  // Grupos pequenos com nome longo ganham arco suficiente para o nome caber sem invadir o vizinho.
  const title = (t: string) => territories.find((d) => d.id === t)?.title ?? t
  const weight = new Map(
    ring.map((t) => [t, Math.max(Math.sqrt(graph.nodes.filter((n) => n.territory === t).reduce((s, n) => s + (r.get(n.id)! + NODE_GAP) ** 2, 0)), labelWidth(title(t)) * 0.75)]),
  )
  const totalWeight = [...weight.values()].reduce((a, b) => a + b, 0)
  const anchors = new Map<string, { x: number; y: number }>()
  let angle = -Math.PI / 2
  for (const t of ring) {
    const span = (2 * Math.PI * weight.get(t)!) / totalWeight
    const mid = angle + span / 2
    anchors.set(t, { x: WORLD.w / 2 + Math.cos(mid) * WORLD.w * 0.34, y: WORLD.h / 2 + Math.sin(mid) * WORLD.h * 0.33 })
    angle += span
  }

  // Posição inicial em filotaxia em volta do centro do território, maiores no meio.
  const golden = Math.PI * (3 - Math.sqrt(5))
  const sim: SimNode[] = []
  for (const t of ring) {
    const a = anchors.get(t)!
    const members = graph.nodes.filter((n) => n.territory === t).sort((x, y) => y.questions - x.questions || x.id.localeCompare(y.id))
    members.forEach((n, i) => {
      const rr = 14 * Math.sqrt(i + 0.5)
      sim.push({ id: n.id, territory: t, r: r.get(n.id)!, x: a.x + rr * Math.cos(i * golden), y: a.y + rr * Math.sin(i * golden) })
    })
  }
  const links: SimLink[] = graph.edges.map((e) => ({
    source: e.source,
    target: e.target,
    weight: Math.min(3, e.conceptIds.length),
    same: graph.byId.get(e.source)!.territory === graph.byId.get(e.target)!.territory,
  }))

  const simulation = forceSimulation<SimNode, SimLink>(sim)
    .randomSource(lcg(20261029))
    .force(
      'link',
      forceLink<SimNode, SimLink>(links)
        .id((d) => d.id)
        .distance((l) => (l.source as SimNode).r + (l.target as SimNode).r + 26)
        .strength((l) => (l.same ? 0.03 + 0.04 * l.weight : 0.004 * l.weight)),
    )
    .force('charge', forceManyBody<SimNode>().strength(-30).distanceMax(180))
    .force('collide', forceCollide<SimNode>((d) => d.r + NODE_GAP + 2).iterations(2))
    .force('x', forceX<SimNode>((d) => anchors.get(d.territory)!.x).strength(0.12))
    .force('y', forceY<SimNode>((d) => anchors.get(d.territory)!.y).strength(0.12))
    .stop()
  simulation.tick(260)
  // Passada final só de colisão: garante a folga entre os nós.
  simulation.force('link', null).force('charge', null).force('x', forceX<SimNode>((d) => anchors.get(d.territory)!.x).strength(0.01)).force('y', forceY<SimNode>((d) => anchors.get(d.territory)!.y).strength(0.01))
  simulation.alpha(0.3).tick(80)

  const round = (v: number) => Math.round(v * 10) / 10
  const nodes: PlacedNode[] = sim.map((n) => ({ id: n.id, territory: n.territory, x: round(n.x!), y: round(n.y!), r: round(n.r) }))
  const byId = new Map(nodes.map((n) => [n.id, n]))

  // Nome de cada território acima do grupo (ou abaixo, se o espaço de cima estiver ocupado),
  // afastado enquanto cobrir um nó ou um nome já posicionado.
  const labels: TerritoryLabel[] = []
  for (const t of ring) {
    const members = nodes.filter((n) => n.territory === t)
    const x = round(members.reduce((s, n) => s + n.x, 0) / members.length)
    const name = title(t)
    const top = Math.min(...members.map((n) => n.y - n.r))
    const bottom = Math.max(...members.map((n) => n.y + n.r))
    const place = (y: number, dir: -1 | 1) => {
      const label = { id: t, title: name, x, y: round(y) }
      for (let guard = 0; guard < 30; guard++) {
        const box = territoryLabelBox(label)
        const hits = [
          ...nodes.filter((n) => overlaps(box, { x0: n.x - n.r, y0: n.y - n.r, x1: n.x + n.r, y1: n.y + n.r })).map((n) => (dir < 0 ? n.y - n.r : n.y + n.r)),
          ...labels.filter((l) => overlaps(box, territoryLabelBox(l))).map((l) => (dir < 0 ? territoryLabelBox(l).y0 : territoryLabelBox(l).y1)),
        ]
        if (hits.length === 0) break
        label.y = round(dir < 0 ? Math.min(...hits) - 6 : Math.max(...hits) + TERRITORY_FONT + (territoryLines(name).length - 1) * TERRITORY_LINE + 6)
      }
      return label
    }
    const above = place(top - 10, -1)
    const belowStart = bottom + TERRITORY_FONT + (territoryLines(name).length - 1) * TERRITORY_LINE + 8
    const below = place(belowStart, 1)
    // Do lado de fora do anel quando possível: grupos da metade de baixo levam o nome embaixo.
    const outwardBelow = (top + bottom) / 2 > WORLD.h / 2
    const costAbove = top - 10 - above.y + (outwardBelow ? 20 : 0)
    const costBelow = below.y - belowStart + (outwardBelow ? 0 : 20)
    labels.push(costAbove <= costBelow ? above : below)
  }

  const x0 = Math.min(...nodes.map((n) => n.x - n.r), ...labels.map((l) => territoryLabelBox(l).x0))
  const x1 = Math.max(...nodes.map((n) => n.x + n.r), ...labels.map((l) => territoryLabelBox(l).x1))
  const y0 = Math.min(...nodes.map((n) => n.y - n.r), ...labels.map((l) => territoryLabelBox(l).y0))
  const y1 = Math.max(...nodes.map((n) => n.y + n.r + 18), ...labels.map((l) => l.y + 4))
  return { nodes, byId, territories: labels, ring, bounds: { x0, y0, x1, y1 } }
}

/** Fonte do nome do território, em unidades do mundo (cresce com o zoom, como num mapa). */
export const TERRITORY_FONT = 13

export const TERRITORY_LINE = TERRITORY_FONT + 3

/** Nome do território em uma linha ou, se for longo, em duas, quebrando no espaço mais perto do meio. */
export function territoryLines(title: string): string[] {
  if (title.length <= 16) return [title]
  const spaces = [...title].map((c, i) => (c === ' ' ? i : -1)).filter((i) => i > 0)
  if (spaces.length === 0) return [title]
  const cut = spaces.reduce((best, i) => (Math.abs(i - title.length / 2) < Math.abs(best - title.length / 2) ? i : best))
  return [title.slice(0, cut), title.slice(cut + 1)]
}

/** Largura estimada do nome de um território (caixa alta e espaçada). */
export function labelWidth(title: string): number {
  return Math.max(...territoryLines(title).map((l) => l.length)) * TERRITORY_FONT * 0.82
}

/** Área ocupada pelo nome do território; `y` é a linha de base da última linha. */
export function territoryLabelBox(l: { title: string; x: number; y: number }): Box {
  const w = labelWidth(l.title)
  const extra = (territoryLines(l.title).length - 1) * TERRITORY_LINE
  return { x0: l.x - w / 2, y0: l.y - TERRITORY_FONT - extra, x1: l.x + w / 2, y1: l.y + 4 }
}

// ---------------------------------------------------------------------------
// Rótulos dos nós
// ---------------------------------------------------------------------------

/** Largura estimada de um rótulo de nó, em pixels de tela (fonte de 12). */
export function nodeLabelPx(text: string): number {
  return text.length * 6.6 + 6
}

export interface Box {
  x0: number
  y0: number
  x1: number
  y1: number
}
const overlaps = (a: Box, b: Box) => a.x0 < b.x1 && b.x0 < a.x1 && a.y0 < b.y1 && b.y0 < a.y1

/**
 * Rótulos que cabem sem se sobrepor no zoom `k`. Os obrigatórios (selecionado,
 * focado) entram sempre. Depois vêm os preferidos (vizinhos do selecionado) e
 * os demais, do maior nó para o menor; esses só entram se o rótulo não cobre
 * outro rótulo nem o centro de outro nó, e os demais só se o nó aparece grande o bastante.
 */
export function visibleLabels(
  nodes: PlacedNode[],
  text: (id: string) => string,
  k: number,
  forced: string[] = [],
  preferred: string[] = [],
  /** Áreas que os rótulos opcionais não podem cobrir (nomes dos territórios). */
  obstacles: Box[] = [],
): Set<string> {
  const byId = new Map(nodes.map((n) => [n.id, n]))
  const boxOf = (n: PlacedNode): Box => {
    const w = nodeLabelPx(text(n.id)) / k
    const top = n.y + n.r + 3 / k
    return { x0: n.x - w / 2, y0: top, x1: n.x + w / 2, y1: top + 15 / k }
  }
  const placed: Box[] = []
  const shown = new Set<string>()
  for (const id of forced) {
    const n = byId.get(id)
    if (!n || shown.has(id)) continue
    shown.add(id)
    placed.push(boxOf(n))
  }
  const pref = preferred.map((id) => byId.get(id)).filter((n): n is PlacedNode => Boolean(n) && !shown.has(n!.id))
  const rest = nodes.filter((n) => !shown.has(n.id) && !preferred.includes(n.id) && n.r * k >= 6.5).sort((a, b) => b.r - a.r || a.id.localeCompare(b.id))
  for (const n of [...pref, ...rest]) {
    const box = boxOf(n)
    if (placed.some((p) => overlaps(p, box)) || obstacles.some((o) => overlaps(o, box))) continue
    // O contorno do rótulo deixa ler por cima da borda de um nó, mas não por cima do centro dele.
    if (nodes.some((o) => o !== n && o.x > box.x0 && o.x < box.x1 && o.y > box.y0 && o.y < box.y1)) continue
    shown.add(n.id)
    placed.push(box)
  }
  return shown
}

// ---------------------------------------------------------------------------
// Vista (zoom e deslocamento)
// ---------------------------------------------------------------------------

/** Ponto na tela = ponto no mundo × k + (x, y). */
export interface View {
  x: number
  y: number
  k: number
}
export const MAX_ZOOM = 4

/** Enquadra o desenho inteiro; `right` reserva uma faixa à direita (os botões de zoom). */
export function fitView(bounds: ServiceLayout['bounds'], width: number, height: number, pad = 16, right = 0): View {
  const bw = Math.max(1, bounds.x1 - bounds.x0)
  const bh = Math.max(1, bounds.y1 - bounds.y0)
  const w = Math.max(1, width - right)
  const k = Math.max(0.05, Math.min((w - 2 * pad) / bw, (height - 2 * pad) / bh))
  return { k, x: (w - bw * k) / 2 - bounds.x0 * k, y: (height - bh * k) / 2 - bounds.y0 * k }
}

/** Zoom mantendo fixo o ponto da tela (px, py). */
export function zoomAt(v: View, factor: number, px: number, py: number, kMin: number, kMax = MAX_ZOOM): View {
  const k = Math.min(kMax, Math.max(kMin, v.k * factor))
  const f = k / v.k
  return { k, x: px - (px - v.x) * f, y: py - (py - v.y) * f }
}

export function centerOn(wx: number, wy: number, width: number, height: number, k: number): View {
  return { k, x: width / 2 - wx * k, y: height / 2 - wy * k }
}

// ---------------------------------------------------------------------------
// Teclado
// ---------------------------------------------------------------------------

export type Direction = 'left' | 'right' | 'up' | 'down'
const DIR: Record<Direction, [number, number]> = { left: [-1, 0], right: [1, 0], up: [0, -1], down: [0, 1] }

/** Nó mais próximo na direção da seta, num cone de 60° para cada lado. */
export function nearestInDirection(from: PlacedNode, candidates: PlacedNode[], dir: Direction): string | undefined {
  const [dx, dy] = DIR[dir]
  let best: string | undefined
  let bestScore = Infinity
  for (const c of candidates) {
    if (c.id === from.id) continue
    const vx = c.x - from.x
    const vy = c.y - from.y
    const dist = Math.hypot(vx, vy)
    if (dist === 0) continue
    const along = (vx * dx + vy * dy) / dist
    if (along < 0.5) continue
    const score = dist * (1 + 2 * (1 - along))
    if (score < bestScore) {
      bestScore = score
      best = c.id
    }
  }
  return best
}

// ---------------------------------------------------------------------------
// Filtros e busca
// ---------------------------------------------------------------------------

export type StatusFilter = 'todos' | 'desbloqueados' | 'em-andamento' | 'concluidos' | 'bloqueados'
export const STATUS_FILTERS: StatusFilter[] = ['todos', 'desbloqueados', 'em-andamento', 'concluidos', 'bloqueados']

export interface ServiceFilter {
  status: StatusFilter
  /** Territórios escolhidos; vazio significa todos. */
  territories: string[]
}

export function matchesFilter(status: ServiceStatus, territory: string, f: ServiceFilter): boolean {
  if (f.territories.length > 0 && !f.territories.includes(territory)) return false
  switch (f.status) {
    case 'desbloqueados':
      return status !== 'locked'
    case 'em-andamento':
      return status === 'in-progress'
    case 'concluidos':
      return status === 'completed'
    case 'bloqueados':
      return status === 'locked'
    default:
      return true
  }
}

export const normalizeText = (t: string) => t.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase()

export interface SearchItem {
  id: string
  shortName: string
  officialName: string
  questions: number
}

/**
 * Serviços cujo nome curto, nome oficial ou id contém o termo, sem diferenciar
 * acento nem caixa. Começo do nome vem antes de começo de palavra, que vem
 * antes de um trecho no meio; empates ficam com o serviço de mais questões.
 * Serviços bloqueados também aparecem: o nome não é conteúdo restrito.
 */
export function searchServices(items: SearchItem[], query: string, limit = 8): string[] {
  const q = normalizeText(query.trim())
  if (!q) return []
  const rank = (it: SearchItem): number => {
    const names = [shortLabel(it.shortName), it.shortName, it.officialName, it.id.replace(/^aws\./, '')].map(normalizeText)
    if (names.some((n) => n.startsWith(q))) return 0
    if (names.some((n) => n.split(/[\s().-]+/).some((w) => w.startsWith(q)))) return 1
    if (names.some((n) => n.includes(q))) return 2
    return -1
  }
  return items
    .map((it) => ({ it, r: rank(it) }))
    .filter((x) => x.r >= 0)
    .sort((a, b) => a.r - b.r || b.it.questions - a.it.questions || a.it.shortName.localeCompare(b.it.shortName))
    .slice(0, limit)
    .map((x) => x.it.id)
}

/** Vizinhos do serviço (ids), do mais ligado ao menos ligado. */
export function neighborIds(graph: ServiceGraph, id: string): string[] {
  return (graph.neighbors.get(id) ?? []).map((e) => otherEnd(e, id))
}
