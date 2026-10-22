import { describe, expect, it } from 'vitest'
import { fsxFailure } from './model'

describe('falhas no FSx', () => {
  it('Multi-AZ faz failover na falha do servidor e na da AZ', () => {
    expect(fsxFailure('windows-multi-az', 'server-failure').outcome).toBe('failover')
    expect(fsxFailure('windows-multi-az', 'az-outage').outcome).toBe('failover')
    expect(fsxFailure('zfs-multi-az', 'az-outage').outcome).toBe('failover')
  })
  it('Single-AZ se recupera de falha do servidor e fica fora com a AZ', () => {
    expect(fsxFailure('windows-single-az', 'server-failure').outcome).toBe('recovers')
    expect(fsxFailure('windows-single-az', 'az-outage').outcome).toBe('down')
    expect(fsxFailure('zfs-single-az-ha', 'server-failure').outcome).toBe('failover')
    expect(fsxFailure('zfs-single-az-ha', 'az-outage').outcome).toBe('down')
  })
  it('Lustre scratch perde os dados; persistente se recupera', () => {
    expect(fsxFailure('lustre-scratch', 'server-failure').outcome).toBe('lost')
    expect(fsxFailure('lustre-persistent', 'server-failure').outcome).toBe('recovers')
  })
})
