/** Selos que separam fato verificado, premissa do cenário e julgamento de arquitetura. */
import { CircleCheck, FlaskConical, Scale } from 'lucide-react'
import s from './lab.module.css'

export function FactTag({ date = '18/10/2026' }: { date?: string }) {
  return (
    <span className={s.tag} data-kind="fact" title={`Conferido na documentação oficial da AWS em ${date}`}>
      <CircleCheck size={11} aria-hidden="true" /> Fato · {date}
    </span>
  )
}

export function PremiseTag({ label = 'Premissa do cenário' }: { label?: string }) {
  return (
    <span className={s.tag} data-kind="premise" title="Valor ilustrativo definido pelo cenário — não é dado da AWS">
      <FlaskConical size={11} aria-hidden="true" /> {label}
    </span>
  )
}

export function JudgementTag() {
  return (
    <span className={s.tag} data-kind="judgement" title="Avaliação de arquitetura do AWS Quest, não uma regra da AWS">
      <Scale size={11} aria-hidden="true" /> Julgamento de arquitetura
    </span>
  )
}
