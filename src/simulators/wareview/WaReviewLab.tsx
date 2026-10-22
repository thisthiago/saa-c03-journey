/** Interface do laboratório "A revisão Well-Architected". */
import type { Evaluation } from '../../engine/types'
import { GridLab } from '../shared/GridLab'
import { FactTag, PremiseTag } from '../shared/Tags'
import { waReviewColumns, waReviewRows, type WaReviewLabConfig, type WaReviewLabResponse } from './lab'

interface Props {
  config: WaReviewLabConfig
  value: WaReviewLabResponse
  onChange: (v: WaReviewLabResponse) => void
  disabled: boolean
  evaluation?: Evaluation | null
}

export function WaReviewLab({ config, ...props }: Props) {
  return (
    <GridLab
      columns={waReviewColumns()}
      rows={waReviewRows(config)}
      {...props}
      legend={
        <>
          <FactTag date="22/10/2026" /> pilares e nível de risco de cada boa prática, lidos nas páginas do Well-Architected Framework · <PremiseTag /> a carga e os achados.
        </>
      }
      simplifications={[
        'Cada achado corresponde a uma única boa prática; numa revisão real, uma pergunta reúne várias boas práticas.',
        'A Well-Architected Tool calcula o risco pelas respostas a cada pergunta; aqui o nível vem direto da boa prática que falta.',
        'Os títulos das boas práticas em português são resumos do AWS Quest.',
      ]}
    />
  )
}
