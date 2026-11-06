/**
 * Montagem: peças posicionadas sobre um desenho. Cada lugar (slot) espera um
 * multiconjunto de peças (`expect`); as cópias que sobram vão para a bandeja
 * "Não entra nesta rede". Uma cópia está certa enquanto o lugar ainda espera
 * aquele tipo de peça; as excedentes estão erradas.
 */
import type { Evaluation, ItemFeedback } from '../../engine/types'
import type { BuildActivity, BuildPiece } from '../types'

/** Id da bandeja das peças que não entram na rede. */
export const BUILD_OUT = '__fora'
export const BUILD_OUT_LABEL = 'Não entra nesta rede'

export interface BuildChip {
  id: string
  pieceId: string
}

export type ChipStatus = 'correct' | 'wrong' | 'missed'

export function copies(p: BuildPiece): number {
  return p.count ?? 1
}

/** Uma ficha por cópia: `<pieceId>#<n>`, com n a partir de 1. */
export function buildChips(a: BuildActivity): BuildChip[] {
  return a.pieces.flatMap((p) => Array.from({ length: copies(p) }, (_, i) => ({ id: `${p.id}#${i + 1}`, pieceId: p.id })))
}

/** Quantas cópias de cada peça cada lugar espera, incluindo a bandeja. */
export function expectations(a: BuildActivity): Record<string, Record<string, number>> {
  const out: Record<string, Record<string, number>> = {}
  const used: Record<string, number> = {}
  for (const s of a.slots) {
    out[s.id] = { ...s.expect }
    for (const [pid, n] of Object.entries(s.expect)) used[pid] = (used[pid] ?? 0) + n
  }
  out[BUILD_OUT] = {}
  for (const p of a.pieces) {
    const spare = copies(p) - (used[p.id] ?? 0)
    if (spare > 0) out[BUILD_OUT][p.id] = spare
  }
  return out
}

/** Situação de cada ficha. Dentro de um lugar, as primeiras cópias (pela ordem do número) contam como certas. */
export function chipStatus(a: BuildActivity, placements: Record<string, string>): Record<string, ChipStatus> {
  const exp = expectations(a)
  const taken: Record<string, Record<string, number>> = {}
  const out: Record<string, ChipStatus> = {}
  for (const chip of buildChips(a)) {
    const where = placements[chip.id]
    if (!where) {
      out[chip.id] = 'missed'
      continue
    }
    const slotTaken = (taken[where] ??= {})
    const got = slotTaken[chip.pieceId] ?? 0
    const want = exp[where]?.[chip.pieceId] ?? 0
    slotTaken[chip.pieceId] = got + 1
    out[chip.id] = got < want ? 'correct' : 'wrong'
  }
  return out
}

function joinPt(items: string[]): string {
  if (items.length <= 1) return items.join('')
  return `${items.slice(0, -1).join(', ')} e ${items[items.length - 1]}`
}

/** Onde a peça deve ficar, em texto. */
export function pieceHome(a: BuildActivity, p: BuildPiece): string {
  const exp = expectations(a)
  const places = a.slots
    .filter((s) => (s.expect[p.id] ?? 0) > 0)
    .map((s) => (s.expect[p.id] > 1 ? `${s.label} (${s.expect[p.id]} cópias)` : s.label))
  const spare = exp[BUILD_OUT][p.id] ?? 0
  if (places.length === 0) return 'Fica fora desta rede'
  const base = `Lugar certo: ${joinPt(places)}`
  return spare > 0 ? `${base}; ${spare === 1 ? 'a outra cópia fica' : `as outras ${spare} cópias ficam`} fora` : base
}

export function evaluateBuild(a: BuildActivity, placements: Record<string, string>): Evaluation {
  const status = chipStatus(a, placements)
  const chips = buildChips(a)
  const right = chips.filter((c) => status[c.id] === 'correct').length
  const score = Math.round((right / Math.max(1, chips.length)) * 1000) / 1000

  const scored = a.pieces.map((p) => {
    const mine = chips.filter((c) => c.pieceId === p.id)
    const ok = mine.filter((c) => status[c.id] === 'correct').length
    const placed = mine.filter((c) => status[c.id] !== 'missed').length
    const st: ItemFeedback['status'] = ok === mine.length ? 'correct' : ok > 0 ? 'partial' : placed > 0 ? 'wrong' : 'missed'
    return {
      concepts: p.concepts,
      score: ok / mine.length,
      fb: {
        id: `piece-${p.id}`,
        label: mine.length > 1 ? `${p.text} (${mine.length} cópias)` : p.text,
        status: st,
        message: st === 'correct' ? p.explanation : `${pieceHome(a, p)}. ${p.explanation}`,
      } satisfies ItemFeedback,
    }
  })

  // Lugares com peça errada ou faltando: a explicação do lugar ensina o que ele precisa.
  const slotItems: ItemFeedback[] = a.slots
    .filter((s) => {
      const inside = chips.filter((c) => placements[c.id] === s.id)
      const wrong = inside.some((c) => status[c.id] === 'wrong')
      const filled = inside.filter((c) => status[c.id] === 'correct').length
      const want = Object.values(s.expect).reduce((t, n) => t + n, 0)
      return wrong || filled < want
    })
    .map((s) => ({ id: `slot-${s.id}`, label: `Lugar: ${s.label}`, status: 'wrong' as const, message: s.explanation }))

  const conceptOutcomes: Record<string, number> = {}
  for (const c of a.concepts) {
    const tagged = scored.filter((i) => i.concepts?.includes(c.id))
    conceptOutcomes[c.id] = Math.round((tagged.length > 0 ? tagged.reduce((t, i) => t + i.score, 0) / tagged.length : score) * 1000) / 1000
  }
  return { score, items: [...scored.map((i) => i.fb), ...slotItems], conceptOutcomes }
}

/** Resposta de 100%: cada lugar recebe o que espera e o resto vai para a bandeja. */
export function buildReference(a: BuildActivity): Record<string, string> {
  const exp = expectations(a)
  const next: Record<string, number> = {}
  const out: Record<string, string> = {}
  for (const [slotId, want] of Object.entries(exp)) {
    for (const [pid, n] of Object.entries(want)) {
      for (let i = 0; i < n; i++) {
        next[pid] = (next[pid] ?? 0) + 1
        out[`${pid}#${next[pid]}`] = slotId
      }
    }
  }
  return out
}

/** Problemas de configuração (usado por `validateRegistry`). */
export function buildProblems(a: BuildActivity): string[] {
  const out: string[] = []
  const pieceIds = new Set(a.pieces.map((p) => p.id))
  const slotIds = new Set<string>()
  for (const s of a.slots) {
    if (slotIds.has(s.id) || s.id === BUILD_OUT) out.push(`lugar com id repetido ou reservado "${s.id}"`)
    slotIds.add(s.id)
    for (const pid of Object.keys(s.expect)) if (!pieceIds.has(pid)) out.push(`lugar ${s.id} espera a peça inexistente "${pid}"`)
    if (s.x < 0 || s.y < 0 || s.x + s.w > a.board.width || s.y + s.h > a.board.height) out.push(`lugar ${s.id} sai do desenho`)
    if (!s.explanation.trim()) out.push(`lugar ${s.id} sem explicação`)
  }
  if (new Set(a.pieces.map((p) => p.id)).size !== a.pieces.length) out.push('peças com id repetido')
  const exp = expectations(a)
  for (const p of a.pieces) {
    const used = a.slots.reduce((t, s) => t + (s.expect[p.id] ?? 0), 0)
    if (used > copies(p)) out.push(`a peça ${p.id} é esperada ${used} vezes, mas tem ${copies(p)} cópia(s)`)
    if (!p.explanation.trim()) out.push(`peça ${p.id} sem explicação`)
  }
  if (Object.keys(exp[BUILD_OUT]).length === 0) out.push('nenhuma peça sobra para a bandeja (falta um distrator)')
  return out
}
