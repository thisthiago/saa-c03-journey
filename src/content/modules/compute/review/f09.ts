/**
 * Questões da Revisão da Fase 9 de Computação (escolhendo a computação), no
 * formato do exame SAA-C03. Fatos conferidos em 20/10/2026 (ver
 * docs/VERIFICACAO-DE-CONTEUDO.md). As empresas são fictícias.
 */
import type { ReviewSet } from '../../../../engine/types'

export const REVIEW_F09: ReviewSet = {
  phaseId: 'cmp.f09',
  questions: [
    {
      id: 'rv:cmp.f09.jobs-de-20-minutos',
      kind: 'decision',
      title: 'Jobs em contêiner que chegam por fila',
      prompt:
        'Uma empresa tem uma imagem de contêiner que processa pedidos de análise de crédito. Cada pedido chega por uma fila e leva **até 20 minutos**. O volume varia muito ao longo do dia, o time **não quer gerenciar servidores** e ninguém usa Kubernetes. Quais opções atendem a **todos os requisitos**? (Escolha DUAS.)',
      concepts: [{ id: 'cmp.spectrum' }],
      xp: 5,
      difficulty: 2,
      domain: 'd3',
      multiple: true,
      options: [
        { id: 'a', text: 'Uma função Lambda empacotada com a imagem do contêiner.', correct: false, consequence: 'Uma invocação dura no máximo 15 minutos, e o pedido leva até 20.' },
        { id: 'b', text: 'Uma task do ECS no Fargate para cada pedido.', correct: true, consequence: 'O contêiner roda pelo tempo que for preciso, e o Fargate não deixa servidores para gerenciar.' },
        { id: 'c', text: 'Um Auto Scaling group de instâncias EC2 com um script que lê a fila.', correct: false, consequence: 'Funciona, mas o time passa a cuidar de sistema operacional, patches e escala das instâncias.' },
        { id: 'd', text: 'AWS Batch com um compute environment gerenciado no Fargate.', correct: true, consequence: 'O Batch enfileira os jobs e lança a capacidade no Fargate conforme eles chegam, sem servidores para o time.' },
        { id: 'e', text: 'Amazon EKS com grupos de nós gerenciados.', correct: false, consequence: 'Traz o Kubernetes, que ninguém pediu, e nós para cuidar.' },
      ],
      explanation: [
        'Os requisitos eliminam opções uma a uma. **Até 20 minutos** tira o Lambda, limitado a 15. **Sem gerenciar servidores** tira o EC2 com scripts e os nós do EKS, que ainda traria um Kubernetes que ninguém usa. Sobram as opções que rodam o contêiner sem servidores e sem limite de duração: uma **task no Fargate** por pedido ou o **AWS Batch** com capacidade no Fargate.',
        'Quanto mais perto da função, menos se administra: no EC2, o sistema operacional; no ECS ou EKS em EC2, as instâncias do cluster; no Fargate, só os contêineres; no Lambda, só o código.',
        '**Regra prática:** leia os requisitos como filtros. Duração acima de 15 minutos tira o Lambda; "sem gerenciar servidores" tira o EC2; "já usa Kubernetes" aponta para o EKS. Entre as que sobram, a de menor esforço operacional.',
      ],
    },
    {
      id: 'rv:cmp.f09.quem-aplica-patches',
      kind: 'decision',
      title: 'Quem cuida do sistema operacional',
      prompt:
        'Uma empresa vai dividir a operação entre o time de aplicações e um time de infraestrutura que **aplica os patches do sistema operacional** dos servidores. Para dimensionar esse time, ela quer saber em quais opções de computação **o cliente continua responsável pelos patches do sistema operacional**. Quais são? (Escolha DUAS.)',
      concepts: [{ id: 'cmp.spectrum' }],
      xp: 5,
      difficulty: 1,
      domain: 'd3',
      multiple: true,
      options: [
        { id: 'a', text: 'Instâncias EC2 rodando a aplicação diretamente.', correct: true, consequence: 'No EC2, o sistema operacional convidado e os patches são do cliente.' },
        { id: 'b', text: 'Tasks do ECS rodando na capacidade do Fargate.', correct: false, consequence: 'No Fargate, a AWS cuida dos hosts; o cliente cuida só dos contêineres.' },
        { id: 'c', text: 'Tasks do ECS em instâncias EC2 do próprio cluster.', correct: true, consequence: 'As instâncias do cluster são do cliente, com sistema operacional e patches.' },
        { id: 'd', text: 'Funções Lambda acionadas por eventos do S3.', correct: false, consequence: 'No Lambda, o cliente cuida só do código.' },
        { id: 'e', text: 'Pods do EKS rodando no Fargate, sem nós próprios.', correct: false, consequence: 'Com o Fargate, não há nós para o cliente corrigir; a AWS opera o plano de controle e a capacidade.' },
      ],
      explanation: [
        'A responsabilidade muda ao longo do espectro da computação. No **EC2**, o cliente cuida do sistema operacional, dos patches e da escala. No **ECS ou EKS em EC2**, cuida das instâncias do cluster, inclusive dos patches. No **Fargate**, só dos contêineres; no **Lambda**, só do código.',
        'Por isso, o time de patches só tem trabalho onde há instâncias do cliente: EC2 direto e clusters em EC2. Fargate e Lambda tiram essa tarefa.',
        '**Regra prática:** "sem aplicar patches" ou "menor esforço operacional" empurram a escolha para o Fargate ou o Lambda. Se algum requisito exige controle do sistema operacional, a responsabilidade pelos patches vem junto.',
      ],
    },
    {
      id: 'rv:cmp.f09.urgentes-e-baratos',
      kind: 'decision',
      title: 'Renders com prazo e renders de teste',
      prompt:
        'Uma produtora de animação renderiza milhares de cenas por semana, cada uma num contêiner que leva de 1 a 2 horas. As cenas de **clientes com entrega no dia são urgentes** e não podem ser interrompidas; os testes internos **podem esperar** e devem custar o mínimo possível. A equipe quer o **menor esforço operacional**. Qual solução atende?',
      concepts: [{ id: 'cmp.batch' }],
      xp: 5,
      difficulty: 2,
      domain: 'd4',
      options: [
        { id: 'a', text: 'AWS Batch com uma fila única e um compute environment de instâncias Spot para todas as cenas.', correct: false, consequence: 'Barato, mas as cenas urgentes disputam a mesma fila e podem ser interrompidas pelo Spot.' },
        { id: 'b', text: 'Um Auto Scaling group com scripts que leem uma fila e escolhem On-Demand ou Spot.', correct: false, consequence: 'Recria à mão o que o Batch já gerencia, com mais código e mais operação.' },
        { id: 'c', text: 'AWS Batch com uma fila de alta prioridade em On-Demand e outra de baixa prioridade em Spot.', correct: true, consequence: 'As cenas urgentes passam na frente em capacidade que não é interrompida; os testes esperam capacidade Spot, mais barata.' },
        { id: 'd', text: 'Uma função Lambda para cada cena, acionada pela fila.', correct: false, consequence: 'As cenas levam de 1 a 2 horas, bem acima do limite de 15 minutos por invocação.' },
      ],
      explanation: [
        'O **AWS Batch** roda jobs em lote a partir de **filas com prioridade**, e cada fila usa um ou mais **compute environments**. Uma fila de alta prioridade ligada a On-Demand atende as cenas urgentes sem interrupção; uma fila de baixa prioridade ligada a Spot deixa os testes esperarem capacidade mais barata. Num ambiente gerenciado, o Batch lança e escala a capacidade sozinho.',
        'Uma fila só com Spot mistura os dois mundos e arrisca as cenas urgentes. Scripts num Auto Scaling group são o erro clássico de refazer o Batch à mão. E o Lambda não roda trabalhos de horas.',
        '**Regra prática:** "milhares de jobs em lote", "fila com prioridades" e "usar Spot para reduzir custo" apontam para o AWS Batch. Separe as prioridades em filas e escolha a capacidade de cada uma pelo quanto ela tolera interrupção.',
      ],
    },
    {
      id: 'rv:cmp.f09.custo-do-beanstalk',
      kind: 'decision',
      title: 'Fatura e ajustes de um ambiente do Beanstalk',
      prompt:
        'Uma ONG colocou sua aplicação Python no **Elastic Beanstalk**, que criou instâncias, um balanceador e um Auto Scaling group. O tesoureiro quer entender a fatura, e a equipe quer trocar o tipo das instâncias por um menor. Qual afirmação está correta?',
      concepts: [{ id: 'cmp.beanstalk' }],
      xp: 5,
      difficulty: 1,
      domain: 'd4',
      options: [
        { id: 'a', text: 'O Beanstalk cobra uma taxa por ambiente, além dos recursos, e o tipo das instâncias é fixo.', correct: false, consequence: 'Não há cobrança pelo Beanstalk, e o tipo das instâncias pode ser alterado na configuração do ambiente.' },
        { id: 'b', text: 'Os recursos ficam numa conta da AWS e não aparecem na conta da ONG.', correct: false, consequence: 'Os recursos criados pelo Beanstalk ficam na conta da ONG, visíveis e configuráveis.' },
        { id: 'c', text: 'Não há cobrança pelo Beanstalk; a ONG paga pelos recursos criados e pode ajustá-los.', correct: true, consequence: 'A fatura mostra instâncias, balanceador e o que mais o ambiente usa, e o tipo das instâncias pode ser trocado.' },
        { id: 'd', text: 'O Beanstalk cobra por requisição atendida, como o Lambda.', correct: false, consequence: 'O Beanstalk não tem cobrança própria; o custo vem dos recursos, como as instâncias, cobradas pelo tempo.' },
      ],
      explanation: [
        'O **Elastic Beanstalk** recebe o código e cria e opera o ambiente: instâncias, balanceador, Auto Scaling e monitoramento. **Não há cobrança pelo Beanstalk** em si: paga-se pelos recursos que ele cria, que ficam **visíveis e configuráveis** na conta do cliente, inclusive o tipo das instâncias.',
        'Não existe taxa por ambiente nem cobrança por requisição. E os recursos não ficam escondidos numa conta da AWS.',
        '**Regra prática:** "a equipe quer só enviar o código" de uma aplicação web tradicional aponta para o Beanstalk. O custo é o dos recursos criados, e eles continuam sob o seu controle.',
      ],
    },
    {
      id: 'rv:cmp.f09.m1.a4:extra',
      kind: 'decision',
      title: 'Atualizar sem perder capacidade nem dobrar a frota',
      prompt:
        'Um site no Elastic Beanstalk roda em 10 instâncias. Cada implantação precisa **manter a capacidade cheia** e o site no ar, mas a empresa **não quer criar um conjunto inteiro de instâncias novas** a cada versão. Se algo der errado, ela aceita fazer uma nova implantação para voltar. Qual política de implantação atende?',
      concepts: [{ id: 'cmp.beanstalk-deploy' }],
      xp: 5,
      difficulty: 2,
      domain: 'd2',
      options: [
        { id: 'a', text: 'All at once, em todas as instâncias de uma vez.', correct: false, consequence: 'Todas as instâncias ficam fora do ar por pouco tempo durante a troca.' },
        { id: 'b', text: 'Rolling, em lotes sobre as instâncias atuais.', correct: false, consequence: 'Atualiza em lotes, mas cada lote sai do balanceador e a capacidade cai durante a implantação.' },
        { id: 'c', text: 'Rolling with additional batch.', correct: true, consequence: 'Lança um lote extra antes de começar, então a capacidade fica cheia, sem criar uma frota inteira nova.' },
        { id: 'd', text: 'Immutable, num grupo novo de instâncias.', correct: false, consequence: 'Mantém a capacidade, mas sobe um conjunto inteiro de instâncias novas, o que a empresa quer evitar.' },
      ],
      explanation: [
        'A política **rolling with additional batch** lança um lote extra de instâncias antes de atualizar os lotes, mantendo a **capacidade cheia** durante a implantação; o lote extra é terminado no fim. Ela não cria um Auto Scaling group inteiro novo, como o immutable.',
        'All at once deixa tudo fora do ar por pouco tempo. Rolling reduz a capacidade pelo tamanho de cada lote. Immutable atende a capacidade e dá a volta mais segura, mas com um conjunto inteiro de instâncias novas.',
        '**Regra prática:** sem indisponibilidade e sem perder capacidade, rolling with additional batch ou immutable; volta rápida em caso de falha, immutable ou blue/green; testar com parte do tráfego, traffic splitting.',
      ],
    },
    {
      id: 'rv:cmp.f09.parte-do-trafego',
      kind: 'decision',
      title: 'Versão nova avaliada com parte dos usuários',
      prompt:
        'Uma escola tem o portal no Elastic Beanstalk, com um **Application Load Balancer**. Antes de liberar uma versão nova para todos, ela quer mandar **10% do tráfego** para essa versão por 30 minutos e, se os health checks falharem, **manter as instâncias antigas intactas**. Qual política de implantação atende?',
      concepts: [{ id: 'cmp.beanstalk-deploy' }],
      xp: 5,
      difficulty: 2,
      domain: 'd2',
      options: [
        { id: 'a', text: 'Immutable.', correct: false, consequence: 'Mantém as antigas intactas se as novas falharem, mas não manda só uma porcentagem do tráfego para avaliação.' },
        { id: 'b', text: 'Traffic splitting.', correct: true, consequence: 'Manda a porcentagem escolhida para a versão nova durante o tempo de avaliação; se ela falhar, as antigas seguem intactas.' },
        { id: 'c', text: 'Rolling with additional batch.', correct: false, consequence: 'Atualiza as instâncias em lotes, sem controle da porcentagem do tráfego.' },
        { id: 'd', text: 'Blue/green, com a troca das URLs dos dois ambientes.', correct: false, consequence: 'A troca de URLs leva todo o tráfego de uma vez; não há os 10% de avaliação.' },
      ],
      explanation: [
        'O **traffic splitting** funciona como o immutable, com instâncias novas num grupo separado, mas manda **uma porcentagem do tráfego** para a versão nova durante um tempo de avaliação, como um teste canary. Se as novas falham nos health checks, são terminadas e as antigas continuam intactas. Ele exige um **Application Load Balancer**, que o portal já tem.',
        'O immutable protege as antigas, mas leva todo o tráfego quando as novas ficam saudáveis. Rolling with additional batch não divide tráfego por porcentagem. E a troca de URLs do blue/green é tudo ou nada.',
        '**Regra prática:** testar a versão nova com parte do tráfego no Beanstalk é traffic splitting, com ALB. Versão de plataforma incompatível pede blue/green, com troca de CNAME.',
      ],
    },
    {
      id: 'rv:cmp.f09.m2.a2',
      kind: 'decision',
      title: 'Conversor de boletins de outra escola',
      prompt:
        'Uma escola da rede publicou, **de forma privada para as contas da rede**, uma aplicação sem servidor descrita com o **AWS SAM**, que converte boletins em PDF. Outra escola quer usar a mesma aplicação na própria conta, com o **menor esforço**. Qual caminho atende?',
      concepts: [{ id: 'cmp.sar' }],
      xp: 5,
      difficulty: 1,
      domain: 'd3',
      options: [
        { id: 'a', text: 'Pedir o código e recriar as funções e permissões à mão.', correct: false, consequence: 'Funciona, mas refaz um trabalho que o repositório já entrega pronto.' },
        { id: 'b', text: 'Puxar uma imagem do Amazon ECR e rodá-la no Fargate.', correct: false, consequence: 'O ECR guarda imagens de contêiner, não aplicações sem servidor descritas com SAM.' },
        { id: 'c', text: 'Enviar o código para um ambiente do Elastic Beanstalk.', correct: false, consequence: 'O Beanstalk cria instâncias e balanceador para aplicações web; a aplicação é sem servidor.' },
        { id: 'd', text: 'Implantar a aplicação a partir do Serverless Application Repository.', correct: true, consequence: 'A aplicação sobe na conta da escola com os recursos que o modelo SAM descreve.' },
      ],
      explanation: [
        'O **Serverless Application Repository** guarda aplicações sem servidor descritas com o **AWS SAM**, publicadas de forma privada, compartilhadas com contas específicas ou públicas. Quem tem acesso implanta a aplicação na própria conta sem montar do zero.',
        'Recriar à mão desperdiça o trabalho publicado. O ECR é para imagens de contêiner. E o Beanstalk é para aplicações web com instâncias.',
        '**Regra prática:** aplicação sem servidor pronta, descrita com SAM, para implantar ou compartilhar entre contas, é o Serverless Application Repository.',
      ],
    },
    {
      id: 'rv:cmp.f09.plano-nas-lojas',
      kind: 'decision',
      title: 'Revisando um plano de contêineres nas lojas',
      prompt:
        'Uma rede de lojas quer rodar contêineres nos **servidores que as lojas já têm**, gerenciados pelo console do ECS. O rascunho do plano diz: usar o **ECS Anywhere**; pôr um **Application Load Balancer** distribuindo os clientes entre as tasks das lojas; deixar o **agente do Systems Manager** cuidar das credenciais; e contar com a **AWS para manter o hardware**. Quais afirmações sobre o plano estão corretas? (Escolha DUAS.)',
      concepts: [{ id: 'cmp.anywhere' }],
      xp: 5,
      difficulty: 3,
      domain: 'd3',
      multiple: true,
      options: [
        { id: 'a', text: 'O ALB não vai funcionar: o ECS Anywhere não tem balanceamento de carga do ELB.', correct: true, consequence: 'O ECS Anywhere serve melhor a cargas que geram tráfego de saída ou processam dados, sem balanceador.' },
        { id: 'b', text: 'O agente do Systems Manager cuida das credenciais dos servidores externos.', correct: true, consequence: 'No ECS Anywhere, os servidores são registrados como instâncias externas, e o agente do SSM entrega as credenciais.' },
        { id: 'c', text: 'A AWS vai manter o hardware dos servidores das lojas.', correct: false, consequence: 'Nos Anywhere, os servidores são da empresa; hardware da AWS no local é o Outposts.' },
        { id: 'd', text: 'As tasks das lojas vão usar o launch type FARGATE.', correct: false, consequence: 'Instâncias externas usam o launch type EXTERNAL.' },
        { id: 'e', text: 'O ECS Anywhere funciona sem nenhuma conexão com a AWS.', correct: false, consequence: 'Rodar sem conexão com a AWS é característica do EKS Anywhere, não do ECS Anywhere.' },
      ],
      explanation: [
        'O **ECS Anywhere** registra servidores e VMs da empresa num cluster do ECS, com o launch type **EXTERNAL** e o **agente do Systems Manager** cuidando das credenciais. Ele **não tem balanceamento de carga do ELB**, então o ALB do plano não distribuiria tráfego para essas tasks.',
        'Os servidores continuam sendo da empresa: hardware da AWS no local é o Outposts. O Fargate não roda em servidores externos. E operar sem conexão com a AWS é recurso do EKS Anywhere.',
        '**Regra prática:** não confunda os Anywhere (servidores da empresa, gerenciados pelo ECS ou EKS) com o Outposts (hardware da AWS no local). O ECS Anywhere fica melhor em cargas de saída e processamento, sem balanceador.',
      ],
    },
    {
      id: 'rv:cmp.f09.quem-opera-o-vmware',
      kind: 'decision',
      title: 'Quem opera o VMware depois da migração',
      prompt:
        'Uma seguradora vai migrar 250 VMs do VMware vSphere para o **Amazon EVS**, para manter os endereços IP e os procedimentos da equipe. A diretoria acredita que, depois da migração, a **AWS passa a operar todo o ambiente VMware**. Qual afirmação descreve corretamente o EVS?',
      concepts: [{ id: 'cmp.evs' }],
      xp: 5,
      difficulty: 2,
      domain: 'd3',
      options: [
        { id: 'a', text: 'O EVS converte cada VM numa instância EC2 comum, que passa a ser operada pela AWS.', correct: false, consequence: 'As VMs continuam no VMware; não há conversão para instâncias comuns.' },
        { id: 'b', text: 'O EVS roda o VMware num rack da AWS instalado no data center da seguradora.', correct: false, consequence: 'Hardware da AWS no local é o Outposts; o EVS roda na VPC da seguradora, na Região.' },
        { id: 'c', text: 'O EVS é um serviço em que a AWS opera o VMware, e a seguradora só usa as VMs.', correct: false, consequence: 'No EVS, a operação do ambiente é da seguradora, sozinha ou com um parceiro.' },
        { id: 'd', text: 'O EVS roda o VMware em bare metal do EC2 na VPC, operado pela seguradora ou um parceiro.', correct: true, consequence: 'A migração mantém os IPs e os procedimentos, mas a operação do VMware continua com a seguradora ou um parceiro.' },
      ],
      explanation: [
        'O **Amazon EVS** roda o **VMware Cloud Foundation** em instâncias **bare metal do EC2** dentro da VPC do cliente. Ele serve para migrar cargas VMware **sem trocar endereços IP**, sem treinar a equipe de novo e sem reescrever procedimentos. A operação do ambiente fica com o cliente, sozinho ou com um parceiro da AWS.',
        'As VMs não viram instâncias comuns. O EVS roda na Região, não num rack no data center. E a AWS não assume a operação do VMware.',
        '**Regra prática:** migrar VMware mantendo IPs, ferramentas e procedimentos aponta para o EVS. A lista do exame ainda cita o VMware Cloud on AWS; a página da AWS sobre VMware hoje apresenta o EVS.',
      ],
    },
  ],
}
