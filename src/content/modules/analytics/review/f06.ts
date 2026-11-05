/**
 * Questões da Revisão da Fase 6 de Análise de dados (ingestão e streaming),
 * no formato do exame SAA-C03. Fatos conferidos em docs.aws.amazon.com (ver
 * docs/VERIFICACAO-DE-CONTEUDO.md). As empresas são fictícias.
 */
import type { ReviewSet } from '../../../../engine/types'

export const REVIEW_F06: ReviewSet = {
  phaseId: 'ana.f06',
  questions: [
    {
      id: 'rv:ana.f06.m1.a1',
      kind: 'decision',
      title: 'Quanto cada fonte pode esperar',
      prompt:
        'Uma empresa de mobilidade vai levar cinco fontes de dados para a AWS e quer usar ingestão em **fluxo contínuo**, com o dado disponível **em segundos**, só onde o negócio exige. Quais fontes precisam desse padrão? (Escolha DUAS.)',
      concepts: [{ id: 'ingest.patterns' }],
      xp: 5,
      difficulty: 1,
      domain: 'd3',
      multiple: true,
      options: [
        { id: 'a', text: 'Os pagamentos, que o antifraude avalia antes de aprovar a corrida.', correct: true, consequence: 'A decisão precisa sair em segundos: é fluxo.' },
        { id: 'b', text: 'O fechamento financeiro, lido pela contabilidade no dia seguinte.', correct: false, consequence: 'Um dia de espera é aceito: um lote diário basta.' },
        { id: 'c', text: 'As posições dos carros, usadas no preço dinâmico da corrida.', correct: true, consequence: 'O preço muda a cada instante, conforme a posição: é fluxo.' },
        { id: 'd', text: 'Os cliques do aplicativo, para um painel atualizado a cada 5 minutos.', correct: false, consequence: 'Alguns minutos bastam: microlotes, como os do Firehose, atendem.' },
        { id: 'e', text: 'O cadastro de motoristas, conferido uma vez por semana.', correct: false, consequence: 'Uma semana de espera é aceita: um lote semanal basta.' },
      ],
      explanation: [
        'O padrão de ingestão vem de **quanto tempo o negócio aceita esperar** pelo dado. Antifraude e preço dinâmico decidem em segundos: pedem **fluxo**. O painel de 5 minutos aceita **microlotes**. Fechamento e cadastro aceitam dias: **lote**.',
        'Pôr tudo em fluxo custa mais e complica o que um arquivo diário resolveria.',
        '**Regra prática:** um dia de espera, lote; minutos, microlotes (Firehose); segundos com vários consumidores, Kinesis Data Streams ou MSK.',
      ],
    },
    {
      id: 'rv:ana.f06.lote-basta',
      kind: 'decision',
      title: 'Um relatório lido toda manhã',
      prompt:
        'A diretoria lê **toda manhã** o relatório de vendas do dia anterior. O sistema de vendas consegue exportar um arquivo por dia. Um analista propõe um Kinesis Data Streams com consumidores rodando o dia inteiro. A empresa quer o **menor custo** que atenda ao relatório. Qual solução atende?',
      concepts: [{ id: 'ingest.patterns' }],
      xp: 5,
      difficulty: 2,
      domain: 'd4',
      options: [
        { id: 'a', text: 'O Kinesis Data Streams proposto, com consumidores sempre ligados.', correct: false, consequence: 'Entrega em segundos um dado que só é lido na manhã seguinte, pagando o fluxo o dia inteiro.' },
        { id: 'b', text: 'Um arquivo diário no S3, processado de madrugada pelo Glue.', correct: true, consequence: 'O lote atende ao prazo da manhã, e só se paga o processamento da madrugada.' },
        { id: 'c', text: 'Um Data Firehose com buffer de 60 segundos, ligado o dia inteiro.', correct: false, consequence: 'Microlotes de um minuto para um relatório diário: entrega antes do necessário.' },
        { id: 'd', text: 'Um cluster do Amazon MSK recebendo cada venda como evento.', correct: false, consequence: 'Um cluster Kafka permanente para um uso que um arquivo diário resolve.' },
      ],
      explanation: [
        'O relatório é lido **uma vez por dia**, e o sistema já exporta **um arquivo por dia**: o padrão é **lote**. Um arquivo no S3, processado de madrugada por um job do Glue, entrega o relatório a tempo, pagando só o processamento.',
        'Kinesis, Firehose e MSK entregam em segundos ou minutos, ao custo de componentes ligados o tempo todo, sem nenhum ganho para quem lê de manhã.',
        '**Regra prática:** escolha o padrão de ingestão pelo prazo do negócio, não pela tecnologia. Fluxo em tempo real para dado lido no dia seguinte é custo sem retorno.',
      ],
    },
    {
      id: 'rv:ana.f06.m2.a1',
      kind: 'decision',
      title: 'O antifraude que precisa voltar no tempo',
      prompt:
        'Um fluxo do Kinesis Data Streams, com a **retenção padrão**, é lido pelo cálculo de preço e pelo antifraude. Quando a regra do antifraude muda, a equipe precisa **reprocessar os últimos 3 dias** de eventos pelo próprio fluxo, sem montar outra cópia. Qual mudança atende?',
      concepts: [{ id: 'kds.streams' }],
      xp: 5,
      difficulty: 2,
      domain: 'd2',
      options: [
        { id: 'a', text: 'Trocar o fluxo por uma fila do SQS com visibilidade longa.', correct: false, consequence: 'Na fila, a mensagem lida e apagada some, e não há dois leitores do mesmo evento.' },
        { id: 'b', text: 'Aumentar a retenção do fluxo para pelo menos 3 dias.', correct: true, consequence: 'O fluxo guarda os registros por mais tempo, e o antifraude pode reler os 3 dias.' },
        { id: 'c', text: 'Pôr um Data Firehose na frente do antifraude.', correct: false, consequence: 'O Firehose entrega e segue; ele não guarda registros para releitura.' },
        { id: 'd', text: 'Dobrar o número de shards do fluxo.', correct: false, consequence: 'Aumenta a capacidade de escrita e leitura, mas não o tempo de retenção.' },
      ],
      explanation: [
        'O Kinesis Data Streams guarda os registros **na ordem de chegada**, por **24 horas por padrão**, e a retenção pode ir até **365 dias**. Vários consumidores leem o mesmo fluxo, cada um no seu ritmo, e **podem reler** o que ainda está retido. Com retenção de 3 dias ou mais, o antifraude reprocessa pelo próprio fluxo.',
        'Uma fila apaga o que foi consumido. O Firehose não retém. E mais shards não mudam a retenção.',
        '**Regra prática:** "reler os dados" e "vários consumidores" apontam para o Kinesis Data Streams; o tempo de releitura é a retenção do fluxo.',
      ],
    },
    {
      id: 'rv:ana.f06.m2.a2',
      kind: 'decision',
      title: 'Quantos shards para a escrita',
      prompt:
        'No pico, um fluxo do Kinesis Data Streams no **modo provisionado** recebe **3.000 registros por segundo**, de **2 KB** cada, cerca de 6 MB/s. Cada shard aceita até **1 MB/s ou 1.000 registros por segundo** de escrita. Quantos shards, no mínimo, a escrita exige?',
      concepts: [{ id: 'kds.streams' }],
      xp: 5,
      difficulty: 3,
      domain: 'd3',
      options: [
        { id: 'a', text: '3 shards', correct: false, consequence: 'Atende os 3.000 registros por segundo, mas não os 6 MB/s: cada shard aceita 1 MB/s.' },
        { id: 'b', text: '6 shards', correct: true, consequence: 'Pelo volume, 6 MB/s ÷ 1 MB/s = 6; pelos registros, bastariam 3. Vale o maior.' },
        { id: 'c', text: '2 shards', correct: false, consequence: 'Usa o limite de leitura (2 MB/s por shard); a conta pedida é a de escrita.' },
        { id: 'd', text: '12 shards', correct: false, consequence: 'Dobra a conta sem motivo: 6 shards já aceitam os 6 MB/s.' },
      ],
      explanation: [
        'Cada shard aceita, **na escrita**, até **1 MB/s ou 1.000 registros por segundo**, o que vier primeiro. Pelos registros, 3.000 ÷ 1.000 = 3 shards; pelo volume, 6 MB/s ÷ 1 MB/s = **6 shards**. O fluxo precisa atender aos dois limites, então vale o maior: 6.',
        'Três shards estouram o limite de volume. Dois usa o limite de leitura. Doze é o dobro do necessário.',
        '**Regra prática:** no modo provisionado, calcule os shards pelos registros e pelos MB/s e fique com o maior. No modo sob demanda, o fluxo escala sozinho.',
      ],
    },
    {
      id: 'rv:ana.f06.so-gravar-no-s3',
      kind: 'decision',
      title: 'Um fluxo que só serve para gravar no S3',
      prompt:
        'Uma equipe montou um Kinesis Data Streams e uma função Lambda própria que lê o fluxo e grava os eventos no S3, em lotes. **Ninguém mais lê o fluxo**, e uma latência de alguns minutos é aceita. A empresa quer **reduzir o código e as peças** para manter. Qual solução atende?',
      concepts: [{ id: 'kds.streams' }, { id: 'fh.delivery' }],
      xp: 5,
      difficulty: 1,
      domain: 'd4',
      options: [
        { id: 'a', text: 'Um Data Firehose direto no S3, no lugar das duas peças.', correct: true, consequence: 'O Firehose recebe, junta em lotes e entrega no S3, sem aplicação para escrever.' },
        { id: 'b', text: 'Aumentar a retenção do fluxo, para a função ler com mais calma.', correct: false, consequence: 'Mantém o fluxo e a função, as duas peças que a empresa quer eliminar.' },
        { id: 'c', text: 'Trocar o Kinesis Data Streams por um cluster do Amazon MSK.', correct: false, consequence: 'Troca um fluxo por um cluster Kafka, com o mesmo código de gravação.' },
        { id: 'd', text: 'Trocar a função por consumidores numa frota de instâncias EC2.', correct: false, consequence: 'Mais servidores para manter, para fazer o que o Firehose faz sozinho.' },
      ],
      explanation: [
        'O Kinesis Data Streams se justifica com **consumidores em tempo real** e **releitura**. Quando o único objetivo é **gravar no S3** com latência de minutos, o **Data Firehose** faz isso sem aplicação: junta os registros num buffer e entrega no S3, no Redshift, no OpenSearch e em outros destinos.',
        'Mais retenção, MSK ou EC2 mantêm ou aumentam as peças e o código.',
        '**Regra prática:** "entregar dados de streaming no S3 sem escrever código" é Firehose; Kinesis Data Streams só quando há leitores em tempo real.',
      ],
    },
    {
      id: 'rv:ana.f06.m1.a2',
      kind: 'decision',
      title: 'O painel parado nos horários calmos',
      prompt:
        'Um Data Firehose entrega os cliques de um aplicativo no S3 com buffer de **128 MiB ou 900 segundos**. Nos horários de pouco movimento, o painel fica **15 minutos sem dados novos**, mas o negócio quer no máximo **5 minutos** de atraso. Qual ajuste atende?',
      concepts: [{ id: 'fh.delivery' }],
      xp: 5,
      difficulty: 2,
      domain: 'd3',
      options: [
        { id: 'a', text: 'Aumentar o tamanho do buffer para o máximo.', correct: false, consequence: 'Com pouco movimento, um buffer maior demora ainda mais a encher.' },
        { id: 'b', text: 'Trocar o Firehose por um job diário do Glue.', correct: false, consequence: 'O painel passaria a receber dados uma vez por dia.' },
        { id: 'c', text: 'Reduzir o intervalo do buffer para 300 segundos.', correct: true, consequence: 'Nos horários calmos, a entrega passa a acontecer a cada 5 minutos, no máximo.' },
        { id: 'd', text: 'Pedir que o Firehose entregue cada clique assim que chegar.', correct: false, consequence: 'O Firehose trabalha em lotes; o menor intervalo do buffer é de 60 segundos.' },
      ],
      explanation: [
        'O Firehose junta os registros num **buffer** e entrega quando **o primeiro limite**, de tamanho ou de tempo, é atingido. Com pouco movimento, os 128 MiB demoram a encher, e vale o tempo de 900 segundos. **Reduzir o intervalo** para 300 segundos limita o atraso a 5 minutos.',
        'Um buffer maior atrasa mais. Um job diário atrasa um dia. E o Firehose não entrega evento a evento: na cópia para o S3, o intervalo vai de 60 a 900 segundos.',
        '**Regra prática:** atraso do Firehose em horário calmo se resolve pelo intervalo do buffer; em horário cheio, quem decide é o tamanho.',
      ],
    },
    {
      id: 'rv:ana.f06.mascarar-na-entrega',
      kind: 'decision',
      title: 'CPF nos eventos que vão para o S3',
      prompt:
        'Eventos de cadastro chegam por um Data Firehose e são gravados no data lake. A privacidade exige que o **CPF seja mascarado antes de o dado ser gravado** no S3. A equipe quer o **menor número de peças novas**, sem montar outra aplicação de streaming. Qual solução atende?',
      concepts: [{ id: 'fh.delivery' }],
      xp: 5,
      difficulty: 2,
      domain: 'd1',
      options: [
        { id: 'a', text: 'Gravar sem máscara e mascarar depois, com um job diário do Glue.', correct: false, consequence: 'O CPF ficaria gravado sem máscara até o job rodar, contra a exigência.' },
        { id: 'b', text: 'Uma Lambda de transformação no Firehose, que mascara o CPF.', correct: true, consequence: 'Os registros são transformados antes da entrega, e o S3 só recebe o CPF mascarado.' },
        { id: 'c', text: 'Criptografar o bucket de destino com SSE-KMS e chave própria.', correct: false, consequence: 'Protege o arquivo guardado, mas o CPF continua lá, sem máscara.' },
        { id: 'd', text: 'Um Kinesis Data Streams com consumidores próprios para mascarar.', correct: false, consequence: 'Funciona, mas acrescenta um fluxo e uma aplicação, o oposto do pedido.' },
      ],
      explanation: [
        'O **Data Firehose** pode chamar uma **função Lambda para transformar os registros antes da entrega**. A função mascara o CPF, e o S3 só recebe o dado já tratado, sem outra aplicação de streaming.',
        'Mascarar depois deixa o dado exposto por um tempo. Criptografia não é máscara. E um fluxo com consumidores próprios é mais peça e mais código.',
        '**Regra prática:** transformação simples no caminho do Firehose (mascarar, filtrar, converter CSV em JSON) é uma Lambda de transformação no próprio Firehose.',
      ],
    },
    {
      id: 'rv:ana.f06.m3.a1',
      kind: 'decision',
      title: 'Leituras de sensores em CSV',
      prompt:
        'Sensores enviam leituras em **CSV** por um Data Firehose, e o data lake precisa recebê-las em **Parquet**, prontas para o Athena, sem um job de conversão separado. O esquema já está numa tabela do Data Catalog. Quais configurações atendem? (Escolha DUAS.)',
      concepts: [{ id: 'fh.parquet' }],
      xp: 5,
      difficulty: 3,
      domain: 'd3',
      multiple: true,
      options: [
        { id: 'a', text: 'Uma Lambda de transformação no Firehose, que converte o CSV em JSON.', correct: true, consequence: 'A conversão de formato do Firehose parte de JSON; o CSV precisa virar JSON antes.' },
        { id: 'b', text: 'A conversão de formato do Firehose para Parquet, com o esquema do Data Catalog.', correct: true, consequence: 'O Firehose grava Parquet no S3 usando o esquema da tabela.' },
        { id: 'c', text: 'Ligar a conversão de CSV para Parquet direto no Firehose, sem transformação.', correct: false, consequence: 'O Firehose converte JSON; para CSV, uma Lambda transforma os registros em JSON antes.' },
        { id: 'd', text: 'Um crawler do Glue, que converte os arquivos entregues para Parquet.', correct: false, consequence: 'O crawler descobre esquemas e cria tabelas; não converte arquivos.' },
        { id: 'e', text: 'Um job do Glue a cada hora, convertendo o CSV entregue.', correct: false, consequence: 'Funciona, mas é o job de conversão separado que o pedido quer evitar.' },
      ],
      explanation: [
        'O Firehose **converte JSON em Parquet ou ORC** antes de gravar no S3, usando o **esquema de uma tabela do Data Catalog**. Para dados em **CSV**, uma **função Lambda** transforma os registros em JSON antes da conversão. Com as duas peças, o dado chega ao data lake em Parquet, pronto para o Athena.',
        'Não há conversão direta de CSV. O crawler não converte. E o job separado é o que se quer evitar.',
        '**Regra prática:** "dados de streaming em Parquet no S3" é a conversão de formato do Firehose; se a origem é CSV, some uma Lambda que gera JSON.',
      ],
    },
    {
      id: 'rv:ana.f06.particao-dinamica',
      kind: 'decision',
      title: 'Uma pasta por cliente no data lake',
      prompt:
        'Um Data Firehose grava no S3 os eventos de **centenas de clientes** misturados, em pastas só por hora. As consultas do Athena sempre filtram **por cliente** e leem todos os arquivos da hora. Cada evento traz o id do cliente. A empresa quer **reduzir o dado lido** sem criar um job de reorganização. Qual solução atende?',
      concepts: [{ id: 'fh.parquet' }],
      xp: 5,
      difficulty: 2,
      domain: 'd4',
      options: [
        { id: 'a', text: 'Um job do Glue que reorganiza os arquivos por cliente toda noite.', correct: false, consequence: 'Funciona, mas é o job de reorganização que o pedido quer evitar, e só vale no dia seguinte.' },
        { id: 'b', text: 'Um Data Firehose separado para cada cliente.', correct: false, consequence: 'Centenas de fluxos para manter, quando um só pode separar as pastas.' },
        { id: 'c', text: 'Reduzir o buffer do Firehose, para gerar arquivos menores.', correct: false, consequence: 'Arquivos menores e misturados continuam sendo lidos todos, e ficam lentos.' },
        { id: 'd', text: 'Partição dinâmica do Firehose, pelo id do cliente.', correct: true, consequence: 'Cada evento vai para a pasta do seu cliente, e o Athena lê só a pasta filtrada.' },
      ],
      explanation: [
        'Com a **partição dinâmica**, o Firehose grava cada registro **na pasta da chave**, usando **campos dos próprios registros**, como o id do cliente e a data. O dado já chega ao data lake particionado, e as consultas que filtram por cliente leem só a pasta dele.',
        'Um job noturno reorganiza tarde e é mais uma peça. Um Firehose por cliente multiplica a operação. E arquivos menores não reduzem o que é lido.',
        '**Regra prática:** particionar dados de streaming na entrega é a partição dinâmica do Firehose, pelas chaves dos registros.',
      ],
    },
    {
      id: 'rv:ana.f06.m2.a3',
      kind: 'decision',
      title: 'Aplicações que só falam Kafka',
      prompt:
        'Uma empresa tem um **Apache Kafka** no data center, e dezenas de aplicações publicam e consomem pela **API do Kafka**. Ela quer levar o Kafka para a AWS **sem reescrever as aplicações** e sem manter os servidores, e também **gravar alguns tópicos no S3** sem escrever consumidores próprios. Qual solução atende?',
      concepts: [{ id: 'msk.kafka' }],
      xp: 5,
      difficulty: 2,
      domain: 'd3',
      options: [
        { id: 'a', text: 'Kinesis Data Streams, com um Firehose gravando no S3.', correct: false, consequence: 'O Kinesis tem API própria: as aplicações teriam de ser reescritas.' },
        { id: 'b', text: 'Amazon MSK, com o MSK Connect levando os tópicos ao S3.', correct: true, consequence: 'As aplicações usam o Kafka de sempre, e os conectores gravam no S3 sem código próprio.' },
        { id: 'c', text: 'Kafka instalado em instâncias EC2, com um conector próprio.', correct: false, consequence: 'Mantém a API, mas a empresa continua cuidando dos servidores.' },
        { id: 'd', text: 'Amazon MSK, com consumidores escritos pela equipe para o S3.', correct: false, consequence: 'Resolve o Kafka gerenciado, mas exige escrever os consumidores que o pedido quer evitar.' },
      ],
      explanation: [
        'O **MSK** é o Apache Kafka gerenciado: a AWS cria e mantém o cluster, e as aplicações usam **a API do Kafka de sempre**. O **MSK Connect** roda conectores do Kafka Connect para levar dados ao S3, ao OpenSearch e a bancos, sem consumidores próprios.',
        'O Kinesis obrigaria a reescrever as aplicações. Kafka em EC2 mantém os servidores com a equipe. E consumidores próprios são o código que se quer evitar.',
        '**Regra prática:** "a empresa já usa Apache Kafka e quer um serviço gerenciado" é MSK. Sem esse requisito, o Kinesis Data Streams é mais simples.',
      ],
    },
    {
      id: 'rv:ana.f06.m3.a2',
      kind: 'decision',
      title: 'Dados de fora da empresa',
      prompt:
        'Um time de análise precisa trazer duas fontes para o data lake, **sem escrever código** de integração: uma **previsão do tempo** vendida por um fornecedor, por assinatura, e as **oportunidades cadastradas no Salesforce**, todo dia. Quais opções atendem? (Escolha DUAS.)',
      concepts: [{ id: 'ingest.third-party' }],
      xp: 5,
      difficulty: 1,
      domain: 'd3',
      multiple: true,
      options: [
        { id: 'a', text: 'AWS Data Exchange, para a previsão do tempo.', correct: true, consequence: 'Traz para a conta dados de outras organizações, por assinatura, sem entrega própria.' },
        { id: 'b', text: 'Amazon AppFlow, para as oportunidades do Salesforce.', correct: true, consequence: 'Traz dados de aplicações SaaS para o S3, sem código, de forma agendada.' },
        { id: 'c', text: 'Amazon Data Firehose, para as oportunidades do Salesforce.', correct: false, consequence: 'O Firehose recebe fluxos enviados a ele; não busca dados no Salesforce.' },
        { id: 'd', text: 'Amazon AppFlow, para a previsão do tempo do fornecedor.', correct: false, consequence: 'O AppFlow se liga a aplicações SaaS; dados vendidos por assinatura vêm pelo Data Exchange.' },
        { id: 'e', text: 'Um crawler do Glue apontado para o Salesforce.', correct: false, consequence: 'O crawler cataloga dados que já estão acessíveis; não traz dados do SaaS.' },
      ],
      explanation: [
        'O **Data Exchange** traz para a conta **dados de outras organizações**, por concessão ou assinatura no AWS Marketplace, sem montar entrega própria. O **AppFlow** traz dados de **aplicações SaaS**, como Salesforce e Zendesk, para o S3 ou o Redshift, sem código, sob demanda ou agendado.',
        'O Firehose recebe fluxos, não busca dados em SaaS. O AppFlow não é o canal de assinaturas de dados. E o crawler só cataloga.',
        '**Regra prática:** dados comprados ou compartilhados por terceiros, Data Exchange; dados de aplicações SaaS, AppFlow.',
      ],
    },
    {
      id: 'rv:ana.f06.m3.a3',
      kind: 'decision',
      title: 'Produtores numa VPC fechada',
      prompt:
        'Os serviços que enviam posições de veículos ao Kinesis Data Streams rodam numa **VPC sem saída para a internet**. A segurança exige **tráfego privado** e que uma credencial vazada de um produtor **só consiga gravar naquele fluxo**. Qual solução atende?',
      concepts: [{ id: 'ingest.secure' }],
      xp: 5,
      difficulty: 1,
      domain: 'd1',
      options: [
        { id: 'a', text: 'Um NAT Gateway e uma chave de acesso com acesso total ao Kinesis.', correct: false, consequence: 'O tráfego sai pela internet, e a chave permite muito mais do que gravar no fluxo.' },
        { id: 'b', text: 'Gravar direto no bucket do data lake, com leitura e escrita.', correct: false, consequence: 'O produtor passaria a poder ler o data lake inteiro.' },
        { id: 'c', text: 'Um endpoint de interface do Kinesis e uma role que só grava naquele fluxo.', correct: true, consequence: 'O tráfego fica privado, e a credencial do produtor não lê nem grava em outro lugar.' },
        { id: 'd', text: 'Um endpoint de interface do Kinesis e uma role com acesso total ao Kinesis.', correct: false, consequence: 'O tráfego fica privado, mas uma credencial vazada alcançaria todos os fluxos.' },
      ],
      explanation: [
        'O ponto de ingestão seguro combina **tráfego privado** e **mínimo privilégio**. Um **endpoint de interface** do Kinesis leva o tráfego pela rede privada, sem internet, e uma **role que só grava naquele fluxo** limita o estrago de uma credencial vazada. A criptografia em trânsito e no destino completa o desenho.',
        'NAT com chave ampla expõe o tráfego e as permissões. Gravar direto no bucket dá leitura demais. E o endpoint sozinho não limita a credencial.',
        '**Regra prática:** ingestão segura é role que só grava no destino, endpoint de VPC quando a origem está na AWS e criptografia em trânsito e em repouso.',
      ],
    },
  ],
}
