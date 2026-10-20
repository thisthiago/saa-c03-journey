/**
 * Linhas de fatura "antes × depois" geradas pelo modelo de custo, para
 * investigações. O texto e a marcação de problema derivam dos números.
 */
import { STORAGE_CLASSES, type StorageClassId } from '../shared/storageClasses'
import { formatUSD, monthlyCost, type CostBreakdown, type DataProfile } from './model'
import { regionPrices } from './prices'

export type CostComponent = keyof Pick<CostBreakdown, 'storage' | 'requests' | 'retrieval' | 'monitoring' | 'earlyDeletion' | 'transfer'>

export const COMPONENT_LABEL: Record<CostComponent, string> = {
  storage: 'Armazenamento',
  requests: 'Requisições',
  retrieval: 'Recuperação de dados',
  monitoring: 'Monitoramento',
  earlyDeletion: 'Exclusão antecipada',
  transfer: 'Transferência',
}

export interface BillLine {
  id: string
  text: string
  /** Aumento relevante (mais de 20% e mais de US$ 1). */
  increased: boolean
  before: number
  after: number
}

export function billLine(region: string, profile: DataProfile, from: StorageClassId, to: StorageClassId, component: CostComponent): BillLine {
  const prices = regionPrices(region)
  const before = monthlyCost(profile, from, prices)[component]
  const after = monthlyCost(profile, to, prices)[component]
  const increased = after - before > 1 && after > before * 1.2
  const cls = from === to ? STORAGE_CLASSES[to].shortName : `${STORAGE_CLASSES[from].shortName} → ${STORAGE_CLASSES[to].shortName}`
  return {
    id: `${profile.id}-${component}`,
    text: `${profile.name} [${cls}] · ${COMPONENT_LABEL[component]}: ${formatUSD(before)} → ${formatUSD(after)}`,
    increased,
    before,
    after,
  }
}

export function totalFor(region: string, choices: [DataProfile, StorageClassId][]): number {
  const prices = regionPrices(region)
  return choices.reduce((sum, [p, sc]) => sum + monthlyCost(p, sc, prices).total, 0)
}
