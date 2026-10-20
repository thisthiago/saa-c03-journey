/**
 * Tabela de preços da trilha Computação na AWS (gerada por
 * scripts/fetch-compute-prices.mjs a partir da AWS Price List).
 *
 * Linux, tenancy compartilhada, sem software pré-instalado; Reserved
 * Instances e Savings Plans sem pagamento antecipado (No Upfront); primeira
 * faixa de cada item. O Spot não faz parte da Price List: os simuladores usam
 * um desconto declarado como premissa do cenário.
 */
import table from '../content/pricing/compute-prices.json'

export type Arch = 'x86_64' | 'arm64'
export type RiTerm = 'standard-1yr' | 'standard-3yr' | 'convertible-1yr' | 'convertible-3yr'
export type SpTerm = 'compute-1yr' | 'compute-3yr' | 'ec2instance-1yr' | 'ec2instance-3yr'

export interface InstancePrice {
  vcpu: number
  memoryGiB: number
  processor: string
  arch: Arch
  /** GPUs ou aceleradores, como a Price List informa. */
  gpus: number
  /** "EBS only" ou o instance store incluído (ex.: "1 x 468 NVMe SSD"). */
  storage: string
  network: string
  onDemandHour: number
  reservedNoUpfrontHour: Record<RiTerm, number>
  savingsPlanHour: Record<SpTerm, number>
}

export interface ComputeRegionPrices {
  label: string
  offers: Record<string, string>
  instances: Record<string, InstancePrice>
  /** Excedente das burstable em modo unlimited, por vCPU-hora. */
  cpuCreditsPerVcpuHour: Record<string, number>
  ebs: {
    gp3: { gbMonth: number; iopsMonth: number; throughputMiBpsMonth: number }
    gp2: { gbMonth: number }
    io2: { gbMonth: number; iopsMonthTiers: { upTo: number | null; price: number }[] }
    io1: { gbMonth: number; iopsMonth: number }
    st1: { gbMonth: number }
    sc1: { gbMonth: number }
    snapshotGBMonth: number
    snapshotArchiveGBMonth: number
  }
  lambda: {
    requestPerMillion: number
    gbSecond: Record<Arch, number>
    provisioned: { concurrencyGBSecond: number; durationGBSecond: number }
    computeSavingsPlanGBSecond: Record<'1yr' | '3yr', number>
  }
  fargate: {
    vcpuHour: Record<Arch, number>
    gbHour: Record<Arch, number>
    computeSavingsPlan: Record<'1yr' | '3yr', { vcpuHour: number; gbHour: number }>
  }
  elb: Record<'alb' | 'nlb' | 'gwlb', { hour: number; lcuHour: number }>
  sourceUrls: string[]
}

export interface ComputePriceTable {
  source: string
  sourceDocs: string
  retrievedAt: string
  currency: 'USD'
  notes: string[]
  regions: Record<string, ComputeRegionPrices>
}

export const COMPUTE_PRICES = table as unknown as ComputePriceTable

export const COMPUTE_REGION = 'us-east-1'

/** Mês de 730 horas (365 × 24 ÷ 12), usado em todas as estimativas mensais. */
export const HOURS_PER_MONTH = 730

/** Data da tabela no formato dd/mm/aaaa, para os selos da interface. */
export const PRICE_DATE = COMPUTE_PRICES.retrievedAt.split('-').reverse().join('/')

export function computePrices(region: string = COMPUTE_REGION): ComputeRegionPrices {
  const r = COMPUTE_PRICES.regions[region]
  if (!r) throw new Error(`Região sem preços de computação: ${region}`)
  return r
}

export function instancePrice(type: string, region: string = COMPUTE_REGION): InstancePrice {
  const p = computePrices(region).instances[type]
  if (!p) throw new Error(`Tipo de instância fora da tabela: ${type}`)
  return p
}

export const INSTANCE_TYPES = Object.keys(computePrices().instances)

/** Formata um valor em dólares com a precisão que faz sentido para o tamanho dele. */
export function usd(v: number): string {
  const digits = v === 0 ? 2 : Math.abs(v) < 0.01 ? 5 : Math.abs(v) < 1 ? 4 : 2
  return `US$ ${v.toLocaleString('pt-BR', { minimumFractionDigits: Math.min(2, digits), maximumFractionDigits: digits })}`
}
