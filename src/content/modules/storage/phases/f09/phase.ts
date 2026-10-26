/** Fase 9 — Requester Pays e cenários especiais (empresa fictícia: Instituto Geodados). */
import type { PhaseDef } from '../../../../../engine/types'
import { formatUSD } from '../../../../../simulators/cost/model'
import { regionPrices } from '../../../../../simulators/cost/prices'
import type { RPLabConfig } from '../../../../../simulators/requester-pays/lab'
import type { RPBucket, RPRequest } from '../../../../../simulators/requester-pays/model'

const COMPANY = 'Instituto Geodados'
const ROLE = 'Você administra o acervo público de imagens de satélite do instituto.'
const OWNER = '246813579000'
const ORG = '246813579111'
const UNI = '369258147000'
const LAB_ACC = '147258369000'

const BUCKET: RPBucket = { name: 'geodados-imagens-satelite', requesterPays: true, ownerAccount: OWNER, orgAccounts: [ORG] }
const COMMON: RPBucket = { ...BUCKET, requesterPays: false }

const r = (id: string, label: string, p: Partial<RPRequest> & { concepts?: string[] }): RPRequest & { concepts?: string[] } => ({ id, label, principal: { kind: 'user', account: UNI, name: 'pesquisadora' }, action: 'GET', header: true, authorized: true, gb: 120, ...p })

// --- Custos (tabela versionada, us-east-1, primeira faixa) ---------------------------
const prices = regionPrices('us-east-1')
const STORAGE_TB = 80
const DOWNLOAD_TB = 300
const storageMonthly = STORAGE_TB * 1024 * prices.storageGBMonth.STANDARD
const transferMonthly = DOWNLOAD_TB * 1024 * prices.dataTransferOutPerGB

const LAB: RPLabConfig = {
  bucket: BUCKET,
  requests: [
    r('uni', 'Universidade baixa uma cena', { concepts: ['rp.basics'] }),
    r('nohdr', 'Pesquisador esquece o cabeçalho', { header: false, concepts: ['rp.header'] }),
    r('anon', 'Visitante anônimo tenta baixar', { principal: { kind: 'anonymous' }, header: false, concepts: ['rp.header'] }),
    r('role', 'Laboratório usa um papel de outra conta', { principal: { kind: 'assumed-role', roleAccount: LAB_ACC, callerAccount: UNI, name: 'leitor-geodados' }, concepts: ['rp.assumed-role'] }),
    r('owner', 'Equipe do instituto baixa sem cabeçalho', { principal: { kind: 'user', account: OWNER, name: 'analista' }, header: false, concepts: ['rp.header'] }),
    r('org403', 'Subsidiária (mesma organização) sem permissão', { principal: { kind: 'user', account: ORG, name: 'estagiario' }, authorized: false, concepts: ['rp.403'] }),
    r('restore', 'Universidade restaura uma cena arquivada', { action: 'RESTORE', gb: undefined, concepts: ['rp.403'] }),
  ],
}

const STATUS = [
  { id: 'o1', text: '200 OK', outcome: '200' },
  { id: 'o2', text: '403 AccessDenied', outcome: '403' },
]
const PAYER = [
  { id: 'o1', text: 'O dono do bucket', outcome: 'owner' },
  { id: 'o2', text: 'O requisitante', outcome: 'requester' },
  { id: 'o3', text: 'Não é cobrada do dono', outcome: 'none' },
]

export const F09: PhaseDef = {
  id: 's3x.f09',
  order: 9,
  title: 'Requester Pays e cenários especiais',
  subtitle: 'Quem paga a conta?',
  summary: 'Compartilhe um dataset gigante e entenda como a cobrança é dividida.',
  glyph: 'receipt',
  color: '#4dd6ff',
  requires: ['s3x.f02', 's3x.f03'],
  concepts: ['rp.basics', 'rp.header', 'rp.assumed-role', 'rp.403', 'rp.limits', 's3.data-transfer'],
  availability: 'available',
  estimatedMinutes: 30,
  map: { x: 560, y: 50 },
  simplifications: [
    'A autorização (IAM e bucket policy) aparece como "permite" ou "não permite".',
    'Os custos usam a primeira faixa de preço de transferência; na AWS, grandes volumes têm faixas mais baratas.',
    'A cobrança de erros 403 em buckets sem Requester Pays não é simulada.',
  ],
  missions: [
    // -----------------------------------------------------------------------
    {
      id: 's3x.f09.m1',
      title: 'Quem paga a conta?',
      type: 'mission',
      summary: 'Prever, requisição por requisição, o status e quem paga.',
      briefing: {
        company: COMPANY,
        role: ROLE,
        situation: `O instituto publica ${STORAGE_TB} TB de imagens de satélite no bucket \`${BUCKET.name}\`, com **Requester Pays** habilitado. Universidades do mundo todo baixam os dados — e cada uma reclama de uma cobrança diferente.`,
        objective: 'Entender exatamente quem paga cada parte da conta.',
        successCriteria: ['Prever duas requisições', 'Acertar status e pagador de sete requisições'],
      },
      intel: [
        {
          conceptId: 'rp.basics',
          body: ['**Requester Pays**: o requisitante paga a **requisição** e o **download**; o dono paga o **armazenamento**. A permissão de acesso continua necessária.'],
        },
        {
          conceptId: 'rp.header',
          body: ['O requisitante aceita a cobrança com `x-amz-request-payer`. **Anônimos não entram**. O dono do bucket não precisa do cabeçalho.'],
        },
        {
          conceptId: 'rp.assumed-role',
          body: ['Quando a requisição usa um **papel assumido**, a cobrança vai para a conta **dona do papel**.'],
        },
        {
          conceptId: 'rp.403',
          body: ['Quando a requisição recebe **403** e vem da própria conta ou da **organização do dono**, quem paga é o dono. Em **RestoreObject**, o requisitante paga a requisição e o dono, a **recuperação**.'],
        },
      ],
      activities: [
        {
          id: 's3x.f09.m1.a1',
          kind: 'predict',
          title: 'O visitante anônimo',
          prompt: 'Um visitante sem conta AWS tenta baixar uma imagem do bucket Requester Pays por um link direto. O que o S3 responde?',
          concepts: [{ id: 'rp.header' }],
          xp: 30,
          difficulty: 1,
          explanation: ['Requester Pays exige autenticação para saber quem paga: requisições anônimas são negadas.'],
          spec: { sim: 'requester-pays', bucket: BUCKET, request: LAB.requests[2], query: 'status' },
          options: STATUS,
        },
        {
          id: 's3x.f09.m1.a2',
          kind: 'predict',
          title: 'Papel de outra conta',
          prompt: `Uma pesquisadora (conta ${UNI}) assume o papel \`leitor-geodados\`, da conta do laboratório (${LAB_ACC}). Com esse papel, ela baixa uma cena do bucket do Instituto Geodados, que tem **Requester Pays**, enviando o cabeçalho \`x-amz-request-payer: requester\`. Quem paga a requisição?`,
          concepts: [{ id: 'rp.assumed-role' }],
          xp: 30,
          difficulty: 2,
          explanation: [`Com papel assumido, a cobrança vai para a conta dona do papel — a do laboratório (${LAB_ACC}), que é a requisitante.`],
          spec: { sim: 'requester-pays', bucket: BUCKET, request: LAB.requests[3], query: 'request-payer' },
          options: PAYER,
        },
        {
          id: 's3x.f09.m1.a3',
          kind: 'lab',
          lab: 'requester-pays',
          title: 'A planilha de cobrança',
          prompt: 'Para cada requisição, preveja a resposta do S3 e quem paga a requisição e a transferência. O simulador confere ao verificar.',
          concepts: [{ id: 'rp.basics' }, { id: 'rp.header' }, { id: 'rp.assumed-role' }, { id: 'rp.403' }],
          xp: 100,
          difficulty: 3,
          hints: ['Comece pelas negações: anônimo, sem cabeçalho, sem permissão.', 'Num 403, pergunte: a requisição veio de dentro da organização do dono?'],
          explanation: ['O requisitante paga requisição e download quando aceita a cobrança e tem permissão; o dono paga o armazenamento, as próprias requisições, os 403 vindos da própria organização e a recuperação em restaurações.'],
          config: LAB,
        },
      ],
      debrief: {
        takeaways: ['Com Requester Pays, o requisitante paga as requisições e o download; o dono continua pagando o armazenamento.', 'Quem não é o dono precisa enviar o cabeçalho que aceita a cobrança; requisições anônimas são recusadas.', 'Com um papel assumido, paga a conta dona do papel. Erros 403 vindos da conta ou da organização do dono são cobrados do dono.'],
      },
    },
    // -----------------------------------------------------------------------
    {
      id: 's3x.f09.m2',
      title: 'Compartilhando um dataset gigante',
      type: 'mission',
      summary: 'Comparar o custo de compartilhar um dataset com e sem Requester Pays.',
      briefing: {
        company: COMPANY,
        role: ROLE,
        situation: `Antes do Requester Pays, o instituto pagava tudo. As universidades baixam cerca de ${DOWNLOAD_TB} TB por mês. O conselho quer entender o efeito na conta.`,
        objective: 'Quantificar e decidir.',
        successCriteria: ['Estimar o custo de transferência', 'Escolher a estratégia de compartilhamento'],
      },
      intel: [
        {
          conceptId: 's3.data-transfer',
          body: [`Baixar dados pela internet é cobrado por GB. Na tabela usada aqui (us-east-1, primeira faixa): ${formatUSD(prices.dataTransferOutPerGB)} por GB. Armazenar 1 GB no S3 Standard: ${formatUSD(prices.storageGBMonth.STANDARD)} por mês.`],
        },
      ],
      activities: [
        {
          id: 's3x.f09.m2.a1',
          kind: 'estimate',
          title: 'A conta da transferência',
          prompt: `Se o instituto pagasse o download de ${DOWNLOAD_TB} TB por mês (1 TB = 1.024 GB), qual seria o custo mensal de transferência?`,
          concepts: [{ id: 's3.data-transfer' }],
          xp: 40,
          difficulty: 2,
          scenario: [`Preço usado: ${formatUSD(prices.dataTransferOutPerGB)} por GB (primeira faixa; volumes maiores têm faixas mais baratas).`],
          explanation: [`${DOWNLOAD_TB} × 1.024 GB × ${formatUSD(prices.dataTransferOutPerGB)} ≈ ${formatUSD(transferMonthly)} por mês — contra ${formatUSD(storageMonthly)} de armazenamento.`],
          unit: 'US$',
          min: 1000,
          max: 100000,
          step: 100,
          scale: 'log',
          answer: Math.round(transferMonthly),
          tolerance: 0.15,
        },
        {
          id: 's3x.f09.m2.a2',
          kind: 'classify',
          title: 'Quem paga o quê',
          prompt: 'Num bucket Requester Pays, com requisitantes externos que aceitam a cobrança, quem paga cada item?',
          concepts: [{ id: 'rp.basics' }, { id: 'rp.403' }],
          xp: 40,
          difficulty: 2,
          explanation: ['O dono paga armazenamento e recuperação de restaurações; o requisitante paga requisições e download.'],
          bins: [
            { id: 'owner', label: 'Dono do bucket' },
            { id: 'req', label: 'Requisitante' },
          ],
          items: [
            { id: 'p1', text: 'Armazenamento das 80 TB', bin: 'owner', explanation: 'O dono sempre paga o armazenamento.', concepts: ['rp.basics'] },
            { id: 'p2', text: 'Requisições GET das universidades', bin: 'req', explanation: 'Com Requester Pays, quem faz a requisição paga por ela.', concepts: ['rp.basics'] },
            { id: 'p3', text: 'Download (transferência) das cenas', bin: 'req', explanation: 'Quem baixa os dados paga a transferência.', concepts: ['rp.basics'] },
            { id: 'p4', text: 'Recuperação (retrieval) de uma cena restaurada a pedido de uma universidade', bin: 'owner', explanation: 'Em RestoreObject, o dono paga a recuperação.', concepts: ['rp.403'] },
            { id: 'p5', text: 'Requisição de RestoreObject da universidade', bin: 'req', explanation: 'A requisição em si é paga pelo requisitante.', concepts: ['rp.403'] },
          ],
        },
        {
          id: 's3x.f09.m2.a3',
          kind: 'decision',
          title: 'A estratégia',
          prompt: 'Todas as universidades têm conta AWS. Qual estratégia reduz a conta do instituto sem impedir o acesso?',
          concepts: [{ id: 'rp.basics' }, { id: 's3.data-transfer' }],
          xp: 40,
          difficulty: 2,
          explanation: ['Com Requester Pays, cada universidade paga o que baixa; o instituto fica só com o armazenamento.'],
          scenario: [`Instituto pagando tudo: ≈ ${formatUSD(storageMonthly + transferMonthly)}/mês. Com Requester Pays: ≈ ${formatUSD(storageMonthly)}/mês para o instituto.`],
          options: [
            { id: 'a', text: 'Manter Requester Pays e dar permissão às contas das universidades.', correct: true, consequence: `A conta do instituto cai para ≈ ${formatUSD(storageMonthly)}/mês; cada universidade paga o próprio uso.`, impacts: { custo: 2 } },
            { id: 'b', text: 'Desligar o Requester Pays e tornar o bucket público.', correct: false, consequence: `O instituto voltaria a pagar ≈ ${formatUSD(transferMonthly)}/mês de transferência — e perderia o controle de quem acessa.`, impacts: { custo: -2, seguranca: -1 } },
            { id: 'c', text: 'Copiar o dataset para um bucket em cada universidade.', correct: false, consequence: 'Cada cópia custa armazenamento e transferência; o acervo vira dezenas de cópias desatualizadas.', impacts: { custo: -1 } },
          ],
        },
      ],
      debrief: {
        takeaways: ['Em datasets muito baixados, a transferência domina a conta.', 'Requester Pays transfere esse custo a quem usa.'],
      },
    },
    // -----------------------------------------------------------------------
    {
      id: 's3x.f09.boss',
      title: 'Chefe: quando não usar Requester Pays',
      type: 'boss',
      summary: 'Separar os casos em que Requester Pays ajuda dos casos em que quebra o acesso ou a arquitetura.',
      briefing: {
        company: COMPANY,
        role: ROLE,
        situation: 'Animado com a economia, o conselho quer ligar Requester Pays em todos os buckets do instituto — inclusive no site público, no bucket de logs e na cópia de DR em outra conta.',
        objective: 'Mostrar onde Requester Pays não se aplica.',
        successCriteria: ['Classificar os buckets', 'Prever o efeito no site público', 'Escolher a alternativa para o público geral'],
      },
      intel: [
        {
          conceptId: 'rp.limits',
          body: ['Requester Pays **não serve** para público **anônimo**, não pode ser **bucket de logs** de outro bucket Requester Pays (nem o contrário) e não pode ser **destino de replicação entre contas**.'],
        },
      ],
      activities: [
        {
          id: 's3x.f09.boss.a1',
          kind: 'classify',
          title: 'Liga ou não liga?',
          prompt: 'Para cada bucket, Requester Pays é adequado?',
          concepts: [{ id: 'rp.limits' }, { id: 'rp.basics' }],
          xp: 60,
          difficulty: 3,
          explanation: ['Requester Pays funciona para requisitantes autenticados que aceitam pagar. Público anônimo, logs entre buckets Requester Pays e destino de replicação entre contas ficam de fora.'],
          bins: [
            { id: 'yes', label: 'Adequado' },
            { id: 'no', label: 'Não adequado' },
          ],
          items: [
            { id: 'b1', text: 'Acervo de imagens para universidades com conta AWS', bin: 'yes', explanation: 'É o caso para o qual o Requester Pays existe: quem tem conta AWS paga o próprio uso.', concepts: ['rp.basics'] },
            { id: 'b2', text: 'Site público do instituto, acessado por qualquer pessoa', bin: 'no', explanation: 'Visitantes anônimos seriam negados.', concepts: ['rp.limits'] },
            { id: 'b3', text: 'Bucket que recebe os logs de acesso do acervo (que é Requester Pays)', bin: 'no', explanation: 'Um bucket Requester Pays não pode ser destino de logs de outro Requester Pays, nem o contrário.', concepts: ['rp.limits'] },
            { id: 'b4', text: 'Cópia de DR em outra conta, destino da replicação', bin: 'no', explanation: 'Destinos de replicação entre contas não podem ser Requester Pays.', concepts: ['rp.limits'] },
            { id: 'b5', text: 'Dados de referência vendidos a empresas parceiras com conta AWS', bin: 'yes', explanation: 'Parceiros autenticados pagam o próprio uso.', concepts: ['rp.basics'] },
          ],
        },
        {
          id: 's3x.f09.boss.a2',
          kind: 'predict',
          title: 'O site depois da mudança',
          prompt: 'Se o bucket do site fosse convertido em Requester Pays, um visitante comum (anônimo) abrindo a página receberia o quê?',
          concepts: [{ id: 'rp.limits' }, { id: 'rp.header' }],
          xp: 30,
          difficulty: 1,
          explanation: ['Requisições anônimas são negadas em buckets Requester Pays: o site sairia do ar para o público.'],
          spec: { sim: 'requester-pays', bucket: { ...COMMON, name: 'geodados-site', requesterPays: true }, request: { id: 'site', label: 'Visitante', principal: { kind: 'anonymous' }, action: 'GET', header: false, authorized: true }, query: 'status' },
          options: STATUS,
        },
        {
          id: 's3x.f09.boss.a3',
          kind: 'decision',
          title: 'E o público geral?',
          prompt: 'O instituto também quer oferecer miniaturas das imagens ao público geral, sem conta AWS, controlando o custo de transferência. O que sugerir?',
          concepts: [{ id: 'rp.limits' }, { id: 's3.data-transfer' }],
          xp: 40,
          difficulty: 2,
          explanation: ['Para público anônimo, Requester Pays não funciona. Uma CDN como o Amazon CloudFront, com o bucket privado como origem, é o caminho usual para distribuir conteúdo e controlar o acesso (o CloudFront é tema de uma trilha futura).'],
          options: [
            { id: 'a', text: 'Distribuir as miniaturas pelo Amazon CloudFront, com o bucket privado como origem.', correct: true, consequence: 'O público acessa pela CDN; o bucket continua privado e o cache reduz as idas à origem.', impacts: { desempenho: 1, seguranca: 1 } },
            { id: 'b', text: 'Ligar Requester Pays no bucket de miniaturas.', correct: false, consequence: 'Visitantes anônimos seriam negados: o recurso não funcionaria.' },
            { id: 'c', text: 'Enviar as chaves de acesso do instituto para quem quiser baixar.', correct: false, consequence: 'Nunca compartilhe credenciais.', impacts: { seguranca: -2 } },
          ],
        },
      ],
      debrief: {
        takeaways: ['Requester Pays exige requisitantes autenticados.', 'Não use em buckets públicos, em logs entre buckets Requester Pays nem em destinos de replicação entre contas.'],
      },
    },
  ],
}
