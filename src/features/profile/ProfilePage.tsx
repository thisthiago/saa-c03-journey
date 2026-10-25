import { ChevronRight, Download, Lock, Monitor, Moon, RotateCcw, Sun, Upload } from 'lucide-react'
import { useMemo, useRef, useState, type ReactNode } from 'react'
import { Link } from 'react-router'
import { registry } from '../../content'
import { masteredConceptIds } from '../../engine/achievements'
import { achievementGroups, achievementTracks, goalRatio, localDay, nextAchievements, recentActivity, studyCalendar, type AchievementGoal, type ActivityItem } from '../../engine/dossier'
import { bankStats } from '../../engine/exam'
import { currentTrackId, domainReadiness, focusDomain, studyRecommendation, trackState, type StudyRecommendation } from '../../engine/guide'
import { isDue, masteryTier, TIER_LABEL } from '../../engine/mastery'
import { exportProgress, importProgress } from '../../engine/persistence'
import { LEDGER_LIMIT } from '../../engine/progress'
import { trackPhases } from '../../engine/registry'
import { isMissionPassed, streakDays, trackProgress } from '../../engine/selectors'
import { recommendedTrackOrder } from '../../engine/track-order'
import type { AchievementDef, ProgressState } from '../../engine/types'
import { clock, flushSave, useGame } from '../../store/gameStore'
import { useDocumentTitle, useDueCount, useMediaQuery, usePlayer } from '../../app/hooks'
import { phaseLabel, plural } from '../../app/format'
import { Badge, Button, ButtonLink, Callout, Card, Modal, ProgressBar, ProgressRing } from '../../ui/kit'
import { DomainTag } from '../../ui/DomainTag'
import { Glyph } from '../../ui/Glyph'
import s from './profile.module.css'

const CATEGORY = { seguranca: 'Segurança', custos: 'Custos', disponibilidade: 'Disponibilidade', recuperacao: 'Recuperação de desastres', desempenho: 'Desempenho', aprendizagem: 'Aprendizagem', exploracao: 'Exploração' } as const

const ORDER = recommendedTrackOrder(registry)
const GROUPS = achievementGroups(registry)
const ACH_TRACK = achievementTracks(registry)
const ACH_TOTAL = registry.achievements.size
/** Missões e conceitos de fases liberadas: os denominadores do resumo. */
const RELEASED_MISSIONS = [...registry.tracks.values()].flatMap((t) => trackPhases(t).filter((p) => p.availability === 'available').flatMap((p) => p.missions))
const RELEASED_CONCEPTS = new Set([...registry.tracks.values()].flatMap((t) => trackPhases(t).filter((p) => p.availability === 'available').flatMap((p) => p.concepts))).size

const percent = (n: number, d: number) => (d === 0 ? 0 : Math.round((n / d) * 100))
const shortDate = (iso: string) => new Date(iso).toLocaleDateString('pt-BR')

/** Botão de "mostrar mais" de uma lista; some quando não há o que mostrar. */
function MoreButton({ open, total, shown, onToggle, label }: { open: boolean; total: number; shown: number; onToggle: () => void; label: string }) {
  if (total <= shown && !open) return null
  return (
    <Button variant="ghost" size="small" aria-expanded={open} onClick={onToggle}>
      {open ? 'Mostrar menos' : `${label} (${total})`}
    </Button>
  )
}

/** Indicador: o número fica junto do rótulo e de uma explicação curta. */
function Stat({ label, value, children }: { label: string; value: ReactNode; children?: ReactNode }) {
  return (
    <div className={s.stat}>
      <dt>{label}</dt>
      <dd>
        <b>{value}</b>
        {children && <span className={s.small}>{children}</span>}
      </dd>
    </div>
  )
}

// ---------------------------------------------------------------------------
// 1. Resumo da jornada
// ---------------------------------------------------------------------------

function journeyCopy(rec: StudyRecommendation) {
  const ref = rec.missionId ? registry.missions.get(rec.missionId) : undefined
  switch (rec.kind) {
    case 'resume':
    case 'in-progress':
      return { ref, line: 'Em andamento', cta: 'Continuar missão' }
    case 'next-track': {
      const done = rec.completedTrackId ? registry.tracks.get(rec.completedTrackId)?.title : undefined
      return { ref, line: done ? `Você concluiu ${done}. Próxima missão, na ordem sugerida das trilhas` : 'Próxima missão', cta: 'Começar trilha' }
    }
    case 'first-visit':
      return { ref, line: 'Primeira missão', cta: 'Começar minha primeira missão' }
    case 'done':
      return { ref, line: '', cta: 'Praticar questões' }
    default:
      return { ref, line: 'Próxima missão', cta: 'Começar missão' }
  }
}

function JourneySummary({ progress, rec, passed, studied, mastered }: { progress: ProgressState; rec: StudyRecommendation; passed: number; studied: number; mastered: number }) {
  const player = usePlayer()
  const { ref, line, cta } = journeyCopy(rec)
  const firstVisit = rec.kind === 'first-visit'
  const track = ref?.track ?? (currentTrackId(progress, registry) ? registry.tracks.get(currentTrackId(progress, registry)!) : undefined)
  const tp = track ? trackProgress(progress, track) : undefined
  const states = [...registry.tracks.values()].map((t) => trackState(progress, registry, t))
  const inProgress = states.filter((x) => x === 'in-progress').length
  const completed = states.filter((x) => x === 'completed').length

  if (firstVisit) {
    return (
      <Card className={s.journey} aria-labelledby="journey-title">
        <h2 id="journey-title" className={s.journeyTitle}>
          Sua jornada ainda não começou
        </h2>
        <p className={s.lead}>
          Este dossiê mostra em que trilha você está, como foram suas respostas e o que você já conquistou. Os números aparecem depois que você fizer a primeira missão.
        </p>
        {ref && (
          <p className={s.small}>
            A primeira missão sugerida é <b>{ref.mission.title}</b>, da trilha {ref.track.title}.
          </p>
        )}
        <div className={s.actions}>
          {ref && <ButtonLink to={`/missao/${ref.mission.id}`}>{cta}</ButtonLink>}
          <ButtonLink to="/mapa" variant="ghost">
            Ver todas as trilhas
          </ButtonLink>
        </div>
      </Card>
    )
  }

  return (
    <>
      <div className={s.top}>
        <Card className={s.journey} aria-labelledby="journey-title">
          <span className={s.kicker}>{rec.kind === 'done' ? 'Jornada' : 'Trilha atual'}</span>
          <h2 id="journey-title" className={s.journeyTitle}>
            {rec.kind === 'done' ? 'Conteúdo disponível concluído' : track?.title}
          </h2>
          {ref && (
            <p className={s.phase}>
              {phaseLabel(ref.phase)} · {ref.phase.title}
            </p>
          )}
          {tp && rec.kind !== 'done' && (
            <div className={s.trackBar}>
              <ProgressBar value={tp.ratio} label={`Missões aprovadas em ${track?.title}`} />
              <span className={s.small}>
                {tp.passed} de {plural(tp.total, 'missão aprovada', 'missões aprovadas')} nesta trilha. Mostra o conteúdo percorrido, não o domínio do assunto.
              </span>
            </div>
          )}
          {ref && (
            <p className={s.now}>
              {line}: <b>{ref.mission.title}</b>
            </p>
          )}
          {rec.kind === 'done' && <p className={s.lead}>Você aprovou todas as missões liberadas. Para manter o que aprendeu, pratique questões do banco e faça as revisões.</p>}
          <div className={s.actions}>
            <ButtonLink to={ref ? `/missao/${ref.mission.id}` : '/revisao/questoes'}>{cta}</ButtonLink>
            {track && rec.kind !== 'done' && (
              <ButtonLink to={`/trilha/${track.id}`} variant="ghost">
                Ver mapa da trilha
              </ButtonLink>
            )}
          </div>
        </Card>
        <Card className={s.level} aria-labelledby="level-title">
          <div className={s.levelHead}>
            <ProgressRing value={player.ratio} size={64} stroke={6} color="var(--xp)" label={`Nível ${player.level}`}>
              {player.level}
            </ProgressRing>
            <div>
              <h2 id="level-title" className={s.levelTitle}>
                {player.title}
              </h2>
              <span className={s.xp}>
                Nível {player.level} · {player.xp.toLocaleString('pt-BR')} XP
              </span>
            </div>
          </div>
          <ProgressBar value={player.ratio} color="var(--xp)" label="Progresso até o próximo nível" />
          <span className={s.small}>
            Faltam {(player.next - player.xp).toLocaleString('pt-BR')} XP para o nível {player.level + 1}. O XP vem de atividades, missões, revisões e conquistas.
          </span>
        </Card>
      </div>
      <Card className={s.keyStats} aria-label="Resumo da jornada">
        <dl className={s.keyList}>
          <Stat label="Trilhas" value={`${completed} de ${registry.tracks.size} concluídas`}>
            {plural(inProgress, 'trilha em andamento', 'trilhas em andamento')}
          </Stat>
          <Stat label="Missões aprovadas" value={`${passed} de ${RELEASED_MISSIONS.length}`}>
            Entre as missões já liberadas em todas as trilhas.
          </Stat>
          <Stat label="Conceitos estudados" value={`${studied} de ${RELEASED_CONCEPTS}`}>
            {plural(mastered, 'conceito dominado', 'conceitos dominados')} até agora.
          </Stat>
        </dl>
      </Card>
    </>
  )
}

// ---------------------------------------------------------------------------
// 2. Progresso e desempenho
// ---------------------------------------------------------------------------

function Performance({ progress, passed, studied, mastered }: { progress: ProgressState; passed: number; studied: number; mastered: number }) {
  const bank = bankStats(registry, progress)
  const last = progress.exam.simulados.at(-1)
  return (
    <section className={s.section} aria-labelledby="perf-title">
      <h2 id="perf-title">Progresso e desempenho</h2>
      <p className={`muted ${s.sectionLead}`}>Atividade mostra o que você já fez. Desempenho mostra como foram suas respostas. Nenhum dos dois, sozinho, prevê o resultado da prova.</p>
      <div className={s.perfGrid}>
        <Card aria-labelledby="activity-title">
          <h3 id="activity-title" className={s.groupTitle}>
            Atividade
          </h3>
          <dl className={s.statList}>
            <Stat label="Missões aprovadas" value={`${passed} de ${RELEASED_MISSIONS.length}`}>
              Missões concluídas com nota de aprovação. Indica conteúdo percorrido.
            </Stat>
            <Stat label="Conceitos estudados" value={`${studied} de ${RELEASED_CONCEPTS}`}>
              Conceitos com pelo menos uma resposta avaliada.
            </Stat>
            <Stat label="Sessões de revisão" value={progress.reviews.sessions}>
              Sessões de revisão espaçada concluídas.
            </Stat>
            <Stat label="Questões respondidas" value={`${bank.answered} de ${bank.total}`}>
              Questões do banco respondidas ao menos uma vez.
            </Stat>
          </dl>
        </Card>
        <Card aria-labelledby="results-title">
          <h3 id="results-title" className={s.groupTitle}>
            Desempenho
          </h3>
          <dl className={s.statList}>
            <Stat label="Acerto nas questões" value={bank.answered ? `${bank.rightNow} de ${bank.answered} (${percent(bank.rightNow, bank.answered)}%)` : 'Sem dados'}>
              {bank.answered ? 'Questões cuja última resposta foi correta, entre as que você respondeu.' : 'Responda questões do banco para ver este número.'}
            </Stat>
            <Stat label="Conceitos dominados" value={`${mastered} de ${studied}`}>
              Domínio alto confirmado em revisões de dias diferentes.
            </Stat>
            <Stat label="Acertos perfeitos de primeira" value={progress.stats.perfectFirstTries}>
              Atividades com 100% na primeira tentativa, sem dicas.
            </Stat>
            <Stat label="Recuperações após erro" value={progress.stats.comebacks}>
              Atividades aprovadas depois de errar a primeira tentativa.
            </Stat>
            <Stat label="Último simulado" value={last ? `${last.correct} de ${last.total} certas` : 'Nenhum'}>
              {last ? `Feito em ${shortDate(last.at)}.` : 'Os simulados ficam no banco de questões.'}
            </Stat>
          </dl>
        </Card>
      </div>
      <DomainRows progress={progress} />
      <Simulados progress={progress} />
    </section>
  )
}

function DomainRows({ progress, bare = false }: { progress: ProgressState; bare?: boolean }) {
  const readiness = useMemo(() => domainReadiness(progress, registry), [progress])
  const focus = focusDomain(readiness)
  return (
    <div className={s.block}>
      <h3 id="domains-title" className={s.groupTitle}>
        Domínios do exame SAA-C03
      </h3>
      <p className={`muted ${s.sectionLead}`}>
        {bare
          ? 'O exame avalia quatro domínios, cada um com um peso. Depois das primeiras missões, aqui aparece quantos conceitos e questões de cada domínio você já estudou.'
          : 'Contagens dos conceitos de fases liberadas e das questões do banco, por domínio. Um conceito pode contar em mais de um domínio.'}
      </p>
      <ul className={s.domainRows} aria-labelledby="domains-title">
        {readiness.map((r) => (
          <li key={r.domain.id} className={s.domainRow}>
            <div className={s.domainHead}>
              <DomainTag id={r.domain.id} />
              <strong>{r.domain.title}</strong>
              <span className={s.small}>{Math.round(r.domain.weight * 100)}% do exame</span>
            </div>
            {!bare && (
              <dl className={s.domainStats}>
                <div>
                  <dt>Conceitos estudados</dt>
                  <dd>
                    {r.studied} de {r.concepts}
                  </dd>
                </div>
                <div>
                  <dt>Dominados</dt>
                  <dd>{r.mastered}</dd>
                </div>
                <div>
                  <dt>Questões respondidas</dt>
                  <dd>
                    {r.answered} de {r.questions}
                  </dd>
                </div>
                <div>
                  <dt>Certas na última resposta</dt>
                  <dd>{r.answered ? r.correct : 'Sem respostas'}</dd>
                </div>
              </dl>
            )}
          </li>
        ))}
      </ul>
      {!bare && (
        <div className={s.blockAction}>
          {focus ? (
            <>
              <p className={s.small}>
                Onde reforçar: <b>{focus.domain.title}</b> tem {plural(focus.weak, 'conceito', 'conceitos')} com domínio baixo e {plural(focus.answered - focus.correct, 'questão errada', 'questões erradas')} na última resposta.
              </p>
              <ButtonLink to={`/revisao/questoes?dominio=${focus.domain.id}`} variant="secondary" size="small">
                Praticar questões de {focus.domain.title}
              </ButtonLink>
            </>
          ) : (
            <ButtonLink to="/revisao/questoes" variant="secondary" size="small">
              Abrir o banco de questões
            </ButtonLink>
          )}
        </div>
      )}
    </div>
  )
}

function Simulados({ progress }: { progress: ProgressState }) {
  const [open, setOpen] = useState(false)
  const all = [...progress.exam.simulados].reverse()
  if (all.length === 0) return null
  const list = open ? all : all.slice(0, 5)
  return (
    <div className={s.block}>
      <h3 id="sim-title" className={s.groupTitle}>
        Simulados
      </h3>
      <p className={`muted ${s.sectionLead}`}>Resultados dos simulados do banco de questões, do mais recente ao mais antigo.</p>
      <ol className={s.simList} aria-labelledby="sim-title">
        {list.map((sim, i) => (
          <li key={`${sim.at}-${i}`}>
            <span className={s.small}>{shortDate(sim.at)}</span>
            <b>
              {sim.correct} de {sim.total} certas ({percent(sim.correct, sim.total)}%)
            </b>
            <span className={s.small}>
              {sim.timed ? 'Com tempo' : 'Sem tempo'} · {Math.max(1, Math.round(sim.seconds / 60))} min
            </span>
          </li>
        ))}
      </ol>
      <MoreButton open={open} total={all.length} shown={5} onToggle={() => setOpen(!open)} label="Mostrar todos os simulados" />
    </div>
  )
}

// ---------------------------------------------------------------------------
// 3. Conquistas
// ---------------------------------------------------------------------------

function AchievementItem({ a, unlockedAt }: { a: AchievementDef; unlockedAt?: string }) {
  const track = ACH_TRACK.get(a.id)
  const meta = [unlockedAt ? `Desbloqueada em ${shortDate(unlockedAt)}` : 'Bloqueada', track?.title, CATEGORY[a.category], a.xp > 0 ? `+${a.xp} XP` : undefined].filter(Boolean)
  return (
    <li className={s.ach} data-got={Boolean(unlockedAt)}>
      <span className={s.achIcon}>{unlockedAt ? <Glyph name={a.glyph} size={22} /> : <Lock size={20} aria-hidden="true" />}</span>
      <div>
        <strong>{a.title}</strong>
        <span className={s.small}>{a.description}</span>
        <span className={s.achMeta}>{meta.join(' · ')}</span>
      </div>
    </li>
  )
}

function goalLink(goal: AchievementGoal) {
  const t = goal.target
  if (!t) return null
  if (t.kind === 'review') return { to: '/revisao', text: 'Ir para a revisão' }
  if (t.kind === 'phase') {
    const ref = registry.phases.get(t.phaseId)
    return ref ? { to: `/fase/${t.phaseId}`, text: `Abrir a ${phaseLabel(ref.phase)} de ${ref.track.title}` } : null
  }
  const m = registry.missions.get(t.missionId)
  return m ? { to: `/missao/${t.missionId}`, text: `Ir para a missão ${m.mission.title}` } : null
}

function Achievements({ progress, focusTrackId }: { progress: ProgressState; focusTrackId?: string }) {
  const [showAll, setShowAll] = useState(false)
  const unlocked = Object.entries(progress.achievements)
    .map(([id, v]) => ({ a: registry.achievements.get(id), at: v.unlockedAt }))
    .filter((x): x is { a: AchievementDef; at: string } => Boolean(x.a))
    .sort((x, y) => y.at.localeCompare(x.at))
  const goals = useMemo(() => nextAchievements(progress, registry, focusTrackId), [progress, focusTrackId])
  const shown = showAll ? unlocked : unlocked.slice(0, 6)
  return (
    <section className={s.section} aria-labelledby="ach-title">
      <div className={s.sectionHead}>
        <h2 id="ach-title">Conquistas</h2>
        <span className={s.count}>
          {unlocked.length} de {ACH_TOTAL} desbloqueadas
        </span>
      </div>

      <h3 className={s.groupTitle}>Desbloqueadas</h3>
      {unlocked.length === 0 ? (
        <p className="muted">Você ainda não desbloqueou nenhuma conquista. As metas abaixo são as mais próximas do ponto em que você está.</p>
      ) : (
        <>
          <ul className={s.achGrid}>
            {shown.map(({ a, at }) => (
              <AchievementItem key={a.id} a={a} unlockedAt={at} />
            ))}
          </ul>
          <MoreButton open={showAll} total={unlocked.length} shown={6} onToggle={() => setShowAll(!showAll)} label="Mostrar todas as desbloqueadas" />
        </>
      )}

      {goals.length > 0 && (
        <div className={s.block}>
          <h3 className={s.groupTitle}>Próximas metas</h3>
          <ul className={s.goals}>
            {goals.map((g) => {
              const link = goalLink(g)
              return (
                <li key={g.achievement.id} className={s.goal}>
                  <span className={s.achIcon}>
                    <Lock size={18} aria-hidden="true" />
                  </span>
                  <div className={s.goalBody}>
                    <span className={s.goalHead}>
                      <strong>{g.achievement.title}</strong>
                      <Badge>Bloqueada</Badge>
                    </span>
                    <span className={s.small}>{g.achievement.description}</span>
                    {g.progress && (
                      <span className={s.goalProgress}>
                        <ProgressBar value={goalRatio(g.progress)} color="var(--xp)" label={`Progresso em ${g.achievement.title}`} />
                        <span className={s.small}>
                          {g.achievement.condition.type === 'level-reached' ? `Nível ${g.progress.current} de ${g.progress.target}` : `${g.progress.current} de ${g.progress.target}`}
                        </span>
                      </span>
                    )}
                    {link && (
                      <Link to={link.to} className={s.goalLink}>
                        {link.text}
                        <ChevronRight size={14} aria-hidden="true" />
                      </Link>
                    )}
                  </div>
                </li>
              )
            })}
          </ul>
        </div>
      )}

      <div className={s.block}>
        <PhoneCollapsible heading={<h3 className={s.groupTitle}>Todas as conquistas, por trilha</h3>}>
          <div className={s.groups}>
            {GROUPS.map((g) => {
              const got = g.achievements.filter((a) => progress.achievements[a.id]).length
              return (
                <details key={g.id} className={s.group}>
                  <summary>
                    <span>{g.title}</span>
                    <span className={s.small}>
                      {got} de {g.achievements.length}
                    </span>
                  </summary>
                  <ul className={s.achGrid}>
                    {g.achievements.map((a) => (
                      <AchievementItem key={a.id} a={a} unlockedAt={progress.achievements[a.id]?.unlockedAt} />
                    ))}
                  </ul>
                </details>
              )
            })}
          </div>
        </PhoneCollapsible>
      </div>
    </section>
  )
}

// ---------------------------------------------------------------------------
// 4. Atividade recente
// ---------------------------------------------------------------------------

function activityText(it: ActivityItem): { title: string; detail?: string } {
  switch (it.kind) {
    case 'activity': {
      const ref = registry.activities.get(it.refIds[0])
      return { title: ref?.activity.title ?? 'Atividade', detail: ref ? `Missão ${ref.mission.title}` : undefined }
    }
    case 'mission':
      return { title: `Missão aprovada: ${registry.missions.get(it.refIds[0])?.mission.title ?? it.refIds[0]}` }
    case 'achievement':
      return { title: `Conquista desbloqueada: ${registry.achievements.get(it.refIds[0])?.title ?? it.refIds[0]}` }
    case 'review': {
      const names = it.refIds.map((id) => registry.concepts.get(id)?.title ?? id)
      if (names.length === 1) return { title: `Revisão: ${names[0]}` }
      const rest = names.length - 3
      return { title: `Revisão de ${names.length} conceitos`, detail: rest > 0 ? `${names.slice(0, 3).join(', ')} e mais ${rest}` : `${names.slice(0, -1).join(', ')} e ${names.at(-1)}` }
    }
    case 'simulado': {
      const sim = it.simulado!
      return { title: `Simulado: ${sim.correct} de ${sim.total} certas (${percent(sim.correct, sim.total)}%)`, detail: sim.timed ? 'Com tempo' : 'Sem tempo' }
    }
  }
}

function dayLabel(day: string, now: Date): string {
  if (day === localDay(now.toISOString())) return 'Hoje'
  if (day === localDay(new Date(now.getTime() - 86_400_000).toISOString())) return 'Ontem'
  const [y, m, d] = day.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: y === now.getFullYear() ? undefined : 'numeric' })
}

function RecentActivity({ progress }: { progress: ProgressState }) {
  const [limit, setLimit] = useState(10)
  const now = clock.now()
  const items = useMemo(() => recentActivity(progress), [progress])
  const calendar = studyCalendar(progress.stats.activeDays, now)
  const activeCount = calendar.filter((d) => d.active).length
  const streak = streakDays(progress.stats.activeDays, now)
  const days: { day: string; items: ActivityItem[] }[] = []
  for (const it of items.slice(0, limit)) {
    const day = localDay(it.at)
    if (days.at(-1)?.day === day) days.at(-1)!.items.push(it)
    else days.push({ day, items: [it] })
  }
  return (
    <section className={s.section} aria-labelledby="recent-title">
      <PhoneCollapsible heading={<h2 id="recent-title">Atividade recente</h2>}>
        <div className={s.activityGrid}>
          <Card aria-labelledby="days-title">
            <h3 id="days-title" className={s.groupTitle}>
              Dias com estudo
            </h3>
            <p className={s.cardText}>
              Você estudou em <b>{activeCount}</b> dos últimos 28 dias. Sequência atual: {plural(streak, 'dia', 'dias')}.
            </p>
            <div className={s.calendar} role="img" aria-label={`Dias com estudo nas últimas quatro semanas: ${activeCount} de 28`}>
              {calendar.map((d) => (
                <span key={d.day} className={s.calDay} data-active={d.active} title={`${d.day.slice(8, 10)}/${d.day.slice(5, 7)}: ${d.active ? 'com estudo' : 'sem estudo'}`} />
              ))}
            </div>
            <p className={s.small}>Cada quadrado é um dia, do mais antigo (no alto, à esquerda) até hoje. Conta o dia em que houve ao menos uma resposta avaliada.</p>
          </Card>
          <Card aria-labelledby="log-title">
            <h3 id="log-title" className={s.groupTitle}>
              Últimas ações
            </h3>
            {items.length === 0 ? (
              <p className="muted">Nenhuma ação registrada ainda. Aqui aparecem as atividades, missões, revisões, conquistas e simulados, do mais recente ao mais antigo.</p>
            ) : (
              <>
                {days.map((d) => (
                  <div key={d.day} className={s.logDay}>
                    <h4 className={s.logDate}>{dayLabel(d.day, now)}</h4>
                    <ul className={s.log}>
                      {d.items.map((it, i) => {
                        const t = activityText(it)
                        return (
                          <li key={`${it.at}-${i}`}>
                            <span className={s.logTime}>{new Date(it.at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
                            <span className={s.logText}>
                              {t.title}
                              {t.detail && <span className={s.small}>{t.detail}</span>}
                            </span>
                            {it.xp > 0 && <span className={s.logXp}>+{it.xp} XP</span>}
                          </li>
                        )
                      })}
                    </ul>
                  </div>
                ))}
                <div className="row">
                  {limit < items.length && (
                    <Button variant="ghost" size="small" onClick={() => setLimit(limit + 20)}>
                      Mostrar mais ações
                    </Button>
                  )}
                  {limit > 10 && (
                    <Button variant="ghost" size="small" onClick={() => setLimit(10)}>
                      Mostrar menos
                    </Button>
                  )}
                </div>
                <p className={s.small}>O histórico guarda as últimas {LEDGER_LIMIT} ações que renderam XP, além de todos os simulados.</p>
              </>
            )}
          </Card>
        </div>
      </PhoneCollapsible>
    </section>
  )
}

/** No celular, um bloco longo fica recolhido e abre com um toque; nas telas maiores, aparece aberto. */
function PhoneCollapsible({ heading, children }: { heading: ReactNode; children: ReactNode }) {
  const narrow = useMediaQuery('(max-width: 640px)')
  if (!narrow) {
    return (
      <>
        {heading}
        {children}
      </>
    )
  }
  return (
    <details className={s.collapse}>
      <summary>
        <ChevronRight size={18} aria-hidden="true" className={s.collapseIcon} />
        {heading}
      </summary>
      {children}
    </details>
  )
}

// ---------------------------------------------------------------------------
// 5. Conceitos estudados
// ---------------------------------------------------------------------------

function StudiedConcepts({ progress }: { progress: ProgressState }) {
  const [open, setOpen] = useState(false)
  const due = useDueCount()
  const now = clock.now()
  const studied = Object.entries(progress.concepts)
    .filter(([, c]) => c.evidence > 0)
    .sort((a, b) => a[1].mastery - b[1].mastery)
  if (studied.length === 0) return null
  const tiers = { aprendendo: 0, praticando: 0, dominado: 0 }
  for (const [, cp] of studied) {
    const t = masteryTier(cp)
    if (t !== 'novo') tiers[t]++
  }
  const list = open ? studied : studied.slice(0, 8)
  return (
    <section className={s.section} aria-labelledby="mastery-title">
      <h2 id="mastery-title">Conceitos estudados</h2>
      <p className={`muted ${s.sectionLead}`}>Do mais frágil ao mais firme. O domínio sobe com acertos e cai com erros; para chegar a "Dominado" é preciso acertar em revisões de dias diferentes.</p>
      <div className={s.tiers}>
        <Badge tone="warning">Aprendendo: {tiers.aprendendo}</Badge>
        <Badge tone="info">Praticando: {tiers.praticando}</Badge>
        <Badge tone="mastery">Dominado: {tiers.dominado}</Badge>
      </div>
      <ul className={s.masteryList}>
        {list.map(([id, cp]) => {
          const tier = masteryTier(cp)
          const title = registry.concepts.get(id)?.title ?? id
          return (
            <li key={id}>
              <span className={s.conceptName}>
                <Link to={`/codex/${id}`}>{title}</Link>
                {isDue(cp, now) && <span className={s.small}>Revisão pendente</span>}
              </span>
              <ProgressBar value={cp.mastery} color="var(--mastery)" label={`Domínio de ${title}`} />
              <Badge tone={tier === 'dominado' ? 'mastery' : tier === 'praticando' ? 'info' : 'warning'}>{TIER_LABEL[tier]}</Badge>
            </li>
          )
        })}
      </ul>
      <div className={s.blockAction}>
        <MoreButton open={open} total={studied.length} shown={8} onToggle={() => setOpen(!open)} label="Mostrar todos os conceitos estudados" />
        {due > 0 ? (
          <ButtonLink to="/revisao" variant="secondary" size="small">
            Revisar {plural(due, 'conceito pendente', 'conceitos pendentes')}
          </ButtonLink>
        ) : (
          <ButtonLink to="/codex" variant="ghost" size="small">
            Abrir os conceitos
          </ButtonLink>
        )}
      </div>
    </section>
  )
}

// ---------------------------------------------------------------------------
// 6. Ajustes e dados
// ---------------------------------------------------------------------------

function Settings({ progress }: { progress: ProgressState }) {
  const setSettings = useGame((st) => st.setSettings)
  const replaceProgress = useGame((st) => st.replaceProgress)
  const resetProgress = useGame((st) => st.resetProgress)
  const [confirmReset, setConfirmReset] = useState(false)
  const [message, setMessage] = useState<{ kind: 'success' | 'danger'; text: string } | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const doExport = () => {
    flushSave()
    const blob = new Blob([exportProgress(progress, clock.now())], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `aws-quest-progresso-${clock.now().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
    setMessage({ kind: 'success', text: 'Arquivo de progresso exportado.' })
  }
  const doImport = async (file: File) => {
    const result = importProgress(await file.text())
    if (result.ok) {
      replaceProgress(result.state)
      setMessage({ kind: 'success', text: 'Progresso importado com sucesso.' })
    } else setMessage({ kind: 'danger', text: result.error })
  }

  return (
    <section className={s.section} aria-labelledby="settings-title">
      <h2 id="settings-title">Ajustes e dados</h2>
      <div className={s.settings}>
        <Card>
          <h3>Tema</h3>
          <div className={s.segment} role="radiogroup" aria-label="Tema">
            {(
              [
                ['system', 'Sistema', Monitor],
                ['dark', 'Escuro', Moon],
                ['light', 'Claro', Sun],
              ] as const
            ).map(([value, label, Icon]) => (
              <button key={value} type="button" role="radio" aria-checked={progress.settings.theme === value} onClick={() => setSettings({ theme: value })}>
                <Icon size={16} aria-hidden="true" /> {label}
              </button>
            ))}
          </div>
          <label className={s.check}>
            <input type="checkbox" checked={progress.settings.reducedMotion} onChange={(e) => setSettings({ reducedMotion: e.target.checked })} />
            Reduzir animações
          </label>
        </Card>
        <Card>
          <h3>Progresso</h3>
          <p className="muted">O progresso fica salvo neste navegador. Exporte um arquivo para guardar uma cópia ou levar para outro navegador.</p>
          <div className="row">
            <Button variant="secondary" size="small" onClick={doExport}>
              <Download size={16} aria-hidden="true" /> Exportar
            </Button>
            <Button variant="secondary" size="small" onClick={() => fileRef.current?.click()}>
              <Upload size={16} aria-hidden="true" /> Importar
            </Button>
            <Button variant="danger" size="small" onClick={() => setConfirmReset(true)}>
              <RotateCcw size={16} aria-hidden="true" /> Recomeçar do zero
            </Button>
            <input
              ref={fileRef}
              type="file"
              accept="application/json,.json"
              hidden
              onChange={(e) => {
                const f = e.target.files?.[0]
                if (f) void doImport(f)
                e.target.value = ''
              }}
            />
          </div>
          {message && (
            <div style={{ marginTop: 12 }} role="status">
              <Callout kind={message.kind}>
                <p>{message.text}</p>
              </Callout>
            </div>
          )}
        </Card>
      </div>

      <Modal
        open={confirmReset}
        onClose={() => setConfirmReset(false)}
        labelledBy="reset-title"
        actions={
          <>
            <Button variant="secondary" onClick={() => setConfirmReset(false)}>
              Cancelar
            </Button>
            <Button
              variant="danger"
              onClick={() => {
                resetProgress()
                setConfirmReset(false)
                setMessage({ kind: 'success', text: 'Progresso apagado. Uma nova expedição começa.' })
              }}
            >
              Apagar progresso
            </Button>
          </>
        }
      >
        <h2 id="reset-title">Recomeçar do zero?</h2>
        <p className="muted">XP, missões, domínio dos conceitos, revisões e conquistas serão apagados deste navegador. Se quiser guardar uma cópia, exporte antes.</p>
      </Modal>
    </section>
  )
}

export function ProfilePage() {
  useDocumentTitle('Dossiê')
  const progress = useGame((st) => st.progress)
  const rec = useMemo(() => studyRecommendation(progress, registry, clock.now(), ORDER), [progress])
  const passed = useMemo(() => RELEASED_MISSIONS.filter((m) => isMissionPassed(progress, m)).length, [progress])
  const studied = Object.values(progress.concepts).filter((c) => c.evidence > 0).length
  const mastered = masteredConceptIds(progress).length
  const firstVisit = rec.kind === 'first-visit'
  const recTrack = rec.missionId ? registry.missions.get(rec.missionId)?.track : undefined
  const focusTrackId = recTrack?.id ?? currentTrackId(progress, registry) ?? ORDER[0]?.track.id

  const intro = firstVisit
    ? 'Aqui você acompanha sua jornada de estudo para a SAA-C03.'
    : recTrack && rec.kind !== 'done'
      ? `Você está na trilha ${recTrack.title}. Já aprovou ${passed} de ${plural(RELEASED_MISSIONS.length, 'missão disponível', 'missões disponíveis')}.`
      : `Você aprovou ${passed} de ${plural(RELEASED_MISSIONS.length, 'missão disponível', 'missões disponíveis')}.`

  return (
    <div className="page">
      <p className="eyebrow">Dossiê</p>
      <h1>Seu progresso</h1>
      <p className={`muted ${s.intro}`}>{intro}</p>

      <JourneySummary progress={progress} rec={rec} passed={passed} studied={studied} mastered={mastered} />

      {firstVisit ? (
        <section className={s.section} aria-labelledby="perf-title">
          <h2 id="perf-title">Progresso e desempenho</h2>
          <DomainRows progress={progress} bare />
        </section>
      ) : (
        <Performance progress={progress} passed={passed} studied={studied} mastered={mastered} />
      )}

      <Achievements progress={progress} focusTrackId={focusTrackId} />
      <RecentActivity progress={progress} />
      <StudiedConcepts progress={progress} />
      <Settings progress={progress} />
    </div>
  )
}
