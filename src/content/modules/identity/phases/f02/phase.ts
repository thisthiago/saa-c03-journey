/**
 * Fase 2 — MFA. Tipos de fator, MFA do root, MFA na CLI e como exigir MFA
 * numa política sem cair na armadilha da chave ausente.
 */
import type { PhaseDef } from '../../../../../engine/types'
import type { BuilderLabConfig } from '../../../../../simulators/policy/builder'
import type { Principal, PolicyScenario, PolicyStatement } from '../../../../../simulators/policy/model'
import { META } from '../meta'
import { DECISION_OPTIONS, exhibit, pol } from '../shared'

const ACCT = '210987654321'
const PRONTUARIO = 'arn:aws:s3:::viva-prontuarios/pacientes/p-1042.pdf'

const bea = (id: string, via: 'console' | 'access-key' | 'session', mfa: boolean, name: string): Principal => ({ id, name, kind: 'user', account: ACCT, userName: 'bea.gestora', auth: { via, mfa }, identityPolicies: [] })

const BEA = [bea('console-mfa', 'console', true, 'Bea no console, com MFA'), bea('console-sem', 'console', false, 'Bea no console, sem MFA'), bea('chave', 'access-key', false, 'Bea na CLI, com a chave de acesso'), bea('sessao', 'session', true, 'Bea na CLI, com GetSessionToken e MFA')]

const RESOURCES = [
  { id: 'prontuario', arn: PRONTUARIO, account: ACCT, label: 'prontuário' },
  { id: 'marketing', arn: 'arn:aws:s3:::viva-marketing/banner.png', account: ACCT, label: 'imagem de marketing' },
]

const ALLOW_READ: PolicyStatement = { sid: 'LerProntuarios', effect: 'Allow', actions: ['s3:GetObject'], resources: ['arn:aws:s3:::viva-prontuarios/*'] }
const DENY_BOOL: PolicyStatement = { sid: 'NegarSemMFA', effect: 'Deny', actions: ['*'], resources: ['*'], conditions: [{ op: 'Bool', key: 'aws:MultiFactorAuthPresent', values: ['false'] }] }
const DENY_IFEXISTS: PolicyStatement = { ...DENY_BOOL, conditions: [{ op: 'Bool', ifExists: true, key: 'aws:MultiFactorAuthPresent', values: ['false'] }] }

/** Cenário com a política da Bea montada a partir dos statements. */
const withPolicy = (statements: PolicyStatement[]): PolicyScenario => ({
  principals: BEA.map((p) => ({ ...p, identityPolicies: [pol('PoliticaBea', statements)] })),
  resources: RESOURCES,
})

const BUILDER: BuilderLabConfig = {
  kind: 'identity',
  policyName: 'ProntuariosComMFA',
  attachedTo: 'Anexada ao grupo **Gestores**, do qual a Bea faz parte.',
  scenario: { principals: BEA, resources: RESOURCES },
  target: { type: 'identity', principalIds: BEA.map((b) => b.id) },
  palette: {
    actions: ['s3:GetObject', 's3:DeleteObject', 's3:*', '*'],
    resources: ['arn:aws:s3:::viva-prontuarios/*', 'arn:aws:s3:::*', '*'],
    conditions: [
      { id: 'mfa-true', label: 'Bool aws:MultiFactorAuthPresent = true', clause: { op: 'Bool', key: 'aws:MultiFactorAuthPresent', values: ['true'] } },
      { id: 'mfa-false', label: 'Bool aws:MultiFactorAuthPresent = false', clause: { op: 'Bool', key: 'aws:MultiFactorAuthPresent', values: ['false'] } },
      { id: 'mfa-false-ifexists', label: 'BoolIfExists aws:MultiFactorAuthPresent = false', clause: { op: 'Bool', ifExists: true, key: 'aws:MultiFactorAuthPresent', values: ['false'] } },
    ],
  },
  maxStatements: 3,
  tests: [
    { id: 't1', label: 'Bea no console, com MFA, lê um prontuário', request: { principalId: 'console-mfa', action: 's3:GetObject', resourceId: 'prontuario' }, expect: 'allow', why: 'Com MFA, a leitura de prontuários precisa funcionar.', concepts: ['iam.mfa-condition'] },
    { id: 't2', label: 'Bea na CLI, com GetSessionToken e MFA, lê um prontuário', request: { principalId: 'sessao', action: 's3:GetObject', resourceId: 'prontuario' }, expect: 'allow', why: 'As credenciais do GetSessionToken com MFA carregam aws:MultiFactorAuthPresent = true.', concepts: ['sts.get-session-token', 'iam.mfa-condition'] },
    { id: 't3', label: 'Bea no console, sem MFA, lê um prontuário', request: { principalId: 'console-sem', action: 's3:GetObject', resourceId: 'prontuario' }, expect: 'deny', why: 'Sem MFA, nada de prontuário.', concepts: ['iam.mfa-condition'] },
    { id: 't4', label: 'Bea na CLI, com a chave de acesso, lê um prontuário', request: { principalId: 'chave', action: 's3:GetObject', resourceId: 'prontuario' }, expect: 'deny', why: 'Com chave de acesso de longo prazo, a chave de MFA nem existe: a política precisa negar também esse caso.', concepts: ['iam.mfa-condition'] },
  ],
  probes: [
    { id: 'p1', label: 'Bea, com MFA, apaga um prontuário', request: { principalId: 'console-mfa', action: 's3:DeleteObject', resourceId: 'prontuario' }, expect: 'deny', why: 'A tarefa é ler. Permitir apagar prontuários vai além do necessário.' },
    { id: 'p2', label: 'Bea, com MFA, lê uma imagem de marketing', request: { principalId: 'console-mfa', action: 's3:GetObject', resourceId: 'marketing' }, expect: 'deny', why: 'A política é sobre prontuários: outros buckets ficam de fora.' },
  ],
  solution: [{ effect: 'Allow', actions: ['s3:GetObject'], resources: ['arn:aws:s3:::viva-prontuarios/*'], principals: [], conditions: ['mfa-true'] }],
}

// ---------------------------------------------------------------------------
// Chefe — a política "exigir MFA" adaptada pela equipe

const ADAPTED_DENY: PolicyStatement = {
  sid: 'NegarTudoSemMFAExcetoListadas',
  effect: 'Deny',
  notActions: ['iam:CreateVirtualMFADevice', 'iam:EnableMFADevice', 'iam:ListMFADevices', 'iam:GetUser', 'iam:CreateAccessKey', 'sts:GetSessionToken'],
  resources: ['*'],
  conditions: [{ op: 'Bool', key: 'aws:MultiFactorAuthPresent', values: ['false'] }],
}

export const F02_IAM: PhaseDef = {
  ...META.f02,
  concepts: ['iam.mfa', 'iam.mfa-types', 'iam.mfa-root', 'iam.mfa-recovery', 'sts.get-session-token', 'iam.mfa-condition', 's3.mfa-delete'],
  availability: 'available',
  simplifications: [
    'O simulador trata o login no console como sessão temporária: a chave aws:MultiFactorAuthPresent existe e vale true ou false. Com chave de acesso de longo prazo, ela não existe.',
    'A idade do MFA (aws:MultiFactorAuthAge) não é simulada.',
  ],
  missions: [
    // -----------------------------------------------------------------------
    {
      id: 'iax.f02.m1',
      title: 'Os fatores',
      type: 'mission',
      summary: 'Tipos de MFA, MFA do root e o que fazer quando um dispositivo some.',
      briefing: {
        company: 'Clínica Viva',
        role: 'Você é responsável pela segurança de uma rede de clínicas que guarda prontuários na AWS.',
        situation: 'Metade da equipe ainda recebia códigos por SMS no sistema antigo. A diretora quer MFA para todos na AWS e um plano para quando alguém perder o celular.',
        objective: 'Escolher os fatores certos e saber recuperar o acesso sem abrir brechas.',
        successCriteria: ['Classificar os tipos de MFA', 'Saber quem recupera um dispositivo perdido', 'Conhecer a regra do MFA no root'],
      },
      intel: [
        { conceptId: 'iam.mfa', body: ['**MFA** acrescenta algo que você **tem** à senha que você **sabe**. O root e cada usuário IAM podem registrar até **oito dispositivos**, de qualquer tipo; basta um para entrar. Registre mais de um.'] },
        { conceptId: 'iam.mfa-types', body: ['**Passkeys e chaves de segurança** (FIDO) resistem a phishing: são a recomendação da AWS. **App autenticador** e **token de hardware** geram códigos TOTP de seis dígitos. A AWS **não aceita mais registrar MFA por SMS**.'] },
        { conceptId: 'iam.mfa-root', body: ['A AWS **exige MFA no usuário raiz** de toda conta: avulsa, de gerenciamento ou membro. O MFA do root protege só o root; cada usuário IAM tem o seu.'] },
        { conceptId: 'iam.mfa-recovery', body: ['Perdeu um dispositivo? Entre com **outro registrado** e desative o perdido. Sem nenhum: o **usuário IAM** pede a um **administrador**; o **root** confirma o **e-mail e o telefone** da conta. Depois, troque a senha.'] },
      ],
      activities: [
        {
          id: 'iax.f02.m1.a1',
          kind: 'classify',
          title: 'Que fator é esse?',
          prompt: 'Classifique cada opção de segundo fator para a AWS.',
          concepts: [{ id: 'iam.mfa-types' }],
          xp: 50,
          difficulty: 1,
          explanation: ['FIDO (passkeys e chaves de segurança) resiste a phishing porque a resposta é amarrada ao site verdadeiro. Códigos TOTP podem ser digitados numa página falsa. SMS deixou de ser aceito.'],
          bins: [
            { id: 'fido', label: 'Resistente a phishing (FIDO)' },
            { id: 'totp', label: 'Código temporário (TOTP)' },
            { id: 'none', label: 'Não aceito pela AWS para registrar' },
          ],
          items: [
            { id: 'yubi', text: 'Chave de segurança USB que você toca para confirmar', bin: 'fido', explanation: 'Chave de segurança é uma passkey presa ao dispositivo, no padrão FIDO.' },
            { id: 'sync', text: 'Passkey sincronizada no gerenciador de senhas, desbloqueada com a digital', bin: 'fido', explanation: 'Passkeys sincronizadas também seguem o padrão FIDO.' },
            { id: 'app', text: 'Aplicativo autenticador no celular que mostra seis dígitos', bin: 'totp', explanation: 'É um dispositivo virtual de TOTP.' },
            { id: 'token', text: 'Token físico com visor de seis dígitos', bin: 'totp', explanation: 'Token de hardware TOTP.' },
            { id: 'sms', text: 'Código enviado por SMS', bin: 'none', explanation: 'A AWS encerrou o suporte para habilitar MFA por SMS.' },
          ],
        },
        {
          id: 'iax.f02.m1.a2',
          kind: 'classify',
          title: 'Quem destrava?',
          prompt: 'Para cada situação, indique como o acesso é recuperado.',
          concepts: [{ id: 'iam.mfa-recovery' }, { id: 'iam.mfa', weight: 0.5 }],
          xp: 50,
          difficulty: 2,
          explanation: ['Mais de um dispositivo evita a recuperação. Sem alternativa, o usuário IAM depende de um administrador e o root depende do e-mail e do telefone cadastrados na conta.'],
          bins: [
            { id: 'other', label: 'Entra com outro dispositivo registrado' },
            { id: 'admin', label: 'Um administrador desativa o dispositivo' },
            { id: 'contact', label: 'Verifica o e-mail e o telefone da conta' },
          ],
          items: [
            { id: 'u2', text: 'Gestora perdeu o celular com o app, mas também registrou uma chave de segurança', bin: 'other', explanation: 'Ela entra com a chave e desativa o dispositivo perdido.' },
            { id: 'u1', text: 'Recepcionista (usuário IAM) quebrou o único token registrado', bin: 'admin', explanation: 'Usuário IAM não recupera o MFA sozinho: um administrador desativa o dispositivo para que ele registre outro.' },
            { id: 'r1', text: 'Ninguém encontra o único dispositivo MFA do root', bin: 'contact', explanation: 'O root entra com fatores alternativos: e-mail e telefone principais da conta.' },
            { id: 'r2', text: 'O root tem uma segunda chave de segurança guardada no cofre', bin: 'other', explanation: 'É exatamente para isso que se registram vários dispositivos.' },
          ],
        },
        {
          id: 'iax.f02.m1.a3',
          kind: 'decision',
          title: 'Celular roubado',
          prompt: 'O celular da gestora, com o app autenticador, foi **roubado**. Ela entrou com a chave de segurança reserva. O que mais precisa ser feito?',
          concepts: [{ id: 'iam.mfa-recovery' }],
          xp: 30,
          difficulty: 2,
          explanation: ['Quem roubou o dispositivo pode ter também a senha. Desative o dispositivo perdido e troque a senha.'],
          options: [
            { id: 'a', text: 'Desativar o dispositivo roubado e trocar a senha', correct: true, consequence: 'O dispositivo deixa de valer e a senha que poderia estar junto com ele também.' },
            { id: 'b', text: 'Nada: a chave reserva já resolveu', correct: false, consequence: 'O app roubado continua registrado e, com a senha, ainda abre a conta.' },
            { id: 'c', text: 'Pedir o procedimento de recuperação com e-mail e telefone', correct: false, consequence: 'Não é necessário: ela já entrou com outro dispositivo.' },
          ],
        },
        {
          id: 'iax.f02.m1.a4',
          kind: 'decision',
          title: 'MFA do root numa conta-membro',
          prompt: 'A Clínica Viva tem uma organização com conta de gerenciamento e contas-membro (o root delas ainda tem senha). Um colega diz que só o root da conta de gerenciamento precisa de MFA. Ele está certo?',
          concepts: [{ id: 'iam.mfa-root' }],
          xp: 30,
          difficulty: 1,
          explanation: ['A AWS exige MFA no root de todos os tipos de conta. Outra saída, nas contas-membro, é remover as credenciais do root com o acesso root centralizado.'],
          options: [
            { id: 'a', text: 'Não: a AWS exige MFA no root de todos os tipos de conta, inclusive nas contas-membro', correct: true, consequence: 'Todo root com credenciais fica protegido.' },
            { id: 'b', text: 'Sim: as contas-membro herdam o MFA da conta de gerenciamento', correct: false, consequence: 'MFA não é herdado: cada root tem o seu.' },
            { id: 'c', text: 'Sim: com MFA nos usuários IAM, o root das contas-membro fica protegido', correct: false, consequence: 'O MFA de um usuário IAM não protege o root, e vice-versa.' },
          ],
        },
      ],
      debrief: { takeaways: ['Prefira passkeys e chaves de segurança; SMS não é mais aceito.', 'Registre mais de um dispositivo: perder um vira só um contratempo.', 'MFA no root é obrigatório em toda conta.'] },
    },
    // -----------------------------------------------------------------------
    {
      id: 'iax.f02.m2',
      title: 'MFA fora do console',
      type: 'mission',
      summary: 'MFA na CLI e a chave que desaparece com credenciais de longo prazo.',
      briefing: {
        company: 'Clínica Viva',
        role: 'Você continua na segurança da Clínica Viva.',
        situation: 'A equipe criou uma política que nega tudo sem MFA. No console, funcionou. Mas um analista conseguiu baixar prontuários pela CLI usando só a chave de acesso.',
        objective: 'Entender como o MFA chega às requisições da CLI e por que a política deixou passar.',
        successCriteria: ['Montar o fluxo do GetSessionToken', 'Prever Bool e BoolIfExists com chave de acesso', 'Saber quando a chave de MFA existe'],
      },
      intel: [
        { conceptId: 'sts.get-session-token', body: ['Na CLI, a chave de acesso não carrega MFA. O **GetSessionToken** recebe o número do dispositivo e o código (`SerialNumber` e `TokenCode`) e devolve **credenciais temporárias** marcadas com MFA. Passkeys não funcionam aqui: com elas, use `aws login`.'] },
        { conceptId: 'iam.mfa-condition', body: ['`aws:MultiFactorAuthPresent` só existe com **credenciais temporárias**. Com chave de acesso de longo prazo, **não existe**. Num Deny, `Bool` com `false` não pega a chave ausente; **`BoolIfExists`** pega. Num Allow, `Bool` com `true` só libera quem tem MFA.'] },
      ],
      activities: [
        {
          id: 'iax.f02.m2.a1',
          kind: 'order',
          title: 'MFA na linha de comando',
          prompt: 'O analista precisa usar a CLI numa ação protegida por MFA, com um app autenticador. Ordene os passos.',
          concepts: [{ id: 'sts.get-session-token' }],
          xp: 50,
          difficulty: 2,
          explanation: ['A chave de acesso só serve para pedir as credenciais temporárias; as chamadas protegidas usam as credenciais que o STS devolveu, até elas expirarem.'],
          steps: [
            { id: 's1', text: 'Ter uma chave de acesso e um dispositivo MFA (TOTP) registrados no usuário', explanation: 'São as duas coisas que o GetSessionToken pede.' },
            { id: 's2', text: 'Chamar `aws sts get-session-token` com o número do dispositivo e o código atual', explanation: 'Os parâmetros são SerialNumber e TokenCode.' },
            { id: 's3', text: 'Receber do STS credenciais temporárias, marcadas como autenticadas com MFA', explanation: 'Elas incluem um token de sessão e um prazo de validade.' },
            { id: 's4', text: 'Configurar a CLI para usar as credenciais temporárias', explanation: 'A chave de longo prazo sai de cena para as chamadas protegidas.' },
            { id: 's5', text: 'Executar a ação protegida: a condição de MFA é atendida', explanation: 'aws:MultiFactorAuthPresent agora existe e vale true.' },
            { id: 's6', text: 'Quando as credenciais expirarem, pedir novas com um código novo', explanation: 'O padrão é de 12 horas; o root tem no máximo 1 hora.' },
          ],
        },
        {
          id: 'iax.f02.m2.a2',
          kind: 'predict',
          title: 'Deny com Bool',
          prompt: 'A política da Bea tem os dois statements abaixo. Ela usa a CLI com a **chave de acesso de longo prazo**, sem GetSessionToken, e pede `s3:GetObject` num prontuário. O que acontece?',
          concepts: [{ id: 'iam.mfa-condition' }],
          xp: 40,
          difficulty: 3,
          exhibits: [exhibit('PoliticaBea', [ALLOW_READ, DENY_BOOL])],
          explanation: ['Com chave de longo prazo, `aws:MultiFactorAuthPresent` não existe. O operador `Bool` com uma chave ausente dá falso: o Deny não se aplica e o Allow libera a leitura. Foi assim que o analista baixou os prontuários.'],
          spec: { sim: 'policy', scenario: withPolicy([ALLOW_READ, DENY_BOOL]), request: { principalId: 'chave', action: 's3:GetObject', resourceId: 'prontuario' } },
          options: DECISION_OPTIONS,
        },
        {
          id: 'iax.f02.m2.a3',
          kind: 'predict',
          title: 'Deny com BoolIfExists',
          prompt: 'Agora o Deny usa **`BoolIfExists`**, como abaixo. A Bea repete o pedido com a chave de acesso. O que acontece?',
          concepts: [{ id: 'iam.mfa-condition' }],
          xp: 40,
          difficulty: 3,
          exhibits: [exhibit('PoliticaBea', [ALLOW_READ, DENY_IFEXISTS])],
          explanation: ['Com `…IfExists`, a ausência da chave conta como verdadeira: o Deny se aplica e vence o Allow.'],
          spec: { sim: 'policy', scenario: withPolicy([ALLOW_READ, DENY_IFEXISTS]), request: { principalId: 'chave', action: 's3:GetObject', resourceId: 'prontuario' } },
          options: DECISION_OPTIONS,
        },
        {
          id: 'iax.f02.m2.a4',
          kind: 'predict',
          title: 'Com GetSessionToken',
          prompt: 'Com a mesma política do desafio anterior (Deny com `BoolIfExists`), a Bea chama o **GetSessionToken com o código do app** e usa as credenciais temporárias para ler o prontuário. O que acontece?',
          concepts: [{ id: 'sts.get-session-token' }, { id: 'iam.mfa-condition', weight: 0.5 }],
          xp: 40,
          difficulty: 2,
          exhibits: [exhibit('PoliticaBea', [ALLOW_READ, DENY_IFEXISTS])],
          explanation: ['As credenciais do GetSessionToken com MFA trazem `aws:MultiFactorAuthPresent` = true: o Deny não se aplica e o Allow libera.'],
          spec: { sim: 'policy', scenario: withPolicy([ALLOW_READ, DENY_IFEXISTS]), request: { principalId: 'sessao', action: 's3:GetObject', resourceId: 'prontuario' } },
          options: DECISION_OPTIONS,
        },
        {
          id: 'iax.f02.m2.a5',
          kind: 'classify',
          title: 'A chave de MFA existe?',
          prompt: 'Em cada requisição, como fica `aws:MultiFactorAuthPresent` no contexto?',
          concepts: [{ id: 'iam.mfa-condition' }],
          xp: 50,
          difficulty: 3,
          explanation: ['A chave aparece em requisições com credenciais temporárias, com true ou false. Com chave de acesso de longo prazo, ela simplesmente não existe.'],
          bins: [
            { id: 'true', label: 'Existe e vale true' },
            { id: 'false', label: 'Existe e vale false' },
            { id: 'absent', label: 'Não existe' },
          ],
          items: [
            { id: 'cmfa', text: 'Ação no console de quem entrou com MFA', bin: 'true', explanation: 'A sessão do console registra que houve MFA.' },
            { id: 'csem', text: 'Ação no console de quem entrou sem MFA', bin: 'false', explanation: 'A sessão existe, mas sem MFA.' },
            { id: 'key', text: 'Chamada da CLI assinada com a chave de acesso do usuário', bin: 'absent', explanation: 'Credencial de longo prazo: a chave não entra no contexto.' },
            { id: 'gst', text: 'Chamada com credenciais de GetSessionToken pedidas com código MFA', bin: 'true', explanation: 'As credenciais temporárias carregam o MFA.' },
            { id: 'role', text: 'Chamada de uma sessão de role assumida sem informar MFA', bin: 'false', explanation: 'Sessão de role é credencial temporária: a chave existe, com false.' },
          ],
        },
      ],
      debrief: { takeaways: ['Na CLI, o MFA entra pelo GetSessionToken (ou `aws login` com passkeys).', 'Com chave de longo prazo, aws:MultiFactorAuthPresent não existe.', 'Deny de MFA usa BoolIfExists; Allow de MFA usa Bool com true.'] },
    },
    // -----------------------------------------------------------------------
    {
      id: 'iax.f02.m3',
      title: 'Exigir MFA',
      type: 'mission',
      summary: 'Monte uma política que só libera prontuários com MFA, em qualquer caminho.',
      briefing: {
        company: 'Clínica Viva',
        role: 'Você vai reescrever a política dos gestores.',
        situation: 'Os gestores leem prontuários pelo console e pela CLI. A nova regra: sem MFA, nenhum prontuário, nem pelo console, nem por chave de acesso.',
        objective: 'Montar a política com o construtor, testando os quatro jeitos de a Bea acessar.',
        successCriteria: ['Com MFA, a leitura funciona no console e na CLI', 'Sem MFA, nada passa', 'Nada além de ler prontuários'],
      },
      intel: [{ conceptId: 'iam.mfa-condition', body: ['Dois caminhos funcionam: um **Allow** com `Bool` igual a `true` (sem MFA não há Allow) ou um Allow comum mais um **Deny** com `BoolIfExists` igual a `false`. O que não funciona é o Deny com `Bool`.'] }],
      activities: [
        {
          id: 'iax.f02.m3.a1',
          kind: 'lab',
          lab: 'policy-builder',
          title: 'Prontuários só com MFA',
          prompt: 'Monte a política **ProntuariosComMFA**. Os testes à direita mostram, ao vivo, o que a AWS decidiria para cada jeito de a Bea acessar.',
          concepts: [{ id: 'iam.mfa-condition' }, { id: 'sts.get-session-token', weight: 0.5 }],
          xp: 140,
          difficulty: 3,
          hints: ['Comece pelo Allow: que ação e que recurso a Bea precisa?', 'Com chave de acesso, a chave de MFA não existe. Qual condição falha nesse caso?'],
          explanation: [
            'Solução mais curta: Allow `s3:GetObject` em `arn:aws:s3:::viva-prontuarios/*` com `Bool aws:MultiFactorAuthPresent = true`. Sem MFA (chave ausente ou false), não há Allow.',
            'Também vale: o Allow sem condição mais um Deny `*` com `BoolIfExists … = false`.',
          ],
          config: BUILDER,
        },
      ],
      debrief: { takeaways: ['Teste a política nos quatro caminhos: console com e sem MFA, chave de acesso e sessão temporária.', 'Allow com Bool true ou Deny com BoolIfExists false: os dois bloqueiam a chave de acesso.'] },
    },
    // -----------------------------------------------------------------------
    {
      id: 'iax.f02.boss',
      title: 'Chefe: Senha vazada',
      type: 'boss',
      summary: 'Uma senha caiu num phishing. A política de MFA deveria ter segurado o invasor.',
      passThreshold: 0.7,
      bonusXp: 120,
      briefing: {
        company: 'Clínica Viva',
        role: 'Você comanda a resposta a um incidente.',
        situation: 'O gerente administrativo caiu num e-mail falso e entregou a senha. Ele ainda não tinha registrado MFA. A política do grupo deveria negar tudo sem MFA, mas o invasor baixou prontuários.',
        objective: 'Descobrir por onde o invasor passou e fechar a brecha.',
        successCriteria: ['Apontar as evidências no log e na política', 'Encontrar a causa', 'Escolher as correções'],
      },
      intel: [{ conceptId: 's3.mfa-delete', body: ['MFA também protege dados: o **MFA delete** do S3 exige um código MFA para apagar versões de vez ou mudar o versionamento. Só o root, dono do bucket, o habilita, e só pela CLI ou pela API.'] }],
      activities: [
        {
          id: 'iax.f02.boss.a1',
          kind: 'investigate',
          title: 'Como o invasor passou?',
          prompt: 'A equipe adaptou a política de exemplo da AWS que nega tudo sem MFA. Examine a política e o CloudTrail.',
          concepts: [{ id: 'iam.mfa-condition' }, { id: 'iam.mfa', weight: 0.5 }],
          xp: 100,
          difficulty: 3,
          explanation: [
            'No console sem MFA, o invasor só conseguia as ações da lista de exceções, e a equipe tinha incluído `iam:CreateAccessKey` nela. Com a chave criada, as chamadas passaram a vir sem a chave de MFA no contexto, e o Deny com `Bool` deixou de se aplicar.',
            'A política original da AWS usa `BoolIfExists` e não libera a criação de chaves sem MFA.',
          ],
          artifacts: [
            {
              id: 'policy',
              title: 'Política do grupo Administrativo (trecho)',
              format: 'code',
              lines: [
                { id: 'p1', text: '"Effect": "Deny",', isIssue: false, explanation: 'Negar tudo sem MFA é a ideia certa.' },
                { id: 'p2', text: '"NotAction": ["iam:CreateVirtualMFADevice", "iam:EnableMFADevice", "iam:ListMFADevices", "iam:GetUser", "iam:CreateAccessKey", "sts:GetSessionToken"],', isIssue: true, explanation: 'A lista de exceções deixa criar chaves de acesso sem MFA.' },
                { id: 'p3', text: '"Resource": "*",', isIssue: false, explanation: 'Vale para todos os recursos, como esperado.' },
                { id: 'p4', text: '"Condition": { "Bool": { "aws:MultiFactorAuthPresent": "false" } }', isIssue: true, explanation: 'Com `Bool`, requisições sem a chave de MFA (chave de acesso) escapam do Deny.' },
              ],
            },
            {
              id: 'trail',
              title: 'CloudTrail (trecho)',
              format: 'log',
              lines: [
                { id: 'c1', text: '02:10 · luiz.adm · ConsoleLogin · MFAUsed: No · origem 198.51.100.77', isIssue: true, explanation: 'Login com a senha vazada, sem MFA, de um endereço desconhecido.' },
                { id: 'c2', text: '02:11 · luiz.adm · ListBuckets · AccessDenied', isIssue: false, explanation: 'No console sem MFA, o Deny funcionou: só as exceções passam.' },
                { id: 'c3', text: '02:12 · luiz.adm · CreateAccessKey · sucesso', isIssue: true, explanation: 'A exceção indevida: o invasor criou uma chave de acesso.' },
                { id: 'c4', text: '02:15 · luiz.adm (chave AKIA…77Q) · GetObject viva-prontuarios/pacientes/p-0007.pdf · sucesso', isIssue: true, explanation: 'Com a chave nova, a chave de MFA não existe e o Deny com Bool não se aplica.' },
                { id: 'c5', text: '08:30 · bea.gestora · ConsoleLogin · MFAUsed: Yes · origem 203.0.113.12', isIssue: false, explanation: 'Acesso normal da gestora, com MFA.' },
              ],
            },
          ],
          rootCause: {
            prompt: 'Qual é a causa?',
            options: [
              { id: 'r1', text: 'A política liberava criar chave de acesso sem MFA e usava Bool: as chamadas com a chave nova não tinham a chave de MFA e escaparam do Deny.', correct: true, feedback: 'Isso: duas mudanças em relação ao exemplo da AWS abriram o caminho.' },
              { id: 'r2', text: 'O phishing quebrou o MFA do gerente.', correct: false, feedback: 'O gerente não tinha MFA registrado; o login foi feito só com a senha.' },
              { id: 'r3', text: 'O bucket de prontuários era público.', correct: false, feedback: 'As leituras foram assinadas com uma chave de acesso do usuário, não anônimas.' },
              { id: 'r4', text: 'A gestora Bea compartilhou a chave dela.', correct: false, feedback: 'A chave usada foi criada às 02:12 no usuário do gerente.' },
            ],
          },
          remediations: {
            prompt: 'Quais correções aplicar? (selecione todas as adequadas)',
            options: [
              { id: 'f1', text: 'Desativar e excluir a chave AKIA…77Q e trocar a senha do gerente.', correct: true, feedback: 'Contém o incidente: a chave e a senha do invasor deixam de valer.' },
              { id: 'f2', text: 'Trocar Bool por BoolIfExists e tirar iam:CreateAccessKey das exceções.', correct: true, feedback: 'Volta à política de exemplo da AWS: sem MFA, nem chave nova, nem acesso por chave.' },
              { id: 'f3', text: 'Exigir que o gerente registre uma passkey ou chave de segurança.', correct: true, feedback: 'MFA resistente a phishing teria barrado o login com a senha vazada.' },
              { id: 'f4', text: 'Ativar o MFA delete no bucket de prontuários e encerrar o incidente.', correct: false, feedback: 'O MFA delete protege contra exclusões, não contra leituras: o vazamento continuaria possível.' },
              { id: 'f5', text: 'Bloquear o endereço 198.51.100.77 e manter a política como está.', correct: false, feedback: 'O invasor só precisa trocar de endereço: a brecha na política continua.' },
            ],
          },
        },
        {
          id: 'iax.f02.boss.a2',
          kind: 'predict',
          title: 'Depois da correção',
          prompt: 'Com a política corrigida (abaixo), alguém tenta de novo baixar um prontuário com uma **chave de acesso** do gerente, sem MFA. O que acontece?',
          concepts: [{ id: 'iam.mfa-condition' }],
          xp: 40,
          difficulty: 2,
          exhibits: [exhibit('Política corrigida (trecho)', [ALLOW_READ, { ...ADAPTED_DENY, notActions: ['iam:CreateVirtualMFADevice', 'iam:EnableMFADevice', 'iam:ListMFADevices', 'iam:GetUser', 'sts:GetSessionToken'], conditions: [{ op: 'Bool', ifExists: true, key: 'aws:MultiFactorAuthPresent', values: ['false'] }] }])],
          explanation: ['Sem a chave de MFA, `BoolIfExists` trata a ausência como verdadeira: o Deny se aplica a `s3:GetObject`, que não está nas exceções.'],
          spec: {
            sim: 'policy',
            scenario: withPolicy([ALLOW_READ, { ...ADAPTED_DENY, notActions: ['iam:CreateVirtualMFADevice', 'iam:EnableMFADevice', 'iam:ListMFADevices', 'iam:GetUser', 'sts:GetSessionToken'], conditions: [{ op: 'Bool', ifExists: true, key: 'aws:MultiFactorAuthPresent', values: ['false'] }] }]),
            request: { principalId: 'chave', action: 's3:GetObject', resourceId: 'prontuario' },
          },
          options: DECISION_OPTIONS,
        },
        {
          id: 'iax.f02.boss.a3',
          kind: 'decision',
          title: 'Proteger também contra exclusão',
          prompt: 'A diretora quer que, mesmo com uma credencial roubada, ninguém consiga **apagar versões antigas** de prontuários de vez. O bucket já tem versionamento. Qual recurso atende?',
          concepts: [{ id: 's3.mfa-delete' }],
          xp: 30,
          difficulty: 2,
          explanation: ['O MFA delete exige um código MFA para excluir versões permanentemente e para mudar o versionamento. Só o root o habilita, pela CLI ou pela API.'],
          options: [
            { id: 'a', text: 'MFA delete no bucket, habilitado pelo root pela CLI', correct: true, consequence: 'Excluir uma versão de vez passa a exigir o dispositivo MFA do dono do bucket.' },
            { id: 'b', text: 'Uma política de grupo com Deny s3:DeleteObject', correct: false, consequence: 'Ajuda, mas quem tiver permissão para mudar a política desfaz a proteção sem MFA.' },
            { id: 'c', text: 'Mais um dispositivo MFA para cada gestor', correct: false, consequence: 'Mais dispositivos facilitam a recuperação, mas não mudam o que é preciso para apagar versões.' },
          ],
        },
      ],
      debrief: { takeaways: ['Uma exceção a mais na política de MFA (criar chave) abre caminho para escapar do MFA.', 'Deny de MFA com BoolIfExists: a ausência da chave também é negada.', 'MFA delete protege versões contra exclusão definitiva.'] },
    },
  ],
}
