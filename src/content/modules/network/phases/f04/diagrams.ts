/** Desenhos da fase 4 (conectando VPCs). */
import type { DiagramSpec } from '../../../../../engine/diagram'

/** Cartão `tgw.non-transitive`: A tem peering com B e com C, e mesmo assim B não alcança C. */
export const NON_TRANSITIVE: DiagramSpec = {
  width: 720,
  height: 250,
  label: 'Três VPCs. A VPC A tem um peering com a VPC B e outro com a VPC C. Entre B e C não há peering, e o tráfego de B para C não passa por A.',
  caption: 'O peering liga só o par. Para B falar com C, é preciso um peering entre B e C: o tráfego nunca atravessa a VPC A.',
  nodes: [
    { id: 'a', x: 360, y: 50, glyph: 'network', label: 'VPC A', sub: '10.1.0.0/16', tone: 'accent' },
    { id: 'b', x: 140, y: 180, glyph: 'network', label: 'VPC B', sub: '10.2.0.0/16' },
    { id: 'c', x: 580, y: 180, glyph: 'network', label: 'VPC C', sub: '10.3.0.0/16' },
  ],
  links: [
    { from: 'a', to: 'b', arrow: 'none', tone: 'success', label: 'peering' },
    { from: 'a', to: 'c', arrow: 'none', tone: 'success', label: 'peering' },
    { from: 'b', to: 'c', arrow: 'none', style: 'dashed', tone: 'danger', crossed: true, label: 'sem peering próprio' },
  ],
}

/** Cartão `tgw.route-tables`: associação (onde o anexo procura o destino) e propagação (que rotas entram na tabela). */
export const ASSOCIATE_PROPAGATE: DiagramSpec = {
  width: 720,
  height: 262,
  label:
    'Duas VPCs anexadas a um Transit Gateway com duas tabelas. O anexo da VPC A está associado à tabela 1, e o da VPC B, à tabela 2. A VPC B propaga a rota 10.2.0.0/16 para a tabela 1, e a VPC A propaga 10.1.0.0/16 para a tabela 2.',
  caption:
    'A associação diz em que tabela o Transit Gateway procura o destino do tráfego que sai de um anexo. A propagação coloca as rotas de um anexo numa tabela. A alcança B porque B propaga para a tabela de A, e a resposta volta porque A propaga para a tabela de B.',
  boxes: [
    { id: 'tgw', kind: 'generic', label: 'Transit Gateway', x: 250, y: 10, w: 460, h: 242 },
    { id: 't1', kind: 'generic', label: 'Tabela 1 (associada ao anexo de A)', x: 300, y: 42, w: 390, h: 84 },
    { id: 't2', kind: 'generic', label: 'Tabela 2 (associada ao anexo de B)', x: 300, y: 152, w: 390, h: 84 },
  ],
  nodes: [
    { id: 'a', x: 80, y: 84, glyph: 'network', label: 'VPC A', sub: '10.1.0.0/16', tone: 'accent' },
    { id: 'b', x: 80, y: 194, glyph: 'network', label: 'VPC B', sub: '10.2.0.0/16', tone: 'accent' },
  ],
  links: [
    { from: 'a', to: 't1', tone: 'accent', label: 'associação' },
    { from: 'b', to: 't2', tone: 'accent', label: 'associação' },
    { from: 'b', to: 't1', style: 'dashed', tone: 'mastery', label: 'propagação' },
    { from: 'a', to: 't2', style: 'dashed', tone: 'mastery' },
  ],
  notes: [
    { x: 316, y: 96, text: 'rota 10.2.0.0/16: anexo de B (propagada por B)', tone: 'mastery' },
    { x: 316, y: 206, text: 'rota 10.1.0.0/16: anexo de A (propagada por A)', tone: 'mastery' },
  ],
}

/** Montagem da missão 2: as três tabelas do Transit Gateway, cada uma associada a uma VPC. */
export const TGW_TABLES_BOARD: DiagramSpec = {
  width: 720,
  height: 410,
  label:
    'Um Transit Gateway com três tabelas de rotas: produção, desenvolvimento e compartilhada. Embaixo, as três VPCs, cada uma associada à tabela com o seu nome. Dentro de cada tabela há um lugar para as rotas que ela recebe por propagação.',
  boxes: [
    { id: 'tgw', kind: 'generic', label: 'Transit Gateway', x: 10, y: 8, w: 700, h: 296 },
    { id: 'tp', kind: 'generic', label: 'Tabela de produção', x: 24, y: 36, w: 216, h: 256 },
    { id: 'td', kind: 'generic', label: 'Tabela de desenvolvimento', x: 252, y: 36, w: 216, h: 256 },
    { id: 'ts', kind: 'generic', label: 'Tabela compartilhada', x: 480, y: 36, w: 216, h: 256 },
  ],
  nodes: [
    { id: 'prod', x: 132, y: 352, glyph: 'network', label: 'VPC de produção', tone: 'accent' },
    { id: 'dev', x: 360, y: 352, glyph: 'network', label: 'VPC de desenvolvimento', tone: 'info' },
    { id: 'shared', x: 588, y: 352, glyph: 'network', label: 'VPC de serviços compartilhados', tone: 'mastery' },
  ],
  links: [
    { from: 'prod', to: 'tp', tone: 'accent', label: 'associação' },
    { from: 'dev', to: 'td', tone: 'info', label: 'associação' },
    { from: 'shared', to: 'ts', tone: 'mastery', label: 'associação' },
  ],
  notes: [
    { x: 34, y: 66, text: 'usada pela VPC\nde produção', tone: 'accent' },
    { x: 262, y: 66, text: 'usada pela VPC\nde desenvolvimento', tone: 'info' },
    { x: 490, y: 66, text: 'usada pela VPC de\nserviços compartilhados', tone: 'mastery' },
  ],
}
