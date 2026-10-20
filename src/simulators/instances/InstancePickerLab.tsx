/** Interface do laboratório de dimensionamento: tabela dos tipos e escolha por carga. */
import type { Evaluation } from '../../engine/types'
import { renderInline } from '../../ui/inline'
import { HOURS_PER_MONTH, instancePrice, PRICE_DATE, usd } from '../compute-prices'
import { FactTag, PremiseTag } from '../shared/Tags'
import c from '../shared/compute.module.css'
import sh from '../shared/lab.module.css'
import type { InstancePickerLabConfig, InstancePickerLabResponse } from './lab'
import { BURST_BASELINE, CATEGORY_LABEL, parseInstanceType, workloadMonthly, type WorkloadNeeds } from './model'

interface Props {
  config: InstancePickerLabConfig
  value: InstancePickerLabResponse
  onChange: (v: InstancePickerLabResponse) => void
  disabled: boolean
  evaluation?: Evaluation | null
}

function needsList(n: WorkloadNeeds): string[] {
  const out = [`pelo menos ${n.vcpu} vCPU e ${n.memoryGiB} GiB de memória`]
  if (n.windows) out.push('roda Windows Server')
  else if (n.arch === 'x86_64') out.push('o software só tem versão para x86 (Intel ou AMD)')
  else if (n.arch === 'arm64') out.push('o software foi compilado para Arm')
  if (n.gpu) out.push('precisa de GPU NVIDIA')
  if (n.mlInference) out.push('faz inferência de modelos de ML')
  if (n.localNvme) out.push('precisa de disco NVMe local, muito rápido, para dados temporários')
  if (n.avgCpu !== undefined) out.push(`usa em média ${Math.round(n.avgCpu * 100)}% da CPU ao longo do dia`)
  return out
}

const processor = (type: string) => {
  const p = instancePrice(type)
  return p.arch === 'arm64' ? 'Graviton (Arm)' : /AMD/i.test(p.processor) ? 'AMD' : 'Intel'
}

const accelerator = (type: string) => {
  const s = parseInstanceType(type).series
  return s === 'g' || s === 'p' ? 'GPU NVIDIA' : s === 'inf' ? 'Inferentia' : '—'
}

export function InstancePickerLab({ config, value, onChange, disabled, evaluation }: Props) {
  return (
    <div className={sh.lab}>
      <details className={c.ref} open>
        <summary>Tipos disponíveis</summary>
        <p className={c.legend}>
          <FactTag date={PRICE_DATE} /> especificações e preço On-Demand de Linux em {config.region ?? 'us-east-1'}, da AWS Price List. Estimativa com {HOURS_PER_MONTH} horas por mês.
        </p>
        <div className={c.scroll}>
          <table className={c.table}>
            <thead>
              <tr>
                <th scope="col">Tipo</th>
                <th scope="col">Família</th>
                <th scope="col" className={c.num}>vCPU</th>
                <th scope="col" className={c.num}>Memória</th>
                <th scope="col">Processador</th>
                <th scope="col">Acelerador</th>
                <th scope="col">Disco local</th>
                <th scope="col" className={c.num}>US$/hora</th>
              </tr>
            </thead>
            <tbody>
              {config.candidates.map((t) => {
                const p = instancePrice(t, config.region)
                return (
                  <tr key={t}>
                    <th scope="row">{t}</th>
                    <td>
                      {CATEGORY_LABEL[parseInstanceType(t).category]}
                      {t in BURST_BASELINE && <span className={c.muted}> · baseline de {Math.round(BURST_BASELINE[t] * 100)}% por vCPU</span>}
                    </td>
                    <td className={c.num}>{p.vcpu}</td>
                    <td className={c.num}>{p.memoryGiB} GiB</td>
                    <td>{processor(t)}</td>
                    <td>{accelerator(t)}</td>
                    <td>{p.storage === 'EBS only' ? 'só EBS' : p.storage.replace(' x ', ' × ')}</td>
                    <td className={c.num}>{usd(p.onDemandHour)}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </details>

      {config.workloads.map((w) => {
        const pick = value.picks?.[w.id]
        const fb = evaluation?.items.find((i) => i.id === w.id)
        return (
          <section key={w.id} className={sh.card} aria-label={w.name}>
            <h4 className={sh.title}>{w.name}</h4>
            <p className={sh.desc}>{renderInline(w.description)}</p>
            <ul className={c.needs}>
              {needsList(w.needs).map((n) => (
                <li key={n}>{n}</li>
              ))}
            </ul>
            <div className={c.row}>
              <label className={c.field}>
                <span>Tipo de instância</span>
                <select className={c.select} value={pick ?? ''} disabled={disabled} onChange={(e) => onChange({ picks: { ...value.picks, [w.id]: e.target.value || undefined } })}>
                  <option value="">Escolha um tipo</option>
                  {config.candidates.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </label>
              {pick && (
                <p className={c.cost}>
                  Custo para esta carga: <strong>{usd(workloadMonthly(pick, w.needs, config.region))}/mês</strong>
                  {pick in BURST_BASELINE && w.needs.avgCpu !== undefined && <PremiseTag label="CPU média da carga: premissa" />}
                </p>
              )}
            </div>
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
          <li>Uma carga cabe no tipo quando vCPU e memória bastam. Rede, disco e desempenho por núcleo não entram na conta.</li>
          <li>As burstable rodam em modo unlimited (o padrão das famílias atuais): acima da baseline, a média de 24 horas gera excedente cobrado por vCPU-hora, com o preço da tabela.</li>
          <li>Preço On-Demand de Linux, sem Savings Plans, Reserved Instances, Spot, EBS ou transferência de dados.</li>
        </ul>
      </details>
    </div>
  )
}
