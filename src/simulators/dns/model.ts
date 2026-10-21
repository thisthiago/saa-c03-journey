/**
 * Resposta do Route 53 segundo a política de roteamento dos registros e as
 * verificações de saúde.
 *
 * Conferido em 21/10/2026:
 * - Políticas: simples, failover, geolocalização, geoproximidade, latência,
 *   baseada em IP, múltiplas respostas e ponderada:
 *   https://docs.aws.amazon.com/Route53/latest/DeveloperGuide/routing-policy.html
 * - Ponderada: peso do registro dividido pela soma; os de peso 0 só entram quando
 *   todos os de peso maior estão sem saúde:
 *   https://docs.aws.amazon.com/Route53/latest/DeveloperGuide/routing-policy-weighted.html
 * - Geolocalização: a região menor vence (país antes de continente); sem registro
 *   padrão, um local sem registro recebe "sem resposta":
 *   https://docs.aws.amazon.com/Route53/latest/DeveloperGuide/routing-policy-geo.html
 * - Múltiplas respostas: até oito registros saudáveis; registro sem verificação de
 *   saúde conta como saudável; com todos sem saúde, devolve até oito deles:
 *   https://docs.aws.amazon.com/Route53/latest/DeveloperGuide/routing-policy-multivalue.html
 * - Failover ativo-passivo: só o primário enquanto ele está saudável:
 *   https://docs.aws.amazon.com/Route53/latest/DeveloperGuide/dns-failover-types.html
 *
 * Simplificações: a ponderada devolve a proporção esperada, e não um sorteio;
 * a latência entre o usuário e cada Região é premissa do cenário.
 */

export type RoutingPolicy = 'simple' | 'weighted' | 'latency' | 'failover' | 'geolocation' | 'multivalue'

export interface DnsRecord {
  id: string
  /** O que a resposta aponta (ex.: "ALB em São Paulo"). */
  label: string
  policy: RoutingPolicy
  weight?: number
  region?: string
  failover?: 'primary' | 'secondary'
  /** Código de país (ex.: "BR"), de continente (ex.: "SA") ou "*" para o registro padrão. */
  location?: string
  /** Ausente = sem verificação de saúde (conta como saudável). */
  healthy?: boolean
}

export interface DnsClient {
  country: string
  continent: string
  /** Latência medida até cada Região (ms), premissa do cenário. */
  latency?: Record<string, number>
}

export interface DnsAnswer {
  /** Registros devolvidos (vazio = sem resposta). */
  answers: string[]
  /** Proporção de cada registro, na ponderada. */
  shares?: Record<string, number>
  trace: string[]
}

const healthyOf = (r: DnsRecord) => r.healthy !== false

export function resolveDns(records: DnsRecord[], client: DnsClient): DnsAnswer {
  if (records.length === 0) return { answers: [], trace: ['Não há registro com esse nome.'] }
  const policy = records[0].policy
  const label = (id: string) => records.find((r) => r.id === id)!.label
  switch (policy) {
    case 'simple':
      return { answers: records.map((r) => r.id), trace: ['Política simples: o Route 53 devolve os valores do registro, sem olhar a saúde.'] }
    case 'weighted': {
      let pool = records.filter((r) => (r.weight ?? 0) > 0 && healthyOf(r))
      let why = 'Entram os registros saudáveis com peso maior que zero.'
      if (pool.length === 0) {
        pool = records.filter((r) => (r.weight ?? 0) === 0 && healthyOf(r))
        why = 'Todos os registros com peso maior que zero estão sem saúde: entram os de peso zero saudáveis.'
      }
      if (pool.length === 0) {
        pool = records.filter((r) => (r.weight ?? 0) > 0)
        why = 'Nenhum registro está saudável: o Route 53 volta a responder com os registros de peso maior que zero.'
      }
      const sum = pool.reduce((s, r) => s + (r.weight ?? 0), 0)
      const shares = Object.fromEntries(records.map((r) => [r.id, pool.includes(r) ? (sum === 0 ? 1 / pool.length : (r.weight ?? 0) / sum) : 0]))
      return { answers: pool.map((r) => r.id), shares, trace: [why, `Cada um recebe o peso dividido pela soma: ${pool.map((r) => `${r.label} ${Math.round(shares[r.id] * 10000) / 100}%`).join(', ')}.`] }
    }
    case 'latency': {
      const lat = (r: DnsRecord) => client.latency?.[r.region!] ?? Infinity
      const pool = records.filter(healthyOf)
      const pick = [...(pool.length ? pool : records)].sort((a, b) => lat(a) - lat(b))[0]
      return { answers: [pick.id], trace: [`Política de latência: entre os registros saudáveis, vence a Região de menor latência para este usuário: ${label(pick.id)} (${lat(pick)} ms).`] }
    }
    case 'failover': {
      const primary = records.find((r) => r.failover === 'primary')
      const secondary = records.find((r) => r.failover === 'secondary')
      if (primary && healthyOf(primary)) return { answers: [primary.id], trace: ['Failover: o primário está saudável e responde sozinho.'] }
      if (secondary && healthyOf(secondary)) return { answers: [secondary.id], trace: ['Failover: o primário está sem saúde, e o Route 53 passa a responder com o secundário.'] }
      return { answers: primary ? [primary.id] : [], trace: ['Failover: nenhum dos dois está saudável.'] }
    }
    case 'geolocation': {
      const byCountry = records.find((r) => r.location === client.country)
      const byContinent = records.find((r) => r.location === client.continent)
      const fallback = records.find((r) => r.location === '*')
      const pick = byCountry ?? byContinent ?? fallback
      if (!pick) return { answers: [], trace: [`Geolocalização: não há registro para ${client.country} nem para ${client.continent}, e não há registro padrão. O Route 53 responde "sem resposta".`] }
      const why = byCountry ? `o registro do país ${client.country}` : byContinent ? `o registro do continente ${client.continent}` : 'o registro padrão'
      return { answers: [pick.id], trace: [`Geolocalização: vale a região mais específica que cobre o usuário, ${why}: ${pick.label}.`] }
    }
    case 'multivalue': {
      const healthy = records.filter(healthyOf)
      const pool = (healthy.length ? healthy : records).slice(0, 8)
      return { answers: pool.map((r) => r.id), trace: [healthy.length ? `Múltiplas respostas: o Route 53 devolve até oito registros saudáveis (${pool.length} aqui).` : 'Múltiplas respostas: todos estão sem saúde, e o Route 53 devolve até oito deles mesmo assim.'] }
    }
  }
}
