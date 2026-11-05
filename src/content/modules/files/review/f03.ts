/**
 * Questões da Revisão da Fase 3 de Arquivos e backup (FSx for Windows File
 * Server), no formato do exame SAA-C03. Fatos conferidos em
 * docs.aws.amazon.com (ver docs/VERIFICACAO-DE-CONTEUDO.md). Os preços são
 * premissas do enunciado. As empresas são fictícias.
 */
import type { ReviewSet } from '../../../../engine/types'

export const REVIEW_F03: ReviewSet = {
  phaseId: 'fil.f03',
  questions: [
    {
      id: 'rv:fil.f03.m1.a1',
      kind: 'decision',
      title: 'Windows e Linux na mesma pasta',
      prompt:
        'Num escritório de engenharia, as estações **Windows** abrem as pastas de projetos por **SMB**, com permissões do **Active Directory**, e um servidor **Linux** de relatórios precisa ler essas mesmas pastas. A empresa quer um serviço **gerenciado**, sem manter servidores de arquivos. Qual serviço atende?',
      concepts: [{ id: 'fsxw.what' }, { id: 'fsx.family' }],
      xp: 5,
      difficulty: 2,
      domain: 'd3',
      options: [
        { id: 'a', text: 'Amazon EFS, montado pelo servidor Linux e pelas estações.', correct: false, consequence: 'O EFS é NFS e não é suportado em Windows; as ACLs do AD ficariam de fora.' },
        { id: 'b', text: 'Amazon FSx for Lustre, ligado ao Active Directory.', correct: false, consequence: 'O Lustre é para alto desempenho em Linux, não para pastas de escritório por SMB.' },
        { id: 'c', text: 'Amazon FSx for Windows File Server, no AD da empresa.', correct: true, consequence: 'Windows e Linux acessam por SMB, com as permissões do AD e as ACLs do Windows.' },
        { id: 'd', text: 'Um servidor de arquivos Windows em EC2 com volume EBS.', correct: false, consequence: 'Atende ao SMB, mas a empresa continua cuidando do servidor, das correções e dos backups.' },
      ],
      explanation: [
        'Os sinais são **SMB, Active Directory e ACLs do Windows**, com a exigência de serviço gerenciado. O **FSx for Windows File Server** entra no AD da empresa e serve as pastas por SMB (versões 2.0 a 3.1.1) tanto para clientes **Windows** quanto **Linux**.',
        'O EFS não funciona em Windows. O FSx for Lustre é outro membro da família, para HPC em Linux. Um servidor próprio em EC2 resolve o protocolo, mas deixa toda a operação com a empresa.',
        '**Regra prática:** SMB com Active Directory, inclusive com clientes Linux, aponta para o FSx for Windows File Server.',
      ],
    },
    {
      id: 'rv:fil.f03.o-que-a-aws-assume',
      kind: 'decision',
      title: 'O que sai da mão do time',
      prompt:
        'Uma empresa mantém **servidores de arquivos Windows em EC2** e quer migrá-los para o Amazon FSx for Windows File Server para **reduzir o esforço de operação**. A diretoria pede a lista do que **deixa de ser tarefa do time** depois da migração. Quais tarefas a AWS passa a assumir? (Escolha DUAS.)',
      concepts: [{ id: 'fsx.family' }],
      xp: 5,
      difficulty: 1,
      domain: 'd3',
      multiple: true,
      options: [
        { id: 'a', text: 'Aplicar as correções no sistema operacional dos servidores de arquivos.', correct: true, consequence: 'O FSx é gerenciado: a AWS cuida das correções dos servidores.' },
        { id: 'b', text: 'Definir as ACLs de cada pasta para os grupos dos departamentos.', correct: false, consequence: 'As permissões das pastas continuam sendo decisão do time.' },
        { id: 'c', text: 'Substituir os discos e servidores que apresentarem falha de hardware.', correct: true, consequence: 'A AWS troca o que falha, sem o time abrir chamado.' },
        { id: 'd', text: 'Criar e desativar as contas dos funcionários no Active Directory.', correct: false, consequence: 'O AD e os usuários dele continuam sob o controle da empresa.' },
        { id: 'e', text: 'Decidir quais compartilhamentos precisam do Multi-AZ.', correct: false, consequence: 'Escolher a implantação de cada sistema de arquivos é decisão de arquitetura do time.' },
      ],
      explanation: [
        'A família **Amazon FSx** oferece sistemas de arquivos conhecidos (Windows File Server, Lustre, NetApp ONTAP e OpenZFS) **gerenciados pela AWS**: ela cuida dos servidores, das **correções**, das **falhas de hardware** e dos backups automáticos diários, e todos criptografam em repouso com o KMS.',
        'O que continua com a empresa é o que depende do negócio: as permissões das pastas, as contas no Active Directory e as escolhas de arquitetura, como Single-AZ ou Multi-AZ.',
        '**Regra prática:** "reduzir o esforço de manter servidores de arquivos" aponta para o FSx; permissões, usuários e escolhas de arquitetura continuam com o cliente.',
      ],
    },
    {
      id: 'rv:fil.f03.m1.a2:connector',
      kind: 'decision',
      title: 'O diretório que o FSx recusa',
      prompt:
        'Uma empresa já usa um **AD Connector** apontando para o Active Directory do data center, alcançado por VPN. Ao criar o FSx for Windows File Server, escolheu esse AD Connector, e a criação **falhou**. O requisito é manter os **usuários e grupos do AD do data center** com o **menor esforço**. Qual opção atende?',
      concepts: [{ id: 'fsxw.what' }],
      xp: 5,
      difficulty: 2,
      domain: 'd1',
      options: [
        { id: 'a', text: 'Criar um Simple AD e copiar os usuários do data center para ele.', correct: false, consequence: 'O FSx também não aceita Simple AD, e os usuários ficariam duplicados.' },
        { id: 'b', text: 'Ingressar o FSx diretamente no AD do data center, pela VPN.', correct: true, consequence: 'O FSx aceita um AD próprio, e os usuários e grupos continuam os mesmos.' },
        { id: 'c', text: 'Recriar o AD Connector numa sub-rede privada e tentar de novo.', correct: false, consequence: 'O problema não é a sub-rede: o FSx não funciona com AD Connector.' },
        { id: 'd', text: 'Criar o FSx sem diretório e ligar o AD Connector depois.', correct: false, consequence: 'O FSx entra num AD na criação; depois, o domínio não muda.' },
      ],
      explanation: [
        'O FSx for Windows File Server entra num Active Directory **na criação**, e aceita dois tipos: o **AWS Managed Microsoft AD** ou um **AD próprio** (no data center ou em EC2). Como a empresa já alcança o AD do data center pela VPN, ingressar o FSx diretamente nele mantém usuários e grupos sem nada novo para gerenciar.',
        'O FSx **não funciona com AD Connector nem com Simple AD**. E o domínio não muda depois da criação: para trocar, é preciso restaurar um backup num sistema de arquivos novo.',
        '**Regra prática:** FSx for Windows aceita AWS Managed Microsoft AD ou AD próprio; AD Connector e Simple AD ficam de fora.',
      ],
    },
    {
      id: 'rv:fil.f03.m2.a2',
      kind: 'decision',
      title: 'Parado na janela de manutenção',
      prompt:
        'O compartilhamento principal de uma empresa roda num FSx for Windows File Server **Single-AZ**. Toda semana, na **janela de manutenção**, as pastas ficam fora por alguns minutos, e as equipes de plantão reclamam. O requisito é que o compartilhamento **não pare na manutenção nem na falha de uma AZ**. Qual configuração atende?',
      concepts: [{ id: 'fsxw.deployment' }],
      xp: 5,
      difficulty: 2,
      domain: 'd2',
      options: [
        { id: 'a', text: 'Mover a janela de manutenção para a madrugada de domingo.', correct: false, consequence: 'O compartilhamento continua parando, só que num horário diferente.' },
        { id: 'b', text: 'Aumentar a capacidade de vazão do servidor de arquivos.', correct: false, consequence: 'Mais vazão não cria um segundo servidor para assumir na manutenção.' },
        { id: 'c', text: 'Trocar o armazenamento do sistema de arquivos para SSD.', correct: false, consequence: 'O tipo de disco não muda a disponibilidade; continua havendo um servidor só.' },
        { id: 'd', text: 'Usar a implantação Multi-AZ, com servidor em espera.', correct: true, consequence: 'Na manutenção ou na queda da AZ, o servidor em espera assume em segundos.' },
      ],
      explanation: [
        'No **Multi-AZ**, um servidor em espera em outra AZ recebe os dados de forma síncrona e assume em **menos de 30 segundos**, com o mesmo nome DNS. O failover acontece também na **manutenção planejada**, e o serviço volta sozinho para o servidor preferido depois.',
        'No **Single-AZ**, há um servidor só: a manutenção e as falhas param o compartilhamento, e a queda da AZ o derruba. Mudar o horário, a vazão ou o disco não muda isso.',
        '**Regra prática:** compartilhamento Windows de produção que não pode parar na manutenção nem com uma AZ fora é FSx for Windows Multi-AZ.',
      ],
    },
    {
      id: 'rv:fil.f03.m2.a3',
      kind: 'decision',
      title: 'Onde basta um servidor só',
      prompt:
        'Uma empresa tem vários sistemas FSx for Windows File Server **Multi-AZ** e quer **cortar custos** passando para **Single-AZ** os que aceitam ficar fora numa falha (cerca de 30 minutos) e perder o que mudou desde o último backup. Quais sistemas de arquivos podem ir para o Single-AZ? (Escolha DUAS.)',
      concepts: [{ id: 'fsxw.deployment' }],
      xp: 5,
      difficulty: 2,
      domain: 'd4',
      multiple: true,
      options: [
        { id: 'a', text: 'O compartilhamento de testes do time de sistemas.', correct: true, consequence: 'Testes aceitam a parada e a perda desde o último backup.' },
        { id: 'b', text: 'As pastas do jurídico, usadas o dia todo com prazos de processos.', correct: false, consequence: 'Uma parada de 30 minutos ou a queda da AZ atrapalha prazos; pede Multi-AZ.' },
        { id: 'c', text: 'Os arquivos de uma aplicação que já replica os dados em outra AZ.', correct: true, consequence: 'A própria aplicação garante a cópia; o Single-AZ basta.' },
        { id: 'd', text: 'O compartilhamento principal, aberto por todos os funcionários.', correct: false, consequence: 'É o caso típico que a AWS recomenda manter em Multi-AZ.' },
        { id: 'e', text: 'As pastas do plantão, que não podem parar na manutenção semanal.', correct: false, consequence: 'O Single-AZ fica fora na manutenção; só o Multi-AZ faz failover nela.' },
      ],
      explanation: [
        'O **Single-AZ** tem um servidor de arquivos numa AZ: a AWS troca o que falha com cerca de **30 minutos de parada**, e a queda da AZ derruba o compartilhamento. Ele serve a **testes**, a **aplicações que já replicam os dados** e a cargas que aceitam ficar fora e perder o que mudou desde o último backup.',
        'O compartilhamento principal, o jurídico e o plantão não aceitam a parada. A AWS recomenda o **Multi-AZ** para a maioria das cargas de produção.',
        '**Regra prática:** Single-AZ para testes e dados já replicados; produção que não pode parar fica no Multi-AZ.',
      ],
    },
    {
      id: 'rv:fil.f03.m3.a3:projetos',
      kind: 'decision',
      title: 'O compartilhamento lento em HDD',
      prompt:
        'Um FSx for Windows File Server com armazenamento **HDD** guarda as pastas de projetos, com **milhares de arquivos pequenos** abertos o dia todo e **cópias de sombra** ligadas. Os usuários reclamam da lentidão, e a vazão escolhida está folgada. Qual mudança resolve com o **menor esforço**?',
      concepts: [{ id: 'fsxw.storage' }],
      xp: 5,
      difficulty: 3,
      domain: 'd3',
      options: [
        { id: 'a', text: 'Restaurar um backup num sistema de arquivos novo com SSD.', correct: false, consequence: 'Funciona, mas troca o sistema de arquivos sem precisar: o HDD vira SSD no próprio.' },
        { id: 'b', text: 'Ligar a desduplicação de dados no compartilhamento.', correct: false, consequence: 'Economiza espaço e consome memória do servidor; não reduz a latência do disco.' },
        { id: 'c', text: 'Mudar o armazenamento do próprio FSx para SSD.', correct: true, consequence: 'O SSD atende aos arquivos pequenos e às cópias de sombra, sem migração.' },
        { id: 'd', text: 'Dobrar a capacidade de vazão do servidor de arquivos.', correct: false, consequence: 'A vazão já está folgada; o gargalo é a latência do HDD.' },
      ],
      explanation: [
        'O **SSD** serve a cargas **sensíveis à latência**, com muitos arquivos pequenos, e a AWS o recomenda para quem usa **cópias de sombra**. O **HDD** custa menos e serve a diretórios pessoais e compartilhamentos com pouca leitura e gravação. A troca de **HDD para SSD** pode ser feita no próprio sistema de arquivos.',
        'Restaurar um backup num sistema novo é o caminho só no sentido contrário (de SSD para HDD). A desduplicação não acelera leituras, e a vazão não é o gargalo.',
        '**Regra prática:** FSx for Windows lento com muitos arquivos pequenos ou cópias de sombra pede SSD; de HDD para SSD muda no lugar, de SSD para HDD só por backup.',
      ],
    },
    {
      id: 'rv:fil.f03.boss.a2',
      kind: 'decision',
      title: 'O custo mensal do compartilhamento',
      prompt:
        'O compartilhamento de projetos terá **2.000 GB em SSD Multi-AZ**, a **US$ 0,23 por GB-mês**, e capacidade de vazão de **32 MBps Multi-AZ**, a **US$ 4,50 por MBps-mês**. Sem contar os backups, quanto o sistema de arquivos vai **custar por mês**?',
      concepts: [{ id: 'fsxw.storage' }],
      xp: 5,
      difficulty: 1,
      domain: 'd4',
      options: [
        { id: 'a', text: 'Cerca de US$ 460, o preço dos 2.000 GB em SSD.', correct: false, consequence: 'Esquece a capacidade de vazão, que é cobrada à parte.' },
        { id: 'b', text: 'Cerca de US$ 144, o preço dos 32 MBps de vazão.', correct: false, consequence: 'Esquece o armazenamento, que é a maior parte da conta.' },
        { id: 'c', text: 'Cerca de US$ 604, somando armazenamento e vazão.', correct: true, consequence: '2.000 × US$ 0,23 = US$ 460, e 32 × US$ 4,50 = US$ 144.' },
        { id: 'd', text: 'Cerca de US$ 920, contando o SSD em dobro pelo Multi-AZ.', correct: false, consequence: 'O preço Multi-AZ já inclui o servidor em espera; não se conta duas vezes.' },
      ],
      explanation: [
        'No FSx for Windows, o **armazenamento** e a **capacidade de vazão** são escolhidos e cobrados à parte. Armazenamento: 2.000 × US$ 0,23 = **US$ 460**. Vazão: 32 × US$ 4,50 = **US$ 144**. Total: **US$ 604 por mês**, sem os backups.',
        'Contar só uma das partes subestima a conta. E o preço por GB do Multi-AZ já considera a cópia no servidor em espera, então não se multiplica por dois.',
        '**Regra prática:** a conta do FSx for Windows é armazenamento (por GB, SSD ou HDD) mais vazão (por MBps), mais backups; o tipo de implantação muda os preços unitários.',
      ],
    },
    {
      id: 'rv:fil.f03.m3.a1',
      kind: 'decision',
      title: 'As versões antigas que somem',
      prompt:
        'Num FSx for Windows File Server, as **cópias de sombra** estão ligadas com o limite padrão de espaço, e os usuários recuperam versões pelo Explorador de Arquivos. Agora o jurídico precisa que os próprios usuários consigam voltar **até um mês**, mas as versões de **duas semanas atrás já sumiram**. Qual ajuste atende?',
      concepts: [{ id: 'fsxw.shadow-copies' }],
      xp: 5,
      difficulty: 3,
      domain: 'd2',
      options: [
        { id: 'a', text: 'Aumentar a retenção dos backups automáticos para 35 dias.', correct: false, consequence: 'Os backups são restaurados pelo time num sistema novo; o usuário não os usa sozinho.' },
        { id: 'b', text: 'Agendar mais cópias de sombra por dia no compartilhamento.', correct: false, consequence: 'Mais cópias ocupam o mesmo espaço e empurram as antigas para fora mais cedo.' },
        { id: 'c', text: 'Aumentar o espaço máximo reservado às cópias de sombra.', correct: true, consequence: 'Com mais espaço, as versões antigas deixam de ser apagadas para abrir lugar.' },
        { id: 'd', text: 'Trocar o armazenamento do sistema de arquivos para HDD.', correct: false, consequence: 'Não aumenta o espaço das cópias, e a AWS recomenda SSD para elas.' },
      ],
      explanation: [
        'As **cópias de sombra** ocupam espaço do próprio sistema de arquivos, guardando só o que mudou, e têm um **limite padrão de 10%** do armazenamento. Quando o limite é atingido, as cópias **mais antigas são apagadas** para dar lugar às novas. Para guardar versões por mais tempo, aumenta-se o espaço reservado a elas.',
        'Backups não são restaurados pelo usuário no Explorador de Arquivos. Mais agendamentos gastam o espaço mais rápido. E o HDD vai contra a recomendação de usar SSD com cópias de sombra.',
        '**Regra prática:** versões que o próprio usuário recupera são cópias de sombra, limitadas por espaço; elas complementam, mas não substituem, os backups.',
      ],
    },
    {
      id: 'rv:fil.f03.m3.a2',
      kind: 'decision',
      title: 'O armazenamento em 80%',
      prompt:
        'O compartilhamento de uma construtora, num FSx for Windows File Server, chegou a **80% do armazenamento**. A maior parte são **cópias das mesmas plantas** espalhadas pelas pastas das equipes. A empresa quer recuperar espaço com o **menor custo** e sem mudar as pastas que os usuários veem. Qual é a primeira medida?',
      concepts: [{ id: 'fsxw.dedup' }],
      xp: 5,
      difficulty: 1,
      domain: 'd4',
      options: [
        { id: 'a', text: 'Dobrar a capacidade de armazenamento do sistema de arquivos.', correct: false, consequence: 'Paga duas vezes pelas cópias, e a capacidade não pode ser reduzida depois.' },
        { id: 'b', text: 'Ligar as cópias de sombra para guardar as versões das plantas.', correct: false, consequence: 'As cópias de sombra ocupam mais espaço, não menos.' },
        { id: 'c', text: 'Pedir às equipes que apaguem as plantas duplicadas das pastas.', correct: false, consequence: 'Muda as pastas que os usuários usam e depende de cada equipe.' },
        { id: 'd', text: 'Ligar a desduplicação de dados no sistema de arquivos.', correct: true, consequence: 'Os trechos repetidos passam a ser guardados uma vez só, sem mudar as pastas.' },
      ],
      explanation: [
        'A **desduplicação de dados** do Windows guarda uma vez só os trechos repetidos e comprime o resultado, em segundo plano e de forma **transparente** para os usuários. Em compartilhamentos gerais, a economia típica é de **50% a 60%**. Ela consome memória do servidor, então a vazão escolhida precisa dar conta.',
        'Aumentar o armazenamento paga pelas duplicatas, e a capacidade do FSx for Windows só aumenta. As cópias de sombra consomem espaço. Apagar à mão muda o que os usuários veem.',
        '**Regra prática:** compartilhamento Windows cheio de arquivos repetidos pede a desduplicação antes de qualquer aumento de capacidade.',
      ],
    },
  ],
}
