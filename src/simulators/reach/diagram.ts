/**
 * Desenho vivo do laboratório "O pacote chega?": o caminho de um fluxo, ponto
 * de controle por ponto de controle. Em cima, a ida (da origem ao destino);
 * embaixo, a volta da resposta, que só passa pelas network ACLs, porque o
 * security group tem estado. O ponto que bloqueia fica vermelho, e o que vem
 * depois dele fica apagado.
 */
import type { DiagramLink, DiagramNode, DiagramSpec } from '../../engine/diagram'
import type { GlyphName } from '../../engine/types'
import { INTERNET_IP, naclDecision, sgAllows, type Flow, type ReachWorld } from './model'

type Status = 'pass' | 'block' | 'skip'

interface Hop {
  id: string
  label: string
  sub?: string
  glyph: GlyphName
  status: Status
  /** Ponto de controle da volta (desenhado embaixo). */
  back?: boolean
  /** Para os pontos da volta: em cima de qual ponto da ida ficam. */
  under?: string
}

/** Pontos de controle de um fluxo, com o resultado de cada um. */
export function flowHops(w: ReachWorld, f: Flow): Hop[] {
  const inst = (id: string) => w.instances.find((i) => i.id === id)
  const sub = (id: string) => w.subnets.find((s) => s.id === id)!
  const group = (id: string) => w.groups.find((g) => g.id === id)!
  const dst = inst(f.to)!
  const src = f.from === 'internet' ? undefined : inst(f.from)
  const srcIp = src ? src.ip : (f.fromIp ?? INTERNET_IP)
  const dstSub = sub(dst.subnet)
  const srcSub = src ? sub(src.subnet) : undefined
  const same = srcSub?.id === dstSub.id
  const eph = f.clientPort ?? 50000

  const hops: Hop[] = []
  let blocked = false
  const add = (h: Omit<Hop, 'status'>, ok: boolean) => {
    const status: Status = blocked ? 'skip' : ok ? 'pass' : 'block'
    if (status === 'block') blocked = true
    hops.push({ ...h, status })
  }

  add({ id: 'src', label: src ? src.name : 'Internet', sub: srcIp, glyph: src ? 'server' : 'globe' }, true)
  if (!src) add({ id: 'igw', label: 'Internet\ngateway', sub: dstSub.public && dst.publicIp ? 'chega à sub-rede pública' : 'sem caminho', glyph: 'globe' }, Boolean(dstSub.public && dst.publicIp))
  if (src) {
    const out = group(src.sg).outbound
    add({ id: 'sg-out', label: `${group(src.sg).name}\nsaída`, sub: out ? 'regras de saída' : 'saída padrão: tudo', glyph: 'shield' }, !out || sgAllows(out, dst.ip, dst.sg, f.port))
  }
  if (srcSub && !same) {
    const d = naclDecision(srcSub.naclOut, dst.ip, f.port)
    add({ id: 'acl-src-out', label: `ACL ${srcSub.name}\nsaída`, sub: d.short, glyph: 'firewall' }, d.allowed)
  }
  if (!same) {
    const d = naclDecision(dstSub.naclIn, srcIp, f.port)
    add({ id: 'acl-dst-in', label: `ACL ${dstSub.name}\nentrada`, sub: d.short, glyph: 'firewall' }, d.allowed)
  }
  add({ id: 'sg-in', label: `${group(dst.sg).name}\nentrada`, sub: sgAllows(group(dst.sg).inbound, srcIp, src?.sg, f.port) ? 'permite' : 'sem regra', glyph: 'shield' }, sgAllows(group(dst.sg).inbound, srcIp, src?.sg, f.port))
  add({ id: 'dst', label: dst.name, sub: `porta ${f.port}`, glyph: 'server' }, true)
  if (!same) {
    const d = naclDecision(dstSub.naclOut, srcIp, eph)
    add({ id: 'acl-dst-out', label: `ACL ${dstSub.name}\nsaída`, sub: d.short, glyph: 'firewall', back: true, under: 'acl-dst-in' }, d.allowed)
  }
  if (srcSub && !same) {
    const d = naclDecision(srcSub.naclIn, dst.ip, eph)
    add({ id: 'acl-src-in', label: `ACL ${srcSub.name}\nentrada`, sub: d.short, glyph: 'firewall', back: true, under: 'acl-src-out' }, d.allowed)
  }
  return hops
}

const TOP = 74
const BOTTOM = 200

export function flowDiagram(w: ReachWorld, f: Flow & { label?: string }): DiagramSpec {
  const hops = flowHops(w, f)
  const ida = hops.filter((h) => !h.back)
  const volta = hops.filter((h) => h.back)
  const step = ida.length > 1 ? 600 / (ida.length - 1) : 0
  const xOf = new Map(ida.map((h, i) => [h.id, 60 + i * step]))
  const eph = f.clientPort ?? 50000

  const node = (h: Hop, x: number, y: number): DiagramNode => ({
    id: h.id,
    x,
    y,
    glyph: h.glyph,
    label: h.label,
    sub: h.sub,
    state: h.status === 'block' ? 'fail' : h.status === 'skip' ? 'off' : 'ok',
    tone: h.status === 'pass' ? 'success' : 'neutral',
  })
  const nodes = [...ida.map((h) => node(h, xOf.get(h.id)!, TOP)), ...volta.map((h) => node(h, xOf.get(h.under!)!, BOTTOM))]

  const linkTone = (to: Hop): Pick<DiagramLink, 'tone' | 'style'> => (to.status === 'skip' ? { tone: 'neutral', style: 'dashed' } : to.status === 'block' ? { tone: 'danger' } : { tone: 'success' })
  const links: DiagramLink[] = []
  for (let i = 1; i < ida.length; i++) links.push({ from: ida[i - 1].id, to: ida[i].id, ...linkTone(ida[i]) })
  // Volta: do destino, pelas ACLs (direita para a esquerda), até a origem.
  const back = [ida[ida.length - 1], ...volta]
  for (let i = 1; i < back.length; i++) {
    const a = back[i - 1]
    const b = back[i]
    links.push({ from: a.id, to: b.id, ...linkTone(b), via: i === 1 ? [[xOf.get(a.id)!, BOTTOM]] : undefined })
  }
  const last = back[back.length - 1]
  const reached = hops.every((h) => h.status === 'pass')
  if (back.length > 1 || ida.length > 1) {
    links.push({ from: last.id, to: 'src', via: [[60, BOTTOM]], ...(reached ? { tone: 'success' as const } : { tone: 'neutral' as const, style: 'dashed' as const }), label: `resposta para a porta ${eph}` })
  }

  const blocker = hops.find((h) => h.status === 'block')
  return {
    width: 720,
    height: 290,
    label: `Caminho do fluxo${f.label ? ` "${f.label}"` : ''}: ${hops.map((h) => `${h.label.replace('\n', ', ')} (${h.status === 'pass' ? 'passa' : h.status === 'block' ? 'bloqueia' : 'não chega'})`).join(', ')}.`,
    caption: blocker
      ? `Para em: ${blocker.label.replace('\n', ', ')}. Em cima, a ida; embaixo, a volta da resposta, que só passa pelas ACLs, porque o security group tem estado.`
      : 'A conexão funciona nos dois sentidos. Em cima, a ida; embaixo, a volta da resposta, que só passa pelas ACLs, porque o security group tem estado.',
    nodes,
    links,
    notes: [
      { x: 10, y: 18, text: `Ida: porta ${f.port}`, tone: 'info' },
      { x: 10, y: 284, text: `Volta: resposta para a porta efêmera ${eph}`, tone: 'info' },
    ],
  }
}
