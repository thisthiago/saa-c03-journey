/**
 * Fase 5 — Elastic Load Balancing. Escolher o tipo de balanceador, montar as
 * regras do ALB e entender como o tráfego se divide entre as AZs.
 */
import type { PhaseDef } from '../../../../../engine/types'
import type { LbLabConfig } from '../../../../../simulators/loadbalancer/lab'
import type { HttpRequest, Listener } from '../../../../../simulators/loadbalancer/model'
import { META } from '../meta'

const rq = (id: string, label: string, host: string, path: string, extra: Partial<HttpRequest> = {}): HttpRequest => ({ id, label, host, path, method: 'GET', sourceIp: '198.51.100.20', ...extra })

const RULES_LAB: LbLabConfig = {
  targetGroups: [
    { id: 'web', label: 'site (web)' },
    { id: 'api', label: 'API de pedidos' },
    { id: 'admin', label: 'painel administrativo' },
  ],
  conditions: [
    { id: 'api', label: 'caminho /api/*', condition: { type: 'path-pattern', values: ['/api/*'] } },
    { id: 'admin-host', label: 'host admin.paodequeijo.com', condition: { type: 'host-header', values: ['admin.paodequeijo.com'] } },
    { id: 'office', label: 'IP de origem 10.0.0.0/8 (escritório pela VPN)', condition: { type: 'source-ip', values: ['10.0.0.0/8'] } },
    { id: 'old', label: 'caminho /promocao-antiga*', condition: { type: 'path-pattern', values: ['/promocao-antiga*'] } },
    { id: 'img', label: 'caminho /imagens/*', condition: { type: 'path-pattern', values: ['/imagens/*'] } },
    { id: 'post', label: 'método POST', condition: { type: 'http-request-method', values: ['POST'] } },
  ],
  actions: [
    { id: 'web', label: 'encaminhar para o site (web)', action: { type: 'forward', targetGroups: [{ id: 'web', weight: 1 }] } },
    { id: 'api', label: 'encaminhar para a API de pedidos', action: { type: 'forward', targetGroups: [{ id: 'api', weight: 1 }] } },
    { id: 'admin', label: 'encaminhar para o painel administrativo', action: { type: 'forward', targetGroups: [{ id: 'admin', weight: 1 }] } },
    { id: 'redirect', label: 'redirecionar para /promocoes', action: { type: 'redirect', to: '/promocoes' } },
    { id: 'deny', label: 'responder 403', action: { type: 'fixed-response', status: 403 } },
  ],
  maxRules: 5,
  initialDefault: 'web',
  tests: [
    { id: 't1', request: rq('t1', 'Cliente vê os produtos', 'paodequeijo.com', '/produtos'), expect: 'web', why: 'O que não casa com nenhuma regra fica com a regra padrão: o site.', concepts: ['elb.listener-rules'] },
    { id: 't2', request: rq('t2', 'Aplicativo consulta pedidos', 'paodequeijo.com', '/api/pedidos'), expect: 'api', why: 'Tudo em /api/* vai para a API.', concepts: ['elb.listener-rules'] },
    { id: 't3', request: rq('t3', 'Aplicativo cria um pedido', 'paodequeijo.com', '/api/pedidos', { method: 'POST' }), expect: 'api', why: 'O método não importa: o caminho /api/* já decide.', concepts: ['elb.listener-rules'] },
    { id: 't4', request: rq('t4', 'Gerente no escritório abre o painel', 'admin.paodequeijo.com', '/painel', { sourceIp: '10.2.3.4' }), expect: 'admin', why: 'Host do painel e IP do escritório: as duas condições casam.', concepts: ['elb.listener-rules'] },
    { id: 't5', request: rq('t5', 'Alguém de fora tenta abrir o painel', 'admin.paodequeijo.com', '/painel'), expect: 'fixed:403', why: 'O painel só abre do escritório: de fora, resposta 403. Esta regra precisa vir depois da regra do escritório.', concepts: ['elb.listener-rules'] },
    { id: 't6', request: rq('t6', 'Link velho de uma campanha', 'paodequeijo.com', '/promocao-antiga-natal'), expect: 'redirect', why: 'Links antigos são redirecionados para /promocoes.', concepts: ['elb.listener-rules'] },
  ],
  solution: {
    defaultActionId: 'web',
    rules: [
      { id: 's1', priority: 10, conditionIds: ['admin-host', 'office'], actionId: 'admin' },
      { id: 's2', priority: 20, conditionIds: ['admin-host'], actionId: 'deny' },
      { id: 's3', priority: 30, conditionIds: ['api'], actionId: 'api' },
      { id: 's4', priority: 40, conditionIds: ['old'], actionId: 'redirect' },
    ],
  },
}

const PRIORITY: Listener = {
  rules: [
    { id: 'all-api', priority: 10, conditions: [{ type: 'path-pattern', values: ['/api/*'] }], action: { type: 'forward', targetGroups: [{ id: 'v1', weight: 1 }] } },
    { id: 'api-v2', priority: 20, conditions: [{ type: 'path-pattern', values: ['/api/v2/*'] }], action: { type: 'forward', targetGroups: [{ id: 'v2', weight: 1 }] } },
  ],
  defaultAction: { type: 'forward', targetGroups: [{ id: 'web', weight: 1 }] },
}

const ROUTE_OPTIONS = [
  { id: 'v1', text: 'API versão 1', outcome: 'v1' },
  { id: 'v2', text: 'API versão 2', outcome: 'v2' },
  { id: 'web', text: 'Site (regra padrão)', outcome: 'web' },
]

const SHARE_OPTIONS = [
  { id: '10', text: '10% do tráfego', outcome: '10' },
  { id: '25', text: '25% do tráfego', outcome: '25' },
  { id: '6', text: '6,25% do tráfego', outcome: '6.25' },
  { id: '50', text: '50% do tráfego', outcome: '50' },
]

export const F05_CMP: PhaseDef = {
  ...META.f05,
  concepts: ['elb.alb', 'elb.nlb', 'elb.gwlb', 'elb.listener-rules', 'elb.target-groups', 'elb.health-checks', 'elb.cross-zone', 'elb.scheme', 'elb.stickiness', 'infra.alb-zones'],
  availability: 'available',
  simplifications: [
    'O laboratório tem um listener HTTPS com até cinco regras; certificados, autenticação e transformações de URL ficam de fora.',
    'Na distribuição entre AZs, todos os alvos estão saudáveis e cada nó do balanceador recebe a mesma parte do tráfego.',
  ],
  missions: [
    // -----------------------------------------------------------------------
    {
      id: 'cmp.f05.m1',
      title: 'Qual balanceador?',
      type: 'mission',
      summary: 'ALB, NLB e GWLB: camada 7, camada 4 e appliances.',
      briefing: {
        company: 'Pão de Queijo Online',
        role: 'Você é a pessoa de infraestrutura de uma rede de padarias que vende pela internet.',
        situation: 'A loja virtual, o aplicativo do motoboy (UDP), a integração com um banco que exige IP fixo e o firewall que a auditoria pediu vão ganhar balanceadores. O time quer saber se "um ALB para tudo" resolve.',
        objective: 'Escolher o balanceador certo para cada necessidade.',
        successCriteria: ['Classificar cada necessidade num tipo de balanceador', 'Saber quando o TLS deve ser decifrado no servidor', 'Separar balanceador interno de internet-facing'],
      },
      intel: [
        { conceptId: 'elb.alb', body: ['**ALB**: camada 7 (HTTP e HTTPS). Roteia por caminho, host, cabeçalho e outros atributos da requisição, redireciona e pode chamar uma função Lambda. Exige pelo menos duas AZs.'] },
        { conceptId: 'elb.nlb', body: ['**NLB**: camada 4 (TCP, UDP, TLS), para milhões de requisições por segundo, com **IP estático por AZ**. Com TCP na 443, passa o TLS direto para o servidor (passthrough).'] },
        { conceptId: 'elb.gwlb', body: ['**GWLB**: camada 3, para colocar **appliances de terceiros** (firewalls, IDS e IPS) no caminho do tráfego, de forma transparente, com o protocolo GENEVE.'] },
        { conceptId: 'elb.scheme', body: ['**Internet-facing**: nós com IP público, recebem da internet. **Interno**: só IP privado, para quem está na VPC. Nos dois casos, os alvos recebem por IP privado e não precisam de IP público.'] },
      ],
      activities: [
        {
          id: 'cmp.f05.m1.a1',
          kind: 'classify',
          title: 'Um balanceador para cada caso',
          prompt: 'Classifique cada necessidade no balanceador que a atende.',
          concepts: [{ id: 'elb.alb' }, { id: 'elb.nlb' }, { id: 'elb.gwlb' }],
          xp: 50,
          difficulty: 2,
          explanation: ['Rota por conteúdo HTTP: ALB. Desempenho em camada 4, UDP, IP fixo e passthrough TLS: NLB. Appliances de rede no caminho: GWLB.'],
          bins: [
            { id: 'alb', label: 'ALB' },
            { id: 'nlb', label: 'NLB' },
            { id: 'gwlb', label: 'GWLB' },
          ],
          items: [
            { id: 'path', text: 'Mandar /api/* para um serviço e o resto para o site', bin: 'alb', explanation: 'Rota por caminho é camada 7: ALB.', concepts: ['elb.alb'] },
            { id: 'lambda', text: 'Chamar uma função Lambda para a página de rastreio', bin: 'alb', explanation: 'Só o ALB tem Lambda como alvo.', concepts: ['elb.alb'] },
            { id: 'udp', text: 'Receber a posição dos motoboys por UDP', bin: 'nlb', explanation: 'UDP é camada 4: NLB.', concepts: ['elb.nlb'] },
            { id: 'ip', text: 'Dar ao banco parceiro um IP fixo para liberar no firewall dele', bin: 'nlb', explanation: 'O NLB tem um IP estático por AZ, com Elastic IP opcional.', concepts: ['elb.nlb'] },
            { id: 'fw', text: 'Passar todo o tráfego por um firewall virtual de um fabricante', bin: 'gwlb', explanation: 'Appliances de terceiros no caminho do tráfego: GWLB.', concepts: ['elb.gwlb'] },
          ],
        },
        {
          id: 'cmp.f05.m1.a2',
          kind: 'decision',
          title: 'Quem decifra o TLS?',
          prompt: 'A integração com o banco exige que o TLS seja decifrado **só no servidor da padaria**: o balanceador não pode ver o conteúdo. Qual configuração atende?',
          concepts: [{ id: 'elb.nlb' }],
          xp: 40,
          difficulty: 3,
          explanation: ['Com um listener TCP na porta 443, o NLB repassa o tráfego cifrado sem decifrar. O ALB termina o TLS no listener HTTPS.'],
          options: [
            { id: 'a', text: 'NLB com listener TCP na 443, repassando o tráfego cifrado aos servidores', correct: true, consequence: 'O certificado fica só no servidor, que decifra o tráfego.' },
            { id: 'b', text: 'ALB com listener HTTPS e certificado no balanceador', correct: false, consequence: 'O ALB decifra o tráfego no listener, o que a integração não aceita.' },
            { id: 'c', text: 'GWLB na frente dos servidores', correct: false, consequence: 'O GWLB é para appliances de rede, não para entregar a aplicação.' },
          ],
        },
        {
          id: 'cmp.f05.m1.a3',
          kind: 'decision',
          title: 'Entre as camadas',
          prompt: 'Os servidores web chamam os servidores de aplicação, que nunca devem ser alcançados pela internet. Que balanceador vai na frente dos servidores de aplicação?',
          concepts: [{ id: 'elb.scheme' }],
          xp: 30,
          difficulty: 2,
          explanation: ['Um balanceador interno só tem IPs privados e atende quem está na VPC. É o desenho de camadas que a documentação descreve: internet-facing na frente da web, interno na frente da aplicação.'],
          options: [
            { id: 'a', text: 'Um balanceador interno, com IPs privados', correct: true, consequence: 'Só os servidores web, na VPC, alcançam os servidores de aplicação.' },
            { id: 'b', text: 'Um balanceador internet-facing com um security group restrito', correct: false, consequence: 'Funcionaria, mas expõe nós com IP público sem necessidade.' },
            { id: 'c', text: 'Nenhum: os servidores web chamam o IP público de cada servidor de aplicação', correct: false, consequence: 'Expõe os servidores de aplicação e quebra quando um deles é trocado.' },
          ],
        },
      ],
      debrief: { takeaways: ['HTTP com regras: ALB. Camada 4, UDP, IP fixo ou passthrough: NLB. Appliances: GWLB.', 'O NLB com TCP na 443 deixa o TLS para o servidor.', 'Camada interna atrás de um balanceador interno.'] },
    },
    // -----------------------------------------------------------------------
    {
      id: 'cmp.f05.m2',
      title: 'As regras do listener',
      type: 'mission',
      summary: 'Prioridade, condições e ações: monte as regras de um ALB.',
      briefing: {
        company: 'Pão de Queijo Online',
        role: 'Você continua na infraestrutura da padaria.',
        situation: 'Um único ALB vai atender o site, a API do aplicativo e o painel administrativo, que só pode abrir a partir do escritório. Links velhos de campanhas precisam ir para a página de promoções.',
        objective: 'Montar as regras para cada requisição chegar ao lugar certo.',
        successCriteria: ['Todas as requisições de teste no destino certo', 'Prioridades na ordem certa', 'Nenhuma regra que a AWS recusaria'],
      },
      intel: [
        { conceptId: 'elb.listener-rules', visual: 'alb-rules', body: ['As regras são avaliadas da **menor prioridade para a maior**; a primeira que casa decide. Numa regra, **todas** as condições precisam casar. A **regra padrão** vale quando nenhuma casa. Ações: encaminhar, redirecionar ou responder sozinho.'] },
        { conceptId: 'elb.target-groups', body: ['Cada **target group** reúne alvos de um mesmo serviço: instâncias, IPs privados ou uma função Lambda. O health check é configurado por target group.'] },
      ],
      activities: [
        {
          id: 'cmp.f05.m2.a1',
          kind: 'lab',
          lab: 'load-balancer',
          title: 'Um ALB, três serviços',
          prompt: 'Monte as regras do listener. A tabela de testes mostra, ao vivo, para onde cada requisição vai.',
          concepts: [{ id: 'elb.listener-rules' }, { id: 'elb.target-groups', weight: 0.5 }],
          xp: 120,
          difficulty: 3,
          hints: ['A regra mais específica precisa de prioridade menor: o painel do escritório antes do painel de fora.', 'O link antigo e a API não dependem do host.'],
          explanation: ['Prioridade 10: host do painel e IP do escritório, encaminha ao painel. Prioridade 20: só o host do painel, responde 403. Prioridade 30: /api/*, encaminha à API. Prioridade 40: /promocao-antiga*, redireciona. Padrão: site.'],
          config: RULES_LAB,
        },
        {
          id: 'cmp.f05.m2.a2',
          kind: 'predict',
          title: 'A regra que nunca casa',
          prompt: 'Um colega criou duas regras: prioridade **10** com caminho `/api/*` para a API versão 1, e prioridade **20** com caminho `/api/v2/*` para a versão 2. Para onde vai `GET /api/v2/catalogo`?',
          concepts: [{ id: 'elb.listener-rules' }],
          xp: 40,
          difficulty: 2,
          explanation: ['A regra de prioridade 10 é avaliada primeiro, e /api/* também casa com /api/v2/catalogo. A regra da versão 2 nunca é alcançada: a regra mais específica precisa de prioridade menor.'],
          spec: { sim: 'alb-route', listener: PRIORITY, request: rq('p1', 'catálogo v2', 'paodequeijo.com', '/api/v2/catalogo'), groups: { v1: 'API versão 1', v2: 'API versão 2', web: 'site' } },
          options: ROUTE_OPTIONS,
        },
      ],
      debrief: { takeaways: ['A primeira regra que casa decide: as específicas vêm antes.', 'Condições de uma regra combinam com E.', 'A regra padrão pega o resto.'] },
    },
    // -----------------------------------------------------------------------
    {
      id: 'cmp.f05.m3',
      title: 'Saúde e zonas',
      type: 'mission',
      summary: 'Health checks, deregistration delay, cross-zone e sticky sessions.',
      briefing: {
        company: 'Pão de Queijo Online',
        role: 'Você continua na infraestrutura da padaria.',
        situation: 'O NLB da integração tem 2 servidores numa AZ e 8 na outra. Os dois da primeira AZ vivem sobrecarregados. E o time do site quer que o carrinho "não suma" quando o cliente cai em outro servidor.',
        objective: 'Prever para onde vai o tráfego e garantir que só servidores saudáveis recebam requisições.',
        successCriteria: ['Prever a parte do tráfego de cada servidor', 'Configurar health checks e saída de servidores', 'Saber quando sticky sessions ajudam'],
      },
      intel: [
        { conceptId: 'elb.cross-zone', visual: 'elb-cross-zone', body: ['Cada AZ tem um **nó**; o DNS reparte o tráfego por igual entre os nós. **Com cross-zone**, cada nó distribui entre todos os alvos; **sem**, só entre os da sua AZ. ALB: sempre ligado. NLB e GWLB: desligado por padrão.'] },
        { conceptId: 'elb.health-checks', body: ['O balanceador só envia tráfego a alvos **saudáveis**. No ALB, por padrão, GET em / a cada 30 s; 2 falhas tiram o alvo, 5 sucessos o devolvem. Ao sair, o **deregistration delay** (300 s) deixa as requisições em andamento terminarem.'] },
        { conceptId: 'elb.stickiness', body: ['**Sticky sessions** mandam um cliente sempre ao mesmo alvo, por cookie. Ajudam quando a sessão fica na memória do servidor; guardar a sessão fora do servidor dispensa esse recurso.'] },
        { conceptId: 'infra.alb-zones', body: ['O ALB exige pelo menos duas AZs. Alvos numa AZ que não está habilitada no balanceador não recebem tráfego.'] },
      ],
      activities: [
        {
          id: 'cmp.f05.m3.a1',
          kind: 'predict',
          title: 'Os dois sobrecarregados',
          prompt: 'O NLB tem **2 servidores na AZ a e 8 na AZ b**, com cross-zone **desligado** (o padrão do NLB). Que parte do tráfego total **cada servidor da AZ a** recebe?',
          concepts: [{ id: 'elb.cross-zone' }],
          xp: 40,
          difficulty: 2,
          explanation: ['Cada nó recebe metade do tráfego. Sem cross-zone, o nó da AZ a divide a sua metade entre 2 servidores: 25% para cada. Os 8 da AZ b ficam com 6,25% cada.'],
          spec: { sim: 'cross-zone', targetsByAz: { a: 2, b: 8 }, crossZone: false, az: 'a' },
          options: SHARE_OPTIONS,
        },
        {
          id: 'cmp.f05.m3.a2',
          kind: 'predict',
          title: 'Ligando o cross-zone',
          prompt: 'Com o cross-zone **ligado** no mesmo NLB, que parte do tráfego total cada servidor da AZ a recebe?',
          concepts: [{ id: 'elb.cross-zone' }],
          xp: 40,
          difficulty: 2,
          explanation: ['Com cross-zone, cada nó distribui entre os 10 servidores das duas AZs: 10% para cada.'],
          spec: { sim: 'cross-zone', targetsByAz: { a: 2, b: 8 }, crossZone: true, az: 'a' },
          options: SHARE_OPTIONS,
        },
        {
          id: 'cmp.f05.m3.a3',
          kind: 'decision',
          title: 'Atualização sem erro',
          prompt: 'Ao remover servidores do site para atualizar, alguns clientes recebem erro no meio do pagamento, que leva até 2 minutos. O que evita isso?',
          concepts: [{ id: 'elb.health-checks' }],
          xp: 40,
          difficulty: 2,
          explanation: ['Durante o deregistration delay (300 s por padrão), o alvo para de receber requisições novas e termina as que estão em andamento. Se ele encerra a conexão antes, o cliente recebe um erro 5xx.'],
          options: [
            { id: 'a', text: 'Desregistrar o servidor do target group e esperar o deregistration delay antes de desligá-lo', correct: true, consequence: 'Os pagamentos em andamento terminam antes que o servidor saia.' },
            { id: 'b', text: 'Desligar o servidor direto: o health check tira ele do balanceador', correct: false, consequence: 'As requisições em andamento morrem, e o health check leva duas falhas para tirar o alvo.' },
            { id: 'c', text: 'Zerar o deregistration delay para a troca ser mais rápida', correct: false, consequence: 'O alvo sai na hora e os pagamentos em andamento falham.' },
          ],
        },
        {
          id: 'cmp.f05.m3.a4',
          kind: 'decision',
          title: 'O carrinho que some',
          prompt: 'O site guarda o carrinho na memória de cada servidor. Quando o cliente cai em outro servidor, o carrinho some. Qual é a correção mais rápida no balanceador e qual é a melhor a longo prazo?',
          concepts: [{ id: 'elb.stickiness' }],
          xp: 30,
          difficulty: 2,
          explanation: ['Sticky sessions resolvem já, mantendo o cliente no mesmo servidor. A longo prazo, guardar a sessão fora do servidor deixa a carga se distribuir melhor e tolera a troca de servidores.'],
          options: [
            { id: 'a', text: 'Ligar sticky sessions agora e, depois, guardar o carrinho fora do servidor', correct: true, consequence: 'O problema some já, e o site fica pronto para crescer.' },
            { id: 'b', text: 'Desligar o cross-zone', correct: false, consequence: 'Sticky sessions nem funcionam com cross-zone desligado no target group, e o cliente continua mudando de servidor.' },
            { id: 'c', text: 'Trocar o ALB por um NLB', correct: false, consequence: 'Muda de camada sem resolver onde a sessão está guardada.' },
          ],
        },
      ],
      debrief: { takeaways: ['Sem cross-zone, poucos alvos numa AZ recebem tráfego demais.', 'O deregistration delay deixa as requisições em andamento terminarem.', 'Sticky sessions remendam sessão na memória; o certo é guardá-la fora do servidor.'] },
    },
    // -----------------------------------------------------------------------
    {
      id: 'cmp.f05.boss',
      title: 'Tráfego desigual',
      type: 'boss',
      summary: 'Metade dos servidores sofre e a outra metade fica ociosa. Por quê?',
      briefing: {
        company: 'Jogos Pixel Brasil',
        role: 'Você foi chamado por um estúdio de jogos online.',
        situation: 'O servidor de partidas usa um NLB com UDP. Depois de uma migração, os jogadores reclamam de atraso, mas o painel mostra a frota com metade da CPU ociosa.',
        objective: 'Achar a causa e corrigir sem trocar de balanceador.',
        successCriteria: ['Apontar as evidências', 'Identificar a causa', 'Escolher as correções'],
      },
      intel: [
        { conceptId: 'elb.cross-zone', body: ['No NLB, o cross-zone vem **desligado**: cada nó só usa os alvos da sua AZ, e o tráfego chega a cada AZ em partes iguais.'] },
        { conceptId: 'elb.nlb', body: ['O NLB é a escolha para UDP e para desempenho em camada 4.'] },
      ],
      activities: [
        {
          id: 'cmp.f05.boss.a1',
          kind: 'investigate',
          title: 'O painel dos servidores',
          prompt: 'Examine a configuração e as métricas.',
          concepts: [{ id: 'elb.cross-zone' }, { id: 'elb.nlb', weight: 0.5 }],
          xp: 90,
          difficulty: 3,
          explanation: ['Na migração, 3 servidores ficaram na AZ a e 9 na AZ b. Com cross-zone desligado, cada AZ recebe metade do tráfego: os 3 da AZ a dividem 50% (16,7% cada) e os 9 da AZ b dividem 50% (5,6% cada).'],
          artifacts: [
            {
              id: 'cfg',
              title: 'Configuração',
              format: 'table',
              lines: [
                { id: 'c1', text: 'NLB · listener UDP 7777 · AZs habilitadas: a e b', isIssue: false, explanation: 'NLB com UDP é a escolha certa para partidas.' },
                { id: 'c2', text: 'cross-zone load balancing: desligado (padrão)', isIssue: true, explanation: 'Cada nó só usa os servidores da própria AZ.' },
                { id: 'c3', text: 'target group: 3 servidores na AZ a, 9 na AZ b', isIssue: true, explanation: 'A divisão desigual pesa porque o cross-zone está desligado.' },
              ],
            },
            {
              id: 'metrics',
              title: 'CloudWatch, 21h',
              format: 'log',
              lines: [
                { id: 'm1', text: 'AZ a · 3 servidores · CPU média 92%', isIssue: true, explanation: 'Poucos servidores recebem metade do tráfego.' },
                { id: 'm2', text: 'AZ b · 9 servidores · CPU média 31%', isIssue: true, explanation: 'Muitos servidores dividem a outra metade.' },
                { id: 'm3', text: 'HealthyHostCount = 12 · UnHealthyHostCount = 0', isIssue: false, explanation: 'Todos os servidores estão saudáveis: não é falha de health check.' },
              ],
            },
          ],
          rootCause: {
            prompt: 'Qual é a causa?',
            options: [
              { id: 'r1', text: 'Com cross-zone desligado, cada AZ recebe metade do tráfego, e a AZ a tem só 3 dos 12 servidores', correct: true, feedback: 'Isso: 16,7% do tráfego para cada servidor da AZ a, contra 5,6% na AZ b.' },
              { id: 'r2', text: 'Os servidores da AZ a são de um tipo menor', correct: false, feedback: 'A configuração não indica tipos diferentes; a divisão do tráfego explica a diferença.' },
              { id: 'r3', text: 'O health check está tirando servidores da AZ b', correct: false, feedback: 'Os 12 estão saudáveis.' },
            ],
          },
          remediations: {
            prompt: 'Quais correções resolvem? (selecione todas as adequadas)',
            options: [
              { id: 'f1', text: 'Ligar o cross-zone no NLB', correct: true, feedback: 'Cada nó passa a distribuir entre os 12 servidores: cerca de 8,3% para cada.' },
              { id: 'f2', text: 'Equilibrar os servidores: 6 em cada AZ', correct: true, feedback: 'Com o mesmo número por AZ, cada servidor recebe a mesma parte, mesmo sem cross-zone.' },
              { id: 'f3', text: 'Trocar o NLB por um ALB', correct: false, feedback: 'O ALB não atende UDP.' },
              { id: 'f4', text: 'Desabilitar a AZ a no NLB', correct: false, feedback: 'Os 3 servidores dela deixariam de receber tráfego, e o jogo perderia a tolerância à falha de uma AZ.' },
            ],
          },
        },
        {
          id: 'cmp.f05.boss.a2',
          kind: 'predict',
          title: 'Depois da correção',
          prompt: 'Com o cross-zone ligado e os mesmos **3 servidores na AZ a e 9 na AZ b**, que parte do tráfego cada servidor da AZ a recebe, arredondando?',
          concepts: [{ id: 'elb.cross-zone' }],
          xp: 40,
          difficulty: 2,
          explanation: ['Com cross-zone, cada servidor recebe 1/12 do tráfego, cerca de 8,33%.'],
          spec: { sim: 'cross-zone', targetsByAz: { a: 3, b: 9 }, crossZone: true, az: 'a' },
          options: [
            { id: 'a', text: 'Cerca de 8,33%', outcome: '8.33' },
            { id: 'b', text: 'Cerca de 16,7%', outcome: '16.67' },
            { id: 'c', text: 'Cerca de 5,6%', outcome: '5.56' },
            { id: 'd', text: '50%', outcome: '50' },
          ],
        },
      ],
      debrief: { takeaways: ['No NLB e no GWLB, o cross-zone vem desligado.', 'Sem cross-zone, distribua os alvos por igual entre as AZs.', 'Métricas por AZ revelam distribuição desigual.'] },
    },
  ],
}
