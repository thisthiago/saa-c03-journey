/** Interface do laboratório de regras do ALB: regras editáveis e as requisições de teste avaliadas ao vivo. */
import { Plus, Trash2 } from 'lucide-react'
import type { Evaluation } from '../../engine/types'
import { renderInline } from '../../ui/inline'
import { FactTag } from '../shared/Tags'
import c from '../shared/compute.module.css'
import sh from '../shared/lab.module.css'
import { draftErrors, outcomeLabel, toListener, type LbLabConfig, type LbLabResponse, type RuleDraft } from './lab'
import { routeAlb } from './model'
import s from './loadbalancer.module.css'

interface Props {
  config: LbLabConfig
  value: LbLabResponse
  onChange: (v: LbLabResponse) => void
  disabled: boolean
  evaluation?: Evaluation | null
}

export function LoadBalancerLab({ config, value, onChange, disabled, evaluation }: Props) {
  const rules = value.rules ?? []
  const setRules = (next: RuleDraft[]) => onChange({ ...value, rules: next })
  const patch = (id: string, part: Partial<RuleDraft>) => setRules(rules.map((r) => (r.id === id ? { ...r, ...part } : r)))
  const add = () => {
    const priority = (rules.reduce((m, r) => Math.max(m, r.priority), 0) || 0) + 10
    setRules([...rules, { id: `r${Date.now().toString(36)}${rules.length}`, priority, conditionIds: [] }])
  }
  const listener = toListener(config, value)
  const errors = draftErrors(config, value)
  const label = (id: string) => config.targetGroups.find((g) => g.id === id)?.label ?? id
  return (
    <div className={sh.lab}>
      <p className={c.legend}>
        <FactTag date="20/10/2026" /> as regras são avaliadas da menor prioridade para a maior; a primeira que casa decide. Todas as condições de uma regra precisam casar; os valores de uma condição combinam com OU. A regra padrão vale quando nenhuma casa.
      </p>

      <section className={sh.card} aria-label="Regras do listener HTTPS :443">
        <h4 className={sh.title}>Listener HTTPS :443</h4>
        {rules.length === 0 && <p className={sh.desc}>Nenhuma regra além da padrão.</p>}
        {[...rules]
          .sort((a, b) => a.priority - b.priority)
          .map((r) => (
            <div key={r.id} className={s.rule}>
              <div className={c.row}>
                <label className={c.field}>
                  <span>Prioridade</span>
                  <input className={c.input} type="number" min={1} value={r.priority} disabled={disabled} onChange={(e) => patch(r.id, { priority: Number(e.target.value) })} style={{ width: '6em' }} />
                </label>
                <label className={c.field}>
                  <span>Ação</span>
                  <select className={c.select} value={r.actionId ?? ''} disabled={disabled} onChange={(e) => patch(r.id, { actionId: e.target.value || undefined })}>
                    <option value="">Escolha a ação</option>
                    {config.actions.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.label}
                      </option>
                    ))}
                  </select>
                </label>
                <button type="button" className={s.remove} disabled={disabled} onClick={() => setRules(rules.filter((x) => x.id !== r.id))} aria-label={`Remover a regra de prioridade ${r.priority}`}>
                  <Trash2 size={15} aria-hidden="true" /> Remover
                </button>
              </div>
              <fieldset className={s.conds} disabled={disabled}>
                <legend>Condições (todas precisam casar)</legend>
                {config.conditions.map((cond) => (
                  <label key={cond.id} className={s.cond}>
                    <input type="checkbox" checked={r.conditionIds.includes(cond.id)} onChange={(e) => patch(r.id, { conditionIds: e.target.checked ? [...r.conditionIds, cond.id] : r.conditionIds.filter((x) => x !== cond.id) })} />
                    <code>{cond.label}</code>
                  </label>
                ))}
              </fieldset>
            </div>
          ))}
        <div className={c.row}>
          <button type="button" className={s.add} disabled={disabled || rules.length >= config.maxRules} onClick={add}>
            <Plus size={15} aria-hidden="true" /> Adicionar regra ({rules.length}/{config.maxRules})
          </button>
          <label className={c.field}>
            <span>Regra padrão</span>
            <select className={c.select} value={value.defaultActionId} disabled={disabled} onChange={(e) => onChange({ ...value, defaultActionId: e.target.value })}>
              {config.actions.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.label}
                </option>
              ))}
            </select>
          </label>
        </div>
        {errors.length > 0 && <p className={s.error}>A AWS recusaria este listener: {errors.join('; ')}.</p>}
      </section>

      <section className={sh.card} aria-label="Requisições de teste">
        <h4 className={sh.title}>Requisições de teste</h4>
        <ul className={s.tests} aria-live="polite">
          {config.tests.map((t) => {
            const res = routeAlb(listener, t.request, label)
            const ok = res.outcome === t.expect
            return (
              <li key={t.id} data-ok={ok}>
                <span className={c.mono}>
                  {t.request.method} {t.request.host}
                  {t.request.path}
                </span>
                <small className={c.muted}>{t.request.label}</small>
                <span>
                  Deve ir para <strong>{outcomeLabel(config, t.expect)}</strong> ·{' '}
                  <span className={ok ? s.ok : s.bad}>
                    {ok ? '✓' : '✗'} vai para {outcomeLabel(config, res.outcome)}
                  </span>{' '}
                  <small className={c.muted}>({res.rule === 'default' ? 'regra padrão' : `regra de prioridade ${res.rule}`})</small>
                </span>
              </li>
            )
          })}
        </ul>
      </section>

      {evaluation && (
        <div className={sh.verdict} data-status={evaluation.score >= 0.999 ? 'correct' : evaluation.score >= 0.5 ? 'partial' : 'wrong'} aria-live="polite">
          {evaluation.items
            .filter((i) => i.status !== 'correct')
            .slice(0, 4)
            .map((i) => (
              <span key={i.id}>{renderInline(`**${i.label}** ${i.message ?? ''}`)}</span>
            ))}
        </div>
      )}

      <details className={sh.simp}>
        <summary>Simplificações deste simulador</summary>
        <ul>
          <li>Um listener HTTPS só; certificados, autenticação e transformações de URL ficam de fora.</li>
          <li>Forward com vários target groups escolhe pelos pesos de forma determinística, para o resultado não mudar a cada teste.</li>
          <li>O caminho compara maiúsculas e minúsculas; o host, não.</li>
        </ul>
      </details>
    </div>
  )
}
