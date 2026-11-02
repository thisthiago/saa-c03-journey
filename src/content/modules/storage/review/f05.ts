/**
 * Questões da Revisão da Fase 5 da S3 Expedition (versionamento e
 * recuperação), no formato do exame SAA-C03. Fatos conferidos em 16/10/2026
 * (ver docs/VERIFICACAO-DE-CONTEUDO.md). As empresas são fictícias.
 */
import type { ReviewSet } from '../../../../engine/types'

export const REVIEW_F05: ReviewSet = {
  phaseId: 's3x.f05',
  questions: [
    {
      id: 'rv:s3x.f05.m1.a1',
      kind: 'decision',
      title: 'O arquivo que existia antes do versionamento',
      prompt:
        'O bucket de uma editora tinha o objeto `catalogo.pdf` antes de o versionamento ser habilitado. Depois de habilitar, a equipe gravou duas novas versões do mesmo arquivo. A auditoria quer saber **quantas versões existem e como elas são identificadas**. Qual descrição está correta?',
      concepts: [{ id: 's3.versioning' }, { id: 's3.version-id' }],
      xp: 5,
      difficulty: 2,
      domain: 'd2',
      options: [
        { id: 'a', text: 'Duas versões: o arquivo antigo foi descartado ao habilitar o versionamento.', correct: false, consequence: 'Habilitar o versionamento não apaga nada: o objeto que já existia continua lá.' },
        { id: 'b', text: 'Três versões, todas com version IDs únicos atribuídos ao habilitar.', correct: false, consequence: 'O objeto anterior mantém o version ID null; só as gravações novas ganham IDs únicos.' },
        { id: 'c', text: 'Três versões: a original com version ID null e duas com IDs únicos.', correct: true, consequence: 'É o estado real: a original fica como null, e cada gravação nova recebe um ID.' },
        { id: 'd', text: 'Uma versão completa e duas diferenças, já que o S3 guarda só o que mudou.', correct: false, consequence: 'Cada versão é o objeto inteiro, cobrado como um objeto completo.' },
      ],
      explanation: [
        'Com o versionamento habilitado, **cada gravação recebe um version ID único**. Objetos que já existiam antes de habilitar **mantêm o version ID null**. Por isso há três versões: a original (null) e as duas novas, cada uma com seu ID.',
        'Habilitar o versionamento não apaga nem renumera objetos existentes. E o S3 guarda cada versão inteira, não a diferença entre elas.',
        '**Regra prática:** version ID null indica um objeto gravado antes do versionamento (ou com ele suspenso). Lembre que cada versão é cobrada como um objeto completo.',
      ],
    },
    {
      id: 'rv:s3x.f05.m1.a2',
      kind: 'decision',
      title: 'Restaurar sem apagar o rastro',
      prompt:
        'Num bucket versionado de uma seguradora, alguém executou um DELETE sem versionId no objeto `apolice-123.pdf`, que sumiu da listagem. A auditoria exige que o arquivo volte e que o **histórico continue mostrando que ele foi apagado** e depois restaurado. Qual caminho atende?',
      concepts: [{ id: 's3.delete-marker' }, { id: 's3.restore-version' }],
      xp: 5,
      difficulty: 3,
      domain: 'd2',
      options: [
        { id: 'a', text: 'Excluir o delete marker, para a versão anterior voltar a ser a atual.', correct: false, consequence: 'O arquivo volta, mas o marker some do histórico: a exclusão deixa de aparecer.' },
        { id: 'b', text: 'Copiar a versão anterior sobre a mesma key, criando uma nova versão atual.', correct: true, consequence: 'O arquivo volta como versão atual, e o delete marker continua no histórico.' },
        { id: 'c', text: 'Fazer um GET com o versionId do delete marker, que devolve o arquivo apagado.', correct: false, consequence: 'Um GET com o versionId de um delete marker retorna 405: o marker não tem conteúdo.' },
        { id: 'd', text: 'Suspender o versionamento, o que remove o delete marker e restaura o objeto.', correct: false, consequence: 'Suspender só muda as gravações seguintes; não remove marker nem restaura nada.' },
      ],
      explanation: [
        'Há dois caminhos para restaurar. **Excluir o delete marker** faz a versão anterior voltar a ser a atual, mas apaga o marker do histórico. **Copiar a versão anterior sobre a mesma key** cria uma nova versão atual e preserva tudo, inclusive o marker. Como a auditoria quer ver a exclusão, o caminho é a cópia.',
        'O delete marker não tem conteúdo: um GET com o versionId dele retorna 405. E suspender o versionamento não desfaz exclusões.',
        '**Regra prática:** remover o marker é o caminho mais rápido; copiar a versão anterior é o caminho que preserva todo o histórico.',
      ],
    },
    {
      id: 'rv:s3x.f05.m2.a2',
      kind: 'decision',
      title: 'O contrato sobrescrito por um script',
      prompt:
        'Num bucket versionado, um script com defeito sobrescreveu `contrato-88.pdf` com um arquivo vazio. A empresa quer que a versão correta volte a ser a atual, e a auditoria exige que **nenhuma versão seja apagada**, nem a vazia. O que fazer?',
      concepts: [{ id: 's3.restore-version' }, { id: 's3.permanent-delete' }],
      xp: 5,
      difficulty: 2,
      domain: 'd2',
      options: [
        { id: 'a', text: 'Excluir a versão vazia informando o versionId dela.', correct: false, consequence: 'A versão correta volta a ser a atual, mas a vazia é apagada para sempre, contra a exigência.' },
        { id: 'b', text: 'Excluir o delete marker que o script criou.', correct: false, consequence: 'O script sobrescreveu, não excluiu: não há delete marker para remover.' },
        { id: 'c', text: 'Copiar a versão correta sobre a mesma key.', correct: true, consequence: 'Ela volta como versão atual, e todas as versões, inclusive a vazia, ficam no histórico.' },
        { id: 'd', text: 'Suspender o versionamento e enviar o arquivo correto de novo.', correct: false, consequence: 'Tira a proteção do bucket e grava uma versão null; a exigência pede só restaurar.' },
      ],
      explanation: [
        'Uma sobrescrita cria uma **nova versão**; a anterior continua guardada. **Copiar a versão correta sobre a mesma key** a torna a versão atual sem apagar nenhuma outra, como a auditoria exige.',
        'Um DELETE com versionId é a **exclusão permanente** daquela versão: resolveria, mas apagando a versão vazia. Não há delete marker numa sobrescrita. E suspender o versionamento tira a proteção sem necessidade.',
        '**Regra prática:** em bucket versionado, DELETE com versionId apaga para sempre. Quando o histórico precisa ficar inteiro, restaure copiando a versão desejada.',
      ],
    },
    {
      id: 'rv:s3x.f05.m3.a4',
      kind: 'decision',
      title: 'MFA delete num bucket com ciclo de vida',
      prompt:
        'Um bucket versionado tem uma regra de ciclo de vida que **expira versões não atuais** depois de 90 dias. A segurança agora quer ligar o **MFA delete**, para exigir um código MFA em toda exclusão permanente de versão. Qual avaliação está correta?',
      concepts: [{ id: 's3.mfa-delete' }, { id: 's3.permanent-delete' }],
      xp: 5,
      difficulty: 3,
      domain: 'd1',
      options: [
        { id: 'a', text: 'Dá para ligar, e a regra de ciclo de vida passa a pedir o código MFA.', correct: false, consequence: 'O ciclo de vida não tem como informar um código MFA.' },
        { id: 'b', text: 'Dá para ligar, desde que um administrador IAM o faça pelo console.', correct: false, consequence: 'Só o usuário raiz habilita o MFA delete, e não há opção no console: só CLI ou API.' },
        { id: 'c', text: 'Dá para ligar, e ele passa a proteger só os delete markers.', correct: false, consequence: 'O MFA delete protege a exclusão permanente de versões e a mudança do estado do versionamento.' },
        { id: 'd', text: 'Não dá: o MFA delete não convive com regras de ciclo de vida.', correct: true, consequence: 'A empresa precisa escolher entre o MFA delete e a regra de ciclo de vida, ou buscar outra proteção.' },
      ],
      explanation: [
        'O **MFA delete** exige um código MFA para excluir versões permanentemente e para mudar o estado do versionamento. Mas ele **não pode ser usado com configurações de ciclo de vida**, que também excluem versões. A empresa precisa escolher, ou proteger as versões de outro jeito, como o Object Lock.',
        'O ciclo de vida não informa códigos MFA. O MFA delete só é habilitado pelo usuário raiz, pela CLI ou pela API. E ele protege versões, não só delete markers.',
        '**Regra prática:** lembre as restrições do MFA delete: só o usuário raiz habilita, não há console e não convive com ciclo de vida. Retenção por prazo pede Object Lock.',
      ],
    },
    {
      id: 'rv:s3x.f05.backups-com-excecao',
      kind: 'decision',
      title: 'Backups protegidos, com uma exceção',
      prompt:
        'Os backups diários de uma empresa ficam num bucket e precisam ser **protegidos contra exclusão e sobrescrita por 90 dias**. Em casos excepcionais, aprovados pela diretoria, **só a equipe de segurança** pode apagar um backup antes do prazo. Qual configuração atende?',
      concepts: [{ id: 's3.object-lock' }],
      xp: 5,
      difficulty: 2,
      domain: 'd1',
      options: [
        { id: 'a', text: 'Object Lock em modo compliance, com 90 dias de retenção.', correct: false, consequence: 'No modo compliance, ninguém, nem o usuário raiz, apaga antes do prazo: a exceção fica impossível.' },
        { id: 'b', text: 'Object Lock com legal hold em cada backup.', correct: false, consequence: 'O legal hold não tem data de expiração: os backups ficariam presos até alguém remover a proteção um a um.' },
        { id: 'c', text: 'MFA delete no bucket, com o dispositivo da equipe de segurança.', correct: false, consequence: 'O MFA delete usa o dispositivo do usuário raiz e não define prazo de retenção.' },
        { id: 'd', text: 'Object Lock em modo governance, com bypass só para a segurança.', correct: true, consequence: 'Ninguém apaga antes do prazo, exceto quem tem s3:BypassGovernanceRetention e envia o cabeçalho de bypass.' },
      ],
      explanation: [
        'O requisito tem uma **retenção por prazo** (90 dias) e uma **exceção controlada**. O Object Lock em **modo governance** faz isso: protege as versões até a data, mas quem tem `s3:BypassGovernanceRetention`, e envia o cabeçalho de bypass, consegue alterar ou excluir. A permissão fica só com a segurança.',
        'O modo compliance não tem exceção. O legal hold não tem prazo. E o MFA delete não define retenção e depende do usuário raiz.',
        '**Regra prática:** "ninguém pode remover a proteção" pede o modo compliance; "só alguns podem, em exceções" pede o modo governance; proteção sem prazo, até ser removida, é o legal hold.',
      ],
    },
    {
      id: 'rv:s3x.f05.delete-com-object-lock',
      kind: 'decision',
      title: 'DELETE num bucket com Object Lock',
      prompt:
        'Um bucket com Object Lock em modo compliance guarda registros com retenção até 2030. Um operador executa um **DELETE sem versionId** num desses registros e, em seguida, um **DELETE com o versionId** da versão protegida. O que acontece em cada pedido?',
      concepts: [{ id: 's3.object-lock' }, { id: 's3.delete-marker' }],
      xp: 5,
      difficulty: 3,
      domain: 'd2',
      options: [
        { id: 'a', text: 'Os dois pedidos são negados, porque a versão está protegida.', correct: false, consequence: 'A proteção vale para a versão: um DELETE sem versionId não a toca, só cria um marker.' },
        { id: 'b', text: 'O primeiro cria um delete marker; o segundo é negado com 403.', correct: true, consequence: 'O registro some da listagem, mas a versão protegida continua guardada até 2030.' },
        { id: 'c', text: 'O primeiro apaga a versão; o segundo falha porque ela não existe mais.', correct: false, consequence: 'Sem versionId, nada é apagado num bucket versionado: só se cria um delete marker.' },
        { id: 'd', text: 'O primeiro cria um delete marker; o segundo apaga a versão protegida.', correct: false, consequence: 'No modo compliance, ninguém apaga a versão antes da data de retenção.' },
      ],
      explanation: [
        'O Object Lock protege **versões específicas**. Um DELETE sem versionId não apaga nenhuma versão: cria um **delete marker**, e o registro some da listagem. Já o DELETE com o versionId da versão protegida é **negado com 403** até o fim da retenção.',
        'Achar que o primeiro pedido também é negado, ou que ele apaga a versão, ignora como o versionamento funciona. No modo compliance, a versão protegida não é apagada por ninguém antes da data.',
        '**Regra prática:** com Object Lock, "sumir da listagem" não é perder o dado: confira as versões. A versão protegida só sai depois da retenção.',
      ],
    },
    {
      id: 'rv:s3x.f05.copia-independente',
      kind: 'decision',
      multiple: true,
      title: 'Backups que sobrevivem a credenciais roubadas',
      prompt:
        'Os backups de uma empresa ficam num bucket versionado. A segurança teme que um invasor com **credenciais administrativas da conta** apague todas as versões. Quais opções criam uma **cópia independente**, fora do alcance dessas credenciais? (Escolha DUAS.)',
      concepts: [{ id: 'backup.independent-copy' }, { id: 's3.versioning' }],
      xp: 5,
      difficulty: 2,
      domain: 'd2',
      options: [
        { id: 'a', text: 'Replicar o bucket para um bucket de outra conta, de acesso restrito.', correct: true, consequence: 'As credenciais roubadas da conta de origem não alcançam a cópia na outra conta.' },
        { id: 'b', text: 'Criar um segundo bucket versionado na mesma conta e copiar os backups.', correct: false, consequence: 'O mesmo administrador alcança os dois buckets: a cópia cai junto.' },
        { id: 'c', text: 'Usar o AWS Backup, com cópia para um cofre (vault) em outra conta.', correct: true, consequence: 'A cópia fica num cofre de outra conta, fora do alcance das credenciais roubadas.' },
        { id: 'd', text: 'Mover as versões antigas para o Glacier Deep Archive no mesmo bucket.', correct: false, consequence: 'Muda a classe, não o dono: quem controla o bucket continua podendo apagar.' },
        { id: 'e', text: 'Ligar a criptografia SSE-KMS no bucket de backups.', correct: false, consequence: 'Protege a leitura dos dados, não a exclusão por quem administra a conta.' },
      ],
      explanation: [
        'O versionamento protege contra erros **dentro do bucket**. Contra credenciais administrativas comprometidas, é preciso uma **cópia independente**, numa **outra conta**: por replicação para um bucket de acesso restrito ou pelo **AWS Backup**, com cópia para um cofre de outra conta.',
        'Um segundo bucket na mesma conta, outra classe de armazenamento ou a criptografia não tiram os dados do alcance de quem administra a conta.',
        '**Regra prática:** versionamento não é backup. Para comprometimento da conta ou ransomware, a resposta envolve outra conta; para perda da Região, outra Região também.',
      ],
    },
    {
      id: 'rv:s3x.f05.lock-e-regiao',
      kind: 'decision',
      title: 'O risco que o Object Lock não cobre',
      prompt:
        'Uma empresa guarda os backups num bucket em sa-east-1, com versionamento e **Object Lock em modo compliance** por um ano. A diretoria quer saber qual destes riscos **continua descoberto** com essa configuração. Qual avaliação está correta?',
      concepts: [{ id: 'backup.independent-copy' }, { id: 's3.object-lock' }],
      xp: 5,
      difficulty: 3,
      domain: 'd2',
      options: [
        { id: 'a', text: 'Um administrador da conta apagar as versões antes de um ano.', correct: false, consequence: 'No modo compliance, ninguém apaga as versões antes do prazo, nem o usuário raiz.' },
        { id: 'b', text: 'Um ransomware sobrescrever os backups com arquivos cifrados.', correct: false, consequence: 'A sobrescrita cria versões novas; as protegidas continuam guardadas.' },
        { id: 'c', text: 'A Região sa-east-1 inteira ficar indisponível.', correct: true, consequence: 'O bucket só existe em sa-east-1: sem uma cópia em outra Região, a perda da Região leva o acesso junto.' },
        { id: 'd', text: 'O usuário raiz encurtar a retenção para conseguir apagar mais cedo.', correct: false, consequence: 'No modo compliance, nem o usuário raiz encurta a retenção.' },
      ],
      explanation: [
        'O **Object Lock em modo compliance** cobre exclusão, sobrescrita e encurtamento da retenção por qualquer pessoa da conta. O que ele não cobre é a **perda da Região**: o bucket existe só em sa-east-1, e nada é copiado para outra Região sem configuração.',
        'Os outros três riscos são exatamente o que o modo compliance impede: exclusão antecipada, sobrescrita das versões protegidas e redução do prazo pelo usuário raiz.',
        '**Regra prática:** Object Lock protege contra quem tem acesso; uma cópia em outra Região protege contra a perda da Região. Requisitos de ransomware e desastre regional costumam pedir os dois.',
      ],
    },
    {
      id: 'rv:s3x.f05.boss.a4',
      kind: 'decision',
      title: 'A conta que cresce sem novos arquivos',
      prompt:
        'Um bucket versionado guarda um arquivo de inventário de 1 GB, regravado várias vezes por dia, e a conta do S3 cresce todo mês. A empresa quer **reduzir o custo** mantendo a possibilidade de **recuperar qualquer versão dos últimos 30 dias**. O que atende?',
      concepts: [{ id: 's3.versioning-cost' }, { id: 's3.versioning' }],
      xp: 5,
      difficulty: 2,
      domain: 'd4',
      options: [
        { id: 'a', text: 'Suspender o versionamento, o que apaga as versões antigas.', correct: false, consequence: 'Suspender não apaga as versões existentes e tira a recuperação dos próximos 30 dias.' },
        { id: 'b', text: 'Uma regra de ciclo de vida que expire versões não atuais depois de 30 dias.', correct: true, consequence: 'As versões antigas somem depois de 30 dias, e as recentes continuam recuperáveis.' },
        { id: 'c', text: 'Desabilitar o versionamento e voltar ao estado original do bucket.', correct: false, consequence: 'Depois de habilitado, o versionamento nunca volta ao estado sem versionamento: só pode ser suspenso.' },
        { id: 'd', text: 'Uma regra que mova as versões não atuais para o Glacier, sem expirá-las.', correct: false, consequence: 'Reduz o preço por GB, mas as versões continuam se acumulando para sempre.' },
      ],
      explanation: [
        'Cada versão é cobrada como o **objeto inteiro**: um arquivo de 1 GB regravado várias vezes por dia acumula dezenas de GB por mês. Uma regra de ciclo de vida com **expiração de versões não atuais** (NoncurrentVersionExpiration) depois de 30 dias corta esse acúmulo e mantém o requisito de recuperação.',
        'Suspender não apaga o que já existe e tira a proteção. Desabilitar não é possível. Mover para o Glacier sem expirar só adia o problema.',
        '**Regra prática:** custo de bucket versionado crescendo sem explicação pede uma regra de ciclo de vida para versões não atuais, e não suspender o versionamento.',
      ],
    },
    {
      id: 'rv:s3x.f05.m3.a3',
      kind: 'decision',
      title: 'Quanto ocupa um arquivo regravado',
      prompt:
        'Num bucket versionado, um relatório de **2 GB** foi gravado uma vez e depois **regravado 10 vezes** no mesmo mês, sempre com conteúdo diferente. Não há regra de ciclo de vida. Quanto armazenamento esse relatório soma na **cobrança** do bucket?',
      concepts: [{ id: 's3.versioning-cost' }],
      xp: 5,
      difficulty: 1,
      domain: 'd4',
      options: [
        { id: 'a', text: '2 GB, porque só a versão atual é cobrada.', correct: false, consequence: 'As versões não atuais são cobradas às tarifas normais do S3, como objetos completos.' },
        { id: 'b', text: '2 GB mais as diferenças entre as versões.', correct: false, consequence: 'O S3 não guarda diferenças: cada versão é o objeto inteiro.' },
        { id: 'c', text: '20 GB, porque a primeira gravação não conta como versão.', correct: false, consequence: 'A primeira gravação também é uma versão guardada e cobrada.' },
        { id: 'd', text: 'Cerca de 22 GB: 11 versões completas de 2 GB.', correct: true, consequence: 'Uma gravação e 10 regravações somam 11 versões inteiras.' },
      ],
      explanation: [
        'Em um bucket versionado, **cada gravação guarda o objeto inteiro** como uma nova versão. Uma gravação mais 10 regravações são **11 versões de 2 GB**, cerca de 22 GB cobrados às tarifas normais.',
        'As versões não atuais também são cobradas, o S3 não guarda diferenças, e a primeira gravação é uma versão como as outras.',
        '**Regra prática:** em bucket versionado, multiplique o tamanho do objeto pelo número de gravações. Para limitar o custo, expire as versões não atuais com uma regra de ciclo de vida.',
      ],
    },
    {
      id: 'rv:s3x.f05.boss.a2',
      kind: 'decision',
      title: 'Gravações com o versionamento suspenso',
      prompt:
        'O bucket de um aplicativo tinha versionamento habilitado e guardava 3 versões de `config.json`, todas com IDs únicos. A equipe **suspendeu o versionamento** e, depois, gravou `config.json` **duas vezes**. Quais versões existem agora?',
      concepts: [{ id: 's3.versioning-suspended' }, { id: 's3.version-id' }],
      xp: 5,
      difficulty: 3,
      domain: 'd2',
      options: [
        { id: 'a', text: 'As 3 versões antigas e uma versão null, a segunda gravação.', correct: true, consequence: 'Suspender não apaga versões com ID, e a segunda gravação substituiu a primeira na versão null.' },
        { id: 'b', text: 'Só a segunda gravação: suspender apagou as versões antigas.', correct: false, consequence: 'Suspender não apaga versões existentes; elas continuam guardadas e cobradas.' },
        { id: 'c', text: 'As 3 versões antigas e duas versões null, uma por gravação.', correct: false, consequence: 'Só existe uma versão null por key: cada PUT com o versionamento suspenso substitui a anterior.' },
        { id: 'd', text: 'As 3 versões antigas e duas versões novas com IDs únicos.', correct: false, consequence: 'Com o versionamento suspenso, as gravações novas usam o version ID null.' },
      ],
      explanation: [
        '**Suspender o versionamento não apaga as versões existentes**: as 3 com IDs únicos continuam guardadas. As gravações novas passam a usar o **version ID null**, e só existe uma versão null por key: a segunda gravação **substitui** a primeira.',
        'Nada foi apagado ao suspender. Não há duas versões null para a mesma key. E IDs únicos só são atribuídos com o versionamento habilitado.',
        '**Regra prática:** com o versionamento suspenso, o bucket se comporta como sem versionamento para os objetos novos, mas guarda (e cobra) todas as versões antigas.',
      ],
    },
  ],
}
