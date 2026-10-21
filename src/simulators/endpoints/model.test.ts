import { describe, expect, it } from 'vitest'
import { networkPrices } from '../network-prices'
import { cheapestPath, pathMonthly, pathProblems, type EpWorkload } from './model'

const w = (x: Partial<EpWorkload>): EpWorkload => ({ id: 'x', name: 'x', description: '', service: 's3', gbMonth: 1000, azs: 2, ...x })

describe('acesso privado a serviços', () => {
  it('o endpoint de gateway só existe para S3 e DynamoDB e não atende a rede da empresa', () => {
    expect(pathProblems(w({ service: 's3' }), 'gateway')).toEqual([])
    expect(pathProblems(w({ service: 'dynamodb' }), 'gateway')).toEqual([])
    expect(pathProblems(w({ service: 'sqs' }), 'gateway')).toHaveLength(1)
    expect(pathProblems(w({ fromOnPrem: true }), 'gateway')).toHaveLength(1)
    expect(pathProblems(w({ fromOnPrem: true }), 'interface')).toEqual([])
  })

  it('para S3 dentro da VPC, o endpoint de gateway sai de graça', () => {
    expect(pathMonthly(w({}), 'gateway').total).toBe(0)
    expect(cheapestPath(w({}))).toBe('gateway')
  })

  it('para outros serviços, o endpoint de interface vence o NAT quando o volume é alto', () => {
    const p = networkPrices()
    const big = w({ service: 'ecr', gbMonth: 5000, azs: 2 })
    expect(pathMonthly(big, 'nat').total).toBeCloseTo(p.nat.hour * 730 + 5000 * p.nat.perGB)
    expect(cheapestPath(big)).toBe('interface')
    expect(cheapestPath(w({ service: 'ecr', gbMonth: 10, azs: 3, natShared: true }))).toBe('nat')
  })
})
