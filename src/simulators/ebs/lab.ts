/** Laboratório de volumes EBS: configurar tipo, tamanho, IOPS e throughput de cada carga pelo menor custo. */
import type { ItemFeedback } from '../../engine/types'
import { usd } from '../compute-prices'
import { cheapestVolume, needGaps, VOLUME_TYPES, volumeMonthly, type VolumeConfig, type VolumeNeed, type VolumeType } from './model'

export interface VolumeWorkload {
  id: string
  name: string
  description: string
  need: VolumeNeed
  concepts?: string[]
}

export interface VolumesLabConfig {
  region?: string
  workloads: VolumeWorkload[]
  types?: VolumeType[]
}

export interface VolumesLabResponse {
  volumes: Record<string, VolumeConfig | undefined>
}

/** Até 10% acima do mínimo vale como ótimo (arredondamentos); até 50% acima, meio ponto. */
export const NEAR = { full: 1.1, half: 1.5 }

const typesOf = (c: VolumesLabConfig) => c.types ?? VOLUME_TYPES

export const volumesSolution = (c: VolumesLabConfig): VolumesLabResponse => ({
  volumes: Object.fromEntries(c.workloads.map((w) => [w.id, cheapestVolume(w.need, typesOf(c), c.region)])),
})

const describe = (v: VolumeConfig) => `${v.type} de ${v.sizeGiB} GiB${v.iops ? `, ${v.iops.toLocaleString('pt-BR')} IOPS` : ''}${v.type === 'gp3' && v.throughput ? `, ${v.throughput} MiB/s` : ''}${v.multiAttach ? ', Multi-Attach' : ''}`

export function judgeVolume(c: VolumesLabConfig, w: VolumeWorkload, v: VolumeConfig | undefined): { score: number; fb: ItemFeedback } {
  const best = cheapestVolume(w.need, typesOf(c), c.region)
  if (!best) throw new Error(`Carga sem volume que atenda: ${w.id}`)
  const bestCost = volumeMonthly(best, c.region)
  const ref = `O mais barato que atende: ${describe(best)} (${usd(bestCost)}/mês).`
  if (!v) return { score: 0, fb: { id: w.id, label: `${w.name}: sem volume`, status: 'missed', message: `Configure um volume. ${ref}` } }
  const label = `${w.name}: ${describe(v)}`
  const gaps = needGaps(v, w.need)
  if (gaps.length) return { score: 0, fb: { id: w.id, label, status: 'wrong', message: `Não atende: ${gaps.join('; ')}. ${ref}` } }
  const cost = volumeMonthly(v, c.region)
  if (cost <= bestCost * NEAR.full) return { score: 1, fb: { id: w.id, label, status: 'correct', message: `Atende por ${usd(cost)}/mês, o menor custo possível para esta carga.` } }
  if (cost <= bestCost * NEAR.half) return { score: 0.5, fb: { id: w.id, label, status: 'partial', message: `Atende, mas custa ${usd(cost)}/mês. ${ref}` } }
  return { score: 0, fb: { id: w.id, label, status: 'wrong', message: `Atende, mas custa ${usd(cost)}/mês, bem acima do necessário. ${ref}` } }
}

export function evaluateVolumesLab(c: VolumesLabConfig, r: VolumesLabResponse) {
  const items = c.workloads.map((w) => ({ concepts: w.concepts, ...judgeVolume(c, w, r.volumes?.[w.id]) }))
  return { score: items.reduce((s, x) => s + x.score, 0) / Math.max(1, items.length), items }
}

export const volumesComplete = (c: VolumesLabConfig, r: VolumesLabResponse) => c.workloads.every((w) => Boolean(r.volumes?.[w.id]))
