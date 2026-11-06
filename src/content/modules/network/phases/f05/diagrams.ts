/** Desenhos da fase 5 (acesso privado a serviços). */
import type { DiagramSpec } from '../../../../../engine/diagram'

/** Cartão `pl.gateway-endpoint`: a rota pl-s3 leva ao endpoint de gateway; o resto sai pelo NAT. */
export const GATEWAY_ROUTE: DiagramSpec = {
  width: 720,
  height: 260,
  label:
    'Um servidor numa sub-rede privada. A tabela dela tem a rota pl-s3, a lista de prefixos do S3, para o endpoint de gateway, que leva ao Amazon S3. A rota 0.0.0.0/0 vai para o NAT Gateway, na sub-rede pública, que sai para a internet.',
  caption: 'A rota pl-s3, mais específica que 0.0.0.0/0, leva o tráfego do S3 ao endpoint de gateway, sem custo. O resto continua saindo pelo NAT, que cobra por GB processado.',
  boxes: [
    { id: 'vpc', kind: 'vpc', label: 'VPC 10.60.0.0/16', x: 10, y: 10, w: 460, h: 240 },
    { id: 'priv', kind: 'private', label: 'Sub-rede privada', x: 30, y: 40, w: 200, h: 190 },
    { id: 'pub', kind: 'public', label: 'Sub-rede pública', x: 260, y: 140, w: 190, h: 90 },
    { id: 'aws', kind: 'region', label: 'Região da AWS', x: 520, y: 10, w: 190, h: 120 },
    { id: 'internet', kind: 'internet', label: 'Internet', x: 520, y: 170, w: 190, h: 70 },
  ],
  nodes: [
    { id: 'srv', x: 130, y: 120, glyph: 'server', label: 'Servidor de backup' },
    { id: 'gw', x: 470, y: 70, glyph: 'route', label: 'Endpoint de gateway', tone: 'success' },
    { id: 'nat', x: 355, y: 186, glyph: 'router', label: 'NAT Gateway', tone: 'mastery', labelSide: 'left' },
    { id: 's3', x: 615, y: 74, glyph: 'bucket', label: 'Amazon S3', tone: 'success' },
  ],
  links: [
    { from: 'srv', to: 'gw', tone: 'success', label: 'pl-s3' },
    { from: 'gw', to: 's3', tone: 'success' },
    { from: 'srv', to: 'nat', tone: 'mastery', label: '0.0.0.0/0' },
    { from: 'nat', to: 'internet', tone: 'mastery' },
  ],
}

/** Cartão `pl.interface-endpoint`: uma interface com IP privado em cada zona; o escritório chega pela VPN. */
export const INTERFACE_ZONES: DiagramSpec = {
  width: 720,
  height: 270,
  label:
    'O endpoint de interface do SQS tem uma interface de rede com IP privado na sub-rede A e outra na sub-rede B. As duas levam ao Amazon SQS. O escritório chega à VPC pela VPN e alcança esses IPs privados.',
  caption:
    'O endpoint de interface (AWS PrivateLink) põe uma interface com IP privado em cada zona escolhida. Quem chega à VPC pela VPN alcança esses IPs; o endpoint de gateway, que é só uma rota, não atende quem vem de fora.',
  boxes: [
    { id: 'office', kind: 'onprem', label: 'Escritório', x: 10, y: 90, w: 130, h: 100 },
    { id: 'vpc', kind: 'vpc', label: 'VPC', x: 200, y: 14, w: 340, h: 242 },
    { id: 'sa', kind: 'private', label: 'Sub-rede privada A (zona a)', x: 220, y: 42, w: 300, h: 90 },
    { id: 'sb', kind: 'private', label: 'Sub-rede privada B (zona b)', x: 220, y: 150, w: 300, h: 90 },
  ],
  nodes: [
    { id: 'eni-a', x: 470, y: 94, glyph: 'plug', label: 'interface do endpoint', sub: 'IP privado', tone: 'info', labelSide: 'left' },
    { id: 'eni-b', x: 470, y: 202, glyph: 'plug', label: 'interface do endpoint', sub: 'IP privado', tone: 'info', labelSide: 'left' },
    { id: 'sqs', x: 640, y: 148, glyph: 'queue', label: 'Amazon SQS', tone: 'success' },
  ],
  links: [
    { from: 'office', to: 'sa', style: 'dashed', tone: 'warning', label: 'VPN' },
    { from: 'eni-a', to: 'sqs', tone: 'success' },
    { from: 'eni-b', to: 'sqs', tone: 'success' },
  ],
}

/** Cartão `pl.endpoint-service`: clientes com o mesmo bloco consomem a API pelo PrivateLink. */
export const ENDPOINT_SERVICE: DiagramSpec = {
  width: 720,
  height: 260,
  label:
    'Duas VPCs de clientes, as duas com o bloco 10.60.0.0/16, igual ao da corretora. Cada uma tem um endpoint de interface que leva ao serviço de endpoint da corretora, que encaminha ao Network Load Balancer, na frente da API de cotações.',
  caption:
    'Os clientes usam o mesmo bloco da corretora, e não há problema: o PrivateLink não roteia entre as redes. Cada cliente cria um endpoint de interface, que só alcança a API atrás do Network Load Balancer.',
  boxes: [
    { id: 'c1', kind: 'vpc', label: 'Cliente 1: 10.60.0.0/16', x: 10, y: 20, w: 250, h: 100 },
    { id: 'c2', kind: 'vpc', label: 'Cliente 2: 10.60.0.0/16', x: 10, y: 140, w: 250, h: 100 },
    { id: 'prov', kind: 'vpc', label: 'Corretora: 10.60.0.0/16', x: 410, y: 20, w: 300, h: 220 },
  ],
  nodes: [
    { id: 'ep1', x: 210, y: 76, glyph: 'plug', label: 'endpoint de interface', tone: 'info', labelSide: 'left' },
    { id: 'ep2', x: 210, y: 196, glyph: 'plug', label: 'endpoint de interface', tone: 'info', labelSide: 'left' },
    { id: 'svc', x: 410, y: 136, glyph: 'plug', label: 'Serviço de endpoint', tone: 'accent' },
    { id: 'nlb', x: 530, y: 136, glyph: 'split', label: 'Network Load', sub: 'Balancer', tone: 'accent' },
    { id: 'api', x: 645, y: 136, glyph: 'api', label: 'API de cotações' },
  ],
  links: [
    { from: 'ep1', to: 'svc', tone: 'success' },
    { from: 'ep2', to: 'svc', tone: 'success' },
    { from: 'svc', to: 'nlb', tone: 'success' },
    { from: 'nlb', to: 'api', tone: 'success' },
  ],
}

/** Montagem da missão 2: VPC com duas zonas, a tabela das sub-redes privadas e os serviços da AWS. */
export const PATHS_BOARD: DiagramSpec = {
  width: 720,
  height: 400,
  label:
    'Uma VPC com duas zonas, cada uma com uma sub-rede privada. As duas sub-redes usam a mesma tabela de rotas. À direita, os serviços da AWS na Região: Amazon S3, DynamoDB e Amazon SQS. Há três lugares para peças: a tabela de rotas e cada uma das sub-redes privadas.',
  boxes: [
    { id: 'vpc', kind: 'vpc', label: 'VPC 10.60.0.0/16', x: 10, y: 10, w: 520, h: 380 },
    { id: 'za', kind: 'zone', label: 'Zona a', x: 30, y: 140, w: 230, h: 236 },
    { id: 'zb', kind: 'zone', label: 'Zona b', x: 280, y: 140, w: 230, h: 236 },
    { id: 'sa', kind: 'private', label: 'Sub-rede privada A', x: 44, y: 166, w: 202, h: 196 },
    { id: 'sb', kind: 'private', label: 'Sub-rede privada B', x: 294, y: 166, w: 202, h: 196 },
    { id: 'aws', kind: 'region', label: 'Serviços da AWS', x: 550, y: 10, w: 160, h: 380 },
  ],
  nodes: [
    { id: 's3', x: 630, y: 90, glyph: 'bucket', label: 'Amazon S3', tone: 'success' },
    { id: 'ddb', x: 630, y: 200, glyph: 'table', label: 'DynamoDB', tone: 'success' },
    { id: 'sqs', x: 630, y: 310, glyph: 'queue', label: 'Amazon SQS', tone: 'success' },
  ],
}
