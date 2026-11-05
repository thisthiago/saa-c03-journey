/**
 * Questões da Revisão da Fase 3 de Redes (segurança dentro da VPC), no
 * formato do exame SAA-C03. Fatos conferidos em docs.aws.amazon.com (ver
 * docs/VERIFICACAO-DE-CONTEUDO.md). As empresas são fictícias.
 */
import type { ReviewSet } from '../../../../engine/types'

export const REVIEW_F03: ReviewSet = {
  phaseId: 'net.f03',
  questions: [
    {
      id: 'rv:net.f03.m1.a3',
      kind: 'decision',
      title: 'Cada camada só fala com a vizinha',
      prompt:
        'Uma aplicação tem três camadas: um Application Load Balancer em sub-redes públicas, servidores de aplicação num grupo do Auto Scaling e um banco de dados, ambos em sub-redes privadas. A segurança exige que **cada camada só aceite conexões da camada imediatamente anterior**, mesmo quando as instâncias mudam de IP. Quais regras atendem? (Escolha DUAS.)',
      concepts: [{ id: 'sg.reference' }],
      xp: 5,
      difficulty: 2,
      domain: 'd1',
      multiple: true,
      options: [
        { id: 'a', text: 'No security group do banco, liberar a porta do banco com origem no grupo da aplicação.', correct: true, consequence: 'Só instâncias do grupo da aplicação chegam ao banco, quaisquer que sejam os IPs delas.' },
        { id: 'b', text: 'No security group do banco, liberar a porta do banco com origem no bloco da VPC.', correct: false, consequence: 'Qualquer recurso da VPC, inclusive o balanceador, passaria a alcançar o banco.' },
        { id: 'c', text: 'No security group da aplicação, liberar a porta dela com origem no grupo do balanceador.', correct: true, consequence: 'Só o balanceador chega aos servidores, e a regra acompanha os nós dele sem listar IPs.' },
        { id: 'd', text: 'No security group da aplicação, liberar a porta dela com origem nos blocos das sub-redes públicas.', correct: false, consequence: 'Qualquer recurso das sub-redes públicas, e não só o balanceador, passaria a alcançar os servidores.' },
        { id: 'e', text: 'No security group do banco, negar a porta do banco com origem no grupo do balanceador.', correct: false, consequence: 'Security group não tem regra de negação; ele só permite.' },
      ],
      explanation: [
        'Uma regra de security group pode ter como origem **outro security group**, e não um bloco de IPs. Assim, "o banco aceita só a aplicação" e "a aplicação aceita só o balanceador" viram duas regras que acompanham sozinhas as instâncias que entram e saem dos grupos, sem depender de IPs.',
        'Liberar por bloco de endereços abre a camada para tudo o que estiver naquele bloco: a VPC inteira ou as sub-redes públicas inteiras. E security group não tem regra de negação: o que não é permitido já fica de fora.',
        '**Regra prática:** em arquiteturas de camadas, cada security group referencia o grupo da camada anterior. Bloco de IPs como origem só faz sentido para quem está fora da VPC.',
      ],
    },
    {
      id: 'rv:net.f03.m1.a2',
      kind: 'decision',
      title: 'O servidor de relatórios e o banco',
      prompt:
        'O security group do banco (sg-db) libera a porta 5432 só para o grupo dos servidores web (sg-web). Um servidor de relatórios novo, no grupo sg-rel e **na mesma sub-rede dos servidores web**, não consegue conectar ao banco. Ele precisa de acesso com o **menor privilégio**. Qual mudança atende?',
      concepts: [{ id: 'sg.reference' }],
      xp: 5,
      difficulty: 1,
      domain: 'd1',
      options: [
        { id: 'a', text: 'Adicionar ao sg-db a porta 5432 com origem no sg-rel.', correct: true, consequence: 'O servidor de relatórios ganha acesso ao banco e nada mais; o resto da sub-rede continua de fora.' },
        { id: 'b', text: 'Colocar o servidor de relatórios também no grupo sg-web.', correct: false, consequence: 'Funciona, mas o servidor herda tudo o que o sg-web libera, como a entrada vinda da internet.' },
        { id: 'c', text: 'Liberar no sg-db a porta 5432 para o bloco da sub-rede.', correct: false, consequence: 'Abre o banco para qualquer recurso da sub-rede, mais do que o necessário.' },
        { id: 'd', text: 'Nada: a mesma sub-rede já dá acesso, e o erro está no banco.', correct: false, consequence: 'A regra do sg-db referencia o grupo sg-web, não a sub-rede; quem está em outro grupo é barrado.' },
      ],
      explanation: [
        'A regra do sg-db tem como origem o **grupo sg-web**, não a sub-rede. Estar na mesma sub-rede não dá acesso: o servidor de relatórios está no sg-rel e é barrado. A mudança com menor privilégio é uma regra nova no sg-db para a porta 5432 com origem no sg-rel.',
        'Entrar no sg-web dá acesso ao banco, mas também tudo o que o sg-web recebe, como o tráfego da internet. Liberar o bloco da sub-rede abre o banco para todos os recursos dela. E a sub-rede comum não dá acesso nenhum.',
        '**Regra prática:** com security groups referenciados, o acesso segue o grupo, não a sub-rede. Para liberar mais um cliente, acrescente o grupo dele à regra do servidor, em vez de colocá-lo num grupo que faz outras coisas.',
      ],
    },
    {
      id: 'rv:net.f03.faixa-atacante',
      kind: 'decision',
      title: 'Uma faixa de endereços atacando o site',
      prompt:
        'Um site público em sub-redes públicas está recebendo um ataque da faixa 203.0.113.0/24. O security group dos servidores libera a porta 443 para 0.0.0.0/0, e a network ACL de entrada da sub-rede tem a regra 100, que permite TCP 443 de 0.0.0.0/0. A empresa quer **bloquear essa faixa** sem tirar o site do ar para os outros clientes. Qual mudança atende?',
      concepts: [{ id: 'sg.nacl' }, { id: 'sg.nacl-order' }],
      xp: 5,
      difficulty: 1,
      domain: 'd1',
      options: [
        { id: 'a', text: 'Uma regra de negação para a faixa no security group dos servidores.', correct: false, consequence: 'Security group só tem regras de permissão; não há como negar uma faixa nele.' },
        { id: 'b', text: 'Na ACL de entrada, uma regra 50 que nega todo o tráfego da faixa.', correct: true, consequence: 'A regra 50 é lida antes da 100: a faixa é negada, e os outros clientes continuam entrando pela 100.' },
        { id: 'c', text: 'Na ACL de entrada, uma regra 150 que nega todo o tráfego da faixa.', correct: false, consequence: 'A regra 100 casa primeiro e permite; a 150 nunca é lida para o tráfego na porta 443.' },
        { id: 'd', text: 'Tirar 0.0.0.0/0 do security group e listar só os IPs dos clientes.', correct: false, consequence: 'Num site público, os clientes não são conhecidos; a mudança tiraria o site do ar para quase todos.' },
      ],
      explanation: [
        'Bloquear uma faixa específica pede uma **regra de negação**, e só a **network ACL** tem esse tipo de regra. Como a ACL avalia as regras do menor número para o maior e para na primeira que casa, a negação precisa ter **número menor** que a regra 100, que permite o 443 para todos.',
        'O security group só permite, então não nega a faixa. Uma negação com número 150 chega tarde: a 100 já permitiu. E trocar 0.0.0.0/0 por uma lista de clientes não funciona num site aberto ao público.',
        '**Regra prática:** "bloquear um IP ou uma faixa" é regra de negação na network ACL, com número menor que as permissões amplas.',
      ],
    },
    {
      id: 'rv:net.f03.boss.a2',
      kind: 'decision',
      title: 'A proposta depois do incidente',
      prompt:
        'Depois de um incidente, um gerente propõe apagar as regras de todos os security groups, deixando-os abertos, e **controlar todo o acesso só pelas network ACLs**, porque elas "também negam". A segurança quer manter o controle **mais preciso e mais fácil de manter** à medida que o Auto Scaling troca as instâncias. Qual avaliação está correta?',
      concepts: [{ id: 'sg.nacl' }, { id: 'sg.stateful-stateless' }],
      xp: 5,
      difficulty: 2,
      domain: 'd1',
      options: [
        { id: 'a', text: 'Aceitar: as ACLs negam, então são o controle mais seguro para usar sozinhas.', correct: false, consequence: 'Negar é útil, mas as ACLs não têm estado nem referência a grupos, e ficam difíceis de manter como controle único.' },
        { id: 'b', text: 'Aceitar, porque as ACLs filtram cada instância e acompanham o Auto Scaling.', correct: false, consequence: 'As ACLs atuam no nível da sub-rede, por blocos de IP; elas não seguem instâncias.' },
        { id: 'c', text: 'Recusar: security group como controle principal, e ACL como segunda camada.', correct: true, consequence: 'Os security groups têm estado e referenciam grupos; a ACL complementa com negações e travas por sub-rede.' },
        { id: 'd', text: 'Recusar, porque uma sub-rede não pode ter network ACL e security group ao mesmo tempo.', correct: false, consequence: 'As duas camadas convivem: a ACL na sub-rede e o security group no recurso.' },
      ],
      explanation: [
        'O controle principal é o **security group**: ele tem estado, então as respostas voltam sozinhas, e pode referenciar outros grupos, o que acompanha as instâncias que o Auto Scaling cria e remove. A **network ACL** é a segunda camada: atua na sub-rede, por blocos de IP, e serve para negar faixas e para travas gerais.',
        'Usar só ACLs obriga a escrever regras nos dois sentidos, incluindo as portas efêmeras, e a manter blocos de IP em vez de grupos. As ACLs não atuam por instância. E as duas camadas convivem em qualquer sub-rede.',
        '**Regra prática:** security group é o controle principal e preciso; network ACL é a defesa extra e grossa, na borda da sub-rede. A prova quase nunca aceita a ACL como controle único.',
      ],
    },
    {
      id: 'rv:net.f03.m2.a1',
      kind: 'decision',
      title: 'A chamada à API externa que não volta',
      prompt:
        'Um servidor numa sub-rede privada chama uma API externa em HTTPS pelo NAT Gateway. A sub-rede usa uma network ACL personalizada com uma regra de saída que permite TCP 443 para 0.0.0.0/0 e, na entrada, só a regra marcada com asterisco. O security group do servidor deixa toda a saída livre. As chamadas **saem, mas as respostas nunca chegam**. Qual mudança corrige?',
      concepts: [{ id: 'sg.stateful-stateless' }, { id: 'sg.ephemeral-ports' }],
      xp: 5,
      difficulty: 3,
      domain: 'd1',
      options: [
        { id: 'a', text: 'Uma regra de entrada no security group do servidor que permita TCP 443.', correct: false, consequence: 'O security group tem estado e já deixa a resposta entrar; quem barra é a ACL da sub-rede.' },
        { id: 'b', text: 'Uma regra de entrada na ACL que permita TCP 443 de 0.0.0.0/0.', correct: false, consequence: 'A resposta não chega na porta 443, e sim na porta efêmera que o servidor escolheu para a conexão.' },
        { id: 'c', text: 'Uma regra de saída na ACL que permita TCP 1024-65535 para 0.0.0.0/0.', correct: false, consequence: 'É a direção contrária: o que falta é deixar a resposta entrar na sub-rede.' },
        { id: 'd', text: 'Uma regra de entrada na ACL que permita TCP 1024-65535 de 0.0.0.0/0.', correct: true, consequence: 'As respostas da API chegam às portas efêmeras do servidor e passam a entrar na sub-rede.' },
      ],
      explanation: [
        'A network ACL **não tem estado**: a resposta é outro pacote e precisa de regra própria, no sentido contrário. Aqui quem inicia é o servidor, então a resposta **entra** na sub-rede, vinda da porta 443 da API, e chega a uma **porta efêmera** do servidor. A regra que falta é de entrada, para a faixa efêmera; 1024-65535 cobre os clientes mais comuns.',
        'O security group tem estado e já aceita a resposta. Uma entrada na porta 443 erra a porta de destino, que é a efêmera do servidor. E uma saída na faixa efêmera é o que se usa quando o servidor recebe conexões, não quando as inicia.',
        '**Regra prática:** na ACL, pense no sentido de quem inicia. Quem recebe conexões precisa de saída para as portas efêmeras do cliente; quem inicia precisa de entrada para as suas próprias portas efêmeras.',
      ],
    },
    {
      id: 'rv:net.f03.m1.a1',
      kind: 'decision',
      title: 'Um security group sem regras de saída',
      prompt:
        'Os servidores web de uma empresa ficam atrás de um security group que permite a entrada TCP 443 de 0.0.0.0/0. Para impedir que os servidores **iniciem conexões para fora**, a segurança removeu todas as regras de saída desse grupo. As network ACLs são as padrão. Qual é o efeito?',
      concepts: [{ id: 'sg.stateful-stateless' }],
      xp: 5,
      difficulty: 2,
      domain: 'd1',
      options: [
        { id: 'a', text: 'O site para de responder, porque as respostas também precisam de regra de saída.', correct: false, consequence: 'O security group tem estado: a resposta a uma entrada permitida sai sem regra de saída.' },
        { id: 'b', text: 'O site continua respondendo, e os servidores não conseguem iniciar conexões.', correct: true, consequence: 'As respostas saem pelo estado da conexão, e as conexões novas para fora deixam de ser permitidas.' },
        { id: 'c', text: 'Nada muda, porque o security group só filtra o tráfego de entrada.', correct: false, consequence: 'O security group tem regras de entrada e de saída; sem as de saída, as conexões iniciadas pelos servidores são barradas.' },
        { id: 'd', text: 'Nada muda, porque a ACL padrão permite tudo e vence o security group.', correct: false, consequence: 'As duas camadas valem ao mesmo tempo: o tráfego precisa passar por ambas.' },
      ],
      explanation: [
        'O security group **tem estado**: quando uma conexão de entrada é permitida, a resposta sai sozinha, sem regra de saída. Sem regras de saída, o que deixa de passar são as **conexões iniciadas pelos servidores**. O site segue respondendo, e o objetivo da segurança é atingido.',
        'A resposta não depende de regra de saída no security group. O grupo filtra os dois sentidos. E a ACL padrão permitir tudo não anula o security group: o tráfego precisa ser aceito pelas duas camadas.',
        '**Regra prática:** no security group, regra de entrada cobre a conversa inteira iniciada de fora, e regra de saída cobre a conversa iniciada de dentro. Na network ACL, cada sentido precisa de regra.',
      ],
    },
    {
      id: 'rv:net.f03.m2.a2',
      kind: 'decision',
      title: 'Cinco conexões contra a mesma ACL',
      prompt:
        'A network ACL de entrada de uma sub-rede está no anexo; a de saída permite todo o tráfego. Os security groups permitem 443 e 22 de qualquer origem. Quais conexões **chegam aos servidores**? (Escolha DUAS.)',
      exhibits: [
        {
          title: 'Regras de entrada da network ACL',
          code: 'Regra  Tipo       Porta  Origem              Ação\n90     TCP        443    203.0.113.0/24      DENY\n100    TCP        443    0.0.0.0/0           ALLOW\n110    TCP        22     198.51.100.0/24     ALLOW\n120    TCP        22     198.51.100.7/32     DENY\n*      Todos      Todas  0.0.0.0/0           DENY',
        },
      ],
      concepts: [{ id: 'sg.nacl-order' }],
      xp: 5,
      difficulty: 3,
      domain: 'd1',
      multiple: true,
      options: [
        { id: 'a', text: 'De 203.0.113.9 para a porta 443.', correct: false, consequence: 'A regra 90 casa primeiro e nega; a permissão da regra 100 nem chega a ser lida.' },
        { id: 'b', text: 'De 198.51.100.7 para a porta 22.', correct: true, consequence: 'A regra 110 casa antes da 120 e permite; a negação do /32 nunca é lida.' },
        { id: 'c', text: 'De 192.0.2.5 para a porta 443.', correct: true, consequence: 'Não casa com a 90; a regra 100 casa e permite.' },
        { id: 'd', text: 'De 192.0.2.5 para a porta 22.', correct: false, consequence: 'Não casa com nenhuma regra numerada, e a regra marcada com asterisco nega.' },
        { id: 'e', text: 'De 203.0.113.9 para a porta 22.', correct: false, consequence: 'Está fora de 198.51.100.0/24; nenhuma regra numerada casa, e a regra com asterisco nega.' },
      ],
      explanation: [
        'A network ACL lê as regras **do menor número para o maior** e para na **primeira que casa**; a regra com asterisco só decide quando nenhuma outra casou. 192.0.2.5 na 443 passa pela 100. 198.51.100.7 na porta 22 casa com a 110, que permite, antes de chegar à 120: a negação mais específica perde porque tem número maior.',
        '203.0.113.9 na 443 casa com a 90 e é negado. Nas conexões na porta 22 vindas de fora de 198.51.100.0/24, nenhuma regra numerada casa, e a regra com asterisco nega.',
        '**Regra prática:** na ACL, o número decide, não a especificidade. Uma negação para um IP precisa de número menor que a permissão da faixa que o contém.',
      ],
    },
    {
      id: 'rv:net.f03.m2.a4',
      kind: 'decision',
      title: 'Uma ACL personalizada sem derrubar o site',
      prompt:
        'Uma sub-rede pública usa a ACL padrão da VPC, que também vale para outras dez sub-redes. A equipe quer negar uma faixa de endereços **só nessa sub-rede**, onde fica um site HTTPS, **sem tirar o site do ar** em nenhum momento. Qual procedimento atende?',
      concepts: [{ id: 'sg.default-nacl' }],
      xp: 5,
      difficulty: 2,
      domain: 'd2',
      options: [
        { id: 'a', text: 'Criar uma ACL personalizada só com a regra de negação e associá-la à sub-rede.', correct: false, consequence: 'Uma ACL personalizada nova nega tudo até receber regras: o site sairia do ar ao associar.' },
        { id: 'b', text: 'Adicionar a regra de negação à ACL padrão da VPC, com número menor que a regra 100.', correct: false, consequence: 'Nega a faixa, mas em todas as onze sub-redes que usam a ACL padrão, e não só nessa.' },
        { id: 'c', text: 'Criar uma ACL personalizada e associá-la, já que ela copia as regras da ACL padrão.', correct: false, consequence: 'A ACL nova não herda as regras 100 e 101 da padrão; nasce negando tudo.' },
        { id: 'd', text: 'Criar uma ACL com a negação, a entrada 443 e a saída efêmera, e só depois associá-la.', correct: true, consequence: 'Quando a associação muda, a ACL já tem o que o site precisa, e a negação vale só nessa sub-rede.' },
      ],
      explanation: [
        'A ACL padrão permite tudo nos dois sentidos, mas uma **ACL personalizada nova nasce negando tudo**: só tem as regras marcadas com asterisco. Para negar a faixa só nessa sub-rede, a ACL personalizada precisa receber **antes da associação** a negação, a entrada na porta 443 e a saída para as portas efêmeras dos clientes, porque a ACL não tem estado.',
        'Associar a ACL só com a negação derruba o site. Mexer na ACL padrão aplica a negação às outras dez sub-redes. E a ACL nova não copia nada da padrão.',
        '**Regra prática:** antes de associar uma ACL personalizada, escreva as regras de entrada e de saída, inclusive as de resposta. Uma ACL personalizada vazia é um bloqueio total.',
      ],
    },
    {
      id: 'rv:net.f03.m2.a5',
      kind: 'decision',
      title: 'Algumas requisições do balanceador falham',
      prompt:
        'Servidores de aplicação numa sub-rede privada recebem tráfego na porta 8080 de um Application Load Balancer nas sub-redes públicas. A ACL da sub-rede privada permite a entrada 8080 vinda das sub-redes públicas e, na saída, só TCP 32768-61000 para elas. **Parte das requisições falha** sem padrão claro, e os security groups estão corretos. Qual mudança corrige?',
      concepts: [{ id: 'sg.ephemeral-ports' }, { id: 'sg.stateful-stateless' }],
      xp: 5,
      difficulty: 3,
      domain: 'd2',
      options: [
        { id: 'a', text: 'Trocar a saída da ACL para TCP 1024-65535, com destino nas sub-redes públicas.', correct: true, consequence: 'O balanceador usa portas efêmeras de 1024 a 65535; com a faixa inteira, todas as respostas voltam.' },
        { id: 'b', text: 'Trocar a saída da ACL para TCP 49152-65535, com destino nas sub-redes públicas.', correct: false, consequence: 'É a faixa do Windows; as respostas para portas do balanceador abaixo de 49152 passariam a falhar.' },
        { id: 'c', text: 'Trocar a saída da ACL para TCP 8080, com destino nas sub-redes públicas.', correct: false, consequence: 'A resposta sai da porta 8080 para a porta efêmera do balanceador; a regra de saída olha a porta de destino.' },
        { id: 'd', text: 'Adicionar ao security group dos servidores a saída 32768-61000 para o balanceador.', correct: false, consequence: 'O security group tem estado e já deixa a resposta sair; quem barra é a ACL.' },
      ],
      explanation: [
        'Quem inicia a conexão escolhe a porta efêmera da resposta, e a faixa depende do cliente. Aqui o cliente é o **balanceador**, que usa **1024-65535**. A regra de saída cobre só 32768-61000, a faixa de muitos Linux: quando o balanceador escolhe uma porta abaixo de 32768, a resposta é negada. Por isso só parte das requisições falha.',
        'A faixa 49152-65535 é a do Windows e deixaria de fora ainda mais portas. A regra de saída olha a porta de destino, que é a efêmera do balanceador, não a 8080. E o security group tem estado e não é o problema.',
        '**Regra prática:** falhas intermitentes com ACL apontam para a faixa efêmera curta demais. O NAT Gateway, o ELB e a Lambda usam 1024-65535.',
      ],
    },
    {
      id: 'rv:net.f03.m3.a1',
      kind: 'decision',
      title: 'Registrar o tráfego rejeitado sem pesar na rede',
      prompt:
        'Uma empresa quer registrar, para todas as sub-redes de uma VPC de alto tráfego, **quais conexões foram aceitas e quais foram rejeitadas**, com origem, destino e portas. O time de desempenho exige que o registro **não aumente a latência nem consuma banda** das instâncias. Qual solução atende com o menor esforço?',
      concepts: [{ id: 'sg.flow-logs' }],
      xp: 5,
      difficulty: 2,
      domain: 'd3',
      options: [
        { id: 'a', text: 'Um agente de captura de pacotes em cada instância, gravando no Amazon S3.', correct: false, consequence: 'Consome CPU e banda das instâncias, exige manutenção em cada uma e guarda conteúdo que ninguém pediu.' },
        { id: 'b', text: 'VPC Flow Logs ligados só à noite, quando o tráfego é menor.', correct: false, consequence: 'Os Flow Logs não afetam a latência em nenhum horário, e o registro ficaria com buracos durante o dia.' },
        { id: 'c', text: 'Um VPC Flow Log na VPC, enviado ao Amazon CloudWatch Logs.', correct: true, consequence: 'Registra ACCEPT e REJECT de todas as interfaces, com a coleta fora do caminho do tráfego.' },
        { id: 'd', text: 'O Reachability Analyzer rodando a cada hora entre todas as instâncias.', correct: false, consequence: 'Ele analisa a configuração, sem registrar o tráfego que de fato passou.' },
      ],
      explanation: [
        'Os **VPC Flow Logs** registram os metadados de cada fluxo (origem, destino, portas, e se foi aceito ou rejeitado) e podem ser criados para a VPC inteira, que cobre todas as sub-redes e interfaces. A coleta fica **fora do caminho do tráfego**, então não aumenta a latência nem consome banda das instâncias.',
        'Um agente em cada instância consome recursos e dá trabalho. Desligar os Flow Logs de dia não ganha nada em desempenho e perde registros. E o Reachability Analyzer analisa configuração, sem registrar o tráfego real.',
        '**Regra prática:** "registrar o tráfego aceito e rejeitado" pede VPC Flow Logs. Eles mostram metadados, não o conteúdo dos pacotes, e o custo fica na ingestão e no armazenamento do destino.',
      ],
    },
    {
      id: 'rv:net.f03.m3.a2',
      kind: 'decision',
      title: 'Por que a instância não alcança a outra',
      prompt:
        'Depois de uma mudança de regras, uma instância de aplicação deixou de alcançar o servidor de cache na porta 6379. Há vários security groups, ACLs e tabelas de rotas envolvidos. A equipe quer descobrir **qual componente bloqueia o caminho, sem enviar tráfego** e sem afrouxar nenhuma regra. O que usar?',
      concepts: [{ id: 'sg.reachability-analyzer' }],
      xp: 5,
      difficulty: 1,
      domain: 'd2',
      options: [
        { id: 'a', text: 'O Reachability Analyzer, da aplicação ao cache.', correct: true, consequence: 'Ele analisa a configuração e aponta o componente que bloqueia, sem enviar nenhum pacote.' },
        { id: 'b', text: 'VPC Flow Logs nas duas interfaces, por um dia.', correct: false, consequence: 'Os Flow Logs só registram tráfego que passou; sem enviar tráfego, não há o que registrar.' },
        { id: 'c', text: 'Abrir todas as portas por uma hora e observar.', correct: false, consequence: 'Afrouxa a segurança, o que o pedido proíbe, e não explica qual regra bloqueava.' },
        { id: 'd', text: 'O histórico de eventos do AWS CloudTrail da conta.', correct: false, consequence: 'Mostra quem mudou o quê, mas não calcula se o caminho existe nem qual componente o bloqueia.' },
      ],
      explanation: [
        'O **Reachability Analyzer** analisa a configuração entre uma origem e um destino, **sem enviar pacotes**. Quando o caminho não existe, ele aponta o componente que bloqueia: security group, network ACL, tabela de rotas ou balanceador. Quando existe, mostra o caminho salto a salto.',
        'Flow Logs dependem de tráfego real. Abrir portas viola o pedido e não explica a causa. O CloudTrail ajuda a saber quem fez a mudança, mas não diz qual componente bloqueia o caminho.',
        '**Regra prática:** "descobrir por que A não alcança B sem gerar tráfego" é Reachability Analyzer; "registrar o tráfego que passou" é Flow Logs.',
      ],
    },
    {
      id: 'rv:net.f03.mesma-sub-rede',
      kind: 'decision',
      title: 'A ACL que não separa dois servidores',
      prompt:
        'Um servidor de testes e um servidor de pagamentos ficam **na mesma sub-rede**. Para impedir que o de testes alcance o de pagamentos, a equipe adicionou à network ACL da sub-rede uma regra de negação com o IP do servidor de testes como origem, mas o acesso continua. Qual solução **bloqueia esse acesso**?',
      concepts: [{ id: 'sg.nacl' }],
      xp: 5,
      difficulty: 3,
      domain: 'd1',
      options: [
        { id: 'a', text: 'Dar à regra de negação um número menor que o de todas as permissões da ACL.', correct: false, consequence: 'O número não importa aqui: a ACL nem avalia o tráfego que não sai da sub-rede.' },
        { id: 'b', text: 'Repetir a mesma regra de negação também nas regras de saída da ACL da sub-rede.', correct: false, consequence: 'A ACL só filtra o que entra e sai da sub-rede; o tráfego entre os dois servidores fica dentro dela.' },
        { id: 'c', text: 'Ajustar o security group do servidor de pagamentos para recusar o de testes.', correct: true, consequence: 'O security group atua no recurso e filtra até o tráfego dentro da mesma sub-rede.' },
        { id: 'd', text: 'Criar uma rota na tabela da sub-rede que descarte o IP do servidor de testes.', correct: false, consequence: 'A tabela de rotas escolhe para onde o tráfego vai, não filtra: não há alvo que descarte os pacotes de um endereço.' },
      ],
      explanation: [
        'A network ACL avalia o tráfego **quando ele entra ou sai da sub-rede**, não dentro dela. Dois servidores na mesma sub-rede conversam sem passar pela ACL, por isso a negação não teve efeito. O **security group**, que atua em cada recurso, filtra esse tráfego: basta que o grupo do servidor de pagamentos não aceite o servidor de testes.',
        'Mudar o número da regra ou repeti-la na saída não muda o fato de que a ACL não vê esse tráfego. E a tabela de rotas escolhe caminhos, não filtra tráfego.',
        '**Regra prática:** para separar recursos da mesma sub-rede, use security groups. A ACL só serve para o tráfego que cruza a borda da sub-rede; para usá-la, os recursos precisariam estar em sub-redes diferentes.',
      ],
    },
  ],
}
