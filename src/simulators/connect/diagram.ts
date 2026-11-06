/**
 * Desenho vivo do laboratório "Conectar as VPCs": as redes do cenário em
 * círculo e as ligações da topologia escolhida (peerings, VPN ou os anexos do
 * Transit Gateway, com a cor da tabela de cada anexo). Por cima, em vermelho,
 * os requisitos que a topologia não cumpre.
 */
import type { DiagramLink, DiagramNode, DiagramNote, DiagramSpec, DiagramTone } from '../../engine/diagram'
import type { ConnectOption, ConnectScenario } from './lab'
import { reaches } from './model'

const CX = 360
const TABLE_TONES: DiagramTone[] = ['accent', 'info', 'mastery', 'warning']

/** Quebra "VPC de serviços compartilhados" em duas linhas. */
function shortName(name: string): string {
  return name.length > 16 && name.startsWith('VPC de ') ? `VPC de\n${name.slice(7)}` : name
}

export function topologyDiagram(s: ConnectScenario, option?: ConnectOption): DiagramSpec {
  const nets = [...s.nets].sort((a, b) => Number(Boolean(b.onPrem)) - Number(Boolean(a.onPrem)))
  // Duas redes ficam lado a lado; mais que isso, num círculo achatado que cresce com o número de redes.
  const two = nets.length === 2
  const r = nets.length > 6 ? 165 : nets.length > 3 ? 125 : 95
  const CY = two ? 60 : 44 + r
  const height = two ? 150 : CY + r + 72
  const start = two ? Math.PI : -Math.PI / 2
  const nodes: DiagramNode[] = nets.map((n, i) => {
    const angle = start + (i * 2 * Math.PI) / nets.length
    return { id: n.id, x: Math.round(CX + r * (two ? 2 : 1.55) * Math.cos(angle)), y: Math.round(CY + r * Math.sin(angle)), glyph: n.onPrem ? 'org' : 'network', label: shortName(n.name), sub: n.cidr, tone: n.onPrem ? 'warning' : 'neutral' }
  })
  const links: DiagramLink[] = []
  const notes: DiagramNote[] = []
  const described: string[] = []

  const t = option?.topology
  if (t?.kind === 'peering') {
    for (const [a, b] of t.pairs) links.push({ from: a, to: b, arrow: 'none', tone: 'accent' })
    const onPrem = nets.find((n) => n.onPrem)
    if (onPrem && t.vpnTo) links.push({ from: onPrem.id, to: t.vpnTo, arrow: 'none', style: 'dashed', tone: 'warning', label: 'VPN' })
    described.push(`${t.pairs.length} ${t.pairs.length === 1 ? 'peering' : 'peerings'}${t.vpnTo ? `, VPN ligada à ${s.nets.find((n) => n.id === t.vpnTo)?.name}` : ''}`)
  } else if (t?.kind === 'tgw') {
    nodes.push({ id: 'tgw', x: CX, y: CY, glyph: 'router', label: 'Transit Gateway', tone: 'accent' })
    t.tables.forEach((tb, ti) => {
      const tone = TABLE_TONES[ti % TABLE_TONES.length]
      for (const id of tb.associate) {
        const onPrem = s.nets.find((n) => n.id === id)?.onPrem
        links.push({ from: id, to: 'tgw', arrow: 'none', tone, style: onPrem ? 'dashed' : 'solid', label: onPrem ? 'VPN' : undefined })
      }
      if (t.tables.length > 1) notes.push({ x: 10, y: 24 + ti * 16, text: `tabela ${tb.name}`, tone })
    })
    described.push(`Transit Gateway com ${t.tables.length} ${t.tables.length === 1 ? 'tabela' : 'tabelas'}`)
  }

  // Requisitos não cumpridos, sem repetir o mesmo par nos dois sentidos.
  const seen = new Set<string>()
  if (t) {
    for (const [a, b] of s.mustReach) {
      const key = [a, b].sort().join('|')
      if (seen.has(key) || reaches(s.nets, t, a, b).ok) continue
      seen.add(key)
      links.push({ from: a, to: b, arrow: 'none', style: 'dashed', tone: 'danger', crossed: true })
      described.push(`${s.nets.find((n) => n.id === a)?.name} não alcança ${s.nets.find((n) => n.id === b)?.name}`)
    }
    for (const [a, b] of s.mustNotReach) {
      const key = [a, b].sort().join('|')
      if (seen.has(key) || !reaches(s.nets, t, a, b).ok) continue
      seen.add(key)
      links.push({ from: a, to: b, arrow: 'both', tone: 'danger', label: 'não podia' })
      described.push(`${s.nets.find((n) => n.id === a)?.name} alcança ${s.nets.find((n) => n.id === b)?.name}, e não podia`)
    }
  }

  return {
    width: 720,
    height,
    label: `${s.name}. ${option ? `Topologia: ${option.label}. ${described.join('; ')}.` : 'Nenhuma topologia escolhida.'}`,
    caption: option
      ? `Linha vermelha riscada: precisa alcançar e não alcança. Linha vermelha com setas: alcança e não podia.${t?.kind === 'tgw' && t.tables.length > 1 ? ' A cor de cada anexo é a da tabela à qual ele está associado.' : ''}`
      : 'Escolha uma topologia para ver as ligações.',
    nodes,
    links,
    notes,
  }
}
