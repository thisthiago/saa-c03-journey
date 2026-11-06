import { describe, expect, it } from 'vitest'
import { evaluateActivity, referenceResponse, type PlacementResponse } from '../evaluate'
import { initialResponse, isComplete } from '../ui-logic'
import type { BuildActivity } from '../types'
import { BUILD_OUT, buildChips, buildProblems, chipStatus, pieceHome } from './evaluate'

/** VPC com duas zonas: uma sub-rede web por zona, o internet gateway na borda e um distrator. */
const vpcBuild: BuildActivity = {
  id: 't.build',
  kind: 'build',
  title: 'Monte a VPC',
  prompt: 'Posicione as peças.',
  concepts: [{ id: 'c' }, { id: 'd' }],
  xp: 30,
  difficulty: 1,
  explanation: ['e'],
  board: {
    width: 600,
    height: 300,
    label: 'VPC com duas zonas',
    boxes: [
      { id: 'vpc', kind: 'vpc', label: 'VPC', x: 80, y: 20, w: 500, h: 260 },
      { id: 'za', kind: 'zone', label: 'Zona a', x: 100, y: 50, w: 220, h: 210 },
      { id: 'zb', kind: 'zone', label: 'Zona b', x: 340, y: 50, w: 220, h: 210 },
    ],
  },
  pieces: [
    { id: 'igw', text: 'Internet gateway', explanation: 'Fica na borda.', concepts: ['c'] },
    { id: 'web', text: 'Sub-rede web', count: 3, explanation: 'Uma por zona.', concepts: ['d'] },
    { id: 'span', text: 'Sub-rede que cobre as duas zonas', explanation: 'Não existe.', concepts: ['d'] },
  ],
  slots: [
    { id: 'edge', label: 'Borda da VPC', x: 10, y: 120, w: 120, h: 60, expect: { igw: 1 }, explanation: 'A borda recebe o gateway.' },
    { id: 'a', label: 'Zona a', x: 110, y: 80, w: 200, h: 80, expect: { web: 1 }, explanation: 'Uma sub-rede na zona a.' },
    { id: 'b', label: 'Zona b', x: 350, y: 80, w: 200, h: 80, expect: { web: 1 }, explanation: 'Uma sub-rede na zona b.' },
  ],
}

const score = (placements: Record<string, string>) => evaluateActivity(vpcBuild, { placements }).score

describe('montagem', () => {
  it('cria uma ficha por cópia', () => {
    expect(buildChips(vpcBuild).map((c) => c.id)).toEqual(['igw#1', 'web#1', 'web#2', 'web#3', 'span#1'])
  })

  it('a resposta de referência tira 1 e manda a sobra para a bandeja', () => {
    const ref = referenceResponse(vpcBuild) as PlacementResponse
    expect(ref.placements).toEqual({ 'igw#1': 'edge', 'web#1': 'a', 'web#2': 'b', 'web#3': BUILD_OUT, 'span#1': BUILD_OUT })
    expect(evaluateActivity(vpcBuild, ref).score).toBe(1)
  })

  it('qualquer cópia serve: o que conta é quantas de cada peça há em cada lugar', () => {
    expect(score({ 'igw#1': 'edge', 'web#3': 'a', 'web#1': 'b', 'web#2': BUILD_OUT, 'span#1': BUILD_OUT })).toBe(1)
  })

  it('duas sub-redes na mesma zona: a segunda está errada e a zona b fica vazia', () => {
    const p = { 'igw#1': 'edge', 'web#1': 'a', 'web#2': 'a', 'web#3': BUILD_OUT, 'span#1': BUILD_OUT }
    expect(score(p)).toBe(0.8)
    expect(chipStatus(vpcBuild, p)['web#2']).toBe('wrong')
    const ev = evaluateActivity(vpcBuild, { placements: p })
    expect(ev.items.find((i) => i.id === 'slot-b')?.message).toBe('Uma sub-rede na zona b.')
    expect(ev.items.find((i) => i.id === 'slot-a')).toBeDefined()
    expect(ev.items.find((i) => i.id === 'piece-web')?.status).toBe('partial')
  })

  it('o distrator dentro da rede custa a ficha dele', () => {
    const p = { 'igw#1': 'edge', 'web#1': 'a', 'web#2': 'b', 'web#3': BUILD_OUT, 'span#1': 'a' }
    expect(score(p)).toBe(0.8)
    const ev = evaluateActivity(vpcBuild, { placements: p })
    expect(ev.items.find((i) => i.id === 'piece-span')).toMatchObject({ status: 'wrong', message: 'Fica fora desta rede. Não existe.' })
    expect(ev.conceptOutcomes).toEqual({ c: 1, d: 0.5 })
  })

  it('peças sem lugar contam como erradas', () => {
    expect(score({ 'igw#1': 'edge' })).toBe(0.2)
  })

  it('diz onde cada peça fica', () => {
    expect(pieceHome(vpcBuild, vpcBuild.pieces[1])).toBe('Lugar certo: Zona a e Zona b; a outra cópia fica fora')
    expect(pieceHome(vpcBuild, vpcBuild.pieces[0])).toBe('Lugar certo: Borda da VPC')
  })

  it('só fica completa com todas as peças posicionadas', () => {
    const init = initialResponse(vpcBuild, 's') as PlacementResponse
    expect(isComplete(vpcBuild, init)).toBe(false)
    expect(isComplete(vpcBuild, referenceResponse(vpcBuild))).toBe(true)
  })

  it('valida a configuração', () => {
    expect(buildProblems(vpcBuild)).toEqual([])
    const semDistrator: BuildActivity = { ...vpcBuild, pieces: vpcBuild.pieces.slice(0, 1) }
    expect(buildProblems({ ...semDistrator, slots: vpcBuild.slots.slice(0, 1) })).toContain('nenhuma peça sobra para a bandeja (falta um distrator)')
    const demais: BuildActivity = { ...vpcBuild, slots: [...vpcBuild.slots, { ...vpcBuild.slots[1], id: 'c', expect: { web: 2 } }] }
    expect(buildProblems(demais)).toContain('a peça web é esperada 4 vezes, mas tem 3 cópia(s)')
  })
})
