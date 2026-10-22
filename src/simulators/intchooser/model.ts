/**
 * Escolha do serviço de integração: qual serviço responde a cada requisito
 * com o menor esforço.
 *
 * Conferido em 22/10/2026 (ver os modelos e conceitos das fases anteriores):
 * SQS (fila padrão e FIFO, com ordem por grupo e deduplicação), SNS (tópicos
 * com assinaturas e filtros, e o fan-out para várias filas), EventBridge
 * (barramento com regras por padrão de evento, eventos de serviços da AWS e
 * de parceiros SaaS; Scheduler para agendamentos), Step Functions (fluxos
 * com estados, Retry e Catch, e espera por aprovação humana), API Gateway
 * (APIs REST, HTTP e WebSocket com throttling e usage plans), Kinesis Data
 * Streams (fluxo ordenado por shard, releitura e vários consumidores),
 * Amazon Data Firehose (entrega gerenciada no S3 e em outros destinos),
 * Amazon MSK (Apache Kafka gerenciado), Amazon MQ (ActiveMQ e RabbitMQ com
 * JMS, AMQP, MQTT, OpenWire e STOMP, para migrar sem reescrever) e AppFlow
 * (dados de aplicações SaaS como Salesforce para a AWS).
 */
import { choiceSolution, evaluateChoiceLab, type ChoiceCatalog, type ChoiceLabConfig, type ChoiceLabResponse } from '../shared/chooser'

export const INT_OPTIONS: ChoiceCatalog = {
  needLabel: {
    decouple: 'desacoplar quem produz de quem processa, absorvendo picos',
    order: 'processar na ordem de cada pedido, sem duplicar',
    fanout: 'entregar a mesma mensagem a várias aplicações',
    'fanout-buffer': 'entregar a mesma mensagem a várias aplicações, cada uma no seu ritmo e sem perder nada se uma cair',
    'aws-events': 'reagir a eventos de serviços da AWS e de parceiros SaaS com regras por conteúdo',
    schedule: 'disparar milhões de tarefas agendadas, cada uma no seu horário',
    workflow: 'coordenar vários passos com novas tentativas, compensação e espera por aprovação',
    'public-api': 'expor uma API para parceiros, com limite de uso por cliente',
    'stream-replay': 'muitos eventos por segundo, lidos por várias aplicações e relidos quando preciso',
    'stream-to-s3': 'levar um fluxo de eventos ao S3 sem escrever nem operar consumidores',
    kafka: 'manter o código que já usa a API do Apache Kafka',
    'legacy-protocol': 'migrar uma aplicação que usa JMS e AMQP sem reescrevê-la',
    'saas-data': 'trazer dados do Salesforce para o S3 sem escrever código',
  },
  options: {
    sqs: { name: 'Amazon SQS (fila padrão)', summary: 'Fila gerenciada que guarda as mensagens até o consumidor processá-las, sem limite prático de vazão.', meets: ['decouple'], limits: ['Entrega pelo menos uma vez e não garante a ordem.'], complexity: 1 },
    'sqs-fifo': { name: 'Amazon SQS FIFO', summary: 'Fila com ordem por grupo de mensagens e deduplicação.', meets: ['order', 'decouple'], limits: ['Vazão menor que a da fila padrão.'], complexity: 2 },
    sns: { name: 'Amazon SNS', summary: 'Tópico que entrega cada mensagem a todas as assinaturas, com filtros por atributo.', meets: ['fanout'], limits: ['Não guarda a mensagem para quem está fora do ar; as novas tentativas têm limite.'], complexity: 1 },
    'sns-sqs': { name: 'SNS com uma fila SQS por assinante', summary: 'O tópico entrega uma cópia a cada fila, e cada aplicação consome a sua no próprio ritmo.', meets: ['fanout-buffer', 'fanout', 'decouple'], limits: ['Mais peças para montar que um tópico sozinho.'], complexity: 2 },
    eventbridge: { name: 'Amazon EventBridge', summary: 'Barramento de eventos com regras por padrão de conteúdo, eventos da AWS e de parceiros SaaS.', meets: ['aws-events', 'fanout'], limits: ['Uma regra entrega a até cinco destinos.'], complexity: 2 },
    scheduler: { name: 'EventBridge Scheduler', summary: 'Agendamentos únicos ou recorrentes, em escala de milhões, chamando mais de 270 serviços.', meets: ['schedule'], limits: ['Agenda; não reage a eventos.'], complexity: 1 },
    'step-functions': { name: 'AWS Step Functions', summary: 'Fluxo com estados, Retry, Catch, ramos paralelos e espera por callback.', meets: ['workflow'], limits: ['Cobra por transição de estado no fluxo Standard.'], complexity: 2 },
    'api-gateway': { name: 'Amazon API Gateway', summary: 'APIs REST, HTTP e WebSocket gerenciadas, com throttling, usage plans e chaves de API.', meets: ['public-api'], limits: ['Cobra por requisição; o cache e os usage plans só existem nas APIs REST.'], complexity: 2 },
    kinesis: { name: 'Amazon Kinesis Data Streams', summary: 'Fluxo dividido em shards, com ordem por chave de partição, retenção configurável e vários consumidores.', meets: ['stream-replay'], limits: ['No modo provisionado, os shards precisam ser dimensionados.'], complexity: 3 },
    firehose: { name: 'Amazon Data Firehose', summary: 'Entrega gerenciada de fluxos no S3 e em outros destinos, com lote e conversão de formato.', meets: ['stream-to-s3'], limits: ['Entrega em lotes; não serve para vários consumidores relerem.'], complexity: 1 },
    msk: { name: 'Amazon MSK', summary: 'Apache Kafka gerenciado, compatível com o código e as ferramentas do Kafka.', meets: ['kafka', 'stream-replay'], limits: ['Mais conceitos para operar que o Kinesis.'], complexity: 4 },
    mq: { name: 'Amazon MQ', summary: 'Brokers ActiveMQ e RabbitMQ gerenciados, com JMS, AMQP, MQTT, OpenWire e STOMP.', meets: ['legacy-protocol', 'decouple'], limits: ['Cobra o broker por hora; para aplicações novas, a AWS recomenda SQS e SNS.'], complexity: 3 },
    appflow: { name: 'Amazon AppFlow', summary: 'Fluxos de dados sem código entre aplicações SaaS, como Salesforce, e a AWS.', meets: ['saas-data'], limits: ['Move dados de aplicações; não é uma fila de mensagens.'], complexity: 1 },
  },
}

export type IntChooserLabConfig = ChoiceLabConfig
export type IntChooserLabResponse = ChoiceLabResponse

export const intChooserSolution = (c: IntChooserLabConfig) => choiceSolution(INT_OPTIONS, c)
export const evaluateIntChooserLab = (c: IntChooserLabConfig, r: IntChooserLabResponse) => evaluateChoiceLab(INT_OPTIONS, c, r)
