/** Notificações de eventos de jogo (conquistas, missões, fases, domínio) e celebração de nível. */
import { Brain, Flag, Sparkles, Trophy, X } from 'lucide-react'
import { useEffect, useMemo } from 'react'
import { useGame, type QueuedEvent } from '../store/gameStore'
import { Button, Modal } from '../ui/kit'
import s from './layout.module.css'

const AUTO_DISMISS_MS = 5200

function Toast({ item }: { item: QueuedEvent }) {
  const dismiss = useGame((st) => st.dismissEvent)
  useEffect(() => {
    const t = setTimeout(() => dismiss(item.id), AUTO_DISMISS_MS)
    return () => clearTimeout(t)
  }, [item, dismiss])
  const e = item.event
  let kind = 'achievement'
  let icon = <Sparkles size={20} />
  let title = ''
  let body = ''
  switch (e.type) {
    case 'achievement':
      kind = 'achievement'
      icon = <Trophy size={20} />
      title = 'Conquista desbloqueada'
      body = e.title
      break
    case 'mission-passed':
      kind = 'mission'
      icon = <Flag size={20} />
      title = 'Missão aprovada'
      body = e.title
      break
    case 'phase-completed':
      kind = 'phase'
      icon = <Trophy size={20} />
      title = 'Fase concluída'
      body = e.title
      break
    case 'concept-mastered':
      kind = 'mastered'
      icon = <Brain size={20} />
      title = 'Conceito dominado'
      body = e.title
      break
    default:
      return null
  }
  return (
    <div className={s.toast} data-kind={kind} role="status">
      <span className={s.toastIcon} aria-hidden="true">
        {icon}
      </span>
      <div className={s.toastText}>
        <strong>{title}</strong>
        {body}
      </div>
      <button type="button" className={s.toastClose} onClick={() => dismiss(item.id)} aria-label="Fechar notificação">
        <X size={16} />
      </button>
    </div>
  )
}

const CONFETTI_COLORS = ['var(--accent)', 'var(--xp)', 'var(--mastery)', 'var(--success)', 'var(--info)']

export function Celebrations() {
  const queue = useGame((st) => st.queue)
  const dismiss = useGame((st) => st.dismissEvent)
  const levelUp = queue.find((q) => q.event.type === 'level-up')
  const toasts = queue.filter((q) => q.event.type !== 'level-up').slice(0, 3)
  const confetti = useMemo(
    () => Array.from({ length: 28 }, (_, i) => ({ left: `${(i * 37) % 100}%`, dx: `${((i * 53) % 120) - 60}px`, delay: `${(i % 7) * 0.08}s`, color: CONFETTI_COLORS[i % CONFETTI_COLORS.length] })),
    [],
  )
  return (
    <>
      <div className={s.toasts} aria-live="polite">
        {toasts.map((t) => (
          <Toast key={t.id} item={t} />
        ))}
      </div>
      <Modal
        open={Boolean(levelUp)}
        onClose={() => levelUp && dismiss(levelUp.id)}
        labelledBy="level-up-title"
        actions={
          <Button onClick={() => levelUp && dismiss(levelUp.id)} autoFocus>
            Continuar
          </Button>
        }
      >
        {levelUp?.event.type === 'level-up' && (
          <div className={s.levelUp}>
            <div className={s.confetti} aria-hidden="true">
              {confetti.map((c, i) => (
                <i key={i} style={{ left: c.left, background: c.color, animationDelay: c.delay, ['--dx' as string]: c.dx }} />
              ))}
            </div>
            <p className="eyebrow">Subiu de nível</p>
            <div className={s.levelBadge}>{levelUp.event.level}</div>
            <h2 id="level-up-title">{levelUp.event.title}</h2>
            <p className="muted">Seu XP vem de desafios resolvidos e revisões feitas no prazo — não de cliques.</p>
          </div>
        )}
      </Modal>
    </>
  )
}
