import { describe, expect, it } from 'vitest'
import { sourceOf } from './model'

describe('origem dos achados', () => {
  it('reconhece cada formato', () => {
    expect(sourceOf('UnauthorizedAccess:EC2/SSHBruteForce').source).toBe('guardduty')
    expect(sourceOf('CryptoCurrency:EC2/BitcoinTool.B!DNS').source).toBe('guardduty')
    expect(sourceOf('Policy:IAMUser/RootCredentialUsage').source).toBe('guardduty')
    expect(sourceOf('Policy:IAMUser/S3BlockPublicAccessDisabled').source).toBe('macie')
    expect(sourceOf('SensitiveData:S3Object/Personal').source).toBe('macie')
    expect(sourceOf('Package vulnerability: CVE-2024-6387 no openssh').source).toBe('inspector')
    expect(sourceOf('[S3.8] S3 general purpose buckets should block public access').source).toBe('securityhub')
    expect(sourceOf('s3-bucket-versioning-enabled: NON_COMPLIANT').source).toBe('config')
  })

  it('formato desconhecido é erro de conteúdo', () => {
    expect(() => sourceOf('alerta estranho')).toThrow()
  })
})
