/**
 * Questões da Revisão da Fase 1 de Computação (EC2 essencial), no formato do
 * exame SAA-C03. Fatos conferidos em 20/10/2026 e 03/11/2026 (ver
 * docs/VERIFICACAO-DE-CONTEUDO.md). As empresas são fictícias.
 */
import type { ReviewSet } from '../../../../engine/types'

export const REVIEW_F01: ReviewSet = {
  phaseId: 'cmp.f01',
  questions: [
    {
      id: 'rv:cmp.f01.sinais-de-ec2',
      kind: 'decision',
      title: 'Requisitos que pedem um servidor próprio',
      prompt:
        'Uma empresa de logística vai migrar um sistema de rastreamento e está comparando instâncias EC2 com serviços em que a AWS gerencia o sistema operacional. A lista de requisitos do sistema tem cinco itens. Quais deles, sozinhos, **levam à escolha de instâncias EC2**? (Escolha DUAS.)',
      concepts: [{ id: 'ec2.instance' }],
      xp: 5,
      difficulty: 1,
      domain: 'd3',
      multiple: true,
      options: [
        { id: 'a', text: 'Um agente de um fornecedor que instala um módulo no kernel e exige acesso root.', correct: true, consequence: 'Só com o sistema operacional sob seu controle dá para instalar módulos de kernel e ter acesso root.' },
        { id: 'b', text: 'Pagar só pelas requisições atendidas, sem custo quando não há uso.', correct: false, consequence: 'Esse é o sinal de um serviço sem servidor; uma instância ligada cobra pelo tempo, com ou sem requisições.' },
        { id: 'c', text: 'Um processo que roda sem parar por dias, mantendo conexões abertas.', correct: true, consequence: 'Cargas de longa duração cabem numa instância, que roda o tempo que for preciso.' },
        { id: 'd', text: 'Nenhuma equipe dedicada a aplicar patches no sistema operacional.', correct: false, consequence: 'No EC2, os patches do sistema operacional são responsabilidade do cliente; esse requisito aponta para um serviço gerenciado.' },
        { id: 'e', text: 'Escalar até zero nas madrugadas, quando ninguém usa o sistema.', correct: false, consequence: 'Escalar a zero sem esforço é característica dos serviços sem servidor, não de uma frota de instâncias.' },
      ],
      explanation: [
        'Uma instância EC2 é um servidor virtual em que **você controla o sistema operacional**. Ela é a resposta quando o requisito exige software específico instalado no sistema, como um módulo de kernel com acesso root, ou cargas de **longa duração**, como um processo que roda por dias com conexões abertas.',
        'Os outros três requisitos apontam para o lado oposto: pagar só pelo uso, não cuidar de patches e escalar a zero são vantagens dos serviços em que a AWS gerencia o sistema operacional. No EC2, você responde pelo sistema convidado, pelos patches, pelo software e pelos security groups.',
        '**Regra prática:** controle do sistema operacional, software específico ou carga de longa duração levam ao EC2. "Menor esforço operacional" e "sem gerenciar servidores" levam a comparar com os serviços sem servidor e gerenciados.',
      ],
    },
    {
      id: 'rv:cmp.f01.mudar-de-zona',
      kind: 'decision',
      title: 'Levar a instância para outra zona',
      prompt:
        'Uma instância EC2 de uma transportadora roda numa subnet da zona us-east-1a, com volume raiz EBS e o software configurado à mão ao longo de meses. Para ficar perto de um novo servidor da empresa, a instância precisa passar a rodar na zona **us-east-1b**, da mesma Região, **sem reconfigurar o software do zero**. Qual caminho atende?',
      concepts: [{ id: 'ec2.instance' }, { id: 'ec2.ami' }],
      xp: 5,
      difficulty: 2,
      domain: 'd2',
      options: [
        { id: 'a', text: 'Parar a instância e iniciá-la de novo escolhendo uma subnet da us-east-1b.', correct: false, consequence: 'Stop e start mantêm o IPv4 privado, que pertence à subnet: a instância volta na mesma subnet e na mesma zona.' },
        { id: 'b', text: 'Criar uma AMI da instância e lançar uma instância nova numa subnet da us-east-1b.', correct: true, consequence: 'A AMI leva o volume raiz com todo o software, e a instância nova nasce na zona escolhida.' },
        { id: 'c', text: 'Criar uma AMI da instância e copiá-la para a us-east-1b antes de lançar.', correct: false, consequence: 'A AMI vale para a Região inteira: não existe cópia por zona, só entre Regiões.' },
        { id: 'd', text: 'Anexar à instância uma interface de rede criada numa subnet da us-east-1b.', correct: false, consequence: 'Uma interface de rede só pode ser anexada a instâncias da mesma zona; e a instância continuaria rodando na us-east-1a.' },
      ],
      explanation: [
        'A instância fica presa à zona da subnet onde foi lançada. O caminho para outra zona é **criar uma AMI** a partir dela, o que leva o volume raiz com o software já configurado, e **lançar uma instância nova** numa subnet da zona de destino. Como a AMI vale para toda a Região, ela já pode ser usada na us-east-1b sem cópia.',
        'Parar e iniciar não troca a subnet: a instância mantém o IPv4 privado, que é da subnet original. Copiar a AMI só faz sentido para outra Região. E uma interface de rede de outra zona nem pode ser anexada; mesmo que pudesse, a instância continuaria rodando onde está.',
        '**Regra prática:** mudar a instância de zona é recriá-la: AMI da instância atual e lançamento na subnet da zona nova. Copiar a AMI é para levar a instância a outra Região.',
      ],
    },
    {
      id: 'rv:cmp.f01.ami-arm',
      kind: 'decision',
      title: 'A AMI que não sobe no Graviton',
      prompt:
        'Para **reduzir custo**, uma editora quer trocar suas instâncias por tipos com processador AWS Graviton, de arquitetura Arm. Todas as instâncias nascem de uma AMI própria, criada a partir de uma instância x86_64 com o servidor de aplicação instalado. Ao tentar lançar um tipo Graviton com essa AMI, a equipe não consegue. Qual caminho resolve?',
      concepts: [{ id: 'ec2.ami' }],
      xp: 5,
      difficulty: 2,
      domain: 'd4',
      options: [
        { id: 'a', text: 'Criar a AMI de novo a partir da mesma instância x86_64, agora marcando o tipo Graviton como destino.', correct: false, consequence: 'A AMI herda a arquitetura da instância de origem: continuaria x86_64.' },
        { id: 'b', text: 'Copiar a AMI para uma Região com mais tipos Graviton disponíveis.', correct: false, consequence: 'A cópia mantém a arquitetura da AMI; o problema não é a Região.' },
        { id: 'c', text: 'Parar uma instância x86_64 e trocar o tipo dela para um tipo Graviton.', correct: false, consequence: 'O tipo novo precisa ser compatível com a arquitetura da AMI de origem; x86_64 não roda num processador Arm.' },
        { id: 'd', text: 'Instalar o software numa instância Graviton com AMI Arm e criar uma AMI nova dela.', correct: true, consequence: 'A AMI nova é arm64 e serve de origem para todos os lançamentos em tipos Graviton.' },
      ],
      explanation: [
        'Uma AMI é específica de uma **arquitetura de processador**, além da Região e do sistema operacional. A AMI da editora é x86_64 e não roda num processador Arm. O caminho é preparar o software numa instância Graviton, lançada de uma AMI arm64 (da AWS ou do Marketplace), e criar dela uma AMI própria para os lançamentos seguintes.',
        'Recriar a AMI a partir da instância x86_64 gera outra imagem x86_64. Copiar para outra Região muda o lugar, não a arquitetura. E trocar o tipo de uma instância parada só funciona entre tipos compatíveis com a arquitetura da AMI de origem.',
        '**Regra prática:** migrar para Graviton exige AMI arm64 e software compilado para Arm. Antes de comparar preços, confira se tudo o que roda na instância tem versão para essa arquitetura.',
      ],
    },
    {
      id: 'rv:cmp.f01.config-por-ambiente',
      kind: 'decision',
      title: 'Uma AMI para três ambientes',
      prompt:
        'Uma startup usa a mesma AMI, com o servidor de aplicação já instalado, nos ambientes de desenvolvimento, homologação e produção. A única diferença entre eles é o endereço do banco de dados e o nível de log, que precisam ser **definidos no lançamento de cada instância**. A equipe quer o **menor esforço de manutenção**. Qual abordagem atende?',
      concepts: [{ id: 'ec2.user-data' }, { id: 'ec2.ami' }],
      xp: 5,
      difficulty: 1,
      domain: 'd3',
      options: [
        { id: 'a', text: 'Criar e manter três AMIs, uma com a configuração de cada ambiente.', correct: false, consequence: 'Funciona, mas cada atualização do servidor vira três AMIs novas para gerar e testar.' },
        { id: 'b', text: 'Passar a configuração de cada ambiente no user data, ao lançar a instância.', correct: true, consequence: 'A mesma AMI serve aos três ambientes, e o script do primeiro boot grava os valores certos.' },
        { id: 'c', text: 'Gravar os três conjuntos de valores na AMI e escolher o certo pelo par de chaves usado.', correct: false, consequence: 'O par de chaves serve para autenticar o acesso à instância, não para selecionar configuração.' },
        { id: 'd', text: 'Entrar em cada instância depois do lançamento e editar o arquivo de configuração.', correct: false, consequence: 'É trabalho manual a cada instância nova, justamente o que a equipe quer evitar.' },
      ],
      explanation: [
        'O **user data** é passado no lançamento e roda no primeiro boot, como root. É o lugar natural para o que muda a cada lançamento, como o endereço do banco e o nível de log, enquanto a AMI guarda o que é igual em todos os ambientes, como o servidor já instalado.',
        'Três AMIs multiplicam a manutenção a cada atualização. O par de chaves não tem relação com configuração. E editar à mão depois do lançamento é exatamente o esforço que se quer eliminar, além de não acompanhar instâncias criadas automaticamente.',
        '**Regra prática:** o que é igual em todas as instâncias vai na AMI; o que muda no lançamento vai no user data. Instalar muita coisa pelo user data deixa a inicialização lenta, e aí vale levar a instalação para a AMI.',
      ],
    },
    {
      id: 'rv:cmp.f01.m1.a4',
      kind: 'decision',
      title: 'Script novo que não rodou',
      prompt:
        'O user data de uma instância Amazon Linux instala o servidor web. A equipe parou a instância, trocou o script por uma versão nova, iniciou de novo e não viu a nova configuração. O log **/var/log/cloud-init-output.log** não registra nenhuma execução do script nesse início. Qual explicação é a correta?',
      concepts: [{ id: 'ec2.user-data' }],
      xp: 5,
      difficulty: 1,
      domain: 'd2',
      options: [
        { id: 'a', text: 'O script novo passou de 16 KB e foi ignorado no início.', correct: false, consequence: 'O limite existe, mas um script acima dele seria recusado na alteração, e o log não indica isso.' },
        { id: 'b', text: 'A instância não tem instance profile, então não consegue ler o próprio user data.', correct: false, consequence: 'A instância lê o user data pelo serviço de metadados sem precisar de role; o instance profile é para chamar APIs da AWS.' },
        { id: 'c', text: 'Por padrão, o user data roda só no primeiro boot da instância.', correct: true, consequence: 'O script novo fica gravado, mas só rodaria a cada início se isso fosse configurado no cloud-init.' },
        { id: 'd', text: 'O user data só pode ser alterado com a instância em execução.', correct: false, consequence: 'É o contrário: o user data só pode ser alterado com a instância parada, como a equipe fez.' },
      ],
      explanation: [
        'Por padrão, o user data e as diretivas do cloud-init rodam **só no primeiro boot** da instância. A equipe fez a alteração do jeito certo, com a instância parada, mas o novo start não executa o script de novo. Para rodar a cada início, é preciso configurar isso; mudanças frequentes cabem melhor numa AMI nova ou numa ferramenta de configuração.',
        'O limite de 16 KB faria a alteração ser recusada, sem relação com o log vazio. O instance profile dá credenciais para chamar APIs da AWS e não é preciso para ler o user data. E a alteração exige a instância parada, não em execução.',
        '**Regra prática:** user data é configuração do primeiro boot. Esperar que ele rode de novo a cada reboot ou start, sem configurar isso, é um erro comum.',
      ],
    },
    {
      id: 'rv:cmp.f01.sg-somados',
      kind: 'decision',
      title: 'SSH aberto por um grupo esquecido',
      prompt:
        'Uma instância tem três security groups: **sg-web** (HTTPS 443 de 0.0.0.0/0), **sg-admin** (SSH 22 só do IP do escritório) e **sg-legado** (SSH 22 de 0.0.0.0/0), este último sobra de um teste antigo. Uma auditoria pede que o **SSH só seja aceito a partir do escritório**, sem afetar o HTTPS. Qual mudança atende?',
      concepts: [{ id: 'ec2.security-group' }],
      xp: 5,
      difficulty: 2,
      domain: 'd1',
      options: [
        { id: 'a', text: 'Adicionar ao sg-admin uma regra que negue SSH vindo de 0.0.0.0/0.', correct: false, consequence: 'Security groups não têm regra de negação: só existem regras que permitem.' },
        { id: 'b', text: 'Colocar o sg-admin na frente do sg-legado na ordem de avaliação da instância.', correct: false, consequence: 'Não há ordem entre os grupos: as regras de todos são somadas num conjunto só.' },
        { id: 'c', text: 'Retirar o sg-legado da instância.', correct: true, consequence: 'Sem ele, o único SSH permitido é o do sg-admin, e o HTTPS do sg-web continua igual.' },
        { id: 'd', text: 'Retirar o sg-web da instância e manter os outros dois.', correct: false, consequence: 'Derruba o HTTPS do site e deixa o SSH aberto para a internet pelo sg-legado.' },
      ],
      explanation: [
        'Quando uma instância tem vários security groups, as regras de **todos são somadas** num único conjunto. Basta uma regra permitir o tráfego para ele passar. O sg-legado sozinho já abre o SSH para a internet, então a correção é retirá-lo da instância; o sg-admin continua permitindo o escritório, e o sg-web continua permitindo o HTTPS.',
        'Não existe regra de negação em security group, nem ordem de avaliação entre grupos. Retirar o sg-web corta justamente o tráfego que deveria continuar e não mexe no problema.',
        '**Regra prática:** para fechar um acesso num security group, procure e remova a regra (ou o grupo) que o permite. Bloquear um IP específico com negação pede uma network ACL, não um security group.',
      ],
    },
    {
      id: 'rv:cmp.f01.sg-saida',
      kind: 'decision',
      title: 'Respostas passam, chamadas falham',
      prompt:
        'Numa limpeza de regras, alguém removeu todas as regras de saída do security group de uma instância web. O grupo continua permitindo **HTTPS de entrada** de qualquer origem. Desde então, o site segue respondendo aos clientes, mas as **chamadas que a instância faz** à API de pagamentos (HTTPS) e as atualizações de pacotes falham. Qual mudança corrige com o **menor privilégio**?',
      concepts: [{ id: 'ec2.security-group' }],
      xp: 5,
      difficulty: 2,
      domain: 'd1',
      options: [
        { id: 'a', text: 'Adicionar uma regra de entrada para as portas altas, por onde voltam as respostas.', correct: false, consequence: 'O security group é stateful: a resposta de uma conexão permitida já volta. O que falta é permitir a conexão de saída.' },
        { id: 'b', text: 'Adicionar uma regra de saída HTTPS (443) só para os destinos necessários.', correct: true, consequence: 'As conexões iniciadas pela instância passam a ser permitidas, só na porta e nos destinos necessários.' },
        { id: 'c', text: 'Restaurar a regra de saída padrão, que permite todo o tráfego para qualquer destino.', correct: false, consequence: 'Resolve, mas libera qualquer porta para qualquer destino, mais do que o necessário.' },
        { id: 'd', text: 'Nenhuma regra faz falta; o problema está na API de pagamentos, porque o site responde.', correct: false, consequence: 'O site responde porque as respostas a conexões de entrada voltam sozinhas; conexões que a instância inicia precisam de regra de saída.' },
      ],
      explanation: [
        'O security group é **stateful**: a resposta de uma conexão permitida volta sem regra extra. É por isso que o site responde mesmo sem regras de saída. Mas uma conexão **iniciada pela instância**, como a chamada à API de pagamentos, precisa ser permitida por uma regra de saída; sem nenhuma, nenhum tráfego de saída é permitido. A regra de saída na porta 443, para os destinos necessários, resolve com o menor privilégio.',
        'Regras de entrada para portas altas são o raciocínio de um filtro sem estado, que não se aplica aqui. Restaurar a regra padrão funciona, mas abre tudo. E o fato de o site responder não inocenta o security group: as duas direções de conexão seguem regras diferentes.',
        '**Regra prática:** no security group, quem inicia a conexão define a regra necessária. Entrada permitida, resposta liberada; saída iniciada pela instância, regra de saída.',
      ],
    },
    {
      id: 'rv:cmp.f01.chave-perdida',
      kind: 'decision',
      title: 'Chave privada perdida',
      prompt:
        'O administrador de uma instância Linux perdeu o arquivo da chave privada do par de chaves usado no lançamento. A instância já roda o **agente do Systems Manager** e tem um instance profile com as permissões do Session Manager. A equipe precisa de um terminal na instância **hoje**, **sem abrir a porta 22**. Qual caminho atende?',
      concepts: [{ id: 'ec2.key-pair' }, { id: 'ec2.session-manager' }],
      xp: 5,
      difficulty: 2,
      domain: 'd1',
      options: [
        { id: 'a', text: 'Baixar de novo a chave privada no console do EC2, na página do par de chaves.', correct: false, consequence: 'O EC2 não guarda cópia da chave privada: ela só pode ser baixada no momento da criação.' },
        { id: 'b', text: 'Abrir um caso no suporte da AWS para recuperar a chave privada.', correct: false, consequence: 'A AWS não tem a chave privada para devolver; o suporte não consegue recuperá-la.' },
        { id: 'c', text: 'Criar um par de chaves novo e conectar por SSH usando a chave nova.', correct: false, consequence: 'A instância só conhece a chave pública do par antigo; além disso, o SSH exigiria a porta 22.' },
        { id: 'd', text: 'Abrir uma sessão pelo Session Manager e cadastrar nela uma chave nova.', correct: true, consequence: 'O Session Manager dá o terminal sem chave SSH nem porta de entrada, com o acesso controlado pelo IAM.' },
      ],
      explanation: [
        'O EC2 **não guarda a chave privada**: quem perde o arquivo não tem como recuperá-lo. Como a instância já tem o agente e as permissões, o **Session Manager** abre um terminal sem chave SSH e sem porta de entrada. Dentro da sessão, dá para cadastrar uma chave pública nova no arquivo authorized_keys, se o SSH ainda for necessário.',
        'Não existe novo download da chave, nem recuperação pelo suporte. Um par de chaves novo não serve sozinho, porque a instância só conhece a chave pública antiga, e o SSH ainda exigiria abrir a porta 22.',
        '**Regra prática:** a chave privada é responsabilidade sua e não tem cópia na AWS. Com o Session Manager configurado, a perda da chave deixa de ser um bloqueio; sem ele, o caminho é trocar a chave pública no volume da instância.',
      ],
    },
    {
      id: 'rv:cmp.f01.imds-conteiner',
      kind: 'decision',
      title: 'IMDSv2 obrigatório e contêineres sem credenciais',
      prompt:
        'Para se proteger de SSRF, uma empresa passou a exigir o **IMDSv2** em todas as instâncias. Logo depois, uma aplicação que roda num **contêiner Docker** dentro de uma dessas instâncias deixou de obter as credenciais do instance profile: a requisição do token fica sem resposta. Aplicações que rodam direto na instância funcionam. Qual ajuste resolve **mantendo a proteção**?',
      concepts: [{ id: 'ec2.imds' }],
      xp: 5,
      difficulty: 3,
      domain: 'd1',
      options: [
        { id: 'a', text: 'Voltar a aceitar o IMDSv1 nessa instância, só para o contêiner funcionar.', correct: false, consequence: 'A aplicação volta a funcionar, mas a instância perde exatamente a proteção contra SSRF que motivou a mudança.' },
        { id: 'b', text: 'Aumentar para 2 o limite de saltos (hop limit) da resposta do token nessa instância.', correct: true, consequence: 'A ponte de rede do contêiner conta como um salto a mais; com limite 2, a resposta do token chega ao contêiner.' },
        { id: 'c', text: 'Liberar no security group da instância a saída para 169.254.169.254.', correct: false, consequence: 'O serviço de metadados é local à instância e não passa pelas regras do security group.' },
        { id: 'd', text: 'Passar ao contêiner uma chave de acesso de um usuário IAM em variável de ambiente.', correct: false, consequence: 'Troca credenciais temporárias por uma chave de longo prazo, que pode vazar e não expira.' },
      ],
      explanation: [
        'No IMDSv2, a resposta com o token tem um **limite de saltos de rede** (hop limit). Num contêiner, a ida até a rede da instância conta como um salto a mais, e com limite 1 a resposta pode simplesmente não chegar. A própria AWS sugere, em ambientes de contêiner, aumentar o limite para 2. A instância continua exigindo o token, então a proteção contra SSRF fica.',
        'Voltar ao IMDSv1 desfaz a proteção. O security group não filtra o tráfego para o serviço de metadados, que é local. E uma chave de usuário IAM em variável de ambiente é uma credencial fixa, pior que as temporárias do instance profile.',
        '**Regra prática:** depois de exigir o IMDSv2, aplicações em contêineres que não recebem o token apontam para o hop limit. O ajuste é no limite de saltos, nunca voltar ao IMDSv1.',
      ],
    },
    {
      id: 'rv:cmp.f01.o-que-continua-cobrado',
      kind: 'decision',
      title: 'Instâncias paradas que ainda geram custo',
      prompt:
        'Uma agência para todas as instâncias de desenvolvimento às 19h e só as inicia às 8h do dia seguinte. Cada instância tem um volume raiz EBS, um segundo volume EBS de dados e um **Elastic IP associado**. O financeiro quer saber o que continua sendo cobrado **durante a noite**, com as instâncias paradas. Quais itens continuam cobrados? (Escolha DUAS.)',
      concepts: [{ id: 'ec2.lifecycle' }, { id: 'ec2.public-ip-eip' }],
      xp: 5,
      difficulty: 2,
      domain: 'd4',
      multiple: true,
      options: [
        { id: 'a', text: 'O uso das instâncias, pelo tipo escolhido.', correct: false, consequence: 'No estado stopped, o uso da instância não é cobrado; ele volta a contar quando ela entra em running.' },
        { id: 'b', text: 'Os dois volumes EBS de cada instância.', correct: true, consequence: 'Os volumes continuam existindo e guardando os dados, e são cobrados em qualquer estado da instância.' },
        { id: 'c', text: 'Os Elastic IPs associados às instâncias.', correct: true, consequence: 'A AWS cobra todos os IPv4 públicos, inclusive os Elastic IPs, associados ou não e com a instância parada.' },
        { id: 'd', text: 'Os security groups das instâncias.', correct: false, consequence: 'Security groups não são cobrados, nem com a instância ligada.' },
        { id: 'e', text: 'A transferência de dados das instâncias.', correct: false, consequence: 'Parada, a instância não transfere dados e não gera essa cobrança.' },
      ],
      explanation: [
        'Parar a instância zera a cobrança de **uso**, que só existe no estado running. O que continua existindo continua cobrado: os **volumes EBS**, que guardam os dados enquanto a instância está parada, e os **IPv4 públicos**, já que a AWS cobra todos eles, Elastic IPs incluídos, associados ou não.',
        'O uso e a transferência de dados dependem da instância rodando. Security groups não têm cobrança em nenhuma situação.',
        '**Regra prática:** instância parada não cobra uso, mas volumes EBS e IPv4 públicos seguem na fatura. Para economizar de verdade em ambientes parados por longos períodos, revise também volumes e Elastic IPs.',
      ],
    },
    {
      id: 'rv:cmp.f01.tarefas-curtas',
      kind: 'decision',
      title: 'Uma instância para cada tarefa de 10 segundos',
      prompt:
        'Um processo de uma fintech lança uma instância Linux para cada tarefa de conferência de lote, que leva **10 segundos**, e a encerra logo depois. São cerca de 6.000 tarefas por dia, que chegam uma depois da outra numa fila. A empresa quer **reduzir o custo** do processamento sem trocar o código da tarefa. Qual mudança atende?',
      concepts: [{ id: 'ec2.lifecycle' }],
      xp: 5,
      difficulty: 3,
      domain: 'd4',
      options: [
        { id: 'a', text: 'Parar a instância depois de cada tarefa, em vez de encerrá-la, e iniciá-la na próxima.', correct: false, consequence: 'Cada start conta como um novo início, com o mesmo mínimo de 1 minuto cobrado.' },
        { id: 'b', text: 'Usar um tipo maior, para que cada tarefa termine em 5 segundos.', correct: false, consequence: 'A cobrança mínima continua de 1 minuto por início, agora num tipo mais caro.' },
        { id: 'c', text: 'Hibernar a instância entre as tarefas, para retomar mais rápido.', correct: false, consequence: 'A hibernação também termina num novo start, cobrado com o mínimo de 1 minuto, e ainda cobra o stopping enquanto grava a RAM.' },
        { id: 'd', text: 'Manter uma instância rodando enquanto houver fila, uma tarefa após a outra.', correct: true, consequence: 'As tarefas passam a ocupar o tempo cobrado: 6 tarefas de 10 segundos cabem no minuto que hoje paga uma só.' },
      ],
      explanation: [
        'O uso de uma instância é cobrado **por segundo, com mínimo de 1 minuto a cada início**. Uma tarefa de 10 segundos numa instância nova paga 60 segundos: seis vezes o tempo útil. Manter a instância rodando enquanto a fila tem tarefas faz o tempo cobrado ser ocupado por trabalho, e o mínimo passa a pesar só uma vez.',
        'Parar e iniciar, ou hibernar e iniciar, gera um novo início a cada tarefa, com o mesmo mínimo. Uma instância maior encurta a tarefa, mas não o mínimo cobrado, e custa mais por segundo.',
        '**Regra prática:** a cobrança por segundo tem mínimo de 1 minuto a cada início. Cargas feitas de tarefas muito curtas ficam mais baratas numa instância que processa várias em sequência do que numa instância por tarefa.',
      ],
    },
    {
      id: 'rv:cmp.f01.patch-sem-perder-cache',
      kind: 'decision',
      title: 'Patch de kernel e dados no instance store',
      prompt:
        'Uma instância de processamento de vídeo guarda no **instance store** um índice temporário que leva 2 horas para ser refeito. A equipe precisa aplicar um patch de kernel que exige **reiniciar o sistema operacional** e quer evitar refazer o índice. Qual operação atende?',
      concepts: [{ id: 'ec2.stop-hibernate-terminate' }, { id: 'ec2.instance-store' }],
      xp: 5,
      difficulty: 2,
      domain: 'd2',
      options: [
        { id: 'a', text: 'Fazer reboot da instância.', correct: true, consequence: 'O reboot reinicia no mesmo servidor, e os dados do instance store sobrevivem.' },
        { id: 'b', text: 'Fazer stop e start da instância.', correct: false, consequence: 'No start, a instância vai para outro servidor, e o instance store chega vazio.' },
        { id: 'c', text: 'Hibernar e iniciar a instância, para preservar o estado.', correct: false, consequence: 'A hibernação preserva a RAM no volume raiz EBS, mas apaga o instance store, como o stop.' },
        { id: 'd', text: 'Criar uma AMI da instância e lançar uma nova a partir dela.', correct: false, consequence: 'A AMI leva os volumes EBS; os volumes de instance store da instância nova nascem vazios.' },
      ],
      explanation: [
        'Os dados do instance store ficam em discos ligados fisicamente ao servidor. O **reboot** reinicia o sistema operacional no mesmo servidor e preserva esses dados. Por isso, é a operação que aplica o patch sem refazer o índice.',
        'Stop, hibernate e terminate tiram a instância daquele servidor, e o instance store se apaga: na hibernação, só a RAM é salva, e no volume raiz EBS. Uma AMI copia os volumes EBS, não o conteúdo do instance store.',
        '**Regra prática:** instance store aguenta reboot e se apaga em stop, hibernate, terminate ou falha do disco. Antes de qualquer operação numa instância com instance store, pergunte se ela troca de servidor.',
      ],
    },
    {
      id: 'rv:cmp.f01.hardware-desativado',
      kind: 'decision',
      title: 'Aviso de desativação do hardware',
      prompt:
        'Uma instância com volume raiz EBS recebeu um aviso da AWS: o hardware que a hospeda será desativado daqui a duas semanas, e a instância está agendada para ser parada nessa data. A empresa quer resolver **numa janela de manutenção própria**, mantendo os volumes EBS e o IPv4 privado da instância. Qual ação atende?',
      concepts: [{ id: 'ec2.stop-hibernate-terminate' }],
      xp: 5,
      difficulty: 2,
      domain: 'd2',
      options: [
        { id: 'a', text: 'Fazer reboot da instância na janela de manutenção.', correct: false, consequence: 'O reboot reinicia no mesmo servidor: a instância continua no hardware que será desativado.' },
        { id: 'b', text: 'Encerrar a instância e lançar outra da mesma AMI na janela.', correct: false, consequence: 'Muda de hardware, mas a instância nova tem outro IPv4 privado, e o volume raiz da antiga é apagado por padrão.' },
        { id: 'c', text: 'Esperar a data: a AWS migra a instância em execução sem interrupção.', correct: false, consequence: 'O aviso é de parada agendada: na data, a instância para e alguém precisa iniciá-la de novo.' },
        { id: 'd', text: 'Fazer stop e start da instância na janela de manutenção.', correct: true, consequence: 'No start, a instância vai para outro servidor, mantendo os volumes EBS e o IPv4 privado.' },
      ],
      explanation: [
        'Quando o hardware de uma instância com volume raiz EBS vai ser desativado, a AWS agenda a **parada** da instância. Fazer **stop e start** antes da data, na hora que convém, leva a instância para outro servidor. Os volumes EBS e o IPv4 privado continuam; só o IPv4 público automático é trocado, se houver.',
        'O reboot fica no mesmo servidor. Encerrar e lançar outra também troca de hardware, mas perde o IPv4 privado e, por padrão, o volume raiz. E a AWS não migra a instância em silêncio: sem ação, ela para na data agendada.',
        '**Regra prática:** trocar de servidor é stop e start; reiniciar no mesmo servidor é reboot. Em avisos de desativação de hardware, o stop e start na sua janela evita a parada na hora escolhida pela AWS.',
      ],
    },
    {
      id: 'rv:cmp.f01.io-temporario',
      kind: 'decision',
      title: 'Banco distribuído que já replica os dados',
      prompt:
        'Um banco de dados distribuído roda em seis instâncias EC2 e **replica cada dado em três delas**, então a perda de uma instância não perde informação. O banco precisa do **maior desempenho de I/O possível** no disco local de cada instância, com o **menor custo**. Qual armazenamento atende?',
      concepts: [{ id: 'ec2.instance-store' }],
      xp: 5,
      difficulty: 2,
      domain: 'd3',
      options: [
        { id: 'a', text: 'Volumes de instance store, em tipos de instância que os incluem.', correct: true, consequence: 'Os discos ligados ao servidor dão o maior desempenho, já vêm no preço da instância, e a replicação do banco cobre a perda de um nó.' },
        { id: 'b', text: 'Um volume EBS por instância, do maior tamanho disponível.', correct: false, consequence: 'O EBS é durável e sobrevive a um stop, mas é armazenamento em rede, cobrado à parte, e a durabilidade já vem da replicação do banco.' },
        { id: 'c', text: 'Um bucket do S3 montado como disco em cada instância.', correct: false, consequence: 'O S3 é armazenamento de objetos acessado pela rede, não um disco de baixa latência para um banco.' },
        { id: 'd', text: 'Um volume raiz maior em cada instância, guardando os dados junto do sistema.', correct: false, consequence: 'O volume raiz costuma ser EBS: mesmo trade-off do EBS, e ainda mistura dados e sistema operacional.' },
      ],
      explanation: [
        'Os requisitos são **maior desempenho de I/O** e **menor custo**, e os dados já estão protegidos pela **replicação do próprio banco**. O instance store atende: são discos ligados fisicamente ao servidor, mais rápidos que armazenamento em rede e já incluídos no preço dos tipos que os oferecem (no nome, a letra "d"). Se uma instância cair e perder o disco, as cópias nas outras duas cobrem o dado.',
        'O EBS seria a escolha se os dados precisassem sobreviver a um stop por conta própria; aqui, ele cobra a mais por uma durabilidade que a replicação já entrega. O S3 não é disco de baixa latência. E aumentar o volume raiz é usar EBS, com o mesmo trade-off.',
        '**Regra prática:** "maior desempenho de I/O" com "dados temporários" ou "replicados pela aplicação" aponta para instance store. Se o dado precisa sobreviver a um stop sem depender de réplicas, a resposta é EBS.',
      ],
    },
  ],
}
