/**
 * Conceitos da Fase 1 — AWS Global Infrastructure.
 * Fatos conferidos em 18/10/2026 (ver docs/VERIFICACAO-DE-CONTEUDO.md).
 */
import type { ConceptDef } from '../../../../engine/types'

const REGIONS = { title: 'AWS Regions', url: 'https://docs.aws.amazon.com/global-infrastructure/latest/regions/aws-regions.html' }
const FIB_REGIONS = { title: 'AWS Fault Isolation Boundaries — Regions', url: 'https://docs.aws.amazon.com/whitepapers/latest/aws-fault-isolation-boundaries/regions.html' }
const FIB_AZ = { title: 'AWS Fault Isolation Boundaries — Availability Zones', url: 'https://docs.aws.amazon.com/whitepapers/latest/aws-fault-isolation-boundaries/availability-zones.html' }
const AZ_IDS = { title: 'AZ IDs', url: 'https://docs.aws.amazon.com/global-infrastructure/latest/regions/az-ids.html' }
const FIB_ZONAL = { title: 'AWS Fault Isolation Boundaries — Zonal services', url: 'https://docs.aws.amazon.com/whitepapers/latest/aws-fault-isolation-boundaries/zonal-services.html' }
const FIB_GLOBAL = { title: 'AWS Fault Isolation Boundaries — Global services', url: 'https://docs.aws.amazon.com/whitepapers/latest/aws-fault-isolation-boundaries/global-services.html' }
const S3X_AZ = { title: 'Regional and Zonal endpoints for directory buckets in an Availability Zone', url: 'https://docs.aws.amazon.com/AmazonS3/latest/userguide/endpoint-directory-buckets-AZ.html' }
const ALB = { title: 'Application Load Balancers', url: 'https://docs.aws.amazon.com/elasticloadbalancing/latest/application/application-load-balancers.html' }
const NAT = { title: 'NAT gateway basics', url: 'https://docs.aws.amazon.com/vpc/latest/userguide/nat-gateway-basics.html' }
const NAT_REG = { title: 'Regional NAT gateways for automatic multi-AZ expansion', url: 'https://docs.aws.amazon.com/vpc/latest/userguide/nat-gateways-regional.html' }
const RDS_MAZ = { title: 'Multi-AZ DB instance deployments for Amazon RDS', url: 'https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/Concepts.MultiAZSingleStandby.html' }
const EC2_SLA = { title: 'Amazon Compute Service Level Agreement', url: 'https://aws.amazon.com/compute/sla/' }
const LZ_WHAT = { title: 'What is AWS Local Zones?', url: 'https://docs.aws.amazon.com/local-zones/latest/ug/what-is-aws-local-zones.html' }
const LZ_HOW = { title: 'How AWS Local Zones work', url: 'https://docs.aws.amazon.com/local-zones/latest/ug/how-local-zones-work.html' }
const WL_WHAT = { title: 'What is AWS Wavelength?', url: 'https://docs.aws.amazon.com/wavelength/latest/developerguide/what-is-wavelength.html' }
const WL_HOW = { title: 'How AWS Wavelength works', url: 'https://docs.aws.amazon.com/wavelength/latest/developerguide/how-wavelengths-work.html' }
const OP_WHAT = { title: 'What is AWS Outposts?', url: 'https://docs.aws.amazon.com/outposts/latest/userguide/what-is-outposts.html' }
const OP_SL = { title: 'Connectivity through service link', url: 'https://docs.aws.amazon.com/outposts/latest/userguide/service-links.html' }
const OP_HA = { title: 'AWS Outposts High Availability Design — Thinking in terms of failure modes', url: 'https://docs.aws.amazon.com/whitepapers/latest/aws-outposts-high-availability-design/thinking-in-terms-of-failure-modes.html' }
const CF_HOW = { title: 'How CloudFront delivers content', url: 'https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/HowCloudFrontWorks.html' }
const GA_WHAT = { title: 'What is AWS Global Accelerator?', url: 'https://docs.aws.amazon.com/global-accelerator/latest/dg/what-is-global-accelerator.html' }
const R53_WHAT = { title: 'What is Amazon Route 53?', url: 'https://docs.aws.amazon.com/Route53/latest/DeveloperGuide/Welcome.html' }

export const F01_FOUNDATIONS_CONCEPTS: ConceptDef[] = [
  {
    id: 'infra.region',
    title: 'Região AWS',
    officialName: 'AWS Region',
    serviceIds: ['aws.global-infrastructure'],
    summary: 'Uma área geográfica com **várias Zonas de Disponibilidade** (todas as Regiões atuais têm três ou mais). Regiões são **isoladas e independentes** entre si: uma falha numa Região não afeta as outras.',
    explanation: [
      'Cada Região é um conjunto de Zonas de Disponibilidade numa área geográfica, com infraestrutura e serviços próprios. O isolamento é proposital: um problema numa Região não se espalha para as outras. O outro lado do isolamento é que nada atravessa a fronteira sozinho. Dados, instâncias e configurações ficam na Região em que foram criados até que você configure uma replicação ou uma cópia.',
      'A escolha da Região define ao mesmo tempo onde os dados ficam, que serviços estão disponíveis, qual a latência para os usuários e quanto se paga. Por isso ela aparece nos quatro domínios do exame: segurança (localização dos dados), resiliência (fronteira de falha), desempenho (distância) e custo (preço por Região).',
      'Exemplo: uma empresa roda tudo em sa-east-1 (São Paulo), com o banco em Multi-AZ. Isso a protege da falha de uma AZ, mas não de um evento que afete a Região inteira. Para isso, ela precisaria de cópias em outra Região, configuradas por ela: replicação do S3, réplica de leitura do banco em outra Região ou cópia dos backups.',
      '**Regra prática:** alta disponibilidade se resolve dentro da Região, com várias AZs; recuperação de um desastre regional se resolve fora dela, com outra Região.',
    ],
    comparisons: [
      { with: 'infra.az', text: 'A AZ é a fronteira de falha dentro da Região. Várias AZs protegem contra a perda de um data center; só outra Região protege contra a perda da Região.' },
      { with: 'edge.pop', text: 'As edge locations ficam em muito mais cidades que as Regiões e servem para entregar conteúdo perto do usuário, com o CloudFront. Elas não substituem a Região onde ficam a aplicação e os dados.' },
    ],
    commonMistakes: [
      'Achar que um recurso criado numa Região aparece nas outras, ou que os backups vão para outra Região automaticamente.',
      'Confundir alta disponibilidade (várias AZs) com recuperação de desastres (outra Região).',
    ],
    facts: [
      'Em 18/10/2026 eram 34 Regiões disponíveis para contas AWS comuns.',
      'Recursos e dados criados numa Região não existem em outra, a menos que você use um recurso de replicação ou cópia de um serviço — ou replique por conta própria.',
    ],
    exam: {
      domains: ['d1', 'd2', 'd3', 'd4'],
      relevance: 'alta',
      notes: 'A Região aparece nas questões de várias formas: "os dados devem permanecer no país" (escolha da Região), "sobreviver à perda de uma Região inteira" (replicação para outra Região), "usuários em outro continente reclamam de latência" (Região mais próxima ou rede de borda) e "reduzir custo" (preços diferentes por Região). Identifique primeiro o requisito que não pode ser violado e só depois compare latência e custo.',
    },
    references: [REGIONS, FIB_REGIONS],
    tags: ['fundamentos', 'disponibilidade'],
  },
  {
    id: 'infra.region-selection',
    title: 'Como escolher uma Região',
    officialName: 'Choosing an AWS Region',
    serviceIds: ['aws.global-infrastructure'],
    summary: 'A escolha pesa **requisitos de localização dos dados**, **serviços e recursos disponíveis**, **latência para os usuários** e **custo**. A Região mais próxima nem sempre atende aos requisitos.',
    explanation: [
      'A escolha funciona como um funil. Primeiro saem as Regiões que violam um requisito rígido: uma lei ou um contrato sobre onde os dados podem ficar, ou um serviço ou recurso obrigatório que não existe ali. Entre as que sobram, compara-se a latência para a maioria dos usuários e o custo, que muda de uma Região para outra.',
      'Exemplo: um banco precisa manter os dados de clientes no Brasil e atende usuários em São Paulo. A sa-east-1 (São Paulo) cumpre o requisito de localização, mesmo que a us-east-1 seja mais barata para o S3 Standard. Sem a exigência legal, o custo menor poderia pesar mais, desde que a latência fosse aceitável para os usuários.',
      '**Regra prática:** os requisitos rígidos eliminam opções; latência e custo escolhem entre as que sobraram.',
    ],
    comparisons: [
      { with: 'infra.data-residency', text: 'A localização dos dados é o requisito rígido que mais elimina Regiões. A escolha da Região considera também serviços disponíveis, latência e custo.' },
    ],
    commonMistakes: [
      'Escolher só pela distância e descobrir depois que o serviço necessário não existe ali ou que o contrato exige outro país.',
    ],
    facts: [
      'A documentação orienta escolher uma Região que tenha os serviços e recursos necessários e que fique perto da maioria dos usuários.',
      'Preços variam entre Regiões: em 18/10/2026, o S3 Standard custava US$ 0,023/GB-mês em us-east-1 e US$ 0,0405/GB-mês em sa-east-1 (primeira faixa).',
      'Disponibilidade de recursos varia: em 18/10/2026, o S3 Express One Zone não aparecia na lista de Regiões de eu-south-2 (Spain).',
    ],
    recommendations: ['Comece pelos requisitos rígidos (onde os dados podem ficar, serviços obrigatórios); só então compare latência e custo entre as Regiões que sobram.'],
    exam: {
      domains: ['d1', 'd3', 'd4'],
      relevance: 'alta',
      notes: 'Questões de escolha de Região costumam misturar requisitos: localização obrigatória dos dados, latência para um público específico e custo. A alternativa certa respeita primeiro o requisito que não pode ser violado. A mais barata ou a mais próxima é distrator quando quebra uma exigência legal ou não oferece o serviço pedido.',
    },
    references: [REGIONS, S3X_AZ],
    tags: ['fundamentos', 'custos', 'desempenho'],
    reviewItems: [
      {
        id: 'rv:infra.region-selection:ordem',
        kind: 'decision',
        title: 'Por onde começar',
        prompt: 'Ao escolher a Região de uma aplicação nova, qual critério você verifica **primeiro**?',
        concepts: [{ id: 'infra.region-selection' }],
        xp: 5,
        difficulty: 1,
        explanation: ['Requisitos rígidos (onde os dados podem ficar e quais serviços são indispensáveis) eliminam Regiões. Latência e custo desempatam entre as que sobram.'],
        options: [
          { id: 'a', text: 'Os requisitos rígidos: localização exigida dos dados e serviços indispensáveis.', correct: true, consequence: 'Só as Regiões viáveis entram na comparação de latência e custo.' },
          { id: 'b', text: 'A Região geograficamente mais próxima dos usuários.', correct: false, consequence: 'Ela pode não ter o serviço necessário ou ficar fora do país exigido.' },
          { id: 'c', text: 'A Região com o menor preço.', correct: false, consequence: 'Preço baixo não adianta se a Região viola um requisito obrigatório.' },
        ],
      },
    ],
  },
  {
    id: 'infra.data-residency',
    title: 'Localização dos dados',
    officialName: 'Data residency',
    serviceIds: ['aws.global-infrastructure'],
    summary: 'Exigências (legais, regulatórias ou contratuais) sobre **onde os dados podem ficar** restringem as Regiões possíveis. Como os dados não saem da Região sem uma ação explícita, escolher a Região é a primeira forma de cumprir essas exigências.',
    explanation: [
      'Como os dados ficam na Região onde foram criados, a primeira forma de cumprir uma exigência de localização é escolher uma Região dentro do país ou do bloco permitido. O cuidado está no que vem depois: replicação entre Regiões, cópias de backup e recuperação de desastres também precisam respeitar a mesma exigência.',
      'Exemplo: uma empresa que precisa manter dados pessoais na União Europeia usa a eu-central-1 (Frankfurt) e, para recuperação de desastres, replica para a eu-west-1 (Irlanda), também dentro do bloco. Replicar para a us-east-1 quebraria o requisito.',
      '**Regra prática:** a exigência de localização vale para todas as cópias, não só para a principal.',
    ],
    commonMistakes: [
      'Configurar replicação ou cópia de backup para uma Região fora do país ou do bloco permitido.',
    ],
    facts: ['A documentação cita requisitos legais como motivo para escolher uma Região num lugar específico.'],
    recommendations: ['Registre a exigência concreta (lei, contrato, cliente) e o país ou bloco permitido; replicação e backups também precisam respeitá-la.'],
    exam: {
      domains: ['d1'],
      relevance: 'media',
      notes: 'Expressões como "os dados não podem sair do país", "exigência regulatória" ou "residência dos dados" tornam a localização um requisito rígido. Elimine primeiro as Regiões e os destinos de replicação que a violam; só então avalie custo e latência.',
    },
    references: [REGIONS],
    tags: ['fundamentos', 'seguranca'],
  },
  {
    id: 'infra.opt-in-regions',
    title: 'Regiões opt-in',
    officialName: 'Opt-in Regions',
    serviceIds: ['aws.global-infrastructure'],
    summary: 'Regiões lançadas **depois de 20/03/2019** vêm desabilitadas e precisam ser **habilitadas** na conta antes do uso. As mais antigas já vêm habilitadas.',
    explanation: [
      'Uma Região opt-in fica indisponível para a conta até alguém habilitá-la. Isso pesa em automações e em planos de recuperação: se o plano prevê usar uma Região opt-in, ela precisa ser habilitada com antecedência, e não no meio de um incidente.',
    ],
    facts: ['Exemplos de Regiões opt-in em 18/10/2026: Africa (Cape Town), Europe (Spain), Europe (Milan), Mexico (Central), Asia Pacific (Hong Kong).'],
    exam: { domains: ['d1'], relevance: 'baixa' },
    references: [REGIONS],
    tags: ['fundamentos'],
    reviewItems: [
      {
        id: 'rv:infra.opt-in-regions:habilitar',
        kind: 'decision',
        title: 'A Região não aparece',
        prompt: 'A equipe quer criar recursos em **Europe (Spain)**, mas a Região não aparece disponível na conta. O que explica?',
        concepts: [{ id: 'infra.opt-in-regions' }],
        xp: 5,
        difficulty: 1,
        explanation: ['Europe (Spain) é uma Região opt-in: lançada depois de 20/03/2019, precisa ser habilitada na conta antes do uso.'],
        options: [
          { id: 'a', text: 'É uma Região opt-in e precisa ser habilitada na conta.', correct: true, consequence: 'Depois de habilitada, os recursos podem ser criados nela.' },
          { id: 'b', text: 'A Região só existe para clientes Enterprise Support.', correct: false, consequence: 'Plano de suporte não controla quais Regiões a conta pode usar.' },
          { id: 'c', text: 'Regiões novas só podem ser usadas por meio de outra Região.', correct: false, consequence: 'Cada Região é independente; basta habilitá-la.' },
        ],
      },
    ],
  },
  {
    id: 'infra.no-auto-replication',
    title: 'Nada é replicado entre Regiões sozinho',
    officialName: 'Cross-Region isolation',
    serviceIds: ['aws.global-infrastructure'],
    summary: 'Um bucket, um banco ou uma instância criados numa Região **não existem em nenhuma outra**. Para ter cópia em outra Região é preciso configurar replicação ou cópia (de um serviço ou sua).',
    explanation: [
      'O isolamento entre Regiões tem um efeito prático: a AWS não copia seus dados para outra Região por conta própria. Cada serviço oferece o próprio mecanismo, que você precisa ativar e pagar, como a [[repl.crr-srr|replicação do S3]], as réplicas de leitura do RDS em outra Região, a cópia de snapshots e de backups e as [[ddb.global-tables|tabelas globais do DynamoDB]].',
      'Exemplo: um bucket em us-east-1 com versionamento está protegido contra exclusões acidentais, mas continua só em us-east-1. Se o requisito é ter os dados disponíveis mesmo com a Região fora do ar, falta configurar a replicação para outra Região.',
      '**Regra prática:** se a arquitetura depende de dados em outra Região, procure qual recurso de replicação ou cópia os leva até lá. Se nenhum foi configurado, os dados não estão lá.',
    ],
    commonMistakes: [
      'Achar que snapshots, backups ou buckets ficam disponíveis em outra Região sem nenhuma configuração.',
    ],
    consequences: ['Sem replicação configurada, a perda de uma Região torna os dados dela inacessíveis até que ela volte.'],
    facts: ['Dados e recursos de uma Região não existem em outra sem uma funcionalidade explícita de replicação ou cópia.'],
    exam: {
      domains: ['d2'],
      relevance: 'alta',
      notes: 'Requisitos como "recuperar em outra Região", "continuar operando mesmo com a falha de uma Região" ou "cópia dos backups em outra Região" pedem um mecanismo explícito de replicação ou cópia. Alternativas que contam com uma cópia que ninguém configurou, ou que usam só Multi-AZ, não atendem.',
    },
    references: [FIB_REGIONS],
    tags: ['fundamentos', 'recuperacao'],
  },
  {
    id: 'infra.az',
    title: 'Zona de Disponibilidade',
    officialName: 'Availability Zone (AZ)',
    serviceIds: ['aws.global-infrastructure'],
    summary: 'Um ou mais **data centers** com energia, rede e conectividade **próprias e redundantes**, dentro de uma Região. As AZs ficam a uma distância significativa umas das outras (até cerca de 100 km), mas perto o bastante para **replicação síncrona** com latência de um dígito em milissegundos.',
    explanation: [
      'Pense nas AZs de uma Região como prédios independentes de uma mesma empresa: cada um tem gerador, refrigeração e rede próprios, então uma queda de energia ou um incêndio num deles não derruba os outros. O limite da comparação: as AZs não ficam lado a lado, e sim a quilômetros umas das outras, justamente para que um evento local não atinja duas ao mesmo tempo.',
      'A AZ é a unidade de isolamento de falhas dentro da Região. Muitos recursos são **zonais**: uma instância EC2 ou um volume EBS existe numa única AZ e fica indisponível se ela falhar. A resiliência, portanto, não vem automaticamente: é a arquitetura que distribui o workload por duas ou mais AZs. A latência baixa entre elas permite replicar dados de forma síncrona, como faz o RDS Multi-AZ com o standby.',
      'Exemplo: uma loja virtual com um Application Load Balancer em sub-redes de duas AZs, instâncias EC2 nas duas e um banco RDS Multi-AZ. Se uma AZ falhar, o load balancer manda o tráfego só para as instâncias saudáveis e o RDS faz o failover para o standby. A loja continua de pé desde que as instâncias da AZ restante deem conta da carga sozinhas, o que se planeja com antecedência ([[infra.static-stability|static stability]]).',
      '**Regra prática:** várias AZs protegem contra a falha de um data center ou de uma AZ inteira; para sobreviver à perda de uma Região, é preciso usar outra Região.',
    ],
    useCases: [
      'Alta disponibilidade dentro de uma Região: sub-redes, instâncias e réplicas distribuídas por duas ou mais AZs.',
      'Replicação síncrona de banco de dados, como no RDS Multi-AZ, sem a latência de uma distância entre Regiões.',
    ],
    limitations: [
      'Não protege contra um desastre que atinja a Região inteira.',
      'Não protege contra exclusão acidental ou dado corrompido: a replicação síncrona copia o erro para a outra AZ. Para isso servem backups e versionamento.',
    ],
    comparisons: [
      { with: 'infra.region', text: 'A Região é a área geográfica que reúne três ou mais AZs. A falha de uma AZ se resolve com várias AZs na mesma Região; um desastre regional ou uma exigência de distância maior entre as cópias pede outra Região, com replicação configurada por você.' },
      { with: 'infra.local-zones', text: 'A Local Zone leva parte dos serviços para perto de uma cidade, para reduzir a latência. A AZ faz parte do núcleo da Região, tem a gama completa de serviços e é a peça usada para alta disponibilidade.' },
    ],
    facts: [
      'Pontos comuns de falha, como geradores e refrigeração, não são compartilhados entre AZs.',
      'A AWS implanta atualizações nas AZs de uma Região em momentos diferentes, para evitar falhas correlacionadas.',
      'Em algumas Regiões, como us-east-1 e sa-east-1, o nome da AZ (por exemplo, `us-east-1a`) pode apontar para locais físicos diferentes em contas diferentes criadas antes de novembro de 2025. O **AZ ID** (por exemplo, `use1-az1`) identifica o mesmo local em todas as contas.',
    ],
    commonMistakes: [
      'Achar que a AWS distribui a aplicação entre AZs sozinha: instâncias EC2 e volumes EBS ficam na AZ em que foram criados.',
      'Considerar altamente disponível uma arquitetura com várias instâncias, mas todas na mesma AZ.',
      'Comparar AZs de duas contas pelo nome em vez do AZ ID, ao compartilhar sub-redes ou alinhar a latência entre contas.',
    ],
    exam: {
      domains: ['d2'],
      relevance: 'alta',
      notes: 'Requisitos como "tolerar a falha de uma Zona de Disponibilidade", "alta disponibilidade" ou "sem ponto único de falha" pedem recursos em pelo menos duas AZs, como load balancer, instâncias e banco Multi-AZ. Se o enunciado fala em desastre regional ou em distância mínima entre as cópias, a resposta passa a envolver outra Região. Desconfie de alternativas que tentam resolver disponibilidade só com instâncias maiores ou mais numerosas numa única AZ.',
    },
    references: [FIB_AZ, AZ_IDS],
    tags: ['fundamentos', 'disponibilidade'],
  },
  {
    id: 'infra.service-scope',
    title: 'Serviços zonais, regionais e globais',
    officialName: 'Zonal, Regional and global services',
    serviceIds: ['aws.global-infrastructure', 'aws.ec2', 'aws.iam', 'aws.route53'],
    summary: 'Recursos **zonais** (instância EC2, volume EBS, NAT gateway zonal) vivem numa AZ e caem com ela. Recursos **regionais** (bucket S3, função Lambda) são distribuídos pela Região. Serviços **globais** (IAM, Route 53, CloudFront) têm plano de dados distribuído e plano de controle numa única Região.',
    explanation: [
      'O escopo do serviço diz o que cai junto numa falha. Um recurso **zonal** depende de uma AZ: se ela falha, ele falha, e a proteção é ter outro igual em outra AZ. Um recurso **regional** é distribuído pela AWS entre as AZs da Região, sem que você escolha a AZ. Um serviço **global** atende de muitos lugares, mas as alterações de configuração passam por uma única Região.',
      'Essa última distinção separa o plano de controle (criar e alterar recursos) do plano de dados (usar os recursos que já existem). O plano de dados é projetado para continuar funcionando quando o plano de controle tem problemas, mas criar ou alterar recursos pode falhar nessa hora. Por isso a recuperação não deve depender de criar recursos durante o incidente.',
      'Exemplo: uma aplicação tem instâncias EC2 numa só AZ, um bucket S3 e registros no Route 53. A falha dessa AZ derruba as instâncias, mas o bucket e o DNS continuam respondendo. O ponto fraco é a camada zonal, e é nela que se acrescenta outra AZ.',
      '**Regra prática:** para cada componente, pergunte qual é o escopo dele; tudo o que é zonal precisa de um par em outra AZ.',
    ],
    comparisons: [
      { with: 'infra.az', text: 'A AZ é a fronteira de falha dos recursos zonais. Os recursos regionais já são distribuídos entre as AZs pelo próprio serviço.' },
    ],
    facts: [
      'EC2 e EBS são serviços zonais: falham de forma independente em cada AZ.',
      'O plano de controle do IAM e do Route 53 fica em us-east-1; os planos de dados são distribuídos.',
    ],
    recommendations: ['Não dependa de operações de plano de controle (criar, alterar) para se recuperar de uma falha: deixe os recursos prontos antes.'],
    exam: {
      domains: ['d2'],
      relevance: 'media',
      notes: 'Em questões de disponibilidade, encontre os componentes zonais (instâncias, volumes EBS, NAT gateway zonal) e verifique se cada um tem um par em outra AZ. Um volume EBS, por exemplo, só pode ser anexado a instâncias da mesma AZ: levá-lo para outra AZ exige um snapshot.',
    },
    references: [FIB_ZONAL, FIB_GLOBAL],
    tags: ['fundamentos', 'disponibilidade'],
  },
  {
    id: 'infra.multi-az',
    title: 'Implantação em várias AZs',
    officialName: 'Multi-AZ deployment',
    serviceIds: ['aws.global-infrastructure', 'aws.ec2', 'aws.elb'],
    summary: 'Distribuir cada camada da aplicação por **duas ou mais AZs** para que a perda de uma não derrube o sistema. Mas só funciona se **toda** a cadeia for redundante: balanceador, instâncias, saída para a internet e banco.',
    explanation: [
      'Multi-AZ não é uma opção que se liga num lugar só: é uma propriedade da arquitetura inteira. Cada camada precisa ter cópia em pelo menos outra AZ: o load balancer com sub-redes em duas ou mais AZs, as instâncias distribuídas, um NAT gateway por AZ (ou o modo regional) e o banco com standby em outra AZ. Se uma única peça fica numa AZ só, ela vira o ponto único de falha do conjunto.',
      'Exemplo: uma API tem instâncias em três AZs atrás de um ALB, mas um único NAT gateway zonal, na AZ a. Se a AZ a cair, as instâncias das AZs b e c continuam recebendo tráfego, mas perdem o acesso à internet de que precisam para chamar um serviço externo. O desenho parecia Multi-AZ e não era.',
      '**Regra prática:** siga o caminho de uma requisição do início ao fim e confirme que cada componente existe em pelo menos duas AZs.',
    ],
    comparisons: [
      { with: 'infra.static-stability', text: 'Multi-AZ garante que existam cópias em outras AZs. A static stability garante que as cópias restantes aguentem a carga sozinhas, sem esperar a criação de recursos.' },
      { with: 'infra.ha-vs-dr', text: 'Multi-AZ é a ferramenta da alta disponibilidade. Não protege contra a perda da Região nem contra erros que se replicam, que são assunto da recuperação de desastres.' },
    ],
    commonMistakes: [
      'Espalhar as instâncias e esquecer que o banco ou o NAT gateway ficou numa AZ só.',
    ],
    facts: ['O SLA regional do Amazon EC2 (99,99% de disponibilidade mensal) vale para instâncias rodando em duas ou mais AZs da mesma Região; o SLA por instância é de 99,5%.'],
    exam: {
      domains: ['d2'],
      relevance: 'alta',
      notes: 'Pedidos de "alta disponibilidade" ou de "tolerância à falha de uma AZ" costumam se resolver com Multi-AZ em todas as camadas. Leia cada alternativa procurando a peça que ficou numa AZ só: banco Single-AZ, um único NAT gateway zonal, uma instância fora do Auto Scaling. A alternativa certa é a que não deixa nenhuma camada sem par.',
    },
    references: [FIB_ZONAL, EC2_SLA],
    tags: ['disponibilidade'],
  },
  {
    id: 'infra.spof',
    title: 'Ponto único de falha',
    officialName: 'Single point of failure (SPOF)',
    serviceIds: ['aws.global-infrastructure'],
    summary: 'Um componente cuja falha, sozinha, derruba o sistema. Numa arquitetura "multi-AZ", o SPOF costuma ser o que ficou de fora da redundância: um banco Single-AZ, um único NAT gateway zonal, um volume EBS.',
    explanation: [
      'Para encontrar um ponto único de falha (SPOF, de single point of failure), imagine cada componente falhando sozinho e pergunte se o sistema continua atendendo. O SPOF raramente é óbvio: costuma ser o componente esquecido quando o resto foi duplicado, como o banco Single-AZ, o NAT gateway zonal, uma instância de tarefas agendadas que só existe numa AZ ou um volume EBS com dados que só estão nele.',
      'Eliminar um SPOF significa ter uma alternativa pronta para assumir: outra instância atrás do load balancer, um standby com failover automático, um segundo NAT gateway em outra AZ. Às vezes o SPOF é aceito por custo; nesse caso, ele precisa ser uma decisão consciente, com plano de recuperação.',
      'Exemplo: um sistema tem as camadas web e de aplicação em duas AZs, mas os arquivos enviados pelos usuários ficam no volume EBS de uma única instância. Se essa instância ou a AZ dela falhar, os arquivos ficam inacessíveis. Guardar os arquivos no S3 ou num sistema de arquivos compartilhado entre AZs, como o [[efs.what|EFS]], remove o SPOF.',
      '**Regra prática:** se a falha de um único componente derruba o sistema, ele é um SPOF, por mais redundante que o resto seja.',
    ],
    commonMistakes: [
      'Contar instâncias em vez de AZs: duas instâncias na mesma AZ continuam caindo juntas.',
    ],
    recommendations: ['Para cada componente, pergunte: "se a AZ dele cair, o que acontece?" — e simule.'],
    exam: {
      domains: ['d2'],
      relevance: 'alta',
      notes: 'O guia da SAA-C03 cita, na tarefa 2.2, a implementação de designs que reduzem pontos únicos de falha. Nas questões, o SPOF costuma estar escondido no cenário (um banco Single-AZ, um único NAT gateway, uma instância que guarda estado). A melhor alternativa remove o SPOF com o menor esforço operacional, em geral usando um recurso gerenciado com failover automático.',
    },
    references: [FIB_ZONAL],
    tags: ['disponibilidade'],
    reviewItems: [
      {
        id: 'rv:infra.spof:banco',
        kind: 'decision',
        title: 'Onde está o SPOF?',
        prompt: 'Seis instâncias em três AZs atrás de um ALB, e um banco **RDS Single-AZ** na AZ a. Qual é o ponto único de falha?',
        concepts: [{ id: 'infra.spof' }],
        xp: 5,
        difficulty: 1,
        explanation: ['Se a AZ a cair, o banco Single-AZ cai junto e as instâncias das outras AZs não têm com quem falar.'],
        options: [
          { id: 'a', text: 'O banco Single-AZ.', correct: true, consequence: 'A solução é o Multi-AZ (standby em outra AZ, com failover automático).' },
          { id: 'b', text: 'O ALB, porque é um componente só.', correct: false, consequence: 'O ALB tem um nó em cada AZ habilitada; ele não depende de uma única AZ.' },
          { id: 'c', text: 'Não há SPOF: as instâncias estão em três AZs.', correct: false, consequence: 'As instâncias sobrevivem, mas o banco não.' },
        ],
      },
    ],
  },
  {
    id: 'infra.static-stability',
    title: 'Static stability',
    officialName: 'Static stability',
    serviceIds: ['aws.global-infrastructure', 'aws.ec2'],
    summary: 'Ter **capacidade de sobra já provisionada** para continuar operando quando uma AZ cai, sem depender de criar recursos durante a falha. Exemplo da AWS: se a carga exige 6 instâncias em 3 AZs, implante 9 (3 por AZ).',
    explanation: [
      'Pense num restaurante que escala garçons a mais em cada turno: se um falta, os outros dão conta sem ninguém ser chamado às pressas. O limite da comparação: na AWS, a capacidade extra é paga o tempo todo, mesmo quando nada falha.',
      'Static stability é projetar o sistema para continuar estável sem precisar mudar nada durante a falha. Em vez de contar com o Auto Scaling para repor a capacidade perdida, o que depende do plano de controle e leva tempo, a arquitetura já roda com capacidade suficiente nas AZs que sobram. A conta: com N AZs, cada uma precisa aguentar a carga total dividida por N − 1.',
      'Exemplo: com duas AZs, uma carga de 6 instâncias exige 6 em cada AZ (12 no total), porque cada AZ pode ter de atender sozinha. Com três AZs, bastam 3 por AZ (9 no total). Quanto mais AZs, menor o custo da sobra.',
      '**Regra prática:** se a recuperação depende de criar recursos durante a falha, o sistema não é estaticamente estável.',
    ],
    comparisons: [
      { with: 'infra.multi-az', text: 'Multi-AZ distribui as cópias entre AZs; a static stability dimensiona essas cópias para que as restantes aguentem a carga total sozinhas.' },
    ],
    consequences: ['Custo maior em operação normal (no exemplo, 50% mais instâncias), em troca de não depender de nada durante a falha.'],
    facts: ['Repor capacidade com Auto Scaling depende do plano de controle e leva tempo; durante esse intervalo, a capacidade restante pode ser sobrecarregada.'],
    exam: {
      domains: ['d2', 'd4'],
      relevance: 'media',
      notes: 'Quando o enunciado pede que o sistema "continue atendendo a carga total mesmo com a perda de uma AZ", não basta distribuir instâncias: é preciso calcular a sobra. Desconfie de alternativas que contam com o Auto Scaling para repor a capacidade se o requisito é não haver degradação durante a falha.',
    },
    references: [FIB_ZONAL],
    tags: ['disponibilidade', 'custos'],
  },
  {
    id: 'infra.ha-vs-dr',
    title: 'Alta disponibilidade × recuperação de desastres',
    officialName: 'High availability vs. disaster recovery',
    serviceIds: ['aws.global-infrastructure'],
    summary: '**Alta disponibilidade** (várias AZs) mantém o sistema no ar diante de falhas dentro da Região. **Recuperação de desastres** (outra Região) cobre a perda da Região inteira — e também problemas que se replicam entre AZs, como dados corrompidos.',
    explanation: [
      'As duas estratégias respondem a perguntas diferentes. A alta disponibilidade pergunta como continuar no ar quando algo falha dentro da Região e responde com redundância entre AZs e failover automático. A recuperação de desastres pergunta como voltar a operar depois de um evento maior e responde com cópias em outra Região e um plano com metas de tempo e de perda de dados ([[dr.rpo-rto|RTO e RPO]]).',
      'A replicação síncrona da alta disponibilidade tem um efeito colateral: ela copia também os erros. Um dado corrompido, uma tabela apagada ou um deploy com defeito chegam ao standby na hora. Por isso a recuperação de desastres inclui backups e versões que permitem voltar a um ponto anterior, e não só cópias atualizadas.',
      'Exemplo: um banco RDS Multi-AZ sobrevive à falha de uma AZ com failover automático. Se alguém apaga uma tabela por engano, o standby também perde a tabela; quem resolve é a [[rds.pitr|restauração para um ponto no tempo]] anterior ao erro.',
      '**Regra prática:** a alta disponibilidade evita a parada; a recuperação de desastres garante a volta. Uma não substitui a outra.',
    ],
    comparisons: [
      { with: 'dr.rpo-rto', text: 'RPO e RTO são as metas que dimensionam a recuperação de desastres: quanto dado se pode perder e em quanto tempo o sistema precisa voltar.' },
    ],
    commonMistakes: ['Achar que Multi-AZ protege contra a perda da Região, um deploy com defeito ou uma exclusão acidental replicada.'],
    facts: ['Uma falha de Região fica limitada a ela; as outras Regiões continuam operando normalmente.'],
    exam: {
      domains: ['d2'],
      relevance: 'alta',
      notes: 'Leia o tipo de evento no enunciado. Falha de instância ou de AZ pede alta disponibilidade (Multi-AZ, várias instâncias, failover). Perda de Região, corrupção de dados ou exclusão acidental pedem recuperação de desastres (outra Região, backups, versionamento), dimensionada pelo RPO e pelo RTO exigidos.',
    },
    references: [FIB_REGIONS, FIB_AZ],
    tags: ['disponibilidade', 'recuperacao'],
  },
  {
    id: 'infra.alb-zones',
    title: 'ALB em várias zonas',
    officialName: 'Application Load Balancer Availability Zones',
    serviceIds: ['aws.elb'],
    summary: 'O ALB exige subnets em **pelo menos duas AZs** e cria um nó em cada zona habilitada. Alvos registrados numa zona **não habilitada** não recebem tráfego.',
    explanation: [
      'Ao habilitar uma AZ no ALB, você escolhe uma sub-rede dela, e o load balancer passa a ter um nó ali. O tráfego só chega aos alvos das zonas habilitadas: uma instância registrada numa AZ que o ALB não usa fica parada, mesmo saudável. Com o cross-zone load balancing, ligado por padrão no ALB, cada nó distribui as requisições entre os alvos de todas as zonas habilitadas, e não só os da própria zona.',
      'Exemplo: o Auto Scaling group lança instâncias nas AZs a, b e c, mas o ALB foi criado só com sub-redes de a e b. As instâncias de c funcionam, mas nunca recebem requisições. A correção é habilitar a AZ c no ALB.',
      '**Regra prática:** as AZs habilitadas no load balancer precisam ser as mesmas em que os alvos rodam.',
    ],
    commonMistakes: [
      'Registrar alvos numa AZ que o ALB não habilitou.',
    ],
    facts: ['O cross-zone load balancing vem ligado no ALB.', 'Um ALB não mistura subnets de AZs com subnets de Local Zones.'],
    exam: {
      domains: ['d2'],
      relevance: 'media',
      notes: 'Em questões de disponibilidade com ALB, confira se o load balancer está em pelo menos duas AZs e se são as AZs onde os alvos rodam. O ALB já é redundante nas zonas habilitadas; o que costuma faltar é habilitar a zona certa ou distribuir os alvos.',
    },
    references: [ALB],
    tags: ['disponibilidade'],
    reviewItems: [
      {
        id: 'rv:infra.alb-zones:zona',
        kind: 'decision',
        title: 'Instâncias ociosas',
        prompt: 'O ALB foi criado com as AZs a e b. Duas instâncias novas foram registradas na AZ c. O que acontece com elas?',
        concepts: [{ id: 'infra.alb-zones' }],
        xp: 5,
        difficulty: 2,
        explanation: ['Alvos numa zona que não está habilitada no load balancer não recebem tráfego. É preciso habilitar a AZ c no ALB.'],
        options: [
          { id: 'a', text: 'Não recebem tráfego até a AZ c ser habilitada no ALB.', correct: true, consequence: 'Ficam ligadas, gerando custo, sem atender ninguém.' },
          { id: 'b', text: 'Recebem tráfego normalmente graças ao cross-zone.', correct: false, consequence: 'O cross-zone distribui entre zonas habilitadas, não habilita zonas novas.' },
          { id: 'c', text: 'O ALB move as instâncias para a AZ a.', correct: false, consequence: 'O ALB não move instâncias.' },
        ],
      },
    ],
  },
  {
    id: 'infra.nat-zonal-regional',
    title: 'NAT gateway zonal × regional',
    officialName: 'NAT gateway availability modes',
    serviceIds: ['aws.vpc'],
    summary: 'O NAT gateway **zonal** fica numa AZ: se ela cair, instâncias de outras AZs que dependem dele perdem a internet — a recomendação é **um por AZ**. O NAT gateway **regional** se expande sozinho pelas AZs onde há workloads.',
    explanation: [
      'O NAT gateway deixa instâncias em sub-redes privadas iniciarem conexões para a internet sem aceitar conexões vindas de fora. No modo **zonal**, ele é um recurso de uma AZ, e as tabelas de rotas das sub-redes privadas apontam para ele. Se as sub-redes de todas as AZs usam o mesmo NAT gateway, a AZ dele vira o ponto único de falha da saída para a internet.',
      'O modo **regional** resolve isso de outro jeito: um único NAT gateway que a AWS expande pelas AZs onde há workloads. Ele simplifica as rotas, mas tem limites: não faz NAT privado e pode levar até 60 minutos para chegar a uma AZ nova.',
      'Exemplo: uma VPC tem sub-redes privadas em três AZs. No modo zonal, a configuração resiliente tem três NAT gateways, um por AZ, e cada sub-rede privada aponta para o da própria AZ. No modo regional, basta um NAT gateway regional.',
      '**Regra prática:** com NAT zonal, um por AZ e rotas para o da mesma AZ; com NAT regional, a distribuição fica por conta da AWS.',
    ],
    facts: ['O NAT gateway regional não oferece NAT privado; para esse caso, use o modo zonal.', 'Um NAT gateway regional pode levar até 60 minutos para se expandir a uma AZ nova.'],
    exam: {
      domains: ['d2', 'd4'],
      relevance: 'media',
      notes: 'Muitos materiais de estudo são anteriores ao modo regional e tratam todo NAT gateway como zonal. Se a questão descreve um único NAT gateway zonal servindo sub-redes de várias AZs e pede resiliência, a resposta esperada é um NAT gateway por AZ, com cada sub-rede privada roteando para o da própria AZ.',
    },
    references: [NAT, NAT_REG],
    tags: ['disponibilidade'],
  },
  {
    id: 'infra.rds-multi-az',
    title: 'RDS Multi-AZ',
    officialName: 'Amazon RDS Multi-AZ DB instance deployment',
    serviceIds: ['aws.rds'],
    summary: 'O RDS mantém um **standby síncrono em outra AZ** e faz **failover automático** se o primário ou a sua AZ falharem. O standby **não atende leituras**: é para disponibilidade, não para escalar.',
    explanation: [
      'Cada gravação é confirmada no primário e replicada de forma síncrona para o standby, em outra AZ. A aplicação usa sempre o mesmo endpoint: no [[rds.failover|failover]], o RDS troca o registro DNS para o standby, e a aplicação reconecta pelo mesmo nome. Com um standby, o failover em geral leva de 60 a 120 segundos.',
      'O standby fica fora do alcance da aplicação: não atende leituras nem escritas até virar primário. Por isso o Multi-AZ resolve disponibilidade, e não desempenho. Para escalar leituras, o caminho são as [[rds.read-replica|réplicas de leitura]] ou o [[rds.multi-az-cluster|cluster Multi-AZ]], cujos leitores atendem consultas.',
      'Exemplo: um sistema de pedidos usa um RDS for PostgreSQL Multi-AZ. Quando a AZ do primário falha, as conexões caem por um ou dois minutos e voltam sozinhas pelo mesmo endpoint, já no antigo standby. Como a replicação era síncrona, o standby já tinha as gravações confirmadas.',
      '**Regra prática:** Multi-AZ é para o banco continuar no ar; réplica de leitura é para o banco aguentar mais leituras.',
    ],
    comparisons: [
      { with: 'rds.read-replica', text: 'A réplica de leitura é assíncrona, atende leituras e pode ficar em outra Região. O standby do Multi-AZ é síncrono, não atende leituras e existe para o failover automático.' },
      { with: 'rds.multi-az-cluster', text: 'O cluster Multi-AZ tem dois leitores em outras AZs, que atendem leituras e assumem a escrita no failover. O Multi-AZ com um standby não oferece leituras.' },
    ],
    commonMistakes: [
      'Apontar relatórios pesados para o standby: ele não aceita conexões.',
      'Achar que o Multi-AZ protege contra a perda da Região ou contra uma exclusão acidental, que também é replicada.',
    ],
    exam: {
      domains: ['d2'],
      relevance: 'alta',
      notes: 'Expressões como "alta disponibilidade do banco", "failover automático" e "tolerar a falha de uma AZ" apontam para Multi-AZ. "Melhorar o desempenho de leitura" ou "relatórios sobrecarregam o banco" apontam para réplicas de leitura. Uma alternativa que usa o standby do Multi-AZ para leituras está errada.',
    },
    references: [RDS_MAZ],
    tags: ['disponibilidade'],
    reviewItems: [
      {
        id: 'rv:infra.rds-multi-az:leitura',
        kind: 'decision',
        title: 'Standby para relatórios?',
        prompt: 'Alguém sugere apontar os relatórios pesados para o **standby** do RDS Multi-AZ (DB instance), já que ele está parado. Funciona?',
        concepts: [{ id: 'infra.rds-multi-az' }],
        xp: 5,
        difficulty: 2,
        explanation: ['No Multi-AZ com um standby, ele não serve leituras. Para leituras, use réplicas de leitura (ou um Multi-AZ DB cluster).'],
        options: [
          { id: 'a', text: 'Não: o standby não atende leituras; use uma réplica de leitura.', correct: true, consequence: 'Disponibilidade e escala de leitura são resolvidas por recursos diferentes.' },
          { id: 'b', text: 'Sim: é para isso que o standby existe.', correct: false, consequence: 'O standby existe para assumir em caso de falha.' },
        ],
      },
    ],
  },
  {
    id: 'infra.local-zones',
    title: 'AWS Local Zones',
    officialName: 'AWS Local Zones',
    serviceIds: ['aws.local-zones'],
    summary: 'Uma **extensão de uma Região** perto de grandes centros urbanos, para dar latência baixa a usuários dali (jogos em tempo real, transmissão ao vivo, estações de trabalho virtuais). Você habilita a Local Zone, cria uma subnet nela e lança recursos.',
    explanation: [
      'A Local Zone resolve um problema de distância. Se os usuários estão numa cidade longe da Região, cada requisição percorre essa distância; uma Local Zone coloca computação, armazenamento e outros serviços perto deles, como extensão da Região. Você habilita a zona na conta, cria uma sub-rede da sua VPC nela e lança os recursos ali.',
      'Ela continua dependendo da Região-mãe: os planos de controle ficam lá, e a oferta de serviços é menor. Por isso a Local Zone costuma hospedar só a parte sensível à latência, enquanto o resto da aplicação fica na Região.',
      'Exemplo: um estúdio usa estações de trabalho virtuais para editar vídeo numa cidade distante da Região. Com as instâncias numa Local Zone dessa cidade, a latência para os editores cai, e o armazenamento de longo prazo continua num bucket S3 da Região.',
      '**Regra prática:** Local Zone é para latência perto de uma cidade; AZ é para disponibilidade dentro da Região.',
    ],
    limitations: ['Oferece um subconjunto dos serviços da Região, que varia por Local Zone.', 'Não substitui uma AZ para alta disponibilidade: é uma zona a mais, em outro lugar.'],
    comparisons: [
      { with: 'infra.az', text: 'A AZ faz parte do núcleo da Região, com a gama completa de serviços; a Local Zone leva parte deles para perto de uma cidade.' },
      { with: 'infra.wavelength', text: 'O Wavelength coloca a infraestrutura dentro da rede de uma operadora móvel, para dispositivos dessa rede. A Local Zone atende qualquer usuário perto de uma cidade.' },
    ],
    facts: [
      'Tem conexão própria com a internet e suporta Direct Connect; o tráfego vindo do Direct Connect vai pelo caminho mais curto até a Local Zone.',
      'Não há cobrança para habilitar; os recursos nela têm preços diferentes dos da Região-mãe.',
      'Os planos de controle ficam na Região-mãe.',
    ],
    exam: {
      domains: ['d3', 'd4'],
      relevance: 'media',
      notes: 'Sinais: usuários concentrados numa cidade longe da Região e um requisito de latência muito baixa para aplicações interativas, como jogos, edição de mídia ou estações de trabalho virtuais. Se o requisito é alta disponibilidade, a resposta não é Local Zone, e sim várias AZs. Se os usuários estão em dispositivos móveis de uma operadora, considere o Wavelength.',
    },
    references: [LZ_WHAT, LZ_HOW],
    tags: ['desempenho'],
  },
  {
    id: 'infra.wavelength',
    title: 'AWS Wavelength',
    officialName: 'AWS Wavelength',
    serviceIds: ['aws.wavelength'],
    summary: 'Infraestrutura AWS **dentro da rede de uma operadora** (5G e 4G/LTE), em **Wavelength Zones**, para dar latência ultrabaixa a **dispositivos móveis** dessa rede. Cada Wavelength Zone é uma extensão lógica de uma Região.',
    explanation: [
      'O Wavelength leva instâncias EC2 e volumes EBS para dentro da rede da operadora. O tráfego de um dispositivo conectado a essa rede chega à aplicação sem sair para a internet, o que reduz a latência para aplicações interativas usadas em celulares e outros dispositivos móveis. A Wavelength Zone é uma extensão da Região: você cria uma sub-rede da VPC nela e usa o carrier gateway para falar com os dispositivos.',
      '**Regra prática:** se o público está em dispositivos móveis na rede de uma operadora e a latência é o requisito decisivo, pense em Wavelength; se o público está numa cidade, em geral, pense em Local Zone.',
    ],
    limitations: ['Atende quem está na rede da operadora parceira; não é outra Região nem uma Local Zone genérica.'],
    comparisons: [
      { with: 'infra.local-zones', text: 'A Local Zone fica perto de uma cidade e atende qualquer usuário dali. A Wavelength Zone fica dentro da rede de uma operadora e atende os dispositivos dessa rede.' },
    ],
    facts: [
      'O tráfego dos dispositivos da operadora entra pelo **carrier gateway**, que usa Carrier IPs.',
      'Não há configuração de entrada vinda da internet pelo carrier gateway.',
      'Recursos disponíveis incluem EC2, EBS, subnets da VPC e, em algumas zonas, Application Load Balancer.',
    ],
    exam: { domains: ['d3'], relevance: 'baixa' },
    references: [WL_WHAT, WL_HOW],
    tags: ['desempenho'],
  },
  {
    id: 'infra.outposts',
    title: 'AWS Outposts',
    officialName: 'AWS Outposts',
    serviceIds: ['aws.outposts'],
    summary: 'Capacidade da AWS (racks ou servidores) **instalada no local do cliente** e operada pela AWS como parte de uma Região, com as mesmas APIs. Serve para processamento local, baixa latência com sistemas existentes e dados que precisam ficar no local.',
    explanation: [
      'O Outposts atende o caso em que a carga precisa ficar fisicamente no local do cliente: por latência com sistemas da fábrica ou do data center, para processar dados locais ou porque os dados precisam ficar ali. A AWS instala e opera o hardware, e você usa os mesmos serviços, APIs e ferramentas da Região.',
      'O Outpost é uma extensão de uma AZ e depende da Região pelo [[infra.outposts-service-link|service link]]: o plano de controle, a criação de recursos e o monitoramento passam por ela. O cliente cuida do espaço, da energia, da rede local e da segurança física do local.',
      'Exemplo: uma fábrica tem máquinas que dependem de respostas rápidas de um sistema de controle de qualidade. Rodar esse sistema num Outpost dentro da fábrica evita a ida e volta até a Região, e os dados históricos seguem para a Região pelo service link.',
      '**Regra prática:** se a carga precisa rodar no prédio do cliente com as APIs da AWS, pense em Outposts; se só precisa estar perto de uma cidade, pense em Local Zone.',
    ],
    limitations: ['Não é uma Região privada: o plano de controle fica na Região.', 'O conjunto de serviços é menor que o de uma Região e varia entre racks e servers.'],
    comparisons: [
      { with: 'infra.local-zones', text: 'A Local Zone é infraestrutura da AWS perto de uma cidade. O Outpost é infraestrutura da AWS dentro do prédio do cliente.' },
    ],
    facts: [
      'Cada Outpost é uma extensão de uma AZ e da sua Região; o **service link** é a conexão obrigatória com a Região.',
      'O hardware é da AWS e gerenciado por ela; o local (espaço, energia, rede) é do cliente.',
      'Formatos: Outposts racks (42U) e Outposts servers (1U ou 2U).',
    ],
    exam: {
      domains: ['d3', 'd4'],
      relevance: 'media',
      notes: 'O guia da SAA-C03 cita o AWS Outposts como opção de computação híbrida. Sinais: "os dados precisam permanecer no data center da empresa", "latência muito baixa com sistemas locais" ou "usar as mesmas APIs da AWS no ambiente local". Se o requisito é só conectar o data center à AWS, a resposta é rede híbrida (VPN ou Direct Connect), e não Outposts.',
    },
    references: [OP_WHAT],
    tags: ['hibrido'],
  },
  {
    id: 'infra.outposts-service-link',
    title: 'Outposts sem conexão com a Região',
    officialName: 'AWS Outposts service link',
    serviceIds: ['aws.outposts'],
    summary: 'Se o service link cai, as instâncias do Outpost **continuam rodando** e acessíveis pela rede local (Local Gateway), mas **operações de mutação** (iniciar, parar), o **plano de controle** e a **telemetria** falham até a conexão voltar.',
    explanation: [
      'O service link liga o Outpost à Região. Como o plano de controle fica na Região, a perda dessa conexão não derruba o que já está rodando, mas impede mudanças: não dá para lançar, parar ou substituir instâncias até a conexão voltar. Por isso o desenho resiliente usa links redundantes e deixa a capacidade necessária já em execução ([[infra.static-stability|static stability]]).',
    ],
    facts: [
      'A AWS exige conectividade redundante de pelo menos 500 Mbps por rack de computação e no máximo 175 ms de ida e volta até a Região.',
      'Métricas do CloudWatch ficam em spool local por curtos períodos de desconexão.',
      'O auto recovery de instâncias exige que o service link esteja conectado.',
    ],
    recommendations: ['Use conexões redundantes e projete a aplicação para static stability: o que precisa rodar durante a desconexão já deve estar rodando.'],
    exam: { domains: ['d2'], relevance: 'baixa' },
    references: [OP_SL, OP_HA],
    tags: ['hibrido', 'disponibilidade'],
  },
  {
    id: 'edge.pop',
    title: 'Edge locations (POPs)',
    officialName: 'Edge locations / Points of presence (POPs)',
    serviceIds: ['aws.cloudfront', 'aws.route53'],
    summary: 'Locais da rede de borda da AWS, muito mais numerosos que as Regiões. No CloudFront, **POP e edge location são o mesmo papel**: o lugar que atende o usuário e guarda cópias em cache. A borda **não é uma Região nem uma AZ**: não roda a sua aplicação inteira.',
    explanation: [
      'O usuário raramente está perto de uma Região, mas quase sempre está perto de uma edge location. O CloudFront usa esses pontos para responder do lugar mais próximo: se o objeto está em cache, a resposta sai dali mesmo; se não, o POP o busca na origem pela rede da AWS. O Route 53 também responde às consultas DNS a partir da rede de borda.',
      'A borda serve para entregar e encaminhar, não para hospedar a aplicação inteira. Funções leves podem rodar ali ([[cdn.edge-functions|CloudFront Functions e Lambda@Edge]]), mas o banco, o estado e a lógica principal continuam numa Região.',
      '**Regra prática:** a Região é onde a aplicação mora; a edge location é onde ela encontra o usuário.',
    ],
    comparisons: [
      { with: 'edge.regional-edge-cache', text: 'O POP atende o usuário e guarda o conteúdo popular. O REC é uma camada de cache maior, entre os POPs e a origem, que segura o conteúdo menos procurado.' },
      { with: 'infra.region', text: 'A Região tem AZs e a gama completa de serviços, onde a aplicação roda. A edge location não substitui a Região.' },
    ],
    commonMistakes: ['Tratar edge location e POP como duas infraestruturas diferentes.', 'Achar que dá para "implantar a aplicação numa edge location" como numa Região.'],
    facts: ['Na documentação do CloudFront: "CloudFront points of presence (also known as POPs or edge locations)".', 'O DNS encaminha o usuário ao POP que melhor o atende, normalmente o de menor latência.'],
    exam: {
      domains: ['d3'],
      relevance: 'alta',
      notes: 'Pedidos de "reduzir a latência para usuários no mundo todo" com conteúdo que pode ficar em cache apontam para a rede de borda, por meio do CloudFront. Alternativas que falam em implantar o banco numa edge location, ou que tratam POP e edge location como infraestruturas diferentes, são distratores.',
    },
    references: [CF_HOW],
    tags: ['desempenho'],
  },
  {
    id: 'edge.regional-edge-cache',
    title: 'Regional Edge Cache',
    officialName: 'CloudFront regional edge caches',
    serviceIds: ['aws.cloudfront'],
    summary: 'Uma camada de cache **entre os POPs e a origem**, com cache maior. Quando o POP não tem o objeto, ele normalmente pergunta ao REC antes de ir à origem — bom para conteúdo que perdeu popularidade.',
    explanation: [
      'O REC é uma segunda camada de cache, maior e em menos lugares que os POPs. Quando um objeto perde popularidade, o POP pode descartá-lo para abrir espaço, mas ele continua no REC por mais tempo. Na próxima requisição, o POP o busca no REC, que fica mais perto que a origem. Isso faz parte do caminho normal do CloudFront e reduz as idas à origem.',
      'Exemplo: fotos de produtos de uma loja virtual são muito vistas no lançamento e pouco depois. Quando elas saem dos POPs, ainda são servidas pelo REC, sem uma nova leitura no bucket de origem a cada acesso.',
    ],
    comparisons: [
      { with: 'edge.pop', text: 'O POP é a primeira camada, perto do usuário, com o conteúdo mais popular. O REC é a segunda, com mais espaço, para o conteúdo que esfriou.' },
    ],
    facts: [
      'Métodos PUT, POST, PATCH, OPTIONS e DELETE e requisições dinâmicas vão do POP direto à origem, sem passar pelo REC.',
      'Se a origem é um bucket S3 na mesma Região do REC ideal, o POP vai direto ao bucket.',
      'Uma invalidação remove o objeto dos POPs e dos RECs.',
    ],
    exam: { domains: ['d3'], relevance: 'media' },
    references: [CF_HOW],
    tags: ['desempenho'],
  },
  {
    id: 'edge.cloudfront',
    title: 'Amazon CloudFront',
    officialName: 'Amazon CloudFront',
    serviceIds: ['aws.cloudfront'],
    summary: 'A CDN da AWS: entrega conteúdo a partir dos POPs, com cache. Na primeira requisição (miss), busca na origem (por exemplo, um bucket S3) e guarda a cópia; as seguintes voltam do cache até expirar o TTL.',
    explanation: [
      'Pense em bancas espalhadas pela cidade que guardam cópias do jornal: o leitor compra na esquina, e só quando a banca não tem a edição alguém vai buscá-la na gráfica. O limite da comparação: o CloudFront guarda a cópia por um tempo definido (TTL) e pode ser obrigado a descartá-la antes, com uma [[cdn.invalidation|invalidação]].',
      'Você cria uma distribuição, informa a origem (bucket S3, ALB, servidor HTTP) e define comportamentos por caminho: o que fica em cache, por quanto tempo e quais cabeçalhos, cookies e parâmetros chegam à origem. O DNS leva o usuário ao POP de menor latência. Além de reduzir a latência, o cache tira carga da origem e diminui o tráfego que sai dela.',
      'Exemplo: um site de notícias tem imagens e vídeos num bucket S3 e páginas geradas por instâncias atrás de um ALB. Uma distribuição com cache longo para `/media/*` e sem cache para `/api/*` atende leitores do mundo todo a partir dos POPs, e o bucket pode ficar privado com [[cdn.oac|origin access control]].',
      '**Regra prática:** conteúdo HTTP repetido para muitos usuários espalhados pede CloudFront; tráfego TCP ou UDP que não pode ficar em cache pede outra solução, como o Global Accelerator.',
    ],
    comparisons: [
      { with: 'edge.global-accelerator', text: 'O Global Accelerator dá dois IPs fixos e leva conexões TCP e UDP pela rede da AWS até o endpoint saudável, sem cache. O CloudFront guarda conteúdo HTTP e HTTPS em cache perto do usuário.' },
    ],
    commonMistakes: [
      'Achar que o CloudFront só serve conteúdo estático: ele também encaminha requisições dinâmicas para a origem, sem guardar a resposta.',
    ],
    facts: ['Assim que o primeiro byte chega da origem, o CloudFront começa a repassar o objeto ao usuário e o guarda no cache.'],
    recommendations: ['Defina comportamentos diferentes por caminho: cache longo para arquivos estáticos e nenhum cache para respostas personalizadas.'],
    exam: {
      domains: ['d3', 'd4'],
      relevance: 'alta',
      notes: 'O guia da SAA-C03 cita o CloudFront entre os serviços de borda e as estratégias de cache. Sinais: "usuários no mundo todo", "conteúdo estático ou mídia", "reduzir a carga na origem" ou "reduzir a latência de downloads". Para proteger o bucket de origem, a combinação esperada é CloudFront com origin access control e o bucket privado.',
    },
    references: [CF_HOW],
    tags: ['desempenho', 'custos'],
  },
  {
    id: 'edge.route53',
    title: 'Amazon Route 53',
    officialName: 'Amazon Route 53',
    serviceIds: ['aws.route53'],
    summary: 'DNS gerenciado com três funções: **registro de domínios**, **roteamento do tráfego** (inclusive por latência, geolocalização e failover) e **verificações de saúde**. O plano de dados roda em centenas de POPs.',
    explanation: [
      'O Route 53 traduz nomes em endereços, mas o que interessa à arquitetura é a decisão que ele toma ao responder. Com as [[dns.routing-policies|políticas de roteamento]], a mesma consulta pode receber respostas diferentes: o endpoint de menor latência para o usuário, o de um país específico, uma divisão por pesos ou o endpoint secundário quando o primário falha nas verificações de saúde.',
      'Como o plano de dados roda em centenas de POPs, as respostas continuam funcionando mesmo com problemas no plano de controle, que fica em us-east-1. Por isso um failover baseado em verificações de saúde já configuradas é mais confiável do que um plano que depende de alterar registros durante o incidente.',
      'Exemplo: uma aplicação roda em us-east-1 e tem uma cópia de espera em eu-west-1. Um registro com política de [[dns.failover|failover]] e verificação de saúde no endpoint principal faz o Route 53 responder com o endereço de eu-west-1 quando o principal deixa de responder.',
      '**Regra prática:** o Route 53 decide para onde o usuário vai antes de a conexão começar, e o cache de DNS dos clientes faz essa mudança levar algum tempo para chegar a todos.',
    ],
    comparisons: [
      { with: 'edge.global-accelerator', text: 'O Global Accelerator troca de endpoint sem depender do cache de DNS dos clientes, porque os IPs anycast não mudam. O Route 53 muda a resposta do DNS, e cada cliente só percebe quando o TTL expira.' },
    ],
    facts: ['O plano de controle do Route 53 público fica em us-east-1; as verificações de saúde rodam a partir de oito Regiões.'],
    exam: {
      domains: ['d2', 'd3'],
      relevance: 'alta',
      notes: 'Sinais: "failover entre Regiões com verificação de saúde" (política de failover), "levar o usuário à Região de menor latência" (latência), "conteúdo diferente por país" (geolocalização) e "enviar 10% do tráfego para a nova versão" (ponderada). Se o requisito é trocar de Região sem depender do cache de DNS, compare com o Global Accelerator.',
    },
    references: [R53_WHAT, FIB_GLOBAL],
    tags: ['disponibilidade', 'desempenho'],
  },
  {
    id: 'edge.global-accelerator',
    title: 'AWS Global Accelerator',
    officialName: 'AWS Global Accelerator',
    serviceIds: ['aws.global-accelerator'],
    summary: 'Dois **IPs estáticos anycast** que recebem o tráfego na borda e o levam pela **rede global da AWS** até o endpoint saudável mais adequado (ALB, NLB, EC2, Elastic IP), inclusive em outra Região. **Não faz cache.**',
    explanation: [
      'O cliente se conecta a um dos dois IPs anycast, anunciados a partir da borda da AWS; a conexão entra na rede da AWS no ponto mais próximo e segue por ela até o endpoint. O Global Accelerator encerra a conexão TCP na borda e abre outra com o endpoint, o que reduz a latência. Como os IPs não mudam, trocar o tráfego de Região não depende do cache de DNS dos clientes.',
      'Exemplo: um jogo online usa UDP e tem servidores atrás de NLBs em duas Regiões. Os jogadores se conectam aos dois IPs fixos do acelerador; se a Região principal fica indisponível, o tráfego passa para a outra sem que os jogadores mudem nada. Clientes corporativos que liberam IPs no firewall também se beneficiam, porque os IPs não mudam.',
      '**Regra prática:** cache de conteúdo HTTP pede CloudFront; IPs fixos, TCP ou UDP e failover rápido entre Regiões pedem Global Accelerator.',
    ],
    comparisons: [
      { with: 'edge.cloudfront', text: 'O CloudFront guarda conteúdo em cache (HTTP e HTTPS); o Global Accelerator encaminha conexões TCP e UDP sem cache, com IPs fixos e failover rápido entre Regiões.' },
      { with: 'edge.route53', text: 'O Route 53 muda a resposta do DNS para trocar de endpoint e depende do TTL. O Global Accelerator mantém os mesmos IPs e muda o destino na própria rede da AWS.' },
    ],
    exam: {
      domains: ['d2', 'd3'],
      relevance: 'media',
      notes: 'Sinais: "IPs estáticos", "liberar IPs no firewall do cliente", "tráfego UDP", "jogos ou VoIP" e "failover entre Regiões sem esperar o TTL do DNS". Se o enunciado fala em cache, conteúdo estático ou muitos objetos HTTP repetidos, a resposta é o CloudFront.',
    },
    references: [GA_WHAT],
    tags: ['desempenho', 'disponibilidade'],
  },
]
