/**
 * Auditoria de credenciais: para cada identidade de uma conta, quais ações
 * as boas práticas do IAM indicam.
 *
 * Conferido em 19/10/2026:
 * - Boas práticas: https://docs.aws.amazon.com/IAM/latest/UserGuide/best-practices.html
 * - Usuário raiz: https://docs.aws.amazon.com/IAM/latest/UserGuide/root-user-best-practices.html
 * - Atualização de chaves: https://docs.aws.amazon.com/IAM/latest/UserGuide/id-credentials-access-keys-update.html
 * - Roles para EC2: https://docs.aws.amazon.com/IAM/latest/UserGuide/id_roles_use_switch-role-ec2.html
 * - Roles Anywhere: https://docs.aws.amazon.com/rolesanywhere/latest/userguide/introduction.html
 * - Relatório de credenciais: https://docs.aws.amazon.com/IAM/latest/UserGuide/id_credentials_getting-report.html
 *
 * Premissas do cenário (não são regras da AWS): o prazo de rotação das chaves
 * e o prazo a partir do qual uma credencial é considerada sem uso.
 */

export type CredUse =
  /** Pessoa da empresa que usa o console ou a CLI. */
  | 'person'
  /** Aplicação rodando numa instância EC2. */
  | 'ec2-app'
  /** Servidor ou script fora da AWS (datacenter próprio). */
  | 'onprem'
  /** Ferramenta de terceiros que só aceita chave de acesso. */
  | 'third-party'
  /** Acesso de emergência (break-glass), guardado no cofre. */
  | 'emergency'
  /** Ninguém usa mais. */
  | 'nobody'
  /** Usuário raiz da conta. */
  | 'root'
  /** Role usada por um serviço ou assumida por pessoas. */
  | 'role'

export const USE_LABEL: Record<CredUse, string> = {
  person: 'pessoa da equipe (console e CLI)',
  'ec2-app': 'aplicação numa instância EC2',
  onprem: 'servidor fora da AWS',
  'third-party': 'ferramenta de terceiros',
  emergency: 'acesso de emergência guardado no cofre',
  nobody: 'ninguém usa mais',
  root: 'usuário raiz da conta',
  role: 'role (credenciais temporárias)',
}

export interface AccessKeyInfo {
  id: string
  active: boolean
  /** Dias desde a criação ou a última rotação. */
  ageDays: number
  /** Dias desde o último uso (null = nunca usada). */
  lastUsedDays: number | null
}

export interface CredRow {
  id: string
  name: string
  kind: 'root' | 'user' | 'role'
  use: CredUse
  password: boolean
  mfa: boolean
  keys: AccessKeyInfo[]
  /** Contexto extra exibido na linha. */
  note?: string
}

export type CredAction =
  | 'enable-mfa'
  | 'delete-keys'
  | 'rotate-key'
  | 'to-role'
  | 'to-roles-anywhere'
  | 'to-identity-center'
  | 'remove-user'
  | 'keep'

export const ACTION_LABEL: Record<CredAction, string> = {
  'enable-mfa': 'Habilitar MFA',
  'delete-keys': 'Excluir as chaves de acesso',
  'rotate-key': 'Rotacionar a chave de acesso',
  'to-role': 'Trocar a chave por uma role (instance profile)',
  'to-roles-anywhere': 'Trocar a chave pelo IAM Roles Anywhere',
  'to-identity-center': 'Migrar a pessoa para o IAM Identity Center',
  'remove-user': 'Remover o usuário e as credenciais',
  keep: 'Manter como está',
}

export const ACTION_ORDER: CredAction[] = ['enable-mfa', 'delete-keys', 'rotate-key', 'to-role', 'to-roles-anywhere', 'to-identity-center', 'remove-user', 'keep']

export interface AuditPolicy {
  /** Premissa: chaves mais velhas que isso precisam de rotação. */
  rotateAfterDays: number
  /** Premissa: credencial sem uso há mais que isso é considerada abandonada. */
  unusedAfterDays: number
  /** A empresa já tem o IAM Identity Center ligado a um provedor de identidade. */
  federation: boolean
}

export interface Recommendation {
  actions: CredAction[]
  reasons: string[]
}

const activeKeys = (r: CredRow) => r.keys.filter((k) => k.active)

/** Ações recomendadas para a linha, com o motivo de cada uma. */
export function recommend(r: CredRow, p: AuditPolicy): Recommendation {
  const actions: CredAction[] = []
  const reasons: string[] = []
  const add = (a: CredAction, why: string) => {
    if (!actions.includes(a)) actions.push(a)
    reasons.push(why)
  }
  const keys = activeKeys(r)

  switch (r.use) {
    case 'root':
      if (!r.mfa) add('enable-mfa', 'O usuário raiz precisa de MFA: a AWS exige MFA no root de todos os tipos de conta.')
      if (keys.length) add('delete-keys', 'Não crie chaves de acesso para o usuário raiz: ele tem acesso total, inclusive à cobrança. Para a CLI, a AWS indica `aws login`, com credenciais temporárias.')
      break
    case 'role':
      add('keep', 'Roles não têm credenciais de longo prazo: quem as assume recebe credenciais temporárias.')
      break
    case 'person':
      if (p.federation) add('to-identity-center', 'Para pessoas, a boa prática é a federação: login pelo provedor de identidade da empresa e credenciais temporárias pelo IAM Identity Center.')
      else {
        if (!r.mfa && r.password) add('enable-mfa', 'Quem entra no console com senha precisa de MFA.')
        if (keys.some((k) => k.ageDays > p.rotateAfterDays)) add('rotate-key', `A chave tem mais de ${p.rotateAfterDays} dias (prazo da empresa): rotacione sem interromper o uso.`)
      }
      break
    case 'ec2-app':
      add('to-role', 'Aplicação em EC2 recebe credenciais temporárias de uma role pelo instance profile; a chave fixa deixa de ser necessária.')
      break
    case 'onprem':
      add('to-roles-anywhere', 'Servidor fora da AWS pode trocar um certificado X.509 por credenciais temporárias com o IAM Roles Anywhere.')
      break
    case 'third-party':
      if (keys.some((k) => k.ageDays > p.rotateAfterDays)) add('rotate-key', `Ferramenta que só aceita chave de acesso é uma exceção aceitável, mas a chave tem mais de ${p.rotateAfterDays} dias: rotacione.`)
      if (keys.length > 1 && keys.some((k) => k.lastUsedDays === null || k.lastUsedDays > p.unusedAfterDays)) add('delete-keys', 'Uma das chaves não é usada: exclua a que sobra depois de confirmar o último uso.')
      if (!actions.length) add('keep', 'Exceção aceitável (ferramenta sem suporte a roles) e a chave está em dia.')
      break
    case 'emergency':
      if (!r.mfa) add('enable-mfa', 'O acesso de emergência é uma exceção aceitável, mas precisa de MFA.')
      else add('keep', 'Acesso de emergência com MFA e guardado no cofre: exceção aceitável.')
      break
    case 'nobody':
      add('remove-user', 'Credenciais sem uso só aumentam o risco: remova o usuário, a senha e as chaves.')
      break
  }
  return { actions, reasons }
}

export interface RowVerdict {
  score: number
  status: 'correct' | 'partial' | 'wrong' | 'missed'
  expected: CredAction[]
  reasons: string[]
  wrongPicks: CredAction[]
  missing: CredAction[]
}

/** Nota da linha: acertos menos escolhas indevidas, sobre o número de ações esperadas. */
export function judgeRow(r: CredRow, p: AuditPolicy, picked: CredAction[] | undefined): RowVerdict {
  const { actions: expected, reasons } = recommend(r, p)
  const picks = picked ?? []
  const hits = picks.filter((a) => expected.includes(a))
  const wrongPicks = picks.filter((a) => !expected.includes(a))
  const missing = expected.filter((a) => !picks.includes(a))
  const score = picks.length === 0 ? 0 : Math.max(0, (hits.length - wrongPicks.length) / expected.length)
  const status = picks.length === 0 ? 'missed' : score === 1 && wrongPicks.length === 0 ? 'correct' : score > 0 ? 'partial' : 'wrong'
  return { score: Math.min(1, score), status, expected, reasons, wrongPicks, missing }
}

export function keySummary(k: AccessKeyInfo): string {
  const days = (n: number) => `${n} ${n === 1 ? 'dia' : 'dias'}`
  const used = k.lastUsedDays === null ? 'nunca usada' : k.lastUsedDays === 0 ? 'usada hoje' : `último uso há ${days(k.lastUsedDays)}`
  return `${k.id}: ${k.active ? 'ativa' : 'inativa'}, criada há ${days(k.ageDays)}, ${used}`
}
