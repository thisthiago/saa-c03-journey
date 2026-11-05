/**
 * Questões da Revisão da Fase 3 de Análise de dados (consultas com Athena),
 * no formato do exame SAA-C03. Fatos conferidos em docs.aws.amazon.com (ver
 * docs/VERIFICACAO-DE-CONTEUDO.md); preços de referência usados na trilha.
 * As empresas são fictícias.
 */
import type { ReviewSet } from '../../../../engine/types'

export const REVIEW_F03: ReviewSet = {
  phaseId: 'ana.f03',
  questions: [
    {
      id: 'rv:ana.f03.m1.a1',
      kind: 'decision',
      title: 'Perguntas novas em horários imprevisíveis',
      prompt:
        'A redação de um jornal faz perguntas novas todo dia, em **horários imprevisíveis**, sobre arquivos de acesso que já estão no S3 e catalogados no Glue. Há dias sem nenhuma consulta. A empresa quer **pagar só quando consulta** e não quer manter servidores. Qual solução atende?',
      concepts: [{ id: 'athena.what' }],
      xp: 5,
      difficulty: 1,
      domain: 'd4',
      options: [
        { id: 'a', text: 'Um cluster do EMR ligado o dia inteiro, com Hive.', correct: false, consequence: 'Paga o cluster parado entre as perguntas e exige cuidar dele.' },
        { id: 'b', text: 'Um cluster do Redshift provisionado com os dados carregados.', correct: false, consequence: 'Paga o cluster por hora, com ou sem consultas, e exige carregar os dados.' },
        { id: 'c', text: 'O Amazon Athena, com as tabelas do Data Catalog.', correct: true, consequence: 'Cada pergunta vira uma consulta SQL sobre o S3, paga pelo dado lido, sem nada ligado no resto do tempo.' },
        { id: 'd', text: 'Uma instância EC2 com um banco de dados, carregada toda noite.', correct: false, consequence: 'Mantém um servidor ligado e um processo de carga para consultas esporádicas.' },
      ],
      explanation: [
        'O **Athena** roda SQL **sem servidor** direto sobre os arquivos do S3, usando as tabelas do Data Catalog. Não há cluster para criar nem desligar, e a cobrança por consulta é pelo dado lido: em dias sem perguntas, não há custo de consulta.',
        'EMR, Redshift provisionado e uma instância EC2 ficam ligados (e cobrando) entre as perguntas, além de exigirem cuidado.',
        '**Regra prática:** "consultas SQL avulsas sobre o S3, sem servidores, pagando por consulta" é Athena.',
      ],
    },
    {
      id: 'rv:ana.f03.m3.a4',
      kind: 'decision',
      title: 'Um painel aberto o dia inteiro',
      prompt:
        'A diretoria quer um painel que dispara **centenas de consultas por hora**, sempre sobre as mesmas tabelas limpas e estruturadas, com **resposta em menos de um segundo** e desempenho previsível. O histórico bruto continua no data lake. Qual solução atende melhor?',
      concepts: [{ id: 'athena.what' }],
      xp: 5,
      difficulty: 2,
      domain: 'd3',
      options: [
        { id: 'a', text: 'O Athena sobre os arquivos do S3, porque não tem servidor.', correct: false, consequence: 'Funciona, mas cada consulta paga o dado lido, e o tempo de resposta não é o de um armazém ajustado.' },
        { id: 'b', text: 'O Redshift, com as tabelas do painel carregadas.', correct: true, consequence: 'O armazém atende consultas frequentes e rápidas, e o histórico segue no data lake.' },
        { id: 'c', text: 'Um job do Glue que recalcula o painel a cada consulta.', correct: false, consequence: 'O job leva minutos para começar e terminar; não responde em menos de um segundo.' },
        { id: 'd', text: 'O Athena com a projeção de partições ligada.', correct: false, consequence: 'Acelera o planejamento em tabelas com muitas partições, mas não transforma o Athena em armazém para painéis.' },
      ],
      explanation: [
        'O Athena brilha em **consultas sob demanda** sobre o S3. Painéis **frequentes**, com muitos usuários, sobre dados estruturados e com **resposta rápida e previsível**, são o caso do **data warehouse**: o Redshift, com as tabelas do painel carregadas. O histórico continua no S3, e o Redshift Spectrum pode juntar as duas coisas.',
        'O Athena para centenas de consultas por hora paga o dado lido a cada vez. Um job do Glue é processamento em lote. E a projeção de partições ajuda outro problema.',
        '**Regra prática:** consulta avulsa sobre o S3, Athena; painel frequente com resposta rápida, Redshift.',
      ],
    },
    {
      id: 'rv:ana.f03.m1.a2',
      kind: 'decision',
      title: 'Quarenta consultas de meio terabyte',
      prompt:
        'Um relatório roda **40 vezes por dia** no Athena em us-east-1, e cada execução lê **0,5 TB**. Na tabela de preços usada pela empresa, a cobrança por consulta é de **US$ 5 por TB lido** em us-east-1 e de US$ 9 em sa-east-1. Quanto o relatório custa **por dia**?',
      concepts: [{ id: 'athena.cost' }],
      xp: 5,
      difficulty: 2,
      domain: 'd4',
      options: [
        { id: 'a', text: 'US$ 2,50', correct: false, consequence: 'É o custo de uma execução (0,5 × 5); o relatório roda 40 vezes.' },
        { id: 'b', text: 'US$ 100', correct: true, consequence: 'Cada execução lê 0,5 TB a US$ 5 por TB, e são 40 execuções no dia.' },
        { id: 'c', text: 'US$ 180', correct: false, consequence: 'Usa o preço de sa-east-1; o relatório roda em us-east-1.' },
        { id: 'd', text: 'US$ 0,00', correct: false, consequence: 'Só os comandos de definição e as consultas que falham não são cobrados; estas leem dados.' },
      ],
      explanation: [
        'Na cobrança por consulta, o Athena cobra **por TB lido**, arredondado ao megabyte, com mínimo de 10 MB por consulta. Cada execução custa 0,5 TB × US$ 5 = US$ 2,50; com 40 execuções, **US$ 100 por dia**.',
        'US$ 2,50 é uma execução. US$ 180 usa o preço de outra Região. E consultas que leem dados são sempre cobradas.',
        '**Regra prática:** custo do Athena = TB lido × preço × execuções. Para baixar, reduza os bytes lidos: formato colunar, compressão, partições e filtro pelas partições.',
      ],
    },
    {
      id: 'rv:ana.f03.m1.a3',
      kind: 'decision',
      title: 'O que entra na conta do Athena',
      prompt:
        'Um analista rodou num dia, na cobrança por consulta do Athena: um SELECT que leu **200 KB**, uma consulta **cancelada** depois de ler 40 GB, uma consulta que **falhou** por erro de sintaxe, um **ALTER TABLE ADD PARTITION** e um **CREATE TABLE**. Quais dessas execuções são **cobradas**? (Escolha DUAS.)',
      concepts: [{ id: 'athena.cost' }],
      xp: 5,
      difficulty: 2,
      domain: 'd4',
      multiple: true,
      options: [
        { id: 'a', text: 'O SELECT que leu 200 KB.', correct: true, consequence: 'É cobrado pelo mínimo de 10 MB por consulta.' },
        { id: 'b', text: 'A consulta cancelada depois de ler 40 GB.', correct: true, consequence: 'Consultas canceladas pagam o que já leram.' },
        { id: 'c', text: 'A consulta que falhou por erro de sintaxe.', correct: false, consequence: 'Consultas que falham, como por erro de sintaxe, não são cobradas.' },
        { id: 'd', text: 'O ALTER TABLE ADD PARTITION.', correct: false, consequence: 'Comandos de definição, como ALTER, não são cobrados.' },
        { id: 'e', text: 'O CREATE TABLE.', correct: false, consequence: 'Comandos de definição, como CREATE e DROP, não são cobrados.' },
      ],
      explanation: [
        'A cobrança por consulta tem regras simples: paga-se o **dado lido**, com **mínimo de 10 MB** por consulta; **consultas canceladas pagam o que já leram**; **comandos de definição** (CREATE, ALTER, DROP) e **consultas que falham** não são cobrados.',
        'Por isso o SELECT minúsculo paga 10 MB, e a consulta cancelada paga os 40 GB. A consulta com erro e os comandos de definição saem de graça.',
        '**Regra prática:** cancelar uma consulta grande não devolve o que ela já leu. Para impedir consultas grandes, use o limite por consulta do workgroup.',
      ],
    },
    {
      id: 'rv:ana.f03.m2.a2',
      kind: 'decision',
      title: 'Quem gastou quanto no Athena',
      prompt:
        'Três equipes e um conjunto de relatórios automáticos usam o Athena na mesma conta. O financeiro quer ver o **gasto de cada equipe** na fatura e ser **avisado** quando os relatórios lerem mais de **5 TB num dia**. Qual solução atende com o **menor esforço**?',
      concepts: [{ id: 'athena.workgroups' }],
      xp: 5,
      difficulty: 2,
      domain: 'd4',
      options: [
        { id: 'a', text: 'Um workgroup só, com limite por consulta de 5 TB.', correct: false, consequence: 'O custo continua misturado, e o limite por consulta não soma o dia.' },
        { id: 'b', text: 'Uma conta da AWS para cada equipe, só para usar o Athena.', correct: false, consequence: 'Separa o custo, mas é muito mais pesado que um workgroup.' },
        { id: 'c', text: 'Um workgroup por equipe e um dos relatórios, com tags e limite diário.', correct: true, consequence: 'Cada workgroup aparece separado na fatura, e o limite diário dos relatórios avisa pelo SNS.' },
        { id: 'd', text: 'Um orçamento do AWS Budgets para todo o Athena da conta, com aviso por e-mail.', correct: false, consequence: 'Avisa sobre o gasto total do mês, sem separar equipes nem olhar o dia dos relatórios.' },
      ],
      explanation: [
        'O **workgroup** separa as consultas por equipe ou por uso, com histórico próprio e **tags de alocação de custo**, que levam o gasto de cada um à fatura. Os **limites do workgroup**, por hora ou por dia, disparam um aviso pelo **SNS** quando o volume lido passa do valor.',
        'Um workgroup só mistura os custos. Contas separadas resolvem com muito mais trabalho. E um orçamento da conta não separa equipes.',
        '**Regra prática:** custo e controle por equipe no Athena começam com um workgroup por equipe, com tags e limites.',
      ],
    },
    {
      id: 'rv:ana.f03.m2.a1',
      kind: 'decision',
      title: 'Oito terabytes num dia de limite',
      prompt:
        'Para que nenhuma consulta dos analistas lesse mais de 1 TB, a equipe configurou no workgroup deles um **limite do workgroup de 1 TB por dia**. Mesmo assim, uma única consulta leu **8 TB** e foi cobrada inteira. A empresa quer que **consultas acima de 1 TB sejam interrompidas**. Qual mudança atende?',
      concepts: [{ id: 'athena.workgroups' }],
      xp: 5,
      difficulty: 3,
      domain: 'd1',
      options: [
        { id: 'a', text: 'Baixar o limite diário do workgroup para 500 GB.', correct: false, consequence: 'O limite do workgroup só dispara um aviso: a consulta continuaria rodando.' },
        { id: 'b', text: 'Configurar no workgroup um limite por consulta de 1 TB.', correct: true, consequence: 'A consulta que passar de 1 TB é cancelada e paga só o que leu até ali.' },
        { id: 'c', text: 'Criar um orçamento mensal do Athena no AWS Budgets.', correct: false, consequence: 'Avisa sobre o gasto do mês, mas não interrompe nenhuma consulta.' },
        { id: 'd', text: 'Criar vários limites diários no workgroup, um para cada analista.', correct: false, consequence: 'Os limites do workgroup avisam pelo SNS; nenhum deles cancela consultas.' },
      ],
      explanation: [
        'O workgroup tem dois tipos de limite. O **limite por consulta**, único por workgroup, **cancela** a consulta que passa do volume definido; ela paga o que já leu. Os **limites do workgroup**, por hora ou por dia, **só avisam** por um tópico do SNS. Para interromper consultas grandes, o certo é o limite por consulta.',
        'Baixar ou multiplicar os limites do workgroup não cancela nada. E um orçamento só avisa.',
        '**Regra prática:** "impedir uma consulta grande" é limite por consulta; "avisar quando o volume do período passar" é limite do workgroup.',
      ],
    },
    {
      id: 'rv:ana.f03.m2.a3',
      kind: 'decision',
      title: 'Cinquenta pessoas e a mesma consulta',
      prompt:
        'Cinquenta jornalistas abrem o mesmo painel, que dispara **a mesma consulta** do Athena sobre os acessos da última hora, no mesmo workgroup. Os dados **mudam a cada 15 minutos**, e a tabela já está em Parquet particionado. A empresa quer **reduzir o dado lido**. Qual mudança atende?',
      concepts: [{ id: 'athena.result-reuse' }],
      xp: 5,
      difficulty: 1,
      domain: 'd4',
      options: [
        { id: 'a', text: 'Reaproveitar resultados, com idade máxima de 15 minutos.', correct: true, consequence: 'A primeira consulta lê os dados; as repetidas, nos 15 minutos seguintes, recebem o resultado guardado.' },
        { id: 'b', text: 'Aumentar o limite por consulta do workgroup dos jornalistas.', correct: false, consequence: 'Só permite consultas maiores; não reduz o dado lido.' },
        { id: 'c', text: 'Converter a tabela outra vez para Parquet, com outra compressão.', correct: false, consequence: 'Ela já está em Parquet particionado; o desperdício é repetir a mesma consulta.' },
        { id: 'd', text: 'Criar um workgroup para cada jornalista.', correct: false, consequence: 'O reaproveitamento funciona dentro do mesmo workgroup; separar só impede que ele aconteça.' },
      ],
      explanation: [
        'Com o **reaproveitamento de resultados**, o Athena devolve o resultado guardado de uma execução anterior da mesma consulta, dentro de uma **idade máxima** escolhida, **sem ler os dados de novo**. Como os dados mudam a cada 15 minutos, essa é a idade máxima segura.',
        'Limite por consulta e conversão de formato não atacam a repetição. E o reaproveitamento acontece dentro do mesmo workgroup: um workgroup por pessoa acabaria com ele.',
        '**Regra prática:** a mesma consulta repetida sobre dados que não mudam no intervalo pede reaproveitamento de resultados, com a idade máxima igual ao intervalo de atualização.',
      ],
    },
    {
      id: 'rv:ana.f03.m3.a1',
      kind: 'decision',
      title: 'Os contratos que ficam no PostgreSQL',
      prompt:
        'O comercial quer, **uma vez por semana**, cruzar os acessos guardados em Parquet no S3 com os **contratos que ficam num RDS for PostgreSQL**. A equipe não quer criar processos de cópia nem uma segunda versão dos contratos. Qual é a forma mais simples?',
      concepts: [{ id: 'athena.federated' }],
      xp: 5,
      difficulty: 2,
      domain: 'd3',
      options: [
        { id: 'a', text: 'Um job diário que copia o banco inteiro para o S3.', correct: false, consequence: 'Cria uma cópia e um processo para uma consulta semanal.' },
        { id: 'b', text: 'Carregar os acessos do S3 dentro do PostgreSQL.', correct: false, consequence: 'O banco transacional não foi feito para guardar e varrer terabytes de registros.' },
        { id: 'c', text: 'Exportar os contratos para planilhas e juntar os dados à mão.', correct: false, consequence: 'Cria uma segunda versão dos contratos e um trabalho manual toda semana.' },
        { id: 'd', text: 'Consulta federada do Athena, com o conector do PostgreSQL.', correct: true, consequence: 'A junção roda numa consulta só, com os contratos lidos onde estão.' },
      ],
      explanation: [
        'A **consulta federada** do Athena usa conectores para ler dados **fora do S3**, como bancos relacionais e o DynamoDB, **onde eles estão**, e juntá-los com as tabelas do data lake numa só consulta SQL. Os conectores podem empurrar filtros para a fonte. A cobrança inclui o dado lido e as execuções do Lambda dos conectores que rodam como função.',
        'Copiar o banco cria processo e cópia para uma necessidade semanal. Carregar terabytes no banco transacional é inadequado. E planilhas criam versões paralelas.',
        '**Regra prática:** "consultar com SQL dados do RDS, do DynamoDB e do S3, sem copiar" é consulta federada do Athena.',
      ],
    },
    {
      id: 'rv:ana.f03.m3.a2',
      kind: 'decision',
      title: 'Planejamento lento e horas a registrar',
      prompt:
        'Uma tabela de acessos tem **mais de 40 mil partições por hora**, cobrindo cinco anos, e o **planejamento das consultas** do Athena ficou lento. Além disso, alguém precisa **registrar cada hora nova** no catálogo. As consultas sempre filtram por data e hora. Qual mudança ajuda nos dois problemas?',
      concepts: [{ id: 'athena.partition-projection' }],
      xp: 5,
      difficulty: 3,
      domain: 'd3',
      options: [
        { id: 'a', text: 'Rodar MSCK REPAIR TABLE a cada hora.', correct: false, consequence: 'Registra as partições novas, mas é lento e não acelera o planejamento das consultas.' },
        { id: 'b', text: 'Juntar todos os dados numa partição só.', correct: false, consequence: 'Acaba com a lista de partições, mas toda consulta passa a ler os cinco anos.' },
        { id: 'c', text: 'Projeção de partições na tabela.', correct: true, consequence: 'O Athena calcula as partições pelas regras da tabela, sem consultar o catálogo, e as horas novas não precisam ser registradas.' },
        { id: 'd', text: 'Rodar um crawler do Glue a cada hora.', correct: false, consequence: 'Registra as horas novas, mas o catálogo continua com dezenas de milhares de partições a consultar.' },
      ],
      explanation: [
        'Com a **projeção de partições**, o Athena **calcula** as partições a partir de regras na tabela (por exemplo, todas as horas desde 2021), **sem buscá-las no Data Catalog**. Isso acelera o planejamento em tabelas com muitas partições e elimina o registro de cada partição nova.',
        'MSCK REPAIR e crawlers só registram partições e mantêm o catálogo enorme. Uma partição só faz cada consulta ler tudo.',
        '**Regra prática:** muitas partições com padrão previsível, como datas, pedem projeção de partições. As consultas devem filtrar todas as chaves projetadas, e tabelas esparsas, com muitas combinações vazias, podem piorar.',
      ],
    },
    {
      id: 'rv:ana.f03.m3.a3',
      kind: 'decision',
      title: 'O relatório de segunda que entra na fila',
      prompt:
        'Toda segunda às 8h, um relatório para anunciantes roda **200 consultas** no Athena. Nesse horário, as consultas interativas dos analistas também estão no auge, e algumas consultas do relatório **ficam na fila** e atrasam. O relatório tem volume previsível e **não pode atrasar**. Qual solução atende?',
      concepts: [{ id: 'athena.capacity' }],
      xp: 5,
      difficulty: 1,
      domain: 'd3',
      options: [
        { id: 'a', text: 'Aumentar o limite por consulta do workgroup do relatório.', correct: false, consequence: 'Limita o volume de cada consulta; não dá capacidade nem prioridade.' },
        { id: 'b', text: 'Uma reserva de capacidade para o workgroup do relatório.', correct: true, consequence: 'As consultas do relatório rodam em DPUs dedicados, sem disputar a cota com os analistas.' },
        { id: 'c', text: 'Mover o relatório para outro workgroup, sem reserva.', correct: false, consequence: 'Continua disputando a mesma cota de consultas da conta.' },
        { id: 'd', text: 'Ligar o reaproveitamento de resultados no workgroup do relatório.', correct: false, consequence: 'Ajuda só quando a mesma consulta se repete com dados iguais; as 200 consultas são diferentes.' },
      ],
      explanation: [
        'A **reserva de capacidade** dá ao Athena **DPUs dedicados**, cobrados por DPU-hora, para um ou mais workgroups. As consultas desses workgroups têm prioridade e **não disputam a cota de consultas da conta**. Com a reserva, o custo deixa de depender do dado lido.',
        'Limites por consulta e workgroups sem reserva não dão capacidade. E o reaproveitamento só serve a consultas repetidas.',
        '**Regra prática:** carga crítica e previsível no Athena, que não pode esperar na fila, pede reserva de capacidade.',
      ],
    },
  ],
}
