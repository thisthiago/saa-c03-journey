/**
 * Conceitos da Fase 3 — Segurança, acesso e privacidade.
 * Fatos conferidos em 16/10/2026 (ver docs/VERIFICACAO-DE-CONTEUDO.md).
 */
import type { ConceptDef } from '../../../../engine/types'

const EVAL_LOGIC = { title: 'Policy evaluation logic', url: 'https://docs.aws.amazon.com/IAM/latest/UserGuide/reference_policies_evaluation-logic.html' }
const CROSS = { title: 'Cross-account policy evaluation logic', url: 'https://docs.aws.amazon.com/IAM/latest/UserGuide/reference_policies_evaluation-logic-cross-account.html' }
const IAM_INTRO = { title: 'What is IAM?', url: 'https://docs.aws.amazon.com/IAM/latest/UserGuide/introduction.html' }
const IAM_ID = { title: 'IAM identities', url: 'https://docs.aws.amazon.com/IAM/latest/UserGuide/id.html' }
const IAM_BP = { title: 'Security best practices in IAM', url: 'https://docs.aws.amazon.com/IAM/latest/UserGuide/best-practices.html' }
const POLICIES = { title: 'Policies and permissions in Amazon S3', url: 'https://docs.aws.amazon.com/AmazonS3/latest/userguide/access-policy-language-overview.html' }
const BUCKET_POLICIES = { title: 'Bucket policies for Amazon S3', url: 'https://docs.aws.amazon.com/AmazonS3/latest/userguide/bucket-policies.html' }
const BPA = { title: 'Blocking public access to your Amazon S3 storage', url: 'https://docs.aws.amazon.com/AmazonS3/latest/userguide/access-control-block-public-access.html' }
const OWNERSHIP = { title: 'Controlling ownership of objects and disabling ACLs', url: 'https://docs.aws.amazon.com/AmazonS3/latest/userguide/about-object-ownership.html' }
const PRESIGNED = { title: 'Sharing objects with presigned URLs', url: 'https://docs.aws.amazon.com/AmazonS3/latest/userguide/ShareObjectPreSignedURL.html' }
const ANALYZER = { title: 'Reviewing bucket access using IAM Access Analyzer for S3', url: 'https://docs.aws.amazon.com/AmazonS3/latest/userguide/access-analyzer.html' }
const MACIE = { title: 'What is Amazon Macie?', url: 'https://docs.aws.amazon.com/macie/latest/user/what-is-macie.html' }

export const F03_CONCEPTS: ConceptDef[] = [
  {
    id: 'iam.authn-authz',
    title: 'Autenticação × autorização',
    officialName: 'Authentication / authorization',
    serviceIds: ['aws.iam'],
    summary: '**Autenticação** prova quem faz a requisição (credenciais assinando a chamada). **Autorização** decide se essa identidade pode executar aquela ação naquele recurso.',
    explanation: ['No S3, requisições sem assinatura são feitas pelo "usuário anônimo". Elas só funcionam se algo conceder acesso público — o que, por padrão, não acontece.'],
    facts: ['Recursos do S3 são privados por padrão.', 'Requisições não autenticadas são tratadas como do usuário anônimo.'],
    exam: { domains: ['d1'], relevance: 'alta' },
    references: [IAM_INTRO, POLICIES],
    tags: ['seguranca'],
  },
  {
    id: 'iam.identities',
    title: 'Identidades do IAM',
    officialName: 'IAM users, groups and roles',
    serviceIds: ['aws.iam'],
    summary: '**Usuários** têm credenciais de longo prazo; **roles** são assumidas e fornecem credenciais **temporárias** — o padrão recomendado para aplicações e serviços.',
    recommendations: ['Use roles para aplicações (EC2, Lambda, contêineres) em vez de chaves de acesso fixas.', 'Evite usar o usuário raiz da conta no dia a dia.'],
    commonMistakes: ['Embutir chaves de acesso de um usuário IAM no código da aplicação'],
    exam: { domains: ['d1'], relevance: 'alta' },
    references: [IAM_ID, IAM_BP],
    tags: ['seguranca'],
  },
  {
    id: 'iam.identity-policy',
    title: 'Políticas baseadas em identidade',
    officialName: 'Identity-based policies',
    serviceIds: ['aws.iam'],
    summary: 'Políticas anexadas a usuários, grupos ou roles. Dizem **o que aquela identidade pode fazer**, com Effect, Action, Resource e Condition — sem o elemento Principal.',
    facts: ['Uma política de identidade não tem o elemento Principal: o principal é a própria identidade.'],
    exam: { domains: ['d1'], relevance: 'alta' },
    references: [POLICIES, EVAL_LOGIC],
    tags: ['seguranca'],
  },
  {
    id: 'iam.policy-evaluation',
    title: 'Deny explícito e deny implícito',
    officialName: 'Explicit deny / implicit deny',
    serviceIds: ['aws.iam'],
    summary: 'Tudo começa **negado** (deny implícito). Um **Allow** aplicável permite — mas um **Deny explícito** em qualquer política aplicável **sempre vence**.',
    facts: ['Se nenhuma política permite, o acesso é negado implicitamente.', 'Um Deny explícito prevalece sobre qualquer Allow.'],
    commonMistakes: ['Achar que um Allow em uma política anula um Deny em outra'],
    recommendations: ['Use Deny explícito para garantias que não podem ser contornadas, como exigir HTTPS.'],
    exam: { domains: ['d1'], relevance: 'alta' },
    references: [EVAL_LOGIC],
    tags: ['seguranca'],
  },
  {
    id: 'iam.least-privilege',
    title: 'Princípio do menor privilégio',
    officialName: 'Least privilege',
    serviceIds: ['aws.iam'],
    summary: 'Conceder **apenas** as ações e os recursos necessários para a tarefa — nada de `s3:*` em `*` "para garantir".',
    consequences: ['Permissões amplas transformam um erro ou uma credencial vazada num incidente maior: quem só deveria gravar consegue também apagar.'],
    recommendations: ['Restrinja ações e prefixos por função; revise permissões não usadas com o IAM Access Analyzer.'],
    exam: { domains: ['d1'], relevance: 'alta' },
    references: [IAM_BP],
    tags: ['seguranca'],
    reviewItems: [
      {
        id: 'rv:iam.least-privilege:gravacao',
        kind: 'decision',
        title: 'Só gravar relatórios',
        prompt: 'Uma função Lambda só precisa **gravar** arquivos no prefixo `relatorios/` de um bucket. Qual política conceder?',
        concepts: [{ id: 'iam.least-privilege' }],
        xp: 5,
        difficulty: 1,
        explanation: ['Menor privilégio: só a ação usada (`s3:PutObject`) e só o recurso necessário (`arn:aws:s3:::bucket/relatorios/*`).'],
        options: [
          { id: 'a', text: 'Allow s3:PutObject em arn:aws:s3:::bucket/relatorios/*', correct: true, consequence: 'Se a função for comprometida, o estrago fica limitado a gravar em relatorios/.' },
          { id: 'b', text: 'Allow s3:* em arn:aws:s3:::bucket/*', correct: false, consequence: 'A função também poderia ler e apagar qualquer objeto do bucket.' },
          { id: 'c', text: 'Allow s3:* em *', correct: false, consequence: 'Acesso total a todos os buckets da conta — muito além da tarefa.' },
        ],
      },
    ],
  },
  {
    id: 's3.bucket-policy',
    title: 'Bucket policy',
    officialName: 'Bucket policy (resource-based policy)',
    serviceIds: ['aws.s3', 'aws.iam'],
    summary: 'Política **de recurso** anexada ao bucket. Tem o elemento **Principal**: diz **quem** (usuários, roles, outras contas, serviços ou "*") pode fazer o quê no bucket e nos objetos.',
    facts: ['Bucket policies podem conceder acesso a outras contas e, se tiverem Principal "*", ao público.', 'Ações de bucket (ListBucket) usam o ARN do bucket; ações de objeto usam ARN/ * ou um prefixo.'],
    commonMistakes: ['Usar `arn:aws:s3:::bucket` em ações de objeto (o certo é `arn:aws:s3:::bucket/*`)', 'Conceder Principal "*" para "facilitar"'],
    exam: { domains: ['d1'], relevance: 'alta' },
    references: [BUCKET_POLICIES, POLICIES],
    tags: ['seguranca'],
  },
  {
    id: 'iam.cross-account',
    title: 'Acesso entre contas',
    officialName: 'Cross-account access',
    serviceIds: ['aws.iam', 'aws.s3'],
    summary: 'Na **mesma conta**, basta a política de identidade **ou** a de recurso permitir. **Entre contas**, as **duas** precisam permitir: a conta dona do bucket concede e a conta de origem delega à identidade.',
    facts: ['Para acesso entre contas, o recurso precisa permitir a outra conta e a política IAM na conta de origem precisa permitir a ação.'],
    commonMistakes: ['Conceder acesso na bucket policy e esquecer a política IAM na conta parceira (ou o contrário)'],
    exam: { domains: ['d1'], relevance: 'alta' },
    references: [CROSS, EVAL_LOGIC],
    tags: ['seguranca'],
  },
  {
    id: 's3.acl',
    title: 'ACLs e Object Ownership',
    officialName: 'Access control lists (ACLs) / S3 Object Ownership',
    serviceIds: ['aws.s3'],
    summary: 'ACLs são o mecanismo **legado** de permissão por objeto. Buckets novos usam **Object Ownership = Bucket owner enforced**: as ACLs ficam **desativadas** e o acesso é controlado só por políticas.',
    facts: [
      'Com Bucket owner enforced, ACLs não afetam permissões e o dono do bucket é dono de todos os objetos.',
      'Uma ACL é pública se concede permissões aos grupos AllUsers ou AuthenticatedUsers.',
    ],
    recommendations: ['A AWS recomenda manter as ACLs desativadas, exceto quando é preciso controlar o acesso de cada objeto individualmente.'],
    exam: { domains: ['d1'], relevance: 'media' },
    references: [OWNERSHIP],
    tags: ['seguranca'],
  },
  {
    id: 's3.block-public-access',
    title: 'S3 Block Public Access',
    officialName: 'S3 Block Public Access',
    serviceIds: ['aws.s3'],
    summary: 'Quatro ajustes que **barram acesso público** por cima de políticas e ACLs: `BlockPublicAcls` e `BlockPublicPolicy` rejeitam **novas** concessões públicas; `IgnorePublicAcls` e `RestrictPublicBuckets` neutralizam as **existentes** na avaliação.',
    explanation: [
      'Podem ser aplicados na organização, na conta, no bucket e em access points; vale a combinação **mais restritiva**.',
      'Com `RestrictPublicBuckets` ativo e uma política pública, só a própria conta e serviços AWS acessam — até concessões não públicas para outras contas deixam de valer.',
    ],
    facts: ['Buckets, access points e objetos novos não permitem acesso público por padrão.', 'Os ajustes não alteram políticas e ACLs existentes: desligá-los reativa o acesso público que elas concedem.'],
    recommendations: ['A AWS recomenda ativar os quatro ajustes na conta, salvo casos como sites estáticos públicos.'],
    commonMistakes: ['Ativar só BlockPublicPolicy e achar que a política pública que já existia deixou de valer'],
    exam: { domains: ['d1'], relevance: 'alta' },
    references: [BPA],
    tags: ['seguranca'],
  },
  {
    id: 's3.public-policy',
    title: 'O que torna uma política "pública"',
    officialName: 'The meaning of "public"',
    serviceIds: ['aws.s3'],
    summary: 'Uma bucket policy é pública se concede acesso a **Principal "*"** sem limitar por valores fixos — como contas, organizações (`aws:PrincipalOrgID`), VPCs ou faixas de IP estreitas (`aws:SourceIp`).',
    facts: ['Condições com faixas de IP muito amplas (maiores que /8 em IPv4) continuam tornando a política pública.'],
    exam: { domains: ['d1'], relevance: 'media' },
    references: [BPA],
    tags: ['seguranca'],
  },
  {
    id: 's3.presigned-url',
    title: 'URLs pré-assinadas',
    officialName: 'Presigned URLs',
    serviceIds: ['aws.s3'],
    summary: 'Concedem acesso **temporário** a um objeto usando as credenciais de quem gerou a URL — sem tornar o objeto público e sem criar usuários para terceiros.',
    facts: ['Pelo console, a validade máxima é de 12 horas; pela AWS CLI ou SDKs, até 7 dias.', 'Quem tiver a URL consegue usá-la até expirar.'],
    useCases: ['Entregar um arquivo a um cliente sem conta AWS', 'Permitir upload direto do navegador para o bucket'],
    commonMistakes: ['Tornar o objeto público para "mandar um link"'],
    exam: { domains: ['d1'], relevance: 'alta' },
    references: [PRESIGNED],
    tags: ['seguranca'],
  },
  {
    id: 'iam.access-analyzer',
    title: 'IAM Access Analyzer for S3',
    officialName: 'IAM Access Analyzer for S3',
    serviceIds: ['aws.iam', 'aws.s3'],
    summary: 'Alerta sobre buckets acessíveis **pela internet** ou por **outras contas**, mostrando a origem do acesso e permitindo bloquear o acesso público.',
    exam: { domains: ['d1'], relevance: 'media' },
    references: [ANALYZER],
    tags: ['seguranca'],
  },
  {
    id: 'macie.sensitive-data',
    title: 'Amazon Macie',
    officialName: 'Amazon Macie',
    serviceIds: ['aws.macie'],
    summary: 'Descobre **dados sensíveis** (como dados pessoais e financeiros) em buckets S3 e avalia a segurança e o controle de acesso desses buckets.',
    comparisons: [{ with: 'iam.access-analyzer', text: 'O Access Analyzer responde "quem consegue acessar"; o Macie responde "o que de sensível existe aqui".' }],
    exam: { domains: ['d1'], relevance: 'media' },
    references: [MACIE],
    tags: ['seguranca'],
  },
]
