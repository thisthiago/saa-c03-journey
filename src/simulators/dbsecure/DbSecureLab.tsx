/** Interface do laboratório "Banco exposto": configurações do banco e a lista de exigências avaliada ao vivo. */
import type { Evaluation } from '../../engine/types'
import { renderInline } from '../../ui/inline'
import { FactTag } from '../shared/Tags'
import c from '../shared/compute.module.css'
import sh from '../shared/lab.module.css'
import s from '../lambda/lambda.module.css'
import type { DbSecureLabConfig, DbSecureLabResponse } from './lab'
import { checkRequirement, CREDENTIALS_LABEL, ENCRYPTION_LABEL, INGRESS_LABEL, REQ_LABEL, refusals, type Credentials, type Encryption, type Ingress } from './model'

interface Props {
  config: DbSecureLabConfig
  value: DbSecureLabResponse
  onChange: (v: DbSecureLabResponse) => void
  disabled: boolean
  evaluation?: Evaluation | null
}

export function DbSecureLab({ config, value, onChange, disabled, evaluation }: Props) {
  const v = value ?? config.initial
  const patch = (part: Partial<DbSecureLabResponse>) => onChange({ ...v, ...part })
  const blocked = refusals(v)
  return (
    <div className={sh.lab}>
      <p className={c.legend}>
        <FactTag date="21/10/2026" /> regras de criptografia, autenticação IAM, Secrets Manager, acesso público e snapshots da documentação do RDS (PostgreSQL).
      </p>
      <section className={sh.card} aria-label="Configuração do banco">
        <h4 className={sh.title}>Configuração do banco</h4>
        <div className={c.row}>
          <label className={c.field}>
            <span>Acesso público</span>
            <span>
              <input type="checkbox" checked={v.publicAccess} disabled={disabled} onChange={(e) => patch({ publicAccess: e.target.checked })} /> Public access ligado
            </span>
          </label>
          <label className={c.field}>
            <span>Security group do banco</span>
            <select className={c.select} value={v.ingress} disabled={disabled} onChange={(e) => patch({ ingress: e.target.value as Ingress })}>
              {(Object.keys(INGRESS_LABEL) as Ingress[]).map((k) => (
                <option key={k} value={k}>
                  {INGRESS_LABEL[k]}
                </option>
              ))}
            </select>
          </label>
          <label className={c.field}>
            <span>Criptografia em repouso</span>
            <select className={c.select} value={v.encryption} disabled={disabled} onChange={(e) => patch({ encryption: e.target.value as Encryption })}>
              {(Object.keys(ENCRYPTION_LABEL) as Encryption[]).map((k) => (
                <option key={k} value={k}>
                  {ENCRYPTION_LABEL[k]}
                </option>
              ))}
            </select>
          </label>
          <label className={c.field}>
            <span>Criptografia em trânsito</span>
            <span>
              <input type="checkbox" checked={v.tls} disabled={disabled} onChange={(e) => patch({ tls: e.target.checked })} /> rds.force_ssl = 1
            </span>
          </label>
          <label className={c.field}>
            <span>Credenciais da aplicação</span>
            <select className={c.select} value={v.credentials} disabled={disabled} onChange={(e) => patch({ credentials: e.target.value as Credentials })}>
              {(Object.keys(CREDENTIALS_LABEL) as Credentials[]).map((k) => (
                <option key={k} value={k}>
                  {CREDENTIALS_LABEL[k]}
                </option>
              ))}
            </select>
          </label>
          <label className={c.field}>
            <span>Backup automático (dias)</span>
            <input className={c.input} type="number" min={0} max={35} value={v.backupDays} disabled={disabled} onChange={(e) => patch({ backupDays: Number(e.target.value) })} style={{ width: '6em' }} />
          </label>
          <label className={c.field}>
            <span>Exclusão</span>
            <span>
              <input type="checkbox" checked={v.deletionProtection} disabled={disabled} onChange={(e) => patch({ deletionProtection: e.target.checked })} /> proteção contra exclusão
            </span>
          </label>
          <label className={c.field}>
            <span>Snapshot do mês passado</span>
            <span>
              <input type="checkbox" checked={v.publicSnapshot} disabled={disabled} onChange={(e) => patch({ publicSnapshot: e.target.checked })} /> público
            </span>
          </label>
        </div>
        {blocked.length > 0 && <p className={s.bad}>A AWS recusaria: {blocked.join('; ')}.</p>}
      </section>
      <section className={sh.card} aria-label="Exigências">
        <h4 className={sh.title}>Exigências da auditoria</h4>
        <ul className={s.goals} aria-live="polite">
          {config.requirements.map(({ req }) => {
            const r = checkRequirement(v, req)
            return (
              <li key={req} data-ok={r.ok}>
                <strong>
                  {r.ok ? '✓' : '✗'} {REQ_LABEL[req]}
                </strong>
                <span>{r.message}</span>
              </li>
            )
          })}
        </ul>
      </section>
      {evaluation?.items
        .filter((i) => i.id === 'refused')
        .map((i) => (
          <div key={i.id} className={sh.verdict} data-status="wrong">
            <span>{renderInline(i.message ?? '')}</span>
          </div>
        ))}
      <details className={sh.simp}>
        <summary>Simplificações deste simulador</summary>
        <ul>
          <li>Cada exigência é avaliada sozinha. Na vida real, a ordem importa: crie a instância criptografada e só depois ajuste as outras configurações nela.</li>
          <li>A troca para a instância criptografada exige apontar a aplicação para o endpoint novo e uma janela para copiar os dados mais recentes.</li>
          <li>A autenticação IAM vale para MariaDB, MySQL e PostgreSQL; outros motores usam a senha no Secrets Manager.</li>
        </ul>
      </details>
    </div>
  )
}
