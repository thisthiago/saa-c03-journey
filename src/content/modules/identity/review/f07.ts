/**
 * Questões da Revisão da Fase 7 da IAM e Access Management (federação e
 * identidades externas), no formato do exame SAA-C03. Fatos conferidos na
 * documentação da AWS (ver docs/VERIFICACAO-DE-CONTEUDO.md). As empresas são
 * fictícias.
 */
import type { ReviewSet } from '../../../../engine/types'

export const REVIEW_F07: ReviewSet = {
  phaseId: 'iax.f07',
  questions: [
    {
      id: 'rv:iax.f07.m2.a2',
      kind: 'decision',
      title: 'Os clientes da rede de academias',
      prompt:
        'Uma rede de academias vai lançar um aplicativo em que **os clientes** se cadastram com e-mail ou com a conta Google e entram para ver os treinos. A expectativa é chegar a **centenas de milhares de usuários**. Um engenheiro sugeriu usar o IAM Identity Center, que a empresa já usa para os funcionários. Qual serviço atende ao cadastro e ao login dos clientes?',
      concepts: [{ id: 'cognito.user-pool' }, { id: 'fed.identity-center' }],
      xp: 5,
      difficulty: 1,
      domain: 'd1',
      options: [
        { id: 'a', text: 'O IAM Identity Center, criando um usuário para cada cliente.', correct: false, consequence: 'O Identity Center é para funcionários acessarem contas e aplicações da empresa.' },
        { id: 'b', text: 'Um usuário IAM para cada cliente, com senha de console.', correct: false, consequence: 'Usuários IAM são identidades da conta, não clientes de um aplicativo.' },
        { id: 'c', text: 'Um Amazon Cognito user pool, com cadastro e login social.', correct: true, consequence: 'O user pool é o diretório de clientes do aplicativo, com login social e tokens.' },
        { id: 'd', text: 'O AWS Managed Microsoft AD, com um usuário por cliente.', correct: false, consequence: 'Um AD gerenciado atende aplicações corporativas, não cadastro de clientes.' },
      ],
      explanation: [
        'O **Cognito user pool** é o diretório de clientes de um aplicativo: cadastro, login com e-mail, login social, SAML e OIDC, e emissão de tokens JWT. Ele foi feito para escalar a milhões de usuários.',
        'O **IAM Identity Center** dá login único aos **funcionários** nas contas e aplicações da empresa. Usuários IAM e um AD gerenciado também não são diretórios de clientes.',
        '**Regra prática:** clientes de um aplicativo web ou móvel pedem o Cognito user pool. Funcionários da empresa pedem o IAM Identity Center.',
      ],
    },
    {
      id: 'rv:iax.f07.desligamento',
      kind: 'decision',
      title: 'Ex-funcionários que ainda entram na conta',
      prompt:
        'Uma auditoria encontrou usuários IAM de ex-funcionários ainda ativos em várias contas da organização. Todos os funcionários já existem no provedor de identidade corporativo, e o RH desativa a pessoa lá no dia do desligamento. A empresa quer que **desativar no provedor corte o acesso à AWS**, com o **menor esforço operacional**. Qual solução atende?',
      concepts: [{ id: 'fed.federation' }, { id: 'fed.identity-center' }],
      xp: 5,
      difficulty: 2,
      domain: 'd1',
      options: [
        { id: 'a', text: 'Um script semanal que compara o provedor com os usuários IAM e apaga os que sobram.', correct: false, consequence: 'Até uma semana de acesso indevido, e um script a manter.' },
        { id: 'b', text: 'Expiração de senha de 30 dias para todos os usuários IAM.', correct: false, consequence: 'O ex-funcionário entra até a senha vencer, e as chaves de acesso não expiram.' },
        { id: 'c', text: 'Revisar o relatório de credenciais todo mês e remover os inativos.', correct: false, consequence: 'Manual e lento: o acesso continua até a próxima revisão.' },
        { id: 'd', text: 'Federação pelo IAM Identity Center ligado ao provedor, sem usuários IAM.', correct: true, consequence: 'Desativada no provedor, a pessoa não consegue mais entrar em nenhuma conta.' },
      ],
      explanation: [
        'Com **federação**, as pessoas entram pelo provedor de identidade que a empresa já usa e recebem **credenciais temporárias**. Não existe usuário IAM a lembrar de apagar: quando o RH desativa a pessoa no provedor, ela deixa de conseguir entrar. O **IAM Identity Center** faz isso para todas as contas da organização.',
        'Scripts, expiração de senha e revisões mensais deixam janelas de acesso e exigem manutenção.',
        '**Regra prática:** "usar as credenciais corporativas existentes" e "sem criar usuários IAM" pedem federação, em geral pelo IAM Identity Center.',
      ],
    },
    {
      id: 'rv:iax.f07.m1.a2:org',
      kind: 'decision',
      title: 'Login único numa conta só',
      prompt:
        'Uma equipe habilitou o IAM Identity Center como **instância de conta** numa conta-membro e agora quer dar aos funcionários acesso às **20 contas da organização** com permission sets, com o **menor número de pontos de administração**. O que fazer?',
      concepts: [{ id: 'fed.identity-center' }],
      xp: 5,
      difficulty: 2,
      domain: 'd1',
      options: [
        { id: 'a', text: 'Habilitar uma instância de conta em cada uma das 20 contas.', correct: false, consequence: 'Instâncias de conta não dão acesso a contas com permission sets, e seriam 20 pontos.' },
        { id: 'b', text: 'Criar usuários IAM em cada conta para quem precisa de acesso.', correct: false, consequence: 'Multiplica identidades de longo prazo, conta por conta.' },
        { id: 'c', text: 'Habilitar a instância de organização na conta de gerenciamento.', correct: true, consequence: 'Uma única instância atribui permission sets em todas as contas.' },
        { id: 'd', text: 'Compartilhar a instância de conta com as demais contas pelo AWS RAM.', correct: false, consequence: 'Uma instância de conta fica restrita à conta e à Região onde foi habilitada.' },
      ],
      explanation: [
        'A **instância de conta** do IAM Identity Center fica presa a uma única conta e Região, e **não dá acesso a várias contas** com permission sets. Para isso, a AWS recomenda a **instância de organização**, habilitada na conta de gerenciamento, que atribui usuários e grupos a qualquer conta da organização.',
        'Vinte instâncias de conta não resolvem e multiplicam a administração. Usuários IAM em cada conta são o que o Identity Center substitui. E o RAM não compartilha a instância.',
        '**Regra prática:** "várias contas da organização" e "login único para funcionários" pedem o IAM Identity Center como instância de organização. Ele não tem cobrança adicional.',
      ],
    },
    {
      id: 'rv:iax.f07.m1.a4',
      kind: 'decision',
      title: 'Expulsos da conta a cada hora',
      prompt:
        'Analistas entram pelo portal do IAM Identity Center e usam o permission set Analise, com a duração padrão. Eles reclamam que, **a cada hora**, a sessão na conta expira e precisam voltar ao portal. A empresa quer sessões que **cubram um turno de 8 horas**. O que ajustar?',
      concepts: [{ id: 'fed.permission-sets' }],
      xp: 5,
      difficulty: 2,
      domain: 'd1',
      options: [
        { id: 'a', text: 'A duração da sessão do portal de acesso, para 8 horas.', correct: false, consequence: 'O portal já dura 8 horas por padrão; quem expira é a sessão da conta.' },
        { id: 'b', text: 'A duração de sessão do permission set Analise, para 8 horas.', correct: true, consequence: 'A sessão nas contas passa a durar o turno inteiro.' },
        { id: 'c', text: 'A duração máxima da role criada em cada conta, editando-a uma a uma.', correct: false, consequence: 'A role é gerenciada pelo Identity Center; o ajuste se faz no permission set.' },
        { id: 'd', text: 'Criar usuários IAM para os analistas, sem limite de sessão.', correct: false, consequence: 'Volta às credenciais de longo prazo que a federação evita.' },
      ],
      explanation: [
        'Ao atribuir um **permission set** a uma conta, o Identity Center cria lá uma role com essas permissões, assumida pelo portal. A sessão dessa role dura **1 hora por padrão** e pode ir até **12 horas**, configurada no próprio permission set.',
        'A sessão do **portal de acesso** é outra coisa: dura 8 horas por padrão e pode ir até 90 dias. A role nas contas é gerenciada pelo Identity Center. E usuários IAM desfazem a federação.',
        '**Regra prática:** sessão da conta é configurada no permission set; sessão do portal, nas configurações do Identity Center.',
      ],
    },
    {
      id: 'rv:iax.f07.m1.a3:okta',
      kind: 'decision',
      title: 'Os usuários que já existem em outro lugar',
      prompt:
        'Uma empresa vai habilitar o IAM Identity Center. Os 900 funcionários já estão no **Okta**, onde entram com MFA em todos os sistemas. A empresa **não quer recriar os usuários** nem manter dois cadastros. Como configurar a fonte de identidade?',
      concepts: [{ id: 'fed.identity-source' }, { id: 'fed.federation' }],
      xp: 5,
      difficulty: 1,
      domain: 'd1',
      options: [
        { id: 'a', text: 'Criar os 900 usuários no diretório do próprio Identity Center.', correct: false, consequence: 'Cria um segundo cadastro, que a empresa quer evitar.' },
        { id: 'b', text: 'Conectar o Okta ao Identity Center como provedor externo.', correct: true, consequence: 'Os funcionários entram com a conta do Okta, sem recadastro.' },
        { id: 'c', text: 'Usar um Simple AD como ponte entre o Okta e o Identity Center.', correct: false, consequence: 'O Simple AD não pode ser fonte de identidade do Identity Center.' },
        { id: 'd', text: 'Usar um AD Connector apontando para o Okta da empresa.', correct: false, consequence: 'O AD Connector é um proxy para um Active Directory, não para o Okta.' },
      ],
      explanation: [
        'A **fonte de identidade** do Identity Center pode ser o diretório dele próprio (padrão), um **Active Directory** ou um **provedor externo**, como Okta ou Microsoft Entra ID. Com o Okta conectado, os funcionários entram com a conta que já usam, sem recadastro. A fonte é uma por organização.',
        'Recriar usuários duplica o cadastro. O Simple AD não serve como fonte. E o AD Connector é para um Active Directory.',
        '**Regra prática:** se a empresa já tem um AD ou um IdP como Okta ou Entra ID, conecte-o ao Identity Center em vez de recriar os usuários.',
      ],
    },
    {
      id: 'rv:iax.f07.m2.a1:lab',
      kind: 'decision',
      title: 'Um diretório barato para o laboratório',
      prompt:
        'Uma equipe precisa de um diretório compatível com Active Directory para um **laboratório de testes** com poucas máquinas Windows na AWS. Não há AD no data center, nem necessidade de MFA ou de trust. O requisito principal é o **menor custo**. Qual opção do AWS Directory Service atende?',
      concepts: [{ id: 'fed.directory-service' }],
      xp: 5,
      difficulty: 1,
      domain: 'd4',
      options: [
        { id: 'a', text: 'AWS Managed Microsoft AD, com um AD completo gerenciado.', correct: false, consequence: 'Atende, mas custa mais, e o trust e os recursos extras não são necessários.' },
        { id: 'b', text: 'AD Connector, apontando para o diretório da empresa.', correct: false, consequence: 'O AD Connector é um proxy para um AD local, que não existe aqui.' },
        { id: 'c', text: 'Simple AD, um diretório compatível baseado em Samba 4.', correct: true, consequence: 'Diretório simples e barato, suficiente para o laboratório.' },
        { id: 'd', text: 'Amazon Cognito user pool, com um usuário por máquina.', correct: false, consequence: 'O Cognito é diretório de clientes de aplicativos, não de máquinas Windows.' },
      ],
      explanation: [
        'O **Simple AD** é um diretório compatível com Active Directory, baseado em Samba 4, simples e barato. Não tem MFA nem trusts, o que não pesa num laboratório sem esses requisitos.',
        'O **AWS Managed Microsoft AD** é um AD de verdade, com trust para o AD local, e custa mais. O **AD Connector** depende de um AD local. E o Cognito atende clientes de aplicativos.',
        '**Regra prática:** AD de verdade ou trust com o AD local pede Managed Microsoft AD; usar o AD local sem guardar usuários na nuvem pede AD Connector; diretório simples e barato, sem MFA nem trusts, pede Simple AD.',
      ],
    },
    {
      id: 'rv:iax.f07.m3.a1:jwt',
      kind: 'decision',
      title: 'O backend que só precisa saber quem é o cliente',
      prompt:
        'O backend de um aplicativo roda num servidor próprio e só precisa **saber quem é o usuário** em cada requisição, por um token assinado. O aplicativo **não chama nenhum serviço da AWS** diretamente. Qual componente do Amazon Cognito atende?',
      concepts: [{ id: 'cognito.user-pool' }, { id: 'cognito.identity-pool' }],
      xp: 5,
      difficulty: 2,
      domain: 'd1',
      options: [
        { id: 'a', text: 'Um identity pool, que entrega credenciais AWS temporárias.', correct: false, consequence: 'Credenciais AWS não servem para nada aqui: o aplicativo não chama a AWS.' },
        { id: 'b', text: 'Um user pool, que autentica e emite tokens JWT.', correct: true, consequence: 'O backend valida o token e sabe quem é o usuário.' },
        { id: 'c', text: 'Um identity pool com acesso de visitantes habilitado.', correct: false, consequence: 'Visitantes sem login não dizem quem é o usuário.' },
        { id: 'd', text: 'Um user pool e um identity pool, obrigatoriamente juntos.', correct: false, consequence: 'Os dois podem ser usados separados; aqui basta o user pool.' },
      ],
      explanation: [
        'O **user pool** responde "quem é o usuário": cuida do cadastro e do login e emite **tokens JWT** que o backend valida. O **identity pool** responde "que credenciais AWS ele recebe", trocando um token por credenciais temporárias para chamar serviços da AWS.',
        'Como o aplicativo não chama a AWS diretamente, o identity pool não é necessário, nem com visitantes. E os dois podem ser usados separados.',
        '**Regra prática:** login e tokens pedem user pool. Acesso direto a serviços da AWS a partir do aplicativo pede identity pool.',
      ],
    },
    {
      id: 'rv:iax.f07.m3.a1:creds',
      kind: 'decision',
      title: 'Cada cliente só na própria pasta',
      prompt:
        'Os clientes de um aplicativo móvel entram por um Cognito user pool, e um **identity pool** entrega credenciais temporárias para que o aplicativo envie fotos **direto ao S3**. Todos usam a mesma role autenticada. A empresa quer que **cada cliente só leia e grave na própria pasta** do bucket, com o **menor esforço operacional**. O que fazer?',
      concepts: [{ id: 'cognito.identity-pool' }],
      xp: 5,
      difficulty: 3,
      domain: 'd1',
      options: [
        { id: 'a', text: 'Criar uma role para cada cliente, com acesso à pasta dele.', correct: false, consequence: 'Funciona, mas exige uma role nova a cada cadastro.' },
        { id: 'b', text: 'Validar a pasta no aplicativo móvel antes de cada envio.', correct: false, consequence: 'A credencial continua podendo gravar em qualquer pasta, e o aplicativo pode ser adulterado.' },
        { id: 'c', text: 'Uma bucket policy listando o ID de cada cliente e a pasta dele.', correct: false, consequence: 'A política cresce a cada cliente e logo esbarra no limite de tamanho.' },
        { id: 'd', text: 'Usar a variável do ID do Cognito no Resource da política da role.', correct: true, consequence: 'Cada sessão só alcança o prefixo com o próprio ID, com uma única política.' },
      ],
      explanation: [
        'Na política da role do identity pool, a variável **${cognito-identity.amazonaws.com:sub}** é trocada pelo ID do Cognito de quem faz a requisição. Com o Resource `arn:aws:s3:::fotos/${cognito-identity.amazonaws.com:sub}/*`, uma única política limita cada cliente à própria pasta.',
        'Uma role por cliente e uma bucket policy com todos os IDs não escalam. E a validação no aplicativo não restringe a credencial.',
        'A variável traz o ID do identity pool, não o identificador do provedor original. Para visitantes sem login, que não têm ID estável, ela deve ser usada com cuidado.',
        '**Regra prática:** "o aplicativo móvel envia arquivos direto ao S3" pede identity pool. Isolar cada usuário pede variável de política, não uma role por pessoa.',
      ],
    },
    {
      id: 'rv:iax.f07.m4.a2:tags',
      kind: 'decision',
      multiple: true,
      title: 'O que precisa existir antes do ABAC',
      prompt:
        'Uma empresa vai trocar dezenas de políticas por projeto por uma **única política** que compara `aws:PrincipalTag/projeto` com `aws:ResourceTag/projeto`. Os funcionários entram por federação. Quais condições precisam estar atendidas para essa política funcionar? (Escolha DUAS.)',
      concepts: [{ id: 'fed.abac' }],
      xp: 5,
      difficulty: 2,
      domain: 'd1',
      options: [
        { id: 'a', text: 'Os recursos precisam ter a tag projeto com o valor certo.', correct: true, consequence: 'Sem a tag no recurso, a condição não casa, e o acesso é negado.' },
        { id: 'b', text: 'A política precisa listar o ARN de cada recurso de cada projeto.', correct: false, consequence: 'Listar recursos é o RBAC que o ABAC substitui.' },
        { id: 'c', text: 'As sessões precisam trazer a tag projeto, enviada pelo provedor.', correct: true, consequence: 'O atributo do provedor vira session tag e alimenta aws:PrincipalTag.' },
        { id: 'd', text: 'Cada projeto precisa de uma SCP própria na organização.', correct: false, consequence: 'SCPs só limitam; a comparação de tags dispensa uma política por projeto.' },
        { id: 'e', text: 'Cada funcionário precisa de um usuário IAM com a tag projeto.', correct: false, consequence: 'Com federação, o atributo chega como session tag, sem usuário IAM.' },
      ],
      explanation: [
        'No **ABAC**, a política compara **tags do principal** com **tags do recurso**. Para funcionar, os recursos precisam estar marcados com a tag projeto, e as sessões precisam trazer essa tag. Com federação, o atributo vem do provedor como session tag. Recursos novos com a tag certa entram sozinhos, sem editar a política.',
        'Listar ARNs é o RBAC. Uma SCP por projeto volta a multiplicar políticas. E usuários IAM não são necessários com federação.',
        '**Regra prática:** "muitos projetos", "recursos criados o tempo todo" e "reduzir o número de políticas" pedem ABAC. A disciplina de tags é o que o sustenta.',
      ],
    },
  ],
}
