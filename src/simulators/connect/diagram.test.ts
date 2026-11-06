import { describe, expect, it } from 'vitest'
import { HORIZONTE_CONNECT } from '../../content/modules/network/phases/f04/phase'
import { diagramProblems } from '../../engine/diagram'
import { topologyDiagram } from './diagram'

const scenario = (id: string) => HORIZONTE_CONNECT.scenarios.find((s) => s.id === id)!
const option = (sid: string, oid: string) => scenario(sid).options.find((o) => o.id === oid)!

describe('desenho das topologias', () => {
  it('sem escolha: só as redes, sem ligações', () => {
    const d = topologyDiagram(scenario('doze'))
    expect(d.nodes).toHaveLength(13)
    expect(d.links).toEqual([])
    expect(diagramProblems(d)).toEqual([])
  })

  it('estrela de peering: o escritório não alcança as outras VPCs, e o desenho risca o par', () => {
    const d = topologyDiagram(scenario('doze'), option('doze', 'star'))
    expect(diagramProblems(d)).toEqual([])
    const red = d.links!.filter((l) => l.tone === 'danger')
    expect(red.map((l) => [l.from, l.to])).toEqual([['v5', 'v12'], ['v3', 'dc'], ['v12', 'dc']])
    expect(red.every((l) => l.crossed)).toBe(true)
  })

  it('Transit Gateway com tabelas separadas: um anexo por rede, colorido pela tabela, e nada em vermelho', () => {
    const d = topologyDiagram(scenario('ambientes'), option('ambientes', 'tgw-iso'))
    expect(diagramProblems(d)).toEqual([])
    expect(d.links!.filter((l) => l.to === 'tgw').map((l) => l.tone)).toEqual(['accent', 'info', 'mastery'])
    expect(d.links!.some((l) => l.tone === 'danger')).toBe(false)
    expect(d.notes!.map((n) => n.text)).toEqual(['tabela produção', 'tabela desenvolvimento', 'tabela compartilhada'])
  })

  it('malha de três VPCs: desenvolvimento alcança produção, e não podia', () => {
    const d = topologyDiagram(scenario('ambientes'), option('ambientes', 'mesh'))
    expect(d.links!.find((l) => l.label === 'não podia')).toMatchObject({ from: 'dev', to: 'prod' })
  })
})
