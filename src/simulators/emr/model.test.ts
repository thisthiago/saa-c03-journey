import { describe, expect, it } from 'vitest'
import { evaluateEmrLab, emrInitial, emrSolution } from './lab'
import { bestCluster, runJob, type EmrCluster, type EmrJob } from './model'

const JOB: EmrJob = {
  id: 'j',
  name: 'Job',
  description: '',
  batches: 60,
  deadlineHours: 5,
  usesHdfs: true,
  spotEvent: { atHour: 1, share: 0.5 },
  instanceType: 'm7g.xlarge',
  maxCore: 8,
  maxTask: 16,
}
const OD = (n: number) => ({ count: n, spot: false })
const SPOT = (n: number) => ({ count: n, spot: true })

describe('simulador de cluster do EMR', () => {
  it('sem retomada, o tempo é lotes divididos pelos nós que processam', () => {
    const r = runJob(JOB, { primary: OD(1), core: OD(4), task: OD(8) })
    expect(r.outcome).toBe('ok')
    expect(r.hours).toBeCloseTo(5)
  })

  it('o primário em Spot termina o cluster na retomada', () => {
    expect(runJob(JOB, { primary: SPOT(1), core: OD(4), task: OD(8) }).outcome).toBe('cluster-ended')
  })

  it('core em Spot perde o HDFS quando o job guarda dados nele', () => {
    expect(runJob(JOB, { primary: OD(1), core: SPOT(4), task: OD(8) }).outcome).toBe('hdfs-lost')
    expect(runJob({ ...JOB, usesHdfs: false }, { primary: OD(1), core: SPOT(4), task: OD(8) }).outcome).not.toBe('hdfs-lost')
  })

  it('task em Spot só reduz a capacidade', () => {
    const r = runJob(JOB, { primary: OD(1), core: OD(2), task: SPOT(16) })
    expect(r.lost.task).toBe(8)
    // 18 lotes na primeira hora; os 42 restantes com 10 nós levam 4,2 h.
    expect(r.hours).toBeCloseTo(5.2)
    expect(r.outcome).toBe('late')
  })

  it('o melhor cluster usa primário e core On-Demand e task em Spot quando há HDFS', () => {
    const best = bestCluster(JOB).cluster
    expect(best.primary.spot).toBe(false)
    expect(best.core.spot).toBe(false)
    expect(best.task.count === 0 || best.task.spot).toBe(true)
  })

  it('exige três primários quando o job pede alta disponibilidade', () => {
    const c: EmrCluster = { primary: OD(1), core: OD(8), task: OD(8) }
    expect(runJob({ ...JOB, needsHa: true }, c).outcome).toBe('no-ha')
  })

  it('a solução do laboratório chega a 100% e o estado inicial fica abaixo', () => {
    const config = { jobs: [JOB, { ...JOB, id: 'k', usesHdfs: false }] }
    expect(evaluateEmrLab(config, emrSolution(config)).score).toBe(1)
    expect(evaluateEmrLab(config, emrInitial(config)).score).toBeLessThan(0.7)
  })
})
