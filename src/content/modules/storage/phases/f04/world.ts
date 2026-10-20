/** Cenário fictício da Pagaí Pagamentos para os simuladores de acesso e criptografia. */
import type { RequestDef } from '../../../../../simulators/access/lab'
import type { AccessWorld, Identity, KmsKey, Statement } from '../../../../../simulators/access/model'

export const ACC = '210987654321'
export const PARTNER = '555566667777'
export const BUCKET = 'pagai-transacoes'
export const B = `arn:aws:s3:::${BUCKET}`
export const IP = '198.51.100.20'

export const KEY_ID = '7f3c2a10-relatorios'
export const KEY_ARN = `arn:aws:kms:us-east-1:${ACC}:key/${KEY_ID}`
export const AWS_KEY_ID = 'aws-s3-managed'

// --- Identidades ------------------------------------------------------------------
export const BRUNO_RW: Statement = { sid: 'BrunoLeGrava', effect: 'Allow', actions: ['s3:ListBucket', 's3:GetObject', 's3:PutObject'], resources: [B, `${B}/*`], note: 'Leitura e gravação no bucket.' }
export const BRUNO: Identity = { id: 'bruno', name: 'bruno.lima', description: 'Analista financeiro (mesma conta)', kind: 'user', account: ACC, policies: [BRUNO_RW] }
export const BRUNO_DECRYPT: Statement = { sid: 'BrunoDecrypt', effect: 'Allow', actions: ['kms:Decrypt'], resources: [KEY_ARN], note: 'Permite descriptografar com a chave de relatórios.' }

export const APP_RW: Statement = { sid: 'AppBucket', effect: 'Allow', actions: ['s3:GetObject', 's3:PutObject'], resources: [`${B}/*`], note: 'Ler e gravar em todo o bucket (permissão herdada de um projeto antigo).' }
export const APP: Identity = { id: 'app', name: 'app-pagamentos', description: 'Role da aplicação (mesma conta)', kind: 'role', account: ACC, policies: [APP_RW] }

export const AUD_READ: Statement = { sid: 'AuditoriaLeRelatorios', effect: 'Allow', actions: ['s3:GetObject'], resources: [`${B}/relatorios/*`], note: 'Na conta da auditoria.' }
export const AUD_KMS: Statement = { sid: 'AuditoriaUsaChave', effect: 'Allow', actions: ['kms:Decrypt'], resources: [KEY_ARN], note: 'Na conta da auditoria: usar a chave de relatórios da Pagaí.' }
export const AUDITOR: Identity = { id: 'auditor', name: 'auditoria-bacen', description: 'Role da auditoria externa (outra conta)', kind: 'role', account: PARTNER, policies: [AUD_READ, AUD_KMS] }

// --- Bucket policy ----------------------------------------------------------------
export const BP_AUDITOR: Statement = { sid: 'AuditorRelatorios', effect: 'Allow', principals: [{ account: PARTNER }], actions: ['s3:GetObject'], resources: [`${B}/relatorios/*`], note: 'A conta da auditoria lê relatorios/.' }
export const BP_TLS: Statement = {
  sid: 'SomenteHTTPS',
  effect: 'Deny',
  principals: ['*'],
  actions: ['s3:*'],
  resources: [B, `${B}/*`],
  conditions: [{ key: 'aws:SecureTransport', value: false }],
  note: 'Nega qualquer requisição feita sem TLS.',
}
export const BP_ALLOW_TLS: Statement = {
  sid: 'PermiteComHTTPS',
  effect: 'Allow',
  principals: [{ account: ACC }],
  actions: ['s3:*'],
  resources: [B, `${B}/*`],
  conditions: [{ key: 'aws:SecureTransport', value: true }],
  note: 'Permite à própria conta quando a requisição usa TLS.',
}
export const BP_DENY_HTTPS: Statement = {
  sid: 'NegaComHTTPS',
  effect: 'Deny',
  principals: ['*'],
  actions: ['s3:*'],
  resources: [B, `${B}/*`],
  conditions: [{ key: 'aws:SecureTransport', value: true }],
  note: 'Nega requisições quando aws:SecureTransport é true.',
}

// --- Key policies -----------------------------------------------------------------
export const KP_ROOT: Statement = { sid: 'HabilitaIAM', effect: 'Allow', principals: [{ account: ACC }], actions: ['kms:*'], resources: ['*'], note: 'Padrão: delega à conta — as políticas IAM decidem quem usa a chave.' }
export const KP_PARTNER: Statement = { sid: 'AuditoriaDecrypt', effect: 'Allow', principals: [{ account: PARTNER }], actions: ['kms:Decrypt'], resources: ['*'], note: 'Permite à conta da auditoria descriptografar (a conta dela ainda precisa permitir via IAM).' }
export const KP_BRUNO: Statement = { sid: 'BrunoDecryptDireto', effect: 'Allow', principals: [{ arn: `arn:aws:iam::${ACC}:user/bruno.lima` }], actions: ['kms:Decrypt'], resources: ['*'], note: 'Concede kms:Decrypt diretamente ao analista.' }
export const KP_EVERYONE: Statement = { sid: 'TodosUsam', effect: 'Allow', principals: ['*'], actions: ['kms:*'], resources: ['*'], note: 'Qualquer principal pode fazer qualquer coisa com a chave.' }

export const CUSTOMER_KEY: KmsKey = { id: KEY_ID, alias: 'alias/pagai-relatorios', managedBy: 'customer', account: ACC, policy: [KP_ROOT] }
export const AWS_KEY: KmsKey = { id: AWS_KEY_ID, alias: 'aws/s3', managedBy: 'aws', account: ACC, policy: [] }

/** Mundo da Pagaí. `reportsKey` define com que chave os relatórios foram criptografados. */
export function pagai(partial: { policy?: Statement[]; identities?: Identity[]; reportsKey?: 'customer' | 'aws' | 'none' } = {}): AccessWorld {
  const rk = partial.reportsKey ?? 'customer'
  return {
    bucket: {
      name: BUCKET,
      account: ACC,
      policy: partial.policy ?? [],
      bpa: { blockPublicAcls: true, ignorePublicAcls: true, blockPublicPolicy: true, restrictPublicBuckets: true },
      objectOwnership: 'BucketOwnerEnforced',
      defaultEncryption: 'SSE-S3',
    },
    objects: [
      { key: 'transacoes/2026-10-15.parquet', encryption: 'SSE-S3' },
      rk === 'none'
        ? { key: 'relatorios/2026-q3.pdf', encryption: 'SSE-S3' }
        : { key: 'relatorios/2026-q3.pdf', encryption: 'SSE-KMS', kmsKeyId: rk === 'aws' ? AWS_KEY_ID : KEY_ID },
    ],
    identities: partial.identities ?? [BRUNO, APP, AUDITOR],
    keys: [CUSTOMER_KEY, AWS_KEY],
  }
}

const req = (id: string, label: string, action: RequestDef['action'], key: string | undefined, secureTransport: boolean): RequestDef => ({ id, label, action, key, secureTransport, sourceIp: IP })

export const REQUESTS = {
  getTxHttps: req('get-tx-https', 'Ler transação (HTTPS)', 's3:GetObject', 'transacoes/2026-10-15.parquet', true),
  getTxHttp: req('get-tx-http', 'Ler transação (HTTP)', 's3:GetObject', 'transacoes/2026-10-15.parquet', false),
  putTxHttps: req('put-tx-https', 'Gravar transação (HTTPS)', 's3:PutObject', 'transacoes/2026-10-16.parquet', true),
  putTxHttp: req('put-tx-http', 'Gravar transação (HTTP)', 's3:PutObject', 'transacoes/2026-10-16.parquet', false),
  getReport: req('get-rel', 'Ler relatório (SSE-KMS)', 's3:GetObject', 'relatorios/2026-q3.pdf', true),
}
