/**
 * Avaliação pura das atividades. Cada função recebe a configuração (conteúdo)
 * e a resposta do usuário e devolve um `Evaluation` com score 0–1, feedback
 * por item e desempenho por conceito.
 */
import type { Evaluation, ItemFeedback } from '../engine/types'
import type {
  ActivityDef,
  ClassifyActivity,
  DecisionActivity,
  EstimateActivity,
  InvestigateActivity,
  LabActivity,
  MatchActivity,
  OrderActivity,
  PredictActivity,
} from './types'
import { resolvePredict } from './predict/resolve'
import { evaluateLab, labSolution } from './lab/evaluate'

export interface DecisionResponse {
  selected: string[]
  justification?: string
}
export interface PlacementResponse {
  placements: Record<string, string>
}
export interface OrderResponse {
  order: string[]
}
export interface PredictResponse {
  option: string
}
export interface EstimateResponse {
  value: number
}
export interface InvestigateResponse {
  flagged: string[]
  rootCause?: string
  remediations: string[]
}

export type ActivityResponse =
  | DecisionResponse
  | PlacementResponse
  | OrderResponse
  | PredictResponse
  | EstimateResponse
  | InvestigateResponse
  | Record<string, unknown>

const clamp01 = (n: number) => Math.max(0, Math.min(1, n))
const round = (n: number) => Math.round(n * 1000) / 1000

/** Desempenho por conceito: média dos itens marcados com o conceito, ou o score geral. */
export function conceptOutcomes(
  activity: ActivityDef,
  score: number,
  scoredItems: { concepts?: string[]; score: number }[] = [],
): Record<string, number> {
  const out: Record<string, number> = {}
  for (const c of activity.concepts) {
    const tagged = scoredItems.filter((i) => i.concepts?.includes(c.id))
    out[c.id] = tagged.length > 0 ? round(tagged.reduce((s, i) => s + i.score, 0) / tagged.length) : round(score)
  }
  return out
}

export function evaluateDecision(a: DecisionActivity, r: DecisionResponse): Evaluation {
  const selected = new Set(r.selected)
  const correct = a.options.filter((o) => o.correct)
  const items: ItemFeedback[] = []
  let choiceScore: number
  if (a.multiple) {
    const hits = correct.filter((o) => selected.has(o.id)).length
    const wrong = a.options.filter((o) => !o.correct && selected.has(o.id)).length
    choiceScore = clamp01((hits - wrong) / Math.max(1, correct.length))
  } else {
    const chosen = a.options.find((o) => selected.has(o.id))
    choiceScore = chosen?.correct ? 1 : 0
  }
  for (const o of a.options) {
    const isSel = selected.has(o.id)
    if (!isSel && !o.correct) continue
    items.push({
      id: o.id,
      label: o.text,
      status: isSel ? (o.correct ? 'correct' : 'wrong') : 'missed',
      message: o.consequence,
    })
  }
  let score = choiceScore
  if (a.justification) {
    const j = a.justification.options.find((o) => o.id === r.justification)
    const jScore = j?.correct ? 1 : 0
    // A justificativa só vale quando a escolha está certa: evita premiar chute.
    score = choiceScore * 0.7 + (choiceScore > 0 ? jScore * 0.3 * choiceScore : 0)
    if (j) items.push({ id: `just-${j.id}`, label: `Justificativa: ${j.text}`, status: j.correct ? 'correct' : 'wrong', message: j.feedback })
  }
  const consequences = a.options
    .filter((o) => selected.has(o.id))
    .map((o) => ({ tone: (o.correct ? 'good' : 'bad') as 'good' | 'bad', text: o.consequence, impacts: o.impacts }))
  score = round(score)
  return { score, items, consequences, conceptOutcomes: conceptOutcomes(a, score) }
}

export function evaluateClassify(a: ClassifyActivity, r: PlacementResponse): Evaluation {
  const binLabel = (id: string) => a.bins.find((b) => b.id === id)?.label ?? '—'
  const scored = a.items.map((it) => {
    const placed = r.placements[it.id]
    const ok = placed === it.bin
    return {
      concepts: it.concepts,
      score: ok ? 1 : 0,
      fb: {
        id: it.id,
        label: it.text,
        status: ok ? 'correct' : placed ? 'wrong' : 'missed',
        message: ok ? it.explanation : `Correto: ${binLabel(it.bin)}. ${it.explanation}`,
      } as ItemFeedback,
    }
  })
  const score = round(scored.reduce((s, i) => s + i.score, 0) / Math.max(1, scored.length))
  return { score, items: scored.map((s) => s.fb), conceptOutcomes: conceptOutcomes(a, score, scored) }
}

export function evaluateMatch(a: MatchActivity, r: PlacementResponse): Evaluation {
  const scored = a.pairs.map((p) => {
    const placed = r.placements[p.id]
    const ok = placed === p.id
    return {
      concepts: p.concepts,
      score: ok ? 1 : 0,
      fb: {
        id: p.id,
        label: `${p.left} → ${p.right}`,
        status: ok ? 'correct' : placed ? 'wrong' : 'missed',
        message: p.explanation,
      } as ItemFeedback,
    }
  })
  const score = round(scored.reduce((s, i) => s + i.score, 0) / Math.max(1, scored.length))
  return { score, items: scored.map((s) => s.fb), conceptOutcomes: conceptOutcomes(a, score, scored) }
}

/** Comprimento da maior subsequência crescente: mede quantos itens já estão em ordem relativa correta. */
export function longestIncreasingSubsequence(values: number[]): number {
  const tails: number[] = []
  for (const v of values) {
    let lo = 0
    let hi = tails.length
    while (lo < hi) {
      const mid = (lo + hi) >> 1
      if (tails[mid] < v) lo = mid + 1
      else hi = mid
    }
    tails[lo] = v
  }
  return tails.length
}

export function evaluateOrder(a: OrderActivity, r: OrderResponse): Evaluation {
  const indexOf = new Map(a.steps.map((s, i) => [s.id, i]))
  const positions = r.order.map((id) => indexOf.get(id) ?? -1).filter((i) => i >= 0)
  const lis = longestIncreasingSubsequence(positions)
  const n = a.steps.length
  const score = n <= 1 ? 1 : round(clamp01((lis - 1) / (n - 1)))
  const items: ItemFeedback[] = a.steps.map((s, i) => ({
    id: s.id,
    label: `${i + 1}. ${s.text}`,
    status: r.order[i] === s.id ? 'correct' : 'wrong',
    message: s.explanation,
  }))
  return { score, items, conceptOutcomes: conceptOutcomes(a, score) }
}

export function evaluatePredict(a: PredictActivity, r: PredictResponse): Evaluation {
  const result = resolvePredict(a.spec)
  const chosen = a.options.find((o) => o.id === r.option)
  const ok = chosen?.outcome === result.outcome
  const right = a.options.find((o) => o.outcome === result.outcome)
  const score = ok ? 1 : 0
  return {
    score,
    summary: `Resultado do simulador: ${right?.text ?? result.outcome}`,
    items: [
      {
        id: 'prediction',
        label: chosen ? `Sua previsão: ${chosen.text}` : 'Sem previsão',
        status: ok ? 'correct' : 'wrong',
        message: result.detail.join(' '),
      },
    ],
    conceptOutcomes: conceptOutcomes(a, score),
  }
}

export function evaluateEstimate(a: EstimateActivity, r: EstimateResponse): Evaluation {
  const err = Math.abs(r.value - a.answer) / Math.max(Math.abs(a.answer), Number.EPSILON)
  const score = err <= a.tolerance ? 1 : err <= a.tolerance * 2 ? 0.5 : 0
  return {
    score,
    items: [
      {
        id: 'estimate',
        label: `Sua estimativa: ${r.value.toLocaleString('pt-BR')} ${a.unit}`,
        status: score === 1 ? 'correct' : score > 0 ? 'partial' : 'wrong',
        message: `Valor de referência: ${a.answer.toLocaleString('pt-BR', { maximumFractionDigits: 2 })} ${a.unit} (tolerância de ±${Math.round(a.tolerance * 100)}%).`,
      },
    ],
    conceptOutcomes: conceptOutcomes(a, score),
  }
}

export function evaluateInvestigate(a: InvestigateActivity, r: InvestigateResponse): Evaluation {
  const lines = a.artifacts.flatMap((art) => art.lines)
  const issues = lines.filter((l) => l.isIssue)
  const flagged = new Set(r.flagged)
  const tp = issues.filter((l) => flagged.has(l.id)).length
  const fp = lines.filter((l) => !l.isIssue && flagged.has(l.id)).length
  const precision = tp + fp === 0 ? 0 : tp / (tp + fp)
  const recall = issues.length === 0 ? 1 : tp / issues.length
  const f1 = precision + recall === 0 ? 0 : (2 * precision * recall) / (precision + recall)
  const root = a.rootCause.options.find((o) => o.id === r.rootCause)
  const rootScore = root?.correct ? 1 : 0
  const goodFixes = a.remediations.options.filter((o) => o.correct)
  const chosenFixes = new Set(r.remediations)
  const fixHits = goodFixes.filter((o) => chosenFixes.has(o.id)).length
  const fixWrong = a.remediations.options.filter((o) => !o.correct && chosenFixes.has(o.id)).length
  const fixScore = clamp01((fixHits - fixWrong) / Math.max(1, goodFixes.length))
  const score = round(f1 * 0.4 + rootScore * 0.3 + fixScore * 0.3)
  const items: ItemFeedback[] = [
    ...lines
      .filter((l) => l.isIssue || flagged.has(l.id))
      .map((l) => ({
        id: l.id,
        label: l.text,
        status: (l.isIssue ? (flagged.has(l.id) ? 'correct' : 'missed') : 'wrong') as ItemFeedback['status'],
        message: l.explanation,
      })),
    ...(root ? [{ id: `root-${root.id}`, label: `Causa: ${root.text}`, status: (root.correct ? 'correct' : 'wrong') as ItemFeedback['status'], message: root.feedback }] : []),
    ...a.remediations.options
      .filter((o) => o.correct || chosenFixes.has(o.id))
      .map((o) => ({
        id: `fix-${o.id}`,
        label: `Correção: ${o.text}`,
        status: (o.correct ? (chosenFixes.has(o.id) ? 'correct' : 'missed') : 'wrong') as ItemFeedback['status'],
        message: o.feedback,
      })),
  ]
  return { score, items, conceptOutcomes: conceptOutcomes(a, score) }
}

export function evaluateActivity(activity: ActivityDef, response: ActivityResponse): Evaluation {
  switch (activity.kind) {
    case 'decision':
      return evaluateDecision(activity, response as DecisionResponse)
    case 'classify':
      return evaluateClassify(activity, response as PlacementResponse)
    case 'match':
      return evaluateMatch(activity, response as PlacementResponse)
    case 'order':
      return evaluateOrder(activity, response as OrderResponse)
    case 'predict':
      return evaluatePredict(activity, response as PredictResponse)
    case 'estimate':
      return evaluateEstimate(activity, response as EstimateResponse)
    case 'investigate':
      return evaluateInvestigate(activity, response as InvestigateResponse)
    case 'lab':
      return evaluateLabActivity(activity, response)
  }
}

function evaluateLabActivity(activity: LabActivity, response: ActivityResponse): Evaluation {
  const { score, items } = evaluateLab(activity, response)
  const s = round(score)
  return { score: s, items: items.map((i) => i.fb), conceptOutcomes: conceptOutcomes(activity, s, items) }
}

/** Resposta de referência (100%) usada pela solução guiada e pelos testes de integridade. */
export function referenceResponse(activity: ActivityDef): ActivityResponse {
  switch (activity.kind) {
    case 'decision':
      return {
        selected: activity.options.filter((o) => o.correct).map((o) => o.id).slice(0, activity.multiple ? undefined : 1),
        justification: activity.justification?.options.find((o) => o.correct)?.id,
      }
    case 'classify':
      return { placements: Object.fromEntries(activity.items.map((i) => [i.id, i.bin])) }
    case 'match':
      return { placements: Object.fromEntries(activity.pairs.map((p) => [p.id, p.id])) }
    case 'order':
      return { order: activity.steps.map((s) => s.id) }
    case 'predict': {
      const outcome = resolvePredict(activity.spec).outcome
      return { option: activity.options.find((o) => o.outcome === outcome)?.id ?? '' }
    }
    case 'estimate':
      return { value: activity.answer }
    case 'investigate':
      return {
        flagged: activity.artifacts.flatMap((a) => a.lines.filter((l) => l.isIssue).map((l) => l.id)),
        rootCause: activity.rootCause.options.find((o) => o.correct)?.id,
        remediations: activity.remediations.options.filter((o) => o.correct).map((o) => o.id),
      }
    case 'lab':
      return labReference(activity)
  }
}

function labReference(activity: LabActivity): ActivityResponse {
  return labSolution(activity) as ActivityResponse
}
