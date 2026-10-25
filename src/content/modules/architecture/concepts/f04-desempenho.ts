/**
 * Conceitos da Fase 4 — Alto desempenho. Reaproveita cache.why,
 * cache.strategies, ddb.dax, rds.read-replica e db.choosing (Bancos de
 * dados), edge.cloudfront, edge.global-accelerator e infra.local-zones
 * (Foundations), ec2.placement-groups e ebs.io2 (Computação), apigw.cache
 * (Integração) e s3.transfer-acceleration (S3 Expedition).
 * Fatos conferidos em 22/10/2026 (ver docs/VERIFICACAO-DE-CONTEUDO.md).
 */
import type { ConceptDef } from '../../../../engine/types'
import { R } from './refs'

export const F04_ARQ_CONCEPTS: ConceptDef[] = [
  {
    id: 'perf.purpose-built',
    title: 'O armazenamento feito para o acesso',
    officialName: 'Use a purpose-built data store (PERF03-BP01)',
    serviceIds: ['aws.rds', 'aws.dynamodb', 'aws.s3', 'aws.elasticache'],
    summary: 'Escolha o armazenamento pelo **dado e pelo acesso**: estrutura, integridade referencial, ACID, crescimento, proporção de leituras, OLTP ou OLAP, durabilidade. É a **simpatia mecânica** do pilar de desempenho: a tecnologia que combina com o uso, e não a que o time já conhece.',
    comparisons: [{ with: 'db.choosing', text: 'A escolha do banco é a aplicação mais comum desse princípio; ele vale também para arquivos, objetos e streaming.' }],
    commonMistakes: ['Guardar sessões, catálogo, relatórios e eventos no mesmo banco relacional'],
    facts: ['Não seguir a PERF03-BP01 tem risco alto.', 'Um antipadrão citado pela AWS: ficar num único tipo de banco porque o time já tem experiência nele.'],
    exam: {
      domains: ['d3'],
      relevance: 'alta',
      notes: 'Em questões de desempenho com um banco sobrecarregado por usos diferentes, a resposta costuma separar cada uso no armazenamento adequado: DynamoDB para sessões, ElastiCache para cache, Redshift para relatórios.',
    },
    references: [R.perf03bp01, R.perfPrinciples],
    tags: ['desempenho'],
  },
  {
    id: 'perf.cache-layers',
    title: 'Cache em camadas',
    officialName: 'Caching at multiple layers',
    serviceIds: ['aws.cloudfront', 'aws.api-gateway', 'aws.elasticache', 'aws.dynamodb'],
    summary: 'O cache pode ficar em várias camadas, cada uma tirando carga da seguinte: o **CloudFront** na borda, o **cache do API Gateway** no estágio da API, o **ElastiCache** na frente do banco e o **DAX** na frente do DynamoDB. Quanto mais perto do usuário, menos camadas cada pedido percorre.',
    commonMistakes: ['Colocar cache no banco quando o conteúdo é estático e poderia ser entregue pelo CloudFront'],
    recommendations: ['Configure os tempos de cache (TTL) de cada camada com cuidado: um TTL longo demais serve dado velho; curto demais, quase não alivia nada.'],
    exam: {
      domains: ['d3'],
      relevance: 'alta',
      notes: 'Sinal: "reduzir a latência e a carga no backend". Escolha a camada pelo que se repete: conteúdo estático (CloudFront), respostas de API (cache do API Gateway) e consultas ao banco (ElastiCache ou DAX).',
    },
    references: [R.perf04bp06, R.perf03bp01],
    tags: ['desempenho'],
  },
  {
    id: 'perf.read-write-split',
    title: 'Separar leitura de escrita',
    officialName: 'Offloading reads from the primary',
    serviceIds: ['aws.rds', 'aws.aurora', 'aws.elasticache'],
    summary: 'Quando as leituras são a maior parte da carga, elas saem do banco principal: **réplicas de leitura** para consultas e relatórios (com dados um pouco atrasados) e **cache** para as leituras repetidas. O primário fica livre para as gravações.',
    commonMistakes: ['Mandar gravações para uma réplica de leitura', 'Escalar o primário na vertical quando o gargalo são relatórios de leitura'],
    facts: ['A AWS indica cache (ElastiCache ou DAX) e réplicas de leitura para cargas com muitas leituras.'],
    exam: {
      domains: ['d3'],
      relevance: 'alta',
      notes: 'Sinal: "o banco primário está sobrecarregado por leituras e relatórios". A resposta são réplicas de leitura e cache, deixando o primário para as gravações.',
    },
    references: [R.perf03bp01],
    tags: ['desempenho'],
  },
  {
    id: 'perf.near-users',
    title: 'Aproximar a carga dos usuários',
    officialName: "Choose your workload's location based on network requirements (PERF04-BP06)",
    serviceIds: ['aws.cloudfront', 'aws.global-accelerator'],
    summary: 'Escolha a **Região perto dos usuários** (ou dos dados, em cargas de muitos dados) e use a borda: **CloudFront** guarda conteúdo perto de quem pede, **Global Accelerator** leva TCP e UDP pela rede da AWS com IPs fixos, **Local Zones** e **Wavelength** levam a computação para mais perto ainda.',
    facts: ['Não seguir a PERF04-BP06 tem risco médio.', 'Antipadrões citados: concentrar tudo num só lugar e escolher a Região mais perto da empresa, e não dos usuários.', 'Placement groups reduzem a latência entre instâncias.'],
    exam: {
      domains: ['d3'],
      relevance: 'alta',
      notes: 'Sinal: "usuários distantes reclamam de latência". A resposta aproxima o conteúdo ou a computação: CloudFront, Global Accelerator, uma Região mais próxima ou Local Zones.',
    },
    references: [R.perf04bp06],
    tags: ['desempenho'],
  },
  {
    id: 'perf.experiment',
    title: 'Medir antes de escolher',
    officialName: 'Experiment more often',
    serviceIds: [],
    summary: 'Com recursos virtuais, dá para **comparar** tipos de instância, de armazenamento e de configuração em testes rápidos, num ambiente que não é a produção, e decidir pelos números. A troca depois também é barata: o recurso muda sem comprar hardware.',
    recommendations: ['Teste o candidato com a carga real (ou uma reprodução dela) antes de trocar a produção.'],
    commonMistakes: ['Escolher o tipo de instância pelo nome mais novo, sem medir a carga'],
    exam: { domains: ['d3'], relevance: 'baixa' },
    references: [R.perfPrinciples, R.perf03bp01],
    tags: ['desempenho'],
  },
]
