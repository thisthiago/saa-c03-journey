/** Desafio final — Architecture Foundations (empresa fictícia: Pulso Fitness). */
import type { PhaseDef } from '../../../../../engine/types'
import type { ArchitectureLabConfig } from '../../../../../simulators/architecture/lab'

/** Opções AWS / Cliente / Compartilhado para as perguntas de responsabilidade. */
function owner(correct: 'aws' | 'cli' | 'shared', why: Record<'aws' | 'cli' | 'shared', string>, concepts: string[]) {
  const label = { aws: 'AWS', cli: 'Cliente (Pulso Fitness)', shared: 'Compartilhado' }
  return (['aws', 'cli', 'shared'] as const).map((id) => ({
    id,
    label: label[id],
    scores: { seguro: id === correct ? 1 : 0, operacao: id === correct ? 1 : 0.2 },
    consequence: why[id],
    concepts: id === correct ? undefined : concepts,
  }))
}

export const PULSO: ArchitectureLabConfig = {
  title: 'Relatório do Architecture Foundations',
  dimensions: [
    { id: 'seguro', label: 'Seguro', examDomain: 'd1' },
    { id: 'resiliente', label: 'Resiliente', examDomain: 'd2' },
    { id: 'desempenho', label: 'Alto desempenho', examDomain: 'd3' },
    { id: 'custo', label: 'Custo otimizado', examDomain: 'd4' },
    { id: 'requisitos', label: 'Atendimento aos requisitos' },
    { id: 'operacao', label: 'Operação e suporte' },
  ],
  minDimension: 0.5,
  groups: [{ id: 'responsabilidades', title: 'Responsabilidades atribuídas incorretamente' }],
  steps: [
    {
      id: 'regiao',
      title: 'Região e dados',
      intro: 'A **Pulso Fitness** oferece aulas de ginástica ao vivo e sob demanda num app. Os alunos estão no **Brasil (60%)**, no **México (25%)** e em **Portugal (15%)**. O contrato com as academias parceiras exige que **os dados pessoais e de saúde fiquem no Brasil**. A diretoria quer custo sob controle.',
      questions: [
        {
          id: 'regiao',
          prompt: 'Em que Região fica a aplicação principal (API e banco de dados)?',
          options: [
            { id: 'sa', label: 'South America (São Paulo) — sa-east-1', scores: { requisitos: 1, seguro: 1, custo: 1 }, consequence: 'Única Região AWS no Brasil (lista de 18/10/2026): atende ao contrato. O S3 Standard custa mais que em us-east-1, mas o requisito decide.', concepts: ['infra.region-selection', 'infra.data-residency'] },
            { id: 'use1', label: 'US East (N. Virginia) — us-east-1, a mais barata', scores: { requisitos: 0, seguro: 0.3, custo: 1 }, consequence: 'Mais barata, mas os dados pessoais sairiam do Brasil: viola o contrato.', whyNot: 'Preço não compensa um requisito rígido de localização dos dados.', concepts: ['infra.region-selection', 'infra.data-residency'] },
            { id: 'mx', label: 'Mexico (Central) — mx-central-1, perto dos alunos mexicanos', scores: { requisitos: 0, seguro: 0.3, custo: 0.8 }, consequence: 'Melhora a latência para 25% dos alunos e viola o contrato para todos.', whyNot: 'A proximidade de uma parte dos usuários não supera a exigência contratual.', concepts: ['infra.region-selection', 'infra.data-residency'] },
          ],
        },
      ],
    },
    {
      id: 'azs',
      title: 'Distribuição entre AZs',
      intro: 'A carga normal da API exige **6 instâncias**. O app **não pode parar** se uma Zona de Disponibilidade falhar. As instâncias chamam um gateway de pagamento externo pela internet.',
      questions: [
        {
          id: 'app',
          prompt: 'Como distribuir as instâncias da API?',
          options: [
            { id: 'nine', label: '9 instâncias em 3 AZs (3 por AZ), atrás de um ALB com as 3 AZs', scores: { resiliente: 1, desempenho: 1, custo: 1 }, consequence: 'Perder uma AZ ainda deixa 6 instâncias: static stability, sem depender do Auto Scaling durante a falha.', concepts: ['infra.static-stability', 'infra.multi-az'] },
            { id: 'six3', label: '6 instâncias em 3 AZs (2 por AZ)', scores: { resiliente: 0.6, desempenho: 0.6, custo: 1 }, consequence: 'Continua no ar sem uma AZ, mas com 4 de 6 instâncias: degradada até o Auto Scaling repor.', whyNot: 'Sobrevive, mas sem capacidade suficiente durante a falha.', concepts: ['infra.static-stability'] },
            { id: 'one', label: '6 instâncias numa única AZ', scores: { resiliente: 0, desempenho: 1, custo: 1 }, consequence: 'A queda da AZ tira o app do ar.', whyNot: 'A falha de uma AZ derruba tudo — viola o requisito.', concepts: ['infra.multi-az', 'infra.spof'] },
          ],
        },
        {
          id: 'banco',
          prompt: 'E o banco de dados (Amazon RDS)?',
          options: [
            { id: 'maz', label: 'RDS Multi-AZ', scores: { resiliente: 1, custo: 1 }, consequence: 'Standby síncrono em outra AZ com failover automático.', concepts: ['infra.rds-multi-az'] },
            { id: 'saz', label: 'RDS Single-AZ com backups diários', scores: { resiliente: 0.2, custo: 1 }, consequence: 'A queda da AZ do banco derruba o app até a restauração.', whyNot: 'Backups ajudam a recuperar dados, não a manter o app no ar durante a falha de uma AZ.', concepts: ['infra.rds-multi-az', 'infra.spof'] },
            { id: 'rr', label: 'Single-AZ com uma réplica de leitura para relatórios', scores: { resiliente: 0.4, custo: 0.8 }, consequence: 'A réplica ajuda a escalar leituras, mas o caminho de escrita continua dependente de uma AZ.', whyNot: 'Escala de leitura não é alta disponibilidade do primário.', concepts: ['infra.rds-multi-az'] },
          ],
        },
        {
          id: 'nat',
          prompt: 'Como as instâncias saem para a internet?',
          options: [
            { id: 'regional', label: 'NAT gateway regional (ou um NAT zonal por AZ)', scores: { resiliente: 1 }, consequence: 'A saída para a internet acompanha as AZs com workloads.', concepts: ['infra.nat-zonal-regional'] },
            { id: 'single', label: 'Um único NAT gateway zonal na AZ a', scores: { resiliente: 0.1 }, consequence: 'Se a AZ a cair, as instâncias de b e c perdem o gateway de pagamento.', whyNot: 'Vira o ponto único de falha da arquitetura "multi-AZ".', concepts: ['infra.nat-zonal-regional', 'infra.spof'] },
          ],
        },
      ],
    },
    {
      id: 'borda',
      title: 'Local Zone, Wavelength ou Outposts?',
      intro: 'As aulas são vídeo: alguns segundos de atraso na transmissão são aceitáveis (premissa do produto). Não há processamento nas academias nem requisito ligado à rede 5G.',
      questions: [
        {
          id: 'extensao',
          prompt: 'O projeto precisa de alguma dessas extensões da Região?',
          options: [
            { id: 'nenhuma', label: 'Nenhuma: a Região e a borda do CloudFront atendem aos requisitos', scores: { requisitos: 1, custo: 1, desempenho: 1 }, consequence: 'Sem custo e complexidade extras: nenhum requisito pede latência de um dígito, rede 5G ou processamento local.', concepts: ['infra.local-zones', 'infra.wavelength', 'infra.outposts'] },
            { id: 'lz', label: 'Uma Local Zone para as aulas ao vivo', scores: { requisitos: 0.6, custo: 0.4, desempenho: 1 }, consequence: 'Paga preços de Local Zone por uma latência que o requisito não exige.', whyNot: 'Local Zone é para latência de um dígito de ms numa metrópole; vídeo com segundos de tolerância não precisa.', concepts: ['infra.local-zones'] },
            { id: 'wl', label: 'Wavelength, para os alunos que usam o celular', scores: { requisitos: 0.4, custo: 0.3, desempenho: 0.8 }, consequence: 'Atenderia só quem estivesse na rede de uma operadora parceira, sem necessidade real.', whyNot: 'Wavelength resolve latência ultrabaixa na rede 5G de uma operadora — não é o caso.', concepts: ['infra.wavelength'] },
            { id: 'op', label: 'Outposts nas academias parceiras', scores: { requisitos: 0.2, custo: 0, desempenho: 0.8 }, consequence: 'Hardware em cada academia, segurança física por conta delas e dependência de service link — sem requisito que justifique.', whyNot: 'Outposts é para processamento que precisa ficar no local.', concepts: ['infra.outposts'] },
          ],
        },
      ],
    },
    {
      id: 'trafego',
      title: 'Como o tráfego chega',
      intro: 'Os alunos acessam o app pelo domínio **pulso.example**. Os vídeos ficam num bucket S3 em sa-east-1. Alunos em Portugal reclamam de lentidão nas chamadas da API (cerca de 250 ms, premissa do cenário).',
      questions: [
        {
          id: 'video',
          prompt: 'Como entregar os vídeos?',
          options: [
            { id: 'cf', label: 'Amazon CloudFront com o bucket como origem', scores: { desempenho: 1, custo: 1, seguro: 1 }, consequence: 'Os vídeos saem dos POPs perto dos alunos, e a origem só trabalha nos misses.', concepts: ['edge.cloudfront', 'edge.pop'] },
            { id: 'direto', label: 'Servir direto do bucket em sa-east-1', scores: { desempenho: 0.3, custo: 0.5, seguro: 0.8 }, consequence: 'Alunos do México e de Portugal buscam cada vídeo do outro lado do oceano.', whyNot: 'Conteúdo estático para usuários dispersos é o caso clássico de CDN.', concepts: ['edge.cloudfront'] },
            { id: 'ga', label: 'Global Accelerator na frente do bucket', scores: { desempenho: 0.5, custo: 0.5, seguro: 0.8 }, consequence: 'Melhora o caminho de rede, mas sem cache: cada exibição volta à origem.', whyNot: 'Global Accelerator não faz cache de conteúdo.', concepts: ['edge.global-accelerator'] },
          ],
        },
        {
          id: 'api',
          prompt: 'E a lentidão da API para Portugal?',
          options: [
            { id: 'ga', label: 'Global Accelerator na frente do ALB em sa-east-1', scores: { desempenho: 1, requisitos: 1, custo: 1 }, consequence: 'O tráfego entra na borda perto dos alunos e segue pela rede da AWS até São Paulo; os dados continuam no Brasil.', concepts: ['edge.global-accelerator'] },
            { id: 'copia', label: 'Uma cópia da API e do banco em eu-west-3 (Paris)', scores: { desempenho: 1, requisitos: 0, custo: 0.3 }, consequence: 'Resolve a latência copiando dados pessoais para fora do Brasil: viola o contrato.', whyNot: 'Requisito de localização dos dados elimina a cópia na Europa.', concepts: ['infra.data-residency', 'infra.no-auto-replication'] },
            { id: 'aceitar', label: 'Aceitar a latência atual', scores: { desempenho: 0.4, requisitos: 0.8, custo: 1 }, consequence: 'Custa nada, mas ignora a reclamação de 15% dos alunos.', whyNot: 'Há uma opção que melhora a latência sem violar requisitos.', concepts: ['edge.global-accelerator'] },
          ],
        },
        {
          id: 'dns',
          prompt: 'Quem resolve o domínio e verifica a saúde dos endpoints?',
          options: [
            { id: 'r53', label: 'Amazon Route 53 com verificações de saúde', scores: { resiliente: 1, operacao: 1 }, consequence: 'DNS gerenciado com plano de dados distribuído em centenas de POPs.', concepts: ['edge.route53'] },
            { id: 'proprio', label: 'Um servidor DNS próprio numa instância EC2', scores: { resiliente: 0.2, operacao: 0.3 }, consequence: 'Mais uma instância para manter — e um novo ponto único de falha.', whyNot: 'Substitui um serviço gerenciado e distribuído por um componente zonal.', concepts: ['edge.route53', 'infra.spof'] },
          ],
        },
      ],
    },
    {
      id: 'responsabilidades',
      title: 'Responsabilidades de segurança',
      intro: 'A auditoria das academias pede a matriz de responsabilidades. A API roda em **EC2**, o banco em **RDS**, os vídeos no **S3** com **CloudFront**.',
      questions: [
        {
          id: 'r-patch-ec2',
          group: 'responsabilidades',
          prompt: 'Patches do sistema operacional das instâncias EC2 da API',
          options: owner('cli', { aws: 'No EC2, o SO convidado não é da AWS.', cli: 'No EC2, o cliente gerencia o SO convidado e seus patches.', shared: 'Não há divisão aqui: o SO convidado do EC2 é do cliente.' }, ['srm.ec2']),
        },
        {
          id: 'r-fisica',
          group: 'responsabilidades',
          prompt: 'Segurança física dos data centers de sa-east-1',
          options: owner('aws', { aws: 'Controle físico e ambiental, herdado da AWS.', cli: 'O cliente não tem acesso nem responsabilidade sobre os data centers das Regiões.', shared: 'Nas Regiões, é inteiramente da AWS (diferente de um rack Outposts no local do cliente).' }, ['srm.aws-scope']),
        },
        {
          id: 'r-rds',
          group: 'responsabilidades',
          prompt: 'Atualizações de SO do RDS',
          options: owner('shared', { aws: 'A AWS executa, mas as opcionais esperam o cliente e ele escolhe a janela.', cli: 'O cliente não acessa o SO do RDS; a AWS executa as atualizações.', shared: 'A AWS executa; o cliente decide as opcionais e a janela de manutenção.' }, ['srm.rds']),
        },
        {
          id: 'r-bucket',
          group: 'responsabilidades',
          prompt: 'Garantir que o bucket de vídeos só seja lido via CloudFront',
          options: owner('cli', { aws: 'A AWS não decide quem pode ler seus objetos.', cli: 'Políticas de bucket e Block Public Access são configuração do cliente.', shared: 'Não há divisão: a política de acesso é do cliente.' }, ['srm.s3', 's3.block-public-access']),
        },
        {
          id: 'r-dados',
          group: 'responsabilidades',
          prompt: 'Classificar e criptografar os dados de saúde dos alunos',
          options: owner('cli', { aws: 'A AWS oferece criptografia, mas não decide o que é sensível nem como proteger.', cli: 'Dados, classificação e escolha da criptografia são sempre do cliente.', shared: 'Não há divisão: os dados são do cliente.' }, ['srm.customer-scope']),
        },
        {
          id: 'r-iam',
          group: 'responsabilidades',
          prompt: 'Permissões IAM da role das instâncias',
          options: owner('cli', { aws: 'A AWS não define as permissões das suas roles.', cli: 'Identidades e permissões são do cliente — com menor privilégio.', shared: 'Não há divisão: IAM é configuração do cliente.' }, ['srm.customer-scope', 'iam.least-privilege']),
        },
      ],
    },
    {
      id: 'suporte',
      title: 'Plano de suporte',
      intro: 'O app é crítico para o negócio. A equipe quer abrir casos técnicos a qualquer hora e ter **primeira resposta em menos de 30 minutos** se o sistema crítico cair. Não há necessidade de TAM nem de especialistas designados. Gasto com a AWS: cerca de **US$ 40 mil por mês** (premissa).',
      questions: [
        {
          id: 'plano',
          prompt: 'Qual plano de suporte?',
          options: [
            { id: 'bplus', label: 'Business Support+ (≈ US$ 3 mil/mês)', scores: { operacao: 1, custo: 1 }, consequence: 'Casos técnicos 24/7 e menos de 30 minutos para sistema crítico; 9% de 10 mil + 7% de 30 mil.', concepts: ['support.business-plus', 'support.pricing'] },
            { id: 'basic', label: 'Basic (incluído)', scores: { operacao: 0, custo: 1 }, consequence: 'Sem casos técnicos: numa pane, a equipe fica só com a documentação.', whyNot: 'Não atende ao requisito de casos técnicos.', concepts: ['support.basic'] },
            { id: 'ent', label: 'Enterprise Support (≈ US$ 5 mil/mês)', scores: { operacao: 1, custo: 0.5 }, consequence: 'Atende, com TAM e 15 minutos, por um preço maior — benefícios que o cenário não pede.', whyNot: 'Plano mais caro que atende é excesso, não acerto.', concepts: ['support.enterprise', 'support.plans'] },
            { id: 'uo', label: 'Unified Operations (≥ US$ 50 mil/mês)', scores: { operacao: 1, custo: 0 }, consequence: 'Mais que o gasto total com a AWS.', whyNot: 'Custo desproporcional à necessidade.', concepts: ['support.unified-ops', 'support.plans'] },
          ],
        },
        {
          id: 'sla',
          prompt: 'Com o plano contratado, o que garante a disponibilidade das instâncias?',
          options: [
            { id: 'arq', label: 'A arquitetura em várias AZs; o SLA do EC2 define o compromisso e os créditos', scores: { resiliente: 1, operacao: 1 }, consequence: 'O suporte ajuda a resolver; quem mantém o app no ar é a arquitetura.', concepts: ['support.sla-vs-support'] },
            { id: 'plano', label: 'O plano de suporte', scores: { resiliente: 0.2, operacao: 0.3 }, consequence: 'Nenhum plano aumenta a disponibilidade de um serviço.', whyNot: 'Plano de suporte define atendimento, não disponibilidade.', concepts: ['support.sla-vs-support'] },
          ],
        },
      ],
    },
    {
      id: 'riscos',
      title: 'Riscos aceitos',
      intro: 'Só existe uma Região AWS no Brasil. O contrato impede cópias dos dados pessoais fora do país.',
      questions: [
        {
          id: 'regional',
          prompt: 'Como tratar o risco de perder a Região sa-east-1 inteira?',
          options: [
            { id: 'aceitar', label: 'Documentar o risco regional aceito pela diretoria, com backups em outra conta na mesma Região e um plano de restauração testado', scores: { requisitos: 1, seguro: 1, operacao: 1 }, consequence: 'O risco é conhecido e assumido por quem decide; backups em outra conta protegem contra exclusões e contas comprometidas.', concepts: ['infra.ha-vs-dr', 'infra.no-auto-replication'] },
            { id: 'use1', label: 'Replicar o banco e os vídeos para us-east-1', scores: { requisitos: 0, resiliente: 1, operacao: 0.5 }, consequence: 'Cobre a perda da Região, mas leva dados pessoais para fora do Brasil.', whyNot: 'DR em outra Região é ótimo quando o contrato permite — aqui não permite.', concepts: ['infra.data-residency', 'infra.ha-vs-dr'] },
            { id: 'ignorar', label: 'Não fazer nada: três AZs já resolvem', scores: { requisitos: 0.5, resiliente: 0.3, operacao: 0.2 }, consequence: 'O risco existe, mas ninguém sabe que ele foi aceito.', whyNot: 'Várias AZs não protegem contra a perda da Região.', concepts: ['infra.ha-vs-dr'] },
          ],
        },
      ],
    },
    {
      id: 'revisao',
      title: 'Custos e limitações',
      intro: 'Antes de aprovar, o financeiro pergunta onde está o gasto que mais cresce com o uso.',
      questions: [
        {
          id: 'custo',
          prompt: 'Qual decisão reduz o custo sem quebrar nenhum requisito?',
          options: [
            { id: 'cache', label: 'Aumentar o TTL dos vídeos no CloudFront, já que eles não mudam depois de publicados', scores: { custo: 1, desempenho: 1 }, consequence: 'Menos idas à origem e menos transferência a partir de sa-east-1.', concepts: ['edge.cloudfront'] },
            { id: 'single', label: 'Voltar o banco para Single-AZ', scores: { custo: 1, resiliente: 0 }, consequence: 'Economiza o standby e recria o ponto único de falha.', whyNot: 'Viola o requisito de não parar com a queda de uma AZ.', concepts: ['infra.rds-multi-az'] },
            { id: 'regiao', label: 'Mover tudo para us-east-1, mais barata', scores: { custo: 1, requisitos: 0 }, consequence: 'Viola o contrato de localização dos dados.', whyNot: 'Requisito rígido não entra na negociação de custo.', concepts: ['infra.data-residency'] },
          ],
        },
      ],
    },
  ],
  rules: [
    {
      id: 'banco-spof',
      when: [['app', ['nine', 'six3']], ['banco', ['saz', 'rr']]],
      penalty: { resiliente: 0.2 },
      message: 'As instâncias estão em três AZs, mas o banco ficou numa só: ele é o ponto único de falha da arquitetura "multi-AZ".',
      concepts: ['infra.spof', 'infra.rds-multi-az'],
    },
    {
      id: 'nat-spof',
      when: [['app', ['nine', 'six3']], ['nat', ['single']]],
      penalty: { resiliente: 0.2 },
      message: 'Instâncias em três AZs dependem de um único NAT gateway zonal: a queda da AZ dele corta o gateway de pagamento de todas.',
      concepts: ['infra.nat-zonal-regional', 'infra.spof'],
    },
    {
      id: 'dr-fora',
      when: [['regiao', ['sa']], ['regional', ['use1']]],
      penalty: { seguro: 0.3 },
      message: 'A escolha de sa-east-1 respeitou o contrato, mas a replicação para us-east-1 leva os mesmos dados pessoais para fora do Brasil.',
      concepts: ['infra.data-residency'],
    },
    {
      id: 'suporte-sem-arquitetura',
      when: [['plano', ['ent', 'uo']], ['sla', ['plano']]],
      penalty: { custo: 0.1, resiliente: 0.1 },
      message: 'Um plano de suporte mais caro foi tratado como garantia de disponibilidade: o dinheiro foi para o lugar errado.',
      concepts: ['support.sla-vs-support'],
    },
  ],
  disclaimer: 'Este desafio é um exercício de aprendizagem: não reproduz questões oficiais nem garante aprovação no exame AWS Certified Solutions Architect – Associate. Os fatos sobre Regiões, serviços e planos foram conferidos em 18/10/2026.',
}

export const FINAL_FOUNDATIONS: PhaseDef = {
  id: 'fnd.final',
  order: 4,
  title: 'Architecture Foundations',
  subtitle: 'Infraestrutura, responsabilidade e suporte num só projeto',
  summary: 'Projete a arquitetura da Pulso Fitness em oito etapas e receba um relatório ligado aos domínios do SAA-C03.',
  glyph: 'trophy',
  color: '#ffe08a',
  requires: ['fnd.f01', 'fnd.f02', 'fnd.f03'],
  concepts: [
    'infra.region-selection',
    'infra.data-residency',
    'infra.no-auto-replication',
    'infra.multi-az',
    'infra.static-stability',
    'infra.spof',
    'infra.rds-multi-az',
    'infra.nat-zonal-regional',
    'infra.ha-vs-dr',
    'infra.local-zones',
    'infra.wavelength',
    'infra.outposts',
    'edge.cloudfront',
    'edge.pop',
    'edge.global-accelerator',
    'edge.route53',
    'srm.ec2',
    'srm.aws-scope',
    'srm.rds',
    'srm.s3',
    'srm.customer-scope',
    's3.block-public-access',
    'iam.least-privilege',
    'support.basic',
    'support.business-plus',
    'support.enterprise',
    'support.unified-ops',
    'support.plans',
    'support.pricing',
    'support.sla-vs-support',
  ],
  availability: 'available',
  estimatedMinutes: 40,
  map: { x: 750, y: 360 },
  simplifications: [
    'A rubrica e os pesos das dimensões são pedagógicos, definidos pelo AWS Quest.',
    'Latências e gasto mensal são premissas do cenário; preços e recursos foram conferidos em 18/10/2026.',
  ],
  missions: [
    {
      id: 'fnd.final.pulso',
      title: 'Projeto Pulso Fitness',
      type: 'final',
      summary: 'Oito etapas, decisões que se cruzam e um relatório com a rubrica.',
      passThreshold: 0.7,
      briefing: {
        company: 'Pulso Fitness',
        role: 'Você é responsável pela arquitetura do lançamento do app.',
        situation: 'Usuários no Brasil, no México e em Portugal; dados pessoais que precisam ficar no Brasil; aulas em vídeo; um app que não pode parar com a queda de uma AZ; e uma diretoria atenta ao custo.',
        objective: 'Decidir Região, distribuição entre AZs, borda, responsabilidades e suporte — e assumir conscientemente os riscos que sobram.',
        successCriteria: ['Nota geral de 70% ou mais', 'Pelo menos 50% em cada dimensão da rubrica'],
      },
      intel: [
        { conceptId: 'infra.region-selection', body: ['Requisitos rígidos primeiro (onde os dados podem ficar), depois latência e custo. Decisões de uma etapa afetam as outras: o relatório aponta os conflitos.'] },
        { conceptId: 'srm.customer-scope', body: ['Na etapa de responsabilidades, pense em **quem controla a camada** em cada serviço usado: EC2, RDS, S3 e CloudFront.'] },
      ],
      activities: [
        {
          id: 'fnd.final.pulso.a1',
          kind: 'lab',
          lab: 'architecture',
          title: 'Architecture Foundations',
          prompt: 'Percorra as oito etapas e envie o projeto para receber o relatório.',
          concepts: [
            { id: 'infra.region-selection' },
            { id: 'infra.multi-az' },
            { id: 'infra.ha-vs-dr' },
            { id: 'edge.cloudfront' },
            { id: 'srm.customer-scope' },
            { id: 'support.plans' },
          ],
          xp: 300,
          difficulty: 3,
          reviewWeakNow: true,
          hints: ['Só existe uma Região AWS no Brasil.', 'Procure o que ficou numa única AZ.'],
          explanation: [
            'Projeto de referência: sa-east-1; 9 instâncias em 3 AZs; RDS Multi-AZ; NAT regional; nenhuma extensão de borda de computação; CloudFront para vídeos; Global Accelerator para a API; Route 53; responsabilidades conforme o serviço; Business Support+; risco regional documentado; TTL longo para vídeos.',
            'Os conceitos ligados às decisões erradas entram na sua revisão imediatamente.',
          ],
          config: PULSO,
        },
      ],
      debrief: { takeaways: ['Requisitos rígidos mandam; latência e custo desempatam.', 'Multi-AZ exige que toda a cadeia seja redundante.', 'Suporte e SLA não substituem arquitetura.', 'Riscos que sobram devem ser aceitos conscientemente.'] },
    },
  ],
}
