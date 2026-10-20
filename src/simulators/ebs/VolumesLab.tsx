/** Interface do laboratório de volumes EBS: guia dos tipos e um volume configurável por carga. */
import type { Evaluation } from '../../engine/types'
import { renderInline } from '../../ui/inline'
import { computePrices, PRICE_DATE, usd } from '../compute-prices'
import { FactTag } from '../shared/Tags'
import c from '../shared/compute.module.css'
import sh from '../shared/lab.module.css'
import type { VolumesLabConfig, VolumesLabResponse } from './lab'
import { performance, validateVolume, VOLUME_SPECS, VOLUME_TYPES, volumeMonthly, type VolumeConfig, type VolumeNeed, type VolumeType } from './model'

interface Props {
  config: VolumesLabConfig
  value: VolumesLabResponse
  onChange: (v: VolumesLabResponse) => void
  disabled: boolean
  evaluation?: Evaluation | null
}

const fmt = (n: number) => Math.round(n).toLocaleString('pt-BR')

function needList(n: VolumeNeed): string[] {
  const out = [`pelo menos ${fmt(n.minGiB)} GiB`, `${fmt(n.iops)} IOPS e ${fmt(n.throughput)} MiB/s`]
  if (n.boot) out.push('é o volume de boot da instância')
  if (n.multiAttach) out.push('precisa ser anexado a várias instâncias ao mesmo tempo')
  if (n.highDurability) out.push('é crítico: pede a maior durabilidade disponível')
  return out
}

/** Valores iniciais ao escolher um tipo: o mínimo de cada um. */
function defaults(type: VolumeType, need: VolumeNeed, prev?: VolumeConfig): VolumeConfig {
  const s = VOLUME_SPECS[type]
  const size = Math.min(s.maxGiB, Math.max(s.minGiB, prev?.sizeGiB ?? need.minGiB))
  if (type === 'gp3') return { type, sizeGiB: size, iops: 3000, throughput: 125 }
  if (type === 'io2' || type === 'io1') return { type, sizeGiB: size, iops: Math.min(prev?.iops ?? 3000, s.maxIops) }
  return { type, sizeGiB: size }
}

function NumberField({ label, value, onChange, disabled, step = 1 }: { label: string; value: number | undefined; onChange: (v: number) => void; disabled: boolean; step?: number }) {
  return (
    <label className={c.field}>
      <span>{label}</span>
      <input className={c.input} type="number" inputMode="numeric" min={0} step={step} value={value ?? ''} disabled={disabled} onChange={(e) => onChange(Number(e.target.value))} style={{ width: '9em' }} />
    </label>
  )
}

export function VolumesLab({ config, value, onChange, disabled, evaluation }: Props) {
  const types = config.types ?? VOLUME_TYPES
  const p = computePrices(config.region).ebs
  const set = (id: string, v: VolumeConfig | undefined) => onChange({ volumes: { ...value.volumes, [id]: v } })
  const price: Record<VolumeType, string> = {
    gp3: `${usd(p.gp3.gbMonth)}/GiB · ${usd(p.gp3.iopsMonth)} por IOPS acima de 3.000 · ${usd(p.gp3.throughputMiBpsMonth)} por MiB/s acima de 125`,
    gp2: `${usd(p.gp2.gbMonth)}/GiB (IOPS crescem com o tamanho)`,
    io2: `${usd(p.io2.gbMonth)}/GiB · ${usd(p.io2.iopsMonthTiers[0].price)} por IOPS (faixas menores acima de 32.000)`,
    io1: `${usd(p.io1.gbMonth)}/GiB · ${usd(p.io1.iopsMonth)} por IOPS`,
    st1: `${usd(p.st1.gbMonth)}/GiB`,
    sc1: `${usd(p.sc1.gbMonth)}/GiB`,
  }
  return (
    <div className={sh.lab}>
      <details className={c.ref} open>
        <summary>Tipos de volume</summary>
        <p className={c.legend}>
          <FactTag date="20/10/2026" /> limites da documentação do EBS · preços por mês da AWS Price List ({PRICE_DATE}), {config.region ?? 'us-east-1'}.
        </p>
        <div className={c.scroll}>
          <table className={c.table}>
            <thead>
              <tr>
                <th scope="col">Tipo</th>
                <th scope="col">Tamanho</th>
                <th scope="col" className={c.num}>IOPS máx.</th>
                <th scope="col" className={c.num}>MiB/s máx.</th>
                <th scope="col">Boot</th>
                <th scope="col">Multi-Attach</th>
                <th scope="col">Preço</th>
              </tr>
            </thead>
            <tbody>
              {types.map((t) => {
                const s = VOLUME_SPECS[t]
                return (
                  <tr key={t}>
                    <th scope="row">{t}</th>
                    <td>
                      {fmt(s.minGiB)} a {fmt(s.maxGiB)} GiB
                    </td>
                    <td className={c.num}>{fmt(s.maxIops)}</td>
                    <td className={c.num}>{fmt(s.maxThroughput)}</td>
                    <td>{s.boot ? 'sim' : 'não'}</td>
                    <td>{s.multiAttach ? 'sim' : 'não'}</td>
                    <td>{price[t]}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        <p className={c.legend}>gp3: 3.000 IOPS e 125 MiB/s inclusos em qualquer tamanho; acima disso, até 500 IOPS por GiB e 0,25 MiB/s por IOPS. gp2: 3 IOPS por GiB (mínimo 100); 128 MiB/s até 170 GiB, 250 MiB/s acima. io2: até 1.000 IOPS por GiB. io1: até 50.</p>
      </details>

      {config.workloads.map((w) => {
        const v = value.volumes?.[w.id]
        const fb = evaluation?.items.find((i) => i.id === w.id)
        const errors = v ? validateVolume(v) : []
        const perf = v && errors.length === 0 ? performance(v) : undefined
        const patch = (part: Partial<VolumeConfig>) => v && set(w.id, { ...v, ...part })
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
                <span>Tipo</span>
                <select className={c.select} value={v?.type ?? ''} disabled={disabled} onChange={(e) => set(w.id, e.target.value ? defaults(e.target.value as VolumeType, w.need, v) : undefined)}>
                  <option value="">Escolha um tipo</option>
                  {types.map((t) => (
                    <option key={t} value={t}>
                      {VOLUME_SPECS[t].name}
                    </option>
                  ))}
                </select>
              </label>
              {v && <NumberField label="Tamanho (GiB)" value={v.sizeGiB} disabled={disabled} onChange={(n) => patch({ sizeGiB: n })} />}
              {v && (v.type === 'gp3' || v.type === 'io2' || v.type === 'io1') && <NumberField label="IOPS" value={v.iops} step={100} disabled={disabled} onChange={(n) => patch({ iops: n })} />}
              {v?.type === 'gp3' && <NumberField label="Throughput (MiB/s)" value={v.throughput} step={5} disabled={disabled} onChange={(n) => patch({ throughput: n })} />}
              {v && VOLUME_SPECS[v.type].multiAttach && (
                <label className={c.field}>
                  <span>Multi-Attach</span>
                  <input type="checkbox" checked={Boolean(v.multiAttach)} disabled={disabled} onChange={(e) => patch({ multiAttach: e.target.checked || undefined })} />
                </label>
              )}
            </div>
            {v && (
              <p className={c.cost} aria-live="polite">
                {errors.length ? (
                  <span>A AWS recusaria esta configuração: {errors.join('; ')}.</span>
                ) : (
                  <span>
                    Entrega {fmt(perf!.iops)} IOPS e {fmt(perf!.throughput)} MiB/s · <strong>{usd(volumeMonthly(v, config.region))}/mês</strong>
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
          <li>st1 e sc1 entregam o throughput máximo do tipo em qualquer tamanho; na AWS, ele cresce com o tamanho do volume.</li>
          <li>O burst do gp2 (créditos de I/O) não entra no desempenho: conta só a baseline.</li>
          <li>O desempenho real também depende da instância (EBS-optimized, limites por tipo) e do tamanho de cada operação de I/O.</li>
          <li>Custo de armazenamento e de desempenho provisionado, sem snapshots nem transferência de dados.</li>
        </ul>
      </details>
    </div>
  )
}
