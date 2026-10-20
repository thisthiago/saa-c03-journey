/**
 * Fase 5 — Roles e STS. Trust policy, AssumeRole, duração, encadeamento,
 * família de APIs do STS, session policies e session tags.
 */
import type { PhaseDef } from '../../../../../engine/types'
import type { Principal, PolicyScenario, PolicyStatement } from '../../../../../simulators/policy/model'
import type { TrustLabConfig } from '../../../../../simulators/sts/lab'
import { META } from '../meta'
import { DECISION_OPTIONS, exhibit, pol } from '../shared'

const PIXEL = '444455556666'
const ROLE_ARN = `arn:aws:iam::${PIXEL}:role/deploy-producao`
const ASSUME_DEPLOY = pol('PodeAssumirDeploy', [{ sid: 'Assumir', effect: 'Allow', actions: ['sts:AssumeRole'], resources: [`arn:aws:iam::${PIXEL}:role/deploy-*`] }])
const DEPLOY_PERMS = pol('DeployProducao', [{ sid: 'Artefatos', effect: 'Allow', actions: ['s3:GetObject'], resources: ['arn:aws:s3:::pixel-artefatos/*'] }])

const user = (id: string, name: string, extra: Partial<Principal> = {}): Principal => ({ id, name, kind: 'user', account: PIXEL, userName: id, identityPolicies: [ASSUME_DEPLOY], ...extra })

const PRINCIPALS: Principal[] = [
  user('ana', 'ana (DevOps)', { auth: { via: 'access-key', mfa: false } }),
  user('rui', 'rui (DevOps)', { auth: { via: 'access-key', mfa: false } }),
  user('estag', 'estagiario', { identityPolicies: [pol('AssumirTudo', [{ sid: 'Tudo', effect: 'Allow', actions: ['sts:AssumeRole'], resources: ['*'] }])], auth: { via: 'access-key', mfa: false } }),
  { id: 'ci', name: 'sessão da role ci-build', kind: 'role-session', account: PIXEL, roleName: 'ci-build', sessionName: 'pipeline', identityPolicies: [ASSUME_DEPLOY] },
]

const TRUST_LAB: TrustLabConfig = {
  roleId: 'deploy',
  permissions: [DEPLOY_PERMS],
  durationOptions: [1, 2, 4, 8, 12],
  builder: {
    kind: 'trust',
    policyName: 'TrustDeployProducao',
    attachedTo: 'Trust policy da role **deploy-producao**.',
    scenario: { principals: PRINCIPALS, resources: [{ id: 'deploy', arn: ROLE_ARN, account: PIXEL, kind: 'trust', label: 'role deploy-producao' }] },
    target: { type: 'resource', resourceId: 'deploy' },
    palette: {
      actions: ['sts:AssumeRole'],
      principals: [
        { id: 'ana', label: 'usuária ana', ref: { aws: `arn:aws:iam::${PIXEL}:user/ana` } },
        { id: 'rui', label: 'usuário rui', ref: { aws: `arn:aws:iam::${PIXEL}:user/rui` } },
        { id: 'estag', label: 'usuário estagiario', ref: { aws: `arn:aws:iam::${PIXEL}:user/estag` } },
        { id: 'ci', label: 'role ci-build', ref: { aws: `arn:aws:iam::${PIXEL}:role/ci-build` } },
        { id: 'conta', label: `conta ${PIXEL} (delegação)`, ref: { aws: PIXEL } },
        { id: 'todos', label: '* (qualquer um)', ref: '*' },
      ],
      conditions: [{ id: 'mfa', label: 'Bool aws:MultiFactorAuthPresent = true', clause: { op: 'Bool', key: 'aws:MultiFactorAuthPresent', values: ['true'] } }],
      effects: ['Allow', 'Deny'],
    },
    maxStatements: 3,
    tests: [],
    solution: [],
  },
  attempts: [
    { id: 'a1', label: 'ana, com MFA, pede 4 h para um deploy longo', callerId: 'ana', sessionName: 'ana', durationSeconds: 4 * 3600, mfa: true, expect: 'ok', why: 'Deploys longos levam até 4 h; a regra da empresa (premissa) é esse o máximo.', concepts: ['sts.assume-role'] },
    { id: 'a2', label: 'rui, com MFA, pede 1 h', callerId: 'rui', sessionName: 'rui', durationSeconds: 3600, mfa: true, expect: 'ok', why: 'rui é da equipe de DevOps.', concepts: ['iam.trust-policy'] },
    { id: 'a3', label: 'rui, sem MFA, pede 1 h', callerId: 'rui', sessionName: 'rui', durationSeconds: 3600, expect: 'fail', why: 'Pessoas só assumem a role de produção com MFA.', concepts: ['iam.trust-policy'] },
    { id: 'a4', label: 'pipeline (sessão da role ci-build) pede 1 h', callerId: 'ci', sessionName: 'build-981', durationSeconds: 3600, expect: 'ok', why: 'O pipeline faz deploys automáticos, sem pessoa e sem MFA.', concepts: ['iam.trust-policy'] },
    { id: 'a5', label: 'pipeline pede 2 h', callerId: 'ci', sessionName: 'build-982', durationSeconds: 2 * 3600, expect: 'fail', why: 'O pipeline já é uma sessão de role: encadear limita a 1 h.', concepts: ['sts.role-chaining'] },
    { id: 'a6', label: 'estagiario, com MFA, pede 1 h', callerId: 'estag', sessionName: 'estag', durationSeconds: 3600, mfa: true, expect: 'fail', why: 'Ele tem uma política que permite sts:AssumeRole em tudo, mas não deve chegar à produção.', concepts: ['iam.trust-policy'] },
    { id: 'a7', label: 'ana, com MFA, pede 8 h', callerId: 'ana', sessionName: 'ana', durationSeconds: 8 * 3600, mfa: true, expect: 'fail', why: 'A regra da empresa (premissa) limita as sessões de produção a 4 h.', concepts: ['sts.assume-role'] },
  ],
  solution: {
    statements: [
      { effect: 'Allow', actions: ['sts:AssumeRole'], resources: [], principals: ['ana', 'rui'], conditions: ['mfa'] },
      { effect: 'Allow', actions: ['sts:AssumeRole'], resources: [], principals: ['ci'], conditions: [] },
    ],
    maxHours: 4,
  },
}

const FIXED_TRUST: PolicyScenario = {
  principals: PRINCIPALS,
  resources: [
    {
      id: 'deploy',
      arn: ROLE_ARN,
      account: PIXEL,
      kind: 'trust',
      label: 'role deploy-producao',
      policy: pol('TrustDeployProducao', [
        { sid: 'Pessoas', effect: 'Allow', principals: [{ aws: `arn:aws:iam::${PIXEL}:user/ana` }, { aws: `arn:aws:iam::${PIXEL}:user/rui` }], actions: ['sts:AssumeRole'], conditions: [{ op: 'Bool', key: 'aws:MultiFactorAuthPresent', values: ['true'] }] },
        { sid: 'Pipeline', effect: 'Allow', principals: [{ aws: `arn:aws:iam::${PIXEL}:role/ci-build` }], actions: ['sts:AssumeRole'] },
      ]),
    },
  ],
}

const STS_OPTIONS = [
  { id: 'ok', text: 'Sessão criada', outcome: 'ok' },
  { id: 'trust', text: 'Negado pela trust policy', outcome: 'trust-denied' },
  { id: 'caller', text: 'Negado: quem chama não tem permissão', outcome: 'caller-denied' },
  { id: 'dur', text: 'Falha pela duração pedida', outcome: 'duration-invalid' },
  { id: 'mfa', text: 'Negado por falta de MFA', outcome: 'mfa-missing' },
]

// ---------------------------------------------------------------------------
// Missão 4 — session policy e session tags

const BUILDS = 'arn:aws:s3:::pixel-builds'
const ROLE_PERMS: PolicyStatement = { sid: 'LerBuilds', effect: 'Allow', actions: ['s3:GetObject'], resources: [`${BUILDS}/*`] }
const SESSION_A: PolicyStatement = { sid: 'SoEstudioA', effect: 'Allow', actions: ['s3:*'], resources: [`${BUILDS}/estudio-a/*`] }

const SESSIONS: PolicyScenario = {
  principals: [
    { id: 's-a', name: 'sessão do estúdio A', kind: 'role-session', account: PIXEL, roleName: 'portal-parceiros', sessionName: 'estudio-a', identityPolicies: [pol('PortalParceiros', [ROLE_PERMS])], sessionPolicy: pol('SessaoEstudioA', [SESSION_A]) },
  ],
  resources: [
    { id: 'b-a', arn: `${BUILDS}/estudio-a/jogo-1.2.zip`, account: PIXEL, label: 'build do estúdio A' },
    { id: 'b-b', arn: `${BUILDS}/estudio-b/jogo-0.9.zip`, account: PIXEL, label: 'build do estúdio B' },
  ],
}

export const F05_IAM: PhaseDef = {
  ...META.f05,
  concepts: ['iam.roles', 'iam.trust-policy', 'sts.temporary-credentials', 'sts.assume-role', 'sts.role-chaining', 'iam.switch-role', 'sts.api-family', 'sts.get-session-token', 'sts.session-policy', 'sts.session-tags'],
  availability: 'available',
  simplifications: ['A duração máxima de 4 h para a produção é uma regra da empresa do cenário, não um limite da AWS.', 'Session tags e SourceIdentity aparecem só nos conceitos; o simulador não os aplica.'],
  missions: [
    // -----------------------------------------------------------------------
    {
      id: 'iax.f05.m1',
      title: 'Quem assume e o que faz',
      type: 'mission',
      summary: 'Trust policy, política de permissões e credenciais temporárias.',
      briefing: {
        company: 'Pixel Jogos',
        role: 'Você cuida da plataforma de um estúdio de jogos.',
        situation: 'Os deploys de produção são feitos com o usuário admin-deploy, cuja chave de acesso todo mundo conhece. O estúdio quer trocar isso por uma role.',
        objective: 'Entender as duas políticas de uma role e o que acontece ao assumi-la.',
        successCriteria: ['Separar trust policy e política de permissões', 'Entender as credenciais temporárias', 'Prever um AssumeRole'],
      },
      intel: [
        { conceptId: 'iam.trust-policy', visual: 'assume-role-flow', body: ['Toda role tem duas políticas: a **trust policy** (quem pode assumir: Principal e `sts:AssumeRole`) e a **política de permissões** (o que a sessão faz). Uma não substitui a outra.'] },
        { conceptId: 'sts.temporary-credentials', body: ['O **STS** devolve **chave, segredo e token de sessão**, com hora para expirar. A partir daí, quem assumiu trabalha **só** com as permissões da role: as próprias ficam de lado.'] },
        { conceptId: 'iam.roles' },
      ],
      activities: [
        {
          id: 'iax.f05.m1.a1',
          kind: 'classify',
          title: 'Em qual política?',
          prompt: 'Cada trecho vai na trust policy ou na política de permissões da role deploy-producao?',
          concepts: [{ id: 'iam.trust-policy' }],
          xp: 50,
          difficulty: 2,
          explanation: ['A trust policy só fala de quem assume e em que condições; tudo sobre recursos de trabalho fica na política de permissões.'],
          bins: [
            { id: 'trust', label: 'Trust policy (quem assume)' },
            { id: 'perms', label: 'Política de permissões (o que a sessão faz)' },
          ],
          items: [
            { id: 'p', text: '"Principal": { "AWS": "arn:aws:iam::444455556666:user/ana" }', bin: 'trust', explanation: 'Principal só aparece na política de recurso, e a trust policy é a política de recurso da role.' },
            { id: 'a', text: '"Action": "sts:AssumeRole"', bin: 'trust', explanation: 'É a ação que a trust policy permite.' },
            { id: 'm', text: 'Condição exigindo aws:MultiFactorAuthPresent para assumir', bin: 'trust', explanation: 'Condições sobre quem assume ficam na trust policy.' },
            { id: 's3', text: '"Action": "s3:GetObject" em pixel-artefatos/*', bin: 'perms', explanation: 'É o trabalho que a sessão vai fazer.' },
            { id: 'ecs', text: '"Action": "ecs:UpdateService" no cluster de produção', bin: 'perms', explanation: 'Também é trabalho da sessão.' },
          ],
        },
        {
          id: 'iax.f05.m1.a2',
          kind: 'match',
          title: 'O vocabulário do AssumeRole',
          prompt: 'Associe cada termo ao que ele é.',
          concepts: [{ id: 'sts.temporary-credentials' }, { id: 'iam.trust-policy', weight: 0.5 }],
          xp: 50,
          difficulty: 1,
          explanation: ['O AssumeRole devolve credenciais completas (com token de sessão) e um ARN de sessão que identifica quem está agindo.'],
          leftLabel: 'Termo',
          rightLabel: 'O que é',
          pairs: [
            { id: 'token', left: 'Token de sessão', right: 'Parte das credenciais temporárias que acompanha a chave e o segredo', explanation: 'Sem o token, as credenciais temporárias não funcionam.', concepts: ['sts.temporary-credentials'] },
            { id: 'exp', left: 'Expiration', right: 'Momento em que as credenciais deixam de valer', explanation: 'Depois disso é preciso assumir de novo.', concepts: ['sts.temporary-credentials'] },
            { id: 'name', left: 'Nome da sessão', right: 'Texto que aparece no ARN da sessão e no CloudTrail', explanation: 'Ajuda a saber quem usou a role.', concepts: ['sts.temporary-credentials'] },
            { id: 'perms', left: 'Política de permissões', right: 'Diz o que a sessão pode fazer', explanation: 'É a política de identidade da role.', concepts: ['iam.trust-policy'] },
            { id: 'trust', left: 'Trust policy', right: 'Diz quem pode assumir a role', explanation: 'É a política de recurso da role.', concepts: ['iam.trust-policy'] },
          ],
        },
        {
          id: 'iax.f05.m1.a3',
          kind: 'predict',
          title: 'O estagiário tenta',
          prompt: 'O estagiário tem uma política que permite `sts:AssumeRole` em **qualquer** role e chama o AssumeRole com MFA na deploy-producao, cuja trust policy está abaixo. O que acontece?',
          concepts: [{ id: 'iam.trust-policy' }],
          xp: 40,
          difficulty: 2,
          exhibits: [exhibit('Trust policy da deploy-producao', FIXED_TRUST.resources[0].policy!.statements)],
          explanation: ['A trust policy é a política de recurso da role e precisa permitir quem chama. Ela não cita o estagiário, então a política dele não basta.'],
          spec: { sim: 'sts', scenario: FIXED_TRUST, role: { maxSessionHours: 4, permissions: [DEPLOY_PERMS] }, attempt: { callerId: 'estag', roleId: 'deploy', sessionName: 'estag', mfa: true } },
          options: STS_OPTIONS,
        },
      ],
      debrief: { takeaways: ['Trust policy: quem assume. Permissões: o que a sessão faz.', 'Ao assumir a role, só valem as permissões dela.', 'Permissão para chamar AssumeRole não basta: a trust policy precisa permitir.'] },
    },
    // -----------------------------------------------------------------------
    {
      id: 'iax.f05.m2',
      title: 'Por dentro do AssumeRole',
      type: 'mission',
      summary: 'Duração, MFA, encadeamento e troca de role no console.',
      briefing: {
        company: 'Pixel Jogos',
        role: 'Você vai escrever a trust policy da role deploy-producao.',
        situation: 'Duas pessoas de DevOps e o pipeline de CI fazem deploys. Pessoas precisam de MFA; o pipeline roda sozinho. Deploys longos levam até 4 horas.',
        objective: 'Montar a trust policy e escolher a duração máxima certa.',
        successCriteria: ['Só quem deve assume a role', 'Pessoas com MFA; pipeline sem pessoa', 'Sessões de até 4 h'],
      },
      intel: [
        { conceptId: 'sts.assume-role', body: ['A duração da sessão vai de **15 minutos** até o **máximo configurado na role**, que vai de **1 a 12 h** (padrão: 1 h). Pedir mais que o máximo faz a chamada falhar. MFA entra nos parâmetros `SerialNumber` e `TokenCode`.'] },
        { conceptId: 'sts.role-chaining', body: ['**Encadear** é assumir uma role usando credenciais de outra role. A sessão encadeada fica limitada a **1 hora**, não importa o máximo configurado. Pedir mais faz a chamada falhar.'] },
        { conceptId: 'iam.switch-role', body: ['No console, **Switch role** troca as permissões do usuário pelas da role; **Switch back** devolve. O usuário raiz não troca de role, e roles que exigem ExternalId só são assumidas pela API.'] },
      ],
      activities: [
        {
          id: 'iax.f05.m2.a1',
          kind: 'lab',
          lab: 'trust',
          title: 'Cadeia de confiança',
          prompt: 'Monte a trust policy da deploy-producao e escolha a duração máxima da sessão. As tentativas à direita mostram quem consegue assumir.',
          concepts: [{ id: 'iam.trust-policy' }, { id: 'sts.assume-role' }, { id: 'sts.role-chaining', weight: 0.5 }],
          xp: 160,
          difficulty: 3,
          hints: ['Pessoas e pipeline têm regras diferentes: use dois statements.', 'Citar a conta é delegação: o estagiário tem política que permite assumir qualquer role.'],
          explanation: [
            'Solução: um statement para ana e rui com a condição de MFA, outro para a role ci-build sem condição, e duração máxima de 4 h.',
            'O pipeline nunca consegue 2 h: é encadeamento de roles, limitado a 1 h.',
          ],
          config: TRUST_LAB,
        },
        {
          id: 'iax.f05.m2.a2',
          kind: 'predict',
          title: 'O pipeline pede mais tempo',
          prompt: 'Com a trust policy abaixo e a duração máxima de 4 h na role, o pipeline (que roda como sessão da role ci-build) pede **2 horas** de sessão na deploy-producao. O que acontece?',
          concepts: [{ id: 'sts.role-chaining' }],
          xp: 40,
          difficulty: 3,
          exhibits: [exhibit('Trust policy da deploy-producao', FIXED_TRUST.resources[0].policy!.statements)],
          explanation: ['Quem chama já é uma sessão de role: é encadeamento, limitado a 1 h. Pedir 2 h faz a chamada falhar, mesmo com a role aceitando 4 h.'],
          spec: { sim: 'sts', scenario: FIXED_TRUST, role: { maxSessionHours: 4, permissions: [DEPLOY_PERMS] }, attempt: { callerId: 'ci', roleId: 'deploy', sessionName: 'build', durationSeconds: 7200 } },
          options: STS_OPTIONS,
        },
        {
          id: 'iax.f05.m2.a3',
          kind: 'predict',
          title: 'Sem o código',
          prompt: 'A ana chama o AssumeRole na deploy-producao **sem** SerialNumber e TokenCode, usando a chave de acesso dela. O que acontece?',
          concepts: [{ id: 'sts.assume-role' }, { id: 'iam.trust-policy', weight: 0.5 }],
          xp: 40,
          difficulty: 2,
          exhibits: [exhibit('Trust policy da deploy-producao', FIXED_TRUST.resources[0].policy!.statements)],
          explanation: ['O statement das pessoas exige aws:MultiFactorAuthPresent = true. Com chave de acesso e sem código MFA, a condição não é atendida.'],
          spec: { sim: 'sts', scenario: FIXED_TRUST, role: { maxSessionHours: 4, permissions: [DEPLOY_PERMS] }, attempt: { callerId: 'ana', roleId: 'deploy', sessionName: 'ana' } },
          options: STS_OPTIONS,
        },
        {
          id: 'iax.f05.m2.a4',
          kind: 'decision',
          title: 'Trocar de role como root',
          prompt: 'Um sócio entra no console como **usuário raiz** e quer usar o **Switch role** para a role de auditoria. O que acontece?',
          concepts: [{ id: 'iam.switch-role' }],
          xp: 30,
          difficulty: 1,
          explanation: ['O usuário raiz não pode trocar de role no console. Ele deve entrar com uma identidade administrativa (por exemplo, pelo Identity Center) e então assumir a role.'],
          options: [
            { id: 'a', text: 'Não é possível: o usuário raiz não troca de role', correct: true, consequence: 'Mais um motivo para usar o root só nas tarefas que o exigem.' },
            { id: 'b', text: 'Funciona, e as permissões do root se somam às da role', correct: false, consequence: 'Nem o root troca de role, nem as permissões se somam: só um conjunto vale por vez.' },
            { id: 'c', text: 'Funciona por até 12 horas', correct: false, consequence: 'O root não consegue trocar de role.' },
          ],
        },
      ],
      debrief: { takeaways: ['Duração: 15 min até o máximo da role (1 a 12 h).', 'Encadeamento de roles: no máximo 1 h.', 'Condição de MFA na trust policy exige o código na chamada.'] },
    },
    // -----------------------------------------------------------------------
    {
      id: 'iax.f05.m3',
      title: 'A família STS',
      type: 'mission',
      summary: 'Cada API do STS para um tipo de quem pede.',
      briefing: {
        company: 'Pixel Jogos',
        role: 'Você está revisando como cada sistema do estúdio obtém credenciais.',
        situation: 'Há login de funcionários pelo provedor de identidade, jogadores entrando pelo aplicativo, um portal de parceiros e scripts de pessoas na CLI.',
        objective: 'Escolher a API do STS de cada caso.',
        successCriteria: ['Associar API e uso', 'Saber o que cada uma aceita'],
      },
      intel: [
        { conceptId: 'sts.api-family', body: ['**AssumeRole**: role, inclusive entre contas. **AssumeRoleWithSAML**: asserção de um IdP corporativo. **AssumeRoleWithWebIdentity**: token OIDC (Cognito, Google…). **GetSessionToken**: usuário com MFA. **GetFederationToken**: usuário federado com session policy obrigatória (a AWS recomenda roles no lugar).'] },
        { conceptId: 'sts.get-session-token' },
      ],
      activities: [
        {
          id: 'iax.f05.m3.a1',
          kind: 'match',
          title: 'API certa para cada caso',
          prompt: 'Associe cada caso à API do STS que ele usa.',
          concepts: [{ id: 'sts.api-family' }],
          xp: 50,
          difficulty: 2,
          explanation: ['As APIs com "With" trocam uma prova de identidade externa (SAML ou OIDC) por credenciais, sem credenciais AWS. As outras partem de credenciais AWS.'],
          leftLabel: 'Caso',
          rightLabel: 'API do STS',
          pairs: [
            { id: 'saml', left: 'Funcionário entra pelo IdP corporativo (SAML 2.0) e cai numa role', right: 'AssumeRoleWithSAML', explanation: 'A asserção SAML vira credenciais da role.' },
            { id: 'oidc', left: 'Aplicação troca um token OIDC por credenciais de uma role', right: 'AssumeRoleWithWebIdentity', explanation: 'Usada com provedores OIDC, inclusive o Cognito.' },
            { id: 'cross', left: 'Sistema de uma conta acessa outra conta pela role de lá', right: 'AssumeRole', explanation: 'O caso clássico de role entre contas.' },
            { id: 'mfa', left: 'Pessoa na CLI precisa de MFA para uma ação protegida', right: 'GetSessionToken', explanation: 'Troca chave + código MFA por credenciais marcadas com MFA.', concepts: ['sts.get-session-token'] },
            { id: 'fed', left: 'Proxy antigo cria sessões para usuários, com session policy obrigatória', right: 'GetFederationToken', explanation: 'Exige session policy; a AWS recomenda roles no lugar.' },
          ],
        },
        {
          id: 'iax.f05.m3.a2',
          kind: 'classify',
          title: 'Precisa de credenciais AWS?',
          prompt: 'Para chamar cada API, é preciso já ter credenciais AWS (de usuário ou de sessão)?',
          concepts: [{ id: 'sts.api-family' }],
          xp: 40,
          difficulty: 2,
          explanation: ['As APIs de federação por SAML e OIDC são chamadas com a prova do provedor externo, sem credenciais AWS.'],
          bins: [
            { id: 'yes', label: 'Precisa de credenciais AWS' },
            { id: 'no', label: 'Basta a asserção ou o token externo' },
          ],
          items: [
            { id: 'ar', text: 'AssumeRole', bin: 'yes', explanation: 'Quem chama é um usuário ou uma sessão AWS.' },
            { id: 'gst', text: 'GetSessionToken', bin: 'yes', explanation: 'Parte das credenciais de longo prazo do usuário (ou do root).' },
            { id: 'gft', text: 'GetFederationToken', bin: 'yes', explanation: 'Parte das credenciais de longo prazo de um usuário IAM (ou do root).' },
            { id: 'saml', text: 'AssumeRoleWithSAML', bin: 'no', explanation: 'Basta a asserção SAML.' },
            { id: 'web', text: 'AssumeRoleWithWebIdentity', bin: 'no', explanation: 'Basta o token OIDC.' },
          ],
        },
      ],
      debrief: { takeaways: ['SAML e OIDC: AssumeRoleWith…, sem credenciais AWS.', 'MFA na CLI: GetSessionToken.', 'Entre contas: AssumeRole.'] },
    },
    // -----------------------------------------------------------------------
    {
      id: 'iax.f05.m4',
      title: 'Session policy e session tags',
      type: 'mission',
      summary: 'Restringir uma sessão sem criar uma role por cliente.',
      briefing: {
        company: 'Pixel Jogos',
        role: 'Você mantém o portal onde estúdios parceiros baixam builds.',
        situation: 'O portal assume uma única role, portal-parceiros, para todos os estúdios. Cada estúdio só pode ver os próprios builds.',
        objective: 'Usar session policy para restringir cada sessão.',
        successCriteria: ['Prever o efeito da session policy', 'Saber que ela não concede', 'Entender as session tags'],
      },
      intel: [
        { conceptId: 'sts.session-policy', visual: 'permission-layers', body: ['A **session policy** vai na chamada do AssumeRole e **restringe** aquela sessão. A sessão fica com a **interseção** entre a role e a session policy: ela nunca dá mais do que a role.'] },
        { conceptId: 'sts.session-tags', body: ['**Session tags** (até 50) viram `aws:PrincipalTag/…` nas requisições da sessão e sobrescrevem a tag da role com a mesma chave. São a base do controle por atributos com federação.'] },
      ],
      activities: [
        {
          id: 'iax.f05.m4.a1',
          kind: 'predict',
          title: 'O build do outro estúdio',
          prompt: 'A sessão do estúdio A tem as políticas abaixo e tenta baixar um build do **estúdio B**. O que acontece?',
          concepts: [{ id: 'sts.session-policy' }],
          xp: 40,
          difficulty: 2,
          exhibits: [exhibit('Política de permissões da role portal-parceiros', [ROLE_PERMS]), exhibit('Session policy da sessão do estúdio A', [SESSION_A])],
          explanation: ['A role permite ler todos os builds, mas a session policy só cobre estudio-a/. Fora da interseção: deny implícito.'],
          spec: { sim: 'policy', scenario: SESSIONS, request: { principalId: 's-a', action: 's3:GetObject', resourceId: 'b-b' } },
          options: DECISION_OPTIONS,
        },
        {
          id: 'iax.f05.m4.a2',
          kind: 'predict',
          title: 'A session policy concede?',
          prompt: 'A session policy do estúdio A permite `s3:*` na pasta dele. A sessão tenta **enviar** um build (`s3:PutObject`) para estudio-a/. O que acontece?',
          concepts: [{ id: 'sts.session-policy' }],
          xp: 40,
          difficulty: 3,
          exhibits: [exhibit('Política de permissões da role portal-parceiros', [ROLE_PERMS]), exhibit('Session policy da sessão do estúdio A', [SESSION_A])],
          explanation: ['A session policy só limita. A role não permite PutObject, então a interseção também não permite.'],
          spec: { sim: 'policy', scenario: SESSIONS, request: { principalId: 's-a', action: 's3:PutObject', resourceId: 'b-a' } },
          options: DECISION_OPTIONS,
        },
        {
          id: 'iax.f05.m4.a3',
          kind: 'decision',
          title: 'Tag da role ou da sessão?',
          prompt: 'A role tem a tag `time=dados`. Ao assumi-la, o sistema passa a session tag `time=ml`. Nas requisições da sessão, quanto vale `aws:PrincipalTag/time`?',
          concepts: [{ id: 'sts.session-tags' }],
          xp: 30,
          difficulty: 2,
          explanation: ['Uma session tag com a mesma chave de uma tag da role a sobrescreve.'],
          options: [
            { id: 'ml', text: '`ml`: a session tag sobrescreve a tag da role', correct: true, consequence: 'Condições com aws:PrincipalTag/time usam o valor da sessão.' },
            { id: 'dados', text: '`dados`: a tag da role sempre vence', correct: false, consequence: 'É o contrário: a session tag tem precedência.' },
            { id: 'both', text: 'As duas, como uma lista', correct: false, consequence: 'Não existem duas tags com a mesma chave.' },
          ],
        },
      ],
      debrief: { takeaways: ['Session policy restringe a sessão; nunca concede mais do que a role.', 'Uma role, várias sessões restritas: menos roles para manter.', 'Session tags viram aws:PrincipalTag.'] },
    },
    // -----------------------------------------------------------------------
    {
      id: 'iax.f05.boss',
      title: 'Chefe: A sessão que expirou',
      type: 'boss',
      summary: 'Um job noturno falha sempre depois de uma hora.',
      passThreshold: 0.7,
      bonusXp: 120,
      briefing: {
        company: 'Pixel Jogos',
        role: 'Você foi chamada porque o job de compilação noturna nunca termina.',
        situation: 'O job leva cerca de 3 horas. Ele roda numa instância com a role ci-build e assume a role render-farm para usar o cluster de renderização. A render-farm aceita sessões de até 8 horas.',
        objective: 'Descobrir por que o job morre e escolher a correção.',
        successCriteria: ['Ler o log e as configurações', 'Achar a causa', 'Escolher uma correção que funcione'],
      },
      intel: [],
      activities: [
        {
          id: 'iax.f05.boss.a1',
          kind: 'investigate',
          title: 'Uma hora, sempre uma hora',
          prompt: 'Examine o log do job e a configuração das roles.',
          concepts: [{ id: 'sts.role-chaining' }, { id: 'sts.assume-role', weight: 0.5 }],
          xp: 90,
          difficulty: 3,
          explanation: ['O job assume a render-farm usando as credenciais da role ci-build: é encadeamento de roles, limitado a 1 h. Pedir 8 h falha; pedir 1 h funciona, mas a sessão expira no meio do trabalho.'],
          artifacts: [
            {
              id: 'log',
              title: 'Log do job',
              format: 'log',
              lines: [
                { id: 'l1', text: '22:00 · credenciais da instância: assumed-role/ci-build/i-0f12', isIssue: true, explanation: 'Quem chama o AssumeRole já é uma sessão de role.' },
                { id: 'l2', text: '22:00 · AssumeRole render-farm DurationSeconds=28800 · ValidationError: exceeds the 1 hour session limit for roles assumed by role chaining', isIssue: true, explanation: 'O pedido de 8 h falha por ser encadeamento.' },
                { id: 'l3', text: '22:01 · nova tentativa com DurationSeconds=3600 · sucesso', isIssue: false, explanation: 'Com 1 h, a chamada funciona.' },
                { id: 'l4', text: '23:01 · RenderJob · ExpiredToken: The security token included in the request is expired', isIssue: true, explanation: 'Uma hora depois, a sessão encadeada expira no meio do job.' },
              ],
            },
            {
              id: 'cfg',
              title: 'Configuração',
              format: 'table',
              lines: [
                { id: 'c1', text: 'render-farm · duração máxima da sessão: 8 h', isIssue: false, explanation: 'A configuração da role está certa, mas não vale para sessões encadeadas.' },
                { id: 'c2', text: 'ci-build · instance profile da instância de build', isIssue: false, explanation: 'Usar role pelo instance profile é a prática certa.' },
              ],
            },
          ],
          rootCause: {
            prompt: 'Qual é a causa?',
            options: [
              { id: 'r1', text: 'Encadeamento de roles: a sessão da render-farm, assumida a partir de outra role, fica limitada a 1 h.', correct: true, feedback: 'Isso: o máximo de 8 h da role não vale no encadeamento.' },
              { id: 'r2', text: 'A render-farm está configurada com 1 h de máximo.', correct: false, feedback: 'A configuração mostra 8 h.' },
              { id: 'r3', text: 'O relógio da instância está errado.', correct: false, feedback: 'O erro de 22:00 diz explicitamente que é o limite do encadeamento.' },
            ],
          },
          remediations: {
            prompt: 'Que correções funcionam? (selecione todas as adequadas)',
            options: [
              { id: 'f1', text: 'Dar à própria ci-build as permissões do cluster, sem encadear roles.', correct: true, feedback: 'Sem encadeamento, as credenciais do instance profile são renovadas automaticamente.' },
              { id: 'f2', text: 'Renovar a sessão da render-farm antes de cada hora, assumindo de novo.', correct: true, feedback: 'Funciona: cada sessão encadeada dura até 1 h, e o job pede outra antes de expirar.' },
              { id: 'f3', text: 'Aumentar a duração máxima da render-farm para 12 h.', correct: false, feedback: 'O limite de encadeamento continua sendo 1 h.' },
              { id: 'f4', text: 'Trocar o AssumeRole por GetSessionToken com 36 h.', correct: false, feedback: 'Sessões de role não podem chamar GetSessionToken, e ele não daria as permissões da render-farm.' },
            ],
          },
        },
        {
          id: 'iax.f05.boss.a2',
          kind: 'decision',
          title: 'E se a pessoa assumir direto?',
          prompt: 'Para um teste manual, a engenheira (usuária IAM, com chave e MFA) assume a render-farm **diretamente**, pedindo 3 horas. Isso é encadeamento?',
          concepts: [{ id: 'sts.role-chaining' }, { id: 'sts.assume-role', weight: 0.5 }],
          xp: 30,
          difficulty: 2,
          explanation: ['Encadeamento é assumir uma role com credenciais de outra role. Uma usuária IAM assumindo direto pode pedir até o máximo da role (8 h).'],
          options: [
            { id: 'a', text: 'Não: ela parte das próprias credenciais de usuária e pode pedir até 8 h', correct: true, consequence: 'A sessão de 3 h é criada.' },
            { id: 'b', text: 'Sim: toda sessão de role é limitada a 1 h', correct: false, consequence: 'O limite de 1 h é só do encadeamento.' },
          ],
        },
      ],
      debrief: { takeaways: ['Encadear roles limita a sessão a 1 h, mesmo com máximo maior na role.', 'Credenciais do instance profile são renovadas automaticamente.', 'Sessões de role não chamam GetSessionToken nem GetFederationToken.'] },
    },
  ],
}
