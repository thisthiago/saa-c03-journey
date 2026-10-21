/** Interface do laboratório de alta disponibilidade do RDS: uma topologia por banco, com as falhas simuladas ao vivo. */
import type { Evaluation } from '../../engine/types'
import { renderInline } from '../../ui/inline'
import { usd } from '../compute-prices'
import { DB_PRICE_DATE } from '../database-prices'
import { FactTag, PremiseTag } from '../shared/Tags'
import c from '../shared/compute.module.css'
import sh from '../shared/lab.module.css'
import { EMPTY_TOPOLOGY, type RdsHaLabConfig, type RdsHaLabResponse } from './lab'
import { BACKUP_OPTIONS, DEPLOYMENT_NAME, FAILURE_LABEL, formatSeconds, haMonthly, LOSS_LABEL, lossAtMost, readers, simulateFailure, validateTopology, type HaDeployment, type HaNeed, type Loss, type Topology } from './model'

interface Props {
  config: RdsHaLabConfig
  value: RdsHaLabResponse
  onChange: (v: RdsHaLabResponse) => void
  disabled: boolean
  evaluation?: Evaluation | null
}

const MAX_LOSS: Record<Loss, string> = { none: 'sem perder dados', seconds: 'perdendo no máximo alguns segundos', minutes: 'perdendo no máximo 5 minutos', total: 'mesmo perdendo os dados' }

function needList(n: HaNeed): string[] {
  const out = n.survive.map((s) => `Aguentar ${FAILURE_LABEL[s.failure]} ${MAX_LOSS[s.maxLoss]}${Number.isFinite(s.maxDowntime) ? ` e voltar a gravar em até ${formatSeconds(s.maxDowntime)}` : ''}`)
  if (n.minReaders) out.push(`${n.minReaders} instância(s) atendendo leituras além da principal`)
  if (n.pitrDays) out.push(`Restaurar o banco como estava em qualquer momento dos últimos ${n.pitrDays} dia(s)`)
  if (n.connectionStorm) out.push('Picos de milhares de conexões curtas, abertas por funções Lambda')
  return out
}

export function RdsHaLab({ config, value, onChange, disabled, evaluation }: Props) {
  const set = (id: string, t: Topology) => onChange({ topologies: { ...value.topologies, [id]: t } })
  return (
    <div className={sh.lab}>
      <p className={c.legend}>
        <FactTag date="21/10/2026" /> failover do Multi-AZ em geral de 60 a 120 s e do cluster Multi-AZ abaixo de 35 s; réplicas assíncronas; logs no S3 a cada 5 minutos · <PremiseTag /> promoção de réplica em 10 min, restauração em 30 min e recuperação Single-AZ em 15 min · preços da AWS Price List ({DB_PRICE_DATE}).
      </p>
      {config.scenarios.map((s) => {
        const t = value.topologies?.[s.id] ?? EMPTY_TOPOLOGY
        const patch = (part: Partial<Topology>) => set(s.id, { ...t, ...part })
        const errors = validateTopology(t)
        const fb = evaluation?.items.find((i) => i.id === s.id)
        const cost = haMonthly(t, s.cls, config.region)
        return (
          <section key={s.id} className={sh.card} aria-label={s.name}>
            <h4 className={sh.title}>{s.name}</h4>
            <p className={sh.desc}>
              {renderInline(s.description)} Classe: <span className={c.mono}>{s.cls}</span>.
            </p>
            <ul className={c.needs}>
              {needList(s.need).map((n) => (
                <li key={n}>{n}</li>
              ))}
            </ul>
            <div className={c.row}>
              <label className={c.field}>
                <span>Implantação</span>
                <select className={c.select} value={t.deployment} disabled={disabled} onChange={(e) => patch({ deployment: e.target.value as HaDeployment })}>
                  {(Object.keys(DEPLOYMENT_NAME) as HaDeployment[]).map((d) => (
                    <option key={d} value={d}>
                      {DEPLOYMENT_NAME[d]}
                    </option>
                  ))}
                </select>
              </label>
              <label className={c.field}>
                <span>Réplicas de leitura</span>
                <input className={c.input} type="number" min={0} max={15} value={t.replicas} disabled={disabled} onChange={(e) => patch({ replicas: Number(e.target.value) })} style={{ width: '6em' }} />
              </label>
              <label className={c.field}>
                <span>Backup automático</span>
                <select className={c.select} value={t.backupDays} disabled={disabled} onChange={(e) => patch({ backupDays: Number(e.target.value) })}>
                  {BACKUP_OPTIONS.map((d) => (
                    <option key={d} value={d}>
                      {d === 0 ? 'desligado (0 dias)' : `${d} dia(s)`}
                    </option>
                  ))}
                </select>
              </label>
              <label className={c.field}>
                <span>Outra Região</span>
                <span>
                  <input type="checkbox" checked={t.crossRegionReplica} disabled={disabled} onChange={(e) => patch({ crossRegionReplica: e.target.checked })} /> réplica de leitura
                </span>
              </label>
              <label className={c.field}>
                <span>Conexões</span>
                <span>
                  <input type="checkbox" checked={t.proxy} disabled={disabled} onChange={(e) => patch({ proxy: e.target.checked })} /> RDS Proxy
                </span>
              </label>
            </div>
            {errors.length > 0 ? (
              <p className={c.cost}>A AWS recusaria esta configuração: {errors.join('; ')}.</p>
            ) : (
              <>
                <div className={c.scroll}>
                  <table className={c.table}>
                    <thead>
                      <tr>
                        <th scope="col">Falha</th>
                        <th scope="col">O que acontece</th>
                        <th scope="col">Dados</th>
                        <th scope="col">Sem escritas</th>
                      </tr>
                    </thead>
                    <tbody>
                      {s.need.survive.map((req) => {
                        const r = simulateFailure(t, req.failure)
                        const ok = lossAtMost(r.loss, req.maxLoss) && r.downtime <= req.maxDowntime
                        return (
                          <tr key={req.failure} data-ok={ok}>
                            <td>
                              {ok ? '✓' : '✗'} {FAILURE_LABEL[req.failure]}
                            </td>
                            <td>{r.how}</td>
                            <td>{LOSS_LABEL[r.loss]}</td>
                            <td>{Number.isFinite(r.downtime) ? `cerca de ${formatSeconds(r.downtime)}` : 'até a falha passar'}</td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
                <p className={c.cost} aria-live="polite">
                  Leitores além da principal: {readers(t)} · <strong>{usd(cost.total)}/mês</strong>
                  {cost.proxy > 0 && ` (RDS Proxy: ${usd(cost.proxy)})`}
                </p>
              </>
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
          <li>O custo inclui só as instâncias (e o RDS Proxy); armazenamento, backup e transferência entre Regiões ficam de fora.</li>
          <li>O cluster Multi-AZ é cobrado como três instâncias da mesma classe. Na AWS, ele usa classes próprias, com preço próprio.</li>
          <li>Promover uma réplica, restaurar um backup e recuperar uma instância Single-AZ levam tempos fixos do cenário. Na vida real, dependem do tamanho do banco e da carga.</li>
          <li>As réplicas de leitura ficam em AZs diferentes da principal.</li>
        </ul>
      </details>
    </div>
  )
}
