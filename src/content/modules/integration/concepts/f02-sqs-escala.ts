/**
 * Conceitos da Fase 2 — SQS em escala.
 * Fatos conferidos em 22/10/2026 (ver docs/VERIFICACAO-DE-CONTEUDO.md).
 */
import type { ConceptDef } from '../../../../engine/types'
import { R } from './refs'

export const F02_INT_CONCEPTS: ConceptDef[] = [
  {
    id: 'sqs.fifo',
    title: 'Fila FIFO e grupo de mensagens',
    officialName: 'Amazon SQS FIFO queues and message groups',
    serviceIds: ['aws.sqs'],
    summary: 'A **fila FIFO** entrega as mensagens **na ordem** em que entraram dentro de cada **grupo de mensagens** (MessageGroupId) e processa cada uma **exatamente uma vez**. Grupos diferentes andam em paralelo; dentro de um grupo, a próxima mensagem só sai depois que a anterior é apagada.',
    facts: ['O nome da fila FIFO termina em .fifo.', 'Uma fila padrão não vira FIFO: é preciso criar outra fila.'],
    commonMistakes: ['Pôr todas as mensagens num grupo só e perder o paralelismo', 'Usar FIFO sem precisar de ordem e pagar mais por menos vazão'],
    exam: { domains: ['d2'], relevance: 'alta' },
    references: [R.sqsFifo],
    tags: ['integracao'],
  },
  {
    id: 'sqs.dedup',
    title: 'Deduplicação na fila FIFO',
    officialName: 'Message deduplication ID and content-based deduplication',
    serviceIds: ['aws.sqs'],
    summary: 'Na fila FIFO, uma mensagem enviada de novo com o mesmo **ID de deduplicação** dentro de **5 minutos** é aceita, mas **não é entregue** outra vez. O ID vem do produtor ou, com a **deduplicação por conteúdo**, de um hash SHA-256 do corpo da mensagem.',
    commonMistakes: ['Contar com a deduplicação depois dos 5 minutos'],
    exam: { domains: ['d2'], relevance: 'media' },
    references: [R.sqsExactlyOnce],
    tags: ['integracao'],
  },
  {
    id: 'sqs.fifo-throughput',
    title: 'Vazão da fila FIFO',
    officialName: 'FIFO queue throughput and high throughput mode',
    serviceIds: ['aws.sqs'],
    summary: 'Sem lote, a fila FIFO aceita **300 transações por segundo** por ação; com lotes de 10, **3.000 mensagens por segundo**. O **modo de alta vazão** sobe esse limite por Região (70.000 transações por segundo em us-east-1; 4.500 em São Paulo), desde que as mensagens se espalhem por **muitos grupos**.',
    exam: { domains: ['d3'], relevance: 'media' },
    references: [R.sqsFifo, R.sqsHighThroughput],
    tags: ['integracao', 'desempenho'],
  },
  {
    id: 'sqs.delay',
    title: 'Fila com atraso e temporizador',
    officialName: 'Delay queues and message timers',
    serviceIds: ['aws.sqs'],
    summary: 'A **fila com atraso** esconde cada mensagem nova por um tempo de **0 a 15 minutos** antes da primeira entrega. O **temporizador** faz o mesmo para uma mensagem só, na fila padrão. A visibilidade esconde a mensagem **depois** de recebida; o atraso, **antes**.',
    facts: ['Na fila FIFO, o atraso é da fila inteira; o temporizador por mensagem não existe.'],
    exam: { domains: ['d2'], relevance: 'baixa' },
    references: [R.sqsDelay],
    tags: ['integracao'],
  },
  {
    id: 'sqs.lambda',
    title: 'Lambda lendo do SQS',
    officialName: 'Using Lambda with Amazon SQS',
    serviceIds: ['aws.sqs', 'aws.lambda'],
    summary: 'O **mapeamento de origem de eventos** do Lambda consulta a fila e chama a função com **lotes** (até 10.000 mensagens na fila padrão, 10 na FIFO, com janela de até 5 minutos). A AWS recomenda visibilidade de pelo menos **seis vezes o tempo limite** da função e **maxReceiveCount de pelo menos 5**.',
    facts: [
      'Na fila padrão, o Lambda começa com 5 consumidores e cresce até 300 por minuto, até 1.250 lotes ao mesmo tempo.',
      'A concorrência máxima do mapeamento (de 2 a 1.000) limita quantas funções a fila pode chamar ao mesmo tempo.',
      'Na fila FIFO, a concorrência fica limitada ao número de grupos de mensagens.',
    ],
    commonMistakes: ['Visibilidade igual ao tempo limite da função e mensagens processadas em dobro quando há novas tentativas'],
    exam: { domains: ['d2', 'd3'], relevance: 'alta' },
    references: [R.lambdaSqs, R.lambdaSqsConfig, R.lambdaSqsScaling],
    tags: ['integracao'],
  },
  {
    id: 'sqs.partial-batch',
    title: 'Falha parcial do lote',
    officialName: 'Partial batch responses (ReportBatchItemFailures)',
    serviceIds: ['aws.sqs', 'aws.lambda'],
    summary: 'Se uma mensagem do lote falha e a função devolve erro, o **lote inteiro** volta à fila, inclusive as mensagens que deram certo. Com **ReportBatchItemFailures**, a função informa só as que falharam (batchItemFailures), e o Lambda apaga as outras.',
    commonMistakes: ['Reprocessar 99 mensagens boas por causa de uma ruim'],
    exam: { domains: ['d2'], relevance: 'media' },
    references: [R.lambdaSqsErrors],
    tags: ['integracao'],
  },
]
