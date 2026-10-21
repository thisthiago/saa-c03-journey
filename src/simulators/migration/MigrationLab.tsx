/** Interface do laboratório de migração: um plano do DMS por banco, com a checagem ao vivo. */
import type { Evaluation } from '../../engine/types'
import { renderInline } from '../../ui/inline'
import { FactTag, PremiseTag } from '../shared/Tags'
import c from '../shared/compute.module.css'
import sh from '../shared/lab.module.css'
import s from '../lambda/lambda.module.css'
import { EMPTY_PLAN, type MigrationLabConfig, type MigrationLabResponse } from './lab'
import { checkPlan, CUTOVER_MIN, ENGINE_LABEL, isHeterogeneous, LOAD_GB_PER_HOUR, SCHEMA_LABEL, TASK_LABEL, type MigrationPlan, type SchemaTool, type TaskType } from './model'

interface Props {
  config: MigrationLabConfig
  value: MigrationLabResponse
  onChange: (v: MigrationLabResponse) => void
  disabled: boolean
  evaluation?: Evaluation | null
}

export function MigrationLab({ config, value, onChange, disabled, evaluation }: Props) {
  const set = (id: string, p: MigrationPlan) => onChange({ plans: { ...value.plans, [id]: p } })
  return (
    <div className={sh.lab}>
      <p className={c.legend}>
        <FactTag date="21/10/2026" /> tipos de tarefa, conversão de esquema e validação da documentação do DMS · <PremiseTag /> carga completa a {LOAD_GB_PER_HOUR} GB por hora e virada de {CUTOVER_MIN} minutos.
      </p>
      {config.items.map((it) => {
        const p = value.plans?.[it.id] ?? EMPTY_PLAN
        const patch = (part: Partial<MigrationPlan>) => set(it.id, { ...p, ...part })
        const checks = checkPlan(it.scenario, p)
        const fbs = evaluation?.items.filter((i) => i.id.startsWith(`${it.id}:`)) ?? []
        const sc = it.scenario
        return (
          <section key={it.id} className={sh.card} aria-label={it.name}>
            <h4 className={sh.title}>{it.name}</h4>
            <p className={sh.desc}>{renderInline(it.description)}</p>
            <ul className={c.needs}>
              <li>
                De {ENGINE_LABEL[sc.source]} para {ENGINE_LABEL[sc.target]} ({isHeterogeneous(sc) ? 'motores diferentes' : 'mesmo motor'}), {sc.sizeGB.toLocaleString('pt-BR')} GB
              </li>
              <li>Pode ficar até {sc.maxDowntimeMin} minutos sem gravar na virada</li>
              {sc.targetPreloaded && <li>O destino já recebeu a carga inicial por um backup nativo</li>}
              {sc.parallelRun && <li>Origem e destino rodam em paralelo por semanas antes da virada</li>}
              {sc.mustValidate && <li>A auditoria exige comprovar que os dados chegaram iguais</li>}
            </ul>
            <div className={c.row}>
              <label className={c.field}>
                <span>Esquema</span>
                <select className={c.select} value={p.schema} disabled={disabled} onChange={(e) => patch({ schema: e.target.value as SchemaTool })}>
                  {(Object.keys(SCHEMA_LABEL) as SchemaTool[]).map((k) => (
                    <option key={k} value={k}>
                      {SCHEMA_LABEL[k]}
                    </option>
                  ))}
                </select>
              </label>
              <label className={c.field}>
                <span>Tarefa do DMS</span>
                <select className={c.select} value={p.task ?? ''} disabled={disabled} onChange={(e) => patch({ task: (e.target.value || undefined) as TaskType | undefined })}>
                  <option value="">Escolha</option>
                  {(Object.keys(TASK_LABEL) as TaskType[]).map((k) => (
                    <option key={k} value={k}>
                      {TASK_LABEL[k]}
                    </option>
                  ))}
                </select>
              </label>
              <label className={c.field}>
                <span>Validação</span>
                <span>
                  <input type="checkbox" checked={p.validation} disabled={disabled} onChange={(e) => patch({ validation: e.target.checked })} /> ligar a validação dos dados
                </span>
              </label>
            </div>
            <ul className={s.goals} aria-live="polite">
              {checks.map((ch) => (
                <li key={ch.id} data-ok={ch.ok}>
                  <span>{ch.message}</span>
                </li>
              ))}
            </ul>
            {fbs.some((f) => f.status !== 'correct') && <p className={c.cost}>Revise os itens marcados em vermelho.</p>}
          </section>
        )
      })}
      <details className={sh.simp}>
        <summary>Simplificações deste simulador</summary>
        <ul>
          <li>A velocidade da carga completa e o tempo da virada são fixos do cenário; na vida real, dependem da rede, da instância de replicação e do volume de mudanças.</li>
          <li>O plano não inclui a rede até o data center (VPN ou Direct Connect) nem a avaliação prévia da migração (premigration assessment).</li>
        </ul>
      </details>
    </div>
  )
}
