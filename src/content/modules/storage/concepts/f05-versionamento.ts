/**
 * Conceitos da Fase 5 — Versionamento e recuperação.
 * Fatos conferidos em 16/10/2026 (ver docs/VERIFICACAO-DE-CONTEUDO.md).
 */
import type { ConceptDef } from '../../../../engine/types'

const VERSIONING = { title: 'Retaining multiple versions of objects with S3 Versioning', url: 'https://docs.aws.amazon.com/AmazonS3/latest/userguide/Versioning.html' }
const SUSPENDED = { title: 'Working with objects in a versioning-suspended bucket', url: 'https://docs.aws.amazon.com/AmazonS3/latest/userguide/VersionSuspendedBehavior.html' }
const DM = { title: 'Working with delete markers', url: 'https://docs.aws.amazon.com/AmazonS3/latest/userguide/DeleteMarker.html' }
const RESTORE = { title: 'Restoring previous versions', url: 'https://docs.aws.amazon.com/AmazonS3/latest/userguide/RestoringPreviousVersions.html' }
const DELETE_VERSIONS = { title: 'Deleting object versions from a versioning-enabled bucket', url: 'https://docs.aws.amazon.com/AmazonS3/latest/userguide/DeletingObjectVersions.html' }
const MFA = { title: 'Configuring MFA delete', url: 'https://docs.aws.amazon.com/AmazonS3/latest/userguide/MultiFactorAuthenticationDelete.html' }
const LOCK = { title: 'Locking objects with Object Lock', url: 'https://docs.aws.amazon.com/AmazonS3/latest/userguide/object-lock.html' }
const BACKUP = { title: 'Amazon S3 backups (AWS Backup)', url: 'https://docs.aws.amazon.com/aws-backup/latest/devguide/s3-backups.html' }

export const F05_CONCEPTS: ConceptDef[] = [
  {
    id: 's3.versioning',
    title: 'S3 Versioning',
    officialName: 'S3 Versioning',
    serviceIds: ['aws.s3'],
    summary: 'Guarda **todas as versões** de cada objeto no mesmo bucket. Sobrescrever cria uma nova versão; excluir sem versionId cria um delete marker. Protege contra exclusões e sobrescritas acidentais.',
    facts: [
      'Um bucket está em um de três estados: sem versionamento (padrão), habilitado ou suspenso.',
      'Depois de habilitado, o versionamento nunca volta ao estado "sem versionamento" — só pode ser suspenso.',
      'O estado vale para todos os objetos do bucket.',
    ],
    exam: { domains: ['d2', 'd1'], relevance: 'alta' },
    references: [VERSIONING],
    tags: ['recuperacao', 'durabilidade'],
  },
  {
    id: 's3.version-id',
    title: 'Version ID e versão null',
    officialName: 'Version ID / null version',
    serviceIds: ['aws.s3'],
    summary: 'Com versionamento habilitado, cada gravação recebe um **version ID** único. Objetos gravados antes de habilitar (ou com versionamento suspenso) têm version ID **null**.',
    facts: ['Objetos que já existiam ao habilitar o versionamento mantêm o version ID null.'],
    exam: { domains: ['d2'], relevance: 'media' },
    references: [VERSIONING],
    tags: ['recuperacao'],
    reviewItems: [
      {
        id: 'rv:s3.version-id:antes',
        kind: 'decision',
        title: 'O arquivo de antes',
        prompt: 'Um bucket tinha `relatorio.pdf` antes de o versionamento ser habilitado. Depois de habilitar, alguém grava uma nova versão. Qual é o version ID da versão **antiga**?',
        concepts: [{ id: 's3.version-id' }],
        xp: 5,
        difficulty: 1,
        explanation: ['Objetos gravados antes de habilitar o versionamento mantêm o version ID null. A nova gravação recebe um ID único.'],
        options: [
          { id: 'a', text: 'null', correct: true, consequence: 'Isso: a versão anterior ao versionamento fica com o ID null, agora como versão não atual.' },
          { id: 'b', text: 'Um ID único gerado no momento em que o versionamento foi habilitado', correct: false, consequence: 'Habilitar o versionamento não altera objetos existentes.' },
          { id: 'c', text: 'Nenhum: a versão antiga foi substituída', correct: false, consequence: 'Com o versionamento já habilitado, o PUT cria uma nova versão e preserva a anterior.' },
        ],
      },
    ],
  },
  {
    id: 's3.delete-marker',
    title: 'Delete marker',
    officialName: 'Delete marker',
    serviceIds: ['aws.s3'],
    summary: 'Um DELETE **sem versionId** num bucket versionado não apaga nada: insere um **delete marker**, que vira a versão atual. O objeto some da listagem, mas as versões continuam guardadas.',
    facts: [
      'GET sem versionId de uma key cuja versão atual é um delete marker retorna 404, com x-amz-delete-marker: true.',
      'GET com o versionId de um delete marker retorna 405 (Method Not Allowed).',
      'ListObjectsV2 não mostra keys cuja versão atual é um delete marker; ListObjectVersions mostra tudo.',
      'Delete markers têm cobrança mínima de armazenamento (o tamanho do nome da key).',
    ],
    exam: { domains: ['d2'], relevance: 'alta' },
    references: [DM],
    tags: ['recuperacao'],
  },
  {
    id: 's3.permanent-delete',
    title: 'Exclusão permanente de versão',
    officialName: 'DeleteObject with versionId',
    serviceIds: ['aws.s3'],
    summary: 'Um DELETE **com versionId** remove aquela versão para sempre — inclusive um delete marker. É a única forma de apagar dados de um bucket versionado.',
    consequences: ['Excluir a versão errada é irreversível: o versionamento não protege contra quem tem permissão para apagar versões.'],
    exam: { domains: ['d2', 'd1'], relevance: 'alta' },
    references: [DELETE_VERSIONS],
    tags: ['recuperacao', 'seguranca'],
  },
  {
    id: 's3.restore-version',
    title: 'Restaurar uma versão anterior',
    officialName: 'Restoring previous versions',
    serviceIds: ['aws.s3'],
    summary: 'Dois caminhos: **remover o delete marker** (a versão anterior volta a ser a atual) ou **copiar** a versão desejada sobre a mesma key (cria uma nova versão atual, preservando todo o histórico).',
    comparisons: [{ with: 's3.permanent-delete', text: 'Excluir a versão ruim também restaura a anterior, mas apaga evidência; copiar preserva o histórico completo.' }],
    exam: { domains: ['d2'], relevance: 'alta' },
    references: [RESTORE],
    tags: ['recuperacao'],
  },
  {
    id: 's3.versioning-suspended',
    title: 'Versionamento suspenso',
    officialName: 'Versioning-suspended bucket',
    serviceIds: ['aws.s3'],
    summary: 'Suspender **não apaga** versões existentes, mas novas gravações passam a usar o version ID **null**: cada PUT substitui a versão null anterior, e um DELETE remove a versão null e põe um delete marker no lugar.',
    facts: [
      'Com versionamento suspenso, um PUT sobrescreve a versão null existente; versões com ID continuam guardadas.',
      'Com versionamento suspenso, um DELETE simples remove a versão null (se existir) e insere um delete marker null.',
    ],
    consequences: ['Durante a suspensão, sobrescritas e exclusões da versão null não podem ser desfeitas.'],
    exam: { domains: ['d2'], relevance: 'media' },
    references: [SUSPENDED],
    tags: ['recuperacao'],
  },
  {
    id: 's3.versioning-cost',
    title: 'Custo das versões',
    officialName: 'Versioning storage charges',
    serviceIds: ['aws.s3'],
    summary: 'Cada versão é o **objeto inteiro**, não uma diferença. Três versões de 1 GB custam como 3 GB. Use regras de **lifecycle** para expirar versões não atuais.',
    facts: ['Versões são cobradas como objetos completos, às tarifas normais do S3.'],
    recommendations: ['Combine versionamento com expiração de versões não atuais (NoncurrentVersionExpiration) em vez de suspender o versionamento para economizar.'],
    exam: { domains: ['d4', 'd2'], relevance: 'alta' },
    references: [VERSIONING],
    tags: ['custos'],
  },
  {
    id: 's3.mfa-delete',
    title: 'MFA delete',
    officialName: 'MFA delete',
    serviceIds: ['aws.s3'],
    summary: 'Exige o código de um dispositivo MFA para **excluir versões permanentemente** e para **mudar o estado do versionamento**.',
    facts: [
      'Só o dono do bucket (usuário raiz da conta) pode habilitar o MFA delete.',
      'O MFA delete não pode ser habilitado pelo console: só pela AWS CLI ou pela API.',
      'O MFA delete não pode ser usado com configurações de lifecycle.',
    ],
    exam: { domains: ['d1', 'd2'], relevance: 'media' },
    references: [MFA],
    tags: ['seguranca', 'recuperacao'],
  },
  {
    id: 's3.object-lock',
    title: 'S3 Object Lock',
    officialName: 'S3 Object Lock',
    serviceIds: ['aws.s3'],
    summary: 'Modelo **WORM** (write once, read many): impede excluir ou sobrescrever uma versão por um período (**retenção**) ou indefinidamente (**legal hold**). Exige versionamento.',
    facts: [
      'Modo compliance: ninguém, nem o usuário raiz, exclui ou encurta a retenção da versão até a data.',
      'Modo governance: só quem tem s3:BypassGovernanceRetention (e envia o cabeçalho de bypass) pode alterar ou excluir.',
      'Legal hold protege sem data de expiração, até ser removido.',
      'A proteção vale para versões específicas: um DELETE simples ainda cria um delete marker; o DELETE com versionId é negado (403).',
    ],
    useCases: ['Exigências regulatórias de retenção imutável', 'Proteção contra ransomware e exclusões maliciosas'],
    exam: { domains: ['d1', 'd2'], relevance: 'alta' },
    references: [LOCK],
    tags: ['seguranca', 'recuperacao'],
  },
  {
    id: 'backup.independent-copy',
    title: 'Versionamento não é backup',
    officialName: 'Independent backup copy',
    serviceIds: ['aws.s3'],
    summary: 'Versionamento protege contra erros **dentro do bucket**. Contra exclusão maliciosa, comprometimento da conta ou perda da Região, é preciso uma **cópia independente**: outra conta, outra Região (replicação) ou AWS Backup.',
    recommendations: [
      'Mantenha uma cópia em outra conta, com acesso restrito, para sobreviver a credenciais comprometidas.',
      'Combine versionamento com Object Lock quando a retenção precisar ser imutável.',
    ],
    exam: { domains: ['d2'], relevance: 'alta' },
    references: [BACKUP, VERSIONING],
    tags: ['recuperacao'],
  },
]
