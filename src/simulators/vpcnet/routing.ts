/**
 * Laboratório "Tabelas de rotas": escolher, para cada sub-rede, para onde vai
 * o tráfego destinado à internet (0.0.0.0/0 e ::/0).
 *
 * Conferido em 21/10/2026:
 * - Sub-rede pública é a que tem rota para o internet gateway; a privada não
 *   tem: https://docs.aws.amazon.com/vpc/latest/userguide/VPC_Internet_Gateway.html
 * - O NAT Gateway público fica numa sub-rede pública e encaminha ao internet
 *   gateway; conexões só podem ser iniciadas de dentro da VPC:
 *   https://docs.aws.amazon.com/vpc/latest/userguide/vpc-nat-gateway.html
 * - Cada NAT Gateway zonal fica numa AZ; se ela cair, as outras AZs que dependem
 *   dele perdem a internet. Recomendação: um por AZ, com rotas na mesma AZ:
 *   https://docs.aws.amazon.com/vpc/latest/userguide/nat-gateway-basics.html
 * - O NAT Gateway regional se expande sozinho pelas AZs e não precisa de sub-rede
 *   pública: https://docs.aws.amazon.com/vpc/latest/userguide/nat-gateways-regional.html
 * - O egress-only internet gateway só permite saída em IPv6:
 *   https://docs.aws.amazon.com/vpc/latest/userguide/egress-only-internet-gateway.html
 *
 * Simplificação: as instâncias das sub-redes que precisam receber conexões da
 * internet já têm IP público; security groups e network ACLs ficam para a
 * fase seguinte.
 */
import type { ItemFeedback } from '../../engine/types'

export type InternetNeed = 'in-out' | 'out-only' | 'none'

export interface RtSubnet {
  id: string
  name: string
  az: string
  v4: InternetNeed
  v6?: InternetNeed
  concepts?: string[]
}

export interface NatGw {
  id: string
  name: string
  /** Sub-rede onde o NAT Gateway zonal fica (ausente no regional). */
  subnet?: string
  az?: string
  regional?: boolean
}

export interface RouteTableLabConfig {
  subnets: RtSubnet[]
  nats: NatGw[]
  /** A VPC tem bloco IPv6 (mostra a coluna ::/0). */
  ipv6?: boolean
}

export interface SubnetRoutes {
  /** "none", "igw" ou o id de um NAT Gateway. */
  v4: string
  /** "none", "igw" ou "eigw". */
  v6: string
}

export interface RouteTableLabResponse {
  tables: Record<string, SubnetRoutes>
}

export const NEED_LABEL: Record<InternetNeed, string> = {
  'in-out': 'recebe conexões da internet e acessa a internet',
  'out-only': 'só acessa a internet, sem receber conexões de fora',
  none: 'não tem nenhum caminho para a internet',
}

export const routeTableInitial = (c: RouteTableLabConfig): RouteTableLabResponse => ({ tables: Object.fromEntries(c.subnets.map((s) => [s.id, { v4: 'none', v6: 'none' }])) })

export function targetLabel(c: RouteTableLabConfig, t: string): string {
  if (t === 'none') return 'sem rota'
  if (t === 'igw') return 'internet gateway'
  if (t === 'eigw') return 'egress-only internet gateway'
  return c.nats.find((n) => n.id === t)?.name ?? t
}

/** O NAT Gateway alcança a internet? O zonal depende da rota da sua sub-rede para o internet gateway. */
export function natWorks(c: RouteTableLabConfig, r: RouteTableLabResponse, natId: string): boolean {
  const nat = c.nats.find((n) => n.id === natId)
  if (!nat) return false
  if (nat.regional) return true
  return r.tables?.[nat.subnet!]?.v4 === 'igw'
}

interface Part {
  score: number
  message: string
}

function judgeV4(c: RouteTableLabConfig, r: RouteTableLabResponse, s: RtSubnet, t: string): Part {
  const nat = c.nats.find((n) => n.id === t)
  if (s.v4 === 'in-out') {
    if (t === 'igw') return { score: 1, message: 'IPv4: rota 0.0.0.0/0 para o internet gateway, e a sub-rede é pública.' }
    if (nat) return { score: 0, message: 'IPv4: pelo NAT Gateway a sub-rede só sai; ninguém na internet consegue iniciar uma conexão com ela.' }
    return { score: 0, message: 'IPv4: sem rota para o internet gateway, a sub-rede é privada e não recebe nada da internet.' }
  }
  if (s.v4 === 'out-only') {
    if (nat) {
      if (!natWorks(c, r, t)) return { score: 0, message: `IPv4: ${nat.name} fica numa sub-rede sem rota para o internet gateway, e os pacotes não saem.` }
      if (nat.regional || nat.az === s.az) return { score: 1, message: `IPv4: sai por ${nat.name}${nat.regional ? ', que acompanha as AZs sozinho' : ', na mesma AZ'}, e ninguém de fora inicia conexões.` }
      return { score: 0.5, message: `IPv4: funciona, mas depende de ${nat.name}, na AZ ${nat.az}. Se essa AZ cair, a sub-rede perde a internet, e cada GB atravessa zonas.` }
    }
    if (t === 'igw') return { score: 0, message: 'IPv4: sem IP público as instâncias não saem pelo internet gateway, e com IP público ficariam abertas a conexões vindas da internet.' }
    return { score: 0, message: 'IPv4: sem rota para a internet, as instâncias não baixam atualizações nem chamam APIs externas.' }
  }
  if (t === 'none') return { score: 1, message: 'IPv4: nenhum caminho para a internet, como pedido.' }
  return { score: 0, message: `IPv4: a rota para ${targetLabel(c, t)} cria um caminho para a internet que o requisito proíbe.` }
}

function judgeV6(s: RtSubnet, t: string): Part {
  if (!s.v6) return { score: 1, message: '' }
  if (s.v6 === 'in-out') return t === 'igw' ? { score: 1, message: 'IPv6: rota ::/0 para o internet gateway.' } : { score: 0, message: 'IPv6: sem rota ::/0 para o internet gateway, a sub-rede não recebe conexões em IPv6.' }
  if (s.v6 === 'out-only') {
    if (t === 'eigw') return { score: 1, message: 'IPv6: sai pelo egress-only internet gateway, que não aceita conexões iniciadas de fora.' }
    if (t === 'igw') return { score: 0, message: 'IPv6: endereços IPv6 são públicos; com ::/0 no internet gateway, a internet pode iniciar conexões com as instâncias.' }
    return { score: 0, message: 'IPv6: sem rota ::/0, as instâncias não saem em IPv6.' }
  }
  return t === 'none' ? { score: 1, message: 'IPv6: sem caminho para a internet.' } : { score: 0, message: 'IPv6: a rota ::/0 cria um caminho para a internet que o requisito proíbe.' }
}

export function judgeSubnet(c: RouteTableLabConfig, r: RouteTableLabResponse, s: RtSubnet): { score: number; fb: ItemFeedback } {
  const t = r.tables?.[s.id] ?? { v4: 'none', v6: 'none' }
  const a = judgeV4(c, r, s, t.v4)
  const b = judgeV6(s, t.v6)
  const score = Math.min(a.score, b.score)
  const label = `${s.name}: 0.0.0.0/0 para ${targetLabel(c, t.v4)}${s.v6 ? `, ::/0 para ${targetLabel(c, t.v6)}` : ''}`
  return { score, fb: { id: s.id, label, status: score === 1 ? 'correct' : score > 0 ? 'partial' : 'wrong', message: [a.message, b.message].filter(Boolean).join(' ') } }
}

export function routeTableSolution(c: RouteTableLabConfig): RouteTableLabResponse {
  const best = (s: RtSubnet) => {
    if (s.v4 === 'in-out') return 'igw'
    if (s.v4 === 'none') return 'none'
    const nat = c.nats.find((n) => !n.regional && n.az === s.az) ?? c.nats.find((n) => n.regional)
    if (!nat) throw new Error(`Sem NAT Gateway para ${s.id}`)
    return nat.id
  }
  const v6 = (s: RtSubnet) => (s.v6 === 'in-out' ? 'igw' : s.v6 === 'out-only' ? 'eigw' : 'none')
  return { tables: Object.fromEntries(c.subnets.map((s) => [s.id, { v4: best(s), v6: v6(s) }])) }
}

export function evaluateRouteTableLab(c: RouteTableLabConfig, r: RouteTableLabResponse) {
  const resp = r ?? routeTableInitial(c)
  const items = c.subnets.map((s) => ({ concepts: s.concepts, ...judgeSubnet(c, resp, s) }))
  return { score: items.reduce((sum, x) => sum + x.score, 0) / Math.max(1, items.length), items }
}
