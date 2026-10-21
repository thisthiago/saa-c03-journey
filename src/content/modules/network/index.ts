/**
 * Módulo "Redes": trilha Redes na AWS. VPC e endereçamento, roteamento,
 * segurança na VPC, peering e Transit Gateway, endpoints, conectividade
 * híbrida, Route 53, CloudFront e Global Accelerator, proteção de borda e a
 * escolha da solução. Reaproveita conceitos de outras trilhas (ec2.*, edge.*,
 * infra.*, elb.*): os IDs são globais no registro.
 */
import type { ContentModule, TrackDef } from '../../../engine/types'
import { NETWORK_ACHIEVEMENTS } from './achievements'
import { F01_NET_CONCEPTS } from './concepts/f01-vpc'
import { F02_NET_CONCEPTS } from './concepts/f02-rotas'
import { F03_NET_CONCEPTS } from './concepts/f03-seguranca'
import { F04_NET_CONCEPTS } from './concepts/f04-conexao'
import { F05_NET_CONCEPTS } from './concepts/f05-endpoints'
import { F06_NET_CONCEPTS } from './concepts/f06-hibrida'
import { F07_NET_CONCEPTS } from './concepts/f07-dns'
import { F08_NET_CONCEPTS } from './concepts/f08-borda'
import { F09_NET_CONCEPTS } from './concepts/f09-protecao'
import { F01_NET } from './phases/f01/phase'
import { F02_NET } from './phases/f02/phase'
import { F03_NET } from './phases/f03/phase'
import { F04_NET } from './phases/f04/phase'
import { F05_NET } from './phases/f05/phase'
import { F06_NET } from './phases/f06/phase'
import { F07_NET } from './phases/f07/phase'
import { F08_NET } from './phases/f08/phase'
import { F09_NET } from './phases/f09/phase'
import { FINAL_NET } from './phases/final/phase'
import { NETWORK_QUESTIONS } from './questions'

export const AWS_NETWORK: TrackDef = {
  id: 'network.aws-network',
  moduleId: 'network',
  territory: 'redes',
  title: 'Redes na AWS',
  subtitle: 'VPC, conectividade, DNS e entrega de conteúdo',
  summary:
    'VPC, sub-redes, rotas, security groups, peering, Transit Gateway, endpoints, VPN, Direct Connect, Route 53, CloudFront, Global Accelerator, WAF e Shield: como montar a rede, ligar a empresa à nuvem, levar o usuário ao lugar certo e proteger a borda.',
  glyph: 'network',
  recommends: ['foundations.aws-foundations', 'compute.aws-compute'],
  serviceIds: [
    'aws.vpc',
    'aws.transit-gateway',
    'aws.privatelink',
    'aws.site-to-site-vpn',
    'aws.client-vpn',
    'aws.direct-connect',
    'aws.route53',
    'aws.cloudfront',
    'aws.global-accelerator',
    'aws.waf',
    'aws.shield',
    'aws.network-firewall',
    'aws.firewall-manager',
  ],
  phases: [F01_NET, F02_NET, F03_NET, F04_NET, F05_NET, F06_NET, F07_NET, F08_NET, F09_NET],
  final: FINAL_NET,
  mapHeight: 800,
}

export const networkModule: ContentModule = {
  id: 'network',
  title: 'Redes',
  services: [],
  concepts: [...F01_NET_CONCEPTS, ...F02_NET_CONCEPTS, ...F03_NET_CONCEPTS, ...F04_NET_CONCEPTS, ...F05_NET_CONCEPTS, ...F06_NET_CONCEPTS, ...F07_NET_CONCEPTS, ...F08_NET_CONCEPTS, ...F09_NET_CONCEPTS],
  tracks: [AWS_NETWORK],
  achievements: NETWORK_ACHIEVEMENTS,
  questions: NETWORK_QUESTIONS,
}
