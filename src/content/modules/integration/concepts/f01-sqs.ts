/**
 * Conceitos da Fase 1 — Desacoplamento e SQS essencial.
 * Fatos conferidos em 22/10/2026 (ver docs/VERIFICACAO-DE-CONTEUDO.md).
 */
import type { ConceptDef } from '../../../../engine/types'
import { R } from './refs'

export const F01_INT_CONCEPTS: ConceptDef[] = [
  {
    id: 'int.sync-async',
    title: 'Chamada síncrona ou assíncrona',
    officialName: 'Synchronous and asynchronous communication',
    serviceIds: ['aws.sqs'],
    summary: 'Na chamada **síncrona**, quem pede espera a resposta: se o outro lado está lento ou fora do ar, o pedido falha junto. Na **assíncrona**, quem pede deixa a mensagem numa **fila** e segue; quem processa lê no próprio ritmo. A fila **desacopla** os dois lados e **absorve picos**.',
    explanation: [
      'Pense numa lanchonete: no balcão, o cliente espera o lanche ficar pronto (síncrono); com a comanda, ele faz o pedido, recebe uma senha, e a cozinha prepara no ritmo dela (assíncrono). O limite da comparação: na arquitetura, a fila também guarda os pedidos se a cozinha parar, e eles continuam lá quando ela volta, dentro do prazo de retenção.',
      'Exemplo: um site de pedidos grava cada pedido numa fila SQS e responde ao cliente na hora. Um grupo de instâncias ou funções processa a fila; numa promoção, a fila cresce e o processamento acompanha, sem derrubar o site.',
      '**Regra prática:** se quem pede não precisa da resposta na hora, ponha uma fila no meio.',
    ],
    commonMistakes: ['Chamar direto um serviço lento a cada pedido e derrubar o site quando ele trava'],
    exam: {
      domains: ['d2'],
      relevance: 'alta',
      notes: 'A tarefa 2.1 do exame cita arquiteturas desacopladas e o uso de filas. Sinais: "picos de demanda", "o processamento é lento" e "a falha de um componente derruba o outro". A resposta tende a uma fila SQS entre os componentes.',
    },
    references: [R.sqsWhat],
    tags: ['integracao', 'disponibilidade'],
  },
  {
    id: 'sqs.what',
    title: 'Amazon SQS e a fila padrão',
    officialName: 'Amazon Simple Queue Service (standard queue)',
    serviceIds: ['aws.sqs'],
    summary: 'O **SQS** é uma fila gerenciada: o produtor envia, o consumidor **recebe**, processa e **apaga** a mensagem. A **fila padrão** tem vazão praticamente ilimitada, entrega **pelo menos uma vez** (uma mensagem pode chegar em dobro) e a ordem é de **melhor esforço**.',
    comparisons: [
      { with: 'sqs.fifo', text: 'A fila FIFO garante a ordem por grupo e o processamento exatamente uma vez, com vazão menor. A fila padrão escala quase sem limite, mas pode entregar em dobro e fora de ordem.' },
    ],
    commonMistakes: ['Esquecer de apagar a mensagem depois de processar e vê-la voltar à fila'],
    facts: ['Uma operação de envio, recebimento ou exclusão aceita lotes de até 10 mensagens.', 'Na fila padrão, cabem cerca de 120.000 mensagens em processamento ao mesmo tempo.'],
    exam: {
      domains: ['d2'],
      relevance: 'alta',
      notes: 'Sinais: "desacoplar componentes", "absorver picos" e "processar em segundo plano" apontam para o SQS. Se o requisito é ordem estrita ou processamento exatamente uma vez, a fila FIFO; se a mensagem precisa chegar a vários consumidores, o SNS ou o EventBridge.',
    },
    references: [R.sqsWhat, R.sqsStandard],
    tags: ['integracao'],
  },
  {
    id: 'sqs.visibility',
    title: 'Tempo de visibilidade',
    officialName: 'Visibility timeout',
    serviceIds: ['aws.sqs'],
    summary: 'Quando um consumidor recebe a mensagem, ela fica **invisível** para os outros pelo **tempo de visibilidade** (padrão de **30 s**, de 0 s a **12 horas**). Se o consumidor não a apagar antes do fim do prazo, ela **volta a ficar visível** e outro consumidor pode processá-la de novo.',
    explanation: [
      'Pense num quadro de tarefas em que, ao pegar um cartão, você o vira de costas por um tempo combinado. Se terminar, joga o cartão fora; se o tempo acabar antes, o cartão volta a aparecer e outra pessoa pode pegá-lo. O limite da comparação: o SQS não sabe se você ainda está trabalhando, ele só conta o tempo.',
      'O SQS não apaga a mensagem ao entregá-la, porque o consumidor pode falhar no meio do processamento. Ele a esconde pelo tempo de visibilidade e espera a exclusão (`DeleteMessage`). Se o consumidor cair, a mensagem reaparece sozinha e outro consumidor tenta de novo: é assim que a fila evita perder trabalho. O preço dessa garantia é o risco de processar em dobro quando o prazo é curto demais para a tarefa.',
      'Exemplo: cada mensagem pede a conversão de um vídeo, que leva cerca de 3 minutos. Com a visibilidade padrão de 30 s, a mensagem reaparece enquanto o primeiro consumidor ainda trabalha, e um segundo consumidor começa a mesma conversão. A solução é uma visibilidade maior que o tempo de processamento, com folga, ou estender o prazo durante o trabalho com `ChangeMessageVisibility`. Quando o consumidor é uma função Lambda, a documentação recomenda uma visibilidade de pelo menos seis vezes o tempo limite da função.',
      '**Regra prática:** a visibilidade precisa ser maior que o tempo de processamento. Se a mensagem falha repetidamente, quem resolve é a [[sqs.dlq|DLQ]], não uma visibilidade maior.',
    ],
    comparisons: [
      { with: 'sqs.delay', text: 'A fila com atraso esconde a mensagem **antes** da primeira entrega. A visibilidade a esconde **depois** de cada recebimento, enquanto alguém a processa.' },
      { with: 'sqs.dlq', text: 'A visibilidade decide quando a mensagem pode ser tentada de novo; a DLQ decide quando parar de tentar. Depois de maxReceiveCount recebimentos sem exclusão, a mensagem vai para a DLQ.' },
      { with: 'sqs.long-polling', text: 'O long polling define quanto tempo o pedido de recebimento espera por mensagens (até 20 s). Ele não muda o tempo em que a mensagem fica escondida depois de recebida.' },
    ],
    facts: ['O prazo pode ser estendido durante o processamento com ChangeMessageVisibility.', 'O limite de 12 horas conta a partir do primeiro recebimento.'],
    commonMistakes: [
      'Deixar a visibilidade menor que o tempo de processamento e processar a mesma mensagem em dobro.',
      'Aumentar a visibilidade ao máximo "por segurança": se o consumidor cair, a mensagem fica parada esse tempo todo antes da nova tentativa.',
    ],
    recommendations: ['Faça o consumidor idempotente: mesmo com a visibilidade bem ajustada, a fila padrão pode entregar a mesma mensagem mais de uma vez.'],
    exam: {
      domains: ['d2'],
      relevance: 'alta',
      notes: 'Sinais: "mensagens processadas mais de uma vez", "o processamento leva mais tempo que o esperado" ou "pedidos duplicados" numa arquitetura com SQS. A correção esperada costuma ser ajustar o tempo de visibilidade ao tempo de processamento, às vezes junto com um consumidor idempotente. Se o problema é uma mensagem que sempre falha e volta, a resposta é uma DLQ. Não confunda com o long polling, que reduz respostas vazias e custo, nem com a fila FIFO, que entra quando o requisito é ordem ou deduplicação.',
    },
    references: [R.sqsVisibility, R.lambdaSqsConfig],
    tags: ['integracao'],
  },
  {
    id: 'sqs.retention-size',
    title: 'Retenção e tamanho da mensagem',
    officialName: 'Message retention period and maximum message size',
    serviceIds: ['aws.sqs', 'aws.s3'],
    summary: 'A fila guarda cada mensagem por **4 dias** por padrão, configurável de **1 minuto a 14 dias**; depois disso, ela é apagada mesmo sem ser processada. Uma mensagem tem até **1 MiB**; para cargas maiores, guarde o conteúdo no **S3** e envie só a referência (a biblioteca Extended Client faz isso, até 2 GB).',
    commonMistakes: ['Confiar que a fila guarda mensagens para sempre enquanto o consumidor está parado'],
    exam: {
      domains: ['d2'],
      relevance: 'media',
      notes: 'Sinais: "mensagens maiores que 1 MiB" pedem guardar o conteúdo no S3 e enviar só a referência; "consumidor parado por vários dias" pede aumentar a retenção até 14 dias.',
    },
    references: [R.sqsMessageQuotas, R.sqsLarge],
    tags: ['integracao', 'durabilidade'],
  },
  {
    id: 'sqs.long-polling',
    title: 'Long polling',
    officialName: 'Short polling and long polling',
    serviceIds: ['aws.sqs'],
    summary: 'No **short polling**, o recebimento consulta só uma parte dos servidores e responde na hora, às vezes vazio. No **long polling**, o recebimento espera até **20 s** por mensagens e consulta todos os servidores: menos respostas vazias, menos chamadas e **menor custo**.',
    commonMistakes: ['Consultar a fila em laço com short polling e pagar por milhares de respostas vazias'],
    facts: ['O long polling é ligado com WaitTimeSeconds maior que zero, na chamada ou como padrão da fila.'],
    exam: {
      domains: ['d4'],
      relevance: 'media',
      notes: 'Sinal: "reduzir o custo e as respostas vazias ao consultar a fila". A resposta é o long polling, com WaitTimeSeconds de até 20.',
    },
    references: [R.sqsPolling],
    tags: ['integracao', 'custos'],
  },
  {
    id: 'sqs.dlq',
    title: 'Fila de mensagens mortas (DLQ)',
    officialName: 'Dead-letter queue and redrive',
    serviceIds: ['aws.sqs'],
    summary: 'A **DLQ** recebe as mensagens que falharam demais: quando uma mensagem é recebida mais vezes que o **maxReceiveCount** sem ser apagada, ela sai da fila de origem. Assim a mensagem com defeito não trava o consumidor nem some ao fim da retenção. Depois de corrigir o problema, o **redrive** devolve as mensagens à fila de origem.',
    commonMistakes: ['Usar maxReceiveCount 1 e mandar para a DLQ mensagens que dariam certo na segunda tentativa'],
    facts: ['A DLQ fica na mesma conta e na mesma Região da fila de origem.', 'Na fila padrão, a mensagem guarda a data original de entrada; por isso a retenção da DLQ deve ser maior que a da origem. Na FIFO, a data recomeça ao chegar à DLQ.', 'A AWS avisa: numa fila FIFO em que a ordem exata importa, a DLQ quebra essa ordem.'],
    exam: {
      domains: ['d2'],
      relevance: 'alta',
      notes: 'Sinal: "mensagens que sempre falham ficam voltando e atrapalham o processamento". A resposta é uma DLQ com maxReceiveCount adequado e, depois da correção, o redrive.',
    },
    references: [R.sqsDlq],
    tags: ['integracao', 'recuperacao'],
  },
]
