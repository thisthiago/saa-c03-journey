/**
 * Leitura de uma questão no formato do exame: separar as restrições que toda
 * resposta precisa cumprir do requisito que decide entre as que funcionam
 * ("menor custo", "menos esforço operacional"), e eliminar as alternativas.
 *
 * Conferido em 22/10/2026: questões de múltipla escolha têm uma resposta
 * certa e três distratores; as de resposta múltipla, duas ou mais certas entre
 * cinco ou mais; os distratores são plausíveis para quem tem conhecimento
 * incompleto
 * (https://docs.aws.amazon.com/aws-certification/latest/solutions-architect-associate-03/solutions-architect-associate-03.html).
 *
 * Os enunciados são do AWS Quest, nunca questões reais do exame. Quais
 * restrições cada alternativa cumpre e a ordem no requisito decisivo são
 * julgamento de arquitetura, declarado em cada cenário.
 */

export interface ExamRequirement {
  id: string
  label: string
}

export interface ExamAlternative {
  id: string
  text: string
  /** Restrições cumpridas. */
  meets: string[]
  /** Posição no requisito decisivo entre as que cumprem tudo (1 = a melhor). */
  rank: number
}

export interface ExamScenario {
  stem: string[]
  question: string
  constraints: ExamRequirement[]
  decisive: ExamRequirement
  alternatives: ExamAlternative[]
}

export type Verdict = 'answer' | 'works' | 'fails'

export const VERDICT_LABEL: Record<Verdict, string> = {
  answer: 'É a resposta',
  works: 'Funciona, mas perde no requisito decisivo',
  fails: 'Não cumpre uma restrição',
}

export const missing = (s: ExamScenario, a: ExamAlternative) => s.constraints.filter((c) => !a.meets.includes(c.id))

/** Alternativa certa: cumpre todas as restrições e é a melhor no requisito decisivo. Lança erro se não for única. */
export function answerOf(s: ExamScenario): ExamAlternative {
  const ok = s.alternatives.filter((a) => missing(s, a).length === 0).sort((a, b) => a.rank - b.rank)
  if (ok.length === 0) throw new Error('Nenhuma alternativa cumpre as restrições')
  if (ok[1] && ok[1].rank === ok[0].rank) throw new Error(`Empate entre ${ok[0].id} e ${ok[1].id}`)
  return ok[0]
}

/** Veredito e motivo (a primeira restrição que falta, o requisito decisivo ou `none`). */
export function judge(s: ExamScenario, a: ExamAlternative): { verdict: Verdict; reason: string } {
  const miss = missing(s, a)
  if (miss.length) return { verdict: 'fails', reason: miss[0].id }
  return answerOf(s).id === a.id ? { verdict: 'answer', reason: 'none' } : { verdict: 'works', reason: s.decisive.id }
}
