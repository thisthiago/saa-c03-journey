/** Fase 5 — Versionamento e recuperação (empresa fictícia: Traço Arquitetura). */
import type { PhaseDef } from '../../../../../engine/types'
import type { VOp } from '../../../../../simulators/versioning/model'

const COMPANY = 'Traço Arquitetura'
const ROLE = 'Você cuida dos dados de projetos do escritório.'
const BUCKET = 'traco-projetos'

const ENABLE: VOp = { op: 'set-versioning', state: 'Enabled' }
const SUSPEND: VOp = { op: 'set-versioning', state: 'Suspended' }
const put = (key: string, content: string, sizeMB?: number): VOp => ({ op: 'put', key, content, sizeMB })
const del = (key: string): VOp => ({ op: 'delete', key })

// --- Missão 1 ------------------------------------------------------------------
const PLANTA: VOp[] = [ENABLE, put('planta.dwg', 'planta v1'), put('planta.dwg', 'planta v2'), del('planta.dwg')]

// --- Missão 2: recuperação --------------------------------------------------------
const RECOVERY_SETUP = [
  { op: ENABLE, when: 'jan.' },
  { op: put('contrato.pdf', 'contrato assinado'), when: '02/10' },
  { op: put('orcamento.xlsx', 'orçamento aprovado'), when: '03/10' },
  { op: put('orcamento.xlsx', 'orçamento com erro'), when: '15/10 09:12' },
  { op: del('contrato.pdf'), when: '15/10 09:14' },
]

// --- Chefe: o período suspenso -------------------------------------------------------
const SUSPENDED_SETUP = [
  { op: ENABLE, when: 'mar.' },
  { op: put('projeto.dwg', 'projeto rev A'), when: '01/09' },
  { op: put('projeto.dwg', 'projeto rev B'), when: '10/09' },
  { op: put('orcamento.xlsx', 'orçamento final'), when: '12/09' },
  { op: SUSPEND, when: '20/09' },
  { op: put('projeto.dwg', 'projeto rev C'), when: '25/09' },
  { op: put('projeto.dwg', 'projeto rev D'), when: '02/10' },
  { op: del('projeto.dwg'), when: '08/10' },
  { op: del('orcamento.xlsx'), when: '08/10' },
]

const OPTIONS_GET = (content: string) => [
  { id: 'o1', text: `200 OK, com "${content}"`, outcome: `200:${content}` },
  { id: 'o2', text: '404 Not Found', outcome: '404' },
  { id: 'o3', text: '405 Method Not Allowed', outcome: '405' },
]

export const F05: PhaseDef = {
  id: 's3x.f05',
  order: 5,
  title: 'Versionamento e recuperação',
  subtitle: 'Version IDs e delete markers',
  summary: 'Recupere arquivos excluídos e sobrescritos sem perder o fio da linha do tempo.',
  glyph: 'history',
  color: '#6cb6ff',
  requires: ['s3x.f01'],
  concepts: [
    's3.versioning',
    's3.version-id',
    's3.delete-marker',
    's3.permanent-delete',
    's3.restore-version',
    's3.versioning-suspended',
    's3.versioning-cost',
    's3.mfa-delete',
    's3.object-lock',
    'backup.independent-copy',
  ],
  availability: 'available',
  estimatedMinutes: 40,
  map: { x: 300, y: 360 },
  simplifications: [
    'Version IDs são gerados de forma determinística; na AWS são cadeias opacas e aleatórias.',
    'As operações são feitas pelo dono do bucket, sem avaliação de permissões.',
    'Object Lock aparece de forma conceitual, sem simular modos, datas e legal hold no laboratório.',
  ],
  missions: [
    // -----------------------------------------------------------------------
    {
      id: 's3x.f05.m1',
      title: 'Cada gravação conta uma história',
      type: 'mission',
      summary: 'Prever o que o versionamento guarda e proteger um arquivo antes de sobrescrevê-lo.',
      briefing: {
        company: COMPANY,
        role: ROLE,
        situation: `O escritório guarda plantas e memoriais no bucket \`${BUCKET}\`. Semana passada, alguém sobrescreveu um memorial e a versão anterior se perdeu: o bucket **não tinha versionamento**.`,
        objective: 'Entender como o versionamento registra cada gravação e ligá-lo antes da próxima alteração.',
        successCriteria: ['Prever versões, 404 e 405', 'Atualizar o memorial sem perder a versão anterior'],
      },
      intel: [
        {
          conceptId: 's3.versioning',
          body: ['Com **versionamento**, sobrescrever cria uma **nova versão**; a anterior continua guardada. Um bucket começa **sem versionamento**; depois de habilitado, só pode ser **suspenso** — nunca volta ao estado inicial.'],
        },
        {
          conceptId: 's3.version-id',
          body: ['Cada versão tem um **version ID**. Objetos gravados antes de habilitar o versionamento ficam com o ID **null**.'],
        },
        {
          conceptId: 's3.delete-marker',
          body: ['DELETE **sem versionId** num bucket versionado insere um **delete marker**: GET passa a dar **404** e a key some da listagem. GET com o versionId do próprio marker dá **405**. Os dados continuam lá.'],
        },
      ],
      activities: [
        {
          id: 's3x.f05.m1.a1',
          kind: 'predict',
          title: 'Quantas versões?',
          prompt: 'Com versionamento habilitado: PUT `planta.dwg` ("planta v1"), PUT de novo ("planta v2") e DELETE simples. Quantas versões **ListObjectVersions** mostra para `planta.dwg`?',
          concepts: [{ id: 's3.versioning' }, { id: 's3.delete-marker' }],
          xp: 30,
          difficulty: 1,
          explanation: ['Duas versões com dados e um delete marker — que também é uma versão. Nada foi apagado.'],
          spec: { sim: 'versioning', setup: PLANTA, query: { type: 'versions', key: 'planta.dwg' } },
          options: [
            { id: 'o1', text: '1', outcome: '1' },
            { id: 'o2', text: '2', outcome: '2' },
            { id: 'o3', text: '3', outcome: '3' },
            { id: 'o4', text: 'Nenhuma: o DELETE apagou tudo', outcome: '0' },
          ],
        },
        {
          id: 's3x.f05.m1.a2',
          kind: 'predict',
          title: 'GET depois do DELETE',
          prompt: 'Num bucket com versionamento habilitado: PUT `planta.dwg` ("planta v1"), PUT de novo ("planta v2") e DELETE simples, sem versionId. Depois disso, um GET **sem versionId** em `planta.dwg`. O que o S3 responde?',
          concepts: [{ id: 's3.delete-marker' }],
          xp: 30,
          difficulty: 1,
          explanation: ['A versão atual é um delete marker: o S3 responde 404, com o cabeçalho x-amz-delete-marker: true.'],
          spec: { sim: 'versioning', setup: PLANTA, query: { type: 'get', key: 'planta.dwg' } },
          options: OPTIONS_GET('planta v2'),
        },
        {
          id: 's3x.f05.m1.a3',
          kind: 'predict',
          title: 'GET do próprio marker',
          prompt: 'Num bucket com versionamento habilitado: PUT `planta.dwg` ("planta v1"), PUT de novo ("planta v2") e DELETE simples, que criou um delete marker. Agora um GET em `planta.dwg` informa o **versionId do delete marker**. O que o S3 responde?',
          concepts: [{ id: 's3.delete-marker' }],
          xp: 30,
          difficulty: 2,
          explanation: ['Um delete marker não tem dados. Pedi-lo pelo versionId retorna 405 Method Not Allowed.'],
          spec: { sim: 'versioning', setup: PLANTA, query: { type: 'get', key: 'planta.dwg', versionIndex: 0 } },
          options: OPTIONS_GET('planta v2'),
        },
        {
          id: 's3x.f05.m1.a4',
          kind: 'lab',
          lab: 'versioning',
          title: 'Atualizar o memorial com segurança',
          prompt: 'O memorial descritivo precisa ser atualizado para "memorial v2". Faça isso **sem perder** a versão atual.',
          concepts: [{ id: 's3.versioning' }, { id: 's3.version-id' }],
          xp: 70,
          difficulty: 1,
          hints: ['A ordem importa: sem versionamento, um PUT substitui o conteúdo de vez.'],
          explanation: ['Habilite o versionamento **antes** do PUT. O memorial antigo fica como versão null não atual, e o novo recebe um version ID.'],
          config: {
            bucketName: BUCKET,
            setup: [{ op: put('memorial.pdf', 'memorial v1'), when: 'ontem' }],
            allowedOps: ['set-versioning', 'put', 'delete'],
            keys: ['memorial.pdf'],
            contents: ['memorial v2'],
            goals: [
              { type: 'state', state: 'Enabled', why: 'Sem versionamento, a próxima sobrescrita volta a apagar o histórico.', concepts: ['s3.versioning'] },
              { type: 'current', key: 'memorial.pdf', content: 'memorial v2', why: 'O memorial atualizado precisa ser a versão atual.', concepts: ['s3.versioning'] },
              { type: 'preserved', key: 'memorial.pdf', content: 'memorial v1', why: 'A versão anterior precisa continuar recuperável.', concepts: ['s3.version-id'] },
            ],
            solution: { ops: [ENABLE, put('memorial.pdf', 'memorial v2')] },
          },
        },
      ],
      debrief: {
        takeaways: [
          'Versionamento guarda cada gravação; DELETE simples só insere um delete marker.',
          'Um GET sem versionId devolve 404 quando a versão atual é um delete marker; um GET com o versionId do próprio marker devolve 405.',
          'Habilite o versionamento **antes** de precisar dele: o que foi sobrescrito antes não volta.',
        ],
      },
    },
    // -----------------------------------------------------------------------
    {
      id: 's3x.f05.m2',
      title: 'Data Recovery',
      type: 'mission',
      summary: 'Recuperar um contrato excluído e um orçamento sobrescrito — por dois caminhos possíveis.',
      briefing: {
        company: COMPANY,
        role: ROLE,
        situation: 'Na manhã de 15/10, um estagiário sobrescreveu o orçamento aprovado com uma versão errada e, dois minutos depois, apagou o contrato assinado. O cliente chega ao meio-dia.',
        objective: 'Deixar o contrato e o orçamento aprovado como versões atuais, sem perder nada.',
        successCriteria: ['Contrato assinado de volta', 'Orçamento aprovado de volta', 'Nenhuma versão boa perdida'],
      },
      intel: [
        {
          conceptId: 's3.restore-version',
          body: ['Duas formas de restaurar: **remover o delete marker** (a versão anterior volta a ser a atual) ou **copiar** a versão boa sobre a mesma key (nova versão atual, histórico preservado).'],
        },
        {
          conceptId: 's3.permanent-delete',
          body: ['DELETE **com versionId** apaga aquela versão **para sempre**. Use-o com cuidado: apagar a versão errada não tem volta.'],
        },
      ],
      activities: [
        {
          id: 's3x.f05.m2.a1',
          kind: 'lab',
          lab: 'versioning',
          title: 'Recuperação antes do meio-dia',
          prompt: 'Use a linha do tempo de versões para restaurar os dois arquivos. Há mais de uma solução válida.',
          concepts: [{ id: 's3.restore-version' }, { id: 's3.delete-marker' }, { id: 's3.permanent-delete' }],
          xp: 90,
          difficulty: 2,
          hints: ['O contrato não foi apagado: há um delete marker por cima dele.', 'Para o orçamento, copie a versão aprovada como atual (ou exclua a versão errada — mas isso apaga a evidência).'],
          explanation: [
            'Contrato: excluir o delete marker (DELETE com o versionId do marker) devolve o contrato assinado. Copiar a versão assinada também funciona.',
            'Orçamento: copiar a versão aprovada cria uma nova versão atual e preserva o histórico. Excluir a versão errada também restaura, mas apaga a evidência do erro.',
          ],
          config: {
            bucketName: BUCKET,
            setup: RECOVERY_SETUP,
            allowedOps: ['put', 'delete', 'delete-version', 'copy-version'],
            keys: ['contrato.pdf', 'orcamento.xlsx'],
            goals: [
              { type: 'current', key: 'contrato.pdf', content: 'contrato assinado', why: 'O cliente precisa do contrato assinado.', concepts: ['s3.delete-marker'] },
              { type: 'current', key: 'orcamento.xlsx', content: 'orçamento aprovado', why: 'O orçamento aprovado precisa ser a versão atual.', concepts: ['s3.restore-version'] },
              { type: 'preserved', key: 'orcamento.xlsx', content: 'orçamento aprovado', why: 'A versão aprovada não pode ser apagada no processo.', concepts: ['s3.permanent-delete'] },
              { type: 'preserved', key: 'contrato.pdf', content: 'contrato assinado', why: 'O contrato assinado não pode ser apagado no processo.', concepts: ['s3.permanent-delete'] },
            ],
            solution: (b) => ({
              ops: [
                { op: 'delete-version', key: 'contrato.pdf', versionId: b.objects['contrato.pdf'][0].versionId },
                { op: 'copy-version', key: 'orcamento.xlsx', versionId: b.objects['orcamento.xlsx'][1].versionId },
              ],
            }),
          },
        },
        {
          id: 's3x.f05.m2.a2',
          kind: 'decision',
          title: 'Qual caminho para a auditoria?',
          prompt: 'O escritório é auditado: é preciso mostrar **o que** foi alterado, **quando** e como foi corrigido. Como restaurar o orçamento?',
          concepts: [{ id: 's3.restore-version' }, { id: 's3.permanent-delete' }],
          xp: 30,
          difficulty: 2,
          explanation: ['Copiar a versão boa sobre a key restaura o arquivo e mantém a versão errada como registro. Excluir a versão errada restaura, mas apaga a evidência.'],
          options: [
            { id: 'a', text: 'Copiar a versão aprovada como nova versão atual.', correct: true, consequence: 'O histórico mostra: versão aprovada → versão com erro → versão aprovada restaurada. A auditoria vê tudo.', impacts: { seguranca: 1 } },
            { id: 'b', text: 'Excluir permanentemente a versão com erro.', correct: false, consequence: 'O arquivo volta, mas o erro some do histórico. A auditoria não consegue reconstruir o que aconteceu.' },
            { id: 'c', text: 'Baixar a versão aprovada e reenviar com outro nome.', correct: false, consequence: 'A key original continua com a versão errada, e os sistemas que a usam seguem lendo o erro.' },
          ],
        },
      ],
      debrief: {
        takeaways: [
          'Excluir o delete marker restaura a versão anterior; copiar a versão boa também — e preserva o histórico.',
          'DELETE com versionId é irreversível.',
          'Em ambientes auditados, prefira restaurar copiando.',
        ],
      },
    },
    // -----------------------------------------------------------------------
    {
      id: 's3x.f05.m3',
      title: 'Versionamento não é backup',
      type: 'mission',
      summary: 'Separar o que o versionamento resolve do que exige MFA delete, Object Lock ou uma cópia independente — e quanto ele custa.',
      briefing: {
        company: COMPANY,
        role: ROLE,
        situation: 'A diretoria quer saber se, com o versionamento ligado, o escritório "já tem backup". E o financeiro reclama que a conta do bucket cresceu desde que ele foi ligado.',
        objective: 'Explicar os limites do versionamento e o que complementá-lo.',
        successCriteria: ['Classificar ameaças', 'Associar proteções', 'Estimar o custo das versões', 'Decidir sobre o MFA delete'],
      },
      intel: [
        {
          conceptId: 's3.mfa-delete',
          body: ['**MFA delete** exige código MFA para excluir versões e mudar o estado do versionamento. Só o **usuário raiz** habilita, e só pela **CLI/API**. Não funciona junto com lifecycle.'],
        },
        {
          conceptId: 's3.object-lock',
          body: ['**Object Lock** (WORM) impede excluir ou sobrescrever versões: **compliance** (ninguém, nem o root), **governance** (só com permissão especial) ou **legal hold** (sem data). Exige versionamento.'],
        },
        {
          conceptId: 'backup.independent-copy',
          body: ['Versionamento vive **no mesmo bucket**. Credenciais comprometidas ou perda da Região exigem uma **cópia independente**: outra conta, outra Região ou AWS Backup.'],
        },
        {
          conceptId: 's3.versioning-cost',
          body: ['Cada versão é o **objeto inteiro** e é cobrada como tal. Para conter o custo, expire versões não atuais com **lifecycle**.'],
        },
      ],
      activities: [
        {
          id: 's3x.f05.m3.a1',
          kind: 'classify',
          title: 'O versionamento basta?',
          prompt: 'Para cada ameaça, o versionamento sozinho resolve ou é preciso outra proteção?',
          concepts: [{ id: 'backup.independent-copy' }, { id: 's3.versioning' }],
          xp: 50,
          difficulty: 2,
          explanation: ['Versionamento cobre erros comuns dentro do bucket. Quem pode apagar versões, a perda da Região e exigências WORM precisam de outras camadas.'],
          bins: [
            { id: 'ok', label: 'O versionamento resolve' },
            { id: 'more', label: 'Precisa de outra proteção' },
          ],
          items: [
            { id: 't1', text: 'Um usuário apaga um arquivo por engano', bin: 'ok', explanation: 'O DELETE simples só insere um delete marker.', concepts: ['s3.delete-marker'] },
            { id: 't2', text: 'Uma aplicação sobrescreve arquivos com dados corrompidos', bin: 'ok', explanation: 'As versões anteriores continuam guardadas.', concepts: ['s3.versioning'] },
            { id: 't3', text: 'Credenciais de administrador vazam e o invasor apaga todas as versões', bin: 'more', explanation: 'Quem pode excluir versões apaga tudo. Object Lock, MFA delete ou cópia em outra conta.', concepts: ['backup.independent-copy'] },
            { id: 't4', text: 'Indisponibilidade prolongada da Região', bin: 'more', explanation: 'As versões estão na mesma Região. É preciso cópia em outra Região.', concepts: ['backup.independent-copy'] },
            { id: 't5', text: 'Norma exige que registros não possam ser alterados por 5 anos', bin: 'more', explanation: 'Retenção imutável é Object Lock (modo compliance).', concepts: ['s3.object-lock'] },
            { id: 't6', text: 'Alguém suspende o versionamento e passa a sobrescrever arquivos', bin: 'more', explanation: 'Na suspensão, sobrescritas da versão null se perdem. MFA delete exige código para mudar o estado.', concepts: ['s3.mfa-delete'] },
          ],
        },
        {
          id: 's3x.f05.m3.a2',
          kind: 'match',
          title: 'Camadas de proteção',
          prompt: 'Associe cada proteção ao que ela garante.',
          concepts: [{ id: 's3.mfa-delete' }, { id: 's3.object-lock' }, { id: 'backup.independent-copy' }],
          xp: 50,
          difficulty: 2,
          explanation: ['Cada camada fecha uma brecha diferente: autenticação extra, imutabilidade com ou sem exceção, retenção sem prazo e cópia fora do alcance da conta de origem.'],
          leftLabel: 'Proteções',
          rightLabel: 'Garantias',
          pairs: [
            { id: 'mfa', left: 'MFA delete', right: 'Excluir versões ou mudar o versionamento exige código MFA do usuário raiz', explanation: 'Fricção extra contra exclusões e suspensões.', concepts: ['s3.mfa-delete'] },
            { id: 'comp', left: 'Object Lock — compliance', right: 'Ninguém, nem o usuário raiz, exclui a versão antes da data de retenção', explanation: 'Retenção imutável de verdade.', concepts: ['s3.object-lock'] },
            { id: 'gov', left: 'Object Lock — governance', right: 'Só quem tem s3:BypassGovernanceRetention pode excluir antes da data', explanation: 'Proteção com exceção controlada.', concepts: ['s3.object-lock'] },
            { id: 'hold', left: 'Legal hold', right: 'Proteção sem data de expiração, até ser removida', explanation: 'Útil durante processos judiciais ou auditorias.', concepts: ['s3.object-lock'] },
            { id: 'copy', left: 'Cópia em outra conta', right: 'Os dados sobrevivem ao comprometimento da conta de origem', explanation: 'O invasor da conta de origem não alcança a cópia.', concepts: ['backup.independent-copy'] },
          ],
        },
        {
          id: 's3x.f05.m3.a3',
          kind: 'estimate',
          title: 'O arquivo que cresce sozinho',
          prompt: 'Um modelo 3D de **2 GB** é regravado **inteiro** uma vez por dia, com versionamento habilitado e **sem** regras de lifecycle. Depois de **30 regravações**, quanto armazenamento esse arquivo ocupa?',
          concepts: [{ id: 's3.versioning-cost' }],
          xp: 40,
          difficulty: 2,
          scenario: ['Conte a versão original mais as 30 regravações.'],
          explanation: ['Cada versão é o objeto inteiro: 31 versões × 2 GB = 62 GB. Uma regra de expiração de versões não atuais evitaria o acúmulo.'],
          unit: 'GB',
          min: 0,
          max: 200,
          step: 1,
          answer: 62,
          tolerance: 0.05,
        },
        {
          id: 's3x.f05.m3.a4',
          kind: 'decision',
          title: 'Ligando o MFA delete',
          prompt: 'A diretoria pediu MFA delete no bucket. O administrador da equipe propõe ativá-lo pelo console, com o usuário IAM dele, e manter as regras de lifecycle atuais. O que você responde?',
          concepts: [{ id: 's3.mfa-delete' }],
          xp: 30,
          difficulty: 3,
          explanation: ['Só o usuário raiz habilita o MFA delete, e só pela CLI ou API. E o MFA delete não pode ser usado com configurações de lifecycle — é preciso escolher.'],
          options: [
            { id: 'a', text: 'Só o usuário raiz, pela CLI ou API, pode habilitar — e o MFA delete não convive com lifecycle; é preciso decidir entre os dois.', correct: true, consequence: 'A decisão fica explícita. Se a retenção imutável for o objetivo, o Object Lock pode ser a melhor escolha.', impacts: { seguranca: 1 } },
            { id: 'b', text: 'Pode ativar pelo console com o usuário IAM administrador.', correct: false, consequence: 'Não funciona: o console não oferece a opção, e só o usuário raiz pode habilitar.' },
            { id: 'c', text: 'Ative e mantenha o lifecycle; os dois funcionam juntos.', correct: false, consequence: 'O MFA delete não pode ser usado com configurações de lifecycle.' },
          ],
        },
      ],
      debrief: {
        takeaways: [
          'Versionamento cobre erros no bucket; contra quem apaga versões ou perda da Região, use Object Lock, MFA delete e cópias independentes.',
          'Cada versão é cobrada como objeto inteiro: expire versões não atuais com lifecycle.',
          'O MFA delete só pode ser habilitado pelo usuário raiz, pela CLI ou pela API, e não funciona junto com lifecycle.',
        ],
      },
    },
    // -----------------------------------------------------------------------
    {
      id: 's3x.f05.boss',
      title: 'Chefe: o período suspenso',
      type: 'boss',
      summary: 'Descobrir o que ainda é recuperável depois de semanas com o versionamento suspenso — e recuperar.',
      briefing: {
        company: COMPANY,
        role: ROLE,
        situation: 'Em 20/09, para "economizar", alguém **suspendeu** o versionamento. Nas semanas seguintes, o projeto principal foi regravado duas vezes e, em 08/10, o projeto e o orçamento foram apagados. Hoje o cliente quer a última revisão possível.',
        objective: 'Saber o que se perdeu, recuperar o que for possível e evitar que se repita.',
        successCriteria: ['Classificar o que é recuperável', 'Prever a resposta do S3', 'Recuperar e reabilitar o versionamento', 'Escolher a prevenção'],
      },
      intel: [
        {
          conceptId: 's3.versioning-suspended',
          body: ['Com versionamento **suspenso**, novas gravações usam o version ID **null**. Cada PUT **substitui** a versão null anterior, e um DELETE **remove** a versão null e põe um delete marker null no lugar. Versões com ID, de antes da suspensão, continuam guardadas.'],
        },
      ],
      activities: [
        {
          id: 's3x.f05.boss.a1',
          kind: 'classify',
          title: 'O que sobreviveu?',
          prompt:
            'Histórico: habilitado → PUT projeto rev A (01/09) → PUT projeto rev B (10/09) → PUT orçamento final (12/09) → **suspenso (20/09)** → PUT projeto rev C (25/09) → PUT projeto rev D (02/10) → DELETE projeto (08/10) → DELETE orçamento (08/10). Classifique cada conteúdo.',
          concepts: [{ id: 's3.versioning-suspended' }],
          xp: 60,
          difficulty: 3,
          explanation: [
            'Rev A, rev B e o orçamento final têm version IDs (gravados com versionamento habilitado): continuam guardados.',
            'Rev C virou a versão null e foi substituída pela rev D (também null). O DELETE de 08/10 removeu a rev D e pôs um delete marker null no lugar.',
          ],
          bins: [
            { id: 'ok', label: 'Recuperável' },
            { id: 'lost', label: 'Perdido' },
          ],
          items: [
            { id: 'i1', text: 'projeto rev A', bin: 'ok', explanation: 'Versão com ID, de antes da suspensão.', concepts: ['s3.versioning-suspended'] },
            { id: 'i2', text: 'projeto rev B', bin: 'ok', explanation: 'Versão com ID, de antes da suspensão.', concepts: ['s3.versioning-suspended'] },
            { id: 'i3', text: 'projeto rev C', bin: 'lost', explanation: 'Era a versão null e foi substituída pela rev D.', concepts: ['s3.versioning-suspended'] },
            { id: 'i4', text: 'projeto rev D', bin: 'lost', explanation: 'Versão null removida pelo DELETE com versionamento suspenso.', concepts: ['s3.versioning-suspended'] },
            { id: 'i5', text: 'orçamento final', bin: 'ok', explanation: 'Versão com ID; o DELETE só pôs um delete marker null por cima.', concepts: ['s3.delete-marker'] },
          ],
        },
        {
          id: 's3x.f05.boss.a2',
          kind: 'predict',
          title: 'O que o cliente vê hoje',
          prompt: 'Histórico de `projeto.dwg`: PUT rev A e PUT rev B com versionamento habilitado; versionamento **suspenso** em 20/09; PUT rev C, PUT rev D e, em 08/10, um DELETE simples. Hoje, um GET **sem versionId** em `projeto.dwg` retorna o quê?',
          concepts: [{ id: 's3.delete-marker' }, { id: 's3.versioning-suspended' }],
          xp: 30,
          difficulty: 2,
          explanation: ['A versão atual é o delete marker null criado em 08/10: 404.'],
          spec: { sim: 'versioning', setup: SUSPENDED_SETUP.map((s) => s.op), query: { type: 'get', key: 'projeto.dwg' } },
          options: OPTIONS_GET('projeto rev B'),
        },
        {
          id: 's3x.f05.boss.a3',
          kind: 'lab',
          lab: 'versioning',
          title: 'Recuperar o que dá',
          prompt: 'Devolva ao cliente a revisão mais recente que ainda existe do projeto, recupere o orçamento e deixe o bucket protegido de novo.',
          concepts: [{ id: 's3.versioning-suspended' }, { id: 's3.restore-version' }, { id: 's3.versioning' }],
          xp: 110,
          difficulty: 3,
          hints: ['Compare a linha do tempo com o histórico: quais versões têm ID?', 'O delete marker null está por cima de versões com ID.'],
          explanation: [
            'Uma solução: reabilitar o versionamento e excluir os dois delete markers null — a rev B e o orçamento final voltam a ser as versões atuais.',
            'Copiar a rev B e o orçamento final como atuais também funciona. A rev C e a rev D não existem mais.',
          ],
          config: {
            bucketName: BUCKET,
            setup: SUSPENDED_SETUP,
            allowedOps: ['set-versioning', 'put', 'delete', 'delete-version', 'copy-version'],
            keys: ['projeto.dwg', 'orcamento.xlsx'],
            goals: [
              { type: 'current', key: 'projeto.dwg', content: 'projeto rev B', why: 'A rev B é a revisão mais recente que sobreviveu.', concepts: ['s3.versioning-suspended'] },
              { type: 'current', key: 'orcamento.xlsx', content: 'orçamento final', why: 'O orçamento ainda está guardado sob o delete marker.', concepts: ['s3.restore-version'] },
              { type: 'preserved', key: 'projeto.dwg', content: 'projeto rev A', why: 'Revisões antigas continuam sendo histórico do projeto.', concepts: ['s3.permanent-delete'] },
              { type: 'state', state: 'Enabled', why: 'Com o versionamento suspenso, a próxima sobrescrita volta a destruir dados.', concepts: ['s3.versioning'] },
            ],
            solution: (b) => ({
              ops: [
                ENABLE,
                { op: 'delete-version', key: 'projeto.dwg', versionId: b.objects['projeto.dwg'][0].versionId },
                { op: 'delete-version', key: 'orcamento.xlsx', versionId: b.objects['orcamento.xlsx'][0].versionId },
              ],
            }),
          },
        },
        {
          id: 's3x.f05.boss.a4',
          kind: 'decision',
          title: 'Economizar sem suspender',
          prompt: 'O motivo da suspensão foi o custo das versões antigas. Como reduzir esse custo sem repetir o incidente?',
          concepts: [{ id: 's3.versioning-cost' }, { id: 's3.versioning' }],
          xp: 40,
          difficulty: 2,
          explanation: ['Mantenha o versionamento e use lifecycle para expirar versões não atuais depois de um prazo (e, se quiser, manter as N mais recentes).'],
          options: [
            { id: 'a', text: 'Manter o versionamento habilitado e criar uma regra de lifecycle que expira versões não atuais após 30 dias.', correct: true, consequence: 'O histórico recente fica protegido e as versões antigas deixam de pesar na conta.', impacts: { custo: 1, durabilidade: 1 } },
            { id: 'b', text: 'Manter suspenso: o custo para de crescer.', correct: false, consequence: 'O custo cresce menos, mas qualquer sobrescrita ou exclusão volta a destruir dados.', impacts: { durabilidade: -2 } },
            { id: 'c', text: 'Desabilitar o versionamento de vez.', correct: false, consequence: 'Impossível: depois de habilitado, o bucket nunca volta ao estado "sem versionamento".' },
          ],
        },
      ],
      debrief: {
        takeaways: [
          'Suspender o versionamento não apaga versões antigas, mas torna sobrescritas e exclusões da versão null irreversíveis.',
          'Delete markers podem ser removidos; versões null substituídas, não.',
          'Para controlar custo, use lifecycle de versões não atuais — não a suspensão.',
        ],
      },
    },
  ],
}
