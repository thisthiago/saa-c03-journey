/**
 * Questões da Revisão da Fase 1 de Análise de dados (data lake no S3), no
 * formato do exame SAA-C03. Fatos conferidos em docs.aws.amazon.com (ver
 * docs/VERIFICACAO-DE-CONTEUDO.md). As empresas são fictícias.
 */
import type { ReviewSet } from '../../../../engine/types'

export const REVIEW_F01: ReviewSet = {
  phaseId: 'ana.f01',
  questions: [
    {
      id: 'rv:ana.f01.m1.a1',
      kind: 'decision',
      title: 'O armazém de relatórios e os dados novos',
      prompt:
        'Uma empresa tem um data warehouse que atende bem aos **relatórios financeiros em SQL**. Agora ela quer guardar também registros de acesso, imagens de produtos e textos de avaliações, de várias fontes, para análises e **aprendizado de máquina que ainda não foram definidos**. Os relatórios atuais devem continuar com o mesmo desempenho. Qual abordagem atende?',
      concepts: [{ id: 'lake.what' }],
      xp: 5,
      difficulty: 2,
      domain: 'd3',
      options: [
        { id: 'a', text: 'Criar no data warehouse tabelas para todos os dados novos, definidas desde já.', correct: false, consequence: 'O esquema teria de existir antes de gravar, e imagens e textos livres não cabem bem em tabelas relacionais.' },
        { id: 'b', text: 'Desligar o data warehouse e levar os relatórios para o data lake.', correct: false, consequence: 'Abre mão do banco otimizado para os relatórios SQL, que precisam manter o desempenho.' },
        { id: 'c', text: 'Manter o data warehouse e criar um data lake no S3 para os dados novos.', correct: true, consequence: 'Os relatórios seguem no armazém, e os dados variados ficam no lago, no formato original, à espera das análises.' },
        { id: 'd', text: 'Guardar os dados novos num banco relacional do RDS, em tabelas genéricas.', correct: false, consequence: 'Repete o problema do esquema definido antes e não separa armazenamento de computação.' },
      ],
      explanation: [
        'O **data lake** guarda dados estruturados e não estruturados no formato original, **sem definir a estrutura antes**: o esquema é aplicado na leitura, conforme a análise. O **data warehouse** é um banco otimizado para SQL sobre dados relacionais, com o esquema definido antes de gravar. A AWS lembra que muitas empresas precisam dos dois: aqui, o armazém segue com os relatórios, e o lago recebe os dados novos.',
        'Criar tabelas para dados cujo uso ainda não se conhece força um esquema prematuro, e imagens não cabem nele. Desligar o armazém sacrifica os relatórios. E um banco relacional genérico tem as mesmas limitações do armazém.',
        '**Regra prática:** "dados variados, de várias fontes, para análises que ainda não existem" pede data lake no S3; "relatórios SQL rápidos sobre dados já limpos" pede data warehouse. Não são concorrentes.',
      ],
    },
    {
      id: 'rv:ana.f01.mesmos-dados-varias-ferramentas',
      kind: 'decision',
      title: 'Quatro equipes e quatro cópias dos dados',
      prompt:
        'Quatro equipes de uma empresa analisam os mesmos dados de vendas com ferramentas diferentes: consultas SQL, processamento em Spark, painéis e aprendizado de máquina. Hoje cada equipe mantém **a própria cópia** dos dados no armazenamento da sua ferramenta. A empresa quer **reduzir o custo de armazenamento** e deixar de sincronizar as cópias. Qual abordagem atende?',
      concepts: [{ id: 'lake.what' }],
      xp: 5,
      difficulty: 1,
      domain: 'd4',
      options: [
        { id: 'a', text: 'Um data lake no S3, com cada ferramenta lendo os dados ali mesmo.', correct: true, consequence: 'Uma cópia só, no S3, serve às quatro ferramentas: armazenamento e computação ficam separados.' },
        { id: 'b', text: 'Uma cópia por equipe, sincronizada por um processo noturno mais rápido.', correct: false, consequence: 'Continua pagando quatro cópias e mantendo a sincronização.' },
        { id: 'c', text: 'Um volume EBS grande, compartilhado pelas instâncias das quatro ferramentas.', correct: false, consequence: 'Prende o armazenamento a instâncias e não serve como fonte comum para serviços diferentes.' },
        { id: 'd', text: 'Um único cluster que roda as quatro ferramentas e guarda os dados nos próprios discos.', correct: false, consequence: 'Junta armazenamento e computação: para guardar mais, paga mais nós, mesmo sem precisar de processamento.' },
      ],
      explanation: [
        'Num **data lake no S3**, o armazenamento fica num lugar só e cada ferramenta (consulta, processamento, painéis, aprendizado de máquina) **lê os dados ali mesmo**. Armazenamento e computação ficam separados: a empresa guarda uma cópia e escala cada ferramenta conforme a necessidade.',
        'Cópias por equipe mantêm o custo e a sincronização. Um volume EBS fica preso a instâncias. E um cluster que guarda os dados nos próprios discos obriga a pagar computação para ter armazenamento.',
        '**Regra prática:** "várias ferramentas sobre os mesmos dados" e "separar armazenamento de computação" apontam para o data lake no S3.',
      ],
    },
    {
      id: 'rv:ana.f01.m1.a3',
      kind: 'decision',
      title: 'CPF na camada bruta',
      prompt:
        'Os arquivos que chegam de um parceiro trazem **CPF e telefone** dos clientes. A política de privacidade proíbe **guardar esses dados sem máscara** em qualquer camada do data lake, mas a empresa quer manter a camada bruta para **reprocessar** quando as regras mudarem. Qual desenho atende?',
      concepts: [{ id: 'lake.layers' }],
      xp: 5,
      difficulty: 3,
      domain: 'd1',
      options: [
        { id: 'a', text: 'Gravar os arquivos na camada bruta e mascarar os dados só na camada de consumo.', correct: false, consequence: 'As camadas bruta e tratada guardariam CPF e telefone sem máscara, contra a política.' },
        { id: 'b', text: 'Um bucket de chegada, que mascara os dados antes da camada bruta.', correct: true, consequence: 'A camada bruta guarda os arquivos já mascarados e continua servindo para reprocessar.' },
        { id: 'c', text: 'Gravar na camada bruta com criptografia SSE-KMS, sem mascarar.', correct: false, consequence: 'Criptografia protege o acesso ao arquivo, mas o dado continua guardado sem máscara.' },
        { id: 'd', text: 'Converter direto para a camada tratada e apagar os arquivos originais.', correct: false, consequence: 'Sem a camada bruta, não há como reprocessar quando as regras mudarem.' },
      ],
      explanation: [
        'Com dados pessoais, a AWS recomenda **mais um bucket, de chegada**, onde os dados são **mascarados antes da camada bruta**. Assim, a camada bruta continua guardando os arquivos no formato original, para reprocessar, mas sem os dados sensíveis expostos.',
        'Mascarar só no consumo deixa as outras camadas com os dados. Criptografar não é mascarar. E apagar os originais elimina o reprocessamento.',
        '**Regra prática:** o data lake tem pelo menos as camadas bruta, tratada e de consumo, cada uma num bucket. Com dados pessoais, acrescente um bucket de chegada para mascarar antes da bruta.',
      ],
    },
    {
      id: 'rv:ana.f01.m1.a2',
      kind: 'decision',
      title: 'A regra de cálculo mudou',
      prompt:
        'Um data lake tem as camadas bruta (arquivos originais), tratada (eventos validados em Parquet, sem alguns campos descartados na conversão) e de consumo (totais por semana). A regra que define **um atraso de entrega mudou**, e a empresa precisa **recalcular dois anos de histórico** com a regra nova, usando inclusive campos descartados antes. De onde o novo processamento deve ler?',
      concepts: [{ id: 'lake.layers' }],
      xp: 5,
      difficulty: 2,
      domain: 'd2',
      options: [
        { id: 'a', text: 'Da camada de consumo, recalculando os totais semanais.', correct: false, consequence: 'Os totais já estão agregados com a regra antiga; não há como refazer o cálculo evento a evento.' },
        { id: 'b', text: 'Da camada tratada, que já está em Parquet e é mais rápida de ler.', correct: false, consequence: 'É mais rápida, mas não tem os campos descartados na conversão, que a regra nova usa.' },
        { id: 'c', text: 'De novas exportações pedidas aos sistemas de origem.', correct: false, consequence: 'Os sistemas podem nem ter mais dois anos de dados, e o lago já guarda os originais.' },
        { id: 'd', text: 'Da camada bruta, com os arquivos no formato em que chegaram.', correct: true, consequence: 'Os originais têm todos os campos, e o histórico pode ser reprocessado com a regra nova.' },
      ],
      explanation: [
        'A **camada bruta** guarda os dados **como chegaram**, justamente para **reprocessar** quando uma regra de transformação muda. A camada tratada é o resultado de uma regra anterior, e a de consumo, de uma agregação: nenhuma das duas permite recalcular o histórico com campos que foram descartados.',
        'Os totais semanais não voltam a eventos. A camada tratada não tem os campos que a regra nova usa. E pedir exportações à origem depende de sistemas que nem sempre guardam o histórico.',
        '**Regra prática:** mantenha a camada bruta, com os originais e versionamento, e use ciclo de vida para baratear a guarda. É ela que permite corrigir e refazer as camadas seguintes.',
      ],
    },
    {
      id: 'rv:ana.f01.m2.a1',
      kind: 'decision',
      title: 'Três colunas de uma tabela larga',
      prompt:
        'Uma tabela de entregas tem 50 colunas e fica em **CSV sem compressão** no S3. O painel consulta todo dia **só data, centro e status** da última semana, e a empresa paga pelos **bytes lidos** em cada consulta. Qual formato faz a mesma consulta **ler menos**?',
      concepts: [{ id: 'lake.columnar' }],
      xp: 5,
      difficulty: 1,
      domain: 'd4',
      options: [
        { id: 'a', text: 'CSV com compressão GZIP.', correct: false, consequence: 'Lê menos que o CSV puro, mas ainda lê as 50 colunas de cada registro.' },
        { id: 'b', text: 'JSON com compressão Snappy.', correct: false, consequence: 'O JSON também guarda registro por registro: a consulta lê os campos que não usa.' },
        { id: 'c', text: 'CSV sem compressão, dividido em arquivos menores.', correct: false, consequence: 'Ajuda a ler em paralelo, mas o volume lido é o mesmo.' },
        { id: 'd', text: 'Apache Parquet com compressão.', correct: true, consequence: 'A consulta lê só as três colunas, comprimidas, e ainda pula blocos pelo mínimo e máximo.' },
      ],
      explanation: [
        'CSV e JSON guardam **um registro depois do outro**: para ler três colunas, a consulta lê as 50. **Parquet** e ORC guardam **coluna por coluna**: a consulta lê só as colunas que usa, comprime melhor (os valores de uma coluna se parecem) e pula blocos usando o mínimo e o máximo guardados no arquivo.',
        'Comprimir CSV ou JSON reduz o volume, mas não evita ler as colunas inúteis. Dividir arquivos não muda o volume lido.',
        '**Regra prática:** consultas que usam poucas colunas de tabelas largas pedem formato colunar (Parquet ou ORC), comprimido. Somado à partição, é o que mais reduz custo e tempo no Athena.',
      ],
    },
    {
      id: 'rv:ana.f01.m2.a4',
      kind: 'decision',
      title: 'Um arquivo de 4 GB por dia',
      prompt:
        'Para simplificar, um sistema passou a gravar o dia inteiro num **único CSV com GZIP de 4 GB**. Desde então, as consultas sobre esse dia ficaram **muito mais lentas**, embora leiam menos bytes que antes. A equipe quer **recuperar o desempenho** sem aumentar o volume lido. Qual mudança atende?',
      concepts: [{ id: 'lake.compression' }, { id: 'lake.columnar' }],
      xp: 5,
      difficulty: 2,
      domain: 'd3',
      options: [
        { id: 'a', text: 'Trocar o GZIP por ZIP, que o Athena lê mais rápido.', correct: false, consequence: 'O Athena não lê arquivos .zip: as consultas deixariam de funcionar.' },
        { id: 'b', text: 'Converter os dados do dia para Parquet comprimido.', correct: true, consequence: 'O Parquet pode ser lido em paralelo por vários leitores, e a compressão continua reduzindo os bytes.' },
        { id: 'c', text: 'Aumentar o nível de compressão do GZIP para o máximo.', correct: false, consequence: 'O arquivo fica um pouco menor, mas continua sendo lido por um leitor só.' },
        { id: 'd', text: 'Descomprimir o arquivo e mantê-lo como um único CSV de 12 GB.', correct: false, consequence: 'Lê três vezes mais bytes, contra o requisito.' },
      ],
      explanation: [
        'Texto comprimido, como CSV com GZIP, **em geral não pode ser dividido** entre vários leitores: um arquivo de 4 GB é lido por um leitor só, e a consulta perde o paralelismo. **Parquet** (e ORC) **permite dividir a leitura** de um arquivo entre vários leitores e ainda comprime bem.',
        'O Athena não lê .zip. Mais compressão não devolve o paralelismo. E descomprimir aumenta os bytes lidos.',
        '**Regra prática:** evite arquivos de texto comprimidos enormes. Prefira formato colunar comprimido ou, se for texto, vários arquivos de tamanho médio.',
      ],
    },
    {
      id: 'rv:ana.f01.m2.a2',
      kind: 'decision',
      title: 'Arquivos comprimidos que viram lixo na consulta',
      prompt:
        'Para reduzir o custo do Athena, um sistema passou a comprimir os CSV com **GZIP**, mas continuou salvando os arquivos com a extensão **.csv**. Desde então, as consultas devolvem **caracteres sem sentido** nas colunas. A empresa quer manter a compressão. Qual mudança corrige?',
      concepts: [{ id: 'lake.compression' }],
      xp: 5,
      difficulty: 3,
      domain: 'd2',
      options: [
        { id: 'a', text: 'Salvar os arquivos com a extensão .gz.', correct: true, consequence: 'Pela extensão, o Athena reconhece o GZIP e descomprime antes de ler.' },
        { id: 'b', text: 'Comprimir os arquivos em ZIP em vez de GZIP.', correct: false, consequence: 'O Athena não lê arquivos .zip: o problema mudaria de forma, sem sumir.' },
        { id: 'c', text: 'Descomprimir tudo, porque o Athena não lê GZIP.', correct: false, consequence: 'O Athena lê GZIP; desistir da compressão aumenta o custo de cada consulta.' },
        { id: 'd', text: 'Juntar todos os arquivos do mês num só, para o Athena detectar o formato.', correct: false, consequence: 'O tamanho não ajuda a detectar a compressão e ainda tira o paralelismo.' },
      ],
      explanation: [
        'Para CSV e JSON, o Athena **descobre a compressão pela extensão** do arquivo. Um arquivo GZIP chamado .csv é lido como texto puro, e os bytes comprimidos aparecem como caracteres sem sentido. Salvar com **.gz** resolve, e a consulta continua lendo menos bytes.',
        'O ZIP não é lido pelo Athena. O GZIP é. E juntar arquivos não tem relação com a detecção.',
        '**Regra prática:** em texto comprimido, a extensão importa (.gz para GZIP). O Athena cobra os bytes lidos antes de descomprimir, então comprimir corretamente reduz o custo.',
      ],
    },
    {
      id: 'rv:ana.f01.m3.a1',
      kind: 'decision',
      title: 'Partições por hora para consultas por mês',
      prompt:
        'Uma tabela de sensores gera cerca de **30 GB por ano** em Parquet e foi particionada **por hora** (ano/mês/dia/hora). Todas as consultas filtram **por mês** inteiro, e ficaram lentas: cada uma lista e abre centenas de pastas com arquivos pequenos. Qual mudança deixa as consultas mais rápidas **sem ler mais dados**?',
      concepts: [{ id: 'lake.partitioning' }],
      xp: 5,
      difficulty: 2,
      domain: 'd3',
      options: [
        { id: 'a', text: 'Particionar por minuto, para cada pasta ficar menor ainda.', correct: false, consequence: 'Fragmenta ainda mais a tabela: mais pastas e arquivos menores para listar e abrir.' },
        { id: 'b', text: 'Particionar por mês, a chave que as consultas usam no filtro.', correct: true, consequence: 'Cada consulta abre uma pasta só, com arquivos maiores, e lê o mesmo mês de antes.' },
        { id: 'c', text: 'Remover o filtro de mês das consultas, para ler tudo de uma vez.', correct: false, consequence: 'Passa a ler o ano inteiro, contra o requisito.' },
        { id: 'd', text: 'Particionar pelo número de série de cada sensor.', correct: false, consequence: 'Nenhuma consulta filtra pelo sensor: a partição não reduz nada e ainda fragmenta a tabela.' },
      ],
      explanation: [
        'A chave de partição certa é a que as consultas **usam no filtro**, no nível em que filtram. Com 30 GB por ano e consultas por mês, partições por hora criam **partições demais**, com arquivos pequenos: cada consulta lista e abre centenas de pastas. Particionar **por mês** mantém a mesma leitura e corta esse trabalho.',
        'Partições ainda menores pioram a fragmentação. Tirar o filtro faz ler o ano todo. E uma chave que ninguém filtra não reduz a leitura.',
        '**Regra prática:** escolha a granularidade da partição pelo filtro das consultas e pelo volume. Partições demais fragmentam; de menos, fazem ler mais que o necessário.',
      ],
    },
    {
      id: 'rv:ana.f01.m3.a2',
      kind: 'decision',
      title: 'Particionou e o custo não caiu',
      prompt:
        'Uma tabela de pedidos em Parquet foi particionada **pela região** do cliente, mas as consultas de quase todas as equipes filtram **por intervalo de datas** e nunca pela região. O custo do Athena **não mudou**. Quais mudanças fazem a partição reduzir os bytes lidos? (Escolha DUAS.)',
      concepts: [{ id: 'lake.partitioning' }],
      xp: 5,
      difficulty: 1,
      domain: 'd4',
      multiple: true,
      options: [
        { id: 'a', text: 'Particionar a tabela pela data do pedido.', correct: true, consequence: 'A chave passa a ser a coluna que as consultas filtram.' },
        { id: 'b', text: 'Criar mais regiões, para cada partição ficar menor.', correct: false, consequence: 'Nenhuma consulta filtra pela região: mais partições não reduzem a leitura.' },
        { id: 'c', text: 'Manter o filtro de datas no WHERE das consultas.', correct: true, consequence: 'É o filtro pela chave que faz o Athena ler só as pastas escolhidas.' },
        { id: 'd', text: 'Particionar ao mesmo tempo por hora e por região.', correct: false, consequence: 'Fragmenta a tabela em arquivos pequenos, e a região continua inútil para as consultas.' },
        { id: 'e', text: 'Trocar o Parquet por CSV, mais fácil de dividir em pastas.', correct: false, consequence: 'O CSV lê todas as colunas: o custo sobe em vez de cair.' },
      ],
      explanation: [
        'A partição só reduz a leitura quando a **consulta filtra pela chave** de partição. Particionada pela região, a tabela é lida inteira por consultas que filtram por data. Particionar **pela data** e manter o **filtro de datas no WHERE** faz o Athena abrir só as pastas do intervalo pedido.',
        'Mais regiões, ou partições por hora e região, só fragmentam a tabela. E o CSV aumenta os bytes lidos.',
        '**Regra prática:** a chave de partição é a coluna mais usada no filtro, em geral a data. Partição que a consulta não usa não reduz nada.',
      ],
    },
    {
      id: 'rv:ana.f01.m3.a3',
      kind: 'decision',
      title: 'Por dia e por centro',
      prompt:
        'Uma tabela de sensores gera cerca de **67 GB por ano** em Parquet comprimido. Um analista propõe particioná-la **por dia e pelos 40 centros de distribuição**, o que dá cerca de 14.600 pastas por ano. As consultas leem o ano inteiro ou o mês, **sem filtrar por centro**. Qual avaliação está correta?',
      concepts: [{ id: 'lake.small-files' }, { id: 'lake.partitioning' }],
      xp: 5,
      difficulty: 3,
      domain: 'd3',
      options: [
        { id: 'a', text: 'Melhora: cada pasta fica pequena, e a consulta lê menos.', correct: false, consequence: 'O volume lido não cai, porque nenhuma consulta filtra por dia e centro ao mesmo tempo.' },
        { id: 'b', text: 'Não muda nada: o Athena junta as pastas pequenas sozinho.', correct: false, consequence: 'O Athena lista e abre cada arquivo; muitos arquivos pequenos aumentam esse trabalho.' },
        { id: 'c', text: 'Piora: arquivos de menos de 5 MB deixam a consulta mais lenta.', correct: true, consequence: 'Cada consulta lista e abre milhares de arquivos pequenos; para essa tabela, partição por mês basta.' },
        { id: 'd', text: 'Melhora, desde que o tamanho do grupo de linhas do Parquet seja reduzido.', correct: false, consequence: 'A documentação não recomenda reduzir o grupo de linhas, e o problema é o número de arquivos.' },
      ],
      explanation: [
        '67 GB divididos em 14.600 pastas dão **menos de 5 MB por pasta**. Cada abertura de arquivo tem um custo fixo, e o Athena precisa listar cada partição: com **milhares de arquivos pequenos**, a consulta fica mais lenta. Como as consultas não filtram por centro nem por dia isolado, ela também **não lê menos**.',
        'Pastas pequenas só ajudam quando o filtro as aproveita. O Athena não junta os arquivos sozinho. E reduzir o grupo de linhas do Parquet (128 MB por padrão) vai contra a recomendação.',
        '**Regra prática:** arquivos pequenos demais pioram as consultas. Junte arquivos (compactação) e particione só pelo que as consultas filtram, numa granularidade compatível com o volume.',
      ],
    },
  ],
}
