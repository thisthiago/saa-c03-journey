/** Interface do laboratório "Cadeia de confiança": trust policy, duração máxima e tentativas de AssumeRole. */
import { Ban, Check, ChevronDown, Clock } from 'lucide-react'
import { useMemo, useState } from 'react'
import type { Evaluation } from '../../engine/types'
import { renderInline } from '../../ui/inline'
import sh from '../shared/lab.module.css'
import { BuilderEditor, JsonPanel } from '../policy/PolicyBuilder'
import { toStatements } from '../policy/builder'
import { policyToJson } from '../policy/model'
import s from '../policy/policy.module.css'
import { runAttempts, type AttemptRun, type TrustLabConfig, type TrustLabResponse } from './lab'
import { STS_OUTCOME_LABEL } from './model'

interface Props {
  config: TrustLabConfig
  value: TrustLabResponse
  onChange: (v: TrustLabResponse) => void
  disabled: boolean
  evaluation?: Evaluation | null
}

function AttemptRow({ run }: { run: AttemptRun }) {
  const [open, setOpen] = useState(false)
  const a = run.attempt
  const details = [a.durationSeconds ? `${a.durationSeconds / 3600} h` : '1 h (padrão)', a.mfa ? 'com MFA' : 'sem MFA', a.externalId ? `ExternalId "${a.externalId}"` : ''].filter(Boolean).join(' · ')
  return (
    <li className={s.test} data-met={run.met}>
      <div className={s.testHead}>
        {run.met ? <Check size={16} aria-hidden="true" /> : <Ban size={16} aria-hidden="true" />}
        <span>
          <strong>{a.label}</strong>
          <small>
            {details} · Esperado: {a.expect === 'ok' ? 'conseguir' : 'não conseguir'} · Agora: {STS_OUTCOME_LABEL[run.result.outcome]}
          </small>
        </span>
        <span className={s.sr}>{run.met ? 'Objetivo atendido.' : 'Objetivo não atendido.'}</span>
        <button type="button" className={s.why} aria-expanded={open} onClick={() => setOpen((v) => !v)}>
          <ChevronDown size={14} aria-hidden="true" style={{ transform: open ? 'rotate(180deg)' : undefined }} /> {open ? 'Ocultar' : 'Ver'} o raciocínio
        </button>
      </div>
      {open && (
        <ol className={s.trace}>
          {run.result.trace.map((t, i) => (
            <li key={i}>{t}</li>
          ))}
        </ol>
      )}
    </li>
  )
}

export function TrustLab({ config, value, onChange, disabled, evaluation }: Props) {
  const statements = value.statements ?? []
  const json = useMemo(() => policyToJson(toStatements(config.builder, { statements: value.statements ?? [] })), [config, value.statements])
  const runs = useMemo(() => runAttempts(config, value), [config, value])
  const met = runs.filter((r) => r.met).length
  return (
    <div className={s.lab}>
      <BuilderEditor config={config.builder} statements={statements} onChange={(next) => onChange({ ...value, statements: next })} disabled={disabled}>
        <section className={s.panel} aria-label="Duração máxima da sessão">
          <h4 className={s.panelTitle}>
            <Clock size={16} aria-hidden="true" /> Duração máxima da sessão da role
          </h4>
          <div className={s.segment} role="radiogroup" aria-label="Duração máxima da sessão">
            {config.durationOptions.map((h) => (
              <button key={h} type="button" role="radio" aria-checked={value.maxHours === h} className={s.segBtn} data-effect="Allow" disabled={disabled} onClick={() => onChange({ ...value, maxHours: h })}>
                {h} h
              </button>
            ))}
          </div>
          <p className={s.note}>A role aceita de 1 a 12 horas. Quem assume pede uma duração de 15 minutos até esse máximo.</p>
        </section>
      </BuilderEditor>
      <div className={s.side}>
        <JsonPanel json={json} />
        <section className={s.panel} aria-label="Tentativas de AssumeRole">
          <h4 className={s.panelTitle}>
            Tentativas de AssumeRole <span className={s.count} aria-live="polite">{met} de {runs.length} como esperado</span>
          </h4>
          <ul className={s.tests}>
            {runs.map((r) => (
              <AttemptRow key={r.attempt.id} run={r} />
            ))}
          </ul>
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
            <li>As tentativas usam o motor de políticas para sts:AssumeRole, com as regras de duração da API (900 s até o máximo da role; 1 h no encadeamento).</li>
            <li>Session tags, SourceIdentity e o limite de tamanho do token de sessão não são simulados.</li>
          </ul>
        </details>
      </div>
    </div>
  )
}
