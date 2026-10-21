import { describe, expect, it } from 'vitest'
import { dataLoss, effectiveDeletionPolicy, planResource, planUpdate, policyProblems, type StackResource } from './model'

const inst = (props: StackResource['props'], extra: Partial<StackResource> = {}): StackResource => ({ id: 'web', type: 'AWS::EC2::Instance', props, ...extra })
const db = (props: StackResource['props'], extra: Partial<StackResource> = {}): StackResource => ({ id: 'db', type: 'AWS::RDS::DBInstance', props, ...extra })
const bucket = (props: StackResource['props'], extra: Partial<StackResource> = {}): StackResource => ({ id: 'bkt', type: 'AWS::S3::Bucket', props, ...extra })

describe('comportamento de atualização das propriedades', () => {
  it('só tags mudam: sem interrupção, com o mesmo ID', () => {
    expect(planResource(inst({ Tags: 'a' }), inst({ Tags: 'b' })).effect).toBe('none')
  })
  it('o tipo da instância muda: alguma interrupção', () => {
    expect(planResource(inst({ InstanceType: 't3.small' }), inst({ InstanceType: 't3.large' })).effect).toBe('some')
  })
  it('a AZ muda: substituição (exemplo da documentação)', () => {
    expect(planResource(inst({ AvailabilityZone: 'a' }), inst({ AvailabilityZone: 'b' })).effect).toBe('replaced-delete')
  })
  it('vale a pior das propriedades mudadas', () => {
    const p = planResource(inst({ Tags: 'a', InstanceType: 't3.small', ImageId: 'ami-1' }), inst({ Tags: 'b', InstanceType: 't3.large', ImageId: 'ami-2' }))
    expect(p.effect).toBe('replaced-delete')
    expect(p.changed).toHaveLength(3)
  })
  it('sem mudanças, o recurso não é tocado', () => {
    expect(planResource(inst({ Tags: 'a' }), inst({ Tags: 'a' })).effect).toBe('unchanged')
  })
  it('recusa propriedade sem comportamento conferido', () => {
    expect(() => planResource(inst({ Foo: 1 }), inst({ Foo: 2 }))).toThrow()
  })
})

describe('o destino do recurso antigo', () => {
  it('substituição segue a UpdateReplacePolicy, e não a DeletionPolicy', () => {
    const before = bucket({ BucketName: 'a' }, { deletionPolicy: 'Retain' })
    expect(planResource(before, bucket({ BucketName: 'b' }, { deletionPolicy: 'Retain' })).effect).toBe('replaced-delete')
    expect(planResource(before, bucket({ BucketName: 'b' }, { updateReplacePolicy: 'Retain' })).effect).toBe('replaced-retain')
  })
  it('recurso removido segue a DeletionPolicy; o RDS sem cluster tem Snapshot como padrão', () => {
    expect(planResource(bucket({}), undefined).effect).toBe('removed-delete')
    expect(planResource(bucket({}, { deletionPolicy: 'Retain' }), undefined).effect).toBe('removed-retain')
    expect(planResource(bucket({}, { deletionPolicy: 'RetainExceptOnCreate' }), undefined).effect).toBe('removed-retain')
    expect(effectiveDeletionPolicy(db({}))).toBe('Snapshot')
    expect(planResource(db({}), undefined).effect).toBe('removed-snapshot')
    expect(planResource(db({}, { deletionPolicy: 'Delete' }), undefined).effect).toBe('removed-delete')
  })
  it('recurso novo é criado', () => {
    expect(planResource(undefined, bucket({})).effect).toBe('created')
  })
  it('a substituição com Snapshot guarda um snapshot do RDS', () => {
    expect(planResource(db({ DBInstanceIdentifier: 'a' }), db({ DBInstanceIdentifier: 'b' }, { updateReplacePolicy: 'Snapshot' })).effect).toBe('replaced-snapshot')
  })
})

describe('plano da atualização e riscos', () => {
  it('lista cada recurso dos dois modelos', () => {
    const plan = planUpdate([inst({ Tags: 'a' }), bucket({})], [inst({ Tags: 'a' }), { id: 'novo', type: 'AWS::DynamoDB::Table', props: {} }])
    expect(plan.map((p) => [p.id, p.effect])).toEqual([['web', 'unchanged'], ['bkt', 'removed-delete'], ['novo', 'created']])
  })
  it('aponta perda de dados em substituição ou remoção sem proteção', () => {
    expect(dataLoss(planResource(db({ DBInstanceIdentifier: 'a' }), db({ DBInstanceIdentifier: 'b' })))).toBe(true)
    expect(dataLoss(planResource(db({ DBInstanceIdentifier: 'a' }), db({ DBInstanceIdentifier: 'b' }, { updateReplacePolicy: 'Snapshot' })))).toBe(false)
    expect(dataLoss(planResource(inst({ ImageId: 'a' }), inst({ ImageId: 'b' })))).toBe(false)
  })
  it('a AWS recusaria Snapshot em tipos que não têm snapshot', () => {
    expect(policyProblems(bucket({}, { deletionPolicy: 'Snapshot' }))).toHaveLength(1)
    expect(policyProblems(db({}, { deletionPolicy: 'Snapshot' }))).toHaveLength(0)
  })
})
