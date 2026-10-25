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
    explanation: [
      'Pense no histórico de versões de um documento num editor on-line: cada salvamento vira uma versão, e apagar o documento só o tira da lista, porque o histórico continua lá. O limite da comparação: no S3, cada versão é uma cópia inteira do objeto, cobrada como tal.',
      'Com o versionamento habilitado, uma operação comum não destrói dados: um PUT cria uma nova versão, e um DELETE sem versionId coloca um [[s3.delete-marker|delete marker]] na frente. As versões anteriores continuam acessíveis pelo version ID e podem ser restauradas.',
      'Exemplo: um script com defeito sobrescreve milhares de arquivos de configuração. Com versionamento, basta restaurar a versão anterior de cada um; sem ele, os originais estariam perdidos.',
      '**Regra prática:** o versionamento desfaz erros dentro do bucket; contra ataques ou perda da conta, é preciso uma cópia independente.',
    ],
    comparisons: [
      { with: 'backup.independent-copy', text: 'As versões ficam no mesmo bucket, na mesma conta e na mesma Região. Uma cópia independente sobrevive ao comprometimento da conta e à perda da Região.' },
      { with: 's3.object-lock', text: 'O versionamento guarda o histórico, mas quem tem permissão ainda apaga versões. O Object Lock impede essa exclusão durante a retenção.' },
    ],
    facts: [
      'Um bucket está em um de três estados: sem versionamento (padrão), habilitado ou suspenso.',
      'Depois de habilitado, o versionamento nunca volta ao estado "sem versionamento" — só pode ser suspenso.',
      'O estado vale para todos os objetos do bucket.',
    ],
    exam: {
      domains: ['d2', 'd1'],
      relevance: 'alta',
      notes: 'Sinais: "proteger contra exclusão ou sobrescrita acidental" e "recuperar versões anteriores". O versionamento também é pré-requisito da replicação e do Object Lock. Para controlar o custo das versões antigas, combine-o com uma regra de lifecycle para versões não atuais.',
    },
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
    explanation: [
      'O delete marker funciona como uma etiqueta de "excluído" colocada na frente das versões: a key some das listagens comuns e um GET simples devolve 404, mas nada foi apagado. Por isso, remover o delete marker basta para desfazer a exclusão.',
    ],
    facts: [
      'GET sem versionId de uma key cuja versão atual é um delete marker retorna 404, com x-amz-delete-marker: true.',
      'GET com o versionId de um delete marker retorna 405 (Method Not Allowed).',
      'ListObjectsV2 não mostra keys cuja versão atual é um delete marker; ListObjectVersions mostra tudo.',
      'Delete markers têm cobrança mínima de armazenamento (o tamanho do nome da key).',
    ],
    exam: {
      domains: ['d2'],
      relevance: 'alta',
      notes: 'Se a questão pergunta como recuperar um objeto excluído num bucket versionado, a resposta é remover o delete marker ou copiar a versão anterior. Se pergunta como apagar de verdade, é preciso excluir informando o versionId.',
    },
    references: [DM],
    tags: ['recuperacao'],
  },
  {
    id: 's3.permanent-delete',
    title: 'Exclusão permanente de versão',
    officialName: 'DeleteObject with versionId',
    serviceIds: ['aws.s3'],
    summary: 'Um DELETE **com versionId** remove aquela versão para sempre — inclusive um delete marker. É a única forma de apagar dados de um bucket versionado.',
    comparisons: [
      { with: 's3.mfa-delete', text: 'O MFA delete exige um código de MFA para essa exclusão permanente.' },
      { with: 's3.object-lock', text: 'O Object Lock nega a exclusão da versão enquanto durar a retenção ou o legal hold.' },
    ],
    consequences: ['Excluir a versão errada é irreversível: o versionamento não protege contra quem tem permissão para apagar versões.'],
    exam: {
      domains: ['d2', 'd1'],
      relevance: 'alta',
      notes: 'Se o requisito é impedir que alguém com permissão apague versões permanentemente, as respostas são o MFA delete ou o Object Lock, este quando a retenção precisa ser garantida por um prazo.',
    },
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
    explanation: [
      'Exemplo: um arquivo de 100 MB é sobrescrito todo dia. Em um mês, o bucket guarda cerca de 30 versões, ou 3 GB, por um único arquivo. Uma regra que expira versões não atuais depois de 7 dias limita o acúmulo a uma semana de histórico.',
    ],
    comparisons: [
      { with: 'lc.noncurrent', text: 'As ações para versões não atuais do lifecycle são a ferramenta para controlar esse custo sem abrir mão do versionamento.' },
    ],
    facts: ['Versões são cobradas como objetos completos, às tarifas normais do S3.'],
    recommendations: ['Combine versionamento com expiração de versões não atuais (NoncurrentVersionExpiration) em vez de suspender o versionamento para economizar.'],
    exam: {
      domains: ['d4', 'd2'],
      relevance: 'alta',
      notes: 'Se o custo de um bucket versionado cresce sem explicação, a resposta é uma regra de lifecycle com NoncurrentVersionExpiration. Suspender o versionamento não apaga as versões existentes e ainda tira a proteção.',
    },
    references: [VERSIONING],
    tags: ['custos'],
  },
  {
    id: 's3.mfa-delete',
    title: 'MFA delete',
    officialName: 'MFA delete',
    serviceIds: ['aws.s3'],
    summary: 'Exige o código de um dispositivo MFA para **excluir versões permanentemente** e para **mudar o estado do versionamento**.',
    comparisons: [
      { with: 's3.object-lock', text: 'O MFA delete pede um segundo fator para excluir; o Object Lock impede a exclusão durante a retenção, mesmo para quem tem o MFA.' },
    ],
    facts: [
      'Só o dono do bucket (usuário raiz da conta) pode habilitar o MFA delete.',
      'O MFA delete não pode ser habilitado pelo console: só pela AWS CLI ou pela API.',
      'O MFA delete não pode ser usado com configurações de lifecycle.',
    ],
    exam: {
      domains: ['d1', 'd2'],
      relevance: 'media',
      notes: 'Sinal: "exigir autenticação adicional para excluir versões". Lembre as restrições: só o usuário raiz habilita, não há opção no console e não funciona com lifecycle. Se a exigência é retenção por um prazo determinado, a resposta é o Object Lock.',
    },
    references: [MFA],
    tags: ['seguranca', 'recuperacao'],
  },
  {
    id: 's3.object-lock',
    title: 'S3 Object Lock',
    officialName: 'S3 Object Lock',
    serviceIds: ['aws.s3'],
    summary: 'Modelo **WORM** (write once, read many): impede excluir ou sobrescrever uma versão por um período (**retenção**) ou indefinidamente (**legal hold**). Exige versionamento.',
    explanation: [
      'O Object Lock trava versões específicas. No modo **governance**, quem tem uma permissão especial ainda consegue contornar a trava: serve para proteger contra a maioria dos usuários e para testes. No modo **compliance**, ninguém contorna até a data de retenção, nem o usuário raiz: é o que normas de retenção imutável costumam exigir. O legal hold trava sem data, até alguém removê-lo.',
      'Exemplo: uma corretora precisa guardar registros de operações por cinco anos sem possibilidade de alteração. Um bucket com Object Lock no modo compliance e retenção padrão de cinco anos atende: nem um administrador com credenciais comprometidas consegue apagar as versões antes do prazo.',
      '**Regra prática:** retenção imutável exigida por norma pede o modo compliance; proteção que alguém autorizado precisa poder contornar pede o modo governance.',
    ],
    useCases: ['Exigências regulatórias de retenção imutável', 'Proteção contra ransomware e exclusões maliciosas'],
    facts: [
      'Modo compliance: ninguém, nem o usuário raiz, exclui ou encurta a retenção da versão até a data.',
      'Modo governance: só quem tem s3:BypassGovernanceRetention (e envia o cabeçalho de bypass) pode alterar ou excluir.',
      'Legal hold protege sem data de expiração, até ser removido.',
      'A proteção vale para versões específicas: um DELETE simples ainda cria um delete marker; o DELETE com versionId é negado (403).',
    ],
    exam: {
      domains: ['d1', 'd2'],
      relevance: 'alta',
      notes: 'Sinais: "WORM", "imutável", "retenção regulatória" e "proteger backups contra ransomware". Leia se alguém precisa conseguir remover a proteção: se ninguém pode, é o modo compliance.',
    },
    references: [LOCK],
    tags: ['seguranca', 'recuperacao'],
  },
  {
    id: 'backup.independent-copy',
    title: 'Versionamento não é backup',
    officialName: 'Independent backup copy',
    serviceIds: ['aws.s3'],
    summary: 'Versionamento protege contra erros **dentro do bucket**. Contra exclusão maliciosa, comprometimento da conta ou perda da Região, é preciso uma **cópia independente**: outra conta, outra Região (replicação) ou AWS Backup.',
    explanation: [
      'Versionamento e Object Lock vivem no mesmo bucket, na mesma conta e na mesma Região. Se a conta é comprometida, se alguém com permissões altas age de má-fé ou se a Região fica indisponível, todas as versões estão no mesmo lugar do problema. Uma cópia independente quebra essa dependência.',
      'Exemplo: uma empresa replica os buckets críticos para uma conta de backup, em outra Região, onde só uma equipe pequena tem acesso, e liga o Object Lock no destino. Um invasor com credenciais da conta de produção não alcança essa cópia.',
      '**Regra prática:** a cópia de segurança precisa estar fora do alcance de quem pode estragar o original.',
    ],
    recommendations: [
      'Mantenha uma cópia em outra conta, com acesso restrito, para sobreviver a credenciais comprometidas.',
      'Combine versionamento com Object Lock quando a retenção precisar ser imutável.',
    ],
    exam: {
      domains: ['d2'],
      relevance: 'alta',
      notes: 'Sinais: "sobreviver ao comprometimento da conta", "proteção contra ransomware" ou "perda da Região". A resposta envolve uma cópia em outra conta e, se necessário, em outra Região, protegida com Object Lock ou com um cofre do AWS Backup.',
    },
    references: [BACKUP, VERSIONING],
    tags: ['recuperacao'],
  },
]
