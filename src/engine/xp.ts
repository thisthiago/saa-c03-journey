/**
 * Regras de XP. O XP reflete desempenho real: nada é concedido por ler ou
 * avançar telas, e repetir uma atividade só concede a melhoria obtida.
 */

/** Fator por número da tentativa (1ª, 2ª, 3ª, 4ª em diante). */
export const ATTEMPT_FACTORS = [1, 0.75, 0.5, 0.35] as const
/** Teto do fator depois que a solução guiada foi exibida. */
export const SOLUTION_FACTOR_CAP = 0.25
export const HINT_PENALTY = 0.15
export const HINT_FACTOR_FLOOR = 0.55
/** XP de revisão por item correto de um conceito vencido. */
export const REVIEW_XP = 5
/** Score mínimo para considerar uma atividade "acertada". */
export const ACTIVITY_PASS_SCORE = 0.7

export function attemptFactor(attemptNumber: number, solutionViewed: boolean): number {
  const idx = Math.min(Math.max(attemptNumber, 1), ATTEMPT_FACTORS.length) - 1
  const f = ATTEMPT_FACTORS[idx]
  return solutionViewed ? Math.min(f, SOLUTION_FACTOR_CAP) : f
}

export function hintFactor(hintsUsed: number): number {
  return Math.max(HINT_FACTOR_FLOOR, 1 - HINT_PENALTY * Math.max(0, hintsUsed))
}

/** XP "merecido" por esta tentativa, antes de descontar o que já foi concedido. */
export function earnedXp(
  xpMax: number,
  score: number,
  attemptNumber: number,
  hintsUsed: number,
  solutionViewed: boolean,
): number {
  const s = Math.max(0, Math.min(1, score))
  return Math.round(xpMax * s * attemptFactor(attemptNumber, solutionViewed) * hintFactor(hintsUsed))
}

/** Concede apenas a melhoria sobre o total já concedido pela atividade. */
export function xpAward(alreadyEarned: number, earnedNow: number): number {
  return Math.max(0, earnedNow - alreadyEarned)
}
