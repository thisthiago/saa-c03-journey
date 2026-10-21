import { Brain, Clock, Compass, Flame, Play, RotateCcw, Trophy } from 'lucide-react'
import { useMemo } from 'react'
import { Link } from 'react-router'
import { registry } from '../../content'
import { masteredConceptIds } from '../../engine/achievements'
import { trackPhases } from '../../engine/registry'
import { nextReviewDate } from '../../engine/review'
import { isMissionPassed, nextMission, streakDays, trackProgress } from '../../engine/selectors'
import { clock, useGame } from '../../store/gameStore'
import { useDocumentTitle, useDueCount, usePlayer } from '../../app/hooks'
import { Badge, ButtonLink, Card, IconTile, ProgressBar, ProgressRing } from '../../ui/kit'
import { Glyph } from '../../ui/Glyph'
import { renderInline } from '../../ui/inline'
import { phaseRef, relativeDays } from '../../app/format'
import { EXAM_DOMAINS, PLANNED_TRACKS } from '../../content/catalog/catalog'
import type { ExamDomainId } from '../../engine/types'
import s from './home.module.css'

/** Nome curto de cada domínio do exame, o mesmo das dimensões dos desafios finais. */
const DOMAIN_SHORT: Record<ExamDomainId, string> = { d1: 'Seguro', d2: 'Resiliente', d3: 'Alto desempenho', d4: 'Custo' }

function DomainTag({ id }: { id: ExamDomainId }) {
  const d = EXAM_DOMAINS.find((x) => x.id === id)
  return (
    <span className={s.domainTag} data-domain={id} title={d ? `${d.officialName} (${Math.round(d.weight * 100)}% do exame)` : undefined}>
      {id.toUpperCase()} · {DOMAIN_SHORT[id]}
    </span>
  )
}

function DomainTags({ ids }: { ids?: ExamDomainId[] }) {
  if (!ids?.length) return null
  return (
    <span className={s.domainTags} aria-label={`Domínios do exame: ${ids.map((id) => DOMAIN_SHORT[id]).join(', ')}`}>
      {ids.map((id) => (
        <DomainTag key={id} id={id} />
      ))}
    </span>
  )
}

export function HomePage() {
  useDocumentTitle('Base de Operações')
  const progress = useGame((st) => st.progress)
  const player = usePlayer()
  const due = useDueCount()
  const now = clock.now()
  const suggestion = useMemo(() => nextMission(progress, registry), [progress])
  const tracks = [...registry.tracks.values()]
  const missionRef = suggestion ? registry.missions.get(suggestion.missionId) : undefined
  const started = Object.keys(progress.activities).length > 0
  const mastered = masteredConceptIds(progress).length
  const missionsPassed = [...registry.missions.values()].filter((m) => isMissionPassed(progress, m.mission)).length
  const streak = streakDays(progress.stats.activeDays, now)
  const nextReview = nextReviewDate(progress, registry)
  const recent = Object.entries(progress.achievements)
    .sort((a, b) => b[1].unlockedAt.localeCompare(a[1].unlockedAt))
    .slice(0, 3)
    .map(([id]) => registry.achievements.get(id))
    .filter(Boolean)
  const territoryGlyph = (id: string) => registry.territories.find((t) => t.id === id)?.glyph ?? 'flag'

  return (
    <div className="page">
      <div className={s.hero}>
        <Card className={s.missionCard} style={{ ['--phase' as string]: missionRef?.phase.color ?? 'var(--accent)' }}>
          <p className="eyebrow">Base de Operações</p>
          {missionRef ? (
            <>
              <h1 className={s.heroTitle}>{started ? 'Sua próxima missão está pronta' : 'Sua expedição começa aqui'}</h1>
              <div className={s.missionRow}>
                <IconTile glyph={missionRef.phase.glyph} color={missionRef.phase.color} size={56} />
                <div className={s.missionInfo}>
                  <span className={s.missionPhase}>
                    {phaseRef(missionRef.phase)} · {missionRef.phase.title}
                  </span>
                  <span className={s.missionTitle}>{missionRef.mission.title}</span>
                  <span className="muted">{renderInline(missionRef.mission.summary)}</span>
                </div>
              </div>
              <div className="row">
                <ButtonLink to={`/missao/${missionRef.mission.id}`}>
                  <Play size={18} aria-hidden="true" />
                  {suggestion?.reason === 'next' ? (started ? 'Iniciar missão' : 'Iniciar expedição') : 'Continuar missão'}
                </ButtonLink>
                <ButtonLink to={`/trilha/${missionRef.track.id}`} variant="secondary">
                  <Compass size={18} aria-hidden="true" /> Ver mapa
                </ButtonLink>
              </div>
            </>
          ) : (
            <>
              <h1 className={s.heroTitle}>Conteúdo disponível concluído</h1>
              <p className="muted">Você terminou todas as missões liberadas até agora. Mantenha o que aprendeu com revisões e refaça missões para melhorar suas medalhas.</p>
              <ButtonLink to="/mapa" variant="secondary">
                <Compass size={18} aria-hidden="true" /> Ver mapa
              </ButtonLink>
            </>
          )}
        </Card>

        <Card className={s.playerCard} aria-labelledby="player-title">
          <div className={s.playerTop}>
            <ProgressRing value={player.ratio} size={72} stroke={7} color="var(--xp)" label={`Nível ${player.level}`}>
              {player.level}
            </ProgressRing>
            <div>
              <h2 id="player-title" className={s.playerTitle}>
                {player.title}
              </h2>
              <span className={s.xp}>{player.xp.toLocaleString('pt-BR')} XP</span>
            </div>
          </div>
          <ProgressBar value={player.ratio} color="var(--xp)" label="Progresso até o próximo nível" />
          <p className={s.small}>
            {(player.next - player.xp).toLocaleString('pt-BR')} XP até o nível {player.level + 1}
          </p>
          <ul className={s.stats}>
            <li>
              <Trophy size={16} aria-hidden="true" /> <b>{missionsPassed}</b> missões aprovadas
            </li>
            <li>
              <Brain size={16} aria-hidden="true" /> <b>{mastered}</b> conceitos dominados
            </li>
            <li>
              <Flame size={16} aria-hidden="true" /> <b>{streak}</b> {streak === 1 ? 'dia seguido' : 'dias seguidos'}
            </li>
          </ul>
        </Card>
      </div>

      <div className={s.grid}>
        <Card aria-labelledby="review-title">
          <div className={s.cardHead}>
            <IconTile glyph="history" color="var(--mastery)" />
            <h2 id="review-title" className={s.cardTitle}>
              Revisão inteligente
            </h2>
          </div>
          {due > 0 ? (
            <>
              <p>
                <b>{due}</b> {due === 1 ? 'conceito precisa' : 'conceitos precisam'} de revisão — vencidos ou com domínio baixo.
              </p>
              <ButtonLink to="/revisao" variant="secondary">
                <RotateCcw size={18} aria-hidden="true" /> Revisar agora
              </ButtonLink>
            </>
          ) : nextReview ? (
            <p className="muted">
              <Clock size={16} aria-hidden="true" style={{ verticalAlign: '-3px' }} /> Nenhuma revisão pendente. A próxima vence {relativeDays(nextReview, now)}.
            </p>
          ) : (
            <p className="muted">Conclua desafios para alimentar sua revisão. Conceitos em que você errar voltam primeiro.</p>
          )}
        </Card>

        <Card aria-labelledby="ach-title">
          <div className={s.cardHead}>
            <IconTile glyph="trophy" color="var(--xp)" />
            <h2 id="ach-title" className={s.cardTitle}>
              Conquistas
            </h2>
          </div>
          {recent.length > 0 ? (
            <ul className={s.achList}>
              {recent.map((a) => (
                <li key={a!.id}>
                  <Glyph name={a!.glyph} size={18} /> <span>{a!.title}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="muted">Nenhuma conquista ainda. Elas premiam habilidades — como acertar de primeira ou se recuperar de um erro.</p>
          )}
          <Link to="/dossie">Ver todas as conquistas</Link>
        </Card>
      </div>

      <section className={s.tracks} aria-labelledby="tracks-title">
        <h2 id="tracks-title">Trilhas</h2>
        <div className={s.trackGrid}>
          {tracks.map((track) => {
            const tp = trackProgress(progress, track)
            const phases = trackPhases(track)
            const available = phases.filter((p) => p.availability === 'available').length
            return (
              <Card key={track.id} aria-labelledby={`track-${track.id}`}>
                <div className={s.cardHead}>
                  <IconTile glyph={track.glyph ?? territoryGlyph(track.territory)} />
                  <div>
                    <h3 id={`track-${track.id}`} className={s.cardTitle}>
                      {track.title}
                    </h3>
                    <span className="muted">{track.subtitle}</span>
                  </div>
                </div>
                <ProgressBar value={tp.ratio} label={`Progresso na trilha ${track.title}`} />
                <p className={s.small}>
                  {tp.passed} de {tp.total} missões disponíveis aprovadas · {available} de {phases.length} fases liberadas
                </p>
                <ButtonLink to={`/trilha/${track.id}`} variant="secondary" size="small">
                  Abrir mapa da trilha
                </ButtonLink>
              </Card>
            )
          })}
        </div>
      </section>

      <section className={s.territories} aria-labelledby="territories-title">
        <h2 id="territories-title">Territórios da plataforma</h2>
        <p className="muted">Cada território e cada trilha mostram os domínios do exame que mais trabalham.</p>
        <ul className={s.domainLegend} aria-label="Domínios do exame SAA-C03">
          {EXAM_DOMAINS.map((d) => (
            <li key={d.id}>
              <DomainTag id={d.id} /> <span className="muted">{d.title}, {Math.round(d.weight * 100)}% do exame</span>
            </li>
          ))}
        </ul>
        <div className={s.terrGrid}>
          {registry.territories.map((t) => {
            const inDevelopment = t.status === 'planned' && PLANNED_TRACKS.some((p) => p.territory === t.id)
            const body = (
              <>
                <div className={s.terrHead}>
                  <Glyph name={t.glyph} size={22} />
                  <span className={s.terrName}>{t.title}</span>
                  {t.status === 'active' ? <Badge tone="accent">Disponível</Badge> : <Badge>{inDevelopment ? 'Em desenvolvimento' : 'Em planejamento'}</Badge>}
                </div>
                <DomainTags ids={t.examDomains} />
              </>
            )
            return t.status === 'active' ? (
              <Link key={t.id} to="/mapa" className={s.terr} data-status="active">
                {body}
              </Link>
            ) : (
              <div key={t.id} className={s.terr} data-status="planned" aria-disabled="true">
                {body}
              </div>
            )
          })}
        </div>
        <h3 className={s.devTitle}>Trilhas em desenvolvimento</h3>
        <div className={s.terrGrid}>
          {PLANNED_TRACKS.map((p) => (
            <div key={p.id} className={s.terr} data-status="development">
              <div className={s.terrHead}>
                <Glyph name={p.glyph} size={22} />
                <span className={s.terrName}>{p.title}</span>
                <Badge>Em desenvolvimento</Badge>
              </div>
              <span className={s.terrSub}>
                {p.subtitle} · território {registry.territories.find((t) => t.id === p.territory)?.title}
              </span>
              <DomainTags ids={p.examDomains} />
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
