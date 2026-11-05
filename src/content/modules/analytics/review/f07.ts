/**
 * Questões da Revisão da Fase 7 de Análise de dados (busca e visualização),
 * no formato do exame SAA-C03. Fatos conferidos em docs.aws.amazon.com (ver
 * docs/VERIFICACAO-DE-CONTEUDO.md). As empresas são fictícias.
 */
import type { ReviewSet } from '../../../../engine/types'

export const REVIEW_F07: ReviewSet = {
  phaseId: 'ana.f07',
  questions: [
    {
      id: 'rv:ana.f07.m1.a1',
      kind: 'decision',
      title: 'Uma busca de produtos lenta e literal',
      prompt:
        'A busca de uma loja virtual roda hoje como consultas do Athena com LIKE sobre o catálogo no S3: leva vários segundos e **não encontra "bota de coro"** quando o produto é "bota de couro". A loja quer uma busca **em milissegundos**, **tolerante a erros de digitação** e ordenada por **relevância**. Qual solução atende?',
      concepts: [{ id: 'os.what' }],
      xp: 5,
      difficulty: 1,
      domain: 'd3',
      options: [
        { id: 'a', text: 'Converter o catálogo para Parquet e manter o Athena com LIKE.', correct: false, consequence: 'O Athena lê menos, mas continua sem tolerância a erros e sem a velocidade de uma busca interativa.' },
        { id: 'b', text: 'Um domínio do OpenSearch Service com o catálogo indexado.', correct: true, consequence: 'A busca encontra o produto mesmo com o erro e ordena pela relevância, em milissegundos.' },
        { id: 'c', text: 'Um painel do Quick Sight com filtro por nome de produto.', correct: false, consequence: 'O Quick Sight mostra dados em painéis; não faz a busca do site.' },
        { id: 'd', text: 'Carregar o catálogo no Redshift e buscar com SQL.', correct: false, consequence: 'O SQL compara texto de forma literal; não tolera erros nem ordena por relevância.' },
      ],
      explanation: [
        'O **OpenSearch Service** cria e mantém clusters (domínios) de OpenSearch, o motor de **busca textual**: indexa as descrições para buscar por **relevância**, tolerando erros de digitação, em milissegundos. É o caso da busca de produtos de um site.',
        'O Athena e o Redshift fazem SQL, com comparação literal de texto. O Quick Sight é visualização.',
        '**Regra prática:** "busca textual que tolera erros de digitação" é OpenSearch; "SQL sobre arquivos" é Athena.',
      ],
    },
    {
      id: 'rv:ana.f07.m1.a3',
      kind: 'decision',
      title: 'Erros nos logs dos últimos minutos',
      prompt:
        'Os logs de 40 servidores de aplicação são copiados uma vez por dia para o S3 e consultados no Athena. A operação quer **buscar erros e ver gráficos dos últimos minutos**, quase em tempo real, durante os incidentes. Qual solução atende?',
      concepts: [{ id: 'os.what' }],
      xp: 5,
      difficulty: 2,
      domain: 'd3',
      options: [
        { id: 'a', text: 'Copiar os logs para o S3 a cada hora e consultar no Athena.', correct: false, consequence: 'Reduz o atraso para uma hora, ainda longe dos últimos minutos de um incidente.' },
        { id: 'b', text: 'Um painel do Quick Sight lendo os arquivos diários do S3.', correct: false, consequence: 'O painel continua com os dados de ontem.' },
        { id: 'c', text: 'Logs no OpenSearch por um Firehose, com o Dashboards.', correct: true, consequence: 'Os logs chegam em instantes, e a busca e os gráficos mostram os últimos minutos.' },
        { id: 'd', text: 'Gravar os logs num banco do RDS e consultar com SQL.', correct: false, consequence: 'Um banco transacional não é feito para busca textual em grandes volumes de logs.' },
      ],
      explanation: [
        '**Análise de logs quase em tempo real** é um dos usos do OpenSearch. Os logs chegam ao domínio pelo **Data Firehose** (ou pelo OpenSearch Ingestion), são indexados em instantes e aparecem na busca e nos painéis do **OpenSearch Dashboards**.',
        'Cópias por hora ou por dia não mostram os últimos minutos. E um banco relacional não foi feito para buscar texto em volumes de logs.',
        '**Regra prática:** "o que aconteceu nos logs nos últimos minutos" pede OpenSearch, com os logs enviados continuamente.',
      ],
    },
    {
      id: 'rv:ana.f07.m1.a2',
      kind: 'decision',
      title: 'Cada pergunta com a sua ferramenta',
      prompt:
        'Uma empresa reuniu perguntas de várias áreas e a ferramenta que pretende usar para responder a cada uma. Quais associações estão **corretas**? (Escolha DUAS.)',
      concepts: [{ id: 'ana.which-tool' }],
      xp: 5,
      difficulty: 1,
      domain: 'd3',
      multiple: true,
      options: [
        { id: 'a', text: 'Quanto cada categoria vendeu no último trimestre, uma vez: Athena.', correct: true, consequence: 'É uma consulta SQL pontual sobre o data lake.' },
        { id: 'b', text: 'Quais erros 500 apareceram nos logs nos últimos 15 minutos: OpenSearch.', correct: true, consequence: 'É análise de logs quase em tempo real, caso do OpenSearch.' },
        { id: 'c', text: 'Um painel de vendas por região que a diretoria abre toda manhã: OpenSearch.', correct: false, consequence: 'Painel de negócio para a diretoria é visualização de BI: Quick Sight.' },
        { id: 'd', text: 'Quais produtos têm "tênis infantil" na descrição, mesmo escrito errado: Athena.', correct: false, consequence: 'Busca textual tolerante a erros é OpenSearch, não SQL.' },
        { id: 'e', text: 'Quanto cada categoria vendeu no último trimestre, uma vez: Quick Sight.', correct: false, consequence: 'Uma pergunta pontual não pede um painel; uma consulta SQL resolve.' },
      ],
      explanation: [
        'Classifique a pergunta antes de escolher. **SQL** sobre os dados ("quanto vendemos por categoria") é **Athena** ou Redshift. **Busca textual** e **análise de logs** ("quais produtos têm a palavra", "o que houve nos últimos 15 minutos") são **OpenSearch**. **Painel** para pessoas de negócio é **Quick Sight**.',
        'O painel da diretoria não é caso do OpenSearch. A busca tolerante a erros não é SQL. E uma pergunta pontual não pede painel.',
        '**Regra prática:** SQL, Athena ou Redshift; busca e logs, OpenSearch; painel, Quick Sight.',
      ],
    },
    {
      id: 'rv:ana.f07.tres-necessidades',
      kind: 'decision',
      title: 'Busca, relatório e painel numa loja',
      prompt:
        'Uma loja virtual tem três necessidades: a **busca do site**, tolerante a erros; um **relatório SQL trimestral** sobre os pedidos guardados no data lake; e um **painel interativo** para a diretoria. Ela quer **serviços gerenciados** e a ferramenta certa para cada caso. Qual combinação atende?',
      concepts: [{ id: 'ana.which-tool' }],
      xp: 5,
      difficulty: 3,
      domain: 'd3',
      options: [
        { id: 'a', text: 'OpenSearch para tudo: busca, relatório e painel no Dashboards.', correct: false, consequence: 'O OpenSearch não é o lugar do relatório SQL sobre o data lake nem do BI de vendas.' },
        { id: 'b', text: 'Athena para tudo, com LIKE na busca e exportação para o painel.', correct: false, consequence: 'A busca fica lenta e literal, e o painel vira planilha exportada.' },
        { id: 'c', text: 'Redshift para tudo, com SQL na busca e relatórios agendados.', correct: false, consequence: 'SQL não tolera erros de digitação nem ordena por relevância, e falta o painel interativo.' },
        { id: 'd', text: 'OpenSearch, Athena e Quick Sight, um para cada caso.', correct: true, consequence: 'Cada necessidade fica com o serviço feito para ela.' },
      ],
      explanation: [
        'Cada necessidade tem a sua ferramenta. A **busca textual** tolerante a erros é do **OpenSearch**. O **relatório SQL** pontual sobre o data lake é do **Athena**. O **painel interativo** para a diretoria é do **Quick Sight**, que pode até usar o Athena como fonte.',
        'Forçar um serviço só para tudo sacrifica a busca, o relatório ou o painel.',
        '**Regra prática:** em questões com várias necessidades de dados, separe-as e escolha uma ferramenta por pergunta: SQL, busca e logs, ou painel.',
      ],
    },
    {
      id: 'rv:ana.f07.m3.a1',
      kind: 'decision',
      title: 'Painéis dentro do portal do cliente',
      prompt:
        'Uma empresa de logística quer mostrar **painéis interativos** de entregas **dentro do portal web** que os clientes já usam, com dados do Athena e do Redshift, sem que ninguém escreva código de gráficos e sem servidores para manter. Qual solução atende?',
      concepts: [{ id: 'quick.sight' }],
      xp: 5,
      difficulty: 2,
      domain: 'd3',
      options: [
        { id: 'a', text: 'Quick Sight na edição Standard, com os painéis incorporados no portal.', correct: false, consequence: 'A incorporação de painéis em aplicações é recurso da edição Enterprise.' },
        { id: 'b', text: 'Painéis do OpenSearch Dashboards abertos no portal.', correct: false, consequence: 'O Dashboards serve a logs e busca, não ao BI de entregas sobre Athena e Redshift.' },
        { id: 'c', text: 'Quick Sight Enterprise, com os painéis incorporados no portal.', correct: true, consequence: 'Os painéis interativos aparecem dentro do portal, sem código de gráficos e sem servidores.' },
        { id: 'd', text: 'Planilhas geradas pelo Athena toda manhã e publicadas no portal.', correct: false, consequence: 'Sem interação, com trabalho diário e dados de ontem.' },
      ],
      explanation: [
        'O **Quick Sight** monta painéis interativos de BI sobre Athena, Redshift, S3, RDS e outras fontes, **sem servidor para manter**. Os painéis podem ser **incorporados em aplicações**, recurso da **edição Enterprise**.',
        'A edição Standard não incorpora painéis. O OpenSearch Dashboards é para logs e busca. E planilhas não são interativas.',
        '**Regra prática:** "painéis de BI interativos, inclusive incorporados em aplicações" é Quick Sight; a incorporação pede a edição Enterprise.',
      ],
    },
    {
      id: 'rv:ana.f07.bi-sem-servidor',
      kind: 'decision',
      title: 'Os servidores de BI da empresa',
      prompt:
        'Uma empresa mantém uma ferramenta de BI instalada em instâncias EC2, com licenças, atualizações e falhas frequentes. Os painéis leem do Athena, do Redshift e do Salesforce. A empresa quer **parar de manter servidores de BI** e **reduzir o custo** de operação. Qual solução atende?',
      concepts: [{ id: 'quick.sight' }],
      xp: 5,
      difficulty: 1,
      domain: 'd4',
      options: [
        { id: 'a', text: 'Mover a ferramenta para instâncias maiores, com reservas de três anos.', correct: false, consequence: 'Barateia as horas, mas os servidores, as licenças e as atualizações continuam.' },
        { id: 'b', text: 'Amazon Quick Sight, ligado às mesmas fontes.', correct: true, consequence: 'O BI passa a ser gerenciado, sem servidor, e lê o Athena, o Redshift e o Salesforce.' },
        { id: 'c', text: 'OpenSearch Dashboards, alimentado por cópias das fontes.', correct: false, consequence: 'Exige copiar os dados para o OpenSearch e não é o BI de negócio que os painéis usam.' },
        { id: 'd', text: 'Relatórios do Athena exportados como planilhas, por e-mail.', correct: false, consequence: 'Acaba com os servidores, mas também com os painéis interativos.' },
      ],
      explanation: [
        'O **Quick Sight** é BI gerenciado, **sem servidor para manter**, com conectores para Athena, Redshift, S3, RDS, Aurora, OpenSearch, **Salesforce**, Snowflake, planilhas e outras fontes. Trocar a ferramenta instalada por ele elimina servidores, atualizações e falhas de infraestrutura.',
        'Instâncias reservadas mantêm a operação. O OpenSearch Dashboards não é o BI de negócio. E planilhas por e-mail perdem a interação.',
        '**Regra prática:** "painéis de BI sem servidores para manter" é Quick Sight.',
      ],
    },
    {
      id: 'rv:ana.f07.consulta-direta',
      kind: 'decision',
      title: 'Um painel que precisa dos últimos segundos',
      prompt:
        'Um painel operacional do Quick Sight usa **consulta direta** a uma fonte que muda **a cada poucos segundos**, e os operadores precisam ver **sempre o dado mais recente**. Para economizar, alguém propõe importar os dados para o **SPICE**, com atualização a cada hora. Qual avaliação está correta?',
      concepts: [{ id: 'quick.spice' }],
      xp: 5,
      difficulty: 3,
      domain: 'd3',
      options: [
        { id: 'a', text: 'Adotar o SPICE: ele é sempre mais rápido e mais barato que a consulta direta.', correct: false, consequence: 'Rápido e barato, mas com o dado da última atualização: os operadores veriam até uma hora de atraso.' },
        { id: 'b', text: 'Adotar o SPICE: ele lê a fonte a cada interação, então o dado fica atual.', correct: false, consequence: 'É o contrário: o SPICE guarda uma cópia em memória, e quem vai à fonte a cada interação é a consulta direta.' },
        { id: 'c', text: 'Manter a consulta direta: o SPICE mostraria dados de até uma hora atrás.', correct: true, consequence: 'A consulta direta vai à fonte a cada interação e mostra o dado mais recente, que é o requisito.' },
        { id: 'd', text: 'Usar o SPICE, mas só nos fins de semana, quando o tráfego cai.', correct: false, consequence: 'O requisito de dado atual vale o tempo todo, e a mistura não resolve nenhum dos lados.' },
      ],
      explanation: [
        'O **SPICE** é o motor em memória do Quick Sight: os dados **importados** respondem rápido e, com fontes cobradas por consulta, só a importação e as atualizações são pagas. Mas o painel mostra o dado **da última atualização**. A **consulta direta** vai à fonte **a cada interação** e mostra o dado mais recente.',
        'Quando o requisito é ver o que aconteceu há segundos, a consulta direta é a escolha, mesmo custando mais. O SPICE é a resposta quando os dados mudam pouco (por exemplo, uma vez por dia) e muita gente abre o painel.',
        '**Regra prática:** dados que mudam pouco e muitos acessos, SPICE; dado que precisa estar sempre atual, consulta direta.',
      ],
    },
    {
      id: 'rv:ana.f07.m2.a1',
      kind: 'decision',
      title: 'Buscar logs sem escolher instâncias',
      prompt:
        'Um time quer buscar e analisar logs de uma aplicação nova, cujo volume **varia muito e ainda é desconhecido**. Ele **não quer escolher tipos de instância nem número de nós**, nem pagar por capacidade parada. Qual solução atende?',
      concepts: [{ id: 'os.serverless-ingestion' }],
      xp: 5,
      difficulty: 1,
      domain: 'd4',
      options: [
        { id: 'a', text: 'Um domínio do OpenSearch com o maior tipo de instância, para nunca faltar.', correct: false, consequence: 'Paga capacidade que não usa e continua exigindo escolher o tamanho.' },
        { id: 'b', text: 'Uma coleção do OpenSearch Serverless.', correct: true, consequence: 'Os índices ficam numa coleção, e a capacidade é cuidada pela AWS.' },
        { id: 'c', text: 'Um domínio pequeno, aumentado à mão quando a busca ficar lenta.', correct: false, consequence: 'Mantém o dimensionamento com o time, sempre atrasado em relação à carga.' },
        { id: 'd', text: 'Consultas do Athena sobre os logs copiados uma vez por dia.', correct: false, consequence: 'Sai da busca quase em tempo real que o time quer.' },
      ],
      explanation: [
        'O **OpenSearch Serverless** organiza os índices em **coleções** e **dispensa dimensionar e ajustar o cluster**: a capacidade acompanha o uso. Para um volume desconhecido e variável, evita tanto a capacidade parada quanto o trabalho de redimensionar.',
        'Domínios grandes pagam ociosidade; domínios pequenos exigem ajustes manuais. E o Athena com cópia diária não é busca de logs ao vivo.',
        '**Regra prática:** OpenSearch sem escolher instâncias é OpenSearch Serverless.',
      ],
    },
    {
      id: 'rv:ana.f07.m2.a2',
      kind: 'decision',
      title: 'O Logstash que cai toda semana',
      prompt:
        'Os logs chegam ao OpenSearch por um **Logstash numa instância EC2**, que cai toda semana, e **logs se perdem**. A empresa quer **receber, transformar e entregar** os logs no domínio **sem manter servidores** de coleta. Qual solução atende?',
      concepts: [{ id: 'os.serverless-ingestion' }],
      xp: 5,
      difficulty: 2,
      domain: 'd2',
      options: [
        { id: 'a', text: 'Duas instâncias com Logstash, atrás de um balanceador.', correct: false, consequence: 'Reduz as quedas, mas continua com servidores para manter.' },
        { id: 'b', text: 'Um crawler do Glue lendo os logs e gravando no OpenSearch.', correct: false, consequence: 'O crawler cataloga arquivos; não entrega logs no OpenSearch.' },
        { id: 'c', text: 'Um pipeline do OpenSearch Ingestion.', correct: true, consequence: 'A coleta passa a ser gerenciada e sem servidor, sem instância para cair.' },
        { id: 'd', text: 'Uma instância maior para o Logstash, com mais memória.', correct: false, consequence: 'Pode cair menos, mas continua sendo um servidor único para manter.' },
      ],
      explanation: [
        'O **OpenSearch Ingestion** é um **coletor sem servidor**, baseado no Data Prepper, que recebe logs, métricas e rastros, **transforma** e **entrega** no domínio ou na coleção, sem instalar ferramentas como o Logstash.',
        'Mais instâncias, ou instâncias maiores, mantêm os servidores. O crawler não entrega dados no OpenSearch.',
        '**Regra prática:** coleta e transformação de logs para o OpenSearch sem servidores é o OpenSearch Ingestion.',
      ],
    },
    {
      id: 'rv:ana.f07.m2.a3',
      kind: 'decision',
      title: 'As peças do domínio de produção',
      prompt:
        'Uma equipe vai montar o domínio do OpenSearch que atende à busca de produtos em produção, seguindo o modelo **Multi-AZ with Standby** que a AWS recomenda, com **99,99% de disponibilidade**. Quais elementos fazem parte desse modelo? (Escolha DUAS.)',
      concepts: [{ id: 'os.multi-az' }],
      xp: 5,
      difficulty: 3,
      domain: 'd2',
      multiple: true,
      options: [
        { id: 'a', text: 'Três nós mestres dedicados.', correct: true, consequence: 'O modelo usa três mestres dedicados, um em cada zona.' },
        { id: 'b', text: 'Pelo menos duas réplicas de cada índice.', correct: true, consequence: 'Com as réplicas, outra zona tem cópia dos dados quando uma falha.' },
        { id: 'c', text: 'Todos os nós numa zona só, em instâncias maiores.', correct: false, consequence: 'Instâncias maiores não resistem à falha da zona; o modelo usa três zonas.' },
        { id: 'd', text: 'Dois nós mestres, um em cada uma de duas zonas.', correct: false, consequence: 'O modelo pede três mestres dedicados, em três zonas.' },
        { id: 'e', text: 'Índices sem réplica, para economizar armazenamento.', correct: false, consequence: 'Sem réplica, os dados de um nó perdido ficam indisponíveis.' },
      ],
      explanation: [
        'O **Multi-AZ with Standby** é o modelo recomendado para domínios de produção: **três zonas**, **três nós mestres dedicados** e pelo menos **duas réplicas** de cada índice, com **99,99% de disponibilidade**. A falha de uma zona não tira a busca do ar.',
        'Uma zona só, dois mestres ou índices sem réplica deixam pontos únicos de falha.',
        '**Regra prática:** OpenSearch de produção que precisa resistir à perda de uma zona: três zonas, três mestres dedicados e réplicas.',
      ],
    },
    {
      id: 'rv:ana.f07.m3.a3',
      kind: 'decision',
      title: 'Doze gerentes e um painel só',
      prompt:
        'Os 12 gerentes regionais de uma rede usam o mesmo painel do Quick Sight, edição Enterprise, e **cada um só pode ver os dados da própria região**. A empresa quer **um painel só**, sem confiar que cada gerente escolha o filtro certo. Qual solução atende?',
      concepts: [{ id: 'quick.rls' }],
      xp: 5,
      difficulty: 2,
      domain: 'd1',
      options: [
        { id: 'a', text: 'Doze cópias do painel, uma por região.', correct: false, consequence: 'Funciona, mas multiplica a manutenção por doze.' },
        { id: 'b', text: 'Um filtro de região no painel, com instruções para cada gerente.', correct: false, consequence: 'O filtro é escolha do leitor, não uma restrição: qualquer gerente pode trocar de região.' },
        { id: 'c', text: 'Segurança por linha no conjunto de dados.', correct: true, consequence: 'Um painel só, e cada gerente vê apenas as linhas da sua região.' },
        { id: 'd', text: 'Doze conjuntos de dados, um por região, no mesmo painel.', correct: false, consequence: 'Multiplica os dados e ainda deixa os gerentes verem os conjuntos dos outros.' },
      ],
      explanation: [
        'Na edição Enterprise, o conjunto de dados pode ter **segurança por linha**: uma tabela de regras diz, por usuário ou grupo, **quais linhas cada leitor vê**. O mesmo painel mostra a cada gerente só a própria região; os donos do conjunto continuam vendo tudo.',
        'Cópias de painéis ou de conjuntos multiplicam a manutenção. E um filtro do leitor não é restrição.',
        '**Regra prática:** "um painel, e cada usuário vê só as suas linhas" é segurança por linha no Quick Sight.',
      ],
    },
  ],
}
