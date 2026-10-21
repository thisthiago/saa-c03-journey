/**
 * Fase 4 — Governança do data lake com o Lake Formation. Permissões
 * centralizadas, IAM e Lake Formation juntos, registro do local, filtros por
 * coluna, linha e célula, LF-Tags, configuração padrão e modo híbrido, e
 * compartilhamento entre contas.
 */
import type { PhaseDef } from '../../../../../engine/types'
import type { LakePermLabConfig } from '../../../../../simulators/lakeperm/lab'
import type { PermTable } from '../../../../../simulators/lakeperm/model'
import { META } from '../meta'

export const CREDITO: PermTable = {
  name: 'credito.contratos',
  columns: [
    { id: 'regiao', label: 'região', tags: { classificacao: 'publico' } },
    { id: 'agencia', label: 'agência', tags: { classificacao: 'publico' } },
    { id: 'produto', label: 'produto', tags: { classificacao: 'publico' } },
    { id: 'valor', label: 'valor', tags: { classificacao: 'interno' } },
    { id: 'nome', label: 'nome', tags: { classificacao: 'sensivel' } },
    { id: 'cpf', label: 'CPF', tags: { classificacao: 'sensivel' } },
  ],
  rows: [
    { regiao: 'Sul', agencia: 'Pelotas', produto: 'consignado', valor: '12.000', nome: 'Ana S.', cpf: '***.418.***-10' },
    { regiao: 'Sul', agencia: 'Joinville', produto: 'rural', valor: '80.000', nome: 'Bruno T.', cpf: '***.902.***-33' },
    { regiao: 'Sudeste', agencia: 'Campinas', produto: 'imobiliário', valor: '250.000', nome: 'Carla M.', cpf: '***.115.***-47' },
    { regiao: 'Norte', agencia: 'Belém', produto: 'consignado', valor: '9.000', nome: 'Diego R.', cpf: '***.660.***-81' },
    { regiao: 'Sul', agencia: 'Chapecó', produto: 'rural', valor: '60.000', nome: 'Elisa F.', cpf: '***.237.***-05' },
  ],
}

export const RAIZ_PERMS: LakePermLabConfig = {
  table: CREDITO,
  palette: [
    { id: 'iam', grant: { kind: 'iam-default' } },
    { id: 'all', grant: { kind: 'table' } },
    { id: 'pub', grant: { kind: 'tag', key: 'classificacao', value: 'publico' } },
    { id: 'int', grant: { kind: 'tag', key: 'classificacao', value: 'interno' } },
    { id: 'nocpf', grant: { kind: 'columns', exclude: ['cpf'] } },
    { id: 'sul', grant: { kind: 'filter', where: { column: 'regiao', in: ['Sul'] }, exclude: ['cpf'] } },
    { id: 'sulall', grant: { kind: 'filter', where: { column: 'regiao', in: ['Sul'] } } },
  ],
  analysts: [
    { id: 'marketing', name: 'Marketing', need: 'Estuda **quais produtos vendem em cada região e agência**. Não pode ver valores, nomes nem CPF.', allowed: { columns: ['regiao', 'agencia', 'produto'] }, concepts: ['lf.tags', 'lf.fine-grained'] },
    { id: 'risco', name: 'Ciência de dados de risco', need: 'Treina o modelo de risco com **região, agência, produto e valor** de todos os contratos. Não pode ver nome nem CPF.', allowed: { columns: ['regiao', 'agencia', 'produto', 'valor'] }, concepts: ['lf.tags', 'lf.fine-grained'] },
    { id: 'gerente-sul', name: 'Gerência regional Sul', need: 'Acompanha **os contratos do Sul**, com o nome do cliente, mas **sem o CPF**.', allowed: { columns: ['regiao', 'agencia', 'produto', 'valor', 'nome'], where: { column: 'regiao', in: ['Sul'] } }, concepts: ['lf.fine-grained'] },
    { id: 'auditoria', name: 'Auditoria interna', need: 'Precisa de **todos os contratos e todas as colunas**, inclusive o CPF.', allowed: { columns: ['regiao', 'agencia', 'produto', 'valor', 'nome', 'cpf'] }, concepts: ['lf.what'] },
  ],
}

export const F04_ANA: PhaseDef = {
  ...META.f04,
  concepts: ['lf.what', 'lf.two-checks', 'lf.register', 'lf.fine-grained', 'lf.tags', 'lf.default-hybrid', 'lf.cross-account'],
  availability: 'available',
  simplifications: ['As concessões do laboratório são de leitura e se somam; as permissões do IAM de cada pessoa já permitem usar o Athena.', 'Banco, contratos e pessoas são fictícios; os CPFs aparecem mascarados.'],
  missions: [
    // -----------------------------------------------------------------------
    {
      id: 'ana.f04.m1',
      title: 'Uma porta para todos os serviços',
      type: 'mission',
      summary: 'O Lake Formation centraliza as permissões, e o IAM continua valendo junto.',
      briefing: {
        company: 'Cooperativa de Crédito Raiz',
        role: 'Você cuida da segurança do data lake de uma cooperativa de crédito.',
        situation: 'Cada equipe acessa o data lake pelo Athena, pelo EMR ou pelo Glue, e cada caso virou uma política de bucket diferente. Ninguém sabe dizer quem vê o CPF dos clientes.',
        objective: 'Centralizar as permissões e entender como elas convivem com o IAM.',
        successCriteria: ['Escolher o Lake Formation', 'Saber que IAM e Lake Formation precisam liberar', 'Entender o registro do local no S3'],
      },
      intel: [
        { conceptId: 'lf.what', body: ['O **Lake Formation** dá permissões com GRANT e REVOKE sobre bancos, tabelas, colunas e linhas do Data Catalog. Elas valem para Athena, Redshift Spectrum, EMR, Glue e Quick.'] },
        { conceptId: 'lf.two-checks', body: ['O pedido passa por **duas verificações**: o IAM libera as APIs, e o Lake Formation libera os dados. Faltando uma, o acesso é negado.'] },
        { conceptId: 'lf.register', body: ['O caminho do S3 precisa estar **registrado** no Lake Formation. Assim, ele entrega ao serviço de consulta credenciais temporárias para ler só o permitido.'] },
      ],
      activities: [
        {
          id: 'ana.f04.m1.a1',
          kind: 'decision',
          title: 'Trinta políticas de bucket',
          prompt: 'A cooperativa quer uma regra única, por tabela e por coluna, que valha igual no Athena, no EMR e no Glue. O que usar?',
          concepts: [{ id: 'lf.what' }],
          xp: 40,
          difficulty: 1,
          explanation: ['O Lake Formation governa o Data Catalog e os dados no S3 para todos os serviços integrados, com permissões por tabela, coluna e linha. Políticas de bucket enxergam objetos, não colunas.'],
          options: [
            { id: 'a', text: 'O Lake Formation, com permissões sobre as tabelas do Data Catalog', correct: true, consequence: 'A mesma regra vale em todos os serviços integrados.' },
            { id: 'b', text: 'Uma política de bucket por equipe e por serviço', correct: false, consequence: 'É o que já existe, e não controla colunas.' },
            { id: 'c', text: 'Uma cópia de cada tabela para cada equipe', correct: false, consequence: 'Multiplica os dados e as chances de vazamento.' },
          ],
        },
        {
          id: 'ana.f04.m1.a2',
          kind: 'decision',
          title: 'Acesso negado',
          prompt: 'A analista recebeu SELECT na tabela de contratos pelo Lake Formation, mas o Athena nega a consulta. A role dela não tem nenhuma permissão do Athena no IAM. Por quê?',
          concepts: [{ id: 'lf.two-checks' }],
          xp: 50,
          difficulty: 2,
          explanation: ['O acesso precisa passar no IAM e no Lake Formation. Sem permissão no IAM para usar o Athena e o Glue, a concessão do Lake Formation não basta.'],
          options: [
            { id: 'a', text: 'Falta a permissão do IAM para usar o Athena e ler o catálogo', correct: true, consequence: 'Com as duas verificações liberadas, a consulta roda.' },
            { id: 'b', text: 'O Lake Formation substitui o IAM, então o erro é do Athena', correct: false, consequence: 'O Lake Formation complementa o IAM; os dois precisam liberar.' },
            { id: 'c', text: 'Falta dar s3:GetObject no bucket inteiro para ela', correct: false, consequence: 'Isso abriria os arquivos por fora do Lake Formation.' },
          ],
        },
        {
          id: 'ana.f04.m1.a3',
          kind: 'order',
          title: 'Do SQL ao dado',
          prompt: 'Ponha na ordem o que acontece quando a analista consulta uma tabela governada pelo Athena.',
          concepts: [{ id: 'lf.register' }, { id: 'lf.two-checks', weight: 0.5 }],
          xp: 50,
          difficulty: 2,
          explanation: ['O serviço pede os metadados ao catálogo, o Lake Formation confere a permissão, entrega credenciais temporárias, o serviço lê o S3, aplica os filtros e devolve o resultado.'],
          steps: [
            { id: 'meta', text: 'O Athena pede ao Data Catalog os metadados da tabela', explanation: 'Primeiro, o serviço descobre a tabela.' },
            { id: 'check', text: 'O Lake Formation confere a permissão da analista', explanation: 'Só os metadados permitidos voltam.' },
            { id: 'creds', text: 'O Lake Formation entrega credenciais temporárias ao Athena', explanation: 'É o fornecimento de credenciais.' },
            { id: 'read', text: 'O Athena lê os arquivos no S3 e aplica os filtros de coluna e linha', explanation: 'A filtragem acontece no serviço integrado.' },
            { id: 'result', text: 'A analista recebe só o que pode ver', explanation: 'O resultado já vem filtrado.' },
          ],
        },
      ],
      debrief: { takeaways: ['Lake Formation: permissões por tabela, coluna e linha para todos os serviços integrados.', 'IAM e Lake Formation precisam liberar juntos.', 'Local registrado: o Lake Formation fornece credenciais temporárias.'] },
    },
    // -----------------------------------------------------------------------
    {
      id: 'ana.f04.m2',
      title: 'Colunas e linhas',
      type: 'mission',
      summary: 'Filtros por coluna, linha e célula, e as LF-Tags.',
      briefing: {
        company: 'Cooperativa de Crédito Raiz',
        role: 'Você define o que cada equipe vê da tabela de contratos.',
        situation: 'A tabela de contratos tem região, agência, produto, valor, nome e CPF. O marketing não pode ver dados pessoais, e cada gerência regional só pode ver a própria região. O catálogo tem mais de 3.000 tabelas.',
        objective: 'Limitar colunas e linhas sem copiar tabelas, numa escala de milhares de tabelas.',
        successCriteria: ['Prever o efeito de um filtro', 'Usar LF-Tags para muitas tabelas'],
      },
      intel: [
        { conceptId: 'lf.fine-grained', body: ['Dá para limitar **colunas**, **linhas** ou as duas coisas, por **célula**. A regra de linhas e colunas é um **filtro de dados** concedido com a leitura.'] },
        { conceptId: 'lf.tags', body: ['As **LF-Tags**, como `classificacao=publico`, ficam em bancos, tabelas e colunas. A permissão é dada à tag e vale para tudo o que a tiver, inclusive o que for criado depois.'] },
      ],
      activities: [
        {
          id: 'ana.f04.m2.a1',
          kind: 'predict',
          title: 'O filtro do Sul',
          prompt: 'A gerência Sul recebe um filtro de dados: linhas com região = Sul, todas as colunas menos o CPF. Quantas das cinco linhas da tabela ela vê?',
          concepts: [{ id: 'lf.fine-grained' }],
          xp: 40,
          difficulty: 1,
          explanation: ['O filtro de linhas deixa só os contratos com região Sul: três das cinco linhas.'],
          exhibits: [{ title: 'Regiões das linhas', code: 'Sul, Sul, Sudeste, Norte, Sul' }],
          spec: { sim: 'lakeperm', table: CREDITO, grants: [{ kind: 'filter', where: { column: 'regiao', in: ['Sul'] }, exclude: ['cpf'] }], measure: 'rows' },
          options: [
            { id: 'a', text: '3', outcome: '3' },
            { id: 'b', text: '5, com o CPF oculto', outcome: '5' },
            { id: 'c', text: '1', outcome: '1' },
          ],
        },
        {
          id: 'ana.f04.m2.a2',
          kind: 'predict',
          title: 'A tag pública',
          prompt: 'O marketing recebe a LF-Tag classificacao=publico. O valor do contrato tem a tag classificacao=interno. O marketing vê a coluna de valor?',
          concepts: [{ id: 'lf.tags' }],
          xp: 40,
          difficulty: 2,
          explanation: ['A concessão por tag libera só os recursos com o valor concedido. O valor tem classificacao=interno, e fica oculto.'],
          spec: { sim: 'lakeperm', table: CREDITO, grants: [{ kind: 'tag', key: 'classificacao', value: 'publico' }], measure: 'column', column: 'valor' },
          options: [
            { id: 'a', text: 'Não', outcome: 'no' },
            { id: 'b', text: 'Sim', outcome: 'yes' },
          ],
        },
        {
          id: 'ana.f04.m2.a3',
          kind: 'decision',
          title: 'Três mil tabelas',
          prompt: 'Toda semana surgem tabelas novas com colunas de CPF. Conceder coluna por coluna não dá conta. O que fazer?',
          concepts: [{ id: 'lf.tags' }],
          xp: 50,
          difficulty: 2,
          explanation: ['Com LF-Tags, cada coluna recebe a classificação, e as equipes recebem permissão sobre as tags. A AWS recomenda esse método quando há muitos objetos no catálogo.'],
          options: [
            { id: 'a', text: 'Marcar as colunas com LF-Tags de classificação e conceder as tags às equipes', correct: true, consequence: 'Tabela nova com a tag certa já nasce com o acesso certo.' },
            { id: 'b', text: 'Usar tags do IAM nas tabelas', correct: false, consequence: 'Tags do IAM e LF-Tags são coisas diferentes, e uma não vale pela outra.' },
            { id: 'c', text: 'Conceder tabela por tabela toda semana', correct: false, consequence: 'É o trabalho que não escala.' },
          ],
        },
      ],
      debrief: { takeaways: ['Filtro de dados: colunas, linhas ou células.', 'LF-Tags: permissão pela classificação, que acompanha tabelas novas.', 'LF-Tags não são tags do IAM.'] },
    },
    // -----------------------------------------------------------------------
    {
      id: 'ana.f04.m3',
      title: 'Ligar de verdade e compartilhar',
      type: 'mission',
      summary: 'A configuração padrão, o modo híbrido e o compartilhamento com outra conta.',
      briefing: {
        company: 'Cooperativa de Crédito Raiz',
        role: 'Você coloca as regras do Lake Formation em vigor.',
        situation: 'As concessões foram criadas, mas o marketing continua vendo o CPF. Algumas equipes antigas dependem das políticas do IAM e não podem parar. E a conta da seguradora parceira quer consultar parte dos contratos.',
        objective: 'Fazer as concessões valerem, migrar aos poucos e compartilhar sem copiar.',
        successCriteria: ['Achar o IAMAllowedPrincipals', 'Usar o modo híbrido', 'Compartilhar com outra conta'],
      },
      intel: [
        { conceptId: 'lf.default-hybrid', body: ['Por padrão, o grupo **IAMAllowedPrincipals** tem permissão total, e o acesso fica só com o IAM. O **modo híbrido** liga o Lake Formation para algumas pessoas e mantém o IAM para as outras.'] },
        { conceptId: 'lf.cross-account', body: ['O Lake Formation compartilha tabelas com outras contas pelo **AWS RAM**, sem copiar dados e mantendo os filtros. Fora da organização, a outra conta aceita um convite.'] },
      ],
      activities: [
        {
          id: 'ana.f04.m3.a1',
          kind: 'decision',
          title: 'O CPF que não sumiu',
          prompt: 'O marketing recebeu só a tag classificacao=publico, mas ainda vê o CPF. A tabela foi criada antes de qualquer mudança nas configurações do Lake Formation. Por quê?',
          concepts: [{ id: 'lf.default-hybrid' }],
          xp: 50,
          difficulty: 3,
          explanation: ['Na configuração padrão, IAMAllowedPrincipals tem permissão total nas tabelas, e o acesso fica com o IAM. As concessões do Lake Formation só passam a valer quando essa permissão sai.'],
          options: [
            { id: 'a', text: 'A tabela ainda tem a permissão do grupo IAMAllowedPrincipals, e o acesso continua só com o IAM', correct: true, consequence: 'Tirando essa permissão, a tag passa a decidir o que o marketing vê.' },
            { id: 'b', text: 'As LF-Tags levam 24 horas para valer', correct: false, consequence: 'O problema é a configuração padrão, não um atraso.' },
            { id: 'c', text: 'O Athena não respeita o Lake Formation', correct: false, consequence: 'O Athena é um dos serviços integrados.' },
          ],
        },
        {
          id: 'ana.f04.m3.a2',
          kind: 'decision',
          title: 'Sem parar as equipes antigas',
          prompt: 'Três equipes antigas usam o data lake só com políticas do IAM, e não podem parar. A cooperativa quer começar o Lake Formation pelo marketing. Como?',
          concepts: [{ id: 'lf.default-hybrid' }],
          xp: 50,
          difficulty: 2,
          explanation: ['No modo híbrido, quem é incluído passa a precisar das permissões do Lake Formation e do IAM; os demais continuam só com o IAM.'],
          options: [
            { id: 'a', text: 'Registrar o local no modo híbrido e incluir só o marketing', correct: true, consequence: 'O marketing entra no Lake Formation, e as equipes antigas seguem como estão.' },
            { id: 'b', text: 'Tirar o IAMAllowedPrincipals de tudo de uma vez', correct: false, consequence: 'As equipes antigas perdem o acesso no mesmo dia.' },
            { id: 'c', text: 'Esperar todas as equipes migrarem juntas', correct: false, consequence: 'O CPF continua exposto ao marketing enquanto isso.' },
          ],
        },
        {
          id: 'ana.f04.m3.a3',
          kind: 'decision',
          title: 'A seguradora parceira',
          prompt: 'A seguradora, em outra conta e fora da organização da cooperativa, quer consultar região, produto e valor dos contratos, sem CPF e sem receber cópias. O que fazer?',
          concepts: [{ id: 'lf.cross-account' }],
          xp: 50,
          difficulty: 2,
          explanation: ['O Lake Formation compartilha a tabela com a outra conta pelo AWS RAM, mantendo as colunas permitidas. Fora da organização, o administrador da seguradora aceita o convite.'],
          options: [
            { id: 'a', text: 'Conceder à conta da seguradora as colunas permitidas pelo Lake Formation; ela aceita o convite do RAM', correct: true, consequence: 'A seguradora consulta sem cópia, e o CPF fica de fora.' },
            { id: 'b', text: 'Copiar a tabela sem o CPF para um bucket da seguradora', correct: false, consequence: 'Cria uma cópia que a cooperativa não controla mais.' },
            { id: 'c', text: 'Abrir o bucket para a conta da seguradora com uma política de bucket', correct: false, consequence: 'A seguradora leria os arquivos inteiros, inclusive o CPF.' },
          ],
        },
      ],
      debrief: { takeaways: ['IAMAllowedPrincipals com permissão total: o Lake Formation ainda não vale.', 'Modo híbrido: migração aos poucos, pessoa por pessoa.', 'Compartilhamento entre contas pelo RAM, sem cópia e com os filtros.'] },
    },
    // -----------------------------------------------------------------------
    {
      id: 'ana.f04.boss',
      title: 'Quem vê o quê',
      type: 'boss',
      summary: 'Quatro equipes, uma tabela de contratos e nenhuma célula a mais.',
      briefing: {
        company: 'Cooperativa de Crédito Raiz',
        role: 'Você fecha as permissões da tabela de contratos.',
        situation: 'Marketing, ciência de dados de risco, gerência regional Sul e auditoria interna vão consultar a tabela de contratos. A configuração padrão já foi desligada para essa tabela, mas ainda aparece como opção.',
        objective: 'Dar a cada equipe exatamente o que ela precisa ver.',
        successCriteria: ['Nenhuma equipe vê uma célula a mais', 'Nenhuma equipe fica sem o que precisa'],
      },
      intel: [
        { conceptId: 'lf.fine-grained', body: ['As concessões se somam: a pessoa vê tudo o que cada uma libera. Uma concessão larga demais anula as outras.'] },
        { conceptId: 'lf.tags', body: ['As colunas já têm LF-Tags: públicas, internas e sensíveis.'] },
      ],
      activities: [
        {
          id: 'ana.f04.boss.a1',
          kind: 'lab',
          lab: 'lakeperm',
          title: 'A tabela de contratos',
          prompt: 'Para cada equipe, marque as concessões. A grade mostra, ao vivo, a tabela como a equipe a enxerga.',
          concepts: [{ id: 'lf.fine-grained' }, { id: 'lf.tags' }, { id: 'lf.what' }],
          xp: 200,
          difficulty: 3,
          hints: ['A configuração padrão libera tudo, para qualquer pessoa.', 'O valor tem a tag interno; nome e CPF, a tag sensível.'],
          explanation: [
            'Marketing: a tag classificacao=publico. Risco: as tags publico e interno.',
            'Gerência Sul: o filtro de linhas do Sul sem o CPF. Auditoria: SELECT na tabela inteira.',
            'A configuração padrão, com IAMAllowedPrincipals, mostraria tudo a todos.',
          ],
          config: RAIZ_PERMS,
        },
      ],
      debrief: { takeaways: ['As concessões se somam: comece pelo mínimo.', 'Tags para colunas por classificação; filtros para linhas.', 'A configuração padrão só com o IAM não protege colunas.'] },
    },
  ],
}
