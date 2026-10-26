/** Fase 11 — Transferência de grandes volumes (empresa fictícia: Cine Memória). */
import type { PhaseDef } from '../../../../../engine/types'
import type { TransferLabConfig } from '../../../../../simulators/transfer/lab'
import { formatDays, networkDays, type TransferMethod, type TransferScenario } from '../../../../../simulators/transfer/model'

const COMPANY = 'Cine Memória'
const ROLE = 'Você comanda a migração do acervo de filmes para a AWS.'
const METHODS: TransferMethod[] = ['internet-cli', 'datasync-internet', 'datasync-dx', 'terminal', 'snowball']

const sc = (p: TransferScenario): TransferScenario => p

const M2_LAB: TransferLabConfig = {
  methods: METHODS,
  scenarios: [
    sc({
      id: 'acervo',
      name: 'Acervo digitalizado',
      description: '400 TB de filmes restaurados, que não mudam mais. O link de 1 Gbps é compartilhado com o escritório: só metade pode ser usada. Um parceiro oferece uma conexão hospedada do Direct Connect.',
      dataTB: 400,
      linkMbps: 1000,
      usableShare: 0.5,
      deadlineDays: 30,
      enterpriseSupport: false,
      newSnowCustomer: true,
      ongoingChanges: false,
      directConnect: { gbps: 10, leadDays: 14 },
      concepts: ['mig.direct-connect', 'mig.network-math'],
    }),
    sc({
      id: 'edicao',
      name: 'Servidor de edição',
      description: '20 TB de projetos em andamento, alterados todos os dias até a virada. Link de 1 Gbps, 60% utilizável.',
      dataTB: 20,
      linkMbps: 1000,
      usableShare: 0.6,
      deadlineDays: 14,
      enterpriseSupport: false,
      newSnowCustomer: true,
      ongoingChanges: true,
      concepts: ['mig.datasync'],
    }),
    sc({
      id: 'campo',
      name: 'Gravações de campo',
      description: '150 TB gravados em discos portáteis numa expedição. A produtora tem Enterprise Support; o escritório regional tem só 200 Mbps.',
      dataTB: 150,
      linkMbps: 200,
      usableShare: 0.8,
      deadlineDays: 10,
      enterpriseSupport: true,
      newSnowCustomer: true,
      ongoingChanges: false,
      terminalDays: 3,
      concepts: ['mig.transfer-terminal'],
    }),
  ],
}

const BOSS_LAB: TransferLabConfig = {
  methods: METHODS,
  scenarios: [
    sc({ id: 'onda1', name: 'Onda 1 — acervo frio', description: '800 TB que não mudam. Link de 10 Gbps, 30% utilizável fora do horário comercial.', dataTB: 800, linkMbps: 10000, usableShare: 0.3, deadlineDays: 45, enterpriseSupport: true, newSnowCustomer: true, ongoingChanges: false, concepts: ['mig.network-math'] }),
    sc({ id: 'onda2', name: 'Onda 2 — projetos ativos', description: '60 TB alterados até o último dia. Mesmo link, 30% utilizável.', dataTB: 60, linkMbps: 10000, usableShare: 0.3, deadlineDays: 7, enterpriseSupport: true, newSnowCustomer: true, ongoingChanges: true, concepts: ['mig.datasync'] }),
    sc({ id: 'filial', name: 'Filial do interior', description: '90 TB já copiados em discos portáteis; a filial tem 100 Mbps.', dataTB: 90, linkMbps: 100, usableShare: 1, deadlineDays: 20, enterpriseSupport: true, newSnowCustomer: true, ongoingChanges: false, terminalDays: 4, concepts: ['mig.transfer-terminal'] }),
  ],
}

const d100 = networkDays(100, 1000)
const d400 = networkDays(400, 500)

export const F11: PhaseDef = {
  id: 's3x.f11',
  order: 11,
  title: 'Transferência de grandes volumes',
  subtitle: 'Snow Family e as alternativas atuais',
  summary: 'Migre centenas de terabytes comparando rede, DataSync, Data Transfer Terminal e o legado da Snow Family.',
  glyph: 'truck',
  color: '#f2a0c8',
  requires: ['s3x.f01'],
  recommends: ['s3x.f02'],
  concepts: [
    'mig.network-math',
    'mig.datasync',
    'mig.direct-connect',
    'mig.transfer-terminal',
    'mig.snow-legacy',
    'mig.outposts',
    's3.transfer-acceleration',
    // Revisitados de outras fases:
    'sgw.fsx-file',
    'glacier.vault-service',
    'sc.deep-archive',
  ],
  availability: 'available',
  estimatedMinutes: 35,
  map: { x: 300, y: 680 },
  simplifications: [
    'Tempo de rede = volume × 8 ÷ (banda utilizável × 80% de aproveitamento), com TB decimal.',
    'Prazos de provisionamento do Direct Connect e de logística até o Data Transfer Terminal são premissas dos cenários, não dados da AWS.',
    'Custos de transferência não entram na comparação.',
  ],
  missions: [
    // -----------------------------------------------------------------------
    {
      id: 's3x.f11.m1',
      title: 'Rede ou caminhão?',
      type: 'mission',
      summary: 'Calcular quanto tempo a rede leva — antes de decidir.',
      briefing: {
        company: COMPANY,
        role: ROLE,
        situation: 'A Cine Memória vai levar o acervo inteiro para a AWS. Alguém sugeriu "mandar pela internet no fim de semana". Outra pessoa quer "pedir aquele dispositivo da AWS".',
        objective: 'Fazer a conta e conhecer as opções atuais.',
        successCriteria: ['Estimar dois tempos de transferência', 'Responder sobre a Snow Family'],
      },
      intel: [
        {
          conceptId: 'mig.network-math',
          body: ['Tempo ≈ **volume × 8 ÷ (banda × aproveitamento)**. Bytes viram bits (× 8); o aproveitamento real raramente passa de ~80%. 1 TB = 10¹² bytes; 1 Gbps = 10⁹ bits/s.'],
        },
        {
          conceptId: 'mig.snow-legacy',
          body: ['A **Snow Family** (Snowball Edge) não é mais oferecida a **novos clientes**. A AWS indica **DataSync** (online), **Data Transfer Terminal** (físico), **parceiros** e, para computação na borda, **Outposts**.'],
        },
      ],
      activities: [
        {
          id: 's3x.f11.m1.a1',
          kind: 'estimate',
          title: '100 TB num link de 1 Gbps',
          prompt: 'Quantos dias leva enviar **100 TB** por um link de **1 Gbps** dedicado, com 80% de aproveitamento?',
          concepts: [{ id: 'mig.network-math' }],
          xp: 40,
          difficulty: 2,
          scenario: ['100 × 10¹² bytes × 8 = 8 × 10¹⁴ bits. Banda efetiva: 0,8 × 10⁹ bits/s. Divida e converta segundos em dias (86.400 s).'],
          explanation: [`8 × 10¹⁴ ÷ 8 × 10⁸ = 10⁶ segundos ≈ ${formatDays(d100)}.`],
          unit: 'dias',
          min: 1,
          max: 100,
          step: 0.5,
          answer: Math.round(d100 * 10) / 10,
          tolerance: 0.1,
        },
        {
          id: 's3x.f11.m1.a2',
          kind: 'estimate',
          title: 'O "fim de semana"',
          prompt: 'O acervo tem **400 TB**, e só **500 Mbps** do link podem ser usados. Quantos dias, com 80% de aproveitamento?',
          concepts: [{ id: 'mig.network-math' }],
          xp: 40,
          difficulty: 2,
          explanation: [`400 × 10¹² × 8 ÷ (0,8 × 500 × 10⁶) = 8 × 10⁶ s ≈ ${formatDays(d400)}. Nada de fim de semana.`],
          unit: 'dias',
          min: 1,
          max: 1000,
          step: 1,
          scale: 'log',
          answer: Math.round(d400),
          tolerance: 0.1,
        },
        {
          id: 's3x.f11.m1.a3',
          kind: 'decision',
          title: '"Pede o Snowball"',
          prompt: 'A Cine Memória nunca usou a Snow Family. Um colega sugere encomendar dispositivos Snowball Edge para levar o acervo. O que você responde?',
          concepts: [{ id: 'mig.snow-legacy' }],
          xp: 30,
          difficulty: 1,
          explanation: ['A AWS não oferece mais dispositivos da Snow Family a novos clientes. As alternativas atuais são DataSync (online, com ou sem Direct Connect), Data Transfer Terminal e soluções de parceiros.'],
          options: [
            { id: 'a', text: 'Não é possível para novos clientes; vamos avaliar DataSync (com ou sem Direct Connect), Data Transfer Terminal ou parceiros.', correct: true, consequence: 'O plano parte de opções que a empresa consegue contratar hoje.', impacts: { disponibilidade: 1 } },
            { id: 'b', text: 'Encomendar o Snowball Edge pelo console.', correct: false, consequence: 'O pedido não seria possível: a Snow Family não é oferecida a novos clientes.' },
            { id: 'c', text: 'Pedir um Snowmobile.', correct: false, consequence: 'A Snow Family inteira deixou de ser oferecida a novos clientes.' },
          ],
        },
      ],
      debrief: {
        takeaways: ['Faça a conta: 100 TB em 1 Gbps levam mais de 11 dias.', 'A Snow Family não aceita novos clientes; as alternativas são DataSync, Direct Connect, Data Transfer Terminal e parceiros.'],
      },
    },
    // -----------------------------------------------------------------------
    {
      id: 's3x.f11.m2',
      title: 'Data Migration Challenge',
      type: 'mission',
      summary: 'Escolher o método certo para três cenários de migração diferentes.',
      briefing: {
        company: COMPANY,
        role: ROLE,
        situation: 'Três conjuntos de dados, três realidades: um acervo enorme e estático, um servidor que muda todo dia e discos que voltaram de uma expedição.',
        objective: 'Cumprir os três prazos com opções disponíveis.',
        successCriteria: ['Prazo cumprido em cada cenário', 'Mudanças sincronizadas onde necessário', 'Só opções disponíveis para a empresa'],
      },
      intel: [
        {
          conceptId: 'mig.datasync',
          body: ['**DataSync**: transferência online incremental, com validação e criptografia, de NFS, SMB, HDFS e armazenamento de objetos para S3, EFS e FSx. Uma tarefa usa até um link de 10 Gbps.'],
        },
        {
          conceptId: 'mig.direct-connect',
          body: ['Link insuficiente? Uma **conexão hospedada do Direct Connect**, contratada de um parceiro pelo período do projeto, acelera o DataSync.'],
        },
        {
          conceptId: 'mig.transfer-terminal',
          body: ['**Data Transfer Terminal**: você leva **seus discos** a uma instalação da AWS, reservada pelo console, e envia os dados em alta velocidade. Hoje, só para clientes **Enterprise Support**.'],
        },
      ],
      activities: [
        {
          id: 's3x.f11.m2.a1',
          kind: 'lab',
          lab: 'transfer',
          title: 'Três migrações',
          prompt: 'Escolha um método para cada cenário. A estimativa aparece ao escolher; a comparação completa aparece ao verificar.',
          concepts: [{ id: 'mig.network-math' }, { id: 'mig.datasync' }, { id: 'mig.direct-connect' }, { id: 'mig.transfer-terminal' }],
          xp: 110,
          difficulty: 3,
          hints: ['Faça a conta da rede antes: o prazo cabe?', 'Dados que mudam até a virada pedem transferência incremental.', 'Confira os requisitos de cada opção (Enterprise Support, novos clientes).'],
          explanation: ['Acervo: DataSync com Direct Connect hospedado. Servidor de edição: DataSync pela internet (incremental). Gravações de campo: Data Transfer Terminal.'],
          config: M2_LAB,
        },
      ],
      debrief: {
        takeaways: ['Calcule o tempo de transferência pela rede antes de decidir se a migração pode ser online.', 'Se os dados continuam mudando durante a migração, use o DataSync, que a cada execução copia só o que mudou.', 'Com os dados já em discos e um link fraco, use o Data Transfer Terminal (exige Enterprise Support) ou um parceiro.'],
      },
    },
    // -----------------------------------------------------------------------
    {
      id: 's3x.f11.m3',
      title: 'Arquivo histórico: a Snow Family e o que a substitui',
      type: 'mission',
      summary: 'Mapear as opções antigas para as atuais — e não cair em respostas desatualizadas.',
      briefing: {
        company: COMPANY,
        role: ROLE,
        situation: 'O material de estudo da equipe é de alguns anos atrás e recomenda Snowball para tudo. Você vai atualizar o guia interno.',
        objective: 'Saber o que é atual, o que é legado e o que usar no lugar.',
        successCriteria: ['Associar o legado às alternativas', 'Classificar disponibilidade', 'Escolher Transfer Acceleration quando faz sentido'],
      },
      intel: [
        {
          conceptId: 'mig.outposts',
          body: ['Para **computação na borda** (o papel do Snowball Edge Compute Optimized), a alternativa indicada é o **AWS Outposts**: infraestrutura da AWS no local, gerenciada pela AWS.'],
        },
        {
          conceptId: 's3.transfer-acceleration',
          body: ['**S3 Transfer Acceleration** usa as edge locations do **CloudFront** para acelerar transferências de **longa distância** até um bucket. Não aumenta a banda do seu link.'],
        },
      ],
      activities: [
        {
          id: 's3x.f11.m3.a1',
          kind: 'match',
          title: 'O que usar no lugar',
          prompt: 'Associe cada necessidade antiga à opção atual indicada pela AWS.',
          concepts: [{ id: 'mig.snow-legacy' }, { id: 'mig.outposts' }],
          xp: 50,
          difficulty: 2,
          explanation: ['A documentação da mudança de disponibilidade indica DataSync para transferências online, Direct Connect hospedado quando falta banda, Data Transfer Terminal e parceiros para transferências físicas e Outposts para computação na borda.'],
          leftLabel: 'Necessidade',
          rightLabel: 'Opção atual',
          pairs: [
            { id: 'p1', left: 'Migrar dados pela rede, com verificação e sincronização incremental', right: 'AWS DataSync', explanation: 'Transferência online gerenciada.', concepts: ['mig.datasync'] },
            { id: 'p2', left: 'A internet é lenta demais para o volume', right: 'DataSync com conexão hospedada do Direct Connect', explanation: 'Banda dedicada pelo período do projeto.', concepts: ['mig.direct-connect'] },
            { id: 'p3', left: 'Enviar discos já gravados, por um caminho físico', right: 'AWS Data Transfer Terminal', explanation: 'Seus dispositivos, numa instalação da AWS.', concepts: ['mig.transfer-terminal'] },
            { id: 'p4', left: 'Rodar aplicações na borda, perto dos dados (antigo Snowball Edge Compute)', right: 'AWS Outposts', explanation: 'Infraestrutura AWS no local.', concepts: ['mig.outposts'] },
          ],
        },
        {
          id: 's3x.f11.m3.a2',
          kind: 'classify',
          title: 'Disponível para quem começa hoje?',
          prompt: 'Para uma empresa que nunca usou esses serviços, classifique cada opção.',
          concepts: [{ id: 'mig.snow-legacy' }],
          xp: 40,
          difficulty: 2,
          explanation: ['Snow Family, FSx File Gateway e o serviço Amazon Glacier (vaults) não aceitam novos clientes. As demais opções estão disponíveis (o Data Transfer Terminal, hoje, para clientes Enterprise Support).'],
          bins: [
            { id: 'yes', label: 'Disponível' },
            { id: 'no', label: 'Sem novos clientes' },
          ],
          items: [
            { id: 'o1', text: 'AWS DataSync', bin: 'yes', explanation: 'Disponível para novos clientes.', concepts: ['mig.datasync'] },
            { id: 'o2', text: 'AWS Snowball Edge', bin: 'no', explanation: 'A Snow Family não é oferecida a novos clientes.', concepts: ['mig.snow-legacy'] },
            { id: 'o3', text: 'Amazon FSx File Gateway', bin: 'no', explanation: 'Sem novos clientes desde 28/10/2024.', concepts: ['sgw.fsx-file'] },
            { id: 'o4', text: 'Serviço Amazon Glacier (vaults)', bin: 'no', explanation: 'Sem novos clientes desde 15/12/2025; use as classes S3 Glacier.', concepts: ['glacier.vault-service'] },
            { id: 'o5', text: 'Classe S3 Glacier Deep Archive', bin: 'yes', explanation: 'As classes de arquivo do S3 seguem disponíveis.', concepts: ['sc.deep-archive'] },
            { id: 'o6', text: 'AWS Outposts', bin: 'yes', explanation: 'Disponível para novos clientes.', concepts: ['mig.outposts'] },
          ],
        },
        {
          id: 's3x.f11.m3.a3',
          kind: 'decision',
          title: 'Upload do outro lado do mundo',
          prompt: 'Equipes de filmagem em vários continentes enviam, todos os dias, dezenas de GB para um bucket em us-east-1. Os uploads são lentos por causa da distância. O que avaliar primeiro?',
          concepts: [{ id: 's3.transfer-acceleration' }],
          xp: 30,
          difficulty: 2,
          explanation: ['Transfer Acceleration foi feito para uploads frequentes de longa distância até um bucket central, usando as edge locations do CloudFront.'],
          options: [
            { id: 'a', text: 'Habilitar S3 Transfer Acceleration no bucket.', correct: true, consequence: 'Os uploads entram pela edge location mais próxima e seguem pela rede da AWS.', impacts: { desempenho: 2 } },
            { id: 'b', text: 'Data Transfer Terminal para cada envio diário.', correct: false, consequence: 'Logística física para dezenas de GB por dia não faz sentido.' },
            { id: 'c', text: 'Mudar o bucket para S3 One Zone-IA.', correct: false, consequence: 'A classe de armazenamento não muda a velocidade do upload.' },
          ],
        },
      ],
      debrief: {
        takeaways: ['Materiais antigos citam Snowball como resposta padrão; para novos clientes, use as alternativas atuais.', 'Outposts substitui o Snowball Edge na borda.', 'O Transfer Acceleration acelera envios de longa distância até um bucket central.'],
      },
    },
    // -----------------------------------------------------------------------
    {
      id: 's3x.f11.boss',
      title: 'Chefe: plano de migração em ondas',
      type: 'boss',
      summary: 'Planejar e executar a migração completa em ondas, até a virada.',
      briefing: {
        company: COMPANY,
        role: ROLE,
        situation: 'A diretoria aprovou a migração completa: acervo frio, projetos ativos e a filial do interior. A virada acontece num único fim de semana.',
        objective: 'Montar o plano em ondas e escolher o método de cada uma.',
        successCriteria: ['Ordenar as etapas', 'Escolher os métodos', 'Planejar a virada'],
      },
      intel: [],
      activities: [
        {
          id: 's3x.f11.boss.a1',
          kind: 'order',
          title: 'As etapas do plano',
          prompt: 'Ordene as etapas de uma migração em ondas.',
          concepts: [{ id: 'mig.network-math' }, { id: 'mig.datasync' }],
          xp: 40,
          difficulty: 2,
          explanation: ['Inventário e cálculo primeiro, piloto antes do volume, dados frios antes dos ativos, sincronização incremental até a virada e validação no fim.'],
          steps: [
            { id: 's1', text: 'Inventariar volumes, taxa de mudança e prazos', explanation: 'Sem números, não há plano.' },
            { id: 's2', text: 'Calcular o tempo de rede e escolher o método de cada onda', explanation: 'A conta define o caminho.' },
            { id: 's3', text: 'Fazer um piloto com uma amostra e medir a vazão real', explanation: 'A vazão real substitui as premissas.' },
            { id: 's4', text: 'Migrar os dados frios (onda 1)', explanation: 'O grosso do volume, sem pressão de mudanças.' },
            { id: 's5', text: 'Copiar os dados ativos e manter a sincronização incremental (onda 2)', explanation: 'Só as mudanças trafegam até a virada.' },
            { id: 's6', text: 'Na virada: congelar gravações, última sincronização, validar e apontar as aplicações para a AWS', explanation: 'A janela de parada fica pequena.' },
          ],
        },
        {
          id: 's3x.f11.boss.a2',
          kind: 'lab',
          lab: 'transfer',
          title: 'As três ondas',
          prompt: 'Escolha o método de cada onda.',
          concepts: [{ id: 'mig.network-math' }, { id: 'mig.datasync' }, { id: 'mig.transfer-terminal' }],
          xp: 110,
          difficulty: 3,
          hints: ['Onda 1: a conta da rede cabe no prazo?', 'Onda 2: os dados mudam até o fim.'],
          explanation: ['Onda 1: DataSync (ou upload pela rede) cabe no prazo. Onda 2: DataSync, pela sincronização incremental. Filial: Data Transfer Terminal.'],
          config: BOSS_LAB,
        },
        {
          id: 's3x.f11.boss.a3',
          kind: 'decision',
          title: 'A janela da virada',
          prompt: 'A Cine Memória vai migrar 60 TB de projetos ativos para a AWS pela rede. Os editores continuam alterando esses arquivos até o último dia, e a virada acontece num fim de semana. Como reduzir ao mínimo o tempo em que os editores ficam sem acesso durante a virada?',
          concepts: [{ id: 'mig.datasync' }],
          xp: 40,
          difficulty: 2,
          explanation: ['Com a cópia inicial feita e sincronizações incrementais frequentes, a última rodada transfere só o que mudou desde a anterior.'],
          options: [
            { id: 'a', text: 'Rodar o DataSync com frequência até a véspera e, na virada, congelar gravações e fazer só a última sincronização incremental.', correct: true, consequence: 'A parada dura o tempo de transferir as mudanças finais e validar.', impacts: { disponibilidade: 2 } },
            { id: 'b', text: 'Começar a cópia completa no início da janela de virada.', correct: false, consequence: 'A parada duraria dias.', impacts: { disponibilidade: -2 } },
            { id: 'c', text: 'Deixar os editores trabalhando durante a última cópia.', correct: false, consequence: 'Mudanças feitas durante a cópia podem ficar para trás.', impacts: { durabilidade: -1 } },
          ],
        },
      ],
      debrief: {
        takeaways: ['Um bom plano segue esta ordem: inventário dos dados, cálculo do tempo de transferência, piloto, migração em ondas e uma virada curta no final.', 'Dados ativos: sincronização incremental até o fim.', 'Escolha o método de cada onda pelos números e pelos requisitos.'],
      },
    },
  ],
}
