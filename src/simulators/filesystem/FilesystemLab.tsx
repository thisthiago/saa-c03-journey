/** Interface do laboratório "O sistema de arquivos certo" (EFS). */
import type { Evaluation } from '../../engine/types'
import { FILES_PRICE_DATE, filesPrices } from '../files-prices'
import { GridLab } from '../shared/GridLab'
import { FactTag, PremiseTag } from '../shared/Tags'
import s from '../shared/lab.module.css'
import { chosenCost, filesystemColumns, filesystemRows, type FilesystemLabConfig, type FilesystemLabResponse } from './lab'
import { fmtPrice, fmtUsd } from './model'

interface Props {
  config: FilesystemLabConfig
  value: FilesystemLabResponse
  onChange: (v: FilesystemLabResponse) => void
  disabled: boolean
  evaluation?: Evaluation | null
}

export function FilesystemLab({ config, ...props }: Props) {
  const p = filesPrices(config.region).efs
  if (config.mode === 'access')
    return (
      <GridLab
        columns={filesystemColumns(config)}
        rows={filesystemRows(config)}
        {...props}
        legend={
          <>
            <FactTag date="22/10/2026" /> Regional guarda os dados em várias AZs; One Zone, numa só e com um único mount target; acesso a partir de outra AZ é cobrado · <PremiseTag /> as cargas e as AZs dos servidores.
          </>
        }
        simplifications={['Cada servidor monta o sistema de arquivos pelo mount target da própria AZ quando ele existe.', 'Os nomes das AZs (a, b, c) são do cenário.']}
      />
    )
  const costs = config.workloads.map((w) => ({ w, cost: chosenCost(config, w, props.value) }))
  return (
    <GridLab
      columns={filesystemColumns(config)}
      rows={filesystemRows(config)}
      {...props}
      legend={
        <>
          <FactTag date={FILES_PRICE_DATE} /> preços do EFS em {config.region ?? 'us-east-1'} pela AWS Price List: Standard {fmtPrice(p.standard)}, Infrequent Access {fmtPrice(p.iaElastic)} com Elastic e {fmtPrice(p.ia)} sem, Archive {fmtPrice(p.archive)} por GB-mês; Elastic {fmtPrice(p.elasticRead)} por GB lido e {fmtPrice(p.elasticWrite)} por GB gravado; Provisioned {fmtPrice(p.provisionedMiBpsMonth)} por MiB/s-mês acima da base · <PremiseTag /> a carga de cada sistema de arquivos.
        </>
      }
      intro={
        costs.some((x) => x.cost) ? (
          <ul className={s.desc} aria-label="Custo mensal das suas escolhas">
            {costs.map(({ w, cost }) =>
              cost ? (
                <li key={w.id}>
                  {w.label}: {!cost.valid || !cost.meets ? cost.reason : `${fmtUsd(cost.total)} por mês`}
                </li>
              ) : null,
            )}
          </ul>
        ) : undefined
      }
      simplifications={[
        'A vazão média e o pico resumem a carga; os créditos do Bursting não são simulados minuto a minuto, e as leituras não têm o desconto de medição.',
        'No Provisioned, a vazão contratada é igual ao pico.',
        'A cobrança única da transição entre classes fica de fora, e 1 GB vale 1 GiB nas contas.',
      ]}
    />
  )
}
