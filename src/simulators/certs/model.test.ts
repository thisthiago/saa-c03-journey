import { describe, expect, it } from 'vitest'
import { placement, renewal, type Certificate } from './model'

const base: Certificate = { id: 'c', domain: 'loja.exemplo.com', source: 'acm', validation: 'dns', cnamePresent: true, region: 'sa-east-1', attachedTo: 'alb' }

describe('certificados do ACM', () => {
  it('DNS, em uso e com o CNAME: renova sozinho', () => {
    expect(renewal(base).result).toBe('auto')
  })

  it('sem o CNAME ou validado por e-mail: precisa de ação', () => {
    expect(renewal({ ...base, cnamePresent: false }).result).toBe('action')
    expect(renewal({ ...base, validation: 'email' }).result).toBe('action')
  })

  it('importado ou sem uso: vence sem renovar', () => {
    expect(renewal({ ...base, source: 'imported', validation: undefined }).result).toBe('expires')
    expect(renewal({ ...base, attachedTo: 'none' }).result).toBe('expires')
  })

  it('o CloudFront exige o certificado em us-east-1', () => {
    expect(placement({ ...base, attachedTo: 'cloudfront' }).result).toBe('wrong-region')
    expect(placement({ ...base, attachedTo: 'cloudfront', region: 'us-east-1' }).result).toBe('ok')
    expect(renewal({ ...base, attachedTo: 'cloudfront' }).result).toBe('expires')
  })

  it('certificado gerenciado não vai direto para a EC2; o exportável vai', () => {
    expect(placement({ ...base, attachedTo: 'ec2' }).result).toBe('cannot-attach')
    expect(placement({ ...base, attachedTo: 'ec2', exportable: true }).result).toBe('ok')
  })
})
