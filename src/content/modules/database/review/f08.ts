/**
 * Questões da Revisão da Fase 8 de Bancos de dados (Segurança e backup), no
 * formato do exame SAA-C03. Fatos conferidos em 21/10/2026 e 03/11/2026 (ver
 * docs/VERIFICACAO-DE-CONTEUDO.md). As empresas são fictícias.
 */
import type { ReviewSet } from '../../../../engine/types'

export const REVIEW_F08: ReviewSet = {
  phaseId: 'db.f08',
  questions: [
    {
      id: 'rv:db.f08.m1.a3',
      kind: 'decision',
      title: 'Cada corretor vendo só as próprias cotações',
      prompt:
        'Uma tabela de cotações do DynamoDB usa a chave de partição `corretorId`. Cada corretor entra no aplicativo com a **própria identidade**, que recebe credenciais temporárias do IAM. A segurança exige que **um corretor nunca consiga ler as cotações de outro**, mesmo que o aplicativo tenha um erro. Qual solução atende?',
      concepts: [{ id: 'db.private-access' }],
      xp: 5,
      difficulty: 2,
      domain: 'd1',
      options: [
        { id: 'a', text: 'Filtrar no aplicativo as cotações que não são do corretor.', correct: false, consequence: 'Os dados dos outros corretores ainda chegam ao aplicativo, e um erro de código os expõe.' },
        { id: 'b', text: 'Criar uma tabela para cada corretor, com o nome igual ao id.', correct: false, consequence: 'Milhares de tabelas e políticas para resolver o que uma condição resolve.' },
        { id: 'c', text: 'Uma política IAM com a condição dynamodb:LeadingKeys igual ao id do corretor.', correct: true, consequence: 'O próprio DynamoDB recusa o acesso a itens com outra chave de partição.' },
        { id: 'd', text: 'Um índice global por corretorId, consultado pelo aplicativo.', correct: false, consequence: 'O índice muda como os dados são consultados, não quem pode lê-los.' },
      ],
      explanation: [
        'A condição **dynamodb:LeadingKeys** numa política IAM restringe o acesso aos itens cuja **chave de partição** é a do próprio usuário. A regra é aplicada pelo DynamoDB, então um erro no aplicativo não expõe dados de outro corretor.',
        'Filtrar no aplicativo depende do código estar certo. Uma tabela por corretor não escala. Um índice não controla acesso.',
        '**Regra prática:** isolamento por usuário numa tabela compartilhada do DynamoDB é dynamodb:LeadingKeys na política IAM.',
      ],
    },
    {
      id: 'rv:db.f08.m1.a1:app',
      kind: 'decision',
      title: 'Um banco privado que a VPC inteira alcança',
      prompt:
        'Uma auditoria revisou um RDS for PostgreSQL de apólices: ele está em **subnets privadas**, com **Public access desligado**, mas o security group aceita a porta 5432 de **10.0.0.0/16, a VPC inteira**, onde também rodam ferramentas de outras equipes. A exigência é que **só a camada de aplicação** alcance o banco. Qual mudança atende?',
      concepts: [{ id: 'db.private-access' }],
      xp: 5,
      difficulty: 2,
      domain: 'd1',
      options: [
        { id: 'a', text: 'Trocar a regra por uma que aceita o security group da aplicação.', correct: true, consequence: 'Só as instâncias com o security group da aplicação chegam ao banco, mesmo que mudem de IP.' },
        { id: 'b', text: 'Ligar a criptografia em repouso na instância de apólices.', correct: false, consequence: 'Protege os dados guardados, mas qualquer origem da VPC continua conectando.' },
        { id: 'c', text: 'Mover o banco para uma subnet privada em outra AZ.', correct: false, consequence: 'A regra de 10.0.0.0/16 continua valendo para a VPC inteira.' },
        { id: 'd', text: 'Ligar o rds.force_ssl para exigir TLS nas conexões.', correct: false, consequence: 'As conexões passam a ser criptografadas, mas continuam vindo de qualquer lugar da VPC.' },
      ],
      explanation: [
        'O banco privado ainda precisa de um **security group restrito**. Uma regra que aceita **o security group da aplicação** como origem libera só as instâncias dessa camada, mesmo quando o Auto Scaling troca os IPs.',
        'Criptografia em repouso e TLS protegem os dados, não definem quem conecta. Trocar de subnet não muda a regra do security group.',
        '**Regra prática:** banco em subnets privadas, acesso público desligado e security group aceitando só o security group da aplicação.',
      ],
    },
    {
      id: 'rv:db.f08.m2.a2',
      kind: 'decision',
      title: 'Criptografar um banco em uso com pouca parada',
      prompt:
        'Um RDS for MySQL de produção foi criado **sem criptografia em repouso**, e uma norma nova exige criptografá-lo com uma chave do KMS. O banco recebe gravações o dia todo, e a empresa quer a **menor parada possível** na troca. Qual caminho atende?',
      concepts: [{ id: 'db.encryption-at-rest' }],
      xp: 5,
      difficulty: 3,
      domain: 'd1',
      options: [
        { id: 'a', text: 'Ligar a criptografia na instância, na próxima janela de manutenção.', correct: false, consequence: 'Não existe opção para ligar a criptografia numa instância que já existe.' },
        { id: 'b', text: 'Criar uma réplica de leitura criptografada e promovê-la depois.', correct: false, consequence: 'Réplica e origem precisam ter o mesmo estado de criptografia: a réplica sairia sem criptografia.' },
        { id: 'c', text: 'Uma implantação Blue/Green com o ambiente verde criptografado.', correct: true, consequence: 'O verde nasce criptografado, acompanha as gravações e a troca leva pouco tempo.' },
        { id: 'd', text: 'Ligar o rds.force_ssl e reiniciar a instância de produção.', correct: false, consequence: 'O TLS protege o tráfego, não os dados guardados no disco.' },
      ],
      explanation: [
        'A criptografia em repouso do RDS **só é escolhida na criação**. Para um banco existente, há dois caminhos: snapshot, cópia criptografada e restauração numa instância nova, que perde as gravações feitas depois do snapshot, ou uma **implantação Blue/Green** com o **ambiente verde criptografado**, que acompanha as gravações e troca em pouco tempo.',
        'Não há como ligar a criptografia na instância. Uma réplica tem o mesmo estado de criptografia da origem. E TLS é criptografia em trânsito.',
        '**Regra prática:** criptografar RDS existente é criar outro já criptografado, por snapshot copiado ou Blue/Green; com o critério de menor parada, Blue/Green.',
      ],
    },
    {
      id: 'rv:db.f08.dynamodb-ja-criptografado',
      kind: 'decision',
      title: 'Uma exigência de criptografia para as tabelas NoSQL',
      prompt:
        'Uma auditoria exige que as **tabelas do DynamoDB** de uma startup sejam **criptografadas em repouso**. Não há exigência de controlar a chave, de auditar o uso dela nem de trocá-la. A startup quer atender **com o menor custo e esforço**. O que fazer?',
      concepts: [{ id: 'db.encryption-at-rest' }],
      xp: 5,
      difficulty: 1,
      domain: 'd4',
      options: [
        { id: 'a', text: 'Criar uma chave do KMS gerenciada pelo cliente e aplicá-la às tabelas.', correct: false, consequence: 'Funciona, mas paga a chave e as chamadas ao KMS sem uma exigência que justifique.' },
        { id: 'b', text: 'Nada a mudar: as tabelas já são criptografadas com uma chave da AWS.', correct: true, consequence: 'Toda tabela do DynamoDB é criptografada em repouso, por padrão sem custo extra.' },
        { id: 'c', text: 'Exportar as tabelas para o S3 com criptografia e apagar as originais.', correct: false, consequence: 'Troca o banco por arquivos e para a aplicação.' },
        { id: 'd', text: 'Criptografar cada atributo na aplicação antes de gravar.', correct: false, consequence: 'Muito código para algo que o DynamoDB já faz, e as consultas pelos atributos ficam difíceis.' },
      ],
      explanation: [
        'No DynamoDB, **toda tabela é criptografada em repouso**, por padrão com uma **chave da AWS, sem custo extra**. Sem exigência de controlar ou auditar a chave, não há nada a mudar.',
        'Uma chave gerenciada pelo cliente atende exigências de controle, com custo. Exportar ou criptografar na aplicação é trabalho sem ganho.',
        '**Regra prática:** chave gerenciada pelo cliente quando o enunciado exige controlar, auditar ou girar a chave; sem isso, a criptografia padrão basta.',
      ],
    },
    {
      id: 'rv:db.f08.m2.a4',
      kind: 'decision',
      title: 'Um sistema legado conectando sem criptografia',
      prompt:
        'Um sistema legado ainda se conecta a um RDS for PostgreSQL **sem TLS**. A auditoria exige que o banco **recuse qualquer conexão sem criptografia em trânsito**, não importa de onde ela venha. O que configurar?',
      concepts: [{ id: 'db.tls' }],
      xp: 5,
      difficulty: 1,
      domain: 'd1',
      options: [
        { id: 'a', text: 'Ligar a criptografia em repouso com uma chave do KMS.', correct: false, consequence: 'Protege os dados guardados, não o que trafega na rede.' },
        { id: 'b', text: 'Aceitar no security group só o IP do sistema legado.', correct: false, consequence: 'Limita quem conecta, mas a conexão continua sem criptografia.' },
        { id: 'c', text: 'Ativar a autenticação IAM para o usuário do legado.', correct: false, consequence: 'Muda o login do legado, mas não obriga as outras conexões a usar TLS.' },
        { id: 'd', text: 'Ligar o rds.force_ssl num parameter group próprio.', correct: true, consequence: 'O banco recusa conexões sem TLS, e o legado precisa passar a usá-lo.' },
      ],
      explanation: [
        'No PostgreSQL, o parâmetro **rds.force_ssl**, num parameter group próprio, obriga **toda conexão a usar TLS**. O sistema legado precisa ser ajustado para conectar com TLS.',
        'A criptografia em repouso não protege o tráfego. O security group decide quem conecta, não como. A autenticação IAM vale para quem a usa.',
        '**Regra prática:** "garantir que todas as conexões com o banco sejam criptografadas" no PostgreSQL é rds.force_ssl.',
      ],
    },
    {
      id: 'rv:db.f08.m2.a3',
      kind: 'decision',
      title: 'Login sem senha num banco SQL Server',
      prompt:
        'Uma aplicação em instâncias EC2 com uma role acessa um **RDS for SQL Server** com uma senha num arquivo de configuração. A segurança exige que **nenhuma senha fique guardada** na instância e que ela seja **trocada automaticamente**, sem mudar a aplicação a cada troca. Qual solução atende?',
      concepts: [{ id: 'db.iam-auth' }, { id: 'db.secrets' }],
      xp: 5,
      difficulty: 3,
      domain: 'd1',
      options: [
        { id: 'a', text: 'Autenticação IAM no banco, com o token gerado pela role da instância.', correct: false, consequence: 'A autenticação IAM do RDS existe para MariaDB, MySQL e PostgreSQL, não para SQL Server.' },
        { id: 'b', text: 'A senha gerenciada pelo RDS no Secrets Manager, buscada por API.', correct: true, consequence: 'A senha sai da instância, é trocada sozinha e a aplicação busca a atual a cada conexão.' },
        { id: 'c', text: 'A senha numa variável de ambiente definida pelo user data.', correct: false, consequence: 'A senha continua guardada na instância, só que em outro lugar, e não é trocada.' },
        { id: 'd', text: 'Um arquivo de configuração criptografado com uma chave do KMS.', correct: false, consequence: 'A senha continua fixa e guardada, e alguém precisa trocá-la à mão.' },
      ],
      explanation: [
        'A **autenticação IAM** do RDS funciona com **MariaDB, MySQL e PostgreSQL**, não com SQL Server. Para o SQL Server, o caminho é a **senha gerenciada pelo RDS no Secrets Manager**: o RDS gera a senha, a troca sozinha, a cada 7 dias por padrão, e a aplicação busca o segredo por API usando a role da instância.',
        'Variáveis de ambiente e arquivos criptografados mantêm uma senha fixa guardada na instância.',
        '**Regra prática:** sem senha no código: autenticação IAM em MySQL, MariaDB e PostgreSQL; Secrets Manager em qualquer motor, com rotação automática.',
      ],
    },
    {
      id: 'rv:db.f08.token-de-15-minutos',
      kind: 'decision',
      title: 'Conexões novas falhando depois de alguns minutos',
      prompt:
        'Uma aplicação passou a usar **autenticação IAM** num Aurora MySQL. Ela gera **um token ao iniciar** e o reutiliza para abrir as conexões do pool. As conexões abertas no início funcionam, mas, depois de uns minutos, **as conexões novas são recusadas**. A equipe quer corrigir **sem voltar a usar senha**. O que fazer?',
      concepts: [{ id: 'db.iam-auth' }],
      xp: 5,
      difficulty: 2,
      domain: 'd2',
      options: [
        { id: 'a', text: 'Gerar um token novo ao abrir cada conexão, com a role da aplicação.', correct: true, consequence: 'Cada conexão nova usa um token válido; as já abertas não são afetadas pelo vencimento.' },
        { id: 'b', text: 'Aumentar a validade do token para 24 horas na política IAM.', correct: false, consequence: 'A validade do token é fixa em 15 minutos; não há como estendê-la.' },
        { id: 'c', text: 'Reiniciar a aplicação a cada 15 minutos para gerar outro token.', correct: false, consequence: 'Derruba as conexões abertas a cada reinício só para contornar o vencimento.' },
        { id: 'd', text: 'Aumentar a memória do banco, porque a autenticação IAM consome mais.', correct: false, consequence: 'A memória extra não muda o fato de o token ter vencido.' },
      ],
      explanation: [
        'O token da **autenticação IAM** vale por **15 minutos** e é usado **só na autenticação**: uma conexão já aberta não é afetada quando ele vence. Conexões novas com um token vencido são recusadas. A aplicação deve **gerar um token novo para cada conexão** que abrir.',
        'Não dá para estender a validade. Reiniciar a aplicação derruba conexões. E a memória do banco não tem relação com o vencimento.',
        '**Regra prática:** com autenticação IAM no RDS, gere o token na hora de conectar; ele vale 15 minutos e não afeta sessões abertas.',
      ],
    },
    {
      id: 'rv:db.f08.boss.a2',
      kind: 'decision',
      title: 'Funções que param de conectar uma vez por semana',
      prompt:
        'A equipe ligou a **senha gerenciada pelo RDS no Secrets Manager**, com rotação automática, e copiou a senha atual para uma **variável de ambiente** das funções Lambda que acessam o banco. Uma semana depois, as funções começaram a falhar ao conectar. A equipe quer que elas **acompanhem as trocas sozinhas**. O que fazer?',
      concepts: [{ id: 'db.secrets' }],
      xp: 5,
      difficulty: 2,
      domain: 'd1',
      options: [
        { id: 'a', text: 'Desligar a rotação automática para a senha não mudar mais.', correct: false, consequence: 'Volta a ter uma senha fixa, o oposto do que a segurança pediu.' },
        { id: 'b', text: 'Atualizar a variável de ambiente toda semana, depois de cada troca.', correct: false, consequence: 'É trabalho manual, e as funções ficam fora do ar entre a troca e a atualização.' },
        { id: 'c', text: 'Buscar o segredo no Secrets Manager por API, em vez da variável.', correct: true, consequence: 'As funções passam a ler a senha atual, que o RDS troca a cada 7 dias por padrão.' },
        { id: 'd', text: 'Guardar a senha num arquivo do pacote de implantação das funções.', correct: false, consequence: 'É outra cópia fixa que fica velha na próxima rotação.' },
      ],
      explanation: [
        'O RDS troca a senha gerenciada **a cada 7 dias por padrão**. Uma cópia na variável de ambiente fica velha na primeira troca. A aplicação deve **buscar o segredo por API** no Secrets Manager, com o acesso controlado por IAM, e assim sempre usa a senha atual.',
        'Desligar a rotação contraria a exigência. Atualizar à mão ou guardar em arquivo cria cópias que envelhecem.',
        '**Regra prática:** com rotação automática, a aplicação busca o segredo por API; nunca copie a senha para a configuração.',
      ],
    },
    {
      id: 'rv:db.f08.m3.a1',
      kind: 'decision',
      title: 'Um comando de exclusão no banco errado',
      prompt:
        'Um analista quase apagou o RDS de produção achando que era o de homologação, porque os nomes são parecidos. A diretoria quer que **o comando de apagar seja recusado** no banco de produção até alguém mudar uma configuração **de propósito**. Qual medida atende?',
      concepts: [{ id: 'bkp.deletion-protection' }],
      xp: 5,
      difficulty: 1,
      domain: 'd2',
      options: [
        { id: 'a', text: 'Aumentar a retenção do backup automático para 35 dias.', correct: false, consequence: 'Ajuda a recuperar depois, mas não impede a exclusão.' },
        { id: 'b', text: 'Converter o banco de produção para Multi-AZ.', correct: false, consequence: 'O standby é apagado junto com a instância.' },
        { id: 'c', text: 'Exigir um snapshot final antes de qualquer exclusão.', correct: false, consequence: 'Garante uma cópia, mas o banco é apagado do mesmo jeito.' },
        { id: 'd', text: 'Ligar a proteção contra exclusão no banco de produção.', correct: true, consequence: 'O comando de apagar é recusado até alguém desligar a proteção.' },
      ],
      explanation: [
        'Com a **proteção contra exclusão** ligada, o RDS **recusa o comando de apagar** até alguém desligar a proteção, o que não causa parada. Ela vem ligada por padrão em bancos criados pelo console.',
        'Retenção maior, snapshot final e Multi-AZ ajudam a recuperar ou a resistir a falhas, mas não impedem a exclusão.',
        '**Regra prática:** "impedir a exclusão acidental do banco" é proteção contra exclusão; snapshot final e retenção dos backups são o plano para depois.',
      ],
    },
    {
      id: 'rv:db.f08.m3.a4',
      kind: 'decision',
      title: 'Backups imutáveis com uma saída de emergência',
      prompt:
        'Uma seguradora centraliza os backups do RDS, do Aurora e do DynamoDB no **AWS Backup**. Ela quer que os backups **não possam ser apagados** antes do fim da retenção por usuários comuns, mas que a **equipe de segurança, com uma permissão especial, possa remover a trava** num caso excepcional. Qual configuração atende?',
      concepts: [{ id: 'bkp.aws-backup' }],
      xp: 5,
      difficulty: 3,
      domain: 'd2',
      options: [
        { id: 'a', text: 'Vault Lock em modo compliance no cofre dos backups.', correct: false, consequence: 'Depois da carência, ninguém remove a trava, nem a equipe de segurança, nem a AWS.' },
        { id: 'b', text: 'Vault Lock em modo governance no cofre dos backups.', correct: true, consequence: 'Usuários comuns não apagam os backups, e quem tem permissão suficiente pode remover a trava.' },
        { id: 'c', text: 'Snapshots manuais em cada banco, com proteção contra exclusão.', correct: false, consequence: 'A proteção contra exclusão vale para a instância, não para os snapshots, e não centraliza nada.' },
        { id: 'd', text: 'Backup automático do RDS com retenção de 35 dias.', correct: false, consequence: 'Cobre só RDS e Aurora, por no máximo 35 dias, e não trava nada.' },
      ],
      explanation: [
        'O **Vault Lock** aplica o modelo WORM aos cofres do AWS Backup. No **modo governance**, quem tem permissão IAM suficiente pode remover a trava, o que dá a saída de emergência. No **modo compliance**, depois do período de carência, a trava não pode ser removida por ninguém.',
        'Snapshots manuais espalhados e o backup automático do RDS não centralizam nem travam os backups.',
        '**Regra prática:** "ninguém, nem um administrador" é compliance; "só quem tem permissão especial" é governance.',
      ],
    },
  ],
}
