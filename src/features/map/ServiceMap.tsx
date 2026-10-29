/**
 * Aba "Mapa de serviços" da página Trilhas: os serviços do catálogo como um
 * grafo agrupado por território, com busca, filtros, legenda, lista
 * equivalente e painel de detalhes. O estado de cada serviço vem do mesmo
 * progresso do resto do jogo; esta tela só lê.
 */
import { Check, LayoutList, Lock, Network, Search, SearchX } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router'
import { registry } from '../../content'
import { allPhaseStatuses, buildServiceGraph, serviceProgress, type ServiceProgress, type ServiceStatus } from '../../engine/service-graph'
import { recommendedTrackOrder } from '../../engine/track-order'
import { useGame } from '../../store/gameStore'
import { plural } from '../../app/format'
import { useMediaQuery } from '../../app/hooks'
import { Badge, Button, Card } from '../../ui/kit'
import { Glyph } from '../../ui/Glyph'
import { ServiceGraph, type CenterRequest } from './ServiceGraph'
import { ServicePanel } from './ServicePanel'
import { layoutServices, matchesFilter, radiusFor, searchServices, STATUS_FILTERS, type ServiceFilter, type StatusFilter } from './service-map'
import { SERVICE_STATUS } from './status'
import s from './service-map.module.css'

// Calculados uma vez, quando a aba é carregada: dependem só do conteúdo.
const GRAPH = buildServiceGraph(registry)
const LAYOUT = layoutServices(GRAPH, registry.territories)
const ORDER = recommendedTrackOrder(registry).map((st) => st.track.id)
const SEARCH_ITEMS = GRAPH.nodes.map((n) => {
  const sv = registry.services.get(n.id)!
  return { id: n.id, shortName: sv.shortName, officialName: sv.officialName, questions: n.questions }
})
/** Territórios na ordem do anel do desenho. */
const TERRITORIES = LAYOUT.ring.map((id) => registry.territories.find((t) => t.id === id)!)

const FILTER_LABEL: Record<StatusFilter, string> = {
  todos: 'Todos',
  desbloqueados: 'Desbloqueados',
  'em-andamento': 'Em andamento',
  concluidos: 'Concluídos',
  bloqueados: 'Bloqueados',
}

/**
 * Seleção, filtros e modo lista ficam na URL, como no Codex: voltar de uma
 * missão restaura o mapa. Os controles leem uma cópia local, porque a
 * navegação do router roda numa transição.
 */
function useMapParams() {
  const [params, setParams] = useSearchParams()
  const [values, setValues] = useState(() => new URLSearchParams(params))
  const update = (change: (next: URLSearchParams) => void) => {
    const next = new URLSearchParams(values)
    change(next)
    setValues(next)
    setParams(next, { replace: true })
  }
  const statusParam = values.get('situacao') as StatusFilter | null
  const filter: ServiceFilter = {
    status: statusParam && STATUS_FILTERS.includes(statusParam) ? statusParam : 'todos',
    territories: (values.get('territorio') ?? '').split(',').filter((t) => TERRITORIES.some((x) => x.id === t)),
  }
  const selected = values.get('servico') ?? undefined
  return {
    filter,
    selectedId: selected && GRAPH.byId.has(selected) ? selected : undefined,
    list: values.get('lista') === '1',
    set: (key: string, value: string) =>
      update((n) => {
        if (value) n.set(key, value)
        else n.delete(key)
      }),
    clearFilters: () =>
      update((n) => {
        n.delete('situacao')
        n.delete('territorio')
      }),
  }
}

function StateMark({ status }: { status: ServiceStatus }) {
  if (status === 'locked') return <Lock size={14} aria-hidden="true" />
  if (status === 'completed') return <Check size={14} aria-hidden="true" />
  return null
}

/** Busca com lista de resultados (padrão combobox). */
function ServiceSearch({ statuses, onPick }: { statuses: Map<string, ServiceProgress>; onPick: (id: string) => void }) {
  const [query, setQuery] = useState('')
  const [active, setActive] = useState(0)
  const results = useMemo(() => searchServices(SEARCH_ITEMS, query), [query])
  const open = query.trim().length > 0
  const pick = (id: string) => {
    onPick(id)
    setQuery('')
  }
  return (
    <div className={s.search}>
      <label className={s.searchField}>
        <Search size={18} aria-hidden="true" />
        <span className="sr-only">Buscar serviço</span>
        <input
          type="search"
          role="combobox"
          aria-expanded={open}
          aria-controls="service-search-results"
          aria-autocomplete="list"
          aria-activedescendant={open && results[active] ? `service-option-${active}` : undefined}
          placeholder="Buscar serviço, como S3 ou Lambda…"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            setActive(0)
          }}
          onKeyDown={(e) => {
            if (e.key === 'ArrowDown' && results.length) {
              e.preventDefault()
              setActive((a) => (a + 1) % results.length)
            } else if (e.key === 'ArrowUp' && results.length) {
              e.preventDefault()
              setActive((a) => (a - 1 + results.length) % results.length)
            } else if (e.key === 'Enter' && results[active]) {
              e.preventDefault()
              pick(results[active])
            } else if (e.key === 'Escape' && query) {
              e.preventDefault()
              setQuery('')
            }
          }}
        />
      </label>
      {open && (
        <ul id="service-search-results" role="listbox" aria-label="Serviços encontrados" className={s.results}>
          {results.length === 0 && (
            <li className={s.noResult} role="presentation">
              <SearchX size={16} aria-hidden="true" /> Nenhum serviço com esse nome. Tente a sigla, como EC2, ou parte do nome.
            </li>
          )}
          {results.map((id, i) => {
            const st = statuses.get(id)?.status ?? 'locked'
            return (
              <li
                key={id}
                id={`service-option-${i}`}
                role="option"
                aria-selected={i === active}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => pick(id)}
                onMouseEnter={() => setActive(i)}
              >
                <span className={s.swatch} data-locked={st === 'locked' || undefined} style={{ ['--c' as string]: `var(--territory-${GRAPH.byId.get(id)!.territory})` }} aria-hidden="true" />
                <span className={s.resultName}>{registry.services.get(id)!.shortName}</span>
                <span className={s.small}>
                  <StateMark status={st} /> {SERVICE_STATUS[st].label}
                </span>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}

function Legend() {
  // No celular a legenda começa fechada, para o mapa e o painel ficarem perto.
  const wide = useMediaQuery('(min-width: 640px)')
  const max = GRAPH.maxQuestions
  const samples = [0, 10, max].map((q) => ({ q, r: radiusFor(q, max) }))
  return (
    <details key={String(wide)} className={s.legend} open={wide}>
      <summary>Legenda</summary>
      <div className={s.legendGrid}>
        <div>
          <h3>Estado</h3>
          <ul>
            <li>
              <svg viewBox="-12 -12 24 24" aria-hidden="true">
                <circle r="8" className={s.legendDot} />
              </svg>
              Na cor do território: desbloqueado, pronto para estudar.
            </li>
            <li>
              <svg viewBox="-12 -12 24 24" aria-hidden="true">
                <circle r="10.5" className={s.legendTrack} />
                <circle r="10.5" className={s.legendArc} pathLength={100} strokeDasharray="40 100" transform="rotate(-90)" />
                <circle r="7" className={s.legendDot} />
              </svg>
              Com arco: em andamento. O arco mostra as missões aprovadas.
            </li>
            <li>
              <svg viewBox="-12 -12 24 24" aria-hidden="true">
                <circle r="10.5" className={s.legendRing} />
                <circle r="7" className={s.legendDot} />
              </svg>
              Com anel e selo: concluído.
            </li>
            <li>
              <svg viewBox="-12 -12 24 24" aria-hidden="true">
                <circle r="8" className={s.legendLocked} />
              </svg>
              Cinza com cadeado: bloqueado. O painel diz o que concluir antes.
            </li>
          </ul>
        </div>
        <div>
          <h3>Tamanho e linhas</h3>
          <p className={s.sizes}>
            {samples.map(({ q, r }) => (
              <span key={q}>
                <svg viewBox={`${-r - 1} ${-r - 1} ${2 * r + 2} ${2 * r + 2}`} width={2 * r + 2} height={2 * r + 2} aria-hidden="true">
                  <circle r={r} className={s.legendSize} />
                </svg>
                {plural(q, 'questão', 'questões')}
              </span>
            ))}
          </p>
          <p className={s.small}>O tamanho indica quantas questões do banco citam o serviço.</p>
          <p className={s.small}>Uma linha liga dois serviços que aparecem juntos em pelo menos um conceito. Quanto mais conceitos em comum, mais forte a linha.</p>
        </div>
      </div>
    </details>
  )
}

/** Alternativa ao desenho: os mesmos serviços em lista, agrupados por território. */
function ServiceList({ statuses, visible, selectedId, onSelect }: { statuses: Map<string, ServiceProgress>; visible: Set<string>; selectedId?: string; onSelect: (id: string) => void }) {
  const groups = TERRITORIES.map((t) => ({
    t,
    ids: GRAPH.nodes
      .filter((n) => n.territory === t.id && visible.has(n.id))
      .sort((a, b) => b.questions - a.questions)
      .map((n) => n.id),
  })).filter((g) => g.ids.length > 0)
  if (groups.length === 0) return <p className="muted">Nenhum serviço passa nos filtros escolhidos.</p>
  return (
    <div className={s.list}>
      {groups.map(({ t, ids }) => (
        <section key={t.id} aria-labelledby={`list-${t.id}`}>
          <h3 id={`list-${t.id}`} className={s.listTitle}>
            <span className={s.swatch} style={{ ['--c' as string]: `var(--territory-${t.id})` }} aria-hidden="true" />
            <Glyph name={t.glyph} size={18} />
            {t.title} <span className={s.small}>({ids.length})</span>
          </h3>
          <ul>
            {ids.map((id) => {
              const p = statuses.get(id)!
              const n = GRAPH.byId.get(id)!
              return (
                <li key={id}>
                  <button type="button" className={s.listItem} aria-pressed={id === selectedId} data-status={p.status} onClick={() => onSelect(id)}>
                    <span className={s.resultName}>{registry.services.get(id)!.shortName}</span>
                    <Badge tone={SERVICE_STATUS[p.status].tone} icon={<StateMark status={p.status} />}>
                      {SERVICE_STATUS[p.status].label}
                    </Badge>
                    <span className={s.small}>
                      {plural(n.questions, 'questão', 'questões')} · {p.phases.completed} de {p.phases.total} fases concluídas
                    </span>
                  </button>
                </li>
              )
            })}
          </ul>
        </section>
      ))}
    </div>
  )
}

export function ServiceMap() {
  const progress = useGame((st) => st.progress)
  const { filter, selectedId, list, set, clearFilters } = useMapParams()
  const [center, setCenter] = useState<CenterRequest>()
  const panelRef = useRef<HTMLDivElement>(null)
  const [userPicked, setUserPicked] = useState(0)

  const statuses = useMemo(() => {
    const phases = allPhaseStatuses(progress, registry)
    return new Map(GRAPH.nodes.map((n) => [n.id, serviceProgress(progress, registry, n, phases, ORDER)]))
  }, [progress])
  const visible = useMemo(() => new Set(GRAPH.nodes.filter((n) => matchesFilter(statuses.get(n.id)!.status, n.territory, filter)).map((n) => n.id)), [statuses, filter])
  const statusCount = (f: StatusFilter) => GRAPH.nodes.filter((n) => matchesFilter(statuses.get(n.id)!.status, n.territory, { ...filter, status: f })).length
  const territoryCount = (t: string) => GRAPH.nodes.filter((n) => n.territory === t && matchesFilter(statuses.get(n.id)!.status, n.territory, { ...filter, territories: [] })).length
  const filtered = filter.status !== 'todos' || filter.territories.length > 0

  // No celular e no tablet o painel fica abaixo do mapa: leva a pessoa até ele.
  useEffect(() => {
    if (userPicked && selectedId && window.matchMedia?.('(max-width: 1099px)').matches) panelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [userPicked, selectedId])

  const select = (id: string | undefined) => {
    set('servico', id ?? '')
    if (id) setUserPicked((n) => n + 1)
  }
  const focusOn = (id: string) => {
    select(id)
    setCenter((c) => ({ id, seq: (c?.seq ?? 0) + 1 }))
  }
  const toggleTerritory = (t: string) => {
    const next = filter.territories.includes(t) ? filter.territories.filter((x) => x !== t) : [...filter.territories, t]
    set('territorio', next.join(','))
  }
  const counts = { unlocked: 0, completed: 0 }
  for (const p of statuses.values()) {
    if (p.status !== 'locked') counts.unlocked++
    if (p.status === 'completed') counts.completed++
  }

  return (
    <div className={s.wrap}>
      <div className={s.toolbar}>
        <ServiceSearch statuses={statuses} onPick={focusOn} />
        <div className={s.viewToggle} role="group" aria-label="Forma de exibição">
          <button type="button" aria-pressed={!list} onClick={() => set('lista', '')}>
            <Network size={16} aria-hidden="true" /> Mapa
          </button>
          <button type="button" aria-pressed={list} onClick={() => set('lista', '1')}>
            <LayoutList size={16} aria-hidden="true" /> Lista
          </button>
        </div>
      </div>

      <div className={`${s.filters} scroll-x`} role="radiogroup" aria-label="Filtrar por situação">
        {STATUS_FILTERS.map((f) => (
          <button key={f} type="button" role="radio" aria-checked={filter.status === f} className={s.filterChip} onClick={() => set('situacao', f === 'todos' ? '' : f)}>
            {FILTER_LABEL[f]} <span className={s.count}>{statusCount(f)}</span>
          </button>
        ))}
      </div>
      <div className={`${s.filters} scroll-x`} role="group" aria-label="Filtrar por território">
        {TERRITORIES.map((t) => (
          <button key={t.id} type="button" aria-pressed={filter.territories.includes(t.id)} className={s.territoryChip} style={{ ['--c' as string]: `var(--territory-${t.id})` }} onClick={() => toggleTerritory(t.id)}>
            <span className={s.swatch} aria-hidden="true" />
            {t.title} <span className={s.count}>{territoryCount(t.id)}</span>
          </button>
        ))}
      </div>

      <div className={s.status}>
        <p aria-live="polite">
          Mostrando {visible.size} de {GRAPH.nodes.length} serviços.
          {filtered ? '' : ` ${counts.unlocked} estão desbloqueados e ${counts.completed} concluídos.`}
        </p>
        {filtered && (
          <Button variant="ghost" size="small" onClick={clearFilters}>
            Limpar filtros
          </Button>
        )}
      </div>

      <div className={s.layout}>
        <div className={s.main}>
          {list ? (
            <ServiceList statuses={statuses} visible={visible} selectedId={selectedId} onSelect={select} />
          ) : (
            <ServiceGraph graph={GRAPH} layout={LAYOUT} statuses={statuses} visible={visible} selectedId={selectedId} onSelect={select} center={center} />
          )}
          <Legend />
        </div>
        <div ref={panelRef} className={s.panelWrap}>
          {selectedId ? (
            <ServicePanel key={selectedId} id={selectedId} graph={GRAPH} statuses={statuses} onSelect={focusOn} onClose={() => select(undefined)} />
          ) : (
            <Card className={s.panel}>
              <h2 className={s.introTitle}>Explore os serviços</h2>
              <p className="muted">
                Cada círculo é um serviço AWS que as trilhas ensinam, agrupado pelo território. Escolha um serviço no mapa, na busca ou na lista para ver o estado, as questões, os conceitos e as relações dele.
              </p>
              <p className={s.small}>
                {counts.unlocked} de {GRAPH.nodes.length} serviços desbloqueados e {counts.completed} concluídos.
              </p>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
