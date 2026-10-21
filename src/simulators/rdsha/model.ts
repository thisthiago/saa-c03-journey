/**
 * Alta disponibilidade e recuperação de um banco do RDS: implantação
 * (Single-AZ, Multi-AZ com um standby ou cluster Multi-AZ com dois leitores),
 * réplicas de leitura, réplica em outra Região, retenção de backup e RDS Proxy,
 * diante da falha de uma instância, de uma AZ, de uma Região ou de um apagamento
 * por engano.
 *
 * Fatos conferidos em 21/10/2026:
 * - Multi-AZ com um standby síncrono que não atende leituras; failover em geral de 60 a 120 s,
 *   com troca do DNS: https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/Concepts.MultiAZ.Failover.html
 * - Cluster Multi-AZ: um escritor e dois leitores em três AZs, replicação semissíncrona (o commit
 *   espera pelo menos um leitor), failover em geral abaixo de 35 s:
 *   https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/multi-az-db-clusters-concepts.html
 * - Réplicas de leitura assíncronas, até 15 por primária, promoção manual com reboot, em outra
 *   Região inclusive: https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/USER_ReadRepl.html
 * - Backup automático de 0 a 35 dias (0 desliga); logs enviados ao S3 a cada 5 minutos; a
 *   restauração cria uma instância nova:
 *   https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/USER_WorkingWithAutomatedBackups.BackupRetention.html
 *   https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/USER_PIT.html
 * - Réplicas são cobradas como instâncias comuns: https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/USER_ReadRepl.html
 * - RDS Proxy: pool de conexões, só na mesma VPC: https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/rds-proxy.html
 *
 * Premissas do cenário: tempos de promoção de réplica, de restauração e de
 * recuperação de uma instância Single-AZ, e o custo do cluster Multi-AZ
 * (três instâncias da mesma classe; a AWS cobra classes próprias para ele).
 */
import { HOURS_PER_MONTH } from '../compute-prices'
import { databasePrices } from '../database-prices'

export type HaDeployment = 'single-az' | 'multi-az-instance' | 'multi-az-cluster'
export type Failure = 'instance' | 'az' | 'region' | 'delete'
export type Loss = 'none' | 'seconds' | 'minutes' | 'total'

export interface Topology {
  deployment: HaDeployment
  /** Réplicas de leitura na mesma Região, em outras AZs. */
  replicas: number
  crossRegionReplica: boolean
  /** Dias de retenção do backup automático (0 desliga). */
  backupDays: number
  proxy: boolean
}

export const DEPLOYMENT_NAME: Record<HaDeployment, string> = {
  'single-az': 'Single-AZ',
  'multi-az-instance': 'Multi-AZ com um standby',
  'multi-az-cluster': 'Cluster Multi-AZ (dois leitores)',
}

export const FAILURE_LABEL: Record<Failure, string> = {
  instance: 'falha da instância principal',
  az: 'perda da AZ da instância principal',
  region: 'perda da Região inteira',
  delete: 'tabela apagada por engano',
}

export const LOSS_LABEL: Record<Loss, string> = {
  none: 'nenhum dado perdido',
  seconds: 'perde os últimos segundos (atraso da réplica)',
  minutes: 'perde até 5 minutos',
  total: 'sem cópia para recuperar',
}

const LOSS_ORDER: Loss[] = ['none', 'seconds', 'minutes', 'total']
export const lossAtMost = (l: Loss, max: Loss) => LOSS_ORDER.indexOf(l) <= LOSS_ORDER.indexOf(max)

/** Tempos em segundos. Os failovers são fatos (limite superior típico); o resto é premissa do cenário. */
export const TIMES = {
  multiAzFailover: 120,
  clusterFailover: 35,
  singleAzRecovery: 900,
  replicaPromotion: 600,
  restore: 1800,
} as const

export const BACKUP_OPTIONS = [0, 1, 7, 14, 35]
export const MAX_REPLICAS = 15

export interface FailureResult {
  recovery: 'automatic' | 'manual' | 'none'
  /** Segundos até voltar a aceitar escritas (Infinity = não volta enquanto a falha durar). */
  downtime: number
  loss: Loss
  how: string
}

export function simulateFailure(t: Topology, f: Failure): FailureResult {
  const backups = t.backupDays > 0
  const restore: FailureResult = backups
    ? { recovery: 'manual', downtime: TIMES.restore, loss: 'minutes', how: 'restaurar o backup automático numa instância nova; os logs vão para o S3 a cada 5 minutos' }
    : { recovery: 'none', downtime: Infinity, loss: 'total', how: 'sem backup automático, não há de onde restaurar' }
  const promote: FailureResult = { recovery: 'manual', downtime: TIMES.replicaPromotion, loss: 'seconds', how: 'promover uma réplica de leitura (assíncrona) e apontar a aplicação para ela' }
  switch (f) {
    case 'instance':
    case 'az': {
      if (t.deployment === 'multi-az-instance') return { recovery: 'automatic', downtime: TIMES.multiAzFailover, loss: 'none', how: 'failover automático para o standby síncrono em outra AZ; o DNS do endpoint passa a apontar para ele' }
      if (t.deployment === 'multi-az-cluster') return { recovery: 'automatic', downtime: TIMES.clusterFailover, loss: 'none', how: 'failover automático para o leitor mais atualizado; o commit só acontece depois que um leitor confirma' }
      if (f === 'instance') return { recovery: 'automatic', downtime: TIMES.singleAzRecovery, loss: 'none', how: 'o RDS detecta a falha e recupera a instância; o volume EBS continua com os dados' }
      if (t.replicas > 0) return promote
      return restore
    }
    case 'region':
      if (t.crossRegionReplica) return { ...promote, how: 'promover a réplica na outra Região e apontar a aplicação para ela' }
      return { recovery: 'none', downtime: Infinity, loss: 'total', how: 'nenhuma cópia fora da Região: o banco fica indisponível até a Região voltar' }
    case 'delete':
      // Standby e réplicas recebem o apagamento junto com a primária: só o backup volta no tempo.
      if (backups) return { recovery: 'manual', downtime: TIMES.restore, loss: 'none', how: 'restaurar para um ponto no tempo logo antes do apagamento, numa instância nova; standby e réplicas já tinham replicado o apagamento' }
      return { recovery: 'none', downtime: Infinity, loss: 'total', how: 'standby e réplicas copiaram o apagamento, e sem backup automático não há ponto no tempo para voltar' }
  }
}

/** Instâncias que atendem leituras na Região, além da principal (o standby do Multi-AZ não atende). */
export function readers(t: Topology): number {
  return t.replicas + (t.deployment === 'multi-az-cluster' ? 2 : 0)
}

export function validateTopology(t: Topology): string[] {
  const errors: string[] = []
  if (!Number.isInteger(t.replicas) || t.replicas < 0 || t.replicas > MAX_REPLICAS) errors.push(`de 0 a ${MAX_REPLICAS} réplicas de leitura por primária`)
  if (!(t.backupDays >= 0 && t.backupDays <= 35)) errors.push('retenção do backup de 0 a 35 dias')
  if (t.backupDays === 0 && (t.replicas > 0 || t.crossRegionReplica)) errors.push('réplicas de leitura exigem o backup automático ligado na primária')
  if (t.deployment === 'multi-az-cluster' && t.backupDays === 0) errors.push('o cluster Multi-AZ exige de 1 a 35 dias de retenção')
  return errors
}

export interface HaCost {
  instances: number
  proxy: number
  total: number
}

/** Custo mensal das instâncias (e do RDS Proxy) pela tabela de preços. */
export function haMonthly(t: Topology, cls: string, region?: string): HaCost {
  const p = databasePrices(region).rds
  const x = p.instances[cls]
  const main = t.deployment === 'single-az' ? x.singleAzHour : t.deployment === 'multi-az-instance' ? x.multiAzHour : x.singleAzHour * 3
  const replicas = (t.replicas + (t.crossRegionReplica ? 1 : 0)) * x.singleAzHour
  const instances = (main + replicas) * HOURS_PER_MONTH
  const proxy = t.proxy ? x.vcpu * p.proxyVcpuHour * HOURS_PER_MONTH : 0
  return { instances, proxy, total: instances + proxy }
}

export interface HaNeed {
  /** Falhas que o banco precisa aguentar, com perda e tempo máximos. */
  survive: { failure: Failure; maxLoss: Loss; maxDowntime: number }[]
  /** Leitores extras necessários para a carga de leitura. */
  minReaders: number
  /** Dias para trás que precisam ser restauráveis. */
  pitrDays: number
  /** Muitas conexões curtas e repentinas (ex.: funções Lambda). */
  connectionStorm?: boolean
}

export function haGaps(t: Topology, n: HaNeed): string[] {
  const gaps: string[] = []
  for (const s of n.survive) {
    const r = simulateFailure(t, s.failure)
    if (!lossAtMost(r.loss, s.maxLoss) || r.downtime > s.maxDowntime) gaps.push(`${FAILURE_LABEL[s.failure]}: ${r.how} (${LOSS_LABEL[r.loss]}${Number.isFinite(r.downtime) ? `, cerca de ${formatSeconds(r.downtime)} sem escritas` : ''})`)
  }
  if (readers(t) < n.minReaders) gaps.push(`a leitura pede ${n.minReaders} instância(s) além da principal e há ${readers(t)}`)
  if (t.backupDays < n.pitrDays) gaps.push(`é preciso restaurar até ${n.pitrDays} dias para trás e a retenção é de ${t.backupDays}`)
  if (n.connectionStorm && !t.proxy) gaps.push('picos de conexões curtas esgotam as conexões do banco sem um RDS Proxy')
  return gaps
}

export function formatSeconds(s: number): string {
  if (s < 60) return `${s} s`
  return `${Math.round(s / 60)} min`
}

/** Todas as topologias válidas exploradas pela busca. */
export function topologies(): Topology[] {
  const out: Topology[] = []
  for (const deployment of ['single-az', 'multi-az-instance', 'multi-az-cluster'] as HaDeployment[])
    for (let replicas = 0; replicas <= 3; replicas++)
      for (const crossRegionReplica of [false, true])
        for (const backupDays of BACKUP_OPTIONS)
          for (const proxy of [false, true]) {
            const t = { deployment, replicas, crossRegionReplica, backupDays, proxy }
            if (validateTopology(t).length === 0) out.push(t)
          }
  return out
}

/** A topologia mais barata que atende. A retenção não muda o custo das instâncias: vale a menor que atende. */
export function cheapestTopology(n: HaNeed, cls: string, region?: string): Topology {
  let best: { t: Topology; cost: number } | undefined
  for (const t of topologies()) {
    if (haGaps(t, n).length) continue
    const cost = haMonthly(t, cls, region).total
    if (!best || cost < best.cost - 1e-9 || (Math.abs(cost - best.cost) < 1e-9 && t.backupDays < best.t.backupDays)) best = { t, cost }
  }
  if (!best) throw new Error('Nenhuma topologia atende')
  return best.t
}

export function describeTopology(t: Topology): string {
  const parts = [DEPLOYMENT_NAME[t.deployment]]
  if (t.replicas) parts.push(`${t.replicas} réplica(s) de leitura`)
  if (t.crossRegionReplica) parts.push('réplica em outra Região')
  parts.push(t.backupDays ? `backup de ${t.backupDays} dia(s)` : 'sem backup automático')
  if (t.proxy) parts.push('RDS Proxy')
  return parts.join(', ')
}
