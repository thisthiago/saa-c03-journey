/**
 * Fase 7 — Busca e visualização. OpenSearch Service, OpenSearch Serverless e
 * Ingestion, domínio em várias zonas, Quick Sight, SPICE, segurança por linha
 * e a ferramenta certa para cada pergunta.
 */
import type { PhaseDef } from '../../../../../engine/types'
import { META } from '../meta'

export const F07_ANA: PhaseDef = {
  ...META.f07,
  concepts: ['os.what', 'os.serverless-ingestion', 'os.multi-az', 'quick.sight', 'quick.spice', 'quick.rls', 'ana.which-tool', 'athena.cost', 'lake.columnar', 'lake.partitioning'],
  availability: 'available',
  simplifications: ['As atividades tratam do Quick Sight, a parte do Amazon Quick voltada a painéis; os outros recursos do Quick ficam de fora.', 'Marketplace, painéis e volumes são fictícios.'],
  missions: [
    // -----------------------------------------------------------------------
    {
      id: 'ana.f07.m1',
      title: 'Achar a bota',
      type: 'mission',
      summary: 'Busca textual e análise de logs com o OpenSearch, e a ferramenta certa para cada pergunta.',
      briefing: {
        company: 'Marketplace Feira Online',
        role: 'Você cuida da busca e dos dados de um marketplace.',
        situation: 'Quem digita "bota de couro" ou "bota de coro" não acha os produtos, porque a busca é um LIKE no banco. A equipe de operação perde horas procurando erros em arquivos de log. E a diretoria pede um painel de vendas.',
        objective: 'Escolher a ferramenta certa para cada tipo de pergunta.',
        successCriteria: ['Usar o OpenSearch para busca e logs', 'Separar SQL, busca e painel'],
      },
      intel: [
        { conceptId: 'os.what', body: ['O **OpenSearch Service** mantém clusters de OpenSearch, o motor de **busca textual** e **análise de logs**, com painéis no OpenSearch Dashboards.'] },
        { conceptId: 'ana.which-tool', body: ['SQL sobre o data lake: **Athena** ou **Redshift**. Busca por palavras e logs: **OpenSearch**. Painel para pessoas de negócio: **Quick Sight**.'] },
      ],
      activities: [
        {
          id: 'ana.f07.m1.a1',
          kind: 'decision',
          title: 'Bota de coro',
          prompt: 'A busca de produtos precisa achar resultados mesmo com erros de digitação e ordenar pela relevância, em milissegundos. O que usar?',
          concepts: [{ id: 'os.what' }],
          xp: 50,
          difficulty: 1,
          explanation: ['O OpenSearch indexa os textos para busca por relevância, tolerante a erros. O Athena faz SQL sobre arquivos e não foi feito para busca interativa.'],
          options: [
            { id: 'a', text: 'Um domínio do OpenSearch Service com o catálogo de produtos indexado', correct: true, consequence: 'A busca encontra "bota de coro" e ordena pela relevância.' },
            { id: 'b', text: 'Consultas do Athena com LIKE sobre o catálogo no S3', correct: false, consequence: 'Lento para uma busca interativa e sem tolerância a erros.' },
            { id: 'c', text: 'Um painel do Quick Sight', correct: false, consequence: 'O Quick Sight mostra dados; não faz a busca do site.' },
          ],
        },
        {
          id: 'ana.f07.m1.a2',
          kind: 'classify',
          title: 'Cada pergunta, sua ferramenta',
          prompt: 'Classifique cada pergunta pela ferramenta que a responde melhor.',
          concepts: [{ id: 'ana.which-tool' }],
          xp: 50,
          difficulty: 2,
          explanation: ['SQL pontual sobre o data lake vai ao Athena. Busca por palavras e logs recentes vão ao OpenSearch. Painéis para o negócio vão ao Quick Sight.'],
          bins: [
            { id: 'athena', label: 'Athena' },
            { id: 'os', label: 'OpenSearch' },
            { id: 'quick', label: 'Quick Sight' },
          ],
          items: [
            { id: 'q1', text: 'Quanto cada categoria vendeu no último trimestre, uma vez', bin: 'athena', explanation: 'Consulta SQL pontual sobre o data lake.', concepts: ['ana.which-tool'] },
            { id: 'q2', text: 'Quais erros 500 apareceram nos logs nos últimos 15 minutos', bin: 'os', explanation: 'Análise de logs quase em tempo real.', concepts: ['ana.which-tool'] },
            { id: 'q3', text: 'Um painel de vendas por região que a diretoria abre toda manhã', bin: 'quick', explanation: 'Visualização para pessoas de negócio.', concepts: ['ana.which-tool'] },
            { id: 'q4', text: 'Quais produtos têm "tênis infantil" na descrição', bin: 'os', explanation: 'Busca textual.', concepts: ['ana.which-tool'] },
          ],
        },
        {
          id: 'ana.f07.m1.a3',
          kind: 'decision',
          title: 'Horas procurando erros',
          prompt: 'Os logs de 40 servidores ficam em arquivos, e a operação quer buscar erros e ver gráficos dos últimos minutos. O que montar?',
          concepts: [{ id: 'os.what' }],
          xp: 40,
          difficulty: 2,
          explanation: ['Enviar os logs para o OpenSearch, pelo Firehose ou pelo OpenSearch Ingestion, permite buscar e montar painéis no OpenSearch Dashboards em segundos.'],
          options: [
            { id: 'a', text: 'Enviar os logs ao OpenSearch Service e usar o OpenSearch Dashboards', correct: true, consequence: 'A busca por erro leva segundos, com gráficos ao vivo.' },
            { id: 'b', text: 'Copiar os logs para o S3 uma vez por dia e consultar no Athena', correct: false, consequence: 'Os dados chegam com um dia de atraso.' },
          ],
        },
      ],
      debrief: { takeaways: ['Busca textual e logs: OpenSearch.', 'SQL sobre o data lake: Athena ou Redshift.', 'Painéis para o negócio: Quick Sight.'] },
    },
    // -----------------------------------------------------------------------
    {
      id: 'ana.f07.m2',
      title: 'Sem cluster e sem queda',
      type: 'mission',
      summary: 'OpenSearch Serverless, OpenSearch Ingestion e o domínio em várias zonas.',
      briefing: {
        company: 'Marketplace Feira Online',
        role: 'Você prepara o OpenSearch para produção.',
        situation: 'O time não tem experiência em dimensionar clusters de OpenSearch. Os logs hoje passam por um Logstash instalado numa instância que cai toda semana. E a busca do site não pode sair do ar se uma zona falhar.',
        objective: 'Reduzir a operação e garantir a disponibilidade.',
        successCriteria: ['Usar OpenSearch Serverless e Ingestion', 'Escolher o domínio em várias zonas'],
      },
      intel: [
        { conceptId: 'os.serverless-ingestion', body: ['O **OpenSearch Serverless** dispensa dimensionar o cluster. O **OpenSearch Ingestion** coleta, transforma e entrega logs, sem Logstash para manter.'] },
        { conceptId: 'os.multi-az', body: ['Para produção, a AWS recomenda o **Multi-AZ with Standby**: três zonas, nós mestres dedicados e réplicas, com 99,99% de disponibilidade.'] },
      ],
      activities: [
        {
          id: 'ana.f07.m2.a1',
          kind: 'decision',
          title: 'Sem dimensionar',
          prompt: 'O time quer buscar e analisar os logs sem escolher tipos de instância nem número de nós. O que usar?',
          concepts: [{ id: 'os.serverless-ingestion' }],
          xp: 40,
          difficulty: 1,
          explanation: ['O OpenSearch Serverless organiza os índices em coleções e cuida da capacidade.'],
          options: [
            { id: 'a', text: 'Uma coleção do OpenSearch Serverless', correct: true, consequence: 'O time cria a coleção, e a capacidade fica com a AWS.' },
            { id: 'b', text: 'Um domínio com o maior tipo de instância, para nunca faltar', correct: false, consequence: 'Paga capacidade que não usa e continua dimensionando.' },
          ],
        },
        {
          id: 'ana.f07.m2.a2',
          kind: 'decision',
          title: 'O Logstash que cai',
          prompt: 'O Logstash numa instância cai toda semana, e logs se perdem. Como receber, transformar e entregar os logs no OpenSearch sem manter servidores?',
          concepts: [{ id: 'os.serverless-ingestion' }],
          xp: 50,
          difficulty: 2,
          explanation: ['O OpenSearch Ingestion é um coletor sem servidor, baseado no Data Prepper, que recebe, transforma e entrega no domínio ou na coleção.'],
          options: [
            { id: 'a', text: 'Um pipeline do OpenSearch Ingestion', correct: true, consequence: 'A coleta passa a ser gerenciada, sem instância para cair.' },
            { id: 'b', text: 'Duas instâncias com Logstash', correct: false, consequence: 'Reduz a queda, mas continua com servidores para manter.' },
            { id: 'c', text: 'Um crawler do Glue', correct: false, consequence: 'O crawler cataloga arquivos; não entrega logs no OpenSearch.' },
          ],
        },
        {
          id: 'ana.f07.m2.a3',
          kind: 'decision',
          title: 'A busca não pode cair',
          prompt: 'A busca do site precisa continuar se uma zona inteira falhar. Qual configuração a AWS recomenda para domínios de produção?',
          concepts: [{ id: 'os.multi-az' }],
          xp: 50,
          difficulty: 2,
          explanation: ['O Multi-AZ with Standby usa três zonas, três nós mestres dedicados e réplicas suficientes, com 99,99% de disponibilidade.'],
          options: [
            { id: 'a', text: 'Multi-AZ with Standby, em três zonas, com réplicas', correct: true, consequence: 'A perda de uma zona não derruba a busca.' },
            { id: 'b', text: 'Um domínio numa zona, com snapshots diários', correct: false, consequence: 'Recupera dados, mas a busca fica fora do ar até restaurar.' },
            { id: 'c', text: 'Dois domínios em zonas diferentes, sincronizados à mão', correct: false, consequence: 'Mais trabalho e risco que a opção gerenciada.' },
          ],
        },
      ],
      debrief: { takeaways: ['OpenSearch Serverless: sem dimensionar o cluster.', 'OpenSearch Ingestion: coleta de logs sem servidor.', 'Produção: Multi-AZ with Standby.'] },
    },
    // -----------------------------------------------------------------------
    {
      id: 'ana.f07.m3',
      title: 'O painel da diretoria',
      type: 'mission',
      summary: 'Quick Sight, SPICE e segurança por linha.',
      briefing: {
        company: 'Marketplace Feira Online',
        role: 'Você monta os painéis do negócio.',
        situation: 'A diretoria e os gerentes regionais querem um painel de vendas atualizado toda manhã. Os dados estão no data lake, consultados pelo Athena. Cada gerente só pode ver a própria região.',
        objective: 'Montar o painel rápido, barato e com o acesso certo.',
        successCriteria: ['Escolher o Quick Sight', 'Usar o SPICE', 'Restringir as linhas por gerente'],
      },
      intel: [
        { conceptId: 'quick.sight', body: ['O **Quick Sight** monta painéis interativos sobre Athena, Redshift, S3, RDS e outras fontes. O Amazon Quick evoluiu do QuickSight, que continua como o recurso Quick Sight.'] },
        { conceptId: 'quick.spice', body: ['O **SPICE** guarda os dados em memória. O painel responde mais rápido, e uma fonte cobrada por consulta paga só a importação e as atualizações.'] },
        { conceptId: 'quick.rls', body: ['A **segurança por linha** usa uma tabela de regras para mostrar a cada leitor só as linhas permitidas.'] },
      ],
      activities: [
        {
          id: 'ana.f07.m3.a1',
          kind: 'decision',
          title: 'Um painel sem código',
          prompt: 'A diretoria quer gráficos interativos de vendas, com filtros, sem que ninguém escreva código. O que usar?',
          concepts: [{ id: 'quick.sight' }],
          xp: 40,
          difficulty: 1,
          explanation: ['O Quick Sight monta painéis interativos sobre o Athena e outras fontes, sem servidor e sem código.'],
          options: [
            { id: 'a', text: 'Amazon Quick Sight com o Athena como fonte', correct: true, consequence: 'A diretoria abre o painel no navegador e filtra como quiser.' },
            { id: 'b', text: 'Uma planilha exportada do Athena toda manhã', correct: false, consequence: 'Funciona, mas é manual e sem interação.' },
            { id: 'c', text: 'O OpenSearch Dashboards', correct: false, consequence: 'Serve para logs e busca, não para o BI de vendas sobre o data lake.' },
          ],
        },
        {
          id: 'ana.f07.m3.a2',
          kind: 'decision',
          title: 'Duzentos cliques por manhã',
          prompt: 'O painel usa consulta direta ao Athena. Duzentas pessoas o abrem e filtram toda manhã, e cada interação lê dados de novo. Os dados mudam uma vez por dia. O que fazer?',
          concepts: [{ id: 'quick.spice' }],
          xp: 50,
          difficulty: 2,
          explanation: ['Importando para o SPICE, com atualização diária, o Athena é consultado só na atualização. As interações usam o motor em memória.'],
          options: [
            { id: 'a', text: 'Importar os dados para o SPICE, com atualização diária', correct: true, consequence: 'O painel fica rápido, e o Athena é cobrado uma vez por dia.' },
            { id: 'b', text: 'Manter a consulta direta e aumentar o limite do workgroup', correct: false, consequence: 'O custo e a espera continuam a cada clique.' },
          ],
        },
        {
          id: 'ana.f07.m3.a3',
          kind: 'decision',
          title: 'Cada gerente, sua região',
          prompt: 'Os 12 gerentes regionais usam o mesmo painel, e cada um só pode ver a própria região. Como fazer sem criar 12 painéis?',
          concepts: [{ id: 'quick.rls' }],
          xp: 50,
          difficulty: 2,
          explanation: ['A segurança por linha da edição Enterprise usa uma tabela de regras por usuário ou grupo, e o mesmo painel mostra só as linhas permitidas a cada leitor.'],
          options: [
            { id: 'a', text: 'Segurança por linha no conjunto de dados, com uma regra por gerente', correct: true, consequence: 'Um painel só, e cada gerente vê a própria região.' },
            { id: 'b', text: 'Doze cópias do painel, uma por região', correct: false, consequence: 'Funciona, mas multiplica a manutenção.' },
            { id: 'c', text: 'Pedir aos gerentes que usem o filtro de região', correct: false, consequence: 'O filtro é escolha do leitor, não uma restrição.' },
          ],
        },
      ],
      debrief: { takeaways: ['Quick Sight: painéis sobre várias fontes, sem servidor.', 'SPICE: painel rápido e menos consultas à fonte.', 'Segurança por linha: um painel, cada leitor com suas linhas.'] },
    },
    // -----------------------------------------------------------------------
    {
      id: 'ana.f07.boss',
      title: 'O painel está lento',
      type: 'boss',
      summary: 'Um painel que demora minutos e uma fatura do Athena que não para de crescer.',
      briefing: {
        company: 'Marketplace Feira Online',
        role: 'Você investiga o painel de vendas.',
        situation: 'Desde a semana passada, o painel de vendas demora minutos para abrir, e a fatura do Athena triplicou. Ninguém mudou o painel, mas a equipe de dados trocou a fonte dele por uma tabela nova.',
        objective: 'Achar a causa e corrigir.',
        successCriteria: ['Achar as linhas que explicam o problema', 'Escolher as correções certas'],
      },
      intel: [
        { conceptId: 'quick.spice', body: ['Em consulta direta, cada interação vira uma consulta à fonte.'] },
        { conceptId: 'athena.cost', body: ['O Athena cobra o dado lido. Uma tabela sem partição e em CSV lê tudo a cada consulta.'] },
      ],
      activities: [
        {
          id: 'ana.f07.boss.a1',
          kind: 'investigate',
          title: 'Os minutos do painel',
          prompt: 'Leia a configuração do conjunto de dados e o histórico de consultas, marque as linhas que explicam o problema e escolha a causa e as correções.',
          concepts: [{ id: 'quick.spice' }, { id: 'athena.cost' }, { id: 'lake.columnar', weight: 0.5 }],
          xp: 120,
          difficulty: 3,
          explanation: ['O conjunto de dados passou a usar consulta direta sobre uma tabela nova, em CSV e sem partição. Cada filtro dos 200 leitores dispara uma consulta que lê os 800 GB inteiros.'],
          scenario: ['Formato simplificado.'],
          artifacts: [
            {
              id: 'dataset',
              title: 'Conjunto de dados "vendas" no Quick Sight',
              format: 'code',
              lines: [
                { id: 'd1', text: 'Fonte: Athena, tabela vendas_v2', isIssue: false, explanation: 'A fonte é o Athena, como antes.' },
                { id: 'd2', text: 'Modo: consulta direta (antes: SPICE)', isIssue: true, explanation: 'Cada interação passou a ir ao Athena.' },
                { id: 'd3', text: 'Formato da tabela vendas_v2: CSV, sem partição, 800 GB', isIssue: true, explanation: 'Cada consulta lê a tabela inteira.' },
                { id: 'd4', text: 'Leitores: 200; atualização dos dados: 1 vez por dia', isIssue: false, explanation: 'O uso não mudou.' },
              ],
            },
            {
              id: 'history',
              title: 'Histórico do workgroup do painel (amostra)',
              format: 'log',
              lines: [
                { id: 'h1', text: '08:01  SELECT regiao, sum(valor) ... WHERE data >= ...   lido: 800 GB   3 min 40 s', isIssue: true, explanation: 'O filtro por data não reduz nada sem partição.' },
                { id: 'h2', text: '08:01  SELECT regiao, sum(valor) ... WHERE data >= ...   lido: 800 GB   3 min 38 s', isIssue: false, explanation: 'A mesma consulta, repetida por outro leitor.' },
                { id: 'h3', text: '08:02  SHOW PARTITIONS vendas_v2   (falhou: a tabela não tem partições)', isIssue: false, explanation: 'Comando sem custo; só confirma a falta de partição.' },
              ],
            },
          ],
          rootCause: {
            prompt: 'Qual é a causa?',
            options: [
              { id: 'a', text: 'O painel passou a consultar direto uma tabela em CSV sem partição, e cada interação lê os 800 GB', correct: true, feedback: 'Consulta direta, mais tabela sem otimização, a cada clique.' },
              { id: 'b', text: 'O Quick Sight ficou sem capacidade de SPICE', correct: false, feedback: 'O conjunto de dados nem usa mais o SPICE.' },
              { id: 'c', text: 'O workgroup tem um limite por consulta baixo demais', correct: false, feedback: 'As consultas terminam; o problema é o volume lido.' },
            ],
          },
          remediations: {
            prompt: 'Quais correções fazem sentido?',
            options: [
              { id: 'a', text: 'Voltar o conjunto de dados para o SPICE, com atualização diária', correct: true, feedback: 'O Athena passa a ser consultado uma vez por dia.' },
              { id: 'b', text: 'Converter vendas_v2 para Parquet particionado por data', correct: true, feedback: 'Cada atualização lê só as colunas e os dias necessários.' },
              { id: 'c', text: 'Pedir aos leitores que filtrem menos', correct: false, feedback: 'Não resolve a causa.' },
            ],
          },
        },
      ],
      debrief: { takeaways: ['Consulta direta multiplica as consultas à fonte.', 'SPICE para painéis com muitos leitores e dados que mudam pouco.', 'A tabela da fonte também precisa de formato colunar e partição.'] },
    },
  ],
}
