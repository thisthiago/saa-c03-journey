/**
 * Teste de componente: nos laboratórios com metas, todas aparecem antes da
 * verificação — prazos, classes e orçamento não podem ser surpresa.
 */
import { render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { ActivityView } from '../../activities/registry'
import { initialResponse } from '../../activities/ui-logic'
import { registry } from '../../content'

const LABS = ['lifecycle', 'events', 'replication', 'versioning']
const activities = [...registry.activities.values()].map((r) => r.activity).filter((a) => a.kind === 'lab' && LABS.includes(a.lab))

describe('requisitos visíveis antes da verificação', () => {
  it('há laboratórios desses tipos no conteúdo', () => {
    expect(activities.length).toBeGreaterThanOrEqual(LABS.length)
  })

  it.each(activities.map((a) => [a.id, a] as const))('%s lista todas as metas', (id, activity) => {
    render(<ActivityView activity={activity} value={initialResponse(activity, id)} onChange={() => {}} disabled={false} seed={id} />)
    const panel = screen.getByRole('region', { name: 'Requisitos' })
    const goals = (activity as unknown as { config: { goals: { why: string }[] } }).config.goals
    expect(within(panel).getAllByRole('listitem')).toHaveLength(goals.length)
    for (const g of goals) expect(panel.textContent).toContain(g.why)
  })
})
