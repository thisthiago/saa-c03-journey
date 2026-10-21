/**
 * Acesso privado a serviços da AWS a partir de uma sub-rede privada: pelo NAT
 * Gateway, por um endpoint de gateway ou por um endpoint de interface
 * (PrivateLink), com o custo mensal de cada caminho.
 *
 * Conferido em 21/10/2026:
 * - Endpoints de gateway: só S3 e DynamoDB, sem custo, rota com lista de
 *   prefixos, só na própria Região; não atendem a rede da empresa (VPN ou Direct
 *   Connect), VPCs em peering nem o Transit Gateway:
 *   https://docs.aws.amazon.com/vpc/latest/privatelink/gateway-endpoints.html e
 *   https://docs.aws.amazon.com/vpc/latest/privatelink/vpc-endpoints-s3.html
 * - Endpoints de interface: cobrança por hora em cada AZ e por GB processado;
 *   interfaces de rede nas sub-redes, DNS privado:
 *   https://docs.aws.amazon.com/vpc/latest/privatelink/privatelink-access-aws-services.html
 * - Não dá para rotear ao NAT Gateway o tráfego que chega por VPN ou Direct Connect
 *   num virtual private gateway: https://docs.aws.amazon.com/vpc/latest/userguide/nat-gateway-basics.html
 * - Preços da AWS Price List (ver src/content/pricing/network-prices.json).
 *
 * Simplificações: a transferência de dados e o tráfego entre zonas ficam fora
 * da conta; quando o NAT Gateway já existe para outros usos, só o GB processado
 * entra no custo.
 */
import { usd } from '../compute-prices'
import { HOURS_PER_MONTH, networkPrices } from '../network-prices'

export type AwsService = 's3' | 'dynamodb' | 'sqs' | 'secrets-manager' | 'ecr' | 'kms'

export const SERVICE_LABEL: Record<AwsService, string> = {
  s3: 'Amazon S3',
  dynamodb: 'Amazon DynamoDB',
  sqs: 'Amazon SQS',
  'secrets-manager': 'AWS Secrets Manager',
  ecr: 'Amazon ECR',
  kms: 'AWS KMS',
}

export type PathKind = 'nat' | 'gateway' | 'interface'

export const PATH_LABEL: Record<PathKind, string> = {
  nat: 'NAT Gateway (pelo internet gateway)',
  gateway: 'Endpoint de gateway',
  interface: 'Endpoint de interface (PrivateLink)',
}

export interface EpWorkload {
  id: string
  name: string
  description: string
  service: AwsService
  gbMonth: number
  /** AZs em que o endpoint de interface precisaria existir. */
  azs: number
  /** Parte do tráfego vem da rede da empresa, por VPN ou Direct Connect. */
  fromOnPrem?: boolean
  /** A regra da empresa proíbe que o tráfego passe pelo internet gateway. */
  privateOnly?: boolean
  /** Já existe um NAT Gateway para outros usos (a hora não entra na conta). */
  natShared?: boolean
  concepts?: string[]
}

/** Motivos pelos quais o caminho não serve à carga (vazio quando serve). */
export function pathProblems(w: EpWorkload, path: PathKind): string[] {
  const out: string[] = []
  if (path === 'gateway') {
    if (w.service !== 's3' && w.service !== 'dynamodb') out.push(`${SERVICE_LABEL[w.service]} não tem endpoint de gateway; só o S3 e o DynamoDB têm`)
    if (w.fromOnPrem) out.push('o endpoint de gateway não atende o tráfego que vem da rede da empresa por VPN ou Direct Connect')
  }
  if (path === 'nat') {
    if (w.fromOnPrem) out.push('o tráfego que chega da empresa por um virtual private gateway não pode ser roteado ao NAT Gateway')
    if (w.privateOnly) out.push('o tráfego sai pelo internet gateway, e a regra da empresa pede um caminho privado')
  }
  return out
}

export interface PathCost {
  total: number
  parts: string[]
}

export function pathMonthly(w: EpWorkload, path: PathKind, region?: string): PathCost {
  const p = networkPrices(region)
  if (path === 'gateway') return { total: 0, parts: ['sem custo por hora nem por GB'] }
  if (path === 'nat') {
    const hours = w.natShared ? 0 : p.nat.hour * HOURS_PER_MONTH
    const data = w.gbMonth * p.nat.perGB
    return { total: hours + data, parts: [w.natShared ? 'hora do NAT já paga por outros usos' : `hora do NAT ${usd(hours)}`, `dados processados ${usd(data)}`] }
  }
  const hours = p.interfaceEndpoint.hourPerAz * w.azs * HOURS_PER_MONTH
  const data = w.gbMonth * p.interfaceEndpoint.perGB
  return { total: hours + data, parts: [`${w.azs} AZ(s) ${usd(hours)}`, `dados processados ${usd(data)}`] }
}

/** O caminho válido mais barato. Lança erro se nenhum servir ou se houver empate. */
export function cheapestPath(w: EpWorkload, region?: string): PathKind {
  const ok = (['gateway', 'interface', 'nat'] as PathKind[]).filter((k) => pathProblems(w, k).length === 0).map((k) => ({ k, cost: pathMonthly(w, k, region).total }))
  ok.sort((a, b) => a.cost - b.cost)
  if (ok.length === 0) throw new Error(`Carga ${w.id}: nenhum caminho serve`)
  if (ok[1] && Math.abs(ok[1].cost - ok[0].cost) < 0.005) throw new Error(`Carga ${w.id}: empate`)
  return ok[0].k
}
