/**
 * Detalhes de um serviço do mapa. Só lê o progresso: nada aqui muda estado.
 * Conceitos ainda não descobertos aparecem só como contagem, como no Codex,
 * e um serviço bloqueado não ganha link de missão.
 */
import { Check, Lock, Map as MapIcon, Play, RotateCcw, X } from 'lucide-react'
import { Link } from 'react-router'
import { registry } from '../../content'
import { masteryTier } from '../../engine/mastery'
import { otherEnd, type ServiceGraph, type ServiceProgress } from '../../engine/service-graph'
import { missionStatus, unmetRequirements } from '../../engine/selectors'
import type { ExamDomainId } from '../../engine/types'
import { useGame } from '../../store/gameStore'
import { phaseMention, plural } from '../../app/format'
import { Badge, ButtonLink, Callout, Card, IconTile, ProgressBar } from '../../ui/kit'
import { DomainTag } from '../../ui/DomainTag'
import { SERVICE_STATUS } from './status'
import m from './map.module.css'
import s from './service-map.module.css'

const RELATIONS_SHOWN = 8

function StatusIcon({ status }: { status: ServiceProgress['status'] }) {
  if (status === 'locked') return <Lock size={14} aria-hidden="true" />
  if (status === 'completed') return <Check size={14} aria-hidden="true" />
  return null
}

export function ServicePanel({ id, graph, statuses, onSelect, onClose }: { id: string; graph: ServiceGraph; statuses: Map<string, ServiceProgress>; onSelect: (id: string) => void; onClose: () => void }) {
  const progress = useGame((st) => st.progress)
  const sv = registry.services.get(id)
  const node = graph.byId.get(id)
  const p = statuses.get(id)
  if (!sv || !node || !p) return null
  const territory = registry.territories.find((t) => t.id === sv.territory)
  const locked = p.status === 'locked'
  const discovered = node.conceptIds.filter((c) => progress.discovered[c])
  const hidden = node.conceptIds.length - discovered.length
  const next = p.nextMissionId ? registry.missions.get(p.nextMissionId) : undefined
  const unlock = p.unlockPhaseId ? registry.phases.get(p.unlockPhaseId) : undefined
  const missing = unlock ? unmetRequirements(progress, registry, unlock.phase).map((ph) => phaseMention(ph, unlock.track.id)) : []
  const tracks = [...new Map(node.phaseIds.map((pid) => registry.phases.get(pid)!).map((r) => [r.track.id, r.track])).values()].map((t) => ({
    track: t,
    phases: node.phaseIds.filter((pid) => registry.phases.get(pid)!.track.id === t.id).length,
  }))
  const relations = graph.neighbors.get(id) ?? []
  const domains = (Object.entries(node.questionsByDomain) as [ExamDomainId, number][]).filter(([, n]) => n > 0)
  const av = sv.availability

  return (
    <Card className={s.panel} aria-labelledby="service-panel-title">
      <div className={s.panelHead}>
        <IconTile glyph={sv.glyph} color={locked ? 'var(--node-locked)' : `var(--territory-${sv.territory})`} />
        <div className={s.panelTitles}>
          <p className={s.panelTerritory}>
            <span className={s.swatch} style={{ ['--c' as string]: `var(--territory-${sv.territory})` }} aria-hidden="true" />
            {territory?.title}
          </p>
          <h2 id="service-panel-title">{sv.shortName}</h2>
          {sv.officialName !== sv.shortName && <p className={s.official}>{sv.officialName}</p>}
        </div>
        <button type="button" className={s.close} onClick={onClose} aria-label="Fechar os detalhes do serviço">
          <X size={18} aria-hidden="true" />
        </button>
      </div>

      <div className="row">
        <Badge tone={SERVICE_STATUS[p.status].tone} icon={<StatusIcon status={p.status} />}>
          {SERVICE_STATUS[p.status].label}
        </Badge>
      </div>
      <p className="muted">{sv.summary}</p>
      {av.kind !== 'current' && (
        <Callout kind="warning" title={av.kind === 'legacy' ? 'Recurso legado' : av.kind === 'discontinued' ? `Serviço encerrado em ${av.since}` : 'Sem novos clientes'}>
          <p>{av.note}</p>
        </Callout>
      )}

      <h3 className={s.panelSection}>Seu progresso</h3>
      <ProgressBar value={p.missions.ratio} label={`Missões aprovadas que ensinam ${sv.shortName}`} />
      <p className={s.small}>
        {p.missions.passed} de {p.missions.total} missões aprovadas e {p.phases.completed} de {p.phases.total} fases concluídas entre as que ensinam este serviço.
      </p>

      {locked && (
        <Callout kind="warning" title="Ainda bloqueado">
          {unlock && missing.length > 0 ? (
            <p>
              Para liberar, conclua antes {missing.length === 1 ? missing[0] : `${missing.slice(0, -1).join(', ')} e ${missing[missing.length - 1]}`}. Depois disso, {phaseMention(unlock.phase)} passa a ensinar este serviço.
            </p>
          ) : (
            <p>As fases que ensinam este serviço ainda não foram liberadas.</p>
          )}
        </Callout>
      )}
      {p.status === 'completed' && (
        <Callout kind="success" title="Serviço concluído">
          <p>Você concluiu todas as fases que ensinam este serviço. As revisões mantêm os conceitos frescos.</p>
        </Callout>
      )}
      <div className="row" style={{ marginTop: 12 }}>
        {next && (
          <ButtonLink to={`/missao/${next.mission.id}`}>
            <Play size={18} aria-hidden="true" /> {missionStatus(progress, registry, next.mission.id) === 'in-progress' ? 'Continuar' : 'Começar'}: {next.mission.title}
          </ButtonLink>
        )}
        {(next || unlock) && (
          <ButtonLink to={`/trilha/${(next ?? unlock)!.track.id}?fase=${next ? next.phase.id : unlock!.phase.id}`} variant="secondary">
            <MapIcon size={18} aria-hidden="true" /> Ver no mapa da trilha
          </ButtonLink>
        )}
        {p.status === 'completed' && (
          <ButtonLink to="/revisao" variant="secondary">
            <RotateCcw size={18} aria-hidden="true" /> Revisar conceitos
          </ButtonLink>
        )}
      </div>

      <h3 className={s.panelSection}>Questões no banco</h3>
      <p className={s.small}>
        {node.questions === 0
          ? 'Nenhuma questão do banco cita este serviço por enquanto.'
          : `${plural(node.questions, 'questão do banco cita', 'questões do banco citam')} este serviço. Em ${node.mainQuestions.toLocaleString('pt-BR')}, ele é o assunto principal.`}
      </p>
      {domains.length > 0 && (
        <ul className={s.domains} aria-label="Questões por domínio do exame">
          {domains.map(([d, n]) => (
            <li key={d}>
              <DomainTag id={d} /> <span className={s.small}>{n}</span>
            </li>
          ))}
        </ul>
      )}

      <h3 className={s.panelSection}>Conceitos ({node.conceptIds.length})</h3>
      {discovered.length > 0 && (
        <div className={m.conceptChips}>
          {discovered.map((cid) => (
            <Link key={cid} to={`/codex/${cid}`} className={m.conceptChip} data-tier={masteryTier(progress.concepts[cid])}>
              {registry.concepts.get(cid)?.title}
            </Link>
          ))}
        </div>
      )}
      {hidden > 0 && (
        <p className={s.small}>
          {discovered.length > 0 ? 'Mais ' : ''}
          {plural(hidden, 'conceito ainda não descoberto', 'conceitos ainda não descobertos')}. Cada um aparece no Codex quando surge numa missão.
        </p>
      )}

      {relations.length > 0 && (
        <>
          <h3 className={s.panelSection}>Relações ({relations.length})</h3>
          <p className={s.small}>Serviços que aparecem junto com este em pelo menos um conceito.</p>
          <ul className={s.relations}>
            {relations.slice(0, RELATIONS_SHOWN).map((e) => {
              const other = otherEnd(e, id)
              const st = statuses.get(other)?.status ?? 'locked'
              return (
                <li key={other}>
                  <button type="button" onClick={() => onSelect(other)}>
                    <span className={s.swatch} data-locked={st === 'locked' || undefined} style={{ ['--c' as string]: `var(--territory-${graph.byId.get(other)?.territory})` }} aria-hidden="true" />
                    {registry.services.get(other)?.shortName}
                    <StatusIcon status={st} />
                    <span className="sr-only">({SERVICE_STATUS[st].label})</span>
                  </button>
                  <span className={s.small}>{plural(e.conceptIds.length, 'conceito em comum', 'conceitos em comum')}</span>
                </li>
              )
            })}
          </ul>
          {relations.length > RELATIONS_SHOWN && <p className={s.small}>E mais {plural(relations.length - RELATIONS_SHOWN, 'serviço ligado', 'serviços ligados')}, com um conceito em comum cada.</p>}
        </>
      )}

      <h3 className={s.panelSection}>Onde aparece</h3>
      <ul className={s.tracks}>
        {tracks.map(({ track, phases }) => (
          <li key={track.id}>
            <Link to={`/trilha/${track.id}`}>{track.title}</Link> <span className={s.small}>{plural(phases, 'fase', 'fases')}</span>
          </li>
        ))}
      </ul>
    </Card>
  )
}
