/** Interface do laboratório "O serviço de segurança certo". */
import type { Evaluation } from '../../engine/types'
import { ChoiceLab } from '../shared/ChoiceLab'
import { FactTag, JudgementTag } from '../shared/Tags'
import { SEC_OPTIONS, type SecChooserLabConfig, type SecChooserLabResponse } from './model'

interface Props {
  config: SecChooserLabConfig
  value: SecChooserLabResponse
  onChange: (v: SecChooserLabResponse) => void
  disabled: boolean
  evaluation?: Evaluation | null
}

export function SecChooserLab(props: Props) {
  return (
    <ChoiceLab
      catalog={SEC_OPTIONS}
      {...props}
      legend={
        <>
          <FactTag date="22/10/2026" /> o que cada serviço faz · <JudgementTag /> desempate pela solução mais simples e barata
        </>
      }
      simplifications={['Cada cartão tem um requisito que decide; na prática, a segurança da empresa combina vários desses serviços.', 'Quando duas opções atendem, vale a que custa e dá menos trabalho para operar (julgamento de arquitetura do AWS Quest).']}
    />
  )
}
