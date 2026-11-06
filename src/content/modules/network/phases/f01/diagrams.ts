/** Desenhos da fase 1 (VPC e endereçamento). */
import type { DiagramSpec } from '../../../../../engine/diagram'

/** Cartão `vpc.what`: a VPC atravessa as zonas; cada sub-rede fica numa zona só. */
export const VPC_IN_REGION: DiagramSpec = {
  width: 720,
  height: 300,
  label:
    'Região sa-east-1 com a VPC 10.40.0.0/16 ocupando a Região inteira. Dentro da VPC há duas zonas, sa-east-1a e sa-east-1b. Cada zona tem três sub-redes: web (pública), aplicação (privada) e banco (privada).',
  caption: 'A VPC atravessa todas as zonas da Região. Cada sub-rede fica inteira dentro de uma zona, por isso cada camada tem uma sub-rede em cada zona.',
  boxes: [
    { id: 'region', kind: 'region', label: 'Região sa-east-1', x: 8, y: 8, w: 704, h: 284 },
    { id: 'vpc', kind: 'vpc', label: 'VPC 10.40.0.0/16 (vale para a Região inteira)', x: 28, y: 36, w: 664, h: 240 },
    { id: 'za', kind: 'zone', label: 'Zona sa-east-1a', x: 48, y: 64, w: 300, h: 196 },
    { id: 'zb', kind: 'zone', label: 'Zona sa-east-1b', x: 372, y: 64, w: 300, h: 196 },
    { id: 'web-a', kind: 'public', label: 'Sub-rede web (pública)', x: 64, y: 92, w: 268, h: 46 },
    { id: 'app-a', kind: 'private', label: 'Sub-rede de aplicação (privada)', x: 64, y: 146, w: 268, h: 46 },
    { id: 'db-a', kind: 'private', label: 'Sub-rede de banco (privada)', x: 64, y: 200, w: 268, h: 46 },
    { id: 'web-b', kind: 'public', label: 'Sub-rede web (pública)', x: 388, y: 92, w: 268, h: 46 },
    { id: 'app-b', kind: 'private', label: 'Sub-rede de aplicação (privada)', x: 388, y: 146, w: 268, h: 46 },
    { id: 'db-b', kind: 'private', label: 'Sub-rede de banco (privada)', x: 388, y: 200, w: 268, h: 46 },
  ],
}

/** Cartão `vpc.reserved-ips`: os cinco endereços reservados de uma /24. */
export const RESERVED_RULER: DiagramSpec = {
  width: 720,
  height: 130,
  label:
    'Régua da sub-rede 10.40.1.0/24, com 256 endereços. Os endereços .0 (rede), .1 (roteador da VPC), .2 (DNS da AWS), .3 (uso futuro) e .255 (broadcast) são reservados. De .4 a .254 ficam 251 endereços para recursos.',
  caption: 'Em toda sub-rede, a AWS reserva os quatro primeiros endereços e o último. Uma /24 oferece 251 endereços para recursos, e uma /28, só 11.',
  boxes: [
    { id: 'r0', kind: 'generic', label: '.0', x: 10, y: 34, w: 62, h: 46, failed: true },
    { id: 'r1', kind: 'generic', label: '.1', x: 76, y: 34, w: 62, h: 46, failed: true },
    { id: 'r2', kind: 'generic', label: '.2', x: 142, y: 34, w: 62, h: 46, failed: true },
    { id: 'r3', kind: 'generic', label: '.3', x: 208, y: 34, w: 62, h: 46, failed: true },
    { id: 'free', kind: 'public', label: '.4 a .254: 251 endereços para recursos', x: 274, y: 34, w: 362, h: 46 },
    { id: 'r255', kind: 'generic', label: '.255', x: 640, y: 34, w: 70, h: 46, failed: true },
  ],
  notes: [
    { x: 10, y: 22, text: '10.40.1.0/24: 256 endereços' },
    { x: 41, y: 100, text: 'rede', anchor: 'middle', tone: 'danger' },
    { x: 107, y: 100, text: 'roteador', anchor: 'middle', tone: 'danger' },
    { x: 173, y: 100, text: 'DNS', anchor: 'middle', tone: 'danger' },
    { x: 239, y: 100, text: 'uso futuro', anchor: 'middle', tone: 'danger' },
    { x: 675, y: 100, text: 'broadcast', anchor: 'middle', tone: 'danger' },
  ],
}

/** Cartão `vpc.subnet` (missão 2): duas /25 dividem uma /24; um bloco dentro de outro se sobrepõe. */
export const SUBNET_HALVES: DiagramSpec = {
  width: 720,
  height: 170,
  label:
    'Régua de 10.0.1.0 a 10.0.1.255. A sub-rede 10.0.1.0/25 ocupa de .0 a .127, e a 10.0.1.128/25 ocupa de .128 a .255, sem se encostar. Embaixo, um bloco 10.0.1.96/27, que vai de .96 a .127, cai dentro da primeira /25 e é recusado.',
  caption: 'Duas /25 dividem uma /24 sem se encostar. Um bloco que cai dentro de outro, mesmo sendo menor, se sobrepõe a ele, e a AWS recusa a segunda sub-rede.',
  boxes: [
    { id: 'h1', kind: 'generic', label: '10.0.1.0/25 (.0 a .127)', x: 40, y: 36, w: 320, h: 44 },
    { id: 'h2', kind: 'generic', label: '10.0.1.128/25 (.128 a .255)', x: 360, y: 36, w: 320, h: 44 },
    { id: 'clash', kind: 'generic', label: '.96/27', x: 280, y: 104, w: 80, h: 44, failed: true },
  ],
  notes: [
    { x: 40, y: 26, text: '.0' },
    { x: 360, y: 26, text: '.128', anchor: 'middle' },
    { x: 680, y: 26, text: '.255', anchor: 'end' },
    { x: 372, y: 124, text: '10.0.1.96/27 cai dentro de 10.0.1.0/25:', tone: 'danger' },
    { x: 372, y: 140, text: 'a AWS recusa essa sub-rede.', tone: 'danger' },
  ],
}

/** Montagem da missão 1: o desenho de fundo, sem as peças. */
export const STORE_VPC_BOARD: DiagramSpec = {
  width: 720,
  height: 400,
  label:
    'A internet fica em cima, do lado de fora. Embaixo, a Região sa-east-1 com a VPC 10.40.0.0/16 e duas zonas, sa-east-1a e sa-east-1b. Há quatro lugares para peças: a borda da VPC, entre ela e a internet; a faixa que vale para toda a VPC; e o interior de cada zona.',
  boxes: [
    { id: 'internet', kind: 'internet', label: 'Internet', x: 230, y: 4, w: 260, h: 40 },
    { id: 'region', kind: 'region', label: 'Região sa-east-1', x: 8, y: 60, w: 704, h: 332 },
    { id: 'vpc', kind: 'vpc', label: 'VPC 10.40.0.0/16', x: 28, y: 88, w: 664, h: 292 },
    { id: 'za', kind: 'zone', label: 'Zona sa-east-1a', x: 48, y: 192, w: 304, h: 176 },
    { id: 'zb', kind: 'zone', label: 'Zona sa-east-1b', x: 368, y: 192, w: 304, h: 176 },
  ],
}
