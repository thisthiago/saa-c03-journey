/** Desenhos da fase 2 (roteamento e saída para a internet). */
import type { DiagramSpec } from '../../../../../engine/diagram'

/** Cartão `rt.public-private`: o que torna uma sub-rede pública e como a privada sai pelo NAT. */
export const PUBLIC_PRIVATE: DiagramSpec = {
  width: 720,
  height: 330,
  label:
    'VPC com duas zonas. Em cada zona, uma sub-rede pública com um NAT Gateway e uma sub-rede de aplicação privada. As sub-redes públicas têm a rota 0.0.0.0/0 para o internet gateway, que fica na borda da VPC e se liga à internet. As sub-redes de aplicação têm a rota 0.0.0.0/0 para o NAT da própria zona.',
  caption:
    'A sub-rede pública tem a rota 0.0.0.0/0 para o internet gateway. A de aplicação manda 0.0.0.0/0 para o NAT da própria zona, que mora numa sub-rede pública: ela acessa a internet, mas ninguém de fora inicia conexão com ela.',
  boxes: [
    { id: 'internet', kind: 'internet', label: 'Internet', x: 250, y: 4, w: 220, h: 30 },
    { id: 'vpc', kind: 'vpc', label: 'VPC 10.40.0.0/16', x: 20, y: 64, w: 680, h: 258 },
    { id: 'za', kind: 'zone', label: 'Zona a', x: 40, y: 110, w: 310, h: 200 },
    { id: 'zb', kind: 'zone', label: 'Zona b', x: 370, y: 110, w: 310, h: 200 },
    { id: 'pub-a', kind: 'public', label: 'Sub-rede pública A', x: 56, y: 136, w: 278, h: 72 },
    { id: 'app-a', kind: 'private', label: 'Sub-rede de aplicação A', x: 56, y: 228, w: 278, h: 70 },
    { id: 'pub-b', kind: 'public', label: 'Sub-rede pública B', x: 386, y: 136, w: 278, h: 72 },
    { id: 'app-b', kind: 'private', label: 'Sub-rede de aplicação B', x: 386, y: 228, w: 278, h: 70 },
  ],
  nodes: [
    { id: 'igw', x: 360, y: 64, glyph: 'globe', label: 'Internet gateway', tone: 'accent' },
    { id: 'nat-a', x: 290, y: 168, glyph: 'router', label: 'NAT A', tone: 'mastery' },
    { id: 'nat-b', x: 620, y: 168, glyph: 'router', label: 'NAT B', tone: 'mastery' },
  ],
  links: [
    { from: 'igw', to: 'internet', arrow: 'both', tone: 'accent' },
    { from: 'pub-a', to: 'igw', tone: 'success', label: '0.0.0.0/0' },
    { from: 'pub-b', to: 'igw', tone: 'success', label: '0.0.0.0/0' },
    { from: 'app-a', to: 'nat-a', tone: 'mastery', label: '0.0.0.0/0' },
    { from: 'app-b', to: 'nat-b', tone: 'mastery', label: '0.0.0.0/0' },
  ],
}

/** Cartão `rt.nat-per-az`: um NAT só, com a zona a fora do ar, ao lado de um NAT por zona. */
export const NAT_PER_ZONE: DiagramSpec = {
  width: 720,
  height: 236,
  label:
    'Dois cenários com a zona a fora do ar. À esquerda, um NAT só, na zona a: o servidor de aplicação da zona b está saudável, mas a rota dele aponta para o NAT caído e ele perde a internet. À direita, um NAT por zona: o servidor da zona b sai pelo NAT B e continua funcionando.',
  caption: 'Com um NAT só, a queda da zona dele tira a internet das outras zonas. Com um NAT por zona (ou com o NAT regional), cada zona sai pelo próprio caminho.',
  boxes: [
    { id: 'l-za', kind: 'zone', label: 'Zona a (fora do ar)', x: 20, y: 40, w: 150, h: 150, failed: true },
    { id: 'l-zb', kind: 'zone', label: 'Zona b', x: 190, y: 40, w: 150, h: 150 },
    { id: 'r-za', kind: 'zone', label: 'Zona a (fora do ar)', x: 380, y: 40, w: 150, h: 150, failed: true },
    { id: 'r-zb', kind: 'zone', label: 'Zona b', x: 550, y: 40, w: 150, h: 150 },
  ],
  nodes: [
    { id: 'l-nat', x: 95, y: 110, glyph: 'router', label: 'NAT', state: 'fail' },
    { id: 'l-app', x: 265, y: 110, glyph: 'server', label: 'Aplicação B', tone: 'info' },
    { id: 'r-nata', x: 455, y: 110, glyph: 'router', label: 'NAT A', state: 'fail' },
    { id: 'r-natb', x: 625, y: 78, glyph: 'router', label: 'NAT B', tone: 'mastery', labelSide: 'right' },
    { id: 'r-app', x: 625, y: 150, glyph: 'server', label: 'Aplicação B', tone: 'info' },
  ],
  links: [
    { from: 'l-app', to: 'l-nat', tone: 'danger', crossed: true },
    { from: 'r-app', to: 'r-natb', tone: 'success' },
  ],
  notes: [
    { x: 180, y: 24, text: 'Um NAT só, na zona a', anchor: 'middle' },
    { x: 540, y: 24, text: 'Um NAT por zona', anchor: 'middle' },
    { x: 180, y: 214, text: 'A zona b está saudável, mas perde a internet.', anchor: 'middle', tone: 'danger' },
    { x: 540, y: 214, text: 'A zona b sai pelo próprio NAT e continua.', anchor: 'middle', tone: 'success' },
  ],
}

/** Cartão `rt.eigw`: em IPv6, o egress-only deixa sair e barra o que vem de fora. */
export const EGRESS_ONLY: DiagramSpec = {
  width: 720,
  height: 180,
  label:
    'Um servidor numa sub-rede de aplicação com IPv6 tem a rota ::/0 para o egress-only internet gateway, na borda da VPC. Pelo gateway saem as conexões que o servidor inicia e voltam as respostas. Uma conexão iniciada na internet é barrada.',
  caption: 'O egress-only internet gateway é o "só saída" do IPv6: o servidor inicia conexões e recebe as respostas, mas ninguém na internet consegue iniciar uma conexão com ele.',
  boxes: [
    { id: 'internet', kind: 'internet', label: 'Internet', x: 10, y: 46, w: 120, h: 90 },
    { id: 'vpc', kind: 'vpc', label: 'VPC com bloco IPv6', x: 330, y: 16, w: 370, h: 150 },
    { id: 'app', kind: 'private', label: 'Sub-rede de aplicação', x: 450, y: 46, w: 230, h: 104 },
  ],
  nodes: [
    { id: 'eigw', x: 330, y: 92, glyph: 'route', label: 'Egress-only IGW', tone: 'info' },
    { id: 'srv', x: 565, y: 98, glyph: 'server', label: 'Servidor' },
  ],
  links: [
    { from: 'app', to: 'eigw', style: 'dashed', tone: 'info', label: '::/0' },
    { from: 'eigw', to: 'internet', via: [[220, 72]], tone: 'success', label: 'saída e respostas' },
    { from: 'internet', to: 'eigw', via: [[220, 116]], tone: 'danger', crossed: true, label: 'conexão de fora' },
  ],
}

/** Montagem da missão 3: a VPC com IPv6, duas zonas e as sub-redes. */
export const EXIT_BOARD: DiagramSpec = {
  width: 720,
  height: 400,
  label:
    'A internet fica em cima. Embaixo, a VPC 10.40.0.0/16, com bloco IPv6, em duas zonas. Cada zona tem uma sub-rede pública, com o balanceador, e uma sub-rede de aplicação. Há cinco lugares para peças: a borda da VPC, as duas sub-redes públicas e as duas de aplicação.',
  boxes: [
    { id: 'internet', kind: 'internet', label: 'Internet', x: 360, y: 4, w: 220, h: 34 },
    { id: 'vpc', kind: 'vpc', label: 'VPC 10.40.0.0/16, com IPv6', x: 20, y: 70, w: 680, h: 320 },
    { id: 'za', kind: 'zone', label: 'Zona a', x: 36, y: 120, w: 316, h: 258 },
    { id: 'zb', kind: 'zone', label: 'Zona b', x: 368, y: 120, w: 316, h: 258 },
    { id: 'pub-a', kind: 'public', label: 'Sub-rede pública A (balanceador)', x: 50, y: 144, w: 288, h: 100 },
    { id: 'app-a', kind: 'private', label: 'Sub-rede de aplicação A', x: 50, y: 256, w: 288, h: 112 },
    { id: 'pub-b', kind: 'public', label: 'Sub-rede pública B (balanceador)', x: 382, y: 144, w: 288, h: 100 },
    { id: 'app-b', kind: 'private', label: 'Sub-rede de aplicação B', x: 382, y: 256, w: 288, h: 112 },
  ],
}
