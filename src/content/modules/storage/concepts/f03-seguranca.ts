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
    explanation: [
      'No S3, requisições sem assinatura são feitas pelo "usuário anônimo". Elas só funcionam se algo conceder acesso público — o que, por padrão, não acontece.',
      'Pense no embarque num aeroporto: o documento prova quem você é (autenticação), e o cartão de embarque diz em que voo você pode entrar (autorização). Ter um documento válido não dá acesso a qualquer avião.',
      '**Regra prática:** credencial inválida ou expirada é problema de autenticação; uma identidade válida que recebe Access Denied tem problema de autorização, a ser procurado nas políticas.',
    ],
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
    comparisons: [
      { with: 'iam.roles', text: 'A trilha de IAM aprofunda as roles: a trust policy, as credenciais temporárias e o uso por serviços e por outras contas.' },
    ],
    commonMistakes: ['Embutir chaves de acesso de um usuário IAM no código da aplicação'],
    recommendations: ['Use roles para aplicações (EC2, Lambda, contêineres) em vez de chaves de acesso fixas.', 'Evite usar o usuário raiz da conta no dia a dia.'],
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
    explanation: [
      'A política de identidade acompanha a identidade: vale para tudo o que aquele usuário ou role tenta fazer, em qualquer recurso que a política alcance. Por isso ela não tem o elemento Principal: o principal já está definido pelo lugar onde a política está anexada.',
      'Exemplo: a role de uma aplicação recebe uma política que permite `s3:GetObject` em `arn:aws:s3:::relatorios/*`. A aplicação lê os relatórios, e só eles.',
    ],
    comparisons: [
      { with: 's3.bucket-policy', text: 'A bucket policy fica no recurso e diz quem pode acessá-lo, com o elemento Principal. A política de identidade fica na identidade e diz o que ela pode acessar.' },
    ],
    facts: ['Uma política de identidade não tem o elemento Principal: o principal é a própria identidade.'],
    exam: {
      domains: ['d1'],
      relevance: 'alta',
      notes: 'Quando a questão pede dar a uma aplicação ou equipe acesso a recursos da mesma conta, a política de identidade anexada à role costuma ser a resposta. A bucket policy entra quando o controle precisa ficar no recurso: acesso de outras contas, exigência de HTTPS ou restrição por VPC endpoint.',
    },
    references: [POLICIES, EVAL_LOGIC],
    tags: ['seguranca'],
  },
  {
    id: 'iam.policy-evaluation',
    title: 'Deny explícito e deny implícito',
    officialName: 'Explicit deny / implicit deny',
    serviceIds: ['aws.iam'],
    summary: 'Tudo começa **negado** (deny implícito). Um **Allow** aplicável permite — mas um **Deny explícito** em qualquer política aplicável **sempre vence**.',
    explanation: [
      'Exemplo: uma bucket policy nega qualquer requisição feita sem HTTPS (condição `aws:SecureTransport` falsa). Um administrador com `s3:*` também tem a requisição por HTTP negada, porque o Deny explícito vence.',
      '**Regra prática:** sem Allow, o acesso é negado; com um Deny explícito aplicável, é negado sempre.',
    ],
    comparisons: [
      { with: 'iam.eval-flow', text: 'O fluxo completo, visto na trilha de IAM, acrescenta as camadas que só limitam (RCPs, SCPs, permissions boundary e session policy) e a ordem em que a AWS verifica cada uma.' },
    ],
    commonMistakes: ['Achar que um Allow em uma política anula um Deny em outra'],
    facts: ['Se nenhuma política permite, o acesso é negado implicitamente.', 'Um Deny explícito prevalece sobre qualquer Allow.'],
    recommendations: ['Use Deny explícito para garantias que não podem ser contornadas, como exigir HTTPS.'],
    exam: {
      domains: ['d1'],
      relevance: 'alta',
      notes: 'Se a questão pede uma garantia que nenhuma permissão possa contornar, a resposta envolve um Deny explícito. Se pergunta por que um usuário sem nenhuma política não acessa o bucket, a resposta é o deny implícito.',
    },
    references: [EVAL_LOGIC],
    tags: ['seguranca'],
  },
  {
    id: 'iam.least-privilege',
    title: 'Princípio do menor privilégio',
    officialName: 'Least privilege',
    serviceIds: ['aws.iam'],
    summary: 'Conceder **apenas** as ações e os recursos necessários para a tarefa — nada de `s3:*` em `*` "para garantir".',
    explanation: [
      'Menor privilégio é começar do zero e acrescentar só o que a tarefa exige: as ações, os recursos e, quando possível, as condições. O objetivo é limitar o estrago de um erro ou de uma credencial vazada.',
      'Exemplo: um serviço que só grava relatórios em `relatorios/` recebe `s3:PutObject` em `arn:aws:s3:::empresa-dados/relatorios/*`. Se a credencial vazar, quem a tiver consegue gravar nesse prefixo, mas não ler nem apagar o resto do bucket.',
      '**Regra prática:** ação específica, recurso específico e, se possível, uma condição; curinga só com justificativa.',
    ],
    consequences: ['Permissões amplas transformam um erro ou uma credencial vazada num incidente maior: quem só deveria gravar consegue também apagar.'],
    recommendations: ['Restrinja ações e prefixos por função; revise permissões não usadas com o IAM Access Analyzer.'],
    exam: {
      domains: ['d1'],
      relevance: 'alta',
      notes: 'O guia da SAA-C03 cita o princípio do menor privilégio na tarefa 1.1. Entre alternativas que funcionam, a mais restrita costuma ser a certa: ações específicas em vez de curingas, recursos identificados pelo ARN e roles em vez de chaves de longo prazo.',
    },
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
    explanation: [
      'A bucket policy fica no bucket e vale para qualquer principal que tente acessá-lo. Por isso ela é a ferramenta para regras que precisam valer para todos, como exigir HTTPS, aceitar só requisições de um VPC endpoint ou dar acesso a outra conta.',
      'Exemplo: uma conta de auditoria precisa ler os logs guardados num bucket da conta de produção. A bucket policy concede `s3:GetObject` à role da conta de auditoria, e a política IAM dessa role permite a mesma ação no bucket.',
      '**Regra prática:** regra que vale para todos que tocam o bucket vai na bucket policy; permissão de uma identidade específica vai na política dela.',
    ],
    commonMistakes: ['Usar `arn:aws:s3:::bucket` em ações de objeto (o certo é `arn:aws:s3:::bucket/*`)', 'Conceder Principal "*" para "facilitar"'],
    facts: ['Bucket policies podem conceder acesso a outras contas e, se tiverem Principal "*", ao público.', 'Ações de bucket (ListBucket) usam o ARN do bucket; ações de objeto usam ARN/ * ou um prefixo.'],
    exam: {
      domains: ['d1'],
      relevance: 'alta',
      notes: 'A bucket policy aparece em questões de acesso entre contas, de restrição de origem (VPC endpoint, faixas de IP, organização) e de exigência de criptografia em trânsito. Cuidado com o ARN: ações sobre objetos exigem o ARN do bucket seguido de /*.',
    },
    references: [BUCKET_POLICIES, POLICIES],
    tags: ['seguranca'],
  },
  {
    id: 'iam.cross-account',
    title: 'Acesso entre contas',
    officialName: 'Cross-account access',
    serviceIds: ['aws.iam', 'aws.s3'],
    summary: 'Na **mesma conta**, basta a política de identidade **ou** a de recurso permitir. **Entre contas**, as **duas** precisam permitir: a conta dona do bucket concede e a conta de origem delega à identidade.',
    explanation: [
      'Entre contas, cada lado controla o próprio pedaço: a conta dona do recurso decide se aceita a outra conta, e a conta de origem decide quais das suas identidades podem usar esse acesso. Só quando os dois lados permitem o acesso acontece.',
      'Exemplo: a conta A libera na bucket policy a leitura para a conta B. Mesmo assim, um desenvolvedor da conta B só lê o bucket se a política IAM dele, na conta B, também permitir `s3:GetObject` naquele bucket.',
      '**Regra prática:** entre contas, procure dois Allow: um no recurso e outro na identidade.',
    ],
    comparisons: [
      { with: 'iam.roles', text: 'A alternativa é assumir uma role na conta dona do recurso: quem assume abre mão das próprias permissões e passa a agir como a role. Com a política de recurso, o principal mantém as próprias permissões.' },
    ],
    commonMistakes: ['Conceder acesso na bucket policy e esquecer a política IAM na conta parceira (ou o contrário)'],
    facts: ['Para acesso entre contas, o recurso precisa permitir a outra conta e a política IAM na conta de origem precisa permitir a ação.'],
    exam: {
      domains: ['d1'],
      relevance: 'alta',
      notes: 'Em acesso entre contas, as alternativas costumam se dividir entre política de recurso (a bucket policy liberando a outra conta) e role entre contas (a outra conta assume uma role). As duas funcionam: a política de recurso é mais simples quando basta um bucket; a role serve melhor quando a outra conta precisa acessar vários recursos, inclusive de serviços sem política de recurso.',
    },
    references: [CROSS, EVAL_LOGIC],
    tags: ['seguranca'],
  },
  {
    id: 's3.acl',
    title: 'ACLs e Object Ownership',
    officialName: 'Access control lists (ACLs) / S3 Object Ownership',
    serviceIds: ['aws.s3'],
    summary: 'ACLs são o mecanismo **legado** de permissão por objeto. Buckets novos usam a configuração **Bucket owner enforced** do Object Ownership: as ACLs ficam **desativadas** e o acesso é controlado só por políticas.',
    facts: [
      'Com Bucket owner enforced, ACLs não afetam permissões e o dono do bucket é dono de todos os objetos.',
      'Uma ACL é pública se concede permissões aos grupos AllUsers ou AuthenticatedUsers.',
    ],
    recommendations: ['A AWS recomenda manter as ACLs desativadas, exceto quando é preciso controlar o acesso de cada objeto individualmente.'],
    exam: {
      domains: ['d1'],
      relevance: 'media',
      notes: 'Se uma alternativa propõe ACLs para controlar o acesso num bucket novo, desconfie: a recomendação é manter as ACLs desativadas e controlar o acesso por políticas.',
    },
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
      'Exemplo: a equipe ativa o Block Public Access na conta. Depois, um desenvolvedor tenta salvar uma bucket policy com Principal "*", e a alteração é rejeitada. Para um site estático que precisa ser público, a saída é servi-lo pelo CloudFront com [[cdn.oac|origin access control]], mantendo o bucket privado.',
      '**Regra prática:** ative os quatro ajustes na conta e trate as exceções públicas com o CloudFront, em vez de abrir o bucket.',
    ],
    commonMistakes: ['Ativar só BlockPublicPolicy e achar que a política pública que já existia deixou de valer'],
    facts: ['Buckets, access points e objetos novos não permitem acesso público por padrão.', 'Os ajustes não alteram políticas e ACLs existentes: desligá-los reativa o acesso público que elas concedem.'],
    recommendations: ['A AWS recomenda ativar os quatro ajustes na conta, salvo casos como sites estáticos públicos.'],
    exam: {
      domains: ['d1'],
      relevance: 'alta',
      notes: 'Sinais: "garantir que nenhum bucket da conta fique público" ou "impedir que alguém torne um bucket público por engano". A resposta é o Block Public Access na conta ou na organização. Para conteúdo que precisa ser público, a combinação esperada é CloudFront com origin access control e o bucket privado.',
    },
    references: [BPA],
    tags: ['seguranca'],
  },
  {
    id: 's3.public-policy',
    title: 'O que torna uma política "pública"',
    officialName: 'The meaning of "public"',
    serviceIds: ['aws.s3'],
    summary: 'Uma bucket policy é pública se concede acesso ao Principal `"*"` sem limitar por valores fixos — como contas, organizações (`aws:PrincipalOrgID`), VPCs ou faixas de IP estreitas (`aws:SourceIp`).',
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
    explanation: [
      'A URL carrega uma assinatura feita com as credenciais de quem a gerou e um prazo de validade. O S3 trata a requisição como se viesse dessa identidade: se ela não tiver permissão, a URL não funciona; se a credencial for temporária, a URL para de funcionar quando a credencial expirar.',
      'Exemplo: um portal deixa o cliente baixar a própria nota fiscal. A aplicação, que tem permissão no bucket, gera uma URL pré-assinada válida por 15 minutos e a entrega ao navegador; o bucket continua privado.',
      '**Regra prática:** para dar acesso temporário a um objeto específico, gere uma URL pré-assinada em vez de abrir o bucket.',
    ],
    useCases: ['Entregar um arquivo a um cliente sem conta AWS', 'Permitir upload direto do navegador para o bucket'],
    commonMistakes: ['Tornar o objeto público para "mandar um link"'],
    facts: ['Pelo console, a validade máxima é de 12 horas; pela AWS CLI ou SDKs, até 7 dias.', 'Quem tiver a URL consegue usá-la até expirar.'],
    exam: {
      domains: ['d1'],
      relevance: 'alta',
      notes: 'Sinais: "acesso temporário a um arquivo", "usuários sem conta AWS" e "upload direto do navegador para o S3". Alternativas que tornam o objeto público ou criam usuários IAM para os clientes são distratores.',
    },
    references: [PRESIGNED],
    tags: ['seguranca'],
  },
  {
    id: 'iam.access-analyzer',
    title: 'IAM Access Analyzer for S3',
    officialName: 'IAM Access Analyzer for S3',
    serviceIds: ['aws.iam', 'aws.s3'],
    summary: 'Alerta sobre buckets acessíveis **pela internet** ou por **outras contas**, mostrando a origem do acesso e permitindo bloquear o acesso público.',
    explanation: [
      'O Access Analyzer lê as políticas e as ACLs dos buckets e aponta os que concedem acesso a quem está fora da sua zona de confiança, como o público ou outras contas. Ele mostra a origem do acesso para você decidir se ele é intencional.',
    ],
    comparisons: [
      { with: 'macie.sensitive-data', text: 'O Macie olha o conteúdo dos objetos em busca de dados sensíveis. O Access Analyzer olha as permissões dos buckets em busca de acesso externo.' },
    ],
    exam: {
      domains: ['d1'],
      relevance: 'media',
      notes: 'Sinal: "identificar quais buckets estão acessíveis por outras contas ou publicamente". Se o pedido é encontrar dados pessoais dentro dos buckets, a resposta é o Macie.',
    },
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
    exam: {
      domains: ['d1'],
      relevance: 'media',
      notes: 'Sinais: "descobrir dados pessoais (PII) em buckets S3" ou "classificar dados sensíveis armazenados". Se o pedido é saber quem consegue acessar os buckets, a resposta é o IAM Access Analyzer.',
    },
    references: [MACIE],
    tags: ['seguranca'],
  },
]
