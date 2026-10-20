import { describe, expect, it } from 'vitest'
import { evaluateRP, type RPBucket, type RPRequest } from './model'

const B: RPBucket = { name: 'b', requesterPays: true, ownerAccount: 'OWNER', orgAccounts: ['ORG'] }
const req = (p: Partial<RPRequest>): RPRequest => ({ id: 'r', label: 'r', principal: { kind: 'user', account: 'EXT', name: 'u' }, action: 'GET', header: true, authorized: true, ...p })

describe('Requester Pays', () => {
  it('anônimo é negado', () => expect(evaluateRP(B, req({ principal: { kind: 'anonymous' } })).status).toBe(403))
  it('externo com cabeçalho paga requisição e transferência', () => expect(evaluateRP(B, req({}))).toMatchObject({ status: 200, requestPayer: 'requester', transferPayer: 'requester', chargedAccount: 'EXT' }))
  it('sem cabeçalho: 403; de fora da organização, o dono não paga', () => expect(evaluateRP(B, req({ header: false }))).toMatchObject({ status: 403, requestPayer: 'none' }))
  it('sem cabeçalho dentro da organização: o dono paga o 403', () => expect(evaluateRP(B, req({ header: false, principal: { kind: 'user', account: 'ORG', name: 'u' } }))).toMatchObject({ status: 403, requestPayer: 'owner' }))
  it('o dono não precisa do cabeçalho', () => expect(evaluateRP(B, req({ header: false, principal: { kind: 'user', account: 'OWNER', name: 'u' } }))).toMatchObject({ status: 200, requestPayer: 'owner' }))
  it('papel assumido: paga a conta do papel', () => expect(evaluateRP(B, req({ principal: { kind: 'assumed-role', roleAccount: 'ROLE', callerAccount: 'EXT', name: 'r' } })).chargedAccount).toBe('ROLE'))
  it('RestoreObject: requisitante paga a requisição; dono, a recuperação', () => expect(evaluateRP(B, req({ action: 'RESTORE' }))).toMatchObject({ requestPayer: 'requester', retrievalPayer: 'owner' }))
  it('Requester Pays não concede acesso', () => expect(evaluateRP(B, req({ authorized: false })).status).toBe(403))
})
