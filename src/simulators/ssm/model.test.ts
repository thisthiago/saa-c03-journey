import { describe, expect, it } from 'vitest'
import { isManaged, NEEDS_INBOUND_PORT, notManagedReasons, type NodeState } from './model'

const ok: NodeState = { agent: true, permissions: 'instance-profile', route: 'vpc-endpoints' }

describe('nó gerenciado do Systems Manager', () => {
  it('precisa de agente, permissões e caminho até o serviço', () => {
    expect(isManaged(ok)).toBe(true)
    expect(notManagedReasons({ ...ok, agent: false })).toHaveLength(1)
    expect(isManaged({ ...ok, permissions: 'none' })).toBe(false)
    expect(isManaged({ ...ok, route: 'none' })).toBe(false)
    expect(isManaged({ ...ok, route: 'vpc-endpoints-partial' })).toBe(false)
    expect(isManaged({ ...ok, route: 'internet' })).toBe(true)
  })
  it('a Default Host Management Configuration exige IMDSv2 e agente novo', () => {
    expect(isManaged({ ...ok, permissions: 'default-host-management', imdsv2AndNewAgent: true })).toBe(true)
    expect(isManaged({ ...ok, permissions: 'default-host-management', imdsv2AndNewAgent: false })).toBe(false)
  })
  it('só o Session Manager e o Run Command dispensam porta de entrada', () => {
    expect(NEEDS_INBOUND_PORT['session-manager']).toBe(false)
    expect(NEEDS_INBOUND_PORT['run-command']).toBe(false)
    expect(NEEDS_INBOUND_PORT.ssh && NEEDS_INBOUND_PORT.rdp && NEEDS_INBOUND_PORT.bastion).toBe(true)
  })
})
