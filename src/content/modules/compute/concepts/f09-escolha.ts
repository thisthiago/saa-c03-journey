/**
 * Conceitos da Fase 9 — Escolhendo a computação.
 * Fatos conferidos em 20/10/2026 (ver docs/VERIFICACAO-DE-CONTEUDO.md).
 * Outposts e Wavelength reaproveitam infra.outposts e infra.wavelength da AWS Foundations.
 */
import type { ConceptDef } from '../../../../engine/types'
import { R } from './refs'

export const F09_CMP_CONCEPTS: ConceptDef[] = [
  {
    id: 'cmp.spectrum',
    title: 'Do servidor à função',
    officialName: 'AWS compute options',
    serviceIds: ['aws.ec2', 'aws.ecs', 'aws.fargate', 'aws.lambda'],
    summary: 'Quanto mais perto da função, menos você administra. No **EC2**, você cuida do sistema operacional, dos patches e da escala. No **ECS ou EKS em EC2**, cuida das instâncias do cluster. No **Fargate**, só dos contêineres. Na **Lambda**, só do código, com o limite de **15 minutos** por invocação.',
    explanation: [
      'A escolha de computação é um equilíbrio entre controle e trabalho. Cada passo em direção à função tira uma responsabilidade da equipe (sistema operacional, instâncias, orquestração), mas também impõe limites (tempo de execução, ambiente de runtime, acesso ao host).',
      'Exemplo: uma empresa tem três cargas. Um sistema legado que exige um agente instalado no Windows fica no EC2. Uma API em contêiner, com tráfego constante, vai para o ECS com Fargate. Um redimensionador de imagens acionado por upload, com picos imprevisíveis, vai para o Lambda.',
      '**Regra prática:** atenda primeiro a todos os requisitos rígidos e, entre as opções que sobram, escolha a que exige menos trabalho de operação.',
    ],
    commonMistakes: ['Escolher Lambda para um processamento que passa de 15 minutos', 'Escolher EKS quando ninguém no time pediu Kubernetes'],
    exam: {
      domains: ['d2', 'd3'],
      relevance: 'alta',
      notes: 'Questões de computação descrevem requisitos que eliminam opções: duração acima de 15 minutos tira o Lambda; "sem gerenciar servidores" tira o EC2; "já usa Kubernetes" aponta para o EKS; "controle do sistema operacional", para o EC2. Entre as opções que sobram, a resposta costuma ser a de menor esforço operacional.',
    },
    references: [R.ec2What, R.ecsFargate, R.lambdaQuotas],
    tags: ['fundamentos'],
  },
  {
    id: 'cmp.batch',
    title: 'AWS Batch',
    officialName: 'AWS Batch',
    serviceIds: ['aws.batch'],
    summary: 'Roda **jobs em lote** a partir de **filas**. A **job definition** descreve o job (imagem do contêiner, vCPU, memória). A **job queue** guarda os jobs com prioridade. O **compute environment** é a capacidade: num ambiente gerenciado, o Batch lança e escala **Fargate**, instâncias **EC2 On-Demand ou Spot** ou **ECS Managed Instances** conforme os jobs chegam.',
    commonMistakes: ['Montar um Auto Scaling group com scripts para drenar uma fila de jobs que o Batch já gerencia'],
    facts: ['Os jobs rodam como contêineres, sobre o ECS ou o EKS.', 'Um job pode depender de outro: só começa quando o primeiro termina com sucesso.', 'Filas com prioridade: uma fila de alta prioridade para o que é urgente e outra de baixa para o que pode esperar capacidade mais barata.'],
    exam: {
      domains: ['d3', 'd4'],
      relevance: 'media',
      notes: 'Sinais: "milhares de jobs em lote", "fila com prioridades" e "usar Spot para reduzir custo". A resposta é o AWS Batch, que gerencia a capacidade sozinho.',
    },
    references: [R.batchWhat, R.batchComponents],
    tags: ['custos'],
  },
  {
    id: 'cmp.beanstalk',
    title: 'Elastic Beanstalk',
    officialName: 'AWS Elastic Beanstalk',
    serviceIds: ['aws.elastic-beanstalk'],
    summary: 'Você envia o código e o Beanstalk cria e opera o ambiente: **instâncias, balanceador, Auto Scaling e monitoramento**. Não há cobrança pelo Beanstalk: você paga pelos recursos que ele cria, e eles ficam visíveis e configuráveis na sua conta.',
    facts: ['Suporta plataformas como Java, .NET, Node.js, Python, PHP, Ruby, Go e Docker.'],
    exam: {
      domains: ['d3'],
      relevance: 'media',
      notes: 'Sinal: "a equipe quer só enviar o código" de uma aplicação web tradicional, com balanceador e Auto Scaling criados automaticamente. A resposta é o Elastic Beanstalk.',
    },
    references: [R.beanstalkWhat],
    tags: ['fundamentos'],
  },
  {
    id: 'cmp.beanstalk-deploy',
    title: 'Políticas de implantação do Beanstalk',
    officialName: 'Elastic Beanstalk deployment policies',
    serviceIds: ['aws.elastic-beanstalk'],
    summary: '**All at once**: todas as instâncias ficam fora do ar por pouco tempo. **Rolling**: em lotes, com capacidade reduzida. **Rolling with additional batch**: lança um lote extra antes e mantém a capacidade. **Immutable**: um conjunto novo de instâncias num Auto Scaling group separado. **Traffic splitting**: igual ao immutable, mas manda uma porcentagem do tráfego à versão nova por um tempo (canary).',
    commonMistakes: ['Esperar zero indisponibilidade do All at once'],
    facts: ['Blue/green: a versão nova vai para outro ambiente e a troca é feita pela troca de URLs (CNAME) dos dois ambientes.', 'No immutable e no traffic splitting, se as instâncias novas falham nos health checks, elas são terminadas e as antigas continuam intactas.', 'Traffic splitting exige um Application Load Balancer.'],
    exam: {
      domains: ['d2'],
      relevance: 'media',
      notes: 'Escolha a política pelo requisito: sem indisponibilidade e sem perder capacidade, rolling with additional batch ou immutable; volta rápida em caso de falha, immutable ou blue/green; testar a versão nova com parte do tráfego, traffic splitting.',
    },
    references: [R.beanstalkDeploy, R.beanstalkBlueGreen],
    tags: ['disponibilidade'],
  },
  {
    id: 'cmp.sar',
    title: 'Serverless Application Repository',
    officialName: 'AWS Serverless Application Repository',
    serviceIds: ['aws.serverless-app-repo'],
    summary: 'Repositório de **aplicações sem servidor prontas**, descritas com o AWS SAM. Você implanta uma aplicação publicada por outra pessoa sem montá-la do zero, ou publica as suas, de forma **privada**, compartilhada com contas específicas ou **pública**.',
    exam: { domains: ['d3'], relevance: 'baixa' },
    references: [R.sarWhat],
    tags: ['fundamentos'],
  },
  {
    id: 'cmp.anywhere',
    title: 'ECS Anywhere e EKS Anywhere',
    officialName: 'Amazon ECS Anywhere and Amazon EKS Anywhere',
    serviceIds: ['aws.ecs', 'aws.eks'],
    summary: '**ECS Anywhere** registra servidores e VMs da empresa num cluster ECS, com o launch type **EXTERNAL** e o agente do Systems Manager cuidando das credenciais. **EKS Anywhere** cria clusters Kubernetes baseados no **EKS Distro** na infraestrutura da empresa (vSphere, bare metal, Nutanix); **você opera** o ciclo de vida dos clusters.',
    facts: ['O ECS Anywhere não tem balanceador de carga do ELB: serve melhor para cargas que geram tráfego de saída ou processam dados.', 'O EKS Anywhere pode rodar sem conexão com a AWS, inclusive em ambientes isolados.', 'No Outposts, o hardware é da AWS; nos Anywhere, os servidores são da empresa.'],
    commonMistakes: ['Confundir ECS Anywhere (servidores da empresa) com Outposts (hardware da AWS no local)'],
    exam: { domains: ['d3'], relevance: 'media' },
    references: [R.ecsAnywhere, R.eksDeployment],
    tags: ['hibrido'],
  },
  {
    id: 'cmp.evs',
    title: 'VMware na AWS',
    officialName: 'Amazon Elastic VMware Service (Amazon EVS)',
    serviceIds: ['aws.evs'],
    summary: 'O **Amazon EVS** roda o **VMware Cloud Foundation** em instâncias **bare metal do EC2** dentro da sua VPC. Serve para migrar cargas VMware **sem trocar endereços IP**, sem treinar a equipe de novo e sem reescrever os procedimentos. Você opera o ambiente, sozinho ou com um parceiro da AWS.',
    facts: ['A lista de serviços do exame cita o VMware Cloud on AWS; a página da AWS sobre VMware hoje apresenta o Amazon EVS.'],
    exam: { domains: ['d3'], relevance: 'baixa' },
    references: [R.evsWhat],
    tags: ['hibrido', 'migracao'],
  },
]
