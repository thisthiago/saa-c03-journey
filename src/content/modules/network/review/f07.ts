/**
 * Questões da Revisão da Fase 7 de Redes (DNS com Route 53), no formato do
 * exame SAA-C03. Fatos conferidos em docs.aws.amazon.com (ver
 * docs/VERIFICACAO-DE-CONTEUDO.md). As empresas são fictícias.
 */
import type { ReviewSet } from '../../../../engine/types'

export const REVIEW_F07: ReviewSet = {
  phaseId: 'net.f07',
  questions: [
    {
      id: 'rv:net.f07.m1.a3',
      kind: 'decision',
      title: 'Nomes que a internet não pode ver',
      prompt:
        'Uma empresa quer que nomes como banco.interno.empresa.com sejam resolvidos pelas instâncias de **três VPCs da mesma conta**, e que **ninguém na internet** consiga resolver esses nomes. As VPCs já têm os atributos de DNS ligados. Qual solução atende com o menor esforço?',
      concepts: [{ id: 'dns.hosted-zones' }],
      xp: 5,
      difficulty: 1,
      domain: 'd1',
      options: [
        { id: 'a', text: 'Registros com os IPs privados na zona hospedada pública do domínio.', correct: false, consequence: 'Os nomes e endereços internos ficariam visíveis para qualquer um na internet.' },
        { id: 'b', text: 'Uma zona hospedada privada associada às três VPCs.', correct: true, consequence: 'A zona responde só a consultas feitas de dentro das VPCs associadas e não existe na internet.' },
        { id: 'c', text: 'Uma zona hospedada privada em cada VPC, com os mesmos registros.', correct: false, consequence: 'Funciona, mas triplica o trabalho de manter os mesmos registros em três zonas.' },
        { id: 'd', text: 'Um endpoint de entrada do Resolver, com os registros cadastrados nele.', correct: false, consequence: 'O endpoint de entrada recebe consultas de fora da VPC; ele não guarda registros.' },
      ],
      explanation: [
        'Uma **zona hospedada privada** responde só às consultas feitas de dentro das VPCs associadas a ela. Uma única zona pode ser associada às três VPCs: os nomes internos resolvem em todas e não existem para a internet.',
        'Registros com IPs privados numa zona pública expõem a estrutura interna. Uma zona por VPC funciona, mas obriga a repetir cada mudança três vezes. E o endpoint de entrada do Resolver serve para a rede da empresa consultar a AWS; não guarda registros.',
        '**Regra prática:** "nomes internos só dentro das VPCs" pede zona hospedada privada. Uma mesma zona pode ser associada a várias VPCs.',
      ],
    },
    {
      id: 'rv:net.f07.m1.a1',
      kind: 'decision',
      title: 'A conta das consultas de DNS',
      prompt:
        'O nome www.empresa.com recebe centenas de milhões de consultas por mês e hoje é um **CNAME** para o domínio de uma distribuição do Amazon CloudFront. A empresa quer **eliminar a cobrança dessas consultas** no Route 53 sem mudar o destino. Qual mudança atende?',
      concepts: [{ id: 'dns.alias' }],
      xp: 5,
      difficulty: 2,
      domain: 'd4',
      options: [
        { id: 'a', text: 'Aumentar o TTL do CNAME atual para um dia inteiro.', correct: false, consequence: 'Reduz o número de consultas, mas as que chegam continuam sendo cobradas.' },
        { id: 'b', text: 'Trocar por um registro A com os IPs atuais do CloudFront.', correct: false, consequence: 'Os IPs do CloudFront mudam, e o registro ficaria apontando para endereços errados.' },
        { id: 'c', text: 'Trocar por um alias do tipo A para a distribuição.', correct: true, consequence: 'Consultas a alias que apontam para recursos da AWS, como o CloudFront, não são cobradas.' },
        { id: 'd', text: 'Mover o registro para uma zona hospedada privada.', correct: false, consequence: 'A zona privada só responde dentro das VPCs; os visitantes da internet perderiam o site.' },
      ],
      explanation: [
        'O **registro alias** é uma extensão do Route 53 que aponta para recursos da AWS, como uma distribuição do CloudFront, e **as consultas a esses alias não são cobradas**. O CNAME é cobrado a cada consulta. Trocar o CNAME por um alias do tipo A para a mesma distribuição mantém o destino e elimina a cobrança.',
        'Um TTL maior só reduz o volume de consultas. Os IPs do CloudFront não são fixos. E uma zona privada tiraria o site da internet.',
        '**Regra prática:** para apontar um nome a recursos da AWS (CloudFront, ELB, S3 de site, API Gateway), prefira o alias: funciona no ápice da zona, acompanha a troca de IPs e não cobra as consultas.',
      ],
    },
    {
      id: 'rv:net.f07.m1.a2',
      kind: 'decision',
      title: 'O domínio com e sem www',
      prompt:
        'Uma loja quer que **empresa.com** e **www.empresa.com** levem ao mesmo Application Load Balancer. A equipe testou alguns registros na zona hospedada pública. Quais registros **funcionam**? (Escolha DUAS.)',
      concepts: [{ id: 'dns.alias' }],
      xp: 5,
      difficulty: 1,
      domain: 'd2',
      multiple: true,
      options: [
        { id: 'a', text: 'Um alias do tipo A para o balanceador, no nome empresa.com.', correct: true, consequence: 'O alias funciona no ápice da zona e acompanha a troca de IPs do balanceador.' },
        { id: 'b', text: 'Um CNAME para o nome do balanceador, no nome empresa.com.', correct: false, consequence: 'Não se pode criar CNAME com o mesmo nome da zona, o ápice.' },
        { id: 'c', text: 'Um CNAME para o nome do balanceador, no nome www.empresa.com.', correct: true, consequence: 'Fora do ápice, o CNAME é permitido e leva ao balanceador.' },
        { id: 'd', text: 'Um registro A com os IPs atuais do balanceador, no nome empresa.com.', correct: false, consequence: 'Os IPs do balanceador mudam, e o registro passaria a apontar para endereços errados.' },
        { id: 'e', text: 'Um CNAME para empresa.com, no nome empresa.com, para os dois nomes.', correct: false, consequence: 'Um CNAME no ápice não é permitido, e apontar o nome para ele mesmo não leva a lugar nenhum.' },
      ],
      explanation: [
        'No **ápice da zona** (empresa.com), o CNAME não é permitido; o **alias** é. Ele aponta para o balanceador e acompanha a troca de IPs dele. Em **www.empresa.com**, que não é o ápice, um CNAME para o nome do balanceador funciona (um alias também funcionaria, sem cobrar as consultas).',
        'CNAME no ápice é recusado. Um registro A com IPs do balanceador quebra quando esses IPs mudam.',
        '**Regra prática:** domínio raiz apontando para recurso da AWS é sempre alias. Subdomínios aceitam CNAME, mas o alias costuma ser melhor por não cobrar as consultas.',
      ],
    },
    {
      id: 'rv:net.f07.m2.a1',
      kind: 'decision',
      title: 'Cinco por cento para a versão nova',
      prompt:
        'Uma empresa quer lançar uma versão nova do site num ambiente separado e mandar para ela **cerca de 5% dos acessos**, aumentando aos poucos se tudo correr bem. Os dois ambientes ficam atrás de balanceadores diferentes. Qual configuração do Route 53 atende?',
      concepts: [{ id: 'dns.weighted' }],
      xp: 5,
      difficulty: 2,
      domain: 'd2',
      options: [
        { id: 'a', text: 'Política ponderada, com peso 19 no ambiente atual e 1 no novo.', correct: true, consequence: 'O novo recebe 1 ÷ (19 + 1) = 5% das respostas; basta subir o peso dele para aumentar.' },
        { id: 'b', text: 'Política ponderada, com peso 95 no ambiente atual e 1 no novo.', correct: false, consequence: 'O novo recebe 1 ÷ 96, cerca de 1%, e não 5%.' },
        { id: 'c', text: 'Política de failover, com o ambiente novo como secundário.', correct: false, consequence: 'O secundário só recebe tráfego quando o primário fica sem saúde; não há divisão de 5%.' },
        { id: 'd', text: 'Política de múltiplas respostas, com um registro para cada ambiente.', correct: false, consequence: 'Os registros saudáveis são devolvidos ao acaso, sem controle da proporção.' },
      ],
      explanation: [
        'Na política **ponderada**, cada registro recebe o seu peso dividido pela soma dos pesos. Com 19 e 1, o ambiente novo recebe 1/20, ou 5%. Para aumentar, basta subir o peso dele; para desistir, zerá-lo.',
        'Com 95 e 1, o novo recebe cerca de 1%, porque a conta é sobre a soma, e não sobre 100. O failover não divide tráfego. E as múltiplas respostas não controlam proporções.',
        '**Regra prática:** "mandar parte do tráfego para testar uma versão" é roteamento ponderado. A fatia de cada registro é o peso dele dividido pela soma dos pesos.',
      ],
    },
    {
      id: 'rv:net.f07.peso-zero',
      kind: 'decision',
      title: 'O registro de peso zero',
      prompt:
        'Um site usa a política ponderada com dois registros, os dois com verificação de saúde: o ambiente atual tem peso 100, e o novo, desativado depois de um teste, tem **peso 0**. Num incidente, o ambiente atual **fica sem saúde**, e o novo continua saudável. O que o Route 53 passa a responder?',
      concepts: [{ id: 'dns.weighted' }],
      xp: 5,
      difficulty: 3,
      domain: 'd2',
      options: [
        { id: 'a', text: 'O ambiente atual, porque peso 0 nunca recebe tráfego.', correct: false, consequence: 'O peso 0 tira o registro só enquanto houver registros de peso maior saudáveis.' },
        { id: 'b', text: 'Nenhuma resposta, até alguém mudar os pesos à mão.', correct: false, consequence: 'O Route 53 tem uma regra para esse caso e não deixa de responder.' },
        { id: 'c', text: 'O ambiente novo, que passa a ser considerado.', correct: true, consequence: 'Sem registros de peso maior que zero saudáveis, o Route 53 passa a considerar os de peso zero.' },
        { id: 'd', text: 'Os dois ambientes ao acaso, em proporções iguais.', correct: false, consequence: 'Não há divisão igual: o registro sem saúde fica de fora, e o de peso zero passa a responder.' },
      ],
      explanation: [
        'Peso 0 tira um registro do rodízio, mas com uma exceção: **se todos os registros de peso maior que zero ficarem sem saúde**, o Route 53 passa a considerar os de peso zero. Como o ambiente novo está saudável, ele começa a receber o tráfego.',
        'Peso zero não é "nunca". O Route 53 não fica sem responder enquanto houver um registro saudável. E o ambiente sem saúde não entra numa divisão igual.',
        '**Regra prática:** antes de deixar um ambiente com peso zero "parado", lembre que ele pode virar o destino de todo o tráfego se os outros ficarem sem saúde. Para tirá-lo de vez, apague o registro.',
      ],
    },
    {
      id: 'rv:net.f07.m2.a2',
      kind: 'decision',
      title: 'Quando a Região mais rápida cai',
      prompt:
        'Uma aplicação roda em sa-east-1, us-east-1 e eu-west-1, e cada usuário deve ser atendido pela **Região de menor latência** para ele. Se uma Região ficar sem saúde, os usuários dela devem ir **automaticamente para a próxima Região mais rápida**. Qual configuração atende?',
      concepts: [{ id: 'dns.latency' }],
      xp: 5,
      difficulty: 2,
      domain: 'd2',
      options: [
        { id: 'a', text: 'Política de latência, sem verificações de saúde nos registros.', correct: false, consequence: 'Sem verificação, o Route 53 continua mandando usuários para a Região que caiu.' },
        { id: 'b', text: 'Política de latência, com verificações de saúde nos registros.', correct: true, consequence: 'A Região sem saúde sai das respostas, e cada usuário vai para a próxima de menor latência.' },
        { id: 'c', text: 'Política de geolocalização por continente, com registro padrão.', correct: false, consequence: 'Decide pelo local do usuário, não pela latência medida, e não pula Regiões sem saúde sozinha.' },
        { id: 'd', text: 'Política ponderada, com pesos iguais e verificações de saúde.', correct: false, consequence: 'Divide o tráfego por proporção, sem considerar a latência de cada usuário.' },
      ],
      explanation: [
        'A política de **latência** manda cada usuário para a Região que responde mais rápido para ele. Combinada com **verificações de saúde**, ela pula a Região que cair: os usuários dela passam a receber a próxima Região de menor latência, sem intervenção.',
        'Sem verificação de saúde, o Route 53 não sabe que a Região caiu. A geolocalização decide pelo local, não pela latência. E a ponderada divide por proporção.',
        '**Regra prática:** "menor latência" é a política de latência; "e pular a Região que cair" acrescenta verificações de saúde aos mesmos registros.',
      ],
    },
    {
      id: 'rv:net.f07.perto-nao-e-rapido',
      kind: 'decision',
      title: 'Ásia mandada para Tóquio',
      prompt:
        'Uma empresa roda a aplicação em Tóquio e em Singapura e configurou a **geolocalização** com o registro do continente asiático apontando para Tóquio. Usuários na Índia reclamam: a Região de Singapura responderia **mais rápido** para eles. O requisito é que **cada usuário seja atendido pela Região mais rápida** para ele. Qual mudança atende?',
      concepts: [{ id: 'dns.latency' }, { id: 'dns.geolocation' }],
      xp: 5,
      difficulty: 2,
      domain: 'd3',
      options: [
        { id: 'a', text: 'Trocar a geolocalização pela política de latência, com as duas Regiões.', correct: true, consequence: 'O Route 53 passa a escolher pela latência medida para cada usuário, não pelo continente.' },
        { id: 'b', text: 'Manter a geolocalização e criar um registro da Índia apontando para Singapura.', correct: false, consequence: 'Resolve a Índia por enquanto, mas a escolha continua sendo por país, não pela latência de cada usuário.' },
        { id: 'c', text: 'Trocar pela política ponderada, com metade do tráfego em cada Região.', correct: false, consequence: 'Metade dos usuários continuaria indo para a Região mais lenta para eles.' },
        { id: 'd', text: 'Trocar pela política de múltiplas respostas, com as duas Regiões.', correct: false, consequence: 'Devolve as duas ao acaso, sem considerar a latência de cada usuário.' },
      ],
      explanation: [
        'A **geolocalização** decide pelo local do usuário (país, continente), útil para idioma, direitos de distribuição ou leis. Ela não mede latência: a Região mais próxima no mapa, ou a escolhida para o continente, nem sempre é a mais rápida. Para atender cada usuário pela Região mais rápida, a política certa é a de **latência**.',
        'Um registro da Índia corrige um caso, mas mantém a escolha por local. A ponderada e as múltiplas respostas ignoram a latência.',
        '**Regra prática:** "mais rápido" é latência; "conforme o país ou o continente" é geolocalização. Não troque uma pela outra.',
      ],
    },
    {
      id: 'rv:net.f07.m2.a3',
      kind: 'decision',
      title: 'Conteúdo licenciado só para o Brasil',
      prompt:
        'Uma plataforma de vídeos só tem licença para exibir um catálogo **no Brasil**. Usuários de outros países devem ver uma **página de aviso**, hospedada em outro balanceador, e **ninguém pode ficar sem resposta** do DNS. Qual configuração do Route 53 atende?',
      concepts: [{ id: 'dns.geolocation' }],
      xp: 5,
      difficulty: 2,
      domain: 'd1',
      options: [
        { id: 'a', text: 'Geolocalização: Brasil para o catálogo e registro padrão para o aviso.', correct: true, consequence: 'O Brasil recebe o catálogo, e todos os outros locais, inclusive IPs sem local conhecido, recebem o aviso.' },
        { id: 'b', text: 'Geolocalização: um único registro, do Brasil, apontando para o catálogo.', correct: false, consequence: 'Sem registro padrão, usuários de outros países ficam sem resposta, em vez de ver o aviso.' },
        { id: 'c', text: 'Latência: o catálogo em sa-east-1 e a página de aviso em outra Região.', correct: false, consequence: 'A latência escolhe a Região mais rápida, não o país: um usuário de fora pode cair no catálogo.' },
        { id: 'd', text: 'Geoproximidade: o catálogo em sa-east-1, com área ampliada.', correct: false, consequence: 'A geoproximidade decide pela distância até os recursos, não pela fronteira do país.' },
      ],
      explanation: [
        'Restringir conteúdo **por país** é trabalho da **geolocalização**: um registro para o Brasil leva ao catálogo. O **registro padrão** atende todos os outros locais e também os IPs sem local conhecido. Sem ele, quem está fora do Brasil fica sem resposta.',
        'Um registro só do Brasil deixa os outros sem resposta, contra o requisito. A latência e a geoproximidade não respeitam fronteiras de país.',
        '**Regra prática:** direitos de distribuição, idioma ou leis por país pedem geolocalização, sempre com um registro padrão para o resto do mundo.',
      ],
    },
    {
      id: 'rv:net.f07.toronto-mexico-lisboa',
      kind: 'decision',
      title: 'Três usuários e três registros',
      prompt:
        'Um site usa a geolocalização com três registros: **América do Norte**, que leva ao ambiente A; **Canadá**, que leva ao ambiente B; e um **registro padrão**, que leva ao ambiente C. Para onde vão, nessa ordem, usuários em **Toronto**, na **Cidade do México** e em **Lisboa**?',
      concepts: [{ id: 'dns.geolocation' }],
      xp: 5,
      difficulty: 2,
      domain: 'd3',
      options: [
        { id: 'a', text: 'A, A e C.', correct: false, consequence: 'Toronto está no Canadá, que tem registro próprio; a região menor vence a América do Norte.' },
        { id: 'b', text: 'B, A e C.', correct: true, consequence: 'O Canadá vence a América do Norte para Toronto, o México cai na América do Norte, e Lisboa no padrão.' },
        { id: 'c', text: 'B, A e sem resposta.', correct: false, consequence: 'Lisboa não fica sem resposta: o registro padrão atende os locais sem registro próprio.' },
        { id: 'd', text: 'B, C e C.', correct: false, consequence: 'O México fica na América do Norte e é atendido pelo registro do continente, não pelo padrão.' },
      ],
      explanation: [
        'Na geolocalização, quando registros de tamanhos diferentes cobrem o mesmo usuário, **a região menor vence**. Toronto está no Canadá e na América do Norte: vai para o registro do Canadá (B). A Cidade do México está na América do Norte, sem registro de país: vai para A. Lisboa não casa com nenhum registro e vai para o **padrão** (C).',
        'Ignorar o registro do Canadá manda Toronto para A. Sem o registro padrão, Lisboa ficaria sem resposta, mas ele existe. E o México é atendido pelo registro do continente.',
        '**Regra prática:** na geolocalização, o registro mais específico (estado, país) vence o mais amplo (continente), e o padrão só atende quem não casou com nenhum.',
      ],
    },
    {
      id: 'rv:net.f07.geoproximidade',
      kind: 'decision',
      title: 'Aliviar uma Região sem abandonar a proximidade',
      prompt:
        'Uma aplicação roda em us-east-1 e us-east-2, e cada usuário é atendido pelo **recurso mais próximo** dele. A Região us-east-1 está sobrecarregada, e a empresa quer **deslocar parte dos usuários para us-east-2**, ampliando a área que ela atende, sem deixar de decidir pela localização. Qual política atende?',
      concepts: [{ id: 'dns.routing-policies' }],
      xp: 5,
      difficulty: 3,
      domain: 'd3',
      options: [
        { id: 'a', text: 'Geolocalização, com um registro por estado dos EUA.', correct: false, consequence: 'Decide pelo local do usuário em listas fixas; deslocar a fronteira exige refazer os registros um a um.' },
        { id: 'b', text: 'Ponderada, com mais peso para us-east-2.', correct: false, consequence: 'Move tráfego, mas por proporção: deixa de considerar onde o usuário está.' },
        { id: 'c', text: 'Latência, com registros para as duas Regiões.', correct: false, consequence: 'Escolhe pela latência medida e não permite empurrar parte dos usuários de uma Região para a outra.' },
        { id: 'd', text: 'Geoproximidade, com área maior para us-east-2.', correct: true, consequence: 'A decisão continua sendo pela localização dos recursos, e a área de us-east-2 cresce sobre a de us-east-1.' },
      ],
      explanation: [
        'A **geoproximidade** decide pela localização dos **recursos** e permite **deslocar tráfego** entre eles, ampliando ou reduzindo a área que cada um atende. É a política para aliviar us-east-1 mantendo a lógica de proximidade.',
        'A geolocalização trabalha com listas fixas de locais do usuário. A ponderada move tráfego por proporção, sem olhar onde o usuário está. E a latência não tem como empurrar usuários de uma Região para a outra.',
        '**Regra prática:** "deslocar tráfego entre Regiões pela localização" é geoproximidade; "por proporção" é ponderada; "pelo país do usuário" é geolocalização.',
      ],
    },
    {
      id: 'rv:net.f07.faixas-do-provedor',
      kind: 'decision',
      title: 'Clientes de um provedor de internet específico',
      prompt:
        'Uma empresa de streaming fechou acordo com um provedor de internet e conhece as **faixas de IP** dos clientes dele. Esses clientes devem ser atendidos por um conjunto de servidores reservado ao acordo; os demais, pelo conjunto padrão. Qual política do Route 53 atende?',
      concepts: [{ id: 'dns.routing-policies' }],
      xp: 5,
      difficulty: 1,
      domain: 'd3',
      options: [
        { id: 'a', text: 'Baseado em IP, com as faixas do provedor.', correct: true, consequence: 'O Route 53 responde pela faixa de IP de origem que você informou, separando os clientes do provedor.' },
        { id: 'b', text: 'Geolocalização, com o país do provedor.', correct: false, consequence: 'Mandaria todos os usuários do país, e não só os clientes do provedor, para os servidores do acordo.' },
        { id: 'c', text: 'Latência, com os dois conjuntos de servidores.', correct: false, consequence: 'Escolhe pela latência, sem saber quem é cliente do provedor.' },
        { id: 'd', text: 'Ponderada, com o peso da fatia do provedor.', correct: false, consequence: 'Divide por proporção, ao acaso: clientes do provedor cairiam no padrão e vice-versa.' },
      ],
      explanation: [
        'O **roteamento baseado em IP** usa faixas de IP de origem informadas por você para decidir a resposta. Com as faixas do provedor cadastradas, os clientes dele vão para os servidores do acordo, e os demais, para o conjunto padrão.',
        'A geolocalização olha o país, não o provedor. A latência e a ponderada não sabem quem é cliente de quem.',
        '**Regra prática:** quando o critério é a origem conhecida por faixas de IP (um provedor, uma rede parceira), a resposta é o roteamento baseado em IP.',
      ],
    },
    {
      id: 'rv:net.f07.m2.a4',
      kind: 'decision',
      title: 'Vários IPs saudáveis sem balanceador',
      prompt:
        'Um serviço de notificações roda em seis servidores com IPs públicos, sem balanceador de carga. A empresa quer que o DNS devolva **vários IPs, só de servidores saudáveis**, para que o cliente tente outro se o primeiro falhar. Qual configuração atende?',
      concepts: [{ id: 'dns.multivalue' }],
      xp: 5,
      difficulty: 2,
      domain: 'd2',
      options: [
        { id: 'a', text: 'Política simples, com um registro contendo os seis IPs.', correct: false, consequence: 'Devolve os seis IPs, sem verificação de saúde: servidores fora do ar continuam na resposta.' },
        { id: 'b', text: 'Múltiplas respostas, com um registro por servidor e sem verificações.', correct: false, consequence: 'Registro sem verificação de saúde conta como saudável: um servidor caído continuaria sendo devolvido.' },
        { id: 'c', text: 'Múltiplas respostas, com um registro e uma verificação por servidor.', correct: true, consequence: 'O Route 53 devolve até oito registros saudáveis, e os servidores sem saúde ficam de fora.' },
        { id: 'd', text: 'Failover, com um servidor primário e os outros como secundários.', correct: false, consequence: 'O failover tem um primário e um secundário e devolve um destino por vez, não vários IPs.' },
      ],
      explanation: [
        'A política de **múltiplas respostas** devolve até **oito registros saudáveis**, escolhidos ao acaso. Com uma **verificação de saúde** em cada registro, os servidores caídos saem da resposta; se um falhar depois que o cliente guardou a lista, ele tenta outro IP.',
        'A política simples não olha a saúde. Sem verificação, todo registro conta como saudável. E o failover devolve um destino por vez.',
        '**Regra prática:** "vários IPs saudáveis no DNS" é múltiplas respostas com verificação de saúde. Isso melhora a disponibilidade, mas não substitui um balanceador de carga.',
      ],
    },
    {
      id: 'rv:net.f07.m3.a1',
      kind: 'decision',
      title: 'Uma Região de reserva parada',
      prompt:
        'Uma empresa roda a aplicação em us-east-1 e mantém uma cópia em us-west-2 só para desastres. A cópia de us-west-2 **só deve receber tráfego se a de us-east-1 ficar sem saúde**. Qual configuração do Route 53 atende?',
      concepts: [{ id: 'dns.failover' }],
      xp: 5,
      difficulty: 1,
      domain: 'd2',
      options: [
        { id: 'a', text: 'Política de latência, com as duas Regiões e verificações de saúde.', correct: false, consequence: 'As duas Regiões recebem tráfego o tempo todo, conforme a latência de cada usuário: é ativo-ativo.' },
        { id: 'b', text: 'Política de failover: us-east-1 como primário, com verificação de saúde.', correct: true, consequence: 'O Route 53 responde com us-east-1 enquanto ela está saudável e passa a us-west-2 quando ela cai.' },
        { id: 'c', text: 'Política de múltiplas respostas, com as duas Regiões e verificações.', correct: false, consequence: 'Devolve as duas Regiões saudáveis ao acaso: a reserva receberia tráfego normalmente.' },
        { id: 'd', text: 'Política de geolocalização: Leste dos EUA para us-east-1 e padrão para us-west-2.', correct: false, consequence: 'Os usuários fora do Leste iriam para us-west-2 o tempo todo, mesmo com us-east-1 saudável.' },
      ],
      explanation: [
        'A política de **failover** é o ativo-passivo do Route 53: responde com o **primário** enquanto ele está saudável e passa ao **secundário** quando o primário fica sem saúde. Com a verificação de saúde em us-east-1, us-west-2 fica parada até ser necessária.',
        'Latência e múltiplas respostas mantêm as duas Regiões ativas. A geolocalização manda parte dos usuários para us-west-2 sempre.',
        '**Regra prática:** "a reserva só recebe tráfego se o principal cair" é failover. Qualquer outra política com verificações de saúde monta um ativo-ativo.',
      ],
    },
    {
      id: 'rv:net.f07.saude-do-alvo',
      kind: 'decision',
      title: 'Um primário que é um balanceador',
      prompt:
        'No failover de uma aplicação, o registro primário é um **alias para um Application Load Balancer** e o secundário é um site estático. A equipe quer que o Route 53 saiba se o primário está saudável com o **menor esforço** e sem depender dos IPs do balanceador. Qual configuração atende?',
      concepts: [{ id: 'dns.failover' }],
      xp: 5,
      difficulty: 2,
      domain: 'd2',
      options: [
        { id: 'a', text: 'Uma verificação de endpoint para cada IP atual do balanceador.', correct: false, consequence: 'Os IPs do balanceador mudam, e as verificações passariam a olhar endereços errados.' },
        { id: 'b', text: 'Uma verificação baseada num alarme do CloudWatch do balanceador.', correct: false, consequence: 'Funciona, mas exige criar e manter alarme e verificação, quando o alias já resolve.' },
        { id: 'c', text: 'Ligar "avaliar a saúde do alvo" no alias primário.', correct: true, consequence: 'O Route 53 usa a saúde do próprio balanceador, sem verificação separada para manter.' },
        { id: 'd', text: 'Nenhuma: o failover sempre considera o primário saudável.', correct: false, consequence: 'Sem avaliação de saúde, o failover nunca passaria ao secundário.' },
      ],
      explanation: [
        'Quando o registro é um **alias para um recurso da AWS**, como um balanceador, a opção **"avaliar a saúde do alvo"** faz o Route 53 usar a saúde do próprio recurso. Não é preciso criar nem manter uma verificação separada, e a troca de IPs do balanceador não importa.',
        'Verificar IPs do balanceador quebra quando eles mudam. O alarme do CloudWatch funciona, mas dá mais trabalho. E sem avaliação de saúde o failover não tem como saber que o primário caiu.',
        '**Regra prática:** em failover com alias para ELB, CloudFront ou outro recurso da AWS, ligue "avaliar a saúde do alvo" em vez de criar uma verificação.',
      ],
    },
    {
      id: 'rv:net.f07.m3.a2',
      kind: 'decision',
      title: 'Verificar um servidor que a internet não alcança',
      prompt:
        'Um serviço interno roda em instâncias de sub-redes privadas, sem acesso pela internet, e os registros dele estão numa política de failover. O time quer que o Route 53 saiba **se o serviço está saudável** e reaja à métrica de erros dele **assim que ela sair do normal**. Qual verificação de saúde atende?',
      concepts: [{ id: 'dns.health-checks' }],
      xp: 5,
      difficulty: 3,
      domain: 'd2',
      options: [
        { id: 'a', text: 'Uma verificação de endpoint apontando para o IP privado de uma instância.', correct: false, consequence: 'Os verificadores do Route 53 vêm da internet e não alcançam IPs privados.' },
        { id: 'b', text: 'Uma verificação baseada num alarme padrão do CloudWatch sobre os erros.', correct: true, consequence: 'O Route 53 acompanha o fluxo de dados da métrica, sem precisar alcançar as instâncias.' },
        { id: 'c', text: 'Uma verificação baseada num alarme "3 de 5 períodos" sobre a métrica de erros.', correct: false, consequence: 'Alarmes "M de N" não são aceitos como base de verificação de saúde do Route 53.' },
        { id: 'd', text: 'Uma verificação calculada, sem outras verificações dentro dela.', correct: false, consequence: 'A calculada só soma o estado de outras verificações; sozinha, não olha o serviço.' },
      ],
      explanation: [
        'A verificação de **endpoint** é feita pela internet e não alcança recursos privados. Para eles, a verificação é **baseada num alarme do CloudWatch**: o Route 53 olha o **fluxo de dados da métrica** e não espera o alarme mudar de estado, o que dá a reação rápida pedida.',
        'IPs privados ficam fora do alcance dos verificadores. Alarmes do tipo "M de N", e os de alta resolução, não são aceitos. E a verificação calculada depende de outras verificações.',
        '**Regra prática:** recurso privado no Route 53 é verificado por alarme do CloudWatch. Endpoint por IP ou nome só serve para o que a internet alcança.',
      ],
    },
    {
      id: 'rv:net.f07.m3.a3',
      kind: 'decision',
      title: 'Nomes do data center em vinte contas',
      prompt:
        'Instâncias de VPCs em **20 contas** da organização precisam resolver nomes do domínio corp.empresa.local, que só existe no DNS do data center, ligado à AWS por Direct Connect. A equipe de rede, na conta central, quer a solução com o **menor esforço** para as contas. Qual solução atende?',
      concepts: [{ id: 'dns.resolver' }],
      xp: 5,
      difficulty: 3,
      domain: 'd2',
      options: [
        { id: 'a', text: 'Um endpoint de entrada do Resolver em cada uma das 20 contas.', correct: false, consequence: 'O endpoint de entrada recebe consultas vindas do data center; ele não leva consultas das VPCs para lá.' },
        { id: 'b', text: 'Um endpoint de saída e uma regra de encaminhamento em cada uma das 20 contas.', correct: false, consequence: 'Funciona, mas multiplica por 20 o que a equipe central quer manter uma vez.' },
        { id: 'c', text: 'Uma zona hospedada privada com cópia dos registros de corp.empresa.local.', correct: false, consequence: 'A cópia fica desatualizada a cada mudança no data center e precisa ser mantida à mão.' },
        { id: 'd', text: 'Na conta central, endpoint de saída e regra compartilhada com as contas.', correct: true, consequence: 'Cada conta só associa a regra compartilhada às suas VPCs, e as consultas seguem ao DNS do data center.' },
      ],
      explanation: [
        'Para a **VPC resolver nomes da empresa**, o Resolver usa um **endpoint de saída** com uma **regra de encaminhamento** para o domínio, que manda as consultas ao DNS do data center pelo Direct Connect. As regras de encaminhamento **podem ser compartilhadas com outras contas**: a equipe central mantém um endpoint e uma regra, e as VPCs das 20 contas passam a usá-los.',
        'O endpoint de entrada faz o caminho contrário. Repetir endpoint e regra em cada conta funciona, mas é o oposto do menor esforço. E copiar os registros cria uma segunda fonte que envelhece.',
        '**Regra prática:** "a AWS resolver nomes da empresa" é endpoint de saída com regra de encaminhamento; "a empresa resolver nomes da AWS" é endpoint de entrada. Com muitas contas, compartilhe as regras.',
      ],
    },
  ],
}
