/**
 * Segurança de uma instância do RDS: acesso de rede, criptografia em repouso e
 * em trânsito, credenciais, backup, proteção contra exclusão e snapshots.
 *
 * Fatos conferidos em 21/10/2026:
 * - Criptografia em repouso só na criação; para criptografar uma instância existente, copiar um
 *   snapshot com criptografia e restaurar uma instância nova; não dá para desligar:
 *   https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/Overview.Encryption.html
 * - TLS obrigatório no PostgreSQL com rds.force_ssl:
 *   https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/PostgreSQL.Concepts.General.SSL.html
 * - Autenticação IAM (MariaDB, MySQL, PostgreSQL) com token de 15 minutos:
 *   https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/UsingWithRDS.IAMDBAuth.html
 * - Senha mestre gerenciada pelo RDS no Secrets Manager, rodada a cada 7 dias por padrão:
 *   https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/rds-secrets-manager.html
 * - Acesso público, subnets e security group: https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/USER_VPC.WorkingWithRDSInstanceinaVPC.html
 * - Proteção contra exclusão: https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/USER_DeleteInstance.html
 * - Snapshots públicos: https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/USER_ShareSnapshot.html
 */

export type Ingress = 'anywhere' | 'office' | 'app-sg'
export type Encryption = 'none' | 'enable-in-place' | 'snapshot-restore'
export type Credentials = 'hardcoded' | 'secrets-manager' | 'iam-auth'

export interface DbSecurityState {
  publicAccess: boolean
  ingress: Ingress
  encryption: Encryption
  tls: boolean
  credentials: Credentials
  backupDays: number
  deletionProtection: boolean
  publicSnapshot: boolean
}

export type SecurityReq = 'private' | 'app-only' | 'encrypted' | 'tls' | 'no-static-password' | 'pitr' | 'deletion-protection' | 'no-public-snapshot'

export const INGRESS_LABEL: Record<Ingress, string> = {
  anywhere: 'Porta 5432 aberta para 0.0.0.0/0',
  office: 'Porta 5432 aberta para o IP do escritório',
  'app-sg': 'Porta 5432 aberta só para o security group da aplicação',
}

export const ENCRYPTION_LABEL: Record<Encryption, string> = {
  none: 'Manter como está (sem criptografia)',
  'enable-in-place': 'Ligar a criptografia na instância atual',
  'snapshot-restore': 'Copiar um snapshot com criptografia e restaurar numa instância nova',
}

export const CREDENTIALS_LABEL: Record<Credentials, string> = {
  hardcoded: 'Senha do usuário mestre no código da aplicação',
  'secrets-manager': 'Senha gerenciada pelo RDS no Secrets Manager, com rotação',
  'iam-auth': 'Autenticação IAM, com token de 15 minutos',
}

export const REQ_LABEL: Record<SecurityReq, string> = {
  private: 'O banco não pode ser alcançado pela internet',
  'app-only': 'Só a aplicação pode abrir conexões com o banco',
  encrypted: 'Dados, backups e snapshots criptografados em repouso',
  tls: 'Toda conexão criptografada em trânsito',
  'no-static-password': 'Nenhuma senha fixa no código',
  pitr: 'Restaurar o banco como estava em qualquer momento dos últimos 14 dias',
  'deletion-protection': 'Ninguém consegue apagar o banco por engano',
  'no-public-snapshot': 'Nenhuma cópia do banco acessível por outras contas da AWS',
}

export const PITR_DAYS = 14

/** Ações que a AWS recusaria. */
export function refusals(s: DbSecurityState): string[] {
  const out: string[] = []
  if (s.encryption === 'enable-in-place') out.push('a AWS não permite ligar a criptografia numa instância que já existe: ela só é escolhida na criação')
  if (s.backupDays < 0 || s.backupDays > 35) out.push('a retenção do backup vai de 0 a 35 dias')
  return out
}

export function checkRequirement(s: DbSecurityState, r: SecurityReq): { ok: boolean; message: string } {
  switch (r) {
    case 'private':
      return s.publicAccess ? { ok: false, message: 'Com Public access ligado, o endpoint resolve para um IP público fora da VPC.' } : { ok: true, message: 'Sem acesso público, o banco só tem IP privado.' }
    case 'app-only':
      return s.ingress === 'app-sg' ? { ok: true, message: 'Só instâncias com o security group da aplicação chegam à porta do banco.' } : { ok: false, message: `${INGRESS_LABEL[s.ingress]}: outras origens também chegam ao banco.` }
    case 'encrypted':
      if (s.encryption === 'snapshot-restore') return { ok: true, message: 'A instância nova nasce criptografada, com logs, backups, réplicas e snapshots também criptografados. A aplicação passa a usar o endpoint novo.' }
      if (s.encryption === 'enable-in-place') return { ok: false, message: 'A AWS recusaria: a criptografia em repouso só é escolhida na criação da instância.' }
      return { ok: false, message: 'Os dados continuam sem criptografia em repouso.' }
    case 'tls':
      return s.tls ? { ok: true, message: 'Com rds.force_ssl ligado, o banco recusa conexões sem TLS.' } : { ok: false, message: 'Clientes ainda podem se conectar sem TLS.' }
    case 'no-static-password':
      return s.credentials === 'hardcoded' ? { ok: false, message: 'A senha no código vaza junto com o repositório e nunca é trocada.' } : { ok: true, message: s.credentials === 'iam-auth' ? 'A aplicação usa um token de 15 minutos gerado pelo IAM, sem senha guardada.' : 'O RDS gera a senha, guarda no Secrets Manager e a roda a cada 7 dias por padrão.' }
    case 'pitr':
      return s.backupDays >= PITR_DAYS ? { ok: true, message: `Com ${s.backupDays} dias de retenção, dá para voltar a qualquer momento desse período.` } : { ok: false, message: `Com ${s.backupDays} dia(s) de retenção, não dá para voltar ${PITR_DAYS} dias.` }
    case 'deletion-protection':
      return s.deletionProtection ? { ok: true, message: 'Com a proteção ligada, o banco não pode ser apagado até alguém desligá-la.' } : { ok: false, message: 'Sem proteção contra exclusão, um comando errado apaga o banco.' }
    case 'no-public-snapshot':
      return s.publicSnapshot ? { ok: false, message: 'Um snapshot público pode ser restaurado por qualquer conta da AWS.' } : { ok: true, message: 'Nenhum snapshot está público.' }
  }
}
