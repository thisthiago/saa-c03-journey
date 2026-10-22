/** Interface do laboratório "O armazenamento de arquivos certo". */
import type { Evaluation } from '../../engine/types'
import { ChoiceLab } from '../shared/ChoiceLab'
import { FactTag, JudgementTag } from '../shared/Tags'
import { FS_OPTIONS, type FsChooserLabConfig, type FsChooserLabResponse } from './model'

interface Props {
  config: FsChooserLabConfig
  value: FsChooserLabResponse
  onChange: (v: FsChooserLabResponse) => void
  disabled: boolean
  evaluation?: Evaluation | null
}

export function FsChooserLab(props: Props) {
  return (
    <ChoiceLab
      catalog={FS_OPTIONS}
      {...props}
      legend={
        <>
          <FactTag date="22/10/2026" /> protocolos e usos de cada serviço · <JudgementTag /> desempate pela solução mais simples e barata
        </>
      }
      simplifications={['Cada cartão tem um requisito que decide; na prática, uma carga combina vários desses serviços.', 'Quando duas opções atendem, vale a que custa e dá menos trabalho para operar (julgamento de arquitetura do AWS Quest).']}
    />
  )
}
