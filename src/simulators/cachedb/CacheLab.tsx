/** Interface do laboratório de cache: uma configuração por carga, com as métricas calculadas ao vivo. */
import type { Evaluation } from '../../engine/types'
import { renderInline } from '../../ui/inline'
import { HOURS_PER_MONTH, usd } from '../compute-prices'
import { CACHE_NODES, databasePrices, DB_PRICE_DATE, type CacheEngine } from '../database-prices'
import { FactTag, PremiseTag } from '../shared/Tags'
import c from '../shared/compute.module.css'
import sh from '../shared/lab.module.css'
import { EMPTY_CACHE, type CacheLabConfig, type CacheLabResponse } from './lab'
import { cacheGaps, cacheMetrics, cacheMonthly, ENGINE_LABEL, ENGINE_NEED_LABEL, LATENCY, nodeMemory, STRATEGY_LABEL, TTL_OPTIONS, USABLE_MEMORY, type CacheConfig, type CacheStrategy } from './model'

interface Props {
  config: CacheLabConfig
  value: CacheLabResponse
  onChange: (v: CacheLabResponse) => void
  disabled: boolean
  evaluation?: Evaluation | null
}

const fmt = (n: number) => Math.round(n).toLocaleString('pt-BR')

export function CacheLab({ config, value, onChange, disabled, evaluation }: Props) {
  const nodes = databasePrices(config.region).elasticache.nodes
  const set = (id: string, cfg: CacheConfig) => onChange({ configs: { ...value.configs, [id]: cfg } })
  return (
    <div className={sh.lab}>
      <details className={c.ref} open>
        <summary>Nós do ElastiCache</summary>
        <p className={c.legend}>
          <FactTag date="21/10/2026" /> estratégias e motores da documentação do ElastiCache · <PremiseTag /> {LATENCY.cacheMs} ms no cache, {LATENCY.dbMs} ms no banco, {Math.round(USABLE_MEMORY * 100)}% da memória do nó para dados · preços da AWS Price List ({DB_PRICE_DATE}).
        </p>
        <div className={c.scroll}>
          <table className={c.table}>
            <thead>
              <tr>
                <th scope="col">Nó</th>
                <th scope="col" className={c.num}>Memória</th>
                <th scope="col" className={c.num}>Valkey</th>
                <th scope="col" className={c.num}>Redis OSS</th>
                <th scope="col" className={c.num}>Memcached</th>
              </tr>
            </thead>
            <tbody>
              {CACHE_NODES.map((n) => (
                <tr key={n}>
                  <th scope="row">{n}</th>
                  <td className={c.num}>{nodes[n].memoryGiB} GiB</td>
                  {(['valkey', 'redis', 'memcached'] as CacheEngine[]).map((e) => (
                    <td key={e} className={c.num}>
                      {usd(nodes[n].hour[e] * HOURS_PER_MONTH)}/mês
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
      {config.scenarios.map((s) => {
        const cfg = value.configs?.[s.id] ?? EMPTY_CACHE
        const patch = (part: Partial<CacheConfig>) => set(s.id, { ...cfg, ...part })
        const m = cacheMetrics(s.load, cfg)
        const gaps = cacheGaps(s.load, cfg, s.need, config.region)
        const fb = evaluation?.items.find((i) => i.id === s.id)
        const cached = cfg.strategy !== 'none'
        return (
          <section key={s.id} className={sh.card} aria-label={s.name}>
            <h4 className={sh.title}>{s.name}</h4>
            <p className={sh.desc}>{renderInline(s.description)}</p>
            <ul className={c.needs}>
              <li>
                {fmt(s.load.readsPerSec)} leituras e {fmt(s.load.writesPerSec)} gravações por segundo; {fmt(s.load.hotKeys)} itens lidos com frequência, de {fmt(s.load.totalKeys)} no total, com {s.load.itemKB} KB cada
              </li>
              <li>O banco aguenta {fmt(s.need.maxDbReadsPerSec)} leituras por segundo; latência média de até {s.need.maxLatencyMs} ms</li>
              <li>{s.need.maxStaleSec === 0 ? 'Nenhum dado pode aparecer desatualizado' : `Um dado pode aparecer desatualizado por até ${s.need.maxStaleSec} s`}</li>
              {s.need.engine.map((e) => (
                <li key={e}>Precisa de {ENGINE_NEED_LABEL[e]}</li>
              ))}
            </ul>
            <div className={c.row}>
              <label className={c.field}>
                <span>Estratégia</span>
                <select className={c.select} value={cfg.strategy} disabled={disabled} onChange={(e) => patch({ strategy: e.target.value as CacheStrategy })}>
                  {(Object.keys(STRATEGY_LABEL) as CacheStrategy[]).map((st) => (
                    <option key={st} value={st}>
                      {STRATEGY_LABEL[st]}
                    </option>
                  ))}
                </select>
              </label>
              {cached && (
                <>
                  <label className={c.field}>
                    <span>TTL</span>
                    <select className={c.select} value={cfg.ttlSec} disabled={disabled} onChange={(e) => patch({ ttlSec: Number(e.target.value) })}>
                      {TTL_OPTIONS.map((t) => (
                        <option key={t} value={t}>
                          {t ? `${t} s` : 'sem TTL'}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className={c.field}>
                    <span>Motor</span>
                    <select className={c.select} value={cfg.engine} disabled={disabled} onChange={(e) => patch({ engine: e.target.value as CacheEngine, replicas: e.target.value === 'memcached' ? 0 : cfg.replicas })}>
                      {(Object.keys(ENGINE_LABEL) as CacheEngine[]).map((e) => (
                        <option key={e} value={e}>
                          {ENGINE_LABEL[e]}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className={c.field}>
                    <span>Nó</span>
                    <select className={c.select} value={cfg.node} disabled={disabled} onChange={(e) => patch({ node: e.target.value })}>
                      {CACHE_NODES.map((n) => (
                        <option key={n} value={n}>
                          {n}
                        </option>
                      ))}
                    </select>
                  </label>
                  {cfg.engine !== 'memcached' && (
                    <label className={c.field}>
                      <span>Réplica</span>
                      <span>
                        <input type="checkbox" checked={cfg.replicas > 0} disabled={disabled} onChange={(e) => patch({ replicas: e.target.checked ? 1 : 0 })} /> uma réplica em outra AZ
                      </span>
                    </label>
                  )}
                </>
              )}
            </div>
            <p className={c.cost} aria-live="polite">
              Acertos: {Math.round(m.hitRate * 1000) / 10}% · ao banco: {fmt(m.dbReadsPerSec)} leituras/s · latência média: {m.avgLatencyMs.toFixed(2)} ms · desatualização máxima: {Number.isFinite(m.maxStaleSec) ? `${m.maxStaleSec} s` : 'até sair do cache'}
              {cached && ` · memória: ${m.memoryGiB.toFixed(2)} GiB de ${nodeMemory(cfg.node, config.region).toFixed(2)} GiB`} · <strong>{usd(cacheMonthly(cfg, config.region))}/mês</strong>
            </p>
            {gaps.length > 0 && !fb && <p className={c.cost}>Ainda não atende: {gaps.join('; ')}.</p>}
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
          <li>Com TTL, cada item quente falta uma vez por período de TTL; sem TTL, considera-se o cache já aquecido. Na vida real, a carga inicial e as remoções por falta de memória também geram faltas.</li>
          <li>Na escrita direta, todo item gravado entra no cache; com TTL, só os gravados dentro do período ficam lá.</li>
          <li>Latências fixas do cenário; o custo é só dos nós sob demanda, sem transferência de dados nem o ElastiCache Serverless.</li>
        </ul>
      </details>
    </div>
  )
}
