/**
 * Conceitos da Fase 6 — Lifecycle e automação.
 * Fatos conferidos em 16/10/2026 (ver docs/VERIFICACAO-DE-CONTEUDO.md).
 */
import type { ConceptDef } from '../../../../engine/types'

const MGMT = { title: 'Managing the lifecycle of objects', url: 'https://docs.aws.amazon.com/AmazonS3/latest/userguide/object-lifecycle-mgmt.html' }
const TRANS = { title: 'Transitioning objects using Amazon S3 Lifecycle', url: 'https://docs.aws.amazon.com/AmazonS3/latest/userguide/lifecycle-transition-general-considerations.html' }
const ELEMENTS = { title: 'Lifecycle configuration elements', url: 'https://docs.aws.amazon.com/AmazonS3/latest/userguide/intro-lifecycle-rules.html' }
const CONFLICTS = { title: 'How Amazon S3 handles conflicts in lifecycle configurations', url: 'https://docs.aws.amazon.com/AmazonS3/latest/userguide/lifecycle-conflicts.html' }
const EXAMPLES = { title: 'Examples of S3 Lifecycle configurations', url: 'https://docs.aws.amazon.com/AmazonS3/latest/userguide/lifecycle-configuration-examples.html' }
const MPU = { title: 'Configuring a bucket lifecycle configuration to delete incomplete multipart uploads', url: 'https://docs.aws.amazon.com/AmazonS3/latest/userguide/mpu-abort-incomplete-mpu-lifecycle-config.html' }

export const F06_CONCEPTS: ConceptDef[] = [
  {
    id: 'lc.rules',
    title: 'Regras de lifecycle',
    officialName: 'S3 Lifecycle configuration',
    serviceIds: ['aws.s3'],
    summary: 'Uma configuração de lifecycle tem regras com **filtro** (prefixo, tags, tamanho) e **ações** (transição, expiração e limpezas). O S3 executa as ações sozinho, conforme a idade dos objetos.',
    facts: [
      'Cada bucket tem uma configuração de lifecycle, com até 1.000 regras.',
      'Filtros por prefixo, tags e tamanho são combinados com AND; um filtro vazio vale para o bucket inteiro.',
      'Os dias contam a partir da criação do objeto, arredondando para a meia-noite UTC seguinte.',
    ],
    exam: { domains: ['d4'], relevance: 'alta' },
    references: [MGMT, ELEMENTS],
    tags: ['custos'],
    reviewItems: [
      {
        id: 'rv:lc.rules:filtro',
        kind: 'decision',
        title: 'Filtro com AND',
        prompt: 'Uma regra tem o filtro `Prefix = logs/` **e** a tag `ambiente = teste`. A quais objetos ela se aplica?',
        concepts: [{ id: 'lc.rules' }],
        xp: 5,
        difficulty: 1,
        explanation: ['Prefixo, tags e tamanho são combinados com AND: o objeto precisa atender a todos.'],
        options: [
          { id: 'a', text: 'Só aos objetos em logs/ que tenham a tag ambiente=teste', correct: true, consequence: 'Isso: os critérios do filtro se somam.' },
          { id: 'b', text: 'A todos os objetos em logs/ e a todos com a tag, em qualquer prefixo', correct: false, consequence: 'Isso seria um OR; o lifecycle combina os critérios com AND.' },
          { id: 'c', text: 'A todo o bucket', correct: false, consequence: 'Só um filtro vazio vale para o bucket inteiro.' },
        ],
      },
    ],
  },
  {
    id: 'lc.waterfall',
    title: 'Cascata de transições',
    officialName: 'Supported lifecycle transitions (waterfall model)',
    serviceIds: ['aws.s3'],
    summary: 'Transições só "descem" na cascata: de Standard para classes mais frias. Não há transição de volta — de Glacier Flexible só se vai para Deep Archive, e Deep Archive não transiciona para nenhuma classe.',
    facts: [
      'One Zone-IA transiciona só para Glacier Flexible Retrieval ou Deep Archive.',
      'Glacier Instant Retrieval transiciona só para Glacier Flexible Retrieval ou Deep Archive.',
      'Para tirar um objeto do Glacier Flexible ou do Deep Archive para uma classe mais quente, é preciso restaurar e copiar.',
    ],
    exam: { domains: ['d4'], relevance: 'alta' },
    references: [TRANS],
    tags: ['custos'],
  },
  {
    id: 'lc.min-duration-rule',
    title: 'Duração mínima dentro de uma regra',
    officialName: 'Minimum storage duration in lifecycle transitions',
    serviceIds: ['aws.s3'],
    summary: 'Uma mesma regra não pode tirar o objeto de uma classe antes da duração mínima dela. Exemplo da documentação: se o objeto vai para Glacier IR aos 4 dias, só pode ir para Deep Archive a partir do dia 94.',
    facts: ['Com duas regras separadas é possível, mas paga-se o restante da duração mínima.'],
    exam: { domains: ['d4'], relevance: 'media' },
    references: [TRANS],
    tags: ['custos'],
  },
  {
    id: 'lc.small-objects',
    title: 'Objetos pequenos não transicionam',
    officialName: 'Objects smaller than 128 KB (default transition behavior)',
    serviceIds: ['aws.s3'],
    summary: 'Desde **setembro de 2024**, por padrão, objetos **menores que 128 KB** não transicionam para nenhuma classe. Cada transição é cobrada por objeto — com objetos pequenos, a conta não fecha.',
    facts: ['É possível permitir a transição com um filtro de tamanho explícito (ObjectSizeGreaterThan ou ObjectSizeLessThan).'],
    recommendations: ['Agrupe objetos pequenos em arquivos maiores antes de arquivar.'],
    exam: { domains: ['d4'], relevance: 'media' },
    references: [TRANS, EXAMPLES],
    tags: ['custos'],
  },
  {
    id: 'lc.expiration',
    title: 'Expiração',
    officialName: 'Expiration action',
    serviceIds: ['aws.s3'],
    summary: 'Exclui objetos ao atingir a idade definida. Num bucket **versionado**, expirar a versão atual só cria um **delete marker**: os dados ficam como versão não atual — e continuam cobrados.',
    facts: [
      'Em bucket sem versionamento, a expiração exclui o objeto de vez.',
      'Em bucket versionado, Expiration age na versão atual; versões não atuais exigem NoncurrentVersionExpiration.',
    ],
    exam: { domains: ['d4', 'd2'], relevance: 'alta' },
    references: [ELEMENTS],
    tags: ['custos'],
  },
  {
    id: 'lc.noncurrent',
    title: 'Ações para versões não atuais',
    officialName: 'NoncurrentVersionTransition / NoncurrentVersionExpiration',
    serviceIds: ['aws.s3'],
    summary: 'Transicionam ou excluem versões não atuais, contando os dias a partir de quando cada versão **deixou de ser atual**. Opcionalmente, mantêm as N versões mais recentes (NewerNoncurrentVersions).',
    facts: ['NewerNoncurrentVersions aceita de 1 a 100 versões e exige um elemento Filter na regra.'],
    exam: { domains: ['d4'], relevance: 'alta' },
    references: [ELEMENTS, EXAMPLES],
    tags: ['custos'],
  },
  {
    id: 'lc.mpu-cleanup',
    title: 'Uploads multipart incompletos',
    officialName: 'AbortIncompleteMultipartUpload',
    serviceIds: ['aws.s3'],
    summary: 'Partes de uploads multipart que nunca foram concluídos ficam guardadas — e cobradas — sem aparecer na listagem. A ação **AbortIncompleteMultipartUpload** interrompe esses uploads após N dias.',
    facts: [
      'Expiration não remove uploads multipart incompletos.',
      'AbortIncompleteMultipartUpload não pode ser usado em regra com filtro por tag.',
    ],
    recommendations: ['Inclua AbortIncompleteMultipartUpload em todo bucket que recebe uploads grandes.'],
    exam: { domains: ['d4'], relevance: 'media' },
    references: [MPU, ELEMENTS],
    tags: ['custos'],
  },
  {
    id: 'lc.expired-delete-markers',
    title: 'Delete markers expirados',
    officialName: 'ExpiredObjectDeleteMarker',
    serviceIds: ['aws.s3'],
    summary: 'Um delete marker sem nenhuma versão por baixo é um **expired object delete marker**. A ação ExpiredObjectDeleteMarker remove esses marcadores, que só poluem as listagens de versões.',
    facts: [
      'ExpiredObjectDeleteMarker não pode ser usado em regra com filtro por tag.',
      'Não é possível usar Days e ExpiredObjectDeleteMarker na mesma ação Expiration.',
    ],
    exam: { domains: ['d4'], relevance: 'baixa' },
    references: [EXAMPLES],
    tags: ['custos'],
    reviewItems: [
      {
        id: 'rv:lc.expired-delete-markers:o-que',
        kind: 'decision',
        title: 'Marcador sem nada por baixo',
        prompt: 'Num bucket versionado, todas as versões de `rascunho.xlsx` foram excluídas e sobrou só o delete marker. Como limpar esses marcadores automaticamente?',
        concepts: [{ id: 'lc.expired-delete-markers' }],
        xp: 5,
        difficulty: 1,
        explanation: ['Um delete marker sem versões é um expired object delete marker. A ação ExpiredObjectDeleteMarker remove esses marcadores.'],
        options: [
          { id: 'a', text: 'Regra de lifecycle com ExpiredObjectDeleteMarker', correct: true, consequence: 'Os marcadores órfãos somem das listagens de versões.' },
          { id: 'b', text: 'AbortIncompleteMultipartUpload', correct: false, consequence: 'Essa ação trata uploads multipart incompletos, não delete markers.' },
          { id: 'c', text: 'Uma regra com filtro por tag e ExpiredObjectDeleteMarker', correct: false, consequence: 'ExpiredObjectDeleteMarker não pode ser usado em regra com filtro por tag.' },
        ],
      },
    ],
  },
  {
    id: 'lc.conflicts',
    title: 'Conflitos entre regras',
    officialName: 'Lifecycle conflict resolution',
    serviceIds: ['aws.s3'],
    summary: 'Quando regras se sobrepõem, o S3 escolhe o caminho mais barato: a **expiração vence a transição**, a expiração mais curta vence, e entre Glacier Flexible e Standard-IA (ou One Zone-IA) no mesmo dia, vence Glacier Flexible.',
    facts: [
      'Exclusão permanente tem precedência sobre transição.',
      'Transição tem precedência sobre a criação de delete markers.',
      'Intelligent-Tiering é preferido sobre qualquer classe, exceto Glacier Flexible Retrieval e Deep Archive.',
    ],
    exam: { domains: ['d4'], relevance: 'media' },
    references: [CONFLICTS],
    tags: ['custos'],
  },
]
