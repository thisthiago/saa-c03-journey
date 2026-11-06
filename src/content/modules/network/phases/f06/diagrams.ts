/** Desenhos da fase 6 (conectividade híbrida). */
import type { DiagramSpec } from '../../../../../engine/diagram'

/** Cartão `hyb.site-to-site-vpn`: o roteador da fábrica, os dois túneis e o lado da AWS. */
export const VPN_TUNNELS: DiagramSpec = {
  width: 720,
  height: 230,
  label:
    'A fábrica tem um roteador, o customer gateway. Dele saem dois túneis IPsec pela internet, que chegam ao lado da AWS: um virtual private gateway, ligado a uma VPC, ou um Transit Gateway.',
  caption:
    'Cada conexão Site-to-Site VPN tem dois túneis IPsec, que terminam em equipamentos diferentes da AWS. Cada túnel padrão leva até 1,25 Gbps. Para somar a banda de várias conexões, elas terminam num Transit Gateway com ECMP e BGP.',
  boxes: [
    { id: 'fab', kind: 'onprem', label: 'Fábrica', x: 10, y: 40, w: 180, h: 150 },
    { id: 'internet', kind: 'internet', label: 'Internet', x: 260, y: 60, w: 180, h: 110 },
    { id: 'aws', kind: 'region', label: 'AWS', x: 500, y: 20, w: 210, h: 190 },
  ],
  nodes: [
    { id: 'cgw', x: 110, y: 112, glyph: 'router', label: 'Customer gateway', sub: 'roteador da fábrica', tone: 'warning' },
    { id: 'vgw', x: 605, y: 100, glyph: 'router', label: 'Virtual private gateway', sub: 'ou Transit Gateway', tone: 'accent' },
  ],
  links: [
    { from: 'cgw', to: 'vgw', via: [[350, 90]], arrow: 'both', tone: 'success', label: 'túnel 1' },
    { from: 'cgw', to: 'vgw', via: [[350, 140]], arrow: 'both', tone: 'success', label: 'túnel 2' },
  ],
}

/** Cartão `hyb.vif`: as três interfaces virtuais dentro da conexão física. */
export const VIF_TYPES: DiagramSpec = {
  width: 720,
  height: 300,
  label:
    'A fábrica chega por fibra a um local do Direct Connect. Dentro dessa conexão física passam três interfaces virtuais: a privada, que chega a VPCs por um Direct Connect gateway; a pública, que chega aos serviços públicos da AWS, como o S3; e a de trânsito, que chega a Transit Gateways por um Direct Connect gateway.',
  caption:
    'Uma interface virtual é uma ligação lógica dentro da conexão física. A privada chega a VPCs, direto ou por um Direct Connect gateway; a pública, aos serviços públicos da AWS; a de trânsito, a Transit Gateways, sempre por um Direct Connect gateway.',
  boxes: [
    { id: 'fab', kind: 'onprem', label: 'Fábrica', x: 10, y: 100, w: 110, h: 80 },
    { id: 'loc', kind: 'generic', label: 'Local do Direct Connect', x: 170, y: 40, w: 170, h: 200 },
  ],
  nodes: [
    { id: 'gw1', x: 520, y: 40, glyph: 'waypoints', label: 'Direct Connect gateway', tone: 'accent' },
    { id: 'vpcs', x: 660, y: 40, glyph: 'network', label: 'VPCs', tone: 'accent' },
    { id: 's3', x: 660, y: 140, glyph: 'bucket', label: 'Amazon S3', sub: 'e outros públicos', tone: 'info' },
    { id: 'gw2', x: 520, y: 240, glyph: 'waypoints', label: 'Direct Connect gateway', tone: 'mastery' },
    { id: 'tgw', x: 660, y: 240, glyph: 'router', label: 'Transit Gateways', tone: 'mastery' },
  ],
  links: [
    { from: 'fab', to: 'loc', arrow: 'none', tone: 'warning', label: 'fibra' },
    { from: 'loc', to: 'gw1', via: [[380, 40]], tone: 'accent', label: 'interface privada' },
    { from: 'gw1', to: 'vpcs', tone: 'accent' },
    { from: 'loc', to: 's3', tone: 'info', label: 'interface pública' },
    { from: 'loc', to: 'gw2', via: [[380, 240]], tone: 'mastery', label: 'interface de trânsito' },
    { from: 'gw2', to: 'tgw', tone: 'mastery' },
  ],
}

/** Cartão `hyb.dx-resiliency`: os três modelos de resiliência. */
export const RESILIENCE_MODELS: DiagramSpec = {
  width: 720,
  height: 280,
  label:
    'Três modelos de resiliência do Direct Connect. Desenvolvimento e teste: duas conexões no mesmo local, que resistem à falha de um equipamento. Alta resiliência: uma conexão em cada um de dois locais, que resistem à queda de um local. Resiliência máxima: duas conexões em cada um de dois locais, que resistem à queda de um local e de um equipamento.',
  caption: 'Duas conexões no mesmo local não resistem à queda do prédio. Para isso, as conexões precisam estar em locais diferentes do Direct Connect.',
  boxes: [
    { id: 'l1', kind: 'generic', label: 'Local 1', x: 40, y: 44, w: 160, h: 172 },
    { id: 'l2a', kind: 'generic', label: 'Local 1', x: 255, y: 44, w: 100, h: 172 },
    { id: 'l2b', kind: 'generic', label: 'Local 2', x: 370, y: 44, w: 100, h: 172 },
    { id: 'l3a', kind: 'generic', label: 'Local 1', x: 495, y: 44, w: 100, h: 172 },
    { id: 'l3b', kind: 'generic', label: 'Local 2', x: 610, y: 44, w: 100, h: 172 },
  ],
  nodes: [
    { id: 'a1', x: 120, y: 90, glyph: 'plug', label: 'conexão 1', tone: 'warning' },
    { id: 'a2', x: 120, y: 164, glyph: 'plug', label: 'conexão 2', tone: 'warning' },
    { id: 'b1', x: 305, y: 124, glyph: 'plug', label: 'conexão 1', tone: 'info' },
    { id: 'b2', x: 420, y: 124, glyph: 'plug', label: 'conexão 2', tone: 'info' },
    { id: 'c1', x: 545, y: 90, glyph: 'plug', label: 'conexão 1', tone: 'success' },
    { id: 'c2', x: 545, y: 164, glyph: 'plug', label: 'conexão 2', tone: 'success' },
    { id: 'c3', x: 660, y: 90, glyph: 'plug', label: 'conexão 3', tone: 'success' },
    { id: 'c4', x: 660, y: 164, glyph: 'plug', label: 'conexão 4', tone: 'success' },
  ],
  notes: [
    { x: 120, y: 28, text: 'Desenvolvimento e teste', anchor: 'middle', tone: 'warning' },
    { x: 362, y: 28, text: 'Alta resiliência', anchor: 'middle', tone: 'info' },
    { x: 602, y: 28, text: 'Resiliência máxima', anchor: 'middle', tone: 'success' },
    { x: 120, y: 240, text: 'resiste à falha de um\nequipamento', anchor: 'middle' },
    { x: 362, y: 240, text: 'resiste à queda\nde um local', anchor: 'middle' },
    { x: 602, y: 240, text: 'resiste à queda de um local\ne de um equipamento', anchor: 'middle' },
  ],
}

/** Montagem da missão 2: a fábrica, o local do Direct Connect, as duas Regiões e a internet. */
export const FACTORY_BOARD: DiagramSpec = {
  width: 720,
  height: 410,
  label:
    'À esquerda, a fábrica, ligada por fibra a um local do Direct Connect em São Paulo. No meio, uma área global da AWS. À direita, a Região de São Paulo, com uma VPC e o Amazon S3, e a Região da Virgínia, com outra VPC. Embaixo, a internet. Há cinco lugares para peças: a conexão do Direct Connect, a área global, cada VPC e o caminho pela internet.',
  boxes: [
    { id: 'fab', kind: 'onprem', label: 'Fábrica', x: 10, y: 140, w: 110, h: 120 },
    { id: 'loc', kind: 'generic', label: 'Local do Direct Connect', x: 150, y: 110, w: 170, h: 184 },
    { id: 'global', kind: 'generic', label: 'AWS (global)', x: 340, y: 140, w: 140, h: 130 },
    { id: 'sp', kind: 'region', label: 'Região de São Paulo', x: 500, y: 10, w: 210, h: 205 },
    { id: 'vpc-sp', kind: 'vpc', label: 'VPC de São Paulo', x: 515, y: 38, w: 180, h: 96 },
    { id: 'va', kind: 'region', label: 'Região da Virgínia', x: 500, y: 226, w: 210, h: 118 },
    { id: 'vpc-va', kind: 'vpc', label: 'VPC da Virgínia', x: 515, y: 254, w: 180, h: 80 },
    { id: 'internet', kind: 'internet', label: 'Internet', x: 150, y: 330, w: 330, h: 72 },
  ],
  nodes: [{ id: 's3', x: 605, y: 162, glyph: 'bucket', label: 'Amazon S3', tone: 'info' }],
  links: [
    { from: 'fab', to: 'loc', arrow: 'none', tone: 'warning', label: 'fibra' },
    { from: 'loc', to: 'global', arrow: 'none', tone: 'neutral' },
    { from: 'global', to: 'vpc-sp', arrow: 'none', tone: 'neutral' },
    { from: 'global', to: 'vpc-va', arrow: 'none', tone: 'neutral' },
  ],
}
