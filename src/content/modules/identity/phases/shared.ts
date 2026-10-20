/** Peças compartilhadas pelas fases da trilha IAM e Access Management. */
import { policyToJson, type Policy, type PolicyStatement } from '../../../../simulators/policy/model'

export const pol = (name: string, statements: PolicyStatement[]): Policy => ({ id: name, name, statements })

/** Política exibida abaixo do enunciado, no formato JSON da AWS. */
export const exhibit = (title: string, statements: PolicyStatement[]) => ({ title, code: policyToJson(statements) })

/** Opções das previsões do motor de políticas. */
export const DECISION_OPTIONS = [
  { id: 'allow', text: 'Permitido', outcome: 'allow' },
  { id: 'explicit', text: 'Negado por um Deny explícito', outcome: 'explicit-deny' },
  { id: 'implicit', text: 'Negado porque nada permite (deny implícito)', outcome: 'implicit-deny' },
]

export const ADMIN: Policy = pol('AdministratorAccess', [{ sid: 'Tudo', effect: 'Allow', actions: ['*'], resources: ['*'] }])
export const FULL_AWS_ACCESS: Policy = pol('FullAWSAccess', [{ sid: 'Tudo', effect: 'Allow', actions: ['*'], resources: ['*'] }])
