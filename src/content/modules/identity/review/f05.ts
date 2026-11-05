/**
 * Questões da Revisão da Fase 5 da IAM e Access Management (roles e STS), no
 * formato do exame SAA-C03. Fatos conferidos na documentação da AWS (ver
 * docs/VERIFICACAO-DE-CONTEUDO.md). As empresas são fictícias.
 */
import type { ReviewSet } from '../../../../engine/types'

export const REVIEW_F05: ReviewSet = {
  phaseId: 'iax.f05',
  questions: [
    {
      id: 'rv:iax.f05.assumiu-mas-falhou',
      kind: 'decision',
      title: 'A role assumida que não lê nada',
      prompt:
        'Um analista da conta de auditoria **assume com sucesso** a role Leitura da conta de produção. Já na sessão da role, toda tentativa de baixar relatórios de um bucket da conta de produção recebe AccessDenied. Nenhuma política tem Deny. Onde está a **correção**?',
      concepts: [{ id: 'iam.trust-policy' }],
      xp: 5,
      difficulty: 1,
      domain: 'd1',
      options: [
        { id: 'a', text: 'Na trust policy da role, incluindo a ação s3:GetObject.', correct: false, consequence: 'A trust policy diz quem assume; permissões de S3 não vão nela.' },
        { id: 'b', text: 'Na política de permissões da role, com s3:GetObject no bucket.', correct: true, consequence: 'É ela que define o que a sessão pode fazer depois de assumida.' },
        { id: 'c', text: 'Na trust policy da role, citando de novo o ARN do analista na conta.', correct: false, consequence: 'Ele já assumiu a role: a trust policy está funcionando.' },
        { id: 'd', text: 'Na política de identidade do analista, na conta de auditoria.', correct: false, consequence: 'Na sessão, valem só as permissões da role, não as dele.' },
      ],
      explanation: [
        'Uma role tem duas políticas com papéis diferentes. A **trust policy** diz quem pode assumi-la; a **política de permissões** diz o que a sessão pode fazer. Como o analista assumiu a role, a trust policy está certa. A falha na ação aponta para a política de permissões.',
        'Permissões de S3 não vão na trust policy. Repetir o ARN do analista não muda nada. E, na sessão da role, as permissões dele ficam de lado.',
        '**Regra prática:** "não consegue assumir a role" pede a trust policy. "Assume, mas a ação falha" pede a política de permissões.',
      ],
    },
    {
      id: 'rv:iax.f05.role-recriada',
      kind: 'decision',
      title: 'O pipeline que parou depois da limpeza',
      prompt:
        'A trust policy da role publicador cita no Principal o ARN da role **deploy**, usada por um pipeline. Numa limpeza, alguém **excluiu a role deploy e a recriou** com o mesmo nome e as mesmas políticas. Desde então, o pipeline não consegue assumir publicador, e a trust policy mostra um identificador estranho no lugar do ARN. Como **restaurar o acesso**?',
      concepts: [{ id: 'iam.trust-policy' }, { id: 'sts.assume-role' }],
      xp: 5,
      difficulty: 3,
      domain: 'd1',
      options: [
        { id: 'a', text: 'Esperar a propagação da role nova, que pode levar algumas horas.', correct: false, consequence: 'Não há propagação: a política guardou o ID da role antiga, que não volta.' },
        { id: 'b', text: 'Dar à role deploy uma política de identidade que permita sts:AssumeRole.', correct: false, consequence: 'A trust policy continua sem permitir a role nova.' },
        { id: 'c', text: 'Trocar o Principal por `arn:aws:iam::111122223333:role/deploy*`.', correct: false, consequence: 'O Principal não aceita curinga em parte do ARN.' },
        { id: 'd', text: 'Editar a trust policy, pôr o ARN da role no lugar do ID e salvar.', correct: true, consequence: 'Ao salvar, o ARN é ligado ao ID da role nova, e o pipeline volta.' },
      ],
      explanation: [
        'Quando uma trust policy é salva, o ARN de uma role ou de um usuário no Principal é ligado ao **ID único** daquela identidade. Uma role recriada com o mesmo nome tem **outro ID**, e a política deixa de valer para ela. Como a AWS não consegue mais mostrar o ARN, aparece o ID antigo. A correção é editar a política, pôr o ARN de novo e salvar.',
        'Não há propagação a esperar. A política de identidade sozinha não basta para assumir a role. E o Principal não aceita curinga em parte do ARN.',
        '**Regra prática:** excluir e recriar uma identidade citada em trust policies quebra a relação. Depois de recriar, salve de novo as políticas com o ARN.',
      ],
    },
    {
      id: 'rv:sts.temporary-credentials:partes',
      kind: 'decision',
      title: 'Comandos que falham logo após o AssumeRole',
      prompt:
        'Um script chama **sts assume-role** e copia do resultado apenas o **AccessKeyId** e o **SecretAccessKey** para as variáveis de ambiente da CLI. Todos os comandos seguintes falham com erro de token inválido. O que está faltando?',
      concepts: [{ id: 'sts.temporary-credentials' }],
      xp: 5,
      difficulty: 1,
      domain: 'd1',
      options: [
        { id: 'a', text: 'Ativar as credenciais no console do IAM antes do primeiro uso.', correct: false, consequence: 'Credenciais do STS valem assim que são emitidas.' },
        { id: 'b', text: 'Pedir uma duração maior, porque as credenciais já expiraram.', correct: false, consequence: 'O erro aparece logo no primeiro comando, dentro da validade.' },
        { id: 'c', text: 'Informar também o SessionToken devolvido pela chamada.', correct: true, consequence: 'Com ID, segredo e token, a CLI assina as chamadas como a sessão.' },
        { id: 'd', text: 'Trocar o par por uma chave de acesso de longo prazo do usuário.', correct: false, consequence: 'Volta a usar credenciais de longo prazo, que a role existe para evitar.' },
      ],
      explanation: [
        'O AWS STS emite credenciais temporárias em **três partes**: o ID da chave, o segredo e o **token de sessão**, com uma data de expiração. Sem o token, a AWS não reconhece a assinatura como de uma sessão válida.',
        'Não há ativação no console. O erro no primeiro comando descarta a expiração. E voltar à chave de longo prazo desfaz o motivo de usar a role.',
        '**Regra prática:** credencial temporária é sempre o trio ID, segredo e token de sessão, e expira sozinha.',
      ],
    },
    {
      id: 'rv:iax.f05.m2.a3',
      kind: 'decision',
      title: 'Oito horas pedidas, quatro permitidas',
      prompt:
        'Um job chama **AssumeRole** pedindo DurationSeconds de 28.800 (8 horas). A role, assumida diretamente pelo usuário IAM do job, tem **duração máxima de sessão de 4 horas**. Qual é o resultado da chamada?',
      concepts: [{ id: 'sts.assume-role' }, { id: 'sts.temporary-credentials' }],
      xp: 5,
      difficulty: 2,
      domain: 'd1',
      options: [
        { id: 'a', text: 'A chamada devolve credenciais de 4 horas, o máximo da role.', correct: false, consequence: 'O STS não corta o pedido: ele recusa a chamada.' },
        { id: 'b', text: 'A chamada devolve credenciais de 1 hora, a duração padrão.', correct: false, consequence: 'O padrão de 1 hora vale só quando a duração não é informada.' },
        { id: 'c', text: 'A chamada devolve credenciais de 8 horas, porque o pedido prevalece.', correct: false, consequence: 'O máximo configurado na role é um teto que o pedido não ultrapassa.' },
        { id: 'd', text: 'A chamada falha, porque o pedido passa do máximo da role.', correct: true, consequence: 'O job precisa pedir até 4 horas ou a role precisa de um máximo maior.' },
      ],
      explanation: [
        'O **AssumeRole** aceita durações de **900 segundos** até o **máximo configurado na role**, que vai de 1 a 12 horas. O padrão é 1 hora. Pedir mais que o máximo **faz a chamada falhar**, em vez de devolver credenciais mais curtas.',
        'Não há corte automático para o máximo nem volta ao padrão. E o pedido nunca passa do teto da role.',
        'No console, o comportamento é outro: a sessão recebe o máximo da role ou o tempo que resta na sessão do usuário, o que for menor.',
        '**Regra prática:** para sessões longas pela API, ajuste o máximo da role e peça até esse valor. Pedido acima do teto é erro.',
      ],
    },
    {
      id: 'rv:iax.f05.boss.a2',
      kind: 'decision',
      title: 'Uma sessão longa para o servidor de build',
      prompt:
        'Um servidor de build numa instância EC2 usa a role do instance profile para assumir a role deploy, configurada com duração máxima de 12 horas, e pede uma sessão de **3 horas**. A chamada falha. O deploy precisa de uma **única sessão de 3 horas**, sem renovar credenciais no meio. Qual solução atende?',
      concepts: [{ id: 'sts.role-chaining' }, { id: 'sts.assume-role' }],
      xp: 5,
      difficulty: 3,
      domain: 'd1',
      options: [
        { id: 'a', text: 'Subir para 12 horas a duração máxima da role do instance profile.', correct: false, consequence: 'O limite de 1 hora do encadeamento vale seja qual for o máximo das roles.' },
        { id: 'b', text: 'Pedir 10.800 segundos com o parâmetro --duration-seconds na mesma chamada.', correct: false, consequence: 'É o que já foi feito: sessões encadeadas não passam de 1 hora.' },
        { id: 'c', text: 'Dar à role do instance profile as permissões do deploy e usá-la direto.', correct: true, consequence: 'Sem assumir outra role, não há encadeamento nem o limite de 1 hora.' },
        { id: 'd', text: 'Gravar na instância uma chave de acesso de um usuário com as permissões.', correct: false, consequence: 'Volta a guardar credenciais de longo prazo no servidor.' },
      ],
      explanation: [
        'As credenciais do instance profile já são de uma **sessão de role**. Usá-las para assumir outra role é **encadeamento de roles**, e a sessão encadeada fica limitada a **1 hora**, seja qual for o máximo configurado. Para uma sessão longa sem renovação, o caminho é não encadear: dar à role da instância as permissões do deploy.',
        'Mexer no máximo das roles não muda o limite do encadeamento, e repetir o pedido de 3 horas falha de novo. Uma chave de acesso no servidor troca o problema por um risco maior.',
        '**Regra prática:** role que assume outra role, sessão que não passa de 1 hora: a causa é o encadeamento, não a duração máxima configurada.',
      ],
    },
    {
      id: 'rv:iax.f05.m2.a4',
      kind: 'decision',
      title: 'O botão que não funciona para o dono da conta',
      prompt:
        'Uma administradora entra no console **com o usuário raiz** e tenta usar **Switch role** para trabalhar com a role Operacao, da mesma conta, cuja trust policy confia na conta. A troca não funciona. Ela quer usar a role **pelo console**. O que fazer?',
      concepts: [{ id: 'iam.switch-role' }],
      xp: 5,
      difficulty: 1,
      domain: 'd1',
      options: [
        { id: 'a', text: 'Incluir o usuário raiz no Principal da trust policy da role.', correct: false, consequence: 'O root não pode trocar de role, seja qual for a trust policy.' },
        { id: 'b', text: 'Ativar o MFA do root, que o Switch role exige.', correct: false, consequence: 'O MFA não muda a regra: o root não troca de role.' },
        { id: 'c', text: 'Entrar com uma identidade IAM ou federada e trocar de role com ela.', correct: true, consequence: 'Usuários IAM e federados podem usar o Switch role.' },
        { id: 'd', text: 'Exigir um ExternalId na role, que habilita a troca pelo console.', correct: false, consequence: 'Ao contrário: role que exige ExternalId não pode ser usada pelo console.' },
      ],
      explanation: [
        'O **usuário raiz não pode trocar de role**. Para usar o **Switch role** no console, a pessoa precisa entrar com uma identidade IAM ou federada que tenha permissão para assumir a role. Com a troca, ela passa a trabalhar só com as permissões da role, e o Switch back devolve as dela.',
        'Nem a trust policy nem o MFA mudam essa regra. E uma role que exige ExternalId só pode ser assumida pela API AssumeRole, nunca pelo console.',
        '**Regra prática:** o root fica fora do dia a dia, inclusive da troca de roles. A sessão de role no console dura 1 hora por padrão.',
      ],
    },
    {
      id: 'rv:iax.f05.m3.a2:web',
      kind: 'decision',
      multiple: true,
      title: 'Credenciais para um aplicativo sem chaves',
      prompt:
        'Um aplicativo móvel **não pode carregar nenhuma credencial AWS** embutida. Os usuários entram por um provedor externo, que devolve um token OIDC, e em alguns clientes corporativos por uma asserção SAML. Quais APIs do STS o aplicativo pode chamar **sem ter credenciais AWS**? (Escolha DUAS.)',
      concepts: [{ id: 'sts.api-family' }],
      xp: 5,
      difficulty: 2,
      domain: 'd1',
      options: [
        { id: 'a', text: 'AssumeRoleWithWebIdentity, com o token OIDC do provedor.', correct: true, consequence: 'Quem tem o token pode chamar, sem credenciais AWS.' },
        { id: 'b', text: 'AssumeRole, com o nome da role e o token do provedor.', correct: false, consequence: 'O AssumeRole precisa ser assinado com credenciais AWS.' },
        { id: 'c', text: 'GetSessionToken, com o código MFA do usuário.', correct: false, consequence: 'Exige a chave de acesso de um usuário IAM ou do root.' },
        { id: 'd', text: 'AssumeRoleWithSAML, com a asserção do provedor corporativo.', correct: true, consequence: 'Quem tem a asserção pode chamar, sem credenciais AWS.' },
        { id: 'e', text: 'GetFederationToken, com uma session policy por usuário.', correct: false, consequence: 'Exige as credenciais de longo prazo de um usuário IAM.' },
      ],
      explanation: [
        '**AssumeRoleWithWebIdentity** troca um token OIDC, e **AssumeRoleWithSAML** troca uma asserção SAML, por credenciais temporárias de uma role. As duas **não exigem credenciais AWS**: quem tem o token ou a asserção pode chamar. Por isso servem a aplicativos sem chaves embutidas.',
        'AssumeRole, GetSessionToken e GetFederationToken precisam ser assinados com credenciais AWS: de uma identidade ou de uma sessão, no primeiro caso, e de longo prazo nos outros dois.',
        '**Regra prática:** ligue a origem da identidade à API: SAML corporativo, AssumeRoleWithSAML; login OIDC, AssumeRoleWithWebIdentity, em geral pelo Cognito; usuário IAM com MFA, GetSessionToken; acesso a uma role, AssumeRole.',
      ],
    },
    {
      id: 'rv:iax.f05.m4.a1',
      kind: 'decision',
      title: 'Uma pasta por cliente sem uma role por cliente',
      prompt:
        'Uma aplicação multi-cliente assume a role arquivos, que pode ler e gravar em todo o bucket clientes. Cada vez que atende um cliente, ela deve ficar **restrita à pasta daquele cliente**. Há centenas de clientes, e a equipe quer **evitar criar uma role por cliente**. O que fazer?',
      concepts: [{ id: 'sts.session-policy' }],
      xp: 5,
      difficulty: 1,
      domain: 'd1',
      options: [
        { id: 'a', text: 'Criar uma role por cliente, cada uma com acesso só à sua pasta.', correct: false, consequence: 'Funciona, mas é exatamente o que a equipe quer evitar.' },
        { id: 'b', text: 'Passar ao AssumeRole uma session policy limitada à pasta do cliente.', correct: true, consequence: 'Cada sessão fica com a interseção entre a role e a session policy.' },
        { id: 'c', text: 'Anexar à role um permissions boundary limitado a uma das pastas.', correct: false, consequence: 'O boundary vale para todas as sessões, não para cada cliente.' },
        { id: 'd', text: 'Dar à role acesso só de leitura, para reduzir o risco entre clientes.', correct: false, consequence: 'Continua vendo todas as pastas e perde a gravação.' },
      ],
      explanation: [
        'Uma **session policy** é passada ao criar a sessão e restringe só aquela sessão. A sessão fica com a **interseção** entre as permissões da role e a session policy, então uma única role atende todos os clientes, cada sessão limitada à pasta certa.',
        'Uma role por cliente multiplica o trabalho. O boundary é fixo na role e vale para todas as sessões. E reduzir a role a leitura não separa os clientes.',
        '**Regra prática:** "restringir uma sessão específica sem criar uma role para cada caso" pede session policy. Ela nunca concede mais do que a role.',
      ],
    },
    {
      id: 'rv:iax.f05.m4.a3',
      kind: 'decision',
      title: 'Duas tags com a mesma chave',
      prompt:
        'A role equipe tem a tag `projeto=alfa`. Uma pessoa assume essa role passando a **session tag** `projeto=beta`. A política de permissões da role só permite iniciar instâncias quando `aws:ResourceTag/projeto` é igual a `aws:PrincipalTag/projeto`. Quais instâncias a sessão consegue iniciar?',
      concepts: [{ id: 'sts.session-tags' }],
      xp: 5,
      difficulty: 3,
      domain: 'd1',
      options: [
        { id: 'a', text: 'As com projeto=alfa, porque a tag da role prevalece sobre a da sessão.', correct: false, consequence: 'É o contrário: a session tag sobrescreve a tag da role com a mesma chave.' },
        { id: 'b', text: 'As com projeto=alfa ou projeto=beta, porque as duas tags valem.', correct: false, consequence: 'A sessão tem um só valor para a chave projeto.' },
        { id: 'c', text: 'Nenhuma, porque tags iguais na role e na sessão invalidam a condição.', correct: false, consequence: 'Não há conflito: a session tag simplesmente prevalece.' },
        { id: 'd', text: 'As com projeto=beta, porque a session tag sobrescreve a da role.', correct: true, consequence: 'aws:PrincipalTag/projeto vale beta durante a sessão.' },
      ],
      explanation: [
        '**Session tags** são passadas ao assumir a role e viram `aws:PrincipalTag/…` nas requisições da sessão. Quando têm a **mesma chave** de uma tag da role, **sobrescrevem** o valor da role. Na sessão, `aws:PrincipalTag/projeto` é beta, e só instâncias com projeto=beta casam com a condição.',
        'A tag da role não prevalece, os dois valores não convivem e não há invalidação.',
        '**Regra prática:** session tags são a base do controle por atributos (ABAC) com federação. Na mesma chave, a tag da sessão vence a da role.',
      ],
    },
  ],
}
