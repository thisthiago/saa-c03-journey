/**
 * Questões da Revisão da Fase 5 de Análise de dados (processamento com EMR),
 * no formato do exame SAA-C03. Fatos conferidos em docs.aws.amazon.com (ver
 * docs/VERIFICACAO-DE-CONTEUDO.md). As empresas são fictícias.
 */
import type { ReviewSet } from '../../../../engine/types'

export const REVIEW_F05: ReviewSet = {
  phaseId: 'ana.f05',
  questions: [
    {
      id: 'rv:ana.f05.m1.a1',
      kind: 'decision',
      title: 'HBase e um Spark ajustado a fundo',
      prompt:
        'O processamento de uma ouvidoria grava em **tabelas do HBase**, consultadas por uma aplicação interna, e usa **configurações próprias do Spark**, com versão e ajustes de memória específicos. A equipe quer um serviço gerenciado em que **controle a configuração do cluster**. Onde esse processamento deve rodar?',
      concepts: [{ id: 'emr.what' }, { id: 'emr.vs-glue-athena' }],
      xp: 5,
      difficulty: 1,
      domain: 'd3',
      options: [
        { id: 'a', text: 'Num job do AWS Glue.', correct: false, consequence: 'O Glue roda Spark gerenciado, sem HBase e sem controle do cluster.' },
        { id: 'b', text: 'Em consultas do Amazon Athena.', correct: false, consequence: 'O Athena responde SQL sob demanda; não roda HBase nem jobs Spark ajustados.' },
        { id: 'c', text: 'Num cluster do Amazon EMR.', correct: true, consequence: 'O HBase roda no cluster, e a equipe ajusta o Spark como precisa.' },
        { id: 'd', text: 'No AWS Glue DataBrew.', correct: false, consequence: 'O DataBrew prepara dados sem código; não hospeda HBase nem roda Spark configurado.' },
      ],
      explanation: [
        'O **EMR** roda clusters gerenciados de Spark, Hadoop, Hive, **HBase**, Presto e outras ferramentas de big data. A AWS cria as instâncias e instala o software, e a equipe **controla a configuração** do cluster e das aplicações, como versões e memória do Spark.',
        'O Glue faz ETL sem servidor, sem esse controle e sem HBase. O Athena é SQL sob demanda. E o DataBrew é preparação visual de dados.',
        '**Regra prática:** "Spark, Hadoop, Hive ou HBase" com "controle das configurações do cluster" aponta para o EMR.',
      ],
    },
    {
      id: 'rv:ana.f05.hdfs-efemero',
      kind: 'decision',
      title: 'Resultados que somem com o cluster',
      prompt:
        'Um cluster transitório do EMR roda toda noite e termina ao fim dos passos. O job grava o resultado final no **HDFS do cluster**, e na manhã seguinte os analistas **não encontram os dados**. A empresa quer manter o cluster transitório e **guardar os resultados de forma durável**. Qual mudança atende?',
      concepts: [{ id: 'emr.what' }],
      xp: 5,
      difficulty: 2,
      domain: 'd2',
      options: [
        { id: 'a', text: 'Ligar a proteção contra término no cluster.', correct: false, consequence: 'O cluster deixaria de terminar, e a empresa passaria a pagar por ele parado.' },
        { id: 'b', text: 'Aumentar o fator de replicação do HDFS.', correct: false, consequence: 'Protege contra a perda de um nó, mas o HDFS inteiro some quando o cluster termina.' },
        { id: 'c', text: 'Gravar o resultado final no Amazon S3.', correct: true, consequence: 'O S3 guarda os dados depois que o cluster termina, e os analistas os encontram de manhã.' },
        { id: 'd', text: 'Usar instâncias maiores nos nós core.', correct: false, consequence: 'Mais disco no HDFS não muda o fato de ele sumir com o cluster.' },
      ],
      explanation: [
        'O **HDFS** do cluster é rápido, mas **efêmero**: some quando o cluster termina. O EMR lê e grava direto no **S3**, que guarda os dados de forma durável. Com a entrada e a saída no S3, o cluster transitório pode terminar sem perder nada.',
        'A proteção contra término transforma o transitório em permanente. Replicar o HDFS ou aumentar os discos não sobrevive ao fim do cluster.',
        '**Regra prática:** no EMR, o HDFS é para dados intermediários; entrada e saída ficam no S3. É isso que torna os clusters transitórios seguros.',
      ],
    },
    {
      id: 'rv:ana.f05.m1.a2',
      kind: 'decision',
      title: 'Cada necessidade com o serviço de menos operação',
      prompt:
        'Uma empresa listou necessidades de dados e o serviço que pretende usar em cada uma, sempre buscando **o de menos operação** que atende. Quais associações estão **corretas**? (Escolha DUAS.)',
      concepts: [{ id: 'emr.vs-glue-athena' }],
      xp: 5,
      difficulty: 2,
      domain: 'd3',
      multiple: true,
      options: [
        { id: 'a', text: 'Saber, uma vez, quantas leituras faltaram ontem nos arquivos do S3: Athena.', correct: true, consequence: 'Uma consulta SQL sob demanda resolve, sem nada para manter.' },
        { id: 'b', text: 'Converter todo dia as leituras em Parquet, sem cuidar de servidores: Glue.', correct: true, consequence: 'ETL recorrente sem servidor é o caso do Glue.' },
        { id: 'c', text: 'Manter tabelas do HBase consultadas por uma aplicação: Glue.', correct: false, consequence: 'O Glue não hospeda HBase; isso pede um cluster do EMR.' },
        { id: 'd', text: 'Responder a uma pergunta SQL avulsa: um cluster do EMR de longa duração.', correct: false, consequence: 'Funciona, mas um cluster ligado para perguntas avulsas é operação e custo a mais; o Athena atende.' },
        { id: 'e', text: 'Rodar o Spark com uma versão e um ajuste de memória específicos: Athena.', correct: false, consequence: 'O Athena não dá controle do Spark; isso pede o EMR.' },
      ],
      explanation: [
        'Os três serviços se separam pela necessidade de controle. O **Athena** responde a **consultas SQL sob demanda**. O **Glue** faz **ETL sem servidor**, com Spark gerenciado. O **EMR** entra quando é preciso **controlar o cluster**, usar o ecossistema Hadoop (HBase, Presto, Hive) ou ajustar o Spark a fundo.',
        'HBase e Spark ajustado são do EMR. Pergunta avulsa num cluster permanente é operação desnecessária.',
        '**Regra prática:** SQL sob demanda, Athena; ETL sem servidor, Glue; cluster configurável com o ecossistema Hadoop, EMR.',
      ],
    },
    {
      id: 'rv:ana.f05.migrar-hadoop',
      kind: 'decision',
      title: 'O cluster Hadoop do data center',
      prompt:
        'Uma empresa vai desligar um **cluster Hadoop** do data center, com centenas de jobs em **Hive e Spark** e consultas em **Presto**. Ela quer levar tudo para a AWS com o **mínimo de reescrita** dos jobs e sem cuidar de instalação de software, mantendo o controle das configurações. Qual destino atende?',
      concepts: [{ id: 'emr.vs-glue-athena' }, { id: 'emr.what' }],
      xp: 5,
      difficulty: 2,
      domain: 'd3',
      options: [
        { id: 'a', text: 'Reescrever todos os jobs como jobs do AWS Glue.', correct: false, consequence: 'O Glue cobre ETL em Spark, mas exige reescrever e não roda Hive nem Presto como no cluster.' },
        { id: 'b', text: 'Instalar o Hadoop em instâncias EC2 gerenciadas pela equipe.', correct: false, consequence: 'Mantém os jobs, mas a equipe passa a instalar e cuidar de todo o software.' },
        { id: 'c', text: 'Converter todos os jobs em consultas do Athena.', correct: false, consequence: 'O Athena responde SQL; não roda os jobs Spark e Hive como estão.' },
        { id: 'd', text: 'Clusters do Amazon EMR, com os dados no S3.', correct: true, consequence: 'Hive, Spark e Presto rodam como no cluster local, com a AWS cuidando das instâncias e do software.' },
      ],
      explanation: [
        'Migrar um cluster Hadoop local é um dos sinais clássicos do **EMR**: ele roda as mesmas ferramentas (Hive, Spark, Presto) com o mínimo de mudança, e a AWS cuida das instâncias e da instalação, enquanto a equipe mantém o controle das configurações. Com os dados no S3, os clusters podem até virar transitórios.',
        'Glue e Athena exigem reescrever e não cobrem todas as ferramentas. Hadoop em EC2 própria devolve à equipe o trabalho de instalar e manter.',
        '**Regra prática:** "migrar um cluster Hadoop local" com pouca reescrita é EMR.',
      ],
    },
    {
      id: 'rv:ana.f05.m2.a1',
      kind: 'decision',
      title: 'O nó primário em Spot',
      prompt:
        'Para economizar, uma equipe montou o cluster do faturamento com o **nó primário em Spot**, 4 nós core On-Demand e 8 nós task On-Demand. Durante o job da madrugada, a AWS **retoma a instância Spot do primário**. Qual é o efeito no cluster e no job?',
      concepts: [{ id: 'emr.node-types' }],
      xp: 5,
      difficulty: 2,
      domain: 'd2',
      options: [
        { id: 'a', text: 'O cluster termina, e o job se perde.', correct: true, consequence: 'O nó primário coordena o cluster: quando ele termina, o cluster termina.' },
        { id: 'b', text: 'Um nó core assume como primário, e o job continua.', correct: false, consequence: 'Os nós core processam e guardam o HDFS; nenhum deles assume a coordenação.' },
        { id: 'c', text: 'O job continua nos nós core e task, só mais lento.', correct: false, consequence: 'Sem o primário, não há quem coordene: o cluster inteiro termina.' },
        { id: 'd', text: 'O EMR troca o primário por uma instância On-Demand sozinho.', correct: false, consequence: 'Não há essa troca: para mudar o primário entre Spot e On-Demand, é preciso criar outro cluster.' },
      ],
      explanation: [
        'O **nó primário coordena o cluster**: se ele termina, o cluster termina. Com o primário em Spot, a retomada derruba tudo, inclusive o trabalho dos nós core e task. Por isso a AWS recomenda o primário On-Demand quando o job importa.',
        'Nós core não assumem a coordenação. O job não continua sem o primário. E o EMR não troca o tipo de compra do primário sozinho.',
        '**Regra prática:** primário mantém o cluster vivo, core guarda o HDFS, task só processa. Spot é seguro nos nós task.',
      ],
    },
    {
      id: 'rv:ana.f05.tres-primarios',
      kind: 'decision',
      title: 'Um cluster permanente sem ponto único de falha',
      prompt:
        'Um cluster do EMR de **longa duração** hospeda um HBase usado por uma aplicação o dia inteiro. A empresa descobriu que a **falha do nó primário** derrubaria o cluster e quer **eliminar esse ponto único de falha**, com o menor esforço, numa versão recente do EMR. Qual solução atende?',
      concepts: [{ id: 'emr.node-types' }],
      xp: 5,
      difficulty: 3,
      domain: 'd2',
      options: [
        { id: 'a', text: 'Criar o cluster com três nós primários.', correct: true, consequence: 'Com três primários, a falha de um não termina o cluster.' },
        { id: 'b', text: 'Pôr o nó primário numa instância maior.', correct: false, consequence: 'Uma instância maior continua sendo um primário só, que pode falhar.' },
        { id: 'c', text: 'Aumentar o número de nós core.', correct: false, consequence: 'Os nós core não coordenam o cluster; o primário continua único.' },
        { id: 'd', text: 'Manter um segundo cluster parado, para recriar o HBase se o primeiro cair.', correct: false, consequence: 'Paga um cluster ocioso e ainda deixa a aplicação fora até a recriação.' },
      ],
      explanation: [
        'Desde a versão 5.23.0, o cluster do EMR pode ter **três nós primários**, e o primário **deixa de ser ponto único de falha**: se um falhar, o cluster continua. Para um cluster de longa duração que atende uma aplicação o dia inteiro, é a forma mais simples de ganhar alta disponibilidade.',
        'Uma instância maior ou mais nós core não mudam o fato de haver um primário só. E um cluster de reserva custa mais e ainda tem parada.',
        '**Regra prática:** cluster do EMR permanente e crítico pede três nós primários.',
      ],
    },
    {
      id: 'rv:ana.f05.m2.a3',
      kind: 'decision',
      title: 'Spot nos nós task e o prazo das 6h',
      prompt:
        'O faturamento roda toda madrugada num cluster com primário e core On-Demand e **16 nós task em Spot**, com prazo para terminar às 6h. Quando a AWS retoma metade das instâncias Spot, o job **não perde dados, mas termina depois do prazo**. A empresa quer **cumprir o prazo** com o **menor custo**. Qual mudança atende?',
      concepts: [{ id: 'emr.spot' }],
      xp: 5,
      difficulty: 3,
      domain: 'd4',
      options: [
        { id: 'a', text: 'Passar os nós core para Spot e usar a economia em mais nós task.', correct: false, consequence: 'Os nós core guardam o HDFS: perdê-los arrisca os dados intermediários e o job.' },
        { id: 'b', text: 'Parte dos nós task em On-Demand e o resto em Spot.', correct: true, consequence: 'A parte On-Demand garante a capacidade mínima para o prazo, e o Spot continua barateando o restante.' },
        { id: 'c', text: 'Passar o nó primário para Spot e somar mais nós task em Spot.', correct: false, consequence: 'Se o primário for retomado, o cluster inteiro termina.' },
        { id: 'd', text: 'Passar todos os nós do cluster para On-Demand.', correct: false, consequence: 'Cumpre o prazo, mas abre mão de toda a economia do Spot nos nós task.' },
      ],
      explanation: [
        'Com **primário e core On-Demand** e **task em Spot**, a retomada de um nó task **não perde dados**: só reduz a capacidade. O problema aqui é o prazo, e ele se resolve garantindo **capacidade mínima** nos nós task: uma parte em On-Demand, que não é retomada, e o resto em Spot, mais barato. Nós task podem ser adicionados com outra opção de compra sem recriar o cluster.',
        'Core ou primário em Spot põem em risco os dados ou o cluster inteiro. Tudo em On-Demand cumpre o prazo, mas não pelo menor custo.',
        '**Regra prática:** Spot no EMR vai para os nós task. Se a carga tem prazo, misture On-Demand e Spot nos nós task para garantir o mínimo.',
      ],
    },
    {
      id: 'rv:ana.f05.tudo-em-spot',
      kind: 'decision',
      title: 'Um cluster de testes que pode recomeçar',
      prompt:
        'Um time roda num cluster do EMR **testes de desempenho** de jobs Spark, uma vez por semana. Se o cluster cair no meio, basta **recomeçar o teste** no dia seguinte, e os dados de entrada e saída ficam no S3. O critério é o **menor custo possível**. Qual configuração atende?',
      concepts: [{ id: 'emr.spot' }],
      xp: 5,
      difficulty: 2,
      domain: 'd4',
      options: [
        { id: 'a', text: 'Primário e core On-Demand, task em Spot.', correct: false, consequence: 'É a recomendação para dados críticos, mas paga On-Demand onde uma parada é aceitável.' },
        { id: 'b', text: 'Todos os nós On-Demand, com reservas de um ano.', correct: false, consequence: 'Paga por um ano para um uso semanal, e ainda pelo preço mais alto que o Spot.' },
        { id: 'c', text: 'Todos os nós em Spot: primário, core e task.', correct: true, consequence: 'É o mais barato; uma retomada pode derrubar o cluster, o que o teste aceita.' },
        { id: 'd', text: 'Primário em Spot e core e task On-Demand.', correct: false, consequence: 'Arrisca o cluster pelo primário e ainda paga On-Demand nos outros nós.' },
      ],
      explanation: [
        'A AWS recomenda primário e core On-Demand com task em Spot quando os dados são críticos. **Tudo em Spot só cabe quando o custo importa mais que uma parada súbita**: aqui, o teste pode recomeçar, e os dados estão no S3. Com todos os nós em Spot, o cluster sai pelo menor preço, aceitando que a retomada do primário o termine.',
        'Proteger primário e core paga por uma estabilidade que o caso não pede. Reservas de um ano não combinam com uso semanal. E primário em Spot com o resto On-Demand junta o risco ao custo.',
        '**Regra prática:** a escolha do Spot no EMR depende do que a parada custa. Carga crítica: Spot só nos task. Carga que pode recomeçar: tudo em Spot.',
      ],
    },
    {
      id: 'rv:ana.f05.m3.a1',
      kind: 'decision',
      title: 'Cinco horas de trabalho e 24 de cobrança',
      prompt:
        'Um cluster do EMR, criado pelo console com as opções padrão, processa o faturamento **das 0h às 5h** e fica **ocioso o resto do dia**, inclusive nos fins de semana. A entrada e a saída ficam no S3. A empresa quer **reduzir o custo** sem mudar os jobs. Qual mudança atende?',
      concepts: [{ id: 'emr.transient' }],
      xp: 5,
      difficulty: 1,
      domain: 'd4',
      options: [
        { id: 'a', text: 'Ligar a proteção contra término no cluster atual.', correct: false, consequence: 'Protege contra desligamento acidental; não reduz o custo.' },
        { id: 'b', text: 'Reduzir o número de nós task nas horas sem trabalho.', correct: false, consequence: 'Reduz um pouco, mas continua pagando o primário e os core parados.' },
        { id: 'c', text: 'Comprar instâncias reservadas de um ano para todos os nós do cluster.', correct: false, consequence: 'Baratia as horas, mas continua pagando 24 horas para usar 5.' },
        { id: 'd', text: 'Um cluster transitório por noite, encerrado no fim dos passos.', correct: true, consequence: 'O cluster só existe nas horas de trabalho, e, com os dados no S3, nada se perde ao terminar.' },
      ],
      explanation: [
        'Por padrão, o cluster criado pelo console ou pela CLI é **de longa duração**: fica ligado, cobrando, até alguém encerrá-lo. Um **cluster transitório** sobe, roda os passos e **termina sozinho**, cobrando só enquanto existe. Como a entrada e a saída estão no S3, o fim do cluster não perde nada.',
        'A proteção contra término mantém o cluster vivo. Reduzir nós task deixa o primário e os core cobrando. E reservas baratiam horas que nem precisam existir.',
        '**Regra prática:** "job em lote que roda uma vez por dia" pede cluster transitório, com os dados no S3.',
      ],
    },
    {
      id: 'rv:ana.f05.longa-duracao',
      kind: 'decision',
      title: 'Jobs a cada 15 minutos e analistas o dia inteiro',
      prompt:
        'Uma equipe roda jobs Spark **a cada 15 minutos**, das 7h às 23h, e analistas usam **consultas interativas** no mesmo cluster durante o expediente. Criar um cluster leva cerca de 10 minutos. A carga varia muito ao longo do dia. Qual configuração atende com o **menor custo** sem atrasar os jobs?',
      concepts: [{ id: 'emr.transient' }],
      xp: 5,
      difficulty: 3,
      domain: 'd4',
      options: [
        { id: 'a', text: 'Um cluster transitório para cada job, criado a cada 15 minutos.', correct: false, consequence: 'Os 10 minutos de criação comem quase todo o intervalo, e as consultas interativas ficam sem cluster.' },
        { id: 'b', text: 'Um cluster de longa duração com managed scaling.', correct: true, consequence: 'O cluster fica disponível para jobs e analistas, e o número de nós acompanha a carga.' },
        { id: 'c', text: 'Um cluster de longa duração dimensionado para o pico, o dia inteiro.', correct: false, consequence: 'Atende, mas paga a capacidade do pico mesmo nas horas calmas.' },
        { id: 'd', text: 'Um cluster transitório por dia, que termina às 7h.', correct: false, consequence: 'Termina justamente quando o trabalho começa.' },
      ],
      explanation: [
        'O cluster **de longa duração** serve a **consultas interativas** e a processamentos **tão frequentes que não compensa recriar** o cluster: aqui, os jobs rodam a cada 15 minutos, e criar um cluster leva 10. O **managed scaling** ajusta o número de nós conforme a carga, e o cluster não paga a capacidade do pico o dia inteiro.',
        'Clusters por job gastam o intervalo subindo e deixam os analistas sem cluster. Dimensionar para o pico paga capacidade ociosa. E terminar às 7h não faz sentido.',
        '**Regra prática:** transitório para lotes espaçados; longa duração, com managed scaling, para trabalho contínuo ou interativo.',
      ],
    },
    {
      id: 'rv:ana.f05.m3.a2',
      kind: 'decision',
      title: 'Spark sem escolher instâncias e com resposta rápida',
      prompt:
        'Um time novo quer rodar jobs Spark **esporádicos** sem escolher tipos de instância nem número de nós. Alguns jobs são chamados por uma aplicação e precisam **começar a responder em segundos**. A empresa não opera Kubernetes. Qual solução atende?',
      concepts: [{ id: 'emr.serverless-eks' }],
      xp: 5,
      difficulty: 2,
      domain: 'd3',
      options: [
        { id: 'a', text: 'EMR Serverless, com capacidade pré-inicializada.', correct: true, consequence: 'O serviço cuida da capacidade de cada job, e os recursos pré-inicializados respondem em segundos.' },
        { id: 'b', text: 'Um cluster do EMR de longa duração só para esse time.', correct: false, consequence: 'Exige dimensionar o cluster e paga por ele parado entre os jobs.' },
        { id: 'c', text: 'O EMR no EKS, num cluster Kubernetes criado para isso.', correct: false, consequence: 'Faz sentido para quem já opera EKS; aqui, só acrescenta um cluster Kubernetes para cuidar.' },
        { id: 'd', text: 'Um cluster transitório do EMR criado a cada chamada.', correct: false, consequence: 'Leva minutos para subir a cada chamada, longe da resposta em segundos.' },
      ],
      explanation: [
        'O **EMR Serverless** roda Spark e Hive **sem cluster para configurar**: aloca os recursos de cada job e os libera no fim. Para jobs que precisam responder rápido, os recursos podem ser **pré-inicializados**, com respostas em segundos.',
        'Um cluster permanente exige dimensionamento e cobra parado. O EMR no EKS serve a quem já tem Kubernetes. E clusters transitórios por chamada demoram a subir.',
        '**Regra prática:** "rodar Spark sem gerenciar cluster" é EMR Serverless; "aproveitar o Kubernetes que já existe" é EMR no EKS.',
      ],
    },
    {
      id: 'rv:ana.f05.m3.a3',
      kind: 'decision',
      title: 'Uma equipe que já opera Kubernetes',
      prompt:
        'A equipe de plataforma já opera um **cluster do Amazon EKS** com folga de recursos e quer rodar nele os **jobs Spark do EMR**, junto com os outros sistemas, inclusive com **versões diferentes do Spark** para times diferentes. Qual solução atende com o **melhor aproveitamento** do que já existe?',
      concepts: [{ id: 'emr.serverless-eks' }],
      xp: 5,
      difficulty: 1,
      domain: 'd3',
      options: [
        { id: 'a', text: 'Um cluster do EMR separado para cada time.', correct: false, consequence: 'Funciona, mas deixa ociosa a capacidade do EKS e multiplica clusters.' },
        { id: 'b', text: 'O EMR Serverless para todos os times.', correct: false, consequence: 'Não usa a capacidade que sobra no cluster EKS que a equipe já paga.' },
        { id: 'c', text: 'O Amazon EMR no EKS.', correct: true, consequence: 'Os jobs rodam no cluster Kubernetes existente, com versões diferentes lado a lado.' },
        { id: 'd', text: 'Jobs do AWS Glue, um por time.', correct: false, consequence: 'O Glue não usa o cluster EKS e não dá o mesmo controle de versão do Spark.' },
      ],
      explanation: [
        'O **EMR no EKS** roda as aplicações do EMR num **cluster Kubernetes que a empresa já usa**, ao lado de outras cargas, e permite **versões diferentes** das ferramentas no mesmo cluster. É a forma de aproveitar a capacidade e as ferramentas que a equipe de plataforma já opera.',
        'Clusters separados e o EMR Serverless deixam o EKS ocioso. O Glue não roda no EKS.',
        '**Regra prática:** "já temos EKS e queremos rodar Spark nele" é EMR no EKS.',
      ],
    },
  ],
}
