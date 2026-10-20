/**
 * Teste de componente: o laboratório de AZs funciona só com o teclado —
 * posicionar instâncias, escolher o cenário de falha e ouvir o resultado.
 */
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { describe, expect, it } from 'vitest'
import { AGENDA_CONCENTRATED } from '../../content/modules/foundations/phases/f01/phase'
import { evaluateZonesLab, type ZonesLabConfig } from './lab'
import type { ZonesTopology } from './model'
import { ZonesLab } from './ZonesLab'

const config: ZonesLabConfig = {
  initial: AGENDA_CONCENTRATED,
  solution: AGENDA_CONCENTRATED,
  goals: [{ kind: 'survive-az' }],
}

function Harness({ onValue }: { onValue: (v: ZonesTopology) => void }) {
  const [value, setValue] = useState<ZonesTopology>(structuredClone(AGENDA_CONCENTRATED))
  return (
    <ZonesLab
      config={config}
      value={value}
      onChange={(v) => {
        setValue(v)
        onValue(v)
      }}
      disabled={false}
    />
  )
}

describe('laboratório de AZs por teclado', () => {
  it('derrubar a AZ a na arquitetura concentrada anuncia "fora do ar"', async () => {
    const user = userEvent.setup()
    render(<Harness onValue={() => {}} />)
    const group = screen.getByRole('radiogroup', { name: 'Cenário de falha' })
    within(group).getByRole('radio', { name: /Falha da AZ a/ }).focus()
    await user.keyboard('{Enter}')
    const status = screen.getByText(/Falha da AZ a: aplicação fora do ar/)
    expect(status.closest('[aria-live]')).not.toBeNull()
  })

  it('reposicionar instâncias e trocar NAT e banco pelo teclado elimina o ponto único de falha', async () => {
    const user = userEvent.setup()
    let last: ZonesTopology = AGENDA_CONCENTRATED
    render(<Harness onValue={(v) => (last = v)} />)
    const move = async (item: string, az: string) => {
      screen.getByRole('button', { name: new RegExp(`^${item}`) }).focus()
      await user.keyboard('{Enter}')
      screen.getByRole('button', { name: `Posicionar em AZ ${az}` }).focus()
      await user.keyboard('{Enter}')
    }
    await move('web-3', 'b')
    await move('web-4', 'b')
    await move('web-5', 'c')
    await move('web-6', 'c')
    await user.click(screen.getByRole('checkbox', { name: /AZ c/ }))
    await user.selectOptions(screen.getByRole('combobox', { name: 'Modo do NAT gateway' }), 'regional')
    await user.selectOptions(screen.getByRole('combobox', { name: 'Implantação do banco' }), 'multi-az')
    expect(last.instances).toMatchObject({ 'web-3': 'b', 'web-5': 'c' })
    expect(evaluateZonesLab(config, last).score).toBe(1)
  })
})
