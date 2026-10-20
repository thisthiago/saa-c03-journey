/**
 * Módulo de conteúdo "Armazenamento" — trilha S3 Expedition.
 */
import type { ContentModule, TrackDef } from '../../../engine/types'
import { STORAGE_ACHIEVEMENTS } from './achievements'
import { F01_CONCEPTS } from './concepts/f01-fundamentos'
import { F02_CONCEPTS } from './concepts/f02-classes'
import { F03_CONCEPTS } from './concepts/f03-seguranca'
import { F04_CONCEPTS } from './concepts/f04-criptografia'
import { F05_CONCEPTS } from './concepts/f05-versionamento'
import { F06_CONCEPTS } from './concepts/f06-lifecycle'
import { F07_CONCEPTS } from './concepts/f07-replicacao'
import { F08_CONCEPTS } from './concepts/f08-eventos'
import { F09_CONCEPTS } from './concepts/f09-requester-pays'
import { F10_CONCEPTS } from './concepts/f10-gateway'
import { F11_CONCEPTS } from './concepts/f11-transferencia'
import { F01 } from './phases/f01/phase'
import { F02 } from './phases/f02/phase'
import { F03 } from './phases/f03/phase'
import { F04 } from './phases/f04/phase'
import { F05 } from './phases/f05/phase'
import { F06 } from './phases/f06/phase'
import { F07 } from './phases/f07/phase'
import { F08 } from './phases/f08/phase'
import { F09 } from './phases/f09/phase'
import { F10 } from './phases/f10/phase'
import { F11 } from './phases/f11/phase'
import { FINAL } from './phases/final/phase'
import { STORAGE_QUESTIONS } from './questions'

export const S3_EXPEDITION: TrackDef = {
  id: 'storage.s3-expedition',
  moduleId: 'storage',
  territory: 'armazenamento',
  title: 'S3 Expedition',
  subtitle: 'Domínio do Armazenamento AWS',
  summary:
    'Do primeiro bucket a uma arquitetura completa de armazenamento: custos, segurança, criptografia, versionamento, ciclo de vida, replicação, eventos, armazenamento híbrido e migração de dados.',
  glyph: 'bucket',
  recommends: ['foundations.aws-foundations'],
  serviceIds: ['aws.s3', 'aws.iam', 'aws.kms', 'aws.storage-gateway', 'aws.datasync'],
  phases: [F01, F02, F03, F04, F05, F06, F07, F08, F09, F10, F11],
  final: FINAL,
  // Colunas com cinco fases cada: o mapa precisa de mais altura que o padrão.
  mapHeight: 800,
}

export const storageModule: ContentModule = {
  id: 'storage',
  title: 'Armazenamento',
  services: [],
  concepts: [...F01_CONCEPTS, ...F02_CONCEPTS, ...F03_CONCEPTS, ...F04_CONCEPTS, ...F05_CONCEPTS, ...F06_CONCEPTS, ...F07_CONCEPTS, ...F08_CONCEPTS, ...F09_CONCEPTS, ...F10_CONCEPTS, ...F11_CONCEPTS],
  tracks: [S3_EXPEDITION],
  achievements: STORAGE_ACHIEVEMENTS,
  questions: STORAGE_QUESTIONS,
}
