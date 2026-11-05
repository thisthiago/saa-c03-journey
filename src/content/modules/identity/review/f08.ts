/**
 * Questões da Revisão da Fase 8 da IAM e Access Management (várias contas e
 * guardrails), no formato do exame SAA-C03. Fatos conferidos na documentação
 * da AWS (ver docs/VERIFICACAO-DE-CONTEUDO.md). As empresas são fictícias.
 */
import type { ReviewSet } from '../../../../engine/types'

export const REVIEW_F08: ReviewSet = {
  phaseId: 'iax.f08',
  questions: [
    {
      id: 'rv:iax.f08.m1.a1:mgmt',
      kind: 'decision',
      title: 'Doze faturas e nenhum desconto',
      prompt:
        'Uma empresa tem **12 contas AWS** independentes, cada uma com a própria fatura e o próprio cartão. A diretoria financeira quer **uma única fatura** e que o uso das contas seja somado para alcançar faixas de preço por volume, com o **menor esforço**. O que fazer?',
      concepts: [{ id: 'org.organizations' }],
      xp: 5,
      difficulty: 1,
      domain: 'd4',
      options: [
        { id: 'a', text: 'Ativar o Cost Explorer em cada conta e somar os relatórios numa planilha.', correct: false, consequence: 'Gera relatórios, mas as faturas e as faixas de preço continuam separadas.' },
        { id: 'b', text: 'Reunir as contas no AWS Organizations, com cobrança consolidada.', correct: true, consequence: 'A conta de gerenciamento paga uma fatura única, e o uso é somado.' },
        { id: 'c', text: 'Compartilhar os recursos de todas as contas com uma delas pelo AWS RAM.', correct: false, consequence: 'O RAM compartilha recursos, não junta faturas.' },
        { id: 'd', text: 'Migrar todos os recursos para uma única conta e fechar as demais.', correct: false, consequence: 'Junta a fatura, mas perde o isolamento entre contas e dá muito trabalho.' },
      ],
      explanation: [
        'O **AWS Organizations** agrupa contas numa organização, com uma **conta de gerenciamento** e contas-membro. A **cobrança consolidada** gera uma fatura única e soma o uso das contas, o que ajuda a alcançar faixas de preço por volume.',
        'Relatórios somados à mão não mudam a fatura. O RAM compartilha recursos. E juntar tudo numa conta perde o isolamento que várias contas oferecem.',
        '**Regra prática:** "várias contas", "cobrança consolidada" e "governança centralizada" passam pelo Organizations.',
      ],
    },
    {
      id: 'rv:iax.f08.m1.a1:all',
      kind: 'decision',
      title: 'A opção de SCP que não aparece',
      prompt:
        'Uma empresa criou sua organização há anos, **só com a cobrança consolidada**. Agora a segurança quer anexar uma SCP à raiz, mas a opção de políticas de controle de serviço **não está disponível**. O que precisa ser feito primeiro?',
      concepts: [{ id: 'org.organizations' }, { id: 'org.scp' }],
      xp: 5,
      difficulty: 2,
      domain: 'd1',
      options: [
        { id: 'a', text: 'Mover todas as contas para uma OU, porque SCPs não se anexam à raiz.', correct: false, consequence: 'SCPs podem ser anexadas à raiz, às OUs e às contas.' },
        { id: 'b', text: 'Habilitar o modo all features da organização.', correct: true, consequence: 'Com todas as funcionalidades, as SCPs e as RCPs ficam disponíveis.' },
        { id: 'c', text: 'Ativar o IAM Identity Center na conta de gerenciamento.', correct: false, consequence: 'O Identity Center cuida de login único, não libera SCPs.' },
        { id: 'd', text: 'Abrir um caso no AWS Support para liberar as SCPs na conta.', correct: false, consequence: 'Não há liberação pelo suporte: é uma configuração da organização.' },
      ],
      explanation: [
        'Uma organização pode estar só com a **cobrança consolidada** ou com **all features** (todas as funcionalidades). **SCPs e RCPs exigem all features**. Depois de habilitado esse modo, as SCPs podem ser anexadas à raiz, às OUs e às contas.',
        'A raiz aceita SCPs. O Identity Center não muda o modo da organização. E não há liberação pelo suporte.',
        '**Regra prática:** guardrails do Organizations, como SCPs e RCPs, pedem a organização em all features.',
      ],
    },
    {
      id: 'rv:iax.f08.m3.a1:outsiders',
      kind: 'decision',
      title: 'O parceiro que a SCP não barrou',
      prompt:
        'Uma SCP anexada à raiz da organização nega `s3:GetObject` no bucket confidencial de uma conta-membro. Mesmo assim, um **parceiro de outra empresa**, liberado por engano na bucket policy, continua lendo o bucket. A empresa quer barrar o acesso de **qualquer principal de fora da organização**, mesmo que uma bucket policy o permita. O que explica e o que resolve?',
      concepts: [{ id: 'org.scp' }, { id: 'org.rcp' }],
      xp: 5,
      difficulty: 3,
      domain: 'd1',
      options: [
        { id: 'a', text: 'A SCP leva até 24 horas para valer; basta esperar.', correct: false, consequence: 'Não há espera: a SCP vale, mas não alcança quem é de fora.' },
        { id: 'b', text: 'A SCP só vale nas OUs; anexá-la à conta-membro do bucket resolve.', correct: false, consequence: 'Onde a SCP está não importa: ela não limita principais de outras contas.' },
        { id: 'c', text: 'A SCP não limita principais de fora; uma RCP limita o acesso ao recurso.', correct: true, consequence: 'A RCP define o máximo de acesso aos buckets, venha de quem vier.' },
        { id: 'd', text: 'O parceiro usa o usuário raiz da conta dele, que nenhuma política limita.', correct: false, consequence: 'O root de outra conta não ignora as políticas do seu bucket.' },
      ],
      explanation: [
        'A **SCP** define o máximo que os principais **das contas-membro** podem fazer. Ela não afeta usuários e roles **de fora da organização**, como o parceiro. A **RCP** faz o caminho inverso: define o máximo de acesso aos **recursos** das contas-membro, venha de quem vier. Uma RCP com a condição `aws:PrincipalOrgID` barra quem é de fora, mesmo com a bucket policy permitindo.',
        'Não há propagação de 24 horas, o ponto de anexação não muda o alcance da SCP, e o root do parceiro não ignora as suas políticas.',
        '**Regra prática:** limitar o que as identidades da organização fazem pede SCP. Limitar quem acessa os recursos da organização, inclusive de fora, pede RCP.',
      ],
    },
    {
      id: 'rv:iax.f08.m2.a4',
      kind: 'decision',
      title: 'Serviços novos só depois de aprovados',
      prompt:
        'A segurança aprovou uma lista de 15 serviços da AWS para as contas da OU Produção e quer que **qualquer serviço fora da lista, inclusive os que a AWS lançar no futuro**, fique bloqueado até ser aprovado. As contas abaixo da OU têm a FullAWSAccess anexada. Qual abordagem atende?',
      concepts: [{ id: 'org.scp' }, { id: 'org.scp-inheritance' }],
      xp: 5,
      difficulty: 2,
      domain: 'd1',
      options: [
        { id: 'a', text: 'Na OU, uma SCP com Deny listando os serviços não aprovados, mantendo a FullAWSAccess.', correct: false, consequence: 'Serviços lançados depois não estão na lista e ficam liberados.' },
        { id: 'b', text: 'Uma política IAM em cada conta permitindo só os 15 serviços.', correct: false, consequence: 'Qualquer administrador da conta pode criar outra política e passar do limite.' },
        { id: 'c', text: 'Na OU, trocar a FullAWSAccess por uma SCP que só permita os 15 serviços.', correct: true, consequence: 'O que não está no Allow da OU fica bloqueado, inclusive serviços novos.' },
        { id: 'd', text: 'Um permissions boundary com os 15 serviços nos usuários de cada conta.', correct: false, consequence: 'Não cobre roles nem identidades criadas depois, e cada conta pode mudar.' },
      ],
      explanation: [
        'Para uma ação valer numa conta, **cada nível** do caminho (raiz, OUs e conta) precisa de uma SCP com Allow. Trocar a FullAWSAccess da OU por uma SCP que **só permite** os 15 serviços faz tudo o mais, inclusive serviços futuros, ficar sem Allow naquele nível. É a estratégia de lista de permissões.',
        'Uma lista de negação só bloqueia o que já foi listado. Políticas IAM e boundaries em cada conta podem ser alterados pelos administradores locais.',
        '**Regra prática:** "bloquear tudo o que não foi aprovado, inclusive serviços novos" pede SCP de lista de permissões. "Bloquear algo específico" pede SCP de Deny.',
      ],
    },
    {
      id: 'rv:iax.f08.boss.a3',
      kind: 'decision',
      title: 'GPUs fora da Região aprovada',
      prompt:
        'A OU Produção tem uma SCP com **Deny** para Regiões fora de sa-east-1. Uma conta de ciência de dados, dentro dessa OU, passou a precisar de GPUs que só existem em us-west-2. As demais contas da OU devem **continuar restritas**. Qual solução atende?',
      concepts: [{ id: 'org.scp-inheritance' }],
      xp: 5,
      difficulty: 3,
      domain: 'd1',
      options: [
        { id: 'a', text: 'Anexar à conta de ciência de dados uma SCP que permita us-west-2.', correct: false, consequence: 'O Deny herdado da OU continua valendo e vence o Allow.' },
        { id: 'b', text: 'Mover a conta para outra OU, com SCPs que liberem us-west-2.', correct: true, consequence: 'A conta deixa de herdar o Deny, e a OU Produção segue restrita.' },
        { id: 'c', text: 'Anexar a FullAWSAccess diretamente à conta de ciência de dados.', correct: false, consequence: 'A FullAWSAccess não anula um Deny vindo de cima.' },
        { id: 'd', text: 'Remover o Deny de Regiões da OU Produção.', correct: false, consequence: 'Libera us-west-2 para todas as contas da OU.' },
      ],
      explanation: [
        'Um **Deny** de SCP em qualquer nível acima da conta vence qualquer Allow abaixo. Enquanto a conta estiver na OU Produção, ela herda o Deny. A forma de dar a ela outra regra, sem mexer nas demais, é **movê-la para outra OU** com as SCPs adequadas.',
        'Allow ou FullAWSAccess na conta não anulam o Deny herdado. E tirar o Deny da OU abre a Região para todas.',
        '**Regra prática:** contas com requisitos diferentes vão para OUs diferentes. Exceção a um Deny de SCP se resolve na estrutura de OUs, não com Allow embaixo.',
      ],
    },
    {
      id: 'rv:iax.f08.m2.a2',
      kind: 'decision',
      title: 'Tudo negado depois da limpeza',
      prompt:
        'Depois de uma "limpeza" nas SCPs, **todas as identidades** das contas da OU Desenvolvimento passaram a receber AccessDenied em qualquer ação, inclusive os administradores. As políticas IAM não mudaram. A única alteração foi **remover a FullAWSAccess da OU**, sem anexar nenhuma outra SCP a ela. Qual é a correção?',
      concepts: [{ id: 'org.scp-inheritance' }],
      xp: 5,
      difficulty: 2,
      domain: 'd1',
      options: [
        { id: 'a', text: 'Anexar a FullAWSAccess às contas da OU, que continuam sem ela.', correct: false, consequence: 'As contas já têm a FullAWSAccess; falta Allow no nível da OU.' },
        { id: 'b', text: 'Dar AdministratorAccess de novo a todas as identidades.', correct: false, consequence: 'A política IAM não passa de um nível de SCP sem Allow.' },
        { id: 'c', text: 'Esperar a propagação, porque o bloqueio é temporário.', correct: false, consequence: 'O bloqueio é permanente enquanto a OU não tiver Allow.' },
        { id: 'd', text: 'Anexar de novo à OU a FullAWSAccess ou outra SCP com Allow.', correct: true, consequence: 'Com Allow de novo no nível da OU, as políticas IAM voltam a valer.' },
      ],
      explanation: [
        'Para uma ação ser permitida, **cada nível** do caminho até a conta precisa de uma SCP com Allow. Ao remover a FullAWSAccess da OU **sem pôr outro Allow**, nada fica permitido naquele nível, e tudo abaixo dela é bloqueado, até os administradores.',
        'A FullAWSAccess nas contas não compensa a OU. Políticas IAM não passam de uma SCP sem Allow. E não há propagação.',
        '**Regra prática:** se uma ação permitida pela política IAM é negada numa conta-membro, confira as SCPs de cada nível acima: a falta de Allow em qualquer nível também bloqueia.',
      ],
    },
    {
      id: 'rv:iax.f08.m4.a2',
      kind: 'decision',
      title: 'Um teto para trinta terceirizados',
      prompt:
        'Numa conta, 30 usuários IAM terceirizados estão no grupo Terceiros. A segurança quer garantir que eles **nunca passem de S3 e CloudWatch**, mesmo que alguém anexe novas políticas a eles no futuro. O que fazer?',
      concepts: [{ id: 'iam.permissions-boundary' }],
      xp: 5,
      difficulty: 1,
      domain: 'd1',
      options: [
        { id: 'a', text: 'Anexar ao grupo Terceiros um permissions boundary com S3 e CloudWatch.', correct: false, consequence: 'Grupos não aceitam permissions boundary; só usuários e roles.' },
        { id: 'b', text: 'Dar ao grupo uma política que permita só S3 e CloudWatch.', correct: false, consequence: 'Políticas novas anexadas aos usuários somariam outras permissões.' },
        { id: 'c', text: 'Anexar a cada um dos 30 usuários um boundary com S3 e CloudWatch.', correct: true, consequence: 'Qualquer política nova fica limitada à interseção com o boundary.' },
        { id: 'd', text: 'Criar uma SCP com S3 e CloudWatch e anexá-la ao grupo.', correct: false, consequence: 'SCPs se anexam a raiz, OUs e contas, nunca a grupos.' },
      ],
      explanation: [
        'O **permissions boundary** é uma política gerenciada que define o **máximo** de um usuário ou de uma role. A permissão efetiva é a **interseção** entre as políticas da identidade e o boundary, então políticas anexadas depois não passam do teto. Ele não se aplica a grupos: precisa estar em cada usuário.',
        'Um Allow restrito no grupo não impede que outras políticas somem permissões. E SCPs não se anexam a grupos.',
        '**Regra prática:** "um máximo para uma identidade, mesmo com políticas futuras" pede boundary no usuário ou na role. Para uma conta inteira da organização, SCP.',
      ],
    },
    {
      id: 'rv:iax.f08.m3.a1:one',
      kind: 'decision',
      title: 'Um teto de EC2 e um relatório no S3',
      prompt:
        'Um usuário IAM tem um **permissions boundary** que só permite ações do EC2 e uma política de identidade com AdministratorAccess. Na **mesma conta**, a bucket policy de relatorios concede `s3:GetObject` diretamente ao **ARN desse usuário**. Nenhuma política tem Deny. Ele tenta baixar um relatório. Qual é o resultado?',
      concepts: [{ id: 'iam.permissions-boundary' }],
      xp: 5,
      difficulty: 3,
      domain: 'd1',
      options: [
        { id: 'a', text: 'Negado, porque o boundary não inclui o S3.', correct: false, consequence: 'O deny implícito do boundary não limita uma concessão direta ao usuário.' },
        { id: 'b', text: 'Negado, porque a interseção com AdministratorAccess exclui o S3.', correct: false, consequence: 'A interseção limita a política de identidade, não a bucket policy.' },
        { id: 'c', text: 'Negado, porque bucket policies não valem para usuários com boundary.', correct: false, consequence: 'Bucket policies valem para eles normalmente.' },
        { id: 'd', text: 'Permitido, porque a bucket policy concede direto ao usuário.', correct: true, consequence: 'Na mesma conta, a concessão direta ao ARN do usuário não passa pelo boundary.' },
      ],
      explanation: [
        'O boundary limita o que as **políticas de identidade** podem dar. Já uma política de recurso que concede **diretamente ao ARN do usuário**, na mesma conta, não é limitada pelo deny implícito do boundary. Como não há Deny explícito, a leitura é permitida.',
        'Pela política de identidade, o S3 ficaria fora da interseção com o boundary. Mas a bucket policy é outro caminho de concessão.',
        '**Regra prática:** o boundary é teto para a identidade, não para concessões diretas de políticas de recurso. Um Deny explícito no boundary, porém, vale como qualquer Deny.',
      ],
    },
    {
      id: 'rv:iam.boundary-delegation:condicao',
      kind: 'decision',
      multiple: true,
      title: 'O líder que cria usuários com teto',
      prompt:
        'Um líder de equipe pode criar usuários IAM **só com o boundary LimiteDoTime**, pela condição `iam:PermissionsBoundary` no CreateUser. A segurança quer impedir que ele **escape desse teto** depois da criação. Que permissões também precisam ser negadas a ele? (Escolha DUAS.)',
      concepts: [{ id: 'iam.boundary-delegation' }],
      xp: 5,
      difficulty: 3,
      domain: 'd1',
      options: [
        { id: 'a', text: 'Remover o boundary dos usuários, com iam:DeleteUserPermissionsBoundary.', correct: true, consequence: 'Sem remover o boundary, os usuários criados continuam com o teto.' },
        { id: 'b', text: 'Ativar MFA nos usuários criados, com iam:EnableMFADevice.', correct: false, consequence: 'MFA protege o login e não muda o teto de permissões.' },
        { id: 'c', text: 'Editar a política LimiteDoTime, com iam:CreatePolicyVersion e iam:SetDefaultPolicyVersion.', correct: true, consequence: 'Sem editar o teto, ele não consegue ampliá-lo para todos.' },
        { id: 'd', text: 'Listar os usuários da conta, com iam:ListUsers.', correct: false, consequence: 'Listar não dá permissão nenhuma a ninguém.' },
        { id: 'e', text: 'Anexar políticas aos próprios usuários criados, com iam:AttachUserPolicy.', correct: false, consequence: 'Anexar é necessário para o trabalho, e o boundary limita o efeito.' },
      ],
      explanation: [
        'Para delegar a criação de usuários sem permitir escalada, a AWS combina três peças: permitir a criação **só com o boundary** definido (condição `iam:PermissionsBoundary`), **negar a remoção** do boundary (`iam:DeleteUserPermissionsBoundary`) e **negar a edição** da política que serve de boundary (`iam:CreatePolicyVersion`, `iam:SetDefaultPolicyVersion` e a exclusão dela).',
        'MFA e listagem não mexem no teto. E anexar políticas faz parte do trabalho do líder: o boundary garante que elas não passem do limite.',
        '**Regra prática:** "delegar a criação de roles ou usuários sem escalada" pede boundary obrigatório na criação e proteção do próprio boundary.',
      ],
    },
    {
      id: 'rv:iax.f08.contas-padronizadas',
      kind: 'decision',
      title: 'Contas novas toda semana',
      prompt:
        'Uma empresa já usa o AWS Control Tower. As equipes pedem **contas novas toda semana**, e cada conta precisa nascer na OU certa, com os controles da OU e a configuração padrão de rede. A empresa quer **padronizar a criação de contas** com o **menor esforço operacional**. O que usar?',
      concepts: [{ id: 'org.control-tower' }],
      xp: 5,
      difficulty: 2,
      domain: 'd1',
      options: [
        { id: 'a', text: 'O Account Factory do Control Tower.', correct: true, consequence: 'Cada conta nasce na OU escolhida, com os controles e a configuração padrão.' },
        { id: 'b', text: 'A API CreateAccount do Organizations e a configuração feita à mão.', correct: false, consequence: 'Cria a conta, mas a padronização fica manual a cada pedido.' },
        { id: 'c', text: 'O AWS RAM, compartilhando uma conta modelo com as equipes.', correct: false, consequence: 'O RAM compartilha recursos; contas não são compartilhadas.' },
        { id: 'd', text: 'Usuários IAM numa conta única, um grupo por equipe.', correct: false, consequence: 'Troca o isolamento por contas por uma conta compartilhada.' },
      ],
      explanation: [
        'O **AWS Control Tower** monta e governa uma landing zone com o Organizations, o IAM Identity Center e o **Account Factory**. O Account Factory cria contas padronizadas, na OU escolhida, já sujeitas aos controles dela.',
        'Criar contas pela API e configurar à mão exige esforço a cada pedido. O RAM não compartilha contas. E uma conta única perde o isolamento.',
        'Os controles do Control Tower são preventivos (SCPs e RCPs), detectivos (regras do AWS Config) e proativos (hooks do CloudFormation).',
        '**Regra prática:** "montar rapidamente um ambiente com várias contas" e "padronizar a criação de contas" pedem o Control Tower. O Organizations sozinho exige montar tudo à mão.',
      ],
    },
    {
      id: 'rv:iax.f08.m1.a2',
      kind: 'decision',
      title: 'Bucket trancado e nenhum root para entrar',
      prompt:
        'Uma organização usa o **acesso root centralizado** e removeu as credenciais root das contas-membro. Numa delas, uma bucket policy passou a **negar todos os principais**, inclusive os administradores. A segurança precisa **remover essa política**. O que fazer?',
      concepts: [{ id: 'org.root-access-central' }],
      xp: 5,
      difficulty: 3,
      domain: 'd1',
      options: [
        { id: 'a', text: 'Recuperar a senha do root da conta-membro pelo e-mail dela.', correct: false, consequence: 'Sem credenciais root, a conta não consegue recuperar a senha do root.' },
        { id: 'b', text: 'Assumir uma role de administrador na conta-membro e excluir a política.', correct: false, consequence: 'A política nega todos os principais, inclusive a role.' },
        { id: 'c', text: 'Abrir uma sessão privilegiada de root a partir da conta de gerenciamento.', correct: true, consequence: 'A sessão permite excluir a bucket policy que nega todos.' },
        { id: 'd', text: 'Anexar à conta-membro uma SCP que permita s3:DeleteBucketPolicy.', correct: false, consequence: 'SCPs não concedem nada e não vencem o Deny da bucket policy.' },
      ],
      explanation: [
        'Com o **acesso root centralizado**, a conta de gerenciamento ou o administrador delegado do IAM abre uma **sessão privilegiada** numa conta-membro para tarefas que exigem o root. Entre elas: excluir uma bucket policy do S3 ou uma política de fila SQS que nega todos os principais.',
        'Sem credenciais root, não há como entrar nem recuperar a senha do root. A role de administrador é barrada pela política. E SCPs não concedem acesso.',
        '**Regra prática:** sem root nas contas-membro, as tarefas de root continuam possíveis pela conta de gerenciamento, com uma sessão privilegiada para cada tarefa.',
      ],
    },
    {
      id: 'rv:iax.f08.m5.a2:bucket',
      kind: 'decision',
      title: 'O bucket que o analisador não viu',
      prompt:
        'Uma empresa criou um analisador de **acesso externo** do IAM Access Analyzer, com a organização como zona de confiança, em **us-east-1**. Um bucket em **sa-east-1**, compartilhado com uma conta de fora, não aparece nos achados. A empresa quer cobrir **todos os recursos**. O que fazer?',
      concepts: [{ id: 'iaa.external-access' }],
      xp: 5,
      difficulty: 2,
      domain: 'd1',
      options: [
        { id: 'a', text: 'Esperar a próxima varredura, que leva até 7 dias.', correct: false, consequence: 'Não é questão de tempo: o analisador de us-east-1 não olha outras Regiões.' },
        { id: 'b', text: 'Trocar a zona de confiança da organização para a conta.', correct: false, consequence: 'A conta de fora continua fora; o problema é a Região.' },
        { id: 'c', text: 'Criar um analisador de acesso não usado, que cobre todas as Regiões.', correct: false, consequence: 'O de acesso não usado aponta o que ninguém usa, não o acesso externo.' },
        { id: 'd', text: 'Criar um analisador de acesso externo em cada Região usada.', correct: true, consequence: 'Cada analisador cobre os recursos da própria Região.' },
      ],
      explanation: [
        'O analisador de **acesso externo** só analisa recursos da **Região onde foi criado**. Para cobrir tudo, é preciso um analisador em **cada Região** com recursos. A zona de confiança, a conta ou a organização, define o que conta como "de fora".',
        'Não há varredura semanal a esperar. Mudar a zona de confiança não resolve a Região. E o analisador de acesso não usado, esse sim sem depender de Região, responde a outra pergunta.',
        '**Regra prática:** "identificar recursos compartilhados com contas de fora da organização" pede o Access Analyzer de acesso externo, um por Região.',
      ],
    },
    {
      id: 'rv:iax.f08.m5.a2:roles',
      kind: 'decision',
      title: 'Roles e chaves esquecidas',
      prompt:
        'Uma empresa com muitas contas quer encontrar **roles, chaves de acesso, senhas e permissões que ninguém usa** há meses, para removê-las. Qual recurso atende de forma contínua?',
      concepts: [{ id: 'iaa.unused-access' }],
      xp: 5,
      difficulty: 1,
      domain: 'd1',
      options: [
        { id: 'a', text: 'O relatório de credenciais de cada conta, revisado à mão.', correct: false, consequence: 'Mostra só usuários e o root, sem roles nem permissões, conta por conta.' },
        { id: 'b', text: 'O analisador de acesso externo do IAM Access Analyzer.', correct: false, consequence: 'Aponta acesso de fora, não o que está sem uso.' },
        { id: 'c', text: 'O analisador de acesso não usado do IAM Access Analyzer.', correct: true, consequence: 'Lista roles, chaves, senhas e permissões sem uso.' },
        { id: 'd', text: 'A validação de políticas do IAM Access Analyzer.', correct: false, consequence: 'Confere a escrita de políticas, não o uso das identidades.' },
      ],
      explanation: [
        'O **analisador de acesso não usado** do IAM Access Analyzer aponta **roles, chaves de acesso, senhas e permissões** que ninguém usa. É um recurso pago. O analisador de **acesso interno** é outro: mostra quem, dentro da organização, alcança recursos críticos.',
        'O relatório de credenciais não cobre roles nem permissões. O de acesso externo e a validação de políticas respondem a outras perguntas.',
        '**Regra prática:** "o que ninguém usa" pede o analisador de acesso não usado. "Quem de fora alcança" pede o de acesso externo.',
      ],
    },
    {
      id: 'rv:iax.f08.m5.a2:lint',
      kind: 'decision',
      title: 'Conferir políticas antes do deploy',
      prompt:
        'O pipeline de uma empresa aplica políticas IAM escritas pelos times. A segurança quer que **cada política seja conferida antes do deploy**, apontando erros de sintaxe, avisos de segurança e desvios de boas práticas, e que o pipeline pare se houver erro. Qual recurso atende?',
      concepts: [{ id: 'iaa.policy-checks' }],
      xp: 5,
      difficulty: 1,
      domain: 'd1',
      options: [
        { id: 'a', text: 'A geração de políticas do Access Analyzer, a partir do CloudTrail.', correct: false, consequence: 'Cria políticas a partir do uso registrado; não confere as que os times escreveram.' },
        { id: 'b', text: 'A validação de políticas do IAM Access Analyzer.', correct: true, consequence: 'Mais de 100 verificações de erros, segurança e boas práticas.' },
        { id: 'c', text: 'O relatório de credenciais, gerado a cada deploy.', correct: false, consequence: 'Mostra o estado das credenciais, não a qualidade das políticas.' },
        { id: 'd', text: 'O analisador de acesso externo, rodando depois do deploy.', correct: false, consequence: 'Só avalia depois que a política já está aplicada, e só acesso externo.' },
      ],
      explanation: [
        'A **validação de políticas** do IAM Access Analyzer confere uma política com **mais de 100 verificações**: erros, avisos de segurança e sugestões de boas práticas. Pode ser chamada pela API, num pipeline, antes de aplicar a política.',
        'A **geração de políticas** faz outra coisa: cria uma política a partir da atividade no CloudTrail, como ponto de partida para o menor privilégio. O relatório de credenciais e o analisador de acesso externo não conferem a escrita.',
        '**Regra prática:** "conferir políticas antes de aplicar" pede validação. "Criar políticas de menor privilégio a partir do uso real" pede geração.',
      ],
    },
  ],
}
