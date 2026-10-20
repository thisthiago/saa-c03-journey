/**
 * Módulo AWS Foundations: infraestrutura global, planos de suporte e
 * responsabilidade compartilhada. Conhecimento transversal, reaproveitado
 * pelas demais trilhas (os conceitos são globais no registro).
 */
import type { ContentModule, TrackDef } from '../../../engine/types'
import { F01_FOUNDATIONS_CONCEPTS } from './concepts/f01-infraestrutura'
import { F02_FOUNDATIONS_CONCEPTS } from './concepts/f02-suporte'
import { F03_FOUNDATIONS_CONCEPTS } from './concepts/f03-responsabilidade'
import { F01_FOUNDATIONS } from './phases/f01/phase'
import { F02_FOUNDATIONS } from './phases/f02/phase'
import { F03_FOUNDATIONS } from './phases/f03/phase'
import { FINAL_FOUNDATIONS } from './phases/final/phase'
import { FOUNDATIONS_ACHIEVEMENTS } from './achievements'
import { FOUNDATIONS_QUESTIONS } from './questions'

export const AWS_FOUNDATIONS: TrackDef = {
  id: 'foundations.aws-foundations',
  moduleId: 'foundations',
  territory: 'fundamentos',
  title: 'AWS Foundations',
  subtitle: 'Infraestrutura Global, Segurança e Suporte',
  summary: 'Onde executar aplicações e guardar dados, como a segurança se divide entre a AWS e o cliente, e qual suporte combina com cada negócio. A base para todas as outras trilhas.',
  glyph: 'globe',
  serviceIds: ['aws.global-infrastructure', 'aws.local-zones', 'aws.wavelength', 'aws.outposts', 'aws.cloudfront', 'aws.route53', 'aws.global-accelerator', 'aws.support'],
  phases: [F01_FOUNDATIONS, F02_FOUNDATIONS, F03_FOUNDATIONS],
  final: FINAL_FOUNDATIONS,
}

export const foundationsModule: ContentModule = {
  id: 'foundations',
  title: 'Fundamentos',
  services: [],
  concepts: [...F01_FOUNDATIONS_CONCEPTS, ...F02_FOUNDATIONS_CONCEPTS, ...F03_FOUNDATIONS_CONCEPTS],
  tracks: [AWS_FOUNDATIONS],
  achievements: FOUNDATIONS_ACHIEVEMENTS,
  questions: FOUNDATIONS_QUESTIONS,
}
