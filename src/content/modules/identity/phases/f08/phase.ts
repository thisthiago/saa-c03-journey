/**
 * Fase 8 — Várias contas e guardrails. Organizations, SCPs na hierarquia,
 * RCPs, permissions boundaries e delegação, Control Tower e Access Analyzer.
 */
import type { PhaseDef } from '../../../../../engine/types'
import type { LayersLabConfig } from '../../../../../simulators/policy/layers'
import type { OrgLabConfig } from '../../../../../simulators/org/lab'
import { orgAccounts, type OrgNode } from '../../../../../simulators/org/model'
import type { Policy, PolicyScenario, PolicyStatement, Principal } from '../../../../../simulators/policy/model'
import { META } from '../meta'
import { ADMIN, DECISION_OPTIONS, exhibit, FULL_AWS_ACCESS, pol } from '../shared'

const ORG = 'o-horizonte'
const GESTAO = '111100001111'
const PAG = '222200002222'
const TESTES = '333300003333'

const NODES: OrgNode[] = [
  { id: 'raiz', name: 'Raiz', kind: 'root' },
  { id: 'gestao', name: 'Gestão', kind: 'account', parent: 'raiz', accountId: GESTAO, management: true },
  { id: 'prod', name: 'Produção', kind: 'ou', parent: 'raiz' },
  { id: 'pag', name: 'Pagamentos', kind: 'account', parent: 'prod', accountId: PAG },
  { id: 'sandbox', name: 'Sandbox', kind: 'ou', parent: 'raiz' },
  { id: 'testes', name: 'Testes', kind: 'account', parent: 'sandbox', accountId: TESTES },
]

const DENY_REGIONS: Policy = pol('NegarForaDeSaoPaulo', [
  { sid: 'ForaDeSA', effect: 'Deny', notActions: ['iam:*', 'sts:*', 'organizations:*', 'support:*'], resources: ['*'], conditions: [{ op: 'StringNotEquals', key: 'aws:RequestedRegion', values: ['sa-east-1'] }], note: 'Nega tudo fora de sa-east-1, exceto serviços globais (IAM, STS, Organizations e Support).' },
])
const DENY_LEAVE: Policy = pol('NaoSairDaOrganizacao', [{ sid: 'Ficar', effect: 'Deny', actions: ['organizations:LeaveOrganization'], resources: ['*'], note: 'Nenhuma conta sai da organização por conta própria.' }])
const ONLY_EC2_S3: Policy = pol('SoEC2eS3', [{ sid: 'Lista', effect: 'Allow', actions: ['ec2:*', 's3:*'], resources: ['*'], note: 'Permite só EC2 e S3 (lista de permissões, no lugar do FullAWSAccess).' }])
const PROTECT_TRAIL: Policy = pol('ProtegerCloudTrail', [{ sid: 'Trilhas', effect: 'Deny', actions: ['cloudtrail:StopLogging', 'cloudtrail:DeleteTrail'], resources: ['*'], note: 'Ninguém desliga nem apaga as trilhas de auditoria.' }])
const LIBRARY: Policy[] = [{ ...FULL_AWS_ACCESS, statements: [{ ...FULL_AWS_ACCESS.statements[0], note: 'Permite tudo. Vem anexada por padrão em todos os nós.' }] }, DENY_REGIONS, DENY_LEAVE, ONLY_EC2_S3, PROTECT_TRAIL]

const adminOf = (id: string, name: string, account: string): Principal => ({ id, name, kind: 'user', account, userName: id, identityPolicies: [ADMIN] })
const PRINCIPALS: Principal[] = [adminOf('adm-gestao', 'Admin da Gestão', GESTAO), adminOf('adm-pag', 'Admin de Pagamentos', PAG), adminOf('adm-testes', 'Admin de Testes', TESTES)]
const RESOURCES = [
  { id: 'ec2-pag', arn: `arn:aws:ec2:sa-east-1:${PAG}:instance/i-pag`, account: PAG },
  { id: 'trail-pag', arn: `arn:aws:cloudtrail:sa-east-1:${PAG}:trail/auditoria`, account: PAG },
  { id: 'trail-gestao', arn: `arn:aws:cloudtrail:sa-east-1:${GESTAO}:trail/auditoria`, account: GESTAO },
  { id: 's3-testes', arn: 'arn:aws:s3:::horizonte-testes', account: TESTES },
  { id: 'ddb-testes', arn: `arn:aws:dynamodb:sa-east-1:${TESTES}:table/rascunhos`, account: TESTES },
  { id: 'org-testes', arn: `arn:aws:organizations::${GESTAO}:organization/${ORG}`, account: TESTES, label: 'organização (pedido feito pela conta Testes)' },
]

const ALL_FULL = { raiz: ['FullAWSAccess'], gestao: ['FullAWSAccess'], prod: ['FullAWSAccess'], pag: ['FullAWSAccess'], sandbox: ['FullAWSAccess'], testes: ['FullAWSAccess'] }

const ORG_LAB: OrgLabConfig = {
  orgId: ORG,
  nodes: NODES,
  library: LIBRARY,
  initial: ALL_FULL,
  scenario: { principals: PRINCIPALS, resources: RESOURCES },
  requests: [
    { id: 'ec2-sa', label: 'lançar EC2 em sa-east-1', action: 'ec2:RunInstances', resourceId: 'ec2-pag', region: 'sa-east-1' },
    { id: 'ec2-us', label: 'lançar EC2 em us-east-1', action: 'ec2:RunInstances', resourceId: 'ec2-pag', region: 'us-east-1' },
    { id: 'stop', label: 'desligar a trilha do CloudTrail', action: 'cloudtrail:StopLogging', resourceId: 'trail-pag', region: 'sa-east-1' },
    { id: 'stop-gestao', label: 'desligar a trilha do CloudTrail', action: 'cloudtrail:StopLogging', resourceId: 'trail-gestao', region: 'sa-east-1' },
    { id: 's3', label: 'listar um bucket', action: 's3:ListBucket', resourceId: 's3-testes', region: 'us-east-1' },
    { id: 'ddb', label: 'criar uma tabela DynamoDB', action: 'dynamodb:CreateTable', resourceId: 'ddb-testes', region: 'sa-east-1' },
    { id: 'leave', label: 'sair da organização', action: 'organizations:LeaveOrganization', resourceId: 'org-testes' },
  ],
  goals: [
    { principalId: 'adm-pag', requestId: 'ec2-sa', expect: 'allow', why: 'Produção roda em São Paulo.', concepts: ['org.scp-inheritance'] },
    { principalId: 'adm-pag', requestId: 'ec2-us', expect: 'deny', why: 'Regra da diretoria: Produção só em sa-east-1.', concepts: ['org.scp-inheritance', 'org.scp'] },
    { principalId: 'adm-pag', requestId: 'stop', expect: 'deny', why: 'Nenhuma conta-membro desliga a auditoria, nem com AdministratorAccess.', concepts: ['org.scp'] },
    { principalId: 'adm-testes', requestId: 's3', expect: 'allow', why: 'O Sandbox pode usar S3 em qualquer Região.', concepts: ['org.scp-inheritance'] },
    { principalId: 'adm-testes', requestId: 'ddb', expect: 'deny', why: 'No Sandbox, só EC2 e S3.', concepts: ['org.scp-inheritance'] },
    { principalId: 'adm-testes', requestId: 'leave', expect: 'deny', why: 'Nenhuma conta sai da organização.', concepts: ['org.scp'] },
    { principalId: 'adm-gestao', requestId: 'stop-gestao', expect: 'allow', why: 'SCPs não afetam a conta de gerenciamento: proteja-a com acesso mínimo e monitoramento.', concepts: ['org.scp'] },
  ],
  solution: {
    attached: {
      raiz: ['FullAWSAccess', 'NaoSairDaOrganizacao', 'ProtegerCloudTrail'],
      gestao: ['FullAWSAccess'],
      prod: ['FullAWSAccess', 'NegarForaDeSaoPaulo'],
      pag: ['FullAWSAccess'],
      sandbox: ['SoEC2eS3'],
      testes: ['FullAWSAccess'],
    },
  },
}

const scenarioWith = (attached: Record<string, string[]>, extra: Partial<PolicyScenario> = {}): PolicyScenario => ({
  accounts: orgAccounts(ORG, NODES, LIBRARY, attached),
  principals: [...PRINCIPALS, { id: 'root-pag', name: 'usuário raiz de Pagamentos', kind: 'root', account: PAG }, ...(extra.principals ?? [])],
  resources: [...RESOURCES, ...(extra.resources ?? [])],
})

const OU_WITHOUT_FULL = scenarioWith({ ...ALL_FULL, prod: ['NegarForaDeSaoPaulo'] })
const WITH_REGIONS = scenarioWith({ ...ALL_FULL, prod: ['FullAWSAccess', 'NegarForaDeSaoPaulo'] })

// ---------------------------------------------------------------------------
// RCP — perímetro de dados

const PARCEIRO = '999900009999'
const RCP_PERIMETER: PolicyStatement = {
  sid: 'SoDaOrganizacao',
  effect: 'Deny',
  principals: ['*'],
  actions: ['s3:*'],
  resources: ['*'],
  conditions: [
    { op: 'StringNotEquals', ifExists: true, key: 'aws:PrincipalOrgID', values: [ORG] },
    { op: 'Bool', ifExists: true, key: 'aws:PrincipalIsAWSService', values: ['false'] },
  ],
}
const BUCKET_GRANT: PolicyStatement = { sid: 'Parceiro', effect: 'Allow', principals: [{ aws: PARCEIRO }], actions: ['s3:GetObject'], resources: ['arn:aws:s3:::horizonte-relatorios/*'] }
const RCP_SCENARIO: PolicyScenario = {
  accounts: [
    {
      id: PAG,
      name: 'Pagamentos',
      orgId: ORG,
      scps: [{ id: 'raiz', name: 'a raiz', policies: [FULL_AWS_ACCESS] }],
      rcps: [{ id: 'raiz', name: 'a raiz', policies: [pol('RCPFullAWSAccess', [{ sid: 'Tudo', effect: 'Allow', principals: ['*'], actions: ['*'], resources: ['*'] }]), pol('PerimetroDeDados', [RCP_PERIMETER])] }],
    },
  ],
  principals: [{ id: 'parceiro', name: 'role do parceiro', kind: 'role-session', account: PARCEIRO, roleName: 'leitor', sessionName: 'x', identityPolicies: [pol('LerTudo', [{ sid: 'S3', effect: 'Allow', actions: ['s3:GetObject'], resources: ['*'] }])] }],
  resources: [{ id: 'rel', arn: 'arn:aws:s3:::horizonte-relatorios/2026/q3.pdf', account: PAG, label: 'relatório', policy: pol('BucketPolicy', [BUCKET_GRANT]) }],
}

// ---------------------------------------------------------------------------
// Missão 4 — delegação com boundary

const LIMIT_ARN = `arn:aws:iam::${PAG}:policy/LimiteDosTimes`
const LIMITE: Policy = pol('LimiteDosTimes', [{ sid: 'Servicos', effect: 'Allow', actions: ['s3:*', 'dynamodb:*', 'lambda:*', 'logs:*'], resources: ['*'] }])

const DELEGATION_LAB: LayersLabConfig = {
  scenario: {
    principals: [
      { id: 'lider', name: 'lider.pagamentos', description: 'líder técnica que vai criar usuários do time', kind: 'user', account: PAG, userName: 'lider.pagamentos', identityPolicies: [] },
      { id: 'dev', name: 'dev.novo', description: 'criado com AdministratorAccess e o boundary LimiteDosTimes', kind: 'user', account: PAG, userName: 'dev.novo', identityPolicies: [ADMIN], boundary: LIMITE },
    ],
    resources: [
      { id: 'user', arn: `arn:aws:iam::${PAG}:user/dev.novo`, account: PAG, label: 'usuário dev.novo' },
      { id: 'limite', arn: LIMIT_ARN, account: PAG, label: 'política LimiteDosTimes' },
      { id: 'tabela', arn: `arn:aws:dynamodb:sa-east-1:${PAG}:table/cobrancas`, account: PAG, label: 'tabela cobrancas' },
      { id: 'trilha', arn: `arn:aws:cloudtrail:sa-east-1:${PAG}:trail/auditoria`, account: PAG, label: 'trilha auditoria' },
    ],
  },
  libraries: [
    {
      id: 'lider',
      title: 'Política de identidade da lider.pagamentos',
      policyName: 'LiderPolicy',
      target: { type: 'identity', principalId: 'lider' },
      statements: [
        { sid: 'IAMTudo', effect: 'Allow', actions: ['iam:*'], resources: ['*'], note: 'Simples, mas a líder poderia criar usuários sem limite nenhum.' },
        { sid: 'CriarSoComLimite', effect: 'Allow', actions: ['iam:CreateUser', 'iam:AttachUserPolicy', 'iam:PutUserPermissionsBoundary'], resources: ['*'], conditions: [{ op: 'StringEquals', key: 'iam:PermissionsBoundary', values: [LIMIT_ARN] }] },
        { sid: 'CriarLivre', effect: 'Allow', actions: ['iam:CreateUser', 'iam:AttachUserPolicy'], resources: ['*'] },
        { sid: 'NaoMexerNoLimite', effect: 'Deny', actions: ['iam:DeleteUserPermissionsBoundary', 'iam:CreatePolicyVersion', 'iam:DeletePolicy'], resources: ['*'], note: 'Ninguém remove boundaries nem altera a política que serve de limite.' },
      ],
      initial: ['IAMTudo'],
    },
  ],
  rows: ['lider', 'dev'],
  requests: [
    { id: 'criar-com', label: 'Criar usuário com o boundary', action: 'iam:CreateUser', resourceId: 'user', context: { 'iam:PermissionsBoundary': LIMIT_ARN } },
    { id: 'criar-sem', label: 'Criar usuário sem boundary', action: 'iam:CreateUser', resourceId: 'user' },
    { id: 'tirar', label: 'Remover o boundary de um usuário', action: 'iam:DeleteUserPermissionsBoundary', resourceId: 'user' },
    { id: 'editar', label: 'Editar a política LimiteDosTimes', action: 'iam:CreatePolicyVersion', resourceId: 'limite' },
    { id: 'tabela', label: 'Gravar na tabela cobrancas', action: 'dynamodb:PutItem', resourceId: 'tabela' },
    { id: 'trilha', label: 'Apagar a trilha de auditoria', action: 'cloudtrail:DeleteTrail', resourceId: 'trilha' },
  ],
  goals: [
    { principalId: 'lider', requestId: 'criar-com', expect: 'allow', why: 'A líder cria usuários do time, sempre com o boundary.', concepts: ['iam.boundary-delegation'] },
    { principalId: 'lider', requestId: 'criar-sem', expect: 'deny', why: 'Sem o boundary, o usuário criado poderia ter mais poder que o permitido.', concepts: ['iam.boundary-delegation'] },
    { principalId: 'lider', requestId: 'tirar', expect: 'deny', why: 'Remover o boundary desfaria a delegação.', concepts: ['iam.boundary-delegation'] },
    { principalId: 'lider', requestId: 'editar', expect: 'deny', why: 'Alterar a política de limite também desfaria a delegação.', concepts: ['iam.boundary-delegation'] },
    { principalId: 'dev', requestId: 'tabela', expect: 'allow', why: 'O boundary permite DynamoDB, e a identidade também.', concepts: ['iam.permissions-boundary'] },
    { principalId: 'dev', requestId: 'trilha', expect: 'deny', why: 'Mesmo com AdministratorAccess, o boundary não inclui CloudTrail.', concepts: ['iam.permissions-boundary'] },
  ],
  solution: { active: { lider: ['CriarSoComLimite', 'NaoMexerNoLimite'] } },
}

export const F08_IAM: PhaseDef = {
  ...META.f08,
  concepts: [
    'org.organizations',
    'org.scp',
    'org.scp-inheritance',
    'org.rcp',
    'iam.permissions-boundary',
    'iam.boundary-delegation',
    'org.control-tower',
    'org.root-access-central',
    'iaa.external-access',
    'iaa.unused-access',
    'iaa.policy-checks',
    'iam.service-linked-role',
  ],
  availability: 'available',
  simplifications: ['A organização é pequena e fictícia; os IDs de conta e de organização são exemplos.', 'Controles do Control Tower e analisadores do Access Analyzer aparecem em atividades de decisão, sem simulação.'],
  missions: [
    // -----------------------------------------------------------------------
    {
      id: 'iax.f08.m1',
      title: 'Organizations',
      type: 'mission',
      summary: 'Raiz, OUs, conta de gerenciamento e contas-membro.',
      briefing: {
        company: 'Grupo Horizonte',
        role: 'Você é a arquiteta de nuvem de um grupo com várias empresas.',
        situation: 'Cada empresa do grupo tem a própria conta AWS, criada por quem quis, com e-mails pessoais e cartões diferentes. A diretoria quer governar tudo num lugar só.',
        objective: 'Organizar as contas numa organização e proteger o root das contas-membro.',
        successCriteria: ['Entender a estrutura de uma organização', 'Saber o papel da conta de gerenciamento', 'Centralizar o acesso root'],
      },
      intel: [
        { conceptId: 'org.organizations', visual: 'org-tree', body: ['Uma **organização** tem uma **conta de gerenciamento** e **contas-membro**, agrupadas em **OUs** abaixo da **raiz**. Políticas anexadas a um nó valem para tudo abaixo dele. SCPs e RCPs exigem o modo **all features**.'] },
        { conceptId: 'org.root-access-central', body: ['Com o **acesso root centralizado**, a conta de gerenciamento (ou o administrador delegado do IAM) **remove as credenciais root** das contas-membro e executa, quando preciso, as tarefas que exigem o root.'] },
      ],
      activities: [
        {
          id: 'iax.f08.m1.a1',
          kind: 'match',
          title: 'As peças da organização',
          prompt: 'Associe cada peça à descrição.',
          concepts: [{ id: 'org.organizations' }],
          xp: 50,
          difficulty: 1,
          explanation: ['A hierarquia (raiz, OUs e contas) é o que permite aplicar uma política uma vez e atingir muitas contas.'],
          leftLabel: 'Peça',
          rightLabel: 'Descrição',
          pairs: [
            { id: 'mgmt', left: 'Conta de gerenciamento', right: 'Cria e administra a organização; SCPs não a afetam', explanation: 'Por isso ela deve ter o mínimo de cargas e de pessoas.' },
            { id: 'member', left: 'Conta-membro', right: 'Conta da organização que recebe os efeitos das SCPs', explanation: 'Inclusive o root dela.' },
            { id: 'ou', left: 'OU', right: 'Agrupa contas para aplicar políticas de uma vez', explanation: 'OUs podem conter outras OUs.' },
            { id: 'root', left: 'Raiz', right: 'Topo da hierarquia: o que é anexado aqui vale para todas as contas', explanation: 'Bom lugar para guardrails universais.' },
            { id: 'all', left: 'All features', right: 'Modo da organização exigido para usar SCPs e RCPs', explanation: 'Só cobrança consolidada não basta.' },
          ],
        },
        {
          id: 'iax.f08.m1.a2',
          kind: 'decision',
          title: 'O root das contas-membro',
          prompt: 'O grupo tem 40 contas-membro, cada uma com um usuário raiz e senha guardada em lugares diferentes. Qual é a melhor medida?',
          concepts: [{ id: 'org.root-access-central' }],
          xp: 40,
          difficulty: 2,
          explanation: ['O acesso root centralizado remove as credenciais root das contas-membro; tarefas privilegiadas passam a ser feitas a partir da conta de gerenciamento ou do administrador delegado.'],
          options: [
            { id: 'a', text: 'Centralizar o acesso root e remover as credenciais root das contas-membro', correct: true, consequence: '40 senhas de acesso total deixam de existir.', impacts: { seguranca: 2 } },
            { id: 'b', text: 'Guardar as 40 senhas num cofre compartilhado', correct: false, consequence: 'As credenciais continuam existindo, e o cofre vira alvo.' },
            { id: 'c', text: 'Criar uma chave de acesso do root em cada conta para automação', correct: false, consequence: 'Chaves de root são justamente o que se deve evitar.' },
          ],
        },
      ],
      debrief: { takeaways: ['Organização: raiz, OUs, conta de gerenciamento e contas-membro.', 'SCPs e RCPs exigem all features.', 'Centralize o root das contas-membro.'] },
    },
    // -----------------------------------------------------------------------
    {
      id: 'iax.f08.m2',
      title: 'SCPs na hierarquia',
      type: 'mission',
      summary: 'Guardrails que nem o administrador da conta ultrapassa.',
      briefing: {
        company: 'Grupo Horizonte',
        role: 'Você vai escrever os guardrails da organização.',
        situation: 'A diretoria definiu: Produção só em São Paulo; o Sandbox só usa EC2 e S3; nenhuma conta sai da organização nem desliga a auditoria.',
        objective: 'Anexar as SCPs certas nos lugares certos.',
        successCriteria: ['Cumprir as quatro regras', 'Manter o que é permitido funcionando', 'Entender o caso da conta de gerenciamento'],
      },
      intel: [
        { conceptId: 'org.scp', body: ['A **SCP** limita o que os principais das contas-membro podem fazer, **inclusive o root**. Ela **não concede** nada. Não afeta a **conta de gerenciamento** nem **service-linked roles**. A **FullAWSAccess** vem anexada por padrão.'] },
        { conceptId: 'org.scp-inheritance', body: ['Cada nível do caminho (raiz, OUs, conta) precisa de **Allow**; um **Deny** em qualquer nível vence. Trocar o FullAWSAccess de uma OU por uma lista de permissões restringe tudo abaixo dela.'] },
      ],
      activities: [
        {
          id: 'iax.f08.m2.a1',
          kind: 'lab',
          lab: 'org',
          title: 'Guardrails do Grupo Horizonte',
          prompt: 'Anexe e desanexe SCPs na raiz, nas OUs e nas contas. Cada conta tem um administrador com AdministratorAccess.',
          concepts: [{ id: 'org.scp' }, { id: 'org.scp-inheritance' }],
          xp: 160,
          difficulty: 3,
          hints: ['Regras que valem para todas as contas ficam na raiz.', 'Para "só EC2 e S3", a OU Sandbox precisa de uma lista de permissões no lugar do FullAWSAccess.'],
          explanation: ['Solução: na raiz, FullAWSAccess, NaoSairDaOrganizacao e ProtegerCloudTrail; na OU Produção, FullAWSAccess e NegarForaDeSaoPaulo; na OU Sandbox, só SoEC2eS3; nas contas, FullAWSAccess.', 'O administrador da Gestão continua conseguindo desligar a trilha: SCPs não afetam a conta de gerenciamento.'],
          config: ORG_LAB,
        },
        {
          id: 'iax.f08.m2.a2',
          kind: 'predict',
          title: 'Sem FullAWSAccess na OU',
          prompt: 'Alguém tirou o FullAWSAccess da OU Produção e deixou lá só a NegarForaDeSaoPaulo. O admin de Pagamentos, com AdministratorAccess, lança uma instância em **sa-east-1**. O que acontece?',
          concepts: [{ id: 'org.scp-inheritance' }],
          xp: 40,
          difficulty: 3,
          exhibits: [exhibit('SCP NegarForaDeSaoPaulo (única na OU Produção)', DENY_REGIONS.statements)],
          explanation: ['Uma SCP com só um Deny não dá Allow a nada. Sem nenhum Allow no nível da OU, a ação é negada, mesmo dentro de sa-east-1.'],
          spec: { sim: 'policy', scenario: OU_WITHOUT_FULL, request: { principalId: 'adm-pag', action: 'ec2:RunInstances', resourceId: 'ec2-pag', region: 'sa-east-1' } },
          options: DECISION_OPTIONS,
        },
        {
          id: 'iax.f08.m2.a3',
          kind: 'predict',
          title: 'O root da conta-membro',
          prompt: 'Com a NegarForaDeSaoPaulo na OU Produção (junto do FullAWSAccess), o **usuário raiz** da conta Pagamentos lança uma instância em **us-east-1**. O que acontece?',
          concepts: [{ id: 'org.scp' }],
          xp: 40,
          difficulty: 2,
          explanation: ['SCPs afetam o usuário raiz das contas-membro: o Deny da Região vale para ele também.'],
          spec: { sim: 'policy', scenario: WITH_REGIONS, request: { principalId: 'root-pag', action: 'ec2:RunInstances', resourceId: 'ec2-pag', region: 'us-east-1' } },
          options: DECISION_OPTIONS,
        },
        {
          id: 'iax.f08.m2.a4',
          kind: 'decision',
          title: 'A SCP dá acesso?',
          prompt: 'Um usuário novo da conta Testes, **sem nenhuma política IAM**, está numa conta cuja SCP é FullAWSAccess. Ele consegue listar buckets?',
          concepts: [{ id: 'org.scp' }],
          xp: 30,
          difficulty: 1,
          explanation: ['SCP só limita. Sem política IAM que permita, o usuário não faz nada.'],
          options: [
            { id: 'a', text: 'Não: a SCP não concede; ele ainda precisa de uma política IAM', correct: true, consequence: 'O acesso efetivo é a interseção entre SCP e IAM.' },
            { id: 'b', text: 'Sim: FullAWSAccess permite tudo', correct: false, consequence: 'FullAWSAccess só define o máximo; não concede.' },
          ],
        },
      ],
      debrief: { takeaways: ['SCP limita, não concede, e afeta até o root das contas-membro.', 'Allow em todos os níveis; Deny em qualquer nível vence.', 'A conta de gerenciamento fica fora das SCPs.'] },
    },
    // -----------------------------------------------------------------------
    {
      id: 'iax.f08.m3',
      title: 'SCP, RCP e boundary',
      type: 'mission',
      summary: 'Três limites diferentes: conta, recurso e identidade.',
      briefing: {
        company: 'Grupo Horizonte',
        role: 'Você explica para o comitê de segurança qual limite usar em cada caso.',
        situation: 'O comitê quer impedir que dados saiam da organização, limitar o que cada time cria e definir o máximo de cada conta.',
        objective: 'Saber o que cada tipo de limite alcança.',
        successCriteria: ['Distinguir SCP, RCP e boundary', 'Prever o efeito de uma RCP de perímetro'],
      },
      intel: [
        { conceptId: 'org.rcp', body: ['A **RCP** limita o acesso aos **recursos** das contas-membro, **venha de quem vier**, inclusive de fora da organização. Uma RCP pode, por exemplo, negar acesso aos buckets a quem não é da organização, mesmo que uma bucket policy conceda.'] },
        { conceptId: 'iam.permissions-boundary', visual: 'permission-layers', body: ['O **permissions boundary** define o máximo de **um usuário ou role** (nunca de um grupo). A permissão efetiva é a **interseção** entre identidade e boundary.'] },
      ],
      activities: [
        {
          id: 'iax.f08.m3.a1',
          kind: 'classify',
          title: 'Qual limite?',
          prompt: 'Classifique cada característica.',
          concepts: [{ id: 'org.rcp' }, { id: 'org.scp' }, { id: 'iam.permissions-boundary' }],
          xp: 50,
          difficulty: 3,
          explanation: ['SCP: principais da conta. RCP: recursos da conta. Boundary: uma identidade. Nenhum dos três concede.'],
          bins: [
            { id: 'scp', label: 'SCP' },
            { id: 'rcp', label: 'RCP' },
            { id: 'pb', label: 'Permissions boundary' },
          ],
          items: [
            { id: 'members', text: 'Limita o que os usuários e roles de uma conta-membro fazem, inclusive o root', bin: 'scp', explanation: 'É o alcance da SCP.', concepts: ['org.scp'] },
            { id: 'outsiders', text: 'Limita o acesso aos buckets da organização mesmo para quem vem de fora dela', bin: 'rcp', explanation: 'RCPs valem para os recursos, venha de quem vier.', concepts: ['org.rcp'] },
            { id: 'one', text: 'Define o máximo de uma única role', bin: 'pb', explanation: 'Boundaries são por usuário ou role.', concepts: ['iam.permissions-boundary'] },
            { id: 'rcpfull', text: 'Tem uma política padrão que não pode ser desanexada', bin: 'rcp', explanation: 'A RCPFullAWSAccess fica sempre anexada.', concepts: ['org.rcp'] },
            { id: 'notgroup', text: 'Não pode ser aplicado a um grupo', bin: 'pb', explanation: 'Boundaries são de usuários e roles.', concepts: ['iam.permissions-boundary'] },
          ],
        },
        {
          id: 'iax.f08.m3.a2',
          kind: 'predict',
          title: 'O perímetro de dados',
          prompt: 'A bucket policy de horizonte-relatorios concede leitura a uma conta parceira, **de fora da organização**. Na raiz da organização há a RCP abaixo. A role do parceiro (que tem política para ler) pede um relatório. O que acontece?',
          concepts: [{ id: 'org.rcp' }],
          xp: 40,
          difficulty: 3,
          exhibits: [exhibit('Bucket policy de horizonte-relatorios', [BUCKET_GRANT]), exhibit('RCP PerimetroDeDados (na raiz)', [RCP_PERIMETER])],
          explanation: ['A RCP vale para o recurso, mesmo com quem vem de fora. O parceiro não tem aws:PrincipalOrgID da organização: o Deny se aplica e vence a concessão da bucket policy.'],
          spec: { sim: 'policy', scenario: RCP_SCENARIO, request: { principalId: 'parceiro', action: 's3:GetObject', resourceId: 'rel' } },
          options: DECISION_OPTIONS,
        },
      ],
      debrief: { takeaways: ['SCP: o máximo dos principais da conta. RCP: o máximo dos recursos. Boundary: o máximo de uma identidade.', 'RCP consegue barrar quem vem de fora da organização.'] },
    },
    // -----------------------------------------------------------------------
    {
      id: 'iax.f08.m4',
      title: 'Delegar sem perder o controle',
      type: 'mission',
      summary: 'Permitir que um time crie usuários, sempre dentro de um limite.',
      briefing: {
        company: 'Grupo Horizonte',
        role: 'Você vai descentralizar a criação de usuários na conta Pagamentos.',
        situation: 'Todo pedido de acesso passa pela equipe central e leva dias. A líder do time quer criar os usuários do próprio time, mas sem poder dar a eles acesso à auditoria.',
        objective: 'Deixar a líder criar usuários só com o boundary do time.',
        successCriteria: ['Criar com o boundary funciona; sem ele, não', 'Ninguém remove nem altera o boundary', 'O usuário criado fica dentro do limite'],
      },
      intel: [{ conceptId: 'iam.boundary-delegation', body: ['Para delegar, permita `iam:CreateUser` (e afins) **só** com a condição `iam:PermissionsBoundary` igual ao ARN do limite, e negue remover boundaries ou criar versões da política de limite. Esse é o padrão do exemplo da documentação da AWS.'] }],
      activities: [
        {
          id: 'iax.f08.m4.a1',
          kind: 'lab',
          lab: 'policy-layers',
          title: 'A política da líder',
          prompt: 'Escolha os statements da política da líder. A linha do dev.novo mostra o boundary em ação.',
          concepts: [{ id: 'iam.boundary-delegation' }, { id: 'iam.permissions-boundary' }],
          xp: 160,
          difficulty: 3,
          hints: ['`iam:*` resolve o pedido da líder e todos os outros também.', 'Um Deny explícito protege o próprio limite.'],
          explanation: ['Solução: `CriarSoComLimite` e `NaoMexerNoLimite`. A condição iam:PermissionsBoundary só existe quando a chamada informa o boundary: sem ele, a criação é negada.'],
          config: DELEGATION_LAB,
        },
        {
          id: 'iax.f08.m4.a2',
          kind: 'decision',
          title: 'Boundary num grupo?',
          prompt: 'A equipe quer aplicar o boundary ao grupo **Pagamentos** para limitar todos os membros de uma vez. Funciona?',
          concepts: [{ id: 'iam.permissions-boundary' }],
          xp: 30,
          difficulty: 2,
          explanation: ['Permissions boundaries são aplicados a usuários e roles, não a grupos.'],
          options: [
            { id: 'a', text: 'Não: boundaries são aplicados a usuários e roles, um por um', correct: true, consequence: 'A delegação com iam:PermissionsBoundary garante que todo usuário novo já nasça com o limite.' },
            { id: 'b', text: 'Sim: o boundary do grupo vale para todos os membros', correct: false, consequence: 'Grupos não recebem boundary.' },
          ],
        },
      ],
      debrief: { takeaways: ['Delegação: criar só com iam:PermissionsBoundary e proteger o limite com Deny.', 'Boundary é por usuário ou role.'] },
    },
    // -----------------------------------------------------------------------
    {
      id: 'iax.f08.m5',
      title: 'Control Tower e Access Analyzer',
      type: 'mission',
      summary: 'Landing zone com controles e a busca por acesso indevido.',
      briefing: {
        company: 'Grupo Horizonte',
        role: 'Você automatiza a governança do grupo.',
        situation: 'Novas empresas entram no grupo todo trimestre. A diretoria quer contas criadas no padrão, regras aplicadas sozinhas e um alerta quando algo ficar acessível de fora.',
        objective: 'Escolher os controles e as análises certas.',
        successCriteria: ['Classificar os tipos de controle', 'Escolher o recurso do Access Analyzer para cada pergunta'],
      },
      intel: [
        { conceptId: 'org.control-tower', body: ['O **Control Tower** monta a **landing zone** (Organizations, IAM Identity Center e Account Factory) e aplica **controles** por OU: **preventivos** (SCPs e RCPs), **detectivos** (regras do AWS Config) e **proativos** (hooks do CloudFormation, antes de criar recursos).'] },
        { conceptId: 'iaa.external-access', body: ['O **Access Analyzer** aponta recursos acessíveis **de fora da zona de confiança** (a conta ou a organização). Cada analisador vale para uma Região.'] },
        { conceptId: 'iaa.unused-access', body: ['O analisador de **acesso não usado** encontra roles, chaves e permissões que ninguém usa (recurso pago). O de **acesso interno** mostra quem, dentro da organização, alcança recursos críticos.'] },
        { conceptId: 'iaa.policy-checks', body: ['O Access Analyzer também **valida** políticas (mais de 100 verificações) e **gera** políticas a partir da atividade no **CloudTrail**.'] },
      ],
      activities: [
        {
          id: 'iax.f08.m5.a1',
          kind: 'classify',
          title: 'Que tipo de controle?',
          prompt: 'Classifique cada controle do Control Tower.',
          concepts: [{ id: 'org.control-tower' }],
          xp: 50,
          difficulty: 2,
          explanation: ['Preventivo impede a ação; detectivo aponta o que já está fora da regra; proativo barra o recurso antes de ele ser criado por um template.'],
          bins: [
            { id: 'prev', label: 'Preventivo (SCP ou RCP)' },
            { id: 'det', label: 'Detectivo (AWS Config)' },
            { id: 'pro', label: 'Proativo (hook do CloudFormation)' },
          ],
          items: [
            { id: 'trail', text: 'Impedir mudanças na trilha do CloudTrail da landing zone', bin: 'prev', explanation: 'A ação é negada antes de acontecer.' },
            { id: 'ebs', text: 'Apontar volumes EBS sem criptografia já anexados a instâncias', bin: 'det', explanation: 'Detecta o que já existe fora da regra.' },
            { id: 'cfn', text: 'Recusar um template que cria um bucket sem criptografia, antes de criar', bin: 'pro', explanation: 'Confere o recurso antes do provisionamento.' },
            { id: 'public', text: 'Indicar buckets com leitura pública', bin: 'det', explanation: 'Um controle detectivo avalia a configuração atual.' },
          ],
        },
        {
          id: 'iax.f08.m5.a2',
          kind: 'classify',
          title: 'Qual recurso do Access Analyzer?',
          prompt: 'Para cada pergunta, qual recurso do IAM Access Analyzer responde?',
          concepts: [{ id: 'iaa.external-access' }, { id: 'iaa.unused-access' }, { id: 'iaa.policy-checks' }],
          xp: 50,
          difficulty: 2,
          explanation: ['Acesso externo, acesso não usado, validação e geração respondem perguntas diferentes.'],
          bins: [
            { id: 'ext', label: 'Acesso externo' },
            { id: 'unused', label: 'Acesso não usado' },
            { id: 'validate', label: 'Validação de políticas' },
            { id: 'gen', label: 'Geração de políticas' },
          ],
          items: [
            { id: 'bucket', text: 'Algum bucket ou role da organização é acessível por contas de fora?', bin: 'ext', explanation: 'É o analisador de acesso externo, com a organização como zona de confiança.', concepts: ['iaa.external-access'] },
            { id: 'roles', text: 'Quais roles e chaves de acesso não são usadas há meses?', bin: 'unused', explanation: 'O analisador de acesso não usado.', concepts: ['iaa.unused-access'] },
            { id: 'lint', text: 'Esta política tem erros ou permissões arriscadas antes de ser salva?', bin: 'validate', explanation: 'A validação faz mais de 100 verificações.', concepts: ['iaa.policy-checks'] },
            { id: 'min', text: 'Qual a política mínima para o que esta role fez nos últimos 90 dias?', bin: 'gen', explanation: 'A geração usa a atividade registrada no CloudTrail.', concepts: ['iaa.policy-checks'] },
          ],
        },
        {
          id: 'iax.f08.m5.a3',
          kind: 'decision',
          title: 'Controle obrigatório',
          prompt: 'Um time pede para desativar um controle **obrigatório** do Control Tower na OU dele. O que acontece?',
          concepts: [{ id: 'org.control-tower' }],
          xp: 30,
          difficulty: 2,
          explanation: ['Controles obrigatórios estão sempre aplicados e não podem ser mudados; fortemente recomendados e eletivos podem ser ligados ou desligados.'],
          options: [
            { id: 'a', text: 'Não é possível: controles obrigatórios estão sempre aplicados', correct: true, consequence: 'O time precisa trabalhar dentro do controle.' },
            { id: 'b', text: 'Basta desativar no console da OU', correct: false, consequence: 'Isso vale para eletivos e fortemente recomendados.' },
          ],
        },
      ],
      debrief: { takeaways: ['Control Tower: landing zone e controles preventivos, detectivos e proativos.', 'Access Analyzer: acesso externo, interno e não usado; valida e gera políticas.'] },
    },
    // -----------------------------------------------------------------------
    {
      id: 'iax.f08.boss',
      title: 'Chefe: Fusão de empresas',
      type: 'boss',
      summary: 'Uma empresa comprada entra na organização, e os guardrails precisam acompanhar.',
      passThreshold: 0.7,
      bonusXp: 120,
      briefing: {
        company: 'Grupo Horizonte',
        role: 'Você conduz a entrada de uma empresa comprada.',
        situation: 'A conta da empresa comprada foi convidada para a organização. Antes de liberá-la, a diretoria quer garantir as regras de sempre e entender o que muda para os administradores dela.',
        objective: 'Aplicar os guardrails e prever os efeitos.',
        successCriteria: ['Guardrails corretos na organização', 'Prever o efeito de uma SCP sobre uma service-linked role', 'Decidir onde colocar a conta nova'],
      },
      intel: [{ conceptId: 'iam.service-linked-role' }],
      activities: [
        {
          id: 'iax.f08.boss.a1',
          kind: 'lab',
          lab: 'org',
          title: 'Guardrails antes da fusão',
          prompt: 'Refaça os guardrails da organização para que as regras valham também para a conta que vai entrar.',
          concepts: [{ id: 'org.scp' }, { id: 'org.scp-inheritance' }],
          xp: 160,
          difficulty: 3,
          hints: ['Regras universais na raiz valem automaticamente para qualquer conta nova.'],
          explanation: ['Mesma solução da missão 2: regras universais na raiz, Região na OU Produção e lista de permissões na OU Sandbox. A conta nova herda as regras ao ser colocada numa OU.'],
          config: ORG_LAB,
        },
        {
          id: 'iax.f08.boss.a2',
          kind: 'decision',
          title: 'E as service-linked roles?',
          prompt: 'A conta nova usa um serviço que trabalha por uma **service-linked role** em us-east-1. Ela vai para a OU Produção, que nega tudo fora de sa-east-1. A SCP bloqueia a service-linked role?',
          concepts: [{ id: 'iam.service-linked-role' }, { id: 'org.scp', weight: 0.5 }],
          xp: 40,
          difficulty: 3,
          explanation: ['SCPs (e RCPs) não limitam service-linked roles. Os principais da conta, sim.'],
          options: [
            { id: 'a', text: 'Não: SCPs não limitam service-linked roles, mas limitam os usuários e roles da conta', correct: true, consequence: 'O serviço continua funcionando; as pessoas da conta ficam presas a sa-east-1.' },
            { id: 'b', text: 'Sim: SCPs valem para tudo na conta', correct: false, consequence: 'Service-linked roles são uma exceção documentada.' },
          ],
        },
        {
          id: 'iax.f08.boss.a3',
          kind: 'decision',
          title: 'Onde colocar a conta nova?',
          prompt: 'A empresa comprada roda um sistema de produção, mas ainda não foi auditada. Onde colocar a conta dela na chegada?',
          concepts: [{ id: 'org.scp-inheritance' }, { id: 'org.organizations', weight: 0.5 }],
          xp: 40,
          difficulty: 2,
          explanation: ['Uma OU própria permite aplicar regras específicas (inclusive mais restritivas) até a auditoria terminar, sem afetar as outras contas, e as regras da raiz já valem desde o primeiro minuto.'],
          options: [
            { id: 'a', text: 'Numa OU própria de entrada, com as regras da raiz e restrições extras até a auditoria', correct: true, consequence: 'Os guardrails universais valem já, e o resto é ajustado com calma.' },
            { id: 'b', text: 'Direto na raiz, sem OU', correct: false, consequence: 'Ela ficaria só com as regras gerais, sem as restrições de produção.' },
            { id: 'c', text: 'Como conta de gerenciamento de uma segunda organização', correct: false, consequence: 'Fragmenta a governança que a fusão quer unificar.' },
          ],
        },
      ],
      debrief: { takeaways: ['Guardrails universais na raiz valem para contas novas automaticamente.', 'SCPs não limitam service-linked roles nem a conta de gerenciamento.', 'Use OUs para regras por grupo de contas.'] },
    },
  ],
}
