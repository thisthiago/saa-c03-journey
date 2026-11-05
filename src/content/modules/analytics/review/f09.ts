/**
 * Questões da Revisão da Fase 9 de Análise de dados (escolhendo a solução de
 * dados), no formato do exame SAA-C03. Fatos conferidos em
 * docs.aws.amazon.com (ver docs/VERIFICACAO-DE-CONTEUDO.md). As empresas são
 * fictícias.
 */
import type { ReviewSet } from '../../../../engine/types'

export const REVIEW_F09: ReviewSet = {
  phaseId: 'ana.f09',
  questions: [
    {
      id: 'rv:ana.f09.m2.a1',
      kind: 'decision',
      title: 'Um armazém ligado para duas consultas',
      prompt:
        'A auditoria propôs um cluster do Redshift **ligado o mês inteiro** para consultar os logs guardados no S3 **duas vezes por mês**, com SQL. Os logs já estão catalogados no Glue. A empresa quer o **menor custo** que atenda às consultas. O que sugerir?',
      concepts: [{ id: 'ana.choose' }],
      xp: 5,
      difficulty: 1,
      domain: 'd4',
      options: [
        { id: 'a', text: 'Manter o Redshift proposto, porque responde mais rápido.', correct: false, consequence: 'A velocidade não compensa pagar um cluster parado quase o mês inteiro.' },
        { id: 'b', text: 'Consultar os logs com o Amazon Athena.', correct: true, consequence: 'Paga só o dado lido nas duas consultas, sem nada ligado no resto do mês.' },
        { id: 'c', text: 'Um cluster do EMR de longa duração com Hive.', correct: false, consequence: 'Troca um cluster parado por outro, com mais operação.' },
        { id: 'd', text: 'Carregar os logs num OpenSearch para consultar.', correct: false, consequence: 'Paga um domínio o mês inteiro e copia os logs para fazer SQL eventual.' },
      ],
      explanation: [
        'Consulta SQL **sob demanda** no S3, poucas vezes por mês, é o caso do **Athena**: sem servidor e cobrado pelo dado lido. Um data warehouse ligado o mês inteiro, ou um cluster do EMR, paga horas sem uso; o OpenSearch é para busca e logs ao vivo.',
        'O Redshift brilha em consultas frequentes sobre dados estruturados, não em duas consultas por mês.',
        '**Regra prática:** elimine as opções pelas exigências e, entre as que sobram, escolha a de menos operação e custo: consulta avulsa no S3 é Athena.',
      ],
    },
    {
      id: 'rv:ana.f09.m2.a2',
      kind: 'decision',
      title: 'Um cluster permanente e uma conversão noturna',
      prompt:
        'O time de vendas propôs um cluster do EMR de longa duração para **converter CSV em Parquet toda noite**, sem nenhuma configuração especial do Spark e sem ferramentas do ecossistema Hadoop. A equipe é pequena e quer **o menor esforço de operação e custo**. O que sugerir?',
      concepts: [{ id: 'ana.choose' }],
      xp: 5,
      difficulty: 2,
      domain: 'd4',
      options: [
        { id: 'a', text: 'Manter o EMR de longa duração, que já roda Spark.', correct: false, consequence: 'Paga o cluster parado durante o dia e exige operação.' },
        { id: 'b', text: 'Uma função Lambda que converte todos os arquivos do dia.', correct: false, consequence: 'O volume de uma noite inteira esbarra no tempo máximo e na memória de uma função.' },
        { id: 'c', text: 'Um job do AWS Glue agendado para a madrugada.', correct: true, consequence: 'A mesma conversão em Spark, sem servidor e paga só pelo tempo de execução.' },
        { id: 'd', text: 'Um cluster do Redshift que importa e exporta os arquivos.', correct: false, consequence: 'Um data warehouse não é a ferramenta de conversão de arquivos do data lake.' },
      ],
      explanation: [
        'Converter CSV em Parquet é **ETL sem servidor**, o caso do **Glue**: um job agendado roda o Spark gerenciado e cobra só pelo tempo de execução. O **EMR** compensa quando é preciso **controlar o cluster** ou usar ferramentas que o Glue não oferece, o que não acontece aqui.',
        'Um EMR permanente paga ociosidade. Uma Lambda tem limites de tempo e memória. E o Redshift não é ferramenta de conversão.',
        '**Regra prática:** ETL sem exigências especiais, Glue; controle do cluster ou ecossistema Hadoop, EMR.',
      ],
    },
    {
      id: 'rv:ana.f09.duas-necessidades',
      kind: 'decision',
      title: 'Logs da auditoria e a busca do site',
      prompt:
        'Uma empresa tem duas necessidades de dados: a auditoria consulta com SQL, **algumas vezes por mês**, os logs guardados no S3; e o site precisa de uma **busca de produtos tolerante a erros**, com resposta em milissegundos. Ela quer o serviço de **menos operação** em cada caso. Quais escolhas atendem? (Escolha DUAS.)',
      concepts: [{ id: 'ana.choose' }],
      xp: 5,
      difficulty: 2,
      domain: 'd3',
      multiple: true,
      options: [
        { id: 'a', text: 'Amazon Athena, para os logs da auditoria.', correct: true, consequence: 'SQL sob demanda sobre o S3, pago por consulta e sem servidor.' },
        { id: 'b', text: 'Amazon OpenSearch Service, para a busca do site.', correct: true, consequence: 'Busca textual por relevância, tolerante a erros, em milissegundos.' },
        { id: 'c', text: 'Amazon Redshift, para os logs da auditoria.', correct: false, consequence: 'Um data warehouse para consultas eventuais paga capacidade parada.' },
        { id: 'd', text: 'Amazon Athena, para a busca do site.', correct: false, consequence: 'SQL sobre arquivos é lento para busca interativa e não tolera erros.' },
        { id: 'e', text: 'Amazon EMR, para a busca do site.', correct: false, consequence: 'O EMR processa dados em clusters; não é um motor de busca para o site.' },
      ],
      explanation: [
        'Cada pergunta tem a sua ferramenta. **Consulta SQL eventual sobre o S3** é **Athena**. **Busca textual** tolerante a erros, em milissegundos, é **OpenSearch**.',
        'O Redshift atende SQL frequente, não eventual. O Athena não faz busca interativa. E o EMR processa dados, não serve buscas.',
        '**Regra prática:** SQL sob demanda, Athena; SQL frequente, Redshift; ETL, Glue; cluster configurável, EMR; busca e logs, OpenSearch; painéis, Quick Sight.',
      ],
    },
    {
      id: 'rv:ana.streaming-architecture:1',
      kind: 'decision',
      title: 'O antifraude já lê, falta o histórico',
      prompt:
        'Transações chegam a um Kinesis Data Streams, lido em tempo real por uma função Lambda de antifraude. Agora a empresa quer **guardar todo o histórico em Parquet no S3**, em poucos minutos, e **consultá-lo com SQL** de vez em quando, com **o mínimo de código**. Quais peças completam o desenho? (Escolha DUAS.)',
      concepts: [{ id: 'ana.streaming-architecture' }],
      xp: 5,
      difficulty: 3,
      domain: 'd3',
      multiple: true,
      options: [
        { id: 'a', text: 'Um Data Firehose que usa o fluxo como origem e grava Parquet no S3.', correct: true, consequence: 'O mesmo fluxo alimenta o histórico, convertido e entregue em lotes de minutos, sem código.' },
        { id: 'b', text: 'O Amazon Athena consultando o histórico no S3.', correct: true, consequence: 'SQL sob demanda sobre os arquivos em Parquet, pago por consulta.' },
        { id: 'c', text: 'Um segundo Kinesis Data Streams, só para o histórico.', correct: false, consequence: 'Os produtores teriam de gravar duas vezes, e ainda faltaria entregar no S3.' },
        { id: 'd', text: 'A Lambda do antifraude gravando cada transação como um arquivo JSON no S3.', correct: false, consequence: 'Cria milhões de arquivos pequenos em JSON, e a função passa a ter outra tarefa.' },
        { id: 'e', text: 'Um cluster do Redshift ligado o mês inteiro para as consultas eventuais.', correct: false, consequence: 'Paga um cluster parado para consultas de vez em quando.' },
      ],
      explanation: [
        'O desenho de referência combina as peças: produtores escrevem no **Kinesis Data Streams**; consumidores em tempo real, como a **Lambda** do antifraude, leem o fluxo; o **Firehose**, usando o **mesmo fluxo como origem**, entrega lotes em **Parquet no S3**; o **Athena** (ou o Quick Sight) consulta o histórico.',
        'Um segundo fluxo duplica a escrita. Arquivos JSON por transação criam o problema dos arquivos pequenos. E um Redshift permanente é caro para consultas eventuais.',
        '**Regra prática:** "processar em tempo real e guardar o histórico para análise" é Kinesis Data Streams, consumidores Lambda, Firehose para o S3 e Athena.',
      ],
    },
    {
      id: 'rv:ana.streaming-architecture:2',
      kind: 'decision',
      title: 'Produtores que gravam duas vezes',
      prompt:
        'Os aplicativos de uma empresa enviam cada evento **duas vezes**: uma para um Kinesis Data Streams, lido em tempo real por dois consumidores, e outra para um Data Firehose, que entrega no S3. A empresa quer **que os produtores gravem uma vez só**, sem perder nenhum dos dois destinos e sem escrever código. Qual mudança atende?',
      concepts: [{ id: 'ana.streaming-architecture' }],
      xp: 5,
      difficulty: 2,
      domain: 'd3',
      options: [
        { id: 'a', text: 'Configurar o Firehose para usar o fluxo do Kinesis como origem.', correct: true, consequence: 'Os produtores gravam só no fluxo, que continua servindo os consumidores e passa a alimentar o Firehose.' },
        { id: 'b', text: 'Deixar só o Firehose e ligar os consumidores em tempo real a ele.', correct: false, consequence: 'O Firehose entrega em lotes e não guarda registros para leitores em tempo real.' },
        { id: 'c', text: 'Escrever um consumidor do fluxo que regrava os eventos no Firehose.', correct: false, consequence: 'Funciona, mas é o código que se quer evitar, e não é necessário.' },
        { id: 'd', text: 'Trocar os dois serviços por um cluster do Amazon MSK.', correct: false, consequence: 'Troca as peças sem necessidade e ainda exige levar os dados ao S3.' },
      ],
      explanation: [
        'O **Firehose** pode usar um fluxo do **Kinesis Data Streams como origem**, além de receber gravações diretas. Com isso, os produtores gravam uma vez, no fluxo; os consumidores em tempo real continuam lendo, e o Firehose entrega no S3 o que passa pelo fluxo.',
        'O Firehose sozinho não serve leitores em tempo real. Um consumidor próprio que regrava é código desnecessário. E o MSK muda tudo sem ganho.',
        '**Regra prática:** fluxo com leitores em tempo real e entrega no S3 é Kinesis Data Streams com um Firehose que o usa como origem.',
      ],
    },
    {
      id: 'rv:ana.f09.m1.a2',
      kind: 'decision',
      title: 'Tabelas cadastradas à mão e colunas expostas',
      prompt:
        'Uma empresa já guarda as camadas do data lake no S3 e consulta com o Athena, mas as tabelas são cadastradas **à mão** e qualquer analista **vê todas as colunas**, inclusive as sensíveis. Ela quer **descobrir os esquemas automaticamente** e **controlar o acesso por coluna**, com serviços gerenciados. Quais peças atendem? (Escolha DUAS.)',
      concepts: [{ id: 'ana.lake-reference' }],
      xp: 5,
      difficulty: 2,
      domain: 'd1',
      multiple: true,
      options: [
        { id: 'a', text: 'Crawlers do Glue, registrando as tabelas no Data Catalog.', correct: true, consequence: 'Os esquemas são descobertos e as tabelas criadas e atualizadas sem trabalho manual.' },
        { id: 'b', text: 'O Lake Formation, concedendo as tabelas por coluna.', correct: true, consequence: 'Cada analista vê só as colunas concedidas, no Athena e nos outros serviços integrados.' },
        { id: 'c', text: 'Políticas de bucket por prefixo, uma por analista.', correct: false, consequence: 'Enxergam objetos e prefixos, não colunas, e não catalogam nada.' },
        { id: 'd', text: 'Um cluster do Redshift com cópia das tabelas sem as colunas sensíveis.', correct: false, consequence: 'Cria cópias e um armazém para manter, sem catalogar nada.' },
        { id: 'e', text: 'Painéis do Quick Sight, para esconder as colunas sensíveis.', correct: false, consequence: 'Esconder no painel não impede a consulta direta no Athena.' },
      ],
      explanation: [
        'O data lake de referência tem as camadas no **S3**, o **Glue** para catalogar e converter (crawlers e Data Catalog), o **Lake Formation** para governar o acesso por **coluna e linha**, o **Athena** ou o Redshift Spectrum para consultar e o **Quick Sight** para mostrar. Faltam aqui o catálogo automático e a governança.',
        'Políticas de bucket não chegam às colunas. Cópias no Redshift multiplicam dados. E um painel não protege a tabela.',
        '**Regra prática:** data lake completo e protegido: S3 em camadas, Glue, Lake Formation e Athena ou Redshift Spectrum.',
      ],
    },
    {
      id: 'rv:ana.f09.lake-de-ponta-a-ponta',
      kind: 'decision',
      title: 'Do arquivo bruto ao painel',
      prompt:
        'Uma empresa vai montar um data lake: guardar os arquivos como chegam, **converter para Parquet particionado**, **controlar quem vê cada coluna**, consultar com **SQL sem servidor** e mostrar **painéis** à diretoria. Qual desenho atende com serviços gerenciados?',
      concepts: [{ id: 'ana.lake-reference' }],
      xp: 5,
      difficulty: 1,
      domain: 'd3',
      options: [
        { id: 'a', text: 'S3 em camadas, Glue, Lake Formation, Athena e Quick Sight.', correct: true, consequence: 'Cada etapa fica com o serviço feito para ela, do arquivo bruto ao painel.' },
        { id: 'b', text: 'RDS para guardar, Lambda para converter, IAM e Quick Sight.', correct: false, consequence: 'Um banco relacional não guarda o data lake, e o IAM não controla colunas.' },
        { id: 'c', text: 'S3 numa camada só, EMR permanente, políticas de bucket e Athena.', correct: false, consequence: 'Perde a camada bruta, paga um cluster parado e não controla colunas.' },
        { id: 'd', text: 'Redshift para tudo, com cópias por equipe e relatórios exportados.', correct: false, consequence: 'Abre mão do data lake, cria cópias e não entrega painéis.' },
      ],
      explanation: [
        'Os dados chegam à **camada bruta no S3**; o **Glue** cataloga e converte para a camada tratada em **Parquet particionado**; o **Lake Formation** governa o acesso **por coluna e linha**; o **Athena** consulta sem servidor; e o **Quick Sight** mostra o resultado.',
        'Os outros desenhos perdem a camada bruta, o controle por coluna ou o painel, ou trocam o data lake por cópias.',
        '**Regra prática:** guarde no S3, catalogue e transforme com o Glue, proteja com o Lake Formation, consulte com o Athena e mostre com o Quick Sight.',
      ],
    },
  ],
}
