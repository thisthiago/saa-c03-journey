/**
 * Opções de compra do EC2: quanto custa cada parte de uma frota em cada
 * opção e que requisitos cada opção quebra.
 *
 * Conferido em 20/10/2026:
 * - Opções: https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/instance-purchasing-options.html
 * - Savings Plans (Compute: qualquer família, tamanho, Região, SO e tenancy,
 *   mais Fargate e Lambda; EC2 Instance: uma família numa Região; não cobrem
 *   Spot nem uso já coberto por RI; não reservam capacidade):
 *   https://docs.aws.amazon.com/savingsplans/latest/userguide/plan-types.html
 *   e https://docs.aws.amazon.com/savingsplans/latest/userguide/sp-ris.html
 * - Reserved Instances (Standard só modifica, Convertible troca; zonal reserva
 *   capacidade; não cancela; cobradas mesmo sem uso):
 *   https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/ec2-reserved-instances.html
 *   e https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/reserved-instances-scope.html
 * - Spot (capacidade sobrando, até 90% de desconto, pode ser interrompido com
 *   aviso de 2 minutos): https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/using-spot-instances.html
 *   e https://aws.amazon.com/ec2/spot/
 * - Capacity Reservations (capacidade numa AZ, sem compromisso, cobradas no
 *   preço On-Demand usadas ou não; combinam com Savings Plans e RIs regionais):
 *   https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/ec2-capacity-reservations.html
 *
 * Premissas e simplificações: o desconto do Spot é fixo (SPOT_DISCOUNT); um
 * compromisso (RI ou Savings Plan) é dimensionado para cobrir exatamente as
 * instâncias do segmento e é cobrado as 730 horas do mês; preços sem
 * pagamento antecipado (No Upfront); Linux, tenancy compartilhada.
 */
import { HOURS_PER_MONTH, instancePrice, type RiTerm, type SpTerm } from '../compute-prices'

/** Desconto do Spot sobre o On-Demand usado nos cenários (premissa: o preço real varia). */
export const SPOT_DISCOUNT = 0.7

export type PurchaseOption = 'on-demand' | 'spot' | 'compute-sp-1yr' | 'compute-sp-3yr' | 'ec2-sp-1yr' | 'ec2-sp-3yr' | 'ri-std-1yr' | 'ri-std-3yr' | 'ri-conv-1yr' | 'ri-conv-3yr' | 'ri-zonal-1yr' | 'odcr'

export interface OptionInfo {
  name: string
  short: string
  /** Meses de compromisso (0 = sem compromisso). */
  termMonths: number
  /** Compromisso cobrado todas as horas do mês, use ou não. */
  billedAlways: boolean
  reservesCapacity: boolean
  /** Continua valendo se a carga mudar de família de instância. */
  anyFamily: boolean
  /** Continua valendo se a carga for para outra Região. */
  anyRegion: boolean
  /** Continua valendo se a carga migrar para o Fargate. */
  coversFargate: boolean
  interruptible: boolean
}

export const OPTIONS: Record<PurchaseOption, OptionInfo> = {
  'on-demand': { name: 'On-Demand', short: 'On-Demand', termMonths: 0, billedAlways: false, reservesCapacity: false, anyFamily: true, anyRegion: true, coversFargate: true, interruptible: false },
  spot: { name: 'Spot', short: 'Spot', termMonths: 0, billedAlways: false, reservesCapacity: false, anyFamily: true, anyRegion: true, coversFargate: true, interruptible: true },
  'compute-sp-1yr': { name: 'Compute Savings Plan de 1 ano', short: 'Compute SP 1 ano', termMonths: 12, billedAlways: true, reservesCapacity: false, anyFamily: true, anyRegion: true, coversFargate: true, interruptible: false },
  'compute-sp-3yr': { name: 'Compute Savings Plan de 3 anos', short: 'Compute SP 3 anos', termMonths: 36, billedAlways: true, reservesCapacity: false, anyFamily: true, anyRegion: true, coversFargate: true, interruptible: false },
  'ec2-sp-1yr': { name: 'EC2 Instance Savings Plan de 1 ano', short: 'EC2 Instance SP 1 ano', termMonths: 12, billedAlways: true, reservesCapacity: false, anyFamily: false, anyRegion: false, coversFargate: false, interruptible: false },
  'ec2-sp-3yr': { name: 'EC2 Instance Savings Plan de 3 anos', short: 'EC2 Instance SP 3 anos', termMonths: 36, billedAlways: true, reservesCapacity: false, anyFamily: false, anyRegion: false, coversFargate: false, interruptible: false },
  'ri-std-1yr': { name: 'Reserved Instance Standard regional de 1 ano', short: 'RI Standard 1 ano', termMonths: 12, billedAlways: true, reservesCapacity: false, anyFamily: false, anyRegion: false, coversFargate: false, interruptible: false },
  'ri-std-3yr': { name: 'Reserved Instance Standard regional de 3 anos', short: 'RI Standard 3 anos', termMonths: 36, billedAlways: true, reservesCapacity: false, anyFamily: false, anyRegion: false, coversFargate: false, interruptible: false },
  'ri-conv-1yr': { name: 'Reserved Instance Convertible de 1 ano', short: 'RI Convertible 1 ano', termMonths: 12, billedAlways: true, reservesCapacity: false, anyFamily: true, anyRegion: false, coversFargate: false, interruptible: false },
  'ri-conv-3yr': { name: 'Reserved Instance Convertible de 3 anos', short: 'RI Convertible 3 anos', termMonths: 36, billedAlways: true, reservesCapacity: false, anyFamily: true, anyRegion: false, coversFargate: false, interruptible: false },
  'ri-zonal-1yr': { name: 'Reserved Instance Standard zonal de 1 ano', short: 'RI zonal 1 ano', termMonths: 12, billedAlways: true, reservesCapacity: true, anyFamily: false, anyRegion: false, coversFargate: false, interruptible: false },
  odcr: { name: 'On-Demand com Capacity Reservation', short: 'Capacity Reservation', termMonths: 0, billedAlways: true, reservesCapacity: true, anyFamily: true, anyRegion: false, coversFargate: false, interruptible: false },
}

const RATE_KEY: Partial<Record<PurchaseOption, { ri?: RiTerm; sp?: SpTerm }>> = {
  'compute-sp-1yr': { sp: 'compute-1yr' },
  'compute-sp-3yr': { sp: 'compute-3yr' },
  'ec2-sp-1yr': { sp: 'ec2instance-1yr' },
  'ec2-sp-3yr': { sp: 'ec2instance-3yr' },
  'ri-std-1yr': { ri: 'standard-1yr' },
  'ri-std-3yr': { ri: 'standard-3yr' },
  'ri-conv-1yr': { ri: 'convertible-1yr' },
  'ri-conv-3yr': { ri: 'convertible-3yr' },
  'ri-zonal-1yr': { ri: 'standard-1yr' },
}

/** Um pedaço homogêneo da frota: mesmas instâncias, mesmo padrão de uso e mesmos requisitos. */
export interface Segment {
  id: string
  name: string
  description: string
  type: string
  count: number
  /** Horas por dia em que essas instâncias rodam. */
  hoursPerDay: number
  /** A carga aguenta ser interrompida e retomada. */
  interruptible: boolean
  /** Precisa de capacidade garantida numa AZ específica. */
  needsCapacity?: boolean
  /** Por quantos meses a carga ainda vai existir. */
  horizonMonths: number
  /** A carga vai mudar de família de instância (ex.: para Graviton) durante o horizonte. */
  familyChange?: boolean
  /** A carga vai mudar de Região durante o horizonte. */
  regionChange?: boolean
  /** A carga vai migrar para contêineres no Fargate durante o horizonte. */
  fargateMigration?: boolean
  concepts?: string[]
}

export const hoursUsed = (s: Segment) => (s.hoursPerDay / 24) * HOURS_PER_MONTH

/** Preço por hora de uma instância na opção (Spot com o desconto premissa). */
export function hourlyRate(type: string, option: PurchaseOption, region?: string): number {
  const p = instancePrice(type, region)
  if (option === 'on-demand' || option === 'odcr') return p.onDemandHour
  if (option === 'spot') return p.onDemandHour * (1 - SPOT_DISCOUNT)
  const k = RATE_KEY[option]!
  return k.sp ? p.savingsPlanHour[k.sp] : p.reservedNoUpfrontHour[k.ri!]
}

/** Custo mensal do segmento na opção. Compromissos e Capacity Reservations cobram as 730 horas. */
export function segmentMonthly(s: Segment, option: PurchaseOption, region?: string): number {
  const hours = OPTIONS[option].billedAlways ? HOURS_PER_MONTH : hoursUsed(s)
  return s.count * hourlyRate(s.type, option, region) * hours
}

/** Requisitos que a opção quebra (lista vazia: a opção serve). */
export function violations(s: Segment, option: PurchaseOption): string[] {
  const o = OPTIONS[option]
  const out: string[] = []
  if (o.interruptible && !s.interruptible) out.push('a carga não aguenta interrupções, e o Spot pode ser interrompido com aviso de 2 minutos')
  if (s.needsCapacity && !o.reservesCapacity) out.push('a carga precisa de capacidade garantida numa AZ, e esta opção não reserva capacidade')
  if (o.termMonths > s.horizonMonths) out.push(`o compromisso é de ${o.termMonths / 12} ano(s), e a carga só existe por mais ${s.horizonMonths} meses`)
  if (o.termMonths > 0 && s.familyChange && !o.anyFamily) out.push('a carga vai mudar de família, e este desconto fica preso à família atual')
  if (o.termMonths > 0 && s.regionChange && !o.anyRegion) out.push('a carga vai mudar de Região, e este desconto vale só na Região atual')
  if (o.termMonths > 0 && s.fargateMigration && !o.coversFargate) out.push('a carga vai para o Fargate, e só o Compute Savings Plan cobre o Fargate')
  return out
}

export interface OptionResult {
  option: PurchaseOption
  monthly: number
  violations: string[]
}

export function compareOptions(s: Segment, options: PurchaseOption[], region?: string): OptionResult[] {
  return options.map((option) => ({ option, monthly: segmentMonthly(s, option, region), violations: violations(s, option) }))
}

/** Opções válidas de menor custo (empates de até 0,5% contam como empate). */
export function bestOptions(s: Segment, options: PurchaseOption[], region?: string): PurchaseOption[] {
  const valid = compareOptions(s, options, region).filter((r) => r.violations.length === 0)
  if (valid.length === 0) return []
  const min = Math.min(...valid.map((r) => r.monthly))
  return valid.filter((r) => r.monthly <= min * 1.005).map((r) => r.option)
}
