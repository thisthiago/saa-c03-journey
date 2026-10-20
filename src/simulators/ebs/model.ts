/**
 * Volumes EBS: limites por tipo, desempenho entregue por uma configuração,
 * validação, custo mensal pela tabela de preços e a configuração mais barata
 * que atende a uma carga.
 *
 * Conferido em 20/10/2026:
 * - Tipos e limites: https://docs.aws.amazon.com/ebs/latest/userguide/ebs-volume-types.html
 * - gp3 (3.000 IOPS e 125 MiB/s inclusos em qualquer tamanho; IOPS extras até
 *   500 por GiB e throughput até 0,25 MiB/s por IOPS) e gp2 (3 IOPS por GiB, mínimo 100, máximo 16.000; 128 MiB/s
 *   até 170 GiB e 250 MiB/s a partir de 334 GiB):
 *   https://docs.aws.amazon.com/ebs/latest/userguide/general-purpose.html
 * - io2 Block Express (1.000 IOPS por GiB, 0,256 MiB/s por IOPS) e io1
 *   (50 IOPS por GiB): https://docs.aws.amazon.com/ebs/latest/userguide/provisioned-iops.html
 * - Multi-Attach (io1 e io2, até 16 instâncias Nitro na mesma AZ, não serve de
 *   boot): https://docs.aws.amazon.com/ebs/latest/userguide/ebs-volumes-multi.html
 *
 * Simplificações: st1 e sc1 entregam o throughput máximo do tipo em qualquer
 * tamanho; o burst do gp2 (créditos de I/O) não entra no desempenho; gp2 entre
 * 170 e 334 GiB conta como 250 MiB/s; o io1 conta 0,25 MiB/s por IOPS até
 * 32.000 IOPS.
 */
import { computePrices } from '../compute-prices'

export type VolumeType = 'gp3' | 'gp2' | 'io2' | 'io1' | 'st1' | 'sc1'

export interface VolumeSpec {
  name: string
  family: 'SSD' | 'HDD'
  minGiB: number
  maxGiB: number
  maxIops: number
  maxThroughput: number
  boot: boolean
  multiAttach: boolean
  durability: string
}

export const VOLUME_SPECS: Record<VolumeType, VolumeSpec> = {
  gp3: { name: 'gp3 (SSD de uso geral)', family: 'SSD', minGiB: 1, maxGiB: 65536, maxIops: 80000, maxThroughput: 2000, boot: true, multiAttach: false, durability: '99,8% a 99,9%' },
  gp2: { name: 'gp2 (SSD de uso geral, geração anterior)', family: 'SSD', minGiB: 1, maxGiB: 16384, maxIops: 16000, maxThroughput: 250, boot: true, multiAttach: false, durability: '99,8% a 99,9%' },
  io2: { name: 'io2 Block Express (SSD de IOPS provisionado)', family: 'SSD', minGiB: 4, maxGiB: 65536, maxIops: 256000, maxThroughput: 4000, boot: true, multiAttach: true, durability: '99,999%' },
  io1: { name: 'io1 (SSD de IOPS provisionado)', family: 'SSD', minGiB: 4, maxGiB: 16384, maxIops: 64000, maxThroughput: 1000, boot: true, multiAttach: true, durability: '99,8% a 99,9%' },
  st1: { name: 'st1 (HDD otimizado para throughput)', family: 'HDD', minGiB: 125, maxGiB: 16384, maxIops: 500, maxThroughput: 500, boot: false, multiAttach: false, durability: '99,8% a 99,9%' },
  sc1: { name: 'sc1 (HDD frio)', family: 'HDD', minGiB: 125, maxGiB: 16384, maxIops: 250, maxThroughput: 250, boot: false, multiAttach: false, durability: '99,8% a 99,9%' },
}

export const VOLUME_TYPES = Object.keys(VOLUME_SPECS) as VolumeType[]

export interface VolumeConfig {
  type: VolumeType
  sizeGiB: number
  /** IOPS provisionados (gp3 acima de 3.000, io1, io2). */
  iops?: number
  /** Throughput provisionado do gp3, em MiB/s. */
  throughput?: number
  multiAttach?: boolean
}

/** IOPS e throughput que a configuração entrega. */
export function performance(c: VolumeConfig): { iops: number; throughput: number } {
  switch (c.type) {
    case 'gp3':
      return { iops: Math.max(3000, c.iops ?? 3000), throughput: Math.max(125, c.throughput ?? 125) }
    case 'gp2':
      return { iops: Math.min(16000, Math.max(100, 3 * c.sizeGiB)), throughput: c.sizeGiB <= 170 ? 128 : 250 }
    case 'io2': {
      const iops = c.iops ?? 0
      return { iops, throughput: Math.min(4000, 0.256 * iops) }
    }
    case 'io1': {
      const iops = c.iops ?? 0
      return { iops, throughput: iops <= 32000 ? Math.min(500, 0.25 * iops) : Math.min(1000, iops / 64) }
    }
    case 'st1':
    case 'sc1':
      return { iops: VOLUME_SPECS[c.type].maxIops, throughput: VOLUME_SPECS[c.type].maxThroughput }
  }
}

/** Erros de configuração que a AWS recusaria (lista vazia: configuração válida). */
export function validateVolume(c: VolumeConfig): string[] {
  const s = VOLUME_SPECS[c.type]
  const out: string[] = []
  if (!Number.isFinite(c.sizeGiB) || c.sizeGiB < s.minGiB || c.sizeGiB > s.maxGiB) out.push(`o ${c.type} aceita de ${s.minGiB} a ${s.maxGiB.toLocaleString('pt-BR')} GiB`)
  if (c.multiAttach && !s.multiAttach) out.push('Multi-Attach só existe em io1 e io2')
  if (c.type === 'gp3') {
    const iops = c.iops ?? 3000
    const thr = c.throughput ?? 125
    if (iops < 3000 || iops > 80000) out.push('o gp3 aceita de 3.000 a 80.000 IOPS')
    else if (iops > 3000 && iops > 500 * c.sizeGiB) out.push(`o gp3 aceita até 500 IOPS por GiB: com ${c.sizeGiB} GiB, no máximo ${(500 * c.sizeGiB).toLocaleString('pt-BR')} IOPS`)
    if (thr < 125 || thr > 2000) out.push('o gp3 aceita de 125 a 2.000 MiB/s')
    else if (thr > 0.25 * iops) out.push(`o gp3 aceita até 0,25 MiB/s por IOPS: com ${iops.toLocaleString('pt-BR')} IOPS, no máximo ${0.25 * iops} MiB/s`)
  }
  if (c.type === 'io2' || c.type === 'io1') {
    const ratio = c.type === 'io2' ? 1000 : 50
    const iops = c.iops ?? 0
    if (iops < 100 || iops > s.maxIops) out.push(`o ${c.type} aceita de 100 a ${s.maxIops.toLocaleString('pt-BR')} IOPS`)
    else if (iops > ratio * c.sizeGiB) out.push(`o ${c.type} aceita até ${ratio} IOPS por GiB: com ${c.sizeGiB} GiB, no máximo ${(ratio * c.sizeGiB).toLocaleString('pt-BR')} IOPS`)
  }
  return out
}

/** Custo mensal do volume pela tabela de preços (armazenamento, IOPS e throughput provisionados). */
export function volumeMonthly(c: VolumeConfig, region?: string): number {
  const p = computePrices(region).ebs
  switch (c.type) {
    case 'gp3': {
      const { iops, throughput } = performance(c)
      return c.sizeGiB * p.gp3.gbMonth + (iops - 3000) * p.gp3.iopsMonth + (throughput - 125) * p.gp3.throughputMiBpsMonth
    }
    case 'gp2':
      return c.sizeGiB * p.gp2.gbMonth
    case 'io2': {
      // IOPS do io2 cobrados por faixa: até 32.000, de 32.001 a 64.000 e acima.
      let rest = c.iops ?? 0
      let prev = 0
      let iopsCost = 0
      for (const t of p.io2.iopsMonthTiers) {
        const cap = t.upTo ?? Infinity
        const n = Math.max(0, Math.min(rest, cap - prev))
        iopsCost += n * t.price
        rest -= n
        prev = cap
      }
      return c.sizeGiB * p.io2.gbMonth + iopsCost
    }
    case 'io1':
      return c.sizeGiB * p.io1.gbMonth + (c.iops ?? 0) * p.io1.iopsMonth
    case 'st1':
      return c.sizeGiB * p.st1.gbMonth
    case 'sc1':
      return c.sizeGiB * p.sc1.gbMonth
  }
}

// ---------------------------------------------------------------------------
// Atender a uma carga

export interface VolumeNeed {
  minGiB: number
  iops: number
  /** MiB/s. */
  throughput: number
  boot?: boolean
  multiAttach?: boolean
  /** Carga crítica que pede a durabilidade do io2 (99,999%). */
  highDurability?: boolean
}

export function needGaps(c: VolumeConfig, n: VolumeNeed): string[] {
  const out = validateVolume(c)
  if (out.length) return out
  const s = VOLUME_SPECS[c.type]
  const perf = performance(c)
  if (c.sizeGiB < n.minGiB) out.push(`a carga precisa de ${n.minGiB} GiB`)
  if (perf.iops < n.iops) out.push(`entrega ${perf.iops.toLocaleString('pt-BR')} IOPS e a carga precisa de ${n.iops.toLocaleString('pt-BR')}`)
  if (perf.throughput < n.throughput) out.push(`entrega ${Math.round(perf.throughput)} MiB/s e a carga precisa de ${n.throughput}`)
  if (n.boot && !s.boot) out.push('volumes HDD (st1 e sc1) não servem de volume de boot')
  if (n.multiAttach && !c.multiAttach) out.push(s.multiAttach ? 'o volume precisa estar com Multi-Attach habilitado' : 'só io1 e io2 têm Multi-Attach')
  if (n.highDurability && c.type !== 'io2') out.push('a carga pede a durabilidade de 99,999% do io2')
  return out
}

/** A menor configuração de cada tipo que atende à carga (ou nenhuma). */
export function minimalConfig(type: VolumeType, n: VolumeNeed): VolumeConfig | undefined {
  const s = VOLUME_SPECS[type]
  let c: VolumeConfig
  switch (type) {
    case 'gp3': {
      const iops = Math.max(3000, n.iops, Math.ceil(n.throughput / 0.25))
      const size = Math.max(s.minGiB, n.minGiB, iops > 3000 ? Math.ceil(iops / 500) : 1)
      c = { type, sizeGiB: size, iops, throughput: Math.max(125, n.throughput) }
      break
    }
    case 'gp2': {
      const size = Math.max(n.minGiB, Math.ceil(n.iops / 3), n.throughput > 128 ? 171 : 1)
      c = { type, sizeGiB: size }
      break
    }
    case 'io2':
    case 'io1': {
      const perIops = type === 'io2' ? 0.256 : 0.25
      const iops = Math.max(100, n.iops, Math.ceil(n.throughput / perIops))
      const size = Math.max(s.minGiB, n.minGiB, Math.ceil(iops / (type === 'io2' ? 1000 : 50)))
      c = { type, sizeGiB: size, iops, multiAttach: n.multiAttach || undefined }
      break
    }
    case 'st1':
    case 'sc1':
      c = { type, sizeGiB: Math.max(s.minGiB, n.minGiB) }
      break
  }
  return needGaps(c, n).length === 0 ? c : undefined
}

export function cheapestVolume(n: VolumeNeed, types: VolumeType[] = VOLUME_TYPES, region?: string): VolumeConfig | undefined {
  return types
    .map((t) => minimalConfig(t, n))
    .filter((c): c is VolumeConfig => Boolean(c))
    .sort((a, b) => volumeMonthly(a, region) - volumeMonthly(b, region))[0]
}
