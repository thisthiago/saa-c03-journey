/**
 * Conceitos da Fase 3 — SNS. O fan-out reaproveita ev.fanout (S3 Expedition).
 * Fatos conferidos em 22/10/2026 (ver docs/VERIFICACAO-DE-CONTEUDO.md).
 */
import type { ConceptDef } from '../../../../engine/types'
import { R } from './refs'

export const F03_INT_CONCEPTS: ConceptDef[] = [
  {
    id: 'sns.what',
    title: 'Amazon SNS: tópicos e assinaturas',
    officialName: 'Amazon Simple Notification Service',
    serviceIds: ['aws.sns'],
    summary: 'O **SNS** entrega cada mensagem publicada num **tópico** a **todas as assinaturas** dele, no modelo publicar e assinar. As assinaturas podem ser filas SQS, funções Lambda, Firehose, endpoints HTTP ou HTTPS, e-mail, SMS e notificações para celulares.',
    facts: ['O SNS não guarda a mensagem para ser lida depois: ele empurra a mensagem a cada assinatura.'],
    commonMistakes: ['Usar um tópico SNS como se fosse uma fila e esperar que a mensagem fique guardada'],
    exam: { domains: ['d2'], relevance: 'alta' },
    references: [R.snsWhat],
    tags: ['integracao'],
  },
  {
    id: 'sns.filter',
    title: 'Política de filtro da assinatura',
    officialName: 'Subscription filter policy',
    serviceIds: ['aws.sns'],
    summary: 'A **política de filtro** faz a assinatura receber só as mensagens que interessam, pelos **atributos** ou pelo **corpo** da mensagem. Os campos da política combinam com **E**; os valores de um campo, com **OU**. **Sem política**, a assinatura recebe **tudo**.',
    facts: ['Os operadores incluem valor exato, prefixo, sufixo, anything-but, faixa numérica, exists, equals-ignore-case e endereço IP.'],
    commonMistakes: ['Criar um tópico por tipo de mensagem quando um tópico com filtros resolve'],
    exam: { domains: ['d2'], relevance: 'alta' },
    references: [R.snsFiltering, R.snsFilterPolicies],
    tags: ['integracao'],
  },
  {
    id: 'sns.fifo',
    title: 'Tópico FIFO',
    officialName: 'Amazon SNS FIFO topics',
    serviceIds: ['aws.sns', 'aws.sqs'],
    summary: 'O **tópico FIFO** mantém a **ordem** por grupo de mensagens e **deduplica**, como a fila FIFO. Para manter a garantia até o fim, ele entrega a **filas SQS FIFO** assinantes.',
    exam: { domains: ['d2'], relevance: 'media' },
    references: [R.snsFifo],
    tags: ['integracao'],
  },
  {
    id: 'sns.retries-dlq',
    title: 'Novas tentativas e DLQ da assinatura',
    officialName: 'Message delivery retries and subscription dead-letter queues',
    serviceIds: ['aws.sns', 'aws.sqs'],
    summary: 'Se a entrega falha, o SNS tenta de novo: para destinos gerenciados pela AWS, como SQS e Lambda, são **100.015 tentativas ao longo de 23 dias**; para endpoints do cliente, como HTTP, **50 tentativas em 6 horas**. Esgotadas as tentativas, a mensagem é **descartada**, a não ser que a assinatura tenha uma **DLQ** (uma fila SQS).',
    commonMistakes: ['Assinar um endpoint HTTP instável sem DLQ e perder mensagens depois de 6 horas fora do ar'],
    exam: { domains: ['d2'], relevance: 'media' },
    references: [R.snsRetries, R.snsDlq],
    tags: ['integracao', 'recuperacao'],
  },
]
