/**
 * Conexão entre VPCs e com a rede da empresa: VPC peering e Transit Gateway.
 *
 * Conferido em 21/10/2026:
 * - Peering: um para um, sem transitividade, sem blocos sobrepostos e sem
 *   roteamento de borda a borda (a VPC B não usa a VPN, o Direct Connect, o
 *   internet gateway ou o NAT da VPC A):
 *   https://docs.aws.amazon.com/vpc/latest/peering/vpc-peering-basics.html
 * - Transit Gateway: roteador regional; cada anexo se associa a uma tabela de
 *   rotas e propaga suas rotas para uma ou mais tabelas; tabelas separadas
 *   isolam grupos de VPCs; a VPC não tem ECMP porque os blocos não podem se
 *   sobrepor: https://docs.aws.amazon.com/vpc/latest/tgw/how-transit-gateways-work.html
 * - Preços da AWS Price List: hora de cada anexo e GB processado pelo Transit
 *   Gateway (ver src/content/pricing/network-prices.json).
 *
 * Simplificações: o peering não tem custo por hora nem por GB processado; a
 * transferência entre zonas vale igual nos dois caminhos e fica fora da conta.
 * Todo anexo do Transit Gateway (VPC ou VPN) custa o preço do anexo de VPC.
 */
import { networkPrices, HOURS_PER_MONTH } from '../network-prices'
import { overlaps, parseCidr, type Cidr } from '../vpcnet/model'

export interface Net {
  id: string
  name: string
  cidr: string
  /** Rede da empresa, ligada por VPN. */
  onPrem?: boolean
}

export interface TgwTable {
  id: string
  name: string
  /** Anexos associados a esta tabela (usam as rotas dela). */
  associate: string[]
  /** Anexos que propagam as próprias rotas para esta tabela. */
  propagate: string[]
}

export type Topology =
  | {
      kind: 'peering'
      pairs: [string, string][]
      /** VPC à qual a VPN da rede da empresa está ligada (por virtual private gateway). */
      vpnTo?: string
    }
  | { kind: 'tgw'; tables: TgwTable[] }

const nameOf = (nets: Net[], id: string) => nets.find((n) => n.id === id)?.name ?? id
const cidrOf = (nets: Net[], id: string) => parseCidr(nets.find((n) => n.id === id)!.cidr) as Cidr

/** Problemas que impedem montar a topologia (vazio quando dá para criar). */
export function topologyProblems(nets: Net[], t: Topology): string[] {
  const out: string[] = []
  if (t.kind === 'peering') {
    for (const [a, b] of t.pairs) if (overlaps(cidrOf(nets, a), cidrOf(nets, b))) out.push(`o peering entre ${nameOf(nets, a)} e ${nameOf(nets, b)} não pode ser criado: os blocos se sobrepõem`)
  } else {
    for (const tb of t.tables) {
      const ids = tb.propagate
      for (let i = 0; i < ids.length; i++)
        for (let j = i + 1; j < ids.length; j++)
          if (overlaps(cidrOf(nets, ids[i]), cidrOf(nets, ids[j]))) out.push(`na tabela ${tb.name}, ${nameOf(nets, ids[i])} e ${nameOf(nets, ids[j])} propagam blocos sobrepostos, e as rotas entram em conflito`)
    }
  }
  return out
}

export interface ReachVerdict {
  ok: boolean
  why: string
}

/** A rede `a` alcança a rede `b` (e a resposta volta)? */
export function reaches(nets: Net[], t: Topology, a: string, b: string): ReachVerdict {
  const A = nameOf(nets, a)
  const B = nameOf(nets, b)
  if (t.kind === 'peering') {
    const onPrem = nets.find((n) => n.onPrem)?.id
    if (a === onPrem || b === onPrem) {
      const vpc = a === onPrem ? b : a
      if (t.vpnTo === vpc) return { ok: true, why: `A VPN da empresa está ligada à ${nameOf(nets, vpc)}.` }
      return { ok: false, why: `A VPN da empresa chega só à ${t.vpnTo ? nameOf(nets, t.vpnTo) : 'nenhuma VPC'}. O peering não permite que outra VPC use essa VPN (sem roteamento de borda a borda).` }
    }
    const direct = t.pairs.some(([x, y]) => (x === a && y === b) || (x === b && y === a))
    if (direct && !overlaps(cidrOf(nets, a), cidrOf(nets, b))) return { ok: true, why: `${A} e ${B} têm um peering direto.` }
    if (direct) return { ok: false, why: `O peering entre ${A} e ${B} não existe: os blocos se sobrepõem.` }
    const via = t.pairs.filter(([x, y]) => x === a || y === a).map(([x, y]) => (x === a ? y : x)).find((m) => t.pairs.some(([x, y]) => (x === m && y === b) || (x === b && y === m)))
    return { ok: false, why: via ? `${A} e ${B} só se ligam passando por ${nameOf(nets, via)}, e o peering não é transitivo.` : `Não há peering entre ${A} e ${B}.` }
  }
  const tableOf = (id: string) => t.tables.find((tb) => tb.associate.includes(id))
  const ta = tableOf(a)
  const tb = tableOf(b)
  if (!ta || !tb) return { ok: false, why: `${!ta ? A : B} não está anexada ao Transit Gateway.` }
  if (!ta.propagate.includes(b)) return { ok: false, why: `A tabela ${ta.name}, usada por ${A}, não tem rota para ${B}.` }
  if (!tb.propagate.includes(a)) return { ok: false, why: `A ida funciona, mas a tabela ${tb.name}, usada por ${B}, não tem rota de volta para ${A}.` }
  return { ok: true, why: `${A} usa a tabela ${ta.name}, que tem rota para ${B}, e a tabela ${tb.name} tem a rota de volta.` }
}

/** Itens que a equipe precisa criar e manter: peerings (com rotas nos dois lados) ou anexos ao Transit Gateway. */
export function connectionsToManage(t: Topology): number {
  if (t.kind === 'peering') return t.pairs.length
  return new Set(t.tables.flatMap((tb) => tb.associate)).size
}

/** Custo mensal da topologia, em US$: só o Transit Gateway tem custo por hora de anexo e por GB processado. */
export function topologyMonthly(t: Topology, gbMonth: number, region?: string): number {
  if (t.kind === 'peering') return 0
  const p = networkPrices(region).transitGateway
  const attachments = new Set(t.tables.flatMap((tb) => tb.associate)).size
  return attachments * p.attachmentHour * HOURS_PER_MONTH + gbMonth * p.perGB
}
