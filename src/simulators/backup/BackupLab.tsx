/** Interface do laboratório "O plano de backup" (AWS Backup). */
import type { Evaluation } from '../../engine/types'
import { FILES_PRICE_DATE, filesPrices } from '../files-prices'
import { fmtPrice } from '../filesystem/model'
import { GridLab } from '../shared/GridLab'
import { FactTag, PremiseTag } from '../shared/Tags'
import { backupColumns, backupRows, type BackupLabConfig, type BackupLabResponse } from './lab'

interface Props {
  config: BackupLabConfig
  value: BackupLabResponse
  onChange: (v: BackupLabResponse) => void
  disabled: boolean
  evaluation?: Evaluation | null
}

export function BackupLab({ config, ...props }: Props) {
  const p = filesPrices(config.region).backup
  return (
    <GridLab
      columns={backupColumns()}
      rows={backupRows(config)}
      {...props}
      legend={
        <>
          <FactTag date="22/10/2026" /> frequências, backup contínuo (até 35 dias), mínimo de 90 dias no frio e os modos do Vault Lock · <FactTag date={FILES_PRICE_DATE} /> backups do EFS: {fmtPrice(p.efsWarm)} por GB-mês no quente e {fmtPrice(p.efsCold)} no frio · <PremiseTag /> os recursos, os prazos e o tamanho dos backups.
        </>
      }
      simplifications={[
        'Cada recurso tem uma regra de backup; na prática, um plano pode ter várias regras.',
        'O custo considera só o armazenamento dos backups do EFS, com o tamanho guardado como premissa.',
        'A cópia para outra conta exige que as duas contas estejam na mesma organização.',
      ]}
    />
  )
}
