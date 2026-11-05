/**
 * Questões da Revisão da Fase 1 de Redes (VPC e endereçamento), no formato do
 * exame SAA-C03. Fatos conferidos em docs.aws.amazon.com (ver
 * docs/VERIFICACAO-DE-CONTEUDO.md). As empresas são fictícias.
 */
import type { ReviewSet } from '../../../../engine/types'

export const REVIEW_F01: ReviewSet = {
  phaseId: 'net.f01',
  questions: [
    {
      id: 'rv:net.f01.m1.a4',
      kind: 'decision',
      title: 'Os servidores web e a queda de uma zona',
      prompt:
        'Uma loja virtual vai criar a VPC dos servidores web em us-east-1. O requisito principal é que a loja **continue atendendo se uma zona de disponibilidade inteira falhar**. O orçamento permite o mesmo número de servidores em qualquer desenho. Como distribuir as sub-redes e os servidores web?',
      concepts: [{ id: 'vpc.subnet' }, { id: 'vpc.what' }],
      xp: 5,
      difficulty: 1,
      domain: 'd2',
      options: [
        { id: 'a', text: 'Uma sub-rede /23 que cubra as zonas A e B, com os servidores espalhados nela.', correct: false, consequence: 'Não existe sub-rede que atravesse zonas: cada sub-rede fica inteira dentro de uma zona de disponibilidade.' },
        { id: 'b', text: 'Uma sub-rede em cada uma de duas zonas, com servidores web nas duas.', correct: true, consequence: 'Se uma zona cair, os servidores da outra sub-rede, em outra zona, continuam atendendo.' },
        { id: 'c', text: 'Duas sub-redes na zona A, com metade dos servidores em cada uma.', correct: false, consequence: 'As duas sub-redes ficam na mesma zona e caem juntas: separar sub-redes não separa zonas.' },
        { id: 'd', text: 'Uma sub-rede na zona A, com o dobro de servidores para cobrir uma falha.', correct: false, consequence: 'Mais servidores protegem contra a falha de um servidor, não da zona: todos caem junto com a zona A.' },
      ],
      explanation: [
        'O requisito é sobreviver à **falha de uma zona inteira**. A VPC vale para a Região toda, mas cada sub-rede fica dentro de uma única zona de disponibilidade. Para a loja continuar no ar, os servidores precisam estar em sub-redes de pelo menos duas zonas: se uma cair, os da outra seguem atendendo.',
        'Uma sub-rede não pode atravessar zonas, qualquer que seja o tamanho do bloco. Duas sub-redes na mesma zona dividem o mesmo ponto de falha. E dobrar os servidores numa zona só protege contra a perda de máquinas, não contra a perda da zona.',
        '**Regra prática:** alta disponibilidade numa VPC começa por repetir cada camada em sub-redes de pelo menos duas zonas. Quando a questão disser "se uma zona falhar", procure a alternativa que espalha os recursos por sub-redes de zonas diferentes.',
      ],
    },
    {
      id: 'rv:net.f01.ambientes-e-camadas',
      kind: 'decision',
      title: 'Testes, produção e as camadas da aplicação',
      prompt:
        'Uma empresa vai levar para a AWS os ambientes de testes e de produção de um sistema com três camadas: web, aplicação e banco de dados. A segurança exige que **os dois ambientes fiquem isolados** um do outro e que, dentro de cada ambiente, **as camadas fiquem em faixas de endereços separadas**, cada uma repetida em duas zonas. Qual desenho atende?',
      concepts: [{ id: 'vpc.what' }, { id: 'vpc.subnet' }],
      xp: 5,
      difficulty: 2,
      domain: 'd1',
      options: [
        { id: 'a', text: 'Uma VPC por ambiente, cada uma com uma sub-rede por camada em cada zona.', correct: true, consequence: 'VPCs separadas isolam os ambientes, e as sub-redes separam as camadas dentro de cada um, em duas zonas.' },
        { id: 'b', text: 'Uma VPC só, com o ambiente de testes na zona A e o de produção na zona B.', correct: false, consequence: 'Zona não é fronteira de isolamento entre ambientes, e cada ambiente ficaria numa zona só, sem resistir à falha dela.' },
        { id: 'c', text: 'Uma VPC para cada camada, compartilhada pelos ambientes de testes e de produção.', correct: false, consequence: 'Inverte a separação: as camadas de um sistema precisam conversar, e os dois ambientes ficariam misturados na mesma rede.' },
        { id: 'd', text: 'Uma VPC só, com uma sub-rede de testes e outra de produção, cada uma atravessando as duas zonas.', correct: false, consequence: 'Sub-rede não atravessa zonas, e uma sub-rede por ambiente não separa as camadas.' },
      ],
      explanation: [
        'Há dois níveis de separação no pedido. Para **isolar ambientes** ou áreas da empresa, separam-se VPCs: cada VPC é uma rede isolada logicamente das outras. Para **separar camadas** de uma mesma aplicação, usam-se sub-redes dentro da VPC, uma por camada em cada zona. A resposta combina os dois: uma VPC por ambiente, com sub-redes de web, aplicação e banco repetidas em duas zonas.',
        'Zona de disponibilidade é uma questão de resistência a falhas, não de isolamento entre ambientes; além disso, cada ambiente ficaria numa zona só. Uma VPC por camada separa o que precisa conversar e mistura os ambientes. E nenhuma sub-rede atravessa zonas.',
        '**Regra prática:** VPCs separam cargas, ambientes ou áreas; sub-redes separam as camadas de uma aplicação; e cada camada se repete em pelo menos duas zonas.',
      ],
    },
    {
      id: 'rv:net.f01.m1.a3',
      kind: 'decision',
      title: 'Uma faixa para a nova VPC',
      prompt:
        'Uma empresa vai criar uma VPC que, no próximo ano, será ligada a três redes: o escritório (10.0.0.0/16), uma VPC já existente (10.1.0.0/16) e a rede de uma empresa recém-comprada (192.168.0.0/16). O time quer um bloco /16 de faixa privada que **não impeça essas ligações** nem entre em conflito com faixas usadas por serviços da AWS. Quais faixas atendem? (Escolha DUAS.)',
      concepts: [{ id: 'vpc.cidr' }],
      xp: 5,
      difficulty: 2,
      domain: 'd3',
      multiple: true,
      options: [
        { id: 'a', text: '172.17.0.0/16', correct: false, consequence: 'É privada e não se sobrepõe às três redes, mas alguns serviços da AWS usam essa faixa, e a AWS recomenda evitá-la.' },
        { id: 'b', text: '10.0.0.0/8', correct: false, consequence: 'Maior que o limite de /16 de um bloco de VPC, e conteria o escritório e a VPC existente.' },
        { id: 'c', text: '192.168.0.0/16', correct: false, consequence: 'Igual à rede da empresa comprada: com blocos sobrepostos, a ligação planejada não funciona.' },
        { id: 'd', text: '172.20.0.0/16', correct: true, consequence: 'Faixa privada da RFC 1918, sem sobreposição com as três redes e fora da faixa que a AWS recomenda evitar.' },
        { id: 'e', text: '10.50.0.0/16', correct: true, consequence: 'Faixa privada da RFC 1918, fora de 10.0.0.0/16 e de 10.1.0.0/16, e sem relação com 192.168.0.0/16.' },
      ],
      explanation: [
        'Três critérios eliminam as alternativas: o bloco precisa caber no limite da VPC (de /16 a /28), **não pode se sobrepor** a nenhuma rede que será ligada, porque redes sobrepostas não se roteiam entre si, e deve evitar 172.17.0.0/16, faixa que alguns serviços da AWS usam. 172.20.0.0/16 e 10.50.0.0/16 são faixas privadas da RFC 1918 que passam nos três.',
        '10.0.0.0/8 é maior que o permitido para uma VPC e ainda conteria o escritório e a outra VPC. 192.168.0.0/16 repete a rede da empresa comprada. E 172.17.0.0/16, apesar de privada e livre entre as três redes, é a faixa que a AWS recomenda não usar.',
        '**Regra prática:** antes de criar uma VPC, liste todas as redes com que ela poderá se ligar e escolha um bloco privado que não se sobreponha a nenhuma. Trocar o bloco depois significa recriar a VPC.',
      ],
    },
    {
      id: 'rv:net.f01.boss.a2',
      kind: 'decision',
      title: 'A VPC /22 que ficou pequena',
      prompt:
        'A VPC de uma empresa foi criada há dois anos com o bloco 10.0.0.0/22, e os endereços livres acabaram. O time precisa de **mais espaço para novas sub-redes sem recriar a VPC nem parar** os sistemas que já rodam nela. Nenhuma rede ligada à empresa usa 10.1.0.0/16. Qual ação atende?',
      concepts: [{ id: 'vpc.cidr' }],
      xp: 5,
      difficulty: 2,
      domain: 'd3',
      options: [
        { id: 'a', text: 'Alterar o bloco primário da VPC de 10.0.0.0/22 para 10.0.0.0/20.', correct: false, consequence: 'O tamanho de um bloco já associado não pode aumentar nem diminuir.' },
        { id: 'b', text: 'Associar o bloco secundário 10.0.0.0/16, que já contém o /22 atual.', correct: false, consequence: 'Um bloco secundário não pode se sobrepor aos blocos que a VPC já tem, e este contém o primário inteiro.' },
        { id: 'c', text: 'Associar o secundário 10.1.0.0/16 e criar nele as novas sub-redes.', correct: true, consequence: 'A VPC ganha espaço sem sobreposição, e as sub-redes atuais continuam como estão.' },
        { id: 'd', text: 'Criar uma VPC nova com bloco /16 e migrar para ela todos os sistemas.', correct: false, consequence: 'Funciona, mas recria a rede e exige migrar e parar os sistemas, justamente o que o requisito proíbe.' },
      ],
      explanation: [
        'O critério é crescer **sem recriar nem parar**. O tamanho de um bloco já associado à VPC não muda, mas a VPC aceita **blocos secundários**, também de /16 a /28, desde que não se sobreponham aos blocos que ela já tem. Associar 10.1.0.0/16 dá espaço para as sub-redes novas, e as antigas, no /22, seguem funcionando.',
        'Aumentar o primário não é possível. O secundário 10.0.0.0/16 contém o /22 atual e é recusado pela sobreposição. Recriar a VPC atende ao espaço, mas viola o requisito de não recriar nem parar.',
        '**Regra prática:** "a VPC ficou sem endereços" pede um bloco secundário sem sobreposição, tanto com a própria VPC quanto com as redes ligadas a ela. Lembre que o bloco primário nunca muda de tamanho nem pode ser removido.',
      ],
    },
    {
      id: 'rv:net.f01.m2.a2',
      kind: 'decision',
      title: 'A décima segunda instância que não subiu',
      prompt:
        'Um cluster de cache precisa de **12 endereços em cada uma de duas zonas**. O time criou uma sub-rede 10.30.4.0/28 na zona A e outra 10.30.4.16/28 na zona B, contando 16 endereços em cada uma. Nas duas zonas, a 12ª instância falhou por falta de endereços livres. Qual explicação está correta e qual é o **menor bloco** de sub-rede que resolve em cada zona?',
      concepts: [{ id: 'vpc.reserved-ips' }],
      xp: 5,
      difficulty: 2,
      domain: 'd3',
      options: [
        { id: 'a', text: 'A AWS reserva cinco endereços em cada sub-rede; uma /27 por zona atende.', correct: true, consequence: 'Uma /28 tem 11 endereços utilizáveis; a /27, com 27, é o menor bloco que comporta 12.' },
        { id: 'b', text: 'A AWS reserva só o primeiro e o último endereço; basta pedir aumento de cota.', correct: false, consequence: 'São cinco reservados, não dois, e o limite é do tamanho da sub-rede, não de uma cota da conta.' },
        { id: 'c', text: 'A AWS reserva cinco endereços; uma sub-rede /29 extra em cada zona atende.', correct: false, consequence: 'O menor bloco de sub-rede aceito é /28; uma /29 não pode ser criada.' },
        { id: 'd', text: 'A AWS reserva cinco endereços; uma /26 por zona é o menor bloco que atende.', correct: false, consequence: 'A /26 atende, mas não é a menor: a /27 já oferece 27 endereços utilizáveis.' },
      ],
      explanation: [
        'Em toda sub-rede, a AWS reserva **os quatro primeiros endereços e o último**: rede, roteador da VPC, DNS, uso futuro e broadcast. Uma /28 tem 16 endereços e só 11 utilizáveis, por isso a 12ª instância falhou. A /27 tem 32 endereços e 27 utilizáveis, o **menor bloco** que comporta 12 por zona.',
        'A reserva não é só do primeiro e do último endereço, como numa rede tradicional, e o problema não é de cota. Uma /29 não existe numa VPC, porque o menor bloco de sub-rede é /28. E a /26 funciona, mas desperdiça espaço quando a /27 já basta.',
        '**Regra prática:** em questões de dimensionamento, subtraia 5 de cada sub-rede: /28 dá 11, /27 dá 27, /26 dá 59 e /24 dá 251.',
      ],
    },
    {
      id: 'rv:net.f01.nove-sub-redes',
      kind: 'decision',
      title: 'Nove sub-redes num bloco /20',
      prompt:
        'Uma VPC nova terá o bloco 10.20.0.0/20. O desenho pede **três camadas (web, aplicação e banco) em três zonas**, cada camada numa sub-rede própria em cada zona, e cada sub-rede precisa de **pelo menos 200 endereços utilizáveis**. Qual plano de sub-redes atende?',
      concepts: [{ id: 'vpc.subnet' }, { id: 'vpc.reserved-ips' }],
      xp: 5,
      difficulty: 3,
      domain: 'd3',
      options: [
        { id: 'a', text: 'Nove sub-redes /23, uma por camada em cada zona.', correct: false, consequence: 'Um /20 comporta só oito blocos /23 sem sobreposição; a nona sub-rede não cabe.' },
        { id: 'b', text: 'Nove sub-redes /24, uma por camada em cada zona.', correct: true, consequence: 'Cada /24 tem 251 endereços utilizáveis, e o /20 comporta 16 delas: as nove cabem, com sobra.' },
        { id: 'c', text: 'Nove sub-redes /25, uma por camada em cada zona.', correct: false, consequence: 'Cabem no bloco, mas uma /25 tem só 123 endereços utilizáveis, abaixo dos 200 pedidos.' },
        { id: 'd', text: 'Três sub-redes /22, uma em cada zona, com as três camadas juntas.', correct: false, consequence: 'Cabem e sobram endereços, mas as camadas ficam na mesma sub-rede, contra o desenho pedido.' },
      ],
      explanation: [
        'Duas contas resolvem a questão. A de **tamanho**: cada sub-rede precisa de 200 endereços utilizáveis, e uma /24 tem 256 menos 5 reservados, ou seja, 251. A de **espaço**: cada número a menos no prefixo dobra o bloco, então um /20 comporta 16 sub-redes /24, e as nove necessárias cabem sem sobreposição.',
        'As /23 são grandes demais: o /20 só tem espaço para oito delas. As /25 cabem, mas têm 123 endereços utilizáveis. E três /22 cabem, mas misturam as camadas numa sub-rede, e o desenho pede uma sub-rede por camada em cada zona.',
        '**Regra prática:** para planejar sub-redes, primeiro ache o menor prefixo que dá os endereços utilizáveis pedidos (descontando 5), depois confira quantos blocos desse tamanho cabem na VPC: 2 elevado à diferença entre os prefixos.',
      ],
    },
    {
      id: 'rv:net.f01.m2.a3',
      kind: 'decision',
      title: 'Uma /25 para a terceira zona',
      prompt:
        'A VPC de uma empresa usa o bloco 10.40.0.0/16 e já tem duas sub-redes: 10.40.0.0/24 na zona A e 10.40.1.0/24 na zona B. O time precisa criar uma **sub-rede /25 na zona C** que seja aceita pela AWS. Qual bloco pode ser usado?',
      concepts: [{ id: 'vpc.subnet' }],
      xp: 5,
      difficulty: 1,
      domain: 'd2',
      options: [
        { id: 'a', text: '10.40.1.128/25', correct: false, consequence: 'Vai de 10.40.1.128 a 10.40.1.255, inteira dentro da sub-rede 10.40.1.0/24: a AWS recusa a sobreposição.' },
        { id: 'b', text: '10.40.0.128/25', correct: false, consequence: 'Fica dentro da sub-rede 10.40.0.0/24, que vai até 10.40.0.255: também se sobrepõe.' },
        { id: 'c', text: '10.41.0.0/25', correct: false, consequence: 'Não se sobrepõe a nada, mas fica fora do bloco 10.40.0.0/16 da VPC, e toda sub-rede precisa estar dentro dele.' },
        { id: 'd', text: '10.40.2.0/25', correct: true, consequence: 'Está dentro do bloco da VPC e não se sobrepõe a nenhuma das sub-redes existentes.' },
      ],
      explanation: [
        'Uma sub-rede é aceita quando **cabe no bloco da VPC** e **não se sobrepõe** a outra sub-rede da mesma VPC. A /24 10.40.0.0 vai de 10.40.0.0 a 10.40.0.255, e a /24 10.40.1.0 vai de 10.40.1.0 a 10.40.1.255. O bloco 10.40.2.0/25 começa depois das duas e ainda está dentro de 10.40.0.0/16.',
        'As duas metades de /24 já usadas (10.40.0.128/25 e 10.40.1.128/25) estão inteiras dentro de sub-redes existentes: ter prefixo diferente não evita a sobreposição. E 10.41.0.0/25 fica fora do bloco da VPC.',
        '**Regra prática:** para saber se dois blocos se sobrepõem, compare as faixas de início e fim, não os prefixos. Um bloco menor que começa dentro de um maior está inteiro dentro dele.',
      ],
    },
    {
      id: 'rv:net.f01.m3.a2',
      kind: 'decision',
      title: 'O banco de produção numa sub-rede padrão',
      prompt:
        'Uma empresa descobriu que o banco de dados de produção roda numa instância EC2 lançada com as opções padrão na **VPC padrão**, numa sub-rede padrão. Os servidores web da mesma VPC precisam continuar acessíveis pela internet. O requisito é que **o banco não possa ser alcançado da internet**, sem afetar os servidores web. Qual ação atende?',
      concepts: [{ id: 'vpc.default-vpc' }],
      xp: 5,
      difficulty: 1,
      domain: 'd1',
      options: [
        { id: 'a', text: 'Mover o banco para uma sub-rede padrão de outra zona da mesma VPC.', correct: false, consequence: 'Todas as sub-redes padrão são públicas e dão IPv4 público: o banco continuaria exposto.' },
        { id: 'b', text: 'Levar o banco para uma sub-rede privada de uma VPC planejada.', correct: true, consequence: 'Sem rota para a internet nem IPv4 público, o banco sai do alcance da internet, e os servidores web não mudam.' },
        { id: 'c', text: 'Remover o internet gateway da VPC padrão e manter o banco onde está.', correct: false, consequence: 'O banco deixa de ser alcançável, mas os servidores web também perdem a internet, o que o requisito proíbe.' },
        { id: 'd', text: 'Manter o banco na sub-rede padrão e exigir senhas fortes para o acesso.', correct: false, consequence: 'Senhas protegem o login, mas o banco continua alcançável da internet, contra o requisito.' },
      ],
      explanation: [
        'A VPC padrão foi feita para começar rápido: tem internet gateway, rota 0.0.0.0/0 para ele e sub-redes padrão que dão **IPv4 público** automaticamente a cada instância. Um banco ali fica alcançável da internet. A solução é levá-lo para uma **sub-rede privada** de uma VPC planejada, sem IPv4 público, deixando os servidores web como estão.',
        'Trocar de sub-rede padrão não muda nada, porque todas são públicas. Remover o internet gateway esconde o banco, mas derruba também os servidores web. E senha forte não tira o banco do alcance da internet.',
        '**Regra prática:** VPC padrão é para testes e começos rápidos. Recursos internos de produção, como bancos de dados, ficam em sub-redes privadas de uma VPC planejada.',
      ],
    },
    {
      id: 'rv:net.f01.vpc-padrao-apagada',
      kind: 'decision',
      title: 'A VPC padrão que alguém apagou',
      prompt:
        'Alguém apagou a VPC padrão de us-east-1, e as ferramentas internas que lançam instâncias sem informar a sub-rede começaram a falhar. Nenhuma outra VPC da conta deve mudar. O time quer **voltar a ter uma VPC padrão nessa Região com o menor esforço**. Qual ação atende?',
      concepts: [{ id: 'vpc.default-vpc' }],
      xp: 5,
      difficulty: 2,
      domain: 'd2',
      options: [
        { id: 'a', text: 'Restaurar pelo console a VPC padrão apagada, com o mesmo id de antes.', correct: false, consequence: 'Uma VPC padrão apagada não pode ser restaurada; o caminho é criar uma nova.' },
        { id: 'b', text: 'Marcar como padrão uma das VPCs que o time já criou nessa Região.', correct: false, consequence: 'Uma VPC criada por você não pode ser marcada como padrão, e o requisito proíbe mudar as outras VPCs.' },
        { id: 'c', text: 'Pedir ao suporte da AWS que recupere a VPC padrão apagada.', correct: false, consequence: 'Não há como recuperar a VPC padrão anterior; quem precisa dela cria uma nova na Região.' },
        { id: 'd', text: 'Criar uma nova VPC padrão em us-east-1, pelo console ou pela API.', correct: true, consequence: 'A AWS permite criar uma nova VPC padrão numa Região que ficou sem ela, com sub-redes padrão nas zonas.' },
      ],
      explanation: [
        'A VPC padrão pode ser apagada como qualquer outra, e quem lança instâncias sem escolher a sub-rede depende dela. A documentação é direta: depois de apagar a VPC padrão, **é possível criar uma nova**, e é isso que devolve as sub-redes padrão às ferramentas com o menor esforço.',
        'A VPC padrão anterior não pode ser restaurada, nem pelo console nem pelo suporte. E uma VPC criada por você não pode ser marcada como padrão; além disso, o requisito proíbe mexer nas outras VPCs. Uma Região tem no máximo uma VPC padrão, por isso a criação só é possível quando ela foi apagada.',
        '**Regra prática:** VPC padrão apagada não volta; cria-se outra. Em produção, prefira que as ferramentas informem a sub-rede, para não depender da VPC padrão.',
      ],
    },
    {
      id: 'rv:net.f01.m3.a3',
      kind: 'decision',
      title: 'Uma rota IPv6 para o internet gateway',
      prompt:
        'Os servidores de aplicação de uma empresa ficam numa sub-rede em que nenhuma instância tem IPv4 público. Para baixar pacotes por IPv6, eles receberam endereços IPv6 fornecidos pela AWS, e a sub-rede ganhou a rota ::/0 para o internet gateway. O requisito é que **nenhuma conexão iniciada pela internet** chegue aos servidores, e um analista afirma que nada mudou. Qual avaliação está correta?',
      concepts: [{ id: 'vpc.ipv6' }],
      xp: 5,
      difficulty: 3,
      domain: 'd1',
      options: [
        { id: 'a', text: 'Ele está certo: endereços IPv6 de uma VPC são privados, como os da RFC 1918.', correct: false, consequence: 'O IPv6 fornecido pela AWS é globalmente único e anunciado na internet; não há equivalente à faixa privada aqui.' },
        { id: 'b', text: 'Ele está errado: o IPv6 da AWS é público, e a internet pode iniciar conexões.', correct: true, consequence: 'Com a rota ::/0 para o internet gateway, só os security groups e as network ACLs ainda barram conexões vindas de fora.' },
        { id: 'c', text: 'Ele está certo: o internet gateway só encaminha IPv4 e ignora a rota ::/0 da tabela.', correct: false, consequence: 'O internet gateway encaminha IPv4 e IPv6; a rota ::/0 para ele torna a sub-rede pública para o IPv6.' },
        { id: 'd', text: 'Ele está errado, mas só porque a VPC padrão atribui IPv6 a toda instância nova.', correct: false, consequence: 'Nem a VPC padrão atribui IPv6 automaticamente; a exposição vem do endereço público somado à rota.' },
      ],
      explanation: [
        'Os endereços IPv6 fornecidos pela AWS são **globalmente únicos e anunciados na internet**: não existe uma faixa privada escondida atrás de NAT, como no IPv4. Com a rota ::/0 para o internet gateway, a sub-rede passa a ser pública para o IPv6, e a internet pode **iniciar conexões** com os servidores; só os security groups e as network ACLs ainda filtram.',
        'Não ter IPv4 público não protege o IPv6. O internet gateway trabalha com as duas famílias, então a rota ::/0 vale. E a VPC padrão não atribui IPv6 automaticamente, nem traz a rota ::/0.',
        '**Regra prática:** em IPv6, endereço da AWS mais rota para o internet gateway significa servidor alcançável da internet. Para só sair por IPv6, sem aceitar conexões de fora, existe um gateway próprio, o egress-only internet gateway, visto na fase de rotas.',
      ],
    },
    {
      id: 'rv:net.f01.outra-regiao',
      kind: 'decision',
      title: 'Quando a Região inteira fica fora',
      prompt:
        'Uma empresa tem uma VPC em us-east-1, com sub-redes em três zonas de disponibilidade. Um novo requisito pede que a aplicação **continue funcionando mesmo se a Região us-east-1 inteira ficar indisponível**. Qual desenho de rede atende?',
      concepts: [{ id: 'vpc.what' }],
      xp: 5,
      difficulty: 1,
      domain: 'd2',
      options: [
        { id: 'a', text: 'Adicionar à VPC atual sub-redes em zonas de us-west-2.', correct: false, consequence: 'A VPC existe numa Região só: as sub-redes dela só podem ficar em zonas de us-east-1.' },
        { id: 'b', text: 'Criar uma quarta sub-rede, numa zona livre de us-east-1.', correct: false, consequence: 'Mais uma zona protege contra falhas de zona, mas continua dentro da Região que pode ficar indisponível.' },
        { id: 'c', text: 'Criar uma VPC em us-west-2, com sub-redes nas zonas de lá.', correct: true, consequence: 'Uma segunda VPC em outra Região, com uma cópia da aplicação, continua de pé se us-east-1 cair.' },
        { id: 'd', text: 'Ampliar o bloco da VPC atual para que ela alcance outra Região.', correct: false, consequence: 'O bloco define os endereços, não o alcance: nenhuma VPC se estende a outra Região.' },
      ],
      explanation: [
        'A VPC vale para **uma Região** inteira, e as sub-redes dela ficam em zonas dessa Região. Sobreviver à perda de uma zona pede sub-redes em várias zonas; sobreviver à **perda da Região** pede uma segunda VPC em outra Região, com uma cópia da aplicação.',
        'Uma VPC não pode ter sub-redes em outra Região, qualquer que seja o tamanho do bloco. E uma zona a mais em us-east-1 não ajuda quando a Região toda está fora.',
        '**Regra prática:** falha de zona se resolve dentro da VPC, com sub-redes em várias zonas; falha de Região pede outra VPC em outra Região.',
      ],
    },
    {
      id: 'rv:net.f01.ipv4-publico-nos-testes',
      kind: 'decision',
      title: 'A cobrança de IPv4 nas instâncias de teste',
      prompt:
        'Um pipeline recria todos os dias cerca de 200 instâncias de teste nas sub-redes padrão da **VPC padrão**, com as opções padrão. Elas só conversam entre si, dentro da VPC, e nenhuma precisa de internet. A fatura mostra uma cobrança por hora de cada IPv4 público. A empresa quer **eliminar esse custo** sem mudar a VPC. Qual ação atende?',
      concepts: [{ id: 'vpc.default-vpc' }],
      xp: 5,
      difficulty: 3,
      domain: 'd4',
      options: [
        { id: 'a', text: 'Associar um Elastic IP a cada instância, no lugar do IPv4 automático.', correct: false, consequence: 'O Elastic IP também é um IPv4 público, e a AWS cobra todos os IPv4 públicos: o custo continua.' },
        { id: 'b', text: 'Ligar IPv6 nas sub-redes padrão e manter o IPv4 público das instâncias.', correct: false, consequence: 'Somar IPv6 não remove o IPv4 público, que continua sendo cobrado por hora.' },
        { id: 'c', text: 'Desligar a atribuição automática de IPv4 público nas sub-redes padrão usadas.', correct: true, consequence: 'As instâncias recriadas pelo pipeline nascem sem IPv4 público, e a cobrança por hora some.' },
        { id: 'd', text: 'Lançar as instâncias numa sub-rede padrão de outra zona da mesma VPC.', correct: false, consequence: 'Todas as sub-redes padrão dão IPv4 público automaticamente: a cobrança continua igual.' },
      ],
      explanation: [
        'Nas sub-redes padrão, **toda instância nova recebe IPv4 público** automaticamente, e a AWS cobra por hora cada IPv4 público. Como as instâncias de teste não precisam de internet e são recriadas todo dia, desligar a atribuição automática nessas sub-redes faz as próximas nascerem só com endereço privado, sem custo de IPv4 e sem mudar a VPC.',
        'O Elastic IP é cobrado do mesmo jeito, porque também é IPv4 público. Ligar IPv6 não remove o IPv4. E mudar de zona não adianta, porque todas as sub-redes padrão atribuem IPv4 público.',
        '**Regra prática:** instância que não conversa com a internet não precisa de IPv4 público. Na VPC padrão, ele vem ligado por padrão; desligar a atribuição automática é o jeito mais simples de cortar esse custo.',
      ],
    },
  ],
}
