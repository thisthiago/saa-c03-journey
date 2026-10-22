/**
 * Módulo "Arquitetura": trilha Arquitetura e otimização na AWS, a de
 * fechamento da plataforma. Ensina a decidir entre os serviços das outras
 * trilhas e reaproveita muitos conceitos delas (infra.*, dr.rpo-rto, os de
 * compra e escalonamento da Computação, os de classes e replicação da S3
 * Expedition, os de banco, rede, segurança e integração): os IDs são globais
 * no registro.
 */
import type { ContentModule, TrackDef } from '../../../engine/types'
import { ARCHITECTURE_ACHIEVEMENTS } from './achievements'
import { F01_ARQ_CONCEPTS } from './concepts/f01-well-architected'
import { F02_ARQ_CONCEPTS } from './concepts/f02-resiliencia'
import { F03_ARQ_CONCEPTS } from './concepts/f03-recuperacao'
import { F04_ARQ_CONCEPTS } from './concepts/f04-desempenho'
import { F05_ARQ_CONCEPTS } from './concepts/f05-seguranca'
import { F06_ARQ_CONCEPTS } from './concepts/f06-custos'
import { F07_ARQ_CONCEPTS } from './concepts/f07-migracao'
import { F08_ARQ_CONCEPTS } from './concepts/f08-padroes'
import { F09_ARQ_CONCEPTS } from './concepts/f09-exame'
import { F01_ARQ } from './phases/f01/phase'
import { F02_ARQ } from './phases/f02/phase'
import { F03_ARQ } from './phases/f03/phase'
import { F04_ARQ } from './phases/f04/phase'
import { F05_ARQ } from './phases/f05/phase'
import { F06_ARQ } from './phases/f06/phase'
import { F07_ARQ } from './phases/f07/phase'
import { F08_ARQ } from './phases/f08/phase'
import { F09_ARQ } from './phases/f09/phase'
import { FINAL_ARQ } from './phases/final/phase'
import { ARCHITECTURE_QUESTIONS } from './questions'

export const ARCHITECTURE_TRACK: TrackDef = {
  id: 'architecture.well-architected',
  moduleId: 'architecture',
  territory: 'arquitetura',
  title: 'Arquitetura e otimização na AWS',
  subtitle: 'Well-Architected, resiliência, desempenho, custo e migração',
  summary:
    'A trilha de fechamento: o Well-Architected Framework e a Well-Architected Tool, arquiteturas resilientes, as quatro estratégias de recuperação de desastres, alto desempenho, segurança em camadas, otimização de custos (tamanho, compra e transferência de dados), migração com os 7 Rs e o AWS Transform MGN, padrões de arquitetura e implantação e a leitura das questões do exame.',
  glyph: 'flag',
  recommends: ['foundations.aws-foundations', 'storage.s3-expedition', 'identity.iam-access', 'compute.aws-compute'],
  serviceIds: ['aws.well-architected-tool', 'aws.application-migration-service', 'aws.backup', 'aws.datasync', 'aws.dms', 'aws.route53', 'aws.cloudfront', 'aws.compute-optimizer'],
  phases: [F01_ARQ, F02_ARQ, F03_ARQ, F04_ARQ, F05_ARQ, F06_ARQ, F07_ARQ, F08_ARQ, F09_ARQ],
  final: FINAL_ARQ,
  mapHeight: 800,
}

export const architectureModule: ContentModule = {
  id: 'architecture',
  title: 'Arquitetura',
  services: [],
  concepts: [...F01_ARQ_CONCEPTS, ...F02_ARQ_CONCEPTS, ...F03_ARQ_CONCEPTS, ...F04_ARQ_CONCEPTS, ...F05_ARQ_CONCEPTS, ...F06_ARQ_CONCEPTS, ...F07_ARQ_CONCEPTS, ...F08_ARQ_CONCEPTS, ...F09_ARQ_CONCEPTS],
  tracks: [ARCHITECTURE_TRACK],
  achievements: ARCHITECTURE_ACHIEVEMENTS,
  questions: ARCHITECTURE_QUESTIONS,
}
