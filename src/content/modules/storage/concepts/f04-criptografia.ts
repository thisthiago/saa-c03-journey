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
    explanation: ['No S3, a criptografia em repouso é feita no servidor (SSE) ou pelo cliente antes do envio. Em trânsito, o que importa é a requisição usar HTTPS — e uma bucket policy pode exigir isso.'],
    commonMistakes: ['Achar que, por o bucket ter SSE-S3, o tráfego HTTP também fica protegido'],
    exam: { domains: ['d1'], relevance: 'alta' },
    references: [SSE, TLS],
    tags: ['seguranca'],
  },
  {
    id: 's3.tls-enforcement',
    title: 'Exigir HTTPS com aws:SecureTransport',
    officialName: 'aws:SecureTransport condition key',
    serviceIds: ['aws.s3', 'aws.iam'],
    summary: 'Uma declaração **Deny** na bucket policy com a condição `aws:SecureTransport = false` recusa qualquer requisição feita sem TLS, de qualquer principal.',
    facts: ['`aws:SecureTransport` é `false` quando a requisição não usa TLS.'],
    recommendations: ['Use Deny (e não Allow condicionado) para exigir HTTPS: um Allow com a condição não impede quem já tem permissão por outra política.'],
    commonMistakes: ['Usar um Allow com `aws:SecureTransport = true`, que não bloqueia requisições HTTP de quem já tem permissão por IAM'],
    exam: { domains: ['d1'], relevance: 'alta' },
    references: [TLS],
    tags: ['seguranca'],
  },
  {
    id: 's3.sse-s3',
    title: 'SSE-S3',
    officialName: 'Server-side encryption with Amazon S3 managed keys (SSE-S3)',
    serviceIds: ['aws.s3'],
    summary: 'O S3 gerencia as chaves e criptografa cada objeto com AES-256. É a **criptografia padrão** de todos os buckets, sem custo adicional.',
    facts: [
      'Desde 5 de janeiro de 2023, todo objeto novo enviado ao S3 é criptografado automaticamente, sem custo adicional.',
      'Cada objeto é criptografado com uma chave única, protegida por uma chave raiz rotacionada regularmente.',
    ],
    limitations: ['Não há key policy própria nem registro de uso da chave no CloudTrail por objeto: quem tem permissão no S3 lê o dado.'],
    exam: { domains: ['d1'], relevance: 'alta' },
    references: [SSE, SSE_S3],
    tags: ['seguranca'],
  },
  {
    id: 's3.sse-kms',
    title: 'SSE-KMS',
    officialName: 'Server-side encryption with AWS KMS keys (SSE-KMS)',
    serviceIds: ['aws.s3', 'aws.kms'],
    summary: 'O S3 criptografa com chaves do **AWS KMS**. Você controla quem usa a chave (key policy + IAM) e o uso aparece no **CloudTrail**. Para ler, é preciso permissão no S3 **e** `kms:Decrypt` na chave.',
    facts: [
      'Gravar um objeto SSE-KMS exige `kms:GenerateDataKey`; ler exige `kms:Decrypt`.',
      'A chave gerenciada pela AWS (`aws/s3`) tem key policy que não pode ser alterada e não permite uso por outras contas.',
    ],
    recommendations: ['Use uma chave gerenciada pelo cliente quando precisar controlar quem descriptografa, compartilhar entre contas ou auditar o uso.'],
    consequences: ['Sem `kms:Decrypt`, o GET falha com AccessDenied mesmo com permissão total no S3.'],
    exam: { domains: ['d1'], relevance: 'alta' },
    references: [SSE_KMS, KMS_KEYS],
    tags: ['seguranca'],
  },
  {
    id: 'kms.key-policy',
    title: 'Key policy do KMS',
    officialName: 'AWS KMS key policy',
    serviceIds: ['aws.kms'],
    summary: 'Toda chave KMS tem uma **key policy**. Ela pode conceder uso diretamente ou **delegar à conta**, deixando as políticas IAM decidirem. Entre contas, a key policy **e** a política IAM de origem precisam permitir.',
    facts: [
      'Sem permissão na key policy (direta ou por delegação à conta), nenhuma política IAM consegue dar acesso à chave.',
      'A key policy padrão concede acesso à conta, o que habilita as políticas IAM a controlarem o uso da chave.',
    ],
    commonMistakes: ['Conceder `kms:Decrypt` só na política IAM de outra conta, esquecendo a key policy'],
    exam: { domains: ['d1'], relevance: 'alta' },
    references: [KEY_POLICY],
    tags: ['seguranca'],
  },
  {
    id: 's3.dsse-kms',
    title: 'DSSE-KMS',
    officialName: 'Dual-layer server-side encryption with AWS KMS keys (DSSE-KMS)',
    serviceIds: ['aws.s3', 'aws.kms'],
    summary: 'Duas camadas independentes de AES-256 no servidor: uma com chave de dados do KMS e outra com chave gerenciada pelo S3. Atende exigências de **criptografia multicamada**.',
    facts: ['S3 Bucket Keys não são compatíveis com DSSE-KMS.'],
    useCases: ['Normas que exigem duas camadas de criptografia em repouso'],
    exam: { domains: ['d1'], relevance: 'media' },
    references: [DSSE, BUCKET_KEY],
    tags: ['seguranca'],
  },
  {
    id: 's3.sse-c',
    title: 'SSE-C',
    officialName: 'Server-side encryption with customer-provided keys (SSE-C)',
    serviceIds: ['aws.s3'],
    summary: 'Você envia a chave **em cada requisição**; o S3 criptografa e descriptografa, mas **não guarda a chave**. Perdeu a chave, perdeu o objeto.',
    facts: [
      'Desde abril de 2026, buckets de uso geral novos têm SSE-C desabilitado para novas gravações; é preciso habilitá-lo deliberadamente com PutBucketEncryption.',
      'Requisições SSE-C precisam usar HTTPS.',
    ],
    limitations: ['A aplicação precisa gerenciar e enviar a chave em cada leitura e gravação.'],
    exam: { domains: ['d1'], relevance: 'media' },
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
    exam: { domains: ['d1'], relevance: 'media' },
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
    facts: [
      'Vale para objetos novos; objetos existentes passam a usar a Bucket Key se forem copiados.',
      'Com Bucket Keys, o contexto de criptografia e os eventos do KMS no CloudTrail usam o ARN do bucket, não o do objeto.',
      'Não é compatível com DSSE-KMS.',
    ],
    consequences: ['Políticas que restringem a chave pelo ARN do objeto no contexto de criptografia deixam de funcionar após habilitar a Bucket Key.'],
    exam: { domains: ['d1', 'd4'], relevance: 'alta' },
    references: [BUCKET_KEY],
    tags: ['seguranca', 'custos'],
  },
]
