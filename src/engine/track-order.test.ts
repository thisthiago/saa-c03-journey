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
})
