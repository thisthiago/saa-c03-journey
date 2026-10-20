/** Interface da auditoria de credenciais: linhas do relatório e ações escolhidas para cada uma. */
import { KeyRound, ShieldCheck, ShieldOff, UserRound } from 'lucide-react'
import type { Evaluation } from '../../engine/types'
import { Badge } from '../../ui/kit'
import { renderInline } from '../../ui/inline'
import { FactTag, PremiseTag } from '../shared/Tags'
import sh from '../shared/lab.module.css'
import type { CredentialsLabConfig, CredentialsLabResponse } from './lab'
import { ACTION_LABEL, ACTION_ORDER, keySummary, USE_LABEL, type CredAction } from './model'
import s from './credentials.module.css'

interface Props {
  config: CredentialsLabConfig
  value: CredentialsLabResponse
  onChange: (v: CredentialsLabResponse) => void
  disabled: boolean
  evaluation?: Evaluation | null
}

const KIND_LABEL = { root: 'usuário raiz', user: 'usuário IAM', role: 'role' }

export function CredentialsLab({ config, value, onChange, disabled, evaluation }: Props) {
  const toggle = (rowId: string, a: CredAction) => {
    const cur = value.picks?.[rowId] ?? []
    const next = cur.includes(a) ? cur.filter((x) => x !== a) : a === 'keep' ? ['keep' as const] : [...cur.filter((x) => x !== 'keep'), a]
    onChange({ picks: { ...value.picks, [rowId]: next } })
  }
  return (
    <div className={sh.lab}>
      <div className={s.policy}>
        <strong>Regras da empresa</strong> <PremiseTag />
        <ul>
          <li>Chaves de acesso com mais de {config.policy.rotateAfterDays} dias precisam de rotação.</li>
          <li>Credencial sem uso há mais de {config.policy.unusedAfterDays} dias é considerada abandonada.</li>
          <li>{config.policy.federation ? 'A empresa já tem o IAM Identity Center ligado ao provedor de identidade dos funcionários.' : 'A empresa ainda não tem federação de identidades: esta conta é avulsa.'}</li>
        </ul>
        <p className={s.legend}>
          <FactTag date="19/10/2026" /> As ações recomendadas seguem as boas práticas do IAM. Escolha uma ou mais ações por linha.
        </p>
      </div>
      {config.rows.map((row) => {
        const picks = value.picks?.[row.id] ?? []
        const fb = evaluation?.items.find((i) => i.id === row.id)
        return (
          <section key={row.id} className={sh.card} aria-label={`Credenciais de ${row.name}`}>
            <div className={s.head}>
              <UserRound size={16} aria-hidden="true" />
              <h4 className={sh.title}>
                <code>{row.name}</code>
              </h4>
              <Badge>{KIND_LABEL[row.kind]}</Badge>
            </div>
            <p className={sh.desc}>
              {row.use === 'root' || row.use === 'role' ? null : `Quem usa: ${USE_LABEL[row.use]}. `}
              {row.note ? renderInline(row.note) : null}
            </p>
            <ul className={s.facts}>
              {row.kind !== 'role' && <li>Senha do console: {row.password ? 'sim' : 'não'}</li>}
              {row.kind !== 'role' && (
                <li>
                  {row.mfa ? <ShieldCheck size={14} aria-hidden="true" /> : <ShieldOff size={14} aria-hidden="true" />} MFA: {row.mfa ? 'habilitado' : 'não habilitado'}
                </li>
              )}
              {row.kind === 'role' ? (
                <li>Sem senha e sem chaves de acesso: só credenciais temporárias.</li>
              ) : row.keys.length === 0 ? (
                <li>Nenhuma chave de acesso.</li>
              ) : (
                row.keys.map((k) => (
                  <li key={k.id}>
                    <KeyRound size={14} aria-hidden="true" /> {keySummary(k)}
                  </li>
                ))
              )}
            </ul>
            <div className={s.actions} role="group" aria-label={`Ações para ${row.name}`}>
              {ACTION_ORDER.map((a) => (
                <button key={a} type="button" className={s.action} aria-pressed={picks.includes(a)} disabled={disabled} onClick={() => toggle(row.id, a)}>
                  {ACTION_LABEL[a]}
                </button>
              ))}
            </div>
            {fb && (
              <div className={sh.verdict} data-status={fb.status} aria-live="polite">
                <span>{renderInline(fb.message ?? '')}</span>
              </div>
            )}
          </section>
        )
      })}
      <details className={sh.simp}>
        <summary>Simplificações deste simulador</summary>
        <ul>
          <li>As idades e os últimos usos das chaves são premissas do cenário; na AWS eles aparecem no relatório de credenciais e na coluna "Último uso" do console.</li>
          <li>Os prazos de rotação e de abandono são regras da empresa fictícia, não limites da AWS.</li>
          <li>Cada linha recebe as ações principais; numa migração real também se revisam as permissões e se acompanha o CloudTrail.</li>
        </ul>
      </details>
    </div>
  )
}
