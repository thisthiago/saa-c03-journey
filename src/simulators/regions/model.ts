/**
 * Escolha de Região: requisitos de um cenário × fatos verificados das Regiões.
 *
 * Fatos (catalog.ts, conferidos em 18/10/2026): país, AZs, opt-in e S3 Express
 * One Zone. Custo: preço público do S3 Standard (primeira faixa) da tabela de
 * preços versionada.
 *
 * Premissas do cenário (nunca dados da AWS): latência entre grupos de usuários
 * e Regiões, exigências contratuais de residência e o volume armazenado.
 *
 * Simplificações: a latência é um número fixo por par grupo × Região; o custo
 * compara só o armazenamento no S3 Standard (outros serviços variam diferente).
 */
import { regionFact, type RegionFact } from './catalog'

export type RegionFeature = 's3-express-one-zone'

export const FEATURE_LABEL: Record<RegionFeature, string> = {
  's3-express-one-zone': 'Amazon S3 Express One Zone',
}

export interface UserGroup {
  id: string
  label: string
  /** Fração dos usuários (soma 1). */
  share: number
}

export interface RegionScenario {
  id: string
  title: string
  description: string
  groups: UserGroup[]
  candidates: string[]
  /** Premissa: latência ilustrativa (ms) de cada grupo até cada Região candidata. */
  latencyMs: Record<string, Record<string, number>>
  requirements: {
    /** Exigência contratual (premissa): países onde os dados podem ficar. */
    residency?: { countries: string[]; reason: string }
    features?: RegionFeature[]
    /** Latência máxima aceitável para um grupo (premissa do produto). */
    maxLatency?: { group: string; ms: number }
  }
  /** Critério de desempate entre as Regiões que atendem a tudo. */
  priority: 'latency' | 'cost'
  /** Volume no S3 Standard (GB) para estimar o custo mensal. */
  storageGB: number
  /** Conceitos avaliados por este cenário. */
  concepts?: string[]
}

export type ViolationKind = 'residency' | 'feature' | 'latency'

export interface RegionEvaluation {
  code: string
  fact: RegionFact
  violations: { kind: ViolationKind; message: string }[]
  /** Latência média ponderada pela fração de usuários. */
  weightedLatency: number
  monthlyStorageUSD: number
  notes: string[]
}

export type PriceLookup = (region: string) => number

export function evaluateRegion(s: RegionScenario, code: string, price: PriceLookup): RegionEvaluation {
  const fact = regionFact(code)
  const violations: RegionEvaluation['violations'] = []
  const res = s.requirements.residency
  if (res && !res.countries.includes(fact.country)) violations.push({ kind: 'residency', message: `Os dados ficariam em ${fact.country}, fora do permitido (${res.countries.join(', ')}): ${res.reason}` })
  for (const f of s.requirements.features ?? []) {
    if (f === 's3-express-one-zone' && !fact.s3ExpressOneZone) violations.push({ kind: 'feature', message: `${FEATURE_LABEL[f]} não está disponível em ${code} (documentação conferida em 18/10/2026).` })
  }
  const lat = s.latencyMs[code] ?? {}
  const max = s.requirements.maxLatency
  if (max && (lat[max.group] ?? Infinity) > max.ms) {
    const g = s.groups.find((x) => x.id === max.group)
    violations.push({ kind: 'latency', message: `Latência de ${lat[max.group]} ms para ${g?.label ?? max.group}, acima do limite de ${max.ms} ms (premissa do cenário).` })
  }
  const weightedLatency = s.groups.reduce((sum, g) => sum + g.share * (lat[g.id] ?? 0), 0)
  const notes: string[] = []
  if (fact.optIn) notes.push('Região opt-in: precisa ser habilitada na conta antes do uso.')
  return { code, fact, violations, weightedLatency, monthlyStorageUSD: price(code) * s.storageGB, notes }
}

const EPS = 1e-9

/** Candidatas ordenadas: primeiro as que atendem a tudo, pelo critério do cenário. */
export function rankRegions(s: RegionScenario, price: PriceLookup): RegionEvaluation[] {
  const evals = s.candidates.map((c) => evaluateRegion(s, c, price))
  const key = (e: RegionEvaluation) => (s.priority === 'latency' ? [e.weightedLatency, e.monthlyStorageUSD] : [e.monthlyStorageUSD, e.weightedLatency])
  return evals.sort((a, b) => {
    const aOk = a.violations.length === 0
    const bOk = b.violations.length === 0
    if (aOk !== bOk) return aOk ? -1 : 1
    const [a1, a2] = key(a)
    const [b1, b2] = key(b)
    return Math.abs(a1 - b1) > EPS ? a1 - b1 : a2 - b2
  })
}

/** A melhor Região. Lança erro se houver empate ou se nenhuma atender — o cenário seria ambíguo. */
export function bestRegion(s: RegionScenario, price: PriceLookup): RegionEvaluation {
  const [first, second] = rankRegions(s, price)
  if (!first || first.violations.length > 0) throw new Error(`Cenário ${s.id}: nenhuma Região atende`)
  if (second && second.violations.length === 0) {
    const same = s.priority === 'latency' ? Math.abs(first.weightedLatency - second.weightedLatency) < EPS && Math.abs(first.monthlyStorageUSD - second.monthlyStorageUSD) < EPS : Math.abs(first.monthlyStorageUSD - second.monthlyStorageUSD) < EPS && Math.abs(first.weightedLatency - second.weightedLatency) < EPS
    if (same) throw new Error(`Cenário ${s.id}: empate entre ${first.code} e ${second.code}`)
  }
  return first
}

/** A Região de menor latência média, ignorando requisitos — a "escolha intuitiva". */
export function nearestRegion(s: RegionScenario, price: PriceLookup): RegionEvaluation {
  return s.candidates.map((c) => evaluateRegion(s, c, price)).sort((a, b) => a.weightedLatency - b.weightedLatency)[0]
}

export function formatMs(ms: number): string {
  return `${Math.round(ms)} ms`
}
