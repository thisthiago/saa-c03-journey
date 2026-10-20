/**
 * Executa uma atividade: resposta → verificação → feedback com consequências,
 * explicação, XP e domínio → nova tentativa, dica ou solução guiada.
 * Errar nunca bloqueia: é possível tentar de novo ou seguir adiante.
 */
import { ArrowRight, BookOpenCheck, Brain, Check, CircleAlert, Lightbulb, Minus, RotateCcw, Sparkles, X } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { evaluateActivity, referenceResponse, type ActivityResponse } from '../../activities/evaluate'
import { ActivityView } from '../../activities/registry'
import { incompleteHint, initialResponse, isComplete, KIND_LABEL } from '../../activities/ui-logic'
import type { ActivityDef } from '../../activities/types'
import { registry } from '../../content'
import { ACTIVITY_PASS_SCORE, hintFactor } from '../../engine/xp'
import type { Evaluation, GameEvent, ImpactDimension } from '../../engine/types'
import { useGame } from '../../store/gameStore'
import { Badge, Button, Callout } from '../../ui/kit'
import { Paragraphs } from '../../ui/RichText'
import { renderInline } from '../../ui/inline'
import s from './mission.module.css'

export interface SubmitResult {
  xp: number
  events: GameEvent[]
}

interface Props {
  activity: ActivityDef
  /** Registra o resultado no progresso e devolve o XP concedido. */
  onSubmit: (evaluation: Evaluation, hintsUsed: number, solutionViewed: boolean) => SubmitResult
  onContinue: () => void
  continueLabel: string
  /** Na revisão não há dicas nem solução guiada (o item já é curto). */
  mode?: 'mission' | 'review'
  /** Salva rascunho da resposta (laboratórios). */
  draftKey?: string
}

const IMPACT_LABEL: Record<ImpactDimension, string> = {
  custo: 'Custo',
  seguranca: 'Segurança',
  disponibilidade: 'Disponibilidade',
  durabilidade: 'Durabilidade',
  desempenho: 'Desempenho',
}

export function ActivityRunner({ activity, onSubmit, onContinue, continueLabel, mode = 'mission', draftKey }: Props) {
  const progress = useGame((st) => st.progress)
  const saveDraft = useGame((st) => st.saveDraft)
  const clearDraft = useGame((st) => st.clearDraft)
  const prior = progress.activities[activity.id]
  const [attempt, setAttempt] = useState(0)
  // Base fixa na montagem: o progresso muda após verificar e não deve reembaralhar o feedback.
  const [baseAttempts] = useState(prior?.attempts ?? 0)
  const seed = `${activity.id}:${baseAttempts + attempt}`
  const [response, setResponse] = useState<ActivityResponse>(() => {
    const draft = draftKey ? progress.drafts[draftKey] : undefined
    return (draft as ActivityResponse | undefined) ?? initialResponse(activity, seed)
  })
  const [hintsUsed, setHintsUsed] = useState(0)
  const [evaluation, setEvaluation] = useState<Evaluation | null>(null)
  const [result, setResult] = useState<SubmitResult | null>(null)
  const [masteryBefore, setMasteryBefore] = useState<Record<string, number>>({})
  const [guided, setGuided] = useState(false)
  const [solutionViewed, setSolutionViewed] = useState(Boolean(prior?.solutionViewed))
  const [failures, setFailures] = useState(0)
  const [showIncomplete, setShowIncomplete] = useState(false)
  const feedbackRef = useRef<HTMLDivElement>(null)

  const complete = isComplete(activity, response)
  const hints = mode === 'mission' ? (activity.hints ?? []) : []

  useEffect(() => {
    if (evaluation) feedbackRef.current?.focus()
  }, [evaluation])

  const change = (v: ActivityResponse) => {
    setResponse(v)
    setShowIncomplete(false)
    if (draftKey) saveDraft(draftKey, v)
  }

  const submit = () => {
    if (!complete) {
      setShowIncomplete(true)
      return
    }
    const ev = evaluateActivity(activity, response)
    const before: Record<string, number> = {}
    for (const c of Object.keys(ev.conceptOutcomes)) before[c] = progress.concepts[c]?.mastery ?? 0
    setMasteryBefore(before)
    const r = onSubmit(ev, hintsUsed, solutionViewed)
    if (draftKey) clearDraft(draftKey)
    setEvaluation(ev)
    setResult(r)
    if (ev.score < ACTIVITY_PASS_SCORE) setFailures((f) => f + 1)
  }

  const retry = () => {
    const nextAttempt = attempt + 1
    setAttempt(nextAttempt)
    setResponse(initialResponse(activity, `${activity.id}:${baseAttempts + nextAttempt}`))
    setEvaluation(null)
    setResult(null)
    setHintsUsed(0)
    setGuided(false)
  }

  const showSolution = () => {
    setGuided(true)
    setSolutionViewed(true)
  }

  const passed = evaluation ? evaluation.score >= ACTIVITY_PASS_SCORE : false
  const reference = useMemo(() => referenceResponse(activity), [activity])

  return (
    <div className={s.activity}>
      <header className={s.activityHead}>
        <div className="row">
          <Badge tone="accent">{KIND_LABEL[activity.kind]}</Badge>
          <Badge tone="xp" icon={<Sparkles size={13} aria-hidden="true" />}>
            até {Math.round(activity.xp * (hintsUsed ? hintFactor(hintsUsed) : 1))} XP
          </Badge>
          {prior && prior.attempts > 0 && <Badge>Melhor resultado: {Math.round(prior.bestScore * 100)}%</Badge>}
        </div>
        <h2 className={s.activityTitle}>{activity.title}</h2>
        <p className={s.prompt}>{renderInline(activity.prompt)}</p>
        {activity.exhibits?.length ? (
          <div className={s.exhibits}>
            {activity.exhibits.map((x) => (
              <figure key={x.title} className={s.exhibit}>
                <figcaption>{x.title}</figcaption>
                <pre tabIndex={0}>{x.code}</pre>
              </figure>
            ))}
          </div>
        ) : null}
      </header>

      {guided ? (
        <div className={s.guided}>
          <Callout kind="tip" title="Solução guiada">
            <p>Esta é a resposta de referência, com a explicação abaixo. Estude-a e depois refaça a atividade — o conceito voltará mais cedo na sua revisão.</p>
          </Callout>
          <ActivityView activity={activity} value={reference} onChange={() => {}} disabled evaluation={evaluateActivity(activity, reference)} seed={seed} />
          <Paragraphs items={activity.explanation} className={s.explanation} />
          <div className={s.actions}>
            <Button onClick={retry}>
              <RotateCcw size={18} aria-hidden="true" /> Refazer agora
            </Button>
          </div>
        </div>
      ) : (
        <>
          <div key={attempt} className={evaluation && !passed ? 'anim-shake' : undefined}>
            <ActivityView activity={activity} value={response} onChange={change} disabled={Boolean(evaluation)} evaluation={evaluation} seed={seed} />
          </div>

          {!evaluation && (
            <>
              {hintsUsed > 0 && (
                <div className={s.hints}>
                  {hints.slice(0, hintsUsed).map((h, i) => (
                    <Callout key={i} kind="tip" title={`Dica ${i + 1}`}>
                      <p>{renderInline(h)}</p>
                    </Callout>
                  ))}
                </div>
              )}
              <div className={s.actions}>
                <Button onClick={submit} aria-describedby={showIncomplete ? `${activity.id}-incomplete` : undefined}>
                  <Check size={18} aria-hidden="true" /> Verificar
                </Button>
                {hintsUsed < hints.length && (
                  <Button variant="ghost" onClick={() => setHintsUsed((h) => h + 1)}>
                    <Lightbulb size={18} aria-hidden="true" /> Pedir dica (−15% de XP)
                  </Button>
                )}
                {showIncomplete && (
                  <span id={`${activity.id}-incomplete`} className={s.incomplete} role="alert">
                    <CircleAlert size={16} aria-hidden="true" /> {incompleteHint(activity)}
                  </span>
                )}
                {!complete && !showIncomplete && <span className={s.incompleteSoft}>{incompleteHint(activity)}</span>}
              </div>
            </>
          )}

          {evaluation && result && (
            <div ref={feedbackRef} tabIndex={-1} className={`${s.feedback} anim-fade-up`} data-outcome={passed ? (evaluation.score >= 1 ? 'perfect' : 'pass') : 'fail'} aria-live="polite">
              <div className={s.feedbackHead}>
                <span className={s.feedbackIcon} aria-hidden="true">
                  {passed ? <Check size={26} /> : <X size={26} />}
                </span>
                <div>
                  <strong className={s.feedbackTitle}>{evaluation.score >= 1 ? 'Perfeito!' : passed ? 'Bom trabalho — quase completo' : 'Ainda não'}</strong>
                  <span className={s.feedbackScore}>Resultado: {Math.round(evaluation.score * 100)}%</span>
                </div>
                {result.xp > 0 ? (
                  <span className={s.xpGain}>
                    <span className={s.xpFloat} aria-hidden="true">
                      +{result.xp}
                    </span>
                    +{result.xp} XP
                  </span>
                ) : (
                  <span className={s.xpNone}>{mode === 'review' ? 'Treino sem XP (fora do prazo de revisão)' : 'Sem XP adicional nesta tentativa'}</span>
                )}
              </div>

              {evaluation.summary && <p className={s.summary}>{evaluation.summary}</p>}

              {evaluation.consequences && evaluation.consequences.length > 0 && (
                <div className={s.consequences}>
                  <h3>O que aconteceria</h3>
                  {evaluation.consequences.map((c, i) => (
                    <div key={i} className={s.consequence} data-tone={c.tone}>
                      <p>{renderInline(c.text)}</p>
                      {c.impacts && (
                        <div className={s.impacts}>
                          {Object.entries(c.impacts).map(([dim, v]) => (
                            <Badge key={dim} tone={(v ?? 0) > 0 ? 'success' : 'danger'}>
                              {IMPACT_LABEL[dim as ImpactDimension]} {(v ?? 0) > 0 ? '▲' : '▼'}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {activity.kind !== 'decision' && evaluation.items.length > 0 && (
                <ul className={s.items}>
                  {evaluation.items.map((i) => (
                    <li key={i.id} data-status={i.status}>
                      <span className={s.itemIcon} aria-label={i.status === 'correct' ? 'correto' : i.status === 'partial' ? 'parcial' : 'incorreto'}>
                        {i.status === 'correct' ? <Check size={16} /> : i.status === 'partial' ? <Minus size={16} /> : <X size={16} />}
                      </span>
                      <div>
                        <span className={s.itemLabel}>{renderInline(i.label)}</span>
                        {i.message && <span className={s.itemMsg}>{renderInline(i.message)}</span>}
                      </div>
                    </li>
                  ))}
                </ul>
              )}

              <div className={s.why}>
                <h3>
                  <BookOpenCheck size={18} aria-hidden="true" /> Por quê
                </h3>
                <Paragraphs items={activity.explanation} />
              </div>

              <MasteryDeltas before={masteryBefore} />

              <div className={s.actions}>
                {passed ? (
                  <>
                    <Button onClick={onContinue}>
                      {continueLabel} <ArrowRight size={18} aria-hidden="true" />
                    </Button>
                    {evaluation.score < 1 && (
                      <Button variant="secondary" onClick={retry}>
                        <RotateCcw size={18} aria-hidden="true" /> Tentar 100%
                      </Button>
                    )}
                  </>
                ) : (
                  <>
                    <Button onClick={retry}>
                      <RotateCcw size={18} aria-hidden="true" /> Tentar novamente
                    </Button>
                    {mode === 'mission' && failures >= 2 && (
                      <Button variant="secondary" onClick={showSolution}>
                        <Lightbulb size={18} aria-hidden="true" /> Ver solução guiada
                      </Button>
                    )}
                    <Button variant="ghost" onClick={onContinue}>
                      {mode === 'mission' ? 'Continuar mesmo assim' : continueLabel}
                    </Button>
                  </>
                )}
              </div>
              {!passed && mode === 'mission' && failures < 2 && <p className={s.note}>Errar faz parte: refaça com o que aprendeu. Depois de duas tentativas sem sucesso, a solução guiada fica disponível.</p>}
            </div>
          )}
        </>
      )}
    </div>
  )
}

function MasteryDeltas({ before }: { before: Record<string, number> }) {
  const concepts = useGame((st) => st.progress.concepts)
  const entries = Object.keys(before)
  if (entries.length === 0) return null
  return (
    <div className={s.mastery}>
      <h3>
        <Brain size={18} aria-hidden="true" /> Domínio dos conceitos
      </h3>
      <ul>
        {entries.map((id) => {
          const b = before[id]
          const a = concepts[id]?.mastery ?? b
          const delta = Math.round((a - b) * 100)
          return (
            <li key={id}>
              <span>{registry.concepts.get(id)?.title ?? id}</span>
              <span className={s.masteryBar}>
                <span style={{ width: `${Math.round(a * 100)}%` }} />
              </span>
              <span className={delta >= 0 ? s.up : s.down}>
                {delta >= 0 ? '+' : ''}
                {delta}
              </span>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
