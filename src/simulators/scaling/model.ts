/**
 * Amazon EC2 Auto Scaling: uma avaliação das políticas (quanto o grupo cresce
 * ou encolhe), a política de término padrão e um dia inteiro de escalonamento
 * em passos de 5 minutos.
 *
 * Conferido em 20/10/2026:
 * - Tipos de política, limites de min e max e "vence a que deixa mais
 *   capacidade" com várias políticas (exemplos 1 e 2 da documentação):
 *   https://docs.aws.amazon.com/autoscaling/ec2/userguide/as-scale-based-on-demand.html
 * - Cooldown (300 s por padrão) só nas políticas simples; target tracking e
 *   step usam warmup: https://docs.aws.amazon.com/autoscaling/ec2/userguide/ec2-auto-scaling-scaling-cooldowns.html
 * - Predictive scaling (padrões diários e semanais, sobe antes da demanda):
 *   https://docs.aws.amazon.com/autoscaling/ec2/userguide/ec2-auto-scaling-predictive-scaling.html
 * - Término: equilíbrio entre AZs primeiro; depois configuração mais antiga
 *   (launch configuration, outro launch template, versão mais antiga) e a mais
 *   próxima da próxima hora de cobrança:
 *   https://docs.aws.amazon.com/autoscaling/ec2/userguide/ec2-auto-scaling-termination-policies.html
 *
 * Premissas e simplificações: target tracking calcula a capacidade
 * proporcional à métrica (como uma métrica inversamente proporcional à
 * capacidade) e só encolhe depois de 15 minutos abaixo do alvo; cada instância
 * atende a uma capacidade fixa por passo; o tempo até ficar em serviço
 * (launch, boot e warmup) é uma premissa do cenário; o predictive usa como
 * previsão a curva do dia anterior, igual à de hoje.
 */
import { HOURS_PER_MONTH, instancePrice } from '../compute-prices'

// ---------------------------------------------------------------------------
// Uma avaliação das políticas

export type PolicySpec =
  | { kind: 'target-tracking'; target: number }
  | { kind: 'step'; steps: { above: number; add: number }[] }
  | { kind: 'simple'; above: number; add: number }
  | { kind: 'change'; add: number }

export interface GroupState {
  current: number
  min: number
  max: number
}

/** Capacidade que uma política pede, dado o uso médio atual (0 a 1). */
export function policyCapacity(p: PolicySpec, current: number, utilization: number): number {
  switch (p.kind) {
    case 'target-tracking':
      return Math.ceil((current * utilization) / p.target)
    case 'step': {
      const step = [...p.steps].sort((a, b) => b.above - a.above).find((s) => utilization > s.above)
      return current + (step?.add ?? 0)
    }
    case 'simple':
      return current + (utilization > p.above ? p.add : 0)
    case 'change':
      return current + p.add
  }
}

const clamp = (n: number, g: GroupState) => Math.min(g.max, Math.max(g.min, n))

/** Nova capacidade desejada: entre várias políticas, vence a que deixa mais capacidade; o resultado fica entre min e max. */
export function evaluatePolicies(g: GroupState, utilization: number, policies: PolicySpec[]): { desired: number; asked: number[] } {
  const asked = policies.map((p) => policyCapacity(p, g.current, utilization))
  return { desired: clamp(Math.max(...asked), g), asked }
}

// ---------------------------------------------------------------------------
// Política de término padrão

export interface AsgInstance {
  id: string
  az: string
  /** 'lc' = launch configuration; 'lt-<id>@<versão>' = launch template. */
  config: string
  /** Minutos até completar a próxima hora de cobrança. */
  minutesToNextHour: number
}

/** Quanto mais desatualizada a configuração, menor o número (termina antes). */
function configRank(config: string, currentTemplate: string, currentVersion: number): number {
  if (config === 'lc') return 0
  const [tpl, ver] = config.split('@')
  if (tpl !== currentTemplate) return 1
  return 2 + Number(ver) / (currentVersion + 1)
}

export function defaultTerminationOrder(instances: AsgInstance[], currentTemplate: string, currentVersion: number): { victim: AsgInstance; reasons: string[] } {
  const byAz = new Map<string, AsgInstance[]>()
  for (const i of instances) byAz.set(i.az, [...(byAz.get(i.az) ?? []), i])
  const most = Math.max(...[...byAz.values()].map((l) => l.length))
  const azs = [...byAz.keys()].filter((az) => byAz.get(az)!.length === most)
  const pool = azs.flatMap((az) => byAz.get(az)!)
  const reasons = [azs.length === byAz.size ? 'As AZs estão equilibradas: a política vale para todas.' : `A AZ ${azs.join(', ')} tem mais instâncias: o término começa por ela, para manter o equilíbrio.`]
  const ranked = [...pool].sort((a, b) => configRank(a.config, currentTemplate, currentVersion) - configRank(b.config, currentTemplate, currentVersion) || a.minutesToNextHour - b.minutesToNextHour)
  const victim = ranked[0]
  const sameConfig = pool.filter((i) => configRank(i.config, currentTemplate, currentVersion) === configRank(victim.config, currentTemplate, currentVersion))
  reasons.push(
    victim.config === 'lc'
      ? `${victim.id} foi lançada com uma launch configuration: é a configuração mais desatualizada.`
      : !victim.config.startsWith(`${currentTemplate}@`)
        ? `${victim.id} usa um launch template diferente do atual.`
        : sameConfig.length === 1
          ? `${victim.id} usa a versão mais antiga do launch template atual.`
          : `Empate na configuração: ${victim.id} é a mais próxima da próxima hora de cobrança (${victim.minutesToNextHour} min).`,
  )
  return { victim, reasons }
}

// ---------------------------------------------------------------------------
// Um dia de escalonamento

export const STEP_MIN = 5
export const STEPS_PER_DAY = (24 * 60) / STEP_MIN

export interface DayScenario {
  /** Demanda por passo de 5 minutos, nas mesmas unidades da capacidade da instância. */
  demand: number[]
  capacityPerInstance: number
  type: string
  /** Minutos do launch até a instância atender (premissa). */
  warmupMin: number
}

export interface ScalingSetup {
  min: number
  max: number
  desired: number
  policy: 'none' | 'target-tracking' | 'step' | 'simple'
  /** Uso alvo do target tracking (0 a 1). */
  target?: number
  /** Simple e step: acima deste uso, adiciona instâncias. */
  above?: number
  add?: number
  /** Simple e step: abaixo deste uso, remove instâncias. */
  below?: number
  remove?: number
  /** Simple: espera entre atividades (padrão de 300 s). */
  cooldownMin?: number
  scheduled?: { hour: number; min?: number; max?: number; desired?: number }[]
  predictive?: boolean
}

export interface StepState {
  t: number
  demand: number
  inService: number
  launching: number
  desired: number
  unmet: number
}

export interface DayResult {
  steps: StepState[]
  unmetPct: number
  peakInService: number
  instanceHours: number
  dailyCost: number
  monthlyCost: number
}

export function simulateDay(sc: DayScenario, s: ScalingSetup, region?: string): DayResult {
  const warmSteps = Math.max(1, Math.ceil(sc.warmupMin / STEP_MIN))
  const scaleInWait = 15 / STEP_MIN
  let min = s.min
  let max = s.max
  let desired = Math.min(max, Math.max(min, s.desired))
  let inService = desired
  let pending: number[] = []
  let lastActivity = -Infinity
  let belowFor = 0
  const steps: StepState[] = []
  let unmetSum = 0
  let demandSum = 0
  let instanceSteps = 0
  const cap = sc.capacityPerInstance
  for (let t = 0; t < sc.demand.length; t++) {
    // Instâncias que terminaram o warmup entram em serviço.
    inService += pending.filter((ready) => ready <= t).length
    pending = pending.filter((ready) => ready > t)
    const demand = sc.demand[t]
    for (const a of s.scheduled ?? []) {
      if (a.hour * (60 / STEP_MIN) === t) {
        if (a.min !== undefined) min = a.min
        if (a.max !== undefined) max = a.max
        if (a.desired !== undefined) desired = a.desired
      }
    }
    const util = inService > 0 ? demand / (inService * cap) : 1
    const asked: number[] = [desired]
    if (s.policy === 'target-tracking' && s.target) {
      const want = Math.ceil(demand / (cap * s.target))
      if (want >= desired) {
        asked.push(want)
        belowFor = 0
      } else {
        belowFor++
        if (belowFor >= scaleInWait) asked[0] = want
      }
    }
    if ((s.policy === 'step' || s.policy === 'simple') && s.above !== undefined) {
      const coolingDown = s.policy === 'simple' && t - lastActivity < (s.cooldownMin ?? 5) / STEP_MIN
      if (!coolingDown) {
        if (util > s.above) asked.push(desired + (s.policy === 'step' ? Math.max(1, Math.ceil((util - s.above) / 0.1)) * (s.add ?? 1) : (s.add ?? 1)))
        else if (s.below !== undefined && util < s.below) asked[0] = desired - (s.remove ?? 1)
      }
    }
    if (s.predictive && s.target) {
      // Previsão: a demanda de daqui a um warmup, segundo o dia anterior (igual ao de hoje).
      const ahead = sc.demand[Math.min(sc.demand.length - 1, t + warmSteps)]
      asked.push(Math.ceil(ahead / (cap * s.target)))
    }
    const next = Math.min(max, Math.max(min, Math.max(...asked.slice(1), asked[0])))
    if (next !== desired) lastActivity = t
    desired = next
    const total = inService + pending.length
    if (desired > total) for (let i = 0; i < desired - total; i++) pending.push(t + warmSteps)
    if (desired < total) {
      let drop = total - desired
      const fromPending = Math.min(drop, pending.length)
      pending = pending.slice(fromPending)
      drop -= fromPending
      inService -= drop
    }
    const unmet = Math.max(0, demand - inService * cap)
    unmetSum += unmet
    demandSum += demand
    instanceSteps += inService + pending.length
    steps.push({ t, demand, inService, launching: pending.length, desired, unmet })
  }
  const instanceHours = (instanceSteps * STEP_MIN) / 60
  const dailyCost = instanceHours * instancePrice(sc.type, region).onDemandHour
  return {
    steps,
    unmetPct: demandSum > 0 ? unmetSum / demandSum : 0,
    peakInService: Math.max(...steps.map((x) => x.inService)),
    instanceHours,
    dailyCost,
    monthlyCost: dailyCost * (HOURS_PER_MONTH / 24),
  }
}

/** Curva de demanda de um dia: base, pico em horário comercial e rampa (útil para os cenários). */
export function businessDay({ base, peak, from, to, rampMin = 60 }: { base: number; peak: number; from: number; to: number; rampMin?: number }): number[] {
  const out: number[] = []
  for (let t = 0; t < STEPS_PER_DAY; t++) {
    const min = t * STEP_MIN
    const start = from * 60
    const end = to * 60
    let v = base
    if (min >= start && min < start + rampMin) v = base + ((peak - base) * (min - start)) / rampMin
    else if (min >= start + rampMin && min < end - rampMin) v = peak
    else if (min >= end - rampMin && min < end) v = base + ((peak - base) * (end - min)) / rampMin
    out.push(Math.round(v))
  }
  return out
}
