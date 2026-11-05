/**
 * Questões da Revisão da Fase 4 de Integração (eventos com EventBridge), no
 * formato do exame SAA-C03. Fatos conferidos em docs.aws.amazon.com (ver
 * docs/VERIFICACAO-DE-CONTEUDO.md). As empresas são fictícias.
 */
import type { ReviewSet } from '../../../../engine/types'

export const REVIEW_F04: ReviewSet = {
  phaseId: 'int.f04',
  questions: [
    {
      id: 'rv:int.f04.m1.a1:ec2',
      kind: 'decision',
      title: 'Eventos que chegam sem ninguém publicar',
      prompt:
        'Uma transportadora quer reagir a vários eventos com o EventBridge e precisa saber quais **chegam sozinhos ao barramento padrão** da conta, **sem a empresa publicar nada**. Quais opções chegam assim? (Escolha DUAS.)',
      concepts: [{ id: 'eb.bus' }],
      xp: 5,
      difficulty: 1,
      domain: 'd2',
      multiple: true,
      options: [
        { id: 'a', text: 'Uma instância EC2 que mudou para o estado stopped.', correct: true, consequence: 'É um evento de serviço da AWS, publicado no barramento padrão.' },
        { id: 'b', text: 'Um achado novo do GuardDuty.', correct: true, consequence: 'Os serviços da AWS publicam seus eventos no barramento padrão.' },
        { id: 'c', text: '"Entrega concluída", do sistema de entregas da empresa.', correct: false, consequence: 'É um evento da aplicação: a empresa precisa publicá-lo, em geral num barramento personalizado.' },
        { id: 'd', text: 'Um chamado aberto no sistema de atendimento SaaS.', correct: false, consequence: 'Eventos de parceiros SaaS chegam por um barramento de parceiro, depois de configurado.' },
        { id: 'e', text: 'Uma linha nova gravada no banco relacional da empresa.', correct: false, consequence: 'O banco não publica cada linha no EventBridge; a aplicação teria de publicar.' },
      ],
      explanation: [
        'O **barramento** recebe eventos e os entrega conforme as regras. **Toda conta tem o barramento padrão**, que recebe **os eventos dos serviços da AWS**, como mudanças de estado do EC2 e achados do GuardDuty. A empresa cria **barramentos personalizados** para os eventos das próprias aplicações, e há **barramentos de parceiros SaaS**.',
        'Eventos da aplicação e de parceiros não chegam sozinhos ao padrão, e o banco não publica cada gravação.',
        '**Regra prática:** serviço da AWS, barramento padrão; aplicação da empresa, barramento personalizado; SaaS, barramento de parceiro.',
      ],
    },
    {
      id: 'rv:int.f04.eventos-de-um-saas',
      kind: 'decision',
      title: 'Chamados abertos num sistema de atendimento',
      prompt:
        'Uma empresa usa um sistema de atendimento SaaS que é **parceiro do EventBridge**. Hoje uma função Lambda **consulta a API do sistema a cada minuto** para descobrir chamados novos, o que atrasa e custa chamadas. A empresa quer **reagir a cada chamado novo** com o **menor esforço**. Qual solução atende?',
      concepts: [{ id: 'eb.bus' }],
      xp: 5,
      difficulty: 2,
      domain: 'd2',
      options: [
        { id: 'a', text: 'Consultar a API a cada 10 segundos, para reduzir o atraso.', correct: false, consequence: 'Atrasa menos, mas multiplica as chamadas e o código de consulta.' },
        { id: 'b', text: 'O barramento de parceiro, com uma regra.', correct: true, consequence: 'O sistema publica cada chamado, e a regra entrega aos alvos, sem consultas.' },
        { id: 'c', text: 'Exportar os chamados do SaaS para o S3 toda noite.', correct: false, consequence: 'A reação aos chamados fica para o dia seguinte.' },
        { id: 'd', text: 'Criar uma fila SQS e pedir ao fornecedor que grave nela.', correct: false, consequence: 'Exige integração específica com o fornecedor, quando ele já publica no EventBridge.' },
      ],
      explanation: [
        'O EventBridge tem **barramentos de parceiros SaaS**: o sistema parceiro publica os eventos, e as **regras** da empresa os entregam aos alvos pelo conteúdo. Isso troca a consulta periódica por uma **arquitetura orientada a eventos**.',
        'Consultar mais vezes custa mais. Exportação noturna atrasa. E uma fila exige integração que o parceiro já oferece pelo EventBridge.',
        '**Regra prática:** "reagir a eventos de serviços da AWS ou de aplicações SaaS" é EventBridge.',
      ],
    },
    {
      id: 'rv:int.f04.m2.a1',
      kind: 'decision',
      title: 'Atrasos acima de dez mil reais',
      prompt:
        'Uma regra deve disparar para atrasos de cargas com **valor a partir de 10.000**. O evento traz "valor": 12000, **sem aspas**. A primeira versão do padrão, {"detail": {"valor": ["12000"]}}, **nunca disparou**. Qual trecho, dentro de "detail", atende?',
      concepts: [{ id: 'eb.rules-patterns' }],
      xp: 5,
      difficulty: 3,
      domain: 'd2',
      options: [
        { id: 'a', text: '{"valor": ["10000", "12000"]}', correct: false, consequence: 'Compara com textos: não casa com números e só listaria valores exatos, não uma faixa.' },
        { id: 'b', text: '{"valor": [{"numeric": [">=", 10000]}]}', correct: true, consequence: 'O operador numérico compara o número e casa com qualquer valor a partir de 10.000.' },
        { id: 'c', text: '{"valor": [{"prefix": "1"}]}', correct: false, consequence: 'O prefixo trata texto e casaria com 1.500 ou 19, mas não com 20.000.' },
        { id: 'd', text: '{"valor": [{"exists": true}]}', correct: false, consequence: 'Casa com qualquer evento que tenha o campo, inclusive valores baixos.' },
      ],
      explanation: [
        'O padrão tem a mesma estrutura do evento, e os valores precisam casar **com o tipo certo**: "12000" entre aspas é texto e não casa com o número 12000. Para faixas, o EventBridge tem o operador **numeric**, que compara números: [">=", 10000] pega todos os atrasos a partir de 10.000.',
        'Texto entre aspas não casa com número. Prefixo trata texto. E exists só confere se o campo existe.',
        '**Regra prática:** número no evento, operador numeric no padrão; texto entre aspas só casa com texto.',
      ],
    },
    {
      id: 'rv:int.f04.m2.a4',
      kind: 'decision',
      title: 'Atrasos fora de São Paulo',
      prompt:
        'Uma filial quer receber os eventos com o padrão **{"detail-type": ["Entrega atrasada"], "detail": {"estado": [{"anything-but": "SP"}]}}**. Os eventos sempre trazem o estado e o valor da carga. Quais opções **disparam** a regra? (Escolha DUAS.)',
      concepts: [{ id: 'eb.rules-patterns' }],
      xp: 5,
      difficulty: 2,
      domain: 'd2',
      multiple: true,
      options: [
        { id: 'a', text: 'Entrega atrasada em MG, com carga de 500.', correct: true, consequence: 'O tipo casa, o estado não é SP, e o valor não é citado no padrão.' },
        { id: 'b', text: 'Entrega atrasada no RJ, com carga de 20.000.', correct: true, consequence: 'O tipo casa e o estado não é SP; campos não citados são ignorados.' },
        { id: 'c', text: 'Entrega atrasada em SP, com carga de 20.000.', correct: false, consequence: 'anything-but exclui SP: o estado não casa.' },
        { id: 'd', text: 'Entrega concluída em MG, com carga de 500.', correct: false, consequence: 'O tipo do evento não é "Entrega atrasada".' },
        { id: 'e', text: 'Entrega concluída em SP, com carga de 500.', correct: false, consequence: 'Nem o tipo do evento nem o estado casam com o padrão.' },
      ],
      explanation: [
        'Cada **campo citado precisa casar** (E); uma lista de valores é OU; **campos que o padrão não cita são ignorados**. O operador **anything-but** casa com qualquer valor, menos o citado. Disparam os atrasos fora de SP, qualquer que seja o valor da carga.',
        'O atraso em SP falha no estado, porque o anything-but exclui exatamente esse valor. As entregas concluídas falham no tipo, porque o detail-type citado é "Entrega atrasada", e um campo citado precisa casar.',
        '**Regra prática:** confira cada campo citado no padrão; o que ele não cita não importa.',
      ],
    },
    {
      id: 'rv:int.f04.m3.a3',
      kind: 'decision',
      title: 'O sexto sistema interessado',
      prompt:
        'A regra de atrasos de um barramento já entrega o evento a **cinco alvos**. Um **sexto sistema** quer receber os mesmos eventos, com o mesmo padrão. A empresa quer a mudança com o menor esforço, sem tirar ninguém. O que fazer?',
      concepts: [{ id: 'eb.targets' }],
      xp: 5,
      difficulty: 1,
      domain: 'd2',
      options: [
        { id: 'a', text: 'Adicionar o sexto alvo na mesma regra.', correct: false, consequence: 'Cada regra entrega a até cinco alvos; o sexto não cabe.' },
        { id: 'b', text: 'Pedir aumento do limite de alvos da regra.', correct: false, consequence: 'O limite de cinco alvos por regra não é a saída aqui; uma regra a mais resolve.' },
        { id: 'c', text: 'Tirar um dos alvos atuais para abrir espaço.', correct: false, consequence: 'Um dos sistemas deixaria de receber os eventos.' },
        { id: 'd', text: 'Uma segunda regra, com o mesmo padrão.', correct: true, consequence: 'Cada regra fica dentro do limite, e os seis sistemas recebem o evento.' },
      ],
      explanation: [
        'Cada **regra** entrega o evento a **até cinco alvos**, como Lambda, filas SQS, tópicos SNS, Step Functions, Kinesis ou outro barramento. Para um sexto destino, cria-se **outra regra com o mesmo padrão**; outra opção é ter como alvo um tópico do SNS que distribua a mais assinantes.',
        'A mesma regra não aceita o sexto alvo, e tirar alguém viola o pedido.',
        '**Regra prática:** muitos consumidores do mesmo evento: várias regras com o mesmo padrão, ou um tópico do SNS como alvo.',
      ],
    },
    {
      id: 'rv:int.f04.dlq-do-alvo',
      kind: 'decision',
      title: 'Uma função fora do ar por horas',
      prompt:
        'Uma regra entrega eventos de pagamento a uma função Lambda que **ficou fora do ar por horas** depois de uma implantação errada. Os eventos do período **se perderam** depois das novas tentativas do EventBridge. A empresa quer **guardar os eventos que não forem entregues** para reprocessar depois. Qual configuração atende?',
      concepts: [{ id: 'eb.targets' }],
      xp: 5,
      difficulty: 2,
      domain: 'd2',
      options: [
        { id: 'a', text: 'Uma DLQ no alvo da regra, numa fila SQS padrão.', correct: true, consequence: 'Os eventos que esgotam as tentativas ficam guardados na fila para reprocessar.' },
        { id: 'b', text: 'Uma segunda regra igual, apontando para a mesma função.', correct: false, consequence: 'As duas entregas falham do mesmo jeito enquanto a função está fora.' },
        { id: 'c', text: 'Uma DLQ numa fila SQS FIFO.', correct: false, consequence: 'A DLQ do alvo do EventBridge é uma fila SQS padrão.' },
        { id: 'd', text: 'Aumentar a memória da função Lambda.', correct: false, consequence: 'Não resolve a função fora do ar nem guarda os eventos.' },
      ],
      explanation: [
        'Se a entrega a um **alvo** falha depois das **novas tentativas**, o evento pode ir para uma **DLQ**, uma **fila SQS padrão** configurada no alvo da regra. Assim, os eventos do período ficam guardados e podem ser reprocessados quando a função voltar.',
        'Outra regra falha igual. A DLQ não é FIFO. E memória não traz a função de volta.',
        '**Regra prática:** alvo que pode ficar fora do ar pede DLQ no alvo da regra; o arquivamento com replay é outra camada, para o barramento inteiro.',
      ],
    },
    {
      id: 'rv:int.f04.m3.a1',
      kind: 'decision',
      title: 'Os eventos de dez contas numa só',
      prompt:
        'Uma empresa tem **dez contas de aplicação** e quer **centralizar os eventos de entregas numa conta de operação**, onde as regras dessa conta decidem o que fazer com eles. A empresa quer usar a integração por eventos, sem copiar dados nem dar acesso amplo entre as contas. Qual solução atende?',
      concepts: [{ id: 'eb.cross-account' }],
      xp: 5,
      difficulty: 2,
      domain: 'd1',
      options: [
        { id: 'a', text: 'Copiar os eventos para um bucket e dar acesso à conta de operação.', correct: false, consequence: 'Funciona com atraso e código extra; não é integração por eventos.' },
        { id: 'b', text: 'Dar à conta de operação acesso de leitura aos barramentos das dez contas.', correct: false, consequence: 'Barramento não é lido por consulta: ele entrega por regras.' },
        { id: 'c', text: 'Regras com alvo no barramento central, liberado por política de recurso.', correct: true, consequence: 'Os eventos chegam ao barramento central, e as regras de lá decidem o destino.' },
        { id: 'd', text: 'Uma role na conta de operação com permissão de administrador nas dez contas.', correct: false, consequence: 'Dá acesso amplo demais e ainda não move os eventos.' },
      ],
      explanation: [
        'Uma **regra pode ter como alvo o barramento de outra conta**. A conta que recebe **libera o envio com uma política de recurso** no barramento dela, e lá **as próprias regras** decidem o destino. É a forma de centralizar eventos de várias contas sem copiar dados nem conceder acesso amplo.',
        'Bucket é cópia com atraso, barramentos não são consultados, e uma role de administrador concede demais.',
        '**Regra prática:** "centralizar os eventos de várias contas numa conta de operação" é regra com alvo no barramento central, liberado por política de recurso.',
      ],
    },
    {
      id: 'rv:int.f04.m3.a2',
      kind: 'decision',
      title: 'Reprocessar ontem sem arquivo',
      prompt:
        'Um bug no consumidor do faturamento descartou os eventos de ontem, das 14h às 18h. O bug foi corrigido, mas o barramento **não tinha arquivamento ligado**. A empresa quer **recuperar os eventos de ontem** e **facilitar casos assim no futuro**. Qual plano atende?',
      concepts: [{ id: 'eb.archive-replay' }],
      xp: 5,
      difficulty: 3,
      domain: 'd2',
      options: [
        { id: 'a', text: 'Fazer um replay do barramento das 14h às 18h de ontem.', correct: false, consequence: 'Sem arquivo, não há eventos guardados para o replay.' },
        { id: 'b', text: 'Ligar o arquivo agora e fazer o replay de ontem a partir dele.', correct: false, consequence: 'O arquivo guarda os eventos a partir de quando é criado; ontem já passou.' },
        { id: 'c', text: 'Republicar pelas origens e ligar o arquivo.', correct: true, consequence: 'Os eventos de ontem voltam pelas origens, e as próximas falhas terão replay.' },
        { id: 'd', text: 'Buscar os eventos de ontem no CloudTrail e reenviá-los.', correct: false, consequence: 'O CloudTrail registra chamadas de API, não o conteúdo dos eventos de aplicação.' },
      ],
      explanation: [
        'O **arquivo** guarda os eventos de um barramento, todos ou os que casam com um padrão, e o **replay** os reenvia ao mesmo barramento num intervalo de tempo, por exemplo depois de corrigir um consumidor. Mas o arquivo só guarda **a partir de quando existe**. Sem ele, a recuperação de ontem depende das origens; para o futuro, **liga-se o arquivamento**.',
        'Replay sem arquivo não existe, um arquivo novo não tem o passado, e o CloudTrail não guarda o conteúdo dos eventos.',
        '**Regra prática:** "reprocessar os eventos de um período depois de corrigir um consumidor" é arquivo com replay, ligado antes do problema.',
      ],
    },
    {
      id: 'rv:int.f04.m4.a1:revisao',
      kind: 'decision',
      title: 'Trezentas mil revisões agendadas',
      prompt:
        'Uma transportadora quer avisar **cada um dos 300 mil motoristas** na data da revisão do veículo dele, uma vez, com novas tentativas se o envio falhar. Hoje a equipe cria **uma regra agendada por motorista** num barramento e já bateu no limite de regras. Qual solução atende com o mínimo de código?',
      concepts: [{ id: 'eb.scheduler' }],
      xp: 5,
      difficulty: 1,
      domain: 'd2',
      options: [
        { id: 'a', text: 'Pedir aumento do limite de regras do barramento.', correct: false, consequence: 'Mantém o recurso legado e esbarra de novo no crescimento.' },
        { id: 'b', text: 'Uma regra diária que lê todas as datas e envia os avisos do dia.', correct: false, consequence: 'Funciona, mas exige código para ler, filtrar e tentar de novo.' },
        { id: 'c', text: 'EventBridge Scheduler, um agendamento por pessoa.', correct: true, consequence: 'Os agendamentos chegam a milhões, com novas tentativas, sem código de agendamento.' },
        { id: 'd', text: 'Uma instância EC2 com cron para cada lote de motoristas.', correct: false, consequence: 'Servidores e scripts para manter, sem a escala de um serviço gerenciado.' },
      ],
      explanation: [
        'O **EventBridge Scheduler** cria agendamentos **únicos ou recorrentes**, em **escala de milhões**, que chamam mais de 270 serviços da AWS, com janela flexível e **novas tentativas**. A AWS **recomenda o Scheduler no lugar das regras agendadas**, que ficaram como recurso legado.',
        'Mais limite mantém o recurso legado. Uma regra diária exige código. E cron em EC2 traz servidores.',
        '**Regra prática:** "tarefas agendadas, como um cron, sem servidor", principalmente uma por cliente, é EventBridge Scheduler.',
      ],
    },
    {
      id: 'rv:int.f04.m4.a1:fila-sfn',
      kind: 'decision',
      title: 'Da fila ao fluxo sem código',
      prompt:
        'Uma empresa precisa **ler uma fila SQS**, **descartar as mensagens de teste** e **iniciar um fluxo do Step Functions** para cada mensagem válida, **sem escrever código de integração**. Não há outros consumidores. Qual recurso atende?',
      concepts: [{ id: 'eb.pipes' }],
      xp: 5,
      difficulty: 2,
      domain: 'd2',
      options: [
        { id: 'a', text: 'Uma função Lambda que lê a fila, filtra e inicia o fluxo.', correct: false, consequence: 'Funciona, mas é o código de integração que se quer evitar.' },
        { id: 'b', text: 'EventBridge Pipes, com filtro.', correct: true, consequence: 'Liga origem e alvo ponto a ponto, com o filtro no meio, sem código.' },
        { id: 'c', text: 'Uma regra no barramento padrão lendo a fila.', correct: false, consequence: 'Regras reagem a eventos publicados no barramento; não leem filas.' },
        { id: 'd', text: 'O EventBridge Scheduler consultando a fila a cada minuto.', correct: false, consequence: 'O Scheduler agenda tarefas; não consome filas nem filtra mensagens.' },
      ],
      explanation: [
        'O **EventBridge Pipes** liga **uma origem a um alvo, ponto a ponto**, com **filtro e enriquecimento opcionais** no meio. Ler uma fila SQS ou um stream e entregar ao Step Functions, descartando o que não interessa, é exatamente o caso dele, sem código de integração.',
        'A Lambda é o código a evitar. Regras não leem filas. E o Scheduler agenda tarefas.',
        '**Regra prática:** origem e alvo ponto a ponto, com filtro, é Pipes; um evento para vários alvos por conteúdo é regra no barramento; agendamento é Scheduler.',
      ],
    },
  ],
}
