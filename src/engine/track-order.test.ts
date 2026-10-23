import { describe, expect, it } from 'vitest'
import { registry } from '../content'
import { recommendedTrackOrder } from './track-order'

describe('recommendedTrackOrder', () => {
  const order = recommendedTrackOrder(registry)
  const pos = new Map(order.map((s, i) => [s.track.id, i]))

  it('lista cada trilha uma vez', () => {
    expect(order).toHaveLength(registry.tracks.size)
    expect(pos.size).toBe(registry.tracks.size)
  })

  it('põe cada trilha depois das que ela exige ou recomenda', () => {
    for (const t of registry.tracks.values()) {
      for (const id of [...(t.requires ?? []), ...(t.recommends ?? [])]) expect(pos.get(id)!).toBeLessThan(pos.get(t.id)!)
    }
  })

  it('põe cada trilha depois das que declaram conceitos que ela reaproveita', () => {
    for (const step of order) {
      for (const a of step.after) expect(pos.get(a.track.id)!).toBeLessThan(pos.get(step.track.id)!)
    }
  })

  it('começa pela AWS Foundations', () => {
    expect(order[0].track.id).toBe('foundations.aws-foundations')
  })

  it('só a AWS Foundations é o ponto de partida', () => {
    expect(order.filter((s) => s.tier === 'start').map((s) => s.track.id)).toEqual(['foundations.aws-foundations'])
  })

  it('a base reúne as trilhas que outra trilha recomenda', () => {
    const declared = new Set([...registry.tracks.values()].flatMap((t) => [...(t.requires ?? []), ...(t.recommends ?? [])]))
    for (const step of order) if (step.tier !== 'start') expect(step.tier === 'base').toBe(declared.has(step.track.id))
  })

  it('os grupos aparecem em blocos contínuos, na ordem partida, base e aprofundamento', () => {
    const rank = { start: 0, base: 1, deeper: 2 }
    for (let i = 1; i < order.length; i++) expect(rank[order[i].tier]).toBeGreaterThanOrEqual(rank[order[i - 1].tier])
  })
})
