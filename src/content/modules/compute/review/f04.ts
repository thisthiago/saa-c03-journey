/**
 * Questões da Revisão da Fase 4 de Computação (opções de compra), no formato
 * do exame SAA-C03. Fatos conferidos em 20/10/2026 (ver
 * docs/VERIFICACAO-DE-CONTEUDO.md). Descontos citados nos enunciados são
 * premissas do cenário. As empresas são fictícias.
 */
import type { ReviewSet } from '../../../../engine/types'

export const REVIEW_F04: ReviewSet = {
  phaseId: 'cmp.f04',
  questions: [
    {
      id: 'rv:cmp.f04.produto-novo',
      kind: 'decision',
      title: 'Aplicativo que pode não emplacar',
      prompt:
        'Uma empresa vai lançar um aplicativo novo no mês que vem. Ninguém sabe quanto tráfego virá, o produto **pode ser descontinuado em três meses** se não emplacar, e as instâncias atendem clientes, então **não podem ser interrompidas**. Qual opção de compra atende com o menor risco de custo?',
      concepts: [{ id: 'ec2.on-demand' }],
      xp: 5,
      difficulty: 1,
      domain: 'd4',
      options: [
        { id: 'a', text: 'Um EC2 Instance Savings Plan de 3 anos, pelo maior desconto.', correct: false, consequence: 'O compromisso continua cobrado por 3 anos mesmo que o produto seja descontinuado em três meses.' },
        { id: 'b', text: 'Instâncias Spot, pelo maior desconto.', correct: false, consequence: 'A AWS pode interromper instâncias Spot, e as instâncias deste aplicativo atendem clientes.' },
        { id: 'c', text: 'Instâncias On-Demand, até haver histórico de uso.', correct: true, consequence: 'Sem compromisso e sem interrupção: paga só o que rodar e pode parar a qualquer momento.' },
        { id: 'd', text: 'Reserved Instances Standard de 1 ano para a capacidade estimada.', correct: false, consequence: 'A estimativa não tem base, e a RI é cobrada o ano todo, sem cancelamento.' },
      ],
      explanation: [
        '**On-Demand** é pago por segundo, sem compromisso. É a escolha para cargas **novas, imprevisíveis ou sem histórico** que não toleram interrupção: se o produto crescer, a empresa ganha dados para decidir um compromisso depois; se for descontinuado, basta desligar.',
        'Savings Plans e Reserved Instances são cobrados durante todo o prazo, mesmo sem uso, e não podem ser cancelados. O Spot tem o maior desconto, mas pode ser interrompido.',
        '**Regra prática:** sem histórico ou com futuro incerto, On-Demand. Compromisso só depois que a base de uso estiver clara; Spot só para o que aguenta interrupção.',
      ],
    },
    {
      id: 'rv:cmp.f04.m1.a3',
      kind: 'decision',
      title: 'Compromisso para o horário comercial',
      prompt:
        'Uma gráfica tem **6 instâncias** que atendem clientes e só ficam ligadas **9 horas por dia**, no horário comercial. O diretor quer comprar um Savings Plan para elas; o plano disponível daria **40% de desconto** sobre o On-Demand, com o compromisso cobrado as 24 horas do dia. Qual opção sai **mais barata**?',
      concepts: [{ id: 'ec2.commitment-coverage' }, { id: 'ec2.on-demand' }],
      xp: 5,
      difficulty: 2,
      domain: 'd4',
      options: [
        { id: 'a', text: 'Um Savings Plan que cubra as 6 instâncias.', correct: false, consequence: 'O compromisso vale 60% do On-Demand por 24 horas, o equivalente a 14,4 horas de On-Demand para usar só 9.' },
        { id: 'b', text: 'Um Savings Plan que cubra 3 instâncias e o resto em On-Demand.', correct: false, consequence: 'Reduz o prejuízo pela metade, mas as 3 cobertas continuam pagando 24 horas para rodar 9.' },
        { id: 'c', text: 'Instâncias Spot para as 6, com On-Demand de reserva.', correct: false, consequence: 'As instâncias atendem clientes e podem ser interrompidas a qualquer momento no Spot.' },
        { id: 'd', text: 'Manter as 6 instâncias em On-Demand.', correct: true, consequence: 'Paga só as 9 horas de uso, menos do que o compromisso cobrado o dia inteiro.' },
      ],
      explanation: [
        'O compromisso de um Savings Plan é cobrado **todas as horas** do prazo. Com 40% de desconto, cada instância coberta paga 60% do On-Demand por 24 horas: o equivalente a 14,4 horas de On-Demand. Usando só 9 horas por dia, o **On-Demand** sai mais barato.',
        'Cobrir metade das instâncias só diminui a perda. O Spot reduziria o custo, mas não serve para instâncias que atendem clientes e não podem parar.',
        '**Regra prática:** compromisso compensa na base que roda 24 horas. Para uma carga que roda parte do dia, compare as horas de uso com o desconto: abaixo do ponto de equilíbrio, On-Demand.',
      ],
    },
    {
      id: 'rv:cmp.f04.cobertura-do-plano',
      kind: 'decision',
      title: 'Mudanças na frota e o desconto do plano',
      prompt:
        'Uma empresa tem um **EC2 Instance Savings Plan para a família m7g em us-east-1**. No ano que vem, ela planeja cinco mudanças no uso. Quais usos **continuam com desconto** desse plano? (Escolha DUAS.)',
      concepts: [{ id: 'ec2.savings-plans' }],
      xp: 5,
      difficulty: 2,
      domain: 'd4',
      multiple: true,
      options: [
        { id: 'a', text: 'Instâncias m7g.2xlarge em us-east-1, no lugar das m7g.large.', correct: true, consequence: 'O EC2 Instance SP vale para qualquer tamanho da família na Região.' },
        { id: 'b', text: 'Instâncias c7g.large em us-east-1, no lugar das m7g.large.', correct: false, consequence: 'Outra família: só um Compute Savings Plan acompanharia essa troca.' },
        { id: 'c', text: 'Instâncias m7g.large em sa-east-1, numa expansão para o Brasil.', correct: false, consequence: 'Outra Região: o EC2 Instance SP fica preso à Região comprada.' },
        { id: 'd', text: 'Instâncias m7g.large com Windows em us-east-1.', correct: true, consequence: 'Dentro da família e da Região, o plano vale para qualquer sistema operacional e tenancy.' },
        { id: 'e', text: 'Instâncias Spot m7g.large em us-east-1, para lotes noturnos.', correct: false, consequence: 'Savings Plans não se aplicam ao Spot, que já tem o próprio desconto.' },
      ],
      explanation: [
        'O **EC2 Instance Savings Plan** dá o maior desconto entre os Savings Plans (até 72%), em troca de ficar preso a **uma família numa Região**. Dentro delas, vale para qualquer tamanho, sistema operacional e tenancy. Por isso, m7g.2xlarge e m7g com Windows em us-east-1 continuam cobertos.',
        'Trocar de família ou de Região sai da cobertura; só o Compute Savings Plan, com desconto menor (até 66%), acompanha essas mudanças, além do Fargate e do Lambda. E nenhum Savings Plan se aplica ao Spot.',
        '**Regra prática:** família e Região fixas com o maior desconto, EC2 Instance SP; flexibilidade para mudar de família, de Região ou para Fargate e Lambda, Compute SP.',
      ],
    },
    {
      id: 'rv:cmp.f04.capacidade-na-recuperacao',
      kind: 'decision',
      title: 'Capacidade garantida para a recuperação',
      prompt:
        'Uma empresa já tem um Compute Savings Plan que cobre o uso das suas instâncias. O plano de recuperação de desastres exige **ter capacidade garantida** para 8 instâncias m7g.xlarge numa zona específica, a qualquer momento, **com desconto** e **sem assumir um novo compromisso de prazo**. Qual solução atende?',
      concepts: [{ id: 'ec2.capacity-reservations' }, { id: 'ec2.savings-plans' }],
      xp: 5,
      difficulty: 3,
      domain: 'd2',
      options: [
        { id: 'a', text: 'Contar com o Compute Savings Plan atual, que já cobre essas instâncias.', correct: false, consequence: 'Savings Plans dão desconto, mas não reservam capacidade: na hora da recuperação, pode faltar instância na zona.' },
        { id: 'b', text: 'Comprar Reserved Instances zonais de 1 ano para as 8 instâncias.', correct: false, consequence: 'Reservam capacidade com desconto, mas criam um novo compromisso de 1 ano.' },
        { id: 'c', text: 'Uma Capacity Reservation na zona, coberta pelo Savings Plan atual.', correct: true, consequence: 'A reserva garante a capacidade sem prazo de compromisso, e o Savings Plan aplica o desconto sobre ela.' },
        { id: 'd', text: 'Comprar Reserved Instances regionais de 1 ano para as 8 instâncias.', correct: false, consequence: 'RIs regionais não reservam capacidade, e ainda criam um compromisso de 1 ano.' },
      ],
      explanation: [
        'A **Capacity Reservation** garante capacidade de um tipo numa zona, pelo tempo que for preciso, **sem compromisso de prazo**. Ela é cobrada no preço On-Demand, usada ou não; o desconto vem de combiná-la com um **Savings Plan** ou uma RI regional. Como a empresa já tem um Compute Savings Plan, ele cobre o uso reservado.',
        'O Savings Plan sozinho não reserva nada. A RI zonal reserva capacidade, mas com 1 ou 3 anos de compromisso. A RI regional nem reserva capacidade.',
        '**Regra prática:** desconto e capacidade são coisas separadas. Savings Plans e RIs regionais dão desconto; a Capacity Reservation garante capacidade. Para ter os dois sem novo prazo, combine a reserva com o plano que já existe.',
      ],
    },
    {
      id: 'rv:cmp.f04.m1.a4',
      kind: 'decision',
      title: 'Duas propostas para a base de 24 horas',
      prompt:
        'Para as instâncias m7g.large que rodam 24 horas por dia, um diretor está em dúvida entre uma **Reserved Instance Standard regional** e um **EC2 Instance Savings Plan** para a família m7g, com o mesmo prazo e o **mesmo preço por hora**. A equipe pode trocar o tamanho das instâncias no próximo ano. O que recomendar?',
      concepts: [{ id: 'ec2.reserved-instances' }, { id: 'ec2.savings-plans' }],
      xp: 5,
      difficulty: 2,
      domain: 'd4',
      options: [
        { id: 'a', text: 'A RI Standard, porque ela reserva capacidade e o plano não.', correct: false, consequence: 'Só a RI zonal reserva capacidade; a regional, como a do caso, não reserva.' },
        { id: 'b', text: 'Uma RI Convertible, que dá ainda mais desconto que as duas.', correct: false, consequence: 'A Convertible troca desconto por flexibilidade: dá menos desconto que a Standard.' },
        { id: 'c', text: 'O EC2 Instance Savings Plan, com o mesmo preço e mais flexibilidade.', correct: true, consequence: 'Se o tamanho mudar dentro da família, ou o sistema operacional e a tenancy, o desconto continua.' },
        { id: 'd', text: 'A RI Standard, porque ela pode ser cancelada se o tamanho mudar.', correct: false, consequence: 'Reserved Instances não podem ser canceladas; a Standard só pode ser modificada.' },
      ],
      explanation: [
        'Com o mesmo preço, o **EC2 Instance Savings Plan** vence pela flexibilidade: vale para qualquer tamanho, sistema operacional e tenancy da família na Região. A própria AWS recomenda Savings Plans no lugar de Reserved Instances.',
        'A RI regional não reserva capacidade; só a zonal faz isso. A Convertible permite trocar de família, mas com desconto menor. E nenhuma Reserved Instance pode ser cancelada.',
        '**Regra prática:** questões ainda citam Reserved Instances. Standard dá mais desconto e só pode ser modificada; Convertible pode ser trocada; só a zonal reserva capacidade. Para desconto parecido com mais flexibilidade, Savings Plan.',
      ],
    },
    {
      id: 'rv:cmp.f04.ri-sobrando',
      kind: 'decision',
      title: 'RIs pagas para instâncias que não existem mais',
      prompt:
        'Uma empresa migrou sua frota para outra família de instâncias, mas ainda tem **Reserved Instances Standard** com **18 meses de prazo** pela frente, para o tipo antigo. Nenhuma instância usa essas RIs, e elas continuam na fatura. Qual ação **reduz a perda**?',
      concepts: [{ id: 'ec2.reserved-instances' }],
      xp: 5,
      difficulty: 2,
      domain: 'd4',
      options: [
        { id: 'a', text: 'Cancelar as RIs pelo console e pagar só os meses usados.', correct: false, consequence: 'Reserved Instances não podem ser canceladas.' },
        { id: 'b', text: 'Trocar as RIs Standard por RIs da família nova.', correct: false, consequence: 'Troca de família é recurso da RI Convertible; a Standard só aceita modificações.' },
        { id: 'c', text: 'Encerrar as instâncias antigas que restaram, para a cobrança das RIs parar.', correct: false, consequence: 'A RI é cobrada durante todo o prazo, haja ou não instância usando o desconto.' },
        { id: 'd', text: 'Vender as RIs no Reserved Instance Marketplace.', correct: true, consequence: 'Outro cliente compra o prazo restante, e a empresa deixa de pagar pelo que não usa.' },
      ],
      explanation: [
        'A Reserved Instance é um **desconto de cobrança** cobrado durante todo o prazo, usado ou não, e **não pode ser cancelada**. Quando as instâncias deixam de existir, o caminho para reduzir a perda é **vender** as RIs que sobraram no **Reserved Instance Marketplace**, onde outros clientes compram prazos menores.',
        'A Standard não troca de família; essa flexibilidade é da Convertible. E encerrar instâncias não interrompe a cobrança da RI.',
        '**Regra prática:** RI que sobrou não se cancela, se vende no Marketplace. Antes de comprar, lembre que a Standard fica presa ao tipo; para frotas que podem mudar, Savings Plans são mais seguros.',
      ],
    },
    {
      id: 'rv:cmp.f04.duas-cargas-reservadas',
      kind: 'decision',
      title: 'Duas cargas, dois escopos de reserva',
      prompt:
        'Uma empresa vai comprar Reserved Instances para duas cargas Linux. A **carga A** precisa de **capacidade garantida** na zona us-east-1a, onde fica um equipamento parceiro. A **carga B** muda de tamanho dentro da família e de zona com frequência, e só precisa de **desconto**. Qual combinação atende?',
      concepts: [{ id: 'ec2.ri-scope' }],
      xp: 5,
      difficulty: 2,
      domain: 'd2',
      options: [
        { id: 'a', text: 'RI regional para a carga A e RI zonal para a B.', correct: false, consequence: 'Inverte os escopos: a regional não reserva capacidade, e a zonal prende a carga B a uma zona e a um tamanho.' },
        { id: 'b', text: 'RI zonal para as duas cargas, na zona de cada uma.', correct: false, consequence: 'Atende a carga A, mas a carga B perde o desconto quando muda de zona ou de tamanho.' },
        { id: 'c', text: 'RI zonal para a A e RI regional para a B.', correct: true, consequence: 'A zonal reserva capacidade na us-east-1a; a regional acompanha a carga B em qualquer zona e tamanho da família.' },
        { id: 'd', text: 'RI regional para as duas cargas, em toda a Região.', correct: false, consequence: 'Atende a carga B, mas a carga A fica sem capacidade garantida.' },
      ],
      explanation: [
        'A **RI zonal** vale numa zona e num tamanho e, em troca, **reserva capacidade** ali: é o que a carga A precisa. A **RI regional** vale em qualquer zona da Região e, em Linux com tenancy padrão, em qualquer tamanho da família, mas não reserva capacidade: é o que basta para a carga B. O preço das duas é o mesmo.',
        'Inverter os escopos falha nas duas cargas. Usar um escopo só atende uma carga e deixa a outra sem o que precisa.',
        '**Regra prática:** capacidade garantida numa zona, RI zonal (ou Capacity Reservation); desconto com flexibilidade de zona e de tamanho, RI regional.',
      ],
    },
    {
      id: 'rv:cmp.f04.m2.a1',
      kind: 'decision',
      title: 'Onde o Spot cabe na frota',
      prompt:
        'Uma gráfica quer **reduzir custo** levando para instâncias Spot as cargas que aguentam ser interrompidas. Ela listou cinco cargas. Quais podem ir para Spot **sem quebrar requisitos**? (Escolha DUAS.)',
      concepts: [{ id: 'ec2.spot' }],
      xp: 5,
      difficulty: 1,
      domain: 'd4',
      multiple: true,
      options: [
        { id: 'a', text: 'O único servidor do banco de pedidos da loja online.', correct: false, consequence: 'Uma interrupção derruba a loja e pode corromper dados em uso.' },
        { id: 'b', text: 'A execução dos testes automatizados a cada commit.', correct: true, consequence: 'Se uma instância for interrompida, o teste simplesmente roda de novo.' },
        { id: 'c', text: 'O servidor que confirma pagamentos, sem réplica.', correct: false, consequence: 'Interromper no meio de um pagamento, sem outra instância para assumir, é inaceitável.' },
        { id: 'd', text: 'A geração de miniaturas a partir de uma fila de trabalhos.', correct: true, consequence: 'O trabalho interrompido volta para a fila, e outra instância o faz.' },
        { id: 'e', text: 'O servidor de licenças que todos os computadores da gráfica consultam.', correct: false, consequence: 'Sem ele, ninguém trabalha: é um ponto único que não pode sumir com 2 minutos de aviso.' },
      ],
      explanation: [
        'O **Spot** usa capacidade sobrando do EC2 com até 90% de desconto, e a AWS pode interrompê-lo quando precisar da capacidade. Ele serve a cargas **flexíveis e tolerantes a falhas**: testes que podem rodar de novo e trabalhos de fila que voltam para outra instância.',
        'Banco de dados único, confirmação de pagamentos sem réplica e servidor de licenças são pontos únicos que não podem parar. Neles, o Spot é distrator.',
        '**Regra prática:** "processamento em lote", "tolerante a falhas", "pode ser interrompido" e "menor custo" apontam para Spot. Se a carga não pode parar, ele está fora.',
      ],
    },
    {
      id: 'rv:ec2.spot-interruption.notice',
      kind: 'decision',
      title: 'Trabalho perdido nas interrupções',
      prompt:
        'Workers em instâncias Spot (com o comportamento de encerramento padrão) convertem trechos de vídeo de uma fila. Quando uma instância é interrompida, o trecho em andamento é perdido e só volta para a fila depois de um longo tempo limite. A equipe quer **salvar o progresso e devolver o trabalho** antes do encerramento. Qual solução atende?',
      concepts: [{ id: 'ec2.spot-interruption' }],
      xp: 5,
      difficulty: 2,
      domain: 'd2',
      options: [
        { id: 'a', text: 'Definir um preço máximo alto no pedido, para a instância nunca ser interrompida.', correct: false, consequence: 'O preço é só um dos motivos de interrupção; a AWS também interrompe quando precisa da capacidade.' },
        { id: 'b', text: 'Reagir ao aviso de 2 minutos, pelo EventBridge ou pelos metadados.', correct: true, consequence: 'O worker recebe o aviso, salva o progresso e devolve o trecho à fila antes do encerramento.' },
        { id: 'c', text: 'Mudar o comportamento de interrupção para hibernar, para ganhar mais tempo.', correct: false, consequence: 'Com hibernação, não há os 2 minutos: ela começa logo.' },
        { id: 'd', text: 'Criar um alarme de CPU no CloudWatch que dispare quando a instância começar a parar.', correct: false, consequence: 'A CPU não sinaliza a interrupção, e o alarme chegaria tarde demais.' },
      ],
      explanation: [
        'Antes de interromper uma instância Spot, a AWS emite um **aviso de 2 minutos**, como evento no **EventBridge** e no item **spot/instance-action** dos metadados da instância. É a janela para o worker salvar o progresso e devolver o trecho à fila. Antes ainda, a AWS pode emitir uma recomendação de rebalanceamento quando o risco de interrupção sobe.',
        'Um preço máximo não impede interrupções por falta de capacidade, e definir um preço máximo até aumenta a frequência delas. A hibernação começa sem os 2 minutos. E um alarme de CPU não tem relação com a interrupção.',
        '**Regra prática:** tratar a interrupção do Spot de forma controlada é reagir ao aviso de 2 minutos, pelo EventBridge ou pelos metadados, salvando o progresso e drenando o trabalho.',
      ],
    },
    {
      id: 'rv:cmp.f04.preco-maximo',
      kind: 'decision',
      title: 'Preço máximo baixo e interrupções frequentes',
      prompt:
        'Para garantir economia, uma equipe definiu nos pedidos Spot um **preço máximo bem abaixo** do On-Demand. Desde então, as instâncias de processamento de lotes são interrompidas **com muito mais frequência** que as de outra equipe, que usa o mesmo tipo de instância na mesma zona. A equipe quer **menos interrupções** sem perder o desconto do Spot. Qual mudança atende?',
      concepts: [{ id: 'ec2.spot' }],
      xp: 5,
      difficulty: 3,
      domain: 'd4',
      options: [
        { id: 'a', text: 'Remover o preço máximo dos pedidos e pagar o preço Spot vigente.', correct: true, consequence: 'Sem um teto abaixo do mercado, a instância deixa de ser interrompida por preço e continua pagando o preço Spot.' },
        { id: 'b', text: 'Baixar ainda mais o preço máximo, para compensar as interrupções com economia.', correct: false, consequence: 'Um teto mais baixo é ultrapassado com mais frequência, e as interrupções aumentam.' },
        { id: 'c', text: 'Concentrar todos os pedidos num único tipo de instância e numa única zona.', correct: false, consequence: 'Um pool só aumenta o risco: quando ele aperta, todas as instâncias são interrompidas juntas.' },
        { id: 'd', text: 'Trocar os pedidos Spot por um Savings Plan que cubra o Spot.', correct: false, consequence: 'Savings Plans não se aplicam ao Spot, que já tem o próprio desconto.' },
      ],
      explanation: [
        'Um dos motivos de interrupção do Spot é o **preço passar do máximo definido**. Um teto bem abaixo do mercado é ultrapassado com frequência, e a AWS documenta que definir um preço máximo faz as instâncias serem interrompidas mais vezes. Sem preço máximo, a instância paga o **preço Spot vigente**, que muda aos poucos com a oferta e a procura, e mantém o desconto.',
        'Baixar o teto piora o problema. Concentrar num pool só aumenta o risco de interrupções simultâneas. E Savings Plans não cobrem o Spot.',
        '**Regra prática:** no Spot, não tente economizar com preço máximo; isso só aumenta as interrupções. Reduza o risco com vários tipos e zonas e trate o aviso de 2 minutos.',
      ],
    },
    {
      id: 'rv:cmp.f04.hardware-exclusivo',
      kind: 'decision',
      title: 'Hardware exclusivo sem licenças',
      prompt:
        'Uma norma de um cliente do setor público exige que as instâncias de um sistema rodem em **hardware que não seja compartilhado com outros clientes da AWS**. O software não tem licença por socket nem por núcleo, e a empresa quer o **menor esforço de gestão**. Qual opção atende?',
      concepts: [{ id: 'ec2.dedicated' }],
      xp: 5,
      difficulty: 2,
      domain: 'd1',
      options: [
        { id: 'a', text: 'Dedicated Hosts, gerenciando a ocupação de cada servidor.', correct: false, consequence: 'Também isolam o hardware, mas exigem gerenciar os hosts; a visibilidade de sockets e núcleos só importa para licenças.' },
        { id: 'b', text: 'Instâncias comuns num placement group spread.', correct: false, consequence: 'Cada instância fica num hardware distinto, mas esse hardware continua compartilhado com outros clientes.' },
        { id: 'c', text: 'Dedicated Instances.', correct: true, consequence: 'Rodam em hardware só da empresa, cobradas por instância, sem gerenciar servidores físicos.' },
        { id: 'd', text: 'Uma Capacity Reservation para as instâncias.', correct: false, consequence: 'Garante capacidade numa zona, mas no mesmo hardware compartilhado de sempre.' },
      ],
      explanation: [
        'Dedicated Hosts e Dedicated Instances rodam em **servidores físicos só seus**, sem diferença de desempenho, segurança ou hardware entre eles. A diferença é a gestão: a **Dedicated Instance** é cobrada por instância e não mostra o servidor, enquanto o Dedicated Host é cobrado por host e mostra sockets e núcleos. Sem licenças por socket ou núcleo, a Dedicated Instance atende com menos trabalho.',
        'O Dedicated Host atende o isolamento, mas acrescenta a gestão dos hosts sem necessidade. O placement group spread e a Capacity Reservation não mudam o compartilhamento do hardware.',
        '**Regra prática:** licenças por socket ou núcleo (BYOL) e visibilidade do servidor, Dedicated Host; só hardware não compartilhado, Dedicated Instances. Lembre da taxa por Região enquanto houver Dedicated Instance rodando.',
      ],
    },
    {
      id: 'rv:cmp.f04.m3.a4',
      kind: 'decision',
      title: 'GPUs para um treino no mês que vem',
      prompt:
        'Uma equipe de dados vai **treinar um modelo de ML durante uma semana**, a partir do mês que vem, e precisa ter as **instâncias com GPU garantidas** nessa data. Depois do treino, não vai mais precisar delas. Qual opção foi feita para esse caso?',
      concepts: [{ id: 'ec2.capacity-reservations' }],
      xp: 5,
      difficulty: 1,
      domain: 'd2',
      options: [
        { id: 'a', text: 'Instâncias Spot com GPU, lançadas no dia do treino.', correct: false, consequence: 'Baratas, mas sem garantia de capacidade e sujeitas a interrupção no meio do treino.' },
        { id: 'b', text: 'Um EC2 Instance Savings Plan para a família de GPU.', correct: false, consequence: 'Dá desconto por 1 ou 3 anos, sem reservar capacidade nenhuma.' },
        { id: 'c', text: 'Instâncias On-Demand com GPU, lançadas no dia do treino.', correct: false, consequence: 'On-Demand não garante que haverá capacidade disponível na data.' },
        { id: 'd', text: 'Capacity Blocks for ML para a semana do treino.', correct: true, consequence: 'Reservam as instâncias com GPU por um período definido, a partir da data futura.' },
      ],
      explanation: [
        'Os **Capacity Blocks for ML** reservam instâncias com GPU **numa data futura**, por um período definido, para treinos, ajustes finos e experimentos curtos. Atendem exatamente a uma semana de treino marcada para o mês que vem.',
        'Spot e On-Demand não garantem capacidade na data, e o Spot ainda pode ser interrompido. O Savings Plan dá desconto, não capacidade, e prende a equipe por anos.',
        '**Regra prática:** capacidade garantida numa zona para uso imediato, Capacity Reservation; GPUs garantidas para ML numa data futura, Capacity Blocks for ML.',
      ],
    },
    {
      id: 'rv:cmp.f04.boss.a2',
      kind: 'decision',
      title: 'Quanto comprometer num Savings Plan',
      prompt:
        'Uma loja online roda **6 instâncias o tempo todo** e chega a **14 no horário comercial**, de segunda a sexta. A diretoria quer comprar um Savings Plan de 3 anos e sugeriu cobrir "a média, umas 10 instâncias". Qual tamanho de compromisso dá o **menor custo total**?',
      concepts: [{ id: 'ec2.commitment-coverage' }],
      xp: 5,
      difficulty: 2,
      domain: 'd4',
      options: [
        { id: 'a', text: 'O equivalente a 10 instâncias, a média do dia.', correct: false, consequence: 'Fora do horário comercial, o compromisso de 4 instâncias é pago sem uso.' },
        { id: 'b', text: 'O equivalente a 14 instâncias, para cobrir o pico.', correct: false, consequence: 'Paga 8 instâncias sem uso na maior parte do tempo, inclusive nos fins de semana.' },
        { id: 'c', text: 'Nenhum compromisso, tudo em On-Demand.', correct: false, consequence: 'As 6 instâncias que rodam o tempo todo pagariam o preço cheio sem motivo.' },
        { id: 'd', text: 'O equivalente às 6 instâncias da base.', correct: true, consequence: 'Todo o compromisso é usado o tempo todo, e o pico paga só as horas em que existe.' },
      ],
      explanation: [
        'O compromisso de um Savings Plan é cobrado **todas as horas**. Cobrindo as **6 instâncias da base**, ele é usado o tempo inteiro e dá desconto em todas as horas pagas. O pico, que existe só em parte das horas, fica em **On-Demand**, pagando só quando roda.',
        'Cobrindo a média ou o pico, parte do compromisso fica paga sem uso nas noites e nos fins de semana. Sem compromisso nenhum, a base paga o preço cheio.',
        '**Regra prática:** comprometa só a base que roda 24 horas por anos. Pico em On-Demand; o que tolera interrupção, no Spot.',
      ],
    },
  ],
}
