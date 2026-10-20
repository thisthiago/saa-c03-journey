/** Interface do laboratório de organização: SCPs disponíveis, árvore com anexos por nó e matriz de decisões. */
import { Ban, Building2, Check, ChevronDown, FolderTree, Landmark } from 'lucide-react'
import { useMemo, useState } from 'react'
import type { Evaluation } from '../../engine/types'
import { Badge } from '../../ui/kit'
import { renderInline } from '../../ui/inline'
import sh from '../shared/lab.module.css'
import { policyToJson } from '../policy/model'
import ps from '../policy/policy.module.css'
import { orgScenario, runOrgGoals, type GoalRun, type OrgLabConfig, type OrgLabResponse } from './lab'
import { depth } from './model'
import s from './org.module.css'

interface Props {
  config: OrgLabConfig
  value: OrgLabResponse
  onChange: (v: OrgLabResponse) => void
  disabled: boolean
  evaluation?: Evaluation | null
}

const ICON = { root: Landmark, ou: FolderTree, account: Building2 }

function GoalRow({ run }: { run: GoalRun }) {
  const [open, setOpen] = useState(false)
  return (
    <li className={ps.test} data-met={run.met}>
      <div className={ps.testHead}>
        {run.met ? <Check size={16} aria-hidden="true" /> : <Ban size={16} aria-hidden="true" />}
        <span>
          <strong>
            {run.principalName}: {run.label}
          </strong>
          <small>
            Esperado: {run.goal.expect === 'allow' ? 'permitido' : 'negado'} · Agora: {run.result.allowed ? 'permitido' : 'negado'}
          </small>
        </span>
        <span className={ps.sr}>{run.met ? 'Objetivo atendido.' : 'Objetivo não atendido.'}</span>
        <button type="button" className={ps.why} aria-expanded={open} onClick={() => setOpen((v) => !v)}>
          <ChevronDown size={14} aria-hidden="true" style={{ transform: open ? 'rotate(180deg)' : undefined }} /> {open ? 'Ocultar' : 'Ver'} o raciocínio
        </button>
      </div>
      {open && (
        <ol className={ps.trace}>
          {run.result.trace.map((t, i) => (
            <li key={i}>{t}</li>
          ))}
        </ol>
      )}
    </li>
  )
}

export function OrgLab({ config, value, onChange, disabled, evaluation }: Props) {
  const scenario = useMemo(() => orgScenario(config, value), [config, value])
  const runs = useMemo(() => runOrgGoals(config, scenario), [config, scenario])
  const attached = value.attached ?? {}
  const toggle = (nodeId: string, pid: string) => {
    const cur = attached[nodeId] ?? []
    onChange({ attached: { ...attached, [nodeId]: cur.includes(pid) ? cur.filter((x) => x !== pid) : [...cur, pid] } })
  }
  return (
    <div className={ps.lab}>
      <div className={ps.editor}>
        <details className={ps.panel} open>
          <summary className={s.summary}>SCPs disponíveis</summary>
          <div className={s.library}>
            {config.library.map((p) => (
              <article key={p.id} className={s.scp}>
                <strong>
                  <code>{p.name}</code>
                </strong>
                {p.statements[0]?.note && <p className={ps.note}>{renderInline(p.statements[0].note)}</p>}
                <details className={ps.stJson}>
                  <summary>JSON</summary>
                  <pre className={ps.code}>{policyToJson(p.statements)}</pre>
                </details>
              </article>
            ))}
          </div>
        </details>
        <section className={ps.panel} aria-label="Árvore da organização">
          <h4 className={ps.panelTitle}>Organização {config.orgId}</h4>
          <ul className={s.tree}>
            {config.nodes.map((n) => {
              const Icon = ICON[n.kind]
              const on = attached[n.id] ?? []
              return (
                <li key={n.id} className={s.node} style={{ ['--depth' as string]: depth(config.nodes, n.id) }} data-kind={n.kind}>
                  <div className={s.nodeHead}>
                    <Icon size={16} aria-hidden="true" />
                    <strong>{n.name}</strong>
                    {n.accountId && <code className={s.acct}>{n.accountId}</code>}
                    {n.management && <Badge tone="info">conta de gerenciamento</Badge>}
                  </div>
                  <div className={s.attach} role="group" aria-label={`SCPs anexadas a ${n.name}`}>
                    {config.library.map((p) => (
                      <button key={p.id} type="button" className={ps.chip} data-mono="true" aria-pressed={on.includes(p.id)} disabled={disabled} onClick={() => toggle(n.id, p.id)}>
                        {p.name}
                      </button>
                    ))}
                  </div>
                  {on.length === 0 && <p className={s.warn}>Nenhuma SCP anexada: sem um Allow neste nível, as contas abaixo ficam sem nenhuma ação permitida.</p>}
                </li>
              )
            })}
          </ul>
        </section>
      </div>
      <div className={ps.side}>
        <section className={ps.panel} aria-label="Objetivos da organização">
          <h4 className={ps.panelTitle}>
            Objetivos <span className={ps.count} aria-live="polite">{runs.filter((r) => r.met).length} de {runs.length} atendidos</span>
          </h4>
          <ul className={ps.tests}>
            {runs.map((r) => (
              <GoalRow key={`${r.goal.principalId}:${r.goal.requestId}`} run={r} />
            ))}
          </ul>
        </section>
        {evaluation && (
          <ul className={ps.verdicts}>
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
            <li>As SCPs são avaliadas pelo motor de políticas, com Allow exigido em todos os níveis e Deny vencendo em qualquer nível.</li>
            <li>Cada conta tem um administrador com AdministratorAccess: assim fica claro que a SCP só limita, não concede.</li>
            <li>RCPs, políticas de backup, de tags e declarativas do Organizations não aparecem neste laboratório.</li>
          </ul>
        </details>
      </div>
    </div>
  )
}
