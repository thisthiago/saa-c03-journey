/**
 * Fase 8 — Brokers e SaaS. Amazon MQ, alta disponibilidade do broker, a
 * escolha entre MQ e SQS/SNS, e o AppFlow (reaproveita ingest.third-party).
 */
import type { PhaseDef } from '../../../../../engine/types'
import { META } from '../meta'

export const F08_INT: PhaseDef = {
  ...META.f08,
  concepts: ['mq.what', 'mq.vs-sqs', 'mq.ha', 'ingest.third-party'],
  availability: 'available',
  simplifications: ['A cooperativa, os sistemas e os registros são fictícios.'],
  missions: [
    // -----------------------------------------------------------------------
    {
      id: 'int.f08.m1',
      title: 'O broker do banco',
      type: 'mission',
      summary: 'Amazon MQ e quando preferir SQS e SNS.',
      briefing: {
        company: 'Cooperativa de Crédito Raiz',
        role: 'Você migra os sistemas de uma cooperativa de crédito para a AWS.',
        situation: 'O sistema de empréstimos, escrito há 12 anos, troca mensagens por JMS com um broker ActiveMQ no data center. Ao mesmo tempo, um app novo de cashback está sendo desenhado do zero.',
        objective: 'Escolher a mensageria de cada sistema.',
        successCriteria: ['Migrar o legado sem reescrever', 'Usar o serviço nativo no sistema novo'],
      },
      intel: [
        { conceptId: 'mq.what', body: ['O **Amazon MQ** gerencia brokers **ActiveMQ** e **RabbitMQ**, com **JMS**, **AMQP**, **MQTT**, **OpenWire** e **STOMP**: a aplicação migra sem reescrever a mensageria.'] },
        { conceptId: 'mq.vs-sqs', body: ['A AWS recomenda o **Amazon MQ** para **migrar** e o **SQS e o SNS** para **aplicações novas**, que escalam sem broker para dimensionar.'] },
      ],
      activities: [
        {
          id: 'int.f08.m1.a1',
          kind: 'decision',
          title: 'O sistema de empréstimos',
          prompt: 'O sistema de empréstimos usa JMS com ActiveMQ, e a diretoria não quer mexer no código. Qual mensageria usar na AWS?',
          concepts: [{ id: 'mq.what' }],
          xp: 40,
          difficulty: 1,
          explanation: ['O Amazon MQ com ActiveMQ fala JMS e OpenWire: basta apontar a aplicação para o novo broker.'],
          options: [
            { id: 'a', text: 'Amazon MQ com ActiveMQ', correct: true, consequence: 'A aplicação troca só o endereço do broker.' },
            { id: 'b', text: 'Amazon SQS', correct: false, consequence: 'Exige reescrever a mensageria para a API do SQS.' },
            { id: 'c', text: 'Kinesis Data Streams', correct: false, consequence: 'Outro modelo e outra API.' },
          ],
        },
        {
          id: 'int.f08.m1.a2',
          kind: 'classify',
          title: 'Migrar ou nascer na nuvem',
          prompt: 'Para cada sistema, diga qual mensageria a AWS recomenda.',
          concepts: [{ id: 'mq.vs-sqs' }],
          xp: 50,
          difficulty: 2,
          explanation: ['Quem já depende de um broker e de protocolos padrão migra para o Amazon MQ; o que nasce agora usa SQS e SNS.'],
          bins: [
            { id: 'mq', label: 'Amazon MQ' },
            { id: 'sqs', label: 'SQS e SNS' },
          ],
          items: [
            { id: 'emprestimo', text: 'Sistema de empréstimos com JMS e ActiveMQ', bin: 'mq', explanation: 'Migração sem reescrever.', concepts: ['mq.vs-sqs'] },
            { id: 'cashback', text: 'App novo de cashback, escrito do zero', bin: 'sqs', explanation: 'Aplicação nova.', concepts: ['mq.vs-sqs'] },
            { id: 'rabbit', text: 'Integração de agências que usa RabbitMQ com AMQP', bin: 'mq', explanation: 'Broker existente e protocolo padrão.', concepts: ['mq.vs-sqs'] },
            { id: 'notifica', text: 'Notificações novas para o app dos cooperados', bin: 'sqs', explanation: 'Nasce na nuvem.', concepts: ['mq.vs-sqs'] },
          ],
        },
      ],
      debrief: { takeaways: ['Amazon MQ para migrar sem reescrever.', 'SQS e SNS para o que é novo.'] },
    },
    // -----------------------------------------------------------------------
    {
      id: 'int.f08.m2',
      title: 'Sem cair com a zona',
      type: 'mission',
      summary: 'Alta disponibilidade do broker.',
      briefing: {
        company: 'Cooperativa de Crédito Raiz',
        role: 'Você define a implantação do broker.',
        situation: 'O broker de empréstimos é crítico: se ele parar, ninguém contrata crédito. No teste, o time criou um broker de instância única.',
        objective: 'Escolher a implantação que sobrevive à falha de uma zona.',
        successCriteria: ['Usar dois brokers em duas zonas'],
      },
      intel: [{ conceptId: 'mq.ha', body: ['No ActiveMQ, a implantação **ativa e em espera** usa dois brokers em **duas zonas**, com armazenamento no **EFS**. No RabbitMQ, o cluster usa **filas de quórum** entre zonas.'] }],
      activities: [
        {
          id: 'int.f08.m2.a1',
          kind: 'decision',
          title: 'O broker crítico',
          prompt: 'Como implantar o broker ActiveMQ dos empréstimos para que ele continue funcionando se uma zona de disponibilidade cair?',
          concepts: [{ id: 'mq.ha' }],
          xp: 50,
          difficulty: 2,
          explanation: ['A implantação ativa e em espera mantém um segundo broker em outra zona, com armazenamento compartilhado no EFS, pronto para assumir.'],
          options: [
            { id: 'a', text: 'Implantação ativa e em espera, com dois brokers em duas zonas', correct: true, consequence: 'Se o ativo cair, o outro assume com as mensagens.' },
            { id: 'b', text: 'Broker de instância única com backup diário', correct: false, consequence: 'Um broker de instância única fica numa zona só: se ela falha, o crédito para até o broker voltar.' },
            { id: 'c', text: 'Dois brokers de instância única independentes', correct: false, consequence: 'As mensagens de um não estão no outro.' },
          ],
        },
      ],
      debrief: { takeaways: ['Broker crítico: ativo e em espera em duas zonas.'] },
    },
    // -----------------------------------------------------------------------
    {
      id: 'int.f08.m3',
      title: 'Os dados do CRM',
      type: 'mission',
      summary: 'Dados de aplicações SaaS com o AppFlow.',
      briefing: {
        company: 'Cooperativa de Crédito Raiz',
        role: 'Você traz dados de um SaaS para o data lake.',
        situation: 'O time comercial usa o Salesforce, e o risco de crédito quer os dados de contatos e oportunidades no S3 todos os dias. Ninguém quer escrever um integrador.',
        objective: 'Escolher o serviço que traz os dados sem código.',
        successCriteria: ['Usar o AppFlow'],
      },
      intel: [{ conceptId: 'ingest.third-party', body: ['O **AppFlow** move dados entre aplicações SaaS, como o Salesforce, e a AWS, com fluxos agendados ou por evento, sem código.'] }],
      activities: [
        {
          id: 'int.f08.m3.a1',
          kind: 'decision',
          title: 'Salesforce para o S3',
          prompt: 'Como levar os contatos e oportunidades do Salesforce ao S3 todo dia, sem escrever código?',
          concepts: [{ id: 'ingest.third-party' }],
          xp: 40,
          difficulty: 1,
          explanation: ['O AppFlow tem conector para o Salesforce e grava no S3 num fluxo agendado.'],
          options: [
            { id: 'a', text: 'Um fluxo agendado do Amazon AppFlow do Salesforce para o S3', correct: true, consequence: 'Os dados chegam todo dia, sem integrador próprio.' },
            { id: 'b', text: 'Uma fila SQS entre o Salesforce e o S3', correct: false, consequence: 'Alguém ainda teria de escrever quem lê o Salesforce e quem grava no S3.' },
            { id: 'c', text: 'Amazon MQ', correct: false, consequence: 'Broker de mensagens, não conector de SaaS.' },
          ],
        },
      ],
      debrief: { takeaways: ['AppFlow traz dados de SaaS sem código.'] },
    },
    // -----------------------------------------------------------------------
    {
      id: 'int.f08.boss',
      title: 'A noite sem crédito',
      type: 'boss',
      summary: 'Investigar a parada do broker e corrigir a implantação.',
      briefing: {
        company: 'Cooperativa de Crédito Raiz',
        role: 'Você investiga a primeira noite do sistema de empréstimos na AWS.',
        situation: 'Às 2h, os pedidos de crédito pararam por 3 horas. O time de plantão mandou os registros.',
        objective: 'Achar a causa e escolher as correções.',
        successCriteria: ['Marcar as linhas que explicam a parada', 'Escolher a causa e as correções'],
      },
      intel: [
        { conceptId: 'mq.ha', body: ['Um broker de instância única fica numa zona só. Se a zona tem problema, o broker para com ela.'] },
        { conceptId: 'mq.vs-sqs' },
      ],
      activities: [
        {
          id: 'int.f08.boss.a1',
          kind: 'investigate',
          title: 'Os registros da madrugada',
          prompt: 'Leia os registros, marque as linhas que explicam a parada e escolha a causa e as correções.',
          concepts: [{ id: 'mq.ha' }, { id: 'mq.what', weight: 0.5 }],
          xp: 200,
          difficulty: 3,
          explanation: ['O broker foi criado como instância única em sa-east-1a. Quando a zona teve problema, o broker ficou indisponível até a zona voltar. A rotação de logs e o certificado renovado não têm relação.'],
          scenario: ['Formato simplificado: horário, origem e mensagem.'],
          artifacts: [
            {
              id: 'logs',
              title: 'Registros da noite',
              format: 'log',
              lines: [
                { id: 'l1', text: '01:30  mq      broker emprestimos-prod  modo=SINGLE_INSTANCE  zona=sa-east-1a', isIssue: true, explanation: 'O broker de produção está numa zona só.' },
                { id: 'l2', text: '01:45  logs    rotação diária dos registros concluída', isIssue: false, explanation: 'Rotina sem relação.' },
                { id: 'l3', text: '02:02  health  evento de conectividade na zona sa-east-1a', isIssue: true, explanation: 'A zona do broker teve problema.' },
                { id: 'l4', text: '02:03  app     falha ao conectar no broker: tempo esgotado', isIssue: true, explanation: 'A aplicação perdeu o broker.' },
                { id: 'l5', text: '03:10  acm     certificado do portal renovado', isIssue: false, explanation: 'Renovação automática, sem relação.' },
                { id: 'l6', text: '05:04  mq      broker emprestimos-prod disponível', isIssue: false, explanation: 'O broker voltou com a zona.' },
              ],
            },
          ],
          rootCause: {
            prompt: 'Qual é a causa da parada?',
            options: [
              { id: 'a', text: 'Broker de instância única numa zona que teve problema', correct: true, feedback: 'Sem um segundo broker em outra zona, não havia quem assumisse.' },
              { id: 'b', text: 'A rotação dos registros', correct: false, feedback: 'Terminou antes e não toca no broker.' },
              { id: 'c', text: 'O certificado renovado', correct: false, feedback: 'Foi depois da parada e é do portal.' },
            ],
          },
          remediations: {
            prompt: 'Quais correções fazem sentido?',
            options: [
              { id: 'a', text: 'Recriar o broker na implantação ativa e em espera, em duas zonas', correct: true, feedback: 'Na falha da zona, o broker em espera assume.' },
              { id: 'b', text: 'Configurar a aplicação com os dois endereços do broker, para reconectar sozinha', correct: true, feedback: 'O cliente encontra o broker que assumiu.' },
              { id: 'c', text: 'Desligar a rotação de registros', correct: false, feedback: 'Não tem relação com a parada.' },
            ],
          },
        },
        {
          id: 'int.f08.boss.a2',
          kind: 'decision',
          title: 'E o cashback?',
          prompt: 'Depois da noite ruim, alguém sugere pôr também o app novo de cashback no broker ActiveMQ, "para padronizar". O que responder?',
          concepts: [{ id: 'mq.vs-sqs' }],
          xp: 50,
          difficulty: 2,
          explanation: ['Para aplicações novas, a AWS recomenda SQS e SNS: sem broker para dimensionar nem zona para administrar.'],
          options: [
            { id: 'a', text: 'O cashback usa SQS e SNS; o broker fica só para o legado', correct: true, consequence: 'Menos operação e escala sem broker.' },
            { id: 'b', text: 'Pôr tudo no broker, que agora está em duas zonas', correct: false, consequence: 'O app novo herda um broker para dimensionar sem precisar.' },
          ],
        },
      ],
      debrief: { takeaways: ['Broker crítico nunca em instância única.', 'O broker é para migrar; o novo nasce em SQS e SNS.'] },
    },
  ],
}
