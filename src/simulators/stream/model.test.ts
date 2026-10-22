import { describe, expect, it } from 'vitest'
import { evaluateStreamLab, streamSolution, type StreamLabConfig } from './lab'
import { hotShard, shardsNeeded } from './model'

describe('shards do Kinesis Data Streams', () => {
  it('a escrita em MB/s ou em registros decide', () => {
    expect(shardsNeeded({ writeMBps: 3.5, recordsPerSec: 2000, consumers: 1 }, 'shared')).toEqual({ shards: 4, limit: 'write-mb' })
    expect(shardsNeeded({ writeMBps: 1, recordsPerSec: 5000, consumers: 1 }, 'shared')).toEqual({ shards: 5, limit: 'write-records' })
  })

  it('leitura compartilhada por muitos consumidores pede mais shards; enhanced fan-out não', () => {
    expect(shardsNeeded({ writeMBps: 2, recordsPerSec: 1000, consumers: 4 }, 'shared')).toEqual({ shards: 4, limit: 'read' })
    expect(shardsNeeded({ writeMBps: 2, recordsPerSec: 1000, consumers: 4 }, 'efo').shards).toBe(2)
  })

  it('chave quente sobrecarrega um shard, não importa quantos existam', () => {
    expect(hotShard(4, 0.4).overloaded).toBe(true)
    expect(hotShard(4, 0.1).overloaded).toBe(false)
  })
})

describe('laboratório dos fluxos', () => {
  const config: StreamLabConfig = {
    shardOptions: [1, 2, 4, 8, 16],
    streams: [
      { id: 'cliques', label: 'Cliques', writeMBps: 3, recordsPerSec: 2500, consumers: 1, lowLatency: false },
      { id: 'telemetria', label: 'Telemetria', writeMBps: 2, recordsPerSec: 1500, consumers: 5, lowLatency: true },
    ],
  }
  it('a solução calculada leva 100%', () => {
    expect(streamSolution(config).answers).toEqual({ cliques: { read: 'shared', shards: '4' }, telemetria: { read: 'efo', shards: '2' } })
    expect(evaluateStreamLab(config, streamSolution(config)).score).toBe(1)
  })
})
