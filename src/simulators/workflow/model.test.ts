import { describe, expect, it } from 'vitest'
import { evaluateWorkflowLab, workflowSolution, type WorkflowLabConfig } from './lab'
import { runTask } from './model'

describe('Retry e Catch do Step Functions', () => {
  it('sem Retry nem Catch, qualquer erro faz a execução falhar', () => {
    expect(runTask({ transientFailures: 1 }, { maxAttempts: 0, catchAll: false }).outcome).toBe('failed')
  })

  it('Retry cobre erro passageiro, com espera que dobra', () => {
    const r = runTask({ transientFailures: 2 }, { maxAttempts: 3, catchAll: false })
    expect(r.outcome).toBe('succeeded')
    expect(r.attempts).toBe(3)
    expect(r.waitedSec).toBe(1 + 2)
  })

  it('erro permanente: o Catch desvia para a compensação', () => {
    expect(runTask({ transientFailures: 0, permanent: true }, { maxAttempts: 3, catchAll: true }).outcome).toBe('caught')
    expect(runTask({ transientFailures: 0, permanent: true }, { maxAttempts: 3, catchAll: false }).outcome).toBe('failed')
  })
})

describe('laboratório do fluxo', () => {
  const config: WorkflowLabConfig = {
    retryOptions: [0, 2, 5],
    steps: [
      { id: 'pagamento', label: 'Cobrar', transientFailures: 2, need: 'Se não der, estornar a reserva.', compensate: true },
      { id: 'cartao', label: 'Validar cartão', transientFailures: 0, permanent: true, need: 'Cartão recusado cancela o pedido.', compensate: true },
      { id: 'relatorio', label: 'Relatório', transientFailures: 4, need: 'Se falhar, avisar no alarme.', compensate: false },
    ],
  }
  it('a solução calculada leva 100%', () => {
    expect(workflowSolution(config).answers).toEqual({ pagamento: { retry: '2', catch: 'all' }, cartao: { retry: '0', catch: 'all' }, relatorio: { retry: '5', catch: 'none' } })
    expect(evaluateWorkflowLab(config, workflowSolution(config)).score).toBe(1)
  })
})
