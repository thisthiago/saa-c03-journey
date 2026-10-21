/**
 * Dimensionamento de uma instância do RDS for PostgreSQL: classe, implantação
 * (Single-AZ ou Multi-AZ) e armazenamento gp3 ou io2, com o custo mensal pela
 * tabela de preços da AWS.
 *
 * Fatos conferidos em 21/10/2026:
 * - Classes (db.m*, db.r*, db.t* burstable): https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/Concepts.DBInstanceClass.html
 * - Armazenamento (gp3 com 3.000 IOPS e 125 MiB/s abaixo de 400 GiB e 12.000 IOPS e
 *   500 MiB/s a partir de 400 GiB, quando o volume é dividido em quatro; IOPS e
 *   throughput provisionados só a partir de 400 GiB, de 12.000 a 64.000 IOPS e de
 *   500 a 4.000 MiB/s; até 0,25 MiB/s por IOPS e até 500 IOPS por GiB; io2 de 100 GiB a
 *   64 TiB, de 1.000 a 256.000 IOPS, de 0,5 a 1.000 IOPS por GiB, até 0,256 MiB/s por IOPS):
 *   https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/CHAP_Storage.html
 * - Multi-AZ com um standby síncrono: https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/Concepts.MultiAZSingleStandby.html
 * - Cobrança só do desempenho provisionado acima do básico: https://aws.amazon.com/rds/pricing/
 */
import { databasePrices, RDS_CLASSES } from '../database-prices'
import { HOURS_PER_MONTH } from '../compute-prices'

export type DbStorageType = 'gp3' | 'io2'
export type Deployment = 'single-az' | 'multi-az'

export interface DbConfig {
  cls: string
  deployment: Deployment
  storage: DbStorageType
  sizeGiB: number
  /** gp3 a partir de 400 GiB e io2. */
  iops?: number
  /** gp3 a partir de 400 GiB. */
  throughput?: number
}

export interface DbNeed {
  minVcpu: number
  /** Memória para manter os dados mais usados em cache. */
  minMemoryGiB: number
  minGiB: number
  iops: number
  throughput: number
  /** CPU alta o tempo todo: classe burstable não serve. */
  sustainedCpu?: boolean
  /** Produção que precisa sobreviver à perda de uma AZ sem intervenção. */
  highAvailability?: boolean
}

export const DEPLOYMENT_LABEL: Record<Deployment, string> = { 'single-az': 'Single-AZ', 'multi-az': 'Multi-AZ (um standby)' }

export const STORAGE = {
  gp3: { name: 'gp3 (General Purpose SSD)', minGiB: 20, maxGiB: 65536, stripeAt: 400, baseLow: { iops: 3000, throughput: 125 }, baseHigh: { iops: 12000, throughput: 500 }, maxIops: 64000, maxThroughput: 4000, maxIopsPerGiB: 500, maxMiBpsPerIops: 0.25 },
  io2: { name: 'io2 Block Express (Provisioned IOPS SSD)', minGiB: 100, maxGiB: 65536, minIops: 1000, maxIops: 256000, minIopsPerGiB: 0.5, maxIopsPerGiB: 1000, miBpsPerIops: 0.256, maxThroughput: 16000 },
} as const

export const isBurstable = (cls: string) => cls.startsWith('db.t')

/** Erros que fariam a AWS recusar a configuração. */
export function validateDb(c: DbConfig): string[] {
  const errors: string[] = []
  if (!RDS_CLASSES.includes(c.cls)) errors.push(`classe fora da tabela: ${c.cls}`)
  const size = c.sizeGiB
  if (c.storage === 'gp3') {
    const s = STORAGE.gp3
    if (!(size >= s.minGiB && size <= s.maxGiB)) errors.push(`o gp3 aceita de ${s.minGiB} a ${s.maxGiB.toLocaleString('pt-BR')} GiB`)
    if (size < s.stripeAt) {
      if ((c.iops !== undefined && c.iops !== s.baseLow.iops) || (c.throughput !== undefined && c.throughput !== s.baseLow.throughput)) errors.push(`abaixo de ${s.stripeAt} GiB o gp3 não aceita IOPS nem throughput provisionados`)
    } else {
      const iops = c.iops ?? s.baseHigh.iops
      const thr = c.throughput ?? s.baseHigh.throughput
      if (iops < s.baseHigh.iops || iops > s.maxIops) errors.push(`a partir de ${s.stripeAt} GiB o gp3 aceita de 12.000 a 64.000 IOPS`)
      if (thr < s.baseHigh.throughput || thr > s.maxThroughput) errors.push('a partir de 400 GiB o gp3 aceita de 500 a 4.000 MiB/s')
      if (thr > iops * s.maxMiBpsPerIops) errors.push('o throughput passa de 0,25 MiB/s por IOPS')
      if (iops > size * s.maxIopsPerGiB) errors.push('mais de 500 IOPS por GiB')
    }
  } else {
    const s = STORAGE.io2
    const iops = c.iops ?? 0
    if (!(size >= s.minGiB && size <= s.maxGiB)) errors.push(`o io2 aceita de ${s.minGiB} a ${s.maxGiB.toLocaleString('pt-BR')} GiB`)
    if (iops < s.minIops || iops > s.maxIops) errors.push('o io2 aceita de 1.000 a 256.000 IOPS')
    else if (iops / size > s.maxIopsPerGiB || iops / size < s.minIopsPerGiB) errors.push('o io2 aceita de 0,5 a 1.000 IOPS por GiB')
  }
  return errors
}

/** Desempenho entregue pelo armazenamento. */
export function dbPerformance(c: DbConfig): { iops: number; throughput: number } {
  if (c.storage === 'gp3') {
    const s = STORAGE.gp3
    if (c.sizeGiB < s.stripeAt) return { ...s.baseLow }
    return { iops: c.iops ?? s.baseHigh.iops, throughput: c.throughput ?? s.baseHigh.throughput }
  }
  const iops = c.iops ?? 0
  return { iops, throughput: Math.min(iops * STORAGE.io2.miBpsPerIops, STORAGE.io2.maxThroughput) }
}

export interface DbCost {
  instance: number
  storage: number
  performance: number
  total: number
}

/** Custo mensal (730 horas) pela tabela de preços. */
export function dbMonthly(c: DbConfig, region?: string): DbCost {
  const p = databasePrices(region).rds
  const multi = c.deployment === 'multi-az'
  const cls = p.instances[c.cls]
  const instance = (multi ? cls.multiAzHour : cls.singleAzHour) * HOURS_PER_MONTH
  let storage = 0
  let performance = 0
  if (c.storage === 'gp3') {
    const g = p.storage.gp3
    storage = c.sizeGiB * (multi ? g.multiAzGBMonth : g.singleAzGBMonth)
    if (c.sizeGiB >= STORAGE.gp3.stripeAt) {
      const extraIops = Math.max(0, (c.iops ?? STORAGE.gp3.baseHigh.iops) - STORAGE.gp3.baseHigh.iops)
      const extraThr = Math.max(0, (c.throughput ?? STORAGE.gp3.baseHigh.throughput) - STORAGE.gp3.baseHigh.throughput)
      performance = extraIops * (multi ? g.multiAzIopsMonth : g.singleAzIopsMonth) + extraThr * (multi ? g.multiAzThroughputMiBpsMonth : g.singleAzThroughputMiBpsMonth)
    }
  } else {
    const g = p.storage.io2
    storage = c.sizeGiB * (multi ? g.multiAzGBMonth : g.singleAzGBMonth)
    performance = (c.iops ?? 0) * (multi ? g.multiAzIopsMonth : g.singleAzIopsMonth)
  }
  return { instance, storage, performance, total: instance + storage + performance }
}

/** O que falta para a configuração atender à carga (vazio = atende). */
export function dbGaps(c: DbConfig, n: DbNeed, region?: string): string[] {
  const gaps: string[] = []
  const cls = databasePrices(region).rds.instances[c.cls]
  if (cls.vcpu < n.minVcpu) gaps.push(`${c.cls} tem ${cls.vcpu} vCPUs e a carga pede ${n.minVcpu}`)
  if (cls.memoryGiB < n.minMemoryGiB) gaps.push(`${c.cls} tem ${cls.memoryGiB} GiB de memória e os dados mais usados ocupam ${n.minMemoryGiB} GiB`)
  if (n.sustainedCpu && isBurstable(c.cls)) gaps.push('a CPU fica alta o tempo todo: uma classe burstable gastaria créditos sem parar')
  if (n.highAvailability && c.deployment !== 'multi-az') gaps.push('a produção precisa de um standby em outra AZ (Multi-AZ)')
  if (c.sizeGiB < n.minGiB) gaps.push(`os dados ocupam ${n.minGiB} GiB e o volume tem ${c.sizeGiB}`)
  const perf = dbPerformance(c)
  if (perf.iops < n.iops) gaps.push(`entrega ${perf.iops.toLocaleString('pt-BR')} IOPS e a carga pede ${n.iops.toLocaleString('pt-BR')}`)
  if (perf.throughput < n.throughput) gaps.push(`entrega ${Math.round(perf.throughput)} MiB/s e a carga pede ${n.throughput}`)
  return gaps
}

/** Armazenamentos candidatos: o menor de cada tipo que atende à carga. */
function storageCandidates(n: DbNeed): Pick<DbConfig, 'storage' | 'sizeGiB' | 'iops' | 'throughput'>[] {
  const g = STORAGE.gp3
  const out: Pick<DbConfig, 'storage' | 'sizeGiB' | 'iops' | 'throughput'>[] = []
  const low = Math.max(g.minGiB, n.minGiB)
  if (low < g.stripeAt && n.iops <= g.baseLow.iops && n.throughput <= g.baseLow.throughput) out.push({ storage: 'gp3', sizeGiB: low })
  const iops = Math.max(g.baseHigh.iops, n.iops, Math.ceil(n.throughput / g.maxMiBpsPerIops))
  const throughput = Math.max(g.baseHigh.throughput, n.throughput)
  const size = Math.max(g.stripeAt, n.minGiB, Math.ceil(iops / g.maxIopsPerGiB))
  if (iops <= g.maxIops && throughput <= g.maxThroughput) out.push({ storage: 'gp3', sizeGiB: size, iops, throughput })
  const io = STORAGE.io2
  const ioIops = Math.max(io.minIops, n.iops, Math.ceil(n.throughput / io.miBpsPerIops))
  const ioSize = Math.max(io.minGiB, n.minGiB, Math.ceil(ioIops / io.maxIopsPerGiB))
  if (ioIops <= io.maxIops) out.push({ storage: 'io2', sizeGiB: ioSize, iops: Math.max(ioIops, Math.ceil(ioSize * io.minIopsPerGiB)) })
  return out
}

/** A configuração mais barata que atende à carga. */
export function cheapestDb(n: DbNeed, region?: string): DbConfig {
  let best: { c: DbConfig; cost: number } | undefined
  for (const cls of RDS_CLASSES) {
    for (const deployment of ['single-az', 'multi-az'] as Deployment[]) {
      for (const st of storageCandidates(n)) {
        const c: DbConfig = { cls, deployment, ...st }
        if (validateDb(c).length || dbGaps(c, n, region).length) continue
        const cost = dbMonthly(c, region).total
        if (!best || cost < best.cost) best = { c, cost }
      }
    }
  }
  if (!best) throw new Error('Nenhuma configuração atende à carga')
  return best.c
}

export function describeDb(c: DbConfig): string {
  const perf = c.storage === 'io2' || c.sizeGiB >= STORAGE.gp3.stripeAt ? `, ${dbPerformance(c).iops.toLocaleString('pt-BR')} IOPS` : ''
  return `${c.cls} ${DEPLOYMENT_LABEL[c.deployment]}, ${c.storage} de ${c.sizeGiB.toLocaleString('pt-BR')} GiB${perf}`
}
