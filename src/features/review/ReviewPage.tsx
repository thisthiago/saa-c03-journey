import { Brain, Check, Clock, Dumbbell, Library, RotateCcw, Sparkles } from 'lucide-react'
import { useState } from 'react'
import { registry } from '../../content'
import { isDue, masteryTier, TIER_LABEL } from '../../engine/mastery'
import { bankStats } from '../../engine/exam'
import { buildPracticeSession, buildReviewSession, nextReviewDate, REVIEW_SESSION_SIZE, sessionSizeOptions, type ReviewEntry } from '../../engine/review'
import { clock, useGame } from '../../store/gameStore'
import { useDocumentTitle } from '../../app/hooks'
import { Badge, Button, ButtonLink, Card, ProgressBar } from '../../ui/kit'
import { relativeDays } from '../../app/format'
import { ActivityRunner } from '../mission/ActivityRunner'
import s from './review.module.css'

/** Escolha de quantos itens entram na rodada; some quando só há uma opção. */
function SizePicker({ name, available, value, onChange }: { name: string; available: number; value: number; onChange: (n: number) => void }) {
  const options = sessionSizeOptions(available)
  if (options.length < 2) return null
  return (
    <fieldset className={s.sizes}>
      <legend>Itens nesta rodada</legend>
      {options.map((n) => (
        <label key={n}>
          <input type="radio" name={name} value={n} checked={value === n} onChange={() => onChange(n)} />
          <span>{n === available ? `Todos (${n})` : n}</span>
        </label>
      ))}
    </fieldset>
  )
}

/** Tamanho efetivo: o escolhido, limitado ao que há para revisar. */
function fit(choice: number, available: number) {
  const options = sessionSizeOptions(available)
  return options.includes(choice) ? choice : (options.filter((n) => n <= choice).at(-1) ?? options[0] ?? 0)
}

interface Answer {
  conceptId: string
  score: number
  xp: number
  before: number
}

export function ReviewPage() {
  useDocumentTitle('Revisão')
  const progress = useGame((st) => st.progress)
  const submitReview = useGame((st) => st.submitReview)
  const completeSession = useGame((st) => st.completeReviewSession)
  const [session, setSession] = useState<{ entries: ReviewEntry[]; practice: boolean } | null>(null)
  const [index, setIndex] = useState(0)
  const [answers, setAnswers] = useState<Answer[]>([])
  const [finished, setFinished] = useState(false)
  const now = clock.now()
  const [reviewSize, setReviewSize] = useState(REVIEW_SESSION_SIZE)
  const [practiceSize, setPracticeSize] = useState(REVIEW_SESSION_SIZE)
  const due = buildReviewSession(progress, registry, now, Infinity)
  const practicePool = buildPracticeSession(progress, registry, Infinity).length
  const studied = Object.values(progress.concepts).filter((c) => c.evidence > 0).length
  const reviewChoice = fit(reviewSize, due.length)
  const practiceChoice = fit(practiceSize, practicePool)

  const start = (practice: boolean) => {
    const entries = practice ? buildPracticeSession(progress, registry, practiceChoice) : buildReviewSession(progress, registry, clock.now(), reviewChoice)
    setSession({ entries, practice })
    setIndex(0)
    setAnswers([])
    setFinished(false)
  }

  if (!session) {
    const next = nextReviewDate(progress, registry)
    const bank = bankStats(registry, progress)
    return (
      <div className="page">
        <p className="eyebrow">Revisão inteligente</p>
        <h1>Treino de memória</h1>
        <p className="muted" style={{ maxWidth: 680 }}>
          A revisão traz de volta conceitos vencidos (repetição espaçada) e conceitos em que você teve dificuldade. Cada acerto no prazo vale XP e aumenta o intervalo até a próxima revisão; um erro traz o conceito de volta
          amanhã.
        </p>
        <div className={s.introGrid}>
          <Card>
            <h2 className={s.cardTitle}>
              <Clock size={20} aria-hidden="true" /> Revisão do dia
            </h2>
            {due.length > 0 ? (
              <>
                <p>
                  <b>{due.length}</b> {due.length === 1 ? 'item pronto' : 'itens prontos'}, intercalando fases diferentes.
                </p>
                <ul className={s.preview}>
                  {due.slice(0, 5).map((e) => (
                    <li key={e.conceptId}>
                      {registry.concepts.get(e.conceptId)?.title}
                      <Badge tone={e.reason === 'due' ? 'xp' : 'warning'}>{e.reason === 'due' ? 'vencido' : 'domínio baixo'}</Badge>
                    </li>
                  ))}
                </ul>
                <SizePicker name="review-size" available={due.length} value={reviewChoice} onChange={setReviewSize} />
                <Button onClick={() => start(false)}>
                  <RotateCcw size={18} aria-hidden="true" /> Começar revisão
                </Button>
              </>
            ) : (
              <p className="muted">{studied === 0 ? 'Você ainda não estudou conceitos. Faça uma missão para alimentar a revisão.' : next ? `Nada vencido agora. A próxima revisão vence ${relativeDays(next, now)}.` : 'Nada vencido agora.'}</p>
            )}
          </Card>
          <Card>
            <h2 className={s.cardTitle}>
              <Dumbbell size={20} aria-hidden="true" /> Treino livre
            </h2>
            <p className="muted">Pratique os conceitos já estudados, começando pelos mais frágeis. O domínio é atualizado, mas o treino fora do prazo não gera XP.</p>
            {studied > 0 ? (
              <>
                <SizePicker name="practice-size" available={practicePool} value={practiceChoice} onChange={setPracticeSize} />
                <Button variant="secondary" onClick={() => start(true)}>
                  Treinar agora
                </Button>
              </>
            ) : (
              <ButtonLink to="/" variant="secondary">
                Ir para a próxima missão
              </ButtonLink>
            )}
          </Card>
          <Card>
            <h2 className={s.cardTitle}>
              <Library size={20} aria-hidden="true" /> Banco de questões
            </h2>
            <p className="muted">
              {bank.total} questões no estilo do exame, com dificuldade, conceito e a explicação de cada alternativa. Treine com a resposta comentada na hora ou faça um simulado com cronômetro.
            </p>
            {bank.answered > 0 && (
              <p>
                <b>{bank.answered}</b> {bank.answered === 1 ? 'respondida' : 'respondidas'}, {bank.wrongNow} para refazer.
              </p>
            )}
            <ButtonLink to="/revisao/questoes" variant="secondary">
              Abrir o banco de questões
            </ButtonLink>
          </Card>
        </div>
      </div>
    )
  }

  const { entries, practice } = session
  if (finished || entries.length === 0) {
    const correct = answers.filter((a) => a.score >= 0.7).length
    const xp = answers.reduce((sum, a) => sum + a.xp, 0)
    return (
      <div className="page">
        <Card className={s.summary}>
          <p className="eyebrow">{practice ? 'Treino concluído' : 'Revisão concluída'}</p>
          <h1>
            {correct} de {answers.length} acertos
          </h1>
          <p className="muted">{xp > 0 ? `+${xp} XP por itens revisados no prazo.` : practice ? 'Treino livre não gera XP, mas fortalece o domínio.' : 'Sem XP nesta sessão.'}</p>
          <ul className={s.results}>
            {answers.map((a, i) => {
              const after = progress.concepts[a.conceptId]
              const tier = masteryTier(after)
              return (
                <li key={i} data-ok={a.score >= 0.7}>
                  <Check size={16} aria-hidden="true" />
                  <span className={s.resultName}>{registry.concepts.get(a.conceptId)?.title}</span>
                  <Badge tone={tier === 'dominado' ? 'mastery' : 'neutral'}>{TIER_LABEL[tier]}</Badge>
                  <span className={s.delta}>
                    domínio {Math.round(a.before * 100)} → {Math.round((after?.mastery ?? a.before) * 100)}
                  </span>
                </li>
              )
            })}
          </ul>
          <div className="row" style={{ marginTop: 20 }}>
            <ButtonLink to="/">Voltar para a Base</ButtonLink>
            <Button variant="secondary" onClick={() => setSession(null)}>
              Fechar
            </Button>
          </div>
        </Card>
      </div>
    )
  }

  const entry = entries[index]
  const concept = registry.concepts.get(entry.conceptId)
  const cp = progress.concepts[entry.conceptId]
  const worthXp = Boolean(cp && isDue(cp, now))
  const finish = () => {
    if (!practice) completeSession()
    setFinished(true)
  }
  return (
    <div className="page">
      <div className={s.head}>
        <div>
          <p className="eyebrow">
            {practice ? 'Treino livre' : 'Revisão'} · item {index + 1} de {entries.length}
          </p>
          <h1 className={s.concept}>
            <Brain size={22} aria-hidden="true" /> {concept?.title}
          </h1>
          <div className="row">
            <Badge tone={worthXp ? 'xp' : 'warning'} icon={<Sparkles size={13} aria-hidden="true" />}>
              {worthXp ? 'vencido · vale XP' : practice ? 'treino · sem XP' : 'domínio baixo · sem XP'}
            </Badge>
            <Badge>{concept?.officialName}</Badge>
          </div>
        </div>
        <div className={s.progress}>
          <ProgressBar value={index / entries.length} color="var(--mastery)" label="Progresso da revisão" />
        </div>
      </div>
      <Card>
        <ActivityRunner
          key={`${entry.item.id}:${index}`}
          activity={entry.item}
          mode="review"
          onSubmit={(evaluation) => {
            const before = progress.concepts[entry.conceptId]?.mastery ?? 0
            const events = submitReview(entry.conceptId, entry.item.id, evaluation)
            const xp = events.filter((e) => e.type === 'xp' && e.source === 'review').reduce((acc, e) => acc + (e.type === 'xp' ? e.amount : 0), 0)
            setAnswers((list) => [...list, { conceptId: entry.conceptId, score: evaluation.score, xp, before }])
            return { xp, events }
          }}
          onContinue={() => (index + 1 >= entries.length ? finish() : setIndex(index + 1))}
          continueLabel={index + 1 >= entries.length ? 'Ver resultado' : 'Próximo item'}
        />
      </Card>
    </div>
  )
}
