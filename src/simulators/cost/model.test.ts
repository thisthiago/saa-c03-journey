import { describe, expect, it } from 'vitest'
import { STORAGE_CLASS_ORDER } from '../shared/storageClasses'
import { cheapestCompliant, monthlyCost, requirementViolations, type DataProfile } from './model'
import { TEST_PRICES as P } from './test-prices'
import { PRICE_TABLE } from './prices'

const base: DataProfile = {
  id: 'p',
  name: 'p',
  description: '',
  // 1.048.576 objetos de 1 MB = 1024 GB
  objectCount: 1_048_576,
  avgObjectKB: 1024,
  putsPerMonth: 0,
  getsPerMonth: 0,
  retrievedGBPerMonth: 0,
  requirements: { instantAccess: false, azResilient: false },
}

describe('custo de armazenamento', () => {
  it('Standard: GB × preço', () => {
    expect(monthlyCost(base, 'STANDARD', P).storage).toBeCloseTo(1024 * 0.02, 6)
  })
  it('Standard-IA cobra no mínimo 128 KB por objeto', () => {
    const small = { ...base, objectCount: 1000, avgObjectKB: 16 }
    const c = monthlyCost(small, 'STANDARD_IA', P)
    expect(c.billedGB).toBeCloseTo((1000 * 128) / 1048576, 9)
    expect(c.notes.join(' ')).toContain('128 KB')
  })
  it('Glacier Flexible soma 32 KB na classe e 8 KB no Standard por objeto', () => {
    const p = { ...base, objectCount: 1_000_000, avgObjectKB: 10 }
    const gb = (1_000_000 * 10) / 1048576
    const overSelf = (1_000_000 * 32) / 1048576
    const overStd = (1_000_000 * 8) / 1048576
    expect(monthlyCost(p, 'GLACIER', P).storage).toBeCloseTo(gb * 0.004 + overSelf * 0.004 + overStd * 0.02, 6)
  })
  it('objetos pequenos podem ficar mais caros no Glacier do que no Standard', () => {
    const tiny = { ...base, objectCount: 10_000_000, avgObjectKB: 8 }
    expect(monthlyCost(tiny, 'GLACIER', P).total).toBeGreaterThan(monthlyCost(tiny, 'STANDARD', P).total * 0.9)
  })
  it('Intelligent-Tiering: monitoramento por objeto e distribuição entre tiers', () => {
    const p = { ...base, intelligentTieringShare: { frequent: 0.5, infrequent: 0.5, archiveInstant: 0 } }
    const c = monthlyCost(p, 'INTELLIGENT_TIERING', P)
    expect(c.storage).toBeCloseTo(1024 * (0.5 * 0.02 + 0.5 * 0.01), 6)
    expect(c.monitoring).toBeCloseTo((1_048_576 / 1000) * 0.0025, 6)
  })
  it('Intelligent-Tiering não monitora objetos menores que 128 KB', () => {
    const p = { ...base, objectCount: 1000, avgObjectKB: 64, intelligentTieringShare: { frequent: 0, infrequent: 0, archiveInstant: 1 } }
    const c = monthlyCost(p, 'INTELLIGENT_TIERING', P)
    expect(c.monitoring).toBe(0)
    expect(c.storage).toBeCloseTo(((1000 * 64) / 1048576) * 0.02, 9)
  })
})

describe('requisições, recuperação e exclusão antecipada', () => {
  it('recuperação por GB em Standard-IA', () => {
    const p = { ...base, getsPerMonth: 10_000, retrievedGBPerMonth: 500 }
    const c = monthlyCost(p, 'STANDARD_IA', P)
    expect(c.retrieval).toBeCloseTo(5, 6)
    expect(c.requests).toBeCloseTo(0.01, 6)
  })
  it('restauração Expedited do Glacier cobra requisição cara', () => {
    const p = { ...base, retrievedGBPerMonth: 10, restoresPerMonth: 1000, restoreTier: 'expedited' as const }
    const c = monthlyCost(p, 'GLACIER', P)
    expect(c.retrieval).toBeCloseTo(0.3, 6)
    expect(c.requests).toBeCloseTo(10, 6)
  })
  it('exclusão antecipada no Deep Archive (retenção 60 de 180 dias)', () => {
    const p = { ...base, objectCount: 1024, avgObjectKB: 1048576, retentionDays: 60 } // 1024 GB
    const c = monthlyCost(p, 'DEEP_ARCHIVE', P)
    const billed = c.billedGB
    expect(c.earlyDeletion).toBeCloseTo(billed * (30 / 60) * (120 / 30) * 0.001, 6)
  })
  it('Intelligent-Tiering não cobra exclusão antecipada', () => {
    expect(monthlyCost({ ...base, retentionDays: 5 }, 'INTELLIGENT_TIERING', P).earlyDeletion).toBe(0)
  })
})

describe('requisitos', () => {
  it('acesso imediato exclui classes arquivadas', () => {
    expect(requirementViolations('GLACIER', { instantAccess: true, azResilient: false })).toHaveLength(1)
    expect(requirementViolations('GLACIER_IR', { instantAccess: true, azResilient: false })).toHaveLength(0)
  })
  it('resiliência a AZ exclui One Zone', () => {
    expect(requirementViolations('ONEZONE_IA', { instantAccess: false, azResilient: true })).toHaveLength(1)
    expect(requirementViolations('EXPRESS_ONEZONE', { instantAccess: false, azResilient: true })).toHaveLength(1)
  })
  it('prazo de restauração exclui Deep Archive quando menor que 12 h', () => {
    expect(requirementViolations('DEEP_ARCHIVE', { instantAccess: false, azResilient: true, maxRestoreHours: 6 })).toHaveLength(1)
    expect(requirementViolations('GLACIER', { instantAccess: false, azResilient: true, maxRestoreHours: 6 })).toHaveLength(0)
  })
  it('a mais barata que atende aos requisitos', () => {
    const p = { ...base, requirements: { instantAccess: true, azResilient: true } }
    expect(cheapestCompliant(p, P, STORAGE_CLASS_ORDER)?.storageClass).toBe('GLACIER_IR')
  })
})

describe('tabela de preços versionada', () => {
  it('tem todas as classes e componentes para cada Região', () => {
    expect(PRICE_TABLE.source).toContain('AWS Price List')
    for (const r of Object.values(PRICE_TABLE.regions)) {
      for (const sc of STORAGE_CLASS_ORDER) {
        expect(r.storageGBMonth[sc], sc).toBeGreaterThan(0)
        expect(r.putPer1000[sc], sc).toBeGreaterThan(0)
      }
      expect(r.dataTransferOutPerGB).toBeGreaterThan(0)
      expect(Object.keys(r.offers).length).toBe(3)
    }
  })
})
