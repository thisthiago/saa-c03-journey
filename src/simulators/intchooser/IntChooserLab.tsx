/** Interface do laboratório "O serviço de integração certo". */
import type { Evaluation } from '../../engine/types'
import { ChoiceLab } from '../shared/ChoiceLab'
import { FactTag, JudgementTag } from '../shared/Tags'
import { INT_OPTIONS, type IntChooserLabConfig, type IntChooserLabResponse } from './model'

interface Props {
  config: IntChooserLabConfig
  value: IntChooserLabResponse
  onChange: (v: IntChooserLabResponse) => void
  disabled: boolean
  evaluation?: Evaluation | null
}

export function IntChooserLab(props: Props) {
  return (
    <ChoiceLab
      catalog={INT_OPTIONS}
      {...props}
      legend={
        <>
          <FactTag date="22/10/2026" /> o que cada serviço faz · <JudgementTag /> desempate pela solução mais simples e barata
        </>
      }
      simplifications={['Cada cartão tem um requisito que decide; na prática, uma integração combina vários desses serviços.', 'Quando duas opções atendem, vale a que custa e dá menos trabalho para operar (julgamento de arquitetura do AWS Quest).']}
    />
  )
}
