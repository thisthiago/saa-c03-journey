/**
 * Desenho vivo do laboratório "Tabelas de rotas": a VPC por zona, o internet
 * gateway e o egress-only na borda, os NAT Gateways nas sub-redes e uma linha
 * por rota escolhida (contínua para 0.0.0.0/0, tracejada para ::/0).
 *
 * O desenho mostra só o que se vê na rede (para onde cada rota aponta, se a
 * sub-rede ficou pública, se um NAT ficou sem saída). Ele não diz se a escolha
 * atende ao requisito: isso é a nota do laboratório.
 */
import type { DiagramBox, DiagramLink, DiagramNode, DiagramSpec } from '../../engine/diagram'
import { natWorks, targetLabel, type RouteTableLabConfig, type RouteTableLabResponse } from './routing'

const VPC_X = 20
const VPC_W = 680
const VPC_Y = 56
const ZONES_Y = 112
const AREA_X0 = 64
const AREA_X1 = 656
const ROW = 86
const BOX_H = 72
/** Corredores laterais, entre as zonas e a borda da VPC: [contínua, tracejada]. */
const LEFT = [46, 36]
const RIGHT = [674, 684]
/** Altura das linhas horizontais que levam aos gateways: [contínua, tracejada]. */
const BUS_Y = [98, 104]

export function routeDiagram(config: RouteTableLabConfig, value: RouteTableLabResponse): DiagramSpec {
  const zones = [...new Set(config.subnets.map((s) => s.az))]
  const gap = 16
  const zw = (AREA_X1 - AREA_X0 - gap * (zones.length - 1)) / zones.length
  const rows = Math.max(...zones.map((z) => config.subnets.filter((s) => s.az === z).length))
  const zh = 28 + rows * ROW
  const vpcH = ZONES_Y - VPC_Y + zh + 14
  const height = VPC_Y + vpcH + 8

  const gateways: DiagramNode[] = [{ id: 'igw', x: config.ipv6 ? 300 : 360, y: VPC_Y, glyph: 'globe', label: 'Internet gateway', tone: 'accent', labelSide: 'left' }]
  if (config.ipv6) gateways.push({ id: 'eigw', x: 420, y: VPC_Y, glyph: 'route', label: 'Egress-only IGW', tone: 'info', labelSide: 'right' })
  config.nats
    .filter((n) => n.regional)
    .forEach((n, i) => gateways.push({ id: n.id, x: 540 + i * 80, y: VPC_Y, glyph: 'router', label: n.name, tone: 'mastery', labelSide: 'right' }))

  const boxes: DiagramBox[] = [
    { id: 'internet', kind: 'internet', label: 'Internet', x: 250, y: 4, w: 220, h: 28 },
    { id: 'vpc', kind: 'vpc', label: 'VPC', x: VPC_X, y: VPC_Y, w: VPC_W, h: vpcH },
  ]
  const nodes: DiagramNode[] = [...gateways]
  const links: DiagramLink[] = [{ from: 'igw', to: 'internet', arrow: 'both', tone: 'accent' }]
  if (config.ipv6) links.push({ from: 'eigw', to: 'internet', tone: 'info', style: 'dashed' })

  const where = new Map<string, { zi: number; box: DiagramBox }>()
  zones.forEach((z, zi) => {
    const zx = AREA_X0 + zi * (zw + gap)
    boxes.push({ id: `zone-${z}`, kind: 'zone', label: `Zona ${z}`, x: zx, y: ZONES_Y, w: zw, h: zh })
    config.subnets
      .filter((s) => s.az === z)
      .forEach((s, i) => {
        const v4 = value.tables?.[s.id]?.v4 ?? 'none'
        const box: DiagramBox = { id: `sn-${s.id}`, kind: v4 === 'igw' ? 'public' : 'private', label: s.name, x: zx + 10, y: ZONES_Y + 28 + i * ROW, w: zw - 20, h: BOX_H }
        boxes.push(box)
        where.set(s.id, { zi, box })
      })
  })

  for (const n of config.nats.filter((x) => !x.regional)) {
    const home = where.get(n.subnet!)
    if (!home) continue
    const ok = natWorks(config, value, n.id)
    nodes.push({ id: n.id, x: home.box.x + home.box.w - 34, y: home.box.y + 32, glyph: 'router', label: n.name.replace('NAT Gateway', 'NAT'), state: ok ? 'ok' : 'fail', tone: 'mastery' })
  }

  /** Linha da sub-rede até um gateway da borda, pelo corredor lateral da zona. */
  const viaBorder = (s: string, target: string, dashed: boolean): DiagramLink => {
    const { zi, box } = where.get(s)!
    const lane = dashed ? 1 : 0
    const cx = (zi === 0 ? LEFT : RIGHT)[lane]
    const sy = box.y + box.h / 2 + (dashed ? 12 : -4)
    const gx = gateways.find((g) => g.id === target)!.x + (dashed ? 6 : -6)
    return { from: `sn-${s}`, to: target, via: [[cx, sy], [cx, BUS_Y[lane]], [gx, BUS_Y[lane]]], style: dashed ? 'dashed' : 'solid', tone: dashed ? 'info' : 'accent' }
  }

  const described: string[] = []
  for (const s of config.subnets) {
    const t = value.tables?.[s.id] ?? { v4: 'none', v6: 'none' }
    const nat = config.nats.find((n) => n.id === t.v4)
    if (t.v4 === 'igw' || nat?.regional) links.push(viaBorder(s.id, t.v4, false))
    else if (nat) {
      const works = natWorks(config, value, nat.id)
      const cross = nat.az !== s.az
      links.push({ from: `sn-${s.id}`, to: nat.id, tone: !works ? 'danger' : cross ? 'warning' : 'mastery', crossed: !works, label: cross ? 'outra zona' : undefined })
    }
    if (config.ipv6 && s.v6 && (t.v6 === 'igw' || t.v6 === 'eigw')) links.push(viaBorder(s.id, t.v6, true))
    described.push(`${s.name}: 0.0.0.0/0 para ${targetLabel(config, t.v4)}${config.ipv6 && s.v6 ? `, ::/0 para ${targetLabel(config, t.v6)}` : ''}`)
  }
  const broken = config.nats.filter((n) => !n.regional && !natWorks(config, value, n.id)).map((n) => n.name)

  return {
    width: 720,
    height,
    label: `Rotas escolhidas até agora. ${described.join('. ')}.${broken.length ? ` Sem saída para a internet: ${broken.join(' e ')}.` : ''}`,
    caption: 'Linha contínua: rota 0.0.0.0/0. Linha tracejada: rota ::/0. A sub-rede fica verde quando tem rota para o internet gateway, e o NAT fica vermelho quando a sub-rede dele não tem essa rota.',
    boxes,
    nodes,
    links,
  }
}
