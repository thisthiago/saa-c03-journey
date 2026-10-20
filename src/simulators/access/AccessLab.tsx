/** Interface do laboratório de acesso: políticas por blocos, Block Public Access e matriz de acesso ao vivo. */
import { Ban, Check, ChevronDown, CircleAlert, Minus, Plus, ShieldCheck, UserRound } from 'lucide-react'
import { useMemo, useState } from 'react'
import type { Evaluation } from '../../engine/types'
import { Badge } from '../../ui/kit'
import { accessMatrix, applyAccessConfig, type AccessLabConfig, type AccessLabResponse } from './lab'
import { isPublicPolicy, isPublicStatement, type BlockPublicAccess, type Statement } from './model'
import { policyJson } from './json'
import s from './access.module.css'

interface Props {
  config: AccessLabConfig
  value: AccessLabResponse
  onChange: (v: AccessLabResponse) => void
  disabled: boolean
  evaluation?: Evaluation | null
}

const BPA_INFO: { key: keyof BlockPublicAccess; name: string; effect: string }[] = [
  { key: 'blockPublicAcls', name: 'BlockPublicAcls', effect: 'Rejeita novas ACLs públicas (não altera as existentes).' },
  { key: 'ignorePublicAcls', name: 'IgnorePublicAcls', effect: 'Ignora todas as ACLs públicas na avaliação.' },
  { key: 'blockPublicPolicy', name: 'BlockPublicPolicy', effect: 'Rejeita novas bucket policies públicas (não altera a existente).' },
  { key: 'restrictPublicBuckets', name: 'RestrictPublicBuckets', effect: 'Com política pública, só a própria conta e serviços AWS acessam.' },
]

function principalText(st: Statement): string {
  return (st.principals ?? [])
    .map((p) => (p === '*' ? '* (qualquer pessoa)' : 'account' in p ? `conta ${p.account}` : 'arn' in p ? p.arn : p.service))
    .join(', ')
}

function conditionText(c: NonNullable<Statement['conditions']>[number]): string {
  switch (c.key) {
    case 'aws:SecureTransport':
      return `${c.key} = ${c.value}`
    case 'aws:SourceIp':
      return `${c.key} ${c.negate ? 'fora de' : 'em'} ${c.cidr}`
    case 's3:x-amz-server-side-encryption':
      return `${c.key} ${c.negate ? '≠' : '='} ${c.value}`
    case 'aws:PrincipalOrgID':
      return `${c.key} = ${c.value}`
  }
}

function StatementCard({ st, active, onToggle, disabled }: { st: Statement; active: boolean; onToggle: () => void; disabled: boolean }) {
  const pub = isPublicStatement(st)
  return (
    <div className={s.statement} data-active={active} data-effect={st.effect}>
      <div className={s.statementHead}>
        <code className={s.sid}>{st.sid}</code>
        <Badge tone={st.effect === 'Allow' ? 'success' : 'danger'}>{st.effect}</Badge>
        {pub && <Badge tone="warning">pública</Badge>}
        <button type="button" className={s.toggle} onClick={onToggle} disabled={disabled} aria-pressed={active} aria-label={`${active ? 'Remover' : 'Adicionar'} a declaração ${st.sid}`}>
          {active ? <Minus size={14} aria-hidden="true" /> : <Plus size={14} aria-hidden="true" />} {active ? 'Remover' : 'Adicionar'}
        </button>
      </div>
      {st.note && <p className={s.note}>{st.note}</p>}
      <dl className={s.summary}>
        {st.principals && (
          <>
            <dt>Principal</dt>
            <dd>{principalText(st)}</dd>
          </>
        )}
        <dt>Action</dt>
        <dd>{st.actions.join(', ')}</dd>
        <dt>Resource</dt>
        <dd>{st.resources.join(', ')}</dd>
        {st.conditions?.length ? (
          <>
            <dt>Condition</dt>
            <dd>{st.conditions.map(conditionText).join('; ')}</dd>
          </>
        ) : null}
      </dl>
      <details className={s.stJson}>
        <summary>JSON</summary>
        <pre className={s.code}>{policyJson([st], true)}</pre>
      </details>
    </div>
  )
}

function Library({ title, available, active, onChange, disabled }: { title: string; available: Statement[]; active: string[]; onChange: (sids: string[]) => void; disabled: boolean }) {
  const [showJson, setShowJson] = useState(false)
  const inUse = active.map((sid) => available.find((st) => st.sid === sid)).filter((st): st is Statement => Boolean(st))
  return (
    <section className={s.panel} aria-label={title}>
      <h4 className={s.panelTitle}>
        {title} <span className={s.count}>{inUse.length} em uso</span>
        {isPublicPolicy(inUse) && <Badge tone="warning">política pública</Badge>}
      </h4>
      <div className={s.statements}>
        {available.map((st) => (
          <StatementCard
            key={st.sid}
            st={st}
            active={active.includes(st.sid)}
            disabled={disabled}
            onToggle={() => onChange(active.includes(st.sid) ? active.filter((x) => x !== st.sid) : [...active, st.sid])}
          />
        ))}
      </div>
      <button type="button" className={s.jsonToggle} onClick={() => setShowJson((v) => !v)} aria-expanded={showJson}>
        <ChevronDown size={14} aria-hidden="true" style={{ transform: showJson ? 'rotate(180deg)' : undefined }} /> {showJson ? 'Ocultar' : 'Ver'} o JSON completo
      </button>
      {showJson && <pre className={s.code}>{policyJson(inUse)}</pre>}
    </section>
  )
}

export function AccessLab({ config, value, onChange, disabled, evaluation }: Props) {
  const { world, rejected } = useMemo(() => applyAccessConfig(config, value), [config, value])
  const matrix = useMemo(() => accessMatrix(config, world), [config, world])
  const [selected, setSelected] = useState<{ identityId: string; requestId: string } | null>(null)
  const goalFor = (identityId: string, requestId: string) => config.goals.find((g) => g.identityId === identityId && g.requestId === requestId)
  const identity = (idv: string) => world.identities.find((i) => i.id === idv)!
  const selectedCell = selected ? matrix.find((r) => r.identityId === selected.identityId)?.cells.find((c) => c.requestId === selected.requestId) : null
  const bucketAvailable = [...config.world.bucket.policy, ...(config.bucketLibrary ?? []).filter((st) => !config.world.bucket.policy.some((x) => x.sid === st.sid))]

  return (
    <div className={s.lab}>
      <div className={s.config}>
        <div className={s.bucketHead}>
          <ShieldCheck size={18} aria-hidden="true" />
          <code>{world.bucket.name}</code>
          <Badge>conta {world.bucket.account}</Badge>
          <Badge tone="info">criptografia padrão: {world.bucket.defaultEncryption}</Badge>
        </div>

        {(config.bucketLibrary || config.world.bucket.policy.length > 0) && (
          <Library title="Bucket policy" available={bucketAvailable} active={value.bucketPolicy} disabled={disabled} onChange={(bucketPolicy) => onChange({ ...value, bucketPolicy })} />
        )}

        {Object.entries(config.identityLibrary ?? {}).map(([idv, lib]) => {
          const base = config.world.identities.find((i) => i.id === idv)?.policies ?? []
          const available = [...base, ...lib.filter((st) => !base.some((b) => b.sid === st.sid))]
          return (
            <Library
              key={idv}
              title={`Política IAM de ${identity(idv).name}`}
              available={available}
              active={value.identityPolicies[idv] ?? []}
              disabled={disabled}
              onChange={(sids) => onChange({ ...value, identityPolicies: { ...value.identityPolicies, [idv]: sids } })}
            />
          )
        })}

        {Object.entries(config.keyLibrary ?? {}).map(([kid, lib]) => {
          const key = config.world.keys.find((k) => k.id === kid)!
          const available = [...key.policy, ...lib.filter((st) => !key.policy.some((b) => b.sid === st.sid))]
          return (
            <Library
              key={kid}
              title={`Key policy de ${key.alias}`}
              available={available}
              active={value.keyPolicies[kid] ?? []}
              disabled={disabled}
              onChange={(sids) => onChange({ ...value, keyPolicies: { ...value.keyPolicies, [kid]: sids } })}
            />
          )
        })}

        {config.editable.bpa && (
          <section className={s.panel} aria-label="Block Public Access">
            <h4 className={s.panelTitle}>S3 Block Public Access (bucket)</h4>
            <div className={s.switches}>
              {BPA_INFO.map((b) => (
                <label key={b.key} className={s.switch}>
                  <input type="checkbox" checked={value.bpa[b.key]} disabled={disabled} onChange={(e) => onChange({ ...value, bpa: { ...value.bpa, [b.key]: e.target.checked } })} />
                  <span>
                    <code>{b.name}</code>
                    <small>{b.effect}</small>
                  </span>
                </label>
              ))}
            </div>
          </section>
        )}

        {config.editable.ownership && (
          <section className={s.panel} aria-label="Object Ownership">
            <h4 className={s.panelTitle}>Object Ownership</h4>
            <div className={s.segment} role="radiogroup" aria-label="Object Ownership">
              {(
                [
                  ['BucketOwnerEnforced', 'Bucket owner enforced (ACLs desativadas)'],
                  ['BucketOwnerPreferred', 'Bucket owner preferred (ACLs ativas)'],
                  ['ObjectWriter', 'Object writer (ACLs ativas)'],
                ] as const
              ).map(([v, label]) => (
                <button key={v} type="button" role="radio" className="pick-card" aria-checked={value.objectOwnership === v} disabled={disabled} onClick={() => onChange({ ...value, objectOwnership: v })}>
                  {label}
                </button>
              ))}
            </div>
          </section>
        )}

        {rejected.map((r) => (
          <div key={r} className={s.rejected} role="alert">
            <CircleAlert size={16} aria-hidden="true" /> {r}
          </div>
        ))}
      </div>

      <div className={s.results}>
        <h4 className={s.panelTitle}>Matriz de acesso (calculada ao vivo)</h4>
        <div className={s.tableWrap}>
          <table className={s.matrix}>
            <thead>
              <tr>
                <th scope="col">Identidade</th>
                {config.requests.map((r) => (
                  <th key={r.id} scope="col">
                    {r.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {matrix.map((row) => {
                const who = identity(row.identityId)
                return (
                  <tr key={row.identityId}>
                    <th scope="row">
                      <span className={s.who}>
                        <UserRound size={14} aria-hidden="true" /> {who.name}
                      </span>
                      <small>{who.description}</small>
                    </th>
                    {row.cells.map((c) => {
                      const goal = goalFor(row.identityId, c.requestId)
                      const met = goal ? c.decision.allowed === (goal.expect === 'allow') : undefined
                      return (
                        <td key={c.requestId} data-label={config.requests.find((r) => r.id === c.requestId)?.label}>
                          <button
                            type="button"
                            className={s.cell}
                            data-allowed={c.decision.allowed}
                            data-met={evaluation && goal ? String(met) : undefined}
                            aria-pressed={selected?.identityId === row.identityId && selected.requestId === c.requestId}
                            onClick={() => setSelected({ identityId: row.identityId, requestId: c.requestId })}
                            aria-label={`${who.name}, ${config.requests.find((r) => r.id === c.requestId)?.label}: ${c.decision.allowed ? 'permitido' : 'negado'}. Ver raciocínio.`}
                          >
                            {c.decision.allowed ? <Check size={16} aria-hidden="true" /> : <Ban size={16} aria-hidden="true" />}
                            {c.decision.allowed ? 'Permitido' : 'Negado'}
                          </button>
                        </td>
                      )
                    })}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        <div className={s.trace} aria-live="polite">
          {selectedCell ? (
            <>
              <strong>Por que {selectedCell.decision.allowed ? 'permitido' : 'negado'}?</strong>
              <ol>
                {selectedCell.decision.trace.map((t, i) => (
                  <li key={i}>{t}</li>
                ))}
              </ol>
            </>
          ) : (
            <span className="muted">Clique numa célula para ver o raciocínio do avaliador, passo a passo.</span>
          )}
        </div>
        <details className={s.simp}>
          <summary>Simplificações deste simulador</summary>
          <ul>
            <li>Avalia políticas de identidade, bucket policy, Block Public Access do bucket, ACLs, Object Ownership e key policies.</li>
            <li>Não modela SCPs, RCPs, permission boundaries, session policies, VPC endpoints, Access Points nem grants do KMS.</li>
            <li>Suporta só as condições aws:SecureTransport, aws:SourceIp, aws:PrincipalOrgID e s3:x-amz-server-side-encryption.</li>
          </ul>
        </details>
      </div>
    </div>
  )
}
