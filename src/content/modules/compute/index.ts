/**
 * Módulo "Computação": trilha Computação na AWS. EC2, tipos de instância,
 * EBS, opções de compra, Elastic Load Balancing, Auto Scaling, Lambda,
 * contêineres e a escolha da computação. Reaproveita conceitos de outras
 * trilhas (infra.*, srm.*, iam.instance-profile): os IDs são globais no registro.
 */
import type { ContentModule, TrackDef } from '../../../engine/types'
import { COMPUTE_ACHIEVEMENTS } from './achievements'
import { F01_CMP_CONCEPTS } from './concepts/f01-ec2'
import { F02_CMP_CONCEPTS } from './concepts/f02-tipos'
import { F03_CMP_CONCEPTS } from './concepts/f03-ebs'
import { F04_CMP_CONCEPTS } from './concepts/f04-compra'
import { F05_CMP_CONCEPTS } from './concepts/f05-elb'
import { F06_CMP_CONCEPTS } from './concepts/f06-asg'
import { F07_CMP_CONCEPTS } from './concepts/f07-lambda'
import { F08_CMP_CONCEPTS } from './concepts/f08-conteineres'
import { F09_CMP_CONCEPTS } from './concepts/f09-escolha'
import { F01_CMP } from './phases/f01/phase'
import { F02_CMP } from './phases/f02/phase'
import { F03_CMP } from './phases/f03/phase'
import { F04_CMP } from './phases/f04/phase'
import { F05_CMP } from './phases/f05/phase'
import { F06_CMP } from './phases/f06/phase'
import { F07_CMP } from './phases/f07/phase'
import { F08_CMP } from './phases/f08/phase'
import { F09_CMP } from './phases/f09/phase'
import { FINAL_CMP } from './phases/final/phase'
import { COMPUTE_QUESTIONS } from './questions'

export const AWS_COMPUTE: TrackDef = {
  id: 'compute.aws-compute',
  moduleId: 'compute',
  territory: 'computacao',
  title: 'Computação na AWS',
  subtitle: 'EC2, escalabilidade, serverless e contêineres',
  summary:
    'Instâncias, volumes, opções de compra, balanceadores, Auto Scaling, Lambda e contêineres: como escolher, dimensionar e pagar pela computação que o SAA-C03 cobra, com preços reais da AWS em cada laboratório.',
  glyph: 'server',
  recommends: ['foundations.aws-foundations'],
  serviceIds: ['aws.ec2', 'aws.ebs', 'aws.elb', 'aws.ec2-auto-scaling', 'aws.lambda', 'aws.ecs', 'aws.eks', 'aws.fargate', 'aws.ecr', 'aws.batch', 'aws.elastic-beanstalk', 'aws.savings-plans'],
  phases: [F01_CMP, F02_CMP, F03_CMP, F04_CMP, F05_CMP, F06_CMP, F07_CMP, F08_CMP, F09_CMP],
  final: FINAL_CMP,
  // Cinco fases na segunda coluna: o canvas padrão (720) não comporta os rótulos.
  mapHeight: 800,
}

export const computeModule: ContentModule = {
  id: 'compute',
  title: 'Computação',
  services: [],
  concepts: [...F01_CMP_CONCEPTS, ...F02_CMP_CONCEPTS, ...F03_CMP_CONCEPTS, ...F04_CMP_CONCEPTS, ...F05_CMP_CONCEPTS, ...F06_CMP_CONCEPTS, ...F07_CMP_CONCEPTS, ...F08_CMP_CONCEPTS, ...F09_CMP_CONCEPTS],
  tracks: [AWS_COMPUTE],
  achievements: COMPUTE_ACHIEVEMENTS,
  questions: COMPUTE_QUESTIONS,
}
