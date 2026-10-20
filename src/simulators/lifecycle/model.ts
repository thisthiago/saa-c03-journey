/**
 * Modelo de S3 Lifecycle: validação de regras, aplicação dia a dia sobre conjuntos
 * de objetos e custo mês a mês.
 *
 * Regras conferidas em (16/10/2026):
 *  - https://docs.aws.amazon.com/AmazonS3/latest/userguide/lifecycle-transition-general-considerations.html
 *  - https://docs.aws.amazon.com/AmazonS3/latest/userguide/intro-lifecycle-rules.html
 *  - https://docs.aws.amazon.com/AmazonS3/latest/userguide/lifecycle-conflicts.html
 *  - https://docs.aws.amazon.com/AmazonS3/latest/userguide/lifecycle-configuration-examples.html
 *
 * Simplificações: cada conjunto de dados é uma "coorte" criada no dia 0; as ações
 * acontecem exatamente no dia previsto (na AWS a execução é assíncrona, a partir da
 * meia-noite UTC seguinte); NewerNoncurrentVersions e regras por data não são simulados;
 * no Intelligent-Tiering, os tiers vêm do perfil de acesso.
 */
import { monthlyCost, type DataProfile, type RegionPrices } from '../cost/model'
import { STORAGE_CLASSES, type StorageClassId } from '../shared/storageClasses'

export type TransitionTarget = 'STANDARD_IA' | 'INTELLIGENT_TIERING' | 'ONEZONE_IA' | 'GLACIER_IR' | 'GLACIER' | 'DEEP_ARCHIVE'

export const TRANSITION_TARGETS: TransitionTarget[] = ['STANDARD_IA', 'INTELLIGENT_TIERING', 'ONEZONE_IA', 'GLACIER_IR', 'GLACIER', 'DEEP_ARCHIVE']

/** Transições suportadas (modelo em cascata da documentação). */
export const SUPPORTED: Record<string, TransitionTarget[]> = {
  STANDARD: ['STANDARD_IA', 'INTELLIGENT_TIERING', 'ONEZONE_IA', 'GLACIER_IR', 'GLACIER', 'DEEP_ARCHIVE'],
  STANDARD_IA: ['INTELLIGENT_TIERING', 'ONEZONE_IA', 'GLACIER_IR', 'GLACIER', 'DEEP_ARCHIVE'],
  INTELLIGENT_TIERING: ['ONEZONE_IA', 'GLACIER_IR', 'GLACIER', 'DEEP_ARCHIVE'],
  ONEZONE_IA: ['GLACIER', 'DEEP_ARCHIVE'],
  GLACIER_IR: ['GLACIER', 'DEEP_ARCHIVE'],
  GLACIER: ['DEEP_ARCHIVE'],
  DEEP_ARCHIVE: [],
}

/** Preferência em conflitos no mesmo dia: o S3 escolhe o caminho mais barato; Intelligent-Tiering vence todas exceto Glacier Flexible e Deep Archive. */
const PREFERENCE: TransitionTarget[] = ['DEEP_ARCHIVE', 'GLACIER', 'INTELLIGENT_TIERING', 'GLACIER_IR', 'ONEZONE_IA', 'STANDARD_IA']

export interface Transition {
  days: number
  storageClass: TransitionTarget
}

export interface LifecycleRule {
  id: string
  enabled: boolean
  filter: { prefix?: string; tags?: Record<string, string>; sizeGreaterThanKB?: number; sizeLessThanKB?: number }
  transitions: Transition[]
  expirationDays?: number
  noncurrentTransitions: Transition[]
  noncurrentExpirationDays?: number
  abortMultipartDays?: number
  expiredObjectDeleteMarker?: boolean
}

export function emptyRule(id: string): LifecycleRule {
  return { id, enabled: true, filter: {}, transitions: [], noncurrentTransitions: [] }
}

export type DatasetKind = 'current' | 'noncurrent' | 'mpu' | 'delete-markers'

export interface Dataset {
  id: string
  name: string
  kind: DatasetKind
  /** Exemplo de key, usado para o filtro por prefixo. */
  key: string
  tags?: Record<string, string>
  profile: DataProfile
  /** Bucket versionado: expirar a versão atual cria um delete marker e ela passa a ser não atual. */
  versioned?: boolean
}

export interface ValidationIssue {
  ruleId: string
  severity: 'error' | 'warning'
  message: string
}

const name = (sc: StorageClassId) => STORAGE_CLASSES[sc].shortName

function validateChain(ruleId: string, list: Transition[], label: string, issues: ValidationIssue[]) {
  const sorted = [...list].sort((a, b) => a.days - b.days)
  let prev: { cls: StorageClassId; days: number } = { cls: 'STANDARD', days: 0 }
  for (const t of sorted) {
    if (!Number.isInteger(t.days) || t.days < 0) {
      issues.push({ ruleId, severity: 'error', message: `${label}: dias precisa ser um inteiro ≥ 0.` })
      continue
    }
    if (!SUPPORTED[prev.cls].includes(t.storageClass)) {
      issues.push({ ruleId, severity: 'error', message: `${label}: transição de ${name(prev.cls)} para ${name(t.storageClass)} não é suportada (modelo em cascata).` })
    } else if (prev.cls !== 'STANDARD') {
      const min = STORAGE_CLASSES[prev.cls].minStorageDays
      if (t.days < prev.days + min) {
        issues.push({
          ruleId,
          severity: 'error',
          message: `${label}: ${name(prev.cls)} tem duração mínima de ${min} dias; na mesma regra, a transição para ${name(t.storageClass)} precisa ser em ${prev.days + min} dias ou mais.`,
        })
      }
    }
    prev = { cls: t.storageClass, days: t.days }
  }
}

/** Validação que o S3 faria ao receber PutBucketLifecycleConfiguration (erros) e alertas de projeto. */
export function validateRules(rules: LifecycleRule[]): ValidationIssue[] {
  const issues: ValidationIssue[] = []
  const ids = new Set<string>()
  for (const r of rules) {
    if (ids.has(r.id)) issues.push({ ruleId: r.id, severity: 'error', message: 'IDs de regra precisam ser únicos.' })
    ids.add(r.id)
    const hasTags = Object.keys(r.filter.tags ?? {}).length > 0
    if (hasTags && r.abortMultipartDays !== undefined) issues.push({ ruleId: r.id, severity: 'error', message: 'AbortIncompleteMultipartUpload não pode ser usado em regra com filtro por tag.' })
    if (hasTags && r.expiredObjectDeleteMarker) issues.push({ ruleId: r.id, severity: 'error', message: 'ExpiredObjectDeleteMarker não pode ser usado em regra com filtro por tag.' })
    if (r.expiredObjectDeleteMarker && r.expirationDays !== undefined) issues.push({ ruleId: r.id, severity: 'error', message: 'Não é possível usar Days e ExpiredObjectDeleteMarker na mesma Expiration.' })
    const { sizeGreaterThanKB: gt, sizeLessThanKB: lt } = r.filter
    if (gt !== undefined && lt !== undefined && gt >= lt) issues.push({ ruleId: r.id, severity: 'error', message: 'ObjectSizeGreaterThan precisa ser menor que ObjectSizeLessThan.' })
    validateChain(r.id, r.transitions, 'Transition', issues)
    validateChain(r.id, r.noncurrentTransitions, 'NoncurrentVersionTransition', issues)
    const noAction =
      r.transitions.length === 0 &&
      r.expirationDays === undefined &&
      r.noncurrentTransitions.length === 0 &&
      r.noncurrentExpirationDays === undefined &&
      r.abortMultipartDays === undefined &&
      !r.expiredObjectDeleteMarker
    if (noAction) issues.push({ ruleId: r.id, severity: 'error', message: 'A regra precisa de pelo menos uma ação.' })
    const last = Math.max(-1, ...r.transitions.map((t) => t.days))
    if (r.expirationDays !== undefined && r.expirationDays <= last) {
      issues.push({ ruleId: r.id, severity: 'warning', message: `A expiração (${r.expirationDays} dias) não é posterior à última transição (${last} dias): a expiração tem precedência e a transição nunca acontece.` })
    }
    if (!r.enabled) issues.push({ ruleId: r.id, severity: 'warning', message: 'Regra desabilitada: nenhuma ação é executada.' })
  }
  return issues
}

export function ruleMatches(r: LifecycleRule, d: Dataset): boolean {
  if (!r.enabled) return false
  if (r.filter.prefix && !d.key.startsWith(r.filter.prefix)) return false
  for (const [k, v] of Object.entries(r.filter.tags ?? {})) if (d.tags?.[k] !== v) return false
  const kb = d.profile.avgObjectKB
  if (r.filter.sizeGreaterThanKB !== undefined && !(kb > r.filter.sizeGreaterThanKB)) return false
  if (r.filter.sizeLessThanKB !== undefined && !(kb < r.filter.sizeLessThanKB)) return false
  return true
}

const hasSizeFilter = (r: LifecycleRule) => r.filter.sizeGreaterThanKB !== undefined || r.filter.sizeLessThanKB !== undefined

export type SegmentState = StorageClassId | 'gone'

export interface Segment {
  from: number
  /** Exclusivo. */
  to: number
  state: SegmentState
  /** Versão não atual (após expiração num bucket versionado). */
  noncurrent?: boolean
}

export interface SimEvent {
  day: number
  text: string
  kind: 'transition' | 'expiration' | 'note' | 'early-delete'
  /** Para custos: classe de destino e classe de origem. */
  to?: SegmentState
  from?: StorageClassId
}

export interface DatasetSim {
  datasetId: string
  segments: Segment[]
  events: SimEvent[]
}

interface Plan {
  transitions: (Transition & { ruleId: string })[]
  expiration?: { days: number; ruleId: string }
}

function plan(d: Dataset, rules: LifecycleRule[], which: 'current' | 'noncurrent', notes: SimEvent[]): Plan {
  const p: Plan = { transitions: [] }
  for (const r of rules) {
    if (!ruleMatches(r, d)) continue
    const list = which === 'current' ? r.transitions : r.noncurrentTransitions
    if (list.length > 0 && d.profile.avgObjectKB < 128 && !hasSizeFilter(r)) {
      notes.push({ day: 0, kind: 'note', text: `Regra ${r.id}: objetos menores que 128 KB não transicionam por padrão (desde setembro de 2024). Seria preciso um filtro de tamanho explícito.` })
    } else for (const t of list) p.transitions.push({ ...t, ruleId: r.id })
    const exp = which === 'current' ? r.expirationDays : r.noncurrentExpirationDays
    if (exp !== undefined && (p.expiration === undefined || exp < p.expiration.days)) p.expiration = { days: exp, ruleId: r.id }
  }
  p.transitions.sort((a, b) => a.days - b.days || PREFERENCE.indexOf(a.storageClass) - PREFERENCE.indexOf(b.storageClass))
  return p
}

/** Aplica as regras a um conjunto de dados ao longo de `horizon` dias. */
export function simulateDataset(d: Dataset, rules: LifecycleRule[], horizon: number): DatasetSim {
  const events: SimEvent[] = []
  const segments: Segment[] = []
  const start: StorageClassId = 'STANDARD'

  if (d.kind === 'mpu' || d.kind === 'delete-markers') {
    let end: number | undefined
    let rule: string | undefined
    for (const r of rules) {
      if (!ruleMatches(r, d)) continue
      const days = d.kind === 'mpu' ? r.abortMultipartDays : r.expiredObjectDeleteMarker ? 1 : r.expirationDays
      if (days !== undefined && (end === undefined || days < end)) {
        end = days
        rule = r.id
      }
    }
    const stop = end === undefined ? horizon : Math.min(end, horizon)
    segments.push({ from: 0, to: stop, state: start })
    if (end !== undefined && end < horizon) {
      segments.push({ from: end, to: horizon, state: 'gone' })
      events.push({ day: end, kind: 'expiration', to: 'gone', from: start, text: d.kind === 'mpu' ? `Regra ${rule}: uploads incompletos interrompidos e partes removidas.` : `Regra ${rule}: delete markers sem versões (expired object delete markers) removidos.` })
    } else if (d.kind === 'mpu') {
      events.push({ day: 0, kind: 'note', text: 'Nenhuma regra interrompe os uploads incompletos: as partes continuam cobradas — e não aparecem na listagem.' })
    }
    return { datasetId: d.id, segments, events }
  }

  let cls: StorageClassId = start
  let since = 0
  let day = 0
  let phase: 'current' | 'noncurrent' = d.kind
  let offset = 0
  let noncurrent = d.kind === 'noncurrent'

  const close = (to: number) => {
    if (to > since) segments.push({ from: since, to, state: cls, noncurrent })
  }

  // Executa as fases (atual e, em bucket versionado, depois não atual).
  for (;;) {
    const p = plan(d, rules, phase, events)
    const expAt = p.expiration ? offset + p.expiration.days : Infinity
    let lastTransitionDay = -1
    for (const t of p.transitions) {
      const at = offset + t.days
      if (at >= expAt || at >= horizon) continue
      if (at < day || t.days < lastTransitionDay) continue
      // Conflito no mesmo dia: a transição preferida (mais barata) já foi aplicada.
      if (at === day && lastTransitionDay >= 0) continue
      if (!SUPPORTED[cls]?.includes(t.storageClass)) {
        if (cls !== t.storageClass) events.push({ day: at, kind: 'note', text: `Regra ${t.ruleId}: ${name(cls)} → ${name(t.storageClass)} não é uma transição suportada; ignorada.` })
        continue
      }
      close(at)
      events.push({ day: at, kind: 'transition', from: cls, to: t.storageClass, text: `Regra ${t.ruleId}: ${name(cls)} → ${name(t.storageClass)}${noncurrent ? ' (versão não atual)' : ''}.` })
      const min = STORAGE_CLASSES[cls].minStorageDays
      if (min > 0 && at - since < min) events.push({ day: at, kind: 'early-delete', from: cls, text: `Saiu de ${name(cls)} com ${at - since} dias: cobrança pró-rata do restante da duração mínima de ${min} dias.` })
      cls = t.storageClass
      since = at
      day = at
      lastTransitionDay = t.days
    }
    if (expAt < horizon) {
      close(expAt)
      const min = STORAGE_CLASSES[cls].minStorageDays
      if (phase === 'current' && d.versioned) {
        events.push({ day: expAt, kind: 'expiration', text: `Regra ${p.expiration!.ruleId}: expiração em bucket versionado — um delete marker vira a versão atual; os dados continuam guardados (e cobrados) como versão não atual.` })
        since = expAt
        day = expAt
        offset = expAt
        phase = 'noncurrent'
        noncurrent = true
        continue
      }
      if (min > 0 && expAt - since < min) events.push({ day: expAt, kind: 'early-delete', from: cls, text: `Excluído com ${expAt - since} dias em ${name(cls)}: cobrança pró-rata do restante da duração mínima de ${min} dias.` })
      events.push({ day: expAt, kind: 'expiration', to: 'gone', from: cls, text: `Regra ${p.expiration!.ruleId}: ${noncurrent ? 'versões não atuais excluídas para sempre' : 'objetos expirados (excluídos)'}.` })
      segments.push({ from: expAt, to: horizon, state: 'gone', noncurrent })
      return { datasetId: d.id, segments, events }
    }
    close(horizon)
    return { datasetId: d.id, segments, events }
  }
}

export function stateAt(sim: DatasetSim, day: number): SegmentState {
  return sim.segments.find((s) => day >= s.from && day < s.to)?.state ?? sim.segments.at(-1)?.state ?? 'STANDARD'
}

export interface MonthCost {
  month: number
  total: number
}

const DAYS = 30

/** Custo mês a mês de um conjunto de dados (meses de 30 dias). */
export function datasetMonthlyCosts(d: Dataset, sim: DatasetSim, prices: RegionPrices, months: number): MonthCost[] {
  const perClass = new Map<StorageClassId, ReturnType<typeof monthlyCost>>()
  const costOf = (sc: StorageClassId) => {
    if (!perClass.has(sc)) perClass.set(sc, monthlyCost(d.profile, sc, prices))
    return perClass.get(sc)!
  }
  const out: MonthCost[] = []
  for (let m = 0; m < months; m++) {
    const a = m * DAYS
    const b = a + DAYS
    let total = 0
    for (const s of sim.segments) {
      if (s.state === 'gone') continue
      const overlap = Math.max(0, Math.min(b, s.to) - Math.max(a, s.from))
      if (overlap === 0) continue
      const c = costOf(s.state)
      // Uploads incompletos e versões não atuais não recebem leituras.
      const monthly = d.kind === 'current' && !s.noncurrent ? c.total - c.earlyDeletion : c.storage + c.monitoring
      total += (monthly * overlap) / DAYS
    }
    for (const e of sim.events) {
      if (e.day < a || e.day >= b) continue
      if (e.kind === 'transition' && e.to && e.to !== 'gone' && e.to !== 'STANDARD' && e.to !== 'EXPRESS_ONEZONE') {
        total += (d.profile.objectCount / 1000) * prices.transitionPer1000[e.to]
      }
      if (e.kind === 'early-delete' && e.from) {
        const seg = sim.segments.find((s) => s.state === e.from && s.to === e.day)
        const stayed = seg ? seg.to - seg.from : 0
        const min = STORAGE_CLASSES[e.from].minStorageDays
        total += (costOf(e.from).storage * Math.max(0, min - stayed)) / DAYS
      }
    }
    out.push({ month: m + 1, total })
  }
  return out
}

export function simulateAll(datasets: Dataset[], rules: LifecycleRule[], horizon: number) {
  const issues = validateRules(rules)
  const accepted = !issues.some((i) => i.severity === 'error')
  // Uma configuração com erro é rejeitada inteira pelo S3: nenhuma regra vale.
  const effective = accepted ? rules : []
  return { issues, accepted, sims: datasets.map((d) => simulateDataset(d, effective, horizon)) }
}

export const CLASS_COLOR: Record<SegmentState, string> = {
  STANDARD: '#4dd6ff',
  INTELLIGENT_TIERING: '#7be07a',
  STANDARD_IA: '#6c8cff',
  ONEZONE_IA: '#a594ff',
  EXPRESS_ONEZONE: '#f2a0c8',
  GLACIER_IR: '#ffd84d',
  GLACIER: '#ff8f5a',
  DEEP_ARCHIVE: '#c792ea',
  gone: 'transparent',
}
