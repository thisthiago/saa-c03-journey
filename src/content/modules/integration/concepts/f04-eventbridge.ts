/**
 * Conceitos da Fase 4 — EventBridge. Reaproveita ev.eventbridge (S3 Expedition).
 * Fatos conferidos em 22/10/2026 (ver docs/VERIFICACAO-DE-CONTEUDO.md).
 */
import type { ConceptDef } from '../../../../engine/types'
import { R } from './refs'

export const F04_INT_CONCEPTS: ConceptDef[] = [
  {
    id: 'eb.bus',
    title: 'Barramento de eventos',
    officialName: 'Amazon EventBridge event buses',
    serviceIds: ['aws.eventbridge'],
    summary: 'O **barramento** recebe eventos e os entrega conforme as **regras**. Toda conta tem o barramento **padrão**, que recebe os eventos dos serviços da AWS; a empresa cria barramentos **personalizados** para os eventos das próprias aplicações, e há barramentos de **parceiros SaaS**.',
    explanation: [
      'O EventBridge é um roteador de eventos: os produtores publicam o que aconteceu ("pedido criado", "instância parada") sem saber quem vai reagir, e as regras de cada consumidor escolhem o que receber. Assim dá para acrescentar consumidores sem mexer no produtor.',
      'Exemplo: o serviço de pedidos publica o evento PedidoCriado no barramento da aplicação. Uma regra o manda para o Step Functions do faturamento, outra para a Lambda de recomendações, e uma terceira, que filtra pedidos acima de R$ 10 mil, avisa a equipe antifraude.',
    ],
    comparisons: [
      { with: 'sns.what', text: 'O SNS entrega a todos os assinantes do tópico, com filtros por atributos. O EventBridge roteia por padrões sobre o conteúdo do evento, recebe eventos dos serviços da AWS e de SaaS e tem arquivamento e replay.' },
    ],
    facts: ['A documentação de 22/10/2026 separa os barramentos clássicos, com regras e alvos, de um novo tipo, o Custom Event Bus, em que os consumidores criam as próprias assinaturas e os eventos ficam guardados para reprocessamento.'],
    exam: {
      domains: ['d2'],
      relevance: 'alta',
      notes: 'Sinais: "reagir a eventos de serviços da AWS ou de aplicações SaaS", "roteamento pelo conteúdo do evento" e "arquitetura orientada a eventos". A resposta é o EventBridge.',
    },
    references: [R.ebBus],
    tags: ['integracao'],
  },
  {
    id: 'eb.rules-patterns',
    title: 'Regras e padrões de evento',
    officialName: 'Rules and event patterns',
    serviceIds: ['aws.eventbridge'],
    summary: 'A **regra** tem um **padrão de evento** com a mesma estrutura do evento. Cada campo citado precisa casar (**E**); uma lista de valores é **OU**; campos que o padrão não cita são **ignorados**. Há operadores de prefixo, sufixo, anything-but, faixa numérica, exists e equals-ignore-case.',
    commonMistakes: ['Escrever o número entre aspas no padrão e não casar com o evento, que tem o número sem aspas'],
    exam: { domains: ['d2'], relevance: 'alta' },
    references: [R.ebPatterns, R.ebOperators, R.ebRules],
    tags: ['integracao'],
  },
  {
    id: 'eb.targets',
    title: 'Alvos e DLQ dos alvos',
    officialName: 'Event bus targets',
    serviceIds: ['aws.eventbridge', 'aws.sqs'],
    summary: 'Cada regra entrega o evento a até **cinco alvos**: Lambda, filas SQS, tópicos SNS, Step Functions, Kinesis, outro barramento e muitos outros serviços. Se a entrega a um alvo falha depois das novas tentativas, o evento pode ir para uma **DLQ**, uma fila SQS padrão.',
    exam: { domains: ['d2'], relevance: 'media' },
    references: [R.ebTargets, R.ebRules],
    tags: ['integracao'],
  },
  {
    id: 'eb.cross-account',
    title: 'Eventos entre contas',
    officialName: 'Sending and receiving events between AWS accounts',
    serviceIds: ['aws.eventbridge'],
    summary: 'Uma regra pode ter como alvo o **barramento de outra conta**. A conta que recebe libera o envio com uma **política de recurso** no barramento dela, e lá suas próprias regras decidem o destino.',
    exam: {
      domains: ['d1', 'd2'],
      relevance: 'media',
      notes: 'Sinal: "centralizar os eventos de várias contas numa conta de operação". A resposta é enviar os eventos ao barramento dessa conta, liberado por uma política de recurso.',
    },
    references: [R.ebCrossAccount],
    tags: ['integracao', 'seguranca'],
  },
  {
    id: 'eb.archive-replay',
    title: 'Arquivamento e reprocessamento',
    officialName: 'Archiving and replaying events',
    serviceIds: ['aws.eventbridge'],
    summary: 'O **arquivo** guarda os eventos de um barramento, todos ou os que casam com um padrão, por um prazo que vai de dias a **indefinido** (o padrão). O **replay** reenvia ao **mesmo barramento** os eventos de um intervalo de tempo, por exemplo depois de corrigir um consumidor.',
    facts: ['Cabem até 10 reprocessamentos ao mesmo tempo por conta e Região.'],
    exam: {
      domains: ['d2'],
      relevance: 'media',
      notes: 'Sinal: "reprocessar os eventos de um período depois de corrigir um consumidor". A resposta é o arquivamento com replay do EventBridge.',
    },
    references: [R.ebArchive],
    tags: ['integracao', 'recuperacao'],
  },
  {
    id: 'eb.scheduler',
    title: 'EventBridge Scheduler',
    officialName: 'Amazon EventBridge Scheduler',
    serviceIds: ['aws.eventbridge'],
    summary: 'O **Scheduler** cria agendamentos únicos ou recorrentes, em escala de **milhões**, que chamam mais de **270 serviços** da AWS, com janela flexível e novas tentativas. A AWS recomenda o Scheduler no lugar das regras agendadas, que ficaram como recurso legado.',
    commonMistakes: ['Criar uma regra agendada por cliente até bater no limite de regras do barramento'],
    exam: {
      domains: ['d2'],
      relevance: 'media',
      notes: 'Sinal: "executar tarefas agendadas, como um cron, sem servidor". A resposta é o EventBridge Scheduler.',
    },
    references: [R.scheduler, R.ebRules],
    tags: ['integracao'],
  },
  {
    id: 'eb.pipes',
    title: 'EventBridge Pipes',
    officialName: 'Amazon EventBridge Pipes',
    serviceIds: ['aws.eventbridge'],
    summary: 'O **Pipe** liga **uma origem a um alvo**, ponto a ponto, com **filtro** e **enriquecimento** opcionais no meio. Serve, por exemplo, para ler uma fila SQS ou um stream e entregar ao Step Functions sem escrever código de integração.',
    exam: { domains: ['d2'], relevance: 'baixa' },
    references: [R.ebPipes],
    tags: ['integracao'],
  },
]
