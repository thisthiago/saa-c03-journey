/** Interface do laboratório "A solução de dados certa". */
import type { Evaluation } from '../../engine/types'
import { ChoiceLab } from '../shared/ChoiceLab'
import { FactTag, JudgementTag } from '../shared/Tags'
import { ANA_OPTIONS, type AnaChooserLabConfig, type AnaChooserLabResponse } from './model'

interface Props {
  config: AnaChooserLabConfig
  value: AnaChooserLabResponse
  onChange: (v: AnaChooserLabResponse) => void
  disabled: boolean
  evaluation?: Evaluation | null
}

export function AnaChooserLab(props: Props) {
  return (
    <ChoiceLab
      catalog={ANA_OPTIONS}
      {...props}
      legend={
        <>
          <FactTag date="21/10/2026" /> o que cada serviço faz · <JudgementTag /> desempate pela solução mais simples e barata
        </>
      }
      simplifications={['Cada cartão tem um requisito que decide; na prática, a arquitetura de dados combina vários desses serviços.', 'Quando duas opções atendem, vale a que custa e dá menos trabalho para operar (julgamento de arquitetura do AWS Quest).']}
    />
  )
}
