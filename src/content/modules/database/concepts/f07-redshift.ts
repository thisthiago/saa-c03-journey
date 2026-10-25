/**
 * Conceitos da Fase 7 — Data warehouse com Redshift.
 * Fatos conferidos em 21/10/2026 (ver docs/VERIFICACAO-DE-CONTEUDO.md).
 * Athena, Glue, EMR e Lake Formation ficam para o plano de Análise de dados; aqui
 * o Athena só aparece na comparação com o Redshift.
 */
import type { ConceptDef } from '../../../../engine/types'
import { R } from './refs'

export const F07_DB_CONCEPTS: ConceptDef[] = [
  {
    id: 'rs.oltp-olap',
    title: 'Transacional ou analítico',
    officialName: 'OLTP and OLAP workloads',
    serviceIds: ['aws.rds', 'aws.redshift'],
    summary: 'O banco **transacional** (OLTP) lê e grava poucos registros por vez, com todas as colunas: guardar em **linhas** é o ideal. A **análise** (OLAP) lê **poucas colunas de bilhões de linhas**: guardar em **colunas** lê só o necessário. Por isso relatórios pesados vão para um **data warehouse**, longe do banco de pedidos.',
    commonMistakes: ['Rodar relatórios de bilhões de linhas no banco de produção', 'Usar o Redshift como banco de uma aplicação que grava pedido a pedido'],
    facts: ['Numa tabela de 100 colunas, uma consulta que usa 5 lê cerca de 5% dos dados no armazenamento em colunas.'],
    exam: {
      domains: ['d3'],
      relevance: 'alta',
      notes: 'Sinais: "relatórios lentos afetam o banco de produção" e "análises sobre grandes volumes históricos". A resposta é levar a análise para um data warehouse, como o Redshift, e não aumentar o banco transacional.',
    },
    references: [R.rsColumnar],
    tags: ['desempenho'],
  },
  {
    id: 'rs.what',
    title: 'Amazon Redshift',
    officialName: 'Amazon Redshift',
    serviceIds: ['aws.redshift'],
    summary: 'Data warehouse gerenciado, na escala de **petabytes**, consultado com **SQL** e com as ferramentas de BI de sempre. Guarda os dados em **colunas** comprimidas, em blocos de **1 MB**. Um cluster tem **nós de computação** e, com dois ou mais, um **nó líder** que coordena as consultas.',
    explanation: [
      'Exemplo: uma rede varejista carrega no Redshift as vendas de cinco anos de todas as lojas. Consultas que somam as vendas por região e mês leem só as colunas de data, região e valor, e respondem em segundos sobre bilhões de linhas.',
    ],
    commonMistakes: ['Confundir o Redshift com um banco transacional'],
    facts: ['Nos nós RA3, o armazenamento gerenciado escala até petabytes usando o S3, separado da computação.', 'O concurrency scaling acrescenta capacidade temporária para milhares de usuários e consultas simultâneas.'],
    exam: {
      domains: ['d3'],
      relevance: 'alta',
      notes: 'Sinais: "data warehouse", "análises SQL sobre petabytes", "ferramentas de BI" e "consultas complexas sobre dados históricos". A resposta é o Redshift.',
    },
    references: [R.rsWhat, R.rsArchitecture, R.rsConcurrency],
    tags: ['desempenho'],
  },
  {
    id: 'rs.serverless',
    title: 'Redshift Serverless',
    officialName: 'Amazon Redshift Serverless',
    serviceIds: ['aws.redshift'],
    summary: 'No **Redshift Serverless**, não há cluster para dimensionar: a capacidade é medida em **RPUs** (Redshift Processing Units) e ajustada sozinha. A cobrança é por **RPU-hora**, por segundo, com mínimo de **60 segundos**, e **não há cobrança com o data warehouse parado**.',
    commonMistakes: ['Manter um cluster provisionado ligado o mês inteiro para análises que rodam uma vez por semana'],
    facts: ['Você define uma capacidade base em RPUs.'],
    exam: {
      domains: ['d4'],
      relevance: 'media',
      notes: 'Sinal: "análises esporádicas ou imprevisíveis, sem gerenciar cluster". A resposta é o Redshift Serverless, que não cobra enquanto está parado.',
    },
    references: [R.rsWhat, R.rsServerlessCapacity, R.rsServerlessBilling],
    tags: ['custos'],
  },
  {
    id: 'rs.spectrum',
    title: 'Redshift Spectrum',
    officialName: 'Amazon Redshift Spectrum',
    serviceIds: ['aws.redshift', 'aws.s3'],
    summary: 'Com o **Spectrum**, o Redshift consulta arquivos estruturados e semiestruturados **direto no S3**, sem carregá-los em tabelas. Dá para juntar, na mesma consulta, dados das tabelas do Redshift com os do data lake.',
    commonMistakes: ['Carregar anos de histórico raramente consultado no Redshift só para uma consulta por mês'],
    facts: ['Vários clusters podem consultar os mesmos arquivos no S3 ao mesmo tempo, sem copiá-los.', 'A cobrança é por terabyte de dados lidos.'],
    exam: {
      domains: ['d3', 'd4'],
      relevance: 'media',
      notes: 'Sinal: "consultar dados no S3 junto com tabelas do Redshift, sem carregá-los". A resposta é o Redshift Spectrum.',
    },
    references: [R.rsSpectrum],
    tags: ['custos'],
  },
  {
    id: 'rs.snapshots',
    title: 'Snapshots e disponibilidade do Redshift',
    officialName: 'Amazon Redshift snapshots and Multi-AZ',
    serviceIds: ['aws.redshift'],
    summary: 'O Redshift tira **snapshots automáticos incrementais** a cada cerca de **8 horas** ou a cada **5 GB por nó** alterados, o que vier primeiro, com retenção padrão de **1 dia** (até 35 nos nós RA3). Ele pode **copiar snapshots sozinho para outra Região**, e a implantação **Multi-AZ** mantém computação em **duas AZs** com um único endpoint.',
    commonMistakes: ['Esperar recuperar o data warehouse em outra Região sem ter configurado a cópia de snapshots'],
    facts: ['Snapshots manuais ficam até você apagar.', 'Os snapshots ficam guardados no S3.'],
    exam: {
      domains: ['d2'],
      relevance: 'media',
      notes: 'Sinal: "recuperar o data warehouse em outra Região". A resposta é configurar a cópia automática de snapshots entre Regiões; para tolerar a falha de uma AZ, o Multi-AZ do Redshift.',
    },
    references: [R.rsSnapshots, R.rsCrossRegion, R.rsMultiAz],
    tags: ['recuperacao'],
  },
  {
    id: 'rs.integrations',
    title: 'Compartilhamento de dados e zero-ETL',
    officialName: 'Redshift data sharing and zero-ETL integrations',
    serviceIds: ['aws.redshift', 'aws.aurora', 'aws.dynamodb'],
    summary: 'Com o **compartilhamento de dados**, um data warehouse lê dados **vivos** de outro, **sem copiar nem mover**. Com as **integrações zero-ETL**, dados do **Aurora**, do **RDS** e do **DynamoDB** chegam ao Redshift sem um pipeline para construir e manter.',
    commonMistakes: ['Montar e manter scripts de cópia noturna do Aurora para o Redshift quando a integração zero-ETL resolve'],
    exam: {
      domains: ['d3'],
      relevance: 'media',
      notes: 'Sinais: "levar dados do Aurora, do RDS ou do DynamoDB ao Redshift sem construir pipelines" apontam para o zero-ETL; "compartilhar dados entre data warehouses sem copiar", para o data sharing.',
    },
    references: [R.rsDataSharing, R.rsZeroEtl],
    tags: ['integracao'],
  },
  {
    id: 'rs.vs-athena',
    title: 'Redshift ou Athena',
    officialName: 'Amazon Redshift compared with Amazon Athena',
    serviceIds: ['aws.redshift', 'aws.s3'],
    summary: 'O **Athena** consulta dados **direto no S3** com SQL, **sem servidor**, pagando por consulta: bom para consultas avulsas sobre o data lake. O **Redshift** é um data warehouse para análises pesadas e frequentes, com dados carregados e otimizados. O Athena é aprofundado na trilha de análise de dados.',
    commonMistakes: ['Criar um cluster Redshift para meia dúzia de consultas avulsas por mês sobre arquivos no S3'],
    exam: {
      domains: ['d3', 'd4'],
      relevance: 'media',
      notes: 'Consultas avulsas sobre arquivos no S3, pagando por consulta, apontam para o Athena. Análises pesadas, frequentes e com muitos usuários apontam para o Redshift.',
    },
    references: [R.athenaWhat, R.rsWhat],
    tags: ['custos'],
  },
]
