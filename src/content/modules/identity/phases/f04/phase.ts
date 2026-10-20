/**
 * Fase 4 — Como a AWS decide. O fluxo de avaliação, mesma conta × entre
 * contas, o tipo de principal na política de recurso e as exceções.
 */
import type { PhaseDef } from '../../../../../engine/types'
import type { LayersLabConfig } from '../../../../../simulators/policy/layers'
import type { PolicyScenario, PolicyStatement } from '../../../../../simulators/policy/model'
import { DECISION_OPTIONS, exhibit, pol } from '../shared'
import { META } from '../meta'

const SABIA = '111111111111'
const PONTE = '222222222222'
const APOLICES = 'arn:aws:s3:::sabia-apolices'

// ---------------------------------------------------------------------------
// Missão 1 — implícito e explícito

const S3_ALL: PolicyStatement = { sid: 'TudoNoS3', effect: 'Allow', actions: ['s3:*'], resources: ['*'] }
const DENY_DELETE: PolicyStatement = { sid: 'NinguemApaga', effect: 'Deny', principals: ['*'], actions: ['s3:DeleteObject'], resources: [`${APOLICES}/*`] }
const GROUP_READ: PolicyStatement = { sid: 'LerApolices', effect: 'Allow', actions: ['s3:GetObject'], resources: [`${APOLICES}/*`] }
const DENY_SINISTROS: PolicyStatement = { sid: 'ForaDosSinistros', effect: 'Deny', actions: ['s3:*'], resources: [`${APOLICES}/sinistros/*`] }

const M1: PolicyScenario = {
  principals: [
    { id: 'app', name: 'app-cotacao', kind: 'role-session', account: SABIA, roleName: 'app-cotacao', sessionName: 'i-0a1', identityPolicies: [pol('AppPolicy', [S3_ALL])] },
    { id: 'novo', name: 'novo.analista', kind: 'user', account: SABIA, userName: 'novo.analista', identityPolicies: [] },
    { id: 'joao', name: 'joao', kind: 'user', account: SABIA, userName: 'joao', identityPolicies: [pol('RestricaoJoao', [DENY_SINISTROS])], groups: [{ name: 'Atendimento', policies: [pol('Atendimento', [GROUP_READ])] }] },
  ],
  resources: [
    { id: 'ap', arn: `${APOLICES}/2026/ap-77.pdf`, account: SABIA, label: 'apólice', policy: pol('BucketPolicy', [DENY_DELETE]) },
    { id: 'sin', arn: `${APOLICES}/sinistros/s-12.pdf`, account: SABIA, label: 'processo de sinistro' },
  ],
}

// ---------------------------------------------------------------------------
// Missão 2 — identidade e recurso (laboratório de camadas)

const OBJ = `${APOLICES}/2026/ap-77.pdf`

const LAB_SAME: LayersLabConfig = {
  scenario: {
    principals: [
      { id: 'ana', name: 'ana', description: 'analista de apólices', kind: 'user', account: SABIA, userName: 'ana', identityPolicies: [] },
      { id: 'estag', name: 'estagiario', description: 'sem nenhuma política', kind: 'user', account: SABIA, userName: 'estagiario', identityPolicies: [] },
      { id: 'app', name: 'app-cotacao', description: 'role do sistema de cotação', kind: 'role-session', account: SABIA, roleName: 'app-cotacao', sessionName: 'i-0a1', identityPolicies: [pol('AppLeitura', [GROUP_READ])] },
    ],
    resources: [{ id: 'ap', arn: OBJ, account: SABIA, label: 'apólice' }],
  },
  libraries: [
    {
      id: 'bucket',
      title: 'Bucket policy de sabia-apolices',
      policyName: 'BucketPolicy',
      target: { type: 'resource', resourceId: 'ap' },
      statements: [
        { sid: 'TodosLeem', effect: 'Allow', principals: ['*'], actions: ['s3:GetObject'], resources: [`${APOLICES}/*`], note: 'Leitura para qualquer um, inclusive anônimos.' },
        { sid: 'AnaLeitura', effect: 'Allow', principals: [{ aws: `arn:aws:iam::${SABIA}:user/ana` }], actions: ['s3:GetObject'], resources: [`${APOLICES}/*`] },
        { sid: 'ContaLeitura', effect: 'Allow', principals: [{ aws: SABIA }], actions: ['s3:GetObject'], resources: [`${APOLICES}/*`], note: 'Delega à conta: cada identidade ainda precisa de política própria.' },
        { sid: 'SomenteHTTPS', effect: 'Deny', principals: ['*'], actions: ['s3:*'], resources: [`${APOLICES}/*`], conditions: [{ op: 'Bool', key: 'aws:SecureTransport', values: ['false'] }] },
      ],
      initial: ['TodosLeem'],
    },
    {
      id: 'ana',
      title: 'Política de identidade da ana',
      policyName: 'AnaPolicy',
      target: { type: 'identity', principalId: 'ana' },
      statements: [S3_ALL, { ...GROUP_READ, sid: 'LerApolicesAna' }],
      initial: ['TudoNoS3'],
    },
  ],
  rows: ['ana', 'estag', 'app'],
  requests: [
    { id: 'get', label: 'Ler apólice (HTTPS)', action: 's3:GetObject', resourceId: 'ap' },
    { id: 'http', label: 'Ler apólice (HTTP)', action: 's3:GetObject', resourceId: 'ap', secureTransport: false },
    { id: 'del', label: 'Apagar apólice', action: 's3:DeleteObject', resourceId: 'ap' },
  ],
  goals: [
    { principalId: 'ana', requestId: 'get', expect: 'allow', why: 'A analista lê apólices.', concepts: ['iam.same-account'] },
    { principalId: 'ana', requestId: 'http', expect: 'deny', why: 'Apólices só trafegam por HTTPS.', concepts: ['iam.policy-evaluation'] },
    { principalId: 'ana', requestId: 'del', expect: 'deny', why: 'Ninguém apaga apólices pelo dia a dia.', concepts: ['iam.same-account'] },
    { principalId: 'estag', requestId: 'get', expect: 'deny', why: 'O estagiário não tem acesso às apólices.', concepts: ['iam.grant-principal-type'] },
    { principalId: 'app', requestId: 'get', expect: 'allow', why: 'O sistema de cotação lê apólices pela política de identidade da role.', concepts: ['iam.same-account'] },
  ],
  solution: { active: { bucket: ['AnaLeitura', 'SomenteHTTPS'], ana: [] } },
}

// ---------------------------------------------------------------------------
// Missão 3 — duas contas

const COTACOES = 'arn:aws:s3:::sabia-cotacoes'

const LAB_CROSS: LayersLabConfig = {
  scenario: {
    principals: [
      { id: 'corretor', name: 'role corretor', description: 'Corretora Ponte (outra conta)', kind: 'role-session', account: PONTE, roleName: 'corretor', sessionName: 'app-ponte', identityPolicies: [] },
      { id: 'temp', name: 'temp.ponte', description: 'usuário da Ponte com acesso amplo', kind: 'user', account: PONTE, userName: 'temp.ponte', identityPolicies: [pol('PonteAdmin', [{ sid: 'Tudo', effect: 'Allow', actions: ['*'], resources: ['*'] }])] },
      { id: 'lia', name: 'lia', description: 'analista da própria Sabiá', kind: 'user', account: SABIA, userName: 'lia', identityPolicies: [pol('LiaLeitura', [{ sid: 'LerCotacoes', effect: 'Allow', actions: ['s3:GetObject'], resources: [`${COTACOES}/*`] }])] },
    ],
    resources: [{ id: 'cot', arn: `${COTACOES}/2026/c-501.json`, account: SABIA, label: 'cotação' }],
  },
  libraries: [
    {
      id: 'bucket',
      title: 'Bucket policy de sabia-cotacoes (conta Sabiá)',
      policyName: 'CotacoesPolicy',
      target: { type: 'resource', resourceId: 'cot' },
      statements: [
        { sid: 'PonteTudo', effect: 'Allow', principals: [{ aws: PONTE }], actions: ['s3:*'], resources: [`${COTACOES}/*`], note: 'Um colega concedeu tudo à conta da corretora.' },
        { sid: 'PonteContaLeitura', effect: 'Allow', principals: [{ aws: PONTE }], actions: ['s3:GetObject'], resources: [`${COTACOES}/*`] },
        { sid: 'CorretorLeitura', effect: 'Allow', principals: [{ aws: `arn:aws:iam::${PONTE}:role/corretor` }], actions: ['s3:GetObject'], resources: [`${COTACOES}/*`] },
      ],
      initial: ['PonteTudo'],
    },
    {
      id: 'corretor',
      title: 'Política de identidade da role corretor (conta Ponte)',
      policyName: 'CorretorPolicy',
      target: { type: 'identity', principalId: 'corretor' },
      statements: [
        { sid: 'TudoNoS3', effect: 'Allow', actions: ['s3:*'], resources: ['*'] },
        { sid: 'LerCotacoesSabia', effect: 'Allow', actions: ['s3:GetObject'], resources: [`${COTACOES}/*`] },
      ],
      initial: ['TudoNoS3'],
    },
  ],
  rows: ['corretor', 'temp', 'lia'],
  requests: [
    { id: 'get', label: 'Ler cotação', action: 's3:GetObject', resourceId: 'cot' },
    { id: 'put', label: 'Gravar cotação', action: 's3:PutObject', resourceId: 'cot' },
  ],
  goals: [
    { principalId: 'corretor', requestId: 'get', expect: 'allow', why: 'A corretora parceira lê as cotações: a bucket policy concede e a identidade na Ponte permite.', concepts: ['iam.cross-account'] },
    { principalId: 'corretor', requestId: 'put', expect: 'deny', why: 'A corretora só lê.', concepts: ['iam.cross-account'] },
    { principalId: 'temp', requestId: 'get', expect: 'deny', why: 'Só a role corretor deve entrar; conceder à conta inteira deixa qualquer identidade com permissão na Ponte entrar.', concepts: ['iam.grant-principal-type'] },
    { principalId: 'lia', requestId: 'get', expect: 'allow', why: 'Na própria conta, a identidade da lia basta.', concepts: ['iam.same-account'] },
  ],
  solution: { active: { bucket: ['CorretorLeitura'], corretor: ['LerCotacoesSabia'] } },
}

const PRINCIPAL_TYPES: PolicyScenario = {
  principals: [
    {
      id: 'sessao',
      name: 'sessão da role analista',
      kind: 'role-session',
      account: SABIA,
      roleName: 'analista',
      sessionName: 'bia',
      identityPolicies: [],
      sessionPolicy: pol('SessaoSoEC2', [{ sid: 'Ec2', effect: 'Allow', actions: ['ec2:Describe*'], resources: ['*'] }]),
    },
  ],
  resources: [
    { id: 'porRole', arn: `${APOLICES}/2026/ap-1.pdf`, account: SABIA, label: 'apólice', policy: pol('BucketPolicy', [{ sid: 'Analista', effect: 'Allow', principals: [{ aws: `arn:aws:iam::${SABIA}:role/analista` }], actions: ['s3:GetObject'], resources: [`${APOLICES}/*`] }]) },
    { id: 'porSessao', arn: `${APOLICES}/2026/ap-1.pdf`, account: SABIA, label: 'apólice', policy: pol('BucketPolicy', [{ sid: 'SessaoBia', effect: 'Allow', principals: [{ aws: `arn:aws:sts::${SABIA}:assumed-role/analista/bia` }], actions: ['s3:GetObject'], resources: [`${APOLICES}/*`] }]) },
  ],
}

// ---------------------------------------------------------------------------
// Chefe — AccessDenied misterioso (KMS)

const KEY = `arn:aws:kms:sa-east-1:${SABIA}:key/1234abcd-12ab-34cd-56ef-1234567890ab`

const LAB_KMS: LayersLabConfig = {
  scenario: {
    principals: [
      { id: 'sinistros', name: 'processa-sinistros', description: 'role da função Lambda', kind: 'role-session', account: SABIA, roleName: 'processa-sinistros', sessionName: 'lambda', identityPolicies: [pol('SinistrosPolicy', [{ sid: 'Decrypt', effect: 'Allow', actions: ['kms:Decrypt'], resources: [KEY] }])] },
      { id: 'auditoria', name: 'auditoria-sinistros', description: 'role da função de auditoria', kind: 'role-session', account: SABIA, roleName: 'auditoria-sinistros', sessionName: 'lambda', identityPolicies: [pol('AuditoriaPolicy', [{ sid: 'Decrypt', effect: 'Allow', actions: ['kms:Decrypt'], resources: [KEY] }])] },
      { id: 'estag', name: 'estagiario', description: 'tem AdministratorAccess por engano', kind: 'user', account: SABIA, userName: 'estagiario', identityPolicies: [pol('AdministratorAccess', [{ sid: 'Tudo', effect: 'Allow', actions: ['*'], resources: ['*'] }])] },
      { id: 'seg', name: 'seg-admin', description: 'administra as chaves', kind: 'user', account: SABIA, userName: 'seg-admin', identityPolicies: [] },
    ],
    resources: [{ id: 'key', arn: KEY, account: SABIA, kind: 'kms-key', label: 'chave sinistros' }],
  },
  libraries: [
    {
      id: 'keypolicy',
      title: 'Key policy da chave sinistros',
      policyName: 'KeyPolicySinistros',
      target: { type: 'resource', resourceId: 'key' },
      statements: [
        { sid: 'AdminsDaChave', effect: 'Allow', principals: [{ aws: `arn:aws:iam::${SABIA}:user/seg-admin` }], actions: ['kms:*'], resources: ['*'] },
        { sid: 'HabilitarPoliticasIAM', effect: 'Allow', principals: [{ aws: `arn:aws:iam::${SABIA}:root` }], actions: ['kms:*'], resources: ['*'], note: 'Delega à conta: qualquer identidade com permissão IAM passa a usar a chave.' },
        { sid: 'FuncoesDecifram', effect: 'Allow', principals: [{ aws: `arn:aws:iam::${SABIA}:role/processa-sinistros` }, { aws: `arn:aws:iam::${SABIA}:role/auditoria-sinistros` }], actions: ['kms:Decrypt'], resources: ['*'] },
      ],
      initial: ['AdminsDaChave'],
    },
  ],
  rows: ['sinistros', 'auditoria', 'estag', 'seg'],
  requests: [
    { id: 'decrypt', label: 'kms:Decrypt', action: 'kms:Decrypt', resourceId: 'key' },
    { id: 'putpolicy', label: 'kms:PutKeyPolicy', action: 'kms:PutKeyPolicy', resourceId: 'key' },
  ],
  goals: [
    { principalId: 'sinistros', requestId: 'decrypt', expect: 'allow', why: 'A função precisa ler os documentos de sinistro criptografados.', concepts: ['iam.explicit-resource-required'] },
    { principalId: 'auditoria', requestId: 'decrypt', expect: 'allow', why: 'A auditoria também confere os documentos de sinistro.', concepts: ['iam.explicit-resource-required'] },
    { principalId: 'estag', requestId: 'decrypt', expect: 'deny', why: 'Dados de sinistro não são para o estagiário, mesmo com a política IAM errada.', concepts: ['iam.explicit-resource-required', 'iam.grant-principal-type'] },
    { principalId: 'seg', requestId: 'putpolicy', expect: 'allow', why: 'A equipe de segurança administra a chave.', concepts: ['iam.explicit-resource-required'] },
    { principalId: 'estag', requestId: 'putpolicy', expect: 'deny', why: 'Ninguém além da segurança muda a key policy.', concepts: ['iam.explicit-resource-required'] },
  ],
  solution: { active: { keypolicy: ['AdminsDaChave', 'FuncoesDecifram'] } },
}

export const F04_IAM: PhaseDef = {
  ...META.f04,
  concepts: ['iam.policy-evaluation', 'iam.eval-flow', 'iam.same-account', 'iam.cross-account', 'iam.grant-principal-type', 'iam.explicit-resource-required', 'kms.key-policy'],
  availability: 'available',
  simplifications: ['As contas e os ARNs são fictícios.', 'A chave KMS é avaliada só pela key policy e pelas políticas IAM: grants do KMS não são simulados.'],
  missions: [
    // -----------------------------------------------------------------------
    {
      id: 'iax.f04.m1',
      title: 'Implícito e explícito',
      type: 'mission',
      summary: 'O fluxo de avaliação, passo a passo.',
      briefing: {
        company: 'Sabiá Seguros',
        role: 'Você é a pessoa que todo mundo procura quando aparece um AccessDenied.',
        situation: 'Cada time jura que "a política permite". Você quer uma forma sistemática de explicar por que a AWS disse sim ou não.',
        objective: 'Seguir o fluxo de avaliação da AWS em qualquer requisição.',
        successCriteria: ['Distinguir deny explícito de deny implícito', 'Prever decisões com várias políticas', 'Ordenar o fluxo de avaliação'],
      },
      intel: [
        { conceptId: 'iam.policy-evaluation', body: ['Tudo começa **negado** (deny implícito). Um **Allow** aplicável permite, mas um **Deny explícito** em qualquer política aplicável vence sempre.'] },
        { conceptId: 'iam.eval-flow', visual: 'policy-flow', body: ['A ordem: procurar **Deny explícito** em todas as políticas; exigir Allow nas **RCPs** e nas **SCPs**; olhar a **política de recurso**; exigir Allow na **identidade**, no **boundary** e na **session policy**. O root começa com acesso total.'] },
      ],
      activities: [
        {
          id: 'iax.f04.m1.a1',
          kind: 'predict',
          title: 'Tudo permitido, quase',
          prompt: 'A role app-cotacao tem `s3:*` em `*`. A bucket policy nega `s3:DeleteObject` para todos. A aplicação tenta apagar uma apólice. O que acontece?',
          concepts: [{ id: 'iam.policy-evaluation' }],
          xp: 30,
          difficulty: 1,
          exhibits: [exhibit('Política da role app-cotacao', [S3_ALL]), exhibit('Bucket policy de sabia-apolices', [DENY_DELETE])],
          explanation: ['Um Deny explícito em qualquer política aplicável vence qualquer Allow.'],
          spec: { sim: 'policy', scenario: M1, request: { principalId: 'app', action: 's3:DeleteObject', resourceId: 'ap' } },
          options: DECISION_OPTIONS,
        },
        {
          id: 'iax.f04.m1.a2',
          kind: 'predict',
          title: 'Sem política nenhuma',
          prompt: 'O usuário `novo.analista` acabou de ser criado, sem políticas e sem grupo. Ele tenta ler um processo de sinistro (o recurso não tem política). O que acontece?',
          concepts: [{ id: 'iam.policy-evaluation' }],
          xp: 30,
          difficulty: 1,
          explanation: ['Nada permite e nada nega: vale o deny implícito. Um usuário novo começa sem nenhuma permissão.'],
          spec: { sim: 'policy', scenario: M1, request: { principalId: 'novo', action: 's3:GetObject', resourceId: 'sin' } },
          options: DECISION_OPTIONS,
        },
        {
          id: 'iax.f04.m1.a3',
          kind: 'predict',
          title: 'O grupo permite, o usuário nega',
          prompt: 'O grupo Atendimento permite ler apólices. O usuário joao, membro do grupo, tem uma política própria que nega tudo em sinistros/. Ele tenta ler um processo de sinistro. O que acontece?',
          concepts: [{ id: 'iam.policy-evaluation' }, { id: 'iam.eval-flow', weight: 0.5 }],
          xp: 30,
          difficulty: 2,
          exhibits: [exhibit('Política do grupo Atendimento', [GROUP_READ]), exhibit('Política RestricaoJoao (do usuário)', [DENY_SINISTROS])],
          explanation: ['Todas as políticas do usuário e dos grupos dele entram na avaliação. O Deny explícito na política dele vence o Allow do grupo.'],
          spec: { sim: 'policy', scenario: M1, request: { principalId: 'joao', action: 's3:GetObject', resourceId: 'sin' } },
          options: DECISION_OPTIONS,
        },
        {
          id: 'iax.f04.m1.a4',
          kind: 'order',
          title: 'A ordem da AWS',
          prompt: 'Ordene as verificações que a AWS faz numa requisição dentro de uma conta.',
          concepts: [{ id: 'iam.eval-flow' }],
          xp: 50,
          difficulty: 2,
          explanation: ['Deny explícito primeiro, em todas as políticas. Depois os limites da organização, a política de recurso e as camadas da identidade.'],
          steps: [
            { id: 's1', text: 'Procurar um Deny explícito em todas as políticas aplicáveis', explanation: 'Achou um, acabou: negado.' },
            { id: 's2', text: 'Exigir Allow nas RCPs que se aplicam ao recurso', explanation: 'Sem Allow em todos os níveis, negado.' },
            { id: 's3', text: 'Exigir Allow nas SCPs que se aplicam ao principal', explanation: 'Sem Allow em todos os níveis, negado.' },
            { id: 's4', text: 'Olhar a política de recurso', explanation: 'Uma concessão direta ao usuário ou à sessão, na mesma conta, já permite.' },
            { id: 's5', text: 'Exigir Allow nas políticas de identidade', explanation: 'Sem Allow, deny implícito.' },
            { id: 's6', text: 'Exigir Allow no permissions boundary, se houver', explanation: 'A permissão efetiva é a interseção.' },
            { id: 's7', text: 'Exigir Allow na session policy, se houver', explanation: 'Última camada: depois dela, permitido.' },
          ],
        },
      ],
      debrief: { takeaways: ['Deny explícito vence tudo; sem Allow, deny implícito.', 'Políticas do usuário e dos grupos dele são avaliadas juntas.', 'A ordem: Deny, RCP, SCP, recurso, identidade, boundary, sessão.'] },
    },
    // -----------------------------------------------------------------------
    {
      id: 'iax.f04.m2',
      title: 'Identidade e recurso',
      type: 'mission',
      summary: 'Mesma conta: basta um dos dois permitir, e a quem a política de recurso concede faz diferença.',
      briefing: {
        company: 'Sabiá Seguros',
        role: 'Você vai arrumar o acesso ao bucket de apólices.',
        situation: 'Para "resolver rápido", alguém deixou o bucket legível por qualquer pessoa e deu `s3:*` à analista. O sistema de cotação continua precisando ler.',
        objective: 'Combinar política de identidade e bucket policy para que cada um tenha só o que precisa.',
        successCriteria: ['Ninguém anônimo ou sem permissão lê', 'Só HTTPS', 'A analista lê, mas não apaga'],
      },
      intel: [
        { conceptId: 'iam.same-account', body: ['Na **mesma conta**, basta a política de identidade **ou** a de recurso permitir, sem nenhum Deny. Por isso uma bucket policy pode dar acesso a quem não tem política nenhuma.'] },
        { conceptId: 'iam.grant-principal-type', body: ['Na bucket policy, conceder ao **ARN do usuário** ou da **sessão** basta. Ao **ARN da role**, ainda valem boundary e session policy. À **conta**, é delegação: cada identidade ainda precisa de permissão própria.'] },
      ],
      activities: [
        {
          id: 'iax.f04.m2.a1',
          kind: 'lab',
          lab: 'policy-layers',
          title: 'O bucket de apólices',
          prompt: 'Ligue e desligue statements até cumprir os objetivos. Clique numa célula para ver o raciocínio do motor.',
          concepts: [{ id: 'iam.same-account' }, { id: 'iam.grant-principal-type' }, { id: 'iam.policy-evaluation', weight: 0.5 }],
          xp: 140,
          difficulty: 3,
          hints: ['A analista não precisa de política de identidade se a bucket policy conceder diretamente a ela.', 'Um Deny com condição de HTTPS resolve o tráfego sem criptografia para todos.'],
          explanation: ['Uma solução: bucket policy com `AnaLeitura` e `SomenteHTTPS`, e nenhuma política de identidade para a ana. O sistema de cotação continua lendo pela política da role.', '`ContaLeitura` também funcionaria para a ana só se ela tivesse política de identidade: é delegação.'],
          config: LAB_SAME,
        },
        {
          id: 'iax.f04.m2.a2',
          kind: 'decision',
          title: 'O que significa :root no Principal?',
          prompt: 'Uma bucket policy tem `"Principal": { "AWS": "arn:aws:iam::111111111111:root" }`. O que isso concede?',
          concepts: [{ id: 'iam.grant-principal-type' }],
          xp: 30,
          difficulty: 2,
          explanation: ['O ARN da conta (com :root) e o ID da conta funcionam igual: delegam à conta inteira. Não restringem ao usuário raiz.'],
          options: [
            { id: 'a', text: 'Delega à conta: as identidades dela precisam de política própria para usar o acesso', correct: true, consequence: 'Um administrador da conta decide quem, lá dentro, usa a permissão.' },
            { id: 'b', text: 'Concede só ao usuário raiz da conta', correct: false, consequence: 'Engano comum: o :root aqui representa a conta, não o usuário raiz.' },
            { id: 'c', text: 'Concede a todos da conta, sem precisar de mais nada', correct: false, consequence: 'É delegação: sem política de identidade, ninguém lá dentro usa a permissão.' },
          ],
        },
      ],
      debrief: { takeaways: ['Mesma conta: identidade ou recurso basta.', 'Concessão ao ARN do usuário ou da sessão é direta; à conta, é delegação.'] },
    },
    // -----------------------------------------------------------------------
    {
      id: 'iax.f04.m3',
      title: 'Duas contas',
      type: 'mission',
      summary: 'Entre contas, as duas precisam permitir.',
      briefing: {
        company: 'Sabiá Seguros',
        role: 'Você integra a seguradora com a Corretora Ponte, que tem conta AWS própria.',
        situation: 'Um colega concedeu `s3:*` à conta da corretora inteira. A corretora só precisa ler cotações, e só pela role do sistema dela.',
        objective: 'Abrir o mínimo para a outra conta.',
        successCriteria: ['A role da corretora lê', 'Ninguém mais da Ponte entra', 'A analista da Sabiá continua lendo'],
      },
      intel: [{ conceptId: 'iam.cross-account', visual: 'cross-account-eval', body: ['Entre contas, a AWS faz **duas avaliações**: na conta de quem pede (identidade, boundary, sessão, SCPs) e na conta do recurso (política de recurso, RCPs). As **duas** precisam permitir.'] }],
      activities: [
        {
          id: 'iax.f04.m3.a1',
          kind: 'lab',
          lab: 'policy-layers',
          title: 'Cotações para a corretora',
          prompt: 'Ajuste a bucket policy (conta Sabiá) e a política da role corretor (conta Ponte).',
          concepts: [{ id: 'iam.cross-account' }, { id: 'iam.grant-principal-type' }],
          xp: 140,
          difficulty: 3,
          hints: ['Conceder à conta da Ponte deixa entrar qualquer identidade de lá que tenha política ampla.', 'Gravar continua bloqueado se a bucket policy não conceder PutObject.'],
          explanation: ['Uma solução: bucket policy só com `CorretorLeitura` (ARN da role) e a role corretor com `LerCotacoesSabia`. Mesmo com `TudoNoS3` na role, a gravação seria negada, porque a bucket policy não concede PutObject.'],
          config: LAB_CROSS,
        },
        {
          id: 'iax.f04.m3.a2',
          kind: 'classify',
          title: 'O que precisa permitir?',
          prompt: 'Para cada situação, o que é necessário?',
          concepts: [{ id: 'iam.cross-account' }, { id: 'iam.same-account' }],
          xp: 50,
          difficulty: 2,
          explanation: ['Na mesma conta, um dos lados basta; entre contas, os dois. Trust policies e key policies precisam permitir sempre.'],
          bins: [
            { id: 'either', label: 'Identidade ou recurso basta' },
            { id: 'both', label: 'Identidade e recurso' },
          ],
          items: [
            { id: 'same-id', text: 'Usuário lê objeto de um bucket da própria conta (só a identidade permite)', bin: 'either', explanation: 'Mesma conta: a identidade basta.', concepts: ['iam.same-account'] },
            { id: 'same-res', text: 'Usuário lê objeto de um bucket da própria conta (só a bucket policy cita o ARN dele)', bin: 'either', explanation: 'Mesma conta: a concessão direta basta.', concepts: ['iam.same-account'] },
            { id: 'cross-s3', text: 'Role de outra conta lê objeto do bucket', bin: 'both', explanation: 'Entre contas: identidade na conta de origem e bucket policy na conta do recurso.', concepts: ['iam.cross-account'] },
            { id: 'cross-kms', text: 'Role de outra conta usa uma chave KMS', bin: 'both', explanation: 'A key policy precisa permitir a conta ou a role, e a política IAM de origem também.', concepts: ['iam.cross-account'] },
          ],
        },
        {
          id: 'iax.f04.m3.a3',
          kind: 'predict',
          title: 'Concessão ao ARN da role',
          prompt: 'A sessão `bia` da role **analista** foi criada com uma session policy que só permite `ec2:Describe*`. A bucket policy concede `s3:GetObject` ao **ARN da role** analista (mesma conta). A sessão tenta ler a apólice. O que acontece?',
          concepts: [{ id: 'iam.grant-principal-type' }],
          xp: 40,
          difficulty: 3,
          explanation: ['Concessões ao ARN da role são limitadas pela session policy. Como a session policy não permite GetObject, a leitura é negada implicitamente.'],
          spec: { sim: 'policy', scenario: PRINCIPAL_TYPES, request: { principalId: 'sessao', action: 's3:GetObject', resourceId: 'porRole' } },
          options: DECISION_OPTIONS,
        },
        {
          id: 'iax.f04.m3.a4',
          kind: 'predict',
          title: 'Concessão ao ARN da sessão',
          prompt: 'Mesma sessão, mesma session policy. Agora a bucket policy concede `s3:GetObject` ao **ARN da sessão** (`arn:aws:sts::111111111111:assumed-role/analista/bia`). O que acontece?',
          concepts: [{ id: 'iam.grant-principal-type' }],
          xp: 40,
          difficulty: 3,
          explanation: ['Na mesma conta, uma concessão direta ao ARN da sessão não é limitada pela session policy nem pela identidade: permitido.'],
          spec: { sim: 'policy', scenario: PRINCIPAL_TYPES, request: { principalId: 'sessao', action: 's3:GetObject', resourceId: 'porSessao' } },
          options: DECISION_OPTIONS,
        },
      ],
      debrief: { takeaways: ['Entre contas, as duas avaliações precisam permitir.', 'Conceda à role certa, não à conta inteira.', 'ARN da role: limitado por boundary e sessão. ARN da sessão: não.'] },
    },
    // -----------------------------------------------------------------------
    {
      id: 'iax.f04.boss',
      title: 'Chefe: O AccessDenied misterioso',
      type: 'boss',
      summary: 'A política IAM permite, e mesmo assim a função recebe AccessDenied.',
      passThreshold: 0.7,
      bonusXp: 120,
      briefing: {
        company: 'Sabiá Seguros',
        role: 'Você foi chamada para destravar o processamento de sinistros.',
        situation: 'As funções que processam e auditam sinistros passaram a ler documentos criptografados com uma chave KMS nova. As políticas das roles permitem kms:Decrypt, mas toda execução falha com AccessDenied.',
        objective: 'Achar a camada que nega e corrigir sem abrir a chave para quem não deve.',
        successCriteria: ['Apontar a evidência no erro e nas políticas', 'Corrigir a key policy', 'Manter o estagiário fora'],
      },
      intel: [
        { conceptId: 'iam.explicit-resource-required', body: ['**Trust policies** e **key policies do KMS** são exceções: precisam permitir o principal explicitamente, mesmo na mesma conta. Política de identidade sozinha não abre uma chave KMS.'] },
        { conceptId: 'kms.key-policy' },
      ],
      activities: [
        {
          id: 'iax.f04.boss.a1',
          kind: 'investigate',
          title: 'Onde está o não?',
          prompt: 'Examine o erro, a política da role e a key policy.',
          concepts: [{ id: 'iam.explicit-resource-required' }, { id: 'kms.key-policy', weight: 0.5 }],
          xp: 90,
          difficulty: 3,
          explanation: ['A key policy só cita o seg-admin. Sem um statement que permita a role (ou que delegue à conta), a política IAM da role não basta para usar a chave.'],
          artifacts: [
            {
              id: 'error',
              title: 'Log da função',
              format: 'log',
              lines: [
                { id: 'e1', text: 'AccessDeniedException: User: arn:aws:sts::111111111111:assumed-role/processa-sinistros/lambda is not authorized to perform: kms:Decrypt on resource: arn:aws:kms:sa-east-1:111111111111:key/1234abcd… because no resource-based policy allows the kms:Decrypt action', isIssue: true, explanation: 'A mensagem diz exatamente qual camada falta: nenhuma política de recurso permite.' },
                { id: 'e2', text: 'GetObject sinistros/s-12.pdf iniciado', isIssue: false, explanation: 'O S3 foi alcançado; o problema é decifrar o objeto.' },
              ],
            },
            {
              id: 'role',
              title: 'Política da role processa-sinistros',
              format: 'code',
              lines: [
                { id: 'r1', text: '"Effect": "Allow", "Action": "kms:Decrypt",', isIssue: false, explanation: 'O lado da identidade está certo.' },
                { id: 'r2', text: '"Resource": "arn:aws:kms:sa-east-1:111111111111:key/1234abcd…"', isIssue: false, explanation: 'O ARN da chave está correto.' },
              ],
            },
            {
              id: 'key',
              title: 'Key policy da chave sinistros',
              format: 'code',
              lines: [
                { id: 'k1', text: '"Sid": "AdminsDaChave",', isIssue: false, explanation: 'A segurança precisa administrar a chave.' },
                { id: 'k2', text: '"Principal": { "AWS": "arn:aws:iam::111111111111:user/seg-admin" },', isIssue: true, explanation: 'Só o seg-admin é citado: nem a role, nem a conta.' },
                { id: 'k3', text: '"Action": "kms:*"', isIssue: false, explanation: 'Para o administrador, é esperado.' },
              ],
            },
          ],
          rootCause: {
            prompt: 'Qual é a causa?',
            options: [
              { id: 'r1', text: 'A key policy não permite a role; para o KMS, a política IAM sozinha não basta.', correct: true, feedback: 'Isso: key policies precisam permitir o principal, direta ou delegando à conta.' },
              { id: 'r2', text: 'A política da role tem o ARN da chave errado.', correct: false, feedback: 'O ARN confere com o do erro.' },
              { id: 'r3', text: 'Falta s3:GetObject na role.', correct: false, feedback: 'O erro é de kms:Decrypt, não de leitura no S3.' },
              { id: 'r4', text: 'Um Deny explícito na key policy bloqueia a role.', correct: false, feedback: 'A key policy não tem Deny: falta um Allow.' },
            ],
          },
          remediations: {
            prompt: 'Que correção aplicar? (selecione todas as adequadas)',
            options: [
              { id: 'f1', text: 'Acrescentar à key policy um Allow kms:Decrypt para os ARNs das roles das funções.', correct: true, feedback: 'Permite exatamente quem precisa.' },
              { id: 'f2', text: 'Acrescentar o statement que delega a chave à conta inteira.', correct: false, feedback: 'Resolve a função, mas o estagiário com AdministratorAccess passaria a decifrar sinistros.' },
              { id: 'f3', text: 'Dar AdministratorAccess à role.', correct: false, feedback: 'Política IAM não abre a chave sem a key policy, e ainda viola o menor privilégio.' },
            ],
          },
        },
        {
          id: 'iax.f04.boss.a2',
          kind: 'lab',
          lab: 'policy-layers',
          title: 'Corrigir a key policy',
          prompt: 'Ajuste a key policy para cumprir os objetivos. Observe o que acontece com o estagiário quando a chave é delegada à conta.',
          concepts: [{ id: 'iam.explicit-resource-required' }, { id: 'iam.grant-principal-type' }],
          xp: 140,
          difficulty: 3,
          hints: ['O estagiário tem AdministratorAccess: qualquer delegação à conta o deixa entrar.'],
          explanation: ['Solução: `AdminsDaChave` e `FuncoesDecifram`. `HabilitarPoliticasIAM` delega a chave à conta, e a política IAM errada do estagiário passaria a valer.'],
          config: LAB_KMS,
        },
      ],
      debrief: { takeaways: ['Leia a mensagem de erro: ela costuma dizer qual tipo de política falta.', 'Key policies e trust policies precisam permitir o principal.', 'Delegar à conta transfere a decisão para as políticas IAM, inclusive as erradas.'] },
    },
  ],
}
