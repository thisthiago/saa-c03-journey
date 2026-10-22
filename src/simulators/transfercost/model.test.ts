import { describe, expect, it } from 'vitest'
import { evaluateTransferCostLab, transferCostSolution, type TransferCostLabConfig } from './lab'
import { cheapestPath, monthlyCost, perGB } from './model'

describe('custo por caminho', () => {
  it('mesma AZ, endpoint de gateway e entrada da internet não pagam por GB', () => {
    expect(perGB('same-az')).toBe(0)
    expect(perGB('gateway-endpoint')).toBe(0)
    expect(perGB('internet-in')).toBe(0)
  })
  it('entre AZs paga nos dois sentidos', () => {
    expect(perGB('cross-az')).toBeCloseTo(0.02)
  })
  it('o CloudFront sai mais barato que a internet direta', () => {
    expect(perGB('cloudfront')).toBeLessThan(perGB('internet-out'))
  })
  it('para o S3, o endpoint de gateway vence o NAT', () => {
    expect(cheapestPath(['nat-to-s3', 'gateway-endpoint'], 5000)).toBe('gateway-endpoint')
  })
  it('com pouco tráfego, o endpoint de interface novo não compensa a hora', () => {
    expect(cheapestPath(['nat-to-service', 'interface-endpoint'], 100)).toBe('nat-to-service')
    expect(cheapestPath(['nat-to-service', 'interface-endpoint'], 20000)).toBe('interface-endpoint')
    expect(monthlyCost('interface-endpoint', 0)).toBeGreaterThan(0)
  })
  it('Região de destino desconhecida falha', () => {
    expect(() => perGB('cross-region', 'xx-east-9')).toThrow()
  })
})

describe('laboratório de transferência', () => {
  const c: TransferCostLabConfig = {
    flows: [
      { id: 'a', label: 'A', detail: 'Logs no S3.', gbPerMonth: 3000, current: 'nat-to-s3', alternatives: ['gateway-endpoint'] },
      { id: 'b', label: 'B', detail: 'Réplica.', gbPerMonth: 100, current: 'cross-region', alternatives: [] },
    ],
  }
  it('a solução chega a 100% e o vazio fica em 0', () => {
    expect(evaluateTransferCostLab(c, transferCostSolution(c)).score).toBe(1)
    expect(evaluateTransferCostLab(c, { answers: {} }).score).toBe(0)
  })
})
