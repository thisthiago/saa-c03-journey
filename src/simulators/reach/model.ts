/**
 * Caminho de uma conexão TCP dentro da VPC: security groups (com estado) e
 * network ACLs (sem estado), na ida e na volta.
 *
 * Conferido em 21/10/2026:
 * - Security group: só regras de permissão, avalia todas as regras, com estado
 *   (a resposta passa sozinha); um grupo novo não tem regras de entrada e
 *   permite toda a saída: https://docs.aws.amazon.com/vpc/latest/userguide/vpc-security-groups.html
 * - Network ACL: permite e nega, avalia em ordem crescente até a primeira regra
 *   que casa, regra * nega o resto, sem estado (a resposta precisa de regra própria):
 *   https://docs.aws.amazon.com/vpc/latest/userguide/vpc-network-acls.html
 * - A ACL é avaliada quando o tráfego entra e sai da sub-rede, não dentro dela.
 * - A porta de resposta é efêmera e quem escolhe é o cliente (Linux 32768-61000,
 *   Windows Server 2008 ou mais novo 49152-65535, NAT Gateway e ELB 1024-65535):
 *   https://docs.aws.amazon.com/vpc/latest/userguide/custom-network-acl.html
 *
 * Simplificações: só TCP e IPv4; a origem "internet" chega pelo internet gateway
 * a uma instância com IP público numa sub-rede pública; não há roteamento entre
 * VPCs nem NAT.
 */
import { containsIp, ipToInt, parseCidr, type Cidr } from '../vpcnet/model'

export type Ports = [number, number] | 'all'

export interface NaclRule {
  num: number
  action: 'allow' | 'deny'
  /** Origem (entrada) ou destino (saída). */
  cidr: string
  ports: Ports
}

export interface SgRule {
  /** Um bloco CIDR ou o id de outro security group. */
  peer: string
  ports: Ports
}

export interface ReachSubnet {
  id: string
  name: string
  cidr: string
  /** Tem rota para o internet gateway. */
  public?: boolean
  naclIn: NaclRule[]
  naclOut: NaclRule[]
}

export interface ReachInstance {
  id: string
  name: string
  subnet: string
  ip: string
  /** Tem IP público (necessário para receber da internet). */
  publicIp?: boolean
  sg: string
}

export interface SecurityGroup {
  id: string
  name: string
  inbound: SgRule[]
  /** Ausente = a regra padrão de saída (tudo permitido). */
  outbound?: SgRule[]
}

export interface ReachWorld {
  subnets: ReachSubnet[]
  instances: ReachInstance[]
  groups: SecurityGroup[]
}

export interface Flow {
  id: string
  /** "internet" ou o id de uma instância. */
  from: string
  to: string
  port: number
  /** Porta efêmera do cliente (padrão 50000). */
  clientPort?: number
  /** IP de origem quando o cliente está na internet (padrão INTERNET_IP). */
  fromIp?: string
}

export const INTERNET_IP = '203.0.113.10'

export type ReachOutcome = 'delivered' | 'route' | 'sg-in' | 'sg-out' | 'nacl-in' | 'nacl-out' | 'nacl-response'

export const OUTCOME_LABEL: Record<ReachOutcome, string> = {
  delivered: 'a conexão funciona',
  route: 'não há caminho até o destino',
  'sg-in': 'o security group do destino bloqueia a entrada',
  'sg-out': 'o security group da origem bloqueia a saída',
  'nacl-in': 'a network ACL bloqueia a entrada na sub-rede do destino',
  'nacl-out': 'a network ACL bloqueia a saída da sub-rede da origem',
  'nacl-response': 'a resposta é bloqueada por uma network ACL',
}

export interface ReachResult {
  outcome: ReachOutcome
  trace: string[]
}

const inPorts = (p: Ports, port: number) => p === 'all' || (port >= p[0] && port <= p[1])
const portsText = (p: Ports) => (p === 'all' ? 'todas as portas' : p[0] === p[1] ? `porta ${p[0]}` : `portas ${p[0]}-${p[1]}`)

/** Primeira regra da ACL (em ordem crescente) que casa; sem nenhuma, vale a regra * que nega. */
export function naclDecision(rules: NaclRule[], ip: string, port: number): { allowed: boolean; rule: string } {
  const n = ipToInt(ip)!
  const sorted = [...rules].sort((a, b) => a.num - b.num)
  for (const r of sorted) {
    if (containsIp(parseCidr(r.cidr) as Cidr, n) && inPorts(r.ports, port)) return { allowed: r.action === 'allow', rule: `regra ${r.num} (${r.action === 'allow' ? 'permite' : 'nega'} ${r.cidr}, ${portsText(r.ports)})` }
  }
  return { allowed: false, rule: 'regra * (nega tudo o que nenhuma regra anterior permitiu)' }
}

function sgAllows(rules: SgRule[], peerIp: string, peerSg: string | undefined, port: number): boolean {
  const n = ipToInt(peerIp)!
  return rules.some((r) => inPorts(r.ports, port) && (r.peer.startsWith('sg-') ? r.peer === peerSg : containsIp(parseCidr(r.peer) as Cidr, n)))
}

/** Percorre a ida e a volta de uma conexão TCP e devolve onde ela para. */
export function traceFlow(w: ReachWorld, f: Flow): ReachResult {
  const inst = (id: string) => w.instances.find((i) => i.id === id)
  const sub = (id: string) => w.subnets.find((s) => s.id === id)!
  const group = (id: string) => w.groups.find((g) => g.id === id)!
  const dst = inst(f.to)
  if (!dst) throw new Error(`Destino inexistente: ${f.to}`)
  const src = f.from === 'internet' ? undefined : inst(f.from)
  const srcIp = src ? src.ip : (f.fromIp ?? INTERNET_IP)
  const srcName = src ? src.name : 'a internet'
  const dstSub = sub(dst.subnet)
  const srcSub = src ? sub(src.subnet) : undefined
  const sameSubnet = srcSub?.id === dstSub.id
  const eph = f.clientPort ?? 50000
  const trace: string[] = [`${srcName} abre uma conexão TCP com ${dst.name} na porta ${f.port}, usando a porta efêmera ${eph}.`]
  const stop = (outcome: ReachOutcome, why: string): ReachResult => ({ outcome, trace: [...trace, why] })

  if (!src && !(dstSub.public && dst.publicIp)) return stop('route', `${dst.name} ${dstSub.public ? 'não tem IP público' : 'está numa sub-rede privada, sem rota para o internet gateway'}: a internet não chega até ela.`)
  if (src) {
    const out = group(src.sg).outbound
    if (out && !sgAllows(out, dst.ip, dst.sg, f.port)) return stop('sg-out', `O security group de ${src.name} não tem regra de saída para ${dst.ip} na porta ${f.port}.`)
    trace.push(`O security group de ${src.name} permite a saída.`)
  }
  if (srcSub && !sameSubnet) {
    const d = naclDecision(srcSub.naclOut, dst.ip, f.port)
    if (!d.allowed) return stop('nacl-out', `Saída da sub-rede ${srcSub.name}: ${d.rule}.`)
    trace.push(`Saída da sub-rede ${srcSub.name}: ${d.rule}.`)
  }
  if (!sameSubnet) {
    const d = naclDecision(dstSub.naclIn, srcIp, f.port)
    if (!d.allowed) return stop('nacl-in', `Entrada na sub-rede ${dstSub.name}: ${d.rule}.`)
    trace.push(`Entrada na sub-rede ${dstSub.name}: ${d.rule}.`)
  }
  if (!sgAllows(group(dst.sg).inbound, srcIp, src?.sg, f.port)) return stop('sg-in', `O security group ${group(dst.sg).name} não tem regra de entrada para ${src ? src.name : 'a internet'} na porta ${f.port}.`)
  trace.push(`O security group ${group(dst.sg).name} permite a entrada. Como ele tem estado, a resposta sai sem precisar de outra regra.`)
  if (!sameSubnet) {
    const d = naclDecision(dstSub.naclOut, srcIp, eph)
    if (!d.allowed) return stop('nacl-response', `A resposta sai da sub-rede ${dstSub.name} para a porta ${eph}: ${d.rule}. A ACL não tem estado e não lembra da ida.`)
    trace.push(`A resposta sai da sub-rede ${dstSub.name}: ${d.rule}.`)
  }
  if (srcSub && !sameSubnet) {
    const d = naclDecision(srcSub.naclIn, dst.ip, eph)
    if (!d.allowed) return stop('nacl-response', `A resposta entra na sub-rede ${srcSub.name} na porta ${eph}: ${d.rule}. A ACL não tem estado e não lembra da ida.`)
    trace.push(`A resposta entra na sub-rede ${srcSub.name}: ${d.rule}.`)
  }
  return { outcome: 'delivered', trace: [...trace, 'A conexão funciona nos dois sentidos.'] }
}

/** ACL padrão da VPC: permite tudo nos dois sentidos. */
export const DEFAULT_NACL: NaclRule[] = [{ num: 100, action: 'allow', cidr: '0.0.0.0/0', ports: 'all' }]
