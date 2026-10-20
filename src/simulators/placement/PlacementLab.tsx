/** Interface do laboratório de infraestrutura: cartões de cenário posicionados nas opções. */
import type { Evaluation } from '../../engine/types'
import { PlacementBoard } from '../../activities/shared/PlacementBoard'
import { renderInline } from '../../ui/inline'
import { FactTag, JudgementTag } from '../shared/Tags'
import sh from '../shared/lab.module.css'
import type { PlacementLabConfig, PlacementLabResponse } from './lab'
import { OPTIONS } from './model'
import s from './placement.module.css'

interface Props {
  config: PlacementLabConfig
  value: PlacementLabResponse
  onChange: (v: PlacementLabResponse) => void
  disabled: boolean
  evaluation?: Evaluation | null
}

const COST = ['', '$', '$$', '$$$', '$$$$']

export function PlacementLab({ config, value, onChange, disabled, evaluation }: Props) {
  const status = Object.fromEntries((evaluation?.items ?? []).map((i) => [i.id, i.status])) as Record<string, 'correct' | 'wrong' | 'missed' | 'partial'>
  return (
    <div className={sh.lab}>
      <details className={s.ref} open>
        <summary>Guia das opções</summary>
        <div className={s.legend}>
          <FactTag /> características · <JudgementTag /> custo relativo
        </div>
        <ul className={s.options}>
          {config.options.map((o) => (
            <li key={o}>
              <strong>{OPTIONS[o].name}</strong> <span className={s.cost} title="Custo relativo (julgamento de arquitetura, não preço)">{COST[OPTIONS[o].relativeCost]}</span>
              <span>{OPTIONS[o].summary}</span>
              <span className={s.limit}>Limite: {OPTIONS[o].limits[0]}</span>
            </li>
          ))}
        </ul>
      </details>
      <PlacementBoard
        items={config.items.map((i) => ({ id: i.id, text: i.text }))}
        targets={config.options.map((o) => ({ id: o, label: OPTIONS[o].name }))}
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
          <li>Cada cenário tem um requisito dominante e requisitos rígidos; na vida real há mais nuances (orçamento, equipe, prazos, contratos).</li>
          <li>O custo relativo é um julgamento de arquitetura do AWS Quest, não uma tabela de preços.</li>
          <li>Opções podem ser combinadas na prática (por exemplo, CloudFront na frente de uma aplicação Multi-AZ); aqui cada cenário recebe a opção que resolve o requisito dominante.</li>
        </ul>
      </details>
    </div>
  )
}
