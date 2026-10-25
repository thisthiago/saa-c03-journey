/**
 * Conceitos da Fase 7 — Replicação e recuperação de desastres.
 * Fatos conferidos em 16/10/2026 (ver docs/VERIFICACAO-DE-CONTEUDO.md).
 */
import type { ConceptDef } from '../../../../engine/types'

const REPL = { title: 'Replicating objects within and across Regions', url: 'https://docs.aws.amazon.com/AmazonS3/latest/userguide/replication.html' }
const REQ = { title: 'Requirements and considerations for replication', url: 'https://docs.aws.amazon.com/AmazonS3/latest/userguide/replication-requirements.html' }
const WHAT = { title: 'What does Amazon S3 replicate?', url: 'https://docs.aws.amazon.com/AmazonS3/latest/userguide/replication-what-is-isnot-replicated.html' }
const KMS = { title: 'Replicating encrypted objects', url: 'https://docs.aws.amazon.com/AmazonS3/latest/userguide/replication-config-for-kms-objects.html' }
const RTC = { title: 'Meeting compliance requirements with S3 Replication Time Control', url: 'https://docs.aws.amazon.com/AmazonS3/latest/userguide/replication-time-control.html' }
const BATCH = { title: 'Replicating existing objects with Batch Replication', url: 'https://docs.aws.amazon.com/AmazonS3/latest/userguide/s3-batch-replication-batch.html' }
const DM = { title: 'Replicating delete markers between buckets', url: 'https://docs.aws.amazon.com/AmazonS3/latest/userguide/delete-marker-replication.html' }

export const F07_CONCEPTS: ConceptDef[] = [
  {
    id: 'repl.crr-srr',
    title: 'CRR e SRR',
    officialName: 'Cross-Region Replication (CRR) / Same-Region Replication (SRR)',
    serviceIds: ['aws.s3'],
    summary: 'A replicação copia objetos novos, de forma assíncrona, para outro bucket: em **outra Região** (CRR) ou na **mesma Região** (SRR), na mesma conta ou em outra.',
    explanation: [
      'A replicação é configurada por regras no bucket de origem: cada regra escolhe quais objetos copiar (o bucket todo, um prefixo ou tags) e para qual bucket. A cópia acontece depois da gravação, de forma assíncrona, e só para objetos novos; o que já existia precisa da [[repl.batch|Batch Replication]].',
      'Exemplo: um bucket de documentos em sa-east-1 replica para us-east-1 com CRR. Se a Região de origem ficar indisponível, a aplicação pode passar a ler a cópia em us-east-1. Com SRR, a mesma empresa copia os logs de várias contas de produção para um bucket central de auditoria, na mesma Região.',
      '**Regra prática:** CRR quando a cópia precisa estar em outra Região (desastre, latência, exigência geográfica); SRR quando ela pode ficar na mesma Região (agregação, separação entre contas, soberania).',
    ],
    useCases: ['CRR: recuperação de desastres, latência menor para usuários distantes, exigências de cópia geográfica', 'SRR: agregar logs, copiar dados entre contas de produção e teste, manter cópia sob soberania na mesma Região'],
    facts: ['Não há cobrança de transferência de dados entre Regiões na SRR; na CRR, a transferência entre Regiões é cobrada.'],
    exam: {
      domains: ['d2'],
      relevance: 'alta',
      notes: 'Sinais: "cópia em outra Região para recuperação de desastres" ou "usuários em outro continente" apontam para CRR; "centralizar logs de várias contas" ou "cópia em outra conta na mesma Região", para SRR. Lembre que a replicação não copia objetos que já existiam e não substitui um backup.',
    },
    references: [REPL, REQ],
    tags: ['recuperacao', 'disponibilidade'],
  },
  {
    id: 'repl.requirements',
    title: 'Pré-requisitos da replicação',
    officialName: 'Replication requirements',
    serviceIds: ['aws.s3', 'aws.iam'],
    summary: 'Versionamento **habilitado na origem e no destino**, um **papel IAM** que o S3 assume para replicar e, entre contas, uma **bucket policy no destino** autorizando a conta de origem.',
    facts: [
      'Se o versionamento do destino for desabilitado, a replicação falha (status FAILED).',
      'Com Object Lock na origem, o destino também precisa de Object Lock.',
      'O bucket de destino não pode ser Requester Pays em replicação entre contas.',
    ],
    exam: {
      domains: ['d2', 'd1'],
      relevance: 'alta',
      notes: 'Questões de replicação que não funciona costumam ter um pré-requisito faltando: versionamento no destino, permissão no papel de replicação, bucket policy no destino (entre contas) ou permissões do KMS.',
    },
    references: [REQ],
    tags: ['recuperacao'],
    reviewItems: [
      {
        id: 'rv:repl.requirements:conta',
        kind: 'decision',
        title: 'Replicar para outra conta',
        prompt: 'A origem e o destino têm versionamento e o papel de replicação está correto. O destino é de **outra conta**, e as réplicas ficam com status FAILED. O que falta?',
        concepts: [{ id: 'repl.requirements' }],
        xp: 5,
        difficulty: 1,
        explanation: ['Entre contas, o dono do bucket de destino precisa conceder, numa bucket policy, permissão para a conta de origem replicar.'],
        options: [
          { id: 'a', text: 'Uma bucket policy no destino autorizando a conta de origem a replicar', correct: true, consequence: 'Com a autorização do lado do destino, as réplicas passam a COMPLETED.' },
          { id: 'b', text: 'Habilitar o S3 RTC', correct: false, consequence: 'RTC define o SLA de tempo; não concede permissões.' },
          { id: 'c', text: 'Desabilitar o versionamento do destino', correct: false, consequence: 'O versionamento é obrigatório nos dois lados: sem ele, a replicação falha.' },
        ],
      },
    ],
  },
  {
    id: 'repl.what-not',
    title: 'O que não é replicado',
    officialName: 'What isn’t replicated',
    serviceIds: ['aws.s3'],
    summary: 'Por padrão, **não** são replicados: objetos anteriores à configuração, réplicas de outra regra, objetos em Glacier Flexible ou Deep Archive, ações do lifecycle, exclusões de versão específica e, com filtro por tag, objetos marcados depois do PUT.',
    facts: [
      'Um DELETE com versionId apaga a versão só na origem: a réplica é preservada.',
      'Numa cadeia A, B, C, os objetos que chegaram em B vindos de A não seguem para C.',
      'Mudanças de configuração do bucket (lifecycle, notificações) não são replicadas.',
    ],
    exam: {
      domains: ['d2'],
      relevance: 'alta',
      notes: 'Duas pegadinhas: objetos que já existiam antes da regra não são copiados (para eles, use a Batch Replication), e exclusões feitas com versionId não chegam ao destino, o que preserva as réplicas.',
    },
    references: [WHAT],
    tags: ['recuperacao'],
  },
  {
    id: 'repl.delete-markers',
    title: 'Replicação de delete markers',
    officialName: 'Delete marker replication',
    serviceIds: ['aws.s3'],
    summary: 'Com a configuração atual (com Filter), delete markers **não** são replicados por padrão. Habilite DeleteMarkerReplication se o destino deve espelhar as exclusões — exceto em regras com filtro por tag.',
    consequences: ['Replicar delete markers faz uma exclusão acidental na origem também esconder o objeto no destino (as versões continuam lá).'],
    exam: { domains: ['d2'], relevance: 'media' },
    references: [DM, WHAT],
    tags: ['recuperacao'],
  },
  {
    id: 'repl.kms',
    title: 'Replicação de objetos SSE-KMS',
    officialName: 'Replicating SSE-KMS encrypted objects',
    serviceIds: ['aws.s3', 'aws.kms'],
    summary: 'Objetos SSE-KMS exigem **opt-in** (SseKmsEncryptedObjects), uma **chave para as réplicas na Região do destino** e, no papel de replicação, kms:Decrypt na chave de origem e kms:Encrypt na chave das réplicas.',
    facts: [
      'Entre contas, a chave das réplicas precisa ser gerenciada pelo cliente: chaves gerenciadas pela AWS não permitem uso entre contas.',
      'Objetos SSE-C são replicados sem permissões adicionais.',
    ],
    exam: {
      domains: ['d1', 'd2'],
      relevance: 'alta',
      notes: 'Se a replicação de objetos SSE-KMS falha, confira o opt-in de objetos SSE-KMS na regra, a chave na Região de destino e as permissões kms:Decrypt e kms:Encrypt do papel de replicação. Entre contas, a chave das réplicas precisa ser gerenciada pelo cliente.',
    },
    references: [KMS],
    tags: ['seguranca', 'recuperacao'],
  },
  {
    id: 'repl.rtc',
    title: 'S3 Replication Time Control',
    officialName: 'S3 Replication Time Control (S3 RTC)',
    serviceIds: ['aws.s3'],
    summary: 'Replica a maioria dos objetos em segundos e **99,9% em até 15 minutos**, com métricas de replicação e eventos quando o limite é ultrapassado. Útil quando o RPO precisa ser previsível.',
    facts: ['O SLA não se aplica quando a taxa de transferência excede a cota padrão de 1 Gbps ou as diretrizes de requisições por segundo.'],
    exam: {
      domains: ['d2'],
      relevance: 'media',
      notes: 'Sinal: "dados do S3 em outra Região com RPO de 15 minutos" ou "replicação com tempo previsível e monitorado". A resposta é a CRR com Replication Time Control.',
    },
    references: [RTC],
    tags: ['recuperacao'],
  },
  {
    id: 'repl.batch',
    title: 'S3 Batch Replication',
    officialName: 'S3 Batch Replication',
    serviceIds: ['aws.s3'],
    summary: 'Replica sob demanda o que a replicação contínua não cobre: objetos **existentes**, objetos que **falharam** e réplicas que precisam seguir para outro destino.',
    exam: {
      domains: ['d2'],
      relevance: 'media',
      notes: 'Sinal: "replicar também os objetos que já existiam no bucket" ou "reprocessar objetos cuja replicação falhou". A resposta é a S3 Batch Replication.',
    },
    references: [BATCH],
    tags: ['recuperacao'],
  },
  {
    id: 'dr.rpo-rto',
    title: 'RPO e RTO',
    officialName: 'Recovery Point Objective / Recovery Time Objective',
    serviceIds: ['aws.s3'],
    summary: '**RPO**: quanto dado se aceita perder (a idade da última cópia). **RTO**: em quanto tempo o serviço precisa voltar. A replicação reduz o RPO; o RTO depende de como a aplicação passa a usar o destino.',
    explanation: [
      'Pense num documento salvo de hora em hora: se o computador quebra, você perde no máximo uma hora de trabalho (o RPO) e leva o tempo de pegar outro computador e abrir o arquivo para voltar a trabalhar (o RTO). O limite da comparação: na nuvem, as duas metas são escolhas de arquitetura, e cada uma tem custo.',
      'O RPO depende da frequência e do atraso das cópias: backups diários dão um RPO de até um dia; replicação contínua, de segundos ou minutos. O RTO depende de quanto da infraestrutura já está pronta no destino: recriar tudo a partir de backups leva horas; ter uma cópia em execução e trocar o tráfego leva minutos. Quanto menores as metas, maior o custo.',
      'Exemplo: um e-commerce aceita perder no máximo 15 minutos de pedidos e precisa voltar em 1 hora. Backups diários não atendem ao RPO; replicação contínua do banco e do S3 para outra Região, com a infraestrutura mínima já pronta para crescer, atende às duas metas.',
      '**Regra prática:** o RPO pergunta quanto dado se perde; o RTO pergunta quanto tempo o sistema fica parado.',
    ],
    comparisons: [
      { with: 'dr.choose', text: 'As estratégias de recuperação (backup e restauração, pilot light, warm standby e multi-site) são escolhidas a partir do RPO e do RTO exigidos.' },
    ],
    recommendations: ['Teste a recuperação: aplicação, permissões e chaves KMS precisam funcionar na Região de destino.'],
    exam: {
      domains: ['d2'],
      relevance: 'alta',
      notes: 'O guia da SAA-C03 cita RPO e RTO, junto com as estratégias de recuperação de desastres, na tarefa 2.2. As questões dão as duas metas e pedem a estratégia mais barata que as cumpre: backup e restauração para metas de horas; cópias sempre prontas (pilot light, warm standby ou ativo-ativo) para metas de minutos.',
    },
    references: [REPL],
    tags: ['recuperacao'],
  },
]
