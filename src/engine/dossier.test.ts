import { describe, expect, it } from 'vitest'
import { registry } from '../content'
import { achievementGroups, achievementProgress, achievementTarget, goalRatio, nextAchievements, recentActivity, studyCalendar } from './dossier'
import { createInitialProgress } from './progress'

const NOW = new Date('2026-10-22T15:00:00Z')
const FOUNDATIONS = 'foundations.aws-foundations'

function ach(id: string) {
  return registry.achievements.get(id)!
}

describe('achievementProgress', () => {
  it('conta os contadores com o mesmo critério da conquista', () => {
    const s = createInitialProgress(NOW)
    s.stats.comebacks = 2
    s.reviews.sessions = 9
    expect(achievementProgress(ach('ach.aprender-com-o-erro').condition, s, registry)).toEqual({ current: 2, target: 3, start: 0 })
    // Passar da meta não passa de 100%.
    expect(achievementProgress(ach('ach.habito-de-revisao').condition, s, registry)).toEqual({ current: 5, target: 5, start: 0 })
  })

  it('o nível começa em 1, então quem começa está em 0%', () => {
    const p = achievementProgress(ach('ach.nivel-5').condition, createInitialProgress(NOW), registry)!
    expect(p).toEqual({ current: 1, target: 5, start: 1 })
    expect(goalRatio(p)).toBe(0)
  })

  it('fase parcial: missões aprovadas da fase', () => {
    const s = createInitialProgress(NOW)
    s.missions['fnd.f01.m1'] = { startedAt: NOW.toISOString(), passedAt: NOW.toISOString(), bonusAwarded: true }
    const p = achievementProgress(ach('ach.fnd-infra-global').condition, s, registry)!
    expect(p.current).toBe(1)
    expect(p.target).toBe(registry.phases.get('fnd.f01')!.phase.missions.length)
  })

  it('condição de sim ou não não tem contagem, mas tem destino', () => {
    const c = ach('ach.fnd-primeira-regiao').condition
    expect(achievementProgress(c, createInitialProgress(NOW), registry)).toBeNull()
    expect(achievementTarget(c, registry)).toEqual({ kind: 'mission', missionId: 'fnd.f01.m1' })
  })
})

describe('achievementGroups', () => {
  it('reúne todas as conquistas, com as gerais primeiro', () => {
    const groups = achievementGroups(registry)
    expect(groups[0].title).toBe('Conquistas gerais')
    expect(groups.reduce((n, g) => n + g.achievements.length, 0)).toBe(registry.achievements.size)
  })
})

describe('nextAchievements', () => {
  it('primeiro acesso: metas que se cumprem já na trilha em foco', () => {
    const goals = nextAchievements(createInitialProgress(NOW), registry, FOUNDATIONS)
    const ids = goals.map((g) => g.achievement.id)
    expect(ids).toContain('ach.fnd-primeira-regiao')
    expect(ids).toContain('ach.fnd-infra-global')
    expect(goals.every((g) => !g.progress || goalRatio(g.progress) === 0)).toBe(true)
  })

  it('metas adiantadas vêm antes e as desbloqueadas saem', () => {
    const s = createInitialProgress(NOW)
    s.stats.comebacks = 2
    s.achievements['ach.fnd-primeira-regiao'] = { unlockedAt: NOW.toISOString() }
    const goals = nextAchievements(s, registry, FOUNDATIONS)
    expect(goals[0].achievement.id).toBe('ach.aprender-com-o-erro')
    expect(goals.some((g) => g.achievement.id === 'ach.fnd-primeira-regiao')).toBe(false)
  })
})

describe('recentActivity', () => {
  it('junta ledger e simulados e agrupa revisões seguidas do mesmo dia', () => {
    const s = createInitialProgress(NOW)
    s.ledger = [
      { at: '2026-10-22T10:00:00Z', amount: 20, source: 'mission', refId: 'fnd.f01.m1' },
      { at: '2026-10-22T11:00:00Z', amount: 5, source: 'review', refId: 'a' },
      { at: '2026-10-22T11:01:00Z', amount: 5, source: 'review', refId: 'b' },
    ]
    s.exam.simulados = [{ at: '2026-10-22T12:00:00Z', total: 10, correct: 7, seconds: 600, timed: true }]
    const items = recentActivity(s)
    expect(items.map((i) => i.kind)).toEqual(['simulado', 'review', 'mission'])
    expect(items[1].refIds).toEqual(['b', 'a'])
    expect(items[1].xp).toBe(10)
  })
})

describe('studyCalendar', () => {
  it('28 dias terminando hoje, marcando os dias com estudo', () => {
    const cal = studyCalendar(['2026-10-22', '2026-10-20', '2026-09-01'], NOW)
    expect(cal).toHaveLength(28)
    expect(cal.at(-1)).toEqual({ day: '2026-10-22', active: true })
    expect(cal.filter((d) => d.active)).toHaveLength(2)
  })
})
