/**
 * Conceitos da Fase 8 — Contêineres.
 * Fatos conferidos em 20/10/2026 (ver docs/VERIFICACAO-DE-CONTEUDO.md).
 */
import type { ConceptDef } from '../../../../engine/types'
import { R } from './refs'

export const F08_CMP_CONCEPTS: ConceptDef[] = [
  {
    id: 'ecs.basics',
    title: 'Peças do ECS',
    officialName: 'Amazon ECS components',
    serviceIds: ['aws.ecs'],
    summary: 'A **task definition** é a receita da aplicação (imagem, CPU, memória, portas, roles). A **task** é uma execução dela, que faz o trabalho e termina. O **service** mantém um número de tasks sempre rodando, integra com o balanceador e escala. O **cluster** é onde tudo roda.',
    explanation: [
      'Pense na task definition como a planta de uma casa, na task como uma casa construída a partir dela e no service como a construtora que garante que sempre existam N casas de pé, trocando as que caem. O limite da comparação: tasks são descartáveis e substituídas o tempo todo, e não reformadas.',
      'Exemplo: uma API roda como um service com 4 tasks atrás de um ALB. Se uma task falha, o service lança outra; se a CPU sobe, o Service Auto Scaling aumenta o número de tasks.',
    ],
    facts: ['O Service Auto Scaling muda o número desejado de tasks; o Cluster Auto Scaling ajusta as instâncias EC2 do cluster.'],
    exam: {
      domains: ['d2', 'd3'],
      relevance: 'alta',
      notes: 'Sinais: "processo que precisa ficar sempre rodando" aponta para um service; "trabalho que roda e termina", para uma task avulsa ou agendada. Para escalar contêineres, ajuste o número desejado de tasks do service.',
    },
    references: [R.ecsWhat],
    tags: ['fundamentos'],
  },
  {
    id: 'ecs.capacity',
    title: 'Onde as tasks rodam',
    officialName: 'Amazon ECS capacity options',
    serviceIds: ['aws.ecs', 'aws.fargate'],
    summary: '**Fargate**: sem servidores, você paga por vCPU e memória da task. **EC2**: você escolhe e gerencia as instâncias do cluster. **ECS Managed Instances**: instâncias EC2 com a gestão (provisionamento, patches, escala) feita pela AWS. **ECS Anywhere**: servidores e VMs no seu data center.',
    explanation: [
      'A escolha é sobre quem cuida das máquinas. No Fargate, ninguém da sua equipe: você define a CPU e a memória da task. No EC2, a equipe escolhe, corrige e escala as instâncias, o que dá controle (GPU, tipos específicos) e trabalho. O ECS Managed Instances fica no meio: instâncias EC2 com a gestão feita pela AWS.',
      '**Regra prática:** sem um requisito de controle das instâncias, use o Fargate.',
    ],
    exam: {
      domains: ['d3'],
      relevance: 'alta',
      notes: 'Sinal: "executar contêineres sem gerenciar servidores" aponta para o Fargate. Requisitos como GPU específica ou controle do host apontam para o ECS no EC2.',
    },
    references: [R.ecsWhat],
    tags: ['fundamentos'],
  },
  {
    id: 'fargate.isolation',
    title: 'Fargate',
    officialName: 'AWS Fargate',
    serviceIds: ['aws.fargate', 'aws.ecs', 'aws.eks'],
    summary: 'Computação **sem servidor** para contêineres do ECS e do EKS: nada de escolher, corrigir ou escalar instâncias. Cada task do Fargate tem **o próprio limite de isolamento**: não divide kernel, CPU, memória nem interface de rede com outras tasks.',
    facts: ['No EC2, no ECS Managed Instances e no ECS Anywhere, as tasks de uma instância não têm esse isolamento entre si.', 'O Compute Savings Plan cobre o Fargate.'],
    exam: {
      domains: ['d1', 'd3'],
      relevance: 'alta',
      notes: 'Sinais: "contêineres sem gerenciar servidores", "isolamento entre tarefas" e "menor esforço operacional". A resposta é o Fargate, no ECS ou no EKS.',
    },
    references: [R.ecsTaskRole, R.ecsFargate],
    tags: ['seguranca'],
  },
  {
    id: 'ecs.roles',
    title: 'Task role × execution role',
    officialName: 'Amazon ECS task role and task execution role',
    serviceIds: ['aws.ecs', 'aws.iam'],
    summary: 'A **execution role** é do agente do ECS e do Fargate: **puxar a imagem do ECR**, mandar **logs** ao CloudWatch e ler **segredos** para a task. A **task role** é do **código da aplicação**: ler um bucket, gravar numa tabela. As duas confiam em `ecs-tasks.amazonaws.com`.',
    commonMistakes: ['Dar as permissões da aplicação à execution role, ou as de puxar imagem à task role'],
    facts: ['Com uma task role, o SDK no contêiner usa só as credenciais dela, sem herdar as da instância.', 'Os logs no CloudTrail mostram qual task recebeu as credenciais.'],
    exam: {
      domains: ['d1'],
      relevance: 'alta',
      notes: 'Se o contêiner não consegue puxar a imagem do ECR ou ler um segredo na inicialização, o problema está na execution role. Se a aplicação não consegue acessar o S3 ou o DynamoDB, está na task role.',
    },
    references: [R.ecsTaskRole, R.ecsExecutionRole],
    tags: ['seguranca'],
  },
  {
    id: 'eks.basics',
    title: 'Amazon EKS',
    officialName: 'Amazon Elastic Kubernetes Service',
    serviceIds: ['aws.eks'],
    summary: '**Kubernetes gerenciado**: a AWS opera o **plano de controle**. No **EKS standard**, você cuida dos nós (grupos de nós gerenciados, nós próprios ou Fargate). No **EKS Auto Mode**, a AWS também provisiona, escala e corrige os nós. **EKS Anywhere** e **Hybrid Nodes** levam o EKS ao seu data center.',
    facts: ['O EKS é Kubernetes certificado: aplicações e ferramentas do Kubernetes funcionam sem reescrita.', 'O EKS tem preço por cluster; os nós são cobrados à parte (EC2 ou Fargate).'],
    exam: {
      domains: ['d3'],
      relevance: 'alta',
      notes: 'Sinais: "a empresa já usa Kubernetes", "migrar manifestos e ferramentas do Kubernetes sem reescrever" e "portabilidade entre ambientes". A resposta é o EKS; para operar menos os nós, o EKS com Fargate ou com Auto Mode.',
    },
    references: [R.eksWhat],
    tags: ['fundamentos'],
  },
  {
    id: 'ecs.vs-eks',
    title: 'ECS ou EKS?',
    officialName: 'Choosing between Amazon ECS and Amazon EKS',
    serviceIds: ['aws.ecs', 'aws.eks'],
    summary: 'Os dois orquestram contêineres. O **ECS** é o orquestrador da AWS, com menos peças para operar. O **EKS** é **Kubernetes**: a escolha quando a empresa já usa Kubernetes, quer as mesmas ferramentas em outros ambientes ou precisa de recursos do ecossistema.',
    recommendations: ['Sem um motivo para Kubernetes, o ECS com Fargate costuma ser o caminho com menos esforço operacional.'],
    exam: { domains: ['d3'], relevance: 'media' },
    references: [R.ecsWhat, R.eksWhat],
    tags: ['fundamentos'],
  },
  {
    id: 'ecr.registry',
    title: 'Amazon ECR',
    officialName: 'Amazon Elastic Container Registry',
    serviceIds: ['aws.ecr'],
    summary: 'Registro gerenciado de **imagens de contêiner**, privado (com permissões do IAM) ou público. Faz **scan de vulnerabilidades** ao enviar a imagem, apaga imagens velhas com **lifecycle policies** e **replica** entre Regiões e contas.',
    facts: ['Pull through cache mantém no ECR uma cópia de imagens de registros externos.', 'Você paga pelo armazenamento e pela transferência das imagens.'],
    exam: {
      domains: ['d1', 'd2'],
      relevance: 'media',
      notes: 'Sinais: "armazenar imagens de contêiner com controle de acesso pelo IAM", "verificar vulnerabilidades nas imagens" e "replicar imagens para outra Região". A resposta é o ECR.',
    },
    references: [R.ecrWhat],
    tags: ['seguranca'],
  },
]
