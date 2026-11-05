/**
 * Questões da Revisão da Fase 3 de Integração (tópicos com SNS), no formato
 * do exame SAA-C03. Fatos conferidos em docs.aws.amazon.com (ver
 * docs/VERIFICACAO-DE-CONTEUDO.md). As empresas são fictícias.
 */
import type { ReviewSet } from '../../../../engine/types'

export const REVIEW_F03: ReviewSet = {
  phaseId: 'int.f03',
  questions: [
    {
      id: 'rv:int.f03.m1.a1',
      kind: 'decision',
      title: 'Um tópico lido como se fosse fila',
      prompt:
        'Um sistema de relatórios foi desenhado para **consultar de hora em hora** um tópico do SNS e ler as matrículas publicadas nele, mas **nunca encontra nada**. Ele precisa receber todas as matrículas, processando no próprio ritmo, sem tirá-las dos outros assinantes do tópico. Qual mudança atende?',
      concepts: [{ id: 'sns.what' }],
      xp: 5,
      difficulty: 2,
      domain: 'd2',
      options: [
        { id: 'a', text: 'Aumentar a retenção do tópico SNS para 14 dias.', correct: false, consequence: 'O tópico não guarda mensagens para leitura posterior; não há retenção a aumentar.' },
        { id: 'b', text: 'Consultar o tópico a cada minuto, em vez de a cada hora.', correct: false, consequence: 'O SNS empurra as mensagens às assinaturas; consultar com mais frequência não faz nada aparecer.' },
        { id: 'c', text: 'Uma fila SQS assinando o tópico.', correct: true, consequence: 'A fila guarda a cópia de cada matrícula, e o sistema lê no próprio ritmo.' },
        { id: 'd', text: 'Trocar o tópico por uma fila SQS única para todos os assinantes.', correct: false, consequence: 'Cada mensagem iria para um só consumidor, e os outros assinantes deixariam de recebê-la.' },
      ],
      explanation: [
        'O **SNS** entrega cada mensagem publicada a **todas as assinaturas** do tópico, no modelo publicar e assinar, e **não guarda a mensagem para ser lida depois**: ele a empurra. Para processar no próprio ritmo, o sistema assina o tópico com uma **fila SQS**, que guarda a cópia dele.',
        'Não há retenção no tópico, e consultá-lo não faz sentido. Uma fila única tiraria as mensagens dos outros sistemas.',
        '**Regra prática:** um evento para vários consumidores é SNS; para cada consumidor guardar e processar no próprio ritmo, uma fila SQS assinando o tópico.',
      ],
    },
    {
      id: 'rv:int.f03.m1.a2:fila',
      kind: 'decision',
      title: 'Quem assina o tópico das matrículas',
      prompt:
        'Cada matrícula publicada num tópico do SNS precisa: ser processada pelo **faturamento no próprio ritmo**, sem perder mensagens quando ele estiver lento; e avisar o **aluno por mensagem de texto no celular**. Quais assinaturas atendem? (Escolha DUAS.)',
      concepts: [{ id: 'sns.what' }],
      xp: 5,
      difficulty: 1,
      domain: 'd2',
      multiple: true,
      options: [
        { id: 'a', text: 'Uma fila SQS, para o faturamento.', correct: true, consequence: 'A fila guarda as mensagens, e o faturamento lê no próprio ritmo.' },
        { id: 'b', text: 'Uma assinatura SMS, para o aluno.', correct: true, consequence: 'O SNS entrega a mensagem de texto direto ao telefone.' },
        { id: 'c', text: 'Um endpoint HTTPS do faturamento, chamado a cada matrícula.', correct: false, consequence: 'Funciona, mas sem fila o faturamento lento depende das novas tentativas do SNS, que têm limite.' },
        { id: 'd', text: 'Uma fila SQS, para avisar o aluno no celular.', correct: false, consequence: 'A fila guarda mensagens para sistemas; não envia SMS ao aluno.' },
        { id: 'e', text: 'Uma função Lambda, para guardar as mensagens até o faturamento ler.', correct: false, consequence: 'O SNS chama a função na hora; guardar para ler depois é papel da fila.' },
      ],
      explanation: [
        'As assinaturas de um tópico podem ser **filas SQS**, **funções Lambda**, **Firehose**, **endpoints HTTP ou HTTPS**, **e-mail**, **SMS** e notificações para celulares. A **fila** guarda a mensagem para quem processa no próprio ritmo; o **SMS** entrega direto ao telefone.',
        'Um endpoint HTTPS direto deixa o faturamento lento à mercê das novas tentativas. Filas não mandam SMS. E a Lambda processa na hora, não guarda.',
        '**Regra prática:** sistema que processa no próprio ritmo assina com fila SQS; pessoa avisada assina por SMS, e-mail ou notificação de celular.',
      ],
    },
    {
      id: 'rv:int.f03.m2.a2',
      kind: 'decision',
      title: 'Uma política com dois campos',
      prompt:
        'A assinatura do time de vendas num tópico do SNS tem a política de filtro **{"evento": ["matricula"], "plano": ["anual", "semestral"]}**. Os atributos das mensagens trazem o evento e o plano. Qual destas mensagens **é entregue** a essa assinatura?',
      concepts: [{ id: 'sns.filter' }],
      xp: 5,
      difficulty: 2,
      domain: 'd2',
      options: [
        { id: 'a', text: 'evento "matricula", plano "mensal".', correct: false, consequence: 'O evento casa, mas o plano não está na lista; os campos combinam com E.' },
        { id: 'b', text: 'evento "cancelamento", plano "anual".', correct: false, consequence: 'O plano casa, mas o evento não; os dois campos precisam casar.' },
        { id: 'c', text: 'evento "matricula", plano "semestral".', correct: true, consequence: 'O evento casa e o plano é um dos valores da lista.' },
        { id: 'd', text: 'Uma mensagem sem nenhum atributo de evento ou plano.', correct: false, consequence: 'Sem os atributos, nenhum dos campos da política casa.' },
      ],
      explanation: [
        'A **política de filtro** faz a assinatura receber só as mensagens que interessam, pelos atributos ou pelo corpo. **Os campos da política combinam com E**; **os valores de um campo, com OU**. A mensagem precisa ter o evento "matricula" **e** um plano "anual" **ou** "semestral".',
        'As outras falham em um dos campos ou não têm os atributos. Lembre que, sem política, a assinatura recebe tudo.',
        '**Regra prática:** na política de filtro, campos são E, valores dentro do campo são OU.',
      ],
    },
    {
      id: 'rv:int.f03.m2.a1',
      kind: 'decision',
      title: 'Doze tópicos, um por tipo de evento',
      prompt:
        'Uma escola criou **12 tópicos do SNS**, um para cada tipo de evento, e os sistemas que publicam precisam saber em qual tópico publicar cada evento. Cada assinante quer só alguns tipos. A empresa quer **simplificar a publicação e a manutenção**. Qual desenho atende?',
      concepts: [{ id: 'sns.filter' }],
      xp: 5,
      difficulty: 2,
      domain: 'd2',
      options: [
        { id: 'a', text: 'Um tópico só, com filtros nas assinaturas.', correct: true, consequence: 'Os sistemas publicam num lugar só, e cada assinante recebe só os tipos que pediu.' },
        { id: 'b', text: 'Um tópico só, sem filtros, com cada assinante descartando o que não usa.', correct: false, consequence: 'Simplifica a publicação, mas todos recebem e processam tudo.' },
        { id: 'c', text: 'Manter os 12 tópicos e criar mais um que reúna todos.', correct: false, consequence: 'Aumenta o número de tópicos e a confusão sobre onde publicar.' },
        { id: 'd', text: 'Uma fila SQS por tipo de evento, sem SNS.', correct: false, consequence: 'Cada mensagem iria a um só consumidor, e o publicador teria de escolher a fila.' },
      ],
      explanation: [
        'Com **políticas de filtro** nas assinaturas, **um tópico só** atende a todos: o publicador põe o tipo como atributo, e cada assinante recebe **só as mensagens que interessam**. Criar um tópico por tipo é o erro que os filtros evitam.',
        'Sem filtros, todos processam tudo. Mais tópicos aumentam a confusão. E filas por tipo perdem o fan-out.',
        '**Regra prática:** "cada assinante deve receber só um tipo de mensagem do tópico" é política de filtro, não um tópico por tipo.',
      ],
    },
    {
      id: 'rv:int.f03.m3.a1',
      kind: 'decision',
      title: 'Matrícula antes do bloqueio',
      prompt:
        'As mensagens de cada aluno (matrícula, bloqueio, desbloqueio) são publicadas num tópico e entregues à **catraca** e ao **financeiro**. A catraca precisa receber as mensagens **de cada aluno na ordem em que foram publicadas**, sem duplicatas. Qual desenho atende?',
      concepts: [{ id: 'sns.fifo' }],
      xp: 5,
      difficulty: 2,
      domain: 'd2',
      options: [
        { id: 'a', text: 'Tópico SNS padrão, com uma fila SQS padrão por assinante.', correct: false, consequence: 'Nem o tópico nem a fila padrão garantem a ordem ou evitam duplicatas.' },
        { id: 'b', text: 'SNS FIFO, com o aluno como grupo, e filas SQS FIFO.', correct: true, consequence: 'A ordem de cada aluno é mantida do tópico até a catraca, sem duplicatas.' },
        { id: 'c', text: 'Tópico SNS FIFO entregando a um endpoint HTTP da catraca.', correct: false, consequence: 'Para manter a garantia até o fim, o tópico FIFO entrega a filas SQS FIFO.' },
        { id: 'd', text: 'Tópico SNS padrão, com a catraca ordenando as mensagens pela hora.', correct: false, consequence: 'A catraca teria de reconstruir a ordem e tratar duplicatas sozinha.' },
      ],
      explanation: [
        'O **tópico FIFO** mantém a **ordem por grupo de mensagens** e **deduplica**, como a fila FIFO. Para manter a garantia até o fim, ele entrega a **filas SQS FIFO** assinantes. Com o aluno como grupo, a catraca recebe as mensagens de cada aluno na ordem.',
        'Tópico e fila padrão não garantem ordem. A entrega FIFO a HTTP não mantém a garantia. E ordenar na catraca é trabalho que o serviço já faz.',
        '**Regra prática:** "fan-out mantendo a ordem e sem duplicatas" é tópico SNS FIFO com filas SQS FIFO.',
      ],
    },
    {
      id: 'rv:int.f03.m3.a2',
      kind: 'decision',
      title: 'Quanto o SNS insiste em cada destino',
      prompt:
        'Um arquiteto está revisando como um tópico do SNS se comporta quando a entrega falha, para decidir onde pôr DLQs. As assinaturas são filas SQS, funções Lambda e endpoints HTTPS de parceiros. Quais afirmações estão **corretas**? (Escolha DUAS.)',
      concepts: [{ id: 'sns.retries-dlq' }],
      xp: 5,
      difficulty: 2,
      domain: 'd2',
      multiple: true,
      options: [
        { id: 'a', text: 'Para filas SQS e funções Lambda, o SNS tenta de novo por cerca de 23 dias.', correct: true, consequence: 'São destinos gerenciados pela AWS, com 100.015 tentativas ao longo de 23 dias.' },
        { id: 'b', text: 'Para endpoints HTTPS, as tentativas acabam em cerca de 6 horas.', correct: true, consequence: 'São 50 tentativas em 6 horas; uma parada maior perde mensagens sem DLQ.' },
        { id: 'c', text: 'Para endpoints HTTPS, o SNS tenta de novo por 23 dias.', correct: false, consequence: 'Os 23 dias valem para destinos da AWS; HTTP tem 6 horas.' },
        { id: 'd', text: 'Esgotadas as tentativas, a mensagem fica guardada no tópico.', correct: false, consequence: 'O tópico não guarda mensagens: sem DLQ, ela é descartada.' },
        { id: 'e', text: 'A DLQ de uma assinatura é outro tópico do SNS.', correct: false, consequence: 'A DLQ da assinatura é uma fila SQS, que guarda o que não foi entregue.' },
      ],
      explanation: [
        'Se a entrega falha, o SNS **tenta de novo**, com limites diferentes por destino: para destinos gerenciados pela AWS, como **SQS e Lambda**, **100.015 tentativas em 23 dias**; para **endpoints do cliente, como HTTP**, **50 tentativas em 6 horas**. Esgotadas as tentativas, a mensagem é **descartada**, a não ser que a assinatura tenha uma **DLQ**, que é uma **fila SQS**.',
        'HTTP não tem 23 dias, o tópico não guarda mensagens, e a DLQ não é um tópico.',
        '**Regra prática:** endpoints HTTP de terceiros são os que mais precisam de DLQ na assinatura; o limite deles é de horas.',
      ],
    },
  ],
}
