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
    explanation: [
      'Pense no arquivo de documentos de um escritório: os papéis do mês ficam na mesa, os do ano passado vão para o depósito e, vencido o prazo legal, vão para a fragmentadora. Uma regra de lifecycle escreve esse roteiro uma vez, e o S3 o cumpre sozinho. O limite da comparação: o S3 decide pela **idade** do objeto (ou por uma data), e não por quantas vezes ele foi consultado.',
      'O **filtro** escolhe os objetos da regra, e as **ações** dizem o que fazer com eles e em quantos dias: transição para uma classe mais barata, expiração e limpeza de versões antigas, de uploads incompletos e de delete markers sem versão. A regra vale para os objetos que já estão no bucket e para os que chegarem depois. O S3 executa as ações de forma assíncrona, mas a cobrança muda assim que o objeto se torna elegível; a exceção é a transição para o Intelligent-Tiering, que só muda a cobrança quando o objeto chega lá.',
      'Exemplo: um bucket recebe logs de aplicação em `logs/`. A equipe consulta com frequência os logs da última semana, raramente abre os de um a três meses e precisa guardá-los por um ano para auditoria. Uma regra com filtro `logs/` faz a transição para Standard-IA aos 30 dias e para Glacier Flexible Retrieval aos 90, e a expiração aos 365. Sem a regra, todos os logs ficariam no Standard o ano inteiro.',
      '**Regra prática:** se a idade permite prever quando o dado esfria ou deixa de ser necessário, use uma regra de lifecycle; se o acesso é imprevisível, prefira o Intelligent-Tiering.',
    ],
    useCases: [
      'Dados que esfriam de forma previsível com o tempo, como logs, backups e relatórios antigos.',
      'Prazos de retenção: excluir objetos depois de um número de dias ou numa data.',
      'Limpeza automática de versões não atuais, uploads multipart incompletos e delete markers que ficaram sem versão.',
    ],
    limitations: [
      'Não olha o acesso: um objeto muito lido transiciona do mesmo jeito quando atinge a idade da regra.',
      'Cada transição é cobrada por requisição. Com milhões de objetos pequenos, a economia pode não compensar (veja [[lc.small-objects|objetos pequenos]]).',
    ],
    comparisons: [
      { with: 'sc.intelligent-tiering', text: 'O Intelligent-Tiering move cada objeto conforme o acesso real e cobra monitoramento por objeto. A regra de lifecycle decide pela idade, sem esse custo, e sai mais barata quando o padrão é previsível.' },
      { with: 's3.storage-class-analysis', text: 'A Storage Class Analysis observa o acesso e ajuda a decidir em quantos dias fazer a transição para o Standard-IA. Quem executa a transição é a regra de lifecycle.' },
    ],
    facts: [
      'Cada bucket tem uma configuração de lifecycle, com até 1.000 regras.',
      'Filtros por prefixo, tags e tamanho são combinados com AND; um filtro vazio vale para o bucket inteiro.',
      'Os dias contam a partir da criação do objeto, arredondando para a meia-noite UTC seguinte.',
      'Em buckets de uso geral, uma bucket policy não impede as exclusões nem as transições feitas por uma regra de lifecycle.',
    ],
    commonMistakes: [
      'Esperar que a regra mova os objetos menos acessados: ela usa a idade, não o acesso.',
      'Achar que a regra só vale para objetos novos. Ela alcança também os que já estão no bucket, e uma expiração recém-criada pode apagar de uma vez os dados mais antigos.',
    ],
    exam: {
      domains: ['d4'],
      relevance: 'alta',
      notes: 'O enunciado aponta para lifecycle quando descreve dados que deixam de ser usados depois de um prazo conhecido ("raramente consultados após 30 dias", "guardar por sete anos e depois excluir") e pede para reduzir o custo automaticamente ou com menos esforço operacional. Se o padrão de acesso é desconhecido ou muda, a resposta tende ao Intelligent-Tiering. Confira também se a classe de destino atende ao tempo de recuperação exigido: arquivar no Deep Archive dados que precisam abrir na hora é uma armadilha comum.',
    },
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
    explanation: [
      'A lógica da cascata é econômica: cada transição leva o objeto para uma classe de armazenamento mais barato. Subir de volta não é uma transição de lifecycle; é uma cópia (e, a partir das classes arquivadas, uma restauração seguida de cópia), que você faz e paga.',
      'Exemplo: uma regra manda objetos para o Glacier Flexible Retrieval aos 90 dias. Se no dia 120 a equipe precisa deles com acesso imediato, nenhuma regra os traz de volta: é preciso restaurar e copiar para o Standard.',
      '**Regra prática:** o lifecycle só esfria os dados; para aquecê-los, é preciso copiar.',
    ],
    facts: [
      'One Zone-IA transiciona só para Glacier Flexible Retrieval ou Deep Archive.',
      'Glacier Instant Retrieval transiciona só para Glacier Flexible Retrieval ou Deep Archive.',
      'Para tirar um objeto do Glacier Flexible ou do Deep Archive para uma classe mais quente, é preciso restaurar e copiar.',
    ],
    exam: {
      domains: ['d4'],
      relevance: 'alta',
      notes: 'Alternativas com uma regra de lifecycle que move objetos de uma classe fria para uma mais quente são inválidas. Desconfie também de transições laterais, como do One Zone-IA para o Standard-IA.',
    },
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
    exam: {
      domains: ['d4'],
      relevance: 'media',
      notes: 'Se o cenário tem milhões de objetos de poucos KB, transicioná-los um a um costuma custar mais do que economiza. A resposta tende a agrupar os objetos em arquivos maiores antes de arquivar.',
    },
    references: [TRANS, EXAMPLES],
    tags: ['custos'],
  },
  {
    id: 'lc.expiration',
    title: 'Expiração',
    officialName: 'Expiration action',
    serviceIds: ['aws.s3'],
    summary: 'Exclui objetos ao atingir a idade definida. Num bucket **versionado**, expirar a versão atual só cria um **delete marker**: os dados ficam como versão não atual — e continuam cobrados.',
    explanation: [
      'Num bucket sem versionamento, expirar é apagar. Num bucket versionado, a expiração da versão atual só coloca um delete marker na frente; a versão antiga continua guardada, e cobrada, até uma ação para versões não atuais apagá-la.',
      'Exemplo: uma equipe cria uma regra para expirar logs com 30 dias num bucket versionado e espera ver a conta cair. A conta continua igual, porque os logs viraram versões não atuais. Faltava NoncurrentVersionExpiration na regra.',
      '**Regra prática:** em bucket versionado, expiração sem limpeza das versões não atuais não economiza.',
    ],
    comparisons: [
      { with: 'lc.noncurrent', text: 'Expiration age na versão atual; NoncurrentVersionExpiration apaga de fato as versões antigas.' },
    ],
    facts: [
      'Em bucket sem versionamento, a expiração exclui o objeto de vez.',
      'Em bucket versionado, Expiration age na versão atual; versões não atuais exigem NoncurrentVersionExpiration.',
    ],
    exam: {
      domains: ['d4', 'd2'],
      relevance: 'alta',
      notes: 'Se o enunciado diz que o custo de um bucket versionado não caiu depois de uma regra de expiração, a resposta é acrescentar NoncurrentVersionExpiration.',
    },
    references: [ELEMENTS],
    tags: ['custos'],
  },
  {
    id: 'lc.noncurrent',
    title: 'Ações para versões não atuais',
    officialName: 'NoncurrentVersionTransition / NoncurrentVersionExpiration',
    serviceIds: ['aws.s3'],
    summary: 'Transicionam ou excluem versões não atuais, contando os dias a partir de quando cada versão **deixou de ser atual**. Opcionalmente, mantêm as N versões mais recentes (NewerNoncurrentVersions).',
    explanation: [
      'Exemplo: uma regra com NoncurrentVersionExpiration de 30 dias e NewerNoncurrentVersions igual a 5 apaga as versões que estão há mais de 30 dias como não atuais, mas sempre preserva as 5 mais recentes.',
    ],
    facts: ['NewerNoncurrentVersions aceita de 1 a 100 versões e exige um elemento Filter na regra.'],
    exam: {
      domains: ['d4'],
      relevance: 'alta',
      notes: 'Sinal: "manter só as últimas N versões" ou "apagar versões antigas depois de X dias" num bucket versionado. A resposta é NoncurrentVersionExpiration, com NewerNoncurrentVersions quando é preciso manter um número fixo de versões.',
    },
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
    exam: {
      domains: ['d4'],
      relevance: 'media',
      notes: 'Sinal: custo de armazenamento que não bate com o tamanho dos objetos listados, num bucket que recebe uploads grandes. A causa provável são partes de uploads multipart incompletos, e a solução é a ação AbortIncompleteMultipartUpload.',
    },
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
