import { Check, CheckCheck, Info, Lock, Play, RotateCcw, Swords } from 'lucide-react'
import { useState } from 'react'
import { Link, useParams } from 'react-router'
import { registry } from '../../content'
import { masteryTier, TIER_LABEL } from '../../engine/mastery'
import { isMissionPassed, missionScore, missionStatus, passThreshold, phaseMedal, phasesToComplete, phaseStatus, unmetRequirements, unmetTrackRequirements } from '../../engine/selectors'
import type { MissionDef, PhaseDef } from '../../engine/types'
import { useGame } from '../../store/gameStore'
import { useDocumentTitle } from '../../app/hooks'
import { Badge, Button, ButtonLink, Callout, Card, IconTile, Modal } from '../../ui/kit'
import { MEDAL_LABEL, MISSION_STATUS, PHASE_STATUS } from '../map/status'
import { NotFound } from '../NotFound'
import s from './phase.module.css'
import { phaseLabel, phaseMention } from '../../app/format'

export function PhasePage() {
  const { phaseId = '' } = useParams()
  const ref = registry.phases.get(phaseId)
  useDocumentTitle(ref?.phase.title ?? 'Fase')
  const progress = useGame((st) => st.progress)
  const markCompleted = useGame((st) => st.markMissionsCompleted)
  const [confirm, setConfirm] = useState<{ kind: 'mission'; mission: MissionDef } | { kind: 'phase'; phases: PhaseDef[] } | null>(null)
  if (!ref) return <NotFound />
  const { phase, track } = ref
  const st = phaseStatus(progress, registry, phase.id)
  const medal = phaseMedal(progress, phase)
  const missing = unmetRequirements(progress, registry, phase)
  const canMark = st !== 'completed' && st !== 'in-construction'

  function confirmMark() {
    if (!confirm) return
    const missions = confirm.kind === 'mission' ? [confirm.mission] : confirm.phases.flatMap((p) => p.missions)
    markCompleted(missions.filter((m) => !isMissionPassed(progress, m)).map((m) => m.id))
    setConfirm(null)
  }

  return (
    <div className="page" style={{ ['--phase' as string]: phase.color }}>
      <nav className={s.breadcrumb} aria-label="Navegação">
        <Link to="/mapa">Mapa</Link> / <Link to={`/trilha/${track.id}?fase=${phase.id}`}>{track.title}</Link> / <span>{phaseLabel(phase)}</span>
      </nav>
      <header className={s.head}>
        <IconTile glyph={phase.glyph} color={phase.color} size={64} />
        <div>
          <p className={s.order}>{phaseLabel(phase)}</p>
          <h1>{phase.title}</h1>
          <p className="muted">{phase.summary}</p>
          <div className="row">
            <Badge tone={PHASE_STATUS[st].tone}>{PHASE_STATUS[st].label}</Badge>
            {medal && <Badge tone="xp">{MEDAL_LABEL[medal]}</Badge>}
          </div>
          {canMark && (
            <Button variant="ghost" size="small" className={s.markPhase} onClick={() => setConfirm({ kind: 'phase', phases: phasesToComplete(progress, registry, phase) })}>
              <CheckCheck size={16} aria-hidden="true" /> Já fiz esta fase: marcar como concluída
            </Button>
          )}
        </div>
      </header>

      {st === 'in-construction' && (
        <Callout kind="info" title="Fase em construção">
          <p>As missões desta fase ainda não estão disponíveis.</p>
        </Callout>
      )}
      {st === 'locked' && (
        <Callout kind="warning" title="Fase bloqueada">
          {missing.length > 0 ? (
            <p>Conclua antes: {missing.map((m) => phaseMention(m, track.id)).join('; ')}.</p>
          ) : (
            <p>
              Esta trilha depende de outra ainda não concluída:{' '}
              {unmetTrackRequirements(progress, registry, track)
                .map((t) => t.title)
                .join(', ')}
              .
            </p>
          )}
        </Callout>
      )}

      <ol className={s.missions}>
        {phase.missions.map((m, i) => {
          const ms = missionStatus(progress, registry, m.id)
          const score = missionScore(progress, m)
          const attempted = m.activities.some((a) => progress.activities[a.id])
          const isBoss = m.type !== 'mission'
          return (
            <li key={m.id}>
              <Card className={s.mission} as="article" style={{ opacity: ms === 'locked' ? 0.65 : 1 }}>
                <div className={s.missionIcon} data-status={ms} data-boss={isBoss}>
                  {ms === 'passed' ? <Check size={22} /> : ms === 'locked' ? <Lock size={20} /> : isBoss ? <Swords size={22} /> : <span>{i + 1}</span>}
                </div>
                <div className={s.missionBody}>
                  <div className="row">
                    <h2 className={s.missionTitle}>{m.title}</h2>
                    {isBoss && <Badge tone="danger">Chefe</Badge>}
                    <Badge tone={MISSION_STATUS[ms].tone}>{MISSION_STATUS[ms].label}</Badge>
                  </div>
                  <p className="muted">{m.summary}</p>
                  <p className={s.meta}>
                    {m.activities.length} desafio(s) · aprovação com {Math.round(passThreshold(m) * 100)}%
                    {attempted && ` · melhor resultado: ${Math.round(score * 100)}%`}
                    {ms === 'passed' && progress.missions[m.id]?.manual && ' · marcada como concluída sem jogar'}
                  </p>
                </div>
                <div className={s.missionAction}>
                  {ms === 'locked' ? (
                    <span className={s.meta}>Aprove a missão anterior</span>
                  ) : (
                    <ButtonLink to={`/missao/${m.id}`} variant={ms === 'passed' ? 'secondary' : 'primary'}>
                      {ms === 'passed' ? <RotateCcw size={16} aria-hidden="true" /> : <Play size={16} aria-hidden="true" />}
                      {ms === 'passed' ? 'Refazer' : ms === 'in-progress' ? 'Continuar' : 'Jogar'}
                    </ButtonLink>
                  )}
                  {(ms === 'available' || ms === 'in-progress') && (
                    <Button variant="ghost" size="small" onClick={() => setConfirm({ kind: 'mission', mission: m })}>
                      Já fiz: marcar como concluída
                    </Button>
                  )}
                </div>
              </Card>
            </li>
          )
        })}
      </ol>

      {phase.concepts.length > 0 && (
        <section className={s.section} aria-labelledby="concepts-title">
          <h2 id="concepts-title">Conceitos desta fase</h2>
          <ul className={s.concepts}>
            {phase.concepts.map((cid) => {
              const c = registry.concepts.get(cid)
              const tier = masteryTier(progress.concepts[cid])
              const discovered = Boolean(progress.discovered[cid])
              return (
                <li key={cid}>
                  {discovered ? <Link to={`/codex/${cid}`}>{c?.title}</Link> : <span className="muted">Conceito não descoberto</span>}
                  {discovered && <Badge tone={tier === 'dominado' ? 'mastery' : tier === 'praticando' ? 'info' : 'neutral'}>{TIER_LABEL[tier]}</Badge>}
                </li>
              )
            })}
          </ul>
        </section>
      )}

      <Modal
        open={confirm !== null}
        onClose={() => setConfirm(null)}
        labelledBy="confirmar-conclusao"
        actions={
          <>
            <Button variant="secondary" onClick={() => setConfirm(null)}>
              Cancelar
            </Button>
            <Button onClick={confirmMark}>Marcar como concluída</Button>
          </>
        }
      >
        {confirm?.kind === 'mission' && (
          <>
            <h2 id="confirmar-conclusao">Marcar a missão como concluída?</h2>
            <p>
              A missão <strong>{confirm.mission.title}</strong> será marcada como concluída e a próxima fica liberada. Use esta opção se você já fez a missão e perdeu o
              progresso salvo.
            </p>
          </>
        )}
        {confirm?.kind === 'phase' && (
          <>
            <h2 id="confirmar-conclusao">Marcar a fase como concluída?</h2>
            <p>
              Todas as missões de <strong>{phaseMention(phase, track.id)}</strong> serão marcadas como concluídas, e o que depende dela fica liberado. Use esta opção se você já
              fez a fase e perdeu o progresso salvo.
            </p>
            {confirm.phases.length > 1 && (
              <>
                <p>Esta fase está bloqueada. Para liberá-la, também serão marcadas como concluídas:</p>
                <ul className={s.markList}>
                  {confirm.phases
                    .filter((p) => p.id !== phase.id)
                    .map((p) => (
                      <li key={p.id}>{phaseMention(p, track.id)}</li>
                    ))}
                </ul>
              </>
            )}
          </>
        )}
        <p>Os conceitos avaliados entram na Revisão do dia, para você confirmar o que lembra. Não há XP: os pontos vêm das atividades jogadas. Você pode refazer qualquer missão depois.</p>
      </Modal>

      {phase.simplifications && phase.simplifications.length > 0 && (
        <section className={s.section} aria-labelledby="simp-title">
          <h2 id="simp-title">
            <Info size={18} aria-hidden="true" style={{ verticalAlign: '-2px' }} /> Simplificações desta fase
          </h2>
          <ul className="muted">
            {phase.simplifications.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}
