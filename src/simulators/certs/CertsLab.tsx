/** Interface do laboratório "Os certificados da empresa". */
import type { Evaluation } from '../../engine/types'
import { GridLab } from '../shared/GridLab'
import { FactTag, PremiseTag } from '../shared/Tags'
import { CERTS_COLUMNS, certsRows, type CertsLabConfig, type CertsLabResponse } from './lab'

interface Props {
  config: CertsLabConfig
  value: CertsLabResponse
  onChange: (v: CertsLabResponse) => void
  disabled: boolean
  evaluation?: Evaluation | null
}

export function CertsLab({ config, ...props }: Props) {
  return (
    <GridLab
      columns={CERTS_COLUMNS}
      rows={certsRows(config)}
      {...props}
      legend={
        <>
          <FactTag date="22/10/2026" /> renovação gerenciada do ACM, validação por DNS e por e-mail, certificados importados e a Região exigida pelo CloudFront · <PremiseTag /> os domínios e onde cada certificado está.
        </>
      }
      simplifications={['Todos os certificados estão a menos de 45 dias do vencimento.', 'Certificados privados (AWS Private CA) e a validação por HTTP do CloudFront não entram no laboratório.']}
    />
  )
}
