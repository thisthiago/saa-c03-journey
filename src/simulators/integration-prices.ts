/**
 * Tabela de preços da trilha Integração e mensageria na AWS (gerada por
 * scripts/fetch-integration-prices.mjs a partir da AWS Price List).
 *
 * SQS, SNS, EventBridge, Step Functions, API Gateway, Kinesis Data Streams e
 * Data Firehose, na primeira faixa paga. Sem nível gratuito, impostos nem
 * descontos por volume.
 */
import table from '../content/pricing/integration-prices.json'

export interface IntegrationRegionPrices {
  label: string
  offers: Record<string, string>
  sqs: { standardRequest: number; fifoRequest: number }
  sns: { publishRequest: number }
  eventbridge: { customEvent: number; pipesRequest: number; schedulerInvocation: number }
  stepFunctions: { standardTransition: number; expressRequest: number; expressGbSecond: number }
  apiGateway: { restRequest: number; httpRequest: number; websocketMessage: number }
  /** Modo provisionado: shard por hora e unidade de PUT (25 KB). */
  kinesis: { shardHour: number; putPayloadUnit: number }
  firehose: { gbIngested: number }
  sourceUrls: string[]
}

export interface IntegrationPriceTable {
  source: string
  sourceDocs: string
  retrievedAt: string
  currency: 'USD'
  notes: string[]
  regions: Record<string, IntegrationRegionPrices>
}

export const INTEGRATION_PRICES = table as unknown as IntegrationPriceTable

export const INTEGRATION_REGION = 'us-east-1'

/** Data da tabela no formato dd/mm/aaaa, para os selos da interface. */
export const INT_PRICE_DATE = INTEGRATION_PRICES.retrievedAt.split('-').reverse().join('/')

export function integrationPrices(region: string = INTEGRATION_REGION): IntegrationRegionPrices {
  const r = INTEGRATION_PRICES.regions[region]
  if (!r) throw new Error(`Região sem preços de integração: ${region}`)
  return r
}
