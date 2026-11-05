/**
 * Questões da Revisão da Fase 5 de Computação (Elastic Load Balancing), no
 * formato do exame SAA-C03. Fatos conferidos em 20/10/2026 (ver
 * docs/VERIFICACAO-DE-CONTEUDO.md). As empresas são fictícias.
 */
import type { ReviewSet } from '../../../../engine/types'

export const REVIEW_F05: ReviewSet = {
  phaseId: 'cmp.f05',
  questions: [
    {
      id: 'rv:cmp.f05.dois-dominios',
      kind: 'decision',
      title: 'Dois domínios e o HTTP antigo',
      prompt:
        'Uma editora quer servir **loja.exemplo.com** e **blog.exemplo.com** por um **único balanceador**, cada domínio num grupo de instâncias diferente, e quer que quem acessar por **HTTP seja levado para HTTPS**. Quais configurações atendem? (Escolha DUAS.)',
      concepts: [{ id: 'elb.alb' }, { id: 'elb.listener-rules' }],
      xp: 5,
      difficulty: 2,
      domain: 'd3',
      multiple: true,
      options: [
        { id: 'a', text: 'Um ALB com regras de host no listener HTTPS, uma para cada domínio e target group.', correct: true, consequence: 'O ALB lê o cabeçalho Host e encaminha cada domínio para o seu grupo de instâncias.' },
        { id: 'b', text: 'Um listener HTTP na porta 80 com uma ação de redirect para HTTPS.', correct: true, consequence: 'O próprio ALB responde com o redirecionamento, sem passar pelas instâncias.' },
        { id: 'c', text: 'Um NLB com um listener TCP para cada domínio.', correct: false, consequence: 'O NLB trabalha na camada 4 e não lê o domínio pedido na requisição HTTP.' },
        { id: 'd', text: 'Regras de caminho /loja/* e /blog/* no listener HTTPS.', correct: false, consequence: 'Os domínios são diferentes; uma regra de caminho não distingue loja.exemplo.com de blog.exemplo.com.' },
        { id: 'e', text: 'Uma função Lambda como alvo, que redireciona o HTTP para HTTPS.', correct: false, consequence: 'Funciona, mas é código para manter onde o ALB já tem uma ação de redirect pronta.' },
      ],
      explanation: [
        'O **ALB** é um balanceador de camada 7: ele lê a requisição HTTP e roteia por **host**, caminho, cabeçalho, método, query string ou IP de origem. Uma regra de host por domínio resolve o primeiro requisito. Para o segundo, a ação **redirect** num listener HTTP leva o cliente para HTTPS sem que a requisição chegue às instâncias.',
        'O NLB não enxerga o domínio da requisição HTTP. Regras de caminho servem quando o domínio é o mesmo. E uma função Lambda para redirecionar substitui por código uma ação que o listener já oferece.',
        '**Regra prática:** vários sites ou microsserviços atrás de um endereço, roteados por host ou caminho, é ALB. Redirecionar HTTP para HTTPS ou responder algo fixo também se faz nas regras do listener.',
      ],
    },
    {
      id: 'rv:cmp.f05.ip-do-cliente',
      kind: 'decision',
      title: 'Logs com o endereço errado',
      prompt:
        'Depois de colocar um Application Load Balancer na frente do site, a equipe percebeu que os logs da aplicação mostram **sempre os IPs do balanceador** como origem das requisições, e o antifraude precisa do **IP de cada cliente**. O site usa regras de caminho no ALB, que devem continuar. Qual mudança atende?',
      concepts: [{ id: 'elb.alb' }],
      xp: 5,
      difficulty: 1,
      domain: 'd3',
      options: [
        { id: 'a', text: 'Trocar o ALB por um NLB, que não troca o endereço de origem.', correct: false, consequence: 'O NLB não tem regras de caminho, que precisam continuar.' },
        { id: 'b', text: 'Ligar sticky sessions no target group.', correct: false, consequence: 'Sticky sessions mantêm o cliente no mesmo alvo, mas não mudam o endereço que a aplicação vê.' },
        { id: 'c', text: 'Dar IP público às instâncias, para os clientes chegarem direto nelas.', correct: false, consequence: 'Contorna o balanceador e as regras de caminho, e expõe as instâncias à internet.' },
        { id: 'd', text: 'Fazer a aplicação ler o cabeçalho X-Forwarded-For.', correct: true, consequence: 'O ALB acrescenta o IP do cliente nesse cabeçalho em cada requisição.' },
      ],
      explanation: [
        'O ALB recebe a conexão do cliente e abre outra até o alvo, então a aplicação vê o IP do balanceador como origem. Para não perder o cliente, o ALB acrescenta os cabeçalhos **X-Forwarded-For**, X-Forwarded-Proto e X-Forwarded-Port. Basta a aplicação, ou o log do servidor web, ler o X-Forwarded-For.',
        'O NLB resolveria a origem, mas perderia as regras de caminho. Sticky sessions tratam de outro problema. E IP público nas instâncias desmonta a arquitetura.',
        '**Regra prática:** atrás de um ALB, o IP do cliente está no X-Forwarded-For. Antes de trocar de balanceador, confira se a aplicação está lendo esse cabeçalho.',
      ],
    },
    {
      id: 'rv:cmp.f05.telemetria-udp',
      kind: 'decision',
      title: 'Posições de milhares de veículos por segundo',
      prompt:
        'Uma empresa de entregas recebe a posição de 40 mil veículos a cada segundo, enviada por **UDP**, e precisa distribuir esse tráfego entre servidores EC2 com a **menor latência possível**, escalando para milhões de pacotes por segundo. Qual balanceador atende?',
      concepts: [{ id: 'elb.nlb' }],
      xp: 5,
      difficulty: 1,
      domain: 'd3',
      options: [
        { id: 'a', text: 'Network Load Balancer com um listener UDP.', correct: true, consequence: 'O NLB trabalha na camada 4, aceita UDP e foi feito para milhões de requisições por segundo com latência baixa.' },
        { id: 'b', text: 'Application Load Balancer com um listener HTTPS.', correct: false, consequence: 'O ALB é de camada 7 e atende HTTP e HTTPS; não recebe tráfego UDP.' },
        { id: 'c', text: 'Application Load Balancer com WebSockets.', correct: false, consequence: 'WebSockets correm sobre HTTP e TCP; os veículos enviam UDP.' },
        { id: 'd', text: 'Gateway Load Balancer na frente dos servidores.', correct: false, consequence: 'O GWLB distribui tráfego para appliances de rede, como firewalls, não para servidores de aplicação.' },
      ],
      explanation: [
        'O **NLB** é o balanceador de camada 4: aceita **TCP, UDP e TLS**, atende milhões de requisições por segundo com latência mínima e tem um IP estático por zona. Telemetria por UDP em grande volume é o caso típico.',
        'O ALB é de camada 7 e só fala HTTP e HTTPS, incluindo WebSockets, que continuam sobre TCP. O GWLB serve para inserir appliances de terceiros no caminho do tráfego.',
        '**Regra prática:** UDP, IP estático, latência ultrabaixa ou milhões de requisições por segundo levam ao NLB. Roteamento por conteúdo HTTP leva ao ALB.',
      ],
    },
    {
      id: 'rv:cmp.f05.ip-fixo-e-caminhos',
      kind: 'decision',
      title: 'IPs fixos para o parceiro, caminhos para a API',
      prompt:
        'Um parceiro só libera no firewall dele **endereços IP fixos**. A API da empresa roda atrás de um **Application Load Balancer** que usa **regras de caminho** para separar /pedidos e /estoque em serviços diferentes. A empresa quer atender o parceiro **sem perder as regras de caminho**. Qual solução atende?',
      concepts: [{ id: 'elb.nlb' }, { id: 'elb.alb' }],
      xp: 5,
      difficulty: 3,
      domain: 'd3',
      options: [
        { id: 'a', text: 'Associar Elastic IPs ao Application Load Balancer.', correct: false, consequence: 'O ALB não aceita Elastic IPs; os endereços dos nós dele mudam.' },
        { id: 'b', text: 'Trocar o ALB por um NLB com Elastic IPs e recriar as regras de caminho nele.', correct: false, consequence: 'O NLB tem IPs fixos, mas é de camada 4 e não tem regras de caminho.' },
        { id: 'c', text: 'Pôr um NLB com Elastic IPs na frente, com o ALB atual como alvo.', correct: true, consequence: 'O parceiro libera os IPs fixos do NLB, e o ALB continua aplicando as regras de caminho.' },
        { id: 'd', text: 'Passar ao parceiro os IPs atuais dos nós do ALB.', correct: false, consequence: 'Esses IPs mudam com o tempo, e o firewall do parceiro passaria a bloquear a API.' },
      ],
      explanation: [
        'O **NLB** tem um IP estático por zona, com Elastic IP opcional, e pode ter como alvo um **Application Load Balancer**. Com o NLB na frente e o ALB atrás, o parceiro libera endereços que não mudam, e as regras de caminho continuam no ALB.',
        'O ALB não aceita Elastic IPs, e os IPs dos nós dele mudam. Trocar o ALB pelo NLB perde a camada 7.',
        '**Regra prática:** IP fixo é coisa do NLB; roteamento HTTP é coisa do ALB. Quando a questão pede os dois, encadeie: NLB na frente, ALB como alvo.',
      ],
    },
    {
      id: 'rv:cmp.f05.m2.a2',
      kind: 'decision',
      title: 'A versão 2 da API nunca recebe tráfego',
      prompt:
        'Um listener do ALB tem duas regras: prioridade **10**, caminho `/api/*`, para a API versão 1; e prioridade **20**, caminho `/api/v2/*`, para a versão 2. Todas as requisições para /api/v2/catalogo chegam à **versão 1**. Qual correção faz a versão 2 receber esse tráfego?',
      concepts: [{ id: 'elb.listener-rules' }],
      xp: 5,
      difficulty: 2,
      domain: 'd3',
      options: [
        { id: 'a', text: 'Dar à regra `/api/v2/*` a prioridade 5, menor que a da `/api/*`.', correct: true, consequence: 'As regras são avaliadas da menor prioridade para a maior: a regra da versão 2 passa a ser testada antes.' },
        { id: 'b', text: 'Acrescentar uma condição de cabeçalho à regra da versão 2.', correct: false, consequence: 'A regra continua sendo avaliada depois da `/api/*`, que já casa com a requisição e decide antes.' },
        { id: 'c', text: 'Transformar a regra da versão 2 na regra padrão do listener.', correct: false, consequence: 'A regra padrão é avaliada por último e não tem condições: a versão 1 continuaria pegando `/api/v2/*`.' },
        { id: 'd', text: 'Trocar as duas regras por um forward com pesos 50% e 50%.', correct: false, consequence: 'O tráfego seria dividido ao acaso entre as versões, sem respeitar o caminho pedido.' },
      ],
      explanation: [
        'As regras de um listener são avaliadas **da menor prioridade para a maior**, e **a primeira que casa decide**. Como `/api/*` também casa com /api/v2/catalogo e tem prioridade 10, a regra de prioridade 20 nunca é alcançada. A regra mais específica precisa ter prioridade menor.',
        'Mais condições na regra da versão 2 não mudam a ordem. A regra padrão é a última e sem condições. E o forward com pesos divide tráfego por proporção, não por caminho.',
        '**Regra prática:** nas regras do ALB, a mais específica vem primeiro, com o menor número de prioridade. Uma regra que nunca casa costuma estar atrás de outra mais genérica.',
      ],
    },
    {
      id: 'rv:cmp.f05.versao-nova-aos-poucos',
      kind: 'decision',
      title: 'Liberar a versão nova para uma parte dos clientes',
      prompt:
        'Uma equipe quer liberar a versão nova do site para **10% das requisições** e manter **90% na versão atual**, no mesmo Application Load Balancer e **sem mexer no DNS**. Cada versão roda num target group próprio. Se a versão nova der problema, o tráfego deve voltar todo para a atual em segundos. Qual configuração atende?',
      concepts: [{ id: 'elb.listener-rules' }],
      xp: 5,
      difficulty: 2,
      domain: 'd3',
      options: [
        { id: 'a', text: 'Uma regra de caminho `/novo/*` que leva à versão nova.', correct: false, consequence: 'Só quem acessar `/novo/*` chega à versão nova; não há divisão de 10% das requisições.' },
        { id: 'b', text: 'Uma ação forward com pesos 90 e 10 entre os dois target groups.', correct: true, consequence: 'O ALB divide as requisições na proporção dos pesos; voltar é mudar o peso da versão nova para zero.' },
        { id: 'c', text: 'Sticky sessions no target group da versão atual.', correct: false, consequence: 'Mantém os clientes no mesmo alvo, mas não divide o tráfego entre versões.' },
        { id: 'd', text: 'Registrar as instâncias das duas versões no mesmo target group, na proporção de 9 para 1.', correct: false, consequence: 'Aproxima a divisão, mas a proporção depende do número de instâncias e voltar exige desregistrar alvos.' },
      ],
      explanation: [
        'A ação **forward** de uma regra pode dividir o tráfego entre vários target groups **por pesos**. Com 90 e 10, o ALB manda uma em cada dez requisições para a versão nova; para voltar, basta mudar o peso dela para zero, sem tocar no DNS.',
        'Uma regra de caminho separa por endereço, não por proporção. Sticky sessions não dividem tráfego. E misturar versões num target group só deixa a proporção depender do número de instâncias, com reversão lenta.',
        '**Regra prática:** dividir tráfego entre duas versões numa proporção, no mesmo ALB, é forward com pesos entre target groups.',
      ],
    },
    {
      id: 'rv:cmp.f05.health-check-raso',
      kind: 'decision',
      title: 'Página inicial no ar, pedidos com erro',
      prompt:
        'Atrás de um ALB, algumas instâncias passam a responder **erro 500** em todas as páginas de pedidos quando perdem a conexão com o serviço de estoque, mas continuam recebendo tráfego. O health check do target group faz GET em **/**, uma página estática que sempre responde 200. A empresa quer que o ALB **pare de mandar tráfego** para essas instâncias. Qual mudança atende?',
      concepts: [{ id: 'elb.health-checks' }],
      xp: 5,
      difficulty: 2,
      domain: 'd2',
      options: [
        { id: 'a', text: 'Apontar o health check para um caminho que testa a aplicação.', correct: true, consequence: 'As instâncias com erro passam a falhar no health check, e o ALB deixa de mandar tráfego para elas.' },
        { id: 'b', text: 'Reduzir o intervalo do health check de 30 para 10 segundos.', correct: false, consequence: 'Testa mais vezes a mesma página estática, que continua respondendo 200.' },
        { id: 'c', text: 'Aumentar o deregistration delay para 600 segundos.', correct: false, consequence: 'O deregistration delay só vale quando um alvo é removido; aqui nenhum alvo é marcado como doente.' },
        { id: 'd', text: 'Ligar sticky sessions para os clientes ficarem nas instâncias boas.', correct: false, consequence: 'Os clientes que caírem numa instância com erro ficam presos nela.' },
      ],
      explanation: [
        'O ALB só manda tráfego aos alvos **saudáveis**, e "saudável" é o que o **health check** diz. Se ele testa uma página estática, a instância passa mesmo com a aplicação quebrada. Apontar o health check para um caminho que exercita a aplicação, como /saude, faz o ALB enxergar o problema.',
        'Testar mais vezes a mesma página não muda o resultado. O deregistration delay atua na saída de um alvo, que aqui nem acontece. E sticky sessions prendem clientes nas instâncias com erro.',
        '**Regra prática:** se o balanceador continua mandando tráfego para instâncias com a aplicação quebrada, confira o caminho do health check. Se o Auto Scaling não substitui essas instâncias, falta ligar o health check do ELB no grupo.',
      ],
    },
    {
      id: 'rv:cmp.f05.todos-doentes',
      kind: 'decision',
      title: 'Um defeito no balanceador?',
      prompt:
        'O health check de um target group verifica também o banco de dados. Durante uma queda do banco, **todos os alvos** do target group ficaram marcados como doentes, mas o Application Load Balancer **continuou distribuindo requisições entre todos eles**. A equipe achou que fosse um defeito. Qual explicação é a correta?',
      concepts: [{ id: 'elb.health-checks' }],
      xp: 5,
      difficulty: 3,
      domain: 'd2',
      options: [
        { id: 'a', text: 'O health check estava desligado no target group.', correct: false, consequence: 'Os alvos foram marcados como doentes, então o health check estava funcionando.' },
        { id: 'b', text: 'O cross-zone load balancing ignora o estado dos alvos.', correct: false, consequence: 'O cross-zone decide entre quais zonas distribuir, não se alvos doentes recebem tráfego.' },
        { id: 'c', text: 'O deregistration delay manteve os alvos recebendo requisições novas por 300 segundos.', correct: false, consequence: 'Durante o deregistration delay, o alvo termina as requisições em andamento, mas não recebe novas.' },
        { id: 'd', text: 'Com todos os alvos doentes, o ALB envia tráfego a todos eles (fail open).', correct: true, consequence: 'É o comportamento documentado: sem nenhum alvo saudável, o ALB prefere tentar todos a recusar tudo.' },
      ],
      explanation: [
        'Quando **todos os alvos** de um target group estão doentes, o ALB passa a enviar tráfego a **todos** eles, o chamado **fail open**. A ideia é que tentar os alvos é melhor do que recusar todas as requisições. Não é defeito.',
        'O health check estava ligado, já que marcou os alvos. O cross-zone não tem relação com o estado dos alvos. E o deregistration delay não envia requisições novas.',
        '**Regra prática:** um health check que depende de algo compartilhado, como o banco, pode derrubar todos os alvos ao mesmo tempo, e aí o ALB entra em fail open. Teste no health check o que é da própria instância.',
      ],
    },
    {
      id: 'rv:cmp.f05.zona-sem-no',
      kind: 'decision',
      title: 'Instâncias novas que nunca recebem requisições',
      prompt:
        'Um Auto Scaling group lança instâncias em **três zonas de disponibilidade** e as registra no target group de um Application Load Balancer. O ALB foi criado com **subnets de só duas dessas zonas**. As instâncias da terceira zona passam no health check, mas **nunca recebem requisições**. Qual mudança resolve?',
      concepts: [{ id: 'elb.cross-zone' }],
      xp: 5,
      difficulty: 2,
      domain: 'd2',
      options: [
        { id: 'a', text: 'Ligar o cross-zone load balancing no ALB.', correct: false, consequence: 'No ALB o cross-zone já é ligado, e ele só distribui entre as zonas habilitadas no balanceador.' },
        { id: 'b', text: 'Habilitar a terceira zona no ALB.', correct: true, consequence: 'Com a zona habilitada, o ALB passa a distribuir tráfego também para os alvos dela.' },
        { id: 'c', text: 'Aumentar o deregistration delay do target group.', correct: false, consequence: 'O deregistration delay atua quando um alvo sai, e esses alvos nem chegam a receber tráfego.' },
        { id: 'd', text: 'Ligar sticky sessions no target group.', correct: false, consequence: 'Mantém clientes nos alvos que já recebem tráfego; não faz os da terceira zona entrarem na distribuição.' },
      ],
      explanation: [
        'Cada zona **habilitada** no balanceador tem um nó dele. Com cross-zone, cada nó distribui entre os alvos de todas as zonas habilitadas; mas **alvos numa zona que não está habilitada não recebem tráfego**, por mais saudáveis que estejam. Acrescentar uma subnet da terceira zona ao ALB resolve.',
        'O cross-zone do ALB já está ligado e não alcança zonas não habilitadas. O deregistration delay e as sticky sessions não incluem alvos na distribuição.',
        '**Regra prática:** as zonas do balanceador precisam cobrir as zonas onde o Auto Scaling lança instâncias. Instância saudável que nunca recebe tráfego costuma estar numa zona que o balanceador não habilitou.',
      ],
    },
    {
      id: 'rv:cmp.f05.boss.a2',
      kind: 'decision',
      title: 'Doze alvos e a divisão do tráfego',
      prompt:
        'Um Network Load Balancer tem **3 alvos na zona A** e **9 na zona B**, com a **configuração padrão de cross-zone** do NLB. O DNS reparte o tráfego por igual entre os nós das duas zonas. Quais afirmações sobre a distribuição estão corretas? (Escolha DUAS.)',
      concepts: [{ id: 'elb.cross-zone' }],
      xp: 5,
      difficulty: 3,
      domain: 'd3',
      multiple: true,
      options: [
        { id: 'a', text: 'Hoje, cada alvo da zona A recebe cerca de 16,7% do tráfego total.', correct: true, consequence: 'Sem cross-zone, o nó da zona A divide a metade dele entre 3 alvos: 50% ÷ 3.' },
        { id: 'b', text: 'Hoje, cada um dos 12 alvos recebe cerca de 8,3% do tráfego total.', correct: false, consequence: 'Essa divisão igual só acontece com o cross-zone ligado, que no NLB vem desligado.' },
        { id: 'c', text: 'Com o cross-zone ligado, cada alvo passa a receber cerca de 8,3%.', correct: true, consequence: 'Cada nó passa a distribuir entre os 12 alvos das duas zonas: 1/12 para cada.' },
        { id: 'd', text: 'Hoje, cada alvo da zona B recebe cerca de 11,1% do tráfego total.', correct: false, consequence: 'A metade da zona B é dividida entre 9 alvos: cerca de 5,6% para cada.' },
        { id: 'e', text: 'Um ALB com os mesmos alvos teria a mesma distribuição desigual.', correct: false, consequence: 'No ALB, o cross-zone é sempre ligado: os 12 alvos receberiam a mesma parte.' },
      ],
      explanation: [
        'O DNS dá **metade do tráfego a cada nó**. No NLB, o cross-zone vem **desligado**: cada nó distribui só entre os alvos da sua zona. Na zona A, 50% ÷ 3 dá cerca de 16,7% por alvo; na B, 50% ÷ 9 dá cerca de 5,6%. Ligando o cross-zone, cada nó distribui entre os 12 alvos, cerca de 8,3% para cada.',
        'A divisão igual hoje exigiria o cross-zone ligado. Os 11,1% vêm de dividir 100% por 9, esquecendo que a zona B recebe só metade. E o ALB tem cross-zone sempre ligado, então não teria esse desequilíbrio.',
        '**Regra prática:** tráfego desigual entre alvos de zonas com quantidades diferentes de instâncias, num NLB ou GWLB, aponta para o cross-zone desligado. Ligue-o ou equilibre o número de alvos por zona.',
      ],
    },
    {
      id: 'rv:elb.target-groups.onprem',
      kind: 'decision',
      title: 'Servidores que ainda não migraram',
      prompt:
        'Durante uma migração, o ALB de uma empresa precisa mandar parte das requisições para servidores que **ainda estão no data center**, ligados à VPC por Direct Connect. O target group atual é do tipo **instance**, com as instâncias EC2 já migradas. Qual configuração atende?',
      concepts: [{ id: 'elb.target-groups' }],
      xp: 5,
      difficulty: 2,
      domain: 'd2',
      options: [
        { id: 'a', text: 'Mudar o tipo do target group atual para ip e registrar os endereços do data center nele.', correct: false, consequence: 'O tipo de alvo não muda depois que o target group é criado.' },
        { id: 'b', text: 'Registrar os servidores do data center no target group atual pelo nome de cada um.', correct: false, consequence: 'O tipo instance aceita só IDs de instâncias EC2; servidores fora da AWS não têm esse ID.' },
        { id: 'c', text: 'Criar um target group do tipo ip e dividir o tráfego por pesos.', correct: true, consequence: 'O ALB alcança os servidores pela conexão privada, e o forward com pesos reparte as requisições entre os dois grupos.' },
        { id: 'd', text: 'Criar um target group do tipo lambda que repasse as requisições ao data center.', correct: false, consequence: 'Um target group de Lambda aceita uma única função, e o repasse viraria código para manter.' },
      ],
      explanation: [
        'Um target group do tipo **ip** aceita endereços IP privados, **inclusive de servidores no data center** ligados por Direct Connect ou VPN. Como o tipo de alvo **não muda depois da criação**, é preciso um target group novo; a regra do listener divide as requisições entre os dois grupos com um forward ponderado.',
        'O tipo instance só aceita IDs de instâncias EC2, e o tipo de um grupo existente não pode ser trocado. O tipo lambda aceita uma única função e não foi feito para repassar tráfego a servidores.',
        '**Regra prática:** alvos fora da AWS ou fora do EC2 entram por endereço IP, num target group do tipo ip. Escolha o tipo certo na criação, porque ele não muda depois.',
      ],
    },
    {
      id: 'rv:cmp.f05.m1.a3',
      kind: 'decision',
      title: 'O balanceador da camada de aplicação',
      prompt:
        'Numa arquitetura em camadas, os servidores web, atrás de um ALB internet-facing, chamam os servidores de aplicação, que **nunca devem ser alcançáveis pela internet**. Os servidores de aplicação ficam em subnets privadas, **sem IP público**, e precisam de um balanceador. Qual configuração atende?',
      concepts: [{ id: 'elb.scheme' }],
      xp: 5,
      difficulty: 1,
      domain: 'd1',
      options: [
        { id: 'a', text: 'Um balanceador internet-facing com um security group que só aceite os servidores web.', correct: false, consequence: 'Funcionaria, mas cria nós com IP público sem necessidade, contra o requisito de nunca expor a camada.' },
        { id: 'b', text: 'Um balanceador interno, com nós só de IP privado.', correct: true, consequence: 'Só quem está na VPC, como os servidores web, alcança o balanceador e os servidores de aplicação.' },
        { id: 'c', text: 'Um balanceador internet-facing, dando IP público aos servidores de aplicação para ele alcançá-los.', correct: false, consequence: 'O balanceador fala com os alvos por IP privado: dar IP público a eles só os expõe.' },
        { id: 'd', text: 'Nenhum balanceador: os servidores web chamam os IPs privados de cada servidor de aplicação.', correct: false, consequence: 'Funciona até um servidor ser trocado ou cair; sem balanceador, não há distribuição nem health check.' },
      ],
      explanation: [
        'O balanceador **interno** só tem IPs privados e atende quem está na VPC. É o desenho de camadas descrito pela AWS: internet-facing na frente da web, interno na frente da aplicação. Nos dois casos, o balanceador fala com os alvos por IP privado, então os servidores não precisam de IP público.',
        'Um internet-facing restrito por security group cria uma exposição desnecessária. IP público nos alvos é um mito: o balanceador não precisa dele. E sem balanceador, a camada de aplicação perde distribuição e verificação de saúde.',
        '**Regra prática:** só o balanceador da frente é internet-facing. O da camada de aplicação é interno, e as instâncias ficam em subnets privadas.',
      ],
    },
    {
      id: 'rv:cmp.f05.m3.a4',
      kind: 'decision',
      title: 'O carrinho que some',
      prompt:
        'Uma loja guarda o carrinho de compras **na memória de cada servidor**. Quando o ALB manda o cliente para outro servidor, o carrinho some. Mudar onde o carrinho fica exige uma alteração no código prevista só para o próximo trimestre. Qual mudança resolve **agora, sem alterar o código**?',
      concepts: [{ id: 'elb.stickiness' }],
      xp: 5,
      difficulty: 2,
      domain: 'd2',
      options: [
        { id: 'a', text: 'Desligar o cross-zone no target group, para o cliente ficar na mesma zona.', correct: false, consequence: 'O cliente continua trocando de servidor dentro da zona, e sticky sessions nem funcionam com cross-zone desligado.' },
        { id: 'b', text: 'Trocar o ALB por um NLB.', correct: false, consequence: 'Muda de camada sem resolver onde a sessão está guardada.' },
        { id: 'c', text: 'Ligar sticky sessions no target group, com o cookie do balanceador.', correct: true, consequence: 'O ALB passa a mandar cada cliente sempre ao mesmo servidor, onde o carrinho está.' },
        { id: 'd', text: 'Aumentar o deregistration delay, para os servidores ficarem mais tempo no ar.', correct: false, consequence: 'Só atua quando um alvo sai; enquanto todos estão no ar, o cliente continua trocando de servidor.' },
      ],
      explanation: [
        'Com **sticky sessions**, o ALB usa um cookie (o dele, AWSALB, ou um da aplicação) para mandar as requisições de um cliente sempre ao **mesmo alvo**. Isso resolve a sessão guardada na memória do servidor sem mexer no código.',
        'Desligar o cross-zone não fixa o cliente num servidor. O NLB não resolve onde a sessão fica. E o deregistration delay não tem relação com a escolha do alvo.',
        '**Regra prática:** sticky sessions são o paliativo para sessão na memória do servidor, mas desequilibram a carga e perdem a sessão se o servidor cair. Para escalabilidade e alta disponibilidade, tire a sessão do servidor, por exemplo para o ElastiCache ou o DynamoDB.',
      ],
    },
    {
      id: 'rv:cmp.f05.firewalls-de-saida',
      kind: 'decision',
      title: 'Firewalls do fabricante no caminho do tráfego',
      prompt:
        'Uma empresa já tem uma frota de firewalls virtuais de um fabricante atrás de um **Gateway Load Balancer**, numa VPC de inspeção. Agora quer que o tráfego de saída de uma VPC de aplicação passe por esses firewalls **de forma transparente**, sem mudar a configuração das instâncias da aplicação. Como o tráfego deve chegar ao Gateway Load Balancer?',
      concepts: [{ id: 'elb.gwlb' }],
      xp: 5,
      difficulty: 2,
      domain: 'd1',
      options: [
        { id: 'a', text: 'Configurar o IP de um firewall como proxy em cada instância da aplicação.', correct: false, consequence: 'Muda a configuração das instâncias e prende cada uma a um firewall, sem distribuição nem transparência.' },
        { id: 'b', text: 'Um GWLB endpoint na VPC de aplicação, como destino nas rotas.', correct: true, consequence: 'As rotas desviam o tráfego para o endpoint, que o entrega ao GWLB e aos firewalls sem as instâncias perceberem.' },
        { id: 'c', text: 'Um Network Load Balancer na VPC de aplicação apontando para os firewalls.', correct: false, consequence: 'O NLB recebe conexões endereçadas a ele; não é inserido de forma transparente no caminho do tráfego.' },
        { id: 'd', text: 'Regras de saída nos security groups da aplicação apontando para o GWLB.', correct: false, consequence: 'Security groups permitem ou não o tráfego; não desviam o caminho dele.' },
      ],
      explanation: [
        'O **Gateway Load Balancer** é o ponto de entrada e saída transparente para appliances de terceiros, que ele alcança pelo protocolo GENEVE na porta 6081. O tráfego chega a ele por **Gateway Load Balancer endpoints**, colocados como destino nas **tabelas de rotas**: as instâncias continuam mandando o tráfego normalmente, e as rotas o desviam para a inspeção.',
        'Configurar proxy nas instâncias é o oposto de transparente. O NLB recebe conexões destinadas a ele e não se insere no caminho. Security groups filtram, não roteiam.',
        '**Regra prática:** inspecionar tráfego com firewalls de terceiros, de forma transparente e escalável, é GWLB com os appliances num target group e endpoints nas tabelas de rotas.',
      ],
    },
  ],
}
