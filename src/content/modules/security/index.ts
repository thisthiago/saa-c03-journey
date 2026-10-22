/**
 * Módulo "Segurança": trilha Segurança e proteção de dados na AWS. KMS e
 * CloudHSM, segredos, certificados, detecção de ameaças, classificação e
 * retenção, postura e conformidade, ameaças externas e resposta, e a escolha
 * do serviço. Reaproveita conceitos de outras trilhas (kms.key-policy, s3.*,
 * macie.*, edgesec.*, ssm.*, srm.*): os IDs são globais no registro.
 */
import type { ContentModule, TrackDef } from '../../../engine/types'
import { SECURITY_ACHIEVEMENTS } from './achievements'
import { F01_SEC_CONCEPTS } from './concepts/f01-kms'
import { F02_SEC_CONCEPTS } from './concepts/f02-kms-avancado'
import { F03_SEC_CONCEPTS } from './concepts/f03-segredos'
import { F04_SEC_CONCEPTS } from './concepts/f04-certificados'
import { F05_SEC_CONCEPTS } from './concepts/f05-deteccao'
import { F06_SEC_CONCEPTS } from './concepts/f06-dados'
import { F07_SEC_CONCEPTS } from './concepts/f07-postura'
import { F08_SEC_CONCEPTS } from './concepts/f08-resposta'
import { F09_SEC_CONCEPTS } from './concepts/f09-escolha'
import { F01_SEC } from './phases/f01/phase'
import { F02_SEC } from './phases/f02/phase'
import { F03_SEC } from './phases/f03/phase'
import { F04_SEC } from './phases/f04/phase'
import { F05_SEC } from './phases/f05/phase'
import { F06_SEC } from './phases/f06/phase'
import { F07_SEC } from './phases/f07/phase'
import { F08_SEC } from './phases/f08/phase'
import { F09_SEC } from './phases/f09/phase'
import { FINAL_SEC } from './phases/final/phase'
import { SECURITY_QUESTIONS } from './questions'

export const AWS_SECURITY: TrackDef = {
  id: 'security.aws-security',
  moduleId: 'security',
  territory: 'seguranca',
  title: 'Segurança e proteção de dados na AWS',
  subtitle: 'Chaves, segredos, certificados, detecção e conformidade',
  summary:
    'KMS, CloudHSM, Secrets Manager, ACM, GuardDuty, Inspector, Detective, Macie, Security Hub e Artifact: como cifrar os dados, guardar segredos, proteger o tráfego, detectar ameaças, provar a conformidade e responder a incidentes.',
  glyph: 'shield',
  recommends: ['foundations.aws-foundations', 'identity.iam-access', 'storage.s3-expedition'],
  serviceIds: ['aws.kms', 'aws.cloudhsm', 'aws.secrets-manager', 'aws.acm', 'aws.guardduty', 'aws.inspector', 'aws.detective', 'aws.macie', 'aws.security-hub', 'aws.artifact', 'aws.waf', 'aws.shield'],
  phases: [F01_SEC, F02_SEC, F03_SEC, F04_SEC, F05_SEC, F06_SEC, F07_SEC, F08_SEC, F09_SEC],
  final: FINAL_SEC,
  mapHeight: 840,
}

export const securityModule: ContentModule = {
  id: 'security',
  title: 'Segurança',
  services: [],
  concepts: [...F01_SEC_CONCEPTS, ...F02_SEC_CONCEPTS, ...F03_SEC_CONCEPTS, ...F04_SEC_CONCEPTS, ...F05_SEC_CONCEPTS, ...F06_SEC_CONCEPTS, ...F07_SEC_CONCEPTS, ...F08_SEC_CONCEPTS, ...F09_SEC_CONCEPTS],
  tracks: [AWS_SECURITY],
  achievements: SECURITY_ACHIEVEMENTS,
  questions: SECURITY_QUESTIONS,
}
