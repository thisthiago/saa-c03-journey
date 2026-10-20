/** Curva de níveis: XP acumulado necessário para o nível L = 50·L·(L−1). */

export function xpForLevel(level: number): number {
  const l = Math.max(1, Math.floor(level))
  return 50 * l * (l - 1)
}

export function levelForXp(xp: number): number {
  // Inversa de 50·L·(L−1) ≤ xp, com correção de arredondamento.
  let level = Math.max(1, Math.floor((1 + Math.sqrt(1 + (4 * Math.max(0, xp)) / 50)) / 2))
  while (xpForLevel(level + 1) <= xp) level++
  while (level > 1 && xpForLevel(level) > xp) level--
  return level
}

export interface LevelProgress {
  level: number
  /** XP acumulado no início do nível atual. */
  floor: number
  /** XP acumulado necessário para o próximo nível. */
  next: number
  /** Fração do caminho até o próximo nível (0–1). */
  ratio: number
}

export function levelProgress(xp: number): LevelProgress {
  const level = levelForXp(xp)
  const floor = xpForLevel(level)
  const next = xpForLevel(level + 1)
  return { level, floor, next, ratio: (xp - floor) / (next - floor) }
}

export function levelTitle(level: number, titles: string[]): string {
  if (titles.length === 0) return `Nível ${level}`
  return titles[Math.min(level, titles.length) - 1]
}
