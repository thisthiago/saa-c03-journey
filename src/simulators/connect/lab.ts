/** Laboratório "Conectar as VPCs": escolher a topologia que cumpre os requisitos de alcance com o menor custo e esforço. */
import type { ItemFeedback } from '../../engine/types'
import { usd } from '../compute-prices'
import { connectionsToManage, reaches, topologyMonthly, topologyProblems, type Net, type Topology } from './model'

export interface ConnectOption {
  id: string
  label: string
  topology: Topology
}

export interface ConnectScenario {
  id: string
  name: string
  description: string
  nets: Net[]
  mustReach: [string, string][]
  mustNotReach: [string, string][]
  /** GB por mês que passariam pelo Transit Gateway (premissa do cenário). */
  gbMonth: number
  /** Máximo de conexões que a equipe aceita manter (premissa do cenário). */
  maxConnections: number
  options: ConnectOption[]
  concepts?: string[]
}

export interface ConnectLabConfig {
  region?: string
  scenarios: ConnectScenario[]
}

export interface ConnectLabResponse {
  choices: Record<string, string>
}

export interface OptionCheck {
  problems: string[]
  failures: string[]
  connections: number
  monthly: number
}

export function checkOption(s: ConnectScenario, o: ConnectOption, region?: string): OptionCheck {
  const problems = topologyProblems(s.nets, o.topology)
  const failures: string[] = []
  for (const [a, b] of s.mustReach) {
    const r = reaches(s.nets, o.topology, a, b)
    if (!r.ok) failures.push(r.why)
  }
  for (const [a, b] of s.mustNotReach) {
    const r = reaches(s.nets, o.topology, a, b)
    if (r.ok) failures.push(`${s.nets.find((n) => n.id === a)!.name} alcança ${s.nets.find((n) => n.id === b)!.name}, e o requisito proíbe.`)
  }
  return { problems, failures, connections: connectionsToManage(o.topology), monthly: topologyMonthly(o.topology, s.gbMonth, region) }
}

const fits = (s: ConnectScenario, k: OptionCheck) => k.problems.length === 0 && k.failures.length === 0 && k.connections <= s.maxConnections

/** A opção de referência: cumpre tudo, cabe no limite de conexões e custa menos. Lança erro se não for única. */
export function bestConnectOption(s: ConnectScenario, region?: string): string {
  const ok = s.options.map((o) => ({ o, k: checkOption(s, o, region) })).filter((x) => fits(s, x.k))
  ok.sort((a, b) => a.k.monthly - b.k.monthly || a.k.connections - b.k.connections)
  if (ok.length === 0) throw new Error(`Cenário ${s.id}: nenhuma opção atende`)
  if (ok[1] && ok[1].k.monthly === ok[0].k.monthly && ok[1].k.connections === ok[0].k.connections) throw new Error(`Cenário ${s.id}: empate`)
  return ok[0].o.id
}

export function judgeConnect(c: ConnectLabConfig, s: ConnectScenario, pick: string | undefined): { score: number; fb: ItemFeedback } {
  const opt = s.options.find((o) => o.id === pick)
  const best = s.options.find((o) => o.id === bestConnectOption(s, c.region))!
  if (!opt) return { score: 0, fb: { id: s.id, label: `${s.name}: sem escolha`, status: 'missed', message: `A opção adequada é: ${best.label}.` } }
  const k = checkOption(s, opt, c.region)
  const label = `${s.name}: ${opt.label}`
  if (k.problems.length) return { score: 0, fb: { id: s.id, label, status: 'wrong', message: `Não dá para montar: ${k.problems.join('; ')}.` } }
  if (k.failures.length) return { score: 0, fb: { id: s.id, label, status: 'wrong', message: k.failures.join(' ') } }
  if (opt.id === best.id) return { score: 1, fb: { id: s.id, label, status: 'correct', message: `Cumpre todos os requisitos, com ${k.connections} ${k.connections === 1 ? 'conexão' : 'conexões'} para manter e ${usd(k.monthly)}/mês.` } }
  if (k.connections > s.maxConnections) return { score: 0.5, fb: { id: s.id, label, status: 'partial', message: `Funciona, mas são ${k.connections} conexões para criar e manter, acima das ${s.maxConnections} que a equipe aceita. ${best.label} resolve com menos.` } }
  const bk = checkOption(s, best, c.region)
  return { score: 0.5, fb: { id: s.id, label, status: 'partial', message: `Funciona, mas custa ${usd(k.monthly)}/mês; ${best.label} cumpre o mesmo por ${usd(bk.monthly)}/mês.` } }
}

export const connectSolution = (c: ConnectLabConfig): ConnectLabResponse => ({ choices: Object.fromEntries(c.scenarios.map((s) => [s.id, bestConnectOption(s, c.region)])) })

export const connectComplete = (c: ConnectLabConfig, r: ConnectLabResponse) => c.scenarios.every((s) => Boolean(r.choices?.[s.id]))

export function evaluateConnectLab(c: ConnectLabConfig, r: ConnectLabResponse) {
  const items = c.scenarios.map((s) => ({ concepts: s.concepts, ...judgeConnect(c, s, r?.choices?.[s.id]) }))
  return { score: items.reduce((sum, x) => sum + x.score, 0) / Math.max(1, items.length), items }
}
