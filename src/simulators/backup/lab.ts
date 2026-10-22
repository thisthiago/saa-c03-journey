/**
 * Laboratório "O plano de backup": para cada recurso, a frequência, o
 * armazenamento frio, a cópia e o Vault Lock que cumprem o RPO, a retenção e
 * as ameaças pedidas pelo menor custo.
 */
import { filesPrices } from '../files-prices'
import { fmtUsd } from '../filesystem/model'
import { evaluateGrid, gridComplete, gridSolution, type GridColumn, type GridExpected, type GridResponse, type GridRow } from '../shared/grid'
import {
  COPY_LABEL,
  efsBackupMonthly,
  FREQUENCY_HOURS,
  FREQUENCY_LABEL,
  LOCK_LABEL,
  planProblem,
  RESOURCE_LABEL,
  type BackupResource,
  type CopyTarget,
  type Disaster,
  type Frequency,
  type LockMode,
} from './model'

/** Dias no quente antes de ir para o frio, na opção do laboratório. */
export const COLD_AFTER = 30

export interface BackupNeed {
  id: string
  label: string
  resource: BackupResource
  /** Perda de dados máxima aceita, em horas (abaixo de 1, só o contínuo atende). */
  rpoHours: number
  retentionDays: number
  /** Desastres que os backups precisam aguentar além da exclusão da origem. */
  mustSurvive: Extract<Disaster, 'region-outage' | 'account-compromised'>[]
  /** `legal`: ninguém apaga antes do prazo; `adjustable`: proteção que a equipe de segurança ainda pode ajustar. */
  lockRule: 'legal' | 'adjustable' | 'none'
  /** GB guardados nos backups (premissa), para mostrar o custo do EFS. */
  storedGB?: number
  concepts?: string[]
}

export interface BackupLabConfig {
  needs: BackupNeed[]
  region?: string
}

export type BackupLabResponse = GridResponse

const SNAPSHOT: Frequency[] = ['hourly', '12h', 'daily', 'weekly', 'monthly']

export const backupColumns = (): GridColumn[] => [
  { id: 'frequency', label: 'Frequência', options: (['continuous', ...SNAPSHOT] as Frequency[]).map((f) => ({ id: f, label: FREQUENCY_LABEL[f] })) },
  { id: 'cold', label: 'Armazenamento frio', options: [{ id: 'none', label: 'Fica no quente' }, { id: 'cold', label: `Frio depois de ${COLD_AFTER} dias` }] },
  { id: 'copy', label: 'Cópia', options: (['none', 'region', 'account', 'both'] as CopyTarget[]).map((c) => ({ id: c, label: COPY_LABEL[c] })) },
  { id: 'lock', label: 'Trava do cofre', options: (['none', 'governance', 'compliance'] as LockMode[]).map((l) => ({ id: l, label: LOCK_LABEL[l] })) },
]

const SURVIVE_TEXT: Record<BackupNeed['mustSurvive'][number], string> = {
  'region-outage': 'sobreviver à perda da Região',
  'account-compromised': 'sobreviver a um invasor com acesso total à conta',
}

const rpoText = (h: number) => (h < 1 ? `${Math.round(h * 60)} minutos` : h === 1 ? '1 hora' : h % 24 === 0 ? `${h / 24} ${h === 24 ? 'dia' : 'dias'}` : `${h} horas`)
const retentionText = (d: number) => (d % 365 === 0 ? `${d / 365} ${d === 365 ? 'ano' : 'anos'}` : `${d} dias`)

function describe(n: BackupNeed) {
  return [
    `Perda máxima de ${rpoText(n.rpoHours)}`,
    `guardar por ${retentionText(n.retentionDays)}`,
    ...n.mustSurvive.map((d) => SURVIVE_TEXT[d]),
    n.lockRule === 'legal' ? 'a lei proíbe apagar antes do prazo, inclusive por administradores' : n.lockRule === 'adjustable' ? 'evitar exclusões por engano, mas a equipe de segurança precisa poder ajustar a trava' : 'sem exigência de trava',
  ].join('; ')
}

export const backupRows = (c: BackupLabConfig): GridRow[] => c.needs.map((n) => ({ id: n.id, label: `**${n.label}** (${RESOURCE_LABEL[n.resource]})`, detail: `${describe(n)}.`, concepts: n.concepts }))

export function expectedFrequency(n: BackupNeed): Frequency {
  if (n.rpoHours < 1) return 'continuous'
  return [...SNAPSHOT].reverse().find((f) => FREQUENCY_HOURS[f] <= n.rpoHours)!
}

export function backupExpected(c: BackupLabConfig) {
  const prices = filesPrices(c.region).backup
  return (row: GridRow): Record<string, GridExpected> => {
    const n = c.needs.find((x) => x.id === row.id)!
    const frequency = expectedFrequency(n)
    const copy: CopyTarget = n.mustSurvive.includes('region-outage') ? (n.mustSurvive.includes('account-compromised') ? 'both' : 'region') : n.mustSurvive.includes('account-compromised') ? 'account' : 'none'
    const lock: LockMode = n.lockRule === 'legal' ? 'compliance' : n.lockRule === 'adjustable' ? 'governance' : 'none'
    const base = { resource: n.resource, frequency, retentionDays: n.retentionDays, copy, lock }
    const coldProblem = planProblem({ ...base, coldAfterDays: COLD_AFTER })
    const problem = planProblem(base)
    if (problem) throw new Error(`Necessidade ${n.id}: ${problem}`)
    const cold = coldProblem ? 'none' : 'cold'
    const costNote =
      n.resource === 'efs' && n.storedGB
        ? ` Com ${n.storedGB.toLocaleString('pt-BR')} GB guardados, o armazenamento dos backups sai por ${fmtUsd(efsBackupMonthly({ ...base, coldAfterDays: COLD_AFTER }, n.storedGB, prices))} por mês com o frio e ${fmtUsd(efsBackupMonthly(base, n.storedGB, prices))} sem.`
        : ''
    return {
      frequency: {
        answer: frequency,
        why:
          frequency === 'continuous'
            ? `Só o backup contínuo permite voltar a qualquer momento e perder menos de uma hora; ele existe para ${RESOURCE_LABEL[n.resource]} e guarda até 35 dias.`
            : `${FREQUENCY_LABEL[frequency]} é a frequência mais espaçada que não perde mais de ${rpoText(n.rpoHours)}; backups mais frequentes só acumulam pontos de recuperação.`,
      },
      cold: { answer: cold, why: (coldProblem ? `${coldProblem} O backup fica no quente.` : `O backup passa ${(n.retentionDays - COLD_AFTER).toLocaleString('pt-BR')} dias no frio, que custa bem menos que o quente.`) + costNote },
      copy: {
        answer: copy,
        why:
          copy === 'none'
            ? 'Nenhum desastre pedido exige cópia, e cada cópia paga armazenamento e transferência.'
            : `${copy === 'both' || copy === 'region' ? 'A perda da Região pede uma cópia em outra Região. ' : ''}${copy === 'both' || copy === 'account' ? 'Um invasor com acesso total à conta não alcança a cópia em outra conta da organização.' : ''}`.trim(),
      },
      lock: {
        answer: lock,
        why:
          lock === 'compliance'
            ? 'No modo conformidade, depois da carência, ninguém apaga os backups antes do fim da retenção, nem a conta raiz.'
            : lock === 'governance'
              ? 'O modo governança impede exclusões de quem não tem permissão, e quem tem a permissão ainda pode ajustar ou remover a trava.'
              : 'Sem exigência de imutabilidade, a trava só engessaria a retenção.',
      },
    }
  }
}

export const backupSolution = (c: BackupLabConfig) => gridSolution(backupColumns(), backupRows(c), backupExpected(c))
export const evaluateBackupLab = (c: BackupLabConfig, r: BackupLabResponse) => evaluateGrid(backupColumns(), backupRows(c), backupExpected(c), r)
export const backupComplete = (c: BackupLabConfig, r: BackupLabResponse) => gridComplete(backupColumns(), backupRows(c), r)
