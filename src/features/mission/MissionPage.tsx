import { ArrowLeft, ArrowRight, Check, CircleCheck, ClipboardList, Compass, Lock, Play, RotateCcw, Target, X } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { registry } from '../../content'
import { masteryTier, TIER_LABEL } from '../../engine/mastery'
import { isMissionPassed, missionScore, missionStatus, passThreshold } from '../../engine/selectors'
import type { MissionDef } from '../../engine/types'
import { useGame } from '../../store/gameStore'
import { useDocumentTitle } from '../../app/hooks'
import { Badge, Button, ButtonLink, Callout, Card, IconTile, ProgressBar } from '../../ui/kit'
import { Paragraphs } from '../../ui/RichText'
import { renderInline } from '../../ui/inline'
import { NotFound } from '../NotFound'
import { ActivityRunner, type SubmitResult } from './ActivityRunner'
import { Visual } from './visuals'
import s from './mission.module.css'
import { phaseLabel } from '../../app/format'

type Step = { kind: 'briefing' } | { kind: 'intel' } | { kind: 'activity'; index: number } | { kind: 'debrief' }

function buildSteps(m: MissionDef): Step[] {
  return [
    { kind: 'briefing' },
    ...(m.intel.length > 0 ? [{ kind: 'intel' } as Step] : []),
    ...m.activities.map((_, index) => ({ kind: 'activity', index }) as Step),
    { kind: 'debrief' },
  ]
}

export function MissionPage() {
  const { missionId = '' } = useParams()
  const ref = registry.missions.get(missionId)
  if (!ref) return <NotFound />
  return <MissionRunner key={missionId} missionId={missionId} />
}

function MissionRunner({ missionId }: { missionId: string }) {
  const ref = registry.missions.get(missionId)!
  const { mission, phase } = ref
  useDocumentTitle(mission.title)
  const navigate = useNavigate()
  const progress = useGame((st) => st.progress)
  const startMission = useGame((st) => st.startMission)
  const clearResume = useGame((st) => st.clearResume)
  const submitActivity = useGame((st) => st.submitActivity)
  const discover = useGame((st) => st.discover)
  const steps = useMemo(() => buildSteps(mission), [mission])
  const status = missionStatus(progress, registry, missionId)
  const [stepIndex, setStepIndex] = useState(() => {
    const r = progress.resume
    return r?.missionId === missionId ? Math.min(r.step, steps.length - 1) : 0
  })
  const [sessionXp, setSessionXp] = useState(0)
  const topRef = useRef<HTMLDivElement>(null)
  const step = steps[stepIndex]

  useEffect(() => {
    if (status === 'locked') return
    if (step.kind === 'debrief') clearResume(missionId)
    else startMission(missionId, stepIndex)
    if (step.kind === 'intel') discover(mission.intel.map((c) => c.conceptId))
    topRef.current?.scrollIntoView({ block: 'start' })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stepIndex])

  if (status === 'locked') {
    return (
      <div className="page">
        <Card>
          <Lock size={28} aria-hidden="true" />
          <h1>Missão bloqueada</h1>
          <p className="muted">Aprove as missões anteriores e os pré-requisitos da fase para liberar esta missão.</p>
          <ButtonLink to={`/fase/${phase.id}`}>Ver a fase</ButtonLink>
        </Card>
      </div>
    )
  }

  const go = (i: number) => setStepIndex(Math.max(0, Math.min(steps.length - 1, i)))
  const activityCount = mission.activities.length
  const doneActivities = steps.slice(0, stepIndex).filter((x) => x.kind === 'activity').length
  const isBoss = mission.type !== 'mission'

  return (
    <div className={s.page} style={{ ['--phase' as string]: phase.color }} ref={topRef}>
      <header className={s.missionHead}>
        <Link to={`/fase/${phase.id}`} className={s.back}>
          <ArrowLeft size={16} aria-hidden="true" /> {phaseLabel(phase)}
        </Link>
        <div className={s.missionHeadMain}>
          <span className={s.missionKicker}>
            {mission.type === 'final' ? 'Desafio final' : isBoss ? 'Desafio de chefe' : 'Missão'} · {phase.title}
          </span>
          <h1 className={s.missionTitle}>{mission.title}</h1>
        </div>
        <div className={s.stepper} aria-label="Etapas da missão">
          <ProgressBar value={stepIndex / (steps.length - 1)} color={phase.color} label="Progresso na missão" />
          <span className={s.stepperText}>
            {step.kind === 'activity' ? `Desafio ${step.index + 1} de ${activityCount}` : step.kind === 'briefing' ? 'Contexto' : step.kind === 'intel' ? 'Conceitos-chave' : 'Resultado'}
            {sessionXp > 0 && <b className={s.sessionXp}> · +{sessionXp} XP</b>}
          </span>
        </div>
      </header>

      {step.kind === 'briefing' && (
        <Card className={`${s.briefing} anim-fade-up`}>
          <div className={s.briefingTop}>
            <IconTile glyph={phase.glyph} color={phase.color} size={52} />
            <div>
              <p className="eyebrow">
                <ClipboardList size={14} aria-hidden="true" style={{ verticalAlign: '-2px' }} /> Contexto da missão
              </p>
              <h2 className={s.company}>{mission.briefing.company}</h2>
              <p className="muted">{mission.briefing.role}</p>
            </div>
          </div>
          <div className={s.briefingGrid}>
            <div>
              <h3>Situação</h3>
              <p>{renderInline(mission.briefing.situation)}</p>
              <h3>
                <Target size={16} aria-hidden="true" style={{ verticalAlign: '-2px' }} /> Objetivo
              </h3>
              <p>{renderInline(mission.briefing.objective)}</p>
            </div>
            <div className={s.criteria}>
              <h3>Critérios de sucesso</h3>
              <ul>
                {mission.briefing.successCriteria.map((c) => (
                  <li key={c}>
                    <CircleCheck size={16} aria-hidden="true" /> {renderInline(c)}
                  </li>
                ))}
              </ul>
              <p className={s.small}>
                {activityCount} desafio(s) · aprovação com {Math.round(passThreshold(mission) * 100)}% · XP só por respostas corretas
              </p>
            </div>
          </div>
          <div className={s.actions}>
            <Button onClick={() => go(stepIndex + 1)}>
              <Play size={18} aria-hidden="true" /> {mission.intel.length > 0 ? 'Ver conceitos-chave' : 'Começar o desafio'}
            </Button>
          </div>
        </Card>
      )}

      {step.kind === 'intel' && (
        <div className="anim-fade-up">
          <p className="eyebrow">Conceitos-chave — o mínimo necessário para o desafio</p>
          <div className={s.intelGrid}>
            {mission.intel.map((card) => {
              const c = registry.concepts.get(card.conceptId)!
              return (
                <Card key={card.conceptId} className={s.intelCard} as="article">
                  {card.visual && <Visual id={card.visual} />}
                  <div className={s.intelHead}>
                    <h2 className={s.intelTitle}>{c.title}</h2>
                    <Badge tone="info" title="Nome oficial usado pela AWS">
                      {c.officialName}
                    </Badge>
                  </div>
                  <Paragraphs items={card.body ?? [c.summary]} />
                  {card.simplification && (
                    <Callout kind="info" title="Simplificação">
                      <p>{card.simplification}</p>
                    </Callout>
                  )}
                  <Link to={`/codex/${c.id}`} className={s.small} target="_blank" rel="noopener">
                    Abrir no Codex (nova aba)
                  </Link>
                </Card>
              )
            })}
          </div>
          <div className={s.actions}>
            <Button variant="ghost" onClick={() => go(stepIndex - 1)}>
              <ArrowLeft size={18} aria-hidden="true" /> Voltar ao contexto
            </Button>
            <Button onClick={() => go(stepIndex + 1)}>
              Entendi, ir para o desafio <ArrowRight size={18} aria-hidden="true" />
            </Button>
          </div>
          <p className={s.note}>Ler os conceitos não dá XP: a pontuação vem do que você faz nos desafios.</p>
        </div>
      )}

      {step.kind === 'activity' && (
        <Card className={s.activityCard}>
          <ActivityRunner
            key={mission.activities[step.index].id}
            activity={mission.activities[step.index]}
            draftKey={mission.activities[step.index].kind === 'lab' ? `draft:${mission.activities[step.index].id}` : undefined}
            onSubmit={(evaluation, hints, solution): SubmitResult => {
              const events = submitActivity(mission.activities[step.index].id, evaluation, hints, solution)
              const xp = events.filter((e) => e.type === 'xp').reduce((sum, e) => sum + (e.type === 'xp' ? e.amount : 0), 0)
              setSessionXp((v) => v + xp)
              const activityXp = events.find((e) => e.type === 'xp' && e.source === 'activity')
              return { xp: activityXp?.type === 'xp' ? activityXp.amount : 0, events }
            }}
            onContinue={() => go(stepIndex + 1)}
            continueLabel={step.index === activityCount - 1 ? 'Ver resultado' : 'Próximo desafio'}
          />
        </Card>
      )}

      {step.kind === 'debrief' && <Debrief mission={mission} sessionXp={sessionXp} onJump={(i) => go(steps.findIndex((x) => x.kind === 'activity' && x.index === i))} onRestart={() => go(0)} navigate={navigate} doneActivities={doneActivities} />}
    </div>
  )
}

function Debrief({ mission, sessionXp, onJump, onRestart, navigate }: { mission: MissionDef; sessionXp: number; onJump: (i: number) => void; onRestart: () => void; navigate: (to: string) => void; doneActivities: number }) {
  const progress = useGame((st) => st.progress)
  const ref = registry.missions.get(mission.id)!
  const passed = isMissionPassed(progress, mission)
  const score = missionScore(progress, mission)
  const threshold = passThreshold(mission)
  const nextInPhase = ref.phase.missions[ref.index + 1]
  const concepts = [...new Set(mission.activities.flatMap((a) => a.concepts.map((c) => c.id)))]
  const weakest = mission.activities
    .map((a, i) => ({ a, i, best: progress.activities[a.id]?.bestScore ?? 0 }))
    .filter((x) => x.best < 0.7)

  return (
    <div className="anim-fade-up">
      <Card className={s.debrief} style={{ borderColor: passed ? 'var(--success)' : 'var(--warning)' }}>
        <div className={s.debriefHead}>
          <span className={s.debriefIcon} data-passed={passed} aria-hidden="true">
            {passed ? <Check size={30} /> : <RotateCcw size={28} />}
          </span>
          <div>
            <p className="eyebrow">Resultado da missão</p>
            <h2>{passed ? 'Missão aprovada' : 'Missão ainda não aprovada'}</h2>
            <p className="muted">
              Nota: <b>{Math.round(score * 100)}%</b> (mínimo de {Math.round(threshold * 100)}%){sessionXp > 0 && ` · +${sessionXp} XP nesta sessão`}
            </p>
          </div>
        </div>

        {!passed && weakest.length > 0 && (
          <Callout kind="warning" title="O que falta">
            <p>Refaça os desafios abaixo do esperado. Seus melhores resultados são mantidos e o XP adicional reflete a melhoria.</p>
          </Callout>
        )}

        <h3 className={s.debriefSection}>Seus desafios</h3>
        <ul className={s.results}>
          {mission.activities.map((a, i) => {
            const ap = progress.activities[a.id]
            const best = ap?.bestScore ?? 0
            return (
              <li key={a.id} data-ok={best >= 0.7}>
                {best >= 0.7 ? <Check size={16} aria-label="aprovado" /> : <X size={16} aria-label="abaixo do esperado" />}
                <span className={s.resultTitle}>{a.title}</span>
                <span className={s.resultScore}>{ap ? `${Math.round(best * 100)}%` : 'não feito'}</span>
                <button type="button" className={s.linkBtn} onClick={() => onJump(i)}>
                  {ap ? 'refazer' : 'fazer'}
                </button>
              </li>
            )
          })}
        </ul>

        <h3 className={s.debriefSection}>Para levar</h3>
        <Paragraphs items={mission.debrief.takeaways} className={s.takeaways} />

        <h3 className={s.debriefSection}>Conceitos trabalhados</h3>
        <div className={s.conceptRow}>
          {concepts.map((id) => {
            const tier = masteryTier(progress.concepts[id])
            return (
              <Link key={id} to={`/codex/${id}`} className={s.conceptPill} data-tier={tier}>
                {registry.concepts.get(id)?.title} · {TIER_LABEL[tier]}
              </Link>
            )
          })}
        </div>
        <p className={s.note}>Conceitos com erro voltam primeiro na revisão; "Dominado" exige acertos em dias diferentes.</p>

        <div className={s.actions}>
          {passed && nextInPhase ? (
            <Button onClick={() => navigate(`/missao/${nextInPhase.id}`)}>
              Próxima missão: {nextInPhase.title} <ArrowRight size={18} aria-hidden="true" />
            </Button>
          ) : passed ? (
            <Button onClick={() => navigate(`/trilha/${ref.track.id}?fase=${ref.phase.id}`)}>
              <Compass size={18} aria-hidden="true" /> Voltar ao mapa
            </Button>
          ) : weakest.length > 0 ? (
            <Button onClick={() => onJump(weakest[0].i)}>
              <RotateCcw size={18} aria-hidden="true" /> Refazer “{weakest[0].a.title}”
            </Button>
          ) : null}
          <Button variant="secondary" onClick={onRestart}>
            Recomeçar do contexto
          </Button>
          <ButtonLink to={`/fase/${ref.phase.id}`} variant="ghost">
            Ver a fase
          </ButtonLink>
        </div>
      </Card>
    </div>
  )
}
