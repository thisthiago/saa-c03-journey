/**
 * Questões da Revisão da Fase 2 de Análise de dados (catálogo e
 * transformação), no formato do exame SAA-C03. Fatos conferidos em
 * docs.aws.amazon.com (ver docs/VERIFICACAO-DE-CONTEUDO.md); preços de
 * us-east-1 usados na trilha. As empresas são fictícias.
 */
import type { ReviewSet } from '../../../../engine/types'

export const REVIEW_F02: ReviewSet = {
  phaseId: 'ana.f02',
  questions: [
    {
      id: 'rv:ana.f02.m1.a1',
      kind: 'decision',
      title: 'Tabelas que somem com o cluster',
      prompt:
        'Uma empresa roda clusters EMR temporários, criados para cada carga e encerrados no fim. As definições das tabelas ficam no Hive Metastore de cada cluster e **se perdem quando ele é encerrado**. A empresa quer que as tabelas **sobrevivam aos clusters** e sejam as mesmas que o Athena consulta, com o **menor esforço de operação**. Qual solução atende?',
      concepts: [{ id: 'glue.data-catalog' }],
      xp: 5,
      difficulty: 2,
      domain: 'd2',
      options: [
        { id: 'a', text: 'Um Hive Metastore num banco MySQL numa instância EC2 própria.', correct: false, consequence: 'As tabelas sobrevivem, mas a equipe passa a cuidar do servidor, e o Athena não usa esse metastore.' },
        { id: 'b', text: 'Copiar os dados para o Data Catalog antes de encerrar cada cluster.', correct: false, consequence: 'O Data Catalog guarda metadados, não cópias dos dados, que continuam no S3.' },
        { id: 'c', text: 'Manter um cluster EMR sempre ligado, só para guardar o metastore.', correct: false, consequence: 'Paga um cluster permanente para guardar metadados, e o Athena continua sem as tabelas.' },
        { id: 'd', text: 'Usar o AWS Glue Data Catalog como metastore dos clusters.', correct: true, consequence: 'As tabelas ficam num serviço gerenciado, fora dos clusters, e o Athena lê o mesmo catálogo.' },
      ],
      explanation: [
        'O **Glue Data Catalog** guarda os metadados do data lake (bancos, tabelas, colunas, formatos e partições) e **substitui o Apache Hive Metastore**. Com os clusters EMR apontando para ele, as definições das tabelas não dependem mais de nenhum cluster, e o **Athena e o Redshift Spectrum leem o mesmo catálogo**.',
        'Um metastore em servidor próprio dá trabalho e fica fora do Athena. O catálogo não guarda dados. E um cluster ligado só para o metastore paga computação sem uso.',
        '**Regra prática:** "um catálogo central de tabelas para Athena, EMR e Redshift Spectrum" é o Glue Data Catalog. Os dados continuam no S3; o catálogo só diz onde e como eles estão.',
      ],
    },
    {
      id: 'rv:ana.f02.catalogo-da-regiao',
      kind: 'decision',
      title: 'Outra equipe não vê as tabelas',
      prompt:
        'Uma equipe criou e consulta as tabelas do data lake com o Athena em **us-east-1**. Outra equipe, da mesma conta, abriu o Athena em **sa-east-1** e **não encontra nenhuma dessas tabelas**, embora tenha as permissões do IAM necessárias. Qual é a explicação?',
      concepts: [{ id: 'glue.data-catalog' }],
      xp: 5,
      difficulty: 1,
      domain: 'd3',
      options: [
        { id: 'a', text: 'Cada conta tem um catálogo por Região, e as tabelas estão no de us-east-1.', correct: true, consequence: 'Em sa-east-1, o catálogo é outro: as tabelas precisam existir lá para aparecer.' },
        { id: 'b', text: 'Falta permissão do IAM para listar tabelas em sa-east-1.', correct: false, consequence: 'O enunciado diz que as permissões existem; o problema é onde as tabelas estão registradas.' },
        { id: 'c', text: 'O catálogo de us-east-1 guarda os dados, que ainda não foram copiados.', correct: false, consequence: 'O catálogo guarda metadados; os dados ficam no S3.' },
        { id: 'd', text: 'O crawler de us-east-1 falhou e não publicou as tabelas para as outras Regiões.', correct: false, consequence: 'O crawler grava no catálogo da Região dele; não existe publicação para outras Regiões.' },
      ],
      explanation: [
        '**Cada conta tem um Data Catalog por Região.** As tabelas criadas em us-east-1 ficam no catálogo dessa Região; o Athena em sa-east-1 consulta outro catálogo, que não tem essas definições.',
        'As permissões estão corretas. O catálogo não guarda os dados. E o crawler escreve só no catálogo da Região onde roda.',
        '**Regra prática:** o Data Catalog é regional. Planeje em que Região ficam o catálogo e as consultas, perto dos dados no S3.',
      ],
    },
    {
      id: 'rv:ana.f02.m1.a2',
      kind: 'decision',
      title: 'Um crawler a cada minuto',
      prompt:
        'Um job do Glue grava a cada hora uma partição nova de dados em Parquet. Para registrar essas partições no Data Catalog, a equipe agendou um **crawler a cada minuto**, que custa caro, porque cada execução é cobrada por no mínimo 10 minutos de DPU. O esquema dos dados **não muda**. A empresa quer **reduzir esse custo** sem atrasar as partições. Qual mudança atende?',
      concepts: [{ id: 'glue.crawler' }],
      xp: 5,
      difficulty: 3,
      domain: 'd4',
      options: [
        { id: 'a', text: 'Deixar o próprio job registrar as partições que grava.', correct: true, consequence: 'O job já sabe quais partições criou e as registra ao gravar, sem nenhum crawler.' },
        { id: 'b', text: 'Rodar o crawler uma vez por dia, de madrugada.', correct: false, consequence: 'Reduz o custo, mas as partições de cada hora ficam fora do catálogo até a madrugada.' },
        { id: 'c', text: 'Rodar o crawler a cada minuto com menos DPU.', correct: false, consequence: 'Continua pagando o mínimo de cada execução, 1.440 vezes por dia.' },
        { id: 'd', text: 'Cadastrar as partições à mão no console, uma vez a cada hora.', correct: false, consequence: 'Troca custo por trabalho manual e atrasos.' },
      ],
      explanation: [
        'O crawler serve para **descobrir esquemas** e registrar o que ninguém conhece. Aqui o esquema não muda, e o **job já sabe quais partições criou**: um job do Glue pode atualizar o Data Catalog ao gravar, acrescentando as partições novas. Isso elimina o crawler e o atraso.',
        'Um crawler diário deixa as partições da hora fora das consultas. Rodar a cada minuto paga o mínimo de cobrança a cada execução. E o cadastro manual não escala.',
        '**Regra prática:** use o crawler quando o esquema é desconhecido ou muda. Para partições novas de um esquema conhecido, deixe o job registrá-las.',
      ],
    },
    {
      id: 'rv:ana.f02.classificador-proprio',
      kind: 'decision',
      title: 'Logs que o crawler não entende',
      prompt:
        'Um equipamento grava logs num **formato de texto próprio**, que os classificadores prontos do crawler não reconhecem: as tabelas criadas saem com uma coluna só. A empresa quer que o **crawler** continue criando e atualizando as tabelas sozinho, com as colunas certas. Qual solução atende?',
      concepts: [{ id: 'glue.crawler' }],
      xp: 5,
      difficulty: 2,
      domain: 'd3',
      options: [
        { id: 'a', text: 'Dar mais DPU ao crawler, para ele analisar os arquivos com mais cuidado.', correct: false, consequence: 'A capacidade não muda o reconhecimento: os classificadores continuam sem entender o formato.' },
        { id: 'b', text: 'Criar um classificador próprio para o formato e associá-lo ao crawler.', correct: true, consequence: 'Os classificadores próprios rodam primeiro e passam a reconhecer o formato e as colunas.' },
        { id: 'c', text: 'Escrever o CREATE TABLE à mão e desligar o crawler.', correct: false, consequence: 'Funciona, mas perde a atualização automática que a empresa quer manter.' },
        { id: 'd', text: 'Criar dois crawlers na mesma pasta, para um corrigir o outro.', correct: false, consequence: 'Os dois usariam os mesmos classificadores e chegariam ao mesmo resultado.' },
      ],
      explanation: [
        'O crawler descobre o esquema com **classificadores**. Os **próprios** rodam primeiro, na ordem escolhida; se nenhum reconhecer os dados, entram os prontos (JSON, CSV, Parquet e outros). Para um formato de texto próprio, um classificador personalizado ensina ao crawler como separar as colunas.',
        'Mais DPU não ensina formato. A tabela manual perde a atualização automática. E outro crawler igual dá o mesmo resultado.',
        '**Regra prática:** crawler que não entende o formato pede classificador próprio; ele roda antes dos prontos.',
      ],
    },
    {
      id: 'rv:ana.f02.m2.a1',
      kind: 'decision',
      title: 'Converter todo dia e converter uma vez',
      prompt:
        'Uma empresa tem duas necessidades: converter **todo dia** os eventos novos da camada bruta, em CSV, para Parquet particionado; e converter **uma única vez** uma tabela antiga de 2019, já catalogada, para Parquet. A equipe não quer manter servidores e quer a ferramenta mais simples para cada caso. Quais soluções atendem? (Escolha DUAS.)',
      concepts: [{ id: 'glue.format-conversion' }, { id: 'glue.etl-job' }],
      xp: 5,
      difficulty: 2,
      domain: 'd3',
      multiple: true,
      options: [
        { id: 'a', text: 'Um job de ETL do Glue agendado, para a carga diária.', correct: true, consequence: 'Roda sozinho a cada carga, sem servidor, e grava Parquet particionado.' },
        { id: 'b', text: 'Uma consulta CREATE TABLE AS SELECT no Athena, para a tabela de 2019.', correct: true, consequence: 'Grava o resultado em Parquet num passo só, sem nenhuma peça nova.' },
        { id: 'c', text: 'Um crawler do Glue, para converter as duas tabelas.', correct: false, consequence: 'O crawler descobre o esquema e cria tabelas; ele não converte arquivos.' },
        { id: 'd', text: 'Uma instância EC2 com um script de conversão, para os dois casos.', correct: false, consequence: 'Funciona, mas a equipe passa a manter servidor, falhas e escala.' },
        { id: 'e', text: 'O Glue DataBrew com um job manual a cada dia, para a carga diária.', correct: false, consequence: 'Feito para analistas prepararem dados sem código; rodar à mão todo dia não é a ferramenta da carga recorrente.' },
      ],
      explanation: [
        'Converter CSV para Parquet é a transformação mais comum do data lake, e cada caso tem a sua ferramenta. **A cada carga**, um **job do Glue** agendado converte e particiona, sem servidor. **Uma vez só**, uma consulta **CTAS** do Athena grava o resultado em Parquet num passo, sem criar nada novo.',
        'O crawler não converte arquivos. Um servidor próprio contraria o pedido. E o DataBrew atende analistas que não programam, não uma carga recorrente.',
        '**Regra prática:** conversão recorrente, job do Glue; conversão pontual de uma tabela já catalogada, CTAS no Athena.',
      ],
    },
    {
      id: 'rv:ana.f02.m2.a2',
      kind: 'decision',
      title: 'Execuções curtas e a cobrança mínima',
      prompt:
        'Um job Spark do Glue 4.0 com **2 DPU** roda **100 vezes por dia**, e cada execução leva **20 segundos**. O DPU-hora da execução padrão custa **US$ 0,44**. O financeiro quer saber o **custo diário** desse job, considerando a regra de cobrança mínima. Qual valor está correto?',
      concepts: [{ id: 'glue.etl-job' }],
      xp: 5,
      difficulty: 3,
      domain: 'd4',
      options: [
        { id: 'a', text: 'Cerca de US$ 0,49', correct: false, consequence: 'Cobra só os 20 segundos; nas versões 2.0 e mais novas, cada execução paga no mínimo 1 minuto.' },
        { id: 'b', text: 'Cerca de US$ 1,47', correct: true, consequence: 'Cada execução paga 1 minuto: 2 DPU × 1/60 hora × US$ 0,44 × 100 execuções.' },
        { id: 'c', text: 'Cerca de US$ 14,67', correct: false, consequence: 'Usa o mínimo de 10 minutos, que é a regra do crawler, não do job.' },
        { id: 'd', text: 'US$ 88,00', correct: false, consequence: 'Cobra uma hora inteira por execução; o Glue cobra por segundo, com mínimo de 1 minuto.' },
      ],
      explanation: [
        'O job do Glue é cobrado **por DPU-hora, por segundo**, com **mínimo de 1 minuto** por execução nas versões 2.0 e mais novas, sem taxa de início nem de fim. Uma execução de 20 segundos paga 1 minuto: 2 DPU × 1/60 hora × US$ 0,44 ≈ US$ 0,0147. Com 100 execuções, cerca de **US$ 1,47 por dia**.',
        'Cobrar só os 20 segundos ignora o mínimo. O mínimo de 10 minutos é do crawler. E não há cobrança por hora cheia.',
        '**Regra prática:** custo do job = DPU × horas cobradas × preço. Com muitas execuções curtas, o mínimo por execução pesa; juntar o trabalho em menos execuções pode sair mais barato.',
      ],
    },
    {
      id: 'rv:ana.f02.saida-particionada',
      kind: 'decision',
      title: 'Parquet numa pasta só',
      prompt:
        'Um job do Glue converte todo dia os eventos para Parquet, mas grava tudo **numa única pasta**, sem partições. As consultas do Athena filtram sempre **pela data** e continuam lendo a tabela inteira, cada vez maior. Qual mudança no job **reduz os bytes lidos** pelas consultas?',
      concepts: [{ id: 'glue.format-conversion' }],
      xp: 5,
      difficulty: 2,
      domain: 'd3',
      options: [
        { id: 'a', text: 'Rodar um crawler depois de cada execução do job.', correct: false, consequence: 'Atualiza o catálogo, mas sem partições continua havendo uma pasta só para ler.' },
        { id: 'b', text: 'Gravar em CSV com GZIP em vez de Parquet.', correct: false, consequence: 'O CSV lê todas as colunas, e a tabela continua sem partições.' },
        { id: 'c', text: 'Particionar o Parquet pela data do evento.', correct: true, consequence: 'As consultas que filtram por data passam a abrir só as pastas do intervalo pedido.' },
        { id: 'd', text: 'Dar mais DPU ao job, para ele gravar mais rápido.', correct: false, consequence: 'Muda o tempo do job, não o que as consultas leem.' },
      ],
      explanation: [
        'A conversão mais útil grava os dados **em formato colunar e já particionados**. O Parquet reduz as colunas lidas, mas, sem partições, a consulta que filtra por data ainda lê todos os dias. Gravando com a **data como chave de partição**, o Athena abre só as pastas do intervalo pedido.',
        'O crawler não cria partições que os arquivos não têm. CSV lê mais. E DPU muda o job, não a consulta.',
        '**Regra prática:** ao converter para Parquet ou ORC, particione pela coluna que as consultas filtram. Formato colunar e partição somam as economias.',
      ],
    },
    {
      id: 'rv:ana.f02.boss.a2',
      kind: 'decision',
      title: 'O dia de ontem fora do catálogo',
      prompt:
        'Um job do Glue **com bookmark** converte todo dia os eventos novos, e um crawler registra as partições. Ontem o crawler rodou antes de o job terminar, e o dia de ontem, **já gravado no S3**, ficou fora do catálogo. Alguém propõe rodar o job de novo **sem bookmark**, sobre a camada bruta inteira, "por garantia". A empresa quer o dado disponível hoje com o **menor custo**. O que fazer?',
      concepts: [{ id: 'glue.bookmarks' }, { id: 'glue.crawler' }],
      xp: 5,
      difficulty: 3,
      domain: 'd4',
      options: [
        { id: 'a', text: 'Rodar o job sem bookmark sobre a camada bruta inteira.', correct: false, consequence: 'Relê e grava de novo todo o histórico: os eventos ficam duplicados, e o job cobra horas a mais.' },
        { id: 'b', text: 'Rodar de novo só o crawler, sobre a pasta da camada tratada.', correct: true, consequence: 'A partição de ontem entra no catálogo, sem reprocessar nada.' },
        { id: 'c', text: 'Reiniciar o bookmark e rodar o job, para ele recomeçar do zero.', correct: false, consequence: 'Recomeçar do zero também reprocessa e duplica todo o histórico.' },
        { id: 'd', text: 'Esperar a execução de hoje à noite, que registra os dois dias.', correct: false, consequence: 'Custa pouco, mas deixa o dia de ontem fora das consultas até a noite.' },
      ],
      explanation: [
        'Os dados de ontem **já estão no S3**; falta só registrá-los no catálogo. Rodar o **crawler** de novo resolve com o menor custo. O **bookmark** existe justamente para o job processar só o que é novo: desligá-lo, ou reiniciá-lo, faz o job reler o histórico inteiro e **gravar de novo** o que já estava na tabela, duplicando eventos e cobrando DPU-hora por isso.',
        'Rodar sem bookmark, ou com bookmark reiniciado, duplica. Esperar a próxima execução deixa o dado fora das consultas por mais um dia.',
        '**Regra prática:** bookmark evita reprocessar e duplicar. Quando o problema é só o catálogo, corrija o catálogo, não os dados. Para evitar a corrida entre job e crawler, dispare o crawler quando o job terminar.',
      ],
    },
    {
      id: 'rv:glue.triggers-workflows:2',
      kind: 'decision',
      title: 'Um passo que depende de dois',
      prompt:
        'Um fluxo de ETL tem quatro jobs e dois crawlers. O job C só pode começar quando **os jobs A e B terminarem com sucesso**, qualquer que seja a duração de cada um, e a equipe quer **ver o fluxo inteiro e o estado de cada passo** num lugar só. Qual solução atende?',
      concepts: [{ id: 'glue.triggers-workflows' }],
      xp: 5,
      difficulty: 3,
      domain: 'd2',
      options: [
        { id: 'a', text: 'Gatilhos por horário para cada passo, com uma hora de folga entre eles.', correct: false, consequence: 'No dia em que A ou B passar de uma hora, o job C começa antes da hora.' },
        { id: 'b', text: 'Um workflow do Glue, com gatilho condicional que espera A e B.', correct: true, consequence: 'O job C começa só quando os dois terminam bem, e o workflow mostra a ordem e o estado de cada passo.' },
        { id: 'c', text: 'Um gatilho condicional que inicia C quando qualquer um entre A e B terminar.', correct: false, consequence: 'O job C começaria logo depois do primeiro, sem esperar o outro.' },
        { id: 'd', text: 'Juntar A, B e C num único job grande, rodado por horário.', correct: false, consequence: 'Perde a visão por passo e obriga a reprocessar tudo quando uma parte falha.' },
      ],
      explanation: [
        'O **gatilho condicional** inicia jobs e crawlers quando outros terminam num estado escolhido, e a condição pode exigir que **todos** os jobs observados terminem ou que **qualquer um** termine. Aqui, a condição é "todos": A e B. O **workflow** junta gatilhos, jobs e crawlers numa sequência e é o que a documentação recomenda para fluxos com vários passos.',
        'Horários com folga falham quando um passo atrasa. A condição "qualquer um" não espera os dois. E um job único perde a visão e o controle por passo.',
        '**Regra prática:** dependência entre passos do Glue é gatilho condicional, nunca horário com folga. Fluxos com vários passos ficam num workflow.',
      ],
    },
    {
      id: 'rv:ana.f02.m3.a2',
      kind: 'decision',
      title: 'Quais jobs podem esperar',
      prompt:
        'Uma empresa quer reduzir o custo dos jobs Spark do Glue com a **execução Flex**, sem comprometer nenhum prazo. Ela tem estes jobs: um reprocessamento mensal sem prazo, testes de desenvolvimento, a conversão diária que precisa terminar antes das 6h, o job que alimenta um painel a cada hora e o fechamento contábil do dia 1º. Quais dessas cargas devem usar o Flex? (Escolha DUAS.)',
      concepts: [{ id: 'glue.flex' }],
      xp: 5,
      difficulty: 1,
      domain: 'd4',
      multiple: true,
      options: [
        { id: 'a', text: 'O reprocessamento mensal, que pode terminar quando der.', correct: true, consequence: 'Sem prazo, ele aproveita o DPU-hora mais barato do Flex.' },
        { id: 'b', text: 'A conversão diária, que precisa terminar antes das 6h.', correct: false, consequence: 'No Flex, o início e a duração variam: o prazo das 6h pode ser perdido.' },
        { id: 'c', text: 'Os testes de desenvolvimento.', correct: true, consequence: 'Testes não têm prazo de negócio e podem esperar pela capacidade ociosa.' },
        { id: 'd', text: 'O job que alimenta o painel a cada hora.', correct: false, consequence: 'Um atraso deixa o painel desatualizado; esse job precisa da execução padrão.' },
        { id: 'e', text: 'O fechamento contábil do dia 1º.', correct: false, consequence: 'Tem data marcada; um atraso afeta o fechamento.' },
      ],
      explanation: [
        'A **execução Flex** roda o job em capacidade ociosa da AWS, com DPU-hora mais barata (US$ 0,29 contra US$ 0,44 na tabela da trilha), mas **o início e a duração podem variar**. Ela serve para jobs **sem pressa**, como reprocessamentos sem prazo e testes.',
        'Tudo o que tem prazo (a conversão das 6h, o painel de cada hora, o fechamento) fica na execução padrão.',
        '**Regra prática:** Flex para o que pode esperar; execução padrão para o que tem hora marcada.',
      ],
    },
    {
      id: 'rv:ana.f02.m3.a3',
      kind: 'decision',
      title: 'Limpar planilhas sem escrever código',
      prompt:
        'A equipe de qualidade de uma empresa, formada por analistas que **não programam**, precisa padronizar telefones, remover duplicados e corrigir CEPs inválidos nos cadastros antes das análises. A empresa **não quer criar nem manter clusters**. Qual serviço atende?',
      concepts: [{ id: 'glue.databrew' }],
      xp: 5,
      difficulty: 1,
      domain: 'd3',
      options: [
        { id: 'a', text: 'Um job Spark do AWS Glue escrito pela equipe de dados.', correct: false, consequence: 'Funciona, mas exige código, que os analistas não escrevem.' },
        { id: 'b', text: 'O AWS Glue DataBrew.', correct: true, consequence: 'Os analistas montam a limpeza numa interface visual, com transformações prontas e sem servidor.' },
        { id: 'c', text: 'Um crawler do AWS Glue sobre os cadastros.', correct: false, consequence: 'O crawler descobre o esquema; ele não limpa nem corrige dados.' },
        { id: 'd', text: 'Um cluster do Amazon EMR com notebooks.', correct: false, consequence: 'Exige código e um cluster para manter, o oposto do pedido.' },
      ],
      explanation: [
        'O **Glue DataBrew** prepara dados **sem escrever código**, por uma interface visual com mais de 250 transformações prontas: filtrar valores fora do padrão, padronizar formatos, corrigir valores inválidos. É **sem servidor**, então não há cluster para criar ou manter.',
        'Jobs Spark e notebooks no EMR exigem código, e o EMR ainda exige cluster. O crawler não transforma dados.',
        '**Regra prática:** "analistas que não programam precisam limpar e preparar dados" é Glue DataBrew.',
      ],
    },
  ],
}
