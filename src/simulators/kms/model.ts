/**
 * Simulador do AWS KMS: quem pode usar e quem pode administrar uma chave,
 * olhando a key policy, as políticas IAM e os grants.
 *
 * Conferido em 22/10/2026:
 * - A key policy não dá permissão automática à conta: o statement com o
 *   principal da conta (arn:aws:iam::<conta>:root) é o que habilita as
 *   políticas IAM; sem ele, políticas IAM que permitem não têm efeito, mas as
 *   que negam continuam valendo
 *   (https://docs.aws.amazon.com/kms/latest/developerguide/key-policy-default.html).
 * - Administradores da chave (Create*, Put*, Enable*, ScheduleKeyDeletion…)
 *   não recebem as operações criptográficas; usuários da chave recebem
 *   Encrypt, Decrypt, ReEncrypt*, GenerateDataKey* e DescribeKey (mesma página).
 * - Um grant permite, nunca nega; vale para exatamente uma chave; o grantee
 *   usa as operações do grant sem citá-lo; é o mecanismo que serviços como o
 *   EBS usam (https://docs.aws.amazon.com/kms/latest/developerguide/grants.html).
 * - Encrypt aceita até 4.096 bytes com chave simétrica; para dados maiores se
 *   usa GenerateDataKey (https://docs.aws.amazon.com/kms/latest/APIReference/API_Encrypt.html).
 *
 * A key policy e as políticas IAM são avaliadas pelo motor de políticas
 * (simulators/policy/model.ts), com o recurso do tipo `kms-key`.
 *
 * Simplificação: um Deny explícito vence também os grants, como na lógica
 * geral de avaliação; grants entre contas, restrições de grant (contexto de
 * criptografia, SourceArn) e tokens de grant não são simulados.
 */
import { evaluate, type Policy, type PolicyStatement, type Principal } from '../policy/model'

export const KMS_ACCOUNT = '111122223333'

export interface KmsGrant {
  id: string
  granteeId: string
  /** Operações do grant, sem o prefixo "kms:" (ex.: "Decrypt", "GenerateDataKey"). */
  operations: string[]
}

export interface KmsKey {
  arn: string
  label: string
  statements: PolicyStatement[]
}

export interface KmsWorld {
  principals: Principal[]
  key: KmsKey
  grants: KmsGrant[]
}

export interface KmsRequest {
  principalId: string
  /** Ação com prefixo (ex.: "kms:Decrypt"). */
  action: string
}

export type KmsVia = 'policy' | 'grant'

export interface KmsDecision {
  allowed: boolean
  via?: KmsVia
  explicitDeny: boolean
  trace: string[]
}

const keyPolicy = (k: KmsKey): Policy => ({ id: 'keypolicy', name: `KeyPolicy ${k.label}`, statements: k.statements })

/** Decide um pedido à chave: key policy e IAM pelo motor de políticas; se não houver Allow, os grants. */
export function kmsDecide(world: KmsWorld, req: KmsRequest): KmsDecision {
  const scenario = {
    principals: world.principals,
    resources: [{ id: 'key', arn: world.key.arn, account: KMS_ACCOUNT, kind: 'kms-key' as const, label: world.key.label, policy: keyPolicy(world.key) }],
  }
  const r = evaluate(scenario, { principalId: req.principalId, action: req.action, resourceId: 'key' })
  if (r.decision === 'allow') return { allowed: true, via: 'policy', explicitDeny: false, trace: r.trace }
  if (r.decision === 'explicit-deny') return { allowed: false, explicitDeny: true, trace: [...r.trace, 'Um Deny explícito vence também os grants.'] }
  const op = req.action.replace(/^kms:/, '')
  const g = world.grants.find((x) => x.granteeId === req.principalId && x.operations.includes(op))
  if (g) return { allowed: true, via: 'grant', explicitDeny: false, trace: [...r.trace.slice(0, -1), `As políticas não permitem, mas o grant ${g.id} dá a este principal a operação ${op}. Resultado: permitido.`] }
  return { allowed: false, explicitDeny: false, trace: [...r.trace, 'Nenhum grant desta chave cobre o pedido.'] }
}

/** Ações do statement de administradores do console (conferidas em 22/10/2026). */
export const KEY_ADMIN_ACTIONS = ['kms:Create*', 'kms:Describe*', 'kms:Enable*', 'kms:List*', 'kms:Put*', 'kms:Update*', 'kms:Revoke*', 'kms:Disable*', 'kms:Get*', 'kms:Delete*', 'kms:TagResource', 'kms:UntagResource', 'kms:ScheduleKeyDeletion', 'kms:CancelKeyDeletion', 'kms:RotateKeyOnDemand']

/** Ações do statement de usuários do console para chaves simétricas. */
export const KEY_USER_ACTIONS = ['kms:Encrypt', 'kms:Decrypt', 'kms:ReEncrypt*', 'kms:GenerateDataKey*', 'kms:DescribeKey']

export const roleArn = (name: string) => `arn:aws:iam::${KMS_ACCOUNT}:role/${name}`
export const ACCOUNT_ROOT = `arn:aws:iam::${KMS_ACCOUNT}:root`

/** Limite do Encrypt direto com chave simétrica (bytes). */
export const ENCRYPT_MAX_BYTES = 4096

/** Como cifrar um dado do tamanho dado: direto no KMS ou em envelope. */
export const encryptPath = (bytes: number): 'direct' | 'envelope' => (bytes <= ENCRYPT_MAX_BYTES ? 'direct' : 'envelope')

export const ACTION_LABEL: Record<string, string> = {
  'kms:Encrypt': 'cifrar (Encrypt)',
  'kms:Decrypt': 'decifrar (Decrypt)',
  'kms:GenerateDataKey': 'gerar chave de dados (GenerateDataKey)',
  'kms:PutKeyPolicy': 'mudar a key policy (PutKeyPolicy)',
  'kms:ScheduleKeyDeletion': 'agendar a exclusão (ScheduleKeyDeletion)',
  'kms:EnableKeyRotation': 'ligar a rotação (EnableKeyRotation)',
  'kms:CreateGrant': 'criar grant (CreateGrant)',
}
