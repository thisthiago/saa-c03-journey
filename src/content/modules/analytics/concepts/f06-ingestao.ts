/**
 * Conceitos da Fase 6 — Ingestão e streaming no data lake. Declara o básico
 * de Kinesis Data Streams e Data Firehose (kds.*, fh.*), que a futura trilha
 * de Integração e mensageria reaproveita.
 * Fatos conferidos em 21/10/2026 (ver docs/VERIFICACAO-DE-CONTEUDO.md).
 */
import type { ConceptDef } from '../../../../engine/types'
import { R } from './refs'

export const F06_ANA_CONCEPTS: ConceptDef[] = [
  {
    id: 'ingest.patterns',
    title: 'Padrões de ingestão',
    officialName: 'Batch, micro-batch and streaming ingestion',
    serviceIds: ['aws.s3', 'aws.firehose', 'aws.kinesis-data-streams'],
    summary: 'Os dados chegam em **lote** (um arquivo por dia), em **microlotes** (pequenos lotes a cada poucos minutos) ou **sem parar** (cada evento em segundos). O padrão vem da **frequência**, do **volume** e de **quanto tempo o negócio aceita esperar** para ver o dado.',
    recommendations: ['Escolha o caminho mais simples que cumpre a espera aceita: lote quando um dia basta, Firehose quando minutos bastam, fluxo com consumidores quando a resposta precisa ser em segundos.'],
    exam: { domains: ['d3'], relevance: 'alta', notes: 'A tarefa 3.5 do exame cita padrões e frequência de ingestão.' },
    references: [R.fhWhat, R.kdsConcepts],
    tags: ['integracao'],
  },
  {
    id: 'kds.streams',
    title: 'Kinesis Data Streams',
    officialName: 'Amazon Kinesis Data Streams',
    serviceIds: ['aws.kinesis-data-streams'],
    summary: 'O **Kinesis Data Streams** guarda um fluxo de registros dividido em **shards**, na ordem de chegada, por **24 horas** (padrão) até **365 dias**. **Vários consumidores** leem o mesmo fluxo, cada um no seu ritmo, e podem **reler** o que já passou.',
    facts: [
      'Cada shard aceita até 1 MB/s ou 1.000 registros por segundo de escrita e até 2 MB/s de leitura.',
      'No modo sob demanda, o fluxo escala sozinho; no provisionado, a equipe define o número de shards.',
      'Cada registro tem até 1 MB.',
    ],
    commonMistakes: ['Usar o Kinesis Data Streams só para gravar no S3, sem consumidores em tempo real, quando o Firehose bastaria'],
    exam: { domains: ['d3'], relevance: 'alta' },
    references: [R.kdsConcepts, R.kdsModes, R.kdsRetention],
    tags: ['integracao', 'desempenho'],
  },
  {
    id: 'fh.delivery',
    title: 'Data Firehose',
    officialName: 'Amazon Data Firehose',
    serviceIds: ['aws.firehose'],
    summary: 'O **Data Firehose** recebe um fluxo e **entrega** no S3, no Redshift, no OpenSearch, no Splunk e em endpoints HTTP, **sem escrever aplicação**. Ele junta os registros num **buffer**, por tamanho ou por tempo, e entrega quando o primeiro limite é atingido.',
    facts: ['Na entrega com Lambda ou cópia para o S3, o buffer vai de 1 a 128 MiB e de 60 a 900 segundos.', 'Pode chamar uma função Lambda para transformar os registros antes da entrega.', 'Não guarda os registros para releitura: entrega e segue.'],
    commonMistakes: ['Esperar que o Firehose entregue cada evento em milissegundos: ele trabalha em lotes'],
    exam: { domains: ['d3'], relevance: 'alta' },
    references: [R.fhWhat, R.fhBuffer, R.fhTransform],
    tags: ['integracao'],
  },
  {
    id: 'fh.parquet',
    title: 'Firehose convertendo e particionando',
    officialName: 'Record format conversion and dynamic partitioning',
    serviceIds: ['aws.firehose', 'aws.glue'],
    summary: 'O Firehose converte **JSON em Parquet ou ORC** antes de gravar no S3, usando o **esquema de uma tabela do Data Catalog**. Com a **partição dinâmica**, ele grava cada registro na pasta da chave (cliente, data), e o dado já chega ao data lake pronto para o Athena.',
    facts: ['Para converter CSV, uma função Lambda transforma os registros em JSON antes.', 'A partição dinâmica usa chaves dentro dos próprios registros.'],
    exam: { domains: ['d3', 'd4'], relevance: 'media' },
    references: [R.fhConvert, R.fhPartition],
    tags: ['custos', 'desempenho'],
  },
  {
    id: 'msk.kafka',
    title: 'Amazon MSK',
    officialName: 'Amazon Managed Streaming for Apache Kafka',
    serviceIds: ['aws.msk'],
    summary: 'O **MSK** é o **Apache Kafka gerenciado**: a AWS cria e mantém o cluster, e as aplicações usam a API do Kafka de sempre. O **MSK Serverless** dispensa dimensionar o cluster, e o **MSK Connect** roda conectores do Kafka Connect para levar dados ao S3, ao OpenSearch e a bancos.',
    facts: ['O MSK Serverless está disponível em algumas Regiões (como us-east-1), mas não em São Paulo (sa-east-1), segundo a lista da documentação.', 'O MSK roda versões de código aberto do Kafka.'],
    comparisons: [{ with: 'kds.streams', text: 'Os dois guardam fluxos com releitura. O MSK atende quem já usa Kafka; o Kinesis Data Streams é o serviço nativo da AWS, mais simples de operar.' }],
    exam: { domains: ['d3'], relevance: 'media' },
    references: [R.mskWhat, R.mskServerless, R.mskConnect],
    tags: ['integracao'],
  },
  {
    id: 'ingest.third-party',
    title: 'Dados de terceiros e de aplicações SaaS',
    officialName: 'AWS Data Exchange and Amazon AppFlow',
    serviceIds: ['aws.data-exchange', 'aws.appflow'],
    summary: 'O **Data Exchange** traz para a conta **dados de outras organizações**, por concessão ou assinatura no AWS Marketplace, sem montar entrega própria. O **AppFlow** traz dados de **aplicações SaaS**, como Salesforce e Zendesk, para o S3 ou o Redshift, **sem código**, sob demanda ou agendado.',
    facts: ['O Data Exchange também dá acesso a conjuntos de dados públicos do programa Open Data on AWS.'],
    exam: { domains: ['d3'], relevance: 'baixa' },
    references: [R.dataExchange, R.appflow],
    tags: ['integracao'],
  },
  {
    id: 'ingest.secure',
    title: 'Ingestão segura',
    officialName: 'Securing data ingestion',
    serviceIds: ['aws.kinesis-data-streams', 'aws.firehose', 'aws.iam'],
    summary: 'O ponto de ingestão precisa de **credenciais com o mínimo de permissão** (só gravar naquele fluxo ou bucket), **tráfego privado** por endpoints de VPC quando a origem está na AWS e **criptografia** em trânsito e no destino.',
    recommendations: ['Dê ao produtor uma role que só grava no fluxo de destino, nunca acesso de leitura ao data lake.', 'Use endpoints de interface para o Kinesis e o Firehose quando os produtores estão numa VPC sem saída para a internet.'],
    exam: { domains: ['d1'], relevance: 'media', notes: 'A tarefa 3.5 do exame cita o acesso seguro aos pontos de ingestão.' },
    references: [R.kdsConcepts, R.fhWhat],
    tags: ['seguranca'],
  },
]
