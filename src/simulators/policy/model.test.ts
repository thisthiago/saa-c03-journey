/**
 * Testes do motor de políticas com os exemplos da documentação da AWS
 * (conferidos em 19/10/2026) e casos calculados à mão.
 */
import { describe, expect, it } from 'vitest'
import { clauseHolds, evaluate, policyToJson, type AccountDef, type Policy, type PolicyScenario, type Principal } from './model'

const pol = (id: string, statements: Policy['statements']): Policy => ({ id, name: id, statements })

describe('condições', () => {
  it('chave ausente: falsa nos operadores comuns, verdadeira nos negados e no IfExists', () => {
    expect(clauseHolds({ op: 'Bool', key: 'aws:MultiFactorAuthPresent', values: ['false'] }, {})).toBe(false)
    expect(clauseHolds({ op: 'Bool', ifExists: true, key: 'aws:MultiFactorAuthPresent', values: ['false'] }, {})).toBe(true)
    expect(clauseHolds({ op: 'StringNotEquals', key: 'aws:RequestedRegion', values: ['sa-east-1'] }, {})).toBe(true)
    expect(clauseHolds({ op: 'Null', key: 'aws:TokenIssueTime', values: ['true'] }, {})).toBe(true)
  })

  it('vários valores combinam com OU; nos operadores negados, com NOR', () => {
    const ctx = { 'aws:RequestedRegion': 'us-east-1' }
    expect(clauseHolds({ op: 'StringEquals', key: 'aws:RequestedRegion', values: ['sa-east-1', 'us-east-1'] }, ctx)).toBe(true)
    expect(clauseHolds({ op: 'StringNotEquals', key: 'aws:RequestedRegion', values: ['sa-east-1', 'us-east-1'] }, ctx)).toBe(false)
    expect(clauseHolds({ op: 'StringNotEquals', key: 'aws:RequestedRegion', values: ['sa-east-1', 'eu-west-1'] }, ctx)).toBe(true)
  })

  it('substitui variáveis de política e compara IPs', () => {
    const ctx = { 'aws:PrincipalTag/time': 'dados', 'aws:ResourceTag/time': 'dados', 'aws:SourceIp': '203.0.113.7' }
    expect(clauseHolds({ op: 'StringEquals', key: 'aws:ResourceTag/time', values: ['${aws:PrincipalTag/time}'] }, ctx)).toBe(true)
    expect(clauseHolds({ op: 'StringEquals', key: 'aws:ResourceTag/Time', values: ['${aws:PrincipalTag/time}'] }, ctx)).toBe(true)
    expect(clauseHolds({ op: 'IpAddress', key: 'aws:SourceIp', values: ['203.0.113.0/24'] }, ctx)).toBe(true)
    expect(clauseHolds({ op: 'NotIpAddress', key: 'aws:SourceIp', values: ['198.51.100.0/24'] }, ctx)).toBe(true)
  })
})

describe('exemplo da documentação: Carlos e a role Demo entre contas', () => {
  const demo: Principal = {
    id: 'carlos',
    name: 'Carlos',
    kind: 'role-session',
    account: '111111111111',
    roleName: 'Demo',
    sessionName: 'carlos',
    identityPolicies: [
      pol('DemoPolicy', [
        { sid: 'AllowS3ListRead', effect: 'Allow', actions: ['s3:ListAllMyBuckets'], resources: ['*'] },
        { sid: 'AllowS3ProductionObjectActions', effect: 'Allow', actions: ['s3:*Object*'], resources: ['arn:aws:s3:::amzn-s3-demo-bucket-production/*'] },
        { sid: 'DenyS3Logs', effect: 'Deny', actions: ['s3:*'], resources: ['arn:aws:s3:::*log*', 'arn:aws:s3:::*log*/*'] },
      ]),
    ],
  }
  const scenario: PolicyScenario = {
    principals: [demo],
    resources: [
      {
        id: 'prod',
        arn: 'arn:aws:s3:::amzn-s3-demo-bucket-production/vendas.csv',
        account: '222222222222',
        policy: pol('BucketPolicy', [
          {
            sid: 'DemoObjects',
            effect: 'Allow',
            principals: [{ aws: 'arn:aws:iam::111111111111:role/Demo' }],
            actions: ['s3:GetObject*', 's3:PutObject*', 's3:ReplicateObject', 's3:RestoreObject'],
            resources: ['arn:aws:s3:::amzn-s3-demo-bucket-production/*'],
          },
        ]),
      },
      { id: 'logs', arn: 'arn:aws:s3:::amzn-s3-demo-bucket-production-logs/app.log', account: '222222222222' },
    ],
  }

  it('gravar no bucket de logs: Deny explícito na conta 111111111111', () => {
    const r = evaluate(scenario, { principalId: 'carlos', action: 's3:PutObject', resourceId: 'logs' })
    expect(r.decision).toBe('explicit-deny')
    expect(r.sid).toBe('DenyS3Logs')
  })

  it('gravar no bucket Production: as duas contas permitem', () => {
    expect(evaluate(scenario, { principalId: 'carlos', action: 's3:PutObject', resourceId: 'prod' }).decision).toBe('allow')
  })

  it('apagar no bucket Production: a bucket policy não concede DeleteObject', () => {
    const r = evaluate(scenario, { principalId: 'carlos', action: 's3:DeleteObject', resourceId: 'prod' })
    expect(r.decision).toBe('implicit-deny')
    expect(r.reason).toBe('cross-account-resource')
  })
})

describe('exemplo da documentação: Shirley e o permissions boundary', () => {
  const shirley: Principal = {
    id: 'shirley',
    name: 'Shirley',
    kind: 'user',
    account: '123456789012',
    userName: 'Shirley',
    identityPolicies: [pol('CreateUser', [{ sid: 'CreateUser', effect: 'Allow', actions: ['iam:CreateUser'], resources: ['*'] }])],
    boundary: pol('ShirleyBoundary', [{ sid: 'S3CwEc2', effect: 'Allow', actions: ['s3:*', 'cloudwatch:*', 'ec2:*'], resources: ['*'] }]),
  }
  const scenario: PolicyScenario = {
    principals: [shirley],
    resources: [
      { id: 'user', arn: 'arn:aws:iam::123456789012:user/novo', account: '123456789012' },
      { id: 'bucket', arn: 'arn:aws:s3:::dados', account: '123456789012' },
    ],
  }

  it('o boundary não permite iam:CreateUser, mesmo com a política de identidade', () => {
    const r = evaluate(scenario, { principalId: 'shirley', action: 'iam:CreateUser', resourceId: 'user' })
    expect(r.decision).toBe('implicit-deny')
    expect(r.reason).toBe('boundary-no-allow')
  })

  it('o boundary sozinho não concede S3', () => {
    expect(evaluate(scenario, { principalId: 'shirley', action: 's3:ListBucket', resourceId: 'bucket' }).reason).toBe('no-identity-allow')
  })
})

describe('exemplo da documentação: María, Zhang e Nikhil (delegação com boundary)', () => {
  const ACCT = '123456789012'
  const X_BOUNDARY = `arn:aws:iam::${ACCT}:policy/XCompanyBoundaries`
  const xCompany = pol('XCompanyBoundaries', [
    { sid: 'ServiceBoundaries', effect: 'Allow', actions: ['s3:*', 'cloudwatch:*', 'ec2:*', 'dynamodb:*'], resources: ['*'] },
    { sid: 'AllowManageOwnPasswordAndAccessKeys', effect: 'Allow', actions: ['iam:*AccessKey*', 'iam:ChangePassword', 'iam:GetUser'], resources: ['arn:aws:iam::*:user/${aws:username}'] },
    { sid: 'DenyS3Logs', effect: 'Deny', actions: ['s3:*'], resources: ['arn:aws:s3:::logs', 'arn:aws:s3:::logs/*'] },
  ])
  const zhang: Principal = {
    id: 'zhang',
    name: 'Zhang',
    kind: 'user',
    account: ACCT,
    userName: 'Zhang',
    identityPolicies: [
      pol('DelegatedUserPermissions', [
        { sid: 'IAM', effect: 'Allow', actions: ['iam:*'], resources: ['*'] },
        { sid: 'S3BucketContents', effect: 'Allow', actions: ['s3:ListBucket'], resources: ['arn:aws:s3:::ZhangBucket'] },
      ]),
    ],
    boundary: pol('DelegatedUserBoundary', [
      { sid: 'CreateOrChangeOnlyWithBoundary', effect: 'Allow', actions: ['iam:CreateUser', 'iam:PutUserPermissionsBoundary'], resources: ['*'], conditions: [{ op: 'StringEquals', key: 'iam:PermissionsBoundary', values: [X_BOUNDARY] }] },
      { sid: 'CloudWatchAndOtherIAMTasks', effect: 'Allow', actions: ['cloudwatch:*', 'iam:CreateAccessKey', 'iam:UpdateLoginProfile'], notResources: [`arn:aws:iam::${ACCT}:user/Maria`] },
      { sid: 'NoBoundaryUserDelete', effect: 'Deny', actions: ['iam:DeleteUserPermissionsBoundary'], resources: ['*'] },
    ]),
  }
  const nikhil: Principal = {
    id: 'nikhil',
    name: 'Nikhil',
    kind: 'user',
    account: ACCT,
    userName: 'Nikhil',
    identityPolicies: [pol('IAMFullAccess', [{ sid: 'All', effect: 'Allow', actions: ['iam:*'], resources: ['*'] }]), pol('AmazonS3ReadOnlyAccess', [{ sid: 'Read', effect: 'Allow', actions: ['s3:Get*', 's3:List*'], resources: ['*'] }])],
    boundary: xCompany,
  }
  const scenario: PolicyScenario = {
    principals: [zhang, nikhil],
    resources: [
      { id: 'newuser', arn: `arn:aws:iam::${ACCT}:user/Nikhil`, account: ACCT },
      { id: 'maria', arn: `arn:aws:iam::${ACCT}:user/Maria`, account: ACCT },
      { id: 'zbucket', arn: 'arn:aws:s3:::ZhangBucket', account: ACCT },
      { id: 'logs', arn: 'arn:aws:s3:::logs/a.txt', account: ACCT, policy: pol('LogsPolicy', [{ sid: 'NikhilPut', effect: 'Allow', principals: [{ aws: `arn:aws:iam::${ACCT}:user/Nikhil` }], actions: ['s3:PutObject'], resources: ['arn:aws:s3:::logs/*'] }]) },
      { id: 'secret', arn: `arn:aws:secretsmanager:us-east-1:${ACCT}:secret:app`, account: ACCT, policy: pol('SecretPolicy', [{ sid: 'Nikhil', effect: 'Allow', principals: [{ aws: `arn:aws:iam::${ACCT}:user/Nikhil` }], actions: ['secretsmanager:GetSecretValue'], resources: ['*'] }]) },
    ],
  }

  it('Zhang não cria usuário sem o boundary XCompanyBoundaries', () => {
    expect(evaluate(scenario, { principalId: 'zhang', action: 'iam:CreateUser', resourceId: 'newuser' }).reason).toBe('boundary-no-allow')
  })

  it('Zhang cria o usuário quando informa o boundary', () => {
    expect(evaluate(scenario, { principalId: 'zhang', action: 'iam:CreateUser', resourceId: 'newuser', context: { 'iam:PermissionsBoundary': X_BOUNDARY } }).decision).toBe('allow')
  })

  it('Zhang não mexe nas credenciais de María (NotResource) nem remove boundaries', () => {
    expect(evaluate(scenario, { principalId: 'zhang', action: 'iam:CreateAccessKey', resourceId: 'maria' }).decision).toBe('implicit-deny')
    expect(evaluate(scenario, { principalId: 'zhang', action: 'iam:DeleteUserPermissionsBoundary', resourceId: 'newuser' }).decision).toBe('explicit-deny')
  })

  it('Zhang não lista o próprio bucket: o boundary não inclui S3', () => {
    expect(evaluate(scenario, { principalId: 'zhang', action: 's3:ListBucket', resourceId: 'zbucket' }).reason).toBe('boundary-no-allow')
  })

  it('Nikhil: Deny do boundary vence a bucket policy; deny implícito do boundary não limita a política do segredo', () => {
    expect(evaluate(scenario, { principalId: 'nikhil', action: 's3:PutObject', resourceId: 'logs' }).decision).toBe('explicit-deny')
    expect(evaluate(scenario, { principalId: 'nikhil', action: 'secretsmanager:GetSecretValue', resourceId: 'secret' }).decision).toBe('allow')
  })

  it('Nikhil troca a própria senha, mas não cria usuários', () => {
    expect(evaluate(scenario, { principalId: 'nikhil', action: 'iam:ChangePassword', resourceId: 'newuser' }).decision).toBe('allow')
    expect(evaluate(scenario, { principalId: 'nikhil', action: 'iam:CreateUser', resourceId: 'maria' }).reason).toBe('boundary-no-allow')
  })
})

describe('política de recurso na mesma conta, por tipo de principal', () => {
  const ACCT = '111122223333'
  const session = (id: string, extra: Partial<Principal> = {}): Principal => ({
    id,
    name: id,
    kind: 'role-session',
    account: ACCT,
    roleName: 'Analista',
    sessionName: 'ana',
    identityPolicies: [],
    sessionPolicy: pol('SoLeitura', [{ sid: 'Ec2', effect: 'Allow', actions: ['ec2:Describe*'], resources: ['*'] }]),
    ...extra,
  })
  const bucket = (principal: string) => ({
    id: principal,
    arn: 'arn:aws:s3:::painel/a.csv',
    account: ACCT,
    policy: pol('BucketPolicy', [{ sid: 'Ler', effect: 'Allow', principals: [{ aws: principal }], actions: ['s3:GetObject'], resources: ['arn:aws:s3:::painel/*'] }]),
  })
  const scenario: PolicyScenario = {
    principals: [session('s')],
    resources: [bucket(`arn:aws:iam::${ACCT}:role/Analista`), bucket(`arn:aws:sts::${ACCT}:assumed-role/Analista/ana`), bucket(ACCT)],
  }

  it('concessão ao ARN da role: limitada pela session policy', () => {
    const r = evaluate(scenario, { principalId: 's', action: 's3:GetObject', resourceId: `arn:aws:iam::${ACCT}:role/Analista` })
    expect(r.reason).toBe('session-no-allow')
  })

  it('concessão ao ARN da sessão: não é limitada', () => {
    expect(evaluate(scenario, { principalId: 's', action: 's3:GetObject', resourceId: `arn:aws:sts::${ACCT}:assumed-role/Analista/ana` }).decision).toBe('allow')
  })

  it('concessão à conta: delegação, exige política de identidade', () => {
    expect(evaluate(scenario, { principalId: 's', action: 's3:GetObject', resourceId: ACCT }).reason).toBe('no-identity-allow')
  })
})

describe('trust policy e usuário raiz', () => {
  const ACCT = '111122223333'
  const ana: Principal = { id: 'ana', name: 'Ana', kind: 'user', account: ACCT, userName: 'ana', identityPolicies: [pol('Assume', [{ sid: 'A', effect: 'Allow', actions: ['sts:AssumeRole'], resources: ['*'] }])] }
  const bia: Principal = { id: 'bia', name: 'Bia', kind: 'user', account: ACCT, userName: 'bia', identityPolicies: [] }
  const root: Principal = { id: 'root', name: 'raiz', kind: 'root', account: ACCT }
  const trust = (principals: { aws: string }[]) => pol('Trust', [{ sid: 'T', effect: 'Allow', principals, actions: ['sts:AssumeRole'] }])
  const scenario: PolicyScenario = {
    principals: [ana, bia, root],
    resources: [
      { id: 'semAna', arn: `arn:aws:iam::${ACCT}:role/Admin`, account: ACCT, kind: 'trust', policy: trust([{ aws: `arn:aws:iam::${ACCT}:user/bia` }]) },
      { id: 'conta', arn: `arn:aws:iam::${ACCT}:role/Ops`, account: ACCT, kind: 'trust', policy: trust([{ aws: ACCT }]) },
      { id: 'bucket', arn: 'arn:aws:s3:::qualquer', account: ACCT },
    ],
  }

  it('política de identidade sozinha não basta para assumir a role', () => {
    expect(evaluate(scenario, { principalId: 'ana', action: 'sts:AssumeRole', resourceId: 'semAna' }).reason).toBe('resource-required')
  })

  it('trust policy que cita a usuária: basta, mesmo sem política de identidade', () => {
    expect(evaluate(scenario, { principalId: 'bia', action: 'sts:AssumeRole', resourceId: 'semAna' }).decision).toBe('allow')
  })

  it('trust policy que cita a conta: a usuária também precisa de permissão de identidade', () => {
    expect(evaluate(scenario, { principalId: 'ana', action: 'sts:AssumeRole', resourceId: 'conta' }).decision).toBe('allow')
    expect(evaluate(scenario, { principalId: 'bia', action: 'sts:AssumeRole', resourceId: 'conta' }).reason).toBe('no-identity-allow')
  })

  it('o root tem acesso total na conta avulsa', () => {
    expect(evaluate(scenario, { principalId: 'root', action: 's3:DeleteBucket', resourceId: 'bucket' }).decision).toBe('allow')
  })
})

describe('SCP, RCP e MFA', () => {
  const full = pol('FullAWSAccess', [{ sid: 'All', effect: 'Allow', actions: ['*'], resources: ['*'] }])
  const denyRegions = pol('NegarRegioes', [{ sid: 'ForaDeSA', effect: 'Deny', notActions: ['iam:*', 'sts:*'], resources: ['*'], conditions: [{ op: 'StringNotEquals', key: 'aws:RequestedRegion', values: ['sa-east-1'] }] }])
  const member: AccountDef = {
    id: '222222222222',
    name: 'Produção',
    orgId: 'o-exemplo',
    scps: [
      { id: 'root', name: 'Raiz', policies: [full] },
      { id: 'ou', name: 'OU Produção', policies: [full, denyRegions] },
      { id: 'acct', name: 'conta Produção', policies: [full] },
    ],
  }
  const mgmt: AccountDef = { id: '111111111111', name: 'Gerenciamento', orgId: 'o-exemplo', management: true, scps: member.scps }
  const onlyEc2: AccountDef = { ...member, id: '333333333333', name: 'Sandbox', scps: [{ id: 'root', name: 'Raiz', policies: [full] }, { id: 'acct', name: 'conta Sandbox', policies: [pol('SoEC2', [{ sid: 'Ec2', effect: 'Allow', actions: ['ec2:*'], resources: ['*'] }])] }] }
  const admin = pol('AdministratorAccess', [{ sid: 'All', effect: 'Allow', actions: ['*'], resources: ['*'] }])
  const scenario: PolicyScenario = {
    accounts: [member, mgmt, onlyEc2],
    principals: [
      { id: 'dev', name: 'Dev', kind: 'user', account: '222222222222', userName: 'dev', identityPolicies: [admin] },
      { id: 'root', name: 'raiz', kind: 'root', account: '222222222222' },
      { id: 'mgmt', name: 'Admin', kind: 'user', account: '111111111111', userName: 'admin', identityPolicies: [admin] },
      { id: 'sandbox', name: 'Sand', kind: 'user', account: '333333333333', userName: 'sand', identityPolicies: [admin] },
      { id: 'slr', name: 'AWSServiceRoleForX', kind: 'role-session', account: '222222222222', roleName: 'AWSServiceRoleForX', serviceLinked: true, identityPolicies: [admin] },
      {
        id: 'chave',
        name: 'Rui',
        kind: 'user',
        account: '111111111111',
        userName: 'rui',
        auth: { via: 'access-key', mfa: false },
        identityPolicies: [admin, pol('ExigirMFA', [{ sid: 'SemMfa', effect: 'Deny', actions: ['*'], resources: ['*'], conditions: [{ op: 'Bool', key: 'aws:MultiFactorAuthPresent', values: ['false'] }] }])],
      },
      {
        id: 'chave2',
        name: 'Rui',
        kind: 'user',
        account: '111111111111',
        userName: 'rui',
        auth: { via: 'access-key', mfa: false },
        identityPolicies: [admin, pol('ExigirMFA', [{ sid: 'SemMfa', effect: 'Deny', actions: ['*'], resources: ['*'], conditions: [{ op: 'Bool', ifExists: true, key: 'aws:MultiFactorAuthPresent', values: ['false'] }] }])],
      },
    ],
    resources: [
      { id: 'ec2-us', arn: 'arn:aws:ec2:us-east-1:222222222222:instance/i-1', account: '222222222222' },
      { id: 's3-sb', arn: 'arn:aws:s3:::sandbox', account: '333333333333' },
      { id: 's3-mgmt', arn: 'arn:aws:s3:::mgmt', account: '111111111111' },
    ],
  }

  it('Deny de Região na OU vence o AdministratorAccess, inclusive para o root da conta-membro', () => {
    expect(evaluate(scenario, { principalId: 'dev', action: 'ec2:RunInstances', resourceId: 'ec2-us', region: 'us-east-1' }).layer).toBe('scp')
    expect(evaluate(scenario, { principalId: 'root', action: 'ec2:RunInstances', resourceId: 'ec2-us', region: 'us-east-1' }).decision).toBe('explicit-deny')
    expect(evaluate(scenario, { principalId: 'dev', action: 'ec2:RunInstances', resourceId: 'ec2-us', region: 'sa-east-1' }).decision).toBe('allow')
  })

  it('SCP sem Allow num nível nega; SCP não afeta a conta de gerenciamento nem service-linked roles', () => {
    expect(evaluate(scenario, { principalId: 'sandbox', action: 's3:ListBucket', resourceId: 's3-sb' }).reason).toBe('scp-no-allow')
    expect(evaluate(scenario, { principalId: 'mgmt', action: 's3:ListBucket', resourceId: 's3-mgmt', region: 'us-east-1' }).decision).toBe('allow')
    expect(evaluate(scenario, { principalId: 'slr', action: 'ec2:RunInstances', resourceId: 'ec2-us', region: 'us-east-1' }).decision).toBe('allow')
  })

  it('MFA com chave de acesso: Bool não pega a requisição; BoolIfExists pega', () => {
    expect(evaluate(scenario, { principalId: 'chave', action: 's3:ListBucket', resourceId: 's3-mgmt' }).decision).toBe('allow')
    expect(evaluate(scenario, { principalId: 'chave2', action: 's3:ListBucket', resourceId: 's3-mgmt' }).decision).toBe('explicit-deny')
  })
})

describe('JSON', () => {
  it('gera o formato da AWS com Principal, Condition e IfExists', () => {
    const json = JSON.parse(
      policyToJson([
        { sid: 'T', effect: 'Allow', principals: [{ aws: '999988887777' }], actions: ['sts:AssumeRole'], conditions: [{ op: 'StringEquals', key: 'sts:ExternalId', values: ['abc'] }] },
        { sid: 'M', effect: 'Deny', notActions: ['iam:*'], resources: ['*'], conditions: [{ op: 'Bool', ifExists: true, key: 'aws:MultiFactorAuthPresent', values: ['false'] }] },
      ]),
    )
    expect(json.Version).toBe('2012-10-17')
    expect(json.Statement[0]).toEqual({ Sid: 'T', Effect: 'Allow', Principal: { AWS: '999988887777' }, Action: 'sts:AssumeRole', Condition: { StringEquals: { 'sts:ExternalId': 'abc' } } })
    expect(json.Statement[1].Condition).toEqual({ BoolIfExists: { 'aws:MultiFactorAuthPresent': 'false' } })
    expect(json.Statement[1].NotAction).toBe('iam:*')
  })
})
