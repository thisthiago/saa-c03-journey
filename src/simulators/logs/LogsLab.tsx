/** Interface do laboratório de logs: linhas de exemplo marcadas pelo filtro escolhido, classe, retenção e custo mensal. */
import type { Evaluation } from '../../engine/types'
import { renderInline } from '../../ui/inline'
import { usd } from '../compute-prices'
import { governancePrices, GOV_PRICE_DATE } from '../governance-prices'
import { FactTag, PremiseTag } from '../shared/Tags'
import c from '../shared/compute.module.css'
import sh from '../shared/lab.module.css'
import a from './logs.module.css'
import { logsLabInitial, planProblems, type LogChoice, type LogScenario, type LogsLabConfig, type LogsLabResponse } from './lab'
import { CLASS_LABEL, logsMonthly, matchedLines, NEVER, retentionLabel, type LogClass } from './model'

interface Props {
  config: LogsLabConfig
  value: LogsLabResponse
  onChange: (v: LogsLabResponse) => void
  disabled: boolean
  evaluation?: Evaluation | null
}

export function LogsLab({ config, value, onChange, disabled, evaluation }: Props) {
  const p = governancePrices(config.region).cloudwatch
  const initial = logsLabInitial(config)
  const set = (s: LogScenario, patch: Partial<LogChoice>) => onChange({ choices: { ...value.choices, [s.id]: { ...(value.choices?.[s.id] ?? initial.choices[s.id]), ...patch } } })
  return (
    <div className={sh.lab}>
      <p className={c.legend}>
        <FactTag date="21/10/2026" /> o filtro de métrica e o de assinatura só existem na classe Standard; a classe Infrequent Access muda só o preço da ingestão; a retenção padrão é guardar para sempre; os padrões diferenciam maiúsculas de minúsculas · <PremiseTag /> o volume de cada grupo e o que ele ocupa depois de compactado · preços da AWS Price List ({GOV_PRICE_DATE}): ingestão {usd(p.logIngestGB)} por GB (Standard) e {usd(p.logIngestInfrequentGB)} (Infrequent Access), armazenamento {usd(p.logStorageGBMonth)} por GB-mês, consulta {usd(p.logInsightsScannedGB)} por GB lido.
      </p>
      {config.scenarios.map((s) => {
        const ch = value.choices?.[s.id] ?? initial.choices[s.id] ?? {}
        const cls = ch.cls ?? 'standard'
        const days = ch.retention ?? NEVER
        const picked = s.patterns?.find((x) => x.id === ch.pattern)
        const counted = new Set(picked ? matchedLines(picked.pattern, s.lines) : [])
        const problems = planProblems(s, ch)
        const cost = logsMonthly(s.volume, cls, days, config.region)
        const fbs = evaluation?.items.filter((i) => i.id.startsWith(`${s.id}:`)) ?? []
        return (
          <section key={s.id} className={sh.card} aria-label={s.name}>
            <h4 className={sh.title}>{s.name}</h4>
            <p className={sh.desc}>{renderInline(s.description)}</p>
            <ul className={c.needs}>
              {s.metricGoal && <li>{s.metricGoal}</li>}
              {s.rules.map((r) => (
                <li key={r}>{r}</li>
              ))}
              <li>
                Volume: {s.volume.ingestGBPerDay.toLocaleString('pt-BR')} GB por dia enviados, {s.volume.storedGBPerDay.toLocaleString('pt-BR')} GB por dia armazenados e {s.volume.insightsScannedGBPerMonth.toLocaleString('pt-BR')} GB lidos por mês nas consultas
              </li>
            </ul>
            {s.patterns && (
              <label className={c.field}>
                <span>Padrão do filtro de métrica</span>
                <select className={c.select} value={ch.pattern ?? ''} disabled={disabled} onChange={(e) => set(s, { pattern: e.target.value || undefined })}>
                  <option value="">Escolha</option>
                  {s.patterns.map((x) => (
                    <option key={x.id} value={x.id}>
                      {x.pattern}
                    </option>
                  ))}
                </select>
              </label>
            )}
            <div className={a.lines} role="group" aria-label="Linhas de exemplo do log">
              {s.lines.map((l, i) => (
                <div key={i} className={a.line} data-counted={counted.has(i)}>
                  <span className={a.mark} aria-hidden="true">
                    {counted.has(i) ? '●' : '○'}
                  </span>
                  <code>{l}</code>
                  <span className={c.muted + ' ' + a.sr}>{counted.has(i) ? 'contada pelo filtro' : 'não contada'}</span>
                </div>
              ))}
            </div>
            {picked && (
              <p className={c.cost} aria-live="polite">
                O filtro conta {counted.size} de {s.lines.length} linhas de exemplo.
              </p>
            )}
            <div className={c.row}>
              <label className={c.field}>
                <span>Classe do grupo</span>
                <select className={c.select} value={cls} disabled={disabled} onChange={(e) => set(s, { cls: e.target.value as LogClass })}>
                  {(Object.keys(CLASS_LABEL) as LogClass[]).map((k) => (
                    <option key={k} value={k}>
                      {CLASS_LABEL[k]}
                    </option>
                  ))}
                </select>
              </label>
              <label className={c.field}>
                <span>Retenção</span>
                <select className={c.select} value={days} disabled={disabled} onChange={(e) => set(s, { retention: Number(e.target.value) })}>
                  {s.retentionOptions.map((d) => (
                    <option key={d} value={d}>
                      {retentionLabel(d)}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            {problems.length > 0 ? (
              <p className={c.cost}>Esta configuração não cumpre as regras: {problems.join('; ')}.</p>
            ) : (
              <p className={c.cost} aria-live="polite">
                Ingestão {usd(cost.ingest)} + armazenamento {usd(cost.storage)} + consultas {usd(cost.queries)} = <strong>{usd(cost.total)}/mês</strong>
              </p>
            )}
            {fbs.map((fb) => (
              <div key={fb.id} className={sh.verdict} data-status={fb.status} aria-live="polite">
                <strong>{fb.label}</strong>
                <span>{renderInline(fb.message ?? '')}</span>
              </div>
            ))}
          </section>
        )
      })}
      <details className={sh.simp}>
        <summary>Simplificações deste simulador</summary>
        <ul>
          <li>O armazenamento é cobrado pelo volume já compactado, que o cenário informa por dia. Sem expiração, a conta é a do 5º ano, com cinco anos de dados guardados.</li>
          <li>O custo inclui só ingestão, armazenamento e consultas do Logs Insights; exportações para o S3, entrega a destinos de assinatura e o nível gratuito ficam de fora.</li>
          <li>Os padrões de filtro cobrem termos, termos opcionais, frases e comparações em JSON; padrões para logs separados por espaço e expressões regulares ficam de fora.</li>
          <li>O filtro de métrica só conta eventos que chegam depois de ele ser criado.</li>
        </ul>
      </details>
    </div>
  )
}
