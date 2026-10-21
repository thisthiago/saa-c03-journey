/**
 * Capacidade do DynamoDB: unidades de leitura e escrita por operação, limite por
 * partição (partição quente) e custo mensal nos modos sob demanda e provisionado.
 *
 * Fatos conferidos em 21/10/2026:
 * - Leitura de até 4 KB: 1 unidade (forte), meia (eventual), 2 (transacional); tamanho
 *   arredondado para o próximo múltiplo de 4 KB. Escrita de até 1 KB: 1 unidade
 *   (2 na transacional), arredondada para o próximo múltiplo de 1 KB:
 *   https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/read-write-operations.html
 * - Exemplo da documentação: 80 leituras fortes de 3 KB por segundo pedem 80 RCU; 100 escritas
 *   de 512 bytes por segundo pedem 100 WCU:
 *   https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/provisioned-capacity-mode.html
 * - Cada partição entrega no máximo 3.000 unidades de leitura e 1.000 de escrita por segundo:
 *   https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/bp-partition-key-design.html
 * - Item de até 400 KB: https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/Constraints.html
 * - Sob demanda cobra por requisição; provisionado cobra a capacidade por hora, usada ou não:
 *   https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/on-demand-capacity-mode.html
 */
import { HOURS_PER_MONTH } from '../compute-prices'
import { databasePrices } from '../database-prices'

export type Consistency = 'eventual' | 'strong' | 'transactional'
export type CapacityMode = 'on-demand' | 'provisioned'

export const CONSISTENCY_LABEL: Record<Consistency, string> = { eventual: 'eventualmente consistente', strong: 'fortemente consistente', transactional: 'transacional' }
export const MODE_LABEL: Record<CapacityMode, string> = { 'on-demand': 'Sob demanda', provisioned: 'Provisionado' }

export const PARTITION_LIMIT = { read: 3000, write: 1000 } as const
export const MAX_ITEM_KB = 400
const SECONDS_PER_MONTH = HOURS_PER_MONTH * 3600

/** Unidades de leitura consumidas por uma leitura de um item. */
export function readUnits(itemKB: number, consistency: Consistency): number {
  const blocks = Math.ceil(itemKB / 4)
  return blocks * (consistency === 'eventual' ? 0.5 : consistency === 'strong' ? 1 : 2)
}

/** Unidades de escrita consumidas por uma escrita de um item. */
export function writeUnits(itemKB: number, transactional = false): number {
  return Math.ceil(itemKB) * (transactional ? 2 : 1)
}

export interface TableLoad {
  itemKB: number
  consistency: Consistency
  transactionalWrites?: boolean
  /** Requisições por segundo no pico e na média do mês. */
  peakReads: number
  peakWrites: number
  avgReads: number
  avgWrites: number
}

/** Capacidade necessária no pico (o que um modo provisionado precisa ter). */
export function neededCapacity(l: TableLoad): { rcu: number; wcu: number } {
  return { rcu: Math.ceil(l.peakReads * readUnits(l.itemKB, l.consistency)), wcu: Math.ceil(l.peakWrites * writeUnits(l.itemKB, l.transactionalWrites)) }
}

export interface DdbCost {
  reads: number
  writes: number
  total: number
}

/** Custo mensal sob demanda: paga cada requisição feita no mês, pela média. */
export function onDemandMonthly(l: TableLoad, region?: string): DdbCost {
  const p = databasePrices(region).dynamodb.onDemand
  const reads = (l.avgReads * readUnits(l.itemKB, l.consistency) * SECONDS_PER_MONTH * p.readPerMillion) / 1e6
  const writes = (l.avgWrites * writeUnits(l.itemKB, l.transactionalWrites) * SECONDS_PER_MONTH * p.writePerMillion) / 1e6
  return { reads, writes, total: reads + writes }
}

/** Custo mensal provisionado: paga a capacidade reservada o mês inteiro. */
export function provisionedMonthly(rcu: number, wcu: number, region?: string): DdbCost {
  const p = databasePrices(region).dynamodb.provisioned
  const reads = rcu * p.rcuHour * HOURS_PER_MONTH
  const writes = wcu * p.wcuHour * HOURS_PER_MONTH
  return { reads, writes, total: reads + writes }
}

/** Modo mais barato para a carga (provisionado sem folga, cobrindo o pico). */
export function cheaperMode(l: TableLoad, region?: string): CapacityMode {
  const n = neededCapacity(l)
  return provisionedMonthly(n.rcu, n.wcu, region).total < onDemandMonthly(l, region).total ? 'provisioned' : 'on-demand'
}

export interface KeyValue {
  value: string
  /** Fração do tráfego que vai para esse valor da chave (0–1). */
  share: number
}

export interface HotResult {
  throttled: boolean
  /** Unidades por segundo no valor mais acessado. */
  hottest: { value: string; units: number }
  limit: number
}

/**
 * O valor da chave de partição decide a partição (por hash), e cada partição tem limite próprio.
 * Simplificação: todo o tráfego de um valor cai numa só partição (a divisão automática de
 * coleções de itens fica de fora).
 */
export function hotPartition(keys: KeyValue[], perSecond: number, unitsPerOp: number, op: 'read' | 'write'): HotResult {
  const hottest = keys.reduce((a, b) => (b.share > a.share ? b : a))
  const units = hottest.share * perSecond * unitsPerOp
  const limit = PARTITION_LIMIT[op]
  return { throttled: units > limit, hottest: { value: hottest.value, units }, limit }
}
