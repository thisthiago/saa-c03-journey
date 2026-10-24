/**
 * Testes de componente do Codex: só os descobertos por padrão, busca por sigla de serviço,
 * estados vazios e filtros guardados na URL.
 */
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { beforeEach, describe, expect, it } from 'vitest'
import { createInitialProgress } from '../../engine/progress'
import { flushSave, useGame } from '../../store/gameStore'
import { CodexPage } from './CodexPage'
import { ConceptPage } from './ConceptPage'

const NOW = new Date('2026-10-24T12:00:00Z')

function seed(discovered: string[]) {
  const progress = createInitialProgress(NOW)
  progress.discovered = Object.fromEntries(discovered.map((id) => [id, NOW.toISOString()]))
  useGame.setState({ progress })
  // Grava agora: o salvamento com atraso dispararia depois que o ambiente do teste já foi desmontado.
  flushSave()
}

function renderCodex(path = '/codex') {
  const router = createMemoryRouter(
    [
      { path: '/codex', element: <CodexPage /> },
      { path: '/codex/:conceptId', element: <ConceptPage /> },
    ],
    { initialEntries: [path] },
  )
  render(<RouterProvider router={router} />)
  return router
}

const cards = () => screen.queryAllByRole('link').filter((a) => a.getAttribute('href')?.startsWith('/codex/'))

describe('Codex', () => {
  beforeEach(() => seed([]))

  it('sem conceitos descobertos, explica como descobrir e não lista cartões bloqueados', () => {
    renderCodex()
    expect(screen.getByRole('heading', { name: 'Nenhum conceito descoberto ainda' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Começar a missão/ })).toBeInTheDocument()
    expect(cards()).toHaveLength(0)
    expect(screen.queryByText(/ainda não descobertos?\./)).not.toBeInTheDocument()
  })

  it('lista só os descobertos, agrupados por trilha e fase', () => {
    seed(['storage.object', 'storage.block'])
    renderCodex()
    expect(cards().map((a) => a.textContent)).toEqual([expect.stringContaining('Armazenamento de objetos'), expect.stringContaining('Armazenamento em blocos')])
    expect(screen.getByRole('heading', { level: 2, name: 'S3 Expedition' })).toBeInTheDocument()
    expect(screen.getByText('2 conceitos descobertos na lista.')).toBeInTheDocument()
  })

  it('a busca encontra pela sigla do serviço ligado ao conceito', async () => {
    seed(['storage.object', 'storage.block'])
    renderCodex()
    await userEvent.type(screen.getByRole('searchbox', { name: 'Buscar conceito' }), 's3')
    expect(cards().map((a) => a.textContent)).toEqual([expect.stringContaining('Armazenamento de objetos')])
    expect(screen.getByText('1 conceito encontrado.')).toBeInTheDocument()
  })

  it('busca sem resultado explica o motivo e Limpar busca restaura a lista', async () => {
    seed(['storage.object', 'storage.block'])
    renderCodex()
    const input = screen.getByRole('searchbox', { name: 'Buscar conceito' })
    await userEvent.type(input, 'zzz')
    expect(screen.getByRole('heading', { name: 'Nenhum conceito descoberto corresponde a “zzz”' })).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Limpar busca' }))
    expect(input).toHaveValue('')
    expect(input).toHaveFocus()
    expect(cards()).toHaveLength(2)
  })

  it('Esc limpa a busca', async () => {
    seed(['storage.object'])
    renderCodex()
    const input = screen.getByRole('searchbox', { name: 'Buscar conceito' })
    await userEvent.type(input, 'zzz{Escape}')
    expect(input).toHaveValue('')
    expect(cards()).toHaveLength(1)
  })

  it('mostra os não descobertos numa linha por fase, com link para a fase', async () => {
    seed(['storage.object'])
    renderCodex()
    await userEvent.click(screen.getByRole('checkbox', { name: 'Mostrar os não descobertos' }))
    const phase = screen.getByRole('heading', { level: 3, name: /Fase 1 · Fundamentos do Amazon S3/ }).closest('section')!
    expect(within(phase).getByText(/conceitos ainda não descobertos\. Eles aparecem nas missões desta fase\./)).toBeInTheDocument()
    expect(within(phase).getByRole('link', { name: /Ver a fase/ })).toHaveAttribute('href', '/fase/s3x.f01')
    expect(cards()).toHaveLength(1)
  })

  it('o filtro de trilha sem descobertos oferece o mapa da trilha', () => {
    seed(['storage.object'])
    renderCodex('/codex?trilha=identity.iam-access')
    expect(screen.getByRole('heading', { name: /Você ainda não descobriu conceitos da trilha/ })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Abrir o mapa da trilha' })).toHaveAttribute('href', '/trilha/identity.iam-access')
  })

  it('o link de volta da página do conceito restaura a busca', async () => {
    seed(['storage.object', 'storage.block'])
    const router = renderCodex('/codex?busca=blocos')
    await userEvent.click(screen.getByRole('link', { name: /Armazenamento em blocos/ }))
    expect(router.state.location.pathname).toBe('/codex/storage.block')
    await userEvent.click(screen.getByRole('link', { name: 'Codex' }))
    expect(router.state.location.search).toBe('?busca=blocos')
    expect(screen.getByRole('searchbox', { name: 'Buscar conceito' })).toHaveValue('blocos')
  })
})
