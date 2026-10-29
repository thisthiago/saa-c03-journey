/**
 * Testes de componente do mapa de serviços: um nó por serviço, busca, painel
 * de serviço bloqueado sem link de missão nem conceito escondido, filtros,
 * teclado e a garantia de que explorar o mapa não muda o progresso.
 */
import { act, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { registry } from '../../content'
import { createInitialProgress } from '../../engine/progress'
import { flushSave, useGame } from '../../store/gameStore'
import { ServiceMap } from './ServiceMap'

const NOW = new Date('2026-10-29T12:00:00Z')

beforeAll(() => {
  vi.stubGlobal('matchMedia', (query: string) => ({ matches: query.includes('min-width'), media: query, addEventListener: () => {}, removeEventListener: () => {} }))
})

function seed(discovered: string[] = []) {
  const progress = createInitialProgress(NOW)
  progress.discovered = Object.fromEntries(discovered.map((id) => [id, NOW.toISOString()]))
  useGame.setState({ progress })
  flushSave()
}

function renderMap(path = '/mapa?vista=servicos') {
  const router = createMemoryRouter([{ path: '/mapa', element: <ServiceMap /> }], { initialEntries: [path] })
  render(<RouterProvider router={router} />)
  return router
}

const graphNodes = () => within(screen.getByRole('group', { name: /^Mapa de serviços/ })).getAllByRole('button')
const node = (id: string) => document.querySelector<SVGGElement>(`[data-service="${id}"]`)!

describe('mapa de serviços', () => {
  beforeEach(() => seed())

  it('desenha um nó por serviço e a lista mostra os mesmos serviços', async () => {
    renderMap()
    expect(graphNodes()).toHaveLength(registry.services.size)
    expect(node('aws.transit-gateway').dataset.status).toBe('locked')
    expect(node('aws.s3').dataset.status).toBe('available')
    await userEvent.click(screen.getByRole('button', { name: /Lista/ }))
    expect(screen.getAllByRole('button', { pressed: false }).filter((b) => b.className.includes('listItem'))).toHaveLength(registry.services.size)
  })

  it('a busca encontra o serviço e abre o painel', async () => {
    const router = renderMap()
    await userEvent.type(screen.getByRole('combobox', { name: 'Buscar serviço' }), 'lambda')
    await userEvent.keyboard('{Enter}')
    expect(screen.getByRole('heading', { level: 2, name: 'AWS Lambda' })).toBeInTheDocument()
    expect(router.state.location.search).toContain('servico=aws.lambda')
    expect(node('aws.lambda').getAttribute('aria-pressed')).toBe('true')
  })

  it('serviço bloqueado: sem link de missão, sem título de conceito não descoberto, com o caminho para liberar', () => {
    renderMap('/mapa?vista=servicos&servico=aws.transit-gateway')
    const panel = screen.getByRole('heading', { level: 2, name: 'Transit Gateway' }).closest('section')!
    expect(within(panel).getByText('Ainda bloqueado')).toBeInTheDocument()
    expect(within(panel).getByText(/Para liberar, conclua antes/)).toBeInTheDocument()
    expect(within(panel).queryAllByRole('link').some((a) => a.getAttribute('href')?.startsWith('/missao/'))).toBe(false)
    expect(within(panel).getByRole('link', { name: /Ver no mapa da trilha/ })).toHaveAttribute('href', expect.stringMatching(/^\/trilha\//))
    const hidden = [...registry.concepts.values()].filter((c) => c.serviceIds.includes('aws.transit-gateway') && c.title !== 'Transit Gateway')
    for (const c of hidden) expect(within(panel).queryByText(c.title)).not.toBeInTheDocument()
    expect(within(panel).getByText(/ainda não descobertos?\./)).toBeInTheDocument()
  })

  it('mostra só os conceitos descobertos, com link para o Codex', () => {
    seed(['storage.object'])
    renderMap('/mapa?vista=servicos&servico=aws.s3')
    const title = registry.concepts.get('storage.object')!.title
    expect(screen.getByRole('link', { name: title })).toHaveAttribute('href', '/codex/storage.object')
    expect(screen.getByRole('link', { name: /^Começar:/ })).toHaveAttribute('href', expect.stringMatching(/^\/missao\//))
  })

  it('os filtros esmaecem os outros nós, se combinam e podem ser desfeitos', async () => {
    renderMap()
    await userEvent.click(screen.getByRole('radio', { name: /^Bloqueados/ }))
    expect(node('aws.s3').dataset.dim).toBeDefined()
    expect(node('aws.transit-gateway').dataset.dim).toBeUndefined()
    const locked = graphNodes().filter((n) => n.dataset.status === 'locked').length
    expect(screen.getByText(new RegExp(`Mostrando ${locked} de ${registry.services.size}`))).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: /^Redes/ }))
    expect(node('aws.waf').dataset.dim).toBeDefined()
    expect(node('aws.transit-gateway').dataset.dim).toBeUndefined()
    await userEvent.click(screen.getByRole('button', { name: 'Limpar filtros' }))
    expect(graphNodes().filter((n) => n.dataset.dim !== undefined)).toHaveLength(0)
    expect(screen.getByText(new RegExp(`Mostrando ${registry.services.size} de ${registry.services.size}`))).toBeInTheDocument()
  })

  it('o teclado navega entre os nós, abre e fecha os detalhes', async () => {
    renderMap()
    const first = graphNodes().find((n) => n.getAttribute('tabindex') === '0')!
    act(() => first.focus())
    await userEvent.keyboard('{ArrowLeft}')
    const moved = document.activeElement as SVGGElement
    expect(moved).not.toBe(first)
    expect(moved.getAttribute('tabindex')).toBe('0')
    await userEvent.keyboard('{Enter}')
    const name = registry.services.get(moved.dataset.service!)!.shortName
    expect(screen.getByRole('heading', { level: 2, name })).toBeInTheDocument()
    await userEvent.keyboard('{Escape}')
    expect(screen.queryByRole('heading', { level: 2, name })).not.toBeInTheDocument()
  })

  it('explorar o mapa não muda o progresso', async () => {
    const before = useGame.getState().progress
    renderMap()
    await userEvent.click(node('aws.s3'))
    await userEvent.click(screen.getByRole('button', { name: /^Amazon EC2/ }))
    await userEvent.click(screen.getByRole('radio', { name: /^Concluídos/ }))
    expect(useGame.getState().progress).toBe(before)
  })
})
