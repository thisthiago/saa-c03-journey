/**
 * Questões da Revisão da Fase 6 de Redes (conectividade híbrida), no formato
 * do exame SAA-C03. Fatos conferidos em docs.aws.amazon.com (ver
 * docs/VERIFICACAO-DE-CONTEUDO.md). Prazos de parceiros são premissas dos
 * cenários. As empresas são fictícias.
 */
import type { ReviewSet } from '../../../../engine/types'

export const REVIEW_F06: ReviewSet = {
  phaseId: 'net.f06',
  questions: [
    {
      id: 'rv:net.f06.m1.a1',
      kind: 'decision',
      title: 'Uma migração que começa em três dias',
      prompt:
        'Uma empresa vai migrar um ERP para a AWS. A cópia inicial começa **em três dias** e precisa de cerca de 300 Mbps criptografados. Depois da migração, a operação vai trocar **5 Gbps o tempo todo** com o data center, com **latência estável**, sem passar pela internet. Quais soluções atendem às duas fases? (Escolha DUAS.)',
      concepts: [{ id: 'hyb.site-to-site-vpn' }, { id: 'hyb.direct-connect' }],
      xp: 5,
      difficulty: 2,
      domain: 'd2',
      multiple: true,
      options: [
        { id: 'a', text: 'Uma Site-to-Site VPN para a cópia inicial.', correct: true, consequence: 'Fica pronta rapidamente, criptografa com IPsec e atende os 300 Mbps pela internet.' },
        { id: 'b', text: 'Um Direct Connect dedicado de 10 Gbps para a operação.', correct: true, consequence: 'Caminho dedicado, fora da internet, com banda previsível e latência estável para os 5 Gbps.' },
        { id: 'c', text: 'Um Direct Connect dedicado para a cópia inicial.', correct: false, consequence: 'O pedido passa por revisão e depende do circuito do parceiro: não fica pronto em três dias.' },
        { id: 'd', text: 'Uma VPN acelerada para a operação.', correct: false, consequence: 'Melhora o caminho, mas a VPN continua passando pela internet, que o requisito da operação proíbe.' },
        { id: 'e', text: 'Uma AWS Client VPN para a operação.', correct: false, consequence: 'A Client VPN liga pessoas, não um data center inteiro.' },
      ],
      explanation: [
        'As duas fases têm requisitos diferentes. Para começar **em três dias**, a **Site-to-Site VPN** é a resposta: fica pronta rápido, cria túneis IPsec criptografados e atende 300 Mbps. Para a operação, com **banda alta, latência estável e fora da internet**, o **Direct Connect** é o caminho, e uma porta dedicada de 10 Gbps cobre os 5 Gbps.',
        'O Direct Connect não fica pronto em três dias: o pedido é revisado e o circuito depende de parceiro. A VPN acelerada continua passando pela internet. E a Client VPN é para pessoas, não para redes inteiras.',
        '**Regra prática:** "rapidamente e criptografado" pede Site-to-Site VPN; "dedicado, latência estável, sem internet" pede Direct Connect. Quando a questão tem as duas necessidades, a resposta usa a VPN agora e o Direct Connect depois.',
      ],
    },
    {
      id: 'rv:net.f06.dois-tuneis',
      kind: 'decision',
      title: 'A VPN que caiu na manutenção',
      prompt:
        'A Site-to-Site VPN de uma filial caiu por alguns minutos durante uma manutenção da AWS. Ao investigar, a equipe viu que o roteador da filial tinha **só um dos túneis da conexão configurado**. A empresa quer que a próxima manutenção **não derrube a conexão**, com o menor custo. Qual mudança atende?',
      concepts: [{ id: 'hyb.site-to-site-vpn' }],
      xp: 5,
      difficulty: 1,
      domain: 'd2',
      options: [
        { id: 'a', text: 'Criar uma segunda conexão VPN para a mesma filial.', correct: false, consequence: 'Paga mais uma conexão por hora sem necessidade: a conexão atual já tem dois túneis.' },
        { id: 'b', text: 'Configurar o segundo túnel no roteador da filial.', correct: true, consequence: 'Com os dois túneis ativos, a manutenção de um não interrompe o tráfego.' },
        { id: 'c', text: 'Contratar um Direct Connect como reserva da VPN.', correct: false, consequence: 'Muito mais caro e demorado, para um problema que o túnel já pago resolve.' },
        { id: 'd', text: 'Trocar a conexão atual por uma VPN acelerada.', correct: false, consequence: 'Melhora o caminho pela internet, mas um túnel só continua sendo um ponto único de falha.' },
      ],
      explanation: [
        'Cada conexão Site-to-Site VPN tem **dois túneis**, justamente para alta disponibilidade: quando a AWS faz manutenção num, o outro segue. Com só um túnel configurado no roteador da empresa, a manutenção derruba a conexão. Configurar o segundo túnel resolve sem custo extra.',
        'Uma segunda conexão e um Direct Connect custam mais e não são necessários. A VPN acelerada não acrescenta o túnel que falta.',
        '**Regra prática:** VPN da AWS sempre traz dois túneis. Configure os dois no customer gateway; um túnel só é um ponto único de falha.',
      ],
    },
    {
      id: 'rv:net.f06.vpn-acelerada',
      kind: 'decision',
      title: 'Uma filial do outro lado do mundo',
      prompt:
        'Uma filial na Ásia usa uma Site-to-Site VPN até uma VPC na Virgínia. O caminho pela internet tem **latência variável e perdas de pacote** em horários de pico. A empresa quer **melhorar o desempenho da VPN** sem contratar um link dedicado. Qual solução atende?',
      concepts: [{ id: 'hyb.site-to-site-vpn' }],
      xp: 5,
      difficulty: 2,
      domain: 'd3',
      options: [
        { id: 'a', text: 'Um Direct Connect hospedado de 500 Mbps no lugar da VPN.', correct: false, consequence: 'É um link dedicado, que a empresa quer evitar, e leva tempo para ficar pronto.' },
        { id: 'b', text: 'Uma VPN acelerada, que usa o AWS Global Accelerator.', correct: true, consequence: 'O tráfego entra na rede da AWS num ponto perto da filial e evita boa parte da internet.' },
        { id: 'c', text: 'Uma AWS Client VPN para cada computador da filial.', correct: false, consequence: 'Liga pessoas uma a uma e continua passando pela internet do mesmo jeito.' },
        { id: 'd', text: 'Uma segunda VPN, com os dois túneis ativos em cada uma.', correct: false, consequence: 'Dá redundância, mas as duas atravessam a mesma internet, com a mesma latência variável.' },
      ],
      explanation: [
        'A **VPN acelerada** usa o **AWS Global Accelerator**: o tráfego da filial entra na rede global da AWS num ponto próximo e segue por ela até a Região, em vez de atravessar a internet inteira. Isso melhora a latência e reduz perdas sem um link dedicado; os aceleradores são cobrados à parte.',
        'O Direct Connect é o link dedicado que a empresa quer evitar. A Client VPN é para pessoas. E mais VPNs pela mesma internet não tornam o caminho mais estável.',
        '**Regra prática:** VPN com distância grande e latência instável, sem link dedicado, pede VPN acelerada. Com exigência de latência estável e sem internet, a resposta passa a ser o Direct Connect.',
      ],
    },
    {
      id: 'rv:net.f06.m1.a3',
      kind: 'decision',
      title: 'Quatro VPNs e a banda de uma',
      prompt:
        'Para chegar a cerca de 4 Gbps até a AWS, uma fábrica ligou **quatro conexões VPN a um Transit Gateway** com ECMP habilitado. As VPNs usam **rotas estáticas**. Mesmo assim, o tráfego não passa da banda de um túnel. Qual mudança faz a banda das VPNs **se somar**?',
      concepts: [{ id: 'hyb.vpn-bandwidth' }],
      xp: 5,
      difficulty: 3,
      domain: 'd3',
      options: [
        { id: 'a', text: 'Trocar o Transit Gateway por um virtual private gateway.', correct: false, consequence: 'O ECMP para somar VPNs é recurso do Transit Gateway; o virtual private gateway não soma conexões.' },
        { id: 'b', text: 'Acrescentar mais quatro VPNs, também com rotas estáticas.', correct: false, consequence: 'Com rotas estáticas, o ECMP continua sem dividir o tráfego, por mais VPNs que existam.' },
        { id: 'c', text: 'Passar as VPNs para roteamento dinâmico, com BGP.', correct: true, consequence: 'Com BGP, o Transit Gateway distribui o tráfego entre os túneis e as bandas se somam.' },
        { id: 'd', text: 'Desligar o ECMP e deixar o Transit Gateway escolher a VPN.', correct: false, consequence: 'Sem ECMP, o tráfego vai por um caminho só, que é exatamente o limite atual.' },
      ],
      explanation: [
        'Um túnel padrão leva até 1,25 Gbps. Para somar a banda de várias VPNs, o Transit Gateway usa **ECMP**, que divide o tráfego entre caminhos de mesmo custo. Mas o ECMP **não funciona com VPN de roteamento estático**: as VPNs precisam de **BGP**. Com o roteamento dinâmico, os túneis passam a carregar tráfego ao mesmo tempo.',
        'O virtual private gateway não soma VPNs. Mais VPNs estáticas repetem o problema. E desligar o ECMP fixa o tráfego num caminho só.',
        '**Regra prática:** somar banda de VPN pede três peças juntas: Transit Gateway, ECMP e BGP. Faltando qualquer uma, a banda fica na de um túnel.',
      ],
    },
    {
      id: 'rv:net.f06.cobranca-da-porta',
      kind: 'decision',
      title: 'A porta paga antes do circuito',
      prompt:
        'Uma empresa pediu uma conexão dedicada do Direct Connect e recebeu a carta de autorização (LOA-CFA) no dia 1º de março. O parceiro que vai levar o circuito até o local do Direct Connect atrasou, e a porta ainda não ficou ativa. O financeiro quer saber **quando a cobrança por hora da porta começa**. Qual resposta está correta?',
      concepts: [{ id: 'hyb.direct-connect' }],
      xp: 5,
      difficulty: 2,
      domain: 'd4',
      options: [
        { id: 'a', text: 'Só quando a porta ficar ativa, qualquer que seja o atraso do parceiro.', correct: false, consequence: 'Há um prazo-limite: passados 90 dias da LOA-CFA, a porta é cobrada mesmo inativa.' },
        { id: 'b', text: 'No dia do pedido da conexão, antes mesmo da revisão feita pela AWS.', correct: false, consequence: 'O pedido e a revisão não iniciam a cobrança da porta.' },
        { id: 'c', text: 'Na ativação ou 90 dias após a LOA-CFA, o que vier primeiro.', correct: true, consequence: 'Se o atraso passar de 90 dias desde 1º de março, a porta começa a ser cobrada mesmo sem circuito.' },
        { id: 'd', text: 'Só quando o primeiro byte de dados passar pela conexão.', correct: false, consequence: 'A porta é cobrada por hora; os dados são uma cobrança separada, pela saída.' },
      ],
      explanation: [
        'A cobrança por hora da porta dedicada começa **quando ela fica ativa ou 90 dias depois da emissão da LOA-CFA, o que vier primeiro**. Um atraso longo do parceiro não adia a conta para sempre: depois de 90 dias, a porta é cobrada mesmo sem o circuito pronto.',
        'O pedido não inicia a cobrança, e ela não espera o primeiro byte: o Direct Connect cobra a porta por hora e a saída de dados à parte.',
        '**Regra prática:** no planejamento do Direct Connect, o prazo do circuito pesa no custo. A porta começa a ser cobrada na ativação ou 90 dias depois da LOA-CFA, o que acontecer antes.',
      ],
    },
    {
      id: 'rv:net.f06.porta-pequena',
      kind: 'decision',
      title: 'A porta de 1 Gbps ficou pequena',
      prompt:
        'Uma empresa tem uma **conexão dedicada de 1 Gbps** do Direct Connect, contratada por ela diretamente com a AWS. O tráfego cresceu e ela precisa de **10 Gbps** pelo Direct Connect, com latência estável. Qual caminho atende?',
      concepts: [{ id: 'hyb.direct-connect' }],
      xp: 5,
      difficulty: 2,
      domain: 'd3',
      options: [
        { id: 'a', text: 'Alterar a velocidade da conexão de 1 para 10 Gbps no console.', correct: false, consequence: 'A velocidade de uma conexão dedicada não muda depois do pedido.' },
        { id: 'b', text: 'Pedir ao parceiro do Direct Connect que aumente a banda.', correct: false, consequence: 'Só a conexão hospedada tem a velocidade mudada pelo parceiro; esta é dedicada.' },
        { id: 'c', text: 'Somar nove VPNs à conexão de 1 Gbps, num Transit Gateway com ECMP.', correct: false, consequence: 'As VPNs passam pela internet, sem a latência estável pedida.' },
        { id: 'd', text: 'Pedir uma conexão dedicada nova, de 10 Gbps, e migrar para ela.', correct: true, consequence: 'A porta nova tem a velocidade necessária; depois da migração, a de 1 Gbps pode ser cancelada.' },
      ],
      explanation: [
        'Na **conexão dedicada**, a velocidade da porta (1, 10, 100 ou 400 Gbps) **não muda depois do pedido**. Para passar a 10 Gbps, a empresa pede uma conexão nova dessa velocidade, migra as interfaces virtuais e o tráfego para ela e, depois, cancela a antiga.',
        'Não há ajuste de velocidade no console para a dedicada. O parceiro só muda a velocidade de conexões hospedadas. E VPNs pela internet não dão latência estável.',
        '**Regra prática:** escolha a velocidade da porta dedicada pensando no crescimento; trocar de velocidade significa uma conexão nova.',
      ],
    },
    {
      id: 'rv:net.f06.m2.a1',
      kind: 'decision',
      title: 'Duas interfaces sobre o mesmo cabo',
      prompt:
        'Uma empresa tem um Direct Connect dedicado e precisa, pela mesma conexão e **sem passar pela internet**, de dois acessos: chegar à **VPC do ERP por IP privado** e enviar arquivos ao **Amazon S3** pelos endereços públicos do serviço. Quais interfaces virtuais atendem? (Escolha DUAS.)',
      concepts: [{ id: 'hyb.vif' }],
      xp: 5,
      difficulty: 1,
      domain: 'd3',
      multiple: true,
      options: [
        { id: 'a', text: 'Uma interface virtual privada para a VPC do ERP.', correct: true, consequence: 'A VIF privada chega à VPC por IP privado.' },
        { id: 'b', text: 'Uma interface virtual pública para o S3.', correct: true, consequence: 'A VIF pública alcança os serviços públicos da AWS, como o S3, sem passar pela internet.' },
        { id: 'c', text: 'Uma interface virtual de trânsito para o S3.', correct: false, consequence: 'A VIF de trânsito chega a Transit Gateways, não aos serviços públicos.' },
        { id: 'd', text: 'Uma interface virtual pública para a VPC do ERP.', correct: false, consequence: 'A VIF pública não chega aos IPs privados de uma VPC.' },
        { id: 'e', text: 'Uma interface virtual privada para o S3.', correct: false, consequence: 'A VIF privada leva a uma VPC; os endereços públicos do S3 são alcançados pela VIF pública.' },
      ],
      explanation: [
        'Sobre a conexão física, cada destino pede um tipo de **interface virtual (VIF)**. A **privada** chega a uma VPC por IP privado. A **pública** chega aos serviços públicos da AWS, como o S3, em todas as Regiões públicas. A **de trânsito** chega a Transit Gateways por um Direct Connect gateway.',
        'A VIF de trânsito não leva aos serviços públicos. A pública não chega aos IPs privados da VPC. E a privada não alcança os endereços públicos do S3.',
        '**Regra prática:** para escolher a VIF, leia o destino: VPC, privada; serviço público, pública; Transit Gateway, de trânsito.',
      ],
    },
    {
      id: 'rv:net.f06.m2.a2',
      kind: 'decision',
      title: 'Duas Regiões no mesmo Direct Connect gateway',
      prompt:
        'Uma empresa usa um Direct Connect gateway para chegar, com um só link, a uma VPC em sa-east-1 e a outra em us-east-1. Agora as duas VPCs também precisam **conversar entre si por endereços privados**, sem que o tráfego **passe pelo data center**. Os blocos não se sobrepõem. Qual solução atende?',
      concepts: [{ id: 'hyb.dx-gateway' }],
      xp: 5,
      difficulty: 3,
      domain: 'd2',
      options: [
        { id: 'a', text: 'Nenhuma: o Direct Connect gateway já roteia entre as VPCs associadas.', correct: false, consequence: 'O Direct Connect gateway não serve de passagem entre as VPCs associadas a ele.' },
        { id: 'b', text: 'Um segundo Direct Connect gateway, só para ligar as duas VPCs.', correct: false, consequence: 'Nenhum Direct Connect gateway liga VPCs entre si, qualquer que seja a quantidade.' },
        { id: 'c', text: 'Rotas nas duas VPCs apontando uma para a outra pelo Direct Connect.', correct: false, consequence: 'Mesmo que funcionasse, o tráfego passaria pelo data center, o que o requisito proíbe.' },
        { id: 'd', text: 'Um peering entre as duas VPCs, com rotas nos dois lados.', correct: true, consequence: 'O peering entre Regiões liga as duas VPCs diretamente, por endereços privados.' },
      ],
      explanation: [
        'O **Direct Connect gateway** liga a conexão a VPCs de várias Regiões e contas, mas **não é passagem entre as VPCs associadas**: cada uma fala com o data center, não com as outras. Para as duas conversarem diretamente, o caminho é um **peering entre Regiões**, com rotas nos dois lados.',
        'Nenhum Direct Connect gateway roteia entre VPCs. E mandar o tráfego pelo Direct Connect faria ele passar pelo data center, contra o requisito.',
        '**Regra prática:** Direct Connect gateway liga o data center a muitas VPCs, nunca as VPCs entre si. Para isso, use peering ou Transit Gateway.',
      ],
    },
    {
      id: 'rv:net.f06.m2.a3',
      kind: 'decision',
      title: 'Criptografia numa conexão hospedada',
      prompt:
        'Uma empresa usa uma **conexão hospedada de 500 Mbps** do Direct Connect, entregue por um parceiro. A auditoria passou a exigir que **o tráfego entre o data center e a VPC seja criptografado**. Qual solução atende?',
      concepts: [{ id: 'hyb.dx-encryption' }],
      xp: 5,
      difficulty: 3,
      domain: 'd1',
      options: [
        { id: 'a', text: 'Habilitar o MACsec na conexão hospedada.', correct: false, consequence: 'O MACsec não está disponível em conexões hospedadas.' },
        { id: 'b', text: 'Nada: o Direct Connect não passa pela internet.', correct: false, consequence: 'Privado não quer dizer criptografado: o tráfego do Direct Connect não é criptografado por padrão.' },
        { id: 'c', text: 'Uma VPN IPsec por dentro do Direct Connect.', correct: true, consequence: 'Os túneis IPsec criptografam o tráfego, e o caminho continua sendo o Direct Connect.' },
        { id: 'd', text: 'Trocar por uma dedicada de 1 Gbps com MACsec.', correct: false, consequence: 'O MACsec só existe em dedicadas de 10, 100 ou 400 Gbps; a de 1 Gbps não tem.' },
      ],
      explanation: [
        'O caminho do Direct Connect é privado, mas **não é criptografado por padrão**. Há duas formas de criptografar: o **MACsec**, só em conexões **dedicadas** de 10, 100 ou 400 Gbps, e uma **VPN IPsec por dentro do Direct Connect**, que vale para qualquer conexão. Numa hospedada, a VPN é o caminho.',
        'A hospedada não aceita MACsec. "Não passa pela internet" não é o mesmo que criptografado. E uma dedicada de 1 Gbps também não tem MACsec.',
        '**Regra prática:** Direct Connect criptografado é MACsec (dedicada de 10 Gbps ou mais) ou VPN IPsec por dentro do link. Conexão hospedada ou dedicada de 1 Gbps ficam com a VPN.',
      ],
    },
    {
      id: 'rv:net.f06.m3.a1',
      kind: 'decision',
      title: 'Um SLA de 99,99% no Direct Connect',
      prompt:
        'Um sistema de pagamentos depende do Direct Connect, e a diretoria exige o modelo do Resiliency Toolkit que dá direito ao **SLA de 99,99%**, para resistir à falha de um dispositivo e à de um local inteiro. Qual arquitetura atende?',
      concepts: [{ id: 'hyb.dx-resiliency' }],
      xp: 5,
      difficulty: 3,
      domain: 'd2',
      options: [
        { id: 'a', text: 'Uma conexão em cada um de dois locais do Direct Connect.', correct: false, consequence: 'É o modelo de alta resiliência, com SLA de 99,9%: resiste a um local, mas não chega aos 99,99%.' },
        { id: 'b', text: 'Duas conexões em dispositivos separados, num local só do Direct Connect.', correct: false, consequence: 'É o modelo de desenvolvimento e teste: resiste a um dispositivo, mas não à queda do local.' },
        { id: 'c', text: 'Conexões em dispositivos separados, em mais de um local.', correct: true, consequence: 'É o modelo de resiliência máxima, que dá direito ao SLA de 99,99%.' },
        { id: 'd', text: 'Uma conexão de 100 Gbps, com uma VPN de reserva.', correct: false, consequence: 'A VPN mantém o tráfego com menos banda, mas o modelo não dá direito ao SLA de 99,99%.' },
      ],
      explanation: [
        'O Resiliency Toolkit tem três modelos. A **resiliência máxima** usa conexões em **dispositivos separados em mais de um local** e dá direito ao **SLA de 99,99%**. A alta resiliência, com uma conexão em cada um de dois locais, fica em 99,9%. O de desenvolvimento e teste usa dois dispositivos num local só.',
        'Uma conexão por local resiste à queda de um local, mas não atinge o SLA pedido. Dois dispositivos no mesmo local caem juntos com o prédio. E uma VPN de reserva mantém a ligação com menos banda, sem o SLA de 99,99%.',
        '**Regra prática:** "99,99%" ou "resiliência máxima" pede dispositivos separados em mais de um local. "Mais barato que continue funcionando" pede uma VPN de reserva.',
      ],
    },
    {
      id: 'rv:net.f06.m3.a2',
      kind: 'decision',
      title: 'Quando o link privado cair',
      prompt:
        'Um laboratório usa um Direct Connect de 1 Gbps e tem **orçamento curto**. Se o link cair, basta que os sistemas **continuem funcionando, ainda que mais devagar**, até o link voltar. Qual reserva atende com o **menor custo**?',
      concepts: [{ id: 'hyb.dx-resiliency' }],
      xp: 5,
      difficulty: 1,
      domain: 'd4',
      options: [
        { id: 'a', text: 'Uma Site-to-Site VPN de reserva, pela internet.', correct: true, consequence: 'Custa pouco e assume se o Direct Connect cair, com menos banda e latência variável.' },
        { id: 'b', text: 'Um segundo Direct Connect, em outro local.', correct: false, consequence: 'Resiste melhor, mas custa muito mais do que o laboratório precisa.' },
        { id: 'c', text: 'Uma segunda porta, no mesmo local do Direct Connect.', correct: false, consequence: 'Custa outra porta e ainda cai junto se o local inteiro ficar fora.' },
        { id: 'd', text: 'Trocar a porta de 1 Gbps por uma de 10 Gbps.', correct: false, consequence: 'Mais banda não é reserva: a conexão continua sendo um ponto único de falha.' },
      ],
      explanation: [
        'O requisito aceita menos desempenho durante a falha e pede o **menor custo**. Uma **Site-to-Site VPN de reserva** cobra por hora de conexão e pelos dados, bem menos que outro Direct Connect, e assume o tráfego se o link cair, com menos banda e pela internet.',
        'Outro Direct Connect, no mesmo local ou em outro, custa muito mais. E uma porta maior não cria reserva nenhuma.',
        '**Regra prática:** "reserva mais barata para o Direct Connect" é uma VPN. "Resistir à queda de um local" ou "SLA alto" pede conexões em locais diferentes.',
      ],
    },
    {
      id: 'rv:net.f06.m3.a3',
      kind: 'decision',
      title: 'Cada grupo vê só a sua rede',
      prompt:
        'Funcionários de uma empresa trabalham de casa. Os **engenheiros** precisam acessar só a rede da fábrica, ligada à AWS por VPN, e o **financeiro** só a VPC de finanças. Todos se autenticam pelo Active Directory da empresa. Qual solução atende com o **menor esforço**?',
      concepts: [{ id: 'hyb.client-vpn' }],
      xp: 5,
      difficulty: 2,
      domain: 'd1',
      options: [
        { id: 'a', text: 'Uma Site-to-Site VPN para a casa de cada funcionário.', correct: false, consequence: 'A Site-to-Site liga redes, com um roteador em cada ponta; não é feita para pessoas.' },
        { id: 'b', text: 'Uma AWS Client VPN com regras de autorização por grupo do Active Directory.', correct: true, consequence: 'Um único endpoint autentica pelo AD, e cada grupo só chega às redes que as regras liberam.' },
        { id: 'c', text: 'Uma AWS Client VPN e security groups liberando os IPs de casa de cada pessoa.', correct: false, consequence: 'Os IPs de casa mudam e não dizem a que grupo a pessoa pertence; a manutenção seria constante.' },
        { id: 'd', text: 'Um Direct Connect hospedado para cada grupo de funcionários.', correct: false, consequence: 'O Direct Connect liga locais, não pessoas espalhadas em casa.' },
      ],
      explanation: [
        'A **Client VPN** atende pessoas: cada uma conecta o próprio computador e se autentica, aqui pelo Active Directory. As **regras de autorização** definem quais grupos chegam a cada rede: engenheiros à rede da fábrica e financeiro à VPC de finanças, num único endpoint gerenciado.',
        'A Site-to-Site VPN e o Direct Connect ligam locais, não pessoas. E controlar por IP de casa é frágil e trabalhoso, além de não refletir o grupo de cada um.',
        '**Regra prática:** funcionários remotos acessando a VPC é Client VPN; acesso diferente por grupo vem das regras de autorização ligadas ao diretório.',
      ],
    },
  ],
}
