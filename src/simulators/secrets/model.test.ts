import { describe, expect, it } from 'vitest'
import { loginOutcome, momentState } from './model'

describe('rotação de segredos', () => {
  it('createSecret cria a versão pendente sem mudar a atual', () => {
    expect(momentState('single', 'createSecret').labels).toEqual({ AWSCURRENT: 1, AWSPENDING: 2 })
  })

  it('finishSecret move AWSCURRENT e deixa a anterior como AWSPREVIOUS', () => {
    expect(momentState('single', 'finishSecret').labels).toEqual({ AWSCURRENT: 2, AWSPREVIOUS: 1 })
  })

  it('no usuário único, entre o setSecret e o finishSecret o login com a versão atual falha', () => {
    expect(loginOutcome('single', 'createSecret', 'fresh').outcome).toBe('ok-v1')
    expect(loginOutcome('single', 'setSecret', 'fresh').outcome).toBe('fail')
    expect(loginOutcome('single', 'finishSecret', 'fresh').outcome).toBe('ok-v2')
  })

  it('nos usuários alternados, as duas credenciais valem depois da rotação', () => {
    expect(loginOutcome('alternating', 'setSecret', 'fresh').outcome).toBe('ok-v1')
    expect(loginOutcome('alternating', 'finishSecret', 'cached').outcome).toBe('ok-v1')
    expect(loginOutcome('alternating', 'finishSecret', 'fresh').outcome).toBe('ok-v2')
  })

  it('um cache mais antigo que duas rotações falha mesmo nos usuários alternados', () => {
    expect(loginOutcome('alternating', 'secondRotation', 'cached').outcome).toBe('fail')
    expect(loginOutcome('single', 'finishSecret', 'cached').outcome).toBe('fail')
  })
})
