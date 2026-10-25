/**
 * Conceitos da Fase 9 — Padrões e escolha. Reaproveita ev.at-least-once
 * (S3 Expedition).
 * Fatos conferidos em 22/10/2026 (ver docs/VERIFICACAO-DE-CONTEUDO.md).
 */
import type { ConceptDef } from '../../../../engine/types'
import { R } from './refs'

export const F09_INT_CONCEPTS: ConceptDef[] = [
  {
    id: 'int.choreography-orchestration',
    title: 'Coreografia ou orquestração',
    officialName: 'Saga choreography and saga orchestration',
    serviceIds: ['aws.eventbridge', 'aws.step-functions'],
    summary: 'Na **coreografia**, cada serviço reage aos eventos dos outros, sem um coordenador: não há ponto único de falha, mas o fluxo fica difícil de acompanhar, e novas tentativas e prazos ficam espalhados. Na **orquestração**, um coordenador, como o **Step Functions**, chama cada passo e trata os erros num só lugar.',
    recommendations: ['Poucos passos independentes combinam com coreografia por eventos; um processo com ordem, prazos e compensação combina com orquestração.'],
    exam: {
      domains: ['d2'],
      relevance: 'media',
      notes: 'Sinais: "acompanhar o estado do processo num lugar só", "prazos" e "compensação" apontam para orquestração com o Step Functions; "serviços independentes reagindo a eventos", para coreografia com o EventBridge.',
    },
    references: [R.sagaChoreography, R.sagaOrchestration],
    tags: ['integracao'],
  },
  {
    id: 'int.saga',
    title: 'Saga e compensação',
    officialName: 'Saga pattern',
    serviceIds: ['aws.step-functions'],
    summary: 'Quando um processo atravessa vários serviços, cada um com seu banco, não existe uma transação única. A **saga** executa os passos um a um e, se um falha, roda **transações de compensação** que desfazem os anteriores, como estornar a cobrança e liberar o estoque. A AWS cita o Step Functions para orquestrar sagas.',
    exam: {
      domains: ['d2'],
      relevance: 'media',
      notes: 'Sinal: "manter a consistência de um processo distribuído entre serviços com bancos separados". A resposta é uma saga, em geral orquestrada pelo Step Functions.',
    },
    references: [R.sagaOrchestration],
    tags: ['integracao', 'recuperacao'],
  },
  {
    id: 'int.idempotency',
    title: 'Consumidor idempotente',
    officialName: 'Idempotent processing',
    serviceIds: ['aws.sqs', 'aws.lambda'],
    summary: 'Como fila padrão, SNS, EventBridge e Lambda entregam **pelo menos uma vez**, o consumidor precisa ser **idempotente**: processar a mesma mensagem duas vezes tem o mesmo efeito de processar uma. O jeito comum é guardar o ID de cada mensagem já tratada e ignorar as repetidas.',
    commonMistakes: ['Cobrar o cliente duas vezes porque a mesma mensagem chegou duas vezes'],
    recommendations: ['Use um ID que o produtor define, como o número do pedido, e grave o resultado e o ID na mesma operação.'],
    exam: {
      domains: ['d2'],
      relevance: 'alta',
      notes: 'Sempre que o enunciado relata processamento duplicado com SQS, SNS, EventBridge ou Lambda, a resposta inclui tornar o consumidor idempotente.',
    },
    references: [R.lambdaSqs, R.sqsStandard],
    tags: ['integracao'],
  },
  {
    id: 'int.write-buffer',
    title: 'Fila como buffer de escrita',
    officialName: 'Queue-based load leveling',
    serviceIds: ['aws.sqs'],
    summary: 'Num pico, gravar direto no banco pode estourar as conexões ou a capacidade dele. Com uma **fila na frente**, a aplicação só enfileira, e um conjunto de consumidores grava no ritmo que o banco aguenta. O pedido não se perde: ele espera na fila.',
    explanation: [
      'Exemplo: numa venda de ingressos, milhares de compras por segundo chegam à API. A API grava cada compra numa fila SQS e responde na hora; funções Lambda, com concorrência máxima de 50, gravam no banco no ritmo que ele aguenta.',
    ],
    recommendations: ['Combine o buffer com a concorrência máxima do mapeamento do Lambda para limitar quantas gravações chegam ao banco ao mesmo tempo.'],
    exam: {
      domains: ['d2', 'd3'],
      relevance: 'alta',
      notes: 'Sinais: "o banco não aguenta os picos de escrita" e "não perder pedidos". A resposta é uma fila SQS como buffer, com consumidores de concorrência limitada.',
    },
    references: [R.sqsWhat, R.lambdaSqsScaling],
    tags: ['integracao', 'disponibilidade'],
  },
  {
    id: 'int.choose',
    title: 'Escolhendo o serviço de integração',
    officialName: 'Choosing an AWS integration service',
    serviceIds: ['aws.sqs', 'aws.sns', 'aws.eventbridge', 'aws.step-functions', 'aws.api-gateway', 'aws.kinesis-data-streams', 'aws.mq'],
    summary: 'Um consumidor por mensagem: **SQS**. Ordem por cliente: **SQS FIFO**. Vários destinos: **SNS** (com uma fila SQS por destino). Eventos da AWS e regras por conteúdo: **EventBridge**. Passos coordenados: **Step Functions**. API para fora: **API Gateway**. Muitos eventos relidos por vários: **Kinesis**. Broker existente: **Amazon MQ**.',
    exam: {
      domains: ['d2'],
      relevance: 'alta',
      notes: 'Questões de integração dão o padrão de comunicação: um consumidor (SQS), ordem (SQS FIFO), vários destinos (SNS ou EventBridge), passos coordenados (Step Functions), API pública (API Gateway), muitos leitores com releitura (Kinesis) e broker legado (Amazon MQ).',
    },
    references: [R.sqsWhat, R.snsWhat, R.ebBus, R.sfnWhat, R.apigwWhat, R.kdsConcepts, R.mqWhat],
    tags: ['integracao'],
  },
]
