/**
 * Conceitos da Fase 4 — Criptografia e proteção dos dados.
 * Fatos conferidos em 16/10/2026 (ver docs/VERIFICACAO-DE-CONTEUDO.md).
 */
import type { ConceptDef } from '../../../../engine/types'

const SSE = { title: 'Protecting data with server-side encryption', url: 'https://docs.aws.amazon.com/AmazonS3/latest/userguide/serv-side-encryption.html' }
const SSE_S3 = { title: 'Using server-side encryption with Amazon S3 managed keys (SSE-S3)', url: 'https://docs.aws.amazon.com/AmazonS3/latest/userguide/UsingServerSideEncryption.html' }
const SSE_KMS = { title: 'Using server-side encryption with AWS KMS keys (SSE-KMS)', url: 'https://docs.aws.amazon.com/AmazonS3/latest/userguide/UsingKMSEncryption.html' }
const DSSE = { title: 'Using dual-layer server-side encryption with AWS KMS keys (DSSE-KMS)', url: 'https://docs.aws.amazon.com/AmazonS3/latest/userguide/UsingDSSEncryption.html' }
const SSE_C = { title: 'Using server-side encryption with customer-provided keys (SSE-C)', url: 'https://docs.aws.amazon.com/AmazonS3/latest/userguide/ServerSideEncryptionCustomerKeys.html' }
const SSE_C_FAQ = { title: 'Default SSE-C setting for new buckets FAQ', url: 'https://docs.aws.amazon.com/AmazonS3/latest/userguide/default-s3-c-encryption-setting-faq.html' }
const CSE = { title: 'Protecting data by using client-side encryption', url: 'https://docs.aws.amazon.com/AmazonS3/latest/userguide/UsingClientSideEncryption.html' }
const DEFAULT_ENC = { title: 'Setting default server-side encryption behavior for Amazon S3 buckets', url: 'https://docs.aws.amazon.com/AmazonS3/latest/userguide/bucket-encryption.html' }
const BUCKET_KEY = { title: 'Reducing the cost of SSE-KMS with Amazon S3 Bucket Keys', url: 'https://docs.aws.amazon.com/AmazonS3/latest/userguide/bucket-key.html' }
const KEY_POLICY = { title: 'Key policies in AWS KMS', url: 'https://docs.aws.amazon.com/kms/latest/developerguide/key-policies.html' }
const KMS_KEYS = { title: 'AWS KMS keys', url: 'https://docs.aws.amazon.com/kms/latest/developerguide/concepts.html' }
const TLS = { title: 'Security best practices for Amazon S3', url: 'https://docs.aws.amazon.com/AmazonS3/latest/userguide/security-best-practices.html' }

export const F04_CONCEPTS: ConceptDef[] = [
  {
    id: 'crypto.at-rest-in-transit',
    title: 'Em repouso × em trânsito',
    officialName: 'Encryption at rest / encryption in transit',
    serviceIds: ['aws.s3', 'aws.kms'],
    summary: 'Criptografia **em repouso** protege os dados gravados em disco. Criptografia **em trânsito** (TLS/HTTPS) protege os dados enquanto viajam pela rede. Uma não substitui a outra.',
    explanation: [
      'No S3, a criptografia em repouso é feita no servidor (SSE) ou pelo cliente antes do envio. Em trânsito, o que importa é a requisição usar HTTPS — e uma bucket policy pode exigir isso.',
      'Exemplo: um bucket com SSE-KMS guarda os dados cifrados, mas uma aplicação antiga ainda envia os arquivos por HTTP. Os dados ficam protegidos no disco e expostos na rede. A correção é [[s3.tls-enforcement|exigir HTTPS]] na bucket policy.',
      '**Regra prática:** a criptografia em repouso protege contra quem acessa o armazenamento; em trânsito, contra quem escuta a rede. Requisitos de conformidade costumam pedir as duas.',
    ],
    commonMistakes: ['Achar que, por o bucket ter SSE-S3, o tráfego HTTP também fica protegido'],
    exam: {
      domains: ['d1'],
      relevance: 'alta',
      notes: 'O guia da SAA-C03 cita a criptografia de dados em repouso e em trânsito na tarefa 1.3. Leia qual das duas o enunciado pede: "dados armazenados" pede SSE ou KMS; "dados trafegando" ou "conexões" pedem TLS, com HTTPS obrigatório na bucket policy ou certificados no load balancer.',
    },
    references: [SSE, TLS],
    tags: ['seguranca'],
  },
  {
    id: 's3.tls-enforcement',
    title: 'Exigir HTTPS com aws:SecureTransport',
    officialName: 'aws:SecureTransport condition key',
    serviceIds: ['aws.s3', 'aws.iam'],
    summary: 'Uma declaração **Deny** na bucket policy com a condição `aws:SecureTransport = false` recusa qualquer requisição feita sem TLS, de qualquer principal.',
    commonMistakes: ['Usar um Allow com `aws:SecureTransport = true`, que não bloqueia requisições HTTP de quem já tem permissão por IAM'],
    facts: ['`aws:SecureTransport` é `false` quando a requisição não usa TLS.'],
    recommendations: ['Use Deny (e não Allow condicionado) para exigir HTTPS: um Allow com a condição não impede quem já tem permissão por outra política.'],
    exam: {
      domains: ['d1'],
      relevance: 'alta',
      notes: 'Sinal: "exigir que todo acesso ao bucket use HTTPS". A resposta é uma declaração Deny na bucket policy com a condição aws:SecureTransport falsa.',
    },
    references: [TLS],
    tags: ['seguranca'],
  },
  {
    id: 's3.sse-s3',
    title: 'SSE-S3',
    officialName: 'Server-side encryption with Amazon S3 managed keys (SSE-S3)',
    serviceIds: ['aws.s3'],
    summary: 'O S3 gerencia as chaves e criptografa cada objeto com AES-256. É a **criptografia padrão** de todos os buckets, sem custo adicional.',
    limitations: ['Não há key policy própria nem registro de uso da chave no CloudTrail por objeto: quem tem permissão no S3 lê o dado.'],
    comparisons: [
      { with: 's3.sse-kms', text: 'O SSE-KMS acrescenta uma segunda autorização (a da chave), auditoria de cada uso no CloudTrail e controle sobre a chave, com custo de requisições ao KMS.' },
    ],
    facts: [
      'Desde 5 de janeiro de 2023, todo objeto novo enviado ao S3 é criptografado automaticamente, sem custo adicional.',
      'Cada objeto é criptografado com uma chave única, protegida por uma chave raiz rotacionada regularmente.',
    ],
    exam: {
      domains: ['d1'],
      relevance: 'alta',
      notes: 'Se o enunciado só pede "criptografia em repouso" com o menor esforço, o SSE-S3 atende e já é o padrão. Quando aparecem "controlar quem pode descriptografar", "auditar o uso da chave" ou "compartilhar dados criptografados com outra conta", a resposta passa a ser o SSE-KMS.',
    },
    references: [SSE, SSE_S3],
    tags: ['seguranca'],
  },
  {
    id: 's3.sse-kms',
    title: 'SSE-KMS',
    officialName: 'Server-side encryption with AWS KMS keys (SSE-KMS)',
    serviceIds: ['aws.s3', 'aws.kms'],
    summary: 'O S3 criptografa com chaves do **AWS KMS**. Você controla quem usa a chave (key policy + IAM) e o uso aparece no **CloudTrail**. Para ler, é preciso permissão no S3 **e** `kms:Decrypt` na chave.',
    explanation: [
      'Com o SSE-KMS, ler um objeto passa a depender de duas autorizações: a do S3 e a da chave. Isso cria uma segunda barreira, útil quando é preciso separar quem administra o bucket de quem pode ver os dados, e cada uso da chave fica registrado no CloudTrail.',
      'Exemplo: a equipe de infraestrutura administra o bucket da folha de pagamento, mas só a role do RH tem `kms:Decrypt` na chave. Mesmo com `s3:*` no bucket, o administrador não consegue ler os arquivos.',
      '**Regra prática:** se o requisito fala em controlar ou auditar quem descriptografa, use SSE-KMS com uma chave gerenciada pelo cliente.',
    ],
    comparisons: [
      { with: 's3.bucket-keys', text: 'Com muitas leituras e gravações, as requisições ao KMS pesam no custo. A S3 Bucket Key reduz essas requisições em até 99%.' },
    ],
    consequences: ['Sem `kms:Decrypt`, o GET falha com AccessDenied mesmo com permissão total no S3.'],
    facts: [
      'Gravar um objeto SSE-KMS exige `kms:GenerateDataKey`; ler exige `kms:Decrypt`.',
      'A chave gerenciada pela AWS (`aws/s3`) tem key policy que não pode ser alterada e não permite uso por outras contas.',
    ],
    recommendations: ['Use uma chave gerenciada pelo cliente quando precisar controlar quem descriptografa, compartilhar entre contas ou auditar o uso.'],
    exam: {
      domains: ['d1'],
      relevance: 'alta',
      notes: 'Sinais: "auditar o uso da chave", "controlar quem pode descriptografar", "separação de funções" ou "compartilhar dados criptografados com outra conta", o que exige uma chave gerenciada pelo cliente. Se o problema é o custo das chamadas ao KMS, a resposta é a S3 Bucket Key.',
    },
    references: [SSE_KMS, KMS_KEYS],
    tags: ['seguranca'],
  },
  {
    id: 'kms.key-policy',
    title: 'Key policy do KMS',
    officialName: 'AWS KMS key policy',
    serviceIds: ['aws.kms'],
    summary: 'Toda chave KMS tem uma **key policy**. Ela pode conceder uso diretamente ou **delegar à conta**, deixando as políticas IAM decidirem. Entre contas, a key policy **e** a política IAM de origem precisam permitir.',
    explanation: [
      'A key policy é a política de recurso da chave, e o KMS exige que ela permita: sem isso, nenhuma política IAM dá acesso. A key policy padrão concede acesso à conta, e assim as políticas IAM passam a decidir quem usa a chave dentro dela.',
      'Exemplo: a conta B precisa ler objetos SSE-KMS de um bucket da conta A. A key policy da chave, na conta A, precisa permitir `kms:Decrypt` à conta B (ou a uma role dela), e a política IAM na conta B precisa permitir o mesmo. Se faltar um dos lados, a leitura falha.',
      '**Regra prática:** em problemas de acesso com KMS, confira primeiro a key policy.',
    ],
    comparisons: [
      { with: 'iam.cross-account', text: 'É a mesma lógica do acesso entre contas, com uma diferença: mesmo dentro da conta, a key policy precisa permitir, diretamente ou delegando à conta.' },
    ],
    commonMistakes: ['Conceder `kms:Decrypt` só na política IAM de outra conta, esquecendo a key policy'],
    facts: [
      'Sem permissão na key policy (direta ou por delegação à conta), nenhuma política IAM consegue dar acesso à chave.',
      'A key policy padrão concede acesso à conta, o que habilita as políticas IAM a controlarem o uso da chave.',
    ],
    exam: {
      domains: ['d1'],
      relevance: 'alta',
      notes: 'Questões com objetos criptografados pelo KMS que "retornam Access Denied apesar da permissão no S3" costumam se resolver na chave: falta kms:Decrypt na key policy ou na política IAM. Entre contas, a chave gerenciada pela AWS (aws/s3) não serve; é preciso uma chave gerenciada pelo cliente.',
    },
    references: [KEY_POLICY],
    tags: ['seguranca'],
  },
  {
    id: 's3.dsse-kms',
    title: 'DSSE-KMS',
    officialName: 'Dual-layer server-side encryption with AWS KMS keys (DSSE-KMS)',
    serviceIds: ['aws.s3', 'aws.kms'],
    summary: 'Duas camadas independentes de AES-256 no servidor: uma com chave de dados do KMS e outra com chave gerenciada pelo S3. Atende exigências de **criptografia multicamada**.',
    useCases: ['Normas que exigem duas camadas de criptografia em repouso'],
    facts: ['S3 Bucket Keys não são compatíveis com DSSE-KMS.'],
    exam: {
      domains: ['d1'],
      relevance: 'media',
      notes: 'Sinal: "exigência de duas camadas de criptografia em repouso". Sem essa exigência explícita, o SSE-KMS ou o SSE-S3 atendem.',
    },
    references: [DSSE, BUCKET_KEY],
    tags: ['seguranca'],
  },
  {
    id: 's3.sse-c',
    title: 'SSE-C',
    officialName: 'Server-side encryption with customer-provided keys (SSE-C)',
    serviceIds: ['aws.s3'],
    summary: 'Você envia a chave **em cada requisição**; o S3 criptografa e descriptografa, mas **não guarda a chave**. Perdeu a chave, perdeu o objeto.',
    limitations: ['A aplicação precisa gerenciar e enviar a chave em cada leitura e gravação.'],
    comparisons: [
      { with: 's3.client-side-encryption', text: 'Com SSE-C, o S3 recebe os dados em texto claro e os criptografa com a sua chave. Com a criptografia no cliente, os dados já chegam cifrados.' },
    ],
    facts: [
      'Desde abril de 2026, buckets de uso geral novos têm SSE-C desabilitado para novas gravações; é preciso habilitá-lo deliberadamente com PutBucketEncryption.',
      'Requisições SSE-C precisam usar HTTPS.',
    ],
    exam: {
      domains: ['d1'],
      relevance: 'media',
      notes: 'Sinal: "a empresa precisa manter as chaves fora da AWS e enviá-las a cada requisição". Se o requisito é só controlar a chave, sem guardá-la e enviá-la, uma chave gerenciada pelo cliente no KMS é mais simples.',
    },
    references: [SSE_C, SSE_C_FAQ],
    tags: ['seguranca'],
  },
  {
    id: 's3.client-side-encryption',
    title: 'Criptografia do lado do cliente',
    officialName: 'Client-side encryption',
    serviceIds: ['aws.s3'],
    summary: 'Os dados são criptografados **antes** de sair da aplicação. O S3 recebe e guarda só o texto cifrado — nem a AWS vê o conteúdo.',
    useCases: ['Quando a política da empresa exige que o provedor nunca tenha acesso ao texto claro'],
    limitations: ['Gestão das chaves e da criptografia fica toda com a aplicação; serviços que leem o conteúdo no S3 não conseguem processá-lo.'],
    exam: {
      domains: ['d1'],
      relevance: 'media',
      notes: 'Sinal: "a AWS não pode ter acesso aos dados em texto claro". Só a criptografia no cliente garante isso; as opções SSE criptografam dentro do S3.',
    },
    references: [CSE],
    tags: ['seguranca'],
  },
  {
    id: 's3.default-encryption',
    title: 'Criptografia padrão do bucket',
    officialName: 'Default bucket encryption',
    serviceIds: ['aws.s3'],
    summary: 'Define a criptografia aplicada a objetos novos que chegam sem cabeçalho de criptografia. Pode ser SSE-S3 (padrão), SSE-KMS ou DSSE-KMS.',
    facts: [
      'Mudar a criptografia padrão não altera objetos já existentes.',
      'Para recriptografar objetos existentes, copie-os (por exemplo, com S3 Batch Operations).',
    ],
    commonMistakes: ['Achar que trocar a criptografia padrão para SSE-KMS recriptografa os objetos antigos'],
    exam: { domains: ['d1'], relevance: 'alta' },
    references: [DEFAULT_ENC, SSE],
    tags: ['seguranca'],
  },
  {
    id: 's3.bucket-keys',
    title: 'S3 Bucket Keys',
    officialName: 'Amazon S3 Bucket Keys',
    serviceIds: ['aws.s3', 'aws.kms'],
    summary: 'Uma chave de curta duração, no nível do bucket, gera as chaves de dados dos objetos SSE-KMS, reduzindo as chamadas ao KMS — e o custo dessas requisições em **até 99%**.',
    consequences: ['Políticas que restringem a chave pelo ARN do objeto no contexto de criptografia deixam de funcionar após habilitar a Bucket Key.'],
    facts: [
      'Vale para objetos novos; objetos existentes passam a usar a Bucket Key se forem copiados.',
      'Com Bucket Keys, o contexto de criptografia e os eventos do KMS no CloudTrail usam o ARN do bucket, não o do objeto.',
      'Não é compatível com DSSE-KMS.',
    ],
    exam: {
      domains: ['d1', 'd4'],
      relevance: 'alta',
      notes: 'Sinais: "reduzir o custo do KMS" ou "muitas requisições ao KMS" num bucket com SSE-KMS. A resposta é habilitar a S3 Bucket Key. Trocar para SSE-S3 também reduz o custo, mas perde o controle e a auditoria da chave.',
    },
    references: [BUCKET_KEY],
    tags: ['seguranca', 'custos'],
  },
]
