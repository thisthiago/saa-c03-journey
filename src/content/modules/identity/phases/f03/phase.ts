/**
 * Fase 3 — Anatomia de uma política. Elementos, ARNs, curingas, condições,
 * gerenciada × inline e o caminho até o menor privilégio.
 */
import type { PhaseDef } from '../../../../../engine/types'
import type { BuilderLabConfig } from '../../../../../simulators/policy/builder'
import type { Principal, PolicyScenario, PolicyStatement } from '../../../../../simulators/policy/model'
import { META } from '../meta'
import { DECISION_OPTIONS, exhibit, pol } from '../shared'

const ACCT = '333344445555'
const B = 'arn:aws:s3:::mapa-relatorios'

// ---------------------------------------------------------------------------
// Missão 1 — lendo statements

const READ_EPUB: PolicyStatement = { sid: 'LerEpubs', effect: 'Allow', actions: ['s3:Get*'], resources: ['arn:aws:s3:::mapa-livros/epub/*'] }

const NOT_ACTION_ALLOW: PolicyStatement = { sid: 'TudoMenosIAM', effect: 'Allow', notActions: ['iam:*'], resources: ['*'] }

const LEITORA: PolicyScenario = {
  principals: [{ id: 'iris', name: 'Íris', kind: 'user', account: ACCT, userName: 'iris', identityPolicies: [pol('Estagiaria', [NOT_ACTION_ALLOW])] }],
  resources: [{ id: 'bucket', arn: 'arn:aws:s3:::mapa-livros', account: ACCT, label: 'bucket mapa-livros' }],
}

// ---------------------------------------------------------------------------
// Missão 3 — construtor (role de analista)

const analista = (id: string, name: string): Principal => ({ id, name, kind: 'role-session', account: ACCT, roleName: 'analista-vendas', sessionName: id, identityPolicies: [] })

const REL_RESOURCES = [
  { id: 'bucket', arn: B, account: ACCT, label: 'bucket mapa-relatorios' },
  { id: 'obj', arn: `${B}/vendas/2026-09.csv`, account: ACCT, label: 'relatório de vendas' },
  { id: 'outro', arn: 'arn:aws:s3:::mapa-contratos', account: ACCT, label: 'bucket mapa-contratos' },
  { id: 'outro-obj', arn: 'arn:aws:s3:::mapa-contratos/autor-12.pdf', account: ACCT, label: 'contrato de autor' },
]

const BUILDER_READ: BuilderLabConfig = {
  kind: 'identity',
  policyName: 'LeituraRelatorios',
  attachedTo: 'Anexada à role **analista-vendas**, assumida pelo painel de vendas.',
  scenario: { principals: [analista('painel', 'Painel de vendas')], resources: REL_RESOURCES },
  target: { type: 'identity', principalIds: ['painel'] },
  palette: {
    actions: ['s3:ListBucket', 's3:GetObject', 's3:PutObject', 's3:Get*', 's3:*', '*'],
    resources: [B, `${B}/*`, 'arn:aws:s3:::*', '*'],
  },
  maxStatements: 3,
  tests: [
    { id: 't1', label: 'Listar o bucket mapa-relatorios', request: { principalId: 'painel', action: 's3:ListBucket', resourceId: 'bucket' }, expect: 'allow', why: 'O painel precisa listar os relatórios. ListBucket usa o ARN do bucket.', concepts: ['iam.arn'] },
    { id: 't2', label: 'Ler um relatório de vendas', request: { principalId: 'painel', action: 's3:GetObject', resourceId: 'obj' }, expect: 'allow', why: 'GetObject usa o ARN do objeto: bucket seguido de /chave.', concepts: ['iam.arn'] },
    { id: 't3', label: 'Gravar um relatório', request: { principalId: 'painel', action: 's3:PutObject', resourceId: 'obj' }, expect: 'deny', why: 'O painel só lê.', concepts: ['iam.least-privilege'] },
  ],
  probes: [
    { id: 'p1', label: 'Apagar um relatório', request: { principalId: 'painel', action: 's3:DeleteObject', resourceId: 'obj' }, expect: 'deny', why: '`s3:*` libera apagar: muito mais do que o painel precisa.', concepts: ['iam.least-privilege', 'iam.wildcards'] },
    { id: 'p2', label: 'Ler um contrato de autor', request: { principalId: 'painel', action: 's3:GetObject', resourceId: 'outro-obj' }, expect: 'deny', why: 'Contratos ficam em outro bucket: recurso `*` abre todos.', concepts: ['iam.least-privilege', 'iam.wildcards'] },
    { id: 'p3', label: 'Listar o bucket de contratos', request: { principalId: 'painel', action: 's3:ListBucket', resourceId: 'outro' }, expect: 'deny', why: 'Nem os nomes dos contratos devem aparecer para o painel.', concepts: ['iam.least-privilege'] },
  ],
  solution: [
    { effect: 'Allow', actions: ['s3:ListBucket'], resources: [B], principals: [], conditions: [] },
    { effect: 'Allow', actions: ['s3:GetObject'], resources: [`${B}/*`], principals: [], conditions: [] },
  ],
}

// ---------------------------------------------------------------------------
// Missão 4 — condições (envio de originais)

const OFFICE = '203.0.113.0/24'
const integ = (id: string, name: string): Principal => ({ id, name, kind: 'role-session', account: ACCT, roleName: 'envio-originais', sessionName: id, identityPolicies: [] })
const UPLOADS = [
  { id: 'upload', arn: 'arn:aws:s3:::mapa-originais/uploads/romance.docx', account: ACCT, label: 'original em uploads/' },
  { id: 'publicado', arn: 'arn:aws:s3:::mapa-originais/publicados/romance.epub', account: ACCT, label: 'livro em publicados/' },
]

const BUILDER_COND: BuilderLabConfig = {
  kind: 'identity',
  policyName: 'EnvioDeOriginais',
  attachedTo: 'Anexada à role **envio-originais**, usada pelo sistema da redação.',
  scenario: { principals: [integ('redacao', 'Sistema da redação')], resources: UPLOADS },
  target: { type: 'identity', principalIds: ['redacao'] },
  palette: {
    actions: ['s3:PutObject', 's3:GetObject', 's3:*'],
    resources: ['arn:aws:s3:::mapa-originais/uploads/*', 'arn:aws:s3:::mapa-originais/*'],
    conditions: [
      { id: 'ip', label: `IpAddress aws:SourceIp ${OFFICE} (escritório)`, clause: { op: 'IpAddress', key: 'aws:SourceIp', values: [OFFICE] } },
      { id: 'notip', label: `NotIpAddress aws:SourceIp ${OFFICE}`, clause: { op: 'NotIpAddress', key: 'aws:SourceIp', values: [OFFICE] } },
      { id: 'https', label: 'Bool aws:SecureTransport = true', clause: { op: 'Bool', key: 'aws:SecureTransport', values: ['true'] } },
      { id: 'http', label: 'Bool aws:SecureTransport = false', clause: { op: 'Bool', key: 'aws:SecureTransport', values: ['false'] } },
      { id: 'region', label: 'StringEquals aws:RequestedRegion = sa-east-1', clause: { op: 'StringEquals', key: 'aws:RequestedRegion', values: ['sa-east-1'] } },
    ],
  },
  maxStatements: 3,
  tests: [
    { id: 't1', label: 'Enviar um original do escritório, por HTTPS', request: { principalId: 'redacao', action: 's3:PutObject', resourceId: 'upload', sourceIp: '203.0.113.40', secureTransport: true, region: 'sa-east-1' }, expect: 'allow', why: 'É o caminho legítimo.', concepts: ['iam.conditions'] },
    { id: 't2', label: 'Enviar de fora do escritório, por HTTPS', request: { principalId: 'redacao', action: 's3:PutObject', resourceId: 'upload', sourceIp: '198.51.100.9', secureTransport: true, region: 'sa-east-1' }, expect: 'deny', why: 'A regra da editora: originais só saem da rede do escritório.', concepts: ['iam.condition-keys'] },
    { id: 't3', label: 'Enviar do escritório, por HTTP sem criptografia', request: { principalId: 'redacao', action: 's3:PutObject', resourceId: 'upload', sourceIp: '203.0.113.40', secureTransport: false, region: 'sa-east-1' }, expect: 'deny', why: 'Originais não podem trafegar sem TLS.', concepts: ['iam.condition-keys'] },
  ],
  probes: [
    { id: 'p1', label: 'Ler um livro já publicado', request: { principalId: 'redacao', action: 's3:GetObject', resourceId: 'publicado', sourceIp: '203.0.113.40', secureTransport: true, region: 'sa-east-1' }, expect: 'deny', why: 'O sistema só envia originais.', concepts: ['iam.least-privilege'] },
    { id: 'p2', label: 'Gravar em publicados/', request: { principalId: 'redacao', action: 's3:PutObject', resourceId: 'publicado', sourceIp: '203.0.113.40', secureTransport: true, region: 'sa-east-1' }, expect: 'deny', why: 'Publicar é outra etapa, com outra role.', concepts: ['iam.least-privilege'] },
  ],
  solution: [{ effect: 'Allow', actions: ['s3:PutObject'], resources: ['arn:aws:s3:::mapa-originais/uploads/*'], principals: [], conditions: ['ip', 'https'] }],
}

const TWO_REGIONS: PolicyStatement = { sid: 'SoDuasRegioes', effect: 'Allow', actions: ['dynamodb:PutItem'], resources: ['*'], conditions: [{ op: 'StringEquals', key: 'aws:RequestedRegion', values: ['sa-east-1', 'us-east-1'] }] }
const HOME: PolicyStatement = { sid: 'MinhaPasta', effect: 'Allow', actions: ['s3:GetObject', 's3:PutObject'], resources: ['arn:aws:s3:::mapa-revisores/${aws:username}/*'] }

const REVISORES: PolicyScenario = {
  principals: [
    { id: 'carla', name: 'carla', kind: 'user', account: ACCT, userName: 'carla', groups: [{ name: 'Revisores', policies: [pol('PastaPessoal', [HOME])] }] },
    { id: 'gui', name: 'gui', kind: 'user', account: ACCT, userName: 'gui', identityPolicies: [pol('Catalogo', [TWO_REGIONS])] },
  ],
  resources: [
    { id: 'rafael', arn: 'arn:aws:s3:::mapa-revisores/rafael/cap-3.docx', account: ACCT, label: 'arquivo na pasta do Rafael' },
    { id: 'tabela', arn: `arn:aws:dynamodb:us-east-1:${ACCT}:table/catalogo`, account: ACCT, label: 'tabela catalogo' },
  ],
}

// ---------------------------------------------------------------------------
// Chefe — menor privilégio para o time de dados

const etl: Principal = { id: 'etl', name: 'Job de ETL', kind: 'role-session', account: ACCT, roleName: 'dados-etl', sessionName: 'job', identityPolicies: [] }
const ETL_RES = [
  { id: 'bruto', arn: 'arn:aws:s3:::mapa-bruto', account: ACCT, label: 'bucket mapa-bruto' },
  { id: 'bruto-obj', arn: 'arn:aws:s3:::mapa-bruto/2026/10/vendas.json', account: ACCT, label: 'dado bruto' },
  { id: 'curado-obj', arn: 'arn:aws:s3:::mapa-curado/2026/10/vendas.parquet', account: ACCT, label: 'dado curado' },
  { id: 'fin-obj', arn: 'arn:aws:s3:::mapa-financeiro/folha.csv', account: ACCT, label: 'planilha da folha' },
]

const BUILDER_BOSS: BuilderLabConfig = {
  kind: 'identity',
  policyName: 'DadosETL',
  attachedTo: 'Anexada à role **dados-etl**, que substitui a antiga política DadosTudo.',
  scenario: { principals: [etl], resources: ETL_RES },
  target: { type: 'identity', principalIds: ['etl'] },
  palette: {
    actions: ['s3:ListBucket', 's3:GetObject', 's3:PutObject', 's3:DeleteObject', 's3:*', '*'],
    resources: ['arn:aws:s3:::mapa-bruto', 'arn:aws:s3:::mapa-bruto/*', 'arn:aws:s3:::mapa-curado/*', 'arn:aws:s3:::mapa-*', 'arn:aws:s3:::*', '*'],
  },
  maxStatements: 4,
  tests: [
    { id: 't1', label: 'Listar o bucket mapa-bruto', request: { principalId: 'etl', action: 's3:ListBucket', resourceId: 'bruto' }, expect: 'allow', why: 'O job descobre os arquivos novos listando o bucket.', concepts: ['iam.arn'] },
    { id: 't2', label: 'Ler um dado bruto', request: { principalId: 'etl', action: 's3:GetObject', resourceId: 'bruto-obj' }, expect: 'allow', why: 'O job lê os dados brutos.', concepts: ['iam.least-privilege'] },
    { id: 't3', label: 'Gravar um dado curado', request: { principalId: 'etl', action: 's3:PutObject', resourceId: 'curado-obj' }, expect: 'allow', why: 'O job grava o resultado em mapa-curado.', concepts: ['iam.least-privilege'] },
  ],
  probes: [
    { id: 'p1', label: 'Gravar em mapa-bruto', request: { principalId: 'etl', action: 's3:PutObject', resourceId: 'bruto-obj' }, expect: 'deny', why: 'O dado bruto é a fonte da verdade: o job não pode alterá-lo.', concepts: ['iam.least-privilege'] },
    { id: 'p2', label: 'Apagar um dado curado', request: { principalId: 'etl', action: 's3:DeleteObject', resourceId: 'curado-obj' }, expect: 'deny', why: 'O CloudTrail mostra que o job nunca apaga nada.', concepts: ['iam.least-privilege'] },
    { id: 'p3', label: 'Ler a planilha da folha', request: { principalId: 'etl', action: 's3:GetObject', resourceId: 'fin-obj' }, expect: 'deny', why: '`arn:aws:s3:::mapa-*` também cobre mapa-financeiro.', concepts: ['iam.wildcards'] },
  ],
  solution: [
    { effect: 'Allow', actions: ['s3:ListBucket'], resources: ['arn:aws:s3:::mapa-bruto'], principals: [], conditions: [] },
    { effect: 'Allow', actions: ['s3:GetObject'], resources: ['arn:aws:s3:::mapa-bruto/*'], principals: [], conditions: [] },
    { effect: 'Allow', actions: ['s3:PutObject'], resources: ['arn:aws:s3:::mapa-curado/*'], principals: [], conditions: [] },
  ],
}

export const F03_IAM: PhaseDef = {
  ...META.f03,
  concepts: [
    'iam.policy-elements',
    'iam.identity-policy',
    'iam.resource-policy',
    'iam.policy-types',
    'iam.arn',
    'iam.wildcards',
    'iam.not-action',
    'iam.managed-vs-inline',
    'iam.conditions',
    'iam.condition-keys',
    'iam.policy-variables',
    'iam.access-levels',
    'iam.least-privilege',
  ],
  availability: 'available',
  simplifications: ['O construtor usa uma paleta de ações, recursos e condições; no console você escreve o JSON livremente.', 'Os endereços IP e as Regiões são premissas dos cenários.'],
  missions: [
    // -----------------------------------------------------------------------
    {
      id: 'iax.f03.m1',
      title: 'Lendo um statement',
      type: 'mission',
      summary: 'Effect, Action, Resource, Condition, ARNs e curingas.',
      briefing: {
        company: 'Mapa Literário',
        role: 'Você entrou no time de plataforma de uma editora digital.',
        situation: 'As políticas da editora foram escritas por várias pessoas ao longo de anos. Antes de mudar qualquer coisa, você precisa ler o que cada uma realmente permite.',
        objective: 'Ler políticas JSON com precisão: elemento por elemento.',
        successCriteria: ['Reconhecer cada elemento', 'Dizer se um statement cobre uma requisição', 'Desconfiar de curingas e de NotAction'],
      },
      intel: [
        { conceptId: 'iam.policy-elements', visual: 'policy-anatomy', body: ['Uma política tem `Version` e uma lista de **statements**. Cada statement: **Effect** (Allow ou Deny), **Action**, **Resource** e, se quiser, **Condition** e um **Sid** (nome). **Principal** só aparece em políticas de recurso. Statements combinam com OU.'] },
        { conceptId: 'iam.arn', body: ['O **ARN** identifica o recurso: `arn:aws:serviço:Região:conta:recurso`. No S3, Região e conta ficam vazias: `arn:aws:s3:::livros` é o bucket e `arn:aws:s3:::livros/*` são os objetos. ListBucket usa o primeiro; GetObject, o segundo.'] },
        { conceptId: 'iam.wildcards', body: ['`*` casa qualquer sequência e `?` casa um caractere. `s3:Get*` cobre GetObject, mas também GetObjectAcl e GetBucketPolicy. Curinga largo dá mais do que parece.'] },
        { conceptId: 'iam.not-action', body: ['**NotAction** vale para tudo, **menos** as ações listadas. Num Deny, cria exceções. Num **Allow**, libera todo o resto da AWS, inclusive serviços lançados no futuro.'] },
      ],
      activities: [
        {
          id: 'iax.f03.m1.a1',
          kind: 'match',
          title: 'Cada elemento, uma pergunta',
          prompt: 'Associe cada elemento do statement à pergunta que ele responde.',
          concepts: [{ id: 'iam.policy-elements' }],
          xp: 50,
          difficulty: 1,
          explanation: ['Ler um statement é responder: permite ou nega, quem, o quê, onde e quando.'],
          leftLabel: 'Elemento',
          rightLabel: 'Responde',
          pairs: [
            { id: 'effect', left: 'Effect', right: 'Permite ou nega?', explanation: 'Allow ou Deny; não há outro valor.' },
            { id: 'principal', left: 'Principal', right: 'Para quem? (só em políticas de recurso)', explanation: 'Em políticas de identidade, o principal é a própria identidade.' },
            { id: 'action', left: 'Action', right: 'Que operações?', explanation: 'No formato serviço:Ação, como s3:GetObject.' },
            { id: 'resource', left: 'Resource', right: 'Em quais recursos (ARNs)?', explanation: 'Um ou mais ARNs, com curingas se necessário.' },
            { id: 'condition', left: 'Condition', right: 'Em que circunstâncias vale?', explanation: 'Compara chaves da requisição, como IP, HTTPS ou tags.' },
            { id: 'sid', left: 'Sid', right: 'Qual é o nome deste statement?', explanation: 'Identificador opcional, útil para ler e auditar.' },
          ],
        },
        {
          id: 'iax.f03.m1.a2',
          kind: 'classify',
          title: 'O statement cobre?',
          prompt: 'O statement abaixo está anexado a um usuário. Para cada requisição dele, o statement se aplica?',
          concepts: [{ id: 'iam.wildcards' }, { id: 'iam.arn', weight: 0.5 }],
          xp: 50,
          difficulty: 2,
          exhibits: [exhibit('Statement LerEpubs', [READ_EPUB])],
          explanation: ['Ação e recurso precisam casar ao mesmo tempo. `s3:Get*` casa qualquer ação que comece com Get; o recurso só cobre objetos dentro de epub/.'],
          bins: [
            { id: 'yes', label: 'Se aplica (permite)' },
            { id: 'no', label: 'Não se aplica' },
          ],
          items: [
            { id: 'get', text: 's3:GetObject em mapa-livros/epub/dom-casmurro.epub', bin: 'yes', explanation: 'GetObject casa Get* e o objeto está em epub/.' },
            { id: 'acl', text: 's3:GetObjectAcl em mapa-livros/epub/dom-casmurro.epub', bin: 'yes', explanation: 'GetObjectAcl também começa com Get: o curinga libera mais do que leitura do conteúdo.' },
            { id: 'put', text: 's3:PutObject em mapa-livros/epub/novo.epub', bin: 'no', explanation: 'PutObject não começa com Get.' },
            { id: 'pdf', text: 's3:GetObject em mapa-livros/pdf/dom-casmurro.pdf', bin: 'no', explanation: 'O objeto está em pdf/, fora do recurso.' },
            { id: 'list', text: 's3:ListBucket no bucket mapa-livros', bin: 'no', explanation: 'ListBucket não começa com Get e usa o ARN do bucket, que não está no Resource.' },
          ],
        },
        {
          id: 'iax.f03.m1.a3',
          kind: 'decision',
          title: 'O ARN certo para listar',
          prompt: 'O painel precisa **listar** os arquivos do bucket `mapa-livros`. Qual Resource usar no statement com `s3:ListBucket`?',
          concepts: [{ id: 'iam.arn' }],
          xp: 30,
          difficulty: 2,
          explanation: ['ListBucket é uma ação sobre o bucket: o recurso é o ARN do bucket, sem /*. Ações sobre objetos usam o ARN do bucket seguido de /chave.'],
          options: [
            { id: 'a', text: '`arn:aws:s3:::mapa-livros`', correct: true, consequence: 'A listagem funciona e fica restrita a este bucket.' },
            { id: 'b', text: '`arn:aws:s3:::mapa-livros/*`', correct: false, consequence: 'Esse ARN cobre os objetos, não o bucket: a listagem é negada.' },
            { id: 'c', text: '`arn:aws:s3:us-east-1:333344445555:mapa-livros`', correct: false, consequence: 'ARNs de bucket do S3 não têm Região nem conta.' },
          ],
        },
        {
          id: 'iax.f03.m1.a4',
          kind: 'predict',
          title: 'Tudo menos o IAM',
          prompt: 'A estagiária Íris recebeu a política abaixo, escrita para "deixá-la longe do IAM". Ela pede `s3:DeleteBucket` no bucket mapa-livros. O que acontece?',
          concepts: [{ id: 'iam.not-action' }],
          xp: 40,
          difficulty: 3,
          exhibits: [exhibit('Política Estagiaria', [NOT_ACTION_ALLOW])],
          explanation: ['Allow com NotAction permite **todas as ações exceto** as listadas. Íris pode apagar buckets, criar instâncias e tudo o que não for IAM. Para "tudo menos o IAM" com segurança, use um Allow restrito ou um Deny com NotAction.'],
          spec: { sim: 'policy', scenario: LEITORA, request: { principalId: 'iris', action: 's3:DeleteBucket', resourceId: 'bucket' } },
          options: DECISION_OPTIONS,
        },
      ],
      debrief: { takeaways: ['Effect, Action, Resource e Condition: todos precisam casar para o statement se aplicar.', 'ARN do bucket para ações de bucket; ARN/* para ações de objeto.', 'Curingas e NotAction num Allow costumam liberar mais do que se imagina.'] },
    },
    // -----------------------------------------------------------------------
    {
      id: 'iax.f03.m2',
      title: 'Onde a política mora',
      type: 'mission',
      summary: 'Identidade ou recurso; gerenciada pela AWS, pelo cliente ou inline.',
      briefing: {
        company: 'Mapa Literário',
        role: 'Você continua organizando as políticas da editora.',
        situation: 'Há 40 cópias da mesma política inline espalhadas por roles, uma bucket policy que ninguém sabe onde editar e uma discussão sobre usar ou não as políticas prontas da AWS.',
        objective: 'Escolher o tipo certo de política para cada caso.',
        successCriteria: ['Distinguir identidade e recurso', 'Escolher entre gerenciada e inline', 'Saber quais políticas concedem e quais só limitam'],
      },
      intel: [
        { conceptId: 'iam.identity-policy', body: ['A política de **identidade** fica no usuário, grupo ou role e diz o que ele pode fazer. Não tem Principal.'] },
        { conceptId: 'iam.resource-policy', body: ['A política de **recurso** fica no recurso (bucket, chave KMS, fila, a trust policy de uma role). Tem **Principal**, é **sempre inline** e pode conceder acesso a **outras contas**.'] },
        { conceptId: 'iam.managed-vs-inline', body: ['**Gerenciada pela AWS**: pronta e mantida pela AWS, não editável. **Gerenciada pelo cliente**: sua, reutilizável. **Inline**: embutida numa identidade só e apagada com ela. Se serve a mais de uma identidade, prefira gerenciada.'] },
        { conceptId: 'iam.policy-types', body: ['Concedem: políticas de **identidade** e de **recurso** (e ACLs). Só limitam: **permissions boundary**, **SCP**, **RCP** e **session policy**. Um limite nunca dá acesso sozinho.'] },
      ],
      activities: [
        {
          id: 'iax.f03.m2.a1',
          kind: 'classify',
          title: 'Identidade ou recurso?',
          prompt: 'Classifique cada característica.',
          concepts: [{ id: 'iam.resource-policy' }, { id: 'iam.identity-policy' }],
          xp: 50,
          difficulty: 2,
          explanation: ['A diferença está em onde a política fica e em quem ela cita: a de recurso precisa dizer quem (Principal); a de identidade já sabe quem é.'],
          bins: [
            { id: 'identity', label: 'Política de identidade' },
            { id: 'resource', label: 'Política de recurso' },
          ],
          items: [
            { id: 'principal', text: 'Tem o elemento Principal', bin: 'resource', explanation: 'Ela precisa dizer quem recebe o acesso.', concepts: ['iam.resource-policy'] },
            { id: 'inline', text: 'É sempre inline', bin: 'resource', explanation: 'Fica embutida no próprio recurso.', concepts: ['iam.resource-policy'] },
            { id: 'trust', text: 'A trust policy de uma role', bin: 'resource', explanation: 'A role é o recurso; a trust policy diz quem pode assumi-la.', concepts: ['iam.resource-policy'] },
            { id: 'cross', text: 'Sozinha, pode citar uma conta de fora como quem recebe o acesso', bin: 'resource', explanation: 'É ela que abre o recurso para outra conta (a outra conta ainda precisa permitir do lado dela).', concepts: ['iam.resource-policy'] },
            { id: 'group', text: 'Pode ser anexada a um grupo', bin: 'identity', explanation: 'Grupos recebem políticas de identidade.', concepts: ['iam.identity-policy'] },
            { id: 'reuse', text: 'Pode ser gerenciada e reutilizada em várias roles', bin: 'identity', explanation: 'Políticas gerenciadas são políticas de identidade.', concepts: ['iam.identity-policy'] },
          ],
        },
        {
          id: 'iax.f03.m2.a2',
          kind: 'classify',
          title: 'Qual tipo de política?',
          prompt: 'Escolha o tipo de política de identidade para cada caso.',
          concepts: [{ id: 'iam.managed-vs-inline' }],
          xp: 50,
          difficulty: 2,
          explanation: ['Reutilização pede gerenciada; um vínculo exclusivo, que deve sumir junto com a identidade, pede inline; para começar rápido em funções comuns, a AWS oferece políticas prontas.'],
          bins: [
            { id: 'aws', label: 'Gerenciada pela AWS' },
            { id: 'customer', label: 'Gerenciada pelo cliente' },
            { id: 'inline', label: 'Inline' },
          ],
          items: [
            { id: 'copies', text: 'A mesma permissão de leitura, ajustada à editora, usada por 40 roles', bin: 'customer', explanation: 'Uma política sua, mantida num lugar só e anexada às 40 roles.' },
            { id: 'start', text: 'Dar acesso só de leitura a todos os serviços para a auditoria, rápido, sem escrever JSON', bin: 'aws', explanation: 'Políticas prontas como ReadOnlyAccess são mantidas pela AWS, inclusive quando surgem serviços novos.' },
            { id: 'only', text: 'Uma exceção que vale para uma única role e deve sumir quando ela for apagada', bin: 'inline', explanation: 'Inline mantém a relação um para um e é apagada junto com a identidade.' },
            { id: 'edit', text: 'Uma política pronta que precisa de um ajuste nas ações', bin: 'customer', explanation: 'Políticas da AWS não são editáveis: copie e ajuste numa política sua.' },
          ],
        },
        {
          id: 'iax.f03.m2.a3',
          kind: 'classify',
          title: 'Concede ou só limita?',
          prompt: 'Classifique cada tipo de política.',
          concepts: [{ id: 'iam.policy-types' }],
          xp: 50,
          difficulty: 2,
          explanation: ['Limites definem o máximo; o acesso em si vem de uma política de identidade ou de recurso.'],
          bins: [
            { id: 'grants', label: 'Pode conceder acesso' },
            { id: 'limits', label: 'Só limita' },
          ],
          items: [
            { id: 'id', text: 'Política de identidade', bin: 'grants', explanation: 'Concede ao usuário, grupo ou role.' },
            { id: 'res', text: 'Bucket policy', bin: 'grants', explanation: 'Política de recurso: concede aos principais citados.' },
            { id: 'pb', text: 'Permissions boundary', bin: 'limits', explanation: 'Define o máximo de um usuário ou role.' },
            { id: 'scp', text: 'SCP do Organizations', bin: 'limits', explanation: 'Define o máximo para os principais das contas.' },
            { id: 'rcp', text: 'RCP do Organizations', bin: 'limits', explanation: 'Define o máximo para os recursos das contas.' },
            { id: 'sess', text: 'Session policy', bin: 'limits', explanation: 'Restringe uma sessão temporária.' },
          ],
        },
      ],
      debrief: { takeaways: ['Identidade: o que eu posso fazer. Recurso: quem pode fazer o quê comigo.', 'Reutilizável: gerenciada. Exclusiva da identidade: inline.', 'Boundary, SCP, RCP e session policy só limitam.'] },
    },
    // -----------------------------------------------------------------------
    {
      id: 'iax.f03.m3',
      title: 'Primeira política do zero',
      type: 'mission',
      summary: 'Monte uma política de leitura com menor privilégio.',
      briefing: {
        company: 'Mapa Literário',
        role: 'Você vai escrever a política do painel de vendas.',
        situation: 'O painel lê relatórios do bucket mapa-relatorios. Alguém sugeriu `s3:*` em `*` "para não dar erro".',
        objective: 'Dar ao painel só o que ele usa.',
        successCriteria: ['O painel lista e lê os relatórios', 'Não grava, não apaga e não vê outros buckets'],
      },
      intel: [
        { conceptId: 'iam.least-privilege', body: ['**Menor privilégio**: só as ações e os recursos de que a tarefa precisa. Comece pelo que a aplicação faz (listar e ler) e pelos recursos exatos (o bucket e os objetos dele).'] },
        { conceptId: 'iam.access-levels', body: ['As ações se dividem em **List**, **Read**, **Write**, **Permissions management** e **Tagging**. Um painel de leitura precisa de List e Read; nunca de Permissions management.'] },
      ],
      activities: [
        {
          id: 'iax.f03.m3.a1',
          kind: 'lab',
          lab: 'policy-builder',
          title: 'Leitura do painel',
          prompt: 'Monte a política **LeituraRelatorios**. Os testes e as sondas de menor privilégio à direita mostram o efeito de cada peça.',
          concepts: [{ id: 'iam.least-privilege' }, { id: 'iam.arn' }, { id: 'iam.wildcards', weight: 0.5 }, { id: 'iam.identity-policy', weight: 0.5 }, { id: 'iam.policy-elements', weight: 0.5 }],
          xp: 140,
          difficulty: 2,
          hints: ['ListBucket e GetObject usam ARNs diferentes.', 'Dois statements deixam a política mais clara: um para o bucket, outro para os objetos.'],
          explanation: ['Solução: Allow `s3:ListBucket` em `arn:aws:s3:::mapa-relatorios` e Allow `s3:GetObject` em `arn:aws:s3:::mapa-relatorios/*`.'],
          config: BUILDER_READ,
        },
        {
          id: 'iax.f03.m3.a2',
          kind: 'classify',
          title: 'Qual nível de acesso?',
          prompt: 'Classifique cada ação pelo nível de acesso.',
          concepts: [{ id: 'iam.access-levels' }],
          xp: 40,
          difficulty: 2,
          explanation: ['Permissions management é o nível mais sensível: quem muda políticas pode se dar mais acesso.'],
          bins: [
            { id: 'list', label: 'List' },
            { id: 'read', label: 'Read' },
            { id: 'write', label: 'Write' },
            { id: 'perm', label: 'Permissions management' },
          ],
          items: [
            { id: 'lb', text: 's3:ListBucket', bin: 'list', explanation: 'Lista o conteúdo do bucket.' },
            { id: 'go', text: 's3:GetObject', bin: 'read', explanation: 'Lê o conteúdo de um objeto.' },
            { id: 'po', text: 's3:PutObject', bin: 'write', explanation: 'Grava um objeto.' },
            { id: 'pbp', text: 's3:PutBucketPolicy', bin: 'perm', explanation: 'Muda quem pode acessar o bucket.' },
            { id: 'aup', text: 'iam:AttachUserPolicy', bin: 'perm', explanation: 'Anexa permissões a um usuário.' },
          ],
        },
      ],
      debrief: { takeaways: ['Ações exatas e recursos exatos.', 'Sondas de menor privilégio mostram o que a política libera sem querer.'] },
    },
    // -----------------------------------------------------------------------
    {
      id: 'iax.f03.m4',
      title: 'Condições',
      type: 'mission',
      summary: 'IP, HTTPS, Região, variáveis e a lógica E/OU.',
      briefing: {
        company: 'Mapa Literário',
        role: 'Você cuida do envio de originais dos autores.',
        situation: 'Os originais são o bem mais valioso da editora. A diretoria quer que eles só cheguem ao S3 a partir do escritório e sempre por HTTPS.',
        objective: 'Usar condições para restringir o "quando" de uma permissão.',
        successCriteria: ['Montar a política com IP e HTTPS', 'Prever a lógica de vários valores', 'Usar variáveis de política'],
      },
      intel: [
        { conceptId: 'iam.conditions', body: ['No bloco **Condition**, operadores diferentes e chaves diferentes combinam com **E**; vários valores da mesma chave, com **OU**. Chave ausente na requisição: condição falsa, exceto nos operadores negados e no `…IfExists`.'] },
        { conceptId: 'iam.condition-keys', body: ['Chaves globais úteis: `aws:SourceIp`, `aws:SecureTransport` (HTTPS), `aws:RequestedRegion` e `aws:PrincipalOrgID`. SecureTransport e RequestedRegion estão sempre presentes; SourceIp some quando a requisição chega por um VPC endpoint.'] },
        { conceptId: 'iam.policy-variables', body: ['**Variáveis** como `${aws:username}` viram o valor da requisição. Com `arn:aws:s3:::home/${aws:username}/*`, uma única política dá a cada pessoa a própria pasta.'] },
      ],
      activities: [
        {
          id: 'iax.f03.m4.a1',
          kind: 'lab',
          lab: 'policy-builder',
          title: 'Originais só do escritório',
          prompt: 'Monte a política **EnvioDeOriginais**: só envio (PutObject) em uploads/, do escritório (`203.0.113.0/24`) e por HTTPS.',
          concepts: [{ id: 'iam.conditions' }, { id: 'iam.condition-keys' }, { id: 'iam.least-privilege', weight: 0.5 }],
          xp: 140,
          difficulty: 3,
          hints: ['Duas condições no mesmo statement combinam com E.', 'A condição de Região não faz parte do pedido.'],
          explanation: ['Solução: Allow `s3:PutObject` em `arn:aws:s3:::mapa-originais/uploads/*` com `IpAddress aws:SourceIp 203.0.113.0/24` e `Bool aws:SecureTransport = true`.'],
          config: BUILDER_COND,
        },
        {
          id: 'iax.f03.m4.a2',
          kind: 'predict',
          title: 'Duas Regiões na mesma chave',
          prompt: 'O usuário gui tem a política abaixo e grava um item numa tabela chamando o endpoint de **us-east-1**. O que acontece?',
          concepts: [{ id: 'iam.conditions' }],
          xp: 40,
          difficulty: 2,
          exhibits: [exhibit('Política Catalogo', [TWO_REGIONS])],
          explanation: ['Vários valores para a mesma chave combinam com OU: basta a Região chamada ser uma delas.'],
          spec: { sim: 'policy', scenario: REVISORES, request: { principalId: 'gui', action: 'dynamodb:PutItem', resourceId: 'tabela', region: 'us-east-1' } },
          options: DECISION_OPTIONS,
        },
        {
          id: 'iax.f03.m4.a3',
          kind: 'predict',
          title: 'A pasta do colega',
          prompt: 'A revisora **carla** pertence ao grupo Revisores, com a política abaixo. Ela tenta ler um arquivo na pasta do **Rafael**. O que acontece?',
          concepts: [{ id: 'iam.policy-variables' }],
          xp: 40,
          difficulty: 2,
          exhibits: [exhibit('Política PastaPessoal (grupo Revisores)', [HOME])],
          explanation: ['Para a carla, o recurso vira `arn:aws:s3:::mapa-revisores/carla/*`. A pasta do Rafael não casa, e nada mais permite: deny implícito.'],
          spec: { sim: 'policy', scenario: REVISORES, request: { principalId: 'carla', action: 's3:GetObject', resourceId: 'rafael' } },
          options: DECISION_OPTIONS,
        },
      ],
      debrief: { takeaways: ['Condições diferentes: E. Valores da mesma chave: OU.', 'IP e HTTPS restringem o "de onde" e o "como".', 'Variáveis de política evitam uma política por pessoa.'] },
    },
    // -----------------------------------------------------------------------
    {
      id: 'iax.f03.boss',
      title: 'Chefe: Menor privilégio para o time de dados',
      type: 'boss',
      summary: 'Troque uma política "pode tudo" pelo que o job realmente usa.',
      passThreshold: 0.7,
      bonusXp: 120,
      briefing: {
        company: 'Mapa Literário',
        role: 'Você revisa as permissões do time de dados.',
        situation: 'O job de ETL roda com a política DadosTudo desde o primeiro dia. A auditoria pediu que ele tenha só o que usa, e o CloudTrail dos últimos 90 dias mostra o que ele faz.',
        objective: 'Descobrir o que o job usa e escrever a política mínima.',
        successCriteria: ['Ler a política atual e o uso real', 'Escrever a política mínima', 'Não quebrar o job'],
      },
      intel: [],
      activities: [
        {
          id: 'iax.f03.boss.a1',
          kind: 'investigate',
          title: 'O que o job usa de verdade?',
          prompt: 'Compare a política atual com o que o CloudTrail registrou em 90 dias.',
          concepts: [{ id: 'iam.least-privilege' }, { id: 'iam.wildcards', weight: 0.5 }],
          xp: 90,
          difficulty: 2,
          explanation: ['A política concede todas as ações de três serviços em todos os recursos, mas o job só lista e lê mapa-bruto e grava em mapa-curado. Todo o resto é risco sem uso.', 'O IAM Access Analyzer consegue gerar uma política a partir dessa atividade registrada no CloudTrail; é um bom ponto de partida para revisar.'],
          artifacts: [
            {
              id: 'policy',
              title: 'Política DadosTudo',
              format: 'code',
              lines: [
                { id: 'p1', text: '"Effect": "Allow",', isIssue: false, explanation: 'Allow é esperado numa política de identidade.' },
                { id: 'p2', text: '"Action": ["s3:*", "glue:*", "athena:*"],', isIssue: true, explanation: 'Todas as ações de três serviços, inclusive apagar e mudar políticas de buckets.' },
                { id: 'p3', text: '"Resource": "*"', isIssue: true, explanation: 'Todos os buckets da conta, inclusive mapa-financeiro.' },
              ],
            },
            {
              id: 'trail',
              title: 'CloudTrail, 90 dias (resumo)',
              format: 'table',
              lines: [
                { id: 'c1', text: 's3:ListBucket · mapa-bruto · 2.160 chamadas', isIssue: false, explanation: 'Uso real: precisa continuar permitido.' },
                { id: 'c2', text: 's3:GetObject · mapa-bruto/* · 41.300 chamadas', isIssue: false, explanation: 'Uso real: precisa continuar permitido.' },
                { id: 'c3', text: 's3:PutObject · mapa-curado/* · 2.160 chamadas', isIssue: false, explanation: 'Uso real: precisa continuar permitido.' },
                { id: 'c4', text: 'glue:* e athena:* · nenhuma chamada', isIssue: true, explanation: 'Permissões concedidas e nunca usadas.' },
                { id: 'c5', text: 's3:DeleteObject e s3:PutBucketPolicy · nenhuma chamada', isIssue: true, explanation: 'O job nunca apaga nem muda políticas, mas poderia.' },
              ],
            },
          ],
          rootCause: {
            prompt: 'Qual é o problema da política atual?',
            options: [
              { id: 'r1', text: 'Concede muito mais ações e recursos do que o job usa.', correct: true, feedback: 'Isso: menor privilégio é conceder só o que o CloudTrail mostra em uso.' },
              { id: 'r2', text: 'Falta um Deny explícito para mapa-financeiro, e só isso.', correct: false, feedback: 'Um Deny ajudaria nesse bucket, mas o resto do excesso continuaria.' },
              { id: 'r3', text: 'A política deveria ser inline.', correct: false, feedback: 'Inline ou gerenciada não muda o que ela permite.' },
            ],
          },
          remediations: {
            prompt: 'O que fazer? (selecione todas as adequadas)',
            options: [
              { id: 'f1', text: 'Escrever uma política com ListBucket e GetObject em mapa-bruto e PutObject em mapa-curado.', correct: true, feedback: 'Cobre exatamente o uso registrado.' },
              { id: 'f2', text: 'Gerar uma política a partir do CloudTrail com o IAM Access Analyzer e revisá-la.', correct: true, feedback: 'O Access Analyzer gera a política com base na atividade; você revisa antes de aplicar.' },
              { id: 'f3', text: 'Trocar s3:* por s3:Get* e manter Resource "*".', correct: false, feedback: 'Ainda libera ler todos os buckets e não permite gravar em mapa-curado.' },
              { id: 'f4', text: 'Manter a política e ligar alertas para chamadas incomuns.', correct: false, feedback: 'Alertas avisam depois; o acesso excessivo continua.' },
            ],
          },
        },
        {
          id: 'iax.f03.boss.a2',
          kind: 'lab',
          lab: 'policy-builder',
          title: 'A política mínima do ETL',
          prompt: 'Monte a política **DadosETL**. O job precisa listar e ler mapa-bruto e gravar em mapa-curado. Cuidado com curingas que pegam buckets demais.',
          concepts: [{ id: 'iam.least-privilege' }, { id: 'iam.wildcards' }, { id: 'iam.arn', weight: 0.5 }, { id: 'iam.identity-policy', weight: 0.5 }],
          xp: 160,
          difficulty: 3,
          hints: ['`arn:aws:s3:::mapa-*` cobre todo bucket que começa com mapa-, inclusive mapa-financeiro.', 'Três statements: listar, ler e gravar, cada um no seu recurso.'],
          explanation: ['Solução: Allow `s3:ListBucket` em `arn:aws:s3:::mapa-bruto`; Allow `s3:GetObject` em `arn:aws:s3:::mapa-bruto/*`; Allow `s3:PutObject` em `arn:aws:s3:::mapa-curado/*`.'],
          config: BUILDER_BOSS,
        },
      ],
      debrief: { takeaways: ['O uso real (CloudTrail) é a medida do menor privilégio.', 'Curingas em nomes de bucket pegam buckets que você não pretendia.', 'O Access Analyzer gera políticas a partir da atividade registrada.'] },
    },
  ],
}
