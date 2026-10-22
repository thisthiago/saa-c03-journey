/** Interface do laboratório "Leia como o exame": o enunciado no alto e uma linha por alternativa. */
import type { Evaluation } from '../../engine/types'
import { renderInline } from '../../ui/inline'
import { GridLab } from '../shared/GridLab'
import sh from '../shared/lab.module.css'
import { FactTag, JudgementTag } from '../shared/Tags'
import { examReaderColumns, examReaderRows, type ExamReaderLabConfig, type ExamReaderLabResponse } from './lab'

interface Props {
  config: ExamReaderLabConfig
  value: ExamReaderLabResponse
  onChange: (v: ExamReaderLabResponse) => void
  disabled: boolean
  evaluation?: Evaluation | null
}

export function ExamReaderLab({ config, ...props }: Props) {
  return (
    <GridLab
      columns={examReaderColumns(config)}
      rows={examReaderRows(config)}
      {...props}
      legend={
        <>
          <FactTag date="22/10/2026" /> formato das questões do SAA-C03 · <JudgementTag /> o enunciado é do AWS Quest, não uma questão real do exame.
        </>
      }
      intro={
        <section className={sh.card} aria-label="Enunciado">
          {config.stem.map((p) => (
            <p key={p} className={sh.desc}>
              {renderInline(p)}
            </p>
          ))}
          <h4 className={sh.title}>{renderInline(config.question)}</h4>
        </section>
      }
      simplifications={[
        'Cada alternativa recebe um único motivo: a primeira restrição que ela quebra.',
        'No exame, a resposta certa é a melhor entre as que funcionam; aqui o requisito decisivo vem marcado nas opções da segunda coluna.',
      ]}
    />
  )
}
