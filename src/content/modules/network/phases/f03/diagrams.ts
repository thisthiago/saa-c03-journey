/** Desenhos da fase 3 (segurança dentro da VPC). */
import type { DiagramSpec } from '../../../../../engine/diagram'

/** Cartão `sg.reference`: as três instâncias da escola, cada uma com o seu grupo e as regras de entrada. */
export const SG_CARDS: DiagramSpec = {
  width: 720,
  height: 250,
  label:
    'VPC da escola. Na sub-rede pública, o servidor web, no grupo sg-web, e o servidor de relatórios, no grupo sg-rel. Na sub-rede privada, o banco, no grupo sg-db. Regras de entrada: sg-web permite 443 de 0.0.0.0/0; sg-rel não tem regras de entrada; sg-db permite 5432 do grupo sg-web.',
  caption: 'Cada instância tem o seu security group. A origem de uma regra pode ser um bloco de endereços (como 0.0.0.0/0) ou outro grupo (como sg-web).',
  boxes: [
    { id: 'vpc', kind: 'vpc', label: 'VPC 10.50.0.0/16', x: 10, y: 8, w: 700, h: 234 },
    { id: 'pub', kind: 'public', label: 'Sub-rede pública 10.50.1.0/24', x: 30, y: 36, w: 410, h: 190 },
    { id: 'priv', kind: 'private', label: 'Sub-rede privada 10.50.2.0/24', x: 460, y: 36, w: 230, h: 190 },
  ],
  nodes: [
    { id: 'web', x: 140, y: 100, glyph: 'server', label: 'Servidor web', sub: 'grupo sg-web', tone: 'accent' },
    { id: 'rel', x: 330, y: 100, glyph: 'chart', label: 'Relatórios', sub: 'grupo sg-rel', tone: 'warning' },
    { id: 'db', x: 575, y: 100, glyph: 'database', label: 'Banco', sub: 'grupo sg-db', tone: 'mastery' },
  ],
  notes: [
    { x: 140, y: 182, text: 'sg-web, entrada:\n443 de 0.0.0.0/0', anchor: 'middle', tone: 'accent' },
    { x: 330, y: 182, text: 'sg-rel, entrada:\nnenhuma regra', anchor: 'middle', tone: 'warning' },
    { x: 575, y: 182, text: 'sg-db, entrada:\n5432 do grupo sg-web', anchor: 'middle', tone: 'mastery' },
  ],
}

/** Cartão `sg.stateful-stateless`: na volta, o security group lembra da ida e a ACL não. */
export const STATEFUL_RETURN: DiagramSpec = {
  width: 720,
  height: 250,
  label:
    'Um aluno abre o site. Na ida, para a porta 443, o pacote passa pela network ACL da sub-rede e pelo security group do servidor. Na volta, a resposta vai para a porta efêmera 50000 do aluno: o security group, que tem estado, deixa passar; a ACL, sem estado, só deixa passar se tiver uma regra de saída para essa porta.',
  caption:
    'Na ida, as duas camadas conferem a porta 443. Na volta, o security group lembra da conexão e deixa a resposta sair; a ACL não lembra e precisa de uma regra de saída para a porta efêmera do cliente.',
  nodes: [
    { id: 'aluno', x: 70, y: 70, glyph: 'user', label: 'Aluno', sub: 'porta efêmera 50000', tone: 'info' },
    { id: 'acl', x: 280, y: 70, glyph: 'firewall', label: 'Network ACL', sub: 'sem estado', tone: 'warning' },
    { id: 'sg', x: 470, y: 70, glyph: 'shield', label: 'Security group', sub: 'com estado', tone: 'success' },
    { id: 'web', x: 650, y: 70, glyph: 'server', label: 'Servidor web', sub: 'porta 443' },
  ],
  links: [
    { from: 'aluno', to: 'acl', tone: 'info', label: 'ida: 443' },
    { from: 'acl', to: 'sg', tone: 'info' },
    { from: 'sg', to: 'web', tone: 'info' },
    { from: 'web', to: 'aluno', via: [[650, 168], [70, 168]], tone: 'success', style: 'dashed', label: 'volta: resposta para a porta 50000' },
  ],
  notes: [
    { x: 470, y: 200, text: 'deixa passar:', anchor: 'middle', tone: 'success' },
    { x: 470, y: 216, text: 'lembra da ida', anchor: 'middle', tone: 'success' },
    { x: 280, y: 200, text: 'só passa com regra de saída', anchor: 'middle', tone: 'warning' },
    { x: 280, y: 216, text: 'para 1024-65535', anchor: 'middle', tone: 'warning' },
  ],
}

/** Montagem da missão 2: a escola, com os lugares de cada camada. */
export const LAYERS_BOARD: DiagramSpec = {
  width: 720,
  height: 380,
  label:
    'A internet fica em cima. Embaixo, a VPC da escola. Na sub-rede pública, o servidor web e o servidor de relatórios; na privada, o banco. Há três lugares para regras: a network ACL da sub-rede pública, o security group sg-web e o security group sg-db.',
  boxes: [
    { id: 'internet', kind: 'internet', label: 'Internet (alunos e a faixa 198.51.100.0/24)', x: 180, y: 4, w: 360, h: 34 },
    { id: 'vpc', kind: 'vpc', label: 'VPC 10.50.0.0/16', x: 20, y: 60, w: 680, h: 310 },
    { id: 'pub', kind: 'public', label: 'Sub-rede pública 10.50.1.0/24', x: 40, y: 90, w: 410, h: 260 },
    { id: 'priv', kind: 'private', label: 'Sub-rede privada 10.50.2.0/24', x: 470, y: 90, w: 210, h: 260 },
  ],
  nodes: [
    { id: 'web', x: 150, y: 270, glyph: 'server', label: 'Servidor web', sub: 'grupo sg-web', tone: 'accent' },
    { id: 'rel', x: 350, y: 270, glyph: 'chart', label: 'Relatórios', sub: 'grupo sg-rel', tone: 'warning' },
    { id: 'db', x: 575, y: 270, glyph: 'database', label: 'Banco', sub: 'grupo sg-db', tone: 'mastery' },
  ],
}
