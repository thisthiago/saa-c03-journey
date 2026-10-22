/** Desafio final — Arquitetura Orientada a Eventos (empresa fictícia: Loja Virtual Vitrine). */
import type { PhaseDef } from '../../../../../engine/types'
import type { ArchitectureLabConfig } from '../../../../../simulators/architecture/lab'
import { META } from '../meta'

export const VITRINE: ArchitectureLabConfig = {
  title: 'Relatório da Arquitetura Orientada a Eventos',
  dimensions: [
    { id: 'seguro', label: 'Seguro', examDomain: 'd1' },
    { id: 'resiliente', label: 'Resiliente', examDomain: 'd2' },
    { id: 'desempenho', label: 'Alto desempenho', examDomain: 'd3' },
    { id: 'custo', label: 'Custo otimizado', examDomain: 'd4' },
    { id: 'requisitos', label: 'Atendimento aos requisitos' },
  ],
  minDimension: 0.5,
  disclaimer: 'A rubrica e os pesos são pedagógicos, definidos pelo AWS Quest. Os fatos sobre os serviços foram conferidos na documentação da AWS em 22/10/2026.',
  steps: [
    {
      id: 'entrada',
      title: 'Entrada dos pedidos',
      intro: 'A **Loja Virtual Vitrine** recebe pedidos do site, do app e de lojas parceiras. Cada parceiro contratou um limite de chamadas, e o app tem login próprio de usuários.',
      questions: [
        {
          id: 'api',
          prompt: 'Como receber os pedidos?',
          options: [
            { id: 'rest', label: 'API REST no API Gateway com usage plan por parceiro, Cognito para os usuários do app e IAM para os sistemas internos', scores: { seguro: 1, requisitos: 1, desempenho: 1 }, consequence: 'Cada parceiro tem o seu limite, e cada chamador entra pelo mecanismo certo.', concepts: ['apigw.usage-plans', 'apigw.auth', 'apigw.rest-vs-http'] },
            { id: 'http', label: 'API HTTP no API Gateway, com uma chave de API para cada parceiro', scores: { seguro: 0.3, requisitos: 0.3, custo: 1 }, consequence: 'A API HTTP não tem usage plans, e chave de API não é autorização.', whyNot: 'Limite por parceiro só existe na REST.', concepts: ['apigw.rest-vs-http', 'apigw.usage-plans'] },
            { id: 'direto', label: 'Os parceiros chamam direto as funções Lambda pela URL de cada uma', scores: { seguro: 0.4, requisitos: 0.3, custo: 1 }, consequence: 'Sem limites por parceiro, um parceiro com bug derruba os outros.', whyNot: 'Faltam os limites por cliente.', concepts: ['apigw.throttling'] },
          ],
        },
      ],
    },
    {
      id: 'fila',
      title: 'A fila que absorve os picos',
      intro: 'Na Black Friday, os pedidos chegam a 20 vezes o normal. O processamento de cada pedido leva 40 s numa função Lambda com tempo limite de 60 s, e alguns pedidos chegam com defeito.',
      questions: [
        {
          id: 'buffer',
          prompt: 'Como absorver o pico?',
          options: [
            { id: 'sqs-dlq', label: 'Fila SQS entre a API e o processamento, com visibilidade de 360 s, DLQ com maxReceiveCount 5 e concorrência máxima no mapeamento', scores: { resiliente: 1, desempenho: 1, requisitos: 1, custo: 1 }, consequence: 'O pico espera na fila, nada é processado em dobro por visibilidade curta, e os pedidos com defeito vão para a DLQ.', concepts: ['int.write-buffer', 'sqs.lambda', 'sqs.dlq'] },
            { id: 'sqs-30', label: 'Fila SQS com a visibilidade padrão de 30 s e sem DLQ', scores: { resiliente: 0.4, requisitos: 0.5, custo: 1 }, consequence: 'Pedidos voltam à fila enquanto ainda são processados, e os com defeito ficam voltando até o fim da retenção.', whyNot: 'Visibilidade menor que o processamento e sem DLQ.', concepts: ['sqs.visibility', 'sqs.dlq'] },
            { id: 'sync', label: 'A API chama a função de processamento direto, de forma síncrona', scores: { resiliente: 0.3, desempenho: 0.4, requisitos: 0.5, custo: 1 }, consequence: 'No pico, o processamento limita a API, e os clientes recebem erros.', whyNot: 'Sem nada que absorva o pico.', concepts: ['int.sync-async'] },
          ],
        },
      ],
    },
    {
      id: 'ordem',
      title: 'Ordem e duplicidade',
      intro: 'Cada pedido gera "reservar", "cobrar" e "separar", que precisam acontecer nessa ordem. Clientes clicam duas vezes em "comprar".',
      questions: [
        {
          id: 'fifo',
          prompt: 'Como garantir a ordem e não duplicar?',
          options: [
            { id: 'fifo-pedido', label: 'Fila FIFO com o número do pedido como grupo, deduplicação pelo ID do pedido e consumidor idempotente', scores: { resiliente: 1, requisitos: 1, desempenho: 1 }, consequence: 'Cada pedido fica em ordem, e o clique duplo não gera outra cobrança.', concepts: ['sqs.fifo', 'sqs.dedup', 'int.idempotency'] },
            { id: 'fifo-um-grupo', label: 'Fila FIFO com um único grupo para todos os pedidos', scores: { requisitos: 0.7, desempenho: 0.3, resiliente: 0.8 }, consequence: 'A ordem é mantida, mas um pedido por vez: a fila vira gargalo na Black Friday.', whyNot: 'Um grupo só serializa tudo.', concepts: ['sqs.fifo', 'sqs.fifo-throughput'] },
            { id: 'padrao', label: 'Fila padrão, confiando que a ordem costuma ser respeitada', scores: { requisitos: 0.3, resiliente: 0.5, custo: 1 }, consequence: 'Às vezes a cobrança chega antes da reserva, e o clique duplo cobra duas vezes.', whyNot: 'A fila padrão não garante ordem e entrega pelo menos uma vez.', concepts: ['sqs.what', 'ev.at-least-once'] },
          ],
        },
      ],
    },
    {
      id: 'distribuir',
      title: 'Distribuição para vários sistemas',
      intro: 'Cada pedido confirmado precisa chegar ao estoque, à nota fiscal, ao programa de pontos e ao e-mail. O programa de pontos cai às vezes por horas, e o e-mail só quer pedidos acima de R$ 500.',
      questions: [
        {
          id: 'fanout',
          prompt: 'Como entregar a todos?',
          options: [
            { id: 'sns-sqs', label: 'Tópico SNS com uma fila SQS por sistema e política de filtro na assinatura do e-mail', scores: { resiliente: 1, requisitos: 1, custo: 1 }, consequence: 'Cada sistema consome no seu ritmo; o programa de pontos fora do ar só acumula a fila dele.', concepts: ['ev.fanout', 'sns.filter'] },
            { id: 'sns-http', label: 'Tópico SNS entregando direto nos endpoints HTTP de cada sistema', scores: { resiliente: 0.4, requisitos: 0.7, custo: 1 }, consequence: 'Depois de 6 horas de tentativas, as mensagens do programa de pontos são descartadas.', whyNot: 'Endpoints HTTP têm 50 tentativas em 6 horas.', concepts: ['sns.retries-dlq'] },
            { id: 'uma-fila', label: 'Uma fila SQS lida pelos quatro sistemas', scores: { resiliente: 0.5, requisitos: 0.2, custo: 1 }, consequence: 'Cada pedido chega a um só dos quatro sistemas.', whyNot: 'Fila é um consumidor por mensagem.', concepts: ['int.queue-vs-stream'] },
          ],
        },
      ],
    },
    {
      id: 'eventos',
      title: 'Eventos entre times',
      intro: 'O time de marketing, numa conta separada, quer reagir a "cliente novo" e "carrinho abandonado". O time de segurança quer agir sobre os achados do GuardDuty. Ontem um bug no marketing descartou os eventos da tarde.',
      questions: [
        {
          id: 'barramento',
          prompt: 'Como organizar os eventos?',
          options: [
            { id: 'eb', label: 'Barramento personalizado com arquivo, regras por padrão de evento, entrega ao barramento da conta de marketing e regras no barramento padrão para o GuardDuty', scores: { requisitos: 1, resiliente: 1, seguro: 1 }, consequence: 'Cada time recebe só o que quer, e o replay recupera a tarde perdida.', concepts: ['eb.rules-patterns', 'eb.cross-account', 'eb.archive-replay', 'eb.bus'] },
            { id: 'eb-sem-arquivo', label: 'Barramento personalizado com regras e entrega à conta de marketing, sem arquivo', scores: { requisitos: 0.7, resiliente: 0.5, seguro: 1, custo: 1 }, consequence: 'Funciona, mas os eventos da tarde perdida não podem ser reenviados.', whyNot: 'Sem arquivo não há replay.', concepts: ['eb.archive-replay'] },
            { id: 'credencial', label: 'Dar ao marketing uma credencial para ler a fila de pedidos da conta principal', scores: { seguro: 0.3, requisitos: 0.4, resiliente: 0.6 }, consequence: 'O marketing disputa as mensagens com o processamento e recebe tudo, não só os eventos que quer.', whyNot: 'Fila não é para vários leitores, e a credencial cruza contas sem necessidade.', concepts: ['int.queue-vs-stream', 'eb.cross-account'] },
          ],
        },
      ],
    },
    {
      id: 'fluxo',
      title: 'O fluxo do pedido',
      intro: 'Reservar, cobrar, emitir nota e agendar a entrega: se a cobrança falha de vez, a reserva tem de ser desfeita. O gateway de pagamento falha às vezes e responde na tentativa seguinte. Pedidos acima de R$ 10 mil esperam aprovação manual por até 2 dias.',
      questions: [
        {
          id: 'orquestracao',
          prompt: 'Como coordenar os passos?',
          options: [
            { id: 'sfn-standard', label: 'Step Functions Standard com Retry na cobrança, Catch para a compensação e espera por callback na aprovação', scores: { resiliente: 1, requisitos: 1 }, consequence: 'Falhas passageiras se resolvem sozinhas, as permanentes desfazem a reserva, e a aprovação espera o tempo que for.', concepts: ['sfn.standard-express', 'sfn.retry-catch', 'sfn.integration-patterns', 'int.saga'] },
            { id: 'sfn-express', label: 'Step Functions Express com Retry e Catch', scores: { resiliente: 0.6, requisitos: 0.4, custo: 1 }, consequence: 'O Express dura até 5 minutos e não espera callback: a aprovação de 2 dias não cabe.', whyNot: 'Processo longo e com espera humana pede Standard.', concepts: ['sfn.standard-express'] },
            { id: 'coreografia', label: 'Cada serviço reage ao evento do anterior, sem coordenador', scores: { resiliente: 0.5, requisitos: 0.6, custo: 1 }, consequence: 'Desfazer a reserva quando a cobrança falha fica espalhado entre os serviços.', whyNot: 'Processo com ordem e compensação pede orquestração.', concepts: ['int.choreography-orchestration'] },
          ],
        },
      ],
    },
    {
      id: 'stream',
      title: 'Cliques para relatórios',
      intro: 'O site gera 4 MB/s de cliques. O painel ao vivo e o modelo de recomendação leem os cliques, e o modelo relê as últimas 24 horas quando é atualizado. Tudo também vai para o data lake.',
      questions: [
        {
          id: 'cliques',
          prompt: 'Como levar os cliques?',
          options: [
            { id: 'kds-fh', label: 'Kinesis Data Streams com chave de partição pelo ID da sessão, os dois leitores e um Data Firehose gravando no S3', scores: { desempenho: 1, requisitos: 1, resiliente: 1 }, consequence: 'Cada leitor lê no seu ritmo, o modelo relê, e o data lake recebe sem código.', concepts: ['kds.streams', 'kds.partition-key', 'fh.delivery'] },
            { id: 'kds-data', label: 'Kinesis Data Streams com a data do dia como chave de partição', scores: { desempenho: 0.3, requisitos: 0.6, resiliente: 0.7 }, consequence: 'Todos os cliques do dia vão para um shard só, que estoura.', whyNot: 'A chave concentra o tráfego.', concepts: ['kds.partition-key'] },
            { id: 'sqs', label: 'Uma fila SQS para os cliques', scores: { requisitos: 0.3, desempenho: 0.6, custo: 1 }, consequence: 'Cada clique vai para um leitor só, e nada pode ser relido.', whyNot: 'Vários leitores e releitura pedem stream.', concepts: ['int.queue-vs-stream'] },
          ],
        },
      ],
    },
    {
      id: 'legado',
      title: 'O legado e o custo',
      intro: 'O sistema de notas fiscais, comprado de um fornecedor, usa JMS com ActiveMQ e não pode ser alterado. A loja quer gastar o mínimo com a mensageria das partes novas.',
      questions: [
        {
          id: 'broker',
          prompt: 'Como integrar o legado?',
          options: [
            { id: 'mq-ha', label: 'Amazon MQ com ActiveMQ em implantação ativa e em espera, só para o sistema de notas; o resto em SQS, SNS e EventBridge', scores: { resiliente: 1, requisitos: 1, custo: 1 }, consequence: 'O legado roda sem mudança, sem cair com uma zona, e as partes novas pagam por uso.', concepts: ['mq.what', 'mq.ha', 'mq.vs-sqs'] },
            { id: 'mq-single', label: 'Amazon MQ de instância única para o sistema de notas', scores: { resiliente: 0.4, requisitos: 0.8, custo: 1 }, consequence: 'Se a zona do broker falha, as notas param.', whyNot: 'Instância única fica numa zona só.', concepts: ['mq.ha'] },
            { id: 'mq-tudo', label: 'Amazon MQ para todas as integrações, legadas e novas', scores: { resiliente: 0.8, requisitos: 0.8, custo: 0.4 }, consequence: 'As partes novas herdam um broker para dimensionar e pagar por hora.', whyNot: 'Para aplicações novas, a AWS recomenda SQS e SNS.', concepts: ['mq.vs-sqs'] },
          ],
        },
      ],
    },
  ],
  rules: [
    {
      id: 'sync-sem-fila',
      when: [
        ['buffer', ['sync']],
        ['fanout', ['sns-http', 'uma-fila']],
      ],
      penalty: { resiliente: 0.3 },
      message: 'Pedidos processados de forma síncrona e distribuídos sem filas por sistema: um sistema lento ou fora do ar derruba a loja inteira.',
      concepts: ['int.sync-async', 'ev.fanout'],
    },
    {
      id: 'padrao-sem-idempotencia',
      when: [
        ['fifo', ['padrao']],
        ['orquestracao', ['coreografia']],
      ],
      penalty: { requisitos: 0.3 },
      message: 'Fila padrão sem consumidor idempotente e sem coordenador: cobranças em dobro e reservas que ninguém desfaz.',
      concepts: ['int.idempotency', 'int.saga'],
    },
    {
      id: 'chave-api-sem-auth',
      when: [
        ['api', ['http', 'direto']],
        ['barramento', ['credencial']],
      ],
      penalty: { seguro: 0.3 },
      message: 'API sem autorização de verdade e credenciais cruzando contas: o acesso aos pedidos fica sem controle.',
      concepts: ['apigw.auth', 'eb.cross-account'],
    },
  ],
}

export const FINAL_INT: PhaseDef = {
  ...META.final,
  concepts: [
    'apigw.usage-plans',
    'apigw.auth',
    'apigw.rest-vs-http',
    'apigw.throttling',
    'int.sync-async',
    'int.write-buffer',
    'sqs.what',
    'sqs.lambda',
    'sqs.visibility',
    'sqs.dlq',
    'sqs.fifo',
    'sqs.dedup',
    'sqs.fifo-throughput',
    'int.idempotency',
    'ev.at-least-once',
    'ev.fanout',
    'sns.filter',
    'sns.retries-dlq',
    'int.queue-vs-stream',
    'eb.bus',
    'eb.rules-patterns',
    'eb.cross-account',
    'eb.archive-replay',
    'sfn.standard-express',
    'sfn.retry-catch',
    'sfn.integration-patterns',
    'int.saga',
    'int.choreography-orchestration',
    'kds.streams',
    'kds.partition-key',
    'fh.delivery',
    'mq.what',
    'mq.ha',
    'mq.vs-sqs',
    'int.choose',
  ],
  availability: 'available',
  simplifications: ['A rubrica e os pesos das dimensões são pedagógicos, definidos pelo AWS Quest.', 'A loja, os volumes e os sistemas são fictícios.'],
  missions: [
    {
      id: 'int.final.vitrine',
      title: 'Arquitetura Orientada a Eventos da Loja Vitrine',
      type: 'final',
      summary: 'Oito etapas de decisões de integração, cruzadas, com relatório por dimensão.',
      passThreshold: 0.7,
      briefing: {
        company: 'Loja Virtual Vitrine',
        role: 'Você desenha a integração de uma loja virtual que cresce rápido.',
        situation: 'Pedidos por API de site, app e parceiros; pagamento, estoque, nota e entrega; avisos ao cliente; relatórios quase em tempo real; e um sistema de notas fiscais legado que não pode mudar. A Black Friday é daqui a um mês.',
        objective: 'Escolher API, filas, tópicos, eventos, fluxos, streams e brokers que funcionem juntos.',
        successCriteria: ['Nota geral de 70% ou mais', 'Pelo menos 50% em cada dimensão da rubrica'],
      },
      intel: [
        { conceptId: 'int.choose', body: ['Cada decisão pesa nas outras: uma fila sem DLQ com consumidor que não é idempotente, ou uma API sem limites na frente de um processamento síncrono. O relatório aponta esses conflitos.'] },
        { conceptId: 'int.write-buffer' },
      ],
      activities: [
        {
          id: 'int.final.vitrine.a1',
          kind: 'lab',
          lab: 'architecture',
          title: 'Arquitetura Orientada a Eventos',
          prompt: 'Percorra as oito etapas e envie o projeto para receber o relatório.',
          concepts: [{ id: 'apigw.usage-plans' }, { id: 'int.write-buffer' }, { id: 'sqs.fifo' }, { id: 'ev.fanout' }, { id: 'eb.rules-patterns' }, { id: 'sfn.retry-catch' }, { id: 'kds.streams' }, { id: 'mq.vs-sqs' }],
          xp: 300,
          difficulty: 3,
          reviewWeakNow: true,
          hints: ['Cada requisito do enunciado de uma etapa costuma eliminar uma ou duas opções.', 'Quando duas opções funcionam, a com menos operação costuma ser a melhor.'],
          explanation: [
            'Projeto de referência: API REST com usage plans, Cognito e IAM; fila SQS com visibilidade de seis vezes o tempo limite e DLQ; fila FIFO por pedido com deduplicação e consumidor idempotente; SNS com uma fila por sistema e filtro.',
            'Barramento com arquivo, regras e entrega entre contas; Step Functions Standard com Retry, Catch e callback; Kinesis com chave pela sessão e Firehose; Amazon MQ ativo e em espera só para o legado.',
            'Os conceitos ligados às decisões erradas entram na sua revisão imediatamente.',
          ],
          config: VITRINE,
        },
      ],
      debrief: { takeaways: ['A fila absorve picos; a FIFO guarda a ordem; o tópico distribui.', 'Eventos entre times pelo barramento; processos com compensação pelo Step Functions.', 'Stream para muitos leitores; broker só para o legado.'] },
    },
  ],
}
