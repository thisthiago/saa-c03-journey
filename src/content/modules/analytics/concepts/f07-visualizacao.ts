/**
 * Conceitos da Fase 7 — Busca e visualização: OpenSearch Service e Amazon
 * Quick Sight.
 * Fatos conferidos em 21/10/2026 (ver docs/VERIFICACAO-DE-CONTEUDO.md).
 */
import type { ConceptDef } from '../../../../engine/types'
import { R } from './refs'

export const F07_ANA_CONCEPTS: ConceptDef[] = [
  {
    id: 'os.what',
    title: 'Amazon OpenSearch Service',
    officialName: 'Amazon OpenSearch Service',
    serviceIds: ['aws.opensearch'],
    summary: 'O **OpenSearch Service** cria e mantém clusters (chamados **domínios**) de **OpenSearch**, o motor de **busca textual** e **análise de logs**. Serve à busca de produtos tolerante a erros de digitação, ao monitoramento de aplicações e à análise de cliques, com painéis no **OpenSearch Dashboards**.',
    facts: [
      'Aceita o OpenSearch e o Elasticsearch de código aberto até a versão 7.10.',
      'Detecta e substitui sozinho os nós com falha.',
      'Recebe dados do S3, do Kinesis, do DynamoDB e do Firehose.',
    ],
    comparisons: [{ with: 'athena.what', text: 'O Athena faz SQL sobre arquivos do S3; o OpenSearch indexa os documentos para buscas por palavras e análises de logs em segundos.' }],
    exam: { domains: ['d3'], relevance: 'alta' },
    references: [R.osWhat, R.osDashboards],
    tags: ['desempenho'],
  },
  {
    id: 'os.serverless-ingestion',
    title: 'OpenSearch Serverless e OpenSearch Ingestion',
    officialName: 'Amazon OpenSearch Serverless and Amazon OpenSearch Ingestion',
    serviceIds: ['aws.opensearch'],
    summary: 'O **OpenSearch Serverless** organiza os índices em **coleções** e dispensa dimensionar e ajustar o cluster. O **OpenSearch Ingestion** é um coletor sem servidor que recebe logs, métricas e rastros, transforma e entrega no domínio ou na coleção, sem instalar ferramentas como o Logstash.',
    facts: ['O OpenSearch Ingestion usa o Data Prepper, coletor de código aberto.'],
    exam: { domains: ['d3'], relevance: 'media' },
    references: [R.osServerless, R.osIngestion],
    tags: ['desempenho', 'integracao'],
  },
  {
    id: 'os.multi-az',
    title: 'OpenSearch em várias zonas',
    officialName: 'Multi-AZ with Standby',
    serviceIds: ['aws.opensearch'],
    summary: 'Para produção, a AWS recomenda o domínio **Multi-AZ with Standby**: três zonas, três nós mestres dedicados e pelo menos duas réplicas de cada índice, com **99,99%** de disponibilidade.',
    facts: ['O domínio pode distribuir os nós em duas ou três zonas da mesma Região.'],
    exam: { domains: ['d2'], relevance: 'media' },
    references: [R.osMultiAz],
    tags: ['disponibilidade'],
  },
  {
    id: 'quick.sight',
    title: 'Amazon Quick Sight',
    officialName: 'Amazon Quick Sight',
    serviceIds: ['aws.quick'],
    summary: 'O **Quick Sight** monta **painéis interativos** e análises de business intelligence sobre Athena, Redshift, S3, RDS, Aurora, OpenSearch, Salesforce, Snowflake, planilhas e outras fontes, sem servidor para manter. Os painéis podem ser **incorporados** em aplicações.',
    facts: [
      'O Amazon Quick evoluiu do Amazon QuickSight, que continua como Quick Sight, um recurso do Quick; as APIs antigas continuam valendo.',
      'O Quick também tem recursos de IA, como Quick Flows, Quick Automate, Quick Index e Quick Research, fora do foco do exame.',
      'A incorporação de painéis é da edição Enterprise.',
    ],
    exam: { domains: ['d3'], relevance: 'alta', notes: 'O guia do exame cita o Amazon Quick como serviço de visualização.' },
    references: [R.quickWhat, R.quickSources, R.quickEmbed],
    tags: ['fundamentos'],
  },
  {
    id: 'quick.spice',
    title: 'SPICE',
    officialName: 'SPICE (Super-fast, Parallel, In-memory Calculation Engine)',
    serviceIds: ['aws.quick', 'aws.athena'],
    summary: 'O **SPICE** é o motor em memória do Quick Sight. Os dados importados para ele respondem mais rápido e podem ser reusados sem custo extra; com uma fonte cobrada por consulta, como o Athena, paga-se só a importação e cada atualização, e não cada abertura do painel.',
    facts: ['A outra opção é a consulta direta, que vai à fonte a cada interação.', 'A capacidade do SPICE é separada por Região.', 'Na edição Enterprise, os dados no SPICE ficam criptografados.'],
    commonMistakes: ['Deixar um painel aberto por 200 pessoas em consulta direta ao Athena, pagando o dado lido a cada clique'],
    exam: { domains: ['d3', 'd4'], relevance: 'media' },
    references: [R.quickSpice],
    tags: ['desempenho', 'custos'],
  },
  {
    id: 'quick.rls',
    title: 'Segurança por linha no Quick Sight',
    officialName: 'Row-level security in Amazon Quick Sight',
    serviceIds: ['aws.quick'],
    summary: 'Na edição Enterprise, o conjunto de dados pode ter **segurança por linha**: uma tabela de regras diz, por usuário ou grupo, quais linhas cada leitor vê. O mesmo painel mostra a cada gerente só a própria região.',
    facts: ['Os donos do conjunto de dados continuam vendo tudo; as regras valem para os leitores.'],
    exam: { domains: ['d1'], relevance: 'baixa' },
    references: [R.quickRls],
    tags: ['seguranca'],
  },
  {
    id: 'ana.which-tool',
    title: 'Que ferramenta responde a que pergunta',
    officialName: 'Choosing analytics and visualization tools',
    serviceIds: ['aws.athena', 'aws.opensearch', 'aws.quick', 'aws.redshift'],
    summary: '"Quanto vendemos por região no trimestre?" é SQL: **Athena** ou **Redshift**. "Quais produtos têm a palavra bota, mesmo escrita errado?" é busca: **OpenSearch**. "Mostre isso num painel para a diretoria" é visualização: **Quick Sight**. "O que aconteceu nos logs nos últimos 15 minutos?" é análise de logs: **OpenSearch**.',
    exam: { domains: ['d3'], relevance: 'alta', notes: 'A tarefa 3.5 do exame cita estratégias de visualização.' },
    references: [R.athenaWhat, R.osWhat, R.quickWhat],
    tags: ['fundamentos'],
  },
]
