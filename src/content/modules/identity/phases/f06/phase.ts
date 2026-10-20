/**
 * Fase 6 — Roles na prática. Credenciais para EC2, PassRole, service roles e
 * service-linked roles, Roles Anywhere, acesso entre contas e o assistente confuso.
 */
import type { PhaseDef } from '../../../../../engine/types'
import type { BuilderLabConfig } from '../../../../../simulators/policy/builder'
import type { Principal } from '../../../../../simulators/policy/model'
import type { TrustLabConfig } from '../../../../../simulators/sts/lab'
import { META } from '../meta'

const FAZENDA = '555566667777'
const COLMEIA = '999988887777'
const CLIENTE = '121212121212'

// ---------------------------------------------------------------------------
// Missão 2 — PassRole

const leo: Principal = { id: 'leo', name: 'leo (desenvolvedor)', kind: 'user', account: FAZENDA, userName: 'leo', identityPolicies: [] }
const roleRes = (name: string) => ({ id: name, arn: `arn:aws:iam::${FAZENDA}:role/${name}`, account: FAZENDA, label: `role ${name}` })

const PASSROLE: BuilderLabConfig = {
  kind: 'identity',
  policyName: 'LancarSensores',
  attachedTo: 'Anexada ao usuário **leo**, que sobe as instâncias do processamento de sensores.',
  scenario: {
    principals: [leo],
    resources: [{ id: 'inst', arn: `arn:aws:ec2:sa-east-1:${FAZENDA}:instance/i-0abc`, account: FAZENDA, label: 'instância nova' }, roleRes('app-sensores'), roleRes('admin-total')],
  },
  target: { type: 'identity', principalIds: ['leo'] },
  palette: {
    actions: ['ec2:RunInstances', 'iam:PassRole', 'iam:*', '*'],
    resources: [`arn:aws:ec2:sa-east-1:${FAZENDA}:instance/*`, `arn:aws:iam::${FAZENDA}:role/app-sensores`, `arn:aws:iam::${FAZENDA}:role/*`, '*'],
    conditions: [
      { id: 'ec2', label: 'StringEquals iam:PassedToService = ec2.amazonaws.com', clause: { op: 'StringEquals', key: 'iam:PassedToService', values: ['ec2.amazonaws.com'] } },
      { id: 'lambda', label: 'StringEquals iam:PassedToService = lambda.amazonaws.com', clause: { op: 'StringEquals', key: 'iam:PassedToService', values: ['lambda.amazonaws.com'] } },
    ],
  },
  maxStatements: 3,
  tests: [
    { id: 't1', label: 'Lançar uma instância', request: { principalId: 'leo', action: 'ec2:RunInstances', resourceId: 'inst' }, expect: 'allow', why: 'É o trabalho do leo.', concepts: ['iam.pass-role'] },
    { id: 't2', label: 'Passar a role app-sensores para o EC2', request: { principalId: 'leo', action: 'iam:PassRole', resourceId: 'app-sensores', context: { 'iam:PassedToService': 'ec2.amazonaws.com' } }, expect: 'allow', why: 'Sem PassRole, o EC2 recusa lançar a instância com o instance profile.', concepts: ['iam.pass-role'] },
    { id: 't3', label: 'Passar a role admin-total para o EC2', request: { principalId: 'leo', action: 'iam:PassRole', resourceId: 'admin-total', context: { 'iam:PassedToService': 'ec2.amazonaws.com' } }, expect: 'deny', why: 'Com admin-total na instância, o leo usaria permissões que ele não tem.', concepts: ['iam.pass-role'] },
    { id: 't4', label: 'Passar a role app-sensores para uma função Lambda', request: { principalId: 'leo', action: 'iam:PassRole', resourceId: 'app-sensores', context: { 'iam:PassedToService': 'lambda.amazonaws.com' } }, expect: 'deny', why: 'A role é para o EC2; outros serviços ficam de fora.', concepts: ['iam.pass-role'] },
  ],
  probes: [{ id: 'p1', label: 'Criar um usuário IAM', request: { principalId: 'leo', action: 'iam:CreateUser', resourceId: 'admin-total' }, expect: 'deny', why: '`iam:*` dá ao leo o controle do IAM inteiro.', concepts: ['iam.least-privilege'] }],
  solution: [
    { effect: 'Allow', actions: ['ec2:RunInstances'], resources: [`arn:aws:ec2:sa-east-1:${FAZENDA}:instance/*`], principals: [], conditions: [] },
    { effect: 'Allow', actions: ['iam:PassRole'], resources: [`arn:aws:iam::${FAZENDA}:role/app-sensores`], principals: [], conditions: ['ec2'] },
  ],
}

// ---------------------------------------------------------------------------
// Missão 4 — External ID (Colmeia Analytics)

const EXTERNAL_ID = 'colmeia-cliente-4471'
const assumeAny = { id: 'AssumirClientes', name: 'AssumirClientes', statements: [{ sid: 'Assumir', effect: 'Allow' as const, actions: ['sts:AssumeRole'], resources: ['*'] }] }

const EXTERNAL_LAB: TrustLabConfig = {
  roleId: 'leitura',
  permissions: [{ id: 'Leitura', name: 'ReadOnlyAccess', statements: [{ sid: 'Ler', effect: 'Allow', actions: ['s3:Get*', 's3:List*'], resources: ['*'] }] }],
  durationOptions: [1, 2, 4],
  builder: {
    kind: 'trust',
    policyName: 'TrustColmeia',
    attachedTo: `Trust policy da role **colmeia-leitura**, na conta do cliente (${CLIENTE}).`,
    scenario: {
      principals: [
        { id: 'colmeia', name: 'scanner da Colmeia', kind: 'role-session', account: COLMEIA, roleName: 'scanner', sessionName: 'cliente-4471', identityPolicies: [assumeAny] },
        { id: 'colmeia-outro', name: 'scanner da Colmeia (pedido de outro cliente)', kind: 'role-session', account: COLMEIA, roleName: 'scanner', sessionName: 'cliente-9002', identityPolicies: [assumeAny] },
        { id: 'estranho', name: 'conta desconhecida', kind: 'role-session', account: '343434343434', roleName: 'qualquer', sessionName: 'x', identityPolicies: [assumeAny] },
      ],
      resources: [{ id: 'leitura', arn: `arn:aws:iam::${CLIENTE}:role/colmeia-leitura`, account: CLIENTE, kind: 'trust', label: 'role colmeia-leitura' }],
    },
    target: { type: 'resource', resourceId: 'leitura' },
    palette: {
      actions: ['sts:AssumeRole'],
      principals: [
        { id: 'colmeia', label: `conta da Colmeia (${COLMEIA})`, ref: { aws: COLMEIA } },
        { id: 'todos', label: '* (qualquer um)', ref: '*' },
        { id: 'cliente', label: `a própria conta (${CLIENTE})`, ref: { aws: CLIENTE } },
      ],
      conditions: [
        { id: 'ext', label: `StringEquals sts:ExternalId = ${EXTERNAL_ID}`, clause: { op: 'StringEquals', key: 'sts:ExternalId', values: [EXTERNAL_ID] } },
        { id: 'mfa', label: 'Bool aws:MultiFactorAuthPresent = true', clause: { op: 'Bool', key: 'aws:MultiFactorAuthPresent', values: ['true'] } },
      ],
      effects: ['Allow'],
    },
    maxStatements: 2,
    tests: [],
    solution: [],
  },
  attempts: [
    { id: 'a1', label: 'Colmeia assume com o External ID deste cliente', callerId: 'colmeia', sessionName: 'cliente-4471', externalId: EXTERNAL_ID, expect: 'ok', why: 'É o acesso contratado.', concepts: ['iam.confused-deputy'] },
    { id: 'a2', label: 'Colmeia assume sem External ID', callerId: 'colmeia', sessionName: 'sem-id', expect: 'fail', why: 'Sem o ID, não há como saber em nome de qual cliente a Colmeia está agindo.', concepts: ['iam.confused-deputy'] },
    { id: 'a3', label: 'Colmeia, a pedido de outro cliente que informou o ARN desta role', callerId: 'colmeia-outro', sessionName: 'cliente-9002', externalId: 'colmeia-cliente-9002', expect: 'fail', why: 'É o ataque do assistente confuso: o ID do outro cliente não confere.', concepts: ['iam.confused-deputy'] },
    { id: 'a4', label: 'Uma conta desconhecida tenta com o ID correto', callerId: 'estranho', sessionName: 'x', externalId: EXTERNAL_ID, expect: 'fail', why: 'O External ID não é senha: a trust policy também precisa limitar a conta.', concepts: ['iam.cross-account-role'] },
  ],
  solution: { statements: [{ effect: 'Allow', actions: ['sts:AssumeRole'], resources: [], principals: ['colmeia'], conditions: ['ext'] }], maxHours: 1 },
}

// ---------------------------------------------------------------------------
// Chefe — bucket de trilhas do CloudTrail

const TRAIL = `arn:aws:cloudtrail:sa-east-1:${FAZENDA}:trail/trilha-principal`
const OTHER_TRAIL = 'arn:aws:cloudtrail:sa-east-1:343434343434:trail/trilha-alheia'
const LOGS = 'arn:aws:s3:::fazenda-trilhas'
const ct = (sourceArn: string) => ({ 'aws:SourceArn': sourceArn, 'aws:SourceAccount': sourceArn.split(':')[4], 's3:x-amz-acl': 'bucket-owner-full-control' })

const CLOUDTRAIL_BUCKET: BuilderLabConfig = {
  kind: 'resource',
  policyName: 'TrilhasBucketPolicy',
  attachedTo: 'Bucket policy do bucket **fazenda-trilhas**, que guarda os logs do CloudTrail.',
  scenario: {
    principals: [
      { id: 'ct', name: 'CloudTrail', kind: 'service', service: 'cloudtrail.amazonaws.com' },
      { id: 'anon', name: 'anônimo', kind: 'anonymous' },
    ],
    resources: [
      { id: 'bucket', arn: LOGS, account: FAZENDA, label: 'bucket fazenda-trilhas' },
      { id: 'log', arn: `${LOGS}/AWSLogs/${FAZENDA}/CloudTrail/sa-east-1/2026/10/19/log.json.gz`, account: FAZENDA, label: 'arquivo de log' },
      { id: 'alheio', arn: `${LOGS}/AWSLogs/343434343434/CloudTrail/sa-east-1/2026/10/19/log.json.gz`, account: FAZENDA, label: 'log de outra conta' },
    ],
  },
  target: { type: 'resource', resourceId: 'bucket', alsoAppliesTo: ['log', 'alheio'] },
  palette: {
    actions: ['s3:GetBucketAcl', 's3:PutObject', 's3:DeleteObject', 's3:*'],
    resources: [LOGS, `${LOGS}/AWSLogs/${FAZENDA}/*`, `${LOGS}/*`],
    principals: [
      { id: 'ct', label: 'serviço cloudtrail.amazonaws.com', ref: { service: 'cloudtrail.amazonaws.com' } },
      { id: 'todos', label: '* (qualquer um)', ref: '*' },
    ],
    conditions: [
      { id: 'src', label: 'StringEquals aws:SourceArn = trilha-principal', clause: { op: 'StringEquals', key: 'aws:SourceArn', values: [TRAIL] } },
      { id: 'acl', label: 'StringEquals s3:x-amz-acl = bucket-owner-full-control', clause: { op: 'StringEquals', key: 's3:x-amz-acl', values: ['bucket-owner-full-control'] } },
    ],
    effects: ['Allow', 'Deny'],
  },
  maxStatements: 3,
  tests: [
    { id: 't1', label: 'CloudTrail confere a ACL do bucket para a trilha-principal', request: { principalId: 'ct', action: 's3:GetBucketAcl', resourceId: 'bucket', context: ct(TRAIL) }, expect: 'allow', why: 'O CloudTrail confere o bucket antes de entregar logs.', concepts: ['iam.confused-deputy'] },
    { id: 't2', label: 'CloudTrail grava um log da trilha-principal', request: { principalId: 'ct', action: 's3:PutObject', resourceId: 'log', context: ct(TRAIL) }, expect: 'allow', why: 'É a entrega de logs.', concepts: ['iam.confused-deputy'] },
    { id: 't3', label: 'CloudTrail grava log de uma trilha de outra conta, apontada para este bucket', request: { principalId: 'ct', action: 's3:PutObject', resourceId: 'alheio', context: ct(OTHER_TRAIL) }, expect: 'deny', why: 'Sem aws:SourceArn, qualquer conta poderia usar o seu bucket como depósito de logs pelo CloudTrail.', concepts: ['iam.confused-deputy'] },
    { id: 't5', label: 'CloudTrail confere a ACL a pedido de uma trilha de outra conta', request: { principalId: 'ct', action: 's3:GetBucketAcl', resourceId: 'bucket', context: ct(OTHER_TRAIL) }, expect: 'deny', why: 'Só a trilha da própria conta deve usar o bucket.', concepts: ['iam.confused-deputy'] },
    { id: 't4', label: 'Alguém anônimo grava no bucket', request: { principalId: 'anon', action: 's3:PutObject', resourceId: 'log' }, expect: 'deny', why: 'O bucket de trilhas nunca é público.', concepts: ['iam.resource-policy'] },
  ],
  probes: [{ id: 'p1', label: 'CloudTrail apaga um log', request: { principalId: 'ct', action: 's3:DeleteObject', resourceId: 'log', context: ct(TRAIL) }, expect: 'deny', why: 'O CloudTrail só precisa conferir a ACL e gravar; apagar logs nunca.', concepts: ['iam.least-privilege'] }],
  solution: [
    { effect: 'Allow', actions: ['s3:GetBucketAcl'], resources: [LOGS], principals: ['ct'], conditions: ['src'] },
    { effect: 'Allow', actions: ['s3:PutObject'], resources: [`${LOGS}/AWSLogs/${FAZENDA}/*`], principals: ['ct'], conditions: ['src', 'acl'] },
  ],
}

export const F06_IAM: PhaseDef = {
  ...META.f06,
  concepts: ['iam.service-role', 'iam.service-linked-role', 'iam.instance-profile', 'iam.pass-role', 'iam.roles-anywhere', 'iam.cross-account-role', 'iam.confused-deputy', 'ram.sharing', 'iam.resource-policy', 'iam.least-privilege'],
  availability: 'available',
  simplifications: ['O metadado da instância (IMDS) é citado, mas não simulado.', 'No lab do CloudTrail, cada requisição traz no contexto o ARN da trilha que a originou (aws:SourceArn), como o serviço faz.'],
  missions: [
    // -----------------------------------------------------------------------
    {
      id: 'iax.f06.m1',
      title: 'Credenciais para o EC2',
      type: 'mission',
      summary: 'Instance profile, credenciais renovadas automaticamente e uma role por instância.',
      briefing: {
        company: 'Fazenda Conectada',
        role: 'Você cuida da plataforma de uma empresa que coleta dados de sensores no campo.',
        situation: 'As instâncias que processam os sensores leem um bucket com uma chave de acesso gravada num arquivo de configuração. Toda troca de chave exige entrar em cada instância.',
        objective: 'Dar credenciais às instâncias sem chave nenhuma.',
        successCriteria: ['Escolher a solução certa para o EC2', 'Saber o caminho das credenciais até a aplicação', 'Entender o limite de uma role por instância'],
      },
      intel: [
        { conceptId: 'iam.service-role', body: ['Uma **service role** é assumida por um serviço da AWS. A trust policy cita o principal do serviço (como `ec2.amazonaws.com`), e você escreve a política de permissões.'] },
        { conceptId: 'iam.instance-profile', body: ['O **instance profile** leva a role para dentro da instância (**uma role** por profile). A aplicação lê credenciais **temporárias** nos metadados (`iam/security-credentials/<role>`), e elas são **renovadas automaticamente**. O SDK faz isso sozinho.'] },
      ],
      activities: [
        {
          id: 'iax.f06.m1.a1',
          kind: 'decision',
          title: 'Sem chave no arquivo',
          prompt: 'Como a aplicação nas instâncias deve obter acesso ao bucket dos sensores?',
          concepts: [{ id: 'iam.instance-profile' }, { id: 'iam.service-role', weight: 0.5 }],
          xp: 40,
          difficulty: 1,
          explanation: ['Role com trust para o EC2, entregue pelo instance profile: credenciais temporárias, renovadas automaticamente, sem nada para distribuir ou rotacionar.'],
          options: [
            { id: 'a', text: 'Uma role com trust para o EC2, anexada às instâncias pelo instance profile', correct: true, consequence: 'As instâncias recebem credenciais temporárias e a chave do arquivo pode ser excluída.', impacts: { seguranca: 2 } },
            { id: 'b', text: 'Um usuário IAM por instância, cada um com a própria chave', correct: false, consequence: 'Multiplica as credenciais de longo prazo para rotacionar e proteger.', impacts: { seguranca: -1 } },
            { id: 'c', text: 'A mesma chave, guardada numa variável de ambiente', correct: false, consequence: 'Continua sendo credencial de longo prazo dentro da instância.', impacts: { seguranca: -1 } },
          ],
        },
        {
          id: 'iax.f06.m1.a2',
          kind: 'order',
          title: 'Do IAM até a aplicação',
          prompt: 'Ordene os passos para a aplicação na instância usar uma role (pela CLI, sem o console).',
          concepts: [{ id: 'iam.instance-profile' }],
          xp: 50,
          difficulty: 2,
          explanation: ['Pela CLI, o instance profile é um passo à parte; no console, ele é criado junto com a role. Depois, as credenciais chegam pelos metadados e são renovadas sozinhas.'],
          steps: [
            { id: 's1', text: 'Criar a role com trust policy para ec2.amazonaws.com', explanation: 'Só o EC2 pode assumi-la.' },
            { id: 's2', text: 'Anexar à role a política de permissões (leitura do bucket dos sensores)', explanation: 'O que a aplicação vai poder fazer.' },
            { id: 's3', text: 'Criar o instance profile e adicionar a role a ele', explanation: 'Pela CLI ou API, é um recurso separado.' },
            { id: 's4', text: 'Lançar a instância (ou anexar a uma em execução) com o instance profile', explanation: 'Quem faz isso precisa de iam:PassRole para a role.' },
            { id: 's5', text: 'O SDK da aplicação busca as credenciais nos metadados da instância', explanation: 'Em iam/security-credentials/<role>.' },
            { id: 's6', text: 'As credenciais são renovadas automaticamente antes de expirar', explanation: 'Nada para rotacionar à mão.' },
          ],
        },
        {
          id: 'iax.f06.m1.a3',
          kind: 'decision',
          title: 'Duas aplicações, duas roles?',
          prompt: 'Na mesma instância rodam o coletor (precisa do bucket de sensores) e o painel (precisa de uma tabela DynamoDB). A equipe quer anexar duas roles ao instance profile. O que você responde?',
          concepts: [{ id: 'iam.instance-profile' }],
          xp: 30,
          difficulty: 2,
          explanation: ['Um instance profile tem uma única role, e todas as aplicações da instância compartilham as mesmas permissões. Para separar, use instâncias diferentes ou contêineres no ECS, que aceitam uma role por task.'],
          options: [
            { id: 'a', text: 'Não dá: é uma role por instance profile. Separe as aplicações (ou use ECS com uma role por task)', correct: true, consequence: 'Cada aplicação fica com o próprio menor privilégio.' },
            { id: 'b', text: 'Pode: o instance profile aceita várias roles', correct: false, consequence: 'O limite é uma role, e não pode ser aumentado.' },
            { id: 'c', text: 'Pode: basta pedir aumento de cota', correct: false, consequence: 'Esse limite não aceita aumento.' },
          ],
        },
      ],
      debrief: { takeaways: ['EC2 usa role pelo instance profile, nunca chave em arquivo.', 'As credenciais vêm dos metadados e são renovadas automaticamente.', 'Uma role por instance profile.'] },
    },
    // -----------------------------------------------------------------------
    {
      id: 'iax.f06.m2',
      title: 'PassRole',
      type: 'mission',
      summary: 'Quem pode entregar qual role a qual serviço.',
      briefing: {
        company: 'Fazenda Conectada',
        role: 'Você revisa as permissões dos desenvolvedores.',
        situation: 'O leo lança instâncias com a role app-sensores. Na conta também existe a role admin-total, usada por automações de infraestrutura.',
        objective: 'Deixar o leo passar só a role certa, só para o EC2.',
        successCriteria: ['Permitir lançar instâncias', 'Permitir passar só a app-sensores ao EC2', 'Nada de iam:*'],
      },
      intel: [{ conceptId: 'iam.pass-role', body: ['Entregar uma role a um serviço exige a **permissão** `iam:PassRole` para aquela role. Restrinja pelo **ARN da role** e pelo serviço com `iam:PassedToService`. Sem esse limite, quem lança instâncias pode lançar uma com uma role poderosa e usar as permissões dela.'] }],
      activities: [
        {
          id: 'iax.f06.m2.a1',
          kind: 'lab',
          lab: 'policy-builder',
          title: 'A política do leo',
          prompt: 'Monte a política **LancarSensores**.',
          concepts: [{ id: 'iam.pass-role' }, { id: 'iam.least-privilege', weight: 0.5 }],
          xp: 140,
          difficulty: 3,
          hints: ['PassRole é avaliado com o ARN da role como recurso.', 'A condição iam:PassedToService diz para qual serviço a role pode ir.'],
          explanation: ['Solução: Allow `ec2:RunInstances` nas instâncias e Allow `iam:PassRole` só na role app-sensores, com `iam:PassedToService = ec2.amazonaws.com`.'],
          config: PASSROLE,
        },
        {
          id: 'iax.f06.m2.a2',
          kind: 'decision',
          title: 'Onde aparece o PassRole?',
          prompt: 'A auditoria quer saber, pelo CloudTrail, quando a role app-sensores foi passada a uma instância. Onde procurar?',
          concepts: [{ id: 'iam.pass-role' }],
          xp: 30,
          difficulty: 2,
          explanation: ['PassRole é uma permissão, não uma chamada de API: não há evento próprio. A role passada aparece no evento da chamada que criou ou alterou o recurso, como RunInstances.'],
          options: [
            { id: 'a', text: 'No evento RunInstances (ou da ação que associou a role ao recurso)', correct: true, consequence: 'É lá que a role passada fica registrada.' },
            { id: 'b', text: 'Num evento PassRole no CloudTrail', correct: false, consequence: 'Esse evento não existe: PassRole não é uma chamada de API.' },
            { id: 'c', text: 'Só no relatório de credenciais', correct: false, consequence: 'O relatório mostra credenciais de usuários, não roles passadas.' },
          ],
        },
      ],
      debrief: { takeaways: ['PassRole: restrinja pelo ARN da role e por iam:PassedToService.', 'PassRole é permissão, não chamada de API.'] },
    },
    // -----------------------------------------------------------------------
    {
      id: 'iax.f06.m3',
      title: 'Roles de serviço e fora da AWS',
      type: 'mission',
      summary: 'Service role, service-linked role e IAM Roles Anywhere.',
      briefing: {
        company: 'Fazenda Conectada',
        role: 'Você está organizando as roles da conta.',
        situation: 'Há roles que ninguém lembra de ter criado e um servidor no galpão da fazenda que envia dados com uma chave de acesso.',
        objective: 'Entender cada tipo de role e tirar a chave do servidor do galpão.',
        successCriteria: ['Distinguir service role e service-linked role', 'Escolher a solução para o servidor fora da AWS'],
      },
      intel: [
        { conceptId: 'iam.service-linked-role', body: ['Uma **service-linked role** é definida pelo próprio serviço, com as permissões de que ele precisa. Você vê, mas não edita. SCPs e RCPs não a limitam, e ela não aceita permissions boundary.'] },
        { conceptId: 'iam.roles-anywhere', body: ['Servidores **fora da AWS** podem trocar um **certificado X.509** por credenciais temporárias com o **IAM Roles Anywhere**. A CA vira um **trust anchor** e um **profile** define roles e session policy.'] },
      ],
      activities: [
        {
          id: 'iax.f06.m3.a1',
          kind: 'classify',
          title: 'Service role ou service-linked?',
          prompt: 'Classifique cada característica.',
          concepts: [{ id: 'iam.service-linked-role' }, { id: 'iam.service-role' }],
          xp: 50,
          difficulty: 2,
          explanation: ['As duas são assumidas por serviços; a diferença é quem define e edita as permissões.'],
          bins: [
            { id: 'service', label: 'Service role' },
            { id: 'linked', label: 'Service-linked role' },
          ],
          items: [
            { id: 'edit', text: 'O administrador escreve e edita a política de permissões', bin: 'service', explanation: 'Service roles são suas.', concepts: ['iam.service-role'] },
            { id: 'lambda', text: 'A role de execução de uma função Lambda', bin: 'service', explanation: 'Você cria e define as permissões da função.', concepts: ['iam.service-role'] },
            { id: 'view', text: 'Você só consegue visualizar as permissões', bin: 'linked', explanation: 'Quem define é o serviço.', concepts: ['iam.service-linked-role'] },
            { id: 'asg', text: 'AWSServiceRoleForAutoScaling, criada quando você cria o primeiro Auto Scaling group', bin: 'linked', explanation: 'Criada pelo próprio serviço.', concepts: ['iam.service-linked-role'] },
            { id: 'scp', text: 'Não é limitada por SCPs nem por RCPs', bin: 'linked', explanation: 'Os guardrails da organização não a afetam.', concepts: ['iam.service-linked-role'] },
            { id: 'pb', text: 'Pode receber um permissions boundary', bin: 'service', explanation: 'Service-linked roles não aceitam boundary.', concepts: ['iam.service-role'] },
          ],
        },
        {
          id: 'iax.f06.m3.a2',
          kind: 'decision',
          title: 'O servidor do galpão',
          prompt: 'Um servidor no galpão (fora da AWS) envia leituras para o S3 com uma chave de acesso de dois anos. A empresa já tem uma CA própria que emite certificados para os servidores. O que fazer?',
          concepts: [{ id: 'iam.roles-anywhere' }],
          xp: 40,
          difficulty: 2,
          explanation: ['Com o Roles Anywhere, a CA da empresa vira trust anchor e o servidor troca o certificado por credenciais temporárias de uma role.'],
          options: [
            { id: 'a', text: 'IAM Roles Anywhere: registrar a CA como trust anchor e criar um profile com a role do envio', correct: true, consequence: 'Sem chave de longo prazo no galpão; as credenciais expiram sozinhas.', impacts: { seguranca: 2 } },
            { id: 'b', text: 'Instance profile no servidor do galpão', correct: false, consequence: 'Instance profile é para instâncias EC2.' },
            { id: 'c', text: 'Rotacionar a chave a cada 90 dias e manter assim', correct: false, consequence: 'Melhor que nada, mas continua sendo credencial de longo prazo.' },
          ],
        },
      ],
      debrief: { takeaways: ['Service role é sua; service-linked role é do serviço.', 'Fora da AWS, Roles Anywhere troca certificado por credenciais temporárias.'] },
    },
    // -----------------------------------------------------------------------
    {
      id: 'iax.f06.m4',
      title: 'O assistente confuso',
      type: 'mission',
      summary: 'Acesso de terceiros entre contas, External ID e aws:SourceArn.',
      briefing: {
        company: 'Colmeia Analytics',
        role: 'Você é a pessoa de segurança de um fornecedor que audita as contas AWS dos clientes.',
        situation: 'Cada cliente cria uma role na própria conta e informa o ARN dela ao portal da Colmeia. Um cliente mal-intencionado poderia informar o ARN da role de outro cliente.',
        objective: 'Proteger os clientes contra o assistente confuso.',
        successCriteria: ['Ordenar o fluxo do External ID', 'Montar a trust policy do cliente', 'Escolher entre role e política de recurso'],
      },
      intel: [
        { conceptId: 'iam.confused-deputy', visual: 'confused-deputy', body: ['O **assistente confuso** é um terceiro com acesso a muitas contas sendo enganado para agir na conta errada. Proteção: um **External ID único por cliente**, gerado pelo fornecedor e exigido na trust policy com `sts:ExternalId`. Entre serviços, use `aws:SourceArn` ou `aws:SourceAccount`.'] },
        { conceptId: 'iam.cross-account-role', body: ['**Role entre contas**: quem assume abre mão das próprias permissões e serve para qualquer serviço. **Política de recurso**: o principal continua com as permissões dele, ótimo para copiar dados entre contas, mas só onde o serviço aceita esse tipo de política.'] },
        { conceptId: 'ram.sharing', body: ['O **AWS RAM** compartilha recursos (como subnets) com outras contas ou com a organização inteira, sem duplicá-los. Dentro da organização, não precisa de convite.'] },
      ],
      activities: [
        {
          id: 'iax.f06.m4.a1',
          kind: 'order',
          title: 'O fluxo do External ID',
          prompt: 'Ordene o processo para um novo cliente da Colmeia.',
          concepts: [{ id: 'iam.confused-deputy' }],
          xp: 50,
          difficulty: 2,
          explanation: ['O ID é gerado pelo fornecedor, e não pelo cliente: assim um cliente não consegue escolher o ID de outro.'],
          steps: [
            { id: 's1', text: 'A Colmeia gera um External ID único para o cliente', explanation: 'O fornecedor controla os IDs.' },
            { id: 's2', text: 'O cliente cria a role com trust policy para a conta da Colmeia, exigindo sts:ExternalId igual ao ID', explanation: 'A condição amarra a role a este cliente.' },
            { id: 's3', text: 'O cliente informa o ARN da role no portal da Colmeia', explanation: 'O ARN fica associado ao cliente.' },
            { id: 's4', text: 'A Colmeia chama AssumeRole com o ARN e o External ID daquele cliente', explanation: 'Sempre o ID do cliente que fez o pedido.' },
            { id: 's5', text: 'O STS confere a trust policy e devolve credenciais temporárias', explanation: 'Com o ID errado, a chamada é negada.' },
          ],
        },
        {
          id: 'iax.f06.m4.a2',
          kind: 'lab',
          lab: 'trust',
          title: 'A role colmeia-leitura',
          prompt: 'Monte a trust policy da role que o cliente cria para a Colmeia.',
          concepts: [{ id: 'iam.confused-deputy' }, { id: 'iam.cross-account-role', weight: 0.5 }],
          xp: 140,
          difficulty: 3,
          hints: ['O External ID sozinho não basta: a trust policy também precisa limitar quem pode assumir.', 'A Colmeia chama com as credenciais da própria conta: cite a conta dela.'],
          explanation: ['Solução: Allow `sts:AssumeRole` para a conta da Colmeia, com `StringEquals sts:ExternalId = colmeia-cliente-4471`.'],
          config: EXTERNAL_LAB,
        },
        {
          id: 'iax.f06.m4.a3',
          kind: 'classify',
          title: 'Role ou política de recurso?',
          prompt: 'Para cada necessidade entre contas, o que usar?',
          concepts: [{ id: 'iam.cross-account-role' }, { id: 'ram.sharing', weight: 0.5 }],
          xp: 50,
          difficulty: 2,
          explanation: ['Política de recurso quando o principal precisa continuar com as próprias permissões e o serviço aceita; role quando o acesso abrange vários serviços ou o serviço não aceita política de recurso; RAM para compartilhar o próprio recurso.'],
          bins: [
            { id: 'role', label: 'Role entre contas' },
            { id: 'resource', label: 'Política de recurso' },
            { id: 'ram', label: 'AWS RAM' },
          ],
          items: [
            { id: 'copy', text: 'Copiar objetos de um bucket da conta A para um bucket da conta B, com acesso aos dois ao mesmo tempo', bin: 'resource', explanation: 'Com política de recurso, o principal não abre mão das permissões da própria conta.', concepts: ['iam.cross-account-role'] },
            { id: 'vendor', text: 'Um fornecedor vai ler configurações de vários serviços da sua conta', bin: 'role', explanation: 'Uma role reúne as permissões de vários serviços num só lugar.', concepts: ['iam.cross-account-role'] },
            { id: 'norbp', text: 'Acessar um serviço que não aceita políticas de recurso', bin: 'role', explanation: 'Sem política de recurso, o caminho é a role.', concepts: ['iam.cross-account-role'] },
            { id: 'sqs', text: 'Uma fila SQS recebe mensagens publicadas por outra conta', bin: 'resource', explanation: 'A política da fila concede o envio à outra conta.', concepts: ['iam.cross-account-role'] },
            { id: 'subnet', text: 'Várias contas da organização usam as mesmas subnets da VPC central', bin: 'ram', explanation: 'O RAM compartilha subnets sem duplicá-las.', concepts: ['ram.sharing'] },
          ],
        },
        {
          id: 'iax.f06.m4.a4',
          kind: 'decision',
          title: 'Serviço chamando serviço',
          prompt: 'Um bucket da Colmeia envia notificações para um tópico SNS. A política do tópico concede `sns:Publish` ao principal `s3.amazonaws.com`. Como evitar que buckets de **outras contas** publiquem nesse tópico?',
          concepts: [{ id: 'iam.confused-deputy' }],
          xp: 40,
          difficulty: 3,
          explanation: ['Quando um serviço chama outro em nome de um recurso, ele informa o ARN e a conta do recurso de origem. Conferir aws:SourceArn (ou aws:SourceAccount) na política do tópico impede que o serviço seja usado em nome de recursos alheios.'],
          options: [
            { id: 'a', text: 'Acrescentar a condição aws:SourceArn com o ARN do bucket (ou aws:SourceAccount com a conta)', correct: true, consequence: 'O S3 só publica no tópico em nome do seu bucket.' },
            { id: 'b', text: 'Exigir sts:ExternalId na política do tópico', correct: false, consequence: 'External ID é para roles assumidas por terceiros; o S3 não envia esse valor.' },
            { id: 'c', text: 'Trocar o principal por "*"', correct: false, consequence: 'Abre o tópico para qualquer um.' },
          ],
        },
      ],
      debrief: { takeaways: ['External ID único, gerado pelo fornecedor, exigido na trust policy.', 'Role: troca de permissões. Política de recurso: o principal mantém as dele.', 'RAM compartilha o recurso em si.'] },
    },
    // -----------------------------------------------------------------------
    {
      id: 'iax.f06.boss',
      title: 'Chefe: Chaves no repositório',
      type: 'boss',
      summary: 'Uma chave vazou e o bucket de auditoria está aberto a qualquer trilha.',
      passThreshold: 0.7,
      bonusXp: 120,
      briefing: {
        company: 'Fazenda Conectada',
        role: 'Você lidera a resposta a um alerta de segurança.',
        situation: 'Um alerta do repositório de código avisou que a chave de acesso do usuário gateway-galpao foi publicada. Na revisão, a equipe percebeu que o bucket dos logs do CloudTrail aceita gravações do CloudTrail sem conferir de qual trilha elas vêm.',
        objective: 'Conter o vazamento, tirar a chave do galpão e proteger o bucket de auditoria.',
        successCriteria: ['Apontar evidências e causa', 'Escrever a bucket policy do CloudTrail com aws:SourceArn', 'Escolher o destino do gateway'],
      },
      intel: [],
      activities: [
        {
          id: 'iax.f06.boss.a1',
          kind: 'investigate',
          title: 'O que a chave fez?',
          prompt: 'Examine o alerta e o CloudTrail.',
          concepts: [{ id: 'iam.roles-anywhere' }, { id: 'iam.instance-profile', weight: 0.5 }],
          xp: 90,
          difficulty: 2,
          explanation: ['A chave de longo prazo do gateway vazou no repositório e já foi usada de fora. O gateway roda fora da AWS: o destino certo é o Roles Anywhere, sem chave nenhuma.'],
          artifacts: [
            {
              id: 'alert',
              title: 'Alerta do repositório',
              format: 'log',
              lines: [
                { id: 'a1', text: 'Segredo detectado: AWS access key AKIA…G4L em gateway/config.ini (commit de ontem)', isIssue: true, explanation: 'A chave e o segredo estão no histórico do repositório.' },
                { id: 'a2', text: 'Repositório: interno, 40 colaboradores com acesso', isIssue: false, explanation: 'O tamanho da equipe não muda a gravidade: a chave precisa ser trocada.' },
              ],
            },
            {
              id: 'trail',
              title: 'CloudTrail (trecho)',
              format: 'log',
              lines: [
                { id: 'c1', text: '03:40 · gateway-galpao (AKIA…G4L) · ListBuckets · origem 192.0.2.200', isIssue: true, explanation: 'Uso da chave a partir de um endereço que não é o do galpão.' },
                { id: 'c2', text: '06:00 · gateway-galpao (AKIA…G4L) · PutObject leituras/2026-10-19.csv · origem 203.0.113.77 (galpão)', isIssue: false, explanation: 'Uso legítimo do gateway.' },
                { id: 'c3', text: '07:15 · assumed-role/app-sensores/i-0abc · GetObject leituras/2026-10-19.csv', isIssue: false, explanation: 'A instância usa a role pelo instance profile: o caminho certo.' },
              ],
            },
          ],
          rootCause: {
            prompt: 'Qual é a causa raiz?',
            options: [
              { id: 'r1', text: 'Um servidor fora da AWS usa uma chave de acesso de longo prazo, que acabou no repositório.', correct: true, feedback: 'Isso: sem credenciais de longo prazo, não haveria o que vazar.' },
              { id: 'r2', text: 'A role app-sensores é ampla demais.', correct: false, feedback: 'A role da instância não aparece no uso suspeito.' },
              { id: 'r3', text: 'O repositório deveria ser privado para menos pessoas.', correct: false, feedback: 'Ajudaria a reduzir a exposição, mas a causa é a chave existir.' },
            ],
          },
          remediations: {
            prompt: 'O que fazer? (selecione todas as adequadas)',
            options: [
              { id: 'f1', text: 'Desativar a chave AKIA…G4L e revisar no CloudTrail o que ela fez.', correct: true, feedback: 'Contém o vazamento e mostra o estrago.' },
              { id: 'f2', text: 'Mover o gateway para o IAM Roles Anywhere, com certificado da CA da empresa.', correct: true, feedback: 'Sem chave de longo prazo no galpão.' },
              { id: 'f3', text: 'Apagar o commit e manter a mesma chave.', correct: false, feedback: 'A chave já foi copiada e usada: precisa deixar de valer.' },
              { id: 'f4', text: 'Dar um instance profile ao gateway.', correct: false, feedback: 'O gateway não é uma instância EC2.' },
            ],
          },
        },
        {
          id: 'iax.f06.boss.a2',
          kind: 'lab',
          lab: 'policy-builder',
          title: 'O bucket de trilhas',
          prompt: 'Monte a bucket policy do **fazenda-trilhas**: o CloudTrail confere a ACL e grava os logs da trilha-principal, e nenhuma outra trilha usa o bucket.',
          concepts: [{ id: 'iam.confused-deputy' }, { id: 'iam.resource-policy' }, { id: 'iam.least-privilege', weight: 0.5 }],
          xp: 160,
          difficulty: 3,
          hints: ['São duas ações em recursos diferentes: a ACL no ARN do bucket e os logs em AWSLogs/<conta>/.', 'aws:SourceArn amarra o serviço à trilha da própria conta.'],
          explanation: ['Solução (a mesma da documentação do CloudTrail): Allow `s3:GetBucketAcl` no bucket e Allow `s3:PutObject` em `AWSLogs/555566667777/*`, ambos para `cloudtrail.amazonaws.com` com `aws:SourceArn` da trilha-principal (e `s3:x-amz-acl = bucket-owner-full-control` no PutObject).'],
          config: CLOUDTRAIL_BUCKET,
        },
      ],
      debrief: { takeaways: ['Credencial que não existe não vaza: roles, instance profile e Roles Anywhere.', 'Políticas de recurso para serviços: confira aws:SourceArn ou aws:SourceAccount.'] },
    },
  ],
}
