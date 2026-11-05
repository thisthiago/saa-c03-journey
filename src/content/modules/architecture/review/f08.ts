/**
 * Questões da Revisão da Fase 8 de Arquitetura e otimização (padrões de
 * arquitetura), no formato do exame SAA-C03. Fatos conferidos em
 * docs.aws.amazon.com (ver docs/VERIFICACAO-DE-CONTEUDO.md). As empresas são
 * fictícias.
 */
import type { ReviewSet } from '../../../../engine/types'

export const REVIEW_F08: ReviewSet = {
  phaseId: 'arq.f08',
  questions: [
    {
      id: 'rv:arq.f08.m1.a1:p1',
      kind: 'decision',
      title: 'Onde fica cada camada',
      prompt:
        'Uma operadora de turismo vai montar o site de reservas em **três camadas** (web, aplicação e banco), em duas AZs. A segurança exige que **só o balanceador** receba tráfego da internet e que o banco **só aceite conexões da camada de aplicação**. Quais configurações atendem? (Escolha DUAS.)',
      concepts: [{ id: 'pat.three-tier' }],
      xp: 5,
      difficulty: 2,
      domain: 'd1',
      multiple: true,
      options: [
        { id: 'a', text: 'O ALB em sub-redes públicas, e as instâncias em sub-redes privadas.', correct: true, consequence: 'Só o balanceador fica exposto; os servidores não têm acesso direto da internet.' },
        { id: 'b', text: 'As instâncias de aplicação em sub-redes públicas, com IP público.', correct: false, consequence: 'Expõe os servidores à internet sem necessidade.' },
        { id: 'c', text: 'O banco em sub-redes privadas, com o security group da aplicação como origem.', correct: true, consequence: 'Só a camada de aplicação chega ao banco.' },
        { id: 'd', text: 'O banco acessível publicamente, protegido por uma senha forte.', correct: false, consequence: 'A camada de dados fica alcançável pela internet.' },
        { id: 'e', text: 'Um security group único para as três camadas, aberto entre elas.', correct: false, consequence: 'Qualquer camada fala com qualquer outra, sem isolamento.' },
      ],
      explanation: [
        'Na **arquitetura em três camadas**, apresentação, aplicação e dados ficam separadas: o **balanceador nas sub-redes públicas**, a aplicação e o banco nas **privadas**, com **um security group por camada**. O banco aceita só o security group da aplicação, e cada camada escala e se protege por conta própria.',
        'Servidores com IP público e banco acessível da internet desfazem o isolamento. Um security group único deixa todas as camadas se falarem.',
        '**Regra prática:** aplicação web segura e disponível é três camadas em várias AZs, só o balanceador público e um security group por camada.',
      ],
    },
    {
      id: 'rv:arq.f08.camada-de-dados',
      kind: 'decision',
      title: 'Duas camadas redundantes e uma não',
      prompt:
        'Num site em três camadas, o ALB e os servidores web e de aplicação estão em **grupos do Auto Scaling em duas AZs**. O banco é um RDS **Single-AZ**. O requisito é que o site **continue gravando reservas se uma AZ falhar**, com failover automático. Qual mudança fecha o ponto único de falha?',
      concepts: [{ id: 'pat.three-tier' }],
      xp: 5,
      difficulty: 2,
      domain: 'd2',
      options: [
        { id: 'a', text: 'Criar uma réplica de leitura do RDS na outra AZ.', correct: false, consequence: 'A réplica não aceita gravações e não assume sozinha.' },
        { id: 'b', text: 'Ligar o Multi-AZ no RDS.', correct: true, consequence: 'O standby assume sozinho, e as reservas continuam sendo gravadas.' },
        { id: 'c', text: 'Aumentar a classe da instância do banco.', correct: false, consequence: 'O banco continua numa AZ só e cai junto com ela.' },
        { id: 'd', text: 'Pôr mais instâncias de aplicação na outra AZ.', correct: false, consequence: 'A aplicação já é redundante; o banco segue único.' },
      ],
      explanation: [
        'Cada camada da **arquitetura em três camadas** precisa estar em **várias AZs**; basta uma camada única para o conjunto cair. Com o banco **Single-AZ**, a falha da AZ dele derruba as reservas. O **RDS Multi-AZ** mantém um standby síncrono em outra AZ, com failover automático.',
        'A réplica de leitura não grava nem assume sozinha. Instância maior e mais servidores de aplicação não mexem no banco único.',
        '**Regra prática:** em três camadas, confira as três: balanceador, aplicação e banco, todos em várias AZs.',
      ],
    },
    {
      id: 'rv:arq.f08.m1.a1:p2',
      kind: 'decision',
      title: 'Uma mudança de tabela que quebra o vizinho',
      prompt:
        'Uma empresa quebrou o monólito em serviços de pedidos, estoque e pagamentos, mas os três **leem e gravam as mesmas tabelas** num banco compartilhado. Toda mudança de esquema feita por um time **quebra os outros**, e as liberações voltaram a ser conjuntas. Qual mudança segue o padrão de microsserviços?',
      concepts: [{ id: 'pat.microservices' }],
      xp: 5,
      difficulty: 3,
      domain: 'd2',
      options: [
        { id: 'a', text: 'Um comitê que aprova toda mudança de esquema no banco.', correct: false, consequence: 'Coordena os times, mas mantém o acoplamento pelos dados.' },
        { id: 'b', text: 'Juntar os três serviços de volta num único deploy.', correct: false, consequence: 'Volta ao monólito e perde a independência.' },
        { id: 'c', text: 'Uma instância maior para o banco compartilhado.', correct: false, consequence: 'Não muda o fato de todos dependerem das mesmas tabelas.' },
        { id: 'd', text: 'Dados próprios por serviço, via API ou eventos.', correct: true, consequence: 'Cada time muda o próprio esquema sem quebrar os outros.' },
      ],
      explanation: [
        'Em **microsserviços**, cada componente é **dono dos próprios dados**, e os outros só os acessam pela **API** ou por **eventos**. Assim, cada serviço escala, é liberado e muda o esquema de forma independente; em troca, há mais coisas para operar e a consistência entre serviços passa a ser eventual.',
        'Comitês e um único deploy mantêm o acoplamento. Uma instância maior não separa os dados.',
        '**Regra prática:** serviços que compartilham tabelas não são independentes; cada microsserviço tem o próprio armazenamento.',
      ],
    },
    {
      id: 'rv:arq.f08.m1.a1:p3',
      kind: 'decision',
      title: 'Imagens que chegam sem horário',
      prompt:
        'Uma imobiliária recebe fotos de imóveis num bucket S3 **em horários irregulares**: às vezes nenhuma por horas, às vezes centenas em minutos. Cada foto precisa virar uma **miniatura** logo depois do envio. O time não quer **gerenciar servidores** e quer **pagar só pelo uso**. Qual solução atende?',
      concepts: [{ id: 'pat.serverless' }],
      xp: 5,
      difficulty: 1,
      domain: 'd3',
      options: [
        { id: 'a', text: 'Uma instância EC2 que verifica o bucket a cada minuto.', correct: false, consequence: 'Paga o servidor parado e atrasa as miniaturas até a próxima verificação.' },
        { id: 'b', text: 'Lambda disparado pelo evento de objeto criado.', correct: true, consequence: 'Cada foto dispara a função, que escala sozinha e cobra por execução.' },
        { id: 'c', text: 'Um cluster do ECS em instâncias EC2 sempre ligadas.', correct: false, consequence: 'Exige gerenciar instâncias e paga capacidade ociosa.' },
        { id: 'd', text: 'Um job agendado no EMR uma vez por dia.', correct: false, consequence: 'As miniaturas saem com até um dia de atraso, com um cluster para isso.' },
      ],
      explanation: [
        'Na **arquitetura serverless**, não há servidores para manter: o **Lambda** roda o código, disparado por eventos como o envio de um objeto ao **S3**, e **escala sozinho**, cobrando só pelas execuções. Carga irregular é o caso típico.',
        'Instâncias e clusters sempre ligados pagam o tempo parado e exigem operação. Um job diário atrasa o resultado.',
        '**Regra prática:** processamento disparado por eventos, irregular e sem servidores para manter é Lambda.',
      ],
    },
    {
      id: 'rv:arq.f08.api-com-picos',
      kind: 'decision',
      title: 'Uma API que multiplica por cem',
      prompt:
        'Um aplicativo de ingressos tem uma **API pública** que recebe poucos pedidos por minuto, mas **multiplica por cem** quando um show é anunciado, sem aviso. O time quer que tudo **escale sozinho**, **sem gerenciar servidores** e **pagando pelo uso**. Qual combinação atende?',
      concepts: [{ id: 'pat.serverless' }],
      xp: 5,
      difficulty: 2,
      domain: 'd3',
      options: [
        { id: 'a', text: 'ALB, grupo do Auto Scaling de EC2 e RDS for MySQL.', correct: false, consequence: 'Escala, mas exige gerenciar instâncias e paga a capacidade mínima sempre.' },
        { id: 'b', text: 'Elastic Beanstalk com instâncias EC2 e um RDS Multi-AZ.', correct: false, consequence: 'Facilita a implantação, mas continua com servidores e banco provisionados.' },
        { id: 'c', text: 'API Gateway, Lambda e DynamoDB sob demanda.', correct: true, consequence: 'Cada peça escala sozinha e cobra pelo uso, sem servidores.' },
        { id: 'd', text: 'Um cluster do ECS em EC2 dimensionado para o maior pico.', correct: false, consequence: 'Paga o pico o tempo todo e exige gerenciar o cluster.' },
      ],
      explanation: [
        'A combinação **API Gateway** (recebe as chamadas), **Lambda** (roda o código) e **DynamoDB** (guarda os dados) é o padrão **serverless**: cada peça **escala sozinha** e cobra pelo uso. É um princípio do pilar de desempenho e tira o trabalho de cuidar de servidores.',
        'ALB com Auto Scaling, Beanstalk e ECS em EC2 funcionam, mas mantêm instâncias e bancos provisionados para administrar e pagar.',
        '**Regra prática:** "sem gerenciar servidores", "escalar sozinho" e "pagar só pelo uso" apontam para API Gateway, Lambda, DynamoDB e S3.',
      ],
    },
    {
      id: 'rv:arq.f08.m1.a2',
      kind: 'decision',
      title: 'A reserva que cai junto com os pontos',
      prompt:
        'Depois de confirmar uma reserva, o serviço de reservas **chama em sequência** os serviços de fraude, e-mail e programa de pontos. Quando o de pontos fica lento, **a reserva inteira falha**. A empresa quer que uma falha num deles **não afete a reserva** e que novos interessados entrem **sem mudar o serviço de reservas**. Qual arquitetura atende?',
      concepts: [{ id: 'pat.event-driven' }],
      xp: 5,
      difficulty: 1,
      domain: 'd2',
      options: [
        { id: 'a', text: 'Aumentar o tempo limite das chamadas aos três serviços.', correct: false, consequence: 'A reserva espera mais, e continua presa aos três.' },
        { id: 'b', text: 'Publicar o evento no EventBridge, uma regra por consumidor.', correct: true, consequence: 'A reserva só publica; cada serviço reage sozinho, e um novo entra com uma regra.' },
        { id: 'c', text: 'Chamar os três serviços em paralelo, e não mais em sequência.', correct: false, consequence: 'Fica mais rápido, mas a falha de um ainda trava a reserva.' },
        { id: 'd', text: 'Os três serviços consultarem o banco de reservas a cada minuto.', correct: false, consequence: 'Atrasa as reações e sobrecarrega o banco.' },
      ],
      explanation: [
        'Na **arquitetura orientada a eventos**, o componente **publica** um evento ("reserva confirmada") e quem se interessa **reage**, sem que o emissor conheça os consumidores. Uma falha num consumidor não trava os outros, e um novo consumidor entra com uma **regra** no barramento do EventBridge.',
        'Tempo limite maior e chamadas paralelas mantêm o acoplamento síncrono. Consultar o banco periodicamente atrasa e pesa.',
        '**Regra prática:** "acrescentar consumidores sem mexer no emissor" e "a falha de um não derruba o outro" apontam para eventos com EventBridge ou SNS.',
      ],
    },
    {
      id: 'rv:arq.f08.m1.a3',
      kind: 'decision',
      title: 'Quando os eventos não bastam',
      prompt:
        'A reserva de uma viagem tem passos com **ordem obrigatória**: bloquear o voo, cobrar o cartão e emitir o bilhete. Se a cobrança falhar, o **bloqueio precisa ser desfeito**, e a operação quer **ver o estado de cada reserva**. Hoje cada serviço reage a eventos dos outros. Qual mudança atende melhor?',
      concepts: [{ id: 'pat.event-driven' }],
      xp: 5,
      difficulty: 3,
      domain: 'd2',
      options: [
        { id: 'a', text: 'Acrescentar mais regras no barramento para cada falha possível.', correct: false, consequence: 'A ordem e a compensação ficam ainda mais espalhadas e difíceis de acompanhar.' },
        { id: 'b', text: 'Um fluxo no Step Functions com passo para desfazer o bloqueio.', correct: true, consequence: 'O fluxo fica visível, e a falha na cobrança desfaz o bloqueio.' },
        { id: 'c', text: 'Uma chamada síncrona encadeada entre os três serviços.', correct: false, consequence: 'Qualquer lentidão trava a reserva, e a compensação continua manual.' },
        { id: 'd', text: 'Uma fila do SQS entre cada par de serviços.', correct: false, consequence: 'Desacopla, mas não dá ordem garantida, compensação nem visão do fluxo.' },
      ],
      explanation: [
        'A orientação a eventos (**coreografia**) combina com reações **independentes**. Quando há **ordem obrigatória**, **compensação** e necessidade de ver o estado, o fluxo fica mais claro **orquestrado**, com um coordenador como o **Step Functions**, que chama cada passo e desfaz o bloqueio se a cobrança falhar.',
        'Mais regras espalham ainda mais a lógica. Chamadas síncronas encadeadas voltam a acoplar. Filas desacoplam, mas não coordenam o fluxo.',
        '**Regra prática:** reações independentes, coreografia com eventos; passos em ordem com compensação, orquestração com Step Functions.',
      ],
    },
    {
      id: 'rv:arq.f08.m2.a2',
      kind: 'decision',
      title: 'O desvio que pode cair',
      prompt:
        'Uma seguradora vai substituir um monólito aos poucos: uma camada na frente dele passará a mandar cada função já reescrita para o serviço novo. **Todo o tráfego** vai passar por essa camada durante meses. O requisito é que ela **não vire um novo ponto único de falha**. Onde a camada deve rodar?',
      concepts: [{ id: 'pat.strangler-fig' }],
      xp: 5,
      difficulty: 2,
      domain: 'd2',
      options: [
        { id: 'a', text: 'Numa instância EC2 grande, com um proxy configurado.', correct: false, consequence: 'Se ela cair, caem o monólito e os serviços novos juntos.' },
        { id: 'b', text: 'Dentro do próprio monólito, desviando por código.', correct: false, consequence: 'O desvio cai junto com o monólito que se quer substituir.' },
        { id: 'c', text: 'No Amazon API Gateway, gerenciado e Multi-AZ.', correct: true, consequence: 'O desvio não vira ponto único de falha e não exige servidores.' },
        { id: 'd', text: 'Em duas instâncias EC2 na mesma AZ, com DNS simples.', correct: false, consequence: 'A queda da AZ leva as duas, e o DNS simples não verifica saúde.' },
      ],
      explanation: [
        'No **strangler fig**, uma **camada de proxy** fica na frente do monólito e, aos poucos, manda cada função reescrita para o serviço novo, até o monólito poder ser desligado. Essa camada recebe todo o tráfego e pode virar **ponto único de falha**; o **API Gateway**, serverless e Multi-AZ, reduz esse risco.',
        'Uma instância, duas na mesma AZ ou o desvio dentro do monólito concentram o risco no lugar errado.',
        '**Regra prática:** modernizar um monólito aos poucos é strangler fig, com o proxy num serviço gerenciado e redundante.',
      ],
    },
    {
      id: 'rv:arq.f08.dependencia-entre-regioes',
      kind: 'decision',
      title: 'O login que não sobe no desastre',
      prompt:
        'Uma fintech roda ativo-passivo em duas Regiões. No teste de desastre, a aplicação subiu na **Região secundária**, mas ninguém conseguiu fazer login: o **serviço de autenticação só existe na Região principal**, que estava fora. Qual mudança segue a boa prática de arquiteturas em várias Regiões?',
      concepts: [{ id: 'pat.multi-region' }],
      xp: 5,
      difficulty: 3,
      domain: 'd2',
      options: [
        { id: 'a', text: 'Implantar a autenticação também na outra Região.', correct: true, consequence: 'Cada Região funciona sozinha, sem depender da outra.' },
        { id: 'b', text: 'Aumentar o tempo limite das chamadas de login entre Regiões.', correct: false, consequence: 'Com a Região principal fora, nenhum tempo limite resolve.' },
        { id: 'c', text: 'Pôr o serviço de autenticação em mais AZs da Região principal.', correct: false, consequence: 'Protege da falha de AZ, não da perda da Região.' },
        { id: 'd', text: 'Usar o roteamento por latência do Route 53 para o login.', correct: false, consequence: 'Só existe um destino, e ele está na Região que caiu.' },
      ],
      explanation: [
        'Em **várias Regiões**, cada Região precisa **funcionar sozinha**, com a própria infraestrutura e os dados replicados. **Dependências entre Regiões**, em que uma depende de um componente que só existe na outra, aumentam o risco de falha, e são exatamente o que derrubou o login.',
        'Tempo limite, mais AZs e roteamento não criam o componente que falta na secundária.',
        '**Regra prática:** cada Região é autossuficiente; toda dependência crítica precisa existir nas duas.',
      ],
    },
    {
      id: 'rv:arq.f08.m2.a4',
      kind: 'decision',
      title: 'Leitura perto, gravação num lugar',
      prompt:
        'Um portal de cursos atende alunos na **América do Sul e na Europa** e usa um banco **relacional** com transações. As **leituras precisam ser locais** nos dois continentes, e as gravações, menos de 5% do tráfego, podem ir para **uma Região só**. Qual solução de dados atende?',
      concepts: [{ id: 'pat.multi-region' }],
      xp: 5,
      difficulty: 2,
      domain: 'd3',
      options: [
        { id: 'a', text: 'Aurora Global Database, com a secundária na Europa.', correct: true, consequence: 'Leituras locais nas duas Regiões e gravação numa só (write global).' },
        { id: 'b', text: 'Tabelas globais do DynamoDB nas duas Regiões.', correct: false, consequence: 'Exige trocar o banco relacional e as transações por chave-valor.' },
        { id: 'c', text: 'Um RDS Multi-AZ na América do Sul para as duas Regiões.', correct: false, consequence: 'As leituras da Europa atravessam o oceano.' },
        { id: 'd', text: 'Dois bancos independentes, um em cada Região.', correct: false, consequence: 'Os dados divergem sem replicação entre eles.' },
      ],
      explanation: [
        'Em várias Regiões, as leituras costumam ser **locais**, e para as gravações escolhe-se **write global** (uma Região grava), **write local** (cada Região grava) ou por partição. Com banco relacional e poucas gravações, o **Aurora Global Database** atende ao write global, com Regiões secundárias de leitura.',
        'As tabelas globais do DynamoDB são para write local num banco chave-valor. Um banco só numa Região não dá leituras locais, e bancos independentes divergem.',
        '**Regra prática:** relacional com leitura global e gravação central é Aurora Global Database; gravação em cada Região é tabelas globais do DynamoDB.',
      ],
    },
    {
      id: 'rv:arq.f08.m3.a1',
      kind: 'decision',
      title: 'Servidores iguais que se comportam diferente',
      prompt:
        'Dois servidores "iguais" de uma API se comportam diferente, porque cada um recebeu **correções à mão por SSH** ao longo de meses, e ninguém registrou quais. A equipe quer acabar com essas diferenças e **poder voltar rápido** se uma mudança der errado. Qual prática resolve a causa?',
      concepts: [{ id: 'pat.immutable' }],
      xp: 5,
      difficulty: 2,
      domain: 'd2',
      options: [
        { id: 'a', text: 'Uma planilha com as correções feitas em cada servidor.', correct: false, consequence: 'Documenta a diferença entre os servidores, mas não a evita.' },
        { id: 'b', text: 'Mais pessoas com acesso SSH para corrigir mais rápido.', correct: false, consequence: 'Aumenta as diferenças entre os servidores e o risco de erro.' },
        { id: 'c', text: 'Um script que repete as correções em todos os servidores.', correct: false, consequence: 'Continua mudando servidores no lugar, com risco de divergir.' },
        { id: 'd', text: 'Infraestrutura imutável, com recursos novos.', correct: true, consequence: 'Todos nascem iguais de uma imagem versionada, e o antigo fica para voltar.' },
      ],
      explanation: [
        'Na **infraestrutura imutável** (REL08-BP04), **nada é atualizado no lugar** em produção: para mudar, um conjunto novo de recursos é implantado ao lado, a partir de uma imagem versionada, validado e colocado no tráfego. Os benefícios citados são menos desvio de configuração, implantações atômicas, **volta rápida** e acesso remoto, como o SSH, desligado.',
        'Planilhas, mais acesso e scripts continuam mudando servidores no lugar.',
        '**Regra prática:** servidores que divergem com o tempo pedem infraestrutura imutável: troque, não conserte.',
      ],
    },
    {
      id: 'rv:arq.f08.m3.a4',
      kind: 'decision',
      title: 'Liberar sem segundo ambiente',
      prompt:
        'Uma aplicação interna roda em **dez instâncias**. A liberação de uma versão **não pode tirar o sistema do ar**, mas o orçamento **não comporta um segundo ambiente** e os usuários aceitam **capacidade reduzida** por alguns minutos. Qual estratégia de implantação atende?',
      concepts: [{ id: 'pat.in-place' }],
      xp: 5,
      difficulty: 2,
      domain: 'd2',
      options: [
        { id: 'a', text: 'De uma vez (all at once), em todas as instâncias.', correct: false, consequence: 'Todas ficam fora ao mesmo tempo durante a troca.' },
        { id: 'b', text: 'Blue/green, com um ambiente idêntico ao lado.', correct: false, consequence: 'Exige o segundo ambiente que o orçamento não comporta.' },
        { id: 'c', text: 'Em ondas (rolling), trocando um lote por vez.', correct: true, consequence: 'O sistema segue no ar com menos capacidade, sem segundo ambiente.' },
        { id: 'd', text: 'Recriar as dez instâncias do zero numa janela de parada.', correct: false, consequence: 'O sistema fica fora do ar durante toda a janela de parada.' },
      ],
      explanation: [
        'Na **implantação no lugar**, a versão nova é instalada nos mesmos recursos. **De uma vez**, tudo para junto. **Em ondas (rolling)**, os recursos são trocados aos poucos: o sistema continua no ar com capacidade reduzida, sem pagar outro ambiente, mas sem isolamento entre versões, o que complica a volta.',
        'All at once para tudo. Blue/green exige o segundo ambiente. Uma janela de parada contraria o requisito.',
        '**Regra prática:** sem parar e sem segundo ambiente é rolling; com volta instantânea e orçamento para dois ambientes é blue/green.',
      ],
    },
    {
      id: 'rv:arq.f08.m3.a2:i3',
      kind: 'decision',
      title: 'Voltar em segundos',
      prompt:
        'Uma empresa faz implantações **blue/green**: o ambiente azul tem a versão atual e o verde, a nova. Dez minutos depois de mandar o tráfego para o verde, aparece um erro grave nos pagamentos. A diretoria quer voltar à versão anterior **em segundos**. Qual ação atende?',
      concepts: [{ id: 'pat.blue-green' }],
      xp: 5,
      difficulty: 2,
      domain: 'd2',
      options: [
        { id: 'a', text: 'Reinstalar a versão anterior nas instâncias do verde.', correct: false, consequence: 'Leva minutos e repete uma implantação sob pressão.' },
        { id: 'b', text: 'Restaurar os snapshots das instâncias de antes da troca.', correct: false, consequence: 'É lento e recria recursos que o azul já tem prontos.' },
        { id: 'c', text: 'Corrigir o erro no verde e liberar uma nova versão.', correct: false, consequence: 'Os clientes continuam com o erro até a correção ficar pronta.' },
        { id: 'd', text: 'Devolver o tráfego ao azul, que ficou intacto.', correct: true, consequence: 'A versão anterior volta a atender na hora.' },
      ],
      explanation: [
        'No **blue/green**, dois ambientes idênticos convivem: o verde é testado e recebe o tráfego, e o **azul fica intacto**. Se algo der errado, o tráfego **volta para o azul**, pelo balanceador ou pelo Route 53, em segundos.',
        'Reinstalar, restaurar snapshots ou corrigir às pressas são mais lentos e deixam os clientes com o erro.',
        '**Regra prática:** "voltar rápido para a versão anterior" é a razão de existir do blue/green; o ambiente antigo só sai depois que o novo se prova.',
      ],
    },
    {
      id: 'rv:arq.f08.m3.a3',
      kind: 'decision',
      title: 'Dez por cento para o ambiente novo',
      prompt:
        'A busca nova de um site roda num **ambiente verde** paralelo ao azul, cada um atrás do próprio balanceador. A empresa quer mandar **10% do tráfego** para o verde, observar e ir aumentando, usando o **Route 53**. Qual configuração atende?',
      concepts: [{ id: 'pat.blue-green' }, { id: 'pat.canary-linear' }],
      xp: 5,
      difficulty: 2,
      domain: 'd2',
      options: [
        { id: 'a', text: 'Roteamento por latência entre os dois balanceadores.', correct: false, consequence: 'Escolhe pela proximidade, não por uma fração do tráfego.' },
        { id: 'b', text: 'Roteamento de failover, com o verde como secundário.', correct: false, consequence: 'Só manda tráfego ao verde quando o azul fica sem saúde.' },
        { id: 'c', text: 'Roteamento ponderado, com pesos 90 e 10.', correct: true, consequence: 'Um em cada dez pedidos vai para o verde, e os pesos mudam aos poucos.' },
        { id: 'd', text: 'Roteamento simples, com os dois endereços no registro.', correct: false, consequence: 'Não controla a fração nem verifica a saúde dos destinos.' },
      ],
      explanation: [
        'No blue/green, o tráfego pode mudar **de uma vez ou em frações**. Com o **roteamento ponderado** do Route 53, os pesos 90 e 10 mandam 10% ao verde; observado o comportamento, os pesos sobem até a troca completa. Começar com uma parte pequena é a ideia do **canário**.',
        'Latência e failover escolhem por outros critérios. O roteamento simples não controla a fração.',
        '**Regra prática:** mudar o tráfego entre ambientes em frações pelo DNS é roteamento ponderado do Route 53.',
      ],
    },
    {
      id: 'rv:arq.f08.m3.a2:i5',
      kind: 'decision',
      title: 'Dez por cento a cada minuto',
      prompt:
        'A equipe de uma API quer liberar a versão nova mandando **10% do tráfego a cada minuto**, sempre na mesma proporção e com o mesmo intervalo, até chegar a 100%, com volta automática se um alarme disparar. Qual estratégia de implantação é essa?',
      concepts: [{ id: 'pat.canary-linear' }],
      xp: 5,
      difficulty: 1,
      domain: 'd2',
      options: [
        { id: 'a', text: 'Canário, com uma fatia pequena e depois o restante.', correct: false, consequence: 'O canário manda uma parte e depois o resto de uma vez, não parcelas iguais.' },
        { id: 'b', text: 'Linear, em parcelas iguais e intervalos iguais.', correct: true, consequence: 'O tráfego muda 10% por minuto até completar a troca.' },
        { id: 'c', text: 'De uma vez (all at once), em todas as instâncias.', correct: false, consequence: 'Todo o tráfego muda junto, sem fases nem volta automática.' },
        { id: 'd', text: 'Em ondas (rolling), trocando as instâncias no lugar.', correct: false, consequence: 'Troca instâncias por lotes, sem controlar a fração do tráfego.' },
      ],
      explanation: [
        'No **canário**, uma parte pequena dos usuários vai para a versão nova, observada de perto, e depois o restante segue. No **linear**, o tráfego muda em **parcelas iguais**, com o **mesmo intervalo** entre elas. Os dois limitam quantos usuários um erro alcança.',
        'All at once muda tudo junto. Rolling troca instâncias no lugar, sem controlar a fração do tráfego.',
        '**Regra prática:** uma fatia e depois o resto é canário; parcelas iguais em intervalos iguais é linear.',
      ],
    },
  ],
}
