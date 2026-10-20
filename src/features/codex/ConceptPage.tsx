import { ArrowLeft, ExternalLink, Lock } from 'lucide-react'
import type { ReactNode } from 'react'
import { Link, useParams } from 'react-router'
import { registry } from '../../content'
import { masteryTier, TIER_LABEL } from '../../engine/mastery'
import { useGame } from '../../store/gameStore'
import { useDocumentTitle } from '../../app/hooks'
import { Badge, ButtonLink, Callout, Card } from '../../ui/kit'
import { Paragraphs } from '../../ui/RichText'
import { renderInline } from '../../ui/inline'
import { NotFound } from '../NotFound'
import s from './codex.module.css'
import { phaseLabel, phaseRef } from '../../app/format'

const RELEVANCE = { alta: 'Alta', media: 'Média', baixa: 'Baixa' } as const

function List({ title, items, tone }: { title: string; items?: string[]; tone?: 'fact' | 'rec' | 'warn' }) {
  if (!items?.length) return null
  return (
    <section className={s.section}>
      <h2 className={s.sectionTitle}>
        {title}
        {tone === 'fact' && <Badge tone="info">Fato técnico</Badge>}
        {tone === 'rec' && <Badge tone="mastery">Recomendação de arquitetura</Badge>}
      </h2>
      <ul className={tone === 'warn' ? s.warnList : s.list}>
        {items.map((t) => (
          <li key={t}>{renderInline(t)}</li>
        ))}
      </ul>
    </section>
  )
}

export function ConceptPage() {
  const { conceptId = '' } = useParams()
  const concept = registry.concepts.get(conceptId)
  useDocumentTitle(concept?.title ?? 'Conceito')
  const progress = useGame((st) => st.progress)
  if (!concept) return <NotFound />
  const discovered = Boolean(progress.discovered[conceptId])
  const phaseId = registry.conceptPhase.get(conceptId)
  const phase = phaseId ? registry.phases.get(phaseId)?.phase : undefined
  if (!discovered) {
    return (
      <div className="page">
        <Card>
          <Lock size={28} aria-hidden="true" />
          <h1>Conceito ainda não descoberto</h1>
          <p className="muted">Ele será revelado quando aparecer numa missão{phase ? ` de ${phaseRef(phase)} — ${phase.title}` : ''}.</p>
          <ButtonLink to="/codex">Voltar ao Codex</ButtonLink>
        </Card>
      </div>
    )
  }
  const cp = progress.concepts[conceptId]
  const tier = masteryTier(cp)
  const services = concept.serviceIds.map((id) => registry.services.get(id)).filter(Boolean)
  const appears = [...registry.activities.values()].filter((a) => a.activity.concepts.some((c) => c.id === conceptId))
  const missions = [...new Map(appears.map((a) => [a.mission.id, a])).values()]
  const domains = concept.exam.domains.map((d) => registry.examDomains.find((x) => x.id === d)).filter(Boolean)
  const questionCount = [...registry.questions.values()].filter((r) => r.question.concept === concept.id || r.question.related?.includes(concept.id)).length
  const av = concept.availability

  let availability: ReactNode = null
  if (av && av.kind !== 'current') {
    availability = (
      <Callout kind="warning" title={av.kind === 'legacy' ? 'Recurso legado' : `Sem novos clientes${av.since ? ` desde ${av.since}` : ''}`}>
        <p>{av.note}</p>
        {av.kind === 'no-new-customers' && av.alternatives && <p>Alternativas: {av.alternatives.join(', ')}.</p>}
      </Callout>
    )
  }

  return (
    <div className="page">
      <Link to="/codex" className={s.back}>
        <ArrowLeft size={16} aria-hidden="true" /> Codex
      </Link>
      <header className={s.head}>
        <p className={s.official}>{concept.officialName}</p>
        <h1>{concept.title}</h1>
        <div className="row">
          <Badge tone={tier === 'dominado' ? 'mastery' : tier === 'praticando' ? 'info' : 'warning'}>Domínio: {TIER_LABEL[tier]}</Badge>
          {cp && <Badge>Próxima revisão: {new Date(cp.nextReviewAt).toLocaleDateString('pt-BR')}</Badge>}
          {services.map((sv) => (
            <Badge key={sv!.id} tone="accent">
              {sv!.shortName}
            </Badge>
          ))}
        </div>
      </header>
      {availability}
      <Card className={s.summaryCard}>
        <p className={s.summary}>{renderInline(concept.summary)}</p>
        {concept.explanation && <Paragraphs items={concept.explanation} />}
      </Card>

      <div className={s.columns}>
        <div>
          <List title="Quando usar" items={concept.useCases} />
          <List title="Benefícios" items={concept.benefits} />
          <List title="Limitações" items={concept.limitations} />
          <List title="Fatos" items={concept.facts} tone="fact" />
          <List title="Recomendações" items={concept.recommendations} tone="rec" />
        </div>
        <div>
          <List title="Erros comuns" items={concept.commonMistakes} tone="warn" />
          <List title="Consequências de escolhas erradas" items={concept.consequences} tone="warn" />
          {concept.comparisons && concept.comparisons.length > 0 && (
            <section className={s.section}>
              <h2 className={s.sectionTitle}>Comparações</h2>
              <ul className={s.list}>
                {concept.comparisons.map((cmp) => {
                  const other = registry.concepts.get(cmp.with)
                  return (
                    <li key={cmp.with}>
                      <b>{other && progress.discovered[cmp.with] ? <Link to={`/codex/${cmp.with}`}>{other.title}</Link> : (other?.title ?? cmp.with)}:</b> {renderInline(cmp.text)}
                    </li>
                  )
                })}
              </ul>
            </section>
          )}
          {concept.prerequisites && concept.prerequisites.length > 0 && (
            <section className={s.section}>
              <h2 className={s.sectionTitle}>Pré-requisitos</h2>
              <ul className={s.list}>
                {concept.prerequisites.map((p) => (
                  <li key={p}>{registry.concepts.get(p)?.title ?? p}</li>
                ))}
              </ul>
            </section>
          )}
          <section className={s.section}>
            <h2 className={s.sectionTitle}>Certificação (SAA-C03)</h2>
            <p>
              Relevância: <b>{RELEVANCE[concept.exam.relevance]}</b>
            </p>
            <ul className={s.list}>
              {domains.map((d) => (
                <li key={d!.id}>
                  {d!.title} <span className="muted">({d!.officialName}, {Math.round(d!.weight * 100)}% do exame)</span>
                </li>
              ))}
            </ul>
            {concept.exam.notes && <p className="muted">{concept.exam.notes}</p>}
            {questionCount > 0 && (
              <p>
                <Link to={`/revisao/questoes?conceito=${concept.id}`}>
                  {questionCount === 1 ? '1 questão de simulado' : `${questionCount} questões de simulado`} sobre este conceito
                </Link>
              </p>
            )}
          </section>
          {missions.length > 0 && (
            <section className={s.section}>
              <h2 className={s.sectionTitle}>Onde praticar</h2>
              <ul className={s.list}>
                {missions.map((m) => (
                  <li key={m.mission.id}>
                    <Link to={`/missao/${m.mission.id}`}>{m.mission.title}</Link> <span className="muted">· {phaseLabel(m.phase)}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      </div>

      <section className={s.section}>
        <h2 className={s.sectionTitle}>Fontes oficiais</h2>
        <ul className={s.refs}>
          {concept.references.map((r) => (
            <li key={r.url}>
              <a href={r.url} target="_blank" rel="noopener noreferrer">
                {r.title} <ExternalLink size={14} aria-hidden="true" />
                <span className="sr-only">(abre em nova aba)</span>
              </a>
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}
