/**
 * Questões da Revisão da Fase 1 de Bancos de dados (RDS essencial), no formato
 * do exame SAA-C03. Fatos conferidos em 21/10/2026 (ver
 * docs/VERIFICACAO-DE-CONTEUDO.md). As empresas são fictícias.
 */
import type { ReviewSet } from '../../../../engine/types'

export const REVIEW_F01: ReviewSet = {
  phaseId: 'db.f01',
  questions: [
    {
      id: 'rv:db.f01.consultas-lentas',
      kind: 'decision',
      title: 'Migrou para o RDS e continua lento',
      prompt:
        'Uma loja migrou seu MySQL do EC2 para o **Amazon RDS** para reduzir o trabalho de operação. Um mês depois, as mesmas **consultas lentas** da tela de relatórios continuam lentas, com a CPU e os IOPS do banco folgados. Quem deve resolver e como?',
      concepts: [{ id: 'rds.what' }],
      xp: 5,
      difficulty: 1,
      domain: 'd3',
      options: [
        { id: 'a', text: 'A AWS, que otimiza as consultas como parte do serviço gerenciado.', correct: false, consequence: 'O RDS cuida de patches, backups e recuperação; ajustar consultas continua sendo do cliente.' },
        { id: 'b', text: 'A equipe da loja, ajustando as consultas e os índices.', correct: true, consequence: 'O desenho do banco e o ajuste das consultas continuam com o cliente, mesmo num banco gerenciado.' },
        { id: 'c', text: 'Ninguém: ligar o Multi-AZ distribui as consultas entre as duas instâncias.', correct: false, consequence: 'O standby do Multi-AZ não atende consultas; ele existe para assumir numa falha.' },
        { id: 'd', text: 'A AWS, aplicando os patches do motor na próxima janela de manutenção.', correct: false, consequence: 'Patches corrigem o motor, não consultas mal escritas ou sem índice.' },
      ],
      explanation: [
        'No **RDS**, a AWS instala o sistema operacional e o motor, aplica patches, faz backups, detecta falhas e recupera a instância. O **desenho do banco e o ajuste das consultas** continuam com o cliente. Com CPU e IOPS folgados, o caminho é a equipe analisar as consultas e criar os índices que faltam.',
        'O serviço gerenciado não reescreve consultas. O standby do Multi-AZ não recebe leituras. E patches não mudam o plano de uma consulta ruim.',
        '**Regra prática:** banco gerenciado tira a operação da infraestrutura, não o trabalho de modelagem e de consultas. Achar que o RDS otimiza as consultas da aplicação é um erro comum.',
      ],
    },
    {
      id: 'rv:db.f01.agente-no-servidor',
      kind: 'decision',
      title: 'Banco que exige um agente no sistema operacional',
      prompt:
        'Um fornecedor de software exige, por contrato, que o servidor do banco PostgreSQL tenha **um agente de auditoria instalado no sistema operacional**, com acesso root. Fora isso, a empresa preferiria o menor esforço de operação. Onde o banco deve rodar?',
      concepts: [{ id: 'rds.vs-ec2' }, { id: 'rds.what' }],
      xp: 5,
      difficulty: 2,
      domain: 'd3',
      options: [
        { id: 'a', text: 'Num RDS for PostgreSQL, com o agente configurado num parameter group próprio.', correct: false, consequence: 'O parameter group ajusta parâmetros do motor; não instala software no sistema operacional.' },
        { id: 'b', text: 'Num RDS for PostgreSQL, com o agente adicionado por um option group.', correct: false, consequence: 'Option groups ligam recursos previstos de alguns motores; não dão acesso root para instalar um agente.' },
        { id: 'c', text: 'Numa instância EC2, com o PostgreSQL e o agente instalados pela equipe.', correct: true, consequence: 'Só no EC2 há acesso ao sistema operacional; em troca, backups, patches e failover ficam com a equipe.' },
        { id: 'd', text: 'Num cluster Aurora PostgreSQL, que dá mais controle que o RDS.', correct: false, consequence: 'O Aurora também é gerenciado e não dá acesso ao sistema operacional.' },
      ],
      explanation: [
        'A AWS recomenda o RDS como escolha padrão para bancos relacionais, mas ele **não dá acesso ao sistema operacional**. Quando um requisito exige isso, como um agente instalado com root, o banco vai para o **EC2**, e a equipe assume sistema operacional, patches, backups, alta disponibilidade e escala.',
        'Parameter groups e option groups configuram o motor dentro do que o RDS permite. O Aurora é tão gerenciado quanto o RDS nesse ponto.',
        '**Regra prática:** acesso ao sistema operacional, motor fora da lista ou configuração que o RDS não permite levam ao EC2. Nos outros casos, o RDS reduz o esforço operacional.',
      ],
    },
    {
      id: 'rv:db.f01.m1.a2',
      kind: 'decision',
      title: 'O sistema da empresa comprada',
      prompt:
        'Uma empresa comprou um concorrente cujo sistema usa **Microsoft SQL Server**, e quer levá-lo para um banco gerenciado na AWS **sem reescrever a aplicação**. A equipe tem licenças do SQL Server, mas aceita pagar a licença junto com o serviço, se for mais simples. Qual opção atende?',
      concepts: [{ id: 'rds.engines' }],
      xp: 5,
      difficulty: 1,
      domain: 'd3',
      options: [
        { id: 'a', text: 'Reescrever o sistema para PostgreSQL, o único motor comercial-compatível do RDS.', correct: false, consequence: 'O RDS roda o SQL Server: não é preciso reescrever nada para usar um banco gerenciado.' },
        { id: 'b', text: 'Amazon Aurora, que é compatível com o SQL Server.', correct: false, consequence: 'O Aurora é compatível com MySQL e PostgreSQL, não com o SQL Server.' },
        { id: 'c', text: 'Instalar o SQL Server numa instância EC2, porque o RDS não roda motores comerciais.', correct: false, consequence: 'O RDS roda motores comerciais como Oracle, SQL Server e Db2.' },
        { id: 'd', text: 'Amazon RDS for SQL Server, com a licença incluída ou trazida, conforme a edição.', correct: true, consequence: 'O sistema continua no mesmo motor, agora gerenciado, e a licença pode vir no preço ou ser trazida.' },
      ],
      explanation: [
        'O RDS roda **seis motores**: IBM Db2, MariaDB, Microsoft SQL Server, MySQL, Oracle e PostgreSQL. Para os comerciais, a licença pode vir **incluída no preço** ou ser **trazida pelo cliente**, conforme o motor e a edição. O sistema vai para o RDS for SQL Server sem reescrita.',
        'Reescrever para outro motor é desnecessário. O Aurora é compatível com MySQL e PostgreSQL. E o EC2 só se justifica com requisitos que o RDS não atende.',
        '**Regra prática:** antes de propor reescrita ou EC2, confira se o motor está entre os seis do RDS. O Aurora tem guia e arquitetura próprios, compatível com MySQL e PostgreSQL.',
      ],
    },
    {
      id: 'rv:db.f01.m2.a1',
      kind: 'decision',
      title: 'Banco com pouca memória e CPU folgada',
      prompt:
        'Um RDS for PostgreSQL numa **db.m7g.xlarge** tem a CPU em 25%, mas as métricas mostram pouca memória livre e muitas leituras indo ao disco, porque o conjunto de dados mais usado não cabe no cache do banco. A empresa quer **mais memória sem pagar por CPU que não usa**. Qual classe atende?',
      concepts: [{ id: 'rds.instance-class' }],
      xp: 5,
      difficulty: 2,
      domain: 'd3',
      options: [
        { id: 'a', text: 'db.r7g.xlarge', correct: true, consequence: 'A série r é otimizada para memória: mais memória por vCPU, no mesmo tamanho e com Graviton.' },
        { id: 'b', text: 'db.c7g.xlarge', correct: false, consequence: 'A série c dá mais CPU por memória, o oposto do que o banco precisa.' },
        { id: 'c', text: 'db.t4g.xlarge', correct: false, consequence: 'A série t é burstable, pensada para CPU baixa com picos; não resolve a falta de memória.' },
        { id: 'd', text: 'db.m7g.2xlarge', correct: false, consequence: 'Dobra a memória, mas dobra também a CPU, que já sobra.' },
      ],
      explanation: [
        'A classe define CPU e memória, com nomes iguais aos do EC2 e o prefixo db.: **db.m** é uso geral; **db.r**, db.x e db.z são de memória; **db.c** é de computação; **db.t** é burstable. Em db.r7g.xlarge, r é a série de memória, 7 a geração, g o Graviton e xlarge o tamanho. Com memória curta e CPU folgada, a série r no mesmo tamanho resolve.',
        'A série c aumenta o que já sobra. A t não foi feita para isso. E um tamanho maior da m paga CPU que não é usada. A classe de uma instância existente pode ser trocada.',
        '**Regra prática:** leia o gargalo do banco como no EC2: memória, série r (ou x e z); CPU, série c; uso baixo com picos, série t. CPU alta o dia todo numa db.t pede sair da burstable.',
      ],
    },
    {
      id: 'rv:db.f01.classe-segura-o-io2',
      kind: 'decision',
      title: 'IOPS provisionados que não aparecem',
      prompt:
        'Um RDS for MySQL crítico recebeu um volume **io2 Block Express com 40.000 IOPS** provisionados. Mesmo assim, nos picos, o banco não passa de cerca de 15.000 IOPS, e as métricas mostram a **largura de banda da instância** no limite. A instância é uma **db.m7g.large**. Qual mudança faz o banco aproveitar os IOPS provisionados?',
      concepts: [{ id: 'rds.storage' }],
      xp: 5,
      difficulty: 3,
      domain: 'd3',
      options: [
        { id: 'a', text: 'Provisionar ainda mais IOPS no volume io2 atual.', correct: false, consequence: 'O volume já oferece mais do que a instância consegue usar; mais IOPS continuariam sobrando.' },
        { id: 'b', text: 'Trocar o volume por gp3, que tem mais throughput.', correct: false, consequence: 'O limite está na instância, não no tipo de volume; e o gp3 entrega menos que o io2.' },
        { id: 'c', text: 'Ligar o autoscaling de armazenamento.', correct: false, consequence: 'O autoscaling aumenta o espaço quando ele acaba; não muda a largura de banda.' },
        { id: 'd', text: 'Trocar a instância por uma classe maior.', correct: true, consequence: 'Com mais banda na instância, o banco passa a usar os IOPS que o volume já oferece.' },
      ],
      explanation: [
        'O desempenho real do armazenamento do RDS também é **limitado pela classe da instância**. Uma classe pequena tem largura de banda menor e não consegue usar todo o desempenho de um io2 Block Express. Com a banda da instância no limite, a correção é uma **classe maior**.',
        'Mais IOPS no volume não passam pelo gargalo da instância. Trocar para gp3 reduz o desempenho disponível. E o autoscaling trata de espaço, não de velocidade.',
        '**Regra prática:** se o banco não ganha desempenho mesmo com mais IOPS, olhe a classe da instância. Esperar o desempenho do io2 de uma classe pequena é um erro comum.',
      ],
    },
    {
      id: 'rv:db.f01.dois-bancos-dois-volumes',
      kind: 'decision',
      title: 'Um banco de pagamentos e um de relatórios',
      prompt:
        'Uma fintech vai criar dois bancos no RDS. O de **pagamentos** precisa de **latência abaixo de 1 ms** e cerca de 100.000 IOPS. O de **relatórios internos** tem 600 GiB e usa poucos milhares de IOPS. A empresa quer o **menor custo** que atenda aos dois. Qual combinação de armazenamento atende?',
      concepts: [{ id: 'rds.storage' }],
      xp: 5,
      difficulty: 2,
      domain: 'd4',
      options: [
        { id: 'a', text: 'io2 Block Express nos dois bancos.', correct: false, consequence: 'Atende, mas paga desempenho e latência de produção crítica num banco de relatórios que não precisa.' },
        { id: 'b', text: 'gp3 nos dois bancos, com IOPS provisionados no de pagamentos.', correct: false, consequence: 'O gp3 não entrega latência abaixo de 1 ms nem os 100.000 IOPS do banco de pagamentos.' },
        { id: 'c', text: 'io2 Block Express no de pagamentos e gp3 no de relatórios.', correct: true, consequence: 'Cada banco paga pelo desempenho que precisa: o io2 só onde a latência crítica exige.' },
        { id: 'd', text: 'gp3 no de pagamentos e io2 Block Express no de relatórios.', correct: false, consequence: 'Inverte os requisitos: o banco crítico fica sem a latência exigida, e o de relatórios paga caro.' },
      ],
      explanation: [
        'No RDS, o **gp3** é o armazenamento de uso geral, e o **io2 Block Express** chega a 256.000 IOPS com latência abaixo de 1 ms, para produção crítica. O banco de pagamentos precisa do io2; o de relatórios, com 600 GiB e poucos IOPS, fica bem no gp3, que a partir de 400 GiB ainda aceita desempenho provisionado se precisar.',
        'io2 nos dois desperdiça dinheiro no banco de relatórios. gp3 nos dois deixa o banco de pagamentos sem a latência exigida. E inverter não atende nenhum dos dois.',
        '**Regra prática:** "latência abaixo de 1 ms" e "IOPS muito altos" num banco crítico apontam para o io2 Block Express; para o resto, gp3.',
      ],
    },
    {
      id: 'rv:db.f01.carga-de-uma-vez',
      kind: 'decision',
      title: 'Importação grande num banco com autoscaling',
      prompt:
        'Um RDS for PostgreSQL tem **500 GiB alocados**, quase cheios, e o autoscaling de armazenamento ligado com limite de 4.000 GiB. No fim de semana, a equipe vai importar **2 TiB de dados históricos de uma vez**. Ela quer que a importação **não pare por falta de espaço**. Qual providência atende?',
      concepts: [{ id: 'rds.storage-autoscaling' }],
      xp: 5,
      difficulty: 3,
      domain: 'd2',
      options: [
        { id: 'a', text: 'Nenhuma: o autoscaling cresce o volume conforme a importação avança.', correct: false, consequence: 'Cada aumento é limitado (10 GiB, 10% ou o crescimento previsto) e há no máximo quatro alterações em 24 horas: ele pode não acompanhar.' },
        { id: 'b', text: 'Aumentar o armazenamento alocado antes da importação.', correct: true, consequence: 'O espaço já está lá quando a carga começa, sem depender do ritmo do autoscaling.' },
        { id: 'c', text: 'Desligar o autoscaling durante a importação, para ele não atrapalhar.', correct: false, consequence: 'Sem autoscaling e sem espaço extra, o banco fica sem disco ainda mais cedo.' },
        { id: 'd', text: 'Importar e depois apagar dados antigos, para o volume encolher de volta.', correct: false, consequence: 'O espaço alocado nunca diminui, e o problema é ter espaço durante a importação.' },
      ],
      explanation: [
        'O **autoscaling de armazenamento** aumenta o volume quando o espaço livre fica em 10% ou menos por 5 minutos, em passos do maior entre 10 GiB, 10% do tamanho atual e o crescimento previsto para 7 horas, com **no máximo quatro alterações em 24 horas**. Numa carga enorme de uma vez, ele pode não acompanhar. O seguro é **aumentar o alocado antes**.',
        'Confiar só no autoscaling arrisca parar a importação. Desligá-lo piora. E o volume não encolhe depois.',
        '**Regra prática:** autoscaling de armazenamento é para crescimento contínuo e imprevisível. Para uma carga grande planejada, aumente o espaço antes; e lembre que ele só cresce.',
      ],
    },
    {
      id: 'rv:rds.parameter-group.static',
      kind: 'decision',
      title: 'Uma semana em pending-reboot',
      prompt:
        'Uma equipe mudou um **parâmetro estático** do PostgreSQL num parameter group próprio, associado à instância de produção. Uma semana depois, a instância ainda mostra **pending-reboot**, a janela de manutenção já passou, e o valor antigo continua valendo. Qual ação faz o parâmetro novo valer?',
      concepts: [{ id: 'rds.parameter-group' }],
      xp: 5,
      difficulty: 2,
      domain: 'd2',
      options: [
        { id: 'a', text: 'Esperar a próxima janela de manutenção, quando o RDS reinicia a instância.', correct: false, consequence: 'O status pending-reboot não reinicia a instância sozinho na janela de manutenção.' },
        { id: 'b', text: 'Copiar o parâmetro para o parameter group padrão.', correct: false, consequence: 'O grupo padrão não pode ser alterado, e a instância já usa o grupo próprio.' },
        { id: 'c', text: 'Reiniciar a instância num horário planejado.', correct: true, consequence: 'Parâmetros estáticos só valem depois de um reboot, que precisa ser feito pela equipe.' },
        { id: 'd', text: 'Aplicar a mudança com a opção de aplicar imediatamente, sem reiniciar.', correct: false, consequence: 'Aplicar imediatamente vale para parâmetros dinâmicos; os estáticos continuam esperando o reboot.' },
      ],
      explanation: [
        'O parameter group guarda a configuração do motor. **Parâmetros dinâmicos** valem na hora; **estáticos**, só depois de **reiniciar** a instância. O status pending-reboot avisa isso, mas **não reinicia sozinho** na janela de manutenção. A equipe precisa reiniciar, num horário que convenha.',
        'Esperar a janela não resolve. O grupo padrão não pode ser editado. E aplicar imediatamente não dispensa o reboot de um parâmetro estático.',
        '**Regra prática:** para mudar parâmetros, crie um grupo próprio (o padrão não se edita), associe à instância e, para os estáticos, programe um reboot. Lembre que mudar um grupo afeta todas as instâncias associadas a ele.',
      ],
    },
    {
      id: 'rv:db.f01.acesso-de-casa',
      kind: 'decision',
      title: 'Desenvolvedores querendo o banco de casa',
      prompt:
        'Um RDS for PostgreSQL de produção fica em subnets privadas, com **Public access desligado**. Os desenvolvedores querem consultar o banco **de casa**, de vez em quando, e um deles propôs ligar o acesso público com o IP de cada um no security group. A empresa quer que o banco **continue sem acesso pela internet**. Qual solução atende?',
      concepts: [{ id: 'rds.subnet-group' }],
      xp: 5,
      difficulty: 2,
      domain: 'd1',
      options: [
        { id: 'a', text: 'Ligar o Public access e liberar no security group o IP de cada desenvolvedor.', correct: false, consequence: 'O banco passa a ter IP público e fica alcançável pela internet, mesmo com regras restritas.' },
        { id: 'b', text: 'Mover o banco para subnets públicas, mantendo o Public access desligado.', correct: false, consequence: 'Sem Public access o banco continua sem IP público, então a mudança não dá o acesso e ainda enfraquece o desenho.' },
        { id: 'c', text: 'Encaminhar a porta do banco por uma sessão do Session Manager numa instância da VPC.', correct: true, consequence: 'O banco continua privado; o acesso passa por uma sessão controlada pelo IAM, sem porta aberta para a internet.' },
        { id: 'd', text: 'Ligar o Public access só no horário comercial, com o IP de cada um liberado.', correct: false, consequence: 'Mesmo por algumas horas, o banco fica alcançável pela internet, o que o requisito proíbe.' },
      ],
      explanation: [
        'Para um banco do RDS ser acessível pela internet, ele precisaria de **Public access ligado**, **subnets públicas** e um security group que permita a entrada. O requisito é manter tudo isso desligado. O acesso eventual de fora passa por algo dentro da VPC: uma sessão do **Session Manager** numa instância, com encaminhamento de porta até o banco, controlada pelo IAM.',
        'Ligar o acesso público expõe o banco. Subnets públicas sem Public access não mudam nada útil. E abrir o acesso público só por algumas horas continua expondo o banco.',
        '**Regra prática:** em questões de segurança, o banco fica em subnets privadas, com o acesso público desligado e um security group que aceita só a camada de aplicação. Ligar o acesso público "para facilitar" é distrator.',
      ],
    },
    {
      id: 'rv:db.f01.ip-do-banco',
      kind: 'decision',
      title: 'Aplicação perdida depois do failover',
      prompt:
        'Um RDS for MySQL Multi-AZ passou por um failover de madrugada. O banco voltou em um minuto, mas a aplicação ficou fora do ar até a manhã, porque a string de conexão usava o **endereço IP** do banco, descoberto pela equipe meses antes. Qual mudança evita que isso se repita?',
      concepts: [{ id: 'rds.subnet-group' }],
      xp: 5,
      difficulty: 1,
      domain: 'd2',
      options: [
        { id: 'a', text: 'Conectar pelo nome DNS do endpoint do banco.', correct: true, consequence: 'O endpoint passa a apontar para a nova primária no failover, e a aplicação segue o nome.' },
        { id: 'b', text: 'Associar um Elastic IP ao banco e usar esse endereço na aplicação.', correct: false, consequence: 'Instâncias do RDS não recebem Elastic IP; a conexão é feita pelo endpoint.' },
        { id: 'c', text: 'Fixar o IP privado do banco nas configurações do DB subnet group.', correct: false, consequence: 'O subnet group escolhe as subnets; não fixa o IP, que muda no failover.' },
        { id: 'd', text: 'Desligar o Multi-AZ, para o IP nunca mudar.', correct: false, consequence: 'Tira a alta disponibilidade, e o IP ainda pode mudar em outras operações.' },
      ],
      explanation: [
        'No RDS, a conexão deve ser feita sempre pelo **nome DNS do endpoint**: no failover, o endpoint passa a apontar para a nova primária, e o **IP muda**. Uma aplicação presa ao IP antigo fica conectando no lugar errado.',
        'O RDS não usa Elastic IP. O subnet group define em quais subnets o banco pode ficar e precisa de pelo menos duas zonas para o standby; ele não fixa endereços. E desligar o Multi-AZ troca o problema por outro maior.',
        '**Regra prática:** aplicações falam com o RDS pelo endpoint, nunca pelo IP. O subnet group com duas zonas é o que permite o standby que assume no failover.',
      ],
    },
    {
      id: 'rv:db.f01.m3.a4',
      kind: 'decision',
      title: 'Nova versão principal do PostgreSQL',
      prompt:
        'Uma empresa quer subir o RDS for PostgreSQL Multi-AZ para uma **nova versão principal**. Ela precisa **testar a versão nova com os dados reais** antes de virar a chave e quer a **menor parada possível** na troca. Qual abordagem atende?',
      concepts: [{ id: 'rds.maintenance' }],
      xp: 5,
      difficulty: 2,
      domain: 'd2',
      options: [
        { id: 'a', text: 'Atualizar na janela de manutenção, contando com o Multi-AZ para evitar a parada.', correct: false, consequence: 'Na atualização de versão do motor, as duas instâncias mudam ao mesmo tempo, e o banco fica fora do ar até terminar.' },
        { id: 'b', text: 'Usar o Blue/Green Deployments, testar o ambiente verde e fazer a troca.', correct: true, consequence: 'Uma cópia sincronizada recebe a versão nova para teste, e a troca costuma parar o banco por menos de 1 minuto.' },
        { id: 'c', text: 'Aplicar a atualização imediatamente fora do horário comercial.', correct: false, consequence: 'Não há teste prévio com os dados reais, e a parada dura toda a atualização.' },
        { id: 'd', text: 'Desligar o Multi-AZ, atualizar e religá-lo depois.', correct: false, consequence: 'Não reduz a parada da atualização e deixa o banco sem standby no meio do processo.' },
      ],
      explanation: [
        'O **Blue/Green Deployments** (MySQL, MariaDB e PostgreSQL) mantém uma **cópia sincronizada** do banco, onde a versão nova pode ser testada, e troca de ambiente com parada em geral **abaixo de 1 minuto**.',
        'O Multi-AZ reduz a parada dos patches de sistema operacional, aplicados primeiro no standby. Na **atualização de versão do motor**, porém, as duas instâncias mudam juntas, e o banco fica fora do ar até terminar.',
        '**Regra prática:** "atualizar a versão do motor com o mínimo de indisponibilidade" é Blue/Green Deployments. Achar que o Multi-AZ elimina a parada da atualização de versão é um erro comum.',
      ],
    },
  ],
}
