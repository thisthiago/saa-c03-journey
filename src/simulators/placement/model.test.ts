import { describe, expect, it } from 'vitest'
import { bestOption, judgePlacement, type PlacementItem, type PlacementOption } from './model'

const ALL: PlacementOption[] = ['single-az', 'multi-az', 'multi-region', 'local-zone', 'wavelength', 'outposts', 'cloudfront', 'global-accelerator']
const item = (dominant: PlacementItem['dominant'], needs = [dominant]): PlacementItem => ({ id: 'x', text: 'x', dominant, needs })

describe('escolha da infraestrutura', () => {
  it('cada requisito dominante tem uma melhor opção única', () => {
    expect(bestOption(item('ha-az', ['ha-az', 'full-services']), ALL)).toBe('multi-az')
    expect(bestOption(item('dr-region', ['dr-region', 'full-services']), ALL)).toBe('multi-region')
    expect(bestOption(item('metro-latency'), ALL)).toBe('local-zone')
    expect(bestOption(item('mobile-5g'), ALL)).toBe('wavelength')
    expect(bestOption(item('on-premises'), ALL)).toBe('outposts')
    expect(bestOption(item('static-cache'), ALL)).toBe('cloudfront')
    expect(bestOption(item('global-dynamic'), ALL)).toBe('global-accelerator')
  })
  it('opção que atende, mas é exagerada, vale metade', () => {
    const v = judgePlacement(item('ha-az', ['ha-az', 'full-services']), 'multi-region', ALL)
    expect(v.score).toBe(0.5)
    expect(v.status).toBe('partial')
  })
  it('Local Zone não resolve 5G; Wavelength não é outra Região', () => {
    expect(judgePlacement(item('mobile-5g'), 'local-zone', ALL).score).toBe(0)
    expect(judgePlacement(item('dr-region', ['dr-region']), 'wavelength', ALL).score).toBe(0)
  })
})
