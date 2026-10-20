import { describe, expect, it } from 'vitest'
import { COMPUTE_PRICES, computePrices, INSTANCE_TYPES, PRICE_DATE, usd } from './compute-prices'

describe('tabela de preços de computação', () => {
  it('tem as duas Regiões, com os mesmos tipos de instância', () => {
    expect(Object.keys(COMPUTE_PRICES.regions).sort()).toEqual(['sa-east-1', 'us-east-1'])
    expect(Object.keys(computePrices('sa-east-1').instances).sort()).toEqual([...INSTANCE_TYPES].sort())
    expect(PRICE_DATE).toMatch(/^\d{2}\/\d{2}\/\d{4}$/)
  })

  it('todo preço é um número positivo', () => {
    // vCPU, memória e GPUs são especificações, não preços (GPUs pode ser 0).
    const SPECS = new Set(['upTo', 'gpus', 'vcpu', 'memoryGiB'])
    const walk = (v: unknown, path: string): string[] => {
      if (typeof v === 'number') return v > 0 ? [] : [path]
      if (v && typeof v === 'object') return Object.entries(v).flatMap(([k, x]) => (SPECS.has(k) ? [] : walk(x, `${path}.${k}`)))
      return []
    }
    for (const [code, r] of Object.entries(COMPUTE_PRICES.regions)) {
      expect(walk({ instances: r.instances, ebs: r.ebs, lambda: r.lambda, fargate: r.fargate, elb: r.elb }, code)).toEqual([])
    }
  })

  it('compromissos custam menos que o sob demanda, e o de 3 anos menos que o de 1 ano', () => {
    for (const r of Object.values(COMPUTE_PRICES.regions)) {
      for (const [type, p] of Object.entries(r.instances)) {
        for (const v of [...Object.values(p.reservedNoUpfrontHour), ...Object.values(p.savingsPlanHour)]) expect(v, type).toBeLessThan(p.onDemandHour)
        expect(p.reservedNoUpfrontHour['standard-3yr'], type).toBeLessThan(p.reservedNoUpfrontHour['standard-1yr'])
        // O plano preso a uma família (EC2 Instance SP) dá mais desconto que o flexível (Compute SP).
        expect(p.savingsPlanHour['ec2instance-1yr'], type).toBeLessThanOrEqual(p.savingsPlanHour['compute-1yr'])
        expect(p.reservedNoUpfrontHour['standard-1yr'], type).toBeLessThanOrEqual(p.reservedNoUpfrontHour['convertible-1yr'])
      }
    }
  })

  it('formata valores pequenos com mais casas', () => {
    expect(usd(0.0832)).toBe('US$ 0,0832')
    expect(usd(60.74)).toBe('US$ 60,74')
  })
})
