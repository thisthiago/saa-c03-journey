/**
 * Questões da Revisão da Fase 1 de Monitoramento e governança (CloudWatch:
 * métricas e alarmes), no formato do exame SAA-C03. Fatos conferidos na trilha
 * (ver docs/VERIFICACAO-DE-CONTEUDO.md). As empresas são fictícias.
 */
import type { ReviewSet } from '../../../../engine/types'

export const REVIEW_F01: ReviewSet = {
  phaseId: 'gov.f01',
  questions: [
    {
      id: 'rv:gov.f01.m1.a3',
      kind: 'decision',
      title: 'Memória e disco de uma frota mista',
      prompt:
        'Uma rede de farmácias tem servidores Linux em instâncias EC2 e servidores Windows Server **no próprio data center**. A equipe quer acompanhar no CloudWatch a **memória usada** e o **espaço em disco** de todos eles, com uma **única solução**, e não encontra essas métricas no namespace AWS/EC2. Quais ações atendem? (Escolha DUAS.)',
      concepts: [{ id: 'cw.agent' }, { id: 'cw.what' }],
      xp: 5,
      difficulty: 2,
      domain: 'd3',
      multiple: true,
      options: [
        { id: 'a', text: 'Instalar o agente do CloudWatch nas instâncias EC2 e nos servidores locais.', correct: true, consequence: 'O agente roda em EC2 e fora da AWS, em Linux e Windows Server, e envia as métricas do sistema operacional.' },
        { id: 'b', text: 'Configurar no agente a coleta de mem_used_percent e disk_used_percent.', correct: true, consequence: 'As métricas de memória e disco passam a aparecer, por padrão no namespace CWAgent.' },
        { id: 'c', text: 'Ligar o monitoramento detalhado nas instâncias EC2.', correct: false, consequence: 'O detalhado só deixa as métricas prontas mais frequentes; memória e disco continuam de fora.' },
        { id: 'd', text: 'Procurar as métricas de memória no namespace AWS/EC2 de outra Região.', correct: false, consequence: 'As métricas prontas do EC2 não incluem memória nem disco em nenhuma Região.' },
        { id: 'e', text: 'Criar alarmes sobre as verificações de status das instâncias.', correct: false, consequence: 'As verificações de status avisam falhas, mas não medem memória nem disco.' },
      ],
      explanation: [
        'As métricas prontas do EC2 **não incluem a memória nem o espaço em disco** do sistema operacional. O **agente do CloudWatch**, instalado dentro da instância ou do servidor local, coleta métricas como **mem_used_percent** e **disk_used_percent** e as envia ao CloudWatch, por padrão no namespace CWAgent. Ele funciona em EC2 e fora da AWS, em Linux e Windows Server.',
        'O monitoramento detalhado só muda a frequência das métricas prontas. Nenhuma Região tem memória no AWS/EC2. Verificações de status não medem recursos do sistema.',
        '**Regra prática:** "memória", "disco" ou "arquivos de log da instância" no CloudWatch apontam para o agente do CloudWatch.',
      ],
    },
    {
      id: 'rv:gov.f01.statsd-da-aplicacao',
      kind: 'decision',
      title: 'Pedidos por minuto vindos de um sistema legado',
      prompt:
        'Uma aplicação legada em instâncias EC2 já emite métricas de negócio, como pedidos por minuto, pelo protocolo **StatsD**, para um servidor que a empresa quer desligar. A equipe quer levar essas métricas ao CloudWatch **sem alterar o código** da aplicação. Qual solução atende?',
      concepts: [{ id: 'cw.agent' }],
      xp: 5,
      difficulty: 2,
      domain: 'd3',
      options: [
        { id: 'a', text: 'Reescrever o envio com o SDK, chamando PutMetricData a cada pedido.', correct: false, consequence: 'Funciona, mas exige alterar o código, o que foi descartado.' },
        { id: 'b', text: 'Ligar o monitoramento detalhado das instâncias da aplicação.', correct: false, consequence: 'O detalhado só torna as métricas prontas do EC2 mais frequentes; não recebe métricas de negócio.' },
        { id: 'c', text: 'Configurar o agente do CloudWatch para receber as métricas StatsD.', correct: true, consequence: 'A aplicação continua emitindo StatsD, agora para o agente, que publica no CloudWatch.' },
        { id: 'd', text: 'Criar um painel do CloudWatch apontando para o servidor StatsD.', correct: false, consequence: 'Painéis mostram métricas que já estão no CloudWatch; não buscam dados de outro servidor.' },
      ],
      explanation: [
        'O **agente do CloudWatch** também aceita métricas de aplicações pelos protocolos **StatsD** e **collectd**. A aplicação continua emitindo do mesmo jeito, agora para o agente, que publica as métricas no CloudWatch.',
        'O SDK exige mudar o código. O monitoramento detalhado não recebe métricas de negócio. Um painel só mostra o que já está no CloudWatch.',
        '**Regra prática:** métricas de dentro da instância, do sistema operacional ou da aplicação via StatsD e collectd, chegam ao CloudWatch pelo agente.',
      ],
    },
    {
      id: 'rv:gov.f01.metricas-que-ja-vem',
      kind: 'decision',
      title: 'Um agente para cada serviço gerenciado',
      prompt:
        'Ao planejar o monitoramento, um analista propôs **instalar um agente** em cada banco RDS, em cada fila SQS e em cada Application Load Balancer para coletar CPU, tamanho da fila e latência. A empresa quer gráficos e alarmes dessas métricas com o **menor custo e esforço**. Como avaliar a proposta?',
      concepts: [{ id: 'cw.what' }],
      xp: 5,
      difficulty: 1,
      domain: 'd4',
      options: [
        { id: 'a', text: 'Aprovar: o CloudWatch só mede o que um agente instalado envia.', correct: false, consequence: 'Muitos serviços da AWS enviam métricas básicas ao CloudWatch sozinhos.' },
        { id: 'b', text: 'Aprovar, mas com o monitoramento detalhado ligado em cada serviço.', correct: false, consequence: 'O monitoramento detalhado é do EC2, e o problema da proposta é o agente desnecessário.' },
        { id: 'c', text: 'Recusar: publicar as métricas como personalizadas, por um script.', correct: false, consequence: 'Paga métricas personalizadas e mantém um script para dados que já existem de graça.' },
        { id: 'd', text: 'Recusar: esses serviços já enviam essas métricas ao CloudWatch.', correct: true, consequence: 'Gráficos e alarmes usam as métricas que os serviços publicam sozinhos e sem custo.' },
      ],
      explanation: [
        'Muitos serviços da AWS, como RDS, SQS e ELB, **enviam métricas básicas ao CloudWatch sozinhos e sem custo**. Num serviço gerenciado não há nem onde instalar um agente. Basta montar gráficos e alarmes sobre essas métricas.',
        'O agente é para o que está dentro do sistema operacional de uma instância ou servidor. Métricas personalizadas e scripts pagam por dados que já existem.',
        '**Regra prática:** antes de instalar algo, confira as métricas que o serviço já publica; o agente é para memória, disco e logs dentro de servidores.',
      ],
    },
    {
      id: 'rv:gov.f01.m1.a2:dimension',
      kind: 'decision',
      title: 'Total de requisições de uma frota que muda',
      prompt:
        'Uma aplicação em 40 instâncias de um grupo do Auto Scaling publica a métrica personalizada `Requisicoes` com a dimensão **InstanceId**. As instâncias mudam o dia todo. A equipe quer **um alarme sobre o total de requisições de toda a frota**, sem editar o alarme a cada instância nova. Qual mudança atende?',
      concepts: [{ id: 'cw.metrics' }],
      xp: 5,
      difficulty: 3,
      domain: 'd3',
      options: [
        { id: 'a', text: 'Publicar a métrica também com uma dimensão comum, como Servico=checkout.', correct: true, consequence: 'Todas as instâncias passam a somar na mesma série, e o alarme olha essa série.' },
        { id: 'b', text: 'Criar o alarme sobre Requisicoes sem dimensão, que soma as instâncias.', correct: false, consequence: 'Cada combinação de dimensões é uma métrica separada: a métrica sem dimensão não recebeu nenhum ponto.' },
        { id: 'c', text: 'Criar um alarme por instância e um composto com todos eles.', correct: false, consequence: 'O composto combina estados, não soma valores, e precisaria ser editado a cada instância nova.' },
        { id: 'd', text: 'Trocar o namespace para AWS/EC2, que agrega por grupo sozinho.', correct: false, consequence: 'Namespaces AWS/ são dos serviços da AWS, e o namespace não soma métricas.' },
      ],
      explanation: [
        'No CloudWatch, **cada combinação diferente de dimensões é uma métrica separada**. Publicada só com InstanceId, `Requisicoes` vira 40 métricas, e a mesma métrica sem dimensões não existe. Publicando também com uma **dimensão comum**, como o nome do serviço, todas as instâncias alimentam uma única série, sobre a qual o alarme trabalha.',
        'O CloudWatch não soma sozinho dimensões diferentes. Um alarme composto combina estados, não valores. Namespaces separam métricas, não as somam.',
        '**Regra prática:** métrica, namespace e dimensões identificam a série; para ver o total, publique também com as dimensões do nível que você quer acompanhar.',
      ],
    },
    {
      id: 'rv:gov.f01.m2.a3',
      kind: 'decision',
      title: 'Um pico que o gráfico não mostrou',
      prompt:
        'Um pico de CPU de 20 segundos derrubou um site, mas o gráfico do CloudWatch, com **período de 5 minutos e estatística média**, mostra no máximo 45%. A equipe quer que o gráfico e o alarme **mostrem picos curtos** como esse daqui em diante. Qual mudança atende?',
      concepts: [{ id: 'cw.statistics' }],
      xp: 5,
      difficulty: 1,
      domain: 'd3',
      options: [
        { id: 'a', text: 'Trocar a estatística para soma, mantendo o período de 5 minutos.', correct: false, consequence: 'Somar porcentagens de CPU não dá um número com sentido.' },
        { id: 'b', text: 'Aumentar o período para 1 hora, para ter mais pontos.', correct: false, consequence: 'Um período maior dilui ainda mais o pico na média.' },
        { id: 'c', text: 'Trocar a estatística para o máximo ou um percentil alto.', correct: true, consequence: 'O valor mais alto de cada período aparece no gráfico e no alarme.' },
        { id: 'd', text: 'Trocar a estatística para contagem de amostras.', correct: false, consequence: 'Mostra quantos pontos chegaram, não quão alta ficou a CPU.' },
      ],
      explanation: [
        'A **estatística** decide o que o gráfico e o alarme enxergam: a **média** de um período dilui um pico curto, e o **máximo** (ou um percentil alto) o mostra.',
        'A soma de porcentagens de CPU não tem significado. Um período maior junta mais pontos na mesma média e dilui ainda mais o pico. A contagem de amostras diz quantos pontos chegaram, não o valor deles.',
        '**Regra prática:** se um alarme não vê picos curtos, confira a estatística e o período; para picos, máximo ou percentil alto.',
      ],
    },
    {
      id: 'rv:gov.f01.m2.a1',
      kind: 'decision',
      title: 'Auto Scaling que demora a reagir aos picos',
      prompt:
        'Um grupo do Auto Scaling escala pela CPU média das instâncias, que foram lançadas com as **opções padrão**. Nos picos súbitos de acesso, o grupo leva vários minutos para perceber a carga e adicionar instâncias. A equipe quer que **o alarme perceba a mudança mais rápido**. O que fazer?',
      concepts: [{ id: 'cw.ec2-monitoring' }],
      xp: 5,
      difficulty: 2,
      domain: 'd3',
      options: [
        { id: 'a', text: 'Ligar o monitoramento detalhado do EC2 nas instâncias do grupo.', correct: true, consequence: 'As métricas passam a chegar a cada 1 minuto, em vez de 5, e o alarme reage antes.' },
        { id: 'b', text: 'Ligar o monitoramento detalhado dos volumes EBS das instâncias.', correct: false, consequence: 'A CPU vem da instância; mexer nos volumes não muda a frequência dela.' },
        { id: 'c', text: 'Trocar o período do alarme para 10 segundos.', correct: false, consequence: 'Com pontos de 5 minutos, um período menor não cria pontos que não existem.' },
        { id: 'd', text: 'Usar as verificações de status como métrica de escala.', correct: false, consequence: 'Saem a cada minuto, mas indicam falhas, não a carga das instâncias.' },
      ],
      explanation: [
        'Por padrão, o EC2 envia as métricas em pontos de **5 minutos** (monitoramento básico, sem custo). O **monitoramento detalhado** envia pontos de **1 minuto**, é cobrado por métrica e pode ser ligado no lançamento ou depois. Com ele, o alarme do Auto Scaling percebe a carga mais rápido.',
        'Os volumes EBS têm monitoramento próprio. Um período menor que o dos pontos não cria dados. Verificações de status não medem carga.',
        '**Regra prática:** "reagir mais rápido às mudanças de carga" ou "métricas a cada minuto" no EC2 apontam para o monitoramento detalhado.',
      ],
    },
    {
      id: 'rv:gov.f01.m2.a4',
      kind: 'decision',
      title: 'Detectar uma fila travada em segundos',
      prompt:
        'Um sistema de pagamentos publica a métrica personalizada `PagamentosPendentes` e precisa **disparar um alarme em até 30 segundos** depois que a fila trava. Hoje a métrica é publicada com resolução padrão, e o alarme tem período de 1 minuto. A empresa aceita **pagar mais pelo alarme** para ganhar velocidade. O que fazer?',
      concepts: [{ id: 'cw.resolution-retention' }],
      xp: 5,
      difficulty: 2,
      domain: 'd3',
      options: [
        { id: 'a', text: 'Publicar a métrica em alta resolução e usar um alarme de 10 segundos.', correct: true, consequence: 'Com pontos de 1 segundo, o alarme de alta resolução avalia a cada 10 segundos.' },
        { id: 'b', text: 'Ligar o monitoramento detalhado nas instâncias do sistema.', correct: false, consequence: 'O detalhado vale para as métricas do EC2, com pontos de 1 minuto, não para métricas personalizadas.' },
        { id: 'c', text: 'Manter a resolução padrão e mudar o período do alarme para 10 segundos.', correct: false, consequence: 'Com um ponto por minuto, o alarme não tem dados para avaliar a cada 10 segundos.' },
        { id: 'd', text: 'Avaliar 1 de 3 pontos, em vez de 1 de 1, no alarme atual.', correct: false, consequence: 'Mais pontos aumentam o intervalo avaliado, não a velocidade.' },
      ],
      explanation: [
        'Métricas personalizadas podem ser publicadas em **alta resolução**, com pontos de **1 segundo**. Sobre elas, um **alarme de alta resolução**, com período de 10 ou 30 segundos, dispara bem antes de um minuto, por um preço maior. Pontos com período menor que 60 segundos ficam disponíveis por 3 horas.',
        'O detalhado é do EC2 e para em 1 minuto. Um período menor que o dos pontos não tem dados. Mais períodos de avaliação deixam o alarme mais lento.',
        '**Regra prática:** detectar em segundos pede métrica de alta resolução e alarme de alta resolução, que custa mais.',
      ],
    },
    {
      id: 'rv:gov.f01.m3.a2',
      kind: 'decision',
      title: 'Alarmes novos que apareceram em estado estranho',
      prompt:
        'Um script cria alarmes de CPU para cada instância nova de uma frota. O plantão abriu um incidente porque **todos os alarmes recém-criados** aparecem em **INSUFFICIENT_DATA** nos primeiros minutos, embora as instâncias estejam saudáveis. A equipe precisa **decidir se há um problema**. Qual é a avaliação correta?',
      concepts: [{ id: 'cw.alarm' }],
      xp: 5,
      difficulty: 1,
      domain: 'd2',
      options: [
        { id: 'a', text: 'Há problema: INSUFFICIENT_DATA indica que a métrica passou do limite.', correct: false, consequence: 'Passar do limite leva o alarme ao estado ALARM, não a INSUFFICIENT_DATA.' },
        { id: 'b', text: 'Não há problema: o alarme começou agora e ainda não tem dados.', correct: true, consequence: 'Com os primeiros pontos, os alarmes passam para OK ou ALARM.' },
        { id: 'c', text: 'Há problema: a conta passou do número máximo de alarmes permitido.', correct: false, consequence: 'Não há um limite desses: você pode criar quantos alarmes quiser.' },
        { id: 'd', text: 'Não há problema: INSUFFICIENT_DATA é o estado normal de um alarme saudável.', correct: false, consequence: 'O estado de um alarme dentro do limite é OK; INSUFFICIENT_DATA é falta de dados.' },
      ],
      explanation: [
        'Um alarme está sempre em um de três estados: **OK** (dentro do limite), **ALARM** (fora do limite) ou **INSUFFICIENT_DATA**, quando ele **acabou de começar** ou **não há dados suficientes** para decidir. Alarmes recém-criados passam por esse estado até receber pontos.',
        'INSUFFICIENT_DATA não é violação do limite, não é o estado saudável de sempre e não indica limite de alarmes.',
        '**Regra prática:** INSUFFICIENT_DATA é "não sei ainda"; se ele persiste, investigue por que a métrica não chega.',
      ],
    },
    {
      id: 'rv:gov.f01.m3.a5',
      kind: 'decision',
      title: 'Avisar depressa sem acordar ninguém por um pico',
      prompt:
        'A CPU de um servidor tem **picos normais de 1 ou 2 minutos** acima de 80%. O plantão quer ser avisado quando a CPU ficar acima de 80% na **maior parte de um intervalo de 5 minutos**, e não quer esperar mais que isso. A métrica tem pontos de 1 minuto. Qual configuração de alarme atende?',
      concepts: [{ id: 'cw.alarm-evaluation' }],
      xp: 5,
      difficulty: 2,
      domain: 'd2',
      options: [
        { id: 'a', text: 'Período de 1 minuto, 1 de 1 ponto.', correct: false, consequence: 'Dispara em cada pico normal de 1 minuto e acorda o plantão à toa.' },
        { id: 'b', text: 'Período de 1 minuto, 4 de 5 pontos.', correct: true, consequence: 'Olha os últimos 5 minutos e só dispara se 4 deles passarem do limite.' },
        { id: 'c', text: 'Período de 5 minutos, 3 de 3 pontos.', correct: false, consequence: 'Avalia 15 minutos, três vezes mais do que o plantão aceita esperar.' },
        { id: 'd', text: 'Período de 10 minutos, 1 de 1 ponto, com a média.', correct: false, consequence: 'Avalia 10 minutos e dilui o problema na média.' },
      ],
      explanation: [
        'O alarme tem o **período**, os **períodos de avaliação** (N) e os **pontos para disparar** (M). O **intervalo de avaliação** é N vezes o período. Com período de 1 minuto e **4 de 5**, o alarme olha 5 minutos e só dispara quando 4 pontos violam o limite, mesmo que não sejam seguidos.',
        '1 de 1 dispara em picos normais. 3 de 3 com 5 minutos avalia 15 minutos. 10 minutos com a média é lento e dilui.',
        '**Regra prática:** contra alarmes falsos de picos curtos, M de N com período curto; o intervalo avaliado é N vezes o período.',
      ],
    },
    {
      id: 'rv:gov.f01.m3.a1',
      kind: 'decision',
      title: 'Os pontos de um alarme de 3 de 5',
      prompt:
        'Um alarme de latência tem **período de 1 minuto** e dispara com **3 de 5 pontos** acima do limite. Os cinco pontos mais recentes estão abaixo, e todos chegaram. O plantão precisa saber, antes de mudar a configuração, **qual é o estado do alarme agora**. Qual é a resposta?',
      exhibits: [
        {
          title: 'Últimos 5 pontos (o mais antigo à esquerda; X passou do limite, 0 está dentro)',
          code: 'X   0   X   0   X',
        },
      ],
      concepts: [{ id: 'cw.alarm-evaluation' }, { id: 'cw.alarm' }],
      xp: 5,
      difficulty: 2,
      domain: 'd2',
      options: [
        { id: 'a', text: 'OK, porque os pontos acima do limite não são seguidos.', correct: false, consequence: 'Os pontos que violam o limite não precisam ser consecutivos.' },
        { id: 'b', text: 'INSUFFICIENT_DATA, porque metade dos pontos está dentro do limite.', correct: false, consequence: 'Todos os pontos chegaram; INSUFFICIENT_DATA é falta de dados.' },
        { id: 'c', text: 'OK, porque o ponto mais recente é o único que conta.', correct: false, consequence: 'O alarme olha os N pontos mais recentes, não só o último.' },
        { id: 'd', text: 'ALARM, porque 3 dos 5 pontos mais recentes violam o limite.', correct: true, consequence: 'Os 3 pontos ruins estão entre os 5 mais recentes, e isso basta.' },
      ],
      explanation: [
        'Num alarme **M de N**, os M pontos que violam o limite **não precisam ser consecutivos**, mas precisam estar entre os N mais recentes. Aqui, 3 dos 5 pontos violam o limite: o alarme está em **ALARM**.',
        'Não importa se os pontos são seguidos nem qual é o último. Com todos os pontos presentes, não há falta de dados.',
        '**Regra prática:** em M de N, conte quantos dos N pontos mais recentes violam o limite; a ordem não importa.',
      ],
    },
    {
      id: 'rv:gov.f01.m3.a6:ec2action',
      kind: 'decision',
      title: 'Uma instância saudável reiniciada pelo alarme',
      prompt:
        'Um alarme sobre uma métrica de uma instância EC2 tem a ação de **reiniciar a instância** e trata os dados ausentes como **breaching**. Numa madrugada, a métrica deixou de chegar por alguns minutos, e a instância, **saudável**, foi reiniciada. A equipe quer evitar reinícios sem motivo, seguindo a **recomendação da AWS**. O que mudar?',
      concepts: [{ id: 'cw.missing-data' }],
      xp: 5,
      difficulty: 3,
      domain: 'd2',
      options: [
        { id: 'a', text: 'Tratar os ausentes como notBreaching e manter a ação em qualquer estado.', correct: false, consequence: 'Esconde a falta de dados como se tudo estivesse bem, o que não é a recomendação para ações do EC2.' },
        { id: 'b', text: 'Tratar os ausentes como missing e disparar a ação só no estado ALARM.', correct: true, consequence: 'A falta de dados vira INSUFFICIENT_DATA, sem reiniciar uma instância que pode estar saudável.' },
        { id: 'c', text: 'Manter breaching e aumentar os períodos de avaliação para 10.', correct: false, consequence: 'Só atrasa o reinício indevido; a falta de dados continua contando como problema.' },
        { id: 'd', text: 'Trocar a ação de reiniciar pela de encerrar a instância.', correct: false, consequence: 'Troca um reinício indevido por uma instância encerrada sem motivo.' },
      ],
      explanation: [
        'Em alarmes de EC2 que **param, encerram, reiniciam ou recuperam** a instância, a AWS recomenda tratar os ausentes como **missing** e **disparar a ação só no estado ALARM**. A métrica pode falhar com a instância saudável, e o alarme não deve agir sem dados.',
        'notBreaching esconde a falta de dados. Mais períodos só atrasam o erro. Encerrar é pior que reiniciar.',
        '**Regra prática:** escolha o tratamento de ausentes pelo significado da métrica: breaching para batimento, notBreaching para métrica que só existe com erro, missing para ações do EC2.',
      ],
    },
    {
      id: 'rv:gov.f01.m3.a6:keep',
      kind: 'decision',
      title: 'Uma métrica que chega em lotes',
      prompt:
        'Um processo publica a métrica `RegistrosRejeitados` **em lotes, a cada 15 minutos**; entre os lotes, não chega nada. O alarme, com período de 5 minutos e o tratamento padrão de ausentes, **fica trocando de estado** entre os lotes, e o plantão perde a confiança nele. A equipe quer que o alarme **mantenha o último estado** enquanto espera o próximo lote. O que configurar?',
      concepts: [{ id: 'cw.missing-data' }],
      xp: 5,
      difficulty: 2,
      domain: 'd2',
      options: [
        { id: 'a', text: 'Tratar os dados ausentes como ignore.', correct: true, consequence: 'Nos intervalos sem dados, o alarme mantém o estado em que estava.' },
        { id: 'b', text: 'Tratar os dados ausentes como breaching.', correct: false, consequence: 'Cada intervalo entre lotes passaria a disparar o alarme.' },
        { id: 'c', text: 'Manter o tratamento padrão, missing.', correct: false, consequence: 'É o que já acontece: sem dados, o alarme vai para INSUFFICIENT_DATA.' },
        { id: 'd', text: 'Tratar os dados ausentes como notBreaching.', correct: false, consequence: 'Cada intervalo entre lotes empurraria o alarme para OK, mesmo depois de um lote ruim.' },
      ],
      explanation: [
        'Com o tratamento **ignore**, um ponto ausente **mantém o estado atual** do alarme. Para uma métrica que chega em lotes, o alarme espera o próximo lote sem mudar de estado.',
        'breaching dispararia entre os lotes; notBreaching voltaria a OK sem motivo; o padrão, missing, leva a INSUFFICIENT_DATA.',
        '**Regra prática:** ausente como bom (notBreaching), como ruim (breaching), sem opinião (ignore) ou sem dados suficientes (missing, o padrão): escolha pelo que a falta de dados significa.',
      ],
    },
    {
      id: 'rv:gov.f01.m4.a4',
      kind: 'decision',
      title: 'Um aviso às 2h e silêncio até as 8h',
      prompt:
        'Um alarme de fila parada mandou um e-mail pelo SNS às 2h e **continua em ALARM às 8h**, sem nenhum outro aviso nesse intervalo. O gerente acha que o SNS falhou e quer uma explicação antes de abrir um chamado. Qual é a explicação correta?',
      concepts: [{ id: 'cw.alarm-actions' }],
      xp: 5,
      difficulty: 2,
      domain: 'd2',
      options: [
        { id: 'a', text: 'O SNS limita cada tópico a um e-mail por noite.', correct: false, consequence: 'Não há esse limite; o SNS entrega cada mensagem que recebe.' },
        { id: 'b', text: 'O alarme só repete o aviso se mudar para INSUFFICIENT_DATA.', correct: false, consequence: 'Nenhuma ação se repete enquanto o estado é o mesmo; uma transição dispararia a ação daquele estado.' },
        { id: 'c', text: 'As ações acontecem na mudança de estado e não se repetem.', correct: true, consequence: 'O alarme avisou ao entrar em ALARM e não volta a avisar enquanto continuar nele.' },
        { id: 'd', text: 'O alarme reenvia o aviso a cada hora, mas o e-mail foi filtrado.', correct: false, consequence: 'O alarme não reenvia avisos periódicos enquanto continua no mesmo estado.' },
      ],
      explanation: [
        'Exceto as ações do Auto Scaling, as **ações de um alarme acontecem só na transição de estado** e **não se repetem** enquanto a condição continua. O e-mail das 2h foi a ação da entrada em ALARM.',
        'O SNS não tem esse limite. A repetição não depende de passar por INSUFFICIENT_DATA. E o alarme não reenvia avisos sozinho.',
        '**Regra prática:** um aviso por mudança de estado. Para lembretes enquanto o problema dura, é preciso outro mecanismo.',
      ],
    },
    {
      id: 'rv:gov.f01.m4.a1:ec2',
      kind: 'decision',
      title: 'Falha de hardware numa instância sem Auto Scaling',
      prompt:
        'Um servidor de licenças roda numa **única instância EC2**, fora de qualquer grupo do Auto Scaling. Quando o hardware do host falha, a verificação de status do sistema (`StatusCheckFailed_System`) acusa a falha, e alguém precisa agir à mão. A empresa quer que a instância **volte sozinha** nesses casos. O que configurar?',
      concepts: [{ id: 'cw.alarm-actions' }],
      xp: 5,
      difficulty: 2,
      domain: 'd2',
      options: [
        { id: 'a', text: 'Um alarme de CPU alta com a ação de reiniciar a instância.', correct: false, consequence: 'CPU alta não indica falha de hardware, e reiniciar no mesmo host não resolve o problema dele.' },
        { id: 'b', text: 'Um alarme sobre StatusCheckFailed_System com a ação de recuperar.', correct: true, consequence: 'A instância é recuperada em outro hardware, sem ninguém agir.' },
        { id: 'c', text: 'Um alarme sobre StatusCheckFailed_System que só notifica o SNS.', correct: false, consequence: 'A equipe fica sabendo, mas ainda precisa agir à mão.' },
        { id: 'd', text: 'Um painel do CloudWatch com a verificação de status em destaque.', correct: false, consequence: 'Mostra o problema, mas não faz nada para resolvê-lo.' },
      ],
      explanation: [
        'Alarmes sobre métricas do EC2 podem **agir sobre a instância**: parar, encerrar, reiniciar ou **recuperar**. Para falha de hardware, a resposta é um alarme sobre a verificação de status do sistema com a **ação de recuperação**, que traz a instância de volta em outro hardware.',
        'CPU alta não é falha de hardware. Notificar e mostrar num painel ainda exigem ação manual.',
        '**Regra prática:** "recuperar automaticamente uma instância com falha de hardware" é a ação de recuperação do EC2 num alarme de status check; "notificar a equipe" é SNS.',
      ],
    },
    {
      id: 'rv:gov.f01.m4.a3',
      kind: 'decision',
      title: 'Reiniciar só quando CPU e memória estão altas',
      prompt:
        'Um alarme composto `ALARM("cpu-alta") AND ALARM("memoria-alta")` avisa o plantão quando um servidor EC2 engasga. A equipe quer que, nessa mesma situação, **a instância seja reiniciada automaticamente**, sem reiniciar quando só uma das duas condições acontece. Qual solução atende?',
      concepts: [{ id: 'cw.composite-alarm' }],
      xp: 5,
      difficulty: 3,
      domain: 'd2',
      options: [
        { id: 'a', text: 'Adicionar ao alarme composto a ação do EC2 de reiniciar a instância.', correct: false, consequence: 'Alarmes compostos só notificam o SNS, chamam Lambda ou criam itens no Systems Manager.' },
        { id: 'b', text: 'Adicionar a ação de reiniciar ao alarme de CPU alta.', correct: false, consequence: 'A instância seria reiniciada com a CPU alta sozinha, o que a equipe não quer.' },
        { id: 'c', text: 'Fazer o alarme composto chamar uma Lambda que reinicia a instância.', correct: true, consequence: 'O reinício só acontece quando as duas condições estão em ALARM juntas.' },
        { id: 'd', text: 'Adicionar a ação de reiniciar aos dois alarmes de baixo.', correct: false, consequence: 'Cada condição sozinha reiniciaria a instância.' },
      ],
      explanation: [
        'Um **alarme composto** combina estados de outros alarmes com AND, OR e NOT, mas **só pode notificar o SNS, chamar funções Lambda e criar itens ou incidentes no Systems Manager**. As ações do EC2 existem só em alarmes de métricas do EC2. Para reiniciar quando as duas condições acontecem juntas, o composto chama uma Lambda que reinicia a instância.',
        'Colocar a ação nos alarmes de baixo reinicia com uma condição só.',
        '**Regra prática:** composto para reduzir barulho e combinar condições; para agir sobre a instância a partir dele, use uma Lambda ou o Systems Manager.',
      ],
    },
    {
      id: 'rv:gov.f01.m1.a4',
      kind: 'decision',
      title: 'Uma tela única para o plantão',
      prompt:
        'A equipe de plantão de uma varejista quer abrir **uma única tela** com a CPU dos servidores em **sa-east-1** e o tamanho da fila de pedidos em **us-east-1**, com instruções de atendimento ao lado dos gráficos. A empresa quer a solução **mais simples**. O que criar?',
      concepts: [{ id: 'cw.dashboards' }],
      xp: 5,
      difficulty: 1,
      domain: 'd3',
      options: [
        { id: 'a', text: 'Um painel do CloudWatch em cada Região, abertos em duas abas.', correct: false, consequence: 'Funciona, mas separa a visão em duas telas, o oposto do pedido.' },
        { id: 'b', text: 'Um painel do CloudWatch com os gráficos das duas Regiões e um texto.', correct: true, consequence: 'Um painel mostra métricas de Regiões diferentes e aceita instruções ao lado dos gráficos.' },
        { id: 'c', text: 'Um alarme composto com as duas métricas, aberto pelo plantão.', correct: false, consequence: 'O composto combina estados de alarmes da mesma Região; não é uma tela de gráficos.' },
        { id: 'd', text: 'Copiar a métrica da fila para sa-east-1 com uma Lambda.', correct: false, consequence: 'Trabalho e custo para algo que o painel já faz.' },
      ],
      explanation: [
        'Um **painel do CloudWatch** junta gráficos de métricas, logs e alarmes numa tela só, **mesmo de recursos em Regiões diferentes**, e pode ter textos com o roteiro de atendimento ao lado dos gráficos.',
        'Dois painéis separam a visão. O alarme composto não é uma tela e só combina alarmes da mesma Região. Copiar métricas é trabalho desnecessário.',
        '**Regra prática:** visão única de várias Regiões é um painel do CloudWatch; com a observabilidade entre contas, até de várias contas.',
      ],
    },
  ],
}
