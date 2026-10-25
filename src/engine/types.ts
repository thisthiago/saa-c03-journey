/**
 * Tipos de domínio da plataforma AWS Quest.
 *
 * Este módulo não depende de React. O conteúdo educacional (src/content) é
 * descrito com estes tipos e a lógica de jogo (src/engine) opera sobre eles.
 */
import type { ActivityDef } from '../activities/types'

// ---------------------------------------------------------------------------
// Catálogo
// ---------------------------------------------------------------------------

/** Domínios de conteúdo do exame AWS Certified Solutions Architect – Associate (SAA-C03). */
export type ExamDomainId = 'd1' | 'd2' | 'd3' | 'd4'

export interface ExamDomain {
  id: ExamDomainId
  officialName: string
  title: string
  /** Peso no conteúdo pontuado do exame (0–1). */
  weight: number
}

export interface Reference {
  title: string
  url: string
}

/** Situação comercial de um serviço, recurso ou produto. */
export type Availability =
  | { kind: 'current' }
  | { kind: 'legacy'; note: string }
  | { kind: 'no-new-customers'; since?: string; note: string; alternatives?: string[] }
  | { kind: 'discontinued'; since: string; note: string; alternatives?: string[] }

export type GlyphName =
  | 'bucket'
  | 'object'
  | 'block'
  | 'file'
  | 'coins'
  | 'shield'
  | 'key'
  | 'history'
  | 'cycle'
  | 'globe'
  | 'bolt'
  | 'receipt'
  | 'bridge'
  | 'truck'
  | 'trophy'
  | 'server'
  | 'network'
  | 'database'
  | 'queue'
  | 'topic'
  | 'function'
  | 'eye'
  | 'flag'
  | 'zone'
  | 'tower'
  | 'factory'
  | 'lifebuoy'
  | 'handshake'
  | 'pin'
  | 'user'
  | 'users'
  | 'idcard'
  | 'fingerprint'
  | 'policy'
  | 'org'
  | 'ticket'
  | 'cpu'
  | 'container'
  | 'drive'
  | 'split'
  | 'percent'
  | 'scale'
  | 'layers'
  | 'table'
  | 'cache'
  | 'warehouse'
  | 'migrate'
  | 'bell'
  | 'gauge'
  | 'clipboard'
  | 'terminal'
  | 'wallet'
  | 'code'
  | 'route'
  | 'plug'
  | 'lock'
  | 'firewall'
  | 'router'
  | 'waypoints'
  | 'chart'
  | 'search'
  | 'brain'
  | 'video'
  | 'waves'
  | 'scan'
  | 'certificate'
  | 'radar'
  | 'siren'
  | 'shield-check'
  | 'workflow'
  | 'api'
  | 'ordered'

export interface TerritoryDef {
  id: string
  title: string
  summary: string
  glyph: GlyphName
  status: 'active' | 'planned'
  /** Serviços previstos para o território (informativo). */
  plannedServices?: string[]
  /** Domínios do SAA-C03 que o território mais trabalha (ligação pedagógica, por tarefa do guia do exame). */
  examDomains?: ExamDomainId[]
}

/** Trilha com plano de implementação pronto, ainda sem conteúdo jogável. */
export interface PlannedTrackDef {
  id: string
  title: string
  subtitle: string
  territory: string
  glyph: GlyphName
  examDomains: ExamDomainId[]
  /** Caminho do plano em docs/. */
  plan: string
}

export interface ServiceDef {
  id: string
  officialName: string
  shortName: string
  territory: string
  summary: string
  docsUrl: string
  availability: Availability
  glyph: GlyphName
}

// ---------------------------------------------------------------------------
// Conceitos
// ---------------------------------------------------------------------------

export interface ConceptDef {
  id: string
  /** Rótulo em português. */
  title: string
  /** Nome oficial (em inglês) usado pela AWS. */
  officialName: string
  serviceIds: string[]
  /** Uma ou duas frases. Aceita a marcação de RichText. */
  summary: string
  explanation?: string[]
  prerequisites?: string[]
  useCases?: string[]
  benefits?: string[]
  limitations?: string[]
  comparisons?: { with: string; text: string }[]
  commonMistakes?: string[]
  consequences?: string[]
  /** Fatos técnicos documentados. */
  facts?: string[]
  /** Recomendações de arquitetura (julgamento, não regra da AWS). */
  recommendations?: string[]
  exam: { domains: ExamDomainId[]; relevance: 'alta' | 'media' | 'baixa'; notes?: string }
  references: Reference[]
  availability?: Availability
  /** Desafios curtos usados pela revisão espaçada. */
  reviewItems?: ActivityDef[]
  /** Categorias para conquistas e painéis (ex.: 'seguranca', 'custos'). */
  tags?: ConceptTag[]
}

export type ConceptTag =
  | 'seguranca'
  | 'custos'
  | 'disponibilidade'
  | 'durabilidade'
  | 'recuperacao'
  | 'desempenho'
  | 'integracao'
  | 'fundamentos'
  | 'hibrido'
  | 'migracao'

// ---------------------------------------------------------------------------
// Trilhas, fases, missões e atividades
// ---------------------------------------------------------------------------

export interface ActivityConceptRef {
  id: string
  /** Peso da evidência para o conceito (padrão 1). */
  weight?: number
}

/** Campos comuns a todos os tipos de atividade. */
export interface ActivityBase {
  id: string
  kind: string
  title: string
  /** Enunciado curto (RichText). */
  prompt: string
  concepts: ActivityConceptRef[]
  /** XP máximo obtido com 100% na primeira tentativa, sem dicas. */
  xp: number
  difficulty: 1 | 2 | 3
  hints?: string[]
  /** Explicação geral mostrada depois de cada tentativa (RichText). */
  explanation: string[]
  /** Material de apoio exibido abaixo do enunciado (ex.: políticas em JSON). */
  exhibits?: { title: string; code: string }[]
  /** Conceitos com resultado fraco voltam já para a fila de revisão (usado no desafio final). */
  reviewWeakNow?: boolean
}

export interface Briefing {
  company: string
  role: string
  situation: string
  objective: string
  successCriteria: string[]
}

export interface IntelCardDef {
  conceptId: string
  /** Texto curto específico desta missão (RichText). Se ausente, usa o resumo do conceito. */
  body?: string[]
  /** Visual ilustrativo registrado em features/mission/visuals. */
  visual?: string
  /** Alerta de simplificação ligado a este cartão. */
  simplification?: string
}

export type MissionType = 'mission' | 'boss' | 'final'

export interface MissionDef {
  id: string
  title: string
  type: MissionType
  summary: string
  briefing: Briefing
  intel: IntelCardDef[]
  activities: ActivityDef[]
  debrief: { takeaways: string[] }
  /** Média ponderada mínima dos melhores scores para aprovação. */
  passThreshold?: number
  /** XP concedido uma única vez quando a missão é aprovada. */
  bonusXp?: number
}

export interface PhaseDef {
  id: string
  order: number
  title: string
  subtitle: string
  summary: string
  glyph: GlyphName
  /** Cor de destaque da fase (token CSS ou hexadecimal). */
  color: string
  requires: string[]
  recommends?: string[]
  concepts: string[]
  missions: MissionDef[]
  availability: 'available' | 'in-construction'
  simplifications?: string[]
  estimatedMinutes: number
  /** Centro do hexágono no mapa da trilha (canvas 900 × altura da trilha). */
  map: { x: number; y: number }
}

export interface TrackDef {
  id: string
  moduleId: string
  territory: string
  title: string
  subtitle: string
  summary: string
  serviceIds: string[]
  /** Ícone da trilha na Base e no mapa (padrão: o do território). */
  glyph?: GlyphName
  requires?: string[]
  recommends?: string[]
  phases: PhaseDef[]
  /** Desafio final da trilha, tratado como uma fase especial do mapa. */
  final?: PhaseDef
  /** Altura do canvas do mapa (padrão 720), para trilhas com muitas fases por coluna. */
  mapHeight?: number
}

// ---------------------------------------------------------------------------
// Conquistas
// ---------------------------------------------------------------------------

export type AchievementCategory =
  | 'seguranca'
  | 'custos'
  | 'disponibilidade'
  | 'recuperacao'
  | 'desempenho'
  | 'aprendizagem'
  | 'exploracao'

export type AchievementCondition =
  | { type: 'phase-completed'; phaseId: string }
  | { type: 'mission-score'; missionId: string; min: number }
  | { type: 'perfect-first-try'; activityId: string }
  | { type: 'perfect-first-try-count'; count: number }
  | { type: 'concepts-mastered'; conceptIds?: string[]; tag?: ConceptTag; count?: number }
  | { type: 'comeback'; count: number }
  | { type: 'reviews-completed'; count: number }
  | { type: 'level-reached'; level: number }
  | { type: 'all'; of: AchievementCondition[] }

export interface AchievementDef {
  id: string
  title: string
  description: string
  category: AchievementCategory
  glyph: GlyphName
  xp: number
  condition: AchievementCondition
}

// ---------------------------------------------------------------------------
// Módulos de conteúdo
// ---------------------------------------------------------------------------

/** Unidade de registro: um pacote de serviços, conceitos, trilhas e conquistas. */
export interface ContentModule {
  id: string
  title: string
  services: ServiceDef[]
  concepts: ConceptDef[]
  tracks: TrackDef[]
  achievements: AchievementDef[]
  /** Banco de questões no estilo do exame (usado pela Revisão). */
  questions?: ExamQuestion[]
}

// ---------------------------------------------------------------------------
// Banco de questões
// ---------------------------------------------------------------------------

export interface ExamOption {
  id: string
  text: string
  correct: boolean
  /** Por que a opção está certa ou errada (RichText). */
  why: string
}

/**
 * Questão no formato do exame: múltipla escolha (1 correta entre 4) ou
 * resposta múltipla (2 ou mais corretas entre 5 ou mais). A correção é
 * tudo ou nada, como no exame.
 */
export interface ExamQuestion {
  id: string
  /** Conceito principal, mostrado no enunciado. */
  concept: string
  /** Outros conceitos avaliados pela questão. */
  related?: string[]
  difficulty: 1 | 2 | 3
  domain: ExamDomainId
  /** Cenário (RichText, um parágrafo por item). */
  stem: string[]
  /** Pergunta final, depois do cenário. */
  question: string
  options: ExamOption[]
  /** Explicação geral mostrada depois da resposta (RichText). */
  explanation: string[]
  /** Material de apoio exibido no enunciado (ex.: políticas em JSON). */
  exhibits?: { title: string; code: string }[]
}

// ---------------------------------------------------------------------------
// Avaliação
// ---------------------------------------------------------------------------

export interface ItemFeedback {
  id: string
  label: string
  status: 'correct' | 'partial' | 'wrong' | 'missed'
  message?: string
}

export type ImpactDimension = 'custo' | 'seguranca' | 'disponibilidade' | 'durabilidade' | 'desempenho'

export interface Evaluation {
  /** Score de 0 a 1. */
  score: number
  items: ItemFeedback[]
  /** Desempenho por conceito (0–1). */
  conceptOutcomes: Record<string, number>
  /** Mensagem-resumo opcional calculada pelo avaliador. */
  summary?: string
  /** Consequências narradas (ex.: efeito de uma decisão). */
  consequences?: { tone: 'good' | 'bad' | 'neutral'; text: string; impacts?: Partial<Record<ImpactDimension, number>> }[]
}

// ---------------------------------------------------------------------------
// Progresso persistido
// ---------------------------------------------------------------------------

export interface ActivityProgress {
  attempts: number
  bestScore: number
  /** Soma do XP já concedido por esta atividade. */
  xpEarned: number
  firstScore: number
  solutionViewed: boolean
  failedBeforePass: boolean
  passedAt?: string
  lastAttemptAt: string
}

export interface ConceptProgress {
  mastery: number
  evidence: number
  /** Caixa de Leitner (0–5). */
  box: number
  nextReviewAt: string
  lastSeenAt: string
  lastPromotionDay?: string
  recentErrors: number
  lastReviewItemId?: string
}

export interface MissionProgress {
  startedAt: string
  passedAt?: string
  bonusAwarded: boolean
}

export interface QuestionProgress {
  attempts: number
  correct: number
  lastCorrect: boolean
  lastAt: string
}

export interface SimuladoRecord {
  at: string
  total: number
  correct: number
  /** Tempo usado, em segundos. */
  seconds: number
  timed: boolean
}

export interface XpEntry {
  at: string
  amount: number
  source: 'activity' | 'mission' | 'review' | 'achievement'
  refId: string
}

export interface ProgressState {
  schemaVersion: 1
  createdAt: string
  updatedAt: string
  xp: number
  ledger: XpEntry[]
  activities: Record<string, ActivityProgress>
  missions: Record<string, MissionProgress>
  concepts: Record<string, ConceptProgress>
  /** Conceitos apresentados (Codex), mesmo sem evidência avaliada. */
  discovered: Record<string, string>
  achievements: Record<string, { unlockedAt: string }>
  reviews: {
    sessions: number
    itemsAnswered: number
    /** conceptId → nextReviewAt do ciclo em que o XP de revisão já foi concedido. */
    awardedCycles: Record<string, string>
  }
  stats: {
    comebacks: number
    perfectFirstTries: number
    activeDays: string[]
  }
  /** Banco de questões: resultado por questão e histórico de simulados. */
  exam: {
    questions: Record<string, QuestionProgress>
    simulados: SimuladoRecord[]
  }
  resume?: { missionId: string; step: number; at: string }
  drafts: Record<string, unknown>
  /** contextPanel: painel com o contexto da missão ao lado dos desafios (desktop). */
  settings: { theme: 'dark' | 'light' | 'system'; reducedMotion: boolean; contextPanel: boolean }
}

// ---------------------------------------------------------------------------
// Eventos de jogo (efeitos de uma ação, exibidos pela interface)
// ---------------------------------------------------------------------------

export type GameEvent =
  | { type: 'xp'; amount: number; reason: string; source: XpEntry['source'] }
  | { type: 'level-up'; level: number; title: string }
  | { type: 'mission-passed'; missionId: string; title: string }
  | { type: 'phase-completed'; phaseId: string; title: string }
  | { type: 'achievement'; achievementId: string; title: string }
  | { type: 'concept-mastered'; conceptId: string; title: string }
