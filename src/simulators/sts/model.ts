/**
 * Simulador do AssumeRole: confere a duração pedida, avalia sts:AssumeRole
 * com o motor de políticas (trust policy + permissões de quem chama) e monta
 * a sessão resultante.
 *
 * Conferido em 19/10/2026:
 * - AssumeRole: https://docs.aws.amazon.com/STS/latest/APIReference/API_AssumeRole.html
 * - Comparativo do STS: https://docs.aws.amazon.com/IAM/latest/UserGuide/id_credentials_sts-comparison.html
 *
 * Regras modeladas:
 * - DurationSeconds vai de 900 s ao máximo da role (que vai de 1 h a 12 h); o padrão é 3.600 s.
 *   Pedir mais que o máximo faz a operação falhar.
 * - Encadeamento de roles (quem chama já é uma sessão de role): pedir mais de 1 h faz a operação falhar.
 * - A trust policy precisa permitir quem chama; na mesma conta, citar o usuário dispensa a política
 *   de identidade; citar a conta exige que a identidade também permita.
 * - MFA (SerialNumber e TokenCode) entra no contexto como aws:MultiFactorAuthPresent = true.
 * - ExternalId entra como sts:ExternalId; SourceIdentity como sts:SourceIdentity.
 * - A sessão tem as permissões da role, limitadas pela session policy, se houver.
 */
import { evaluate, findPrincipal, findResource, type Policy, type PolicyScenario, type Principal, type RequestSpec } from '../policy/model'

export interface AssumeAttempt {
  callerId: string
  /** Recurso do cenário com kind 'trust' (a role). */
  roleId: string
  sessionName: string
  durationSeconds?: number
  mfa?: boolean
  externalId?: string
  sourceIdentity?: string
  sessionPolicy?: Policy
}

export interface RoleSettings {
  /** Duração máxima da sessão configurada na role, em horas (1 a 12). */
  maxSessionHours: number
  /** Políticas de permissão da role (o que a sessão pode fazer). */
  permissions: Policy[]
}

export type StsOutcome = 'ok' | 'trust-denied' | 'caller-denied' | 'duration-invalid' | 'mfa-missing'

export const STS_OUTCOME_LABEL: Record<StsOutcome, string> = {
  ok: 'Sessão criada',
  'trust-denied': 'Negado: a trust policy não permite quem chama',
  'caller-denied': 'Negado: quem chama não tem permissão para sts:AssumeRole',
  'duration-invalid': 'Falha: duração fora do permitido',
  'mfa-missing': 'Negado: a trust policy exige MFA',
}

export interface AssumeResult {
  outcome: StsOutcome
  trace: string[]
  /** Duração efetiva em segundos (quando ok). */
  durationSeconds?: number
  sessionArn?: string
  /** Principal da sessão criada, pronto para ser avaliado pelo motor. */
  session?: Principal
}

const hours = (s: number) => (s % 3600 === 0 ? `${s / 3600} h` : `${Math.round(s / 60)} min`)

export function roleNameOf(arn: string): string {
  return arn.split(':role/')[1]?.split('/').pop() ?? arn
}

/** Executa o AssumeRole no cenário. */
export function assumeRole(scenario: PolicyScenario, settings: RoleSettings, attempt: AssumeAttempt): AssumeResult {
  const caller = findPrincipal(scenario, attempt.callerId)
  const role = findResource(scenario, attempt.roleId)
  const roleName = roleNameOf(role.arn)
  const trace: string[] = []
  const requested = attempt.durationSeconds ?? 3600
  const chained = caller.kind === 'role-session'
  const max = Math.round(settings.maxSessionHours * 3600)

  trace.push(`${caller.name} chama sts:AssumeRole na role ${roleName} pedindo ${hours(requested)} de sessão${attempt.mfa ? ', com código MFA' : ''}${attempt.externalId ? `, com ExternalId "${attempt.externalId}"` : ''}.`)

  if (requested < 900) {
    trace.push('A duração mínima é de 900 segundos (15 minutos): a operação falha.')
    return { outcome: 'duration-invalid', trace }
  }
  if (requested > max) {
    trace.push(`A role permite no máximo ${hours(max)} por sessão: pedir ${hours(requested)} faz a operação falhar.`)
    return { outcome: 'duration-invalid', trace }
  }
  if (chained && requested > 3600) {
    trace.push(`Quem chama já é uma sessão de role (encadeamento de roles): o limite é de 1 h, e pedir ${hours(requested)} faz a operação falhar.`)
    return { outcome: 'duration-invalid', trace }
  }

  const context: RequestSpec['context'] = {}
  if (attempt.mfa) context['aws:MultiFactorAuthPresent'] = 'true'
  if (attempt.externalId) context['sts:ExternalId'] = attempt.externalId
  if (attempt.sourceIdentity) context['sts:SourceIdentity'] = attempt.sourceIdentity
  const decision = evaluate(scenario, { principalId: caller.id, action: 'sts:AssumeRole', resourceId: role.id, context })
  trace.push(...decision.trace.slice(1))

  if (!decision.allowed) {
    const identitySide = decision.layer === 'identity' || decision.layer === 'scp' || decision.layer === 'boundary' || decision.layer === 'session'
    if (identitySide) return { outcome: 'caller-denied', trace }
    if (!attempt.mfa) {
      const withMfa = evaluate(scenario, { principalId: caller.id, action: 'sts:AssumeRole', resourceId: role.id, context: { ...context, 'aws:MultiFactorAuthPresent': 'true' } })
      if (withMfa.allowed) {
        trace.push('Com um código MFA na chamada (SerialNumber e TokenCode), a trust policy permitiria.')
        return { outcome: 'mfa-missing', trace }
      }
    }
    return { outcome: 'trust-denied', trace }
  }

  const sessionArn = `arn:aws:sts::${role.account}:assumed-role/${roleName}/${attempt.sessionName}`
  trace.push(`O STS devolve credenciais temporárias (chave, segredo e token de sessão) válidas por ${hours(requested)}. A sessão é ${sessionArn}.`)
  if (attempt.sessionPolicy) trace.push(`A session policy ${attempt.sessionPolicy.name} limita a sessão: ela fica com a interseção entre as permissões da role e a session policy.`)
  trace.push(`Nas próximas chamadas, valem as permissões da role ${roleName}; as permissões de ${caller.name} ficam de fora.`)
  const session: Principal = {
    id: `sessao:${roleName}:${attempt.sessionName}`,
    name: `${roleName} (sessão ${attempt.sessionName})`,
    kind: 'role-session',
    account: role.account,
    roleName,
    sessionName: attempt.sessionName,
    tags: role.tags,
    auth: { via: 'session', mfa: Boolean(attempt.mfa) },
    identityPolicies: settings.permissions,
    sessionPolicy: attempt.sessionPolicy,
  }
  return { outcome: 'ok', trace, durationSeconds: requested, sessionArn, session }
}

/** Avalia uma ação feita com a sessão criada (útil para "o que a sessão consegue fazer?"). */
export function evaluateWithSession(scenario: PolicyScenario, session: Principal, req: Omit<RequestSpec, 'principalId'>) {
  const sc: PolicyScenario = { ...scenario, principals: [...scenario.principals, session] }
  return evaluate(sc, { ...req, principalId: session.id })
}
