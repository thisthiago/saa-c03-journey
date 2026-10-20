import { describe, expect, it } from 'vitest'
import { instancePrice } from '../compute-prices'
import { breakeven, breakevenFromPrices, burstableHourly, cheapestFit, gaps, parseInstanceType, stateEffects, workloadMonthly } from './model'

describe('leitura do nome da instância', () => {
  it('separa série, geração, opções e tamanho (exemplo da documentação)', () => {
    expect(parseInstanceType('c7gn.xlarge')).toMatchObject({ series: 'c', generation: 7, options: ['g', 'n'], size: 'xlarge', category: 'compute' })
  })
  it('reconhece séries de mais de uma letra antes das de uma letra', () => {
    expect(parseInstanceType('inf2.xlarge')).toMatchObject({ series: 'inf', generation: 2, category: 'accelerated' })
    expect(parseInstanceType('i4i.large')).toMatchObject({ series: 'i', generation: 4, options: ['i'], category: 'storage' })
    expect(parseInstanceType('m7i-flex.large').options).toEqual(['i', 'flex'])
    expect(parseInstanceType('r7g.large').category).toBe('memory')
  })
})

describe('ciclo de vida', () => {
  it('stop apaga o instance store e troca o IP público, mas mantém o Elastic IP e o EBS', () => {
    const e = stateEffects('stop')
    expect(e['instance-store'].kept).toBe(false)
    expect(e['public-ip'].kept).toBe(false)
    expect(e['elastic-ip'].kept).toBe(true)
    expect(e['root-volume'].kept).toBe(true)
    expect(e.ram.kept).toBe(false)
  })
  it('só a hibernação preserva a RAM; o reboot preserva o instance store', () => {
    expect(stateEffects('hibernate').ram.kept).toBe(true)
    expect(stateEffects('reboot')['instance-store'].kept).toBe(true)
    expect(stateEffects('reboot').ram.kept).toBe(false)
  })
  it('terminate apaga o volume raiz por padrão e preserva os outros volumes', () => {
    expect(stateEffects('terminate')['root-volume'].kept).toBe(false)
    expect(stateEffects('terminate')['data-volume'].kept).toBe(true)
  })
})

describe('burstable', () => {
  it('reproduz o ponto de equilíbrio da documentação: t3.large × m5.large = 42,5%', () => {
    expect(breakevenFromPrices(0.3, 2, 0.0835, 0.096, 0.05)).toBeCloseTo(0.425, 6)
  })
  it('com os preços da tabela, o equilíbrio fica entre 40% e 45%', () => {
    const b = breakeven('t3.large', 'm5.large')
    expect(b).toBeGreaterThan(0.4)
    expect(b).toBeLessThan(0.45)
  })
  it('abaixo da baseline não há excedente; acima, cobra vCPU-hora', () => {
    expect(burstableHourly('t3.large', 0.2).surplus).toBe(0)
    const at = burstableHourly('t3.large', 1)
    expect(at.surplus).toBeCloseTo(0.7 * 2 * 0.05, 6)
    expect(at.total).toBeGreaterThan(instancePrice('m5.large').onDemandHour)
  })
})

describe('escolha do tipo', () => {
  const web = { id: 'w', name: 'site', description: '', needs: { vcpu: 2, memoryGiB: 4, avgCpu: 0.1 } }
  it('aponta o que falta', () => {
    expect(gaps('t3.micro', { vcpu: 2, memoryGiB: 8 })).toEqual(['tem 1 GiB de memória e a carga precisa de 8'])
    expect(gaps('m7g.large', { vcpu: 2, memoryGiB: 8, windows: true })[0]).toContain('Graviton só rodam Linux')
    expect(gaps('m7i.large', { vcpu: 2, memoryGiB: 8, localNvme: true })[0]).toContain('instance store')
    expect(gaps('inf2.xlarge', { vcpu: 4, memoryGiB: 16, gpu: true })[0]).toContain('GPU')
    expect(gaps('inf2.xlarge', { vcpu: 4, memoryGiB: 16, mlInference: true })).toEqual([])
  })
  it('para um site com pouca CPU, a burstable mais barata que atende vence', () => {
    expect(cheapestFit(web, ['t3.medium', 't4g.medium', 'm7g.large', 'm7i.large'])).toBe('t4g.medium')
  })
  it('com CPU alta sustentada, o excedente de créditos faz a fixa vencer', () => {
    const busy = { ...web, needs: { vcpu: 2, memoryGiB: 8, avgCpu: 0.9, arch: 'x86_64' as const } }
    expect(workloadMonthly('t3.large', busy.needs)).toBeGreaterThan(workloadMonthly('m7i.large', busy.needs))
    expect(cheapestFit(busy, ['t3.large', 'm7i.large', 'c7i.large'])).toBe('m7i.large')
  })
})
