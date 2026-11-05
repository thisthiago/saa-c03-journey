/**
 * Questões da Revisão da Fase 1 de Arquitetura e otimização (Well-Architected
 * Framework e Tool), no formato do exame SAA-C03. Fatos conferidos em
 * docs.aws.amazon.com (ver docs/VERIFICACAO-DE-CONTEUDO.md). As empresas são
 * fictícias.
 */
import type { ReviewSet } from '../../../../engine/types'

export const REVIEW_F01: ReviewSet = {
  phaseId: 'arq.f01',
  questions: [
    {
      id: 'rv:arq.f01.m1.a1:i2',
      kind: 'decision',
      title: 'Chaves gravadas no código',
      prompt:
        'Uma aplicação em instâncias EC2 lê e grava num bucket S3 usando **chaves de acesso de um usuário do IAM**, gravadas no arquivo de configuração. Uma revisão pelo pilar de segurança do Well-Architected apontou o problema. Qual mudança segue a **base de identidade forte** recomendada pelo pilar?',
      concepts: [{ id: 'wa.pillar-security' }],
      xp: 5,
      difficulty: 1,
      domain: 'd1',
      options: [
        { id: 'a', text: 'Trocar as chaves do usuário a cada 90 dias por um script.', correct: false, consequence: 'Continuam sendo credenciais longas, guardadas nas instâncias.' },
        { id: 'b', text: 'Uma role do IAM na instância, com acesso só ao bucket.', correct: true, consequence: 'A aplicação recebe credenciais temporárias, com o menor privilégio.' },
        { id: 'c', text: 'Guardar as chaves em variáveis de ambiente das instâncias.', correct: false, consequence: 'Muda o lugar das chaves, que continuam longas e expostas.' },
        { id: 'd', text: 'Restringir o security group das instâncias à porta 443.', correct: false, consequence: 'Controla a rede, não a credencial que acessa o bucket.' },
      ],
      explanation: [
        'O pilar de **segurança** começa por uma **base de identidade forte**: menor privilégio, separação de funções e **nada de credenciais longas**. A boa prática de usar **credenciais temporárias** tem risco alto se não for seguida. Uma **role do IAM** na instância entrega credenciais temporárias, trocadas sozinhas, com acesso só ao bucket.',
        'Trocar as chaves de tempos em tempos ou mudá-las de lugar mantém credenciais longas nas instâncias. O security group trata da rede.',
        '**Regra prática:** aplicação na AWS usa role com credenciais temporárias e menor privilégio; chave de acesso guardada em servidor é sinal de risco.',
      ],
    },
    {
      id: 'rv:arq.f01.pessoas-longe-dos-dados',
      kind: 'decision',
      title: 'Um erro sem autor',
      prompt:
        'Numa fintech, um analista corrigiu dados **direto no banco de produção**, apagou registros por engano, e **ninguém conseguiu descobrir quem foi**. A diretoria quer evitar que isso se repita, seguindo o pilar de **segurança** do Well-Architected. Quais medidas atendem? (Escolha DUAS.)',
      concepts: [{ id: 'wa.pillar-security' }],
      xp: 5,
      difficulty: 3,
      domain: 'd1',
      multiple: true,
      options: [
        { id: 'a', text: 'Corrigir dados de clientes por rotinas automatizadas, sem acesso direto ao banco.', correct: true, consequence: 'Mantém as pessoas longe dos dados e reduz o erro humano.' },
        { id: 'b', text: 'Dar acesso de administrador a todo o time para acelerar as correções.', correct: false, consequence: 'Contraria o menor privilégio e a separação de funções.' },
        { id: 'c', text: 'Centralizar os registros de quem fez o quê em todas as contas.', correct: true, consequence: 'Dá rastreabilidade: cada ação pode ser investigada e alertada.' },
        { id: 'd', text: 'Desligar a criptografia em trânsito entre os serviços internos.', correct: false, consequence: 'O pilar pede proteger os dados em trânsito e em repouso.' },
        { id: 'e', text: 'Proteger só a borda da rede, confiando em tudo o que está dentro.', correct: false, consequence: 'O pilar pede segurança em todas as camadas, não só na borda.' },
      ],
      explanation: [
        'O pilar de segurança tem sete princípios: **base de identidade forte**, **rastreabilidade**, **segurança em todas as camadas**, **automatizar as boas práticas**, **proteger dados em trânsito e em repouso**, **manter as pessoas longe dos dados** e **preparar-se para incidentes**. Rotinas automatizadas no lugar de acesso direto e registros centralizados aplicam dois deles.',
        'Administrador para todos fere o menor privilégio. Desligar a criptografia em trânsito e confiar só na borda vão contra a proteção em todas as camadas.',
        '**Regra prática:** nas questões do domínio de segurança, procure menor privilégio, credenciais temporárias, rastreabilidade, criptografia e automação.',
      ],
    },
    {
      id: 'rv:arq.f01.m1.a1:i3',
      kind: 'decision',
      title: 'A loja que para com um servidor',
      prompt:
        'Uma loja virtual roda numa **única instância EC2 muito grande**. Quando ela falha, a loja inteira fica fora até alguém agir. Aplicando os princípios do pilar de **confiabilidade**, a empresa quer que a falha de um servidor **afete só parte da carga** e seja **recuperada sem intervenção**. Qual arquitetura atende?',
      concepts: [{ id: 'wa.pillar-reliability' }],
      xp: 5,
      difficulty: 1,
      domain: 'd2',
      options: [
        { id: 'a', text: 'Trocar a instância por uma ainda maior, com mais memória e processador.', correct: false, consequence: 'Continua sendo um ponto único de falha, agora mais caro.' },
        { id: 'b', text: 'Fazer snapshots do volume da instância a cada hora.', correct: false, consequence: 'Ajuda a restaurar, mas a loja continua parando até alguém agir.' },
        { id: 'c', text: 'Instâncias menores em várias AZs, num Auto Scaling atrás de um ALB.', correct: true, consequence: 'Uma falha atinge só uma instância, e o grupo a substitui sozinho.' },
        { id: 'd', text: 'Um alarme do CloudWatch que avisa o plantão sempre que a instância cair.', correct: false, consequence: 'Avisa mais rápido, mas a recuperação continua manual.' },
      ],
      explanation: [
        'Dois princípios do pilar de **confiabilidade** resolvem o caso: **escalar na horizontal**, trocando um recurso grande por vários pequenos para que uma falha afete só uma parte, e **recuperar automaticamente** de falhas. Várias instâncias em AZs diferentes num Auto Scaling atrás de um balanceador fazem as duas coisas.',
        'Uma instância maior mantém o ponto único de falha. Snapshots e alarmes ajudam, mas a recuperação continua dependendo de pessoas.',
        '**Regra prática:** confiabilidade é escala horizontal, recuperação automática e capacidade elástica; um servidor grande é ponto único de falha.',
      ],
    },
    {
      id: 'rv:arq.f01.m1.a2:p3',
      kind: 'decision',
      title: 'O plano de recuperação que nunca rodou',
      prompt:
        'Uma empresa tem um runbook para o failover do banco de dados, escrito há dois anos, que **nunca foi executado**. A diretoria quer descobrir **antes de um incidente real** onde o processo e as pessoas falham, sem afetar os clientes. Qual prática do Well-Architected atende?',
      concepts: [{ id: 'wa.general-principles' }, { id: 'wa.pillar-reliability' }],
      xp: 5,
      difficulty: 2,
      domain: 'd2',
      options: [
        { id: 'a', text: 'Revisar o texto do runbook com todo o time a cada trimestre.', correct: false, consequence: 'Ler o plano não mostra se ele funciona na prática.' },
        { id: 'b', text: 'Um game day simulando a queda do banco em ambiente de teste.', correct: true, consequence: 'O time executa o failover e descobre as falhas sem afetar clientes.' },
        { id: 'c', text: 'Aguardar a próxima falha real para validar o procedimento.', correct: false, consequence: 'Descobre os problemas na pior hora, com os clientes afetados.' },
        { id: 'd', text: 'Aumentar a classe da instância do banco para que ele falhe menos.', correct: false, consequence: 'Reduz a carga, mas não testa a recuperação quando a falha vier.' },
      ],
      explanation: [
        'O Well-Architected recomenda **testar os procedimentos de recuperação** (pilar de confiabilidade) e **melhorar com game days**, simulações de eventos de produção (princípios gerais). Na nuvem, um ambiente **do tamanho da produção** pode ser criado para o ensaio e desligado no fim.',
        'Ler o runbook não prova que ele funciona. Esperar a falha real transfere o teste para os clientes. Uma instância maior não exercita o processo.',
        '**Regra prática:** procedimento de recuperação que nunca foi executado não é confiável; ensaie com game days em ambiente parecido com a produção.',
      ],
    },
    {
      id: 'rv:arq.f01.m1.a1:i4',
      kind: 'decision',
      title: 'O banco que não acompanha o acesso',
      prompt:
        'Um site guarda as **sessões dos usuários** num banco relacional: cada leitura e gravação é por **chave**, sem junções, e o volume chega a dezenas de milhares de requisições por segundo nos picos. Aplicando a **simpatia mecânica** do pilar de eficiência de desempenho, qual mudança atende?',
      concepts: [{ id: 'wa.pillar-performance' }],
      xp: 5,
      difficulty: 2,
      domain: 'd3',
      options: [
        { id: 'a', text: 'Aumentar a classe da instância do banco relacional.', correct: false, consequence: 'Paga mais para continuar usando uma tecnologia que não combina com o acesso.' },
        { id: 'b', text: 'Criar réplicas de leitura do banco relacional.', correct: false, consequence: 'Ajuda leituras, mas as gravações por chave continuam no primário.' },
        { id: 'c', text: 'Guardar as sessões numa tabela do DynamoDB, por chave.', correct: true, consequence: 'Um banco chave-valor combina com o padrão de acesso e escala sozinho.' },
        { id: 'd', text: 'Mover o banco relacional para instâncias com mais rede.', correct: false, consequence: 'O gargalo é a tecnologia escolhida para o acesso, não a rede.' },
      ],
      explanation: [
        'A **simpatia mecânica** é usar a tecnologia que combina com o objetivo, como **escolher o banco pelo padrão de acesso**. Leituras e gravações por chave, sem junções e em grande volume, são o caso de um banco **chave-valor**, como o DynamoDB, gerenciado e escalável.',
        'Instância maior, réplicas e mais rede insistem na tecnologia errada para esse acesso e custam mais.',
        '**Regra prática:** no pilar de desempenho, escolha a tecnologia pelo padrão de acesso e prefira serviços gerenciados e serverless.',
      ],
    },
    {
      id: 'rv:arq.f01.global-em-minutos',
      kind: 'decision',
      title: 'Usuários do outro lado do mundo',
      prompt:
        'Um portal de cursos roda em us-east-1 e passou a ter muitos alunos na **Ásia**, que reclamam da demora para abrir vídeos e páginas, quase todos **conteúdo estático**. Aplicando o princípio de **ir global em minutos** do pilar de desempenho, qual mudança atende com o **menor esforço**?',
      concepts: [{ id: 'wa.pillar-performance' }],
      xp: 5,
      difficulty: 1,
      domain: 'd3',
      options: [
        { id: 'a', text: 'O CloudFront na frente do portal.', correct: true, consequence: 'O conteúdo estático passa a sair de locais perto dos alunos.' },
        { id: 'b', text: 'Uma cópia completa do portal numa Região da Ásia.', correct: false, consequence: 'Resolve a distância, mas duplica a operação para servir arquivos estáticos.' },
        { id: 'c', text: 'Instâncias maiores no portal de us-east-1.', correct: false, consequence: 'O atraso é a distância até os alunos, não a capacidade do servidor.' },
        { id: 'd', text: 'Um link do Direct Connect até a Ásia.', correct: false, consequence: 'Liga um data center à AWS; não aproxima o conteúdo dos alunos.' },
      ],
      explanation: [
        '**Ir global em minutos** é usar a infraestrutura mundial da AWS para chegar perto dos usuários sem construir nada. Para conteúdo estático, uma **CDN como o CloudFront** entrega os arquivos de locais próximos dos alunos, com pouco esforço.',
        'Uma Região nova duplica a carga e a operação. Instâncias maiores não encurtam a distância. O Direct Connect liga redes privadas à AWS.',
        '**Regra prática:** usuários distantes e conteúdo estático apontam para o CloudFront; uma Região nova só se a aplicação inteira precisar estar perto.',
      ],
    },
    {
      id: 'rv:arq.f01.ambientes-de-desenvolvimento',
      kind: 'decision',
      title: 'Ambientes ligados a semana inteira',
      prompt:
        'Os ambientes de **desenvolvimento** de uma empresa ficam ligados **24 horas por dia, 7 dias por semana**, mas o time só trabalha **40 horas por semana**. Aplicando o **modelo de consumo** do pilar de otimização de custos, qual mudança traz a **maior economia**?',
      concepts: [{ id: 'wa.pillar-cost' }],
      xp: 5,
      difficulty: 1,
      domain: 'd4',
      options: [
        { id: 'a', text: 'Comprar Savings Plans de três anos para os ambientes.', correct: false, consequence: 'Dá desconto, mas continua pagando 168 horas por semana de máquinas paradas.' },
        { id: 'b', text: 'Trocar as instâncias por tipos um pouco menores.', correct: false, consequence: 'Reduz o preço por hora, mas mantém 128 horas ociosas por semana.' },
        { id: 'c', text: 'Desligar os ambientes fora do horário de trabalho.', correct: true, consequence: 'Paga 40 horas em vez de 168, cerca de 75% a menos.' },
        { id: 'd', text: 'Mover os ambientes para uma Região mais barata.', correct: false, consequence: 'Muda pouco o preço e mantém tudo ligado sem uso.' },
      ],
      explanation: [
        'O **modelo de consumo** é pagar só pelo que se usa. Ambientes usados 40 horas por semana não precisam ficar ligados 168: desligá-los fora do horário economiza **cerca de 75%**, mais do que qualquer desconto sobre horas paradas.',
        'Savings Plans e instâncias menores reduzem o preço da hora, mas continuam pagando o tempo ocioso. A troca de Região muda pouco.',
        '**Regra prática:** recurso ocioso se desliga antes de se negociar desconto; compromisso de uso é para o que fica ligado o tempo todo.',
      ],
    },
    {
      id: 'rv:arq.f01.m1.a1:i5',
      kind: 'decision',
      title: 'Ninguém sabe quem gasta o quê',
      prompt:
        'A conta da AWS de uma empresa cresce todo mês, e **ninguém sabe qual time gasta o quê**. Aplicando o princípio de **analisar e atribuir os gastos** do pilar de otimização de custos, a diretoria quer que cada time veja o próprio custo. Quais medidas atendem? (Escolha DUAS.)',
      concepts: [{ id: 'wa.pillar-cost' }],
      xp: 5,
      difficulty: 2,
      domain: 'd4',
      multiple: true,
      options: [
        { id: 'a', text: 'Ativar tags de alocação de custos, como a tag do time.', correct: true, consequence: 'O custo de cada recurso marcado aparece por time nos relatórios.' },
        { id: 'b', text: 'Comprar instâncias reservadas para as cargas maiores.', correct: false, consequence: 'Reduz o custo, mas não mostra quem gasta o quê.' },
        { id: 'c', text: 'Separar os times em contas próprias numa organização.', correct: true, consequence: 'A conta de cada time mostra o gasto dele, com faturamento consolidado.' },
        { id: 'd', text: 'Desligar à noite os ambientes de desenvolvimento.', correct: false, consequence: 'Economiza, mas continua sem atribuir os gastos.' },
        { id: 'e', text: 'Trocar as instâncias pelas da geração mais nova.', correct: false, consequence: 'Melhora o preço por desempenho, sem atribuir custos.' },
      ],
      explanation: [
        '**Analisar e atribuir os gastos** é saber de onde vem cada custo para que cada time responda pelo seu. As formas na AWS são **tags de alocação de custos** nos recursos e **contas separadas** por time ou carga, com o faturamento consolidado da organização.',
        'Instâncias reservadas, desligar ambientes e trocar de geração aplicam outros princípios de custo, mas não atribuem os gastos.',
        '**Regra prática:** "saber quem gasta o quê" é tags de alocação de custos e contas por time; reduzir o gasto vem depois de enxergá-lo.',
      ],
    },
    {
      id: 'rv:arq.f01.m3.a1',
      kind: 'decision',
      title: 'Uma ferramenta interna que pode esperar',
      prompt:
        'Uma ferramenta **interna** de relatórios usa um banco RDS e **aceita ficar fora até um dia** e perder o trabalho do dia numa falha. O arquiteto propôs RDS **Multi-AZ** com uma réplica em **outra Região**. A diretoria quer a opção de **menor custo** que atenda ao requisito. Qual escolher?',
      concepts: [{ id: 'wa.tradeoffs' }],
      xp: 5,
      difficulty: 2,
      domain: 'd4',
      options: [
        { id: 'a', text: 'Manter a proposta: Multi-AZ e réplica em outra Região.', correct: false, consequence: 'Paga disponibilidade e recuperação que o requisito não pede.' },
        { id: 'b', text: 'RDS Multi-AZ, sem a réplica na outra Região.', correct: false, consequence: 'Mais barato que a proposta, mas ainda paga um standby que ninguém pediu.' },
        { id: 'c', text: 'Duas instâncias RDS em Regiões diferentes, ativas.', correct: false, consequence: 'É a opção mais cara e a mais distante do requisito.' },
        { id: 'd', text: 'RDS Single-AZ com os backups automáticos diários.', correct: true, consequence: 'Cumpre a tolerância de um dia com o menor custo.' },
      ],
      explanation: [
        'Melhorar um pilar costuma custar outro: mais **disponibilidade** sai mais **cara**. A decisão certa é a que **atende ao requisito do negócio sem ir além dele**. Uma carga interna que aceita um dia fora e a perda do dia é atendida por **Single-AZ com backups diários**.',
        'Multi-AZ e réplica em outra Região resolvem metas muito mais rígidas do que a pedida, e a conta acompanha.',
        '**Regra prática:** atenda ao requisito declarado; a solução mais resiliente está errada se o enunciado pede o menor custo que cumpre a meta.',
      ],
    },
    {
      id: 'rv:arq.f01.m3.a2:i2',
      kind: 'decision',
      title: 'O preço de acelerar as leituras',
      prompt:
        'Para reduzir a latência de uma API, o time propõe pôr um **cache do ElastiCache** na frente do banco de dados. A latência cai bastante nos testes. Antes de aprovar, o arquiteto quer saber qual **trade-off** a mudança traz para a carga. Qual é o efeito colateral mais direto?',
      concepts: [{ id: 'wa.tradeoffs' }],
      xp: 5,
      difficulty: 3,
      domain: 'd3',
      options: [
        { id: 'a', text: 'O banco deixa de ser durável, já que as leituras passam a ir ao cache.', correct: false, consequence: 'O banco continua sendo a fonte da verdade, com a mesma durabilidade.' },
        { id: 'b', text: 'Dados desatualizados no cache, com invalidação a cargo da aplicação.', correct: true, consequence: 'É o preço do desempenho: mais complexidade para manter o cache coerente.' },
        { id: 'c', text: 'A aplicação deixa de poder escalar na horizontal com mais instâncias.', correct: false, consequence: 'O cache não impede adicionar instâncias da aplicação.' },
        { id: 'd', text: 'A carga passa a precisar de uma segunda Região para o cache funcionar.', correct: false, consequence: 'O cache não cria nenhuma exigência de outra Região.' },
      ],
      explanation: [
        'Os pilares têm **trade-offs**: o cache melhora o **desempenho**, mas acrescenta **complexidade**. Os dados no cache podem ficar **desatualizados**, e a aplicação passa a decidir quando invalidar ou expirar cada item, além de operar mais um componente.',
        'O banco continua durável, a aplicação continua escalando na horizontal, e nada exige outra Região.',
        '**Regra prática:** cache troca latência por consistência e operação; aceite-o quando o requisito de desempenho justificar esse custo.',
      ],
    },
    {
      id: 'rv:arq.f01.m1.a3',
      kind: 'decision',
      title: 'Quanto custa a revisão',
      prompt:
        'Um diretor quer **revisar a arquitetura** de uma carga pelo Well-Architected e pergunta como isso funciona e quanto vai **custar**. A empresa quer começar já, com o **menor gasto**, e acompanhar os riscos ao longo do tempo. Qual resposta está correta?',
      concepts: [{ id: 'wa.framework' }, { id: 'wa.tool' }],
      xp: 5,
      difficulty: 1,
      domain: 'd2',
      options: [
        { id: 'a', text: 'É um serviço cobrado por carga revisada, contratado no console.', correct: false, consequence: 'A ferramenta não tem cobrança própria; paga-se só pelos recursos da carga.' },
        { id: 'b', text: 'É uma certificação que a AWS concede depois de auditar a conta toda.', correct: false, consequence: 'O framework não é certificação; é referência para revisar a carga.' },
        { id: 'c', text: 'Perguntas e boas práticas, respondidas na Well-Architected Tool.', correct: true, consequence: 'A revisão sai sem custo da ferramenta, e os riscos ficam registrados.' },
        { id: 'd', text: 'É um pacote de serviços que precisa ser implantado na conta.', correct: false, consequence: 'O framework são perguntas sobre a carga, não serviços para contratar.' },
      ],
      explanation: [
        'O **Well-Architected Framework** é um conjunto de **boas práticas** organizado em seis pilares, com princípios, perguntas e práticas, cada uma com um nível de risco. A **Well-Architected Tool**, no console, aplica essas perguntas a uma carga, aponta os riscos e monta o plano de melhoria, **sem cobrança própria**.',
        'Não é serviço cobrado, nem certificação, nem pacote de serviços: o trabalho é responder às perguntas e corrigir os riscos.',
        '**Regra prática:** "revisar uma carga contra as boas práticas e acompanhar os riscos" é a Well-Architected Tool; o framework são perguntas, não produtos.',
      ],
    },
    {
      id: 'rv:arq.f01.m2.a4',
      kind: 'decision',
      title: 'Um risco que a lei explica',
      prompt:
        'A revisão de uma carga na Well-Architected Tool aponta como **risco alto** a falta de uma segunda Região. A diretoria decidiu, por escrito, ficar numa Região só, porque a lei exige que os dados fiquem no país e só há uma Região nele. Qual é a forma recomendada de tratar esse risco?',
      concepts: [{ id: 'wa.risks' }, { id: 'wa.framework' }],
      xp: 5,
      difficulty: 2,
      domain: 'd2',
      options: [
        { id: 'a', text: 'Marcar a boa prática como seguida para limpar o relatório.', correct: false, consequence: 'O relatório passa a esconder um risco real da arquitetura.' },
        { id: 'b', text: 'Apagar a carga e criar outra sem essa pergunta respondida.', correct: false, consequence: 'Perde os marcos e o histórico, e o risco continua lá.' },
        { id: 'c', text: 'Registrar o motivo e a aprovação nas notas da carga.', correct: true, consequence: 'O risco fica explicado, e a próxima revisão sabe por que continua.' },
        { id: 'd', text: 'Pôr uma réplica numa Região de outro país mesmo assim.', correct: false, consequence: 'Fecha o risco técnico descumprindo a lei.' },
      ],
      explanation: [
        'Os **riscos altos e médios** da Well-Architected Tool são **orientações**. Quando um motivo técnico ou de negócio impede a boa prática, a AWS sugere **documentar o motivo e a aprovação** nas notas da carga, para que ele fique explicado nas próximas revisões.',
        'Marcar como seguida falseia o relatório. Apagar a carga leva junto os marcos. Uma réplica fora do país resolve o risco técnico violando a regra do negócio.',
        '**Regra prática:** risco que a empresa aceita conscientemente se documenta com o motivo e a aprovação; nunca se esconde.',
      ],
    },
    {
      id: 'rv:arq.f01.lente-propria',
      kind: 'decision',
      title: 'Os padrões internos na mesma revisão',
      prompt:
        'Uma empresa tem **padrões internos** de arquitetura (tags obrigatórias, Regiões permitidas, uso de criptografia) e quer revisá-los **junto com as perguntas do framework** em todas as cargas, inclusive nas de outras contas. O time de arquitetura quer escrever as perguntas **uma vez só**. Qual recurso da Well-Architected Tool atende?',
      concepts: [{ id: 'wa.lenses' }, { id: 'wa.tool' }],
      xp: 5,
      difficulty: 3,
      domain: 'd2',
      options: [
        { id: 'a', text: 'Uma lente personalizada, compartilhada com as outras contas.', correct: true, consequence: 'As perguntas da empresa entram ao lado das do framework em cada carga.' },
        { id: 'b', text: 'Uma lente do catálogo da AWS, editada para os padrões.', correct: false, consequence: 'As lentes do catálogo são mantidas pela AWS; não se editam.' },
        { id: 'c', text: 'Remover a lente do framework e usar só uma planilha interna.', correct: false, consequence: 'As perguntas gerais somem, e a planilha fica fora da ferramenta.' },
        { id: 'd', text: 'Um perfil da carga com a lista de padrões internos nas notas.', correct: false, consequence: 'O perfil prioriza perguntas existentes; não cria perguntas novas.' },
      ],
      explanation: [
        'Uma **lente** é um conjunto próprio de perguntas e boas práticas. A lente do framework entra sozinha em toda carga; as do **catálogo** são mantidas pela AWS; as **personalizadas** são escritas pela empresa e podem ser **compartilhadas** com outras contas. Assim, os padrões internos são revisados ao lado do framework.',
        'Lentes do catálogo não são editáveis. Remover a lente do framework perde as perguntas gerais. O perfil descreve o contexto do negócio e prioriza perguntas, sem criar novas.',
        '**Regra prática:** perguntas de um tipo de carga já mantidas pela AWS são lente do catálogo; padrões próprios da empresa são lente personalizada.',
      ],
    },
    {
      id: 'rv:arq.f01.m1.a1:i1',
      kind: 'decision',
      title: 'Implantações que ninguém consegue desfazer',
      prompt:
        'Uma empresa publica uma **versão grande por mês**, com centenas de mudanças juntas, e cada implantação com problema leva **horas para desfazer**. Aplicando o pilar de **excelência operacional** do Well-Architected, qual mudança no processo atende?',
      concepts: [{ id: 'wa.pillar-ops' }],
      xp: 5,
      difficulty: 2,
      domain: 'd2',
      options: [
        { id: 'a', text: 'Juntar as mudanças numa versão a cada três meses, mais testada.', correct: false, consequence: 'Versões ainda maiores ficam ainda mais difíceis de desfazer.' },
        { id: 'b', text: 'Exigir aprovação da diretoria antes de cada implantação em produção.', correct: false, consequence: 'Atrasa as mudanças, mas não as torna menores nem reversíveis.' },
        { id: 'c', text: 'Mudanças pequenas e frequentes, com pipeline e reversão automática.', correct: true, consequence: 'Cada mudança tem pouco impacto e é desfeita em minutos.' },
        { id: 'd', text: 'Aplicar as mudanças direto nos servidores, à mão, fora do horário.', correct: false, consequence: 'Sem automação, as mudanças ficam mais arriscadas e difíceis de rastrear.' },
      ],
      explanation: [
        'O pilar de **excelência operacional** recomenda **mudanças pequenas, frequentes e reversíveis**, aplicadas com automação segura, além de observabilidade e aprender com os eventos. Uma mudança pequena tem impacto limitado e é desfeita rápido.',
        'Versões maiores e mais raras pioram o problema. Aprovações não mudam o tamanho das mudanças. Alterações manuais nos servidores vão contra a automação.',
        '**Regra prática:** implantação difícil de desfazer pede mudanças menores, mais frequentes e automatizadas, com reversão pronta.',
      ],
    },
    {
      id: 'rv:arq.f01.m1.a1:i6',
      kind: 'decision',
      title: 'Servidores quase ociosos',
      prompt:
        'Uma empresa tem **dez servidores** que passam o dia com cerca de **10% de uso**, cada um com uma aplicação pequena. A meta é reduzir a **energia gasta** pela carga, seguindo o pilar de **sustentabilidade**, e também o custo. Qual mudança atende?',
      concepts: [{ id: 'wa.pillar-sustainability' }],
      xp: 5,
      difficulty: 1,
      domain: 'd4',
      options: [
        { id: 'a', text: 'Trocar os dez servidores por modelos maiores e mais novos.', correct: false, consequence: 'Mantém dez máquinas quase paradas, agora maiores.' },
        { id: 'b', text: 'Consolidar as aplicações em menos servidores.', correct: true, consequence: 'Menos máquinas ligadas gastam menos energia base e custam menos.' },
        { id: 'c', text: 'Manter os dez servidores para ter folga nos picos.', correct: false, consequence: 'Paga e gasta energia com capacidade que fica ociosa o dia todo.' },
        { id: 'd', text: 'Mover os dez servidores para outra Região.', correct: false, consequence: 'Muda o lugar, mas a utilização continua baixa.' },
      ],
      explanation: [
        'Um dos princípios do pilar de **sustentabilidade** é **maximizar a utilização**. Cada máquina ligada tem um consumo base: dois servidores a 30% gastam mais energia que um a 60%. Consolidar as aplicações em menos servidores reduz a energia e, junto, o custo.',
        'Máquinas maiores ou mais folga mantêm a capacidade ociosa. Trocar de Região não muda a utilização.',
        '**Regra prática:** sustentabilidade na prova aparece junto de custo: utilização alta, serviços gerenciados e nada ligado sem uso.',
      ],
    },
  ],
}
