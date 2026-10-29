/// <reference types="node" />
/**
 * Mapa de serviços sem React: layout determinístico e legível, raio, vista,
 * teclado, filtros, busca e cores dos territórios.
 */
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { registry } from '../../content'
import { buildServiceGraph } from '../../engine/service-graph'
import {
  centerOn,
  fitView,
  layoutServices,
  matchesFilter,
  nearestInDirection,
  NODE_GAP,
  RADIUS,
  radiusFor,
  searchServices,
  shortLabel,
  territoryLabelBox,
  visibleLabels,
  WORLD,
  zoomAt,
  type PlacedNode,
} from './service-map'

const graph = buildServiceGraph(registry)
const layout = layoutServices(graph, registry.territories)

describe('layout do mapa de serviços', () => {
  it('é determinístico', () => {
    const again = layoutServices(graph, registry.territories)
    expect(again.nodes).toEqual(layout.nodes)
    expect(again.territories).toEqual(layout.territories)
  })

  it('não sobrepõe nós e fica dentro do mundo', () => {
    for (let i = 0; i < layout.nodes.length; i++) {
      const a = layout.nodes[i]
      expect(a.x - a.r).toBeGreaterThanOrEqual(0)
      expect(a.y - a.r).toBeGreaterThanOrEqual(0)
      expect(a.x + a.r).toBeLessThanOrEqual(WORLD.w)
      expect(a.y + a.r).toBeLessThanOrEqual(WORLD.h)
      for (let j = i + 1; j < layout.nodes.length; j++) {
        const b = layout.nodes[j]
        expect(Math.hypot(a.x - b.x, a.y - b.y) - a.r - b.r, `${a.id} e ${b.id}`).toBeGreaterThanOrEqual(NODE_GAP - 0.5)
      }
    }
  })

  it('cada nó fica mais perto do centro do próprio território', () => {
    const centers = new Map(
      layout.ring.map((t) => {
        const ms = layout.nodes.filter((n) => n.territory === t)
        return [t, { x: ms.reduce((s, n) => s + n.x, 0) / ms.length, y: ms.reduce((s, n) => s + n.y, 0) / ms.length }]
      }),
    )
    for (const n of layout.nodes) {
      const own = centers.get(n.territory)!
      const d = Math.hypot(n.x - own.x, n.y - own.y)
      for (const [t, c] of centers) if (t !== n.territory) expect(Math.hypot(n.x - c.x, n.y - c.y), n.id).toBeGreaterThan(d)
    }
  })

  it('o nome de cada território não cobre nós nem outro nome', () => {
    const hit = (a: { x0: number; y0: number; x1: number; y1: number }, b: typeof a) => a.x0 < b.x1 && b.x0 < a.x1 && a.y0 < b.y1 && b.y0 < a.y1
    for (const l of layout.territories) {
      const box = territoryLabelBox(l)
      for (const n of layout.nodes) expect(hit(box, { x0: n.x - n.r, y0: n.y - n.r, x1: n.x + n.r, y1: n.y + n.r }), `${l.id} e ${n.id}`).toBe(false)
      for (const o of layout.territories) if (o !== l) expect(hit(box, territoryLabelBox(o)), `${l.id} e ${o.id}`).toBe(false)
    }
  })

  it('tem um nó por serviço e um nome por território com serviço', () => {
    expect(layout.nodes.map((n) => n.id).sort()).toEqual(graph.nodes.map((n) => n.id).sort())
    expect(new Set(layout.ring)).toEqual(new Set(graph.nodes.map((n) => n.territory)))
  })
})

describe('raio e rótulos', () => {
  it('o raio fica entre os limites e cresce com as questões', () => {
    expect(radiusFor(0, 77)).toBe(RADIUS.min)
    expect(radiusFor(77, 77)).toBeCloseTo(RADIUS.max)
    expect(radiusFor(10, 77)).toBeGreaterThan(radiusFor(2, 77))
    expect(radiusFor(5, 0)).toBe(RADIUS.min)
  })

  it('o rótulo tira só o prefixo do fornecedor', () => {
    expect(shortLabel('Amazon S3')).toBe('S3')
    expect(shortLabel('AWS Lambda')).toBe('Lambda')
    expect(shortLabel('IAM Identity Center')).toBe('IAM Identity Center')
  })

  it('rótulos obrigatórios aparecem sempre e os demais não se sobrepõem', () => {
    const text = (id: string) => shortLabel(registry.services.get(id)!.shortName)
    const small = [...layout.nodes].sort((a, b) => a.r - b.r)[0].id
    const shown = visibleLabels(layout.nodes, text, 0.7, [small])
    expect(shown.has(small)).toBe(true)
    expect(shown.size).toBeGreaterThan(5)
    expect(shown.size).toBeLessThan(layout.nodes.length)
    expect(visibleLabels(layout.nodes, text, 3).size).toBeGreaterThan(visibleLabels(layout.nodes, text, 0.5).size)
  })
})

describe('vista e teclado', () => {
  it('fitView contém o desenho e zoomAt mantém o ponto sob o cursor', () => {
    const v = fitView(layout.bounds, 800, 600)
    expect(layout.bounds.x0 * v.k + v.x).toBeGreaterThanOrEqual(0)
    expect(layout.bounds.x1 * v.k + v.x).toBeLessThanOrEqual(800.001)
    expect(layout.bounds.y1 * v.k + v.y).toBeLessThanOrEqual(600.001)
    const z = zoomAt(v, 2, 300, 200, 0.1)
    const wx = (300 - v.x) / v.k
    expect(wx * z.k + z.x).toBeCloseTo(300)
    expect(zoomAt(v, 1000, 0, 0, 0.1).k).toBe(4)
    const c = centerOn(100, 50, 800, 600, 2)
    expect(100 * c.k + c.x).toBe(400)
    expect(50 * c.k + c.y).toBe(300)
  })

  it('a seta leva ao nó mais próximo naquela direção', () => {
    const n = (id: string, x: number, y: number): PlacedNode => ({ id, territory: 't', x, y, r: 5 })
    const nodes = [n('o', 0, 0), n('dir', 50, 5), n('longe', 200, 0), n('cima', 0, -40), n('diag', 40, -60)]
    expect(nearestInDirection(nodes[0], nodes, 'right')).toBe('dir')
    expect(nearestInDirection(nodes[0], nodes, 'up')).toBe('cima')
    expect(nearestInDirection(nodes[0], nodes, 'left')).toBeUndefined()
  })
})

describe('filtros e busca', () => {
  it('combina situação e territórios', () => {
    const all = { status: 'todos' as const, territories: [] }
    expect(matchesFilter('locked', 'redes', all)).toBe(true)
    expect(matchesFilter('locked', 'redes', { status: 'desbloqueados', territories: [] })).toBe(false)
    expect(matchesFilter('completed', 'redes', { status: 'desbloqueados', territories: [] })).toBe(true)
    expect(matchesFilter('in-progress', 'redes', { status: 'em-andamento', territories: ['redes'] })).toBe(true)
    expect(matchesFilter('in-progress', 'redes', { status: 'em-andamento', territories: ['analise'] })).toBe(false)
    expect(matchesFilter('completed', 'analise', { status: 'concluidos', territories: ['analise', 'redes'] })).toBe(true)
    expect(matchesFilter('available', 'analise', { status: 'bloqueados', territories: [] })).toBe(false)
  })

  it('busca por sigla, nome oficial e sem acento, inclusive serviços bloqueados', () => {
    const items = graph.nodes.map((n) => ({ ...registry.services.get(n.id)!, questions: n.questions }))
    expect(searchServices(items, 's3')[0]).toBe('aws.s3')
    expect(searchServices(items, 'LAMBDA')[0]).toBe('aws.lambda')
    expect(searchServices(items, 'simple storage')).toContain('aws.s3')
    expect(searchServices(items, 'transit')).toContain('aws.transit-gateway')
    expect(searchServices(items, '   ')).toEqual([])
    expect(searchServices(items, 'zzzz')).toEqual([])
  })
})

describe('cores dos territórios', () => {
  it('tokens.css define a cor de todo território nos três escopos de tema', () => {
    // Lido do disco: o Vitest entrega o CSS processado, sem as variáveis.
    const css = readFileSync('src/styles/tokens.css', 'utf8')
    for (const t of registry.territories) expect(css.match(new RegExp(`--territory-${t.id}:`, 'g'))?.length, t.id).toBe(3)
    expect(css.match(/--node-locked:/g)?.length).toBe(3)
  })
})
