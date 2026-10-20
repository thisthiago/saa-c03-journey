/** Interface do laboratório "Quem paga a conta?". */
import { KeyRound, User, UserX } from 'lucide-react'
import type { Evaluation } from '../../engine/types'
import { Badge } from '../../ui/kit'
import type { RPAnswer, RPLabConfig, RPLabResponse } from './lab'
import { PAYER_LABEL, type Payer, type RPRequest } from './model'
import s from './rp.module.css'

interface Props {
  config: RPLabConfig
  value: RPLabResponse
  onChange: (v: RPLabResponse) => void
  disabled: boolean
  evaluation?: Evaluation | null
}

const PAYERS: Payer[] = ['owner', 'requester', 'none']

function who(r: RPRequest): { icon: typeof User; text: string } {
  if (r.principal.kind === 'anonymous') return { icon: UserX, text: 'Anônimo (sem credenciais)' }
  if (r.principal.kind === 'user') return { icon: User, text: `${r.principal.name} · conta ${r.principal.account}` }
  return { icon: KeyRound, text: `${r.principal.name} · usuário da conta ${r.principal.callerAccount} assumindo um papel da conta ${r.principal.roleAccount}` }
}

export function RequesterPaysLab({ config, value, onChange, disabled }: Props) {
  const b = config.bucket
  const set = (id: string, patch: Partial<RPAnswer>) => onChange({ answers: { ...value.answers, [id]: { ...value.answers?.[id], ...patch } } })
  return (
    <div className={s.lab}>
      <div className={s.head}>
        <code>{b.name}</code>
        <Badge tone={b.requesterPays ? 'info' : undefined}>{b.requesterPays ? 'Requester Pays habilitado' : 'Bucket comum'}</Badge>
        <Badge>dono: conta {b.ownerAccount}</Badge>
        {b.orgAccounts.length > 0 && <Badge>organização: {b.orgAccounts.join(', ')}</Badge>}
      </div>
      <ol className={s.rows}>
        {config.requests.map((r) => {
          const w = who(r)
          const Icon = w.icon
          const a = value.answers?.[r.id] ?? {}
          return (
            <li key={r.id} className={s.row}>
              <div className={s.desc}>
                <strong>{r.label}</strong>
                <span>
                  <Icon size={14} aria-hidden="true" /> {w.text}
                </span>
                <span className={s.tags}>
                  <Badge>{r.action}</Badge>
                  <Badge tone={r.header ? 'success' : 'warning'}>{r.header ? 'com x-amz-request-payer' : 'sem x-amz-request-payer'}</Badge>
                  <Badge tone={r.authorized ? 'success' : 'danger'}>{r.authorized ? 'política permite' : 'política não permite'}</Badge>
                  {r.gb !== undefined && <Badge>{r.gb.toLocaleString('pt-BR')} GB</Badge>}
                </span>
              </div>
              <div className={s.answers}>
                <label>
                  <span>Resposta do S3</span>
                  <select value={a.status ?? ''} disabled={disabled} onChange={(e) => set(r.id, { status: e.target.value ? (Number(e.target.value) as 200 | 403) : undefined })}>
                    <option value="">Escolha…</option>
                    <option value="200">200 OK</option>
                    <option value="403">403 AccessDenied</option>
                  </select>
                </label>
                <label>
                  <span>Quem paga a requisição</span>
                  <select value={a.requestPayer ?? ''} disabled={disabled} onChange={(e) => set(r.id, { requestPayer: (e.target.value || undefined) as Payer | undefined })}>
                    <option value="">Escolha…</option>
                    {PAYERS.map((p) => (
                      <option key={p} value={p}>
                        {PAYER_LABEL[p]}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  <span>Quem paga a transferência</span>
                  <select value={a.transferPayer ?? ''} disabled={disabled} onChange={(e) => set(r.id, { transferPayer: (e.target.value || undefined) as Payer | undefined })}>
                    <option value="">Escolha…</option>
                    {PAYERS.map((p) => (
                      <option key={p} value={p}>
                        {p === 'none' ? 'Não há / não cobrado do dono' : PAYER_LABEL[p]}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            </li>
          )
        })}
      </ol>
      <p className={s.note}>O armazenamento é sempre pago pelo dono do bucket. Em uma requisição negada ou sem download, escolha "Não há / não cobrado do dono" para a transferência.</p>
      <details className={s.simp}>
        <summary>Simplificações deste simulador</summary>
        <ul>
          <li>A autorização (IAM e bucket policy) aparece como "permite" ou "não permite".</li>
          <li>A cobrança de erros 403 em buckets sem Requester Pays e requisições SOAP não são simuladas.</li>
        </ul>
      </details>
    </div>
  )
}
