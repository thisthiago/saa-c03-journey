import { describe, expect, it } from 'vitest'
import { evaluateRightsizingLab, rightsizingSolution, type RightsizingLabConfig } from './lab'
import { bestBuy, buyProblem, rightsize, smaller, type Fleet } from './model'

const f = (x: Partial<Fleet>): Fleet => ({ type: 'c7g.2xlarge', count: 4, maxCpu: 30, maxMem: 20, hoursPerWeek: 168, interruptible: false, monthsLeft: 36, ...x })

describe('dimensionamento', () => {
  it('só desce na mesma família, com metade das vCPUs', () => {
    expect(smaller('c7g.2xlarge')).toBe('c7g.xlarge')
    expect(smaller('m7g.large')).toBeUndefined()
  })
  it('desce um tamanho abaixo de 40% e dois abaixo de 20%', () => {
    expect(rightsize(f({ maxCpu: 30 })).steps).toBe(1)
    expect(rightsize(f({ maxCpu: 15, maxMem: 18 })).steps).toBe(2)
    expect(rightsize(f({ maxCpu: 55 })).steps).toBe(0)
  })
  it('a memória também limita', () => {
    expect(rightsize(f({ maxCpu: 10, maxMem: 45 })).steps).toBe(0)
  })
})

describe('opção de compra', () => {
  it('carga contínua e longa vai para o Savings Plan', () => {
    expect(bestBuy(f({}), 'c7g.xlarge')).toBe('compute-sp-1yr')
  })
  it('horário comercial vence o compromisso', () => {
    expect(bestBuy(f({ hoursPerWeek: 50 }), 'c7g.xlarge')).toBe('scheduled')
  })
  it('carga interrompível vai para o Spot', () => {
    expect(bestBuy(f({ interruptible: true, hoursPerWeek: 60 }), 'c7g.xlarge')).toBe('spot')
  })
  it('carga que acaba logo não assume compromisso', () => {
    expect(buyProblem(f({ monthsLeft: 4 }), 'compute-sp-1yr')).not.toBeNull()
    expect(bestBuy(f({ monthsLeft: 4 }), 'c7g.xlarge')).toBe('on-demand')
  })
})

describe('laboratório de dimensionamento', () => {
  const c: RightsizingLabConfig = { fleets: [{ id: 'a', label: 'A', ...f({}) }, { id: 'b', label: 'B', ...f({ hoursPerWeek: 50, maxCpu: 70 }) }] }
  it('a solução chega a 100% e o vazio fica em 0', () => {
    expect(evaluateRightsizingLab(c, rightsizingSolution(c)).score).toBe(1)
    expect(evaluateRightsizingLab(c, { answers: {} }).score).toBe(0)
  })
})
