/**
 * Mapa das trilhas medido no navegador: nenhum nó encosta em outro e nenhuma
 * linha passa por cima de um nó que ela não liga (nem do selo e do rótulo dos
 * nós que liga). Complementa o teste de layout em content.test.ts, que usa
 * medidas estimadas, conferindo as medidas reais da tela.
 */
import { expect, test } from '@playwright/test'

const TRACKS = ['foundations.aws-foundations', 'storage.s3-expedition', 'identity.iam-access', 'compute.aws-compute']
// Larguras em que o grafo aparece: coluna única estreita e larga, e duas colunas.
const WIDTHS = [680, 1000, 1100, 1440]

interface Box {
  x0: number
  y0: number
  x1: number
  y1: number
}

for (const track of TRACKS) {
  for (const width of WIDTHS) {
    test(`mapa sem sobreposições — ${track} em ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 1000 })
      await page.goto(`/#/trilha/${track}`)
      await expect(page.locator('[data-phase]').first()).toBeVisible()

      const measured = await page.evaluate(() => {
        const box = (el: Element) => {
          const r = el.getBoundingClientRect()
          return { x0: r.left, y0: r.top, x1: r.right, y1: r.bottom }
        }
        const map = document.querySelector('[data-phase]')!.parentElement!
        const nodes = [...document.querySelectorAll<HTMLElement>('[data-phase]')].map((n) => ({
          id: n.dataset.phase!,
          hex: box(n.querySelector('[data-part="hex"]')!),
          badge: box(n.querySelector('[data-part="badge"]')!),
          label: box(n.querySelector('[data-part="label"]')!),
          lineH: parseFloat(getComputedStyle(n.querySelector('[data-part="label"]')!).lineHeight),
          estLines: Number(n.querySelector<HTMLElement>('[data-part="label"]')!.dataset.lines),
        }))
        const edges = [...document.querySelectorAll<SVGPathElement>('path[data-from]')].map((path) => {
          const ctm = path.getScreenCTM()!
          const len = path.getTotalLength()
          const points = Array.from({ length: 121 }, (_, k) => {
            const p = path.getPointAtLength((len * k) / 120)
            return { x: ctm.a * p.x + ctm.c * p.y + ctm.e, y: ctm.b * p.x + ctm.d * p.y + ctm.f }
          })
          return { from: path.dataset.from!, to: path.dataset.to!, points }
        })
        return { map: box(map), nodes, edges }
      })

      const overlaps = (a: Box, b: Box, m: number) => a.x0 - m < b.x1 && b.x0 - m < a.x1 && a.y0 - m < b.y1 && b.y0 - m < a.y1
      const inside = (p: { x: number; y: number }, r: Box) => p.x > r.x0 && p.x < r.x1 && p.y > r.y0 && p.y < r.y1
      const problems: string[] = []
      const { map, nodes, edges } = measured
      expect(nodes.length).toBeGreaterThan(1)

      for (const n of nodes) {
        for (const r of [n.hex, n.badge, n.label]) if (r.x0 < map.x0 - 1 || r.x1 > map.x1 + 1 || r.y0 < map.y0 - 1 || r.y1 > map.y1 + 1) problems.push(`${n.id}: sai do mapa`)
        // A estimativa de linhas do teste de layout precisa ser igual ou maior que o real.
        if (Math.round(n.label.y1 - n.label.y0) > Math.ceil(n.estLines * n.lineH) + 1) problems.push(`${n.id}: rótulo com mais linhas que o estimado (${n.estLines})`)
      }
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const a = [nodes[i].hex, nodes[i].badge, nodes[i].label]
          const b = [nodes[j].hex, nodes[j].badge, nodes[j].label]
          if (a.some((ra) => b.some((rb) => overlaps(ra, rb, 2)))) problems.push(`${nodes[i].id} e ${nodes[j].id}: nós sobrepostos`)
        }
      }
      for (const e of edges) {
        for (const n of nodes) {
          const blocked = n.id === e.from || n.id === e.to ? [n.badge, n.label] : [n.hex, n.badge, n.label]
          if (e.points.some((p) => blocked.some((r) => inside(p, r)))) problems.push(`${e.from} para ${e.to}: a linha passa por cima de ${n.id}`)
        }
      }
      expect(problems).toEqual([])
    })
  }
}
