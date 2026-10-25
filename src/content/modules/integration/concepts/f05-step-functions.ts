/**
 * Conceitos da Fase 5 — Step Functions.
 * Fatos conferidos em 22/10/2026 (ver docs/VERIFICACAO-DE-CONTEUDO.md).
 */
import type { ConceptDef } from '../../../../engine/types'
import { R } from './refs'

export const F05_INT_CONCEPTS: ConceptDef[] = [
  {
    id: 'sfn.what',
    title: 'AWS Step Functions',
    officialName: 'AWS Step Functions state machines',
    serviceIds: ['aws.step-functions'],
    summary: 'O **Step Functions** executa uma **máquina de estados**: um fluxo de passos descrito em JSON (Amazon States Language), que chama serviços da AWS, decide caminhos, espera, repete e trata erros. Cada execução fica registrada passo a passo.',
    explanation: [
      'Exemplo: um pedido passa por reserva de estoque, cobrança e envio. A máquina de estados chama cada serviço na ordem, repete a cobrança em erros passageiros e, se o pagamento falha de vez, libera o estoque reservado.',
    ],
    benefits: ['Tira do código a lógica de coordenação, as novas tentativas e as esperas.'],
    comparisons: [
      { with: 'int.choreography-orchestration', text: 'O Step Functions é a forma de orquestração: um coordenador chama cada passo. Na coreografia, cada serviço reage aos eventos dos outros, sem coordenador.' },
    ],
    exam: {
      domains: ['d2'],
      relevance: 'alta',
      notes: 'Sinais: "coordenar vários passos", "tratar erros e novas tentativas fora do código", "esperar uma aprovação humana" e "processo de longa duração". A resposta é o Step Functions.',
    },
    references: [R.sfnWhat],
    tags: ['integracao'],
  },
  {
    id: 'sfn.standard-express',
    title: 'Fluxo Standard ou Express',
    officialName: 'Standard and Express workflows',
    serviceIds: ['aws.step-functions'],
    summary: 'O fluxo **Standard** dura até **um ano**, executa cada passo **exatamente uma vez** e cobra por **transição de estado**: serve para processos longos e ações que não podem repetir, como pagamentos. O **Express** dura até **5 minutos**, cobra por execução, duração e memória e serve para volumes muito altos de eventos curtos.',
    commonMistakes: ['Usar Express para um fluxo de pagamento que espera aprovação humana por horas'],
    facts: ['O Express assíncrono executa pelo menos uma vez; o síncrono, no máximo uma vez.', 'O Standard guarda o histórico da execução por 90 dias.', 'Os padrões de execução até o fim (.sync) e de espera por callback só existem no Standard.'],
    exam: {
      domains: ['d2', 'd4'],
      relevance: 'alta',
      notes: 'Sinais: "processo longo, auditável, sem repetir passos" apontam para o Standard; "milhares de eventos curtos por segundo", para o Express.',
    },
    references: [R.sfnTypes],
    tags: ['integracao', 'custos'],
  },
  {
    id: 'sfn.states',
    title: 'Tipos de estado',
    officialName: 'Workflow states',
    serviceIds: ['aws.step-functions'],
    summary: '**Task** faz um trabalho (chama um serviço); **Choice** escolhe o caminho; **Parallel** roda ramos ao mesmo tempo; **Map** repete os passos para cada item de uma lista; **Wait** espera; **Pass** repassa dados; **Succeed** e **Fail** terminam a execução.',
    exam: { domains: ['d2'], relevance: 'media' },
    references: [R.sfnStates],
    tags: ['integracao'],
  },
  {
    id: 'sfn.retry-catch',
    title: 'Retry e Catch',
    officialName: 'Handling errors with Retry and Catch',
    serviceIds: ['aws.step-functions'],
    summary: 'Sem tratamento, um erro num estado faz a **execução inteira falhar**. O **Retry** tenta de novo com espera crescente (padrão: 1 s, 3 tentativas, dobrando a espera). O **Catch** desvia para outro estado quando as tentativas acabam, por exemplo um passo de **compensação**; **States.ALL** casa com qualquer erro.',
    commonMistakes: ['Repetir cinco vezes um erro permanente, como cartão recusado, antes de cancelar o pedido'],
    recommendations: ['Use Retry para erros passageiros e Catch para o que precisa ser desfeito quando nada dá certo.'],
    exam: {
      domains: ['d2'],
      relevance: 'alta',
      notes: 'Sinal: "desfazer os passos anteriores quando um passo falha". A resposta usa Catch para desviar para estados de compensação.',
    },
    references: [R.sfnErrors],
    tags: ['integracao', 'recuperacao'],
  },
  {
    id: 'sfn.integration-patterns',
    title: 'Padrões de integração com serviços',
    officialName: 'Service integration patterns',
    serviceIds: ['aws.step-functions'],
    summary: 'Há três jeitos de chamar um serviço: **resposta imediata** (chama e segue), **executar até o fim** (`.sync`, espera o job terminar) e **esperar por callback** (`.waitForTaskToken`, pausa até alguém devolver o token, por exemplo uma aprovação humana). O **heartbeat** detecta quem sumiu sem responder.',
    exam: {
      domains: ['d2'],
      relevance: 'media',
      notes: 'Sinal: "pausar o fluxo até uma aprovação humana". A resposta é o padrão de callback com .waitForTaskToken, num fluxo Standard.',
    },
    references: [R.sfnPatterns],
    tags: ['integracao'],
  },
]
