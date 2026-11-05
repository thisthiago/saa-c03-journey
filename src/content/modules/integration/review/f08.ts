/**
 * Questões da Revisão da Fase 8 de Integração (brokers e SaaS), no formato do
 * exame SAA-C03. Fatos conferidos em docs.aws.amazon.com (ver
 * docs/VERIFICACAO-DE-CONTEUDO.md). As empresas são fictícias.
 */
import type { ReviewSet } from '../../../../engine/types'

export const REVIEW_F08: ReviewSet = {
  phaseId: 'int.f08',
  questions: [
    {
      id: 'rv:int.f08.m1.a1',
      kind: 'decision',
      title: 'Uma integração que fala AMQP',
      prompt:
        'A integração entre agências de uma cooperativa usa um broker **RabbitMQ** próprio, com o protocolo **AMQP**, e vai para a AWS. A diretoria **não quer reescrever o código de mensageria** e quer um serviço gerenciado. Qual solução atende?',
      concepts: [{ id: 'mq.what' }],
      xp: 5,
      difficulty: 1,
      domain: 'd2',
      options: [
        { id: 'a', text: 'Amazon SQS, com uma fila por agência.', correct: false, consequence: 'O SQS tem API própria; a mensageria teria de ser reescrita.' },
        { id: 'b', text: 'Amazon MQ com RabbitMQ.', correct: true, consequence: 'O broker gerenciado fala AMQP, e a aplicação só troca o endereço do broker.' },
        { id: 'c', text: 'Kinesis Data Streams.', correct: false, consequence: 'Outro modelo e outra API; exigiria reescrever.' },
        { id: 'd', text: 'RabbitMQ instalado em instâncias EC2 da equipe.', correct: false, consequence: 'Mantém o código, mas o broker continua sendo operado pela equipe.' },
      ],
      explanation: [
        'O **Amazon MQ** é um **broker de mensagens gerenciado**, com **Apache ActiveMQ Classic** ou **RabbitMQ**. Ele fala os protocolos padrão do mercado (**JMS, AMQP, MQTT, OpenWire e STOMP**), e por isso a aplicação que já usa um desses brokers **migra sem reescrever** o código de mensageria.',
        'SQS e Kinesis exigem reescrever. RabbitMQ em EC2 mantém a operação com a equipe.',
        '**Regra prática:** "migrar uma aplicação que usa JMS, AMQP ou MQTT sem reescrever a mensageria" é Amazon MQ.',
      ],
    },
    {
      id: 'rv:int.f08.m1.a2:cashback',
      kind: 'decision',
      title: 'Migrar ou nascer na nuvem',
      prompt:
        'Uma cooperativa vai organizar a mensageria de cinco sistemas e seguir a **recomendação da AWS** para cada um. Quais opções devem usar **SQS e SNS**? (Escolha DUAS.)',
      concepts: [{ id: 'mq.vs-sqs' }],
      xp: 5,
      difficulty: 1,
      domain: 'd2',
      multiple: true,
      options: [
        { id: 'a', text: 'O app novo de cashback, escrito do zero.', correct: true, consequence: 'Aplicação nova: SQS e SNS escalam sem broker para dimensionar.' },
        { id: 'b', text: 'As notificações novas do app dos cooperados.', correct: true, consequence: 'Nasce na nuvem: SQS e SNS, cobrados por uso.' },
        { id: 'c', text: 'O sistema de empréstimos, com JMS e ActiveMQ, que não pode mudar.', correct: false, consequence: 'Migração presa a JMS: Amazon MQ, sem reescrever.' },
        { id: 'd', text: 'A integração de agências, com RabbitMQ e AMQP.', correct: false, consequence: 'Broker existente e protocolo padrão: Amazon MQ.' },
        { id: 'e', text: 'Os sensores das agências, que publicam por MQTT num broker atual.', correct: false, consequence: 'Protocolo de broker numa migração: Amazon MQ.' },
      ],
      explanation: [
        'A AWS recomenda o **Amazon MQ** para **migrar aplicações que já usam um broker** e seus protocolos, e o **SQS e o SNS** para **aplicações novas**: escalam quase sem limite, **não têm broker para dimensionar** e **cobram por uso**.',
        'Os três sistemas legados presos a JMS, AMQP ou MQTT ficam com o Amazon MQ, porque migram sem reescrever a mensageria; colocá-los no SQS exigiria reescrever o código de cada um.',
        '**Regra prática:** aplicação nova, SQS e SNS; aplicação existente presa a protocolos de broker, Amazon MQ.',
      ],
    },
    {
      id: 'rv:int.f08.boss.a2',
      kind: 'decision',
      title: 'Padronizar tudo no broker',
      prompt:
        'Depois de migrar o sistema de empréstimos para o Amazon MQ, alguém sugere pôr também o **app novo de cashback** no mesmo broker ActiveMQ, "para padronizar". O app ainda não foi escrito, e o volume deve crescer muito. A empresa quer o **menor custo e esforço de operação** para o cashback. Qual decisão atende?',
      concepts: [{ id: 'mq.vs-sqs' }],
      xp: 5,
      difficulty: 2,
      domain: 'd4',
      options: [
        { id: 'a', text: 'Pôr o cashback no broker atual, já em duas zonas.', correct: false, consequence: 'O app novo herda um broker para dimensionar e acompanhar o crescimento.' },
        { id: 'b', text: 'Criar um segundo broker do Amazon MQ só para o cashback.', correct: false, consequence: 'Mais um broker para dimensionar e pagar por hora, sem precisar.' },
        { id: 'c', text: 'SQS e SNS para o cashback.', correct: true, consequence: 'Sem broker para dimensionar, com cobrança por uso e escala quase sem limite.' },
        { id: 'd', text: 'Kinesis Data Streams para o cashback.', correct: false, consequence: 'É para fluxos com vários leitores e releitura, não para a mensageria comum do app.' },
      ],
      explanation: [
        'Para **aplicações novas**, a AWS recomenda **SQS e SNS**: escalam quase sem limite, **não têm broker** para dimensionar e cobram **por uso**. O Amazon MQ fica para o que **já depende** de um broker. Padronizar o novo no broker só traz operação e custo de capacidade.',
        'Usar o broker atual ou criar outro mantém um broker para operar. O Kinesis atende outro padrão.',
        '**Regra prática:** não escolha o Amazon MQ para uma aplicação nova só porque o time conhece filas JMS.',
      ],
    },
    {
      id: 'rv:int.f08.m2.a1',
      kind: 'decision',
      title: 'O broker de produção numa zona só',
      prompt:
        'O broker **ActiveMQ** do sistema de empréstimos foi migrado para o Amazon MQ como **instância única**. Numa falha de zona, o crédito parou até o broker voltar. A empresa quer que o broker **continue funcionando se uma zona cair**, com as mensagens preservadas. Qual implantação atende?',
      concepts: [{ id: 'mq.ha' }],
      xp: 5,
      difficulty: 2,
      domain: 'd2',
      options: [
        { id: 'a', text: 'Instância única, com backup diário do broker.', correct: false, consequence: 'O backup recupera depois; o crédito continua parado durante a falha.' },
        { id: 'b', text: 'Dois brokers de instância única independentes, em zonas diferentes.', correct: false, consequence: 'As mensagens de um não estão no outro, e a aplicação não troca de broker sozinha.' },
        { id: 'c', text: 'Ativa e em espera, com dois brokers em duas zonas.', correct: true, consequence: 'O armazenamento é compartilhado no EFS, e o broker em espera assume com as mensagens.' },
        { id: 'd', text: 'Instância única num tipo de instância maior.', correct: false, consequence: 'Continua sendo um broker numa zona só, e cai com ela.' },
      ],
      explanation: [
        'No **ActiveMQ**, a implantação **ativa e em espera** usa **dois brokers em duas zonas**, com **armazenamento compartilhado no EFS**: se o ativo falha, o outro assume com as mensagens. Um broker de **instância única** não sobrevive à falha da zona.',
        'Backup não evita a parada. Brokers independentes não compartilham mensagens. E uma instância maior não muda de zona.',
        '**Regra prática:** broker ActiveMQ de produção é ativo e em espera; RabbitMQ de produção é cluster.',
      ],
    },
    {
      id: 'rv:int.f08.rabbitmq-em-cluster',
      kind: 'decision',
      title: 'A integração de agências e a zona',
      prompt:
        'A integração de agências usa o **Amazon MQ com RabbitMQ** e precisa **resistir à falha de uma zona de disponibilidade** sem perder as mensagens das filas. Hoje o broker é de instância única. Qual implantação atende?',
      concepts: [{ id: 'mq.ha' }],
      xp: 5,
      difficulty: 3,
      domain: 'd2',
      options: [
        { id: 'a', text: 'Ativa e em espera, com armazenamento compartilhado no EFS.', correct: false, consequence: 'É o modelo do ActiveMQ; o RabbitMQ usa cluster.' },
        { id: 'b', text: 'Um cluster RabbitMQ em várias zonas, com filas de quórum.', correct: true, consequence: 'As filas de quórum ficam replicadas entre zonas e sobrevivem à queda de uma.' },
        { id: 'c', text: 'Instância única com snapshots frequentes.', correct: false, consequence: 'Recupera depois, com parada e perda do que entrou desde o último snapshot.' },
        { id: 'd', text: 'Trocar para o Amazon SQS, que já é multizona.', correct: false, consequence: 'Resolve a disponibilidade, mas exige reescrever a mensageria AMQP.' },
      ],
      explanation: [
        'No **RabbitMQ**, a alta disponibilidade vem do **cluster**, com **filas de quórum replicadas entre zonas**: a falha de uma zona não leva as mensagens. A implantação ativa e em espera, com EFS, é a do **ActiveMQ**.',
        'Instância única, com ou sem snapshots, cai junto com a zona e perde o que entrou depois do último snapshot. E trocar para o SQS resolveria a disponibilidade, mas exige reescrever todo o código AMQP.',
        '**Regra prática:** Amazon MQ resistente à falha de zona: ActiveMQ ativo e em espera, RabbitMQ em cluster.',
      ],
    },
  ],
}
