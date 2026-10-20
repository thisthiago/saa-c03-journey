import type { Tone } from '../../ui/kit'
import type { MissionStatus, PhaseStatus } from '../../engine/selectors'
import type { PhaseDef } from '../../engine/types'

export const PHASE_STATUS: Record<PhaseStatus, { label: string; tone: Tone }> = {
  'in-construction': { label: 'Em construção', tone: 'neutral' },
  locked: { label: 'Bloqueada', tone: 'neutral' },
  available: { label: 'Disponível', tone: 'accent' },
  'in-progress': { label: 'Em andamento', tone: 'info' },
  completed: { label: 'Concluída', tone: 'success' },
}

export const MISSION_STATUS: Record<MissionStatus, { label: string; tone: Tone }> = {
  locked: { label: 'Bloqueada', tone: 'neutral' },
  available: { label: 'Disponível', tone: 'accent' },
  'in-progress': { label: 'Em andamento', tone: 'info' },
  passed: { label: 'Aprovada', tone: 'success' },
}

export const MEDAL_LABEL = { ouro: 'Medalha de ouro', prata: 'Medalha de prata', bronze: 'Medalha de bronze' } as const

/**
 * Arestas do mapa: dependências diretas sem as redundantes (redução transitiva),
 * para não poluir o desenho com linhas implícitas.
 */
export function mapEdges(phases: PhaseDef[]): [string, string][] {
  const byId = new Map(phases.map((p) => [p.id, p]))
  const reach = (from: string, target: string, skipDirect: boolean): boolean => {
    const stack = (byId.get(from)?.requires ?? []).filter((d) => !(skipDirect && d === target))
    const seen = new Set<string>()
    while (stack.length) {
      const cur = stack.pop()!
      if (cur === target) return true
      if (seen.has(cur)) continue
      seen.add(cur)
      stack.push(...(byId.get(cur)?.requires ?? []))
    }
    return false
  }
  const edges: [string, string][] = []
  for (const p of phases) {
    for (const dep of p.requires) {
      if (byId.has(dep) && !reach(p.id, dep, true)) edges.push([dep, p.id])
    }
  }
  return edges
}
