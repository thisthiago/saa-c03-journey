/** Laboratório "Depende do serviço": quem cuida de cada camada em EC2, RDS, Lambda e S3. */
import type { ItemFeedback } from '../../engine/types'
import { cellKey, LAYER_LABEL, OWNER_LABEL, SERVICE_INFO, SRM_MATRIX, type Owner, type SrmLayer, type SrmService } from './model'

export interface ResponsibilityLabConfig {
  services: SrmService[]
  layers: { id: SrmLayer; concepts?: string[] }[]
}

export interface ResponsibilityLabResponse {
  cells: Record<string, Owner | undefined>
}

export const responsibilitySolution = (c: ResponsibilityLabConfig): ResponsibilityLabResponse => ({
  cells: Object.fromEntries(c.layers.flatMap((l) => c.services.map((sv) => [cellKey(l.id, sv), SRM_MATRIX[l.id][sv].owner]))),
})

export function evaluateResponsibilityLab(c: ResponsibilityLabConfig, r: ResponsibilityLabResponse) {
  const items = c.layers.flatMap((l) =>
    c.services.map((sv) => {
      const key = cellKey(l.id, sv)
      const pick = r.cells?.[key]
      const cell = SRM_MATRIX[l.id][sv]
      const ok = pick === cell.owner
      return {
        concepts: l.concepts,
        score: ok ? 1 : 0,
        fb: {
          id: key,
          label: `${SERVICE_INFO[sv].name} · ${LAYER_LABEL[l.id]}: ${pick ? OWNER_LABEL[pick] : '—'}`,
          status: ok ? 'correct' : pick ? 'wrong' : 'missed',
          message: ok ? cell.why : `Resposta: ${OWNER_LABEL[cell.owner]}. ${cell.why}`,
        } as ItemFeedback,
      }
    }),
  )
  return { score: items.reduce((s, x) => s + x.score, 0) / Math.max(1, items.length), items }
}
