import { describe, expect, it } from 'vitest'
import { evaluateResponsibilityLab, responsibilitySolution } from './lab'
import { SRM_MATRIX } from './model'

describe('responsabilidade compartilhada', () => {
  it('quanto mais abstrato o serviço, menos camadas ficam com o cliente', () => {
    // Cliente = 1, compartilhado = 0,5.
    const customerLayers = (sv: 'ec2' | 'rds' | 'lambda' | 's3') => Object.values(SRM_MATRIX).reduce((n, row) => n + (row[sv].owner === 'customer' ? 1 : row[sv].owner === 'shared' ? 0.5 : 0), 0)
    expect(customerLayers('ec2')).toBeGreaterThan(customerLayers('rds'))
    expect(customerLayers('rds')).toBeGreaterThan(customerLayers('lambda'))
    expect(customerLayers('lambda')).toBe(customerLayers('s3'))
  })
  it('dados, IAM e rede são sempre do cliente; segurança física sempre da AWS', () => {
    for (const sv of ['ec2', 'rds', 'lambda', 's3'] as const) {
      expect(SRM_MATRIX.data[sv].owner).toBe('customer')
      expect(SRM_MATRIX.iam[sv].owner).toBe('customer')
      expect(SRM_MATRIX.physical[sv].owner).toBe('aws')
    }
  })
  it('a solução de referência acerta tudo', () => {
    const c = { services: ['ec2', 'rds'] as const, layers: [{ id: 'os' as const }, { id: 'platform' as const }] }
    const cfg = { services: [...c.services], layers: c.layers }
    expect(evaluateResponsibilityLab(cfg, responsibilitySolution(cfg)).score).toBe(1)
    expect(evaluateResponsibilityLab(cfg, { cells: {} }).score).toBe(0)
  })
})
