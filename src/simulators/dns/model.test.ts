import { describe, expect, it } from 'vitest'
import { bestHybrid, HYBRID } from '../hybrid/model'
import { NET_OPTIONS } from '../netchooser/model'
import { bestChoice } from '../shared/chooser'
import { resolveDns, type DnsRecord } from './model'
import { DNS_POLICIES } from './policy'

const br = { country: 'BR', continent: 'SA', latency: { 'sa-east-1': 15, 'us-east-1': 120 } }

describe('respostas do Route 53', () => {
  it('reproduz o exemplo da documentação: pesos 1 e 255 dão 1/256 e 255/256', () => {
    const recs: DnsRecord[] = [
      { id: 'a', label: 'A', policy: 'weighted', weight: 1 },
      { id: 'b', label: 'B', policy: 'weighted', weight: 255 },
    ]
    expect(resolveDns(recs, br).shares?.a).toBeCloseTo(1 / 256)
  })

  it('o registro de peso zero só entra quando todos os outros estão sem saúde (tabela da documentação)', () => {
    const recs = (h: [boolean, boolean, boolean]): DnsRecord[] => [
      { id: 'r1', label: '1', policy: 'weighted', weight: 1, healthy: h[0] },
      { id: 'r2', label: '2', policy: 'weighted', weight: 1, healthy: h[1] },
      { id: 'r3', label: '3', policy: 'weighted', weight: 0, healthy: h[2] },
    ]
    expect(resolveDns(recs([false, false, true]), br).answers).toEqual(['r3'])
    expect(resolveDns(recs([false, false, false]), br).answers).toEqual(['r1', 'r2'])
    expect(resolveDns(recs([false, true, false]), br).answers).toEqual(['r2'])
    expect(resolveDns(recs([true, true, true]), br).answers).toEqual(['r1', 'r2'])
  })

  it('geolocalização: o país vence o continente; sem registro padrão, não há resposta', () => {
    const recs: DnsRecord[] = [
      { id: 'sa', label: 'América do Sul', policy: 'geolocation', location: 'SA' },
      { id: 'br', label: 'Brasil', policy: 'geolocation', location: 'BR' },
    ]
    expect(resolveDns(recs, br).answers).toEqual(['br'])
    expect(resolveDns(recs, { country: 'FR', continent: 'EU' }).answers).toEqual([])
  })

  it('latência, failover e múltiplas respostas', () => {
    expect(resolveDns([{ id: 'sp', label: 'SP', policy: 'latency', region: 'sa-east-1' }, { id: 'va', label: 'VA', policy: 'latency', region: 'us-east-1' }], br).answers).toEqual(['sp'])
    expect(resolveDns([{ id: 'p', label: 'P', policy: 'failover', failover: 'primary', healthy: false }, { id: 's', label: 'S', policy: 'failover', failover: 'secondary' }], br).answers).toEqual(['s'])
    const many = Array.from({ length: 10 }, (_, i): DnsRecord => ({ id: `m${i}`, label: `${i}`, policy: 'multivalue', healthy: i !== 0 }))
    expect(resolveDns(many, br).answers).toHaveLength(8)
    expect(resolveDns(many, br).answers).not.toContain('m0')
  })
})

describe('catálogos de escolha', () => {
  it('cada requisito tem uma melhor opção única', () => {
    for (const cat of [HYBRID, DNS_POLICIES, NET_OPTIONS]) {
      for (const need of Object.keys(cat.needLabel)) {
        expect(() => bestChoice(cat, { id: need, text: need, dominant: need, needs: [need] }, Object.keys(cat.options)), need).not.toThrow()
      }
    }
  })

  it('a conexão híbrida segue banda, criptografia e resiliência', () => {
    const all = Object.keys(HYBRID.options) as Parameters<typeof bestHybrid>[1]
    expect(bestHybrid(['encrypted', 'fast-setup', 'bw-1'], all)).toBe('vpn')
    expect(bestHybrid(['private-path', 'bw-10'], all)).toBe('dx-dedicated')
    expect(bestHybrid(['private-path', 'bw-10', 'encrypted'], all)).toBe('dx-macsec')
    expect(bestHybrid(['private-path', 'survive-location'], all)).toBe('dx-high')
    expect(bestHybrid(['encrypted', 'fast-setup', 'bw-5'], all)).toBe('vpn-ecmp')
    expect(bestHybrid(['remote-users'], all)).toBe('client-vpn')
  })
})
