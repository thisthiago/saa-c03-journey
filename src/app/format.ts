import { registry } from '../content'

/** "hoje", "amanhã" ou "em N dias". */
export function relativeDays(date: Date, now: Date): string {
  const days = Math.ceil((date.getTime() - now.getTime()) / 86_400_000)
  if (days <= 0) return 'hoje'
  if (days === 1) return 'amanhã'
  return `em ${days} dias`
}

/** "Fase N" ou "Desafio final", conforme o papel da fase na trilha. */
export function phaseLabel(phase: { id: string; order: number }): string {
  return registry.phases.get(phase.id)?.isFinal ? 'Desafio final' : `Fase ${phase.order}`
}

/** "AWS Foundations · Fase 1": usado onde fases de trilhas diferentes aparecem juntas. */
export function phaseRef(phase: { id: string; order: number }): string {
  const ref = registry.phases.get(phase.id)
  return ref ? `${ref.track.title} · ${phaseLabel(phase)}` : phaseLabel(phase)
}

/** "Fase 2 (Título)", ou com o nome da trilha quando a fase é de outra trilha. */
export function phaseMention(phase: { id: string; order: number; title: string }, contextTrackId?: string): string {
  const ref = registry.phases.get(phase.id)
  const label = ref && ref.track.id !== contextTrackId ? phaseRef(phase) : phaseLabel(phase)
  return `${label} (${phase.title})`
}

/** "1 missão aprovada", "3 missões aprovadas". */
export function plural(n: number, one: string, many: string): string {
  return `${n.toLocaleString('pt-BR')} ${n === 1 ? one : many}`
}
