/** Interface do laboratório do CloudTrail: opções da trilha, requisitos atendidos e custo dos eventos pagos. */
import type { Evaluation } from '../../engine/types'
import { renderInline } from '../../ui/inline'
import { usd } from '../compute-prices'
import { governancePrices, GOV_PRICE_DATE } from '../governance-prices'
import { FactTag, PremiseTag } from '../shared/Tags'
import c from '../shared/compute.module.css'
import sh from '../shared/lab.module.css'
import { emptyChoice, toSetup, type TrailChoice, type TrailLabConfig, type TrailLabResponse, type TrailScenario } from './lab'
import { DATA_LABEL, MANAGEMENT_LABEL, needMet, NEED_LABEL, trailMonthly, type DataScope, type ManagementScope } from './model'

interface Props {
  config: TrailLabConfig
  value: TrailLabResponse
  onChange: (v: TrailLabResponse) => void
  disabled: boolean
  evaluation?: Evaluation | null
}

const fmt = (n: number) => n.toLocaleString('pt-BR')

export function TrailLab({ config, value, onChange, disabled, evaluation }: Props) {
  const p = governancePrices(config.region).cloudtrail
  const set = (s: TrailScenario, patch: Partial<TrailChoice>) => onChange({ choices: { ...value.choices, [s.id]: { ...(value.choices?.[s.id] ?? emptyChoice()), ...patch } } })
  return (
    <div className={sh.lab}>
      <p className={c.legend}>
        <FactTag date="21/10/2026" /> o histórico de eventos guarda 90 dias de eventos de gerenciamento, sem custo; eventos de dados vêm desligados e são cobrados; uma trilha entrega uma cópia dos eventos de gerenciamento sem custo da CloudTrail · <PremiseTag /> o volume de eventos de cada conta · preços da AWS Price List ({GOV_PRICE_DATE}): eventos de dados {usd(p.dataEventPer100k)} por 100 mil, eventos do Insights {usd(p.insightsEventPer100k)} por 100 mil analisados.
      </p>
      {config.scenarios.map((s) => {
        const ch = value.choices?.[s.id] ?? emptyChoice()
        const setup = toSetup(s, ch)
        const cost = trailMonthly(setup, s.volume, config.region)
        const fb = evaluation?.items.find((i) => i.id === s.id)
        const off = disabled || !ch.create
        return (
          <section key={s.id} className={sh.card} aria-label={s.name}>
            <h4 className={sh.title}>{s.name}</h4>
            <p className={sh.desc}>{renderInline(s.description)}</p>
            <ul className={c.needs}>
              {s.needs.map((n) => (
                <li key={n} data-met={needMet(n, setup)}>
                  {needMet(n, setup) ? '✓' : '✗'} {NEED_LABEL[n]}
                </li>
              ))}
              <li>
                Por mês: {fmt(s.volume.managementEvents)} eventos de gerenciamento, {fmt(s.volume.sensitiveDataEvents)} eventos de dados do bucket sensível e {fmt(s.volume.otherDataEvents)} dos demais buckets
              </li>
            </ul>
            <div className={c.row}>
              <label className={c.field}>
                <span>Trilha</span>
                <span>
                  <input type="checkbox" checked={ch.create} disabled={disabled} onChange={(e) => set(s, { create: e.target.checked })} /> criar uma trilha (arquivos no S3)
                </span>
              </label>
              <label className={c.field}>
                <span>Regiões</span>
                <span>
                  <input type="checkbox" checked={ch.multiRegion} disabled={off} onChange={(e) => set(s, { multiRegion: e.target.checked })} /> todas as Regiões
                </span>
              </label>
              <label className={c.field}>
                <span>Contas</span>
                <span>
                  <input type="checkbox" checked={ch.organization} disabled={off} onChange={(e) => set(s, { organization: e.target.checked })} /> trilha da organização
                </span>
              </label>
              <label className={c.field}>
                <span>Eventos de gerenciamento</span>
                <select className={c.select} value={ch.management} disabled={off} onChange={(e) => set(s, { management: e.target.value as ManagementScope })}>
                  {(Object.keys(MANAGEMENT_LABEL) as ManagementScope[]).map((m) => (
                    <option key={m} value={m}>
                      {MANAGEMENT_LABEL[m]}
                    </option>
                  ))}
                </select>
              </label>
              <label className={c.field}>
                <span>Eventos de dados do S3</span>
                <select className={c.select} value={ch.data} disabled={off} onChange={(e) => set(s, { data: e.target.value as DataScope })}>
                  {(Object.keys(DATA_LABEL) as DataScope[]).map((m) => (
                    <option key={m} value={m}>
                      {DATA_LABEL[m]}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <div className={c.row}>
              <label className={c.field}>
                <span>Recursos extras</span>
                <span>
                  <input type="checkbox" checked={ch.validation} disabled={off} onChange={(e) => set(s, { validation: e.target.checked })} /> validação de integridade
                </span>
              </label>
              <label className={c.field}>
                <span>&nbsp;</span>
                <span>
                  <input type="checkbox" checked={ch.cloudWatchLogs} disabled={off} onChange={(e) => set(s, { cloudWatchLogs: e.target.checked })} /> enviar ao CloudWatch Logs
                </span>
              </label>
              <label className={c.field}>
                <span>&nbsp;</span>
                <span>
                  <input type="checkbox" checked={ch.insights} disabled={off} onChange={(e) => set(s, { insights: e.target.checked })} /> CloudTrail Insights
                </span>
              </label>
            </div>
            <p className={c.cost} aria-live="polite">
              Eventos pagos: dados {usd(cost.dataEvents)} + Insights {usd(cost.insights)} = <strong>{usd(cost.total)}/mês</strong>
            </p>
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
          <li>O custo inclui só eventos de dados e do Insights; o armazenamento dos arquivos no S3, o CloudWatch Logs e o CloudTrail Lake ficam de fora.</li>
          <li>Os eventos de dados cobrem só o S3 e dividem o volume em &quot;bucket sensível&quot; e &quot;demais buckets&quot;; a AWS permite filtrar também por outros critérios.</li>
          <li>O Insights é cobrado sobre os eventos de gerenciamento analisados no mês.</li>
          <li>Uma trilha guarda os arquivos no S3 pelo tempo que o bucket mantiver; a retenção do bucket não é simulada.</li>
        </ul>
      </details>
    </div>
  )
}
