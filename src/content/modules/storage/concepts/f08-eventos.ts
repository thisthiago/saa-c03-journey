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
    facts: [
      'Destinos suportados: tópicos Amazon SNS, filas Amazon SQS, funções AWS Lambda e Amazon EventBridge.',
      'Filas SQS FIFO não são aceitas como destino direto; o caminho é o EventBridge.',
      'Curingas (*) não são aceitos em prefixos e sufixos dos filtros.',
    ],
    exam: { domains: ['d3', 'd2'], relevance: 'alta' },
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
    benefits: ['Desacoplamento entre produtores e consumidores', 'Filas absorvem picos e permitem novas tentativas'],
    exam: { domains: ['d2', 'd3'], relevance: 'alta' },
    references: [TYPES],
    tags: ['integracao'],
  },
  {
    id: 'ev.eventbridge',
    title: 'Eventos via EventBridge',
    officialName: 'Amazon S3 with Amazon EventBridge',
    serviceIds: ['aws.eventbridge', 'aws.s3'],
    summary: 'Habilitado no bucket, o **EventBridge** recebe os eventos e os roteia por **regras** com filtros mais ricos, para muitos alvos — inclusive **filas SQS FIFO**.',
    exam: { domains: ['d3'], relevance: 'media' },
    references: [EB],
    tags: ['integracao'],
  },
  {
    id: 'ev.at-least-once',
    title: 'Pelo menos uma vez, sem ordem garantida',
    officialName: 'At-least-once delivery and the sequencer key',
    serviceIds: ['aws.s3'],
    summary: 'Os eventos são entregues **pelo menos uma vez** (podem vir duplicados), em geral em segundos, e **sem ordem garantida**. A chave **sequencer** ordena eventos de uma **mesma key**.',
    facts: [
      'O sequencer não serve para ordenar eventos de keys diferentes.',
      'Para comparar sequencers, complete o menor com zeros à esquerda e compare lexicograficamente.',
    ],
    recommendations: ['Torne os consumidores idempotentes: registre key, versionId e sequencer já processados.'],
    exam: { domains: ['d2'], relevance: 'media' },
    references: [EN, MSG],
    tags: ['integracao'],
  },
  {
    id: 'ev.recursion',
    title: 'Loop recursivo',
    officialName: 'Recursive invocation',
    serviceIds: ['aws.lambda', 'aws.s3'],
    summary: 'Se uma função disparada por uploads grava no **mesmo bucket**, sob um filtro que a dispara de novo, ela invoca a si mesma sem parar. Use outro bucket ou um prefixo de entrada exclusivo.',
    consequences: ['Custos e invocações crescendo sem controle, até alguém interromper.'],
    exam: { domains: ['d2', 'd4'], relevance: 'media' },
    references: [EN, LAMBDA],
    tags: ['integracao', 'custos'],
  },
]
