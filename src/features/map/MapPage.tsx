import { ChevronRight } from 'lucide-react'
import { Link } from 'react-router'
import { registry } from '../../content'
import { trackPhases } from '../../engine/registry'
import { isTrackCompleted, trackProgress, unmetTrackRecommendations, unmetTrackRequirements } from '../../engine/selectors'
import { recommendedTrackOrder, type TrackOrderStep } from '../../engine/track-order'
import { useGame } from '../../store/gameStore'
import { useDocumentTitle } from '../../app/hooks'
import { PLANNED_TRACKS } from '../../content/catalog/catalog'
import { Badge, Card, IconTile, ProgressBar } from '../../ui/kit'
import s from './map.module.css'

const ORDER = recommendedTrackOrder(registry)

/** Explica, em uma frase, por que a trilha vem depois das anteriores. */
function orderReason(step: TrackOrderStep): string {
  if (step.after.length === 0) return 'Ponto de partida: apresenta a nuvem e os conceitos que as outras trilhas usam.'
  const parts = step.after.map((a) => {
    const n = a.concepts.length
    if (n === 0) return a.track.title
    return `${a.track.title} (${n} ${n === 1 ? 'conceito reaproveitado' : 'conceitos reaproveitados'})`
  })
  const list = parts.length === 1 ? parts[0] : `${parts.slice(0, -1).join(', ')} e ${parts[parts.length - 1]}`
  return `Usa o que você aprende em ${list}.`
}

function conceptList(step: TrackOrderStep): string | undefined {
  const titles = step.after.flatMap((a) => a.concepts.map((c) => registry.concepts.get(c)?.title ?? c))
  return titles.length ? `Conceitos reaproveitados: ${titles.join(', ')}` : undefined
}

export function MapPage() {
  useDocumentTitle('Mapa')
  const progress = useGame((st) => st.progress)
  const nextId = ORDER.find((step) => !isTrackCompleted(progress, step.track))?.track.id
  return (
    <div className="page">
      <p className="eyebrow">Mapa do mundo</p>
      <h1>Territórios AWS</h1>
      <p className="muted" style={{ maxWidth: 680 }}>
        Cada território reúne trilhas de um grupo de serviços. Conceitos aprendidos em um território (como permissões do IAM) contam para os outros.
      </p>
      <Card as="section" className={s.order} aria-labelledby="order-title">
        <h2 id="order-title" className={s.orderTitle}>
          Ordem sugerida das trilhas
        </h2>
        <p className="muted">
          Nenhuma trilha fica bloqueada, mas esta ordem evita encontrar um conceito antes de aprendê-lo. Ela vem das trilhas que cada uma recomenda e dos conceitos que cada uma reaproveita das outras.
        </p>
        <ol className={s.orderList}>
          {ORDER.map((step, i) => {
            const done = isTrackCompleted(progress, step.track)
            return (
              <li key={step.track.id} data-status={done ? 'completed' : step.track.id === nextId ? 'next' : 'pending'}>
                <span className={s.orderNum} aria-hidden="true">
                  {i + 1}
                </span>
                <div className={s.orderText}>
                  <span className={s.orderHead}>
                    <Link to={`/trilha/${step.track.id}`}>{step.track.title}</Link>
                    {done ? <Badge tone="success">Concluída</Badge> : step.track.id === nextId ? <Badge tone="accent">Sugestão atual</Badge> : null}
                  </span>
                  <span className={s.small} title={conceptList(step)}>
                    {orderReason(step)}
                  </span>
                </div>
              </li>
            )
          })}
          {PLANNED_TRACKS.length > 0 && (
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
      </Card>
      <div className={s.territories}>
        {registry.territories.map((t) => {
          const tracks = [...registry.tracks.values()].filter((tr) => tr.territory === t.id)
          return (
            <Card key={t.id} className={s.territory} as="article" style={{ opacity: t.status === 'planned' ? 0.72 : 1 }}>
              <div className={s.terrHead}>
                <IconTile glyph={t.glyph} color={t.status === 'active' ? 'var(--accent)' : 'var(--text-faint)'} />
                <div>
                  <h2 className={s.terrTitle}>{t.title}</h2>
                  <span className="muted">{t.summary}</span>
                </div>
              </div>
              {t.status === 'planned' ? (
                <>
                  <Badge>Em planejamento</Badge>
                  {t.plannedServices && <p className={s.planned}>Previsto: {t.plannedServices.join(', ')}.</p>}
                </>
              ) : (
                tracks.map((tr) => {
                  const tp = trackProgress(progress, tr)
                  const total = trackPhases(tr).length
                  const live = trackPhases(tr).filter((p) => p.availability === 'available').length
                  return (
                    <Link key={tr.id} to={`/trilha/${tr.id}`} className={s.trackLink}>
                      <div className={s.trackLinkText}>
                        <strong>{tr.title}</strong>
                        <span className="muted">{tr.subtitle}</span>
                        <ProgressBar value={tp.ratio} label={`Progresso em ${tr.title}`} />
                        <span className={s.small}>
                          {live} de {total} fases liberadas · {tp.passed}/{tp.total} missões aprovadas
                        </span>
                        {unmetTrackRequirements(progress, registry, tr).length > 0 ? (
                          <span className={s.small}>Bloqueada até concluir: {unmetTrackRequirements(progress, registry, tr).map((x) => x.title).join(', ')}</span>
                        ) : unmetTrackRecommendations(progress, registry, tr).length > 0 ? (
                          <span className={s.small}>Recomendado antes: {unmetTrackRecommendations(progress, registry, tr).map((x) => x.title).join(', ')}</span>
                        ) : null}
                      </div>
                      <ChevronRight aria-hidden="true" />
                    </Link>
                  )
                }).concat(t.plannedServices?.length ? [<p key="previsto" className={s.planned}>Também previsto neste território: {t.plannedServices.join(', ')}.</p>] : [])
              )}
            </Card>
          )
        })}
      </div>
    </div>
  )
}
