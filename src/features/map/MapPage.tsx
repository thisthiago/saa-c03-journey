import { ChevronRight } from 'lucide-react'
import { Link } from 'react-router'
import { registry } from '../../content'
import { trackPhases } from '../../engine/registry'
import { trackProgress, unmetTrackRecommendations, unmetTrackRequirements } from '../../engine/selectors'
import { useGame } from '../../store/gameStore'
import { useDocumentTitle } from '../../app/hooks'
import { Badge, Card, IconTile, ProgressBar } from '../../ui/kit'
import s from './map.module.css'

export function MapPage() {
  useDocumentTitle('Mapa')
  const progress = useGame((st) => st.progress)
  return (
    <div className="page">
      <p className="eyebrow">Mapa do mundo</p>
      <h1>Territórios AWS</h1>
      <p className="muted" style={{ maxWidth: 680 }}>
        Cada território reúne trilhas de um grupo de serviços. Conceitos aprendidos em um território (como permissões do IAM) contam para os outros.
      </p>
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
