/**
 * Ordem sugerida das trilhas, derivada do conteúdo: uma trilha vem depois das
 * que ela exige ou recomenda e das que declaram conceitos que ela reaproveita.
 * Nada aqui é escrito à mão; uma trilha nova entra na ordem sozinha.
 */
import { trackPhases, type Registry } from './registry'
import type { TrackDef } from './types'

export interface TrackOrderStep {
  track: TrackDef
  /** Trilhas que devem vir antes, com os conceitos reaproveitados de cada uma. */
  after: { track: TrackDef; explicit: boolean; concepts: string[] }[]
}

/** Trilha dona de cada conceito: a do módulo que o declara. */
function conceptOwners(reg: Registry): Map<string, string> {
  const owner = new Map<string, string>()
  for (const m of reg.modules) {
    const track = m.tracks[0]
    if (!track) continue
    for (const c of m.concepts) owner.set(c.id, track.id)
  }
  return owner
}

export function recommendedTrackOrder(reg: Registry): TrackOrderStep[] {
  const tracks = [...reg.tracks.values()]
  const rank = new Map(tracks.map((t, i) => [t.id, i]))
  const owner = conceptOwners(reg)
  const deps = new Map<string, Map<string, { explicit: boolean; concepts: string[] }>>()
  for (const t of tracks) {
    const d = new Map<string, { explicit: boolean; concepts: string[] }>()
    for (const id of [...(t.requires ?? []), ...(t.recommends ?? [])]) if (reg.tracks.has(id)) d.set(id, { explicit: true, concepts: [] })
    for (const p of trackPhases(t)) {
      for (const c of p.concepts) {
        const o = owner.get(c)
        if (!o || o === t.id) continue
        const entry = d.get(o) ?? { explicit: false, concepts: [] }
        if (!entry.concepts.includes(c)) entry.concepts.push(c)
        d.set(o, entry)
      }
    }
    deps.set(t.id, d)
  }

  // Reaproveitamento que contradiz uma dependência declarada (A recomenda B, mas
  // B usa um conceito declarado em A) não vira dependência: a declarada vence.
  for (const [id, d] of deps) {
    for (const [other, entry] of d) {
      if (!entry.explicit && deps.get(other)?.get(id)?.explicit) d.delete(other)
    }
  }

  // Kahn com desempate pela ordem dos módulos; um ciclo restante é quebrado pela mesma ordem.
  const placed = new Set<string>()
  const order: TrackOrderStep[] = []
  while (order.length < tracks.length) {
    const pending = tracks.filter((t) => !placed.has(t.id))
    const ready = pending.filter((t) => [...deps.get(t.id)!.keys()].every((o) => placed.has(o)))
    const next = (ready.length ? ready : pending).sort((a, b) => rank.get(a.id)! - rank.get(b.id)!)[0]
    placed.add(next.id)
    order.push({
      track: next,
      after: [...deps.get(next.id)!]
        .filter(([o]) => placed.has(o) && o !== next.id)
        .map(([o, e]) => ({ track: reg.tracks.get(o)!, ...e }))
        .sort((a, b) => rank.get(a.track.id)! - rank.get(b.track.id)!),
    })
  }
  return order
}
