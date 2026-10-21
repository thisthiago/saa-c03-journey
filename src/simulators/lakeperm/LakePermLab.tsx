/** Interface do laboratório "Quem vê o quê": as concessões de cada analista e a tabela como ele a enxerga, ao vivo. */
import type { Evaluation } from '../../engine/types'
import { renderInline } from '../../ui/inline'
import { FactTag, PremiseTag } from '../shared/Tags'
import c from '../shared/compute.module.css'
import sh from '../shared/lab.module.css'
import n from '../shared/net.module.css'
import { grantsOf, type LakePermLabConfig, type LakePermLabResponse } from './lab'
import { describeGrant, visibleCells } from './model'

interface Props {
  config: LakePermLabConfig
  value: LakePermLabResponse
  onChange: (v: LakePermLabResponse) => void
  disabled: boolean
  evaluation?: Evaluation | null
}

export function LakePermLab({ config, value, onChange, disabled, evaluation }: Props) {
  const t = config.table
  return (
    <div className={sh.lab}>
      <p className={c.legend}>
        <FactTag date="21/10/2026" /> filtros de dados limitam colunas, linhas ou as duas coisas; LF-Tags liberam as colunas com a tag concedida; a configuração padrão deixa o acesso só com o IAM · <PremiseTag /> a tabela, as linhas de exemplo e o que cada pessoa precisa ver.
      </p>
      <p className={sh.desc}>
        Tabela <span className={c.mono}>{t.name}</span>, com {t.rows.length} linhas de exemplo. LF-Tags das colunas:{' '}
        {t.columns
          .filter((col) => col.tags && Object.keys(col.tags).length)
          .map((col) => `${col.label} (${Object.entries(col.tags!).map(([k, v]) => `${k}=${v}`).join(', ')})`)
          .join('; ')}
        .
      </p>
      {config.analysts.map((a) => {
        const picked = value.grants?.[a.id] ?? []
        const toggle = (id: string, on: boolean) => onChange({ grants: { ...value.grants, [a.id]: on ? [...picked, id] : picked.filter((x) => x !== id) } })
        const seen = visibleCells(t, grantsOf(config, picked))
        const fb = evaluation?.items.find((i) => i.id === a.id)
        return (
          <section key={a.id} className={sh.card} aria-label={a.name}>
            <h4 className={sh.title}>{a.name}</h4>
            <p className={sh.desc}>{renderInline(a.need)}</p>
            <ul className={n.group}>
              {config.palette.map((p) => (
                <li key={p.id}>
                  <label>
                    <input type="checkbox" checked={picked.includes(p.id)} disabled={disabled} onChange={(e) => toggle(p.id, e.target.checked)} /> {describeGrant(t, p.grant)}
                  </label>
                </li>
              ))}
            </ul>
            <div className={c.scroll}>
              <table className={c.table} aria-label={`A tabela como ${a.name} enxerga`}>
                <thead>
                  <tr>
                    {t.columns.map((col) => (
                      <th key={col.id}>{col.label}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {t.rows.map((r, i) => (
                    <tr key={i}>
                      {t.columns.map((col) => (
                        <td key={col.id} className={seen.has(`${i}:${col.id}`) ? undefined : c.muted}>
                          {seen.has(`${i}:${col.id}`) ? r[col.id] : 'oculto'}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
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
          <li>Todas as concessões são de leitura (SELECT) e se somam: a pessoa vê a união do que cada uma libera.</li>
          <li>As permissões do IAM de cada pessoa já permitem usar o Athena e o Data Catalog; o simulador mostra só o efeito do Lake Formation.</li>
          <li>A tabela tem poucas linhas de exemplo; numa tabela real, o filtro vale para todas as linhas.</li>
        </ul>
      </details>
    </div>
  )
}
