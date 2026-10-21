/**
 * CloudTrail: onde um evento da conta fica registrado e quanto custa registrá-lo.
 *
 * Fatos conferidos em 21/10/2026:
 * - Histórico de eventos: 90 dias de eventos de gerenciamento, por Região, sem custo, ligado em toda conta: https://docs.aws.amazon.com/awscloudtrail/latest/userguide/view-cloudtrail-events.html
 * - Eventos de gerenciamento (ligados por padrão em trilhas), de dados (desligados por padrão, com custo), Insights e de atividade de rede: https://docs.aws.amazon.com/awscloudtrail/latest/userguide/logging-management-events-with-cloudtrail.html e https://docs.aws.amazon.com/awscloudtrail/latest/userguide/logging-data-events-with-cloudtrail.html
 * - Trilhas (uma cópia dos eventos de gerenciamento sem custo da CloudTrail, S3, CloudWatch Logs e EventBridge opcionais; de uma Região ou de todas; da organização): https://docs.aws.amazon.com/awscloudtrail/latest/userguide/cloudtrail-trails.html
 * - Trilha da organização: https://docs.aws.amazon.com/awscloudtrail/latest/userguide/creating-trail-organization.html
 * - Validação de integridade (resumos assinados, a cada hora): https://docs.aws.amazon.com/awscloudtrail/latest/userguide/cloudtrail-log-file-validation-intro.html
 * - Insights (taxa de chamadas e de erros em relação à linha de base): https://docs.aws.amazon.com/awscloudtrail/latest/userguide/logging-insights-events-with-cloudtrail.html
 * - Preços de eventos de dados, cópias adicionais de eventos de gerenciamento e eventos do Insights: governance-prices.json (AWS Price List).
 *
 * Premissas do simulador (declaradas na interface): o volume de eventos de
 * cada cenário e que o Insights analisa os eventos de gerenciamento.
 */
import { governancePrices } from '../governance-prices'

export type EventKind = 'management' | 'data'

export interface AccountEvent {
  id: string
  text: string
  kind: EventKind
  /** Evento de gravação (altera algo). Os de leitura só são registrados se a trilha pedir "todos" ou "leitura". */
  write: boolean
  region: string
  account: string
  /** Há quantos dias o evento aconteceu. */
  ageDays: number
  /** Eventos de dados: o recurso é do conjunto sensível (por exemplo, o bucket de prontuários). */
  sensitive?: boolean
}

export type ManagementScope = 'none' | 'write' | 'read' | 'all'
export type DataScope = 'none' | 'sensitive' | 'all'

export interface TrailSetup {
  id: string
  /** Região em que a trilha foi criada. */
  homeRegion: string
  multiRegion: boolean
  /** Trilha da organização: vale para todas as contas. */
  organization: boolean
  management: ManagementScope
  data: DataScope
  insights: boolean
  cloudWatchLogs: boolean
  validation: boolean
}

export const EMPTY_TRAIL: Omit<TrailSetup, 'id' | 'homeRegion'> = { multiRegion: false, organization: false, management: 'write', data: 'none', insights: false, cloudWatchLogs: false, validation: false }

/** Dias de eventos de gerenciamento que o histórico de eventos guarda. */
export const EVENT_HISTORY_DAYS = 90

export const MANAGEMENT_LABEL: Record<ManagementScope, string> = { none: 'Nenhum', write: 'Só gravação', read: 'Só leitura', all: 'Leitura e gravação' }
export const DATA_LABEL: Record<DataScope, string> = { none: 'Nenhum', sensitive: 'Só o bucket sensível', all: 'Todos os buckets' }

export function trailRecords(t: TrailSetup, e: AccountEvent, homeAccount: string): boolean {
  if (e.account !== homeAccount && !t.organization) return false
  if (!t.multiRegion && e.region !== t.homeRegion) return false
  if (e.kind === 'management') return t.management === 'all' || (t.management === 'write' && e.write) || (t.management === 'read' && !e.write)
  return t.data === 'all' || (t.data === 'sensitive' && Boolean(e.sensitive))
}

export interface EventLocation {
  /** Aparece no histórico de eventos (eventos de gerenciamento dos últimos 90 dias, na conta e na Região do evento). */
  history: boolean
  /** Ids das trilhas que o registram (os arquivos ficam no S3 por quanto tempo o bucket guardar). */
  trails: string[]
}

export function locateEvent(e: AccountEvent, trails: TrailSetup[], homeAccount: string): EventLocation {
  return {
    history: e.kind === 'management' && e.ageDays <= EVENT_HISTORY_DAYS && e.account === homeAccount,
    trails: trails.filter((t) => trailRecords(t, e, homeAccount)).map((t) => t.id),
  }
}

export type FoundIn = 'history' | 'trail' | 'both' | 'none'

export const FOUND_LABEL: Record<FoundIn, string> = {
  history: 'Só no histórico de eventos',
  trail: 'Só nos arquivos da trilha',
  both: 'No histórico de eventos e na trilha',
  none: 'Em lugar nenhum: o evento não foi registrado',
}

export function foundIn(e: AccountEvent, trails: TrailSetup[], homeAccount: string): FoundIn {
  const l = locateEvent(e, trails, homeAccount)
  const inTrail = l.trails.length > 0
  return l.history && inTrail ? 'both' : l.history ? 'history' : inTrail ? 'trail' : 'none'
}

// ---------------------------------------------------------------------------
// Requisitos e custo de uma trilha
// ---------------------------------------------------------------------------

export type TrailNeed = 'all-regions' | 'all-accounts' | 'management-write' | 'management-read' | 'data-sensitive' | 'integrity' | 'alerts' | 'anomalies' | 'long-retention'

export const NEED_LABEL: Record<TrailNeed, string> = {
  'all-regions': 'Registrar a atividade de todas as Regiões',
  'all-accounts': 'Registrar a atividade de todas as contas da organização',
  'management-write': 'Registrar quem cria, altera e apaga recursos',
  'management-read': 'Registrar também quem consulta recursos (leituras)',
  'data-sensitive': 'Registrar quem lê e apaga objetos do bucket sensível',
  integrity: 'Provar que os arquivos de log não foram alterados',
  alerts: 'Mandar os eventos ao CloudWatch Logs, para a equipe criar filtros de métrica e alarmes',
  anomalies: 'Detectar sozinha picos incomuns de chamadas de API',
  'long-retention': 'Guardar a atividade por mais de 90 dias',
}

export function needMet(need: TrailNeed, t: TrailSetup | undefined): boolean {
  if (!t) return false
  switch (need) {
    case 'all-regions':
      return t.multiRegion
    case 'all-accounts':
      return t.organization
    case 'management-write':
      return t.management === 'write' || t.management === 'all'
    case 'management-read':
      return t.management === 'read' || t.management === 'all'
    case 'data-sensitive':
      return t.data === 'sensitive' || t.data === 'all'
    case 'integrity':
      return t.validation
    case 'alerts':
      return t.cloudWatchLogs
    case 'anomalies':
      return t.insights
    case 'long-retention':
      // Uma trilha guarda os arquivos no S3 pelo tempo que o bucket mantiver; sem trilha, só valem os 90 dias do histórico.
      return true
  }
}

export interface TrailVolume {
  /** Eventos de dados do bucket sensível por mês. */
  sensitiveDataEvents: number
  /** Eventos de dados de todos os outros buckets por mês. */
  otherDataEvents: number
  /** Eventos de gerenciamento por mês (a primeira cópia não é cobrada pela CloudTrail). */
  managementEvents: number
}

export interface TrailCost {
  dataEvents: number
  insights: number
  total: number
}

export function trailMonthly(t: TrailSetup | undefined, v: TrailVolume, region?: string): TrailCost {
  const p = governancePrices(region).cloudtrail
  if (!t) return { dataEvents: 0, insights: 0, total: 0 }
  const events = t.data === 'none' ? 0 : t.data === 'sensitive' ? v.sensitiveDataEvents : v.sensitiveDataEvents + v.otherDataEvents
  const dataEvents = (events / 1e5) * p.dataEventPer100k
  const insights = t.insights ? (v.managementEvents / 1e5) * p.insightsEventPer100k : 0
  return { dataEvents, insights, total: dataEvents + insights }
}
