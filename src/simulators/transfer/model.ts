/**
 * Calculadora de migração de dados: tempo pela rede e viabilidade de cada opção.
 *
 * Conferido em 16/10/2026:
 *  - https://docs.aws.amazon.com/snowball/latest/developer-guide/snowball-edge-availability-change.html
 *    (Snowball Edge sem novos clientes; alternativas DataSync, Data Transfer Terminal, parceiros, Outposts;
 *    uma tarefa do DataSync consegue usar 10 Gbps; Direct Connect hospedado para links insuficientes)
 *  - https://docs.aws.amazon.com/datatransferterminal/latest/userguide/what-is-dtt.html
 *    (disponível no momento apenas para clientes AWS Enterprise Support)
 *
 * Simplificações: tempo = volume × 8 ÷ (banda disponível × 80% de aproveitamento); TB decimal
 * (10¹² bytes); prazos de provisionamento e de logística são premissas de cada cenário, não dados da AWS.
 */

export type TransferMethod = 'internet-cli' | 'datasync-internet' | 'datasync-dx' | 'terminal' | 'snowball'

export const EFFICIENCY = 0.8
const DATASYNC_TASK_GBPS = 10

export interface TransferScenario {
  id: string
  name: string
  description: string
  dataTB: number
  /** Banda do link de internet (Mbps). */
  linkMbps: number
  /** Fração do link que pode ser usada sem prejudicar o negócio. */
  usableShare: number
  deadlineDays: number
  /** A empresa tem AWS Enterprise Support (requisito atual do Data Transfer Terminal). */
  enterpriseSupport: boolean
  /** A empresa nunca usou a AWS Snow Family. */
  newSnowCustomer: boolean
  /** Os dados continuam mudando até a virada: é preciso sincronizar mudanças. */
  ongoingChanges: boolean
  /** Premissa do cenário: banda e prazo para ter uma conexão hospedada do Direct Connect. */
  directConnect?: { gbps: number; leadDays: number }
  /** Premissa do cenário: dias para levar os discos ao terminal e copiar. */
  terminalDays?: number
  concepts?: string[]
}

export const METHOD_LABEL: Record<TransferMethod, string> = {
  'internet-cli': 'Upload pela internet (AWS CLI)',
  'datasync-internet': 'AWS DataSync pela internet',
  'datasync-dx': 'AWS DataSync + AWS Direct Connect (conexão hospedada)',
  terminal: 'AWS Data Transfer Terminal',
  snowball: 'AWS Snowball Edge (Snow Family)',
}

export interface TransferEstimate {
  method: TransferMethod
  available: boolean
  days: number | null
  meetsDeadline: boolean
  handlesChanges: boolean
  ok: boolean
  notes: string[]
}

/** Dias para transferir `tb` terabytes a `mbps` megabits por segundo, com o aproveitamento padrão. */
export function networkDays(tb: number, mbps: number): number {
  const bits = tb * 1e12 * 8
  return bits / (mbps * 1e6 * EFFICIENCY) / 86400
}

export function estimateTransfer(s: TransferScenario, m: TransferMethod): TransferEstimate {
  const notes: string[] = []
  let available = true
  let days: number | null = null
  let handlesChanges = false
  const usableMbps = s.linkMbps * s.usableShare

  switch (m) {
    case 'internet-cli':
      days = networkDays(s.dataTB, usableMbps)
      notes.push(`${s.dataTB} TB a ${Math.round(usableMbps)} Mbps úteis (${EFFICIENCY * 100}% de aproveitamento).`)
      notes.push('Scripts de cópia não verificam integridade nem transferem só o que mudou: cada nova rodada exige controle manual.')
      break
    case 'datasync-internet':
      days = networkDays(s.dataTB, Math.min(usableMbps, DATASYNC_TASK_GBPS * 1000))
      handlesChanges = true
      notes.push(`${s.dataTB} TB a ${Math.round(usableMbps)} Mbps úteis.`, 'Transferências incrementais, validação de dados e criptografia em trânsito.')
      break
    case 'datasync-dx':
      if (!s.directConnect) {
        available = false
        notes.push('Nenhuma conexão do Direct Connect foi considerada neste cenário.')
        break
      }
      days = s.directConnect.leadDays + networkDays(s.dataTB, s.directConnect.gbps * 1000)
      handlesChanges = true
      notes.push(`Premissa do cenário: ${s.directConnect.leadDays} dias para ter a conexão de ${s.directConnect.gbps} Gbps + transferência.`, 'Transferências incrementais pelo DataSync.')
      break
    case 'terminal':
      if (!s.enterpriseSupport) {
        available = false
        notes.push('No momento, o Data Transfer Terminal está disponível apenas para clientes AWS Enterprise Support.')
        break
      }
      days = s.terminalDays ?? null
      notes.push(`Premissa do cenário: ${s.terminalDays} dia(s) para levar os discos ao terminal e copiar.`, 'É uma cópia pontual: mudanças posteriores precisam de outro mecanismo (como o DataSync).')
      break
    case 'snowball':
      if (s.newSnowCustomer) {
        available = false
        notes.push('A AWS não oferece mais dispositivos da Snow Family a novos clientes.')
      } else {
        notes.push('Clientes existentes da Snow Family continuam atendidos, mas a AWS recomenda avaliar as alternativas.')
        days = s.terminalDays ?? null
      }
      break
  }
  const meetsDeadline = days !== null && days <= s.deadlineDays
  if (days !== null && !meetsDeadline) notes.push(`Leva cerca de ${formatDays(days)}; o prazo é de ${s.deadlineDays} dias.`)
  if (s.ongoingChanges && !handlesChanges && available) notes.push('Os dados continuam mudando até a virada: falta um mecanismo de sincronização incremental.')
  const ok = available && meetsDeadline && (!s.ongoingChanges || handlesChanges)
  return { method: m, available, days, meetsDeadline, handlesChanges, ok, notes }
}

export function formatDays(d: number): string {
  if (d < 1) return `${Math.max(1, Math.round(d * 24))} h`
  return `${d.toLocaleString('pt-BR', { maximumFractionDigits: d < 10 ? 1 : 0 })} dias`
}
