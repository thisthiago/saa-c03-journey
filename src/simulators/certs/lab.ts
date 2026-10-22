/** Laboratório "Os certificados da empresa": para cada certificado, se pode ser usado onde está e o que acontece perto do vencimento. */
import { evaluateGrid, gridComplete, gridSolution, type GridColumn, type GridExpected, type GridResponse, type GridRow } from '../shared/grid'
import { ATTACH_LABEL, placement, renewal, RENEWAL_LABEL, type Certificate } from './model'

export interface CertsLabConfig {
  certificates: (Certificate & { concepts?: string[] })[]
}

export type CertsLabResponse = GridResponse

export const CERTS_COLUMNS: GridColumn[] = [
  {
    id: 'placement',
    label: 'Pode ser usado onde está?',
    options: [
      { id: 'ok', label: 'Sim' },
      { id: 'wrong-region', label: 'Não: Região errada' },
      { id: 'cannot-attach', label: 'Não: o ACM não instala aí' },
    ],
  },
  { id: 'renewal', label: 'Perto do vencimento', options: (Object.keys(RENEWAL_LABEL) as (keyof typeof RENEWAL_LABEL)[]).map((id) => ({ id, label: RENEWAL_LABEL[id] })) },
]

const describe = (c: Certificate) =>
  [
    c.source === 'imported' ? 'importado de outra autoridade' : `emitido pelo ACM${c.exportable ? ' (exportável)' : ''}`,
    c.validation ? `validado por ${c.validation === 'dns' ? 'DNS' : 'e-mail'}` : '',
    c.validation === 'dns' ? (c.cnamePresent ? 'CNAME de validação no DNS' : 'CNAME de validação apagado') : '',
    `na Região ${c.region}`,
    `usado em: ${ATTACH_LABEL[c.attachedTo]}`,
  ]
    .filter(Boolean)
    .join(', ')

export const certsRows = (c: CertsLabConfig): GridRow[] => c.certificates.map((x) => ({ id: x.id, label: `**${x.domain}**`, detail: `${describe(x)}.`, concepts: x.concepts }))

export function certsExpected(c: CertsLabConfig) {
  return (row: GridRow): Record<string, GridExpected> => {
    const x = c.certificates.find((k) => k.id === row.id)!
    const p = placement(x)
    const r = renewal(x)
    return { placement: { answer: p.result, why: p.why }, renewal: { answer: r.result, why: r.why } }
  }
}

export const certsSolution = (c: CertsLabConfig) => gridSolution(CERTS_COLUMNS, certsRows(c), certsExpected(c))
export const evaluateCertsLab = (c: CertsLabConfig, r: CertsLabResponse) => evaluateGrid(CERTS_COLUMNS, certsRows(c), certsExpected(c), r)
export const certsComplete = (c: CertsLabConfig, r: CertsLabResponse) => gridComplete(CERTS_COLUMNS, certsRows(c), r)
