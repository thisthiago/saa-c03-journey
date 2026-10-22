/**
 * Custo da transferência de dados por caminho: quanto custa cada GB e quanto
 * sai um fluxo mensal por cada caminho possível.
 *
 * Conferido em 22/10/2026:
 * - Entrada da internet sem cobrança; tráfego entre AZs cobrado na entrada e
 *   na saída de cada recurso; entre Regiões, cobrada só a saída da Região de
 *   origem (https://docs.aws.amazon.com/cur/latest/userguide/cur-data-transfers-charges.html).
 * - Dentro da mesma AZ, sem cobrança; o NAT Gateway cobra o processamento por
 *   GB; os endpoints de gateway levam ao S3 e ao DynamoDB sem cobrança de
 *   transferência
 *   (https://aws.amazon.com/blogs/architecture/overview-of-data-transfer-costs-for-common-architectures/).
 * - Da Região para o CloudFront, US$ 0 por GB (usagetype
 *   USE1-CloudFront-Out-Bytes da AWS Price List).
 * - Preços: tabelas de transferência (npm run prices:transfer) e de Redes
 *   (npm run prices:network), primeira faixa paga em us-east-1.
 *
 * Simplificações: o NAT Gateway e o endpoint de interface já existem para
 * outros tráfegos, então só o custo por GB entra na conta, menos no endpoint
 * de interface novo (cobrado por hora em duas AZs); sem nível gratuito.
 */
import { HOURS_PER_MONTH, networkPrices } from '../network-prices'
import { transferPrices } from '../transfer-prices'

export type TransferPath =
  | 'same-az'
  | 'cross-az'
  | 'cross-region'
  | 'internet-out'
  | 'internet-in'
  | 'nat-to-s3'
  | 'gateway-endpoint'
  | 'interface-endpoint'
  | 'nat-to-service'
  | 'cloudfront'

export const PATH_LABEL: Record<TransferPath, string> = {
  'same-az': 'Dentro da mesma AZ, por IP privado',
  'cross-az': 'Entre AZs da mesma Região',
  'cross-region': 'Para outra Região',
  'internet-out': 'Direto da Região para a internet',
  'internet-in': 'Da internet para a AWS',
  'nat-to-s3': 'Pelo NAT Gateway até o S3',
  'gateway-endpoint': 'Pelo endpoint de gateway do S3',
  'interface-endpoint': 'Por um endpoint de interface novo',
  'nat-to-service': 'Pelo NAT Gateway até a API do serviço',
  cloudfront: 'Pelo CloudFront (a origem entrega ao CloudFront)',
}

/** Custo de cada GB no caminho, em dólares. */
export function perGB(path: TransferPath, destRegion = 'us-west-2'): number {
  const t = transferPrices()
  const n = networkPrices()
  switch (path) {
    case 'same-az':
    case 'gateway-endpoint':
      return 0
    case 'internet-in':
      return t.internetInPerGB
    case 'cross-az':
      return 2 * t.interAzPerGB
    case 'cross-region': {
      const v = t.interRegionOutPerGB[destRegion]
      if (v === undefined) throw new Error(`Região de destino fora da tabela: ${destRegion}`)
      return v
    }
    case 'internet-out':
      return t.internetOutPerGB
    case 'nat-to-s3':
    case 'nat-to-service':
      return n.nat.perGB
    case 'interface-endpoint':
      return n.interfaceEndpoint.perGB
    case 'cloudfront':
      return t.cloudFrontOriginFetchPerGB + t.cloudFrontOutPerGB
  }
}

/** Custo fixo mensal do caminho (só o endpoint de interface novo, em duas AZs). */
export function fixedMonthly(path: TransferPath): number {
  return path === 'interface-endpoint' ? networkPrices().interfaceEndpoint.hourPerAz * 2 * HOURS_PER_MONTH : 0
}

export function monthlyCost(path: TransferPath, gb: number, destRegion?: string): number {
  return Math.round((perGB(path, destRegion) * gb + fixedMonthly(path)) * 100) / 100
}

/** Caminho mais barato entre os permitidos. Lança erro em empate. */
export function cheapestPath(paths: TransferPath[], gb: number, destRegion?: string): TransferPath {
  const sorted = [...paths].sort((a, b) => monthlyCost(a, gb, destRegion) - monthlyCost(b, gb, destRegion))
  if (sorted.length > 1 && monthlyCost(sorted[0], gb, destRegion) === monthlyCost(sorted[1], gb, destRegion)) throw new Error(`Empate entre ${sorted[0]} e ${sorted[1]}`)
  return sorted[0]
}
