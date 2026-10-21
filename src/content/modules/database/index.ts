/**
 * Módulo "Bancos de dados": trilha Bancos de dados na AWS. RDS, alta
 * disponibilidade, Aurora, DynamoDB, cache e bancos especializados, Redshift,
 * segurança e backup, migração com DMS e a escolha do banco. Reaproveita
 * conceitos de outras trilhas (infra.*, srm.*): os IDs são globais no registro.
 */
import type { ContentModule, TrackDef } from '../../../engine/types'
import { DATABASE_ACHIEVEMENTS } from './achievements'
import { F01_DB_CONCEPTS } from './concepts/f01-rds'
import { F02_DB_CONCEPTS } from './concepts/f02-ha'
import { F03_DB_CONCEPTS } from './concepts/f03-aurora'
import { F04_DB_CONCEPTS } from './concepts/f04-dynamo'
import { F05_DB_CONCEPTS } from './concepts/f05-dynamo-adv'
import { F06_DB_CONCEPTS } from './concepts/f06-cache'
import { F07_DB_CONCEPTS } from './concepts/f07-redshift'
import { F08_DB_CONCEPTS } from './concepts/f08-seguranca'
import { F09_DB_CONCEPTS } from './concepts/f09-migracao'
import { F01_DB } from './phases/f01/phase'
import { F02_DB } from './phases/f02/phase'
import { F03_DB } from './phases/f03/phase'
import { F04_DB } from './phases/f04/phase'
import { F05_DB } from './phases/f05/phase'
import { F06_DB } from './phases/f06/phase'
import { F07_DB } from './phases/f07/phase'
import { F08_DB } from './phases/f08/phase'
import { F09_DB } from './phases/f09/phase'
import { FINAL_DB } from './phases/final/phase'
import { DATABASE_QUESTIONS } from './questions'

export const AWS_DATABASE: TrackDef = {
  id: 'database.aws-database',
  moduleId: 'database',
  territory: 'bancos-de-dados',
  title: 'Bancos de dados na AWS',
  subtitle: 'Relacionais, NoSQL, cache e análise',
  summary:
    'RDS, Aurora, DynamoDB, ElastiCache, Redshift e DMS: como escolher, proteger, recuperar e pagar pelo banco que cada carga pede, com preços reais da AWS nos laboratórios.',
  glyph: 'database',
  recommends: ['foundations.aws-foundations', 'compute.aws-compute'],
  serviceIds: ['aws.rds', 'aws.aurora', 'aws.dynamodb', 'aws.elasticache', 'aws.documentdb', 'aws.neptune', 'aws.keyspaces', 'aws.redshift', 'aws.dms', 'aws.backup'],
  phases: [F01_DB, F02_DB, F03_DB, F04_DB, F05_DB, F06_DB, F07_DB, F08_DB, F09_DB],
  final: FINAL_DB,
  // Cinco colunas: a cadeia F1, F2, F3, F9 e o final tem cinco níveis de dependência.
  mapHeight: 800,
}

export const databaseModule: ContentModule = {
  id: 'database',
  title: 'Bancos de dados',
  services: [],
  concepts: [...F01_DB_CONCEPTS, ...F02_DB_CONCEPTS, ...F03_DB_CONCEPTS, ...F04_DB_CONCEPTS, ...F05_DB_CONCEPTS, ...F06_DB_CONCEPTS, ...F07_DB_CONCEPTS, ...F08_DB_CONCEPTS, ...F09_DB_CONCEPTS],
  tracks: [AWS_DATABASE],
  achievements: DATABASE_ACHIEVEMENTS,
  questions: DATABASE_QUESTIONS,
}
