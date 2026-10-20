/**
 * Testes de componente: as interações de arrastar também funcionam só com o teclado
 * (foco + Enter), sem nenhum evento de ponteiro.
 */
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { describe, expect, it } from 'vitest'
import { evaluateActivity, type PlacementResponse } from './evaluate'
import type { ClassifyActivity, MatchActivity } from './types'
import { ClassifyView, MatchView } from './views'

const classify: ClassifyActivity = {
  id: 't.classify',
  kind: 'classify',
  title: 'Teste',
  prompt: 'Classifique',
  concepts: [{ id: 'x' }],
  xp: 10,
  difficulty: 1,
  explanation: [''],
  bins: [
    { id: 'obj', label: 'Objeto' },
    { id: 'blk', label: 'Bloco' },
  ],
  items: [
    { id: 'i1', text: 'Amazon S3', bin: 'obj', explanation: '' },
    { id: 'i2', text: 'Amazon EBS', bin: 'blk', explanation: '' },
  ],
}

const match: MatchActivity = {
  id: 't.match',
  kind: 'match',
  title: 'Teste',
  prompt: 'Associe',
  concepts: [{ id: 'x' }],
  xp: 10,
  difficulty: 1,
  explanation: [''],
  leftLabel: 'A',
  rightLabel: 'B',
  pairs: [
    { id: 'p1', left: 'Standard', right: 'Acesso frequente', explanation: '' },
    { id: 'p2', left: 'Deep Archive', right: 'Retenção de anos', explanation: '' },
  ],
}

function Harness({ kind, onValue }: { kind: 'classify' | 'match'; onValue: (v: PlacementResponse) => void }) {
  const [value, setValue] = useState<PlacementResponse>({ placements: {} })
  const change = (v: PlacementResponse) => {
    setValue(v)
    onValue(v)
  }
  return kind === 'classify' ? (
    <ClassifyView activity={classify} value={value} onChange={change} disabled={false} seed="s" />
  ) : (
    <MatchView activity={match} value={value} onChange={change} disabled={false} seed="s" />
  )
}

async function placeWithKeyboard(user: ReturnType<typeof userEvent.setup>, itemName: string, targetName: string) {
  screen.getByRole('button', { name: new RegExp(itemName) }).focus()
  await user.keyboard('{Enter}')
  screen.getByRole('button', { name: `Posicionar em ${targetName}` }).focus()
  await user.keyboard('{Enter}')
}

describe('interações acessíveis por teclado', () => {
  it('classificação completa só com o teclado chega a 100%', async () => {
    const user = userEvent.setup()
    let last: PlacementResponse = { placements: {} }
    render(<Harness kind="classify" onValue={(v) => (last = v)} />)
    await placeWithKeyboard(user, 'Amazon S3', 'Objeto')
    await placeWithKeyboard(user, 'Amazon EBS', 'Bloco')
    expect(last.placements).toEqual({ i1: 'obj', i2: 'blk' })
    expect(evaluateActivity(classify, last).score).toBe(1)
  })

  it('anuncia cada posicionamento para leitores de tela', async () => {
    const user = userEvent.setup()
    render(<Harness kind="classify" onValue={() => {}} />)
    await placeWithKeyboard(user, 'Amazon S3', 'Objeto')
    expect(screen.getByText('Amazon S3 posicionado em Objeto.')).toBeInTheDocument()
  })

  it('associação um para um só com o teclado', async () => {
    const user = userEvent.setup()
    let last: PlacementResponse = { placements: {} }
    render(<Harness kind="match" onValue={(v) => (last = v)} />)
    await placeWithKeyboard(user, 'Standard', 'Acesso frequente')
    await placeWithKeyboard(user, 'Deep Archive', 'Retenção de anos')
    expect(evaluateActivity(match, last).score).toBe(1)
  })
})
