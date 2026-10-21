/**
 * Tabela de preços da trilha Monitoramento e governança na AWS (gerada por
 * scripts/fetch-governance-prices.mjs a partir da AWS Price List).
 *
 * CloudWatch, CloudTrail e Config na primeira faixa paga. Sem nível gratuito,
 * impostos nem descontos por volume.
 */
import table from '../content/pricing/governance-prices.json'

export interface GovernanceRegionPrices {
  label: string
  offers: Record<string, string>
  cloudwatch: {
    customMetricMonth: number
    standardAlarmMonth: number
    highResAlarmMonth: number
    compositeAlarmMonth: number
    /** Ingestão de logs na classe Standard. */
    logIngestGB: number
    /** Ingestão de logs na classe Infrequent Access. */
    logIngestInfrequentGB: number
    logStorageGBMonth: number
    logInsightsScannedGB: number
  }
  cloudtrail: {
    /** Cópias adicionais de eventos de gerenciamento (a primeira cópia é gratuita). */
    extraManagementEventPer100k: number
    dataEventPer100k: number
    insightsEventPer100k: number
  }
  config: {
    /** Item gravado de forma contínua. */
    configurationItem: number
    /** Item gravado de forma periódica (diária). */
    configurationItemDaily: number
    ruleEvaluation: number
    conformancePackEvaluation: number
  }
  sourceUrls: string[]
}

export interface GovernancePriceTable {
  source: string
  sourceDocs: string
  retrievedAt: string
  currency: 'USD'
  notes: string[]
  regions: Record<string, GovernanceRegionPrices>
}

export const GOVERNANCE_PRICES = table as unknown as GovernancePriceTable

export const GOVERNANCE_REGION = 'us-east-1'

/** Data da tabela no formato dd/mm/aaaa, para os selos da interface. */
export const GOV_PRICE_DATE = GOVERNANCE_PRICES.retrievedAt.split('-').reverse().join('/')

export function governancePrices(region: string = GOVERNANCE_REGION): GovernanceRegionPrices {
  const r = GOVERNANCE_PRICES.regions[region]
  if (!r) throw new Error(`Região sem preços de monitoramento: ${region}`)
  return r
}
