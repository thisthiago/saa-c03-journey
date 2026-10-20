/**
 * Avaliação de arquitetura dos desafios finais: decisões em etapas, rubrica por
 * dimensão e regras que cruzam decisões de etapas diferentes (o "contexto
 * compartilhado"). As dimensões, o título e o aviso vêm da configuração, então
 * cada trilha define a sua rubrica.
 */
import type { ExamDomainId } from '../../engine/types'

export type Dimension = string

export interface ArchDimension {
  id: Dimension
  label: string
  /** Domínio do SAA-C03 relacionado (alimenta a seção "Relação com o SAA-C03"). */
  examDomain?: ExamDomainId
}

export interface ArchOption {
  id: string
  label: string
  /** Nota de 0 a 1 em cada dimensão que a decisão afeta. */
  scores: Partial<Record<Dimension, number>>
  consequence: string
  /** Por que a alternativa é inadequada neste cenário (relatório: "alternativas rejeitadas"). */
  whyNot?: string
  concepts?: string[]
}

export interface ArchQuestion {
  id: string
  prompt: string
  /** Agrupa perguntas numa seção própria do relatório (ver `ArchConfig.groups`). */
  group?: string
  options: ArchOption[]
  /** Lembretes exibidos quando decisões anteriores são relevantes para esta pergunta. */
  context?: { when: [string, string[]]; text: string }[]
}

export interface ArchStep {
  id: string
  title: string
  intro: string
  questions: ArchQuestion[]
}

/** Regra que cruza decisões: dispara quando todas as condições batem. */
export interface ArchRule {
  id: string
  when: [string, string[]][]
  penalty: Partial<Record<Dimension, number>>
  message: string
  concepts?: string[]
}

export interface ArchConfig {
  /** Título do relatório (ex.: "Relatório do Projeto Atlas"). */
  title: string
  dimensions: ArchDimension[]
  steps: ArchStep[]
  rules: ArchRule[]
  /** Nota mínima por dimensão para aprovação. */
  minDimension: number
  /** Seções extras do relatório: erros nas perguntas de cada grupo. */
  groups?: { id: string; title: string }[]
  disclaimer?: string
}

export type ArchAnswers = Record<string, string | undefined>

export interface ArchResult {
  dimensions: Record<Dimension, number>
  overall: number
  passedDimensions: boolean
  score: number
  picks: { question: ArchQuestion; option: ArchOption | undefined; value: number }[]
  risks: ArchRule[]
}

const clamp = (n: number) => Math.max(0, Math.min(1, n))

export function ruleFires(r: ArchRule, a: ArchAnswers): boolean {
  return r.when.every(([q, opts]) => opts.includes(a[q] ?? ''))
}

export function evaluateArchitecture(c: ArchConfig, a: ArchAnswers): ArchResult {
  const ids = c.dimensions.map((d) => d.id)
  const sums = Object.fromEntries(ids.map((d) => [d, { total: 0, n: 0 }])) as Record<Dimension, { total: number; n: number }>
  const picks: ArchResult['picks'] = []
  for (const step of c.steps) {
    for (const q of step.questions) {
      const option = q.options.find((o) => o.id === a[q.id])
      // Sem resposta: conta como nota zero nas dimensões que a melhor opção avaliaria.
      const ref = option ?? q.options.reduce((x, y) => (Object.keys(y.scores).length > Object.keys(x.scores).length ? y : x))
      const dims = Object.keys(ref.scores) as Dimension[]
      let local = 0
      for (const d of dims) {
        const v = option ? (option.scores[d] ?? 0) : 0
        if (!sums[d]) throw new Error(`Dimensão não declarada: ${d}`)
        sums[d].total += v
        sums[d].n += 1
        local += v
      }
      picks.push({ question: q, option, value: dims.length ? local / dims.length : 0 })
    }
  }
  const risks = c.rules.filter((r) => ruleFires(r, a))
  const dimensions = Object.fromEntries(
    ids.map((d) => {
      const base = sums[d].n ? sums[d].total / sums[d].n : 1
      const pen = risks.reduce((s, r) => s + (r.penalty[d] ?? 0), 0)
      return [d, clamp(base - pen)]
    }),
  ) as Record<Dimension, number>
  const overall = ids.reduce((s, d) => s + dimensions[d], 0) / ids.length
  const passedDimensions = ids.every((d) => dimensions[d] >= c.minDimension)
  const score = passedDimensions ? overall : Math.min(overall, 0.69)
  return { dimensions, overall, passedDimensions, score, picks, risks }
}

/** Melhor resposta de cada pergunta (maior nota média). */
export function bestAnswers(c: ArchConfig): ArchAnswers {
  const out: ArchAnswers = {}
  for (const s of c.steps)
    for (const q of s.questions) {
      const avg = (o: ArchOption) => {
        const v = Object.values(o.scores).filter((x): x is number => x !== undefined)
        return v.length ? v.reduce((x, y) => x + y, 0) / v.length : 0
      }
      out[q.id] = q.options.reduce((x, y) => (avg(y) > avg(x) ? y : x)).id
    }
  return out
}

/** Notas por domínio do SAA-C03: média das dimensões ligadas a cada domínio. */
export function examDomainScores(c: ArchConfig, r: ArchResult): { domain: ExamDomainId; dimensions: ArchDimension[]; score: number }[] {
  const out = new Map<ExamDomainId, ArchDimension[]>()
  for (const d of c.dimensions) if (d.examDomain) out.set(d.examDomain, [...(out.get(d.examDomain) ?? []), d])
  return [...out.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([domain, dims]) => ({ domain, dimensions: dims, score: dims.reduce((s, d) => s + r.dimensions[d.id], 0) / dims.length }))
}
