/**
 * Simulador de planos do AWS Backup: se o plano é aceito, que perda de dados
 * (RPO) ele garante, o que sobrevive a cada tipo de desastre e quanto custa o
 * armazenamento dos backups do EFS.
 *
 * Conferido em 22/10/2026:
 * - Frequência de snapshot de a cada hora até mensal (console e cron); backup
 *   contínuo com restauração a qualquer momento (PITR), com retenção de 1 a 35
 *   dias, para os serviços que o suportam; retenção de snapshots de 1 dia a
 *   100 anos
 *   (https://docs.aws.amazon.com/aws-backup/latest/devguide/plan-options-and-configuration.html).
 * - Armazenamento frio: o backup fica no mínimo 90 dias nele, e a retenção
 *   precisa ser 90 dias maior que o prazo de transição; disponível para EFS,
 *   EBS (pelo EBS Snapshot Archive, com backups mensais ou menos frequentes),
 *   DynamoDB com recursos avançados, Timestream, VMware, SAP HANA e
 *   CloudFormation (mesma página e
 *   https://docs.aws.amazon.com/aws-backup/latest/devguide/backup-feature-availability.html).
 * - Contínuo: RDS, Aurora, S3 e SAP HANA; cópia entre Regiões e entre contas
 *   para EFS, EBS, RDS, FSx e S3 (página de disponibilidade).
 * - Vault Lock: no modo governança, quem tem permissão remove a trava; no modo
 *   conformidade, depois da carência, ninguém apaga os backups antes do fim
 *   da retenção (https://docs.aws.amazon.com/aws-backup/latest/devguide/vault-lock.html).
 *
 * Simplificação: os backups do EFS são incrementais, e o tamanho guardado é
 * premissa do cenário; os outros serviços não entram na conta de custo.
 */
import type { FilesRegionPrices } from '../files-prices'

export type BackupResource = 'efs' | 'ebs' | 'rds' | 'fsx-windows' | 's3'
export type Frequency = 'continuous' | 'hourly' | '12h' | 'daily' | 'weekly' | 'monthly'
export type CopyTarget = 'none' | 'region' | 'account' | 'both'
export type LockMode = 'none' | 'governance' | 'compliance'

export const RESOURCE_LABEL: Record<BackupResource, string> = {
  efs: 'sistema de arquivos EFS',
  ebs: 'volume EBS',
  rds: 'banco RDS',
  'fsx-windows': 'FSx for Windows File Server',
  s3: 'bucket S3',
}

export const FREQUENCY_LABEL: Record<Frequency, string> = {
  continuous: 'Contínuo (PITR)',
  hourly: 'A cada hora',
  '12h': 'A cada 12 horas',
  daily: 'Diário',
  weekly: 'Semanal',
  monthly: 'Mensal',
}

/** Intervalo entre snapshots, em horas (o contínuo permite voltar a qualquer momento). */
export const FREQUENCY_HOURS: Record<Frequency, number> = { continuous: 0, hourly: 1, '12h': 12, daily: 24, weekly: 168, monthly: 720 }

export const COPY_LABEL: Record<CopyTarget, string> = {
  none: 'Sem cópia',
  region: 'Cópia em outra Região',
  account: 'Cópia em outra conta',
  both: 'Cópia em outra conta e outra Região',
}

export const LOCK_LABEL: Record<LockMode, string> = { none: 'Sem Vault Lock', governance: 'Vault Lock em governança', compliance: 'Vault Lock em conformidade' }

const SUPPORTS = {
  continuous: ['rds', 's3'] as BackupResource[],
  cold: ['efs', 'ebs'] as BackupResource[],
}

export interface BackupPlan {
  resource: BackupResource
  frequency: Frequency
  retentionDays: number
  /** Dias até mover para o armazenamento frio; ausente = fica no quente. */
  coldAfterDays?: number
  copy: CopyTarget
  lock: LockMode
}

/** O plano é aceito? Devolve o motivo da recusa. */
export function planProblem(p: BackupPlan): string | null {
  if (p.frequency === 'continuous') {
    if (!SUPPORTS.continuous.includes(p.resource)) return `O backup contínuo não existe para ${RESOURCE_LABEL[p.resource]}.`
    if (p.retentionDays > 35) return 'O backup contínuo guarda no máximo 35 dias.'
    if (p.coldAfterDays !== undefined) return 'O backup contínuo não vai para o armazenamento frio.'
  }
  if (p.coldAfterDays !== undefined) {
    if (!SUPPORTS.cold.includes(p.resource)) return `O armazenamento frio não existe para ${RESOURCE_LABEL[p.resource]}.`
    if (p.resource === 'ebs' && p.frequency !== 'monthly') return 'No EBS, o frio usa o EBS Snapshot Archive, só para backups mensais ou menos frequentes.'
    if (p.retentionDays < p.coldAfterDays + 90) return `No frio, o backup fica no mínimo 90 dias: a retenção precisa ser de pelo menos ${p.coldAfterDays + 90} dias.`
  }
  return null
}

export type Disaster = 'source-deleted' | 'region-outage' | 'admin-deletes-backups' | 'account-compromised'

export const DISASTER_LABEL: Record<Disaster, string> = {
  'source-deleted': 'alguém apaga o recurso de origem',
  'region-outage': 'a Região inteira fica fora',
  'admin-deletes-backups': 'um administrador da conta tenta apagar os backups',
  'account-compromised': 'um invasor com acesso total à conta apaga tudo o que encontra',
}

/** Os backups sobrevivem ao desastre? */
export function survives(p: BackupPlan, d: Disaster): { ok: boolean; why: string } {
  const otherAccount = p.copy === 'account' || p.copy === 'both'
  const otherRegion = p.copy === 'region' || p.copy === 'both'
  switch (d) {
    case 'source-deleted':
      return { ok: true, why: 'Os backups ficam no cofre, separados da origem, e seguem a própria retenção.' }
    case 'region-outage':
      return otherRegion ? { ok: true, why: 'A cópia em outra Região continua disponível para restaurar.' } : { ok: false, why: 'Todos os backups estão na mesma Região que ficou fora.' }
    case 'admin-deletes-backups':
      if (p.lock === 'compliance') return { ok: true, why: 'No modo conformidade, ninguém apaga os backups antes do fim da retenção.' }
      if (otherAccount) return { ok: true, why: 'A cópia na outra conta fica fora do alcance do administrador desta conta.' }
      return { ok: false, why: p.lock === 'governance' ? 'No modo governança, quem tem a permissão remove a trava e apaga os backups.' : 'Sem trava e sem cópia em outra conta, o administrador apaga os backups.' }
    case 'account-compromised':
      if (otherAccount) return { ok: true, why: 'A cópia na outra conta não é alcançada por quem invadiu esta conta.' }
      if (p.lock === 'compliance') return { ok: true, why: 'No modo conformidade, nem a conta raiz apaga os backups antes do fim da retenção.' }
      return { ok: false, why: 'Com acesso total à conta, o invasor apaga os backups.' }
  }
}

/** Custo mensal do armazenamento dos backups de um EFS, com `storedGB` guardados no total (premissa). */
export function efsBackupMonthly(p: BackupPlan, storedGB: number, prices: FilesRegionPrices['backup']) {
  const coldShare = p.coldAfterDays === undefined ? 0 : Math.max(0, (p.retentionDays - p.coldAfterDays) / p.retentionDays)
  const copies = p.copy === 'none' ? 1 : 2
  const perCopy = storedGB * (1 - coldShare) * prices.efsWarm + storedGB * coldShare * prices.efsCold
  return Math.round(perCopy * copies * 100) / 100
}
