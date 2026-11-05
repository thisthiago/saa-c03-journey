/**
 * Questões da Revisão da Fase 5 de Integração (fluxos com Step Functions), no
 * formato do exame SAA-C03. Fatos conferidos em docs.aws.amazon.com (ver
 * docs/VERIFICACAO-DE-CONTEUDO.md). As empresas são fictícias.
 */
import type { ReviewSet } from '../../../../engine/types'

export const REVIEW_F05: ReviewSet = {
  phaseId: 'int.f05',
  questions: [
    {
      id: 'rv:int.f05.m1.a1',
      kind: 'decision',
      title: 'Oito passos dentro de uma função',
      prompt:
        'O processamento de sinistros tem **8 passos**, com **novas tentativas** quando um serviço falha e **decisões pelo valor** do sinistro. Hoje tudo roda numa função Lambda grande, e ninguém consegue dizer **onde cada sinistro parou**. A empresa quer tirar a coordenação do código, com o menor esforço. O que usar?',
      concepts: [{ id: 'sfn.what' }],
      xp: 5,
      difficulty: 1,
      domain: 'd2',
      options: [
        { id: 'a', text: 'Manter a função Lambda e escrever mais logs.', correct: false, consequence: 'A coordenação continua no código, e a função tem limite de 15 minutos.' },
        { id: 'b', text: 'Uma fila SQS entre cada par de passos.', correct: false, consequence: 'Desacopla, mas espalha a lógica do processo e não mostra onde cada sinistro está.' },
        { id: 'c', text: 'Uma máquina de estados do Step Functions.', correct: true, consequence: 'Cada sinistro tem o histórico de passos, e tentativas e decisões saem do código.' },
        { id: 'd', text: 'Um tópico do SNS publicado a cada passo concluído.', correct: false, consequence: 'Avisa os interessados, mas não coordena os passos nem trata erros.' },
      ],
      explanation: [
        'O **Step Functions** executa uma **máquina de estados**: um fluxo de passos que chama serviços da AWS, **decide caminhos**, espera, **repete e trata erros**. **Cada execução fica registrada passo a passo**, e a coordenação sai do código das funções.',
        'Mais logs mantêm a lógica no código. Filas e tópicos desacoplam, mas não coordenam o processo.',
        '**Regra prática:** "coordenar vários passos", "tratar erros e novas tentativas fora do código" e "ver onde cada execução está" apontam para o Step Functions.',
      ],
    },
    {
      id: 'rv:int.f05.m1.a2:choice',
      kind: 'decision',
      title: 'Cada necessidade com o seu estado',
      prompt:
        'Um arquiteto está desenhando o fluxo de sinistros no Step Functions e associou cada necessidade a um tipo de estado. Quais associações estão **corretas**? (Escolha DUAS.)',
      concepts: [{ id: 'sfn.states' }],
      xp: 5,
      difficulty: 1,
      domain: 'd2',
      multiple: true,
      options: [
        { id: 'a', text: 'Sinistros acima de R$ 50 mil vão para um perito: Choice.', correct: true, consequence: 'O Choice escolhe o caminho pelos dados do sinistro.' },
        { id: 'b', text: 'Consultar o Detran e a polícia ao mesmo tempo: Parallel.', correct: true, consequence: 'O Parallel roda os dois ramos de consulta ao mesmo tempo.' },
        { id: 'c', text: 'Analisar cada uma das fotos enviadas: Wait.', correct: false, consequence: 'Repetir os passos para cada item de uma lista é o Map.' },
        { id: 'd', text: 'Aguardar 48 horas antes de lembrar o segurado: Map.', correct: false, consequence: 'Esperar por um tempo definido é o papel do Wait.' },
        { id: 'e', text: 'Chamar a função que calcula a indenização: Choice.', correct: false, consequence: 'Fazer um trabalho, chamando um serviço, é o Task.' },
      ],
      explanation: [
        '**Task** faz um trabalho (chama um serviço); **Choice** escolhe o caminho; **Parallel** roda ramos ao mesmo tempo; **Map** repete os passos para cada item de uma lista; **Wait** espera; **Pass** repassa dados; **Succeed** e **Fail** terminam a execução.',
        'As associações erradas trocam Map e Wait, e usam Choice para um trabalho.',
        '**Regra prática:** decidir, Choice; ao mesmo tempo, Parallel; para cada item, Map; esperar, Wait; trabalhar, Task.',
      ],
    },
    {
      id: 'rv:int.f05.m2.a1:rastreador',
      kind: 'decision',
      title: 'Quais fluxos devem ser Express',
      prompt:
        'Uma seguradora vai migrar cinco fluxos para o Step Functions e quer usar o tipo **Express** onde ele couber, para pagar menos em volume alto. Quais opções devem ser **Express**? (Escolha DUAS.)',
      concepts: [{ id: 'sfn.standard-express' }],
      xp: 5,
      difficulty: 2,
      domain: 'd3',
      multiple: true,
      options: [
        { id: 'a', text: 'Validar 50 mil leituras de rastreadores por segundo, cada uma em 200 ms.', correct: true, consequence: 'Eventos curtos em volume altíssimo: é o caso do Express.' },
        { id: 'b', text: 'Responder uma cotação pela API em 2 segundos.', correct: true, consequence: 'Fluxo curto, síncrono e frequente, bem abaixo dos 5 minutos.' },
        { id: 'c', text: 'Um sinistro que espera o laudo do perito por até 3 semanas.', correct: false, consequence: 'Passa muito dos 5 minutos do Express; é Standard.' },
        { id: 'd', text: 'Pagar a indenização, que não pode ser feita duas vezes.', correct: false, consequence: 'Exige cada passo exatamente uma vez, garantia do Standard.' },
        { id: 'e', text: 'Esperar um job de 40 minutos do AWS Batch terminar.', correct: false, consequence: 'Passa dos 5 minutos, e a execução até o fim (.sync) só existe no Standard.' },
      ],
      explanation: [
        'O fluxo **Standard** dura **até um ano**, executa **cada passo exatamente uma vez** e cobra por transição de estado: serve a processos longos e a ações que não podem repetir. O **Express** dura **até 5 minutos**, cobra por execução, duração e memória e serve a **volumes muito altos de eventos curtos**.',
        'Esperas longas, pagamentos e jobs acompanhados até o fim pedem o Standard; os padrões .sync e de callback só existem nele.',
        '**Regra prática:** "processo longo, auditável, sem repetir passos" é Standard; "milhares de eventos curtos por segundo" é Express.',
      ],
    },
    {
      id: 'rv:int.f05.standard-caro',
      kind: 'decision',
      title: 'Trinta milhões de execuções curtas',
      prompt:
        'Um fluxo **Standard** do Step Functions processa **30 milhões de eventos por dia**, cada execução com 6 passos e menos de 1 segundo de duração. Os eventos podem ser reprocessados sem prejuízo se algo se repetir. A fatura, cobrada **por transição de estado**, ficou alta. Qual mudança reduz o custo?',
      concepts: [{ id: 'sfn.standard-express' }],
      xp: 5,
      difficulty: 2,
      domain: 'd4',
      options: [
        { id: 'a', text: 'Juntar os 6 passos em menos estados, mantendo o Standard.', correct: false, consequence: 'Reduz um pouco, mas continua pagando cada transição de milhões de execuções.' },
        { id: 'b', text: 'Trocar o fluxo por um Express.', correct: true, consequence: 'O Express cobra por execução, duração e memória, bem mais barato para eventos curtos em volume.' },
        { id: 'c', text: 'Pôr um estado Wait de 1 segundo entre os passos.', correct: false, consequence: 'Só atrasa as execuções e acrescenta transições pagas.' },
        { id: 'd', text: 'Rodar cada execução dentro de um estado Map.', correct: false, consequence: 'O Map repete passos por item; não muda o modelo de cobrança do Standard.' },
      ],
      explanation: [
        'O **Standard** cobra **por transição de estado** e garante cada passo exatamente uma vez: ótimo para processos longos e críticos, caro para milhões de execuções curtas. O **Express** cobra **por execução, duração e memória** e foi feito para **volume alto de eventos curtos**; como os eventos aceitam reprocessamento, a garantia mais fraca do Express assíncrono (pelo menos uma vez) é aceitável.',
        'Menos estados reduzem pouco. Wait e Map não mudam o modelo de cobrança.',
        '**Regra prática:** fluxo curto, em volume enorme e tolerante a repetição: Express; o Standard fica para o que é longo ou não pode repetir.',
      ],
    },
    {
      id: 'rv:int.f05.m3.a3',
      kind: 'decision',
      title: 'Três tentativas à toa',
      prompt:
        'Na validação de cadastro, o passo que consulta o CPF tem **Retry com 3 tentativas** para **States.ALL** e um Catch que desvia para a compensação. Quando o **CPF é inválido**, o fluxo tenta três vezes à toa antes de compensar. Erros passageiros do serviço de consulta devem continuar sendo repetidos. Qual ajuste atende?',
      concepts: [{ id: 'sfn.retry-catch' }],
      xp: 5,
      difficulty: 3,
      domain: 'd2',
      options: [
        { id: 'a', text: 'Aumentar o Retry para 10 tentativas.', correct: false, consequence: 'O CPF continua inválido; só atrasa ainda mais a compensação.' },
        { id: 'b', text: 'Tirar o Retry e deixar só o Catch.', correct: false, consequence: 'Os erros passageiros do serviço deixariam de ser repetidos.' },
        { id: 'c', text: 'Tirar o Catch e deixar só o Retry.', correct: false, consequence: 'Depois das tentativas, a execução inteira falharia sem compensar.' },
        { id: 'd', text: 'Retry só para os erros passageiros.', correct: true, consequence: 'O erro permanente vai na hora para a compensação, e os passageiros ainda são repetidos.' },
      ],
      explanation: [
        'O **Retry** tenta de novo, com espera crescente, os erros que casam com ele; o **Catch** desvia para outro estado quando as tentativas acabam, ou direto, para erros que o Retry não cobre. **States.ALL** casa com qualquer erro. Para não repetir um **erro permanente**, como CPF inválido, o Retry deve listar só os **erros passageiros**, e o Catch trata o permanente na hora.',
        'Mais tentativas só atrasam. Sem Retry, os erros passageiros falham; sem Catch, não há compensação.',
        '**Regra prática:** Retry para o que pode dar certo na próxima tentativa; Catch para o que não vai dar certo nunca.',
      ],
    },
    {
      id: 'rv:int.f05.m3.a2',
      kind: 'decision',
      title: 'Cobranças perdidas na manutenção',
      prompt:
        'O passo de cobrança tem **Retry com os valores padrão**: espera de 1 s, 3 tentativas, dobrando a espera. O gateway de pagamento costuma ficar **fora do ar por uns 20 segundos** em manutenções rápidas, e as cobranças desse período **caem no Catch** sem necessidade. Qual ajuste atende?',
      concepts: [{ id: 'sfn.retry-catch' }],
      xp: 5,
      difficulty: 3,
      domain: 'd2',
      options: [
        { id: 'a', text: 'Um Retry que cubra uns 30 segundos.', correct: true, consequence: 'As novas tentativas atravessam a manutenção, e a cobrança dá certo.' },
        { id: 'b', text: 'Tirar o Catch, para a execução não desviar.', correct: false, consequence: 'Sem Catch, a execução inteira falharia depois das tentativas.' },
        { id: 'c', text: 'Trocar o fluxo para Express.', correct: false, consequence: 'O tipo do fluxo não muda as novas tentativas da tarefa.' },
        { id: 'd', text: 'Pôr um estado Wait de 1 minuto antes de toda cobrança.', correct: false, consequence: 'Atrasa todas as cobranças, inclusive quando o gateway está no ar.' },
      ],
      explanation: [
        'O **Retry padrão** espera **1 s** e faz **3 tentativas**, dobrando a espera: 1, 2 e 4 segundos, cerca de 7 s no total. Uma parada de 20 s esgota as tentativas, e o Catch assume. Ajustando **MaxAttempts**, **IntervalSeconds** ou **BackoffRate** para cobrir uns 30 s, as tentativas atravessam a manutenção.',
        'Tirar o Catch faz a execução falhar. O tipo do fluxo não muda o Retry. E um Wait fixo atrasa tudo.',
        '**Regra prática:** dimensione o Retry pela duração típica das falhas passageiras; o Catch fica para o que sobra.',
      ],
    },
    {
      id: 'rv:int.f05.m4.a1:perito',
      kind: 'decision',
      title: 'Esperar a aprovação de um perito por dias',
      prompt:
        'No fluxo de sinistros, depois da análise automática, o caso precisa **esperar o perito aprovar no aplicativo**, o que pode levar **dias**. O fluxo deve **pausar** até a decisão, sem uma função rodando ou consultando o tempo todo, e o pagamento seguinte não pode ser feito duas vezes. Qual desenho atende?',
      concepts: [{ id: 'sfn.integration-patterns' }, { id: 'sfn.what' }],
      xp: 5,
      difficulty: 2,
      domain: 'd2',
      options: [
        { id: 'a', text: 'Fluxo Express com um estado Wait de 5 minutos em laço.', correct: false, consequence: 'O Express dura até 5 minutos e não tem espera por callback.' },
        { id: 'b', text: 'Uma Lambda que consulta o aplicativo a cada minuto até a aprovação.', correct: false, consequence: 'Mantém código consultando por dias, quando o fluxo pode pausar.' },
        { id: 'c', text: 'Fluxo Standard com espera por callback (.waitForTaskToken).', correct: true, consequence: 'O fluxo pausa até o aplicativo devolver o token com a decisão do perito.' },
        { id: 'd', text: 'Fluxo Standard com execução até o fim (.sync) no aplicativo.', correct: false, consequence: 'O .sync acompanha jobs de serviços da AWS; a decisão de uma pessoa chega por callback.' },
      ],
      explanation: [
        'Há três jeitos de chamar um serviço: **resposta imediata** (chama e segue), **execução até o fim** (.sync, espera o job terminar) e **espera por callback** (.waitForTaskToken), que **pausa até alguém devolver o token**, como numa aprovação humana. Os padrões .sync e de callback **só existem no Standard**, que também garante o pagamento uma vez só.',
        'O Express não espera dias. Consultar em laço é código a evitar. E o .sync é para jobs, não para pessoas.',
        '**Regra prática:** "pausar o fluxo até uma aprovação humana" é callback com .waitForTaskToken, num fluxo Standard.',
      ],
    },
    {
      id: 'rv:int.f05.m4.a2',
      kind: 'decision',
      title: 'O perito que sumiu',
      prompt:
        'Às vezes o aplicativo do perito **trava e nunca devolve o token**, e o sinistro fica parado até o prazo máximo da tarefa, de 30 dias. A empresa quer **descobrir em poucas horas** que o perito sumiu e **reatribuir o caso** a outro perito. Qual configuração atende?',
      concepts: [{ id: 'sfn.integration-patterns' }],
      xp: 5,
      difficulty: 3,
      domain: 'd2',
      options: [
        { id: 'a', text: 'Heartbeat, com Catch reatribuindo.', correct: true, consequence: 'Sem o sinal no prazo, a tarefa falha por tempo, e o Catch manda o caso a outro perito.' },
        { id: 'b', text: 'Trocar para o fluxo Express.', correct: false, consequence: 'O Express não tem espera por callback e dura até 5 minutos.' },
        { id: 'c', text: 'Pôr um Wait de 30 dias antes da tarefa.', correct: false, consequence: 'Só atrasa o fluxo e não detecta o perito ausente.' },
        { id: 'd', text: 'Reduzir o prazo máximo da tarefa para 1 minuto.', correct: false, consequence: 'Cancelaria até os peritos que estão trabalhando no caso.' },
      ],
      explanation: [
        'O **heartbeat** detecta quem **sumiu sem responder**: o aplicativo avisa periodicamente que o caso segue aberto; se o aviso não chega no prazo, a tarefa falha por tempo, e um **Catch** pode **reatribuir o caso**. Peritos trabalhando continuam enviando o sinal e não são interrompidos.',
        'O Express não serve a esperas longas. Um Wait não detecta nada. E um prazo curto demais corta quem está trabalhando.',
        '**Regra prática:** callback com espera longa pede heartbeat, para distinguir "ainda trabalhando" de "sumiu".',
      ],
    },
    {
      id: 'rv:int.f05.m4.a1:batch',
      kind: 'decision',
      title: 'Esperar um job de quarenta minutos',
      prompt:
        'Um fluxo Standard inicia um **job do AWS Batch** que leva cerca de **40 minutos** e só pode seguir quando ele terminar. Hoje uma função Lambda consulta o estado do job **a cada minuto**, num laço com Wait. A empresa quer **tirar esse laço de consulta** do fluxo. Qual padrão atende?',
      concepts: [{ id: 'sfn.integration-patterns' }],
      xp: 5,
      difficulty: 2,
      domain: 'd4',
      options: [
        { id: 'a', text: 'Resposta imediata, iniciando o job e seguindo em frente.', correct: false, consequence: 'O fluxo seguiria antes de o job terminar.' },
        { id: 'b', text: 'Execução até o fim (.sync) ao iniciar o job.', correct: true, consequence: 'O Step Functions acompanha o job até o fim, sem laço de consulta.' },
        { id: 'c', text: 'Espera por callback, com o job devolvendo o token.', correct: false, consequence: 'Funcionaria só se o job fosse alterado para devolver o token; o .sync faz isso sozinho.' },
        { id: 'd', text: 'Um estado Wait fixo de 40 minutos.', correct: false, consequence: 'Erra quando o job demora mais ou menos que o previsto.' },
      ],
      explanation: [
        'Com a **execução até o fim** (**.sync**), o Step Functions **inicia o job e espera ele terminar**, sem laço de consulta nem função extra. Isso economiza invocações e transições e deixa o fluxo mais simples.',
        'Resposta imediata não espera. Callback exigiria mudar o job. E um Wait fixo não acompanha a duração real.',
        '**Regra prática:** esperar um job de serviço da AWS terminar é .sync; esperar uma pessoa ou sistema externo é callback; seguir sem esperar é resposta imediata.',
      ],
    },
  ],
}
