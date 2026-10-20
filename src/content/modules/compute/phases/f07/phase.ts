/**
 * Fase 7 — Lambda. Limites, memória e CPU, concorrência reservada e
 * provisionada, formas de invocação, erros do assíncrono e custo.
 */
import type { PhaseDef } from '../../../../../engine/types'
import type { LambdaLabConfig } from '../../../../../simulators/lambda/lab'
import type { FunctionSpec } from '../../../../../simulators/lambda/model'
import { META } from '../meta'

const fn = (id: string, name: string, rps: number, durationMs: number, extra: Partial<FunctionSpec> = {}): FunctionSpec => ({ id, name, rps, durationMs, memoryMB: 512, invocation: 'sync', monthlyRequests: 50_000_000, ...extra })

const CAFE: FunctionSpec[] = [
  fn('checkout', 'Checkout do aplicativo', 250, 400),
  fn('imagens', 'Miniaturas das fotos de produtos', 450, 2000, { invocation: 'async', memoryMB: 1024, monthlyRequests: 20_000_000 }),
  fn('pontos', 'Pontos de fidelidade', 100, 1000, { invocation: 'async', monthlyRequests: 30_000_000 }),
]

const LAB: LambdaLabConfig = {
  functions: CAFE,
  goals: [
    { kind: 'no-throttle', fn: 'checkout', concepts: ['lambda.reserved', 'lambda.concurrency'] },
    { kind: 'no-cold-start', fn: 'checkout', concepts: ['lambda.provisioned'] },
    { kind: 'cap', fn: 'pontos', max: 50, why: 'o banco de fidelidade aceita no máximo 50 conexões, e cada execução abre uma.', concepts: ['lambda.reserved'] },
    { kind: 'budget', max: 600, concepts: ['lambda.provisioned', 'lambda.pricing'] },
  ],
  initial: {},
  solution: { checkout: { reserved: 100, provisioned: 100 }, pontos: { reserved: 50 } },
}

const YES_NO = [
  { id: 'yes', text: 'Sim', outcome: 'yes' },
  { id: 'no', text: 'Não', outcome: 'no' },
]

export const F07_CMP: PhaseDef = {
  ...META.f07,
  concepts: ['lambda.function', 'lambda.limits', 'lambda.memory-cpu', 'lambda.concurrency', 'lambda.reserved', 'lambda.provisioned', 'lambda.invocation', 'lambda.async-errors', 'lambda.vpc', 'lambda.pricing', 'srm.lambda'],
  availability: 'available',
  simplifications: [
    'O laboratório trata o pico de cada função como constante e divide a concorrência livre entre as funções sem reserva em proporção ao que cada uma precisa.',
    'Custos com os preços da AWS Price List em us-east-1 (x86), sem nível gratuito.',
    'A trilha ensina as funções clássicas do Lambda. Variantes novas (Web Functions, MicroVMs, durable functions, Lambda Managed Instances) são só citadas.',
  ],
  missions: [
    // -----------------------------------------------------------------------
    {
      id: 'cmp.f07.m1',
      title: 'Cabe no Lambda?',
      type: 'mission',
      summary: 'Limites de uma função, memória que vira CPU e a conta da concorrência.',
      briefing: {
        company: 'Cafeteria Grão Nobre',
        role: 'Você cuida da tecnologia de uma rede de cafeterias com aplicativo de pedidos.',
        situation: 'O time quer levar tudo para o Lambda: o checkout, a geração de miniaturas, os pontos de fidelidade e o fechamento contábil, que leva 40 minutos. A diretora quer saber o que cabe.',
        objective: 'Saber o que o Lambda aceita e quanto de concorrência cada função vai usar.',
        successCriteria: ['Classificar o que cabe numa função', 'Usar memória para ganhar CPU', 'Calcular a concorrência'],
      },
      intel: [
        { conceptId: 'lambda.function', body: ['Uma **função Lambda** roda quando um evento chega, sem servidor para gerenciar. Cada requisição em andamento usa um **ambiente de execução**. Você paga pelas requisições e pelo tempo de execução.'] },
        { conceptId: 'lambda.limits', body: ['No máximo **15 minutos** por invocação. Memória de 128 MB a 10.240 MB. Payload de 6 MB (síncrono) e 1 MB (assíncrono). Pacote .zip de 50 MB, ou imagem de contêiner de até 10 GB.'] },
        { conceptId: 'lambda.memory-cpu', body: ['A CPU vem **em proporção à memória**: com 1.769 MB, a função tem o equivalente a 1 vCPU. Função lenta por CPU pede mais memória.'] },
        { conceptId: 'lambda.concurrency', body: ['**Concorrência = requisições por segundo × duração**. A conta tem **1.000 por Região** por padrão, para todas as funções. E o limite de requisições por segundo é **10 vezes** a concorrência.'] },
      ],
      activities: [
        {
          id: 'cmp.f07.m1.a1',
          kind: 'classify',
          title: 'Cabe numa função?',
          prompt: 'Classifique cada tarefa da cafeteria.',
          concepts: [{ id: 'lambda.limits' }],
          xp: 50,
          difficulty: 1,
          explanation: ['O Lambda aceita tarefas de até 15 minutos, com até 10.240 MB de memória e payloads de até 6 MB na chamada síncrona. O resto pede outra computação (contêineres, instâncias ou AWS Batch).'],
          bins: [
            { id: 'fits', label: 'Cabe no Lambda' },
            { id: 'no', label: 'Não cabe no Lambda' },
          ],
          items: [
            { id: 'checkout', text: 'Validar e registrar um pedido em 300 ms', bin: 'fits', explanation: 'Tarefa curta disparada por uma requisição.', concepts: ['lambda.limits', 'lambda.function'] },
            { id: 'thumb', text: 'Gerar a miniatura de uma foto enviada ao S3', bin: 'fits', explanation: 'Evento do S3 dispara a função; leva segundos.', concepts: ['lambda.limits', 'lambda.invocation'] },
            { id: 'fechamento', text: 'Fechamento contábil que leva 40 minutos', bin: 'no', explanation: 'Passa do limite de 15 minutos por invocação.', concepts: ['lambda.limits'] },
            { id: 'video', text: 'Receber um vídeo de 2 GB no corpo de uma chamada síncrona', bin: 'no', explanation: 'O payload síncrono vai até 6 MB; o vídeo deve ir para o S3, e a função recebe só a referência.', concepts: ['lambda.limits'] },
            { id: 'ml', text: 'Rodar um modelo que precisa de 8 GB de memória por 2 minutos', bin: 'fits', explanation: 'A memória vai até 10.240 MB e o tempo, até 15 minutos.', concepts: ['lambda.limits'] },
          ],
        },
        {
          id: 'cmp.f07.m1.a2',
          kind: 'decision',
          title: 'Uma função lenta',
          prompt: 'A função que redimensiona fotos tem 512 MB e passa a maior parte do tempo calculando, com 100% de CPU. O que deixa ela mais rápida?',
          concepts: [{ id: 'lambda.memory-cpu' }],
          xp: 30,
          difficulty: 2,
          explanation: ['No Lambda, a CPU cresce em proporção à memória. Com mais memória, a função ganha CPU e termina antes; como o preço é por GB-segundo, o custo pode até cair.'],
          options: [
            { id: 'a', text: 'Aumentar a memória da função', correct: true, consequence: 'Mais memória traz mais CPU, e a função termina mais rápido.' },
            { id: 'b', text: 'Aumentar o timeout para 15 minutos', correct: false, consequence: 'Deixa a função rodar por mais tempo, mas não mais rápido.' },
            { id: 'c', text: 'Escolher uma CPU maior na configuração', correct: false, consequence: 'O Lambda não tem configuração de CPU: ela acompanha a memória.' },
          ],
        },
        {
          id: 'cmp.f07.m1.a3',
          kind: 'predict',
          title: 'A conta da concorrência',
          prompt: 'No pico, o checkout recebe **5.000 requisições por segundo**, e cada uma leva **200 ms**. Quantas execuções simultâneas ele precisa?',
          concepts: [{ id: 'lambda.concurrency' }],
          xp: 40,
          difficulty: 2,
          explanation: ['Concorrência = 5.000 × 0,2 = 1.000. É o exemplo da própria documentação, e já consome o limite padrão da conta inteira.'],
          spec: { sim: 'lambda', functions: [fn('c', 'Checkout', 5000, 200)], settings: {}, fn: 'c', query: 'concurrency' },
          options: [
            { id: '200', text: '200', outcome: '200' },
            { id: '1000', text: '1.000', outcome: '1000' },
            { id: '5000', text: '5.000', outcome: '5000' },
          ],
        },
        {
          id: 'cmp.f07.m1.a4',
          kind: 'predict',
          title: 'Rápida demais',
          prompt: 'Uma função de 50 ms recebe **20.000 requisições por segundo**. A conta tem o limite padrão de 1.000 e nenhuma outra função está rodando. Ela sofre throttling?',
          concepts: [{ id: 'lambda.concurrency' }],
          xp: 40,
          difficulty: 3,
          explanation: ['A concorrência é 20.000 × 0,05 = 1.000, dentro do limite. Mas o limite de requisições por segundo é 10 vezes a concorrência: 10.000. Metade das requisições sofre throttling. A saída é pedir aumento do limite da conta.'],
          spec: { sim: 'lambda', functions: [fn('r', 'Função rápida', 20000, 50)], settings: {}, fn: 'r', query: 'throttled' },
          options: YES_NO,
        },
      ],
      debrief: { takeaways: ['15 minutos, 10.240 MB e 6 MB de payload síncrono são os limites que mais caem na prova.', 'Mais memória é mais CPU.', 'Concorrência = requisições por segundo × duração; e o limite de RPS é 10 vezes a concorrência.'] },
    },
    // -----------------------------------------------------------------------
    {
      id: 'cmp.f07.m2',
      title: 'Reservar e provisionar',
      type: 'mission',
      summary: 'Proteja a função crítica, limite a que sobrecarrega o banco e acabe com o cold start.',
      briefing: {
        company: 'Cafeteria Grão Nobre',
        role: 'Você continua na tecnologia da cafeteria.',
        situation: 'Na sexta à tarde, as miniaturas de um lote de fotos novas tomaram a concorrência da conta e o checkout passou a dar erro. A função de pontos derruba o banco de fidelidade quando abre conexões demais. E o checkout demora no primeiro pedido de cada leva.',
        objective: 'Configurar a concorrência das três funções.',
        successCriteria: ['Checkout sem throttling e sem cold start', 'Pontos com no máximo 50 execuções simultâneas', 'Provisionada dentro do orçamento'],
      },
      intel: [
        { conceptId: 'lambda.reserved', visual: 'lambda-concurrency', body: ['A **reservada** é ao mesmo tempo **garantia e teto** para a função, e é gratuita. Até 900 podem ser reservados: 100 ficam sempre para as outras funções.'] },
        { conceptId: 'lambda.provisioned', body: ['A **provisionada** mantém ambientes já inicializados, sem **cold start**. Ela é cobrada o tempo todo e não passa da reservada.'] },
        { conceptId: 'lambda.pricing', body: ['Lambda cobra por **requisição** e por **GB-segundo** de execução. A provisionada soma um preço por GB-segundo enquanto está configurada.'] },
      ],
      activities: [
        {
          id: 'cmp.f07.m2.a1',
          kind: 'lab',
          lab: 'lambda-concurrency',
          title: 'As três funções da cafeteria',
          prompt: 'Configure a concorrência reservada e a provisionada de cada função. Os objetivos são avaliados ao vivo.',
          concepts: [{ id: 'lambda.reserved' }, { id: 'lambda.provisioned' }, { id: 'lambda.concurrency', weight: 0.5 }],
          xp: 120,
          difficulty: 3,
          hints: ['O checkout precisa de 250 × 0,4 = 100 execuções simultâneas.', 'Para limitar os pontos, a reservada é o teto.'],
          explanation: ['Checkout: reservada de 100 (garantia contra as miniaturas) e provisionada de 100 (sem cold start). Pontos: reservada de 50, o teto que protege o banco. As miniaturas são assíncronas: o que sofrer throttling volta para a fila.'],
          config: LAB,
        },
        {
          id: 'cmp.f07.m2.a2',
          kind: 'predict',
          title: 'Sem provisionada suficiente',
          prompt: 'O checkout precisa de **100** execuções simultâneas no pico e tem **60** de concorrência provisionada (sem reservada). No pico, há cold start?',
          concepts: [{ id: 'lambda.provisioned' }],
          xp: 30,
          difficulty: 2,
          explanation: ['Acima de 60, o Lambda usa a concorrência comum, com ambientes novos que precisam inicializar: há cold start nas execuções que passam da provisionada.'],
          spec: { sim: 'lambda', functions: [fn('c', 'Checkout', 250, 400)], settings: { c: { provisioned: 60 } }, fn: 'c', query: 'cold-start' },
          options: YES_NO,
        },
        {
          id: 'cmp.f07.m2.a3',
          kind: 'decision',
          title: 'Garantia ou teto?',
          prompt: 'A função de pontos recebeu uma concorrência reservada de 50. Num pico, ela precisaria de 100 e há 500 livres na conta. O que acontece?',
          concepts: [{ id: 'lambda.reserved' }],
          xp: 30,
          difficulty: 2,
          explanation: ['A reservada é ao mesmo tempo garantia e teto: a função nunca passa de 50, mesmo com concorrência livre na conta. É isso que protege o banco.'],
          options: [
            { id: 'a', text: 'A função fica em 50 e o resto sofre throttling: a reservada também é teto', correct: true, consequence: 'O banco recebe no máximo 50 conexões; os eventos assíncronos que sobrarem voltam para a fila.' },
            { id: 'b', text: 'A função usa as 50 reservadas e pega mais 50 da parte livre', correct: false, consequence: 'Com reservada, a função não usa a concorrência sem reserva.' },
            { id: 'c', text: 'A AWS cobra as 50 execuções extras', correct: false, consequence: 'A reservada não tem custo e não deixa a função passar do valor.' },
          ],
        },
        {
          id: 'cmp.f07.m2.a4',
          kind: 'decision',
          title: 'Lambda o dia inteiro?',
          prompt: 'Um serviço de cálculo de rotas recebe uma carga **alta e constante, 24 horas por dia**, e cada requisição leva 2 segundos com 2 GB. Alguém quer levá-lo para o Lambda "porque é mais barato". O que você responde?',
          concepts: [{ id: 'lambda.pricing' }],
          xp: 30,
          difficulty: 3,
          explanation: ['O Lambda cobra por requisição e por GB-segundo, o que favorece cargas que variam ou ficam paradas. Com carga alta e constante, vale comparar com instâncias ou contêineres (e compromissos de uso) antes de decidir.'],
          options: [
            { id: 'a', text: 'Comparar o custo em GB-segundo com instâncias ou contêineres: com carga constante, o Lambda pode sair mais caro', correct: true, consequence: 'A decisão passa a ser feita com números, não por suposição.' },
            { id: 'b', text: 'Sempre vale: o Lambda é a computação mais barata da AWS', correct: false, consequence: 'O Lambda compensa em cargas variáveis ou ociosas; não é sempre o mais barato.' },
            { id: 'c', text: 'Não dá: o Lambda não aceita 2 GB de memória', correct: false, consequence: 'A memória vai até 10.240 MB.' },
          ],
        },
      ],
      debrief: { takeaways: ['Reservada protege e limita, de graça.', 'Provisionada tira o cold start, e é cobrada.', 'O que é assíncrono aguenta throttling melhor: volta para a fila.'] },
    },
    // -----------------------------------------------------------------------
    {
      id: 'cmp.f07.m3',
      title: 'Quando dá errado',
      type: 'mission',
      summary: 'Formas de invocação, novas tentativas, destinos, DLQ e Lambda numa VPC.',
      briefing: {
        company: 'Cafeteria Grão Nobre',
        role: 'Você continua na tecnologia da cafeteria.',
        situation: 'Algumas miniaturas nunca são geradas e ninguém sabe por quê. A função de pontos foi colocada na VPC para falar com o banco e, desde então, não consegue chamar a API do parceiro de cartões.',
        objective: 'Não perder eventos que falham e dar à função na VPC o acesso de que ela precisa.',
        successCriteria: ['Separar as formas de invocação', 'Ordenar as novas tentativas do assíncrono', 'Guardar o que falha de vez', 'Dar saída à internet para a função na VPC'],
      },
      intel: [
        { conceptId: 'lambda.invocation', body: ['**Síncrona**: quem chama espera (API Gateway, ALB). **Assíncrona**: o evento vai para uma fila do Lambda (S3, SNS). **Event source mapping**: o Lambda busca lotes em filas e streams (SQS, Kinesis, DynamoDB Streams).'] },
        { conceptId: 'lambda.async-errors', body: ['No assíncrono, erro da função ganha **mais 2 tentativas**; throttling volta para a fila por até **6 horas**. O que falhar de vez vai para um **destino de falha** ou uma **DLQ**.'] },
        { conceptId: 'lambda.vpc', body: ['Ligada a uma **VPC**, a função alcança recursos privados, mas **perde a internet**: para sair, a VPC precisa de um **NAT gateway**.'] },
        { conceptId: 'srm.lambda', body: ['No Lambda, a AWS opera a infraestrutura e o runtime gerenciado; você cuida do código, das permissões e dos dados.'] },
      ],
      activities: [
        {
          id: 'cmp.f07.m3.a1',
          kind: 'classify',
          title: 'Como cada origem chama',
          prompt: 'Classifique cada origem pela forma como ela invoca a função.',
          concepts: [{ id: 'lambda.invocation' }],
          xp: 50,
          difficulty: 2,
          explanation: ['API Gateway e ALB esperam a resposta (síncrona). S3 e SNS entregam eventos sem esperar (assíncrona). SQS, Kinesis e DynamoDB Streams são lidos em lotes pelo próprio Lambda (event source mapping).'],
          bins: [
            { id: 'sync', label: 'Síncrona' },
            { id: 'async', label: 'Assíncrona' },
            { id: 'esm', label: 'Event source mapping' },
          ],
          items: [
            { id: 'apigw', text: 'Amazon API Gateway', bin: 'sync', explanation: 'A API espera a resposta da função para devolver ao cliente.', concepts: ['lambda.invocation'] },
            { id: 'alb', text: 'Application Load Balancer', bin: 'sync', explanation: 'O ALB chama a função e repassa a resposta.', concepts: ['lambda.invocation'] },
            { id: 's3', text: 'Evento de objeto criado no S3', bin: 'async', explanation: 'O S3 entrega o evento e não espera.', concepts: ['lambda.invocation'] },
            { id: 'sns', text: 'Mensagem publicada num tópico SNS', bin: 'async', explanation: 'O SNS entrega e segue.', concepts: ['lambda.invocation'] },
            { id: 'sqs', text: 'Fila do Amazon SQS', bin: 'esm', explanation: 'O Lambda busca as mensagens em lotes.', concepts: ['lambda.invocation'] },
            { id: 'kinesis', text: 'Stream do Amazon Kinesis', bin: 'esm', explanation: 'O Lambda lê os registros em lotes, na ordem do shard.', concepts: ['lambda.invocation'] },
          ],
        },
        {
          id: 'cmp.f07.m3.a2',
          kind: 'order',
          title: 'Uma miniatura que falha',
          prompt: 'Uma foto corrompida faz a função de miniaturas dar erro a cada tentativa. Ordene o que acontece com o evento, com a configuração padrão e um destino de falha.',
          concepts: [{ id: 'lambda.async-errors' }],
          xp: 50,
          difficulty: 2,
          explanation: ['No assíncrono, o Lambda tenta mais duas vezes: um minuto depois da primeira falha e dois minutos depois da segunda. Esgotadas as tentativas, o registro vai para o destino de falha.'],
          steps: [
            { id: 's1', text: 'O S3 entrega o evento e o Lambda o coloca na fila de eventos da função', explanation: 'Invocação assíncrona.' },
            { id: 's2', text: 'A primeira execução falha', explanation: 'A foto corrompida quebra o código.' },
            { id: 's3', text: 'Um minuto depois, o Lambda tenta de novo, e falha', explanation: 'Primeira nova tentativa.' },
            { id: 's4', text: 'Dois minutos depois, a última tentativa, e falha', explanation: 'Segunda nova tentativa: são duas por padrão.' },
            { id: 's5', text: 'O registro da falha vai para o destino configurado', explanation: 'O evento não se perde: alguém pode investigar.' },
          ],
        },
        {
          id: 'cmp.f07.m3.a3',
          kind: 'decision',
          title: 'Onde guardar o que falhou',
          prompt: 'A equipe quer saber **por que** cada miniatura falhou, com o erro devolvido pela função, e quer também registrar as que deram certo num barramento de eventos. O que configurar?',
          concepts: [{ id: 'lambda.async-errors' }],
          xp: 40,
          difficulty: 2,
          explanation: ['Destinos aceitam sucesso e falha e trazem detalhes da resposta (inclusive o erro). A DLQ guarda só o conteúdo do evento que falhou.'],
          options: [
            { id: 'a', text: 'Um destino de falha numa fila SQS e um destino de sucesso no EventBridge', correct: true, consequence: 'As falhas chegam com o erro, e os sucessos viram eventos.' },
            { id: 'b', text: 'Uma dead-letter queue no SQS', correct: false, consequence: 'Guarda só o evento que falhou, sem o erro, e não registra sucessos.' },
            { id: 'c', text: 'Aumentar as novas tentativas para 10', correct: false, consequence: 'O máximo é 2; e tentar de novo uma foto corrompida não resolve.' },
          ],
        },
        {
          id: 'cmp.f07.m3.a4',
          kind: 'decision',
          title: 'Sem internet na VPC',
          prompt: 'A função de pontos foi ligada a subnets privadas da VPC para falar com o banco RDS. Agora ela não consegue chamar a API do parceiro de cartões na internet. O que resolve?',
          concepts: [{ id: 'lambda.vpc' }],
          xp: 40,
          difficulty: 3,
          explanation: ['Ligada a uma VPC, a função perde o acesso direto à internet. A saída é uma rota pelas subnets privadas até um NAT gateway. Pôr a função numa subnet pública não dá IP público a ela.'],
          options: [
            { id: 'a', text: 'Dar às subnets privadas da função uma rota para um NAT gateway', correct: true, consequence: 'A função continua falando com o banco e volta a alcançar a API do parceiro.' },
            { id: 'b', text: 'Mover a função para uma subnet pública', correct: false, consequence: 'A função não ganha IP público numa subnet pública e continua sem internet.' },
            { id: 'c', text: 'Aumentar o timeout da função', correct: false, consequence: 'A chamada continua sem caminho para a internet.' },
          ],
        },
      ],
      debrief: { takeaways: ['Síncrona, assíncrona ou event source mapping: cada origem tem a sua.', 'No assíncrono: 2 novas tentativas e, depois, destino de falha ou DLQ.', 'Lambda na VPC precisa de NAT para sair para a internet.'] },
    },
    // -----------------------------------------------------------------------
    {
      id: 'cmp.f07.boss',
      title: 'O pico do checkout',
      type: 'boss',
      summary: 'Na promoção, o checkout falhou com a conta ainda longe do limite de custo. Investigue.',
      briefing: {
        company: 'Rede Doce Lar Confeitarias',
        role: 'Você foi chamado por uma rede de confeitarias depois de uma promoção que deu errado.',
        situation: 'Durante a promoção do Dia das Mães, o checkout no aplicativo devolveu erros por 40 minutos. Ao mesmo tempo, rodava a exportação mensal de pedidos para o ERP, também em Lambda.',
        objective: 'Descobrir a causa e evitar que se repita.',
        successCriteria: ['Apontar as evidências', 'Identificar a causa', 'Escolher as correções'],
      },
      intel: [
        { conceptId: 'lambda.concurrency', body: ['Todas as funções sem reserva dividem o limite da conta (1.000 por padrão). Uma função pode tomar a concorrência das outras.'] },
        { conceptId: 'lambda.reserved', body: ['A **reservada** garante concorrência para uma função e limita outra.'] },
      ],
      activities: [
        {
          id: 'cmp.f07.boss.a1',
          kind: 'investigate',
          title: 'As métricas da promoção',
          prompt: 'Examine as métricas e a configuração.',
          concepts: [{ id: 'lambda.reserved' }, { id: 'lambda.concurrency', weight: 0.5 }],
          xp: 90,
          difficulty: 3,
          explanation: ['A exportação, sem reserva, cresceu até ocupar quase toda a concorrência da conta. O checkout, também sem reserva, ficou sem espaço e devolveu erros de throttling (429).'],
          artifacts: [
            {
              id: 'cfg',
              title: 'Configuração',
              format: 'table',
              lines: [
                { id: 'c1', text: 'limite de concorrência da conta: 1.000', isIssue: false, explanation: 'O padrão da Região.' },
                { id: 'c2', text: 'checkout: síncrono, sem concorrência reservada', isIssue: true, explanation: 'Sem reserva, o checkout disputa a concorrência com as outras funções.' },
                { id: 'c3', text: 'exportacao-erp: assíncrona, sem concorrência reservada, 3 s por pedido', isIssue: true, explanation: 'Sem teto, a exportação pode ocupar a conta inteira.' },
              ],
            },
            {
              id: 'cw',
              title: 'CloudWatch, 14h10',
              format: 'log',
              lines: [
                { id: 'l1', text: 'ConcurrentExecutions (conta) = 1.000', isIssue: true, explanation: 'A conta bateu no limite.' },
                { id: 'l2', text: 'exportacao-erp · ConcurrentExecutions = 960', isIssue: true, explanation: 'Uma única função ocupa quase tudo.' },
                { id: 'l3', text: 'checkout · Throttles = 18.400 · erros 429 no aplicativo', isIssue: true, explanation: 'O checkout ficou sem concorrência.' },
                { id: 'l4', text: 'checkout · Duration média = 300 ms (igual à de sempre)', isIssue: false, explanation: 'A função não ficou mais lenta: faltou concorrência.' },
              ],
            },
          ],
          rootCause: {
            prompt: 'Qual é a causa?',
            options: [
              { id: 'r1', text: 'A exportação, sem teto, ocupou a concorrência da conta e o checkout, sem reserva, sofreu throttling', correct: true, feedback: 'Isso: as duas dividiam o mesmo limite de 1.000.' },
              { id: 'r2', text: 'O checkout ficou lento e passou do timeout', correct: false, feedback: 'A duração média continuou em 300 ms.' },
              { id: 'r3', text: 'Faltou memória no checkout', correct: false, feedback: 'O erro é 429 (throttling), não falta de memória.' },
            ],
          },
          remediations: {
            prompt: 'Quais correções funcionam? (selecione todas as adequadas)',
            options: [
              { id: 'f1', text: 'Reservar concorrência para o checkout', correct: true, feedback: 'O checkout passa a ter a sua parte garantida, que nenhuma outra função usa.' },
              { id: 'f2', text: 'Reservar uma concorrência menor para a exportação, servindo de teto', correct: true, feedback: 'A exportação fica limitada e, por ser assíncrona, o que sofrer throttling volta para a fila.' },
              { id: 'f3', text: 'Pedir o aumento do limite de concorrência da conta', correct: true, feedback: 'Também ajuda: o limite pode ir a dezenas de milhares por pedido de cota.' },
              { id: 'f4', text: 'Aumentar a memória do checkout', correct: false, feedback: 'Não muda a concorrência disponível para ele.' },
            ],
          },
        },
        {
          id: 'cmp.f07.boss.a2',
          kind: 'decision',
          title: 'A exportação de 40 minutos',
          prompt: 'A exportação vai mudar: em vez de um pedido por evento, ela vai gerar um arquivo único que leva **40 minutos**. Ela continua no Lambda?',
          concepts: [{ id: 'lambda.limits' }],
          xp: 40,
          difficulty: 2,
          explanation: ['Uma invocação do Lambda dura no máximo 15 minutos. Uma tarefa de 40 minutos vai para contêineres (ECS no Fargate) ou para o AWS Batch, ou é quebrada em partes menores.'],
          options: [
            { id: 'a', text: 'Não: passa do limite de 15 minutos; vai para uma task no Fargate ou para o AWS Batch', correct: true, consequence: 'A tarefa roda até o fim, sem timeout.' },
            { id: 'b', text: 'Sim, com o timeout em 60 minutos', correct: false, consequence: 'O timeout máximo de uma função comum é de 900 segundos.' },
            { id: 'c', text: 'Sim, com concorrência provisionada', correct: false, consequence: 'A provisionada tira o cold start, não muda o tempo máximo.' },
          ],
        },
      ],
      debrief: { takeaways: ['Funções sem reserva disputam o mesmo limite da conta.', 'Reservada no que é crítico; reservada como teto no que pode esperar.', 'Mais de 15 minutos não é Lambda.'] },
    },
  ],
}
