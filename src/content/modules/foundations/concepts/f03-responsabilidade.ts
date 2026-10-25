/**
 * Conceitos da Fase 3 — Shared Responsibility Model.
 * Fatos conferidos em 18/10/2026 (ver docs/VERIFICACAO-DE-CONTEUDO.md).
 */
import type { ConceptDef } from '../../../../engine/types'

const SRM = { title: 'Shared Responsibility Model', url: 'https://aws.amazon.com/compliance/shared-responsibility-model/' }
const LAMBDA_SEC = { title: 'Security in AWS Lambda', url: 'https://docs.aws.amazon.com/lambda/latest/dg/lambda-security.html' }
const LAMBDA_RT = { title: 'Understanding how Lambda manages runtime version updates', url: 'https://docs.aws.amazon.com/lambda/latest/dg/runtimes-update.html' }
const RDS_SEC = { title: 'Security in Amazon RDS', url: 'https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/UsingWithRDS.html' }
const RDS_MAINT = { title: 'Maintaining a DB instance', url: 'https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/USER_UpgradeDBInstance.Maintenance.html' }
const OP_SEC = { title: 'Security in AWS Outposts', url: 'https://docs.aws.amazon.com/outposts/latest/userguide/security.html' }
const OP_FAQ = { title: 'AWS Outposts rack FAQs', url: 'https://aws.amazon.com/outposts/rack/faqs/' }

export const F03_FOUNDATIONS_CONCEPTS: ConceptDef[] = [
  {
    id: 'srm.model',
    title: 'Modelo de Responsabilidade Compartilhada',
    officialName: 'AWS Shared Responsibility Model',
    serviceIds: ['aws.global-infrastructure'],
    summary: 'A segurança é dividida: a AWS cuida da **segurança DA nuvem** (a infraestrutura que executa os serviços: hardware, software, rede e instalações); o cliente cuida da **segurança NA nuvem**, e o tamanho dessa parte depende dos serviços que escolhe.',
    explanation: [
      'Pense num prédio de apartamentos: o condomínio cuida da estrutura, da portaria e dos elevadores; cada morador tranca a própria porta e decide quem entra em casa. O limite da comparação: na AWS, o tamanho da parte do cliente muda conforme o serviço. No EC2, o cliente cuida de quase tudo acima do hardware; no S3, de bem menos.',
      'A linha divisória é o controle: quem consegue mexer numa camada responde por ela. A AWS controla as instalações, o hardware, a rede física e o software que ela opera. O cliente controla o que coloca e configura: dados, identidades, permissões, regras de rede e, nos serviços de infraestrutura, o sistema operacional.',
      'Exemplo: um bucket S3 com dados de clientes fica público por causa de uma bucket policy mal escrita. A infraestrutura do S3 funcionou como prometido; a falha está na configuração de acesso, que é responsabilidade do cliente.',
      '**Regra prática:** se o cliente pode configurar, a responsabilidade é dele; se ele não tem como acessar, é da AWS.',
    ],
    comparisons: [
      { with: 'srm.by-service', text: 'O modelo define a divisão em geral; a divisão por serviço mostra onde a linha passa em cada caso (EC2, RDS, Lambda, S3).' },
    ],
    facts: ['A responsabilidade do cliente é determinada pelos serviços que ele seleciona, além da sensibilidade dos dados, dos requisitos da empresa e das leis aplicáveis.'],
    exam: {
      domains: ['d1'],
      relevance: 'alta',
      notes: 'O guia da SAA-C03 cita o modelo de responsabilidade compartilhada na tarefa 1.1. Nas questões, ele aparece como a pergunta sobre quem deve agir: aplicar patches no sistema operacional de uma instância EC2, criptografar dados e restringir um bucket são tarefas do cliente; proteger o data center e o hardware é tarefa da AWS.',
    },
    references: [SRM, LAMBDA_SEC],
    tags: ['seguranca', 'fundamentos'],
  },
  {
    id: 'srm.aws-scope',
    title: 'Segurança DA nuvem',
    officialName: 'Security of the cloud',
    serviceIds: ['aws.global-infrastructure'],
    summary: 'A AWS protege a infraestrutura que executa todos os serviços: **instalações físicas**, **hardware**, **rede física** e o software das camadas que ela gerencia. Controles físicos e ambientais são **herdados** pelo cliente.',
    explanation: [
      'O cliente não tem acesso físico aos data centers nem ao hardware, então não tem como protegê-los: essa camada é da AWS. Os controles físicos e ambientais são herdados, e numa auditoria o cliente comprova esses controles com os relatórios de conformidade da AWS (disponíveis no [[artifact.what|AWS Artifact]]), em vez de implementá-los.',
    ],
    comparisons: [
      { with: 'srm.customer-scope', text: 'A segurança da nuvem é o que o cliente não tem como tocar. A segurança na nuvem é tudo o que ele configura.' },
    ],
    exam: { domains: ['d1'], relevance: 'alta' },
    references: [SRM],
    tags: ['seguranca', 'fundamentos'],
  },
  {
    id: 'srm.customer-scope',
    title: 'Segurança NA nuvem',
    officialName: 'Security in the cloud',
    serviceIds: ['aws.global-infrastructure', 'aws.iam'],
    summary: 'O cliente responde pelo que está sob o seu controle: **dados** (classificação, criptografia escolhida), **identidades e permissões**, **configuração dos recursos** e **regras de rede**. Em nenhum serviço isso passa para a AWS.',
    explanation: [
      'Mesmo no serviço mais gerenciado, algumas decisões nunca saem das mãos do cliente: que dados guardar e como classificá-los, quem pode acessá-los, se serão criptografados e com qual chave, e que portas e origens a rede aceita. A AWS oferece as ferramentas (IAM, KMS, security groups, Block Public Access), mas não decide por você.',
      'Exemplo: o DynamoDB é totalmente gerenciado, mas uma política IAM que dá `dynamodb:*` a todos os desenvolvedores é uma falha do cliente.',
      '**Regra prática:** dados, identidades e configuração são sempre do cliente.',
    ],
    commonMistakes: ['Achar que, num serviço gerenciado, a AWS também decide quem pode acessar os dados.'],
    exam: { domains: ['d1'], relevance: 'alta' },
    references: [SRM],
    tags: ['seguranca', 'fundamentos'],
  },
  {
    id: 'srm.by-service',
    title: 'A divisão muda com o serviço',
    officialName: 'Shared responsibility by service type',
    serviceIds: ['aws.ec2', 'aws.rds', 'aws.lambda', 'aws.s3'],
    summary: 'Em **infraestrutura** (EC2), o cliente gerencia o SO convidado, os patches e o firewall. Em **serviços gerenciados** (RDS), a AWS opera SO e motor, mas o cliente decide janelas e versões. Em **serverless** e serviços abstratos (Lambda, S3), a AWS opera SO e plataforma; o cliente cuida de código, dados e permissões.',
    explanation: [
      'Quanto mais gerenciado o serviço, mais camadas a AWS assume. No EC2, a AWS entrega a máquina virtual, e o cliente cuida de tudo dentro dela. No RDS, a AWS assume o sistema operacional e o motor do banco, mas o cliente escolhe a janela de manutenção e as versões. No Lambda e no S3, o cliente só lida com o código, os dados e as permissões.',
      'Exemplo: a mesma aplicação web pode rodar no EC2, com a equipe aplicando patches no Linux, ou no Lambda, em que os patches do runtime gerenciado ficam com a AWS. Mudar de serviço muda a lista de tarefas de segurança da equipe.',
      '**Regra prática:** se a questão pede menos esforço com patches e sistema operacional, a resposta tende a um serviço mais gerenciado.',
    ],
    exam: {
      domains: ['d1'],
      relevance: 'alta',
      notes: 'Questões que pedem "reduzir o esforço operacional" ou "não gerenciar patches do sistema operacional" costumam apontar para serviços gerenciados ou serverless, como RDS no lugar de um banco instalado no EC2, ou Lambda e Fargate no lugar de instâncias. Confira se o serviço escolhido ainda atende aos outros requisitos.',
    },
    references: [SRM, LAMBDA_RT, RDS_MAINT],
    tags: ['seguranca'],
  },
  {
    id: 'srm.shared-controls',
    title: 'Controles compartilhados',
    officialName: 'Shared controls',
    serviceIds: ['aws.global-infrastructure'],
    summary: 'Controles que valem nas duas camadas, cada parte no seu contexto: **gestão de patches** (AWS na infraestrutura; cliente no SO convidado e nas aplicações), **gestão de configuração** e **conscientização e treinamento** (cada um treina seus funcionários).',
    explanation: [
      'Alguns temas aparecem dos dois lados da linha, cada parte cuidando do que controla. Nos patches, a AWS corrige a infraestrutura, e o cliente corrige o sistema operacional convidado e as aplicações. Na configuração, a AWS configura os próprios equipamentos, e o cliente configura sistemas operacionais, bancos e aplicações. No treinamento, cada parte prepara as próprias equipes.',
    ],
    exam: { domains: ['d1'], relevance: 'media' },
    references: [SRM],
    tags: ['seguranca'],
  },
  {
    id: 'srm.ec2',
    title: 'Responsabilidades no EC2',
    officialName: 'Amazon EC2 — customer responsibilities',
    serviceIds: ['aws.ec2'],
    summary: 'No EC2, o cliente faz toda a configuração de segurança: **atualizações e patches do SO convidado**, software instalado, **security groups**, perfis de instância e dados.',
    explanation: [
      'O EC2 é infraestrutura como serviço: a AWS entrega o hardware, a virtualização e a rede, e para por aí. Tudo o que roda dentro da instância é do cliente: o sistema operacional e os patches, o software, as regras dos security groups, a role da instância e a criptografia dos volumes.',
      'Exemplo: uma vulnerabilidade crítica é publicada para o kernel Linux. Nas instâncias EC2, aplicar a correção é tarefa do cliente, que pode automatizá-la com o [[ssm.patch-manager|Patch Manager]] do Systems Manager.',
      '**Regra prática:** no EC2, do sistema operacional para cima, tudo é do cliente.',
    ],
    exam: {
      domains: ['d1'],
      relevance: 'alta',
      notes: 'Se o enunciado pergunta quem aplica patches no sistema operacional de instâncias EC2, a resposta é o cliente. Para reduzir esse esforço, as alternativas costumam ser automação, com o Systems Manager, ou a troca por um serviço gerenciado.',
    },
    references: [SRM],
    tags: ['seguranca'],
  },
  {
    id: 'srm.rds',
    title: 'Responsabilidades no RDS',
    officialName: 'Amazon RDS — shared responsibilities',
    serviceIds: ['aws.rds'],
    summary: 'A AWS opera o hardware e executa as atualizações de SO e do motor. Mas **atualizações opcionais de SO não são aplicadas automaticamente**, e o cliente escolhe a **janela de manutenção**; ele também cuida de security groups, usuários do banco, IAM e criptografia.',
    explanation: [
      'No RDS, a AWS assume a instalação, o sistema operacional e o motor do banco, e o cliente não tem acesso ao servidor. Mas a operação do banco continua cheia de decisões do cliente: quando as manutenções acontecem, quais atualizações opcionais aplicar, quem acessa (security groups, usuários do banco, IAM) e se os dados são criptografados.',
      'Exemplo: uma atualização obrigatória do sistema operacional é aplicada pela AWS na janela de manutenção escolhida pelo cliente. Se a janela coincide com o pico de vendas, o problema é da configuração do cliente.',
      '**Regra prática:** no RDS, a AWS opera o servidor; o cliente decide o acesso, a criptografia e o calendário.',
    ],
    facts: ['Atualizações de SO obrigatórias têm data e são aplicadas depois dela, numa janela de manutenção.'],
    exam: { domains: ['d1'], relevance: 'media' },
    references: [RDS_SEC, RDS_MAINT],
    tags: ['seguranca'],
  },
  {
    id: 'srm.lambda',
    title: 'Responsabilidades no Lambda',
    officialName: 'AWS Lambda — shared responsibilities',
    serviceIds: ['aws.lambda'],
    summary: 'Com runtime gerenciado no modo Auto, a AWS aplica as atualizações do runtime. O cliente cuida do **código**, das **dependências**, da **função de execução (IAM)** e dos dados. Em funções com **imagem de contêiner**, reconstruir a imagem com os patches é tarefa do cliente.',
    explanation: [
      'No Lambda, o cliente não vê servidores: a AWS opera a infraestrutura e o sistema operacional e, no runtime gerenciado com atualização automática, também aplica os patches do runtime. Ao cliente sobra o que ele escreve e configura: o código, as bibliotecas que empacota, as permissões da função de execução e os dados.',
      'A exceção é a função empacotada como imagem de contêiner: a imagem é do cliente, e reconstruí-la com as correções também.',
      '**Regra prática:** no Lambda, a AWS cuida do ambiente de execução; o código e as dependências são do cliente.',
    ],
    exam: { domains: ['d1'], relevance: 'media' },
    references: [LAMBDA_SEC, LAMBDA_RT],
    tags: ['seguranca'],
  },
  {
    id: 'srm.s3',
    title: 'Responsabilidades no S3',
    officialName: 'Amazon S3 — customer responsibilities',
    serviceIds: ['aws.s3'],
    summary: 'A AWS opera infraestrutura, SO e plataforma. O cliente gerencia os **dados** (inclusive as opções de criptografia) e **quem acessa**: políticas IAM, bucket policies e Block Public Access.',
    explanation: [
      'O S3 é um serviço abstrato: o cliente não vê servidores, sistema operacional nem discos. Sobra o que importa para a segurança dos dados: quem pode acessá-los (políticas IAM, bucket policies, Block Public Access), se são criptografados e com qual chave, e por quanto tempo são guardados.',
      'Exemplo: quando dados vazam de um bucket público, a causa é a configuração de acesso, e não uma falha da infraestrutura do S3.',
      '**Regra prática:** no S3, a AWS guarda os objetos com durabilidade; o cliente decide quem os lê.',
    ],
    exam: { domains: ['d1'], relevance: 'alta' },
    references: [SRM],
    tags: ['seguranca'],
  },
  {
    id: 'srm.outposts',
    title: 'Responsabilidades no Outposts',
    officialName: 'AWS Outposts — physical security',
    serviceIds: ['aws.outposts'],
    summary: 'No Outposts, a regra de "segurança física é da AWS" muda: o equipamento fica no local do cliente, e o **cliente responde pela segurança física e pelo controle de acesso** em volta dele, além de energia e rede do local.',
    facts: ['Antes da devolução do hardware, a AWS remove a Nitro Security Key, o que torna os dados criptograficamente irrecuperáveis.'],
    exam: { domains: ['d1'], relevance: 'baixa' },
    references: [OP_SEC, OP_FAQ],
    tags: ['seguranca', 'hibrido'],
  },
  {
    id: 'srm.incident',
    title: 'Incidente: de quem é a causa?',
    officialName: 'Shared responsibility in incident analysis',
    serviceIds: ['aws.global-infrastructure', 'aws.health'],
    summary: 'Num incidente, cada causa cai num lado: patch não aplicado no EC2, bucket público ou permissão excessiva são do cliente; falha de hardware sob um serviço gerenciado é da AWS. Mas **a resiliência a falhas da AWS é responsabilidade do cliente**: Multi-AZ, backups e arquitetura.',
    explanation: [
      'Para atribuir a causa de um incidente, pergunte quem controla a camada que falhou naquele serviço. Um detalhe pega muita gente: a AWS responde pela falha de um componente da infraestrutura, mas não pela arquitetura que dependia dele.',
      'Exemplo: uma AZ falha, e uma aplicação que rodava só nela fica fora do ar. A falha da AZ é da AWS, mas a indisponibilidade da aplicação é consequência de uma escolha do cliente, que não distribuiu a aplicação entre AZs.',
      '**Regra prática:** a AWS responde pela falha do componente; o cliente responde por ter planejado, ou não, essa falha.',
    ],
    comparisons: [
      { with: 'infra.spof', text: 'A análise de incidente pergunta de quem foi a causa; a busca por pontos únicos de falha pergunta o que o cliente deveria ter duplicado para que a causa não derrubasse o sistema.' },
    ],
    recommendations: ['Para cada causa, pergunte "quem controla esta camada neste serviço?" antes de atribuir culpa.'],
    exam: {
      domains: ['d1', 'd2'],
      relevance: 'media',
      notes: 'Questões de incidente pedem para separar a causa (de quem é a camada que falhou) da prevenção (o que o cliente devia ter desenhado). Mesmo quando a causa é da AWS, a alternativa certa costuma ser uma mudança de arquitetura do cliente, como Multi-AZ, backups ou outra Região.',
    },
    references: [SRM],
    tags: ['seguranca', 'disponibilidade'],
  },
]
