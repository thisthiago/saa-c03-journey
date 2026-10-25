/**
 * Painel ao lado dos desafios: mantém à vista o contexto da missão (situação,
 * objetivo, critérios de sucesso), os desafios e os conceitos-chave, para o
 * jogador não precisar sair do desafio para lembrar o que precisa atender.
 * Em telas estreitas (compact), vira um bloco recolhido acima do desafio.
 */
import { Check, ChevronRight, CircleCheck, PanelRightClose, Target } from 'lucide-react'
import { Link } from 'react-router'
import { registry } from '../../content'
import { ACTIVITY_PASS_SCORE } from '../../engine/xp'
import type { MissionDef, PhaseDef } from '../../engine/types'
import { useGame } from '../../store/gameStore'
import { Card } from '../../ui/kit'
import { Paragraphs } from '../../ui/RichText'
import { renderInline } from '../../ui/inline'
import { phaseLabel } from '../../app/format'
import s from './mission.module.css'

interface Props {
  mission: MissionDef
  phase: PhaseDef
  /** Índice do desafio aberto. */
  current: number
  onJump: (index: number) => void
  onClose?: () => void
  /** Bloco recolhido acima do desafio, para telas estreitas. */
  compact?: boolean
}

export function ContextPanel({ mission, phase, current, onJump, onClose, compact }: Props) {
  const progress = useGame((st) => st.progress)
  const { briefing } = mission

  const content = (
    <>
      <h2 className={s.panelCompany}>{briefing.company}</h2>
      <p className={s.panelText}>{renderInline(briefing.role)}</p>

      <h3 className={s.panelTitle}>Situação</h3>
      <p className={s.panelText}>{renderInline(briefing.situation)}</p>

      <h3 className={s.panelTitle}>
        <Target size={14} aria-hidden="true" /> Objetivo
      </h3>
      <p className={s.panelText}>{renderInline(briefing.objective)}</p>

      <h3 className={s.panelTitle}>Critérios de sucesso</h3>
      <ul className={s.panelCriteria}>
        {briefing.successCriteria.map((c) => (
          <li key={c}>
            <CircleCheck size={14} aria-hidden="true" /> {renderInline(c)}
          </li>
        ))}
      </ul>

      <h3 className={s.panelTitle}>Desafios</h3>
      <ol className={s.panelSteps}>
        {mission.activities.map((a, i) => {
          const passed = (progress.activities[a.id]?.bestScore ?? 0) >= ACTIVITY_PASS_SCORE
          return (
            <li key={a.id}>
              <button type="button" className={s.panelStep} aria-current={i === current ? 'step' : undefined} onClick={() => onJump(i)}>
                <span className={s.panelStepMark} data-passed={passed} aria-hidden="true">
                  {passed ? <Check size={12} /> : i + 1}
                </span>
                <span>{a.title}</span>
                {passed && <span className="sr-only"> (aprovado)</span>}
              </button>
            </li>
          )
        })}
      </ol>

      {mission.intel.length > 0 && (
        <details className={s.panelDetails}>
          <summary>Conceitos-chave ({mission.intel.length})</summary>
          {mission.intel.map((card) => {
            const c = registry.concepts.get(card.conceptId)!
            return (
              <div key={card.conceptId} className={s.panelConcept}>
                <h4>{c.title}</h4>
                <Paragraphs items={card.body ?? [c.summary]} />
                <Link to={`/codex/${c.id}`} className={s.small} target="_blank" rel="noopener">
                  Abrir no Codex (nova aba)
                </Link>
              </div>
            )
          })}
        </details>
      )}

      <details className={s.panelDetails}>
        <summary>Sobre esta fase</summary>
        <p className={s.panelText}>
          <b>
            {phaseLabel(phase)}: {phase.title}.
          </b>{' '}
          {phase.summary}
        </p>
      </details>
    </>
  )

  if (compact) {
    return (
      <aside className={s.panelCompact} aria-label="Contexto da missão">
        <Card className={s.panelCard} as="div">
          <details>
            <summary className={s.panelSummary}>
              <ChevronRight size={18} aria-hidden="true" className={s.panelSummaryIcon} /> Contexto da missão
            </summary>
            {content}
          </details>
        </Card>
      </aside>
    )
  }

  return (
    <aside className={s.panel} aria-label="Contexto da missão">
      <Card className={s.panelCard} as="div">
        <div className={s.panelHead}>
          <p className="eyebrow">Contexto da missão</p>
          <button type="button" className={s.panelClose} onClick={onClose} title="Recolher o painel de contexto">
            <PanelRightClose size={18} aria-hidden="true" />
            <span className="sr-only">Recolher o painel de contexto</span>
          </button>
        </div>
        {content}
      </Card>
    </aside>
  )
}
