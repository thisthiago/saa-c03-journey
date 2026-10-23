/** Selos dos domínios do exame SAA-C03, com as cores dos tokens semânticos. */
import { EXAM_DOMAINS } from '../content/catalog/catalog'
import type { ExamDomainId } from '../engine/types'
import s from './ui.module.css'

/** Nome curto de cada domínio do exame, o mesmo das dimensões dos desafios finais. */
const DOMAIN_SHORT: Record<ExamDomainId, string> = { d1: 'Seguro', d2: 'Resiliente', d3: 'Alto desempenho', d4: 'Custo' }

export function DomainTag({ id }: { id: ExamDomainId }) {
  const d = EXAM_DOMAINS.find((x) => x.id === id)
  return (
    <span className={s.domainTag} data-domain={id} title={d ? `${d.officialName} (${Math.round(d.weight * 100)}% do exame)` : undefined}>
      {id.toUpperCase()} · {DOMAIN_SHORT[id]}
    </span>
  )
}

export function DomainTags({ ids }: { ids?: ExamDomainId[] }) {
  if (!ids?.length) return null
  return (
    <span className={s.domainTags} aria-label={`Domínios do exame: ${ids.map((id) => DOMAIN_SHORT[id]).join(', ')}`}>
      {ids.map((id) => (
        <DomainTag key={id} id={id} />
      ))}
    </span>
  )
}
