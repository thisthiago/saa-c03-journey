/**
 * Questões da Revisão da Fase 7 de Bancos de dados (Data warehouse com
 * Redshift), no formato do exame SAA-C03. Fatos conferidos em 21/10/2026 e
 * 03/11/2026 (ver docs/VERIFICACAO-DE-CONTEUDO.md). As empresas são fictícias.
 */
import type { ReviewSet } from '../../../../engine/types'

export const REVIEW_F07: ReviewSet = {
  phaseId: 'db.f07',
  questions: [
    {
      id: 'rv:db.f07.boss.a2',
      kind: 'decision',
      title: 'A proposta de um consultor para o supermercado',
      prompt:
        'Os caixas de uma rede de supermercados gravam **uma venda por vez** num Aurora PostgreSQL, que também guarda o estoque. Um consultor propôs trocar o Aurora pelo **Redshift**, "que é muito mais rápido". A empresa quer o banco **adequado ao trabalho dos caixas**. Qual é a recomendação?',
      concepts: [{ id: 'rs.oltp-olap' }],
      xp: 5,
      difficulty: 1,
      domain: 'd3',
      options: [
        { id: 'a', text: 'Trocar para o Redshift Serverless, que se ajusta ao movimento.', correct: false, consequence: 'O Serverless muda a cobrança, não o tipo de trabalho para o qual o Redshift foi feito.' },
        { id: 'b', text: 'Manter os caixas no Aurora e levar os relatórios ao Redshift.', correct: true, consequence: 'Cada banco fica com o trabalho para o qual foi feito: transações num, análise no outro.' },
        { id: 'c', text: 'Trocar para o Redshift com concurrency scaling para os picos.', correct: false, consequence: 'Mais capacidade para consultas simultâneas não torna um data warehouse bom para gravar venda a venda.' },
        { id: 'd', text: 'Trocar para o Redshift com nós RA3, que separam disco e CPU.', correct: false, consequence: 'O tipo de nó não muda o fato de o Redshift ser feito para análise, não para transações.' },
      ],
      explanation: [
        'Os caixas fazem trabalho **transacional (OLTP)**: leem e gravam poucos registros por vez, com todas as colunas, o que pede um banco em linhas, como o **Aurora**. O **Redshift** é um data warehouse em colunas, feito para **análise (OLAP)** sobre muitos dados.',
        'Serverless, concurrency scaling e nós RA3 mudam cobrança e capacidade, não a natureza do Redshift.',
        '**Regra prática:** gravar pedido a pedido é banco transacional; análises sobre grandes volumes históricos vão para o data warehouse.',
      ],
    },
    {
      id: 'rv:db.f07.m1.a3',
      kind: 'decision',
      title: 'Um relatório de horas sobre 4 bilhões de linhas',
      prompt:
        'A tabela de vendas de um varejista tem **100 colunas** e 4 bilhões de linhas, e o relatório mensal usa **5 colunas**. No banco de produção, que guarda os dados em linhas, ele leva horas. O diretor quer entender **por que o mesmo relatório seria muito mais rápido** num data warehouse em colunas. Qual é a explicação?',
      concepts: [{ id: 'rs.oltp-olap' }, { id: 'rs.what' }],
      xp: 5,
      difficulty: 1,
      domain: 'd3',
      options: [
        { id: 'a', text: 'O data warehouse guarda cada venda inteira num único bloco.', correct: false, consequence: 'Isso descreve o armazenamento em linhas, ideal para transações.' },
        { id: 'b', text: 'O data warehouse copia a tabela para a memória antes de consultar.', correct: false, consequence: 'O ganho vem de ler menos dados do disco, não de copiar tudo para a memória.' },
        { id: 'c', text: 'O data warehouse lê só as 5 colunas usadas, cerca de 5% dos dados.', correct: true, consequence: 'Lê muito menos do disco e ainda comprime cada coluna pelo seu tipo.' },
        { id: 'd', text: 'O data warehouse ignora as linhas antigas para responder mais rápido.', correct: false, consequence: 'O relatório lê todas as linhas pedidas; o ganho está nas colunas.' },
      ],
      explanation: [
        'Em colunas, cada bloco guarda valores de **uma só coluna**. Uma consulta que usa 5 de 100 colunas lê **cerca de 5% dos dados**, e cada coluna é comprimida pelo seu tipo. No banco em linhas, o relatório lê as linhas inteiras para usar poucas colunas.',
        'Guardar a venda inteira num bloco é o modelo em linhas. Copiar para a memória e ignorar linhas não descrevem o Redshift.',
        '**Regra prática:** OLTP lê poucos registros com todas as colunas (linhas); OLAP lê poucas colunas de bilhões de linhas (colunas).',
      ],
    },
    {
      id: 'rv:db.f07.m1.a4:cs',
      kind: 'decision',
      title: 'Os painéis de segunda de manhã',
      prompt:
        'Às segundas, entre 8h e 10h, **800 analistas** abrem painéis de BI ao mesmo tempo sobre um cluster Redshift, e as consultas ficam **em fila**. No resto da semana, o cluster sobra. A empresa quer atender o pico de **consultas simultâneas** sem pagar por um cluster maior **a semana inteira**. Qual solução atende?',
      concepts: [{ id: 'rs.what' }],
      xp: 5,
      difficulty: 2,
      domain: 'd3',
      options: [
        { id: 'a', text: 'Dobrar o número de nós do cluster de forma permanente.', correct: false, consequence: 'Resolve o pico, mas paga o dobro de nós a semana inteira.' },
        { id: 'b', text: 'Ligar o concurrency scaling do Redshift para os picos.', correct: true, consequence: 'O Redshift soma capacidade temporária no pico e cobra só enquanto ela roda consultas.' },
        { id: 'c', text: 'Colocar um ElastiCache na frente dos painéis de BI.', correct: false, consequence: 'O cache não executa as consultas analíticas dos painéis no lugar do Redshift.' },
        { id: 'd', text: 'Mover os painéis para o Aurora de produção nas segundas.', correct: false, consequence: 'Leva análise pesada ao banco transacional e deixa a operação lenta.' },
      ],
      explanation: [
        'O **concurrency scaling** soma **capacidade temporária** quando aumentam as consultas simultâneas, e só cobra enquanto essa capacidade roda consultas. É o recurso para picos de muitos usuários, sem um cluster maior o tempo todo.',
        'Mais nós permanentes pagam a capacidade fora do pico. Um cache não roda as consultas. E o Aurora de produção não é lugar para análise.',
        '**Regra prática:** "milhares de usuários e consultas simultâneas" no Redshift apontam para o concurrency scaling.',
      ],
    },
    {
      id: 'rv:db.f07.m1.a4:rms',
      kind: 'decision',
      title: 'Os dados crescem e a CPU sobra',
      prompt:
        'Um data warehouse Redshift precisa receber **dez vezes mais dados históricos** nos próximos meses. As métricas mostram a **CPU dos nós folgada**, e as consultas continuam rápidas; o problema é **o espaço**. A empresa quer **escalar o armazenamento sem pagar por computação** que não vai usar. O que fazer?',
      concepts: [{ id: 'rs.what' }],
      xp: 5,
      difficulty: 3,
      domain: 'd4',
      options: [
        { id: 'a', text: 'Adicionar nós ao cluster até caber todo o histórico.', correct: false, consequence: 'Cada nó novo traz CPU e memória que a carga não precisa.' },
        { id: 'b', text: 'Ligar o concurrency scaling para ganhar espaço temporário.', correct: false, consequence: 'O concurrency scaling soma capacidade para consultas simultâneas, não armazenamento.' },
        { id: 'c', text: 'Apagar o histórico mais antigo para caber nos nós atuais.', correct: false, consequence: 'Perde dados que a empresa decidiu guardar.' },
        { id: 'd', text: 'Usar nós RA3, com armazenamento gerenciado separado da computação.', correct: true, consequence: 'O armazenamento cresce até petabytes usando o S3, sem precisar de mais nós.' },
      ],
      explanation: [
        'Nos nós **RA3**, o **armazenamento gerenciado** cresce até petabytes usando o S3, **separado da computação**. O histórico cabe sem acrescentar nós, e a empresa paga computação só pelo que as consultas precisam.',
        'Mais nós resolvem o espaço, mas pagam CPU e memória ociosas. O concurrency scaling soma capacidade para consultas simultâneas, não espaço. Apagar dados contraria o requisito de guardar o histórico.',
        '**Regra prática:** armazenamento crescendo com CPU sobrando no Redshift aponta para os nós RA3.',
      ],
    },
    {
      id: 'rv:db.f07.m2.a1',
      kind: 'decision',
      title: 'Análises em horários que ninguém prevê',
      prompt:
        'Cientistas de dados de uma seguradora fazem **análises pesadas em horários imprevisíveis**: às vezes três vezes num dia, às vezes nenhuma numa semana. Os dados já estão em tabelas do Redshift, num cluster provisionado ligado o tempo todo. A empresa quer **pagar só quando houver consultas**, **sem dimensionar cluster**. Qual opção atende?',
      concepts: [{ id: 'rs.serverless' }],
      xp: 5,
      difficulty: 2,
      domain: 'd4',
      options: [
        { id: 'a', text: 'Migrar para o Redshift Serverless.', correct: true, consequence: 'A capacidade em RPUs se ajusta às consultas, e não há cobrança com o data warehouse parado.' },
        { id: 'b', text: 'Reservar os nós do cluster atual por um ano.', correct: false, consequence: 'Barateia a hora, mas continua pagando 24 horas por dia por um cluster quase sempre parado.' },
        { id: 'c', text: 'Ligar o concurrency scaling no cluster atual.', correct: false, consequence: 'Ajuda nos picos de consultas simultâneas; o cluster base continua cobrando parado.' },
        { id: 'd', text: 'Trocar os nós do cluster por nós RA3 menores.', correct: false, consequence: 'O cluster fica mais barato, mas continua cobrando por hora sem consultas.' },
      ],
      explanation: [
        'No **Redshift Serverless**, não há cluster para dimensionar: a capacidade é medida em **RPUs** e ajustada sozinha, com cobrança por RPU-hora, por segundo, com mínimo de 60 segundos. **Parado, ele não cobra.** É o caso de análises esporádicas e imprevisíveis.',
        'Reservas, concurrency scaling e nós menores mantêm um cluster cobrando por hora.',
        '**Regra prática:** "análises esporádicas ou imprevisíveis, sem gerenciar cluster" apontam para o Redshift Serverless.',
      ],
    },
    {
      id: 'rv:db.f07.m2.a2',
      kind: 'decision',
      title: 'Um histórico no S3 usado por três equipes',
      prompt:
        'Dez anos de transações estão em arquivos Parquet no S3. As equipes de finanças, marketing e risco têm **cada uma o seu cluster Redshift** e, poucas vezes por mês, querem cruzar esse histórico com as **próprias tabelas**. A empresa não quer **carregar nem copiar** o histórico para nenhum cluster. Qual solução atende?',
      concepts: [{ id: 'rs.spectrum' }],
      xp: 5,
      difficulty: 2,
      domain: 'd3',
      options: [
        { id: 'a', text: 'Carregar o histórico no cluster de finanças e compartilhar com os outros.', correct: false, consequence: 'Carrega dez anos num cluster, o que a empresa quer evitar.' },
        { id: 'b', text: 'Tabelas externas do Redshift Spectrum em cada cluster, sobre os mesmos arquivos.', correct: true, consequence: 'Os três clusters leem os mesmos arquivos no S3 ao mesmo tempo e juntam com as próprias tabelas.' },
        { id: 'c', text: 'Uma cópia dos arquivos em três buckets, um para cada equipe.', correct: false, consequence: 'Triplica o armazenamento, e o cruzamento com as tabelas continua sem solução.' },
        { id: 'd', text: 'Uma integração zero-ETL do S3 para cada cluster.', correct: false, consequence: 'As integrações zero-ETL levam dados do Aurora, do RDS e do DynamoDB ao Redshift, carregando-os.' },
      ],
      explanation: [
        'Com o **Spectrum**, o Redshift consulta arquivos **direto no S3**, sem carregá-los, e junta com as tabelas do cluster na mesma consulta. **Vários clusters podem ler os mesmos arquivos ao mesmo tempo**, sem cópias. A cobrança é por terabyte lido, o que combina com poucas consultas por mês.',
        'Carregar num cluster ou copiar arquivos contraria o requisito. O zero-ETL não é para arquivos no S3.',
        '**Regra prática:** "consultar dados no S3 junto com tabelas do Redshift, sem carregá-los" é o Redshift Spectrum.',
      ],
    },
    {
      id: 'rv:db.f07.m2.a3',
      kind: 'decision',
      title: 'Algumas consultas por mês sobre arquivos de campanha',
      prompt:
        'O marketing de uma editora quer fazer **algumas consultas SQL avulsas por mês** sobre arquivos de campanhas guardados no S3. Os dados não têm relação com o data warehouse da empresa, e a equipe não quer **nada para manter ligado**. A empresa quer a opção **mais simples e barata**. Qual atende?',
      concepts: [{ id: 'rs.vs-athena' }],
      xp: 5,
      difficulty: 1,
      domain: 'd4',
      options: [
        { id: 'a', text: 'Um cluster Redshift provisionado só para o marketing.', correct: false, consequence: 'Um data warehouse ligado o mês inteiro para algumas consultas avulsas.' },
        { id: 'b', text: 'Um banco RDS com os arquivos importados toda semana.', correct: false, consequence: 'Exige carga recorrente e um banco ligado o mês inteiro para pouco uso.' },
        { id: 'c', text: 'Amazon Athena consultando os arquivos direto no S3.', correct: true, consequence: 'Sem servidor e sem carga: o marketing paga só pelas consultas que roda.' },
        { id: 'd', text: 'O cluster Redshift atual da empresa, com os arquivos carregados nele.', correct: false, consequence: 'Ocupa o data warehouse com dados sem relação com ele e exige cargas.' },
      ],
      explanation: [
        'O **Athena** consulta dados **direto no S3** com SQL, **sem servidor**, pagando por consulta. Para consultas avulsas sobre o data lake, sem relação com o data warehouse, não há nada para manter.',
        'Um cluster dedicado ou um banco RDS ficam ligados para pouco uso. Carregar no data warehouse atual mistura dados e exige cargas.',
        '**Regra prática:** consultas avulsas sobre arquivos no S3, pagando por consulta, são Athena; análises pesadas, frequentes e com muitos usuários, Redshift.',
      ],
    },
    {
      id: 'rv:db.f07.m3.a3:az',
      kind: 'decision',
      title: 'Uma AZ fora do ar no meio do expediente',
      prompt:
        'O data warehouse Redshift de um banco atende painéis usados o dia inteiro pela diretoria. A nova exigência é que, se **uma AZ falhar**, os painéis continuem funcionando **pelo mesmo endpoint**, **sem restaurar snapshots**. Qual configuração atende?',
      concepts: [{ id: 'rs.snapshots' }],
      xp: 5,
      difficulty: 2,
      domain: 'd2',
      options: [
        { id: 'a', text: 'Copiar os snapshots automáticos para outra Região.', correct: false, consequence: 'Protege contra a perda da Região, mas exige restaurar o cluster e trocar de endpoint.' },
        { id: 'b', text: 'Aumentar a retenção dos snapshots automáticos para 35 dias.', correct: false, consequence: 'Mais dias de snapshot não mantêm os painéis no ar durante a falha.' },
        { id: 'c', text: 'Adicionar mais nós de computação ao cluster atual.', correct: false, consequence: 'Os nós continuam na mesma AZ e caem juntos com ela.' },
        { id: 'd', text: 'Usar a implantação Multi-AZ do Redshift.', correct: true, consequence: 'A computação fica em duas AZs, atrás de um único endpoint, e os painéis continuam no ar.' },
      ],
      explanation: [
        'A implantação **Multi-AZ** do Redshift mantém **computação em duas AZs** com **um único endpoint**. Numa falha de AZ, os painéis continuam pelo mesmo endereço, sem restauração.',
        'A cópia entre Regiões é para recuperar de uma falha regional, com restauração. Retenção maior e mais nós não protegem contra a queda da AZ.',
        '**Regra prática:** falha de AZ no Redshift é Multi-AZ; perda da Região é cópia automática de snapshots para outra Região.',
      ],
    },
    {
      id: 'rv:db.f07.retencao-de-um-dia',
      kind: 'decision',
      title: 'Uma carga com erro percebida tarde demais',
      prompt:
        'Uma carga com erro estragou a tabela de vendas de um Redshift RA3, e a equipe só percebeu **três dias depois**. Ao tentar restaurar, descobriu que só havia snapshots automáticos **do último dia**, porque a retenção nunca foi mudada. A empresa quer **conseguir voltar até uma semana** daqui em diante. O que fazer?',
      concepts: [{ id: 'rs.snapshots' }],
      xp: 5,
      difficulty: 3,
      domain: 'd2',
      options: [
        { id: 'a', text: 'Ligar a cópia automática de snapshots para outra Região.', correct: false, consequence: 'A cópia protege contra a perda da Região; não resolve a retenção curta dos snapshots automáticos.' },
        { id: 'b', text: 'Ligar a implantação Multi-AZ do data warehouse.', correct: false, consequence: 'O Multi-AZ mantém o serviço numa falha de AZ e copia o erro junto.' },
        { id: 'c', text: 'Aumentar a retenção dos snapshots automáticos para 7 dias ou mais.', correct: true, consequence: 'Nos nós RA3, a retenção vai até 35 dias, e uma carga errada passa a ter para onde voltar.' },
        { id: 'd', text: 'Tirar snapshots automáticos com mais frequência, a cada hora.', correct: false, consequence: 'Mais snapshots no mesmo dia de retenção continuam não alcançando três dias atrás.' },
      ],
      explanation: [
        'O Redshift tira **snapshots automáticos** incrementais a cada cerca de 8 horas ou 5 GB por nó alterados, com **retenção padrão de 1 dia**, que nos nós **RA3 vai até 35 dias**. Aumentar a retenção para pelo menos 7 dias atende o requisito. Snapshots manuais antes de cargas grandes também ajudam, porque ficam até serem apagados.',
        'A cópia entre Regiões e o Multi-AZ protegem contra falhas de infraestrutura. Snapshots mais frequentes não aumentam a janela.',
        '**Regra prática:** confira a retenção dos backups automáticos de cada serviço; o padrão costuma ser curto demais para erros descobertos dias depois.',
      ],
    },
    {
      id: 'rv:db.f07.m3.a2',
      kind: 'decision',
      title: 'Vendas atualizadas para a logística',
      prompt:
        'O time de logística tem o próprio data warehouse Redshift, **em outra conta AWS**, e precisa consultar as vendas do data warehouse principal **sempre atualizadas**. A segurança proíbe **compartilhar credenciais**, e a empresa não quer **manter cópias** dos dados. Qual solução atende?',
      concepts: [{ id: 'rs.integrations' }],
      xp: 5,
      difficulty: 2,
      domain: 'd1',
      options: [
        { id: 'a', text: 'Dar à logística a senha do usuário administrador do data warehouse principal.', correct: false, consequence: 'Compartilha credenciais, o que a segurança proíbe, e dá acesso a muito mais que as vendas.' },
        { id: 'b', text: 'Exportar as vendas para o S3 toda noite e liberar o bucket para a logística.', correct: false, consequence: 'Gera cópias que ficam velhas até a próxima exportação e precisam ser mantidas.' },
        { id: 'c', text: 'Uma integração zero-ETL do data warehouse principal para o da logística.', correct: false, consequence: 'O zero-ETL leva dados do Aurora, do RDS e do DynamoDB ao Redshift; não liga dois data warehouses.' },
        { id: 'd', text: 'Compartilhamento de dados do Redshift com a conta da logística.', correct: true, consequence: 'A logística lê as vendas vivas, sem cópias e sem credenciais do data warehouse principal.' },
      ],
      explanation: [
        'O **compartilhamento de dados** do Redshift dá a outro data warehouse acesso a **dados vivos**, sem copiar nem mover, inclusive **entre contas** e Regiões. A logística consulta as vendas atualizadas, e o acesso é concedido ao data warehouse dela, sem senhas compartilhadas.',
        'A senha do administrador viola a regra de segurança. A exportação noturna cria cópias velhas. O zero-ETL não liga data warehouses.',
        '**Regra prática:** "compartilhar dados entre data warehouses sem copiar" é data sharing; "levar dados do Aurora, do RDS ou do DynamoDB ao Redshift sem pipeline" é zero-ETL.',
      ],
    },
    {
      id: 'rv:db.f07.m3.a1',
      kind: 'decision',
      title: 'Pedidos do DynamoDB nos painéis analíticos',
      prompt:
        'Um aplicativo de delivery grava os pedidos numa tabela do **DynamoDB**. O time de dados quer analisá-los no **Redshift**, com dados **pouco depois de cada mudança**, e hoje usa um script que faz uma exportação diária e uma carga, que falha com frequência. A empresa quer **parar de manter pipeline**. Qual solução atende?',
      concepts: [{ id: 'rs.integrations' }],
      xp: 5,
      difficulty: 3,
      domain: 'd3',
      options: [
        { id: 'a', text: 'Ligar o DynamoDB Streams com uma Lambda que insere cada pedido no Redshift.', correct: false, consequence: 'Chega rápido, mas é um pipeline novo para construir, monitorar e corrigir.' },
        { id: 'b', text: 'Criar uma integração zero-ETL do DynamoDB para o Redshift.', correct: true, consequence: 'Os pedidos chegam ao Redshift pouco depois de cada mudança, sem pipeline para manter.' },
        { id: 'c', text: 'Rodar a exportação para o S3 e a carga a cada hora, em vez de uma vez por dia.', correct: false, consequence: 'Diminui o atraso, mas mantém o pipeline que falha, só que rodando 24 vezes mais.' },
        { id: 'd', text: 'Consultar a tabela do DynamoDB com Scan a partir dos painéis do Redshift.', correct: false, consequence: 'Consome a capacidade da tabela de produção e não leva os dados ao Redshift.' },
      ],
      explanation: [
        'As **integrações zero-ETL** levam dados do **Aurora, do RDS e do DynamoDB** ao Redshift **sem um pipeline** para construir e manter, com os dados disponíveis pouco depois de cada mudança.',
        'Streams com Lambda funciona, mas é um pipeline próprio. Rodar o script mais vezes multiplica as falhas. A Scan pesa na tabela de produção.',
        '**Regra prática:** "levar dados do Aurora, do RDS ou do DynamoDB ao Redshift sem construir pipelines" é zero-ETL.',
      ],
    },
  ],
}
