/**
 * Testes de componente: as interações de arrastar também funcionam só com o teclado
 * (foco + Enter), sem nenhum evento de ponteiro.
 */
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { describe, expect, it } from 'vitest'
import { evaluateActivity, type PlacementResponse } from './evaluate'
import type { BuildActivity, ClassifyActivity, MatchActivity } from './types'
import { BuildView, ClassifyView, MatchView } from './views'

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
  // Cópias iguais (montagem): a última do DOM é a que ainda está na lista de peças.
  screen.getAllByRole('button', { name: new RegExp(itemName) }).at(-1)!.focus()
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

  it('montagem sobre o desenho só com o teclado, com cópias e bandeja', async () => {
    const build: BuildActivity = {
      id: 't.build',
      kind: 'build',
      title: 'Teste',
      prompt: 'Monte',
      concepts: [{ id: 'x' }],
      xp: 10,
      difficulty: 1,
      explanation: [''],
      board: { width: 400, height: 200, label: 'Duas zonas', boxes: [{ id: 'z', kind: 'zone', label: 'Zonas', x: 10, y: 10, w: 380, h: 180 }] },
      pieces: [
        { id: 'web', text: 'Sub-rede web', count: 2, explanation: '' },
        { id: 'span', text: 'Sub-rede nas duas zonas', explanation: '' },
      ],
      slots: [
        { id: 'a', label: 'Zona a', x: 20, y: 40, w: 160, h: 80, expect: { web: 1 }, explanation: '' },
        { id: 'b', label: 'Zona b', x: 220, y: 40, w: 160, h: 80, expect: { web: 1 }, explanation: '' },
      ],
    }
    const user = userEvent.setup()
    let last: PlacementResponse = { placements: {} }
    function BuildHarness() {
      const [value, setValue] = useState<PlacementResponse>({ placements: {} })
      return (
        <BuildView
          activity={build}
          value={value}
          onChange={(v) => {
            setValue(v)
            last = v
          }}
          disabled={false}
          seed="s"
        />
      )
    }
    render(<BuildHarness />)
    await placeWithKeyboard(user, '^Sub-rede web$', 'Zona a')
    await placeWithKeyboard(user, '^Sub-rede web$', 'Zona b')
    await placeWithKeyboard(user, 'Sub-rede nas duas zonas', 'Não entra nesta rede')
    expect(evaluateActivity(build, last).score).toBe(1)
  })
})
