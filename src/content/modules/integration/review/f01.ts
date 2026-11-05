/**
 * Questões da Revisão da Fase 1 de Integração (desacoplamento e SQS), no
 * formato do exame SAA-C03. Fatos conferidos em docs.aws.amazon.com (ver
 * docs/VERIFICACAO-DE-CONTEUDO.md). As empresas são fictícias.
 */
import type { ReviewSet } from '../../../../engine/types'

export const REVIEW_F01: ReviewSet = {
  phaseId: 'int.f01',
  questions: [
    {
      id: 'rv:int.f01.m1.a1',
      kind: 'decision',
      title: 'O checkout que cai com as notas',
      prompt:
        'Na Black Friday, uma loja recebe **dez vezes mais pedidos**, e o checkout chama na hora o sistema de notas fiscais, que leva cerca de 5 s por nota e trava nos picos, **derrubando o checkout junto**. A nota pode sair alguns minutos depois da compra. Qual mudança torna o checkout **resistente aos picos e às falhas** do sistema de notas?',
      concepts: [{ id: 'int.sync-async' }],
      xp: 5,
      difficulty: 1,
      domain: 'd2',
      options: [
        { id: 'a', text: 'Aumentar para 60 s o tempo limite da chamada ao sistema de notas.', correct: false, consequence: 'O cliente espera mais, e o checkout continua caindo junto quando as notas travam.' },
        { id: 'b', text: 'Pôr mais instâncias no checkout para aguentar o pico.', correct: false, consequence: 'O gargalo é o sistema de notas; mais checkouts só criam mais chamadas presas.' },
        { id: 'c', text: 'Gravar cada pedido numa fila do SQS, lida pelo sistema de notas.', correct: true, consequence: 'O checkout responde na hora, e os pedidos esperam na fila nos picos e nas falhas.' },
        { id: 'd', text: 'Repetir a chamada ao sistema de notas até três vezes antes de responder.', correct: false, consequence: 'Prende o cliente ainda mais tempo e aumenta a carga no sistema que já está travado.' },
      ],
      explanation: [
        'Na **chamada síncrona**, quem pede espera a resposta: se o outro lado está lento ou fora do ar, o pedido falha junto. Na **assíncrona**, o checkout deixa a mensagem numa **fila do SQS** e segue; o sistema de notas lê no próprio ritmo. A fila **desacopla** os dois lados e **absorve os picos**.',
        'Tempo limite maior, mais checkouts e novas tentativas mantêm a dependência direta do sistema lento.',
        '**Regra prática:** "picos de demanda", "processamento lento" e "a falha de um componente derruba o outro" apontam para uma fila entre os componentes.',
      ],
    },
    {
      id: 'rv:int.f01.m1.a2:cartao',
      kind: 'decision',
      title: 'O que pode esperar numa fila',
      prompt:
        'Uma livraria vai redesenhar a finalização de compra e quer mandar para uma **fila** tudo o que **não precisa de resposta na hora**, para o cliente ver "pedido confirmado" mais rápido. Quais tarefas podem ir para a fila? (Escolha DUAS.)',
      concepts: [{ id: 'int.sync-async' }],
      xp: 5,
      difficulty: 1,
      domain: 'd2',
      multiple: true,
      options: [
        { id: 'a', text: 'Emitir a nota fiscal do pedido.', correct: true, consequence: 'Pode sair minutos depois, sem o cliente esperar.' },
        { id: 'b', text: 'Enviar o e-mail de confirmação.', correct: true, consequence: 'Ninguém espera o e-mail na tela para continuar a compra.' },
        { id: 'c', text: 'Autorizar o cartão antes de mostrar "pedido confirmado".', correct: false, consequence: 'O cliente precisa saber, na hora, se a compra passou.' },
        { id: 'd', text: 'Mostrar o resultado da busca por título.', correct: false, consequence: 'O cliente está olhando a tela, esperando a resposta.' },
        { id: 'e', text: 'Conferir o estoque antes de aceitar o pedido.', correct: false, consequence: 'A resposta decide se o pedido é aceito, então precisa vir na hora.' },
      ],
      explanation: [
        'O critério é **quem espera a resposta**. Autorizar o cartão, conferir o estoque e mostrar a busca decidem o que o cliente vê agora: são **síncronos**. A nota e o e-mail podem acontecer **minutos depois**: vão para a fila e não atrasam a confirmação.',
        'Pôr numa fila o que decide a tela deixaria o cliente sem resposta.',
        '**Regra prática:** o que o usuário espera na tela é síncrono; o que pode acontecer depois vai para a fila.',
      ],
    },
    {
      id: 'rv:int.f01.duplicadas-na-fila-padrao',
      kind: 'decision',
      title: 'Duplicadas mesmo com a visibilidade certa',
      prompt:
        'Uma fila **padrão** do SQS tem a visibilidade bem acima do tempo de processamento, e os consumidores apagam as mensagens logo depois de processar. Mesmo assim, **raramente** um e-mail de boas-vindas sai **duas vezes**. A ordem das mensagens não importa. Qual mudança atende com o menor esforço?',
      concepts: [{ id: 'sqs.what' }],
      xp: 5,
      difficulty: 3,
      domain: 'd2',
      options: [
        { id: 'a', text: 'Aumentar ainda mais o tempo de visibilidade.', correct: false, consequence: 'A visibilidade já está certa; a duplicata vem da entrega pelo menos uma vez.' },
        { id: 'b', text: 'Ligar o long polling nos consumidores.', correct: false, consequence: 'Reduz respostas vazias; não muda a garantia de entrega.' },
        { id: 'c', text: 'Configurar uma DLQ na fila.', correct: false, consequence: 'A DLQ recebe mensagens que falham; esta não falha, chega em dobro.' },
        { id: 'd', text: 'Um consumidor idempotente.', correct: true, consequence: 'A cópia que chega em dobro é reconhecida e não gera um segundo e-mail.' },
      ],
      explanation: [
        'A **fila padrão** tem vazão praticamente ilimitada, mas **entrega pelo menos uma vez**: uma mensagem pode, raramente, chegar em dobro, e a ordem é de melhor esforço. Com a visibilidade certa, a duplicata que sobra é dessa garantia, e a resposta é um **consumidor idempotente**, que reconhece o que já processou.',
        'Visibilidade, long polling e DLQ resolvem outros problemas. Uma fila FIFO também evitaria duplicatas, mas troca de fila para um caso que a idempotência resolve.',
        '**Regra prática:** fila padrão pede consumidor idempotente; processamento exatamente uma vez ou ordem estrita pedem FIFO.',
      ],
    },
    {
      id: 'rv:int.f01.envio-em-lote',
      kind: 'decision',
      title: 'Uma mensagem por chamada',
      prompt:
        'Um produtor envia ao SQS **milhões de mensagens por dia**, **uma por chamada**, e a fatura de requisições cresceu. As mensagens são pequenas e saem em rajadas de dezenas por segundo. A empresa quer **reduzir o número de chamadas** sem perder mensagens. Qual mudança atende?',
      concepts: [{ id: 'sqs.what' }],
      xp: 5,
      difficulty: 2,
      domain: 'd4',
      options: [
        { id: 'a', text: 'Ligar o long polling no produtor.', correct: false, consequence: 'O long polling vale para o recebimento, não para o envio.' },
        { id: 'b', text: 'Envios em lotes de até 10.', correct: true, consequence: 'Cada chamada leva até 10 mensagens, e o número de requisições cai.' },
        { id: 'c', text: 'Trocar a fila padrão por uma fila FIFO.', correct: false, consequence: 'A FIFO garante ordem e deduplicação; não reduz chamadas.' },
        { id: 'd', text: 'Aumentar a retenção da fila para 14 dias.', correct: false, consequence: 'Muda o tempo de guarda, não o número de chamadas.' },
      ],
      explanation: [
        'Uma operação de **envio, recebimento ou exclusão** do SQS aceita **lotes de até 10 mensagens**. Enviando em lote, o produtor reduz o número de chamadas, que é o que pesa na fatura.',
        'O long polling vale para o recebimento: ajuda os consumidores, não o produtor. A fila FIFO garante ordem e deduplicação, e a retenção define o tempo de guarda; nenhum dos dois muda o número de chamadas de envio.',
        '**Regra prática:** para reduzir requisições ao SQS, envie, receba e apague em lotes de até 10; no recebimento, some o long polling.',
      ],
    },
    {
      id: 'rv:int.f01.m2.a1',
      kind: 'decision',
      title: 'Pedidos grandes em dobro',
      prompt:
        'O processamento de cada mensagem de uma fila leva **de 20 s a 10 minutos**, conforme o tamanho do pedido. Com a visibilidade de 60 s, os pedidos grandes são **processados em dobro**. A equipe não quer que uma mensagem fique presa por muito tempo se o consumidor cair. Qual abordagem atende?',
      concepts: [{ id: 'sqs.visibility' }],
      xp: 5,
      difficulty: 3,
      domain: 'd2',
      options: [
        { id: 'a', text: 'Subir a visibilidade para o máximo de 12 horas.', correct: false, consequence: 'Acaba com as duplicatas, mas, se o consumidor cair, a mensagem fica parada por horas.' },
        { id: 'b', text: 'Ligar o long polling com espera de 20 s.', correct: false, consequence: 'Reduz respostas vazias; não muda a visibilidade das mensagens em processamento.' },
        { id: 'c', text: 'Estender a visibilidade durante o trabalho.', correct: true, consequence: 'Os pedidos grandes ganham tempo enquanto rodam, e um consumidor caído libera a mensagem logo.' },
        { id: 'd', text: 'Mandar os pedidos grandes direto para a DLQ.', correct: false, consequence: 'A DLQ é para mensagens que falham, não para as que demoram.' },
      ],
      explanation: [
        'Quando um consumidor recebe a mensagem, ela fica invisível pelo **tempo de visibilidade**; se não for apagada antes do fim, volta e pode ser processada de novo. Com tempos de processamento muito variáveis, o consumidor pode **estender o prazo durante o processamento** com **ChangeMessageVisibility**: os pedidos grandes não duplicam, e uma falha libera a mensagem rápido.',
        'Visibilidade máxima prende a mensagem se o consumidor cair. Long polling e DLQ resolvem outros problemas.',
        '**Regra prática:** visibilidade um pouco acima do processamento típico; para os casos longos, estenda durante o trabalho.',
      ],
    },
    {
      id: 'rv:int.f01.m2.a2',
      kind: 'decision',
      title: 'Doze horas de visibilidade por segurança',
      prompt:
        'Para nunca processar em dobro, uma equipe subiu a visibilidade de uma fila para **12 horas**. O processamento leva cerca de **45 s**. Ontem um consumidor caiu no meio do trabalho, e o pedido daquela mensagem **ficou parado por meio dia**. Qual configuração atende melhor?',
      concepts: [{ id: 'sqs.visibility' }],
      xp: 5,
      difficulty: 2,
      domain: 'd2',
      options: [
        { id: 'a', text: 'Visibilidade de 60 s.', correct: true, consequence: 'O consumidor apaga a mensagem antes de ela voltar, e uma falha libera o pedido em um minuto.' },
        { id: 'b', text: 'Manter as 12 horas e criar uma DLQ.', correct: false, consequence: 'A mensagem continua presa 12 horas antes de cada nova tentativa.' },
        { id: 'c', text: 'Visibilidade de 30 s, o padrão da fila.', correct: false, consequence: 'Menor que o processamento: a mensagem volta antes do fim e é processada em dobro.' },
        { id: 'd', text: 'Visibilidade zero, para a mensagem voltar logo.', correct: false, consequence: 'Outro consumidor a recebe imediatamente, enquanto o primeiro ainda trabalha.' },
      ],
      explanation: [
        'O **tempo de visibilidade** deve ficar **um pouco acima do tempo de processamento**: assim o consumidor apaga a mensagem antes de ela voltar, e, se ele cair, a mensagem volta logo para outra tentativa. Visibilidade alta demais deixa a mensagem parada todo esse tempo antes da nova tentativa.',
        'A DLQ não encurta a espera. Visibilidade menor que o processamento duplica, e zero duplica na hora.',
        '**Regra prática:** visibilidade é um equilíbrio: acima do processamento para não duplicar, perto dele para não atrasar a nova tentativa.',
      ],
    },
    {
      id: 'rv:int.f01.consumidor-parado',
      kind: 'decision',
      title: 'Reembolsos que sumiram na migração',
      prompt:
        'O consumidor de uma fila de pedidos de reembolso ficou **parado por seis dias** durante uma migração. A fila usava a **retenção padrão**, e muitos pedidos **sumiram sem ser processados**. A próxima migração pode levar até 10 dias. Qual mudança evita a perda?',
      concepts: [{ id: 'sqs.retention-size' }],
      xp: 5,
      difficulty: 2,
      domain: 'd2',
      options: [
        { id: 'a', text: 'Aumentar o tempo de visibilidade para 12 horas.', correct: false, consequence: 'A visibilidade trata de mensagens em processamento, não do tempo de guarda.' },
        { id: 'b', text: 'Aumentar a retenção da fila para 14 dias.', correct: true, consequence: 'As mensagens ficam guardadas pelos 10 dias da migração, com folga.' },
        { id: 'c', text: 'Configurar uma DLQ com maxReceiveCount 1.', correct: false, consequence: 'Sem consumidor, ninguém recebe as mensagens, e elas não vão para a DLQ.' },
        { id: 'd', text: 'Ligar o long polling na fila.', correct: false, consequence: 'Reduz respostas vazias; não muda quanto tempo a mensagem fica guardada.' },
      ],
      explanation: [
        'A fila guarda cada mensagem por **4 dias por padrão**, configurável de **1 minuto a 14 dias**; depois disso, a mensagem é **apagada mesmo sem ser processada**. Com o consumidor parado por seis dias, a retenção padrão perdeu pedidos. Com **14 dias**, a migração de 10 dias passa sem perda.',
        'Visibilidade, DLQ e long polling não mudam o tempo de guarda; a DLQ ainda depende de alguém receber as mensagens.',
        '**Regra prática:** "consumidor parado por vários dias" pede aumentar a retenção, até 14 dias; a fila não guarda mensagens para sempre.',
      ],
    },
    {
      id: 'rv:int.f01.m2.a3',
      kind: 'decision',
      title: 'Um pedido de 3 MiB',
      prompt:
        'Uma biblioteca comprou **8.000 livros** num pedido só, e a mensagem com todos os itens tem **3 MiB**. O SQS **recusou o envio**. A empresa quer manter o processamento pela fila, com o consumidor recebendo a lista completa. O que fazer?',
      concepts: [{ id: 'sqs.retention-size' }],
      xp: 5,
      difficulty: 1,
      domain: 'd3',
      options: [
        { id: 'a', text: 'Aumentar o tamanho máximo de mensagem da fila para 4 MiB.', correct: false, consequence: 'Não existe esse ajuste: o limite da mensagem do SQS é 1 MiB.' },
        { id: 'b', text: 'Aumentar a retenção da fila para 14 dias.', correct: false, consequence: 'A retenção é o tempo de guarda, não o tamanho.' },
        { id: 'c', text: 'Dividir o pedido em três filas, uma para cada parte.', correct: false, consequence: 'O consumidor teria de juntar partes de filas diferentes, sem garantia de que cheguem juntas.' },
        { id: 'd', text: 'Guardar a lista no S3 e enviar na fila só a referência.', correct: true, consequence: 'A mensagem fica pequena, e o consumidor busca a lista completa no S3.' },
      ],
      explanation: [
        'Uma mensagem do SQS tem **até 1 MiB**. Para cargas maiores, o padrão é **guardar o conteúdo no S3** e **enviar na fila só a referência**; a biblioteca **Extended Client** faz isso sozinha, para cargas de até 2 GB.',
        'O limite não sobe para 4 MiB por configuração. Retenção é o tempo de guarda, não o tamanho. E dividir o pedido em filas diferentes obriga o consumidor a juntar partes que podem chegar em momentos e ordens diferentes.',
        '**Regra prática:** mensagem maior que 1 MiB, conteúdo no S3 e referência na fila.',
      ],
    },
    {
      id: 'rv:int.f01.m3.a1',
      kind: 'decision',
      title: 'Consumidores que não podemos mudar',
      prompt:
        'Dezenas de consumidores de **parceiros** leem uma fila do SQS em laço e recebem **resposta vazia** na maior parte das chamadas, o que encarece a fatura. A empresa **não pode mudar o código** dos parceiros e não quer atrasar o processamento. Qual mudança atende?',
      concepts: [{ id: 'sqs.long-polling' }],
      xp: 5,
      difficulty: 2,
      domain: 'd4',
      options: [
        { id: 'a', text: 'Pedir aos parceiros que esperem 5 minutos entre as consultas.', correct: false, consequence: 'Exige mudar o código deles e atrasa os pedidos em até 5 minutos.' },
        { id: 'b', text: 'Aumentar o tempo de visibilidade da fila.', correct: false, consequence: 'A visibilidade não muda as respostas vazias.' },
        { id: 'c', text: 'Definir na fila um tempo de espera padrão de 20 s.', correct: true, consequence: 'As chamadas passam a usar long polling sem mudar o código, e as respostas vazias caem.' },
        { id: 'd', text: 'Trocar a fila padrão por uma fila FIFO.', correct: false, consequence: 'A FIFO garante ordem; não reduz respostas vazias.' },
      ],
      explanation: [
        'No **long polling**, o recebimento espera **até 20 s** por mensagens e consulta todos os servidores: menos respostas vazias, menos chamadas e **menor custo**, sem atrasar a entrega. Ele é ligado com WaitTimeSeconds maior que zero **na chamada ou como padrão da fila**; como padrão da fila, vale para consumidores que não podem ser mudados.',
        'Intervalos fixos atrasam e exigem mudança. Visibilidade e FIFO resolvem outros problemas.',
        '**Regra prática:** "reduzir o custo e as respostas vazias ao consultar a fila" é long polling, de preferência configurado na própria fila.',
      ],
    },
    {
      id: 'rv:int.f01.m3.a4',
      kind: 'decision',
      title: 'Notas que dariam certo na terceira tentativa',
      prompt:
        'A emissão de notas falha às vezes por **instabilidade do sistema da prefeitura** e costuma dar certo **na terceira tentativa**. A DLQ da fila está com **maxReceiveCount 2**, e muitas notas que dariam certo **vão para a DLQ**. Mensagens com dados realmente inválidos devem continuar indo para lá. Qual ajuste atende?',
      concepts: [{ id: 'sqs.dlq' }],
      xp: 5,
      difficulty: 2,
      domain: 'd2',
      options: [
        { id: 'a', text: 'Tirar a DLQ da fila.', correct: false, consequence: 'As mensagens inválidas voltariam sem parar até a retenção apagá-las.' },
        { id: 'b', text: 'Aumentar o maxReceiveCount para 5.', correct: true, consequence: 'As falhas passageiras ganham novas tentativas, e as inválidas ainda vão para a DLQ.' },
        { id: 'c', text: 'Baixar o maxReceiveCount para 1.', correct: false, consequence: 'Ainda mais notas boas iriam para a DLQ na primeira falha.' },
        { id: 'd', text: 'Aumentar a retenção da DLQ para 14 dias.', correct: false, consequence: 'Guarda melhor as mensagens erradas, mas não evita que as boas cheguem lá.' },
      ],
      explanation: [
        'A **DLQ** recebe as mensagens recebidas mais vezes que o **maxReceiveCount** sem ser apagadas. O valor precisa **caber as falhas passageiras**: com 2, a terceira tentativa, que daria certo, nunca acontece. Com 5, as instabilidades se resolvem, e as mensagens realmente inválidas continuam indo para a DLQ.',
        'Sem DLQ, as inválidas ocupam a fila. Com 1, piora. E a retenção da DLQ não muda quem vai para ela.',
        '**Regra prática:** maxReceiveCount acima do número de falhas passageiras esperadas; depois de corrigir a causa, o redrive devolve as mensagens da DLQ à fila.',
      ],
    },
    {
      id: 'rv:int.f01.retencao-da-dlq',
      kind: 'decision',
      title: 'Mensagens que somem da DLQ',
      prompt:
        'Uma fila **padrão** tem retenção de **4 dias** e uma DLQ também com **4 dias**. As mensagens que falham costumam ir para a DLQ depois de **3 dias** de tentativas, e a equipe percebeu que elas **somem da DLQ em cerca de um dia**, antes de alguém analisar. Qual mudança atende?',
      concepts: [{ id: 'sqs.dlq' }],
      xp: 5,
      difficulty: 3,
      domain: 'd2',
      options: [
        { id: 'a', text: 'Reduzir a retenção da fila de origem para 1 dia.', correct: false, consequence: 'As mensagens sumiriam ainda antes, inclusive da fila de origem.' },
        { id: 'b', text: 'Retenção da DLQ maior, como 14 dias.', correct: true, consequence: 'A DLQ conta o tempo desde a entrada original; com mais retenção, sobra tempo para a análise.' },
        { id: 'c', text: 'Trocar a DLQ por uma fila em outra Região.', correct: false, consequence: 'A DLQ precisa ficar na mesma conta e na mesma Região da fila de origem.' },
        { id: 'd', text: 'Aumentar o tempo de visibilidade da DLQ.', correct: false, consequence: 'A visibilidade não muda quanto tempo a mensagem fica guardada.' },
      ],
      explanation: [
        'Na **fila padrão**, a mensagem que vai para a DLQ **guarda a data original de entrada**. Se a DLQ tem a mesma retenção da origem, uma mensagem que já passou 3 dias tentando chega à DLQ com só um dia restante. Por isso **a retenção da DLQ deve ser maior que a da origem**. (Na FIFO, a data recomeça ao chegar à DLQ.)',
        'Reduzir a origem piora. A DLQ precisa estar na mesma conta e Região. E visibilidade não é retenção.',
        '**Regra prática:** DLQ de fila padrão com retenção maior que a da origem, de preferência o máximo de 14 dias.',
      ],
    },
  ],
}
