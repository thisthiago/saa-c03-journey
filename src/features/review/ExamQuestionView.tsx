/**
 * Uma questão do banco: cabeçalho com dificuldade, conceito e domínio do exame,
 * cenário, alternativas com letras e, depois da resposta, o porquê de cada uma.
 */
import { BookOpenCheck } from 'lucide-react'
import { useMemo } from 'react'
import { Link } from 'react-router'
import { Option } from '../../activities/views'
import { shuffled } from '../../activities/shared/util'
import { registry } from '../../content'
import { correctOptionIds, DIFFICULTY_LABEL, isQuestionCorrect } from '../../engine/exam'
import type { ExamQuestion } from '../../engine/types'
import { Badge, type Tone } from '../../ui/kit'
import { Paragraphs } from '../../ui/RichText'
import { renderInline } from '../../ui/inline'
import s from './exam.module.css'

const LETTERS = 'ABCDEFGH'
const DIFFICULTY_TONE: Record<ExamQuestion['difficulty'], Tone> = { 1: 'success', 2: 'warning', 3: 'danger' }
const COUNT_WORD = ['', 'uma', 'duas', 'três', 'quatro']

interface Props {
  question: ExamQuestion
  number: number
  total: number
  selected: string[]
  onChange: (selected: string[]) => void
  /** Mostra o resultado e a explicação de cada alternativa. */
  revealed: boolean
  /** Semente para embaralhar as alternativas (muda a cada sessão). */
  seed: string
}

export function ExamQuestionView({ question: q, number, total, selected, onChange, revealed, seed }: Props) {
  const options = useMemo(() => shuffled(q.options, `${q.id}:${seed}`), [q.id, q.options, seed])
  const right = correctOptionIds(q)
  const multiple = right.length > 1
  const concept = registry.concepts.get(q.concept)
  const domain = registry.examDomains.find((d) => d.id === q.domain)
  const headingId = `q-${q.id}`

  const toggle = (id: string) => {
    if (revealed) return
    if (!multiple) return onChange([id])
    onChange(selected.includes(id) ? selected.filter((x) => x !== id) : [...selected, id])
  }
  const statusOf = (id: string) => {
    if (!revealed) return undefined
    const chosen = selected.includes(id)
    if (right.includes(id)) return chosen ? 'correct' : 'missed'
    return chosen ? 'wrong' : undefined
  }
  const ok = revealed && isQuestionCorrect(q, selected)

  return (
    <article className={s.question} aria-labelledby={headingId}>
      <header className={s.qHead}>
        <h2 id={headingId} className={s.qNumber}>
          Questão {number} de {total}
        </h2>
        <p className={s.qMeta}>
          <Badge tone={DIFFICULTY_TONE[q.difficulty]}>Dificuldade: {DIFFICULTY_LABEL[q.difficulty]}</Badge>
          <Badge tone="mastery">
            Conceito:&nbsp;
            <Link to={`/codex/${q.concept}`} className={s.conceptLink}>
              {concept?.title ?? q.concept}
            </Link>
          </Badge>
          {domain && (
            <Badge title={domain.officialName}>
              Domínio {domain.id.slice(1)}: {domain.title}
            </Badge>
          )}
        </p>
      </header>

      <Paragraphs items={q.stem} className={s.stem} />
      {q.exhibits?.length ? (
        <div className={s.exhibits}>
          {q.exhibits.map((x) => (
            <figure key={x.title} className={s.exhibit}>
              <figcaption>{x.title}</figcaption>
              <pre tabIndex={0}>{x.code}</pre>
            </figure>
          ))}
        </div>
      ) : null}
      <p className={s.ask}>
        <strong>{renderInline(q.question)}</strong>
        {multiple && <span className={s.choose}> Escolha {COUNT_WORD[right.length] ?? right.length}.</span>}
      </p>

      <div className={s.options} role={multiple ? 'group' : 'radiogroup'} aria-label="Alternativas">
        {options.map((o, i) => (
          <Option
            key={o.id}
            checked={selected.includes(o.id)}
            multi={multiple}
            disabled={revealed}
            status={statusOf(o.id)}
            onSelect={() => toggle(o.id)}
            note={revealed ? <>{o.correct ? 'Correta. ' : 'Incorreta. '}{renderInline(o.why)}</> : undefined}
          >
            <span className={s.letter} aria-hidden="true">
              {LETTERS[i]}
            </span>
            {renderInline(o.text)}
          </Option>
        ))}
      </div>

      {revealed && (
        <div className={s.explain} data-ok={ok}>
          <p className={s.verdict}>{selected.length === 0 ? 'Sem resposta: conta como errada, como no exame.' : ok ? 'Você acertou.' : multiple ? `Você errou. Para acertar, era preciso marcar exatamente as ${COUNT_WORD[right.length] ?? right.length} corretas.` : 'Você errou.'}</p>
          <h3>
            <BookOpenCheck size={18} aria-hidden="true" /> Explicação
          </h3>
          <Paragraphs items={q.explanation} />
        </div>
      )}
    </article>
  )
}
