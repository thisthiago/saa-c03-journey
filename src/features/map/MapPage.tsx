import { ListChecks, ListOrdered, Network, Play, RotateCcw } from 'lucide-react'
import { lazy, Suspense, useMemo } from 'react'
import { Link, useSearchParams } from 'react-router'
import { registry } from '../../content'
import { studyRecommendation, suggestedTrackId, trackState, type StudyRecommendation } from '../../engine/guide'
import { trackPhases, trackTerritory } from '../../engine/registry'
import { trackProgress } from '../../engine/selectors'
import { recommendedTrackOrder, type TrackOrderStep, type TrackTier } from '../../engine/track-order'
import { clock, useGame } from '../../store/gameStore'
import { useDocumentTitle } from '../../app/hooks'
import { plural } from '../../app/format'
import { PLANNED_TRACKS } from '../../content/catalog/catalog'
import { Badge, ButtonLink, Card, ProgressBar } from '../../ui/kit'
import { TRACK_STATUS } from './status'
import s from './map.module.css'

const ORDER = recommendedTrackOrder(registry)

// O mapa de serviços (e o d3) só é baixado quando a aba é aberta.
const ServiceMap = lazy(() => import('./ServiceMap').then((m) => ({ default: m.ServiceMap })))

const TIERS: Record<TrackTier, { title: string; lead: string }> = {
  start: { title: 'Comece por aqui', lead: 'Apresenta a nuvem e os conceitos que todas as outras trilhas usam.' },
  base: { title: 'Base das outras trilhas', lead: 'Outras trilhas recomendam estas antes, porque partem do que elas ensinam.' },
  deeper: { title: 'Aprofundamento', lead: 'Cada uma reaproveita conceitos das trilhas que vêm antes dela na lista.' },
}

/** Grupos da ordem sugerida, com o número da primeira trilha de cada um. */
const GROUPS = ORDER.reduce<{ tier: TrackTier; start: number; steps: TrackOrderStep[] }[]>((acc, step, i) => {
  const last = acc[acc.length - 1]
  if (last && last.tier === step.tier) last.steps.push(step)
  else acc.push({ tier: step.tier, start: i + 1, steps: [step] })
  return acc
}, [])

function titles(list: string[]): string {
  return list.length === 1 ? list[0] : `${list.slice(0, -1).join(', ')} e ${list[list.length - 1]}`
}

/** Frase e ação da faixa de continuidade, a partir da mesma sugestão da Base. */
function stripCopy(rec: StudyRecommendation): { text: string; cta: string; to: string } | undefined {
  const ref = rec.missionId ? registry.missions.get(rec.missionId) : undefined
  if (!ref) return undefined
  const to = `/missao/${ref.mission.id}`
  switch (rec.kind) {
    case 'first-visit':
      return { text: `Comece pela ${ref.track.title}. A primeira missão é ${ref.mission.title}.`, cta: 'Começar a primeira missão', to }
    case 'resume':
    case 'in-progress':
    case 'review':
      return { text: `Você está em ${ref.track.title}, na missão ${ref.mission.title}.`, cta: 'Continuar missão', to }
    case 'next':
      return { text: `A próxima missão de ${ref.track.title} é ${ref.mission.title}.`, cta: 'Começar missão', to }
    case 'next-track': {
      const done = rec.completedTrackId ? registry.tracks.get(rec.completedTrackId) : undefined
      const text = done ? `Você concluiu ${done.title}. A próxima trilha da ordem é ${ref.track.title}.` : `A próxima trilha da ordem é ${ref.track.title}.`
      return { text, cta: 'Começar trilha', to }
    }
    default:
      return undefined
  }
}

function ContinueStrip({ rec }: { rec: StudyRecommendation }) {
  const copy = stripCopy(rec)
  if (rec.kind === 'done' || !copy) {
    return (
      <Card className={s.strip} aria-labelledby="strip-title">
        <h2 id="strip-title" className={s.stripTitle}>
          Você concluiu as {registry.tracks.size} trilhas
        </h2>
        <p className="muted">Mantenha o que aprendeu com revisões e pratique questões no formato do exame.</p>
        <div className="row">
          <ButtonLink to="/revisao/questoes">
            <ListChecks size={18} aria-hidden="true" /> Praticar questões
          </ButtonLink>
          <ButtonLink to="/revisao" variant="ghost">
            <RotateCcw size={18} aria-hidden="true" /> Revisar conceitos
          </ButtonLink>
        </div>
      </Card>
    )
  }
  return (
    <Card className={s.strip} aria-labelledby="strip-title">
      <h2 id="strip-title" className={s.stripTitle}>
        {copy.text}
      </h2>
      <ButtonLink to={copy.to}>
        <Play size={18} aria-hidden="true" /> {copy.cta}
      </ButtonLink>
    </Card>
  )
}

export function MapPage() {
  const [params] = useSearchParams()
  const services = params.get('vista') === 'servicos'
  useDocumentTitle(services ? 'Mapa de serviços' : 'Trilhas')
  const progress = useGame((st) => st.progress)
  const rec = useMemo(() => studyRecommendation(progress, registry, clock.now(), ORDER), [progress])
  const suggested = suggestedTrackId(rec, registry)
  return (
    <div className="page">
      <h1>Trilhas</h1>
      <p className="muted" style={{ maxWidth: 680 }}>
        {services
          ? `Os ${registry.services.size} serviços AWS que as trilhas ensinam, agrupados por território. A cor mostra o território, o tamanho mostra quantas questões citam o serviço e o cinza marca o que ainda está bloqueado.`
          : `As ${registry.tracks.size} trilhas na ordem que evita encontrar um conceito antes de aprendê-lo. Nenhuma fica bloqueada: a ordem é uma recomendação.`}
      </p>
      <ContinueStrip rec={rec} />
      <nav className={s.views} aria-label="Formas de ver o mapa">
        <Link to="/mapa" replace aria-current={services ? undefined : 'page'}>
          <ListOrdered size={18} aria-hidden="true" /> Ordem das trilhas
        </Link>
        <Link to="/mapa?vista=servicos" replace aria-current={services ? 'page' : undefined}>
          <Network size={18} aria-hidden="true" /> Mapa de serviços
        </Link>
      </nav>
      {services ? (
        <Suspense fallback={<div className="muted" aria-busy="true">Carregando…</div>}>
          <ServiceMap />
        </Suspense>
      ) : (
        <TrackOrder progress={progress} suggested={suggested} />
      )}
    </div>
  )
}

function TrackOrder({ progress, suggested }: { progress: ReturnType<typeof useGame.getState>['progress']; suggested: string | undefined }) {
  return (
    <>
      {GROUPS.map((g, gi) => (
        <section key={g.tier} className={s.level} aria-labelledby={`tier-${g.tier}`}>
          <h2 id={`tier-${g.tier}`} className={s.levelTitle}>
            {TIERS[g.tier].title}
          </h2>
          <p className="muted">{TIERS[g.tier].lead}</p>
          <ol className={s.orderList} start={g.start}>
            {g.steps.map((step, i) => {
              const tr = step.track
              const st = trackState(progress, registry, tr)
              const tp = trackProgress(progress, tr)
              const building = trackPhases(tr).filter((p) => p.availability !== 'available').length
              const isNext = tr.id === suggested
              return (
                <li key={tr.id} data-status={isNext ? 'next' : st === 'completed' ? 'completed' : st === 'in-progress' ? 'in-progress' : 'pending'}>
                  <span className={s.orderNum} aria-hidden="true">
                    {g.start + i}
                  </span>
                  <div className={s.orderText}>
                    <span className={s.orderHead}>
                      <Link to={`/trilha/${tr.id}`}>{tr.title}</Link>
                    </span>
                    <span className={s.orderBadges}>
                      <Badge tone={TRACK_STATUS[st].tone}>{TRACK_STATUS[st].label}</Badge>
                      {isNext && <Badge tone="accent">Sugestão</Badge>}
                      <span className={s.small}>{trackTerritory(registry, tr.id)?.title}</span>
                    </span>
                    {st === 'not-started' ? (
                      <span className={s.small}>{plural(tp.total, 'missão', 'missões')}</span>
                    ) : (
                      <>
                        <ProgressBar value={tp.ratio} label={`Progresso em ${tr.title}`} />
                        <span className={s.small}>
                          {tp.passed} de {tp.total} missões aprovadas
                        </span>
                      </>
                    )}
                    {st === 'not-started' && step.after.length > 0 && <span className={s.small}>Usa o que você aprende em {titles(step.after.map((a) => a.track.title))}.</span>}
                    {building > 0 && <span className={s.small}>{plural(building, 'fase em construção', 'fases em construção')}</span>}
                  </div>
                </li>
              )
            })}
            {gi === GROUPS.length - 1 && PLANNED_TRACKS.length > 0 && (
              <li data-status="development">
                <span className={s.orderNum} aria-hidden="true">
                  {ORDER.length + 1}
                </span>
                <div className={s.orderText}>
                  <span className={s.orderHead}>
                    <strong>Trilhas em desenvolvimento</strong>
                    <Badge>Em breve</Badge>
                  </span>
                  <span className={s.small}>{PLANNED_TRACKS.map((p) => p.title).join(', ')}. Elas usam os conceitos das trilhas acima.</span>
                </div>
              </li>
            )}
          </ol>
        </section>
      ))}
    </>
  )
}
