/** Tabela de preços versionada (gerada por scripts/fetch-s3-prices.mjs). */
import table from '../../content/pricing/s3-prices.json'
import type { PriceTable, RegionPrices } from './model'

export const PRICE_TABLE = table as unknown as PriceTable

export const DEFAULT_REGION = 'us-east-1'

export function regionPrices(region: string = DEFAULT_REGION): RegionPrices {
  const r = PRICE_TABLE.regions[region]
  if (!r) throw new Error(`Região sem preços: ${region}`)
  return r
}

export const PRICE_REGIONS = Object.keys(PRICE_TABLE.regions)

/** Preço do S3 Standard (GB-mês, primeira faixa) numa Região da tabela de comparação. */
export function standardPriceIn(region: string): number {
  const r = PRICE_TABLE.standardByRegion?.[region]
  if (!r) throw new Error(`Região sem preço de comparação: ${region}`)
  return r.standardGBMonth
}
