/**
 * Conceitos da Fase 7 — Federação e identidades externas.
 * Fatos conferidos em 19/10/2026 (ver docs/VERIFICACAO-DE-CONTEUDO.md).
 */
import type { ConceptDef } from '../../../../engine/types'
import { R } from './refs'

export const F07_IAM_CONCEPTS: ConceptDef[] = [
  {
    id: 'fed.federation',
    title: 'Federação de identidades',
    officialName: 'Identity federation',
    serviceIds: ['aws.iam', 'aws.sts'],
    summary: 'As pessoas entram pelo **provedor de identidade (IdP)** que a empresa já usa, com **SAML 2.0** ou **OIDC**, e recebem **credenciais temporárias** de uma role. Não é preciso criar um usuário IAM para cada pessoa.',
    explanation: [
      'Na federação, a AWS confia num provedor de identidade que já autentica as pessoas, como o diretório da empresa. A pessoa faz login no provedor, que emite uma asserção SAML ou um token OIDC; a AWS confere essa prova e entrega credenciais temporárias de uma role. Senhas e desligamentos continuam num só lugar: o provedor.',
      'Exemplo: uma empresa usa o Microsoft Entra ID para o e-mail e os sistemas internos. Federando o Entra ID com a AWS, os funcionários entram no console com o mesmo login, e quem é desligado perde o acesso à AWS ao ser desativado no diretório.',
      '**Regra prática:** pessoas entram pelo provedor de identidade que a empresa já usa, e não por usuários IAM.',
    ],
    comparisons: [
      { with: 'fed.identity-center', text: 'O IAM Identity Center é a forma recomendada de federar funcionários com várias contas de uma organização.' },
    ],
    recommendations: ['A AWS recomenda federação, com credenciais temporárias, para o acesso de pessoas.'],
    exam: {
      domains: ['d1'],
      relevance: 'alta',
      notes: 'Sinais: "usar as credenciais corporativas existentes", "login único" e "sem criar usuários IAM". A resposta é federação, em geral pelo IAM Identity Center; para clientes de um aplicativo, é o Cognito.',
    },
    references: [R.federation, R.saml, R.oidc, R.bestPractices],
    tags: ['seguranca'],
  },
  {
    id: 'fed.identity-center',
    title: 'IAM Identity Center',
    officialName: 'AWS IAM Identity Center',
    serviceIds: ['aws.iam-identity-center', 'aws.organizations'],
    summary: 'Login único dos funcionários em **várias contas** da organização e em aplicações, por um **portal de acesso**. Você atribui usuários ou grupos a contas com **permission sets**.',
    explanation: [
      'O Identity Center centraliza o acesso de funcionários a todas as contas da organização: você conecta a fonte de identidade, define permission sets e atribui grupos a contas. Cada pessoa vê no portal só as contas e os perfis que recebeu.',
      'Exemplo: o grupo Desenvolvedores recebe o permission set de desenvolvedor nas contas de teste e um de leitura na conta de produção. Um funcionário novo, colocado no grupo, já entra nas contas certas, com as permissões certas.',
    ],
    facts: [
      'A AWS recomenda a instância de organização, habilitada na conta de gerenciamento.',
      'O IAM Identity Center não tem cobrança adicional.',
      'Funcionários entram com MFA e recebem credenciais temporárias.',
    ],
    exam: {
      domains: ['d1'],
      relevance: 'alta',
      notes: 'Sinais: "várias contas da organização", "acesso centralizado para funcionários" e "login único". A resposta é o IAM Identity Center. Criar usuários IAM em cada conta é distrator.',
    },
    references: [R.idcWhat, R.idcFaq],
    tags: ['seguranca'],
  },
  {
    id: 'fed.permission-sets',
    title: 'Permission sets',
    officialName: 'Permission sets',
    serviceIds: ['aws.iam-identity-center'],
    summary: 'Um **permission set** é um modelo de permissões. Ao atribuí-lo a uma conta, o Identity Center cria uma **role** com essas permissões naquela conta, e o funcionário a assume pelo portal.',
    facts: ['A sessão de um permission set dura 1 hora por padrão e pode ir até 12 horas.', 'A sessão do portal de acesso dura 8 horas por padrão e pode ir até 90 dias.'],
    exam: { domains: ['d1'], relevance: 'media' },
    references: [R.idcPermissionSets],
    tags: ['seguranca'],
  },
  {
    id: 'fed.identity-source',
    title: 'Fonte de identidade do Identity Center',
    officialName: 'Identity source',
    serviceIds: ['aws.iam-identity-center', 'aws.directory-service'],
    summary: 'Onde ficam os usuários e grupos: o **diretório do próprio Identity Center** (padrão), um **Active Directory** (local ou AWS Managed Microsoft AD) ou um **IdP externo** (como Okta ou Microsoft Entra ID). É **uma por organização**.',
    facts: ['O Simple AD não pode ser fonte de identidade do Identity Center.'],
    exam: {
      domains: ['d1'],
      relevance: 'media',
      notes: 'Se a empresa já tem um Active Directory ou um IdP como Okta ou Entra ID, conecte-o como fonte de identidade do Identity Center, em vez de recriar os usuários.',
    },
    references: [R.idcSource],
    tags: ['seguranca'],
  },
  {
    id: 'fed.directory-service',
    title: 'AWS Directory Service',
    officialName: 'AWS Directory Service',
    serviceIds: ['aws.directory-service'],
    summary: '**AWS Managed Microsoft AD**: um AD de verdade gerenciado pela AWS, com trust para o AD local. **AD Connector**: proxy para o AD local, sem guardar usuários na nuvem. **Simple AD**: diretório barato baseado em Samba 4.',
    facts: [
      'O AD Connector aceita MFA com um servidor RADIUS e não é compatível com o RDS for SQL Server.',
      'O Simple AD não tem MFA nem trusts.',
      'Para cadastro de clientes de aplicações (SaaS), a indicação é o Amazon Cognito.',
    ],
    exam: {
      domains: ['d1'],
      relevance: 'media',
      notes: 'Escolha pelo requisito: aplicações que precisam de um AD de verdade na AWS, ou de trust com o AD local, pedem o AWS Managed Microsoft AD; usar o AD local sem guardar usuários na nuvem pede o AD Connector; um diretório simples e barato, sem MFA nem trusts, pede o Simple AD.',
    },
    references: [R.directory],
    tags: ['seguranca', 'hibrido'],
  },
  {
    id: 'cognito.user-pool',
    title: 'Cognito user pool',
    officialName: 'Amazon Cognito user pools',
    serviceIds: ['aws.cognito'],
    summary: 'Diretório de **clientes** de um aplicativo: cadastro, login (inclusive social, SAML e OIDC) e emissão de **tokens JWT**. Responde "quem é o usuário".',
    explanation: [
      'O user pool cuida da identidade dos clientes de um aplicativo: cadastro, confirmação, login com senha ou com contas sociais e MFA. Depois do login, o aplicativo recebe tokens JWT que provam quem é o usuário, e um backend, como o API Gateway, pode validar esses tokens.',
      'Exemplo: um aplicativo de delivery permite login com e-mail ou com a conta do Google. O user pool cuida dos dois fluxos e entrega ao aplicativo um token que a API usa para identificar o cliente.',
    ],
    comparisons: [
      { with: 'cognito.identity-pool', text: 'O user pool diz quem é o usuário. O identity pool troca essa identidade por credenciais AWS para acessar serviços diretamente.' },
    ],
    exam: {
      domains: ['d1'],
      relevance: 'alta',
      notes: 'Sinais: "cadastro e login de clientes de um aplicativo web ou móvel", "login social" e "milhões de usuários". A resposta é o Cognito user pool. Para funcionários da empresa, a resposta é o IAM Identity Center.',
    },
    references: [R.cognito],
    tags: ['seguranca'],
  },
  {
    id: 'cognito.identity-pool',
    title: 'Cognito identity pool',
    officialName: 'Amazon Cognito identity pools',
    serviceIds: ['aws.cognito', 'aws.sts'],
    summary: 'Troca um token (do user pool, de um login social ou SAML) por **credenciais AWS temporárias**, inclusive para **visitantes** sem login. Escolhe a role por regras (RBAC) ou por atributos (ABAC).',
    explanation: [
      'O identity pool entra quando o aplicativo precisa acessar serviços da AWS diretamente do dispositivo, como gravar uma foto no S3. Ele troca o token do usuário (ou nenhum token, no caso de visitantes) por credenciais temporárias de uma role, limitadas ao que aquele usuário pode fazer.',
    ],
    facts: ['User pool e identity pool podem ser usados juntos ou separados.'],
    exam: {
      domains: ['d1'],
      relevance: 'alta',
      notes: 'Sinal: "o aplicativo móvel precisa enviar arquivos direto para o S3 sem passar pelo backend". A resposta é o Cognito identity pool, que entrega credenciais temporárias com permissões restritas.',
    },
    references: [R.cognito],
    tags: ['seguranca'],
  },
  {
    id: 'fed.abac',
    title: 'ABAC × RBAC',
    officialName: 'Attribute-based access control',
    serviceIds: ['aws.iam'],
    summary: 'No **RBAC**, cada função ganha uma política com os recursos listados. No **ABAC**, a política compara **tags** do principal com tags do recurso (`aws:PrincipalTag` e `aws:ResourceTag`): menos políticas, e recursos novos com a tag certa entram sozinhos.',
    explanation: [
      'Exemplo: uma única política permite `ec2:StopInstances` quando `aws:ResourceTag/projeto` é igual a `aws:PrincipalTag/projeto`. Quem é do projeto Atlas só para instâncias marcadas com Atlas; quando o projeto Boreal começa, ninguém edita políticas: basta marcar pessoas e instâncias.',
      '**Regra prática:** muitos times e recursos que mudam o tempo todo pedem ABAC; poucas funções estáveis funcionam bem com RBAC.',
    ],
    useCases: ['Times que criam recursos o tempo todo', 'Usuários federados cujos atributos vêm do IdP como session tags'],
    exam: {
      domains: ['d1'],
      relevance: 'media',
      notes: 'Sinais: "muitos projetos ou times", "recursos criados o tempo todo" e "reduzir o número de políticas". A resposta é ABAC com tags, em geral com atributos vindos do IdP como session tags.',
    },
    references: [R.abac],
    tags: ['seguranca'],
  },
]
