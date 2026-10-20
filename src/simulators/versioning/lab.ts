/**
 * Laboratório de versionamento: a partir de um histórico inicial, o usuário executa
 * operações (PUT, DELETE, exclusão de versão, cópia de versão, estado do versionamento)
 * até cumprir os objetivos. Várias sequências de operações podem ser válidas.
 */
import type { ItemFeedback } from '../../engine/types'
import { emptyBucket, getObject, replay, type OpResult, type VBucket, type VersioningState, type VOp } from './model'

export type VersioningGoal =
  | { type: 'current'; key: string; content: string | null; why: string; concepts?: string[] }
  | { type: 'preserved'; key: string; content: string; why: string; concepts?: string[] }
  | { type: 'state'; state: VersioningState; why: string; concepts?: string[] }
  | { type: 'max-versions'; key: string; max: number; why: string; concepts?: string[] }

export interface VersioningLabConfig {
  bucketName: string
  /** Histórico que já aconteceu antes do laboratório (mostrado como registro). */
  setup: { op: VOp; when: string }[]
  allowedOps: VOp['op'][]
  /** Keys oferecidas no formulário de PUT/DELETE. */
  keys: string[]
  /** Conteúdos sugeridos no formulário de PUT. */
  contents?: string[]
  goals: VersioningGoal[]
  /** Solução de referência (validada pelos testes de integridade). */
  solution: VersioningLabResponse | ((initial: VBucket) => VersioningLabResponse)
  mfaDelete?: boolean
}

export interface VersioningLabResponse {
  ops: VOp[]
}

export function initialBucket(c: VersioningLabConfig): VBucket {
  const base = { ...emptyBucket(c.bucketName), mfaDelete: Boolean(c.mfaDelete) }
  return replay(base, c.setup.map((s) => s.op)).bucket
}

export function runLab(c: VersioningLabConfig, r: VersioningLabResponse): { bucket: VBucket; results: OpResult[] } {
  return replay(initialBucket(c), r.ops)
}

export function versioningLabSolution(c: VersioningLabConfig): VersioningLabResponse {
  return typeof c.solution === 'function' ? c.solution(initialBucket(c)) : c.solution
}

function goalMet(b: VBucket, g: VersioningGoal): { ok: boolean; actual: string } {
  switch (g.type) {
    case 'current': {
      const res = getObject(b, g.key)
      const actual = res.status === 200 ? `"${res.content}"` : res.deleteMarker ? '404 (delete marker)' : '404'
      return { ok: g.content === null ? res.status !== 200 : res.status === 200 && res.content === g.content, actual }
    }
    case 'preserved': {
      const ok = (b.objects[g.key] ?? []).some((v) => !v.isDeleteMarker && v.content === g.content)
      return { ok, actual: ok ? 'guardada' : 'perdida' }
    }
    case 'state':
      return { ok: b.state === g.state, actual: b.state }
    case 'max-versions': {
      const n = (b.objects[g.key] ?? []).length
      return { ok: n <= g.max, actual: `${n} versão(ões)` }
    }
  }
}

function goalLabel(g: VersioningGoal): string {
  switch (g.type) {
    case 'current':
      return g.content === null ? `GET ${g.key} não retorna dados` : `GET ${g.key} retorna "${g.content}"`
    case 'preserved':
      return `"${g.content}" continua guardado em ${g.key}`
    case 'state':
      return `Versionamento: ${g.state === 'Enabled' ? 'habilitado' : g.state === 'Suspended' ? 'suspenso' : 'sem versionamento'}`
    case 'max-versions':
      return `${g.key} com no máximo ${g.max} versão(ões)`
  }
}

export function evaluateVersioningLab(c: VersioningLabConfig, r: VersioningLabResponse) {
  const { bucket } = runLab(c, r)
  const items = c.goals.map((g, i) => {
    const { ok, actual } = goalMet(bucket, g)
    return {
      concepts: g.concepts,
      score: ok ? 1 : 0,
      fb: { id: `goal-${i}`, label: goalLabel(g), status: ok ? 'correct' : 'wrong', message: ok ? g.why : `Estado atual: ${actual}. ${g.why}` } as ItemFeedback,
    }
  })
  return { score: items.reduce((s, i) => s + i.score, 0) / Math.max(1, items.length), items }
}

export { goalMet, goalLabel }
