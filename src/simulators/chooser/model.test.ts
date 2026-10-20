import { describe, expect, it } from 'vitest'
import { bestComputeOption, judgeCompute, OPTIONS, type ComputeItem, type ComputeOption } from './model'

const ALL = Object.keys(OPTIONS) as ComputeOption[]
const item = (id: string, dominant: ComputeItem['dominant'], needs: ComputeItem['needs']): ComputeItem => ({ id, text: id, dominant, needs })

describe('escolha da computação', () => {
  it('escolhe o serviço que atende a tudo com menos trabalho', () => {
    expect(bestComputeOption(item('evento', 'event-driven', ['event-driven']), ALL)).toBe('lambda')
    expect(bestComputeOption(item('api', 'no-servers', ['containers', 'no-servers', 'long-running']), ALL)).toBe('ecs-fargate')
    expect(bestComputeOption(item('k8s', 'kubernetes', ['kubernetes', 'elastic']), ALL)).toBe('eks')
    expect(bestComputeOption(item('k8s-local', 'own-servers', ['own-servers', 'kubernetes']), ALL)).toBe('eks-anywhere')
    expect(bestComputeOption(item('lote', 'job-queue', ['job-queue']), ALL)).toBe('batch')
    expect(bestComputeOption(item('legado', 'os-control', ['os-control', 'long-running']), ALL)).toBe('ec2')
    expect(bestComputeOption(item('vmware', 'vmware', ['vmware']), ALL)).toBe('evs')
  })

  it('a Lambda não atende a processamento acima de 15 minutos', () => {
    const v = judgeCompute(item('video', 'long-running', ['long-running', 'no-servers']), 'lambda', ALL)
    expect(v.score).toBe(0)
    expect(v.message).toContain('ECS no Fargate')
  })

  it('dá meio ponto para quem atende com mais trabalho do que o caso pede', () => {
    const it2 = item('api', 'no-servers', ['containers', 'no-servers'])
    expect(judgeCompute(it2, 'ecs-fargate', ALL).status).toBe('correct')
    expect(judgeCompute(it2, 'eks', ALL).score).toBe(0)
    const it3 = item('site', 'elastic', ['containers', 'elastic', 'always-on'])
    expect(judgeCompute(it3, 'ecs-ec2', ALL).score).toBe(0.5)
  })
})
