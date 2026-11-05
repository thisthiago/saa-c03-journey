/**
 * Questões da Revisão da Fase 4 de Análise de dados (governança do data
 * lake), no formato do exame SAA-C03. Fatos conferidos em
 * docs.aws.amazon.com (ver docs/VERIFICACAO-DE-CONTEUDO.md). As empresas são
 * fictícias.
 */
import type { ReviewSet } from '../../../../engine/types'

export const REVIEW_F04: ReviewSet = {
  phaseId: 'ana.f04',
  questions: [
    {
      id: 'rv:ana.f04.m1.a1',
      kind: 'decision',
      title: 'Trinta políticas de bucket',
      prompt:
        'Uma cooperativa controla o acesso ao data lake com **trinta políticas de bucket**, uma por equipe e por serviço, e mesmo assim não consegue esconder colunas. Ela quer **uma regra única por tabela e por coluna**, que valha igual no Athena, no EMR e no Glue. Qual solução atende?',
      concepts: [{ id: 'lf.what' }],
      xp: 5,
      difficulty: 1,
      domain: 'd1',
      options: [
        { id: 'a', text: 'Mais políticas de bucket, com prefixos por tabela.', correct: false, consequence: 'Políticas de bucket enxergam objetos e prefixos, não colunas, e continuam espalhadas por serviço.' },
        { id: 'b', text: 'O Lake Formation, com permissões nas tabelas do catálogo.', correct: true, consequence: 'A mesma concessão, por tabela e coluna, vale em todos os serviços integrados.' },
        { id: 'c', text: 'Uma cópia de cada tabela para cada equipe, sem as colunas proibidas.', correct: false, consequence: 'Multiplica os dados, o trabalho de sincronizar e as chances de vazamento.' },
        { id: 'd', text: 'Políticas do IAM com condições por prefixo do S3 em cada role.', correct: false, consequence: 'Também não chegam ao nível de coluna e continuam presas aos arquivos.' },
      ],
      explanation: [
        'O **Lake Formation** centraliza as permissões do data lake com GRANT e REVOKE, como num banco de dados: quem lê cada banco, tabela, **coluna e linha** do Data Catalog. As regras valem para Athena, Redshift Spectrum, EMR, Glue e Amazon Quick, sem uma política de bucket para cada caso.',
        'Políticas de bucket e do IAM trabalham com objetos e prefixos, não com colunas. Cópias por equipe multiplicam dados e riscos.',
        '**Regra prática:** "permissões por tabela, coluna ou linha, iguais em vários serviços de análise" é Lake Formation. Ele complementa o IAM, não o substitui.',
      ],
    },
    {
      id: 'rv:ana.f04.permissoes-da-regiao',
      kind: 'decision',
      title: 'O teste de recuperação em us-west-2',
      prompt:
        'Uma empresa replica o data lake e o catálogo de us-east-1 para us-west-2, para continuar as análises se a Região principal ficar fora. Num teste de recuperação, os analistas abrem o Athena em us-west-2, e as consultas às tabelas governadas são **negadas**, embora funcionem em us-east-1 com as mesmas roles. O que falta para a recuperação funcionar?',
      concepts: [{ id: 'lf.what' }],
      xp: 5,
      difficulty: 2,
      domain: 'd2',
      options: [
        { id: 'a', text: 'Conceder as permissões do Lake Formation também em us-west-2.', correct: true, consequence: 'As permissões valem só na Região em que foram concedidas; em us-west-2, elas precisam existir lá.' },
        { id: 'b', text: 'Copiar as políticas do IAM das roles para us-west-2.', correct: false, consequence: 'O IAM é global: as políticas já valem em todas as Regiões.' },
        { id: 'c', text: 'Esperar a replicação terminar, porque as permissões vêm junto com os dados.', correct: false, consequence: 'Replicar os dados e o catálogo não leva as concessões do Lake Formation.' },
        { id: 'd', text: 'Dar aos analistas acesso direto ao bucket de us-west-2.', correct: false, consequence: 'Contornaria os filtros do Lake Formation em vez de reproduzi-los.' },
      ],
      explanation: [
        'As permissões do Lake Formation **valem só na Região em que foram concedidas**. Replicar os dados e o catálogo para us-west-2 não leva as concessões: elas precisam ser feitas também lá, para que o plano de recuperação funcione com os mesmos filtros.',
        'O IAM é global e já vale em us-west-2. Os dados replicados não trazem as permissões. E acesso direto ao bucket desfaz a governança.',
        '**Regra prática:** num plano multirregião para o data lake, inclua as permissões do Lake Formation em cada Região, além dos dados e do catálogo.',
      ],
    },
    {
      id: 'rv:ana.f04.m1.a2',
      kind: 'decision',
      title: 'Concessão feita e consulta negada',
      prompt:
        'Uma analista recebeu **SELECT na tabela de contratos pelo Lake Formation**, mas o Athena nega a consulta. A role dela **não tem nenhuma permissão do Athena nem do Glue no IAM**. O local do S3 está registrado no Lake Formation. O que falta para a consulta funcionar?',
      concepts: [{ id: 'lf.two-checks' }],
      xp: 5,
      difficulty: 1,
      domain: 'd1',
      options: [
        { id: 'a', text: 'Permissões do IAM para o Athena e o catálogo do Glue.', correct: true, consequence: 'Com o IAM e o Lake Formation liberando, as duas verificações passam e a consulta roda.' },
        { id: 'b', text: 'Nada: o Lake Formation substitui o IAM, e o erro é do Athena.', correct: false, consequence: 'O Lake Formation complementa o IAM; os dois precisam liberar.' },
        { id: 'c', text: 's3:GetObject no bucket inteiro para a analista.', correct: false, consequence: 'Abriria os arquivos por fora do Lake Formation, sem os filtros, e ainda faltariam as APIs do Athena.' },
        { id: 'd', text: 'Uma segunda concessão de SELECT, agora no banco inteiro.', correct: false, consequence: 'Mais permissão no Lake Formation não resolve a falta de permissão no IAM.' },
      ],
      explanation: [
        'O acesso a uma tabela governada passa por **duas verificações**: o **IAM** libera o uso das APIs (Athena, Glue, Lake Formation), e o **Lake Formation** libera os bancos, as tabelas e os dados. A analista tem a segunda, mas não a primeira; faltando qualquer uma, o acesso é negado.',
        'O Lake Formation não substitui o IAM. Dar acesso direto ao S3 contornaria os filtros. E mais concessões no Lake Formation não suprem o IAM.',
        '**Regra prática:** no Lake Formation, o IAM diz "pode usar o serviço", e o Lake Formation diz "pode ver estes dados". Os dois precisam dizer sim.',
      ],
    },
    {
      id: 'rv:lf.register:2',
      kind: 'decision',
      title: 'O CPF baixado direto do S3',
      prompt:
        'O Lake Formation esconde a coluna de CPF dos analistas no Athena. Mas a role dos analistas também tem **s3:GetObject no bucket inteiro** do data lake, e um deles baixou os arquivos Parquet e **leu o CPF**. A empresa quer que os analistas consultem as tabelas **só com os filtros** do Lake Formation. Qual mudança atende?',
      concepts: [{ id: 'lf.register' }, { id: 'lf.two-checks' }],
      xp: 5,
      difficulty: 3,
      domain: 'd1',
      options: [
        { id: 'a', text: 'Criptografar o bucket com SSE-KMS e manter o s3:GetObject.', correct: false, consequence: 'Com permissão de leitura e de uso da chave, a pessoa continua baixando o arquivo inteiro.' },
        { id: 'b', text: 'Criar mais um filtro de dados sem o CPF.', correct: false, consequence: 'Os filtros valem nas consultas pelos serviços integrados, não no download direto do S3.' },
        { id: 'c', text: 'Ligar o versionamento do bucket do data lake.', correct: false, consequence: 'O versionamento guarda versões dos objetos; não controla quem lê.' },
        { id: 'd', text: 'Tirar dos analistas o acesso direto ao bucket.', correct: true, consequence: 'O Athena lê os arquivos com credenciais temporárias do Lake Formation, e os filtros passam a valer sempre.' },
      ],
      explanation: [
        'Com o local do S3 **registrado**, o Lake Formation confere a permissão e entrega ao serviço de consulta **credenciais temporárias** para ler os arquivos (o chamado credential vending), aplicando os filtros. O analista **não precisa de acesso direto ao S3**. Se ele tiver s3:GetObject no bucket, pode baixar os arquivos inteiros e contornar os filtros.',
        'Criptografia não impede quem tem permissão de ler. Filtros não valem para o download direto. E versionamento não é controle de acesso.',
        '**Regra prática:** num data lake governado, as pessoas não recebem leitura direta no bucket; quem lê o S3 é o serviço, com credenciais do Lake Formation.',
      ],
    },
    {
      id: 'rv:lf.register:1',
      kind: 'decision',
      title: 'Concessões que não chegam aos arquivos',
      prompt:
        'Uma equipe concedeu tabelas e colunas no Lake Formation e tirou dos analistas o acesso direto ao S3, como manda a boa prática. Agora as consultas do Athena falham com **acesso negado aos arquivos do S3**, embora as permissões do IAM e do Lake Formation estejam corretas. O que **falta configurar**?',
      concepts: [{ id: 'lf.register' }],
      xp: 5,
      difficulty: 2,
      domain: 'd1',
      options: [
        { id: 'a', text: 'Devolver aos analistas o s3:GetObject no bucket inteiro.', correct: false, consequence: 'Faria as consultas funcionarem, mas reabriria o caminho para contornar os filtros.' },
        { id: 'b', text: 'Registrar no Lake Formation o caminho do S3.', correct: true, consequence: 'O caminho e as pastas abaixo dele passam a ser governados, e o Lake Formation fornece as credenciais ao Athena.' },
        { id: 'c', text: 'Ligar o versionamento do bucket do data lake.', correct: false, consequence: 'O versionamento não tem relação com o fornecimento de credenciais.' },
        { id: 'd', text: 'Rodar um crawler do Glue sobre as tabelas.', correct: false, consequence: 'As tabelas já existem no catálogo; o que falta é o Lake Formation governar o local dos dados.' },
      ],
      explanation: [
        'Para o Lake Formation controlar os dados, o **caminho do S3 precisa estar registrado** nele. A partir daí, os serviços integrados recebem do Lake Formation **credenciais temporárias** para ler só o que a pessoa pode ver. Sem o registro, ninguém fornece essas credenciais, e, sem o acesso direto, a leitura falha. Registrar um caminho registra também as pastas abaixo dele.',
        'Devolver o acesso direto desfaz a proteção. Versionamento e crawler não resolvem o fornecimento de credenciais.',
        '**Regra prática:** antes de governar dados com o Lake Formation, registre o local do S3. O registro pode ser no modo híbrido, que aceita também as políticas do IAM.',
      ],
    },
    {
      id: 'rv:ana.f04.m2.a1',
      kind: 'decision',
      title: 'Gerências regionais e o CPF',
      prompt:
        'Numa tabela de contratos, cada **gerência regional** deve ver **só as linhas da própria região** e **nenhuma delas pode ver a coluna de CPF**, consultando pelo Athena a **mesma tabela**, sem cópias. Qual solução atende?',
      concepts: [{ id: 'lf.fine-grained' }],
      xp: 5,
      difficulty: 2,
      domain: 'd1',
      options: [
        { id: 'a', text: 'Filtros de dados do Lake Formation, por região e sem o CPF.', correct: true, consequence: 'Cada gerência recebe o filtro da sua região, que esconde as outras linhas e o CPF na mesma tabela.' },
        { id: 'b', text: 'Uma tabela por região, sem a coluna de CPF, gerada toda noite.', correct: false, consequence: 'Cria cópias que o requisito proíbe, além de um processo para mantê-las.' },
        { id: 'c', text: 'Condições nas políticas do IAM com o nome da região de cada gerência.', correct: false, consequence: 'O IAM não filtra linhas nem colunas de uma tabela.' },
        { id: 'd', text: 'Uma visão do Athena por região, sem o CPF, com acesso à tabela original.', correct: false, consequence: 'Com acesso à tabela original, a gerência pode consultá-la direto e ver tudo.' },
      ],
      explanation: [
        'O Lake Formation limita o que cada pessoa vê **por coluna, por linha ou por célula**, combinando as duas coisas. A regra é um **filtro de dados**, concedido junto com a permissão de leitura: aqui, a condição de região nas linhas e a exclusão do CPF nas colunas, um filtro por gerência, sobre a mesma tabela.',
        'Tabelas por região são cópias. O IAM não enxerga linhas nem colunas. E visões não protegem a tabela de quem também tem acesso a ela.',
        '**Regra prática:** "esconder colunas e limitar linhas por usuário, sem cópias" é filtro de dados do Lake Formation.',
      ],
    },
    {
      id: 'rv:ana.f04.copias-por-regiao',
      kind: 'decision',
      title: 'Doze cópias geradas toda noite',
      prompt:
        'Para que cada gerente veja só a própria região, uma empresa mantém **12 cópias** de uma tabela de vendas de 8 TB, uma por região, geradas toda noite por um job do Glue. O **armazenamento e o job** custam caro, e as cópias às vezes saem diferentes. A empresa quer **reduzir o custo** mantendo a restrição por região. Qual solução atende?',
      concepts: [{ id: 'lf.fine-grained' }],
      xp: 5,
      difficulty: 2,
      domain: 'd4',
      options: [
        { id: 'a', text: 'Mover as 12 cópias para a S3 Intelligent-Tiering.', correct: false, consequence: 'Barateia um pouco o armazenamento, mas mantém as cópias, o job e as diferenças.' },
        { id: 'b', text: 'Uma tabela só, com filtros do Lake Formation por região.', correct: true, consequence: 'Acaba com as cópias e com o job noturno, e cada gerente continua vendo só a sua região.' },
        { id: 'c', text: 'Dar mais DPU ao job do Glue, para gerar as cópias mais rápido.', correct: false, consequence: 'O job fica mais rápido, mas o custo das cópias continua.' },
        { id: 'd', text: 'Gerar as cópias uma vez por semana em vez de toda noite.', correct: false, consequence: 'Reduz o custo do job, mas os gerentes passam a ver dados de até uma semana atrás.' },
      ],
      explanation: [
        'Copiar a tabela por região é o erro que os **filtros de dados** do Lake Formation evitam: com um filtro de linhas por região, uma **tabela só** atende a todos os gerentes. Acabam o armazenamento das 12 cópias, o job que as gera e as diferenças entre elas.',
        'Mudar a classe do S3, acelerar o job ou gerar menos vezes mantém as cópias e os problemas, ou cria outros.',
        '**Regra prática:** cópia de tabela só para esconder linhas ou colunas é custo desnecessário. Use filtros do Lake Formation sobre a tabela original.',
      ],
    },
    {
      id: 'rv:ana.f04.m2.a3',
      kind: 'decision',
      title: 'Tabelas novas com CPF toda semana',
      prompt:
        'O catálogo de uma empresa tem **três mil tabelas**, e toda semana surgem tabelas novas com colunas de CPF. Conceder coluna por coluna a cada equipe não dá conta, e as tabelas novas ficam sem regra por dias. A empresa quer que **as tabelas novas já nasçam com o acesso certo**. Qual solução atende?',
      concepts: [{ id: 'lf.tags' }],
      xp: 5,
      difficulty: 1,
      domain: 'd1',
      options: [
        { id: 'a', text: 'Conceder tabela por tabela, com uma equipe dedicada a isso.', correct: false, consequence: 'É o trabalho que não escala, e as tabelas novas continuam esperando.' },
        { id: 'b', text: 'Usar tags do IAM nas tabelas, com condições nas políticas das equipes.', correct: false, consequence: 'Tags do IAM e LF-Tags são coisas diferentes, e uma não vale pela outra.' },
        { id: 'c', text: 'LF-Tags de classificação nas colunas, concedidas às equipes.', correct: true, consequence: 'Quem recebe a tag lê o que tem a tag, inclusive tabelas criadas depois com a classificação certa.' },
        { id: 'd', text: 'Um filtro de dados para cada tabela nova, criado toda semana.', correct: false, consequence: 'Volta ao trabalho tabela por tabela, só que com filtros.' },
      ],
      explanation: [
        'As **LF-Tags** são pares chave-valor, como classificacao=sensivel, ligados a bancos, tabelas e colunas. A permissão é dada **à tag**: quem recebe classificacao=publico lê tudo o que tem essa tag, **inclusive objetos criados depois**. A AWS recomenda esse método quando há muitos objetos no catálogo.',
        'Concessões ou filtros tabela por tabela não escalam. E tags do IAM não são LF-Tags.',
        '**Regra prática:** "milhares de tabelas, inclusive as novas" pede LF-Tags. Classifique os objetos e conceda as classificações, não os objetos.',
      ],
    },
    {
      id: 'rv:ana.f04.m2.a2',
      kind: 'decision',
      title: 'O que a tag pública libera',
      prompt:
        'O marketing recebeu no Lake Formation a LF-Tag **classificacao=publico**, com permissão de leitura, em us-east-1. As tabelas e colunas estão classificadas com LF-Tags, e o acesso já é governado só pelo Lake Formation. Quais recursos o marketing **passa a ler** pelo Athena em us-east-1? (Escolha DUAS.)',
      concepts: [{ id: 'lf.tags' }],
      xp: 5,
      difficulty: 3,
      domain: 'd1',
      multiple: true,
      options: [
        { id: 'a', text: 'Uma tabela com a tag classificacao=publico, criada ontem.', correct: true, consequence: 'A tag concedida está na tabela, e a leitura é liberada.' },
        { id: 'b', text: 'Uma tabela criada no mês que vem com a tag classificacao=publico.', correct: true, consequence: 'A concessão por tag vale também para objetos criados depois com a mesma tag.' },
        { id: 'c', text: 'Uma coluna com a tag classificacao=interno, numa tabela pública.', correct: false, consequence: 'A coluna tem outro valor de tag e fica oculta para quem só recebeu publico.' },
        { id: 'd', text: 'Uma tabela com a tag do IAM classificacao=publico e nenhuma LF-Tag.', correct: false, consequence: 'Tag do IAM não é LF-Tag; a concessão do Lake Formation não a enxerga.' },
        { id: 'e', text: 'Uma tabela que só tem a tag classificacao=interno.', correct: false, consequence: 'O valor da tag é outro; a concessão libera só os recursos com o valor concedido.' },
      ],
      explanation: [
        'A concessão por **LF-Tag** libera **os recursos com o valor concedido**, agora e no futuro: a tabela de ontem e a do mês que vem, ambas com classificacao=publico. Dentro de uma tabela pública, uma coluna com classificacao=interno fica **oculta**, porque a tag da coluna é outra.',
        'Uma tag do IAM, ainda que com o mesmo texto, não é uma LF-Tag. E uma tabela com outro valor de tag continua fechada.',
        '**Regra prática:** com LF-Tags, a pergunta é sempre "o recurso tem a tag e o valor concedidos?". Tags do IAM e valores diferentes não contam, e as permissões valem na Região em que foram concedidas.',
      ],
    },
    {
      id: 'rv:ana.f04.m3.a2',
      kind: 'decision',
      title: 'Começar o Lake Formation sem parar ninguém',
      prompt:
        'Três equipes usam o data lake há anos **só com políticas do IAM** e **não podem parar**. A empresa quer começar a usar o Lake Formation **pelo marketing**, para esconder colunas dele, deixando as outras equipes como estão. Qual abordagem atende?',
      concepts: [{ id: 'lf.default-hybrid' }],
      xp: 5,
      difficulty: 2,
      domain: 'd2',
      options: [
        { id: 'a', text: 'Tirar o IAMAllowedPrincipals de todas as tabelas de uma vez.', correct: false, consequence: 'As concessões passam a valer, mas as equipes antigas perdem o acesso no mesmo dia.' },
        { id: 'b', text: 'Conceder colunas ao marketing e manter a configuração padrão.', correct: false, consequence: 'Com o IAMAllowedPrincipals ainda com permissão total, o acesso continua só pelo IAM, e o marketing vê tudo.' },
        { id: 'c', text: 'Esperar que as quatro equipes migrem juntas para o Lake Formation.', correct: false, consequence: 'O marketing continua vendo as colunas sensíveis enquanto isso.' },
        { id: 'd', text: 'Usar o modo híbrido, incluindo só o marketing no Lake Formation.', correct: true, consequence: 'O marketing passa a depender das concessões do Lake Formation, e as outras equipes seguem só com o IAM.' },
      ],
      explanation: [
        'Por compatibilidade com o Glue, o Lake Formation começa com o grupo **IAMAllowedPrincipals** com permissão total: o acesso fica só com o IAM, e as concessões não têm efeito. O **modo híbrido** liga o Lake Formation para quem é incluído (que passa a precisar das permissões do IAM e do Lake Formation), sem mudar o acesso dos demais.',
        'Tirar o IAMAllowedPrincipals de tudo derruba as equipes antigas. Manter a configuração padrão deixa as concessões sem efeito. E esperar todos mantém o problema.',
        '**Regra prática:** para adotar o Lake Formation aos poucos, um caso de uso por vez, use o modo híbrido. Se as concessões "não funcionam", desconfie do IAMAllowedPrincipals.',
      ],
    },
    {
      id: 'rv:ana.f04.m3.a3',
      kind: 'decision',
      title: 'A seguradora de fora da organização',
      prompt:
        'Uma seguradora parceira, em outra conta e **fora da organização** da cooperativa, quer consultar região, produto e valor dos contratos, **sem o CPF** e **sem receber cópias** dos dados. A cooperativa quer manter o controle sobre o que é compartilhado. Qual solução atende?',
      concepts: [{ id: 'lf.cross-account' }],
      xp: 5,
      difficulty: 2,
      domain: 'd1',
      options: [
        { id: 'a', text: 'Conceder à seguradora as colunas permitidas pelo Lake Formation.', correct: true, consequence: 'O compartilhamento usa o AWS RAM; fora da organização, a seguradora aceita o convite e consulta sem cópia.' },
        { id: 'b', text: 'Copiar a tabela sem o CPF para um bucket da seguradora.', correct: false, consequence: 'Cria uma cópia que a cooperativa não controla mais.' },
        { id: 'c', text: 'Abrir o bucket para a conta da seguradora com uma política de bucket.', correct: false, consequence: 'A seguradora leria os arquivos inteiros, inclusive o CPF.' },
        { id: 'd', text: 'Exportar a consulta toda semana e enviar os arquivos à seguradora.', correct: false, consequence: 'São cópias periódicas, fora do controle da cooperativa e sempre atrasadas.' },
      ],
      explanation: [
        'O Lake Formation **compartilha bancos e tabelas com outras contas sem copiar os dados**, mantendo os filtros por coluna e por linha. Por baixo, usa o **AWS RAM**: dentro da mesma organização, o compartilhamento vale na hora; **fora dela, a outra conta precisa aceitar o convite**.',
        'Copiar ou exportar cria dados fora do controle da cooperativa. Uma política de bucket entrega os arquivos inteiros, com o CPF.',
        '**Regra prática:** "compartilhar tabelas do data lake com outra conta, sem cópias e com colunas ocultas" é o compartilhamento entre contas do Lake Formation.',
      ],
    },
  ],
}
