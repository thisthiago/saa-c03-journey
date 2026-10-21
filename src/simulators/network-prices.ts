/**
 * Tabela de preços da trilha Redes na AWS (gerada por
 * scripts/fetch-network-prices.mjs a partir da AWS Price List).
 *
 * NAT Gateway, endpoints de interface, Transit Gateway, VPN, Client VPN, IPv4
 * público e transferência entre zonas, na primeira faixa paga. Sem nível
 * gratuito, impostos nem descontos por volume.
 */
import table from '../content/pricing/network-prices.json'

export interface NetworkRegionPrices {
  label: string
  offers: Record<string, string>
  nat: { hour: number; perGB: number }
  /** Por endpoint e por zona de disponibilidade. */
  interfaceEndpoint: { hourPerAz: number; perGB: number }
  transitGateway: { attachmentHour: number; perGB: number }
  vpn: { connectionHour: number }
  clientVpn: { endpointAssociationHour: number; connectionHour: number }
  publicIpv4Hour: number
  /** Transferência entre zonas de disponibilidade, cobrada em cada sentido. */
  interAzPerGB: number
  sourceUrls: string[]
}

export interface NetworkPriceTable {
  source: string
  sourceDocs: string
  retrievedAt: string
  currency: 'USD'
  notes: string[]
  regions: Record<string, NetworkRegionPrices>
}

export const NETWORK_PRICES = table as unknown as NetworkPriceTable

export const NETWORK_REGION = 'us-east-1'

/** Horas num mês, como na calculadora de preços da AWS. */
export const HOURS_PER_MONTH = 730

/** Data da tabela no formato dd/mm/aaaa, para os selos da interface. */
export const NET_PRICE_DATE = NETWORK_PRICES.retrievedAt.split('-').reverse().join('/')

export function networkPrices(region: string = NETWORK_REGION): NetworkRegionPrices {
  const r = NETWORK_PRICES.regions[region]
  if (!r) throw new Error(`Região sem preços de rede: ${region}`)
  return r
}
