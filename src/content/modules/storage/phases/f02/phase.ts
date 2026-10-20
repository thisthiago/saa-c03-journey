/** Fase 2 — Classes de armazenamento e custos (empresa fictícia: VitaImagem Diagnósticos). */
import type { EvidenceLine } from '../../../../../activities/types'
import type { PhaseDef } from '../../../../../engine/types'
import { billLine, totalFor } from '../../../../../simulators/cost/bill'
import { formatUSD, monthlyCost, type DataProfile } from '../../../../../simulators/cost/model'
import { regionPrices } from '../../../../../simulators/cost/prices'
import { ARQUIVO_LEGAL, EXAMES_ANTIGOS, EXAMES_RECENTES, LOGS_PEQUENOS, PESQUISA, PREVIAS } from './profiles'

const COMPANY = 'VitaImagem Diagnósticos'
const ROLE = 'Você responde pela arquitetura e pelos custos de nuvem da rede de clínicas.'
const REGION = 'us-east-1'
const prices = regionPrices(REGION)

// --- Chefe: a fatura antes e depois das mudanças do estagiário ------------------
const BEFORE: [DataProfile, Parameters<typeof monthlyCost>[1]][] = [
  [EXAMES_RECENTES, 'STANDARD'],
  [EXAMES_ANTIGOS, 'GLACIER_IR'],
  [ARQUIVO_LEGAL, 'DEEP_ARCHIVE'],
  [PREVIAS, 'STANDARD'],
]
const AFTER: [DataProfile, Parameters<typeof monthlyCost>[1]][] = [
  [EXAMES_RECENTES, 'STANDARD_IA'],
  [EXAMES_ANTIGOS, 'GLACIER_IR'],
  [ARQUIVO_LEGAL, 'GLACIER_IR'],
  [PREVIAS, 'ONEZONE_IA'],
]
const totalBefore = totalFor(REGION, BEFORE)
const totalAfter = totalFor(REGION, AFTER)

const EXPLAIN: Record<string, string> = {
  'recentes-retrieval': 'Standard-IA cobra cada GB lido. Exames abertos todos os dias geram milhares de GB de recuperação por mês.',
  'recentes-storage': 'O armazenamento ficou mais barato — por isso a mudança parecia boa. O problema está nas outras linhas.',
  'recentes-requests': 'Requisições em Standard-IA custam mais que no Standard; com milhões de GETs, a diferença aparece.',
  'legal-storage': 'O arquivo legal saiu do Deep Archive (o mais barato) para o Glacier Instant Retrieval: leitura imediata que ninguém precisa, a um preço por GB várias vezes maior.',
  'previas-storage': 'Em One Zone-IA cada miniatura de 24 KB é cobrada como 128 KB: o volume faturado mais que quintuplica.',
  'previas-retrieval': 'Miniaturas lidas a cada listagem agora pagam recuperação por GB.',
  'previas-requests': 'GETs em One Zone-IA custam mais que no Standard.',
  'antigos-storage': 'Sem mudança: os exames antigos continuam no Glacier Instant Retrieval, que era a escolha certa.',
}

function line(p: DataProfile, from: Parameters<typeof monthlyCost>[1], to: Parameters<typeof monthlyCost>[1], c: Parameters<typeof billLine>[4]): EvidenceLine {
  const l = billLine(REGION, p, from, to, c)
  return { id: l.id, text: l.text, isIssue: l.increased, explanation: EXPLAIN[l.id] ?? (l.increased ? 'Esta linha subiu de forma relevante.' : 'Esta linha não explica o aumento.') }
}

// --- Chefe: Intelligent-Tiering × classe fixa em dois meses diferentes ----------
const quiet: DataProfile = { ...PESQUISA, getsPerMonth: 20_000, retrievedGBPerMonth: 100, intelligentTieringShare: { frequent: 0.02, infrequent: 0.08, archiveInstant: 0.9 } }
const intense: DataProfile = { ...PESQUISA, getsPerMonth: 4_000_000, retrievedGBPerMonth: 23_000, intelligentTieringShare: { frequent: 1, infrequent: 0, archiveInstant: 0 } }
const cost = (p: DataProfile, sc: Parameters<typeof monthlyCost>[1]) => formatUSD(monthlyCost(p, sc, prices).total)

// --- Armadilha dos objetos pequenos no Glacier -----------------------------------
const logsTransitionCost = (LOGS_PEQUENOS.objectCount / 1000) * prices.transitionPer1000.GLACIER

export const F02: PhaseDef = {
  id: 's3x.f02',
  order: 2,
  title: 'Classes de armazenamento e custos',
  subtitle: 'Do Standard ao Deep Archive',
  summary: 'Escolha classes pelo padrão de acesso e descubra quando uma classe "mais barata" aumenta a conta.',
  glyph: 'coins',
  color: '#ffb547',
  requires: ['s3x.f01'],
  concepts: [
    'sc.overview',
    'sc.standard',
    'sc.intelligent-tiering',
    'sc.standard-ia',
    'sc.onezone-ia',
    'sc.express-onezone',
    'sc.glacier-ir',
    'sc.glacier-flexible',
    'sc.deep-archive',
    's3.pricing',
    's3.min-duration',
    's3.restore',
    's3.storage-class-analysis',
    'glacier.vault-service',
  ],
  availability: 'available',
  estimatedMinutes: 45,
  map: { x: 300, y: 50 },
  simplifications: [
    'Preços da AWS Price List (us-east-1 e sa-east-1) na data indicada no simulador, apenas a primeira faixa de cada item, sem nível gratuito nem impostos.',
    'Cada perfil assume objetos de tamanho médio igual e volume estável mês a mês.',
    'No Intelligent-Tiering, a distribuição entre tiers é uma estimativa do padrão de acesso de cada perfil.',
    'Tempos de restauração usam os valores típicos publicados pela AWS.',
  ],
  missions: [
    // -----------------------------------------------------------------------
    {
      id: 's3x.f02.m1',
      title: 'O cardápio de classes',
      type: 'mission',
      summary: 'Associar cada classe ao padrão de acesso, à latência e à resiliência certos.',
      briefing: {
        company: COMPANY,
        role: ROLE,
        situation:
          'A VitaImagem guarda centenas de terabytes de exames de imagem no S3 Standard. Exames recentes são abertos o tempo todo; exames antigos quase nunca; e a lei exige guardar tudo por até 20 anos. A conta cresce todo mês.',
        objective: 'Entender o que cada classe oferece antes de mexer em qualquer dado.',
        successCriteria: ['Associar cada classe ao seu perfil típico', 'Separar classes de leitura imediata das que exigem restauração', 'Escolher a classe dos exames recentes'],
      },
      intel: [
        {
          conceptId: 'sc.overview',
          visual: 'class-spectrum',
          body: ['A classe é escolhida **por objeto**. Quanto mais barato guardar, mais caro ou lento ler. Todas têm 11 noves de durabilidade; mudam latência, resiliência a AZ e custos de acesso.'],
        },
        {
          conceptId: 'sc.intelligent-tiering',
          body: ['**Intelligent-Tiering** move objetos sozinho entre tiers conforme o acesso. Cobra monitoramento por objeto e **não cobra recuperação**. Ideal para padrão de acesso **desconhecido**.'],
        },
        {
          conceptId: 'sc.onezone-ia',
          body: ['**One Zone-IA** e **Express One Zone** guardam dados em **uma AZ**: não resistem à perda da zona. Use para dados **recriáveis** (One Zone-IA) ou quando a **latência** é o que importa (Express One Zone).'],
        },
        {
          conceptId: 'sc.glacier-flexible',
          body: ['**Glacier Instant Retrieval** lê na hora. **Glacier Flexible Retrieval** e **Deep Archive** exigem **restaurar** antes de ler: de minutos a 48 horas.'],
        },
      ],
      activities: [
        {
          id: 's3x.f02.m1.a1',
          kind: 'match',
          title: 'Cada dado na sua classe',
          prompt: 'Associe cada classe ao cenário em que ela é a escolha típica.',
          concepts: [{ id: 'sc.overview' }],
          xp: 50,
          difficulty: 2,
          hints: ['Comece pelas extremas: a mais acessada (Standard) e a mais fria (Deep Archive).'],
          explanation: ['A classe certa vem do padrão de acesso: frequência de leitura, urgência para ler e se o dado pode ser recriado.'],
          leftLabel: 'Classes',
          rightLabel: 'Cenários',
          pairs: [
            { id: 'std', left: 'S3 Standard', right: 'Fotos de perfil carregadas a cada acesso ao app', explanation: 'Acesso frequente e imediato, sem taxa de recuperação.', concepts: ['sc.standard'] },
            { id: 'int', left: 'S3 Intelligent-Tiering', right: 'Data lake em que não se sabe quais dados serão consultados', explanation: 'Padrão desconhecido: os tiers se ajustam sozinhos, sem taxa de recuperação.', concepts: ['sc.intelligent-tiering'] },
            { id: 'sia', left: 'S3 Standard-IA', right: 'Backups lidos cerca de uma vez por mês, com restauração rápida', explanation: 'Acesso mensal com leitura em milissegundos e resiliência a AZ.', concepts: ['sc.standard-ia'] },
            { id: 'zia', left: 'S3 One Zone-IA', right: 'Cópias recriáveis, pouco lidas, onde perder uma AZ é aceitável', explanation: 'Mais barata que Standard-IA, mas numa única AZ.', concepts: ['sc.onezone-ia'] },
            { id: 'xz', left: 'S3 Express One Zone', right: 'Treinamento de ML com milhões de leituras pequenas e latência crítica', explanation: 'Latência de um dígito de milissegundo, na mesma AZ da computação.', concepts: ['sc.express-onezone'] },
            { id: 'gir', left: 'S3 Glacier Instant Retrieval', right: 'Exames antigos abertos poucas vezes por trimestre, mas na hora', explanation: 'Armazenamento de arquivo com leitura imediata.', concepts: ['sc.glacier-ir'] },
            { id: 'gfr', left: 'S3 Glacier Flexible Retrieval', right: 'Arquivo lido uma vez por ano, aceitando esperar algumas horas', explanation: 'Barato, com restauração em minutos a horas.', concepts: ['sc.glacier-flexible'] },
            { id: 'gda', left: 'S3 Glacier Deep Archive', right: 'Registros guardados por 10 anos por exigência legal, quase nunca lidos', explanation: 'O menor preço, com restauração em até 12 ou 48 horas.', concepts: ['sc.deep-archive'] },
          ],
        },
        {
          id: 's3x.f02.m1.a2',
          kind: 'classify',
          title: 'Ler agora ou restaurar antes?',
          prompt: 'Classifique cada classe pelo jeito de ler os dados e pela resiliência.',
          concepts: [{ id: 'sc.overview' }, { id: 's3.restore' }],
          xp: 40,
          difficulty: 1,
          explanation: ['Só Glacier Flexible Retrieval e Deep Archive exigem restauração. One Zone-IA e Express One Zone usam uma única AZ.'],
          bins: [
            { id: 'multi', label: 'Leitura imediata, ≥3 AZs' },
            { id: 'single', label: 'Leitura imediata, 1 AZ' },
            { id: 'restore', label: 'Exige restauração' },
          ],
          items: [
            { id: 'c1', text: 'S3 Standard', bin: 'multi', explanation: 'Milissegundos, pelo menos 3 AZs.', concepts: ['sc.overview'] },
            { id: 'c2', text: 'S3 Standard-IA', bin: 'multi', explanation: 'Milissegundos, pelo menos 3 AZs, com taxa de recuperação.', concepts: ['sc.overview'] },
            { id: 'c3', text: 'S3 Intelligent-Tiering (tiers automáticos)', bin: 'multi', explanation: 'Os tiers automáticos têm leitura em milissegundos.', concepts: ['sc.overview'] },
            { id: 'c4', text: 'S3 Glacier Instant Retrieval', bin: 'multi', explanation: 'Apesar do nome Glacier, lê na hora.', concepts: ['sc.overview'] },
            { id: 'c5', text: 'S3 One Zone-IA', bin: 'single', explanation: 'Uma AZ: não resiste à perda da zona.', concepts: ['sc.overview'] },
            { id: 'c6', text: 'S3 Express One Zone', bin: 'single', explanation: 'Uma AZ escolhida, alto desempenho.', concepts: ['sc.overview'] },
            { id: 'c7', text: 'S3 Glacier Flexible Retrieval', bin: 'restore', explanation: 'Restauração Expedited, Standard ou Bulk antes do GET.', concepts: ['s3.restore'] },
            { id: 'c8', text: 'S3 Glacier Deep Archive', bin: 'restore', explanation: 'Restauração Standard (até 12 h) ou Bulk (até 48 h).', concepts: ['s3.restore'] },
          ],
        },
        {
          id: 's3x.f02.m1.a3',
          kind: 'decision',
          title: 'Onde guardar os exames do mês?',
          prompt: 'Exames recentes são abertos milhares de vezes por dia e não podem ser perdidos. Qual classe usar?',
          concepts: [{ id: 'sc.standard' }, { id: 'sc.standard-ia' }],
          xp: 40,
          difficulty: 2,
          explanation: ['Para dados muito acessados, o S3 Standard costuma ser o mais barato no total: não há taxa de recuperação por GB.'],
          options: [
            { id: 'a', text: 'S3 Standard', correct: true, consequence: 'Leitura imediata, resiliência a AZ e nenhuma taxa por GB lido — o custo total fica menor com tanto acesso.', impacts: { custo: 1, desempenho: 1 } },
            { id: 'b', text: 'S3 Standard-IA, porque o GB guardado é mais barato', correct: false, consequence: 'O armazenamento cai, mas cada GB lido passa a ser cobrado. Com milhares de leituras por dia, a conta sobe.', impacts: { custo: -2 } },
            { id: 'c', text: 'S3 Glacier Flexible Retrieval, o mais barato de acesso eventual', correct: false, consequence: 'Os médicos teriam de esperar horas por uma restauração a cada exame. Inviável.', impacts: { desempenho: -2, disponibilidade: -2 } },
            { id: 'd', text: 'S3 One Zone-IA', correct: false, consequence: 'Exames não podem ser recriados: perder a AZ significaria perder dados de pacientes. E a taxa de recuperação continuaria pesando.', impacts: { durabilidade: -2, custo: -1 } },
          ],
          justification: {
            prompt: 'Qual é o fator decisivo?',
            options: [
              { id: 'j1', text: 'Com acesso muito frequente, a taxa de recuperação das classes IA supera a economia no armazenamento.', correct: true, feedback: 'Exato: é o padrão de acesso que decide.' },
              { id: 'j2', text: 'O S3 Standard tem durabilidade maior que as outras classes.', correct: false, feedback: 'Não: todas as classes têm 11 noves de durabilidade.' },
              { id: 'j3', text: 'Só o S3 Standard aceita objetos de imagem.', correct: false, feedback: 'Qualquer classe aceita qualquer tipo de objeto.' },
            ],
          },
        },
      ],
      debrief: {
        takeaways: [
          'A classe é escolhida por objeto e depende do **padrão de acesso**.',
          'Só Glacier Flexible e Deep Archive exigem restauração; One Zone-IA e Express One Zone ficam em uma AZ.',
          'Todas as classes têm 11 noves de durabilidade.',
        ],
      },
    },
    // -----------------------------------------------------------------------
    {
      id: 's3x.f02.m2',
      title: 'Otimizador de custos',
      type: 'mission',
      summary: 'Escolher a classe de quatro perfis de dados dentro de um orçamento, com a conta calculada ao vivo.',
      briefing: {
        company: COMPANY,
        role: ROLE,
        situation: `Hoje tudo está no S3 Standard e a conta mensal estimada desses dados passa de ${formatUSD(totalFor(REGION, BEFORE.map(([p]) => [p, 'STANDARD'])))}. A diretoria aprovou um orçamento de ${formatUSD(650)} por mês — sem abrir mão dos requisitos clínicos e legais.`,
        objective: 'Escolher, para cada perfil, a classe que atende aos requisitos com o menor custo.',
        successCriteria: ['Respeitar leitura imediata e resiliência quando exigidas', 'Ficar dentro de 10% do menor custo possível em cada perfil', 'Fechar o mês dentro do orçamento'],
      },
      intel: [
        {
          conceptId: 's3.pricing',
          body: ['A conta soma **armazenamento** (GB-mês), **requisições**, **recuperação** (GB lido em IA e Glacier), **monitoramento** e **transferência**. O preço também varia por **Região**.'],
        },
        {
          conceptId: 's3.min-duration',
          body: ['Classes IA e Glacier IR cobram cada objeto como no mínimo **128 KB** e têm **duração mínima** (30, 90 ou 180 dias). Objetos arquivados somam **40 KB** de metadados cada.'],
        },
        {
          conceptId: 'sc.glacier-ir',
          body: ['**Glacier IR**: armazenamento muito barato com leitura imediata, mas recuperação mais cara. Brilha com acesso **trimestral**.'],
        },
        {
          conceptId: 'sc.deep-archive',
          body: ['**Deep Archive**: o menor preço do S3, com restauração Bulk em até 48 h. Brilha em retenção de anos.'],
        },
      ],
      activities: [
        {
          id: 's3x.f02.m2.a1',
          kind: 'lab',
          lab: 'cost',
          title: 'Otimizador de custos da VitaImagem',
          prompt: 'Escolha uma classe para cada perfil. A conta mensal aparece ao vivo; os requisitos e a comparação completa só são avaliados ao verificar.',
          concepts: [{ id: 'sc.standard' }, { id: 'sc.glacier-ir' }, { id: 'sc.deep-archive' }, { id: 's3.min-duration' }, { id: 's3.pricing' }],
          xp: 80,
          difficulty: 3,
          hints: [
            'Requisitos primeiro: leitura imediata elimina Glacier Flexible e Deep Archive; dados não recriáveis eliminam as classes de uma AZ.',
            'Para as miniaturas, observe o tamanho do objeto e o mínimo faturável de 128 KB.',
          ],
          explanation: [
            'Exames do mês: Standard (a taxa de recuperação das classes IA pesa com tanto acesso). Exames antigos: Glacier Instant Retrieval (acesso raro e imediato). Arquivo legal: Deep Archive (prazo de 48 h permite Bulk). Prévias: Standard (objetos de 24 KB pagam como 128 KB nas classes IA).',
          ],
          config: {
            region: REGION,
            tolerance: 0.1,
            budgetUSD: 650,
            profiles: [
              { ...EXAMES_RECENTES, concepts: ['sc.standard'] },
              { ...EXAMES_ANTIGOS, concepts: ['sc.glacier-ir'] },
              { ...ARQUIVO_LEGAL, concepts: ['sc.deep-archive'] },
              { ...PREVIAS, concepts: ['s3.min-duration'] },
            ],
          },
        },
      ],
      debrief: {
        takeaways: [
          'O menor preço por GB raramente é o menor custo total: recuperação, requisições e mínimos mudam a conta.',
          'Requisitos de acesso e resiliência eliminam opções antes de qualquer comparação de preço.',
          'Objetos pequenos e classes com mínimo de 128 KB não combinam.',
        ],
      },
    },
    // -----------------------------------------------------------------------
    {
      id: 's3x.f02.m3',
      title: 'A armadilha da classe barata',
      type: 'mission',
      summary: 'Prever, com o simulador, quando uma mudança de classe aumenta a conta.',
      briefing: {
        company: COMPANY,
        role: ROLE,
        situation: 'Circula na empresa uma planilha com sugestões de economia. Todas usam só o preço por GB. Antes de aprovar qualquer uma, você vai prever o efeito na conta — e o simulador vai conferir.',
        objective: 'Identificar quais mudanças economizam de verdade.',
        successCriteria: ['Prever o efeito de cada mudança', 'Explicar o que domina o custo em cada caso'],
      },
      intel: [
        {
          conceptId: 's3.min-duration',
          body: ['Lembre: **128 KB** mínimos em IA e Glacier IR; **40 KB** de metadados por objeto no Glacier Flexible e no Deep Archive; **duração mínima** de 30, 90 ou 180 dias.'],
        },
        {
          conceptId: 's3.restore',
          body: ['Ler dados do Glacier Flexible ou do Deep Archive exige **restaurar** antes: Expedited (minutos, caro), Standard (horas) ou Bulk (o mais barato).'],
        },
      ],
      activities: [
        {
          id: 's3x.f02.m3.a1',
          kind: 'predict',
          title: 'Miniaturas para One Zone-IA',
          prompt: 'Sugestão 1: mover as **40 milhões de miniaturas de 24 KB** do Standard para o **One Zone-IA**, "que é bem mais barato por GB". O que acontece com a conta mensal delas?',
          concepts: [{ id: 's3.min-duration' }, { id: 'sc.onezone-ia' }],
          xp: 30,
          difficulty: 2,
          explanation: ['No One Zone-IA, cada objeto paga como 128 KB e cada GB lido é cobrado. Para objetos pequenos e muito acessados, a conta sobe.'],
          spec: { sim: 'cost-change', region: REGION, profile: PREVIAS, from: 'STANDARD', to: 'ONEZONE_IA' },
          options: [
            { id: 'o1', text: 'Cai mais de 20%', outcome: 'down' },
            { id: 'o2', text: 'Fica praticamente igual', outcome: 'flat' },
            { id: 'o3', text: 'Sobe', outcome: 'up' },
          ],
        },
        {
          id: 's3x.f02.m3.a2',
          kind: 'predict',
          title: 'Exames do mês para Standard-IA',
          prompt: 'Sugestão 2: mover os **exames do mês** (6 TB lidos por mês) para o **Standard-IA**. O que acontece?',
          concepts: [{ id: 'sc.standard-ia' }, { id: 's3.pricing' }],
          xp: 30,
          difficulty: 2,
          explanation: ['O armazenamento cai quase pela metade, mas a recuperação de 6 TB por mês e as requisições mais caras superam a economia.'],
          spec: { sim: 'cost-change', region: REGION, profile: EXAMES_RECENTES, from: 'STANDARD', to: 'STANDARD_IA' },
          options: [
            { id: 'o1', text: 'Cai mais de 20%', outcome: 'down' },
            { id: 'o2', text: 'Fica praticamente igual', outcome: 'flat' },
            { id: 'o3', text: 'Sobe', outcome: 'up' },
          ],
        },
        {
          id: 's3x.f02.m3.a3',
          kind: 'predict',
          title: 'Arquivar logs pequenos',
          prompt: `Sugestão 3: transicionar **50 milhões de logs de 16 KB** do Standard para o **Glacier Flexible Retrieval**. Sem contar a transição única (≈ ${formatUSD(logsTransitionCost)}), o que acontece com a conta mensal?`,
          concepts: [{ id: 's3.min-duration' }, { id: 'sc.glacier-flexible' }],
          xp: 40,
          difficulty: 3,
          explanation: [
            'Os 40 KB de metadados por objeto (8 KB deles no preço do Standard) são maiores que os próprios logs. A economia mensal é mínima — e a transição única custa caro.',
            'Por isso, desde setembro de 2024, o lifecycle não transiciona objetos menores que 128 KB por padrão. Agrupar logs em arquivos maiores antes de arquivar resolve.',
          ],
          spec: { sim: 'cost-change', region: REGION, profile: LOGS_PEQUENOS, from: 'STANDARD', to: 'GLACIER' },
          options: [
            { id: 'o1', text: 'Cai mais de 20%', outcome: 'down' },
            { id: 'o2', text: 'Fica praticamente igual', outcome: 'flat' },
            { id: 'o3', text: 'Sobe', outcome: 'up' },
          ],
        },
        {
          id: 's3x.f02.m3.a4',
          kind: 'predict',
          title: 'A melhor para os exames antigos',
          prompt: 'Entre as classes que permitem **leitura imediata**, qual é a mais barata para os **exames de 1 a 12 meses**?',
          concepts: [{ id: 'sc.glacier-ir' }, { id: 'sc.standard-ia' }, { id: 'sc.intelligent-tiering' }],
          xp: 30,
          difficulty: 2,
          explanation: ['Com acesso trimestral, o armazenamento barato do Glacier Instant Retrieval compensa a recuperação mais cara.'],
          spec: { sim: 'cost-cheapest', region: REGION, profile: EXAMES_ANTIGOS, candidates: ['STANDARD_IA', 'GLACIER_IR', 'INTELLIGENT_TIERING'], compliantOnly: true },
          options: [
            { id: 'o1', text: 'S3 Standard-IA', outcome: 'STANDARD_IA' },
            { id: 'o2', text: 'S3 Glacier Instant Retrieval', outcome: 'GLACIER_IR' },
            { id: 'o3', text: 'S3 Intelligent-Tiering', outcome: 'INTELLIGENT_TIERING' },
          ],
        },
        {
          id: 's3x.f02.m3.a5',
          kind: 'decision',
          title: 'Glacier: serviço ou classe?',
          prompt: 'Um fornecedor sugere criar **vaults no Amazon Glacier** para o arquivo legal, em vez de usar o S3. A VitaImagem nunca usou o serviço. O que você responde?',
          concepts: [{ id: 'glacier.vault-service' }, { id: 'sc.deep-archive' }],
          xp: 30,
          difficulty: 1,
          explanation: ['O serviço Amazon Glacier original (vaults) não aceita novos clientes desde 15/12/2025. A recomendação atual são as classes S3 Glacier, usadas pela API do S3.'],
          options: [
            { id: 'a', text: 'Usar a classe S3 Glacier Deep Archive no próprio S3.', correct: true, consequence: 'O arquivo fica no S3, com as mesmas políticas, lifecycle e ferramentas dos demais dados.', impacts: { custo: 1 } },
            { id: 'b', text: 'Criar vaults no serviço Amazon Glacier.', correct: false, consequence: 'O serviço de vaults não aceita novos clientes desde 15/12/2025. A VitaImagem nem conseguiria começar a usá-lo.' },
            { id: 'c', text: 'Tanto faz: vaults e classes S3 Glacier são a mesma coisa.', correct: false, consequence: 'Não são: o serviço de vaults tem API própria e objetos em classes S3 Glacier não aparecem nele.' },
          ],
        },
      ],
      debrief: {
        takeaways: [
          'Mínimo de 128 KB e taxa de recuperação podem transformar "economia" em aumento.',
          'Arquivar milhões de objetos pequenos quase não economiza e custa caro em transições.',
          'O arquivamento atual é feito pelas classes S3 Glacier; o serviço de vaults não aceita novos clientes.',
        ],
      },
    },
    // -----------------------------------------------------------------------
    {
      id: 's3x.f02.boss',
      title: 'Chefe: a conta que dobrou',
      type: 'boss',
      summary: 'Investigar uma fatura que mais que dobrou depois de "otimizações" e decidir o que fazer com dados de acesso imprevisível.',
      briefing: {
        company: COMPANY,
        role: ROLE,
        situation: `Enquanto você estava de férias, um estagiário "otimizou" as classes. A estimativa mensal desses dados foi de ${formatUSD(totalBefore)} para ${formatUSD(totalAfter)}. A diretoria quer saber o que aconteceu — e como evitar que se repita.`,
        objective: 'Encontrar as linhas responsáveis, a causa raiz e as correções certas.',
        successCriteria: ['Marcar as linhas da fatura que explicam o aumento', 'Apontar a causa raiz', 'Escolher as correções', 'Decidir a classe do banco de pesquisa'],
      },
      intel: [],
      activities: [
        {
          id: 's3x.f02.boss.a1',
          kind: 'investigate',
          title: 'A fatura de outubro',
          prompt: 'Compare as linhas da fatura (antes → depois) e o registro de mudanças. Marque as evidências, a causa raiz e as correções.',
          concepts: [{ id: 's3.pricing' }, { id: 's3.min-duration' }, { id: 'sc.standard-ia' }, { id: 'sc.deep-archive' }],
          xp: 90,
          difficulty: 3,
          explanation: [
            'Três mudanças explicam o aumento: exames do mês em Standard-IA (taxa de recuperação), miniaturas em One Zone-IA (mínimo de 128 KB) e arquivo legal no Glacier IR (preço por GB muito acima do Deep Archive).',
            'A causa comum: decisões tomadas pelo preço por GB, sem olhar padrão de acesso, tamanho dos objetos e requisitos.',
          ],
          scenario: [`Total estimado: ${formatUSD(totalBefore)} → ${formatUSD(totalAfter)} por mês. Os valores são calculados pelo simulador com a tabela de preços versionada.`],
          artifacts: [
            {
              id: 'bill',
              title: 'Fatura estimada — Amazon S3 (us-east-1)',
              format: 'table',
              lines: [
                line(EXAMES_RECENTES, 'STANDARD', 'STANDARD_IA', 'storage'),
                line(EXAMES_RECENTES, 'STANDARD', 'STANDARD_IA', 'retrieval'),
                line(EXAMES_ANTIGOS, 'GLACIER_IR', 'GLACIER_IR', 'storage'),
                line(ARQUIVO_LEGAL, 'DEEP_ARCHIVE', 'GLACIER_IR', 'storage'),
                line(PREVIAS, 'STANDARD', 'ONEZONE_IA', 'storage'),
                line(PREVIAS, 'STANDARD', 'ONEZONE_IA', 'retrieval'),
              ],
            },
            {
              id: 'changelog',
              title: 'Registro de mudanças',
              format: 'log',
              lines: [
                { id: 'ch1', text: '02/10 — exames do mês: classe padrão alterada para STANDARD_IA ("GB 45% mais barato")', isIssue: true, explanation: 'Mudança feita pelo preço por GB, ignorando os milhares de leituras diárias.' },
                { id: 'ch2', text: '03/10 — prévias: copiadas para ONEZONE_IA ("podem ser recriadas")', isIssue: true, explanation: 'Recriáveis, sim — mas objetos de 24 KB pagam como 128 KB.' },
                { id: 'ch3', text: '03/10 — arquivo legal: restaurado e copiado para GLACIER_IR ("acesso imediato é melhor")', isIssue: true, explanation: 'Acesso imediato não é requisito do arquivo legal; o Deep Archive já atendia ao prazo de 48 h.' },
                { id: 'ch4', text: '05/10 — criptografia padrão SSE-S3 confirmada em todos os buckets', isIssue: false, explanation: 'SSE-S3 não tem custo adicional e não explica o aumento.' },
                { id: 'ch5', text: '06/10 — política de acesso revisada (sem mudanças)', isIssue: false, explanation: 'Só revisou permissões: não altera o custo.' },
              ],
            },
          ],
          rootCause: {
            prompt: 'Qual é a causa raiz?',
            options: [
              { id: 'r1', text: 'As classes foram escolhidas pelo preço por GB, sem considerar padrão de acesso, tamanho dos objetos e requisitos.', correct: true, feedback: 'Exato: as três mudanças erram pelo mesmo motivo.' },
              { id: 'r2', text: 'A AWS aumentou os preços do S3 em outubro.', correct: false, feedback: 'Os preços usados antes e depois são os mesmos; a conta mudou pelas classes.' },
              { id: 'r3', text: 'Um vazamento de dados gerou muitos downloads.', correct: false, feedback: 'A transferência para a internet não mudou; o aumento vem de recuperação e armazenamento.' },
              { id: 'r4', text: 'A criptografia SSE-S3 passou a ser cobrada.', correct: false, feedback: 'SSE-S3 não tem custo adicional.' },
            ],
          },
          remediations: {
            prompt: 'Quais correções aplicar? (selecione todas as adequadas)',
            options: [
              { id: 'f1', text: 'Voltar os exames do mês para o S3 Standard.', correct: true, feedback: 'Elimina a taxa de recuperação dos dados mais acessados.' },
              { id: 'f2', text: 'Manter as prévias no S3 Standard.', correct: true, feedback: 'Objetos pequenos e muito lidos ficam mais baratos no Standard.' },
              { id: 'f3', text: 'Devolver o arquivo legal ao S3 Glacier Deep Archive.', correct: true, feedback: 'Atende ao prazo de 48 h com o menor preço.' },
              { id: 'f4', text: 'Mover os exames antigos para o S3 Standard, por segurança.', correct: false, feedback: 'O Glacier Instant Retrieval já era a melhor escolha para eles.' },
              { id: 'f5', text: 'Mover tudo para One Zone-IA.', correct: false, feedback: 'Dados clínicos e legais não podem depender de uma única AZ.' },
              { id: 'f6', text: 'Desativar a criptografia para economizar.', correct: false, feedback: 'SSE-S3 não tem custo e protege dados sensíveis.' },
            ],
          },
        },
        {
          id: 's3x.f02.boss.a2',
          kind: 'decision',
          title: 'O banco de pesquisa imprevisível',
          prompt: 'O banco de imagens de pesquisa (≈ 11 TB) às vezes fica meses parado e às vezes é lido inteiro durante semanas. Ninguém sabe prever. Qual estratégia?',
          concepts: [{ id: 'sc.intelligent-tiering' }, { id: 'sc.glacier-ir' }],
          xp: 50,
          difficulty: 3,
          scenario: [
            `Num mês parado: Standard ${cost(quiet, 'STANDARD')} · Glacier IR ${cost(quiet, 'GLACIER_IR')} · Intelligent-Tiering ${cost(quiet, 'INTELLIGENT_TIERING')}.`,
            `Num mês de estudo intenso (≈ 23 TB lidos): Standard ${cost(intense, 'STANDARD')} · Glacier IR ${cost(intense, 'GLACIER_IR')} · Intelligent-Tiering ${cost(intense, 'INTELLIGENT_TIERING')}.`,
          ],
          explanation: [
            'O Intelligent-Tiering nunca é o pior: fica perto do mais barato no mês parado e evita a taxa de recuperação no mês intenso. Com padrão imprevisível, ele reduz o risco sem exigir regras.',
          ],
          options: [
            { id: 'a', text: 'S3 Intelligent-Tiering', correct: true, consequence: `Mês parado: ${cost(quiet, 'INTELLIGENT_TIERING')}; mês intenso: ${cost(intense, 'INTELLIGENT_TIERING')}. Sem surpresas e sem taxa de recuperação.`, impacts: { custo: 1 } },
            { id: 'b', text: 'S3 Glacier Instant Retrieval', correct: false, consequence: `Ótimo no mês parado (${cost(quiet, 'GLACIER_IR')}), mas no mês intenso a recuperação leva a conta a ${cost(intense, 'GLACIER_IR')}.`, impacts: { custo: -1 } },
            { id: 'c', text: 'S3 Standard', correct: false, consequence: `Seguro no mês intenso (${cost(intense, 'STANDARD')}), mas paga caro nos meses parados (${cost(quiet, 'STANDARD')}).`, impacts: { custo: -1 } },
            { id: 'd', text: 'S3 Glacier Deep Archive', correct: false, consequence: 'Os pesquisadores precisam de leitura imediata; esperar até 12 horas por restauração inviabiliza os estudos.', impacts: { desempenho: -2 } },
          ],
          justification: {
            prompt: 'Por que essa escolha?',
            options: [
              { id: 'j1', text: 'Com acesso imprevisível, mover objetos automaticamente entre tiers, sem taxa de recuperação, evita o pior caso.', correct: true, feedback: 'Isso: o Intelligent-Tiering troca uma pequena taxa de monitoramento por proteção contra os dois extremos.' },
              { id: 'j2', text: 'O Intelligent-Tiering é sempre a classe mais barata.', correct: false, feedback: 'Não é: com padrão conhecido, uma classe fixa pode sair mais barata.' },
              { id: 'j3', text: 'O Intelligent-Tiering tem durabilidade maior.', correct: false, feedback: 'A durabilidade é a mesma de todas as classes.' },
            ],
          },
        },
      ],
      debrief: {
        takeaways: [
          'Uma conta que sobe depois de "otimizar" quase sempre esconde recuperação, requisições, mínimos ou requisitos ignorados.',
          'Para padrão de acesso imprevisível, o Intelligent-Tiering reduz o risco.',
          'Decisões de classe devem partir do padrão de acesso e dos requisitos — o preço por GB vem depois.',
        ],
      },
    },
  ],
}
