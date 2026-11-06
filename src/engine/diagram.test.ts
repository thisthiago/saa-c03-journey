import { describe, expect, it } from 'vitest'
import { anchorOn, diagramProblems, linkPoints, midpoint, type DiagramSpec } from './diagram'

const SPEC: DiagramSpec = {
  width: 400,
  height: 200,
  label: 'VPC com uma sub-rede e um internet gateway',
  boxes: [{ id: 'vpc', kind: 'vpc', label: 'VPC', x: 100, y: 20, w: 280, h: 160 }],
  nodes: [
    { id: 'igw', x: 100, y: 100, glyph: 'globe', label: 'IGW' },
    { id: 'web', x: 260, y: 100, glyph: 'server', label: 'web' },
  ],
  links: [{ from: 'igw', to: 'web' }],
}

describe('anchorOn', () => {
  it('sai pela borda na direção do alvo', () => {
    expect(anchorOn({ x: 0, y: 0, w: 20, h: 20 }, [100, 10], 0)).toEqual([20, 10])
    expect(anchorOn({ x: 0, y: 0, w: 20, h: 20 }, [10, -50], 0)).toEqual([10, 0])
  })
  it('com o alvo dentro da caixa, usa a borda mais próxima dele', () => {
    expect(anchorOn({ x: 0, y: 0, w: 100, h: 100 }, [90, 40])).toEqual([100, 40])
  })
})

describe('linkPoints', () => {
  it('liga as bordas dos ícones, não os centros', () => {
    const pts = linkPoints(SPEC, SPEC.links![0])!
    expect(pts[0][0]).toBeGreaterThan(100)
    expect(pts[1][0]).toBeLessThan(260)
    expect(pts[0][1]).toBe(100)
  })
  it('passa pelos pontos intermediários', () => {
    const pts = linkPoints(SPEC, { from: 'igw', to: 'web', via: [[180, 160]] })!
    expect(pts).toHaveLength(3)
    expect(pts[1]).toEqual([180, 160])
  })
})

describe('midpoint', () => {
  it('fica no meio do comprimento total', () => {
    expect(midpoint([[0, 0], [10, 0], [10, 10]])).toEqual([10, 0])
  })
})

describe('diagramProblems', () => {
  it('aceita um desenho correto', () => {
    expect(diagramProblems(SPEC)).toEqual([])
  })
  it('aponta ligação para id inexistente, elemento fora do desenho e id repetido', () => {
    const bad: DiagramSpec = {
      ...SPEC,
      nodes: [...SPEC.nodes!, { id: 'web', x: 390, y: 100, label: 'de novo' }],
      links: [{ from: 'igw', to: 'nat' }],
    }
    const problems = diagramProblems(bad)
    expect(problems).toContain('id repetido "web"')
    expect(problems).toContain('"web" sai do desenho')
    expect(problems).toContain('ligação para "nat", que não existe')
  })
})
