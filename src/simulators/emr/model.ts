/**
 * Simulador de cluster do EMR: nós primário, core e task, a perda de
 * instâncias Spot no meio do job e o custo da noite.
 *
 * Conferido em 21/10/2026:
 * - O nó primário gerencia o cluster; se ele termina, o cluster termina. Desde
 *   a versão 5.23.0, o cluster pode ter três nós primários
 *   (https://docs.aws.amazon.com/emr/latest/ManagementGuide/emr-master-core-task-nodes.html).
 * - Os nós core guardam o HDFS: terminá-los arrisca perder dados. Os nós task
 *   só processam e não guardam dados no HDFS; perdê-los tem efeito mínimo.
 * - Recomendação da AWS para cargas com dados críticos: primário e core
 *   On-Demand, task em Spot
 *   (https://docs.aws.amazon.com/emr/latest/ManagementGuide/emr-plan-instances-guidelines.html).
 * - Cluster transitório termina depois do último passo; o de longa duração
 *   fica ligado e cobrando
 *   (https://docs.aws.amazon.com/emr/latest/ManagementGuide/emr-plan-longrunning-transient.html).
 *
 * Premissas do cenário: cada nó core ou task processa um lote por hora; na
 * pior noite, a AWS retoma uma fração das instâncias Spot de cada grupo num
 * horário fixo, sem reposição; o desconto do Spot é o da trilha de Computação.
 * A taxa do EMR por instância fica fora da conta.
 */
import { instancePrice } from '../compute-prices'
import { SPOT_DISCOUNT } from '../purchase/model'

export type NodeRole = 'primary' | 'core' | 'task'

export interface NodeGroup {
  count: number
  spot: boolean
}

export interface EmrCluster {
  primary: NodeGroup
  core: NodeGroup
  task: NodeGroup
}

export interface EmrJob {
  id: string
  name: string
  description: string
  /** Lotes de trabalho; cada nó core ou task processa um lote por hora. */
  batches: number
  deadlineHours: number
  /** O job guarda dados intermediários no HDFS dos nós core. */
  usesHdfs: boolean
  /** Exige três nós primários (cluster que não pode parar por falha do primário). */
  needsHa?: boolean
  /** Hora em que a AWS retoma instâncias Spot, e a fração retomada em cada grupo. */
  spotEvent: { atHour: number; share: number }
  instanceType: string
  maxCore: number
  maxTask: number
  concepts?: string[]
}

export type EmrOutcome = 'ok' | 'late' | 'cluster-ended' | 'hdfs-lost' | 'stalled' | 'no-ha'

export const OUTCOME_LABEL: Record<EmrOutcome, string> = {
  ok: 'termina no prazo',
  late: 'termina depois do prazo',
  'cluster-ended': 'o cluster termina junto com o primário em Spot',
  'hdfs-lost': 'perde dados do HDFS com os nós core em Spot',
  stalled: 'fica sem nós para processar',
  'no-ha': 'tem um primário só, e o job exige três',
}

export const ROLE_LABEL: Record<NodeRole, string> = { primary: 'Primário', core: 'Core', task: 'Task' }

export interface EmrRun {
  outcome: EmrOutcome
  /** Horas até o fim do job (ou até a falha). */
  hours: number
  cost: number
  lost: Record<NodeRole, number>
  trace: string[]
}

const hourPrice = (job: EmrJob, spot: boolean, region?: string) => instancePrice(job.instanceType, region).onDemandHour * (spot ? 1 - SPOT_DISCOUNT : 1)

const nodes = (n: number) => `${n} ${n === 1 ? 'nó' : 'nós'}`

const fmtH = (h: number) => `${h.toLocaleString('pt-BR', { maximumFractionDigits: 1 })} h`

export function runJob(job: EmrJob, c: EmrCluster, region?: string): EmrRun {
  const trace: string[] = []
  const lostOf = (g: NodeGroup) => (g.spot ? Math.ceil(g.count * job.spotEvent.share - 1e-9) : 0)
  // Simplificação: o grupo primário em Spot é retomado inteiro.
  const lost = { primary: c.primary.spot ? c.primary.count : 0, core: lostOf(c.core), task: lostOf(c.task) }
  const workers = c.core.count + c.task.count
  const after = workers - lost.core - lost.task
  const t = job.spotEvent.atHour
  const fullTime = workers > 0 ? job.batches / workers : Infinity
  const interrupted = fullTime > t && lost.primary + lost.core + lost.task > 0
  let outcome: EmrOutcome = 'ok'
  let hours: number
  if (job.needsHa && c.primary.count < 3) {
    outcome = 'no-ha'
    hours = 0
    trace.push('O job exige três nós primários para não parar se um deles falhar.')
  } else if (!interrupted) {
    hours = fullTime
    trace.push(`${nodes(workers)} ${workers === 1 ? 'processa' : 'processam'} ${job.batches} lotes em ${fmtH(hours)}${fullTime <= t ? ', antes da retomada das instâncias Spot' : ''}.`)
  } else {
    trace.push(`Depois de ${fmtH(t)}, a AWS retoma ${lost.primary + lost.core + lost.task} instâncias Spot.`)
    if (lost.primary >= c.primary.count) {
      outcome = 'cluster-ended'
      hours = t
      trace.push('Sem nó primário, o cluster termina, e o job inteiro é perdido.')
    } else if (lost.core > 0 && job.usesHdfs) {
      outcome = 'hdfs-lost'
      hours = t
      trace.push(`${lost.core === 1 ? 'O nó core perdido leva' : `Os ${lost.core} nós core perdidos levam`} junto parte do HDFS, onde estavam os dados intermediários: o job falha.`)
    } else if (after <= 0) {
      outcome = 'stalled'
      hours = t
      trace.push('Não sobra nenhum nó para processar.')
    } else {
      hours = t + (job.batches - workers * t) / after
      trace.push(`Com ${nodes(after)}, os lotes restantes terminam em ${fmtH(hours)}.`)
    }
  }
  if (outcome === 'ok' && hours > job.deadlineHours + 1e-9) {
    outcome = 'late'
    trace.push(`O prazo é de ${fmtH(job.deadlineHours)}.`)
  }
  // Os nós retomados pagam até a retomada; os demais, até o fim do job (ou da falha).
  const groupCost = (role: NodeRole) => {
    const g = c[role]
    const l = interrupted ? lost[role] : 0
    return hourPrice(job, g.spot, region) * ((g.count - l) * hours + l * Math.min(t, hours))
  }
  const cost = groupCost('primary') + groupCost('core') + groupCost('task')
  return { outcome, hours, cost, lost, trace }
}

/** Todas as combinações de cluster que o laboratório permite. */
export function allClusters(job: EmrJob): EmrCluster[] {
  const out: EmrCluster[] = []
  for (const pc of [1, 3])
    for (const ps of [false, true])
      for (let cc = 1; cc <= job.maxCore; cc++)
        for (const cs of [false, true])
          for (let tc = 0; tc <= job.maxTask; tc++)
            for (const ts of tc === 0 ? [false] : [false, true]) out.push({ primary: { count: pc, spot: ps }, core: { count: cc, spot: cs }, task: { count: tc, spot: ts } })
  return out
}

/** O cluster que termina no prazo pelo menor custo. */
export function bestCluster(job: EmrJob, region?: string): { cluster: EmrCluster; run: EmrRun } {
  let best: { cluster: EmrCluster; run: EmrRun } | undefined
  for (const cluster of allClusters(job)) {
    const run = runJob(job, cluster, region)
    if (run.outcome !== 'ok') continue
    if (!best || run.cost < best.run.cost - 1e-9) best = { cluster, run }
  }
  if (!best) throw new Error(`Job ${job.id}: nenhum cluster termina no prazo`)
  return best
}

export const describeCluster = (c: EmrCluster) =>
  (['primary', 'core', 'task'] as NodeRole[])
    .filter((r) => c[r].count > 0)
    .map((r) => `${c[r].count} ${ROLE_LABEL[r].toLowerCase()} ${c[r].spot ? 'Spot' : 'On-Demand'}`)
    .join(', ')
