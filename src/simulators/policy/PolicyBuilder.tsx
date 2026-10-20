/** Interface do construtor de políticas: peças guiadas à esquerda, JSON e testes ao vivo à direita. */
import { Ban, Check, ChevronDown, CircleAlert, Plus, Trash2 } from 'lucide-react'
import { useMemo, useState, type ReactNode } from 'react'
import type { Evaluation } from '../../engine/types'
import { Badge } from '../../ui/kit'
import { renderInline } from '../../ui/inline'
import sh from '../shared/lab.module.css'
import { builderIssues, emptyStatement, POLICY_KIND_LABEL, runTests, toStatements, type BuilderLabConfig, type BuilderLabResponse, type BuilderStatement, type TestRun } from './builder'
import { conditionText, policyToJson } from './model'
import s from './policy.module.css'

interface Props {
  config: BuilderLabConfig
  value: BuilderLabResponse
  onChange: (v: BuilderLabResponse) => void
  disabled: boolean
  evaluation?: Evaluation | null
}

function toggle<T>(list: T[], item: T): T[] {
  return list.includes(item) ? list.filter((x) => x !== item) : [...list, item]
}

function ChipGroup({ label, options, selected, onToggle, disabled, mono = true }: { label: string; options: { id: string; text: string; title?: string }[]; selected: string[]; onToggle: (id: string) => void; disabled: boolean; mono?: boolean }) {
  return (
    <div className={s.field}>
      <span className={s.fieldLabel}>{label}</span>
      <div className={s.chips} role="group" aria-label={label}>
        {options.map((o) => (
          <button key={o.id} type="button" className={s.chip} data-mono={mono} aria-pressed={selected.includes(o.id)} disabled={disabled} title={o.title} onClick={() => onToggle(o.id)}>
            {o.text}
          </button>
        ))}
      </div>
    </div>
  )
}

function StatementEditor({ config, st, index, onChange, onRemove, disabled }: { config: BuilderLabConfig; st: BuilderStatement; index: number; onChange: (st: BuilderStatement) => void; onRemove?: () => void; disabled: boolean }) {
  const p = config.palette
  const effects = p.effects ?? ['Allow', 'Deny']
  return (
    <fieldset className={s.statement} data-effect={st.effect}>
      <legend className={s.legend}>
        Statement {index + 1} <code>Stmt{index + 1}</code>
      </legend>
      {effects.length > 1 && (
        <div className={s.field}>
          <span className={s.fieldLabel}>Effect</span>
          <div className={s.segment} role="radiogroup" aria-label={`Effect do statement ${index + 1}`}>
            {effects.map((e) => (
              <button key={e} type="button" role="radio" aria-checked={st.effect === e} className={s.segBtn} data-effect={e} disabled={disabled} onClick={() => onChange({ ...st, effect: e })}>
                {e}
              </button>
            ))}
          </div>
        </div>
      )}
      {p.principals && (
        <ChipGroup label="Principal" options={p.principals.map((x) => ({ id: x.id, text: x.label }))} selected={st.principals} onToggle={(id) => onChange({ ...st, principals: toggle(st.principals, id) })} disabled={disabled} mono={false} />
      )}
      <ChipGroup label={st.notAction ? 'NotAction (todas as ações exceto estas)' : 'Action'} options={p.actions.map((a) => ({ id: a, text: a }))} selected={st.actions} onToggle={(id) => onChange({ ...st, actions: toggle(st.actions, id) })} disabled={disabled} />
      {p.notAction && (
        <label className={s.switch}>
          <input type="checkbox" checked={Boolean(st.notAction)} disabled={disabled} onChange={(e) => onChange({ ...st, notAction: e.target.checked })} />
          Usar NotAction: o statement vale para todas as ações, exceto as marcadas
        </label>
      )}
      {p.resources && <ChipGroup label="Resource" options={p.resources.map((r) => ({ id: r, text: r }))} selected={st.resources} onToggle={(id) => onChange({ ...st, resources: toggle(st.resources, id) })} disabled={disabled} />}
      {p.conditions && p.conditions.length > 0 && (
        <ChipGroup
          label="Condition (opcional)"
          options={p.conditions.map((c) => ({ id: c.id, text: c.label, title: conditionText(c.clause) }))}
          selected={st.conditions}
          onToggle={(id) => onChange({ ...st, conditions: toggle(st.conditions, id) })}
          disabled={disabled}
          mono={false}
        />
      )}
      {onRemove && (
        <button type="button" className={s.remove} onClick={onRemove} disabled={disabled}>
          <Trash2 size={14} aria-hidden="true" /> Remover o statement {index + 1}
        </button>
      )}
    </fieldset>
  )
}

function TestRow({ run, probe }: { run: TestRun; probe?: boolean }) {
  const [open, setOpen] = useState(false)
  return (
    <li className={s.test} data-met={run.met}>
      <div className={s.testHead}>
        {run.met ? <Check size={16} aria-hidden="true" /> : <Ban size={16} aria-hidden="true" />}
        <span>
          <strong>{run.test.label}</strong>
          <small>
            {probe ? 'Deve ser negado (menor privilégio)' : `Esperado: ${run.test.expect === 'allow' ? 'permitido' : 'negado'}`} · Agora: {run.allowed ? 'permitido' : 'negado'}
          </small>
        </span>
        <span className={s.sr}>{run.met ? 'Objetivo atendido.' : 'Objetivo não atendido.'}</span>
        <button type="button" className={s.why} aria-expanded={open} onClick={() => setOpen((v) => !v)}>
          <ChevronDown size={14} aria-hidden="true" style={{ transform: open ? 'rotate(180deg)' : undefined }} /> {open ? 'Ocultar' : 'Ver'} o raciocínio
        </button>
      </div>
      {open && (
        <ol className={s.trace}>
          {run.trace.map((t, i) => (
            <li key={i}>{t}</li>
          ))}
        </ol>
      )}
    </li>
  )
}

/** Editor dos statements (efeito, principais, ações, recursos e condições), reaproveitado por outros laboratórios. */
export function BuilderEditor({ config, statements, onChange, disabled, children }: { config: BuilderLabConfig; statements: BuilderStatement[]; onChange: (next: BuilderStatement[]) => void; disabled: boolean; children?: ReactNode }) {
  const issues = builderIssues(config, { statements })
  const set = (i: number, st: BuilderStatement) => onChange(statements.map((x, j) => (j === i ? st : x)))
  return (
    <div className={s.editor}>
      <div className={s.policyHead}>
        <Badge tone="info">{POLICY_KIND_LABEL[config.kind]}</Badge>
        <code>{config.policyName}</code>
        <span className="muted">{renderInline(config.attachedTo)}</span>
      </div>
      {statements.map((st, i) => (
        <StatementEditor key={i} config={config} st={st} index={i} disabled={disabled} onChange={(next) => set(i, next)} onRemove={statements.length > 1 ? () => onChange(statements.filter((_, j) => j !== i)) : undefined} />
      ))}
      <button type="button" className={s.add} disabled={disabled || statements.length >= config.maxStatements} onClick={() => onChange([...statements, emptyStatement(config.palette)])}>
        <Plus size={14} aria-hidden="true" /> Adicionar statement ({statements.length} de {config.maxStatements})
      </button>
      {issues.length > 0 && (
        <div className={s.issues} role="status">
          <CircleAlert size={16} aria-hidden="true" />
          <ul>
            {issues.map((x) => (
              <li key={x}>{x}</li>
            ))}
          </ul>
        </div>
      )}
      {children}
    </div>
  )
}

export function JsonPanel({ json }: { json: string }) {
  return (
    <section className={s.panel} aria-label="JSON gerado">
      <h4 className={s.panelTitle}>JSON gerado</h4>
      <pre className={s.code} tabIndex={0}>
        {json}
      </pre>
    </section>
  )
}

export function PolicyBuilder({ config, value, onChange, disabled, evaluation }: Props) {
  const statements = value.statements ?? []
  const json = useMemo(() => policyToJson(toStatements(config, value)), [config, value])
  const runs = useMemo(() => runTests(config, value), [config, value])
  const metCount = runs.tests.filter((t) => t.met).length

  return (
    <div className={s.lab}>
      <BuilderEditor config={config} statements={statements} onChange={(next) => onChange({ statements: next })} disabled={disabled} />

      <div className={s.side}>
        <JsonPanel json={json} />
        <section className={s.panel} aria-label="Testes da política">
          <h4 className={s.panelTitle}>
            Testes <span className={s.count} aria-live="polite">{metCount} de {runs.tests.length} atendidos</span>
          </h4>
          <ul className={s.tests}>
            {runs.tests.map((r) => (
              <TestRow key={r.test.id} run={r} />
            ))}
          </ul>
          {runs.probes.length > 0 && (
            <>
              <h5 className={s.subTitle}>Sondas de menor privilégio</h5>
              <ul className={s.tests}>
                {runs.probes.map((r) => (
                  <TestRow key={r.test.id} run={r} probe />
                ))}
              </ul>
            </>
          )}
        </section>
        {evaluation && (
          <ul className={s.verdicts}>
            {evaluation.items
              .filter((i) => i.status !== 'correct')
              .map((i) => (
                <li key={i.id} className={sh.verdict} data-status={i.status}>
                  <strong>{i.label}</strong>
                  <span>{renderInline(i.message ?? '')}</span>
                </li>
              ))}
          </ul>
        )}
        <details className={sh.simp}>
          <summary>Simplificações deste simulador</summary>
          <ul>
            <li>As peças de cada statement vêm de uma paleta; no console você escreve o JSON livremente ou usa o editor visual.</li>
            <li>O motor segue o fluxo de avaliação documentado pela AWS, mas não modela NotPrincipal, políticas de VPC endpoint, ACLs, grants do KMS nem operadores de conjunto (ForAllValues e ForAnyValue).</li>
            <li>As requisições de teste são fictícias e não chamam a AWS.</li>
          </ul>
        </details>
      </div>
    </div>
  )
}
