/** Fase 10 — Armazenamento híbrido com AWS Storage Gateway (empresa fictícia: Aço Forte Metalúrgica). */
import type { PhaseDef } from '../../../../../engine/types'
import type { GatewayLabConfig } from '../../../../../simulators/gateway/lab'
import type { Workload } from '../../../../../simulators/gateway/model'

const COMPANY = 'Aço Forte Metalúrgica'
const ROLE = 'Você coordena a modernização da infraestrutura das fábricas.'
const ALL = ['s3-file', 'fsx-file', 'volume-cached', 'volume-stored', 'tape'] as const

const w = (p: Workload): Workload => p

const M2_LAB: GatewayLabConfig = {
  options: [...ALL],
  workloads: [
    w({ id: 'eng', name: 'Servidor de desenhos técnicos (Linux)', description: 'Compartilhamento NFS. Uma aplicação de análise na AWS vai ler os mesmos arquivos direto do S3.', protocol: 'NFS', newCustomer: true, needs: { s3Objects: true }, concepts: ['sgw.s3-file'] }),
    w({ id: 'adm', name: 'Pastas departamentais (Windows)', description: 'Compartilhamento SMB do administrativo. A empresa nunca usou Storage Gateway.', protocol: 'SMB', newCustomer: true, needs: {}, concepts: ['sgw.fsx-file', 'sgw.s3-file'] }),
    w({ id: 'erp', name: 'Banco de dados do ERP', description: 'Volume em bloco (iSCSI). Todo o banco precisa de baixa latência no local; a cópia na AWS é para recuperação.', protocol: 'iSCSI', newCustomer: true, needs: { fullLocal: true }, concepts: ['sgw.volume-stored'] }),
    w({ id: 'cftv', name: 'Gravações de câmeras de segurança', description: 'Volume iSCSI que cresce sem parar; o servidor local tem pouco disco. Só as gravações recentes são consultadas.', protocol: 'iSCSI', newCustomer: true, needs: { limitedLocal: true }, concepts: ['sgw.volume-cached'] }),
    w({ id: 'bkp', name: 'Software de backup com fitas LTO', description: 'O software grava em uma biblioteca de fitas. A empresa quer acabar com as fitas físicas sem trocar o software.', protocol: 'VTL', newCustomer: true, needs: {}, concepts: ['sgw.tape'] }),
  ],
}

const BOSS_LAB: GatewayLabConfig = {
  options: [...ALL],
  workloads: [
    w({ id: 'qual', name: 'Laudos de qualidade em PDF', description: 'Pastas SMB. Um modelo de IA na AWS vai analisar os PDFs direto no S3.', protocol: 'SMB', newCustomer: true, needs: { s3Objects: true }, concepts: ['sgw.s3-file'] }),
    w({ id: 'mes', name: 'Sistema MES do chão de fábrica', description: 'Volume iSCSI. A produção não pode depender do link com a AWS para ler os dados.', protocol: 'iSCSI', newCustomer: true, needs: { fullLocal: true }, concepts: ['sgw.volume-stored'] }),
    w({ id: 'legado', name: 'Aplicação legada de projetos', description: 'Volume iSCSI de 40 TB num servidor com disco local de 4 TB. Só os projetos ativos são usados.', protocol: 'iSCSI', newCustomer: true, needs: { limitedLocal: true }, concepts: ['sgw.volume-cached'] }),
    w({ id: 'arquivo', name: 'Backups de fim de ano em fita', description: 'Retenção de 10 anos, quase nunca lidos, gravados pelo software de backup.', protocol: 'VTL', newCustomer: true, needs: {}, concepts: ['sgw.tape'] }),
  ],
}

export const F10: PhaseDef = {
  id: 's3x.f10',
  order: 10,
  title: 'Armazenamento híbrido: AWS Storage Gateway',
  subtitle: 'File, Volume e Tape Gateway',
  summary: 'Conecte o datacenter local à AWS escolhendo o gateway certo para cada sistema.',
  glyph: 'bridge',
  color: '#c792ea',
  requires: ['s3x.f01'],
  recommends: ['s3x.f02'],
  concepts: ['sgw.overview', 'sgw.s3-file', 'sgw.fsx-file', 'sgw.volume-cached', 'sgw.volume-stored', 'sgw.tape', 's3.restore'],
  availability: 'available',
  estimatedMinutes: 35,
  map: { x: 430, y: 590 },
  simplifications: [
    'O simulador escolhe o gateway por protocolo e requisitos; não considera tamanho de cache, banda nem cotas.',
    'O comportamento durante quedas de conexão é apresentado de forma conceitual.',
  ],
  missions: [
    // -----------------------------------------------------------------------
    {
      id: 's3x.f10.m1',
      title: 'Uma ponte entre dois mundos',
      type: 'mission',
      summary: 'Conhecer os tipos de gateway, seus protocolos e onde os dados ficam na AWS.',
      briefing: {
        company: COMPANY,
        role: ROLE,
        situation: 'A Aço Forte tem servidores de arquivos, volumes de banco de dados e uma biblioteca de fitas em cada fábrica. A diretoria quer usar a AWS sem reescrever as aplicações.',
        objective: 'Entender o que cada gateway oferece.',
        successCriteria: ['Associar gateways a protocolos e destinos', 'Responder a um pedido de FSx File Gateway'],
      },
      intel: [
        {
          conceptId: 'sgw.overview',
          body: ['O **Storage Gateway** é um appliance local (VM, hardware ou EC2) que fala os protocolos que as aplicações já usam — **arquivo**, **bloco** ou **fita** — e guarda os dados na AWS.'],
        },
        {
          conceptId: 'sgw.s3-file',
          body: ['**S3 File Gateway**: NFS e SMB; cada arquivo vira um **objeto no S3**. **FSx File Gateway**: SMB para o FSx for Windows — **sem novos clientes desde 28/10/2024**.'],
        },
        {
          conceptId: 'sgw.volume-cached',
          body: ['**Volume Gateway** (iSCSI): **cached** — dados no S3, cache local do que é mais usado; **stored** — tudo no local, snapshots na AWS como snapshots do EBS.'],
        },
        {
          conceptId: 'sgw.tape',
          body: ['**Tape Gateway**: biblioteca de fitas **virtual** para o software de backup; fitas arquivadas em **Glacier Flexible Retrieval** ou **Deep Archive**.'],
        },
      ],
      activities: [
        {
          id: 's3x.f10.m1.a1',
          kind: 'match',
          title: 'Gateway, protocolo e destino',
          prompt: 'Associe cada gateway à sua descrição.',
          concepts: [{ id: 'sgw.overview' }],
          xp: 50,
          difficulty: 2,
          explanation: ['Arquivos (NFS/SMB) usam o S3 File Gateway; disco em bloco (iSCSI) usa o Volume Gateway, nos modos cached ou stored; fitas virtuais (VTL) usam o Tape Gateway.'],
          leftLabel: 'Gateways',
          rightLabel: 'Descrições',
          pairs: [
            { id: 'p1', left: 'Amazon S3 File Gateway', right: 'NFS ou SMB; arquivos guardados como objetos no S3', explanation: 'Os mesmos dados ficam acessíveis no bucket.', concepts: ['sgw.s3-file'] },
            { id: 'p2', left: 'Volume Gateway — cached', right: 'iSCSI; dados primários no S3 e cache local dos mais usados', explanation: 'Economiza disco local.', concepts: ['sgw.volume-cached'] },
            { id: 'p3', left: 'Volume Gateway — stored', right: 'iSCSI; todos os dados no local e snapshots na AWS', explanation: 'Baixa latência para tudo, backup externo.', concepts: ['sgw.volume-stored'] },
            { id: 'p4', left: 'Tape Gateway', right: 'Biblioteca de fitas virtual; arquivo em Glacier Flexible ou Deep Archive', explanation: 'O software de backup continua o mesmo.', concepts: ['sgw.tape'] },
            { id: 'p5', left: 'Amazon FSx File Gateway', right: 'SMB para FSx for Windows File Server — sem novos clientes', explanation: 'Indisponível para novos clientes desde 28/10/2024.', concepts: ['sgw.fsx-file'] },
          ],
        },
        {
          id: 's3x.f10.m1.a2',
          kind: 'decision',
          title: 'Um pedido de FSx File Gateway',
          prompt: 'Um consultor recomenda o **FSx File Gateway** para as pastas Windows da Aço Forte, que nunca usou Storage Gateway. O que você responde?',
          concepts: [{ id: 'sgw.fsx-file' }],
          xp: 40,
          difficulty: 2,
          explanation: ['O FSx File Gateway não aceita novos clientes desde 28/10/2024. Para quem precisa de um sistema de arquivos Windows gerenciado, a AWS indica o FSx for Windows File Server diretamente; se os arquivos podem viver como objetos no S3, o S3 File Gateway com SMB atende.'],
          options: [
            { id: 'a', text: 'Ele não está disponível para novos clientes; avaliar o FSx for Windows File Server direto ou o S3 File Gateway com SMB.', correct: true, consequence: 'O projeto segue com uma opção disponível e adequada ao requisito.', impacts: { disponibilidade: 1 } },
            { id: 'b', text: 'Contratar o FSx File Gateway: é a opção recomendada para SMB.', correct: false, consequence: 'A Aço Forte não conseguiria ativá-lo: o serviço não aceita novos clientes.' },
            { id: 'c', text: 'Usar o Tape Gateway para as pastas.', correct: false, consequence: 'Fitas virtuais servem a software de backup, não a pastas de trabalho.' },
          ],
        },
      ],
      debrief: {
        takeaways: ['O protocolo indica o gateway: arquivos usam o S3 File Gateway; disco em bloco, o Volume Gateway; fitas, o Tape Gateway.', 'FSx File Gateway: sem novos clientes desde 28/10/2024.'],
      },
    },
    // -----------------------------------------------------------------------
    {
      id: 's3x.f10.m2',
      title: 'O arquiteto híbrido',
      type: 'mission',
      summary: 'Escolher o gateway de cinco sistemas da fábrica de Contagem.',
      briefing: {
        company: COMPANY,
        role: ROLE,
        situation: 'A fábrica de Contagem é a primeira a migrar. Cinco sistemas, cinco necessidades diferentes.',
        objective: 'Escolher o gateway certo para cada sistema.',
        successCriteria: ['Protocolo compatível', 'Requisitos de latência, espaço local e acesso na AWS atendidos', 'Só opções disponíveis para novos clientes'],
      },
      intel: [
        {
          conceptId: 'sgw.volume-stored',
          body: ['**Stored**: tudo no local — baixa latência para o conjunto inteiro, mas exige disco local para tudo. **Cached**: pouco disco local, mas os dados frios vêm da AWS.'],
        },
      ],
      activities: [
        {
          id: 's3x.f10.m2.a1',
          kind: 'lab',
          lab: 'gateway',
          title: 'Fábrica de Contagem',
          prompt: 'Escolha o gateway de cada sistema. O destino na AWS aparece à direita; os requisitos são conferidos ao verificar.',
          concepts: [{ id: 'sgw.s3-file' }, { id: 'sgw.volume-cached' }, { id: 'sgw.volume-stored' }, { id: 'sgw.tape' }, { id: 'sgw.fsx-file' }],
          xp: 100,
          difficulty: 2,
          hints: ['Comece pelo protocolo: NFS/SMB, iSCSI ou VTL.', 'Entre cached e stored, olhe para latência e espaço em disco no local.'],
          explanation: ['Desenhos (NFS, lidos na AWS): S3 File Gateway. Pastas SMB de um cliente novo: S3 File Gateway. ERP: stored volumes. Câmeras com pouco disco: cached volumes. Fitas: Tape Gateway.'],
          config: M2_LAB,
        },
      ],
      debrief: {
        takeaways: ['O protocolo define a família do gateway; os requisitos definem o modo.', 'Leitura dos dados por aplicações na AWS: S3 File Gateway.'],
      },
    },
    // -----------------------------------------------------------------------
    {
      id: 's3x.f10.boss',
      title: 'Chefe: cached × stored e a queda do link',
      type: 'boss',
      summary: 'Decidir o gateway quando o link com a AWS não é confiável — e planejar a recuperação.',
      briefing: {
        company: COMPANY,
        role: ROLE,
        situation: 'A fábrica de Ipatinga fica numa região com quedas frequentes de link. A produção não pode parar, e o seguro exige um plano de recuperação caso o datacenter local seja perdido.',
        objective: 'Escolher gateways resilientes e planejar a recuperação.',
        successCriteria: ['Avaliar o que funciona sem link', 'Escolher os gateways', 'Planejar a recuperação na AWS', 'Entender a leitura de fitas arquivadas'],
      },
      intel: [],
      activities: [
        {
          id: 's3x.f10.boss.a1',
          kind: 'classify',
          title: 'Sem link com a AWS',
          prompt: 'Durante uma queda do link, o que continua acessível no local?',
          concepts: [{ id: 'sgw.volume-cached' }, { id: 'sgw.volume-stored' }],
          xp: 50,
          difficulty: 2,
          explanation: ['Stored volumes têm todos os dados no local. Cached volumes têm no local só o que está no cache; o restante está na AWS. (Visão conceitual: os detalhes de comportamento em queda de conexão não são simulados.)'],
          bins: [
            { id: 'local', label: 'Acessível no local' },
            { id: 'aws', label: 'Depende da AWS' },
          ],
          items: [
            { id: 'i1', text: 'Qualquer dado de um stored volume', bin: 'local', explanation: 'O conjunto inteiro fica no local.', concepts: ['sgw.volume-stored'] },
            { id: 'i2', text: 'Dados recentes de um cached volume, presentes no cache', bin: 'local', explanation: 'O cache guarda os dados mais acessados.', concepts: ['sgw.volume-cached'] },
            { id: 'i3', text: 'Dados antigos de um cached volume, fora do cache', bin: 'aws', explanation: 'Os dados primários do cached volume ficam no S3.', concepts: ['sgw.volume-cached'] },
            { id: 'i4', text: 'Restaurar um snapshot do volume numa instância Amazon EC2', bin: 'aws', explanation: 'Snapshots ficam na AWS como snapshots do EBS.', concepts: ['sgw.volume-stored'] },
          ],
        },
        {
          id: 's3x.f10.boss.a2',
          kind: 'lab',
          lab: 'gateway',
          title: 'Fábrica de Ipatinga',
          prompt: 'Escolha o gateway de cada sistema considerando o link instável.',
          concepts: [{ id: 'sgw.volume-stored' }, { id: 'sgw.volume-cached' }, { id: 'sgw.s3-file' }, { id: 'sgw.tape' }],
          xp: 100,
          difficulty: 3,
          hints: ['O MES não pode depender do link.', 'A aplicação legada não cabe no disco local.'],
          explanation: ['Laudos (SMB, lidos por IA na AWS): S3 File Gateway. MES: stored volumes. Aplicação legada com pouco disco: cached volumes, aceitando que os dados frios dependem do link. Backups: Tape Gateway.'],
          config: BOSS_LAB,
        },
        {
          id: 's3x.f10.boss.a3',
          kind: 'decision',
          title: 'Perdemos a fábrica',
          prompt: 'Num incêndio, o datacenter de Ipatinga é perdido. O MES usava stored volumes com snapshots na AWS. Qual é o caminho de recuperação?',
          concepts: [{ id: 'sgw.volume-stored' }],
          xp: 40,
          difficulty: 2,
          explanation: ['Os snapshots dos stored volumes ficam na AWS como snapshots do EBS; é possível criar volumes EBS a partir deles e recuperar o sistema em instâncias EC2.'],
          options: [
            { id: 'a', text: 'Criar volumes EBS a partir dos snapshots e subir o MES em instâncias Amazon EC2.', correct: true, consequence: 'A produção volta a ter o sistema enquanto a fábrica é reconstruída; perde-se apenas o que mudou depois do último snapshot.', impacts: { disponibilidade: 2 } },
            { id: 'b', text: 'Não há o que fazer: os dados estavam no local.', correct: false, consequence: 'Os snapshots assíncronos existem justamente para esse caso.' },
            { id: 'c', text: 'Ler os dados direto do bucket S3 como arquivos.', correct: false, consequence: 'Volumes não ficam como arquivos ou objetos acessíveis no bucket; a recuperação é por snapshots do EBS.' },
          ],
        },
        {
          id: 's3x.f10.boss.a4',
          kind: 'decision',
          title: 'A fita de 2019',
          prompt: 'Uma auditoria pede um backup de 2019, cuja fita virtual foi arquivada em S3 Glacier Deep Archive. O que esperar?',
          concepts: [{ id: 'sgw.tape' }, { id: 's3.restore' }],
          xp: 30,
          difficulty: 2,
          explanation: ['Fitas arquivadas precisam ser recuperadas do arquivo antes de serem lidas pelo software de backup; com Deep Archive, isso leva horas. Planeje prazos de auditoria com isso em mente.'],
          options: [
            { id: 'a', text: 'Recuperar a fita do arquivo (leva horas) e então lê-la pelo software de backup.', correct: true, consequence: 'O prazo da auditoria considera a recuperação.', impacts: { custo: 1 } },
            { id: 'b', text: 'A fita está disponível na hora, como qualquer fita virtual.', correct: false, consequence: 'Fitas arquivadas em Glacier exigem recuperação antes do uso.' },
            { id: 'c', text: 'Fitas arquivadas não podem mais ser lidas.', correct: false, consequence: 'Podem, mas antes precisam ser recuperadas para a biblioteca de fitas virtual.' },
          ],
        },
      ],
      debrief: {
        takeaways: ['Se o link com a AWS é instável, use stored volumes para o que não pode parar: todos os dados ficam no local.', 'Cached volumes economizam disco, mas dados frios dependem da AWS.', 'Snapshots de volumes viram volumes EBS no EC2 para recuperação.'],
      },
    },
  ],
}
