/**
 * Conceitos da Fase 7 — Lambda.
 * Fatos conferidos em 20/10/2026 (ver docs/VERIFICACAO-DE-CONTEUDO.md).
 */
import type { ConceptDef } from '../../../../engine/types'
import { R } from './refs'

export const F07_CMP_CONCEPTS: ConceptDef[] = [
  {
    id: 'lambda.function',
    title: 'Funções Lambda',
    officialName: 'AWS Lambda functions',
    serviceIds: ['aws.lambda'],
    summary: 'Código que roda **quando um evento chega**, sem servidor para gerenciar. Cada requisição em andamento usa um **ambiente de execução**, que o Lambda cria, reaproveita e descarta sozinho. Você paga pelas requisições e pelo tempo de execução.',
    explanation: [
      'Pense numa função como um atendente chamado só quando há trabalho: chega o evento, ele processa e vai embora. O limite da comparação: um mesmo ambiente pode ser reaproveitado no próximo evento, mas a função não pode contar com isso para guardar estado.',
      'Você entrega o código e escolhe a memória e o tempo limite; o Lambda cuida dos servidores, da escala e da disponibilidade. Cada requisição simultânea ganha um ambiente, então a escala acompanha o número de eventos, até o limite de concorrência.',
      'Exemplo: um upload no S3 dispara uma função que gera a miniatura da imagem. Com 10 uploads por dia ou 10 mil por minuto, o mesmo código atende, e sem uploads não há cobrança de execução.',
      '**Regra prática:** tarefa curta, acionada por evento e sem estado é candidata natural ao Lambda.',
    ],
    comparisons: [
      { with: 'fargate.isolation', text: 'O Fargate roda contêineres sem gerenciar servidores e sem o limite de 15 minutos. O Lambda é mais simples, mas limitado a invocações curtas.' },
    ],
    facts: [
      'O Lambda foi feito para tarefas curtas, que não guardam estado entre invocações.',
      'A documentação atual chama as funções clássicas de Event Functions e lista variantes novas (Web Functions, MicroVMs, durable functions e Lambda Managed Instances). Esta trilha trata das funções clássicas.',
    ],
    exam: {
      domains: ['d2', 'd3'],
      relevance: 'alta',
      notes: 'Sinais: "acionado por eventos", "cargas intermitentes", "sem gerenciar servidores" e "pagar só pelo uso". O Lambda é distrator quando a tarefa passa de 15 minutos, precisa de estado local ou roda de forma constante e pesada.',
    },
    references: [R.lambdaWhat, R.lambdaQuotas],
    tags: ['fundamentos'],
  },
  {
    id: 'lambda.limits',
    title: 'Limites de uma função',
    officialName: 'Lambda quotas',
    serviceIds: ['aws.lambda'],
    summary: 'Uma invocação dura no máximo **15 minutos** (900 s). Memória de **128 MB a 10.240 MB**; `/tmp` de 512 MB a 10.240 MB; payload de **6 MB** na chamada síncrona e **1 MB** na assíncrona; pacote .zip de 50 MB (250 MB descompactado) ou imagem de contêiner de até 10 GB.',
    commonMistakes: ['Colocar no Lambda um processamento que leva 40 minutos: o timeout máximo é de 15'],
    facts: ['Até 5 camadas (layers) por função.', 'Variáveis de ambiente somam no máximo 4 KB.'],
    exam: {
      domains: ['d3'],
      relevance: 'alta',
      notes: 'Os limites que mais pesam nas decisões são os 15 minutos por invocação e os payloads de 6 MB (síncrono) e 1 MB (assíncrono). Se o processamento passa de 15 minutos, a resposta muda para Fargate, ECS, Batch ou Step Functions dividindo o trabalho.',
    },
    references: [R.lambdaQuotas],
    tags: ['desempenho'],
  },
  {
    id: 'lambda.memory-cpu',
    title: 'Memória também é CPU',
    officialName: 'Lambda memory and CPU',
    serviceIds: ['aws.lambda'],
    summary: 'No Lambda, você não escolhe a CPU: ela vem **em proporção à memória**. Com **1.769 MB**, a função tem o equivalente a **1 vCPU**. Uma função lenta por CPU pode ficar mais rápida, e às vezes mais barata, com mais memória.',
    explanation: [
      'Exemplo: uma função que processa imagens leva 10 s com 512 MB. Com 2.048 MB, ela ganha mais CPU e passa a levar 2 s. Como o custo é memória vezes tempo, a função fica mais rápida e, nesse caso, até mais barata.',
    ],
    exam: { domains: ['d3'], relevance: 'media' },
    references: [R.lambdaQuotas],
    tags: ['desempenho'],
  },
  {
    id: 'lambda.concurrency',
    title: 'Concorrência',
    officialName: 'Lambda concurrency',
    serviceIds: ['aws.lambda'],
    summary: '**Concorrência** é o número de requisições em andamento ao mesmo tempo: **requisições por segundo × duração média**. A conta tem **1.000 por Região** por padrão, divididas entre todas as funções. Acima disso, há **throttling**.',
    explanation: [
      'A conta de concorrência ajuda a prever a escala: 100 requisições por segundo que duram 0,5 s cada mantêm cerca de 50 ambientes ocupados. O limite vem da conta e é compartilhado por todas as funções da Região: uma função muito acionada pode consumir a cota e causar throttling nas outras.',
      '**Regra prática:** concorrência é requisições por segundo vezes a duração; para proteger funções críticas, use a concorrência reservada.',
    ],
    comparisons: [
      { with: 'lambda.reserved', text: 'A concorrência reservada separa parte da cota para uma função: é garantia e teto ao mesmo tempo.' },
      { with: 'lambda.provisioned', text: 'A concorrência provisionada mantém ambientes já iniciados para evitar o cold start; ela não aumenta a cota da conta.' },
    ],
    facts: [
      'O limite de requisições por segundo é 10 vezes a concorrência: com 1.000, no máximo 10.000 por segundo.',
      'Cada função pode crescer até 1.000 ambientes novos a cada 10 segundos.',
      'O limite da conta pode ser aumentado por pedido de cota.',
    ],
    exam: {
      domains: ['d2', 'd3'],
      relevance: 'alta',
      notes: 'Sinais: "erros de throttling" ou "uma função consome a concorrência das outras". A resposta envolve concorrência reservada para isolar funções ou um pedido de aumento de cota; reduzir a duração também libera concorrência.',
    },
    references: [R.lambdaConcurrency],
    tags: ['desempenho'],
  },
  {
    id: 'lambda.reserved',
    title: 'Concorrência reservada',
    officialName: 'Reserved concurrency',
    serviceIds: ['aws.lambda'],
    summary: 'Separa uma parte da concorrência da conta só para a função: é ao mesmo tempo **garantia** (nenhuma outra função usa) e **teto** (ela não passa disso). É **gratuita**. Serve para proteger funções críticas e para limitar o que chega a um banco ou serviço frágil.',
    facts: ['No máximo 900 podem ser reservados por padrão: 100 ficam sempre para as funções sem reserva.', 'Com reservada zero, a função para de ser invocada; eventos assíncronos vão para a DLQ ou o destino de falha.'],
    exam: {
      domains: ['d2'],
      relevance: 'alta',
      notes: 'Sinais: "garantir capacidade para uma função crítica" ou "limitar quantas conexões a função abre no banco". A resposta é a concorrência reservada.',
    },
    references: [R.lambdaConcurrency, R.lambdaDestinations],
    tags: ['disponibilidade'],
  },
  {
    id: 'lambda.provisioned',
    title: 'Concorrência provisionada e cold start',
    officialName: 'Provisioned concurrency',
    serviceIds: ['aws.lambda'],
    summary: 'O **cold start** é o tempo de inicializar um ambiente novo. A **concorrência provisionada** mantém ambientes **pré-inicializados**, prontos para responder. Ela é **cobrada** e não pode passar da reservada. Em Java, o **SnapStart** é uma alternativa sem custo extra.',
    facts: ['A provisionada leva um ou dois minutos para ficar pronta.', 'SnapStart e provisionada não podem ser usados na mesma versão da função.'],
    exam: {
      domains: ['d3', 'd4'],
      relevance: 'media',
      notes: 'Sinal: "latência baixa e constante desde a primeira requisição" ou "eliminar o cold start". A resposta é a concorrência provisionada ou, em Java, o SnapStart. A concorrência reservada não resolve o cold start.',
    },
    references: [R.lambdaConcurrency],
    tags: ['desempenho', 'custos'],
  },
  {
    id: 'lambda.invocation',
    title: 'Síncrona, assíncrona e event source mapping',
    officialName: 'Lambda invocation methods',
    serviceIds: ['aws.lambda'],
    summary: '**Síncrona**: quem chama espera a resposta (API Gateway, ALB, a CLI). **Assíncrona**: o evento entra numa fila do Lambda e quem chamou não espera (S3, SNS). **Event source mapping**: o Lambda **busca** registros em lotes de filas e streams (SQS, Kinesis, DynamoDB Streams, Kafka).',
    explanation: [
      'O tipo de invocação muda quem cuida das falhas. Na síncrona, quem chamou recebe o erro e decide o que fazer. Na assíncrona, o Lambda guarda o evento e tenta de novo sozinho. No event source mapping, o Lambda lê a fila ou o stream e, se o lote falha, tenta de novo conforme as regras da origem.',
    ],
    facts: ['Event source mappings processam cada evento pelo menos uma vez: a função deve aguentar duplicatas (idempotência).', 'Com SQS como origem, a DLQ fica configurada na própria fila, não na função.'],
    exam: {
      domains: ['d2'],
      relevance: 'alta',
      notes: 'Questões de tratamento de erro dependem do tipo de invocação: na assíncrona, configure destinos de falha ou DLQ na função; com SQS, a DLQ fica na fila; com streams, configure as novas tentativas e o destino de falha no event source mapping.',
    },
    references: [R.lambdaEsm, R.lambdaDestinations],
    tags: ['integracao'],
  },
  {
    id: 'lambda.async-errors',
    title: 'Erros no assíncrono, destinos e DLQ',
    officialName: 'Asynchronous invocation error handling',
    serviceIds: ['aws.lambda'],
    summary: 'Se a função falha numa invocação assíncrona, o Lambda tenta **mais 2 vezes** (1 minuto e depois 2 minutos de espera). Em throttling, devolve o evento à fila por **até 6 horas**. O que falhar de vez vai para um **destino de falha** (SQS, SNS, S3, Lambda, EventBridge) ou uma **DLQ** (SQS ou SNS).',
    facts: ['Destinos guardam também o motivo da falha e podem registrar os sucessos; a DLQ recebe só o conteúdo do evento.', 'Filas FIFO não servem como destino nem como DLQ.'],
    exam: { domains: ['d2'], relevance: 'alta' },
    references: [R.lambdaAsync, R.lambdaDestinations],
    tags: ['disponibilidade'],
  },
  {
    id: 'lambda.vpc',
    title: 'Lambda numa VPC',
    officialName: 'Lambda VPC access',
    serviceIds: ['aws.lambda', 'aws.vpc'],
    summary: 'Por padrão, a função acessa a internet. **Ligada a uma VPC**, ela alcança recursos privados (como um banco RDS), mas **perde a internet**: para sair, a VPC precisa de um **NAT gateway**. Colocar a função numa subnet pública não dá IP público a ela.',
    explanation: [
      'Exemplo: uma função precisa ler um RDS em sub-rede privada e também chamar uma API de pagamentos na internet. Ligada à VPC, ela alcança o banco; para chegar à API, as sub-redes da função precisam de rota para um NAT gateway.',
    ],
    facts: ['A role da função precisa de permissão para criar as interfaces de rede (há a política gerenciada AWSLambdaVPCAccessExecutionRole).', 'Funções na mesma combinação de subnets e security groups compartilham interfaces de rede.'],
    exam: {
      domains: ['d1', 'd2'],
      relevance: 'media',
      notes: 'Se uma função numa VPC não consegue chamar uma API externa, falta o NAT gateway (ou um VPC endpoint, se o destino é um serviço da AWS). Uma função fora da VPC acessa a internet, mas não alcança recursos privados.',
    },
    references: [R.lambdaVpc],
    tags: ['seguranca'],
  },
  {
    id: 'lambda.pricing',
    title: 'Quanto custa uma função',
    officialName: 'AWS Lambda pricing',
    serviceIds: ['aws.lambda'],
    summary: 'Você paga por **requisição** e por **GB-segundo** (memória × tempo de execução), mais a concorrência provisionada, se houver. Funções em **Arm** (Graviton) custam menos por GB-segundo. O **Compute Savings Plan** também dá desconto no Lambda.',
    recommendations: ['Para uma carga constante e pesada, compare com instâncias ou contêineres: o Lambda brilha em cargas que variam muito ou ficam paradas boa parte do tempo.'],
    exam: {
      domains: ['d4'],
      relevance: 'media',
      notes: 'Questões de custo com Lambda comparam o perfil da carga: a intermitente favorece o Lambda; a constante e pesada pode sair mais barata em instâncias ou no Fargate com Savings Plan. Migrar a função para Arm reduz o preço por GB-segundo.',
    },
    references: [R.lambdaWhat, R.spPlanTypes],
    tags: ['custos'],
  },
]
