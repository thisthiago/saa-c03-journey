/**
 * Conceitos da Fase 5 — Roles e STS.
 * Fatos conferidos em 19/10/2026 (ver docs/VERIFICACAO-DE-CONTEUDO.md).
 * Reaproveita iam.roles (Fase 1) e sts.get-session-token (Fase 2).
 */
import type { ConceptDef } from '../../../../engine/types'
import { R } from './refs'

export const F05_IAM_CONCEPTS: ConceptDef[] = [
  {
    id: 'sts.temporary-credentials',
    title: 'Credenciais temporárias do STS',
    officialName: 'AWS STS temporary security credentials',
    serviceIds: ['aws.sts'],
    summary: 'O **AWS STS** emite credenciais que expiram: **ID da chave, segredo e token de sessão**, com data de expiração. Quem as usa assina as chamadas como uma **sessão**.',
    explanation: [
      'O STS está por trás das credenciais temporárias da AWS: quando uma instância EC2 usa uma role, quando alguém entra pelo IAM Identity Center ou quando uma aplicação troca um token de login por acesso, é o STS que emite as credenciais. O token de sessão acompanha cada chamada, e a AWS rejeita a credencial depois da expiração.',
    ],
    comparisons: [
      { with: 'iam.long-vs-temp', text: 'As credenciais do STS são o tipo temporário: expiram sozinhas e não precisam ser rotacionadas, ao contrário das chaves de acesso de um usuário IAM.' },
    ],
    facts: ['As credenciais de uma sessão de role não podem chamar GetFederationToken nem GetSessionToken.'],
    exam: {
      domains: ['d1'],
      relevance: 'alta',
      notes: 'O STS raramente aparece sozinho como resposta; ele está por trás das roles, da federação e do acesso entre contas. Quando o enunciado fala em "credenciais temporárias", procure a role ou o mecanismo de federação que as usa.',
    },
    references: [R.tempCreds, R.assumeRole],
    tags: ['seguranca'],
    reviewItems: [
      {
        id: 'rv:sts.temporary-credentials:partes',
        kind: 'decision',
        title: 'O que o STS entrega',
        prompt: 'Além do ID da chave e do segredo, o que vem nas credenciais temporárias do STS e precisa acompanhar cada chamada?',
        concepts: [{ id: 'sts.temporary-credentials' }],
        xp: 5,
        difficulty: 1,
        explanation: ['Credenciais temporárias têm **três partes**: ID da chave, segredo e **token de sessão**, com data de expiração.'],
        options: [
          { id: 'a', text: 'O token de sessão', correct: true, consequence: 'Sem o token, a assinatura com a chave temporária não é aceita.' },
          { id: 'b', text: 'A senha do usuário que pediu as credenciais', correct: false, consequence: 'A senha nunca acompanha chamadas de API.' },
          { id: 'c', text: 'O código MFA de seis dígitos', correct: false, consequence: 'O MFA, quando exigido, vai na chamada que cria a sessão, não em cada requisição.' },
        ],
      },
    ],
  },
  {
    id: 'iam.trust-policy',
    title: 'Trust policy × política de permissões',
    officialName: 'Role trust policy and permissions policy',
    serviceIds: ['aws.iam', 'aws.sts'],
    summary: 'A **trust policy** é a política de recurso da role: diz **quem pode assumi-la** (Principal + `sts:AssumeRole`). A **política de permissões** diz **o que a sessão pode fazer** depois de assumida.',
    explanation: [
      'A trust policy responde a quem pode entrar; a política de permissões, ao que se pode fazer depois. As duas são independentes: uma role com permissões amplas e uma trust policy restrita só é usada por quem a trust policy aceita.',
      'Exemplo: uma role para funções Lambda tem a trust policy com o Principal `lambda.amazonaws.com` e a política de permissões com `dynamodb:PutItem` numa tabela. Uma instância EC2 não consegue usar essa role, porque o serviço EC2 não está na trust policy.',
      '**Regra prática:** se a role não é assumida, olhe a trust policy; se é assumida, mas a ação falha, olhe a política de permissões.',
    ],
    commonMistakes: ['Colocar permissões de S3 na trust policy, ou o Principal na política de permissões'],
    facts: ['Na trust policy não se usa curinga para casar parte de um ARN de principal.', 'Na mesma conta, se a trust policy cita o usuário, ele não precisa de política de identidade; se cita a conta, precisa.'],
    exam: {
      domains: ['d1'],
      relevance: 'alta',
      notes: 'Se a questão diz que um serviço ou uma conta "não consegue assumir a role", a resposta está na trust policy. Se a role é assumida, mas a ação falha, está na política de permissões. Para terceiros que assumem uma role na sua conta, a trust policy deve exigir o ExternalId.',
    },
    references: [R.roles, R.assumeRole],
    tags: ['seguranca'],
  },
  {
    id: 'sts.assume-role',
    title: 'AssumeRole',
    officialName: 'AWS STS AssumeRole',
    serviceIds: ['aws.sts'],
    summary: '`AssumeRole` devolve credenciais temporárias de uma role. A duração vai de **900 s (15 min)** até o **máximo da role** (configurável de **1 a 12 h**); o padrão é **1 h**. Pedir mais que o máximo faz a chamada falhar.',
    facts: [
      'A sessão fica com o ARN arn:aws:sts::conta:assumed-role/role/nome-da-sessão.',
      'MFA vai nos parâmetros SerialNumber e TokenCode; ExternalId tem de 2 a 1.224 caracteres.',
      'Aceita até 50 session tags e session policies (até 10 gerenciadas, com 2.048 caracteres no total).',
    ],
    exam: {
      domains: ['d1'],
      relevance: 'alta',
      notes: 'Sinais: "acesso entre contas", "aplicação assume uma role" e "limitar a duração da sessão". A duração padrão é de 1 hora e pode ir até o máximo configurado na role, de 1 a 12 horas.',
    },
    references: [R.assumeRole],
    tags: ['seguranca'],
  },
  {
    id: 'sts.role-chaining',
    title: 'Encadeamento de roles',
    officialName: 'Role chaining',
    serviceIds: ['aws.sts'],
    summary: 'Usar as credenciais de uma role para assumir **outra** role é **encadear**. A sessão encadeada fica limitada a **1 hora**, seja qual for o máximo configurado nas roles; pedir mais faz a chamada falhar.',
    facts: ['O limite vale no console, na CLI e na API.', 'Session tags marcadas como transitivas passam adiante no encadeamento.'],
    exam: {
      domains: ['d1'],
      relevance: 'media',
      notes: 'Se o enunciado descreve uma role que assume outra e uma sessão que não passa de 1 hora, a causa é o limite do encadeamento de roles, e não a duração máxima configurada.',
    },
    references: [R.assumeRole, R.switchRole],
    tags: ['seguranca'],
  },
  {
    id: 'iam.switch-role',
    title: 'Trocar de role no console',
    officialName: 'Switch to an IAM role (console)',
    serviceIds: ['aws.iam'],
    summary: 'No console, o usuário escolhe **Switch role**, informa a conta e o nome da role e passa a trabalhar **só** com as permissões da role. **Switch back** devolve as permissões dele.',
    facts: [
      'O usuário raiz não pode trocar de role.',
      'Não dá para trocar, pelo console, para uma role que exige ExternalId: só pela API AssumeRole.',
      'A sessão da role no console dura 1 hora por padrão e nunca passa do tempo que resta na sessão do usuário.',
    ],
    exam: { domains: ['d1'], relevance: 'media' },
    references: [R.switchRole],
    tags: ['seguranca'],
  },
  {
    id: 'sts.api-family',
    title: 'A família de APIs do STS',
    officialName: 'Compare AWS STS credentials',
    serviceIds: ['aws.sts'],
    summary: '`AssumeRole` (role, inclusive entre contas), `AssumeRoleWithSAML` (asserção SAML de um IdP), `AssumeRoleWithWebIdentity` (token OIDC, como Cognito ou Google), `GetSessionToken` (usuário com MFA) e `GetFederationToken` (usuário federado com session policy obrigatória).',
    facts: [
      'AssumeRoleWithSAML e AssumeRoleWithWebIdentity não exigem credenciais AWS: quem tem a asserção ou o token pode chamar.',
      'GetFederationToken exige session policy e não aceita MFA.',
      'GetSessionToken aceita MFA e não aceita session policy.',
    ],
    recommendations: ['A AWS recomenda roles no lugar de GetFederationToken.'],
    exam: {
      domains: ['d1'],
      relevance: 'media',
      notes: 'Ligue a origem da identidade à API: provedor SAML corporativo (AssumeRoleWithSAML), login de aplicativo com OIDC (AssumeRoleWithWebIdentity, em geral por meio do Cognito), usuário IAM com MFA (GetSessionToken) e acesso a uma role (AssumeRole).',
    },
    references: [R.stsCompare],
    tags: ['seguranca'],
  },
  {
    id: 'sts.session-policy',
    title: 'Session policy',
    officialName: 'Session policies',
    serviceIds: ['aws.sts', 'aws.iam'],
    summary: 'Política passada ao criar a sessão para **restringir** aquela sessão. A sessão fica com a **interseção** entre as permissões da role e a session policy: ela **nunca concede** mais do que a role.',
    explanation: [
      'Exemplo: um serviço de upload assume a mesma role para cada cliente e passa uma session policy que só permite `s3:PutObject` em `clientes/<id-do-cliente>/*`. Mesmo que a role tenha acesso ao bucket inteiro, cada sessão só alcança a pasta do próprio cliente.',
      '**Regra prática:** a session policy só reduz; ela nunca dá mais do que a role tem.',
    ],
    useCases: ['Uma aplicação que assume a mesma role para clientes diferentes e restringe cada sessão à pasta do cliente'],
    exam: {
      domains: ['d1'],
      relevance: 'media',
      notes: 'Sinal: "restringir as permissões de uma sessão específica sem criar uma role para cada caso". A resposta é uma session policy passada ao assumir a role.',
    },
    references: [R.policies, R.assumeRole],
    tags: ['seguranca'],
  },
  {
    id: 'sts.session-tags',
    title: 'Session tags',
    officialName: 'Session tags',
    serviceIds: ['aws.sts'],
    summary: 'Tags passadas ao assumir a role (até 50). Elas viram `aws:PrincipalTag/…` nas requisições da sessão e sobrescrevem uma tag da role com a mesma chave. São a base do controle por atributos (ABAC) com federação.',
    exam: { domains: ['d1'], relevance: 'baixa' },
    references: [R.sessionTags, R.assumeRole],
    tags: ['seguranca'],
  },
]
