/**
 * Questões da Revisão da Fase 1 da IAM e Access Management (identidades e a
 * conta), no formato do exame SAA-C03. Fatos conferidos na documentação da
 * AWS (ver docs/VERIFICACAO-DE-CONTEUDO.md). As empresas são fictícias.
 */
import type { ReviewSet } from '../../../../engine/types'

export const REVIEW_F01: ReviewSet = {
  phaseId: 'iax.f01',
  questions: [
    {
      id: 'rv:iam.credential-report:auditoria',
      kind: 'decision',
      title: 'O arquivo que a auditoria pediu',
      prompt:
        'A auditoria de uma corretora pede, para a conta de produção, **um único arquivo** com todos os usuários IAM e o usuário raiz, mostrando se cada um tem MFA ativo, quando a senha foi usada pela última vez e a idade e o último uso de cada chave de acesso. A equipe quer atender com o **menor esforço**. O que ela deve entregar?',
      concepts: [{ id: 'iam.credential-report' }, { id: 'iam.access-keys' }],
      xp: 5,
      difficulty: 1,
      domain: 'd1',
      options: [
        { id: 'a', text: 'Os logs do CloudTrail dos últimos 90 dias, exportados para CSV.', correct: false, consequence: 'O CloudTrail registra as chamadas feitas, não o estado do MFA nem a idade das chaves.' },
        { id: 'b', text: 'O relatório de credenciais do IAM, gerado em CSV no console ou pela CLI.', correct: true, consequence: 'Um só arquivo traz senha, MFA e chaves de todos os usuários e do root.' },
        { id: 'c', text: 'Os achados do IAM Access Analyzer sobre acesso externo e permissões sem uso.', correct: false, consequence: 'O Access Analyzer olha permissões e acesso externo, não o estado de cada credencial.' },
        { id: 'd', text: 'Uma consulta usuário por usuário no console, copiada para uma planilha.', correct: false, consequence: 'Chega ao mesmo dado com muito mais esforço e risco de erro.' },
      ],
      explanation: [
        'O **relatório de credenciais** do IAM é um arquivo CSV com todos os usuários da conta e o usuário raiz. Para cada um, mostra senha e último uso, se o MFA está ativo e a idade e o último uso das chaves de acesso. É exatamente o retrato que a auditoria pediu, gerado em segundos.',
        'O **CloudTrail** responde "quem fez cada chamada", não "em que estado está cada credencial". O **IAM Access Analyzer** aponta acesso externo e permissões sem uso. Montar a planilha à mão chega ao mesmo dado com mais trabalho.',
        'O relatório pode ser gerado no máximo a cada 4 horas; antes disso, a AWS devolve o último. E ele mostra só as duas primeiras chaves de cada usuário, que é o máximo permitido.',
        '**Regra prática:** "auditar senhas, MFA e chaves de todos os usuários" pede o relatório de credenciais. "Quem fez a chamada" pede o CloudTrail; "permissões sem uso ou acesso externo" pede o Access Analyzer.',
      ],
    },
    {
      id: 'rv:iax.f01.chave-exposta',
      kind: 'decision',
      multiple: true,
      title: 'A chave que foi parar no repositório público',
      prompt:
        'Um desenvolvedor publicou por engano, num repositório público, a chave de acesso do usuário IAM que uma aplicação em instâncias EC2 usa para gravar no S3. A empresa quer **cortar o risco imediatamente** e **evitar que uma credencial desse tipo volte a vazar**. Quais ações atendem? (Escolha DUAS.)',
      concepts: [{ id: 'iam.access-keys' }, { id: 'iam.roles' }],
      xp: 5,
      difficulty: 2,
      domain: 'd1',
      options: [
        { id: 'a', text: 'Desativar a chave exposta agora, antes de qualquer outra limpeza.', correct: true, consequence: 'Quem copiou a chave perde o acesso no mesmo instante.' },
        { id: 'b', text: 'Apagar o commit do histórico do repositório e manter a chave ativa.', correct: false, consequence: 'A chave pode já ter sido copiada: apagar o commit não a invalida.' },
        { id: 'c', text: 'Trocar a chave por uma role ligada às instâncias por um instance profile.', correct: true, consequence: 'A aplicação passa a usar credenciais temporárias, e não há chave para vazar.' },
        { id: 'd', text: 'Ativar o MFA no usuário IAM dono da chave e manter a mesma chave.', correct: false, consequence: 'O MFA do usuário protege o login no console; a chave continua assinando chamadas sem pedir código.' },
        { id: 'e', text: 'Criar uma segunda chave e guardá-la num repositório privado da empresa.', correct: false, consequence: 'Continua sendo uma credencial de longo prazo guardada em código, só que em outro lugar.' },
      ],
      explanation: [
        'Uma chave de acesso exposta precisa deixar de valer **antes de tudo**: desativá-la corta o acesso de quem a copiou. Para não repetir o problema, a aplicação no EC2 deve usar uma **role** entregue por instance profile, que fornece credenciais temporárias renovadas automaticamente. Sem chave guardada, não há o que vazar.',
        'Apagar o commit não invalida a chave, que pode já ter sido copiada por robôs que varrem repositórios públicos. O MFA do usuário não é pedido nas chamadas assinadas pela chave. E uma segunda chave num repositório privado mantém o mesmo tipo de risco.',
        '**Regra prática:** chave vazada se desativa primeiro e se investiga depois. Para workloads na AWS, a cura definitiva é trocar a chave por uma role.',
      ],
    },
    {
      id: 'rv:iam.key-rotation:antiga',
      kind: 'decision',
      title: 'A chave antiga que ainda aparece em uso',
      prompt:
        'Uma equipe está rotacionando a chave de acesso de um usuário IAM usado por aplicações fora da AWS. Ela criou a segunda chave e atualizou as aplicações que conhecia. Antes de desativar a chave antiga, viu no console que o **último uso** dela foi há duas horas, a partir de um servidor de relatórios esquecido. A rotação **não pode parar nenhuma aplicação**. Qual é o próximo passo?',
      concepts: [{ id: 'iam.key-rotation' }, { id: 'iam.access-keys' }],
      xp: 5,
      difficulty: 2,
      domain: 'd2',
      options: [
        { id: 'a', text: 'Excluir a chave antiga agora, para obrigar o servidor a falhar e ser achado.', correct: false, consequence: 'O servidor para, e a chave excluída não volta: a rotação quebrou o requisito.' },
        { id: 'b', text: 'Criar uma terceira chave só para o servidor de relatórios.', correct: false, consequence: 'Um usuário IAM tem no máximo duas chaves de acesso.' },
        { id: 'c', text: 'Trocar a chave no servidor esquecido e conferir o último uso de novo.', correct: true, consequence: 'Quando a antiga parar de aparecer em uso, ela pode ser desativada sem parar nada.' },
        { id: 'd', text: 'Manter as duas chaves ativas de vez, para o servidor não depender da troca.', correct: false, consequence: 'Duas chaves ativas para sempre dobram o que pode vazar e anulam a rotação.' },
      ],
      explanation: [
        'A rotação sem interrupção segue uma ordem: criar a segunda chave, trocar nas aplicações, **conferir o último uso** da antiga, desativá-la, confirmar que tudo funciona e só então excluí-la. O último uso recente mostra que ainda falta trocar uma aplicação, então o passo é atualizar o servidor esquecido e conferir de novo.',
        'Excluir a chave agora derruba o servidor sem volta. Uma terceira chave não é possível: o limite de duas existe justamente para permitir a rotação. E deixar as duas ativas de vez mantém a credencial antiga viva.',
        '**Regra prática:** na rotação, o último uso decide quando desativar, e a desativação vem antes da exclusão. Se algo parar depois de desativar, dá para reativar a chave e corrigir.',
      ],
    },
    {
      id: 'rv:iax.f01.m1.a1:billing',
      kind: 'decision',
      title: 'A tarefa que o administrador não consegue fazer',
      prompt:
        'Numa conta avulsa, fora de qualquer organização, o time financeiro precisa ver faturas no console de cobrança com usuários IAM. O administrador, que tem a política AdministratorAccess, anexou a eles uma política de leitura da cobrança, mas **o acesso continua negado**. Qual tarefa **exige o usuário raiz** para resolver?',
      concepts: [{ id: 'iam.root-tasks' }],
      xp: 5,
      difficulty: 1,
      domain: 'd1',
      options: [
        { id: 'a', text: 'Criar um grupo Financeiro e mover os usuários para ele.', correct: false, consequence: 'O administrador cria grupos sem o root, e a política continua sem efeito.' },
        { id: 'b', text: 'Anexar a política AdministratorAccess aos usuários do financeiro.', correct: false, consequence: 'Nem o administrador vê a cobrança enquanto o acesso do IAM não for ativado.' },
        { id: 'c', text: 'Gerar o relatório de credenciais para conferir os usuários.', correct: false, consequence: 'O relatório mostra credenciais e não muda o acesso à cobrança.' },
        { id: 'd', text: 'Ativar o acesso de usuários IAM ao console de cobrança.', correct: true, consequence: 'Com o acesso ativado pelo root, a política de leitura passa a valer.' },
      ],
      explanation: [
        'Usuários IAM só enxergam o console de cobrança depois que o **usuário raiz ativa o acesso do IAM à cobrança**. Até lá, nenhuma política resolve, nem a AdministratorAccess. É uma das poucas tarefas que exigem o root.',
        'Criar grupos, anexar políticas e gerar o relatório de credenciais são tarefas comuns de um administrador e não mudam o bloqueio.',
        'Outras tarefas clássicas do root: alterar o e-mail ou a senha do root e fechar a conta (em contas avulsas), restaurar as permissões do único administrador, habilitar o MFA delete no S3 e destravar uma bucket policy que nega todos.',
        '**Regra prática:** o root fica guardado e só sai para a lista curta de tarefas que o exigem. Criar usuários, grupos, roles ou buckets nunca está nessa lista.',
      ],
    },
    {
      id: 'rv:iax.f01.m1.a1:denyall',
      kind: 'decision',
      title: 'O bucket que trancou todo mundo do lado de fora',
      prompt:
        'Numa conta avulsa, um administrador aplicou a bucket policy abaixo para "fechar" um bucket. Desde então, **ninguém consegue ler, alterar ou excluir** o bucket nem a própria política, nem os administradores. A empresa quer **recuperar o controle do bucket** sem perder os dados. O que fazer?',
      exhibits: [
        {
          title: 'Bucket policy aplicada',
          code: '{\n  "Version": "2012-10-17",\n  "Statement": [{\n    "Effect": "Deny",\n    "Principal": "*",\n    "Action": "s3:*",\n    "Resource": [\n      "arn:aws:s3:::relatorios-internos",\n      "arn:aws:s3:::relatorios-internos/*"\n    ]\n  }]\n}',
        },
      ],
      concepts: [{ id: 'iam.root-tasks' }, { id: 'iam.principal' }, { id: 'iam.root-user' }],
      xp: 5,
      difficulty: 3,
      domain: 'd1',
      options: [
        { id: 'a', text: 'Entrar como usuário raiz da conta e excluir a bucket policy.', correct: true, consequence: 'O root da conta dona do bucket consegue excluir a política mesmo com esse Deny.' },
        { id: 'b', text: 'Dar AdministratorAccess a um usuário IAM e excluir a política com ele.', correct: false, consequence: 'O Deny explícito com Principal "*" vence qualquer permissão de identidade.' },
        { id: 'c', text: 'Criar um bucket novo e copiar os objetos para ele antes de apagar o antigo.', correct: false, consequence: 'A cópia também é negada: ninguém consegue ler os objetos do bucket trancado.' },
        { id: 'd', text: 'Pedir ao AWS Support que remova a política, já que nenhum usuário consegue.', correct: false, consequence: 'O caminho documentado é o root da conta, que consegue remover a política sozinho.' },
      ],
      explanation: [
        'O **Principal "*"** com **Deny** atinge todos os usuários e roles, e um Deny explícito vence qualquer permissão: por isso nem a AdministratorAccess resolve. A AWS deixa uma saída: o **usuário raiz** da conta dona do bucket consegue excluir uma bucket policy que nega todos os principais. Removida a política, o acesso volta a seguir as políticas de identidade.',
        'Copiar os objetos esbarra no mesmo Deny. E não é preciso o AWS Support: destravar essa política é uma tarefa documentada do root.',
        '**Regra prática:** bucket policy que nega todos, inclusive administradores, se destrava com o root da conta. É a mesma regra para uma política de fila SQS que nega todos.',
      ],
    },
    {
      id: 'rv:iax.f01.m1.a3',
      kind: 'decision',
      multiple: true,
      title: 'O root ligado ao sócio que vai sair',
      prompt:
        'Numa startup, o e-mail do usuário raiz é o endereço pessoal de um sócio que está deixando a empresa, e ele guarda sozinho a senha e o MFA. A empresa quer **continuar recebendo os avisos da AWS** e garantir que **ninguém consiga entrar como root sozinho**. Quais medidas atendem? (Escolha DUAS.)',
      concepts: [{ id: 'iam.root-best-practices' }, { id: 'iam.root-user' }],
      xp: 5,
      difficulty: 2,
      domain: 'd1',
      options: [
        { id: 'a', text: 'Trocar o e-mail do root por um endereço de grupo da empresa.', correct: true, consequence: 'Os avisos chegam mesmo que uma pessoa saia ou esteja de férias.' },
        { id: 'b', text: 'Criar uma chave de acesso do root e guardá-la num cofre de senhas.', correct: false, consequence: 'Chave do root é credencial de longo prazo com acesso total: a AWS recomenda não criar.' },
        { id: 'c', text: 'Deixar a senha com um grupo de pessoas e o dispositivo MFA com outro grupo.', correct: true, consequence: 'O login do root passa a exigir pessoas dos dois grupos.' },
        { id: 'd', text: 'Desativar o MFA do root para evitar bloqueio se o dispositivo se perder.', correct: false, consequence: 'A AWS exige MFA no root; sem ele, a senha sozinha abre a conta inteira.' },
        { id: 'e', text: 'Anexar ao root uma política que só permita ver a cobrança.', correct: false, consequence: 'Políticas de identidade não se anexam ao usuário raiz.' },
      ],
      explanation: [
        'Um **e-mail de grupo** garante que os avisos da AWS e a recuperação da conta não dependam de uma pessoa. E separar a **senha** e o **MFA** entre grupos diferentes faz com que o login do root exija a aprovação de mais de uma pessoa.',
        'Chave de acesso do root é sempre distrator. Desligar o MFA vai contra a exigência da AWS. E o root não recebe políticas de identidade: em contas-membro, só SCPs e RCPs o limitam.',
        '**Regra prática:** proteger o root é senha forte, MFA, nenhuma chave, e-mail de grupo e mais de uma pessoa para entrar. O dia a dia fica com identidades administrativas.',
      ],
    },
    {
      id: 'rv:iax.f01.root-no-dia-a-dia',
      kind: 'decision',
      title: 'Três pessoas e uma só identidade',
      prompt:
        'Numa empresa pequena, três engenheiros usam o **usuário raiz**, com MFA, para todo o trabalho diário na conta: criar instâncias, ajustar buckets e ver custos. A empresa quer **reduzir o risco** sem atrapalhar o trabalho. Qual mudança atende?',
      concepts: [{ id: 'iam.root-best-practices' }, { id: 'iam.root-user' }],
      xp: 5,
      difficulty: 1,
      domain: 'd1',
      options: [
        { id: 'a', text: 'Manter o uso do root, já que o MFA protege o login.', correct: false, consequence: 'O MFA não reduz o estrago de um erro feito com acesso total.' },
        { id: 'b', text: 'Criar uma chave de acesso do root para cada engenheiro usar na CLI.', correct: false, consequence: 'Chaves do root são credenciais de longo prazo com acesso total.' },
        { id: 'c', text: 'Criar identidades administrativas para o dia a dia e guardar o root.', correct: true, consequence: 'O trabalho segue, e o root sai só para as tarefas que o exigem.' },
        { id: 'd', text: 'Trocar a senha do root toda semana e avisar os três por mensagem.', correct: false, consequence: 'A senha circula ainda mais, e o acesso total continua no dia a dia.' },
      ],
      explanation: [
        'O usuário raiz tem **acesso total**, inclusive à cobrança e ao fechamento da conta. Usado no dia a dia, qualquer erro ou vazamento atinge a conta inteira. A boa prática é criar **identidades administrativas** para o trabalho diário e guardar o root para a lista curta de tarefas que o exigem.',
        'O MFA protege a entrada, não o que se faz depois. Chaves do root nunca devem existir. E trocar a senha toda semana só faz ela circular mais.',
        '**Regra prática:** o root nunca é a resposta para tarefas do dia a dia. As alternativas certas combinam MFA, nenhuma chave e uso só nas tarefas que exigem o root.',
      ],
    },
    {
      id: 'rv:iax.f01.m1.a4',
      kind: 'decision',
      title: 'Limitar o que o root pode fazer',
      prompt:
        'Uma conta avulsa guarda uma tabela crítica do DynamoDB. A segurança quer **impedir até o usuário raiz** de excluir essa tabela, com uma regra que valha mesmo se as credenciais do root forem usadas. Qual abordagem atende?',
      concepts: [{ id: 'iam.root-user' }],
      xp: 5,
      difficulty: 2,
      domain: 'd1',
      options: [
        { id: 'a', text: 'Anexar ao usuário raiz uma política IAM com Deny para a exclusão da tabela.', correct: false, consequence: 'O root não recebe políticas de identidade: não há onde anexar o Deny.' },
        { id: 'b', text: 'Colocar o root num grupo IAM cuja política nega a exclusão da tabela.', correct: false, consequence: 'Grupos contêm só usuários IAM; o root não entra em grupo.' },
        { id: 'c', text: 'Pôr a conta numa organização e aplicar uma SCP que negue a exclusão.', correct: true, consequence: 'SCPs limitam todas as identidades das contas-membro, inclusive o root.' },
        { id: 'd', text: 'Ativar o MFA no root, que bloqueia exclusões sem um segundo fator.', correct: false, consequence: 'O MFA protege o login; depois de entrar, o root continua com acesso total.' },
      ],
      explanation: [
        'Na própria conta, o **usuário raiz tem acesso total** e não recebe políticas de identidade. A forma de limitar o root é pela **organização**: uma SCP anexada à conta-membro restringe todas as identidades dela, inclusive o root.',
        'Não há como anexar política ao root nem colocá-lo num grupo. E o MFA protege a entrada, não o que ele faz depois.',
        '**Regra prática:** "limitar o que o root de uma conta pode fazer" pede uma SCP. Por isso a SCP só vale para contas-membro, nunca para a conta de gerenciamento.',
      ],
    },
    {
      id: 'rv:iax.f01.m2.a5',
      kind: 'decision',
      title: 'As permissões comuns de duas equipes',
      prompt:
        'Uma empresa tem os grupos IAM Backend e Frontend, cada um com permissões próprias. Todos os desenvolvedores também precisam de um conjunto comum de permissões, e a equipe quer **manter esse conjunto num lugar só**. Qual abordagem funciona?',
      concepts: [{ id: 'iam.groups' }],
      xp: 5,
      difficulty: 1,
      domain: 'd1',
      options: [
        { id: 'a', text: 'Criar o grupo Engenharia e adicionar Backend e Frontend como membros dele.', correct: false, consequence: 'O IAM não aninha grupos: um grupo só tem usuários como membros.' },
        { id: 'b', text: 'Pôr cada desenvolvedor também num grupo Engenharia, com as permissões comuns.', correct: true, consequence: 'Um usuário pode estar em vários grupos, e as permissões se somam.' },
        { id: 'c', text: 'Anexar as permissões comuns ao grupo padrão que reúne todos os usuários.', correct: false, consequence: 'Não existe grupo padrão com todos os usuários da conta.' },
        { id: 'd', text: 'Escrever as permissões comuns numa bucket policy com os grupos como Principal.', correct: false, consequence: 'Grupos não podem ser Principal numa política de recurso.' },
      ],
      explanation: [
        'Grupos IAM contêm **só usuários**, e um usuário pode pertencer a **vários grupos**. Colocar todos os desenvolvedores também num grupo Engenharia mantém as permissões comuns num lugar só, somadas às de Backend ou Frontend. Outra saída é anexar a mesma política gerenciada aos dois grupos.',
        'Grupos não se aninham, não existe grupo padrão com todos os usuários, e um grupo não é principal, então não aparece no Principal de uma bucket policy.',
        '**Regra prática:** grupo é só um jeito de anexar permissões a vários usuários de uma vez. Não se aninha, não é principal e não faz requisições.',
      ],
    },
    {
      id: 'rv:iax.f01.m2.a2:acct',
      kind: 'decision',
      title: 'Quem citar no Principal da política',
      prompt:
        'Uma empresa quer que a **conta parceira** 111122223333 leia um bucket seu, e que **o próprio parceiro decida** quais usuários e roles dele terão esse acesso, por meio das políticas IAM da conta dele. Qual valor deve ir no elemento **Principal** da bucket policy?',
      concepts: [{ id: 'iam.principal' }, { id: 'iam.groups' }],
      xp: 5,
      difficulty: 3,
      domain: 'd1',
      options: [
        { id: 'a', text: '"arn:aws:iam::111122223333:group/Leitores", o grupo do parceiro.', correct: false, consequence: 'Grupos não podem ser principal: a política é rejeitada.' },
        { id: 'b', text: '"arn:aws:iam::111122223333:root", que representa a conta parceira.', correct: true, consequence: 'A conta recebe o acesso, e o parceiro o repassa com as próprias políticas IAM.' },
        { id: 'c', text: '"arn:aws:iam::111122223333:user/*", para valer a todos os usuários.', correct: false, consequence: 'O Principal não aceita curinga em parte do ARN.' },
        { id: 'd', text: '"*", porque o parceiro já controla os próprios usuários.', correct: false, consequence: 'O "*" abre o bucket para qualquer pessoa, de qualquer conta.' },
      ],
      explanation: [
        'Citar a **conta** no Principal, com o ARN terminado em `:root`, entrega o acesso à conta parceira inteira, e não só ao usuário raiz dela. Lá dentro, só usuários e roles que as políticas IAM do parceiro autorizarem conseguem ler. Assim, o parceiro decide quem usa o acesso.',
        'Grupos não podem ser principal, porque se referem a permissões e não a autenticação. O Principal não aceita curinga em parte de um ARN. E o "*" abre para todos.',
        '**Regra prática:** podem ser principal contas, usuários IAM, roles, sessões de role, usuários federados, serviços da AWS e "*". Grupos e políticas nunca.',
      ],
    },
    {
      id: 'rv:iam.roles:permissoes',
      kind: 'decision',
      title: 'O upload que falhou dentro da role',
      prompt:
        'Uma usuária IAM tem permissão para gravar no S3. Para investigar um incidente, ela assume uma role que **só permite ler logs do CloudWatch**. Ainda na sessão da role, tenta enviar um arquivo ao S3 e recebe **AccessDenied**. Qual explicação está correta?',
      concepts: [{ id: 'iam.roles' }],
      xp: 5,
      difficulty: 2,
      domain: 'd1',
      options: [
        { id: 'a', text: 'A trust policy da role precisa citar a usuária para somar as permissões dela.', correct: false, consequence: 'A trust policy diz quem assume, não o que a sessão pode fazer.' },
        { id: 'b', text: 'As credenciais temporárias da role ainda não se propagaram para o S3.', correct: false, consequence: 'Não há propagação: a sessão já tem todas as permissões da role.' },
        { id: 'c', text: 'Na sessão da role, ela tem só as permissões da role, sem as próprias.', correct: true, consequence: 'Para gravar no S3, ela volta a usar a própria identidade.' },
        { id: 'd', text: 'Usuários IAM que assumem roles perdem o acesso ao S3 até a sessão expirar.', correct: false, consequence: 'O acesso dela continua existindo; só não vale dentro da sessão da role.' },
      ],
      explanation: [
        'Ao **assumir uma role**, a pessoa deixa de lado as próprias permissões e passa a ter **só as da role**. Como a role só lê logs do CloudWatch, a gravação no S3 é negada. Basta voltar à própria identidade para gravar de novo.',
        'A trust policy decide quem pode assumir, não soma permissões. E não existe espera nem perda permanente: o acesso dela continua intacto fora da sessão.',
        '**Regra prática:** uma role tem duas políticas: a trust policy (quem assume) e a de permissões (o que a sessão faz). As permissões de quem assume nunca se somam às da role.',
      ],
    },
    {
      id: 'rv:iam.roles:quem-usa',
      kind: 'decision',
      title: 'O trabalho de girar chaves nos contêineres',
      prompt:
        'Uma aplicação em contêineres no Amazon ECS lê mensagens de uma fila SQS com a chave de acesso de um usuário IAM, guardada num cofre de segredos e trocada a cada 90 dias por um script. A equipe quer manter o acesso **com o menor esforço operacional** e sem credenciais de longo prazo. O que fazer?',
      concepts: [{ id: 'iam.roles' }, { id: 'iam.long-vs-temp' }],
      xp: 5,
      difficulty: 1,
      domain: 'd1',
      options: [
        { id: 'a', text: 'Reduzir a troca da chave para cada 30 dias, com o mesmo script.', correct: false, consequence: 'Mais trabalho, e a credencial continua sendo de longo prazo.' },
        { id: 'b', text: 'Pôr a chave numa variável de ambiente da definição da tarefa do ECS.', correct: false, consequence: 'A chave fica exposta na configuração e ainda precisa de rotação.' },
        { id: 'c', text: 'Criar um usuário IAM por contêiner, cada um com a própria chave.', correct: false, consequence: 'Multiplica as chaves a guardar e a girar.' },
        { id: 'd', text: 'Dar à tarefa uma role com leitura na fila e remover o usuário IAM.', correct: true, consequence: 'O serviço entrega credenciais temporárias e as renova sozinho.' },
      ],
      explanation: [
        'Serviços da AWS como o ECS entregam a uma **role** credenciais temporárias, renovadas automaticamente. Elas expiram sozinhas e não precisam ser guardadas nem giradas. Com a role, o script de rotação e o cofre deixam de ser necessários.',
        'Girar mais vezes aumenta o trabalho sem trocar o tipo de credencial. Variável de ambiente expõe a chave. E um usuário por contêiner multiplica o problema.',
        '**Regra prática:** "sem armazenar credenciais" ou "sem precisar girar chaves" apontam para uma role. Quando duas soluções funcionam, a de credenciais temporárias é a preferida.',
      ],
    },
    {
      id: 'rv:iax.f01.m3.a3',
      kind: 'decision',
      title: 'Entrar na conta quando o login único cai',
      prompt:
        'Uma empresa dá acesso às contas AWS só por federação com o provedor de identidade corporativo, e não tem nenhum usuário IAM. Ela quer **continuar administrando a conta se o provedor de identidade ficar fora do ar**, sem espalhar credenciais de longo prazo. Qual solução atende?',
      concepts: [{ id: 'iam.when-iam-user' }, { id: 'iam.users' }, { id: 'iam.long-vs-temp' }],
      xp: 5,
      difficulty: 3,
      domain: 'd2',
      options: [
        { id: 'a', text: 'Compartilhar a senha do usuário raiz com toda a equipe de plantão.', correct: false, consequence: 'Acesso total nas mãos de muita gente, contra as boas práticas do root.' },
        { id: 'b', text: 'Criar uma role de emergência que só usuários federados podem assumir.', correct: false, consequence: 'Com o provedor fora do ar, ninguém consegue se autenticar para assumir a role.' },
        { id: 'c', text: 'Um usuário IAM de emergência, com MFA e credenciais guardadas sob controle.', correct: true, consequence: 'É uma exceção aceita: só é usado quando o provedor de identidade cai.' },
        { id: 'd', text: 'Criar chaves de acesso para cada engenheiro, guardadas como reserva.', correct: false, consequence: 'Espalha dezenas de credenciais de longo prazo que podem vazar.' },
      ],
      explanation: [
        'Com tudo dependendo do provedor de identidade, uma queda dele tranca a empresa do lado de fora. A AWS aceita como exceção um **usuário IAM de emergência**, com MFA, credenciais guardadas e uso monitorado, para esse caso.',
        'Uma role assumida por federados também depende do provedor. Compartilhar o root e distribuir chaves espalham credenciais poderosas de longo prazo.',
        '**Regra prática:** usuário IAM é exceção: workload que não consegue usar role, ferramenta de terceiros que só aceita chave e acesso de emergência quando o provedor cai. Para pessoas no dia a dia, federação.',
      ],
    },
    {
      id: 'rv:iam.users:chaves',
      kind: 'decision',
      title: 'Credenciais demais para quem só usa o console',
      prompt:
        'Um analista usa a AWS **só pelo console**. O usuário IAM dele tem senha com MFA e duas chaves de acesso, criadas "por garantia" e nunca usadas. A auditoria pede **reduzir as credenciais** dele sem tirar o acesso de que precisa. O que fazer?',
      concepts: [{ id: 'iam.users' }, { id: 'iam.access-keys' }],
      xp: 5,
      difficulty: 1,
      domain: 'd1',
      options: [
        { id: 'a', text: 'Remover a senha e manter as chaves, que são mais seguras que senha.', correct: false, consequence: 'Sem senha, ele perde o console, que é o que ele usa.' },
        { id: 'b', text: 'Excluir as duas chaves de acesso e manter a senha com MFA.', correct: true, consequence: 'O console continua funcionando, e somem duas credenciais de longo prazo sem uso.' },
        { id: 'c', text: 'Desativar uma das chaves e manter a outra ativa para emergências.', correct: false, consequence: 'Sobra uma chave ativa que ele não usa e que pode vazar.' },
        { id: 'd', text: 'Mover o analista para um grupo, que dispensa credenciais próprias.', correct: false, consequence: 'O grupo dá permissões, mas o analista ainda precisa da própria senha.' },
      ],
      explanation: [
        'Um usuário IAM tem dois tipos de credencial de longo prazo: a **senha** para o console e até duas **chaves de acesso** para a CLI e as APIs. Quem usa só o console precisa só da senha, protegida com MFA. Chaves sem uso são risco sem benefício.',
        'Remover a senha tira o console. Manter uma chave "para emergências" deixa uma credencial esquecida. E grupos dão permissões, não credenciais.',
        '**Regra prática:** cada credencial deve existir só se alguém a usa. A coluna "Último uso" e o relatório de credenciais mostram as que podem sair.',
      ],
    },
  ],
}
