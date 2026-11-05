/**
 * Questões da Revisão da Fase 9 de Integração (padrões e escolha), no formato
 * do exame SAA-C03. Fatos conferidos em docs.aws.amazon.com (ver
 * docs/VERIFICACAO-DE-CONTEUDO.md). As empresas são fictícias.
 */
import type { ReviewSet } from '../../../../engine/types'

export const REVIEW_F09: ReviewSet = {
  phaseId: 'int.f09',
  questions: [
    {
      id: 'rv:int.f09.m1.a1',
      kind: 'decision',
      title: 'Uma devolução com prazos e desfazer',
      prompt:
        'A devolução de produtos de um marketplace passa por quatro serviços (coleta, vistoria, estorno e estoque), hoje em **coreografia**: cada um reage aos eventos dos outros. O processo tem **ordem**, **prazos** e precisa **desfazer passos** quando a vistoria reprova, e ninguém consegue dizer **em que passo cada devolução está**. Como organizar?',
      concepts: [{ id: 'int.choreography-orchestration' }],
      xp: 5,
      difficulty: 2,
      domain: 'd2',
      options: [
        { id: 'a', text: 'Manter a coreografia e pedir a cada time que trate a reprovação.', correct: false, consequence: 'A lógica de desfazer e os prazos ficam espalhados em quatro serviços.' },
        { id: 'b', text: 'Orquestrar com o Step Functions.', correct: true, consequence: 'Cada devolução tem histórico num lugar só, com prazos e compensações tratados pelo fluxo.' },
        { id: 'c', text: 'Uma transação de banco que cubra os quatro serviços.', correct: false, consequence: 'Cada serviço tem o próprio banco: não existe essa transação.' },
        { id: 'd', text: 'Um tópico do SNS para todos os eventos da devolução.', correct: false, consequence: 'Distribui os eventos, mas continua sem coordenador nem estado do processo.' },
      ],
      explanation: [
        'Na **coreografia**, cada serviço reage aos eventos dos outros, sem coordenador: não há ponto único de falha, mas o fluxo fica difícil de acompanhar, e prazos e novas tentativas se espalham. Na **orquestração**, um coordenador, como o **Step Functions**, chama cada passo e **trata os erros num só lugar**, com as compensações.',
        'Tratar a reprovação em cada time espalha a lógica. Não há transação entre bancos separados. E o SNS não coordena.',
        '**Regra prática:** "acompanhar o estado num lugar só", "prazos" e "compensação" apontam para orquestração com Step Functions.',
      ],
    },
    {
      id: 'rv:int.f09.m1.a3',
      kind: 'decision',
      title: 'Um nome novo para avisar a dois serviços',
      prompt:
        'Quando um vendedor **muda o nome da loja**, a busca e o painel de vendas precisam atualizar. **Não há ordem** entre eles, **nada a desfazer**, e novos serviços podem passar a reagir no futuro sem mudar o serviço de cadastro. Como organizar com o **menor esforço**?',
      concepts: [{ id: 'int.choreography-orchestration' }],
      xp: 5,
      difficulty: 2,
      domain: 'd2',
      options: [
        { id: 'a', text: 'Um fluxo do Step Functions com Retry e Catch para cada serviço.', correct: false, consequence: 'Funciona, mas é um coordenador para manter num caso que não precisa.' },
        { id: 'b', text: 'O cadastro chamando a busca e o painel diretamente, em sequência.', correct: false, consequence: 'Prende o cadastro aos serviços atuais e a cada serviço novo.' },
        { id: 'c', text: 'Um evento "Loja renomeada" no EventBridge, e cada serviço reage.', correct: true, consequence: 'Simples, sem coordenador, e um serviço novo só cria a própria regra.' },
        { id: 'd', text: 'Uma fila SQS única lida pela busca e pelo painel.', correct: false, consequence: 'Cada mensagem iria para um só dos dois serviços, e o outro não atualizaria.' },
      ],
      explanation: [
        'Passos **independentes**, sem ordem nem compensação, combinam com **coreografia**: o cadastro publica um evento no **EventBridge**, e cada serviço reage com a própria regra. Novos consumidores se juntam sem mudar quem publica.',
        'Um orquestrador é peso desnecessário. Chamadas diretas acoplam. E uma fila única entrega a um só consumidor.',
        '**Regra prática:** serviços independentes reagindo a um evento, coreografia com EventBridge; passos coordenados com compensação, orquestração com Step Functions.',
      ],
    },
    {
      id: 'rv:int.f09.saga-sem-transacao',
      kind: 'decision',
      title: 'Consistência entre três bancos',
      prompt:
        'Uma reserva de viagem atravessa três serviços, **cada um com o próprio banco**: voo, hotel e cobrança. Se a cobrança falhar, o voo e o hotel já reservados precisam ser **cancelados**. Um arquiteto propõe uma **transação única** que cubra os três bancos. Qual abordagem a AWS recomenda?',
      concepts: [{ id: 'int.saga' }],
      xp: 5,
      difficulty: 3,
      domain: 'd2',
      options: [
        { id: 'a', text: 'A transação única entre os três bancos, como proposto.', correct: false, consequence: 'Com bancos separados por serviço, não existe uma transação única que cubra todos.' },
        { id: 'b', text: 'Juntar os três serviços num banco só, para ter uma transação.', correct: false, consequence: 'Desfaz a separação dos serviços para resolver um problema que a saga resolve.' },
        { id: 'c', text: 'Uma saga orquestrada pelo Step Functions, com compensações.', correct: true, consequence: 'Os passos rodam um a um, e a falha da cobrança dispara o cancelamento do voo e do hotel.' },
        { id: 'd', text: 'Tentar a cobrança até dar certo, sem cancelar nada.', correct: false, consequence: 'Um cartão recusado nunca dá certo, e as reservas ficam presas.' },
      ],
      explanation: [
        'Quando um processo atravessa **vários serviços, cada um com seu banco**, **não existe uma transação única**. A **saga** executa os passos um a um e, se um falha, roda **transações de compensação** que desfazem os anteriores (cancelar o voo, liberar o hotel). A AWS cita o **Step Functions** para orquestrar sagas.',
        'A transação única não existe aqui. Juntar os bancos desfaz a arquitetura. E repetir um erro permanente não resolve.',
        '**Regra prática:** "consistência de um processo distribuído entre serviços com bancos separados" é saga, em geral com Step Functions.',
      ],
    },
    {
      id: 'rv:int.f09.m2.a2:saldo',
      kind: 'decision',
      title: 'O que precisa de proteção contra repetição',
      prompt:
        'Os consumidores de uma fila padrão podem receber **a mesma mensagem mais de uma vez**. A equipe quer proteger contra repetição **só as operações em que repetir faz mal**. Quais operações precisam de proteção? (Escolha DUAS.)',
      concepts: [{ id: 'int.idempotency' }],
      xp: 5,
      difficulty: 2,
      domain: 'd2',
      multiple: true,
      options: [
        { id: 'a', text: 'Somar R$ 50 ao saldo do vendedor.', correct: true, consequence: 'Duas vezes somam R$ 100: precisa de proteção.' },
        { id: 'b', text: 'Enviar o e-mail de confirmação ao cliente.', correct: true, consequence: 'O cliente recebe dois e-mails: precisa de proteção.' },
        { id: 'c', text: 'Gravar o status do pedido como "enviado".', correct: false, consequence: 'Gravar duas vezes deixa o mesmo status: já é idempotente.' },
        { id: 'd', text: 'Substituir o endereço de entrega pelo novo.', correct: false, consequence: 'O resultado é o mesmo, uma ou duas vezes: já é idempotente.' },
        { id: 'e', text: 'Ler o nome do produto para montar a nota.', correct: false, consequence: 'Ler não muda nenhum dado: repetir não faz mal.' },
      ],
      explanation: [
        'Como fila padrão, SNS, EventBridge e Lambda **entregam pelo menos uma vez**, o consumidor precisa ser **idempotente**: processar a mesma mensagem duas vezes tem **o mesmo efeito** de processar uma. Operações que **somam** ou **enviam** algo mudam o resultado a cada repetição; as que **gravam um valor final** ou só leem, não.',
        'Status, substituição e leitura já são idempotentes por natureza.',
        '**Regra prática:** pergunte "se rodar duas vezes, o resultado muda?". Se muda, guarde o ID da mensagem já tratada e ignore as repetidas.',
      ],
    },
    {
      id: 'rv:int.f09.m2.a1',
      kind: 'decision',
      title: 'Pontos de fidelidade em dobro',
      prompt:
        'Uma regra do EventBridge entrega cada compra a uma função Lambda que **soma pontos de fidelidade** ao cliente. Raramente, a mesma compra chega **duas vezes** à função, e o cliente ganha **pontos em dobro**. A empresa quer acabar com isso **sem perder eventos**. Qual mudança atende?',
      concepts: [{ id: 'int.idempotency' }],
      xp: 5,
      difficulty: 2,
      domain: 'd2',
      options: [
        { id: 'a', text: 'Trocar o EventBridge por um tópico do SNS.', correct: false, consequence: 'O SNS também entrega pelo menos uma vez; a repetição continua possível.' },
        { id: 'b', text: 'Desligar as novas tentativas da regra para a função.', correct: false, consequence: 'Eventos que falham deixariam de ser entregues, e eventos seriam perdidos.' },
        { id: 'c', text: 'Aumentar a memória da função Lambda.', correct: false, consequence: 'Deixa a função mais rápida, mas não muda quantas vezes o evento chega.' },
        { id: 'd', text: 'Guardar o ID das compras já pontuadas.', correct: true, consequence: 'A função vira idempotente: a repetição não soma pontos de novo.' },
      ],
      explanation: [
        'Fila padrão, **SNS, EventBridge e Lambda entregam pelo menos uma vez**. Sempre que o enunciado relata **processamento duplicado** com esses serviços, a resposta inclui tornar o **consumidor idempotente**: guardar o ID de cada mensagem já tratada e ignorar as repetidas.',
        'Trocar de serviço mantém a mesma garantia. Desligar novas tentativas perde eventos. E memória não muda a entrega.',
        '**Regra prática:** duplicata com SQS padrão, SNS, EventBridge ou Lambda pede consumidor idempotente.',
      ],
    },
    {
      id: 'rv:int.f09.m3.a1',
      kind: 'decision',
      title: 'Um banco grande para um dia por mês',
      prompt:
        'No dia de fechamento, uma vez por mês, os pedidos chegam **dez vezes mais rápido** e o banco relacional **estoura as conexões**. Nos outros dias, ele sobra. A equipe propôs **dimensionar o banco para o pico** o mês inteiro. Os pedidos podem ser gravados com alguns minutos de atraso, sem perder nenhum. Qual solução atende com o **menor custo**?',
      concepts: [{ id: 'int.write-buffer' }],
      xp: 5,
      difficulty: 2,
      domain: 'd4',
      options: [
        { id: 'a', text: 'Dimensionar o banco para o pico, como proposto.', correct: false, consequence: 'Paga a capacidade do pico o mês inteiro para usá-la um dia.' },
        { id: 'b', text: 'Uma fila SQS como buffer de escrita.', correct: true, consequence: 'O pico espera na fila, e o banco atual dá conta, sem perder pedidos.' },
        { id: 'c', text: 'Recusar pedidos quando o banco estiver cheio.', correct: false, consequence: 'Perde pedidos, o que o requisito proíbe.' },
        { id: 'd', text: 'Um tópico do SNS na frente do banco.', correct: false, consequence: 'O tópico empurra tudo na hora: o pico continua chegando ao banco.' },
      ],
      explanation: [
        'Num pico, gravar direto no banco pode estourar as conexões. Com uma **fila na frente**, a aplicação **só enfileira**, e um conjunto de consumidores **grava no ritmo que o banco aguenta**. O pedido não se perde: **espera na fila**. Assim, o banco atual atende, sem pagar o pico o mês todo.',
        'Dimensionar para o pico custa caro. Recusar perde pedidos. E o SNS não segura nada.',
        '**Regra prática:** "o banco não aguenta os picos de escrita" e "não perder pedidos" pedem fila SQS como buffer, com consumidores de concorrência limitada.',
      ],
    },
    {
      id: 'rv:int.f09.banco-em-manutencao',
      kind: 'decision',
      title: 'Trinta minutos sem banco',
      prompt:
        'O banco de pedidos de uma loja fica **30 minutos fora do ar** numa manutenção mensal, e, hoje, os pedidos desse período **falham**. A loja quer continuar **aceitando pedidos** durante a manutenção e gravá-los **assim que o banco voltar**, sem perder nenhum. Qual desenho atende?',
      concepts: [{ id: 'int.write-buffer' }],
      xp: 5,
      difficulty: 2,
      domain: 'd2',
      options: [
        { id: 'a', text: 'O site grava num cache em memória e torce para o banco voltar logo.', correct: false, consequence: 'Se o cache reiniciar, os pedidos se perdem.' },
        { id: 'b', text: 'Enfileirar os pedidos no SQS.', correct: true, consequence: 'Durante a manutenção, os pedidos esperam na fila; quando o banco volta, são gravados.' },
        { id: 'c', text: 'O site repete a gravação até o banco responder.', correct: false, consequence: 'O cliente fica esperando até 30 minutos, e muitos desistem.' },
        { id: 'd', text: 'O site mostra uma página de manutenção nesse período.', correct: false, consequence: 'Para de aceitar pedidos, o oposto do pedido.' },
      ],
      explanation: [
        'A **fila como buffer de escrita** desacopla o site do banco: o site **só enfileira** e responde ao cliente; os consumidores gravam quando o banco está disponível. Durante a manutenção, os pedidos **esperam guardados na fila**, dentro da retenção, e são gravados quando o banco volta.',
        'Cache em memória pode perder pedidos. Repetir prende o cliente. E a página de manutenção deixa de vender.',
        '**Regra prática:** a mesma fila que nivela picos também segura o trabalho enquanto o destino está fora; dimensione a retenção para a maior parada esperada.',
      ],
    },
    {
      id: 'rv:int.f09.m4.a1:sqs',
      kind: 'decision',
      title: 'Cada requisito com o seu serviço',
      prompt:
        'Uma equipe de integração vai revisar cinco requisitos de um sistema novo e anotou, ao lado de cada um, o serviço da AWS que pretende usar. Quais associações estão **corretas**? (Escolha DUAS.)',
      concepts: [{ id: 'int.choose' }],
      xp: 5,
      difficulty: 1,
      domain: 'd2',
      multiple: true,
      options: [
        { id: 'a', text: 'Distribuir tarefas entre trabalhadores: Amazon SQS.', correct: true, consequence: 'Cada mensagem vai para um consumidor, que a apaga depois de processar.' },
        { id: 'b', text: 'Migrar um sistema que usa JMS: Amazon MQ.', correct: true, consequence: 'Broker gerenciado, sem reescrever a mensageria.' },
        { id: 'c', text: 'Avisar vários sistemas da mesma mensagem: Kinesis Data Streams.', correct: false, consequence: 'Vários destinos de uma mensagem é o SNS (ou o EventBridge).' },
        { id: 'd', text: 'Coordenar passos com compensação: Amazon SNS.', correct: false, consequence: 'Passos coordenados com compensação são do Step Functions.' },
        { id: 'e', text: 'Eventos lidos por vários e relidos depois: AWS Step Functions.', correct: false, consequence: 'Muitos leitores com releitura é o Kinesis Data Streams.' },
      ],
      explanation: [
        'Cada padrão de comunicação tem o seu serviço. **Um consumidor por mensagem**: SQS. **Ordem por cliente**: SQS FIFO. **Vários destinos**: SNS (com uma fila por destino) ou EventBridge. **Passos coordenados**: Step Functions. **API para fora**: API Gateway. **Muitos leitores com releitura**: Kinesis. **Broker existente**: Amazon MQ.',
        'Os erros trocam SNS, Step Functions e Kinesis de lugar.',
        '**Regra prática:** identifique o padrão de comunicação antes do serviço.',
      ],
    },
    {
      id: 'rv:int.f09.tres-pecas',
      kind: 'decision',
      title: 'Pedidos de parceiros do começo ao fim',
      prompt:
        'Parceiros vão enviar pedidos por uma **API pública**. Os pedidos de **cada parceiro** precisam ser processados **na ordem** em que chegaram, sem duplicatas. Quando um pedido é aprovado, **o estoque, o faturamento e a logística** precisam ser avisados. Qual combinação atende com serviços gerenciados?',
      concepts: [{ id: 'int.choose' }],
      xp: 5,
      difficulty: 3,
      domain: 'd2',
      options: [
        { id: 'a', text: 'API Gateway, uma fila SQS padrão e um tópico do SNS.', correct: false, consequence: 'A fila padrão não garante a ordem nem evita duplicatas.' },
        { id: 'b', text: 'API Gateway, SQS FIFO com o parceiro como grupo, e SNS.', correct: true, consequence: 'A API recebe, a FIFO mantém a ordem por parceiro, e o SNS avisa os três sistemas.' },
        { id: 'c', text: 'API Gateway, Kinesis Data Streams e uma fila SQS única para os três.', correct: false, consequence: 'Uma fila única entregaria cada aviso a um só dos três sistemas.' },
        { id: 'd', text: 'Amazon MQ, Step Functions e uma fila SQS padrão.', correct: false, consequence: 'O MQ é para brokers existentes, e a fila padrão não garante a ordem.' },
      ],
      explanation: [
        'Cada requisito tem a sua peça. **API para fora**: **API Gateway**. **Ordem por cliente, sem duplicatas**: **SQS FIFO**, com o parceiro como grupo de mensagens (uma fila FIFO com um grupo por parceiro também atende). **Vários destinos** do pedido aprovado: **SNS**, com uma fila por destino.',
        'A fila padrão não garante ordem. Uma fila única não avisa os três. E o Amazon MQ é para quem já usa um broker.',
        '**Regra prática:** em cenários com vários requisitos, monte a solução peça por peça: entrada, ordem, distribuição.',
      ],
    },
  ],
}
