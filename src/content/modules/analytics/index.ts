/**
 * Módulo "Análise de dados": trilha Análise de dados e serviços de IA na AWS.
 * Data lake no S3, Glue, Athena, Lake Formation, EMR, ingestão e streaming,
 * OpenSearch e Quick Sight, serviços prontos de IA, mídia e front-end, e a
 * escolha da solução. Reaproveita conceitos de outras trilhas (sc.*, rs.*):
 * os IDs são globais no registro.
 */
import type { ContentModule, TrackDef } from '../../../engine/types'
import { ANALYTICS_ACHIEVEMENTS } from './achievements'
import { F01_ANA_CONCEPTS } from './concepts/f01-datalake'
import { F02_ANA_CONCEPTS } from './concepts/f02-glue'
import { F03_ANA_CONCEPTS } from './concepts/f03-athena'
import { F04_ANA_CONCEPTS } from './concepts/f04-lakeformation'
import { F05_ANA_CONCEPTS } from './concepts/f05-emr'
import { F06_ANA_CONCEPTS } from './concepts/f06-ingestao'
import { F07_ANA_CONCEPTS } from './concepts/f07-visualizacao'
import { F08_ANA_CONCEPTS } from './concepts/f08-servicos-prontos'
import { F09_ANA_CONCEPTS } from './concepts/f09-escolha'
import { F01_ANA } from './phases/f01/phase'
import { F02_ANA } from './phases/f02/phase'
import { F03_ANA } from './phases/f03/phase'
import { F04_ANA } from './phases/f04/phase'
import { F05_ANA } from './phases/f05/phase'
import { F06_ANA } from './phases/f06/phase'
import { F07_ANA } from './phases/f07/phase'
import { F08_ANA } from './phases/f08/phase'
import { F09_ANA } from './phases/f09/phase'
import { FINAL_ANA } from './phases/final/phase'
import { ANALYTICS_QUESTIONS } from './questions'

export const AWS_ANALYTICS: TrackDef = {
  id: 'analytics.aws-analytics',
  moduleId: 'analytics',
  territory: 'analise',
  title: 'Análise de dados e serviços de IA na AWS',
  subtitle: 'Data lake, consultas, processamento, streaming e serviços prontos',
  summary:
    'Data lake no S3, Glue, Athena, Lake Formation, EMR, Kinesis, Firehose, MSK, OpenSearch, Quick Sight e os serviços prontos de IA: como guardar, organizar, proteger, processar e mostrar os dados da empresa.',
  glyph: 'chart',
  recommends: ['foundations.aws-foundations', 'storage.s3-expedition'],
  serviceIds: [
    'aws.athena',
    'aws.glue',
    'aws.lake-formation',
    'aws.emr',
    'aws.kinesis-data-streams',
    'aws.firehose',
    'aws.msk',
    'aws.data-exchange',
    'aws.opensearch',
    'aws.quick',
    'aws.comprehend',
    'aws.lex',
    'aws.polly',
    'aws.rekognition',
    'aws.textract',
    'aws.transcribe',
    'aws.translate',
    'aws.sagemaker-ai',
    'aws.kinesis-video-streams',
    'aws.elastic-transcoder',
    'aws.mediaconvert',
    'aws.amplify',
    'aws.device-farm',
    'aws.appflow',
  ],
  phases: [F01_ANA, F02_ANA, F03_ANA, F04_ANA, F05_ANA, F06_ANA, F07_ANA, F08_ANA, F09_ANA],
  final: FINAL_ANA,
  mapHeight: 800,
}

export const analyticsModule: ContentModule = {
  id: 'analytics',
  title: 'Análise de dados',
  services: [],
  concepts: [...F01_ANA_CONCEPTS, ...F02_ANA_CONCEPTS, ...F03_ANA_CONCEPTS, ...F04_ANA_CONCEPTS, ...F05_ANA_CONCEPTS, ...F06_ANA_CONCEPTS, ...F07_ANA_CONCEPTS, ...F08_ANA_CONCEPTS, ...F09_ANA_CONCEPTS],
  tracks: [AWS_ANALYTICS],
  achievements: ANALYTICS_ACHIEVEMENTS,
  questions: ANALYTICS_QUESTIONS,
}
