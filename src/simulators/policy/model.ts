/**
 * Motor de políticas do IAM: avalia uma requisição contra todas as camadas de
 * política (SCP, RCP, política de recurso, identidade, permissions boundary e
 * session policy), seguindo o fluxo documentado pela AWS.
 *
 * Conferido em 19/10/2026:
 * - Fluxo de avaliação: https://docs.aws.amazon.com/IAM/latest/UserGuide/reference_policies_evaluation-logic_policy-eval-denyallow.html
 * - Entre contas: https://docs.aws.amazon.com/IAM/latest/UserGuide/reference_policies_evaluation-logic-cross-account.html
 * - Principal: https://docs.aws.amazon.com/IAM/latest/UserGuide/reference_policies_elements_principal.html
 * - Operadores de condição: https://docs.aws.amazon.com/IAM/latest/UserGuide/reference_policies_elements_condition_operators.html
 * - Várias chaves e valores: https://docs.aws.amazon.com/IAM/latest/UserGuide/reference_policies_condition-logic-multiple-context-keys-or-values.html
 * - Chaves globais: https://docs.aws.amazon.com/IAM/latest/UserGuide/reference_policies_condition-keys.html
 * - SCPs: https://docs.aws.amazon.com/organizations/latest/userguide/orgs_manage_policies_scps_evaluation.html
 * - RCPs: https://docs.aws.amazon.com/organizations/latest/userguide/orgs_manage_policies_rcps.html
 *
 * Regras modeladas:
 * - Tudo começa negado, exceto para o usuário raiz (root), que tem acesso total na própria conta.
 * - Um Deny explícito em qualquer política aplicável vence.
 * - SCPs (principais de contas-membro) e RCPs (recursos de contas-membro) precisam de Allow em todos os
 *   níveis, da raiz da organização até a conta. Não afetam a conta de gerenciamento nem service-linked roles.
 * - Na mesma conta, basta a identidade ou o recurso permitir. Uma concessão da política de recurso ao ARN do
 *   usuário ou da sessão não é limitada por deny implícito de identidade, boundary ou session policy; ao ARN
 *   da role, é limitada por boundary e session policy; à conta, é delegação e exige Allow de identidade.
 * - Trust policies e key policies do KMS precisam permitir o principal explicitamente.
 * - Entre contas, a conta do principal (identidade, boundary, sessão, SCP) e a conta do recurso
 *   (política de recurso, RCP) precisam permitir.
 * - Condições: chave ausente torna a condição falsa (verdadeira em operadores negados); `…IfExists` trata a
 *   ausência como verdadeira; vários operadores e chaves combinam com E; vários valores, com OU (NOR nos negados).
 *
 * Simplificações: não modela NotPrincipal, políticas de VPC endpoint, ACLs, grants do KMS, conjuntos de
 * valores (ForAllValues/ForAnyValue), a maioria dos operadores de data e o casamento de ARN por segmento.
 */
import { ipInCidr, oneOrMany, wildcardMatch } from './core'

// ---------------------------------------------------------------------------
// Políticas

export type Effect = 'Allow' | 'Deny'

export type ConditionOperator =
  | 'StringEquals'
  | 'StringNotEquals'
  | 'StringLike'
  | 'StringNotLike'
  | 'Bool'
  | 'IpAddress'
  | 'NotIpAddress'
  | 'ArnLike'
  | 'ArnNotLike'
  | 'NumericLessThan'
  | 'NumericLessThanEquals'
  | 'NumericGreaterThan'
  | 'Null'

export interface ConditionClause {
  op: ConditionOperator
  /** Variante `…IfExists`: se a chave não existe na requisição, a condição é verdadeira. */
  ifExists?: boolean
  key: string
  values: string[]
}

/** Principal de uma política de recurso ou trust policy. */
export type PrincipalRef = '*' | { aws: string } | { service: string } | { federated: string }

export interface PolicyStatement {
  sid: string
  effect: Effect
  /** Só em políticas de recurso (bucket policy, key policy, trust policy). */
  principals?: PrincipalRef[]
  actions?: string[]
  notActions?: string[]
  /** Ausente em trust policies (o recurso é a própria role). */
  resources?: string[]
  notResources?: string[]
  conditions?: ConditionClause[]
  /** Texto curto que explica o statement na interface. */
  note?: string
}

export interface Policy {
  id: string
  name: string
  statements: PolicyStatement[]
}

// ---------------------------------------------------------------------------
// Contas, principais e recursos

export interface OrgLevel {
  id: string
  /** Ex.: "Raiz", "OU Produção", "Conta Pagamentos". */
  name: string
  policies: Policy[]
}

export interface AccountDef {
  id: string
  name: string
  /** Organização a que pertence (ausente: conta avulsa). */
  orgId?: string
  management?: boolean
  /** SCPs por nível, da raiz até a conta. */
  scps?: OrgLevel[]
  /** RCPs por nível, da raiz até a conta. */
  rcps?: OrgLevel[]
}

export type PrincipalKind = 'root' | 'user' | 'role-session' | 'federated-user' | 'web-identity' | 'service' | 'anonymous'

export interface Principal {
  id: string
  /** Nome exibido (ex.: "Ana", "role Deploy (sessão ci-42)"). */
  name: string
  description?: string
  kind: PrincipalKind
  account?: string
  /** Nome do usuário IAM, da role ou do usuário federado. */
  userName?: string
  roleName?: string
  sessionName?: string
  /** Serviço (ex.: "ec2.amazonaws.com") ou provedor externo (ex.: "cognito-identity.amazonaws.com"). */
  service?: string
  provider?: string
  /** Usuário IAM que chamou GetFederationToken (sessão de usuário federado). */
  sourceUser?: string
  serviceLinked?: boolean
  tags?: Record<string, string>
  /** Como as credenciais foram obtidas: define a presença de aws:MultiFactorAuthPresent. */
  auth?: { via: 'console' | 'access-key' | 'session'; mfa: boolean }
  identityPolicies?: Policy[]
  groups?: { name: string; policies: Policy[] }[]
  boundary?: Policy
  sessionPolicy?: Policy
}

export type ResourceKind = 'generic' | 'trust' | 'kms-key'

export interface ResourceDef {
  id: string
  arn: string
  account: string
  /** Rótulo curto (ex.: "bucket relatorios"). */
  label?: string
  kind?: ResourceKind
  policy?: Policy
  tags?: Record<string, string>
}

export interface PolicyScenario {
  accounts?: AccountDef[]
  principals: Principal[]
  resources: ResourceDef[]
}

export type ContextValue = string | string[]

export interface RequestSpec {
  principalId: string
  action: string
  resourceId: string
  /** Chaves extras ou que substituem as derivadas (ex.: "sts:ExternalId", "iam:PassedToService"). */
  context?: Record<string, ContextValue | null>
  secureTransport?: boolean
  sourceIp?: string
  region?: string
}

// ---------------------------------------------------------------------------
// Resultado

export type Decision = 'allow' | 'explicit-deny' | 'implicit-deny'
export type Layer = 'scp' | 'rcp' | 'resource' | 'identity' | 'boundary' | 'session' | 'root'

export type ReasonCode =
  | 'allowed'
  | 'explicit-deny'
  | 'rcp-no-allow'
  | 'scp-no-allow'
  | 'no-identity-allow'
  | 'resource-required'
  | 'cross-account-resource'
  | 'boundary-no-allow'
  | 'session-no-allow'
  | 'no-grant'

export interface EvalResult {
  decision: Decision
  allowed: boolean
  reason: ReasonCode
  /** Camada que decidiu (o Deny explícito, o Allow que faltou ou a concessão que permitiu). */
  layer?: Layer
  policyName?: string
  sid?: string
  trace: string[]
}

export const LAYER_LABEL: Record<Layer, string> = {
  scp: 'SCP',
  rcp: 'RCP',
  resource: 'política de recurso',
  identity: 'política de identidade',
  boundary: 'permissions boundary',
  session: 'session policy',
  root: 'usuário raiz',
}

export const DECISION_LABEL: Record<Decision, string> = {
  allow: 'permitido',
  'explicit-deny': 'negado por um Deny explícito',
  'implicit-deny': 'negado implicitamente (falta um Allow)',
}

// ---------------------------------------------------------------------------
// ARNs e rótulos

export function principalArn(p: Principal): string | undefined {
  switch (p.kind) {
    case 'root':
      return `arn:aws:iam::${p.account}:root`
    case 'user':
      return `arn:aws:iam::${p.account}:user/${p.userName}`
    case 'role-session':
      return `arn:aws:iam::${p.account}:role/${p.roleName}`
    case 'federated-user':
      return `arn:aws:sts::${p.account}:federated-user/${p.userName}`
    default:
      return undefined
  }
}

export function sessionArn(p: Principal): string | undefined {
  if (p.kind === 'role-session') return `arn:aws:sts::${p.account}:assumed-role/${p.roleName}/${p.sessionName ?? 'sessao'}`
  if (p.kind === 'federated-user') return principalArn(p)
  return undefined
}

const KIND_LABEL: Record<PrincipalKind, string> = {
  root: 'usuário raiz',
  user: 'usuário IAM',
  'role-session': 'sessão de role',
  'federated-user': 'usuário federado (GetFederationToken)',
  'web-identity': 'identidade externa',
  service: 'serviço da AWS',
  anonymous: 'requisição anônima',
}

export function principalLabel(p: Principal): string {
  if (p.kind === 'anonymous') return 'Requisição anônima (sem credenciais)'
  if (p.kind === 'service') return `Serviço ${p.service}`
  return `${p.name} (${KIND_LABEL[p.kind]}${p.account ? ` da conta ${p.account}` : ''})`
}

const isIamPrincipal = (p: Principal) => p.kind === 'root' || p.kind === 'user' || p.kind === 'role-session' || p.kind === 'federated-user'

// ---------------------------------------------------------------------------
// Contexto da requisição

export type RequestContext = Record<string, ContextValue>

/** Monta o contexto: chaves derivadas do principal, da requisição e do recurso, mais as extras. */
export function buildContext(scenario: PolicyScenario, p: Principal, r: ResourceDef, req: RequestSpec): RequestContext {
  const ctx: RequestContext = {}
  const account = scenario.accounts?.find((a) => a.id === p.account)
  const arn = principalArn(p)
  if (arn) ctx['aws:PrincipalArn'] = arn
  if (p.account && p.kind !== 'anonymous') ctx['aws:PrincipalAccount'] = p.account
  if (account?.orgId && isIamPrincipal(p)) ctx['aws:PrincipalOrgID'] = account.orgId
  if (p.kind === 'user') ctx['aws:username'] = p.userName ?? p.name
  if (p.kind !== 'anonymous') ctx['aws:PrincipalIsAWSService'] = p.kind === 'service' ? 'true' : 'false'
  for (const [k, v] of Object.entries(p.tags ?? {})) ctx[`aws:PrincipalTag/${k}`] = v
  if (p.auth && p.auth.via !== 'access-key') ctx['aws:MultiFactorAuthPresent'] = p.auth.mfa ? 'true' : 'false'
  if (p.kind === 'role-session' || p.kind === 'federated-user') ctx['aws:MultiFactorAuthPresent'] ??= p.auth?.mfa ? 'true' : 'false'
  ctx['aws:SecureTransport'] = req.secureTransport === false ? 'false' : 'true'
  ctx['aws:SourceIp'] = req.sourceIp ?? '203.0.113.10'
  ctx['aws:RequestedRegion'] = req.region ?? 'us-east-1'
  ctx['aws:ResourceAccount'] = r.account
  for (const [k, v] of Object.entries(r.tags ?? {})) ctx[`aws:ResourceTag/${k}`] = v
  for (const [k, v] of Object.entries(req.context ?? {})) {
    if (v === null) delete ctx[k]
    else ctx[k] = v
  }
  return ctx
}

/** Substitui variáveis de política (ex.: ${aws:username}). Devolve undefined se alguma não existe. */
export function substituteVariables(value: string, ctx: RequestContext): string | undefined {
  let missing = false
  const out = value.replace(/\$\{([^}]+)\}/g, (_, key: string) => {
    const v = ctx[key]
    if (v === undefined || Array.isArray(v)) {
      missing = true
      return ''
    }
    return v
  })
  return missing ? undefined : out
}

function lookup(ctx: RequestContext, key: string): string[] | undefined {
  const exact = ctx[key]
  if (exact !== undefined) return Array.isArray(exact) ? exact : [exact]
  // Chaves de tag não diferenciam maiúsculas de minúsculas no nome da tag.
  const lower = key.toLowerCase()
  if (lower.startsWith('aws:resourcetag/') || lower.startsWith('aws:principaltag/') || lower.startsWith('aws:requesttag/')) {
    const found = Object.keys(ctx).find((k) => k.toLowerCase() === lower)
    if (found) {
      const v = ctx[found]
      return Array.isArray(v) ? v : [v]
    }
  }
  return undefined
}

const NEGATED: ConditionOperator[] = ['StringNotEquals', 'StringNotLike', 'NotIpAddress', 'ArnNotLike']

function compare(op: ConditionOperator, actual: string, expected: string): boolean {
  switch (op) {
    case 'StringEquals':
    case 'StringNotEquals':
      return actual === expected
    case 'StringLike':
    case 'StringNotLike':
    case 'ArnLike':
    case 'ArnNotLike':
      return wildcardMatch(expected, actual)
    case 'Bool':
      return actual.toLowerCase() === expected.toLowerCase()
    case 'IpAddress':
    case 'NotIpAddress':
      return ipInCidr(actual, expected)
    case 'NumericLessThan':
      return Number(actual) < Number(expected)
    case 'NumericLessThanEquals':
      return Number(actual) <= Number(expected)
    case 'NumericGreaterThan':
      return Number(actual) > Number(expected)
    case 'Null':
      return false
  }
}

/** Avalia uma cláusula de condição contra o contexto. */
export function clauseHolds(c: ConditionClause, ctx: RequestContext): boolean {
  const actual = lookup(ctx, c.key)
  if (c.op === 'Null') {
    const wantsAbsent = c.values.some((v) => v.toLowerCase() === 'true')
    return wantsAbsent ? actual === undefined : actual !== undefined
  }
  const negated = NEGATED.includes(c.op)
  if (actual === undefined) return c.ifExists ? true : negated
  const expected = c.values.map((v) => substituteVariables(v, ctx)).filter((v): v is string => v !== undefined)
  const anyMatch = actual.some((a) => expected.some((e) => compare(c.op, a, e)))
  return negated ? !anyMatch : anyMatch
}

// ---------------------------------------------------------------------------
// Statements

export type GrantType = 'direct' | 'role' | 'account'

/** Como o Principal do statement corresponde ao principal da requisição (ou null). */
export function principalMatch(ref: PrincipalRef, p: Principal): GrantType | null {
  if (ref === '*') return 'direct'
  if ('service' in ref) return p.kind === 'service' && p.service === ref.service ? 'direct' : null
  if ('federated' in ref) return p.kind === 'web-identity' && p.provider === ref.federated ? 'direct' : null
  const v = ref.aws
  if (v === '*') return 'direct'
  if (!isIamPrincipal(p)) return null
  if (/^\d{12}$/.test(v) || /^arn:aws:iam::\d{12}:root$/.test(v)) {
    const acct = v.length === 12 ? v : v.split(':')[4]
    return p.account === acct ? 'account' : null
  }
  if (p.kind === 'user' && v === principalArn(p)) return 'direct'
  if (p.kind === 'role-session') {
    if (v === principalArn(p)) return 'role'
    if (v === sessionArn(p)) return 'direct'
  }
  if (p.kind === 'federated-user') {
    if (v === principalArn(p)) return 'direct'
    if (p.sourceUser && v === `arn:aws:iam::${p.account}:user/${p.sourceUser}`) return 'role'
  }
  return null
}

const GRANT_RANK: Record<GrantType, number> = { direct: 3, role: 2, account: 1 }

function actionMatches(st: PolicyStatement, action: string): boolean {
  if (st.notActions) return !st.notActions.some((a) => wildcardMatch(a, action, true))
  return (st.actions ?? []).some((a) => wildcardMatch(a, action, true))
}

function resourceMatches(st: PolicyStatement, arn: string, ctx: RequestContext): boolean {
  const fits = (pattern: string) => {
    const resolved = substituteVariables(pattern, ctx)
    return resolved !== undefined && wildcardMatch(resolved, arn)
  }
  if (st.notResources) return !st.notResources.some(fits)
  if (!st.resources) return true
  return st.resources.some(fits)
}

/** O statement cobre a requisição (ação, recurso e condições)? O principal é verificado à parte. */
export function statementMatches(st: PolicyStatement, action: string, resourceArn: string, ctx: RequestContext): boolean {
  return actionMatches(st, action) && resourceMatches(st, resourceArn, ctx) && (st.conditions ?? []).every((c) => clauseHolds(c, ctx))
}

// ---------------------------------------------------------------------------
// Camadas aplicáveis

/** Prefixos de serviços que aceitam RCP (subconjunto da lista oficial conferida em 19/10/2026). */
export const RCP_SERVICES = ['s3', 'sts', 'kms', 'sqs', 'secretsmanager', 'dynamodb', 'ecr', 'logs', 'cognito-idp', 'cognito-identity']

interface LayerPolicy {
  layer: Layer
  policy: Policy
  /** Nível da organização (SCP/RCP). */
  level?: OrgLevel
}

function serviceOf(action: string) {
  return action.split(':')[0].toLowerCase()
}

export function scpApplies(scenario: PolicyScenario, p: Principal): AccountDef | undefined {
  if (!isIamPrincipal(p) || p.serviceLinked) return undefined
  const acct = scenario.accounts?.find((a) => a.id === p.account)
  if (!acct?.orgId || acct.management || !acct.scps?.length) return undefined
  return acct
}

export function rcpApplies(scenario: PolicyScenario, p: Principal, r: ResourceDef, action: string): AccountDef | undefined {
  if (p.serviceLinked || !RCP_SERVICES.includes(serviceOf(action))) return undefined
  const acct = scenario.accounts?.find((a) => a.id === r.account)
  if (!acct?.orgId || acct.management || !acct.rcps?.length) return undefined
  return acct
}

function identityLayers(p: Principal): LayerPolicy[] {
  if (!isIamPrincipal(p) || p.kind === 'root') return []
  return [
    ...(p.identityPolicies ?? []).map((policy) => ({ layer: 'identity' as const, policy })),
    ...(p.groups ?? []).flatMap((g) => g.policies.map((policy) => ({ layer: 'identity' as const, policy: { ...policy, name: `${policy.name} (grupo ${g.name})` } }))),
  ]
}

// ---------------------------------------------------------------------------
// Avaliação

function firstMatch(policies: Policy[], effect: Effect, action: string, arn: string, ctx: RequestContext): { policy: Policy; st: PolicyStatement } | undefined {
  for (const policy of policies) for (const st of policy.statements) if (st.effect === effect && statementMatches(st, action, arn, ctx)) return { policy, st }
  return undefined
}

function resourceGrant(r: ResourceDef, p: Principal, action: string, ctx: RequestContext): { st: PolicyStatement; type: GrantType } | undefined {
  let best: { st: PolicyStatement; type: GrantType } | undefined
  for (const st of r.policy?.statements ?? []) {
    if (st.effect !== 'Allow' || !statementMatches(st, action, r.arn, ctx)) continue
    for (const ref of st.principals ?? []) {
      const type = principalMatch(ref, p)
      if (type && (!best || GRANT_RANK[type] > GRANT_RANK[best.type])) best = { st, type }
    }
  }
  return best
}

const GRANT_TEXT: Record<GrantType, string> = {
  direct: 'concede diretamente a este principal',
  role: 'concede ao ARN da role (a concessão continua limitada por boundary e session policy)',
  account: 'concede à conta inteira, o que é uma delegação: alguém na conta ainda precisa permitir por política de identidade',
}

export function findPrincipal(scenario: PolicyScenario, id: string): Principal {
  const p = scenario.principals.find((x) => x.id === id)
  if (!p) throw new Error(`Principal inexistente: ${id}`)
  return p
}

export function findResource(scenario: PolicyScenario, id: string): ResourceDef {
  const r = scenario.resources.find((x) => x.id === id)
  if (!r) throw new Error(`Recurso inexistente: ${id}`)
  return r
}

/** Avalia uma requisição no cenário e explica cada passo. */
export function evaluate(scenario: PolicyScenario, req: RequestSpec): EvalResult {
  const p = findPrincipal(scenario, req.principalId)
  const r = findResource(scenario, req.resourceId)
  const ctx = buildContext(scenario, p, r, req)
  const action = req.action
  const trace: string[] = []
  const done = (decision: Decision, reason: ReasonCode, extra: Partial<EvalResult> = {}): EvalResult => ({ decision, allowed: decision === 'allow', reason, trace, ...extra })
  const same = isIamPrincipal(p) && p.account === r.account
  const resourceLabel = r.label ? `${r.label} (${r.arn})` : r.arn

  trace.push(`${principalLabel(p)} pede ${action} em ${resourceLabel}.`)
  if (isIamPrincipal(p)) {
    trace.push(same ? 'O principal e o recurso estão na mesma conta.' : `O recurso está em outra conta (${r.account}): a AWS faz duas avaliações, uma em cada conta, e as duas precisam permitir.`)
  }

  // 1. Deny explícito em qualquer política aplicável
  const scpAcct = scpApplies(scenario, p)
  const rcpAcct = rcpApplies(scenario, p, r, action)
  const layers: LayerPolicy[] = [
    ...(scpAcct?.scps ?? []).flatMap((level) => level.policies.map((policy) => ({ layer: 'scp' as const, policy, level }))),
    ...(rcpAcct?.rcps ?? []).flatMap((level) => level.policies.map((policy) => ({ layer: 'rcp' as const, policy, level }))),
    ...identityLayers(p),
    ...(p.boundary && p.kind !== 'root' ? [{ layer: 'boundary' as const, policy: p.boundary }] : []),
    ...(p.sessionPolicy ? [{ layer: 'session' as const, policy: p.sessionPolicy }] : []),
  ]
  for (const l of layers) {
    const hit = firstMatch([l.policy], 'Deny', action, r.arn, ctx)
    if (hit) {
      trace.push(`Deny explícito: ${LAYER_LABEL[l.layer]} ${l.policy.name}${l.level ? ` (anexada a ${l.level.name})` : ''}, statement ${hit.st.sid}. Um Deny explícito vence qualquer Allow.`)
      return done('explicit-deny', 'explicit-deny', { layer: l.layer, policyName: l.policy.name, sid: hit.st.sid })
    }
  }
  for (const st of r.policy?.statements ?? []) {
    if (st.effect !== 'Deny' || !statementMatches(st, action, r.arn, ctx)) continue
    if ((st.principals ?? []).some((ref) => principalMatch(ref, p))) {
      trace.push(`Deny explícito na política de recurso ${r.policy!.name}, statement ${st.sid}. Um Deny explícito vence qualquer Allow.`)
      return done('explicit-deny', 'explicit-deny', { layer: 'resource', policyName: r.policy!.name, sid: st.sid })
    }
  }
  trace.push('Nenhum Deny explícito se aplica.')

  // 2. RCP e 3. SCP: Allow em todos os níveis
  for (const [kind, acct] of [['rcp', rcpAcct], ['scp', scpAcct]] as const) {
    if (!acct) continue
    const levels = kind === 'rcp' ? acct.rcps! : acct.scps!
    for (const level of levels) {
      const hit = firstMatch(level.policies, 'Allow', action, r.arn, ctx)
      if (!hit) {
        trace.push(`${LAYER_LABEL[kind]}: nada anexado a ${level.name} permite ${action}. É preciso um Allow em todos os níveis, da raiz até a conta.`)
        return done('implicit-deny', kind === 'rcp' ? 'rcp-no-allow' : 'scp-no-allow', { layer: kind, policyName: level.policies[0]?.name })
      }
    }
    trace.push(`${LAYER_LABEL[kind]}: todos os níveis (${levels.map((l) => l.name).join(', ')}) permitem. Lembre que ${kind === 'scp' ? 'a SCP' : 'a RCP'} só limita; ela não concede nada.`)
  }
  const acctP = scenario.accounts?.find((a) => a.id === p.account)
  if (isIamPrincipal(p) && acctP?.orgId && (acctP.management || p.serviceLinked)) {
    trace.push(acctP.management ? 'A conta de gerenciamento não é afetada por SCPs.' : 'Service-linked roles não são afetadas por SCPs nem RCPs.')
  }

  const grant = resourceGrant(r, p, action, ctx)
  if (r.policy) trace.push(grant ? `A política de recurso ${r.policy.name} ${GRANT_TEXT[grant.type]} (statement ${grant.st.sid}).` : `A política de recurso ${r.policy.name} não concede ${action} a este principal.`)
  const requiresResource = r.kind === 'trust' || r.kind === 'kms-key'

  // Serviços e requisições anônimas: só a política de recurso pode conceder.
  if (!isIamPrincipal(p)) {
    if (grant) {
      trace.push('Resultado: permitido.')
      return done('allow', 'allowed', { layer: 'resource', policyName: r.policy?.name, sid: grant.st.sid })
    }
    trace.push(p.kind === 'anonymous' ? 'Sem concessão pública, uma requisição anônima é negada.' : 'Um serviço só recebe acesso pela política de recurso (ou assumindo uma role). Resultado: negado implicitamente.')
    return done('implicit-deny', 'no-grant', { layer: 'resource' })
  }

  // Usuário raiz
  if (p.kind === 'root') {
    if (same && !requiresResource) {
      trace.push('O usuário raiz tem acesso total na própria conta: não precisa de política de identidade. Resultado: permitido.')
      return done('allow', 'allowed', { layer: 'root' })
    }
    if (grant) {
      trace.push('Resultado: permitido.')
      return done('allow', 'allowed', { layer: 'resource', sid: grant.st.sid, policyName: r.policy?.name })
    }
    trace.push(same ? 'Este tipo de recurso precisa permitir o principal explicitamente, mesmo para a própria conta.' : 'O recurso de outra conta não concede nada à conta do usuário raiz. Resultado: negado implicitamente.')
    return done('implicit-deny', same ? 'resource-required' : 'cross-account-resource', { layer: 'resource' })
  }

  // Concessão direta na mesma conta: não é limitada por deny implícito de identidade, boundary ou sessão.
  if (same && grant?.type === 'direct') {
    trace.push('Na mesma conta, uma concessão direta ao usuário ou à sessão basta: deny implícito de identidade, boundary ou session policy não a limitam. Resultado: permitido.')
    return done('allow', 'allowed', { layer: 'resource', policyName: r.policy?.name, sid: grant.st.sid })
  }

  if (!same && !grant) {
    trace.push(`Na conta do recurso (${r.account}), nada concede acesso a quem vem de fora. Entre contas, a política de recurso precisa permitir. Resultado: negado implicitamente.`)
    return done('implicit-deny', 'cross-account-resource', { layer: 'resource', policyName: r.policy?.name })
  }
  if (same && requiresResource && !grant) {
    trace.push(`${r.kind === 'trust' ? 'Uma trust policy' : 'Uma key policy do KMS'} precisa permitir o principal explicitamente; política de identidade sozinha não basta. Resultado: negado implicitamente.`)
    return done('implicit-deny', 'resource-required', { layer: 'resource', policyName: r.policy?.name })
  }

  // Políticas de identidade
  const idHit = firstMatch(identityLayers(p).map((l) => l.policy), 'Allow', action, r.arn, ctx)
  const skipIdentity = same && grant?.type === 'role'
  if (skipIdentity) {
    trace.push('Como a política de recurso concede ao ARN da role, a política de identidade não precisa permitir; boundary e session policy ainda limitam.')
  } else if (idHit) {
    trace.push(`A política de identidade ${idHit.policy.name} permite (statement ${idHit.st.sid}).`)
  } else {
    trace.push(
      !same
        ? `Na conta do principal (${p.account}), nenhuma política de identidade permite ${action}. Entre contas, a identidade também precisa permitir. Resultado: negado implicitamente.`
        : grant?.type === 'account'
          ? 'A política de recurso delega à conta, mas nenhuma política de identidade permite. Resultado: negado implicitamente.'
          : `Nenhuma política de identidade nem de recurso permite ${action}. Resultado: negado implicitamente.`,
    )
    return done('implicit-deny', 'no-identity-allow', { layer: 'identity' })
  }

  // Permissions boundary
  if (p.boundary) {
    const b = firstMatch([p.boundary], 'Allow', action, r.arn, ctx)
    if (!b) {
      trace.push(`O permissions boundary ${p.boundary.name} não permite ${action}. A permissão efetiva é a interseção entre identidade e boundary. Resultado: negado implicitamente.`)
      return done('implicit-deny', 'boundary-no-allow', { layer: 'boundary', policyName: p.boundary.name })
    }
    trace.push(`O permissions boundary ${p.boundary.name} também permite (statement ${b.st.sid}).`)
  }

  // Session policy
  if (p.sessionPolicy && (p.kind === 'role-session' || p.kind === 'federated-user')) {
    const s = firstMatch([p.sessionPolicy], 'Allow', action, r.arn, ctx)
    if (!s) {
      trace.push(`A session policy ${p.sessionPolicy.name} não permite ${action}. A sessão fica com a interseção entre as políticas da role e a session policy. Resultado: negado implicitamente.`)
      return done('implicit-deny', 'session-no-allow', { layer: 'session', policyName: p.sessionPolicy.name })
    }
    trace.push(`A session policy ${p.sessionPolicy.name} também permite (statement ${s.st.sid}).`)
  }

  trace.push('Resultado: permitido.')
  return done('allow', 'allowed', skipIdentity || (!idHit && grant) ? { layer: 'resource', sid: grant?.st.sid } : { layer: 'identity', policyName: idHit?.policy.name, sid: idHit?.st.sid })
}

// ---------------------------------------------------------------------------
// JSON no formato da AWS

function principalJson(refs: PrincipalRef[]) {
  if (refs.some((r) => r === '*')) return '*'
  const out: Record<string, string | string[]> = {}
  const add = (k: string, v: string) => {
    const cur = out[k]
    out[k] = cur === undefined ? v : Array.isArray(cur) ? [...cur, v] : [cur, v]
  }
  for (const r of refs) {
    if (r === '*') continue
    if ('aws' in r) add('AWS', r.aws)
    else if ('service' in r) add('Service', r.service)
    else add('Federated', r.federated)
  }
  return out
}

function conditionJson(cs: ConditionClause[]) {
  const out: Record<string, Record<string, string | string[]>> = {}
  for (const c of cs) {
    const op = `${c.op}${c.ifExists ? 'IfExists' : ''}`
    out[op] ??= {}
    out[op][c.key] = oneOrMany(c.values)
  }
  return out
}

export function statementJson(st: PolicyStatement) {
  return {
    ...(st.sid ? { Sid: st.sid } : {}),
    Effect: st.effect,
    ...(st.principals?.length ? { Principal: principalJson(st.principals) } : {}),
    ...(st.notActions ? { NotAction: oneOrMany(st.notActions) } : { Action: oneOrMany(st.actions ?? []) }),
    ...(st.notResources ? { NotResource: oneOrMany(st.notResources) } : st.resources ? { Resource: oneOrMany(st.resources) } : {}),
    ...(st.conditions?.length ? { Condition: conditionJson(st.conditions) } : {}),
  }
}

/** Política formatada como JSON. Com `bare`, mostra só o statement. */
export function policyToJson(statements: PolicyStatement[], bare = false): string {
  if (bare && statements.length === 1) return JSON.stringify(statementJson(statements[0]), null, 2)
  return JSON.stringify({ Version: '2012-10-17', Statement: statements.map(statementJson) }, null, 2)
}

/** Texto curto de uma condição, para os cartões da interface. */
export function conditionText(c: ConditionClause): string {
  return `${c.op}${c.ifExists ? 'IfExists' : ''} ${c.key} ${c.values.join(' ou ')}`
}

export function principalRefText(r: PrincipalRef): string {
  if (r === '*') return '* (qualquer um, inclusive anônimo)'
  if ('service' in r) return `serviço ${r.service}`
  if ('federated' in r) return `provedor ${r.federated}`
  if (/^\d{12}$/.test(r.aws)) return `conta ${r.aws}`
  return r.aws
}
