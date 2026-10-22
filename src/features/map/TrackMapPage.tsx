import { Check, Clock, Lock, Medal, Play, Swords, TriangleAlert, Wrench } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router'
import { registry } from '../../content'
import { trackPhases } from '../../engine/registry'
import { masteryTier } from '../../engine/mastery'
import { missionStatus, phaseMedal, phaseProgress, phaseStatus, trackProgress, unmetRecommendations, unmetRequirements, unmetTrackRecommendations, unmetTrackRequirements, type PhaseStatus } from '../../engine/selectors'
import type { PhaseDef } from '../../engine/types'
import { useGame } from '../../store/gameStore'
import { useDocumentTitle } from '../../app/hooks'
import { Badge, ButtonLink, Callout, Card, ProgressBar } from '../../ui/kit'
import { Glyph } from '../../ui/Glyph'
import { NotFound } from '../NotFound'
import { phaseLabel, phaseMention } from '../../app/format'
import { MEDAL_LABEL, MISSION_STATUS, PHASE_STATUS, mapEdges } from './status'
import { MAP_H, MAP_W, NODE, labelLines, mapRoutes } from './layout'
import s from './map.module.css'

function StatusIcon({ status }: { status: PhaseStatus }) {
  if (status === 'locked') return <Lock size={14} aria-hidden="true" />
  if (status === 'in-construction') return <Wrench size={14} aria-hidden="true" />
  if (status === 'completed') return <Check size={14} aria-hidden="true" />
  return null
}

export function TrackMapPage() {
  const { trackId = '' } = useParams()
  const [params, setParams] = useSearchParams()
  const track = registry.tracks.get(trackId)
  useDocumentTitle(track?.title ?? 'Trilha')
  const progress = useGame((st) => st.progress)
  const phases = useMemo(() => (track ? trackPhases(track) : []), [track])
  const routes = useMemo(() => mapRoutes(phases, mapEdges(phases)), [phases])
  const firstOpen = phases.find((p) => ['available', 'in-progress'].includes(phaseStatus(progress, registry, p.id)))
  const selectedId = params.get('fase') ?? firstOpen?.id ?? phases[0]?.id
  const selected = phases.find((p) => p.id === selectedId)
  const panelRef = useRef<HTMLDivElement>(null)
  const [userPicked, setUserPicked] = useState(false)

  useEffect(() => {
    if (userPicked && window.matchMedia('(max-width: 1099px)').matches) panelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [selectedId, userPicked])

  if (!track) return <NotFound />
  const tp = trackProgress(progress, track)
  const pick = (id: string) => {
    setUserPicked(true)
    setParams({ fase: id }, { replace: true })
  }
  const territory = registry.territories.find((t) => t.id === track.territory)
  const trackMissing = unmetTrackRequirements(progress, registry, track)
  const trackRecommended = unmetTrackRecommendations(progress, registry, track)
  const viewH = track.mapHeight ?? MAP_H
  const isOpen = (from: string) => phaseStatus(progress, registry, from) === 'completed'

  return (
    <div className="page">
      <nav className={s.breadcrumb} aria-label="Navegação">
        <Link to="/mapa">Mapa</Link> / <span>{track.title}</span>
      </nav>
      <header className={s.trackHead}>
        <div>
          <p className="eyebrow">Trilha · {territory?.title ?? 'AWS'}</p>
          <h1>
            {track.title} <span className={s.subtitle}>— {track.subtitle}</span>
          </h1>
          <p className="muted" style={{ maxWidth: 720 }}>
            {track.summary}
          </p>
        </div>
        <div className={s.trackProgress}>
          <ProgressBar value={tp.ratio} label="Progresso da trilha" />
          <span className={s.small}>
            {tp.passed}/{tp.total} missões disponíveis aprovadas
          </span>
        </div>
      </header>

      {trackMissing.length > 0 && (
        <Callout kind="warning" title="Trilha bloqueada">
          <p>
            Conclua antes:{' '}
            {trackMissing.map((t, i) => (
              <span key={t.id}>
                {i > 0 && ', '}
                <Link to={`/trilha/${t.id}`}>{t.title}</Link>
              </span>
            ))}
            .
          </p>
        </Callout>
      )}
      {trackMissing.length === 0 && trackRecommended.length > 0 && (
        <Callout kind="tip" title="Recomendado antes">
          <p>
            {trackRecommended.map((t, i) => (
              <span key={t.id}>
                {i > 0 && (i === trackRecommended.length - 1 ? ' e ' : ', ')}
                <Link to={`/trilha/${t.id}`}>{t.title}</Link>
              </span>
            ))}{' '}
            {trackRecommended.length === 1
              ? 'prepara os fundamentos usados aqui, mas não é obrigatória. Você pode jogar as duas trilhas em paralelo.'
              : 'preparam os fundamentos usados aqui, mas não são obrigatórias. Você pode jogar as trilhas em paralelo.'}
          </p>
        </Callout>
      )}

      <ul className={s.legend} aria-label="Legenda">
        {(['available', 'in-progress', 'completed', 'locked', 'in-construction'] as PhaseStatus[])
          .filter((st) => st !== 'in-construction' || phases.some((p) => p.availability === 'in-construction'))
          .map((st) => (
          <li key={st} data-status={st}>
            <span className={s.legendDot} />
            {PHASE_STATUS[st].label}
          </li>
        ))}
      </ul>

      <div className={s.layout}>
        <div className={s.mapWrap}>
          {/* Mapa em grafo (telas médias e grandes) */}
          <div className={s.map} style={{ aspectRatio: `${MAP_W} / ${viewH}` }}>
            <svg className={s.edges} viewBox={`0 0 ${MAP_W} ${viewH}`} preserveAspectRatio="none" aria-hidden="true">
              {/* As liberadas por último, para ficarem por cima dos trechos divididos. */}
              {[...routes].sort((a, b) => Number(isOpen(a.from)) - Number(isOpen(b.from))).map(({ from, to, d }) => {
                const open = isOpen(from)
                return <path key={`${from}-${to}`} data-from={from} data-to={to} d={d} className={open ? s.edgeOpen : s.edge} vectorEffect="non-scaling-stroke" />
              })}
            </svg>
            {phases.map((p) => {
              const st = phaseStatus(progress, registry, p.id)
              const pp = phaseProgress(progress, p)
              const hex = p.id === track.final?.id ? NODE.finalHex : NODE.hex
              return (
                <button
                  key={p.id}
                  type="button"
                  className={s.node}
                  data-status={st}
                  data-selected={p.id === selectedId}
                  data-final={p.id === track.final?.id}
                  data-phase={p.id}
                  style={{ left: `${(p.map.x / MAP_W) * 100}%`, top: `${((p.map.y - hex / 2) / viewH) * 100}%`, ['--node-color' as string]: p.color }}
                  onClick={() => pick(p.id)}
                  aria-pressed={p.id === selectedId}
                  aria-label={`${phaseLabel(p)}: ${p.title}. ${PHASE_STATUS[st].label}.`}
                >
                  <span className={s.hex} data-part="hex">
                    <Glyph name={p.glyph} size={26} />
                    {pp.total > 0 && st !== 'completed' && <span className={s.nodeProgress} style={{ ['--p' as string]: pp.ratio }} />}
                  </span>
                  <span className={s.nodeBadge} data-part="badge">
                    <StatusIcon status={st} />
                    {p.id === track.final?.id ? 'Final' : `F${p.order}`}
                  </span>
                  <span className={s.nodeLabel} data-part="label" data-lines={labelLines(p.title)}>
                    {p.title}
                  </span>
                </button>
              )
            })}
          </div>

          {/* Rota vertical (celular) */}
          <ol className={s.route}>
            {[...phases]
              .sort((a, b) => a.order - b.order)
              .map((p) => {
                const st = phaseStatus(progress, registry, p.id)
                return (
                  <li key={p.id}>
                    <button type="button" className={s.routeItem} data-status={st} data-selected={p.id === selectedId} style={{ ['--node-color' as string]: p.color }} onClick={() => pick(p.id)} aria-pressed={p.id === selectedId}>
                      <span className={s.routeHex}>
                        <Glyph name={p.glyph} size={20} />
                      </span>
                      <span className={s.routeText}>
                        <span className={s.routeOrder}>{phaseLabel(p)}</span>
                        <span className={s.routeTitle}>{p.title}</span>
                      </span>
                      <Badge tone={PHASE_STATUS[st].tone} icon={<StatusIcon status={st} />}>
                        {PHASE_STATUS[st].label}
                      </Badge>
                    </button>
                  </li>
                )
              })}
          </ol>
        </div>

        <div ref={panelRef} className={s.panelWrap}>
          {selected && <PhasePanel phase={selected} />}
        </div>
      </div>
    </div>
  )
}

function PhasePanel({ phase }: { phase: PhaseDef }) {
  const progress = useGame((st) => st.progress)
  const st = phaseStatus(progress, registry, phase.id)
  const missing = unmetRequirements(progress, registry, phase)
  const recommended = unmetRecommendations(progress, registry, phase)
  const medal = phaseMedal(progress, phase)
  const ctxTrack = registry.phases.get(phase.id)?.track.id
  const pp = phaseProgress(progress, phase)
  const playable = st === 'available' || st === 'in-progress' || st === 'completed'
  const next = phase.missions.find((m) => ['available', 'in-progress'].includes(missionStatus(progress, registry, m.id)))
  return (
    <Card className={s.panel} style={{ ['--phase' as string]: phase.color }} aria-labelledby="phase-panel-title">
      <p className={s.panelOrder}>{phaseLabel(phase)}</p>
      <h2 id="phase-panel-title">{phase.title}</h2>
      <div className="row" style={{ marginBottom: 12 }}>
        <Badge tone={PHASE_STATUS[st].tone} icon={<StatusIcon status={st} />}>
          {PHASE_STATUS[st].label}
        </Badge>
        <Badge icon={<Clock size={13} aria-hidden="true" />}>~{phase.estimatedMinutes} min</Badge>
        {medal && (
          <Badge tone="xp" icon={<Medal size={13} aria-hidden="true" />}>
            {MEDAL_LABEL[medal]}
          </Badge>
        )}
      </div>
      <p className="muted">{phase.summary}</p>

      {st === 'in-construction' && (
        <Callout kind="info" title="Em construção">
          <p>Esta fase está planejada, mas ainda não tem missões jogáveis. Ela será liberada quando os desafios estiverem completos e revisados.</p>
        </Callout>
      )}
      {st === 'locked' && missing.length === 0 && (
        <Callout kind="warning" title="Trilha bloqueada">
          <p>Esta trilha depende de outra trilha ainda não concluída. Veja o aviso no topo do mapa.</p>
        </Callout>
      )}
      {st === 'locked' && missing.length > 0 && (
        <Callout kind="warning" title="Pré-requisitos pendentes">
          <p>Conclua antes: {missing.map((m) => phaseMention(m, ctxTrack)).join(', ')}.</p>
        </Callout>
      )}
      {playable && recommended.length > 0 && (
        <Callout kind="tip" title="Recomendado antes">
          <p>{recommended.map((m) => phaseMention(m, ctxTrack)).join(', ')} ajuda nesta fase, mas não é obrigatória.</p>
        </Callout>
      )}

      {phase.missions.length > 0 && (
        <>
          <h3 className={s.panelSection}>
            Missões ({pp.passed}/{pp.total})
          </h3>
          <ol className={s.missionList}>
            {phase.missions.map((m) => {
              const ms = missionStatus(progress, registry, m.id)
              return (
                <li key={m.id} data-status={ms}>
                  {m.type !== 'mission' ? <Swords size={16} aria-hidden="true" /> : ms === 'passed' ? <Check size={16} aria-hidden="true" /> : ms === 'locked' ? <Lock size={16} aria-hidden="true" /> : <Play size={16} aria-hidden="true" />}
                  <span>{m.title}</span>
                  <span className="sr-only">({MISSION_STATUS[ms].label})</span>
                </li>
              )
            })}
          </ol>
        </>
      )}

      {phase.concepts.length > 0 && (
        <>
          <h3 className={s.panelSection}>Conceitos</h3>
          <div className={s.conceptChips}>
            {phase.concepts.map((cid) => {
              const c = registry.concepts.get(cid)
              const tier = masteryTier(progress.concepts[cid])
              return progress.discovered[cid] ? (
                <Link key={cid} to={`/codex/${cid}`} className={s.conceptChip} data-tier={tier}>
                  {c?.title}
                </Link>
              ) : (
                <span key={cid} className={s.conceptChip} data-tier="hidden">
                  ???
                  <span className="sr-only">conceito ainda não descoberto</span>
                </span>
              )
            })}
          </div>
        </>
      )}

      {playable && (
        <div className="row" style={{ marginTop: 20 }}>
          {next && (
            <ButtonLink to={`/missao/${next.id}`} className={s.playLink}>
              <Play size={18} aria-hidden="true" /> {missionStatus(progress, registry, next.id) === 'in-progress' ? 'Continuar' : 'Jogar'}: {next.title}
            </ButtonLink>
          )}
          <ButtonLink to={`/fase/${phase.id}`} variant="secondary">
            Detalhes da fase
          </ButtonLink>
        </div>
      )}
      {st === 'locked' && (
        <p className={s.small} style={{ marginTop: 12 }}>
          <TriangleAlert size={14} aria-hidden="true" style={{ verticalAlign: '-2px' }} /> Fases bloqueadas não podem ser iniciadas.
        </p>
      )}
    </Card>
  )
}
