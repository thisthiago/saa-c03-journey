import { describe, expect, it } from 'vitest'
import { CORRUPT_PREFIX, exportProgress, importProgress, loadProgress, saveProgress, STORAGE_KEY, type StorageLike } from './persistence'
import { createInitialProgress } from './progress'

class MemoryStorage implements StorageLike {
  data = new Map<string, string>()
  getItem(k: string) {
    return this.data.get(k) ?? null
  }
  setItem(k: string, v: string) {
    this.data.set(k, v)
  }
  removeItem(k: string) {
    this.data.delete(k)
  }
}

const now = new Date('2026-10-01T00:00:00Z')

describe('persistência', () => {
  it('salva e recarrega o progresso', () => {
    const storage = new MemoryStorage()
    const state = { ...createInitialProgress(now), xp: 42 }
    expect(saveProgress(storage, state)).toBe(true)
    const loaded = loadProgress(storage)
    expect(loaded.corrupted).toBe(false)
    expect(loaded.state?.xp).toBe(42)
  })
  it('retorna vazio quando não há dados', () => {
    expect(loadProgress(new MemoryStorage())).toEqual({ state: null, corrupted: false })
  })
  it('guarda cópia de dados corrompidos e recomeça', () => {
    const storage = new MemoryStorage()
    storage.setItem(STORAGE_KEY, '{quebrado')
    const loaded = loadProgress(storage, now)
    expect(loaded).toEqual({ state: null, corrupted: true })
    expect(storage.getItem(`${CORRUPT_PREFIX}${now.getTime()}`)).toBe('{quebrado')
    expect(storage.getItem(STORAGE_KEY)).toBeNull()
  })
  it('rejeita esquema incompatível', () => {
    const storage = new MemoryStorage()
    storage.setItem(STORAGE_KEY, JSON.stringify({ schemaVersion: 99, xp: 1 }))
    expect(loadProgress(storage, now).corrupted).toBe(true)
  })
  it('exporta e importa', () => {
    const state = { ...createInitialProgress(now), xp: 77 }
    const result = importProgress(exportProgress(state, now))
    expect(result.ok && result.state.xp).toBe(77)
  })
  it('recusa arquivos que não são do AWS Quest', () => {
    expect(importProgress('não é json').ok).toBe(false)
    expect(importProgress(JSON.stringify({ app: 'outro' })).ok).toBe(false)
    expect(importProgress(JSON.stringify({ app: 'aws-quest', progress: { xp: -5 } })).ok).toBe(false)
  })
})
