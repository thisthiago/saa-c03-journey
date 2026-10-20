/**
 * Persistência do progresso no navegador, com versão de esquema, migrações,
 * cópia de segurança de dados corrompidos e exportação/importação em JSON.
 */
import { createInitialProgress } from './progress'
import type { ProgressState } from './types'

export const STORAGE_KEY = 'aws-quest/progress'
export const CORRUPT_PREFIX = 'aws-quest/corrupt-'
export const CURRENT_SCHEMA = 1
export const DRAFTS_LIMIT = 30

export interface StorageLike {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
  removeItem(key: string): void
}

type Migration = (raw: Record<string, unknown>) => Record<string, unknown>
/** Migrações de esquema: a chave é a versão de origem. */
export const MIGRATIONS: Record<number, Migration> = {}

const isObj = (x: unknown): x is Record<string, unknown> => typeof x === 'object' && x !== null && !Array.isArray(x)

/** Verificação estrutural mínima antes de aceitar dados externos. */
export function isProgressState(x: unknown): x is ProgressState {
  if (!isObj(x)) return false
  return (
    x.schemaVersion === CURRENT_SCHEMA &&
    typeof x.xp === 'number' &&
    Number.isFinite(x.xp) &&
    x.xp >= 0 &&
    Array.isArray(x.ledger) &&
    isObj(x.activities) &&
    isObj(x.missions) &&
    isObj(x.concepts) &&
    isObj(x.discovered) &&
    isObj(x.achievements) &&
    isObj(x.reviews) &&
    isObj(x.stats) &&
    isObj(x.drafts) &&
    isObj(x.settings)
  )
}

export function migrate(raw: unknown): ProgressState | null {
  if (!isObj(raw)) return null
  let current: Record<string, unknown> = raw
  let version = typeof current.schemaVersion === 'number' ? current.schemaVersion : 0
  while (version < CURRENT_SCHEMA) {
    const step = MIGRATIONS[version]
    if (!step) return null
    current = step(current)
    version++
    current.schemaVersion = version
  }
  if (!isProgressState(current)) return null
  // Campos adicionados depois da criação do esquema recebem valores padrão.
  const defaults = createInitialProgress(new Date(String(current.createdAt ?? new Date().toISOString())))
  return { ...defaults, ...current, settings: { ...defaults.settings, ...current.settings } } as ProgressState
}

export interface LoadResult {
  state: ProgressState | null
  corrupted: boolean
}

export function loadProgress(storage: StorageLike, now: Date = new Date()): LoadResult {
  let raw: string | null
  try {
    raw = storage.getItem(STORAGE_KEY)
  } catch {
    return { state: null, corrupted: false }
  }
  if (raw === null) return { state: null, corrupted: false }
  try {
    const state = migrate(JSON.parse(raw))
    if (state) return { state, corrupted: false }
  } catch {
    /* tratado abaixo */
  }
  try {
    storage.setItem(`${CORRUPT_PREFIX}${now.getTime()}`, raw)
    storage.removeItem(STORAGE_KEY)
  } catch {
    /* armazenamento indisponível: segue sem cópia */
  }
  return { state: null, corrupted: true }
}

export function saveProgress(storage: StorageLike, state: ProgressState): boolean {
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(trimDrafts(state)))
    return true
  } catch {
    return false
  }
}

function trimDrafts(state: ProgressState): ProgressState {
  const keys = Object.keys(state.drafts)
  if (keys.length <= DRAFTS_LIMIT) return state
  const drafts: Record<string, unknown> = {}
  for (const k of keys.slice(-DRAFTS_LIMIT)) drafts[k] = state.drafts[k]
  return { ...state, drafts }
}

export interface ExportFile {
  app: 'aws-quest'
  exportedAt: string
  progress: ProgressState
}

export function exportProgress(state: ProgressState, now: Date = new Date()): string {
  const file: ExportFile = { app: 'aws-quest', exportedAt: now.toISOString(), progress: state }
  return JSON.stringify(file, null, 2)
}

export type ImportResult = { ok: true; state: ProgressState } | { ok: false; error: string }

export function importProgress(json: string): ImportResult {
  let data: unknown
  try {
    data = JSON.parse(json)
  } catch {
    return { ok: false, error: 'O arquivo não é um JSON válido.' }
  }
  if (!isObj(data) || data.app !== 'aws-quest' || !('progress' in data)) {
    return { ok: false, error: 'O arquivo não parece ser um progresso exportado do AWS Quest.' }
  }
  const state = migrate(data.progress)
  if (!state) return { ok: false, error: 'O progresso tem um formato incompatível ou está incompleto.' }
  return { ok: true, state }
}
