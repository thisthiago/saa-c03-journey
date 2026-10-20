/**
 * Store da aplicação: guarda o progresso, chama as funções puras do engine
 * e persiste no localStorage. Nenhuma regra de jogo mora aqui.
 */
import { create } from 'zustand'
import { registry } from '../content'
import { loadProgress, saveProgress } from '../engine/persistence'
import * as engine from '../engine/progress'
import type { Evaluation, GameEvent, ProgressState } from '../engine/types'

/** Relógio substituível em testes. */
export const clock = { now: () => new Date() }

export interface QueuedEvent {
  id: number
  event: GameEvent
}

interface GameStore {
  progress: ProgressState
  notice: 'corrupted' | null
  queue: QueuedEvent[]
  submitActivity: (activityId: string, evaluation: Evaluation, hintsUsed: number, solutionViewed: boolean) => GameEvent[]
  submitReview: (conceptId: string, itemId: string, evaluation: Evaluation) => GameEvent[]
  completeReviewSession: () => GameEvent[]
  submitExam: (answers: engine.ExamSubmission['answers'], simulado?: engine.ExamSubmission['simulado']) => GameEvent[]
  discover: (conceptIds: string[]) => void
  startMission: (missionId: string, step: number) => void
  clearResume: (missionId: string) => void
  saveDraft: (key: string, value: unknown) => void
  clearDraft: (key: string) => void
  setSettings: (settings: Partial<ProgressState['settings']>) => void
  replaceProgress: (state: ProgressState) => void
  resetProgress: () => void
  dismissEvent: (id: number) => void
  dismissNotice: () => void
}

let nextEventId = 1
// XP aparece no próprio painel de feedback; a fila guarda só eventos que viram notificação.
const enqueue = (queue: QueuedEvent[], events: GameEvent[]) => [
  ...queue,
  ...events.filter((e) => e.type !== 'xp').map((event) => ({ id: nextEventId++, event })),
]

function initialProgress(): { progress: ProgressState; notice: 'corrupted' | null } {
  if (typeof localStorage === 'undefined') return { progress: engine.createInitialProgress(clock.now()), notice: null }
  const loaded = loadProgress(localStorage, clock.now())
  return {
    progress: loaded.state ?? engine.createInitialProgress(clock.now()),
    notice: loaded.corrupted ? 'corrupted' : null,
  }
}

export const useGame = create<GameStore>()((set, get) => ({
  ...initialProgress(),
  queue: [],
  submitActivity(activityId, evaluation, hintsUsed, solutionViewed) {
    const { state, events } = engine.submitActivity(get().progress, registry, { activityId, evaluation, hintsUsed, solutionViewed, now: clock.now() })
    set((s) => ({ progress: state, queue: enqueue(s.queue, events) }))
    return events
  },
  submitReview(conceptId, itemId, evaluation) {
    const { state, events } = engine.submitReview(get().progress, registry, { conceptId, itemId, evaluation, now: clock.now() })
    set((s) => ({ progress: state, queue: enqueue(s.queue, events) }))
    return events
  },
  completeReviewSession() {
    const { state, events } = engine.completeReviewSession(get().progress, registry, clock.now())
    set((s) => ({ progress: state, queue: enqueue(s.queue, events) }))
    return events
  },
  submitExam(answers, simulado) {
    const { state, events } = engine.submitExam(get().progress, registry, { answers, simulado, now: clock.now() })
    set((s) => ({ progress: state, queue: enqueue(s.queue, events) }))
    return events
  },
  discover(conceptIds) {
    set((s) => ({ progress: engine.discoverConcepts(s.progress, conceptIds, clock.now()) }))
  },
  startMission(missionId, step) {
    set((s) => ({ progress: engine.startMission(s.progress, missionId, step, clock.now()) }))
  },
  clearResume(missionId) {
    set((s) => ({ progress: engine.clearResume(s.progress, missionId) }))
  },
  saveDraft(key, value) {
    set((s) => ({ progress: { ...s.progress, drafts: { ...s.progress.drafts, [key]: value } } }))
  },
  clearDraft(key) {
    set((s) => {
      if (!(key in s.progress.drafts)) return s
      const drafts = { ...s.progress.drafts }
      delete drafts[key]
      return { progress: { ...s.progress, drafts } }
    })
  },
  setSettings(settings) {
    set((s) => ({ progress: { ...s.progress, settings: { ...s.progress.settings, ...settings } } }))
  },
  replaceProgress(state) {
    set({ progress: state, queue: [] })
  },
  resetProgress() {
    const fresh = engine.createInitialProgress(clock.now())
    fresh.settings = get().progress.settings
    set({ progress: fresh, queue: [] })
  },
  dismissEvent(id) {
    set((s) => ({ queue: s.queue.filter((e) => e.id !== id) }))
  },
  dismissNotice() {
    set({ notice: null })
  },
}))

// Persistência: grava logo após cada mudança de progresso (agrupando mudanças seguidas).
let saveTimer: ReturnType<typeof setTimeout> | undefined
useGame.subscribe((s, prev) => {
  if (s.progress === prev.progress || typeof localStorage === 'undefined') return
  clearTimeout(saveTimer)
  saveTimer = setTimeout(() => saveProgress(localStorage, useGame.getState().progress), 150)
})

/** Grava imediatamente (usado antes de sair da página e nos testes). */
export function flushSave() {
  clearTimeout(saveTimer)
  if (typeof localStorage !== 'undefined') saveProgress(localStorage, useGame.getState().progress)
}

if (typeof window !== 'undefined') {
  window.addEventListener('pagehide', flushSave)
}
