import { BookOpen, Brain, ChevronRight, Clock, Compass, Flame, HardDrive, ListChecks, Play, RotateCcw, Trophy } from 'lucide-react'
import { useMemo } from 'react'
import { Link } from 'react-router'
import { registry } from '../../content'
import { masteredConceptIds } from '../../engine/achievements'
import { domainReadiness, focusDomain, relevantTracks, studyRecommendation, type StudyRecommendation, type TrackPick } from '../../engine/guide'
import { trackPhases, trackTerritory } from '../../engine/registry'
import { nextReviewDate } from '../../engine/review'
import { isMissionPassed, streakDays } from '../../engine/selectors'
import { recommendedTrackOrder } from '../../engine/track-order'
import { clock, useGame } from '../../store/gameStore'
import { useDocumentTitle, useDueCount, usePlayer } from '../../app/hooks'
import { Badge, ButtonLink, Card, IconTile, ProgressBar, ProgressRing } from '../../ui/kit'
import { DomainTag, DomainTags } from '../../ui/DomainTag'
import { Glyph } from '../../ui/Glyph'
import { renderInline } from '../../ui/inline'
import { phaseLabel, phaseRef, plural, relativeDays } from '../../app/format'
import { TRACK_STATUS } from '../map/status'
import s from './home.module.css'

const ORDER = recommendedTrackOrder(registry)

/** Conceitos ensinados em alguma fase (os que o Codex agrupa). */
const TAUGHT_CONCEPTS = new Set([...registry.tracks.values()].flatMap((t) => trackPhases(t).flatMap((p) => p.concepts))).size
const ACTIVE_TERRITORIES = registry.territories.filter((t) => t.status === 'active').length

/** Título, explicação e ação principal de cada contexto do estudante. */
function nextStepCopy(rec: StudyRecommendation, due: number) {
  const ref = rec.missionId ? registry.missions.get(rec.missionId) : undefined
  const completed = rec.completedTrackId ? registry.tracks.get(rec.completedTrackId) : undefined
  switch (rec.kind) {
    case 'first-visit':
      return {
        eyebrow: 'Comece por aqui',
        title: 'Aprenda AWS tomando decisões de arquitetura',
        lead: 'Resolva cenários, simule configurações, entenda as consequências das suas escolhas e fortaleça os conceitos cobrados na SAA-C03.',
        why: ref ? `A ${ref.track.title} apresenta a nuvem e os conceitos que as outras trilhas usam. Ela é recomendada antes das outras, mas nenhuma trilha fica bloqueada.` : undefined,
        cta: 'Começar minha primeira missão',
      }
    case 'resume':
      return { eyebrow: 'Seu próximo passo na SAA-C03', title: 'Continue de onde parou', why: 'Você parou no meio desta missão, e o ponto em que estava foi salvo.', cta: 'Continuar missão' }
    case 'in-progress':
      return { eyebrow: 'Seu próximo passo na SAA-C03', title: 'Continue de onde parou', why: 'Você já começou esta missão. Conclua os desafios para aprová-la e liberar a missão seguinte.', cta: 'Continuar missão' }
    case 'review':
      return {
        eyebrow: 'Seu próximo passo na SAA-C03',
        title: 'Hora de revisar',
        why: `${plural(rec.overdue, 'conceito chegou', 'conceitos chegaram')} à data de revisão. Revisar antes de seguir ajuda a fixar o que você já estudou: cada acerto no prazo aumenta o intervalo até a próxima revisão.`,
        cta: 'Revisar conceitos',
      }
    case 'next-track':
      return {
        eyebrow: 'Seu próximo passo na SAA-C03',
        title: ref ? `Próximo assunto: ${ref.track.title}` : 'Próximo assunto',
        why: completed && ref ? `Você concluiu a trilha ${completed.title}. Na ordem sugerida das trilhas, a próxima é ${ref.track.title}.` : ref ? `Na ordem sugerida das trilhas, ${ref.track.title} é a próxima ainda não concluída.` : undefined,
        cta: 'Começar trilha',
      }
    case 'next':
      return {
        eyebrow: 'Seu próximo passo na SAA-C03',
        title: 'Sua próxima missão está pronta',
        why: ref && rec.opensPhase ? `Ela abre a ${phaseLabel(ref.phase)} (${ref.phase.title}), liberada pelo que você já concluiu.` : ref ? `É a próxima missão liberada da trilha ${ref.track.title}.` : undefined,
        cta: 'Começar missão',
      }
    case 'done':
      return {
        eyebrow: 'Seu próximo passo na SAA-C03',
        title: 'Conteúdo disponível concluído',
        why: 'Você terminou todas as missões liberadas até agora. Mantenha o que aprendeu com revisões e pratique questões no formato do exame.',
        cta: due > 0 ? 'Revisar conceitos' : 'Praticar questões',
      }
  }
}

function NextStep({ rec, due }: { rec: StudyRecommendation; due: number }) {
  const ref = rec.missionId ? registry.missions.get(rec.missionId) : undefined
  const copy = nextStepCopy(rec, due)
  const isReview = rec.kind === 'review' || (rec.kind === 'done' && due > 0)
  const primaryTo = isReview ? '/revisao' : rec.kind === 'done' ? '/revisao/questoes' : `/missao/${ref?.mission.id}`
  const color = rec.kind === 'review' ? 'var(--mastery)' : (ref?.phase.color ?? 'var(--accent)')
  return (
    <Card className={s.nextCard} style={{ ['--phase' as string]: color }} aria-labelledby="next-title">
      <p className="eyebrow">{copy.eyebrow}</p>
      <h1 id="next-title" className={s.nextTitle}>
        {copy.title}
      </h1>
      {copy.lead && <p className={s.lead}>{copy.lead}</p>}
      {ref && rec.kind !== 'review' && rec.kind !== 'done' && (
        <div className={s.missionRow}>
          <IconTile glyph={ref.phase.glyph} color={ref.phase.color} size={52} />
          <div className={s.missionInfo}>
            <span className={s.missionPhase}>
              {phaseRef(ref.phase)} · {ref.phase.title}
            </span>
            <span className={s.missionTitle}>{ref.mission.title}</span>
            <span className="muted">{renderInline(ref.mission.summary)}</span>
            <span className={s.small}>{plural(ref.mission.activities.length, 'desafio', 'desafios')}</span>
          </div>
        </div>
      )}
      {rec.kind === 'review' && (
        <ul className={s.dueList} aria-label="Conceitos com revisão vencida">
          {rec.overdueIds.slice(0, 3).map((id) => (
            <li key={id}>
              <Brain size={16} aria-hidden="true" /> {registry.concepts.get(id)?.title ?? id}
            </li>
          ))}
          {rec.overdue > 3 && <li className={s.small}>e mais {plural(rec.overdue - 3, 'conceito', 'conceitos')}</li>}
        </ul>
      )}
      {copy.why && (
        <p className={s.why}>
          <b>Por que esta etapa:</b> {copy.why}
        </p>
      )}
      <div className="row">
        <ButtonLink to={primaryTo}>
          {isReview ? <RotateCcw size={18} aria-hidden="true" /> : rec.kind === 'done' ? <ListChecks size={18} aria-hidden="true" /> : <Play size={18} aria-hidden="true" />}
          {copy.cta}
        </ButtonLink>
        {rec.kind === 'first-visit' || rec.kind === 'done' ? (
          <ButtonLink to="/mapa" variant="ghost">
            <Compass size={18} aria-hidden="true" /> Ver todas as trilhas
          </ButtonLink>
        ) : ref && rec.kind !== 'review' ? (
          <ButtonLink to={`/trilha/${ref.track.id}`} variant="ghost">
            <Compass size={18} aria-hidden="true" /> Ver mapa da trilha
          </ButtonLink>
        ) : null}
      </div>
    </Card>
  )
}

function HowItWorks() {
  return (
    <>
      <Card aria-labelledby="how-title">
        <h2 id="how-title" className={s.cardTitle}>
          Como funciona uma missão
        </h2>
        <ol className={s.steps}>
          <li>
            <b>Contexto:</b> uma empresa com um problema real para resolver na AWS.
          </li>
          <li>
            <b>Conceitos-chave:</b> o essencial de teoria para tomar a decisão.
          </li>
          <li>
            <b>Desafios:</b> decisões, simulações e laboratórios, com explicação das consequências de cada escolha.
          </li>
          <li>
            <b>Resultado:</b> o que você acertou e o que vale revisar.
          </li>
        </ol>
        <p className={s.small}>Depois, a revisão espaçada traz de volta cada conceito no momento certo para você não esquecer.</p>
      </Card>
      <Card aria-labelledby="storage-title">
        <div className={s.cardHead}>
          <HardDrive size={18} aria-hidden="true" className={s.headIcon} />
          <h2 id="storage-title" className={s.cardTitle}>
            Sem cadastro
          </h2>
        </div>
        <p className={s.small}>
          Seu progresso fica salvo neste navegador. Para guardar uma cópia ou continuar em outro navegador, exporte o arquivo em <Link to="/dossie">Meu progresso</Link>.
        </p>
      </Card>
    </>
  )
}

function ReviewCard({ due }: { due: number }) {
  const progress = useGame((st) => st.progress)
  const now = clock.now()
  const next = nextReviewDate(progress, registry)
  return (
    <Card aria-labelledby="review-title">
      <div className={s.cardHead}>
        <IconTile glyph="history" color="var(--mastery)" size={36} />
        <h2 id="review-title" className={s.cardTitle}>
          Revisão
        </h2>
      </div>
      {due > 0 ? (
        <>
          <p className={s.cardText}>
            <b>{due}</b> {due === 1 ? 'conceito para revisar: vencido ou com domínio baixo.' : 'conceitos para revisar: vencidos ou com domínio baixo.'}
          </p>
          <ButtonLink to="/revisao" variant="secondary" size="small">
            <RotateCcw size={16} aria-hidden="true" /> Revisar agora
          </ButtonLink>
        </>
      ) : next ? (
        <p className={s.cardText}>
          <Clock size={16} aria-hidden="true" className={s.inlineIcon} /> Nenhuma revisão pendente. A próxima vence {relativeDays(next, now)}.
        </p>
      ) : (
        <p className={s.cardText}>Conclua desafios para alimentar sua revisão. Conceitos em que você errar voltam primeiro.</p>
      )}
      <Link to="/revisao/questoes" className={s.small}>
        Praticar questões no formato do exame
      </Link>
    </Card>
  )
}

function AfterReview({ missionId }: { missionId: string }) {
  const ref = registry.missions.get(missionId)
  if (!ref) return null
  return (
    <Card aria-labelledby="after-title">
      <h2 id="after-title" className={s.cardTitle}>
        Depois da revisão
      </h2>
      <p className={s.cardText}>
        <span className={s.small}>{phaseRef(ref.phase)}</span>
        <br />
        <Link to={`/missao/${ref.mission.id}`}>{ref.mission.title}</Link>
      </p>
    </Card>
  )
}

function ProgressSummary() {
  const progress = useGame((st) => st.progress)
  const player = usePlayer()
  const missionsPassed = useMemo(() => [...registry.missions.values()].filter((m) => isMissionPassed(progress, m.mission)).length, [progress])
  const mastered = masteredConceptIds(progress).length
  const streak = streakDays(progress.stats.activeDays, clock.now())
  const latest = Object.entries(progress.achievements).sort((a, b) => b[1].unlockedAt.localeCompare(a[1].unlockedAt))[0]
  const achievement = latest ? registry.achievements.get(latest[0]) : undefined
  return (
    <Card aria-labelledby="player-title">
      <div className={s.playerTop}>
        <ProgressRing value={player.ratio} size={48} stroke={5} color="var(--xp)" label={`Nível ${player.level}`}>
          {player.level}
        </ProgressRing>
        <div>
          <h2 id="player-title" className={s.cardTitle}>
            {player.title}
          </h2>
          <span className={s.xp}>
            {player.xp.toLocaleString('pt-BR')} XP · faltam {(player.next - player.xp).toLocaleString('pt-BR')} para o nível {player.level + 1}
          </span>
        </div>
      </div>
      <ul className={s.stats}>
        <li>
          <Trophy size={16} aria-hidden="true" /> {plural(missionsPassed, 'missão aprovada', 'missões aprovadas')}
        </li>
        <li>
          <Brain size={16} aria-hidden="true" /> {plural(mastered, 'conceito dominado', 'conceitos dominados')}
        </li>
        <li>
          <Flame size={16} aria-hidden="true" /> {plural(streak, 'dia seguido', 'dias seguidos')} de estudo
        </li>
      </ul>
      {achievement && (
        <p className={s.achievement}>
          <Glyph name={achievement.glyph} size={16} /> Última conquista: <span>{achievement.title}</span>
        </p>
      )}
      <Link to="/dossie" className={s.small}>
        Ver meu progresso e as conquistas
      </Link>
    </Card>
  )
}

function ExamPrep({ firstVisit }: { firstVisit: boolean }) {
  const progress = useGame((st) => st.progress)
  const readiness = useMemo(() => domainReadiness(progress, registry), [progress])
  const focus = focusDomain(readiness)
  return (
    <section className={s.section} aria-labelledby="prep-title">
      <div className={s.sectionHead}>
        <h2 id="prep-title">Preparo para a SAA-C03</h2>
      </div>
      <p className={`muted ${s.sectionLead}`}>
        {firstVisit
          ? 'O exame cobra quatro domínios, com pesos diferentes. Conforme você estuda, aqui aparecem os conceitos estudados e dominados e as questões que você acertou em cada um.'
          : 'Conceitos e questões de cada domínio do exame, em números. Eles indicam onde focar; não preveem a nota da prova. Um conceito pode contar em mais de um domínio.'}
      </p>
      <ul className={s.domains}>
        {readiness.map((r) => (
          <li key={r.domain.id} className={s.domain}>
            <div className={s.domainHead}>
              <DomainTag id={r.domain.id} />
              <span className={s.small}>{Math.round(r.domain.weight * 100)}% do exame</span>
            </div>
            <strong className={s.domainName}>{r.domain.title}</strong>
            {!firstVisit && (
              <>
                <ProgressBar value={r.concepts ? r.studied / r.concepts : 0} color="var(--mastery)" label={`Conceitos estudados em ${r.domain.title}`} />
                <dl className={s.domainStats}>
                  <dt>Conceitos estudados</dt>
                  <dd>
                    {r.studied} de {r.concepts}
                  </dd>
                  <dt>Conceitos dominados</dt>
                  <dd>{r.mastered}</dd>
                  <dt>Questões respondidas</dt>
                  <dd>
                    {r.answered} de {r.questions}
                  </dd>
                  {r.answered > 0 && (
                    <>
                      <dt>Certas na última resposta</dt>
                      <dd>{r.correct}</dd>
                    </>
                  )}
                </dl>
              </>
            )}
          </li>
        ))}
      </ul>
      {!firstVisit && (
        <div className={s.focus}>
          {focus ? (
            <p className={s.cardText}>
              <b>Onde reforçar:</b> {focus.domain.title}.{' '}
              {[focus.weak > 0 && plural(focus.weak, 'conceito com domínio baixo', 'conceitos com domínio baixo'), focus.answered - focus.correct > 0 && plural(focus.answered - focus.correct, 'questão errada', 'questões erradas') + ' na última resposta']
                .filter(Boolean)
                .join(' e ')}
              .
            </p>
          ) : (
            <p className={s.cardText}>Ainda não há pontos fracos registrados. Responder questões do banco mostra como você está em cada domínio.</p>
          )}
          <ButtonLink to={focus ? `/revisao/questoes?dominio=${focus.domain.id}` : '/revisao/questoes'} variant="secondary" size="small">
            <ListChecks size={16} aria-hidden="true" /> {focus ? 'Praticar questões deste domínio' : 'Abrir o banco de questões'}
          </ButtonLink>
        </div>
      )}
    </section>
  )
}

function TrackCard({ pick }: { pick: TrackPick }) {
  const { track, progress: tp } = pick
  const st = TRACK_STATUS[pick.state]
  const territory = trackTerritory(registry, track.id)
  const to = pick.state !== 'completed' && pick.nextMissionId ? `/missao/${pick.nextMissionId}` : `/trilha/${track.id}`
  return (
    <Card as="article" className={s.trackCard} aria-labelledby={`track-${track.id}`}>
      <div className={s.cardHead}>
        <IconTile glyph={track.glyph ?? territory?.glyph ?? 'flag'} size={40} />
        <div className={s.trackHeadText}>
          <h3 id={`track-${track.id}`} className={s.cardTitle}>
            {track.title}
          </h3>
          <span className={s.small}>{track.subtitle}</span>
        </div>
      </div>
      <div className={s.trackMeta}>
        <Badge tone={st.tone}>{st.label}</Badge>
        <DomainTags ids={territory?.examDomains} />
      </div>
      <ProgressBar value={tp.ratio} label={`Progresso na trilha ${track.title}`} />
      <span className={s.small}>
        {tp.passed} de {tp.total} missões aprovadas
      </span>
      {pick.state === 'not-started' && pick.recommendedBefore.length > 0 && <span className={s.small}>Recomendado antes: {pick.recommendedBefore.map((t) => t.title).join(', ')}</span>}
      <div className={s.trackActions}>
        <ButtonLink to={to} variant="secondary" size="small">
          {st.action}
        </ButtonLink>
        {pick.state !== 'completed' && (
          <Link to={`/trilha/${track.id}`} className={s.small}>
            Ver mapa da trilha
          </Link>
        )}
      </div>
    </Card>
  )
}

function TrackPicks({ firstVisit }: { firstVisit: boolean }) {
  const progress = useGame((st) => st.progress)
  const picks = useMemo(() => relevantTracks(progress, registry, ORDER), [progress])
  return (
    <section className={s.section} aria-labelledby="tracks-title">
      <div className={s.sectionHead}>
        <h2 id="tracks-title">{firstVisit ? 'Trilhas para começar' : 'Continue suas trilhas'}</h2>
        <Link to="/mapa" className={s.sectionLink}>
          Ver todas as {registry.tracks.size} trilhas <ChevronRight size={16} aria-hidden="true" />
        </Link>
      </div>
      <p className={`muted ${s.sectionLead}`}>
        {firstVisit ? 'As primeiras da ordem sugerida, que evita encontrar um conceito antes de aprendê-lo.' : 'As trilhas em andamento e as próximas da ordem sugerida.'}
      </p>
      <div className={s.trackGrid}>
        {picks.map((p) => (
          <TrackCard key={p.track.id} pick={p} />
        ))}
      </div>
    </section>
  )
}

function Explore() {
  const items = [
    { to: '/mapa', icon: Compass, title: 'Trilhas e territórios', text: `${registry.tracks.size} trilhas em ${ACTIVE_TERRITORIES} territórios, com a ordem sugerida de estudo.` },
    { to: '/codex', icon: BookOpen, title: 'Conceitos', text: `${TAUGHT_CONCEPTS.toLocaleString('pt-BR')} conceitos com explicações, comparações e referências da AWS.` },
    { to: '/revisao/questoes', icon: ListChecks, title: 'Banco de questões', text: `${registry.questions.size.toLocaleString('pt-BR')} questões no formato do exame, com treinos e simulados cronometrados.` },
  ]
  return (
    <section className={s.section} aria-labelledby="explore-title">
      <h2 id="explore-title">Explore o conteúdo</h2>
      <ul className={s.explore}>
        {items.map((it) => (
          <li key={it.to}>
            <Link to={it.to} className={s.exploreLink}>
              <it.icon size={20} aria-hidden="true" className={s.exploreIcon} />
              <span>
                <strong>{it.title}</strong>
                <span className={s.small}>{it.text}</span>
              </span>
              <ChevronRight size={18} aria-hidden="true" className={s.exploreChevron} />
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}

export function HomePage() {
  useDocumentTitle('Início')
  const progress = useGame((st) => st.progress)
  const due = useDueCount()
  const rec = useMemo(() => studyRecommendation(progress, registry, clock.now(), ORDER), [progress])
  const firstVisit = rec.kind === 'first-visit'

  return (
    <div className="page">
      <div className={s.hero}>
        <NextStep rec={rec} due={due} />
        <div className={s.side}>
          {firstVisit ? (
            <HowItWorks />
          ) : (
            <>
              {rec.kind === 'review' && rec.missionId ? <AfterReview missionId={rec.missionId} /> : <ReviewCard due={due} />}
              <ProgressSummary />
            </>
          )}
        </div>
      </div>
      <ExamPrep firstVisit={firstVisit} />
      <TrackPicks firstVisit={firstVisit} />
      <Explore />
    </div>
  )
}
