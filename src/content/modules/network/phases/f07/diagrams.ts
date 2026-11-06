/** Desenhos da fase 7 (DNS com Route 53). */
import type { DiagramSpec } from '../../../../../engine/diagram'

const ROWS: [string, string][] = [
  ['Um recurso só', 'Simples'],
  ['Dividir os usuários em porcentagens', 'Ponderada'],
  ['A Região mais rápida para cada usuário', 'Latência'],
  ['Uma reserva quando o principal cai', 'Failover'],
  ['Onde o usuário está (país, continente)', 'Geolocalização'],
  ['Onde o recurso está, com viés para ampliar a área', 'Geoproximidade'],
  ['A faixa de IP de quem pergunta', 'Baseada em IP'],
  ['Vários servidores, só os saudáveis', 'Múltiplas respostas'],
]

/** Cartão `dns.routing-policies`: a pergunta que cada política responde. */
export const WHAT_DECIDES: DiagramSpec = {
  width: 720,
  height: 40 + ROWS.length * 36,
  label: `O que decide a resposta em cada política de roteamento do Route 53: ${ROWS.map(([q, p]) => `${q}, ${p}`).join('; ')}.`,
  caption: 'Antes de escolher a política, pergunte o que deve decidir a resposta: proporção, velocidade, reserva, local do usuário, local do recurso, faixa de IP ou saúde.',
  boxes: ROWS.flatMap(([q, p], i) => [
    { id: `q${i}`, kind: 'generic' as const, label: q, x: 10, y: 34 + i * 36, w: 400, h: 28 },
    { id: `p${i}`, kind: 'vpc' as const, label: p, x: 500, y: 34 + i * 36, w: 210, h: 28 },
  ]),
  links: ROWS.map((_, i) => ({ from: `q${i}`, to: `p${i}`, tone: 'accent' as const })),
  notes: [
    { x: 10, y: 22, text: 'O que deve decidir a resposta', tone: 'info' },
    { x: 500, y: 22, text: 'Política', tone: 'info' },
  ],
}

/** Cartão `dns.geolocation`: a área mais específica vence; fora de todas, o registro padrão. */
export const GEO_NESTED: DiagramSpec = {
  width: 720,
  height: 260,
  label:
    'Três registros de geolocalização, um dentro do outro: padrão (o resto do mundo), América do Sul e Brasil. Um leitor no Brasil recebe o registro do Brasil; um na Argentina, o da América do Sul; um na França, o padrão.',
  caption: 'Vence o registro da área mais específica que contém o leitor. Quem não está em nenhuma área cai no registro padrão; sem ele, fica sem resposta.',
  boxes: [
    { id: 'world', kind: 'generic', label: 'Registro padrão (o resto do mundo)', x: 10, y: 10, w: 700, h: 240 },
    { id: 'sa', kind: 'zone', label: 'Registro América do Sul', x: 30, y: 44, w: 440, h: 190 },
    { id: 'br', kind: 'public', label: 'Registro Brasil', x: 50, y: 78, w: 210, h: 140 },
  ],
  nodes: [
    { id: 'lbr', x: 155, y: 140, glyph: 'user', label: 'Leitor no Brasil', sub: 'recebe: Brasil', tone: 'success' },
    { id: 'lar', x: 365, y: 140, glyph: 'user', label: 'Leitor na Argentina', sub: 'recebe: América do Sul', tone: 'info' },
    { id: 'lfr', x: 590, y: 120, glyph: 'user', label: 'Leitor na França', sub: 'recebe: padrão', tone: 'neutral' },
  ],
}

/** Montagem da missão 3: a redação, a VPN e a VPC com o Resolver e a zona privada. */
export const HYBRID_DNS_BOARD: DiagramSpec = {
  width: 720,
  height: 360,
  label:
    'À esquerda, a redação, com o servidor DNS dela, que responde pelos nomes de redacao.local. Uma VPN liga a redação à VPC, à direita. Na VPC estão o Route 53 Resolver, no endereço 10.70.0.2, e a zona hospedada privada interno.agoranoticias.com. Há três lugares para peças: o servidor DNS da redação e dois lugares na VPC, um para receber consultas da redação e outro para mandar consultas a ela.',
  boxes: [
    { id: 'red', kind: 'onprem', label: 'Redação (redacao.local)', x: 10, y: 50, w: 250, h: 290 },
    { id: 'vpc', kind: 'vpc', label: 'VPC 10.70.0.0/16', x: 330, y: 20, w: 380, h: 330 },
  ],
  nodes: [
    { id: 'dns', x: 135, y: 110, glyph: 'server', label: 'Servidor DNS da redação', tone: 'warning' },
    { id: 'resolver', x: 635, y: 90, glyph: 'search', label: 'Route 53 Resolver', sub: '10.70.0.2', tone: 'accent' },
    { id: 'zone', x: 635, y: 250, glyph: 'file', label: 'Zona privada', sub: 'interno.agoranoticias.com', tone: 'accent' },
  ],
  links: [
    { from: 'red', to: 'vpc', arrow: 'both', style: 'dashed', tone: 'warning', label: 'VPN' },
    { from: 'resolver', to: 'zone', arrow: 'both', tone: 'accent' },
  ],
}
