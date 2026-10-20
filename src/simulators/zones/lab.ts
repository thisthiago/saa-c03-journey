/** Laboratório de resiliência entre AZs: reorganizar a arquitetura para sobreviver à queda de uma AZ. */
import type { ItemFeedback } from '../../engine/types'
import { deployedCount, failureLabel, simulateFailure, STATUS_LABEL, validateZones, type NatMode, type ZonesTopology } from './model'

export type ZonesGoal =
  | { kind: 'valid'; concepts?: string[] }
  | { kind: 'normal-ok'; concepts?: string[] }
  | { kind: 'survive-az'; concepts?: string[] }
  | { kind: 'full-capacity'; concepts?: string[] }
  | { kind: 'max-instances'; max: number; concepts?: string[] }

export interface ZonesLabConfig {
  initial: ZonesTopology
  goals: ZonesGoal[]
  /** Solução de referência (usada na solução guiada e nos testes de conteúdo). */
  solution: ZonesTopology
  natModes?: NatMode[]
  /** Esconde o controle do banco (quando a missão não trata dele). */
  lockDb?: boolean
}

export type ZonesLabResponse = ZonesTopology

export const zonesInitial = (c: ZonesLabConfig): ZonesLabResponse => structuredClone(c.initial)
export const zonesSolution = (c: ZonesLabConfig): ZonesLabResponse => structuredClone(c.solution)

export function goalLabel(g: ZonesGoal): string {
  switch (g.kind) {
    case 'valid':
      return 'Configuração válida'
    case 'normal-ok':
      return 'Em operação normal, todas as instâncias implantadas atendem'
    case 'survive-az':
      return 'Continuar no ar se qualquer AZ falhar'
    case 'full-capacity':
      return 'Manter a capacidade necessária mesmo sem uma AZ (static stability)'
    case 'max-instances':
      return `Implantar no máximo ${g.max} instâncias (orçamento)`
  }
}

export function checkGoal(t: ZonesTopology, g: ZonesGoal): { ok: boolean; message: string } {
  switch (g.kind) {
    case 'valid': {
      const errs = validateZones(t)
      return errs.length ? { ok: false, message: errs.join(' ') } : { ok: true, message: 'Sem erros de configuração.' }
    }
    case 'normal-ok': {
      const r = simulateFailure(t, 'none')
      const deployed = deployedCount(t)
      const ok = r.status === 'available' && r.serving === deployed
      return { ok, message: ok ? `${r.serving} instâncias atendendo.` : r.reasons.join(' ') || `Só ${r.serving} de ${deployed} instâncias atendem.` }
    }
    case 'survive-az': {
      const bad = t.azs.map((az) => simulateFailure(t, az)).filter((r) => r.status === 'down')
      return bad.length ? { ok: false, message: bad.map((r) => `${failureLabel(r.failure)}: ${r.reasons.join(' ')}`).join(' ') } : { ok: true, message: 'Nenhuma AZ derruba a aplicação sozinha.' }
    }
    case 'full-capacity': {
      const bad = t.azs.map((az) => simulateFailure(t, az)).filter((r) => r.status !== 'available')
      return bad.length
        ? { ok: false, message: bad.map((r) => `${failureLabel(r.failure)}: ${STATUS_LABEL[r.status].toLowerCase()} (${r.serving}/${r.required} instâncias).`).join(' ') }
        : { ok: true, message: 'Com qualquer AZ fora, sobram instâncias suficientes para a carga normal.' }
    }
    case 'max-instances': {
      const n = deployedCount(t)
      return { ok: n <= g.max, message: `${n} instâncias implantadas.` }
    }
  }
}

export function evaluateZonesLab(c: ZonesLabConfig, r: ZonesLabResponse) {
  const t = r ?? c.initial
  const items = c.goals.map((g, i) => {
    const res = checkGoal(t, g)
    return { concepts: g.concepts, score: res.ok ? 1 : 0, fb: { id: `goal-${i}`, label: goalLabel(g), status: res.ok ? 'correct' : 'wrong', message: res.message } as ItemFeedback }
  })
  return { score: items.reduce((s, x) => s + x.score, 0) / Math.max(1, items.length), items }
}
