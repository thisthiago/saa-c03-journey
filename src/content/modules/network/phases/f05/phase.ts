/**
 * Fase 5 — Acesso privado a serviços. Endpoints de gateway, endpoints de
 * interface (PrivateLink), DNS privado, política de endpoint, serviço de
 * endpoint e o custo do NAT comparado com os endpoints.
 */
import type { PhaseDef } from '../../../../../engine/types'
import type { EndpointsLabConfig } from '../../../../../simulators/endpoints/lab'
import { META } from '../meta'
import { ENDPOINT_SERVICE, GATEWAY_ROUTE, INTERFACE_ZONES, PATHS_BOARD } from './diagrams'

const S3_ROUTES = [
  { destination: '10.60.0.0/16', target: 'local' },
  { destination: '0.0.0.0/0', target: 'nat' },
  { destination: 'pl-s3', target: 'vpce-s3', kind: 'prefix-list' as const },
]
const S3_PREFIXES = { 'pl-s3': ['52.216.0.0/15', '3.5.0.0/19'] }

export const VALOR_CERTO_ENDPOINTS: EndpointsLabConfig = {
  workloads: [
    { id: 'backup', name: 'Backups noturnos', description: 'Os servidores da VPC copiam **3.000 GB por mês** para o S3. Hoje, o tráfego passa pelo NAT Gateway, que existe só para isso.', service: 's3', gbMonth: 3000, azs: 2, concepts: ['pl.gateway-endpoint', 'pl.nat-vs-endpoint'] },
    { id: 'filas', name: 'Fila de ordens', description: 'O sistema de ordens troca **800 GB por mês** com o SQS, em duas zonas. O NAT Gateway já existe para outros usos.', service: 'sqs', gbMonth: 800, azs: 2, natShared: true, concepts: ['pl.interface-endpoint', 'pl.nat-vs-endpoint'] },
    { id: 'escritorio', name: 'Relatórios do escritório', description: 'O escritório, ligado por VPN, envia **500 GB por mês** de relatórios para o S3 passando pela VPC.', service: 's3', gbMonth: 500, azs: 2, fromOnPrem: true, concepts: ['pl.gateway-endpoint', 'pl.interface-endpoint'] },
    { id: 'segredos', name: 'Leitura de segredos', description: 'A aplicação lê senhas do Secrets Manager: cerca de **1 GB por mês**, em duas zonas. O NAT Gateway já existe para outros usos, e a auditoria aceita que esse tráfego, cifrado, saia por ele.', service: 'secrets-manager', gbMonth: 1, azs: 2, natShared: true, concepts: ['pl.nat-vs-endpoint'] },
    { id: 'auditoria', name: 'Trilha de auditoria', description: 'O registro de operações grava **200 GB por mês** no DynamoDB, e a regra da corretora proíbe que esse tráfego passe pelo internet gateway.', service: 'dynamodb', gbMonth: 200, azs: 2, privateOnly: true, concepts: ['pl.gateway-endpoint'] },
  ],
}

export const F05_NET: PhaseDef = {
  ...META.f05,
  concepts: ['pl.gateway-endpoint', 'pl.interface-endpoint', 'pl.private-dns', 'pl.endpoint-policy', 'pl.endpoint-service', 'pl.nat-vs-endpoint'],
  availability: 'available',
  simplifications: ['O custo considera a hora e o GB processado de cada caminho; transferência para a internet e entre zonas fica fora.', 'Corretora, volumes e regras são fictícios.'],
  missions: [
    // -----------------------------------------------------------------------
    {
      id: 'net.f05.m1',
      title: 'O caminho até o S3',
      type: 'mission',
      summary: 'O endpoint de gateway, a rota com lista de prefixos e o custo do NAT.',
      briefing: {
        company: 'Corretora Valor Certo',
        role: 'Você revisa a rede de uma corretora de investimentos.',
        situation: 'A fatura do NAT Gateway cresceu muito. Quase todo o tráfego são backups indo para o S3. O escritório, ligado por VPN, também quer enviar relatórios ao S3 sem usar a internet.',
        objective: 'Tirar o tráfego do S3 do NAT e entender o limite do endpoint de gateway.',
        successCriteria: ['Prever o caminho com o endpoint de gateway', 'Saber quem não pode usar o endpoint de gateway'],
      },
      intel: [
        { conceptId: 'pl.gateway-endpoint', body: ['O **endpoint de gateway** do S3 e do DynamoDB entra como **rota** com a lista de prefixos do serviço e **não tem custo**. Só serve a quem está **dentro da VPC**.'], diagram: GATEWAY_ROUTE },
        { conceptId: 'pl.nat-vs-endpoint', body: ['Pelo **NAT Gateway**, cada GB paga processamento. Na tabela da trilha, US$ 0,045 por GB em us-east-1.'] },
      ],
      activities: [
        {
          id: 'net.f05.m1.a1',
          kind: 'predict',
          title: 'Para onde vai o backup',
          prompt: 'A tabela da sub-rede tem 0.0.0.0/0 para o NAT Gateway e a rota do endpoint de gateway do S3 (lista de prefixos pl-s3). Para onde vai um pacote destinado a 52.216.10.1, um endereço do S3 na Região?',
          concepts: [{ id: 'pl.gateway-endpoint' }],
          xp: 40,
          difficulty: 2,
          explanation: ['O endereço está na lista de prefixos do S3, mais específica que 0.0.0.0/0. O tráfego vai para o endpoint de gateway, sem passar pelo NAT.'],
          exhibits: [{ title: 'Tabela de rotas', code: '10.60.0.0/16  local\n0.0.0.0/0     nat\npl-s3         vpce-s3   (52.216.0.0/15, 3.5.0.0/19)' }],
          spec: { sim: 'route', routes: S3_ROUTES, destination: '52.216.10.1', prefixLists: S3_PREFIXES },
          options: [
            { id: 'a', text: 'Para o endpoint de gateway', outcome: 'vpce-s3' },
            { id: 'b', text: 'Para o NAT Gateway, que cobre toda a internet', outcome: 'nat' },
          ],
        },
        {
          id: 'net.f05.m1.a2',
          kind: 'decision',
          title: 'A fatura do NAT',
          prompt: 'Os backups mandam 3.000 GB por mês ao S3 pelo NAT Gateway. Como cortar esse custo sem expor nada?',
          concepts: [{ id: 'pl.nat-vs-endpoint' }, { id: 'pl.gateway-endpoint', weight: 0.5 }],
          xp: 50,
          difficulty: 2,
          explanation: ['O endpoint de gateway do S3 não tem custo e tira esse tráfego do NAT. Na tabela da trilha, os 3.000 GB custavam cerca de US$ 135 por mês só de processamento no NAT.'],
          options: [
            { id: 'a', text: 'Criar um endpoint de gateway do S3 e associá-lo às tabelas das sub-redes', correct: true, consequence: 'O tráfego do S3 deixa o NAT, e o processamento desses GB some da fatura.' },
            { id: 'b', text: 'Trocar o NAT Gateway por um maior', correct: false, consequence: 'Não existe NAT maior: ele escala sozinho, e a cobrança por GB continua.' },
            { id: 'c', text: 'Dar IP público aos servidores e sair pelo internet gateway', correct: false, consequence: 'Expõe os servidores e paga IPv4 público por hora.' },
            { id: 'd', text: 'Criar um endpoint de interface do S3 nas duas zonas', correct: false, consequence: 'Funciona e tira o tráfego do NAT, mas cobra por hora em cada zona e por GB, enquanto o de gateway não custa nada.' },
          ],
        },
        {
          id: 'net.f05.m1.a3',
          kind: 'decision',
          title: 'O escritório e o S3',
          prompt: 'O escritório chega à VPC por VPN e quer usar o endpoint de gateway do S3 para enviar relatórios. Funciona?',
          concepts: [{ id: 'pl.gateway-endpoint' }],
          xp: 50,
          difficulty: 3,
          explanation: ['O endpoint de gateway não atende quem vem da rede da empresa (VPN ou Direct Connect), de VPCs em peering nem do Transit Gateway. Para esses casos, use um endpoint de interface do S3.'],
          options: [
            { id: 'a', text: 'Não: para o escritório, é preciso um endpoint de interface do S3', correct: true, consequence: 'O endpoint de interface tem IPs privados que a rede da empresa alcança pela VPN.' },
            { id: 'b', text: 'Sim: basta uma rota no escritório para a lista de prefixos', correct: false, consequence: 'A conexão do endpoint de gateway não se estende para fora da VPC.' },
          ],
        },
      ],
      debrief: { takeaways: ['Endpoint de gateway: S3 e DynamoDB, sem custo, por rota.', 'A rota da lista de prefixos vence a 0.0.0.0/0.', 'Quem vem de fora da VPC precisa de endpoint de interface.'] },
    },
    // -----------------------------------------------------------------------
    {
      id: 'net.f05.m2',
      title: 'Outros serviços, sem internet',
      type: 'mission',
      summary: 'Endpoints de interface, DNS privado e política de endpoint.',
      briefing: {
        company: 'Corretora Valor Certo',
        role: 'Você tira da internet o tráfego dos demais serviços da AWS.',
        situation: 'A auditoria quer que o sistema de ordens fale com o SQS sem sair pela internet, e que, pela VPC, só os buckets da corretora possam ser acessados.',
        objective: 'Montar os endpoints de interface e limitar o que passa por eles.',
        successCriteria: ['Usar endpoint de interface com DNS privado', 'Evitar ponto único de falha', 'Limitar o acesso com política de endpoint'],
      },
      intel: [
        { conceptId: 'pl.interface-endpoint', body: ['O **endpoint de interface** usa o **AWS PrivateLink**: cria interfaces de rede com IP privado nas sub-redes, uma por zona escolhida. Cobra **por hora em cada zona** e **por GB**.'], diagram: INTERFACE_ZONES },
        { conceptId: 'pl.private-dns', body: ['Com **DNS privado**, o nome normal do serviço resolve para o endpoint dentro da VPC. A aplicação não muda.'] },
        { conceptId: 'pl.endpoint-policy', body: ['A **política de endpoint** limita o que passa por ele; a padrão permite tudo. Ela não substitui as outras políticas: o acesso só passa se a política de endpoint, a de identidade e a do recurso (como a do bucket) permitirem.'] },
      ],
      activities: [
        {
          id: 'net.f05.m2.a1',
          kind: 'decision',
          title: 'O SQS sem NAT',
          prompt: 'O sistema de ordens, numa sub-rede privada, precisa chamar o SQS pelo endereço de sempre, sem mudar o código e sem que o tráfego saia pela internet. O que criar?',
          concepts: [{ id: 'pl.interface-endpoint' }, { id: 'pl.private-dns' }],
          xp: 50,
          difficulty: 2,
          explanation: ['O SQS não tem endpoint de gateway. Um endpoint de interface com DNS privado faz o nome público do SQS resolver para IPs privados dentro da VPC.'],
          options: [
            { id: 'a', text: 'Um endpoint de interface do SQS com DNS privado ligado', correct: true, consequence: 'O código continua igual, e o tráfego fica dentro da rede da AWS.' },
            { id: 'b', text: 'Um endpoint de gateway do SQS', correct: false, consequence: 'Só o S3 e o DynamoDB têm endpoint de gateway.' },
            { id: 'c', text: 'Um endpoint de interface sem DNS privado, sem mudar nada no código', correct: false, consequence: 'Sem DNS privado, o nome padrão continua resolvendo para o endereço público do SQS, e o tráfego não passa pelo endpoint.' },
          ],
        },
        {
          id: 'net.f05.m2.a2',
          kind: 'decision',
          title: 'Uma zona só',
          prompt: 'Para economizar, o endpoint de interface do SQS foi criado só na zona A. O sistema de ordens roda nas zonas A e B. Qual é o risco?',
          concepts: [{ id: 'pl.interface-endpoint' }],
          xp: 40,
          difficulty: 2,
          explanation: ['Os recursos da zona B usam a interface da zona A. Se a zona A ficar indisponível, a zona B perde o acesso ao serviço. A AWS recomenda pelo menos duas zonas por endpoint em produção.'],
          options: [
            { id: 'a', text: 'Se a zona A cair, a zona B perde o acesso ao SQS', correct: true, consequence: 'O endpoint numa zona virou ponto único de falha.' },
            { id: 'b', text: 'A zona B não consegue usar o endpoint nem com a zona A funcionando', correct: false, consequence: 'Ela usa a interface da zona A, com tráfego entre zonas.' },
            { id: 'c', text: 'Nenhum: o endpoint de interface é regional', correct: false, consequence: 'As interfaces ficam nas sub-redes de cada zona escolhida.' },
          ],
        },
        {
          id: 'net.f05.m2.a3',
          kind: 'decision',
          title: 'Só os buckets da corretora',
          prompt: 'A auditoria quer que, pelo endpoint de gateway do S3, só os buckets da corretora possam ser acessados. Isso vale até para quem, de dentro da VPC, usar credenciais de outra conta, que dariam acesso aos buckets dessa outra conta. O que usar?',
          concepts: [{ id: 'pl.endpoint-policy' }],
          xp: 50,
          difficulty: 3,
          explanation: ['A política de endpoint é uma política de recurso no próprio endpoint. Ela pode permitir só os buckets da corretora; o resto é negado para quem passa pelo endpoint, qualquer que seja a credencial.'],
          options: [
            { id: 'a', text: 'Uma política de endpoint que permite só os buckets da corretora', correct: true, consequence: 'O que não está na política não passa pelo endpoint.' },
            { id: 'b', text: 'Deixar a política padrão: ela já restringe à conta', correct: false, consequence: 'A política padrão permite acesso total.' },
            { id: 'c', text: 'Um security group no endpoint de gateway', correct: false, consequence: 'O endpoint de gateway é uma rota, e não aceita security group.' },
          ],
        },
        {
          id: 'net.f05.m2.a5',
          kind: 'build',
          title: 'Os caminhos até os serviços',
          prompt: 'Coloque cada peça onde ela fica, para os servidores chegarem ao S3, ao DynamoDB e ao SQS sem passar pela internet. As peças que não existem ou não servem vão para "Não entra nesta rede".',
          scenario: ['As sub-redes privadas, uma em cada zona, usam a mesma tabela de rotas. Os servidores falam com o S3, o DynamoDB e o SQS, e o acesso ao SQS não pode parar se uma zona cair.'],
          concepts: [{ id: 'pl.gateway-endpoint' }, { id: 'pl.interface-endpoint' }],
          xp: 50,
          difficulty: 2,
          explanation: [
            'Os endpoints de gateway do S3 e do DynamoDB entram como rotas na tabela das sub-redes: não ocupam espaço nas sub-redes e não aceitam security group.',
            'O SQS só tem endpoint de interface, que põe uma interface de rede com IP privado em cada sub-rede escolhida. Com uma em cada zona, a queda de uma zona não corta o acesso.',
          ],
          board: PATHS_BOARD,
          pieces: [
            { id: 'gw-s3', text: 'Endpoint de gateway do S3', explanation: 'É um alvo de rota: entra na tabela de rotas com a lista de prefixos do S3, sem custo.', concepts: ['pl.gateway-endpoint'] },
            { id: 'gw-ddb', text: 'Endpoint de gateway do DynamoDB', explanation: 'Também é um alvo de rota, com a lista de prefixos do DynamoDB, sem custo.', concepts: ['pl.gateway-endpoint'] },
            { id: 'eni', text: 'Interface de rede do endpoint do SQS', count: 2, explanation: 'O endpoint de interface do SQS põe uma interface com IP privado em cada sub-rede escolhida. Uma em cada zona evita o ponto único de falha.', concepts: ['pl.interface-endpoint'] },
            { id: 'gw-sqs', text: 'Endpoint de gateway do SQS', explanation: 'Não existe: só o S3 e o DynamoDB têm endpoint de gateway.', concepts: ['pl.gateway-endpoint'] },
            { id: 'sg-gw', text: 'Security group para o endpoint de gateway do S3', explanation: 'O endpoint de gateway é só uma rota e não aceita security group. Para limitar o acesso, use a política de endpoint.', concepts: ['pl.gateway-endpoint'] },
          ],
          slots: [
            { id: 'rt', label: 'Tabela de rotas das sub-redes privadas', x: 30, y: 40, w: 480, h: 84, expect: { 'gw-s3': 1, 'gw-ddb': 1 }, explanation: 'A tabela recebe as rotas dos dois endpoints de gateway, uma para a lista de prefixos do S3 e outra para a do DynamoDB.' },
            { id: 'sa', label: 'Dentro da sub-rede privada A', x: 54, y: 192, w: 182, h: 150, expect: { eni: 1 }, explanation: 'A sub-rede A recebe uma interface do endpoint do SQS.' },
            { id: 'sb', label: 'Dentro da sub-rede privada B', x: 304, y: 192, w: 182, h: 150, expect: { eni: 1 }, explanation: 'A sub-rede B recebe a outra interface do endpoint do SQS, para o acesso não depender da zona a.' },
          ],
        },
      ],
      debrief: { takeaways: ['Outros serviços usam endpoint de interface, de preferência com DNS privado.', 'Endpoint em uma zona só é ponto único de falha.', 'A política de endpoint limita o que passa por ele.'] },
    },
    // -----------------------------------------------------------------------
    {
      id: 'net.f05.m3',
      title: 'Oferecer a própria API',
      type: 'mission',
      summary: 'Serviço de endpoint: o seu serviço para outras contas, pelo PrivateLink.',
      briefing: {
        company: 'Corretora Valor Certo',
        role: 'Você expõe a API de cotações para os clientes institucionais.',
        situation: 'Quarenta clientes institucionais querem consumir a API de cotações a partir das próprias VPCs, sem internet. Vários usam o mesmo bloco de endereços da corretora.',
        objective: 'Oferecer a API sem peering e sem expor a VPC.',
        successCriteria: ['Escolher o serviço de endpoint com Network Load Balancer'],
      },
      intel: [{ conceptId: 'pl.endpoint-service', body: ['Coloque a API atrás de um **Network Load Balancer** e crie um **serviço de endpoint**. Cada cliente cria um **endpoint de interface** na própria VPC. Blocos sobrepostos não atrapalham, e só o cliente inicia conexões.'], diagram: ENDPOINT_SERVICE }],
      activities: [
        {
          id: 'net.f05.m3.a1',
          kind: 'decision',
          title: 'Quarenta clientes',
          prompt: 'Como oferecer a API de cotações aos quarenta clientes, a partir das VPCs deles, sem internet e com blocos que se sobrepõem?',
          concepts: [{ id: 'pl.endpoint-service' }],
          xp: 60,
          difficulty: 2,
          explanation: ['O serviço de endpoint do PrivateLink usa um Network Load Balancer na frente da API. Cada cliente cria um endpoint de interface. Não há roteamento entre as VPCs, e por isso blocos sobrepostos não são problema.'],
          options: [
            { id: 'a', text: 'Serviço de endpoint com Network Load Balancer, consumido por endpoints de interface', correct: true, consequence: 'Cada cliente alcança só a API, sem enxergar a VPC da corretora.' },
            { id: 'b', text: 'Um peering entre a VPC da corretora e a de cada cliente', correct: false, consequence: 'Blocos sobrepostos impedem o peering, e o peering abre a VPC inteira.' },
            { id: 'c', text: 'A API num endereço público, liberada só para os IPs dos clientes', correct: false, consequence: 'O tráfego passa pela internet, o que os clientes não aceitam.' },
            { id: 'd', text: 'Um Transit Gateway compartilhado com os clientes pelo RAM', correct: false, consequence: 'O Transit Gateway roteia entre as redes: os blocos sobrepostos entram em conflito, e os clientes passam a enxergar a rede da corretora.' },
          ],
        },
        {
          id: 'net.f05.m3.a2',
          kind: 'match',
          title: 'Cada peça do PrivateLink',
          prompt: 'Associe cada peça ao seu papel.',
          concepts: [{ id: 'pl.endpoint-service' }, { id: 'pl.interface-endpoint' }, { id: 'pl.private-dns' }],
          xp: 50,
          difficulty: 2,
          explanation: ['Do lado do provedor ficam o Network Load Balancer e o serviço de endpoint. Do lado do consumidor, o endpoint de interface, e o DNS privado faz o nome do serviço apontar para ele.'],
          leftLabel: 'Peça',
          rightLabel: 'Papel',
          pairs: [
            { id: 'nlb', left: 'Network Load Balancer', right: 'Fica na frente da API, do lado do provedor', explanation: 'É a porta de entrada do serviço de endpoint.', concepts: ['pl.endpoint-service'] },
            { id: 'svc', left: 'Serviço de endpoint', right: 'Define quem pode se conectar à API', explanation: 'O provedor libera os clientes autorizados.', concepts: ['pl.endpoint-service'] },
            { id: 'ep', left: 'Endpoint de interface', right: 'Cria IPs privados na VPC do cliente para chegar à API', explanation: 'É o lado do consumidor.', concepts: ['pl.interface-endpoint'] },
            { id: 'dns', left: 'DNS privado', right: 'Faz o nome do serviço resolver para os IPs do endpoint dentro da VPC', explanation: 'A aplicação usa o nome de sempre.', concepts: ['pl.private-dns'] },
          ],
        },
      ],
      debrief: { takeaways: ['Para oferecer um serviço a outras contas sem abrir a VPC: serviço de endpoint com Network Load Balancer.', 'Blocos sobrepostos não atrapalham o PrivateLink.'] },
    },
    // -----------------------------------------------------------------------
    {
      id: 'net.f05.boss',
      title: 'Cada GB pelo caminho certo',
      type: 'boss',
      summary: 'Cinco cargas, cinco caminhos até os serviços da AWS.',
      briefing: {
        company: 'Corretora Valor Certo',
        role: 'Você fecha o projeto de acesso privado da corretora.',
        situation: 'Cinco cargas falam com serviços da AWS: backups, fila de ordens, relatórios do escritório, leitura de segredos e trilha de auditoria. Cada uma tem volume e regras próprios.',
        objective: 'Escolher o caminho de cada carga, cumprindo as regras pelo menor custo.',
        successCriteria: ['Nenhum caminho inválido', 'Menor custo em cada carga'],
      },
      intel: [
        { conceptId: 'pl.nat-vs-endpoint', body: ['Com pouco volume e um NAT que já existe, o NAT pode sair mais barato que pagar a hora de um endpoint em duas zonas. Faça a conta.'] },
        { conceptId: 'pl.gateway-endpoint', body: ['S3 e DynamoDB dentro da VPC: endpoint de gateway, sem custo.'] },
      ],
      activities: [
        {
          id: 'net.f05.boss.a1',
          kind: 'lab',
          lab: 'endpoints',
          title: 'Cinco caminhos',
          prompt: 'Para cada carga, escolha o caminho até o serviço. A tabela mostra quanto cada caminho custa por mês; depois da verificação, ela mostra também se o caminho serve.',
          concepts: [{ id: 'pl.gateway-endpoint' }, { id: 'pl.interface-endpoint' }, { id: 'pl.nat-vs-endpoint' }],
          xp: 200,
          difficulty: 3,
          hints: ['O escritório não usa o endpoint de gateway nem o NAT.', 'Para 1 GB por mês, a hora do endpoint em duas zonas pesa mais que o GB do NAT.'],
          explanation: [
            'Backups e auditoria: endpoint de gateway, sem custo e sem passar pelo internet gateway.',
            'Fila de ordens: endpoint de interface, que processa os 800 GB por menos que o NAT. Relatórios do escritório: endpoint de interface, o único que atende a VPN.',
            'Leitura de segredos: o NAT que já existe, porque 1 GB por mês custa menos que a hora do endpoint em duas zonas.',
          ],
          config: VALOR_CERTO_ENDPOINTS,
        },
      ],
      debrief: { takeaways: ['S3 e DynamoDB dentro da VPC: endpoint de gateway.', 'Muito volume para outros serviços ou acesso da empresa: endpoint de interface.', 'Pouco volume com NAT já existente: compare a hora do endpoint com o GB do NAT.'] },
    },
  ],
}
