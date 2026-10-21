/**
 * AWS Config: recursos avaliados por regras gerenciadas, com resultado de
 * conformidade e o efeito da remediação automática.
 *
 * Fatos conferidos em 21/10/2026:
 * - Conceitos (gravador, itens de configuração, histórico, regras gerenciadas e personalizadas, resultados COMPLIANT, NON_COMPLIANT, ERROR e NOT_APPLICABLE, gatilhos, modos proativo e detectivo, pacotes de conformidade, agregadores): https://docs.aws.amazon.com/config/latest/developerguide/config-concepts.html
 * - Regras gerenciadas usadas aqui (identificador, tipos de recurso e gatilho de cada uma): https://docs.aws.amazon.com/config/latest/developerguide/managed-rules-by-aws-config.html e a página de cada regra, como https://docs.aws.amazon.com/config/latest/developerguide/restricted-ssh.html
 * - Remediação com documentos de automação do Systems Manager (manual ou automática): https://docs.aws.amazon.com/config/latest/developerguide/remediation.html
 * - Documento AWS-DisablePublicAccessForSecurityGroup (fecha SSH e RDP abertos para todos): https://docs.aws.amazon.com/systems-manager-automation-runbooks/latest/userguide/automation-aws-disablepublicaccessforsecuritygroup.html
 * - Preço de cada avaliação de regra: governance-prices.json (AWS Price List).
 *
 * Premissas do simulador (declaradas na interface): os atributos dos
 * recursos fictícios, quantas mudanças cada recurso sofre por mês, as
 * avaliações periódicas diárias e quais documentos de automação a equipe tem.
 */
import { governancePrices } from '../governance-prices'

export type ResourceType = 'bucket' | 'volume' | 'security-group' | 'instance' | 'database' | 'account'

export const TYPE_LABEL: Record<ResourceType, string> = {
  bucket: 'Bucket S3',
  volume: 'Volume EBS',
  'security-group': 'Security group',
  instance: 'Instância EC2',
  database: 'Banco RDS',
  account: 'Conta',
}

export interface CfgResource {
  id: string
  type: ResourceType
  name: string
  /** Atributos que as regras olham. */
  attrs: Record<string, boolean>
  tags?: Record<string, string>
}

export type EvalResult = 'COMPLIANT' | 'NON_COMPLIANT' | 'NOT_APPLICABLE'
export type Trigger = 'change' | 'periodic' | 'both'

export interface RuleDef {
  /** Nome da regra gerenciada. */
  id: string
  summary: string
  types: ResourceType[]
  trigger: Trigger
  evaluate: (r: CfgResource, params: RuleParams) => EvalResult
  /** Corrige o recurso: o que a remediação automática faz com os atributos. */
  fix: (r: CfgResource) => CfgResource
}

export interface RuleParams {
  /** Chaves de tag exigidas (regra required-tags). */
  tagKeys?: string[]
}

const yes = (ok: boolean): EvalResult => (ok ? 'COMPLIANT' : 'NON_COMPLIANT')
const set = (r: CfgResource, attrs: Record<string, boolean>): CfgResource => ({ ...r, attrs: { ...r.attrs, ...attrs } })

export const RULES: Record<string, RuleDef> = {
  's3-bucket-public-read-prohibited': {
    id: 's3-bucket-public-read-prohibited',
    summary: 'O bucket não pode permitir leitura pública (confere o bloqueio de acesso público, a política e as ACLs).',
    types: ['bucket'],
    trigger: 'both',
    evaluate: (r) => yes(!r.attrs.publicRead),
    fix: (r) => set(r, { publicRead: false }),
  },
  's3-bucket-server-side-encryption-enabled': {
    id: 's3-bucket-server-side-encryption-enabled',
    summary: 'O bucket precisa ter a criptografia padrão do S3 ligada.',
    types: ['bucket'],
    trigger: 'change',
    evaluate: (r) => yes(Boolean(r.attrs.encrypted)),
    fix: (r) => set(r, { encrypted: true }),
  },
  'encrypted-volumes': {
    id: 'encrypted-volumes',
    summary: 'Os volumes EBS ligados a instâncias precisam estar criptografados.',
    types: ['volume'],
    trigger: 'change',
    evaluate: (r) => yes(Boolean(r.attrs.encrypted)),
    fix: (r) => set(r, { encrypted: true }),
  },
  'restricted-ssh': {
    id: 'restricted-ssh',
    summary: 'O security group não pode aceitar SSH vindo de qualquer endereço (0.0.0.0/0 ou ::/0).',
    types: ['security-group'],
    trigger: 'both',
    evaluate: (r) => yes(!r.attrs.sshOpen),
    fix: (r) => set(r, { sshOpen: false }),
  },
  'rds-instance-public-access-check': {
    id: 'rds-instance-public-access-check',
    summary: 'O banco RDS não pode ser acessível publicamente.',
    types: ['database'],
    trigger: 'change',
    evaluate: (r) => yes(!r.attrs.publiclyAccessible),
    fix: (r) => set(r, { publiclyAccessible: false }),
  },
  'ec2-instance-managed-by-systems-manager': {
    id: 'ec2-instance-managed-by-systems-manager',
    summary: 'A instância precisa ser gerenciada pelo Systems Manager (agente SSM funcionando).',
    types: ['instance'],
    trigger: 'change',
    evaluate: (r) => yes(Boolean(r.attrs.managedBySsm)),
    fix: (r) => set(r, { managedBySsm: true }),
  },
  'required-tags': {
    id: 'required-tags',
    summary: 'Os recursos precisam ter as tags exigidas (por exemplo, CostCenter).',
    types: ['bucket', 'volume', 'security-group', 'instance', 'database'],
    trigger: 'change',
    evaluate: (r, p) => yes((p.tagKeys ?? []).every((k) => Boolean(r.tags?.[k]))),
    fix: (r) => r,
  },
  'root-account-mfa-enabled': {
    id: 'root-account-mfa-enabled',
    summary: 'O usuário root da conta precisa exigir autenticação multifator no console.',
    types: ['account'],
    trigger: 'periodic',
    evaluate: (r) => yes(Boolean(r.attrs.rootMfa)),
    fix: (r) => set(r, { rootMfa: true }),
  },
}

export const RULE_IDS = Object.keys(RULES)

export function evaluateRule(rule: RuleDef, r: CfgResource, params: RuleParams = {}): EvalResult {
  return rule.types.includes(r.type) ? rule.evaluate(r, params) : 'NOT_APPLICABLE'
}

export interface RuleChoice {
  on: boolean
  mode: 'none' | 'manual' | 'auto'
}

export interface RuleRow {
  rule: RuleDef
  results: { resource: CfgResource; result: EvalResult; after: EvalResult }[]
}

/** Avalia as regras ligadas sobre os recursos e aplica a remediação automática (só nas regras com documento de automação). */
export function runRules(resources: CfgResource[], choices: Record<string, RuleChoice | undefined>, params: Record<string, RuleParams | undefined>, automation: string[]): RuleRow[] {
  return RULE_IDS.filter((id) => choices[id]?.on).map((id) => {
    const rule = RULES[id]
    const auto = choices[id]?.mode === 'auto' && automation.includes(id)
    return {
      rule,
      results: resources
        .filter((r) => rule.types.includes(r.type))
        .map((resource) => {
          const result = evaluateRule(rule, resource, params[id])
          const after = result === 'NON_COMPLIANT' && auto ? evaluateRule(rule, rule.fix(resource), params[id]) : result
          return { resource, result, after }
        }),
    }
  })
}

/** Avaliações por mês: nas mudanças (premissa: `changesPerMonth` por recurso) e nas periódicas (diárias, 30 por mês). */
export function evaluationsPerMonth(rule: RuleDef, resourcesInScope: number, changesPerMonth: number): number {
  const change = rule.trigger === 'periodic' ? 0 : resourcesInScope * changesPerMonth
  const periodic = rule.trigger === 'change' ? 0 : resourcesInScope * 30
  return change + periodic
}

export function evaluationsCost(count: number, region?: string): number {
  return count * governancePrices(region).config.ruleEvaluation
}
