/**
 * Questões da Revisão da Fase 3 da IAM e Access Management (anatomia de uma
 * política), no formato do exame SAA-C03. Fatos conferidos na documentação da
 * AWS (ver docs/VERIFICACAO-DE-CONTEUDO.md). As empresas são fictícias.
 */
import type { ReviewSet } from '../../../../engine/types'

export const REVIEW_F03: ReviewSet = {
  phaseId: 'iax.f03',
  questions: [
    {
      id: 'rv:iax.f03.m1.a2:get',
      kind: 'decision',
      multiple: true,
      title: 'O alcance de um statement com curinga',
      prompt:
        'Um analista tem só a política de identidade abaixo, e nenhuma outra política se aplica ao bucket. Ele faz várias requisições ao bucket relatorios. Quais delas são **permitidas** por esse statement? (Escolha DUAS.)',
      exhibits: [
        {
          title: 'Política de identidade do analista',
          code: '{\n  "Version": "2012-10-17",\n  "Statement": [{\n    "Effect": "Allow",\n    "Action": "s3:Get*",\n    "Resource": "arn:aws:s3:::relatorios/2026/*"\n  }]\n}',
        },
      ],
      concepts: [{ id: 'iam.wildcards' }, { id: 'iam.arn' }],
      xp: 5,
      difficulty: 2,
      domain: 'd1',
      options: [
        { id: 'a', text: 's3:GetObject no objeto relatorios/2026/marco/vendas.pdf.', correct: true, consequence: 'A ação começa com Get, e o objeto fica abaixo de 2026/.' },
        { id: 'b', text: 's3:PutObject no objeto relatorios/2026/abril/vendas.pdf.', correct: false, consequence: 'Put não casa com `Get*`: gravar não está permitido.' },
        { id: 'c', text: 's3:GetObjectAcl no objeto relatorios/2026/marco/vendas.pdf.', correct: true, consequence: 'GetObjectAcl também começa com Get e é uma ação de objeto.' },
        { id: 'd', text: 's3:ListBucket no bucket relatorios, com o prefixo 2026/.', correct: false, consequence: 'ListBucket não começa com Get e usa o ARN do bucket, que não está no Resource.' },
        { id: 'e', text: 's3:GetObject no objeto relatorios/2025/dezembro/vendas.pdf.', correct: false, consequence: 'O objeto fica abaixo de 2025/, fora do Resource.' },
      ],
      explanation: [
        'O `*` casa qualquer sequência de caracteres. Em `s3:Get*`, cobre todas as ações que começam com Get, como GetObject e GetObjectAcl. Em `arn:aws:s3:::relatorios/2026/*`, cobre todos os objetos abaixo de 2026/. A requisição é permitida quando a ação e o recurso casam ao mesmo tempo.',
        'PutObject não começa com Get. ListBucket nem começa com Get nem usa ARN de objeto: ações de bucket usam o ARN do bucket, sem a barra. E um objeto em 2025/ está fora do recurso.',
        '**Regra prática:** leia Action e Resource juntos. Ações de objeto pedem `bucket/chave`; ações de bucket, como ListBucket, pedem só o ARN do bucket.',
      ],
    },
    {
      id: 'rv:iax.f03.m1.a3',
      kind: 'decision',
      title: 'A listagem que continua negada',
      prompt:
        'Uma aplicação precisa **listar** os objetos do bucket fotos e já baixa os arquivos sem problema. A role dela tem o statement abaixo, mas toda listagem recebe AccessDenied. Qual correção resolve com o **menor privilégio**?',
      exhibits: [
        {
          title: 'Statement da role',
          code: '{\n  "Effect": "Allow",\n  "Action": ["s3:ListBucket", "s3:GetObject"],\n  "Resource": "arn:aws:s3:::fotos/*"\n}',
        },
      ],
      concepts: [{ id: 'iam.arn' }, { id: 'iam.wildcards' }],
      xp: 5,
      difficulty: 1,
      domain: 'd1',
      options: [
        { id: 'a', text: 'Trocar o Resource por "*", para cobrir o bucket e os objetos.', correct: false, consequence: 'Funciona, mas libera todos os buckets da conta.' },
        { id: 'b', text: 'Trocar a ação por s3:List*, que cobre todas as listagens.', correct: false, consequence: 'O problema é o recurso: o ARN de objeto continua sem cobrir o bucket.' },
        { id: 'c', text: 'Incluir arn:aws:s3:::fotos no Resource, ao lado do ARN dos objetos.', correct: true, consequence: 'ListBucket passa a casar com o ARN do bucket, e GetObject continua nos objetos.' },
        { id: 'd', text: 'Trocar o Resource por arn:aws:s3:::fotos, sem a barra no final.', correct: false, consequence: 'A listagem passa, mas o download para: GetObject precisa do ARN dos objetos.' },
      ],
      explanation: [
        '**s3:ListBucket** é uma ação de **bucket** e usa o ARN do bucket, `arn:aws:s3:::fotos`. **s3:GetObject** é uma ação de **objeto** e usa `arn:aws:s3:::fotos/*`. O statement só tem o ARN dos objetos, por isso a listagem falha e o download funciona. Com os dois ARNs, as duas ações passam.',
        'Trocar para "*" abre todos os buckets. Ampliar a ação não resolve o recurso. E tirar o ARN dos objetos quebra o download.',
        '**Regra prática:** bucket e objetos são recursos diferentes. Listar pede o ARN do bucket; ler ou gravar objetos pede o ARN com `/*`.',
      ],
    },
    {
      id: 'rv:iax.f03.m1.a1:principal',
      kind: 'decision',
      title: 'A política que o console recusou',
      prompt:
        'Um engenheiro escreveu uma política **gerenciada pelo cliente** para anexar à usuária ana, com Effect, Action, Resource e o elemento `"Principal": {"AWS": "arn:aws:iam::111122223333:user/ana"}`. O console **recusa a política** ao salvar. Qual é a causa?',
      concepts: [{ id: 'iam.policy-elements' }],
      xp: 5,
      difficulty: 1,
      domain: 'd1',
      options: [
        { id: 'a', text: 'O Principal de uma política precisa ser sempre "*", nunca um ARN específico.', correct: false, consequence: 'Políticas de recurso aceitam principais específicos; o erro é outro.' },
        { id: 'b', text: 'Política de identidade não tem Principal: ele é a identidade anexada.', correct: true, consequence: 'Sem o elemento Principal, a política é aceita e vale para ana ao ser anexada.' },
        { id: 'c', text: 'Falta o Sid, que é obrigatório em todo statement de uma política.', correct: false, consequence: 'O Sid é opcional: serve só para identificar o statement.' },
        { id: 'd', text: 'O ARN de um usuário IAM precisa incluir a Região onde ele foi criado.', correct: false, consequence: 'O IAM é global: o ARN de um usuário não tem Região.' },
      ],
      explanation: [
        'Uma política de **identidade** é anexada a um usuário, grupo ou role, e o principal é a própria identidade. Por isso ela **não tem o elemento Principal**. O Principal aparece só em políticas de **recurso**, como bucket policies e trust policies, para dizer quem recebe o acesso.',
        'O Principal não precisa ser "*". O Sid é opcional. E ARNs do IAM não têm Região.',
        '**Regra prática:** toda política tem Version e Statement, e cada statement tem Effect, Action e Resource. Principal só nas políticas de recurso.',
      ],
    },
    {
      id: 'rv:iax.f03.statement-esquecido',
      kind: 'decision',
      title: 'O download que funciona de casa',
      prompt:
        'A política abaixo deveria permitir downloads do bucket contratos **só a partir da rede da empresa** (203.0.113.0/24). Mesmo assim, um analista consegue baixar contratos de casa. Nenhuma outra política se aplica. Qual é a causa e a correção?',
      exhibits: [
        {
          title: 'Política de identidade do grupo Jurídico',
          code: '{\n  "Version": "2012-10-17",\n  "Statement": [\n    {\n      "Sid": "SoDoEscritorio",\n      "Effect": "Allow",\n      "Action": "s3:GetObject",\n      "Resource": "arn:aws:s3:::contratos/*",\n      "Condition": { "IpAddress": { "aws:SourceIp": "203.0.113.0/24" } }\n    },\n    {\n      "Sid": "Testes",\n      "Effect": "Allow",\n      "Action": "s3:*",\n      "Resource": "arn:aws:s3:::contratos/*"\n    }\n  ]\n}',
        },
      ],
      concepts: [{ id: 'iam.policy-elements' }, { id: 'iam.conditions' }],
      xp: 5,
      difficulty: 2,
      domain: 'd1',
      options: [
        { id: 'a', text: 'A chave aws:SourceIp não existe fora da empresa; trocar por IpAddressIfExists.', correct: false, consequence: 'A chave existe na requisição de casa; ela só não casa com a faixa.' },
        { id: 'b', text: 'Os statements combinam com OU: remover o statement Testes.', correct: true, consequence: 'Sobra só o Allow condicionado à rede da empresa.' },
        { id: 'c', text: 'A versão 2012-10-17 ignora condições; trocar pela versão 2008-10-17.', correct: false, consequence: 'A 2012-10-17 é a versão atual e avalia condições normalmente.' },
        { id: 'd', text: 'Condições só valem em bucket policies; mover a regra para o bucket.', correct: false, consequence: 'Políticas de identidade aceitam condições do mesmo jeito.' },
      ],
      explanation: [
        'Os **statements** de uma política combinam com **OU**: basta um deles permitir. O statement Testes permite `s3:*` nos objetos sem nenhuma condição, então o download de casa passa por ele, mesmo que o primeiro statement não se aplique. Removendo Testes, resta só o Allow condicionado à rede da empresa.',
        'A chave aws:SourceIp está presente na requisição de casa, com outro IP. A versão 2012-10-17 é a atual. E condições funcionam em políticas de identidade.',
        '**Regra prática:** numa política com vários statements, procure o que permite mais. Um Allow amplo esquecido anula as restrições de outro statement.',
      ],
    },
    {
      id: 'rv:iax.f03.m2.a1:cross',
      kind: 'decision',
      multiple: true,
      title: 'Mensagens de outra conta para a fila',
      prompt:
        'Uma aplicação na conta B, com a role Emissor, precisa **enviar mensagens** a uma fila SQS da conta A, e nada mais. As duas contas são da mesma empresa, mas de equipes diferentes. Que configurações são **necessárias**? (Escolha DUAS.)',
      concepts: [{ id: 'iam.resource-policy' }, { id: 'iam.policy-types' }],
      xp: 5,
      difficulty: 2,
      domain: 'd1',
      options: [
        { id: 'a', text: 'Na fila, na conta A, uma política que permita sqs:SendMessage à role Emissor.', correct: true, consequence: 'A conta dona da fila libera a role da outra conta.' },
        { id: 'b', text: 'Na conta A, uma política de identidade anexada à role Emissor.', correct: false, consequence: 'A conta A não anexa políticas a identidades da conta B.' },
        { id: 'c', text: 'Na conta B, uma política de identidade na role Emissor permitindo enviar à fila.', correct: true, consequence: 'Entre contas, a identidade de quem pede também precisa permitir.' },
        { id: 'd', text: 'Na fila, uma política com o grupo de desenvolvedores da conta B no Principal.', correct: false, consequence: 'Grupos não podem ser principal, e quem envia é a role.' },
        { id: 'e', text: 'Uma SCP na conta B que permita sqs:SendMessage para a fila.', correct: false, consequence: 'SCPs só limitam o que outras políticas permitem; não concedem acesso a ninguém.' },
      ],
      explanation: [
        'Políticas de **recurso**, como a política de uma fila SQS, têm o elemento Principal e podem dar acesso a **outras contas**. Entre contas, o acesso precisa ser permitido dos dois lados: a política da fila, na conta A, libera a role Emissor, e a política de **identidade** da role, na conta B, permite enviar à fila.',
        'Uma conta não anexa políticas a identidades de outra. Grupos não são principal. E SCPs apenas limitam, nunca concedem.',
        '**Regra prática:** dentro da mesma conta, basta um Allow na identidade ou no recurso. Entre contas, são necessários os dois.',
      ],
    },
    {
      id: 'rv:iax.f03.m2.a3:pb',
      kind: 'decision',
      title: 'O limite que não deu acesso',
      prompt:
        'Para conter uma nova usuária IAM, o administrador anexou a ela um **permissions boundary** com uma política que permite `s3:*`. A usuária não tem nenhuma outra política, e toda requisição ao S3 recebe AccessDenied. Ela precisa **ler um bucket**. O que fazer?',
      concepts: [{ id: 'iam.policy-types' }],
      xp: 5,
      difficulty: 1,
      domain: 'd1',
      options: [
        { id: 'a', text: 'Anexar a ela uma política de identidade que permita ler o bucket.', correct: true, consequence: 'A leitura passa, porque fica dentro do limite do boundary.' },
        { id: 'b', text: 'Trocar o boundary por outro que permita s3:GetObject explicitamente.', correct: false, consequence: 'O boundary continua só limitando: ainda falta quem conceda.' },
        { id: 'c', text: 'Remover o boundary, porque ele nega tudo o que não estiver nele.', correct: false, consequence: 'Sem boundary e sem política de identidade, o acesso continua negado.' },
        { id: 'd', text: 'Aguardar a propagação do boundary, que pode levar algumas horas.', correct: false, consequence: 'Não há espera: falta um Allow numa política que conceda.' },
      ],
      explanation: [
        'Só políticas de **identidade**, de **recurso** e as ACLs **concedem** acesso. **Permissions boundaries**, SCPs, RCPs e session policies **apenas limitam**: definem o máximo que outras políticas podem dar. Com um boundary e nenhuma política de identidade, não há nada para limitar, e tudo é negado. Uma política de identidade com a leitura resolve.',
        'Trocar o boundary ou removê-lo não cria um Allow. E não há propagação a esperar.',
        '**Regra prática:** "dar acesso" pede política de identidade ou de recurso. "Impedir que passe de um limite" pede boundary, SCP ou RCP.',
      ],
    },
    {
      id: 'rv:iam.condition-keys:vpce',
      kind: 'decision',
      title: 'A restrição de rede que bloqueou a VPC',
      prompt:
        'Uma bucket policy nega o acesso quando a origem não está na faixa pública 203.0.113.0/24, usada pelo escritório. As instâncias EC2 de uma VPC passaram a acessar o bucket por um **gateway endpoint do S3** e agora recebem AccessDenied. A empresa quer **manter o tráfego pelo endpoint** e liberar só essa VPC além do escritório. O que fazer?',
      exhibits: [
        {
          title: 'Statement da bucket policy',
          code: '{\n  "Effect": "Deny",\n  "Principal": "*",\n  "Action": "s3:*",\n  "Resource": ["arn:aws:s3:::dados", "arn:aws:s3:::dados/*"],\n  "Condition": {\n    "NotIpAddress": { "aws:SourceIp": "203.0.113.0/24" }\n  }\n}',
        },
      ],
      concepts: [{ id: 'iam.condition-keys' }],
      xp: 5,
      difficulty: 3,
      domain: 'd1',
      options: [
        { id: 'a', text: 'Incluir a faixa privada da VPC, como 10.0.0.0/16, no aws:SourceIp.', correct: false, consequence: 'Pelo endpoint, a requisição não traz aws:SourceIp, e IPs privados não entram nessa chave.' },
        { id: 'b', text: 'Incluir no aws:SourceIp o IP elástico do NAT gateway da VPC.', correct: false, consequence: 'O tráfego vai pelo endpoint, não pelo NAT: esse IP não aparece.' },
        { id: 'c', text: 'Remover o endpoint, para o tráfego sair pelo NAT com um IP conhecido.', correct: false, consequence: 'Contraria o requisito de manter o tráfego pelo endpoint.' },
        { id: 'd', text: 'Negar só quando a origem não for o escritório nem o endpoint (aws:SourceVpce).', correct: true, consequence: 'O endpoint passa a ser reconhecido pela chave certa, e o resto continua negado.' },
      ],
      explanation: [
        'Quando a requisição chega por um **VPC endpoint**, a chave **aws:SourceIp não existe**. Para identificar esse tráfego, use **aws:SourceVpce** (o endpoint) ou **aws:SourceVpc** (a VPC). A política passa a negar só o que não vem do escritório nem do endpoint.',
        'IPs privados da VPC não aparecem em aws:SourceIp. O IP do NAT não é usado quando o tráfego vai pelo endpoint. E remover o endpoint contraria o requisito.',
        '**Regra prática:** "só da rede da empresa" pede aws:SourceIp. Se o acesso vem por VPC endpoint, troque por aws:SourceVpce ou aws:SourceVpc.',
      ],
    },
    {
      id: 'rv:iax.f03.so-do-escritorio',
      kind: 'decision',
      title: 'Console e CLI só a partir do escritório',
      prompt:
        'Uma empresa quer que os usuários IAM do grupo Financeiro só consigam usar a AWS **a partir da rede do escritório**, cuja faixa pública é 198.51.100.0/24. Qual chave de condição deve ir no Deny da política do grupo?',
      concepts: [{ id: 'iam.condition-keys' }],
      xp: 5,
      difficulty: 1,
      domain: 'd1',
      options: [
        { id: 'a', text: 'aws:RequestedRegion, com a Região onde fica o escritório.', correct: false, consequence: 'Controla qual Região é chamada, não de onde vem a requisição.' },
        { id: 'b', text: 'aws:SecureTransport, para aceitar só conexões cifradas.', correct: false, consequence: 'Exige HTTPS, de qualquer lugar do mundo.' },
        { id: 'c', text: 'aws:SourceIp, comparada com a faixa 198.51.100.0/24.', correct: true, consequence: 'Requisições de fora da faixa caem no Deny.' },
        { id: 'd', text: 'aws:PrincipalOrgID, com o ID da organização da empresa.', correct: false, consequence: 'Confere a organização do principal, não a rede de origem.' },
      ],
      explanation: [
        'A chave **aws:SourceIp** traz o IP público de origem da requisição. Um Deny com **NotIpAddress** para a faixa do escritório bloqueia qualquer chamada vinda de fora.',
        'aws:RequestedRegion limita Regiões. aws:SecureTransport exige HTTPS. aws:PrincipalOrgID confere a organização.',
        '**Regra prática:** ligue o requisito à chave: rede da empresa é aws:SourceIp, HTTPS é aws:SecureTransport, Regiões aprovadas é aws:RequestedRegion e contas da organização é aws:PrincipalOrgID.',
      ],
    },
    {
      id: 'rv:iax.f03.contas-da-organizacao',
      kind: 'decision',
      title: 'Um bucket para contas que não param de chegar',
      prompt:
        'Uma empresa tem **200 contas** numa organização, e novas contas são criadas toda semana. Todas devem poder ler um bucket de configurações compartilhadas, e nenhuma conta de fora. A equipe quer a solução com o **menor esforço operacional**. Como escrever a bucket policy?',
      concepts: [{ id: 'iam.condition-keys' }, { id: 'iam.resource-policy' }],
      xp: 5,
      difficulty: 2,
      domain: 'd1',
      options: [
        { id: 'a', text: 'Listar no Principal o ID de cada conta e atualizar a lista a cada conta nova.', correct: false, consequence: 'Funciona, mas exige editar a política toda semana.' },
        { id: 'b', text: 'Principal "*" com a condição aws:PrincipalOrgID igual ao ID da organização.', correct: true, consequence: 'Contas novas da organização entram sem mudar a política.' },
        { id: 'c', text: 'Principal "*" com a condição aws:SourceIp das redes de todas as contas.', correct: false, consequence: 'Contas não têm uma faixa de IP fixa, e a lista também muda.' },
        { id: 'd', text: 'Principal "*" sem condição, já que só a organização sabe o nome do bucket.', correct: false, consequence: 'Qualquer pessoa que descobrir o nome lê o bucket.' },
      ],
      explanation: [
        'A chave **aws:PrincipalOrgID** traz a organização do principal que faz a requisição. Com Principal `"*"` e essa condição, toda conta da organização lê o bucket, inclusive as que forem criadas depois, e contas de fora são negadas.',
        'Listar contas exige manutenção constante. IPs não identificam contas. E esconder o nome do bucket não é controle de acesso.',
        '**Regra prática:** "só contas da minha organização, sem listar cada uma" pede aws:PrincipalOrgID numa política de recurso.',
      ],
    },
    {
      id: 'rv:iax.f03.m4.a2',
      kind: 'decision',
      title: 'Dois escritórios na mesma condição',
      prompt:
        'Uma política tem o Deny abaixo, e o usuário também tem um Allow para as ações que usa. Um colega acha que a política **nega todo mundo**, porque qualquer IP é diferente de pelo menos uma das faixas. Um usuário faz uma requisição a partir do IP **198.51.100.7**. Como ela é avaliada?',
      exhibits: [
        {
          title: 'Statement com Deny',
          code: '{\n  "Effect": "Deny",\n  "Action": "*",\n  "Resource": "*",\n  "Condition": {\n    "NotIpAddress": {\n      "aws:SourceIp": ["203.0.113.0/24", "198.51.100.0/24"]\n    }\n  }\n}',
        },
      ],
      concepts: [{ id: 'iam.conditions' }],
      xp: 5,
      difficulty: 3,
      domain: 'd1',
      options: [
        { id: 'a', text: 'Negada: o IP é diferente de 203.0.113.0/24, e isso basta para o Deny.', correct: false, consequence: 'Num operador negado, nenhum valor pode casar; um que casa já desliga a condição.' },
        { id: 'b', text: 'Permitida: o IP casa com 198.51.100.0/24, e o Deny não se aplica.', correct: true, consequence: 'Só IPs fora das duas faixas caem no Deny.' },
        { id: 'c', text: 'Negada: valores da mesma chave combinam com E, e o IP precisa estar nas duas.', correct: false, consequence: 'Valores da mesma chave combinam com OU, não com E.' },
        { id: 'd', text: 'Permitida só se a requisição usar HTTPS, que a condição exige implicitamente.', correct: false, consequence: 'A condição não fala de HTTPS: só compara o IP de origem.' },
      ],
      explanation: [
        'Vários **valores** da mesma chave combinam com **OU**. Num operador **negado**, como NotIpAddress, a lógica vira NOR: a condição só é verdadeira quando **nenhum** valor casa. O IP 198.51.100.7 casa com a segunda faixa, então a condição é falsa e o Deny não se aplica. O Allow do usuário vale.',
        'O colega aplicou a lógica valor a valor, como se bastasse diferir de um. Valores não combinam com E. E nada na condição exige HTTPS.',
        '**Regra prática:** operadores diferentes e chaves diferentes combinam com E; valores da mesma chave, com OU. Num operador negado com vários valores, o Deny vale só para quem não casa com nenhum.',
      ],
    },
    {
      id: 'rv:iax.f03.m1.a4',
      kind: 'decision',
      title: 'Uma Região só, sem quebrar o IAM',
      prompt:
        'Uma empresa quer que os desenvolvedores de uma conta **só criem recursos em sa-east-1**. Um Deny para tudo fora de sa-east-1, com aws:RequestedRegion, quebrou o console do **IAM**, cujo endpoint fica em us-east-1. A empresa quer a restrição **sem bloquear os serviços globais**. Como escrever o Deny?',
      concepts: [{ id: 'iam.not-action' }, { id: 'iam.condition-keys' }],
      xp: 5,
      difficulty: 3,
      domain: 'd1',
      options: [
        { id: 'a', text: 'Deny com Action "*" e condição aws:RequestedRegion diferente de sa-east-1.', correct: false, consequence: 'É a versão atual, que também nega as chamadas ao IAM em us-east-1.' },
        { id: 'b', text: 'Deny com NotAction para o IAM e os serviços globais, e a mesma condição.', correct: true, consequence: 'Tudo fora de sa-east-1 é negado, exceto os serviços listados.' },
        { id: 'c', text: 'Allow com NotAction `iam:*`, sem condição, no lugar do Deny atual.', correct: false, consequence: 'Permite tudo menos o IAM, em qualquer Região: o contrário do pedido.' },
        { id: 'd', text: 'Deny com Action `iam:*` e a mesma condição, liberando o resto.', correct: false, consequence: 'Nega só o IAM fora de sa-east-1 e libera os demais serviços em qualquer Região.' },
      ],
      explanation: [
        '**NotAction** num **Deny** cria exceções: "negue tudo, menos isto". Listando o IAM e os outros serviços globais em NotAction, com a condição aws:RequestedRegion diferente de sa-east-1, o Deny bloqueia os demais serviços fora da Região aprovada e deixa os globais funcionarem.',
        'Action `"*"` é o que quebrou o IAM. Um Allow com NotAction libera muito mais do que parece, inclusive serviços lançados depois. E negar só o IAM inverte o pedido.',
        '**Regra prática:** NotAction é para exceções dentro de um Deny. Num Allow, ele permite tudo o que não está na lista.',
      ],
    },
    {
      id: 'rv:iax.f03.m2.a2:only',
      kind: 'decision',
      title: 'Uma permissão que nasce e morre com a role',
      prompt:
        'Uma role temporária de migração precisa de uma permissão **exclusiva dela**, que não pode ser anexada por engano a nenhuma outra identidade e deve **sumir junto com a role** quando ela for excluída. Qual tipo de política atende?',
      concepts: [{ id: 'iam.managed-vs-inline' }],
      xp: 5,
      difficulty: 1,
      domain: 'd1',
      options: [
        { id: 'a', text: 'Uma política gerenciada pelo cliente, anexada só a essa role.', correct: false, consequence: 'Ela continua existindo depois da role e pode ser anexada a outras identidades.' },
        { id: 'b', text: 'Uma política gerenciada pela AWS com as ações necessárias.', correct: false, consequence: 'É compartilhada por toda a AWS e não é editável.' },
        { id: 'c', text: 'Uma política inline, embutida na própria role de migração.', correct: true, consequence: 'Relação um para um, excluída junto com a role.' },
        { id: 'd', text: 'Uma bucket policy citando a role no Principal.', correct: false, consequence: 'Fica no recurso e sobrevive à exclusão da role.' },
      ],
      explanation: [
        'Uma política **inline** é embutida numa única identidade: relação estrita de **um para um**, sem como ser anexada a outra, e **excluída junto com ela**. É o tipo certo para uma permissão exclusiva de uma role temporária.',
        'A gerenciada pelo cliente é reutilizável e sobrevive à role. A gerenciada pela AWS é pronta e não editável. E uma bucket policy fica no recurso.',
        '**Regra prática:** "um para um" ou "excluída junto com a identidade" pedem inline. "Reutilizar em várias identidades com histórico de versões" pede gerenciada pelo cliente.',
      ],
    },
    {
      id: 'rv:iax.f03.m4.a3',
      kind: 'decision',
      title: 'A pasta do colega',
      prompt:
        'Cada usuário IAM de uma empresa tem uma pasta no bucket home, e todos estão num grupo com a política abaixo. Nenhuma outra política se aplica. A usuária **ana** tenta baixar o arquivo `home/joao/planilha.xlsx`. Qual é o resultado da requisição?',
      exhibits: [
        {
          title: 'Política do grupo',
          code: '{\n  "Version": "2012-10-17",\n  "Statement": [{\n    "Effect": "Allow",\n    "Action": ["s3:GetObject", "s3:PutObject"],\n    "Resource": "arn:aws:s3:::home/${aws:username}/*"\n  }]\n}',
        },
      ],
      concepts: [{ id: 'iam.policy-variables' }],
      xp: 5,
      difficulty: 1,
      domain: 'd1',
      options: [
        { id: 'a', text: 'É permitido, porque o grupo dá acesso a todas as pastas do bucket.', correct: false, consequence: 'A variável troca o nome pela usuária que pede: só a pasta dela.' },
        { id: 'b', text: 'É negado por um Deny explícito para as pastas dos outros.', correct: false, consequence: 'Não há Deny na política; a negação vem da falta de permissão.' },
        { id: 'c', text: 'É negado, porque para ana o Resource vale só para home/ana/.', correct: true, consequence: 'Nada permite home/joao/ para ela: é um deny implícito.' },
        { id: 'd', text: 'É permitido, porque a variável ${aws:username} casa qualquer nome.', correct: false, consequence: 'A variável não é curinga: vira o nome de quem faz a requisição.' },
      ],
      explanation: [
        'A **variável de política** `${aws:username}` é trocada, em cada requisição, pelo nome de quem pede. Para ana, o Resource vira `arn:aws:s3:::home/ana/*`. A pasta de joao não casa, e como nada a permite, o resultado é um **deny implícito**.',
        'A variável não é um curinga. E a negação não precisa de Deny: basta não haver Allow.',
        '**Regra prática:** "cada pessoa só na própria pasta, com uma única política" pede uma variável de política no Resource.',
      ],
    },
    {
      id: 'rv:iax.f03.m3.a2:aup',
      kind: 'decision',
      title: 'A ação que abre a porta para todas as outras',
      prompt:
        'Numa revisão de acesso, a política de um desenvolvedor tem as ações abaixo. A auditoria quer remover primeiro a que traz **risco de escalada de privilégio**, isto é, a que permite que ele dê mais acesso a si mesmo. Qual é?',
      exhibits: [
        {
          title: 'Ações na política do desenvolvedor',
          code: 's3:ListAllMyBuckets\ns3:GetObject\ns3:PutObject\nec2:CreateTags\niam:AttachUserPolicy',
        },
      ],
      concepts: [{ id: 'iam.access-levels' }],
      xp: 5,
      difficulty: 2,
      domain: 'd1',
      options: [
        { id: 'a', text: 's3:PutObject, do nível Write, que altera dados.', correct: false, consequence: 'Grava objetos, mas não muda as permissões de ninguém.' },
        { id: 'b', text: 'ec2:CreateTags, do nível Tagging, que muda atributos de recursos.', correct: false, consequence: 'Tags só dão acesso se alguma política as usar em condições; não é o risco maior aqui.' },
        { id: 'c', text: 's3:ListAllMyBuckets, do nível List, que revela recursos.', correct: false, consequence: 'Mostra nomes de buckets, mas não concede acesso.' },
        { id: 'd', text: 'iam:AttachUserPolicy, do nível Permissions management.', correct: true, consequence: 'Com ela, o desenvolvedor anexa a si mesmo qualquer política, até AdministratorAccess.' },
      ],
      explanation: [
        'O IAM agrupa as ações em **List**, **Read**, **Write**, **Permissions management** e **Tagging**. **Permissions management** é o nível mais sensível: quem pode anexar ou alterar políticas consegue dar a si mesmo mais acesso. Com iam:AttachUserPolicy, o desenvolvedor anexaria AdministratorAccess ao próprio usuário.',
        'Write altera dados, List revela nomes e Tagging muda atributos. Nenhuma delas, sozinha, muda as permissões do desenvolvedor.',
        '**Regra prática:** numa revisão de menor privilégio, procure primeiro as ações de Permissions management. Elas valem tanto quanto todas as outras juntas.',
      ],
    },
  ],
}
