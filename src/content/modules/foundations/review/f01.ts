/**
 * Questões da Revisão da Fase 1 da AWS Foundations (infraestrutura global),
 * no formato do exame SAA-C03. Fatos conferidos em 18/10/2026 e 02/11/2026
 * (ver docs/VERIFICACAO-DE-CONTEUDO.md); preços de referência do S3 Standard
 * da AWS Price List de 18/10/2026. As empresas são fictícias.
 */
import type { ReviewSet } from '../../../../engine/types'

export const REVIEW_F01: ReviewSet = {
  phaseId: 'fnd.f01',
  questions: [
    {
      id: 'rv:fnd.f01.m1.a4',
      kind: 'decision',
      title: 'Apólices que precisam sobreviver à Região',
      prompt:
        'Uma seguradora guarda as apólices num bucket S3 em eu-west-1 (Irlanda), sem nenhuma replicação configurada. Um contrato exige que os dados dos clientes **fiquem em países da União Europeia**. Agora a diretoria quer que as apólices continuem acessíveis **mesmo se a Região inteira ficar indisponível**. O que atende aos dois requisitos?',
      concepts: [{ id: 'infra.no-auto-replication' }, { id: 'infra.data-residency' }, { id: 'infra.ha-vs-dr' }],
      xp: 5,
      difficulty: 3,
      domain: 'd2',
      options: [
        { id: 'a', text: 'Nenhuma mudança: o S3 Standard já guarda cada objeto em várias zonas da Região.', correct: false, consequence: 'Várias zonas protegem contra a perda de uma zona. Se a Região inteira ficar indisponível, todas as cópias ficam junto com ela.' },
        { id: 'b', text: 'Configurar a replicação do bucket para us-east-1, onde o armazenamento custa menos.', correct: false, consequence: 'Resolve a perda da Região, mas leva os dados para os Estados Unidos e quebra o contrato, que exige a União Europeia.' },
        { id: 'c', text: 'Replicar o bucket para outra Região da UE, como eu-central-1 (Frankfurt).', correct: true, consequence: 'Cria a cópia em outra Região, que a AWS não faz sozinha, e mantém os dados dentro da União Europeia.' },
        { id: 'd', text: 'Pedir ao suporte que ative a cópia que a AWS mantém numa Região parceira da mesma área.', correct: false, consequence: 'Essa cópia não existe: a AWS não replica nada entre Regiões sem uma configuração explícita do cliente.' },
      ],
      explanation: [
        'São dois requisitos, e a ordem importa. A **localização dos dados** é rígida e elimina qualquer destino fora da União Europeia. A **perda da Região** pede uma cópia em outra Região, e essa cópia só existe se alguém configurar a replicação. Replicar para Frankfurt atende aos dois.',
        'Contar com as várias zonas do S3 Standard confunde alta disponibilidade (falha de uma zona) com recuperação de desastres (perda da Região). Replicar para us-east-1 resolve o desastre e viola o contrato. E não existe "Região parceira" com cópia automática: cada Região é isolada, e os dados ficam onde foram criados.',
        '**Regra prática:** primeiro elimine os destinos que violam a localização exigida; só depois escolha, entre os que sobram, onde guardar a cópia. E lembre que nenhum dado sai da Região sem uma replicação ou cópia configurada.',
      ],
    },
    {
      id: 'rv:fnd.f01.m1.a3',
      kind: 'decision',
      title: 'Pipeline europeu e a latência',
      prompt:
        'A Viajaí vai treinar modelos de recomendação para clientes da Península Ibérica e da França. O pipeline lê os dados de treino no **S3 Express One Zone**, por causa da latência baixíssima, e o contrato com os parceiros exige que os dados **fiquem em países da União Europeia**. Com as informações abaixo, em qual Região a Viajaí deve implantar o pipeline?',
      exhibits: [
        {
          title: 'Regiões candidatas (premissas do cenário)',
          code: 'Região       País             S3 Express One Zone   Latência até a Ibéria\neu-south-2   Espanha (UE)     não disponível        a menor\nRegião B     outro país (UE)  disponível            maior que a de eu-south-2\nus-east-1    Estados Unidos   disponível            a maior; preços mais baixos',
        },
      ],
      concepts: [{ id: 'infra.region-selection' }, { id: 'infra.region' }],
      xp: 5,
      difficulty: 2,
      domain: 'd1',
      options: [
        { id: 'a', text: 'Em eu-south-2, que tem a menor latência e fica dentro da União Europeia.', correct: false, consequence: 'Cumpre a localização, mas não oferece o S3 Express One Zone, de que o pipeline depende.' },
        { id: 'b', text: 'Em eu-south-2, trocando o S3 Express One Zone pelo S3 Standard.', correct: false, consequence: 'Muda o requisito para caber na Região: o pipeline perde a latência baixíssima que motivou o Express One Zone.' },
        { id: 'c', text: 'Na Região B, que fica na UE e oferece o serviço, com mais latência.', correct: true, consequence: 'Respeita os dois requisitos rígidos; a latência maior é o preço aceitável dessa escolha.' },
        { id: 'd', text: 'Em us-east-1, que oferece o serviço com os menores preços da tabela.', correct: false, consequence: 'Tem o serviço e o melhor preço, mas leva os dados para fora da União Europeia e quebra o contrato.' },
      ],
      explanation: [
        'Há dois requisitos que não podem ser violados: os dados ficam na **União Europeia** e o pipeline precisa do **S3 Express One Zone**. Só a Região B atende aos dois. A latência maior é um critério de desempate, e ele só entra entre as Regiões que já passaram pelos requisitos rígidos.',
        'eu-south-2 é a mais próxima, mas não tem o serviço. Trocar o Express One Zone pelo Standard parece engenhoso, mas descarta o motivo da escolha original. us-east-1 tem o serviço e o melhor preço, mas viola a localização.',
        '**Regra prática:** escolha a Região em duas etapas. Primeiro, elimine as que violam a localização dos dados ou não têm os serviços indispensáveis. Depois, compare latência e custo entre as que sobraram.',
      ],
    },
    {
      id: 'rv:fnd.f01.relatorios-noturnos',
      kind: 'decision',
      title: 'Relatórios internos sem pressa',
      prompt:
        'Uma rede de farmácias brasileira vai gerar, toda noite, relatórios internos de vendas que a diretoria consulta no dia seguinte. **Não há exigência legal nem contratual** sobre onde esses dados ficam, a latência não importa e os serviços usados existem nas duas Regiões abaixo. Qual escolha atende com o **menor custo**?',
      exhibits: [
        {
          title: 'Preço de referência do S3 Standard (primeira faixa)',
          code: 'sa-east-1 (São Paulo)    US$ 0,0405/GB-mês\nus-east-1 (N. Virginia)  US$ 0,023/GB-mês\n\nOs outros serviços usados seguem diferença parecida (premissa do cenário).',
        },
      ],
      concepts: [{ id: 'infra.region-selection' }, { id: 'infra.region' }],
      xp: 5,
      difficulty: 1,
      domain: 'd4',
      options: [
        { id: 'a', text: 'sa-east-1, porque a Região mais próxima da empresa é sempre a indicada.', correct: false, consequence: 'Proximidade importa quando há requisito de latência ou de localização, e o cenário não tem nenhum dos dois.' },
        { id: 'b', text: 'us-east-1, porque nenhum requisito prende os dados ao Brasil e os preços são menores.', correct: true, consequence: 'Sem requisito rígido nem de latência, o custo decide, e us-east-1 sai mais barata.' },
        { id: 'c', text: 'sa-east-1, porque os dados de uma empresa brasileira precisam ficar no Brasil.', correct: false, consequence: 'Cria uma exigência que o cenário não tem: a localização só é rígida quando lei ou contrato pedem.' },
        { id: 'd', text: 'Qualquer uma das duas, porque os preços da AWS são iguais em todas as Regiões.', correct: false, consequence: 'Os preços variam por Região: o GB do S3 Standard custa cerca de 76% a mais em sa-east-1.' },
      ],
      explanation: [
        'O cenário tira da mesa os dois critérios que costumam prender uma Região: **não há exigência de localização** e **a latência não importa**. Sobram os serviços, que existem nas duas, e o **custo**, que é menor em us-east-1.',
        'Escolher sa-east-1 pela proximidade ou por uma suposta obrigação de manter os dados no Brasil é decidir por requisitos que o enunciado não traz. E os preços da AWS variam de uma Região para outra, às vezes bastante.',
        '**Regra prática:** a Região mais próxima nem sempre é a certa. Leia o enunciado procurando o que é obrigatório (lei, contrato, serviço, latência); se nada for, o custo decide.',
      ],
    },
    {
      id: 'rv:infra.opt-in-regions:habilitar',
      kind: 'decision',
      title: 'Cape Town não aparece na conta',
      prompt:
        'Uma empresa vai atender clientes na África do Sul e quer criar recursos em Africa (Cape Town), af-south-1. No console, a Região não aparece entre as disponíveis, e os comandos da AWS CLI para ela falham. A conta existe desde 2017. Qual é a causa e a solução com o **menor esforço**?',
      concepts: [{ id: 'infra.opt-in-regions' }],
      xp: 5,
      difficulty: 1,
      domain: 'd1',
      options: [
        { id: 'a', text: 'A conta é anterior à Região: é preciso abrir uma conta nova para usá-la.', correct: false, consequence: 'Contas antigas usam Regiões novas normalmente, depois de habilitá-las. Uma conta nova também teria de habilitar a Região.' },
        { id: 'b', text: 'É uma Região opt-in: alguém com permissão precisa habilitá-la na conta.', correct: true, consequence: 'Regiões lançadas depois de 20/03/2019 vêm desabilitadas; depois de habilitada, os recursos podem ser criados nela.' },
        { id: 'c', text: 'Regiões da África exigem o Enterprise Support, que precisa ser contratado.', correct: false, consequence: 'O plano de suporte muda o atendimento, não as Regiões que a conta pode usar.' },
        { id: 'd', text: 'A cota de Regiões da conta acabou: é preciso pedir um aumento ao suporte.', correct: false, consequence: 'Não existe cota de Regiões por conta. O que falta é habilitar a Região.' },
      ],
      explanation: [
        'Africa (Cape Town) foi lançada depois de 20/03/2019, por isso é uma **Região opt-in**: vem desabilitada em toda conta e precisa ser habilitada antes do uso. É uma ação de poucos minutos, feita por quem tem permissão na conta.',
        'A idade da conta, o plano de suporte e uma suposta cota de Regiões não têm relação com o problema. As Regiões mais antigas já vêm habilitadas; as mais novas, não.',
        '**Regra prática:** Região que "não aparece" ou recusa comandos, numa conta que funciona nas outras, costuma ser uma Região opt-in que ainda não foi habilitada.',
      ],
    },
    {
      id: 'rv:fnd.f01.escopo-ebs',
      kind: 'decision',
      title: 'Volume que não muda de zona',
      prompt:
        'Um servidor de relatórios roda numa instância EC2 na zona a, com os dados num volume EBS. A equipe quer **levar os dados para a zona b**, onde ficam os demais servidores, mas não consegue anexar o volume a uma instância nova nessa zona. Qual caminho funciona?',
      concepts: [{ id: 'infra.service-scope' }, { id: 'infra.az' }],
      xp: 5,
      difficulty: 1,
      domain: 'd2',
      options: [
        { id: 'a', text: 'Desanexar o volume e mudar a zona dele nas configurações do EBS.', correct: false, consequence: 'O volume fica para sempre na zona em que foi criado; não existe configuração para mudá-lo de zona.' },
        { id: 'b', text: 'Ligar o Multi-Attach, para o volume aceitar instâncias de outra zona.', correct: false, consequence: 'O Multi-Attach anexa um volume io1 ou io2 a várias instâncias, mas todas na mesma zona do volume.' },
        { id: 'c', text: 'Anexar o volume pela rede, já que o EBS é regional como o S3.', correct: false, consequence: 'O EBS é zonal: o volume só pode ser anexado a instâncias da própria zona.' },
        { id: 'd', text: 'Criar um snapshot do volume e, com ele, um volume novo na zona b.', correct: true, consequence: 'O snapshot não fica preso a uma zona: dele sai um volume novo em qualquer zona da Região.' },
      ],
      explanation: [
        'Volumes EBS e instâncias EC2 são **recursos zonais**: vivem na zona em que foram criados, e um volume só pode ser anexado a instâncias dessa zona. Para levar os dados a outra zona, o caminho é o **snapshot**, a partir do qual se cria um volume novo na zona b.',
        'Não há configuração que mude a zona de um volume. O Multi-Attach compartilha um volume entre instâncias da mesma zona. E tratar o EBS como regional, como o S3, é justamente a confusão de escopo que a questão testa.',
        '**Regra prática:** em questões de disponibilidade, identifique o escopo de cada peça. Instância e volume EBS são zonais e caem com a zona; bucket S3 é regional; IAM e Route 53 são globais.',
      ],
    },
    {
      id: 'rv:fnd.f01.cadeia-multi-az',
      kind: 'decision',
      multiple: true,
      title: 'Loja em duas zonas que ainda cai',
      prompt:
        'A loja virtual de uma papelaria roda em instâncias EC2 num Auto Scaling group, em sub-redes privadas das zonas a e b, atrás de um ALB habilitado nas duas zonas. O banco é um RDS Single-AZ na zona a, e toda venda chama uma API de pagamentos na internet por um único NAT gateway zonal, também na zona a. A empresa quer que a loja **continue vendendo se qualquer uma das zonas falhar**, com o **menor esforço operacional**. Quais mudanças são necessárias? (Escolha DUAS.)',
      concepts: [{ id: 'infra.spof' }, { id: 'infra.nat-zonal-regional' }, { id: 'infra.rds-multi-az' }],
      xp: 5,
      difficulty: 3,
      domain: 'd2',
      options: [
        { id: 'a', text: 'Converter o banco para uma implantação RDS Multi-AZ, com o standby na zona b.', correct: true, consequence: 'Se a zona a cair, o RDS promove o standby sozinho, sem perder transações confirmadas.' },
        { id: 'b', text: 'Criar uma réplica de leitura do banco na zona b para as instâncias de lá.', correct: false, consequence: 'A réplica só atende leituras e é promovida à mão: com a zona a fora, as vendas continuam sem onde gravar.' },
        { id: 'c', text: 'Criar um NAT gateway na zona b e rotear a sub-rede privada de b para ele.', correct: true, consequence: 'Cada zona passa a ter a própria saída para a API de pagamentos, sem depender da zona a.' },
        { id: 'd', text: 'Habilitar uma terceira zona no ALB e no Auto Scaling group.', correct: false, consequence: 'Reforça a camada que já era redundante; o banco e o NAT continuam presos à zona a.' },
        { id: 'e', text: 'Criar um segundo NAT gateway na zona a, para o caso de o primeiro falhar.', correct: false, consequence: 'Os dois ficam na mesma zona: se a zona a cair, a saída cai junto.' },
      ],
      explanation: [
        'A camada web já está em duas zonas, mas dois componentes ficaram só na zona a: o **banco Single-AZ** e o **único NAT gateway zonal**. Cada um é um ponto único de falha. O RDS Multi-AZ resolve o banco com failover automático, e um NAT gateway na zona b, com a rota da sub-rede de b apontando para ele, resolve a saída. Um NAT gateway regional, que se expande sozinho pelas zonas, também resolveria a saída.',
        'A réplica de leitura não aceita gravações nem assume sozinha. Uma terceira zona no ALB reforça o que já estava bom. E dois NAT gateways na mesma zona caem juntos.',
        '**Regra prática:** em "continuar funcionando se uma zona falhar", percorra o caminho de cada requisição (balanceador, instâncias, saída para a internet, banco) e procure a peça que só existe numa zona. A resposta certa dá um par a cada uma delas.',
      ],
    },
    {
      id: 'rv:fnd.f01.arquivos-numa-instancia',
      kind: 'decision',
      title: 'Portal que para junto com uma zona',
      prompt:
        'Um portal de cursos roda em 6 instâncias EC2 distribuídas por três zonas, atrás de um ALB. Os vídeos enviados pelos professores são gravados num volume EBS de uma instância "servidor de arquivos" na zona a, que as outras instâncias acessam pela rede. Quando a zona a teve um problema, o portal inteiro parou de exibir vídeos. A empresa quer eliminar essa falha com o **menor esforço operacional**. O que fazer?',
      concepts: [{ id: 'infra.spof' }, { id: 'infra.multi-az' }],
      xp: 5,
      difficulty: 2,
      domain: 'd2',
      options: [
        { id: 'a', text: 'Criar um snapshot diário do volume e restaurá-lo na zona b se a zona a falhar.', correct: false, consequence: 'Exige ação manual durante a falha, deixa o portal parado até a restauração e perde os vídeos enviados desde o último snapshot.' },
        { id: 'b', text: 'Gravar os vídeos num bucket S3, que guarda os dados em várias zonas da Região.', correct: true, consequence: 'O S3 é regional e gerenciado: a perda de uma zona não tira os vídeos do ar, e não há servidor para manter.' },
        { id: 'c', text: 'Trocar o servidor de arquivos por uma instância maior, com um volume EBS mais rápido.', correct: false, consequence: 'Instância e volume continuam numa zona só: mais desempenho não muda o ponto único de falha.' },
        { id: 'd', text: 'Criar um segundo servidor de arquivos na zona b e sincronizar os dois com um script.', correct: false, consequence: 'Até funciona, mas cria servidores e um script para manter e monitorar: falha no menor esforço operacional.' },
      ],
      explanation: [
        'As instâncias web estão em três zonas, mas todas dependem de um **único servidor de arquivos** na zona a: esse é o ponto único de falha. Gravar os vídeos no **S3**, um serviço regional que guarda os dados em várias zonas, elimina o servidor e com ele a falha, sem nada novo para operar.',
        'O snapshot diário é recuperação, não disponibilidade: o portal para e perde dados. Uma instância maior continua zonal. E o segundo servidor com sincronização resolve a disponibilidade à custa de mais trabalho de operação.',
        '**Regra prática:** contar instâncias não basta; conte zonas em cada peça de que o sistema depende. Quando a peça que sobra numa zona só guarda arquivos, um serviço regional gerenciado como o S3 costuma ser a saída de menor esforço.',
      ],
    },
    {
      id: 'rv:fnd.f01.m2.a4',
      kind: 'decision',
      title: 'Três zonas e três riscos',
      prompt:
        'A AgendaSaúde roda em três zonas de uma Região, com um NAT gateway por zona e o banco em RDS Multi-AZ. A diretoria lista três riscos: (1) a falha de uma zona; (2) a perda da Região inteira; (3) um deploy com defeito que apaga registros de pacientes no banco. Qual avaliação sobre **os riscos que a arquitetura atual cobre** está correta?',
      concepts: [{ id: 'infra.ha-vs-dr' }, { id: 'infra.az' }],
      xp: 5,
      difficulty: 2,
      domain: 'd2',
      options: [
        { id: 'a', text: 'Cobre os riscos 1 e 3, porque o standby do Multi-AZ guarda uma cópia dos registros.', correct: false, consequence: 'O standby é síncrono: o apagamento chega a ele no mesmo instante. Ele protege contra falha, não contra erro.' },
        { id: 'b', text: 'Cobre os riscos 1 e 2, porque as zonas ficam a dezenas de quilômetros umas das outras.', correct: false, consequence: 'A distância protege contra eventos locais, mas as três zonas estão na mesma Região e não cobrem a perda dela.' },
        { id: 'c', text: 'Cobre os três riscos, porque cada camada tem um par em outra zona da Região.', correct: false, consequence: 'Pares em outras zonas cobrem só a falha de uma zona.' },
        { id: 'd', text: 'Cobre só o risco 1: o risco 2 pede uma cópia em outra Região, e o 3, backups.', correct: true, consequence: 'A diretoria entende o que está coberto e o que ainda precisa de recuperação de desastres.' },
      ],
      explanation: [
        'Várias zonas dão **alta disponibilidade**: o sistema continua no ar quando uma zona falha. A perda da Região e o apagamento por um deploy com defeito são problemas de **recuperação de desastres**. O primeiro pede uma cópia em outra Região; o segundo, backups de onde restaurar o estado anterior.',
        'O standby do Multi-AZ recebe cada gravação de forma síncrona, inclusive os apagamentos. As zonas ficam afastadas umas das outras, mas dentro da mesma Região.',
        '**Regra prática:** leia o tipo de evento. Falha de instância ou de zona pede várias zonas. Perda da Região pede outra Região. Dado apagado ou corrompido pede backup ou versionamento, porque a replicação copia o erro.',
      ],
    },
    {
      id: 'rv:fnd.f01.proposta-sem-sobra',
      kind: 'decision',
      title: 'Cortar a sobra e confiar no Auto Scaling',
      prompt:
        'Uma API de agendamentos precisa de 6 instâncias para a carga do horário comercial e hoje mantém 9 rodando, 3 em cada uma de três zonas, atrás de um ALB. O requisito é que, se uma zona falhar, a API **continue atendendo a carga inteira sem degradação**, mesmo que lançar instâncias fique lento durante o incidente. O financeiro propõe manter só 6 instâncias, 2 por zona, e deixar o Auto Scaling lançar as que faltarem quando uma zona cair. Qual avaliação está correta?',
      concepts: [{ id: 'infra.static-stability' }],
      xp: 5,
      difficulty: 3,
      domain: 'd2',
      options: [
        { id: 'a', text: 'Aceitar: o Auto Scaling repõe a capacidade antes que os usuários percebam a falha.', correct: false, consequence: 'Lançar e preparar instâncias leva minutos e depende do plano de controle, que pode estar lento no incidente.' },
        { id: 'b', text: 'Aceitar: o ALB redistribui a carga da zona perdida entre as instâncias restantes.', correct: false, consequence: 'O ALB redistribui, mas 4 instâncias não atendem uma carga que exige 6.' },
        { id: 'c', text: 'Rejeitar: até o grupo repor, 4 instâncias atendem a carga de 6, e repor depende de lançar.', correct: true, consequence: 'Mantém as 9: as 6 das zonas restantes já estão rodando quando a falha acontece.' },
        { id: 'd', text: 'Rejeitar e subir para 12 instâncias, 4 por zona, para aguentar a falha de duas zonas.', correct: false, consequence: 'O requisito fala de uma zona: 12 instâncias pagam por uma folga que ninguém pediu.' },
      ],
      explanation: [
        'O requisito é **não degradar durante a falha**, mesmo com o lançamento de instâncias lento. Isso é **static stability**: a capacidade de sobra precisa estar rodando antes da falha. Com 9 instâncias em três zonas, a perda de uma deixa 6, exatamente a carga. Com 6, sobram 4 até o Auto Scaling repor.',
        'O Auto Scaling repõe capacidade, mas leva tempo e depende do plano de controle. O ALB só distribui o que existe. E 12 instâncias atendem a falha de duas zonas, mais do que o requisito pede.',
        '**Regra prática:** quando o enunciado diz "sem degradação durante a falha", desconfie de alternativas que contam com lançar recursos no meio do incidente. A sobra precisa já estar provisionada.',
      ],
    },
    {
      id: 'rv:infra.alb-zones:zona',
      kind: 'decision',
      title: 'Instâncias ociosas numa zona nova',
      prompt:
        'Uma loja usa um ALB habilitado nas zonas a e b. Para aguentar a Black Friday, o grupo de instâncias passou a lançar também na zona c. As instâncias de c estão saudáveis, mas com CPU perto de zero, enquanto as de a e b estão sobrecarregadas. Qual mudança resolve com o **menor esforço**?',
      concepts: [{ id: 'infra.alb-zones' }],
      xp: 5,
      difficulty: 1,
      domain: 'd3',
      options: [
        { id: 'a', text: 'Ligar o cross-zone load balancing do ALB, para o tráfego chegar à zona c.', correct: false, consequence: 'O cross-zone já vem ligado no ALB e só distribui entre as zonas habilitadas.' },
        { id: 'b', text: 'Criar um segundo ALB na zona c e dividir o tráfego entre os dois pelo DNS.', correct: false, consequence: 'Funcionaria com mais peças para manter, e um ALB precisa de pelo menos duas zonas.' },
        { id: 'c', text: 'Habilitar a zona c no ALB, adicionando uma sub-rede dessa zona.', correct: true, consequence: 'O ALB cria um nó na zona c e passa a mandar tráfego às instâncias dela.' },
        { id: 'd', text: 'Registrar as instâncias da zona c de novo no target group do ALB.', correct: false, consequence: 'O registro não é o problema: alvos numa zona não habilitada continuam sem tráfego.' },
      ],
      explanation: [
        'O ALB só manda tráfego para alvos nas **zonas habilitadas** nele. As instâncias de c estão registradas e saudáveis, mas a zona c não foi habilitada. Adicionar uma sub-rede de c ao ALB resolve com uma única mudança.',
        'O cross-zone já vem ligado e distribui entre as zonas habilitadas, sem habilitar zonas novas. Um segundo ALB resolveria com muito mais esforço. E registrar de novo não muda a zona do ALB.',
        '**Regra prática:** alvos saudáveis que não recebem tráfego costumam estar numa zona que o load balancer não habilitou. Ao ampliar o grupo para uma zona nova, amplie o ALB junto.',
      ],
    },
    {
      id: 'rv:fnd.f01.replica-nao-e-standby',
      kind: 'decision',
      title: 'Economia no banco que preocupa',
      prompt:
        'Para economizar, a equipe de um e-commerce criou uma réplica de leitura do banco RDS na zona b, em vez de ligar o Multi-AZ, contando com ela se a zona a falhar. O requisito é que, se a zona do banco falhar, a troca seja **automática** e **nenhum pedido confirmado se perca**. Qual avaliação está correta?',
      concepts: [{ id: 'infra.rds-multi-az' }],
      xp: 5,
      difficulty: 2,
      domain: 'd2',
      options: [
        { id: 'a', text: 'Atende: a réplica de leitura vira a primária sozinha quando a zona a falha.', correct: false, consequence: 'A promoção de uma réplica de leitura do RDS é manual: alguém precisa promovê-la e apontar a aplicação para ela.' },
        { id: 'b', text: 'Não atende: o requisito pede uma cópia do banco em outra Região.', correct: false, consequence: 'A falha de uma zona se resolve dentro da Região; outra Região é para a perda da Região inteira.' },
        { id: 'c', text: 'Atende, desde que a réplica use o mesmo tipo de instância do primário.', correct: false, consequence: 'O tamanho da instância não muda nem a promoção manual nem a cópia assíncrona.' },
        { id: 'd', text: 'Não atende: a réplica é assíncrona e promovida à mão; o Multi-AZ é síncrono e automático.', correct: true, consequence: 'O standby síncrono não perde transações confirmadas, e o failover acontece sem intervenção.' },
      ],
      explanation: [
        'Os dois requisitos apontam para o **RDS Multi-AZ**: o standby recebe cada gravação de forma síncrona, então nenhuma transação confirmada se perde, e o failover é automático. A réplica de leitura recebe os dados de forma assíncrona e precisa ser promovida à mão.',
        'A réplica não assume sozinha, e o tipo de instância não muda isso. Outra Região resolveria a perda da Região, um problema diferente da falha de uma zona.',
        '**Regra prática:** Multi-AZ é para disponibilidade (failover automático, sem perder dados); réplica de leitura é para escalar leituras. Quando o enunciado pede troca automática sem perda, a resposta é o Multi-AZ.',
      ],
    },
    {
      id: 'rv:fnd.f01.boss.a3',
      kind: 'decision',
      title: 'O jogo que quer tudo perto da cidade',
      prompt:
        'O servidor de partidas de um jogo on-line precisa de latência de um dígito em milissegundos para jogadores de uma metrópole longe da Região, que jogam em computadores com banda larga fixa. O CTO propõe levar **tudo** para uma Local Zone dessa cidade, inclusive o banco de contas dos jogadores, que precisa **continuar no ar se uma zona falhar**. Qual arquitetura atende aos dois requisitos?',
      concepts: [{ id: 'infra.local-zones' }, { id: 'infra.multi-az' }],
      xp: 5,
      difficulty: 2,
      domain: 'd3',
      options: [
        { id: 'a', text: 'Tudo na Local Zone, com o banco de contas em duas instâncias dentro dela.', correct: false, consequence: 'A Local Zone é uma zona só: duas instâncias nela caem juntas, e o banco não sobrevive à falha da zona.' },
        { id: 'b', text: 'Servidores de partida na Local Zone; banco em Multi-AZ na Região.', correct: true, consequence: 'Latência baixa onde ela importa e várias zonas para o banco, sem pagar preço de Local Zone pelo resto.' },
        { id: 'c', text: 'Tudo na Região, com instâncias maiores para compensar a distância.', correct: false, consequence: 'Instância maior não encurta a rede: a latência até a metrópole continua a mesma.' },
        { id: 'd', text: 'Servidores de partida numa Wavelength Zone; banco de contas na Local Zone.', correct: false, consequence: 'Wavelength atende celulares na rede da operadora, não banda larga fixa, e o banco continua numa zona só.' },
      ],
      explanation: [
        'Cada requisito pede uma infraestrutura. A **latência de um dígito** para uma metrópole longe da Região pede a **Local Zone**, só para o servidor de partidas. A **resiliência à falha de uma zona** pede o banco em **várias zonas da Região**, porque a Local Zone é uma zona única.',
        'Levar tudo para a Local Zone deixa o banco numa zona só, e ela oferece só parte dos serviços da Região. Instâncias maiores não reduzem latência de rede. E a Wavelength serve dispositivos na rede de uma operadora móvel.',
        '**Regra prática:** a Local Zone é uma zona a mais, perto de uma cidade, para o que precisa de latência baixa. Ela não substitui as várias zonas da Região quando o requisito é alta disponibilidade.',
      ],
    },
    {
      id: 'rv:fnd.f01.m4.a2',
      kind: 'decision',
      title: 'O fornecedor e a rede 5G',
      prompt:
        'Uma empresa de realidade aumentada vai lançar um recurso de visão computacional para celulares na rede 5G de uma operadora parceira da AWS, com latência ultrabaixa. O fornecedor propõe colocar também o **site público**, acessado de qualquer rede pela internet, na mesma Wavelength Zone, "porque ela é só mais uma Região". Qual arquitetura está correta?',
      concepts: [{ id: 'infra.wavelength' }],
      xp: 5,
      difficulty: 2,
      domain: 'd3',
      options: [
        { id: 'a', text: 'Recurso de realidade aumentada na Wavelength Zone; site público na Região.', correct: true, consequence: 'Os celulares da operadora ganham latência ultrabaixa, e o site atende qualquer rede a partir da Região.' },
        { id: 'b', text: 'Tudo na Wavelength Zone, liberando a entrada da internet pelo carrier gateway.', correct: false, consequence: 'O carrier gateway não aceita conexões de entrada vindas da internet: o site não seria alcançado.' },
        { id: 'c', text: 'Tudo numa Local Zone da cidade, que atende celulares 5G e internet do mesmo jeito.', correct: false, consequence: 'A Local Zone fica fora da rede da operadora: o tráfego dos celulares ainda sai da rede móvel antes de chegar a ela.' },
        { id: 'd', text: 'Tudo na Região, porque a Wavelength Zone muda só o preço, não a latência.', correct: false, consequence: 'A Wavelength existe justamente pela latência: o processamento fica dentro da rede da operadora.' },
      ],
      explanation: [
        'Uma **Wavelength Zone** é uma extensão da Região dentro da rede de uma operadora. Ela atende os dispositivos dessa rede pelo carrier gateway, que **não aceita conexões de entrada vindas da internet**. Por isso o recurso de realidade aumentada vai para a Wavelength Zone e o site público fica na Região.',
        'Abrir a Wavelength Zone para a internet não é possível. A Local Zone fica perto de uma cidade, mas fora da rede móvel. E a Wavelength não é uma questão de preço: ela muda o caminho do tráfego.',
        '**Regra prática:** Wavelength é para dispositivos móveis na rede de uma operadora parceira. Usuários de qualquer rede são atendidos pela Região, com a rede de borda quando for preciso.',
      ],
    },
    {
      id: 'rv:fnd.f01.service-link-caiu',
      kind: 'decision',
      multiple: true,
      title: 'Fábrica sem conexão com a Região',
      prompt:
        'Uma fábrica roda a inspeção das embalagens em instâncias de um AWS Outposts rack, e as câmeras falam com essas instâncias pela rede local. O service link, a conexão do Outpost com a Região, caiu por duas horas. Quais itens **continuam funcionando** durante a queda? (Escolha DUAS.)',
      concepts: [{ id: 'infra.outposts-service-link' }, { id: 'infra.outposts' }],
      xp: 5,
      difficulty: 2,
      domain: 'd2',
      options: [
        { id: 'a', text: 'As instâncias que já estavam rodando no Outpost.', correct: true, consequence: 'Continuam executando: rodar não depende da Região.' },
        { id: 'b', text: 'O lançamento de uma instância nova para dar conta de um pico.', correct: false, consequence: 'Lançar é uma operação do plano de controle, que fica na Região: falha até o link voltar.' },
        { id: 'c', text: 'O auto recovery de uma instância cujo servidor falhou.', correct: false, consequence: 'O auto recovery exige o service link conectado.' },
        { id: 'd', text: 'O acesso das câmeras às instâncias pela rede local, pelo Local Gateway.', correct: true, consequence: 'O tráfego local passa pelo Local Gateway e não depende da Região.' },
        { id: 'e', text: 'O envio das métricas ao CloudWatch em tempo real.', correct: false, consequence: 'A telemetria para; as métricas ficam guardadas no local por curtos períodos e são enviadas depois.' },
      ],
      explanation: [
        'O Outpost é uma extensão de uma Região, e o **plano de controle fica na Região**. Sem o service link, o que já está rodando continua: as instâncias seguem executando e as câmeras as alcançam pela rede local, pelo Local Gateway.',
        'Tudo o que depende da Região falha até a conexão voltar: lançar ou parar instâncias, o auto recovery e o envio da telemetria ao CloudWatch, que fica guardada no local por curtos períodos.',
        '**Regra prática:** com o service link fora, o Outpost mantém o que já existe e perde o que precisa da Região. Por isso a AWS exige link redundante, e a capacidade de sobra precisa estar rodando antes da queda.',
      ],
    },
    {
      id: 'rv:fnd.f01.m6.a4',
      kind: 'decision',
      title: 'Imagem que saiu do cache da cidade',
      prompt:
        'Uma loja serve imagens de produtos pelo CloudFront, com origem num servidor web em us-east-1, e as imagens têm TTL de 1 dia. Uma imagem pouco pedida foi buscada uma vez pela manhã; à tarde, o POP que atende a cidade já a tinha descartado por falta de uso. Quando um cliente dessa cidade pede a imagem de novo, **de onde ela normalmente vem**?',
      concepts: [{ id: 'edge.regional-edge-cache' }, { id: 'edge.pop' }],
      xp: 5,
      difficulty: 2,
      domain: 'd3',
      options: [
        { id: 'a', text: 'O POP vai direto à origem, porque a imagem saiu do cache dele.', correct: false, consequence: 'Pula a camada intermediária: o POP pergunta primeiro ao Regional Edge Cache.' },
        { id: 'b', text: 'O DNS manda o cliente a outro POP, que ainda tenha a imagem no cache.', correct: false, consequence: 'O DNS escolhe o POP pela latência, não pelo conteúdo do cache de cada um.' },
        { id: 'c', text: 'O POP busca a imagem no Regional Edge Cache, que tem cache maior e ainda a guarda.', correct: true, consequence: 'A imagem volta do cache regional, dentro do TTL, sem acionar a origem.' },
        { id: 'd', text: 'O POP responde com erro até alguém invalidar a imagem e ela ser buscada de novo.', correct: false, consequence: 'Um objeto fora do cache é buscado de novo de forma transparente; invalidação serve para remover, não para trazer.' },
      ],
      explanation: [
        'Entre os POPs e a origem há o **Regional Edge Cache**, uma camada com cache maior. Quando o POP não tem o objeto, ele normalmente pergunta ao cache regional antes de ir à origem. A imagem, ainda dentro do TTL, volta de lá, e o servidor em us-east-1 nem fica sabendo.',
        'Ir direto à origem ignora essa camada. O DNS não conhece o cache de cada POP. E a invalidação remove objetos dos caches; ela não é necessária para buscar de novo.',
        '**Regra prática:** o caminho de uma leitura no CloudFront é POP, depois Regional Edge Cache, depois origem. Conteúdo que perdeu popularidade costuma ser servido pelo cache regional.',
      ],
    },
    {
      id: 'rv:fnd.f01.lancamento-origem',
      kind: 'decision',
      title: 'Milhões de downloads na primeira hora',
      prompt:
        'Uma desenvolvedora de jogos vai liberar um instalador de 2 GB às 20h e espera milhões de downloads de jogadores do mundo todo na primeira hora. Hoje o arquivo é servido por duas instâncias EC2 atrás de um ALB em us-east-1. Ela quer que as instâncias **não fiquem sobrecarregadas** e que os downloads sejam rápidos, com o **menor esforço**. O que fazer?',
      concepts: [{ id: 'edge.cloudfront' }],
      xp: 5,
      difficulty: 1,
      domain: 'd3',
      options: [
        { id: 'a', text: 'Colocar o Global Accelerator na frente do ALB, para a rede da AWS acelerar cada download.', correct: false, consequence: 'O Global Accelerator não faz cache: cada um dos milhões de downloads continua chegando às duas instâncias.' },
        { id: 'b', text: 'Usar o Route 53 com roteamento por latência para as duas instâncias.', correct: false, consequence: 'As duas instâncias estão na mesma Região: o DNS não reduz a carga nem aproxima o arquivo dos jogadores.' },
        { id: 'c', text: 'Trocar as duas instâncias por instâncias maiores, com mais banda de rede.', correct: false, consequence: 'Aumenta o limite, mas toda a carga continua na origem, e os jogadores distantes seguem longe.' },
        { id: 'd', text: 'Colocar o CloudFront na frente do ALB, para os POPs responderem do cache.', correct: true, consequence: 'Depois da primeira busca em cada local, os POPs entregam o instalador perto dos jogadores, sem acionar as instâncias.' },
      ],
      explanation: [
        'Os dois requisitos são **aliviar a origem** e **entregar rápido no mundo todo**. O CloudFront faz as duas coisas com o cache: na primeira requisição, o POP busca o instalador na origem; as seguintes voltam do cache, perto do jogador.',
        'O Global Accelerator leva o tráfego pela rede da AWS, mas não guarda nada: cada download ainda chega às instâncias. O Route 53 só escolhe para onde mandar, e as instâncias maiores mantêm toda a carga na origem.',
        '**Regra prática:** conteúdo repetido para muita gente (arquivos, imagens, vídeos) pede CloudFront. Global Accelerator é para tráfego que não dá para guardar em cache, como TCP e UDP de aplicações.',
      ],
    },
    {
      id: 'rv:fnd.f01.backend-na-borda',
      kind: 'decision',
      title: 'Aplicação inteira nas edge locations',
      prompt:
        'Uma rede de varejo tem clientes em mais de 30 países. A maior parte das páginas é catálogo e imagens, que mudam poucas vezes por dia; o carrinho e o banco de pedidos rodam numa Região. Um gerente leu que a AWS tem centenas de edge locations e propõe "implantar a aplicação e o banco nelas". A empresa quer reduzir a latência das páginas com o **menor esforço operacional**. Qual resposta está correta?',
      concepts: [{ id: 'edge.pop' }, { id: 'edge.cloudfront' }],
      xp: 5,
      difficulty: 2,
      domain: 'd3',
      options: [
        { id: 'a', text: 'Lançar instâncias EC2 com o banco nas edge locations dos países com mais clientes.', correct: false, consequence: 'Edge location não é Região nem zona: não dá para lançar instâncias e um banco nela.' },
        { id: 'b', text: 'Manter aplicação e banco na Região e servir catálogo e imagens pelo CloudFront.', correct: true, consequence: 'As páginas que mais pesam passam a vir do cache dos POPs, perto dos clientes, sem mudar a aplicação.' },
        { id: 'c', text: 'Usar as edge locations para o banco e os POPs para o catálogo, que são estruturas diferentes.', correct: false, consequence: 'POP e edge location são o mesmo papel no CloudFront, e nenhum deles hospeda bancos.' },
        { id: 'd', text: 'Implantar a aplicação e o banco numa Região por continente, replicando os pedidos.', correct: false, consequence: 'Reduz a latência, mas multiplica a operação e exige replicar o banco: falha no menor esforço.' },
      ],
      explanation: [
        'As **edge locations** (ou POPs) atendem o usuário e guardam cópias em cache; elas não rodam a aplicação inteira como uma Região. Como o que mais pesa é catálogo e imagens que mudam pouco, o **CloudFront** resolve a latência com o cache nos POPs, e o carrinho e o banco continuam na Região.',
        'Lançar instâncias numa edge location não é possível, e POP e edge location não são infraestruturas diferentes. Uma Região por continente reduz a latência, mas com muito mais operação e com o banco replicado.',
        '**Regra prática:** a borda aproxima o conteúdo, não a aplicação. Quando a maior parte do que o usuário pede pode ficar em cache, o CloudFront costuma ser a resposta de menor esforço.',
      ],
    },
    {
      id: 'rv:fnd.f01.failover-dns',
      kind: 'decision',
      title: 'Trocar de Região sem mexer no DNS à mão',
      prompt:
        'Um sistema de reservas roda em sa-east-1 e tem uma cópia pronta, em espera, em us-east-1. A empresa quer que, se a aplicação em sa-east-1 deixar de responder, os clientes sejam levados **automaticamente** para us-east-1, sem ninguém alterar o DNS à mão. Qual configuração do Route 53 atende?',
      concepts: [{ id: 'edge.route53' }],
      xp: 5,
      difficulty: 2,
      domain: 'd2',
      options: [
        { id: 'a', text: 'Um registro simples com os endereços das duas Regiões.', correct: false, consequence: 'O registro simples não verifica a saúde: continua entregando o endereço de sa-east-1 mesmo com ela fora do ar.' },
        { id: 'b', text: 'Registros de geolocalização, levando os clientes do Brasil para sa-east-1 e os demais para us-east-1.', correct: false, consequence: 'Separa os clientes por país, mas sem verificação de saúde os brasileiros continuam indo para a Região fora do ar.' },
        { id: 'c', text: 'Registros de failover, com sa-east-1 como primário e verificação de saúde.', correct: true, consequence: 'Quando a verificação falha, o Route 53 passa a responder com o registro secundário, em us-east-1.' },
        { id: 'd', text: 'Registros ponderados, com peso 100 para sa-east-1 e 0 para us-east-1.', correct: false, consequence: 'Sem verificação de saúde, os pesos nunca mudam: todo o tráfego segue para sa-east-1.' },
      ],
      explanation: [
        'O que decide é a troca **automática** quando a aplicação deixa de responder. A política de **failover** do Route 53 faz isso: o registro primário fica associado a uma verificação de saúde, e, quando ela falha, o DNS passa a responder com o secundário.',
        'O registro simples, a geolocalização e os pesos fixos, sem verificação de saúde, continuam mandando clientes para a Região fora do ar. A geolocalização e os pesos servem para outros objetivos: conteúdo por país e divisão de tráfego.',
        '**Regra prática:** "levar os clientes para outra Região quando a principal falhar" pede registros de failover com verificação de saúde. Latência, geolocalização e pesos resolvem outros problemas.',
      ],
    },
    {
      id: 'rv:fnd.f01.dns-em-cache',
      kind: 'decision',
      title: 'Clientes presos à Região desligada',
      prompt:
        'Uma API de pagamentos roda atrás de ALBs em duas Regiões, com failover pelo Route 53. Num teste, alguns clientes corporativos continuaram mandando requisições para a Região desligada por quase meia hora, porque os servidores de DNS deles guardam as respostas além do TTL. A empresa quer que a troca de Região leve **segundos** para todos os clientes, **sem depender do DNS deles**. O que atende?',
      concepts: [{ id: 'edge.global-accelerator' }, { id: 'edge.route53' }],
      xp: 5,
      difficulty: 3,
      domain: 'd2',
      options: [
        { id: 'a', text: 'Reduzir o TTL dos registros de failover para 5 segundos.', correct: false, consequence: 'Ajuda quem respeita o TTL, mas os servidores de DNS desses clientes o ignoram: o problema continua.' },
        { id: 'b', text: 'AWS Global Accelerator, com os dois ALBs como endpoints atrás de IPs fixos.', correct: true, consequence: 'Os clientes usam sempre os mesmos IPs, e a troca de Região acontece na rede da AWS, sem nova consulta de DNS.' },
        { id: 'c', text: 'Amazon CloudFront na frente dos dois ALBs, guardando em cache as respostas da API.', correct: false, consequence: 'Respostas de pagamento não podem ser reaproveitadas de um cache, e o problema é a troca de Região, não a carga.' },
        { id: 'd', text: 'Trocar o failover por roteamento por latência, com verificação de saúde.', correct: false, consequence: 'Continua sendo DNS: os clientes que guardam respostas além do TTL seguem indo para a Região desligada.' },
      ],
      explanation: [
        'O problema está **no DNS dos clientes**, que guarda a resposta além do TTL. Qualquer solução baseada em DNS herda esse atraso. O **Global Accelerator** dá dois IPs fixos anycast; os clientes conectam sempre neles, e a escolha do endpoint saudável acontece na rede da AWS, em segundos.',
        'Diminuir o TTL ou trocar a política do Route 53 continua dependendo de uma nova consulta de DNS. E o CloudFront é para conteúdo que pode ficar em cache, o que não é o caso de pagamentos.',
        '**Regra prática:** "failover entre Regiões sem depender do cache de DNS" ou "IPs fixos para liberar no firewall" apontam para o Global Accelerator. Failover por DNS funciona, mas fica sujeito ao TTL e a quem não o respeita.',
      ],
    },
    {
      id: 'rv:fnd.f01.snapshots-na-outra-regiao',
      kind: 'decision',
      title: 'Plano de recuperação sem os snapshots',
      prompt:
        'Uma empresa tira snapshots diários dos volumes EBS dos servidores em us-east-1 e escreveu no plano de recuperação: "se us-east-1 cair, recriamos os servidores em us-west-2 a partir dos snapshots". Num teste, a equipe não encontrou nenhum snapshot em us-west-2. O que corrige o plano para que ele permita **recriar os servidores em us-west-2**?',
      concepts: [{ id: 'infra.no-auto-replication' }],
      xp: 5,
      difficulty: 1,
      domain: 'd2',
      options: [
        { id: 'a', text: 'Esperar a AWS replicar os snapshots para a Região vizinha, o que leva até 24 horas.', correct: false, consequence: 'Essa replicação não existe: os snapshots ficam só na Região em que foram criados.' },
        { id: 'b', text: 'Tornar os snapshots públicos, para que apareçam em todas as Regiões.', correct: false, consequence: 'Público muda quem pode ver, não onde o snapshot está, e ainda expõe os dados da empresa a qualquer conta.' },
        { id: 'c', text: 'Copiar os snapshots para us-west-2 regularmente, como parte da rotina de backup.', correct: true, consequence: 'Com a cópia em us-west-2, os servidores podem ser recriados lá mesmo com us-east-1 fora do ar.' },
        { id: 'd', text: 'Espalhar os servidores por várias zonas de us-east-1 antes de tirar os snapshots.', correct: false, consequence: 'Várias zonas ajudam na falha de uma zona, mas os snapshots continuam só em us-east-1.' },
      ],
      explanation: [
        'Recursos e dados de uma Região **não existem em outra** sem uma cópia explícita. Os snapshots ficam em us-east-1, onde foram criados, e o plano só funciona se uma rotina os **copiar para us-west-2** com a frequência que a recuperação exige.',
        'A AWS não replica snapshots sozinha. Torná-los públicos muda a visibilidade, não a Região, e expõe os dados. E várias zonas em us-east-1 continuam dentro da Região que o plano supõe perdida.',
        '**Regra prática:** todo plano que diz "recuperar em outra Região" precisa de uma cópia configurada para lá. Teste o plano: se a cópia não estiver na Região de destino, ele não funciona.',
      ],
    },
  ],
}
