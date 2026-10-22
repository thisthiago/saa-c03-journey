/** Interface do laboratório "O gargalo certo". */
import type { Evaluation } from '../../engine/types'
import { ChoiceLab } from '../shared/ChoiceLab'
import { FactTag, JudgementTag } from '../shared/Tags'
import { PERF_OPTIONS, type PerfChooserLabConfig, type PerfChooserLabResponse } from './model'

interface Props {
  config: PerfChooserLabConfig
  value: PerfChooserLabResponse
  onChange: (v: PerfChooserLabResponse) => void
  disabled: boolean
  evaluation?: Evaluation | null
}

export function PerfChooserLab(props: Props) {
  return (
    <ChoiceLab
      catalog={PERF_OPTIONS}
      {...props}
      legend={
        <>
          <FactTag date="22/10/2026" /> o que cada serviço acelera · <JudgementTag /> desempate pela solução mais simples
        </>
      }
      simplifications={['Cada cartão tem um gargalo que decide; na prática, uma arquitetura combina vários desses recursos.', 'Quando duas opções atendem, vale a que dá menos trabalho e custa menos (julgamento de arquitetura do AWS Quest).']}
    />
  )
}
