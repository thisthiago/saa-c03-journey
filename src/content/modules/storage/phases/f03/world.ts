/** Cenário fictício da Contabilix Serviços Contábeis para os simuladores de acesso. */
import type { RequestDef } from '../../../../../simulators/access/lab'
import type { AccessWorld, Identity, Statement } from '../../../../../simulators/access/model'

export const ACC = '111122223333'
export const PARTNER = '444455556666'
export const BUCKET = 'contabilix-documentos'
export const B = `arn:aws:s3:::${BUCKET}`
export const IP = '203.0.113.25'

export const ANON: Identity = { id: 'anon', name: 'Internet (anônimo)', description: 'Qualquer pessoa, sem credenciais', kind: 'anonymous', account: null, policies: [] }

export const ANA_READ: Statement = { sid: 'AnaLeitura', effect: 'Allow', actions: ['s3:ListBucket', 's3:GetObject'], resources: [B, `${B}/*`], note: 'Leitura de todo o bucket.' }
export const ANA: Identity = { id: 'ana', name: 'ana.souza', description: 'Analista contábil (mesma conta)', kind: 'user', account: ACC, policies: [ANA_READ] }

export const APP_ALL: Statement = { sid: 'AppTudo', effect: 'Allow', actions: ['s3:*'], resources: ['*'], note: 'Tudo em tudo — "para não dar erro".' }
export const APP_PUT_IN: Statement = { sid: 'AppGravaEntrada', effect: 'Allow', actions: ['s3:PutObject'], resources: [`${B}/entrada/*`], note: 'Gravar arquivos recebidos em entrada/.' }
export const APP_GET_CLIENTES: Statement = { sid: 'AppLeClientes', effect: 'Allow', actions: ['s3:GetObject'], resources: [`${B}/clientes/*`], note: 'Ler documentos de clientes.' }
export const APP_LIST: Statement = { sid: 'AppLista', effect: 'Allow', actions: ['s3:ListBucket'], resources: [B], note: 'Listar o bucket.' }
export const APP_DELETE: Statement = { sid: 'AppApaga', effect: 'Allow', actions: ['s3:DeleteObject'], resources: [`${B}/*`], note: 'Apagar qualquer objeto.' }
export const APP: Identity = { id: 'app', name: 'app-contabil', description: 'Role da aplicação (mesma conta)', kind: 'role', account: ACC, policies: [APP_ALL] }

export const AUD_IAM: Statement = { sid: 'AuditoriaLeRelatorios', effect: 'Allow', actions: ['s3:GetObject'], resources: [`${B}/relatorios/*`], note: 'Política IAM na conta da auditoria.' }
export const AUDITOR: Identity = { id: 'auditor', name: 'auditoria-externa', description: 'Role da auditoria parceira (outra conta)', kind: 'role', account: PARTNER, policies: [AUD_IAM] }
export const AUD_BROAD: Statement = { sid: 'AuditoriaAcessoAmplo', effect: 'Allow', actions: ['s3:*'], resources: [B, `${B}/*`], note: 'Política IAM ampla, definida pela própria auditoria na conta dela.' }
/** Variante em que a conta da auditoria concede tudo do lado dela: só a bucket policy limita o acesso. */
export const AUDITOR_BROAD: Identity = { ...AUDITOR, policies: [AUD_BROAD] }
/** A role da aplicação sem política IAM própria: depende da bucket policy. */
export const APP_PORTAL: Identity = { ...APP, description: 'Role do portal do cliente (mesma conta, sem política IAM própria)', policies: [] }

export const BP_AUDITOR: Statement = { sid: 'AuditorRelatorios', effect: 'Allow', principals: [{ account: PARTNER }], actions: ['s3:GetObject'], resources: [`${B}/relatorios/*`], note: 'A conta da auditoria lê só relatorios/.' }
export const BP_AUDITOR_ALL: Statement = { sid: 'AuditorTudo', effect: 'Allow', principals: [{ account: PARTNER }], actions: ['s3:*'], resources: [B, `${B}/*`], note: 'A conta da auditoria pode tudo no bucket.' }
export const BP_PUBLIC_REL: Statement = { sid: 'RelatoriosPublicos', effect: 'Allow', principals: ['*'], actions: ['s3:GetObject'], resources: [`${B}/relatorios/*`], note: 'Qualquer pessoa lê relatorios/.' }
export const BP_PUBLIC_ALL: Statement = { sid: 'LeituraPublica', effect: 'Allow', principals: ['*'], actions: ['s3:GetObject'], resources: [`${B}/*`], note: 'Criada em 2024 "para o portal do cliente funcionar".' }
export const BP_APP: Statement = { sid: 'AppPortal', effect: 'Allow', principals: [{ arn: `arn:aws:iam::${ACC}:role/app-contabil` }], actions: ['s3:GetObject'], resources: [`${B}/clientes/*`], note: 'A aplicação do portal lê documentos de clientes.' }
export const BP_DENY_DELETE: Statement = { sid: 'NinguemApaga', effect: 'Deny', principals: ['*'], actions: ['s3:DeleteObject'], resources: [`${B}/*`], note: 'Ninguém apaga objetos.' }
export const BP_TLS: Statement = {
  sid: 'SomenteHTTPS',
  effect: 'Deny',
  principals: ['*'],
  actions: ['s3:*'],
  resources: [B, `${B}/*`],
  conditions: [{ key: 'aws:SecureTransport', value: false }],
  note: 'Nega qualquer requisição sem TLS.',
}

export const OPEN_BPA = { blockPublicAcls: false, ignorePublicAcls: false, blockPublicPolicy: false, restrictPublicBuckets: false }
export const FULL_BPA = { blockPublicAcls: true, ignorePublicAcls: true, blockPublicPolicy: true, restrictPublicBuckets: true }

export function contabilix(partial: { policy?: Statement[]; identities?: Identity[]; bpa?: AccessWorld['bucket']['bpa']; ownership?: AccessWorld['bucket']['objectOwnership'] } = {}): AccessWorld {
  return {
    bucket: {
      name: BUCKET,
      account: ACC,
      policy: partial.policy ?? [],
      bpa: partial.bpa ?? FULL_BPA,
      objectOwnership: partial.ownership ?? 'BucketOwnerEnforced',
      defaultEncryption: 'SSE-S3',
    },
    objects: [
      { key: 'clientes/acme/balanco-2025.pdf', encryption: 'SSE-S3' },
      { key: 'relatorios/2026-q3.pdf', encryption: 'SSE-S3' },
      { key: 'entrada/lote-0912.csv', encryption: 'SSE-S3' },
      { key: 'legado/folha-2019.pdf', encryption: 'SSE-S3', acl: 'public-read' },
    ],
    identities: partial.identities ?? [ANON, ANA, APP, AUDITOR],
    keys: [],
  }
}

const req = (id: string, label: string, action: RequestDef['action'], key?: string): RequestDef => ({ id, label, action, key, secureTransport: true, sourceIp: IP })

export const REQUESTS = {
  list: req('list', 'Listar bucket', 's3:ListBucket'),
  getClientes: req('get-cli', 'Ler clientes/…', 's3:GetObject', 'clientes/acme/balanco-2025.pdf'),
  getRelatorio: req('get-rel', 'Ler relatorios/…', 's3:GetObject', 'relatorios/2026-q3.pdf'),
  putEntrada: req('put-in', 'Gravar entrada/…', 's3:PutObject', 'entrada/novo.csv'),
  deleteClientes: req('del', 'Apagar clientes/…', 's3:DeleteObject', 'clientes/acme/balanco-2025.pdf'),
  getLegado: req('get-leg', 'Ler legado/…', 's3:GetObject', 'legado/folha-2019.pdf'),
}
