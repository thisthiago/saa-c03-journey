import { describe, expect, it } from 'vitest'
import { governancePrices } from '../governance-prices'
import { logsMonthly, matchedLines, matchFilter, NEVER, RETENTION_VALUES } from './model'

const doc = JSON.stringify({
  eventType: 'UpdateTrail',
  sourceIPAddress: '111.111.111.111',
  arrayKey: ['value', 'another value'],
  objectList: [{ name: 'a', id: 1 }, { name: 'b', id: 2 }],
  SomeObject: null,
})
const compound = JSON.stringify({
  user: { id: 1, email: 'John.Stiles@example.com' },
  users: [{ id: 2, email: 'John.Doe@example.com' }, { id: 3, email: 'Jane.Doe@example.com' }],
  actions: ['GET', 'PUT', 'DELETE'],
  coordinates: [[0, 1, 2], [4, 5, 6], [7, 8, 9]],
})

describe('padrões de filtro do CloudWatch Logs: exemplos da documentação', () => {
  const lines = ['[ERROR 400] BAD REQUEST', '[ERROR 401] UNAUTHORIZED REQUEST', '[ERROR 419] MISSING ARGUMENTS', '[ERROR 420] INVALID ARGUMENTS']

  it('um termo, vários termos e termos opcionais', () => {
    expect(matchedLines('ERROR', lines)).toEqual([0, 1, 2, 3])
    expect(matchedLines('ERROR ARGUMENTS', lines)).toEqual([2, 3])
    expect(matchedLines('?ERROR ?ARGUMENTS', lines)).toEqual([0, 1, 2, 3])
    expect(matchedLines('?BAD ?UNAUTHORIZED', lines)).toEqual([0, 1])
  })

  it('diferencia maiúsculas de minúsculas e aceita frases entre aspas', () => {
    expect(matchFilter('error', '[ERROR 400] BAD REQUEST')).toBe(false)
    expect(matchFilter('"BAD REQUEST"', '[ERROR 400] BAD REQUEST')).toBe(true)
    expect(matchFilter('"REQUEST BAD"', '[ERROR 400] BAD REQUEST')).toBe(false)
  })

  it('JSON: igualdade de texto, curinga, índice de lista e números', () => {
    expect(matchFilter('{ $.eventType = "UpdateTrail" }', doc)).toBe(true)
    expect(matchFilter('{ $.eventType = "CreateTrail" }', doc)).toBe(false)
    expect(matchFilter('{ $.sourceIPAddress != 123.123.* }', doc)).toBe(true)
    expect(matchFilter('{ $.sourceIPAddress = 111.111.* }', doc)).toBe(true)
    expect(matchFilter('{ $.arrayKey[0] = "value" }', doc)).toBe(true)
    expect(matchFilter('{ $.objectList[1].id = 2 }', doc)).toBe(true)
    expect(matchFilter('{ $.latency < 50 }', '{"latency": 12}')).toBe(true)
    expect(matchFilter('{ $.latency >= 50 }', '{"latency": 12}')).toBe(false)
    expect(matchFilter('{ $.errorCode != 500 }', '{"errorCode": 400}')).toBe(true)
  })

  it('JSON: && e || com parênteses e a ordem de operações () > && > ||', () => {
    expect(matchFilter('{ ($.user.id = 1) && ($.users[0].email = "John.Doe@example.com") }', compound)).toBe(true)
    expect(matchFilter('{ $.user.email = "John.Stiles@example.com" || $.coordinates[0][1] = "nonmatch" && $.actions[2] = "nonmatch" }', compound)).toBe(true)
    expect(matchFilter('{ ($.user.email = "John.Stiles@example.com" || $.coordinates[0][1] = "nonmatch") && $.actions[2] = "nonmatch" }', compound)).toBe(false)
    expect(matchFilter('{ ($.user.id = 2 && $.users[0].email = "nonmatch") || $.actions[2] = "GET" }', compound)).toBe(false)
  })

  it('linha que não é JSON não casa com padrão JSON', () => {
    expect(matchFilter('{ $.status >= 500 }', 'ERROR texto solto')).toBe(false)
  })
})

describe('custo do grupo de logs', () => {
  const v = { ingestGBPerDay: 10, storedGBPerDay: 2, insightsScannedGBPerMonth: 100 }

  it('a classe Infrequent Access muda só a ingestão', () => {
    const std = logsMonthly(v, 'standard', 30)
    const ia = logsMonthly(v, 'infrequent', 30)
    expect(ia.storage).toBe(std.storage)
    expect(ia.queries).toBe(std.queries)
    expect(ia.ingest).toBeLessThan(std.ingest)
  })

  it('usa os preços da tabela: ingestão de 10 GB por dia em 30 dias', () => {
    const p = governancePrices().cloudwatch
    expect(logsMonthly(v, 'standard', 30).ingest).toBeCloseTo(10 * 30 * p.logIngestGB, 6)
    expect(logsMonthly(v, 'standard', 30).storage).toBeCloseTo(2 * 30 * p.logStorageGBMonth, 6)
  })

  it('reter por mais tempo custa mais armazenamento; "nunca expira" vira cinco anos de dados', () => {
    expect(logsMonthly(v, 'standard', 365).storage).toBeGreaterThan(logsMonthly(v, 'standard', 30).storage)
    expect(logsMonthly(v, 'standard', NEVER).storage).toBeGreaterThan(logsMonthly(v, 'standard', 731).storage)
  })

  it('lista os valores de retenção da API', () => {
    expect(RETENTION_VALUES.includes(90)).toBe(true)
    expect(RETENTION_VALUES.includes(3653)).toBe(true)
    expect((RETENTION_VALUES as readonly number[]).includes(45)).toBe(false)
  })
})
