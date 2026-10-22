/**
 * Fase 9 — Padrões e escolha. Coreografia ou orquestração, saga e
 * compensação, consumidor idempotente (com ev.at-least-once), fila como
 * buffer de escrita e o quadro de escolha do serviço de integração.
 */
import type { PhaseDef } from '../../../../../engine/types'
import type { IntChooserLabConfig } from '../../../../../simulators/intchooser/model'
import { META } from '../meta'

export const FEIRA_PEDIDOS: IntChooserLabConfig = {
  itemsLabel: 'Pedidos dos times',
  options: ['sqs', 'sqs-fifo', 'sns', 'sns-sqs', 'eventbridge', 'scheduler', 'step-functions', 'api-gateway', 'kinesis', 'firehose', 'msk', 'mq', 'appflow'],
  items: [
    { id: 'fotos', text: 'Processar as fotos enviadas pelos vendedores, sem perder nenhuma num pico', dominant: 'decouple', needs: ['decouple'], concepts: ['int.choose'] },
    { id: 'saldo', text: 'Atualizar o saldo de cada vendedor na ordem dos lançamentos, sem duplicar', dominant: 'order', needs: ['order'], concepts: ['int.choose'] },
    { id: 'venda', text: 'Avisar faturamento, estoque e entrega de cada venda, cada um no seu ritmo e sem perder nada se um cair', dominant: 'fanout-buffer', needs: ['fanout-buffer'], concepts: ['int.choose'] },
    { id: 'guardduty', text: 'Reagir aos achados do GuardDuty e aos chamados do sistema de atendimento SaaS', dominant: 'aws-events', needs: ['aws-events'], concepts: ['int.choose'] },
    { id: 'cobranca', text: 'Cobrar a mensalidade de 200 mil vendedores, cada um no dia de vencimento dele', dominant: 'schedule', needs: ['schedule'], concepts: ['int.choose'] },
    { id: 'devolucao', text: 'Devolução com coleta, vistoria, estorno e aprovação do vendedor, desfazendo tudo se algo falhar', dominant: 'workflow', needs: ['workflow'], concepts: ['int.choose'] },
    { id: 'parceiros', text: 'API para lojas parceiras, com limite de chamadas por parceiro', dominant: 'public-api', needs: ['public-api'], concepts: ['int.choose'] },
    { id: 'cliques', text: 'Milhões de cliques por minuto, lidos pela busca e pelas recomendações, e relidos quando o modelo muda', dominant: 'stream-replay', needs: ['stream-replay'], concepts: ['int.choose'] },
    { id: 'lake', text: 'Levar os cliques ao data lake no S3, sem consumidor próprio', dominant: 'stream-to-s3', needs: ['stream-to-s3'], concepts: ['int.choose'] },
    { id: 'kafka', text: 'Trazer o sistema de fraude, que usa a API do Kafka, sem mudar o código', dominant: 'kafka', needs: ['kafka'], concepts: ['int.choose'] },
    { id: 'legado', text: 'Migrar o sistema de notas fiscais, que usa JMS, sem reescrevê-lo', dominant: 'legacy-protocol', needs: ['legacy-protocol'], concepts: ['int.choose'] },
    { id: 'crm', text: 'Trazer os dados do Salesforce para o S3 toda noite, sem código', dominant: 'saas-data', needs: ['saas-data'], concepts: ['int.choose'] },
  ],
}

export const F09_INT: PhaseDef = {
  ...META.f09,
  concepts: ['int.choreography-orchestration', 'int.saga', 'int.idempotency', 'ev.at-least-once', 'int.write-buffer', 'int.choose'],
  availability: 'available',
  simplifications: ['O marketplace e os pedidos são fictícios.', 'Cada pedido tem um requisito que decide; na prática, uma integração combina vários serviços.'],
  missions: [
    // -----------------------------------------------------------------------
    {
      id: 'int.f09.m1',
      title: 'Quem coordena a devolução',
      type: 'mission',
      summary: 'Coreografia, orquestração e saga.',
      briefing: {
        company: 'Marketplace Feira Livre',
        role: 'Você desenha os processos entre os times de um marketplace.',
        situation: 'A devolução passa por coleta, vistoria, estorno e aviso ao vendedor, cada passo num serviço com o seu banco. Hoje cada serviço reage ao evento do anterior, e quando a vistoria reprova ninguém desfaz a coleta agendada.',
        objective: 'Escolher entre coreografia e orquestração e desfazer o que foi feito quando um passo falha.',
        successCriteria: ['Usar orquestração no processo com compensação', 'Ordenar a compensação'],
      },
      intel: [
        { conceptId: 'int.choreography-orchestration', body: ['**Coreografia**: cada serviço reage aos eventos dos outros, sem coordenador; difícil de acompanhar. **Orquestração**: um coordenador, como o **Step Functions**, chama cada passo e trata erros num lugar só.'] },
        { conceptId: 'int.saga', body: ['Sem transação única entre serviços, a **saga** executa passo a passo e, na falha, roda **compensações** que desfazem os passos já feitos, do último para o primeiro.'] },
      ],
      activities: [
        {
          id: 'int.f09.m1.a1',
          kind: 'decision',
          title: 'O coordenador',
          prompt: 'A devolução tem ordem, prazos e precisa desfazer passos quando a vistoria reprova. Como organizar?',
          concepts: [{ id: 'int.choreography-orchestration' }, { id: 'int.saga', weight: 0.5 }],
          xp: 50,
          difficulty: 2,
          explanation: ['Com orquestração, o fluxo do Step Functions sabe em que passo cada devolução está e roda as compensações com Catch.'],
          options: [
            { id: 'a', text: 'Orquestração com Step Functions, com um passo de compensação para cada passo feito', correct: true, consequence: 'Cada devolução tem dono, histórico e desfazer garantido.' },
            { id: 'b', text: 'Continuar com coreografia e pedir a cada time que trate o evento de reprovação', correct: false, consequence: 'A lógica de desfazer fica espalhada em quatro serviços.' },
            { id: 'c', text: 'Uma transação de banco que cubra os quatro serviços', correct: false, consequence: 'Cada serviço tem o próprio banco: não existe essa transação.' },
          ],
        },
        {
          id: 'int.f09.m1.a2',
          kind: 'order',
          title: 'Desfazer a devolução',
          prompt: 'A coleta foi feita, o estorno foi lançado e o aviso ao vendedor falhou de vez. Ponha na ordem o que a saga faz a partir daí.',
          concepts: [{ id: 'int.saga' }],
          xp: 50,
          difficulty: 2,
          explanation: ['As compensações rodam do último passo feito para o primeiro, e a execução termina registrando a falha.'],
          steps: [
            { id: 'catch', text: 'O Catch do passo de aviso desvia para a compensação', explanation: 'As novas tentativas acabaram.' },
            { id: 'estorno', text: 'Cancelar o estorno lançado', explanation: 'Desfaz o último passo feito.' },
            { id: 'coleta', text: 'Registrar a coleta como desfeita e liberar o produto ao vendedor', explanation: 'Desfaz o primeiro passo.' },
            { id: 'fail', text: 'Terminar a execução num estado Fail, com o motivo', explanation: 'A falha fica registrada para o alarme.' },
          ],
        },
        {
          id: 'int.f09.m1.a3',
          kind: 'decision',
          title: 'Onde a coreografia basta',
          prompt: 'Quando um vendedor muda o nome da loja, a busca e o painel de vendas precisam atualizar. Não há ordem nem nada a desfazer. Como organizar?',
          concepts: [{ id: 'int.choreography-orchestration' }],
          xp: 40,
          difficulty: 2,
          explanation: ['Poucos passos independentes combinam com coreografia: um evento no EventBridge e cada serviço reage.'],
          options: [
            { id: 'a', text: 'Publicar um evento "Loja renomeada" no EventBridge, e cada serviço reage', correct: true, consequence: 'Simples, sem coordenador para manter.' },
            { id: 'b', text: 'Um fluxo do Step Functions com Retry e Catch', correct: false, consequence: 'Funciona, mas é um coordenador para um caso que não precisa.' },
          ],
        },
      ],
      debrief: { takeaways: ['Orquestração para processos com ordem e compensação.', 'Coreografia para reações independentes.', 'Saga: compensar do último para o primeiro.'] },
    },
    // -----------------------------------------------------------------------
    {
      id: 'int.f09.m2',
      title: 'A cobrança dobrada',
      type: 'mission',
      summary: 'Entrega pelo menos uma vez e consumidor idempotente.',
      briefing: {
        company: 'Marketplace Feira Livre',
        role: 'Você investiga uma reclamação de cobrança.',
        situation: 'Um comprador foi cobrado duas vezes pela mesma compra. A mensagem chegou duas vezes da fila padrão, e o consumidor cobrou nas duas.',
        objective: 'Tornar o consumidor seguro contra repetições.',
        successCriteria: ['Entender a entrega pelo menos uma vez', 'Fazer o consumidor idempotente'],
      },
      intel: [
        { conceptId: 'ev.at-least-once', body: ['Fila padrão, SNS, EventBridge e Lambda entregam **pelo menos uma vez**: a mesma mensagem pode chegar mais de uma vez.'] },
        { conceptId: 'int.idempotency', body: ['O consumidor **idempotente** guarda o ID de cada mensagem já tratada e ignora as repetidas.'] },
      ],
      activities: [
        {
          id: 'int.f09.m2.a1',
          kind: 'decision',
          title: 'A segunda cobrança',
          prompt: 'Como evitar que a mesma mensagem cobre o comprador duas vezes?',
          concepts: [{ id: 'int.idempotency' }, { id: 'ev.at-least-once', weight: 0.5 }],
          xp: 50,
          difficulty: 2,
          explanation: ['O consumidor grava o número do pedido junto com a cobrança; se o número já existe, ignora a mensagem.'],
          options: [
            { id: 'a', text: 'Gravar o número do pedido com a cobrança e ignorar mensagens de pedidos já cobrados', correct: true, consequence: 'A repetição não tem efeito.' },
            { id: 'b', text: 'Aumentar a visibilidade da fila para 12 horas', correct: false, consequence: 'Reduz um tipo de repetição, mas a fila padrão continua podendo entregar em dobro.' },
            { id: 'c', text: 'Trocar o consumidor por uma função Lambda', correct: false, consequence: 'O Lambda também recebe a mesma mensagem mais de uma vez.' },
          ],
        },
        {
          id: 'int.f09.m2.a2',
          kind: 'classify',
          title: 'Repetir faz mal?',
          prompt: 'Diga se cada operação é idempotente como está ou se precisa de proteção contra repetição.',
          concepts: [{ id: 'int.idempotency' }],
          xp: 50,
          difficulty: 2,
          explanation: ['Gravar um valor final é idempotente; somar, cobrar e enviar não são.'],
          bins: [
            { id: 'safe', label: 'Já é idempotente' },
            { id: 'guard', label: 'Precisa de proteção' },
          ],
          items: [
            { id: 'status', text: 'Gravar o status do pedido como "enviado"', bin: 'safe', explanation: 'Gravar duas vezes deixa o mesmo status.', concepts: ['int.idempotency'] },
            { id: 'saldo', text: 'Somar R$ 50 ao saldo do vendedor', bin: 'guard', explanation: 'Duas vezes somam R$ 100.', concepts: ['int.idempotency'] },
            { id: 'email', text: 'Enviar o e-mail de confirmação', bin: 'guard', explanation: 'O cliente recebe dois e-mails.', concepts: ['int.idempotency'] },
            { id: 'endereco', text: 'Substituir o endereço de entrega pelo novo', bin: 'safe', explanation: 'O resultado é o mesmo.', concepts: ['int.idempotency'] },
          ],
        },
      ],
      debrief: { takeaways: ['Pelo menos uma vez: espere repetições.', 'Idempotência com um ID guardado.'] },
    },
    // -----------------------------------------------------------------------
    {
      id: 'int.f09.m3',
      title: 'O banco que não aguentava',
      type: 'mission',
      summary: 'Fila como buffer de escrita.',
      briefing: {
        company: 'Marketplace Feira Livre',
        role: 'Você protege o banco de avaliações.',
        situation: 'Depois de cada live de vendas, milhares de compradores avaliam ao mesmo tempo, e o banco de avaliações estoura as conexões. As avaliações podem aparecer alguns minutos depois.',
        objective: 'Absorver o pico sem perder avaliações.',
        successCriteria: ['Pôr uma fila na frente do banco', 'Limitar quem grava'],
      },
      intel: [{ conceptId: 'int.write-buffer', body: ['Com uma **fila na frente**, a aplicação só enfileira; consumidores gravam no ritmo que o banco aguenta. A **concorrência máxima** do mapeamento do Lambda limita as gravações simultâneas.'] }],
      activities: [
        {
          id: 'int.f09.m3.a1',
          kind: 'decision',
          title: 'O pico das avaliações',
          prompt: 'Como absorver o pico de avaliações sem trocar o banco?',
          concepts: [{ id: 'int.write-buffer' }],
          xp: 50,
          difficulty: 2,
          explanation: ['A fila guarda o pico; o Lambda com concorrência máxima grava no ritmo do banco.'],
          options: [
            { id: 'a', text: 'Enviar as avaliações a uma fila SQS e gravar com Lambda, limitando a concorrência máxima do mapeamento', correct: true, consequence: 'O banco recebe um fluxo constante, e nenhuma avaliação se perde.' },
            { id: 'b', text: 'Pôr um tópico SNS na frente do banco', correct: false, consequence: 'O tópico empurra tudo na hora: o pico continua chegando ao banco.' },
            { id: 'c', text: 'Recusar avaliações quando o banco estiver cheio', correct: false, consequence: 'Perde avaliações.' },
          ],
        },
      ],
      debrief: { takeaways: ['Fila na frente do banco nivela o pico.'] },
    },
    // -----------------------------------------------------------------------
    {
      id: 'int.f09.m4',
      title: 'O quadro de escolha',
      type: 'mission',
      summary: 'Do requisito ao serviço de integração.',
      briefing: {
        company: 'Marketplace Feira Livre',
        role: 'Você monta o guia de integração do marketplace.',
        situation: 'Os times escolhem serviços pelo que já conhecem. A arquitetura quer um quadro: cada requisito aponta um serviço.',
        objective: 'Ligar cada requisito ao serviço.',
        successCriteria: ['Associar requisito e serviço'],
      },
      intel: [{ conceptId: 'int.choose', body: ['Um consumidor: **SQS**. Ordem: **SQS FIFO**. Vários destinos: **SNS**. Eventos da AWS e regras por conteúdo: **EventBridge**. Passos coordenados: **Step Functions**. API: **API Gateway**. Muitos eventos relidos: **Kinesis**. Broker existente: **Amazon MQ**.'] }],
      activities: [
        {
          id: 'int.f09.m4.a1',
          kind: 'match',
          title: 'Requisito e serviço',
          prompt: 'Associe cada requisito ao serviço.',
          concepts: [{ id: 'int.choose' }],
          xp: 50,
          difficulty: 2,
          explanation: ['Cada serviço resolve um tipo de integração.'],
          leftLabel: 'Requisito',
          rightLabel: 'Serviço',
          pairs: [
            { id: 'sqs', left: 'Distribuir tarefas entre trabalhadores', right: 'Amazon SQS', explanation: 'Uma mensagem, um consumidor.', concepts: ['int.choose'] },
            { id: 'sns', left: 'Avisar vários sistemas da mesma mensagem', right: 'Amazon SNS', explanation: 'Publicar e assinar.', concepts: ['int.choose'] },
            { id: 'sfn', left: 'Coordenar passos com compensação', right: 'AWS Step Functions', explanation: 'Orquestração.', concepts: ['int.choose'] },
            { id: 'kds', left: 'Eventos lidos por vários e relidos', right: 'Kinesis Data Streams', explanation: 'Stream com retenção.', concepts: ['int.choose'] },
            { id: 'mq', left: 'Migrar um sistema que usa JMS', right: 'Amazon MQ', explanation: 'Broker gerenciado.', concepts: ['int.choose'] },
          ],
        },
      ],
      debrief: { takeaways: ['O requisito aponta o serviço.'] },
    },
    // -----------------------------------------------------------------------
    {
      id: 'int.f09.boss',
      title: 'Doze pedidos, doze integrações',
      type: 'boss',
      summary: 'Cada pedido dos times pelo serviço certo.',
      briefing: {
        company: 'Marketplace Feira Livre',
        role: 'Você fecha o guia de integração.',
        situation: 'Doze pedidos chegaram dos times de vendas, finanças, logística, dados e segurança.',
        objective: 'Escolher o serviço de cada pedido, com o mínimo de operação.',
        successCriteria: ['Todos os pedidos atendidos', 'A opção mais simples em cada caso'],
      },
      intel: [{ conceptId: 'int.choose', body: ['Procure o requisito que decide cada pedido. Quando duas opções atendem, a mais simples vale mais.'] }],
      activities: [
        {
          id: 'int.f09.boss.a1',
          kind: 'lab',
          lab: 'int-chooser',
          title: 'O guia de integração',
          prompt: 'Para cada pedido, escolha o serviço. Depois da verificação, cada cartão mostra o que a escolha atende ou não.',
          concepts: [{ id: 'int.choose' }],
          xp: 200,
          difficulty: 3,
          hints: ['Vários destinos sem perder nada se um cair pede uma fila para cada um.', 'Kinesis também guarda e deixa reler; o MSK é para quem já usa Kafka.'],
          explanation: [
            'Fotos: SQS. Saldo: SQS FIFO. Venda: SNS com uma fila por sistema. GuardDuty e SaaS: EventBridge. Mensalidades: Scheduler. Devolução: Step Functions.',
            'Parceiros: API Gateway. Cliques: Kinesis. Data lake: Data Firehose. Fraude: MSK. Notas fiscais: Amazon MQ. Salesforce: AppFlow.',
          ],
          config: FEIRA_PEDIDOS,
        },
      ],
      debrief: { takeaways: ['A pergunta aponta o serviço.', 'Quando dois atendem, o mais simples vale mais.'] },
    },
  ],
}
