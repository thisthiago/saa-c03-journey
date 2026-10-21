/**
 * Escolha do caminho de ingestão: qual serviço traz cada fonte de dados para o
 * data lake com o menor esforço.
 *
 * Conferido em 21/10/2026:
 * - Kinesis Data Streams: shards de 1 MB/s ou 1.000 registros/s de escrita e
 *   2 MB/s de leitura; retenção de 24 horas, até 365 dias; modos sob demanda e
 *   provisionado; vários consumidores leem o mesmo fluxo:
 *   https://docs.aws.amazon.com/streams/latest/dev/key-concepts.html
 * - Data Firehose: entrega gerenciada no S3, Redshift, OpenSearch e outros,
 *   com buffer de tamanho e de tempo, transformação por Lambda, conversão de
 *   JSON para Parquet ou ORC (com o esquema no Data Catalog) e partição
 *   dinâmica: https://docs.aws.amazon.com/firehose/latest/dev/what-is-this-service.html
 * - Amazon MSK: Apache Kafka gerenciado, provisionado ou sem servidor; MSK
 *   Connect com conectores do Kafka Connect:
 *   https://docs.aws.amazon.com/msk/latest/developerguide/what-is-msk.html
 * - AWS Data Exchange: dados de terceiros por concessão ou assinatura:
 *   https://docs.aws.amazon.com/data-exchange/latest/userguide/what-is.html
 * - Amazon AppFlow: dados de aplicações SaaS (Salesforce, Zendesk) para o S3 e
 *   o Redshift, sem código: https://docs.aws.amazon.com/appflow/latest/userguide/what-is-appflow.html
 * - AWS DataSync: transferência online de arquivos do ambiente local para a
 *   AWS (ver a S3 Expedition).
 */
import { choiceSolution, evaluateChoiceLab, type ChoiceCatalog, type ChoiceLabConfig, type ChoiceLabResponse } from '../shared/chooser'

export const INGEST_OPTIONS: ChoiceCatalog = {
  needLabel: {
    'daily-file': 'um arquivo por dia, sem pressa, gerado por um sistema que já grava no S3',
    'to-s3-minutes': 'chegar ao S3 em poucos minutos, sem escrever consumidor',
    'parquet-on-arrival': 'virar Parquet já na chegada ao S3',
    replay: 'reler os eventos dos últimos dias',
    'many-consumers': 'vários sistemas lendo o mesmo fluxo, em menos de um segundo',
    'kafka-api': 'manter as aplicações que já usam a API do Apache Kafka',
    'third-party': 'comprar dados de um fornecedor externo, entregues na conta',
    saas: 'trazer dados do Salesforce sem escrever código',
    'onprem-files': 'copiar milhões de arquivos do servidor de arquivos da empresa',
  },
  options: {
    's3-direct': { name: 'Gravar direto no S3, em lote', summary: 'O sistema que gera o arquivo grava no bucket da camada bruta, com as credenciais certas, sem serviço no meio.', meets: ['daily-file'], limits: ['Não serve para fluxos contínuos nem para releitura.'], complexity: 1 },
    firehose: { name: 'Amazon Data Firehose', summary: 'Recebe o fluxo, junta em lotes por tamanho ou tempo e entrega no S3, podendo converter para Parquet e particionar.', meets: ['to-s3-minutes', 'parquet-on-arrival', 'daily-file'], limits: ['Não guarda os eventos para releitura nem serve vários consumidores.'], complexity: 1.5 },
    kds: { name: 'Kinesis Data Streams', summary: 'Fluxo em shards, guardado de 24 horas até 365 dias, lido por vários consumidores em ordem e com releitura.', meets: ['replay', 'many-consumers'], limits: ['Para chegar ao S3, precisa de um consumidor, como o Firehose.'], complexity: 3 },
    msk: { name: 'Amazon MSK', summary: 'Apache Kafka gerenciado, provisionado ou sem servidor, compatível com as aplicações que usam Kafka.', meets: ['replay', 'many-consumers', 'kafka-api'], limits: ['Exige conhecer o Kafka (tópicos, partições, consumidores).'], complexity: 4 },
    'data-exchange': { name: 'AWS Data Exchange', summary: 'Catálogo de dados de terceiros, recebidos na conta por concessão ou assinatura.', meets: ['third-party'], limits: ['Só para dados oferecidos por outras organizações.'], complexity: 1 },
    appflow: { name: 'Amazon AppFlow', summary: 'Fluxos sem código entre aplicações SaaS, como o Salesforce, e o S3 ou o Redshift, sob demanda ou agendados.', meets: ['saas'], limits: ['Só para as aplicações que ele conecta.'], complexity: 1 },
    datasync: { name: 'AWS DataSync', summary: 'Transferência online e acelerada de arquivos do ambiente local para o S3, com verificação.', meets: ['onprem-files', 'daily-file'], limits: ['Move arquivos, não fluxos de eventos.'], complexity: 2 },
  },
}

export type IngestLabConfig = ChoiceLabConfig
export type IngestLabResponse = ChoiceLabResponse

export const ingestSolution = (c: IngestLabConfig) => choiceSolution(INGEST_OPTIONS, c)
export const evaluateIngestLab = (c: IngestLabConfig, r: IngestLabResponse) => evaluateChoiceLab(INGEST_OPTIONS, c, r)
