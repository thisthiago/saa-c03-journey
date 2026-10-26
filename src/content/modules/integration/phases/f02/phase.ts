/**
 * Fase 2 — SQS em escala. Fila FIFO e grupos, deduplicação, vazão da FIFO,
 * fila com atraso, Lambda lendo do SQS e falha parcial do lote.
 */
import type { PhaseDef } from '../../../../../engine/types'
import type { QueueLabConfig } from '../../../../../simulators/queue/lab'
import { META } from '../meta'

const DAY = 86_400

export const INGRESSOS_FILAS: QueueLabConfig = {
  visibilityOptions: [30, 60, 180, 360, 900],
  dlqOptions: [1, 3, 5],
  retentionSec: 4 * DAY,
  consumers: [
    { id: 'bilhete', label: 'Gerar o PDF do ingresso (Lambda)', processSec: 8, lambdaTimeoutSec: 30, transientFailures: 1, concepts: ['sqs.lambda', 'sqs.visibility'] },
    { id: 'antifraude', label: 'Checagem antifraude (Lambda)', processSec: 20, lambdaTimeoutSec: 60, transientFailures: 2, concepts: ['sqs.lambda', 'sqs.dlq'] },
    { id: 'repasse', label: 'Repasse ao produtor do show (servidor)', processSec: 50, transientFailures: 2, concepts: ['sqs.visibility', 'sqs.dlq'] },
  ],
}

export const F02_INT: PhaseDef = {
  ...META.f02,
  concepts: ['sqs.fifo', 'sqs.dedup', 'sqs.fifo-throughput', 'sqs.delay', 'sqs.lambda', 'sqs.partial-batch', 'sqs.visibility', 'sqs.dlq'],
  availability: 'available',
  simplifications: ['A bilheteria, os pedidos e os tempos são fictícios.', 'No laboratório, a janela de lote do Lambda não entra na conta da visibilidade.'],
  missions: [
    // -----------------------------------------------------------------------
    {
      id: 'int.f02.m1',
      title: 'Primeiro reservar, depois pagar',
      type: 'mission',
      summary: 'Fila FIFO e grupos de mensagens.',
      briefing: {
        company: 'Ingressos Já',
        role: 'Você cuida da fila de pedidos de uma bilheteria on-line.',
        situation: 'Cada pedido gera três mensagens: reservar o assento, cobrar e emitir o ingresso. Na fila padrão, às vezes a cobrança chegou antes da reserva, e o cliente pagou por um assento que não existia mais.',
        objective: 'Garantir a ordem dentro de cada pedido sem travar os pedidos dos outros clientes.',
        successCriteria: ['Usar uma fila FIFO', 'Escolher o grupo de mensagens'],
      },
      intel: [{ conceptId: 'sqs.fifo', body: ['A **fila FIFO** entrega na ordem **dentro de cada grupo de mensagens**. Grupos diferentes andam em paralelo. Com o número do pedido como grupo, cada pedido fica em ordem e os pedidos não esperam uns pelos outros.'] }],
      activities: [
        {
          id: 'int.f02.m1.a1',
          kind: 'decision',
          title: 'O grupo de mensagens',
          prompt: 'Qual valor usar como MessageGroupId na fila FIFO de pedidos?',
          concepts: [{ id: 'sqs.fifo' }],
          xp: 50,
          difficulty: 2,
          explanation: ['O número do pedido mantém as três mensagens de cada pedido em ordem e deixa os pedidos diferentes andarem em paralelo.'],
          options: [
            { id: 'a', text: 'O número do pedido', correct: true, consequence: 'Ordem dentro do pedido e paralelismo entre pedidos.' },
            { id: 'b', text: 'Um valor fixo, "pedidos", para todas as mensagens', correct: false, consequence: 'Tudo fica em ordem, mas um pedido de cada vez: a fila vira um gargalo.' },
            { id: 'c', text: 'Um valor aleatório em cada mensagem', correct: false, consequence: 'Cada mensagem num grupo: a ordem do pedido se perde.' },
          ],
        },
        {
          id: 'int.f02.m1.a2',
          kind: 'predict',
          title: 'A ordem do pedido 7',
          prompt: 'Chegam, nesta ordem: reserva do pedido 7, reserva do pedido 8, cobrança do pedido 7, cobrança do pedido 8 e ingresso do pedido 7. Em que ordem saem as mensagens do grupo "pedido-7"?',
          concepts: [{ id: 'sqs.fifo' }],
          xp: 40,
          difficulty: 1,
          explanation: ['Dentro do grupo, a ordem de entrada é mantida: reserva, cobrança e ingresso. As mensagens do pedido 8 ficam no grupo delas.'],
          spec: {
            sim: 'fifo',
            group: 'pedido-7',
            sends: [
              { id: 'reserva-7', group: 'pedido-7', dedupId: 'r7', atSec: 0 },
              { id: 'reserva-8', group: 'pedido-8', dedupId: 'r8', atSec: 1 },
              { id: 'cobranca-7', group: 'pedido-7', dedupId: 'c7', atSec: 2 },
              { id: 'cobranca-8', group: 'pedido-8', dedupId: 'c8', atSec: 3 },
              { id: 'ingresso-7', group: 'pedido-7', dedupId: 'i7', atSec: 4 },
            ],
          },
          options: [
            { id: 'a', text: 'Reserva, cobrança e ingresso do pedido 7', outcome: 'reserva-7+cobranca-7+ingresso-7' },
            { id: 'b', text: 'Reserva do 7, reserva do 8 e cobrança do 7', outcome: 'reserva-7+reserva-8+cobranca-7' },
            { id: 'c', text: 'Qualquer ordem: a FIFO só garante a entrega uma vez', outcome: 'any' },
          ],
        },
      ],
      debrief: { takeaways: ['FIFO: ordem dentro do grupo.', 'Grupo pelo pedido ou pelo cliente: ordem onde importa, paralelismo no resto.'] },
    },
    // -----------------------------------------------------------------------
    {
      id: 'int.f02.m2',
      title: 'O clique duplo',
      type: 'mission',
      summary: 'Deduplicação, vazão da FIFO e fila com atraso.',
      briefing: {
        company: 'Ingressos Já',
        role: 'Você ajusta a fila FIFO para o show mais disputado do ano.',
        situation: 'Clientes ansiosos clicam duas vezes em "comprar", e o app reenvia o pedido. A venda vai abrir com 2.000 pedidos por segundo. E o time quer dar 10 minutos ao cliente antes de liberar um assento não pago.',
        objective: 'Não cobrar duas vezes, aguentar a abertura das vendas e esperar os 10 minutos.',
        successCriteria: ['Usar a deduplicação', 'Escolher a vazão da fila', 'Separar atraso de visibilidade'],
      },
      intel: [
        { conceptId: 'sqs.dedup', body: ['Na FIFO, a mesma mensagem enviada de novo com o mesmo **ID de deduplicação** dentro de **5 minutos** não é entregue outra vez. O ID vem do produtor ou de um hash do corpo.'] },
        { conceptId: 'sqs.fifo-throughput', body: ['Sem lote, **300 transações por segundo** por ação; com lotes de 10, **3.000 mensagens**. O **modo de alta vazão** vai muito além, se as mensagens se espalharem por muitos grupos.'] },
        { conceptId: 'sqs.delay', body: ['O **atraso** esconde a mensagem nova por até **15 minutos** antes da primeira entrega; a **visibilidade** esconde depois de recebida.'] },
      ],
      activities: [
        {
          id: 'int.f02.m2.a1',
          kind: 'predict',
          title: 'O segundo clique',
          prompt: 'O app envia o pedido 42 com ID de deduplicação "pedido-42". Um minuto depois, o cliente clica de novo e o app reenvia com o mesmo ID. Quais mensagens do grupo "cliente-9" entram na fila?',
          concepts: [{ id: 'sqs.dedup' }],
          xp: 40,
          difficulty: 1,
          explanation: ['O reenvio com o mesmo ID dentro de 5 minutos é aceito pela API, mas não é entregue: só a primeira mensagem entra.'],
          spec: {
            sim: 'fifo',
            group: 'cliente-9',
            sends: [
              { id: 'primeiro-clique', group: 'cliente-9', dedupId: 'pedido-42', atSec: 0 },
              { id: 'segundo-clique', group: 'cliente-9', dedupId: 'pedido-42', atSec: 60 },
            ],
          },
          options: [
            { id: 'a', text: 'Só o primeiro clique', outcome: 'primeiro-clique' },
            { id: 'b', text: 'Os dois cliques', outcome: 'primeiro-clique+segundo-clique' },
            { id: 'c', text: 'Só o segundo clique', outcome: 'segundo-clique' },
          ],
        },
        {
          id: 'int.f02.m2.a2',
          kind: 'predict',
          title: 'Dez minutos depois',
          prompt: 'Numa fila FIFO, o app envia o pedido 42 do grupo "cliente-9" com ID de deduplicação "pedido-42". O cliente volta **10 minutos depois**, e o app reenvia o pedido 42 com o mesmo ID de deduplicação. Quais mensagens do grupo entram na fila?',
          concepts: [{ id: 'sqs.dedup' }],
          xp: 50,
          difficulty: 2,
          explanation: ['A janela de deduplicação é de 5 minutos. Depois disso, o mesmo ID entra de novo; o consumidor precisa tratar repetições.'],
          spec: {
            sim: 'fifo',
            group: 'cliente-9',
            sends: [
              { id: 'primeiro-envio', group: 'cliente-9', dedupId: 'pedido-42', atSec: 0 },
              { id: 'envio-tardio', group: 'cliente-9', dedupId: 'pedido-42', atSec: 600 },
            ],
          },
          options: [
            { id: 'a', text: 'Os dois envios', outcome: 'primeiro-envio+envio-tardio' },
            { id: 'b', text: 'Só o primeiro envio', outcome: 'primeiro-envio' },
            { id: 'c', text: 'Nenhum: a fila recusa o ID repetido', outcome: 'none' },
          ],
        },
        {
          id: 'int.f02.m2.a3',
          kind: 'decision',
          title: 'A abertura das vendas',
          prompt: 'A fila FIFO vai receber 2.000 pedidos por segundo, um por chamada, espalhados por milhares de clientes (cada cliente é um grupo). O que fazer?',
          concepts: [{ id: 'sqs.fifo-throughput' }],
          xp: 50,
          difficulty: 2,
          explanation: ['Sem lote, a FIFO aceita 300 transações por segundo por ação. O modo de alta vazão aguenta muito mais quando as mensagens se espalham por muitos grupos, como aqui.'],
          options: [
            { id: 'a', text: 'Ligar o modo de alta vazão da fila FIFO', correct: true, consequence: 'Com milhares de grupos, a fila aguenta a abertura.' },
            { id: 'b', text: 'Manter a configuração padrão', correct: false, consequence: '2.000 envios por segundo, um por chamada, passam muito dos 300 por segundo.' },
            { id: 'c', text: 'Usar um único grupo para todos os pedidos', correct: false, consequence: 'Um grupo só serializa tudo e piora a vazão.' },
          ],
        },
        {
          id: 'int.f02.m2.a4',
          kind: 'classify',
          title: 'Esconder antes ou depois',
          prompt: 'Para cada necessidade, diga se ela pede atraso (antes da primeira entrega) ou visibilidade (depois de recebida).',
          concepts: [{ id: 'sqs.delay' }, { id: 'sqs.visibility', weight: 0.5 }],
          xp: 40,
          difficulty: 2,
          explanation: ['O atraso adia a primeira entrega, até 15 minutos. A visibilidade protege a mensagem enquanto um consumidor a processa.'],
          bins: [
            { id: 'delay', label: 'Atraso', description: 'Antes da primeira entrega.' },
            { id: 'visibility', label: 'Visibilidade', description: 'Depois de recebida.' },
          ],
          items: [
            { id: 'assento', text: 'Só checar o pagamento 10 minutos depois da reserva', bin: 'delay', explanation: 'A mensagem não deve ser entregue antes de 10 minutos.', concepts: ['sqs.delay'] },
            { id: 'pdf', text: 'Evitar que outro consumidor pegue o pedido enquanto o PDF é gerado', bin: 'visibility', explanation: 'Protege a mensagem já recebida.', concepts: ['sqs.visibility'] },
            { id: 'lembrete', text: 'Mandar o lembrete do show 5 minutos depois da compra', bin: 'delay', explanation: 'Adiar a primeira entrega.', concepts: ['sqs.delay'] },
            { id: 'repasse', text: 'O repasse leva 50 s e não pode ser feito em dobro', bin: 'visibility', explanation: 'A visibilidade precisa cobrir os 50 s.', concepts: ['sqs.visibility'] },
          ],
        },
      ],
      debrief: { takeaways: ['Deduplicação: mesmo ID dentro de 5 minutos.', 'Alta vazão na FIFO pede muitos grupos.', 'Atraso antes da entrega; visibilidade depois.'] },
    },
    // -----------------------------------------------------------------------
    {
      id: 'int.f02.m3',
      title: 'Lambda na fila',
      type: 'mission',
      summary: 'O mapeamento do Lambda com o SQS e a falha parcial do lote.',
      briefing: {
        company: 'Ingressos Já',
        role: 'Você troca os servidores que liam a fila por funções Lambda.',
        situation: 'A função que gera os ingressos recebe lotes de 100 mensagens. Quando um ingresso falha, o lote inteiro volta, e clientes recebem o PDF duas vezes. A função tem tempo limite de 30 s.',
        objective: 'Configurar a fila e a função para que só as mensagens com falha voltem.',
        successCriteria: ['Visibilidade adequada para o Lambda', 'Devolver só as mensagens com falha'],
      },
      intel: [
        { conceptId: 'sqs.lambda', body: ['O Lambda consulta a fila e chama a função com **lotes**. Recomendação da AWS: visibilidade de pelo menos **seis vezes o tempo limite** da função e **maxReceiveCount de pelo menos 5**.'] },
        { conceptId: 'sqs.partial-batch', body: ['Com **ReportBatchItemFailures**, a função devolve só os IDs das mensagens que falharam, e o Lambda apaga as outras.'] },
      ],
      activities: [
        {
          id: 'int.f02.m3.a1',
          kind: 'decision',
          title: 'A visibilidade da fila do Lambda',
          prompt: 'A função tem tempo limite de 30 s. Qual tempo de visibilidade a AWS recomenda para a fila?',
          concepts: [{ id: 'sqs.lambda' }],
          xp: 40,
          difficulty: 1,
          explanation: ['Pelo menos seis vezes o tempo limite da função: 180 s. Isso dá margem para o Lambda tentar de novo quando a função é limitada.'],
          options: [
            { id: 'a', text: '180 s ou mais', correct: true, consequence: 'Seis vezes o tempo limite de 30 s.' },
            { id: 'b', text: '30 s, igual ao tempo limite', correct: false, consequence: 'Em novas tentativas, a mensagem volta à fila enquanto ainda está sendo processada.' },
            { id: 'c', text: '0 s', correct: false, consequence: 'A mensagem volta na hora para outro consumidor.' },
          ],
        },
        {
          id: 'int.f02.m3.a2',
          kind: 'decision',
          title: 'O lote com uma falha',
          prompt: 'Num lote de 100 mensagens, uma falha. Hoje a função lança erro, e o lote inteiro volta. O que mudar?',
          concepts: [{ id: 'sqs.partial-batch' }],
          xp: 50,
          difficulty: 2,
          explanation: ['Com ReportBatchItemFailures ligado, a função devolve batchItemFailures com a mensagem que falhou, e só ela volta à fila.'],
          options: [
            { id: 'a', text: 'Ligar ReportBatchItemFailures e devolver só a mensagem que falhou', correct: true, consequence: 'As 99 mensagens boas são apagadas.' },
            { id: 'b', text: 'Reduzir o lote para 1 mensagem', correct: false, consequence: 'Funciona, mas multiplica as invocações e o custo.' },
            { id: 'c', text: 'Apagar o lote inteiro mesmo com a falha', correct: false, consequence: 'A mensagem que falhou se perde.' },
          ],
        },
        {
          id: 'int.f02.m3.a3',
          kind: 'decision',
          title: 'O banco do antifraude',
          prompt: 'Num pico, a fila do antifraude acumulou 50.000 mensagens, e o Lambda subiu tantas funções que o banco do antifraude ficou sem conexões. O que limita a pressão no banco?',
          concepts: [{ id: 'sqs.lambda' }],
          xp: 50,
          difficulty: 2,
          explanation: ['A concorrência máxima do mapeamento limita quantas funções a fila chama ao mesmo tempo; o resto espera na fila.'],
          options: [
            { id: 'a', text: 'Definir a concorrência máxima do mapeamento da fila', correct: true, consequence: 'O banco recebe no máximo aquelas conexões; o pico espera na fila.' },
            { id: 'b', text: 'Aumentar o tamanho do lote para 10.000', correct: false, consequence: 'Muda quantas mensagens cada função recebe, não quantas funções rodam.' },
            { id: 'c', text: 'Diminuir a retenção da fila', correct: false, consequence: 'Mensagens do pico seriam apagadas antes de processadas.' },
          ],
        },
      ],
      debrief: { takeaways: ['Lambda com SQS: visibilidade de seis vezes o tempo limite e maxReceiveCount de 5 ou mais.', 'Falha parcial do lote: devolver só o que falhou.', 'Concorrência máxima do mapeamento protege o destino.'] },
    },
    // -----------------------------------------------------------------------
    {
      id: 'int.f02.boss',
      title: 'A virada de vendas',
      type: 'boss',
      summary: 'Visibilidade e DLQ de consumidores Lambda e de servidor.',
      briefing: {
        company: 'Ingressos Já',
        role: 'Você revisa as filas antes da venda do festival.',
        situation: 'Duas filas são lidas por funções Lambda e uma por um servidor. Na última venda, ingressos saíram em dobro e repasses legítimos foram parar na DLQ.',
        objective: 'Acertar a visibilidade e a DLQ de cada fila.',
        successCriteria: ['Seguir as recomendações para Lambda', 'Nenhuma mensagem boa na DLQ'],
      },
      intel: [{ conceptId: 'sqs.lambda', body: ['Com Lambda, a visibilidade parte de seis vezes o tempo limite, e o maxReceiveCount de 5. Com servidor, a visibilidade cobre o processamento.'] }],
      activities: [
        {
          id: 'int.f02.boss.a1',
          kind: 'lab',
          lab: 'queue',
          title: 'As filas do festival',
          prompt: 'Para cada consumidor, escolha o tempo de visibilidade e a DLQ.',
          concepts: [{ id: 'sqs.lambda' }, { id: 'sqs.visibility' }, { id: 'sqs.dlq' }],
          xp: 200,
          difficulty: 3,
          hints: ['Para as funções, multiplique o tempo limite por seis.', 'Para as funções, o maxReceiveCount recomendado é de pelo menos 5.'],
          explanation: ['Ingresso: 180 s e 5. Antifraude: 360 s e 5. Repasse: 60 s e 3.'],
          config: INGRESSOS_FILAS,
        },
      ],
      debrief: { takeaways: ['Lambda muda a conta da visibilidade e do maxReceiveCount.'] },
    },
  ],
}
