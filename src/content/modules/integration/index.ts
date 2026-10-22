/**
 * Módulo "Integração": trilha Integração e mensageria na AWS. SQS, SNS,
 * EventBridge, Step Functions, API Gateway, streaming, Amazon MQ e os
 * padrões de integração. Reaproveita conceitos de outras trilhas (ev.*,
 * kds.streams, fh.*, msk.kafka, ingest.third-party): os IDs são globais no
 * registro.
 */
import type { ContentModule, TrackDef } from '../../../engine/types'
import { INTEGRATION_ACHIEVEMENTS } from './achievements'
import { F01_INT_CONCEPTS } from './concepts/f01-sqs'
import { F02_INT_CONCEPTS } from './concepts/f02-sqs-escala'
import { F03_INT_CONCEPTS } from './concepts/f03-sns'
import { F04_INT_CONCEPTS } from './concepts/f04-eventbridge'
import { F05_INT_CONCEPTS } from './concepts/f05-step-functions'
import { F06_INT_CONCEPTS } from './concepts/f06-api-gateway'
import { F07_INT_CONCEPTS } from './concepts/f07-streaming'
import { F08_INT_CONCEPTS } from './concepts/f08-mq'
import { F09_INT_CONCEPTS } from './concepts/f09-padroes'
import { F01_INT } from './phases/f01/phase'
import { F02_INT } from './phases/f02/phase'
import { F03_INT } from './phases/f03/phase'
import { F04_INT } from './phases/f04/phase'
import { F05_INT } from './phases/f05/phase'
import { F06_INT } from './phases/f06/phase'
import { F07_INT } from './phases/f07/phase'
import { F08_INT } from './phases/f08/phase'
import { F09_INT } from './phases/f09/phase'
import { FINAL_INT } from './phases/final/phase'
import { INTEGRATION_QUESTIONS } from './questions'

export const AWS_INTEGRATION: TrackDef = {
  id: 'integration.aws-integration',
  moduleId: 'integration',
  territory: 'integracao',
  title: 'Integração e mensageria na AWS',
  subtitle: 'Filas, tópicos, eventos, orquestração e streaming',
  summary:
    'SQS, SNS, EventBridge, Step Functions, API Gateway, Kinesis, Data Firehose e Amazon MQ: como desacoplar sistemas, absorver picos, distribuir mensagens, reagir a eventos, coordenar processos, expor APIs e escolher entre fila e stream.',
  glyph: 'queue',
  recommends: ['foundations.aws-foundations', 'compute.aws-compute'],
  serviceIds: ['aws.sqs', 'aws.sns', 'aws.eventbridge', 'aws.step-functions', 'aws.api-gateway', 'aws.kinesis-data-streams', 'aws.firehose', 'aws.mq', 'aws.appflow'],
  phases: [F01_INT, F02_INT, F03_INT, F04_INT, F05_INT, F06_INT, F07_INT, F08_INT, F09_INT],
  final: FINAL_INT,
  mapHeight: 800,
}

export const integrationModule: ContentModule = {
  id: 'integration',
  title: 'Integração',
  services: [],
  concepts: [...F01_INT_CONCEPTS, ...F02_INT_CONCEPTS, ...F03_INT_CONCEPTS, ...F04_INT_CONCEPTS, ...F05_INT_CONCEPTS, ...F06_INT_CONCEPTS, ...F07_INT_CONCEPTS, ...F08_INT_CONCEPTS, ...F09_INT_CONCEPTS],
  tracks: [AWS_INTEGRATION],
  achievements: INTEGRATION_ACHIEVEMENTS,
  questions: INTEGRATION_QUESTIONS,
}
