/** Interface do laboratório "A solução de rede certa". */
import type { Evaluation } from '../../engine/types'
import { ChoiceLab } from '../shared/ChoiceLab'
import { FactTag, JudgementTag } from '../shared/Tags'
import { NET_OPTIONS, type NetChooserLabConfig, type NetChooserLabResponse } from './model'

interface Props {
  config: NetChooserLabConfig
  value: NetChooserLabResponse
  onChange: (v: NetChooserLabResponse) => void
  disabled: boolean
  evaluation?: Evaluation | null
}

export function NetChooserLab(props: Props) {
  return (
    <ChoiceLab
      catalog={NET_OPTIONS}
      {...props}
      legend={
        <>
          <FactTag date="21/10/2026" /> o que cada serviço faz · <JudgementTag /> desempate pela solução mais simples e barata
        </>
      }
      simplifications={['Cada cartão tem um requisito que decide; na vida real, várias peças trabalham juntas (por exemplo, CloudFront com WAF e Shield).', 'Quando duas opções atendem, vale a que custa e dá menos trabalho para operar (julgamento de arquitetura do AWS Quest).']}
    />
  )
}
