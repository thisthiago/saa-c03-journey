import { describe, expect, it } from 'vitest'
import { runFlow, validateEvents, type Destination, type EventsConfig, type S3Event } from './model'

const D: Destination[] = [
  { id: 'thumb', kind: 'lambda', name: 'gerar-miniatura', allowsS3: true, writes: { prefix: 'thumbnails/' } },
  { id: 'q', kind: 'sqs', name: 'fila', allowsS3: true },
  { id: 'fifo', kind: 'sqs-fifo', name: 'fila.fifo', allowsS3: true },
  { id: 'topic', kind: 'sns', name: 'topico', allowsS3: true, subscribers: ['q', 'thumb'] },
  { id: 'locked', kind: 'sqs', name: 'fechada', allowsS3: false },
]
const up: S3Event = { id: 'up', label: 'upload', type: 'ObjectCreated:Put', key: 'uploads/foto.jpg' }
const cfg = (p: Partial<EventsConfig>): EventsConfig => ({ notifications: [], eventBridge: false, ebRules: [], ...p })

describe('eventos', () => {
  it('SQS FIFO não é destino direto', () => {
    expect(validateEvents(cfg({ notifications: [{ id: 'n', events: ['ObjectCreated:*'], destination: 'fifo' }] }), D)[0].message).toMatch(/FIFO/)
  })
  it('destino sem permissão é rejeitado', () => {
    expect(validateEvents(cfg({ notifications: [{ id: 'n', events: ['ObjectCreated:*'], destination: 'locked' }] }), D)).toHaveLength(1)
  })
  it('filtros sobrepostos para os mesmos eventos são rejeitados; sufixos distintos não', () => {
    const bad = cfg({ notifications: [{ id: 'a', events: ['ObjectCreated:*'], destination: 'q' }, { id: 'b', events: ['ObjectCreated:Put'], prefix: 'uploads/', destination: 'thumb' }] })
    expect(validateEvents(bad, D).length).toBeGreaterThan(0)
    const ok = cfg({ notifications: [{ id: 'a', events: ['ObjectCreated:*'], prefix: 'img', suffix: '.jpg', destination: 'q' }, { id: 'b', events: ['ObjectCreated:*'], prefix: 'img', suffix: '.png', destination: 'thumb' }] })
    expect(validateEvents(ok, D)).toEqual([])
    const jpgPg = cfg({ notifications: [{ id: 'a', events: ['ObjectCreated:*'], suffix: 'jpg', destination: 'q' }, { id: 'b', events: ['ObjectCreated:Put'], suffix: 'pg', destination: 'thumb' }] })
    expect(validateEvents(jpgPg, D).length).toBeGreaterThan(0)
    const diffTypes = cfg({ notifications: [{ id: 'a', events: ['ObjectCreated:*'], prefix: 'image/', destination: 'q' }, { id: 'b', events: ['ObjectRemoved:*'], prefix: 'image/', destination: 'thumb' }] })
    expect(validateEvents(diffTypes, D)).toEqual([])
  })
  it('Lambda que grava no mesmo bucket sem filtro gera loop; com prefixo de entrada, não', () => {
    expect(runFlow(cfg({ notifications: [{ id: 'n', events: ['ObjectCreated:*'], destination: 'thumb' }] }), D, up).loop).toBe(true)
    expect(runFlow(cfg({ notifications: [{ id: 'n', events: ['ObjectCreated:*'], prefix: 'uploads/', destination: 'thumb' }] }), D, up).loop).toBe(false)
  })
  it('fan-out via SNS entrega a todos os assinantes', () => {
    const f = runFlow(cfg({ notifications: [{ id: 'n', events: ['ObjectCreated:*'], prefix: 'uploads/', destination: 'topic' }] }), D, up)
    expect(f.deliveries.map((d) => d.destination).sort()).toEqual(['q', 'thumb', 'topic'])
  })
  it('EventBridge entrega a uma fila FIFO', () => {
    const f = runFlow(cfg({ eventBridge: true, ebRules: [{ id: 'r', eventType: 'created', suffix: '.jpg', targets: ['fifo'] }] }), D, up)
    expect(f.deliveries.some((d) => d.destination === 'fifo')).toBe(true)
  })
})
