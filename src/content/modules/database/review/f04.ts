/**
 * Questões da Revisão da Fase 4 de Bancos de dados (DynamoDB: modelagem), no
 * formato do exame SAA-C03. Fatos conferidos em 21/10/2026 e 03/11/2026 (ver
 * docs/VERIFICACAO-DE-CONTEUDO.md). As empresas são fictícias.
 */
import type { ReviewSet } from '../../../../engine/types'

export const REVIEW_F04: ReviewSet = {
  phaseId: 'db.f04',
  questions: [
    {
      id: 'rv:db.f04.m1.a3',
      kind: 'decision',
      title: 'Um arquivo de 3 MB para cada partida',
      prompt:
        'Um jogo on-line guarda os dados de cada partida numa tabela do DynamoDB. O time quer guardar também o **replay** de cada partida, um arquivo de cerca de 3 MB, e abri-lo a partir da tela da partida. A solução precisa ser **simples e barata de manter**. Como guardar os replays?',
      concepts: [{ id: 'ddb.what' }],
      xp: 5,
      difficulty: 1,
      domain: 'd3',
      options: [
        { id: 'a', text: 'Num atributo binário do item da partida, junto com os outros dados.', correct: false, consequence: 'O item do DynamoDB tem no máximo 400 KB, somando nomes e valores dos atributos.' },
        { id: 'b', text: 'Num bucket do S3, com a chave do objeto guardada no item da partida.', correct: true, consequence: 'O item fica pequeno, e o arquivo é baixado direto do S3, que foi feito para objetos desse tamanho.' },
        { id: 'c', text: 'Em pedaços de 400 KB, cada um num item com a mesma chave de partição.', correct: false, consequence: 'Funciona com muito código, e cada leitura e gravação consome capacidade pelo arquivo inteiro.' },
        { id: 'd', text: 'Numa tabela separada só para replays, com um item por arquivo.', correct: false, consequence: 'O limite de 400 KB vale para qualquer tabela; separar não muda o tamanho máximo do item.' },
      ],
      explanation: [
        'O item do DynamoDB tem no máximo **400 KB**. O padrão para arquivos grandes é guardá-los no **S3** e manter no item só a referência, como a chave do objeto. O item continua pequeno e barato de ler, e o arquivo é baixado direto do S3.',
        'Um atributo binário ou uma tabela separada esbarram no mesmo limite. Partir o arquivo em itens funciona, mas exige código para montar e desmontar e paga capacidade pelo arquivo inteiro.',
        '**Regra prática:** no DynamoDB, guarde dados e referências; arquivos vão para o S3.',
      ],
    },
    {
      id: 'rv:db.f04.m1.a1:session',
      kind: 'decision',
      title: 'Cargas candidatas a sair do banco relacional',
      prompt:
        'Um estúdio de jogos quer tirar do seu banco relacional as cargas que mais ganham com um banco **sem servidor, com milissegundos em qualquer escala**. As cargas candidatas estão abaixo. Quais combinam com o DynamoDB? (Escolha DUAS.)',
      concepts: [{ id: 'ddb.what' }],
      xp: 5,
      difficulty: 1,
      domain: 'd3',
      multiple: true,
      options: [
        { id: 'a', text: 'O estado de cada partida, gravado e lido pelo id da partida.', correct: true, consequence: 'Leitura e gravação por chave, em milissegundos, é o caso ideal do DynamoDB.' },
        { id: 'b', text: 'O relatório financeiro que cruza compras, jogadores e campanhas.', correct: false, consequence: 'O DynamoDB não faz junções entre tabelas; relatórios que cruzam dados pedem um banco relacional ou analítico.' },
        { id: 'c', text: 'Os inventários, com atributos diferentes para cada tipo de item.', correct: true, consequence: 'Fora a chave primária, a tabela não tem esquema fixo: cada item guarda os atributos de que precisa.' },
        { id: 'd', text: 'As consultas livres em SQL que os analistas escrevem a cada dia.', correct: false, consequence: 'No DynamoDB, o acesso é desenhado antes pelas chaves e índices; consultas livres não combinam.' },
        { id: 'e', text: 'O cadastro com chaves estrangeiras entre jogadores, clãs e torneios.', correct: false, consequence: 'O DynamoDB não garante integridade relacional entre tabelas.' },
      ],
      explanation: [
        'O **DynamoDB** é ideal para acesso por chave em qualquer escala, como o estado de uma partida, e para dados **sem esquema fixo**, como inventários com atributos diferentes por tipo de item.',
        'Ele não faz junções, não atende consultas livres em SQL e não garante integridade relacional entre tabelas. Essas cargas ficam num banco relacional ou analítico.',
        '**Regra prática:** "chave-valor", "esquema flexível" e "milissegundos em qualquer escala" apontam para o DynamoDB; "junções", "SQL livre" e "integridade relacional" o tornam distrator.',
      ],
    },
    {
      id: 'rv:db.f04.m1.a2',
      kind: 'decision',
      title: 'As 20 partidas mais recentes de um jogador',
      prompt:
        'A tabela de partidas tem chave de partição `jogadorId` e chave de ordenação `dataHora`. Cada jogador tem, em média, 3.000 partidas guardadas. A tela de histórico mostra **as 20 mais recentes** de um jogador, e a equipe quer **consumir a menor capacidade de leitura**. Como buscar?',
      concepts: [{ id: 'ddb.primary-key' }],
      xp: 5,
      difficulty: 2,
      domain: 'd3',
      options: [
        { id: 'a', text: 'Scan da tabela com filtro por jogadorId e limite de 20 itens.', correct: false, consequence: 'A Scan avalia a tabela inteira e cobra por tudo o que avaliou, não pelo que devolveu.' },
        { id: 'b', text: 'Query por jogadorId, decrescente por dataHora, com limite de 20.', correct: true, consequence: 'Lê só as 20 partidas mais recentes do jogador, já na ordem certa.' },
        { id: 'c', text: 'Query por jogadorId e ordenação das 3.000 partidas na aplicação.', correct: false, consequence: 'Funciona, mas lê e paga as 3.000 partidas para mostrar 20.' },
        { id: 'd', text: 'Um índice global com chave de partição dataHora, ordenado por jogador.', correct: false, consequence: 'Cria um índice com capacidade própria para um acesso que a chave da tabela já resolve.' },
      ],
      explanation: [
        'Com chave composta, os itens de um jogador ficam juntos e **ordenados pela chave de ordenação**. A **Query** por `jogadorId`, em ordem decrescente (`ScanIndexForward` falso) e com limite de 20, lê só as 20 partidas mais recentes.',
        'A Scan avalia a tabela toda. Ler todas as partidas do jogador e ordenar na aplicação paga 3.000 itens. Um índice global é desnecessário e ainda consome capacidade a cada gravação.',
        '**Regra prática:** no acesso principal, a chave deve permitir uma Query; Scan com filtro num acesso frequente é mais cara e mais lenta.',
      ],
    },
    {
      id: 'rv:db.f04.chave-dos-pedidos',
      kind: 'decision',
      title: 'A chave da tabela de pedidos',
      prompt:
        'Uma loja vai criar a tabela de pedidos no DynamoDB, com milhões de clientes. O acesso principal é **listar os pedidos de um cliente, do mais novo para o mais antigo**, e o tráfego precisa **se espalhar bem** pelas partições. Qual chave primária atende?',
      concepts: [{ id: 'ddb.primary-key' }, { id: 'ddb.hot-partition' }],
      xp: 5,
      difficulty: 2,
      domain: 'd3',
      options: [
        { id: 'a', text: 'Chave de partição pedidoId, sem chave de ordenação.', correct: false, consequence: 'Cada pedido fica numa chave própria: listar os de um cliente exigiria Scan ou um índice extra.' },
        { id: 'b', text: 'Chave de partição dataPedido e de ordenação clienteId.', correct: false, consequence: 'Todos os pedidos do dia caem no mesmo valor de chave, e listar por cliente não vira uma Query.' },
        { id: 'c', text: 'Chave de partição clienteId e de ordenação dataPedido.', correct: true, consequence: 'Uma Query por cliente traz os pedidos ordenados, e milhões de clientes espalham o tráfego.' },
        { id: 'd', text: 'Chave de partição status e de ordenação dataPedido.', correct: false, consequence: 'Poucos valores de status concentram o tráfego em poucas partições e não listam por cliente.' },
      ],
      explanation: [
        'A **chave de partição** `clienteId` agrupa os pedidos de cada cliente e tem milhões de valores, o que espalha o tráfego. A **chave de ordenação** `dataPedido` mantém os pedidos ordenados, e uma Query em ordem decrescente atende a tela.',
        'Só `pedidoId` não permite listar por cliente. A data e o status como chave de partição têm poucos valores e concentram o tráfego.',
        '**Regra prática:** a chave de partição vem do "de quem" do acesso principal, com muitos valores; a chave de ordenação, do "em que ordem".',
      ],
    },
    {
      id: 'rv:db.f04.m2.a3',
      kind: 'decision',
      title: 'Capacidade para gravações dentro de transações',
      prompt:
        'Uma carteira digital grava **25 itens por segundo**, de **2,5 KB** cada, sempre **dentro de transações** do DynamoDB. A tabela é provisionada, e a equipe quer reservar a **capacidade de escrita mínima** que atende essa carga sem throttling. Quantas unidades de escrita (WCU) provisionar?',
      concepts: [{ id: 'ddb.capacity-units' }],
      xp: 5,
      difficulty: 2,
      domain: 'd4',
      options: [
        { id: 'a', text: '75 WCU, porque 2,5 KB arredonda para 3 KB.', correct: false, consequence: 'Esquece que a escrita transacional custa o dobro da comum.' },
        { id: 'b', text: '50 WCU, porque a transação dobra as 25 gravações.', correct: false, consequence: 'Esquece que a unidade de escrita cobre até 1 KB: um item de 2,5 KB consome 3.' },
        { id: 'c', text: '25 WCU, porque cada transação conta como uma única escrita comum.', correct: false, consequence: 'Ignora o tamanho do item e o custo da transação.' },
        { id: 'd', text: '150 WCU, porque cada gravação consome 3 unidades em dobro.', correct: true, consequence: '2,5 KB arredonda para 3 KB (3 unidades), e a transação dobra: 6 por gravação, 150 por segundo.' },
      ],
      explanation: [
        'Uma unidade de escrita cobre uma gravação de até **1 KB**, com o tamanho **arredondado para cima**: 2,5 KB vira 3 KB, ou 3 unidades. Na **transação**, a escrita custa o **dobro**: 6 unidades por item. Com 25 itens por segundo, são **150 WCU**.',
        'As outras contas esquecem o arredondamento por KB, o dobro da transação ou os dois.',
        '**Regra prática:** escrita em blocos de 1 KB, leitura em blocos de 4 KB, sempre arredondando para cima; transação dobra as duas, e leitura eventual custa a metade da forte.',
      ],
    },
    {
      id: 'rv:db.f04.contador-no-item-grande',
      kind: 'decision',
      title: 'Um contador que custa caro para atualizar',
      prompt:
        'Cada item de produto numa tabela do DynamoDB tem **12 KB**, com descrição, fotos referenciadas e especificações. Um atributo `visualizacoes` é incrementado com UpdateItem a cada abertura da página, **100 vezes por segundo** no total. A conta de escrita veio muito acima do esperado. Qual mudança **reduz o custo de escrita**?',
      concepts: [{ id: 'ddb.capacity-units' }],
      xp: 5,
      difficulty: 3,
      domain: 'd4',
      options: [
        { id: 'a', text: 'Guardar o contador num item pequeno separado, com a chave do produto.', correct: true, consequence: 'Cada incremento passa a consumir 1 unidade em vez de 12.' },
        { id: 'b', text: 'Trocar o UpdateItem por PutItem, gravando só o atributo do contador.', correct: false, consequence: 'O PutItem substitui o item inteiro: o produto perderia os outros atributos.' },
        { id: 'c', text: 'Ler o produto com leitura eventual antes de cada incremento.', correct: false, consequence: 'Mexe no custo da leitura, não no da escrita, que é onde está o problema.' },
        { id: 'd', text: 'Criar um índice global com o atributo visualizacoes como chave.', correct: false, consequence: 'Cada incremento passaria a consumir capacidade também no índice: a conta subiria.' },
      ],
      explanation: [
        'O **UpdateItem cobra pelo tamanho do item inteiro** (o maior entre antes e depois), mesmo mudando um único atributo. Cada incremento num item de 12 KB consome 12 unidades: 1.200 WCU por segundo. Num **item pequeno separado**, cada incremento consome 1 unidade.',
        'O PutItem substituiria o produto inteiro. Leitura eventual não muda a escrita. Um índice global com o contador como chave somaria escritas.',
        '**Regra prática:** atributos que mudam muito, como contadores, ficam em itens pequenos; a escrita no DynamoDB cobra o item inteiro.',
      ],
    },
    {
      id: 'rv:db.f04.m2.a2',
      kind: 'decision',
      title: 'Ranking lido com leitura forte',
      prompt:
        'A tela de ranking de um jogo lê **500 perfis por segundo**, de **6 KB** cada, com leitura **fortemente consistente**. O ranking aceita mostrar dados de **alguns segundos atrás**. A tabela é provisionada, e a empresa quer **reduzir a capacidade de leitura** necessária. Qual mudança atende, e com quantas RCU?',
      concepts: [{ id: 'ddb.consistency' }, { id: 'ddb.capacity-units' }],
      xp: 5,
      difficulty: 2,
      domain: 'd4',
      options: [
        { id: 'a', text: 'Usar leitura eventualmente consistente: de 1.000 para 500 RCU.', correct: true, consequence: 'Cada leitura de 6 KB passa de 2 unidades para 1, e o ranking tolera o atraso.' },
        { id: 'b', text: 'Usar leitura transacional: de 1.000 para 500 RCU.', correct: false, consequence: 'A leitura transacional custa o dobro da forte: subiria para 2.000 RCU.' },
        { id: 'c', text: 'Usar leitura eventualmente consistente: de 750 para 375 RCU.', correct: false, consequence: 'Conta 6 KB como 1,5 bloco; os tamanhos são arredondados para 8 KB, ou 2 blocos de 4 KB.' },
        { id: 'd', text: 'Manter a leitura forte e provisionar 3.000 RCU, uma por KB.', correct: false, consequence: 'A unidade de leitura cobre até 4 KB, não 1 KB; é a escrita que conta por KB.' },
      ],
      explanation: [
        'Uma unidade de leitura é uma leitura **forte** de até **4 KB**, ou duas **eventuais**. Um perfil de 6 KB arredonda para 8 KB: 2 unidades na leitura forte e 1 na eventual. Como o ranking aceita alguns segundos de atraso, a **leitura eventual** reduz de 1.000 para **500 RCU**.',
        'A leitura transacional custa o dobro da forte. Contar 6 KB como 1,5 bloco esquece o arredondamento. E blocos de 1 KB valem para a escrita.',
        '**Regra prática:** se a tela tolera dados de alguns segundos atrás, a leitura eventual corta a capacidade de leitura pela metade.',
      ],
    },
    {
      id: 'rv:db.f04.m2.a4',
      kind: 'decision',
      title: 'O apelido novo que não aparece',
      prompt:
        'Um jogo tem a tabela de perfis com chave de partição `jogadorId` e um índice global por `apelido`. Depois que o jogador troca o apelido, a página de perfil, que **já tem o jogadorId**, consulta o índice global e às vezes mostra o apelido antigo. A página precisa **sempre mostrar a última gravação**. O que fazer?',
      concepts: [{ id: 'ddb.consistency' }, { id: 'ddb.indexes' }],
      xp: 5,
      difficulty: 2,
      domain: 'd3',
      options: [
        { id: 'a', text: 'Pedir leitura fortemente consistente na consulta ao índice global.', correct: false, consequence: 'Índices globais só têm leitura eventual; o pedido é recusado.' },
        { id: 'b', text: 'Adicionar à tabela um índice local por apelido, com leitura forte.', correct: false, consequence: 'Índices locais só podem ser criados junto com a tabela.' },
        { id: 'c', text: 'Ler o perfil na tabela, por jogadorId, com leitura forte.', correct: true, consequence: 'A tabela aceita leitura forte, e a página já tem a chave primária para isso.' },
        { id: 'd', text: 'Trocar a tabela para o modo sob demanda, que lê sempre o último valor.', correct: false, consequence: 'O modo de capacidade não muda a consistência das leituras.' },
      ],
      explanation: [
        'A **leitura fortemente consistente** sempre traz a última gravação confirmada, mas só existe na **tabela** e nos **índices locais**. Índices globais só têm leitura eventual. Como a página já tem o `jogadorId`, ela lê o perfil na tabela, com leitura forte.',
        'O índice global não aceita leitura forte. Um índice local não pode ser adicionado a uma tabela existente. O modo de capacidade não muda a consistência.',
        '**Regra prática:** "ler sempre a última gravação" é leitura forte na tabela ou num índice local; índices globais, streams e o DAX não oferecem leitura forte.',
      ],
    },
    {
      id: 'rv:db.f04.m3.a1',
      kind: 'decision',
      title: 'Throttling com capacidade sobrando',
      prompt:
        'Uma tabela de eventos de aplicativo usa **a data do dia** como chave de partição. Ela recebe **2.500 gravações por segundo** de itens de 1 KB, e as gravações sofrem **throttling**, embora a tabela tenha capacidade de sobra no total. A equipe quer **eliminar o throttling** de forma duradoura. O que fazer?',
      concepts: [{ id: 'ddb.hot-partition' }],
      xp: 5,
      difficulty: 2,
      domain: 'd3',
      options: [
        { id: 'a', text: 'Dobrar a capacidade de escrita provisionada da tabela.', correct: false, consequence: 'O limite é por partição: todas as gravações do dia continuam caindo no mesmo valor de chave.' },
        { id: 'b', text: 'Trocar a tabela para o modo de capacidade sob demanda.', correct: false, consequence: 'O sob demanda também tem o limite por partição; o valor do dia continua concentrando o tráfego.' },
        { id: 'c', text: 'Trocar a chave de partição pelo id do dispositivo de origem.', correct: true, consequence: 'Com milhões de valores, as gravações se espalham pelas partições.' },
        { id: 'd', text: 'Criar um índice global com a data do dia como chave de ordenação.', correct: false, consequence: 'O índice soma escritas e não muda a chave de partição da tabela.' },
      ],
      explanation: [
        'Cada partição entrega no máximo **1.000 unidades de escrita** por segundo. Com a data como chave, **todas as gravações do dia caem no mesmo valor**: 2.500 unidades numa só partição. Uma chave com **muitos valores e tráfego distribuído**, como o id do dispositivo, espalha a carga.',
        'Mais capacidade na tabela e o modo sob demanda não mudam o limite por partição. Um índice extra só soma escritas.',
        '**Regra prática:** "throttling numa tabela com capacidade sobrando" é partição quente. Corrija a chave de partição ou espalhe o valor quente com write sharding.',
      ],
    },
    {
      id: 'rv:db.f04.boss.a2',
      kind: 'decision',
      title: 'Um ranking mundial atualizado a cada partida',
      prompt:
        'O produto quer um ranking dos 100 melhores jogadores do mundo, atualizado a cada partida. A proposta é um índice global com chave de partição fixa `"ranking"` e chave de ordenação `pontuacao`, que receberia as **3.000 gravações por segundo** das partidas. A equipe precisa **avaliar o risco** antes de aprovar. Qual é a avaliação correta?',
      concepts: [{ id: 'ddb.hot-partition' }, { id: 'ddb.indexes' }],
      xp: 5,
      difficulty: 3,
      domain: 'd3',
      options: [
        { id: 'a', text: 'Sem risco: o índice global distribui as gravações por conta própria.', correct: false, consequence: 'O índice também é dividido por chave de partição, e um valor fixo vai para uma só partição.' },
        { id: 'b', text: 'Sem risco, se o índice for criado junto com a tabela, como local.', correct: false, consequence: 'Um índice local usa a chave de partição da tabela; não serve para um ranking de todos os jogadores.' },
        { id: 'c', text: 'Risco: as gravações caem num só valor de chave e passam do limite.', correct: true, consequence: 'A equipe espalha o ranking em vários valores de chave e junta os resultados na leitura.' },
        { id: 'd', text: 'Risco: o índice global não aceita número como chave de ordenação.', correct: false, consequence: 'Número é um tipo aceito para chave de ordenação; o problema é a chave de partição fixa.' },
      ],
      explanation: [
        'O índice global também é dividido em partições pela sua chave de partição. Com um **valor fixo**, todas as 3.000 gravações por segundo vão para **uma só partição**, que entrega no máximo 1.000 unidades de escrita. Saídas: **write sharding**, espalhando o ranking em vários valores de chave e juntando na leitura, ou calcular o ranking fora do caminho de cada gravação.',
        'O índice não distribui sozinho um valor fixo. Um índice local tem a chave de partição da tabela. E número é aceito como chave.',
        '**Regra prática:** chave de partição com um só valor, na tabela ou num índice global, é partição quente garantida.',
      ],
    },
    {
      id: 'rv:db.f04.m3.a3',
      kind: 'decision',
      title: 'Partidas ordenadas por pontuação com leitura forte',
      prompt:
        'Uma tabela de partidas em produção tem chave de partição `jogadorId` e de ordenação `dataHora`. Uma tela nova precisa das partidas de um jogador **ordenadas por pontuação**, com **leitura fortemente consistente**, por exigência de um torneio. Qual solução atende?',
      concepts: [{ id: 'ddb.indexes' }],
      xp: 5,
      difficulty: 3,
      domain: 'd3',
      options: [
        { id: 'a', text: 'Adicionar à tabela atual um índice local com ordenação por pontuação.', correct: false, consequence: 'Índices locais só podem ser criados junto com a tabela.' },
        { id: 'b', text: 'Criar uma tabela nova com esse índice local e migrar os dados.', correct: true, consequence: 'O índice local nasce com a tabela e aceita leitura forte com a mesma chave de partição.' },
        { id: 'c', text: 'Criar um índice global com partição jogadorId e ordenação pontuação.', correct: false, consequence: 'Ordena como pedido, mas índices globais só têm leitura eventual.' },
        { id: 'd', text: 'Fazer uma Scan com leitura forte e ordenar na aplicação.', correct: false, consequence: 'Avalia a tabela inteira a cada abertura da tela e cobra por tudo.' },
      ],
      explanation: [
        'A mesma chave de partição com **outra ordenação** e **leitura forte** é o caso do **índice local**. Mas ele **só pode ser criado junto com a tabela**. Numa tabela que já existe, o caminho é criar uma tabela nova com o índice local e migrar os dados.',
        'O índice global atende a ordenação, mas só lê de forma eventual. A Scan é cara e lenta.',
        '**Regra prática:** consultar por outro atributo numa tabela que já existe é índice global; leitura forte com a mesma chave de partição é índice local, só na criação da tabela.',
      ],
    },
    {
      id: 'rv:db.f04.indices-na-conta',
      kind: 'decision',
      title: 'A conta de escrita depois de três índices',
      prompt:
        'Uma tabela provisionada de pedidos recebia 400 gravações por segundo e precisava de 400 WCU. O time criou **três índices globais**, cada um com atributos que mudam em toda gravação, e a conta de escrita **quase quadruplicou**. O financeiro quer entender **de onde veio o custo**. Qual é a explicação?',
      concepts: [{ id: 'ddb.indexes' }],
      xp: 5,
      difficulty: 2,
      domain: 'd4',
      options: [
        { id: 'a', text: 'Os índices globais dobram o custo de leitura da tabela.', correct: false, consequence: 'A conta que subiu foi a de escrita; leitura não entra nesse cálculo.' },
        { id: 'b', text: 'Cada índice global consome escrita própria nas gravações.', correct: true, consequence: 'Cada gravação passa a ser cobrada na tabela e em cada um dos três índices.' },
        { id: 'c', text: 'Os índices globais forçam toda gravação a ser transacional.', correct: false, consequence: 'As gravações continuam comuns; o custo vem da atualização de cada índice.' },
        { id: 'd', text: 'Com índices globais, a unidade de escrita passa a cobrir 4 KB.', correct: false, consequence: 'A unidade de escrita continua cobrindo 1 KB.' },
      ],
      explanation: [
        'O DynamoDB mantém os índices atualizados sozinho, e essas atualizações **consomem capacidade de escrita do índice**, separada da tabela. Como cada gravação muda atributos dos três índices, ela é cobrada **quatro vezes**: na tabela e em cada índice.',
        'Os índices não mudam a leitura da tabela, não tornam as gravações transacionais nem mudam o tamanho da unidade de escrita.',
        '**Regra prática:** cada índice global soma capacidade de escrita; crie só os que atendem acessos reais e projete só os atributos necessários.',
      ],
    },
    {
      id: 'rv:db.f04.m4.a1',
      kind: 'decision',
      title: 'Tabela parada na semana e cheia no fim de semana',
      prompt:
        'A tabela de torneios de um jogo chega a **2.000 leituras e 500 gravações por segundo** nos fins de semana, mas passa a semana quase parada: a média do mês é de 40 leituras e 10 gravações por segundo. A empresa quer o **menor custo**, sem throttling nos torneios. Qual configuração atende?',
      concepts: [{ id: 'ddb.capacity-modes' }],
      xp: 5,
      difficulty: 1,
      domain: 'd4',
      options: [
        { id: 'a', text: 'Provisionado com a capacidade do pico do fim de semana.', correct: false, consequence: 'Paga a capacidade do pico o mês inteiro, com a tabela parada quase o tempo todo.' },
        { id: 'b', text: 'Provisionado com a capacidade média do mês.', correct: false, consequence: 'Barato, mas os torneios sofreriam throttling com 50 vezes a média.' },
        { id: 'c', text: 'Capacidade reservada para o pico do fim de semana.', correct: false, consequence: 'A reserva é um compromisso com capacidade provisionada, paga o tempo todo, usada ou não.' },
        { id: 'd', text: 'Modo de capacidade sob demanda.', correct: true, consequence: 'Paga só as requisições feitas e acompanha os picos sem planejamento.' },
      ],
      explanation: [
        'No **sob demanda**, cada requisição é cobrada, e a tabela acompanha o tráfego sem planejamento. Sem tráfego, não há cobrança de leitura nem escrita. Para uma carga parada na maior parte do tempo e com picos, é o mais barato.',
        'Provisionar para o pico paga capacidade ociosa; para a média, gera throttling. A capacidade reservada vale para o modo provisionado e é paga o tempo todo.',
        '**Regra prática:** "picos esporádicos", "tráfego imprevisível" ou "aplicação nova" apontam para o sob demanda.',
      ],
    },
    {
      id: 'rv:db.f04.m4.a2',
      kind: 'decision',
      title: 'Tráfego alto e quase constante o dia todo',
      prompt:
        'A tabela de perfis de um aplicativo recebe em média **1.800 leituras e 450 gravações por segundo**, com pico de 2.000 e 500: o tráfego é **alto e quase constante**, e o histórico de um ano é previsível. Hoje a tabela está no modo sob demanda. A empresa quer **reduzir o custo** sem throttling. O que fazer?',
      concepts: [{ id: 'ddb.capacity-modes' }],
      xp: 5,
      difficulty: 2,
      domain: 'd4',
      options: [
        { id: 'a', text: 'Manter o sob demanda, que é sempre o modo mais barato.', correct: false, consequence: 'Com uso constante, pagar cada requisição sai mais caro que reservar a capacidade aproveitada o tempo todo.' },
        { id: 'b', text: 'Trocar para provisionado com auto scaling, com meta de 70% de uso.', correct: true, consequence: 'A capacidade reservada é aproveitada quase o tempo todo, e o auto scaling cobre as variações.' },
        { id: 'c', text: 'Trocar para provisionado fixo com a capacidade média, sem nenhuma folga.', correct: false, consequence: 'Os momentos acima da média sofreriam throttling.' },
        { id: 'd', text: 'Agendar a troca de modo a cada hora, conforme o tráfego.', correct: false, consequence: 'Do provisionado para o sob demanda são no máximo quatro trocas em 24 horas.' },
      ],
      explanation: [
        'Com tráfego **alto, constante e previsível**, o **provisionado** sai mais barato, porque a capacidade reservada é aproveitada quase o tempo todo. O **auto scaling** ajusta a capacidade por uma meta de uso; a AWS recomenda **70%**.',
        'O sob demanda é ótimo para picos, não para carga constante. Provisionar a média sem folga gera throttling. E as trocas do provisionado para o sob demanda são limitadas a quatro em 24 horas.',
        '**Regra prática:** "tráfego alto e previsível" com foco em custo aponta para provisionado com auto scaling.',
      ],
    },
  ],
}
