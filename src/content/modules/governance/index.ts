/**
 * Módulo "Monitoramento e governança": trilha Monitoramento e governança na
 * AWS. CloudWatch, logs e rastreamento, CloudTrail, Config, Systems Manager,
 * infraestrutura como código, governança multiconta, custos e a escolha do
 * serviço. Reaproveita conceitos de outras trilhas (org.*, support.*, iam.*):
 * os IDs são globais no registro.
 */
import type { ContentModule, TrackDef } from '../../../engine/types'
import { GOVERNANCE_ACHIEVEMENTS } from './achievements'
import { F01_GOV_CONCEPTS } from './concepts/f01-cloudwatch'
import { F02_GOV_CONCEPTS } from './concepts/f02-logs'
import { F03_GOV_CONCEPTS } from './concepts/f03-cloudtrail'
import { F04_GOV_CONCEPTS } from './concepts/f04-config'
import { F05_GOV_CONCEPTS } from './concepts/f05-ssm'
import { F06_GOV_CONCEPTS } from './concepts/f06-iac'
import { F07_GOV_CONCEPTS } from './concepts/f07-multiconta'
import { F08_GOV_CONCEPTS } from './concepts/f08-custos'
import { F09_GOV_CONCEPTS } from './concepts/f09-escolha'
import { F01_GOV } from './phases/f01/phase'
import { F02_GOV } from './phases/f02/phase'
import { F03_GOV } from './phases/f03/phase'
import { F04_GOV } from './phases/f04/phase'
import { F05_GOV } from './phases/f05/phase'
import { F06_GOV } from './phases/f06/phase'
import { F07_GOV } from './phases/f07/phase'
import { F08_GOV } from './phases/f08/phase'
import { F09_GOV } from './phases/f09/phase'
import { FINAL_GOV } from './phases/final/phase'
import { GOVERNANCE_QUESTIONS } from './questions'
import { F03_F04_QUESTIONS } from './questions-f03-f04'
import { F05_F06_QUESTIONS } from './questions-f05-f06'
import { F07_F08_QUESTIONS } from './questions-f07-f08'
import { F09_QUESTIONS } from './questions-f09'

export const AWS_GOVERNANCE: TrackDef = {
  id: 'governance.aws-governance',
  moduleId: 'governance',
  territory: 'monitoramento',
  title: 'Monitoramento e governança na AWS',
  subtitle: 'Métricas, auditoria, conformidade, automação e custos',
  summary:
    'CloudWatch, CloudTrail, Config, Systems Manager, CloudFormation e as ferramentas de custo: como enxergar o que acontece na conta, provar quem fez o quê, manter tudo dentro das regras e controlar a fatura.',
  glyph: 'eye',
  recommends: ['foundations.aws-foundations', 'identity.iam-access'],
  serviceIds: [
    'aws.cloudwatch',
    'aws.x-ray',
    'aws.managed-grafana',
    'aws.managed-prometheus',
    'aws.cloudtrail',
    'aws.config',
    'aws.systems-manager',
    'aws.cloudformation',
    'aws.service-catalog',
    'aws.license-manager',
    'aws.budgets',
    'aws.cost-explorer',
    'aws.cost-usage-report',
    'aws.trusted-advisor',
    'aws.health',
    'aws.service-quotas',
  ],
  phases: [F01_GOV, F02_GOV, F03_GOV, F04_GOV, F05_GOV, F06_GOV, F07_GOV, F08_GOV, F09_GOV],
  final: FINAL_GOV,
  // Cinco colunas: a cadeia F3, F4, F7, F9 e o final tem cinco níveis de dependência.
  mapHeight: 800,
}

export const governanceModule: ContentModule = {
  id: 'governance',
  title: 'Monitoramento e governança',
  services: [],
  concepts: [...F01_GOV_CONCEPTS, ...F02_GOV_CONCEPTS, ...F03_GOV_CONCEPTS, ...F04_GOV_CONCEPTS, ...F05_GOV_CONCEPTS, ...F06_GOV_CONCEPTS, ...F07_GOV_CONCEPTS, ...F08_GOV_CONCEPTS, ...F09_GOV_CONCEPTS],
  tracks: [AWS_GOVERNANCE],
  achievements: GOVERNANCE_ACHIEVEMENTS,
  questions: [...GOVERNANCE_QUESTIONS, ...F03_F04_QUESTIONS, ...F05_F06_QUESTIONS, ...F07_F08_QUESTIONS, ...F09_QUESTIONS],
}
