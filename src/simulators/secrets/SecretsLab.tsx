/** Interface do laboratório "A rotação passo a passo". */
import type { Evaluation } from '../../engine/types'
import { GridLab } from '../shared/GridLab'
import { FactTag, PremiseTag } from '../shared/Tags'
import sh from '../shared/lab.module.css'
import { secretsColumns, secretsRows, type SecretsLabConfig, type SecretsLabResponse } from './lab'

interface Props {
  config: SecretsLabConfig
  value: SecretsLabResponse
  onChange: (v: SecretsLabResponse) => void
  disabled: boolean
  evaluation?: Evaluation | null
}

export function SecretsLab({ config, ...props }: Props) {
  return (
    <GridLab
      columns={secretsColumns(config)}
      rows={secretsRows(config)}
      {...props}
      legend={
        <>
          <FactTag date="22/10/2026" /> as quatro etapas da função de rotação, os rótulos AWSCURRENT, AWSPENDING e AWSPREVIOUS e as estratégias de usuário único e de usuários alternados · <PremiseTag /> a aplicação com cache guardou a versão 1 antes da rotação.
        </>
      }
      intro={
        <p className={sh.desc}>
          A versão 1 é a senha atual. A rotação cria a versão 2; a rotação seguinte, a versão 3. No usuário único, as três versões são do usuário app. Nos usuários alternados, a versão 2 é do clone app_clone, e a versão 3 volta a ser do app.
        </p>
      }
      simplifications={['A aplicação com cache ainda não renovou a cópia no momento perguntado; o componente de cache da AWS renova a cada hora por padrão.', 'Atrasos de propagação da senha no banco e novas tentativas da aplicação não são simulados.']}
    />
  )
}
