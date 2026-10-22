/**
 * Fase 5 — Fluxos com Step Functions. Máquina de estados, Standard ou
 * Express, tipos de estado, Retry e Catch, e os padrões de integração.
 */
import type { PhaseDef } from '../../../../../engine/types'
import type { WorkflowLabConfig } from '../../../../../simulators/workflow/lab'
import { META } from '../meta'

export const AMPARO_FLUXO: WorkflowLabConfig = {
  retryOptions: [0, 2, 3, 6],
  steps: [
    { id: 'apolice', label: 'Consultar a apólice', transientFailures: 1, need: 'Sem a apólice, não há o que compensar: se falhar de vez, a execução deve falhar e aparecer no alarme.', compensate: false, concepts: ['sfn.retry-catch'] },
    { id: 'reserva', label: 'Reservar o valor da indenização', transientFailures: 3, need: 'Se não der certo, desfazer a abertura do sinistro.', compensate: true, concepts: ['sfn.retry-catch'] },
    { id: 'cpf', label: 'Validar o CPF do segurado', transientFailures: 0, permanent: true, need: 'CPF inválido encerra o sinistro com aviso ao segurado.', compensate: true, concepts: ['sfn.retry-catch'] },
    { id: 'pagamento', label: 'Pagar o segurado pelo banco', transientFailures: 5, need: 'Se o banco não responder, estornar a reserva.', compensate: true, concepts: ['sfn.retry-catch'] },
    { id: 'relatorio', label: 'Atualizar o relatório diário', transientFailures: 2, need: 'Se falhar de vez, deixar a execução falhar para o alarme avisar.', compensate: false, concepts: ['sfn.retry-catch'] },
  ],
}

export const F05_INT: PhaseDef = {
  ...META.f05,
  concepts: ['sfn.what', 'sfn.states', 'sfn.standard-express', 'sfn.retry-catch', 'sfn.integration-patterns'],
  availability: 'available',
  simplifications: ['A seguradora, os passos e as falhas são fictícios.', 'No laboratório, o Retry usa a espera padrão.'],
  missions: [
    // -----------------------------------------------------------------------
    {
      id: 'int.f05.m1',
      title: 'O processo do sinistro',
      type: 'mission',
      summary: 'Máquina de estados e tipos de estado.',
      briefing: {
        company: 'Seguradora Amparo',
        role: 'Você redesenha o processo de sinistros de uma seguradora.',
        situation: 'Hoje uma função Lambda de 2.000 linhas chama tudo em sequência, com novas tentativas escritas à mão. Ninguém sabe em que passo cada sinistro parou.',
        objective: 'Descrever o processo como uma máquina de estados.',
        successCriteria: ['Usar o Step Functions', 'Escolher o estado de cada passo'],
      },
      intel: [
        { conceptId: 'sfn.what', body: ['O **Step Functions** executa uma **máquina de estados** e registra cada passo de cada execução. As novas tentativas e as esperas saem do código.'] },
        { conceptId: 'sfn.states', body: ['**Task** trabalha, **Choice** decide, **Parallel** roda ramos juntos, **Map** repete para cada item, **Wait** espera, **Succeed** e **Fail** terminam.'] },
      ],
      activities: [
        {
          id: 'int.f05.m1.a1',
          kind: 'decision',
          title: 'Onde fica a coordenação',
          prompt: 'O processo tem 8 passos, novas tentativas e decisões por valor. O time quer ver onde cada sinistro parou. O que usar?',
          concepts: [{ id: 'sfn.what' }],
          xp: 40,
          difficulty: 1,
          explanation: ['O Step Functions mostra cada execução passo a passo e cuida das novas tentativas e das decisões.'],
          options: [
            { id: 'a', text: 'Uma máquina de estados do Step Functions chamando os serviços de cada passo', correct: true, consequence: 'Cada sinistro tem o histórico de passos, e a lógica de coordenação sai do código.' },
            { id: 'b', text: 'Manter a função Lambda e escrever mais logs', correct: false, consequence: 'A coordenação continua no código, e a função tem limite de 15 minutos.' },
            { id: 'c', text: 'Uma fila SQS para cada passo', correct: false, consequence: 'Desacopla, mas espalha a lógica do processo e não mostra onde cada sinistro está.' },
          ],
        },
        {
          id: 'int.f05.m1.a2',
          kind: 'match',
          title: 'O estado de cada passo',
          prompt: 'Associe cada passo do processo ao tipo de estado.',
          concepts: [{ id: 'sfn.states' }],
          xp: 50,
          difficulty: 2,
          explanation: ['Cada tipo de estado tem um papel: trabalhar, decidir, paralelizar, repetir ou esperar.'],
          leftLabel: 'Passo',
          rightLabel: 'Estado',
          pairs: [
            { id: 'choice', left: 'Sinistros acima de R$ 50 mil vão para um perito', right: 'Choice', explanation: 'Escolhe o caminho pelos dados.', concepts: ['sfn.states'] },
            { id: 'parallel', left: 'Consultar o Detran e a polícia ao mesmo tempo', right: 'Parallel', explanation: 'Ramos que rodam juntos.', concepts: ['sfn.states'] },
            { id: 'map', left: 'Analisar cada uma das fotos enviadas', right: 'Map', explanation: 'Os mesmos passos para cada item.', concepts: ['sfn.states'] },
            { id: 'wait', left: 'Aguardar 48 horas antes de lembrar o segurado', right: 'Wait', explanation: 'Espera por um tempo.', concepts: ['sfn.states'] },
            { id: 'task', left: 'Chamar a função que calcula a indenização', right: 'Task', explanation: 'Faz o trabalho.', concepts: ['sfn.states'] },
          ],
        },
      ],
      debrief: { takeaways: ['A coordenação sai do código para a máquina de estados.', 'Task, Choice, Parallel, Map, Wait.'] },
    },
    // -----------------------------------------------------------------------
    {
      id: 'int.f05.m2',
      title: 'Standard ou Express',
      type: 'mission',
      summary: 'Os dois tipos de fluxo.',
      briefing: {
        company: 'Seguradora Amparo',
        role: 'Você escolhe o tipo de cada fluxo.',
        situation: 'Além do sinistro, que pode levar semanas, há a validação de cada leitura dos rastreadores dos carros segurados: 50 mil por segundo, cada uma em menos de um segundo.',
        objective: 'Escolher Standard ou Express para cada fluxo.',
        successCriteria: ['Separar processos longos de eventos curtos em massa'],
      },
      intel: [{ conceptId: 'sfn.standard-express', body: ['**Standard**: até **um ano**, cada passo **exatamente uma vez**, cobra por transição. **Express**: até **5 minutos**, cobra por execução e duração, para volumes altíssimos.'] }],
      activities: [
        {
          id: 'int.f05.m2.a1',
          kind: 'classify',
          title: 'O tipo de cada fluxo',
          prompt: 'Classifique cada fluxo.',
          concepts: [{ id: 'sfn.standard-express' }],
          xp: 50,
          difficulty: 2,
          explanation: ['Longo, com espera humana ou ação que não pode repetir: Standard. Curto e em massa: Express.'],
          bins: [
            { id: 'standard', label: 'Standard' },
            { id: 'express', label: 'Express' },
          ],
          items: [
            { id: 'sinistro', text: 'Sinistro que espera o laudo do perito por até 3 semanas', bin: 'standard', explanation: 'Passa de 5 minutos.', concepts: ['sfn.standard-express'] },
            { id: 'rastreador', text: 'Validar 50 mil leituras por segundo, cada uma em 200 ms', bin: 'express', explanation: 'Curto e em volume altíssimo.', concepts: ['sfn.standard-express'] },
            { id: 'pagamento', text: 'Pagar a indenização, que não pode ser feita duas vezes', bin: 'standard', explanation: 'Cada passo exatamente uma vez.', concepts: ['sfn.standard-express'] },
            { id: 'api', text: 'Responder uma cotação pela API em 2 segundos', bin: 'express', explanation: 'Curto, síncrono e frequente.', concepts: ['sfn.standard-express'] },
          ],
        },
      ],
      debrief: { takeaways: ['Standard: longo e exatamente uma vez.', 'Express: curto e em massa.'] },
    },
    // -----------------------------------------------------------------------
    {
      id: 'int.f05.m3',
      title: 'Quando dá errado',
      type: 'mission',
      summary: 'Retry e Catch.',
      briefing: {
        company: 'Seguradora Amparo',
        role: 'Você trata as falhas do fluxo do sinistro.',
        situation: 'O banco às vezes responde com erro e dá certo na tentativa seguinte. Um CPF inválido nunca vai passar. Sem tratamento, qualquer erro derruba a execução.',
        objective: 'Prever o que acontece com cada configuração.',
        successCriteria: ['Distinguir erro passageiro de permanente'],
      },
      intel: [{ conceptId: 'sfn.retry-catch', body: ['Sem tratamento, o erro faz a **execução falhar**. **Retry** tenta de novo (padrão: 3 vezes, esperando 1 s e dobrando). **Catch** desvia para outro estado quando as tentativas acabam.'] }],
      activities: [
        {
          id: 'int.f05.m3.a1',
          kind: 'predict',
          title: 'Sem tratamento',
          prompt: 'O passo de pagamento não tem Retry nem Catch. O banco responde com erro uma vez. O que acontece?',
          concepts: [{ id: 'sfn.retry-catch' }],
          xp: 40,
          difficulty: 1,
          explanation: ['Sem Retry nem Catch, o erro faz a execução inteira falhar.'],
          spec: { sim: 'workflow', task: { transientFailures: 1 }, handling: { maxAttempts: 0, catchAll: false } },
          options: [
            { id: 'a', text: 'A execução falha', outcome: 'failed' },
            { id: 'b', text: 'A tarefa dá certo', outcome: 'succeeded' },
            { id: 'c', text: 'O Catch desvia para a compensação', outcome: 'caught' },
          ],
        },
        {
          id: 'int.f05.m3.a2',
          kind: 'predict',
          title: 'Retry padrão',
          prompt: 'O passo de pagamento ganhou Retry com MaxAttempts 3. O banco falha duas vezes e responde na terceira tentativa. O que acontece?',
          concepts: [{ id: 'sfn.retry-catch' }],
          xp: 40,
          difficulty: 1,
          explanation: ['Duas falhas e duas novas tentativas: a terceira tentativa dá certo.'],
          spec: { sim: 'workflow', task: { transientFailures: 2 }, handling: { maxAttempts: 3, catchAll: false } },
          options: [
            { id: 'a', text: 'A tarefa dá certo', outcome: 'succeeded' },
            { id: 'b', text: 'A execução falha', outcome: 'failed' },
            { id: 'c', text: 'O Catch desvia para a compensação', outcome: 'caught' },
          ],
        },
        {
          id: 'int.f05.m3.a3',
          kind: 'predict',
          title: 'O CPF inválido',
          prompt: 'A validação do CPF tem Retry com MaxAttempts 3 e Catch com States.ALL para a compensação. O CPF é inválido. O que acontece?',
          concepts: [{ id: 'sfn.retry-catch' }],
          xp: 50,
          difficulty: 2,
          explanation: ['As novas tentativas falham do mesmo jeito; quando acabam, o Catch desvia para a compensação. O Retry só atrasou o desfecho.'],
          spec: { sim: 'workflow', task: { transientFailures: 0, permanent: true }, handling: { maxAttempts: 3, catchAll: true } },
          options: [
            { id: 'a', text: 'O Catch desvia para a compensação', outcome: 'caught' },
            { id: 'b', text: 'A tarefa dá certo na terceira tentativa', outcome: 'succeeded' },
            { id: 'c', text: 'A execução falha', outcome: 'failed' },
          ],
        },
      ],
      debrief: { takeaways: ['Retry para o passageiro, Catch para o que não tem jeito.', 'Retentar erro permanente só atrasa.'] },
    },
    // -----------------------------------------------------------------------
    {
      id: 'int.f05.m4',
      title: 'Esperar o perito',
      type: 'mission',
      summary: 'Padrões de integração com serviços.',
      briefing: {
        company: 'Seguradora Amparo',
        role: 'Você liga o fluxo a sistemas externos e a pessoas.',
        situation: 'O perito recebe o caso num aplicativo e pode levar dias para responder. Um job de análise de fotos no AWS Batch leva 40 minutos.',
        objective: 'Escolher como o fluxo espera cada um.',
        successCriteria: ['Usar callback para a pessoa', 'Usar execução até o fim para o job'],
      },
      intel: [{ conceptId: 'sfn.integration-patterns', body: ['**Resposta imediata**: chama e segue. **.sync**: espera o job terminar. **.waitForTaskToken**: pausa até alguém devolver o token, como numa aprovação humana; o **heartbeat** detecta quem sumiu.'] }],
      activities: [
        {
          id: 'int.f05.m4.a1',
          kind: 'match',
          title: 'Como esperar',
          prompt: 'Associe cada passo ao padrão de integração.',
          concepts: [{ id: 'sfn.integration-patterns' }],
          xp: 50,
          difficulty: 2,
          explanation: ['O padrão depende de quem responde e quando.'],
          leftLabel: 'Passo',
          rightLabel: 'Padrão',
          pairs: [
            { id: 'perito', left: 'Esperar o perito aprovar no aplicativo, por dias', right: 'Espera por callback (.waitForTaskToken)', explanation: 'O app devolve o token quando o perito decide.', concepts: ['sfn.integration-patterns'] },
            { id: 'batch', left: 'Esperar o job de 40 minutos do AWS Batch terminar', right: 'Execução até o fim (.sync)', explanation: 'O Step Functions acompanha o job até o fim.', concepts: ['sfn.integration-patterns'] },
            { id: 'sns', left: 'Avisar o segurado por SNS e seguir em frente', right: 'Resposta imediata', explanation: 'Chama e segue.', concepts: ['sfn.integration-patterns'] },
          ],
        },
        {
          id: 'int.f05.m4.a2',
          kind: 'decision',
          title: 'O perito que sumiu',
          prompt: 'O app do perito trava às vezes e nunca devolve o token. Como o fluxo descobre isso sem esperar o prazo máximo?',
          concepts: [{ id: 'sfn.integration-patterns' }, { id: 'sfn.retry-catch', weight: 0.5 }],
          xp: 50,
          difficulty: 3,
          explanation: ['Com heartbeat, o app avisa periodicamente que o caso segue aberto. Sem o aviso no prazo, a tarefa falha por tempo, e o Catch pode reatribuir o caso.'],
          options: [
            { id: 'a', text: 'Definir um heartbeat na tarefa e tratar o erro de tempo com Catch, reatribuindo o caso', correct: true, consequence: 'O caso travado é detectado e vai para outro perito.' },
            { id: 'b', text: 'Trocar para o fluxo Express', correct: false, consequence: 'O Express não tem espera por callback e dura até 5 minutos.' },
            { id: 'c', text: 'Pôr um Wait de 30 dias antes da tarefa', correct: false, consequence: 'Só atrasa o fluxo.' },
          ],
        },
      ],
      debrief: { takeaways: ['Pessoas: callback com token.', 'Jobs longos: .sync.', 'Heartbeat detecta quem sumiu.'] },
    },
    // -----------------------------------------------------------------------
    {
      id: 'int.f05.boss',
      title: 'O fluxo do sinistro',
      type: 'boss',
      summary: 'Retry e Catch de cada passo.',
      briefing: {
        company: 'Seguradora Amparo',
        role: 'Você fecha o tratamento de falhas do fluxo do sinistro.',
        situation: 'Cinco passos, cada um com um jeito de falhar e um desejo do negócio para quando nada der certo.',
        objective: 'Escolher o Retry e o Catch mínimos de cada passo.',
        successCriteria: ['Cobrir as falhas passageiras sem tentativas inúteis', 'Compensar onde o negócio pede'],
      },
      intel: [{ conceptId: 'sfn.retry-catch', body: ['Novas tentativas: o suficiente para as falhas passageiras, nenhuma para as permanentes. Catch: onde há algo a desfazer.'] }],
      activities: [
        {
          id: 'int.f05.boss.a1',
          kind: 'lab',
          lab: 'workflow',
          title: 'O tratamento de falhas',
          prompt: 'Para cada passo, escolha o Retry e o Catch.',
          concepts: [{ id: 'sfn.retry-catch' }],
          xp: 200,
          difficulty: 3,
          hints: ['Um passo que falha N vezes por erro passageiro precisa de pelo menos N novas tentativas.', 'Erro permanente não precisa de Retry.'],
          explanation: ['Apólice: 2 tentativas, sem Catch. Reserva: 3, com Catch. CPF: sem Retry, com Catch. Pagamento: 6, com Catch. Relatório: 2, sem Catch.'],
          config: AMPARO_FLUXO,
        },
      ],
      debrief: { takeaways: ['Retry na medida e Catch onde há o que desfazer.'] },
    },
  ],
}
