/**
 * Tabela de preços da trilha Segurança e proteção de dados na AWS (gerada por
 * scripts/fetch-security-prices.mjs a partir da AWS Price List).
 *
 * KMS (chave gerenciada pelo cliente e requisições), Secrets Manager (segredo
 * e chamadas de API) e CloudHSM (HSM por hora), na primeira faixa paga. Sem
 * nível gratuito, impostos nem descontos por volume.
 */
import table from '../content/pricing/security-prices.json'

export interface SecurityRegionPrices {
  label: string
  offers: Record<string, string>
  /** Chave por mês (por versão do material, até a segunda rotação) e requisição simétrica. */
  kms: { keyMonth: number; request: number }
  secretsManager: { secretMonth: number; apiRequest: number }
  cloudHsm: { hsmHour: number }
  sourceUrls: string[]
}

export interface SecurityPriceTable {
  source: string
  sourceDocs: string
  retrievedAt: string
  currency: 'USD'
  notes: string[]
  regions: Record<string, SecurityRegionPrices>
}

export const SECURITY_PRICES = table as unknown as SecurityPriceTable

export const SECURITY_REGION = 'us-east-1'

/** Data da tabela no formato dd/mm/aaaa, para os selos da interface. */
export const SEC_PRICE_DATE = SECURITY_PRICES.retrievedAt.split('-').reverse().join('/')

export function securityPrices(region: string = SECURITY_REGION): SecurityRegionPrices {
  const r = SECURITY_PRICES.regions[region]
  if (!r) throw new Error(`Região sem preços de segurança: ${region}`)
  return r
}
