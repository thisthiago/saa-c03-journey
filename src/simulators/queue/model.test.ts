import { describe, expect, it } from 'vitest'
import { evaluateQueueLab, queueSolution, type QueueLabConfig } from './lab'
import { fifoAccept, minVisibility, runMessage } from './model'

const DAY = 86_400

describe('fila padrão do SQS', () => {
  it('processada dentro da visibilidade: uma vez', () => {
    expect(runMessage({ processSec: 20, visibilitySec: 30, attempts: ['ok'], retentionSec: 4 * DAY }).outcome).toBe('processed')
  })

  it('processamento mais longo que a visibilidade: entrega em dobro', () => {
    expect(runMessage({ processSec: 45, visibilitySec: 30, attempts: ['ok'], retentionSec: 4 * DAY }).outcome).toBe('duplicated')
  })

  it('mensagem que sempre falha vai para a DLQ depois de maxReceiveCount recebimentos', () => {
    const r = runMessage({ processSec: 5, visibilitySec: 30, attempts: ['fail'], maxReceiveCount: 3, retentionSec: 4 * DAY })
    expect(r.outcome).toBe('dlq')
    expect(r.receives).toBe(3)
  })

  it('sem DLQ, a mensagem com defeito volta até o fim da retenção', () => {
    expect(runMessage({ processSec: 5, visibilitySec: 30, attempts: ['fail'], retentionSec: 600 }).outcome).toBe('expired')
  })

  it('maxReceiveCount baixo manda para a DLQ a mensagem que daria certo', () => {
    expect(runMessage({ processSec: 5, visibilitySec: 30, attempts: ['fail', 'fail', 'ok'], maxReceiveCount: 2, retentionSec: DAY }).outcome).toBe('dlq')
    expect(runMessage({ processSec: 5, visibilitySec: 30, attempts: ['fail', 'fail', 'ok'], maxReceiveCount: 3, retentionSec: DAY }).outcome).toBe('processed')
  })

  it('com Lambda, a visibilidade mínima é seis vezes o tempo limite', () => {
    expect(minVisibility(10, 30)).toBe(180)
    expect(minVisibility(10)).toBe(10)
  })
})

describe('fila FIFO', () => {
  it('descarta repetidas dentro de 5 minutos e mantém a ordem de cada grupo', () => {
    const r = fifoAccept([
      { id: 'a1', group: 'pedido-1', dedupId: 'x', atSec: 0 },
      { id: 'b1', group: 'pedido-2', dedupId: 'y', atSec: 1 },
      { id: 'a1-de-novo', group: 'pedido-1', dedupId: 'x', atSec: 60 },
      { id: 'a2', group: 'pedido-1', dedupId: 'z', atSec: 70 },
      { id: 'a1-tarde', group: 'pedido-1', dedupId: 'x', atSec: 400 },
    ])
    expect(r.dropped).toEqual(['a1-de-novo'])
    expect(r.byGroup['pedido-1']).toEqual(['a1', 'a2', 'a1-tarde'])
  })
})

describe('laboratório das filas', () => {
  const config: QueueLabConfig = {
    visibilityOptions: [30, 60, 180, 900],
    dlqOptions: [1, 3, 5],
    retentionSec: 4 * DAY,
    consumers: [
      { id: 'notas', label: 'Notas fiscais', processSec: 40, transientFailures: 2 },
      { id: 'fotos', label: 'Fotos', processSec: 10, lambdaTimeoutSec: 30, transientFailures: 1 },
    ],
  }
  it('a solução calculada leva 100%', () => {
    expect(evaluateQueueLab(config, queueSolution(config)).score).toBe(1)
    expect(queueSolution(config).answers.notas).toEqual({ visibility: '60', dlq: '3' })
    expect(queueSolution(config).answers.fotos).toEqual({ visibility: '180', dlq: '5' })
  })
})
