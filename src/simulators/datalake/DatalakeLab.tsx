/** Interface do laboratório "Organizar o data lake": formato, compressão e partição de cada tabela, com o volume lido e o custo ao vivo. */
import type { Evaluation } from '../../engine/types'
import { renderInline } from '../../ui/inline'
import { ANA_PRICE_DATE, analyticsPrices } from '../analytics-prices'
import { usd } from '../compute-prices'
import { regionPrices } from '../cost/prices'
import { FactTag, JudgementTag, PremiseTag } from '../shared/Tags'
import c from '../shared/compute.module.css'
import sh from '../shared/lab.module.css'
import n from '../shared/net.module.css'
import type { LakeLabConfig, LakeLabResponse } from './lab'
import {
  avgPartitionMB,
  COMPRESSION_LABEL,
  COMPRESSIONS,
  FORMAT_LABEL,
  FORMATS,
  formatSize,
  layoutMonthly,
  layoutProblems,
  partitionLabel,
  PARTITIONS,
  unitOf,
  SMALL_FILE_MB,
  type Compression,
  type FileFormat,
  type Layout,
  type PartitionScheme,
} from './model'

interface Props {
  config: LakeLabConfig
  value: LakeLabResponse
  onChange: (v: LakeLabResponse) => void
  disabled: boolean
  evaluation?: Evaluation | null
}

const DEFAULT: Layout = { format: 'csv', compression: 'none', partition: 'none' }

export function DatalakeLab({ config, value, onChange, disabled, evaluation }: Props) {
  const athena = analyticsPrices(config.region).athena
  const s3 = regionPrices(config.region).storageGBMonth.STANDARD
  return (
    <div className={sh.lab}>
      <p className={c.legend}>
        <FactTag date="21/10/2026" /> Parquet e ORC leem só as colunas da consulta; a partição no filtro limita os arquivos abertos; o Athena cobra o dado lido, com mínimo de 10 MB por consulta · preços da AWS Price List ({ANA_PRICE_DATE}): Athena {usd(athena.perTBScanned)} por TB lido; S3 Standard {usd(s3)} por GB-mês · <PremiseTag /> taxas de compressão (Snappy 2:1, GZIP e ZSTD 3:1), JSON 60% maior que o CSV e arquivos abaixo de {SMALL_FILE_MB} MB contam como pequenos · <JudgementTag /> menor custo mensal sem arquivos pequenos demais.
      </p>
      {config.tables.map((t) => {
        const l = value.layouts?.[t.id] ?? config.initial ?? DEFAULT
        const set = (patch: Partial<Layout>) => onChange({ layouts: { ...value.layouts, [t.id]: { ...l, ...patch } } })
        const cost = layoutMonthly(t, l, config.region)
        const pb = layoutProblems(t, l)
        const fb = evaluation?.items.find((i) => i.id === t.id)
        return (
          <section key={t.id} className={sh.card} aria-label={t.name}>
            <h4 className={sh.title}>{t.name}</h4>
            <p className={sh.desc}>{renderInline(t.description)}</p>
            <p className={sh.desc}>
              Colunas: {t.columns.map((col) => `${col.label} (${Math.round(col.share * 100)}%)`).join(', ')}. Em CSV sem compressão, {formatSize(t.csvGB)} para {t.days} dias de {t.stores} {unitOf(t).many}.
            </p>
            <div className={c.row}>
              <label className={c.field}>
                <span>Formato</span>
                <select className={c.select} value={l.format} disabled={disabled} onChange={(e) => set({ format: e.target.value as FileFormat })}>
                  {FORMATS.map((f) => (
                    <option key={f} value={f}>
                      {FORMAT_LABEL[f]}
                    </option>
                  ))}
                </select>
              </label>
              <label className={c.field}>
                <span>Compressão</span>
                <select className={c.select} value={l.compression} disabled={disabled} onChange={(e) => set({ compression: e.target.value as Compression })}>
                  {COMPRESSIONS.map((x) => (
                    <option key={x} value={x}>
                      {COMPRESSION_LABEL[x]}
                    </option>
                  ))}
                </select>
              </label>
              <label className={c.field}>
                <span>Partição</span>
                <select className={c.select} value={l.partition} disabled={disabled} onChange={(e) => set({ partition: e.target.value as PartitionScheme })}>
                  {PARTITIONS.map((p) => (
                    <option key={p} value={p}>
                      {partitionLabel(p, t)}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <div className={c.scroll}>
              <table className={c.table}>
                <thead>
                  <tr>
                    <th>Consulta</th>
                    <th className={c.num}>Por mês</th>
                    <th className={c.num}>Lê a cada vez</th>
                    <th className={c.num}>Custo por mês</th>
                  </tr>
                </thead>
                <tbody>
                  {t.queries.map((q) => {
                    const r = cost.queries.find((x) => x.id === q.id)!
                    return (
                      <tr key={q.id}>
                        <td>{q.label}</td>
                        <td className={c.num}>{q.perMonth.toLocaleString('pt-BR')}</td>
                        <td className={c.num}>{formatSize(r.scanned)}</td>
                        <td className={c.num}>{usd(r.monthly)}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
            <p className={c.cost} aria-live="polite">
              Guardado: {formatSize(cost.stored)}
              {l.partition !== 'none' && ` em arquivos de ${formatSize(avgPartitionMB(t, l) / 1024)} por partição`} · S3 {usd(cost.storage)}/mês + Athena {usd(cost.athena)}/mês = <strong>{usd(cost.total)}/mês</strong>
            </p>
            {pb.length > 0 && (
              <p className={c.muted}>
                <span className={n.status} data-ok={false}>
                  ✗
                </span>{' '}
                {pb.join('; ')}.
              </p>
            )}
            {fb && (
              <div className={sh.verdict} data-status={fb.status} aria-live="polite">
                <strong>{fb.label}</strong>
                <span>{renderInline(fb.message ?? '')}</span>
              </div>
            )}
          </section>
        )
      })}
      <details className={sh.simp}>
        <summary>Simplificações deste simulador</summary>
        <ul>
          <li>Cada formato e cada compressão reduzem o tamanho por uma taxa fixa; na prática, a taxa depende dos dados.</li>
          <li>Parquet e ORC ficam do mesmo tamanho; a documentação diz que o ORC costuma gerar arquivos menores.</li>
          <li>A consulta lê a fração exata das colunas e das partições que usa; estatísticas de bloco, ordenação e bucketing ficam de fora.</li>
          <li>O armazenamento usa o S3 Standard, sem as camadas do ciclo de vida, e o custo das requisições ao S3 fica fora da conta.</li>
        </ul>
      </details>
    </div>
  )
}
