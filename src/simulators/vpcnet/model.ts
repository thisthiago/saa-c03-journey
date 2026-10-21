/**
 * Endereçamento e roteamento numa VPC: blocos CIDR, IPs reservados por
 * sub-rede, validação de um plano de sub-redes e a escolha da rota pela
 * regra do prefixo mais específico.
 *
 * Conferido em 21/10/2026:
 * - Bloco da VPC e da sub-rede entre /16 e /28; blocos proibidos (0.0.0.0/8,
 *   127.0.0.0/8, 169.254.0.0/16, 224.0.0.0/4); sub-redes da mesma VPC não se
 *   sobrepõem: https://docs.aws.amazon.com/vpc/latest/userguide/vpc-cidr-blocks.html
 * - Os quatro primeiros endereços e o último de cada sub-rede são reservados:
 *   https://docs.aws.amazon.com/vpc/latest/userguide/subnet-sizing.html
 * - Prefixo mais específico; com o mesmo destino, rota estática vence a de
 *   lista de prefixos, que vence a propagada:
 *   https://docs.aws.amazon.com/vpc/latest/userguide/route-tables-priority.html
 *
 * Simplificação: só IPv4. Um bloco desalinhado (ex.: 10.0.0.18/24) é tratado
 * como erro, embora a API o converta para a forma canônica.
 */

export interface Cidr {
  base: number
  prefix: number
}

const MASK = (prefix: number) => (prefix === 0 ? 0 : (0xffffffff << (32 - prefix)) >>> 0)

export function ipToInt(ip: string): number | null {
  const parts = ip.split('.')
  if (parts.length !== 4) return null
  let n = 0
  for (const p of parts) {
    if (!/^\d{1,3}$/.test(p)) return null
    const v = Number(p)
    if (v > 255) return null
    n = n * 256 + v
  }
  return n >>> 0
}

export const intToIp = (n: number) => [n >>> 24, (n >>> 16) & 255, (n >>> 8) & 255, n & 255].join('.')

export type CidrError = 'format' | 'unaligned'

/** Lê "10.0.1.0/24". Devolve o erro quando o texto não é um bloco válido ou não está alinhado. */
export function parseCidr(text: string): Cidr | CidrError {
  const m = /^\s*([\d.]+)\/(\d{1,2})\s*$/.exec(text)
  if (!m) return 'format'
  const ip = ipToInt(m[1])
  const prefix = Number(m[2])
  if (ip === null || prefix > 32) return 'format'
  if ((ip & MASK(prefix)) >>> 0 !== ip) return 'unaligned'
  return { base: ip, prefix }
}

export const isCidr = (v: Cidr | CidrError): v is Cidr => typeof v === 'object'

export const cidrText = (c: Cidr) => `${intToIp(c.base)}/${c.prefix}`
export const blockSize = (prefix: number) => 2 ** (32 - prefix)
export const lastIp = (c: Cidr) => c.base + blockSize(c.prefix) - 1
/** Endereços que sobram para recursos numa sub-rede (o bloco menos os cinco reservados). */
export const usableIps = (prefix: number) => Math.max(0, blockSize(prefix) - 5)

export const contains = (outer: Cidr, inner: Cidr) => inner.prefix >= outer.prefix && inner.base >= outer.base && lastIp(inner) <= lastIp(outer)
export const overlaps = (a: Cidr, b: Cidr) => a.base <= lastIp(b) && b.base <= lastIp(a)
export const containsIp = (c: Cidr, ip: number) => ip >= c.base && ip <= lastIp(c)

/** Menor sub-rede (maior prefixo) que comporta `hosts` endereços utilizáveis, dentro do limite /28 a /16. */
export function prefixForHosts(hosts: number): number | null {
  for (let p = 28; p >= 16; p--) if (usableIps(p) >= hosts) return p
  return null
}

const FORBIDDEN = ['0.0.0.0/8', '127.0.0.0/8', '169.254.0.0/16', '224.0.0.0/4'].map((t) => parseCidr(t) as Cidr)

/** Problemas que fazem a AWS recusar o bloco (vazio quando é aceito). */
export function blockProblems(text: string, kind: 'vpc' | 'subnet', vpc?: Cidr): string[] {
  const c = parseCidr(text)
  if (c === 'format') return [`"${text}" não é um bloco CIDR válido (formato esperado: 10.0.1.0/24)`]
  if (c === 'unaligned') return [`${text} não começa no início de um bloco desse tamanho`]
  const out: string[] = []
  if (c.prefix < 16 || c.prefix > 28) out.push(`o tamanho /${c.prefix} está fora do permitido (de /16 a /28)`)
  if (kind === 'vpc') {
    const bad = FORBIDDEN.find((f) => overlaps(f, c))
    if (bad) out.push(`${cidrText(bad)} é uma faixa reservada que não pode ser usada numa VPC`)
  }
  if (kind === 'subnet' && vpc && !contains(vpc, c)) out.push(`${text} fica fora do bloco da VPC (${cidrText(vpc)})`)
  return out
}

export interface ReservedIp {
  ip: string
  role: string
}

/** Os cinco endereços que a AWS reserva em cada sub-rede. */
export function reservedIps(c: Cidr): ReservedIp[] {
  return [
    { ip: intToIp(c.base), role: 'endereço da rede' },
    { ip: intToIp(c.base + 1), role: 'roteador da VPC' },
    { ip: intToIp(c.base + 2), role: 'servidor DNS da AWS' },
    { ip: intToIp(c.base + 3), role: 'reservado para uso futuro' },
    { ip: intToIp(lastIp(c)), role: 'endereço de broadcast (não suportado na VPC)' },
  ]
}

// ---------------------------------------------------------------------------
// Roteamento
// ---------------------------------------------------------------------------

export interface Route {
  /** Um bloco CIDR ou o nome de uma lista de prefixos (resolvida por `prefixLists`). */
  destination: string
  target: string
  kind?: 'static' | 'prefix-list' | 'propagated'
}

const KIND_RANK = { static: 0, 'prefix-list': 1, propagated: 2 } as const

export interface RouteDecision {
  route?: Route
  /** Prefixo do bloco que casou. */
  matched?: string
  trace: string[]
}

/** Escolhe a rota de um destino: o prefixo mais específico vence; no empate, estática, lista de prefixos e propagada, nessa ordem. */
export function lookupRoute(routes: Route[], destination: string, prefixLists: Record<string, string[]> = {}): RouteDecision {
  const ip = ipToInt(destination)
  if (ip === null) throw new Error(`Destino inválido: ${destination}`)
  const candidates: { route: Route; cidr: Cidr }[] = []
  for (const r of routes) {
    const blocks = prefixLists[r.destination] ?? [r.destination]
    for (const b of blocks) {
      const c = parseCidr(b)
      if (isCidr(c) && containsIp(c, ip)) candidates.push({ route: r, cidr: c })
    }
  }
  if (candidates.length === 0) return { trace: [`Nenhuma rota cobre ${destination}: o pacote é descartado.`] }
  candidates.sort((a, b) => b.cidr.prefix - a.cidr.prefix || KIND_RANK[a.route.kind ?? 'static'] - KIND_RANK[b.route.kind ?? 'static'])
  const win = candidates[0]
  const others = candidates.slice(1).map((c) => `${c.route.destination} (/${c.cidr.prefix})`)
  return {
    route: win.route,
    matched: cidrText(win.cidr),
    trace: [
      `Rotas que cobrem ${destination}: ${candidates.map((c) => `${c.route.destination}${prefixLists[c.route.destination] ? ` (contém ${cidrText(c.cidr)})` : ''}`).join(', ')}.`,
      others.length ? `Vence ${win.route.destination}, com o prefixo mais específico (/${win.cidr.prefix}), e o tráfego vai para ${win.route.target}.` : `Só ${win.route.destination} cobre o destino, e o tráfego vai para ${win.route.target}.`,
    ],
  }
}

// ---------------------------------------------------------------------------
// Plano de sub-redes
// ---------------------------------------------------------------------------

export interface SubnetNeed {
  id: string
  name: string
  az: string
  /** Endereços necessários para recursos (sem contar os reservados). */
  hosts: number
}

/** Distribui as sub-redes no bloco da VPC, das maiores para as menores, cada uma no menor tamanho que comporta os recursos. */
export function allocate(vpc: Cidr, needs: SubnetNeed[]): Record<string, string> | null {
  const sorted = [...needs].sort((a, b) => b.hosts - a.hosts)
  let cursor = vpc.base
  const out: Record<string, string> = {}
  for (const n of sorted) {
    const p = prefixForHosts(n.hosts)
    if (p === null) return null
    const size = blockSize(p)
    cursor = Math.ceil(cursor / size) * size
    if (cursor + size - 1 > lastIp(vpc)) return null
    out[n.id] = cidrText({ base: cursor, prefix: p })
    cursor += size
  }
  return out
}
