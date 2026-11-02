/**
 * Questões da Revisão da Fase 3 da AWS Foundations (responsabilidade
 * compartilhada), no formato do exame SAA-C03. Fatos conferidos em
 * 18/10/2026 e 02/11/2026 (ver docs/VERIFICACAO-DE-CONTEUDO.md). As empresas
 * são fictícias.
 */
import type { ReviewSet } from '../../../../engine/types'

export const REVIEW_F03: ReviewSet = {
  phaseId: 'fnd.f03',
  questions: [
    {
      id: 'rv:fnd.f03.m3.a2',
      kind: 'decision',
      multiple: true,
      title: 'O que sobra para o time depois da migração',
      prompt:
        'Uma farmácia moveu a API de receitas de instâncias EC2 para funções AWS Lambda com runtime gerenciado, no modo Auto de atualização. O código empacota algumas bibliotecas de terceiros. A diretoria quer saber o que **continua sendo responsabilidade do time** depois da migração. Quais itens continuam com o time? (Escolha DUAS.)',
      concepts: [{ id: 'srm.lambda' }, { id: 'srm.by-service' }, { id: 'srm.customer-scope' }],
      xp: 5,
      difficulty: 3,
      domain: 'd1',
      options: [
        { id: 'a', text: 'Aplicar os patches de segurança no runtime das funções.', correct: false, consequence: 'Com runtime gerenciado no modo Auto, a AWS aplica as atualizações do runtime.' },
        { id: 'b', text: 'Definir as permissões da função de execução de cada Lambda.', correct: true, consequence: 'A função de execução é uma role do IAM, e as permissões dela são sempre do cliente.' },
        { id: 'c', text: 'Atualizar o sistema operacional dos servidores que rodam as funções.', correct: false, consequence: 'No Lambda, o sistema operacional e a plataforma são operados pela AWS.' },
        { id: 'd', text: 'Manter atualizadas as bibliotecas que o código empacota.', correct: true, consequence: 'Dependências que vão dentro do pacote da função são parte do código do cliente.' },
        { id: 'e', text: 'Proteger fisicamente os servidores contra acesso indevido.', correct: false, consequence: 'Segurança física é da AWS em qualquer serviço que roda numa Região.' },
      ],
      explanation: [
        'A migração para um serviço serverless tira do time o sistema operacional e, com runtime gerenciado no modo Auto, as atualizações do runtime. Continua com o time tudo o que está sob o controle dele: o **código e suas dependências**, as **permissões da função de execução** e os dados.',
        'Patches do runtime e do sistema operacional passam para a AWS. A segurança física nunca foi do time, nem no EC2. Atenção a um detalhe: numa função empacotada como imagem de contêiner, reconstruir a imagem com os patches volta a ser tarefa do cliente.',
        '**Regra prática:** quanto mais gerenciado o serviço, menos camadas o cliente opera. Mas código, dependências, permissões e dados ficam com o cliente em qualquer serviço.',
      ],
    },
    {
      id: 'rv:fnd.f03.mysql-no-ec2',
      kind: 'decision',
      title: 'Equipe pequena presa a patches do banco',
      prompt:
        'Uma equipe de duas pessoas mantém um MySQL instalado numa instância EC2 e passa horas por mês aplicando patches no sistema operacional e no motor do banco. A empresa quer **reduzir esse esforço operacional** sem trocar de motor e mantendo o controle de quem acessa os dados. O que atende?',
      concepts: [{ id: 'srm.by-service' }, { id: 'srm.ec2' }, { id: 'srm.rds' }],
      xp: 5,
      difficulty: 2,
      domain: 'd1',
      options: [
        { id: 'a', text: 'Migrar para o Amazon RDS for MySQL e escolher a janela de manutenção.', correct: true, consequence: 'A AWS passa a aplicar os patches do sistema operacional e do motor; a equipe escolhe quando e controla os acessos.' },
        { id: 'b', text: 'Abrir um caso no AWS Support pedindo que a AWS aplique os patches na instância.', correct: false, consequence: 'No EC2, o sistema operacional convidado é do cliente: a AWS não aplica patches dentro das suas instâncias.' },
        { id: 'c', text: 'Mover a instância para um Dedicated Host, que a AWS mantém atualizado.', correct: false, consequence: 'O Dedicated Host isola o servidor físico, mas o sistema operacional e o banco continuam com a equipe.' },
        { id: 'd', text: 'Trocar a instância por uma maior, para os patches terminarem mais depressa.', correct: false, consequence: 'O tempo de aplicar patches não é o problema: a responsabilidade continua toda com a equipe.' },
      ],
      explanation: [
        'A divisão de responsabilidades **muda com o serviço**. No EC2, o cliente aplica patches no sistema operacional convidado e em tudo o que instala. No **RDS**, a AWS executa as atualizações do sistema operacional e do motor; o cliente escolhe a janela de manutenção e continua cuidando de security groups, usuários do banco e criptografia.',
        'Nenhum caso no Support faz a AWS entrar na sua instância. O Dedicated Host muda o isolamento físico, não quem opera o sistema operacional. E uma instância maior não tira trabalho de ninguém.',
        '**Regra prática:** "reduzir o esforço com patches do sistema operacional" costuma apontar para um serviço gerenciado (RDS no lugar de banco no EC2) ou serverless. Confira só se o serviço ainda atende aos outros requisitos, como o mesmo motor.',
      ],
    },
    {
      id: 'rv:fnd.f03.camadas-de-patch',
      kind: 'decision',
      title: 'Quem corrige cada camada',
      prompt:
        'Numa auditoria, a Maré Alta precisa dizer **quem aplica as correções de segurança** em cada camada de um sistema em Java que roda em instâncias EC2: (1) o hypervisor e o servidor físico; (2) o sistema operacional das instâncias; (3) a aplicação Java e o servidor de aplicação. Qual divisão está correta?',
      concepts: [{ id: 'srm.shared-controls' }, { id: 'srm.ec2' }, { id: 'srm.model' }],
      xp: 5,
      difficulty: 1,
      domain: 'd1',
      options: [
        { id: 'a', text: 'A AWS corrige as camadas 1 e 2; a Maré Alta, só a camada 3.', correct: false, consequence: 'No EC2, o sistema operacional convidado é do cliente, inclusive os patches.' },
        { id: 'b', text: 'A AWS corrige a camada 1; a Maré Alta, as camadas 2 e 3.', correct: true, consequence: 'É a gestão de patches como controle compartilhado: cada lado corrige o que opera.' },
        { id: 'c', text: 'A AWS corrige as três camadas, porque o EC2 é um serviço da AWS.', correct: false, consequence: 'O EC2 é infraestrutura: tudo o que roda dentro da instância é do cliente.' },
        { id: 'd', text: 'A Maré Alta corrige as três camadas, porque contratou as instâncias.', correct: false, consequence: 'O cliente não tem acesso ao hypervisor nem ao servidor físico: eles são da AWS.' },
      ],
      explanation: [
        'A **gestão de patches é um controle compartilhado**: cada lado corrige o que opera. A AWS opera o hypervisor e o servidor físico (segurança **da** nuvem). No EC2, o cliente opera o sistema operacional convidado e tudo o que instala nele (segurança **na** nuvem).',
        'Atribuir o sistema operacional à AWS é confundir o EC2 com um serviço gerenciado. Atribuir tudo a um dos lados ignora que as camadas têm donos diferentes.',
        '**Regra prática:** para saber quem corrige, pergunte quem opera aquela camada. No EC2, do sistema operacional para cima é o cliente; abaixo dele, a AWS.',
      ],
    },
    {
      id: 'rv:fnd.f03.servicos-gerenciados',
      kind: 'decision',
      multiple: true,
      title: 'O que a diretoria acha que é da AWS',
      prompt:
        'Uma clínica guarda exames no Amazon S3. A diretoria acredita que, por ser um serviço gerenciado, a AWS também cuida de tudo o que envolve a segurança dos exames. Quais tarefas **continuam sendo da clínica**? (Escolha DUAS.)',
      concepts: [{ id: 'srm.customer-scope' }, { id: 'srm.model' }, { id: 'srm.s3' }],
      xp: 5,
      difficulty: 1,
      domain: 'd1',
      options: [
        { id: 'a', text: 'Classificar quais exames são sensíveis e escolher a criptografia.', correct: true, consequence: 'Só a clínica sabe o que os dados significam, e as opções de criptografia são escolhas dela.' },
        { id: 'b', text: 'Substituir os discos com defeito nos servidores do S3.', correct: false, consequence: 'Hardware é segurança da nuvem: é da AWS.' },
        { id: 'c', text: 'Definir quem acessa os exames, por políticas do IAM e bucket policies.', correct: true, consequence: 'Identidades e permissões são do cliente em qualquer serviço, gerenciado ou não.' },
        { id: 'd', text: 'Aplicar patches no sistema operacional dos servidores do S3.', correct: false, consequence: 'No S3, a AWS opera a infraestrutura, o sistema operacional e a plataforma.' },
        { id: 'e', text: 'Controlar a entrada de pessoas nos data centers da Região.', correct: false, consequence: 'Controles físicos dos data centers são herdados da AWS; a clínica nem tem acesso a eles.' },
      ],
      explanation: [
        'Num serviço gerenciado como o S3, a AWS opera a infraestrutura, o sistema operacional e a plataforma. Mas o que está sob o controle do cliente continua com ele: **classificar os dados e escolher a criptografia**, e **decidir quem acessa**, por políticas do IAM, bucket policies e Block Public Access.',
        'Discos, patches dos servidores do S3 e acesso aos data centers são segurança **da** nuvem, responsabilidade da AWS.',
        '**Regra prática:** em nenhum serviço a AWS decide quem pode acessar os seus dados nem o quanto eles são sensíveis. Dados, permissões e configuração são sempre do cliente.',
      ],
    },
    {
      id: 'rv:fnd.f03.boss.a3',
      kind: 'decision',
      title: 'O diretor que culpa o hardware',
      prompt:
        'O banco RDS Single-AZ de uma loja ficou uma hora fora do ar porque o servidor físico sob ele degradou; a AWS substituiu o servidor. O diretor insiste: "a falha foi da AWS, então a indisponibilidade é responsabilidade dela". Qual resposta descreve corretamente a divisão e **o que a loja deve mudar**?',
      concepts: [{ id: 'srm.incident' }, { id: 'srm.aws-scope' }],
      xp: 5,
      difficulty: 2,
      domain: 'd1',
      options: [
        { id: 'a', text: 'A AWS responde por tudo o que envolve hardware; a loja só precisa esperar a próxima correção.', correct: false, consequence: 'O hardware vai falhar de novo um dia; sem mudar a arquitetura, o banco cai outra vez.' },
        { id: 'b', text: 'A AWS não tem responsabilidade sobre o RDS; a loja deve operar o hardware do banco.', correct: false, consequence: 'O hardware e a plataforma do RDS são operados pela AWS, que inclusive substituiu o servidor.' },
        { id: 'c', text: 'O hardware é da AWS, mas a hora fora do ar veio da escolha Single-AZ: ligar o Multi-AZ.', correct: true, consequence: 'A loja corrige a parte que é dela, a arquitetura, em vez de esperar que o hardware nunca falhe.' },
        { id: 'd', text: 'A falha é da AWS, e contratar o Enterprise Support evita que ela se repita.', correct: false, consequence: 'Um plano de suporte muda o atendimento, não a disponibilidade: o banco continua numa zona só.' },
      ],
      explanation: [
        'Num incidente, separe **a causa** da **prevenção**. A causa, o servidor físico, é segurança da nuvem: a AWS respondeu por ela e o substituiu. Mas continuar no ar quando o hardware falha é decisão de arquitetura do cliente: o banco era **Single-AZ**, e o **Multi-AZ** teria feito o failover para outra zona.',
        'Esperar que o hardware nunca falhe não é plano. Dizer que a AWS não responde por nada no RDS ignora que ela opera a plataforma. E um plano de suporte não muda a disponibilidade.',
        '**Regra prática:** mesmo quando a causa é da AWS, a resposta certa costuma ser uma mudança de arquitetura do cliente, como Multi-AZ, backups ou outra Região.',
      ],
    },
    {
      id: 'rv:iam.least-privilege:gravacao',
      kind: 'decision',
      title: 'Uma função que só grava relatórios',
      prompt:
        'Uma função Lambda gera relatórios e só precisa **gravar** arquivos no prefixo `relatorios/` do bucket `financeiro`. Ela nunca lê, lista nem apaga nada. Qual política de identidade atende seguindo o **menor privilégio**?',
      concepts: [{ id: 'iam.least-privilege' }, { id: 'srm.customer-scope' }],
      xp: 5,
      difficulty: 2,
      domain: 'd1',
      options: [
        { id: 'a', text: 'Allow `s3:*` em `arn:aws:s3:::financeiro/relatorios/*`.', correct: false, consequence: 'Acerta o prefixo, mas libera também ler e apagar os relatórios: ações demais.' },
        { id: 'b', text: 'Allow `s3:PutObject` em `arn:aws:s3:::financeiro/relatorios/*`.', correct: true, consequence: 'Só a ação usada e só o prefixo necessário: se a função for comprometida, o estrago fica limitado.' },
        { id: 'c', text: 'Allow `s3:PutObject` em `arn:aws:s3:::financeiro`.', correct: false, consequence: 'Esse ARN é o do bucket, e PutObject age sobre objetos: a gravação seria negada.' },
        { id: 'd', text: 'Allow `s3:Put*` em `arn:aws:s3:::financeiro/*`.', correct: false, consequence: 'O curinga inclui outras ações Put, e o recurso cobre o bucket inteiro, não só o prefixo.' },
      ],
      explanation: [
        '**Menor privilégio** é conceder só as ações e os recursos necessários. A função só grava, então a ação é `s3:PutObject`; só grava em `relatorios/`, então o recurso é o ARN dos objetos desse prefixo, `arn:aws:s3:::financeiro/relatorios/*`.',
        '`s3:*` no prefixo libera leitura e exclusão. `s3:Put*` no bucket inteiro amplia ações e recursos. E o ARN do bucket, sem `/*`, não casa com ações sobre objetos, então a gravação nem funcionaria.',
        '**Regra prática:** entre alternativas que funcionam, a mais restrita costuma ser a certa: ações específicas em vez de curingas e recursos identificados pelo ARN. Ações sobre objetos usam o ARN com `/*` (ou com o prefixo).',
      ],
    },
    {
      id: 'rv:fnd.f03.role-curinga',
      kind: 'decision',
      title: 'A role que permitia tudo',
      prompt:
        'Um invasor explorou uma falha na aplicação de uma instância EC2 e, com as credenciais da role da instância, apagou tabelas do DynamoDB que a aplicação nem usava. A role tinha `"Action": "*"` em `"Resource": "*"`. A aplicação só lê e grava na tabela `pedidos`. Qual mudança **reduz o estrago** de uma próxima invasão?',
      concepts: [{ id: 'iam.least-privilege' }],
      xp: 5,
      difficulty: 2,
      domain: 'd1',
      options: [
        { id: 'a', text: 'Trocar a role por chaves de acesso de um usuário IAM guardadas na instância.', correct: false, consequence: 'Chaves de longo prazo na instância pioram o risco: não expiram sozinhas e podem ser copiadas.' },
        { id: 'b', text: 'Manter a política e restringir o security group da instância.', correct: false, consequence: 'O security group filtra a rede da instância, não o que as credenciais da role podem fazer na API.' },
        { id: 'c', text: 'Exigir MFA nas chamadas que a aplicação faz com a role.', correct: false, consequence: 'Uma aplicação não digita códigos de MFA, e o invasor usa as mesmas credenciais da aplicação.' },
        { id: 'd', text: 'Dar à role só as ações de leitura e gravação na tabela pedidos.', correct: true, consequence: 'Com credenciais roubadas, o invasor só consegue o que a aplicação já fazia, numa única tabela.' },
      ],
      explanation: [
        'O invasor fez o que a role permitia, e ela permitia tudo. Aplicar o **menor privilégio**, com só as ações de leitura e gravação no ARN da tabela `pedidos`, limita o estrago de qualquer credencial roubada ao que a aplicação realmente precisa.',
        'Chaves de longo prazo na instância são um risco maior que a role, que entrega credenciais temporárias. O security group controla a rede, não a API. E MFA não se aplica a uma aplicação que chama a API sozinha.',
        '**Regra prática:** permissões de uma role devem descrever a tarefa, não a conveniência. Prefira roles a chaves de longo prazo e ações e recursos específicos a curingas.',
      ],
    },
    {
      id: 'rv:fnd.f03.politica-publica-antiga',
      kind: 'decision',
      title: 'O bucket que continua público',
      prompt:
        'Um bucket tem uma bucket policy antiga que concede leitura pública a todos os objetos. Para fechá-lo sem apagar a política, que outra equipe ainda vai revisar, alguém ligou só o ajuste **BlockPublicPolicy** do S3 Block Public Access, mas os objetos continuam abertos na internet. Qual ajuste **neutraliza a política pública existente**?',
      concepts: [{ id: 's3.block-public-access' }, { id: 'srm.s3' }],
      xp: 5,
      difficulty: 3,
      domain: 'd1',
      options: [
        { id: 'a', text: 'BlockPublicAcls, que impede novas concessões públicas.', correct: false, consequence: 'Rejeita novas ACLs públicas; não mexe em políticas, nem nas que já existem.' },
        { id: 'b', text: 'IgnorePublicAcls, que desconsidera as concessões públicas.', correct: false, consequence: 'Neutraliza ACLs públicas, mas o acesso vem de uma bucket policy, não de uma ACL.' },
        { id: 'c', text: 'RestrictPublicBuckets, que restringe buckets com política pública.', correct: true, consequence: 'Na avaliação, ignora o acesso público concedido pela política existente, sem apagá-la.' },
        { id: 'd', text: 'Nenhum: basta esperar, pois o BlockPublicPolicy age sobre as existentes.', correct: false, consequence: 'O BlockPublicPolicy só rejeita novas políticas públicas; a antiga continua valendo.' },
      ],
      explanation: [
        'O Block Public Access tem dois pares de ajustes. **BlockPublicAcls** e **BlockPublicPolicy** rejeitam novas concessões públicas. **IgnorePublicAcls** e **RestrictPublicBuckets** neutralizam, na avaliação, as que já existem. Como o acesso vem de uma política antiga, o ajuste que resolve é o **RestrictPublicBuckets**.',
        'BlockPublicAcls e IgnorePublicAcls tratam ACLs, não políticas. E o BlockPublicPolicy não age sobre a política existente: só impede que uma nova política pública seja gravada.',
        '**Regra prática:** "Block" barra o que vai chegar; "Ignore" e "Restrict" neutralizam o que já está lá. Para garantir que nada fique público, ligue os quatro, de preferência na conta inteira. E lembre que os ajustes não alteram as políticas: desligá-los reativa o acesso.',
      ],
    },
    {
      id: 'rv:fnd.f03.site-sem-bucket-publico',
      kind: 'decision',
      title: 'Site público com a conta toda fechada',
      prompt:
        'Uma editora ligou o S3 Block Public Access na conta inteira, e a segurança **não aceita desligá-lo**. Agora o marketing quer publicar um site de divulgação cujos arquivos estáticos ficam num bucket S3, aberto para qualquer visitante na internet. Qual solução atende aos dois requisitos?',
      concepts: [{ id: 's3.block-public-access' }, { id: 'srm.s3' }],
      xp: 5,
      difficulty: 2,
      domain: 'd1',
      options: [
        { id: 'a', text: 'Desligar o Block Public Access só no bucket do site e dar a ele uma política pública.', correct: false, consequence: 'Com o ajuste ligado na conta, desligá-lo no bucket não basta, e a segurança proibiu desligá-lo.' },
        { id: 'b', text: 'Publicar os arquivos com ACLs públicas, objeto por objeto.', correct: false, consequence: 'O Block Public Access barra e ignora ACLs públicas: os arquivos continuariam fechados.' },
        { id: 'c', text: 'Gerar URLs pré-assinadas de sete dias e publicá-las nas páginas do site.', correct: false, consequence: 'Os links expiram em uma semana e teriam de ser refeitos sem parar: não serve a um site permanente.' },
        { id: 'd', text: 'Servir o site pelo CloudFront com origin access control, mantendo o bucket privado.', correct: true, consequence: 'Os visitantes acessam o CloudFront; só a distribuição lê o bucket, que continua privado.' },
      ],
      explanation: [
        'O bucket não precisa ser público para o conteúdo ser público. Com o **CloudFront** e o **origin access control**, os visitantes acessam a distribuição, e a bucket policy autoriza só ela a ler os arquivos. O bucket continua privado, e o Block Public Access fica ligado.',
        'Desligar o ajuste fere o requisito da segurança, e com ele ligado na conta o ajuste do bucket nem resolveria. ACLs públicas são justamente o que o Block Public Access barra. URLs pré-assinadas servem para links temporários, não para um site.',
        '**Regra prática:** para conteúdo que precisa ser público, a combinação esperada é CloudFront com origin access control e o bucket privado, com o Block Public Access ligado.',
      ],
    },
    {
      id: 'rv:fnd.f03.outposts-na-fabrica',
      kind: 'decision',
      title: 'O rack que fica dentro da fábrica',
      prompt:
        'Uma fábrica instalou um AWS Outposts rack numa sala do próprio prédio. A auditoria de segurança pergunta **quem responde pelo controle de acesso físico** ao equipamento e pela manutenção do hardware. Qual divisão está correta?',
      concepts: [{ id: 'srm.outposts' }, { id: 'srm.aws-scope' }],
      xp: 5,
      difficulty: 2,
      domain: 'd1',
      options: [
        { id: 'a', text: 'A AWS responde pelos dois, como em qualquer data center da Região.', correct: false, consequence: 'A sala é da fábrica: a AWS não controla quem entra num prédio que não é dela.' },
        { id: 'b', text: 'A fábrica controla o acesso físico ao local; a AWS mantém o hardware.', correct: true, consequence: 'O local, a energia e a rede são da fábrica; o hardware continua sendo da AWS, que o opera.' },
        { id: 'c', text: 'A fábrica responde pelos dois, inclusive pela troca de peças do rack.', correct: false, consequence: 'O hardware é da AWS e gerenciado por ela, mesmo instalado no cliente.' },
        { id: 'd', text: 'Ninguém responde pelo acesso, porque os dados do rack ficam criptografados.', correct: false, consequence: 'Criptografia não substitui controle de acesso físico, e alguém precisa responder por ele.' },
      ],
      explanation: [
        'No **Outposts**, a regra "segurança física é da AWS" muda. O equipamento fica no local do cliente, que responde pela **segurança física e pelo controle de acesso** em volta dele, além de energia e rede. O **hardware continua sendo da AWS**, que o gerencia e, na devolução, remove a Nitro Security Key, tornando os dados irrecuperáveis.',
        'Atribuir tudo à AWS ignora que o prédio é da fábrica. Atribuir tudo à fábrica ignora que o hardware é gerenciado pela AWS. E criptografia não dispensa controle de acesso.',
        '**Regra prática:** nas Regiões, a segurança física é sempre da AWS. No Outposts, o local e o acesso a ele passam para o cliente; o hardware continua com a AWS.',
      ],
    },
  ],
}
