/** Interface do laboratório de borda: fluxo usuário → POP → REC → origem e linha do tempo das requisições. */
import { ArrowRight, Database, Globe, HardDrive, TriangleAlert, User } from 'lucide-react'
import type { Evaluation } from '../../engine/types'
import { PremiseTag } from '../shared/Tags'
import sh from '../shared/lab.module.css'
import { edgeGoalLabel, runEdgeLab, type EdgeLabConfig, type EdgeLabResponse } from './lab'
import { formatAt, formatTtl, HOP_LABEL, usesRec, type Hop } from './model'
import s from './edge.module.css'

interface Props {
  config: EdgeLabConfig
  value: EdgeLabResponse
  onChange: (v: EdgeLabResponse) => void
  disabled: boolean
  evaluation?: Evaluation | null
}

export function EdgeLab({ config, value, onChange, disabled }: Props) {
  const v = value ?? config.initial
  const run = runEdgeLab(config, v)
  const served = (h: Hop) => run.requests.filter((r) => r.servedBy === h).length
  const recOn = usesRec(config.setup)
  const setBehavior = (i: number, patch: Partial<EdgeLabResponse['behaviors'][number]>) => onChange({ ...v, behaviors: v.behaviors.map((b, j) => (j === i ? { ...b, ...patch } : b)) })
  let reqIndex = 0

  return (
    <div className={sh.lab}>
      <section className={sh.card} aria-label="Objetivos">
        <h4 className={sh.title}>Objetivos</h4>
        <ul className={s.goals}>
          {config.goals.map((g, i) => (
            <li key={i}>{edgeGoalLabel(g)}</li>
          ))}
        </ul>
      </section>

      <section className={sh.card} aria-label="Fluxo">
        <h4 className={sh.title}>Caminho de uma requisição</h4>
        <ol className={s.flow}>
          <li className={s.node}>
            <User size={18} aria-hidden="true" />
            <strong>Usuário</strong>
            <span>{run.requests.length} requisições</span>
          </li>
          <li className={s.arrow} aria-hidden="true">
            <ArrowRight size={16} />
            <small>{config.setup.latency.viewerPop} ms</small>
          </li>
          <li className={s.node}>
            <Globe size={18} aria-hidden="true" />
            <strong>POP (edge location)</strong>
            <span>{config.setup.popLabel}</span>
            <span>{served('pop')} respondida(s) aqui</span>
          </li>
          <li className={s.arrow} aria-hidden="true">
            <ArrowRight size={16} />
            <small>{recOn ? `${config.setup.latency.popRec} ms` : 'pula o REC'}</small>
          </li>
          <li className={s.node} data-skipped={!recOn}>
            <HardDrive size={18} aria-hidden="true" />
            <strong>Regional Edge Cache</strong>
            <span>{config.setup.rec.label}</span>
            <span>{recOn ? `${served('rec')} respondida(s) aqui` : 'não usado: origem S3 na mesma Região'}</span>
          </li>
          <li className={s.arrow} aria-hidden="true">
            <ArrowRight size={16} />
            <small>{recOn ? `${config.setup.latency.recOrigin} ms` : `${config.setup.latency.popOrigin} ms`}</small>
          </li>
          <li className={s.node}>
            <Database size={18} aria-hidden="true" />
            <strong>Origem</strong>
            <span>{config.setup.origin.label}</span>
            <span>{served('origin')} respondida(s) aqui</span>
          </li>
        </ol>
        <p className={s.metrics}>
          Idas à origem: <strong>{run.originRequests}</strong> · respostas do cache: <strong>{Math.round(run.hitRatio * 100)}%</strong> · latência média: <strong>{Math.round(run.avgLatencyMs)} ms</strong> <PremiseTag label="Latências: premissa" />
        </p>
      </section>

      <section className={sh.card} aria-label="Comportamentos de cache">
        <h4 className={sh.title}>Comportamentos de cache (o primeiro que casar vale)</h4>
        <div className={s.behaviors}>
          {v.behaviors.map((b, i) => (
            <div key={b.pattern} className={s.behavior}>
              <code>{b.pattern}</code>
              <label>
                <input type="checkbox" checked={b.cache} disabled={disabled} onChange={(e) => setBehavior(i, { cache: e.target.checked })} /> guardar em cache
              </label>
              <label className={s.ttl}>
                <span>TTL</span>
                <select value={b.ttlSec} disabled={disabled || !b.cache} onChange={(e) => setBehavior(i, { ttlSec: Number(e.target.value) })} aria-label={`TTL de ${b.pattern}`}>
                  {config.ttlOptions.map((t) => (
                    <option key={t} value={t}>
                      {formatTtl(t)}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          ))}
        </div>
        {config.allowInvalidation && (
          <label className={s.inv}>
            <input type="checkbox" checked={v.invalidateOnUpdate} disabled={disabled} onChange={(e) => onChange({ ...v, invalidateOnUpdate: e.target.checked })} /> Pedir invalidação ao CloudFront sempre que a origem for atualizada
          </label>
        )}
      </section>

      <section className={sh.card} aria-label="Linha do tempo">
        <h4 className={sh.title}>Linha do tempo</h4>
        <ol className={s.timeline}>
          {[...config.events]
            .sort((a, b) => a.at - b.at)
            .map((ev, i) => {
              if (ev.kind !== 'request') {
                return (
                  <li key={i} className={s.sys}>
                    <span className={s.at}>{formatAt(ev.at)}</span>
                    <span>{ev.kind === 'origin-update' ? `Origem atualiza ${ev.path}${config.allowInvalidation && v.invalidateOnUpdate ? ' (invalidação pedida)' : ''}` : `Invalidação de ${ev.path}`}</span>
                  </li>
                )
              }
              const r = run.requests[reqIndex++]
              return (
                <li key={i} data-served={r.servedBy}>
                  <span className={s.at}>{formatAt(r.at)}</span>
                  <code>
                    {r.method} {r.path}
                  </code>
                  <span className={s.hops}>
                    {r.hops.map((h) => (
                      <span key={h} className={s.hop} data-final={h === r.servedBy}>
                        {h === 'pop' ? 'POP' : h === 'rec' ? 'REC' : 'Origem'}
                      </span>
                    ))}
                  </span>
                  <span className={s.lat}>{r.latencyMs} ms</span>
                  <span className={s.reason}>
                    {r.reason}
                    {r.staleForSec !== undefined && (
                      <span className={s.stale}>
                        <TriangleAlert size={12} aria-hidden="true" /> versão antiga há {formatAt(r.staleForSec)}
                      </span>
                    )}
                  </span>
                </li>
              )
            })}
        </ol>
        <p className={sh.desc}>Respondida por: {(['pop', 'rec', 'origin'] as Hop[]).map((h) => `${HOP_LABEL[h]} ${served(h)}`).join(' · ')}</p>
      </section>

      <details className={sh.simp}>
        <summary>Simplificações deste simulador</summary>
        <ul>
          <li>Um único POP e um único Regional Edge Cache; na AWS há centenas de POPs e vários RECs.</li>
          <li>O TTL é fixo por comportamento. Na AWS, cabeçalhos como Cache-Control da origem e os TTLs mínimo, máximo e padrão interagem; ao expirar, o CloudFront pode revalidar com a origem em vez de baixar tudo de novo.</li>
          <li>O descarte de objetos pouco acessados no POP usa um prazo fixo de inatividade, que é premissa do cenário; o REC guarda por mais tempo.</li>
          <li>Caminhos sem cache são tratados como requisições dinâmicas: vão do POP à origem sem passar pelo REC.</li>
          <li>As latências são premissas ilustrativas do cenário.</li>
        </ul>
      </details>
    </div>
  )
}
