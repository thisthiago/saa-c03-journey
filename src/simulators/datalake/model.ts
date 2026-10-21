/**
 * Simulador do data lake: uma tabela guardada no S3 em formatos, compressões e
 * partições diferentes, e quanto dado cada consulta do Athena lê.
 *
 * Conferido em 21/10/2026:
 * - Parquet e ORC são colunares: a consulta lê só as colunas que usa, e o
 *   arquivo guarda estatísticas que permitem pular blocos
 *   (https://docs.aws.amazon.com/athena/latest/ug/columnar-storage.html).
 * - Com a partição no filtro (WHERE), o Athena lê só as partições escolhidas
 *   (https://docs.aws.amazon.com/athena/latest/ug/partitions.html).
 * - Muitos arquivos pequenos pioram as consultas; partição demais fragmenta o
 *   conjunto de dados; o Athena cobra os bytes lidos antes da descompressão
 *   (https://docs.aws.amazon.com/athena/latest/ug/performance-tuning-data-optimization-techniques.html).
 * - O Athena cobra por TB lido, arredondado para cima ao megabyte, com
 *   mínimo de 10 MB por consulta; DDL e consultas que falham não são
 *   cobradas. Exemplo da página de preços: 3 TB em texto custam US$ 15 por
 *   consulta, US$ 5 com GZIP (3:1) e US$ 1,25 em formato colunar lendo uma
 *   das quatro colunas (https://aws.amazon.com/athena/pricing/).
 *
 * Premissas do cenário: as taxas de compressão, o tamanho do JSON em relação
 * ao CSV, o mês de 30 dias e o limite de arquivo pequeno.
 */
import { regionPrices } from '../cost/prices'
import { analyticsPrices } from '../analytics-prices'

export type FileFormat = 'csv' | 'json' | 'parquet' | 'orc'
export type Compression = 'none' | 'snappy' | 'gzip' | 'zstd'
export type PartitionScheme = 'none' | 'month' | 'day' | 'day-store'

export const FORMAT_LABEL: Record<FileFormat, string> = { csv: 'CSV', json: 'JSON', parquet: 'Parquet', orc: 'ORC' }
export const COMPRESSION_LABEL: Record<Compression, string> = { none: 'sem compressão', snappy: 'Snappy', gzip: 'GZIP', zstd: 'ZSTD' }
const PARTITION_LABEL: Record<Exclude<PartitionScheme, 'day-store'>, string> = { none: 'sem partição', month: 'por mês', day: 'por dia' }

/** Unidade da segunda chave de partição (padrão: loja). */
export const unitOf = (t?: Pick<LakeTable, 'unit'>) => t?.unit ?? { one: 'loja', many: 'lojas' }

export const partitionLabel = (p: PartitionScheme, t?: Pick<LakeTable, 'unit'>) => (p === 'day-store' ? `por dia e por ${unitOf(t).one}` : PARTITION_LABEL[p])

export const FORMATS: FileFormat[] = ['csv', 'json', 'parquet', 'orc']
export const COMPRESSIONS: Compression[] = ['none', 'snappy', 'gzip', 'zstd']
export const PARTITIONS: PartitionScheme[] = ['none', 'month', 'day', 'day-store']

export const isColumnar = (f: FileFormat) => f === 'parquet' || f === 'orc'

/** Premissa: o JSON repete o nome de cada campo em todo registro e fica maior que o CSV. */
export const FORMAT_SIZE: Record<FileFormat, number> = { csv: 1, json: 1.6, parquet: 1, orc: 1 }

/** Premissa: quantas vezes cada compressão reduz o arquivo (o GZIP segue o 3:1 do exemplo da AWS). */
export const COMPRESSION_RATIO: Record<Compression, number> = { none: 1, snappy: 2, gzip: 3, zstd: 3 }

/** Premissa: partições com arquivos menores que isto, em média, contam como "arquivos pequenos demais". */
export const SMALL_FILE_MB = 64

/** Premissa: meses de 30 dias. */
export const DAYS_PER_MONTH = 30

/** Mínimo cobrado por consulta pelo Athena. */
export const ATHENA_MIN_MB = 10

const GB_PER_TB = 1024
const MB_PER_GB = 1024

export interface LakeColumn {
  id: string
  label: string
  /** Fração do tamanho de cada registro ocupada pela coluna (a soma da tabela é 1). */
  share: number
}

export interface LakeQuery {
  id: string
  label: string
  /** Execuções por mês. */
  perMonth: number
  columns: string[]
  /** Filtra os últimos N dias; sem valor, lê o período inteiro. */
  days?: number
  /** Filtra uma loja só. */
  oneStore?: boolean
}

export interface LakeTable {
  id: string
  name: string
  description: string
  /** Tamanho do período guardado, em CSV sem compressão. */
  csvGB: number
  /** Dias de dados guardados. */
  days: number
  /** Quantas unidades (lojas, centros) existem; é a segunda chave de partição possível. */
  stores: number
  unit?: { one: string; many: string }
  columns: LakeColumn[]
  queries: LakeQuery[]
  concepts?: string[]
}

export interface Layout {
  format: FileFormat
  compression: Compression
  partition: PartitionScheme
}

/** Tamanho guardado no S3, em GB. */
export function storedGB(t: LakeTable, l: Layout): number {
  return (t.csvGB * FORMAT_SIZE[l.format]) / COMPRESSION_RATIO[l.compression]
}

/** Quantas partições a tabela tem. */
export function partitionCount(t: LakeTable, p: PartitionScheme): number {
  if (p === 'none') return 1
  if (p === 'month') return Math.ceil(t.days / DAYS_PER_MONTH)
  if (p === 'day') return t.days
  return t.days * t.stores
}

/** Tamanho médio de arquivo por partição, em MB. */
export function avgPartitionMB(t: LakeTable, l: Layout): number {
  return (storedGB(t, l) * MB_PER_GB) / partitionCount(t, l.partition)
}

/** Fração da tabela que a consulta precisa abrir, pelas partições. */
export function partitionFraction(t: LakeTable, p: PartitionScheme, q: LakeQuery): number {
  const days = q.days ? Math.min(q.days, t.days) : t.days
  if (p === 'none') return 1
  if (p === 'month') return Math.min(1, (Math.ceil(days / DAYS_PER_MONTH) * DAYS_PER_MONTH) / t.days)
  const byDay = days / t.days
  return p === 'day-store' && q.oneStore ? byDay / t.stores : byDay
}

/** Fração de cada registro lida, pelas colunas: formatos em linha leem o registro inteiro. */
export function columnFraction(t: LakeTable, f: FileFormat, q: LakeQuery): number {
  if (!isColumnar(f)) return 1
  return t.columns.filter((c) => q.columns.includes(c.id)).reduce((s, c) => s + c.share, 0)
}

/** GB lidos por uma execução da consulta. */
export function scannedGB(t: LakeTable, l: Layout, q: LakeQuery): number {
  return storedGB(t, l) * partitionFraction(t, l.partition, q) * columnFraction(t, l.format, q)
}

/** Custo de uma execução no Athena: arredonda ao MB, com o mínimo de 10 MB. */
export function queryCost(scanned: number, region?: string): number {
  const mb = Math.max(ATHENA_MIN_MB, Math.ceil(scanned * MB_PER_GB - 1e-9))
  return (mb / MB_PER_GB / GB_PER_TB) * analyticsPrices(region).athena.perTBScanned
}

export interface LayoutCost {
  stored: number
  storage: number
  queries: { id: string; scanned: number; each: number; monthly: number }[]
  athena: number
  total: number
}

/** Custo mensal do layout: S3 Standard mais as consultas do Athena. */
export function layoutMonthly(t: LakeTable, l: Layout, region?: string): LayoutCost {
  const stored = storedGB(t, l)
  const storage = stored * regionPrices(region).storageGBMonth.STANDARD
  const queries = t.queries.map((q) => {
    const scanned = scannedGB(t, l, q)
    const each = queryCost(scanned, region)
    return { id: q.id, scanned, each, monthly: each * q.perMonth }
  })
  const athena = queries.reduce((s, q) => s + q.monthly, 0)
  return { stored, storage, queries, athena, total: storage + athena }
}

/** Problemas que tornam o layout inadequado, independentemente do custo. */
export function layoutProblems(t: LakeTable, l: Layout): string[] {
  const out: string[] = []
  if (l.partition !== 'none') {
    const mb = avgPartitionMB(t, l)
    if (mb < SMALL_FILE_MB) out.push(`a partição ${partitionLabel(l.partition, t)} deixa arquivos de ${formatSize(mb / MB_PER_GB)} em média, pequenos demais`)
  }
  return out
}

export const allLayouts = (): Layout[] => FORMATS.flatMap((format) => COMPRESSIONS.flatMap((compression) => PARTITIONS.map((partition) => ({ format, compression, partition }))))

/** O layout sem problemas de menor custo mensal (o empate fica com o primeiro da lista). */
export function bestLayout(t: LakeTable, region?: string): { layout: Layout; cost: LayoutCost } {
  let best: { layout: Layout; cost: LayoutCost } | undefined
  for (const layout of allLayouts()) {
    if (layoutProblems(t, layout).length) continue
    const cost = layoutMonthly(t, layout, region)
    if (!best || cost.total < best.cost.total - 1e-9) best = { layout, cost }
  }
  return best!
}

export const describeLayout = (l: Layout, t?: Pick<LakeTable, 'unit'>) => `${FORMAT_LABEL[l.format]}, ${COMPRESSION_LABEL[l.compression]}, ${partitionLabel(l.partition, t)}`

/** Tamanho legível: TB, GB ou MB. */
export function formatSize(gb: number): string {
  const fmt = (v: number) => v.toLocaleString('pt-BR', { maximumFractionDigits: v < 10 ? 2 : v < 100 ? 1 : 0 })
  if (gb >= GB_PER_TB) return `${fmt(gb / GB_PER_TB)} TB`
  if (gb >= 1) return `${fmt(gb)} GB`
  return `${fmt(gb * MB_PER_GB)} MB`
}
