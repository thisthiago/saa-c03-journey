/**
 * Modelo de custo mensal simplificado do Amazon S3.
 *
 * Componentes: armazenamento (com tamanho mínimo faturável e overhead de
 * arquivamento), requisições, recuperação/restauração, monitoramento do
 * Intelligent-Tiering, exclusão antecipada e transferência para a internet.
 * Os preços vêm de uma tabela versionada (src/content/pricing/s3-prices.json).
 *
 * Simplificações (exibidas na interface):
 *  - usa apenas a primeira faixa de preço; ignora nível gratuito e impostos;
 *  - todos os objetos de um perfil têm o mesmo tamanho médio;
 *  - regime estável: o volume armazenado não muda de um mês para o outro;
 *  - no Intelligent-Tiering, a distribuição entre tiers é informada pelo perfil;
 *  - não cobra exclusão antecipada no Intelligent-Tiering, conforme a tabela
 *    de classes da documentação (a lista de preços contém uma linha
 *    "EarlyDelete-INT" que não é aplicada aqui).
 */
import { STORAGE_CLASSES, type StorageClassId } from '../shared/storageClasses'

export interface RegionPrices {
  label: string
  offers: Record<string, string>
  storageGBMonth: Record<StorageClassId, number>
  intelligentTiering: {
    monitoringPer1000Objects: number
    tierGBMonth: { frequent: number; infrequent: number; archiveInstant: number }
  }
  putPer1000: Record<StorageClassId, number>
  getPer1000: Record<StorageClassId, number>
  retrievalPerGB: {
    STANDARD_IA: number
    ONEZONE_IA: number
    GLACIER_IR: number
    EXPRESS_ONEZONE: number
    GLACIER_EXPEDITED: number
    GLACIER_STANDARD: number
    GLACIER_BULK: number
    DEEP_ARCHIVE_STANDARD: number
    DEEP_ARCHIVE_BULK: number
  }
  restoreRequestPer1000: {
    GLACIER_EXPEDITED: number
    GLACIER_STANDARD: number
    GLACIER_BULK: number
    DEEP_ARCHIVE_STANDARD: number
    DEEP_ARCHIVE_BULK: number
  }
  transitionPer1000: Record<Exclude<StorageClassId, 'STANDARD' | 'EXPRESS_ONEZONE'>, number>
  expressUploadPerGB: number
  dataTransferOutPerGB: number
}

export interface PriceTable {
  source: string
  retrievedAt: string
  currency: string
  notes: string[]
  regions: Record<string, RegionPrices>
  /** S3 Standard e transferência para a internet em mais Regiões (comparação entre Regiões). */
  standardByRegion?: Record<string, { label: string; standardGBMonth: number; dataTransferOutPerGB: number }>
}

export type RestoreTier = 'expedited' | 'standard' | 'bulk'

/** Um "perfil de dados": como um conjunto de objetos é usado ao longo de um mês. */
export interface DataProfile {
  id: string
  name: string
  description: string
  objectCount: number
  /** Tamanho médio por objeto, em KB. */
  avgObjectKB: number
  putsPerMonth: number
  getsPerMonth: number
  /** Volume lido por mês (GB). Em classes arquivadas, é o volume restaurado. */
  retrievedGBPerMonth: number
  /** Objetos restaurados por mês (só classes arquivadas). */
  restoresPerMonth?: number
  restoreTier?: RestoreTier
  /** Por quantos dias cada objeto fica antes de ser excluído (regime estável). Ausente = permanente. */
  retentionDays?: number
  /** Distribuição de bytes entre os tiers do Intelligent-Tiering (soma 1). */
  intelligentTieringShare?: { frequent: number; infrequent: number; archiveInstant: number }
  dataTransferOutGBPerMonth?: number
  requirements: Requirements
}

export interface Requirements {
  /** Leitura imediata (milissegundos), sem restauração prévia. */
  instantAccess: boolean
  /** Os dados não podem ser recriados: precisam resistir à perda de uma zona de disponibilidade. */
  azResilient: boolean
  /** Prazo máximo aceitável para ter um dado arquivado de volta (horas). */
  maxRestoreHours?: number
  /** Precisa de latência de um dígito de milissegundo. */
  singleDigitMs?: boolean
}

export interface CostBreakdown {
  storageClass: StorageClassId
  storage: number
  requests: number
  retrieval: number
  monitoring: number
  earlyDeletion: number
  transfer: number
  total: number
  /** GB efetivamente faturados de armazenamento (inclui mínimos e overhead). */
  billedGB: number
  violations: string[]
  notes: string[]
}

const KB_PER_GB = 1024 * 1024
const DAYS_PER_MONTH = 30

export const round2 = (n: number) => Math.round(n * 100) / 100

export function dataGB(p: DataProfile): number {
  return (p.objectCount * p.avgObjectKB) / KB_PER_GB
}

/** Pior prazo típico de restauração por classe e tier (horas), conforme a documentação. */
export function restoreHours(sc: StorageClassId, tier: RestoreTier = 'standard'): number {
  if (sc === 'GLACIER') return tier === 'expedited' ? 5 / 60 : tier === 'standard' ? 5 : 12
  if (sc === 'DEEP_ARCHIVE') return tier === 'bulk' ? 48 : 12
  return 0
}

export function requirementViolations(sc: StorageClassId, req: Requirements): string[] {
  const info = STORAGE_CLASSES[sc]
  const v: string[] = []
  if (req.instantAccess && info.requiresRestore) v.push(`${info.name} exige restauração antes da leitura (${info.access}); o requisito é acesso imediato.`)
  if (req.azResilient && info.zones === '1') v.push(`${info.name} guarda os dados em uma única zona de disponibilidade; dados não recriáveis precisam resistir à perda de uma AZ.`)
  if (req.maxRestoreHours !== undefined && info.requiresRestore) {
    const best = sc === 'DEEP_ARCHIVE' ? restoreHours(sc, 'standard') : restoreHours(sc, 'expedited')
    if (best > req.maxRestoreHours) v.push(`${info.name} leva até ${best} h para restaurar no tier mais rápido; o limite é ${req.maxRestoreHours} h.`)
  }
  if (req.singleDigitMs && sc !== 'EXPRESS_ONEZONE') v.push(`${info.name} não é projetada para latência consistente de um dígito de milissegundo.`)
  return v
}

export function monthlyCost(p: DataProfile, sc: StorageClassId, prices: RegionPrices): CostBreakdown {
  const info = STORAGE_CLASSES[sc]
  const notes: string[] = []
  const gb = dataGB(p)
  let storage = 0
  let monitoring = 0
  let billedGB = gb

  if (sc === 'INTELLIGENT_TIERING') {
    const share = p.intelligentTieringShare ?? { frequent: 1, infrequent: 0, archiveInstant: 0 }
    const t = prices.intelligentTiering.tierGBMonth
    if (p.avgObjectKB < 128) {
      storage = gb * t.frequent
      notes.push('Objetos menores que 128 KB não são monitorados: ficam sempre no tier Frequent Access e não pagam monitoramento.')
    } else {
      storage = gb * (share.frequent * t.frequent + share.infrequent * t.infrequent + share.archiveInstant * t.archiveInstant)
      monitoring = (p.objectCount / 1000) * prices.intelligentTiering.monitoringPer1000Objects
    }
  } else {
    const perObjectKB = Math.max(p.avgObjectKB, info.minBillableKB)
    billedGB = (p.objectCount * perObjectKB) / KB_PER_GB
    storage = billedGB * prices.storageGBMonth[sc]
    if (info.minBillableKB > 0 && p.avgObjectKB < info.minBillableKB) notes.push(`Cada objeto é cobrado como ${info.minBillableKB} KB nesta classe.`)
    if (info.archiveOverheadKB) {
      const selfGB = (p.objectCount * info.archiveOverheadKB.self) / KB_PER_GB
      const stdGB = (p.objectCount * info.archiveOverheadKB.standard) / KB_PER_GB
      storage += selfGB * prices.storageGBMonth[sc] + stdGB * prices.storageGBMonth.STANDARD
      billedGB += selfGB + stdGB
      notes.push('Cada objeto arquivado soma 40 KB de metadados: 32 KB no preço da classe e 8 KB no preço do S3 Standard.')
    }
  }

  let requests = (p.putsPerMonth / 1000) * prices.putPer1000[sc] + (p.getsPerMonth / 1000) * prices.getPer1000[sc]
  let retrieval = 0
  const tier = p.restoreTier ?? 'standard'
  if (sc === 'STANDARD_IA' || sc === 'ONEZONE_IA' || sc === 'GLACIER_IR' || sc === 'EXPRESS_ONEZONE') {
    retrieval = p.retrievedGBPerMonth * prices.retrievalPerGB[sc]
  }
  if (sc === 'EXPRESS_ONEZONE') {
    retrieval += ((p.putsPerMonth * p.avgObjectKB) / KB_PER_GB) * prices.expressUploadPerGB
  }
  if (sc === 'GLACIER' || sc === 'DEEP_ARCHIVE') {
    const effTier: RestoreTier = sc === 'DEEP_ARCHIVE' && tier === 'expedited' ? 'standard' : tier
    if (sc === 'DEEP_ARCHIVE' && tier === 'expedited') notes.push('O S3 Glacier Deep Archive não oferece restauração Expedited; o cálculo usa Standard.')
    const key = `${sc === 'GLACIER' ? 'GLACIER' : 'DEEP_ARCHIVE'}_${effTier.toUpperCase()}` as keyof RegionPrices['restoreRequestPer1000']
    retrieval = p.retrievedGBPerMonth * prices.retrievalPerGB[key]
    requests += ((p.restoresPerMonth ?? 0) / 1000) * prices.restoreRequestPer1000[key]
    if (p.retrievedGBPerMonth > 0) notes.push('Ler dados arquivados exige restaurar uma cópia temporária antes do GET.')
  }

  let earlyDeletion = 0
  if (p.retentionDays !== undefined && info.minStorageDays > 0 && p.retentionDays < info.minStorageDays) {
    // Regime estável: por mês é excluído (e reposto) o volume armazenado × 30 / retenção.
    const deletedGBPerMonth = billedGB * (DAYS_PER_MONTH / p.retentionDays)
    const missingMonths = (info.minStorageDays - p.retentionDays) / DAYS_PER_MONTH
    earlyDeletion = deletedGBPerMonth * missingMonths * prices.storageGBMonth[sc]
    notes.push(`Objetos excluídos com ${p.retentionDays} dias pagam o restante da duração mínima de ${info.minStorageDays} dias.`)
  }

  const transfer = (p.dataTransferOutGBPerMonth ?? 0) * prices.dataTransferOutPerGB
  const total = storage + requests + retrieval + monitoring + earlyDeletion + transfer
  return {
    storageClass: sc,
    storage,
    requests,
    retrieval,
    monitoring,
    earlyDeletion,
    transfer,
    total,
    billedGB,
    violations: requirementViolations(sc, p.requirements),
    notes,
  }
}

export function compareClasses(p: DataProfile, prices: RegionPrices, classes: StorageClassId[]): CostBreakdown[] {
  return classes.map((sc) => monthlyCost(p, sc, prices))
}

/** Classe mais barata entre as que atendem a todos os requisitos. */
export function cheapestCompliant(p: DataProfile, prices: RegionPrices, classes: StorageClassId[]): CostBreakdown | null {
  const ok = compareClasses(p, prices, classes).filter((c) => c.violations.length === 0)
  return ok.length === 0 ? null : ok.reduce((a, b) => (b.total < a.total ? b : a))
}

/** Custo de transições de lifecycle para N objetos. */
export function transitionCost(objects: number, target: keyof RegionPrices['transitionPer1000'], prices: RegionPrices): number {
  return (objects / 1000) * prices.transitionPer1000[target]
}

export function formatUSD(n: number): string {
  const digits = n !== 0 && Math.abs(n) < 1 ? 4 : 2
  return `US$ ${n.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: digits })}`
}
