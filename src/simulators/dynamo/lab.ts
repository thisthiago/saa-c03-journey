/** Laboratório de modelagem do DynamoDB: chaves que atendem ao acesso sem partição quente, modo e capacidade. */
import type { ItemFeedback } from '../../engine/types'
import { usd } from '../compute-prices'
import { cheaperMode, hotPartition, MODE_LABEL, neededCapacity, onDemandMonthly, provisionedMonthly, readUnits, writeUnits, type CapacityMode, type KeyValue, type TableLoad } from './model'

export interface PartitionKeyOption {
  id: string
  attribute: string
  /** Como os valores se distribuem no tráfego (o mais acessado decide a partição quente). */
  keys: KeyValue[]
  /** A chave permite buscar os itens do padrão de acesso com uma Query. */
  servesPattern: boolean
  note: string
}

export interface SortKeyOption {
  id: string
  attribute: string
  servesPattern: boolean
  note: string
}

export interface DdbTableScenario {
  id: string
  name: string
  description: string
  /** O acesso principal, em palavras. */
  accessPattern: string
  load: TableLoad
  partitionKeys: PartitionKeyOption[]
  sortKeys: SortKeyOption[]
  concepts?: string[]
}

export interface DdbKeysLabConfig {
  region?: string
  tables: DdbTableScenario[]
}

export interface DdbTableChoice {
  pk?: string
  sk?: string
  mode?: CapacityMode
  rcu?: number
  wcu?: number
}

export interface DdbKeysLabResponse {
  tables: Record<string, DdbTableChoice | undefined>
}

/** Folga máxima aceita na capacidade provisionada (25% acima do pico). */
export const HEADROOM = 1.25

export function pkProblems(t: DdbTableScenario, pk: PartitionKeyOption): string[] {
  const out: string[] = []
  if (!pk.servesPattern) out.push(`${pk.attribute} não permite buscar ${t.accessPattern} com uma Query`)
  const r = hotPartition(pk.keys, t.load.peakReads, readUnits(t.load.itemKB, t.load.consistency), 'read')
  const w = hotPartition(pk.keys, t.load.peakWrites, writeUnits(t.load.itemKB, t.load.transactionalWrites), 'write')
  if (w.throttled) out.push(`o valor "${w.hottest.value}" concentra ${Math.round(w.hottest.units).toLocaleString('pt-BR')} unidades de escrita por segundo, acima das ${w.limit.toLocaleString('pt-BR')} de uma partição`)
  if (r.throttled) out.push(`o valor "${r.hottest.value}" concentra ${Math.round(r.hottest.units).toLocaleString('pt-BR')} unidades de leitura por segundo, acima das ${r.limit.toLocaleString('pt-BR')} de uma partição`)
  return out
}

export function correctKeys(t: DdbTableScenario): { pk: PartitionKeyOption; sk: SortKeyOption } {
  const pks = t.partitionKeys.filter((k) => pkProblems(t, k).length === 0)
  const sks = t.sortKeys.filter((k) => k.servesPattern)
  if (pks.length !== 1 || sks.length !== 1) throw new Error(`Tabela ${t.id}: chaves corretas não são únicas (${pks.length} partição, ${sks.length} ordenação)`)
  return { pk: pks[0], sk: sks[0] }
}

export function ddbKeysSolution(c: DdbKeysLabConfig): DdbKeysLabResponse {
  return {
    tables: Object.fromEntries(
      c.tables.map((t) => {
        const { pk, sk } = correctKeys(t)
        const mode = cheaperMode(t.load, c.region)
        const n = neededCapacity(t.load)
        return [t.id, mode === 'provisioned' ? { pk: pk.id, sk: sk.id, mode, rcu: n.rcu, wcu: n.wcu } : { pk: pk.id, sk: sk.id, mode }]
      }),
    ),
  }
}

export function choiceCost(t: DdbTableScenario, ch: DdbTableChoice, region?: string): number | undefined {
  if (ch.mode === 'on-demand') return onDemandMonthly(t.load, region).total
  if (ch.mode === 'provisioned') return provisionedMonthly(ch.rcu ?? 0, ch.wcu ?? 0, region).total
  return undefined
}

export function judgeTable(c: DdbKeysLabConfig, t: DdbTableScenario, ch: DdbTableChoice | undefined): { concepts?: string[]; score: number; fb: ItemFeedback }[] {
  const { pk: goodPk, sk: goodSk } = correctKeys(t)
  const pick = ch ?? {}
  const pk = t.partitionKeys.find((k) => k.id === pick.pk)
  const sk = t.sortKeys.find((k) => k.id === pick.sk)
  const keyOk = pk?.id === goodPk.id && sk?.id === goodSk.id
  const keyMsg = !pk
    ? `Escolha a chave de partição. ${goodPk.note}`
    : keyOk
      ? `${goodPk.note} ${goodSk.note}`
      : [pkProblems(t, pk).join('; '), sk && !sk.servesPattern ? sk.note : !sk ? 'Falta a chave de ordenação.' : ''].filter(Boolean).join('. ') + `. A combinação certa: ${goodPk.attribute} e ${goodSk.attribute}.`

  const best = cheaperMode(t.load, c.region)
  const od = onDemandMonthly(t.load, c.region).total
  const n = neededCapacity(t.load)
  const prov = provisionedMonthly(n.rcu, n.wcu, c.region).total
  const modeOk = pick.mode === best
  const modeMsg = `${MODE_LABEL['on-demand']}: ${usd(od)}/mês pela média do mês. ${MODE_LABEL.provisioned} cobrindo o pico (${n.rcu.toLocaleString('pt-BR')} RCU e ${n.wcu.toLocaleString('pt-BR')} WCU): ${usd(prov)}/mês.`

  const f = (v: number) => v.toLocaleString('pt-BR')
  let capOk: boolean
  let capMsg: string
  if (pick.mode === 'provisioned') {
    const rcu = pick.rcu ?? 0
    const wcu = pick.wcu ?? 0
    const enough = rcu >= n.rcu && wcu >= n.wcu
    const tight = rcu <= Math.ceil(n.rcu * HEADROOM) && wcu <= Math.ceil(n.wcu * HEADROOM)
    capOk = enough && tight
    capMsg = !enough
      ? `${f(rcu)} RCU e ${f(wcu)} WCU não cobrem o pico, que pede ${f(n.rcu)} RCU e ${f(n.wcu)} WCU: as requisições acima disso sofrem throttling.`
      : !tight
        ? `Cobre o pico, mas com folga demais: o pico pede ${f(n.rcu)} RCU e ${f(n.wcu)} WCU, e a capacidade provisionada é cobrada mesmo sem uso.`
        : `Cobre o pico de ${f(n.rcu)} RCU e ${f(n.wcu)} WCU sem pagar folga demais.`
  } else if (pick.mode === 'on-demand') {
    // No modo sob demanda não há capacidade para errar; o custo já é avaliado no item do modo.
    capOk = true
    capMsg = 'No modo sob demanda não há capacidade para definir: a tabela acompanha o tráfego.'
  } else {
    capOk = false
    capMsg = 'Escolha o modo de capacidade.'
  }
  const status = (ok: boolean, missing: boolean) => (ok ? 'correct' : missing ? 'missed' : 'wrong') as ItemFeedback['status']
  return [
    { concepts: t.concepts, score: keyOk ? 1 : 0, fb: { id: `${t.id}:keys`, label: `${t.name}: chaves`, status: status(keyOk, !pk), message: keyMsg } },
    { concepts: t.concepts, score: modeOk ? 1 : 0, fb: { id: `${t.id}:mode`, label: `${t.name}: modo ${pick.mode ? MODE_LABEL[pick.mode].toLowerCase() : 'não escolhido'}`, status: status(modeOk, !pick.mode), message: `${modeOk ? 'É o mais barato para esta carga.' : `O mais barato aqui é ${MODE_LABEL[best].toLowerCase()}.`} ${modeMsg}` } },
    { concepts: t.concepts, score: capOk ? 1 : 0, fb: { id: `${t.id}:capacity`, label: `${t.name}: capacidade`, status: status(capOk, !pick.mode), message: capMsg } },
  ]
}

export function evaluateDdbKeysLab(c: DdbKeysLabConfig, r: DdbKeysLabResponse) {
  const items = c.tables.flatMap((t) => judgeTable(c, t, r.tables?.[t.id]))
  return { score: items.reduce((s, x) => s + x.score, 0) / Math.max(1, items.length), items }
}

export const ddbKeysComplete = (c: DdbKeysLabConfig, r: DdbKeysLabResponse) => c.tables.every((t) => Boolean(r.tables?.[t.id]?.pk && r.tables?.[t.id]?.sk && r.tables?.[t.id]?.mode))
