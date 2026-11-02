/**
 * Questões da Revisão da Fase 2 da S3 Expedition (classes de armazenamento e
 * custos), no formato do exame SAA-C03. Fatos conferidos em 16/10/2026 e
 * 29/10/2026 (ver docs/VERIFICACAO-DE-CONTEUDO.md); preços de us-east-1 da
 * AWS Price List de 16/10/2026. As empresas são fictícias.
 */
import type { ReviewSet } from '../../../../engine/types'

export const REVIEW_F02: ReviewSet = {
  phaseId: 's3x.f02',
  questions: [
    {
      id: 'rv:s3x.f02.m3.a2',
      kind: 'decision',
      title: 'Exames lidos várias vezes por mês',
      prompt:
        'Um portal de diagnóstico guarda **3.000 GB** de exames recentes no S3 Standard. Os médicos abrem os mesmos exames várias vezes, somando cerca de **6.000 GB lidos por mês**. Os exames precisam abrir em milissegundos e resistir à perda de uma zona de disponibilidade. O financeiro propõe movê-los para o S3 Standard-IA, que custa quase a metade por GB. Com os preços de referência abaixo, qual avaliação sobre o **custo mensal** está correta?',
      exhibits: [
        {
          title: 'Preços de referência (us-east-1, primeira faixa)',
          code: 'Classe           Armazenamento       Recuperação\nS3 Standard      US$ 0,023/GB-mês    sem taxa\nS3 Standard-IA   US$ 0,0125/GB-mês   US$ 0,01 por GB lido\n\nRequisições ficam fora da conta (no Standard-IA, elas também custam mais).',
        },
      ],
      concepts: [{ id: 'sc.standard-ia' }, { id: 's3.pricing' }, { id: 'sc.standard' }],
      xp: 5,
      difficulty: 2,
      domain: 'd4',
      options: [
        { id: 'a', text: 'Sobe: a recuperação dos 6.000 GB lidos supera a economia no armazenamento.', correct: true, consequence: 'A recuperação (US$ 60) supera a economia de US$ 31,50 no armazenamento: a conta passa de US$ 69 para cerca de US$ 97,50 por mês.' },
        { id: 'b', text: 'Cai quase pela metade: entre as duas classes, só o preço do GB armazenado muda.', correct: false, consequence: 'Esquece a taxa por GB lido, que é justamente a parcela que domina quando o dado é lido com frequência.' },
        { id: 'c', text: 'Cai um pouco: a taxa de recuperação só vale para objetos lidos nos primeiros 30 dias.', correct: false, consequence: 'Confunde a duração mínima de 30 dias, que é uma regra de cobrança do armazenamento, com a taxa de recuperação, cobrada em toda leitura.' },
        { id: 'd', text: 'Cai, mas cada exame passa a exigir uma restauração antes de abrir.', correct: false, consequence: 'O Standard-IA lê em milissegundos. Restauração antes da leitura existe no Glacier Flexible Retrieval e no Deep Archive.' },
      ],
      explanation: [
        'O requisito que decide é o **custo total**, e no Standard-IA ele tem duas parcelas: o armazenamento, mais barato, e a recuperação, cobrada por GB lido. No Standard, a conta é 3.000 GB × US$ 0,023 = US$ 69 por mês. No Standard-IA, o armazenamento cai para US$ 37,50, mas os 6.000 GB lidos somam US$ 60 de recuperação: US$ 97,50 por mês, cerca de 40% a mais, antes mesmo das requisições.',
        'As outras avaliações erram em pontos clássicos. Dizer que só o preço do GB muda ignora a taxa de recuperação. A duração mínima de 30 dias diz quanto tempo o objeto paga de armazenamento, não quando a leitura é cobrada. E o Standard-IA lê em milissegundos, como o Standard: restauração só existe nas classes arquivadas.',
        '**Regra prática:** classes IA compensam quando cada GB guardado é lido bem menos de uma vez por mês. Antes de trocar de classe, compare o volume lido por mês com o volume guardado; se o dado é lido com frequência, o S3 Standard costuma sair mais barato.',
      ],
    },
    {
      id: 'rv:s3x.f02.backup-8-horas',
      kind: 'decision',
      title: 'Backups de 7 anos com prazo de 8 horas',
      prompt:
        'Uma corretora guarda os backups mensais dos seus bancos de dados por 7 anos. Eles quase nunca são lidos: em média, uma auditoria por ano pede alguns backups antigos, e a corretora tem **até 8 horas** para entregá-los. Qual classe atende ao prazo com o **menor custo**?',
      concepts: [{ id: 'sc.glacier-flexible' }, { id: 'sc.deep-archive' }, { id: 'sc.glacier-ir' }],
      xp: 5,
      difficulty: 2,
      domain: 'd4',
      options: [
        { id: 'a', text: 'S3 Glacier Deep Archive, com restauração Standard ou Bulk quando a auditoria pedir.', correct: false, consequence: 'É a classe mais barata, mas a restauração Standard leva até 12 horas e não há Expedited: o prazo de 8 horas não fica garantido.' },
        { id: 'b', text: 'S3 Glacier Flexible Retrieval, com restauração Standard quando a auditoria pedir.', correct: true, consequence: 'A restauração Standard termina, em geral, em 3 a 5 horas, dentro do prazo, e o armazenamento está entre os mais baratos do S3.' },
        { id: 'c', text: 'S3 Glacier Instant Retrieval, com leitura direta quando a auditoria pedir.', correct: false, consequence: 'Cumpre o prazo com folga, mas paga por leitura imediata que ninguém exige: armazenamento e recuperação custam mais que no Glacier Flexible Retrieval.' },
        { id: 'd', text: 'S3 Standard-IA, com leitura direta quando a auditoria pedir.', correct: false, consequence: 'É feita para dados lidos cerca de uma vez por mês: para backups lidos uma vez por ano, o armazenamento custa mais de três vezes o das classes Glacier.' },
      ],
      explanation: [
        'O que decide é o **prazo de 8 horas** junto com o menor custo. O Glacier Flexible Retrieval é a classe mais barata que cumpre esse prazo: os objetos ficam arquivados, e a restauração Standard termina, em geral, em 3 a 5 horas.',
        'O Deep Archive custa menos por GB, mas a restauração Standard leva até 12 horas, a Bulk até 48, e ele não tem Expedited. O Glacier Instant Retrieval e o Standard-IA leem em milissegundos, uma vantagem que o cenário não pede e que se paga no armazenamento (e, no Instant Retrieval, também na recuperação).',
        '**Regra prática:** comece pelo prazo de leitura. Milissegundos pedem Glacier Instant Retrieval; de minutos a poucas horas, Glacier Flexible Retrieval; até 12 ou 48 horas, Deep Archive. Entre as classes que cumprem o prazo, a mais lenta costuma ser a mais barata.',
      ],
    },
    {
      id: 'rv:s3x.f02.contratos-unicos',
      kind: 'decision',
      title: 'Contratos que não podem ser recriados',
      prompt:
        'Uma fintech guarda contratos assinados digitalmente. Cada contrato é **único** (não pode ser recriado), é aberto cerca de uma vez por mês e precisa abrir em milissegundos. Para cortar custos, alguém propõe o S3 One Zone-IA, lembrando que ele também tem 11 noves de durabilidade. Qual classe atende aos requisitos com o **menor custo**?',
      concepts: [{ id: 'sc.onezone-ia' }, { id: 'sc.standard-ia' }, { id: 'sc.overview' }],
      xp: 5,
      difficulty: 2,
      domain: 'd2',
      options: [
        { id: 'a', text: 'S3 One Zone-IA, já que a durabilidade projetada também é de 11 noves.', correct: false, consequence: 'Os 11 noves valem dentro de uma única zona. Se a zona for destruída, os contratos, que não podem ser recriados, se perdem.' },
        { id: 'b', text: 'S3 Glacier Flexible Retrieval, que guarda os dados em várias zonas e custa menos.', correct: false, consequence: 'Os contratos ficariam arquivados: cada leitura exigiria uma restauração de minutos a horas, e o requisito é abrir em milissegundos.' },
        { id: 'c', text: 'S3 Standard-IA, que guarda os dados em pelo menos três zonas de disponibilidade.', correct: true, consequence: 'Leitura em milissegundos, preço de dado pouco acessado e cópias em várias zonas: perder uma zona não perde contratos.' },
        { id: 'd', text: 'S3 Express One Zone, que abre os contratos com a menor latência do S3.', correct: false, consequence: 'Fica numa única zona, como o One Zone-IA, e tem o armazenamento mais caro do S3: falha no risco e no custo.' },
      ],
      explanation: [
        'Dois requisitos eliminam opções antes do preço: os contratos são **únicos** e precisam abrir em **milissegundos**. O Standard-IA atende aos dois: guarda os dados em pelo menos três zonas, lê em milissegundos e é feito para dados lidos cerca de uma vez por mês.',
        'O argumento a favor do One Zone-IA mistura durabilidade com resiliência à perda de zona: os 11 noves dele valem dentro de uma única zona, e a destruição dessa zona leva os dados junto. O Express One Zone tem o mesmo problema e ainda custa mais. O Glacier Flexible Retrieval guarda em várias zonas, mas exige restauração antes de cada leitura.',
        '**Regra prática:** One Zone-IA e Express One Zone só servem para dados que podem ser recriados ou que têm outra cópia. Se o enunciado diz que o dado é único ou precisa resistir à perda de uma zona, as classes de uma zona saem da lista.',
      ],
    },
    {
      id: 'rv:s3x.f02.restauracao-tribunal',
      kind: 'decision',
      title: 'Processos arquivados e o prazo do tribunal',
      prompt:
        'Um escritório de advocacia guarda processos encerrados no S3 Glacier Deep Archive. Um tribunal pediu 300 documentos e deu **3 dias** de prazo. O escritório quer **gastar o mínimo** e não pretende mudar a classe dos documentos. Quais ações são necessárias? (Escolha DUAS.)',
      concepts: [{ id: 's3.restore' }, { id: 'sc.deep-archive' }],
      xp: 5,
      difficulty: 2,
      domain: 'd4',
      multiple: true,
      options: [
        { id: 'a', text: 'Pedir a restauração dos documentos com a opção Bulk.', correct: true, consequence: 'A Bulk é a opção mais barata e, no Deep Archive, termina em até 48 horas, dentro dos 3 dias.' },
        { id: 'b', text: 'Pedir a restauração dos documentos com a opção Expedited.', correct: false, consequence: 'O Deep Archive não oferece Expedited. E, com 3 dias de prazo, nem haveria por que pagar pela pressa.' },
        { id: 'c', text: 'Baixar os documentos direto com GET, pagando a taxa de recuperação.', correct: false, consequence: 'Objetos no Deep Archive não aceitam GET antes da restauração: a leitura direta é recusada.' },
        { id: 'd', text: 'Baixar as cópias restauradas com GET dentro dos dias definidos no pedido.', correct: true, consequence: 'A restauração cria uma cópia temporária pelo número de dias pedido; o original continua no Deep Archive, como o escritório quer.' },
        { id: 'e', text: 'Copiar os documentos para o S3 Standard e só depois pedir a restauração.', correct: false, consequence: 'Inverte a ordem e muda a classe: um objeto arquivado precisa ser restaurado antes de ser copiado, e o escritório não quer trocar a classe.' },
      ],
      explanation: [
        'Ler um objeto do Deep Archive exige dois passos: pedir a restauração (RestoreObject) e, quando ela termina, ler a cópia temporária com GET durante os dias definidos no pedido. Com **3 dias** de prazo e o requisito de **gastar o mínimo**, a opção certa é a Bulk, a mais barata, que no Deep Archive termina em até 48 horas.',
        'A Expedited não existe no Deep Archive; ela só vale para o Glacier Flexible Retrieval e para o tier Archive Access do Intelligent-Tiering. O GET direto falha porque o objeto está arquivado. E copiar antes de restaurar não funciona, além de trocar a classe dos documentos, o que o escritório quer evitar.',
        '**Regra prática:** em classe arquivada, ler é sempre restaurar e depois fazer o GET. Escolha a opção de restauração pelo prazo: no Deep Archive, Standard em até 12 horas e Bulk em até 48; minutos, só no Glacier Flexible Retrieval, com Expedited.',
      ],
    },
    {
      id: 'rv:s3x.f02.latencia-treinamento',
      kind: 'decision',
      title: 'Latência de leitura no treinamento',
      prompt:
        'Uma equipe de pesquisa treina modelos de visão computacional em instâncias EC2 de uma única zona de disponibilidade. A cada época, o treinamento lê milhões de imagens pequenas, e o gargalo é a **latência de cada requisição** ao S3. As imagens originais continuam num bucket S3 Standard, e a equipe só precisa de uma cópia de trabalho rápida. Qual opção oferece a **menor latência** por requisição?',
      concepts: [{ id: 'sc.express-onezone' }, { id: 'sc.onezone-ia' }],
      xp: 5,
      difficulty: 2,
      domain: 'd3',
      options: [
        { id: 'a', text: 'Copiar as imagens para o S3 One Zone-IA, que também guarda os dados numa única zona.', correct: false, consequence: 'Ficar numa zona não deixa a leitura mais rápida: o One Zone-IA tem a latência das classes comuns e ainda cobra cada GB lido.' },
        { id: 'b', text: 'Mover as imagens para o S3 Glacier Instant Retrieval, que entrega os dados em milissegundos.', correct: false, consequence: 'Milissegundos não é o mesmo que um dígito de milissegundo; e, com leituras a cada época, a recuperação por GB ficaria caríssima.' },
        { id: 'c', text: 'Ativar o S3 Intelligent-Tiering para manter as imagens no tier Frequent Access.', correct: false, consequence: 'Os tiers mudam o preço, não a latência: o tier Frequent Access tem o desempenho do S3 Standard.' },
        { id: 'd', text: 'Copiar as imagens para um directory bucket no S3 Express One Zone, na zona das instâncias.', correct: true, consequence: 'Latência consistente de um dígito de milissegundo, com dados e computação na mesma zona; perder a zona não perde nada, porque os originais seguem no Standard.' },
      ],
      explanation: [
        'O requisito é **latência por requisição**, num conjunto de trabalho que pode ser recriado. O S3 Express One Zone foi feito para isso: usa directory buckets (o tipo de bucket exigido por essa classe), fica numa zona que você escolhe e entrega latência consistente de um dígito de milissegundo. Colocar o bucket na mesma zona das instâncias encurta o caminho.',
        'O One Zone-IA também fica numa zona, mas é uma classe barata para dados pouco lidos, com a latência das classes comuns e taxa por GB lido. O Glacier Instant Retrieval lê em milissegundos, mas é arquivo: cada GB lido custa caro. O Intelligent-Tiering só ajusta o preço de cada objeto conforme o acesso; não acelera a leitura.',
        '**Regra prática:** "um dígito de milissegundo", "muitas requisições por segundo" e "computação na mesma zona" apontam para o S3 Express One Zone. Como ele fica numa zona só, guarde nele a cópia de trabalho e mantenha a original numa classe com várias zonas.',
      ],
    },
    {
      id: 'rv:s3x.f02.tier-deep-archive',
      kind: 'decision',
      title: 'Vídeos que deixaram de abrir',
      prompt:
        'Um aplicativo de vídeos guarda o acervo no S3 Intelligent-Tiering. Para economizar mais, a equipe ativou o tier opcional **Deep Archive Access**. Desde então, quando alguém abre um vídeo parado há mais de seis meses, a aplicação recebe erro e o vídeo não carrega. Os vídeos precisam abrir **na hora**, sempre. Qual mudança resolve com o **menor custo**?',
      concepts: [{ id: 'sc.intelligent-tiering' }, { id: 's3.restore' }],
      xp: 5,
      difficulty: 3,
      domain: 'd2',
      options: [
        { id: 'a', text: 'Pedir a restauração Expedited de cada vídeo quando a aplicação receber o erro.', correct: false, consequence: 'O tier Deep Archive Access não tem Expedited, só Standard (até 12 horas) e Bulk (até 48 horas): o usuário esperaria horas.' },
        { id: 'b', text: 'Mover todos os vídeos para o S3 Standard, que não tem tiers de arquivamento.', correct: false, consequence: 'Resolve o erro, mas abre mão da economia automática: os vídeos parados pagariam o preço cheio para sempre.' },
        { id: 'c', text: 'Remover a configuração de arquivamento e restaurar, uma única vez, os vídeos já arquivados.', correct: true, consequence: 'Sem os tiers opcionais, os vídeos parados param no tier Archive Instant Access, barato e com leitura em milissegundos; os já arquivados voltam ao tier Frequent Access depois da restauração.' },
        { id: 'd', text: 'Aumentar para 730 dias, o máximo permitido, o prazo sem acesso antes de arquivar os vídeos.', correct: false, consequence: 'Só adia o problema: um vídeo parado há mais de dois anos voltaria a falhar.' },
      ],
      explanation: [
        'Os tiers **opcionais** do Intelligent-Tiering (Archive Access e Deep Archive Access) guardam os objetos como arquivo: para ler, é preciso restaurar e esperar. Eles só servem para dados que a aplicação pode ler sem pressa. Como os vídeos precisam abrir **na hora**, a saída é remover esse arquivamento e restaurar uma vez o que já foi arquivado. Os tiers automáticos continuam economizando: depois de 30 dias sem acesso o objeto vai para o Infrequent Access e, depois de 90, para o Archive Instant Access, ambos com leitura em milissegundos.',
        'O tier Deep Archive Access, como a classe Deep Archive, não tem restauração Expedited: a Standard leva até 12 horas. Voltar para o S3 Standard elimina o erro, mas paga o preço cheio por vídeos parados. E aumentar o prazo para 730 dias, o máximo permitido, só empurra a falha para os vídeos mais antigos.',
        '**Regra prática:** no Intelligent-Tiering, os três tiers automáticos sempre leem em milissegundos e não cobram recuperação. Só ative os tiers de arquivamento quando a aplicação aceitar esperar horas por uma restauração.',
      ],
    },
    {
      id: 'rv:s3x.f02.padrao-conhecido',
      kind: 'decision',
      title: 'Relatórios com padrão de acesso conhecido',
      prompt:
        'Uma operadora de telefonia gera um relatório de chamadas de cerca de 50 MB por dia. Nos primeiros 30 dias, os relatórios são consultados todo dia; depois, só algumas vezes por ano, quando um cliente contesta a conta, e então precisam abrir **na hora**. Eles ficam guardados por 5 anos e precisam resistir à perda de uma zona, e o padrão é o mesmo há anos. A equipe pode usar regras de ciclo de vida (lifecycle), que mudam a classe dos objetos depois de um número de dias. Qual estratégia tem o **menor custo**?',
      concepts: [{ id: 'sc.glacier-ir' }, { id: 'sc.intelligent-tiering' }, { id: 'sc.standard-ia' }],
      xp: 5,
      difficulty: 3,
      domain: 'd4',
      options: [
        { id: 'a', text: 'Gravar direto no Intelligent-Tiering e deixar que os tiers automáticos movam cada relatório sozinhos.', correct: false, consequence: 'Funciona, mas é feito para padrão desconhecido: cada relatório só chega ao tier mais barato depois de 90 dias seguidos sem acesso.' },
        { id: 'b', text: 'Gravar no Standard e mover para o Standard-IA aos 30 dias, com uma regra de lifecycle.', correct: false, consequence: 'Atende ao acesso, mas o Standard-IA cobra cerca de três vezes o preço por GB do Glacier Instant Retrieval para dados lidos poucas vezes por ano.' },
        { id: 'c', text: 'Gravar no Standard e mover para o Glacier Deep Archive aos 30 dias, com uma regra de lifecycle.', correct: false, consequence: 'É o mais barato por GB, mas exige restauração de até 12 horas: o relatório não abriria na hora da contestação.' },
        { id: 'd', text: 'Gravar no Standard e mover para o Glacier Instant Retrieval aos 30 dias, com uma regra de lifecycle.', correct: true, consequence: 'Com o padrão conhecido, a regra move cada relatório no dia certo para a classe mais barata com leitura imediata e várias zonas.' },
      ],
      explanation: [
        'Aqui o **padrão de acesso é conhecido**: leitura diária por 30 dias e, depois, leituras raras que precisam ser imediatas. Quando se sabe quando o dado esfria, uma regra de lifecycle move cada relatório, no dia certo, para a classe fixa mais barata que atende ao requisito. O Glacier Instant Retrieval lê em milissegundos, guarda os dados em pelo menos três zonas e tem armazenamento muito barato; a recuperação mais cara pesa pouco com poucas leituras por ano.',
        'No Intelligent-Tiering, o relatório só chega ao tier Archive Instant Access depois de 90 dias seguidos sem acesso; até lá paga o tier Frequent e depois o Infrequent, e cada contestação o traz de volta ao Frequent. Ele compensa quando ninguém sabe prever o acesso. O Standard-IA paga cerca de três vezes mais por GB guardado. O Deep Archive é o mais barato, mas a restauração de até 12 horas quebra o requisito de abrir na hora.',
        '**Regra prática:** padrão de acesso conhecido pede regra de lifecycle para a classe certa; padrão desconhecido ou que muda pede Intelligent-Tiering.',
      ],
    },
    {
      id: 'rv:s3.storage-class-analysis:quando',
      kind: 'decision',
      title: 'Prazo da regra com base no acesso real',
      prompt:
        'A equipe de dados vai criar uma regra de lifecycle que move os objetos do prefixo `relatorios/` do S3 Standard para o S3 Standard-IA. Ninguém sabe com quantos dias esses relatórios deixam de ser lidos, e a equipe quer definir o prazo **com base no acesso real**, sem desenvolver nenhuma análise própria. Qual abordagem atende ao requisito?',
      concepts: [{ id: 's3.storage-class-analysis' }],
      xp: 5,
      difficulty: 1,
      domain: 'd4',
      options: [
        { id: 'a', text: 'Usar 30 dias, que é a duração mínima de armazenamento do Standard-IA.', correct: false, consequence: 'A duração mínima é uma regra de cobrança: diz quanto tempo o objeto paga, não quando ele deixa de ser lido.' },
        { id: 'b', text: 'Configurar o Storage Class Analysis no prefixo e usar a idade que ele recomendar.', correct: true, consequence: 'Ele observa o acesso real por 30 dias ou mais e recomenda a idade para a transição do Standard para o Standard-IA.' },
        { id: 'c', text: 'Usar 30 dias, que é quando o Intelligent-Tiering passa objetos para o tier Infrequent Access.', correct: false, consequence: 'Esse prazo é uma regra fixa do Intelligent-Tiering e não mede o acesso destes relatórios.' },
        { id: 'd', text: 'Ativar os logs de acesso do bucket e calcular o prazo numa planilha a partir deles.', correct: false, consequence: 'Até daria uma resposta, mas é a análise própria que a equipe quer evitar; o S3 já oferece essa análise pronta.' },
      ],
      explanation: [
        'O requisito é decidir o prazo **com base no acesso real** e sem análise própria. O Storage Class Analysis faz isso: observa o acesso de um bucket, prefixo ou tag por 30 dias ou mais e recomenda a idade a partir da qual os objetos passam a ser pouco acessados, para a transição do Standard para o Standard-IA.',
        'Os dois prazos de 30 dias das outras opções são regras fixas, não medidas: um é a duração mínima de cobrança do Standard-IA, o outro é o gatilho do Intelligent-Tiering. Os logs de acesso do servidor trazem os dados brutos, mas transformá-los em recomendação é justamente o trabalho que a equipe não quer fazer.',
        '**Regra prática:** o Storage Class Analysis responde quando mover do Standard para o Standard-IA, e só isso: ele não recomenda One Zone-IA nem classes Glacier. Para padrão imprevisível, a resposta é o Intelligent-Tiering, que dispensa regra.',
      ],
    },
    {
      id: 'rv:s3x.f02.vaults-existentes',
      kind: 'decision',
      title: 'Dados novos de quem já usa vaults',
      prompt:
        'Uma rede de hospitais guarda há anos 200 TB de exames antigos em vaults do serviço Amazon Glacier. Agora ela vai começar a arquivar os exames novos, que também quase nunca são lidos e podem esperar até 48 horas quando pedidos. A rede quer que os dados novos usem as mesmas políticas e ferramentas que ela já usa no S3, com o **menor custo** e o **menor esforço**. Qual abordagem atende?',
      concepts: [{ id: 'glacier.vault-service' }, { id: 'sc.deep-archive' }],
      xp: 5,
      difficulty: 2,
      domain: 'd4',
      options: [
        { id: 'a', text: 'Migrar os 200 TB dos vaults para o S3 antes de arquivar os exames novos.', correct: false, consequence: 'Quem já usa o serviço continua com acesso aos dados, sem migração obrigatória: é esforço que nenhum requisito pede.' },
        { id: 'b', text: 'Continuar arquivando os exames novos em vaults, com a API própria do serviço.', correct: false, consequence: 'Mantém o arquivo fora do S3, com API separada: não atende ao requisito de usar as mesmas políticas e ferramentas do S3.' },
        { id: 'c', text: 'Arquivar os exames novos na classe S3 Glacier Deep Archive e manter os vaults como estão.', correct: true, consequence: 'Os dados novos ficam no S3, com as mesmas políticas e ferramentas, na classe mais barata; os vaults continuam acessíveis, sem migração obrigatória.' },
        { id: 'd', text: 'Criar uma regra de lifecycle no S3 que mova o conteúdo dos vaults para o Deep Archive.', correct: false, consequence: 'Regras de lifecycle agem sobre objetos de buckets S3; o conteúdo dos vaults é de outro serviço e não aparece no S3.' },
      ],
      explanation: [
        'Os requisitos pedem que os dados **novos** usem as políticas e as ferramentas do S3, com **menor custo** e **menor esforço**. A resposta é arquivá-los numa classe do próprio S3: com leitura rara e espera de até 48 horas aceitável, o S3 Glacier Deep Archive é a mais barata. Os vaults antigos podem ficar como estão: quem já era cliente continua com acesso aos dados, sem migração obrigatória.',
        'Migrar os 200 TB agora é trabalho que nenhum requisito pede. Continuar nos vaults mantém uma API e ferramentas separadas. E uma regra de lifecycle não alcança os vaults: o serviço Amazon Glacier original é outro produto, e o que está nele não aparece como objeto do S3, assim como objetos em classes S3 Glacier não aparecem no serviço de vaults.',
        '**Regra prática:** arquivar hoje é usar as classes S3 Glacier, pela API do S3. O serviço de vaults não aceita novos clientes desde 15/12/2025 e não se mistura com o S3: nem lifecycle nem políticas de bucket alcançam o que está nele.',
      ],
    },
    {
      id: 'rv:s3x.f02.m3.a1',
      kind: 'decision',
      title: 'Miniaturas pequenas e muito lidas',
      prompt:
        'Um app de fotos guarda 40 milhões de miniaturas de **24 KB** no S3 Standard. Elas podem ser recriadas a partir das fotos originais e aparecem toda vez que alguém abre um álbum, o que gera milhões de leituras por dia. O time propõe movê-las para o S3 One Zone-IA, que custa menos da metade por GB (US$ 0,01 contra US$ 0,023 por GB-mês no Standard) e aceita dados recriáveis. Qual avaliação sobre o **custo mensal** está correta?',
      concepts: [{ id: 's3.min-duration' }, { id: 'sc.onezone-ia' }, { id: 's3.pricing' }],
      xp: 5,
      difficulty: 3,
      domain: 'd4',
      options: [
        { id: 'a', text: 'Cai mais da metade, porque dados recriáveis são o caso de uso do One Zone-IA.', correct: false, consequence: 'Ser recriável resolve o risco de perder a zona, não o custo: o tamanho mínimo e a taxa de recuperação continuam valendo.' },
        { id: 'b', text: 'Cai, mas as miniaturas passam a exigir restauração antes de aparecer no álbum.', correct: false, consequence: 'O One Zone-IA lê em milissegundos; restauração antes da leitura existe no Glacier Flexible Retrieval e no Deep Archive.' },
        { id: 'c', text: 'Sobe: cada miniatura passa a ser cobrada como 128 KB, e cada GB lido paga recuperação.', correct: true, consequence: 'Cobrar 128 KB por objeto de 24 KB multiplica o volume faturado por mais de 5: só o armazenamento já fica mais caro que no Standard, antes da recuperação.' },
        { id: 'd', text: 'Cai, porque o mínimo de 128 KB vale só para o Standard-IA, e não para o One Zone-IA.', correct: false, consequence: 'O One Zone-IA tem as mesmas regras do Standard-IA: 128 KB mínimos por objeto e 30 dias de duração mínima.' },
      ],
      explanation: [
        'O que decide é o **tamanho dos objetos** somado ao **acesso frequente**. No One Zone-IA, cada objeto menor que 128 KB é cobrado como 128 KB: as miniaturas de 24 KB passam a pagar mais de 5 vezes o próprio tamanho. Com os preços do enunciado, 128 ÷ 24 × US$ 0,01 dá cerca de US$ 0,053 por GB real de miniatura, mais que o dobro dos US$ 0,023 do Standard. E os milhões de leituras diárias ainda pagariam recuperação por GB.',
        'Ser recriável torna aceitável o risco de perder a zona, mas não muda as regras de cobrança. O One Zone-IA não exige restauração: a leitura continua em milissegundos. E o mínimo de 128 KB vale para as duas classes IA e também para o Glacier Instant Retrieval.',
        '**Regra prática:** objetos pequenos (abaixo de 128 KB) e muito lidos ficam no S3 Standard. Antes de mudar de classe, confira o tamanho médio dos objetos e quantas vezes eles são lidos, não só o preço por GB.',
      ],
    },
    {
      id: 'rv:s3x.f02.m3.a3',
      kind: 'decision',
      title: 'Arquivar 50 milhões de logs pequenos',
      prompt:
        'Uma empresa tem 50 milhões de arquivos de log de **16 KB** no S3 Standard, gravados ao longo do último ano. Eles precisam ser guardados por 5 anos e quase nunca são lidos; quando uma investigação pede um log antigo, ele precisa chegar em **até 6 horas**. Qual abordagem atende com o **menor custo total**?',
      concepts: [{ id: 's3.min-duration' }, { id: 'sc.glacier-flexible' }, { id: 's3.pricing' }],
      xp: 5,
      difficulty: 3,
      domain: 'd4',
      options: [
        { id: 'a', text: 'Transicionar os 50 milhões de logs, como estão, para o Glacier Flexible Retrieval.', correct: false, consequence: 'Cada objeto arquivado soma 40 KB cobrados (8 KB no preço do Standard), mais que o próprio log: a conta mensal quase não cai, e a transição custa caro.' },
        { id: 'b', text: 'Transicionar os logs, como estão, para o Standard-IA, que dispensa restauração.', correct: false, consequence: 'Cada log de 16 KB seria cobrado como 128 KB: oito vezes o tamanho real.' },
        { id: 'c', text: 'Transicionar os logs, como estão, para o Glacier Deep Archive, a classe mais barata por GB.', correct: false, consequence: 'Mantém o custo de 40 KB por objeto e a transição cara, e a restauração de até 12 horas estoura o prazo de 6 horas.' },
        { id: 'd', text: 'Juntar os logs em arquivos compactados por hora e guardá-los no Glacier Flexible Retrieval.', correct: true, consequence: 'Poucos objetos grandes eliminam o custo fixo por objeto, e a restauração Standard, de 3 a 5 horas, cabe no prazo.' },
      ],
      explanation: [
        'O que pesa aqui é o **número de objetos**, não o volume. O Glacier Flexible Retrieval soma 40 KB a cada objeto arquivado (32 KB no preço da classe e 8 KB no preço do Standard), e cada transição é cobrada por objeto. Juntar os logs em arquivos maiores e compactados transforma 50 milhões de objetos em cerca de 9 mil: o custo fixo por objeto some, e a restauração Standard, de 3 a 5 horas, cumpre o prazo.',
        'Arquivar os logs como estão quase não reduz a conta mensal, porque os 40 KB extras superam os 16 KB de cada log, e ainda gera um custo alto de transição: com os preços de us-east-1, cerca de US$ 1.500 para 50 milhões de objetos. Por isso, desde setembro de 2024, o lifecycle nem transiciona objetos menores que 128 KB por padrão. O Standard-IA cobraria 128 KB por log, e o Deep Archive, além de manter o custo por objeto, restaura em até 12 horas.',
        '**Regra prática:** milhões de objetos pequenos não combinam com classes IA nem com classes de arquivo. Agrupe-os em arquivos maiores antes de mudar de classe.',
      ],
    },
    {
      id: 'rv:s3x.f02.disponibilidade-9999',
      kind: 'decision',
      title: 'Imagens com exigência de 99,99%',
      prompt:
        'Um portal de notícias serve as imagens das matérias direto do S3. As imagens são lidas o tempo todo, e o contrato do portal exige um armazenamento **projetado para 99,99% de disponibilidade** que resista à perda de uma zona de disponibilidade. Qual classe atende aos requisitos?',
      concepts: [{ id: 'sc.standard' }, { id: 'sc.overview' }],
      xp: 5,
      difficulty: 1,
      domain: 'd2',
      options: [
        { id: 'a', text: 'S3 Intelligent-Tiering, que mantém as imagens lidas no tier Frequent Access.', correct: false, consequence: 'O tier Frequent Access tem o desempenho do Standard, mas a classe é projetada para 99,9% de disponibilidade.' },
        { id: 'b', text: 'S3 Standard, a classe padrão para dados lidos com frequência.', correct: true, consequence: 'É a classe projetada para 99,99% de disponibilidade, com dados em pelo menos três zonas e sem taxa de recuperação para o acesso intenso.' },
        { id: 'c', text: 'S3 Standard-IA, que guarda os dados em pelo menos três zonas.', correct: false, consequence: 'Resiste à perda de uma zona, mas é projetada para 99,9% de disponibilidade e cobraria cada GB lido, num acesso intenso.' },
        { id: 'd', text: 'S3 Express One Zone, a classe de menor latência do S3.', correct: false, consequence: 'É projetada para 99,95% de disponibilidade dentro de uma única zona: não resiste à perda dela.' },
      ],
      explanation: [
        'Dois requisitos fecham a escolha: disponibilidade **projetada de 99,99%** e resistência à perda de uma zona. O S3 Standard é a única opção que atende aos dois, e o acesso intenso confirma a escolha: ele não cobra recuperação por GB lido.',
        'As outras classes com várias zonas, como Intelligent-Tiering e Standard-IA, são projetadas para 99,9%: um pouco menos, em troca de preço menor para dados pouco lidos. O Express One Zone fica numa única zona, projetado para 99,95% dentro dela, e a perda da zona derruba o acesso.',
        '**Regra prática:** todas as classes têm 11 noves de durabilidade; o que muda é a disponibilidade. Standard, 99,99%; Intelligent-Tiering, Standard-IA e Glacier Instant Retrieval, 99,9%; One Zone-IA, 99,5%. Quando o enunciado fixa a disponibilidade, compare esse número antes do preço.',
      ],
    },
  ],
}
