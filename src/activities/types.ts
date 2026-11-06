/**
 * Configuração (dados) de cada tipo de atividade.
 *
 * O conteúdo descreve atividades com estes tipos. A avaliação fica em
 * `src/activities/<kind>/evaluate.ts` (funções puras) e a interface em
 * componentes React registrados por `kind`.
 */
import type { DiagramSpec } from '../engine/diagram'
import type { ActivityBase, GlyphName, ImpactDimension } from '../engine/types'
import type { PredictSpec } from './predict/specs'
import type { LabSpec } from './lab/specs'

// --- decision ---------------------------------------------------------------

export interface DecisionOption {
  id: string
  text: string
  correct: boolean
  /** O que acontece se esta opção for escolhida (RichText). */
  consequence: string
  impacts?: Partial<Record<ImpactDimension, number>>
}

export interface DecisionActivity extends ActivityBase {
  kind: 'decision'
  scenario?: string[]
  options: DecisionOption[]
  /** Permite selecionar várias opções ("selecione todas as adequadas"). */
  multiple?: boolean
  justification?: {
    prompt: string
    options: { id: string; text: string; correct: boolean; feedback: string }[]
  }
}

// --- classify / match -------------------------------------------------------

export interface ClassifyItem {
  id: string
  text: string
  bin: string
  explanation: string
  concepts?: string[]
}

export interface ClassifyActivity extends ActivityBase {
  kind: 'classify'
  bins: { id: string; label: string; description?: string }[]
  items: ClassifyItem[]
}

export interface MatchPair {
  id: string
  left: string
  right: string
  explanation: string
  concepts?: string[]
}

export interface MatchActivity extends ActivityBase {
  kind: 'match'
  leftLabel: string
  rightLabel: string
  pairs: MatchPair[]
}

// --- order ------------------------------------------------------------------

export interface OrderActivity extends ActivityBase {
  kind: 'order'
  /** Etapas na ordem correta; a interface embaralha. */
  steps: { id: string; text: string; explanation: string }[]
}

// --- predict ----------------------------------------------------------------

export interface PredictActivity extends ActivityBase {
  kind: 'predict'
  scenario?: string[]
  spec: PredictSpec
  /** `outcome` é comparado ao resultado calculado pelo simulador. */
  options: { id: string; text: string; outcome: string }[]
}

// --- estimate ---------------------------------------------------------------

export interface EstimateActivity extends ActivityBase {
  kind: 'estimate'
  scenario?: string[]
  unit: string
  min: number
  max: number
  step: number
  scale?: 'linear' | 'log'
  answer: number
  /** Tolerância relativa (0,25 = ±25%) para crédito total. */
  tolerance: number
}

// --- investigate ------------------------------------------------------------

export interface EvidenceLine {
  id: string
  text: string
  /** Linha relevante para o problema investigado. */
  isIssue: boolean
  explanation: string
}

export interface InvestigateActivity extends ActivityBase {
  kind: 'investigate'
  scenario?: string[]
  artifacts: { id: string; title: string; format: 'code' | 'table' | 'log'; lines: EvidenceLine[] }[]
  rootCause: { prompt: string; options: { id: string; text: string; correct: boolean; feedback: string }[] }
  remediations: { prompt: string; options: { id: string; text: string; correct: boolean; feedback: string }[] }
}

// --- build ------------------------------------------------------------------

/** Tipo de peça da montagem. `count` cria cópias iguais (padrão: 1). */
export interface BuildPiece {
  id: string
  text: string
  glyph?: GlyphName
  count?: number
  /** O que a peça faz e onde ela fica (RichText). */
  explanation: string
  concepts?: string[]
}

/** Lugar do desenho que recebe peças. Coordenadas no viewBox do `board`. */
export interface BuildSlot {
  id: string
  label: string
  description?: string
  x: number
  y: number
  w: number
  h: number
  /** Quantas cópias de cada peça o lugar precisa. Vazio: o lugar fica sem peça. */
  expect: Record<string, number>
  /** Por que o lugar precisa dessas peças (mostrado quando ele está errado). */
  explanation: string
}

export interface BuildActivity extends ActivityBase {
  kind: 'build'
  scenario?: string[]
  /** Desenho de fundo. Os lugares ficam por cima dele. */
  board: DiagramSpec
  pieces: BuildPiece[]
  slots: BuildSlot[]
}

// --- lab --------------------------------------------------------------------

export type LabActivity = ActivityBase & { kind: 'lab' } & LabSpec

export type ActivityDef =
  | DecisionActivity
  | ClassifyActivity
  | MatchActivity
  | OrderActivity
  | PredictActivity
  | EstimateActivity
  | InvestigateActivity
  | BuildActivity
  | LabActivity

export type ActivityKind = ActivityDef['kind']
