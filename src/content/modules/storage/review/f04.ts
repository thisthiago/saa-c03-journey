/**
 * Questões da Revisão da Fase 4 da S3 Expedition (criptografia e proteção dos
 * dados), no formato do exame SAA-C03. Fatos conferidos em 16/10/2026 (ver
 * docs/VERIFICACAO-DE-CONTEUDO.md). As empresas são fictícias.
 */
import type { ReviewSet } from '../../../../engine/types'

export const REVIEW_F04: ReviewSet = {
  phaseId: 's3x.f04',
  questions: [
    {
      id: 'rv:s3x.f04.m1.a2',
      kind: 'decision',
      title: 'Requisições sem TLS que continuam passando',
      prompt:
        'Para exigir HTTPS, a bucket policy de um bucket de laudos ganhou um **Allow** de `s3:GetObject` com a condição `aws:SecureTransport` igual a `true`. Uma auditoria mostrou que usuários com `s3:*` nas próprias políticas do IAM continuam lendo laudos por HTTP. A empresa quer **recusar toda requisição sem TLS**, de qualquer principal. O que fazer?',
      concepts: [{ id: 's3.tls-enforcement' }, { id: 'crypto.at-rest-in-transit' }],
      xp: 5,
      difficulty: 3,
      domain: 'd1',
      options: [
        { id: 'a', text: 'Acrescentar a condição de HTTPS às políticas do IAM de cada um dos usuários.', correct: false, consequence: 'Cobre só quem for lembrado: qualquer política nova com Allow volta a permitir HTTP.' },
        { id: 'b', text: 'Trocar o Allow por um Deny quando `aws:SecureTransport` for `false`.', correct: true, consequence: 'O Deny explícito vence qualquer Allow: nenhuma requisição sem TLS passa, venha de quem vier.' },
        { id: 'c', text: 'Ligar a criptografia padrão do bucket com SSE-KMS.', correct: false, consequence: 'Protege os dados gravados, não o tráfego: as leituras por HTTP continuariam.' },
        { id: 'd', text: 'Ligar os quatro ajustes do S3 Block Public Access no bucket.', correct: false, consequence: 'Barra o acesso público; os usuários da auditoria têm permissão e não são públicos.' },
      ],
      explanation: [
        'Um **Allow condicional não nega nada**: ele só deixa de permitir. Quem já tem Allow no IAM continua lendo por HTTP. Para recusar qualquer requisição sem TLS, a bucket policy precisa de um **Deny explícito** com `aws:SecureTransport` igual a `false`, que vence qualquer Allow.',
        'Mexer nas políticas de cada usuário é frágil. A criptografia padrão protege os dados **em repouso**, não **em trânsito**. E o Block Public Access trata de acesso público.',
        '**Regra prática:** "exigir HTTPS de qualquer principal" pede Deny com `aws:SecureTransport` igual a `false` na bucket policy. Criptografia em repouso e em trânsito são proteções diferentes: uma não substitui a outra.',
      ],
    },
    {
      id: 'rv:s3x.f04.boss.a3',
      kind: 'decision',
      multiple: true,
      title: 'Checklist de conformidade dos exames',
      prompt:
        'Um laboratório vai guardar exames num bucket novo. A conformidade exige duas coisas: (1) **dados gravados criptografados** com uma chave cujo **uso fique registrado** e cujo acesso a empresa controle; (2) **tráfego criptografado** em todas as requisições ao bucket. Quais configurações atendem aos dois requisitos? (Escolha DUAS.)',
      concepts: [{ id: 'crypto.at-rest-in-transit' }, { id: 's3.sse-kms' }, { id: 's3.tls-enforcement' }],
      xp: 5,
      difficulty: 2,
      domain: 'd1',
      options: [
        { id: 'a', text: 'Criptografia padrão SSE-KMS com uma chave gerenciada pelo cliente.', correct: true, consequence: 'A key policy controla quem usa a chave, e cada uso aparece no CloudTrail.' },
        { id: 'b', text: 'Criptografia padrão SSE-S3, que o S3 já aplica sem custo.', correct: false, consequence: 'Criptografa em repouso, mas não há key policy própria nem registro de uso por objeto.' },
        { id: 'c', text: 'Bucket policy com Deny quando `aws:SecureTransport` for `false`.', correct: true, consequence: 'Recusa qualquer requisição sem TLS, de qualquer principal.' },
        { id: 'd', text: 'S3 Bucket Keys, que criptografam o tráfego entre o cliente e o S3.', correct: false, consequence: 'Bucket Keys reduzem chamadas ao KMS; não têm relação com o tráfego.' },
        { id: 'e', text: 'Criptografia DSSE-KMS, que cobre o repouso e o trânsito ao mesmo tempo.', correct: false, consequence: 'São duas camadas em repouso; o tráfego continua dependendo de TLS.' },
      ],
      explanation: [
        'Cada requisito pede uma peça. Para os **dados gravados**, com controle e registro de uso da chave, o **SSE-KMS com chave gerenciada pelo cliente**. Para o **tráfego**, uma bucket policy com **Deny** quando `aws:SecureTransport` for `false`.',
        'O SSE-S3 criptografa em repouso, mas sem key policy própria nem registro por uso. Bucket Keys e DSSE-KMS tratam do repouso, não do trânsito.',
        '**Regra prática:** leia se o enunciado pede dados armazenados (SSE ou KMS) ou dados trafegando (TLS). "Auditar o uso da chave" ou "controlar quem descriptografa" leva ao SSE-KMS.',
      ],
    },
    {
      id: 'rv:s3x.f04.so-repouso',
      kind: 'decision',
      title: 'Backups que só precisam estar cifrados',
      prompt:
        'Uma startup vai criar um bucket para backups. A única exigência de segurança do cliente é que os dados fiquem **criptografados em repouso**; não há requisito de controlar ou auditar a chave. A startup quer o **menor esforço e o menor custo**. O que fazer?',
      concepts: [{ id: 's3.sse-s3' }, { id: 's3.default-encryption' }],
      xp: 5,
      difficulty: 1,
      domain: 'd1',
      options: [
        { id: 'a', text: 'Configurar a criptografia padrão com SSE-KMS e uma chave gerenciada pelo cliente.', correct: false, consequence: 'Atende, mas acrescenta o custo das chamadas ao KMS e da chave sem que nenhum requisito peça isso.' },
        { id: 'b', text: 'Criptografar cada backup na aplicação antes do envio.', correct: false, consequence: 'Atende, mas passa toda a gestão de chaves para a startup: o oposto do menor esforço.' },
        { id: 'c', text: 'Nada além de criar o bucket: o SSE-S3 já é a criptografia padrão, sem custo.', correct: true, consequence: 'Todo objeto novo é criptografado automaticamente com SSE-S3, sem custo adicional.' },
        { id: 'd', text: 'Configurar a criptografia padrão com DSSE-KMS, para ter duas camadas.', correct: false, consequence: 'Duas camadas só fazem sentido quando exigidas, e custam chamadas ao KMS.' },
      ],
      explanation: [
        'Desde janeiro de 2023, todo objeto novo no S3 é **criptografado automaticamente com SSE-S3**, sem custo adicional: é a criptografia padrão de todo bucket. Como o único requisito é criptografia em repouso, nada mais é necessário.',
        'SSE-KMS e DSSE-KMS atendem, mas com custo e configuração que ninguém pediu. A criptografia no cliente transfere toda a gestão de chaves para a startup.',
        '**Regra prática:** se o enunciado só pede criptografia em repouso com o menor esforço, o SSE-S3 já atende. Controle, auditoria da chave ou outra conta levam ao SSE-KMS.',
      ],
    },
    {
      id: 'rv:s3x.f04.m3.a1',
      kind: 'decision',
      title: 'Permissão no S3 e AccessDenied mesmo assim',
      prompt:
        'Uma role tem, na política do IAM, `s3:GetObject` no bucket `contratos`, da mesma conta. Os objetos usam SSE-KMS com uma chave gerenciada pelo cliente cuja key policy **cita só os administradores da chave**, sem o statement que delega o controle à conta. A role recebe AccessDenied ao ler. Qual mudança resolve?',
      concepts: [{ id: 'kms.key-policy' }, { id: 's3.sse-kms' }],
      xp: 5,
      difficulty: 3,
      domain: 'd1',
      options: [
        { id: 'a', text: 'Acrescentar `kms:Decrypt` na chave à política do IAM da role.', correct: false, consequence: 'Sem a key policy permitir, direta ou por delegação à conta, nenhuma política do IAM dá acesso à chave.' },
        { id: 'b', text: 'Acrescentar a role à bucket policy, com `s3:GetObject`.', correct: false, consequence: 'A permissão no S3 já existe; falta a permissão para descriptografar com a chave.' },
        { id: 'c', text: 'Mudar a criptografia padrão do bucket para SSE-S3.', correct: false, consequence: 'Só vale para objetos novos; os contratos existentes continuam com a chave do KMS.' },
        { id: 'd', text: 'Permitir `kms:Decrypt` à role na key policy da chave.', correct: true, consequence: 'Com permissão no S3 e na chave, a role consegue ler os objetos.' },
      ],
      explanation: [
        'Ler um objeto SSE-KMS exige **duas permissões**: `s3:GetObject` no S3 e `kms:Decrypt` na chave. A **key policy** é a porta da chave: como ela não delega à conta, as políticas do IAM não valem para a chave, e a permissão precisa estar na própria key policy.',
        'Pôr `kms:Decrypt` só no IAM não funciona sem a delegação. A bucket policy não mexe na chave. E trocar a criptografia padrão não altera objetos existentes.',
        '**Regra prática:** "Access Denied apesar da permissão no S3" num bucket com SSE-KMS costuma ser a chave. Confira primeiro a key policy: sem ela permitir ou delegar à conta, nada no IAM resolve.',
      ],
    },
    {
      id: 'rv:s3x.f04.m3.a2',
      kind: 'decision',
      title: 'Compartilhar objetos cifrados com a chave padrão',
      prompt:
        'Um bucket da conta A guarda relatórios com SSE-KMS usando a chave gerenciada pela AWS, `aws/s3`. A conta B, de um parceiro, precisa ler esses relatórios, e a bucket policy já permite. Os pedidos da conta B falham ao descriptografar. Qual caminho permite que **a conta B leia os relatórios**?',
      concepts: [{ id: 's3.sse-kms' }, { id: 'kms.key-policy' }],
      xp: 5,
      difficulty: 2,
      domain: 'd1',
      options: [
        { id: 'a', text: 'Adicionar a conta B à key policy da chave `aws/s3`, que já cifra os objetos.', correct: false, consequence: 'A key policy da chave gerenciada pela AWS não pode ser alterada.' },
        { id: 'b', text: 'Recriptografar com uma chave do cliente que libere a conta B.', correct: true, consequence: 'Com a key policy liberando a conta B e a permissão do lado dela, o parceiro consegue ler.' },
        { id: 'c', text: 'Dar `kms:Decrypt` na chave `aws/s3` à role do parceiro, na conta B.', correct: false, consequence: 'A chave aws/s3 não permite uso por outras contas, qualquer que seja a política na conta B.' },
        { id: 'd', text: 'Tornar públicos os relatórios, para dispensar a chave.', correct: false, consequence: 'Expõe os relatórios a todos, e a leitura ainda dependeria de descriptografar com a chave.' },
      ],
      explanation: [
        'A chave **`aws/s3`** tem uma key policy que **não pode ser alterada** e que **não permite uso por outras contas**. Para compartilhar objetos SSE-KMS entre contas, é preciso uma **chave gerenciada pelo cliente**, com a key policy liberando a conta B, e copiar os objetos para que passem a usá-la.',
        'Não dá para editar a key policy da `aws/s3` nem contorná-la pela política da conta B. Tornar os relatórios públicos abre tudo e nem resolve a descriptografia.',
        '**Regra prática:** dados criptografados que vão para outra conta pedem uma chave gerenciada pelo cliente, liberada na key policy e na política da conta de origem.',
      ],
    },
    {
      id: 'rv:s3x.f04.boss.a2',
      kind: 'decision',
      title: 'Os arquivos de antes da troca',
      prompt:
        'Um bucket com 2 milhões de objetos usava a criptografia padrão SSE-S3. A equipe trocou a criptografia padrão para SSE-KMS com uma chave gerenciada pelo cliente, e a auditoria agora exige que **todos os objetos**, inclusive os antigos, usem essa chave. Qual ação atende?',
      concepts: [{ id: 's3.default-encryption' }, { id: 's3.sse-s3' }],
      xp: 5,
      difficulty: 2,
      domain: 'd1',
      options: [
        { id: 'a', text: 'Nenhuma: a nova criptografia padrão já foi aplicada aos objetos antigos.', correct: false, consequence: 'A criptografia padrão vale só para objetos novos; os antigos continuam com SSE-S3.' },
        { id: 'b', text: 'Copiar os objetos antigos com SSE-KMS, pelo S3 Batch Operations.', correct: true, consequence: 'Cada cópia grava o objeto com a nova chave; o Batch Operations faz isso em escala.' },
        { id: 'c', text: 'Habilitar as S3 Bucket Keys, que recriptografam os objetos antigos.', correct: false, consequence: 'Bucket Keys reduzem chamadas ao KMS para objetos novos ou copiados; não recriptografam nada sozinhas.' },
        { id: 'd', text: 'Esperar a rotação anual da chave, que recriptografa os objetos do bucket.', correct: false, consequence: 'A rotação troca o material da chave do KMS; não converte objetos SSE-S3 em SSE-KMS.' },
      ],
      explanation: [
        'A **criptografia padrão** vale para objetos novos que chegam sem cabeçalho de criptografia. **Mudá-la não altera os objetos existentes**: os 2 milhões continuam com SSE-S3. Para recriptografá-los, é preciso copiá-los com a nova configuração, e o **S3 Batch Operations** faz isso em escala.',
        'Bucket Keys não recriptografam objetos antigos. A rotação da chave troca o material dela, sem converter objetos de outra criptografia.',
        '**Regra prática:** trocar a criptografia padrão muda só o que chega depois. Para os objetos existentes, a resposta é copiá-los, em escala com o Batch Operations.',
      ],
    },
    {
      id: 'rv:s3x.f04.m2.a3',
      kind: 'decision',
      title: 'Duas camadas e a conta do KMS',
      prompt:
        'Uma norma interna de um banco exige **duas camadas independentes de criptografia em repouso** para os arquivos de clientes no S3. A equipe também quer ligar as S3 Bucket Keys para **reduzir o custo das chamadas ao KMS**. Qual avaliação está correta?',
      concepts: [{ id: 's3.dsse-kms' }, { id: 's3.bucket-keys' }],
      xp: 5,
      difficulty: 3,
      domain: 'd1',
      options: [
        { id: 'a', text: 'SSE-KMS com Bucket Key atende às duas camadas e reduz o custo.', correct: false, consequence: 'SSE-KMS é uma camada só; a Bucket Key reduz o custo, mas não acrescenta camada.' },
        { id: 'b', text: 'DSSE-KMS atende às duas camadas, mas não é compatível com Bucket Keys.', correct: true, consequence: 'A norma fica atendida; a economia das Bucket Keys não está disponível com DSSE-KMS.' },
        { id: 'c', text: 'DSSE-KMS com Bucket Key atende às duas camadas com o menor custo.', correct: false, consequence: 'As S3 Bucket Keys não são compatíveis com DSSE-KMS.' },
        { id: 'd', text: 'SSE-S3 mais SSE-KMS configurados juntos no mesmo bucket somam duas camadas.', correct: false, consequence: 'Um objeto recebe um único tipo de criptografia no servidor; as duas camadas vêm do DSSE-KMS.' },
      ],
      explanation: [
        'A exigência de **duas camadas** aponta para o **DSSE-KMS**, que aplica duas camadas independentes de AES-256 no servidor. Mas as **S3 Bucket Keys não são compatíveis com DSSE-KMS**, então a redução de custo que elas trazem não está disponível.',
        'SSE-KMS com Bucket Key é uma camada só. Não existe DSSE-KMS com Bucket Key. E um objeto não acumula dois tipos de criptografia no servidor.',
        '**Regra prática:** DSSE-KMS só entra quando a exigência de duas camadas é explícita, e vem sem Bucket Keys. Sem essa exigência, SSE-KMS com Bucket Key costuma ser a escolha.',
      ],
    },
    {
      id: 'rv:s3x.f04.auditoria-bucket-key',
      kind: 'decision',
      title: 'O relatório de auditoria que ficou vazio',
      prompt:
        'Um bucket com SSE-KMS recebia milhões de objetos por dia, e a equipe ligou as S3 Bucket Keys para cortar o custo do KMS. Logo depois, um relatório de auditoria que filtra os eventos do KMS no CloudTrail pelo **ARN de cada objeto** deixou de encontrar os objetos novos. Qual é a explicação?',
      concepts: [{ id: 's3.bucket-keys' }, { id: 's3.sse-kms' }],
      xp: 5,
      difficulty: 2,
      domain: 'd1',
      options: [
        { id: 'a', text: 'As Bucket Keys desligam o registro dos eventos do KMS no CloudTrail.', correct: false, consequence: 'Os eventos continuam registrados, em número bem menor, porque há menos chamadas ao KMS.' },
        { id: 'b', text: 'Os objetos novos deixaram de ser criptografados com SSE-KMS.', correct: false, consequence: 'Continuam com SSE-KMS; a Bucket Key só muda como as chaves de dados são geradas.' },
        { id: 'c', text: 'Os eventos do KMS passam a citar o ARN do bucket, não o do objeto.', correct: true, consequence: 'O relatório precisa filtrar pelo ARN do bucket, e não pelo de cada objeto.' },
        { id: 'd', text: 'Os eventos do KMS passaram a ir para os logs de acesso do servidor do S3.', correct: false, consequence: 'Os eventos do KMS continuam no CloudTrail; os logs de acesso do S3 registram requisições ao bucket.' },
      ],
      explanation: [
        'A **S3 Bucket Key** é uma chave de curta duração, no nível do bucket, que gera as chaves de dados dos objetos. Por isso o **contexto de criptografia e os eventos do KMS** passam a usar o **ARN do bucket**, e não o de cada objeto. Relatórios e key policies que dependem do ARN do objeto precisam ser ajustados.',
        'O CloudTrail continua registrando o uso da chave, só que com menos chamadas. Os objetos continuam com SSE-KMS, e os eventos do KMS não mudam de destino.',
        '**Regra prática:** antes de ligar as Bucket Keys, procure condições ou filtros que usem o ARN do objeto no contexto de criptografia: eles passam a ver o ARN do bucket.',
      ],
    },
    {
      id: 'rv:s3x.f04.m2.a4',
      kind: 'decision',
      title: 'Chaves que ficam fora da AWS',
      prompt:
        'Por contrato, uma empresa precisa **manter as chaves fora da AWS** e enviá-las ao S3 em cada leitura e gravação. Ela criou um bucket novo em outubro de 2026, e os primeiros envios com SSE-C, feitos por HTTPS, foram recusados. O que precisa ser feito?',
      concepts: [{ id: 's3.sse-c' }],
      xp: 5,
      difficulty: 2,
      domain: 'd1',
      options: [
        { id: 'a', text: 'Enviar as requisições por HTTP, já que a chave segue no cabeçalho.', correct: false, consequence: 'Requisições SSE-C precisam usar HTTPS; por HTTP, elas são recusadas.' },
        { id: 'b', text: 'Dar à aplicação a permissão `kms:Encrypt` na chave do bucket.', correct: false, consequence: 'No SSE-C a chave vem do cliente; o KMS não participa.' },
        { id: 'c', text: 'Trocar para SSE-KMS com uma chave importada para o KMS.', correct: false, consequence: 'A chave passaria a ficar no KMS, dentro da AWS, o que o contrato proíbe.' },
        { id: 'd', text: 'Habilitar o SSE-C no bucket com PutBucketEncryption.', correct: true, consequence: 'Buckets novos vêm com SSE-C desabilitado para gravações; habilitado, os envios passam.' },
      ],
      explanation: [
        'No **SSE-C**, o cliente envia a chave em cada requisição, e o S3 criptografa sem guardá-la: é o que o contrato pede. Desde abril de 2026, **buckets de uso geral novos vêm com o SSE-C desabilitado** para novas gravações, e é preciso habilitá-lo de propósito com PutBucketEncryption.',
        'HTTP é recusado em requisições SSE-C. O KMS não participa do SSE-C. E uma chave importada para o KMS fica dentro da AWS.',
        '**Regra prática:** "manter as chaves fora da AWS e enviá-las a cada requisição" aponta para o SSE-C, sempre por HTTPS. Se a chave se perder, o objeto se perde junto.',
      ],
    },
    {
      id: 'rv:s3x.f04.so-texto-cifrado',
      kind: 'decision',
      title: 'Dados que nem a AWS pode ler',
      prompt:
        'Um escritório de advocacia vai guardar pareceres no S3 e exige que **a AWS nunca tenha acesso ao conteúdo em texto claro**, em nenhum momento. Qual opção atende?',
      concepts: [{ id: 's3.client-side-encryption' }],
      xp: 5,
      difficulty: 2,
      domain: 'd1',
      options: [
        { id: 'a', text: 'SSE-C, enviando a chave do escritório em cada requisição.', correct: false, consequence: 'O S3 não guarda a chave, mas recebe os dados em texto claro e os criptografa no servidor.' },
        { id: 'b', text: 'SSE-KMS com uma chave gerenciada pelo próprio escritório.', correct: false, consequence: 'O escritório controla a chave, mas a criptografia acontece dentro do S3, que vê os dados.' },
        { id: 'c', text: 'Criptografar os pareceres na aplicação, antes do envio.', correct: true, consequence: 'Os pareceres saem da aplicação já cifrados: o S3 guarda só texto cifrado.' },
        { id: 'd', text: 'DSSE-KMS, com duas camadas de criptografia.', correct: false, consequence: 'As duas camadas são aplicadas no servidor, depois que o S3 recebe os dados.' },
      ],
      explanation: [
        'Só a **criptografia do lado do cliente** garante que a AWS nunca veja o texto claro: os dados são cifrados antes de sair da aplicação, e o S3 recebe e guarda só o texto cifrado.',
        'SSE-C, SSE-KMS e DSSE-KMS são criptografia **no servidor**: o S3 recebe os dados e os cifra lá dentro, com a chave que for.',
        '**Regra prática:** "a AWS não pode ter acesso aos dados em texto claro" aponta para a criptografia no cliente. O preço é que a aplicação gerencia as chaves e os serviços da AWS não conseguem processar o conteúdo.',
      ],
    },
  ],
}
