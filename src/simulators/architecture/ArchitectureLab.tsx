/** Interface do desafio final: etapas do projeto, contexto das decisões e relatório com a rubrica. */
import { AlertTriangle, ArrowLeft, ArrowRight, BookOpen, CheckCircle2, GraduationCap, Info, Scale, Users, XCircle } from 'lucide-react'
import { Link } from 'react-router'
import type { Evaluation } from '../../engine/types'
import { registry } from '../../content'
import { Button } from '../../ui/kit'
import { renderInline } from '../../ui/inline'
import type { ArchitectureLabConfig, ArchitectureLabResponse } from './lab'
import { evaluateArchitecture, examDomainScores, ruleFires } from './model'
import s from './architecture.module.css'

interface Props {
  config: ArchitectureLabConfig
  value: ArchitectureLabResponse
  onChange: (v: ArchitectureLabResponse) => void
  disabled: boolean
  evaluation?: Evaluation | null
}

export function ArchitectureLab({ config, value, onChange, disabled, evaluation }: Props) {
  const answers = value.answers ?? {}
  const stepIndex = Math.min(value.step ?? 0, config.steps.length - 1)
  const step = config.steps[stepIndex]
  const setStep = (i: number) => onChange({ answers, step: i })
  const answer = (qid: string, oid: string) => onChange({ answers: { ...answers, [qid]: oid }, step: stepIndex })
  const done = (i: number) => config.steps[i].questions.every((q) => answers[q.id])
  const optionLabel = (qid: string) => {
    for (const st of config.steps) for (const q of st.questions) if (q.id === qid) return q.options.find((o) => o.id === answers[qid])?.label
    return undefined
  }

  return (
    <div className={s.lab} style={{ ['--steps' as string]: config.steps.length }}>
      <ol className={s.stepper} aria-label="Etapas do projeto">
        {config.steps.map((st, i) => (
          <li key={st.id}>
            <button type="button" className={s.stepBtn} aria-current={i === stepIndex ? 'step' : undefined} data-done={done(i)} onClick={() => setStep(i)}>
              <span className={s.num}>{i + 1}</span>
              <span className={s.stepTitle}>{st.title}</span>
            </button>
          </li>
        ))}
      </ol>

      <div className={s.columns}>
        <section className={s.main} aria-label={`Etapa ${stepIndex + 1}: ${step.title}`}>
          <h4 className={s.h}>
            Etapa {stepIndex + 1} de {config.steps.length} · {step.title}
          </h4>
          <p className={s.intro}>{renderInline(step.intro)}</p>
          {step.questions.map((q) => {
            const notes = (q.context ?? []).filter((c) => ruleFires({ id: '', when: [c.when], penalty: {}, message: '' }, answers))
            return (
              <fieldset key={q.id} className={s.question}>
                <legend>{renderInline(q.prompt)}</legend>
                {notes.map((n, i) => (
                  <p key={i} className={s.context}>
                    <Info size={14} aria-hidden="true" /> <span>{renderInline(n.text)}</span>
                  </p>
                ))}
                <div className={s.options} role="radiogroup" aria-label={q.prompt}>
                  {q.options.map((o) => (
                    <button key={o.id} type="button" role="radio" aria-checked={answers[q.id] === o.id} className={`${s.option} pick-card`} disabled={disabled} onClick={() => answer(q.id, o.id)}>
                      {renderInline(o.label)}
                    </button>
                  ))}
                </div>
              </fieldset>
            )
          })}
          <div className={s.nav}>
            <Button variant="ghost" size="small" disabled={stepIndex === 0} onClick={() => setStep(stepIndex - 1)}>
              <ArrowLeft size={16} aria-hidden="true" /> Etapa anterior
            </Button>
            {stepIndex < config.steps.length - 1 && (
              <Button variant="secondary" size="small" onClick={() => setStep(stepIndex + 1)}>
                Próxima etapa <ArrowRight size={16} aria-hidden="true" />
              </Button>
            )}
          </div>
        </section>

        <aside className={s.side} aria-label="Decisões do projeto">
          <h4 className={s.h}>Decisões até aqui</h4>
          <ol className={s.summary}>
            {config.steps.map((st, i) => (
              <li key={st.id}>
                <strong>{st.title}</strong>
                <ul>
                  {st.questions.map((q) => (
                    <li key={q.id} data-empty={!answers[q.id]}>
                      {answers[q.id] ? renderInline(optionLabel(q.id) ?? '') : i <= stepIndex ? 'pendente' : '—'}
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ol>
        </aside>
      </div>

      {evaluation && <Report config={config} value={value} />}
    </div>
  )
}

const DEFAULT_DISCLAIMER = 'Este desafio é um exercício de aprendizagem: não reproduz questões oficiais nem garante aprovação no exame AWS Certified Solutions Architect – Associate.'

function Report({ config, value }: { config: ArchitectureLabConfig; value: ArchitectureLabResponse }) {
  const res = evaluateArchitecture(config, value.answers ?? {})
  const good = res.picks.filter((p) => p.value >= 0.8)
  const bad = res.picks.filter((p) => p.value < 0.8)
  const ungroupedBad = bad.filter((p) => !p.question.group)
  const weakConcepts = Array.from(new Set([...bad.flatMap((p) => p.option?.concepts ?? []), ...res.risks.flatMap((r) => r.concepts ?? [])]))
  const domains = examDomainScores(config, res)
  const rejected = res.picks.flatMap((p) =>
    p.question.options
      .filter((o) => o.id !== p.option?.id)
      .map((o) => ({ key: `${p.question.id}:${o.id}`, question: p.question.prompt, label: o.label, why: o.whyNot ?? o.consequence })),
  )
  return (
    <section className={s.report} aria-label={config.title}>
      <h4 className={s.reportTitle}>{config.title}</h4>
      <div className={s.rubric}>
        {config.dimensions.map(({ id: d, label }) => {
          const v = res.dimensions[d]
          return (
            <div key={d} className={s.dim}>
              <span>{label}</span>
              <span className={s.track} role="img" aria-label={`${label}: ${Math.round(v * 100)}%`}>
                <span className={s.fill} data-low={v < config.minDimension} style={{ width: `${Math.round(v * 100)}%` }} />
              </span>
              <strong>{Math.round(v * 100)}%</strong>
            </div>
          )
        })}
        <p className={s.overall}>
          Nota geral: <strong>{Math.round(res.overall * 100)}%</strong> · {res.passedDimensions ? 'todas as dimensões acima do mínimo' : `ao menos uma dimensão abaixo de ${Math.round(config.minDimension * 100)}%`}
        </p>
      </div>
      <div className={s.blocks}>
        <div>
          <h5>
            <CheckCircle2 size={16} aria-hidden="true" /> Decisões corretas ({good.length})
          </h5>
          <ul>
            {good.map((p) => (
              <li key={p.question.id}>{renderInline(p.option?.label ?? '')}</li>
            ))}
          </ul>
        </div>
        <div>
          <h5>
            <XCircle size={16} aria-hidden="true" /> Erros e consequências ({ungroupedBad.length})
          </h5>
          <ul>
            {ungroupedBad.length === 0 ? (
              <li>Nenhum.</li>
            ) : (
              ungroupedBad.map((p) => (
                <li key={p.question.id}>
                  <strong>{renderInline(p.option?.label ?? 'Sem resposta')}</strong> — {renderInline(p.option?.consequence ?? '')}
                </li>
              ))
            )}
          </ul>
        </div>
        {(config.groups ?? []).map((g) => {
          const wrong = bad.filter((p) => p.question.group === g.id)
          return (
            <div key={g.id}>
              <h5>
                <Users size={16} aria-hidden="true" /> {g.title} ({wrong.length})
              </h5>
              <ul>
                {wrong.length === 0 ? (
                  <li>Nenhuma: todas atribuídas corretamente.</li>
                ) : (
                  wrong.map((p) => (
                    <li key={p.question.id}>
                      <strong>{renderInline(p.question.prompt)}</strong> → {renderInline(p.option?.label ?? 'sem resposta')}. {renderInline(p.option?.consequence ?? '')}
                    </li>
                  ))
                )}
              </ul>
            </div>
          )
        })}
        <div>
          <h5>
            <AlertTriangle size={16} aria-hidden="true" /> Riscos entre etapas ({res.risks.length})
          </h5>
          <ul>
            {res.risks.length === 0 ? <li>Nenhum conflito entre as decisões das etapas.</li> : res.risks.map((r) => <li key={r.id}>{renderInline(r.message)}</li>)}
          </ul>
        </div>
        <div>
          <h5>
            <BookOpen size={16} aria-hidden="true" /> Conceitos a revisar
          </h5>
          {weakConcepts.length === 0 ? (
            <p>Nenhum: ótimo trabalho.</p>
          ) : (
            <>
              <p className={s.small}>Já estão na sua fila de revisão.</p>
              <ul className={s.concepts}>
                {weakConcepts.map((id) => (
                  <li key={id}>
                    <Link to={`/codex/${id}`}>{registry.concepts.get(id)?.title ?? id}</Link>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
        {domains.length > 0 && (
          <div>
            <h5>
              <GraduationCap size={16} aria-hidden="true" /> Relação com o SAA-C03
            </h5>
            <ul>
              {domains.map((d) => (
                <li key={d.domain}>
                  <strong>{registry.examDomains.find((x) => x.id === d.domain)?.title ?? d.domain}</strong>: {Math.round(d.score * 100)}% ({d.dimensions.map((x) => x.label).join(', ')})
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
      <details className={s.rejected}>
        <summary>
          <Scale size={16} aria-hidden="true" /> Alternativas rejeitadas e motivos ({rejected.length})
        </summary>
        <ul>
          {rejected.map((r) => (
            <li key={r.key}>
              <span className={s.small}>{renderInline(r.question)}</span>
              <br />
              <strong>{renderInline(r.label)}</strong> — {renderInline(r.why)}
            </li>
          ))}
        </ul>
      </details>
      <p className={s.disclaimer}>{config.disclaimer ?? DEFAULT_DISCLAIMER}</p>
    </section>
  )
}
