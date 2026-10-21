/** Interface do laboratório "O processamento da noite": nós de cada grupo, Spot ou On-Demand, com tempo, resultado e custo ao vivo. */
import type { Evaluation } from '../../engine/types'
import { renderInline } from '../../ui/inline'
import { instancePrice, PRICE_DATE, usd } from '../compute-prices'
import { SPOT_DISCOUNT } from '../purchase/model'
import { FactTag, JudgementTag, PremiseTag } from '../shared/Tags'
import c from '../shared/compute.module.css'
import sh from '../shared/lab.module.css'
import n from '../shared/net.module.css'
import { EMR_INITIAL, type EmrLabConfig, type EmrLabResponse } from './lab'
import { OUTCOME_LABEL, ROLE_LABEL, runJob, type EmrCluster, type NodeRole } from './model'

interface Props {
  config: EmrLabConfig
  value: EmrLabResponse
  onChange: (v: EmrLabResponse) => void
  disabled: boolean
  evaluation?: Evaluation | null
}

const ROLES: NodeRole[] = ['primary', 'core', 'task']
const fmtH = (h: number) => `${h.toLocaleString('pt-BR', { maximumFractionDigits: 1 })} h`

export function EmrLab({ config, value, onChange, disabled, evaluation }: Props) {
  return (
    <div className={sh.lab}>
      <p className={c.legend}>
        <FactTag date="21/10/2026" /> sem o nó primário, o cluster termina; nós core guardam o HDFS; nós task só processam · preços da AWS Price List ({PRICE_DATE}), On-Demand por hora · <PremiseTag /> um lote por nó core ou task por hora, desconto de {Math.round(SPOT_DISCOUNT * 100)}% no Spot e a retomada de instâncias Spot descrita em cada job · <JudgementTag /> menor custo entre os clusters que terminam no prazo.
      </p>
      {config.jobs.map((j) => {
        const cl = value.clusters?.[j.id] ?? EMR_INITIAL
        const set = (role: NodeRole, patch: Partial<EmrCluster[NodeRole]>) => onChange({ clusters: { ...value.clusters, [j.id]: { ...cl, [role]: { ...cl[role], ...patch } } } })
        const run = runJob(j, cl, config.region)
        const fb = evaluation?.items.find((i) => i.id === j.id)
        const max: Record<NodeRole, number> = { primary: 3, core: j.maxCore, task: j.maxTask }
        const min: Record<NodeRole, number> = { primary: 1, core: 1, task: 0 }
        return (
          <section key={j.id} className={sh.card} aria-label={j.name}>
            <h4 className={sh.title}>{j.name}</h4>
            <p className={sh.desc}>{renderInline(j.description)}</p>
            <ul className={c.needs}>
              <li>
                {j.batches} lotes, prazo de {fmtH(j.deadlineHours)}, instâncias <span className={c.mono}>{j.instanceType}</span> a {usd(instancePrice(j.instanceType, config.region).onDemandHour)}/h On-Demand
              </li>
              <li>{j.usesHdfs ? 'Guarda dados intermediários no HDFS dos nós core' : 'Lê e grava direto no S3, sem depender do HDFS'}</li>
              <li>
                Pior noite do mês: depois de {fmtH(j.spotEvent.atHour)}, a AWS retoma {Math.round(j.spotEvent.share * 100)}% das instâncias Spot de cada grupo, sem reposição
              </li>
              {j.needsHa && <li>O cluster não pode parar se um nó primário falhar</li>}
            </ul>
            <div className={c.row}>
              {ROLES.map((role) => (
                <fieldset key={role} className={c.field} style={{ border: 0, padding: 0, margin: 0 }}>
                  <span>{ROLE_LABEL[role]}</span>
                  <select className={c.select} value={cl[role].count} disabled={disabled} onChange={(e) => set(role, { count: Number(e.target.value) })} aria-label={`Nós ${ROLE_LABEL[role].toLowerCase()}`}>
                    {(role === 'primary' ? [1, 3] : Array.from({ length: max[role] - min[role] + 1 }, (_, i) => min[role] + i)).map((k) => (
                      <option key={k} value={k}>
                        {k} {k === 1 ? 'nó' : 'nós'}
                      </option>
                    ))}
                  </select>
                  <label>
                    <input type="checkbox" checked={cl[role].spot} disabled={disabled || cl[role].count === 0} onChange={(e) => set(role, { spot: e.target.checked })} /> Spot
                  </label>
                </fieldset>
              ))}
            </div>
            <p className={c.cost} aria-live="polite">
              <span className={n.status} data-ok={run.outcome === 'ok'}>
                {run.outcome === 'ok' ? '✓' : '✗'}
              </span>{' '}
              {run.outcome === 'ok' || run.outcome === 'late' ? `Termina em ${fmtH(run.hours)}: ${OUTCOME_LABEL[run.outcome]}` : `O job ${OUTCOME_LABEL[run.outcome]}`} · custo da noite <strong>{usd(run.cost)}</strong>
            </p>
            <p className={c.muted}>{run.trace.join(' ')}</p>
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
          <li>Cada nó core ou task processa um lote por hora, sem tempo de partida; o primário só coordena.</li>
          <li>A retomada de instâncias Spot acontece uma vez, na hora indicada, e as instâncias não são repostas; um grupo primário em Spot é retomado inteiro.</li>
          <li>Perder um nó core com dados no HDFS faz o job falhar; na prática, depende da replicação dos blocos.</li>
          <li>A taxa do EMR por instância e o armazenamento ficam fora da conta.</li>
        </ul>
      </details>
    </div>
  )
}
