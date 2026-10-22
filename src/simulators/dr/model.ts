/**
 * Estratégias de recuperação de desastres entre Regiões: quanto dado se perde
 * (RPO), quanto tempo até voltar (RTO) e quanto custa manter a Região de
 * recuperação.
 *
 * Conferido em 22/10/2026
 * (https://docs.aws.amazon.com/wellarchitected/latest/reliability-pillar/rel_planning_for_recovery_disaster_recovery.html
 * e https://docs.aws.amazon.com/whitepapers/latest/disaster-recovery-workloads-on-aws/disaster-recovery-options-in-the-cloud.html):
 * - em ordem crescente de custo e complexidade, e decrescente de RPO e RTO:
 *   backup e restauração (RPO em horas, RTO de até 24 horas), pilot light
 *   (RPO em minutos, RTO em dezenas de minutos), warm standby (RPO em
 *   segundos, RTO em minutos) e ativo-ativo em várias Regiões (RPO perto de
 *   zero, RTO potencialmente zero);
 * - no pilot light, bancos e armazenamento ficam ligados e replicando, e os
 *   servidores de aplicação não são implantados até a recuperação; no warm
 *   standby, uma cópia reduzida e funcional já atende; no ativo-ativo, todas
 *   as Regiões atendem tráfego;
 * - evitar uma estratégia mais rígida do que a meta pede, porque custa mais.
 *
 * Premissas do cenário: os números de RPO e RTO de cada estratégia (o pior
 * caso de cada faixa), o tamanho reduzido do warm standby (um quarto da frota)
 * e o custo da Região de recuperação, calculado só com instâncias, banco e
 * armazenamento dos backups, nas tabelas da AWS Price List de us-east-1.
 */
import { HOURS_PER_MONTH, instancePrice } from '../compute-prices'
import { databasePrices } from '../database-prices'

export type Strategy = 'backup-restore' | 'pilot-light' | 'warm-standby' | 'multi-site'
export type StandbyServers = 'none' | 'off' | 'reduced' | 'full'

export const STRATEGIES: Strategy[] = ['backup-restore', 'pilot-light', 'warm-standby', 'multi-site']

export const STRATEGY_LABEL: Record<Strategy, string> = {
  'backup-restore': 'Backup e restauração',
  'pilot-light': 'Pilot light',
  'warm-standby': 'Warm standby',
  'multi-site': 'Ativo-ativo em várias Regiões',
}

export const SERVERS_LABEL: Record<StandbyServers, string> = {
  none: 'Nada implantado: tudo é recriado pela infraestrutura como código',
  off: 'Banco replicando; servidores de aplicação ainda não implantados',
  reduced: 'Cópia reduzida e funcional, já atendendo',
  full: 'Capacidade total, atendendo tráfego o tempo todo',
}

export const STRATEGY_SERVERS: Record<Strategy, StandbyServers> = {
  'backup-restore': 'none',
  'pilot-light': 'off',
  'warm-standby': 'reduced',
  'multi-site': 'full',
}

/** Pior caso de cada faixa, em minutos (premissa do cenário a partir das faixas da AWS). */
export const STRATEGY_TARGETS: Record<Strategy, { rpoMin: number; rtoMin: number; range: string }> = {
  'backup-restore': { rpoMin: 24 * 60, rtoMin: 24 * 60, range: 'RPO em horas e RTO de até 24 horas' },
  'pilot-light': { rpoMin: 15, rtoMin: 60, range: 'RPO em minutos e RTO em dezenas de minutos' },
  'warm-standby': { rpoMin: 1, rtoMin: 15, range: 'RPO em segundos e RTO em minutos' },
  'multi-site': { rpoMin: 0, rtoMin: 0, range: 'RPO perto de zero e RTO potencialmente zero' },
}

/** Fração da frota mantida ligada no warm standby (premissa). */
export const WARM_FRACTION = 0.25

export interface DrWorkload {
  /** Instâncias da aplicação na Região principal. */
  instanceType: string
  instances: number
  /** Classe do banco RDS (PostgreSQL) que a réplica usa. */
  dbClass: string
  /** GB de dados (banco e backups). */
  dataGB: number
}

/** A estratégia cumpre as metas? */
export const meets = (s: Strategy, rpoMin: number, rtoMin: number) => STRATEGY_TARGETS[s].rpoMin <= rpoMin && STRATEGY_TARGETS[s].rtoMin <= rtoMin

/** Estratégia mais barata que cumpre o RPO e o RTO. */
export function cheapestStrategy(rpoMin: number, rtoMin: number): Strategy {
  const s = STRATEGIES.find((x) => meets(x, rpoMin, rtoMin))
  if (!s) throw new Error('Nenhuma estratégia cumpre as metas')
  return s
}

/** Custo mensal da Região de recuperação, em dólares. */
export function standbyMonthly(s: Strategy, w: DrWorkload, region?: string): number {
  const db = databasePrices(region).rds
  const ec2 = instancePrice(w.instanceType, region).onDemandHour
  const backups = w.dataGB * db.backupGBMonth
  const replica = (db.instances[w.dbClass]?.singleAzHour ?? NaN) * HOURS_PER_MONTH + w.dataGB * db.storage.gp3.singleAzGBMonth
  if (Number.isNaN(replica)) throw new Error(`Classe de banco fora da tabela: ${w.dbClass}`)
  const fleet = (n: number) => n * ec2 * HOURS_PER_MONTH
  const total = {
    'backup-restore': backups,
    'pilot-light': backups + replica,
    'warm-standby': backups + replica + fleet(Math.max(1, Math.ceil(w.instances * WARM_FRACTION))),
    'multi-site': backups + replica + fleet(w.instances),
  }[s]
  return Math.round(total * 100) / 100
}

export const minutesText = (m: number) => (m === 0 ? 'zero' : m < 60 ? `${m} ${m === 1 ? 'minuto' : 'minutos'}` : m % 1440 === 0 ? `${m / 1440} ${m === 1440 ? 'dia' : 'dias'}` : m % 60 === 0 ? `${m / 60} ${m === 60 ? 'hora' : 'horas'}` : `${m} minutos`)
