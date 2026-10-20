/**
 * Testes de integridade do conteúdo: garantem que tudo o que a interface
 * apresenta como jogável existe, é coerente e pode ser concluído.
 */
import { describe, expect, it } from 'vitest'
import { evaluateActivity, referenceResponse } from '../activities/evaluate'
import { labInitialResponse } from '../activities/lab/evaluate'
import { resolvePredict } from '../activities/predict/resolve'
import type { ActivityDef } from '../activities/types'
import { trackPhases } from '../engine/registry'
import { validateRegistry } from '../engine/registry'
import { validateBucketName } from '../simulators/bucket/model'
import { layoutProblems } from '../features/map/layout'
import { mapEdges } from '../features/map/status'
import { registry } from './index'

const allActivities: ActivityDef[] = [...registry.activities.values()].map((r) => r.activity)
const allReviewItems: ActivityDef[] = [...registry.reviewItems.values()].flat()

describe('integridade do conteúdo', () => {
  it('não tem referências quebradas, ciclos ou duplicidades', () => {
    expect(validateRegistry(registry)).toEqual([])
  })

  it('toda fase disponível tem missões e termina num chefe', () => {
    for (const track of registry.tracks.values()) {
      for (const p of trackPhases(track).filter((x) => x.availability === 'available')) {
        expect(p.missions.length, p.id).toBeGreaterThan(0)
        expect(p.missions.at(-1)?.type, p.id).not.toBe('mission')
      }
    }
  })

  it('toda atividade pode ser concluída com 100% pela resposta de referência', () => {
    for (const a of [...allActivities, ...allReviewItems]) {
      expect(evaluateActivity(a, referenceResponse(a)).score, a.id).toBe(1)
    }
  })

  it('o estado inicial dos laboratórios não é aprovado', () => {
    for (const a of allActivities.filter((x) => x.kind === 'lab')) {
      expect(evaluateActivity(a, labInitialResponse(a) as Record<string, unknown>).score, a.id).toBeLessThan(0.7)
    }
  })

  it('toda previsão tem exatamente uma opção que corresponde ao resultado do simulador', () => {
    for (const a of [...allActivities, ...allReviewItems]) {
      if (a.kind !== 'predict') continue
      const outcome = resolvePredict(a.spec).outcome
      expect(a.options.filter((o) => o.outcome === outcome).length, a.id).toBe(1)
    }
  })

  it('a classificação de nomes de bucket concorda com o validador do simulador', () => {
    const naming = allActivities.find((a) => a.id === 's3x.f01.m2.a3')
    expect(naming?.kind).toBe('classify')
    if (naming?.kind !== 'classify') return
    for (const item of naming.items) {
      expect(validateBucketName(item.text).valid ? 'valid' : 'invalid', item.text).toBe(item.bin)
    }
  })

  it('estimativas têm resposta dentro do intervalo do controle', () => {
    for (const a of allActivities) {
      if (a.kind !== 'estimate') continue
      expect(a.answer).toBeGreaterThanOrEqual(a.min)
      expect(a.answer).toBeLessThanOrEqual(a.max)
    }
  })

  it('todo conceito ensinado numa fase disponível tem itens de revisão', () => {
    const missing: string[] = []
    for (const { phase } of registry.phases.values()) {
      if (phase.availability !== 'available') continue
      for (const cid of phase.concepts) if (!registry.reviewItems.get(cid)?.length) missing.push(cid)
    }
    expect(missing).toEqual([])
  })

  it('todo conceito citado em atividades de fases disponíveis é listado na fase', () => {
    const missing: string[] = []
    for (const { activity, phase } of registry.activities.values()) {
      for (const c of activity.concepts) if (!phase.concepts.includes(c.id)) missing.push(`${activity.id} → ${c.id}`)
    }
    expect(missing).toEqual([])
  })

  it('todo conceito ensinado numa fase é avaliado em alguma atividade ou revisão', () => {
    const assessed = new Set([...allActivities, ...allReviewItems].flatMap((a) => a.concepts.map((c) => c.id)))
    const missing = [...registry.phases.values()].filter(({ phase }) => phase.availability === 'available').flatMap(({ phase }) => phase.concepts.filter((c) => !assessed.has(c)))
    expect(missing).toEqual([])
  })

  it('o banco de questões cobre toda trilha jogável, com as três dificuldades em cada uma', () => {
    const questions = [...registry.questions.values()]
    expect(questions.length).toBeGreaterThanOrEqual(90)
    // Trilhas ainda inteiramente em construção ficam de fora até a primeira fase ser liberada.
    const playable = [...registry.tracks.values()].filter((t) => trackPhases(t).some((p) => p.availability === 'available'))
    for (const track of playable) {
      const mine = questions.filter((r) => r.track?.id === track.id).map((r) => r.question)
      expect(mine.length, track.id).toBeGreaterThanOrEqual(15)
      expect(new Set(mine.map((q) => q.difficulty)), track.id).toEqual(new Set([1, 2, 3]))
      expect(mine.some((q) => q.options.filter((o) => o.correct).length > 1), `${track.id}: resposta múltipla`).toBe(true)
    }
  })

  it('toda questão avalia conceitos ensinados em fases disponíveis', () => {
    const missing: string[] = []
    for (const { question: q } of registry.questions.values()) {
      for (const c of [q.concept, ...(q.related ?? [])]) {
        const ref = registry.phases.get(registry.conceptPhase.get(c) ?? '')
        if (ref?.phase.availability !== 'available') missing.push(`${q.id}: ${c}`)
      }
    }
    expect(missing).toEqual([])
  })

  it('questões não repetem alternativas nem usam setas no texto', () => {
    const problems: string[] = []
    for (const { question: q } of registry.questions.values()) {
      if (new Set(q.options.map((o) => o.text)).size !== q.options.length) problems.push(`${q.id}: alternativas repetidas`)
      const text = [...q.stem, q.question, ...q.explanation, ...q.options.flatMap((o) => [o.text, o.why])].join(' ')
      if (/→|->|⇒|=>/.test(text)) problems.push(`${q.id}: seta no texto`)
    }
    expect(problems).toEqual([])
  })

  it('a trilha IAM cobre usuário, role, policy, trust policy, STS e SCP em atividades, revisão e questões', () => {
    // Pedido explícito: cada tema tem conceito na trilha, atividades, itens de revisão e questões de simulado.
    const THEMES: Record<string, string[]> = {
      'Usuário IAM': ['iam.users', 'iam.access-keys', 'iam.key-rotation', 'iam.when-iam-user', 'iam.groups', 'iam.root-user', 'iam.root-tasks', 'iam.root-best-practices'],
      Role: ['iam.roles', 'iam.service-role', 'iam.instance-profile', 'iam.service-linked-role', 'iam.cross-account-role', 'iam.pass-role', 'iam.roles-anywhere'],
      Policy: ['iam.identity-policy', 'iam.policy-elements', 'iam.resource-policy', 'iam.policy-types', 'iam.managed-vs-inline', 'iam.policy-evaluation', 'iam.arn', 'iam.not-action', 'iam.conditions', 'iam.policy-variables', 'iam.permissions-boundary'],
      'Trust policy': ['iam.trust-policy', 'iam.explicit-resource-required', 'iam.confused-deputy'],
      STS: ['sts.assume-role', 'sts.temporary-credentials', 'sts.role-chaining', 'sts.api-family', 'sts.session-policy', 'sts.get-session-token'],
      SCP: ['org.scp', 'org.scp-inheritance'],
    }
    const iam = registry.tracks.get('identity.iam-access')!
    const iamPhases = trackPhases(iam)
    const taught = new Set(iamPhases.flatMap((p) => p.concepts))
    const assessed = (id: string) => iamPhases.flatMap((p) => p.missions.flatMap((m) => m.activities)).filter((a) => JSON.stringify(a).includes(`"${id}"`)).length
    const questions = [...registry.questions.values()].map((r) => r.question)
    for (const [theme, ids] of Object.entries(THEMES)) {
      const [core] = ids
      expect(taught.has(core), `${theme}: ${core} ensinado na trilha IAM`).toBe(true)
      expect(assessed(core), `${theme}: atividades com ${core}`).toBeGreaterThanOrEqual(2)
      expect(registry.reviewItems.get(core)?.length ?? 0, `${theme}: revisão de ${core}`).toBeGreaterThanOrEqual(2)
      expect(questions.filter((q) => q.concept === core).length, `${theme}: questões sobre ${core}`).toBeGreaterThanOrEqual(1)
      expect(questions.filter((q) => ids.includes(q.concept)).length, `${theme}: questões do tema`).toBeGreaterThanOrEqual(4)
    }
  })

  it('o mapa de cada trilha não tem nós sobrepostos nem linhas por cima de nós', () => {
    // Vale para qualquer largura: os nós escalam com o mapa (ver features/map/layout.ts).
    // Se falhar, reposicione as fases (campo map) ou aumente a altura do mapa da trilha (mapHeight).
    for (const track of registry.tracks.values()) {
      const phases = trackPhases(track)
      expect(layoutProblems(phases, mapEdges(phases), track.final?.id, track.mapHeight), track.id).toEqual([])
    }
  })

  it('todo visual citado nas cartas de intel existe', async () => {
    const { VISUAL_IDS } = await import('../features/mission/visual-ids')
    const used = [...registry.missions.values()].flatMap(({ mission }) => mission.intel.map((c) => c.visual).filter(Boolean))
    expect(used.filter((v) => !VISUAL_IDS.includes(v!))).toEqual([])
  })
})
