/**
 * Fase 7 — Federação e identidades externas. Identity Center, fontes de
 * identidade, Directory Service, Cognito e ABAC.
 */
import type { PhaseDef } from '../../../../../engine/types'
import type { BuilderLabConfig } from '../../../../../simulators/policy/builder'
import type { IdentityLabConfig } from '../../../../../simulators/identity/lab'
import type { Principal } from '../../../../../simulators/policy/model'
import { META } from '../meta'

const BRISA = '676767676767'
const secret = (id: string, project: string) => ({ id, arn: `arn:aws:secretsmanager:sa-east-1:${BRISA}:secret:${id}-AbCdEf`, account: BRISA, label: `segredo ${id}`, tags: { 'access-project': project } })
const dev = (id: string, name: string, project: string): Principal => ({ id, name, kind: 'role-session', account: BRISA, roleName: 'Desenvolvedores', sessionName: id, tags: { 'access-project': project }, identityPolicies: [] })

const ABAC_LAB: BuilderLabConfig = {
  kind: 'identity',
  policyName: 'SegredosDoProjeto',
  attachedTo: 'Anexada ao permission set **Desenvolvedores**, usado por todos os times. O projeto de cada pessoa chega como session tag `access-project`.',
  scenario: {
    principals: [dev('maya', 'Maya (projeto pegasus)', 'pegasus'), dev('caio', 'Caio (projeto unicorn)', 'unicorn')],
    resources: [secret('pegasus-db', 'pegasus'), secret('unicorn-db', 'unicorn'), secret('pegasus-fila', 'pegasus')],
  },
  target: { type: 'identity', principalIds: ['maya', 'caio'] },
  palette: {
    actions: ['secretsmanager:GetSecretValue', 'secretsmanager:DeleteSecret', 'secretsmanager:*'],
    resources: ['*', `arn:aws:secretsmanager:sa-east-1:${BRISA}:secret:pegasus-*`],
    conditions: [
      { id: 'abac', label: 'StringEquals aws:ResourceTag/access-project = ${aws:PrincipalTag/access-project}', clause: { op: 'StringEquals', key: 'aws:ResourceTag/access-project', values: ['${aws:PrincipalTag/access-project}'] } },
      { id: 'pegasus', label: 'StringEquals aws:ResourceTag/access-project = pegasus', clause: { op: 'StringEquals', key: 'aws:ResourceTag/access-project', values: ['pegasus'] } },
    ],
  },
  maxStatements: 2,
  tests: [
    { id: 't1', label: 'Maya lê o segredo do banco do pegasus', request: { principalId: 'maya', action: 'secretsmanager:GetSecretValue', resourceId: 'pegasus-db' }, expect: 'allow', why: 'O segredo é do projeto dela.', concepts: ['fed.abac'] },
    { id: 't2', label: 'Maya lê o segredo do unicorn', request: { principalId: 'maya', action: 'secretsmanager:GetSecretValue', resourceId: 'unicorn-db' }, expect: 'deny', why: 'Outro projeto.', concepts: ['fed.abac'] },
    { id: 't3', label: 'Caio lê o segredo do unicorn', request: { principalId: 'caio', action: 'secretsmanager:GetSecretValue', resourceId: 'unicorn-db' }, expect: 'allow', why: 'A mesma política precisa servir aos dois times.', concepts: ['fed.abac'] },
    { id: 't4', label: 'Maya lê um segredo novo do pegasus, criado hoje', request: { principalId: 'maya', action: 'secretsmanager:GetSecretValue', resourceId: 'pegasus-fila' }, expect: 'allow', why: 'Com ABAC, um recurso novo com a tag certa entra sem mudar a política.', concepts: ['fed.abac'] },
  ],
  probes: [{ id: 'p1', label: 'Maya apaga o segredo do pegasus', request: { principalId: 'maya', action: 'secretsmanager:DeleteSecret', resourceId: 'pegasus-db' }, expect: 'deny', why: 'Desenvolvedores leem segredos; apagar é tarefa da plataforma.', concepts: ['iam.least-privilege'] }],
  solution: [{ effect: 'Allow', actions: ['secretsmanager:GetSecretValue'], resources: ['*'], principals: [], conditions: ['abac'] }],
}

const IDENTITY_LAB: IdentityLabConfig = {
  itemsLabel: 'Casos da Rede Brisa',
  options: ['idc-external', 'idc-directory', 'iam-user', 'managed-ad', 'ad-connector', 'simple-ad', 'service-role', 'roles-anywhere', 'user-pool', 'identity-pool', 'user-and-identity-pool', 'cross-account-role'],
  items: [
    { id: 'func', text: 'Os 600 funcionários entram nas 14 contas AWS com o login do Microsoft Entra ID que já usam', dominant: 'existing-idp', needs: ['workforce-sso', 'existing-idp'], concepts: ['fed.identity-center', 'fed.identity-source'] },
    { id: 'app', text: 'Clientes do app de fidelidade se cadastram, entram com a conta do Google e enviam fotos de notas fiscais direto para o S3', dominant: 'app-aws-credentials', needs: ['app-signin', 'app-aws-credentials'], concepts: ['cognito.user-pool', 'cognito.identity-pool'] },
    { id: 'vitrine', text: 'Visitantes sem login veem a vitrine do app, que lê um catálogo no DynamoDB com permissões mínimas', dominant: 'guest-access', needs: ['guest-access'], concepts: ['cognito.identity-pool'] },
    { id: 'sql', text: 'O ERP migra para o RDS for SQL Server com autenticação do Windows, e os grupos continuam no AD local', dominant: 'rds-sqlserver-ad', needs: ['rds-sqlserver-ad', 'ad-trust'], concepts: ['fed.directory-service'] },
    { id: 'vpn', text: 'As estações virtuais autenticam no AD local, sem copiar usuários para a nuvem, com o MFA RADIUS que a empresa já tem', dominant: 'onprem-ad-no-sync', needs: ['onprem-ad-no-sync', 'mfa-radius'], concepts: ['fed.directory-service'] },
    { id: 'pdv', text: 'Os servidores das lojas (fora da AWS, com certificados da CA da empresa) enviam vendas para o S3', dominant: 'workload-outside', needs: ['workload-outside'], concepts: ['iam.roles-anywhere'] },
    { id: 'auditoria', text: 'A consultoria de auditoria, que tem conta AWS própria, lê configurações das contas da Brisa', dominant: 'third-party-account', needs: ['third-party-account'], concepts: ['iam.confused-deputy'] },
  ],
}

export const F07_IAM: PhaseDef = {
  ...META.f07,
  concepts: ['fed.federation', 'fed.identity-center', 'fed.permission-sets', 'fed.identity-source', 'fed.directory-service', 'cognito.user-pool', 'cognito.identity-pool', 'fed.abac', 'iam.roles-anywhere', 'iam.confused-deputy', 'iam.least-privilege', 'iam.when-iam-user'],
  availability: 'available',
  simplifications: ['O login federado aparece como fluxo; o simulador não emite asserções SAML nem tokens OIDC.', 'No laboratório de ABAC, as session tags vindas do IdP já aparecem como tags do principal.'],
  missions: [
    // -----------------------------------------------------------------------
    {
      id: 'iax.f07.m1',
      title: 'Funcionários com o Identity Center',
      type: 'mission',
      summary: 'Federação, portal de acesso, permission sets e fontes de identidade.',
      briefing: {
        company: 'Rede Brisa',
        role: 'Você é a pessoa de identidade de uma rede de farmácias com 14 contas AWS.',
        situation: 'Cada conta tem os próprios usuários IAM. Quando alguém sai da empresa, o desligamento leva dias e sempre sobra um usuário esquecido.',
        objective: 'Levar os funcionários para o login da empresa, com acesso centralizado às contas.',
        successCriteria: ['Entender o fluxo de login federado', 'Saber o que é um permission set', 'Escolher a fonte de identidade'],
      },
      intel: [
        { conceptId: 'fed.federation', visual: 'federation-flow', body: ['Com **federação**, a pessoa entra pelo **IdP** da empresa (SAML 2.0 ou OIDC) e recebe **credenciais temporárias** de uma role. Desligou no IdP, perdeu o acesso à AWS: não sobra usuário IAM esquecido.'] },
        { conceptId: 'fed.identity-center', body: ['O **IAM Identity Center** dá login único em **várias contas** pelo **portal de acesso**. A AWS recomenda a **instância de organização**, na conta de gerenciamento. Não há cobrança adicional pelo serviço.'] },
        { conceptId: 'fed.permission-sets', body: ['Um **permission set** é um modelo de permissões: atribuído a uma conta, vira uma **role** lá. Sessão da conta: 1 h por padrão, até 12 h. Sessão do portal: 8 h por padrão, até 90 dias.'] },
        { conceptId: 'fed.identity-source', body: ['A **fonte de identidade** é única por organização: o diretório do próprio Identity Center, um **Active Directory** ou um **IdP externo** (Okta, Entra ID). O Simple AD não serve.'] },
      ],
      activities: [
        {
          id: 'iax.f07.m1.a1',
          kind: 'order',
          title: 'Do login à conta',
          prompt: 'Ordene o que acontece quando uma farmacêutica acessa a conta de relatórios pelo Identity Center, com o Entra ID como fonte de identidade.',
          concepts: [{ id: 'fed.federation' }, { id: 'fed.permission-sets', weight: 0.5 }],
          xp: 50,
          difficulty: 2,
          explanation: ['A senha e o MFA ficam no IdP. A AWS recebe a asserção, mostra as contas atribuídas e entrega credenciais temporárias da role criada pelo permission set.'],
          steps: [
            { id: 's1', text: 'Ela abre o portal de acesso da AWS', explanation: 'O portal é o ponto de entrada.' },
            { id: 's2', text: 'O portal a redireciona para o login do Entra ID', explanation: 'A autenticação é do IdP.' },
            { id: 's3', text: 'Ela entra com a senha da empresa e o MFA', explanation: 'Nenhuma senha da AWS envolvida.' },
            { id: 's4', text: 'O Entra ID envia uma asserção SAML ao Identity Center', explanation: 'A asserção diz quem ela é.' },
            { id: 's5', text: 'O portal mostra as contas e os permission sets atribuídos a ela', explanation: 'Só o que foi atribuído aparece.' },
            { id: 's6', text: 'Ela escolhe a conta de relatórios e recebe credenciais temporárias da role do permission set', explanation: 'A sessão expira sozinha.' },
          ],
        },
        {
          id: 'iax.f07.m1.a2',
          kind: 'match',
          title: 'O vocabulário do Identity Center',
          prompt: 'Associe cada termo à descrição.',
          concepts: [{ id: 'fed.identity-center' }, { id: 'fed.permission-sets' }],
          xp: 50,
          difficulty: 2,
          explanation: ['Permission sets são modelos; atribuições ligam pessoas a contas; a role é o que existe de fato dentro de cada conta.'],
          leftLabel: 'Termo',
          rightLabel: 'Descrição',
          pairs: [
            { id: 'ps', left: 'Permission set', right: 'Modelo de permissões que vira role em cada conta atribuída', explanation: 'Escrito uma vez, aplicado em várias contas.', concepts: ['fed.permission-sets'] },
            { id: 'assign', left: 'Atribuição', right: 'Liga um usuário ou grupo a uma conta com um permission set', explanation: 'É ela que faz a conta aparecer no portal.', concepts: ['fed.identity-center'] },
            { id: 'portal', left: 'Portal de acesso', right: 'Página onde o funcionário escolhe a conta e a permissão', explanation: 'Login único para todas as contas.', concepts: ['fed.identity-center'] },
            { id: 'org', left: 'Instância de organização', right: 'A forma recomendada de habilitar o Identity Center, na conta de gerenciamento', explanation: 'Permite gerenciar o acesso a todas as contas da organização.', concepts: ['fed.identity-center'] },
          ],
        },
        {
          id: 'iax.f07.m1.a3',
          kind: 'classify',
          title: 'Qual fonte de identidade?',
          prompt: 'Escolha a fonte de identidade do Identity Center em cada empresa.',
          concepts: [{ id: 'fed.identity-source' }],
          xp: 50,
          difficulty: 2,
          explanation: ['A fonte de identidade fica onde as pessoas já são gerenciadas; sem nada, use o diretório do próprio Identity Center.'],
          bins: [
            { id: 'idc', label: 'Diretório do Identity Center' },
            { id: 'ad', label: 'Active Directory' },
            { id: 'idp', label: 'IdP externo' },
          ],
          items: [
            { id: 'okta', text: 'Empresa que gerencia todos os funcionários no Okta', bin: 'idp', explanation: 'Okta é um IdP externo.' },
            { id: 'entra', text: 'Empresa que usa o Microsoft Entra ID', bin: 'idp', explanation: 'Entra ID também entra como IdP externo.' },
            { id: 'ad', text: 'Empresa com AD local e grupos que quer reaproveitar', bin: 'ad', explanation: 'O Identity Center se conecta ao AD (local ou gerenciado na AWS).' },
            { id: 'startup', text: 'Startup de oito pessoas, sem nenhum diretório', bin: 'idc', explanation: 'Os usuários são criados no próprio Identity Center.' },
          ],
        },
        {
          id: 'iax.f07.m1.a4',
          kind: 'decision',
          title: 'Turno de oito horas',
          prompt: 'A equipe de operações reclama que precisa entrar de novo na conta de produção toda hora. Ela quer sessões de **8 horas** nessa conta. Onde ajustar?',
          concepts: [{ id: 'fed.permission-sets' }],
          xp: 30,
          difficulty: 2,
          explanation: ['A duração da sessão na conta é configurada no permission set: 1 h por padrão, até 12 h.'],
          options: [
            { id: 'a', text: 'Na duração da sessão do permission set de operações (até 12 h)', correct: true, consequence: 'As sessões na conta passam a durar 8 horas.' },
            { id: 'b', text: 'Criando usuários IAM para a equipe', correct: false, consequence: 'Volta às credenciais de longo prazo que a migração quis eliminar.' },
            { id: 'c', text: 'Não dá: a sessão é sempre de 1 hora', correct: false, consequence: '1 hora é só o padrão.' },
          ],
        },
      ],
      debrief: { takeaways: ['Pessoas: federação, com o IdP da empresa.', 'Permission set vira role em cada conta atribuída.', 'Uma fonte de identidade por organização.'] },
    },
    // -----------------------------------------------------------------------
    {
      id: 'iax.f07.m2',
      title: 'Diretórios',
      type: 'mission',
      summary: 'Managed Microsoft AD, AD Connector e Simple AD.',
      briefing: {
        company: 'Rede Brisa',
        role: 'Você agora cuida das cargas que dependem do Active Directory.',
        situation: 'O ERP vai para a AWS, há estações virtuais para o escritório e um laboratório pequeno com servidores Linux.',
        objective: 'Escolher o tipo de diretório de cada caso.',
        successCriteria: ['Distinguir as três opções do Directory Service', 'Saber o limite de cada uma'],
      },
      intel: [{ conceptId: 'fed.directory-service', body: ['**Managed Microsoft AD**: AD de verdade na AWS, com **trust** para o AD local. **AD Connector**: **proxy** para o AD local, sem copiar usuários; aceita MFA via RADIUS, mas não serve ao RDS for SQL Server. **Simple AD**: barato, baseado em Samba 4, **sem MFA e sem trusts**.'] }],
      activities: [
        {
          id: 'iax.f07.m2.a1',
          kind: 'classify',
          title: 'Que diretório?',
          prompt: 'Escolha a opção do Directory Service para cada caso.',
          concepts: [{ id: 'fed.directory-service' }],
          xp: 50,
          difficulty: 2,
          explanation: ['A decisão gira em torno de duas perguntas: o AD precisa existir na AWS (com trust e aplicações que dependem dele) ou só encaminhar logins para o AD local?'],
          bins: [
            { id: 'managed', label: 'AWS Managed Microsoft AD' },
            { id: 'connector', label: 'AD Connector' },
            { id: 'simple', label: 'Simple AD' },
          ],
          items: [
            { id: 'sql', text: 'RDS for SQL Server com autenticação do Windows', bin: 'managed', explanation: 'O AD Connector não é compatível com o RDS for SQL Server.' },
            { id: 'trust', text: 'Domínio na AWS com relação de confiança com o AD local', bin: 'managed', explanation: 'Trusts são do Managed Microsoft AD.' },
            { id: 'proxy', text: 'Usar o AD local para o login das estações virtuais, sem guardar usuários na nuvem', bin: 'connector', explanation: 'O AD Connector só encaminha as autenticações.' },
            { id: 'radius', text: 'Reaproveitar o MFA RADIUS existente com o AD local', bin: 'connector', explanation: 'O AD Connector aceita MFA via RADIUS.' },
            { id: 'lab', text: 'Laboratório com 20 servidores Linux que precisam de um diretório simples e barato', bin: 'simple', explanation: 'Simple AD, desde que não precisem de MFA nem de trusts.' },
          ],
        },
        {
          id: 'iax.f07.m2.a2',
          kind: 'decision',
          title: 'Diretório para clientes?',
          prompt: 'O time do app de fidelidade sugere usar o Simple AD para cadastrar os clientes do aplicativo. O que você responde?',
          concepts: [{ id: 'fed.directory-service' }, { id: 'cognito.user-pool', weight: 0.5 }],
          xp: 30,
          difficulty: 1,
          explanation: ['Directory Service é para cargas corporativas que dependem de AD. Cadastro e login de clientes de aplicativos são trabalho do Amazon Cognito.'],
          options: [
            { id: 'a', text: 'Para clientes de aplicativo, use um Cognito user pool', correct: true, consequence: 'Cadastro, login social e tokens JWT prontos para o app.' },
            { id: 'b', text: 'Pode ser, o Simple AD escala para milhões de clientes', correct: false, consequence: 'Simple AD é para diretórios pequenos de uma empresa, não para clientes de apps.' },
            { id: 'c', text: 'Melhor criar um usuário IAM por cliente', correct: false, consequence: 'Usuários IAM são para a conta AWS, não para clientes de aplicativos.' },
          ],
        },
      ],
      debrief: { takeaways: ['Managed AD: AD real na AWS, com trusts.', 'AD Connector: proxy para o AD local.', 'Simple AD: simples e barato, sem MFA nem trusts. Clientes de app: Cognito.'] },
    },
    // -----------------------------------------------------------------------
    {
      id: 'iax.f07.m3',
      title: 'Clientes do app com o Cognito',
      type: 'mission',
      summary: 'User pool, identity pool e visitantes.',
      briefing: {
        company: 'Rede Brisa',
        role: 'Você desenha o login do novo app de fidelidade.',
        situation: 'Os clientes vão se cadastrar (ou entrar com a conta do Google), acumular pontos e enviar fotos de notas fiscais direto para um bucket. Quem não tem conta pode ver a vitrine.',
        objective: 'Combinar user pool e identity pool do jeito certo.',
        successCriteria: ['Separar o papel de cada pool', 'Montar o fluxo até o S3', 'Atender visitantes'],
      },
      intel: [
        { conceptId: 'cognito.user-pool', visual: 'cognito-pools', body: ['O **user pool** é o diretório dos clientes: **cadastro, login** (inclusive com Google, SAML e OIDC) e **tokens JWT**. Ele responde "quem é o usuário", mas sozinho não dá credenciais AWS.'] },
        { conceptId: 'cognito.identity-pool', body: ['O **identity pool** troca um token por **credenciais AWS temporárias** de uma role, e atende também **visitantes** sem login (com uma role mais restrita). Os dois pools podem ser usados juntos.'] },
      ],
      activities: [
        {
          id: 'iax.f07.m3.a1',
          kind: 'classify',
          title: 'Qual pool faz isso?',
          prompt: 'Classifique cada capacidade.',
          concepts: [{ id: 'cognito.user-pool' }, { id: 'cognito.identity-pool' }],
          xp: 50,
          difficulty: 2,
          explanation: ['User pool autentica; identity pool autoriza com credenciais AWS.'],
          bins: [
            { id: 'user', label: 'User pool' },
            { id: 'identity', label: 'Identity pool' },
          ],
          items: [
            { id: 'signup', text: 'Cadastro com e-mail e senha', bin: 'user', explanation: 'É o diretório dos clientes.', concepts: ['cognito.user-pool'] },
            { id: 'social', text: 'Login com a conta do Google', bin: 'user', explanation: 'O user pool federa com provedores sociais.', concepts: ['cognito.user-pool'] },
            { id: 'jwt', text: 'Emitir tokens JWT para o backend validar', bin: 'user', explanation: 'Tokens do user pool.', concepts: ['cognito.user-pool'] },
            { id: 'creds', text: 'Entregar credenciais AWS temporárias para o app enviar arquivos ao S3', bin: 'identity', explanation: 'O identity pool troca o token por credenciais.', concepts: ['cognito.identity-pool'] },
            { id: 'guest', text: 'Dar acesso limitado a visitantes sem login', bin: 'identity', explanation: 'Identidades não autenticadas recebem uma role restrita.', concepts: ['cognito.identity-pool'] },
          ],
        },
        {
          id: 'iax.f07.m3.a2',
          kind: 'order',
          title: 'Da tela de login até o S3',
          prompt: 'Ordene o fluxo do cliente que envia a foto de uma nota fiscal.',
          concepts: [{ id: 'cognito.identity-pool' }, { id: 'cognito.user-pool', weight: 0.5 }],
          xp: 50,
          difficulty: 2,
          explanation: ['O token do user pool prova quem é o cliente; o identity pool o transforma em credenciais temporárias com as permissões de uma role.'],
          steps: [
            { id: 's1', text: 'O cliente entra no app pelo user pool (ou com a conta do Google)', explanation: 'Autenticação.' },
            { id: 's2', text: 'O user pool devolve tokens JWT ao app', explanation: 'Provam quem é o cliente.' },
            { id: 's3', text: 'O app envia o token ao identity pool', explanation: 'Pede credenciais AWS.' },
            { id: 's4', text: 'O identity pool devolve credenciais temporárias da role de clientes autenticados', explanation: 'Com permissões mínimas.' },
            { id: 's5', text: 'O app envia a foto direto ao S3 com essas credenciais', explanation: 'Sem passar por um servidor próprio.' },
          ],
        },
        {
          id: 'iax.f07.m3.a3',
          kind: 'decision',
          title: 'A vitrine sem login',
          prompt: 'Visitantes sem conta devem ver a vitrine, que lê o catálogo direto de uma tabela DynamoDB. Como dar esse acesso?',
          concepts: [{ id: 'cognito.identity-pool' }],
          xp: 30,
          difficulty: 2,
          explanation: ['O identity pool aceita identidades não autenticadas, com uma role própria e mais restrita.'],
          options: [
            { id: 'a', text: 'Identidades não autenticadas no identity pool, com uma role que só lê o catálogo', correct: true, consequence: 'Visitantes veem a vitrine e nada mais.' },
            { id: 'b', text: 'Uma chave de acesso de um usuário IAM embutida no app', correct: false, consequence: 'Qualquer um extrai a chave do app e a usa fora dele.' },
            { id: 'c', text: 'Criar uma conta no user pool para cada visitante', correct: false, consequence: 'Visitantes, por definição, não se cadastraram.' },
          ],
        },
      ],
      debrief: { takeaways: ['User pool: quem é. Identity pool: credenciais AWS.', 'Os dois juntos levam o app até os recursos AWS.', 'Visitantes: identidades não autenticadas com role restrita.'] },
    },
    // -----------------------------------------------------------------------
    {
      id: 'iax.f07.m4',
      title: 'RBAC e ABAC',
      type: 'mission',
      summary: 'Uma política por função ou uma política por atributo.',
      briefing: {
        company: 'Rede Brisa',
        role: 'Você cuida das permissões dos times de desenvolvimento.',
        situation: 'Cada um dos 30 projetos tem uma política listando os próprios segredos. Todo segredo novo exige editar uma política, e alguém sempre esquece.',
        objective: 'Trocar 30 políticas por uma, baseada em tags.',
        successCriteria: ['Montar a política ABAC', 'Saber quando ABAC compensa'],
      },
      intel: [{ conceptId: 'fed.abac', body: ['**RBAC**: uma política por função, listando recursos. **ABAC**: a política compara **tags** do principal com tags do recurso, como `aws:ResourceTag/projeto` igual a `${aws:PrincipalTag/projeto}`. Menos políticas, e recurso novo com a tag certa entra sozinho. Com federação, as tags podem vir do IdP como session tags.'] }],
      activities: [
        {
          id: 'iax.f07.m4.a1',
          kind: 'lab',
          lab: 'policy-builder',
          title: 'Uma política para todos os projetos',
          prompt: 'Monte a política **SegredosDoProjeto**: cada pessoa lê só os segredos do próprio projeto, inclusive os que forem criados amanhã.',
          concepts: [{ id: 'fed.abac' }, { id: 'iam.least-privilege', weight: 0.5 }],
          xp: 140,
          difficulty: 3,
          hints: ['Fixar "pegasus" na condição serve só para um time.', 'A variável ${aws:PrincipalTag/access-project} vira o projeto de quem faz a requisição.'],
          explanation: ['Solução: Allow `secretsmanager:GetSecretValue` em `*` com `StringEquals aws:ResourceTag/access-project = ${aws:PrincipalTag/access-project}`. Esse é o padrão do tutorial de ABAC da AWS.'],
          config: ABAC_LAB,
        },
        {
          id: 'iax.f07.m4.a2',
          kind: 'classify',
          title: 'RBAC ou ABAC?',
          prompt: 'Classifique cada característica.',
          concepts: [{ id: 'fed.abac' }],
          xp: 40,
          difficulty: 2,
          explanation: ['ABAC troca listas de recursos por comparação de atributos; RBAC lista o que cada função pode acessar.'],
          bins: [
            { id: 'rbac', label: 'RBAC' },
            { id: 'abac', label: 'ABAC' },
          ],
          items: [
            { id: 'list', text: 'Cada política lista os ARNs dos recursos da função', bin: 'rbac', explanation: 'Típico do RBAC.' },
            { id: 'edit', text: 'Todo recurso novo exige editar alguma política', bin: 'rbac', explanation: 'Os ARNs novos precisam entrar na lista.' },
            { id: 'tags', text: 'Compara aws:PrincipalTag com aws:ResourceTag', bin: 'abac', explanation: 'É a essência do ABAC.' },
            { id: 'few', text: 'Poucas políticas servem a muitos times', bin: 'abac', explanation: 'A mesma política vale para todos; o atributo muda.' },
          ],
        },
      ],
      debrief: { takeaways: ['ABAC: tags do principal comparadas com tags do recurso.', 'Recursos novos entram sem editar políticas, se tiverem a tag certa.'] },
    },
    // -----------------------------------------------------------------------
    {
      id: 'iax.f07.boss',
      title: 'Chefe: Escolhendo o provedor de identidade',
      type: 'boss',
      summary: 'Cada tipo de quem acessa recebe a solução de identidade certa.',
      passThreshold: 0.7,
      bonusXp: 120,
      briefing: {
        company: 'Rede Brisa',
        role: 'Você apresenta à diretoria o desenho de identidade da empresa.',
        situation: 'Funcionários, clientes, visitantes, servidores das lojas, o ERP, as estações virtuais e uma consultoria externa: cada um precisa de acesso, e a diretoria quer saber a solução de cada caso.',
        objective: 'Escolher a solução de identidade de cada caso.',
        successCriteria: ['Uma solução por caso', 'Nenhum usuário IAM onde há alternativa', 'A opção mais simples que atende'],
      },
      intel: [],
      activities: [
        {
          id: 'iax.f07.boss.a1',
          kind: 'lab',
          lab: 'identity',
          title: 'O mapa de identidade da Brisa',
          prompt: 'Posicione cada caso na solução de identidade adequada. Use o guia das opções.',
          concepts: [{ id: 'fed.identity-center' }, { id: 'cognito.identity-pool' }, { id: 'fed.directory-service' }, { id: 'iam.roles-anywhere', weight: 0.5 }, { id: 'iam.confused-deputy', weight: 0.5 }],
          xp: 160,
          difficulty: 3,
          hints: ['Separe primeiro por tipo de quem acessa: funcionário, cliente, visitante, servidor, diretório ou parceiro.', 'Quando duas opções atendem, a mais simples vale mais.'],
          explanation: ['Funcionários: Identity Center com o Entra ID. App com login e upload: user pool + identity pool. Vitrine: identity pool. RDS SQL Server com AD: Managed Microsoft AD. Estações com AD local e RADIUS: AD Connector. Lojas: Roles Anywhere. Consultoria: role entre contas com External ID.'],
          config: IDENTITY_LAB,
        },
        {
          id: 'iax.f07.boss.a2',
          kind: 'decision',
          title: 'E o acesso de emergência?',
          prompt: 'A diretoria pergunta: se o Entra ID ficar fora do ar, como a equipe de plataforma entra na AWS para resolver um incidente?',
          concepts: [{ id: 'fed.federation' }, { id: 'iam.when-iam-user', weight: 0.5 }],
          xp: 40,
          difficulty: 3,
          explanation: ['O acesso de emergência é uma das exceções em que a AWS aceita usuários IAM: poucos, com MFA, guardados e monitorados, para quando o provedor de identidade estiver indisponível.'],
          options: [
            { id: 'a', text: 'Poucos usuários IAM de emergência, com MFA, credenciais guardadas e alerta a cada uso', correct: true, consequence: 'A equipe entra mesmo sem o IdP, e qualquer uso fora de hora vira alerta.' },
            { id: 'b', text: 'Usar o usuário raiz de cada conta', correct: false, consequence: 'O root tem acesso total e deve ficar para as tarefas que o exigem.' },
            { id: 'c', text: 'Não há o que fazer: sem o IdP, ninguém entra', correct: false, consequence: 'É justamente o caso de acesso de emergência previsto pelas boas práticas.' },
          ],
        },
      ],
      debrief: { takeaways: ['Funcionários: federação. Clientes: Cognito. Workloads: roles (ou Roles Anywhere). Parceiros: role entre contas.', 'Directory Service para cargas que dependem de AD.', 'Planeje o acesso de emergência para quando o IdP cair.'] },
    },
  ],
}
