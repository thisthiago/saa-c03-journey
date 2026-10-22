/**
 * Simulador do Amazon EFS: quem alcança os arquivos quando uma zona de
 * disponibilidade cai, e quanto custa o mês com cada modo de vazão e cada
 * política de ciclo de vida.
 *
 * Conferido em 22/10/2026:
 * - Tipos de sistema de arquivos: Regional guarda os dados em várias AZs e
 *   continua disponível com uma AZ fora; One Zone guarda numa AZ só e pode
 *   perder os dados se a AZ for perdida
 *   (https://docs.aws.amazon.com/efs/latest/ug/features.html).
 * - Mount targets: no Regional, um por AZ; no One Zone, um só, na AZ do
 *   sistema de arquivos; acessar de outra AZ gera cobrança de acesso a dados
 *   (https://docs.aws.amazon.com/efs/latest/ug/manage-fs-access.html).
 * - Vazão: Elastic cobra por GB lido e gravado; Provisioned cobra o que passa
 *   da base incluída pelo armazenamento na classe Standard; Bursting tem base
 *   de 50 KiB/s por GiB na Standard e rajada de 100 KiB/s por GiB, com mínimo
 *   de 100 MiB/s (https://docs.aws.amazon.com/efs/latest/ug/performance.html).
 * - Classes: Standard, Infrequent Access e Archive; o Archive só existe com
 *   vazão Elastic; leituras das classes frias são cobradas por GB
 *   (https://docs.aws.amazon.com/efs/latest/ug/features.html,
 *   https://docs.aws.amazon.com/efs/latest/ug/lifecycle-management-efs.html).
 *
 * Simplificações: 1 GB vale 1 GiB nas contas; a vazão média e o pico
 * resumem a carga (os créditos de rajada não são simulados minuto a minuto,
 * e as leituras não têm o desconto de medição); a cobrança única da
 * transição entre classes fica de fora.
 */
import type { FilesRegionPrices } from '../files-prices'

export type EfsType = 'regional' | 'one-zone'

export interface EfsTopology {
  type: EfsType
  /** AZs com mount target. No One Zone, só a AZ do sistema de arquivos. */
  mountAzs: string[]
}

export type AccessOutcome = 'ok' | 'ok-cross-az' | 'no-access'

export const ACCESS_LABEL: Record<AccessOutcome, string> = {
  ok: 'acessa pelo mount target da própria AZ',
  'ok-cross-az': 'acessa pelo mount target de outra AZ, pagando o acesso entre zonas',
  'no-access': 'perde o acesso aos arquivos',
}

/** O que acontece com um servidor na AZ `clientAz` quando `failedAz` cai (ou sem falha). */
export function clientAccess(t: EfsTopology, clientAz: string, failedAz?: string): { outcome: AccessOutcome; why: string } {
  if (t.mountAzs.length === 0) return { outcome: 'no-access', why: 'O sistema de arquivos não tem mount target, então nenhum servidor consegue montá-lo.' }
  if (failedAz === clientAz) return { outcome: 'no-access', why: 'O próprio servidor está na AZ que caiu.' }
  if (t.type === 'one-zone') {
    const home = t.mountAzs[0]
    if (failedAz === home) return { outcome: 'no-access', why: `O One Zone guarda os dados só na AZ ${home}. Com ela fora, ninguém alcança os arquivos, e os dados podem ser perdidos.` }
    if (clientAz === home) return { outcome: 'ok', why: `O servidor está na AZ do sistema de arquivos (${home}).` }
    return { outcome: 'ok-cross-az', why: `O One Zone aceita um só mount target, na AZ ${home}; o servidor da AZ ${clientAz} acessa de outra zona e paga por isso.` }
  }
  if (t.mountAzs.includes(clientAz)) return { outcome: 'ok', why: `Há mount target na AZ ${clientAz}, e o Regional guarda os dados em várias AZs.` }
  const alive = t.mountAzs.filter((a) => a !== failedAz)
  if (alive.length === 0) return { outcome: 'no-access', why: `A AZ ${clientAz} não tem mount target, e o único que existia ficou na AZ que caiu.` }
  return { outcome: 'ok-cross-az', why: `A AZ ${clientAz} não tem mount target; o servidor usa o da AZ ${alive[0]} e paga o acesso entre zonas.` }
}

// --- Custo ------------------------------------------------------------------

export type ThroughputMode = 'elastic' | 'provisioned' | 'bursting'
export type Lifecycle = 'none' | 'ia' | 'ia-archive'

export const THROUGHPUT_LABEL: Record<ThroughputMode, string> = { elastic: 'Elastic', provisioned: 'Provisioned', bursting: 'Bursting' }
export const LIFECYCLE_LABEL: Record<Lifecycle, string> = {
  none: 'Tudo na Standard',
  ia: 'Infrequent Access depois de 30 dias',
  'ia-archive': 'Infrequent Access depois de 30 dias e Archive depois de 90',
}

/** Carga de um sistema de arquivos Regional ao longo de um mês (premissa do cenário). */
export interface EfsUsage {
  storageGB: number
  /** Fração dos dados sem acesso há 30 dias ou mais. */
  idle30Share: number
  /** Fração dos dados sem acesso há 90 dias ou mais (parte da anterior). */
  idle90Share: number
  /** GB lidos por mês de arquivos que estariam no Infrequent Access. */
  coldReadGB: number
  /** GB lidos por mês de arquivos que estariam no Archive. */
  archiveReadGB: number
  /** GB lidos e gravados por mês, no total. */
  readGB: number
  writeGB: number
  /** Vazão média e de pico (MiB/s). */
  avgMiBps: number
  peakMiBps: number
}

export interface EfsCost {
  valid: boolean
  meets: boolean
  /** Por que a combinação é recusada ou não atende. */
  reason?: string
  storage: number
  access: number
  throughput: number
  total: number
  standardGB: number
  baselineMiBps: number
}

const round2 = (n: number) => Math.round(n * 100) / 100
const mib = (n: number) => n.toLocaleString('pt-BR', { maximumFractionDigits: 1 })

export const fmtUsd = (n: number) => `US$ ${n.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
/** Preço unitário, com até quatro casas (ex.: US$ 0,016). */
export const fmtPrice = (n: number) => `US$ ${n.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 4 })}`

/** Base da vazão Bursting (MiB/s): 50 KiB/s por GiB na Standard, com mínimo de 1 MiB/s. */
export const burstingBaseline = (standardGB: number) => Math.max(1, (standardGB * 50) / 1024)
/** Rajada da vazão Bursting (MiB/s): 100 KiB/s por GiB na Standard, com mínimo de 100 MiB/s. */
export const burstingPeak = (standardGB: number) => Math.max(100, (standardGB * 100) / 1024)

export function efsMonthlyCost(u: EfsUsage, mode: ThroughputMode, lifecycle: Lifecycle, p: FilesRegionPrices['efs']): EfsCost {
  const archiveGB = lifecycle === 'ia-archive' ? u.storageGB * u.idle90Share : 0
  const iaGB = lifecycle === 'none' ? 0 : u.storageGB * u.idle30Share - archiveGB
  const standardGB = u.storageGB - iaGB - archiveGB
  const iaPrice = mode === 'elastic' ? p.iaElastic : p.ia
  const storage = standardGB * p.standard + iaGB * iaPrice + archiveGB * p.archive
  const access = lifecycle === 'none' ? 0 : lifecycle === 'ia' ? (u.coldReadGB + u.archiveReadGB) * p.iaRead : u.coldReadGB * p.iaRead + u.archiveReadGB * p.archiveRead
  const baselineMiBps = burstingBaseline(standardGB)
  let throughput = 0
  let meets = true
  let reason: string | undefined
  if (mode === 'elastic') throughput = u.readGB * p.elasticRead + u.writeGB * p.elasticWrite
  else if (mode === 'provisioned') {
    throughput = Math.max(0, u.peakMiBps - baselineMiBps) * p.provisionedMiBpsMonth
    if (u.peakMiBps <= baselineMiBps) {
      meets = false
      reason = `A base de ${mib(baselineMiBps)} MiB/s que a Standard já dá cobre o pico: provisionar não acrescenta nada, e o Bursting entrega o mesmo.`
    }
  }
  else {
    const peak = burstingPeak(standardGB)
    if (u.avgMiBps > baselineMiBps) {
      meets = false
      reason = `Com ${Math.round(standardGB).toLocaleString('pt-BR')} GB na Standard, a base do Bursting é de ${mib(baselineMiBps)} MiB/s, abaixo da média de ${mib(u.avgMiBps)} MiB/s: os créditos acabam.`
    } else if (u.peakMiBps > peak) {
      meets = false
      reason = `A rajada do Bursting chega a ${mib(peak)} MiB/s, abaixo do pico de ${mib(u.peakMiBps)} MiB/s.`
    }
  }
  const valid = !(lifecycle === 'ia-archive' && mode !== 'elastic')
  if (!valid) reason = 'O Archive só existe com vazão Elastic.'
  return { valid, meets, reason, storage: round2(storage), access: round2(access), throughput: round2(throughput), total: round2(storage + access + throughput), standardGB, baselineMiBps }
}

export const THROUGHPUT_MODES: ThroughputMode[] = ['elastic', 'provisioned', 'bursting']
export const LIFECYCLES: Lifecycle[] = ['none', 'ia', 'ia-archive']

/** A combinação válida mais barata que atende à carga. Lança erro se duas ficarem a menos de 1% uma da outra. */
export function cheapestEfs(u: EfsUsage, p: FilesRegionPrices['efs'], modes: ThroughputMode[] = THROUGHPUT_MODES, lifecycles: Lifecycle[] = LIFECYCLES) {
  const all = modes.flatMap((mode) => lifecycles.map((lifecycle) => ({ mode, lifecycle, cost: efsMonthlyCost(u, mode, lifecycle, p) })))
  const ok = all.filter((x) => x.cost.valid && x.cost.meets).sort((a, b) => a.cost.total - b.cost.total)
  if (ok.length === 0) throw new Error('Nenhuma combinação atende à carga')
  if (ok[1] && ok[1].cost.total - ok[0].cost.total < ok[0].cost.total * 0.01) throw new Error(`Empate entre ${ok[0].mode}/${ok[0].lifecycle} e ${ok[1].mode}/${ok[1].lifecycle}`)
  return { best: ok[0], all }
}
