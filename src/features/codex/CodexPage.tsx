import { Lock, Search, SearchX } from 'lucide-react'
import { useMemo, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router'
import { registry } from '../../content'
import { masteryTier, TIER_LABEL } from '../../engine/mastery'
import { trackPhases } from '../../engine/registry'
import { nextMission } from '../../engine/selectors'
import { useGame } from '../../store/gameStore'
import { useDocumentTitle } from '../../app/hooks'
import { Badge, Button, ButtonLink, Card } from '../../ui/kit'
import s from './codex.module.css'
import { phaseLabel, plural } from '../../app/format'

const normalize = (t: string) => t.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase()

interface PhaseGroup {
  id: string
  label: string
  title: string
  concepts: string[]
}

interface TrackGroup {
  id: string
  title: string
  phases: PhaseGroup[]
  concepts: string[]
}

// Cada conceito aparece uma vez, na primeira fase que o ensina (conceitos são compartilhados entre trilhas).
function buildGroups(): TrackGroup[] {
  const seen = new Set<string>()
  const out: TrackGroup[] = []
  for (const track of registry.tracks.values()) {
    const phases: PhaseGroup[] = []
    for (const p of trackPhases(track)) {
      const fresh = p.concepts.filter((c) => !seen.has(c))
      fresh.forEach((c) => seen.add(c))
      if (fresh.length > 0) phases.push({ id: p.id, label: phaseLabel(p), title: p.title, concepts: fresh })
    }
    if (phases.length > 0) out.push({ id: track.id, title: track.title, phases, concepts: phases.flatMap((p) => p.concepts) })
  }
  return out
}

/** Texto pesquisável: nome em português, nome oficial, resumo e nome/sigla dos serviços ligados. */
function buildIndex(groups: TrackGroup[]): Map<string, string> {
  const index = new Map<string, string>()
  for (const id of groups.flatMap((g) => g.concepts)) {
    const c = registry.concepts.get(id)!
    const services = c.serviceIds.map((sid) => registry.services.get(sid)).flatMap((sv) => (sv ? [sv.shortName, sv.officialName] : []))
    index.set(id, normalize([c.title, c.officialName, c.summary, ...services].join(' ')))
  }
  return index
}

/**
 * Busca, trilha e "mostrar não descobertos" ficam na URL: voltar de um conceito restaura a lista.
 * Os campos leem um estado local, iniciado pela URL, porque a navegação do router roda numa
 * transição e um campo controlado direto pela URL voltaria ao valor anterior a cada tecla.
 */
function useCodexFilter(groups: TrackGroup[]) {
  const [params, setParams] = useSearchParams()
  const [values, setValues] = useState(() => new URLSearchParams(params))
  const query = values.get('busca') ?? ''
  const track = groups.find((g) => g.id === values.get('trilha'))
  const showLocked = values.get('ocultos') === '1'
  const update = (next: URLSearchParams) => {
    setValues(next)
    setParams(next, { replace: true })
  }
  const set = (key: string, value: string) => {
    const next = new URLSearchParams(values)
    if (value) next.set(key, value)
    else next.delete(key)
    update(next)
  }
  return { query, track, showLocked, search: values.toString(), set, clear: () => update(new URLSearchParams()) }
}

export function CodexPage() {
  useDocumentTitle('Codex')
  const progress = useGame((st) => st.progress)
  const groups = useMemo(() => buildGroups(), [])
  const index = useMemo(() => buildIndex(groups), [groups])
  const { query, track, showLocked, search, set, clear } = useCodexFilter(groups)
  const inputRef = useRef<HTMLInputElement>(null)

  const isDiscovered = (id: string) => Boolean(progress.discovered[id])
  const countDiscovered = (ids: string[]) => ids.filter(isDiscovered).length
  const total = groups.reduce((n, g) => n + g.concepts.length, 0)
  const discovered = groups.reduce((n, g) => n + countDiscovered(g.concepts), 0)
  const q = normalize(query.trim())
  const linkState = { codex: search ? `?${search}` : '' }

  const visible = (track ? [track] : groups)
    .map((g) => ({
      ...g,
      phases: g.phases
        .map((p) => ({
          ...p,
          shown: p.concepts.filter((id) => isDiscovered(id) && (!q || index.get(id)!.includes(q))),
          // A busca procura só entre os descobertos, para não revelar conceitos antes da missão.
          locked: showLocked && !q ? p.concepts.length - countDiscovered(p.concepts) : 0,
        }))
        .filter((p) => p.shown.length > 0 || p.locked > 0),
    }))
    .filter((g) => g.phases.length > 0)
  const shownCount = visible.reduce((n, g) => n + g.phases.reduce((m, p) => m + p.shown.length, 0), 0)
  const filtered = Boolean(query || track || showLocked)

  const clearQuery = () => {
    set('busca', '')
    inputRef.current?.focus()
  }

  return (
    <div className="page">
      <p className="eyebrow">Codex</p>
      <h1>Conceitos descobertos</h1>
      <p className="muted" style={{ maxWidth: 700 }}>
        Cada conceito entra no Codex quando aparece numa missão. Aqui ficam o nome oficial, a explicação, quando usar e quando não usar, erros comuns, relevância para a certificação e as fontes oficiais.
      </p>

      <form
        role="search"
        aria-label="Buscar no Codex"
        className={s.toolbar}
        onSubmit={(e) => {
          e.preventDefault()
          inputRef.current?.blur()
        }}
      >
        <label className={s.search}>
          <Search size={18} aria-hidden="true" />
          <span className="sr-only">Buscar conceito</span>
          <input
            ref={inputRef}
            type="search"
            placeholder="Buscar por nome, sigla ou serviço…"
            value={query}
            onChange={(e) => set('busca', e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Escape' && query) {
                e.preventDefault()
                set('busca', '')
              }
            }}
          />
        </label>
        <label className={s.field}>
          Trilha
          <select value={track?.id ?? ''} onChange={(e) => set('trilha', e.target.value)}>
            <option value="">Todas as trilhas</option>
            {groups.map((g) => (
              <option key={g.id} value={g.id}>
                {g.title} ({countDiscovered(g.concepts)} de {g.concepts.length})
              </option>
            ))}
          </select>
        </label>
        <label className={s.check}>
          <input type="checkbox" checked={showLocked} onChange={(e) => set('ocultos', e.target.checked ? '1' : '')} />
          Mostrar os não descobertos
        </label>
      </form>

      <div className={s.status}>
        <p aria-live="polite">{query.trim() ? `${plural(shownCount, 'conceito encontrado', 'conceitos encontrados')}.` : `${plural(shownCount, 'conceito descoberto', 'conceitos descobertos')} na lista.`}</p>
        {filtered && (
          <Button variant="ghost" size="small" onClick={clear}>
            Limpar filtros
          </Button>
        )}
        <Badge tone="accent">
          {discovered} de {total} descobertos
        </Badge>
      </div>

      {visible.length === 0 && (
        <Card className={s.empty}>
          {query.trim() ? (
            <>
              <SearchX size={28} aria-hidden="true" />
              <h2>Nenhum conceito descoberto corresponde a “{query.trim()}”</h2>
              <p className="muted">
                A busca procura no nome em português, no nome oficial, na sigla do serviço e no resumo dos conceitos que você já descobriu{track ? `, só na trilha ${track.title}` : ''}. Confira a grafia ou tente um termo mais curto.
              </p>
              <div className="row">
                <Button onClick={clearQuery}>Limpar busca</Button>
                {track && (
                  <Button variant="secondary" onClick={() => set('trilha', '')}>
                    Buscar em todas as trilhas
                  </Button>
                )}
              </div>
            </>
          ) : track ? (
            <>
              <Lock size={28} aria-hidden="true" />
              <h2>Você ainda não descobriu conceitos da trilha {track.title}</h2>
              <p className="muted">Os conceitos desta trilha entram no Codex quando aparecem nas missões dela.</p>
              <div className="row">
                <ButtonLink to={`/trilha/${track.id}`}>Abrir o mapa da trilha</ButtonLink>
                <Button variant="secondary" onClick={() => set('ocultos', '1')}>
                  Mostrar os não descobertos
                </Button>
              </div>
            </>
          ) : (
            <NothingDiscovered onShowLocked={() => set('ocultos', '1')} />
          )}
        </Card>
      )}

      {visible.map((g) => (
        <section key={g.id} className={s.track} aria-labelledby={`t-${g.id}`}>
          <div className={s.trackHead}>
            <h2 id={`t-${g.id}`} className={s.trackTitle}>
              {g.title}
            </h2>
            <span className={s.trackCount}>
              {countDiscovered(g.concepts)} de {g.concepts.length} descobertos
            </span>
          </div>
          {g.phases.map((p) => (
            <section key={p.id} className={s.group} aria-labelledby={`g-${p.id}`}>
              <h3 id={`g-${p.id}`} className={s.groupTitle}>
                {p.label} · {p.title}
              </h3>
              {p.shown.length > 0 && (
                <ul className={s.grid}>
                  {p.shown.map((id) => {
                    const c = registry.concepts.get(id)!
                    const tier = masteryTier(progress.concepts[id])
                    return (
                      <li key={id}>
                        <Link to={`/codex/${id}`} state={linkState} className={s.card} data-tier={tier}>
                          <span className={s.official}>{c.officialName}</span>
                          <strong className={s.title}>{c.title}</strong>
                          <Badge tone={tier === 'dominado' ? 'mastery' : tier === 'praticando' ? 'info' : tier === 'aprendendo' ? 'warning' : 'neutral'}>{TIER_LABEL[tier]}</Badge>
                        </Link>
                      </li>
                    )
                  })}
                </ul>
              )}
              {p.locked > 0 && (
                <p className={s.locked}>
                  <Lock size={16} aria-hidden="true" />
                  <span>
                    {plural(p.locked, 'conceito ainda não descoberto', 'conceitos ainda não descobertos')}. {p.locked === 1 ? 'Ele aparece' : 'Eles aparecem'} nas missões desta fase.{' '}
                    <Link to={`/fase/${p.id}`}>
                      Ver a fase<span className="sr-only">: {p.label} de {g.title}</span>
                    </Link>
                  </span>
                </p>
              )}
            </section>
          ))}
        </section>
      ))}
    </div>
  )
}

function NothingDiscovered({ onShowLocked }: { onShowLocked: () => void }) {
  const progress = useGame((st) => st.progress)
  const next = nextMission(progress, registry)
  const mission = next ? registry.missions.get(next.missionId)?.mission : undefined
  return (
    <>
      <Lock size={28} aria-hidden="true" />
      <h2>Nenhum conceito descoberto ainda</h2>
      <p className="muted">Os conceitos entram no Codex quando aparecem numa missão, na etapa de conceitos-chave. Comece uma missão para descobrir os primeiros.</p>
      <div className="row">
        {mission ? <ButtonLink to={`/missao/${mission.id}`}>Começar a missão: {mission.title}</ButtonLink> : <ButtonLink to="/mapa">Ver as trilhas</ButtonLink>}
        <Button variant="secondary" onClick={onShowLocked}>
          Mostrar os não descobertos
        </Button>
      </div>
    </>
  )
}
