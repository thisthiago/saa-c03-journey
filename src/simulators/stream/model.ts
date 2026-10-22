/**
 * Simulador de capacidade do Amazon Kinesis Data Streams no modo
 * provisionado: quantos shards um fluxo precisa e o que a chave de partição
 * faz com eles.
 *
 * Conferido em 22/10/2026:
 * - Cada shard aceita até 1 MB/s ou 1.000 registros por segundo de escrita e
 *   entrega até 2 MB/s de leitura; a chave de partição passa por um hash MD5
 *   que decide o shard
 *   (https://docs.aws.amazon.com/streams/latest/dev/key-concepts.html,
 *   https://docs.aws.amazon.com/streams/latest/dev/service-sizes-and-limits.html).
 * - Na leitura compartilhada, os 2 MB/s do shard são divididos entre os
 *   consumidores; com enhanced fan-out, cada consumidor registrado tem os
 *   próprios 2 MB/s por shard, com latência típica de cerca de 70 ms contra
 *   cerca de 200 ms
 *   (https://docs.aws.amazon.com/streams/latest/dev/enhanced-consumers.html).
 *
 * Simplificação: os dados se espalham por igual entre os shards, exceto a
 * chave quente; o limite de 5 leituras por segundo do shard não entra.
 */

export type ReadMode = 'shared' | 'efo'

export interface StreamLoad {
  /** Escrita total (MB/s). */
  writeMBps: number
  /** Registros por segundo. */
  recordsPerSec: number
  /** Aplicações que leem o fluxo inteiro. */
  consumers: number
}

export const SHARD = { writeMBps: 1, writeRecords: 1000, readMBps: 2 }

export interface ShardNeed {
  shards: number
  /** O que decide o número de shards. */
  limit: 'write-mb' | 'write-records' | 'read'
}

/** Shards necessários para escrita e leitura. */
export function shardsNeeded(l: StreamLoad, mode: ReadMode): ShardNeed {
  const byMb = l.writeMBps / SHARD.writeMBps
  const byRecords = l.recordsPerSec / SHARD.writeRecords
  // Cada consumidor lê tudo o que é escrito.
  const byRead = mode === 'shared' ? (l.writeMBps * l.consumers) / SHARD.readMBps : l.writeMBps / SHARD.readMBps
  const max = Math.max(byMb, byRecords, byRead)
  const limit = max === byRead && byRead > Math.max(byMb, byRecords) ? 'read' : byRecords > byMb ? 'write-records' : 'write-mb'
  return { shards: Math.max(1, Math.ceil(max - 1e-9)), limit }
}

export const LIMIT_LABEL: Record<ShardNeed['limit'], string> = {
  'write-mb': 'o volume de escrita (1 MB/s por shard)',
  'write-records': 'o número de registros (1.000 por segundo por shard)',
  read: 'a leitura compartilhada (2 MB/s por shard divididos entre os consumidores)',
}

/** Uma chave quente: a fração do tráfego que vai para uma só chave cai inteira num shard. */
export function hotShard(writeMBps: number, hotKeyShare: number) {
  const mb = writeMBps * hotKeyShare
  return { mbps: mb, overloaded: mb > SHARD.writeMBps }
}
