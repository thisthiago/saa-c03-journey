/**
 * Módulo "Identidade e acesso": trilha IAM e Access Management. Reaproveita os
 * conceitos iam.* apresentados na S3 Expedition (os IDs são globais no registro)
 * e acrescenta STS, Organizations, federação, Cognito e Access Analyzer.
 */
import type { ContentModule, TrackDef } from '../../../engine/types'
import { IDENTITY_ACHIEVEMENTS } from './achievements'
import { F01_IAM_CONCEPTS } from './concepts/f01-identidades'
import { F02_IAM_CONCEPTS } from './concepts/f02-mfa'
import { F03_IAM_CONCEPTS } from './concepts/f03-politicas'
import { F04_IAM_CONCEPTS } from './concepts/f04-avaliacao'
import { F05_IAM_CONCEPTS } from './concepts/f05-sts'
import { F06_IAM_CONCEPTS } from './concepts/f06-roles-pratica'
import { F07_IAM_CONCEPTS } from './concepts/f07-federacao'
import { F08_IAM_CONCEPTS } from './concepts/f08-guardrails'
import { F01_IAM } from './phases/f01/phase'
import { F02_IAM } from './phases/f02/phase'
import { F03_IAM } from './phases/f03/phase'
import { F04_IAM } from './phases/f04/phase'
import { F05_IAM } from './phases/f05/phase'
import { F06_IAM } from './phases/f06/phase'
import { F07_IAM } from './phases/f07/phase'
import { F08_IAM } from './phases/f08/phase'
import { FINAL_IAM } from './phases/final/phase'
import { IDENTITY_QUESTIONS } from './questions'

export const IAM_ACCESS: TrackDef = {
  id: 'identity.iam-access',
  moduleId: 'identity',
  territory: 'seguranca',
  title: 'IAM e Access Management',
  subtitle: 'Autenticação, autorização e governança de acesso',
  summary:
    'Usuário raiz, MFA, políticas, roles, STS, federação, Cognito, várias contas e guardrails: tudo o que o SAA-C03 cobra sobre quem pode fazer o quê na AWS, com um motor de políticas que explica cada decisão.',
  glyph: 'idcard',
  recommends: ['foundations.aws-foundations'],
  serviceIds: ['aws.iam', 'aws.sts', 'aws.organizations', 'aws.control-tower', 'aws.iam-identity-center', 'aws.cognito', 'aws.directory-service', 'aws.iam-access-analyzer'],
  phases: [F01_IAM, F02_IAM, F03_IAM, F04_IAM, F05_IAM, F06_IAM, F07_IAM, F08_IAM],
  final: FINAL_IAM,
}

export const identityModule: ContentModule = {
  id: 'identity',
  title: 'Identidade e acesso',
  services: [],
  concepts: [...F01_IAM_CONCEPTS, ...F02_IAM_CONCEPTS, ...F03_IAM_CONCEPTS, ...F04_IAM_CONCEPTS, ...F05_IAM_CONCEPTS, ...F06_IAM_CONCEPTS, ...F07_IAM_CONCEPTS, ...F08_IAM_CONCEPTS],
  tracks: [IAM_ACCESS],
  achievements: IDENTITY_ACHIEVEMENTS,
  questions: IDENTITY_QUESTIONS,
}
