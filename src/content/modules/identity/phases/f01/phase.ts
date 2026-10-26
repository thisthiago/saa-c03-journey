/**
 * Fase 1 — Identidades e a conta. Usuário raiz, usuários, grupos, roles e o
 * tipo de credencial de cada um.
 */
import type { PhaseDef } from '../../../../../engine/types'
import type { CredentialsLabConfig } from '../../../../../simulators/credentials/lab'
import type { PolicyScenario } from '../../../../../simulators/policy/model'
import { META } from '../meta'
import { DECISION_OPTIONS, exhibit, pol } from '../shared'

// ---------------------------------------------------------------------------
// Missão 1 — usuário raiz (Fermento Digital)

const FERMENTO: PolicyScenario = {
  accounts: [{ id: '111122223333', name: 'Fermento Digital' }],
  principals: [{ id: 'root', name: 'usuário raiz', kind: 'root', account: '111122223333', auth: { via: 'console', mfa: true } }],
  resources: [{ id: 'bucket', arn: 'arn:aws:s3:::fermento-fotos-antigas', account: '111122223333', label: 'bucket fermento-fotos-antigas' }],
}

// ---------------------------------------------------------------------------
// Missão 2 — usuários, grupos e roles (Ateliê Tramas)

const DEV_GROUP_POLICY = [{ sid: 'LerFotos', effect: 'Allow' as const, actions: ['s3:GetObject'], resources: ['arn:aws:s3:::tramas-fotos/*'] }]

const TRAMAS: PolicyScenario = {
  principals: [
    {
      id: 'leo',
      name: 'Leo',
      kind: 'user',
      account: '444455556666',
      userName: 'leo',
      identityPolicies: [],
      groups: [{ name: 'Desenvolvedores', policies: [pol('LeituraFotos', DEV_GROUP_POLICY)] }],
    },
  ],
  resources: [
    { id: 'foto', arn: 'arn:aws:s3:::tramas-fotos/produtos/cesta.jpg', account: '444455556666', label: 'foto de produto' },
    { id: 'pedido', arn: 'arn:aws:s3:::tramas-pedidos/2026/10/p-981.json', account: '444455556666', label: 'arquivo de pedido' },
  ],
}

// ---------------------------------------------------------------------------
// Chefe — Conta herdada (Agro Semente)

const NOW = 'Hoje é 19/10/2026.'

const CREDENTIALS_LAB: CredentialsLabConfig = {
  account: '777788889999',
  policy: { rotateAfterDays: 90, unusedAfterDays: 90, federation: true },
  rows: [
    { id: 'root', name: '<root_account>', kind: 'root', use: 'root', password: true, mfa: false, keys: [{ id: 'AKIA…R00T', active: true, ageDays: 930, lastUsedDays: 1 }], note: 'A chave estava num script antigo de backup.' },
    { id: 'joana', name: 'joana.ops', kind: 'user', use: 'person', password: true, mfa: false, keys: [{ id: 'AKIA…J01', active: true, ageDays: 410, lastUsedDays: 2 }], note: 'Engenheira de operações; usa console e CLI todo dia.' },
    { id: 'cotacoes', name: 'app-cotacoes', kind: 'user', use: 'ec2-app', password: false, mfa: false, keys: [{ id: 'AKIA…C07', active: true, ageDays: 203, lastUsedDays: 0 }], note: 'A chave fica num arquivo de configuração dentro da instância.' },
    { id: 'erp', name: 'sync-erp', kind: 'user', use: 'onprem', password: false, mfa: false, keys: [{ id: 'AKIA…E44', active: true, ageDays: 60, lastUsedDays: 0 }], note: 'Servidor do ERP no escritório da fazenda, que envia notas fiscais para um bucket.' },
    { id: 'saas', name: 'backup-saas', kind: 'user', use: 'third-party', password: false, mfa: false, keys: [{ id: 'AKIA…B12', active: true, ageDays: 199, lastUsedDays: 0 }], note: 'Ferramenta de backup contratada que só aceita chave de acesso.' },
    { id: 'estagio', name: 'ex-estagiario', kind: 'user', use: 'nobody', password: true, mfa: false, keys: [{ id: 'AKIA…X90', active: true, ageDays: 300, lastUsedDays: null }], note: 'Último login no console há 280 dias.' },
    { id: 'glass', name: 'break-glass', kind: 'user', use: 'emergency', password: true, mfa: true, keys: [], note: 'Senha e MFA guardados em envelopes com pessoas diferentes.' },
    { id: 'role', name: 'role-relatorios-lambda', kind: 'role', use: 'role', password: false, mfa: false, keys: [], note: 'Assumida pela função Lambda que gera relatórios.' },
  ],
  concepts: {
    root: ['iam.root-best-practices'],
    joana: ['iam.long-vs-temp'],
    cotacoes: ['iam.roles', 'iam.long-vs-temp'],
    erp: ['iam.long-vs-temp'],
    saas: ['iam.key-rotation', 'iam.when-iam-user'],
    estagio: ['iam.credential-report'],
    glass: ['iam.when-iam-user'],
    role: ['iam.roles'],
  },
}

export const F01_IAM: PhaseDef = {
  ...META.f01,
  concepts: [
    'iam.authn-authz',
    'iam.identities',
    'iam.root-user',
    'iam.root-tasks',
    'iam.root-best-practices',
    'iam.users',
    'iam.groups',
    'iam.roles',
    'iam.principal',
    'iam.long-vs-temp',
    'iam.access-keys',
    'iam.key-rotation',
    'iam.when-iam-user',
    'iam.credential-report',
  ],
  availability: 'available',
  simplifications: [
    'As contas, os nomes e as datas são fictícios; as regras de rotação e de abandono de credenciais são premissas das empresas do cenário.',
    'O relatório de credenciais aparece resumido: o arquivo real tem mais colunas.',
  ],
  missions: [
    // -----------------------------------------------------------------------
    {
      id: 'iax.f01.m1',
      title: 'A chave-mestra',
      type: 'mission',
      summary: 'O que só o usuário raiz pode fazer e como guardá-lo.',
      briefing: {
        company: 'Fermento Digital',
        role: 'Você acabou de assumir a conta AWS de uma rede de padarias com loja online.',
        situation: 'O sócio que criou a conta usava o próprio e-mail e o usuário raiz para tudo, inclusive num script de backup que guarda uma chave de acesso do root.',
        objective: 'Separar o que realmente exige o usuário raiz e protegê-lo como uma chave-mestra.',
        successCriteria: ['Reconhecer as tarefas que exigem o root', 'Tirar o root dos scripts', 'Escolher as proteções certas para o root'],
      },
      intel: [
        { conceptId: 'iam.authn-authz', body: ['**Autenticação** responde "quem é você?" (senha, MFA, chave de acesso). **Autorização** responde "você pode fazer isto?" (políticas). Toda requisição à AWS passa pelas duas.'] },
        { conceptId: 'iam.root-user', body: ['O **usuário raiz** nasce com a conta e entra com **e-mail e senha**. Por padrão ele tem **acesso total**: as políticas de identidade não se aplicam a ele. Numa conta-membro de uma organização, SCPs e RCPs ainda o limitam.'] },
        { conceptId: 'iam.root-tasks', body: ['Só o root faz, por exemplo: mudar o e-mail ou a senha do root e **fechar a conta** (em contas avulsas), **restaurar** as permissões do único administrador, ativar o acesso do IAM à **cobrança**, habilitar o **MFA delete** e destravar uma **bucket policy que nega todos**.'] },
        { conceptId: 'iam.root-best-practices', body: ['Proteja o root: **MFA** (obrigatório em todo tipo de conta), **nenhuma chave de acesso**, senha forte, **e-mail de grupo** e aprovação de duas pessoas (um grupo guarda a senha, outro o MFA). Para o dia a dia, use uma identidade administrativa.'] },
      ],
      activities: [
        {
          id: 'iax.f01.m1.a1',
          kind: 'classify',
          title: 'Precisa do root?',
          prompt: 'A Fermento Digital é uma **conta avulsa** (fora de qualquer organização). Classifique cada tarefa.',
          concepts: [{ id: 'iam.root-tasks' }],
          xp: 50,
          difficulty: 2,
          explanation: ['A lista de tarefas que exigem o root é curta e serve para emergências e mudanças da própria conta. Criar recursos, usuários e políticas é trabalho de identidades administrativas.'],
          bins: [
            { id: 'root', label: 'Só o usuário raiz', description: 'Exige entrar como root' },
            { id: 'admin', label: 'Uma identidade administrativa resolve', description: 'Com as permissões certas' },
          ],
          items: [
            { id: 'email', text: 'Trocar o e-mail de contato do root, que hoje é o pessoal do sócio', bin: 'root', explanation: 'Alterar as configurações do root (e-mail e senha) numa conta avulsa exige o root.' },
            { id: 'close', text: 'Fechar uma conta de testes que não será mais usada', bin: 'root', explanation: 'Fechar uma conta avulsa é tarefa do root.' },
            { id: 'locked', text: 'Devolver permissões ao único administrador IAM, que removeu a própria política por engano', bin: 'root', explanation: 'Restaurar as permissões do único administrador é uma das tarefas reservadas ao root.' },
            { id: 'billing', text: 'Permitir pela primeira vez que usuários IAM vejam a cobrança', bin: 'root', explanation: 'Ativar o acesso do IAM ao console de Billing exige o root.' },
            { id: 'mfadel', text: 'Habilitar o MFA delete no bucket de notas fiscais', bin: 'root', explanation: 'Só o dono do bucket (o root) habilita o MFA delete.', concepts: ['iam.root-tasks'] },
            { id: 'denyall', text: 'Remover uma bucket policy com Deny para "*" que trancou todo mundo fora do bucket', bin: 'root', explanation: 'Uma bucket policy que nega todos os principais só pode ser apagada pelo root.' },
            { id: 'user', text: 'Criar um usuário para o novo contador', bin: 'admin', explanation: 'Qualquer identidade com permissão no IAM cria usuários; não precisa do root.' },
            { id: 'bucket', text: 'Criar um bucket para as fotos dos produtos', bin: 'admin', explanation: 'Criar recursos é trabalho do dia a dia: use uma identidade com as permissões certas.' },
            { id: 'invoice', text: 'Ver a fatura do mês, depois que o acesso do IAM à cobrança foi ativado', bin: 'admin', explanation: 'Com o acesso ativado, usuários e roles com permissão de Billing veem a fatura.' },
          ],
        },
        {
          id: 'iax.f01.m1.a2',
          kind: 'decision',
          title: 'A chave do root no script',
          prompt: 'O script de backup usa uma **chave de acesso do usuário raiz** gravada no próprio arquivo. O que fazer?',
          concepts: [{ id: 'iam.root-best-practices' }, { id: 'iam.root-user', weight: 0.5 }],
          xp: 40,
          difficulty: 2,
          explanation: ['O root tem acesso total, inclusive à cobrança e ao fechamento da conta. Uma chave dele num script transforma qualquer vazamento do arquivo no pior incidente possível. A AWS recomenda não criar chaves de acesso para o root.'],
          options: [
            { id: 'a', text: 'Dar ao backup uma identidade própria com só as permissões do backup e excluir a chave do root.', correct: true, consequence: 'O script continua funcionando com o mínimo necessário, e a chave mais perigosa da conta deixa de existir.', impacts: { seguranca: 2 } },
            { id: 'b', text: 'Manter a chave do root, mas rotacioná-la a cada 90 dias.', correct: false, consequence: 'Rotacionar não muda o fato de que a chave pode tudo: um vazamento ainda entrega a conta inteira.', impacts: { seguranca: -1 } },
            { id: 'c', text: 'Habilitar MFA no root e deixar a chave como está.', correct: false, consequence: 'O MFA protege o login no console, mas a chave de acesso continua assinando chamadas sem pedir MFA.', impacts: { seguranca: -1 } },
            { id: 'd', text: 'Mover a chave do root para uma variável de ambiente do servidor.', correct: false, consequence: 'O segredo muda de lugar, mas continua sendo uma credencial de longo prazo com acesso total.', impacts: { seguranca: -1 } },
          ],
          justification: {
            prompt: 'Qual princípio justifica a decisão?',
            options: [
              { id: 'j1', text: 'O root deve ser usado só nas tarefas que o exigem, e nunca com chaves de acesso.', correct: true, feedback: 'Isso: o backup não é uma tarefa de root.' },
              { id: 'j2', text: 'Chaves de acesso nunca podem ser usadas em scripts.', correct: false, feedback: 'Há exceções aceitáveis para usuários IAM; o problema aqui é ser a chave do root.' },
            ],
          },
        },
        {
          id: 'iax.f01.m1.a3',
          kind: 'decision',
          multiple: true,
          title: 'Guardando a chave-mestra',
          prompt: 'Quais medidas protegem o usuário raiz da Fermento Digital? (selecione todas as adequadas)',
          concepts: [{ id: 'iam.root-best-practices' }],
          xp: 40,
          difficulty: 2,
          explanation: ['As boas práticas da AWS para o root: MFA, nenhuma chave de acesso, senha forte, e-mail de grupo, aprovação de mais de uma pessoa e monitoramento de cada login.'],
          options: [
            { id: 'mfa', text: 'Registrar MFA no root, de preferência uma chave de segurança ou passkey', correct: true, consequence: 'A AWS exige MFA no root, e os métodos FIDO resistem a phishing.' },
            { id: 'mail', text: 'Trocar o e-mail do root por um endereço de grupo da empresa', correct: true, consequence: 'Mensagens da AWS chegam mesmo se alguém sair da empresa ou estiver de férias.' },
            { id: 'split', text: 'Um grupo guarda a senha e outro guarda o MFA', correct: true, consequence: 'Ninguém consegue entrar como root sozinho.' },
            { id: 'alert', text: 'Criar um alerta para todo login do root', correct: true, consequence: 'Um uso inesperado do root vira um aviso imediato para a equipe de segurança.' },
            { id: 'share', text: 'Compartilhar a senha do root com a equipe de plantão, para emergências', correct: false, consequence: 'Senha compartilhada é senha sem dono: o acesso total fica nas mãos de muita gente.' },
            { id: 'daily', text: 'Usar o root no dia a dia, já que ele terá MFA', correct: false, consequence: 'MFA não reduz o estrago de um erro feito com acesso total. O root fica guardado.' },
          ],
        },
        {
          id: 'iax.f01.m1.a4',
          kind: 'predict',
          title: 'O root e a política',
          prompt: 'A Fermento Digital é uma conta avulsa. O usuário raiz, sem nenhuma política anexada (ele nem pode receber políticas de identidade), pede `s3:DeleteBucket` num bucket sem bucket policy. O que a AWS decide?',
          concepts: [{ id: 'iam.root-user' }],
          xp: 30,
          difficulty: 1,
          explanation: ['Tudo começa negado, exceto para o usuário raiz, que tem acesso total na própria conta. Por isso ele fica guardado: um erro dele não é limitado por nenhuma política de identidade.'],
          spec: { sim: 'policy', scenario: FERMENTO, request: { principalId: 'root', action: 's3:DeleteBucket', resourceId: 'bucket' } },
          options: DECISION_OPTIONS,
        },
      ],
      debrief: { takeaways: ['O root tem acesso total na própria conta e não recebe políticas de identidade.', 'Poucas tarefas exigem o root; o resto é feito por identidades administrativas.', 'Root com MFA, sem chaves de acesso, e-mail de grupo e uso raro e monitorado.'] },
    },
    // -----------------------------------------------------------------------
    {
      id: 'iax.f01.m2',
      title: 'Usuários, grupos e roles',
      type: 'mission',
      summary: 'Quem existe na conta e quem pode fazer uma requisição.',
      briefing: {
        company: 'Ateliê Tramas',
        role: 'Você organiza o acesso de um marketplace de artesanato que acabou de contratar cinco desenvolvedores.',
        situation: 'Hoje cada pessoa recebe políticas uma a uma, a aplicação usa a chave de um colaborador e ninguém sabe dizer quem acessou o quê.',
        objective: 'Usar a identidade certa para cada caso e entender quem pode aparecer como principal.',
        successCriteria: ['Distinguir usuário, grupo, role e sessão', 'Saber o que pode ser principal', 'Prever o efeito de uma política de grupo'],
      },
      intel: [
        { conceptId: 'iam.users', visual: 'iam-entities', body: ['Um **usuário IAM** é uma identidade com **credenciais de longo prazo**: senha para o console e até **duas chaves de acesso**. Ele começa sem nenhuma permissão.'] },
        { conceptId: 'iam.groups', body: ['Um **grupo** reúne usuários para anexar permissões de uma vez. Ele **não contém outros grupos** e **não é um principal**: ninguém "faz uma requisição como grupo".'] },
        { conceptId: 'iam.roles', body: ['Uma **role** não tem senha nem chaves. Quem a **trust policy** permite assume a role e recebe **credenciais temporárias** com as permissões dela: pessoas, serviços como o EC2, outras contas ou usuários de um provedor externo.'] },
        { conceptId: 'iam.principal', body: ['**Principal** é quem faz a requisição: root, usuário IAM, **sessão de role**, usuário federado, serviço da AWS ou anônimo. Numa política de recurso, o elemento Principal diz quem recebe o acesso; grupos não podem aparecer ali.'] },
        { conceptId: 'iam.identities' },
      ],
      activities: [
        {
          id: 'iax.f01.m2.a1',
          kind: 'match',
          title: 'Cada entidade no seu lugar',
          prompt: 'Associe cada entidade do IAM à descrição correta.',
          concepts: [{ id: 'iam.identities' }, { id: 'iam.users', weight: 0.5 }, { id: 'iam.groups', weight: 0.5 }, { id: 'iam.roles', weight: 0.5 }],
          xp: 50,
          difficulty: 1,
          explanation: ['Usuários e o root têm credenciais de longo prazo; roles entregam sessões temporárias; grupos e políticas organizam permissões, mas não autenticam ninguém.'],
          leftLabel: 'Entidade',
          rightLabel: 'Descrição',
          pairs: [
            { id: 'root', left: 'Usuário raiz', right: 'Criado com a conta, entra com e-mail e senha e tem acesso total', explanation: 'É a única identidade que nasce com acesso total.', concepts: ['iam.root-user'] },
            { id: 'user', left: 'Usuário IAM', right: 'Identidade com senha e chaves de acesso de longo prazo', explanation: 'As credenciais do usuário valem até alguém removê-las.', concepts: ['iam.users'] },
            { id: 'group', left: 'Grupo IAM', right: 'Coleção de usuários que recebe políticas de uma vez', explanation: 'Grupos organizam permissões; não fazem requisições.', concepts: ['iam.groups'] },
            { id: 'role', left: 'Role IAM', right: 'Identidade sem credenciais fixas, assumida por quem a trust policy permite', explanation: 'Quem assume a role recebe credenciais temporárias.', concepts: ['iam.roles'] },
            { id: 'session', left: 'Sessão de role', right: 'Credenciais temporárias de quem assumiu uma role, que expiram sozinhas', explanation: 'É a sessão, e não a role, que aparece como principal das requisições.', concepts: ['iam.principal'] },
          ],
        },
        {
          id: 'iax.f01.m2.a2',
          kind: 'classify',
          title: 'Quem pode ser principal?',
          prompt: 'O que pode aparecer no elemento **Principal** de uma bucket policy?',
          concepts: [{ id: 'iam.principal' }, { id: 'iam.groups', weight: 0.5 }],
          xp: 50,
          difficulty: 2,
          explanation: ['Principais são entidades autenticadas (ou "*", todos). Grupos se referem a permissões, não a autenticação, e por isso não podem ser principal.'],
          bins: [
            { id: 'yes', label: 'Pode ser principal' },
            { id: 'no', label: 'Não pode ser principal' },
          ],
          items: [
            { id: 'acct', text: 'Uma conta AWS (444455556666)', bin: 'yes', explanation: 'Citar a conta delega o acesso a ela; lá dentro, um administrador ainda precisa conceder às identidades.', concepts: ['iam.principal'] },
            { id: 'user', text: 'O usuário IAM leo', bin: 'yes', explanation: 'Usuários IAM podem ser citados pelo ARN.', concepts: ['iam.principal'] },
            { id: 'role', text: 'A role app-catalogo', bin: 'yes', explanation: 'Roles podem ser citadas pelo ARN; quem faz a requisição é a sessão da role.', concepts: ['iam.principal'] },
            { id: 'svc', text: 'O serviço cloudtrail.amazonaws.com', bin: 'yes', explanation: 'Serviços da AWS aparecem como principal de serviço.', concepts: ['iam.principal'] },
            { id: 'group', text: 'O grupo Desenvolvedores', bin: 'no', explanation: 'Grupos não podem ser principal: dê o acesso aos usuários (pela política do grupo) ou a uma role.', concepts: ['iam.groups'] },
            { id: 'policy', text: 'A política gerenciada LeituraFotos', bin: 'no', explanation: 'Política é um documento de permissões, não uma identidade.', concepts: ['iam.principal'] },
          ],
        },
        {
          id: 'iax.f01.m2.a3',
          kind: 'predict',
          title: 'A política do grupo',
          prompt: 'No Ateliê Tramas, o usuário IAM **leo** não tem política própria, mas pertence ao grupo **Desenvolvedores**, que tem a política abaixo. Leo pede `s3:GetObject` numa foto de produto. O que acontece?',
          concepts: [{ id: 'iam.groups' }, { id: 'iam.authn-authz', weight: 0.5 }],
          xp: 30,
          difficulty: 1,
          exhibits: [exhibit('Política LeituraFotos (anexada ao grupo Desenvolvedores)', DEV_GROUP_POLICY)],
          explanation: ['As políticas de todos os grupos do usuário entram na avaliação junto com as dele. Basta uma delas permitir, sem nenhum Deny.'],
          spec: { sim: 'policy', scenario: TRAMAS, request: { principalId: 'leo', action: 's3:GetObject', resourceId: 'foto' } },
          options: DECISION_OPTIONS,
        },
        {
          id: 'iax.f01.m2.a4',
          kind: 'predict',
          title: 'Fora do que o grupo permite',
          prompt: 'No Ateliê Tramas, o usuário IAM **leo** não tem política própria, mas pertence ao grupo **Desenvolvedores**, que tem a política abaixo. Leo pede `s3:GetObject` num **arquivo de pedido**, no bucket `tramas-pedidos`. Nenhuma outra política se aplica. O que acontece?',
          concepts: [{ id: 'iam.groups' }],
          xp: 30,
          difficulty: 1,
          exhibits: [exhibit('Política LeituraFotos (anexada ao grupo Desenvolvedores)', DEV_GROUP_POLICY)],
          explanation: ['Nada permite a leitura em `tramas-pedidos`, e não existe Deny: é um **deny implícito**. Nenhum Deny precisa ser escrito para negar o que nunca foi permitido.'],
          spec: { sim: 'policy', scenario: TRAMAS, request: { principalId: 'leo', action: 's3:GetObject', resourceId: 'pedido' } },
          options: DECISION_OPTIONS,
        },
        {
          id: 'iax.f01.m2.a5',
          kind: 'decision',
          title: 'Grupo dentro de grupo',
          prompt: 'A equipe quer criar o grupo **Engenharia** contendo os grupos **Backend** e **Frontend**, para anexar a política comum uma vez só. O que você responde?',
          concepts: [{ id: 'iam.groups' }],
          xp: 30,
          difficulty: 2,
          explanation: ['Grupos IAM contêm só usuários; não existe aninhamento. Uma política gerenciada pode ser anexada a vários grupos, e um usuário pode estar em vários grupos.'],
          options: [
            { id: 'a', text: 'Não dá para aninhar grupos: anexe a mesma política gerenciada aos dois grupos (ou coloque as pessoas também no grupo Engenharia).', correct: true, consequence: 'A política comum continua mantida num lugar só, e cada grupo recebe o que precisa.' },
            { id: 'b', text: 'Crie o grupo Engenharia e adicione Backend e Frontend como membros.', correct: false, consequence: 'O IAM não aceita: um grupo só tem usuários como membros.' },
            { id: 'c', text: 'Use uma role Engenharia como grupo-pai dos dois grupos.', correct: false, consequence: 'Roles não contêm grupos; elas são assumidas.' },
          ],
        },
      ],
      debrief: { takeaways: ['Usuários têm credenciais de longo prazo; roles entregam sessões temporárias.', 'Grupos organizam permissões de usuários, não podem ser aninhados e não são principal.', 'O que nada permite é negado implicitamente.'] },
    },
    // -----------------------------------------------------------------------
    {
      id: 'iax.f01.m3',
      title: 'Longo prazo ou temporária?',
      type: 'mission',
      summary: 'Credenciais que expiram sozinhas, chaves de acesso e as exceções.',
      briefing: {
        company: 'Rota Fácil',
        role: 'Você cuida da plataforma de uma transportadora que roteiriza entregas.',
        situation: 'Há chaves de acesso por toda parte: na CLI dos motoristas-gestores, no código das aplicações e num servidor do armazém. Algumas têm mais de dois anos.',
        objective: 'Trocar credenciais de longo prazo por temporárias onde der, e cuidar bem das que sobrarem.',
        successCriteria: ['Reconhecer credenciais de longo prazo e temporárias', 'Rotacionar uma chave sem derrubar a aplicação', 'Saber quando um usuário IAM é aceitável'],
      },
      intel: [
        { conceptId: 'iam.long-vs-temp', body: ['**Longo prazo**: senhas e chaves de acesso valem até alguém removê-las. **Temporárias**: sessões de role, federação e `GetSessionToken` **expiram sozinhas**. A AWS recomenda temporárias para pessoas (federação) e para workloads (roles).'] },
        { conceptId: 'iam.access-keys', body: ['Uma **chave de acesso** é o par ID + segredo que assina chamadas da CLI e das APIs. São no máximo **duas por usuário**, e o segredo **só aparece na criação**: perdeu, exclua e crie outra.'] },
        { conceptId: 'iam.key-rotation', body: ['Para rotacionar sem derrubar nada: crie a **segunda chave**, troque nas aplicações, confira o **último uso** da antiga, **desative** a antiga, confirme que tudo funciona e só então **exclua**.'] },
        { conceptId: 'iam.when-iam-user', body: ['Usuário IAM com chave é **exceção**: ferramenta de terceiros que só aceita chave, workload que não consegue usar role ou **acesso de emergência**. Aplicações em EC2 usam roles; servidores fora da AWS podem usar o **IAM Roles Anywhere**.'] },
      ],
      activities: [
        {
          id: 'iax.f01.m3.a1',
          kind: 'classify',
          title: 'Quanto tempo vale?',
          prompt: 'Classifique cada credencial.',
          concepts: [{ id: 'iam.long-vs-temp' }],
          xp: 50,
          difficulty: 1,
          explanation: ['Credenciais temporárias saem do STS (direta ou indiretamente) e expiram; as de longo prazo ficam valendo até alguém agir.'],
          bins: [
            { id: 'long', label: 'Longo prazo', description: 'Vale até ser removida' },
            { id: 'temp', label: 'Temporária', description: 'Expira sozinha' },
          ],
          items: [
            { id: 'pwd', text: 'Senha do console de um usuário IAM', bin: 'long', explanation: 'Vale até ser trocada ou removida.' },
            { id: 'key', text: 'Chave de acesso de um usuário IAM', bin: 'long', explanation: 'Fica ativa até ser desativada ou excluída.' },
            { id: 'rootpwd', text: 'Senha do usuário raiz', bin: 'long', explanation: 'É a credencial de longo prazo mais poderosa da conta.' },
            { id: 'role', text: 'Credenciais de uma sessão de role', bin: 'temp', explanation: 'A sessão tem duração definida e expira.' },
            { id: 'ec2', text: 'Credenciais que uma instância EC2 recebe da role do instance profile', bin: 'temp', explanation: 'São temporárias e atualizadas automaticamente antes de expirar.' },
            { id: 'gst', text: 'Credenciais obtidas com GetSessionToken', bin: 'temp', explanation: 'O STS devolve credenciais com prazo de validade.' },
          ],
        },
        {
          id: 'iax.f01.m3.a2',
          kind: 'order',
          title: 'Rotação sem susto',
          prompt: 'A chave do sistema de rastreamento tem dois anos. Coloque os passos da rotação na ordem recomendada pela AWS.',
          concepts: [{ id: 'iam.key-rotation' }, { id: 'iam.access-keys', weight: 0.5 }],
          xp: 50,
          difficulty: 2,
          explanation: ['A ordem permite voltar atrás: enquanto a chave antiga só está desativada, uma aplicação esquecida pode ser corrigida reativando a chave.'],
          steps: [
            { id: 's1', text: 'Criar uma segunda chave de acesso, com a primeira ainda ativa', explanation: 'O limite de duas chaves por usuário existe para isso.' },
            { id: 's2', text: 'Atualizar todas as aplicações e ferramentas para usar a chave nova', explanation: 'As duas chaves funcionam ao mesmo tempo durante a troca.' },
            { id: 's3', text: 'Conferir o "último uso" da chave antiga, esperando alguns dias', explanation: 'Mostra se algo ainda usa a chave antiga.' },
            { id: 's4', text: 'Desativar a chave antiga', explanation: 'Desativar, e não excluir: ainda dá para reativar.' },
            { id: 's5', text: 'Confirmar que as aplicações funcionam só com a chave nova', explanation: 'Se algo parar, reative a antiga e corrija a aplicação.' },
            { id: 's6', text: 'Excluir a chave antiga', explanation: 'Só depois de ter certeza de que ninguém depende dela.' },
          ],
        },
        {
          id: 'iax.f01.m3.a3',
          kind: 'decision',
          title: 'Onde um usuário IAM se justifica?',
          prompt: 'Em qual destes casos a Rota Fácil pode manter um **usuário IAM com chave de acesso**?',
          concepts: [{ id: 'iam.when-iam-user' }, { id: 'iam.long-vs-temp', weight: 0.5 }],
          xp: 40,
          difficulty: 2,
          explanation: ['Usuários IAM com credenciais de longo prazo são exceções para quem não consegue usar credenciais temporárias, como ferramentas de terceiros sem suporte a roles.'],
          options: [
            { id: 'a', text: 'Uma ferramenta de roteirização contratada, que só aceita chave de acesso e não suporta roles', correct: true, consequence: 'É uma exceção aceitável: chave com permissões mínimas, rotação e monitoramento do uso.' },
            { id: 'b', text: 'A nova analista de logística, que precisa do console', correct: false, consequence: 'Pessoas devem entrar por federação (IAM Identity Center), com credenciais temporárias.' },
            { id: 'c', text: 'A API de rotas, que roda em instâncias EC2', correct: false, consequence: 'No EC2, a role do instance profile entrega credenciais temporárias sem chave nenhuma.' },
            { id: 'd', text: 'Um script na função Lambda que fecha o dia', correct: false, consequence: 'Funções Lambda usam a role de execução.' },
          ],
        },
        {
          id: 'iax.f01.m3.a4',
          kind: 'decision',
          title: 'O segredo sumiu',
          prompt: 'Um gestor perdeu o arquivo com o **segredo** da chave de acesso dele. O ID da chave aparece no console. O que fazer?',
          concepts: [{ id: 'iam.access-keys' }],
          xp: 30,
          difficulty: 1,
          explanation: ['O segredo só pode ser visto ou baixado no momento da criação. Sem ele, a chave não serve para nada: crie outra e desative e exclua a antiga.'],
          options: [
            { id: 'a', text: 'Criar uma nova chave, atualizar onde a antiga era usada e desativar e excluir a antiga', correct: true, consequence: 'O gestor volta a trabalhar, e a chave cujo segredo pode estar em mãos erradas deixa de valer.' },
            { id: 'b', text: 'Mostrar o segredo de novo no console do IAM', correct: false, consequence: 'Não existe essa opção: o segredo só aparece na criação.' },
            { id: 'c', text: 'Abrir um caso com o suporte da AWS para recuperar o segredo', correct: false, consequence: 'A AWS não recupera segredos de chaves; a solução é criar outra.' },
          ],
        },
      ],
      debrief: { takeaways: ['Prefira credenciais temporárias: roles para workloads, federação para pessoas.', 'Rotação segura: criar, trocar, conferir o uso, desativar, confirmar e só então excluir.', 'Usuário IAM com chave é exceção, com permissões mínimas e rotação.'] },
    },
    // -----------------------------------------------------------------------
    {
      id: 'iax.f01.boss',
      title: 'Chefe: Conta herdada',
      type: 'boss',
      summary: 'Audite as credenciais de uma conta comprada junto com uma startup.',
      passThreshold: 0.7,
      bonusXp: 120,
      briefing: {
        company: 'Agro Semente',
        role: 'A empresa onde você trabalha comprou a Agro Semente, uma startup de previsão de safra, e você recebeu a conta AWS dela.',
        situation: `${NOW} A sua empresa já usa o IAM Identity Center com o provedor de identidade dos funcionários. A conta herdada nunca passou por auditoria, e ontem de madrugada apareceu um usuário que ninguém criou.`,
        objective: 'Descobrir o que aconteceu e deixar cada credencial da conta no lugar certo.',
        successCriteria: ['Encontrar a causa do usuário misterioso', 'Escolher as ações certas para cada credencial', 'Priorizar a correção'],
      },
      intel: [{ conceptId: 'iam.credential-report', body: ['O **relatório de credenciais** é um CSV com todos os usuários e o root: senha e último uso, **MFA ativo**, chaves ativas, **idade** e **último uso** de cada chave. Pode ser gerado a cada 4 horas e é o ponto de partida de qualquer auditoria.'] }],
      activities: [
        {
          id: 'iax.f01.boss.a1',
          kind: 'investigate',
          title: 'O usuário que ninguém criou',
          prompt: 'Examine o relatório de credenciais, o trecho do CloudTrail e o script antigo. Marque as evidências, a causa e as correções.',
          concepts: [{ id: 'iam.credential-report' }, { id: 'iam.root-best-practices' }, { id: 'iam.access-keys', weight: 0.5 }],
          xp: 100,
          difficulty: 3,
          explanation: [
            'A chave de acesso do root ficou num script versionado. Alguém de fora usou essa chave para criar um usuário com AdministratorAccess. Um MFA no root não teria impedido: chaves de acesso assinam chamadas sem pedir MFA.',
            'A correção elimina a chave do root, protege o login do root e desfaz o que o invasor criou, depois de registrar o que ele fez.',
          ],
          scenario: ['O relatório e o CloudTrail aparecem resumidos. Datas no formato ano-mês-dia.'],
          artifacts: [
            {
              id: 'report',
              title: 'Relatório de credenciais (trecho)',
              format: 'table',
              lines: [
                { id: 'r1', text: '<root_account> · mfa_active=false · access_key_1_active=true · access_key_1_last_used_date=2026-10-18', isIssue: true, explanation: 'O root tem uma chave de acesso ativa, usada ontem, e nenhum MFA.' },
                { id: 'r2', text: 'break-glass · password_enabled=true · mfa_active=true · password_last_used=no_information', isIssue: false, explanation: 'Acesso de emergência com MFA e nunca usado: é o esperado.' },
                { id: 'r3', text: 'backup-saas · password_enabled=false · access_key_1_last_rotated=2026-04-03 · access_key_1_last_used_date=2026-10-19', isIssue: false, explanation: 'A chave passou do prazo de rotação da empresa e precisa ser rotacionada, mas não aparece nas chamadas suspeitas.' },
              ],
            },
            {
              id: 'trail',
              title: 'CloudTrail (trecho)',
              format: 'log',
              lines: [
                { id: 'c1', text: '2026-10-18T03:12Z · Root · CreateUser suporte-temp · origem 198.51.100.23 · chave AKIA…R00T', isIssue: true, explanation: 'A chave do root, vinda de um endereço desconhecido, criou um usuário de madrugada.' },
                { id: 'c2', text: '2026-10-18T03:13Z · Root · AttachUserPolicy AdministratorAccess em suporte-temp', isIssue: true, explanation: 'O invasor deu acesso de administrador ao usuário que criou.' },
                { id: 'c3', text: '2026-10-18T09:00Z · assumed-role/backup-diario · PutObject backups/2026-10-18.tar.gz', isIssue: false, explanation: 'O backup atual já roda com uma role: é atividade normal.' },
                { id: 'c4', text: '2026-10-18T10:41Z · joana.ops · ConsoleLogin · MFAUsed: No · origem 203.0.113.50 (escritório)', isIssue: false, explanation: 'Login sem MFA é um risco a corrigir, mas veio do escritório e não tem relação com o usuário criado de madrugada.' },
              ],
            },
            {
              id: 'script',
              title: 'scripts/backup-antigo.sh (repositório)',
              format: 'code',
              lines: [
                { id: 'k1', text: 'export AWS_ACCESS_KEY_ID=AKIA…R00T', isIssue: true, explanation: 'A chave do root gravada num arquivo versionado.' },
                { id: 'k2', text: 'export AWS_SECRET_ACCESS_KEY=…', isIssue: true, explanation: 'O segredo também está no arquivo: quem lê o repositório tem a chave inteira.' },
                { id: 'k3', text: 'aws s3 sync /dados s3://agro-backups', isIssue: false, explanation: 'O comando em si é inofensivo.' },
              ],
            },
          ],
          rootCause: {
            prompt: 'Qual é a causa?',
            options: [
              { id: 'r1', text: 'A chave de acesso do usuário raiz ficou num script versionado e foi usada por alguém de fora.', correct: true, feedback: 'Isso: a mesma chave aparece no script e no CloudTrail, vinda de um endereço desconhecido.' },
              { id: 'r2', text: 'A role backup-diario foi assumida por um invasor.', correct: false, feedback: 'A role só gravou o backup de sempre; o usuário foi criado com a chave do root.' },
              { id: 'r3', text: 'joana.ops entrou sem MFA e criou o usuário.', correct: false, feedback: 'O login dela veio do escritório e foi depois; o CreateUser foi feito pelo root.' },
              { id: 'r4', text: 'A ferramenta backup-saas foi invadida.', correct: false, feedback: 'A chave da ferramenta não aparece nas chamadas suspeitas.' },
            ],
          },
          remediations: {
            prompt: 'Quais correções aplicar? (selecione todas as adequadas)',
            options: [
              { id: 'f1', text: 'Desativar e excluir a chave de acesso do root.', correct: true, feedback: 'É a porta que o invasor usou, e o root não deve ter chaves.' },
              { id: 'f2', text: 'Registrar MFA no root e trocar a senha dele.', correct: true, feedback: 'Protege o login do root caso a senha também tenha vazado.' },
              { id: 'f3', text: 'Revisar no CloudTrail tudo o que suporte-temp fez e então excluir o usuário.', correct: true, feedback: 'Primeiro entender o estrago, depois remover o acesso do invasor.' },
              { id: 'f4', text: 'Criar uma nova chave para o root e guardá-la num cofre de segredos.', correct: false, feedback: 'O problema é o root ter chave, não onde ela fica.' },
              { id: 'f5', text: 'Habilitar MFA em joana.ops e considerar o incidente resolvido.', correct: false, feedback: 'É uma melhoria, mas não fecha a porta usada no ataque.' },
            ],
          },
        },
        {
          id: 'iax.f01.boss.a2',
          kind: 'lab',
          lab: 'credentials',
          title: 'Auditoria completa',
          prompt: 'Para cada credencial da conta, escolha as ações certas. Há linhas que precisam de mais de uma ação e linhas que já estão bem.',
          concepts: [{ id: 'iam.root-best-practices' }, { id: 'iam.long-vs-temp' }, { id: 'iam.when-iam-user' }, { id: 'iam.key-rotation', weight: 0.5 }, { id: 'iam.credential-report', weight: 0.5 }],
          xp: 140,
          difficulty: 3,
          hints: ['Pessoas da empresa já podem entrar pelo Identity Center.', 'Pergunte de cada linha: quem usa, e essa coisa consegue usar credenciais temporárias?'],
          explanation: [
            'Root: MFA e nenhuma chave. Pessoas: Identity Center. EC2: role pelo instance profile. Servidor no escritório: Roles Anywhere. Ferramenta de terceiros: exceção, com rotação. Sem uso: remover. Emergência com MFA e a role: ficam como estão.',
          ],
          config: CREDENTIALS_LAB,
        },
        {
          id: 'iax.f01.boss.a3',
          kind: 'decision',
          title: 'Por onde começar?',
          prompt: 'A equipe só consegue fazer **uma** coisa nos próximos dez minutos. Qual?',
          concepts: [{ id: 'iam.root-best-practices' }, { id: 'iam.access-keys', weight: 0.5 }],
          xp: 40,
          difficulty: 2,
          explanation: ['A credencial vazada e ainda ativa é a mais urgente: enquanto ela vale, o invasor pode voltar e fazer qualquer coisa, inclusive apagar o próprio rastro.'],
          options: [
            { id: 'a', text: 'Desativar a chave de acesso do root', correct: true, consequence: 'O invasor perde a porta de entrada imediatamente; o resto da limpeza pode continuar com calma.', impacts: { seguranca: 2 } },
            { id: 'b', text: 'Migrar joana.ops para o Identity Center', correct: false, consequence: 'Melhora a conta, mas a chave do root continua nas mãos de quem a usou de madrugada.' },
            { id: 'c', text: 'Trocar a chave de app-cotacoes por uma role', correct: false, consequence: 'Boa prática, mas não é o que está sendo explorado agora.' },
            { id: 'd', text: 'Gerar um novo relatório de credenciais', correct: false, consequence: 'O relatório já mostrou o problema; agora é hora de agir.' },
          ],
        },
      ],
      debrief: { takeaways: ['Uma chave de root vazada entrega a conta inteira: o root não deve ter chaves.', 'Cada credencial tem um destino: federação para pessoas, roles para workloads, exceções controladas.', 'Contenha primeiro (desative a credencial vazada), investigue depois.'] },
    },
  ],
}
