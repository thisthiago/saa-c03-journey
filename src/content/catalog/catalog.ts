/**
 * Catálogo global: territórios do mapa, domínios do exame SAA-C03 e títulos de nível.
 */
import type { ExamDomain, TerritoryDef } from '../../engine/types'

/**
 * Domínios e pesos do exame SAA-C03.
 * Fonte: https://docs.aws.amazon.com/aws-certification/latest/solutions-architect-associate-03/solutions-architect-associate-03.html
 * (consultado em 16/10/2026).
 */
export const EXAM_DOMAINS: ExamDomain[] = [
  { id: 'd1', officialName: 'Design Secure Architectures', title: 'Arquiteturas seguras', weight: 0.3 },
  { id: 'd2', officialName: 'Design Resilient Architectures', title: 'Arquiteturas resilientes', weight: 0.26 },
  { id: 'd3', officialName: 'Design High-Performing Architectures', title: 'Arquiteturas de alto desempenho', weight: 0.24 },
  { id: 'd4', officialName: 'Design Cost-Optimized Architectures', title: 'Arquiteturas com custo otimizado', weight: 0.2 },
]

export const EXAM_INFO = {
  code: 'SAA-C03',
  name: 'AWS Certified Solutions Architect – Associate',
  scoredQuestions: 50,
  unscoredQuestions: 15,
  passingScore: 720,
  url: 'https://aws.amazon.com/certification/certified-solutions-architect-associate/',
  guideUrl: 'https://docs.aws.amazon.com/aws-certification/latest/solutions-architect-associate-03/solutions-architect-associate-03.html',
  checkedAt: '2026-10-16',
}

export const TERRITORIES: TerritoryDef[] = [
  {
    id: 'fundamentos',
    title: 'Fundamentos',
    summary: 'Infraestrutura global, planos de suporte e o modelo de responsabilidade compartilhada.',
    glyph: 'globe',
    status: 'active',
  },
  {
    id: 'armazenamento',
    title: 'Armazenamento',
    summary: 'Objetos, blocos, arquivos, transferência e armazenamento híbrido.',
    glyph: 'bucket',
    status: 'active',
  },
  {
    id: 'computacao',
    title: 'Computação',
    summary: 'Instâncias, volumes, balanceamento, escalonamento, contêineres e funções sem servidor.',
    glyph: 'server',
    status: 'active',
  },
  {
    id: 'redes',
    title: 'Redes',
    summary: 'VPC, sub-redes, roteamento, conexões híbridas, DNS, entrega de conteúdo e proteção de borda.',
    glyph: 'network',
    status: 'active',
  },
  {
    id: 'bancos-de-dados',
    title: 'Bancos de dados',
    summary: 'Relacionais, NoSQL, cache, data warehouse e migração de bancos.',
    glyph: 'database',
    status: 'active',
  },
  {
    id: 'integracao',
    title: 'Integração e mensageria',
    summary: 'Filas, tópicos, eventos e orquestração.',
    glyph: 'queue',
    status: 'planned',
    plannedServices: ['Amazon SQS', 'Amazon SNS', 'Amazon EventBridge', 'AWS Step Functions'],
  },
  {
    id: 'seguranca',
    title: 'Segurança e identidade',
    summary: 'Identidades, permissões, federação, organizações, chaves e segredos.',
    glyph: 'shield',
    status: 'active',
    plannedServices: ['AWS KMS', 'AWS Secrets Manager'],
  },
  {
    id: 'monitoramento',
    title: 'Monitoramento e governança',
    summary: 'Métricas, auditoria, conformidade, automação, custos e recomendações.',
    glyph: 'eye',
    status: 'active',
  },
  {
    id: 'arquitetura',
    title: 'Arquitetura e otimização',
    summary: 'Alta disponibilidade, recuperação de desastres, custos e Well-Architected.',
    glyph: 'flag',
    status: 'planned',
    plannedServices: ['AWS Well-Architected Framework'],
  },
]

/** Títulos neutros por nível (o último se repete nos níveis seguintes). */
export const LEVEL_TITLES = [
  'Aprendiz da Nuvem',
  'Cadete da Nuvem',
  'Navegante de Regiões',
  'Guarda das Zonas',
  'Sentinela de Acesso',
  'Especialista em Serviços',
  'Estrategista de Custos',
  'Vigia da Resiliência',
  'Especialista em Recuperação',
  'Estrategista de Arquitetura',
  'Referência em Arquitetura',
  'Lenda da Nuvem',
]
