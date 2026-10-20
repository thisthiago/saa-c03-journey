/**
 * Banco de questões no estilo do exame: filtros (trilha, conceito, dificuldade,
 * domínio e situação), treino com explicação na hora e simulado com resultado
 * por domínio e explicação de cada alternativa no final.
 */
import { ArrowLeft, ArrowRight, Check, CircleHelp, Clock, Dumbbell, Flag, Library, RotateCcw, Timer, X } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router'
import { registry } from '../../content'
import {
  bankStats,
  DIFFICULTY_LABEL,
  EXAM_FORMAT,
  filterQuestions,
  isMultiple,
  isQuestionCorrect,
  practiceOrder,
  questionConcepts,
  questionStatus,
  SECONDS_PER_QUESTION,
  simuladoSample,
  STATUS_LABEL,
  summarizeAttempt,
  type AnsweredQuestion,
  type QuestionFilter,
  type QuestionStatus,
} from '../../engine/exam'
import type { QuestionRef } from '../../engine/registry'
import type { ExamDomainId, ExamQuestion } from '../../engine/types'
import { useDocumentTitle } from '../../app/hooks'
import { clock, useGame } from '../../store/gameStore'
import { Badge, Button, ButtonLink, Callout, Card, Modal, ProgressBar } from '../../ui/kit'
import { ExamQuestionView } from './ExamQuestionView'
import s from './exam.module.css'

type Mode = 'treino' | 'simulado'

interface Session {
  mode: Mode
  refs: QuestionRef[]
  seed: string
  timed: boolean
  startedAt: number
  /** Fim do tempo (ms), quando o simulado é cronometrado. */
  deadline?: number
}

interface Result {
  mode: Mode
  answered: AnsweredQuestion[]
  seconds: number
  timed: boolean
  seed: string
}

const DIFFICULTIES: ExamQuestion['difficulty'][] = [1, 2, 3]
const STATUSES: QuestionStatus[] = ['nova', 'errou', 'acertou']
const LIST_PAGE = 15

const plainText = (t: string) => t.replace(/\*\*|`/g, '').replace(/\[\[[^|\]]+\|([^\]]+)\]\]/g, '$1')
const excerpt = (q: ExamQuestion) => {
  const t = plainText(q.stem.join(' '))
  return t.length > 140 ? `${t.slice(0, 137).trimEnd()}…` : t
}
const percent = (n: number, d: number) => (d === 0 ? 0 : Math.round((n / d) * 100))

function formatClock(totalSeconds: number): string {
  const sec = Math.max(0, Math.round(totalSeconds))
  const h = Math.floor(sec / 3600)
  const m = Math.floor((sec % 3600) / 60)
  const r = sec % 60
  const mm = String(m).padStart(h > 0 ? 2 : 1, '0')
  return `${h > 0 ? `${h}:` : ''}${mm}:${String(r).padStart(2, '0')}`
}

function formatDuration(totalSeconds: number): string {
  const min = Math.floor(totalSeconds / 60)
  const sec = Math.round(totalSeconds % 60)
  if (min === 0) return `${sec} s`
  return sec === 0 ? `${min} min` : `${min} min ${sec} s`
}

function useFilter(): [QuestionFilter, (key: string, value: string) => void, () => void] {
  const [params, setParams] = useSearchParams()
  const track = params.get('trilha') ?? ''
  const concept = params.get('conceito') ?? ''
  const difficulty = Number(params.get('dificuldade'))
  const domain = params.get('dominio') ?? ''
  const status = params.get('situacao') ?? ''
  const filter: QuestionFilter = {
    track: registry.tracks.has(track) ? track : undefined,
    concept: registry.concepts.has(concept) ? concept : undefined,
    difficulty: DIFFICULTIES.includes(difficulty as ExamQuestion['difficulty']) ? (difficulty as ExamQuestion['difficulty']) : undefined,
    domain: registry.examDomains.some((d) => d.id === domain) ? (domain as ExamDomainId) : undefined,
    status: STATUSES.includes(status as QuestionStatus) ? (status as QuestionStatus) : undefined,
  }
  const set = (key: string, value: string) => {
    const next = new URLSearchParams(params)
    if (value) next.set(key, value)
    else next.delete(key)
    if (key === 'trilha') next.delete('conceito')
    setParams(next, { replace: true })
  }
  return [filter, set, () => setParams(new URLSearchParams(), { replace: true })]
}

export function QuestionBankPage() {
  useDocumentTitle('Banco de questões')
  const [session, setSession] = useState<Session | null>(null)
  const [result, setResult] = useState<Result | null>(null)

  const start = (mode: Mode, refs: QuestionRef[], timed = false) => {
    if (refs.length === 0) return
    const now = clock.now().getTime()
    setResult(null)
    setSession({ mode, refs, timed, seed: now.toString(36), startedAt: now, deadline: timed ? now + refs.length * SECONDS_PER_QUESTION * 1000 : undefined })
    window.scrollTo({ top: 0 })
  }
  const finish = (r: Result) => {
    setSession(null)
    setResult(r)
    window.scrollTo({ top: 0 })
  }
  const back = () => {
    setSession(null)
    setResult(null)
  }

  if (result) return <AttemptResult result={result} onBack={back} onPractice={(refs) => start('treino', refs)} />
  if (session?.mode === 'simulado') return <SimuladoRunner session={session} onFinish={finish} onQuit={back} />
  if (session) return <PracticeRunner session={session} onFinish={finish} onQuit={back} />
  return <BankHome onStart={start} />
}

// ---------------------------------------------------------------------------
// Banco: filtros, estatísticas e lista
// ---------------------------------------------------------------------------

function BankHome({ onStart }: { onStart: (mode: Mode, refs: QuestionRef[], timed?: boolean) => void }) {
  const progress = useGame((st) => st.progress)
  const [filter, setFilter, clearFilter] = useFilter()
  const [practiceSize, setPracticeSize] = useState(10)
  const [simSize, setSimSize] = useState(10)
  const [timed, setTimed] = useState(true)
  const [shown, setShown] = useState(LIST_PAGE)
  const pool = useMemo(() => filterQuestions(registry, progress, filter), [progress, filter])
  const stats = bankStats(registry, progress)
  const last = progress.exam.simulados.at(-1)
  const tracks = [...registry.tracks.values()].filter((t) => [...registry.questions.values()].some((r) => r.track?.id === t.id))

  const conceptOptions = useMemo(() => {
    const counts = new Map<string, number>()
    for (const r of registry.questions.values()) {
      if (filter.track && r.track?.id !== filter.track) continue
      for (const c of questionConcepts(r.question)) counts.set(c, (counts.get(c) ?? 0) + 1)
    }
    return [...counts]
      .map(([id, n]) => ({ id, n, title: registry.concepts.get(id)?.title ?? id }))
      .sort((a, b) => a.title.localeCompare(b.title, 'pt-BR'))
  }, [filter.track])

  const sizes = (list: number[]) => [...new Set([...list.filter((n) => n < pool.length), pool.length])]
  const practiceChoice = Math.min(practiceSize, pool.length)
  const simChoice = Math.min(simSize, pool.length)
  const seed = () => clock.now().getTime().toString(36)
  const filtered = Boolean(filter.track || filter.concept || filter.difficulty || filter.domain || filter.status)

  return (
    <div className="page">
      <p className="eyebrow">
        <Link to="/revisao">Revisão</Link> · questões de simulado
      </p>
      <h1>Banco de questões</h1>
      <p className="muted" style={{ maxWidth: 720 }}>
        Questões no estilo do exame SAA-C03, cada uma com a dificuldade, o conceito avaliado, o domínio do exame e a explicação de todas as alternativas. As respostas atualizam o domínio dos conceitos e trazem de volta para a revisão o que você errou. Não valem XP, porque
        a mesma questão pode ser repetida.
      </p>

      <div className={s.stats}>
        <div>
          <b>{stats.total}</b>
          <span>questões no banco</span>
        </div>
        <div>
          <b>{stats.answered}</b>
          <span>já respondidas</span>
        </div>
        <div>
          <b>{stats.answered ? `${percent(stats.rightNow, stats.answered)}%` : 'Sem dados'}</b>
          <span>de acerto na última resposta</span>
        </div>
        <div>
          <b>{last ? `${last.correct} de ${last.total}` : 'Nenhum'}</b>
          <span>{last ? `no último simulado (${new Date(last.at).toLocaleDateString('pt-BR')})` : 'simulado feito'}</span>
        </div>
      </div>

      <Callout kind="info" title="Formato do exame">
        <p>
          O SAA-C03 tem {EXAM_FORMAT.questions} questões em {EXAM_FORMAT.minutes} minutos, de dois tipos: <b>múltipla escolha</b> (uma correta entre quatro) e <b>resposta múltipla</b> (duas ou mais corretas entre cinco ou mais). Questão sem resposta conta como errada, e
          chutar não tira pontos. O banco segue o mesmo formato.
        </p>
      </Callout>

      <Card className={s.filters} aria-labelledby="filtros-titulo">
        <h2 id="filtros-titulo" className={s.cardTitle}>
          Filtros
        </h2>
        <div className={s.filterGrid}>
          <label>
            Trilha
            <select value={filter.track ?? ''} onChange={(e) => setFilter('trilha', e.target.value)}>
              <option value="">Todas as trilhas</option>
              {tracks.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.title}
                </option>
              ))}
            </select>
          </label>
          <label>
            Conceito
            <select value={filter.concept ?? ''} onChange={(e) => setFilter('conceito', e.target.value)}>
              <option value="">Todos os conceitos</option>
              {conceptOptions.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title} ({c.n})
                </option>
              ))}
            </select>
          </label>
          <label>
            Dificuldade
            <select value={filter.difficulty ?? ''} onChange={(e) => setFilter('dificuldade', e.target.value)}>
              <option value="">Todas</option>
              {DIFFICULTIES.map((d) => (
                <option key={d} value={d}>
                  {DIFFICULTY_LABEL[d]}
                </option>
              ))}
            </select>
          </label>
          <label>
            Domínio do exame
            <select value={filter.domain ?? ''} onChange={(e) => setFilter('dominio', e.target.value)}>
              <option value="">Todos</option>
              {registry.examDomains.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.id.slice(1)}. {d.title}
                </option>
              ))}
            </select>
          </label>
          <label>
            Situação
            <select value={filter.status ?? ''} onChange={(e) => setFilter('situacao', e.target.value)}>
              <option value="">Todas</option>
              {STATUSES.map((st) => (
                <option key={st} value={st}>
                  {STATUS_LABEL[st]}
                </option>
              ))}
            </select>
          </label>
        </div>
        <p className={s.poolCount} aria-live="polite">
          <b>{pool.length}</b> {pool.length === 1 ? 'questão atende' : 'questões atendem'} aos filtros.
          {filtered && (
            <Button variant="ghost" size="small" onClick={clearFilter}>
              Limpar filtros
            </Button>
          )}
        </p>
      </Card>

      <div className={s.modes}>
        <Card>
          <h2 className={s.cardTitle}>
            <Dumbbell size={20} aria-hidden="true" /> Treino com explicação
          </h2>
          <p className="muted">Uma questão por vez, com a explicação logo depois de responder. Começa pelas que você errou, depois as que nunca respondeu.</p>
          <label className={s.inline}>
            Quantidade
            <select value={practiceChoice} onChange={(e) => setPracticeSize(Number(e.target.value))} disabled={pool.length === 0}>
              {sizes([5, 10, 20]).map((n) => (
                <option key={n} value={n}>
                  {n === pool.length ? `Todas (${n})` : n}
                </option>
              ))}
            </select>
          </label>
          <Button onClick={() => onStart('treino', practiceOrder(pool, progress, seed()).slice(0, practiceChoice))} disabled={pool.length === 0}>
            Começar treino
          </Button>
        </Card>
        <Card>
          <h2 className={s.cardTitle}>
            <Timer size={20} aria-hidden="true" /> Simulado
          </h2>
          <p className="muted">Responda tudo primeiro e veja o resultado no final, por domínio e por dificuldade, com a explicação de cada questão. Dá para marcar questões para rever antes de finalizar.</p>
          <label className={s.inline}>
            Quantidade
            <select value={simChoice} onChange={(e) => setSimSize(Number(e.target.value))} disabled={pool.length === 0}>
              {sizes([10, 20, EXAM_FORMAT.questions]).map((n) => (
                <option key={n} value={n}>
                  {n === pool.length ? `Todas (${n})` : n}
                </option>
              ))}
            </select>
          </label>
          <label className={s.check}>
            <input type="checkbox" checked={timed} onChange={(e) => setTimed(e.target.checked)} />
            Com cronômetro: 2 minutos por questão, o ritmo do exame ({EXAM_FORMAT.minutes} minutos para {EXAM_FORMAT.questions} questões)
          </label>
          <Button variant="secondary" onClick={() => onStart('simulado', simuladoSample(pool, simChoice, seed()), timed)} disabled={pool.length === 0}>
            Começar simulado
          </Button>
        </Card>
      </div>

      <section className={s.listSection} aria-labelledby="lista-titulo">
        <h2 id="lista-titulo" className={s.cardTitle}>
          <Library size={20} aria-hidden="true" /> Questões
        </h2>
        {pool.length === 0 ? (
          <p className="muted">Nenhuma questão com esses filtros.</p>
        ) : (
          <ol className={s.list}>
            {pool.slice(0, shown).map((r) => {
              const q = r.question
              const st = questionStatus(progress, q.id)
              return (
                <li key={q.id} data-status={st}>
                  <span className={s.listIcon} aria-label={STATUS_LABEL[st]} title={STATUS_LABEL[st]}>
                    {st === 'acertou' ? <Check size={16} /> : st === 'errou' ? <X size={16} /> : <CircleHelp size={16} />}
                  </span>
                  <div className={s.listBody}>
                    <p className={s.listMeta}>
                      <Badge tone="mastery">{registry.concepts.get(q.concept)?.title ?? q.concept}</Badge>
                      <Badge>Dificuldade: {DIFFICULTY_LABEL[q.difficulty]}</Badge>
                      <Badge>Domínio {q.domain.slice(1)}</Badge>
                      {isMultiple(q) && <Badge tone="info">Resposta múltipla</Badge>}
                    </p>
                    <p className={s.listText}>{excerpt(q)}</p>
                  </div>
                  <Button variant="ghost" size="small" onClick={() => onStart('treino', [r])}>
                    Responder
                  </Button>
                </li>
              )
            })}
          </ol>
        )}
        {pool.length > shown && (
          <Button variant="secondary" onClick={() => setShown((n) => n + LIST_PAGE)}>
            Mostrar mais {Math.min(LIST_PAGE, pool.length - shown)} de {pool.length - shown}
          </Button>
        )}
      </section>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Treino: uma questão por vez, com explicação na hora
// ---------------------------------------------------------------------------

function PracticeRunner({ session, onFinish, onQuit }: { session: Session; onFinish: (r: Result) => void; onQuit: () => void }) {
  const submitExam = useGame((st) => st.submitExam)
  const [index, setIndex] = useState(0)
  const [selected, setSelected] = useState<string[]>([])
  const [revealed, setRevealed] = useState(false)
  const [answered, setAnswered] = useState<AnsweredQuestion[]>([])
  const q = session.refs[index].question
  const need = q.options.filter((o) => o.correct).length
  const last = index + 1 >= session.refs.length

  const verify = () => {
    submitExam([{ questionId: q.id, selected }])
    setAnswered((list) => [...list, { question: q, selected }])
    setRevealed(true)
  }
  const next = () => {
    if (last) return onFinish({ mode: 'treino', answered, seconds: (clock.now().getTime() - session.startedAt) / 1000, timed: false, seed: session.seed })
    setIndex(index + 1)
    setSelected([])
    setRevealed(false)
    window.scrollTo({ top: 0 })
  }

  return (
    <div className="page">
      <div className={s.sessionHead}>
        <div>
          <p className="eyebrow">Treino com explicação</p>
          <p className="muted">
            {answered.filter((a) => isQuestionCorrect(a.question, a.selected)).length} de {answered.length} {answered.length === 1 ? 'acerto' : 'acertos'} até agora
          </p>
        </div>
        <div className={s.sessionBar}>
          <ProgressBar value={index / session.refs.length} color="var(--mastery)" label="Progresso do treino" />
        </div>
      </div>
      <Card>
        <ExamQuestionView key={q.id} question={q} number={index + 1} total={session.refs.length} selected={selected} onChange={setSelected} revealed={revealed} seed={session.seed} />
        <div className={s.actions}>
          {!revealed ? (
            <>
              <Button onClick={verify} disabled={selected.length !== need}>
                <Check size={18} aria-hidden="true" /> Verificar
              </Button>
              <Button variant="ghost" onClick={next}>
                {last ? 'Pular e ver o resultado' : 'Pular'}
              </Button>
              {need > 1 && selected.length !== need && <span className="muted">Marque {need} alternativas.</span>}
            </>
          ) : (
            <Button onClick={next}>
              {last ? 'Ver resultado' : 'Próxima questão'} <ArrowRight size={18} aria-hidden="true" />
            </Button>
          )}
          <Button variant="ghost" onClick={answered.length > 0 ? () => onFinish({ mode: 'treino', answered, seconds: (clock.now().getTime() - session.startedAt) / 1000, timed: false, seed: session.seed }) : onQuit}>
            Encerrar
          </Button>
        </div>
      </Card>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Simulado: navegação livre, marcação para revisar e cronômetro opcional
// ---------------------------------------------------------------------------

function useSecondsLeft(deadline: number | undefined): number | null {
  const [now, setNow] = useState(() => clock.now().getTime())
  useEffect(() => {
    if (deadline === undefined) return
    const id = window.setInterval(() => setNow(clock.now().getTime()), 1000)
    return () => window.clearInterval(id)
  }, [deadline])
  return deadline === undefined ? null : Math.max(0, Math.ceil((deadline - now) / 1000))
}

function SimuladoRunner({ session, onFinish, onQuit }: { session: Session; onFinish: (r: Result) => void; onQuit: () => void }) {
  const submitExam = useGame((st) => st.submitExam)
  const [index, setIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string[]>>({})
  const [flagged, setFlagged] = useState<Record<string, boolean>>({})
  const [confirm, setConfirm] = useState(false)
  const [quit, setQuit] = useState(false)
  const left = useSecondsLeft(session.deadline)
  const refs = session.refs
  const q = refs[index].question
  const unanswered = refs.filter((r) => !(answers[r.question.id]?.length)).length

  const finish = () => {
    const answered = refs.map((r) => ({ question: r.question, selected: answers[r.question.id] ?? [] }))
    const seconds = Math.min((clock.now().getTime() - session.startedAt) / 1000, session.deadline ? (session.deadline - session.startedAt) / 1000 : Infinity)
    submitExam(
      answered.map((a) => ({ questionId: a.question.id, selected: a.selected })),
      { seconds, timed: session.timed },
    )
    onFinish({ mode: 'simulado', answered, seconds, timed: session.timed, seed: session.seed })
  }

  const timeUp = left === 0
  useEffect(() => {
    if (timeUp) finish()
    // Finaliza uma única vez, quando o tempo acaba.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeUp])

  const go = (i: number) => {
    setIndex(i)
    window.scrollTo({ top: 0 })
  }

  return (
    <div className="page">
      <div className={s.sessionHead}>
        <div>
          <p className="eyebrow">Simulado · {refs.length} questões</p>
          <p className="muted">
            {refs.length - unanswered} de {refs.length} respondidas
          </p>
        </div>
        {left !== null && (
          <p className={s.timer} data-low={left <= 300} role="timer" aria-label={`Tempo restante: ${formatDuration(left)}`}>
            <Clock size={18} aria-hidden="true" /> {formatClock(left)}
          </p>
        )}
      </div>

      <nav className={s.navigator} aria-label="Questões do simulado">
        {refs.map((r, i) => {
          const id = r.question.id
          return (
            <button
              key={id}
              type="button"
              className={s.navItem}
              data-current={i === index}
              data-answered={Boolean(answers[id]?.length)}
              data-flagged={Boolean(flagged[id])}
              aria-current={i === index ? 'step' : undefined}
              aria-label={`Questão ${i + 1}${answers[id]?.length ? ', respondida' : ', sem resposta'}${flagged[id] ? ', marcada para revisar' : ''}`}
              onClick={() => go(i)}
            >
              {i + 1}
            </button>
          )
        })}
      </nav>

      <Card>
        <ExamQuestionView
          key={q.id}
          question={q}
          number={index + 1}
          total={refs.length}
          selected={answers[q.id] ?? []}
          onChange={(sel) => setAnswers((a) => ({ ...a, [q.id]: sel }))}
          revealed={false}
          seed={session.seed}
        />
        <div className={s.actions}>
          <Button variant="secondary" onClick={() => go(index - 1)} disabled={index === 0}>
            <ArrowLeft size={18} aria-hidden="true" /> Anterior
          </Button>
          {index + 1 < refs.length ? (
            <Button onClick={() => go(index + 1)}>
              Próxima <ArrowRight size={18} aria-hidden="true" />
            </Button>
          ) : (
            <Button onClick={() => (unanswered > 0 ? setConfirm(true) : finish())}>
              <Check size={18} aria-hidden="true" /> Finalizar simulado
            </Button>
          )}
          <Button variant="ghost" onClick={() => setFlagged((f) => ({ ...f, [q.id]: !f[q.id] }))} aria-pressed={Boolean(flagged[q.id])}>
            <Flag size={18} aria-hidden="true" /> {flagged[q.id] ? 'Desmarcar' : 'Marcar para revisar'}
          </Button>
        </div>
      </Card>

      <div className={s.footerActions}>
        {index + 1 < refs.length && (
          <Button variant="secondary" onClick={() => (unanswered > 0 ? setConfirm(true) : finish())}>
            Finalizar simulado
          </Button>
        )}
        <Button variant="ghost" onClick={() => setQuit(true)}>
          Sair sem finalizar
        </Button>
      </div>

      <Modal
        open={confirm}
        onClose={() => setConfirm(false)}
        labelledBy="confirmar-fim"
        actions={
          <>
            <Button variant="secondary" onClick={() => setConfirm(false)}>
              Continuar respondendo
            </Button>
            <Button onClick={finish}>Finalizar mesmo assim</Button>
          </>
        }
      >
        <h2 id="confirmar-fim">Finalizar o simulado?</h2>
        <p>
          {unanswered === 1 ? 'Uma questão está sem resposta e vai contar como errada' : `${unanswered} questões estão sem resposta e vão contar como erradas`}, como no exame.
        </p>
      </Modal>
      <Modal
        open={quit}
        onClose={() => setQuit(false)}
        labelledBy="confirmar-saida"
        actions={
          <>
            <Button variant="secondary" onClick={() => setQuit(false)}>
              Voltar ao simulado
            </Button>
            <Button variant="danger" onClick={onQuit}>
              Sair e descartar
            </Button>
          </>
        }
      >
        <h2 id="confirmar-saida">Sair sem finalizar?</h2>
        <p>As respostas deste simulado serão descartadas e não contam para o domínio dos conceitos.</p>
      </Modal>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Resultado
// ---------------------------------------------------------------------------

function AttemptResult({ result, onBack, onPractice }: { result: Result; onBack: () => void; onPractice: (refs: QuestionRef[]) => void }) {
  const summary = useMemo(() => summarizeAttempt(result.answered), [result.answered])
  const wrong = result.answered.filter((a) => !isQuestionCorrect(a.question, a.selected))
  const wrongRefs = wrong.map((a) => registry.questions.get(a.question.id)).filter((r): r is QuestionRef => Boolean(r))
  const simulado = result.mode === 'simulado'

  if (summary.total === 0) {
    return (
      <div className="page">
        <Card className={s.result}>
          <p className="eyebrow">Treino encerrado</p>
          <h1>Nenhuma questão respondida</h1>
          <Button onClick={onBack}>Voltar ao banco</Button>
        </Card>
      </div>
    )
  }

  return (
    <div className="page">
      <Card className={s.result}>
        <p className="eyebrow">{simulado ? 'Simulado concluído' : 'Treino concluído'}</p>
        <h1>
          {summary.correct} de {summary.total} {summary.total === 1 ? 'acerto' : 'acertos'} ({percent(summary.correct, summary.total)}%)
        </h1>
        <p className="muted">
          Tempo: {formatDuration(result.seconds)}
          {simulado && result.timed ? ` de ${formatDuration(summary.total * SECONDS_PER_QUESTION)} disponíveis` : ''}.
          {summary.unanswered > 0 ? ` ${summary.unanswered === 1 ? 'Uma questão ficou' : `${summary.unanswered} questões ficaram`} sem resposta.` : ''}
        </p>
        {simulado && (
          <Callout kind="info" title="Como comparar com o exame">
            <p>
              A nota do exame é escalonada de 100 a 1.000, com mínimo de {EXAM_FORMAT.minScore}, e não equivale a uma porcentagem de acertos. Use este resultado para achar os pontos fracos, não para prever a nota.
            </p>
          </Callout>
        )}

        <div className={s.breakdown}>
          <section aria-labelledby="por-dominio">
            <h2 id="por-dominio" className={s.cardTitle}>
              Por domínio do exame
            </h2>
            <ul className={s.bars}>
              {summary.byDomain.map((d) => {
                const dom = registry.examDomains.find((x) => x.id === d.domain)
                return (
                  <li key={d.domain}>
                    <span>
                      {d.domain.slice(1)}. {dom?.title}
                    </span>
                    <ProgressBar value={d.correct / d.total} color="var(--accent)" label={`${dom?.title}: ${d.correct} de ${d.total}`} />
                    <span className={s.barValue}>
                      {d.correct} de {d.total}
                    </span>
                  </li>
                )
              })}
            </ul>
          </section>
          <section aria-labelledby="por-dificuldade">
            <h2 id="por-dificuldade" className={s.cardTitle}>
              Por dificuldade
            </h2>
            <ul className={s.bars}>
              {summary.byDifficulty.map((d) => (
                <li key={d.difficulty}>
                  <span>{DIFFICULTY_LABEL[d.difficulty]}</span>
                  <ProgressBar value={d.correct / d.total} color="var(--mastery)" label={`${DIFFICULTY_LABEL[d.difficulty]}: ${d.correct} de ${d.total}`} />
                  <span className={s.barValue}>
                    {d.correct} de {d.total}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        </div>

        {summary.weakConcepts.length > 0 && (
          <section aria-labelledby="revisar" className={s.weak}>
            <h2 id="revisar" className={s.cardTitle}>
              Conceitos para revisar
            </h2>
            <p className="muted">Esses conceitos voltam para a fila de revisão. Leia o Codex ou treine só as questões deles.</p>
            <ul>
              {summary.weakConcepts.map((c) => (
                <li key={c.conceptId}>
                  <Link to={`/codex/${c.conceptId}`}>{registry.concepts.get(c.conceptId)?.title ?? c.conceptId}</Link>
                  <span className="muted">
                    {c.wrong} de {c.total} {c.total === 1 ? 'errada' : 'erradas'}
                  </span>
                  <Link to={`/revisao/questoes?conceito=${c.conceptId}`} onClick={onBack}>
                    Treinar este conceito
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        <div className={s.actions}>
          {wrongRefs.length > 0 && (
            <Button onClick={() => onPractice(wrongRefs)}>
              <RotateCcw size={18} aria-hidden="true" /> Refazer as {wrongRefs.length === 1 ? 'erradas (1)' : `${wrongRefs.length} erradas`}
            </Button>
          )}
          <Button variant="secondary" onClick={onBack}>
            Voltar ao banco
          </Button>
          <ButtonLink to="/revisao" variant="ghost">
            Ir para a revisão
          </ButtonLink>
        </div>
      </Card>

      <section aria-labelledby="correcao" className={s.review}>
        <h2 id="correcao">Correção comentada</h2>
        {result.answered.map((a, i) => {
          const ok = isQuestionCorrect(a.question, a.selected)
          return (
            <details key={a.question.id} className={s.reviewItem} open={!ok && i < 3}>
              <summary data-ok={ok}>
                <span className={s.listIcon} aria-hidden="true">
                  {ok ? <Check size={16} /> : <X size={16} />}
                </span>
                <span>
                  {i + 1}. {registry.concepts.get(a.question.concept)?.title ?? a.question.concept}
                </span>
                <Badge>{DIFFICULTY_LABEL[a.question.difficulty]}</Badge>
                <span className="sr-only">{ok ? 'acertou' : a.selected.length === 0 ? 'sem resposta' : 'errou'}</span>
              </summary>
              <ExamQuestionView question={a.question} number={i + 1} total={result.answered.length} selected={a.selected} onChange={() => {}} revealed seed={result.seed} />
            </details>
          )
        })}
      </section>
    </div>
  )
}
