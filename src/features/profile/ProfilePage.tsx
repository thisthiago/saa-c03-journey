import { Download, Lock, Monitor, Moon, RotateCcw, Sun, Upload } from 'lucide-react'
import { useMemo, useRef, useState } from 'react'
import { registry } from '../../content'
import { masteredConceptIds } from '../../engine/achievements'
import { masteryTier, TIER_LABEL } from '../../engine/mastery'
import { exportProgress, importProgress } from '../../engine/persistence'
import { trackPhases } from '../../engine/registry'
import { isMissionPassed, streakDays } from '../../engine/selectors'
import type { ExamDomainId } from '../../engine/types'
import { clock, flushSave, useGame } from '../../store/gameStore'
import { useDocumentTitle, usePlayer } from '../../app/hooks'
import { Badge, Button, Callout, Card, Modal, ProgressBar, ProgressRing } from '../../ui/kit'
import { Glyph } from '../../ui/Glyph'
import s from './profile.module.css'

const CATEGORY = { seguranca: 'Segurança', custos: 'Custos', disponibilidade: 'Disponibilidade', recuperacao: 'Recuperação de desastres', desempenho: 'Desempenho', aprendizagem: 'Aprendizagem', exploracao: 'Exploração' } as const

/** Cobertura por domínio do exame: domínio médio dos conceitos liberados de cada domínio. */
function useDomainCoverage() {
  const progress = useGame((st) => st.progress)
  return useMemo(() => {
    const released = new Set<string>()
    for (const t of registry.tracks.values()) for (const p of trackPhases(t)) if (p.availability === 'available') p.concepts.forEach((c) => released.add(c))
    return registry.examDomains.map((d) => {
      const ids = [...released].filter((id) => registry.concepts.get(id)?.exam.domains.includes(d.id as ExamDomainId))
      const avg = ids.length === 0 ? 0 : ids.reduce((sum, id) => sum + (progress.concepts[id]?.mastery ?? 0), 0) / ids.length
      return { domain: d, count: ids.length, coverage: avg }
    })
  }, [progress])
}

export function ProfilePage() {
  useDocumentTitle('Dossiê')
  const progress = useGame((st) => st.progress)
  const setSettings = useGame((st) => st.setSettings)
  const replaceProgress = useGame((st) => st.replaceProgress)
  const resetProgress = useGame((st) => st.resetProgress)
  const player = usePlayer()
  const coverage = useDomainCoverage()
  const [confirmReset, setConfirmReset] = useState(false)
  const [message, setMessage] = useState<{ kind: 'success' | 'danger'; text: string } | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const achievements = [...registry.achievements.values()]
  const unlocked = achievements.filter((a) => progress.achievements[a.id]).length
  const missionsPassed = [...registry.missions.values()].filter((m) => isMissionPassed(progress, m.mission)).length
  const studied = Object.entries(progress.concepts).filter(([, c]) => c.evidence > 0)
  const recentXp = [...progress.ledger].reverse().slice(0, 8)

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
    <div className="page">
      <p className="eyebrow">Dossiê</p>
      <h1>Seu progresso</h1>

      <div className={s.top}>
        <Card className={s.player}>
          <ProgressRing value={player.ratio} size={96} stroke={8} color="var(--xp)" label={`Nível ${player.level}`}>
            {player.level}
          </ProgressRing>
          <div>
            <h2 className={s.title}>{player.title}</h2>
            <p className={s.xp}>{player.xp.toLocaleString('pt-BR')} XP</p>
            <ProgressBar value={player.ratio} color="var(--xp)" label="Progresso até o próximo nível" />
            <p className={s.small}>
              {(player.next - player.xp).toLocaleString('pt-BR')} XP até o nível {player.level + 1}
            </p>
          </div>
        </Card>
        <Card>
          <ul className={s.stats}>
            <li>
              <b>{missionsPassed}</b> missões aprovadas
            </li>
            <li>
              <b>{masteredConceptIds(progress).length}</b> conceitos dominados
            </li>
            <li>
              <b>{studied.length}</b> conceitos estudados
            </li>
            <li>
              <b>{progress.stats.perfectFirstTries}</b> acertos perfeitos de primeira
            </li>
            <li>
              <b>{progress.stats.comebacks}</b> recuperações após erro
            </li>
            <li>
              <b>{progress.reviews.sessions}</b> sessões de revisão
            </li>
            <li>
              <b>{streakDays(progress.stats.activeDays, clock.now())}</b> dias seguidos
            </li>
          </ul>
        </Card>
      </div>

      <section className={s.section} aria-labelledby="domains-title">
        <h2 id="domains-title">Domínios do exame SAA-C03</h2>
        <p className="muted">Domínio médio dos conceitos já liberados em cada domínio do exame. Indica onde focar — não prevê o resultado da prova.</p>
        <div className={s.domains}>
          {coverage.map(({ domain, count, coverage: c }) => (
            <Card key={domain.id} className={s.domain} as="article">
              <div className={s.domainHead}>
                <strong>{domain.title}</strong>
                <Badge>{Math.round(domain.weight * 100)}% do exame</Badge>
              </div>
              <span className={s.small}>{domain.officialName}</span>
              <ProgressBar value={c} color="var(--mastery)" label={`Domínio em ${domain.title}`} />
              <span className={s.small}>
                {Math.round(c * 100)}% · {count} conceito(s) liberado(s)
              </span>
            </Card>
          ))}
        </div>
      </section>

      <section className={s.section} aria-labelledby="ach-title">
        <h2 id="ach-title">
          Conquistas ({unlocked}/{achievements.length})
        </h2>
        <ul className={s.achGrid}>
          {achievements.map((a) => {
            const got = progress.achievements[a.id]
            return (
              <li key={a.id} className={s.ach} data-got={Boolean(got)}>
                <span className={s.achIcon}>{got ? <Glyph name={a.glyph} size={22} /> : <Lock size={20} aria-hidden="true" />}</span>
                <div>
                  <strong>{a.title}</strong>
                  <span className={s.small}>{a.description}</span>
                  <span className={s.achMeta}>
                    {CATEGORY[a.category]}
                    {a.xp > 0 && ` · +${a.xp} XP`}
                    {got && ` · ${new Date(got.unlockedAt).toLocaleDateString('pt-BR')}`}
                  </span>
                </div>
              </li>
            )
          })}
        </ul>
      </section>

      {studied.length > 0 && (
        <section className={s.section} aria-labelledby="mastery-title">
          <h2 id="mastery-title">Domínio por conceito</h2>
          <ul className={s.masteryList}>
            {studied
              .sort((a, b) => a[1].mastery - b[1].mastery)
              .map(([id, cp]) => {
                const tier = masteryTier(cp)
                return (
                  <li key={id}>
                    <span>{registry.concepts.get(id)?.title ?? id}</span>
                    <ProgressBar value={cp.mastery} color="var(--mastery)" label={`Domínio de ${registry.concepts.get(id)?.title}`} />
                    <Badge tone={tier === 'dominado' ? 'mastery' : tier === 'praticando' ? 'info' : 'warning'}>{TIER_LABEL[tier]}</Badge>
                  </li>
                )
              })}
          </ul>
        </section>
      )}

      {recentXp.length > 0 && (
        <section className={s.section} aria-labelledby="xp-title">
          <h2 id="xp-title">XP recente</h2>
          <ul className={s.ledger}>
            {recentXp.map((e, i) => (
              <li key={i}>
                <span className={s.ledgerXp}>+{e.amount}</span>
                <span>{e.source === 'activity' ? registry.activities.get(e.refId)?.activity.title : e.source === 'mission' ? `Missão: ${registry.missions.get(e.refId)?.mission.title}` : e.source === 'achievement' ? `Conquista: ${registry.achievements.get(e.refId)?.title}` : `Revisão: ${registry.concepts.get(e.refId)?.title}`}</span>
                <span className={s.small}>{new Date(e.at).toLocaleString('pt-BR')}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

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
      </section>

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
    </div>
  )
}
