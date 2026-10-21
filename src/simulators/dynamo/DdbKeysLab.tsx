/** Interface do laboratório de modelagem do DynamoDB: chaves, modo e capacidade de cada tabela. */
import type { Evaluation } from '../../engine/types'
import { renderInline } from '../../ui/inline'
import { usd } from '../compute-prices'
import { databasePrices, DB_PRICE_DATE } from '../database-prices'
import { FactTag, PremiseTag } from '../shared/Tags'
import c from '../shared/compute.module.css'
import sh from '../shared/lab.module.css'
import { choiceCost, pkProblems, type DdbKeysLabConfig, type DdbKeysLabResponse, type DdbTableChoice } from './lab'
import { CONSISTENCY_LABEL, MODE_LABEL, PARTITION_LIMIT, readUnits, writeUnits, type CapacityMode } from './model'

interface Props {
  config: DdbKeysLabConfig
  value: DdbKeysLabResponse
  onChange: (v: DdbKeysLabResponse) => void
  disabled: boolean
  evaluation?: Evaluation | null
}

const fmt = (n: number) => n.toLocaleString('pt-BR')

export function DdbKeysLab({ config, value, onChange, disabled, evaluation }: Props) {
  const p = databasePrices(config.region).dynamodb
  const set = (id: string, part: Partial<DdbTableChoice>) => onChange({ tables: { ...value.tables, [id]: { ...value.tables?.[id], ...part } } })
  return (
    <div className={sh.lab}>
      <p className={c.legend}>
        <FactTag date="21/10/2026" /> leitura: 1 unidade por 4 KB (meia se eventual, 2 se transacional); escrita: 1 unidade por 1 KB (2 se transacional); cada partição aguenta {fmt(PARTITION_LIMIT.read)} unidades de leitura e {fmt(PARTITION_LIMIT.write)} de escrita por segundo · <PremiseTag /> tráfego das tabelas · preços da AWS Price List ({DB_PRICE_DATE}): sob demanda {usd(p.onDemand.readPerMillion)} por milhão de leituras e {usd(p.onDemand.writePerMillion)} por milhão de escritas; provisionado {usd(p.provisioned.rcuHour)} por RCU-hora e {usd(p.provisioned.wcuHour)} por WCU-hora.
      </p>
      {config.tables.map((t) => {
        const ch = value.tables?.[t.id] ?? {}
        const pk = t.partitionKeys.find((k) => k.id === ch.pk)
        const problems = pk ? pkProblems(t, pk) : []
        const cost = choiceCost(t, ch, config.region)
        const ru = readUnits(t.load.itemKB, t.load.consistency)
        const wu = writeUnits(t.load.itemKB, t.load.transactionalWrites)
        const fbs = evaluation?.items.filter((i) => i.id.startsWith(`${t.id}:`)) ?? []
        return (
          <section key={t.id} className={sh.card} aria-label={t.name}>
            <h4 className={sh.title}>{t.name}</h4>
            <p className={sh.desc}>{renderInline(t.description)}</p>
            <ul className={c.needs}>
              <li>Acesso principal: {t.accessPattern}</li>
              <li>
                Itens de {fmt(t.load.itemKB)} KB · cada leitura {CONSISTENCY_LABEL[t.load.consistency]} consome {fmt(ru)} unidade(s) · cada escrita{t.load.transactionalWrites ? ' transacional' : ''} consome {fmt(wu)} unidade(s)
              </li>
              <li>
                Pico: {fmt(t.load.peakReads)} leituras e {fmt(t.load.peakWrites)} escritas por segundo · média do mês: {fmt(t.load.avgReads)} leituras e {fmt(t.load.avgWrites)} escritas por segundo
              </li>
            </ul>
            <div className={c.row}>
              <label className={c.field}>
                <span>Chave de partição</span>
                <select className={c.select} value={ch.pk ?? ''} disabled={disabled} onChange={(e) => set(t.id, { pk: e.target.value || undefined })}>
                  <option value="">Escolha</option>
                  {t.partitionKeys.map((k) => (
                    <option key={k.id} value={k.id}>
                      {k.attribute}
                    </option>
                  ))}
                </select>
              </label>
              <label className={c.field}>
                <span>Chave de ordenação</span>
                <select className={c.select} value={ch.sk ?? ''} disabled={disabled} onChange={(e) => set(t.id, { sk: e.target.value || undefined })}>
                  <option value="">Escolha</option>
                  {t.sortKeys.map((k) => (
                    <option key={k.id} value={k.id}>
                      {k.attribute}
                    </option>
                  ))}
                </select>
              </label>
              <label className={c.field}>
                <span>Modo de capacidade</span>
                <select className={c.select} value={ch.mode ?? ''} disabled={disabled} onChange={(e) => set(t.id, { mode: (e.target.value || undefined) as CapacityMode | undefined })}>
                  <option value="">Escolha</option>
                  {(Object.keys(MODE_LABEL) as CapacityMode[]).map((m) => (
                    <option key={m} value={m}>
                      {MODE_LABEL[m]}
                    </option>
                  ))}
                </select>
              </label>
              {ch.mode === 'provisioned' && (
                <>
                  <label className={c.field}>
                    <span>RCU</span>
                    <input className={c.input} type="number" min={1} step={10} value={ch.rcu ?? ''} disabled={disabled} onChange={(e) => set(t.id, { rcu: Number(e.target.value) })} style={{ width: '7em' }} />
                  </label>
                  <label className={c.field}>
                    <span>WCU</span>
                    <input className={c.input} type="number" min={1} step={10} value={ch.wcu ?? ''} disabled={disabled} onChange={(e) => set(t.id, { wcu: Number(e.target.value) })} style={{ width: '7em' }} />
                  </label>
                </>
              )}
            </div>
            {pk && (
              <p className={c.cost}>
                {pk.attribute}: distribuição do tráfego {pk.keys.map((k) => `"${k.value}" ${Math.round(k.share * 100)}%`).join(', ')}
                {problems.length > 0 ? ` · ${problems.join('; ')}` : ''}
              </p>
            )}
            {cost !== undefined && (
              <p className={c.cost} aria-live="polite">
                Custo estimado: <strong>{usd(cost)}/mês</strong>
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
          <li>Todo o tráfego de um valor de chave de partição cai numa única partição. Na AWS, a capacidade adaptativa e a divisão automática (em tabelas sem índice local) suavizam picos, mas o desenho recomendado continua sendo espalhar o tráfego por muitos valores.</li>
          <li>O modo provisionado é avaliado sem auto scaling, cobrindo o pico o mês inteiro; o sob demanda, pela média do mês.</li>
          <li>Os preços usam a primeira faixa paga, sem nível gratuito, armazenamento, índices ou capacidade reservada.</li>
        </ul>
      </details>
    </div>
  )
}
