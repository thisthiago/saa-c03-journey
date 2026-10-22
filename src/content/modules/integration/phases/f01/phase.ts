/**
 * Fase 1 — Desacoplamento e SQS essencial. Chamada síncrona ou assíncrona,
 * a fila padrão, o tempo de visibilidade, retenção e tamanho, long polling e
 * a fila de mensagens mortas.
 */
import type { PhaseDef } from '../../../../../engine/types'
import type { QueueLabConfig } from '../../../../../simulators/queue/lab'
import { META } from '../meta'

const DAY = 86_400

export const PAGINA_FILAS: QueueLabConfig = {
  visibilityOptions: [30, 60, 120, 300, 900],
  dlqOptions: [1, 3, 5],
  retentionSec: 4 * DAY,
  consumers: [
    { id: 'notas', label: 'Emissão de notas fiscais', processSec: 45, transientFailures: 2, concepts: ['sqs.visibility', 'sqs.dlq'] },
    { id: 'emails', label: 'E-mails de confirmação', processSec: 5, transientFailures: 0, concepts: ['sqs.visibility', 'sqs.dlq'] },
    { id: 'capas', label: 'Redimensionar capas de livros', processSec: 100, transientFailures: 1, concepts: ['sqs.visibility', 'sqs.dlq'] },
    { id: 'estoque', label: 'Baixa no estoque das editoras', processSec: 240, transientFailures: 4, concepts: ['sqs.visibility', 'sqs.dlq'] },
  ],
}

export const F01_INT: PhaseDef = {
  ...META.f01,
  concepts: ['int.sync-async', 'sqs.what', 'sqs.visibility', 'sqs.retention-size', 'sqs.long-polling', 'sqs.dlq'],
  availability: 'available',
  simplifications: ['A livraria, os consumidores e os tempos de processamento são fictícios.', 'No laboratório, um consumidor por vez recebe cada mensagem.'],
  missions: [
    // -----------------------------------------------------------------------
    {
      id: 'int.f01.m1',
      title: 'O site que travava junto',
      type: 'mission',
      summary: 'Chamada síncrona ou assíncrona e a fila padrão do SQS.',
      briefing: {
        company: 'Livraria Página Viva',
        role: 'Você cuida da arquitetura da loja on-line de uma livraria.',
        situation: 'Ao fechar o pedido, o site chama na hora o sistema de notas fiscais, que é lento. Na Black Friday, o sistema de notas travou e levou o checkout junto: ninguém conseguiu comprar.',
        objective: 'Separar o checkout do que pode ser feito depois.',
        successCriteria: ['Usar uma fila entre o checkout e as notas', 'Separar o que precisa de resposta na hora'],
      },
      intel: [
        { conceptId: 'int.sync-async', body: ['Na chamada **síncrona**, quem pede espera e cai junto se o outro lado travar. Com uma **fila**, o checkout deixa o pedido e segue; as notas são emitidas no ritmo do sistema de notas.'] },
        { conceptId: 'sqs.what', body: ['O **SQS** guarda a mensagem até alguém **receber**, processar e **apagar**. A fila padrão aguenta qualquer pico, mas pode entregar a mesma mensagem **duas vezes** e não garante a ordem.'] },
      ],
      activities: [
        {
          id: 'int.f01.m1.a1',
          kind: 'decision',
          title: 'O checkout e as notas',
          prompt: 'O checkout não pode cair quando o sistema de notas fica lento, e a nota pode sair alguns minutos depois. O que fazer?',
          concepts: [{ id: 'int.sync-async' }, { id: 'sqs.what', weight: 0.5 }],
          xp: 40,
          difficulty: 1,
          explanation: ['Com a fila no meio, o checkout só enfileira o pedido. Se o sistema de notas trava, as mensagens esperam na fila e são processadas quando ele volta.'],
          options: [
            { id: 'a', text: 'O checkout envia o pedido a uma fila SQS, e o sistema de notas lê a fila no próprio ritmo', correct: true, consequence: 'O checkout responde na hora, e nenhum pedido se perde quando as notas atrasam.' },
            { id: 'b', text: 'Aumentar o tempo limite da chamada ao sistema de notas para 60 s', correct: false, consequence: 'O cliente espera um minuto, e o checkout continua caindo junto quando as notas travam.' },
            { id: 'c', text: 'Pôr mais instâncias no checkout', correct: false, consequence: 'O gargalo é o sistema de notas; mais checkouts só criam mais chamadas presas.' },
          ],
        },
        {
          id: 'int.f01.m1.a2',
          kind: 'classify',
          title: 'Agora ou depois',
          prompt: 'Separe o que precisa de resposta na hora do que pode ir para uma fila.',
          concepts: [{ id: 'int.sync-async' }],
          xp: 40,
          difficulty: 1,
          explanation: ['Se o cliente precisa da resposta para continuar, a chamada é síncrona. Se o trabalho pode acontecer depois, a fila desacopla.'],
          bins: [
            { id: 'sync', label: 'Resposta na hora', description: 'O cliente espera o resultado.' },
            { id: 'async', label: 'Pode ir para a fila', description: 'O trabalho acontece depois.' },
          ],
          items: [
            { id: 'cartao', text: 'Autorizar o cartão antes de mostrar "pedido confirmado"', bin: 'sync', explanation: 'O cliente precisa saber se a compra passou.', concepts: ['int.sync-async'] },
            { id: 'nota', text: 'Emitir a nota fiscal', bin: 'async', explanation: 'Pode sair minutos depois.', concepts: ['int.sync-async'] },
            { id: 'email', text: 'Enviar o e-mail de confirmação', bin: 'async', explanation: 'Ninguém espera o e-mail na tela.', concepts: ['int.sync-async'] },
            { id: 'busca', text: 'Mostrar o resultado da busca por título', bin: 'sync', explanation: 'O cliente está olhando a tela.', concepts: ['int.sync-async'] },
            { id: 'recomenda', text: 'Recalcular as recomendações do cliente', bin: 'async', explanation: 'Fica pronto para a próxima visita.', concepts: ['int.sync-async'] },
          ],
        },
      ],
      debrief: { takeaways: ['A fila separa quem pede de quem processa.', 'Fila padrão: aguenta picos, pode entregar em dobro e não garante ordem.'] },
    },
    // -----------------------------------------------------------------------
    {
      id: 'int.f01.m2',
      title: 'A nota emitida duas vezes',
      type: 'mission',
      summary: 'Tempo de visibilidade, retenção e tamanho da mensagem.',
      briefing: {
        company: 'Livraria Página Viva',
        role: 'Você acompanha a fila de notas fiscais.',
        situation: 'Depois da mudança, algumas notas saíram em dobro. O consumidor leva 45 s para emitir cada nota, e a fila ficou com as configurações padrão.',
        objective: 'Entender por que a mensagem voltou e ajustar a fila.',
        successCriteria: ['Explicar a entrega em dobro', 'Ajustar a visibilidade', 'Tratar pedidos grandes'],
      },
      intel: [
        { conceptId: 'sqs.visibility', body: ['Recebida, a mensagem fica **invisível** pelo **tempo de visibilidade** (padrão de **30 s**, até **12 h**). Se não for apagada antes, ela **volta** e outro consumidor a recebe.'] },
        { conceptId: 'sqs.retention-size', body: ['A fila guarda a mensagem por **4 dias** por padrão (de 1 minuto a 14 dias). Cada mensagem tem até **1 MiB**; acima disso, o conteúdo vai para o **S3** e a fila leva só a referência.'] },
      ],
      activities: [
        {
          id: 'int.f01.m2.a1',
          kind: 'predict',
          title: 'Visibilidade padrão',
          prompt: 'O consumidor leva 45 s para emitir a nota e apagar a mensagem. A fila está com a visibilidade padrão de 30 s. O que acontece com a mensagem?',
          concepts: [{ id: 'sqs.visibility' }],
          xp: 40,
          difficulty: 1,
          explanation: ['Aos 30 s, a mensagem volta a ficar visível, e outro consumidor a recebe enquanto o primeiro ainda trabalha: a nota sai duas vezes.'],
          spec: { sim: 'queue', run: { processSec: 45, visibilitySec: 30, attempts: ['ok'], retentionSec: 4 * DAY } },
          options: [
            { id: 'a', text: 'É processada em dobro', outcome: 'duplicated' },
            { id: 'b', text: 'É processada uma vez', outcome: 'processed' },
            { id: 'c', text: 'Vai para a DLQ', outcome: 'dlq' },
          ],
        },
        {
          id: 'int.f01.m2.a2',
          kind: 'predict',
          title: 'Visibilidade de 60 s',
          prompt: 'A equipe subiu a visibilidade para 60 s. O consumidor continua levando 45 s. E agora?',
          concepts: [{ id: 'sqs.visibility' }],
          xp: 40,
          difficulty: 1,
          explanation: ['Com 60 s, o consumidor apaga a mensagem antes de ela voltar: uma nota só.'],
          spec: { sim: 'queue', run: { processSec: 45, visibilitySec: 60, attempts: ['ok'], retentionSec: 4 * DAY } },
          options: [
            { id: 'a', text: 'É processada uma vez', outcome: 'processed' },
            { id: 'b', text: 'É processada em dobro', outcome: 'duplicated' },
            { id: 'c', text: 'Some ao fim da retenção', outcome: 'expired' },
          ],
        },
        {
          id: 'int.f01.m2.a3',
          kind: 'decision',
          title: 'O pedido da biblioteca',
          prompt: 'Uma biblioteca comprou 8.000 livros num pedido só, e a mensagem com todos os itens tem 3 MiB. A fila recusou o envio. O que fazer?',
          concepts: [{ id: 'sqs.retention-size' }],
          xp: 50,
          difficulty: 2,
          explanation: ['A mensagem do SQS tem até 1 MiB. O padrão para cargas maiores é guardar o conteúdo no S3 e enviar na fila só a referência ao objeto.'],
          options: [
            { id: 'a', text: 'Guardar a lista de itens no S3 e enviar na fila só a referência ao objeto', correct: true, consequence: 'A mensagem fica pequena, e o consumidor busca a lista no S3.' },
            { id: 'b', text: 'Aumentar o tamanho máximo da fila para 4 MiB', correct: false, consequence: 'O limite da mensagem é 1 MiB.' },
            { id: 'c', text: 'Aumentar a retenção para 14 dias', correct: false, consequence: 'A retenção é o tempo de guarda, não o tamanho.' },
          ],
        },
      ],
      debrief: { takeaways: ['Visibilidade menor que o processamento: entrega em dobro.', 'Até 1 MiB por mensagem; acima disso, S3 com referência na fila.'] },
    },
    // -----------------------------------------------------------------------
    {
      id: 'int.f01.m3',
      title: 'A mensagem que nunca dava certo',
      type: 'mission',
      summary: 'Long polling e a fila de mensagens mortas.',
      briefing: {
        company: 'Livraria Página Viva',
        role: 'Você revisa o custo e a saúde das filas.',
        situation: 'A conta do SQS veio alta, com milhões de recebimentos vazios. E um pedido com o CEP inválido volta à fila há dias, travando um consumidor de tempos em tempos.',
        objective: 'Cortar as chamadas vazias e tirar da fila as mensagens que nunca vão dar certo.',
        successCriteria: ['Ligar o long polling', 'Configurar a DLQ com o maxReceiveCount certo'],
      },
      intel: [
        { conceptId: 'sqs.long-polling', body: ['Com **long polling**, o recebimento espera até **20 s** por mensagens antes de responder vazio: menos chamadas e menos custo.'] },
        { conceptId: 'sqs.dlq', body: ['A **DLQ** recebe a mensagem depois de **maxReceiveCount** recebimentos sem exclusão. Sem DLQ, a mensagem com defeito volta até o fim da retenção. Corrigido o problema, o **redrive** a devolve à fila.'] },
      ],
      activities: [
        {
          id: 'int.f01.m3.a1',
          kind: 'decision',
          title: 'As chamadas vazias',
          prompt: 'Os consumidores consultam a fila em laço e recebem resposta vazia na maior parte das vezes. Como reduzir o custo sem atrasar o processamento?',
          concepts: [{ id: 'sqs.long-polling' }],
          xp: 40,
          difficulty: 1,
          explanation: ['Com long polling (WaitTimeSeconds de até 20 s), cada chamada espera chegar mensagem, e as respostas vazias caem muito.'],
          options: [
            { id: 'a', text: 'Ligar o long polling com espera de 20 s', correct: true, consequence: 'Menos chamadas, e a mensagem é entregue assim que chega.' },
            { id: 'b', text: 'Pôr um intervalo fixo de 5 minutos entre as consultas', correct: false, consequence: 'Corta custo, mas atrasa os pedidos em até 5 minutos.' },
            { id: 'c', text: 'Aumentar o tempo de visibilidade', correct: false, consequence: 'A visibilidade não muda as respostas vazias.' },
          ],
        },
        {
          id: 'int.f01.m3.a2',
          kind: 'predict',
          title: 'O CEP inválido com DLQ',
          prompt: 'A fila de notas tem DLQ com maxReceiveCount 3. A mensagem com CEP inválido falha toda vez. O que acontece com ela?',
          concepts: [{ id: 'sqs.dlq' }],
          xp: 40,
          difficulty: 1,
          explanation: ['Depois do terceiro recebimento sem exclusão, a mensagem vai para a DLQ e para de ocupar o consumidor.'],
          spec: { sim: 'queue', run: { processSec: 10, visibilitySec: 60, attempts: ['fail'], maxReceiveCount: 3, retentionSec: 4 * DAY } },
          options: [
            { id: 'a', text: 'Vai para a DLQ', outcome: 'dlq' },
            { id: 'b', text: 'Some ao fim da retenção', outcome: 'expired' },
            { id: 'c', text: 'É processada em dobro', outcome: 'duplicated' },
          ],
        },
        {
          id: 'int.f01.m3.a3',
          kind: 'predict',
          title: 'Sem DLQ',
          prompt: 'Na fila de e-mails, que não tem DLQ e guarda mensagens por 1 hora, uma mensagem com endereço malformado falha toda vez. O que acontece com ela?',
          concepts: [{ id: 'sqs.dlq' }, { id: 'sqs.retention-size', weight: 0.5 }],
          xp: 40,
          difficulty: 2,
          explanation: ['Sem DLQ, a mensagem volta a cada fim de visibilidade até a retenção acabar, e então é apagada sem ninguém ver.'],
          spec: { sim: 'queue', run: { processSec: 2, visibilitySec: 30, attempts: ['fail'], retentionSec: 3600 } },
          options: [
            { id: 'a', text: 'Some ao fim da retenção', outcome: 'expired' },
            { id: 'b', text: 'Vai para a DLQ', outcome: 'dlq' },
            { id: 'c', text: 'É processada uma vez', outcome: 'processed' },
          ],
        },
        {
          id: 'int.f01.m3.a4',
          kind: 'predict',
          title: 'maxReceiveCount baixo demais',
          prompt: 'A emissão de notas falha às vezes por instabilidade do sistema da prefeitura e dá certo na terceira tentativa. A DLQ está com maxReceiveCount 2. O que acontece com essa nota?',
          concepts: [{ id: 'sqs.dlq' }],
          xp: 50,
          difficulty: 2,
          explanation: ['Com maxReceiveCount 2, a mensagem vai para a DLQ antes da terceira tentativa, que daria certo. O valor precisa caber as falhas passageiras.'],
          spec: { sim: 'queue', run: { processSec: 45, visibilitySec: 60, attempts: ['fail', 'fail', 'ok'], maxReceiveCount: 2, retentionSec: 4 * DAY } },
          options: [
            { id: 'a', text: 'Vai para a DLQ', outcome: 'dlq' },
            { id: 'b', text: 'É processada uma vez', outcome: 'processed' },
            { id: 'c', text: 'É processada em dobro', outcome: 'duplicated' },
          ],
        },
      ],
      debrief: { takeaways: ['Long polling: menos respostas vazias, menos custo.', 'DLQ com maxReceiveCount que caiba as falhas passageiras.', 'Sem DLQ, a mensagem com defeito some ao fim da retenção.'] },
    },
    // -----------------------------------------------------------------------
    {
      id: 'int.f01.boss',
      title: 'As filas da livraria',
      type: 'boss',
      summary: 'Visibilidade e DLQ de quatro consumidores.',
      briefing: {
        company: 'Livraria Página Viva',
        role: 'Você fecha a configuração das filas antes da próxima Black Friday.',
        situation: 'Quatro consumidores leem quatro filas. Cada um tem um tempo de processamento e um jeito de falhar, e todos recebem de vez em quando uma mensagem com defeito.',
        objective: 'Escolher a visibilidade e a DLQ de cada fila para que cada mensagem boa seja processada uma vez e as com defeito saiam da fila.',
        successCriteria: ['Nenhuma entrega em dobro por visibilidade curta', 'Nenhuma mensagem boa na DLQ', 'Nenhuma mensagem com defeito presa na fila'],
      },
      intel: [{ conceptId: 'sqs.dlq', body: ['A visibilidade precisa cobrir o processamento, sem exagero: quanto maior, mais demora a nova tentativa quando há falha. O maxReceiveCount precisa caber as falhas passageiras.'] }],
      activities: [
        {
          id: 'int.f01.boss.a1',
          kind: 'lab',
          lab: 'queue',
          title: 'As quatro filas',
          prompt: 'Para cada consumidor, escolha o tempo de visibilidade e a DLQ. Depois da verificação, cada cartão mostra o que acontece com as mensagens.',
          concepts: [{ id: 'sqs.visibility' }, { id: 'sqs.dlq' }],
          xp: 200,
          difficulty: 3,
          hints: ['Escolha a menor visibilidade que cobre o processamento.', 'Uma mensagem boa que falha N vezes precisa de N + 1 recebimentos.'],
          explanation: ['Notas: 60 s e maxReceiveCount 3. E-mails: 30 s e 1. Capas: 120 s e 3 (a menor opção que cobre duas tentativas). Estoque: 300 s e 5.', 'Sem DLQ, as mensagens com defeito ficariam voltando até o fim da retenção.'],
          config: PAGINA_FILAS,
        },
      ],
      debrief: { takeaways: ['Visibilidade: a menor que cobre o processamento.', 'maxReceiveCount: falhas passageiras mais um.'] },
    },
  ],
}
