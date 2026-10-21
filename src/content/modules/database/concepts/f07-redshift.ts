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
    facts: ['Numa tabela de 100 colunas, uma consulta que usa 5 lê cerca de 5% dos dados no armazenamento em colunas.'],
    commonMistakes: ['Rodar relatórios de bilhões de linhas no banco de produção', 'Usar o Redshift como banco de uma aplicação que grava pedido a pedido'],
    exam: { domains: ['d3'], relevance: 'alta' },
    references: [R.rsColumnar],
    tags: ['desempenho'],
  },
  {
    id: 'rs.what',
    title: 'Amazon Redshift',
    officialName: 'Amazon Redshift',
    serviceIds: ['aws.redshift'],
    summary: 'Data warehouse gerenciado, na escala de **petabytes**, consultado com **SQL** e com as ferramentas de BI de sempre. Guarda os dados em **colunas** comprimidas, em blocos de **1 MB**. Um cluster tem **nós de computação** e, com dois ou mais, um **nó líder** que coordena as consultas.',
    facts: ['Nos nós RA3, o armazenamento gerenciado escala até petabytes usando o S3, separado da computação.', 'O concurrency scaling acrescenta capacidade temporária para milhares de usuários e consultas simultâneas.'],
    commonMistakes: ['Confundir o Redshift com um banco transacional'],
    exam: { domains: ['d3'], relevance: 'alta' },
    references: [R.rsWhat, R.rsArchitecture, R.rsConcurrency],
    tags: ['desempenho'],
  },
  {
    id: 'rs.serverless',
    title: 'Redshift Serverless',
    officialName: 'Amazon Redshift Serverless',
    serviceIds: ['aws.redshift'],
    summary: 'No **Redshift Serverless**, não há cluster para dimensionar: a capacidade é medida em **RPUs** (Redshift Processing Units) e ajustada sozinha. A cobrança é por **RPU-hora**, por segundo, com mínimo de **60 segundos**, e **não há cobrança com o data warehouse parado**.',
    facts: ['Você define uma capacidade base em RPUs.'],
    commonMistakes: ['Manter um cluster provisionado ligado o mês inteiro para análises que rodam uma vez por semana'],
    exam: { domains: ['d4'], relevance: 'media' },
    references: [R.rsWhat, R.rsServerlessCapacity, R.rsServerlessBilling],
    tags: ['custos'],
  },
  {
    id: 'rs.spectrum',
    title: 'Redshift Spectrum',
    officialName: 'Amazon Redshift Spectrum',
    serviceIds: ['aws.redshift', 'aws.s3'],
    summary: 'Com o **Spectrum**, o Redshift consulta arquivos estruturados e semiestruturados **direto no S3**, sem carregá-los em tabelas. Dá para juntar, na mesma consulta, dados das tabelas do Redshift com os do data lake.',
    facts: ['Vários clusters podem consultar os mesmos arquivos no S3 ao mesmo tempo, sem copiá-los.', 'A cobrança é por terabyte de dados lidos.'],
    commonMistakes: ['Carregar anos de histórico raramente consultado no Redshift só para uma consulta por mês'],
    exam: { domains: ['d3', 'd4'], relevance: 'media' },
    references: [R.rsSpectrum],
    tags: ['custos'],
  },
  {
    id: 'rs.snapshots',
    title: 'Snapshots e disponibilidade do Redshift',
    officialName: 'Amazon Redshift snapshots and Multi-AZ',
    serviceIds: ['aws.redshift'],
    summary: 'O Redshift tira **snapshots automáticos incrementais** a cada cerca de **8 horas** ou a cada **5 GB por nó** alterados, o que vier primeiro, com retenção padrão de **1 dia** (até 35 nos nós RA3). Ele pode **copiar snapshots sozinho para outra Região**, e a implantação **Multi-AZ** mantém computação em **duas AZs** com um único endpoint.',
    facts: ['Snapshots manuais ficam até você apagar.', 'Os snapshots ficam guardados no S3.'],
    commonMistakes: ['Esperar recuperar o data warehouse em outra Região sem ter configurado a cópia de snapshots'],
    exam: { domains: ['d2'], relevance: 'media' },
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
    exam: { domains: ['d3'], relevance: 'media' },
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
    exam: { domains: ['d3', 'd4'], relevance: 'media' },
    references: [R.athenaWhat, R.rsWhat],
    tags: ['custos'],
  },
]
