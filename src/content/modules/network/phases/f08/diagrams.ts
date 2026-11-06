/** Desenhos da fase 8 (entrega de conteúdo). */
import type { DiagramSpec } from '../../../../../engine/diagram'

/** Cartão `edge.cloudfront`: o caminho de um pedido, do POP à origem. */
export const EDGE_PATH: DiagramSpec = {
  width: 720,
  height: 150,
  label:
    'Um ouvinte em Lisboa pede um arquivo ao POP de Lisboa. Se o POP não tem uma cópia válida, pergunta ao cache regional. Se o cache regional também não tem, o pedido vai até o bucket em São Paulo, a origem.',
  caption: 'O POP responde se tem uma cópia válida. Se não tem, pergunta ao cache regional; só se nenhum dos dois tiver a cópia o pedido vai até a origem.',
  nodes: [
    { id: 'ouvinte', x: 60, y: 50, glyph: 'user', label: 'Ouvinte', sub: 'em Lisboa', tone: 'info' },
    { id: 'pop', x: 250, y: 50, glyph: 'tower', label: 'POP de Lisboa', sub: 'guarda o mais pedido', tone: 'accent' },
    { id: 'rec', x: 450, y: 50, glyph: 'cache', label: 'Cache regional', sub: 'maior, guarda mais tempo', tone: 'accent' },
    { id: 'origin', x: 650, y: 50, glyph: 'bucket', label: 'Bucket em São Paulo', sub: 'a origem' },
  ],
  links: [
    { from: 'ouvinte', to: 'pop', tone: 'info' },
    { from: 'pop', to: 'rec', tone: 'accent', label: 'se o POP não tem' },
    { from: 'rec', to: 'origin', tone: 'neutral', label: 'se ninguém tem' },
  ],
}

/** Cartão `cdn.edge-functions`: os quatro eventos e onde cada tipo de função roda. */
export const EDGE_HOOKS: DiagramSpec = {
  width: 720,
  height: 250,
  label:
    'Os quatro momentos de um pedido no CloudFront: o pedido do ouvinte e a resposta ao ouvinte, onde rodam as CloudFront Functions e o Lambda@Edge; o pedido à origem e a resposta da origem, onde só roda o Lambda@Edge e que só acontecem quando o cache não atende.',
  caption:
    'As CloudFront Functions rodam só nos eventos do ouvinte; o Lambda@Edge roda nos quatro. Os eventos da origem só acontecem quando o pedido não é atendido pelo cache.',
  nodes: [
    { id: 'ouvinte', x: 50, y: 125, glyph: 'user', label: 'Ouvinte', tone: 'info' },
    { id: 'cf', x: 360, y: 125, glyph: 'globe', label: 'CloudFront', sub: 'cache', tone: 'accent' },
    { id: 'origin', x: 670, y: 125, glyph: 'bucket', label: 'Origem' },
  ],
  links: [
    { from: 'ouvinte', to: 'cf', via: [[200, 70]], tone: 'success', label: 'pedido do ouvinte' },
    { from: 'cf', to: 'origin', via: [[520, 70]], tone: 'mastery', label: 'pedido à origem' },
    { from: 'origin', to: 'cf', via: [[520, 180]], tone: 'mastery', label: 'resposta da origem' },
    { from: 'cf', to: 'ouvinte', via: [[200, 180]], tone: 'success', label: 'resposta ao ouvinte' },
  ],
  notes: [
    { x: 200, y: 30, text: 'Functions ou Lambda@Edge', anchor: 'middle', tone: 'success' },
    { x: 520, y: 30, text: 'só Lambda@Edge', anchor: 'middle', tone: 'mastery' },
    { x: 200, y: 232, text: 'Functions ou Lambda@Edge', anchor: 'middle', tone: 'success' },
    { x: 520, y: 232, text: 'só Lambda@Edge', anchor: 'middle', tone: 'mastery' },
  ],
}

/** Cartão `cdn.cf-vs-ga`: CloudFront e Global Accelerator lado a lado. */
export const CF_VS_GA: DiagramSpec = {
  width: 720,
  height: 250,
  label:
    'À esquerda, o CloudFront: o usuário fala com um POP, que guarda cópias e responde em HTTP ou HTTPS, e só busca na origem o que não tem. À direita, o Global Accelerator: o usuário fala com dois IPs anycast fixos, sem cache, em TCP ou UDP, e o tráfego segue pela rede da AWS até a Região saudável, com outra Região de reserva.',
  caption: 'O CloudFront guarda conteúdo HTTP perto do usuário. O Global Accelerator não guarda nada: dá dois IPs fixos e leva TCP e UDP pela rede da AWS até a Região saudável.',
  boxes: [
    { id: 'l', kind: 'generic', label: 'CloudFront', x: 10, y: 20, w: 340, h: 210 },
    { id: 'r', kind: 'generic', label: 'Global Accelerator', x: 370, y: 20, w: 340, h: 210 },
  ],
  nodes: [
    { id: 'u1', x: 60, y: 125, glyph: 'user', label: 'Usuário', tone: 'info' },
    { id: 'pop', x: 180, y: 125, glyph: 'tower', label: 'POP com cache', sub: 'HTTP e HTTPS', tone: 'accent' },
    { id: 'o1', x: 300, y: 125, glyph: 'server', label: 'Origem' },
    { id: 'u2', x: 420, y: 125, glyph: 'user', label: 'Usuário', tone: 'info' },
    { id: 'ga', x: 540, y: 125, glyph: 'globe', label: '2 IPs fixos', sub: 'TCP e UDP, sem cache', tone: 'accent' },
    { id: 'r1', x: 660, y: 75, glyph: 'server', label: 'Região 1', tone: 'success' },
    { id: 'r2', x: 660, y: 175, glyph: 'server', label: 'Região 2', sub: 'reserva' },
  ],
  links: [
    { from: 'u1', to: 'pop', tone: 'info' },
    { from: 'pop', to: 'o1', tone: 'neutral', style: 'dashed' },
    { from: 'u2', to: 'ga', tone: 'info' },
    { from: 'ga', to: 'r1', tone: 'success' },
    { from: 'ga', to: 'r2', tone: 'neutral', style: 'dashed' },
  ],
}

/** Montagem da missão 2: a distribuição, o comportamento dos assinantes e o bucket. */
export const DIST_BOARD: DiagramSpec = {
  width: 720,
  height: 330,
  label:
    'À esquerda, o ouvinte. No meio, a distribuição do CloudFront de musica.batuque.com, com um lugar para a configuração da distribuição e outro para o comportamento /assinantes/*. À direita, a Região sa-east-1, com o bucket das músicas.',
  boxes: [
    { id: 'dist', kind: 'generic', label: 'Distribuição do CloudFront (musica.batuque.com)', x: 110, y: 20, w: 380, h: 292 },
    { id: 'sa', kind: 'region', label: 'Região sa-east-1', x: 520, y: 60, w: 190, h: 200 },
  ],
  nodes: [{ id: 'ouvinte', x: 50, y: 166, glyph: 'user', label: 'Ouvinte', tone: 'info' }],
  links: [
    { from: 'ouvinte', to: 'dist', tone: 'info' },
    { from: 'dist', to: 'sa', tone: 'neutral' },
  ],
}
