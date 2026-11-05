import { Brain, Check, Clock, Dumbbell, Library, RotateCcw, Sparkles } from 'lucide-react'
import { useState } from 'react'
import { registry } from '../../content'
import { isDue, masteryTier, TIER_LABEL, type Confidence } from '../../engine/mastery'
import { bankStats } from '../../engine/exam'
import { PACE_TARGET_SECONDS, sessionGrade } from '../../engine/review-grade'
import {
  buildPracticeSession,
  buildReviewSession,
  DAILY_REVIEW_LIMIT,
  dailyReviewLeft,
  nextReviewDate,
  REVIEW_SESSION_SIZE,
  reviewCandidates,
  sessionSizeOptions,
  type ReviewEntry,
} from '../../engine/review'
import { clock, useGame } from '../../store/gameStore'
import { useDocumentTitle } from '../../app/hooks'
import { Badge, Button, ButtonLink, Card, ProgressBar } from '../../ui/kit'
import { relativeDays } from '../../app/format'
import { ActivityRunner } from '../mission/ActivityRunner'
import s from './review.module.css'

/** Escolha de quantos itens entram na rodada; some quando só há uma opção. */
function SizePicker({ name, available, max, value, onChange }: { name: string; available: number; max?: number; value: number; onChange: (n: number) => void }) {
  const options = sessionSizeOptions(available, max)
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
function fit(choice: number, available: number, max?: number) {
  const options = sessionSizeOptions(available, max)
  return options.includes(choice) ? choice : (options.filter((n) => n <= choice).at(-1) ?? options[0] ?? 0)
}

interface Answer {
  conceptId: string
  score: number
  xp: number
  before: number
  confidence?: Confidence
  /** Primeira resposta do item; "Tentar novamente" não entra na nota. */
  first: boolean
  /** Segundos entre o item aparecer e a primeira verificação. */
  seconds?: number
}

function formatSeconds(total: number): string {
  const n = Math.round(total)
  return n < 60 ? `${n} s` : `${Math.floor(n / 60)} min ${String(n % 60).padStart(2, '0')} s`
}

const CONFIDENCE_BADGE: Record<Confidence, string> = { chute: 'chutei', duvida: 'com dúvida', certeza: 'com certeza' }

export function ReviewPage() {
  useDocumentTitle('Revisão')
  const progress = useGame((st) => st.progress)
  const submitReview = useGame((st) => st.submitReview)
  const completeSession = useGame((st) => st.completeReviewSession)
  const [session, setSession] = useState<{ entries: ReviewEntry[]; practice: boolean } | null>(null)
  const [index, setIndex] = useState(0)
  const [answers, setAnswers] = useState<Answer[]>([])
  // O conceito só aparece depois da resposta: antes, ele entregaria a resposta de "qual serviço atende".
  const [answeredIndex, setAnsweredIndex] = useState(-1)
  const [finished, setFinished] = useState(false)
  const [itemStartedAt, setItemStartedAt] = useState(() => clock.now().getTime())
  const now = clock.now()
  const [reviewSize, setReviewSize] = useState(REVIEW_SESSION_SIZE)
  const [practiceSize, setPracticeSize] = useState(REVIEW_SESSION_SIZE)
  const left = dailyReviewLeft(progress, now)
  const due = buildReviewSession(progress, registry, now, left)
  const waiting = reviewCandidates(progress, registry, now).length
  const practicePool = buildPracticeSession(progress, registry, Infinity).length
  const studied = Object.values(progress.concepts).filter((c) => c.evidence > 0).length
  const reviewChoice = fit(reviewSize, due.length, DAILY_REVIEW_LIMIT)
  const practiceChoice = fit(practiceSize, practicePool)

  const start = (practice: boolean) => {
    const entries = practice ? buildPracticeSession(progress, registry, practiceChoice) : buildReviewSession(progress, registry, clock.now(), reviewChoice)
    setSession({ entries, practice })
    setIndex(0)
    setAnswers([])
    setAnsweredIndex(-1)
    setFinished(false)
    setItemStartedAt(clock.now().getTime())
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
        <p className="muted" style={{ maxWidth: 680 }}>
          Antes de verificar cada resposta, diga se chutou, se tem dúvida ou se tem certeza. Só o acerto com certeza aumenta o intervalo; o acerto no chute volta amanhã para confirmar. A Revisão do dia tem no máximo{' '}
          {DAILY_REVIEW_LIMIT} itens por dia, começando pelos mais atrasados.
        </p>
        <div className={s.introGrid}>
          <Card>
            <h2 className={s.cardTitle}>
              <Clock size={20} aria-hidden="true" /> Revisão do dia
            </h2>
            {due.length > 0 ? (
              <>
                <p>
                  <b>{due.length}</b> {due.length === 1 ? 'item para hoje' : 'itens para hoje'}, intercalando fases diferentes.
                  {waiting > due.length && ` ${waiting - due.length === 1 ? 'O outro fica' : `Os outros ${waiting - due.length} ficam`} para os próximos dias.`}
                </p>
                <ul className={s.preview}>
                  {due.slice(0, 5).map((e) => (
                    <li key={e.conceptId}>
                      {registry.concepts.get(e.conceptId)?.title}
                      <Badge tone={e.reason === 'due' ? 'xp' : 'warning'}>{e.reason === 'due' ? 'vencido' : 'domínio baixo'}</Badge>
                    </li>
                  ))}
                </ul>
                <SizePicker name="review-size" available={due.length} max={DAILY_REVIEW_LIMIT} value={reviewChoice} onChange={setReviewSize} />
                <Button onClick={() => start(false)}>
                  <RotateCcw size={18} aria-hidden="true" /> Começar revisão
                </Button>
              </>
            ) : (
              <p className="muted">{waiting > 0 && left === 0 ? `Você fez as ${DAILY_REVIEW_LIMIT} revisões de hoje. As próximas ficam para amanhã; para continuar agora, use o Treino livre.` : studied === 0 ? 'Você ainda não estudou conceitos. Faça uma missão para alimentar a revisão.' : next ? `Nada vencido agora. A próxima revisão vence ${relativeDays(next, now)}.` : 'Nada vencido agora.'}</p>
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
    const sure = answers.filter((a) => a.score >= 0.7 && a.confidence === 'certeza').length
    const guessed = answers.filter((a) => a.score >= 0.7 && a.confidence !== 'certeza').length
    const g = sessionGrade(answers.filter((a) => a.first))
    return (
      <div className="page">
        <Card className={s.summary}>
          <p className="eyebrow">{practice ? 'Treino concluído' : 'Revisão concluída'}</p>
          <h1>
            {correct} de {answers.length} acertos
          </h1>
          {answers.length > 0 && (
            <p>
              {sure} {sure === 1 ? 'acerto' : 'acertos'} com certeza e {guessed} no chute ou com dúvida. Os acertos sem certeza voltam antes, para confirmar.
            </p>
          )}
          {answers.length > 0 && (
            <div className={s.grade} data-band={g.grade >= 7 ? 'good' : g.grade >= 5 ? 'mid' : 'low'}>
              <p className={s.gradeValue}>
                <span>Nota</span> <strong>{g.grade.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}</strong> <span>de 10 · {g.label}</span>
              </p>
              <ul className={s.gradeParts}>
                <li>
                  {g.counts.sure} com certeza · {g.counts.doubt} com dúvida · {g.counts.guess} no chute · {g.counts.wrong} {g.counts.wrong === 1 ? 'erro' : 'erros'}
                  {g.counts.wrongSure > 0 && ` (${g.counts.wrongSure} com certeza)`}
                </li>
                {g.averageSeconds !== undefined && (
                  <li>
                    Ritmo: {formatSeconds(g.averageSeconds)} por questão, em média; a prova dá cerca de {PACE_TARGET_SECONDS / 60} minutos.
                    {g.slow > 0 && ` ${g.slow === 1 ? 'Uma passou' : `${g.slow} passaram`} desse tempo e ${g.slow === 1 ? 'valeu' : 'valeram'} menos.`}
                  </li>
                )}
              </ul>
              <details className={s.gradeHow}>
                <summary>Como a nota é calculada</summary>
                <p>
                  Cada questão vale até 1 ponto: acerto com certeza vale 1; com dúvida, 0,75; no chute, 0,5. Erro no chute vale 0,2, erro com dúvida 0,1 e erro com certeza 0, porque um
                  engano firme é o que mais derruba na prova. Acima de 2 minutos, a questão perde valor aos poucos, até 70% a partir de 5 minutos. A nota é a média vezes 10 e usa só a
                  primeira resposta de cada questão.
                </p>
              </details>
            </div>
          )}
          <p className="muted">{xp > 0 ? `+${xp} XP por itens revisados no prazo.` : practice ? 'Treino livre não gera XP, mas fortalece o domínio.' : 'Sem XP nesta sessão.'}</p>
          <ul className={s.results}>
            {answers.map((a, i) => {
              const after = progress.concepts[a.conceptId]
              const tier = masteryTier(after)
              return (
                <li key={i} data-ok={a.score >= 0.7}>
                  <Check size={16} aria-hidden="true" />
                  <span className={s.resultName}>{registry.concepts.get(a.conceptId)?.title}</span>
                  {a.confidence && <Badge>{CONFIDENCE_BADGE[a.confidence]}</Badge>}
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
  const revealed = answeredIndex === index
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
          {revealed ? (
            <h1 className={s.concept}>
              <Brain size={22} aria-hidden="true" /> {concept?.title}
            </h1>
          ) : (
            <h1 className="sr-only">Questão de revisão</h1>
          )}
          <div className="row">
            <Badge tone={worthXp ? 'xp' : 'warning'} icon={<Sparkles size={13} aria-hidden="true" />}>
              {worthXp ? 'vencido · vale XP' : practice ? 'treino · sem XP' : 'domínio baixo · sem XP'}
            </Badge>
            {revealed && <Badge>{concept?.officialName}</Badge>}
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
          onSubmit={(evaluation, _hints, _solution, confidence) => {
            const before = progress.concepts[entry.conceptId]?.mastery ?? 0
            // Tentar de novo o mesmo item não gasta outra vaga do limite diário.
            const first = answeredIndex !== index
            const daily = !practice && first
            const seconds = first ? (clock.now().getTime() - itemStartedAt) / 1000 : undefined
            setAnsweredIndex(index)
            const events = submitReview(entry.conceptId, entry.item.id, evaluation, { confidence, daily })
            const xp = events.filter((e) => e.type === 'xp' && e.source === 'review').reduce((acc, e) => acc + (e.type === 'xp' ? e.amount : 0), 0)
            setAnswers((list) => [...list, { conceptId: entry.conceptId, score: evaluation.score, xp, before, confidence, first, seconds }])
            return { xp, events }
          }}
          onContinue={() => {
            if (index + 1 >= entries.length) return finish()
            setIndex(index + 1)
            setItemStartedAt(clock.now().getTime())
          }}
          continueLabel={index + 1 >= entries.length ? 'Ver resultado' : 'Próximo item'}
        />
      </Card>
    </div>
  )
}
