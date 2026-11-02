/**
 * Questões da Revisão da Fase 3 da S3 Expedition (segurança, acesso e
 * privacidade), no formato do exame SAA-C03. Fatos conferidos em 16/10/2026
 * e 02/11/2026 (ver docs/VERIFICACAO-DE-CONTEUDO.md). As empresas são
 * fictícias.
 */
import type { ReviewSet } from '../../../../engine/types'

export const REVIEW_F03: ReviewSet = {
  phaseId: 's3x.f03',
  questions: [
    {
      id: 'rv:s3x.f03.m1.a4',
      kind: 'decision',
      title: 'Chaves de acesso que vazaram no repositório',
      prompt:
        'A aplicação de uma transportadora roda em instâncias EC2 e lê arquivos de um bucket S3 usando as chaves de acesso de um usuário IAM, gravadas no código. As chaves vazaram num repositório público. A empresa quer que a aplicação continue lendo o bucket **sem guardar credenciais de longo prazo** em lugar nenhum. O que fazer?',
      concepts: [{ id: 'iam.identities' }, { id: 'iam.identity-policy' }],
      xp: 5,
      difficulty: 1,
      domain: 'd1',
      options: [
        { id: 'a', text: 'Gerar chaves novas e trocá-las no código todo mês.', correct: false, consequence: 'Continuam sendo credenciais de longo prazo no código, prontas para vazar de novo.' },
        { id: 'b', text: 'Guardar as chaves novas numa variável de ambiente das instâncias.', correct: false, consequence: 'Muda o lugar, não o tipo: as chaves de longo prazo continuam nas instâncias.' },
        { id: 'c', text: 'Anexar às instâncias uma role que permita ler o bucket.', correct: true, consequence: 'A aplicação recebe credenciais temporárias, trocadas automaticamente, e nenhuma chave fica guardada.' },
        { id: 'd', text: 'Criar um usuário IAM para cada instância, com chaves próprias.', correct: false, consequence: 'Multiplica as credenciais de longo prazo em vez de eliminá-las.' },
      ],
      explanation: [
        'O requisito é **não guardar credenciais de longo prazo**. Usuários IAM têm chaves de longo prazo; **roles** fornecem credenciais temporárias. Uma role anexada às instâncias, com uma política de identidade que permite ler o bucket, entrega à aplicação credenciais que expiram e são renovadas sozinhas.',
        'Trocar as chaves, mudá-las de lugar ou criar mais usuários mantém o mesmo problema: chaves de longo prazo guardadas em algum lugar.',
        '**Regra prática:** aplicações e serviços na AWS usam roles, nunca chaves de acesso de usuários IAM embutidas no código ou na configuração.',
      ],
    },
    {
      id: 'rv:s3x.f03.m1.a1',
      kind: 'decision',
      title: 'Credenciais certas e acesso negado',
      prompt:
        'Uma analista recebeu um usuário IAM novo e entra no console sem problemas. Ao abrir um relatório no bucket `financeiro`, da mesma conta, recebe **AccessDenied**. Nenhuma política foi anexada ao usuário, ao grupo dele ou ao bucket. Qual explicação está correta?',
      concepts: [{ id: 'iam.authn-authz' }, { id: 'iam.policy-evaluation' }],
      xp: 5,
      difficulty: 1,
      domain: 'd1',
      options: [
        { id: 'a', text: 'As credenciais dela expiraram e precisam ser recriadas.', correct: false, consequence: 'Ela entrou no console: a autenticação funcionou. Credenciais inválidas dariam outro erro, antes da autorização.' },
        { id: 'b', text: 'Ela se autenticou, mas nenhuma política permite a leitura.', correct: true, consequence: 'O problema é de autorização; a correção é uma política que permita a leitura de que ela precisa.' },
        { id: 'c', text: 'Buckets privados só podem ser lidos pelo usuário root da conta.', correct: false, consequence: 'Privado significa que o acesso precisa ser concedido por política, não que só o root acessa.' },
        { id: 'd', text: 'O relatório precisa ficar público para que outros usuários o leiam.', correct: false, consequence: 'Tornar público abriria o relatório para a internet; basta uma política que permita a ela.' },
      ],
      explanation: [
        'São duas etapas. A **autenticação** prova quem faz a requisição, e funcionou: ela entrou no console. A **autorização** decide se essa identidade pode ler aquele objeto, e falhou: sem nenhuma política que permita, vale o **deny implícito**.',
        'Credenciais vencidas falhariam na autenticação. Buckets privados não são exclusivos do root. E tornar o relatório público resolveria abrindo demais.',
        '**Regra prática:** "entrou mas recebe AccessDenied" é falta de permissão, não de credencial. Tudo começa negado até que uma política permita.',
      ],
    },
    {
      id: 'rv:s3x.f03.m1.a2',
      kind: 'decision',
      title: 'Ninguém pode apagar as gravações',
      prompt:
        'O bucket `gravacoes-atendimento` guarda ligações que não podem ser apagadas. Na conta, vários administradores têm políticas com `s3:*` em todos os recursos, e novas políticas são criadas com frequência. A segurança quer uma regra que **nenhum Allow, atual ou futuro, consiga contornar**. O que atende?',
      concepts: [{ id: 'iam.policy-evaluation' }, { id: 's3.bucket-policy' }],
      xp: 5,
      difficulty: 2,
      domain: 'd1',
      options: [
        { id: 'a', text: 'Remover `s3:DeleteObject` das políticas de identidade existentes.', correct: false, consequence: 'Cria um deny implícito, que qualquer política nova com Allow desfaz.' },
        { id: 'b', text: 'Uma bucket policy que só dê Allow de `s3:GetObject` e `s3:PutObject`.', correct: false, consequence: 'Um Allow a menos não nega nada: as políticas de identidade com `s3:*` continuam permitindo apagar.' },
        { id: 'c', text: 'Ligar o S3 Block Public Access no bucket.', correct: false, consequence: 'Barra o acesso público, não as exclusões feitas por identidades da conta.' },
        { id: 'd', text: 'Uma bucket policy com Deny explícito de `s3:DeleteObject` para todos.', correct: true, consequence: 'Um Deny explícito vence qualquer Allow, em qualquer política aplicável, inclusive nas que forem criadas depois.' },
      ],
      explanation: [
        'Na avaliação de políticas, tudo começa negado, um Allow permite e um **Deny explícito sempre vence**. Para uma garantia que nenhum Allow contorne, a resposta é um **Deny explícito**, e a bucket policy é o lugar natural para ele, porque vale para qualquer identidade que tente apagar.',
        'Tirar a permissão das políticas atuais é deny implícito, desfeito pela próxima política com `s3:*`. Um Allow restrito na bucket policy não nega o que as políticas de identidade permitem. E o Block Public Access trata de acesso público.',
        '**Regra prática:** "garantir que nenhuma permissão contorne" pede Deny explícito. Proteja também quem pode alterar a própria bucket policy, senão alguém remove o Deny.',
      ],
    },
    {
      id: 'rv:s3x.f03.onde-fica-cada-regra',
      kind: 'decision',
      multiple: true,
      title: 'Organizando as permissões dos contratos',
      prompt:
        'Uma empresa está organizando as permissões do bucket `contratos` e quer colocar cada regra no lugar mais adequado. Quais regras devem ficar na **bucket policy**? (Escolha DUAS.)',
      concepts: [{ id: 's3.bucket-policy' }, { id: 'iam.identity-policy' }, { id: 'iam.cross-account' }],
      xp: 5,
      difficulty: 2,
      domain: 'd1',
      options: [
        { id: 'a', text: 'Negar qualquer requisição ao bucket que não use HTTPS.', correct: true, consequence: 'Um Deny com `aws:SecureTransport` igual a false no recurso vale para qualquer identidade que tente acessar.' },
        { id: 'b', text: 'Dar a uma role da mesma conta acesso a este e a outros 30 buckets.', correct: false, consequence: 'Uma política de identidade na role cobre os 31 buckets de uma vez; repetir em 31 bucket policies dá mais trabalho.' },
        { id: 'c', text: 'Permitir que um grupo IAM de analistas leia os contratos.', correct: false, consequence: 'Grupos não podem ser Principal numa bucket policy: a permissão vai numa política de identidade do grupo.' },
        { id: 'd', text: 'Permitir que a conta de uma auditoria externa leia os contratos.', correct: true, consequence: 'O acesso entre contas exige que o recurso permita a outra conta; a bucket policy faz isso.' },
        { id: 'e', text: 'Limitar o que um estagiário pode fazer em todos os serviços da conta.', correct: false, consequence: 'É uma regra sobre a identidade, não sobre o bucket: vai numa política de identidade.' },
      ],
      explanation: [
        'A **bucket policy** é a política do recurso, com o elemento Principal. Ela é o lugar certo quando o controle precisa ficar **no bucket**: exigir HTTPS de qualquer um que o acesse e liberar **outra conta**, já que no acesso entre contas o recurso precisa permitir.',
        'Dar acesso a vários buckets para uma role da mesma conta, permitir um grupo e limitar um estagiário são regras sobre identidades: ficam em políticas de identidade. Grupos, aliás, nem podem ser Principal.',
        '**Regra prática:** política de identidade diz o que uma identidade pode fazer, em qualquer recurso. Bucket policy diz quem pode fazer o quê naquele bucket, e é a escolha para outras contas, HTTPS e restrições de origem.',
      ],
    },
    {
      id: 'rv:s3x.f03.m2.a1',
      kind: 'decision',
      title: 'A auditoria liberada só de um lado',
      prompt:
        'A conta A guarda relatórios num bucket cuja bucket policy permite `s3:GetObject` à role `auditoria` da conta B. Mesmo assim, quem usa essa role recebe AccessDenied. Nenhuma política da role cita o S3. Qual mudança resolve **sem criar credenciais novas**?',
      concepts: [{ id: 'iam.cross-account' }],
      xp: 5,
      difficulty: 2,
      domain: 'd1',
      options: [
        { id: 'a', text: 'Trocar o Principal da bucket policy por `"*"`, para garantir que o acesso funcione.', correct: false, consequence: 'Abriria os relatórios para qualquer pessoa, e a role continuaria sem permissão na própria conta.' },
        { id: 'b', text: 'Na conta B, permitir `s3:GetObject` no bucket de A na política da role.', correct: true, consequence: 'Com o recurso e a identidade permitindo, o acesso entre contas passa a funcionar.' },
        { id: 'c', text: 'Criar um usuário IAM na conta A e entregar as chaves à auditoria.', correct: false, consequence: 'Funcionaria, mas cria credenciais de longo prazo novas, o que o requisito proíbe.' },
        { id: 'd', text: 'Desligar o S3 Block Public Access do bucket na conta A.', correct: false, consequence: 'O Block Public Access trata de acesso público; o acesso de uma conta específica não é público.' },
      ],
      explanation: [
        'No **acesso entre contas**, as duas pontas precisam permitir. A conta A já concedeu, pela bucket policy. Falta a conta B delegar: a política da role `auditoria` precisa permitir `s3:GetObject` no bucket da conta A.',
        'Principal `"*"` tornaria o bucket público. Um usuário IAM na conta A cria credenciais de longo prazo. E o Block Public Access não interfere no acesso de uma conta nomeada.',
        '**Regra prática:** na mesma conta, basta uma das políticas permitir. Entre contas, o recurso precisa permitir a outra conta e a identidade precisa ter a permissão na própria conta.',
      ],
    },
    {
      id: 'rv:s3x.f03.upload-pelo-navegador',
      kind: 'decision',
      title: 'Clientes enviando fotos pelo navegador',
      prompt:
        'Um aplicativo web de seguros quer que os clientes enviem fotos dos sinistros **direto do navegador para o S3**, sem passar pelos servidores da empresa. Os clientes não têm conta AWS, e o bucket deve **continuar privado**. Qual solução atende?',
      concepts: [{ id: 's3.presigned-url' }, { id: 'iam.authn-authz' }],
      xp: 5,
      difficulty: 2,
      domain: 'd1',
      options: [
        { id: 'a', text: 'Liberar a escrita pública no bucket, só no prefixo `uploads/`.', correct: false, consequence: 'Qualquer pessoa na internet poderia gravar no bucket, e ele deixa de ser privado.' },
        { id: 'b', text: 'Colocar no JavaScript do site as chaves de um usuário IAM com permissão de escrita.', correct: false, consequence: 'Qualquer visitante leria as chaves no navegador e as usaria como quisesse.' },
        { id: 'c', text: 'Gerar no backend, a cada envio, uma URL pré-assinada de upload.', correct: true, consequence: 'O navegador grava direto no S3 com a autorização de quem gerou a URL, só naquela key e por pouco tempo.' },
        { id: 'd', text: 'Criar um usuário IAM para cada cliente no cadastro do aplicativo.', correct: false, consequence: 'Usuários IAM não são para clientes de uma aplicação, e as credenciais ficariam no navegador.' },
      ],
      explanation: [
        'Uma **URL pré-assinada** carrega a autorização de quem a gerou: o backend, com a própria role, assina uma URL para gravar um objeto específico, por pouco tempo. O navegador envia a foto direto ao S3, e o bucket continua privado.',
        'Escrita pública abre o bucket para qualquer um. Chaves no JavaScript ficam visíveis a todo visitante. E usuários IAM não servem para clientes de um aplicativo.',
        '**Regra prática:** "acesso temporário a um arquivo", "usuários sem conta AWS" e "upload direto do navegador para o S3" apontam para URLs pré-assinadas.',
      ],
    },
    {
      id: 'rv:s3x.f03.boss.a3',
      kind: 'decision',
      title: 'Links de sete dias que param em horas',
      prompt:
        'Uma função Lambda gera URLs pré-assinadas com validade de **7 dias** para parceiros baixarem laudos de um bucket privado. Os parceiros reclamam que os links param de funcionar **depois de algumas horas**. A função assina as URLs com as credenciais da própria role de execução. Qual é a causa?',
      concepts: [{ id: 's3.presigned-url' }, { id: 'iam.identities' }],
      xp: 5,
      difficulty: 3,
      domain: 'd1',
      options: [
        { id: 'a', text: 'A validade máxima de uma URL pré-assinada é de 12 horas.', correct: false, consequence: 'Doze horas é o limite pelo console; pela CLI ou pelos SDKs, a validade vai até 7 dias.' },
        { id: 'b', text: 'O Block Public Access do bucket invalida as URLs depois de algumas horas.', correct: false, consequence: 'URLs pré-assinadas não são acesso público e não são afetadas pelo Block Public Access.' },
        { id: 'c', text: 'Os parceiros abrem os links de outra Região, e as URLs só valem na Região do bucket.', correct: false, consequence: 'A URL funciona de qualquer lugar até expirar; quem a usa não precisa estar na Região do bucket.' },
        { id: 'd', text: 'A URL foi assinada com credenciais temporárias e expira quando elas expiram.', correct: true, consequence: 'A sessão da role dura horas; quando ela termina, a URL deixa de valer, mesmo antes dos 7 dias.' },
      ],
      explanation: [
        'Uma URL pré-assinada usa as credenciais de quem a gerou. A role de execução da Lambda fornece **credenciais temporárias**, e uma URL assinada com elas **expira quando as credenciais expiram**, mesmo que a validade pedida seja maior.',
        'O limite de 12 horas vale para URLs geradas no console. O Block Public Access não afeta URLs pré-assinadas, e elas funcionam de qualquer lugar.',
        '**Regra prática:** a validade real de uma URL pré-assinada é a menor entre a validade pedida e a das credenciais que a assinaram. Links longos pedem credenciais que durem o mesmo tempo, ou outra forma de compartilhamento.',
      ],
    },
    {
      id: 'rv:s3x.f03.m3.a4',
      kind: 'decision',
      title: 'Leitura para uma conta parceira num bucket novo',
      prompt:
        'Uma editora criou um bucket novo, com as configurações padrão, e quer que **uma conta parceira** leia os arquivos dele. A equipe propõe habilitar as ACLs e conceder leitura objeto por objeto. A editora quer seguir a **recomendação atual** de controle de acesso. O que fazer?',
      concepts: [{ id: 's3.acl' }],
      xp: 5,
      difficulty: 2,
      domain: 'd1',
      options: [
        { id: 'a', text: 'Habilitar as ACLs e conceder leitura à conta parceira em cada objeto.', correct: false, consequence: 'Funciona, mas volta ao mecanismo legado e exige uma concessão por objeto.' },
        { id: 'b', text: 'Manter as ACLs desativadas e liberar a conta na bucket policy.', correct: true, consequence: 'Uma única política controla o acesso, e o bucket segue a recomendação de ACLs desativadas.' },
        { id: 'c', text: 'Conceder leitura ao grupo AuthenticatedUsers na ACL do bucket.', correct: false, consequence: 'AuthenticatedUsers é qualquer conta AWS do mundo: a ACL tornaria o bucket público.' },
        { id: 'd', text: 'Tornar os arquivos públicos e enviar os endereços só ao parceiro.', correct: false, consequence: 'Qualquer pessoa com o endereço leria os arquivos.' },
      ],
      explanation: [
        'Buckets novos usam o **Bucket owner enforced** do Object Ownership: as **ACLs ficam desativadas** e o acesso é controlado só por políticas. Para uma conta parceira, basta uma bucket policy que a libere (e a permissão do lado dela).',
        'Habilitar ACLs é voltar ao legado. O grupo AuthenticatedUsers inclui qualquer conta AWS e torna a ACL pública. Tornar os arquivos públicos expõe tudo.',
        '**Regra prática:** desconfie de alternativas que usam ACLs para controlar acesso num bucket novo. Mantenha as ACLs desativadas e use políticas.',
      ],
    },
    {
      id: 'rv:s3x.f03.m3.a2',
      kind: 'decision',
      title: 'Qual política o S3 considera pública',
      prompt:
        'Uma empresa ligou o **BlockPublicPolicy** em todos os buckets e vai gravar quatro bucket policies, todas com Principal `"*"` e `s3:GetObject`, mas com condições diferentes. Qual delas o S3 vai **rejeitar por ser pública**?',
      concepts: [{ id: 's3.public-policy' }],
      xp: 5,
      difficulty: 3,
      domain: 'd1',
      options: [
        { id: 'a', text: 'A que exige `aws:PrincipalOrgID` igual ao id da organização da empresa.', correct: false, consequence: 'Limita o acesso a contas de uma organização específica: não é pública.' },
        { id: 'b', text: 'A que exige `aws:SourceVpce` igual ao id de um VPC endpoint da empresa.', correct: false, consequence: 'Limita o acesso a quem chega por um endpoint específico: não é pública.' },
        { id: 'c', text: 'A que exige `aws:SourceIp` na faixa `203.0.113.0/24`, do escritório.', correct: false, consequence: 'Uma faixa estreita de IPs é um valor fixo: a política não é pública.' },
        { id: 'd', text: 'A que exige `aws:SourceIp` na faixa `0.0.0.0/1`.', correct: true, consequence: 'Faixas maiores que /8 continuam tornando a política pública: o BlockPublicPolicy a rejeita.' },
      ],
      explanation: [
        'Uma bucket policy com Principal `"*"` é **pública**, a menos que limite o acesso por valores fixos: uma conta, uma organização (`aws:PrincipalOrgID`), um VPC endpoint ou uma faixa estreita de IPs. A faixa `0.0.0.0/1` cobre metade da internet; faixas maiores que /8 continuam contando como públicas.',
        'As outras três políticas restringem o `"*"` a uma organização, a um endpoint e a uma faixa /24: nenhuma é pública, e o BlockPublicPolicy as aceita.',
        '**Regra prática:** Principal `"*"` só deixa de ser público quando uma condição o prende a algo fixo e estreito. Faixas de IP muito amplas não contam.',
      ],
    },
    {
      id: 'rv:s3x.f03.boss.a4',
      kind: 'decision',
      multiple: true,
      title: 'Duas perguntas da auditoria',
      prompt:
        'Depois de um vazamento, a auditoria de um hospital quer duas respostas sobre as centenas de buckets da conta: (1) **quais buckets estão acessíveis publicamente ou por outras contas**; (2) **em quais buckets há dados pessoais de pacientes**, como CPF. Quais serviços respondem a essas perguntas? (Escolha DUAS.)',
      concepts: [{ id: 'iam.access-analyzer' }, { id: 'macie.sensitive-data' }],
      xp: 5,
      difficulty: 2,
      domain: 'd1',
      options: [
        { id: 'a', text: 'IAM Access Analyzer for S3, para a pergunta 1.', correct: true, consequence: 'Alerta sobre buckets acessíveis pela internet ou por outras contas e mostra de onde vem o acesso.' },
        { id: 'b', text: 'AWS CloudTrail, para a pergunta 2.', correct: false, consequence: 'Registra as chamadas de API, não o conteúdo dos objetos: não encontra CPFs nos arquivos.' },
        { id: 'c', text: 'Amazon Macie, para a pergunta 2.', correct: true, consequence: 'Descobre dados sensíveis, como dados pessoais, dentro dos buckets.' },
        { id: 'd', text: 'S3 Storage Lens, para a pergunta 1.', correct: false, consequence: 'Mostra métricas de uso e atividade do armazenamento, não quem consegue acessar cada bucket.' },
        { id: 'e', text: 'Amazon GuardDuty, para a pergunta 2.', correct: false, consequence: 'Detecta atividade suspeita e ameaças, não dados pessoais guardados nos objetos.' },
      ],
      explanation: [
        'As perguntas pedem ferramentas diferentes. **Quem consegue acessar** os buckets, publicamente ou de outras contas, é o que o **IAM Access Analyzer for S3** mostra. **Onde estão os dados pessoais** é o que o **Amazon Macie** descobre, analisando o conteúdo dos objetos.',
        'O CloudTrail registra chamadas de API. O Storage Lens mede uso e atividade do armazenamento. O GuardDuty procura ameaças. Nenhum deles responde às duas perguntas da auditoria.',
        '**Regra prática:** "quem acessa" aponta para o IAM Access Analyzer; "o que há de sensível dentro" aponta para o Macie.',
      ],
    },
  ],
}
