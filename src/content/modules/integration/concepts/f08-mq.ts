/**
 * Conceitos da Fase 8 — Mensageria gerenciada e SaaS. Reaproveita
 * ingest.third-party (trilha Análise de dados) para o AppFlow.
 * Fatos conferidos em 22/10/2026 (ver docs/VERIFICACAO-DE-CONTEUDO.md).
 */
import type { ConceptDef } from '../../../../engine/types'
import { R } from './refs'

export const F08_INT_CONCEPTS: ConceptDef[] = [
  {
    id: 'mq.what',
    title: 'Amazon MQ',
    officialName: 'Amazon MQ',
    serviceIds: ['aws.mq'],
    summary: 'O **Amazon MQ** é um broker de mensagens gerenciado, com **Apache ActiveMQ Classic** ou **RabbitMQ**. Ele fala os protocolos padrão do mercado (**JMS**, **AMQP**, **MQTT**, **OpenWire** e **STOMP**), e por isso a aplicação que já usa um desses brokers migra **sem reescrever** o código de mensageria.',
    exam: { domains: ['d2'], relevance: 'media' },
    references: [R.mqWhat],
    tags: ['integracao', 'migracao'],
  },
  {
    id: 'mq.ha',
    title: 'Alta disponibilidade no Amazon MQ',
    officialName: 'Amazon MQ deployment options',
    serviceIds: ['aws.mq'],
    summary: 'No ActiveMQ, a implantação **ativa e em espera** usa dois brokers em **duas zonas de disponibilidade**, com armazenamento compartilhado no **EFS**: se o ativo falha, o outro assume. No RabbitMQ, o cluster usa **filas de quórum** replicadas entre zonas. Um broker de **instância única** não sobrevive à falha da zona.',
    commonMistakes: ['Migrar o broker de produção como instância única e perder a fila quando a zona cai'],
    exam: { domains: ['d2'], relevance: 'media' },
    references: [R.mqArchitecture],
    tags: ['integracao', 'disponibilidade'],
  },
  {
    id: 'mq.vs-sqs',
    title: 'Amazon MQ ou SQS e SNS',
    officialName: 'Choosing between Amazon MQ and Amazon SQS/SNS',
    serviceIds: ['aws.mq', 'aws.sqs', 'aws.sns'],
    summary: 'A AWS recomenda o **Amazon MQ** para **migrar** aplicações que já usam um broker e seus protocolos, e o **SQS e o SNS** para **aplicações novas**: escalam quase sem limite, não têm broker para dimensionar e cobram por uso.',
    commonMistakes: ['Escolher o Amazon MQ para uma aplicação nova só porque o time conhece filas JMS'],
    exam: { domains: ['d2', 'd4'], relevance: 'alta' },
    references: [R.mqWhat],
    tags: ['integracao', 'migracao'],
  },
]
