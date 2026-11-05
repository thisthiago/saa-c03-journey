/**
 * Questões da Revisão da Fase 4 da IAM e Access Management (como a AWS
 * decide), no formato do exame SAA-C03. Fatos conferidos na documentação da
 * AWS (ver docs/VERIFICACAO-DE-CONTEUDO.md). As empresas são fictícias.
 */
import type { ReviewSet } from '../../../../engine/types'

export const REVIEW_F04: ReviewSet = {
  phaseId: 'iax.f04',
  questions: [
    {
      id: 'rv:iax.f04.camada-que-limita',
      kind: 'decision',
      title: 'O administrador que não consegue parar a trilha',
      prompt:
        'Numa conta-membro de uma organização, um usuário IAM com a política **AdministratorAccess** tenta desligar uma trilha do CloudTrail e recebe AccessDenied. Nenhuma das políticas de identidade dele tem Deny, e ele não tem permissions boundary. Onde a equipe deve **procurar a causa primeiro**?',
      concepts: [{ id: 'iam.eval-flow' }],
      xp: 5,
      difficulty: 2,
      domain: 'd1',
      options: [
        { id: 'a', text: 'Na AdministratorAccess, que não inclui as ações do CloudTrail.', correct: false, consequence: 'A AdministratorAccess permite todas as ações em todos os recursos.' },
        { id: 'b', text: 'Nas SCPs aplicadas à conta ou às OUs acima dela.', correct: true, consequence: 'Uma SCP com Deny, ou sem Allow para a ação, bloqueia até administradores.' },
        { id: 'c', text: 'Na política de recurso da trilha, que precisa citar o usuário.', correct: false, consequence: 'Na mesma conta, a política de identidade bastaria se nada mais bloqueasse.' },
        { id: 'd', text: 'No MFA do usuário, porque o CloudTrail exige MFA para alterações.', correct: false, consequence: 'O CloudTrail não exige MFA por padrão; isso dependeria de uma política.' },
      ],
      explanation: [
        'A AWS procura primeiro um **Deny explícito** em todas as políticas que se aplicam. Sem Deny, exige **Allow nas SCPs e RCPs**, e depois olha as políticas de recurso, de identidade, o boundary e a session policy. Se as políticas de identidade estão limpas e não há boundary, a camada que sobra numa conta-membro é a **SCP**, que limita até administradores e o root.',
        'A AdministratorAccess cobre o CloudTrail. Na mesma conta, a política de identidade bastaria. E não há exigência de MFA sem uma política que a peça.',
        '**Regra prática:** "tem permissão ampla e mesmo assim recebe Access Denied" pede procurar o Deny explícito ou a camada que limita: SCP, RCP, boundary ou session policy.',
      ],
    },
    {
      id: 'rv:iax.f04.de-onde-vem-o-bloqueio',
      kind: 'decision',
      multiple: true,
      title: 'Leitura negada com Allow na identidade',
      prompt:
        'Numa conta avulsa, fora de qualquer organização, uma usuária IAM tem um Allow de `s3:GetObject` no bucket vendas na política de identidade. Mesmo assim, recebe AccessDenied ao ler um objeto desse bucket, da mesma conta. Quais situações **podem explicar** a negação? (Escolha DUAS.)',
      concepts: [{ id: 'iam.eval-flow' }, { id: 'iam.same-account' }],
      xp: 5,
      difficulty: 3,
      domain: 'd1',
      options: [
        { id: 'a', text: 'A bucket policy tem um Deny que se aplica à requisição dela.', correct: true, consequence: 'Um Deny explícito em qualquer política aplicável vence o Allow.' },
        { id: 'b', text: 'A bucket policy não cita a usuária em nenhum statement.', correct: false, consequence: 'Na mesma conta, o Allow da identidade basta; o bucket não precisa citá-la.' },
        { id: 'c', text: 'Ela tem um permissions boundary que não inclui s3:GetObject.', correct: true, consequence: 'O boundary limita o que a identidade pode fazer, mesmo com Allow.' },
        { id: 'd', text: 'Nenhuma SCP da organização permite s3:GetObject para a conta.', correct: false, consequence: 'A conta é avulsa: não há SCP no caminho da avaliação.' },
        { id: 'e', text: 'O grupo da usuária não tem nenhuma política do S3.', correct: false, consequence: 'As políticas somam: basta o Allow dela, sem Deny em lugar nenhum.' },
      ],
      explanation: [
        'Na mesma conta, basta a política de identidade **ou** a de recurso permitir, sem nenhum Deny. Com o Allow na identidade, a negação só pode vir de uma camada que nega ou limita: um **Deny explícito**, como um na bucket policy, ou um **permissions boundary** que não inclui a ação.',
        'A bucket policy não precisa citá-la. Numa conta avulsa não há SCP. E a falta de política no grupo não anula o Allow dela.',
        '**Regra prática:** quando o acesso é negado, não procure só na política de identidade. O bloqueio pode vir de uma SCP, de uma RCP, do boundary, da session policy ou de um Deny na política de recurso.',
      ],
    },
    {
      id: 'rv:iax.f04.m3.a2:same-res',
      kind: 'decision',
      title: 'Acesso dado só pelo bucket',
      prompt:
        'Uma equipe quer liberar a leitura do bucket manuais para o usuário IAM tiago, **da mesma conta**, mexendo **só na bucket policy**, sem alterar as políticas IAM dele, que não citam o S3. A bucket policy passa a ter um Allow de `s3:GetObject` com o ARN de tiago no Principal. Nenhuma política tem Deny. Qual é o resultado da leitura?',
      concepts: [{ id: 'iam.same-account' }],
      xp: 5,
      difficulty: 1,
      domain: 'd1',
      options: [
        { id: 'a', text: 'A leitura é negada até a política de identidade de tiago também permitir.', correct: false, consequence: 'Essa exigência dupla vale entre contas, não dentro da mesma conta.' },
        { id: 'b', text: 'A leitura é negada, porque bucket policies só servem para outras contas.', correct: false, consequence: 'Bucket policies concedem acesso também na própria conta.' },
        { id: 'c', text: 'A leitura só funciona se uma ACL do objeto também liberar tiago.', correct: false, consequence: 'ACLs não servem para dar acesso dentro da mesma conta.' },
        { id: 'd', text: 'A leitura é permitida, porque na mesma conta basta um dos lados.', correct: true, consequence: 'O Allow da bucket policy ao ARN de tiago já concede a leitura.' },
      ],
      explanation: [
        'Dentro da **mesma conta**, na maioria dos serviços, basta a política de identidade **ou** a política de recurso permitir, sem nenhum Deny. A bucket policy que concede ao ARN de tiago já libera a leitura.',
        'A exigência de permitir dos dois lados vale **entre contas**. Bucket policies também servem na própria conta. E ACLs são para outras contas.',
        '**Regra prática:** mesma conta, um lado basta; entre contas, os dois lados. As exceções da mesma conta são as trust policies e as key policies do KMS, que sempre precisam permitir.',
      ],
    },
    {
      id: 'rv:iax.f04.chave-que-nao-abre',
      kind: 'decision',
      title: 'A chave que o administrador não consegue usar',
      prompt:
        'Um usuário IAM com **AdministratorAccess** tenta descriptografar dados com uma chave KMS gerenciada pelo cliente, da mesma conta, e recebe AccessDenied. A key policy permite só a role da aplicação de faturamento e **não delega** o acesso à conta. A empresa quer que esse usuário use a chave **sem dar acesso a mais ninguém**. O que fazer?',
      concepts: [{ id: 'iam.explicit-resource-required' }, { id: 'iam.same-account' }],
      xp: 5,
      difficulty: 2,
      domain: 'd1',
      options: [
        { id: 'a', text: 'Anexar ao usuário uma política com `kms:*` em todos os recursos.', correct: false, consequence: 'Ele já tem tudo pela AdministratorAccess: a identidade sozinha não basta no KMS.' },
        { id: 'b', text: 'Esperar o cache de permissões, porque na mesma conta a identidade basta.', correct: false, consequence: 'A key policy é exceção à regra da mesma conta: ela precisa permitir.' },
        { id: 'c', text: 'Incluir o ARN do usuário na key policy, com as ações de uso da chave.', correct: true, consequence: 'A key policy passa a permitir o usuário, e só ele ganha acesso.' },
        { id: 'd', text: 'Ativar a rotação automática da chave, que renova as permissões.', correct: false, consequence: 'A rotação troca o material da chave, não quem pode usá-la.' },
      ],
      explanation: [
        'As **key policies do KMS**, assim como as **trust policies** de roles, são exceções à regra da mesma conta: elas **precisam permitir** o principal, diretamente ou delegando à conta. Por isso nem a AdministratorAccess abre a chave. Incluir o ARN do usuário na key policy libera só ele.',
        'Mais permissão na identidade não resolve. Não há cache a esperar. E a rotação não muda permissões.',
        'Delegar à conta, com o ARN `:root` no Principal, também funcionaria, mas passaria a decisão para as políticas IAM e abriria a chave a qualquer identidade cujas políticas IAM permitam o KMS, como os administradores.',
        '**Regra prática:** "tem AdministratorAccess e não consegue usar a chave KMS ou assumir a role" pede olhar a key policy ou a trust policy.',
      ],
    },
    {
      id: 'rv:iam.explicit-resource-required:trust',
      kind: 'decision',
      title: 'A role de outra conta que não se deixa assumir',
      prompt:
        'Um engenheiro da conta A, com **AdministratorAccess**, tenta assumir a role Auditoria da conta B e recebe AccessDenied. A trust policy da role confia só na conta C. A empresa quer que **usuários autorizados da conta A** assumam a role. O que precisa mudar?',
      concepts: [{ id: 'iam.explicit-resource-required' }],
      xp: 5,
      difficulty: 2,
      domain: 'd1',
      options: [
        { id: 'a', text: 'Dar ao engenheiro, na conta A, uma política que permita sts:AssumeRole na role.', correct: false, consequence: 'Ele já tem essa permissão pela AdministratorAccess; falta o lado da conta B.' },
        { id: 'b', text: 'Criar a role Auditoria na conta A, que é a conta de quem vai assumir.', correct: false, consequence: 'A role fica na conta dona dos recursos; quem assume fica do outro lado.' },
        { id: 'c', text: 'Anexar, na conta B, uma política de identidade ao usuário da conta A.', correct: false, consequence: 'Uma conta não anexa políticas a identidades de outra.' },
        { id: 'd', text: 'Incluir a conta A, ou os principais dela, na trust policy da role na conta B.', correct: true, consequence: 'A trust policy passa a permitir, e a política da conta A completa o caminho.' },
      ],
      explanation: [
        'Para assumir uma role, a **trust policy precisa permitir** o principal: política de identidade sozinha não basta, nem com AdministratorAccess. No acesso entre contas, a conta dona dos recursos (B) cria a role e diz na trust policy em quem confia; a conta de quem assume (A) dá aos seus usuários a permissão para `sts:AssumeRole`.',
        'O engenheiro já tem a permissão do lado A. A role não muda de conta. E políticas de identidade não atravessam contas.',
        '**Regra prática:** no acesso entre contas, identifique os dois lados: a conta do recurso cria a role e a trust policy; a conta de quem assume concede `sts:AssumeRole`.',
      ],
    },
    {
      id: 'rv:iax.f04.m3.a4',
      kind: 'decision',
      title: 'Liberar a leitura sem mexer no limite',
      prompt:
        'A sessão bia da role analista foi criada com uma **session policy** que só permite `ec2:Describe*`. Na mesma conta, a bucket policy concede `s3:GetObject` ao **ARN da role** analista, e a leitura da sessão é negada. A equipe quer liberar a leitura **só para essa sessão**, sem mudar a session policy. Qual Principal usar na bucket policy?',
      concepts: [{ id: 'iam.grant-principal-type' }],
      xp: 5,
      difficulty: 3,
      domain: 'd1',
      options: [
        { id: 'a', text: 'A conta, com o ARN arn:aws:iam::111122223333:root no Principal.', correct: false, consequence: 'É delegação: o acesso ainda depende das políticas da sessão, que não permitem.' },
        { id: 'b', text: 'A sessão, com arn:aws:sts::111122223333:assumed-role/analista/bia.', correct: true, consequence: 'Na mesma conta, a concessão direta à sessão não é limitada pela session policy.' },
        { id: 'c', text: 'Manter o ARN da role e pôr s3:GetObject na política da role.', correct: false, consequence: 'A session policy continua limitando a sessão ao ec2:Describe*.' },
        { id: 'd', text: 'Manter o ARN da role e anexar a ela um boundary que permita o S3.', correct: false, consequence: 'O boundary também só limita; não remove o limite da session policy.' },
      ],
      explanation: [
        'Na mesma conta, uma política de recurso que concede ao **ARN da role** é limitada pelo boundary e pela **session policy**, porque quem faz a requisição é a sessão. Já uma concessão ao **ARN da sessão** (`arn:aws:sts::conta:assumed-role/role/sessão`) vai direto para ela e não é limitada pela session policy, pelo boundary nem por deny implícito de identidade.',
        'Citar a conta é delegação, que depende das políticas da sessão. Mudar a política da role ou o boundary não tira o limite da session policy.',
        '**Regra prática:** a quem a política de recurso concede muda o resultado. Ao usuário ou à sessão, vai direto; à role, é limitada por boundary e session policy; à conta, é delegação.',
      ],
    },
    {
      id: 'rv:iax.f04.m1.a1',
      kind: 'decision',
      title: 'Uma exceção à proteção do bucket',
      prompt:
        'A bucket policy de um bucket de apólices tem um **Deny** de `s3:DeleteObject` para Principal `"*"`. A role de expurgo, que já tem um Allow de exclusão na política de identidade, precisa **apagar apólices vencidas**, e todos os outros principais devem **continuar sem poder excluir**. O que fazer?',
      concepts: [{ id: 'iam.eval-flow' }],
      xp: 5,
      difficulty: 2,
      domain: 'd1',
      options: [
        { id: 'a', text: 'Incluir na bucket policy um Allow de exclusão para a role de expurgo.', correct: false, consequence: 'O Deny explícito continua valendo para a role e vence o Allow.' },
        { id: 'b', text: 'Dar AdministratorAccess à role de expurgo, acima de qualquer bucket policy.', correct: false, consequence: 'Nenhum Allow vence um Deny explícito que se aplica à requisição.' },
        { id: 'c', text: 'Remover o Deny e confiar nas políticas de identidade dos demais.', correct: false, consequence: 'Qualquer Allow futuro de exclusão voltaria a funcionar para outros principais.' },
        { id: 'd', text: 'Pôr no Deny uma condição aws:PrincipalArn diferente da role de expurgo.', correct: true, consequence: 'O Deny deixa de se aplicar só à role, e os demais continuam bloqueados.' },
      ],
      explanation: [
        'Um **Deny explícito** que se aplica à requisição vence qualquer Allow, em qualquer política. Para abrir uma exceção, o Deny precisa **deixar de se aplicar** àquele principal: uma condição `StringNotEquals` com `aws:PrincipalArn` igual ao ARN da role de expurgo faz isso. A role usa o Allow que já tem, e os demais continuam negados.',
        'Um Allow na bucket policy ou a AdministratorAccess não vencem o Deny. E remover o Deny tira a proteção dos demais.',
        '**Regra prática:** não se vence um Deny com Allow. Exceções a um Deny se fazem na condição do próprio Deny.',
      ],
    },
  ],
}
