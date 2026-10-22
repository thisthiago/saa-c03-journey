/**
 * Simulador de achados de segurança: descobre qual serviço gerou cada achado
 * pelo formato do tipo, como aparece no console de cada serviço.
 *
 * Conferido em 22/10/2026:
 * - GuardDuty: ThreatPurpose:ResourceTypeAffected/ThreatFamilyName.DetectionMechanism!Artifact,
 *   com os propósitos Backdoor, Behavior, CredentialAccess, Cryptocurrency,
 *   DefenseEvasion, Discovery, Execution, Exfiltration, Impact, InitialAccess,
 *   Pentest, Persistence, Policy, PrivilegeEscalation, Recon, Stealth, Trojan e
 *   UnauthorizedAccess
 *   (https://docs.aws.amazon.com/guardduty/latest/ug/guardduty_finding-format.html).
 * - Macie: achados de política (Policy:IAMUser/S3BlockPublicAccessDisabled,
 *   S3BucketEncryptionDisabled, S3BucketPublic, S3BucketReplicatedExternally,
 *   S3BucketSharedExternally, S3BucketSharedWithCloudFront) e de dados
 *   sensíveis (SensitiveData:S3Object/Credentials, CustomIdentifier,
 *   Financial, Multiple, Personal)
 *   (https://docs.aws.amazon.com/macie/latest/user/findings-types.html).
 * - Inspector: Package vulnerability (EC2, imagens do ECR e Lambda), Code
 *   vulnerability (Lambda) e Network reachability (só EC2)
 *   (https://docs.aws.amazon.com/inspector/latest/user/findings-types.html).
 * - Security Hub CSPM: controles com ID entre colchetes, como
 *   "[S3.8] S3 general purpose buckets should block public access", checados
 *   por regras do AWS Config ligadas pelo próprio serviço
 *   (https://docs.aws.amazon.com/securityhub/latest/userguide/s3-controls.html).
 * - AWS Config: regras com nome em minúsculas e hífens, como
 *   s3-bucket-versioning-enabled, avaliadas como COMPLIANT ou NON_COMPLIANT.
 */

export type FindingSource = 'guardduty' | 'inspector' | 'macie' | 'securityhub' | 'config'

export const SOURCE_LABEL: Record<FindingSource, string> = {
  guardduty: 'Amazon GuardDuty',
  inspector: 'Amazon Inspector',
  macie: 'Amazon Macie',
  securityhub: 'Security Hub CSPM (controle)',
  config: 'AWS Config (regra)',
}

export const GD_PURPOSES = ['Backdoor', 'Behavior', 'CredentialAccess', 'Cryptocurrency', 'DefenseEvasion', 'Discovery', 'Execution', 'Exfiltration', 'Impact', 'InitialAccess', 'Pentest', 'Persistence', 'Policy', 'PrivilegeEscalation', 'Recon', 'Stealth', 'Trojan', 'UnauthorizedAccess']

export const MACIE_POLICY_TYPES = ['S3BlockPublicAccessDisabled', 'S3BucketEncryptionDisabled', 'S3BucketPublic', 'S3BucketReplicatedExternally', 'S3BucketSharedExternally', 'S3BucketSharedWithCloudFront'].map((t) => `Policy:IAMUser/${t}`)

export const INSPECTOR_TYPES = ['Package vulnerability', 'Code vulnerability', 'Network reachability']

/** Serviço que gerou o achado, pelo formato do tipo. Lança erro se o formato não for reconhecido. */
export function sourceOf(type: string): { source: FindingSource; why: string } {
  if (type.startsWith('SensitiveData:S3Object/')) return { source: 'macie', why: 'SensitiveData:S3Object é um achado de dados sensíveis do Macie, que analisa o conteúdo dos objetos do S3.' }
  if (MACIE_POLICY_TYPES.includes(type)) return { source: 'macie', why: 'Policy:IAMUser/S3… é um achado de política do Macie: mudou a configuração de segurança de um bucket.' }
  const insp = INSPECTOR_TYPES.find((t) => type.startsWith(t))
  if (insp) return { source: 'inspector', why: `${insp} é um tipo de achado do Inspector, que procura vulnerabilidades de software e exposição de rede.` }
  if (/^\[[A-Za-z0-9]+\.\d+\]/.test(type)) return { source: 'securityhub', why: 'Um ID de controle entre colchetes, como [S3.8], é um controle dos padrões do Security Hub CSPM.' }
  if (/^[a-z0-9]+(-[a-z0-9]+)+: (NON_)?COMPLIANT$/.test(type)) return { source: 'config', why: 'Nome de regra em minúsculas com hífens e o resultado COMPLIANT ou NON_COMPLIANT é a avaliação de uma regra do AWS Config.' }
  const purpose = type.split(':')[0]
  // Os tipos reais nem sempre seguem a caixa da lista (ex.: CryptoCurrency:EC2/BitcoinTool.B!DNS).
  if (GD_PURPOSES.some((g) => g.toLowerCase() === purpose.toLowerCase()) && type.includes('/')) return { source: 'guardduty', why: `${purpose} é um propósito de ameaça do GuardDuty, no formato Propósito:Recurso/Família.` }
  throw new Error(`Formato de achado não reconhecido: ${type}`)
}
