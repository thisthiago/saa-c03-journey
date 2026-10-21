/**
 * Custo mensal de um cluster do Aurora PostgreSQL nas configurações de
 * armazenamento Standard e I/O-Optimized, e de capacidade serverless.
 *
 * Fatos conferidos em 21/10/2026:
 * - Standard cobra E/S por milhão de requisições; I/O-Optimized não cobra E/S e custa mais na
 *   instância e no armazenamento. A AWS indica o I/O-Optimized quando a E/S passa de 25% do gasto
 *   com o Aurora; dá para trocar de Standard para I/O-Optimized uma vez a cada 30 dias:
 *   https://docs.aws.amazon.com/AmazonRDS/latest/AuroraUserGuide/Aurora.Overview.StorageReliability.html
 * - Aurora serverless: capacidade em ACUs (cerca de 2 GiB de memória cada), de 0 a 256, cobrada
 *   por ACU-hora: https://docs.aws.amazon.com/AmazonRDS/latest/AuroraUserGuide/aurora-serverless-v2.how-it-works.html
 */
import { HOURS_PER_MONTH } from '../compute-prices'
import { databasePrices } from '../database-prices'

export type AuroraStorageConfig = 'standard' | 'io-optimized'

export const STORAGE_CONFIG_LABEL: Record<AuroraStorageConfig, string> = { standard: 'Aurora Standard', 'io-optimized': 'Aurora I/O-Optimized' }

/** Fração do gasto com E/S a partir da qual a AWS indica o I/O-Optimized. */
export const IO_OPTIMIZED_THRESHOLD = 0.25

export interface AuroraCluster {
  cls: string
  /** Escritora mais leitoras. */
  instances: number
  storageGB: number
  /** Milhões de requisições de E/S por mês. */
  ioMillions: number
}

export interface AuroraCost {
  instances: number
  storage: number
  io: number
  total: number
}

export function auroraMonthly(c: AuroraCluster, config: AuroraStorageConfig, region?: string): AuroraCost {
  const p = databasePrices(region).aurora
  const cls = p.instances[c.cls]
  if (!cls) throw new Error(`Classe fora da tabela do Aurora: ${c.cls}`)
  const rates = config === 'standard' ? p.standard : p.ioOptimized
  const instances = c.instances * (config === 'standard' ? cls.standardHour : cls.ioOptimizedHour) * HOURS_PER_MONTH
  const storage = c.storageGB * rates.storageGBMonth
  const io = c.ioMillions * rates.ioPerMillion
  return { instances, storage, io, total: instances + storage + io }
}

export function cheaperStorageConfig(c: AuroraCluster, region?: string): AuroraStorageConfig {
  return auroraMonthly(c, 'io-optimized', region).total < auroraMonthly(c, 'standard', region).total ? 'io-optimized' : 'standard'
}

/** Parte do gasto do Standard que é E/S. */
export function ioShare(c: AuroraCluster, region?: string): number {
  const s = auroraMonthly(c, 'standard', region)
  return s.io / s.total
}

/** Custo mensal de capacidade serverless: ACU-hora multiplicada pelas horas em cada nível de uso. */
export function serverlessMonthly(acuHours: number, config: AuroraStorageConfig = 'standard', region?: string): number {
  const p = databasePrices(region).aurora
  return acuHours * (config === 'standard' ? p.standard.serverlessV2AcuHour : p.ioOptimized.serverlessV2AcuHour)
}
