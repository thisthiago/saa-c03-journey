/**
 * Simulador de certificados do AWS Certificate Manager (ACM): quais renovam
 * sozinhos, quais precisam de ação, quais vencem e onde cada um pode ser usado.
 *
 * Conferido em 22/10/2026:
 * - Renovação gerenciada: elegível se o certificado está associado a um
 *   serviço integrado (ELB, CloudFront…) ou foi exportado; não elegível se
 *   foi importado ou já venceu
 *   (https://docs.aws.amazon.com/acm/latest/userguide/managed-renewal.html).
 * - Validação por DNS: a 45 dias do vencimento, o ACM renova se o certificado
 *   está em uso e os registros CNAME continuam no DNS público. Validação por
 *   e-mail: o dono do domínio precisa agir; os avisos começam 45 dias antes
 *   (https://docs.aws.amazon.com/acm/latest/userguide/dns-renewal-validation.html,
 *   https://docs.aws.amazon.com/acm/latest/userguide/domain-ownership-validation.html).
 * - Certificados públicos do ACM valem 198 dias
 *   (https://docs.aws.amazon.com/acm/latest/userguide/acm-certificate-characteristics.html).
 * - Para o CloudFront, o certificado precisa estar em US East (N. Virginia);
 *   para associar um certificado gerenciado pelo ACM diretamente a uma
 *   instância EC2, é preciso um Nitro Enclave; para EC2 e servidores próprios
 *   há certificados públicos exportáveis
 *   (https://docs.aws.amazon.com/acm/latest/userguide/acm-services.html,
 *   https://docs.aws.amazon.com/acm/latest/userguide/acm-exportable-certificates.html).
 * - Importados: o ACM não renova; é preciso reimportar antes do vencimento
 *   (https://docs.aws.amazon.com/acm/latest/userguide/import-certificate.html).
 */

export type CertSource = 'acm' | 'imported'
export type Validation = 'dns' | 'email'
export type Attachment = 'alb' | 'cloudfront' | 'api-gateway' | 'ec2' | 'none'

export interface Certificate {
  id: string
  domain: string
  source: CertSource
  validation?: Validation
  /** Os registros CNAME de validação continuam no DNS público. */
  cnamePresent?: boolean
  region: string
  attachedTo: Attachment
  /** Certificado público exportável do ACM. */
  exportable?: boolean
}

export const RENEWAL_DAYS_BEFORE = 45
export const ACM_VALIDITY_DAYS = 198
export const CLOUDFRONT_CERT_REGION = 'us-east-1'

export const ATTACH_LABEL: Record<Attachment, string> = {
  alb: 'Application Load Balancer',
  cloudfront: 'distribuição do CloudFront',
  'api-gateway': 'domínio próprio do API Gateway',
  ec2: 'servidor web numa instância EC2',
  none: 'nenhum recurso',
}

export type Placement = 'ok' | 'wrong-region' | 'cannot-attach'

/** O certificado pode ser usado onde está? */
export function placement(c: Certificate): { result: Placement; why: string } {
  if (c.attachedTo === 'cloudfront' && c.region !== CLOUDFRONT_CERT_REGION)
    return { result: 'wrong-region', why: `O CloudFront só usa certificados do ACM em US East (N. Virginia); este está em ${c.region}.` }
  if (c.attachedTo === 'ec2' && !(c.source === 'acm' && c.exportable))
    return { result: 'cannot-attach', why: 'Um certificado gerenciado pelo ACM não é instalado direto numa instância EC2 (só com Nitro Enclaves); para o servidor na instância, é preciso um certificado exportável ou outro meio.' }
  return { result: 'ok', why: `Pode ser usado no ${ATTACH_LABEL[c.attachedTo]}.` }
}

export type Renewal = 'auto' | 'action' | 'expires'

export const RENEWAL_LABEL: Record<Renewal, string> = {
  auto: 'renova sozinho',
  action: 'só renova se alguém agir',
  expires: 'vence sem renovar',
}

/** O que acontece com o certificado perto do vencimento. */
export function renewal(c: Certificate): { result: Renewal; why: string } {
  if (c.source === 'imported') return { result: 'expires', why: 'O ACM não renova certificados importados: é preciso obter um novo certificado e reimportá-lo antes do vencimento.' }
  const inUse = c.attachedTo !== 'none' && placement(c).result === 'ok'
  if (!inUse && !c.exportable) return { result: 'expires', why: 'Sem associação a um serviço integrado e sem exportação, o certificado não é elegível para a renovação gerenciada.' }
  if (c.validation === 'email') return { result: 'action', why: `Validado por e-mail: o dono do domínio precisa aprovar pelo link do aviso, que começa a chegar ${RENEWAL_DAYS_BEFORE} dias antes do vencimento.` }
  if (!c.cnamePresent) return { result: 'action', why: 'Validado por DNS, mas o registro CNAME de validação foi apagado: o ACM não consegue revalidar o domínio até o registro voltar.' }
  return { result: 'auto', why: `Validado por DNS, em uso e com o CNAME no lugar: o ACM renova sozinho a ${RENEWAL_DAYS_BEFORE} dias do vencimento, com o mesmo ARN.` }
}
