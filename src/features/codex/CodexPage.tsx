import { Lock, Search } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link } from 'react-router'
import { registry } from '../../content'
import { masteryTier, TIER_LABEL } from '../../engine/mastery'
import { trackPhases } from '../../engine/registry'
import { useGame } from '../../store/gameStore'
import { useDocumentTitle } from '../../app/hooks'
import { Badge } from '../../ui/kit'
import s from './codex.module.css'
import { phaseRef } from '../../app/format'

const normalize = (t: string) => t.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase()

export function CodexPage() {
  useDocumentTitle('Codex')
  const progress = useGame((st) => st.progress)
  const [query, setQuery] = useState('')
  const groups = useMemo(() => {
    // Cada conceito aparece uma vez, no grupo da primeira fase que o ensina (conceitos são compartilhados entre trilhas).
    const out: { phaseId: string; title: string; order: number; concepts: string[] }[] = []
    const seen = new Set<string>()
    for (const track of registry.tracks.values()) {
      for (const p of trackPhases(track)) {
        const fresh = p.concepts.filter((c) => !seen.has(c))
        fresh.forEach((c) => seen.add(c))
        if (fresh.length > 0) out.push({ phaseId: p.id, title: p.title, order: p.order, concepts: fresh })
      }
    }
    return out
  }, [])
  const total = groups.reduce((n, g) => n + g.concepts.length, 0)
  const discovered = groups.reduce((n, g) => n + g.concepts.filter((c) => progress.discovered[c]).length, 0)
  const q = normalize(query.trim())

  return (
    <div className="page">
      <p className="eyebrow">Codex</p>
      <h1>Conceitos descobertos</h1>
      <p className="muted" style={{ maxWidth: 700 }}>
        Cada conceito entra no Codex quando aparece numa missão. Aqui ficam o nome oficial, a explicação, quando usar e quando não usar, erros comuns, relevância para a certificação e as fontes oficiais.
      </p>
      <div className={s.toolbar}>
        <label className={s.search}>
          <Search size={18} aria-hidden="true" />
          <span className="sr-only">Buscar conceito</span>
          <input type="search" placeholder="Buscar por nome em português ou inglês…" value={query} onChange={(e) => setQuery(e.target.value)} />
        </label>
        <Badge tone="accent">
          {discovered} de {total} descobertos
        </Badge>
      </div>
      {groups.map((g) => {
        const visible = g.concepts.filter((id) => {
          if (!q) return true
          const c = registry.concepts.get(id)!
          return progress.discovered[id] && normalize(`${c.title} ${c.officialName} ${c.summary}`).includes(q)
        })
        if (visible.length === 0) return null
        return (
          <section key={g.phaseId} className={s.group} aria-labelledby={`g-${g.phaseId}`}>
            <h2 id={`g-${g.phaseId}`} className={s.groupTitle}>
              {phaseRef({ id: g.phaseId, order: g.order })} · {g.title}
            </h2>
            <ul className={s.grid}>
              {visible.map((id) => {
                const c = registry.concepts.get(id)!
                const tier = masteryTier(progress.concepts[id])
                return (
                  <li key={id}>
                    {progress.discovered[id] ? (
                      <Link to={`/codex/${id}`} className={s.card} data-tier={tier}>
                        <span className={s.official}>{c.officialName}</span>
                        <strong className={s.title}>{c.title}</strong>
                        <Badge tone={tier === 'dominado' ? 'mastery' : tier === 'praticando' ? 'info' : tier === 'aprendendo' ? 'warning' : 'neutral'}>{TIER_LABEL[tier]}</Badge>
                      </Link>
                    ) : (
                      <div className={s.card} data-tier="hidden">
                        <Lock size={18} aria-hidden="true" />
                        <strong className={s.title}>Não descoberto</strong>
                        <span className={s.official}>Aparece em: {phaseRef({ id: g.phaseId, order: g.order })}</span>
                      </div>
                    )}
                  </li>
                )
              })}
            </ul>
          </section>
        )
      })}
    </div>
  )
}
