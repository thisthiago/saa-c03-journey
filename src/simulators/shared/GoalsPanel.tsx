/** Lista das metas do laboratório, visível antes da verificação. */
import sh from './lab.module.css'

export function GoalsPanel({ goals }: { goals: { label: string; why: string }[] }) {
  return (
    <section className={sh.card} aria-label="Requisitos">
      <h4 className={sh.title}>Requisitos que a configuração precisa atender</h4>
      <ul className={sh.goals}>
        {goals.map((g, i) => (
          <li key={i}>
            <strong>{g.label}.</strong> {g.why}
          </li>
        ))}
      </ul>
    </section>
  )
}
