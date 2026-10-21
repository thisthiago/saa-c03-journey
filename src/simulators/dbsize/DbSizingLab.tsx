/** Interface do laboratório de dimensionamento do RDS: guia das classes e um banco configurável por carga. */
import type { Evaluation } from '../../engine/types'
import { renderInline } from '../../ui/inline'
import { HOURS_PER_MONTH, usd } from '../compute-prices'
import { databasePrices, DB_PRICE_DATE, RDS_CLASSES } from '../database-prices'
import { FactTag } from '../shared/Tags'
import c from '../shared/compute.module.css'
import sh from '../shared/lab.module.css'
import type { DbSizingLabConfig, DbSizingLabResponse } from './lab'
import { dbMonthly, dbPerformance, DEPLOYMENT_LABEL, isBurstable, STORAGE, validateDb, type DbConfig, type DbNeed, type DbStorageType, type Deployment } from './model'

interface Props {
  config: DbSizingLabConfig
  value: DbSizingLabResponse
  onChange: (v: DbSizingLabResponse) => void
  disabled: boolean
  evaluation?: Evaluation | null
}

const fmt = (n: number) => Math.round(n).toLocaleString('pt-BR')

function needList(n: DbNeed): string[] {
  const out = [`pelo menos ${n.minVcpu} vCPUs e ${fmt(n.minMemoryGiB)} GiB de memória`, `${fmt(n.minGiB)} GiB de dados`, `${fmt(n.iops)} IOPS e ${fmt(n.throughput)} MiB/s`]
  if (n.sustainedCpu) out.push('CPU alta o dia todo')
  if (n.highAvailability) out.push('produção: precisa continuar no ar se uma AZ falhar')
  return out
}

/** Valores iniciais ao escolher um armazenamento: o mínimo de cada tipo. */
function storageDefaults(storage: DbStorageType, need: DbNeed): Pick<DbConfig, 'storage' | 'sizeGiB' | 'iops' | 'throughput'> {
  if (storage === 'gp3') return { storage, sizeGiB: Math.max(STORAGE.gp3.minGiB, need.minGiB), iops: undefined, throughput: undefined }
  return { storage, sizeGiB: Math.max(STORAGE.io2.minGiB, need.minGiB), iops: STORAGE.io2.minIops, throughput: undefined }
}

function NumberField({ label, value, onChange, disabled, step = 1 }: { label: string; value: number | undefined; onChange: (v: number) => void; disabled: boolean; step?: number }) {
  return (
    <label className={c.field}>
      <span>{label}</span>
      <input className={c.input} type="number" inputMode="numeric" min={0} step={step} value={value ?? ''} disabled={disabled} onChange={(e) => onChange(Number(e.target.value))} style={{ width: '8em' }} />
    </label>
  )
}

export function DbSizingLab({ config, value, onChange, disabled, evaluation }: Props) {
  const p = databasePrices(config.region).rds
  const set = (id: string, v: DbConfig | undefined) => onChange({ configs: { ...value.configs, [id]: v } })
  const g = p.storage.gp3
  const io = p.storage.io2
  return (
    <div className={sh.lab}>
      <details className={c.ref} open>
        <summary>Classes e armazenamento do RDS for PostgreSQL</summary>
        <p className={c.legend}>
          <FactTag date="21/10/2026" /> limites da documentação do RDS · preços por mês da AWS Price List ({DB_PRICE_DATE}), {config.region ?? 'us-east-1'}.
        </p>
        <div className={c.scroll}>
          <table className={c.table}>
            <thead>
              <tr>
                <th scope="col">Classe</th>
                <th scope="col" className={c.num}>vCPU</th>
                <th scope="col" className={c.num}>Memória</th>
                <th scope="col" className={c.num}>Single-AZ</th>
                <th scope="col" className={c.num}>Multi-AZ</th>
              </tr>
            </thead>
            <tbody>
              {RDS_CLASSES.map((cls) => {
                const x = p.instances[cls]
                return (
                  <tr key={cls}>
                    <th scope="row">{cls}</th>
                    <td className={c.num}>{x.vcpu}</td>
                    <td className={c.num}>{x.memoryGiB} GiB</td>
                    <td className={c.num}>{usd(x.singleAzHour * HOURS_PER_MONTH)}</td>
                    <td className={c.num}>{usd(x.multiAzHour * HOURS_PER_MONTH)}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        <p className={c.legend}>
          db.t: burstable, para CPU baixa na maior parte do tempo. gp3: de 20 GiB a 64 TiB; abaixo de 400 GiB entrega 3.000 IOPS e 125 MiB/s fixos; a partir de 400 GiB entrega 12.000 IOPS e 500 MiB/s e aceita até 64.000 IOPS e 4.000 MiB/s ({usd(g.singleAzGBMonth)}/GiB, {usd(g.singleAzIopsMonth)} por IOPS e {usd(g.singleAzThroughputMiBpsMonth)} por MiB/s acima do básico). io2: de 100 GiB a 64 TiB, de 1.000 a 256.000 IOPS ({usd(io.singleAzGBMonth)}/GiB e {usd(io.singleAzIopsMonth)} por IOPS). No Multi-AZ, o armazenamento custa o dobro.
        </p>
      </details>

      {config.workloads.map((w) => {
        const v = value.configs?.[w.id]
        const fb = evaluation?.items.find((i) => i.id === w.id)
        const errors = v ? validateDb(v) : []
        const perf = v && errors.length === 0 ? dbPerformance(v) : undefined
        const patch = (part: Partial<DbConfig>) => v && set(w.id, { ...v, ...part })
        const provisionable = v && (v.storage === 'io2' || v.sizeGiB >= STORAGE.gp3.stripeAt)
        return (
          <section key={w.id} className={sh.card} aria-label={w.name}>
            <h4 className={sh.title}>{w.name}</h4>
            <p className={sh.desc}>{renderInline(w.description)}</p>
            <ul className={c.needs}>
              {needList(w.need).map((n) => (
                <li key={n}>{n}</li>
              ))}
            </ul>
            <div className={c.row}>
              <label className={c.field}>
                <span>Classe</span>
                <select className={c.select} value={v?.cls ?? ''} disabled={disabled} onChange={(e) => set(w.id, e.target.value ? { deployment: 'single-az', ...storageDefaults('gp3', w.need), ...v, cls: e.target.value } : undefined)}>
                  <option value="">Escolha uma classe</option>
                  {RDS_CLASSES.map((cls) => (
                    <option key={cls} value={cls}>
                      {cls}
                      {isBurstable(cls) ? ' (burstable)' : ''}
                    </option>
                  ))}
                </select>
              </label>
              {v && (
                <label className={c.field}>
                  <span>Implantação</span>
                  <select className={c.select} value={v.deployment} disabled={disabled} onChange={(e) => patch({ deployment: e.target.value as Deployment })}>
                    {(Object.keys(DEPLOYMENT_LABEL) as Deployment[]).map((d) => (
                      <option key={d} value={d}>
                        {DEPLOYMENT_LABEL[d]}
                      </option>
                    ))}
                  </select>
                </label>
              )}
              {v && (
                <label className={c.field}>
                  <span>Armazenamento</span>
                  <select className={c.select} value={v.storage} disabled={disabled} onChange={(e) => patch(storageDefaults(e.target.value as DbStorageType, w.need))}>
                    <option value="gp3">{STORAGE.gp3.name}</option>
                    <option value="io2">{STORAGE.io2.name}</option>
                  </select>
                </label>
              )}
              {v && <NumberField label="Tamanho (GiB)" value={v.sizeGiB} disabled={disabled} onChange={(n) => patch({ sizeGiB: n })} />}
              {provisionable && <NumberField label="IOPS" value={v.iops ?? (v.storage === 'gp3' ? STORAGE.gp3.baseHigh.iops : undefined)} step={500} disabled={disabled} onChange={(n) => patch({ iops: n })} />}
              {provisionable && v.storage === 'gp3' && <NumberField label="Throughput (MiB/s)" value={v.throughput ?? STORAGE.gp3.baseHigh.throughput} step={25} disabled={disabled} onChange={(n) => patch({ throughput: n })} />}
            </div>
            {v && (
              <p className={c.cost} aria-live="polite">
                {errors.length ? (
                  <span>A AWS recusaria esta configuração: {errors.join('; ')}.</span>
                ) : (
                  <span>
                    Entrega {fmt(perf!.iops)} IOPS e {fmt(perf!.throughput)} MiB/s · <strong>{usd(dbMonthly(v, config.region).total)}/mês</strong>
                  </span>
                )}
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
          <li>O motor é sempre o PostgreSQL; os limites e preços de outros motores são diferentes.</li>
          <li>A carga é descrita só por vCPU, memória, espaço, IOPS e throughput. Na vida real, consultas, índices e conexões também decidem o tamanho.</li>
          <li>O desempenho real também depende da classe (limite de IOPS e banda de EBS de cada uma) e do tamanho de cada operação de I/O.</li>
          <li>Custo de instância e armazenamento sob demanda, sem backups acima do espaço gratuito, sem instâncias reservadas e sem transferência de dados.</li>
        </ul>
      </details>
    </div>
  )
}
