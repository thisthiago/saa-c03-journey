/**
 * Questões da Revisão da Fase 6 da IAM e Access Management (roles na prática),
 * no formato do exame SAA-C03. Fatos conferidos na documentação da AWS (ver
 * docs/VERIFICACAO-DE-CONTEUDO.md). As empresas são fictícias.
 */
import type { ReviewSet } from '../../../../engine/types'

export const REVIEW_F06: ReviewSet = {
  phaseId: 'iax.f06',
  questions: [
    {
      id: 'rv:iax.f06.m1.a3',
      kind: 'decision',
      title: 'Dois programas e um só servidor',
      prompt:
        'Uma instância EC2 roda duas aplicações: uma só lê um bucket S3, e a outra só grava numa tabela do DynamoDB. A segurança exige que **cada aplicação tenha apenas as próprias permissões**, sem acesso às da outra. Qual solução atende?',
      concepts: [{ id: 'iam.instance-profile' }],
      xp: 5,
      difficulty: 2,
      domain: 'd1',
      options: [
        { id: 'a', text: 'Pôr as duas roles no mesmo instance profile, uma para cada aplicação.', correct: false, consequence: 'Um instance profile contém uma única role.' },
        { id: 'b', text: 'Anexar dois instance profiles à instância, um por aplicação.', correct: false, consequence: 'A instância recebe um só instance profile.' },
        { id: 'c', text: 'Pedir aumento de cota para duas roles por instance profile.', correct: false, consequence: 'O limite de uma role por instance profile não pode ser aumentado.' },
        { id: 'd', text: 'Rodar cada aplicação numa instância própria, com a sua role.', correct: true, consequence: 'Cada aplicação recebe credenciais só com as permissões dela.' },
      ],
      explanation: [
        'O **instance profile** leva **uma única role** para dentro da instância, e esse limite não pode ser aumentado. Todas as aplicações da instância recebem as mesmas credenciais. Para que cada uma tenha só as próprias permissões, elas precisam rodar em instâncias separadas, cada uma com a sua role.',
        'Não há instance profile com duas roles, instância com dois instance profiles nem aumento de cota.',
        'Uma role com as permissões das duas aplicações funcionaria, mas cada aplicação passaria a ter também as da outra, o que a segurança proibiu.',
        '**Regra prática:** uma instância, um instance profile, uma role. Permissões diferentes por aplicação pedem separar as aplicações.',
      ],
    },
    {
      id: 'rv:iax.f06.role-em-execucao',
      kind: 'decision',
      title: 'A instância que já está no ar',
      prompt:
        'Uma instância EC2 de produção, lançada **sem instance profile**, guarda uma chave de acesso num arquivo para ler o S3. A equipe quer passar a usar uma role **sem derrubar a instância**. O que fazer?',
      concepts: [{ id: 'iam.instance-profile' }],
      xp: 5,
      difficulty: 1,
      domain: 'd1',
      options: [
        { id: 'a', text: 'Anexar um instance profile à instância rodando e apagar a chave.', correct: true, consequence: 'A role passa a valer sem parar a instância, e a chave sai do disco.' },
        { id: 'b', text: 'Criar uma AMI da instância e lançar uma nova já com o instance profile.', correct: false, consequence: 'Funciona, mas troca a instância, o que a equipe queria evitar.' },
        { id: 'c', text: 'Parar a instância, anexar a role e ligá-la de novo.', correct: false, consequence: 'Não é preciso parar: a role pode ser anexada com a instância rodando.' },
        { id: 'd', text: 'Manter a chave no arquivo, porque roles só se anexam no lançamento.', correct: false, consequence: 'Roles podem ser anexadas a instâncias que já estão rodando.' },
      ],
      explanation: [
        'Uma role pode ser **anexada a uma instância que já está rodando**, por meio de um instance profile. A partir daí, a aplicação obtém credenciais temporárias pelos metadados da instância, e a chave do arquivo pode ser excluída.',
        'Lançar uma nova instância ou parar a atual não é necessário. E manter a chave guarda uma credencial de longo prazo no disco.',
        '**Regra prática:** "aplicação no EC2 precisa acessar um serviço" pede uma role por instance profile. Chave em arquivo ou variável de ambiente é distrator.',
      ],
    },
    {
      id: 'rv:iax.f06.credencial-em-cache',
      kind: 'decision',
      title: 'A aplicação que para algumas horas depois do boot',
      prompt:
        'Uma aplicação numa instância EC2 com instance profile lê as credenciais nos **metadados da instância** uma única vez, na inicialização, e as guarda na memória. Algumas horas depois, todas as chamadas ao S3 passam a falhar com erro de token expirado. Qual correção atende **sem credenciais de longo prazo**?',
      concepts: [{ id: 'iam.instance-profile' }, { id: 'iam.service-role' }],
      xp: 5,
      difficulty: 2,
      domain: 'd1',
      options: [
        { id: 'a', text: 'Reiniciar a instância todos os dias, para buscar credenciais novas.', correct: false, consequence: 'As credenciais podem expirar antes do reinício, e a aplicação fica fora do ar.' },
        { id: 'b', text: 'Subir para 12 horas a duração máxima de sessão da role.', correct: false, consequence: 'O problema é o cache sem renovação, que falharia de novo mais tarde.' },
        { id: 'c', text: 'Gravar uma chave de acesso na instância como reserva para quando expirar.', correct: false, consequence: 'Volta a guardar uma credencial de longo prazo no disco.' },
        { id: 'd', text: 'Buscar credenciais novas nos metadados antes de as atuais expirarem.', correct: true, consequence: 'A aplicação passa a usar as credenciais que a AWS renova sozinha.' },
      ],
      explanation: [
        'As credenciais do instance profile são **temporárias** e a AWS as **renova automaticamente** nos metadados antes de expirarem. Uma aplicação que as guarda em cache precisa buscá-las de novo, a cada hora ou ao menos 15 minutos antes da expiração. Os SDKs da AWS já fazem isso sozinhos.',
        'Reiniciar a instância é frágil, mexer na duração da role não resolve o cache, e uma chave de reserva volta ao problema que a role resolve.',
        '**Regra prática:** com instance profile, deixe o SDK cuidar das credenciais ou renove o cache antes da expiração. A renovação é da AWS; ler a versão nova é da aplicação.',
      ],
    },
    {
      id: 'rv:iax.f06.m3.a1:lambda',
      kind: 'decision',
      title: 'A função que continua sem acesso',
      prompt:
        'Uma função Lambda precisa ler um segredo no AWS Secrets Manager. Para isso, a equipe deu `secretsmanager:GetSecretValue` ao **usuário IAM do desenvolvedor** que criou a função. A função continua recebendo AccessDenied. Qual correção segue o **menor privilégio**?',
      concepts: [{ id: 'iam.service-role' }],
      xp: 5,
      difficulty: 1,
      domain: 'd1',
      options: [
        { id: 'a', text: 'Dar a leitura do segredo à role de execução da função.', correct: true, consequence: 'É a identidade que a função usa para chamar outros serviços.' },
        { id: 'b', text: 'Pôr na função as variáveis com a chave de acesso do desenvolvedor.', correct: false, consequence: 'Espalha uma credencial de longo prazo e dá à função as permissões dele.' },
        { id: 'c', text: 'Dar AdministratorAccess à role de execução da função.', correct: false, consequence: 'Resolve, mas dá à função muito mais do que ela precisa.' },
        { id: 'd', text: 'Incluir secretsmanager.amazonaws.com na trust policy da role.', correct: false, consequence: 'A trust policy diz quem assume a role; quem assume é o Lambda.' },
      ],
      explanation: [
        'Uma função Lambda age com a **role de execução**, uma **service role** que o Lambda assume. A trust policy dela cita `lambda.amazonaws.com`, e a política de permissões diz o que a função pode fazer. A permissão de leitura do segredo precisa estar nessa role, limitada ao segredo certo.',
        'As permissões do desenvolvedor não valem para a função. Chaves em variáveis de ambiente são distrator. AdministratorAccess fere o menor privilégio. E a trust policy não concede ações.',
        '**Regra prática:** "a função Lambda (ou outro serviço) precisa acessar um recurso" pede a permissão na role de execução ou na service role, com menor privilégio.',
      ],
    },
    {
      id: 'rv:iax.f06.m3.a1:view',
      kind: 'decision',
      title: 'A role criada pelo próprio serviço',
      prompt:
        'Ao revisar a conta, a segurança encontrou a role **AWSServiceRoleForAutoScaling**, criada automaticamente quando a equipe usou o EC2 Auto Scaling. Ela quer **ajustar as permissões** da role à política interna. O que é possível fazer com ela?',
      concepts: [{ id: 'iam.service-linked-role' }, { id: 'iam.service-role' }],
      xp: 5,
      difficulty: 2,
      domain: 'd1',
      options: [
        { id: 'a', text: 'Editar a política de permissões dela, como em qualquer role.', correct: false, consequence: 'As permissões de uma service-linked role são definidas pelo serviço.' },
        { id: 'b', text: 'Ver as permissões, mas não editá-las, porque o serviço as define.', correct: true, consequence: 'A service-linked role tem as permissões de que o serviço precisa, mantidas por ele.' },
        { id: 'c', text: 'Trocar a trust policy para que a equipe de operações também a assuma.', correct: false, consequence: 'A trust policy de uma service-linked role também é definida pelo serviço.' },
        { id: 'd', text: 'Anexar um permissions boundary para limitar o que o serviço faz.', correct: false, consequence: 'Service-linked roles não aceitam permissions boundary.' },
      ],
      explanation: [
        'Uma **service-linked role** é ligada a um serviço e **definida por ele**, com as permissões de que o serviço precisa. Em geral, o serviço a cria quando você usa o recurso. Você pode **ver** as permissões, mas **não editá-las**. Ela também não aceita permissions boundary e não é limitada por SCPs.',
        'Já uma **service role** comum, como a role de execução do Lambda, é criada e editada pelo administrador.',
        '**Regra prática:** service role é sua: você cria e edita. Service-linked role é do serviço: você vê, e o serviço mantém.',
      ],
    },
    {
      id: 'rv:iax.f06.m2.a2',
      kind: 'decision',
      title: 'A auditoria que não acha o registro',
      prompt:
        'Uma auditoria descobriu uma instância EC2 rodando com a role admin-total e quer saber **quem entregou essa role** à instância. Ela procurou no CloudTrail por eventos `PassRole` e **não encontrou nenhum**. Onde a informação está?',
      concepts: [{ id: 'iam.pass-role' }],
      xp: 5,
      difficulty: 2,
      domain: 'd1',
      options: [
        { id: 'a', text: 'Só nos data events do CloudTrail, que precisam ser ativados.', correct: false, consequence: 'PassRole não é uma chamada de API: não vira evento, nem de dados.' },
        { id: 'b', text: 'Nos eventos de us-east-1, onde ficam as chamadas do IAM.', correct: false, consequence: 'Não existe evento PassRole em nenhuma Região.' },
        { id: 'c', text: 'No evento que lançou ou alterou a instância, como RunInstances.', correct: true, consequence: 'A role entregue aparece nos parâmetros da ação que lançou ou alterou a instância.' },
        { id: 'd', text: 'Nos achados do IAM Access Analyzer sobre a role admin-total.', correct: false, consequence: 'O Access Analyzer aponta acesso externo e sem uso, não quem passou a role.' },
      ],
      explanation: [
        '**iam:PassRole** é uma **permissão**, não uma chamada de API. Ela é conferida quando alguém entrega uma role a um serviço, mas não gera evento próprio no CloudTrail. O registro aparece na ação que criou ou alterou o recurso, como RunInstances, com a role nos parâmetros e a identidade que fez a chamada.',
        'Ativar data events ou mudar de Região não cria um evento que não existe. E o Access Analyzer não responde quem entregou a role.',
        '**Regra prática:** para investigar quem passou uma role, procure a ação que usou a role, não um evento PassRole.',
      ],
    },
    {
      id: 'rv:iax.f06.passrole-na-funcao',
      kind: 'decision',
      title: 'A função que o desenvolvedor não consegue criar',
      prompt:
        'Um desenvolvedor tem permissão `lambda:CreateFunction`. Ao criar uma função usando a role de execução **app-pedidos**, já existente, recebe um erro dizendo que **não está autorizado a executar iam:PassRole**. A empresa quer liberar isso com o **menor privilégio**. O que fazer?',
      concepts: [{ id: 'iam.pass-role' }],
      xp: 5,
      difficulty: 1,
      domain: 'd1',
      options: [
        { id: 'a', text: 'Dar ao desenvolvedor iam:CreateRole, para ele criar a própria role.', correct: false, consequence: 'Criar roles é mais poder do que entregar uma role específica.' },
        { id: 'b', text: 'Permitir iam:PassRole a ele só no ARN da role app-pedidos.', correct: true, consequence: 'Ele entrega essa role ao Lambda e nenhuma outra.' },
        { id: 'c', text: 'Incluir lambda.amazonaws.com na trust policy da role app-pedidos.', correct: false, consequence: 'A trust policy já confia no Lambda; falta a permissão de quem entrega.' },
        { id: 'd', text: 'Permitir iam:PassRole ao desenvolvedor em todas as roles da conta.', correct: false, consequence: 'Ele poderia entregar uma role privilegiada a uma função e usá-la.' },
      ],
      explanation: [
        'Para **entregar uma role a um serviço**, como ao criar uma função Lambda ou lançar uma instância com instance profile, quem configura precisa de **iam:PassRole** para aquela role. Restringir pelo ARN da role, e se quiser pelo serviço com `iam:PassedToService`, impede que alguém ganhe permissões usando uma role mais poderosa.',
        'Criar roles e liberar PassRole em todas dão poder demais. E a trust policy não é o que falta.',
        '**Regra prática:** "impedir que alguém ganhe mais permissões ao lançar instâncias ou criar funções" pede iam:PassRole restrito pelo ARN das roles permitidas.',
      ],
    },
    {
      id: 'rv:iax.f06.m3.a2',
      kind: 'decision',
      title: 'O certificado aceito e a role recusada',
      prompt:
        'Uma empresa configurou o **IAM Roles Anywhere** para servidores do data center: a CA interna virou trust anchor, e um profile aponta para a role envio. O certificado dos servidores é aceito, mas a criação da sessão falha porque a role **não pode ser assumida**. A trust policy da role confia em `ec2.amazonaws.com`. O que corrigir?',
      concepts: [{ id: 'iam.roles-anywhere' }],
      xp: 5,
      difficulty: 3,
      domain: 'd1',
      options: [
        { id: 'a', text: 'Emitir os certificados pela AWS Private CA, a única aceita como trust anchor.', correct: false, consequence: 'CAs externas também podem ser trust anchor; o certificado já foi aceito.' },
        { id: 'b', text: 'Fazer a trust policy confiar no Roles Anywhere, amarrada ao trust anchor.', correct: true, consequence: 'O serviço passa a poder assumir a role para os servidores daquele trust anchor.' },
        { id: 'c', text: 'Criar um usuário IAM para cada servidor e manter a role como está.', correct: false, consequence: 'Volta às chaves de longo prazo que o Roles Anywhere elimina.' },
        { id: 'd', text: 'Anexar a role aos servidores por um instance profile.', correct: false, consequence: 'Instance profile é só para instâncias EC2, não para servidores locais.' },
      ],
      explanation: [
        'No **IAM Roles Anywhere**, servidores fora da AWS trocam um certificado X.509 por credenciais temporárias de uma role. Quem assume a role é o **serviço Roles Anywhere**, então a trust policy precisa confiar no principal de serviço dele, e não no EC2. A trust policy também amarra o trust anchor com `aws:SourceArn`, para que só aquela CA dê acesso.',
        'A AWS Private CA não é a única opção. Usuários IAM trazem de volta as chaves de longo prazo. E instance profile é exclusivo do EC2.',
        '**Regra prática:** "servidores fora da AWS, sem chaves de longo prazo, com PKI própria" pede Roles Anywhere. Os recursos dele são regionais.',
      ],
    },
    {
      id: 'rv:iax.f06.m4.a3:norbp',
      kind: 'decision',
      title: 'Ler instâncias de outra conta',
      prompt:
        'Os analistas da conta de operações precisam **listar e descrever as instâncias EC2** da conta de produção, sem receber credenciais de longo prazo da conta de produção. Qual solução atende?',
      concepts: [{ id: 'iam.cross-account-role' }],
      xp: 5,
      difficulty: 2,
      domain: 'd1',
      options: [
        { id: 'a', text: 'Uma política de recurso nas instâncias liberando a conta de operações.', correct: false, consequence: 'O EC2 não aceita políticas de recurso nas instâncias.' },
        { id: 'b', text: 'Um usuário IAM na conta de produção, com chaves para cada analista.', correct: false, consequence: 'Distribui credenciais de longo prazo da conta de produção.' },
        { id: 'c', text: 'Uma role de leitura do EC2 na produção, assumida pelos analistas.', correct: true, consequence: 'Os analistas recebem credenciais temporárias com as permissões da role.' },
        { id: 'd', text: 'Compartilhar as instâncias com a conta de operações pelo AWS RAM.', correct: false, consequence: 'O RAM compartilha tipos de recurso específicos, e instâncias não estão entre eles.' },
      ],
      explanation: [
        'Há dois caminhos para acesso entre contas: **role entre contas** ou **política de recurso**. Como o EC2 não aceita política de recurso nas instâncias, o caminho é uma **role** na conta de produção, com leitura do EC2, cuja trust policy confia na conta de operações. Quem assume deixa as próprias permissões de lado e trabalha com as da role.',
        'Instâncias não têm política de recurso. Usuários IAM com chaves distribuem credenciais de longo prazo. E o RAM não compartilha instâncias.',
        '**Regra prática:** use role quando o serviço não aceita política de recurso. Com política de recurso, o principal mantém as próprias permissões, o que ajuda a copiar dados entre contas.',
      ],
    },
    {
      id: 'rv:iax.f06.m4.a3:vendor',
      kind: 'decision',
      title: 'O fornecedor que pediu chaves de acesso',
      prompt:
        'Uma empresa contratou um fornecedor de análise de custos que atende vários clientes e pediu uma **chave de acesso** com leitura da conta. A segurança quer dar o acesso **sem entregar credenciais de longo prazo** e sem que outro cliente do fornecedor possa usar esse acesso. O que fazer?',
      concepts: [{ id: 'iam.confused-deputy' }, { id: 'iam.cross-account-role' }],
      xp: 5,
      difficulty: 1,
      domain: 'd1',
      options: [
        { id: 'a', text: 'Criar um usuário IAM de leitura e enviar a chave ao fornecedor.', correct: false, consequence: 'Entrega uma credencial de longo prazo que pode vazar ou ser reutilizada.' },
        { id: 'b', text: 'Uma role para a conta do fornecedor, exigindo o External ID dele.', correct: true, consequence: 'Credenciais temporárias, e só o pedido com o ID da empresa assume a role.' },
        { id: 'c', text: 'Uma role que qualquer conta pode assumir, protegida por um nome difícil.', correct: false, consequence: 'Esconder o nome não é controle: qualquer conta poderia tentar.' },
        { id: 'd', text: 'Compartilhar a senha de um usuário administrador com o fornecedor.', correct: false, consequence: 'Senha compartilhada e acesso total, sem nenhuma separação.' },
      ],
      explanation: [
        'Para terceiros, a resposta é uma **role entre contas** que a conta do fornecedor pode assumir, com credenciais temporárias. Como o fornecedor atende vários clientes, a trust policy exige o **External ID** que ele gerou para esta empresa: assim, outro cliente não consegue fazer o fornecedor agir nesta conta, o problema do **assistente confuso**.',
        'Usuário IAM com chave e senha compartilhada são credenciais de longo prazo. E nome difícil não é controle de acesso.',
        '**Regra prática:** "um fornecedor terceirizado precisa acessar a conta" pede role entre contas com External ID na trust policy. O External ID não é segredo: ele separa os clientes.',
      ],
    },
    {
      id: 'rv:iax.f06.m4.a4',
      kind: 'decision',
      title: 'Notificações de buckets que não são da empresa',
      prompt:
        'Um tópico SNS recebe notificações de eventos de um bucket S3 da empresa. A política do tópico permite `sns:Publish` ao principal de serviço `s3.amazonaws.com`, sem condições. A segurança quer garantir que **só o bucket da empresa**, e não buckets de outras contas, consiga publicar no tópico. O que incluir na política?',
      concepts: [{ id: 'iam.confused-deputy' }],
      xp: 5,
      difficulty: 3,
      domain: 'd1',
      options: [
        { id: 'a', text: 'Uma condição sts:ExternalId com um valor combinado com o S3.', correct: false, consequence: 'External ID é para roles assumidas por terceiros, não para serviços.' },
        { id: 'b', text: 'Uma condição aws:PrincipalOrgID com o ID da organização da empresa.', correct: false, consequence: 'O principal é o serviço S3, que não pertence à organização.' },
        { id: 'c', text: 'Uma condição aws:SourceIp com as faixas de IP do S3 na Região.', correct: false, consequence: 'Os IPs do S3 são os mesmos para buckets de qualquer conta.' },
        { id: 'd', text: 'Condições aws:SourceArn (o bucket) e aws:SourceAccount (a conta).', correct: true, consequence: 'O S3 só publica quando age em nome daquele bucket, daquela conta.' },
      ],
      explanation: [
        'Quando a política de um recurso libera um **principal de serviço**, qualquer cliente desse serviço poderia, em tese, fazer o serviço agir em seu nome: é o **assistente confuso** entre serviços. As chaves **aws:SourceArn** e **aws:SourceAccount** dizem em nome de qual recurso e de qual conta o serviço está agindo, e limitam a publicação ao bucket da empresa.',
        'External ID é para roles entre contas. aws:PrincipalOrgID não serve para principais de serviço. E IPs não distinguem buckets.',
        '**Regra prática:** confused deputy entre contas se resolve com External ID; entre serviços, com aws:SourceArn ou aws:SourceAccount na política de recurso.',
      ],
    },
    {
      id: 'rv:iax.f06.m4.a3:subnet',
      kind: 'decision',
      title: 'Uma rede central para várias contas',
      prompt:
        'Uma organização mantém uma VPC central na conta de rede e quer que as contas das equipes **lancem recursos nas sub-redes dessa VPC**, sem criar VPCs duplicadas e com o **menor esforço operacional**. Qual serviço atende?',
      concepts: [{ id: 'ram.sharing' }],
      xp: 5,
      difficulty: 1,
      domain: 'd1',
      options: [
        { id: 'a', text: 'VPC peering entre a VPC central e uma VPC nova em cada conta.', correct: false, consequence: 'Liga redes separadas, mas cada conta continua com a própria VPC.' },
        { id: 'b', text: 'Uma role entre contas que as equipes assumem na conta de rede central.', correct: false, consequence: 'As equipes passariam a lançar recursos na conta de rede, não nas delas.' },
        { id: 'c', text: 'O AWS RAM, compartilhando as sub-redes com as contas das equipes.', correct: true, consequence: 'As contas lançam recursos nas sub-redes compartilhadas, sem duplicar a VPC.' },
        { id: 'd', text: 'Um modelo do CloudFormation que recria a VPC em cada conta.', correct: false, consequence: 'Duplica a VPC, que é justamente o que a empresa quer evitar.' },
      ],
      explanation: [
        'O **AWS Resource Access Manager (RAM)** compartilha recursos, como sub-redes de uma VPC, com outras contas, com a organização ou com OUs, **sem duplicá-los**. Dentro da organização, o compartilhamento não precisa de convite, e o RAM não tem cobrança adicional.',
        'Peering e modelos replicados criam VPCs separadas. E uma role faria os recursos nascerem na conta de rede.',
        '**Regra prática:** "compartilhar sub-redes, Transit Gateways ou outros recursos entre contas sem duplicá-los" pede o AWS RAM. Quem recebe continua sujeito às próprias políticas IAM e SCPs.',
      ],
    },
  ],
}
