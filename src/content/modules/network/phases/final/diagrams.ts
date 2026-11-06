/**
 * Desenho do desafio final: a rede dos Supermercados Cesta Cheia crescendo a
 * cada escolha. `CESTA_BASE` é o fundo; `DRAW` diz o que cada opção acrescenta.
 * Os tons são neutros de propósito: o desenho mostra a escolha, e a nota vem do
 * relatório.
 */
import type { DiagramNote, DiagramSpec } from '../../../../../engine/diagram'
import type { ArchOption } from '../../../../../simulators/architecture/model'

type Draw = NonNullable<ArchOption['draw']>

export const CESTA_BASE: DiagramSpec = {
  width: 720,
  height: 440,
  label:
    'Rede dos Supermercados Cesta Cheia. Na Região de São Paulo, três VPCs: a da loja virtual, a de sistemas internos e a de dados. À direita, a Região da Virgínia e os serviços da AWS (Amazon S3 e Amazon SQS). Em cima, a internet; embaixo, as 80 lojas e o centro de distribuição.',
  caption: 'O desenho mostra as escolhas feitas até aqui. A avaliação de cada uma aparece no relatório, depois do envio.',
  boxes: [
    { id: 'internet', kind: 'internet', label: 'Internet', x: 240, y: 2, w: 200, h: 26 },
    { id: 'sp', kind: 'region', label: 'Região de São Paulo', x: 10, y: 40, w: 480, h: 300 },
    { id: 'loja', kind: 'vpc', label: 'VPC da loja virtual', x: 26, y: 66, w: 214, h: 150 },
    { id: 'sist', kind: 'vpc', label: 'VPC de sistemas internos', x: 266, y: 66, w: 210, h: 110 },
    { id: 'dados', kind: 'vpc', label: 'VPC de dados', x: 266, y: 196, w: 210, h: 120 },
    { id: 'va', kind: 'region', label: 'Região da Virgínia', x: 510, y: 40, w: 200, h: 100 },
    { id: 'svc', kind: 'region', label: 'Serviços da AWS', x: 510, y: 160, w: 200, h: 180 },
    { id: 'lojas', kind: 'onprem', label: '80 lojas e o centro de distribuição (10.0.0.0/12)', x: 10, y: 380, w: 480, h: 56 },
  ],
  nodes: [
    { id: 's3', x: 590, y: 220, glyph: 'bucket', label: 'Amazon S3' },
    { id: 'sqs', x: 670, y: 220, glyph: 'queue', label: 'Amazon SQS' },
  ],
}

const cidrs = (a: string, b: string, c: string): Draw => ({
  notes: [
    { x: 36, y: 100, text: a, tone: 'info' },
    { x: 276, y: 100, text: b, tone: 'info' },
    { x: 276, y: 230, text: c, tone: 'info' },
  ],
})

const zones = (n: number): Draw => ({
  boxes: Array.from({ length: n }, (_, i) => ({ id: `z${i}`, kind: 'zone' as const, label: `zona ${'abc'[i]}`, x: 36 + i * 68, y: 112, w: 62, h: 94 })),
})

const note = (x: number, y: number, text: string): DiagramNote => ({ x, y, text, tone: 'neutral' })

export const DRAW: Record<string, Record<string, Draw>> = {
  blocos: {
    distintos: cidrs('10.64.0.0/16', '10.65.0.0/16', '10.66.0.0/16'),
    dentro: cidrs('10.1.0.0/16', '10.2.0.0/16', '10.3.0.0/16'),
    iguais: cidrs('10.0.0.0/16', '10.0.0.0/16', '10.0.0.0/16'),
    grande: cidrs('um /8', 'um /8', 'um /8'),
  },
  camadas: {
    'tres-zonas': zones(3),
    'duas-zonas': zones(2),
    'uma-grande': { boxes: [{ id: 'z0', kind: 'public', label: 'sub-rede pública única', x: 36, y: 112, w: 196, h: 94 }] },
  },
  nat: {
    regional: { nodes: [{ id: 'nat', x: 210, y: 66, glyph: 'router', label: 'NAT regional', labelSide: 'right' }], links: [{ from: 'nat', to: 'internet' }] },
    'um-nat': { nodes: [{ id: 'nat', x: 210, y: 66, glyph: 'router', label: 'NAT só na zona a', labelSide: 'right' }], links: [{ from: 'nat', to: 'internet' }] },
    'ip-publico': { links: [{ from: 'loja', to: 'internet', label: 'IP público' }] },
  },
  banco: {
    'sg-ref': { notes: [note(30, 236, 'banco: só o grupo da aplicação')] },
    'vpc-toda': { notes: [note(30, 236, 'banco: 5432 aberta para a VPC')] },
    acl: { notes: [note(30, 236, 'banco: só uma network ACL')] },
  },
  registro: {
    flow: { notes: [note(30, 256, 'registro: Flow Logs no S3')] },
    cloudtrail: { notes: [note(30, 256, 'registro: CloudTrail')] },
    nada: { notes: [note(30, 256, 'registro: nenhum')] },
  },
  hub: {
    tgw: {
      nodes: [{ id: 'tgw', x: 250, y: 340, glyph: 'router', label: 'Transit Gateway', labelSide: 'right' }],
      links: [
        { from: 'tgw', to: 'loja', arrow: 'none' },
        { from: 'tgw', to: 'sist', arrow: 'none' },
        { from: 'tgw', to: 'dados', arrow: 'none' },
        { from: 'tgw', to: 'lojas', arrow: 'none' },
      ],
    },
    peering: {
      links: [
        { from: 'loja', to: 'sist', arrow: 'none', label: 'peering' },
        { from: 'sist', to: 'dados', arrow: 'none', label: 'peering' },
        { from: 'loja', to: 'dados', arrow: 'none' },
        { from: 'lojas', to: 'sist', arrow: 'none', style: 'dashed', via: [[400, 360]] },
      ],
    },
  },
  s3: {
    gateway: { links: [{ from: 'dados', to: 's3', via: [[540, 300]], label: 'endpoint de gateway' }] },
    nat: { links: [{ from: 'dados', to: 's3', via: [[540, 300]], label: 'pelo NAT' }] },
    interface: { links: [{ from: 'dados', to: 's3', via: [[540, 300]], label: 'endpoint de interface' }] },
  },
  sqs: {
    if: { links: [{ from: 'sist', to: 'sqs', via: [[670, 150]], label: 'endpoint de interface' }] },
    gw: { links: [{ from: 'sist', to: 'sqs', via: [[670, 150]], label: 'endpoint de gateway' }] },
  },
  cd: {
    'dx-dois': { links: [{ from: 'lojas', to: 'sp', via: [[110, 360]], arrow: 'none', label: 'DX em 2 locais' }] },
    'dx-um': { links: [{ from: 'lojas', to: 'sp', via: [[110, 360]], arrow: 'none', label: 'DX em 1 local' }] },
    vpn: { links: [{ from: 'lojas', to: 'sp', via: [[110, 360]], arrow: 'none', style: 'dashed', label: 'VPN do CD' }] },
  },
  pequenas: {
    'vpn-tgw': { links: [{ from: 'lojas', to: 'sp', via: [[400, 360]], arrow: 'none', style: 'dashed', label: 'VPNs das lojas' }] },
    'dx-loja': { links: [{ from: 'lojas', to: 'sp', via: [[400, 360]], arrow: 'none', label: 'DX em cada loja' }] },
    'client-vpn': { notes: [note(330, 430, 'Client VPN por funcionário')] },
  },
  roteamento: {
    'alias-lat': { notes: [note(520, 90, 'DNS: latência,'), note(520, 106, 'com saúde do alvo')] },
    cname: { notes: [note(520, 90, 'DNS: CNAME no ápice')] },
    geo: { notes: [note(520, 90, 'DNS: geolocalização,'), note(520, 106, 'sem registro padrão')] },
  },
  fotos: {
    'cf-oac': { nodes: [{ id: 'cf', x: 640, y: 300, glyph: 'tower', label: 'CloudFront', sub: 'bucket privado (OAC)', labelSide: 'right' }], links: [{ from: 'cf', to: 's3' }] },
    'cf-site': { nodes: [{ id: 'cf', x: 640, y: 300, glyph: 'tower', label: 'CloudFront', sub: 'bucket público', labelSide: 'right' }], links: [{ from: 'cf', to: 's3' }] },
    publico: { notes: [note(530, 300, 'fotos: bucket público')] },
  },
  waf: {
    'waf-fm': { notes: [note(520, 372, 'WAF em todas as contas')] },
    acl: { notes: [note(520, 372, 'ACLs com IPs antigos')] },
    shield: { notes: [note(520, 372, 'Shield Advanced, sem WAF')] },
  },
  ddos: {
    advanced: { notes: [note(520, 392, 'DDoS: Shield Advanced')] },
    standard: { notes: [note(520, 392, 'DDoS: Shield Standard')] },
  },
}
