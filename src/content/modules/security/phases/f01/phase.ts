/**
 * Fase 1 — Criptografia e KMS. Repouso e trânsito, tipos de chave,
 * criptografia em envelope, alias e a separação entre quem administra e quem
 * usa a chave.
 */
import type { PhaseDef } from '../../../../../engine/types'
import type { KmsLabConfig } from '../../../../../simulators/kms/lab'
import { ACCOUNT_ROOT, KEY_ADMIN_ACTIONS, KEY_USER_ACTIONS, KMS_ACCOUNT, roleArn, type KmsWorld } from '../../../../../simulators/kms/model'
import type { Principal } from '../../../../../simulators/policy/model'
import { META } from '../meta'

export const KEY_EXTRATOS = `arn:aws:kms:sa-east-1:${KMS_ACCOUNT}:key/1234abcd-12ab-34cd-56ef-1234567890ab`

const adminAccess = { id: 'adm', name: 'AdministratorAccess', statements: [{ sid: 'Tudo', effect: 'Allow' as const, actions: ['*'], resources: ['*'] }] }
const role = (id: string, name: string, description: string, policies: Principal['identityPolicies'] = []): Principal => ({ id, name, description, kind: 'role-session', account: KMS_ACCOUNT, roleName: name, sessionName: 'sessao', identityPolicies: policies })

export const PONTE_PRINCIPALS: Principal[] = [
  role('app', 'extratos-app', 'role da aplicação que gera os extratos', [{ id: 'app', name: 'ExtratosApp', statements: [{ sid: 'UsarChave', effect: 'Allow', actions: ['kms:Encrypt', 'kms:Decrypt', 'kms:GenerateDataKey'], resources: [KEY_EXTRATOS] }] }]),
  role('seg', 'seguranca-chaves', 'equipe que administra as chaves'),
  role('admin', 'admin-plataforma', 'equipe de plataforma, com AdministratorAccess', [adminAccess]),
  role('relatorio', 'relatorio-mensal', 'função Lambda que roda uma vez por mês'),
]

export const PONTE_KMS: KmsLabConfig = {
  principals: PONTE_PRINCIPALS,
  key: { arn: KEY_EXTRATOS, label: 'chave extratos' },
  palette: [
    { id: 'conta', label: 'Statement da conta: `arn:aws:iam::111122223333:root` com `kms:*` (habilita as políticas IAM)', statement: { sid: 'HabilitarIAM', effect: 'Allow', principals: [{ aws: ACCOUNT_ROOT }], actions: ['kms:*'], resources: ['*'] } },
    { id: 'adm', label: 'Administradores: role **seguranca-chaves** com as ações de administração (Create*, Put*, Enable*, ScheduleKeyDeletion…)', statement: { sid: 'Administradores', effect: 'Allow', principals: [{ aws: roleArn('seguranca-chaves') }], actions: KEY_ADMIN_ACTIONS, resources: ['*'] } },
    { id: 'admtudo', label: 'Administradores com tudo: role **seguranca-chaves** com `kms:*`', statement: { sid: 'AdministradoresTudo', effect: 'Allow', principals: [{ aws: roleArn('seguranca-chaves') }], actions: ['kms:*'], resources: ['*'] } },
    { id: 'usuarios', label: 'Usuários: role **extratos-app** com Encrypt, Decrypt, ReEncrypt*, GenerateDataKey* e DescribeKey', statement: { sid: 'Usuarios', effect: 'Allow', principals: [{ aws: roleArn('extratos-app') }], actions: KEY_USER_ACTIONS, resources: ['*'] } },
    { id: 'grant', label: 'Grant para **relatorio-mensal**: só Decrypt', grant: { id: 'grant-relatorio', granteeId: 'relatorio', operations: ['Decrypt'] } },
    { id: 'grantamplo', label: 'Grant para **relatorio-mensal**: Decrypt, Encrypt e GenerateDataKey', grant: { id: 'grant-relatorio-amplo', granteeId: 'relatorio', operations: ['Decrypt', 'Encrypt', 'GenerateDataKey'] } },
  ],
  requests: [
    { id: 'app-enc', principalId: 'app', action: 'kms:Encrypt', expect: 'allow', why: 'A aplicação cifra os extratos novos.', concepts: ['kms.admin-vs-user'] },
    { id: 'app-dec', principalId: 'app', action: 'kms:Decrypt', expect: 'allow', why: 'A aplicação mostra os extratos aos clientes.', concepts: ['kms.admin-vs-user'] },
    { id: 'seg-put', principalId: 'seg', action: 'kms:PutKeyPolicy', expect: 'allow', why: 'A equipe de segurança administra a chave.', concepts: ['kms.admin-vs-user'] },
    { id: 'seg-del', principalId: 'seg', action: 'kms:ScheduleKeyDeletion', expect: 'allow', why: 'Agendar a exclusão também é tarefa de quem administra.', concepts: ['kms.admin-vs-user'] },
    { id: 'seg-dec', principalId: 'seg', action: 'kms:Decrypt', expect: 'deny', why: 'Quem administra a chave não precisa ler os extratos dos clientes.', concepts: ['kms.admin-vs-user', 'kms.key-policy'] },
    { id: 'admin-dec', principalId: 'admin', action: 'kms:Decrypt', expect: 'deny', why: 'Ter AdministratorAccess no IAM não pode bastar para ler os extratos.', concepts: ['kms.key-policy', 'kms.admin-vs-user'] },
    { id: 'rel-dec', principalId: 'relatorio', action: 'kms:Decrypt', expect: 'allow', why: 'O relatório do mês lê os extratos.', concepts: ['kms.grants'] },
    { id: 'rel-enc', principalId: 'relatorio', action: 'kms:Encrypt', expect: 'deny', why: 'O relatório só lê; não grava extratos.', concepts: ['kms.grants'] },
  ],
}

/** Mundo das predições: a mesma chave com key policies diferentes. */
const world = (statements: KmsWorld['key']['statements']): KmsWorld => ({ principals: PONTE_PRINCIPALS, key: { arn: KEY_EXTRATOS, label: 'chave extratos', statements }, grants: [] })
const SO_ADMINS = world([{ sid: 'Administradores', effect: 'Allow', principals: [{ aws: roleArn('seguranca-chaves') }], actions: KEY_ADMIN_ACTIONS, resources: ['*'] }])
const COM_CONTA = world([
  { sid: 'HabilitarIAM', effect: 'Allow', principals: [{ aws: ACCOUNT_ROOT }], actions: ['kms:*'], resources: ['*'] },
  { sid: 'Administradores', effect: 'Allow', principals: [{ aws: roleArn('seguranca-chaves') }], actions: KEY_ADMIN_ACTIONS, resources: ['*'] },
])

export const F01_SEC: PhaseDef = {
  ...META.f01,
  concepts: ['sec.at-rest-in-transit', 'kms.what', 'kms.key-types', 'kms.symmetric-asymmetric', 'kms.envelope', 'kms.alias', 'kms.key-policy', 'kms.admin-vs-user', 'kms.grants'],
  availability: 'available',
  simplifications: ['O banco, as roles e as chaves são fictícios.', 'As políticas IAM de cada role estão fixas; os laboratórios mudam só a key policy e os grants.'],
  missions: [
    // -----------------------------------------------------------------------
    {
      id: 'sec.f01.m1',
      title: 'Que chave é esta?',
      type: 'mission',
      summary: 'Repouso e trânsito, o que o KMS faz e os três tipos de chave.',
      briefing: {
        company: 'Banco Digital Ponte',
        role: 'Você entrou na equipe de segurança de um banco digital.',
        situation: 'O banco guarda extratos no S3, contratos num banco relacional e backups em snapshots. A auditoria pergunta como cada dado é cifrado e quem controla as chaves.',
        objective: 'Separar repouso de trânsito e saber que tipo de chave protege cada dado.',
        successCriteria: ['Ligar cada risco ao tipo de criptografia', 'Classificar as chaves pelo tipo'],
      },
      intel: [
        { conceptId: 'sec.at-rest-in-transit', body: ['**Em repouso**: dado gravado. **Em trânsito**: dado na rede. Em repouso, chaves como as do KMS; em trânsito, TLS.'] },
        { conceptId: 'kms.what', body: ['O **KMS** guarda chaves que não saem dele sem proteção. A **key policy** decide quem usa e quem administra cada chave, e o uso fica no CloudTrail.'] },
        { conceptId: 'kms.key-types', body: ['**Do cliente**: você controla política, rotação e exclusão, com custo mensal. **Gerenciada pela AWS** (`aws/serviço`): na sua conta, gira todo ano, sem controle seu. **Da AWS**: numa conta do serviço, invisível e sem custo.'] },
      ],
      activities: [
        {
          id: 'sec.f01.m1.a1',
          kind: 'classify',
          title: 'Repouso ou trânsito',
          prompt: 'Classifique cada risco pelo tipo de proteção que ele pede.',
          concepts: [{ id: 'sec.at-rest-in-transit' }],
          xp: 40,
          difficulty: 1,
          explanation: ['Dado gravado (disco, bucket, snapshot) pede criptografia em repouso. Dado viajando (navegador, chamada entre serviços) pede TLS.'],
          bins: [
            { id: 'rest', label: 'Em repouso' },
            { id: 'transit', label: 'Em trânsito' },
          ],
          items: [
            { id: 'snapshot', text: 'Um snapshot do banco copiado para outra conta', bin: 'rest', explanation: 'O snapshot é dado gravado.', concepts: ['sec.at-rest-in-transit'] },
            { id: 'bucket', text: 'Extratos guardados num bucket do S3', bin: 'rest', explanation: 'Objetos gravados no bucket.', concepts: ['sec.at-rest-in-transit'] },
            { id: 'browser', text: 'O cliente baixando o extrato pelo navegador', bin: 'transit', explanation: 'O dado viaja pela internet.', concepts: ['sec.at-rest-in-transit'] },
            { id: 'api', text: 'A aplicação chamando o banco de dados pela rede', bin: 'transit', explanation: 'A conexão leva os dados de um lado para o outro.', concepts: ['sec.at-rest-in-transit'] },
          ],
        },
        {
          id: 'sec.f01.m1.a2',
          kind: 'classify',
          title: 'Três tipos de chave',
          prompt: 'Classifique cada descrição pelo tipo de chave do KMS.',
          concepts: [{ id: 'kms.key-types' }],
          xp: 50,
          difficulty: 2,
          explanation: ['Só a chave do cliente tem key policy escrita por você. A gerenciada pela AWS aparece na conta com alias aws/serviço. A da AWS nem aparece.'],
          bins: [
            { id: 'customer', label: 'Gerenciada pelo cliente' },
            { id: 'managed', label: 'Gerenciada pela AWS' },
            { id: 'owned', label: 'Da AWS (AWS owned)' },
          ],
          items: [
            { id: 'policy', text: 'Você escreve a key policy e agenda a exclusão', bin: 'customer', explanation: 'Controle total é da chave do cliente.', concepts: ['kms.key-types'] },
            { id: 'alias', text: 'Aparece na conta com o alias aws/ebs e gira todo ano sozinha', bin: 'managed', explanation: 'É a chave gerenciada pela AWS.', concepts: ['kms.key-types'] },
            { id: 'invisible', text: 'Não aparece na sua conta e não tem custo nenhum', bin: 'owned', explanation: 'Fica numa conta do serviço.', concepts: ['kms.key-types'] },
            { id: 'monthly', text: 'Tem custo mensal enquanto existir', bin: 'customer', explanation: 'A chave do cliente é cobrada por mês.', concepts: ['kms.key-types'] },
          ],
        },
        {
          id: 'sec.f01.m1.a3',
          kind: 'decision',
          title: 'O snapshot para a outra conta',
          prompt: 'O banco precisa compartilhar snapshots cifrados com a conta de recuperação de desastres. Os snapshots hoje usam a chave `aws/rds`. O que fazer?',
          concepts: [{ id: 'kms.key-types' }],
          xp: 50,
          difficulty: 2,
          explanation: ['Recursos cifrados com uma chave gerenciada pela AWS não podem ser compartilhados com outras contas. Com uma chave do cliente, a key policy pode dar acesso à outra conta.'],
          options: [
            { id: 'a', text: 'Usar uma chave gerenciada pelo cliente, com a key policy liberando a conta de recuperação', correct: true, consequence: 'A outra conta consegue usar a chave e restaurar o snapshot.' },
            { id: 'b', text: 'Manter a aws/rds e compartilhar o snapshot assim mesmo', correct: false, consequence: 'A chave gerenciada pela AWS só serve a principais da própria conta.' },
            { id: 'c', text: 'Tirar a criptografia dos snapshots', correct: false, consequence: 'Resolve o compartilhamento expondo os dados.' },
          ],
        },
        {
          id: 'sec.f01.m1.a4',
          kind: 'decision',
          title: 'Quem usou a chave',
          prompt: 'A auditoria quer saber quem decifrou extratos com a chave do KMS na semana passada. Onde olhar?',
          concepts: [{ id: 'kms.what' }],
          xp: 40,
          difficulty: 1,
          explanation: ['Cada uso de uma chave gerenciada pelo cliente fica registrado no CloudTrail, com quem pediu, qual operação e quando.'],
          options: [
            { id: 'a', text: 'Nos registros do CloudTrail das operações do KMS', correct: true, consequence: 'Cada Decrypt aparece com a role, o horário e a chave.' },
            { id: 'b', text: 'No próprio arquivo cifrado', correct: false, consequence: 'O arquivo não guarda quem o leu.' },
            { id: 'c', text: 'Não há como saber', correct: false, consequence: 'O uso das chaves do cliente é auditável.' },
          ],
        },
      ],
      debrief: { takeaways: ['Repouso: KMS. Trânsito: TLS.', 'Chave do cliente: controle total e custo mensal.', 'Gerenciada pela AWS: não serve para compartilhar com outra conta.'] },
    },
    // -----------------------------------------------------------------------
    {
      id: 'sec.f01.m2',
      title: 'O arquivo grande demais',
      type: 'mission',
      summary: 'O limite do Encrypt, a criptografia em envelope, chaves simétricas e assimétricas e o alias.',
      briefing: {
        company: 'Banco Digital Ponte',
        role: 'Você revisa o código que cifra os extratos em PDF.',
        situation: 'Um desenvolvedor tentou mandar cada PDF de 2 MB para o Encrypt do KMS e recebeu erro. Outro sugeriu cifrar tudo com uma chave assimétrica "porque é mais segura".',
        objective: 'Cifrar arquivos grandes do jeito certo e escolher o tipo de chave.',
        successCriteria: ['Ordenar a criptografia em envelope', 'Saber quando a chave é assimétrica', 'Usar o alias'],
      },
      intel: [
        { conceptId: 'kms.envelope', body: ['O `Encrypt` aceita até **4.096 bytes**. Para mais, o `GenerateDataKey` devolve uma chave de dados aberta e uma cifrada: a aberta cifra o arquivo e é descartada; a cifrada fica junto do arquivo.'] },
        { conceptId: 'kms.symmetric-asymmetric', body: ['**Simétrica**: um segredo só, que nunca sai do KMS, padrão dos serviços. **Assimétrica**: a chave pública sai do KMS para quem cifra ou confere assinaturas fora da AWS.'] },
        { conceptId: 'kms.alias', body: ['O **alias** (`alias/extratos`) é o nome que a aplicação usa; ele pode passar a apontar para outra chave.'] },
      ],
      activities: [
        {
          id: 'sec.f01.m2.a1',
          kind: 'order',
          title: 'Cifrar um PDF de 2 MB',
          prompt: 'Ponha na ordem o que a aplicação faz para cifrar um extrato e, depois, para lê-lo.',
          concepts: [{ id: 'kms.envelope' }],
          xp: 50,
          difficulty: 2,
          explanation: ['A aplicação pede a chave de dados, cifra o arquivo com a cópia aberta, descarta essa cópia e guarda a cifrada. Para ler, pede ao KMS que decifre a chave de dados e decifra o arquivo.'],
          steps: [
            { id: 'gen', text: 'Pedir ao KMS uma chave de dados com GenerateDataKey', explanation: 'Volta uma cópia aberta e uma cifrada pela chave do KMS.' },
            { id: 'enc', text: 'Cifrar o PDF com a cópia aberta da chave de dados', explanation: 'A criptografia do arquivo acontece na aplicação.' },
            { id: 'drop', text: 'Descartar a cópia aberta e guardar a cifrada junto do PDF', explanation: 'Sem a cópia aberta, quem pegar o arquivo não lê nada.' },
            { id: 'dec', text: 'Para ler, pedir ao KMS que decifre a chave de dados', explanation: 'Só quem tem kms:Decrypt na chave consegue.' },
            { id: 'read', text: 'Decifrar o PDF com a chave de dados aberta', explanation: 'O KMS nunca viu o arquivo.' },
          ],
        },
        {
          id: 'sec.f01.m2.a2',
          kind: 'decision',
          title: 'Assimétrica para tudo?',
          prompt: 'Um parceiro, fora da AWS, precisa cifrar arquivos que só o banco vai abrir. O resto dos dados fica em serviços da AWS. Que chaves usar?',
          concepts: [{ id: 'kms.symmetric-asymmetric' }],
          xp: 50,
          difficulty: 2,
          explanation: ['O parceiro usa a chave pública de um par assimétrico, baixada do KMS; só a privada, dentro do KMS, decifra. Para os serviços da AWS, o padrão é a chave simétrica.'],
          options: [
            { id: 'a', text: 'Um par assimétrico para o parceiro, com a pública baixada por ele, e chaves simétricas para os serviços da AWS', correct: true, consequence: 'Cada caso com o tipo de chave que ele pede.' },
            { id: 'b', text: 'Chaves assimétricas para tudo, porque são mais seguras', correct: false, consequence: 'Os serviços da AWS usam chaves simétricas para cifrar dados em repouso.' },
            { id: 'c', text: 'Enviar ao parceiro a chave simétrica', correct: false, consequence: 'A chave simétrica não sai do KMS.' },
          ],
        },
        {
          id: 'sec.f01.m2.a3',
          kind: 'decision',
          title: 'Trocar de chave sem mudar o código',
          prompt: 'O banco vai criar uma chave nova para os extratos e não quer mudar o código das 12 aplicações que cifram com a chave atual. O que ajuda?',
          concepts: [{ id: 'kms.alias' }],
          xp: 40,
          difficulty: 1,
          explanation: ['Com as aplicações usando o alias, basta apontar o alias para a chave nova. As chaves antigas continuam existindo para decifrar o que foi cifrado antes.'],
          options: [
            { id: 'a', text: 'As aplicações usam `alias/extratos`; o alias passa a apontar para a chave nova', correct: true, consequence: 'Nenhuma linha de código muda.' },
            { id: 'b', text: 'Copiar o ID da chave nova em cada aplicação', correct: false, consequence: 'É exatamente a mudança que o alias evita.' },
          ],
        },
      ],
      debrief: { takeaways: ['Mais de 4.096 bytes: criptografia em envelope.', 'Assimétrica quando a chave pública precisa sair do KMS.', 'Aplicações usam o alias, não o ID.'] },
    },
    // -----------------------------------------------------------------------
    {
      id: 'sec.f01.m3',
      title: 'Administrar não é ler',
      type: 'mission',
      summary: 'O statement da conta, administradores e usuários da chave.',
      briefing: {
        company: 'Banco Digital Ponte',
        role: 'Você revisa a key policy da chave dos extratos.',
        situation: 'A equipe de plataforma tem AdministratorAccess em tudo. A auditoria quer saber se essa equipe consegue ler os extratos dos clientes.',
        objective: 'Prever o efeito da key policy em cada pedido.',
        successCriteria: ['Entender o statement da conta', 'Separar quem administra de quem usa'],
      },
      intel: [
        { conceptId: 'kms.key-policy', body: ['Diferente de outros recursos, a key policy **precisa citar** quem pode usar a chave. Política IAM sozinha não basta.'] },
        { conceptId: 'kms.admin-vs-user', body: ['O statement da **conta** (`:root`) habilita as políticas IAM. **Administradores** gerenciam a chave sem decifrar; **usuários** cifram e decifram.'] },
      ],
      activities: [
        {
          id: 'sec.f01.m3.a1',
          kind: 'predict',
          title: 'Só os administradores',
          prompt: 'A key policy só tem o statement dos administradores (role seguranca-chaves). A role admin-plataforma, com AdministratorAccess no IAM, pede Decrypt. O que acontece?',
          concepts: [{ id: 'kms.key-policy' }, { id: 'kms.admin-vs-user', weight: 0.5 }],
          xp: 50,
          difficulty: 2,
          explanation: ['Sem o statement da conta, a política IAM não tem efeito sobre a chave, e a key policy não cita a admin-plataforma.'],
          spec: { sim: 'kms', world: SO_ADMINS, request: { principalId: 'admin', action: 'kms:Decrypt' } },
          options: [
            { id: 'a', text: 'Negado', outcome: 'deny' },
            { id: 'b', text: 'Permitido, pelo AdministratorAccess', outcome: 'allow' },
          ],
        },
        {
          id: 'sec.f01.m3.a2',
          kind: 'predict',
          title: 'Com o statement da conta',
          prompt: 'Agora a key policy tem também o statement da conta (`:root` com `kms:*`). A mesma role admin-plataforma pede Decrypt.',
          concepts: [{ id: 'kms.admin-vs-user' }],
          xp: 50,
          difficulty: 3,
          explanation: ['O statement da conta habilita as políticas IAM, e o AdministratorAccess permite kms:Decrypt. Por isso muitas empresas tiram esse statement das chaves sensíveis ou limitam o IAM.'],
          spec: { sim: 'kms', world: COM_CONTA, request: { principalId: 'admin', action: 'kms:Decrypt' } },
          options: [
            { id: 'a', text: 'Permitido', outcome: 'allow' },
            { id: 'b', text: 'Negado, porque a key policy não cita a role', outcome: 'deny' },
          ],
        },
        {
          id: 'sec.f01.m3.a3',
          kind: 'predict',
          title: 'O administrador lê?',
          prompt: 'Na key policy só com os administradores, a role seguranca-chaves pede Decrypt.',
          concepts: [{ id: 'kms.admin-vs-user' }],
          xp: 40,
          difficulty: 2,
          explanation: ['As ações de administração não incluem as operações criptográficas.'],
          spec: { sim: 'kms', world: SO_ADMINS, request: { principalId: 'seg', action: 'kms:Decrypt' } },
          options: [
            { id: 'a', text: 'Negado', outcome: 'deny' },
            { id: 'b', text: 'Permitido', outcome: 'allow' },
          ],
        },
      ],
      debrief: { takeaways: ['A key policy precisa citar o principal ou a conta.', 'Statement da conta: as políticas IAM passam a valer.', 'Administrar a chave não dá acesso aos dados.'] },
    },
    // -----------------------------------------------------------------------
    {
      id: 'sec.f01.boss',
      title: 'Quem usa a chave',
      type: 'boss',
      summary: 'Uma key policy em que cada equipe faz só o que precisa.',
      briefing: {
        company: 'Banco Digital Ponte',
        role: 'Você fecha a key policy da chave dos extratos.',
        situation: 'A aplicação cifra e decifra extratos, a segurança administra a chave, a plataforma tem AdministratorAccess e um relatório mensal precisa ler os extratos uma vez por mês.',
        objective: 'Montar a key policy e os grants para que cada pedido tenha o resultado certo.',
        successCriteria: ['Todos os pedidos com o resultado esperado', 'Ninguém além da aplicação e do relatório lê os extratos'],
      },
      intel: [
        { conceptId: 'kms.admin-vs-user', body: ['Separe os statements: um para administrar, outro para usar. Cuidado com o statement da conta.'] },
        { conceptId: 'kms.grants', body: ['O **grant** dá operações específicas a um principal, sem mudar a key policy. Ele só permite.'] },
      ],
      activities: [
        {
          id: 'sec.f01.boss.a1',
          kind: 'lab',
          lab: 'kms',
          title: 'A key policy dos extratos',
          prompt: 'Marque os statements e grants. A tabela mostra, ao vivo, o resultado de cada pedido.',
          concepts: [{ id: 'kms.admin-vs-user' }, { id: 'kms.key-policy' }, { id: 'kms.grants' }],
          xp: 200,
          difficulty: 3,
          hints: ['O statement da conta faz o AdministratorAccess valer para a chave.', 'Dar kms:* aos administradores deixa que eles decifrem.'],
          explanation: [
            'Solução: o statement dos administradores com as ações de administração, o statement dos usuários para a extratos-app e o grant só de Decrypt para o relatório.',
            'O statement da conta liberaria a plataforma; o kms:* para a segurança e o grant amplo dariam mais do que o necessário.',
          ],
          config: PONTE_KMS,
        },
      ],
      debrief: { takeaways: ['Key policy mínima: administradores, usuários e nada mais.', 'Grant para o acesso pontual, só com as operações necessárias.', 'O statement da conta entrega a chave ao IAM.'] },
    },
  ],
}
