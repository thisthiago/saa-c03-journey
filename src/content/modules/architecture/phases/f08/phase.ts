/** Fase 8 — Padrões de arquitetura e de implantação (empresa fictícia: Viagem Fácil, agência de viagens on-line). */
import type { PhaseDef } from '../../../../../engine/types'
import type { ArchitectureLabConfig } from '../../../../../simulators/architecture/lab'
import { META } from '../meta'

export const VIAGEM_PADROES: ArchitectureLabConfig = {
  title: 'Relatório da nova plataforma da Viagem Fácil',
  dimensions: [
    { id: 'resiliente', label: 'Resiliente', examDomain: 'd2' },
    { id: 'desempenho', label: 'Alto desempenho', examDomain: 'd3' },
    { id: 'custo', label: 'Custo otimizado', examDomain: 'd4' },
    { id: 'requisitos', label: 'Atendimento aos requisitos' },
  ],
  minDimension: 0.5,
  disclaimer: 'A rubrica e os pesos são pedagógicos, definidos pelo AWS Quest. Os fatos sobre padrões e implantações foram conferidos na documentação da AWS em 22/10/2026.',
  steps: [
    {
      id: 'legado',
      title: 'Sair do monólito',
      intro: 'O monólito de reservas da **Viagem Fácil** não aguenta os picos de promoção, e cada liberação leva semanas. A diretoria quer reconstruí-lo em serviços sem parar de vender e continuando a lançar novidades durante a troca.',
      questions: [
        {
          id: 'troca',
          prompt: 'Como trocar o monólito?',
          options: [
            { id: 'strangler', label: 'Proxy no API Gateway na frente do monólito, desviando cada função reescrita para um serviço novo', scores: { resiliente: 1, requisitos: 1, custo: 1 }, consequence: 'Cada função sai sem parar as vendas, e o monólito é desligado no fim.', concepts: ['pat.strangler-fig'] },
            { id: 'big-bang', label: 'Reescrever tudo e trocar num único fim de semana', scores: { resiliente: 0.3, requisitos: 0.3, custo: 0.6 }, consequence: 'Meses sem novidades e um corte de alto risco.', whyNot: 'Troca de uma vez só é o risco que o padrão evita.', concepts: ['pat.strangler-fig'] },
            { id: 'proxy-ec2', label: 'Proxy numa única instância EC2 na frente do monólito', scores: { resiliente: 0.4, requisitos: 0.8, custo: 0.8 }, consequence: 'A troca gradual funciona, mas o proxy vira ponto único de falha.', whyNot: 'Um proxy gerenciado e Multi-AZ evita o ponto único.', concepts: ['pat.strangler-fig', 'infra.spof'] },
          ],
        },
      ],
    },
    {
      id: 'servicos',
      title: 'Os serviços novos',
      intro: 'O serviço de **alertas de preço** recebe poucos pedidos de madrugada e picos enormes nas promoções. Quando uma reserva é confirmada, faturamento, e-mail e programa de pontos precisam reagir, e novos consumidores devem entrar sem mexer na reserva.',
      questions: [
        {
          id: 'alertas',
          prompt: 'Onde rodar os alertas de preço?',
          options: [
            { id: 'serverless', label: 'Lambda com API Gateway e DynamoDB', scores: { custo: 1, desempenho: 1, requisitos: 1 }, consequence: 'Escala nos picos sozinho e quase não custa de madrugada.', concepts: ['pat.serverless'] },
            { id: 'ec2-pico', label: 'Instâncias EC2 dimensionadas para o pico, ligadas o tempo todo', scores: { custo: 0.3, desempenho: 1, requisitos: 0.7 }, consequence: 'Paga o pico o mês inteiro.', whyNot: 'Carga irregular paga menos por uso.', concepts: ['pat.serverless', 'opt.serverless-vs-provisioned'] },
          ],
        },
        {
          id: 'reacoes',
          prompt: 'Como os outros serviços ficam sabendo da reserva confirmada?',
          options: [
            { id: 'eventos', label: 'A reserva publica o evento num barramento do EventBridge, e cada serviço tem a sua regra', scores: { resiliente: 1, requisitos: 1, desempenho: 1 }, consequence: 'Novos consumidores entram com uma regra, e a falha de um não trava os outros.', concepts: ['pat.event-driven', 'eb.bus'] },
            { id: 'chamadas', label: 'A reserva chama cada serviço em sequência e espera as respostas', scores: { resiliente: 0.4, requisitos: 0.5, desempenho: 0.6 }, consequence: 'Se o e-mail cai, a reserva espera ou falha, e cada consumidor novo exige mudar a reserva.', whyNot: 'Chamadas síncronas acoplam a reserva a todos.', concepts: ['pat.event-driven'] },
          ],
        },
      ],
    },
    {
      id: 'regioes',
      title: 'Clientes em dois continentes',
      intro: 'A empresa abriu na Europa. Os clientes de lá precisam de baixa latência para buscar e reservar, e cada Região deve aceitar reservas mesmo se a outra cair. O carrinho fica no DynamoDB.',
      questions: [
        {
          id: 'dados',
          prompt: 'Como organizar os dados do carrinho?',
          options: [
            { id: 'global-tables', label: 'Tabelas globais do DynamoDB, com cada Região gravando localmente', scores: { resiliente: 1, desempenho: 1, requisitos: 1 }, consequence: 'Cada continente lê e grava perto, e uma Região fora não para a outra.', concepts: ['pat.multi-region', 'ddb.global-tables'] },
            { id: 'uma-regiao', label: 'Uma Região só, com CloudFront na frente', scores: { resiliente: 0.4, desempenho: 0.6, requisitos: 0.4, custo: 1 }, consequence: 'As páginas ficam rápidas, mas as gravações atravessam o oceano e tudo para com a Região.', whyNot: 'O requisito é aceitar reservas com a outra Região fora.', concepts: ['pat.multi-region'] },
            { id: 'dependente', label: 'Aplicação nas duas Regiões, gravando sempre numa tabela da Região principal', scores: { resiliente: 0.3, desempenho: 0.5, requisitos: 0.3, custo: 0.9 }, consequence: 'A Europa depende da Região principal: se ela cai, a Europa para de reservar.', whyNot: 'Dependência entre Regiões enfraquece as duas.', concepts: ['pat.multi-region'] },
          ],
        },
      ],
    },
    {
      id: 'implantacao',
      title: 'Liberar sem medo',
      intro: 'As liberações de hoje são feitas por SSH nos servidores de produção, de uma vez. A última derrubou a busca por uma hora. A empresa quer liberar toda semana, testar a versão nova antes de receber clientes e voltar em segundos se algo der errado.',
      questions: [
        {
          id: 'deploy',
          prompt: 'Como liberar as versões?',
          options: [
            { id: 'blue-green', label: 'Blue/green com infraestrutura imutável: ambiente novo, testado, recebendo o tráfego pelo roteamento ponderado', scores: { resiliente: 1, requisitos: 1 }, consequence: 'A versão nova é testada antes, e a volta é mudar o tráfego para o ambiente antigo.', concepts: ['pat.blue-green', 'pat.immutable'] },
            { id: 'rolling', label: 'Rolling nos servidores atuais, um lote por vez', scores: { resiliente: 0.6, requisitos: 0.5, custo: 1 }, consequence: 'Mais rápido, mas sem isolamento entre as versões, e voltar exige outra implantação.', whyNot: 'O requisito é testar antes e voltar em segundos.', concepts: ['pat.in-place'] },
            { id: 'ssh', label: 'Continuar por SSH, com uma lista de verificação', scores: { resiliente: 0.2, requisitos: 0.2, custo: 1 }, consequence: 'Cada servidor fica um pouco diferente, e a próxima falha volta a derrubar tudo.', whyNot: 'Mudança no lugar, à mão, é o antipadrão da infraestrutura imutável.', concepts: ['pat.immutable'] },
          ],
        },
      ],
    },
  ],
  rules: [
    {
      id: 'acoplado',
      when: [
        ['reacoes', ['chamadas']],
        ['troca', ['big-bang']],
      ],
      penalty: { resiliente: 0.3 },
      message: 'Um corte de uma vez só e serviços que se chamam em sequência: qualquer falha na troca derruba a reserva inteira.',
      concepts: ['pat.strangler-fig', 'pat.event-driven'],
    },
    {
      id: 'pico-fixo',
      when: [
        ['alertas', ['ec2-pico']],
        ['deploy', ['ssh', 'rolling']],
      ],
      penalty: { custo: 0.2 },
      message: 'Frota fixa para o pico e liberações na própria frota: paga-se a capacidade máxima sem ganhar segurança nas mudanças.',
      concepts: ['pat.serverless', 'pat.in-place'],
    },
  ],
}

export const F08_ARQ: PhaseDef = {
  ...META.f08,
  concepts: ['pat.three-tier', 'pat.microservices', 'pat.serverless', 'pat.event-driven', 'int.choreography-orchestration', 'eb.bus', 'pat.strangler-fig', 'apigw.what', 'pat.multi-region', 'ddb.global-tables', 'pat.immutable', 'pat.in-place', 'pat.blue-green', 'pat.canary-linear', 'dns.weighted', 'cmp.beanstalk-deploy', 'opt.serverless-vs-provisioned', 'infra.spof'],
  availability: 'available',
  simplifications: ['A agência e os sistemas são fictícios.', 'A rubrica do chefe é pedagógica, definida pelo AWS Quest.'],
  missions: [
    // -----------------------------------------------------------------------
    {
      id: 'arq.f08.m1',
      title: 'Peças que se encaixam',
      type: 'mission',
      summary: 'Três camadas, microsserviços, serverless e eventos.',
      briefing: {
        company: 'Viagem Fácil',
        role: 'Você desenha a nova plataforma de uma agência de viagens on-line.',
        situation: 'Cada time defende um padrão: um quer três camadas, outro microsserviços, outro "tudo serverless". A diretoria quer entender quando cada um vale a pena.',
        objective: 'Reconhecer cada padrão e o caso que ele resolve.',
        successCriteria: ['Reconhecer cada padrão', 'Ligar o padrão à necessidade'],
      },
      intel: [{ conceptId: 'pat.three-tier' }, { conceptId: 'pat.microservices' }, { conceptId: 'pat.event-driven' }],
      activities: [
        {
          id: 'arq.f08.m1.a1',
          kind: 'match',
          title: 'Cada padrão no seu caso',
          prompt: 'Ligue cada necessidade da Viagem Fácil ao padrão de arquitetura.',
          concepts: [{ id: 'pat.microservices' }],
          xp: 60,
          difficulty: 2,
          explanation: ['Camadas separam apresentação, aplicação e dados; microsserviços separam funções e times; serverless tira os servidores; eventos desacoplam quem avisa de quem reage.'],
          leftLabel: 'Necessidade',
          rightLabel: 'Padrão',
          pairs: [
            { id: 'p1', left: 'Site tradicional com servidores web, aplicação e banco, cada parte protegida e escalando sozinha', right: 'Três camadas', explanation: 'Uma camada por função, cada uma em várias AZs.', concepts: ['pat.three-tier'] },
            { id: 'p2', left: 'Times diferentes liberando busca, pagamento e pontos em ritmos diferentes', right: 'Microsserviços', explanation: 'Cada serviço é liberado e escala sozinho.', concepts: ['pat.microservices'] },
            { id: 'p3', left: 'Gerar o voucher em PDF sob demanda, poucas vezes por hora', right: 'Serverless', explanation: 'Paga só quando roda.', concepts: ['pat.serverless'] },
            { id: 'p4', left: 'Vários sistemas reagindo a "reserva confirmada" sem que a reserva os conheça', right: 'Orientada a eventos', explanation: 'O emissor publica; os interessados reagem.', concepts: ['pat.event-driven'] },
          ],
        },
        {
          id: 'arq.f08.m1.a2',
          kind: 'decision',
          title: 'O novo consumidor',
          prompt: 'O time de fraude quer receber cada reserva confirmada. Hoje, a reserva publica o evento num barramento do EventBridge. O que fazer?',
          concepts: [{ id: 'pat.event-driven' }, { id: 'eb.bus', weight: 0.5 }],
          xp: 40,
          difficulty: 1,
          explanation: ['Na arquitetura orientada a eventos, um consumidor novo entra com uma regra no barramento, sem mexer no emissor.'],
          options: [
            { id: 'a', text: 'Criar uma regra no barramento que envia o evento ao serviço de fraude', correct: true, consequence: 'A reserva nem fica sabendo do novo consumidor.' },
            { id: 'b', text: 'Mudar a reserva para chamar também o serviço de fraude', correct: false, consequence: 'Acopla a reserva a mais um serviço.' },
            { id: 'c', text: 'O serviço de fraude consultar o banco de reservas a cada minuto', correct: false, consequence: 'Atrasa a análise e pesa no banco.' },
          ],
        },
        {
          id: 'arq.f08.m1.a3',
          kind: 'decision',
          title: 'Quem coordena a reserva?',
          prompt: 'A reserva tem passos que precisam de ordem e de desfazer: bloquear o voo, cobrar e emitir. Se a cobrança falhar, o bloqueio deve ser desfeito. O que usar?',
          concepts: [{ id: 'int.choreography-orchestration' }],
          xp: 50,
          difficulty: 2,
          explanation: ['Um fluxo com ordem e compensação fica mais claro orquestrado, com um coordenador como o Step Functions; coreografia combina com reações independentes.'],
          options: [
            { id: 'a', text: 'Orquestração com o Step Functions, com um passo de compensação para desfazer o bloqueio', correct: true, consequence: 'O fluxo fica visível, e a falha na cobrança desfaz o bloqueio.' },
            { id: 'b', text: 'Cada serviço reage a eventos dos outros, sem coordenador', correct: false, consequence: 'Funciona, mas a ordem e a compensação ficam espalhadas e difíceis de acompanhar.' },
            { id: 'c', text: 'Uma chamada síncrona encadeada entre os três serviços', correct: false, consequence: 'Qualquer lentidão trava a reserva inteira.' },
          ],
        },
      ],
      debrief: { takeaways: ['Cada padrão resolve um tipo de problema; nenhum serve para tudo.', 'Eventos para reações independentes; orquestração para passos com ordem e compensação.'] },
    },
    // -----------------------------------------------------------------------
    {
      id: 'arq.f08.m2',
      title: 'Trocar o legado aos poucos',
      type: 'mission',
      summary: 'Strangler fig e arquitetura em várias Regiões.',
      briefing: {
        company: 'Viagem Fácil',
        role: 'Você planeja a saída do monólito e a chegada à Europa.',
        situation: 'O monólito de reservas precisa ser substituído sem parar as vendas. Ao mesmo tempo, a empresa vai atender a Europa, e um consultor sugeriu duas Regiões "porque é mais moderno".',
        objective: 'Trocar o monólito com segurança e usar várias Regiões só se o requisito pedir.',
        successCriteria: ['Troca gradual, sem corte único', 'Várias Regiões só com motivo'],
      },
      intel: [{ conceptId: 'pat.strangler-fig' }, { conceptId: 'pat.multi-region' }],
      activities: [
        {
          id: 'arq.f08.m2.a1',
          kind: 'decision',
          title: 'Sem parar as vendas',
          prompt: 'O monólito de reservas vai virar serviços. As vendas não podem parar, e o negócio quer lançar novidades durante a troca. Como fazer?',
          concepts: [{ id: 'pat.strangler-fig' }],
          xp: 50,
          difficulty: 2,
          explanation: ['No strangler fig, um proxy na frente do monólito desvia cada função reescrita para o serviço novo; as novidades já nascem nos serviços.'],
          options: [
            { id: 'a', text: 'Um proxy na frente do monólito desviando cada função já reescrita para o serviço novo', correct: true, consequence: 'O monólito encolhe aos poucos, e as vendas continuam.' },
            { id: 'b', text: 'Congelar o monólito, reescrever tudo e trocar de uma vez', correct: false, consequence: 'Meses sem novidades e um corte arriscado.' },
            { id: 'c', text: 'Levar o monólito como está para a AWS e parar por aí', correct: false, consequence: 'Muda o lugar, mas não resolve os picos nem as liberações lentas.' },
          ],
        },
        {
          id: 'arq.f08.m2.a2',
          kind: 'decision',
          title: 'O proxy que pode cair',
          prompt: 'Todo o tráfego passa pelo proxy do strangler fig. Onde ele deve rodar?',
          concepts: [{ id: 'apigw.what' }, { id: 'pat.strangler-fig', weight: 0.5 }],
          xp: 40,
          difficulty: 2,
          explanation: ['O proxy pode virar ponto único de falha. O API Gateway é serverless e Multi-AZ, o que reduz esse risco.'],
          options: [
            { id: 'a', text: 'No Amazon API Gateway, gerenciado e Multi-AZ', correct: true, consequence: 'O proxy não vira o novo ponto único de falha.' },
            { id: 'b', text: 'Numa instância EC2 grande', correct: false, consequence: 'Se ela cair, caem o monólito e os serviços novos juntos.' },
            { id: 'c', text: 'Dentro do próprio monólito', correct: false, consequence: 'O desvio cai junto com o monólito que se quer substituir.' },
          ],
        },
        {
          id: 'arq.f08.m2.a3',
          kind: 'decision',
          title: 'Duas Regiões por moda?',
          prompt: 'O site de conteúdo de viagens tolera ficar fora algumas horas num desastre raro e precisa aguentar a queda de uma AZ. O consultor quer pô-lo em duas Regiões ativas. O que decidir?',
          concepts: [{ id: 'pat.multi-region' }],
          xp: 40,
          difficulty: 2,
          explanation: ['Implantar em várias Regiões quando várias AZs bastam é antipadrão: mais custo e complexidade sem requisito.'],
          options: [
            { id: 'a', text: 'Várias AZs numa Região, com backups copiados para outra', correct: true, consequence: 'Atende à meta sem pagar uma segunda Região ativa.' },
            { id: 'b', text: 'Duas Regiões ativas', correct: false, consequence: 'Funciona, mas o requisito não pede, e a conta dobra.' },
            { id: 'c', text: 'Uma AZ só', correct: false, consequence: 'A queda de uma AZ tira o site do ar.' },
          ],
        },
        {
          id: 'arq.f08.m2.a4',
          kind: 'decision',
          title: 'Gravar nos dois continentes',
          prompt: 'O carrinho precisa aceitar gravações na Europa e na América, cada uma na sua Região, mesmo com a outra fora. O que usar?',
          concepts: [{ id: 'ddb.global-tables' }, { id: 'pat.multi-region', weight: 0.5 }],
          xp: 50,
          difficulty: 2,
          explanation: ['Tabelas globais do DynamoDB aceitam leitura e escrita em todas as réplicas, o padrão write local.'],
          options: [
            { id: 'a', text: 'Tabelas globais do DynamoDB', correct: true, consequence: 'Cada Região grava localmente.' },
            { id: 'b', text: 'Uma tabela na América, com a Europa gravando nela', correct: false, consequence: 'A Europa depende da Região da América.' },
            { id: 'c', text: 'Uma réplica de leitura do RDS na Europa', correct: false, consequence: 'A réplica não aceita gravações.' },
          ],
        },
      ],
      debrief: { takeaways: ['Strangler fig: proxy e troca função por função.', 'Várias Regiões só com requisito; cada Região funcionando sozinha.'] },
    },
    // -----------------------------------------------------------------------
    {
      id: 'arq.f08.m3',
      title: 'Liberar sem derrubar',
      type: 'mission',
      summary: 'Infraestrutura imutável e as estratégias de implantação.',
      briefing: {
        company: 'Viagem Fácil',
        role: 'Você define como as versões chegam à produção.',
        situation: 'As liberações são feitas por SSH, servidor por servidor, de uma vez. Ninguém sabe dizer por que dois servidores "iguais" se comportam diferente. A última liberação derrubou a busca por uma hora.',
        objective: 'Liberar com risco pequeno e volta rápida.',
        successCriteria: ['Sem mudança no lugar', 'Estratégia de implantação certa para cada risco'],
      },
      intel: [{ conceptId: 'pat.immutable' }, { conceptId: 'pat.blue-green' }, { conceptId: 'pat.canary-linear' }],
      activities: [
        {
          id: 'arq.f08.m3.a1',
          kind: 'decision',
          title: 'Servidores iguais, diferentes',
          prompt: 'Dois servidores "iguais" se comportam diferente porque cada um recebeu correções à mão por SSH. Qual prática resolve a raiz do problema?',
          concepts: [{ id: 'pat.immutable' }],
          xp: 40,
          difficulty: 1,
          explanation: ['Na infraestrutura imutável, nada muda no lugar: cada mudança é um conjunto novo, igual e versionado, e o SSH pode ser desligado.'],
          options: [
            { id: 'a', text: 'Infraestrutura imutável: cada mudança gera recursos novos a partir de uma imagem versionada', correct: true, consequence: 'Todos os servidores nascem iguais, e o antigo fica para voltar.' },
            { id: 'b', text: 'Uma planilha com as correções de cada servidor', correct: false, consequence: 'Documenta o desvio, mas não o evita.' },
            { id: 'c', text: 'Mais gente com acesso SSH para corrigir mais rápido', correct: false, consequence: 'Aumenta o desvio e o risco.' },
          ],
        },
        {
          id: 'arq.f08.m3.a2',
          kind: 'classify',
          title: 'Qual estratégia é essa?',
          prompt: 'Classifique cada descrição pela estratégia de implantação.',
          concepts: [{ id: 'pat.blue-green' }, { id: 'pat.canary-linear' }],
          xp: 60,
          difficulty: 2,
          explanation: ['No lugar: de uma vez ou em ondas. Ambientes paralelos: blue/green. Tráfego aos poucos: canário (parte pequena primeiro) ou linear (parcelas iguais).'],
          bins: [
            { id: 'all', label: 'De uma vez (all at once)' },
            { id: 'rolling', label: 'Em ondas (rolling)' },
            { id: 'bg', label: 'Blue/green' },
            { id: 'canary', label: 'Canário ou linear' },
          ],
          items: [
            { id: 'i1', text: 'A versão nova é instalada em todos os servidores ao mesmo tempo, com parada', bin: 'all', explanation: 'Tudo muda junto.', concepts: ['pat.in-place'] },
            { id: 'i2', text: 'Os servidores são trocados um lote por vez, sem isolamento entre as versões', bin: 'rolling', explanation: 'Mais rápido que blue/green, mas com volta mais difícil.', concepts: ['pat.in-place'] },
            { id: 'i3', text: 'Um ambiente idêntico com a versão nova recebe o tráfego depois de testado, e o antigo fica para voltar', bin: 'bg', explanation: 'Dois ambientes, troca de tráfego.', concepts: ['pat.blue-green'] },
            { id: 'i4', text: '5% dos usuários vão para a versão nova, observada de perto antes do resto', bin: 'canary', explanation: 'Uma parte pequena primeiro.', concepts: ['pat.canary-linear'] },
            { id: 'i5', text: 'O tráfego passa para a versão nova em parcelas de 10% a cada minuto', bin: 'canary', explanation: 'Parcelas iguais em intervalos iguais: linear.', concepts: ['pat.canary-linear'] },
          ],
        },
        {
          id: 'arq.f08.m3.a3',
          kind: 'decision',
          title: 'Dez por cento primeiro',
          prompt: 'A busca nova roda num ambiente paralelo. A empresa quer mandar 10% do tráfego para ela, observar e ir aumentando. O que configurar no Route 53?',
          concepts: [{ id: 'dns.weighted' }, { id: 'pat.blue-green', weight: 0.5 }],
          xp: 40,
          difficulty: 2,
          explanation: ['O roteamento ponderado divide o tráfego pelos pesos; dá para começar com 10% e aumentar.'],
          options: [
            { id: 'a', text: 'Roteamento ponderado, com pesos 90 e 10', correct: true, consequence: 'Um em cada dez pedidos vai para a busca nova.' },
            { id: 'b', text: 'Roteamento por latência', correct: false, consequence: 'Escolhe pela proximidade, não por fração do tráfego.' },
            { id: 'c', text: 'Roteamento de failover', correct: false, consequence: 'Só troca quando o primário fica sem saúde.' },
          ],
        },
        {
          id: 'arq.f08.m3.a4',
          kind: 'decision',
          title: 'O Beanstalk sem perder capacidade',
          prompt: 'A aplicação de atendimento roda no Elastic Beanstalk. A liberação não pode reduzir a capacidade nem por alguns minutos, e o orçamento não comporta um segundo ambiente inteiro. Que política de implantação usar?',
          concepts: [{ id: 'cmp.beanstalk-deploy' }],
          xp: 50,
          difficulty: 3,
          explanation: ['O rolling with additional batch lança um lote extra antes de cada troca e mantém a capacidade, sem pagar um ambiente inteiro.'],
          options: [
            { id: 'a', text: 'Rolling with additional batch', correct: true, consequence: 'A capacidade fica igual durante a liberação.' },
            { id: 'b', text: 'Rolling', correct: false, consequence: 'Cada lote fora reduz a capacidade.' },
            { id: 'c', text: 'All at once', correct: false, consequence: 'Todas as instâncias ficam fora por um tempo.' },
          ],
        },
      ],
      debrief: { takeaways: ['Imutável: nada muda no lugar.', 'Blue/green para testar antes e voltar em segundos; canário e linear para expor a poucos usuários primeiro.'] },
    },
    // -----------------------------------------------------------------------
    {
      id: 'arq.f08.boss',
      title: 'A nova plataforma',
      type: 'boss',
      summary: 'Quatro decisões de padrão que cruzam entre si.',
      briefing: {
        company: 'Viagem Fácil',
        role: 'Você apresenta a arquitetura da nova plataforma.',
        situation: 'O monólito vai sair, os serviços novos vão nascer, a Europa chega e as liberações precisam deixar de derrubar o site.',
        objective: 'Escolher os padrões que funcionam juntos.',
        successCriteria: ['Nota geral de 70% ou mais', 'Pelo menos 50% em cada dimensão da rubrica'],
      },
      intel: [{ conceptId: 'pat.multi-region', body: ['As decisões se cruzam: um corte de uma vez só com serviços que se chamam em sequência multiplica o risco; uma frota fixa com liberações na própria frota paga caro sem ganhar segurança.'] }],
      activities: [
        {
          id: 'arq.f08.boss.a1',
          kind: 'lab',
          lab: 'architecture',
          title: 'Os padrões da Viagem Fácil',
          prompt: 'Percorra as quatro etapas e envie o projeto para receber o relatório.',
          concepts: [{ id: 'pat.strangler-fig' }, { id: 'pat.serverless' }, { id: 'pat.event-driven' }, { id: 'pat.multi-region' }, { id: 'pat.blue-green' }],
          xp: 250,
          difficulty: 3,
          hints: ['Cada etapa tem um requisito no enunciado que elimina as outras opções.'],
          explanation: ['Projeto de referência: strangler fig com o API Gateway; alertas em Lambda; eventos no EventBridge; tabelas globais do DynamoDB; blue/green com infraestrutura imutável.'],
          config: VIAGEM_PADROES,
        },
      ],
      debrief: { takeaways: ['Padrões combinam: troca gradual, eventos, várias Regiões independentes e liberações isoladas.'] },
    },
  ],
}
