/**
 * Tabela de preços da trilha Análise de dados e serviços de IA na AWS (gerada
 * por scripts/fetch-analytics-prices.mjs a partir da AWS Price List).
 *
 * Athena (dado lido e capacidade provisionada) e Glue (jobs de ETL, crawlers e
 * Data Catalog), na primeira faixa paga. Sem nível gratuito, impostos nem
 * descontos por volume.
 */
import table from '../content/pricing/analytics-prices.json'

export interface AnalyticsRegionPrices {
  label: string
  offers: Record<string, string>
  athena: { perTBScanned: number; provisionedDpuHour: number }
  glue: {
    etlDpuHour: number
    etlFlexDpuHour: number
    /** Jobs no Glue 6.0 ou mais novo. */
    etlDpuHourGen2: number
    crawlerDpuHour: number
    /** Por objeto do Data Catalog e por mês, além do nível gratuito. */
    catalogObjectMonth: number
    catalogRequest: number
  }
  sourceUrls: string[]
}

export interface AnalyticsPriceTable {
  source: string
  sourceDocs: string
  retrievedAt: string
  currency: 'USD'
  notes: string[]
  regions: Record<string, AnalyticsRegionPrices>
}

export const ANALYTICS_PRICES = table as unknown as AnalyticsPriceTable

export const ANALYTICS_REGION = 'us-east-1'

/** Data da tabela no formato dd/mm/aaaa, para os selos da interface. */
export const ANA_PRICE_DATE = ANALYTICS_PRICES.retrievedAt.split('-').reverse().join('/')

export function analyticsPrices(region: string = ANALYTICS_REGION): AnalyticsRegionPrices {
  const r = ANALYTICS_PRICES.regions[region]
  if (!r) throw new Error(`Região sem preços de análise de dados: ${region}`)
  return r
}
