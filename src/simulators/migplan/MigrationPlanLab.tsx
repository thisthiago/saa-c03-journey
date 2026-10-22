/** Interface do laboratório "O plano de migração". */
import type { Evaluation } from '../../engine/types'
import { GridLab } from '../shared/GridLab'
import { FactTag, JudgementTag, PremiseTag } from '../shared/Tags'
import { migrationPlanColumns, migrationPlanRows, type MigrationPlanLabConfig, type MigrationPlanLabResponse } from './lab'

interface Props {
  config: MigrationPlanLabConfig
  value: MigrationPlanLabResponse
  onChange: (v: MigrationPlanLabResponse) => void
  disabled: boolean
  evaluation?: Evaluation | null
}

export function MigrationPlanLab({ config, ...props }: Props) {
  return (
    <GridLab
      columns={migrationPlanColumns()}
      rows={migrationPlanRows(config)}
      {...props}
      legend={
        <>
          <FactTag date="22/10/2026" /> as sete estratégias e seus casos de uso no AWS Prescriptive Guidance · <PremiseTag /> o portfólio · <JudgementTag /> a característica que decide cada caso.
        </>
      }
      simplifications={[
        'Cada sistema tem uma característica que decide a estratégia; num portfólio real, prazo, risco e custo pesam juntos.',
        'Depois de um rehost ou de um relocate, a aplicação ainda pode ser modernizada já na AWS.',
      ]}
    />
  )
}
