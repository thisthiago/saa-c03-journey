import type { Page } from '@playwright/test'

/** Posiciona um item numa categoria usando o fluxo "selecionar → posicionar" (o mesmo do teclado/toque). */
export async function place(page: Page, itemText: string, target: string) {
  await page.getByRole('button', { name: itemText, exact: false }).first().click()
  await page.getByRole('button', { name: `Posicionar em ${target}` }).click()
}

/** Progresso mínimo com a missão 1 da Fase 1 aprovada (para abrir telas seguintes nos testes). */
export function progressWithFirstMission(now = new Date()) {
  const at = now.toISOString()
  const ap = { attempts: 1, bestScore: 1, xpEarned: 40, firstScore: 1, solutionViewed: false, failedBeforePass: false, passedAt: at, lastAttemptAt: at }
  return {
    schemaVersion: 1,
    createdAt: at,
    updatedAt: at,
    xp: 145,
    ledger: [],
    activities: { 's3x.f01.m1.a1': ap, 's3x.f01.m1.a2': ap },
    missions: { 's3x.f01.m1': { startedAt: at, passedAt: at, bonusAwarded: true } },
    concepts: {
      'storage.object': { mastery: 0.52, evidence: 1, box: 1, nextReviewAt: at, lastSeenAt: at, recentErrors: 0 },
      'storage.block': { mastery: 0.3, evidence: 1, box: 1, nextReviewAt: at, lastSeenAt: at, recentErrors: 1 },
    },
    discovered: { 'storage.object': at, 'storage.block': at, 'storage.file': at, 's3.service': at },
    achievements: { 'ach.primeiros-passos': { unlockedAt: at } },
    reviews: { sessions: 0, itemsAnswered: 0, awardedCycles: {} },
    stats: { comebacks: 0, perfectFirstTries: 2, activeDays: [at.slice(0, 10)] },
    drafts: {},
    settings: { theme: 'system', reducedMotion: true },
  }
}

export async function seedProgress(page: Page, progress: unknown) {
  await page.addInitScript((value) => {
    if (!sessionStorage.getItem('seeded')) {
      localStorage.setItem('aws-quest/progress', JSON.stringify(value))
      sessionStorage.setItem('seeded', '1')
    }
  }, progress)
}

const F1_ACTIVITIES = [
  's3x.f01.m1.a1', 's3x.f01.m1.a2',
  's3x.f01.m2.a1', 's3x.f01.m2.a2', 's3x.f01.m2.a3',
  's3x.f01.m3.a1', 's3x.f01.m3.a2', 's3x.f01.m3.a3', 's3x.f01.m3.a4',
  's3x.f01.boss.a1', 's3x.f01.boss.a2', 's3x.f01.boss.a3', 's3x.f01.boss.a4',
]
const F1_MISSIONS = ['s3x.f01.m1', 's3x.f01.m2', 's3x.f01.m3', 's3x.f01.boss']

/** Progresso com a Fase 1 inteira concluída (libera as Fases 2, 3, 5, 10 e 11). */
export function progressWithPhase1(now = new Date(), extra: { activities?: string[]; missions?: string[] } = {}) {
  const p = progressWithFirstMission(now)
  const at = now.toISOString()
  const ap = { attempts: 1, bestScore: 1, xpEarned: 30, firstScore: 1, solutionViewed: false, failedBeforePass: false, passedAt: at, lastAttemptAt: at }
  return {
    ...p,
    xp: 700,
    activities: Object.fromEntries([...F1_ACTIVITIES, ...(extra.activities ?? [])].map((id) => [id, ap])),
    missions: Object.fromEntries([...F1_MISSIONS, ...(extra.missions ?? [])].map((id) => [id, { startedAt: at, passedAt: at, bonusAwarded: true }])),
  }
}
