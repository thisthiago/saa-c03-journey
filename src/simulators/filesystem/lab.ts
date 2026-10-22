/**
 * Laboratório "O sistema de arquivos certo": para cada carga, o tipo do EFS e
 * os mount targets (modo `access`), ou o modo de vazão e a política de ciclo
 * de vida mais baratos que atendem à carga (modo `cost`).
 */
import { filesPrices } from '../files-prices'
import { evaluateGrid, gridComplete, gridSolution, type GridColumn, type GridExpected, type GridResponse, type GridRow } from '../shared/grid'
import { ACCESS_LABEL, cheapestEfs, clientAccess, efsMonthlyCost, fmtPrice, fmtUsd, LIFECYCLE_LABEL, THROUGHPUT_LABEL, type EfsUsage } from './model'

export interface EfsWorkload {
  id: string
  label: string
  /** Contexto da carga (RichText), mostrado antes dos números. */
  detail?: string
  /** Modo `access`: AZs com servidores e se os arquivos precisam continuar acessíveis com uma AZ fora. */
  clientAzs?: string[]
  mustSurviveAz?: boolean
  /** Modo `cost`: a carga do mês (premissa do cenário). */
  usage?: EfsUsage
  concepts?: string[]
}

export interface FilesystemLabConfig {
  mode: 'access' | 'cost'
  workloads: EfsWorkload[]
  region?: string
}

export type FilesystemLabResponse = GridResponse

const num = (n: number) => n.toLocaleString('pt-BR', { maximumFractionDigits: 1 })
const pct = (n: number) => `${Math.round(n * 100)}%`

export const filesystemColumns = (c: FilesystemLabConfig): GridColumn[] =>
  c.mode === 'access'
    ? [
        { id: 'type', label: 'Tipo do sistema de arquivos', options: [{ id: 'regional', label: 'Regional' }, { id: 'one-zone', label: 'One Zone' }] },
        { id: 'mounts', label: 'Mount targets', options: [{ id: 'one', label: 'Um só, numa AZ' }, { id: 'each', label: 'Um em cada AZ com servidores' }] },
      ]
    : [
        { id: 'throughput', label: 'Modo de vazão', options: (['elastic', 'provisioned', 'bursting'] as const).map((m) => ({ id: m, label: THROUGHPUT_LABEL[m] })) },
        { id: 'lifecycle', label: 'Ciclo de vida', options: (['none', 'ia', 'ia-archive'] as const).map((l) => ({ id: l, label: LIFECYCLE_LABEL[l] })) },
      ]

export function describeUsage(u: EfsUsage) {
  return [
    `${num(u.storageGB)} GB, com ${pct(u.idle30Share)} sem acesso há 30 dias ou mais e ${pct(u.idle90Share)} há 90 dias ou mais`,
    `lê ${num(u.readGB)} GB e grava ${num(u.writeGB)} GB por mês; das leituras, ${num(u.coldReadGB)} GB são de arquivos parados há 30 dias e ${num(u.archiveReadGB)} GB de arquivos parados há 90`,
    `vazão média de ${num(u.avgMiBps)} MiB/s e picos de ${num(u.peakMiBps)} MiB/s`,
  ].join('; ')
}

function describeAccess(w: EfsWorkload) {
  const azs = w.clientAzs ?? []
  return [`Servidores ${azs.length > 1 ? `nas AZs ${azs.join(', ')}` : `na AZ ${azs[0]}`}`, w.mustSurviveAz ? 'os arquivos precisam continuar acessíveis se uma AZ cair' : 'os dados podem ser recriados, e a carga pode parar se a AZ cair'].join('; ')
}

export const filesystemRows = (c: FilesystemLabConfig): GridRow[] =>
  c.workloads.map((w) => ({
    id: w.id,
    label: `**${w.label}**`,
    detail: [w.detail, `${c.mode === 'access' ? describeAccess(w) : describeUsage(w.usage!)}.`].filter(Boolean).join(' '),
    concepts: w.concepts,
  }))

function accessExpected(w: EfsWorkload): Record<string, GridExpected> {
  const azs = w.clientAzs ?? []
  const p = filesPrices().efs
  if (w.mustSurviveAz) {
    const single = clientAccess({ type: 'regional', mountAzs: [azs[0]] }, azs[1] ?? azs[0], azs[0])
    return {
      type: { answer: 'regional', why: 'Os arquivos precisam continuar acessíveis com uma AZ fora, e só o Regional guarda os dados em várias AZs.' },
      mounts: {
        answer: 'each',
        why: `Com um só mount target na AZ ${azs[0]}, se ela cair, o servidor da AZ ${azs[1] ?? azs[0]} ${ACCESS_LABEL[single.outcome]}. Um mount target em cada AZ com servidores evita isso e o acesso pago entre zonas.`,
      },
    }
  }
  return {
    type: { answer: 'one-zone', why: `A carga pode parar e os dados podem ser recriados: o One Zone custa ${fmtPrice(p.standardOneZone)} por GB-mês na Standard, contra ${fmtPrice(p.standard)} do Regional.` },
    mounts: {
      answer: 'one',
      why: azs.length > 1 ? `O One Zone aceita um só mount target, na AZ do sistema de arquivos; os servidores das outras AZs acessam por ele e pagam o acesso entre zonas.` : 'O One Zone aceita um só mount target, na AZ do sistema de arquivos, que é a AZ dos servidores.',
    },
  }
}

function costExpected(c: FilesystemLabConfig, w: EfsWorkload): Record<string, GridExpected> {
  const p = filesPrices(c.region).efs
  const u = w.usage!
  const { best, all } = cheapestEfs(u, p)
  const parts = `${fmtUsd(best.cost.total)} por mês (armazenamento ${fmtUsd(best.cost.storage)}, leituras das classes frias ${fmtUsd(best.cost.access)}, vazão ${fmtUsd(best.cost.throughput)})`
  const line = (label: string, x: (typeof all)[number]) => `${label}: ${!x.cost.valid || !x.cost.meets ? x.cost.reason!.replace(/\.$/, '') : `${fmtUsd(x.cost.total)} por mês`}.`
  const rejected = all.filter((x) => x.mode !== best.mode && x.lifecycle === best.lifecycle).map((x) => line(THROUGHPUT_LABEL[x.mode], x))
  const otherLife = all.filter((x) => x.mode === best.mode && x.lifecycle !== best.lifecycle).map((x) => line(LIFECYCLE_LABEL[x.lifecycle], x))
  return {
    throughput: { answer: best.mode, why: `A combinação mais barata que atende sai por ${parts}. ${rejected.join(' ')}` },
    lifecycle: { answer: best.lifecycle, why: `Com ${THROUGHPUT_LABEL[best.mode]}, os outros ciclos de vida ficam assim: ${otherLife.join(' ')}` },
  }
}

export function filesystemExpected(c: FilesystemLabConfig) {
  return (row: GridRow): Record<string, GridExpected> => {
    const w = c.workloads.find((x) => x.id === row.id)!
    return c.mode === 'access' ? accessExpected(w) : costExpected(c, w)
  }
}

/** Custo da combinação escolhida para uma carga (mostrado na interface do modo `cost`). */
export function chosenCost(c: FilesystemLabConfig, w: EfsWorkload, r: FilesystemLabResponse) {
  const a = r?.answers?.[w.id]
  if (!w.usage || !a?.throughput || !a?.lifecycle) return null
  return efsMonthlyCost(w.usage, a.throughput as never, a.lifecycle as never, filesPrices(c.region).efs)
}

export const filesystemSolution = (c: FilesystemLabConfig) => gridSolution(filesystemColumns(c), filesystemRows(c), filesystemExpected(c))
export const evaluateFilesystemLab = (c: FilesystemLabConfig, r: FilesystemLabResponse) => evaluateGrid(filesystemColumns(c), filesystemRows(c), filesystemExpected(c), r)
export const filesystemComplete = (c: FilesystemLabConfig, r: FilesystemLabResponse) => gridComplete(filesystemColumns(c), filesystemRows(c), r)
