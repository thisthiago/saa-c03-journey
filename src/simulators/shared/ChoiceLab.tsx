/** Interface genérica dos laboratórios de escolha: guia das opções e cartões de requisito posicionados nelas. */
import type { ReactNode } from 'react'
import type { Evaluation } from '../../engine/types'
import { PlacementBoard } from '../../activities/shared/PlacementBoard'
import { renderInline } from '../../ui/inline'
import s from '../placement/placement.module.css'
import type { ChoiceCatalog, ChoiceLabConfig, ChoiceLabResponse } from './chooser'
import sh from './lab.module.css'

interface Props {
  catalog: ChoiceCatalog
  config: ChoiceLabConfig
  value: ChoiceLabResponse
  onChange: (v: ChoiceLabResponse) => void
  disabled: boolean
  evaluation?: Evaluation | null
  legend: ReactNode
  simplifications: string[]
}

export function ChoiceLab({ catalog, config, value, onChange, disabled, evaluation, legend, simplifications }: Props) {
  const status = Object.fromEntries((evaluation?.items ?? []).map((i) => [i.id, i.status])) as Record<string, 'correct' | 'wrong' | 'missed' | 'partial'>
  return (
    <div className={sh.lab}>
      <details className={s.ref} open>
        <summary>Guia das opções</summary>
        <div className={s.legend}>{legend}</div>
        <ul className={s.options}>
          {config.options.map((o) => (
            <li key={o}>
              <strong>{catalog.options[o].name}</strong>
              <span>{catalog.options[o].summary}</span>
              <span className={s.limit}>Limite: {catalog.options[o].limits[0]}</span>
            </li>
          ))}
        </ul>
      </details>
      <PlacementBoard
        items={config.items.map((i) => ({ id: i.id, text: i.text }))}
        targets={config.options.map((o) => ({ id: o, label: catalog.options[o].name }))}
        placements={value.placements ?? {}}
        onChange={(placements) => onChange({ placements })}
        disabled={disabled}
        itemStatus={evaluation ? status : undefined}
        poolLabel={config.itemsLabel}
      />
      {evaluation && (
        <ul className={s.verdicts}>
          {evaluation.items.map((i) => (
            <li key={i.id} className={sh.verdict} data-status={i.status}>
              <strong>{renderInline(i.label)}</strong>
              <span>{renderInline(i.message ?? '')}</span>
            </li>
          ))}
        </ul>
      )}
      <details className={sh.simp}>
        <summary>Simplificações deste simulador</summary>
        <ul>
          {simplifications.map((t) => (
            <li key={t}>{t}</li>
          ))}
        </ul>
      </details>
    </div>
  )
}
