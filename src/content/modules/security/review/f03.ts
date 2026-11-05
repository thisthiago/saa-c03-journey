/**
 * Questões da Revisão da Fase 3 de Segurança (segredos da aplicação), no
 * formato do exame SAA-C03. Fatos conferidos em docs.aws.amazon.com (ver
 * docs/VERIFICACAO-DE-CONTEUDO.md). As empresas são fictícias.
 */
import type { ReviewSet } from '../../../../engine/types'

export const REVIEW_F03: ReviewSet = {
  phaseId: 'sec.f03',
  questions: [
    {
      id: 'rv:sec.f03.m1.a2',
      kind: 'decision',
      title: 'Duas credenciais na configuração',
      prompt:
        'Uma função Lambda lê a **senha de um banco PostgreSQL** de uma variável de ambiente e grava no **DynamoDB** com uma **chave de acesso fixa**, também numa variável de ambiente. A segurança quer **nenhuma credencial fixa exposta** na configuração da função. Quais mudanças atendem? (Escolha DUAS.)',
      concepts: [{ id: 'secret.where' }],
      xp: 5,
      difficulty: 2,
      domain: 'd1',
      multiple: true,
      options: [
        { id: 'a', text: 'Guardar a senha do banco no Secrets Manager, lida com a role da função.', correct: true, consequence: 'A senha sai da configuração, a leitura fica registrada no CloudTrail, e ela pode girar.' },
        { id: 'b', text: 'Dar acesso ao DynamoDB pela role de execução da função e apagar a chave fixa.', correct: true, consequence: 'A função recebe credenciais temporárias, e não sobra chave fixa para vazar.' },
        { id: 'c', text: 'Manter a chave fixa, mas guardá-la no Secrets Manager.', correct: false, consequence: 'Melhor que na variável, mas a role de execução dispensa qualquer chave fixa.' },
        { id: 'd', text: 'Escrever a senha do banco no código, num repositório privado.', correct: false, consequence: 'A senha vai para o histórico do repositório e para todas as cópias dele.' },
        { id: 'e', text: 'Cifrar as variáveis de ambiente e manter as duas credenciais nelas.', correct: false, consequence: 'Quem lê a configuração da função ainda obtém os valores, e nada gira sozinho.' },
      ],
      explanation: [
        'Cada credencial tem o seu lugar. **Senhas** que não são da AWS, como a do banco, vão para o **Secrets Manager**, lidas com a própria role, com acesso registrado e rotação possível. Para **chamar serviços da AWS**, nem segredo é preciso: a **role** da função entrega **credenciais temporárias**.',
        'Guardar a chave fixa em outro lugar não elimina a chave. Código e variáveis de ambiente expõem os valores a quem lê o repositório ou a configuração.',
        '**Regra prática:** senha de banco, Secrets Manager; acesso a serviços da AWS, role. Chave de acesso fixa numa aplicação na AWS é sempre o item a eliminar.',
      ],
    },
    {
      id: 'rv:sec.f03.senha-no-repositorio',
      kind: 'decision',
      title: 'Uma senha que foi para o Git',
      prompt:
        'Um desenvolvedor gravou a **senha do banco de produção** num arquivo de configuração e fez commit no repositório da empresa, que dezenas de pessoas clonam. A segurança quer **conter o vazamento** e evitar que se repita. Qual ação atende?',
      concepts: [{ id: 'secret.where' }],
      xp: 5,
      difficulty: 1,
      domain: 'd1',
      options: [
        { id: 'a', text: 'Apagar o arquivo no próximo commit e manter a mesma senha.', correct: false, consequence: 'A senha continua no histórico e nas cópias já clonadas.' },
        { id: 'b', text: 'Tornar o repositório privado para menos pessoas.', correct: false, consequence: 'Quem já clonou continua com a senha, e ela segue sem girar.' },
        { id: 'c', text: 'Trocar a senha e passar a guardá-la no Secrets Manager.', correct: true, consequence: 'A senha vazada deixa de valer, e a aplicação passa a buscá-la com a própria role.' },
        { id: 'd', text: 'Mover a senha para uma variável de ambiente do servidor.', correct: false, consequence: 'A senha vazada continua valendo, e quem lê a configuração ainda a vê.' },
      ],
      explanation: [
        'Senha no código vai parar no repositório **e em todas as cópias dele**: apagar o arquivo não apaga o histórico. Para conter o vazamento, a senha precisa **mudar**. Para não se repetir, ela vai para o **Secrets Manager**, de onde a aplicação a busca com a role, com acesso registrado no CloudTrail e possibilidade de rotação.',
        'Apagar o arquivo ou restringir o repositório não invalida a senha. Variável de ambiente só muda onde ela fica exposta.',
        '**Regra prática:** segredo vazado se troca; segredo novo vai para o Secrets Manager.',
      ],
    },
    {
      id: 'rv:sec.f03.m2.a2',
      kind: 'decision',
      title: 'A versão mais nova do segredo',
      prompt:
        'Para "sempre pegar a senha mais nova", um time configurou a aplicação para ler do Secrets Manager a versão com o rótulo **AWSPENDING**. Desde então, os logins **falham de vez em quando**, sempre perto das rotações. A rotação é a padrão, com usuário único. Qual correção atende?',
      concepts: [{ id: 'secret.rotation' }],
      xp: 5,
      difficulty: 3,
      domain: 'd1',
      options: [
        { id: 'a', text: 'Ler a versão com o rótulo AWSPREVIOUS, que já foi testada.', correct: false, consequence: 'Depois da rotação, a senha anterior não vale mais no usuário único.' },
        { id: 'b', text: 'Ler a versão AWSCURRENT, movida só depois do teste.', correct: true, consequence: 'A aplicação usa a senha que a rotação já trocou no banco e testou.' },
        { id: 'c', text: 'Ler as três versões e tentar uma por uma até conectar.', correct: false, consequence: 'Contorna o erro com tentativas, sem entender o ciclo da rotação.' },
        { id: 'd', text: 'Desligar a rotação, para a versão pendente nunca mudar.', correct: false, consequence: 'Os logins voltam a funcionar à custa da rotação que a auditoria exige.' },
      ],
      explanation: [
        'A rotação tem quatro etapas: **createSecret** cria a versão nova com **AWSPENDING**; **setSecret** troca a senha no banco; **testSecret** testa; **finishSecret** move **AWSCURRENT** para a versão nova, e a anterior fica com AWSPREVIOUS. A aplicação deve ler **sempre AWSCURRENT**: AWSPENDING pode existir antes de a senha ser trocada no banco.',
        'AWSPREVIOUS é a senha que deixou de valer. Tentar todas é um remendo. E desligar a rotação viola a exigência.',
        '**Regra prática:** a aplicação lê AWSCURRENT; os outros rótulos são do processo de rotação.',
      ],
    },
    {
      id: 'rv:sec.f03.banco-na-ec2',
      kind: 'decision',
      title: 'Um PostgreSQL numa instância EC2',
      prompt:
        'Uma aplicação usa um **PostgreSQL instalado numa instância EC2**, fora do RDS. A auditoria exige **girar a senha do usuário da aplicação a cada 30 dias**, automaticamente e **sem mudar a aplicação**, que já busca a senha pelo nome do segredo. Qual solução atende?',
      concepts: [{ id: 'secret.rotation' }, { id: 'secret.managed-rotation' }],
      xp: 5,
      difficulty: 2,
      domain: 'd1',
      options: [
        { id: 'a', text: 'A rotação gerenciada do Secrets Manager, sem função Lambda.', correct: false, consequence: 'A rotação gerenciada é para senhas como a do usuário mestre do RDS e do Aurora, não para um banco na EC2.' },
        { id: 'b', text: 'Um parâmetro SecureString no Parameter Store com prazo de expiração.', correct: false, consequence: 'O Parameter Store não troca a senha no banco; ninguém girou nada.' },
        { id: 'c', text: 'Um script agendado na instância que troca a senha e edita a aplicação.', correct: false, consequence: 'Mexe na aplicação a cada rotação e é um código próprio para manter.' },
        { id: 'd', text: 'Secrets Manager com uma Lambda de rotação, a partir de um modelo.', correct: true, consequence: 'A função troca a senha no banco a cada 30 dias, e a aplicação continua lendo AWSCURRENT.' },
      ],
      explanation: [
        'Para senhas como a do usuário mestre do RDS, do Aurora, do DocumentDB e do Redshift, o próprio serviço cuida da **rotação gerenciada**. Para **os outros segredos**, como um banco numa EC2, a rotação usa **uma função Lambda**, que pode partir de um **modelo da AWS**. Agendada para 30 dias, ela troca a senha no banco, e a aplicação continua lendo a versão AWSCURRENT.',
        'A rotação gerenciada não cobre esse banco. O Parameter Store não gira senhas. E um script próprio que edita a aplicação contraria o pedido.',
        '**Regra prática:** banco gerenciado da AWS, rotação gerenciada; qualquer outro, função Lambda de rotação.',
      ],
    },
    {
      id: 'rv:sec.f03.m3.a1',
      kind: 'decision',
      title: 'A aplicação que usa o usuário mestre',
      prompt:
        'A senha do **usuário mestre** de um RDS já gira com a rotação gerenciada do Secrets Manager. A auditoria apontou que a **aplicação conecta com esse usuário mestre**, que pode tudo no banco. A empresa quer seguir a recomendação da AWS, com rotação automática para a aplicação. Qual mudança atende?',
      concepts: [{ id: 'secret.managed-rotation' }],
      xp: 5,
      difficulty: 3,
      domain: 'd1',
      options: [
        { id: 'a', text: 'Manter o usuário mestre na aplicação, já que a senha dele gira.', correct: false, consequence: 'A rotação não reduz o privilégio: a aplicação continua podendo tudo no banco.' },
        { id: 'b', text: 'Um usuário mínimo para a aplicação, com segredo e rotação próprios.', correct: true, consequence: 'A aplicação só faz o necessário, e a senha dela também gira automaticamente.' },
        { id: 'c', text: 'Desligar a rotação do usuário mestre e criar um segundo mestre para a aplicação.', correct: false, consequence: 'Perde a rotação e mantém o privilégio total na aplicação.' },
        { id: 'd', text: 'Guardar a senha do mestre também no Parameter Store, para a aplicação.', correct: false, consequence: 'Duplica o segredo e mantém o privilégio total.' },
      ],
      explanation: [
        'A **rotação gerenciada** cuida da senha do usuário mestre, mas a AWS recomenda que a **aplicação use um usuário de banco com privilégio mínimo**, não o mestre. Esse usuário ganha o próprio segredo, com rotação por função Lambda, e o mestre fica para a administração.',
        'Girar a senha do mestre não reduz o que a aplicação pode fazer. Criar outro mestre ou duplicar o segredo não resolve o privilégio.',
        '**Regra prática:** mestre para administrar, usuário mínimo para a aplicação, cada um com o próprio segredo e rotação.',
      ],
    },
    {
      id: 'rv:sec.f03.m1.a3',
      kind: 'decision',
      title: 'Quarenta parâmetros no Secrets Manager',
      prompt:
        'Um time quer guardar **40 parâmetros de configuração** no Secrets Manager "por segurança". Nenhum é senha, **nenhum gira**, e alguns, como um token de parceiro, são sensíveis. A empresa quer o **menor custo** com os valores sensíveis cifrados. Qual solução atende?',
      concepts: [{ id: 'secret.vs-parameter-store' }],
      xp: 5,
      difficulty: 1,
      domain: 'd4',
      options: [
        { id: 'a', text: 'Manter os 40 valores no Secrets Manager.', correct: false, consequence: 'Paga cada segredo por mês por recursos de rotação que ninguém usa.' },
        { id: 'b', text: 'Parameter Store padrão, com SecureString nos sensíveis.', correct: true, consequence: 'Os sensíveis ficam cifrados pelo KMS, sem custo extra no nível padrão.' },
        { id: 'c', text: 'Um arquivo de configuração cifrado, num bucket do S3.', correct: false, consequence: 'Perde o controle por parâmetro e o histórico que o Parameter Store oferece.' },
        { id: 'd', text: 'Variáveis de ambiente nas instâncias, sem nenhuma criptografia.', correct: false, consequence: 'Os valores sensíveis ficam abertos para quem lê a configuração.' },
      ],
      explanation: [
        'O **Secrets Manager** existe para segredos que **giram** ou que precisam de réplica entre Regiões, com **custo por segredo**. O **Parameter Store** guarda configurações e também valores **SecureString**, cifrados pelo KMS; o **nível padrão** não tem custo extra.',
        'Pagar 40 segredos sem rotação é desperdício. Arquivo no S3 e variáveis de ambiente perdem controle ou proteção.',
        '**Regra prática:** "rotação automática" ou "réplica entre Regiões", Secrets Manager; configuração ou segredo simples sem rotação, Parameter Store.',
      ],
    },
    {
      id: 'rv:sec.f03.m1.a1:dbpass',
      kind: 'decision',
      title: 'Cada valor no lugar certo',
      prompt:
        'Uma aplicação numa instância EC2 usa: a **senha do banco**, que precisa **girar a cada 30 dias**; o **endereço da API de pagamentos**; o acesso de leitura a um **bucket do S3**; e o **nome do bucket** em cada ambiente. A empresa quer o menor custo sem perder segurança. Quais escolhas estão **corretas**? (Escolha DUAS.)',
      concepts: [{ id: 'secret.vs-parameter-store' }],
      xp: 5,
      difficulty: 2,
      domain: 'd4',
      multiple: true,
      options: [
        { id: 'a', text: 'A senha do banco no Secrets Manager, com rotação de 30 dias.', correct: true, consequence: 'Rotação automática é do Secrets Manager.' },
        { id: 'b', text: 'O endereço da API de pagamentos no Parameter Store padrão.', correct: true, consequence: 'Configuração simples, sem rotação e sem custo extra.' },
        { id: 'c', text: 'Uma chave de acesso fixa no Secrets Manager para ler o S3.', correct: false, consequence: 'A role da instância dá acesso ao S3 com credenciais temporárias, sem chave fixa.' },
        { id: 'd', text: 'O nome do bucket no Secrets Manager, por ser um dado da aplicação.', correct: false, consequence: 'Paga um segredo por um valor de configuração que nunca gira.' },
        { id: 'e', text: 'A senha do banco no Parameter Store padrão, girada pelo próprio serviço.', correct: false, consequence: 'O Parameter Store não gira segredos sozinho.' },
      ],
      explanation: [
        'Senha que **gira** vai para o **Secrets Manager**. Configurações, como endereços e nomes de buckets, vão para o **Parameter Store**, sem custo extra no nível padrão. E o **acesso ao S3** vem da **role da instância**, sem nenhuma credencial guardada.',
        'Chave fixa para o S3 é desnecessária. Nome de bucket no Secrets Manager paga à toa. E o Parameter Store não gira senhas.',
        '**Regra prática:** antes de escolher onde guardar, pergunte se o valor gira (Secrets Manager), se é configuração (Parameter Store) ou se é acesso a serviço da AWS (role).',
      ],
    },
    {
      id: 'rv:sec.f03.m2.a3',
      kind: 'decision',
      title: 'Um cache antigo com usuários alternados',
      prompt:
        'A senha do banco gira com a estratégia de **usuários alternados**: a última rotação trocou a senha do **usuário clone** e apontou o segredo para ele. Uma aplicação ainda tem **em cache a versão anterior**, com o **usuário original**, e abre uma conexão nova. Qual é o resultado?',
      concepts: [{ id: 'secret.strategies' }],
      xp: 5,
      difficulty: 3,
      domain: 'd2',
      options: [
        { id: 'a', text: 'O login funciona: essa rotação não trocou a senha do original.', correct: true, consequence: 'Nos usuários alternados, a credencial anterior continua valendo até a rotação seguinte.' },
        { id: 'b', text: 'O banco recusa o login, porque a versão em cache não é a AWSCURRENT.', correct: false, consequence: 'O rótulo não decide o login; o banco aceita a senha do usuário original, que não mudou.' },
        { id: 'c', text: 'O login funciona só se a aplicação usar o segredo de superusuário.', correct: false, consequence: 'O superusuário serve à função de rotação, não à aplicação.' },
        { id: 'd', text: 'O banco recusa o login, porque as duas senhas mudam a cada rotação.', correct: false, consequence: 'Cada rotação troca a senha de um só dos dois usuários.' },
      ],
      explanation: [
        'Nos **usuários alternados**, a primeira rotação clona o usuário, e **cada rotação troca a senha de um dos dois**. Depois da rotação, **as duas credenciais valem**: a nova, do clone, e a anterior, do usuário original, até a rotação seguinte. Por isso uma aplicação com cache da versão anterior ainda conecta, o que serve a aplicações de alta disponibilidade.',
        'O rótulo AWSCURRENT orienta quem lê o segredo, mas quem decide o login é o banco. O superusuário é da função de rotação. E só uma senha muda por vez.',
        '**Regra prática:** usuários alternados mantêm duas credenciais válidas depois da rotação; usuário único tem um curto intervalo de recusa.',
      ],
    },
    {
      id: 'rv:sec.f03.usuario-interativo',
      kind: 'decision',
      title: 'A senha de uma analista de dados',
      prompt:
        'Uma analista de dados acessa o banco **por uma ferramenta de consultas**, com um usuário próprio, e a senha dela precisa girar a cada 30 dias pelo Secrets Manager. Ela tolera um raro erro de login, que resolve tentando de novo. Qual estratégia de rotação a AWS recomenda para esse caso?',
      concepts: [{ id: 'secret.strategies' }],
      xp: 5,
      difficulty: 1,
      domain: 'd1',
      options: [
        { id: 'a', text: 'Usuários alternados, com um segredo de superusuário à parte.', correct: false, consequence: 'Clona o usuário da analista e exige um superusuário, complexidade que o caso não pede.' },
        { id: 'b', text: 'Nenhuma rotação, porque usuários interativos não giram senha.', correct: false, consequence: 'A exigência de girar a cada 30 dias continua valendo.' },
        { id: 'c', text: 'Usuário único, girando a senha da própria analista.', correct: true, consequence: 'É a recomendação para a maioria dos casos e para usuários interativos.' },
        { id: 'd', text: 'Uma senha nova criada à mão pela analista a cada 30 dias.', correct: false, consequence: 'Funciona, mas troca a rotação automática por um trabalho manual.' },
      ],
      explanation: [
        'A AWS recomenda o **usuário único** para a **maioria dos casos** e para **usuários interativos**: a rotação troca a senha do próprio usuário, e as conexões abertas não caem. O curto intervalo em que o banco pode recusar a senha antiga é aceitável para quem tenta de novo.',
        'Usuários alternados servem a aplicações que não toleram nenhuma falha de login. Não girar viola a exigência. E a troca manual perde a automação.',
        '**Regra prática:** usuário único por padrão; usuários alternados só para aplicações de alta disponibilidade sem nova tentativa.',
      ],
    },
    {
      id: 'rv:sec.f03.m3.a2',
      kind: 'decision',
      title: 'Semanas sem us-east-1',
      prompt:
        'Uma aplicação tem uma cópia passiva em us-west-2. Numa falha de us-east-1, a cópia precisa ler a **senha atual** sem depender de us-east-1, cifrada com uma **chave do KMS de us-west-2**. Se o desastre durar semanas, a equipe quer **girar a senha em us-west-2**. Qual solução atende?',
      concepts: [{ id: 'secret.replication' }],
      xp: 5,
      difficulty: 3,
      domain: 'd2',
      options: [
        { id: 'a', text: 'Chamar de us-west-2 o Secrets Manager de us-east-1.', correct: false, consequence: 'Funciona até us-east-1 cair, que é justamente o caso.' },
        { id: 'b', text: 'Um segredo separado em us-west-2, atualizado à mão a cada rotação.', correct: false, consequence: 'Na primeira rotação esquecida, a recuperação falha.' },
        { id: 'c', text: 'Réplica em us-west-2, com chave da Região, promovida no desastre.', correct: true, consequence: 'A réplica recebe cada senha nova e, promovida, vira segredo independente que pode girar lá.' },
        { id: 'd', text: 'Guardar a senha num parâmetro do Parameter Store em us-west-2.', correct: false, consequence: 'Não recebe as rotações de us-east-1 nem gira sozinho.' },
      ],
      explanation: [
        'O Secrets Manager **replica** o segredo cifrado para outras Regiões. Com a rotação ligada, ela acontece na Região principal e **o valor novo chega às réplicas sozinho**. Cada réplica pode usar uma **chave do KMS da própria Região** e pode ser **promovida a segredo independente**, que então gira na Região de recuperação.',
        'Depender de us-east-1 falha no desastre. Cópias manuais esquecem rotações. E o Parameter Store não acompanha o segredo.',
        '**Regra prática:** "a aplicação na Região de recuperação precisa do mesmo segredo, já atualizado" é réplica do Secrets Manager.',
      ],
    },
    {
      id: 'rv:sec.f03.m3.a3',
      kind: 'decision',
      title: 'Um cache de um dia inteiro',
      prompt:
        'Para economizar chamadas de API, um time configurou o cache do segredo na aplicação para durar **24 horas**. A senha do banco gira toda semana com a estratégia de **usuário único**. Depois de cada rotação, os logins **falham por horas**. Qual correção mantém a economia e acaba com as falhas?',
      concepts: [{ id: 'secret.caching' }],
      xp: 5,
      difficulty: 2,
      domain: 'd2',
      options: [
        { id: 'a', text: 'Desligar o cache e buscar o segredo a cada conexão.', correct: false, consequence: 'Acaba com as falhas, mas também com a economia de chamadas.' },
        { id: 'b', text: 'Aumentar o cache para uma semana, igual à rotação.', correct: false, consequence: 'A senha em cache continua velha por até uma semana depois da rotação.' },
        { id: 'c', text: 'Desligar a rotação da senha do banco.', correct: false, consequence: 'Acaba com as falhas à custa da rotação exigida.' },
        { id: 'd', text: 'Cache curto, renovado ao receber erro de login.', correct: true, consequence: 'A aplicação economiza chamadas e busca a senha nova assim que a antiga é recusada.' },
      ],
      explanation: [
        'O cache reduz as **chamadas de API**, que o Secrets Manager cobra. O componente de cache da AWS **atualiza o valor a cada hora** por padrão. O risco: um cache mais antigo que a rotação ainda tem a **senha velha**, e o login falha se o banco já não a aceita. A correção é um cache curto e **buscar o segredo de novo ao receber erro de login**.',
        'Desligar o cache perde a economia. Um cache mais longo piora. E desligar a rotação viola a exigência.',
        '**Regra prática:** cache de segredo sempre com renovação no erro de autenticação e prazo menor que o da rotação.',
      ],
    },
  ],
}
