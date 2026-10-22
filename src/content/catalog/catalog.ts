/**
 * Catálogo global: territórios do mapa, domínios do exame SAA-C03 e títulos de nível.
 */
import type { ExamDomain, PlannedTrackDef, TerritoryDef } from '../../engine/types'

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

/**
 * Territórios do mapa. `examDomains` liga cada um aos domínios do SAA-C03 que
 * ele mais trabalha, pelas tarefas do guia do exame (consultado em
 * 16/10/2026): 1.1 a 1.3 (seguro), 2.1 e 2.2 (resiliente), 3.1 a 3.5 (alto
 * desempenho) e 4.1 a 4.4 (custo). É uma ligação pedagógica, não da AWS.
 */
export const TERRITORIES: TerritoryDef[] = [
  {
    id: 'fundamentos',
    title: 'Fundamentos',
    summary: 'Infraestrutura global, planos de suporte e o modelo de responsabilidade compartilhada.',
    glyph: 'globe',
    status: 'active',
    examDomains: ['d2', 'd1'],
  },
  {
    id: 'armazenamento',
    title: 'Armazenamento',
    summary: 'Objetos, blocos, arquivos, transferência e armazenamento híbrido.',
    glyph: 'bucket',
    status: 'active',
    examDomains: ['d3', 'd4', 'd1'],
  },
  {
    id: 'computacao',
    title: 'Computação',
    summary: 'Instâncias, volumes, balanceamento, escalonamento, contêineres e funções sem servidor.',
    glyph: 'server',
    status: 'active',
    examDomains: ['d3', 'd4', 'd2'],
  },
  {
    id: 'redes',
    title: 'Redes',
    summary: 'VPC, sub-redes, roteamento, conexões híbridas, DNS, entrega de conteúdo e proteção de borda.',
    glyph: 'network',
    status: 'active',
    examDomains: ['d1', 'd3', 'd4'],
  },
  {
    id: 'bancos-de-dados',
    title: 'Bancos de dados',
    summary: 'Relacionais, NoSQL, cache, data warehouse e migração de bancos.',
    glyph: 'database',
    status: 'active',
    examDomains: ['d3', 'd2', 'd4'],
  },
  {
    id: 'analise',
    title: 'Análise de dados e IA',
    summary: 'Data lake, consultas, processamento, streaming, visualização e serviços prontos de IA.',
    glyph: 'chart',
    status: 'active',
    examDomains: ['d3'],
  },
  {
    id: 'integracao',
    title: 'Integração e mensageria',
    summary: 'Filas, tópicos, eventos, orquestração, APIs e streams.',
    glyph: 'queue',
    status: 'active',
    examDomains: ['d2'],
  },
  {
    id: 'seguranca',
    title: 'Segurança e identidade',
    summary: 'Identidades, permissões, federação, organizações, chaves, segredos, certificados, detecção e conformidade.',
    glyph: 'shield',
    status: 'active',
    examDomains: ['d1'],
  },
  {
    id: 'monitoramento',
    title: 'Monitoramento e governança',
    summary: 'Métricas, auditoria, conformidade, automação, custos e recomendações.',
    glyph: 'eye',
    status: 'active',
    examDomains: ['d1', 'd4'],
  },
  {
    id: 'arquitetura',
    title: 'Arquitetura e otimização',
    summary: 'Alta disponibilidade, recuperação de desastres, custos e Well-Architected.',
    glyph: 'flag',
    status: 'planned',
    examDomains: ['d2', 'd4'],
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

/** Trilhas com plano pronto em docs/, mostradas na Base como "em desenvolvimento". */
export const PLANNED_TRACKS: PlannedTrackDef[] = [
  { id: 'files.aws-files', title: 'Arquivos e backup na AWS', subtitle: 'EFS, FSx, transferência de arquivos e AWS Backup', territory: 'armazenamento', glyph: 'file', examDomains: ['d2', 'd3', 'd4'], plan: 'docs/PLANO-IMPLEMENTACAO-MODULO-ARQUIVOS-E-BACKUP.md' },
  { id: 'architecture.well-architected', title: 'Arquitetura e otimização na AWS', subtitle: 'Well-Architected, resiliência, desempenho, custo e migração', territory: 'arquitetura', glyph: 'flag', examDomains: ['d2', 'd3', 'd4'], plan: 'docs/PLANO-IMPLEMENTACAO-MODULO-ARQUITETURA-E-OTIMIZACAO.md' },
]
