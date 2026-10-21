/**
 * Fase 3 — Consultas com Athena. SQL sem servidor, cobrança por dado lido,
 * workgroups e limites, reaproveitamento de resultados, consultas federadas,
 * projeção de partições, reservas de capacidade e Athena × Redshift.
 */
import type { PhaseDef } from '../../../../../engine/types'
import type { LakeLabConfig } from '../../../../../simulators/datalake/lab'
import type { LakeTable } from '../../../../../simulators/datalake/model'
import { META } from '../meta'

/** Registros de acesso do portal: 50 GB por dia em CSV, um ano guardado, 12 seções. */
export const ACESSOS: LakeTable = {
  id: 'acessos',
  name: 'Registros de acesso ao portal',
  description: 'Cada página aberta gera um registro. O painel da redação consulta **o dia de hoje** a cada 5 minutos; os analistas estudam **os últimos 30 dias** de uma seção.',
  csvGB: 18250,
  days: 365,
  stores: 12,
  unit: { one: 'seção', many: 'seções' },
  columns: [
    { id: 'data', label: 'data e hora', share: 0.05 },
    { id: 'url', label: 'endereço da página', share: 0.3 },
    { id: 'secao', label: 'seção', share: 0.05 },
    { id: 'usuario', label: 'usuário', share: 0.1 },
    { id: 'agente', label: 'navegador', share: 0.3 },
    { id: 'ip', label: 'IP', share: 0.1 },
    { id: 'tempo', label: 'tempo na página', share: 0.1 },
  ],
  queries: [
    { id: 'painel', label: 'Painel da redação (hoje, por seção)', perMonth: 8640, columns: ['data', 'secao'], days: 1 },
    { id: 'analise', label: 'Leitura de uma seção nos últimos 30 dias', perMonth: 90, columns: ['url', 'secao', 'usuario', 'tempo'], days: 30, oneStore: true },
  ],
  concepts: ['athena.cost', 'lake.partitioning', 'lake.columnar'],
}

const ASSINANTES: LakeTable = {
  id: 'assinantes',
  name: 'Cadastro de assinantes',
  description: 'O atendimento consulta o plano e a cidade dos assinantes **3.000 vezes por mês**, sempre sobre o cadastro inteiro, que é pequeno.',
  csvGB: 30,
  days: 365,
  stores: 12,
  unit: { one: 'seção', many: 'seções' },
  columns: [
    { id: 'id', label: 'assinante', share: 0.1 },
    { id: 'plano', label: 'plano', share: 0.05 },
    { id: 'cidade', label: 'cidade', share: 0.1 },
    { id: 'endereco', label: 'endereço', share: 0.5 },
    { id: 'historico', label: 'histórico de pagamentos', share: 0.25 },
  ],
  queries: [{ id: 'atendimento', label: 'Plano e cidade do assinante', perMonth: 3000, columns: ['id', 'plano', 'cidade'] }],
  concepts: ['athena.cost', 'lake.small-files'],
}

export const NOTICIA_JA_LAKE: LakeLabConfig = { tables: [ACESSOS, ASSINANTES] }

export const F03_ANA: PhaseDef = {
  ...META.f03,
  concepts: ['athena.what', 'athena.cost', 'athena.workgroups', 'athena.result-reuse', 'athena.federated', 'athena.partition-projection', 'athena.capacity', 'rs.vs-athena', 'lake.partitioning', 'lake.columnar', 'lake.small-files'],
  availability: 'available',
  simplifications: ['O custo usa a cobrança por consulta (dado lido); a reserva de capacidade aparece só nas decisões.', 'Portal, tabelas e volumes são fictícios.'],
  missions: [
    // -----------------------------------------------------------------------
    {
      id: 'ana.f03.m1',
      title: 'Perguntas sem servidor',
      type: 'mission',
      summary: 'O Athena consulta o S3 com SQL, e cada consulta paga o dado que lê.',
      briefing: {
        company: 'Portal Notícia Já',
        role: 'Você cuida dos dados de um portal de notícias.',
        situation: 'Os registros de acesso ao site já estão no data lake, catalogados. A redação quer respostas rápidas, como "quais matérias mais leram hoje", sem montar servidores. O financeiro quer entender quanto isso vai custar.',
        objective: 'Consultar o data lake com SQL e prever o custo de cada consulta.',
        successCriteria: ['Escolher o Athena para consultas sob demanda', 'Calcular o custo pelo dado lido', 'Saber o que é e o que não é cobrado'],
      },
      intel: [
        { conceptId: 'athena.what', body: ['O **Athena** roda SQL direto sobre os arquivos do S3, usando as tabelas do Data Catalog. Não há cluster: a consulta começa na hora, e o resultado é gravado no S3.'] },
        { conceptId: 'athena.cost', body: ['Cobra **por TB lido**, arredondado ao megabyte, com **mínimo de 10 MB** por consulta. Na tabela da trilha, US$ 5 por TB em us-east-1. Comandos de definição e consultas que falham não pagam; as canceladas pagam o que leram.'] },
      ],
      activities: [
        {
          id: 'ana.f03.m1.a1',
          kind: 'decision',
          title: 'Quem responde à redação',
          prompt: 'A redação faz perguntas novas todo dia, em horários imprevisíveis, sobre arquivos que já estão no S3. A equipe não quer manter servidores. O que usar?',
          concepts: [{ id: 'athena.what' }],
          xp: 40,
          difficulty: 1,
          explanation: ['O Athena consulta o S3 sem infraestrutura e cobra só quando a consulta roda. Um cluster ficaria parado entre as perguntas.'],
          options: [
            { id: 'a', text: 'O Athena, com as tabelas do Data Catalog', correct: true, consequence: 'Cada pergunta vira uma consulta SQL, paga pelo dado lido.' },
            { id: 'b', text: 'Um cluster do EMR ligado o dia inteiro', correct: false, consequence: 'Funciona, mas paga o cluster parado e exige cuidar dele.' },
            { id: 'c', text: 'Baixar os arquivos para a máquina de um analista', correct: false, consequence: 'Não escala e tira os dados do controle da empresa.' },
          ],
        },
        {
          id: 'ana.f03.m1.a2',
          kind: 'estimate',
          title: 'Quanto custa a consulta',
          prompt: 'Uma consulta lê 200 GB. Quanto ela custa a US$ 5 por TB? (1 TB = 1.024 GB)',
          concepts: [{ id: 'athena.cost' }],
          xp: 40,
          difficulty: 2,
          explanation: ['200 GB são 200 ÷ 1.024 ≈ 0,195 TB. Multiplicado por US$ 5, dá cerca de US$ 0,98.'],
          unit: 'US$',
          min: 0,
          max: 5,
          step: 0.01,
          answer: 0.98,
          tolerance: 0.05,
        },
        {
          id: 'ana.f03.m1.a3',
          kind: 'classify',
          title: 'Paga ou não paga',
          prompt: 'Na cobrança por consulta, classifique cada caso.',
          concepts: [{ id: 'athena.cost' }],
          xp: 50,
          difficulty: 2,
          explanation: ['O Athena cobra o dado lido pelas consultas, com mínimo de 10 MB. Comandos de definição de tabela e consultas que falham não são cobrados; consultas canceladas pagam o que já leram.'],
          bins: [
            { id: 'paid', label: 'É cobrado' },
            { id: 'free', label: 'Não é cobrado' },
          ],
          items: [
            { id: 'select', text: 'Um SELECT que lê 3 GB', bin: 'paid', explanation: 'Paga os 3 GB lidos.', concepts: ['athena.cost'] },
            { id: 'tiny', text: 'Um SELECT que lê 200 KB', bin: 'paid', explanation: 'Paga o mínimo de 10 MB.', concepts: ['athena.cost'] },
            { id: 'cancel', text: 'Uma consulta cancelada depois de ler 40 GB', bin: 'paid', explanation: 'Paga os 40 GB que já leu.', concepts: ['athena.cost'] },
            { id: 'ddl', text: 'Um ALTER TABLE ADD PARTITION', bin: 'free', explanation: 'Comandos de definição não são cobrados.', concepts: ['athena.cost'] },
            { id: 'fail', text: 'Uma consulta que falhou por erro de sintaxe', bin: 'free', explanation: 'Consultas que falham não são cobradas.', concepts: ['athena.cost'] },
          ],
        },
      ],
      debrief: { takeaways: ['Athena: SQL sem servidor sobre o S3, com as tabelas do Data Catalog.', 'Paga por TB lido, com mínimo de 10 MB por consulta.', 'Definição de tabela e consulta com erro não pagam; cancelada paga o que leu.'] },
    },
    // -----------------------------------------------------------------------
    {
      id: 'ana.f03.m2',
      title: 'Cada equipe no seu espaço',
      type: 'mission',
      summary: 'Workgroups, limites de dados lidos e o reaproveitamento de resultados.',
      briefing: {
        company: 'Portal Notícia Já',
        role: 'Você organiza o uso do Athena entre as equipes.',
        situation: 'Na semana passada, um estagiário rodou um SELECT * sem filtro sobre o ano inteiro de acessos, várias vezes. A redação, o comercial e os relatórios automáticos usam o mesmo espaço, e ninguém sabe quanto cada um gasta.',
        objective: 'Separar as equipes, limitar o estrago de uma consulta e reduzir consultas repetidas.',
        successCriteria: ['Usar workgroups por equipe', 'Diferenciar o limite por consulta e o do workgroup', 'Reaproveitar resultados quando os dados não mudam'],
      },
      intel: [
        { conceptId: 'athena.workgroups', body: ['O **workgroup** separa consultas por equipe, com histórico, acesso e custo próprios. O **limite por consulta cancela** a consulta que passar dele. Os **limites do workgroup**, por hora ou por dia, **só avisam** por SNS.'] },
        { conceptId: 'athena.result-reuse', body: ['Ao repetir uma consulta, o Athena pode devolver o resultado guardado, dentro de uma idade máxima, sem ler os dados de novo.'] },
      ],
      activities: [
        {
          id: 'ana.f03.m2.a1',
          kind: 'decision',
          title: 'O SELECT do ano inteiro',
          prompt: 'Como impedir que uma única consulta dos analistas leia mais de 1 TB?',
          concepts: [{ id: 'athena.workgroups' }],
          xp: 50,
          difficulty: 2,
          explanation: ['O limite por consulta do workgroup cancela qualquer consulta que passe do volume definido. O limite do workgroup, por período, só dispara um alarme.'],
          options: [
            { id: 'a', text: 'Um workgroup dos analistas com limite por consulta de 1 TB', correct: true, consequence: 'A consulta que passar de 1 TB é cancelada e paga só o que leu até ali.' },
            { id: 'b', text: 'Um limite diário do workgroup de 1 TB', correct: false, consequence: 'Ele só avisa pelo SNS; a consulta continua rodando.' },
            { id: 'c', text: 'Um orçamento mensal no AWS Budgets', correct: false, consequence: 'Avisa sobre o gasto do mês, mas não para nenhuma consulta.' },
          ],
        },
        {
          id: 'ana.f03.m2.a2',
          kind: 'decision',
          title: 'Quem gastou quanto',
          prompt: 'O financeiro quer o gasto de cada equipe e ser avisado quando os relatórios automáticos lerem mais de 5 TB num dia. O que montar?',
          concepts: [{ id: 'athena.workgroups' }],
          xp: 50,
          difficulty: 2,
          explanation: ['Um workgroup por equipe separa histórico e custo, que aparecem na fatura com tags de alocação. O limite diário do workgroup dos relatórios avisa pelo SNS.'],
          options: [
            { id: 'a', text: 'Um workgroup por equipe, com tags de custo, e um limite diário de 5 TB no workgroup dos relatórios', correct: true, consequence: 'Cada equipe tem o próprio custo, e o financeiro recebe o aviso.' },
            { id: 'b', text: 'Um workgroup só, com limite por consulta de 5 TB', correct: false, consequence: 'O custo continua misturado, e o limite por consulta não soma o dia.' },
            { id: 'c', text: 'Uma conta da AWS por equipe só para usar o Athena', correct: false, consequence: 'Funciona, mas é muito mais pesado que um workgroup.' },
          ],
        },
        {
          id: 'ana.f03.m2.a3',
          kind: 'decision',
          title: 'O painel que repete tudo',
          prompt: 'Cinquenta jornalistas abrem o mesmo painel, que dispara a mesma consulta sobre os acessos da última hora. Os dados mudam a cada 15 minutos. Como reduzir o dado lido?',
          concepts: [{ id: 'athena.result-reuse' }],
          xp: 50,
          difficulty: 2,
          explanation: ['Com o reaproveitamento de resultados e idade máxima de 15 minutos, o Athena devolve o resultado guardado às consultas repetidas dentro do mesmo workgroup.'],
          options: [
            { id: 'a', text: 'Ligar o reaproveitamento de resultados com idade máxima de 15 minutos', correct: true, consequence: 'A primeira consulta lê os dados; as repetidas, dentro de 15 minutos, não.' },
            { id: 'b', text: 'Aumentar o limite por consulta do workgroup', correct: false, consequence: 'Não reduz nada; só permite consultas maiores.' },
            { id: 'c', text: 'Converter a tabela de novo para Parquet', correct: false, consequence: 'Ela já está em Parquet; o desperdício é repetir a mesma consulta.' },
          ],
        },
      ],
      debrief: { takeaways: ['Workgroup por equipe: histórico, acesso e custo separados.', 'Limite por consulta cancela; limite do workgroup avisa.', 'Resultados reaproveitados evitam ler de novo o que não mudou.'] },
    },
    // -----------------------------------------------------------------------
    {
      id: 'ana.f03.m3',
      title: 'Além do S3',
      type: 'mission',
      summary: 'Consultas federadas, projeção de partições, reservas de capacidade e Athena ao lado do Redshift.',
      briefing: {
        company: 'Portal Notícia Já',
        role: 'Você amplia o uso do Athena no portal.',
        situation: 'O comercial quer cruzar os acessos com os contratos de anúncio, que ficam num banco PostgreSQL no RDS. A tabela de acessos tem partições por hora há cinco anos. E o relatório de audiência para os anunciantes não pode atrasar.',
        objective: 'Escolher o recurso certo do Athena para cada necessidade e saber quando o Redshift serve melhor.',
        successCriteria: ['Consultar o banco sem copiá-lo', 'Lidar com milhares de partições', 'Garantir capacidade ao relatório crítico'],
      },
      intel: [
        { conceptId: 'athena.federated', body: ['A **consulta federada** lê fontes fora do S3, como RDS e DynamoDB, por conectores, e junta tudo numa consulta SQL, sem copiar os dados.'] },
        { conceptId: 'athena.partition-projection', body: ['A **projeção de partições** calcula as partições por regras da tabela, sem consultar o catálogo. Acelera tabelas com muitas partições e dispensa registrar cada uma.'] },
        { conceptId: 'athena.capacity', body: ['A **reserva de capacidade** dá DPUs dedicados a workgroups escolhidos, cobrados por DPU-hora, com prioridade para as consultas desses workgroups.'] },
      ],
      activities: [
        {
          id: 'ana.f03.m3.a1',
          kind: 'decision',
          title: 'Os contratos no PostgreSQL',
          prompt: 'O comercial quer, uma vez por semana, cruzar os acessos do S3 com os contratos que ficam no RDS for PostgreSQL. Qual é a forma mais simples?',
          concepts: [{ id: 'athena.federated' }],
          xp: 50,
          difficulty: 2,
          explanation: ['A consulta federada lê o PostgreSQL por um conector e junta com as tabelas do S3 na mesma consulta, sem um processo de cópia.'],
          options: [
            { id: 'a', text: 'Uma consulta federada do Athena com o conector do PostgreSQL', correct: true, consequence: 'A junção roda numa consulta só, com os contratos lidos onde estão.' },
            { id: 'b', text: 'Um job diário que copia o banco inteiro para o S3', correct: false, consequence: 'Funciona, mas cria uma cópia e um processo para uma consulta semanal.' },
            { id: 'c', text: 'Carregar os acessos no PostgreSQL', correct: false, consequence: 'O banco transacional não foi feito para terabytes de registros.' },
          ],
        },
        {
          id: 'ana.f03.m3.a2',
          kind: 'decision',
          title: 'Cinco anos de partições por hora',
          prompt: 'A tabela de acessos tem mais de 40 mil partições por hora, e o planejamento das consultas ficou lento. Além disso, alguém precisa registrar cada hora nova. O que ajuda nos dois problemas?',
          concepts: [{ id: 'athena.partition-projection' }],
          xp: 50,
          difficulty: 3,
          explanation: ['Com a projeção, o Athena calcula as partições pelas regras da tabela, sem procurá-las no catálogo, e as horas novas não precisam ser registradas.'],
          options: [
            { id: 'a', text: 'Configurar a projeção de partições na tabela', correct: true, consequence: 'O planejamento fica mais rápido, e ninguém mais registra partições.' },
            { id: 'b', text: 'Rodar MSCK REPAIR TABLE a cada hora', correct: false, consequence: 'É lento, só adiciona partições e não acelera o planejamento.' },
            { id: 'c', text: 'Juntar tudo numa partição só', correct: false, consequence: 'Toda consulta passaria a ler os cinco anos.' },
          ],
        },
        {
          id: 'ana.f03.m3.a3',
          kind: 'decision',
          title: 'O relatório que não pode atrasar',
          prompt: 'Toda segunda às 8h, o relatório de audiência roda 200 consultas para os anunciantes, e nos picos algumas ficam na fila. O que garante a execução?',
          concepts: [{ id: 'athena.capacity' }],
          xp: 50,
          difficulty: 3,
          explanation: ['A reserva de capacidade dá DPUs dedicados ao workgroup do relatório. As consultas dele têm prioridade e não disputam a cota da conta com as consultas interativas.'],
          options: [
            { id: 'a', text: 'Uma reserva de capacidade para o workgroup do relatório', correct: true, consequence: 'As 200 consultas rodam na capacidade dedicada, cobrada por DPU-hora.' },
            { id: 'b', text: 'Um limite por consulta mais alto', correct: false, consequence: 'Limita o volume de cada consulta, não garante capacidade.' },
            { id: 'c', text: 'Rodar o relatório em outro workgroup sem reserva', correct: false, consequence: 'Continua disputando a mesma cota.' },
          ],
        },
        {
          id: 'ana.f03.m3.a4',
          kind: 'decision',
          title: 'O painel de toda hora',
          prompt: 'A diretoria quer um painel com centenas de consultas por hora, sempre sobre as mesmas tabelas limpas, com resposta em menos de um segundo. Athena ou Redshift?',
          concepts: [{ id: 'rs.vs-athena' }, { id: 'athena.what', weight: 0.5 }],
          xp: 50,
          difficulty: 2,
          explanation: ['Painéis frequentes, sobre dados estruturados e com resposta rápida são o caso do data warehouse. O Athena brilha nas consultas sob demanda sobre o S3. O Redshift Spectrum ainda permite juntar, no Redshift, tabelas do S3.'],
          options: [
            { id: 'a', text: 'O Redshift, com as tabelas do painel carregadas, e o Spectrum para o que ficar no S3', correct: true, consequence: 'O painel tem resposta rápida, e o histórico continua no data lake.' },
            { id: 'b', text: 'O Athena, porque é sem servidor', correct: false, consequence: 'Funciona, mas cada uma das centenas de consultas por hora paga o dado lido, sem a resposta garantida.' },
          ],
        },
      ],
      debrief: { takeaways: ['Federada: consulta fontes fora do S3 sem copiar.', 'Projeção: muitas partições sem catálogo nem registro.', 'Reserva de capacidade: DPUs dedicados para o que não pode atrasar.', 'Painel frequente e rápido: Redshift; consulta sob demanda no S3: Athena.'] },
    },
    // -----------------------------------------------------------------------
    {
      id: 'ana.f03.boss',
      title: 'A conta do portal',
      type: 'boss',
      summary: 'Duas tabelas, um painel que consulta a cada 5 minutos e uma fatura para cortar.',
      briefing: {
        company: 'Portal Notícia Já',
        role: 'Você revisa a fatura do Athena do portal.',
        situation: 'O painel da redação consulta os acessos de hoje a cada 5 minutos, e os analistas estudam uma seção por vez nos últimos 30 dias. O atendimento consulta o cadastro de assinantes 3.000 vezes por mês. Tudo está em CSV sem compressão e sem partição.',
        objective: 'Reorganizar as duas tabelas pelo menor custo mensal.',
        successCriteria: ['Menor custo em cada tabela', 'Nenhuma tabela com arquivos pequenos demais'],
      },
      intel: [
        { conceptId: 'athena.cost', body: ['O painel roda 8.640 vezes por mês. Cada GB a menos por consulta se multiplica por isso.'] },
        { conceptId: 'lake.partitioning', body: ['Hoje é um dia; uma seção é uma de doze. A partição pode acompanhar os dois filtros, desde que os arquivos não fiquem pequenos demais.'] },
      ],
      activities: [
        {
          id: 'ana.f03.boss.a1',
          kind: 'predict',
          title: 'Por dia ou por dia e seção',
          prompt: 'Com os acessos em Parquet e GZIP, a análise de uma seção nos últimos 30 dias lê menos com partição por dia ou por dia e por seção?',
          concepts: [{ id: 'lake.partitioning' }, { id: 'athena.cost', weight: 0.5 }],
          xp: 40,
          difficulty: 2,
          explanation: ['A análise filtra uma seção. Com a seção também na partição, a consulta abre só a pasta daquela seção em cada dia, um doze avos do que leria só por dia.'],
          spec: { sim: 'datalake', table: ACESSOS, query: 'analise', layouts: { day: { format: 'parquet', compression: 'gzip', partition: 'day' }, both: { format: 'parquet', compression: 'gzip', partition: 'day-store' } } },
          options: [
            { id: 'a', text: 'Por dia e por seção', outcome: 'both' },
            { id: 'b', text: 'Só por dia', outcome: 'day' },
            { id: 'c', text: 'As duas leem o mesmo volume', outcome: 'same' },
          ],
        },
        {
          id: 'ana.f03.boss.a2',
          kind: 'lab',
          lab: 'datalake',
          title: 'A fatura do portal',
          prompt: 'Para cada tabela, escolha formato, compressão e partição. O quadro mostra o dado lido por consulta e o custo do mês no S3 e no Athena.',
          concepts: [{ id: 'athena.cost' }, { id: 'lake.partitioning' }, { id: 'lake.columnar' }, { id: 'lake.small-files' }],
          xp: 200,
          difficulty: 3,
          hints: ['O painel lê só data e seção do dia de hoje.', 'O cadastro de assinantes é pequeno: partição nenhuma ajuda a consulta, que lê o cadastro inteiro.'],
          explanation: [
            'Acessos: formato colunar com GZIP ou ZSTD, particionado por dia e por seção. O painel lê um dia, e a análise lê uma seção.',
            'Assinantes: formato colunar comprimido, sem partição por dia e seção, que geraria arquivos pequenos demais. A consulta lê três colunas do cadastro inteiro.',
          ],
          config: NOTICIA_JA_LAKE,
        },
      ],
      debrief: { takeaways: ['Consultas frequentes multiplicam cada GB lido.', 'A partição pode seguir mais de um filtro, se os arquivos continuarem grandes.', 'Tabela pequena e lida inteira: formato colunar e compressão bastam.'] },
    },
  ],
}
