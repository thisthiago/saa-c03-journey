/**
 * Questões da Revisão da Fase 3 de Arquitetura e otimização (recuperação de
 * desastres), no formato do exame SAA-C03. Fatos conferidos em
 * docs.aws.amazon.com (ver docs/VERIFICACAO-DE-CONTEUDO.md). As empresas são
 * fictícias.
 */
import type { ReviewSet } from '../../../../engine/types'

export const REVIEW_F03: ReviewSet = {
  phaseId: 'arq.f03',
  questions: [
    {
      id: 'rv:arq.f03.m3.a3',
      kind: 'decision',
      title: 'O ensaio que passou de 24 horas',
      prompt:
        'Os relatórios de uma editora usam **backup e restauração**: os snapshots do banco são copiados todo dia para outra Região. No ensaio de desastre, o time levou **mais de 24 horas** recriando servidores à mão e estourou o RTO. O que precisa estar pronto na Região de recuperação? (Escolha DUAS.)',
      concepts: [{ id: 'dr.backup-restore' }],
      xp: 5,
      difficulty: 2,
      domain: 'd2',
      multiple: true,
      options: [
        { id: 'a', text: 'As AMIs dos servidores, copiadas para a Região de recuperação.', correct: true, consequence: 'Os servidores sobem já configurados, sem instalar tudo de novo.' },
        { id: 'b', text: 'Templates de infraestrutura como código para recriar o ambiente.', correct: true, consequence: 'O ambiente é recriado igual e rápido, sem passos esquecidos.' },
        { id: 'c', text: 'Uma frota reduzida dos servidores já ligada na outra Região.', correct: false, consequence: 'Funciona, mas vira warm standby e custa mais que o necessário.' },
        { id: 'd', text: 'Uma réplica de leitura do banco na Região de recuperação.', correct: false, consequence: 'Reduz o RPO, mas é pilot light; o problema era recriar os servidores.' },
        { id: 'e', text: 'O banco em Multi-AZ na Região principal.', correct: false, consequence: 'Protege de falhas de AZ, não ajuda a recriar nada em outra Região.' },
      ],
      explanation: [
        'No **backup e restauração**, nada roda na Região de recuperação: no desastre, a infraestrutura é **recriada pela infraestrutura como código**, o código é implantado e os dados são restaurados. Além dos dados, entram no backup o **código, a configuração e as AMIs**. Sem templates, recriar à mão pode estourar o RTO.',
        'Frota ligada e réplica de leitura mudam a estratégia para warm standby e pilot light, com custo maior. Multi-AZ trata de outra falha.',
        '**Regra prática:** backup e restauração exige, na outra Região, os dados, as AMIs e os templates; sem eles, o RTO de horas vira dias.',
      ],
    },
    {
      id: 'rv:arq.f03.m3.a2',
      kind: 'decision',
      title: 'As cópias para a outra Região',
      prompt:
        'Os relatórios internos de uma editora vão usar **backup e restauração**. O banco RDS e os volumes EBS precisam de cópias diárias **na outra Região**, com retenção de 30 dias, e o time quer o **menor esforço de operação**. Qual solução atende?',
      concepts: [{ id: 'dr.backup-restore' }],
      xp: 5,
      difficulty: 1,
      domain: 'd2',
      options: [
        { id: 'a', text: 'Scripts que copiam cada snapshot toda noite para a outra Região.', correct: false, consequence: 'Funciona, mas é código para manter, e uma falha passa despercebida.' },
        { id: 'b', text: 'Uma réplica de leitura do RDS na outra Região.', correct: false, consequence: 'É mais cara, não cobre os volumes e copia também os erros.' },
        { id: 'c', text: 'Um plano do AWS Backup com cópia para um cofre na outra Região.', correct: true, consequence: 'Banco e volumes têm cópias regionais, com retenção, num lugar só.' },
        { id: 'd', text: 'Snapshots manuais do RDS e do EBS feitos pelo plantão.', correct: false, consequence: 'Depende de pessoas e fica na mesma Região se ninguém copiar.' },
      ],
      explanation: [
        'O **backup e restauração** é a estratégia mais barata e simples: só os dados vão para a Região de recuperação. Um **plano do AWS Backup** com regra de **cópia para um cofre em outra Região** cobre banco e volumes, com retenção própria, sem scripts.',
        'Scripts e snapshots manuais funcionam, mas exigem manutenção e falham em silêncio. A réplica de leitura é pilot light, com custo de um banco ligado.',
        '**Regra prática:** backup e restauração com menor esforço é AWS Backup com cópia entre Regiões e a infraestrutura em templates.',
      ],
    },
    {
      id: 'rv:arq.f03.m2.a1:i2',
      kind: 'decision',
      title: 'O que fica ligado antes do desastre',
      prompt:
        'Uma clínica vai adotar o **pilot light** para o sistema de agendamento, que usa RDS PostgreSQL e um bucket S3 de anexos. O arquiteto precisa listar o que **fica rodando na Região de recuperação antes de qualquer desastre**. Quais componentes entram na lista? (Escolha DUAS.)',
      concepts: [{ id: 'dr.pilot-light' }],
      xp: 5,
      difficulty: 2,
      domain: 'd2',
      multiple: true,
      options: [
        { id: 'a', text: 'Uma réplica de leitura do RDS, recebendo os dados o tempo todo.', correct: true, consequence: 'O núcleo de dados já está lá, pronto para ser promovido.' },
        { id: 'b', text: 'As instâncias de aplicação em capacidade reduzida, atendendo tráfego.', correct: false, consequence: 'Isso é warm standby; no pilot light, os servidores não estão implantados.' },
        { id: 'c', text: 'O bucket de anexos recebendo a replicação do S3.', correct: true, consequence: 'O armazenamento também replica continuamente no pilot light.' },
        { id: 'd', text: 'Toda a frota de aplicação, na capacidade de produção.', correct: false, consequence: 'É ativo-ativo ou hot standby, muito mais caro.' },
        { id: 'e', text: 'Nada além dos snapshots diários copiados do banco.', correct: false, consequence: 'Isso é backup e restauração, com RPO de horas.' },
      ],
      explanation: [
        'No **pilot light**, o **núcleo de dados** fica ligado na Região de recuperação: bancos e armazenamento **replicando o tempo todo**. Os servidores de aplicação **não estão implantados** e são criados no desastre, com a configuração pronta. O resultado é RPO em minutos e RTO em dezenas de minutos.',
        'Servidores atendendo tráfego, mesmo reduzidos, são warm standby. Frota inteira é hot standby ou ativo-ativo. Só snapshots é backup e restauração.',
        '**Regra prática:** pilot light é dado replicado e aplicação desligada; ele não atende nenhuma requisição antes de alguém ligar e escalar os servidores.',
      ],
    },
    {
      id: 'rv:arq.f03.m2.a1:i5',
      kind: 'decision',
      title: 'Quarenta minutos para subir a aplicação',
      prompt:
        'Uma corretora usa **pilot light** e, no último ensaio, levou **40 minutos** para criar e escalar os servidores na Região de recuperação. A nova meta é **RTO de 10 minutos**, com RPO de segundos, e a empresa quer o **menor custo** que cumpra as metas. Qual estratégia atende?',
      concepts: [{ id: 'dr.warm-standby' }, { id: 'dr.pilot-light' }],
      xp: 5,
      difficulty: 3,
      domain: 'd4',
      options: [
        { id: 'a', text: 'Manter o pilot light e automatizar melhor a criação dos servidores.', correct: false, consequence: 'Ainda depende de criar tudo no desastre; dezenas de minutos não cabem na meta.' },
        { id: 'b', text: 'Ativo-ativo nas duas Regiões, na capacidade total.', correct: false, consequence: 'Cumpre a meta, mas paga duas produções inteiras sem necessidade.' },
        { id: 'c', text: 'Backup e restauração com snapshots de hora em hora.', correct: false, consequence: 'RPO de até uma hora e RTO de horas: muito longe das metas.' },
        { id: 'd', text: 'Warm standby, com uma cópia reduzida que já atende.', correct: true, consequence: 'No desastre ela só escala, e o RTO cai para minutos.' },
      ],
      explanation: [
        'O **warm standby** mantém uma **cópia reduzida, mas funcional**, rodando na Região de recuperação, com os dados replicados: ela **já atende tráfego** e, no desastre, só precisa **escalar**. RPO em segundos e RTO em minutos, mais barato que o ativo-ativo.',
        'O pilot light não atende nada antes de criar e escalar os servidores, e o ensaio mostrou 40 minutos. Backup e restauração fica em horas. Ativo-ativo cumpre a meta com o maior custo.',
        '**Regra prática:** RTO de minutos com a outra Região já atendendo é warm standby; dezenas de minutos aceitam pilot light.',
      ],
    },
    {
      id: 'rv:arq.f03.m2.a1:i3',
      kind: 'decision',
      title: 'Escalar no meio do desastre',
      prompt:
        'Um banco digital usa **warm standby** com um quarto da capacidade na Região de recuperação. A gestão de risco teme que, num desastre regional, **escalar dependa do plano de controle** e demore. O requisito novo é **reduzir o RTO e essa dependência**, mesmo pagando mais. Qual ajuste atende?',
      concepts: [{ id: 'dr.warm-standby' }],
      xp: 5,
      difficulty: 3,
      domain: 'd2',
      options: [
        { id: 'a', text: 'Trocar para pilot light, com os servidores criados no desastre.', correct: false, consequence: 'Aumenta a dependência de criar recursos e o RTO.' },
        { id: 'b', text: 'Manter uma cópia maior, até a capacidade total (hot standby).', correct: true, consequence: 'Quanto maior a cópia ligada, menos é preciso escalar no desastre.' },
        { id: 'c', text: 'Copiar os backups para uma terceira Região.', correct: false, consequence: 'Protege os dados, mas não acelera a Região de recuperação.' },
        { id: 'd', text: 'Reduzir a cópia para um oitavo da capacidade.', correct: false, consequence: 'Economiza, mas aumenta o quanto escalar e o RTO.' },
      ],
      explanation: [
        'No **warm standby**, quanto **maior a cópia mantida**, **menor o RTO** e a dependência do plano de controle para escalar. Com a capacidade inteira, ele vira o **hot standby**: no desastre, só falta mandar o tráfego.',
        'Pilot light e uma cópia menor aumentam o quanto se precisa criar ou escalar. Uma terceira Região de backups não muda a velocidade de recuperação.',
        '**Regra prática:** o tamanho do warm standby é um botão entre custo e RTO; capacidade total é hot standby.',
      ],
    },
    {
      id: 'rv:arq.f03.m3.a4',
      kind: 'decision',
      title: 'Gravar perto de cada usuário',
      prompt:
        'Uma plataforma de videoconsulta vai rodar em **ativo-ativo** em duas Regiões, e **cada Região precisa aceitar gravações** das salas, sem mandá-las para a outra. A replicação entre Regiões deve levar cerca de um segundo. Qual armazenamento de dados atende?',
      concepts: [{ id: 'dr.multi-site' }],
      xp: 5,
      difficulty: 2,
      domain: 'd2',
      options: [
        { id: 'a', text: 'Aurora Global Database, com a Região secundária gravando.', correct: false, consequence: 'No Aurora Global Database, as Regiões secundárias são de leitura.' },
        { id: 'b', text: 'Um RDS Multi-AZ na Região principal, acessado pelas duas.', correct: false, consequence: 'As gravações atravessam Regiões, e a perda da Região leva o banco.' },
        { id: 'c', text: 'Tabelas globais do DynamoDB, com réplicas nas duas Regiões.', correct: true, consequence: 'Cada Região grava localmente, e a replicação leva cerca de um segundo.' },
        { id: 'd', text: 'Backups do banco copiados de hora em hora para a outra Região.', correct: false, consequence: 'Perderia até uma hora de dados e não aceita gravações nas duas.' },
      ],
      explanation: [
        'No **ativo-ativo**, a carga roda e atende nas duas Regiões ao mesmo tempo, com os dados sincronizados. Para **gravar na Região mais próxima** (write local), as **tabelas globais do DynamoDB** têm réplicas que aceitam leitura e escrita, com replicação que costuma levar um segundo ou menos.',
        'O Aurora Global Database grava numa Região só (write global). Um banco único numa Região e backups de hora em hora não servem a gravações nas duas.',
        '**Regra prática:** ativo-ativo com gravação local é tabelas globais do DynamoDB; gravação centralizada com leitura global é Aurora Global Database.',
      ],
    },
    {
      id: 'rv:arq.f03.conflito-entre-regioes',
      kind: 'decision',
      title: 'O carrinho editado em duas Regiões',
      prompt:
        'Uma loja roda em **ativo-ativo** em duas Regiões com tabelas globais do DynamoDB. Às vezes, o mesmo carrinho é alterado **nas duas Regiões quase ao mesmo tempo**, e uma das alterações **some**. A empresa quer evitar esses conflitos sem abrir mão do ativo-ativo. Qual mudança atende?',
      concepts: [{ id: 'dr.multi-site' }],
      xp: 5,
      difficulty: 3,
      domain: 'd2',
      options: [
        { id: 'a', text: 'Acrescentar uma terceira Região às tabelas globais.', correct: false, consequence: 'Mais Regiões gravando aumentam a chance de conflito.' },
        { id: 'b', text: 'Ligar a recuperação a um ponto no tempo das tabelas.', correct: false, consequence: 'Ajuda a voltar no tempo, mas não evita gravações conflitantes.' },
        { id: 'c', text: 'Diminuir o TTL do DNS para trocar de Região mais rápido.', correct: false, consequence: 'O cliente pode alternar de Região ainda mais, piorando os conflitos.' },
        { id: 'd', text: 'Gravar cada cliente sempre na mesma Região.', correct: true, consequence: 'Cada carrinho tem uma Região dona, e as gravações não colidem.' },
      ],
      explanation: [
        'No ativo-ativo, **gravações no mesmo registro em duas Regiões podem conflitar**, e precisam ser evitadas ou tratadas. Uma das estratégias é **gravar por chave**: cada cliente (ou partição) tem uma Região dona, que recebe todas as gravações dele, enquanto as leituras continuam locais.',
        'Mais Regiões e DNS mais volátil aumentam os conflitos. A recuperação a um ponto no tempo é proteção contra erros, não contra conflitos.',
        '**Regra prática:** ativo-ativo exige uma estratégia de gravação: tudo numa Região, na Região mais próxima ou por chave de partição.',
      ],
    },
    {
      id: 'rv:arq.f03.boss.a2',
      kind: 'decision',
      title: 'Um banco ligado que ninguém precisa',
      prompt:
        'O sistema de compras internas de uma indústria usa **pilot light**, com uma réplica do RDS ligada em outra Região. Uma revisão de custos mostrou que o negócio aceita **perder 1 hora** de pedidos e ficar **8 horas** parado. A infraestrutura já está em templates. Qual mudança deixa o sistema com o **menor custo** que cumpre essas metas?',
      concepts: [{ id: 'dr.choose' }, { id: 'dr.backup-restore' }],
      xp: 5,
      difficulty: 2,
      domain: 'd4',
      options: [
        { id: 'a', text: 'Manter o pilot light, com uma classe menor na réplica.', correct: false, consequence: 'Reduz a conta, mas continua pagando um banco ligado sem necessidade.' },
        { id: 'b', text: 'Backups de hora em hora copiados, sem a réplica.', correct: true, consequence: 'RPO de 1 hora e RTO de horas, na estratégia mais barata.' },
        { id: 'c', text: 'Trocar para warm standby, com uma cópia reduzida atendendo.', correct: false, consequence: 'RTO de minutos, muito além da meta e mais caro que o pilot light.' },
        { id: 'd', text: 'Passar para ativo-ativo nas duas Regiões.', correct: false, consequence: 'RPO e RTO perto de zero, pelo maior custo possível.' },
      ],
      explanation: [
        'As quatro estratégias estão em ordem crescente de custo e decrescente de RPO e RTO, e a certa é **a mais barata que cumpre as metas**. Com backups **de hora em hora** copiados para outra Região e a infraestrutura em templates, o **backup e restauração** perde no máximo 1 hora e volta em horas, dentro das 8. A réplica ligada do pilot light deixa de ser necessária.',
        'Uma réplica menor, o warm standby e o ativo-ativo cumprem as metas com folga, mas pagam por recursos ligados que o negócio não pediu.',
        '**Regra prática:** ordene backup e restauração, pilot light, warm standby e ativo-ativo, e escolha a primeira que cumpre o RPO e o RTO.',
      ],
    },
    {
      id: 'rv:arq.f03.m1.a2:i2',
      kind: 'decision',
      title: 'Onde a estratégia barata não basta',
      prompt:
        'Uma rede de clínicas tem hoje **backup e restauração** para todos os sistemas e vai revisar a estratégia de cada um. A diretoria só quer pagar mais onde as metas **não cabem em horas de RPO e RTO**. Quais sistemas precisam de uma estratégia mais rígida? (Escolha DUAS.)',
      concepts: [{ id: 'dr.choose' }],
      xp: 5,
      difficulty: 2,
      domain: 'd4',
      multiple: true,
      options: [
        { id: 'a', text: 'A videoconsulta, que não pode ficar fora mais que alguns minutos.', correct: true, consequence: 'RTO de minutos pede warm standby ou mais.' },
        { id: 'b', text: 'Os relatórios gerenciais, que podem voltar no dia seguinte.', correct: false, consequence: 'RTO de um dia cabe em backup e restauração.' },
        { id: 'c', text: 'O prontuário, em que nenhuma anotação pode se perder.', correct: true, consequence: 'RPO perto de zero exige replicação contínua, não backups periódicos.' },
        { id: 'd', text: 'A wiki interna, reconstruída a partir de um repositório.', correct: false, consequence: 'Pode esperar horas e se recria sozinha: backup e restauração basta.' },
        { id: 'e', text: 'A folha de pagamento, processada uma vez por mês.', correct: false, consequence: 'Aceita horas fora e refazer o processamento.' },
      ],
      explanation: [
        'O **RPO** fala de **dados perdidos**; o **RTO**, de **tempo fora do ar**. Backup e restauração entrega RPO em horas e RTO de até 24 horas. A videoconsulta (RTO de minutos) e o prontuário (RPO perto de zero) não cabem nisso e pedem estratégias com replicação contínua.',
        'Relatórios, wiki e folha mensal aceitam horas e ficam na estratégia mais barata. Pagar mais por eles não traz benefício ao negócio.',
        '**Regra prática:** a estratégia vem das metas aprovadas pelo negócio; cada sistema fica com a mais barata que cumpre o seu RPO e o seu RTO.',
      ],
    },
    {
      id: 'rv:arq.f03.m3.a6',
      kind: 'decision',
      title: 'Um erro copiado em segundos',
      prompt:
        'Uma fintech usa **Aurora Global Database** com uma Região secundária. Uma migração com erro **corrompeu a tabela de contratos**, e a mudança chegou à secundária em menos de um segundo. A empresa precisa da tabela **como estava antes da migração**. Qual recurso atende?',
      concepts: [{ id: 'dr.replication-not-backup' }],
      xp: 5,
      difficulty: 2,
      domain: 'd2',
      options: [
        { id: 'a', text: 'Fazer o failover para a Região secundária do Aurora.', correct: false, consequence: 'A secundária recebeu a mesma corrupção em menos de um segundo.' },
        { id: 'b', text: 'Restaurar o cluster a um momento anterior à migração.', correct: true, consequence: 'Os backups trazem a tabela como estava antes do erro.' },
        { id: 'c', text: 'Acrescentar uma terceira Região ao Aurora Global Database.', correct: false, consequence: 'Ela também receberia a corrupção em segundos.' },
        { id: 'd', text: 'Promover uma réplica de leitura da Região principal.', correct: false, consequence: 'A réplica tem os mesmos dados corrompidos.' },
      ],
      explanation: [
        'A **replicação contínua copia também o erro**: dado corrompido ou apagado chega à outra Região em segundos. Toda estratégia precisa, além da réplica, de **backups com restauração a um momento anterior**. Num desastre de dados, o RPO fica num momento antes do erro, e o RTO nunca é zero.',
        'Failover, terceira Região e promoção de réplica levam a cópias com o mesmo problema.',
        '**Regra prática:** réplica protege contra a perda da infraestrutura; backup com restauração a um ponto no tempo protege contra corrupção e exclusão.',
      ],
    },
  ],
}
