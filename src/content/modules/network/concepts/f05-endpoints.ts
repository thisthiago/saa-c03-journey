/**
 * Conceitos da Fase 5 — Acesso privado a serviços.
 * Fatos conferidos em 21/10/2026 (ver docs/VERIFICACAO-DE-CONTEUDO.md).
 */
import type { ConceptDef } from '../../../../engine/types'
import { R } from './refs'

export const F05_NET_CONCEPTS: ConceptDef[] = [
  {
    id: 'pl.gateway-endpoint',
    title: 'Endpoint de gateway',
    officialName: 'Gateway VPC endpoints',
    serviceIds: ['aws.vpc', 'aws.s3', 'aws.dynamodb'],
    summary: 'O **endpoint de gateway** leva o tráfego da VPC ao **S3** ou ao **DynamoDB** sem internet gateway nem NAT, **sem custo**. Ele entra como uma **rota** com a lista de prefixos do serviço nas tabelas das sub-redes escolhidas, e essa rota, mais específica, vence a 0.0.0.0/0.',
    facts: [
      'Só o S3 e o DynamoDB têm endpoint de gateway; os dois também têm endpoint de interface.',
      'Vale só na Região onde foi criado.',
      'Não atende a rede da empresa (VPN ou Direct Connect), VPCs em peering nem o Transit Gateway: para esses casos, use endpoint de interface.',
      'O endpoint de gateway não usa o PrivateLink.',
      'Ao criar ou mudar o endpoint, conexões TCP abertas com o S3 são interrompidas.',
    ],
    commonMistakes: ['Esperar que o escritório, pela VPN, chegue ao S3 pelo endpoint de gateway da VPC'],
    exam: { domains: ['d1', 'd4'], relevance: 'alta' },
    references: [R.gatewayEndpoints, R.s3Gateway],
    tags: ['seguranca', 'custos'],
  },
  {
    id: 'pl.interface-endpoint',
    title: 'Endpoint de interface (PrivateLink)',
    officialName: 'Interface VPC endpoints',
    serviceIds: ['aws.privatelink'],
    summary: 'O **endpoint de interface** cria **interfaces de rede** com IPs privados nas suas sub-redes, uma por zona, para falar com um serviço da AWS (SQS, Secrets Manager, ECR, KMS...) **sem sair pela internet**. Funciona também para quem chega por **VPN, Direct Connect, peering ou Transit Gateway**. Cobra **por hora em cada zona** e **por GB**.',
    facts: [
      'A AWS recomenda ao menos duas zonas por endpoint em produção.',
      'Se o endpoint existir numa zona só e ela falhar, recursos das outras zonas perdem o acesso ao serviço.',
      'O serviço não consegue iniciar conexões com os seus recursos pelo endpoint.',
    ],
    commonMistakes: ['Criar o endpoint de interface numa zona só para economizar e criar um ponto único de falha'],
    exam: { domains: ['d1', 'd2', 'd4'], relevance: 'alta' },
    references: [R.interfaceEndpoints, R.privatelink],
    tags: ['seguranca', 'disponibilidade'],
  },
  {
    id: 'pl.private-dns',
    title: 'DNS privado do endpoint',
    officialName: 'Private DNS for interface endpoints',
    serviceIds: ['aws.privatelink', 'aws.route53'],
    summary: 'Com o **DNS privado** ligado, o nome público do serviço (como `sqs.us-east-1.amazonaws.com`) passa a resolver, **dentro da VPC**, para os IPs privados do endpoint. A aplicação continua usando o mesmo endereço, sem mudar uma linha.',
    facts: [
      'Exige que a VPC tenha os atributos de nomes DNS e de resolução DNS ligados.',
      'A AWS recomenda ligar o DNS privado nos endpoints de serviços da AWS.',
      'Para a rede da empresa resolver esses nomes, são precisos endpoints de entrada do Route 53 Resolver.',
    ],
    exam: { domains: ['d1'], relevance: 'media' },
    references: [R.interfaceEndpoints, R.resolver],
    tags: ['integracao'],
  },
  {
    id: 'pl.endpoint-policy',
    title: 'Política de endpoint',
    officialName: 'VPC endpoint policies',
    serviceIds: ['aws.vpc', 'aws.privatelink'],
    summary: 'A **política de endpoint** é uma política de recurso que limita **o que passa pelo endpoint**, por exemplo só os buckets da empresa. A política padrão permite tudo. Ela **não substitui** as políticas de identidade nem as de bucket: todas valem juntas.',
    facts: [
      'Cada endpoint tem uma política; sem uma definida, vale a padrão, com acesso total.',
      'No endpoint de gateway, o elemento Principal precisa ser "*"; para limitar quem, use a condição aws:PrincipalArn.',
      'Uma política de bucket pode exigir um endpoint específico com a condição aws:sourceVpce.',
    ],
    commonMistakes: ['Achar que a política do endpoint dá permissão que a política de identidade não dá'],
    exam: { domains: ['d1'], relevance: 'media' },
    references: [R.endpointPolicies, R.s3Gateway],
    tags: ['seguranca'],
  },
  {
    id: 'pl.endpoint-service',
    title: 'Serviço de endpoint (o seu serviço pelo PrivateLink)',
    officialName: 'VPC endpoint services',
    serviceIds: ['aws.privatelink', 'aws.elb'],
    summary: 'Para oferecer **o seu serviço** a outras contas ou VPCs sem peering, coloque-o atrás de um **Network Load Balancer** e crie um **serviço de endpoint**. Quem consome cria um **endpoint de interface** na própria VPC. Só o consumidor inicia conexões, e as VPCs não precisam ter blocos diferentes.',
    facts: ['O provedor libera quem pode se conectar ao serviço.', 'A AWS recomenda o serviço em pelo menos duas zonas.', 'O serviço pode ficar disponível em outras Regiões, com acesso entre Regiões.'],
    commonMistakes: ['Montar peering com dezenas de clientes para expor uma única API'],
    exam: { domains: ['d1', 'd2'], relevance: 'media' },
    references: [R.endpointServices, R.privatelink],
    tags: ['seguranca', 'integracao'],
  },
  {
    id: 'pl.nat-vs-endpoint',
    title: 'NAT Gateway ou endpoint: o custo do caminho',
    officialName: 'NAT gateway and VPC endpoint costs',
    serviceIds: ['aws.vpc', 'aws.privatelink'],
    summary: 'Pelo **NAT Gateway**, cada GB para um serviço da AWS paga o processamento do NAT. Para o **S3** e o **DynamoDB**, o **endpoint de gateway** tira esse custo. Para outros serviços com muito tráfego, o **endpoint de interface** costuma sair mais barato que o NAT, porque processa o GB por menos.',
    facts: ['Na tabela da trilha (us-east-1): NAT Gateway US$ 0,045 por hora e por GB; endpoint de interface US$ 0,01 por hora em cada zona e por GB.'],
    recommendations: ['Antes de culpar o S3 pela fatura, confira quantos GB passam pelo NAT Gateway a caminho dele.'],
    exam: { domains: ['d4'], relevance: 'alta' },
    references: [R.gatewayEndpoints, R.interfaceEndpoints, R.nat],
    tags: ['custos'],
  },
]
