/** Fase 6 — Lifecycle e automação (empresa fictícia: RotaLog Transportes). */
import type { PhaseDef } from '../../../../../engine/types'
import { formatUSD } from '../../../../../simulators/cost/model'
import { costFirstMonths, runLifecycleLab, type LifecycleLabConfig } from '../../../../../simulators/lifecycle/lab'
import { emptyRule, type Dataset, type LifecycleRule } from '../../../../../simulators/lifecycle/model'
import { LOGS, MARCADORES, NOTAS, RELATORIOS, TELEMETRIA, UPLOADS, VERSOES_ANTIGAS } from './datasets'

const COMPANY = 'RotaLog Transportes'
const ROLE = 'Você é a pessoa de FinOps da empresa e responde pela conta do S3.'
const BUCKET = 'rotalog-dados'
const REGION = 'us-east-1'

const rule = (id: string, p: Partial<LifecycleRule>): LifecycleRule => ({ ...emptyRule(id), ...p })

/** Teto de custo = custo da solução de referência + folga. Coerente por construção. */
function withCostGoal(c: Omit<LifecycleLabConfig, 'goals'> & { goals: LifecycleLabConfig['goals'] }, slack: number, months = 12): LifecycleLabConfig {
  const ref = costFirstMonths(runLifecycleLab(c, c.solution).costs, months)
  const max = Math.ceil(ref * (1 + slack))
  return {
    ...c,
    goals: [...c.goals, { type: 'cost-max', months, maxUSD: max, why: `A meta do financeiro para os primeiros ${months} meses é ${formatUSD(max)}.`, concepts: ['lc.rules'] }],
  }
}

// --- Missão 2 -------------------------------------------------------------------
const M2_LAB = withCostGoal(
  {
    bucketName: BUCKET,
    region: REGION,
    datasets: [TELEMETRIA, NOTAS, LOGS],
    initialRules: [],
    horizonDays: 730,
    features: { size: true },
    goals: [
      { type: 'valid', why: 'Uma configuração com erro é rejeitada inteira.', concepts: ['lc.rules'] },
      { type: 'state-at', dataset: 'telemetria', day: 15, allowed: ['STANDARD'], why: 'Nos primeiros 30 dias, os painéis leem a telemetria o tempo todo.', concepts: ['lc.rules'] },
      { type: 'state-at', dataset: 'telemetria', day: 60, allowed: ['STANDARD_IA', 'GLACIER_IR', 'INTELLIGENT_TIERING'], why: 'Do 2º ao 3º mês, a leitura é rara, mas ainda precisa ser imediata.', concepts: ['lc.waterfall'] },
      { type: 'state-at', dataset: 'telemetria', day: 200, allowed: ['GLACIER', 'DEEP_ARCHIVE'], why: 'Depois de 4 meses, a telemetria só é consultada em perícias — esperar horas é aceitável.', concepts: ['lc.waterfall'] },
      { type: 'kept-until', dataset: 'telemetria', day: 365, why: 'A telemetria precisa ficar guardada por 1 ano.', concepts: ['lc.expiration'] },
      { type: 'gone-by', dataset: 'telemetria', day: 400, why: 'Depois de 1 ano, a telemetria deve ser excluída (política de privacidade).', concepts: ['lc.expiration'] },
      { type: 'kept-until', dataset: 'notas', day: 730, why: 'Notas fiscais são guardadas por 5 anos por exigência legal.', concepts: ['lc.expiration'] },
      { type: 'state-at', dataset: 'notas', day: 400, allowed: ['GLACIER_IR', 'GLACIER', 'DEEP_ARCHIVE'], why: 'Notas com mais de 1 ano quase nunca são abertas: guarde-as numa classe de arquivo.', concepts: ['lc.waterfall'] },
      { type: 'kept-until', dataset: 'logs', day: 30, why: 'Os logs servem para depuração no primeiro mês.', concepts: ['lc.expiration'] },
      { type: 'gone-by', dataset: 'logs', day: 90, why: 'Logs com mais de 90 dias não têm uso e só custam.', concepts: ['lc.small-objects'] },
    ],
    solution: {
      rules: [
        rule('telemetria', { filter: { prefix: 'telemetria/' }, transitions: [{ days: 30, storageClass: 'STANDARD_IA' }, { days: 120, storageClass: 'GLACIER' }], expirationDays: 365 }),
        rule('notas', { filter: { prefix: 'notas-fiscais/' }, transitions: [{ days: 90, storageClass: 'GLACIER_IR' }, { days: 365, storageClass: 'DEEP_ARCHIVE' }] }),
        rule('logs', { filter: { prefix: 'logs/' }, expirationDays: 90 }),
      ],
    },
  },
  0.1,
)

// --- Missão 3 -------------------------------------------------------------------
const M3_DATASETS: Dataset[] = [RELATORIOS, VERSOES_ANTIGAS, UPLOADS, MARCADORES]
const M3_LAB: LifecycleLabConfig = {
  bucketName: BUCKET,
  region: REGION,
  datasets: M3_DATASETS,
  initialRules: [],
  horizonDays: 365,
  features: { noncurrent: true, mpu: true, deleteMarkers: true },
  goals: [
    { type: 'valid', why: 'Uma configuração com erro é rejeitada inteira.', concepts: ['lc.rules'] },
    { type: 'kept-until', dataset: 'relatorios', day: 365, why: 'Os relatórios atuais estão em uso: não podem ser expirados.', concepts: ['lc.expiration'] },
    { type: 'kept-until', dataset: 'versoes', day: 30, why: 'Versões antigas ficam 30 dias para recuperar erros.', concepts: ['lc.noncurrent'] },
    { type: 'gone-by', dataset: 'versoes', day: 45, why: 'Depois disso, versões antigas só custam.', concepts: ['lc.noncurrent'] },
    { type: 'gone-by', dataset: 'uploads', day: 7, why: 'Upload que não terminou em uma semana não vai terminar.', concepts: ['lc.mpu-cleanup'] },
    { type: 'gone-by', dataset: 'marcadores', day: 30, why: 'Delete markers sem versões só poluem as listagens.', concepts: ['lc.expired-delete-markers'] },
  ],
  solution: { rules: [rule('limpeza', { noncurrentExpirationDays: 30, abortMultipartDays: 7, expiredObjectDeleteMarker: true })] },
}

// --- Chefe ----------------------------------------------------------------------
const BAD_RULES: LifecycleRule[] = [
  rule('arquivar-logs', { filter: { prefix: 'logs/' }, transitions: [{ days: 30, storageClass: 'GLACIER' }] }),
  rule('telemetria', { filter: { prefix: 'telemetria/' }, transitions: [{ days: 10, storageClass: 'GLACIER_IR' }, { days: 30, storageClass: 'DEEP_ARCHIVE' }] }),
  rule('limpar-uploads', { filter: { tags: { tipo: 'telemetria' } }, abortMultipartDays: 7 }),
  rule('relatorios', { filter: { prefix: 'relatorios/' }, expirationDays: 30 }),
]

const BOSS_LAB = withCostGoal(
  {
    bucketName: BUCKET,
    region: REGION,
    datasets: [TELEMETRIA, LOGS, RELATORIOS, VERSOES_ANTIGAS, UPLOADS],
    initialRules: BAD_RULES,
    horizonDays: 730,
    features: { tags: true, size: true, noncurrent: true, mpu: true },
    goals: [
      { type: 'valid', why: 'Enquanto houver erro, o S3 rejeita a configuração inteira — nenhuma regra vale.', concepts: ['lc.rules'] },
      { type: 'state-at', dataset: 'telemetria', day: 20, allowed: ['STANDARD'], why: 'No primeiro mês, os painéis leem a telemetria o tempo todo.', concepts: ['lc.rules'] },
      { type: 'state-at', dataset: 'telemetria', day: 200, allowed: ['GLACIER', 'DEEP_ARCHIVE'], why: 'Telemetria antiga só é usada em perícias.', concepts: ['lc.min-duration-rule'] },
      { type: 'gone-by', dataset: 'logs', day: 90, why: 'Logs pequenos não transicionam: o certo é expirá-los.', concepts: ['lc.small-objects'] },
      { type: 'kept-until', dataset: 'relatorios', day: 730, why: 'Relatórios atuais não podem sumir.', concepts: ['lc.expiration'] },
      { type: 'gone-by', dataset: 'versoes', day: 60, why: 'Versões antigas dos relatórios precisam ser limpas.', concepts: ['lc.noncurrent'] },
      { type: 'gone-by', dataset: 'uploads', day: 7, why: 'Uploads incompletos precisam ser interrompidos.', concepts: ['lc.mpu-cleanup'] },
    ],
    solution: {
      rules: [
        rule('telemetria', { filter: { prefix: 'telemetria/' }, transitions: [{ days: 30, storageClass: 'GLACIER_IR' }, { days: 120, storageClass: 'DEEP_ARCHIVE' }] }),
        rule('logs', { filter: { prefix: 'logs/' }, expirationDays: 90 }),
        rule('relatorios', { filter: { prefix: 'relatorios/' }, noncurrentExpirationDays: 30 }),
        rule('limpar-uploads', { abortMultipartDays: 7 }),
      ],
    },
  },
  0.1,
)

const ACCEPT = [
  { id: 'o1', text: 'O S3 aceita a configuração', outcome: 'accepted' },
  { id: 'o2', text: 'O S3 rejeita a configuração', outcome: 'rejected' },
]

export const F06: PhaseDef = {
  id: 's3x.f06',
  order: 6,
  title: 'Lifecycle e automação',
  subtitle: 'Regras que reduzem custos sozinhas',
  summary: 'Monte políticas de ciclo de vida e simule o que acontece com objetos ao longo dos meses.',
  glyph: 'cycle',
  color: '#7be07a',
  requires: ['s3x.f02', 's3x.f05'],
  concepts: ['lc.rules', 'lc.waterfall', 'lc.min-duration-rule', 'lc.small-objects', 'lc.expiration', 'lc.noncurrent', 'lc.mpu-cleanup', 'lc.expired-delete-markers', 'lc.conflicts'],
  availability: 'available',
  estimatedMinutes: 45,
  map: { x: 560, y: 518 },
  simplifications: [
    'Cada conjunto de dados é uma coorte criada no dia 0, com padrão de acesso constante; as ações acontecem no dia exato (na AWS, a execução é assíncrona).',
    'Custos com meses de 30 dias, preços da tabela versionada (us-east-1), primeira faixa e sem nível gratuito.',
    'NewerNoncurrentVersions e regras por data são apresentados, mas não simulados.',
  ],
  missions: [
    // -----------------------------------------------------------------------
    {
      id: 's3x.f06.m1',
      title: 'Cascata de transições',
      type: 'mission',
      summary: 'Entender para onde cada classe pode ir — e o que o S3 rejeita.',
      briefing: {
        company: COMPANY,
        role: ROLE,
        situation: `O bucket \`${BUCKET}\` guarda telemetria, notas fiscais e logs — tudo no S3 Standard, para sempre. A conta só cresce. Antes de escrever regras, você quer entender o que o lifecycle permite.`,
        objective: 'Dominar a cascata de transições e as regras de validação.',
        successCriteria: ['Ordenar a cascata', 'Separar transições válidas das inválidas', 'Prever duas decisões do S3'],
      },
      intel: [
        {
          conceptId: 'lc.rules',
          body: ['Uma **regra** tem **filtro** (prefixo, tags, tamanho — combinados com AND) e **ações**: transição, expiração e limpezas. Os dias contam a partir da criação do objeto.'],
        },
        {
          conceptId: 'lc.waterfall',
          body: ['As transições só **descem** na cascata, do mais quente para o mais frio. One Zone-IA e Glacier IR só vão para Glacier Flexible ou Deep Archive; Deep Archive não vai para lugar nenhum.'],
        },
        {
          conceptId: 'lc.min-duration-rule',
          body: ['Numa mesma regra, o objeto não pode sair de uma classe antes da **duração mínima** dela. Exemplo: se a regra move o objeto para Glacier IR aos 4 dias, a ida para Deep Archive só pode acontecer a partir do dia **94** (4 + os 90 dias mínimos do Glacier IR).'],
        },
        {
          conceptId: 'lc.conflicts',
          body: ['Regras sobrepostas? O S3 escolhe o mais barato: **expiração vence transição**, a expiração mais curta vence, e Glacier Flexible vence Standard-IA no mesmo dia.'],
        },
      ],
      activities: [
        {
          id: 's3x.f06.m1.a1',
          kind: 'order',
          title: 'Do mais quente ao mais frio',
          prompt: 'Ordene as classes para formar uma sequência de transições válida numa única regra.',
          concepts: [{ id: 'lc.waterfall' }],
          xp: 40,
          difficulty: 1,
          explanation: ['A cascata desce: Standard → Standard-IA → Glacier Instant Retrieval → Glacier Flexible Retrieval → Deep Archive. Nenhuma transição volta para cima.'],
          steps: [
            { id: 's1', text: 'S3 Standard', explanation: 'Onde todo objeto começa.' },
            { id: 's2', text: 'S3 Standard-IA', explanation: 'Acesso infrequente, leitura imediata.' },
            { id: 's3', text: 'S3 Glacier Instant Retrieval', explanation: 'Arquivo com leitura imediata.' },
            { id: 's4', text: 'S3 Glacier Flexible Retrieval', explanation: 'Arquivo com restauração em minutos a horas.' },
            { id: 's5', text: 'S3 Glacier Deep Archive', explanation: 'O fim da cascata.' },
          ],
        },
        {
          id: 's3x.f06.m1.a2',
          kind: 'classify',
          title: 'Transição válida?',
          prompt: 'Classifique cada transição de lifecycle.',
          concepts: [{ id: 'lc.waterfall' }],
          xp: 50,
          difficulty: 2,
          explanation: ['Só existem transições "para baixo". Para subir de classe é preciso restaurar (se arquivado) e copiar.'],
          bins: [
            { id: 'ok', label: 'Suportada' },
            { id: 'no', label: 'Não suportada' },
          ],
          items: [
            { id: 't1', text: 'Standard → Deep Archive', bin: 'ok', explanation: 'De Standard, todas as classes da cascata são destinos válidos.', concepts: ['lc.waterfall'] },
            { id: 't2', text: 'Standard-IA → Intelligent-Tiering', bin: 'ok', explanation: 'Suportada: Intelligent-Tiering fica abaixo de Standard-IA na cascata.', concepts: ['lc.waterfall'] },
            { id: 't3', text: 'Glacier IR → Deep Archive', bin: 'ok', explanation: 'Suportada: Deep Archive fica abaixo de Glacier IR na cascata.', concepts: ['lc.waterfall'] },
            { id: 't4', text: 'Glacier Flexible → Standard-IA', bin: 'no', explanation: 'De Glacier Flexible, só para Deep Archive.', concepts: ['lc.waterfall'] },
            { id: 't5', text: 'One Zone-IA → Glacier IR', bin: 'no', explanation: 'One Zone-IA só vai para Glacier Flexible ou Deep Archive.', concepts: ['lc.waterfall'] },
            { id: 't6', text: 'Intelligent-Tiering → Standard-IA', bin: 'no', explanation: 'Intelligent-Tiering não volta para Standard-IA.', concepts: ['lc.waterfall'] },
            { id: 't7', text: 'Deep Archive → Glacier Flexible', bin: 'no', explanation: 'Deep Archive é o fim da cascata.', concepts: ['lc.waterfall'] },
          ],
        },
        {
          id: 's3x.f06.m1.a3',
          kind: 'predict',
          title: 'Rápido demais',
          prompt: 'Uma regra para `telemetria/`: Glacier Instant Retrieval aos **10** dias e Deep Archive aos **30** dias. O que acontece ao enviar a configuração?',
          concepts: [{ id: 'lc.min-duration-rule' }],
          xp: 40,
          difficulty: 2,
          explanation: ['O Glacier IR tem duração mínima de 90 dias. Na mesma regra, a transição seguinte precisa ser em 100 dias ou mais. O S3 rejeita a configuração.'],
          spec: {
            sim: 'lifecycle',
            datasets: [TELEMETRIA],
            horizonDays: 365,
            rules: [rule('telemetria', { filter: { prefix: 'telemetria/' }, transitions: [{ days: 10, storageClass: 'GLACIER_IR' }, { days: 30, storageClass: 'DEEP_ARCHIVE' }] })],
            query: { type: 'valid' },
          },
          options: ACCEPT,
        },
        {
          id: 's3x.f06.m1.a4',
          kind: 'predict',
          title: 'Duas regras, mesmo dia',
          prompt: 'Duas regras valem para a telemetria: uma move para **Standard-IA** aos 60 dias; outra, para **Glacier Flexible Retrieval** aos 60 dias. Onde a telemetria está no dia 61?',
          concepts: [{ id: 'lc.conflicts' }],
          xp: 40,
          difficulty: 3,
          explanation: ['Quando um objeto é elegível no mesmo dia para Glacier Flexible e Standard-IA, o S3 escolhe Glacier Flexible — o caminho mais barato.'],
          spec: {
            sim: 'lifecycle',
            datasets: [TELEMETRIA],
            horizonDays: 365,
            rules: [rule('ia', { filter: { prefix: 'telemetria/' }, transitions: [{ days: 60, storageClass: 'STANDARD_IA' }] }), rule('arquivo', { transitions: [{ days: 60, storageClass: 'GLACIER' }] })],
            query: { type: 'state-at', dataset: 'telemetria', day: 61 },
          },
          options: [
            { id: 'o1', text: 'S3 Standard-IA', outcome: 'STANDARD_IA' },
            { id: 'o2', text: 'S3 Glacier Flexible Retrieval', outcome: 'GLACIER' },
            { id: 'o3', text: 'S3 Standard (regras em conflito são ignoradas)', outcome: 'STANDARD' },
          ],
        },
      ],
      debrief: {
        takeaways: [
          'Transições só descem a cascata; para subir é preciso restaurar e copiar.',
          'Numa mesma regra, respeite a duração mínima da classe intermediária.',
          'Em conflitos, o S3 escolhe o caminho mais barato: expiração vence transição.',
        ],
      },
    },
    // -----------------------------------------------------------------------
    {
      id: 's3x.f06.m2',
      title: 'Storage Automation',
      type: 'mission',
      summary: 'Escrever as regras de lifecycle da RotaLog e ver o efeito na régua de dias e na conta.',
      briefing: {
        company: COMPANY,
        role: ROLE,
        situation: 'Três tipos de dado, três exigências: a telemetria é quente no primeiro mês e some em um ano; as notas fiscais ficam 5 anos; os logs servem por poucas semanas.',
        objective: 'Montar regras que atendam aos requisitos com o menor custo.',
        successCriteria: ['Configuração aceita', 'Requisitos de acesso e retenção atendidos', 'Custo do primeiro ano dentro da meta'],
      },
      intel: [
        {
          conceptId: 'lc.expiration',
          body: ['**Expiration** exclui objetos ao atingirem a idade definida. Combine transições e expiração na mesma regra quando o filtro é o mesmo.'],
        },
        {
          conceptId: 'lc.small-objects',
          body: ['Desde **setembro de 2024**, objetos **menores que 128 KB** não transicionam por padrão. Cada transição é cobrada por objeto — com milhões de arquivos pequenos, arquivar sai caro.'],
        },
      ],
      activities: [
        {
          id: 's3x.f06.m2.a1',
          kind: 'lab',
          lab: 'lifecycle',
          title: 'As regras da RotaLog',
          prompt: 'Crie as regras de lifecycle. A régua mostra onde cada conjunto de dados está em cada dia; o custo é recalculado a cada mudança.',
          concepts: [{ id: 'lc.rules' }, { id: 'lc.waterfall' }, { id: 'lc.expiration' }, { id: 'lc.small-objects' }],
          xp: 120,
          difficulty: 3,
          hints: [
            'Uma regra por prefixo: telemetria/, notas-fiscais/ e logs/.',
            'Os logs têm 20 KB em média: transicioná-los não funciona por padrão. O que eles precisam é de expiração.',
            'Atenção à duração mínima: depois de Standard-IA (30 dias) ou Glacier IR (90 dias), a próxima transição precisa respeitar esse prazo.',
          ],
          explanation: [
            'Uma solução: telemetria → Standard-IA aos 30 dias, Glacier Flexible aos 120 e expiração aos 365; notas → Glacier IR aos 90 e Deep Archive aos 365, sem expiração; logs → expiração aos 90 dias.',
            'Outras combinações também atendem — por exemplo, Glacier IR para a telemetria aos 30 dias — desde que respeitem os requisitos e a meta de custo.',
          ],
          config: M2_LAB,
        },
        {
          id: 's3x.f06.m2.a2',
          kind: 'decision',
          title: 'E se os logs precisassem ficar 5 anos?',
          prompt: 'Suponha que uma auditoria passe a exigir os logs (40 milhões de arquivos de 20 KB) por 5 anos. Qual é a melhor estratégia?',
          concepts: [{ id: 'lc.small-objects' }],
          xp: 40,
          difficulty: 3,
          explanation: ['Agrupar os logs em arquivos maiores antes de arquivar reduz o número de objetos — e, com ele, as transições cobradas, os 40 KB de overhead por objeto arquivado e o mínimo de 128 KB das classes IA.'],
          options: [
            { id: 'a', text: 'Agrupar os logs em arquivos maiores (por exemplo, um por dia) e arquivar esses arquivos.', correct: true, consequence: 'Milhões de objetos viram algumas centenas: transições e overhead deixam de dominar a conta.', impacts: { custo: 2 } },
            { id: 'b', text: 'Adicionar ObjectSizeGreaterThan = 1 byte e transicionar cada log para o Glacier Flexible.', correct: false, consequence: 'Funciona tecnicamente, mas 40 milhões de transições e 40 KB de overhead por objeto (o dobro do próprio log) tornam o arquivo mais caro do que deixar no Standard.', impacts: { custo: -2 } },
            { id: 'c', text: 'Mover tudo para Standard-IA.', correct: false, consequence: 'Cada log de 20 KB passaria a ser cobrado como 128 KB.', impacts: { custo: -2 } },
          ],
        },
      ],
      debrief: {
        takeaways: [
          'Crie uma regra por conjunto de dados, com o próprio filtro, transições e expiração.',
          'Respeite a cascata e a duração mínima da classe intermediária.',
          'Objetos pequenos: expire ou agrupe antes de arquivar.',
        ],
      },
    },
    // -----------------------------------------------------------------------
    {
      id: 's3x.f06.m3',
      title: 'Versões não atuais e lixo invisível',
      type: 'mission',
      summary: 'Limpar versões antigas, uploads incompletos e delete markers sem apagar o que está em uso.',
      briefing: {
        company: COMPANY,
        role: ROLE,
        situation: 'O bucket de relatórios tem versionamento. A listagem mostra 100 GB, mas a conta cobra vários terabytes. Ninguém entende de onde vem a diferença.',
        objective: 'Encontrar e limpar o que a listagem não mostra.',
        successCriteria: ['Prever o efeito de uma expiração em bucket versionado', 'Limpar versões antigas, uploads e marcadores', 'Manter os relatórios atuais'],
      },
      intel: [
        {
          conceptId: 'lc.noncurrent',
          body: ['**NoncurrentVersionExpiration** exclui versões não atuais N dias depois de deixarem de ser atuais. Em bucket versionado, **Expiration** só põe um delete marker na versão atual.'],
        },
        {
          conceptId: 'lc.mpu-cleanup',
          body: ['Uploads multipart incompletos guardam partes **cobradas e invisíveis** na listagem. **AbortIncompleteMultipartUpload** os interrompe após N dias. Expiration não os remove.'],
        },
        {
          conceptId: 'lc.expired-delete-markers',
          body: ['Delete markers sem versões por baixo são removidos com **ExpiredObjectDeleteMarker** (não combina com filtro por tag nem com Days na mesma Expiration).'],
        },
      ],
      activities: [
        {
          id: 's3x.f06.m3.a1',
          kind: 'predict',
          title: 'Expirar num bucket versionado',
          prompt: 'No bucket versionado, uma regra expira os relatórios aos **30 dias**. Não há regra para versões não atuais. No dia 200, o que acontece com os dados de um relatório criado no dia 0?',
          concepts: [{ id: 'lc.expiration' }, { id: 'lc.noncurrent' }],
          xp: 40,
          difficulty: 3,
          explanation: ['A expiração criou um delete marker; os dados viraram uma versão não atual — ainda no S3 Standard, ainda cobrados. Sem NoncurrentVersionExpiration, ficam lá para sempre.'],
          spec: { sim: 'lifecycle', datasets: [RELATORIOS], horizonDays: 365, rules: [rule('expirar', { filter: { prefix: 'relatorios/' }, expirationDays: 30 })], query: { type: 'state-at', dataset: 'relatorios', day: 200 } },
          options: [
            { id: 'o1', text: 'Foram excluídos no dia 30', outcome: 'gone' },
            { id: 'o2', text: 'Continuam guardados (e cobrados) no S3 Standard, como versão não atual', outcome: 'STANDARD' },
            { id: 'o3', text: 'Foram para o Glacier automaticamente', outcome: 'GLACIER' },
          ],
        },
        {
          id: 's3x.f06.m3.a2',
          kind: 'predict',
          title: 'Expiration limpa uploads?',
          prompt: 'Uma regra para todo o bucket só tem **Expiration de 30 dias**. No dia 60, onde estão as partes dos **uploads multipart incompletos**?',
          concepts: [{ id: 'lc.mpu-cleanup' }],
          xp: 30,
          difficulty: 2,
          explanation: ['Expiration não remove uploads multipart incompletos. Só AbortIncompleteMultipartUpload resolve.'],
          spec: { sim: 'lifecycle', datasets: [UPLOADS], horizonDays: 365, rules: [rule('expirar-tudo', { expirationDays: 30 })], query: { type: 'state-at', dataset: 'uploads', day: 60 } },
          options: [
            { id: 'o1', text: 'Removidas no dia 30', outcome: 'gone' },
            { id: 'o2', text: 'Continuam no S3 Standard, cobradas', outcome: 'STANDARD' },
          ],
        },
        {
          id: 's3x.f06.m3.a3',
          kind: 'lab',
          lab: 'lifecycle',
          title: 'Faxina no bucket de relatórios',
          prompt: 'Crie as regras de limpeza. Os relatórios atuais não podem ser afetados.',
          concepts: [{ id: 'lc.noncurrent' }, { id: 'lc.mpu-cleanup' }, { id: 'lc.expired-delete-markers' }],
          xp: 100,
          difficulty: 2,
          hints: ['Nada de Expiration para a versão atual: isso esconderia os relatórios em uso.', 'Uma única regra sem filtro pode ter as três ações de limpeza.'],
          explanation: ['Uma solução: uma regra para o bucket inteiro com NoncurrentVersionExpiration de 30 dias, AbortIncompleteMultipartUpload de 7 dias e ExpiredObjectDeleteMarker.'],
          config: M3_LAB,
        },
      ],
      debrief: {
        takeaways: [
          'Em bucket versionado, Expiration só põe delete markers; versões antigas exigem NoncurrentVersionExpiration.',
          'Uploads incompletos são cobrados e invisíveis: use AbortIncompleteMultipartUpload.',
          'Delete markers sem versões saem com ExpiredObjectDeleteMarker.',
        ],
      },
    },
    // -----------------------------------------------------------------------
    {
      id: 's3x.f06.boss',
      title: 'Chefe: auditoria de uma política ruim',
      type: 'boss',
      summary: 'Descobrir por que nenhuma regra está valendo, corrigir a configuração e bater a meta de custo.',
      briefing: {
        company: COMPANY,
        role: ROLE,
        situation: 'Há três meses, o time de plataforma aplicou uma configuração de lifecycle pela ferramenta de infraestrutura como código. O pipeline ficou verde. A conta não caiu nem um centavo.',
        objective: 'Encontrar a causa, corrigir a configuração e garantir a economia.',
        successCriteria: ['Apontar evidências, causa raiz e correções', 'Corrigir a configuração atendendo a todos os requisitos'],
      },
      intel: [],
      activities: [
        {
          id: 's3x.f06.boss.a1',
          kind: 'investigate',
          title: 'Por que nada mudou?',
          prompt: 'Examine a configuração, o CloudTrail e as métricas do bucket. Marque as evidências, a causa raiz e as correções.',
          concepts: [{ id: 'lc.rules' }, { id: 'lc.min-duration-rule' }, { id: 'lc.mpu-cleanup' }, { id: 'lc.expiration' }],
          xp: 90,
          difficulty: 3,
          explanation: [
            'Duas regras têm erros que o S3 recusa (Glacier IR → Deep Archive antes de 90 dias; AbortIncompleteMultipartUpload com filtro por tag). Por isso o PutBucketLifecycleConfiguration falhou e o bucket ficou sem nenhuma regra.',
            'Além disso, há erros de projeto: arquivar logs de 20 KB não acontece por padrão, e expirar relatórios num bucket versionado só cria delete markers.',
          ],
          artifacts: [
            {
              id: 'config',
              title: 'lifecycle.json (trecho)',
              format: 'code',
              lines: [
                { id: 'c1', text: '{ "ID": "arquivar-logs", "Filter": { "Prefix": "logs/" }, "Transitions": [{ "Days": 30, "StorageClass": "GLACIER" }] }', isIssue: true, explanation: 'Logs de 20 KB não transicionam por padrão — e nunca são excluídos.' },
                { id: 'c2', text: '{ "ID": "telemetria", "Transitions": [{ "Days": 10, "StorageClass": "GLACIER_IR" }, { "Days": 30, "StorageClass": "DEEP_ARCHIVE" }] }', isIssue: true, explanation: 'Glacier IR tem 90 dias de duração mínima: a próxima transição na mesma regra precisa ser em 100 dias ou mais. Erro de validação.' },
                { id: 'c3', text: '{ "ID": "limpar-uploads", "Filter": { "Tag": { "Key": "tipo", "Value": "telemetria" } }, "AbortIncompleteMultipartUpload": { "DaysAfterInitiation": 7 } }', isIssue: true, explanation: 'AbortIncompleteMultipartUpload não aceita filtro por tag. Erro de validação.' },
                { id: 'c4', text: '{ "ID": "relatorios", "Filter": { "Prefix": "relatorios/" }, "Expiration": { "Days": 30 } }', isIssue: true, explanation: 'Num bucket versionado, isso esconderia os relatórios em uso e acumularia versões não atuais.' },
              ],
            },
            {
              id: 'trail',
              title: 'CloudTrail — eventos do bucket',
              format: 'log',
              lines: [
                { id: 't1', text: 'PutBucketLifecycleConfiguration · errorCode: InvalidArgument · pipeline: plataforma-iac', isIssue: true, explanation: 'A chamada falhou: o bucket nunca recebeu a configuração.' },
                { id: 't2', text: 'GetBucketLifecycleConfiguration · errorCode: NoSuchLifecycleConfiguration', isIssue: true, explanation: 'Confirma: não há nenhuma configuração de lifecycle no bucket.' },
                { id: 't3', text: 'PutObject · telemetria/2026/10/frota-0912.parquet · 200', isIssue: false, explanation: 'Uma gravação comum, concluída sem erro.' },
              ],
            },
            {
              id: 'metrics',
              title: 'S3 Storage Lens (bucket)',
              format: 'table',
              lines: [
                { id: 'm1', text: 'Bytes em uploads multipart incompletos: 800 GB (crescendo)', isIssue: true, explanation: 'Nada interrompe os uploads incompletos.' },
                { id: 'm2', text: 'Bytes em versões não atuais: 1,9 TB (crescendo)', isIssue: true, explanation: 'Nenhuma regra limpa versões antigas.' },
                { id: 'm3', text: 'Classe de armazenamento: 100% S3 Standard', isIssue: true, explanation: 'Nenhuma transição está acontecendo.' },
                { id: 'm4', text: 'Criptografia: 100% SSE-S3', isIssue: false, explanation: 'A criptografia não tem relação com o problema investigado.' },
              ],
            },
          ],
          rootCause: {
            prompt: 'Qual é a causa raiz?',
            options: [
              { id: 'r1', text: 'A configuração tinha erros de validação, o S3 a rejeitou inteira e o bucket ficou sem nenhuma regra.', correct: true, feedback: 'Isso: o pipeline não tratou o erro da chamada, e nenhuma das quatro regras chegou a valer.' },
              { id: 'r2', text: 'O lifecycle leva meses para começar a agir.', correct: false, feedback: 'As ações são assíncronas, mas começam em dias — e o CloudTrail mostra que a configuração nem existe.' },
              { id: 'r3', text: 'A criptografia SSE-S3 impede transições.', correct: false, feedback: 'Objetos criptografados transicionam normalmente e continuam criptografados.' },
              { id: 'r4', text: 'Só a regra da telemetria falhou; as outras estão funcionando.', correct: false, feedback: 'Uma configuração com erro é rejeitada inteira: nenhuma regra vale.' },
            ],
          },
          remediations: {
            prompt: 'Quais correções aplicar? (selecione todas as adequadas)',
            options: [
              { id: 'f1', text: 'Telemetria: respeitar a duração mínima do Glacier IR (Deep Archive em 100 dias ou mais após a transição para Glacier IR).', correct: true, feedback: 'Corrige o erro de validação.' },
              { id: 'f2', text: 'Uploads: usar AbortIncompleteMultipartUpload numa regra com filtro por prefixo (ou sem filtro).', correct: true, feedback: 'Corrige o erro de validação e alcança todos os uploads.' },
              { id: 'f3', text: 'Logs: trocar a transição por expiração.', correct: true, feedback: 'Logs pequenos não transicionam; o que eles precisam é sair do bucket.' },
              { id: 'f4', text: 'Relatórios: trocar Expiration por NoncurrentVersionExpiration.', correct: true, feedback: 'Limpa as versões antigas sem esconder as atuais.' },
              { id: 'f5', text: 'Fazer o pipeline falhar quando a chamada à API retornar erro.', correct: true, feedback: 'Evita que o problema se repita em silêncio.' },
              { id: 'f6', text: 'Desabilitar o versionamento para reduzir o custo.', correct: false, feedback: 'Impossível voltar a "sem versionamento" — e suspender trocaria custo por risco de perda.' },
            ],
          },
        },
        {
          id: 's3x.f06.boss.a2',
          kind: 'lab',
          lab: 'lifecycle',
          title: 'Corrigir a configuração',
          prompt: 'Comece pelas regras com erro (veja o alerta) e depois ajuste o resto até atender a todos os requisitos e à meta de custo.',
          concepts: [{ id: 'lc.rules' }, { id: 'lc.min-duration-rule' }, { id: 'lc.small-objects' }, { id: 'lc.noncurrent' }, { id: 'lc.mpu-cleanup' }],
          xp: 130,
          difficulty: 3,
          hints: ['Enquanto houver um erro, nenhuma regra vale: a régua mostra tudo em Standard.', 'Uploads multipart incompletos não têm tags: retire o filtro por tag da regra de limpeza.'],
          explanation: [
            'Uma solução: telemetria → Glacier IR aos 30 dias e Deep Archive aos 120; logs → expiração aos 90 dias; relatórios → NoncurrentVersionExpiration de 30 dias (sem Expiration); limpeza de uploads sem filtro por tag, com 7 dias.',
          ],
          config: BOSS_LAB,
        },
      ],
      debrief: {
        takeaways: [
          'Uma configuração com erro é rejeitada inteira: confira o resultado da chamada (e o GetBucketLifecycleConfiguration).',
          'Respeite a duração mínima numa mesma regra e as restrições de filtro por tag.',
          'Em bucket versionado, limpe versões não atuais e uploads incompletos.',
        ],
      },
    },
  ],
}
