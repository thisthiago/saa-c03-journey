import { describe, expect, it } from 'vitest'
import { computePrices } from '../compute-prices'
import { cheapestVolume, needGaps, performance, validateVolume, volumeMonthly } from './model'

describe('desempenho e validação', () => {
  it('gp3 entrega 3.000 IOPS e 125 MiB/s em qualquer tamanho', () => {
    expect(performance({ type: 'gp3', sizeGiB: 8 })).toEqual({ iops: 3000, throughput: 125 })
    expect(validateVolume({ type: 'gp3', sizeGiB: 1, iops: 3000, throughput: 125 })).toEqual([])
  })
  it('gp3 respeita 500 IOPS por GiB e 0,25 MiB/s por IOPS (exemplos da documentação)', () => {
    expect(validateVolume({ type: 'gp3', sizeGiB: 160, iops: 80000 })).toEqual([])
    expect(validateVolume({ type: 'gp3', sizeGiB: 100, iops: 80000 })[0]).toContain('500 IOPS por GiB')
    expect(validateVolume({ type: 'gp3', sizeGiB: 16, iops: 8000, throughput: 2000 })).toEqual([])
    expect(validateVolume({ type: 'gp3', sizeGiB: 100, iops: 4000, throughput: 2000 })[0]).toContain('0,25 MiB/s por IOPS')
  })
  it('gp2: 3 IOPS por GiB, mínimo 100, máximo 16.000 a partir de 5.334 GiB', () => {
    expect(performance({ type: 'gp2', sizeGiB: 20 }).iops).toBe(100)
    expect(performance({ type: 'gp2', sizeGiB: 1000 }).iops).toBe(3000)
    expect(performance({ type: 'gp2', sizeGiB: 5334 }).iops).toBe(16000)
  })
  it('io2 vai a 1.000 IOPS por GiB; io1 a 50', () => {
    expect(validateVolume({ type: 'io2', sizeGiB: 256, iops: 256000 })).toEqual([])
    expect(validateVolume({ type: 'io1', sizeGiB: 100, iops: 5000 })).toEqual([])
    expect(validateVolume({ type: 'io1', sizeGiB: 100, iops: 6000 })[0]).toContain('50 IOPS por GiB')
  })
  it('HDD não serve de boot e Multi-Attach é só de io1 e io2', () => {
    expect(needGaps({ type: 'st1', sizeGiB: 500 }, { minGiB: 100, iops: 0, throughput: 0, boot: true })[0]).toContain('boot')
    expect(validateVolume({ type: 'gp3', sizeGiB: 100, multiAttach: true })[0]).toContain('Multi-Attach')
  })
})

describe('custo', () => {
  it('gp3 cobra só o que passa de 3.000 IOPS e 125 MiB/s', () => {
    const p = computePrices().ebs.gp3
    expect(volumeMonthly({ type: 'gp3', sizeGiB: 100 })).toBeCloseTo(100 * p.gbMonth, 6)
    expect(volumeMonthly({ type: 'gp3', sizeGiB: 100, iops: 5000, throughput: 250 })).toBeCloseTo(100 * p.gbMonth + 2000 * p.iopsMonth + 125 * p.throughputMiBpsMonth, 6)
  })
  it('io2 cobra IOPS por faixa', () => {
    const p = computePrices().ebs.io2
    const [t1, t2] = p.iopsMonthTiers
    expect(volumeMonthly({ type: 'io2', sizeGiB: 100, iops: 40000 })).toBeCloseTo(100 * p.gbMonth + 32000 * t1.price + 8000 * t2.price, 6)
  })
})

describe('volume mais barato que atende', () => {
  it('boot pequeno: gp3', () => expect(cheapestVolume({ minGiB: 30, iops: 1000, throughput: 50, boot: true })?.type).toBe('gp3'))
  it('logs grandes e sequenciais: st1', () => expect(cheapestVolume({ minGiB: 4000, iops: 200, throughput: 400 })?.type).toBe('st1'))
  it('arquivo frio: sc1', () => expect(cheapestVolume({ minGiB: 8000, iops: 50, throughput: 100 })?.type).toBe('sc1'))
  it('cluster com disco compartilhado: io2 com Multi-Attach', () => {
    const c = cheapestVolume({ minGiB: 200, iops: 10000, throughput: 200, multiAttach: true })
    expect(c?.type).toMatch(/io[12]/)
    expect(c?.multiAttach).toBe(true)
  })
})
