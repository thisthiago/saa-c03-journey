import { describe, expect, it } from 'vitest'
import { cheaperMode, hotPartition, neededCapacity, onDemandMonthly, provisionedMonthly, readUnits, writeUnits, type TableLoad } from './model'

describe('capacidade do DynamoDB', () => {
  it('reproduz os exemplos da documentação', () => {
    // 80 leituras fortes de 3 KB por segundo: 80 RCU. 100 escritas de 512 bytes: 100 WCU.
    expect(80 * readUnits(3, 'strong')).toBe(80)
    expect(100 * writeUnits(0.5)).toBe(100)
    // Item de 8 KB: 2 unidades (forte), 1 (eventual), 4 (transacional).
    expect(readUnits(8, 'strong')).toBe(2)
    expect(readUnits(8, 'eventual')).toBe(1)
    expect(readUnits(8, 'transactional')).toBe(4)
    // Escrita de 2 KB: 2 unidades; transacional, 4. Item de 1,6 KB arredonda para 2.
    expect(writeUnits(2)).toBe(2)
    expect(writeUnits(2, true)).toBe(4)
    expect(writeUnits(1.6)).toBe(2)
    // Item de 20 KB: leitura forte consome 5 unidades; 600 leituras por segundo esgotam a partição.
    expect(readUnits(20, 'strong') * 600).toBe(3000)
  })

  it('aponta a partição quente pelo valor de chave mais acessado', () => {
    const keys = [
      { value: 'loja-centro', share: 0.6 },
      { value: 'loja-norte', share: 0.2 },
      { value: 'loja-sul', share: 0.2 },
    ]
    expect(hotPartition(keys, 2000, 1, 'write').throttled).toBe(true)
    expect(hotPartition(keys, 1500, 1, 'write').throttled).toBe(false)
  })

  it('sob demanda vale para tráfego irregular; provisionado, para tráfego alto e constante', () => {
    const spiky: TableLoad = { itemKB: 1, consistency: 'eventual', peakReads: 2000, peakWrites: 500, avgReads: 40, avgWrites: 10 }
    const steady: TableLoad = { itemKB: 1, consistency: 'eventual', peakReads: 2000, peakWrites: 500, avgReads: 1800, avgWrites: 450 }
    expect(cheaperMode(spiky)).toBe('on-demand')
    expect(cheaperMode(steady)).toBe('provisioned')
    const n = neededCapacity(steady)
    expect(n).toEqual({ rcu: 1000, wcu: 500 })
    expect(provisionedMonthly(n.rcu, n.wcu).total).toBeLessThan(onDemandMonthly(steady).total)
  })
})
