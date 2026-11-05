/**
 * Questões da Revisão da Fase 2 de Integração (SQS em escala), no formato do
 * exame SAA-C03. Fatos conferidos em docs.aws.amazon.com (ver
 * docs/VERIFICACAO-DE-CONTEUDO.md). As empresas são fictícias.
 */
import type { ReviewSet } from '../../../../engine/types'

export const REVIEW_F02: ReviewSet = {
  phaseId: 'int.f02',
  questions: [
    {
      id: 'rv:int.f02.m1.a1',
      kind: 'decision',
      title: 'O grupo de mensagens dos pedidos',
      prompt:
        'Uma bilheteria usa uma fila FIFO em que cada pedido gera três mensagens: reserva, cobrança e emissão do ingresso, que precisam ser processadas **nessa ordem**. Pedidos diferentes devem andar **em paralelo**, para a fila aguentar a abertura das vendas. Qual valor usar como **MessageGroupId**?',
      concepts: [{ id: 'sqs.fifo' }],
      xp: 5,
      difficulty: 2,
      domain: 'd2',
      options: [
        { id: 'a', text: 'Um valor fixo, "pedidos", para todas as mensagens.', correct: false, consequence: 'Tudo fica em ordem, mas um pedido de cada vez: a fila vira um gargalo.' },
        { id: 'b', text: 'Um valor aleatório em cada mensagem.', correct: false, consequence: 'Cada mensagem fica num grupo: a ordem dentro do pedido se perde.' },
        { id: 'c', text: 'O tipo da mensagem: reserva, cobrança ou emissão.', correct: false, consequence: 'Mistura pedidos no mesmo grupo e separa as etapas de um mesmo pedido.' },
        { id: 'd', text: 'O número do pedido.', correct: true, consequence: 'As etapas de cada pedido ficam em ordem, e pedidos diferentes andam em paralelo.' },
      ],
      explanation: [
        'A fila **FIFO** entrega na ordem de entrada **dentro de cada grupo de mensagens** (MessageGroupId) e processa cada mensagem exatamente uma vez. **Grupos diferentes andam em paralelo**; dentro de um grupo, a próxima mensagem só sai depois que a anterior é apagada. O grupo certo é a entidade que precisa de ordem: o pedido.',
        'Um grupo só serializa tudo. Grupos aleatórios ou por tipo perdem a ordem do pedido.',
        '**Regra prática:** use como grupo a entidade que precisa de ordem (pedido, cliente, conta); quanto mais grupos, mais paralelismo.',
      ],
    },
    {
      id: 'rv:int.f02.fila-padrao-para-fifo',
      kind: 'decision',
      title: 'A ordem passou a importar',
      prompt:
        'Uma fila **padrão** do SQS recebe as atualizações de saldo das contas. Uma mudança de regra passou a exigir que as atualizações de cada conta sejam processadas **na ordem** e **sem duplicidade**. A equipe quer mudar com o menor risco. Qual caminho atende?',
      concepts: [{ id: 'sqs.fifo' }],
      xp: 5,
      difficulty: 1,
      domain: 'd2',
      options: [
        { id: 'a', text: 'Mudar o tipo da fila atual de padrão para FIFO nas configurações.', correct: false, consequence: 'Uma fila padrão não vira FIFO: o tipo é definido na criação.' },
        { id: 'b', text: 'Criar uma fila FIFO nova e migrar para ela.', correct: true, consequence: 'A fila nova entrega na ordem por conta e sem duplicidade.' },
        { id: 'c', text: 'Manter a fila padrão com um consumidor só, para garantir a ordem.', correct: false, consequence: 'A fila padrão não garante a ordem nem evita duplicatas, mesmo com um consumidor.' },
        { id: 'd', text: 'Ligar o long polling na fila padrão.', correct: false, consequence: 'Reduz respostas vazias; não muda ordem nem duplicidade.' },
      ],
      explanation: [
        'Ordem garantida e processamento sem duplicidade são da **fila FIFO**. Mas **uma fila padrão não vira FIFO**: é preciso **criar outra fila**, cujo nome termina em **.fifo**, e migrar produtores e consumidores, usando a conta como grupo de mensagens.',
        'Não há troca de tipo. A fila padrão tem ordem de melhor esforço e entrega pelo menos uma vez, com qualquer número de consumidores. E o long polling não muda isso.',
        '**Regra prática:** "ordem garantida" e "sem processamento duplicado" pedem FIFO, numa fila criada assim.',
      ],
    },
    {
      id: 'rv:int.f02.fifo-sem-precisar',
      kind: 'decision',
      title: 'Notificações numa fila FIFO',
      prompt:
        'Uma equipe passou a usar **fila FIFO** para notificações de marketing **por padrão**, "para garantir". A ordem entre as notificações **não importa**, o consumidor já ignora repetições, e nos picos a fila **não dá conta da vazão**. A empresa quer o **menor custo** e a maior vazão. Qual mudança atende?',
      concepts: [{ id: 'sqs.fifo' }],
      xp: 5,
      difficulty: 2,
      domain: 'd4',
      options: [
        { id: 'a', text: 'Ligar o modo de alta vazão da FIFO e manter tudo como está.', correct: false, consequence: 'Ganha vazão, mas continua pagando a FIFO por garantias que ninguém usa.' },
        { id: 'b', text: 'Pôr todas as notificações num grupo de mensagens só.', correct: false, consequence: 'Serializa todas as notificações e piora ainda mais a vazão.' },
        { id: 'c', text: 'Uma fila padrão, com o consumidor atual.', correct: true, consequence: 'A fila padrão tem vazão praticamente ilimitada e custa menos.' },
        { id: 'd', text: 'Criar uma fila FIFO por cliente.', correct: false, consequence: 'Multiplica filas para manter, sem precisar de ordem.' },
      ],
      explanation: [
        'A fila **FIFO** existe para **ordem** e **deduplicação**, com vazão limitada por grupo e preço maior. Sem precisar de ordem e com o consumidor tratando repetições, a **fila padrão** atende com **vazão praticamente ilimitada** e custo menor.',
        'O modo de alta vazão mantém o custo da FIFO sem necessidade. Um grupo só piora. E filas por cliente multiplicam a operação.',
        '**Regra prática:** use FIFO só quando o requisito pede ordem ou exatamente uma vez; caso contrário, fila padrão com consumidor idempotente.',
      ],
    },
    {
      id: 'rv:int.f02.m2.a2',
      kind: 'decision',
      title: 'O mesmo pedido dez minutos depois',
      prompt:
        'Numa fila FIFO, um app envia o pedido 42 com ID de deduplicação **"pedido-42"**. O cliente volta **10 minutos depois**, e o app reenvia o mesmo pedido com o **mesmo ID**. A equipe achava que a fila descartaria o segundo envio. O que acontece, e o que a equipe deve garantir?',
      concepts: [{ id: 'sqs.dedup' }],
      xp: 5,
      difficulty: 3,
      domain: 'd2',
      options: [
        { id: 'a', text: 'O segundo envio é descartado, como qualquer ID repetido.', correct: false, consequence: 'A deduplicação vale só dentro de uma janela de 5 minutos.' },
        { id: 'b', text: 'A fila recusa o envio com erro de ID repetido.', correct: false, consequence: 'A fila não recusa; dentro da janela, aceita e não entrega de novo.' },
        { id: 'c', text: 'Os dois entram; o consumidor trata a repetição.', correct: true, consequence: 'Fora dos 5 minutos, o mesmo ID entra de novo, e a proteção fica com o consumidor.' },
        { id: 'd', text: 'Só o segundo envio entra, substituindo o primeiro.', correct: false, consequence: 'O primeiro envio já foi entregue; nada é substituído.' },
      ],
      explanation: [
        'Na fila FIFO, uma mensagem enviada de novo com o **mesmo ID de deduplicação dentro de 5 minutos** é aceita, mas **não é entregue outra vez**. **Depois dos 5 minutos**, o mesmo ID entra como mensagem nova. O ID vem do produtor ou, com a deduplicação por conteúdo, de um hash do corpo.',
        'Não há descarte fora da janela, nem recusa, nem substituição.',
        '**Regra prática:** a deduplicação da FIFO cobre reenvios rápidos; repetições mais espaçadas pedem um consumidor idempotente.',
      ],
    },
    {
      id: 'rv:int.f02.m2.a3',
      kind: 'decision',
      title: 'A abertura das vendas',
      prompt:
        'Na abertura das vendas, uma fila **FIFO** vai receber cerca de **2.000 pedidos por segundo**, hoje **um por chamada**, espalhados por **milhares de clientes**, cada um com o próprio grupo de mensagens. A configuração padrão não dá conta. Quais mudanças aumentam a vazão? (Escolha DUAS.)',
      concepts: [{ id: 'sqs.fifo-throughput' }],
      xp: 5,
      difficulty: 2,
      domain: 'd3',
      multiple: true,
      options: [
        { id: 'a', text: 'Ligar o modo de alta vazão da fila FIFO.', correct: true, consequence: 'Com as mensagens espalhadas por muitos grupos, a fila aguenta muito mais.' },
        { id: 'b', text: 'Enviar os pedidos em lotes de 10 mensagens.', correct: true, consequence: 'Cada transação leva até 10 mensagens, multiplicando o que passa por segundo.' },
        { id: 'c', text: 'Pôr todos os pedidos num grupo de mensagens só.', correct: false, consequence: 'Serializa todos os pedidos e piora a vazão.' },
        { id: 'd', text: 'Transformar a fila numa fila com atraso de 1 minuto.', correct: false, consequence: 'O atraso só adia a entrega; não aumenta a vazão.' },
        { id: 'e', text: 'Ligar o long polling nos consumidores.', correct: false, consequence: 'Reduz respostas vazias; não muda o limite de envio.' },
      ],
      explanation: [
        'Sem lote, a fila FIFO aceita **300 transações por segundo por ação**; com **lotes de 10**, até 3.000 mensagens por segundo. O **modo de alta vazão** sobe esse limite (o valor varia por Região), **desde que as mensagens se espalhem por muitos grupos**, como aqui.',
        'Um grupo só serializa. Atraso e long polling não mudam o limite de envio.',
        '**Regra prática:** FIFO lenta: envie em lotes, ligue o modo de alta vazão e espalhe as mensagens por muitos grupos.',
      ],
    },
    {
      id: 'rv:int.f02.m2.a4:assento',
      kind: 'decision',
      title: 'Checar o pagamento dez minutos depois',
      prompt:
        'Cada reserva de assento gera uma mensagem numa fila **padrão** do SQS. O consumidor deve **checar o pagamento só 10 minutos depois** da reserva; antes disso, a mensagem não pode ser entregue a ninguém. Qual configuração atende?',
      concepts: [{ id: 'sqs.delay' }],
      xp: 5,
      difficulty: 2,
      domain: 'd2',
      options: [
        { id: 'a', text: 'Tempo de visibilidade de 10 minutos.', correct: false, consequence: 'A visibilidade esconde a mensagem depois de recebida; antes, ela é entregue na hora.' },
        { id: 'b', text: 'Atraso de 10 minutos.', correct: true, consequence: 'A mensagem fica escondida por 10 minutos antes da primeira entrega.' },
        { id: 'c', text: 'Retenção de 10 minutos na fila.', correct: false, consequence: 'A mensagem seria apagada depois de 10 minutos, sem ser checada.' },
        { id: 'd', text: 'Long polling com espera de 10 minutos.', correct: false, consequence: 'A espera máxima do long polling é de 20 s, e ele não adia a entrega.' },
      ],
      explanation: [
        'A **fila com atraso** esconde cada mensagem nova por **0 a 15 minutos antes da primeira entrega**; o **temporizador** faz o mesmo para uma mensagem só, na fila padrão. A **visibilidade** esconde a mensagem **depois** de recebida; o atraso, **antes**.',
        'Visibilidade, retenção e long polling não adiam a primeira entrega.',
        '**Regra prática:** "não entregar antes de X minutos" é atraso; "não deixar outro consumidor pegar enquanto processo" é visibilidade. Na FIFO, o atraso é da fila inteira.',
      ],
    },
    {
      id: 'rv:int.f02.m3.a1',
      kind: 'decision',
      title: 'A visibilidade de uma fila lida pelo Lambda',
      prompt:
        'Uma função Lambda com **tempo limite de 30 s** lê uma fila do SQS por um mapeamento de origem de eventos. Algumas mensagens são **processadas em dobro** quando o Lambda tenta de novo. A fila está com visibilidade de 30 s. Qual valor a AWS **recomenda** para a visibilidade?',
      concepts: [{ id: 'sqs.lambda' }],
      xp: 5,
      difficulty: 1,
      domain: 'd2',
      options: [
        { id: 'a', text: 'Manter 30 s, igual ao tempo limite.', correct: false, consequence: 'Em novas tentativas, a mensagem volta à fila enquanto ainda está sendo processada.' },
        { id: 'b', text: '60 s, o dobro do tempo limite.', correct: false, consequence: 'Abaixo da recomendação, que dá margem para as novas tentativas do Lambda.' },
        { id: 'c', text: '180 s ou mais.', correct: true, consequence: 'É pelo menos seis vezes o tempo limite da função, como a AWS recomenda.' },
        { id: 'd', text: '0 s, para as mensagens voltarem logo.', correct: false, consequence: 'A mensagem volta na hora para outro consumidor.' },
      ],
      explanation: [
        'Com o **Lambda lendo do SQS**, a AWS recomenda **visibilidade de pelo menos seis vezes o tempo limite da função**: 6 × 30 s = **180 s**. Isso dá margem para o Lambda tentar de novo quando a função é limitada, sem a mensagem voltar à fila enquanto ainda está em processamento. Também recomenda maxReceiveCount de pelo menos 5, com DLQ.',
        'Valores iguais ou pouco maiores que o tempo limite deixam a duplicação acontecer. E zero devolve a mensagem na hora.',
        '**Regra prática:** Lambda com SQS: visibilidade de 6 vezes o tempo limite, maxReceiveCount de 5 ou mais com DLQ, e concorrência máxima para proteger o destino.',
      ],
    },
    {
      id: 'rv:int.f02.m3.a3',
      kind: 'decision',
      title: 'O banco sem conexões no pico',
      prompt:
        'Num pico, a fila do antifraude acumulou **50.000 mensagens**, e o Lambda subiu tantas funções que o **banco relacional do antifraude ficou sem conexões**. O processamento pode atrasar alguns minutos, mas nenhuma mensagem pode se perder. Qual mudança protege o banco?',
      concepts: [{ id: 'sqs.lambda' }],
      xp: 5,
      difficulty: 2,
      domain: 'd2',
      options: [
        { id: 'a', text: 'Aumentar o tamanho do lote para 10.000 mensagens.', correct: false, consequence: 'Muda quantas mensagens cada função recebe, não quantas funções rodam ao mesmo tempo.' },
        { id: 'b', text: 'Diminuir a retenção da fila para 1 hora.', correct: false, consequence: 'Mensagens do pico seriam apagadas antes de processadas.' },
        { id: 'c', text: 'Tirar a fila e chamar a função direto do produtor.', correct: false, consequence: 'O pico chegaria inteiro ao banco, sem amortecedor.' },
        { id: 'd', text: 'Concorrência máxima no mapeamento.', correct: true, consequence: 'O banco recebe no máximo aquelas funções ao mesmo tempo; o resto do pico espera na fila.' },
      ],
      explanation: [
        'Na fila padrão, o Lambda começa com 5 consumidores e cresce rápido. A **concorrência máxima do mapeamento** (de 2 a 1.000) **limita quantas funções a fila pode chamar ao mesmo tempo**: o banco recebe uma carga que aguenta, e o excesso espera, guardado, na fila.',
        'O tamanho do lote não limita funções. Retenção curta perde mensagens. E tirar a fila acaba com o amortecedor.',
        '**Regra prática:** para proteger um destino frágil de um Lambda que lê do SQS, limite a concorrência máxima do mapeamento.',
      ],
    },
    {
      id: 'rv:int.f02.fifo-com-um-grupo',
      kind: 'decision',
      title: 'Uma fila FIFO que não acelera',
      prompt:
        'Uma fila **FIFO** de atualizações de estoque é lida por uma função Lambda. Todas as mensagens usam o **mesmo MessageGroupId**, e a fila acumula atraso: o Lambda **processa um lote de cada vez**, por mais mensagens que cheguem. A ordem só importa **por produto**. Qual mudança aumenta o paralelismo?',
      concepts: [{ id: 'sqs.lambda' }],
      xp: 5,
      difficulty: 3,
      domain: 'd3',
      options: [
        { id: 'a', text: 'Aumentar a concorrência máxima do mapeamento para 1.000.', correct: false, consequence: 'Na FIFO, a concorrência fica limitada ao número de grupos; com um grupo, continua um de cada vez.' },
        { id: 'b', text: 'Usar o código do produto como grupo de mensagens.', correct: true, consequence: 'Com muitos grupos, o Lambda processa produtos diferentes em paralelo, mantendo a ordem de cada um.' },
        { id: 'c', text: 'Aumentar o tempo limite da função para 15 minutos.', correct: false, consequence: 'A função ganha tempo, mas continua processando um lote por vez.' },
        { id: 'd', text: 'Aumentar o tamanho do lote para 10.000 mensagens.', correct: false, consequence: 'Na FIFO, o lote do Lambda vai até 10 mensagens, e o grupo único segue serializando.' },
      ],
      explanation: [
        'Com a fila **FIFO**, a **concorrência do Lambda fica limitada ao número de grupos de mensagens**: dentro de um grupo, a próxima mensagem só sai depois que a anterior é apagada. Com um grupo só, tudo é serializado. Usando o **produto** como grupo, a ordem por produto se mantém, e produtos diferentes andam em paralelo.',
        'Concorrência máxima, tempo limite e tamanho do lote não superam o limite de um grupo. Na FIFO, o lote vai até 10 mensagens.',
        '**Regra prática:** FIFO lenta com Lambda é, quase sempre, poucos grupos; espalhe pela entidade que precisa de ordem.',
      ],
    },
    {
      id: 'rv:int.f02.m3.a2',
      kind: 'decision',
      title: 'Uma mensagem ruim num lote de cem',
      prompt:
        'Uma função Lambda recebe lotes de **100 mensagens** do SQS. Quando **uma** delas falha, a função lança erro, e o **lote inteiro volta** à fila, reprocessando as 99 que já tinham dado certo. A empresa quer reprocessar **só a mensagem que falhou**. O que mudar?',
      concepts: [{ id: 'sqs.partial-batch' }],
      xp: 5,
      difficulty: 2,
      domain: 'd2',
      options: [
        { id: 'a', text: 'Reduzir o lote para uma mensagem por invocação.', correct: false, consequence: 'Funciona, mas multiplica as invocações e o custo.' },
        { id: 'b', text: 'Apagar o lote inteiro mesmo com a falha.', correct: false, consequence: 'A mensagem que falhou se perde sem nova tentativa.' },
        { id: 'c', text: 'Ligar o ReportBatchItemFailures.', correct: true, consequence: 'O Lambda apaga as 99 que deram certo, e só a falha volta à fila.' },
        { id: 'd', text: 'Aumentar o maxReceiveCount da fila para 10.', correct: false, consequence: 'Muda quando a mensagem vai para a DLQ, não o reprocessamento do lote.' },
      ],
      explanation: [
        'Se uma mensagem do lote falha e a função devolve erro, **o lote inteiro volta à fila**, inclusive as mensagens que deram certo. Com **ReportBatchItemFailures**, a função informa só as que falharam (em batchItemFailures), e o **Lambda apaga as outras**.',
        'Lote de uma mensagem custa mais. Apagar tudo perde a falha. E o maxReceiveCount não muda o reprocessamento.',
        '**Regra prática:** "uma mensagem com erro faz o lote inteiro ser reprocessado" pede ReportBatchItemFailures.',
      ],
    },
  ],
}
