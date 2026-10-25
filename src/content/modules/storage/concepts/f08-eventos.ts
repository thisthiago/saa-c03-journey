/**
 * Conceitos da Fase 8 — Eventos e integração.
 * Fatos conferidos em 16/10/2026 (ver docs/VERIFICACAO-DE-CONTEUDO.md).
 */
import type { ConceptDef } from '../../../../engine/types'

const EN = { title: 'Amazon S3 Event Notifications', url: 'https://docs.aws.amazon.com/AmazonS3/latest/userguide/EventNotifications.html' }
const TYPES = { title: 'Event notification types and destinations', url: 'https://docs.aws.amazon.com/AmazonS3/latest/userguide/notification-how-to-event-types-and-destinations.html' }
const FILTER = { title: 'Configuring event notifications using object key name filtering', url: 'https://docs.aws.amazon.com/AmazonS3/latest/userguide/notification-how-to-filtering.html' }
const EB = { title: 'Using EventBridge', url: 'https://docs.aws.amazon.com/AmazonS3/latest/userguide/EventBridge.html' }
const MSG = { title: 'Event message structure', url: 'https://docs.aws.amazon.com/AmazonS3/latest/userguide/notification-content-structure.html' }
const LAMBDA = { title: 'Using AWS Lambda with Amazon S3', url: 'https://docs.aws.amazon.com/lambda/latest/dg/with-s3.html' }

export const F08_CONCEPTS: ConceptDef[] = [
  {
    id: 'ev.notifications',
    title: 'S3 Event Notifications',
    officialName: 'Amazon S3 Event Notifications',
    serviceIds: ['aws.s3', 'aws.lambda', 'aws.sqs', 'aws.sns', 'aws.eventbridge'],
    summary: 'O bucket publica eventos (objeto criado, removido, restaurado, replicado, transições de lifecycle…) para **SNS, SQS, Lambda** ou **EventBridge**, com filtros por prefixo e sufixo da key.',
    explanation: [
      'Em vez de a aplicação ficar consultando o bucket para descobrir arquivos novos, o S3 avisa. Cada configuração de notificação diz quais eventos interessam, um filtro opcional de prefixo e sufixo e para onde enviar. É a peça que transforma o upload de um arquivo no início de um processamento.',
      'Exemplo: usuários enviam fotos para `uploads/`. Uma notificação de ObjectCreated com sufixo `.jpg` invoca uma função Lambda que gera miniaturas e as grava em outro bucket.',
      '**Regra prática:** para um consumidor, envie direto ao SQS ou ao Lambda; para vários, use o SNS em fan-out; para filtros mais ricos ou fila FIFO, use o EventBridge.',
    ],
    facts: [
      'Destinos suportados: tópicos Amazon SNS, filas Amazon SQS, funções AWS Lambda e Amazon EventBridge.',
      'Filas SQS FIFO não são aceitas como destino direto; o caminho é o EventBridge.',
      'Curingas (*) não são aceitos em prefixos e sufixos dos filtros.',
    ],
    exam: {
      domains: ['d3', 'd2'],
      relevance: 'alta',
      notes: 'Sinais: "processar cada arquivo assim que chegar ao bucket" e "sem servidores consultando o bucket". A resposta é uma notificação de eventos do S3 para Lambda, SQS, SNS ou EventBridge. Se vários sistemas precisam do mesmo evento, a notificação direta não basta: considere o fan-out ou o EventBridge.',
    },
    references: [EN, TYPES],
    tags: ['integracao'],
  },
  {
    id: 'ev.destination-permissions',
    title: 'Permissão nos destinos',
    officialName: 'Destination resource policies',
    serviceIds: ['aws.s3', 'aws.sqs', 'aws.sns', 'aws.lambda'],
    summary: 'O S3 precisa de permissão para publicar no tópico ou na fila (política de recurso) e para invocar a função (permissão da Lambda). Sem isso, a configuração é recusada ao salvar.',
    exam: { domains: ['d1'], relevance: 'media' },
    references: [TYPES],
    tags: ['integracao', 'seguranca'],
    reviewItems: [
      {
        id: 'rv:ev.destination-permissions:fila',
        kind: 'decision',
        title: 'Notificação recusada',
        prompt: 'Ao salvar uma notificação para uma fila SQS, o S3 responde "Unable to validate the following destination configurations". O que costuma faltar?',
        concepts: [{ id: 'ev.destination-permissions' }],
        xp: 5,
        difficulty: 1,
        explanation: ['A política de acesso da fila precisa permitir que o serviço S3 (para aquele bucket) envie mensagens. Para Lambda, é a permissão de invocação da função.'],
        options: [
          { id: 'a', text: 'Uma política na fila permitindo que o S3 envie mensagens', correct: true, consequence: 'Com a permissão, o S3 valida o destino e salva a configuração.' },
          { id: 'b', text: 'Habilitar o versionamento do bucket', correct: false, consequence: 'Notificações não exigem versionamento.' },
          { id: 'c', text: 'Trocar a fila por uma FIFO', correct: false, consequence: 'Filas FIFO nem são aceitas como destino direto.' },
        ],
      },
    ],
  },
  {
    id: 'ev.filter-overlap',
    title: 'Filtros sobrepostos',
    officialName: 'Overlapping notification filters',
    serviceIds: ['aws.s3'],
    summary: 'Para os **mesmos tipos de evento**, as notificações não podem ter prefixos ou sufixos que se sobreponham — um filtro vazio sobrepõe todos. Para vários consumidores do mesmo evento, use fan-out (SNS) ou EventBridge.',
    facts: ['Prefixos iguais com sufixos que não se sobrepõem (como .jpg e .png) são aceitos.', 'Os mesmos filtros com tipos de evento diferentes (ObjectCreated e ObjectRemoved) são aceitos.'],
    exam: { domains: ['d3'], relevance: 'media' },
    references: [FILTER],
    tags: ['integracao'],
    reviewItems: [
      {
        id: 'rv:ev.filter-overlap:jpg',
        kind: 'decision',
        title: 'Dois sufixos',
        prompt: 'Duas notificações `ObjectCreated:*`: uma com sufixo `jpg`, outra com sufixo `.jpg`, para destinos diferentes. O S3 aceita?',
        concepts: [{ id: 'ev.filter-overlap' }],
        xp: 5,
        difficulty: 2,
        explanation: ['Uma mesma key pode terminar com ".jpg" e "jpg": os sufixos se sobrepõem, e a configuração é recusada.'],
        options: [
          { id: 'a', text: 'Não: os sufixos se sobrepõem para os mesmos tipos de evento', correct: true, consequence: 'Para dois consumidores do mesmo evento, use fan-out.' },
          { id: 'b', text: 'Sim: os sufixos são textos diferentes', correct: false, consequence: 'O que conta é se uma key pode terminar com os dois — e pode.' },
        ],
      },
    ],
  },
  {
    id: 'ev.fanout',
    title: 'Fan-out com SNS e SQS',
    officialName: 'SNS fan-out to SQS',
    serviceIds: ['aws.sns', 'aws.sqs'],
    summary: 'Um evento vai para um **tópico SNS**, e o tópico entrega uma cópia a cada assinante (filas SQS, funções Lambda). Cada consumidor processa no seu ritmo, sem acoplamento.',
    explanation: [
      'O fan-out separa quem gera o evento de quem o consome. O S3 publica uma vez no tópico; o SNS entrega uma cópia para cada fila inscrita; cada fila tem o próprio consumidor, que processa no seu ritmo, com novas tentativas e DLQ próprias. Acrescentar um consumidor é só inscrever mais uma fila.',
      'Exemplo: cada nota fiscal enviada ao bucket precisa ser arquivada, analisada por um sistema antifraude e contabilizada. Um tópico SNS com três filas SQS inscritas entrega o mesmo evento aos três sistemas, e a lentidão de um não atrasa os outros.',
      '**Regra prática:** quando o mesmo evento precisa chegar a vários consumidores independentes, publique num tópico SNS e inscreva uma fila SQS por consumidor.',
    ],
    benefits: ['Desacoplamento entre produtores e consumidores', 'Filas absorvem picos e permitem novas tentativas'],
    comparisons: [
      { with: 'ev.eventbridge', text: 'O EventBridge também distribui um evento para vários alvos, com regras de filtro mais ricas. O SNS com filas SQS é o padrão clássico quando cada consumidor precisa da própria fila.' },
    ],
    exam: {
      domains: ['d2', 'd3'],
      relevance: 'alta',
      notes: 'O fan-out é a resposta quando o enunciado pede que o mesmo evento seja processado por vários sistemas de forma desacoplada, ou quando duas notificações do S3 precisariam de filtros sobrepostos para os mesmos eventos.',
    },
    references: [TYPES],
    tags: ['integracao'],
  },
  {
    id: 'ev.eventbridge',
    title: 'Eventos via EventBridge',
    officialName: 'Amazon S3 with Amazon EventBridge',
    serviceIds: ['aws.eventbridge', 'aws.s3'],
    summary: 'Habilitado no bucket, o **EventBridge** recebe os eventos e os roteia por **regras** com filtros mais ricos, para muitos alvos — inclusive **filas SQS FIFO**.',
    explanation: [
      'Com o EventBridge habilitado no bucket, o S3 envia os eventos ao barramento padrão da conta, e regras escolhem quais eventos vão para quais alvos. As regras filtram por muito mais que prefixo e sufixo (por exemplo, pelo tamanho do objeto), e o mesmo evento pode alimentar várias regras sem o conflito de sobreposição das notificações diretas.',
      'Exemplo: arquivos maiores que 1 GB, enviados a qualquer pasta, precisam ir para uma fila FIFO de processamento pesado. Uma regra do EventBridge com filtro de tamanho entrega esses eventos à fila, o que a notificação direta não faz.',
      '**Regra prática:** quando a notificação direta não alcança o filtro ou o destino que você precisa, habilite o EventBridge no bucket.',
    ],
    comparisons: [
      { with: 'ev.notifications', text: 'A notificação direta é mais simples e filtra só por prefixo e sufixo, sem sobreposição entre configurações. O EventBridge aceita filtros mais ricos, vários consumidores e mais tipos de alvo.' },
    ],
    exam: {
      domains: ['d3'],
      relevance: 'media',
      notes: 'Sinais: "filtros avançados", "vários destinos para o mesmo evento", "fila FIFO como destino" ou "acionar outros serviços, como o Step Functions". A resposta é habilitar o EventBridge no bucket.',
    },
    references: [EB],
    tags: ['integracao'],
  },
  {
    id: 'ev.at-least-once',
    title: 'Pelo menos uma vez, sem ordem garantida',
    officialName: 'At-least-once delivery and the sequencer key',
    serviceIds: ['aws.s3'],
    summary: 'Os eventos são entregues **pelo menos uma vez** (podem vir duplicados), em geral em segundos, e **sem ordem garantida**. A chave **sequencer** ordena eventos de uma **mesma key**.',
    explanation: [
      'Exemplo: um evento de ObjectCreated chega duas vezes, e a função consumidora cobra o cliente duas vezes. Se a função guardar a key, o versionId e o sequencer já processados e ignorar as repetições, a duplicata não causa efeito.',
      '**Regra prática:** todo consumidor de eventos precisa aceitar repetições sem efeito duplicado.',
    ],
    facts: [
      'O sequencer não serve para ordenar eventos de keys diferentes.',
      'Para comparar sequencers, complete o menor com zeros à esquerda e compare lexicograficamente.',
    ],
    recommendations: ['Torne os consumidores idempotentes: registre key, versionId e sequencer já processados.'],
    exam: {
      domains: ['d2'],
      relevance: 'media',
      notes: 'Se a questão relata processamento duplicado ou fora de ordem a partir de eventos do S3, a resposta envolve um consumidor idempotente e, para ordenar eventos de uma mesma key, o sequencer.',
    },
    references: [EN, MSG],
    tags: ['integracao'],
  },
  {
    id: 'ev.recursion',
    title: 'Loop recursivo',
    officialName: 'Recursive invocation',
    serviceIds: ['aws.lambda', 'aws.s3'],
    summary: 'Se uma função disparada por uploads grava no **mesmo bucket**, sob um filtro que a dispara de novo, ela invoca a si mesma sem parar. Use outro bucket ou um prefixo de entrada exclusivo.',
    explanation: [
      'Exemplo: uma função redimensiona imagens enviadas a `fotos/` e grava o resultado em `fotos/pequenas/`. Como o filtro `fotos/` também cobre a pasta de saída, cada imagem gerada dispara a função de novo. Gravar o resultado em `miniaturas/`, fora do filtro, ou em outro bucket quebra o ciclo.',
      '**Regra prática:** a saída de um processamento nunca deve cair no mesmo filtro que o dispara.',
    ],
    consequences: ['Custos e invocações crescendo sem controle, até alguém interromper.'],
    exam: {
      domains: ['d2', 'd4'],
      relevance: 'media',
      notes: 'Se o enunciado descreve custos ou invocações do Lambda crescendo sem parar depois de um processamento de arquivos, procure uma gravação no mesmo bucket e prefixo que disparam a função.',
    },
    references: [EN, LAMBDA],
    tags: ['integracao', 'custos'],
  },
]
