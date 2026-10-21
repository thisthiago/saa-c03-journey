/** Laboratório "Plano de endereços": escolher o bloco da VPC e dividir em sub-redes sem sobreposição. */
import type { ItemFeedback } from '../../engine/types'
import { allocate, blockProblems, cidrText, isCidr, overlaps, parseCidr, prefixForHosts, usableIps, type Cidr, type SubnetNeed } from './model'

export interface VpcOption {
  cidr: string
  /** Por que a opção existe no cenário (ex.: "mesmo bloco do escritório"). */
  note?: string
}

export interface VpcPlannerLabConfig {
  vpcOptions: VpcOption[]
  /** Redes já existentes com que a VPC vai se conectar: o bloco não pode se sobrepor a elas. */
  existing: { name: string; cidr: string }[]
  subnets: SubnetNeed[]
  concepts?: { vpc?: string[]; subnets?: string[] }
}

export interface VpcPlannerLabResponse {
  vpc: string
  subnets: Record<string, string>
}

export const vpcPlannerInitial = (): VpcPlannerLabResponse => ({ vpc: '', subnets: {} })

/** Problemas do bloco da VPC escolhido, inclusive sobreposição com redes existentes e falta de espaço. */
export function vpcChoiceProblems(c: VpcPlannerLabConfig, text: string): string[] {
  const out = blockProblems(text, 'vpc')
  if (out.length) return out
  const vpc = parseCidr(text) as Cidr
  for (const e of c.existing) {
    const other = parseCidr(e.cidr) as Cidr
    if (overlaps(vpc, other)) out.push(`se sobrepõe a ${e.name} (${e.cidr}), e redes sobrepostas não se conectam por peering nem roteiam entre si`)
  }
  if (!allocate(vpc, c.subnets)) out.push(`não cabe todas as sub-redes pedidas`)
  return out
}

export function vpcPlannerSolution(c: VpcPlannerLabConfig): VpcPlannerLabResponse {
  const opt = c.vpcOptions.find((o) => vpcChoiceProblems(c, o.cidr).length === 0)
  if (!opt) throw new Error('Nenhum bloco de VPC válido no cenário')
  const plan = allocate(parseCidr(opt.cidr) as Cidr, c.subnets)!
  return { vpc: opt.cidr, subnets: plan }
}

export const vpcPlannerComplete = (c: VpcPlannerLabConfig, r: VpcPlannerLabResponse) => Boolean(r.vpc) && c.subnets.every((s) => (r.subnets?.[s.id] ?? '').trim() !== '')

/** Problemas de uma sub-rede do plano, considerando o bloco da VPC e as outras sub-redes. */
export function subnetProblems(c: VpcPlannerLabConfig, r: VpcPlannerLabResponse, id: string): string[] {
  const need = c.subnets.find((s) => s.id === id)!
  const text = (r.subnets?.[id] ?? '').trim()
  if (!text) return ['sem bloco definido']
  const vpc = parseCidr(r.vpc)
  const out = blockProblems(text, 'subnet', isCidr(vpc) ? vpc : undefined)
  if (out.length) return out
  const mine = parseCidr(text) as Cidr
  for (const other of c.subnets) {
    if (other.id === id) continue
    const t = parseCidr((r.subnets?.[other.id] ?? '').trim())
    if (isCidr(t) && overlaps(mine, t)) out.push(`se sobrepõe à sub-rede ${other.name} (${cidrText(t)})`)
  }
  if (usableIps(mine.prefix) < need.hosts) out.push(`oferece ${usableIps(mine.prefix)} endereços utilizáveis (o bloco tem ${2 ** (32 - mine.prefix)}, menos os 5 reservados), e são precisos ${need.hosts}`)
  return out
}

export function evaluateVpcPlannerLab(c: VpcPlannerLabConfig, r: VpcPlannerLabResponse) {
  const resp = r ?? vpcPlannerInitial()
  const vp = resp.vpc ? vpcChoiceProblems(c, resp.vpc) : ['nenhum bloco escolhido']
  const items: { concepts?: string[]; score: number; fb: ItemFeedback }[] = [
    {
      concepts: c.concepts?.vpc,
      score: vp.length ? 0 : 1,
      fb: { id: 'vpc', label: `Bloco da VPC: ${resp.vpc || 'sem escolha'}`, status: vp.length ? (resp.vpc ? 'wrong' : 'missed') : 'correct', message: vp.length ? `O bloco ${vp.join('; ')}.` : 'Bloco aceito, sem sobreposição com as redes existentes e com espaço para todas as sub-redes.' },
    },
  ]
  for (const s of c.subnets) {
    const text = (resp.subnets?.[s.id] ?? '').trim()
    const pb = subnetProblems(c, resp, s.id)
    const tight = prefixForHosts(s.hosts)
    items.push({
      concepts: c.concepts?.subnets,
      score: pb.length ? 0 : 1,
      fb: {
        id: s.id,
        label: `${s.name} (${s.az}, ${s.hosts} endereços): ${text || 'sem bloco'}`,
        status: pb.length ? (text ? 'wrong' : 'missed') : 'correct',
        message: pb.length ? `A sub-rede ${pb.join('; ')}.` : `Cabe na VPC, não se sobrepõe às outras e oferece ${usableIps((parseCidr(text) as Cidr).prefix)} endereços utilizáveis${tight ? ` (o menor bloco que serve é /${tight})` : ''}.`,
      },
    })
  }
  return { score: items.reduce((sum, x) => sum + x.score, 0) / Math.max(1, items.length), items }
}
