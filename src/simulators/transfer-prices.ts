/**
 * Tabela de preços de transferência de dados da trilha Arquitetura e
 * otimização na AWS (gerada por scripts/fetch-transfer-prices.mjs a partir da
 * AWS Price List).
 *
 * Entrada da internet, saída para a internet, entre zonas, entre Regiões e
 * pelo CloudFront, na primeira faixa paga. Sem nível gratuito, impostos nem
 * descontos por volume. O NAT Gateway e os endpoints vêm da tabela de Redes.
 */
import table from '../content/pricing/transfer-prices.json'

export interface TransferRegionPrices {
  label: string
  offers: Record<string, string>
  internetInPerGB: number
  internetOutPerGB: number
  /** Cobrada em cada sentido. */
  interAzPerGB: number
  /** Saída para outra Região, por Região de destino. */
  interRegionOutPerGB: Record<string, number>
  /** Da Região para o CloudFront (busca na origem). */
  cloudFrontOriginFetchPerGB: number
  /** Do CloudFront para a internet, nos Estados Unidos. */
  cloudFrontOutPerGB: number
  sourceUrls: string[]
}

export interface TransferPriceTable {
  source: string
  sourceDocs: string
  retrievedAt: string
  currency: 'USD'
  notes: string[]
  regions: Record<string, TransferRegionPrices>
}

export const TRANSFER_PRICES = table as unknown as TransferPriceTable

export const TRANSFER_REGION = 'us-east-1'

/** Data da tabela no formato dd/mm/aaaa, para os selos da interface. */
export const TRANSFER_PRICE_DATE = TRANSFER_PRICES.retrievedAt.split('-').reverse().join('/')

export function transferPrices(region: string = TRANSFER_REGION): TransferRegionPrices {
  const r = TRANSFER_PRICES.regions[region]
  if (!r) throw new Error(`Região sem preços de transferência: ${region}`)
  return r
}
