/**
 * Questões da Revisão da Fase 4 de Redes (conectando VPCs), no formato do
 * exame SAA-C03. Fatos conferidos em docs.aws.amazon.com (ver
 * docs/VERIFICACAO-DE-CONTEUDO.md). As empresas são fictícias.
 */
import type { ReviewSet } from '../../../../engine/types'

export const REVIEW_F04: ReviewSet = {
  phaseId: 'net.f04',
  questions: [
    {
      id: 'rv:net.f04.m3.a1',
      kind: 'decision',
      title: 'Duas VPCs que precisam conversar',
      prompt:
        'Uma seguradora tem duas VPCs na mesma Região, com blocos que não se sobrepõem: a de sinistros precisa consultar uma API na de análise, por endereços privados. Nenhuma outra rede está envolvida, nem deve estar no futuro próximo. A empresa quer a solução de **menor custo**. Qual atende?',
      concepts: [{ id: 'tgw.peering-vs-tgw' }, { id: 'tgw.peering' }],
      xp: 5,
      difficulty: 1,
      domain: 'd4',
      options: [
        { id: 'a', text: 'Um Transit Gateway com as duas VPCs anexadas.', correct: false, consequence: 'Funciona, mas cobra por hora de cada anexo e por GB processado, sem necessidade para duas VPCs.' },
        { id: 'b', text: 'Um peering entre as VPCs, com rotas nos dois lados.', correct: true, consequence: 'Liga as duas por endereços privados, sem gateway e sem custo por hora.' },
        { id: 'c', text: 'IPs públicos na API, acessados pelos internet gateways.', correct: false, consequence: 'O tráfego deixa de ser privado e ainda paga IPv4 público por hora.' },
        { id: 'd', text: 'Uma VPN site a site entre as duas VPCs.', correct: false, consequence: 'É feita para ligar a rede da empresa; entre duas VPCs, paga por hora e dá mais trabalho que o peering.' },
      ],
      explanation: [
        'Para **poucas VPCs** que só precisam falar entre si, o **peering** é a resposta de menor custo: liga as VPCs por endereços privados, sem gateway e sem cobrança por hora. Basta pedir, aceitar e criar as rotas para o bloco vizinho nos dois lados.',
        'O Transit Gateway funciona, mas cobra hora de anexo e GB processado, o que só se justifica com muitas VPCs ou conexões compartilhadas. IP público expõe a API e paga IPv4. E uma VPN entre VPCs é mais cara e trabalhosa que o peering.',
        '**Regra prática:** duas ou poucas VPCs, sem centralização: peering. Muitas VPCs, rede da empresa compartilhada ou isolamento por tabelas: Transit Gateway.',
      ],
    },
    {
      id: 'rv:net.f04.peering-sem-rotas',
      kind: 'decision',
      title: 'O peering aceito que não passa nada',
      prompt:
        'A VPC A (10.10.0.0/16) pediu um peering à VPC B (10.20.0.0/16), da mesma Região, e B aceitou. Os security groups dos dois lados já permitem o tráfego, mas as instâncias **ainda não se alcançam**. Quais mudanças resolvem? (Escolha DUAS.)',
      concepts: [{ id: 'tgw.peering' }],
      xp: 5,
      difficulty: 2,
      domain: 'd2',
      multiple: true,
      options: [
        { id: 'a', text: 'Na tabela das sub-redes de A, a rota 10.20.0.0/16 para o peering.', correct: true, consequence: 'O tráfego de A para B passa a ter caminho pelo peering.' },
        { id: 'b', text: 'Um segundo peering, pedido por B, para o sentido de volta.', correct: false, consequence: 'Só pode haver um peering entre o mesmo par de VPCs, e ele já serve aos dois sentidos.' },
        { id: 'c', text: 'Na tabela das sub-redes de B, a rota 10.10.0.0/16 para o peering.', correct: true, consequence: 'A resposta de B para A passa a ter caminho, e B também pode iniciar conexões.' },
        { id: 'd', text: 'Um internet gateway em cada VPC, para o tráfego entre elas.', correct: false, consequence: 'O peering é privado e não usa internet gateway.' },
        { id: 'e', text: 'Um NAT Gateway em A, para traduzir os endereços enviados para B.', correct: false, consequence: 'Com blocos diferentes, não há o que traduzir; e o NAT não recebe tráfego vindo por peering.' },
      ],
      explanation: [
        'Aceitar o peering só cria a ligação. Para o tráfego passar, **cada lado precisa de uma rota** para o bloco do vizinho apontando para o peering: em A, 10.20.0.0/16; em B, 10.10.0.0/16. Sem a rota de volta, nem as respostas chegam.',
        'Um segundo peering não é permitido entre o mesmo par, nem necessário. Internet gateway e NAT não participam do peering, que é privado e direto entre as VPCs.',
        '**Regra prática:** peering funcionando pede três coisas: o pedido aceito, rotas nos dois lados e security groups que permitam o tráfego.',
      ],
    },
    {
      id: 'rv:net.f04.grupo-da-vizinha',
      kind: 'decision',
      title: 'O banco do outro lado do peering',
      prompt:
        'Os servidores de aplicação, num grupo do Auto Scaling da VPC A, acessam um banco na VPC B pelo peering. As duas VPCs ficam na mesma Região e na mesma conta, e os IPs dos servidores mudam o tempo todo. A segurança quer que o banco aceite **só os servidores de aplicação**, com o **menor esforço de manutenção**. Qual regra no security group do banco atende?',
      concepts: [{ id: 'tgw.peering' }],
      xp: 5,
      difficulty: 3,
      domain: 'd1',
      options: [
        { id: 'a', text: 'A porta do banco com origem no bloco inteiro da VPC A.', correct: false, consequence: 'Qualquer recurso da VPC A passaria a alcançar o banco, não só a aplicação.' },
        { id: 'b', text: 'A porta do banco com origem no security group da aplicação, na VPC A.', correct: true, consequence: 'Num peering da mesma Região, o grupo da VPC vizinha pode ser referenciado e acompanha o Auto Scaling.' },
        { id: 'c', text: 'A porta do banco com origem nos IPs atuais dos servidores, revistos a cada mudança.', correct: false, consequence: 'Funciona por um tempo, mas exige manutenção a cada instância nova, o oposto do pedido.' },
        { id: 'd', text: 'A porta do banco aberta, e uma network ACL que nega o resto da VPC A.', correct: false, consequence: 'A ACL trabalha com blocos de IP, não com instâncias, e os servidores mudam de IP.' },
      ],
      explanation: [
        'Num peering **na mesma Região**, um security group pode **referenciar um grupo da VPC vizinha**. Assim, a regra do banco aceita quem estiver no grupo da aplicação, e o Auto Scaling pode criar e remover servidores sem que ninguém mexa na regra.',
        'Liberar o bloco da VPC A abre o banco para recursos que não precisam dele. Listar IPs exige manutenção constante. E a ACL, que só conhece blocos de IP, não acompanha instâncias que trocam de endereço.',
        '**Regra prática:** a referência entre security groups atravessa o peering quando as VPCs estão na mesma Região. Entre Regiões, a origem precisa ser um bloco de IPs.',
      ],
    },
    {
      id: 'rv:net.f04.m1.a1',
      kind: 'decision',
      title: 'Três VPCs ligadas só à central',
      prompt:
        'Uma VPC central (A) tem peering com as VPCs B, C e D. Agora **B, C e D precisam conversar entre si**, e a empresa quer continuar só com peering, porque ele não cobra por hora. Qual mudança atende?',
      concepts: [{ id: 'tgw.non-transitive' }],
      xp: 5,
      difficulty: 2,
      domain: 'd2',
      options: [
        { id: 'a', text: 'Nenhum peering novo: em B, C e D, rotas para as outras apontando para o peering com A.', correct: false, consequence: 'O peering não é transitivo: o tráfego de B para C não passa por A, qualquer que seja a rota.' },
        { id: 'b', text: 'Um peering novo, entre B e D, porque C já alcança as duas pela A.', correct: false, consequence: 'C não alcança ninguém pela A; cada par que precisa conversar precisa do próprio peering.' },
        { id: 'c', text: 'Três peerings novos, B–C, B–D e C–D, com rotas nos dois lados de cada um.', correct: true, consequence: 'Cada par passa a ter ligação direta, e os peerings com A continuam como estão.' },
        { id: 'd', text: 'Seis peerings, recriando também os três que já existem com a VPC A.', correct: false, consequence: 'Os peerings com A já funcionam; recriá-los não muda nada e nem é permitido duplicar um par.' },
      ],
      explanation: [
        'O peering **não é transitivo**: se A está ligada a B e a C, B não alcança C passando por A. Para B, C e D conversarem entre si, cada par precisa de um peering próprio: B–C, B–D e C–D, com rotas nos dois lados.',
        'Rotas apontando para o peering com A não criam trânsito. C não tem caminho para ninguém além de A. E os peerings com A já servem e não podem ser duplicados.',
        '**Regra prática:** com peering, todo par que conversa precisa da própria ligação. Uma VPC central com peerings para todas não faz as outras conversarem; para isso, existe o Transit Gateway.',
      ],
    },
    {
      id: 'rv:net.f04.m1.a4',
      kind: 'decision',
      title: 'De dez para vinte VPCs',
      prompt:
        'Uma empresa liga hoje 10 VPCs numa malha completa de peering, para que todas conversem com todas. O número de VPCs vai **dobrar para 20**, e a equipe quer comparar quantas conexões teria de **criar e manter** em cada desenho. Qual comparação está correta?',
      concepts: [{ id: 'tgw.non-transitive' }, { id: 'tgw.peering-vs-tgw' }],
      xp: 5,
      difficulty: 2,
      domain: 'd3',
      options: [
        { id: 'a', text: 'Peering: 90 conexões; Transit Gateway: 20 anexos.', correct: false, consequence: '90 é o dobro dos 45 de hoje, mas a malha cresce mais que o número de VPCs: são 20 × 19 ÷ 2 = 190.' },
        { id: 'b', text: 'Peering: 190 conexões; Transit Gateway: 20 anexos.', correct: true, consequence: 'A malha de 20 VPCs pede 190 peerings; no Transit Gateway, cada VPC se anexa uma vez.' },
        { id: 'c', text: 'Peering: 190 conexões; Transit Gateway: 190 anexos.', correct: false, consequence: 'O Transit Gateway roteia entre os anexos: cada VPC precisa de um só, não de um por par.' },
        { id: 'd', text: 'Peering: 20 conexões; Transit Gateway: 1 anexo.', correct: false, consequence: 'Peering não é transitivo, então 20 conexões não ligam todos os pares; e cada VPC precisa do próprio anexo.' },
      ],
      explanation: [
        'Com peering, todo par precisa da própria conexão: a malha de n VPCs tem **n × (n − 1) ÷ 2** peerings. Para 20 VPCs, são 190, e cada uma também precisa de rotas para as outras 19. No **Transit Gateway**, cada VPC se anexa **uma vez**, e ele roteia entre todas: 20 anexos.',
        'A malha não cresce na mesma proporção das VPCs: dobrar as VPCs quase quadruplica os peerings. E o Transit Gateway não precisa de um anexo por par, nem de um anexo só para todas.',
        '**Regra prática:** a malha de peering cresce com o quadrado do número de VPCs. Quando a questão fala em dezenas de VPCs conversando entre si, a resposta tende ao Transit Gateway.',
      ],
    },
    {
      id: 'rv:net.f04.m1.a2',
      kind: 'decision',
      title: 'A VPN que só uma VPC usa',
      prompt:
        'A VPN com o escritório termina na VPC de sinistros. A VPC de análise tem peering com a de sinistros e **precisa alcançar o escritório**. Outras VPCs vão precisar do mesmo nos próximos meses, e a empresa quer **uma conexão com o escritório compartilhada por todas**. Qual solução atende?',
      concepts: [{ id: 'tgw.edge-to-edge' }, { id: 'tgw.transit-gateway' }],
      xp: 5,
      difficulty: 2,
      domain: 'd2',
      options: [
        { id: 'a', text: 'Na VPC de análise, uma rota para o escritório apontando para o peering com sinistros.', correct: false, consequence: 'Não há roteamento de borda a borda: pelo peering, a VPC de análise não usa a VPN de sinistros.' },
        { id: 'b', text: 'Um Transit Gateway com a VPN e as VPCs anexadas, com as rotas para o escritório.', correct: true, consequence: 'A VPN passa a terminar no Transit Gateway, e toda VPC anexada alcança o escritório por ela.' },
        { id: 'c', text: 'Uma VPN do escritório para cada VPC, criada conforme as VPCs forem chegando.', correct: false, consequence: 'Funciona, mas multiplica as VPNs a manter, contra o pedido de uma conexão compartilhada.' },
        { id: 'd', text: 'Um NAT Gateway na VPC de sinistros, para repassar o tráfego vindo do peering.', correct: false, consequence: 'O NAT Gateway não aceita tráfego que chega por peering, nem é feito para chegar à VPN.' },
      ],
      explanation: [
        'Pelo peering, uma VPC **não usa as bordas da vizinha**: internet gateway, NAT, VPN ou Direct Connect. A VPC de análise não alcança o escritório pela VPN de sinistros, qualquer que seja a rota. Para compartilhar uma conexão com o escritório, ela passa a terminar num **Transit Gateway**, ao qual as VPCs se anexam.',
        'A rota pelo peering não funciona. Uma VPN por VPC funciona, mas é o oposto de uma conexão compartilhada. E o NAT Gateway não aceita tráfego vindo de peering.',
        '**Regra prática:** "várias VPCs usando a mesma VPN ou a mesma saída" pede Transit Gateway. Peering liga só as duas VPCs, nunca as bordas delas.',
      ],
    },
    {
      id: 'rv:net.f04.nat-da-vizinha',
      kind: 'decision',
      title: 'Usar o NAT da VPC vizinha',
      prompt:
        'A VPC A tem um NAT Gateway que dá saída à internet para as suas sub-redes privadas. A VPC B, ligada a A por peering, tem servidores privados que precisam **baixar atualizações da internet**. Para economizar, alguém propõe que B use o NAT de A. São só essas duas VPCs. Qual solução **funciona**?',
      concepts: [{ id: 'tgw.edge-to-edge' }],
      xp: 5,
      difficulty: 2,
      domain: 'd2',
      options: [
        { id: 'a', text: 'Em B, a rota 0.0.0.0/0 para o peering; em A, nada muda.', correct: false, consequence: 'O tráfego chega a A, mas não segue para o NAT: não há roteamento de borda a borda pelo peering.' },
        { id: 'b', text: 'Em B, a rota 0.0.0.0/0 para o peering; em A, uma rota para o NAT.', correct: false, consequence: 'O NAT Gateway não aceita tráfego que chega por peering, qualquer que seja a rota em A.' },
        { id: 'c', text: 'Um NAT Gateway na própria VPC B, para as sub-redes privadas dela.', correct: true, consequence: 'Cada VPC tem a sua saída; a VPC B passa a sair pelo próprio NAT.' },
        { id: 'd', text: 'IPv4 público nos servidores de B, saindo pelo internet gateway de A.', correct: false, consequence: 'Recursos de B não usam o internet gateway de A pelo peering.' },
      ],
      explanation: [
        'O peering liga as duas VPCs, mas **não deixa uma usar a borda da outra**: o NAT Gateway e o internet gateway de A não servem ao tráfego que vem de B. Além disso, o NAT Gateway não aceita tráfego que chega por peering. Com duas VPCs só, a solução é um **NAT na própria VPC B**.',
        'Nenhuma rota faz o tráfego de B atravessar a borda de A, nem o internet gateway de A atende recursos de B.',
        '**Regra prática:** com peering, cada VPC precisa da própria saída. Para centralizar a saída de muitas VPCs, o caminho é o Transit Gateway, não o peering.',
      ],
    },
    {
      id: 'rv:net.f04.m1.a3',
      kind: 'decision',
      title: 'O peering com os blocos secundários',
      prompt:
        'A VPC de uma seguradora tem o bloco primário 10.1.0.0/16 e o secundário 10.50.0.0/16. A VPC de uma corretora comprada tem 10.1.0.0/16 e 172.20.0.0/16. O time propõe criar um peering e **rotear só entre 10.50.0.0/16 e 172.20.0.0/16**, que não se sobrepõem. Qual avaliação está correta?',
      concepts: [{ id: 'tgw.overlap' }],
      xp: 5,
      difficulty: 3,
      domain: 'd2',
      options: [
        { id: 'a', text: 'Funciona, desde que as rotas cubram só os blocos secundários.', correct: false, consequence: 'O problema surge antes das rotas: o peering nem é criado quando algum bloco se sobrepõe.' },
        { id: 'b', text: 'Não funciona: um bloco sobreposto nas duas VPCs impede o peering.', correct: true, consequence: 'Os primários iguais bastam para o peering ser recusado, mesmo que só os outros blocos fossem usados.' },
        { id: 'c', text: 'Funciona, desde que o peering seja pedido pela VPC da corretora.', correct: false, consequence: 'Quem pede não importa; a sobreposição impede o peering nos dois sentidos.' },
        { id: 'd', text: 'Funciona se as VPCs ficarem em Regiões diferentes.', correct: false, consequence: 'A regra da sobreposição vale também entre Regiões.' },
      ],
      explanation: [
        'Peering não aceita VPCs com blocos **iguais ou sobrepostos**, e a regra olha **todos os blocos IPv4** das duas VPCs. Como os primários são iguais (10.1.0.0/16), o peering é recusado, mesmo que a intenção seja usar só os blocos secundários, que não se sobrepõem.',
        'As rotas nem chegam a existir, porque o peering não é criado. Quem faz o pedido e em que Região as VPCs ficam não mudam a regra.',
        '**Regra prática:** qualquer sobreposição entre os blocos das duas VPCs impede o peering. Quando as redes já se sobrepõem, a saída é mudar o endereçamento de uma delas ou expor só o serviço necessário, sem rotear entre as redes, como mostra a fase de acesso privado a serviços.',
      ],
    },
    {
      id: 'rv:net.f04.plano-de-blocos',
      kind: 'decision',
      title: 'O bloco padrão em toda VPC',
      prompt:
        'Os times de uma empresa criam VPCs em contas novas com o bloco padrão do assistente, 10.0.0.0/16. Agora a empresa vai **ligar todas essas VPCs entre si e ao escritório**, e outras contas virão. Qual medida evita que o problema se repita nas **próximas VPCs**?',
      concepts: [{ id: 'tgw.overlap' }],
      xp: 5,
      difficulty: 1,
      domain: 'd3',
      options: [
        { id: 'a', text: 'Manter o bloco padrão e ligar tudo por Transit Gateway, que resolve a sobreposição.', correct: false, consequence: 'No Transit Gateway, blocos iguais também entram em conflito nas rotas.' },
        { id: 'b', text: 'Manter o bloco padrão e usar peering, que tolera sobreposições parciais.', correct: false, consequence: 'O peering recusa qualquer sobreposição, mesmo parcial.' },
        { id: 'c', text: 'Definir um plano de endereços com um bloco único para cada VPC nova.', correct: true, consequence: 'Sem sobreposição, as VPCs novas podem ser ligadas por peering ou Transit Gateway quando for preciso.' },
        { id: 'd', text: 'Adicionar um bloco secundário diferente a cada VPC e ligar só esses blocos.', correct: false, consequence: 'Os primários continuam iguais: o peering é recusado e as rotas do Transit Gateway entram em conflito.' },
      ],
      explanation: [
        'Blocos iguais ou sobrepostos impedem o peering e entram em conflito nas rotas do Transit Gateway. A medida que evita o problema é **planejar os endereços antes**: cada VPC nova recebe um bloco que não se sobrepõe a nenhuma outra rede da empresa, incluindo o escritório.',
        'Nem o Transit Gateway nem o peering resolvem sobreposição. E blocos secundários não salvam VPCs cujos primários são iguais.',
        '**Regra prática:** endereçamento se planeja antes de criar as VPCs. Refazer uma rede depois que ela está em uso custa muito mais.',
      ],
    },
    {
      id: 'rv:net.f04.contas-da-organizacao',
      kind: 'decision',
      title: 'Um ponto único de roteamento',
      prompt:
        'Uma empresa tem VPCs em 12 contas da mesma organização, todas na mesma Região e com blocos sem sobreposição. A equipe de rede, na conta central, quer que **todas as VPCs se liguem a um único ponto** de roteamento que ela administra, com o **menor esforço** para as contas. Qual solução atende?',
      concepts: [{ id: 'tgw.transit-gateway' }],
      xp: 5,
      difficulty: 2,
      domain: 'd2',
      options: [
        { id: 'a', text: 'Um Transit Gateway em cada conta, ligados entre si por peering de Transit Gateway.', correct: false, consequence: 'Cria doze roteadores para manter, quando o pedido é um ponto central único.' },
        { id: 'b', text: 'Um Transit Gateway na conta central, compartilhado com as contas pelo AWS RAM.', correct: true, consequence: 'Cada conta anexa a própria VPC ao Transit Gateway central, que a equipe de rede administra.' },
        { id: 'c', text: 'Peering entre a VPC da conta central e cada uma das outras onze VPCs.', correct: false, consequence: 'O peering não é transitivo: as onze VPCs não conversariam entre si pela central.' },
        { id: 'd', text: 'Uma VPN de cada VPC até a conta central, terminando numa instância de roteamento.', correct: false, consequence: 'Cria uma peça a operar e um ponto de falha, com muito mais esforço que um serviço gerenciado.' },
      ],
      explanation: [
        'O **Transit Gateway** pode ser **compartilhado com outras contas pelo AWS RAM**. A equipe de rede cria e administra um só, na conta central, e cada conta anexa a própria VPC a ele. Todas passam a se alcançar por um ponto único, conforme as tabelas de rotas que a equipe definir.',
        'Um Transit Gateway por conta multiplica o que há para manter. Peering com a VPC central não faz as outras conversarem, porque não é transitivo. E uma instância de roteamento com VPNs é trabalho e risco que um serviço gerenciado evita.',
        '**Regra prática:** rede central para muitas contas é um Transit Gateway compartilhado pelo RAM, com as VPCs de cada conta anexadas a ele.',
      ],
    },
    {
      id: 'rv:net.f04.m2.a3',
      kind: 'decision',
      title: 'Os servidores da zona B sem o Transit Gateway',
      prompt:
        'Uma VPC com servidores nas zonas A e B foi anexada a um Transit Gateway escolhendo **só uma sub-rede da zona A**. As tabelas das sub-redes das duas zonas têm a rota para o Transit Gateway, mas os servidores da zona B **não alcançam** as outras VPCs. A empresa quer que as duas zonas funcionem e que a falha de uma não afete a outra. Qual mudança atende?',
      concepts: [{ id: 'tgw.transit-gateway' }],
      xp: 5,
      difficulty: 1,
      domain: 'd2',
      options: [
        { id: 'a', text: 'Mover os servidores da zona B para a zona A.', correct: false, consequence: 'Faz os servidores alcançarem o Transit Gateway, mas concentra tudo numa zona só, contra o requisito.' },
        { id: 'b', text: 'Criar um segundo Transit Gateway para a zona B.', correct: false, consequence: 'O Transit Gateway é regional; o que limita as zonas é o anexo, não o gateway.' },
        { id: 'c', text: 'Incluir no anexo uma sub-rede da zona B.', correct: true, consequence: 'Com uma sub-rede de cada zona no anexo, as duas zonas alcançam o Transit Gateway de forma independente.' },
        { id: 'd', text: 'Trocar a rota da zona B para o peering com a zona A.', correct: false, consequence: 'Zonas da mesma VPC não têm peering entre si; elas já se alcançam pela rota local.' },
      ],
      explanation: [
        'O Transit Gateway é regional, mas o **anexo de VPC usa uma sub-rede por zona**, e só recursos de zonas com sub-rede no anexo alcançam o gateway. Incluir uma sub-rede da zona B no anexo resolve, e cada zona passa a ter o próprio caminho, sem depender da outra.',
        'Mover os servidores para a zona A elimina a alta disponibilidade. Um segundo Transit Gateway não é necessário. E não existe peering entre zonas da mesma VPC.',
        '**Regra prática:** ao anexar uma VPC a um Transit Gateway, escolha uma sub-rede em cada zona que precise alcançá-lo.',
      ],
    },
    {
      id: 'rv:net.f04.m2.a1',
      kind: 'decision',
      title: 'Quem alcança quem no Transit Gateway',
      prompt:
        'Um Transit Gateway tem quatro VPCs anexadas: Prod, Dev1, Dev2 e Shared. As tabelas de rotas dele estão no anexo. Considerando também a volta de cada conexão, quais comunicações **funcionam**? (Escolha DUAS.)',
      exhibits: [
        {
          title: 'Tabelas de rotas do Transit Gateway',
          code: 'Tabela      Associada a      Rotas propagadas de\nrt-prod     Prod             Shared\nrt-dev      Dev1, Dev2       Shared\nrt-shared   Shared           Prod, Dev1, Dev2',
        },
      ],
      concepts: [{ id: 'tgw.route-tables' }],
      xp: 5,
      difficulty: 3,
      domain: 'd1',
      multiple: true,
      options: [
        { id: 'a', text: 'Dev1 com Shared.', correct: true, consequence: 'A rt-dev tem a rota de Shared, e a rt-shared tem a rota de Dev1: ida e volta funcionam.' },
        { id: 'b', text: 'Dev1 com Prod.', correct: false, consequence: 'A rt-dev não tem rota para Prod, e o Transit Gateway descarta o tráfego.' },
        { id: 'c', text: 'Prod com Shared.', correct: true, consequence: 'A rt-prod tem a rota de Shared, e a rt-shared tem a rota de Prod.' },
        { id: 'd', text: 'Dev1 com Dev2.', correct: false, consequence: 'Estar na mesma tabela não basta: a rt-dev só recebe as rotas de Shared, não as de Dev2.' },
        { id: 'e', text: 'Prod com Dev2.', correct: false, consequence: 'Nem a rt-prod tem rota para Dev2, nem a rt-dev tem rota para Prod.' },
      ],
      explanation: [
        'Cada anexo é **associado** a uma tabela, que decide para onde ele pode mandar, e **propaga** as próprias rotas para as tabelas escolhidas. Uma conversa funciona quando a tabela de cada lado tem a rota do outro. Dev1 e Prod alcançam Shared, e a tabela de Shared tem as rotas de todos: ida e volta funcionam.',
        'Dev1 não alcança Prod, porque a rt-dev não tem essa rota. Dev1 e Dev2 dividem a mesma tabela, mas ela só recebe as rotas de Shared, então uma não alcança a outra. O mesmo vale para Prod e Dev2.',
        '**Regra prática:** no Transit Gateway, siga a associação para achar a tabela de quem envia e confira a rota do destino; depois, faça o mesmo no sentido da volta. Estar na mesma tabela não liga duas VPCs.',
      ],
    },
    {
      id: 'rv:net.f04.blackhole',
      kind: 'decision',
      title: 'Uma propagação que não pode ser desligada agora',
      prompt:
        'Por um erro de automação que só será corrigido no mês que vem, a VPC de desenvolvimento (10.30.0.0/16) propaga suas rotas para a tabela do Transit Gateway usada pelas **dez VPCs de produção**. A segurança exige que produção **pare de alcançar desenvolvimento** hoje, com uma mudança num lugar só, sem mexer na propagação. Qual mudança atende?',
      concepts: [{ id: 'tgw.route-tables' }],
      xp: 5,
      difficulty: 3,
      domain: 'd1',
      options: [
        { id: 'a', text: 'Na tabela de produção, uma rota estática blackhole para 10.30.0.0/16.', correct: true, consequence: 'A estática vence a propagada de mesmo destino, e a blackhole descarta o tráfego para desenvolvimento.' },
        { id: 'b', text: 'Na tabela de produção, uma rota estática blackhole para 10.0.0.0/8.', correct: false, consequence: 'A propagada 10.30.0.0/16 é mais específica e continua vencendo; o tráfego segue para desenvolvimento.' },
        { id: 'c', text: 'Na tabela de produção, uma rota estática de 10.30.0.0/16 para o anexo da VPC Shared.', correct: false, consequence: 'Desvia o tráfego para outra VPC em vez de descartá-lo, o que não é o pedido.' },
        { id: 'd', text: 'Uma regra de negação para 10.30.0.0/16 na network ACL de cada sub-rede de produção.', correct: false, consequence: 'Bloqueia, mas exige mudanças em todas as sub-redes das dez VPCs, e não num lugar só.' },
      ],
      explanation: [
        'Duas regras das tabelas do Transit Gateway resolvem o caso. No empate de destino, a **rota estática vence a propagada**. E uma rota **blackhole descarta** o tráfego que casa com ela. Uma estática blackhole para 10.30.0.0/16, na tabela de produção, vence a propagação de desenvolvimento e bloqueia o caminho com uma única mudança.',
        'Uma blackhole para 10.0.0.0/8 perde para a propagada, que é mais específica. Uma estática para outro anexo desvia o tráfego em vez de descartá-lo. E ACLs em cada sub-rede de dez VPCs são o oposto de "um lugar só".',
        '**Regra prática:** para cortar um destino no Transit Gateway sem mexer nas propagações, use uma rota estática blackhole com o mesmo prefixo, ou mais específico, que a rota a anular.',
      ],
    },
  ],
}
