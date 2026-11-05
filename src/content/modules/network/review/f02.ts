/**
 * Questões da Revisão da Fase 2 de Redes (roteamento e saída para a
 * internet), no formato do exame SAA-C03. Fatos conferidos em
 * docs.aws.amazon.com (ver docs/VERIFICACAO-DE-CONTEUDO.md). As empresas são
 * fictícias.
 */
import type { ReviewSet } from '../../../../engine/types'

export const REVIEW_F02: ReviewSet = {
  phaseId: 'net.f02',
  questions: [
    {
      id: 'rv:net.f02.m2.a2',
      kind: 'decision',
      title: 'O servidor web que não responde',
      prompt:
        'Um servidor web foi lançado numa sub-rede cuja tabela de rotas tem 0.0.0.0/0 para o internet gateway da VPC. O security group libera a porta 443 para 0.0.0.0/0, mas o site não responde a acessos da internet. A instância tem só um endereço IPv4 privado. Qual mudança **faz o servidor responder** com o menor esforço?',
      concepts: [{ id: 'rt.igw' }],
      xp: 5,
      difficulty: 1,
      domain: 'd2',
      options: [
        { id: 'a', text: 'Associar um Elastic IP à instância.', correct: true, consequence: 'Com um IPv4 público, o internet gateway passa a traduzir o endereço privado da instância, e o tráfego chega.' },
        { id: 'b', text: 'Anexar um segundo internet gateway à VPC.', correct: false, consequence: 'O gateway já existe e já tem rota; o que falta é um IPv4 público na instância para ele traduzir.' },
        { id: 'c', text: 'Criar um NAT Gateway na sub-rede do servidor.', correct: false, consequence: 'O NAT Gateway só deixa a instância iniciar conexões para fora; ele não recebe conexões vindas da internet.' },
        { id: 'd', text: 'Trocar a rota 0.0.0.0/0 por ::/0 para o gateway.', correct: false, consequence: 'A instância não tem IPv6, e tirar a rota IPv4 cortaria de vez o caminho para a internet em IPv4.' },
      ],
      explanation: [
        'Para uma instância ser acessível pela internet, quatro peças precisam existir: o internet gateway anexado, a rota para ele na sub-rede, **um IPv4 público na instância** e um security group que libere a entrada. Só falta o endereço público: o internet gateway faz a tradução um para um entre o IP privado e o público, e sem público não há o que traduzir. Um Elastic IP resolve.',
        'Um segundo gateway não traz o endereço que falta. O NAT Gateway serve para a instância sair, nunca para receber conexões. E a rota ::/0 é do IPv6, que a instância nem tem.',
        '**Regra prática:** quando a rota para o internet gateway existe e o security group libera, confira o IP público da instância. Rota sem IP público, ou IP público sem rota, não chega à internet.',
      ],
    },
    {
      id: 'rv:net.f02.vpc-nova-sem-saida',
      kind: 'decision',
      title: 'A primeira instância de uma VPC nova',
      prompt:
        'Um time criou uma VPC do zero, com uma sub-rede, e lançou nela uma instância com IPv4 público. O security group deixa toda a saída livre, mas a instância **não alcança a internet**. A sub-rede usa a tabela de rotas principal da VPC, que não foi alterada. Quais ações fazem a instância sair para a internet? (Escolha DUAS.)',
      concepts: [{ id: 'rt.igw' }, { id: 'rt.route-table' }],
      xp: 5,
      difficulty: 2,
      domain: 'd2',
      multiple: true,
      options: [
        { id: 'a', text: 'Criar um internet gateway e anexá-lo à VPC.', correct: true, consequence: 'Uma VPC criada por você não vem com internet gateway; sem ele, não existe saída para a internet.' },
        { id: 'b', text: 'Criar um NAT Gateway público na mesma sub-rede da instância.', correct: false, consequence: 'O NAT Gateway público também depende de um internet gateway, e a instância já tem IPv4 público.' },
        { id: 'c', text: 'Adicionar à tabela da sub-rede a rota 0.0.0.0/0 para o internet gateway.', correct: true, consequence: 'A tabela só tem a rota local; com a rota padrão para o gateway, o tráfego para fora da VPC tem caminho.' },
        { id: 'd', text: 'Liberar a saída na network ACL padrão da sub-rede.', correct: false, consequence: 'A network ACL padrão já permite toda a entrada e a saída; o que falta é o gateway e a rota.' },
        { id: 'e', text: 'Trocar o IPv4 público automático da instância por um Elastic IP.', correct: false, consequence: 'Os dois são IPv4 públicos e funcionam do mesmo jeito; o problema está no caminho, não no endereço.' },
      ],
      explanation: [
        'Uma VPC criada por você nasce sem saída: a tabela principal só tem a **rota local**, que liga os recursos dentro da VPC, e não há internet gateway. A instância já tem IPv4 público e o security group libera a saída, então faltam duas peças: **criar e anexar o internet gateway** e **adicionar a rota 0.0.0.0/0** para ele na tabela da sub-rede.',
        'O NAT Gateway é para instâncias sem IP público e também precisa do internet gateway. A network ACL padrão já permite todo o tráfego. E trocar o tipo de IPv4 público não cria caminho nenhum.',
        '**Regra prática:** VPC criada do zero não tem saída. Para uma sub-rede ser pública, ela precisa de um internet gateway anexado à VPC e de uma rota para ele na tabela que ela usa.',
      ],
    },
    {
      id: 'rv:net.f02.m1.a2',
      kind: 'decision',
      title: 'Uma sub-rede criada sem associação',
      prompt:
        'Na VPC de uma empresa, a **tabela de rotas principal** ganhou a rota 0.0.0.0/0 para o internet gateway, e as sub-redes públicas a usam sem associação explícita. Um analista criou uma sub-rede para um banco de dados e não a associou a nenhuma tabela. A segurança exige que **toda sub-rede nova nasça sem rota para a internet**, mesmo quando alguém esquecer a associação. Qual desenho atende?',
      concepts: [{ id: 'rt.route-table' }, { id: 'rt.public-private' }],
      xp: 5,
      difficulty: 3,
      domain: 'd1',
      options: [
        { id: 'a', text: 'Associar a sub-rede do banco a uma tabela nova, sem a rota para o internet gateway.', correct: false, consequence: 'Corrige o banco, mas a próxima sub-rede criada sem associação volta a usar a principal e nasce pública.' },
        { id: 'b', text: 'Deixar a principal só com a rota local e associar as públicas a uma tabela própria.', correct: true, consequence: 'Toda sub-rede sem associação usa a principal, que não tem saída; só as associadas de propósito ficam públicas.' },
        { id: 'c', text: 'Remover a rota local da tabela principal, para isolar as sub-redes novas.', correct: false, consequence: 'A rota local já vem pronta e liga tudo dentro da VPC; tirá-la não é o caminho, e a rota para a internet continuaria lá.' },
        { id: 'd', text: 'Manter a principal e tirar o IPv4 público das instâncias da sub-rede nova.', correct: false, consequence: 'A sub-rede continua com rota para o internet gateway e, portanto, pública; depende de ninguém atribuir um IP público.' },
      ],
      explanation: [
        'Toda sub-rede sem associação explícita usa a **tabela principal** da VPC. Se a principal tem rota para o internet gateway, qualquer sub-rede nova nasce pública. Para que o esquecimento resulte em sub-rede privada, a principal fica **só com a rota local**, e as sub-redes públicas passam a ser associadas, de propósito, a uma tabela própria com a rota para o gateway.',
        'Associar só o banco resolve o caso, não a regra. A rota local liga os recursos da VPC e não é o que expõe nada. E tirar o IP público das instâncias deixa a sub-rede pública pelas rotas, à espera do primeiro IP público atribuído.',
        '**Regra prática:** deixe a tabela principal sem saída para a internet e crie tabelas próprias para as sub-redes públicas. Assim, uma sub-rede esquecida nasce privada.',
      ],
    },
    {
      id: 'rv:net.f02.m1.a3',
      kind: 'decision',
      title: 'Duas rotas para o mesmo destino',
      prompt:
        'A tabela de rotas da sub-rede de aplicação está no anexo. O time quer que o tráfego para a rede da filial, 192.168.10.0/24, passe a ir **pela VPN**, sem mudar o caminho dos outros destinos. Qual mudança atende?',
      exhibits: [
        {
          title: 'Tabela de rotas da sub-rede (na ordem em que aparece)',
          code: 'Destino            Alvo                 Origem\n10.0.0.0/16        local                automática\n192.168.10.0/24    virtual private gw   propagada pela VPN\n192.168.10.0/24    Transit Gateway      estática\n0.0.0.0/0          NAT Gateway          estática',
        },
      ],
      concepts: [{ id: 'rt.longest-prefix' }],
      xp: 5,
      difficulty: 3,
      domain: 'd3',
      options: [
        { id: 'a', text: 'Colocar a rota propagada pela VPN na primeira linha da tabela.', correct: false, consequence: 'A posição das linhas não decide nada; no empate de destino, a estática continua vencendo a propagada.' },
        { id: 'b', text: 'Remover a rota estática 192.168.10.0/24 para o Transit Gateway.', correct: true, consequence: 'Sem o empate, a rota propagada pela VPN é a única para esse destino e passa a levar o tráfego.' },
        { id: 'c', text: 'Adicionar a rota estática 192.168.0.0/16 para o virtual private gateway.', correct: false, consequence: 'É menos específica que a /24 e não vence; o tráfego para a filial continua indo ao Transit Gateway.' },
        { id: 'd', text: 'Trocar a rota 0.0.0.0/0 do NAT Gateway para o virtual private gateway.', correct: false, consequence: 'A /0 só vale quando nenhuma rota mais específica cobre o destino, e ainda mudaria o caminho da internet.' },
      ],
      explanation: [
        'A escolha da rota segue duas regras, nesta ordem: vence o **prefixo mais específico**; no empate de destino, a rota **estática vence a propagada**. Aqui há duas /24 iguais, e a estática, para o Transit Gateway, fica com o tráfego. Removê-la deixa a rota propagada pela VPN sozinha para esse destino, sem tocar nos outros.',
        'A ordem das linhas na tabela não tem efeito, ao contrário das regras numeradas de uma network ACL. Uma /16 é menos específica que a /24 e perde. E a /0 só pega o que nenhuma outra rota cobre, além de desviar o tráfego da internet.',
        '**Regra prática:** para prever o caminho, ache todas as rotas que cobrem o destino, fique com a de prefixo mais longo e, no empate, com a estática. A posição na tabela nunca conta.',
      ],
    },
    {
      id: 'rv:net.f02.igw-sem-gargalo',
      kind: 'decision',
      title: 'O medo de saturar o internet gateway',
      prompt:
        'Uma empresa de vídeo vai triplicar o tráfego dos servidores web, que ficam em sub-redes públicas e saem pelo internet gateway da VPC. Um arquiteto teme que o gateway vire **gargalo de banda** e propõe mudanças. Qual avaliação está correta?',
      concepts: [{ id: 'rt.igw' }],
      xp: 5,
      difficulty: 2,
      domain: 'd3',
      options: [
        { id: 'a', text: 'Anexar um segundo internet gateway à VPC e dividir as rotas entre os dois.', correct: false, consequence: 'Uma VPC tem um internet gateway anexado, e dividir não traz ganho: ele não tem limite de banda.' },
        { id: 'b', text: 'Trocar o internet gateway por NAT Gateways, que escalam até 100 Gbps.', correct: false, consequence: 'O NAT Gateway não recebe conexões da internet e ainda depende do internet gateway; o site sairia do ar.' },
        { id: 'c', text: 'Pedir à AWS um aumento da cota de banda do internet gateway da VPC.', correct: false, consequence: 'Não há cota de banda a aumentar: o internet gateway é escalado pela AWS e não impõe limite.' },
        { id: 'd', text: 'Nada muda no gateway: ele é redundante, escalado pela AWS e sem limite de banda.', correct: true, consequence: 'O planejamento de capacidade vai para os servidores e o balanceamento, não para o internet gateway.' },
      ],
      explanation: [
        'O internet gateway é um componente **redundante, altamente disponível e sem limite de banda**, escalado pela AWS. Mais tráfego não exige mudança nele: a capacidade a planejar é a dos servidores e de quem distribui a carga entre eles.',
        'Uma VPC não ganha banda com um segundo gateway. O NAT Gateway serve para instâncias privadas saírem e não recebe conexões da internet, o que derrubaria o site. E não há cota de banda do internet gateway para pedir aumento.',
        '**Regra prática:** o internet gateway não é ponto de falha nem gargalo. Em questões de desempenho de rede, o limite costuma estar na instância, no NAT Gateway ou no caminho até a rede da empresa.',
      ],
    },
    {
      id: 'rv:net.f02.web-e-aplicacao',
      kind: 'decision',
      title: 'Servidores que baixam pacotes mas não são vistos',
      prompt:
        'Uma aplicação tem um Application Load Balancer voltado para a internet e servidores de aplicação em duas zonas. Os servidores **não podem ser acessados diretamente pela internet**, mas precisam **baixar atualizações** de repositórios públicos. Qual desenho atende?',
      concepts: [{ id: 'rt.public-private' }, { id: 'rt.nat-gateway' }],
      xp: 5,
      difficulty: 2,
      domain: 'd1',
      options: [
        { id: 'a', text: 'Balanceador e servidores em sub-redes públicas, com IP público e security group restrito.', correct: false, consequence: 'Os servidores ficam com IP público e rota para a internet: um erro no security group os expõe.' },
        { id: 'b', text: 'Balanceador e servidores em sub-redes privadas, com saída por NAT Gateway.', correct: false, consequence: 'Um balanceador voltado para a internet precisa de sub-redes públicas para receber os acessos.' },
        { id: 'c', text: 'Balanceador em sub-redes públicas e servidores em privadas, com saída por NAT Gateway.', correct: true, consequence: 'Só o balanceador recebe da internet; os servidores saem pelo NAT, que não aceita conexões de fora.' },
        { id: 'd', text: 'Servidores em sub-redes privadas, sem IP público, com rota 0.0.0.0/0 para o internet gateway.', correct: false, consequence: 'Sem IP público, o internet gateway não traduz o endereço: os servidores ficam sem saída.' },
      ],
      explanation: [
        'Dois requisitos opostos se resolvem com sub-redes diferentes. O balanceador, que recebe os acessos, fica em **sub-redes públicas**. Os servidores ficam em **sub-redes privadas**, sem rota direta para o internet gateway, e saem por um **NAT Gateway** numa sub-rede pública: o NAT deixa as conexões começarem de dentro e não aceita as que vêm de fora.',
        'Servidores em sub-rede pública dependem só do security group para não serem expostos. Um balanceador voltado para a internet não funciona em sub-redes privadas. E rota para o internet gateway sem IP público não dá saída a ninguém.',
        '**Regra prática:** "não pode ser acessado diretamente" mais "precisa sair para a internet" pede sub-rede privada com NAT Gateway, atrás de um balanceador em sub-rede pública.',
      ],
    },
    {
      id: 'rv:net.f02.m2.a1',
      kind: 'decision',
      title: 'Quais sub-redes são públicas',
      prompt:
        'Uma auditoria pede a lista das **sub-redes públicas** de uma VPC. O time descreveu cada sub-rede pela tabela de rotas e pelos endereços das instâncias. Quais sub-redes são públicas? (Escolha DUAS.)',
      concepts: [{ id: 'rt.public-private' }, { id: 'rt.route-table' }],
      xp: 5,
      difficulty: 2,
      domain: 'd2',
      multiple: true,
      options: [
        { id: 'a', text: 'Rota 0.0.0.0/0 para o internet gateway; instâncias só com IP privado.', correct: true, consequence: 'A rota direta para o internet gateway faz a sub-rede ser pública, mesmo que hoje nenhuma instância tenha IP público.' },
        { id: 'b', text: 'Rota 0.0.0.0/0 para um NAT Gateway; instâncias só com IP privado.', correct: false, consequence: 'Sai pelo NAT, mas não tem rota direta para o internet gateway: é privada.' },
        { id: 'c', text: 'Só a rota local; instâncias com IPv4 público atribuído.', correct: false, consequence: 'O IP público sozinho não cria caminho: sem rota para fora, a sub-rede é privada, e isolada.' },
        { id: 'd', text: 'Rota 0.0.0.0/0 para o internet gateway; instâncias com IPv4 público.', correct: true, consequence: 'Rota direta para o gateway e IPs públicos: é pública, e as instâncias são alcançáveis se os security groups deixarem.' },
        { id: 'e', text: 'Rota para a rede da empresa por VPN; nenhuma rota para a internet.', correct: false, consequence: 'Sem rota para o internet gateway, é privada; a documentação a chama de sub-rede só VPN.' },
      ],
      explanation: [
        'O que define o tipo da sub-rede é a **tabela de rotas**: é pública a que tem rota direta para o internet gateway, e privada a que não tem. Por isso as duas com 0.0.0.0/0 para o gateway são públicas, com ou sem instâncias de IP público neste momento.',
        'Sair por um NAT Gateway não torna a sub-rede pública. Um IP público sem rota para o gateway não leva a lugar nenhum. E a sub-rede com rota só para a rede da empresa é do tipo só VPN, sem caminho para a internet.',
        '**Regra prática:** para classificar uma sub-rede, olhe as rotas, não os IPs das instâncias. Rota direta para o internet gateway significa sub-rede pública.',
      ],
    },
    {
      id: 'rv:net.f02.m2.a3',
      kind: 'decision',
      title: 'Quarenta IPs públicos sem uso',
      prompt:
        'Quarenta servidores de aplicação ficam numa sub-rede privada, atrás de um balanceador, e saem para a internet por um NAT Gateway. Cada um ainda tem um IPv4 público, atribuído na criação, que ninguém usa. A empresa quer **reduzir o custo** sem mudar o funcionamento. Qual ação atende?',
      concepts: [{ id: 'rt.public-ipv4-cost' }],
      xp: 5,
      difficulty: 1,
      domain: 'd4',
      options: [
        { id: 'a', text: 'Trocar os IPv4 públicos por Elastic IPs reservados na conta.', correct: false, consequence: 'Elastic IPs também são IPv4 públicos e também são cobrados por hora.' },
        { id: 'b', text: 'Manter os IPs: o IPv4 público só é cobrado quando há tráfego.', correct: false, consequence: 'A cobrança é por hora, com ou sem tráfego, para todo IPv4 público.' },
        { id: 'c', text: 'Retirar os IPv4 públicos e manter a saída pelo NAT Gateway.', correct: true, consequence: 'A sub-rede privada não usa os IPs; sem eles, a cobrança por hora some e nada muda.' },
        { id: 'd', text: 'Mover os servidores para uma sub-rede pública, para usar os IPs.', correct: false, consequence: 'Os IPs continuam cobrados, e os servidores passam a ficar expostos à internet.' },
      ],
      explanation: [
        'A AWS cobra **por hora cada IPv4 público**, em uso ou não, inclusive Elastic IPs. Numa sub-rede privada, sem rota para o internet gateway, esses endereços nem dão acesso à internet: a saída já vai pelo NAT Gateway. Retirá-los corta o custo sem mudar nada no funcionamento.',
        'Elastic IPs são cobrados do mesmo jeito. A cobrança não depende de tráfego. E levar os servidores para uma sub-rede pública mantém o custo e acrescenta exposição.',
        '**Regra prática:** IPv4 público em instância de sub-rede privada é custo sem função. Quem só precisa sair usa o NAT Gateway ou endpoints, e quem recebe acessos fica atrás de um balanceador.',
      ],
    },
    {
      id: 'rv:net.f02.m3.a1',
      kind: 'decision',
      title: 'Onde criar o NAT Gateway público',
      prompt:
        'Um time vai criar um NAT Gateway zonal público para dar saída à internet aos servidores de uma sub-rede privada na zona A. A VPC já tem internet gateway e uma sub-rede pública na mesma zona. Qual configuração **faz a saída funcionar**?',
      concepts: [{ id: 'rt.nat-gateway' }],
      xp: 5,
      difficulty: 1,
      domain: 'd2',
      options: [
        { id: 'a', text: 'NAT na sub-rede privada dos servidores, com um Elastic IP.', correct: false, consequence: 'A sub-rede privada não tem rota para o internet gateway: o NAT não teria por onde sair.' },
        { id: 'b', text: 'NAT na sub-rede pública, com Elastic IP, e a rota 0.0.0.0/0 da privada para ele.', correct: true, consequence: 'O NAT encaminha ao internet gateway pelo Elastic IP, e os servidores privados saem por ele.' },
        { id: 'c', text: 'NAT na sub-rede pública, sem Elastic IP, usando o IP privado que ele recebe na sub-rede.', correct: false, consequence: 'Sem Elastic IP, o NAT público não tem endereço para sair para a internet.' },
        { id: 'd', text: 'NAT na sub-rede pública, e a rota 0.0.0.0/0 da privada para o internet gateway.', correct: false, consequence: 'Os servidores sem IP público não saem pelo gateway; a rota da privada precisa apontar para o NAT.' },
      ],
      explanation: [
        'O NAT Gateway zonal público tem três exigências: ficar numa **sub-rede pública**, ter um **Elastic IP** e receber o tráfego das sub-redes privadas por uma rota **0.0.0.0/0 apontando para ele**. Ele traduz o endereço dos servidores para o Elastic IP e encaminha ao internet gateway.',
        'Numa sub-rede privada, o NAT não alcança o internet gateway. Sem Elastic IP, o NAT público não tem endereço público. E apontar a rota da sub-rede privada direto para o internet gateway não funciona com servidores sem IP público.',
        '**Regra prática:** NAT Gateway público fica numa sub-rede pública, com Elastic IP, e é o alvo da rota 0.0.0.0/0 das privadas. O modo regional dispensa a sub-rede pública, mas o zonal não.',
      ],
    },
    {
      id: 'rv:net.f02.parceiro-entrando',
      kind: 'decision',
      title: 'Um parceiro que precisa chegar ao servidor',
      prompt:
        'Os servidores de uma API ficam numa sub-rede privada e saem para a internet por um NAT Gateway. Agora um parceiro precisa **iniciar conexões HTTPS** com essa API pela internet. O time propõe usar o NAT Gateway que já existe. Qual solução atende, **mantendo os servidores em sub-rede privada**?',
      concepts: [{ id: 'rt.nat-gateway' }],
      xp: 5,
      difficulty: 3,
      domain: 'd1',
      options: [
        { id: 'a', text: 'Liberar a porta 443 no security group do NAT Gateway.', correct: false, consequence: 'O NAT Gateway não aceita security group, e as conexões por ele sempre começam de dentro da VPC.' },
        { id: 'b', text: 'Criar no NAT Gateway um encaminhamento da porta 443 para a API.', correct: false, consequence: 'O NAT Gateway não faz encaminhamento de portas; ele não recebe conexões iniciadas de fora.' },
        { id: 'c', text: 'Colocar um balanceador em sub-redes públicas na frente da API.', correct: true, consequence: 'O balanceador recebe as conexões do parceiro e repassa aos servidores, que continuam sem IP público.' },
        { id: 'd', text: 'Apontar a rota da sub-rede privada para o internet gateway.', correct: false, consequence: 'Sem IP público, os servidores não seriam alcançados, e a sub-rede deixaria de ser privada.' },
      ],
      explanation: [
        'O NAT Gateway resolve só um sentido: **as conexões sempre começam de dentro** da VPC. Para receber conexões da internet sem expor os servidores, a entrada vai por um **balanceador em sub-redes públicas**, que recebe o HTTPS do parceiro e repassa aos servidores nas sub-redes privadas.',
        'O NAT Gateway não tem security group nem encaminhamento de portas, recursos que só a NAT instance oferece. E apontar a sub-rede para o internet gateway a tornaria pública, além de não funcionar sem IP público nos servidores.',
        '**Regra prática:** NAT é para sair; para entrar, use um balanceador em sub-redes públicas. Se a questão pede que a internet inicie conexões, o NAT Gateway nunca é a resposta.',
      ],
    },
    {
      id: 'rv:net.f02.m3.a2',
      kind: 'decision',
      title: 'Três NATs e todas as rotas para um',
      prompt:
        'Uma empresa criou um NAT Gateway zonal em cada uma de três zonas. Por um erro no modelo de implantação, as tabelas das sub-redes privadas das três zonas mandam 0.0.0.0/0 para o **NAT da zona A**. A empresa quer que a saída **continue se uma zona cair** e quer **evitar a cobrança de tráfego entre zonas**. Qual correção atende?',
      concepts: [{ id: 'rt.nat-per-az' }, { id: 'rt.route-table' }],
      xp: 5,
      difficulty: 3,
      domain: 'd2',
      options: [
        { id: 'a', text: 'Apagar os NATs das zonas B e C, que não recebem tráfego nenhum.', correct: false, consequence: 'Economiza as horas, mas mantém o ponto único de falha na zona A e o tráfego entre zonas.' },
        { id: 'b', text: 'Fazer cada sub-rede privada apontar para o NAT da própria zona.', correct: true, consequence: 'Cada zona sai pelo próprio NAT: a queda de uma não afeta as outras, e o tráfego não cruza zonas.' },
        { id: 'c', text: 'Criar um segundo NAT na zona A e dividir as rotas entre os dois.', correct: false, consequence: 'Os dois NATs ficam na zona A e caem com ela; o tráfego das zonas B e C continua cruzando zonas.' },
        { id: 'd', text: 'Usar uma única tabela para todas as sub-redes privadas, apontando para o NAT da zona A.', correct: false, consequence: 'Simplifica a gestão, mas repete o problema: tudo depende da zona A e cruza zonas.' },
      ],
      explanation: [
        'Cada NAT Gateway zonal é redundante só **dentro da zona dele**. Com todas as rotas para o NAT da zona A, a queda dessa zona tira a saída das zonas B e C, que estavam saudáveis, e, no dia a dia, o tráfego delas cruza zonas e é cobrado por GB em cada sentido. A correção é ter **uma tabela por zona**, cada uma apontando para o NAT da própria zona.',
        'Apagar os NATs de B e C mantém o ponto único de falha. Um segundo NAT na zona A cai junto com ela. E uma tabela única para as três zonas é justamente o que impede cada zona de usar o próprio NAT.',
        '**Regra prática:** um NAT Gateway por zona só protege se cada sub-rede privada usar o NAT da mesma zona, o que pede uma tabela de rotas por zona. O NAT Gateway regional faz essa distribuição sozinho.',
      ],
    },
    {
      id: 'rv:net.f02.nat-no-desenvolvimento',
      kind: 'decision',
      title: 'Saída para a internet no desenvolvimento',
      prompt:
        'O ambiente de desenvolvimento de uma empresa tem sub-redes privadas em três zonas, com pouco tráfego de saída para baixar pacotes. A empresa quer o **menor custo** e aceita que, se uma zona cair, o ambiente fique sem saída até a zona voltar. Os servidores não podem ter IP público. Qual desenho atende?',
      concepts: [{ id: 'rt.nat-per-az' }],
      xp: 5,
      difficulty: 3,
      domain: 'd4',
      options: [
        { id: 'a', text: 'Um NAT Gateway zonal em cada zona, cada sub-rede apontando para o da própria zona.', correct: false, consequence: 'É o desenho de alta disponibilidade, mas paga três NATs por hora, o que o requisito de custo não pede.' },
        { id: 'b', text: 'Um NAT Gateway zonal na zona A, com as sub-redes das três zonas apontando para ele.', correct: true, consequence: 'Paga um NAT só; com pouco tráfego, o custo entre zonas é pequeno, e a perda de saída numa queda foi aceita.' },
        { id: 'c', text: 'IPv4 público nos servidores e rota 0.0.0.0/0 das sub-redes privadas para o internet gateway.', correct: false, consequence: 'Os servidores não podem ter IP público, e a rota para o gateway tornaria as sub-redes públicas.' },
        { id: 'd', text: 'Um egress-only internet gateway para as três zonas, que não tem custo.', correct: false, consequence: 'O egress-only é só para IPv6; não dá saída em IPv4 aos servidores.' },
      ],
      explanation: [
        'Aqui o critério é **custo**, e a empresa aceitou explicitamente perder a saída numa queda de zona. Um NAT Gateway zonal único paga as horas de um NAT só; o tráfego das outras zonas cruza zonas e é cobrado por GB, mas com pouco tráfego essa parcela é pequena. É o desenho que a recomendação de um NAT por zona evita em produção, e que faz sentido quando a disponibilidade não é requisito.',
        'Um NAT por zona triplica as horas pagas para entregar uma disponibilidade que ninguém pediu. IP público nos servidores viola o requisito e tornaria as sub-redes públicas. E o egress-only internet gateway só serve para IPv6.',
        '**Regra prática:** "um NAT por zona" é a resposta quando a questão pede disponibilidade. Quando ela aceita a perda e pede o menor custo, um NAT só pode ser a escolha certa; leia qual requisito manda.',
      ],
    },
    {
      id: 'rv:net.f02.boss.a2',
      kind: 'decision',
      title: 'A NAT instance recriada que não repassa',
      prompt:
        'Uma VPC antiga ainda usa uma NAT instance numa sub-rede pública. Depois de uma falha, ela foi **recriada a partir da mesma AMI**, com o mesmo Elastic IP e a mesma rota nas sub-redes privadas, mas as instâncias privadas continuam sem saída. Os security groups não mudaram. Qual é a causa mais provável?',
      concepts: [{ id: 'rt.nat-instance' }],
      xp: 5,
      difficulty: 1,
      domain: 'd2',
      options: [
        { id: 'a', text: 'A nova instância está com a verificação de origem e destino ligada.', correct: true, consequence: 'Toda instância EC2 nasce com essa verificação ligada; a NAT instance precisa dela desligada para repassar tráfego dos outros.' },
        { id: 'b', text: 'A NAT instance precisa ficar numa sub-rede privada para repassar o tráfego.', correct: false, consequence: 'É o contrário: a NAT instance fica numa sub-rede pública, com saída pelo internet gateway.' },
        { id: 'c', text: 'O tipo da instância tem pouca banda para o tráfego de todas as sub-redes.', correct: false, consequence: 'Banda pouca deixaria a saída lenta, não totalmente parada logo depois da recriação.' },
        { id: 'd', text: 'Falta associar um security group ao NAT Gateway da sub-rede pública.', correct: false, consequence: 'Não há NAT Gateway aqui, e um NAT Gateway nem aceita security group.' },
      ],
      explanation: [
        'Toda instância EC2 confere, por padrão, se é a **origem ou o destino** do tráfego que passa por ela. A NAT instance repassa tráfego de outras instâncias, então essa verificação precisa estar **desligada**. Uma instância nova, mesmo da mesma AMI, nasce com a verificação ligada, e o repasse para.',
        'A NAT instance fica numa sub-rede pública, não numa privada. Falta de banda deixaria a saída lenta, não parada. E não existe NAT Gateway nesse desenho.',
        '**Regra prática:** NAT instance que não repassa tráfego aponta para a verificação de origem e destino ligada. Para não depender desse cuidado, nem de failover feito por script, a AWS recomenda o NAT Gateway.',
      ],
    },
    {
      id: 'rv:net.f02.pilha-dupla',
      kind: 'decision',
      title: 'Saída em IPv4 e IPv6 sem entrada',
      prompt:
        'Servidores numa sub-rede privada têm endereço IPv4 privado e endereço IPv6 fornecido pela AWS. Eles precisam **baixar pacotes da internet pelas duas famílias**, e a internet **não pode iniciar conexões** com eles em nenhuma das duas. A VPC já tem um NAT Gateway numa sub-rede pública. Quais rotas a sub-rede privada deve ter? (Escolha DUAS.)',
      concepts: [{ id: 'rt.eigw' }],
      xp: 5,
      difficulty: 2,
      domain: 'd1',
      multiple: true,
      options: [
        { id: 'a', text: '0.0.0.0/0 para o NAT Gateway.', correct: true, consequence: 'A saída em IPv4 passa pelo NAT, que não aceita conexões iniciadas de fora.' },
        { id: 'b', text: '::/0 para o internet gateway.', correct: false, consequence: 'O IPv6 da AWS é público: com essa rota, a internet poderia iniciar conexões com os servidores.' },
        { id: 'c', text: '::/0 para um egress-only internet gateway.', correct: true, consequence: 'O egress-only deixa os servidores saírem em IPv6 e impede conexões iniciadas pela internet.' },
        { id: 'd', text: '0.0.0.0/0 para um egress-only internet gateway.', correct: false, consequence: 'O egress-only internet gateway só funciona com IPv6; a saída em IPv4 é pelo NAT Gateway.' },
        { id: 'e', text: '0.0.0.0/0 para o internet gateway.', correct: false, consequence: 'Os servidores não têm IPv4 público e não sairiam; a rota ainda tornaria a sub-rede pública.' },
      ],
      explanation: [
        'Cada família de endereços tem seu "só saída". Em IPv4, é o **NAT Gateway**, alvo da rota 0.0.0.0/0. Em IPv6, os endereços da AWS são públicos e não há NAT: o equivalente é o **egress-only internet gateway**, alvo da rota ::/0, que tem estado, deixa as respostas voltarem e bloqueia as conexões iniciadas de fora.',
        'A rota ::/0 para o internet gateway expõe os servidores em IPv6. O egress-only não serve para IPv4. E a rota IPv4 para o internet gateway não funciona sem IP público e tornaria a sub-rede pública.',
        '**Regra prática:** saída sem entrada é NAT Gateway em IPv4 e egress-only internet gateway em IPv6. As rotas das duas famílias são independentes, então a sub-rede precisa de uma para cada.',
      ],
    },
  ],
}
