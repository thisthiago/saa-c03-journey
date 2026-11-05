/**
 * Questões da Revisão da Fase 4 de Arquitetura e otimização (alto
 * desempenho), no formato do exame SAA-C03. Fatos conferidos em
 * docs.aws.amazon.com (ver docs/VERIFICACAO-DE-CONTEUDO.md). As empresas são
 * fictícias.
 */
import type { ReviewSet } from '../../../../engine/types'

export const REVIEW_F04: ReviewSet = {
  phaseId: 'arq.f04',
  questions: [
    {
      id: 'rv:arq.f04.m1.a1:p4',
      kind: 'decision',
      title: 'Agregações que levam horas',
      prompt:
        'Uma rede de academias guarda **três anos de check-ins** no mesmo PostgreSQL do RDS que atende o aplicativo. Os relatórios mensais **agregam bilhões de linhas** e levam horas, e o time propõe uma instância maior "porque todo mundo conhece PostgreSQL". Seguindo o armazenamento feito para o acesso, qual mudança atende?',
      concepts: [{ id: 'perf.purpose-built' }],
      xp: 5,
      difficulty: 2,
      domain: 'd3',
      options: [
        { id: 'a', text: 'Trocar o RDS por uma instância com o dobro de memória.', correct: false, consequence: 'Mantém um banco transacional fazendo análise, por costume do time.' },
        { id: 'b', text: 'Levar o histórico ao Amazon Redshift para os relatórios.', correct: true, consequence: 'O armazenamento colunar faz as agregações em minutos, longe do aplicativo.' },
        { id: 'c', text: 'Mover os check-ins para uma tabela do DynamoDB por chave.', correct: false, consequence: 'Acesso por chave não serve a agregações sobre bilhões de linhas.' },
        { id: 'd', text: 'Guardar os check-ins antigos no ElastiCache para consulta.', correct: false, consequence: 'Cache em memória não é lugar de três anos de histórico analítico.' },
      ],
      explanation: [
        'A boa prática **PERF03-BP01** (risco alto) é escolher o armazenamento **pelo dado e pelo acesso**: OLTP ou OLAP, estrutura, proporção de leituras. Agregações sobre bilhões de linhas são **OLAP**, e o **Redshift**, colunar, é feito para isso. Ficar num só tipo de banco porque o time já o conhece é um antipadrão citado pela AWS.',
        'Uma instância maior insiste no banco errado para o acesso. DynamoDB e ElastiCache atendem acessos por chave e em memória, não relatórios analíticos.',
        '**Regra prática:** relatório pesado num banco transacional pede um armazenamento analítico; a tecnologia segue o acesso, não a experiência do time.',
      ],
    },
    {
      id: 'rv:arq.f04.m1.a2',
      kind: 'decision',
      title: 'Um banco para tudo',
      prompt:
        'Uma loja guarda **tudo** num PostgreSQL: pedidos com junções entre itens e pagamentos, **carrinhos** lidos e gravados pela chave do cliente milhares de vezes por segundo e **notas fiscais em PDF**. O banco virou gargalo. Seguindo a boa prática do armazenamento feito para o acesso, quais mudanças atendem? (Escolha DUAS.)',
      concepts: [{ id: 'perf.purpose-built' }],
      xp: 5,
      difficulty: 2,
      domain: 'd3',
      multiple: true,
      options: [
        { id: 'a', text: 'Guardar as notas em PDF no S3, com só a referência no banco.', correct: true, consequence: 'Arquivos grandes saem do banco para o armazenamento de objetos.' },
        { id: 'b', text: 'Levar os pedidos, com as junções, para um banco chave-valor.', correct: false, consequence: 'Pedidos com junções e integridade combinam com o relacional.' },
        { id: 'c', text: 'Guardar os carrinhos numa tabela do DynamoDB, pela chave do cliente.', correct: true, consequence: 'Acesso por chave em alto volume é o caso do DynamoDB.' },
        { id: 'd', text: 'Trocar o PostgreSQL por uma instância maior, que o time já conhece.', correct: false, consequence: 'Cada tipo de acesso continua disputando o mesmo recurso.' },
        { id: 'e', text: 'Pôr os relatórios de vendas no ElastiCache para acelerar.', correct: false, consequence: 'Cache em memória não substitui o armazenamento analítico.' },
      ],
      explanation: [
        'Cada dado vai para o armazenamento que combina com o acesso dele: **objetos grandes no S3**, **acesso por chave em alto volume no DynamoDB** e o que precisa de junções e integridade referencial no **relacional**. Assim cada uso deixa de disputar o mesmo banco.',
        'Pedidos com junções perdem com um modelo por chave. Uma instância maior é o antipadrão de ficar num só tipo de banco por costume. ElastiCache é cache, não lugar de relatório.',
        '**Regra prática:** banco sobrecarregado por usos diferentes pede separar cada uso no armazenamento adequado, não uma instância maior.',
      ],
    },
    {
      id: 'rv:arq.f04.m2.a2:p2',
      kind: 'decision',
      title: 'A mesma resposta a cada chamada',
      prompt:
        'Uma API REST no **API Gateway** chama uma função Lambda que consulta o DynamoDB para devolver os detalhes de cada jogo. A resposta é **igual para todos** e muda **uma vez por hora**, mas a API recebe milhões de chamadas. O time quer **reduzir as chamadas ao backend** com o **menor esforço**. Qual mudança atende?',
      concepts: [{ id: 'perf.cache-layers' }],
      xp: 5,
      difficulty: 2,
      domain: 'd3',
      options: [
        { id: 'a', text: 'Cache do estágio da API, com TTL de uma hora.', correct: true, consequence: 'O API Gateway responde do cache, e o Lambda é chamado uma vez por hora.' },
        { id: 'b', text: 'Pôr o DAX na frente do DynamoDB.', correct: false, consequence: 'A tabela responde mais rápido, mas o Lambda continua sendo chamado sempre.' },
        { id: 'c', text: 'Aumentar a concorrência reservada da função Lambda.', correct: false, consequence: 'Aguenta mais chamadas, mas não reduz nenhuma.' },
        { id: 'd', text: 'Guardar a resposta no ElastiCache dentro da função.', correct: false, consequence: 'Exige código novo, e cada chamada ainda executa a função.' },
      ],
      explanation: [
        'O cache funciona em **camadas**, e cada uma tira carga da seguinte. A camada certa é a mais **perto do usuário** onde a resposta se repete. Aqui, a resposta da API é igual para todos: o **cache do estágio do API Gateway** responde direto, por um TTL, sem chamar o Lambda nem o DynamoDB.',
        'DAX e ElastiCache ficam atrás da função, que continua sendo executada. Mais concorrência não reduz chamadas.',
        '**Regra prática:** escolha a camada de cache pelo que se repete: estático no CloudFront, resposta de API no API Gateway, consulta ao banco no ElastiCache ou no DAX.',
      ],
    },
    {
      id: 'rv:arq.f04.m2.a2:p4',
      kind: 'decision',
      title: 'Microssegundos sem mudar o código',
      prompt:
        'Uma loja guarda o **estoque** numa tabela do DynamoDB, lida milhares de vezes por segundo nos mesmos itens durante as promoções. As leituras levam milissegundos, e a meta é **microssegundos**, **sem reescrever** a lógica de acesso da aplicação, que usa a API do DynamoDB. Qual solução atende?',
      concepts: [{ id: 'perf.cache-layers' }],
      xp: 5,
      difficulty: 3,
      domain: 'd3',
      options: [
        { id: 'a', text: 'Um cluster do ElastiCache, com a aplicação cuidando do cache.', correct: false, consequence: 'Funciona, mas exige escrever a lógica de cache na aplicação.' },
        { id: 'b', text: 'Uma distribuição do CloudFront na frente da tabela.', correct: false, consequence: 'O CloudFront não fica na frente de uma tabela do DynamoDB.' },
        { id: 'c', text: 'O DynamoDB Accelerator (DAX) na frente da tabela.', correct: true, consequence: 'Cache em memória compatível com a API do DynamoDB, com leituras em microssegundos.' },
        { id: 'd', text: 'Aumentar a capacidade de leitura provisionada da tabela.', correct: false, consequence: 'Aguenta mais leituras, mas a latência continua em milissegundos.' },
      ],
      explanation: [
        'O **DAX** é um cache em memória **compatível com a API do DynamoDB**: a aplicação troca o cliente e passa a ler em **microssegundos**, sem reescrever a lógica de acesso. É a camada de cache feita para ficar na frente do DynamoDB.',
        'O ElastiCache atende, mas a aplicação teria de controlar o cache. O CloudFront é cache de borda para HTTP. Mais capacidade não reduz a latência.',
        '**Regra prática:** leituras repetidas no DynamoDB em microssegundos, sem mudar o código, é DAX; num banco relacional, é ElastiCache.',
      ],
    },
    {
      id: 'rv:arq.f04.m3.a1',
      kind: 'decision',
      title: 'O primário que só devia gravar',
      prompt:
        'O banco RDS for MySQL de um e-commerce está sobrecarregado: **80% da carga são leituras**, entre relatórios do marketing, que aceitam dados de alguns segundos atrás, e a **mesma página de catálogo** lida milhares de vezes. As compras ficam lentas. Quais mudanças tiram as leituras do primário? (Escolha DUAS.)',
      concepts: [{ id: 'perf.read-write-split' }],
      xp: 5,
      difficulty: 2,
      domain: 'd3',
      multiple: true,
      options: [
        { id: 'a', text: 'Apontar os relatórios para uma réplica de leitura do RDS.', correct: true, consequence: 'Os relatórios saem do primário e aceitam o pequeno atraso.' },
        { id: 'b', text: 'Ligar o Multi-AZ e mandar as leituras para o standby.', correct: false, consequence: 'O standby do Multi-AZ com uma instância não atende leituras.' },
        { id: 'c', text: 'Guardar as páginas de catálogo mais lidas no ElastiCache.', correct: true, consequence: 'As leituras repetidas saem do banco e respondem da memória.' },
        { id: 'd', text: 'Trocar o primário por uma instância maior.', correct: false, consequence: 'Escala na vertical o que deveria sair dele.' },
        { id: 'e', text: 'Mandar parte das compras para a réplica de leitura.', correct: false, consequence: 'A réplica de leitura não aceita gravações, e as compras falhariam.' },
      ],
      explanation: [
        'Quando a maior parte da carga é **leitura**, ela sai do primário: **réplicas de leitura** para consultas e relatórios, com dados um pouco atrasados, e **cache** para as leituras repetidas. O primário fica livre para as gravações.',
        'O standby de um Multi-AZ com uma instância não serve leituras. A instância maior escala o gargalo errado. Réplica de leitura não recebe gravações.',
        '**Regra prática:** primário sobrecarregado por leituras pede réplicas para relatórios e cache para o que se repete; gravação continua no primário.',
      ],
    },
    {
      id: 'rv:arq.f04.ler-o-que-gravou',
      kind: 'decision',
      title: 'O perfil que volta ao valor antigo',
      prompt:
        'Um aplicativo manda **todas as leituras para réplicas de leitura** do Aurora e as gravações para o primário. Depois de salvar o perfil, alguns usuários **recarregam a tela e veem os dados antigos** por um instante. O resto das leituras tolera esse atraso. Qual ajuste resolve sem tirar a carga das réplicas?',
      concepts: [{ id: 'perf.read-write-split' }],
      xp: 5,
      difficulty: 3,
      domain: 'd3',
      options: [
        { id: 'a', text: 'Criar mais réplicas de leitura no cluster.', correct: false, consequence: 'Cada réplica continua com o mesmo atraso em relação ao primário.' },
        { id: 'b', text: 'Ler do primário o perfil logo após o usuário gravá-lo.', correct: true, consequence: 'Quem acabou de gravar lê o dado novo; o resto segue nas réplicas.' },
        { id: 'c', text: 'Mandar também as gravações do perfil para as réplicas.', correct: false, consequence: 'As réplicas de leitura não aceitam gravações, e o perfil não seria salvo.' },
        { id: 'd', text: 'Pôr um cache com TTL de um dia na frente das réplicas.', correct: false, consequence: 'O dado antigo passaria a aparecer por até um dia.' },
      ],
      explanation: [
        'Réplicas de leitura recebem os dados com um **pequeno atraso**. Para a maioria das leituras isso é aceitável, mas não para quem **acabou de gravar** e quer ver o próprio dado. A saída é ler **do primário** só nesse caso e manter o resto nas réplicas.',
        'Mais réplicas não reduzem o atraso. Réplicas não aceitam gravações. Um cache longo aumenta a chance de dado antigo.',
        '**Regra prática:** separar leitura e escrita traz consistência eventual; leitura que precisa do dado recém-gravado vai ao primário.',
      ],
    },
    {
      id: 'rv:arq.f04.m3.a3',
      kind: 'decision',
      title: 'Poucos milissegundos no torneio',
      prompt:
        'Um torneio de jogos presencial em **Los Angeles** precisa de latência de **poucos milissegundos** entre os competidores e os **servidores do jogo**, que precisam rodar ali perto. A carga usa a Região us-west-2. Qual solução atende?',
      concepts: [{ id: 'perf.near-users' }],
      xp: 5,
      difficulty: 2,
      domain: 'd3',
      options: [
        { id: 'a', text: 'Uma Local Zone de Los Angeles, estendendo a Região.', correct: true, consequence: 'Os servidores rodam perto dos competidores, com latência de milissegundos.' },
        { id: 'b', text: 'Uma distribuição do CloudFront, com cache na borda de Los Angeles.', correct: false, consequence: 'A borda entrega conteúdo em cache; não roda os servidores do jogo.' },
        { id: 'c', text: 'Outra AZ da Região us-west-2 para os servidores do jogo.', correct: false, consequence: 'Toda AZ fica na área da Região, longe dos competidores em Los Angeles.' },
        { id: 'd', text: 'Um placement group de cluster para os servidores na Região.', correct: false, consequence: 'Aproxima as instâncias entre si, não dos competidores.' },
      ],
      explanation: [
        'Aproximar a carga dos usuários pode ser escolher a Região, usar a borda ou levar a **computação** para mais perto ainda. Uma **Local Zone** estende a Região para perto de grandes centros, com instâncias rodando ali mesmo: é o que dá poucos milissegundos aos competidores.',
        'O CloudFront faz cache e entrega conteúdo, sem rodar servidores. Outra AZ fica no mesmo lugar da Região. Placement groups reduzem a latência entre instâncias.',
        '**Regra prática:** conteúdo perto do usuário é CloudFront; computação a poucos milissegundos de uma cidade é Local Zone.',
      ],
    },
    {
      id: 'rv:arq.f04.regiao-dos-usuarios',
      kind: 'decision',
      title: 'Usuários longe da sede',
      prompt:
        'Uma empresa com sede em **São Paulo** vai lançar um aplicativo cujos usuários estão **quase todos na Alemanha e na França**. Não há exigência legal sobre onde os dados ficam, e a prioridade é a **menor latência** para quem usa. Qual Região escolher para a carga?',
      concepts: [{ id: 'perf.near-users' }],
      xp: 5,
      difficulty: 1,
      domain: 'd3',
      options: [
        { id: 'a', text: 'sa-east-1 (São Paulo), perto da equipe da empresa.', correct: false, consequence: 'Fica longe dos usuários, que são quem sente a latência.' },
        { id: 'b', text: 'us-east-1 (Norte da Virgínia), por ter mais serviços.', correct: false, consequence: 'Fica no meio do caminho, sem motivo de serviço que justifique.' },
        { id: 'c', text: 'Uma Região na Europa, como eu-central-1 (Frankfurt).', correct: true, consequence: 'A carga fica perto dos usuários, com a menor latência.' },
        { id: 'd', text: 'Duas Regiões ativas, em São Paulo e em Frankfurt.', correct: false, consequence: 'Paga duas produções, e São Paulo não serve a nenhum usuário.' },
      ],
      explanation: [
        'A boa prática **PERF04-BP06** manda escolher a localização pela **rede dos usuários** (ou dos dados, em cargas de muitos dados). Um antipadrão citado pela AWS é escolher a Região mais perto da **empresa**, e não de quem usa.',
        'São Paulo e o Norte da Virgínia ficam longe dos usuários. Duas Regiões pagam uma produção que ninguém usa.',
        '**Regra prática:** sem exigência legal, a Região fica perto dos usuários; a borda (CloudFront, Global Accelerator) completa para quem está mais longe.',
      ],
    },
    {
      id: 'rv:arq.f04.m3.a4',
      kind: 'decision',
      title: 'Mais rápida no papel',
      prompt:
        'Um time quer trocar **todas as instâncias** da produção por uma família mais nova porque "deve ser mais rápida". O arquiteto quer decidir **com números**, sem arriscar os clientes. Seguindo o princípio de experimentar do pilar de desempenho, qual caminho atende?',
      concepts: [{ id: 'perf.experiment' }],
      xp: 5,
      difficulty: 1,
      domain: 'd3',
      options: [
        { id: 'a', text: 'Trocar tudo numa madrugada e acompanhar os alarmes.', correct: false, consequence: 'Se piorar, todos os clientes sentem antes da decisão.' },
        { id: 'b', text: 'Nunca trocar o que já está funcionando em produção.', correct: false, consequence: 'Perde melhorias que custariam pouco testar.' },
        { id: 'c', text: 'Testar com a carga real, fora da produção.', correct: true, consequence: 'A troca acontece só se os números confirmarem o ganho.' },
        { id: 'd', text: 'Escolher pelo nome da família mais recente do catálogo.', correct: false, consequence: 'Novidade não garante ganho para esta carga.' },
      ],
      explanation: [
        'Com recursos virtuais, dá para **comparar** tipos de instância, de armazenamento e de configuração em **testes rápidos**, num ambiente que não é a produção, e decidir pelos números. Se valer a pena, a troca também é barata: o recurso muda sem comprar hardware.',
        'Trocar tudo sem medir arrisca os clientes. Nunca trocar perde ganhos. Escolher pelo nome mais novo é o erro que o princípio evita.',
        '**Regra prática:** na nuvem, decida desempenho com testes da carga real; a troca é barata, o palpite não.',
      ],
    },
  ],
}
