/**
 * Conceitos da Fase 9 — Escolhendo a solução de dados.
 * Fatos conferidos em 21/10/2026 (ver docs/VERIFICACAO-DE-CONTEUDO.md).
 */
import type { ConceptDef } from '../../../../engine/types'
import { R } from './refs'

export const F09_ANA_CONCEPTS: ConceptDef[] = [
  {
    id: 'ana.choose',
    title: 'Quadro de escolha dos serviços de dados',
    officialName: 'Choosing AWS analytics services',
    serviceIds: ['aws.athena', 'aws.redshift', 'aws.emr', 'aws.glue', 'aws.opensearch', 'aws.quick'],
    summary: 'Consulta SQL sob demanda no S3: **Athena**. SQL frequente sobre dados estruturados: **Redshift**. ETL sem servidor: **Glue**. Controle do cluster e ecossistema Hadoop: **EMR**. Busca e logs: **OpenSearch**. Painéis: **Quick Sight**. Para fluxos: **Firehose** entrega, **Kinesis Data Streams** guarda e serve vários leitores, **MSK** atende quem usa Kafka. Para IA: serviço pronto antes de **SageMaker AI**.',
    recommendations: [
      'Diante de várias opções que atendem, prefira a sem servidor e com menos operação, a menos que o requisito peça controle.',
    ],
    exam: {
      domains: ['d3'],
      relevance: 'alta',
      notes: 'Questões de dados descrevem o uso: consulta avulsa, relatório frequente, ETL, busca, painel ou fluxo. Elimine as opções pelas exigências e, entre as que sobram, escolha o serviço com menos operação.',
    },
    references: [R.athenaWhat, R.glueWhat, R.emrWhat, R.osWhat, R.quickWhat],
    tags: ['fundamentos'],
  },
  {
    id: 'ana.streaming-architecture',
    title: 'Arquitetura de streaming',
    officialName: 'Streaming data architecture on AWS',
    serviceIds: ['aws.kinesis-data-streams', 'aws.firehose', 'aws.s3', 'aws.athena'],
    summary: 'Um desenho comum: os produtores escrevem no **Kinesis Data Streams**; consumidores em tempo real (como funções Lambda) leem o fluxo; o **Firehose**, lendo o mesmo fluxo, entrega lotes em **Parquet** no **S3**; o **Athena** e o **Quick Sight** consultam o histórico.',
    facts: ['O Firehose pode usar um fluxo do Kinesis Data Streams como origem, além de receber gravações diretas.'],
    exam: {
      domains: ['d3'],
      relevance: 'alta',
      notes: 'A tarefa 3.5 do exame cita arquiteturas de streaming. Sinal: "processar em tempo real e guardar o histórico para análise". A resposta combina Kinesis Data Streams, consumidores Lambda, Firehose para o S3 e Athena ou Quick Sight para o histórico.',
    },
    references: [R.fhSource, R.kdsConcepts, R.fhConvert],
    tags: ['integracao', 'desempenho'],
    reviewItems: [
      {
        id: 'rv:ana.streaming-architecture:1',
        kind: 'decision',
        title: 'Tempo real e data lake',
        prompt: 'Os eventos precisam ser lidos em tempo real pelo antifraude e também chegar ao S3 em Parquet. Qual desenho atende com um fluxo só?',
        concepts: [{ id: 'ana.streaming-architecture' }],
        xp: 5,
        difficulty: 2,
        explanation: ['O Kinesis Data Streams serve o antifraude em tempo real, e o Firehose, usando o mesmo fluxo como origem, entrega Parquet no S3.'],
        options: [
          { id: 'a', text: 'Kinesis Data Streams lido pelo antifraude e pelo Firehose, que entrega no S3', correct: true, consequence: 'Um fluxo atende às duas necessidades.' },
          { id: 'b', text: 'Só o Firehose', correct: false, consequence: 'O Firehose entrega em lotes; o antifraude fica sem tempo real.' },
        ],
      },
      {
        id: 'rv:ana.streaming-architecture:2',
        kind: 'decision',
        title: 'Origem do Firehose',
        prompt: 'O Firehose pode ler de um fluxo do Kinesis Data Streams que já existe?',
        concepts: [{ id: 'ana.streaming-architecture' }],
        xp: 5,
        difficulty: 1,
        explanation: ['Sim: o Firehose aceita um fluxo do Kinesis Data Streams como origem, além de gravações diretas.'],
        options: [
          { id: 'a', text: 'Sim, o fluxo pode ser a origem do Firehose', correct: true, consequence: 'O fluxo continua servindo os outros leitores.' },
          { id: 'b', text: 'Não, o Firehose só aceita gravações diretas', correct: false, consequence: 'A documentação lista o Kinesis Data Streams como origem.' },
        ],
      },
    ],
  },
  {
    id: 'ana.lake-reference',
    title: 'Data lake de ponta a ponta',
    officialName: 'Data lake reference architecture',
    serviceIds: ['aws.s3', 'aws.glue', 'aws.lake-formation', 'aws.athena', 'aws.quick'],
    summary: 'Os dados chegam à **camada bruta** no S3; o **Glue** cataloga e converte para a **camada tratada** em Parquet particionado; o **Lake Formation** governa o acesso por coluna e linha; **Athena**, **Redshift Spectrum** e **EMR** consultam e processam; o **Quick Sight** mostra o resultado.',
    exam: {
      domains: ['d3', 'd1'],
      relevance: 'alta',
      notes: 'A tarefa 3.5 do exame cita montar e proteger data lakes. A resposta completa tem camadas no S3, catálogo e ETL no Glue, governança no Lake Formation e consulta no Athena ou no Redshift Spectrum.',
    },
    references: [R.dataLayers, R.glueComponents, R.lfWhat],
    tags: ['fundamentos'],
  },
]
