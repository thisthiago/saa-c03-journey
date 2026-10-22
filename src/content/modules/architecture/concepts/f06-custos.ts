/**
 * Conceitos da Fase 6 — Otimização de custos. Reaproveita ec2.savings-plans,
 * ec2.spot, ec2.compute-optimizer, asg.scheduled-predictive e lambda.pricing
 * (Computação), sc.intelligent-tiering (S3 Expedition), fin.cost-allocation-tags
 * (Monitoramento e governança) e pl.gateway-endpoint e pl.nat-vs-endpoint
 * (Redes).
 * Fatos conferidos em 22/10/2026 (ver docs/VERIFICACAO-DE-CONTEUDO.md).
 */
import type { ConceptDef } from '../../../../engine/types'
import { R } from './refs'

export const F06_ARQ_CONCEPTS: ConceptDef[] = [
  {
    id: 'opt.rightsizing',
    title: 'Dimensionamento correto',
    officialName: 'Right sizing (COST06-BP03)',
    serviceIds: ['aws.ec2', 'aws.compute-optimizer'],
    summary: 'Escolha o tipo e o tamanho pelas **métricas da carga em produção**, não pela estimativa do lançamento. Uma referência da AWS: instâncias com **uso máximo de CPU e de memória abaixo de 40% em quatro semanas** são candidatas a um tamanho menor.',
    facts: ['O Compute Optimizer e as recomendações de dimensionamento do Cost Management ajudam a achar instâncias ociosas ou subutilizadas.', 'Não seguir a COST06-BP03 tem risco baixo.'],
    commonMistakes: ['Reduzir pelo uso médio e esquecer o pico', 'Olhar só a CPU e esquecer a memória'],
    exam: { domains: ['d4'], relevance: 'alta' },
    references: [R.cost06bp03],
    tags: ['custos'],
  },
  {
    id: 'opt.pricing-model',
    title: 'O modelo de compra de cada componente',
    officialName: 'Perform pricing model analysis (COST07-BP01)',
    serviceIds: ['aws.ec2', 'aws.savings-plans'],
    summary: 'Analise cada componente: o que roda **por muito tempo** vai para **desconto por compromisso** (Savings Plans, Reserved Instances); o que é **curto, dinâmico ou interrompível**, para **Spot** ou **On-Demand**. Em geral, a conta mistura vários modelos.',
    facts: ['O Spot dá até 90% de desconto sobre o On-Demand, sem compromisso, com interrupção possível.', 'Os Savings Plans valem para EC2, Lambda e Fargate, com compromisso de gasto por hora de 1 ou 3 anos.', 'Não seguir a COST07-BP01 tem risco alto.'],
    commonMistakes: ['Comprar compromisso de 1 ano para um projeto que acaba em três meses'],
    exam: { domains: ['d4'], relevance: 'alta' },
    references: [R.cost07bp01],
    tags: ['custos'],
  },
  {
    id: 'opt.schedule',
    title: 'Desligar fora do horário',
    officialName: 'Stop resources when not in use',
    serviceIds: ['aws.ec2', 'aws.rds'],
    summary: 'Ambientes usados só em horário comercial podem ser **desligados** à noite e no fim de semana. Com **40 horas por semana** em vez de 168, a economia é de cerca de **75%**. Instâncias EC2 e RDS paradas param de cobrar a computação; o armazenamento continua cobrado.',
    facts: ['A AWS cita desligar EC2 e RDS fora do expediente e nos fins de semana como forma de reduzir 70% ou mais do custo de rodar 24 horas por dia.'],
    comparisons: [{ with: 'ec2.savings-plans', text: 'Um compromisso cobra as 730 horas do mês; para quem roda 40 horas por semana, desligar sai mais barato que o desconto.' }],
    commonMistakes: ['Pagar Savings Plan para ambientes de teste que ficam parados à noite'],
    exam: { domains: ['d4'], relevance: 'media' },
    references: [R.costPrinciples, R.cost07bp01],
    tags: ['custos'],
  },
  {
    id: 'opt.decommission',
    title: 'Rastrear e desativar recursos',
    officialName: 'Track resources over their lifetime (COST04-BP01)',
    serviceIds: ['aws.cost-explorer'],
    summary: 'Marque cada recurso com **tags** que dizem a carga, o dono e, se for o caso, a data de desativação, e monitore quando a carga para de receber pedidos. Assim, sobras de testes e projetos encerrados aparecem e são desligadas.',
    facts: ['Não seguir a COST04-BP01 tem risco alto.', 'Exemplos da AWS de tag: a função do recurso no ciclo de vida da carga e uma data ou prazo para desativação.'],
    commonMistakes: ['Deixar o ambiente de um teste de carga rodando meses depois do teste'],
    exam: { domains: ['d4'], relevance: 'media' },
    references: [R.cost04bp01],
    tags: ['custos'],
  },
  {
    id: 'opt.transfer-pricing',
    title: 'Como a transferência de dados é cobrada',
    officialName: 'Data transfer charges',
    serviceIds: ['aws.ec2', 'aws.cloudfront'],
    summary: 'A **entrada** da internet não é cobrada. Dentro da **mesma AZ**, também não. **Entre AZs**, o GB paga na **saída e na entrada**. **Entre Regiões**, paga só a **saída** da Região de origem. Para a **internet**, cada GB de saída é cobrado. Da Região para o **CloudFront**, não há cobrança; paga-se a saída do CloudFront.',
    facts: ['Na tabela de us-east-1: US$ 0,01 por GB em cada sentido entre AZs, US$ 0,02 por GB para Regiões como us-west-2 e sa-east-1, US$ 0,09 por GB para a internet e US$ 0,085 por GB saindo do CloudFront nos Estados Unidos (primeira faixa).', 'A AWS dá 100 GB de saída para a internet grátis por mês, somando serviços e Regiões.'],
    commonMistakes: ['Achar que o tráfego entre AZs da mesma Região é gratuito'],
    exam: { domains: ['d4'], relevance: 'alta' },
    references: [R.transferCharges, R.transferBlog],
    tags: ['custos'],
  },
  {
    id: 'opt.transfer-reduce',
    title: 'Reduzir o custo da transferência',
    officialName: 'Implement services to reduce data transfer costs',
    serviceIds: ['aws.vpc', 'aws.cloudfront'],
    summary: 'As saídas mais comuns: **endpoints de gateway** para o S3 e o DynamoDB no lugar do NAT, **CloudFront** na frente do que é baixado muitas vezes, recursos que conversam muito **na mesma AZ** quando a disponibilidade permite, e evitar tráfego **entre Regiões** sem motivo de negócio.',
    facts: ['O NAT Gateway cobra o processamento de cada GB que passa por ele.', 'Os endpoints de gateway levam ao S3 e ao DynamoDB sem cobrança de transferência.'],
    commonMistakes: ['Mandar terabytes de logs para o S3 pelo NAT Gateway', 'Juntar tudo numa AZ só para economizar transferência e perder a alta disponibilidade'],
    exam: { domains: ['d4'], relevance: 'alta' },
    references: [R.transferBlog],
    tags: ['custos'],
  },
  {
    id: 'opt.serverless-vs-provisioned',
    title: 'Serverless ou provisionado?',
    officialName: 'Serverless versus provisioned capacity',
    serviceIds: ['aws.lambda', 'aws.ec2'],
    summary: 'No **serverless**, paga-se por **requisição e duração**: tráfego baixo ou irregular custa pouco, e ninguém paga servidor parado. No **provisionado**, paga-se a **hora** do recurso, use ou não: com uso alto e constante, ele costuma sair mais barato por unidade de trabalho.',
    recommendations: ['Compare as duas contas com o volume real: o ponto de virada depende da memória, da duração e do número de requisições.'],
    commonMistakes: ['Manter instâncias ligadas o mês inteiro para uma API que recebe poucos pedidos por hora'],
    exam: { domains: ['d4'], relevance: 'alta' },
    references: [R.costPrinciples, R.perfPrinciples],
    tags: ['custos'],
  },
]
