/** Fase 8 — Eventos e integração (empresa fictícia: Feira Digital). */
import type { PhaseDef } from '../../../../../engine/types'
import type { EventsLabConfig } from '../../../../../simulators/events/lab'
import type { Destination, EventsConfig, S3Event } from '../../../../../simulators/events/model'

const COMPANY = 'Feira Digital'
const ROLE = 'Você é a pessoa de arquitetura do marketplace.'
const BUCKET = 'feiradigital-midia'

const D = {
  thumb: { id: 'thumb', kind: 'lambda', name: 'gerar-miniatura', allowsS3: true, writes: { prefix: 'thumbnails/' } },
  thumbImg: { id: 'thumb', kind: 'lambda', name: 'gerar-miniatura', allowsS3: true, writes: { prefix: 'imagens/thumbnails/' } },
  sns: { id: 'sns', kind: 'sns', name: 'pedidos-novos', allowsS3: true, subscribers: ['estoque', 'fatura', 'email'] },
  estoque: { id: 'estoque', kind: 'sqs', name: 'fila-estoque', allowsS3: true },
  fatura: { id: 'fatura', kind: 'sqs', name: 'fila-faturamento', allowsS3: true },
  email: { id: 'email', kind: 'lambda', name: 'enviar-confirmacao', allowsS3: true },
  fifo: { id: 'fifo', kind: 'sqs-fifo', name: 'notas-fiscais.fifo', allowsS3: true },
} satisfies Record<string, Destination>

const EV = {
  jpg: { id: 'jpg', label: 'Foto de produto enviada', type: 'ObjectCreated:Put', key: 'uploads/produto-123.jpg' },
  pdf: { id: 'pdf', label: 'Manual em PDF enviado', type: 'ObjectCreated:Put', key: 'uploads/manual-123.pdf' },
  pedido: { id: 'pedido', label: 'Pedido recebido', type: 'ObjectCreated:Put', key: 'pedidos/2026/p-881.json' },
  nfe: { id: 'nfe', label: 'Nota fiscal emitida', type: 'ObjectCreated:Put', key: 'notas/2026/nfe-551.xml' },
  original: { id: 'original', label: 'Foto original enviada', type: 'ObjectCreated:Put', key: 'imagens/originais/produto-9.jpg' },
} satisfies Record<string, S3Event>

const cfg = (p: Partial<EventsConfig>): EventsConfig => ({ notifications: [], eventBridge: false, ebRules: [], ...p })
const perms = (ds: Destination[]) => Object.fromEntries(ds.map((d) => [d.id, d.allowsS3]))

const M1_LAB: EventsLabConfig = {
  bucketName: BUCKET,
  destinations: [D.thumb],
  events: [EV.jpg, EV.pdf],
  initial: cfg({ notifications: [{ id: 'miniaturas', events: ['ObjectCreated:*'], destination: 'thumb' }] }),
  goals: [
    { type: 'valid', why: 'A configuração precisa ser aceita pelo S3.', concepts: ['ev.notifications'] },
    { type: 'delivered', event: 'jpg', destination: 'thumb', why: 'Toda foto de produto precisa de miniatura.', concepts: ['ev.notifications'] },
    { type: 'not-delivered', event: 'pdf', destination: 'thumb', why: 'PDFs não têm miniatura: invocar a função para eles é desperdício.', concepts: ['ev.notifications'] },
    { type: 'no-loop', why: 'A função grava as miniaturas no mesmo bucket: ela não pode disparar a si mesma.', concepts: ['ev.recursion'] },
  ],
  solution: { config: cfg({ notifications: [{ id: 'miniaturas', events: ['ObjectCreated:*'], prefix: 'uploads/', suffix: '.jpg', destination: 'thumb' }] }), permissions: perms([D.thumb]) },
}

const M2_DESTS = [D.sns, D.estoque, D.fatura, D.email, D.fifo]
const M2_LAB: EventsLabConfig = {
  bucketName: BUCKET,
  destinations: M2_DESTS,
  events: [EV.pedido, EV.nfe],
  allowEventBridge: true,
  initial: cfg({
    notifications: [
      { id: 'estoque', events: ['ObjectCreated:*'], prefix: 'pedidos/', destination: 'estoque' },
      { id: 'faturamento', events: ['ObjectCreated:*'], prefix: 'pedidos/', destination: 'fatura' },
    ],
  }),
  goals: [
    { type: 'valid', why: 'Uma configuração com filtros sobrepostos é recusada inteira.', concepts: ['ev.filter-overlap'] },
    { type: 'delivered', event: 'pedido', destination: 'estoque', why: 'O estoque precisa reservar os itens.', concepts: ['ev.fanout'] },
    { type: 'delivered', event: 'pedido', destination: 'fatura', why: 'O faturamento precisa cobrar o pedido.', concepts: ['ev.fanout'] },
    { type: 'delivered', event: 'pedido', destination: 'email', why: 'O cliente recebe a confirmação por e-mail.', concepts: ['ev.fanout'] },
    { type: 'delivered', event: 'nfe', destination: 'fifo', why: 'Notas fiscais precisam ser processadas em ordem, numa fila FIFO.', concepts: ['ev.eventbridge'] },
  ],
  solution: {
    config: cfg({
      notifications: [{ id: 'pedidos', events: ['ObjectCreated:*'], prefix: 'pedidos/', destination: 'sns' }],
      eventBridge: true,
      ebRules: [{ id: 'notas-fiscais', eventType: 'created', prefix: 'notas/', suffix: '.xml', targets: ['fifo'] }],
    }),
    permissions: perms(M2_DESTS),
  },
}

const BOSS_DESTS = [D.thumbImg, D.sns, D.estoque, D.fatura, D.email]
const BOSS_LAB: EventsLabConfig = {
  bucketName: BUCKET,
  destinations: BOSS_DESTS,
  events: [EV.original, EV.pedido],
  initial: cfg({
    notifications: [
      { id: 'miniaturas', events: ['ObjectCreated:*'], prefix: 'imagens/', destination: 'thumb' },
      { id: 'pedidos', events: ['ObjectCreated:*'], prefix: 'pedidos/', destination: 'estoque' },
    ],
  }),
  goals: [
    { type: 'valid', why: 'A configuração precisa continuar válida.', concepts: ['ev.notifications'] },
    { type: 'delivered', event: 'original', destination: 'thumb', why: 'As miniaturas continuam sendo geradas.', concepts: ['ev.notifications'] },
    { type: 'no-loop', why: 'A função grava em imagens/thumbnails/: o gatilho não pode cobrir essa pasta.', concepts: ['ev.recursion'] },
    { type: 'delivered', event: 'pedido', destination: 'estoque', why: 'O estoque continua recebendo os pedidos.', concepts: ['ev.fanout'] },
    { type: 'delivered', event: 'pedido', destination: 'fatura', why: 'Na Black Friday, o faturamento ficou sem receber os pedidos.', concepts: ['ev.fanout'] },
    { type: 'delivered', event: 'pedido', destination: 'email', why: 'Clientes ficaram sem confirmação.', concepts: ['ev.fanout'] },
  ],
  solution: {
    config: cfg({
      notifications: [
        { id: 'miniaturas', events: ['ObjectCreated:*'], prefix: 'imagens/originais/', destination: 'thumb' },
        { id: 'pedidos', events: ['ObjectCreated:*'], prefix: 'pedidos/', destination: 'sns' },
      ],
    }),
    permissions: perms(BOSS_DESTS),
  },
}

const YES_NO = [
  { id: 'o1', text: 'Sim', outcome: 'yes' },
  { id: 'o2', text: 'Não', outcome: 'no' },
]

export const F08: PhaseDef = {
  id: 's3x.f08',
  order: 8,
  title: 'Eventos e integração',
  subtitle: 'Lambda, SQS, SNS e EventBridge',
  summary: 'Construa um fluxo orientado a eventos e observe cada evento percorrer a arquitetura.',
  glyph: 'bolt',
  color: '#ffd84d',
  requires: ['s3x.f01', 's3x.f03'],
  concepts: ['ev.notifications', 'ev.destination-permissions', 'ev.filter-overlap', 'ev.fanout', 'ev.eventbridge', 'ev.at-least-once', 'ev.recursion'],
  availability: 'available',
  estimatedMinutes: 45,
  map: { x: 560, y: 212 },
  simplifications: [
    'Cada evento é entregue uma vez e na hora; na AWS, a entrega é "pelo menos uma vez", em geral em segundos, e duplicatas acontecem.',
    'Com o EventBridge habilitado, todos os eventos do bucket vão para o barramento padrão; as permissões dos alvos do EventBridge não são simuladas.',
    'Apenas eventos de criação e remoção de objetos são simulados.',
  ],
  missions: [
    // -----------------------------------------------------------------------
    {
      id: 's3x.f08.m1',
      title: 'Quando um objeto chega',
      type: 'mission',
      summary: 'Disparar uma função a cada foto enviada — sem desperdício e sem loop.',
      briefing: {
        company: COMPANY,
        role: ROLE,
        situation: `Vendedores enviam fotos de produtos para \`${BUCKET}\`. Uma função Lambda gera miniaturas e as grava em \`thumbnails/\`, **no mesmo bucket**. Um colega já criou o gatilho — e a conta da Lambda começou a subir de forma estranha.`,
        objective: 'Configurar o gatilho certo.',
        successCriteria: ['Saber quais destinos são aceitos', 'Prever a validação e o loop', 'Configurar filtro e destino'],
      },
      intel: [
        {
          conceptId: 'ev.notifications',
          body: ['O bucket publica eventos para **SNS, SQS, Lambda** ou **EventBridge**, com filtros de **prefixo** e **sufixo**. Filas **SQS FIFO** não são destino direto — passe pelo EventBridge.'],
        },
        {
          conceptId: 'ev.destination-permissions',
          body: ['O destino precisa permitir o S3: política da fila ou do tópico, ou permissão de invocação da Lambda. Sem isso, a configuração é recusada.'],
        },
        {
          conceptId: 'ev.recursion',
          body: ['Função disparada por uploads que grava no **mesmo bucket**, sob o mesmo filtro, dispara a si mesma — **loop recursivo**. Use outro bucket ou um prefixo de entrada exclusivo.'],
        },
      ],
      activities: [
        {
          id: 's3x.f08.m1.a1',
          kind: 'classify',
          title: 'Destino direto?',
          prompt: 'Quais serviços podem ser configurados como destino direto de uma notificação do S3?',
          concepts: [{ id: 'ev.notifications' }],
          xp: 40,
          difficulty: 1,
          explanation: ['Destinos diretos: SNS, SQS (standard), Lambda e EventBridge. O resto passa pelo EventBridge (ou por uma Lambda).'],
          bins: [
            { id: 'yes', label: 'Destino direto' },
            { id: 'no', label: 'Não é destino direto' },
          ],
          items: [
            { id: 'd1', text: 'Tópico Amazon SNS', bin: 'yes', explanation: 'Suportado: o S3 publica eventos direto num tópico SNS.', concepts: ['ev.notifications'] },
            { id: 'd2', text: 'Fila Amazon SQS standard', bin: 'yes', explanation: 'Suportada: filas SQS standard recebem eventos direto do S3.', concepts: ['ev.notifications'] },
            { id: 'd3', text: 'Função AWS Lambda', bin: 'yes', explanation: 'Suportada: o S3 pode invocar a função diretamente.', concepts: ['ev.notifications'] },
            { id: 'd4', text: 'Amazon EventBridge', bin: 'yes', explanation: 'Habilitado no bucket, recebe os eventos.', concepts: ['ev.eventbridge'] },
            { id: 'd5', text: 'Fila Amazon SQS FIFO', bin: 'no', explanation: 'FIFO não é aceita: use o EventBridge.', concepts: ['ev.notifications'] },
            { id: 'd6', text: 'Máquina de estados AWS Step Functions', bin: 'no', explanation: 'Não é destino direto; o EventBridge pode iniciá-la.', concepts: ['ev.eventbridge'] },
          ],
        },
        {
          id: 's3x.f08.m1.a2',
          kind: 'predict',
          title: 'Direto na fila FIFO',
          prompt: 'Alguém tenta configurar uma notificação `ObjectCreated:*` com destino na fila `notas-fiscais.fifo`. O S3 aceita?',
          concepts: [{ id: 'ev.notifications' }, { id: 'ev.destination-permissions' }],
          xp: 30,
          difficulty: 1,
          explanation: ['Filas SQS FIFO não são aceitas como destino de Event Notifications. A alternativa é uma regra do EventBridge com a fila FIFO como alvo.'],
          spec: { sim: 'events', config: cfg({ notifications: [{ id: 'nfe', events: ['ObjectCreated:*'], destination: 'fifo' }] }), destinations: [D.fifo], event: EV.nfe, query: { type: 'valid' } },
          options: [
            { id: 'o1', text: 'Aceita', outcome: 'accepted' },
            { id: 'o2', text: 'Recusa', outcome: 'rejected' },
          ],
        },
        {
          id: 's3x.f08.m1.a3',
          kind: 'predict',
          title: 'O gatilho do colega',
          prompt: 'O gatilho atual: `ObjectCreated:*`, **sem filtro**, para `gerar-miniatura` — que grava `thumbnails/…` no mesmo bucket. Ao enviar `uploads/produto-123.jpg`, há loop?',
          concepts: [{ id: 'ev.recursion' }],
          xp: 30,
          difficulty: 2,
          explanation: ['A miniatura gravada em thumbnails/ também é um ObjectCreated sem filtro: a função é disparada de novo, e de novo.'],
          spec: { sim: 'events', config: M1_LAB.initial, destinations: [D.thumb], event: EV.jpg, query: { type: 'loop' } },
          options: YES_NO,
        },
        {
          id: 's3x.f08.m1.a4',
          kind: 'lab',
          lab: 'events',
          title: 'O gatilho certo',
          prompt: 'Ajuste a notificação. O fluxo à direita mostra o que cada upload dispara.',
          concepts: [{ id: 'ev.notifications' }, { id: 'ev.recursion' }],
          xp: 80,
          difficulty: 2,
          hints: ['Filtre pelo prefixo de entrada (uploads/).', 'Um sufixo evita invocar a função para PDFs.'],
          explanation: ['Solução: prefixo uploads/ e sufixo .jpg. As miniaturas, gravadas em thumbnails/, ficam fora do gatilho.'],
          config: M1_LAB,
        },
      ],
      debrief: {
        takeaways: ['O S3 envia eventos diretamente para SNS, SQS standard, Lambda e EventBridge.', 'Filtre por prefixo e sufixo para invocar só o necessário.', 'Nunca deixe a saída de uma função cair no próprio gatilho.'],
      },
    },
    // -----------------------------------------------------------------------
    {
      id: 's3x.f08.m2',
      title: 'Event-Driven Architecture',
      type: 'mission',
      summary: 'Levar um pedido a três consumidores e as notas fiscais a uma fila FIFO.',
      briefing: {
        company: COMPANY,
        role: ROLE,
        situation: 'Cada pedido chega como um JSON em `pedidos/`. Estoque, faturamento e e-mail precisam reagir. As notas fiscais, em `notas/`, precisam ser processadas em ordem.',
        objective: 'Montar o fluxo de eventos sem acoplar os consumidores.',
        successCriteria: ['Configuração aceita', 'Três consumidores para cada pedido', 'Notas na fila FIFO'],
      },
      intel: [
        {
          conceptId: 'ev.filter-overlap',
          body: ['Para os **mesmos tipos de evento**, notificações não podem ter filtros sobrepostos — duas notificações em `pedidos/` são recusadas. Vários consumidores? **Fan-out**.'],
        },
        {
          conceptId: 'ev.fanout',
          body: ['**Fan-out**: o evento vai a um tópico **SNS**, que entrega uma cópia a cada assinante (filas SQS, Lambda). Cada consumidor processa no próprio ritmo.'],
        },
        {
          conceptId: 'ev.eventbridge',
          body: ['O **EventBridge** recebe os eventos do bucket e os roteia por regras para muitos alvos — inclusive **filas SQS FIFO**.'],
        },
      ],
      activities: [
        {
          id: 's3x.f08.m2.a1',
          kind: 'lab',
          lab: 'events',
          title: 'Pedidos e notas fiscais',
          prompt: 'Corrija a configuração para atender aos quatro consumidores.',
          concepts: [{ id: 'ev.filter-overlap' }, { id: 'ev.fanout' }, { id: 'ev.eventbridge' }],
          xp: 110,
          difficulty: 3,
          hints: ['Duas notificações em pedidos/ se sobrepõem. Use uma só, apontando para o tópico SNS.', 'A fila FIFO só é alcançável pelo EventBridge.'],
          explanation: ['Solução: uma notificação pedidos/ → tópico pedidos-novos (fan-out para as filas e a função) e o EventBridge habilitado, com uma regra para notas/*.xml cujo alvo é a fila FIFO.'],
          config: M2_LAB,
        },
        {
          id: 's3x.f08.m2.a2',
          kind: 'decision',
          title: 'Por que o tópico no meio?',
          prompt: 'Um desenvolvedor pergunta por que não chamar estoque, faturamento e e-mail direto de uma única Lambda. Qual é a melhor resposta?',
          concepts: [{ id: 'ev.fanout' }],
          xp: 30,
          difficulty: 2,
          explanation: ['Com fan-out, cada consumidor tem a própria fila: se o faturamento cair, os pedidos esperam na fila dele sem atrasar o estoque nem o e-mail.'],
          options: [
            { id: 'a', text: 'Com SNS e filas, cada consumidor é independente: falhas e lentidão de um não afetam os outros, e as mensagens esperam na fila.', correct: true, consequence: 'Arquitetura desacoplada e resiliente a picos e falhas parciais.', impacts: { disponibilidade: 2 } },
            { id: 'b', text: 'Porque o S3 não consegue invocar Lambda.', correct: false, consequence: 'Consegue: Lambda é um destino direto.' },
            { id: 'c', text: 'Porque SNS garante entrega exatamente uma vez.', correct: false, consequence: 'Não garante: os consumidores precisam lidar com duplicatas.' },
          ],
        },
      ],
      debrief: {
        takeaways: ['Mesmo evento, vários consumidores: fan-out com SNS (ou EventBridge), não notificações sobrepostas.', 'Para entregar eventos a uma fila FIFO, passe pelo EventBridge.', 'Filas entre produtor e consumidor absorvem falhas e picos.'],
      },
    },
    // -----------------------------------------------------------------------
    {
      id: 's3x.f08.m3',
      title: 'Duplicados, ordem e idempotência',
      type: 'mission',
      summary: 'Projetar consumidores que suportam eventos repetidos e fora de ordem.',
      briefing: {
        company: COMPANY,
        role: ROLE,
        situation: 'O time de faturamento relata que, raramente, um pedido foi cobrado duas vezes — e que um índice de produtos às vezes mostra uma foto antiga.',
        objective: 'Entender as garantias de entrega e corrigir o projeto dos consumidores.',
        successCriteria: ['Separar fatos de mitos', 'Ordenar os passos de um consumidor idempotente', 'Escolher a chave de deduplicação'],
      },
      intel: [
        {
          conceptId: 'ev.at-least-once',
          body: [
            'Eventos do S3 chegam **pelo menos uma vez** — podem vir **duplicados** — e **sem ordem garantida**.',
            'A chave **sequencer** permite ordenar eventos de uma **mesma key** (o maior é o mais recente). Ela não ordena keys diferentes.',
          ],
        },
      ],
      activities: [
        {
          id: 's3x.f08.m3.a1',
          kind: 'classify',
          title: 'Fato ou mito?',
          prompt: 'Classifique cada afirmação sobre as notificações do S3.',
          concepts: [{ id: 'ev.at-least-once' }],
          xp: 50,
          difficulty: 2,
          explanation: ['Entrega pelo menos uma vez, em geral em segundos, sem ordem garantida; o sequencer ordena eventos da mesma key.'],
          bins: [
            { id: 'fact', label: 'Fato' },
            { id: 'myth', label: 'Mito' },
          ],
          items: [
            { id: 'f1', text: 'Um mesmo evento pode ser entregue mais de uma vez.', bin: 'fact', explanation: 'A entrega é "pelo menos uma vez".', concepts: ['ev.at-least-once'] },
            { id: 'f2', text: 'Em geral, os eventos chegam em segundos, mas podem levar um minuto ou mais.', bin: 'fact', explanation: 'Fato: é o prazo típico de entrega descrito na documentação do S3.', concepts: ['ev.at-least-once'] },
            { id: 'f3', text: 'O sequencer ordena eventos de uma mesma key.', bin: 'fact', explanation: 'O maior sequencer é o evento mais recente daquela key.', concepts: ['ev.at-least-once'] },
            { id: 'f4', text: 'Os eventos sempre chegam na ordem em que aconteceram.', bin: 'myth', explanation: 'A ordem não é garantida.', concepts: ['ev.at-least-once'] },
            { id: 'f5', text: 'O sequencer ordena eventos de keys diferentes.', bin: 'myth', explanation: 'Só vale para a mesma key.', concepts: ['ev.at-least-once'] },
            { id: 'f6', text: 'Com SNS no meio, cada evento é entregue exatamente uma vez.', bin: 'myth', explanation: 'Duplicatas continuam possíveis; o consumidor precisa ser idempotente.', concepts: ['ev.fanout'] },
          ],
        },
        {
          id: 's3x.f08.m3.a2',
          kind: 'order',
          title: 'Consumidor idempotente',
          prompt: 'Ordene os passos de um consumidor de faturamento que não cobra duas vezes e não aplica eventos antigos por cima de novos.',
          concepts: [{ id: 'ev.at-least-once' }],
          xp: 40,
          difficulty: 3,
          explanation: ['Leia a mensagem, monte a chave do evento, consulte o registro, descarte duplicatas e eventos mais antigos, processe e só então registre — e apague a mensagem da fila.'],
          steps: [
            { id: 's1', text: 'Receber a mensagem da fila', explanation: 'Tudo começa ao receber a mensagem da fila.' },
            { id: 's2', text: 'Extrair bucket, key, versionId e sequencer', explanation: 'Identificam o evento de forma única.' },
            { id: 's3', text: 'Consultar o registro de eventos já processados para essa key', explanation: 'Detecta duplicatas e eventos fora de ordem.' },
            { id: 's4', text: 'Descartar se for duplicado ou se o sequencer for menor que o registrado', explanation: 'Evita cobrar duas vezes ou voltar no tempo.' },
            { id: 's5', text: 'Processar a cobrança', explanation: 'Só eventos novos chegam aqui.' },
            { id: 's6', text: 'Registrar o sequencer processado e apagar a mensagem da fila', explanation: 'Fecha o ciclo; se falhar antes disso, a mensagem volta e o registro evita a duplicata.' },
          ],
        },
        {
          id: 's3x.f08.m3.a3',
          kind: 'decision',
          title: 'A chave de deduplicação',
          prompt: 'Num bucket versionado, qual combinação identifica de forma confiável "o mesmo evento de objeto" para deduplicar?',
          concepts: [{ id: 'ev.at-least-once' }],
          xp: 30,
          difficulty: 3,
          explanation: ['Bucket + key + versionId identificam a versão; o sequencer ordena eventos dessa key. O horário de chegada e o nome do arquivo sozinhos não bastam.'],
          options: [
            { id: 'a', text: 'Bucket + key + versionId (e o sequencer para a ordem)', correct: true, consequence: 'Duplicatas da mesma gravação são descartadas; gravações novas da mesma key são reconhecidas como novas.', impacts: { durabilidade: 1 } },
            { id: 'b', text: 'Só a key do objeto', correct: false, consequence: 'Uma nova versão legítima da mesma key seria descartada como duplicata.' },
            { id: 'c', text: 'O horário em que a mensagem chegou', correct: false, consequence: 'Duplicatas chegam em horários diferentes; a ordem de chegada não é garantida.' },
          ],
        },
      ],
      debrief: {
        takeaways: ['Eventos podem vir duplicados e fora de ordem.', 'Consumidores idempotentes registram key, versionId e sequencer.', 'O sequencer só ordena eventos da mesma key.'],
      },
    },
    // -----------------------------------------------------------------------
    {
      id: 's3x.f08.boss',
      title: 'Chefe: pico de Black Friday',
      type: 'boss',
      summary: 'Investigar uma pane de eventos no pico de vendas, corrigir a configuração e preparar a arquitetura para o próximo pico.',
      briefing: {
        company: COMPANY,
        role: ROLE,
        situation: 'Black Friday: em uma hora, a função de miniaturas foi invocada milhões de vezes, as contas de Lambda explodiram e clientes reclamaram de pedidos sem confirmação e sem nota.',
        objective: 'Encontrar a causa, corrigir o fluxo e evitar a repetição.',
        successCriteria: ['Apontar evidências, causa raiz e correções', 'Corrigir a configuração', 'Escolher como absorver o próximo pico'],
      },
      intel: [],
      activities: [
        {
          id: 's3x.f08.boss.a1',
          kind: 'investigate',
          title: 'O que aconteceu às 21h?',
          prompt: 'Examine a configuração, os logs da função e as métricas. Marque as evidências, a causa raiz e as correções.',
          concepts: [{ id: 'ev.recursion' }, { id: 'ev.fanout' }],
          xp: 90,
          difficulty: 3,
          explanation: [
            'O gatilho de miniaturas cobre imagens/, e a função grava em imagens/thumbnails/: cada miniatura dispara a função de novo — loop recursivo.',
            'Separadamente, os pedidos iam só para a fila de estoque: faturamento e e-mail nunca receberam os eventos.',
          ],
          artifacts: [
            {
              id: 'config',
              title: `Notificações de ${BUCKET}`,
              format: 'code',
              lines: [
                { id: 'c1', text: '{ "Id": "miniaturas", "Events": ["s3:ObjectCreated:*"], "Prefix": "imagens/", "Lambda": "gerar-miniatura" }', isIssue: true, explanation: 'O prefixo cobre também imagens/thumbnails/, onde a função grava.' },
                { id: 'c2', text: '{ "Id": "pedidos", "Events": ["s3:ObjectCreated:*"], "Prefix": "pedidos/", "Queue": "fila-estoque" }', isIssue: true, explanation: 'Só o estoque recebe os pedidos.' },
              ],
            },
            {
              id: 'logs',
              title: 'Logs de gerar-miniatura',
              format: 'log',
              lines: [
                { id: 'l1', text: 'input: imagens/originais/produto-9.jpg → output: imagens/thumbnails/produto-9.jpg', isIssue: false, explanation: 'Invocação esperada.' },
                { id: 'l2', text: 'input: imagens/thumbnails/produto-9.jpg → output: imagens/thumbnails/produto-9.jpg', isIssue: true, explanation: 'A função foi disparada pela própria saída.' },
                { id: 'l3', text: 'input: imagens/thumbnails/produto-9.jpg → output: imagens/thumbnails/produto-9.jpg', isIssue: true, explanation: 'E de novo: o loop não para sozinho.' },
              ],
            },
            {
              id: 'metrics',
              title: 'Métricas',
              format: 'table',
              lines: [
                { id: 'm1', text: 'Lambda gerar-miniatura: 4,2 milhões de invocações em 1 hora', isIssue: true, explanation: 'Muito acima do número de fotos enviadas.' },
                { id: 'm2', text: 'fila-faturamento: 0 mensagens recebidas', isIssue: true, explanation: 'Nada chega ao faturamento.' },
                { id: 'm3', text: 'Bucket: 18 mil fotos originais enviadas', isIssue: false, explanation: 'O volume real de entrada.' },
              ],
            },
          ],
          rootCause: {
            prompt: 'Qual é a causa raiz da explosão de invocações?',
            options: [
              { id: 'r1', text: 'O gatilho da função cobre a pasta onde ela grava a saída: loop recursivo.', correct: true, feedback: 'Isso: cada miniatura gravada dispara uma nova invocação.' },
              { id: 'r2', text: 'O S3 entregou cada evento milhares de vezes.', correct: false, feedback: 'Duplicatas existem, mas raramente. O log mostra a função consumindo a própria saída.' },
              { id: 'r3', text: 'A Black Friday triplicou o número de fotos.', correct: false, feedback: 'Foram 18 mil fotos para 4,2 milhões de invocações.' },
              { id: 'r4', text: 'Faltou permissão de invocação para a Lambda.', correct: false, feedback: 'Sem permissão, a função não seria invocada nenhuma vez.' },
            ],
          },
          remediations: {
            prompt: 'Quais correções aplicar? (selecione todas as adequadas)',
            options: [
              { id: 'f1', text: 'Restringir o gatilho a imagens/originais/ (ou gravar as miniaturas em outro bucket).', correct: true, feedback: 'A saída deixa de disparar a função.' },
              { id: 'f2', text: 'Enviar os pedidos a um tópico SNS com fan-out para estoque, faturamento e e-mail.', correct: true, feedback: 'Todos os consumidores passam a receber os pedidos.' },
              { id: 'f3', text: 'Criar três notificações em pedidos/, uma para cada consumidor.', correct: false, feedback: 'Filtros sobrepostos para os mesmos eventos são recusados.' },
              { id: 'f4', text: 'Desligar as notificações durante picos de venda.', correct: false, feedback: 'Os consumidores parariam de funcionar justamente no pico.' },
            ],
          },
        },
        {
          id: 's3x.f08.boss.a2',
          kind: 'lab',
          lab: 'events',
          title: 'Corrigir o fluxo',
          prompt: 'Corrija as notificações: miniaturas sem loop e pedidos para os três consumidores.',
          concepts: [{ id: 'ev.recursion' }, { id: 'ev.fanout' }],
          xp: 110,
          difficulty: 3,
          hints: ['A função grava em imagens/thumbnails/.', 'O tópico pedidos-novos já tem os três assinantes.'],
          explanation: ['Solução: gatilho de miniaturas em imagens/originais/ e notificação de pedidos/ para o tópico pedidos-novos.'],
          config: BOSS_LAB,
        },
        {
          id: 's3x.f08.boss.a3',
          kind: 'decision',
          title: 'O próximo pico',
          prompt: 'No próximo pico, a função de miniaturas pode ser limitada (throttling). Como evitar perder eventos e proteger os sistemas a jusante?',
          concepts: [{ id: 'ev.fanout' }, { id: 'ev.at-least-once' }],
          xp: 40,
          difficulty: 3,
          explanation: ['Uma fila SQS entre o S3 e a função absorve o pico; a Lambda consome no ritmo que aguenta, com novas tentativas. Consumidores idempotentes lidam com as duplicatas.'],
          options: [
            { id: 'a', text: 'Notificação para uma fila SQS e a Lambda consumindo da fila, com consumidores idempotentes.', correct: true, consequence: 'Picos viram fila, não perda; mensagens com falha voltam para nova tentativa.', impacts: { disponibilidade: 2, desempenho: 1 } },
            { id: 'b', text: 'Aumentar a memória da Lambda.', correct: false, consequence: 'Pode acelerar cada execução, mas não resolve o throttling nem garante novas tentativas organizadas.' },
            { id: 'c', text: 'Processar as fotos uma vez por dia com um script.', correct: false, consequence: 'Produtos ficariam horas sem miniatura.' },
          ],
        },
      ],
      debrief: {
        takeaways: ['A saída de uma função nunca pode cair no próprio gatilho.', 'Para vários consumidores, use fan-out; para aguentar picos, ponha uma fila entre o evento e o processamento.', 'Idempotência é obrigatória com entrega "pelo menos uma vez".'],
      },
    },
  ],
}
