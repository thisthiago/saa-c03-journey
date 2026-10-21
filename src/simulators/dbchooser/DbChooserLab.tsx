/** Interface do laboratório de escolha do banco: guia das opções e cartões de carga posicionados nelas. */
import type { Evaluation } from '../../engine/types'
import { PlacementBoard } from '../../activities/shared/PlacementBoard'
import { renderInline } from '../../ui/inline'
import { FactTag, JudgementTag } from '../shared/Tags'
import sh from '../shared/lab.module.css'
import s from '../placement/placement.module.css'
import type { DbChooserLabConfig, DbChooserLabResponse } from './lab'
import { DB_OPTIONS as OPTIONS } from './model'

interface Props {
  config: DbChooserLabConfig
  value: DbChooserLabResponse
  onChange: (v: DbChooserLabResponse) => void
  disabled: boolean
  evaluation?: Evaluation | null
}

export function DbChooserLab({ config, value, onChange, disabled, evaluation }: Props) {
  const status = Object.fromEntries((evaluation?.items ?? []).map((i) => [i.id, i.status])) as Record<string, 'correct' | 'wrong' | 'missed' | 'partial'>
  return (
    <div className={sh.lab}>
      <details className={s.ref} open>
        <summary>Guia das opções</summary>
        <div className={s.legend}>
          <FactTag date="21/10/2026" /> o que cada opção faz · <JudgementTag /> desempate pela solução mais simples
        </div>
        <ul className={s.options}>
          {config.options.map((o) => (
            <li key={o}>
              <strong>{OPTIONS[o].name}</strong>
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
          <li>Cada carga tem um requisito que decide e alguns requisitos rígidos; na vida real também pesam custo, experiência da equipe e contratos.</li>
          <li>Quando duas opções atendem, vale a que custa e dá menos trabalho para operar (julgamento de arquitetura do AWS Quest).</li>
        </ul>
      </details>
    </div>
  )
}
