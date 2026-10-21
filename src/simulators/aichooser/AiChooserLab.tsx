/** Interface do laboratório "O serviço pronto certo". */
import type { Evaluation } from '../../engine/types'
import { ChoiceLab } from '../shared/ChoiceLab'
import { FactTag, JudgementTag } from '../shared/Tags'
import { AI_OPTIONS, type AiChooserLabConfig, type AiChooserLabResponse } from './model'

interface Props {
  config: AiChooserLabConfig
  value: AiChooserLabResponse
  onChange: (v: AiChooserLabResponse) => void
  disabled: boolean
  evaluation?: Evaluation | null
}

export function AiChooserLab(props: Props) {
  return (
    <ChoiceLab
      catalog={AI_OPTIONS}
      {...props}
      legend={
        <>
          <FactTag date="21/10/2026" /> o que cada serviço faz · <JudgementTag /> desempate pela solução mais simples e barata
        </>
      }
      simplifications={['Cada cartão tem uma necessidade principal; na prática, os serviços se combinam (por exemplo, Transcribe com Translate para legendar em outro idioma).', 'Treinar um modelo próprio atende a quase tudo, mas vale menos quando um serviço pronto resolve (julgamento de arquitetura do AWS Quest).']}
    />
  )
}
