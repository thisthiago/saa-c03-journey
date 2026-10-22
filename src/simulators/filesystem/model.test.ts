import { describe, expect, it } from 'vitest'
import { filesPrices } from '../files-prices'
import { CUSTO_CARGAS } from '../../content/modules/files/phases/f02/workloads'
import { evaluateFilesystemLab, filesystemSolution, type FilesystemLabConfig } from './lab'
import { burstingBaseline, burstingPeak, cheapestEfs, clientAccess, efsMonthlyCost, type EfsUsage } from './model'

const p = filesPrices().efs

describe('acesso ao EFS com uma AZ fora', () => {
  it('Regional com mount target em cada AZ: quem está de pé continua acessando', () => {
    expect(clientAccess({ type: 'regional', mountAzs: ['a', 'b'] }, 'b', 'a').outcome).toBe('ok')
  })
  it('Regional com um só mount target: a outra AZ perde o acesso quando ele cai', () => {
    expect(clientAccess({ type: 'regional', mountAzs: ['a'] }, 'b', 'a').outcome).toBe('no-access')
    expect(clientAccess({ type: 'regional', mountAzs: ['a'] }, 'b').outcome).toBe('ok-cross-az')
  })
  it('One Zone: a AZ do sistema de arquivos fora derruba todos', () => {
    expect(clientAccess({ type: 'one-zone', mountAzs: ['a'] }, 'b', 'a').outcome).toBe('no-access')
    expect(clientAccess({ type: 'one-zone', mountAzs: ['a'] }, 'a', 'b').outcome).toBe('ok')
    expect(clientAccess({ type: 'one-zone', mountAzs: ['a'] }, 'b', 'c').outcome).toBe('ok-cross-az')
  })
})

describe('custo do EFS', () => {
  const base: EfsUsage = { storageGB: 1024, idle30Share: 0.5, idle90Share: 0.25, coldReadGB: 10, archiveReadGB: 1, readGB: 100, writeGB: 10, avgMiBps: 1, peakMiBps: 50 }

  it('Bursting: base de 50 MiB/s e rajada de 100 MiB/s por TiB na Standard, com mínimos', () => {
    expect(burstingBaseline(1024)).toBe(50)
    expect(burstingPeak(1024)).toBe(100)
    expect(burstingPeak(100)).toBe(100)
    expect(burstingBaseline(1)).toBe(1)
  })

  it('o Archive só vale com Elastic', () => {
    expect(efsMonthlyCost(base, 'bursting', 'ia-archive', p).valid).toBe(false)
    expect(efsMonthlyCost(base, 'elastic', 'ia-archive', p).valid).toBe(true)
  })

  it('o ciclo de vida reduz a base do Bursting', () => {
    const none = efsMonthlyCost(base, 'bursting', 'none', p)
    const ia = efsMonthlyCost(base, 'bursting', 'ia', p)
    expect(ia.baselineMiBps).toBeLessThan(none.baselineMiBps)
  })

  it('Elastic cobra o Infrequent Access mais barato', () => {
    const e = efsMonthlyCost(base, 'elastic', 'ia', p)
    const pr = efsMonthlyCost(base, 'provisioned', 'ia', p)
    expect(e.storage).toBeLessThan(pr.storage)
  })

  it('as cargas do chefe da fase 2 têm uma única combinação mais barata, e cada modo e ciclo aparece', () => {
    const best = CUSTO_CARGAS.map((w) => cheapestEfs(w.usage!, p).best)
    expect(new Set(best.map((b) => b.mode))).toEqual(new Set(['elastic', 'provisioned', 'bursting']))
    expect(new Set(best.map((b) => b.lifecycle))).toEqual(new Set(['none', 'ia', 'ia-archive']))
  })

  it('o laboratório de custo chega a 100% com a solução', () => {
    const c: FilesystemLabConfig = { mode: 'cost', workloads: CUSTO_CARGAS }
    expect(evaluateFilesystemLab(c, filesystemSolution(c)).score).toBe(1)
    expect(evaluateFilesystemLab(c, { answers: {} }).score).toBe(0)
  })
})
