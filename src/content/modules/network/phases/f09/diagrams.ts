/** Desenhos da fase 9 (proteção de borda e escolha). */
import type { DiagramSpec } from '../../../../../engine/diagram'

/** Cartão `edgesec.shield-standard`: as camadas 3, 4 e 7 e quem protege cada uma. */
export const ATTACK_LAYERS: DiagramSpec = {
  width: 720,
  height: 230,
  label:
    'Três camadas de ataque. Camada 7, aplicação: requisições HTTP, filtradas pelo WAF, com mitigação extra do Shield Advanced. Camada 4, transporte: TCP e UDP, como a inundação de SYN. Camada 3, rede: pacotes IP, como a inundação de pacotes. As camadas 3 e 4 são cobertas pelo Shield Standard, e o Advanced amplia essa proteção.',
  caption:
    'O Shield Standard cobre os ataques mais comuns das camadas 3 e 4, sem custo extra. Na camada 7, quem filtra é o WAF; o Shield Advanced acrescenta mitigação nessa camada, equipe de resposta e créditos.',
  boxes: [
    { id: 'l7', kind: 'generic', label: 'Camada 7, aplicação: requisições HTTP', x: 10, y: 34, w: 380, h: 50 },
    { id: 'l4', kind: 'generic', label: 'Camada 4, transporte: TCP e UDP (inundação de SYN)', x: 10, y: 100, w: 380, h: 50 },
    { id: 'l3', kind: 'generic', label: 'Camada 3, rede: pacotes IP (inundação de pacotes)', x: 10, y: 166, w: 380, h: 50 },
    { id: 'p7', kind: 'vpc', label: 'AWS WAF e Shield Advanced', x: 470, y: 34, w: 240, h: 50 },
    { id: 'p34', kind: 'public', label: 'Shield Standard (e o Advanced)', x: 470, y: 100, w: 240, h: 116 },
  ],
  links: [
    { from: 'l7', to: 'p7', tone: 'accent' },
    { from: 'l4', to: 'p34', tone: 'success' },
    { from: 'l3', to: 'p34', tone: 'success' },
  ],
  notes: [
    { x: 10, y: 22, text: 'Onde o ataque acontece', tone: 'info' },
    { x: 470, y: 22, text: 'Quem protege', tone: 'info' },
  ],
}

/** Cartão `edgesec.network-firewall`: o firewall entra no caminho pelas rotas. */
export const FIREWALL_ROUTE: DiagramSpec = {
  width: 720,
  height: 260,
  label:
    'VPC com três sub-redes. Na sub-rede de aplicação, um servidor tem a rota 0.0.0.0/0 para o endpoint do Network Firewall, que fica numa sub-rede própria. A sub-rede do firewall tem a rota 0.0.0.0/0 para o NAT Gateway, na sub-rede pública, que sai para a internet.',
  caption:
    'O Network Firewall entra no caminho pelas tabelas de rotas: a sub-rede de aplicação manda 0.0.0.0/0 para o endpoint do firewall, e a sub-rede do firewall manda 0.0.0.0/0 para o NAT. Assim, todo o tráfego de saída passa pelas regras, inclusive o filtro por domínio.',
  boxes: [
    { id: 'vpc', kind: 'vpc', label: 'VPC', x: 10, y: 20, w: 560, h: 230 },
    { id: 'app', kind: 'private', label: 'Sub-rede de aplicação', x: 30, y: 54, w: 160, h: 176 },
    { id: 'fw', kind: 'generic', label: 'Sub-rede do firewall', x: 210, y: 54, w: 160, h: 176 },
    { id: 'pub', kind: 'public', label: 'Sub-rede pública', x: 390, y: 54, w: 160, h: 176 },
    { id: 'internet', kind: 'internet', label: 'Internet', x: 600, y: 100, w: 110, h: 80 },
  ],
  nodes: [
    { id: 'srv', x: 110, y: 130, glyph: 'server', label: 'Servidor' },
    { id: 'fwe', x: 290, y: 130, glyph: 'firewall', label: 'Endpoint do\nNetwork Firewall', tone: 'warning' },
    { id: 'nat', x: 470, y: 130, glyph: 'router', label: 'NAT Gateway', tone: 'mastery' },
  ],
  links: [
    { from: 'srv', to: 'fwe', tone: 'warning', label: '0.0.0.0/0' },
    { from: 'fwe', to: 'nat', tone: 'mastery', label: '0.0.0.0/0' },
    { from: 'nat', to: 'internet', tone: 'mastery' },
  ],
}

/** Montagem da missão 3: a organização, a borda e a VPC do marketplace. */
export const DEFENSE_BOARD: DiagramSpec = {
  width: 720,
  height: 420,
  label:
    'A organização do marketplace, com trinta contas. Dentro dela, a borda com o CloudFront e a VPC da loja, com uma sub-rede pública, uma sub-rede do firewall e uma sub-rede de aplicação. Há seis lugares para peças: todas as contas, a borda, o caminho até o NAT, a entrada da sub-rede de aplicação e cada servidor.',
  boxes: [
    { id: 'org', kind: 'account', label: 'Organização: 30 contas', x: 10, y: 10, w: 700, h: 400 },
    { id: 'edge', kind: 'generic', label: 'Borda: CloudFront e Route 53', x: 30, y: 94, w: 330, h: 94 },
    { id: 'vpc', kind: 'vpc', label: 'VPC da loja', x: 30, y: 204, w: 670, h: 196 },
    { id: 'pub', kind: 'public', label: 'Pública (ALB e NAT)', x: 46, y: 232, w: 170, h: 154 },
    { id: 'fw', kind: 'generic', label: 'Sub-rede do firewall', x: 230, y: 232, w: 170, h: 154 },
    { id: 'app', kind: 'private', label: 'Sub-rede de aplicação', x: 414, y: 232, w: 274, h: 154 },
  ],
  nodes: [
    { id: 'alb', x: 90, y: 300, glyph: 'split', label: 'ALB' },
    { id: 'nat', x: 170, y: 300, glyph: 'router', label: 'NAT' },
  ],
}
