/** Interface do laboratório "O caminho de cada fonte". */
import type { Evaluation } from '../../engine/types'
import { ChoiceLab } from '../shared/ChoiceLab'
import { FactTag, JudgementTag } from '../shared/Tags'
import { INGEST_OPTIONS, type IngestLabConfig, type IngestLabResponse } from './model'

interface Props {
  config: IngestLabConfig
  value: IngestLabResponse
  onChange: (v: IngestLabResponse) => void
  disabled: boolean
  evaluation?: Evaluation | null
}

export function IngestLab(props: Props) {
  return (
    <ChoiceLab
      catalog={INGEST_OPTIONS}
      {...props}
      legend={
        <>
          <FactTag date="21/10/2026" /> o que cada serviço faz · <JudgementTag /> desempate pela solução mais simples e barata
        </>
      }
      simplifications={['Cada cartão tem um requisito que decide; na prática, os serviços se combinam (por exemplo, Kinesis Data Streams com o Firehose entregando no S3).', 'Quando duas opções atendem, vale a que custa e dá menos trabalho para operar (julgamento de arquitetura do AWS Quest).']}
    />
  )
}
