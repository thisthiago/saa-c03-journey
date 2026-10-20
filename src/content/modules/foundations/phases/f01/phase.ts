/**
 * Fase 1 — AWS Global Infrastructure. Uma empresa fictícia por missão, porque
 * cada opção de infraestrutura responde a um tipo diferente de problema.
 */
import type { PhaseDef } from '../../../../../engine/types'
import type { RegionScenario } from '../../../../../simulators/regions/model'
import type { ZonesTopology } from '../../../../../simulators/zones/model'
import type { EdgeLabConfig } from '../../../../../simulators/edge/lab'
import type { Behavior, EdgeSetup } from '../../../../../simulators/edge/model'
import type { PlacementItem, PlacementOption } from '../../../../../simulators/placement/model'

// ---------------------------------------------------------------------------
// Missão 1 — Regiões (Viajaí)

export const EU_SCENARIO: RegionScenario = {
  id: 'eu',
  title: 'Recomendações na Europa',
  description: 'A Viajaí vai treinar modelos de recomendação para clientes da Península Ibérica e da França. O pipeline de treino usa **Amazon S3 Express One Zone** para leituras de baixíssima latência. O contrato com os parceiros europeus exige que os dados fiquem em países da União Europeia.',
  groups: [
    { id: 'ibe', label: 'Península Ibérica', share: 0.8 },
    { id: 'fr', label: 'França', share: 0.2 },
  ],
  candidates: ['eu-south-2', 'eu-west-3', 'eu-west-1', 'eu-central-1'],
  latencyMs: {
    'eu-south-2': { ibe: 10, fr: 25 },
    'eu-west-3': { ibe: 28, fr: 8 },
    'eu-west-1': { ibe: 35, fr: 22 },
    'eu-central-1': { ibe: 38, fr: 20 },
  },
  requirements: {
    residency: { countries: ['Espanha', 'França', 'Irlanda', 'Alemanha'], reason: 'o contrato com os parceiros exige dados em países da União Europeia' },
    features: ['s3-express-one-zone'],
  },
  priority: 'latency',
  storageGB: 20_000,
  concepts: ['infra.region-selection', 'infra.opt-in-regions'],
}

export const BR_SCENARIO: RegionScenario = {
  id: 'br',
  title: 'Pagamentos no Brasil',
  description: 'O módulo de pagamentos atende clientes no Brasil e no México. O contrato com o banco parceiro exige que os dados de pagamento fiquem **no Brasil**. A diretoria pede o menor custo possível.',
  groups: [
    { id: 'br', label: 'Brasil', share: 0.75 },
    { id: 'mx', label: 'México', share: 0.25 },
  ],
  candidates: ['us-east-1', 'mx-central-1', 'sa-east-1'],
  latencyMs: {
    'us-east-1': { br: 120, mx: 60 },
    'mx-central-1': { br: 140, mx: 12 },
    'sa-east-1': { br: 15, mx: 160 },
  },
  requirements: { residency: { countries: ['Brasil'], reason: 'o contrato com o banco parceiro exige os dados de pagamento no Brasil' } },
  priority: 'cost',
  storageGB: 5_000,
  concepts: ['infra.region-selection', 'infra.data-residency'],
}

export const BATCH_SCENARIO: RegionScenario = {
  id: 'batch',
  title: 'Relatórios noturnos',
  description: 'Um processamento em lote gera relatórios internos de madrugada, sem dados pessoais e sem exigência contratual de localização. Ninguém espera pela resposta em tempo real: o critério é custo.',
  groups: [{ id: 'eq', label: 'Equipe de dados (Brasil)', share: 1 }],
  candidates: ['sa-east-1', 'mx-central-1', 'us-east-1'],
  latencyMs: { 'sa-east-1': { eq: 15 }, 'mx-central-1': { eq: 140 }, 'us-east-1': { eq: 120 } },
  requirements: {},
  priority: 'cost',
  storageGB: 50_000,
  concepts: ['infra.region-selection'],
}

// ---------------------------------------------------------------------------
// Missão 2 — Zonas de Disponibilidade (AgendaSaúde)

const INSTANCES = ['web-1', 'web-2', 'web-3', 'web-4', 'web-5', 'web-6']

export const AGENDA_CONCENTRATED: ZonesTopology = {
  azs: ['a', 'b', 'c'],
  required: 4,
  instances: { 'web-1': 'a', 'web-2': 'a', 'web-3': 'a', 'web-4': 'a', 'web-5': undefined, 'web-6': undefined },
  albAzs: ['a', 'b'],
  nat: { mode: 'zonal-single', az: 'a' },
  needsInternet: true,
  db: { mode: 'single-az', primary: 'a' },
}

const AGENDA_SOLUTION: ZonesTopology = {
  ...AGENDA_CONCENTRATED,
  instances: Object.fromEntries(INSTANCES.map((id, i) => [id, ['a', 'b', 'c'][i % 3]])),
  albAzs: ['a', 'b', 'c'],
  nat: { mode: 'zonal-per-az' },
  db: { mode: 'multi-az', primary: 'a', standby: 'b' },
}

const SPREAD_ONE_NAT: ZonesTopology = { ...AGENDA_SOLUTION, nat: { mode: 'zonal-single', az: 'a' } }

// ---------------------------------------------------------------------------
// Missão 6 — Borda (Sabor de Casa)

const EDGE_SETUP: EdgeSetup = {
  origin: { kind: 's3', region: 'us-east-1', label: 'Bucket S3 em us-east-1' },
  rec: { region: 'rec-proximo', label: 'REC mais próximo do POP' },
  popLabel: 'POP perto da leitora, no Brasil',
  latency: { viewerPop: 12, popRec: 25, recOrigin: 110, popOrigin: 125 },
  popEvictAfterIdleSec: 1800,
}

const EDGE_LAB: EdgeLabConfig = {
  setup: EDGE_SETUP,
  ttlOptions: [0, 60, 300, 3600, 86400],
  allowInvalidation: true,
  events: [
    { at: 0, kind: 'request', method: 'GET', path: '/img/bolo.jpg' },
    { at: 5, kind: 'request', method: 'GET', path: '/img/bolo.jpg' },
    { at: 10, kind: 'request', method: 'GET', path: '/api/favoritos' },
    { at: 20, kind: 'request', method: 'GET', path: '/destaques.json' },
    { at: 30, kind: 'request', method: 'GET', path: '/img/bolo.jpg' },
    { at: 60, kind: 'request', method: 'GET', path: '/img/bolo.jpg' },
    { at: 90, kind: 'request', method: 'GET', path: '/img/torta.jpg' },
    { at: 95, kind: 'request', method: 'GET', path: '/img/torta.jpg' },
    { at: 120, kind: 'request', method: 'GET', path: '/api/favoritos' },
    { at: 600, kind: 'origin-update', path: '/destaques.json' },
    { at: 700, kind: 'request', method: 'GET', path: '/destaques.json' },
    { at: 1500, kind: 'request', method: 'GET', path: '/destaques.json' },
    { at: 4000, kind: 'request', method: 'GET', path: '/img/bolo.jpg' },
    { at: 4100, kind: 'request', method: 'GET', path: '/destaques.json' },
    { at: 7300, kind: 'request', method: 'GET', path: '/img/bolo.jpg' },
  ],
  initial: {
    behaviors: [
      { pattern: '/api/*', cache: true, ttlSec: 3600 },
      { pattern: '/destaques.json', cache: true, ttlSec: 86400 },
      { pattern: '*', cache: false, ttlSec: 0 },
    ],
    invalidateOnUpdate: false,
  },
  solution: {
    behaviors: [
      { pattern: '/api/*', cache: false, ttlSec: 0 },
      { pattern: '/destaques.json', cache: true, ttlSec: 60 },
      { pattern: '*', cache: true, ttlSec: 86400 },
    ],
    invalidateOnUpdate: false,
  },
  goals: [
    { kind: 'never-cached', prefix: '/api/', concepts: ['edge.cloudfront'] },
    { kind: 'max-stale', path: '/destaques.json', seconds: 300, concepts: ['edge.cloudfront'] },
    { kind: 'origin-max', max: 8, concepts: ['edge.cloudfront', 'edge.regional-edge-cache'] },
  ],
}

const CACHE_ALL: Behavior[] = [{ pattern: '*', cache: true, ttlSec: 86400 }]

// ---------------------------------------------------------------------------
// Chefe — Escolhendo a infraestrutura adequada

const ALL_OPTIONS: PlacementOption[] = ['single-az', 'multi-az', 'multi-region', 'local-zone', 'wavelength', 'outposts', 'cloudfront', 'global-accelerator']

const SCENARIOS: PlacementItem[] = [
  { id: 'erp', text: 'ERP corporativo que precisa de alta disponibilidade, com orçamento controlado', dominant: 'ha-az', needs: ['ha-az', 'full-services'], concepts: ['infra.multi-az'] },
  { id: 'jogo', text: 'API de partidas multijogador (UDP) com jogadores em vários continentes, IPs fixos e failover entre Regiões', dominant: 'global-dynamic', needs: ['global-dynamic'], concepts: ['edge.global-accelerator'] },
  { id: 'metro', text: 'Estações de trabalho virtuais para artistas de uma metrópole distante da Região, com latência de um dígito de ms', dominant: 'metro-latency', needs: ['metro-latency'], concepts: ['infra.local-zones'] },
  { id: 'ar', text: 'App de realidade aumentada para celulares na rede 5G de uma operadora parceira, com latência ultrabaixa', dominant: 'mobile-5g', needs: ['mobile-5g'], concepts: ['infra.wavelength'] },
  { id: 'fabrica', text: 'Inspeção de qualidade que precisa processar as imagens dentro da fábrica', dominant: 'on-premises', needs: ['on-premises'], concepts: ['infra.outposts'] },
  { id: 'portal', text: 'Portal de notícias com muitas imagens e vídeos, para leitores espalhados pelo mundo', dominant: 'static-cache', needs: ['static-cache'], concepts: ['edge.cloudfront'] },
  { id: 'loja', text: 'Loja online que não pode parar se uma Zona de Disponibilidade falhar', dominant: 'ha-az', needs: ['ha-az'], concepts: ['infra.multi-az', 'infra.ha-vs-dr'] },
  { id: 'banco', text: 'Sistema bancário que precisa de recuperação de desastres em outra Região', dominant: 'dr-region', needs: ['dr-region', 'full-services'], concepts: ['infra.ha-vs-dr', 'infra.no-auto-replication'] },
]

const COMPONENTS: PlacementItem[] = [
  { id: 'partidas', text: 'Servidor de partidas para jogadores de uma metrópole longe da Região (latência abaixo de 10 ms)', dominant: 'metro-latency', needs: ['metro-latency'], concepts: ['infra.local-zones'] },
  { id: 'contas', text: 'Banco de contas dos jogadores, que não pode parar se uma AZ falhar', dominant: 'ha-az', needs: ['ha-az', 'full-services'], concepts: ['infra.multi-az', 'infra.rds-multi-az'] },
  { id: 'trailers', text: 'Trailers e imagens do site oficial', dominant: 'static-cache', needs: ['static-cache'], concepts: ['edge.cloudfront'] },
  { id: 'movel', text: 'Modo móvel em tempo real para quem joga na rede 5G da operadora parceira', dominant: 'mobile-5g', needs: ['mobile-5g'], concepts: ['infra.wavelength'] },
  { id: 'copia', text: 'Cópia dos dados para sobreviver à perda da Região principal', dominant: 'dr-region', needs: ['dr-region'], concepts: ['infra.ha-vs-dr'] },
]

const AZ_OUTCOMES = [
  { id: 'ok', text: 'Continua disponível, com capacidade suficiente', outcome: 'available' },
  { id: 'deg', text: 'Continua respondendo, mas com capacidade abaixo da necessária', outcome: 'degraded' },
  { id: 'down', text: 'Fica fora do ar', outcome: 'down' },
]

const HOPS = [
  { id: 'pop', text: 'O POP (edge location), do próprio cache', outcome: 'pop' },
  { id: 'rec', text: 'O Regional Edge Cache', outcome: 'rec' },
  { id: 'origin', text: 'A origem (bucket S3)', outcome: 'origin' },
]

export const F01_FOUNDATIONS: PhaseDef = {
  id: 'fnd.f01',
  order: 1,
  title: 'Infraestrutura global da AWS',
  subtitle: 'Regiões, AZs, Local Zones, Wavelength, Outposts e borda',
  summary: 'Decida onde cada aplicação deve rodar — e descubra por que a Região mais próxima, ou a opção mais sofisticada, nem sempre é a certa.',
  glyph: 'globe',
  color: '#4dd6ff',
  requires: [],
  concepts: [
    'infra.region',
    'infra.region-selection',
    'infra.data-residency',
    'infra.opt-in-regions',
    'infra.no-auto-replication',
    'infra.service-scope',
    'infra.az',
    'infra.multi-az',
    'infra.spof',
    'infra.static-stability',
    'infra.ha-vs-dr',
    'infra.alb-zones',
    'infra.nat-zonal-regional',
    'infra.rds-multi-az',
    'infra.local-zones',
    'infra.wavelength',
    'infra.outposts',
    'infra.outposts-service-link',
    'edge.pop',
    'edge.regional-edge-cache',
    'edge.cloudfront',
    'edge.route53',
    'edge.global-accelerator',
  ],
  availability: 'available',
  estimatedMinutes: 90,
  map: { x: 150, y: 360 },
  simplifications: [
    'Latências entre usuários e Regiões são premissas ilustrativas de cada cenário, não medições da AWS.',
    'O custo entre Regiões compara só o S3 Standard (tabela de preços de 18/10/2026).',
    'No simulador de AZs, a falha é total, o failover do RDS é instantâneo e o Auto Scaling não é simulado.',
    'No simulador de borda há um único POP e um único Regional Edge Cache, TTL fixo e descarte por inatividade com prazo de premissa.',
    'A escolha de infraestrutura usa um requisito dominante por cenário; o custo relativo é julgamento de arquitetura.',
  ],
  missions: [
    // -----------------------------------------------------------------------
    {
      id: 'fnd.f01.m1',
      title: 'Onde fica a aplicação?',
      type: 'mission',
      summary: 'Regiões, o que é regional, zonal ou global, e como escolher uma Região.',
      briefing: {
        company: 'Viajaí',
        role: 'Você é a pessoa de arquitetura de uma agência de viagens digital que está saindo do datacenter próprio.',
        situation: 'A Viajaí tem clientes no Brasil, no México e na Europa. Cada time quer a Região "mais perto de casa". Há contratos que limitam onde os dados podem ficar.',
        objective: 'Escolher a Região certa para cada parte do sistema e entender o que fica preso a ela.',
        successCriteria: ['Classificar recursos como zonais, regionais ou globais', 'Escolher Regiões que atendam a todos os requisitos', 'Saber o que acontece com os dados se uma Região cair'],
      },
      intel: [
        { conceptId: 'infra.region', visual: 'global-hierarchy', body: ['Uma **Região** é uma área geográfica com **três ou mais AZs**. Regiões são isoladas: a falha de uma não afeta as outras. Em 18/10/2026 eram **34**.'] },
        { conceptId: 'infra.no-auto-replication', visual: 'region-map', body: ['O que você cria numa Região **só existe nela**. Cópia em outra Região exige replicação ou cópia explícita. Regiões lançadas depois de 20/03/2019 são **opt-in**: precisam ser habilitadas.'] },
        { conceptId: 'infra.region-selection', body: ['Escolha em duas etapas: **elimine** as Regiões que violam requisitos rígidos (onde os dados podem ficar, serviços indispensáveis) e **compare** latência e custo entre as que sobram.'] },
        { conceptId: 'infra.service-scope', body: ['**Zonal**: vive numa AZ (instância EC2, volume EBS). **Regional**: distribuído pela Região (bucket S3, Lambda). **Global**: IAM, Route 53, CloudFront — plano de dados distribuído, plano de controle numa Região.'] },
      ],
      activities: [
        {
          id: 'fnd.f01.m1.a1',
          kind: 'classify',
          title: 'Zonal, regional ou global?',
          prompt: 'Classifique cada recurso pelo seu escopo.',
          concepts: [{ id: 'infra.service-scope' }, { id: 'infra.region', weight: 0.5 }],
          xp: 50,
          difficulty: 2,
          explanation: ['Saber o escopo diz o que cai junto com uma AZ ou uma Região: recursos zonais caem com a AZ; regionais sobrevivem à perda de uma AZ; globais não pertencem a uma Região.'],
          bins: [
            { id: 'zonal', label: 'Zonal', description: 'Fica numa AZ' },
            { id: 'regional', label: 'Regional', description: 'Distribuído pela Região' },
            { id: 'global', label: 'Global', description: 'Não pertence a uma Região' },
          ],
          items: [
            { id: 'ec2', text: 'Instância Amazon EC2', bin: 'zonal', explanation: 'Você escolhe a subnet, e cada subnet fica numa AZ.', concepts: ['infra.service-scope'] },
            { id: 'ebs', text: 'Volume Amazon EBS', bin: 'zonal', explanation: 'O volume fica na AZ onde foi criado.', concepts: ['infra.service-scope'] },
            { id: 'natz', text: 'NAT gateway no modo zonal', bin: 'zonal', explanation: 'Criado numa AZ específica; existe também o modo regional.', concepts: ['infra.service-scope', 'infra.nat-zonal-regional'] },
            { id: 's3', text: 'Bucket Amazon S3', bin: 'regional', explanation: 'O bucket pertence a uma Região e o S3 Standard guarda os dados em várias AZs.', concepts: ['infra.service-scope', 'infra.region'] },
            { id: 'iam', text: 'Role do IAM', bin: 'global', explanation: 'O IAM é global na partição; o plano de controle fica em us-east-1.', concepts: ['infra.service-scope'] },
            { id: 'r53', text: 'Hosted zone pública do Route 53', bin: 'global', explanation: 'O Route 53 público responde a partir de centenas de POPs.', concepts: ['infra.service-scope', 'edge.route53'] },
          ],
        },
        {
          id: 'fnd.f01.m1.a2',
          kind: 'lab',
          lab: 'region',
          title: 'Três decisões de Região',
          prompt: 'Escolha a Região de cada parte do sistema. Compare os fatos verificados (país, opt-in, recursos, preço) com as premissas do cenário (latência).',
          concepts: [{ id: 'infra.region-selection' }, { id: 'infra.data-residency', weight: 0.5 }, { id: 'infra.opt-in-regions', weight: 0.5 }],
          xp: 120,
          difficulty: 2,
          hints: ['Primeiro elimine as Regiões que violam algum requisito; só depois compare latência ou custo.', 'Confira se o recurso exigido está disponível em cada candidata.'],
          explanation: [
            'Europa: eu-south-2 é a mais próxima, mas não oferecia S3 Express One Zone (documentação de 18/10/2026) e é opt-in. Entre as que atendem, eu-west-3 tem a menor latência média.',
            'Pagamentos: só sa-east-1 fica no Brasil. Ela custa mais no S3 Standard, mas o requisito contratual decide.',
            'Relatórios: sem exigência de localização nem de latência, vence o menor custo (us-east-1).',
          ],
          config: { scenarios: [EU_SCENARIO, BR_SCENARIO, BATCH_SCENARIO] },
        },
        {
          id: 'fnd.f01.m1.a3',
          kind: 'predict',
          title: 'A Região mais próxima serve?',
          prompt: 'No cenário europeu, a Região **eu-south-2 (Spain)** tem a menor latência para a Península Ibérica. Ela atende a todos os requisitos?',
          concepts: [{ id: 'infra.region-selection' }],
          xp: 30,
          difficulty: 2,
          explanation: ['Não: o pipeline precisa de S3 Express One Zone, que não estava disponível em eu-south-2 em 18/10/2026. Proximidade não compensa um requisito rígido.'],
          spec: { sim: 'region', scenario: EU_SCENARIO, query: { type: 'feasible', region: 'eu-south-2' } },
          options: [
            { id: 'y', text: 'Sim: menor latência e dentro da UE', outcome: 'yes' },
            { id: 'n', text: 'Não: falta um requisito', outcome: 'no' },
          ],
        },
        {
          id: 'fnd.f01.m1.a4',
          kind: 'decision',
          title: 'E se São Paulo cair?',
          prompt: 'Os dados de pagamento ficam num bucket em sa-east-1, sem nenhuma replicação configurada. Se a Região ficar indisponível por horas, o que acontece com esses dados?',
          concepts: [{ id: 'infra.no-auto-replication' }, { id: 'infra.data-residency', weight: 0.5 }],
          xp: 40,
          difficulty: 1,
          explanation: ['Regiões são isoladas: os dados só existem em sa-east-1 e ficam inacessíveis até a Região voltar. Uma cópia em outra Região precisa ser configurada — e, aqui, respeitando o contrato que exige o Brasil.'],
          options: [
            { id: 'a', text: 'Ficam inacessíveis até a Região voltar: não há cópia em outra Região.', correct: true, consequence: 'A empresa decide, conscientemente, se precisa de DR e onde ele poderia ficar sem violar o contrato.', impacts: { disponibilidade: -1 } },
            { id: 'b', text: 'A AWS serve automaticamente a cópia que mantém em us-east-1.', correct: false, consequence: 'Essa cópia não existe: nada é replicado entre Regiões sem configuração.' },
            { id: 'c', text: 'As outras AZs de sa-east-1 continuam servindo, porque o S3 usa várias AZs.', correct: false, consequence: 'Várias AZs protegem contra a perda de uma AZ, não da Região inteira.' },
          ],
          justification: {
            prompt: 'Qual princípio explica isso?',
            options: [
              { id: 'j1', text: 'Recursos e dados de uma Região não existem em outra sem replicação ou cópia explícita.', correct: true, feedback: 'Exato: o isolamento entre Regiões é o que limita o impacto de uma falha — e também o que exige planejar o DR.' },
              { id: 'j2', text: 'O S3 é um serviço global.', correct: false, feedback: 'O nome do bucket é global, mas os dados ficam na Região escolhida.' },
            ],
          },
        },
      ],
      debrief: {
        takeaways: ['Requisitos rígidos eliminam Regiões; latência e custo desempatam.', 'Nada é replicado entre Regiões sozinho.', 'Regiões novas (depois de 20/03/2019) são opt-in.'],
      },
    },
    // -----------------------------------------------------------------------
    {
      id: 'fnd.f01.m2',
      title: 'Quando uma zona cai',
      type: 'mission',
      summary: 'Distribua uma aplicação entre AZs e descubra os pontos únicos de falha.',
      briefing: {
        company: 'AgendaSaúde',
        role: 'Você entrou no time de plataforma de um sistema de agendamento de consultas.',
        situation: 'Tudo roda na AZ a: as instâncias, o único NAT gateway (as consultas confirmam pagamento numa API externa) e o banco Single-AZ. O ALB foi criado com as AZs a e b só porque exigia duas.',
        objective: 'Reorganizar a arquitetura para que a queda de qualquer AZ não tire o agendamento do ar — sem estourar o orçamento de instâncias.',
        successCriteria: ['Sobreviver à falha de qualquer AZ', 'Manter 4 instâncias atendendo mesmo sem uma AZ', 'Usar no máximo 6 instâncias'],
      },
      intel: [
        { conceptId: 'infra.az', visual: 'az-isolation', body: ['Uma **AZ** é um ou mais data centers com energia, rede e conectividade **próprias**, a até cerca de 100 km das outras AZs da Região — perto o bastante para replicação síncrona.'] },
        { conceptId: 'infra.multi-az', body: ['Multi-AZ só funciona se **toda a cadeia** for redundante. O **ALB** exige ao menos duas AZs e só manda tráfego para alvos em zonas habilitadas. O **RDS Multi-AZ** tem um standby em outra AZ com failover automático.'] },
        { conceptId: 'infra.nat-zonal-regional', body: ['Um **NAT gateway zonal** fica numa AZ: se ela cai, instâncias das outras AZs que o usam perdem a internet. Use **um por AZ** ou o **modo regional**, que se expande pelas AZs com workloads.'] },
        { conceptId: 'infra.static-stability', body: ['**Static stability**: deixe capacidade de sobra já rodando. Se a carga pede 6 instâncias em 3 AZs, implante 9 — perder uma AZ ainda deixa 6.'] },
      ],
      activities: [
        {
          id: 'fnd.f01.m2.a1',
          kind: 'lab',
          lab: 'zones',
          title: 'Derrube uma AZ',
          prompt: 'Simule a falha de cada AZ na arquitetura atual. Depois reorganize instâncias, ALB, NAT e banco até cumprir os objetivos.',
          concepts: [{ id: 'infra.multi-az' }, { id: 'infra.spof' }, { id: 'infra.alb-zones', weight: 0.5 }, { id: 'infra.rds-multi-az', weight: 0.5 }, { id: 'infra.nat-zonal-regional', weight: 0.5 }],
          xp: 140,
          difficulty: 2,
          hints: ['Com 4 instâncias necessárias e 3 AZs, quantas por AZ garantem 4 se uma AZ cair?', 'Olhe para tudo o que ficou só na AZ a: NAT gateway e banco.'],
          explanation: [
            'Uma solução: 2 instâncias por AZ (6 no total), ALB com as três AZs, um NAT gateway por AZ (ou o regional) e RDS Multi-AZ.',
            'Perder qualquer AZ deixa 4 instâncias com saída para a internet e o standby do banco assume. Perder a Região inteira ainda derruba tudo — isso é tarefa de DR.',
          ],
          config: {
            initial: AGENDA_CONCENTRATED,
            solution: AGENDA_SOLUTION,
            goals: [
              { kind: 'valid', concepts: ['infra.alb-zones'] },
              { kind: 'normal-ok', concepts: ['infra.alb-zones'] },
              { kind: 'survive-az', concepts: ['infra.spof', 'infra.rds-multi-az', 'infra.nat-zonal-regional'] },
              { kind: 'full-capacity', concepts: ['infra.multi-az', 'infra.static-stability'] },
              { kind: 'max-instances', max: 6, concepts: ['infra.static-stability'] },
            ],
          },
        },
        {
          id: 'fnd.f01.m2.a2',
          kind: 'predict',
          title: 'Instâncias espalhadas, NAT sozinho',
          prompt: 'Outra equipe distribuiu 2 instâncias por AZ e ligou o RDS Multi-AZ, mas manteve **um único NAT gateway zonal na AZ a**. Toda consulta chama a API externa de pagamentos. A AZ a cai. O que acontece?',
          concepts: [{ id: 'infra.nat-zonal-regional' }, { id: 'infra.spof', weight: 0.5 }],
          xp: 40,
          difficulty: 2,
          explanation: ['As instâncias de b e c estão de pé, mas o caminho delas até a internet passava pelo NAT da AZ a. Sem saída, nenhuma consulta é concluída: o NAT era o ponto único de falha.'],
          spec: { sim: 'zones', topology: SPREAD_ONE_NAT, failure: 'a' },
          options: AZ_OUTCOMES,
        },
        {
          id: 'fnd.f01.m2.a3',
          kind: 'estimate',
          title: 'Quantas instâncias?',
          prompt: 'A carga normal exige **6 instâncias**. Você quer distribuí-las igualmente por **3 AZs** e continuar com capacidade total mesmo se uma AZ inteira cair, sem esperar o Auto Scaling. Quantas instâncias implantar?',
          concepts: [{ id: 'infra.static-stability' }],
          xp: 30,
          difficulty: 2,
          explanation: ['Sem uma AZ, sobram 2 de 3 AZs. Para que elas tenham 6, cada AZ precisa de 3: total de 9 — o exemplo de static stability da própria AWS, com 50% a mais de instâncias em operação normal.'],
          unit: 'instâncias',
          min: 6,
          max: 18,
          step: 1,
          answer: 9,
          tolerance: 0.05,
        },
        {
          id: 'fnd.f01.m2.a4',
          kind: 'decision',
          title: 'Multi-AZ resolve tudo?',
          prompt: 'Com a nova arquitetura, a diretoria pergunta: "agora estamos protegidos de qualquer desastre?". O que você responde?',
          concepts: [{ id: 'infra.ha-vs-dr' }, { id: 'infra.az', weight: 0.5 }],
          xp: 40,
          difficulty: 2,
          explanation: ['Várias AZs dão alta disponibilidade dentro da Região. A perda da Região, um deploy com defeito aplicado em todas as AZs ou dados corrompidos replicados exigem outras defesas: DR em outra Região, implantação gradual e backups.'],
          options: [
            { id: 'a', text: 'Não: estamos protegidos contra a falha de uma AZ, mas não contra a perda da Região, um deploy ruim em todas as AZs ou dados corrompidos.', correct: true, consequence: 'A diretoria entende o que foi resolvido e o que ainda é risco aceito.', impacts: { disponibilidade: 1 } },
            { id: 'b', text: 'Sim: três AZs equivalem a três Regiões.', correct: false, consequence: 'AZs ficam na mesma Região; a falha regional derruba todas.' },
            { id: 'c', text: 'Sim: o RDS Multi-AZ também guarda uma cópia em outra Região.', correct: false, consequence: 'O standby do Multi-AZ fica em outra AZ da mesma Região.' },
          ],
          justification: {
            prompt: 'Qual é a diferença central?',
            options: [
              { id: 'j1', text: 'Alta disponibilidade (AZs) cobre falhas dentro da Região; recuperação de desastres (outra Região) cobre a perda da Região.', correct: true, feedback: 'Isso: são fronteiras de falha diferentes.' },
              { id: 'j2', text: 'Alta disponibilidade é para bancos; recuperação de desastres é para servidores.', correct: false, feedback: 'As duas valem para qualquer componente.' },
            ],
          },
        },
      ],
      debrief: {
        takeaways: ['Um componente esquecido numa AZ só (banco, NAT) vira ponto único de falha.', 'Static stability é manter capacidade de sobra já rodando, para que perder uma AZ não dependa de criar instâncias às pressas.', 'Multi-AZ protege contra a queda de uma zona, mas não substitui a recuperação de desastres (DR): não cobre a perda da Região, um deploy ruim nem dados corrompidos.'],
      },
    },
    // -----------------------------------------------------------------------
    {
      id: 'fnd.f01.m3',
      title: 'Perto da cidade',
      type: 'mission',
      summary: 'Quando uma Local Zone compensa — e quando não.',
      briefing: {
        company: 'Estúdio Quadro a Quadro',
        role: 'Você cuida da infraestrutura de um estúdio de animação.',
        situation: 'Os artistas trabalham em estações virtuais e ficam numa metrópole a mais de mil quilômetros da Região mais próxima. Cada pincelada atrasa. O resto do sistema (renderização noturna, cobrança) não tem pressa.',
        objective: 'Decidir o que vai para uma Local Zone e o que fica na Região.',
        successCriteria: ['Comparar implantação regional e Local Zone', 'Diferenciar Local Zone de AZ'],
      },
      intel: [
        { conceptId: 'infra.local-zones', body: ['A **Local Zone** estende a Região até perto de uma cidade. Você a **habilita**, cria uma **subnet** nela e lança recursos. Casos citados pela AWS: jogos em tempo real, transmissão ao vivo, AR/VR e **estações de trabalho virtuais**.', 'Ela oferece um **subconjunto** dos serviços, com preços próprios; os planos de controle ficam na Região-mãe.'] },
      ],
      activities: [
        {
          id: 'fnd.f01.m3.a1',
          kind: 'decision',
          title: 'Onde ficam as estações dos artistas?',
          prompt: 'As estações virtuais exigem latência de um dígito de milissegundos para os artistas da metrópole. Pela Região, a latência medida pela equipe é de cerca de 40 ms (premissa do cenário). O que fazer?',
          concepts: [{ id: 'infra.local-zones' }],
          xp: 50,
          difficulty: 2,
          explanation: ['A latência é o requisito dominante e só ela justifica a Local Zone. Os componentes sem pressa ficam na Região, que tem todos os serviços e preços de referência.'],
          options: [
            { id: 'a', text: 'Colocar só as estações virtuais numa Local Zone dessa metrópole; renderização e cobrança ficam na Região.', correct: true, consequence: 'Os artistas ganham resposta imediata; o resto aproveita a gama completa de serviços da Região.', impacts: { desempenho: 2, custo: -1 } },
            { id: 'b', text: 'Levar o sistema inteiro para a Local Zone.', correct: false, consequence: 'Paga preços de Local Zone e esbarra em serviços que ela não oferece, sem ganho para quem não precisa de latência.', impacts: { custo: -2 } },
            { id: 'c', text: 'Manter tudo na Região e comprar máquinas mais potentes.', correct: false, consequence: 'Potência não reduz a distância: a latência de rede continua.', impacts: { desempenho: -1 } },
            { id: 'd', text: 'Usar Wavelength, que é a opção de menor latência.', correct: false, consequence: 'Wavelength atende dispositivos na rede 5G de uma operadora, não estações em banda larga fixa de um escritório.' },
          ],
          justification: {
            prompt: 'Quando a Local Zone compensa?',
            options: [
              { id: 'j1', text: 'Quando a latência para usuários de uma metrópole é o requisito dominante e os serviços necessários existem na Local Zone.', correct: true, feedback: 'Isso: a Local Zone resolve distância, não substitui a Região.' },
              { id: 'j2', text: 'Sempre, porque é mais barata que a Região.', correct: false, feedback: 'Os preços são diferentes dos da Região-mãe, e a gama de serviços é menor.' },
            ],
          },
        },
        {
          id: 'fnd.f01.m3.a2',
          kind: 'classify',
          title: 'AZ ou Local Zone?',
          prompt: 'A que tipo de zona cada afirmação se aplica?',
          concepts: [{ id: 'infra.local-zones' }, { id: 'infra.az', weight: 0.5 }],
          xp: 40,
          difficulty: 2,
          explanation: ['As duas recebem subnets da mesma VPC, mas têm papéis diferentes: AZs formam o núcleo resiliente da Região; Local Zones levam parte dos serviços para perto de uma cidade.'],
          bins: [
            { id: 'az', label: 'Availability Zone' },
            { id: 'lz', label: 'Local Zone' },
            { id: 'both', label: 'As duas' },
          ],
          items: [
            { id: 'i1', text: 'Precisa ser habilitada na conta antes do uso', bin: 'lz', explanation: 'As Local Zones são habilitadas; as AZs de uma Região habilitada já estão disponíveis.', concepts: ['infra.local-zones'] },
            { id: 'i2', text: 'Oferece a gama completa de serviços da Região', bin: 'az', explanation: 'A Local Zone tem um subconjunto de serviços.', concepts: ['infra.local-zones'] },
            { id: 'i3', text: 'Pode receber subnets de uma VPC da Região', bin: 'both', explanation: 'A VPC se estende a AZs e Local Zones.', concepts: ['infra.local-zones'] },
            { id: 'i4', text: 'Fica perto de um grande centro urbano, longe do núcleo da Região', bin: 'lz', explanation: 'É a razão de existir da Local Zone.', concepts: ['infra.local-zones'] },
            { id: 'i5', text: 'Tem geradores e refrigeração não compartilhados com as outras zonas do núcleo da Região, a até ~100 km delas', bin: 'az', explanation: 'Descrição das AZs no whitepaper de fronteiras de isolamento.', concepts: ['infra.az'] },
          ],
        },
      ],
      debrief: { takeaways: ['Uma Local Zone leva parte da Região para perto de uma metrópole: a latência cai, mas só um subconjunto dos serviços está disponível.', 'Coloque nela só o que precisa de latência.'] },
    },
    // -----------------------------------------------------------------------
    {
      id: 'fnd.f01.m4',
      title: 'Na rede da operadora',
      type: 'mission',
      summary: 'Wavelength: a borda das redes 5G — e o que ela não é.',
      briefing: {
        company: 'Rota Viva Mobilidade',
        role: 'Você avalia propostas de arquitetura para uma empresa de mobilidade urbana.',
        situation: 'Há ideias de todo tipo: um app de realidade aumentada para celulares, sensores nos ônibus ligados por 5G, um painel administrativo e relatórios noturnos. Um fornecedor quer colocar tudo em Wavelength.',
        objective: 'Separar o que precisa da rede da operadora do que não precisa.',
        successCriteria: ['Classificar cargas entre Wavelength, Local Zone e Região', 'Explicar por que Wavelength não é outra Região'],
      },
      intel: [
        { conceptId: 'infra.wavelength', body: ['**Wavelength Zones** ficam **dentro da rede da operadora**. O tráfego dos dispositivos móveis chega pelo **carrier gateway**, sem atravessar a internet até a Região. Cada zona é uma extensão lógica de uma Região.', 'O carrier gateway **não aceita conexões de entrada vindas da internet**.'] },
      ],
      activities: [
        {
          id: 'fnd.f01.m4.a1',
          kind: 'classify',
          title: 'Quem vai para onde?',
          prompt: 'Classifique cada carga pela infraestrutura que atende ao seu requisito dominante.',
          concepts: [{ id: 'infra.wavelength' }, { id: 'infra.local-zones', weight: 0.5 }],
          xp: 50,
          difficulty: 2,
          explanation: ['Wavelength é para dispositivos na rede da operadora com latência ultrabaixa. Usuários de banda larga numa cidade pedem Local Zone. O que não tem pressa fica na Região.'],
          bins: [
            { id: 'wl', label: 'Wavelength Zone' },
            { id: 'lz', label: 'Local Zone' },
            { id: 'reg', label: 'Região' },
          ],
          items: [
            { id: 'ar', text: 'Realidade aumentada no celular, na rede 5G da operadora parceira', bin: 'wl', explanation: 'Dispositivos móveis da operadora, latência ultrabaixa: o caso clássico de Wavelength.', concepts: ['infra.wavelength'] },
            { id: 'sens', text: 'Sensores dos ônibus, ligados por 5G, que precisam de resposta em milissegundos', bin: 'wl', explanation: 'O tráfego nasce na rede da operadora.', concepts: ['infra.wavelength'] },
            { id: 'live', text: 'Transmissão ao vivo interativa para usuários de uma cidade, em banda larga fixa', bin: 'lz', explanation: 'Usuários de uma metrópole fora da rede móvel: Local Zone.', concepts: ['infra.local-zones'] },
            { id: 'painel', text: 'Painel administrativo usado no escritório', bin: 'reg', explanation: 'Sem requisito de latência extrema: a Região oferece tudo.', concepts: ['infra.wavelength'] },
            { id: 'rel', text: 'Relatórios noturnos de faturamento', bin: 'reg', explanation: 'Processamento em lote não ganha nada com a borda.', concepts: ['infra.wavelength'] },
          ],
        },
        {
          id: 'fnd.f01.m4.a2',
          kind: 'decision',
          title: '"Wavelength é só mais uma Região"',
          prompt: 'O fornecedor diz: "Wavelength é só mais uma Região, mais perto do usuário; podemos colocar o site público lá e acessá-lo pela internet". O que está errado?',
          concepts: [{ id: 'infra.wavelength' }],
          xp: 40,
          difficulty: 2,
          explanation: ['Uma Wavelength Zone é uma extensão de uma Região dentro da rede de uma operadora. Ela atende dispositivos dessa rede; o carrier gateway não aceita conexões de entrada vindas da internet.'],
          options: [
            { id: 'a', text: 'Wavelength Zone é uma extensão da Região na rede da operadora; ela atende dispositivos dessa rede e não recebe conexões de entrada da internet pelo carrier gateway.', correct: true, consequence: 'O site público fica na Região (com CloudFront, se for o caso); só a parte móvel sensível à latência vai para Wavelength.' },
            { id: 'b', text: 'Nada: Wavelength é uma Região menor e serve qualquer usuário.', correct: false, consequence: 'Usuários de fora da rede da operadora não seriam atendidos como o fornecedor imagina.' },
            { id: 'c', text: 'Só o preço: Wavelength é mais cara.', correct: false, consequence: 'O problema é de arquitetura, não de preço.' },
          ],
        },
      ],
      debrief: { takeaways: ['Wavelength serve a aplicações usadas por dispositivos móveis: os servidores ficam dentro da rede da operadora, mais perto deles.', 'Uma Wavelength Zone não é uma Região: é uma extensão de uma Região existente.'] },
    },
    // -----------------------------------------------------------------------
    {
      id: 'fnd.f01.m5',
      title: 'Dentro da fábrica',
      type: 'mission',
      summary: 'AWS Outposts: serviços AWS no local do cliente, com dependência da Região.',
      briefing: {
        company: 'Laticínios Serra Azul',
        role: 'Você lidera a transformação digital de uma indústria de alimentos.',
        situation: 'Câmeras inspecionam embalagens na linha de produção. Cada imagem precisa ser analisada em milissegundos, e a produção não pode parar se o link de internet da fábrica oscilar. A equipe quer as mesmas ferramentas e APIs que usa na AWS.',
        objective: 'Escolher entre Região, Local Zone e Outposts — e entender o que acontece quando a fábrica perde a conexão.',
        successCriteria: ['Justificar a escolha pela necessidade de processamento local', 'Saber o que continua e o que falha sem o service link'],
      },
      intel: [
        { conceptId: 'infra.outposts', body: ['O **Outposts** instala racks ou servidores da AWS **no local do cliente**. A AWS opera o hardware como parte de uma Região, com as mesmas APIs. O cliente fornece espaço, energia e rede.'] },
        { conceptId: 'infra.outposts-service-link', body: ['O **service link** liga o Outpost à Região. Se ele cai, as instâncias **continuam rodando** e acessíveis pela rede local, mas **iniciar, parar e criar recursos falha** até a conexão voltar. Não é uma Região privada.'] },
      ],
      activities: [
        {
          id: 'fnd.f01.m5.a1',
          kind: 'decision',
          title: 'Região, Local Zone ou Outposts?',
          prompt: 'Onde rodar a análise das imagens da linha de produção?',
          concepts: [{ id: 'infra.outposts' }, { id: 'infra.local-zones', weight: 0.5 }],
          xp: 50,
          difficulty: 2,
          explanation: ['O requisito dominante é processar dentro da fábrica, perto das câmeras, mesmo com o link oscilando. Só o Outposts coloca a capacidade AWS no local. Local Zone e Região continuam fora da fábrica.'],
          options: [
            { id: 'a', text: 'AWS Outposts na fábrica, com service link redundante até a Região.', correct: true, consequence: 'A análise roda no local; a equipe usa as mesmas APIs da AWS. Em troca, a fábrica cuida do espaço, da energia e da rede, e a gestão depende do service link.', impacts: { desempenho: 2, disponibilidade: 1, custo: -1 } },
            { id: 'b', text: 'Uma Local Zone na cidade mais próxima.', correct: false, consequence: 'Fica mais perto que a Região, mas ainda fora da fábrica: cada imagem atravessa o link que oscila.', impacts: { disponibilidade: -1 } },
            { id: 'c', text: 'A Região, com uma conexão de internet melhor.', correct: false, consequence: 'A produção continuaria dependendo da rede externa a cada imagem.', impacts: { disponibilidade: -2 } },
          ],
          justification: {
            prompt: 'O que o Outposts não é?',
            options: [
              { id: 'j1', text: 'Não é uma Região privada: o plano de controle fica na Região, e a gestão depende do service link.', correct: true, feedback: 'Isso. Por isso a AWS pede conexões redundantes e static stability.' },
              { id: 'j2', text: 'Não é gerenciado pela AWS: o cliente mantém o hardware.', correct: false, feedback: 'O hardware é da AWS e operado por ela; o cliente cuida do local.' },
            ],
          },
        },
        {
          id: 'fnd.f01.m5.a2',
          kind: 'classify',
          title: 'O link caiu',
          prompt: 'O service link da fábrica caiu por duas horas. O que continua funcionando e o que falha até a conexão voltar?',
          concepts: [{ id: 'infra.outposts-service-link' }],
          xp: 40,
          difficulty: 2,
          explanation: ['Durante a desconexão, instâncias seguem rodando e acessíveis pelo Local Gateway. Operações de mutação, o plano de controle e a telemetria dependem da Região e falham (métricas ficam em spool por curtos períodos).'],
          bins: [
            { id: 'ok', label: 'Continua funcionando' },
            { id: 'fail', label: 'Falha até reconectar' },
          ],
          items: [
            { id: 'run', text: 'Instâncias que já estavam rodando', bin: 'ok', explanation: 'Continuam executando.', concepts: ['infra.outposts-service-link'] },
            { id: 'lgw', text: 'Acesso das câmeras às instâncias pela rede local (Local Gateway)', bin: 'ok', explanation: 'O tráfego local não depende da Região.', concepts: ['infra.outposts-service-link'] },
            { id: 'start', text: 'Iniciar uma instância nova ou parar uma existente', bin: 'fail', explanation: 'É uma operação de mutação: depende do plano de controle na Região.', concepts: ['infra.outposts-service-link'] },
            { id: 'cw', text: 'Métricas chegando ao CloudWatch em tempo real', bin: 'fail', explanation: 'A telemetria falha; as métricas ficam em spool local por curtos períodos e são enviadas depois.', concepts: ['infra.outposts-service-link'] },
            { id: 'rec', text: 'Auto recovery reiniciando uma instância cujo servidor falhou', bin: 'fail', explanation: 'O auto recovery exige o service link conectado.', concepts: ['infra.outposts-service-link'] },
          ],
        },
      ],
      debrief: { takeaways: ['O Outposts coloca hardware da AWS no local do cliente, e a AWS o opera como parte de uma Região.', 'Se o service link cair, o que já está rodando continua; o que depende da Região (criar, iniciar ou parar recursos) falha até a conexão voltar.'] },
    },
    // -----------------------------------------------------------------------
    {
      id: 'fnd.f01.m6',
      title: 'Da origem até a borda',
      type: 'mission',
      summary: 'Edge locations, Regional Edge Caches, CloudFront, Route 53 e Global Accelerator.',
      briefing: {
        company: 'Sabor de Casa',
        role: 'Você mantém um site de receitas com milhões de leitoras.',
        situation: 'O site está num bucket S3 em us-east-1, longe das leitoras no Brasil. As imagens são lentas e caras de servir. Alguém configurou o CloudFront às pressas: as respostas de `/api/favoritos` (diferentes para cada pessoa) estão em cache e as imagens não.',
        objective: 'Entender o caminho de uma requisição pela borda e corrigir o cache.',
        successCriteria: ['Colocar em ordem o caminho de uma requisição: usuário, POP, REC e origem', 'Nunca fazer cache de respostas personalizadas', 'Destaques atualizados em até 5 minutos', 'Reduzir as idas à origem'],
      },
      intel: [
        { conceptId: 'edge.pop', visual: 'edge-flow', body: ['No CloudFront, **POP e edge location são o mesmo papel**: o local que atende o usuário. O DNS manda cada pessoa ao POP de menor latência. A borda **não é Região nem AZ**: ela entrega e guarda cópias, não roda o sistema inteiro.'] },
        { conceptId: 'edge.regional-edge-cache', body: ['O **Regional Edge Cache** (REC) fica entre os POPs e a origem e guarda mais arquivos, por mais tempo. Quando o POP não tem o arquivo pedido, ele pergunta ao REC; se o REC também não tiver, o pedido segue até a origem. Requisições que alteram dados (**POST, PUT, DELETE**) e **conteúdo dinâmico** vão do POP direto à origem.'] },
        { conceptId: 'edge.route53', body: ['O **Route 53** é o DNS da AWS: registra domínios, responde às consultas de nomes e verifica a saúde dos endpoints. O **Global Accelerator** oferece endereços IP fixos, anunciados em vários pontos da borda (anycast), e leva conexões TCP/UDP pela rede da AWS até endpoints nas Regiões. Ele **não faz cache**.'] },
      ],
      activities: [
        {
          id: 'fnd.f01.m6.a1',
          kind: 'order',
          title: 'O caminho de um miss',
          prompt: 'Uma leitora pede uma imagem que ainda não está em nenhum cache. Ordene o que acontece.',
          concepts: [{ id: 'edge.pop' }, { id: 'edge.regional-edge-cache' }],
          xp: 40,
          difficulty: 1,
          explanation: ['O DNS leva a pessoa ao POP mais próximo. O POP não tem a imagem e pergunta ao REC, que também não tem; então o pedido vai até a origem. Na volta, a resposta fica guardada no REC e no POP, e a próxima pessoa daquela região recebe a imagem direto do POP.'],
          steps: [
            { id: 's1', text: 'O DNS encaminha a leitora ao POP de menor latência', explanation: 'É assim que o CloudFront escolhe a edge location.' },
            { id: 's2', text: 'O POP procura a imagem no seu cache e não encontra', explanation: 'Quando o POP não encontra o arquivo no próprio cache, dizemos que houve uma falta no cache (cache miss).' },
            { id: 's3', text: 'O POP pergunta ao Regional Edge Cache, que também não tem', explanation: 'O REC é a camada intermediária.' },
            { id: 's4', text: 'O pedido vai à origem (o bucket S3)', explanation: 'Só agora a origem trabalha.' },
            { id: 's5', text: 'A imagem volta e é guardada no REC e no POP', explanation: 'Os próximos pedidos param antes da origem.' },
          ],
        },
        {
          id: 'fnd.f01.m6.a2',
          kind: 'match',
          title: 'Cada peça no seu papel',
          prompt: 'Associe cada componente à sua função.',
          concepts: [{ id: 'edge.cloudfront' }, { id: 'edge.route53' }, { id: 'edge.global-accelerator' }, { id: 'edge.pop', weight: 0.5 }],
          xp: 50,
          difficulty: 2,
          explanation: ['CloudFront entrega e guarda conteúdo; o POP é onde o usuário é atendido; o REC é a camada de cache maior; o Route 53 resolve nomes e verifica saúde; o Global Accelerator dá IPs fixos e rota pela rede da AWS, sem cache.'],
          leftLabel: 'Componentes',
          rightLabel: 'Funções',
          pairs: [
            { id: 'p1', left: 'Amazon CloudFront', right: 'CDN: entrega conteúdo com cache perto dos usuários', explanation: 'O serviço que usa POPs e RECs.', concepts: ['edge.cloudfront'] },
            { id: 'p2', left: 'Edge location (POP)', right: 'Onde o usuário é atendido e o conteúdo popular fica em cache', explanation: 'POP e edge location: o mesmo papel no CloudFront.', concepts: ['edge.pop'] },
            { id: 'p3', left: 'Regional Edge Cache', right: 'Cache maior entre os POPs e a origem', explanation: 'Guarda o que perdeu popularidade nos POPs.', concepts: ['edge.regional-edge-cache'] },
            { id: 'p4', left: 'Amazon Route 53', right: 'DNS, registro de domínios e verificações de saúde', explanation: 'Também roteia por latência, geolocalização e failover.', concepts: ['edge.route53'] },
            { id: 'p5', left: 'AWS Global Accelerator', right: 'IPs estáticos anycast e rota pela rede da AWS, sem cache', explanation: 'Bom para TCP/UDP e failover entre Regiões.', concepts: ['edge.global-accelerator'] },
          ],
        },
        {
          id: 'fnd.f01.m6.a3',
          kind: 'lab',
          lab: 'edge',
          title: 'Corrija o cache',
          prompt: 'Ajuste os comportamentos de cache e observe na linha do tempo quem responde a cada requisição.',
          concepts: [{ id: 'edge.cloudfront' }, { id: 'edge.regional-edge-cache', weight: 0.5 }],
          xp: 120,
          difficulty: 2,
          hints: ['Respostas personalizadas (/api/) nunca devem ir para o cache.', 'Para os destaques, um TTL curto ou a invalidação a cada atualização limita o tempo com dado velho.'],
          explanation: [
            'Uma solução: `/api/*` sem cache; `/destaques.json` com TTL de 1 minuto (ou TTL longo com invalidação a cada atualização); demais caminhos (imagens) com TTL de 1 dia.',
            'As imagens passam a sair do POP — ou do REC, depois que o POP as descarta por pouco uso — e a origem só trabalha no primeiro acesso.',
          ],
          config: EDGE_LAB,
        },
        {
          id: 'fnd.f01.m6.a4',
          kind: 'predict',
          title: 'Uma hora depois',
          prompt: 'Uma imagem foi buscada uma vez e guardada com TTL de 1 dia. Ninguém a pediu por mais de uma hora, e o POP descarta objetos parados há mais de 30 minutos (premissa do cenário). Quem responde ao próximo pedido?',
          concepts: [{ id: 'edge.regional-edge-cache' }],
          xp: 30,
          difficulty: 2,
          explanation: ['O POP descartou a imagem por pouco uso, mas o Regional Edge Cache, maior, ainda a guarda dentro do TTL: a origem não é acionada.'],
          spec: {
            sim: 'edge',
            setup: EDGE_SETUP,
            behaviors: CACHE_ALL,
            events: [
              { at: 0, kind: 'request', method: 'GET', path: '/img/pudim.jpg' },
              { at: 4000, kind: 'request', method: 'GET', path: '/img/pudim.jpg' },
            ],
          },
          options: HOPS,
        },
      ],
      debrief: { takeaways: ['POP e edge location são dois nomes para o mesmo lugar; o Regional Edge Cache fica entre os POPs e a origem.', 'Cache longo para o estático, nenhum cache para o personalizado.', 'Global Accelerator não faz cache.'] },
    },
    // -----------------------------------------------------------------------
    {
      id: 'fnd.f01.boss',
      title: 'Escolhendo a infraestrutura adequada',
      type: 'boss',
      summary: 'Oito cenários, uma arquitetura híbrida e o requisito dominante de cada um.',
      briefing: {
        company: 'Consultoria Horizonte',
        role: 'Você atua em arquitetura de soluções numa consultoria e recebe pedidos de clientes muito diferentes.',
        situation: 'Cada cliente chega com uma "solução" já escolhida. Algumas funcionam, outras são exageradas, outras simplesmente não resolvem o problema.',
        objective: 'Identificar o requisito dominante de cada caso e a infraestrutura que o atende com menos custo e complexidade.',
        successCriteria: ['Associar os 8 cenários', 'Posicionar os componentes de uma arquitetura híbrida', 'Justificar um trade-off'],
      },
      intel: [],
      activities: [
        {
          id: 'fnd.f01.boss.a1',
          kind: 'lab',
          lab: 'placement',
          title: 'Oito clientes, oito requisitos',
          prompt: 'Posicione cada cenário na opção de infraestrutura que atende ao seu requisito dominante. Mais de uma pode parecer possível: escolha a que resolve com menos custo e complexidade.',
          concepts: [{ id: 'infra.multi-az' }, { id: 'infra.ha-vs-dr' }, { id: 'infra.local-zones' }, { id: 'infra.wavelength' }, { id: 'infra.outposts' }, { id: 'edge.cloudfront' }, { id: 'edge.global-accelerator' }],
          xp: 160,
          difficulty: 3,
          hints: ['Qual é a única coisa que o cliente não pode abrir mão? Comece por ela.', 'Uma opção que atende, mas com muito mais custo e complexidade, vale só metade.'],
          explanation: ['ERP e loja: várias AZs. Jogo UDP global: Global Accelerator. Estações na metrópole: Local Zone. AR em 5G: Wavelength. Fábrica: Outposts. Portal de notícias: CloudFront. Banco com DR: Multi-Região.'],
          config: { items: SCENARIOS, options: ALL_OPTIONS, itemsLabel: 'Cenários' },
        },
        {
          id: 'fnd.f01.boss.a2',
          kind: 'lab',
          lab: 'placement',
          title: 'A arquitetura da Arena Zero',
          prompt: 'Um estúdio de jogos quer uma arquitetura híbrida. Posicione cada componente onde ele deve rodar.',
          concepts: [{ id: 'infra.local-zones' }, { id: 'infra.rds-multi-az' }, { id: 'edge.cloudfront' }, { id: 'infra.wavelength' }, { id: 'infra.ha-vs-dr' }],
          xp: 120,
          difficulty: 3,
          explanation: ['Cada componente vai para onde está o seu requisito: partidas na Local Zone, contas em várias AZs, trailers no CloudFront, modo 5G em Wavelength, cópia para DR em outra Região. As opções se combinam numa mesma arquitetura.'],
          config: { items: COMPONENTS, options: ['multi-az', 'multi-region', 'local-zone', 'wavelength', 'outposts', 'cloudfront'], itemsLabel: 'Componentes' },
        },
        {
          id: 'fnd.f01.boss.a3',
          kind: 'decision',
          title: 'O cliente que quer tudo na borda',
          prompt: 'O CTO da Arena Zero propõe: "Já que a Local Zone tem latência baixa, vamos colocar o sistema inteiro nela — banco de contas inclusive — e dispensar a Região". Qual é a melhor resposta?',
          concepts: [{ id: 'infra.local-zones' }, { id: 'infra.multi-az', weight: 0.5 }],
          xp: 60,
          difficulty: 3,
          explanation: ['A Local Zone é uma zona única, perto de uma cidade, com subconjunto de serviços e planos de controle na Região-mãe. O banco precisa de várias AZs para alta disponibilidade, e o sistema continua dependendo da Região.'],
          options: [
            { id: 'a', text: 'Manter na Local Zone só o que precisa de latência (servidor de partidas); banco e demais serviços ficam em várias AZs da Região.', correct: true, consequence: 'Baixa latência onde importa, alta disponibilidade onde importa, sem pagar preço de borda pelo resto.', impacts: { desempenho: 1, disponibilidade: 1, custo: 1 } },
            { id: 'b', text: 'Aceitar: a Local Zone é uma Região menor.', correct: false, consequence: 'O banco ficaria numa zona só, sem a resiliência de várias AZs, e com dependência da Região-mãe mesmo assim.', impacts: { disponibilidade: -2 } },
            { id: 'c', text: 'Colocar tudo em Wavelength, que tem latência ainda menor.', correct: false, consequence: 'Wavelength atende dispositivos na rede da operadora, não o sistema inteiro.', impacts: { disponibilidade: -1 } },
          ],
          justification: {
            prompt: 'Qual princípio orienta a decisão?',
            options: [
              { id: 'j1', text: 'Cada componente vai para onde está o seu requisito dominante; opções de borda complementam a Região, não a substituem.', correct: true, feedback: 'Exato: cada parte da solução fica onde o seu requisito principal é atendido, e a Região continua no centro.' },
              { id: 'j2', text: 'Quanto mais perto do usuário, melhor para todos os componentes.', correct: false, feedback: 'Proximidade não resolve disponibilidade, custo nem disponibilidade de serviços.' },
            ],
          },
        },
      ],
      debrief: {
        takeaways: ['Identifique o requisito dominante antes da tecnologia.', 'Exagero também é erro: custo e complexidade contam.', 'Borda, Local Zone, Wavelength e Outposts complementam a Região.'],
      },
    },
  ],
}
