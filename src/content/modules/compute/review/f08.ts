/**
 * Questões da Revisão da Fase 8 de Computação (contêineres), no formato do
 * exame SAA-C03. Fatos conferidos em 20/10/2026 (ver
 * docs/VERIFICACAO-DE-CONTEUDO.md). As empresas são fictícias.
 */
import type { ReviewSet } from '../../../../engine/types'

export const REVIEW_F08: ReviewSet = {
  phaseId: 'cmp.f08',
  questions: [
    {
      id: 'rv:cmp.f08.service-ou-task',
      kind: 'decision',
      title: 'Uma API sempre no ar e um relatório noturno',
      prompt:
        'Uma empresa vai levar duas cargas para o Amazon ECS: uma **API** que precisa ter **sempre 4 cópias rodando** atrás de um Application Load Balancer, e um **relatório** que roda toda noite por 20 minutos e **termina**. Qual forma de executar cada carga atende com o **menor esforço**?',
      concepts: [{ id: 'ecs.basics' }],
      xp: 5,
      difficulty: 1,
      domain: 'd2',
      options: [
        { id: 'a', text: 'Um service para cada carga, com 4 tasks na API e 1 no relatório.', correct: false, consequence: 'O service manteria o relatório rodando o tempo todo, recriando a task cada vez que ela terminasse.' },
        { id: 'b', text: 'Um service com 4 tasks para a API e uma task agendada.', correct: true, consequence: 'O service repõe as tasks da API e integra com o balanceador; a task agendada roda o relatório e termina.' },
        { id: 'c', text: 'Tasks avulsas para as duas cargas, iniciadas por um script.', correct: false, consequence: 'Se uma task da API cair, ninguém a repõe; o script vira mais uma peça para manter.' },
        { id: 'd', text: 'Um cluster para cada carga, com a mesma task definition.', correct: false, consequence: 'O cluster é só onde as tasks rodam; ele não decide se a carga fica sempre no ar ou termina.' },
      ],
      explanation: [
        'No ECS, a **task definition** é a receita, a **task** é uma execução que faz o trabalho e termina, e o **service** mantém um número de tasks sempre rodando, integrado ao balanceador. A API precisa de um service com 4 tasks desejadas. O relatório é um trabalho que termina: uma task agendada.',
        'Um service para o relatório o recriaria sem parar. Tasks avulsas para a API não se repõem sozinhas. E separar em clusters não muda o modo de execução.',
        '**Regra prática:** "processo que precisa ficar sempre rodando" é um service; "trabalho que roda e termina" é uma task avulsa ou agendada.',
      ],
    },
    {
      id: 'rv:cmp.f08.tasks-pendentes',
      kind: 'decision',
      title: 'Tasks novas que não saem do lugar',
      prompt:
        'Um service do ECS roda num cluster de **instâncias EC2** e tem Service Auto Scaling. No pico, o número desejado de tasks sobe de 10 para 25, mas as tasks novas ficam **pendentes**: as instâncias do cluster não têm CPU nem memória livres. A empresa quer que o cluster **acompanhe a escala** das tasks automaticamente. Qual mudança atende?',
      concepts: [{ id: 'ecs.basics' }, { id: 'ecs.capacity' }],
      xp: 5,
      difficulty: 2,
      domain: 'd3',
      options: [
        { id: 'a', text: 'Aumentar o número máximo de tasks do Service Auto Scaling.', correct: false, consequence: 'O service já pede mais tasks; o que falta é onde colocá-las.' },
        { id: 'b', text: 'Reduzir o alvo de CPU do Service Auto Scaling, para escalar mais cedo.', correct: false, consequence: 'O service pediria tasks ainda mais cedo, que ficariam pendentes do mesmo jeito.' },
        { id: 'c', text: 'Aumentar a CPU e a memória na task definition.', correct: false, consequence: 'Tasks maiores precisam de ainda mais espaço nas instâncias, o que piora o problema.' },
        { id: 'd', text: 'Ligar o Cluster Auto Scaling para acrescentar instâncias ao cluster.', correct: true, consequence: 'O cluster ganha instâncias quando faltam recursos, e as tasks pendentes passam a ser colocadas.' },
      ],
      explanation: [
        'Há duas escalas no ECS com EC2. O **Service Auto Scaling** muda o número desejado de **tasks**; o **Cluster Auto Scaling** ajusta as **instâncias EC2** do cluster. Com só a primeira, o service pede tasks que não cabem nas instâncias existentes, e elas ficam pendentes.',
        'Mexer no Service Auto Scaling só muda quando e quantas tasks são pedidas. Tasks maiores ocupam mais espaço. Falta capacidade, e quem a cria é o Cluster Auto Scaling. No Fargate, esse problema não existe, porque não há instâncias para escalar.',
        '**Regra prática:** no ECS com EC2, escale as tasks com o Service Auto Scaling e as instâncias com o Cluster Auto Scaling. Para não cuidar da segunda parte, use o Fargate.',
      ],
    },
    {
      id: 'rv:cmp.f08.m1.a2:gpu',
      kind: 'decision',
      title: 'Recomendador com GPU e um time pequeno',
      prompt:
        'Um serviço de recomendação em contêineres precisa de **instâncias com GPU**. O time é pequeno e **não quer cuidar de patches, provisionamento nem escala** das instâncias, mas quer continuar no Amazon ECS. Qual capacidade atende?',
      concepts: [{ id: 'ecs.capacity' }],
      xp: 5,
      difficulty: 2,
      domain: 'd3',
      options: [
        { id: 'a', text: 'AWS Fargate.', correct: false, consequence: 'Dispensa as instâncias, mas não oferece os tipos com GPU de que o recomendador precisa.' },
        { id: 'b', text: 'ECS no EC2, com um grupo do Auto Scaling de instâncias com GPU.', correct: false, consequence: 'Dá as GPUs, mas deixa com o time as AMIs, os patches e a escala das instâncias.' },
        { id: 'c', text: 'ECS Managed Instances, com tipos de instância com GPU.', correct: true, consequence: 'As instâncias EC2 com GPU ficam disponíveis, e a AWS cuida do provisionamento, dos patches e da escala.' },
        { id: 'd', text: 'ECS Anywhere, com servidores com GPU no data center.', correct: false, consequence: 'Leva o trabalho para servidores próprios, que o time teria de manter.' },
      ],
      explanation: [
        'O **ECS Managed Instances** roda as tasks em instâncias EC2, com acesso aos tipos que o EC2 oferece, como os com GPU, e deixa com a AWS o **provisionamento, os patches e a escala**. Atende ao requisito de hardware sem dar trabalho de instâncias ao time.',
        'O Fargate tira as instâncias de cena, mas não tem os tipos com GPU. O ECS no EC2 atende o hardware e devolve ao time a gestão das instâncias. O ECS Anywhere é para servidores do próprio data center.',
        '**Regra prática:** sem servidores e sem requisitos especiais de hardware, Fargate; hardware específico com a gestão pela AWS, ECS Managed Instances; controle total do host, ECS no EC2; data center, ECS Anywhere.',
      ],
    },
    {
      id: 'rv:cmp.f08.m1.a2:ami',
      kind: 'decision',
      title: 'Agente de segurança e ajustes no kernel',
      prompt:
        'A equipe de segurança exige que um serviço em contêineres rode em hosts com uma **AMI própria**, que traz um **agente de segurança** e **ajustes no kernel** definidos pela empresa. O serviço vai rodar no Amazon ECS. Qual capacidade atende?',
      concepts: [{ id: 'ecs.capacity' }],
      xp: 5,
      difficulty: 2,
      domain: 'd3',
      options: [
        { id: 'a', text: 'AWS Fargate, com o agente instalado na imagem do contêiner.', correct: false, consequence: 'No Fargate não há host acessível: não dá para escolher a AMI nem ajustar o kernel.' },
        { id: 'b', text: 'ECS Managed Instances, com o agente configurado depois do lançamento.', correct: false, consequence: 'A AWS gerencia essas instâncias, inclusive a imagem e os patches; a AMI própria fica fora do controle da empresa.' },
        { id: 'c', text: 'ECS no EC2, com instâncias do cluster lançadas a partir da AMI própria.', correct: true, consequence: 'A empresa controla as instâncias do cluster e lança cada uma com a AMI exigida.' },
        { id: 'd', text: 'Funções Lambda empacotadas como imagem de contêiner.', correct: false, consequence: 'O Lambda também não dá acesso ao host nem ao kernel.' },
      ],
      explanation: [
        'Quando o requisito é **controlar o host**, com AMI própria, agente instalado e ajustes no kernel, a capacidade é o **ECS no EC2**: a empresa escolhe e gerencia as instâncias do cluster. É o preço de ter esse controle.',
        'Fargate e Lambda escondem o host. No ECS Managed Instances, a gestão das instâncias passa para a AWS, que é justamente o que a segurança não aceita aqui.',
        '**Regra prática:** "AMI própria", "acesso ao host" ou "ajustes no kernel" levam ao ECS no EC2. "Sem gerenciar servidores" leva ao Fargate.',
      ],
    },
    {
      id: 'rv:cmp.f08.m2.a2',
      kind: 'decision',
      title: 'Dados sigilosos de parceiros diferentes',
      prompt:
        'Uma agência vai rodar, para cada parceiro, uma task do ECS que processa **dados sigilosos** dele. O contrato exige o **maior isolamento** entre as tasks de parceiros diferentes e que cada task acesse **só os dados do próprio parceiro**, com o **menor esforço operacional**. Qual configuração atende?',
      concepts: [{ id: 'fargate.isolation' }],
      xp: 5,
      difficulty: 2,
      domain: 'd1',
      options: [
        { id: 'a', text: 'Fargate, com uma única task role que acessa os dados de todos os parceiros.', correct: false, consequence: 'As tasks ficam isoladas, mas cada uma pode ler os dados de todos os parceiros.' },
        { id: 'b', text: 'ECS no EC2, com todas as tasks numa instância grande e uma task role por parceiro.', correct: false, consequence: 'As permissões estão certas, mas tasks na mesma instância não têm isolamento entre si.' },
        { id: 'c', text: 'ECS no EC2, com uma instância dedicada para cada parceiro.', correct: false, consequence: 'Isola, mas obriga a agência a gerenciar uma instância por parceiro.' },
        { id: 'd', text: 'Fargate, com uma task role por parceiro.', correct: true, consequence: 'Cada task tem o próprio limite de isolamento e só as permissões do parceiro dela.' },
      ],
      explanation: [
        'No **Fargate**, cada task tem o **próprio limite de isolamento**: não divide kernel, CPU, memória nem interface de rede com outras tasks. Somando uma **task role por parceiro**, cada task acessa só os dados do próprio parceiro, sem instâncias para gerenciar.',
        'Uma task role única quebra o acesso mínimo. No EC2, tasks na mesma instância não têm esse isolamento entre si; separar uma instância por parceiro isola, com mais trabalho.',
        '**Regra prática:** "isolamento entre tarefas" com "menor esforço operacional" é Fargate. O isolamento de permissões vem da task role, uma por necessidade de acesso.',
      ],
    },
    {
      id: 'rv:cmp.f08.kubernetes-sem-nos',
      kind: 'decision',
      title: 'Manifestos Kubernetes sem nós para cuidar',
      prompt:
        'Uma empresa tem dezenas de manifestos **Kubernetes** prontos e um time que já usa as ferramentas do ecossistema. Na AWS, o time quer o plano de controle gerenciado e **não quer gerenciar nenhum nó**: nada de escolher instâncias, aplicar patches ou escalar servidores. Qual opção atende?',
      concepts: [{ id: 'eks.basics' }, { id: 'fargate.isolation' }],
      xp: 5,
      difficulty: 2,
      domain: 'd3',
      options: [
        { id: 'a', text: 'Amazon ECS no Fargate, convertendo os manifestos em task definitions.', correct: false, consequence: 'Tira os servidores, mas obriga a reescrever os manifestos e abandonar as ferramentas do Kubernetes.' },
        { id: 'b', text: 'Amazon EKS com os pods rodando no Fargate.', correct: true, consequence: 'O EKS aceita os manifestos sem reescrita, e no Fargate cada pod roda sem nós para gerenciar.' },
        { id: 'c', text: 'Amazon EKS com grupos de nós gerenciados.', correct: false, consequence: 'O plano de controle é gerenciado, mas os nós continuam existindo, com tipos e grupos escolhidos pelo time.' },
        { id: 'd', text: 'Kubernetes instalado à mão em instâncias EC2.', correct: false, consequence: 'O time passaria a operar o plano de controle e os nós, o oposto do pedido.' },
      ],
      explanation: [
        'O **EKS** é Kubernetes certificado: manifestos e ferramentas funcionam sem reescrita, e a AWS opera o plano de controle. Para não gerenciar nós, os pods podem rodar no **Fargate**, que serve tanto ao ECS quanto ao EKS e dá a cada pod o próprio isolamento.',
        'O ECS no Fargate tira os servidores, mas perde o investimento em Kubernetes. Grupos de nós gerenciados ainda deixam nós no caminho. E o Kubernetes à mão devolve todo o trabalho ao time.',
        '**Regra prática:** "já usa Kubernetes" leva ao EKS; para operar menos os nós, EKS com Fargate ou com Auto Mode.',
      ],
    },
    {
      id: 'rv:cmp.f08.duas-apps-mesma-instancia',
      kind: 'decision',
      title: 'Cada aplicação lendo o bucket da outra',
      prompt:
        'Num cluster do ECS com instâncias EC2, tasks de duas aplicações dividem as mesmas instâncias. A **aplicação A** só deveria ler o bucket A, e a **aplicação B**, só o bucket B. Hoje, as duas permissões estão no **instance profile** das instâncias, e cada aplicação consegue ler os dois buckets. Qual mudança aplica o **menor privilégio**?',
      concepts: [{ id: 'ecs.roles' }],
      xp: 5,
      difficulty: 3,
      domain: 'd1',
      options: [
        { id: 'a', text: 'Uma task role por aplicação e nenhum bucket no instance profile.', correct: true, consequence: 'Cada task role dá acesso só ao bucket da aplicação, e o código usa as credenciais dela, sem herdar as da instância.' },
        { id: 'b', text: 'Uma execution role para cada aplicação, cada uma com acesso ao bucket dela.', correct: false, consequence: 'A execution role é do agente do ECS: as credenciais dela não chegam ao código da aplicação.' },
        { id: 'c', text: 'Uma bucket policy em cada bucket que permita o instance profile das instâncias.', correct: false, consequence: 'As duas aplicações usam o mesmo instance profile: as duas continuariam lendo os dois buckets.' },
        { id: 'd', text: 'Um security group diferente para as tasks de cada aplicação.', correct: false, consequence: 'Security groups controlam tráfego de rede, não as permissões de leitura nos buckets.' },
      ],
      explanation: [
        'A **task role** dá permissões ao **código** de cada task. Com ela, o SDK no contêiner usa só as credenciais da task role, sem herdar as da instância. Uma task role por aplicação, com só o bucket dela, e o instance profile sem permissões nos buckets, aplicam o menor privilégio mesmo com as tasks dividindo instâncias.',
        'A execution role serve ao agente (imagem, logs, segredos) e não chega ao código. Uma bucket policy para o instance profile mantém o acesso compartilhado. Security groups não decidem permissões de IAM.',
        '**Regra prática:** permissões da aplicação vão na task role; puxar imagem, mandar logs e ler segredos na inicialização vão na execution role. Nunca deixe permissões de aplicação no instance profile de um cluster compartilhado.',
      ],
    },
    {
      id: 'rv:cmp.f08.m2.a1:secret',
      kind: 'decision',
      title: 'Task que falha antes de o código rodar',
      prompt:
        'Uma task do ECS no Fargate referencia, na task definition, um segredo do **Secrets Manager** que deve virar variável de ambiente do contêiner. A task **falha na inicialização**, antes de o código rodar, com um erro de acesso negado ao ler o segredo. Onde deve ser dada a permissão de leitura do segredo?',
      concepts: [{ id: 'ecs.roles' }],
      xp: 5,
      difficulty: 2,
      domain: 'd1',
      options: [
        { id: 'a', text: 'Na task role da task.', correct: false, consequence: 'A task role é usada pelo código, que ainda nem rodou; o segredo é lido antes, pelo agente.' },
        { id: 'b', text: 'Na execution role da task.', correct: true, consequence: 'O agente do ECS usa a execution role para ler o segredo e injetá-lo no contêiner na inicialização.' },
        { id: 'c', text: 'No instance profile das instâncias do cluster.', correct: false, consequence: 'A task roda no Fargate: não há instâncias do cluster nem instance profile.' },
        { id: 'd', text: 'Na política do bucket onde fica a imagem do contêiner.', correct: false, consequence: 'As imagens ficam no ECR, não num bucket; e a falha é na leitura do segredo.' },
      ],
      explanation: [
        'A **execution role** é do agente do ECS e do Fargate: é com ela que eles **puxam a imagem**, **mandam logs** ao CloudWatch e **leem segredos** referenciados na task definition, antes de o código começar. Um erro de acesso ao segredo na inicialização aponta para ela.',
        'A task role entra depois, para as chamadas do código. No Fargate não há instance profile. E o segredo não tem relação com onde a imagem está.',
        '**Regra prática:** falhou ao puxar a imagem ou ler um segredo na inicialização, execution role; a aplicação não acessa o S3 ou o DynamoDB, task role.',
      ],
    },
    {
      id: 'rv:cmp.f08.time-sem-kubernetes',
      kind: 'decision',
      title: 'Primeiros contêineres de um time pequeno',
      prompt:
        'Um time de quatro pessoas vai levar suas primeiras aplicações para contêineres na AWS. Ninguém tem experiência com Kubernetes, não há planos de rodar contêineres fora da AWS, e o requisito é ter **o menor número de peças para operar**. Qual opção atende?',
      concepts: [{ id: 'ecs.vs-eks' }],
      xp: 5,
      difficulty: 1,
      domain: 'd3',
      options: [
        { id: 'a', text: 'Amazon EKS com grupos de nós gerenciados.', correct: false, consequence: 'Exige aprender e operar o Kubernetes, com nós para cuidar, sem nenhum requisito que justifique.' },
        { id: 'b', text: 'Amazon ECS no Fargate.', correct: true, consequence: 'O orquestrador da AWS, com menos peças, e sem servidores para gerenciar.' },
        { id: 'c', text: 'Kubernetes instalado à mão em instâncias EC2.', correct: false, consequence: 'O time teria de operar o plano de controle e os nós, o máximo de peças possível.' },
        { id: 'd', text: 'Instâncias EC2 rodando os contêineres com scripts próprios.', correct: false, consequence: 'Sem orquestrador, o time passa a cuidar de reinícios, escala e implantação à mão.' },
      ],
      explanation: [
        'ECS e EKS orquestram contêineres. O **ECS** é o orquestrador da AWS, com **menos peças para operar**; no **Fargate**, também não há servidores. O EKS é a escolha quando a empresa já usa Kubernetes, quer as mesmas ferramentas em outros ambientes ou precisa do ecossistema, e nenhum desses sinais aparece aqui.',
        'O EKS traria o Kubernetes e os nós para um time sem experiência. Kubernetes à mão e scripts próprios somam trabalho em vez de tirar.',
        '**Regra prática:** sem Kubernetes no histórico nem portabilidade exigida, ECS (de preferência no Fargate). Com Kubernetes ou ferramentas do ecossistema, EKS.',
      ],
    },
    {
      id: 'rv:cmp.f08.clusters-por-desenvolvedor',
      kind: 'decision',
      title: 'Fatura do EKS alta nos fins de semana',
      prompt:
        'Para isolar os testes, uma empresa criou **um cluster do Amazon EKS por desenvolvedor**, 20 ao todo. Nos fins de semana, a equipe remove todos os nós, mas a fatura do EKS **continua alta**. A empresa quer **reduzir esse custo** mantendo ambientes de teste para todos. Qual explicação e ação estão corretas?',
      concepts: [{ id: 'eks.basics' }],
      xp: 5,
      difficulty: 2,
      domain: 'd4',
      options: [
        { id: 'a', text: 'Cada cluster é cobrado mesmo sem nós; juntar os testes em poucos clusters.', correct: true, consequence: 'O EKS cobra por cluster, e os nós à parte: menos clusters, menos cobrança fixa.' },
        { id: 'b', text: 'Os nós removidos continuam cobrados por mais 30 dias; basta esperar o prazo.', correct: false, consequence: 'Nós removidos deixam de ser cobrados; o que continua é o preço de cada cluster.' },
        { id: 'c', text: 'Rodar os pods no Fargate, que zera a cobrança fixa de cada cluster.', correct: false, consequence: 'O Fargate muda como os pods são cobrados; cada cluster continua com o seu preço.' },
        { id: 'd', text: 'Ligar o EKS Auto Mode zera a cobrança quando não há pods.', correct: false, consequence: 'O Auto Mode gerencia os nós; não elimina o preço por cluster.' },
      ],
      explanation: [
        'O EKS tem **preço por cluster**, e os nós são cobrados **à parte** (EC2 ou Fargate). Remover os nós zera a parte deles, mas cada um dos 20 clusters continua cobrado. Juntar os ambientes de teste em poucos clusters compartilhados reduz a cobrança fixa.',
        'Nós removidos param de cobrar na hora. Fargate e Auto Mode mudam a forma de rodar e gerenciar os nós, não o preço do cluster.',
        '**Regra prática:** no custo do EKS, separe o preço fixo de cada cluster do custo dos nós. Muitos clusters pequenos e ociosos pesam pela parte fixa.',
      ],
    },
    {
      id: 'rv:cmp.f08.limite-do-registro-publico',
      kind: 'decision',
      title: 'Builds que falham ao baixar imagens públicas',
      prompt:
        'Os builds e as tasks de uma empresa baixam imagens base de um **registro público externo**. Nos horários de pico, o registro externo recusa downloads por **limite de requisições**, e os deploys falham. A empresa quer depender menos do registro externo, com o **menor esforço**. Qual solução atende?',
      concepts: [{ id: 'ecr.registry' }],
      xp: 5,
      difficulty: 2,
      domain: 'd2',
      options: [
        { id: 'a', text: 'Uma lifecycle policy no ECR para as imagens base.', correct: false, consequence: 'Lifecycle policies apagam imagens antigas; não trazem imagens do registro externo.' },
        { id: 'b', text: 'Ligar o scan on push nos repositórios do ECR.', correct: false, consequence: 'Analisa vulnerabilidades das imagens enviadas; não reduz os downloads do registro externo.' },
        { id: 'c', text: 'Uma regra de pull through cache no ECR para o registro externo.', correct: true, consequence: 'O ECR passa a manter uma cópia das imagens externas, e builds e tasks baixam dele.' },
        { id: 'd', text: 'Replicar os repositórios do ECR para outra Região.', correct: false, consequence: 'Copia imagens que já estão no ECR; as imagens base continuariam vindo do registro externo.' },
      ],
      explanation: [
        'O **pull through cache** do ECR mantém no registro da conta uma cópia das imagens de registros externos. Os builds e as tasks passam a baixar do ECR, com o acesso controlado pelo IAM, e o registro externo deixa de ser consultado a cada download.',
        'Lifecycle policies, scan on push e replicação são recursos do ECR para imagens que já estão nele: limpeza, vulnerabilidades e cópia entre Regiões ou contas.',
        '**Regra prática:** ECR é o registro gerenciado de imagens: controle de acesso pelo IAM, scan de vulnerabilidades, lifecycle policies, replicação e, para imagens externas, pull through cache.',
      ],
    },
  ],
}
